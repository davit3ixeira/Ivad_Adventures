/**
 * battle.js — modelo de combate tático em grid (estilo Fire Emblem Heroes).
 *
 * A UI (ui/battle.js) cria a batalha com createBattle(run, node), lê os
 * ranges com computeMoveRange / attackTargets, pede previsões com forecast()
 * e executa jogadas com performAction(). O turno inimigo roda em runEnemyTurn().
 */
import { HEROES } from "../data/heroes.js";
import { ENEMIES, enemyStats } from "../data/enemies.js";
import { getChapter } from "../data/chapters.js";
import { makeRng } from "../core/rng.js";
import { reachable, manhattan, key } from "./pathfind.js";
import { affinityMultiplier, affinityState } from "./affinity.js";
import { planEnemyAction } from "./ai.js";
import { modList, relicTriggers } from "./run.js";

const GRID_W = 8;
const GRID_H = 6;
const MAGMA_DMG = 3;

// traços especiais dos inimigos, por id (ver data/enemies.js para o flavor)
const ENEMY_TRAITS = {
  huluhuluhu: { double: true }, // dança das sombras
  holoholoho: { openerBonus: 0.15 }, // aura flamejante
  hilihilihi: { bulwark: 0.25 }, // névoa de ilusões
  helehelehe: { bulwark: 0.25 }, // pele de ferro
  halahalaha: { double: true, openerBonus: 0.15 }, // reflexos sobrenaturais + ímpeto
  takimatida_sombrio: { double: true, omniCounter: true },
  korlok: { rage: 2 },
  haluhaluhu: { ignoreWheel: true, alwaysCounter: true, rage: 2 },
};

// --------------------------------------------------------------- construção
function weightedTerrain(r, weights) {
  const bag = [];
  for (const [t, w] of Object.entries(weights)) for (let i = 0; i < w; i++) bag.push(t);
  return r.pick(bag);
}

function buildGrid(chapter, r) {
  const tiles = Array.from({ length: GRID_H }, () => Array(GRID_W).fill("plain"));
  const features = r.int(7, 11);
  let walls = 0;
  for (let i = 0; i < features; i++) {
    const x = r.int(2, GRID_W - 3);
    const y = r.int(0, GRID_H - 1);
    const t = weightedTerrain(r, chapter.terrains);
    if (t === "wall" && walls >= 5) continue;
    if (t === "wall") walls++;
    tiles[y][x] = t;
  }
  return { w: GRID_W, h: GRID_H, tiles };
}

function enemyLineup(node, chapter, r) {
  const depth = node.row;
  const grunt = () => ENEMIES[r.pick(chapter.grunts)];

  if (node.type === "boss") {
    return [
      { def: ENEMIES[node.enemyId], role: "boss" },
      { def: grunt(), role: "add" },
      { def: grunt(), role: "add" },
    ];
  }
  if (node.type === "elite") {
    const adds = r.int(1, 2);
    return [
      { def: ENEMIES[node.enemyId], role: "elite" },
      ...Array.from({ length: adds }, () => ({ def: grunt(), role: "add" })),
    ];
  }
  const count = Math.min(5, 2 + Math.floor(depth / 4) + (chapter.id >= 3 ? 1 : 0));
  return Array.from({ length: count }, () => ({ def: grunt(), role: "add" }));
}

function aggregateAura() {
  const a = { dmgUp: 0, dmgReduction: 0, lifesteal: 0, wrathBonus: 0, execHeal: 0, healStart: 0 };
  for (const m of modList()) {
    a.dmgUp += m.dmgUp || 0;
    a.dmgReduction += m.dmgReduction || 0;
    a.lifesteal += m.lifesteal || 0;
    a.wrathBonus += m.wrathBonus || 0;
    a.execHeal += m.execHeal || 0;
    a.healStart = Math.max(a.healStart, m.healStart || 0);
  }
  a.dmgReduction = Math.min(0.65, a.dmgReduction);
  return a;
}

function effectiveAllyStats(u) {
  const s = { ...u.base };
  for (const m of modList()) {
    if (m.affin && m.affin !== u.aff) continue;
    s.atk += m.atkBonus || 0;
    s.def += m.defBonus || 0;
    s.spd += m.spdBonus || 0;
    s.mov += m.movBonus || 0;
    s.rng += m.rangeBonus || 0;
    s.maxHP += m.maxHpBonus || 0;
  }
  s.atk = Math.max(1, s.atk);
  s.def = Math.max(0, s.def);
  s.spd = Math.max(1, s.spd);
  s.mov = Math.max(1, s.mov);
  s.rng = Math.max(1, s.rng);
  return s;
}

