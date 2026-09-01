/**
 * admin.js — Painel ADM completo.
 *
 * Vê e altera tudo: recursos (Fragmentos / Gemas / Tomos), progresso de
 * capítulos, coleção de heróis e Arsenal, a run ativa (relíquias, cartas,
 * cura) e navegadores de leitura de TODOS os dados do jogo
 * (personagens, inimigos, relíquias, cartas, eventos, equipamentos, capítulos).
 */
import { state } from "../core/state.js";
import { bus } from "../core/bus.js";
import { router } from "./router.js";
import { toast, modal } from "./toast.js";
import { h } from "./components.js";
import { portrait } from "../data/manifest.js";
import { typeLabel, typeIcons } from "../systems/affinity.js";
import { HEROES, HERO_IDS, LEVEL_CAP } from "../data/heroes.js";
import { ENEMIES } from "../data/enemies.js";
import { EQUIPMENT, RANKS, EQUIP_SLOTS } from "../data/equipment.js";
import { UPGRADES } from "../data/upgrades.js";
import { RELICS } from "../data/relics.js";
import { EVENTS } from "../data/narrative.js";
import { CHAPTERS } from "../data/chapters.js";
import { addGemas, addRelic, addUpgrade, healSquad, reviveSquad, bumpMaxHP } from "../systems/run.js";

let tab = "recursos";
let dataTab = "personagens";
let heroQuery = "";

const TABS = [
  ["recursos", "💠 Recursos & Progresso"],
  ["colecao", "🗡️ Coleção & Arsenal"],
  ["run", "⚔️ Run ativa"],
  ["dados", "📚 Dados (ver tudo)"],
];

export function renderAdmin(mount) {
  const el = h(`
    <section class="admin">
      <div class="screen-head row row--between">
        <div>
          <div class="eyebrow">Modo desenvolvedor</div>
          <h1 class="screen-title">🛠 Painel ADM</h1>
          <p class="screen-sub">Veja e altere qualquer coisa do jogo. As mudanças são salvas na hora.</p>
        </div>
        <button class="btn btn--ghost btn--sm" data-nav="menu">☰ Santuário</button>
      </div>
      <div class="admin-tabs" id="admin-tabs">
        ${TABS.map(([k, label]) => `<button class="chip ${tab === k ? "is-active" : ""}" data-tab="${k}">${label}</button>`).join("")}
      </div>
      <div id="admin-body"></div>
    </section>
  `);
  mount.appendChild(el);

  const body = el.querySelector("#admin-body");
  const paint = () => {
    el.querySelectorAll("#admin-tabs .chip").forEach((c) => c.classList.toggle("is-active", c.dataset.tab === tab));
    body.innerHTML = "";
    ({ recursos: renderRecursos, colecao: renderColecao, run: renderRun, dados: renderDados }[tab] || renderRecursos)(body, paint);
  };

  el.querySelector("#admin-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    tab = b.dataset.tab;
    paint();
  });

  paint();
}

/* ───────────────────────── helpers ───────────────────────── */

/** Linha de edição de um número: −/+ rápidos + campo exato. */
function numberRow(label, value, apply, { steps = [1, 10, 100, 1000], max = 999999, disabled = false, suffix = "" } = {}) {
  const dis = disabled ? "disabled" : "";
  return `
    <div class="adm-num ${disabled ? "is-disabled" : ""}">
      <div class="adm-num__label">${label}<b>${value}${suffix}</b></div>
      <div class="adm-num__controls">
        ${steps.map((s) => `<button class="btn btn--ghost btn--sm" data-apply="-${s}" ${dis}>−${s}</button>`).reverse().join("")}
        <input type="number" class="adm-input" value="${value}" min="0" max="${max}" ${dis} />
        <button class="btn btn--sm" data-apply="set" ${dis}>Definir</button>
        ${steps.map((s) => `<button class="btn btn--ghost btn--sm" data-apply="+${s}" ${dis}>+${s}</button>`).join("")}
        <button class="btn btn--ghost btn--sm" data-apply="0" ${dis}>Zerar</button>
        <button class="btn btn--ghost btn--sm" data-apply="max" ${dis}>Máx</button>
      </div>
    </div>`;
}

