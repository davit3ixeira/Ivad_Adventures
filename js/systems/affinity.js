/**
 * affinity.js — triângulo de energias (isolado para evitar import circular
 * entre battle.js e ai.js).
 *
 *   🔴 Físico  vence  🟢 Natureza
 *   🟢 Natureza vence  🔵 Espiritual
 *   🔵 Espiritual vence 🔴 Físico
 */
export const WHEEL = { fisico: "natureza", natureza: "espiritual", espiritual: "fisico" };

export const ADV = 1.3; // dano com vantagem
export const DIS = 0.7; // dano com desvantagem

export function affinityMultiplier(atkAff, defAff, ignoreWheel = false) {
  if (ignoreWheel) return 1;
  if (WHEEL[atkAff] === defAff) return ADV;
  if (WHEEL[defAff] === atkAff) return DIS;
  return 1;
}

/** 'adv' | 'dis' | 'neutral' — para exibição na UI. */
export function affinityState(atkAff, defAff) {
  if (WHEEL[atkAff] === defAff) return "adv";
  if (WHEEL[defAff] === atkAff) return "dis";
  return "neutral";
}
