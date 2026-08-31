/**
 * battle.js (UI) — tela de combate tático.
 *
 * Fluxo:
 *   • toque no herói           → azul = mover (dentro do alcance!), ⚔ = alvos
 *   • toque num alvo ⚔         → herói vai até a melhor casa e MOSTRA a previsão
 *   • toque de novo / "ATACAR" → confirma o golpe
 *   • toque numa casa azul     → só move (uma vez, dá pra "Voltar")
 *   • ✨ Especial              → quando carregado: mira → banner + efeito na tela
 *
 * O herói só se move DE VERDADE quando a ação é confirmada; tudo antes é
 * provisório e limitado ao alcance calculado no momento da seleção.
 */
import { state } from "../core/state.js";
import { router } from "./router.js";
import { modal, toast } from "./toast.js";
import { h, hpBar } from "./components.js";
import { portrait, playSfx } from "../data/manifest.js";
import { HEROES } from "../data/heroes.js";
import { key } from "../systems/pathfind.js";
import { typeClass, typeLabel, typeIcons } from "../systems/affinity.js";
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
  canFuse,
  doFusion,
} from "../systems/battle.js";
import { recordBattleWin, endRunDefeat, syncSquadHP } from "../systems/run.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const md = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

let battle = null;
let nodeId = null;
let busy = false;
let sel = null;
/* sel = {
     unit, origin:{x,y},
     moveRange: Map<"x,y",cost>,        FIXO — calculado uma vez na seleção
     dest: {x,y},                       posição provisória (origin, ou casa azul tocada)
     movedManually: bool,
     targetsAll: Map<enemyKey,{x,y}>,   melhor casa p/ bater cada inimigo (alcance todo)
     healAll: Map<allyKey,{x,y}>,
     armed: null | { enemyKey, tile:{x,y}, fc },
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
        <div class="grid-wrap"><div class="grid" id="grid"></div></div>
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

/* ───────────────────────── posição visual do herói ───────────────────────── */
function heroPos() {
  if (!sel) return null;
  return sel.armed ? sel.armed.tile : sel.dest;
}
function unitRenderedAt(x, y) {
  const real = battle.units.find((z) => z.alive && z.x === x && z.y === y);
  if (!sel || sel.special) return real;
  const p = heroPos();
  if (p && p.x === x && p.y === y && sel.unit.alive) return sel.unit;
  if (real && real.key === sel.unit.key) return null; // desenhado em `dest`, não na origem
  return real;
}

/* ───────────────────────── alvos conforme o estado ───────────────────────── */
function currentTargets() {
  if (!sel) return new Map();
  if (sel.movedManually) {
    const m = new Map();
    for (const e of battle.units) {
      if (!e.alive || e.team === sel.unit.team) continue;
      const d = md(e, sel.dest);
      if (d >= 1 && d <= sel.unit.stats.rng) m.set(e.key, { x: sel.dest.x, y: sel.dest.y });
    }
    return m;
  }
  return sel.targetsAll;
}
function currentHealTargets() {
  if (!sel || sel.unit.skill?.type !== "healer") return new Map();
  if (sel.movedManually) {
    const m = new Map();
    for (const a of battle.units) {
      if (!a.alive || a.team !== sel.unit.team || a.key === sel.unit.key || a.curHP >= a.maxHP) continue;
      if (md(a, sel.dest) <= sel.unit.stats.rng) m.set(a.key, { x: sel.dest.x, y: sel.dest.y });
    }
    return m;
  }
  return sel.healAll;
}