function wireNumberRow(container, getValue, apply, { max = 999999 } = {}) {
  const input = container.querySelector(".adm-input");
  container.querySelectorAll("[data-apply]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const cur = getValue();
      const a = btn.dataset.apply;
      let target;
      if (a === "set") target = Number(input.value);
      else if (a === "0") target = 0;
      else if (a === "max") target = max;
      else target = cur + Number(a);
      apply(Math.max(0, Math.min(max, Math.round(target || 0))));
    })
  );
}

/* ───────────────────────── TAB: Recursos & Progresso ───────────────────────── */
function renderRecursos(body, paint) {
  const m = state.meta;
  const run = state.run;
  body.innerHTML = `
    <div class="panel adm-panel">
      <h3>Moedas & itens</h3>
      <div id="r-frag"></div>
      <div id="r-gema"></div>
      <div id="r-tomo"></div>
      ${run ? "" : `<p class="muted" style="font-size:.8rem">Gemas 💎 só existem durante uma run — inicie uma jornada para editá-las.</p>`}
    </div>

    <div class="panel adm-panel">
      <h3>Capítulos liberados <b class="dim">(atual: ${m.unlockedChapter})</b></h3>
      <div class="adm-chapter-grid" id="r-chapters">
        ${CHAPTERS.map(
          (c) => `<button class="adm-chip-ch ${c.id <= m.unlockedChapter ? "is-on" : ""}" data-ch="${c.id}" title="${c.name}">
            <b>${c.id}</b><small>${c.scene}</small></button>`
        ).join("")}
      </div>
      <div class="row" style="gap:8px;margin-top:10px">
        <button class="btn btn--sm" data-all-ch>Liberar todos (10)</button>
        <button class="btn btn--ghost btn--sm" data-lock-ch>Travar em 1</button>
      </div>
    </div>

    <div class="panel adm-panel">
      <h3>Estatísticas de meta</h3>
      <div id="r-runs"></div>
      <div id="r-pity"></div>
      <div id="r-pulls"></div>
      <div class="row" style="gap:8px;margin-top:6px">
        <button class="btn btn--ghost btn--sm" data-pity-max>Forçar 5★ na próxima invocação</button>
      </div>
    </div>

    <div class="panel adm-panel">
      <h3>Zona de perigo</h3>
      <div class="row" style="gap:8px">
        <button class="btn btn--ghost btn--sm" data-wipe-run ${run ? "" : "disabled"}>Descartar run atual</button>
        <button class="btn btn--ghost btn--sm" data-hard-reset>Reiniciar TUDO</button>
      </div>
    </div>
  `;

  const frag = body.querySelector("#r-frag");
  frag.innerHTML = numberRow("Fragmentos Universais 💠 ", m.frag, null);
  wireNumberRow(frag, () => state.meta.frag, (v) => { state.adminPatchMeta({ frag: v }); paint(); });

  const gema = body.querySelector("#r-gema");
  gema.innerHTML = numberRow("Gemas 💎 (run) ", run ? run.gemas : 0, null, { disabled: !run });
  if (run) wireNumberRow(gema, () => state.run.gemas, (v) => { addGemas(v - state.run.gemas); paint(); });

  const tomo = body.querySelector("#r-tomo");
  tomo.innerHTML = numberRow("Tomos de Ascensão 📖 ", m.tomes || 0, null, { steps: [1, 5, 25], max: 9999 });
  wireNumberRow(tomo, () => state.meta.tomes || 0, (v) => { state.adminPatchMeta({ tomes: v }); paint(); }, { max: 9999 });

  const runs = body.querySelector("#r-runs");
  runs.innerHTML = numberRow("Jornadas vencidas ", m.runsWon || 0, null, { steps: [1, 5], max: 9999 });
  wireNumberRow(runs, () => state.meta.runsWon || 0, (v) => { state.adminPatchMeta({ runsWon: v }); paint(); }, { max: 9999 });

  const pity = body.querySelector("#r-pity");
  pity.innerHTML = numberRow("Pity (invocações sem 5★) ", m.pity || 0, null, { steps: [1, 10], max: 200 });
  wireNumberRow(pity, () => state.meta.pity || 0, (v) => { state.adminPatchMeta({ pity: v }); paint(); }, { max: 200 });

  const pulls = body.querySelector("#r-pulls");
  pulls.innerHTML = numberRow("Total de invocações ", m.pulls || 0, null, { steps: [1, 10, 100], max: 99999 });
  wireNumberRow(pulls, () => state.meta.pulls || 0, (v) => { state.adminPatchMeta({ pulls: v }); paint(); }, { max: 99999 });

  body.querySelectorAll("#r-chapters [data-ch]").forEach((b) =>
    b.addEventListener("click", () => {
      state.adminPatchMeta({ unlockedChapter: Number(b.dataset.ch) });
      toast(`Capítulos liberados: até ${b.dataset.ch}.`, "good");
      paint();
    })
  );
  body.querySelector("[data-all-ch]").addEventListener("click", () => { state.adminPatchMeta({ unlockedChapter: CHAPTERS.length }); paint(); });
  body.querySelector("[data-lock-ch]").addEventListener("click", () => { state.adminPatchMeta({ unlockedChapter: 1 }); paint(); });
  body.querySelector("[data-pity-max]").addEventListener("click", () => { state.adminPatchMeta({ pity: 69 }); toast("Próxima invocação garante 5★.", "gold"); paint(); });

  body.querySelector("[data-wipe-run]")?.addEventListener("click", () => {
    if (!state.run) return;
    state.clearRun();
    bus.emit("run:changed");
    toast("Run descartada.", "");
    paint();
  });
  body.querySelector("[data-hard-reset]").addEventListener("click", () => {
    const { box, close } = modal(`
      <h2>Reiniciar TUDO?</h2>
      <p class="muted" style="margin:10px 0 18px">Apaga heróis, moedas, capítulos, Arsenal e a run. Sem volta.</p>
      <div class="row"><button class="btn btn--primary" data-y>Apagar</button><button class="btn btn--ghost" data-n>Cancelar</button></div>`);
    box.querySelector("[data-y]").addEventListener("click", () => { state.hardReset(); close(); router.go("menu"); });
    box.querySelector("[data-n]").addEventListener("click", close);
  });
}

