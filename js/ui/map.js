/**
 * map.js — Mapa roguelike de nós ramificados.
 */
import { state } from "../core/state.js";
import { bus } from "../core/bus.js";
import { router } from "./router.js";
import { modal, toast } from "./toast.js";
import { h } from "./components.js";
import { NODE_META } from "../systems/mapgen.js";
import { startRun, optionsFrom, currentNode, travelTo, endRunVictory } from "../systems/run.js";
import { getChapter } from "../data/chapters.js";
import { ENEMIES } from "../data/enemies.js";
import { HEROES } from "../data/heroes.js";
import { RELICS_BY_ID } from "../data/relics.js";
import { UPGRADES_BY_ID } from "../data/upgrades.js";
import { portrait } from "../data/manifest.js";

export function renderMap(mount, params = {}) {
  if (params.newRun) {
    const res = startRun(params.newRun);
    if (res.error) {
      toast("Escale um esquadrão primeiro.", "bad");
      return router.go("roster");
    }
    showChapterIntro(getChapter(params.newRun));
  }

  const run = state.run;
  if (!run) return router.go("menu");

  const chapter = getChapter(run.chapter);
  const cur = currentNode();
  const opts = new Set(optionsFrom().map((n) => n.id));

  // retoma um combate pendente (ex.: refresh no meio da batalha)
  if (!cur.cleared && (cur.type === "battle" || cur.type === "elite" || cur.type === "boss")) {
    return router.go("battle", { nodeId: cur.id });
  }

  // segurança: chefe já vencido mas run não encerrada (ex.: refresh no meio do epílogo)
  if (cur.type === "boss" && cur.cleared) {
    const done = h(`
      <section class="center" style="min-height:60vh; text-align:center">
        <div>
          <div style="font-size:4rem">${chapter.scene}</div>
          <h1 class="screen-title" style="margin:10px 0">Capítulo ${chapter.id} concluído</h1>
          <p class="screen-sub" style="margin:0 auto 22px">${chapter.outro}</p>
          <button class="btn btn--primary btn--lg" data-fin>Voltar ao Santuário</button>
        </div>
      </section>`);
    done.querySelector("[data-fin]").addEventListener("click", () => {
      endRunVictory();
      router.go("menu");
    });
    mount.appendChild(done);
    return;
  }

  const nodes = run.map.nodes;

  // arestas (desenhadas já no template para evitar innerHTML em <svg>)
  let paths = "";
  for (const n of Object.values(nodes)) {
    for (const nextId of n.next) {
      const t = nodes[nextId];
      const open = n.id === cur.id && opts.has(nextId);
      paths += `<path d="M ${n.x} ${n.y} L ${t.x} ${t.y}" class="${open ? "is-open" : ""}" />`;
    }
  }

  const el = h(`
    <section>
      <div class="screen-head row row--between">
        <div>
          <div class="eyebrow">Capítulo ${chapter.id} · ${chapter.locale}</div>
          <h1 class="screen-title">${chapter.scene} ${chapter.name}</h1>
        </div>
        <button class="btn btn--ghost btn--sm" data-nav="menu">☰ Santuário</button>
      </div>

      <div class="run-hud" id="run-hud"></div>

      <div class="map-scroll">
        <div class="map-board" id="map-board" style="width:${run.map.width}px; height:${run.map.height}px">
          <svg class="map-edges" viewBox="0 0 ${run.map.width} ${run.map.height}">${paths}</svg>
        </div>
      </div>
      <p class="muted" style="text-align:center; margin-top:12px; font-size:.85rem">
        Escolha um caminho iluminado. Cada passo é definitivo.
      </p>
    </section>
  `);
  mount.appendChild(el);

  renderHud(el.querySelector("#run-hud"));
  const board = el.querySelector("#map-board");

  // nós
  for (const n of Object.values(nodes)) {
    const meta = NODE_META[n.type];
    const reachable = n.id === cur.id ? false : opts.has(n.id);
    const cls = [
      "map-node",
      `type-${n.type}`,
      n.id === cur.id ? "is-current" : "",
      reachable ? "is-reachable" : "",
      n.cleared ? "is-cleared" : "",
    ].join(" ");

    let label = meta.label;
    if (n.enemyId && ENEMIES[n.enemyId]) label = ENEMIES[n.enemyId].name;

    const node = h(`
      <div class="${cls}" style="left:${n.x}px; top:${n.y}px" title="${label}">
        ${meta.icon}<small>${reachable || n.id === cur.id ? label : ""}</small>
      </div>`);

    if (reachable) node.addEventListener("click", () => enterNode(n));
    board.appendChild(node);
  }

  const off = bus.on("run:changed", () => {
    if (!document.body.contains(el)) return off();
    renderHud(el.querySelector("#run-hud"));
  });
}

function renderHud(hud) {
  const run = state.run;
  hud.innerHTML = `
    <div class="run-hud__party">
      ${run.squad
        .map((u) => {
          const low = u.curHP / u.base.maxHP <= 0.35;
          const cm = HEROES[u.id]?.active?.charge || 0;
          const cpct = cm ? Math.min(100, ((u.charge || 0) / cm) * 100) : 0;
          const ready = cm && (u.charge || 0) >= cm;
          return `<span class="run-hud__unit ${u.curHP <= 0 ? "is-down" : ""}" title="${u.name} · Especial ${u.charge || 0}/${cm}">
            ${portrait("heroes", u.id, u.emoji)}
            <span class="run-hud__hp ${low ? "is-low" : ""}">${Math.max(0, Math.round(u.curHP))}/${u.base.maxHP}</span>
            ${cm ? `<span class="run-hud__spec ${ready ? "is-ready" : ""}"><i style="width:${cpct}%"></i></span>` : ""}
          </span>`;
        })
        .join("")}
    </div>
    <span class="run-hud__unit" title="Gemas — moeda da run">💎 <b>${run.gemas}</b></span>
    <span class="run-hud__unit" title="Fragmentos Universais">💠 <b>${state.meta.frag}</b></span>
    <div class="run-hud__relics">
      ${run.relics.map((id) => `<span title="${RELICS_BY_ID[id]?.name ?? ""}">${RELICS_BY_ID[id]?.emoji ?? "🩸"}</span>`).join("")}
      ${run.upgrades
        .map((id) => `<span title="${UPGRADES_BY_ID[id]?.name ?? ""}" style="opacity:.75">${UPGRADES_BY_ID[id]?.emoji ?? "▲"}</span>`)
        .join("")}
    </div>`;
}

function enterNode(node) {
  travelTo(node.id);
  if (node.type === "battle" || node.type === "elite" || node.type === "boss") {
    router.go("battle", { nodeId: node.id });
  } else if (node.type === "event") {
    router.go("event", { nodeId: node.id });
  } else if (node.type === "shop") {
    router.go("shop", { nodeId: node.id });
  } else if (node.type === "rest") {
    router.go("rest", { nodeId: node.id });
  }
}

function showChapterIntro(chapter) {
  const { box, close } = modal(`
    <div class="narrative">
      <div class="narrative__scene">${chapter.scene}</div>
      <div class="eyebrow" style="text-align:center">Capítulo ${chapter.id}</div>
      <h2 style="text-align:center; margin:4px 0 14px">${chapter.name}</h2>
      <p class="narrative__text">${chapter.intro}</p>
      <div class="row" style="justify-content:center; margin-top:22px">
        <button class="btn btn--primary" data-go>Começar</button>
      </div>
    </div>
  `);
  box.querySelector("[data-go]").addEventListener("click", close);
}
