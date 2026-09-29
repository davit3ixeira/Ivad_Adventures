/**
 * status.js — Estados de batalha (só existem DENTRO de uma batalha; somem no fim).
 *
 * Aplicados por Especiais de heróis (`active.inflict`), por traços de inimigos
 * (`ENEMY_TRAITS.inflict` em systems/battle.js) e removidos por cura/escudo/
 * rally ("cleanse"). A lógica vive em `systems/status.js`.
 *
 *   turns    duração, contada em ROUNDS (uma contagem no fim de cada rodada completa)
 *   burnPct  dano por rodada, % do HP máximo (mín. 2). Nunca mata herói (deixa 1 HP).
 *   atkMul   multiplicador de ATK enquanto durar (−0.25 = −25%)
 *   skip     a unidade perde a próxima ação
 *   bossImmune  chefes não sofrem
 */
export const STATUS = {
  burn: { id: "burn", name: "Queimadura", emoji: "🔥", turns: 2, burnPct: 0.07, text: "Perde ~7% do HP máx. por rodada." },
  weaken: { id: "weaken", name: "Fraqueza", emoji: "🥀", turns: 2, atkMul: -0.25, text: "−25% de Ataque." },
  stun: { id: "stun", name: "Atordoado", emoji: "💫", turns: 1, skip: true, bossImmune: true, text: "Perde a próxima ação." },
};
