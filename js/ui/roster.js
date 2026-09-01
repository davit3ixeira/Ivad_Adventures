/**
 * roster.js — Coleção de heróis + montagem do Esquadrão (até 4).
 */
import { state } from "../core/state.js";
import { bus } from "../core/bus.js";
import { router } from "./router.js";
import { modal, toast } from "./toast.js";
import { h, heroCard, heroSheet, stars, emptyState } from "./components.js";
import { portrait } from "../data/manifest.js";
import { HEROES, LEVEL_CAP } from "../data/heroes.js";
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
          <p class="screen-sub">Escale até 4 heróis. Toque num herói para a ficha, equipar o 🎒 Arsenal (<span id="arsenal-n">${state.meta.inventory.length}</span>) ou gastar 📖 Tomos de Ascensão (<span id="tome-n">${state.meta.tomes || 0}</span>).</p>
        </div>
        <button class="btn btn--primary" id="go-run">⚔️ Escolher Capítulo</button>
      </div>

      <div class="squad-bar" id="squad-bar"></div>
      <div class="builds-bar" id="builds-bar"></div>

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

  const renderBuilds = () => {
    const wrap = el.querySelector("#builds-bar");
    const builds = state.meta.builds || [];
    wrap.innerHTML = `
      <span class="builds-bar__label">🎖️ Esquadrões salvos</span>
      ${
        builds
          .map(
            (b) => `<span class="build-chip" data-load="${b.id}" title="Carregar “${b.name}”">
              <span>${b.name}</span><small>${b.squad.length}/4</small>
              <button class="build-chip__x" data-del="${b.id}" title="Apagar">✕</button>
            </span>`
          )
          .join("") || '<span class="muted" style="font-size:.8rem">nenhum salvo — monte um esquadrão e clique em “Salvar atual”.</span>'
      }
      <button class="btn btn--ghost btn--sm" id="save-build">＋ Salvar atual</button>`;
    wrap.querySelectorAll("[data-load]").forEach((c) =>
      c.addEventListener("click", (e) => {
        if (e.target.closest("[data-del]")) return;
        state.loadBuild(c.dataset.load);
        toast("Esquadrão carregado.", "good");
      })
    );
    wrap.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        state.deleteBuild(b.dataset.del);
      })
    );
    wrap.querySelector("#save-build").addEventListener("click", saveBuildPrompt);
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
  renderBuilds();
  renderGrid();

  // re-render reativo enquanto a tela existe
  const off = bus.on("roster:changed", () => {
    if (!document.body.contains(el)) return off();
    const tn = el.querySelector("#tome-n");
    const an = el.querySelector("#arsenal-n");
    if (tn) tn.textContent = state.meta.tomes || 0;
    if (an) an.textContent = state.meta.inventory.length;
    renderSquad();
    renderBuilds();
    renderGrid();
  });
}

function saveBuildPrompt() {
  if (state.squadEntries().length === 0) return toast("Monte um esquadrão primeiro.", "bad");
  const { box, close } = modal(`
    <h2 style="margin-bottom:6px">Salvar esquadrão</h2>
    <p class="muted" style="margin-bottom:12px">Guarde essa formação para recarregar depois com um toque.</p>
    <input id="build-name" placeholder="Nome (opcional)" maxlength="24"
      style="width:100%;padding:10px 12px;margin-bottom:14px;border-radius:10px;border:1px solid var(--hair-2);background:var(--bg-2);color:var(--text);font:inherit" />
    <div class="row">
      <button class="btn btn--primary" data-ok>Salvar</button>
      <button class="btn btn--ghost" data-cancel>Cancelar</button>
    </div>
  `);
  const done = () => {
    state.saveBuild(box.querySelector("#build-name").value);
    close();
    toast("Esquadrão salvo.", "good");
  };
  box.querySelector("[data-ok]").addEventListener("click", done);
  box.querySelector("[data-cancel]").addEventListener("click", close);
  const input = box.querySelector("#build-name");
  input.focus();
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") done();
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
      <div class="skill-line">
        <b style="color:var(--ki)">📖 Tomo de Ascensão</b>
        <div class="muted" style="font-size:.78rem;margin:2px 0 8px">
          Você tem <b>${state.meta.tomes || 0}</b>. Cada Tomo sobe 1 nível cheio deste herói.
        </div>
        <button class="btn btn--sm" data-tome ${(state.meta.tomes || 0) <= 0 || entry.level >= LEVEL_CAP ? "disabled" : ""}>
          ${entry.level >= LEVEL_CAP ? "Nível máximo" : `⬆ Subir para Nv ${entry.level + 1}`}
        </button>
      </div>
      ${
        HEROES[entry.id].forms?.length
          ? `<div class="skill-line">
              <b style="color:var(--violet)">🔥 Transformações em combate</b>
              <div class="muted" style="font-size:.78rem;margin:2px 0 6px">A barra 🔥 enche +1 por turno (nada no 1º). A forma mais forte gasta tudo.</div>
              ${HEROES[entry.id].forms
                .map(
                  (f) => `<div class="form-row"><span class="form-row__cost">${"🔥".repeat(f.cost)}</span>
                    <b>${f.emoji} ${f.name}</b><small>${f.active?.text || ""}</small></div>`
                )
                .join("")}
            </div>`
          : ""
      }
      <div class="row" style="margin-top:16px">
        <button class="btn ${inSquad ? "btn--ghost" : "btn--primary"}" data-toggle>
          ${inSquad ? "Remover do esquadrão" : "Adicionar ao esquadrão"}
        </button>
        <button class="btn btn--ghost" data-close>Fechar</button>
      </div>`;

    body.querySelector("[data-tome]")?.addEventListener("click", () => {
      const r = state.useTome(uid);
      if (r.error === "sem-tomo") return toast("Sem Tomos de Ascensão.", "bad");
      if (r.error === "nivel-max") return toast("Herói já está no nível máximo.", "bad");
      toast(`${HEROES[entry.id].name} subiu para o Nv ${r.to}! 📖`, "good");
      render();
    });
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
