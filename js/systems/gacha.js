/**
 * gacha.js — Invocação estilo Fire Emblem Heroes.
 *
 * • Puxada individual (5 🌱) ou em lote de 5 (20 🌱).
 * • 5★ base 4%, 4★ 22%, resto 3★.
 * • Soft pity: após 50 invocações sem 5★, +2% por invocação. Hard pity em 70.
 * • O lote de 5 garante ao menos um 4★.
 * • Duplicatas devolvem algumas Sementes e viram progresso de nível.
 */
import { state } from "../core/state.js";
import { rng } from "../core/rng.js";
import { bus } from "../core/bus.js";
import { HEROES, HERO_IDS } from "../data/heroes.js";

export const GACHA = {
  costSingle: 5,
  costMulti: 20,
  multiCount: 5,
  base5: 0.04,
  base4: 0.22,
  softPityStart: 50,
  softPityStep: 0.02,
  hardPity: 70,
  dupeRefund: { 3: 1, 4: 2, 5: 4 },
};

const POOL = {
  3: HERO_IDS.filter((id) => HEROES[id].star === 3),
  4: HERO_IDS.filter((id) => HEROES[id].star === 4),
  5: HERO_IDS.filter((id) => HEROES[id].star === 5),
};

/** Probabilidade atual de 5★ considerando a pity. */
export function chanceOfFive(pity = state.meta.pity) {
  if (pity >= GACHA.hardPity - 1) return 1;
  let c = GACHA.base5;
  if (pity >= GACHA.softPityStart) {
    c += (pity - GACHA.softPityStart + 1) * GACHA.softPityStep;
  }
  return Math.min(1, c);
}

export function ratesLabel() {
  return {
    5: `${(chanceOfFive() * 100).toFixed(1)}%`,
    4: `${(GACHA.base4 * 100).toFixed(0)}%`,
    3: `${Math.max(0, (1 - chanceOfFive() - GACHA.base4) * 100).toFixed(0)}%`,
  };
}

export function canAfford(kind) {
  return state.meta.sementes >= (kind === "multi" ? GACHA.costMulti : GACHA.costSingle);
}

function rollStar(minStar) {
  const c5 = chanceOfFive();
  const x = rng.float();
  if (x < c5) return 5;
  if (x < c5 + GACHA.base4) return 4;
  return Math.max(3, minStar);
}

function resolveOne(minStar) {
  const star = rollStar(minStar);
  const heroId = rng.pick(POOL[star]);

  if (star === 5) state.meta.pity = 0;
  else state.meta.pity += 1;
  state.meta.pulls += 1;

  const granted = state.grantHero(heroId);
  let refund = 0;
  if (!granted.isNew) {
    refund = GACHA.dupeRefund[star] ?? 0;
  }

  return {
    heroId,
    star,
    name: HEROES[heroId].name,
    emoji: HEROES[heroId].emoji,
    types: HEROES[heroId].types,
    isNew: granted.isNew,
    dupes: granted.entry.dupes,
    refund,
  };
}

/**
 * Executa uma invocação.
 * @param {'single'|'multi'} kind
 * @returns {{results?:object[], refund?:number, error?:string}}
 */
export function summon(kind) {
  const cost = kind === "multi" ? GACHA.costMulti : GACHA.costSingle;
  if (!state.spendSementes(cost)) return { error: "insuficiente" };

  const n = kind === "multi" ? GACHA.multiCount : 1;
  const results = [];
  for (let i = 0; i < n; i++) {
    const lastAndNoFour = kind === "multi" && i === n - 1 && !results.some((r) => r.star >= 4);
    results.push(resolveOne(lastAndNoFour ? 4 : 3));
  }

  const refund = results.reduce((s, r) => s + r.refund, 0);
  if (refund > 0) state.addSementes(refund);
  state.persist();

  bus.emit("gacha:pulled", { kind, results, refund });
  return { results, refund };
}
