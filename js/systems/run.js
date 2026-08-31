/**
 * run.js — controlador da run roguelike: mapa, esquadrão, moedas,
 * relíquias, upgrades e eventos.
 */
import { state } from "../core/state.js";
import { bus } from "../core/bus.js";
import { rng } from "../core/rng.js";
import { generateMap } from "./mapgen.js";
import { HEROES, heroStats } from "../data/heroes.js";
import { getChapter } from "../data/chapters.js";
import { RELICS, RELICS_BY_ID } from "../data/relics.js";
import { UPGRADES, UPGRADES_BY_ID } from "../data/upgrades.js";

const clampHP = (u) => (u.curHP = Math.max(0, Math.min(u.base.maxHP, Math.round(u.curHP))));

/** Cria a run e persiste. */
export function startRun(chapterId) {
  const roster = state.squadEntries();
  if (roster.length === 0) return { error: "sem-esquadrao" };

  const seed = (Math.random() * 2 ** 32) >>> 0;
  const map = generateMap(chapterId, seed);

  const squad = roster.map((e) => {
    const s = heroStats(e);
    const def = HEROES[e.id];
    return {
      uid: e.uid,
      id: e.id,
      name: def.name,
      emoji: def.emoji,
      types: def.types || ["fisico"],
      role: def.role,
      lvl: e.level,
      base: { maxHP: s.maxHP, atk: s.atk, def: s.def, spd: s.spd, mov: s.mov, rng: s.rng },
      curHP: s.maxHP,
    };
  });

  const run = {
    chapter: chapterId,
    seed,
    map,
    currentId: map.startId,
    squad,
    fragmentos: 0,
    relics: [],
    upgrades: [],
    battlesWon: 0,
    shopStock: null,
    pendingEvent: null,
    startedAt: Date.now(),
  };
  map.nodes[map.startId].cleared = true;

  state.setRun(run);
  bus.emit("run:started", run);
  return { run };
}

export function abandonRun() {
  state.clearRun();
  bus.emit("run:ended", { victory: false, abandoned: true });
}

// ------------------------------------------------------------ navegação
export function currentNode() {
  return state.run?.map.nodes[state.run.currentId] ?? null;
}

export function optionsFrom() {
  const run = state.run;
  if (!run) return [];
  return currentNode().next.map((id) => run.map.nodes[id]);
}

export function travelTo(nodeId) {
  const run = state.run;
  const node = run.map.nodes[nodeId];
  if (!node || !currentNode().next.includes(nodeId)) return null;
  run.currentId = nodeId;
  state.persist();
  bus.emit("run:moved", node);
  return node;
}

export function clearNode(nodeId) {
  const run = state.run;
  if (run?.map.nodes[nodeId]) {
    run.map.nodes[nodeId].cleared = true;
    state.persist();
  }
}

// ------------------------------------------------------------ modificadores
/** Lista plana de mods (upgrades + relíquias) lida por battle.js. */
export function modList() {
  const run = state.run;
  if (!run) return [];
  return [
    ...run.upgrades.map((id) => UPGRADES_BY_ID[id]?.mod).filter(Boolean),
    ...run.relics.map((id) => RELICS_BY_ID[id]?.mod).filter(Boolean),
  ];
}

/** Gatilhos especiais das relíquias ativas. */
export function relicTriggers() {
  const run = state.run;
  if (!run) return [];
  return run.relics
    .map((id) => RELICS_BY_ID[id])
    .filter((r) => r?.trigger)
    .map((r) => ({ id: r.id, trigger: r.trigger, value: r.triggerValue ?? 0 }));
}

// ------------------------------------------------------------ recompensas
export function addUpgrade(id) {
  if (UPGRADES_BY_ID[id]) {
    state.run.upgrades.push(id);
    state.persist();
    bus.emit("run:changed");
  }
}

export function grantRandomUpgradeChoices(n = 3) {
  return rng.sample(UPGRADES, n);
}

export function addRelic(id) {
  const relicId = id ?? pickRelicForRun();
  if (!relicId) return null;
  state.run.relics.push(relicId);
  state.persist();
  bus.emit("run:changed");
  return RELICS_BY_ID[relicId];
}

function pickRelicForRun() {
  const owned = new Set(state.run.relics);
  const pool = RELICS.filter((r) => !owned.has(r.id));
  return (pool.length ? rng.pick(pool) : rng.pick(RELICS)).id;
}

export function addFragmentos(n) {
  state.run.fragmentos = Math.max(0, state.run.fragmentos + n);
  state.persist();
  bus.emit("run:changed");
}

export function healSquad(pct) {
  state.run.squad.forEach((u) => {
    if (u.curHP > 0) {
      u.curHP += pct * u.base.maxHP;
      clampHP(u);
    }
  });
  state.persist();
  bus.emit("run:changed");
}

export function damageSquad(pct) {
  state.run.squad.forEach((u) => {
    if (u.curHP > 0) {
      u.curHP = Math.max(1, u.curHP - pct * u.base.maxHP);
      clampHP(u);
    }
  });
  state.persist();
  bus.emit("run:changed");
}

export function reviveSquad() {
  state.run.squad.forEach((u) => (u.curHP = u.base.maxHP));
  state.persist();
  bus.emit("run:changed");
}

export function bumpMaxHP(n) {
  state.run.squad.forEach((u) => {
    u.base.maxHP = Math.max(10, u.base.maxHP + n);
    if (n > 0) u.curHP += n;
    clampHP(u);
  });
  state.persist();
  bus.emit("run:changed");
}

export function squadWipedOut() {
  return state.run.squad.every((u) => u.curHP <= 0);
}

// ------------------------------------------------------------ eventos
/**
 * Aplica os efeitos de uma escolha de evento.
 * @returns {{ needsUpgrade:boolean, lines:string[] }}
 */
