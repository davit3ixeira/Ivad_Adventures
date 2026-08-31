/**
 * battle.js (UI) — tela de combate tático.
 *
 * Ataque em 1–2 toques:
 *   • toque no seu herói        → azul = mover, alvos com ⚔ pulsando = atacar
 *   • toque num alvo com ⚔      → o herói anda até a melhor casa e ataca
 *   • toque numa casa azul      → só move (dá pra "Voltar")
 *   • toque no próprio herói    → aguarda
 * Especial: botão ✨ quando carregado → mira (se precisar) → banner + efeito na tela.
 */
import { state } from "../core/state.js";
import { router } from "./router.js";
import { modal, toast } from "./toast.js";
import { h, hpBar } from "./components.js";
import { portrait, playSfx } from "../data/manifest.js";
import { HEROES, AFFINITIES } from "../data/heroes.js";
import { key } from "../systems/pathfind.js";
import {
  createBattle,
  computeMoveRange,
  bestAttackTile,
  forecast,
  performAction,
  runEnemyTurn,
  useActive,
  activeNeedsAim,
  activeTargetTiles,
} from "../systems/battle.js";
import { recordBattleWin, endRunDefeat, syncSquadHP } from "../systems/run.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let battle = null;
let nodeId = null;
let busy = false;
let sel = null;
/* sel = {
     unit, origin:{x,y}, moved:bool,
     moveRange:Map<"x,y",cost>,
     targets:Map<enemyKey,{x,y}>,      casas para bater cada inimigo
     healTargets:Map<allyKey,{x,y}>,
     special: null | { tiles:Set<"x,y"> }
   } */

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
        <div class="grid-wrap">
          <div class="grid" id="grid"></div>
        </div>
        <div class="battle__actions" id="actions"></div>
      </div>

      <aside class="battle__side">
        <div class="panel combat-card" id="inspect"></div>
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

/* ───────────────────────────── render ───────────────────────────── */
function paint() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  const g = battle.grid;
  grid.style.gridTemplateColumns = `repeat(${g.w}, var(--cell, 60px))`;

  const moveSet = sel && !sel.special ? sel.moveRange : null;
  const targetTiles = new Set();
  const healTiles = new Set();
  if (sel && !sel.special) {
    sel.targets.forEach((_t, k) => {
      const e = battle.units.find((u) => u.key === k);
      if (e?.alive) targetTiles.add(key(e.x, e.y));
    });
    sel.healTargets.forEach((_t, k) => {
      const a = battle.units.find((u) => u.key === k);
      if (a?.alive) healTiles.add(key(a.x, a.y));
    });
  }
  const specialSet = sel?.special?.tiles ?? null;

  let html = "";
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      const k = key(x, y);
      const cls = ["tile"];
      if (moveSet?.has(k)) cls.push("mv-move");
      if (targetTiles.has(k)) cls.push("mv-attack");
      if (healTiles.has(k)) cls.push("mv-heal");
      if (specialSet?.has(k)) cls.push("mv-special");
      html += `<div class="${cls.join(" ")}" data-terrain="${g.tiles[y][x]}" data-x="${x}" data-y="${y}">`;
      const u = battle.units.find((z) => z.alive && z.x === x && z.y === y);
      if (u) html += unitHTML(u, targetTiles.has(k) || healTiles.has(k));
      html += "</div>";
    }
  }
  grid.innerHTML = html;

  grid.querySelectorAll(".tile").forEach((tile) => {
    tile.addEventListener("click", () => onTile(Number(tile.dataset.x), Number(tile.dataset.y)));
  });
  // previsão ao passar o mouse num alvo (desktop)
  if (sel && !sel.special) {
    grid.querySelectorAll(".tile.mv-attack").forEach((tile) => {
      tile.addEventListener("mouseenter", () => {
        const u = battle.units.find((z) => z.alive && z.x === +tile.dataset.x && z.y === +tile.dataset.y);
        if (u && sel) previewForecast(u);
      });
      tile.addEventListener("mouseleave", () => {
        if (sel && !sel.special) renderInspectUnit(sel.unit);
      });
    });
  }

  renderFloaters();
  renderBanner();
  renderActions();
  renderLog();
  if (!sel) renderInspectDefault();
}