/* ───────────────────────────── render ───────────────────────────── */
function paint() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  const g = battle.grid;
  grid.style.setProperty("--cell", "60px");
  grid.style.gridTemplateColumns = `repeat(${g.w}, 60px)`;

  const moveSet = sel && !sel.special ? sel.moveRange : null;
  const tgts = sel && !sel.special ? currentTargets() : new Map();
  const heals = sel && !sel.special ? currentHealTargets() : new Map();
  const specialSet = sel?.special?.tiles ?? null;

  const tgtTiles = new Set();
  tgts.forEach((_v, k) => {
    const e = battle.units.find((u) => u.key === k);
    if (e?.alive) tgtTiles.add(key(e.x, e.y));
  });
  const healTiles = new Set();
  heals.forEach((_v, k) => {
    const a = battle.units.find((u) => u.key === k);
    if (a?.alive) healTiles.add(key(a.x, a.y));
  });

  let html = "";
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      const k = key(x, y);
      const cls = ["tile"];
      if (moveSet?.has(k)) cls.push("mv-move");
      if (tgtTiles.has(k)) cls.push("mv-attack");
      if (healTiles.has(k)) cls.push("mv-heal");
      if (specialSet?.has(k)) cls.push("mv-special");
      html += `<div class="${cls.join(" ")}" data-terrain="${g.tiles[y][x]}" data-x="${x}" data-y="${y}">`;
      const u = unitRenderedAt(x, y);
      if (u) {
        const armedHere = sel?.armed?.enemyKey === u.key;
        html += unitHTML(u, tgtTiles.has(k) || healTiles.has(k), armedHere);
      }
      html += "</div>";
    }
  }
  grid.innerHTML = html;

  grid.querySelectorAll(".tile").forEach((tile) => {
    tile.addEventListener("click", () => onTile(+tile.dataset.x, +tile.dataset.y));
  });
  if (sel && !sel.special && !sel.armed) {
    grid.querySelectorAll(".tile.mv-attack").forEach((tile) => {
      tile.addEventListener("mouseenter", () => {
        const e = battle.units.find((z) => z.alive && z.x === +tile.dataset.x && z.y === +tile.dataset.y);
        if (e && sel) previewForecast(e, tgts.get(e.key));
      });
      tile.addEventListener("mouseleave", () => {
        if (sel && !sel.special && !sel.armed) renderInspectUnit(sel.unit);
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
  const b = document.getElementById("banner");
  if (!b) return;
  b.className = `battle__banner phase-${battle.phase === "enemy" ? "enemy" : "player"}`;
  const left = battle.units.filter((u) => u.alive && u.team === "ally" && !u.acted).length;
  b.textContent =
    battle.phase === "enemy" ? "⚔️ Turno Inimigo…" : `Turno ${battle.turn} · ${left} herói${left === 1 ? "" : "s"} para agir`;
}

function unitHTML(u, highlighted, armed) {
  const side = u.team === "ally" ? "ally" : u.side === "boss" ? "boss" : "enemy";
  const low = u.curHP / u.maxHP <= 0.35;
  const isSel = sel?.unit?.key === u.key ? "is-active" : "";
  const done = u.team === "ally" && u.acted ? "is-done" : "";
  const tgtCls = highlighted && u.team === "enemy" ? "is-target" : "";
  const armedCls = armed ? "is-armed" : "";
  const bigCls = u.big ? "is-big" : "";
  const artId = u.team === "ally" ? heroIdOf(u) : u.enemyId;

  let charge = "";
  let readyCls = "";
  if (u.team === "ally" && u.chargeMax) {
    const ready = u.charge >= u.chargeMax;
    if (ready && !u.acted) readyCls = "is-ready-special";
    const pct = Math.min(100, (u.charge / u.chargeMax) * 100);
    charge = `<span class="unit__charge ${ready ? "is-ready" : ""}" title="Especial ${u.charge}/${u.chargeMax}"><i style="width:${pct}%"></i>${
      ready ? "<em>✨</em>" : ""
    }</span>`;
  }
  const buff = u.buffs ? '<span class="unit__buff">▲</span>' : u.guard ? '<span class="unit__buff">🛡️</span>' : "";

  return `
    <div class="unit side-${side} ${isSel} ${done} ${tgtCls} ${armedCls} ${readyCls} ${bigCls}" data-unit="${u.key}">
      ${portrait(u.team === "ally" ? "heroes" : "enemies", artId, u.emoji)}
      <span class="unit__aff aff-${typeClass(u.types)}"></span>
      ${charge}${buff}
      <span class="unit__hp ${low ? "is-low" : ""}"><i style="width:${Math.max(0, (u.curHP / u.maxHP) * 100)}%"></i></span>
    </div>`;
}

function heroIdOf(u) {
  return u.heroId || state.run.squad.find((s) => s.uid === u.uid)?.id;
}

/* ───────────────────────────── seleção ───────────────────────────── */
function selectUnit(unit) {
  const moveRange = computeMoveRange(battle, unit); // ← calculado UMA vez, da posição real
  const targetsAll = new Map();
  const healAll = new Map();
  const isHealer = unit.skill?.type === "healer";
  for (const e of battle.units) {
    if (!e.alive) continue;
    if (e.team !== unit.team) {
      const t = bestAttackTile(battle, unit, e);
      if (t) targetsAll.set(e.key, t);
    } else if (isHealer && e.key !== unit.key && e.curHP < e.maxHP) {
      const t = bestReachTile(unit, e, moveRange);
      if (t) healAll.set(e.key, t);
    }
  }
  sel = {
    unit,
    origin: { x: unit.x, y: unit.y },
    moveRange,
    dest: { x: unit.x, y: unit.y },
    movedManually: false,
    targetsAll,
    healAll,
    armed: null,
    special: null,
  };
  renderInspectUnit(unit);
  paint();
}

function bestReachTile(actor, target, moveRange) {
  let best = null;
  let bestCost = Infinity;
  for (const [k, cost] of moveRange) {
    const [x, y] = k.split(",").map(Number);
    if (Math.abs(x - target.x) + Math.abs(y - target.y) <= actor.stats.rng && cost < bestCost) {
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
  const hit = unitRenderedAt(x, y);

  if (!sel) {
    if (hit && hit.team === "ally" && !hit.acted) selectUnit(hit);
    else if (hit && hit.team === "enemy") inspectEnemy(hit);
    return;
  }

  if (sel.special) {
    if (sel.special.tiles.has(key(x, y))) castSpecial({ x, y });
    else {
      sel.special = null;
      paint();
    }
    return;
  }

  const tgts = currentTargets();
  const heals = currentHealTargets();

  // já mirado: segundo toque no MESMO inimigo confirma
  if (sel.armed) {
    if (hit && hit.key === sel.armed.enemyKey) return confirmAttack();
    if (hit && tgts.has(hit.key)) return armEnemy(hit, tgts.get(hit.key)); // mira outro
    if (hit && hit.team === "ally" && hit.key !== sel.unit.key && !hit.acted) return selectUnit(hit);
    if (!hit && sel.moveRange.has(key(x, y))) return moveTo(x, y); // solta a mira e anda
    return disarm();
  }

  if (hit && tgts.has(hit.key)) return armEnemy(hit, tgts.get(hit.key));
  if (hit && heals.has(hit.key)) return healAlly(hit, heals.get(hit.key));
  if (hit && hit.team === "ally" && hit.key !== sel.unit.key && !hit.acted) return selectUnit(hit);
  if (hit && hit.key === sel.unit.key) return; // usa "Aguardar"
  if (!hit && sel.moveRange.has(key(x, y))) return moveTo(x, y);
}

function moveTo(x, y) {
  if (busy || !sel) return;
  sel.dest = { x, y };
  sel.movedManually = !(x === sel.origin.x && y === sel.origin.y);
  sel.armed = null;
  renderInspectUnit(sel.unit);
  paint();
}

function armEnemy(enemy, tile) {
  if (busy || !sel) return;
  const fc = forecast(battle, sel.unit.key, enemy.key, tile);
  sel.armed = { enemyKey: enemy.key, tile: { x: tile.x, y: tile.y }, fc };
  paint();
  renderArmedPanel(enemy, fc);
}

function disarm() {
  if (!sel) return;
  sel.armed = null;
  renderInspectUnit(sel.unit);
  paint();
}

async function finishTurnIfDone() {
  if (checkEnd()) return;
  if (battle.units.filter((u) => u.alive && u.team === "ally").every((u) => u.acted)) await doEnemyTurn();
}

async function confirmAttack() {
  if (busy || !sel?.armed) return;
  const armed = sel.armed;
  const enemy = battle.units.find((u) => u.key === armed.enemyKey);
  if (!enemy?.alive) return disarm();
  busy = true;
  performAction(battle, sel.unit, { moveTo: armed.tile, mode: "attack", targetKey: armed.enemyKey });
  playSfx("hit");
  sel = null;
  paint();
  await sleep(340);
  busy = false;
  await finishTurnIfDone();
}

async function healAlly(ally, tile) {
  if (busy || !sel) return;
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
  if (busy || !sel) return;
  busy = true;
  performAction(battle, sel.unit, { moveTo: sel.dest, mode: "wait" });
  sel = null;
  paint();
  await sleep(120);
  busy = false;
  await finishTurnIfDone();
}

/* ───────────────────────────── especial ───────────────────────────── */
function enterSpecial() {
  if (busy || !sel) return;
  const u = sel.unit;
  if (u.charge < u.chargeMax) return;
  // o especial parte da posição atual do herói e mira/reposiciona sozinho
  sel.armed = null;
  sel.dest = { x: sel.origin.x, y: sel.origin.y };
  sel.movedManually = false;
  if (!activeNeedsAim(u)) return castSpecial(null);
  const tiles = new Set(activeTargetTiles(battle, u).map((t) => key(t.x, t.y)));
  if (tiles.size === 0) {
    toast("Sem alvo no alcance do especial — chegue mais perto.", "bad");
    return;
  }
  sel.special = { tiles };
  paint();
}

async function castSpecial(aim) {
  if (!sel) return;
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
  const pending = battle.floaters;
  battle.floaters = [];
  sel = null;
  paint();
  await showSkillBanner(data);
  await playFx(data);
  battle.floaters = pending;
  paint();
  await sleep(380);
  busy = false;
  await finishTurnIfDone();
}

async function castFusion() {
  if (busy || !canFuse(battle)) return;
  busy = true;
  sel = null;
  const data = doFusion(battle);
  if (!data) {
    busy = false;
    paint();
    return;
  }
  playSfx("special");
  paint();
  document.getElementById("stage")?.classList.add("shake");
  setTimeout(() => document.getElementById("stage")?.classList.remove("shake"), 450);
  await showSkillBanner(data);
  await playFx(data);
  paint();
  await sleep(300);
  busy = false;
  await finishTurnIfDone();
}

/* ───────────────────────────── efeitos na tela ───────────────────────────── */
function tileCenter(x, y) {
  const cell = document.querySelector(`#grid [data-x="${x}"][data-y="${y}"]`);
  if (!cell) return null;
  return { cx: cell.offsetLeft + cell.offsetWidth / 2, cy: cell.offsetTop + cell.offsetHeight / 2, w: cell.offsetWidth };
}

function showSkillBanner(data) {
  const stage = document.getElementById("stage");
  if (!stage) return sleep(0);
  const el = h(
    `<div class="skill-banner"><span class="skill-banner__name">${data.name}</span><span class="skill-banner__cry">${data.banner}</span></div>`
  );
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

  const spawn = (cls, x, y) => {
    const c = tileCenter(x, y);
    if (!c) return;
    const d = document.createElement("div");
    d.className = cls;
    d.style.left = `${c.cx}px`;
    d.style.top = `${c.cy}px`;
    layer.appendChild(d);
  };
  const beamFrom = (fromPt, toPt, cls) => {
    const a = tileCenter(fromPt.x, fromPt.y);
    const b = tileCenter(toPt.x, toPt.y) || a;
    if (!a) return;
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const el = document.createElement("div");
    el.className = cls;
    el.style.left = `${a.cx}px`;
    el.style.top = `${a.cy}px`;
    el.style.width = `${Math.hypot(dx, dy) + a.w}px`;
    el.style.transform = `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`;
    layer.appendChild(el);
  };

  const fx = data.fx;
  const affected = data.affected || [];
  if (fx === "beam") {
    beamFrom(data.from, affected[affected.length - 1] || data.aim, "fx-beam");
    affected.forEach((c) => spawn("fx-spark", c.x, c.y));
  } else if (fx === "impact") {
    document.getElementById("stage")?.classList.add("shake");
    setTimeout(() => document.getElementById("stage")?.classList.remove("shake"), 400);
    spawn("fx-impact", data.aim.x, data.aim.y);
    spawn("fx-nova", data.aim.x, data.aim.y);
  } else if (fx === "nova") {
    spawn("fx-nova", data.aim.x, data.aim.y);
    affected.forEach((c) => spawn("fx-spark", c.x, c.y));
  } else if (fx === "blast") {
    spawn("fx-blast", data.aim.x, data.aim.y);
    affected.forEach((c) => spawn("fx-ring", c.x, c.y));
  } else if (fx === "sparkle") {
    affected.forEach((c, i) => setTimeout(() => spawn("fx-heal", c.x, c.y), i * 55));
  } else if (fx === "shield") {
    affected.forEach((c) => spawn("fx-dome", c.x, c.y));
  } else if (fx === "rally") {
    affected.forEach((c, i) => setTimeout(() => spawn("fx-rally", c.x, c.y), i * 45));
  } else if (fx === "dash") {
    beamFrom(data.from, data.aim, "fx-beam fx-beam--dash");
    affected.forEach((c) => spawn("fx-spark", c.x, c.y));
  } else if (fx === "mirror") {
    spawn("fx-dome", data.from.x, data.from.y);
  }

  await sleep(fx === "sparkle" || fx === "rally" ? 820 : 660);
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
    const fuse = canFuse(battle);
    bar.innerHTML = `
      ${fuse ? '<button class="btn btn--gold spec-ready" id="fuse">⚡ FUSÃO — Ivad + Oaoj</button>' : ""}
      <button class="btn btn--primary" id="end-turn">Encerrar Turno ⏭</button>
      <button class="btn btn--ghost btn--sm" id="retreat">Fugir</button>`;
    bar.querySelector("#fuse")?.addEventListener("click", castFusion);
    bar.querySelector("#end-turn").addEventListener("click", () => doEnemyTurn());
    bar.querySelector("#retreat").addEventListener("click", confirmRetreat);
    return;
  }

  if (sel.special) {
    bar.innerHTML = `<span class="dim" style="font-size:.85rem">Toque numa casa roxa para lançar <b>${sel.unit.active.name}</b>.</span>
      <button class="btn btn--ghost btn--sm" id="sp-cancel">Cancelar</button>`;
    bar.querySelector("#sp-cancel").addEventListener("click", () => {
      sel.special = null;
      paint();
    });
    return;
  }

  if (sel.armed) {
    const enemy = battle.units.find((u) => u.key === sel.armed.enemyKey);
    bar.innerHTML = `
      <button class="btn btn--primary" id="do-attack">⚔ ATACAR ${enemy ? enemy.name : ""}</button>
      <button class="btn btn--ghost btn--sm" id="disarm">Voltar</button>`;
    bar.querySelector("#do-attack").addEventListener("click", confirmAttack);
    bar.querySelector("#disarm").addEventListener("click", disarm);
    return;
  }

  const u = sel.unit;
  const ready = u.chargeMax && u.charge >= u.chargeMax;
  const spec = u.chargeMax
    ? `<button class="btn ${ready ? "btn--gold spec-ready" : "btn--ghost"} btn--sm" id="special" ${ready ? "" : "disabled"}>
         ✨ ${u.active.name}${ready ? "" : ` ${u.charge}/${u.chargeMax}`}</button>`
    : "";
  bar.innerHTML = `
    <span class="dim" style="font-size:.8rem">Toque num alvo ⚔ ou numa casa azul.</span>
    ${spec}
    <button class="btn btn--sm" id="wait">Aguardar</button>
    ${
      sel.movedManually
        ? '<button class="btn btn--ghost btn--sm" id="back">Voltar</button>'
        : '<button class="btn btn--ghost btn--sm" id="cancel">Cancelar</button>'
    }`;
  bar.querySelector("#special")?.addEventListener("click", enterSpecial);
  bar.querySelector("#wait").addEventListener("click", commitWait);
  bar.querySelector("#cancel")?.addEventListener("click", deselect);
  bar.querySelector("#back")?.addEventListener("click", () => {
    sel.dest = { x: sel.origin.x, y: sel.origin.y };
    sel.movedManually = false;
    renderInspectUnit(sel.unit);
    paint();
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
        ⚔️ Físico › 🟢 Projeção › 🔵 Mana › ⚔️ (±30%). +5 de SPD = ataca 2×.<br>
        2 tipos = mais neutro · 3 tipos = Divino (ignora o triângulo).<br>
        O especial ✨ ganha 1 carga por turno para o último herói que você usar.
      </p>
    </div>`;
}

function renderInspectUnit(u) {
  const box = document.getElementById("inspect");
  if (!box) return;
  const def = HEROES[heroIdOf(u)];
  box.innerHTML = `
    <h3>${u.name}</h3>
    <div class="unit-inspect">
      <div class="name">${typeIcons(u.types)} ${typeLabel(u.types)}</div>
      ${hpBar(u.curHP, u.maxHP)}
      <div class="muted" style="margin-top:4px; font-size:.8rem">${Math.round(u.curHP)}/${u.maxHP} HP${u.buffs ? " · +ATK" : ""}${u.guard ? " · 🛡️" : ""}</div>
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

function fcPanel(atkName, defName, fc) {
  const aff =
    fc.aff === "adv" ? '<span class="adv">vantagem +30%</span>' : fc.aff === "dis" ? '<span class="dis">desvantagem −30%</span>' : '<span class="muted">neutro</span>';
  return `
    <div class="forecast">
      <div><span>${defName}</span><b>${fc.defFrom} → ${fc.defTo}${fc.kills ? " ☠️" : ""}</b></div>
      <div><span>${atkName}</span><b class="${fc.dies ? "dis" : ""}">${fc.atkFrom} → ${fc.atkTo}${fc.dies ? " ☠️" : ""}</b></div>
      <div style="margin-top:5px">${aff}</div>
    </div>`;
}

function previewForecast(enemy, tile) {
  const box = document.getElementById("inspect");
  if (!box || !sel) return;
  const fc = forecast(battle, sel.unit.key, enemy.key, tile || sel.dest);
  if (!fc) return;
  box.innerHTML = `<h3>Previsão</h3>
    <div class="matchup">
      <div><span class="emoji">${sel.unit.emoji}</span><small>${sel.unit.name}</small></div>
      <div class="vs">⚔</div>
      <div><span class="emoji">${enemy.emoji}</span><small>${enemy.name}</small></div>
    </div>${fcPanel(sel.unit.name, enemy.name, fc)}`;
}

function renderArmedPanel(enemy, fc) {
  const box = document.getElementById("inspect");
  if (!box) return;
  box.innerHTML = `<h3>Confirmar ataque</h3>
    <div class="matchup">
      <div><span class="emoji">${sel.unit.emoji}</span><small>${sel.unit.name}</small></div>
      <div class="vs">⚔</div>
      <div><span class="emoji">${enemy.emoji}</span><small>${enemy.name}</small></div>
    </div>
    ${fcPanel(sel.unit.name, enemy.name, fc)}
    ${fc.dies && !fc.kills ? '<p class="dis" style="font-size:.8rem;margin-top:6px">⚠️ Este golpe pode derrubar seu herói.</p>' : ""}`;
}

function inspectEnemy(u) {
  const box = document.getElementById("inspect");
  box.innerHTML = `
    <h3>${u.name}</h3>
    <div class="unit-inspect">
      <div class="name">${typeIcons(u.types)} ${typeLabel(u.types)}${u.kind === "boss" ? " · CHEFE" : u.kind === "elite" ? " · Elite" : ""}</div>
      ${hpBar(u.curHP, u.maxHP)}
      <div class="muted" style="margin-top:4px; font-size:.8rem">${Math.round(u.curHP)}/${u.maxHP} HP</div>
      <div class="grid4">
        <span><b>${u.stats.atk}</b>ATK</span><span><b>${u.stats.def}</b>DEF</span>
        <span><b>${u.stats.spd}</b>SPD</span><span><b>${u.stats.mov}</b>MOV</span>
      </div>
      ${enemyTraitText(u) ? `<p class="skill-p">${enemyTraitText(u)}</p>` : ""}
    </div>`;
}

function enemyTraitText(u) {
  const t = u.traits || {};
  const b = [];
  if (t.double) b.push("ataca duas vezes");
  if (t.bulwark) b.push(`−${Math.round(t.bulwark * 100)}% dano recebido`);
  if (t.openerBonus) b.push("primeiro golpe reforçado");
  if (t.omniCounter) b.push("revida a qualquer alcance");
  if (t.rage) b.push(`+${t.rage} ATK por turno`);
  if (t.ignoreWheel) b.push("divino — ignora o triângulo");
  if (t.alwaysCounter) b.push("sempre revida");
  if (t.cleave) b.push(`golpe em área (${Math.round(t.cleave * 100)}%)`);
  return b.join(" · ");
}

function renderLog() {
  const log = document.getElementById("log");
  if (!log) return;
  log.innerHTML = battle.log.slice(-40).reverse().map((l) => `<p>${l}</p>`).join("");
}

/* ───────────────────────────── turno inimigo / fim ───────────────────────────── */
async function doEnemyTurn() {
  if (busy || battle.phase === "enemy" || battle.over) return;
  busy = true;
  sel = null;
  await runEnemyTurn(battle, { render: paint, sleep, afterCombat: () => playSfx("hit") });
  busy = false;
  if (!checkEnd()) paint();
}

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
      syncSquadHP(battle.units, battle.fusion);
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

function confirmRetreat() {
  if (busy) return;
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
