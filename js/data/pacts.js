/**
 * pacts.js — Pactos de Punição: modificadores de risco/recompensa OPCIONAIS,
 * escolhidos antes de entrar num nível da Torre da Ascensão (à la "Pacto de
 * Punição" de Hades). Cada pacto fortalece os inimigos de um jeito específico
 * e, em troca, incha uma recompensa específica. Combináveis livremente — o
 * jogador escolhe 0, 1 ou vários antes de subir o nível.
 *
 * `enemy`  : multiplicadores aditivos aplicados em cima de enemyStats() —
 *            atkMul/hpMul/spdMul (0.2 = +20%) e extraGrunt (+N tropa comum
 *            por batalha, lido em systems/battle.js).
 * `reward` : multiplicadores aditivos aplicados em cima do loot da batalha —
 *            fragMul/gemaMul/equipChanceMul, lidos em systems/run.js.
 */

export const PACTS = [
  {
    id: "fervor_haluho",
    name: "Fervor de Haluho",
    emoji: "🔥",
    text: "Inimigos causam +18% de dano.",
    boon: "+20% de Fragmentos e Gemas ao vencer uma batalha.",
    enemy: { atkMul: 0.18 },
    reward: { fragMul: 0.2, gemaMul: 0.2 },
  },
  {
    id: "carne_de_titan",
    name: "Carne de Titã",
    emoji: "🗿",
    text: "Inimigos têm +25% de HP máximo.",
    boon: "+20% de Gemas ao vencer uma batalha.",
    enemy: { hpMul: 0.25 },
    reward: { gemaMul: 0.2 },
  },
  {
    id: "reflexos_caos",
    name: "Reflexos do Caos",
    emoji: "⚡",
    text: "Inimigos têm +15% de Velocidade — atacam duas vezes com mais facilidade.",
    boon: "+18% de chance de equipamento cair nas batalhas.",
    enemy: { spdMul: 0.15 },
    reward: { equipChanceMul: 0.18 },
  },
  {
    id: "legiao_extra",
    name: "Legião Extra",
    emoji: "👹",
    text: "+1 inimigo comum aparece em cada batalha.",
    boon: "+15% de Fragmentos ao vencer uma batalha.",
    enemy: { extraGrunt: 1 },
    reward: { fragMul: 0.15 },
  },
  {
    id: "sangue_pelo_ouro",
    name: "Sangue pelo Ouro",
    emoji: "💰",
    text: "Inimigos causam +12% de dano e têm +12% de HP máximo.",
    boon: "+35% de Gemas e +25% de Fragmentos ao vencer uma batalha.",
    enemy: { atkMul: 0.12, hpMul: 0.12 },
    reward: { fragMul: 0.25, gemaMul: 0.35 },
  },
  {
    id: "ambicao_sem_fim",
    name: "Ambição sem Fim",
    emoji: "♾️",
    text: "Inimigos causam +22% de dano, têm +22% de HP e +10% de Velocidade.",
    boon: "+50% de Fragmentos, Gemas e chance de equipamento ao vencer uma batalha.",
    enemy: { atkMul: 0.22, hpMul: 0.22, spdMul: 0.1 },
    reward: { fragMul: 0.5, gemaMul: 0.5, equipChanceMul: 0.5 },
  },
];

export const PACTS_BY_ID = Object.fromEntries(PACTS.map((p) => [p.id, p]));

/** Soma os efeitos dos pactos ativos (ids) numa bag só, lida por run.js/battle.js. */
export function aggregatePacts(ids = []) {
  const out = { atkMul: 0, hpMul: 0, spdMul: 0, extraGrunt: 0, fragMul: 0, gemaMul: 0, equipChanceMul: 0 };
  for (const id of ids) {
    const p = PACTS_BY_ID[id];
    if (!p) continue;
    out.atkMul += p.enemy.atkMul || 0;
    out.hpMul += p.enemy.hpMul || 0;
    out.spdMul += p.enemy.spdMul || 0;
    out.extraGrunt += p.enemy.extraGrunt || 0;
    out.fragMul += p.reward.fragMul || 0;
    out.gemaMul += p.reward.gemaMul || 0;
    out.equipChanceMul += p.reward.equipChanceMul || 0;
  }
  return out;
}