function freeTilesInZone(grid, occupied, xs) {
  const out = [];
  for (const x of xs) {
    for (let y = 0; y < grid.h; y++) {
      if (grid.tiles[y][x] === "wall") continue;
      if (occupied.has(key(x, y))) continue;
      out.push({ x, y });
    }
  }
  return out;
}

export function createBattle(run, node) {
  const chapter = getChapter(run.chapter);
  const seed = (run.seed ^ (node.row * 73856093) ^ (node.col * 19349663)) >>> 0;
  const r = makeRng(seed);
  const grid = buildGrid(chapter, r);

  const aura = aggregateAura();
  const triggers = relicTriggers();

  const units = [];
  const occupied = new Set();

  const takeSpot = (pool, fallback) => {
    const s = pool.find((t) => !occupied.has(key(t.x, t.y))) || fallback;
    occupied.add(key(s.x, s.y));
    return s;
  };

  // ---- aliados (deploy automático nas 2 colunas da esquerda) ----
  const deployZone = r.shuffle(freeTilesInZone(grid, occupied, [0, 1]));
  run.squad
    .filter((u) => u.curHP > 0)
    .forEach((u, i) => {
      const eff = effectiveAllyStats(u);
      const spot = takeSpot(deployZone, { x: 0, y: i % grid.h });
      const startHP = Math.min(eff.maxHP, Math.round(u.curHP + aura.healStart * eff.maxHP));
      units.push({
        key: `A${i}`,
        uid: u.uid,
        team: "ally",
        name: u.name,
        emoji: u.emoji,
        aff: u.aff,
        role: u.role,
        x: spot.x,
        y: spot.y,
        maxHP: eff.maxHP,
        curHP: startHP,
        stats: { atk: eff.atk, def: eff.def, spd: eff.spd, mov: eff.mov, rng: eff.rng },
        skill: HEROES[u.id].skill?.effect ?? { type: "none" },
        traits: {},
        alive: true,
        acted: false,
        tookDamage: false,
      });
    });

  // ---- inimigos (metade direita) ----
  const lineup = enemyLineup(node, chapter, r);
  const enemyZone = r.shuffle(freeTilesInZone(grid, occupied, [GRID_W - 1, GRID_W - 2, GRID_W - 3]));
  lineup.forEach((slot, i) => {
    const st = enemyStats(slot.def, chapter.id, node.row);
    const spot =
      slot.role === "boss"
        ? (() => {
            const s = { x: GRID_W - 1, y: Math.floor(grid.h / 2) };
            occupied.add(key(s.x, s.y));
            return s;
          })()
        : takeSpot(enemyZone, { x: GRID_W - 1, y: i % grid.h });
    units.push({
      key: `E${i}`,
      team: "enemy",
      enemyId: slot.def.id,
      name: slot.def.name,
      emoji: slot.def.emoji,
      aff: slot.def.aff,
      kind: slot.def.kind,
      side: slot.role === "boss" ? "boss" : "enemy",
      ai: slot.def.ai,
      x: spot.x,
      y: spot.y,
      maxHP: st.maxHP,
      curHP: st.maxHP,
      stats: { atk: st.atk, def: st.def, spd: st.spd, mov: st.mov, rng: st.rng },
      skill: { type: "none" },
      traits: { ...(ENEMY_TRAITS[slot.def.id] || {}) },
      alive: true,
      acted: false,
      tookDamage: false,
    });
  });

  return {
    node,
    chapter,
    grid,
    units,
    aura,
    turn: 1,
    phase: "player",
    log: [`Batalha iniciada — ${node.type === "boss" ? "CHEFE" : node.type === "elite" ? "ELITE" : "confronto"}.`],
    floaters: [],
    firstHitPending: triggers.some((t) => t.trigger === "firstHitDouble"),
    cheatDeathReady: triggers.some((t) => t.trigger === "cheatDeath"),
    over: null, // 'win' | 'loss'
  };
}

// --------------------------------------------------------------- consultas
export const affinityInfo = affinityState;

export function unitAt(battle, x, y) {
  return battle.units.find((u) => u.alive && u.x === x && u.y === y) || null;
}

export function enemyOccupies(battle, self, x, y) {
  return battle.units.some((u) => u.alive && u.team !== self.team && u.x === x && u.y === y);
}