function renderFloaters() {
  const grid = document.getElementById("grid");
  battle.floaters.forEach((f) => {
    const cell = grid.querySelector(`[data-x="${f.x}"][data-y="${f.y}"]`);
    if (!cell) return;
    const fl = document.createElement("div");
    fl.className = `floater floater--${f.kind}`;
    fl.textContent = f.text;
    fl.style.left = "50%";
    fl.style.top = "8%";
    cell.appendChild(fl);
    fl.addEventListener("animationend", () => fl.remove());
  });
  battle.floaters = [];
}

function renderBanner() {
  const banner = document.getElementById("banner");
  banner.className = `battle__banner phase-${battle.phase === "enemy" ? "enemy" : "player"}`;
  const left = battle.units.filter((u) => u.alive && u.team === "ally" && !u.acted).length;
  banner.textContent =
    battle.phase === "enemy"
      ? "⚔️ Turno Inimigo…"
      : `Turno ${battle.turn} · ${left} herói${left === 1 ? "" : "s"} para agir`;
}

function unitHTML(u, highlighted) {
  const side = u.team === "ally" ? "ally" : u.side === "boss" ? "boss" : "enemy";
  const low = u.curHP / u.maxHP <= 0.35;
  const isSel = sel?.unit?.key === u.key ? "is-active" : "";
  const done = u.team === "ally" && u.acted ? "is-done" : "";
  const tgt = highlighted && u.team !== (sel?.unit?.team ?? "") ? "is-target" : "";
  const artId = u.team === "ally" ? heroIdOf(u) : u.enemyId;

  let charge = "";
  let readyCls = "";
  if (u.team === "ally" && u.chargeMax) {
    const ready = u.charge >= u.chargeMax;
    if (ready && !u.acted) readyCls = "is-ready-special";
    const pips = Array.from({ length: u.chargeMax }, (_, i) => `<i class="${i < u.charge ? "on" : ""}"></i>`).join("");
    charge = `<span class="unit__charge ${ready ? "is-ready" : ""}">${ready ? "✨" : pips}</span>`;
  }
  const buffed = u.buffs ? '<span class="unit__buff">▲</span>' : "";
  const guarded = u.guard ? '<span class="unit__buff">🛡️</span>' : "";

  return `
    <div class="unit side-${side} ${isSel} ${done} ${tgt} ${readyCls}" data-unit="${u.key}">
      ${portrait(u.team === "ally" ? "heroes" : "enemies", artId, u.emoji)}
      <span class="unit__aff aff-${u.aff}"></span>
      ${charge}${buffed}${guarded}
      <span class="unit__hp ${low ? "is-low" : ""}"><i style="width:${Math.max(0, (u.curHP / u.maxHP) * 100)}%"></i></span>
    </div>`;
}

function heroIdOf(u) {
  return state.run.squad.find((s) => s.uid === u.uid)?.id;
}

/* ───────────────────────────── seleção ───────────────────────────── */
function selectUnit(unit, keep = false) {
  const origin = keep && sel ? sel.origin : { x: unit.x, y: unit.y };
  const moved = keep && sel ? sel.moved : false;

  const moveRange = computeMoveRange(battle, unit);
  const targets = new Map();
  const healTargets = new Map();
  const isHealer = unit.skill?.type === "healer";
  for (const e of battle.units) {
    if (!e.alive) continue;
    if (e.team !== unit.team) {
      const tile = bestAttackTile(battle, unit, e);
      if (tile) targets.set(e.key, tile);
    } else if (isHealer && e.key !== unit.key && e.curHP < e.maxHP) {
      const tile = bestHealTile(unit, e, moveRange);
      if (tile) healTargets.set(e.key, tile);
    }
  }
  sel = { unit, origin, moved, moveRange, targets, healTargets, special: null };
  renderInspectUnit(unit);
  paint();
}

function bestHealTile(healer, ally, moveRange) {
  let best = null;
  let bestCost = Infinity;
  for (const [k, cost] of moveRange) {
    const [x, y] = k.split(",").map(Number);
    if (Math.abs(x - ally.x) + Math.abs(y - ally.y) <= healer.stats.rng && cost < bestCost) {
      bestCost = cost;
      best = { x, y };
    }
  }
  return best;
}

function deselect() {
  sel = null;
  paint();
}

