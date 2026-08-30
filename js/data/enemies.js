/**
 * enemies.js — bestiário de "As Aventuras de Ivad":
 * soldados Haluhus, os cinco Irmãos Demônios e os Chefes.
 *
 * kind : 'grunt' | 'elite' | 'boss'
 * ai   : 'rusher' | 'kiter' | 'guard' | 'boss_taki' | 'boss_korlok' | 'boss_king'
 * traços especiais são aplicados em systems/battle.js (ENEMY_TRAITS).
 */

export const ENEMIES = {
  // ---------- tropa comum de Haluho ----------
  haluhu: {
    id: "haluhu",
    name: "Soldado Haluhu",
    kind: "grunt",
    aff: "fisico",
    emoji: "👹",
    base: { hp: 26, atk: 16, def: 4, spd: 6 },
    mov: 3,
    rng: 1,
    ai: "rusher",
  },
  haluhu_osso: {
    id: "haluhu_osso",
    name: "Haluhu Lanceiro",
    kind: "grunt",
    aff: "fisico",
    emoji: "🦴",
    base: { hp: 24, atk: 15, def: 5, spd: 7 },
    mov: 2,
    rng: 2,
    ai: "kiter",
  },
  espectro: {
    id: "espectro",
    name: "Espectro de Sombras",
    kind: "grunt",
    aff: "espiritual",
    emoji: "👻",
    base: { hp: 22, atk: 18, def: 3, spd: 9 },
    mov: 3,
    rng: 1,
    ai: "rusher",
  },
  bruto_magma: {
    id: "bruto_magma",
    name: "Bruto de Magma",
    kind: "grunt",
    aff: "natureza",
    emoji: "🌋",
    base: { hp: 40, atk: 17, def: 8, spd: 3 },
    mov: 2,
    rng: 1,
    ai: "guard",
  },

  // ---------- os cinco Irmãos Demônios de Haluho ----------
  huluhuluhu: {
    id: "huluhuluhu",
    name: "Huluhuluhu",
    kind: "elite",
    aff: "espiritual",
    emoji: "🌑",
    base: { hp: 66, atk: 22, def: 8, spd: 11 },
    mov: 3,
    rng: 1,
    ai: "rusher",
    trait: "Dança das sombras: dissolve-se e reaparece atrás do alvo — sempre golpeia duas vezes.",
  },
  holoholoho: {
    id: "holoholoho",
    name: "Holoholoho",
    kind: "elite",
    aff: "fisico",
    emoji: "🔥",
    base: { hp: 70, atk: 25, def: 9, spd: 8 },
    mov: 3,
    rng: 1,
    ai: "rusher",
    trait: "Aura flamejante: o primeiro golpe queima com força extra (+15%).",
  },
  hilihilihi: {
    id: "hilihilihi",
    name: "Hilihilihi",
    kind: "elite",
    aff: "espiritual",
    emoji: "🌫️",
    base: { hp: 58, atk: 23, def: 7, spd: 10 },
    mov: 2,
    rng: 2,
    ai: "kiter",
    trait: "Névoa de ilusões: cópias falsas absorvem 25% do dano recebido; ataca à distância 2.",
  },
  helehelehe: {
    id: "helehelehe",
    name: "Helehelehe",
    kind: "elite",
    aff: "fisico",
    emoji: "👿",
    base: { hp: 84, atk: 21, def: 11, spd: 5 },
    mov: 2,
    rng: 1,
    ai: "guard",
    trait: "Comandante do exército: pele de ferro, -25% de dano recebido.",
  },
  halahalaha: {
    id: "halahalaha",
    name: "Halahalaha",
    kind: "elite",
    aff: "fisico",
    emoji: "😈",
    base: { hp: 78, atk: 26, def: 9, spd: 12 },
    mov: 4,
    rng: 1,
    ai: "rusher",
    trait: "O mais forte dos irmãos: reflexos sobrenaturais (golpe duplo) e ímpeto no primeiro golpe (+15%).",
  },

  // ---------- Chefes ----------
  takimatida_sombrio: {
    id: "takimatida_sombrio",
    name: "Takimatida — O Escolhido",
    kind: "boss",
    aff: "espiritual",
    emoji: "🕳️",
    base: { hp: 128, atk: 27, def: 10, spd: 13 },
    mov: 3,
    rng: 2,
    ai: "boss_taki",
    trait: "Armadura negra viva: revida em qualquer alcance e golpeia duas vezes.",
  },
  korlok: {
    id: "korlok",
    name: "Korlok, o Olho do Caos",
    kind: "boss",
    aff: "fisico",
    emoji: "👁️",
    base: { hp: 160, atk: 29, def: 13, spd: 8 },
    mov: 3,
    rng: 1,
    ai: "boss_korlok",
    trait: "Três metros de fúria: o Olho do Caos cravado no peito rende +2 de Ataque por turno.",
  },
  haluhaluhu: {
    id: "haluhaluhu",
    name: "Haluhaluhu, Rei Demônio",
    kind: "boss",
    aff: "fisico",
    emoji: "🔥",
    base: { hp: 205, atk: 31, def: 14, spd: 10 },
    mov: 3,
    rng: 1,
    ai: "boss_king",
    trait: "Extensão da Semente Primordial: imune ao triângulo de afinidades, revida sempre e fica mais forte a cada turno.",
  },
};

export const ENEMY_IDS = Object.keys(ENEMIES);

/**
 * Atributos de um inimigo escalados por capítulo (1..4) e profundidade do nó.
 * depth = índice da linha no mapa.
 */
export function enemyStats(def, chapter = 1, depth = 0) {
  const scale = 1 + (chapter - 1) * 0.22 + depth * 0.025;
  const kindMul = def.kind === "boss" ? 1 : def.kind === "elite" ? 1.05 : 1;
  const s = (v) => Math.round(v * scale * kindMul);
  return {
    maxHP: s(def.base.hp),
    atk: s(def.base.atk),
    def: Math.round(def.base.def * (1 + (chapter - 1) * 0.14 + depth * 0.018)),
    spd: Math.round(def.base.spd * (1 + (chapter - 1) * 0.06)),
    mov: def.mov,
    rng: def.rng,
  };
}
