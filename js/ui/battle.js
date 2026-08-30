/**
 * battle.js (UI) — tela de combate tático.
 *
 * Fluxo de uma jogada:
 *   1. clique num herói livre  → mostra alcance de movimento (azul)
 *   2. clique numa casa azul   → posiciona; mostra alvos (vermelho) + "Aguardar"
 *   3. clique num alvo         → previsão no painel → "Confirmar"
 */
import { state } from "../core/state.js";
import { router } from "./router.js";
import { modal } from "./toast.js";
import { h, hpBar } from "./components.js";
import { portrait, playSfx } from "../data/manifest.js";
import { HEROES, AFFINITIES } from "../data/heroes.js";
import { key } from "../systems/pathfind.js";
import {
  createBattle,
  computeMoveRange,
  attackTargets,
  forecast,
  performAction,
  runEnemyTurn,
} from "../systems/battle.js";
import { recordBattleWin, endRunDefeat, syncSquadHP } from "../systems/run.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let battle = null;
let nodeId = null;
let sel = null; // { unit, moveRange:Map, planTile:{x,y}|null, target:unit|null }
let busy = false;

export function renderBattle(mount, params) {
  nodeId = params.nodeId;
  const run = state.run;
  const node = run?.map.nodes[nodeId];
  if (!run || !node) return router.go("menu");

  battle = createBattle(run, node);
  sel = null;
  busy = false;

  mount.appendChild(
    h(`
    <section class="battle">
      <div class="battle__stage" id="stage">
        <div class="battle__banner phase-player" id="banner"></div>
        <div style="overflow-x:auto">
          <div class="grid" id="grid"></div>
        </div>
        <div class="battle__actions" id="actions" style="margin-top:14px; justify-content:center"></div>
      </div>

      <aside class="battle__side">
        <div class="panel combat-card" id="inspect">
          <h3>Combate</h3>
          <p class="muted" style="font-size:.85rem">Selecione um herói para agir.</p>
        </div>
        <div class="panel combat-card">
          <h3>Registro</h3>
          <div class="battle__log" id="log"></div>
        </div>
      </aside>
    </section>
  `)
  );

  paint();
}

/* --------------------------------------------------------------- render */
function paint() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  const g = battle.grid;
  grid.style.gridTemplateColumns = `repeat(${g.w}, var(--cell, 60px))`;

  const moveKeys = sel?.moveRange ?? null;
  const planTile = sel?.planTile ?? null;
  const targetKeys = new Set();
  if (sel && planTile) {
    for (const t of attackTargets(battle, sel.unit, planTile)) targetKeys.add(key(t.x, t.y));
  }

  let html = "";
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      const k = key(x, y);
      const cls = ["tile"];
      if (moveKeys?.has(k) && !planTile) cls.push("mv-move");
      if (planTile && planTile.x === x && planTile.y === y) cls.push("mv-path");
      if (targetKeys.has(k)) cls.push("mv-attack");
      if (sel?.unit.skill?.type === "healer" && targetKeys.has(k)) cls.push("mv-heal");
      html += `<div class="${cls.join(" ")}" data-terrain="${g.tiles[y][x]}" data-x="${x}" data-y="${y}">`;
      const u = battle.units.find((z) => z.alive && z.x === x && z.y === y);
      if (u) html += unitHTML(u);
      html += "</div>";
    }
  }
  grid.innerHTML = html;

  grid.querySelectorAll(".tile").forEach((tile) => {
    tile.addEventListener("click", () => onTile(Number(tile.dataset.x), Number(tile.dataset.y)));
  });

  // floaters
  const stage = document.getElementById("grid");
  battle.floaters.forEach((f) => {
    const cell = stage.querySelector(`[data-x="${f.x}"][data-y="${f.y}"]`);
    if (!cell) return;
    const fl = document.createElement("div");
    fl.className = `floater floater--${f.kind}`;
    fl.textContent = f.text;
    fl.style.left = "50%";
    fl.style.top = "10%";
    cell.appendChild(fl);
    fl.addEventListener("animationend", () => fl.remove());
  });
  battle.floaters = [];

  // banner
  const banner = document.getElementById("banner");
  banner.className = `battle__banner phase-${battle.phase === "enemy" ? "enemy" : "player"}`;
  banner.textContent =
    battle.phase === "enemy"
      ? "⚔️ Turno Inimigo"
      : `Turno ${battle.turn} — Seus Heróis  ·  ${battle.units.filter((u) => u.alive && u.team === "ally" && !u.acted).length} por agir`;

  renderActions();
  renderLog();
  if (!sel) renderInspectDefault();
}