function anyoneElseAt(battle, self, x, y) {
  return battle.units.some((u) => u.alive && u.key !== self.key && u.x === x && u.y === y);
}

/** Map<"x,y",custo> das casas onde a unidade pode terminar o movimento. */
export function computeMoveRange(battle, unit) {
  const dist = reachable(battle.grid, unit, unit.stats.mov, (x, y) => enemyOccupies(battle, unit, x, y));
  const out = new Map();
  for (const [k, c] of dist) {
    const [x, y] = k.split(",").map(Number);
    if (!anyoneElseAt(battle, unit, x, y)) out.set(k, c);
  }
  out.set(key(unit.x, unit.y), 0);
  return out;
}

/** Alvos válidos a partir de uma casa: inimigos para atacar e, se curandeiro,
 *  aliados feridos para curar. */
export function attackTargets(battle, unit, fromTile) {
  const from = fromTile || unit;
  const isHealer = unit.skill?.type === "healer";
  return battle.units.filter((u) => {
    if (!u.alive || u.key === unit.key) return false;
    const d = Math.abs(u.x - from.x) + Math.abs(u.y - from.y);
    if (d < 1 || d > unit.stats.rng) return false;
    if (u.team !== unit.team) return true; // inimigo → ataque
    return isHealer && u.curHP < u.maxHP; // aliado ferido → cura
  });
}

export function allMoveTilesWithTargets(battle, unit) {
  const range = computeMoveRange(battle, unit);
  const attackable = new Set();
  for (const k of range.keys()) {
    const [x, y] = k.split(",").map(Number);
    for (const t of attackTargets(battle, unit, { x, y })) attackable.add(k);
  }
  return { range, attackFromTiles: attackable };
}

// --------------------------------------------------------------- combate
function cloneForSim(battle) {
  return {
    ...battle,
    units: battle.units.map((u) => ({ ...u, stats: { ...u.stats }, skill: { ...u.skill }, traits: { ...u.traits } })),
    log: [],
    floaters: [],
  };
}

function terrainDefBonus(type) {
  if (type === "forest") return 3;
  if (type === "ruin") return 1;
  return 0;
}