/* ───────────────────────────── input ───────────────────────────── */
function onTile(x, y) {
  if (busy || battle.phase !== "player" || battle.over) return;
  const unit = battle.units.find((u) => u.alive && u.x === x && u.y === y);

  if (!sel) {
    if (unit && unit.team === "ally" && !unit.acted) selectUnit(unit);
    else if (unit) inspectEnemy(unit);
    return;
  }

  // modo especial: mirar
  if (sel.special) {
    if (sel.special.tiles.has(key(x, y))) castSpecial({ x, y });
    else {
      sel.special = null;
      paint();
    }
    return;
  }

  // clicou num inimigo alcançável → ataca já
  if (unit && sel.targets.has(unit.key)) return attackEnemy(unit);
  // clicou num aliado ferido (curandeiro) → cura já
  if (unit && sel.healTargets.has(unit.key)) return healAlly(unit);
  // clicou noutro herói livre → troca seleção
  if (unit && unit.team === "ally" && unit.key !== sel.unit.key && !unit.acted) return selectUnit(unit);
  // clicou no próprio herói → nada (use "Aguardar")
  if (unit && unit.key === sel.unit.key) return;
  // clicou numa casa azul vazia → move
  if (!unit && sel.moveRange.has(key(x, y))) {
    sel.moved = !(x === sel.origin.x && y === sel.origin.y);
    sel.unit.x = x;
    sel.unit.y = y;
    selectUnit(sel.unit, true);
    return;
  }
}

async function finishTurnIfDone() {
  if (checkEnd()) return;
  if (battle.units.filter((u) => u.alive && u.team === "ally").every((u) => u.acted)) await doEnemyTurn();
}

async function attackEnemy(enemy) {
  const attacker = sel.unit;
  const tile = sel.targets.get(enemy.key);
  const fc = forecast(battle, attacker.key, enemy.key, tile);
  if (fc?.dies && !fc.kills) {
    busy = true;
    const ok = await confirmRisky(attacker, enemy, fc);
    busy = false;
    if (!ok) return;
  }
  busy = true;
  performAction(battle, attacker, { moveTo: tile, mode: "attack", targetKey: enemy.key });
  playSfx("hit");
  sel = null;
  paint();
  await sleep(320);
  busy = false;
  await finishTurnIfDone();
}

async function healAlly(ally) {
  const tile = sel.healTargets.get(ally.key);
  busy = true;
  performAction(battle, sel.unit, { moveTo: tile, mode: "heal", targetKey: ally.key });
  playSfx("heal");
  sel = null;
  paint();
  await sleep(320);
  busy = false;
  await finishTurnIfDone();
}

async function commitWait() {
  busy = true;
  performAction(battle, sel.unit, { moveTo: { x: sel.unit.x, y: sel.unit.y }, mode: "wait" });
  sel = null;
  paint();
  await sleep(120);
  busy = false;
  await finishTurnIfDone();
}

/* ───────────────────────────── especial ───────────────────────────── */
function enterSpecial() {
  const unit = sel.unit;
  if (unit.charge < unit.chargeMax) return;
  if (!activeNeedsAim(unit)) return castSpecial(null);
  const tiles = new Set(activeTargetTiles(battle, unit).map((t) => key(t.x, t.y)));
  if (tiles.size === 0) {
    toast("Sem alvo no alcance — chegue mais perto e tente de novo.", "bad");
    return;
  }
  sel.special = { tiles };
  paint();
}

async function castSpecial(aim) {
  const unit = sel.unit;
  busy = true;
  const data = useActive(battle, unit, aim);
  if (!data) {
    busy = false;
    if (sel) sel.special = null;
    paint();
    return;
  }
  playSfx("special");
  // guarda os floaters de dano para mostrar depois do banner + efeito
  const pending = battle.floaters;
  battle.floaters = [];
  sel = null;
  paint(); // limpa o realce do modo especial
  await showSkillBanner(data);
  await playFx(data);
  battle.floaters = pending;
  paint();
  await sleep(360);
  busy = false;
  await finishTurnIfDone();
}

