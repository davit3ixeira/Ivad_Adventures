/**
 * affinity.js — tipos de energia e o triângulo de fraquezas.
 * (Isolado para evitar import circular entre battle.js e ai.js.)
 *
 * Tipos:
 *   ⚔️ Físico   vence  Projeção
 *   🟢 Projeção vence  Mana
 *   🔵 Mana     vence  Físico
 *
 * Um herói/inimigo pode ter 1, 2 ou 3 tipos:
 *   1 tipo  → forte e fraco no triângulo normal
 *   2 tipos → cobre mais matchups (mais neutro), mas ainda tem brechas
 *   3 tipos → DIVINO: transcende o triângulo (sempre neutro, ±0%)
 */

export const TYPES = {
  fisico: { label: "Físico", icon: "⚔️", color: "var(--aff-fisico)" },
  projecao: { label: "Projeção", icon: "🟢", color: "var(--aff-projecao)" },
  mana: { label: "Mana", icon: "🔵", color: "var(--aff-mana)" },
};

export const WHEEL = { fisico: "projecao", projecao: "mana", mana: "fisico" };

export const ADV = 1.3;
export const DIS = 0.7;

const norm = (t) => (Array.isArray(t) ? t : [t]).filter(Boolean);
export const isDivine = (types) => norm(types).length >= 3;

/** 'adv' | 'dis' | 'neutral' — do ponto de vista do atacante. */
export function typeState(atkTypes, defTypes) {
  const A = norm(atkTypes);
  const D = norm(defTypes);
  if (A.length >= 3 || D.length >= 3) return "neutral"; // divino ignora o triângulo
  const atkBeats = A.some((a) => D.some((d) => WHEEL[a] === d));
  const defBeats = D.some((d) => A.some((a) => WHEEL[d] === a));
  if (atkBeats && !defBeats) return "adv";
  if (defBeats && !atkBeats) return "dis";
  return "neutral";
}

export function affinityMultiplier(atkTypes, defTypes, ignoreWheel = false) {
  if (ignoreWheel) return 1;
  const s = typeState(atkTypes, defTypes);
  return s === "adv" ? ADV : s === "dis" ? DIS : 1;
}

/** compat: alguns módulos ainda chamam affinityState */
export const affinityState = typeState;

/** classificação para exibição: 'fisico'|'projecao'|'mana'|'duplo'|'divino' */
export function typeClass(types) {
  const t = norm(types);
  if (t.length >= 3) return "divino";
  if (t.length === 2) return "duplo";
  return t[0] || "fisico";
}

/** rótulo curto: "Físico", "Projeção · Mana", "Divino" */
export function typeLabel(types) {
  const t = norm(types);
  if (t.length >= 3) return "Divino";
  return t.map((x) => TYPES[x]?.label ?? x).join(" · ");
}

/** ícones: "⚔️", "🟢🔵", "✨" */
export function typeIcons(types) {
  const t = norm(types);
  if (t.length >= 3) return "✨";
  return t.map((x) => TYPES[x]?.icon ?? "").join("");
}