function strike(battle, src, tgt, ctx) {
  if (!src.alive || !tgt.alive) return;

  const srcAura = src.team === "ally" ? battle.aura : {};
  const tgtAura = tgt.team === "ally" ? battle.aura : {};

  const mult = affinityMultiplier(src.aff, tgt.aff, tgt.traits?.ignoreWheel);

  let tgtDef = tgt.stats.def + terrainDefBonus(battle.grid.tiles[tgt.y][tgt.x]);
  if (src.skill?.type === "pierce") tgtDef -= src.skill.flat || 0;
  if (src.traits?.pierce) tgtDef -= src.traits.pierce;
  tgtDef = Math.max(0, tgtDef);

  let dmg = Math.max(1, Math.round(src.stats.atk * mult) - tgtDef);

  // multiplicadores ofensivos
  let bonus = 1 + (srcAura.dmgUp || 0);
  if ((srcAura.wrathBonus || 0) && src.curHP / src.maxHP < 0.5) bonus += srcAura.wrathBonus;
  if (src.skill?.type === "wrath" && src.curHP / src.maxHP < 0.5) bonus += src.skill.pct;
  if (src.skill?.type === "opener" && ctx.initiating && ctx.firstOfCombat && !src.tookDamage) bonus += src.skill.pct;
  if (src.traits?.openerBonus && ctx.initiating && ctx.firstOfCombat) bonus += src.traits.openerBonus;
  if (src.skill?.type === "safeShot" && ctx.initiating && manhattan(src, tgt) > tgt.stats.rng) bonus += src.skill.pct;
  if (src.skill?.type === "riposte" && !ctx.initiating) bonus += src.skill.pct; // Kão-Woji: reflete com o dobro da força
  if (src.skill?.type === "packHunt") {
    const adj = battle.units.filter(
      (u) => u.alive && u.team === src.team && u.key !== src.key && manhattan(u, tgt) === 1
    ).length;
    bonus += (src.skill.pct || 0) * adj;
  }
  dmg = Math.round(dmg * bonus);

  // primeiro golpe dobrado (Fragmento do Olho do Caos)
  let crit = false;
  if (battle.firstHitPending && src.team === "ally" && ctx.initiating && ctx.firstOfCombat) {
    dmg *= 2;
    crit = true;
    battle.firstHitPending = false;
  }

  // redução defensiva
  let reduce = tgtAura.dmgReduction || 0;
  if (tgt.skill?.type === "bulwark") reduce += tgt.skill.pct;
  if (tgt.traits?.bulwark) reduce += tgt.traits.bulwark;
  reduce = Math.min(0.75, reduce);
  dmg = Math.max(1, Math.round(dmg * (1 - reduce)));

  tgt.curHP -= dmg;
  tgt.tookDamage = true;
  battle.floaters.push({ x: tgt.x, y: tgt.y, text: `-${dmg}`, kind: crit ? "crit" : "dmg" });
  battle.log.push(
    `${src.name} → ${tgt.name}: ${dmg} de dano${mult > 1 ? " (vantagem!)" : mult < 1 ? " (resistido)" : ""}.`
  );

  // roubo de vida (aura + Soco da Natureza de Xing Zang)
  let ls = srcAura.lifesteal || 0;
  if (src.skill?.type === "naturePunch") ls += src.skill.pct || 0;
  if (ls && src.alive) {
    const heal = Math.round(dmg * ls);
    if (heal > 0) {
      src.curHP = Math.min(src.maxHP, src.curHP + heal);
      battle.floaters.push({ x: src.x, y: src.y, text: `+${heal}`, kind: "heal" });
    }
  }

  if (tgt.curHP <= 0) {
    if (tgt.team === "ally" && battle.cheatDeathReady) {
      tgt.curHP = 1;
      battle.cheatDeathReady = false;
      battle.log.push(`✦ ${tgt.name} resiste com 1 de HP! (Amuleto de Ariexiet)`);
    } else {
      tgt.curHP = 0;
      tgt.alive = false;
      battle.log.push(`☠️ ${tgt.name} caiu.`);
      if (tgt.team === "enemy" && (battle.aura.execHeal || 0) > 0) {
        battle.units
          .filter((u) => u.alive && u.team === "ally")
          .forEach((a) => {
            a.curHP = Math.min(a.maxHP, a.curHP + battle.aura.execHeal);
            battle.floaters.push({ x: a.x, y: a.y, text: `+${battle.aura.execHeal}`, kind: "heal" });
          });
      }
    }
  }
}

function canCounter(atk, def) {
  if (!def.alive || !atk.alive) return false;
  if (def.traits?.omniCounter || def.traits?.alwaysCounter) return true;
  return manhattan(atk, def) <= def.stats.rng;
}

export function resolveCombat(battle, atk, def) {
  battle.floaters = [];
  const from = battle.log.length;

  strike(battle, atk, def, { initiating: true, firstOfCombat: true });

  if (canCounter(atk, def)) strike(battle, def, atk, { initiating: false, firstOfCombat: false });

  const atkThresh = atk.skill?.type === "swift" ? atk.skill.threshold : 5;
  const defThresh = def.skill?.type === "swift" ? def.skill.threshold : 5;

  if (atk.alive && def.alive && (atk.stats.spd - def.stats.spd >= atkThresh || atk.traits?.double)) {
    strike(battle, atk, def, { initiating: true, firstOfCombat: false });
  }
  if (atk.alive && def.alive && canCounter(atk, def) && (def.stats.spd - atk.stats.spd >= defThresh || def.traits?.double)) {
    strike(battle, def, atk, { initiating: false, firstOfCombat: false });
  }

  updateOutcome(battle);
  return battle.log.slice(from);
}

export function resolveHeal(battle, healer, target) {
  const amt = (healer.skill.flat || 12) + Math.round(healer.stats.atk * 0.6);
  const before = target.curHP;
  target.curHP = Math.min(target.maxHP, target.curHP + amt);
  battle.floaters = [{ x: target.x, y: target.y, text: `+${target.curHP - before}`, kind: "heal" }];
  battle.log.push(`${healer.name} cura ${target.name} (+${target.curHP - before}).`);
}

/** Previsão de combate sem alterar o estado real. */
export function forecast(battle, atkKey, defKey, fromTile) {
  const sim = cloneForSim(battle);
  const atk = sim.units.find((u) => u.key === atkKey);
  const def = sim.units.find((u) => u.key === defKey);
  if (!atk || !def) return null;
  if (fromTile) {
    atk.x = fromTile.x;
    atk.y = fromTile.y;
  }
  const atkHP0 = atk.curHP;
  const defHP0 = def.curHP;
  resolveCombat(sim, atk, def);
  return {
    aff: affinityState(atk.aff, def.aff),
    defFrom: defHP0,
    defTo: Math.max(0, def.curHP),
    defMax: def.maxHP,
    atkFrom: atkHP0,
    atkTo: Math.max(0, atk.curHP),
    atkMax: atk.maxHP,
    kills: !def.alive,
    dies: !atk.alive,
  };
}