function unitHTML(u) {
  const side = u.team === "ally" ? "ally" : u.side === "boss" ? "boss" : "enemy";
  const low = u.curHP / u.maxHP <= 0.35;
  const active = sel?.unit === u ? "is-active" : "";
  const done = u.team === "ally" && u.acted ? "is-done" : "";
  const artId = u.team === "ally" ? heroIdOf(u) : u.enemyId;
  return `
    <div class="unit side-${side} ${active} ${done}" data-unit="${u.key}">
      ${portrait(u.team === "ally" ? "heroes" : "enemies", artId, u.emoji)}
      <span class="unit__aff aff-${u.aff}"></span>
      <span class="unit__hp ${low ? "is-low" : ""}"><i style="width:${(u.curHP / u.maxHP) * 100}%"></i></span>
    </div>`;
}

function heroIdOf(u) {
  const e = state.run.squad.find((s) => s.uid === u.uid);
  return e?.id;
}

/* --------------------------------------------------------------- input */
function onTile(x, y) {
  if (busy || battle.phase !== "player" || battle.over) return;
  const unit = battle.units.find((u) => u.alive && u.x === x && u.y === y);

  // sem seleção: escolher herói ou inspecionar inimigo
  if (!sel) {
    if (unit && unit.team === "ally" && !unit.acted) selectUnit(unit);
    else if (unit) inspectEnemy(unit);
    return;
  }

  // fase de movimento
  if (!sel.planTile) {
    if (unit === sel.unit) {
      // clicar no próprio herói = ficar parado e ir para ataque
      sel.planTile = { x: sel.unit.x, y: sel.unit.y };
      paint();
      return;
    }
    if (unit && unit.team === "ally" && !unit.acted) return selectUnit(unit);
    if (sel.moveRange.has(key(x, y)) && !unit) {
      sel.planTile = { x, y };
      paint();
    }
    return;
  }

  // fase de ataque (já posicionado)
  const canHit = attackTargets(battle, sel.unit, sel.planTile).some((t) => t.x === x && t.y === y);
  if (canHit && unit) {
    showForecast(unit);
    return;
  }
  // clicar na casa planejada de novo = aguardar
  if (sel.planTile.x === x && sel.planTile.y === y) return commit({ mode: "wait" });
}

function selectUnit(unit) {
  sel = { unit, moveRange: computeMoveRange(battle, unit), planTile: null, target: null };
  renderInspectUnit(unit);
  paint();
}

function cancelSel() {
  sel = null;
  paint();
}

async function commit(action) {
  if (busy) return;
  busy = true;
  performAction(battle, sel.unit, {
    moveTo: sel.planTile || undefined,
    mode: action.mode,
    targetKey: action.targetKey,
  });
  if (action.mode === "attack") playSfx("hit");
  sel = null;
  paint();
  await sleep(260);
  busy = false;

  if (checkEnd()) return;

  // encerra turno automaticamente quando todos agiram
  if (battle.units.filter((u) => u.alive && u.team === "ally").every((u) => u.acted)) {
    await doEnemyTurn();
  }
}

async function doEnemyTurn() {
  if (busy && battle.phase === "enemy") return;
  busy = true;
  sel = null;
  await runEnemyTurn(battle, { render: paint, sleep, afterCombat: () => playSfx("hit") });
  busy = false;
  checkEnd();
}

/* --------------------------------------------------------------- actions bar */
function renderActions() {
  const bar = document.getElementById("actions");
  if (!bar) return;

  if (battle.over || battle.phase === "enemy") {
    bar.innerHTML = "";
    return;
  }

  if (!sel) {
    bar.innerHTML = `<button class="btn btn--ghost btn--sm" id="end-turn">Encerrar Turno ⏭</button>
      <button class="btn btn--ghost btn--sm" id="retreat">Fugir da batalha</button>`;
    bar.querySelector("#end-turn").addEventListener("click", () => doEnemyTurn());
    bar.querySelector("#retreat").addEventListener("click", confirmRetreat);
    return;
  }

  if (!sel.planTile) {
    bar.innerHTML = `<span class="muted" style="font-size:.85rem">Mova <b>${sel.unit.name}</b> (azul) ou clique nele para ficar parado.</span>
      <button class="btn btn--ghost btn--sm" id="cancel">Cancelar</button>`;
  } else {
    const hasTargets = attackTargets(battle, sel.unit, sel.planTile).length > 0;
    bar.innerHTML = `
      <span class="muted" style="font-size:.85rem">${
        hasTargets ? "Clique num alvo (vermelho) ou " : ""
      }confirme a posição.</span>
      <button class="btn btn--sm btn--primary" id="wait">Aguardar aqui</button>
      <button class="btn btn--ghost btn--sm" id="back">Voltar</button>`;
    bar.querySelector("#wait").addEventListener("click", () => commit({ mode: "wait" }));
    bar.querySelector("#back").addEventListener("click", () => {
      sel.planTile = null;
      paint();
    });
  }
  bar.querySelector("#cancel")?.addEventListener("click", cancelSel);
}

