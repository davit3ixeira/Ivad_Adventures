/**
 * upgrades.js — "Cartas de Mácula": melhorias temporárias da run.
 *
 * Ao vencer uma batalha o jogador escolhe 1 de 3. Cada carta soma um
 * modificador ao esquadrão inteiro (bag `run.mods`), lido em systems/battle.js.
 *
 * mod keys:
 *   dmgUp        multiplicador ofensivo (+0.2 = +20%)
 *   dmgReduction dano recebido (-0.15 = -15%)
 *   lifesteal    % do dano causado curado
 *   rangeBonus   +alcance de ataque
 *   movBonus     +movimento
 *   spdBonus     +velocidade
 *   atkBonus / defBonus / maxHpBonus  planos
 *   wrathBonus   dano extra com HP < 50%
 *   healStart    % do HP máx curado no início de cada batalha
 *   execHeal     HP curado ao esquadrão quando um inimigo morre
 *   affin        (opcional) só aplica a heróis dessa afinidade
 */

export const UPGRADES = [
  {
    id: "soco_nuclear_plus",
    name: "Soco Nuclear +",
    emoji: "☢️",
    text: "+20% de dano causado por todo o esquadrão.",
    mod: { dmgUp: 0.2 },
  },
  {
    id: "eco_natureza",
    name: "Eco da Natureza",
    emoji: "🌿",
    text: "A harmonia de Xing Zang ecoa no esquadrão: regenera 12% do dano causado como HP.",
    mod: { lifesteal: 0.12 },
  },
  {
    id: "carapaca",
    name: "Carapaça Reforçada",
    emoji: "🛡️",
    text: "Reduz em 15% todo o dano sofrido.",
    mod: { dmgReduction: 0.15 },
  },
  {
    id: "feixe_ketchou",
    name: "Feixe Ketchou",
    emoji: "📡",
    text: "+1 de alcance de ataque para o esquadrão.",
    mod: { rangeBonus: 1 },
  },
  {
    id: "passos_xingzang",
    name: "Passos de Xing Zang",
    emoji: "💨",
    text: "+1 de movimento para todos os heróis.",
    mod: { movBonus: 1 },
  },
  {
    id: "reflexos_gemeos",
    name: "Reflexos Gêmeos",
    emoji: "⚡",
    text: "+4 de Velocidade (ataca duas vezes com mais facilidade).",
    mod: { spdBonus: 4 },
  },
  {
    id: "bencao_semente",
    name: "Bênção da Semente",
    emoji: "🌱",
    text: "+12 de HP máximo para todo o esquadrão.",
    mod: { maxHpBonus: 12 },
  },
  {
    id: "golpe_certeiro",
    name: "Golpe Certeiro",
    emoji: "🎯",
    text: "+6 de Ataque para todos os heróis.",
    mod: { atkBonus: 6 },
  },
  {
    id: "muralha_viva",
    name: "Muralha Viva",
    emoji: "🧱",
    text: "+5 de Defesa para todo o esquadrão.",
    mod: { defBonus: 5 },
  },
  {
    id: "segundo_folego",
    name: "Segundo Fôlego",
    emoji: "🫁",
    text: "Cura 25% do HP máximo no início de cada batalha.",
    mod: { healStart: 0.25 },
  },
  {
    id: "eco_espiritual",
    name: "Eco Espiritual",
    emoji: "🔊",
    text: "Cada inimigo derrotado cura 6 de HP a todo o esquadrão.",
    mod: { execHeal: 6 },
  },
  {
    id: "furia_haluho",
    name: "Fúria de Haluho",
    emoji: "🔥",
    text: "Com HP abaixo de 50%, +18% de dano causado.",
    mod: { wrathBonus: 0.18 },
  },
  {
    id: "seiva_selvagem",
    name: "Seiva Selvagem",
    emoji: "🍃",
    text: "Heróis de Natureza ganham +8 de Ataque e +8 de HP.",
    mod: { atkBonus: 8, maxHpBonus: 8, affin: "natureza" },
  },
  {
    id: "foco_de_ki",
    name: "Foco de Ki",
    emoji: "🌀",
    text: "Heróis Espirituais ganham +1 de alcance e +5 de Ataque.",
    mod: { rangeBonus: 1, atkBonus: 5, affin: "espiritual" },
  },
];

export const UPGRADES_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
