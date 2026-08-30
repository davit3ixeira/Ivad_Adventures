/**
 * ai.js — decisão dos inimigos no combate tático.
 * Comportamentos: rusher (cola e bate), kiter (bate de longe e recua),
 * guard (segura posição), boss_* (agressivo, herda um dos base).
 */
import { reachable, pathTo } from "./pathfind.js";
import { affinityMultiplier } from "./affinity.js";

const BOSS_BASE = { boss_taki: "kiter", boss_korlok: "rusher", boss_king: "rusher" };

const md = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

function quickDamage(src, tgt) {
  const mult = affinityMultiplier(src.aff, tgt.aff, tgt.traits?.ignoreWheel);
  return Math.max(1, Math.round(src.stats.atk * mult) - tgt.stats.def);
}

function affinityBias(a, b) {
  const m = affinityMultiplier(a, b);
  return m > 1 ? 1 : m < 1 ? -1 : 0;
}

function occupied(battle, self, x, y) {
  return battle.units.some((u) => u.alive && u.key !== self.key && u.x === x && u.y === y);
}

function standableTiles(battle, e) {
  const reach = reachable(battle.grid, e, e.stats.mov, (x, y) => occupied(battle, e, x, y));
  const tiles = [];
  for (const [k, cost] of reach) {
    const [x, y] = k.split(",").map(Number);
    if (!occupied(battle, e, x, y)) tiles.push({ x, y, cost });
  }
  if (!tiles.some((t) => t.x === e.x && t.y === e.y)) tiles.push({ x: e.x, y: e.y, cost: 0 });
  return tiles;
}

function nearestFoe(battle, e, foes) {
  let best = foes[0];
  let bestLen = Infinity;
  for (const foe of foes) {
    const path = pathTo(battle.grid, e, foe, (x, y) => occupied(battle, e, x, y));
    const len = path ? path.length : md(e, foe) + 20;
    if (len < bestLen) {
      bestLen = len;
      best = foe;
    }
  }
  return best;
}

function attackScore(e, foe, dist, behavior, battle) {
  const dmg = quickDamage(e, foe);
  let s = dmg * 2;
  if (dmg >= foe.curHP) s += 1000; // abate provável
  s += (1 - foe.curHP / foe.maxHP) * 120; // foca feridos
  s += affinityBias(e.aff, foe.aff) * 25;

  const foeCanCounter = dist <= foe.stats.rng;
  if (behavior === "kiter") {
    s += dist * 10;
    if (foeCanCounter) s -= 45;
  } else if (behavior === "guard") {
    if (foeCanCounter) s -= 12;
  } else {
    s -= dist * 4;
  }
  return s;
}

export function planEnemyAction(battle, e) {
  const foes = battle.units.filter((u) => u.alive && u.team === "ally");
  if (!foes.length) return { moveTo: null, targetKey: null };

  const behavior = BOSS_BASE[e.ai] || e.ai || "rusher";
  const tiles = standableTiles(battle, e);

  // melhor par (casa, alvo) para atacar já neste turno
  let best = null;
  for (const t of tiles) {
    for (const foe of foes) {
      const d = Math.abs(t.x - foe.x) + Math.abs(t.y - foe.y);
      if (d < 1 || d > e.stats.rng) continue;
      const score = attackScore(e, foe, d, behavior, battle) - t.cost * 0.5;
      if (!best || score > best.score) {
        best = { moveTo: { x: t.x, y: t.y }, targetKey: foe.key, score };
      }
    }
  }
  if (best) return best;

  // nenhum ataque possível → aproximar-se
  const target = nearestFoe(battle, e, foes);

  if (behavior === "guard" && md(e, target) > e.stats.mov + e.stats.rng + 1) {
    return { moveTo: null, targetKey: null }; // segura a posição
  }

  let step = { x: e.x, y: e.y };
  let bestDist = Infinity;
  for (const t of tiles) {
    const path = pathTo(battle.grid, t, target, (x, y) => occupied(battle, e, x, y));
    let d = path ? path.length : Math.abs(t.x - target.x) + Math.abs(t.y - target.y) + 20;
    if (battle.grid.tiles[t.y][t.x] === "magma") d += 3; // evita lava se der
    if (d < bestDist) {
      bestDist = d;
      step = { x: t.x, y: t.y };
    }
  }
  return { moveTo: step, targetKey: null };
}