/* --------------------------------------------------------------- side panel */
function renderInspectDefault() {
  const box = document.getElementById("inspect");
  if (!box) return;
  const allies = battle.units.filter((u) => u.team === "ally");
  const enemies = battle.units.filter((u) => u.team === "enemy" && u.alive);
  box.innerHTML = `
    <h3>Campo de Batalha</h3>
    <div class="unit-inspect">
      <div style="display:flex; justify-content:space-between"><span>Seus heróis</span><b>${allies.filter((u) => u.alive).length}/${allies.length}</b></div>
      <div style="display:flex; justify-content:space-between"><span>Inimigos</span><b>${enemies.length}</b></div>
      <p class="muted" style="margin-top:8px; font-size:.82rem">
        Triângulo: 🔴 vence 🟢 · 🟢 vence 🔵 · 🔵 vence 🔴 (±30% de dano).
        Diferença de +5 de SPD ataca duas vezes.
      </p>
    </div>`;
}

function renderInspectUnit(u) {
  const box = document.getElementById("inspect");
  const aff = AFFINITIES[u.aff];
  box.innerHTML = `
    <h3>${u.name}</h3>
    <div class="unit-inspect">
      <div class="name">${aff.icon} ${aff.label} · ${u.role}</div>
      ${hpBar(u.curHP, u.maxHP)}
      <div style="margin-top:4px; font-size:.8rem" class="muted">${Math.round(u.curHP)}/${u.maxHP} HP</div>
      <div class="grid4">
        <span><b>${u.stats.atk}</b>ATK</span>
        <span><b>${u.stats.def}</b>DEF</span>
        <span><b>${u.stats.spd}</b>SPD</span>
        <span><b>${u.stats.mov}</b>MOV</span>
      </div>
      ${
        u.skill && u.skill.type !== "none" && u.skill.type !== "healer"
          ? `<p class="muted" style="margin-top:8px; font-size:.8rem">${HEROES[heroIdOf(u)]?.skill.name ?? ""}: ${HEROES[heroIdOf(u)]?.skill.text ?? ""}</p>`
          : u.skill?.type === "healer"
          ? `<p class="muted" style="margin-top:8px; font-size:.8rem">Curandeiro: clique num aliado no alcance para curar em vez de atacar.</p>`
          : ""
      }
    </div>`;
}

function inspectEnemy(u) {
  const box = document.getElementById("inspect");
  const aff = AFFINITIES[u.aff];
  box.innerHTML = `
    <h3>${u.name}</h3>
    <div class="unit-inspect">
      <div class="name">${aff.icon} ${aff.label}${u.kind === "boss" ? " · CHEFE" : u.kind === "elite" ? " · Elite" : ""}</div>
      ${hpBar(u.curHP, u.maxHP)}
      <div class="muted" style="margin-top:4px; font-size:.8rem">${Math.round(u.curHP)}/${u.maxHP} HP</div>
      <div class="grid4">
        <span><b>${u.stats.atk}</b>ATK</span>
        <span><b>${u.stats.def}</b>DEF</span>
        <span><b>${u.stats.spd}</b>SPD</span>
        <span><b>${u.stats.mov}</b>MOV</span>
      </div>
      ${enemyTraitText(u) ? `<p class="muted" style="margin-top:8px; font-size:.8rem">${enemyTraitText(u)}</p>` : ""}
    </div>`;
}

function enemyTraitText(u) {
  const t = u.traits || {};
  const bits = [];
  if (t.double) bits.push("ataca duas vezes");
  if (t.bulwark) bits.push(`-${Math.round(t.bulwark * 100)}% dano recebido`);
  if (t.openerBonus) bits.push("primeiro golpe reforçado");
  if (t.omniCounter) bits.push("revida em qualquer alcance");
  if (t.rage) bits.push(`+${t.rage} ATK por turno`);
  if (t.ignoreWheel) bits.push("imune ao triângulo");
  if (t.alwaysCounter) bits.push("sempre revida");
  return bits.join(" · ");
}