/* ───────────────────────────── efeitos na tela ───────────────────────────── */
function tileCenter(x, y) {
  const cell = document.querySelector(`#grid [data-x="${x}"][data-y="${y}"]`);
  if (!cell) return null;
  return {
    cx: cell.offsetLeft + cell.offsetWidth / 2,
    cy: cell.offsetTop + cell.offsetHeight / 2,
    w: cell.offsetWidth,
    h: cell.offsetHeight,
  };
}

function showSkillBanner(data) {
  const stage = document.getElementById("stage");
  if (!stage) return sleep(0);
  const el = h(`<div class="skill-banner"><span class="skill-banner__name">${data.name}</span><span class="skill-banner__cry">${data.banner}</span></div>`);
  stage.appendChild(el);
  return sleep(1150).then(() => {
    el.classList.add("is-out");
    setTimeout(() => el.remove(), 300);
  });
}

async function playFx(data) {
  const grid = document.getElementById("grid");
  if (!grid) return;
  const layer = document.createElement("div");
  layer.className = "fx-layer";
  grid.appendChild(layer);

  const spawn = (cls, x, y, extra = {}) => {
    const c = tileCenter(x, y);
    if (!c) return;
    const d = document.createElement("div");
    d.className = cls;
    d.style.left = `${c.cx}px`;
    d.style.top = `${c.cy}px`;
    Object.assign(d.style, extra);
    layer.appendChild(d);
  };

  const fx = data.fx;
  if (fx === "beam") {
    const a = tileCenter(data.from.x, data.from.y);
    const cells = data.affected.length ? data.affected : [data.aim];
    const b = tileCenter(cells[cells.length - 1].x, cells[cells.length - 1].y) || a;
    if (a && b) {
      const dx = b.cx - a.cx;
      const dy = b.cy - a.cy;
      const len = Math.hypot(dx, dy) + a.w;
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      const beam = document.createElement("div");
      beam.className = "fx-beam";
      beam.style.left = `${a.cx}px`;
      beam.style.top = `${a.cy}px`;
      beam.style.width = `${len}px`;
      beam.style.transform = `rotate(${ang}deg)`;
      layer.appendChild(beam);
    }
    cells.forEach((c) => spawn("fx-spark", c.x, c.y));
  } else if (fx === "nova") {
    spawn("fx-nova", data.aim.x, data.aim.y);
    (data.affected || []).forEach((c) => spawn("fx-spark", c.x, c.y));
  } else if (fx === "blast") {
    spawn("fx-blast", data.aim.x, data.aim.y);
    (data.affected || []).forEach((c) => spawn("fx-ring", c.x, c.y));
  } else if (fx === "sparkle") {
    (data.affected || []).forEach((c, i) => setTimeout(() => spawn("fx-heal", c.x, c.y), i * 60));
  } else if (fx === "shield") {
    (data.affected || []).forEach((c) => spawn("fx-dome", c.x, c.y));
  } else if (fx === "rally") {
    (data.affected || []).forEach((c, i) => setTimeout(() => spawn("fx-rally", c.x, c.y), i * 50));
  } else if (fx === "dash") {
    const a = tileCenter(data.from.x, data.from.y);
    const b = tileCenter(data.aim.x, data.aim.y) || a;
    if (a && b) {
      const streak = document.createElement("div");
      streak.className = "fx-beam fx-beam--dash";
      const dx = b.cx - a.cx;
      const dy = b.cy - a.cy;
      streak.style.left = `${a.cx}px`;
      streak.style.top = `${a.cy}px`;
      streak.style.width = `${Math.hypot(dx, dy) || a.w}px`;
      streak.style.transform = `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`;
      layer.appendChild(streak);
    }
    (data.affected || []).forEach((c) => spawn("fx-spark", c.x, c.y));
  } else if (fx === "mirror") {
    spawn("fx-dome", data.from.x, data.from.y);
  }

  await sleep(fx === "sparkle" || fx === "rally" ? 720 : 640);
  layer.remove();
}

