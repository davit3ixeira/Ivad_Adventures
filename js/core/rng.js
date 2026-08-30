/**
 * rng.js — gerador pseudoaleatório determinístico (mulberry32).
 * A run roguelike guarda uma seed para que o mapa seja reproduzível.
 */

export function makeRng(seed = Date.now()) {
  let a = seed >>> 0;

  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    seed,
    /** float em [0,1) */
    float: next,
    /** inteiro em [min, max] */
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    /** elemento aleatório de um array */
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    /** true com probabilidade p */
    chance: (p) => next() < p,
    /** embaralha (Fisher–Yates) devolvendo novo array */
    shuffle: (arr) => {
      const a2 = [...arr];
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    },
    /** n elementos distintos */
    sample: (arr, n) => {
      const a2 = [...arr];
      const out = [];
      while (out.length < n && a2.length) {
        out.push(a2.splice(Math.floor(next() * a2.length), 1)[0]);
      }
      return out;
    },
  };
}

/** RNG global não-determinístico para gacha e efeitos de tela. */
export const rng = makeRng((Math.random() * 2 ** 32) >>> 0);
