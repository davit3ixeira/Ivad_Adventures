/**
 * pacts.js — Pactos da Torre: modificadores opcionais de risco/recompensa,
 * escolhidos ANTES de subir um nível da Torre da Ascensão (nunca numa
 * jornada normal — é recompensa extra pra quem já zerou a campanha).
 *
 * Cada pacto ativo deixa os inimigos daquele nível mais fortes de um jeito
 * específico e, em troca, aumenta a recompensa (Fragmentos/Gemas/Tomos) de
 * TODAS as batalhas daquele nível da Torre. São lidos por
 * `systems/run.js` (`pactMods`) e aplicados em `systems/battle.js`.
 *
 * effect keys:
 *   enemyAtkMul / enemyDefMul / enemyHpMul / enemySpdMul  multiplicador (+0.15 = +15%)
 *   extraAdd     +N inimigos comuns em cada batalha
 *   noHealStart  desativa o bônus "healStart" de Cartas/Relíquias durante a run
 */
export const PACTS = [
  {
    id: "fervor_da_torre",
    name: "Fervor da Torre",
    emoji: "🔥",
    text: "Inimigos causam +15% de dano.",
    effect: { enemyAtkMul: 0.15 },
    rewardMul: 0.12,
  },
  {
    id: "blindagem_ancestral",
    name: "Blindagem Ancestral",
    emoji: "🛡️",
    text: "Inimigos têm +20% de Defesa.",
    effect: { enemyDefMul: 0.2 },
    rewardMul: 0.1,
  },
  {
    id: "sangue_denso",
    name: "Sangue Denso",
    emoji: "🩸",
    text: "Inimigos têm +25% de HP máximo.",
    effect: { enemyHpMul: 0.25 },
    rewardMul: 0.15,
  },
  {
    id: "passo_do_selo",
    name: "Passo do Selo",
    emoji: "💨",
    text: "Inimigos têm +20% de Velocidade (agem e atacam duas vezes com mais facilidade).",
    effect: { enemySpdMul: 0.2 },
    rewardMul: 0.1,
  },
  {
    id: "chamado_extra",
    name: "Chamado Extra",
    emoji: "👥",
    text: "+1 inimigo comum em cada batalha deste nível.",
    effect: { extraAdd: 1 },
    rewardMul: 0.14,
  },
  {
    id: "jejum_primordial",
    name: "Jejum Primordial",
    emoji: "🚫",
    text: "Cartas e Relíquias de cura no início da batalha não fazem efeito nesta run.",
    effect: { noHealStart: true },
    rewardMul: 0.08,
  },
];

export const PACTS_BY_ID = Object.fromEntries(PACTS.map((p) => [p.id, p]));