/* ───────────────────────── TAB: Coleção & Arsenal ───────────────────────── */
let _iid = 0;
const admIid = () => `eqadm${Date.now().toString(36)}${(_iid++).toString(36)}`;

function renderColecao(body, paint) {
  const owned = new Map(state.meta.roster.map((e) => [e.id, e]));
  const q = heroQuery.trim().toLowerCase();
  const list = HERO_IDS
    .map((id) => HEROES[id])
    .filter((d) => !q || d.name.toLowerCase().includes(q) || (d.title || "").toLowerCase().includes(q) || String(d.star).includes(q))
    .sort((a, b) => b.star - a.star || a.name.localeCompare(b.name));

  body.innerHTML = `
    <div class="panel adm-panel">
      <h3>Heróis <b class="dim">(${state.meta.roster.length}/${HERO_IDS.length})</b></h3>
      <div class="row" style="gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <input class="adm-input" id="hero-q" placeholder="Buscar herói…" value="${heroQuery}" style="flex:1;min-width:160px" />
        <button class="btn btn--sm" data-grant-all>Invocar TODOS</button>
        <button class="btn btn--ghost btn--sm" data-max-all>Todos no Nv ${LEVEL_CAP}</button>
      </div>
      <div class="adm-hero-list" id="hero-list">
        ${list
          .map((d) => {
            const e = owned.get(d.id);
            return `<div class="adm-hero-row" data-id="${d.id}">
              <span class="adm-hero-row__ico">${portrait("heroes", d.id, d.emoji)}</span>
              <span class="adm-hero-row__name"><b>${d.name}</b><small>${"★".repeat(d.star)} · ${typeLabel(d.types)}${d.forms ? " · 🔥" : ""}</small></span>
              ${
                e
                  ? `<span class="adm-hero-row__lvl">
                      <button class="btn btn--ghost btn--sm" data-lvl="-1">−</button>
                      <b>Nv ${e.level}</b>
                      <button class="btn btn--ghost btn--sm" data-lvl="1">+</button>
                      <button class="btn btn--ghost btn--sm" data-lvl="max">Máx</button>
                    </span>`
                  : `<button class="btn btn--sm" data-add>+ Invocar</button>`
              }
            </div>`;
          })
          .join("")}
      </div>
    </div>

    <div class="panel adm-panel">
      <h3>Arsenal — equipamentos <b class="dim">(${state.meta.inventory.length})</b></h3>
      <div class="row" style="gap:8px;margin-bottom:10px">
        <button class="btn btn--sm" data-eq-all>Adicionar 1 de cada</button>
        <button class="btn btn--ghost btn--sm" data-eq-clear>Limpar Arsenal (só não-equipados)</button>
      </div>
      <div class="adm-eq-list">
        ${Object.values(EQUIPMENT)
          .sort((a, b) => EQUIP_SLOTS.indexOf(a.slot) - EQUIP_SLOTS.indexOf(b.slot) || RANKS[a.rank].order - RANKS[b.rank].order)
          .map((it) => {
            const have = state.meta.inventory.filter((x) => x.id === it.id).length;
            const mods = ["atk", "def", "maxHP", "spd"].filter((k) => it.mods[k]).map((k) => `${it.mods[k] > 0 ? "+" : ""}${it.mods[k]} ${k.toUpperCase()}`).join(" · ");
            return `<div class="adm-eq-row rank-${it.rank}" data-eq="${it.id}">
              <span>${it.emoji} <b>${it.name}</b> <span class="rank-tag">${RANKS[it.rank].label}</span> <small class="dim">${it.slot}</small></span>
              <small class="muted">${mods}</small>
              <span class="adm-eq-row__act">${have ? `<i class="dim">×${have}</i>` : ""}<button class="btn btn--ghost btn--sm" data-eq-add>+</button></span>
            </div>`;
          })
          .join("")}
      </div>
    </div>
  `;

  const qEl = body.querySelector("#hero-q");
  qEl.addEventListener("input", () => {
    heroQuery = qEl.value;
    // re-render só a lista, preservando o foco
    renderColecao(body, paint);
    const nq = body.querySelector("#hero-q");
    nq.focus();
    nq.setSelectionRange(nq.value.length, nq.value.length);
  });

  body.querySelector("[data-grant-all]").addEventListener("click", () => {
    HERO_IDS.forEach((id) => { if (!owned.has(id)) state.grantHero(id, { quiet: true }); });
    toast("Todos os heróis invocados.", "good");
    paint();
  });
  body.querySelector("[data-max-all]").addEventListener("click", () => {
    state.meta.roster.forEach((e) => state.adminSetLevel(e.uid, LEVEL_CAP));
    toast(`Todo o roster no Nv ${LEVEL_CAP}.`, "good");
    paint();
  });

  body.querySelectorAll(".adm-hero-row").forEach((row) => {
    const id = row.dataset.id;
    row.querySelector("[data-add]")?.addEventListener("click", () => { state.grantHero(id, { quiet: true }); paint(); });
    row.querySelectorAll("[data-lvl]").forEach((b) =>
      b.addEventListener("click", () => {
        const e = state.meta.roster.find((x) => x.id === id);
        if (!e) return;
        const a = b.dataset.lvl;
        state.adminSetLevel(e.uid, a === "max" ? LEVEL_CAP : e.level + Number(a));
        paint();
      })
    );
  });

  body.querySelector("[data-eq-all]").addEventListener("click", () => {
    Object.keys(EQUIPMENT).forEach((id) => state.meta.inventory.push({ iid: admIid(), id }));
    state.persist();
    bus.emit("roster:changed");
    toast("1 de cada equipamento no Arsenal.", "good");
    paint();
  });
  body.querySelector("[data-eq-clear]").addEventListener("click", () => {
    const equipped = new Set();
    state.meta.roster.forEach((e) => EQUIP_SLOTS.forEach((s) => e.equip?.[s] && equipped.add(e.equip[s])));
    state.meta.inventory = state.meta.inventory.filter((x) => equipped.has(x.iid));
    state.persist();
    bus.emit("roster:changed");
    paint();
  });
  body.querySelectorAll(".adm-eq-row").forEach((row) => {
    row.querySelector("[data-eq-add]").addEventListener("click", () => {
      state.meta.inventory.push({ iid: admIid(), id: row.dataset.eq });
      state.persist();
      bus.emit("roster:changed");
      paint();
    });
  });
}

