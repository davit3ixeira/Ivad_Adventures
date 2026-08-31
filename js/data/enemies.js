/**
 * enemies.js — bestiário de "As Aventuras de Ivad".
 *
 * types : 'fisico' | 'projecao' | 'mana'  (mesmo sistema dos heróis)
 * kind  : 'grunt' | 'elite' | 'boss'
 * ai    : 'rusher' | 'kiter' | 'guard' | 'boss_taki' | 'boss_korlok' | 'boss_king'
 * traços especiais (ENEMY_TRAITS em systems/battle.js): double, bulwark,
 *   openerBonus, omniCounter, alwaysCounter, rage, ignoreWheel, cleave, bossHeal
 */

export const ENEMIES = {
  // ---------- tropa comum de Haluho ----------
  haluhu: {
    id: "haluhu",
    name: "Soldado Haluhu",
    kind: "grunt",
    types: ["fisico"],
    emoji: "👹",
    base: { hp: 28, atk: 17, def: 4, spd: 6 },
    mov: 3,
    rng: 1,
    ai: "rusher",
  },
  haluhu_osso: {
    id: "haluhu_osso",
    name: "Haluhu Lanceiro",
    kind: "grunt",
    types: ["fisico"],
    emoji: "🦴",
    base: { hp: 26, atk: 16, def: 5, spd: 7 },
    mov: 2,
    rng: 2,
    ai: "kiter",
  },
  espectro: {
    id: "espectro",
    name: "Espectro de Sombras",
    kind: "grunt",
    types: ["mana"],
    emoji: "👻",
    base: { hp: 24, atk: 19, def: 3, spd: 9 },
    mov: 3,
    rng: 1,
    ai: "rusher",
  },
  bruto_magma: {
    id: "bruto_magma",
    name: "Bruto de Magma",
    kind: "grunt",
    types: ["projecao"],
    emoji: "🌋",
    base: { hp: 44, atk: 18, def: 8, spd: 3 },
    mov: 2,
    rng: 1,
    ai: "guard",
  },

  // ---------- Dojo / O Escolhido (Cap. II) ----------
  discipulo_caido: {
    id: "discipulo_caido",
    name: "Discípulo Caído",
    kind: "grunt",
    types: ["fisico", "projecao"],
    emoji: "🥋",
    base: { hp: 34, atk: 20, def: 6, spd: 10 },
    mov: 3,
    rng: 1,
    ai: "rusher",
  },
  sombra_escolhido: {
    id: "sombra_escolhido",
    name: "Fragmento do Escolhido",
    kind: "grunt",
    types: ["mana"],
    emoji: "🌒",
    base: { hp: 26, atk: 22, def: 4, spd: 11 },
    mov: 3,
    rng: 2,
    ai: "kiter",
  },

  // ---------- Dimensão Alfa / Projeção hostil ----------
  projecao_hostil: {
    id: "projecao_hostil",
    name: "Projeção Instável",
    kind: "grunt",
    types: ["projecao"],
    emoji: "🔻",
    base: { hp: 30, atk: 19, def: 5, spd: 8 },
    mov: 2,
    rng: 2,
    ai: "kiter",
  },
  colosso_projecao: {
    id: "colosso_projecao",
    name: "Colosso de Projeção",
    kind: "elite",
    types: ["projecao"],
    emoji: "🗿",
    base: { hp: 100, atk: 23, def: 13, spd: 4 },
    mov: 2,
    rng: 1,
    ai: "guard",
    trait: "Figura gigantesca de pura energia: −25% de dano recebido e golpe em área (35%).",
  },
  sentinela_alfa: {
    id: "sentinela_alfa",
    name: "Sentinela da Dimensão Alfa",
    kind: "elite",
    types: ["projecao", "mana"],
    emoji: "🔷",
    base: { hp: 78, atk: 25, def: 9, spd: 12 },
    mov: 3,
    rng: 2,
    ai: "kiter",
    trait: "Guardião de outra realidade: revida a qualquer alcance.",
  },

  // ---------- Planeta Poder (Cap. III) ----------
  guerreiro_poder: {
    id: "guerreiro_poder",
    name: "Guerreiro do Planeta Poder",
    kind: "grunt",
    types: ["fisico"],
    emoji: "💪",
    base: { hp: 46, atk: 21, def: 9, spd: 6 },
    mov: 3,
    rng: 1,
    ai: "rusher",
  },
  corrompido_macula: {
    id: "corrompido_macula",
    name: "Corrompido de Mácula",
    kind: "grunt",
    types: ["mana", "fisico"],
    emoji: "🩸",
    base: { hp: 32, atk: 24, def: 5, spd: 9 },
    mov: 3,
    rng: 1,
    ai: "rusher",
    trait: "Pagou pela própria ambição: +20% de dano, mas quebra fácil.",
  },

  // ---------- os cinco Irmãos Demônios de Haluho (elites) ----------
  huluhuluhu: {
    id: "huluhuluhu",
    name: "Huluhuluhu",
    kind: "elite",
    types: ["mana"],
    emoji: "🌑",
    base: { hp: 74, atk: 23, def: 8, spd: 11 },
    mov: 3,
    rng: 1,
    ai: "rusher",
    trait: "Dança das sombras: dissolve-se e reaparece atrás do alvo — sempre golpeia duas vezes.",
  },
  holoholoho: {
    id: "holoholoho",
    name: "Holoholoho",
    kind: "elite",
    types: ["fisico"],
    emoji: "🔥",
    base: { hp: 80, atk: 26, def: 9, spd: 8 },
    mov: 3,
    rng: 1,
    ai: "rusher",
    trait: "Aura flamejante: o primeiro golpe queima com força extra (+15%).",
  },
  hilihilihi: {
    id: "hilihilihi",
    name: "Hilihilihi",
    kind: "elite",
    types: ["mana"],
    emoji: "🌫️",
    base: { hp: 66, atk: 24, def: 7, spd: 10 },
    mov: 2,
    rng: 2,
    ai: "kiter",
    trait: "Névoa de ilusões: cópias falsas absorvem 25% do dano recebido; ataca à distância 2.",
  },
  helehelehe: {
    id: "helehelehe",
    name: "Helehelehe",
    kind: "elite",
    types: ["fisico"],
    emoji: "👿",
    base: { hp: 96, atk: 22, def: 12, spd: 5 },
    mov: 2,
    rng: 1,
    ai: "guard",
    trait: "Comandante do exército: pele de ferro, −25% de dano recebido.",
  },
  halahalaha: {
    id: "halahalaha",
    name: "Halahalaha",
    kind: "elite",
    types: ["fisico", "projecao"],
    emoji: "😈",
    base: { hp: 88, atk: 27, def: 9, spd: 12 },
    mov: 4,
    rng: 1,
    ai: "rusher",
    trait: "O mais forte dos irmãos: reflexos sobrenaturais (golpe duplo) e ímpeto no primeiro golpe (+15%).",
  },

  // ═══════════════ CHEFES — maiores, mais fortes, com regras próprias ═══════════════
  takimatida_sombrio: {
    id: "takimatida_sombrio",
    name: "Takimatida — O Escolhido",
    kind: "boss",
    types: ["mana", "projecao"],
    emoji: "🕳️",
    base: { hp: 300, atk: 27, def: 12, spd: 13 },
    mov: 3,
    rng: 2,
    ai: "boss_taki",
    trait: "Armadura negra viva: revida em qualquer alcance, golpeia duas vezes e cada golpe respinga nos heróis vizinhos (40%).",
  },
  korlok: {
    id: "korlok",
    name: "Korlok, o Olho do Caos",
    kind: "boss",
    types: ["fisico", "mana"],
    emoji: "👁️",
    base: { hp: 360, atk: 29, def: 15, spd: 8 },
    mov: 3,
    rng: 1,
    ai: "boss_korlok",
    trait: "Três metros de fúria: +3 de Ataque por turno (Olho do Caos) e ondas de choque que atingem todos ao redor do alvo (55%).",
  },
  haluhaluhu: {
    id: "haluhaluhu",
    name: "Haluhaluhu, Rei Demônio",
    kind: "boss",
    types: ["fisico", "projecao", "mana"], // DIVINO
    emoji: "🔥",
    base: { hp: 470, atk: 30, def: 16, spd: 10 },
    mov: 3,
    rng: 1,
    ai: "boss_king",
    trait: "Extensão da Semente Primordial: divino (ignora o triângulo), −15% de dano recebido, revida sempre, +3 ATK/turno e golpes em área (60%).",
  },
};

