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
import { EQUIPMENT, EQUIP_SLOTS, RANKS, availableForSlot } from "../data/equipment.js";

let filter = "all";

export function renderRoster(mount) {
  const el = h(`
    <section>
      <div class="screen-head row row--between">
        <div>
          <div class="eyebrow">Quartel</div>
          <h1 class="screen-title">Coleção &amp; Esquadrão</h1>
          <p class="screen-sub">Escale até 4 heróis. Toque num herói para ver a ficha e equipar itens do 🎒 Arsenal (${state.meta.inventory.length}).</p>
        </div>
        <button class="btn btn--primary" id="go-run">⚔️ Escolher Capítulo</button>
      </div>

      <div class="squad-bar" id="squad-bar"></div>

      <div class="roster-toolbar" id="filters">
        <button class="chip ${filter === "all" ? "is-active" : ""}" data-f="all">Todos</button>
        <button class="chip ${filter === "fisico" ? "is-active" : ""}" data-f="fisico">⚔️ Físico</button>
        <button class="chip ${filter === "projecao" ? "is-active" : ""}" data-f="projecao">🟢 Projeção</button>
        <button class="chip ${filter === "mana" ? "is-active" : ""}" data-f="mana">🔵 Mana</button>
        <button class="chip ${filter === "divino" ? "is-active" : ""}" data-f="divino">✨ Divino</button>
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
    if (filter === "fisico" || filter === "projecao" || filter === "mana")
      list = list.filter((v) => (v.def.types || []).includes(filter));
    else if (filter === "divino") list = list.filter((v) => (v.def.types || []).length >= 3);
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

const SLOT_LABEL = { arma: "⚔️ Arma", armadura: "🛡️ Armadura", reliquia: "🩸 Relíquia" };

function equipRow(entry) {
  return `<div class="equip-slots">${EQUIP_SLOTS.map((slot) => {
    const iid = entry.equip?.[slot];
    const inst = iid && state.meta.inventory.find((x) => x.iid === iid);
    const def = inst && EQUIPMENT[inst.id];
    return `<button class="equip-slot ${def ? `rank-${def.rank}` : "is-empty"}" data-slot="${slot}">
      <small>${SLOT_LABEL[slot]}</small>
      ${def ? `<span class="emoji">${def.emoji}</span><b>${def.name}</b>` : `<span class="muted">— vazio —</span>`}
    </button>`;
  }).join("")}</div>`;
}

function openHeroSheet(uid) {
  if (!state.getEntry(uid)) return;
  const { close } = modal(h(`<div id="sheet-body"></div>`));
  render();

  function render() {
    const entry = state.getEntry(uid);
    const view = state.rosterView().find((v) => v.uid === uid);
    const inSquad = state.isInSquad(uid);
    const eb = view.equipBonus;
    const hasEb = eb.atk || eb.def || eb.maxHP || eb.spd;
    const body = document.getElementById("sheet-body");
    body.innerHTML = `
      ${heroSheet(view)}
      <div class="skill-line">
        <b style="color:var(--gold)">🎒 Equipamento</b>
        ${
          hasEb
            ? `<div class="muted" style="font-size:.78rem;margin:2px 0 6px">${["atk", "def", "maxHP", "spd"]
                .filter((k) => eb[k])
                .map((k) => `+${eb[k]} ${({ atk: "ATK", def: "DEF", maxHP: "HP", spd: "SPD" }[k])}`)
                .join(" · ")}</div>`
            : ""
        }
        ${equipRow(entry)}
      </div>
      <div class="row" style="margin-top:16px">
        <button class="btn ${inSquad ? "btn--ghost" : "btn--primary"}" data-toggle>
          ${inSquad ? "Remover do esquadrão" : "Adicionar ao esquadrão"}
        </button>
        <button class="btn btn--ghost" data-close>Fechar</button>
      </div>`;

    body.querySelector("[data-close]").addEventListener("click", close);
    body.querySelector("[data-toggle]").addEventListener("click", () => {
      const r = state.toggleSquad(uid);
      if (r === "full") toast("Esquadrão cheio (4).", "bad");
      else close();
    });
    body.querySelectorAll("[data-slot]").forEach((b) =>
      b.addEventListener("click", () => openPicker(uid, b.dataset.slot, render))
    );
  }
}

function openPicker(uid, slot, onDone) {
  const entry = state.getEntry(uid);
  const options = availableForSlot(state.meta.inventory, state.meta.roster, slot);
  const equipped = entry.equip?.[slot];

  const list = options
    .slice()
    .sort((a, b) => RANKS[EQUIPMENT[b.id].rank].order - RANKS[EQUIPMENT[a.id].rank].order)
    .map((inst) => {
      const d = EQUIPMENT[inst.id];
      const mods = ["atk", "def", "maxHP", "spd"]
        .filter((k) => d.mods[k])
        .map((k) => `${d.mods[k] > 0 ? "+" : ""}${d.mods[k]} ${({ atk: "ATK", def: "DEF", maxHP: "HP", spd: "SPD" }[k])}`)
        .join(" · ");
      return `<button class="choice rank-${d.rank}" data-iid="${inst.iid}">
        <b>${d.emoji} ${d.name} <span class="rank-tag">${RANKS[d.rank].label}</span></b>
        <small>${mods} — ${d.desc}</small>
      </button>`;
    })
    .join("");

  const { box, close } = modal(`
    <h2 style="margin-bottom:4px">${SLOT_LABEL[slot]}</h2>
    <p class="muted" style="margin-bottom:14px">Escolha um equipamento livre para este slot.</p>
    <div class="choice-list">
      ${equipped ? `<button class="choice" data-iid=""><b>✕ Desequipar</b></button>` : ""}
      ${list || `<p class="muted">Nenhum item de ${slot} disponível. Ganhe equipamentos vencendo batalhas nas runs.</p>`}
    </div>`);

  box.querySelectorAll("[data-iid]").forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.iid) state.equipItem(uid, b.dataset.iid);
      else state.unequipItem(uid, slot);
      close();
      onDone();
    })
  );
}