/* ───────────────────────── TAB: Run ativa ───────────────────────── */
function renderRun(body, paint) {
  const run = state.run;
  if (!run) {
    body.innerHTML = `<div class="panel adm-panel"><p class="muted">Nenhuma run ativa. Comece uma jornada pelo Santuário.</p></div>`;
    return;
  }
  const ch = CHAPTERS.find((c) => c.id === run.chapter);
  body.innerHTML = `
    <div class="panel adm-panel">
      <h3>Run — ${ch ? ch.scene + " " + ch.name : "Capítulo " + run.chapter}</h3>
      <div class="adm-kv">
        <span>Gemas</span><b>${run.gemas} 💎</b>
        <span>Batalhas vencidas</span><b>${run.battlesWon}</b>
        <span>Relíquias</span><b>${run.relics.length}</b>
        <span>Cartas de Mácula</span><b>${run.upgrades.length}</b>
        <span>Esquadrão</span><b>${run.squad.map((u) => u.name).join(", ")}</b>
      </div>
      <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="btn btn--sm" data-heal>Curar esquadrão 100%</button>
        <button class="btn btn--sm" data-revive>Reviver + curar todos</button>
        <button class="btn btn--ghost btn--sm" data-hp>+50 HP máx</button>
        <button class="btn btn--ghost btn--sm" data-charge>Encher barra de Especial</button>
      </div>
    </div>

    <div class="panel adm-panel">
      <h3>Conceder Relíquia de Mácula</h3>
      <div class="adm-eq-list">
        ${RELICS.map(
          (r) => `<div class="adm-eq-row" data-relic="${r.id}">
            <span>${r.emoji} <b>${r.name}</b> ${run.relics.includes(r.id) ? '<i class="dim">(ativa)</i>' : ""}</span>
            <small class="muted">${r.text}</small>
            <span class="adm-eq-row__act"><button class="btn btn--ghost btn--sm" data-relic-add>+</button></span>
          </div>`
        ).join("")}
      </div>
    </div>

    <div class="panel adm-panel">
      <h3>Conceder Carta de Mácula</h3>
      <div class="adm-eq-list">
        ${UPGRADES.map(
          (u) => `<div class="adm-eq-row" data-up="${u.id}">
            <span>${u.emoji} <b>${u.name}</b> ${run.upgrades.filter((x) => x === u.id).length ? `<i class="dim">×${run.upgrades.filter((x) => x === u.id).length}</i>` : ""}</span>
            <small class="muted">${u.text}</small>
            <span class="adm-eq-row__act"><button class="btn btn--ghost btn--sm" data-up-add>+</button></span>
          </div>`
        ).join("")}
      </div>
    </div>
  `;

  body.querySelector("[data-heal]").addEventListener("click", () => { healSquad(1); toast("Esquadrão curado.", "good"); paint(); });
  body.querySelector("[data-revive]").addEventListener("click", () => { reviveSquad(); toast("Esquadrão restaurado.", "good"); paint(); });
  body.querySelector("[data-hp]").addEventListener("click", () => { bumpMaxHP(50); paint(); });
  body.querySelector("[data-charge]").addEventListener("click", () => {
    state.run.squad.forEach((u) => {
      const cm = HEROES[u.id]?.active?.charge || 0;
      u.charge = cm;
    });
    state.persist();
    bus.emit("run:changed");
    toast("Especiais carregados.", "gold");
    paint();
  });
  body.querySelectorAll("[data-relic]").forEach((row) =>
    row.querySelector("[data-relic-add]").addEventListener("click", () => { addRelic(row.dataset.relic); paint(); })
  );
  body.querySelectorAll("[data-up]").forEach((row) =>
    row.querySelector("[data-up-add]").addEventListener("click", () => { addUpgrade(row.dataset.up); paint(); })
  );
}

