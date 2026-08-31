/**
 * relics.js — Relíquias de Mácula: efeitos permanentes durante a run.
 *
 * O deus Mácula (da dualidade e da quebra do equilíbrio) espalhou essas
 * relíquias pelo universo como testes e armadilhas. Vêm de chefes, lojas e
 * eventos.
 *
 * Além dos mods numéricos (mesma bag das cartas de upgrade), relíquias podem
 * ter gatilhos lidos por systems/battle.js:
 *   firstHitDouble  → primeiro golpe de cada batalha causa dano dobrado
 *   cheatDeath      → sobrevive a um golpe fatal com 1 HP (1× por batalha)
 *   bountyOnWin     → +N Fragmentos Universais ao vencer qualquer batalha
 */

export const RELICS = [
  {
    id: "coracao_macula",
    name: "Coração Pulsante de Mácula",
    emoji: "🫀",
    text: "+12 de HP máximo e cura 15% no início de cada batalha.",
    mod: { maxHpBonus: 12, healStart: 0.15 },
  },
  {
    id: "olho_do_caos",
    name: "Fragmento do Olho do Caos",
    emoji: "👁️",
    text: "O primeiro golpe de cada batalha causa o dobro de dano.",
    mod: {},
    trigger: "firstHitDouble",
  },
  {
    id: "prisma_distancia",
    name: "Prisma da Distância Infinita",
    emoji: "🔺",
    text: "Uma vez por batalha, um herói escapa da morte com 1 de HP.",
    mod: {},
    trigger: "cheatDeath",
  },
  {
    id: "mascara_interseccao",
    name: "Máscara de Intersecção",
    emoji: "🎭",
    text: "+18% de dano causado, mas −3 de Defesa. Saber demais tem seu preço.",
    mod: { dmgUp: 0.18, defBonus: -3 },
  },
  {
    id: "obsidiana_branca",
    name: "Fragmento de Obsidiana Branca",
    emoji: "🔳",
    text: "Reduz em 12% todo o dano sofrido pelo esquadrão.",
    mod: { dmgReduction: 0.12 },
  },
  {
    id: "semente_rachada",
    name: "Semente Rachada",
    emoji: "🌰",
    text: "+2 Fragmentos Universais sempre que uma batalha é vencida.",
    mod: {},
    trigger: "bountyOnWin",
    triggerValue: 2,
  },
  {
    id: "pedra_dojo",
    name: "Pedra do Dojo",
    emoji: "🪨",
    text: "Heróis do tipo Projeção recebem +1 de movimento e +4 de Defesa.",
    mod: { movBonus: 1, defBonus: 4, affin: "projecao" },
  },
  {
    id: "manopla_korlok",
    name: "Manopla de Korlok",
    emoji: "🥊",
    text: "+8 de Ataque, mas −2 de Defesa. O caos cobra seu preço.",
    mod: { atkBonus: 8, defBonus: -2 },
  },
];

export const RELICS_BY_ID = Object.fromEntries(RELICS.map((r) => [r.id, r]));