export const ENEMY_IDS = Object.keys(ENEMIES);

/**
 * Atributos escalados por capítulo (1..4) e profundidade do nó.
 * Inimigos ficam bem mais fortes conforme a run avança.
 */
export function enemyStats(def, chapter = 1, depth = 0) {
  const isBoss = def.kind === "boss";
  const isElite = def.kind === "elite";

  // curva de poder: capítulo pesa bastante, profundidade também
  const chapterScale = 1 + (chapter - 1) * (isBoss ? 0.3 : 0.3);
  const depthScale = 1 + depth * (isBoss ? 0.02 : 0.045);
  const kindMul = isBoss ? 1 : isElite ? 1.08 : 1;
  const hpScale = chapterScale * depthScale * kindMul;

  // ATK dos chefes escala mais devagar (senão eles one-shotam heróis)
  const atkScale = isBoss ? 1 + (chapter - 1) * 0.16 + depth * 0.02 : hpScale;

  return {
    maxHP: Math.round(def.base.hp * hpScale),
    atk: Math.round(def.base.atk * atkScale),
    def: Math.round(def.base.def * (1 + (chapter - 1) * 0.16 + depth * 0.02)),
    spd: Math.round(def.base.spd * (1 + (chapter - 1) * 0.05)),
    mov: def.mov,
    rng: def.rng,
  };
}