// --------------------------------------------------------------- jogadas
function tickTerrain(battle, unit) {
  if (!unit.alive) return;
  if (battle.grid.tiles[unit.y][unit.x] === "magma") {
    const d = Math.min(MAGMA_DMG, Math.max(0, unit.curHP - 1));
    if (d > 0) {
      unit.curHP -= d;
      battle.floaters.push({ x: unit.x, y: unit.y, text: `-${d}`, kind: "dmg" });
      battle.log.push(`${unit.name} se queima no magma (${d}).`);
    }
  }
}

function updateOutcome(battle) {
  const allies = battle.units.some((u) => u.alive && u.team === "ally");
  const enemies = battle.units.some((u) => u.alive && u.team === "enemy");
  if (!enemies) battle.over = "win";
  else if (!allies) battle.over = "loss";
}

/**
 * Executa a jogada de um herói.
 * @param action { moveTo?:{x,y}, mode?:'attack'|'heal'|'wait', targetKey?:string }
 */
export function performAction(battle, unit, action) {
  if (unit.acted || unit.team !== "ally" || battle.phase !== "player") return [];
  const log0 = battle.log.length;
  battle.floaters = [];

  if (action.moveTo) {
    const range = computeMoveRange(battle, unit);
    if (range.has(key(action.moveTo.x, action.moveTo.y))) {
      unit.x = action.moveTo.x;
      unit.y = action.moveTo.y;
    }
  }

  if (action.mode === "attack" && action.targetKey) {
    const target = battle.units.find((u) => u.key === action.targetKey);
    if (target?.alive) resolveCombat(battle, unit, target);
  } else if (action.mode === "heal" && action.targetKey) {
    const target = battle.units.find((u) => u.key === action.targetKey);
    if (target?.alive) resolveHeal(battle, unit, target);
  }

  tickTerrain(battle, unit);
  unit.acted = true;
  updateOutcome(battle);

  if (battle.phase === "player" && battle.units.filter((u) => u.alive && u.team === "ally").every((u) => u.acted)) {
    battle.autoEndHint = true;
  }
  return battle.log.slice(log0);
}

export function endPlayerTurn(battle) {
  battle.units.forEach((u) => {
    if (u.team === "ally") u.acted = true;
  });
}

/** Turno inimigo. hooks: { render(), sleep(ms), afterCombat() } */
export async function runEnemyTurn(battle, hooks) {
  battle.phase = "enemy";
  battle.autoEndHint = false;
  hooks.render();
  await hooks.sleep(320);

  // efeitos de início de turno inimigo
  for (const e of battle.units.filter((u) => u.alive && u.team === "enemy")) {
    if (e.traits?.rage) {
      e.stats.atk += e.traits.rage;
      battle.log.push(`${e.name} acumula poder do Caos (+${e.traits.rage} ATK).`);
    }
  }

  for (const e of battle.units.filter((u) => u.team === "enemy")) {
    if (!e.alive || battle.over) continue;
    const plan = planEnemyAction(battle, e);

    if (plan.moveTo && (plan.moveTo.x !== e.x || plan.moveTo.y !== e.y)) {
      e.x = plan.moveTo.x;
      e.y = plan.moveTo.y;
      hooks.render();
      await hooks.sleep(200);
    }

    if (plan.targetKey) {
      const target = battle.units.find((u) => u.key === plan.targetKey);
      if (target?.alive) {
        battle.floaters = [];
        resolveCombat(battle, e, target);
        hooks.render();
        hooks.afterCombat?.();
        await hooks.sleep(460);
      }
    }

    tickTerrain(battle, e);
    if (battle.over) break;
  }

  battle.turn += 1;
  battle.units.forEach((u) => {
    if (u.team === "ally" && u.alive) u.acted = false;
  });
  battle.phase = battle.over ? "over" : "player";
  updateOutcome(battle);
  battle.floaters = [];
  hooks.render();
  return battle.over;
}

export function battleSnapshotHP(battle) {
  return battle.units.filter((u) => u.team === "ally");
}