/* ───────────────────────────── barra de ações ───────────────────────────── */
function renderActions() {
  const bar = document.getElementById("actions");
  if (!bar) return;
  if (battle.over || battle.phase === "enemy") {
    bar.innerHTML = "";
    return;
  }

  if (!sel) {
    bar.innerHTML = `
      <button class="btn btn--primary" id="end-turn">Encerrar Turno ⏭</button>
      <button class="btn btn--ghost btn--sm" id="retreat">Fugir</button>`;
    bar.querySelector("#end-turn").addEventListener("click", () => doEnemyTurn());
    bar.querySelector("#retreat").addEventListener("click", confirmRetreat);
    return;
  }

  if (sel.special) {
    bar.innerHTML = `<span class="dim" style="font-size:.85rem">Toque numa casa iluminada para lançar <b>${sel.unit.active.name}</b>.</span>
      <button class="btn btn--ghost btn--sm" id="sp-cancel">Cancelar</button>`;
    bar.querySelector("#sp-cancel").addEventListener("click", () => {
      sel.special = null;
      paint();
    });
    return;
  }

  const u = sel.unit;
  const ready = u.chargeMax && u.charge >= u.chargeMax;
  const specBtn = u.chargeMax
    ? `<button class="btn ${ready ? "btn--gold spec-ready" : "btn--ghost"} btn--sm" id="special" ${ready ? "" : "disabled"}>
         ✨ ${u.active.name}${ready ? "" : ` (${u.charge}/${u.chargeMax})`}
       </button>`
    : "";

  bar.innerHTML = `
    <span class="dim" style="font-size:.82rem">${sel.targets.size || sel.healTargets.size ? "Toque num alvo destacado, " : ""}ou numa casa azul.</span>
    ${specBtn}
    <button class="btn btn--sm" id="wait">Aguardar</button>
    ${sel.moved ? '<button class="btn btn--ghost btn--sm" id="back">Voltar</button>' : '<button class="btn btn--ghost btn--sm" id="cancel">Cancelar</button>'}`;

  bar.querySelector("#special")?.addEventListener("click", enterSpecial);
  bar.querySelector("#wait").addEventListener("click", commitWait);
  bar.querySelector("#cancel")?.addEventListener("click", deselect);
  bar.querySelector("#back")?.addEventListener("click", () => {
    sel.moved = false;
    sel.unit.x = sel.origin.x;
    sel.unit.y = sel.origin.y;
    selectUnit(sel.unit, true);
  });
}

/* ───────────────────────────── painel lateral ───────────────────────────── */
function renderInspectDefault() {
  const box = document.getElementById("inspect");
  if (!box) return;
  const allies = battle.units.filter((u) => u.team === "ally");
  const enemies = battle.units.filter((u) => u.team === "enemy" && u.alive);
  box.innerHTML = `
    <h3>Campo de Batalha</h3>
    <div class="unit-inspect">
      <div class="row row--between"><span>Seus heróis</span><b>${allies.filter((u) => u.alive).length}/${allies.length}</b></div>
      <div class="row row--between"><span>Inimigos</span><b>${enemies.length}</b></div>
      <p class="muted" style="margin-top:8px; font-size:.8rem">
        🔴 vence 🟢 · 🟢 vence 🔵 · 🔵 vence 🔴 (±30%). +5 de SPD = ataca 2×.
        O especial ✨ carrega a cada golpe dado ou recebido.
      </p>
    </div>`;
}

function renderInspectUnit(u) {
  const box = document.getElementById("inspect");
  if (!box) return;
  const aff = AFFINITIES[u.aff];
  const def = HEROES[heroIdOf(u)];
  box.innerHTML = `
    <h3>${u.name}</h3>
    <div class="unit-inspect">
      <div class="name">${aff.icon} ${aff.label}</div>
      ${hpBar(u.curHP, u.maxHP)}
      <div class="muted" style="margin-top:4px; font-size:.8rem">${Math.round(u.curHP)}/${u.maxHP} HP${u.buffs ? " · +ATK" : ""}${u.guard ? " · 🛡️ guarda" : ""}</div>
      <div class="grid4">
        <span><b>${u.stats.atk + (u.buffs?.atk || 0)}</b>ATK</span>
        <span><b>${u.stats.def}</b>DEF</span>
        <span><b>${u.stats.spd}</b>SPD</span>
        <span><b>${u.stats.mov}</b>MOV</span>
      </div>
      ${def ? `<p class="skill-p"><b>Passiva · ${def.skill.name}</b><br>${def.skill.text}</p>` : ""}
      ${
        def?.active
          ? `<p class="skill-p ${u.charge >= u.chargeMax ? "is-ready" : ""}"><b>✨ ${def.active.name} — ${
              u.charge >= u.chargeMax ? "PRONTO" : `${u.charge}/${u.chargeMax}`
            }</b><br>${def.active.text}</p>`
          : ""
      }
    </div>`;
}