function showForecast(target) {
  const box = document.getElementById("inspect");

  // curandeiro mirando aliado ferido
  if (sel.unit.skill?.type === "healer" && target.team === "ally") {
    const amt = (sel.unit.skill.flat || 12) + Math.round(sel.unit.stats.atk * 0.6);
    const to = Math.min(target.maxHP, target.curHP + amt);
    box.innerHTML = `
      <h3>Cura</h3>
      <div class="matchup">
        <div><div class="emoji">${sel.unit.emoji}</div><small>${sel.unit.name}</small></div>
        <div class="vs">→</div>
        <div><div class="emoji">${target.emoji}</div><small>${target.name}</small></div>
      </div>
      <div class="forecast"><div><span>${target.name}</span><b class="adv">${target.curHP} → ${to}</b></div></div>
      <div class="row" style="--g:8px; margin-top:12px">
        <button class="btn btn--primary btn--sm" id="fc-go">Curar (+${to - target.curHP})</button>
        <button class="btn btn--ghost btn--sm" id="fc-cancel">Cancelar</button>
      </div>`;
    document.getElementById("fc-go").addEventListener("click", () => commit({ mode: "heal", targetKey: target.key }));
    document.getElementById("fc-cancel").addEventListener("click", () => renderInspectUnit(sel.unit));
    return;
  }

  const fc = forecast(battle, sel.unit.key, target.key, sel.planTile);
  if (!fc) return;
  sel.target = target;
  const affTxt =
    fc.aff === "adv"
      ? `<span class="adv">Vantagem de afinidade (+30%)</span>`
      : fc.aff === "dis"
      ? `<span class="dis">Desvantagem (-30%)</span>`
      : `<span class="muted">Afinidade neutra</span>`;

  box.innerHTML = `
    <h3>Previsão de Combate</h3>
    <div class="matchup">
      <div><div class="emoji">${sel.unit.emoji}</div><small>${sel.unit.name}</small></div>
      <div class="vs">VS</div>
      <div><div class="emoji">${target.emoji}</div><small>${target.name}</small></div>
    </div>
    <div class="forecast">
      <div><span>${target.name}</span><b>${fc.defFrom} → ${fc.defTo}${fc.kills ? " ☠️" : ""}</b></div>
      <div><span>${sel.unit.name}</span><b>${fc.atkFrom} → ${fc.atkTo}${fc.dies ? " ☠️" : ""}</b></div>
      <div style="margin-top:6px">${affTxt}</div>
    </div>
    <div class="row" style="--g:8px; margin-top:12px">
      <button class="btn btn--primary btn--sm" id="fc-go">${sel.unit.skill?.type === "healer" && target.team === "ally" ? "Curar" : "Confirmar ataque"}</button>
      <button class="btn btn--ghost btn--sm" id="fc-cancel">Cancelar</button>
    </div>`;

  document.getElementById("fc-go").addEventListener("click", () => {
    const mode = sel.unit.skill?.type === "healer" && target.team === "ally" ? "heal" : "attack";
    commit({ mode, targetKey: target.key });
  });
  document.getElementById("fc-cancel").addEventListener("click", () => {
    sel.target = null;
    renderInspectUnit(sel.unit);
  });
}

function renderLog() {
  const log = document.getElementById("log");
  if (!log) return;
  log.innerHTML = battle.log
    .slice(-40)
    .reverse()
    .map((l) => `<p>${l}</p>`)
    .join("");
}

/* --------------------------------------------------------------- end */
function checkEnd() {
  if (!battle.over) return false;
  busy = true;
  if (battle.over === "win") showEnd(true);
  else showEnd(false);
  return true;
}

function showEnd(win) {
  const stage = document.getElementById("stage");
  const node = state.run.map.nodes[nodeId];
  const overlay = h(`
    <div class="battle-end ${win ? "win" : "loss"}">
      <div class="battle-end__inner">
        <div class="battle-end__title">${win ? "VITÓRIA" : "DERROTA"}</div>
        <p class="dim" style="margin-bottom:18px">${
          win
            ? node.type === "boss"
              ? "O chefe foi derrotado."
              : "O caminho está livre."
            : "O esquadrão tombou. A jornada termina aqui."
        }</p>
        <button class="btn btn--primary btn--lg" id="end-cta">${win ? "Recompensas" : "Voltar ao Santuário"}</button>
      </div>
    </div>`);
  stage.appendChild(overlay);

  overlay.querySelector("#end-cta").addEventListener("click", () => {
    if (win) {
      syncSquadHP(battle.units);
      if (!node.cleared) {
        const outcome = recordBattleWin(node);
        router.go("reward", { nodeId, mode: "battle", outcome });
      } else {
        router.go("map");
      }
    } else {
      endRunDefeat();
      router.go("menu");
    }
  });
}

function confirmRetreat() {
  const { box, close } = modal(`
    <h2>Fugir da batalha?</h2>
    <p class="muted" style="margin:10px 0 18px">Conta como derrota — a run termina. Considere lutar até o fim.</p>
    <div class="row">
      <button class="btn btn--primary" data-yes>Fugir (encerra a run)</button>
      <button class="btn btn--ghost" data-no>Continuar lutando</button>
    </div>`);
  box.querySelector("[data-yes]").addEventListener("click", () => {
    close();
    endRunDefeat();
    router.go("menu");
  });
  box.querySelector("[data-no]").addEventListener("click", close);
}
