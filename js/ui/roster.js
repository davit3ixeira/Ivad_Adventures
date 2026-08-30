/**
 * roster.js — Coleção de heróis + montagem do Esquadrão (até 4).
 */
import { state } from "../core/state.js";
import { bus } from "../core/bus.js";
import { router } from "./router.js";
import { modal, toast } from "./toast.js";
import { h, heroCard, heroSheet, stars, emptyState } from "./components.js";
import { portrait } from "../data/manifest.js";
import { HEROES } from "../data/heroes.js";
import { openChapterSelect } from "./menu.js";

let filter = "all";

export function renderRoster(mount) {
  const el = h(`
    <section>
      <div class="screen-head row row--between">
        <div>
          <div class="eyebrow">Quartel</div>
          <h1 class="screen-title">Coleção &amp; Esquadrão</h1>
          <p class="screen-sub">Escale até 4 heróis. O esquadrão inteiro entra na run roguelike.</p>
        </div>
        <button class="btn btn--primary" id="go-run">⚔️ Escolher Capítulo</button>
      </div>

      <div class="squad-bar" id="squad-bar"></div>

      <div class="roster-toolbar" id="filters">
        <button class="chip ${filter === "all" ? "is-active" : ""}" data-f="all">Todos</button>
        <button class="chip ${filter === "fisico" ? "is-active" : ""}" data-f="fisico">🔴 Físico</button>
        <button class="chip ${filter === "espiritual" ? "is-active" : ""}" data-f="espiritual">🔵 Espiritual</button>
        <button class="chip ${filter === "natureza" ? "is-active" : ""}" data-f="natureza">🟢 Natureza</button>
        <button class="chip ${filter === "5" ? "is-active" : ""}" data-f="5">5★</button>
        <button class="chip ${filter === "4" ? "is-active" : ""}" data-f="4">4★</button>
        <button class="chip ${filter === "3" ? "is-active" : ""}" data-f="3">3★</button>
      </div>

      <div class="grid-auto" id="roster-grid" style="--min:160px"></div>
    </section>
  `);
  mount.appendChild(el);

  const renderSquad = () => {
    const bar = el.querySelector("#squad-bar");
    const squad = state.squadEntries();
    bar.innerHTML = Array.from({ length: 4 }, (_, i) => {
      const e = squad[i];
      if (!e) return `<div class="squad-slot"><div><span class="emoji">＋</span><small>vaga</small></div></div>`;
      const def = HEROES[e.id];
      return `<div class="squad-slot is-filled" data-remove="${e.uid}">
        <div>${portrait("heroes", def.id, def.emoji)}
        <div class="hero-card__name" style="font-size:.85rem">${def.name}</div>
        <small>Nv ${e.level} · toque p/ tirar</small></div>
      </div>`;
    }).join("");
    bar.querySelectorAll("[data-remove]").forEach((s) =>
      s.addEventListener("click", () => {
        state.toggleSquad(s.dataset.remove);
      })
    );
  };

  const renderGrid = () => {
    const grid = el.querySelector("#roster-grid");
    let list = state.rosterView();
    if (filter === "fisico" || filter === "espiritual" || filter === "natureza")
      list = list.filter((v) => v.def.aff === filter);
    else if (filter === "3" || filter === "4" || filter === "5")
      list = list.filter((v) => v.def.star === Number(filter));

    if (!list.length) {
      grid.innerHTML = emptyState("🗿", "Nada aqui", "Invoque mais heróis ou troque o filtro.");
      return;
    }
    grid.innerHTML = list
      .map((v) => heroCard(v, { selected: state.isInSquad(v.uid), badge: state.isInSquad(v.uid) ? "✓" : "" }))
      .join("");
    grid.querySelectorAll("[data-hero-uid]").forEach((card) =>
      card.addEventListener("click", () => openHeroSheet(card.dataset.heroUid))
    );
  };

  el.querySelector("#filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    filter = b.dataset.f;
    renderRoster(reset(mount));
  });

  el.querySelector("#go-run").addEventListener("click", () => {
    if (state.squadEntries().length === 0) return toast("Escale ao menos 1 herói.", "bad");
    openChapterSelect();
  });

  renderSquad();
  renderGrid();

  // re-render reativo enquanto a tela existe
  const off = bus.on("roster:changed", () => {
    if (!document.body.contains(el)) return off();
    renderSquad();
    renderGrid();
  });
}

function reset(mount) {
  mount.innerHTML = "";
  return mount;
}

function openHeroSheet(uid) {
  const entry = state.getEntry(uid);
  if (!entry) return;
  const view = state.rosterView().find((v) => v.uid === uid);
  const inSquad = state.isInSquad(uid);

  const content = h(`<div>
    ${heroSheet(view)}
    <div class="row" style="margin-top:18px">
      <button class="btn ${inSquad ? "btn--ghost" : "btn--primary"}" data-toggle>
        ${inSquad ? "Remover do esquadrão" : "Adicionar ao esquadrão"}
      </button>
      <button class="btn btn--ghost" data-close>Fechar</button>
    </div>
  </div>`);

  const { close } = modal(content);
  content.querySelector("[data-close]").addEventListener("click", close);
  content.querySelector("[data-toggle]").addEventListener("click", () => {
    const r = state.toggleSquad(uid);
    if (r === "full") toast("Esquadrão cheio (4).", "bad");
    close();
  });
}