function previewForecast(target) {
  const box = document.getElementById("inspect");
  if (!box || !sel) return;
  const tile = sel.targets.get(target.key);
  const fc = forecast(battle, sel.unit.key, target.key, tile);
  if (!fc) return;
  const affTxt =
    fc.aff === "adv" ? '<span class="adv">vantagem +30%</span>' : fc.aff === "dis" ? '<span class="dis">desvantagem −30%</span>' : '<span class="muted">neutro</span>';
  box.innerHTML = `
    <h3>Previsão</h3>
    <div class="matchup">
      <div><span class="emoji">${sel.unit.emoji}</span><small>${sel.unit.name}</small></div>
      <div class="vs">⚔</div>
      <div><span class="emoji">${target.emoji}</span><small>${target.name}</small></div>
    </div>
    <div class="forecast">
      <div><span>${target.name}</span><b>${fc.defFrom} → ${fc.defTo}${fc.kills ? " ☠️" : ""}</b></div>
      <div><span>${sel.unit.name}</span><b>${fc.atkFrom} → ${fc.atkTo}${fc.dies ? " ☠️" : ""}</b></div>
      <div style="margin-top:5px">${affTxt}</div>
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
      ${enemyTraitText(u) ? `<p class="skill-p">${enemyTraitText(u)}</p>` : ""}
    </div>`;
}

function enemyTraitText(u) {
  const t = u.traits || {};
  const bits = [];
  if (t.double) bits.push("ataca duas vezes");
  if (t.bulwark) bits.push(`−${Math.round(t.bulwark * 100)}% dano recebido`);
  if (t.openerBonus) bits.push("primeiro golpe reforçado");
  if (t.omniCounter) bits.push("revida a qualquer alcance");
  if (t.rage) bits.push(`+${t.rage} ATK por turno`);
  if (t.ignoreWheel) bits.push("imune ao triângulo");
  if (t.alwaysCounter) bits.push("sempre revida");
  return bits.join(" · ");
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

/* ───────────────────────────── turno inimigo ───────────────────────────── */
async function doEnemyTurn() {
  if (busy && battle.phase === "enemy") return;
  busy = true;
  sel = null;
  await runEnemyTurn(battle, { render: paint, sleep, afterCombat: () => playSfx("hit") });
  busy = false;
  checkEnd();
}

/* ───────────────────────────── fim ───────────────────────────── */
function checkEnd() {
  if (!battle.over) return false;
  busy = true;
  showEnd(battle.over === "win");
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
          win ? (node.type === "boss" ? "O chefe foi derrotado." : "O caminho está livre.") : "O esquadrão tombou. A jornada termina aqui."
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
      } else router.go("map");
    } else {
      endRunDefeat();
      router.go("menu");
    }
  });
}

function confirmRisky(unit, enemy, fc) {
  return new Promise((resolve) => {
    const { box, close } = modal(`
      <h2>Ataque arriscado</h2>
      <p class="muted" style="margin:8px 0 4px">A previsão diz que <b>${unit.name}</b> pode cair neste ataque.</p>
      <div class="forecast" style="margin:12px 0">
        <div><span>${enemy.name}</span><b>${fc.defFrom} → ${fc.defTo}${fc.kills ? " ☠️" : ""}</b></div>
        <div><span>${unit.name}</span><b class="dis">${fc.atkFrom} → ${fc.atkTo} ☠️</b></div>
      </div>
      <div class="row">
        <button class="btn btn--primary" data-yes>Atacar mesmo assim</button>
        <button class="btn btn--ghost" data-no>Cancelar</button>
      </div>`);
    box.querySelector("[data-yes]").addEventListener("click", () => {
      close();
      resolve(true);
    });
    box.querySelector("[data-no]").addEventListener("click", () => {
      close();
      resolve(false);
    });
  });
}

function confirmRetreat() {
  const { box, close } = modal(`
    <h2>Fugir da batalha?</h2>
    <p class="muted" style="margin:10px 0 18px">Conta como derrota — a run termina.</p>
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