export function applyEventEffects(effects = []) {
  const lines = [];
  let needsUpgrade = false;

  for (const e of effects) {
    switch (e.t) {
      case "sementes":
        state.addSementes(e.n);
        lines.push(`${e.n >= 0 ? "+" : ""}${e.n} 🌱 Sementes Primordiais`);
        break;
      case "fragmentos":
        addFragmentos(e.n);
        lines.push(`${e.n >= 0 ? "+" : ""}${e.n} 🔥 Fragmentos de Magma`);
        break;
      case "healPct":
        healSquad(e.n);
        lines.push(`Esquadrão curado em ${Math.round(e.n * 100)}%`);
        break;
      case "damagePct":
        damageSquad(e.n);
        lines.push(`Esquadrão sofreu ${Math.round(e.n * 100)}% de dano`);
        break;
      case "maxHp":
        bumpMaxHP(e.n);
        lines.push(`${e.n >= 0 ? "+" : ""}${e.n} de HP máximo`);
        break;
      case "reviveAll":
        reviveSquad();
        lines.push("Esquadrão totalmente restaurado");
        break;
      case "relic": {
        const r = addRelic(e.id);
        if (r) lines.push(`Relíquia obtida: ${r.emoji} ${r.name}`);
        break;
      }
      case "relicId": {
        const r = addRelic(e.id);
        if (r) lines.push(`Relíquia obtida: ${r.emoji} ${r.name}`);
        break;
      }
      case "upgrade":
        needsUpgrade = true;
        break;
      case "gamble": {
        if (rng.chance(0.5)) {
          const r = addRelic();
          healSquad(0.25);
          lines.push(`Sorte! ${r.emoji} ${r.name} + cura`);
        } else {
          damageSquad(0.3);
          addFragmentos(-10);
          lines.push("Azar... dano pesado e Fragmentos perdidos");
        }
        break;
      }
    }
  }
  return { needsUpgrade, lines };
}

// ------------------------------------------------------------ fim de batalha
export function recordBattleWin(node) {
  const run = state.run;
  run.battlesWon += 1;

  // sincroniza HP da run com o resultado da batalha (feito em battle.js)
  const chapter = getChapter(run.chapter);
  const isElite = node.type === "elite";
  const isBoss = node.type === "boss";

  const baseSem = isBoss ? chapter.reward.sementes : isElite ? 6 : 3;
  const frag = isBoss ? 40 : isElite ? 22 : rng.int(8, 14);

  state.addSementes(baseSem);
  addFragmentos(frag);

  // Semente Rachada e afins
  relicTriggers()
    .filter((t) => t.trigger === "bountyOnWin")
    .forEach((t) => state.addSementes(t.value));

  // XP no roster (permanente)
  const xp = isBoss ? 320 : isElite ? 150 : 90;
  run.squad.forEach((u) => {
    if (u.curHP > 0) state.awardHeroXp(u.uid, xp);
    else state.awardHeroXp(u.uid, Math.round(xp * 0.4));
  });

  clearNode(node.id);

  const rewards = { sementes: baseSem, fragmentos: frag, relic: null };
  if (isBoss || isElite || rng.chance(0.18)) {
    rewards.relic = addRelic();
  }

  if (isBoss) {
    state.meta.runsWon += 1;
    state.unlockChapter(run.chapter + 1);
  }
  state.persist();
  bus.emit("run:changed");
  return { rewards, isBoss, chapter };
}

export function endRunVictory() {
  const chapter = getChapter(state.run.chapter);
  state.clearRun();
  bus.emit("run:ended", { victory: true, chapter });
}

export function endRunDefeat() {
  state.clearRun();
  bus.emit("run:ended", { victory: false });
}

/** Sincroniza o HP pós-batalha de volta na run. */
export function syncSquadHP(battleUnits) {
  const byUid = new Map(battleUnits.map((u) => [u.uid, u]));
  state.run.squad.forEach((u) => {
    const bu = byUid.get(u.uid);
    if (bu) {
      u.curHP = bu.alive ? Math.max(1, Math.round(bu.curHP)) : 0;
    }
  });
  state.persist();
}

// ------------------------------------------------------------ loja
export function rollShop() {
  if (state.run.shopStock) return state.run.shopStock;
  const relic = RELICS_BY_ID[pickRelicForRun()];
  const upg = rng.pick(UPGRADES);
  state.run.shopStock = [
    { key: "heal", emoji: "🧪", name: "Elixir de Mácula", desc: "Cura 60% do HP do esquadrão", price: 18, sold: false },
    { key: "revive", emoji: "💞", name: "Incenso do Dojo", desc: "Reergue e cura todos por completo", price: 40, sold: false },
    { key: "maxhp", emoji: "🌱", name: "Broto Primordial", desc: "+10 de HP máximo permanente", price: 30, sold: false },
    { key: "relic", emoji: relic.emoji, name: relic.name, desc: relic.text, price: 46, sold: false, relicId: relic.id },
    { key: "upgrade", emoji: upg.emoji, name: upg.name, desc: upg.text, price: 34, sold: false, upgradeId: upg.id },
  ];
  state.persist();
  return state.run.shopStock;
}

export function buyShopItem(index) {
  const item = state.run.shopStock?.[index];
  if (!item || item.sold || state.run.fragmentos < item.price) return { error: true };
  addFragmentos(-item.price);
  item.sold = true;

  switch (item.key) {
    case "heal": healSquad(0.6); break;
    case "revive": reviveSquad(); break;
    case "maxhp": bumpMaxHP(10); break;
    case "relic": addRelic(item.relicId); break;
    case "upgrade": addUpgrade(item.upgradeId); break;
  }
  state.persist();
  bus.emit("run:changed");
  return { item };
}