/* ───────────────────────── TAB: Dados (ver tudo) ───────────────────────── */
const DATA_TABS = [
  ["personagens", "Personagens"],
  ["inimigos", "Inimigos"],
  ["reliquias", "Relíquias"],
  ["cartas", "Cartas de Mácula"],
  ["eventos", "Eventos"],
  ["equip", "Equipamentos"],
  ["capitulos", "Capítulos"],
];

function renderDados(body) {
  body.innerHTML = `
    <div class="admin-tabs admin-tabs--sub" id="data-tabs">
      ${DATA_TABS.map(([k, l]) => `<button class="chip ${dataTab === k ? "is-active" : ""}" data-dt="${k}">${l}</button>`).join("")}
    </div>
    <div class="panel adm-panel" id="data-body"></div>
  `;
  const dbody = body.querySelector("#data-body");
  const fill = () => {
    body.querySelectorAll("#data-tabs .chip").forEach((c) => c.classList.toggle("is-active", c.dataset.dt === dataTab));
    dbody.innerHTML = ({
      personagens: dataPersonagens,
      inimigos: dataInimigos,
      reliquias: dataReliquias,
      cartas: dataCartas,
      eventos: dataEventos,
      equip: dataEquip,
      capitulos: dataCapitulos,
    }[dataTab] || dataPersonagens)();
  };
  body.querySelector("#data-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-dt]");
    if (!b) return;
    dataTab = b.dataset.dt;
    fill();
  });
  fill();
}

