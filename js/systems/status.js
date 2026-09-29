/**
 * status.js — regras dos estados de batalha (queimadura, fraqueza, atordoamento).
 * Puro: opera sobre unidades de uma batalha; a UI só lê `unit.status`.
 * Dados em data/status.js.
 */
import { STATUS } from "../data/status.js";

export function hasStatus(unit, id) {
  return (unit.status?.[id] || 0) > 0;
}

/** Multiplicador de ATK vindo de estados (1 = sem efeito). */
export function atkStatusMul(unit) {
  let m = 1;
  for (const [id, t] of Object.entries(unit.status || {})) if (t > 0) m += STATUS[id]?.atkMul || 0;
  return Math.max(0.3, m);
}

/** Aplica `id` em `tgt`. Devolve true se pegou (renova a duração, nunca empilha). */
export function applyStatus(battle, tgt, id) {
  const def = STATUS[id];
  if (!def || !tgt.alive) return false;
  if (def.bossImmune && tgt.side === "boss") return false;
  if (!tgt.status) tgt.status = {};
  const fresh = !(tgt.status[id] > 0);
  tgt.status[id] = Math.max(tgt.status[id] || 0, def.turns);
  if (fresh) {
    battle.floaters.push({ x: tgt.x, y: tgt.y, text: def.emoji, kind: "dmg" });
    battle.log.push(`${def.emoji} ${tgt.name}: ${def.name}!`);
  }
  return true;
}

/** Remove todos os estados (cura, escudo, rally). */
export function cleanse(battle, unit) {
  if (!unit.status || !Object.values(unit.status).some((t) => t > 0)) return;
  unit.status = {};
  battle.floaters.push({ x: unit.x, y: unit.y, text: "✚", kind: "heal" });
  battle.log.push(`✚ ${unit.name} se livra dos estados negativos.`);
}

/**
 * Fim de rodada (depois do turno inimigo): queimadura causa dano, aliado
 * atordoado perde a ação da próxima rodada, e todas as durações caem 1.
 * `onDeath(unit)` é chamado se a queimadura matar (só inimigos morrem).
 */
export function tickStatuses(battle, onDeath) {
  for (const u of battle.units) {
    if (!u.alive || !u.status) continue;
    if (u.status.burn > 0) {
      const raw = Math.max(2, Math.round(u.maxHP * STATUS.burn.burnPct));
      const d = u.team === "ally" ? Math.min(raw, Math.max(0, u.curHP - 1)) : raw;
      if (d > 0) {
        u.curHP -= d;
        battle.floaters.push({ x: u.x, y: u.y, text: `-${d}`, kind: "dmg" });
        battle.log.push(`🔥 ${u.name} queima (${d}).`);
        if (u.curHP <= 0) onDeath?.(u);
      }
    }
    if (u.alive && u.team === "ally" && u.status.stun > 0) {
      u.skipNext = true;
      battle.log.push(`💫 ${u.name} está atordoado e perde a ação.`);
    }
    for (const id of Object.keys(u.status)) {
      if (u.status[id] > 0) u.status[id] -= 1;
      if (u.status[id] <= 0) delete u.status[id];
    }
  }
}