const statLine = (b) => `HP ${b.hp ?? b.maxHP} · ATK ${b.atk} · DEF ${b.def} · SPD ${b.spd}`;

function dataPersonagens() {
  const byStar = [5, 4, 3].map((s) => ({ s, list: HERO_IDS.map((id) => HEROES[id]).filter((d) => d.star === s) }));
  return byStar
    .map(
      ({ s, list }) => `
      <h4 class="adm-h4">${"★".repeat(s)} <span class="dim">(${list.length})</span></h4>
      ${list
        .map(
          (d) => `<details class="adm-entry">
            <summary>${d.emoji} <b>${d.name}</b> <span class="dim">— ${d.title}</span> ${d.forms ? '<span class="rank-tag">🔥 formas</span>' : ""}</summary>
            <div class="adm-entry__body">
              <p><b>${typeIcons(d.types)} ${typeLabel(d.types)}</b> · ${d.role} · MOV ${d.mov} · RNG ${d.rng}</p>
              <p class="dim">${statLine(d.base)}</p>
              <p><b>Passiva · ${d.skill.name}</b> — ${d.skill.text}</p>
              ${d.active ? `<p><b>✨ ${d.active.name}</b> (carrega em ${d.active.charge}) — ${d.active.text}</p>` : ""}
              <p class="dim" style="font-style:italic">"${d.quote}"</p>
              ${
                d.forms
                  ? `<div class="adm-forms">${d.forms
                      .map((f) => `<div>🔥 <b>${f.name}</b> — custo ${f.cost} · ${typeLabel(f.types)}<br><small class="dim">mult: ${Object.entries(f.statMul).map(([k, v]) => k + "×" + v).join(" ")} · ${f.active?.name || ""}</small></div>`)
                      .join("")}</div>`
                  : ""
              }
            </div>
          </details>`
        )
        .join("")}`
    )
    .join("");
}

function dataInimigos() {
  const groups = ["boss", "elite", "grunt"];
  const labels = { boss: "Chefes", elite: "Elites", grunt: "Tropa comum" };
  return groups
    .map((g) => {
      const list = Object.values(ENEMIES).filter((e) => e.kind === g);
      return `<h4 class="adm-h4">${labels[g]} <span class="dim">(${list.length})</span></h4>
        ${list
          .map(
            (e) => `<details class="adm-entry">
              <summary>${e.emoji} <b>${e.name}</b> <span class="dim">${typeLabel(e.types)}</span></summary>
              <div class="adm-entry__body">
                <p class="dim">${statLine(e.base)} · MOV ${e.mov} · RNG ${e.rng} · IA ${e.ai}</p>
                ${e.trait ? `<p>${e.trait}</p>` : '<p class="dim">sem traço especial</p>'}
              </div>
            </details>`
          )
          .join("")}`;
    })
    .join("");
}

function dataReliquias() {
  return RELICS.map(
    (r) => `<div class="adm-entry adm-entry--flat">
      <b>${r.emoji} ${r.name}</b>
      <p>${r.text}</p>
      <p class="dim">mod: ${JSON.stringify(r.mod)}${r.trigger ? ` · gatilho: ${r.trigger}${r.triggerValue != null ? " (" + r.triggerValue + ")" : ""}` : ""}</p>
    </div>`
  ).join("");
}

function dataCartas() {
  return UPGRADES.map(
    (u) => `<div class="adm-entry adm-entry--flat">
      <b>${u.emoji} ${u.name}</b>
      <p>${u.text}</p>
      <p class="dim">mod: ${JSON.stringify(u.mod)}</p>
    </div>`
  ).join("");
}

function dataEventos() {
  return EVENTS.map(
    (ev) => `<details class="adm-entry">
      <summary>${ev.scene} <b>${ev.title}</b></summary>
      <div class="adm-entry__body">
        <p>${ev.text}</p>
        ${ev.choices
          .map(
            (c) => `<p><b>› ${c.label}</b>${c.cost ? ` <span class="dim">(custo: ${JSON.stringify(c.cost)})</span>` : ""}<br>
              <small class="dim">${c.outcome.text}</small><br>
              <small>efeitos: ${(c.outcome.effects || []).map((e) => JSON.stringify(e)).join(", ") || "—"}</small></p>`
          )
          .join("")}
      </div>
    </details>`
  ).join("");
}

function dataEquip() {
  return EQUIP_SLOTS.map((slot) => {
    const list = Object.values(EQUIPMENT).filter((it) => it.slot === slot).sort((a, b) => RANKS[a.rank].order - RANKS[b.rank].order);
    return `<h4 class="adm-h4">${slot} <span class="dim">(${list.length})</span></h4>
      ${list
        .map((it) => {
          const mods = ["atk", "def", "maxHP", "spd"].filter((k) => it.mods[k]).map((k) => `${it.mods[k] > 0 ? "+" : ""}${it.mods[k]} ${k.toUpperCase()}`).join(" · ");
          return `<div class="adm-entry adm-entry--flat rank-${it.rank}">
            <b>${it.emoji} ${it.name} <span class="rank-tag">${RANKS[it.rank].label}</span></b>
            <p>${mods}</p>
            <p class="dim">${it.desc}</p>
          </div>`;
        })
        .join("")}`;
  }).join("");
}

function dataCapitulos() {
  return CHAPTERS.map(
    (c) => `<details class="adm-entry">
      <summary>${c.scene} <b>Cap. ${c.id} — ${c.name}</b> <span class="dim">${c.locale}</span></summary>
      <div class="adm-entry__body">
        <p class="dim">tema: ${c.bg} · linhas: ${c.rows} · recompensa: ${c.reward.frag} 💠</p>
        <p><b>Chefe:</b> ${ENEMIES[c.boss]?.name || c.boss}</p>
        <p><b>Tropa:</b> ${c.grunts.map((g) => ENEMIES[g]?.name || g).join(", ")}</p>
        <p><b>Elites:</b> ${c.elites.map((g) => ENEMIES[g]?.name || g).join(", ")}</p>
        <p>${c.intro}</p>
      </div>
    </details>`
  ).join("");
}
