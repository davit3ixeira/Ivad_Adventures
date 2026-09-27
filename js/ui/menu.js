/**
 * menu.js — Santuário (tela inicial).
 */
import { state } from "../core/state.js";
import { router } from "./router.js";
import { modal, toast } from "./toast.js";
import { h } from "./components.js";
import { HEROES } from "../data/heroes.js";
import { CHAPTERS } from "../data/chapters.js";
import { resolveChapter } from "../data/ascension.js";
import { PACTS } from "../data/pacts.js";
import { abandonRun } from "../systems/run.js";

export function renderMenu(mount) {
  const m = state.meta;
  const fiveCount = m.roster.filter((e) => HEROES[e.id]?.star === 5).length;
  const hasRun = !!state.run;
  const chapterName = hasRun ? resolveChapter(state.run.chapter)?.name : null;
  const campaignDone = m.unlockedChapter > CHAPTERS.length;

  mount.appendChild(
    h(`
    <section class="menu">
      <div class="menu__hero">
        <div class="menu__logo">As Aventuras<br>de Ivad</div>
        <div class="menu__tag">Selo Primordial</div>
        <p class="menu__desc">
          O céu rubro de Haluho racha sobre os mundos. Invoque os heróis da saga com
          Fragmentos Universais, forme seu esquadrão e atravesse 10 capítulos —
          dos Irmãos Demônios e da Dimensão Alfa até Tordep, a guerra dos deuses,
          o Torneio do Mast e os Destruidores de Multiverso.
        </p>
        <div class="menu__actions">
          ${
            hasRun
              ? `<button class="btn btn--primary btn--lg" data-act="continue">▶ Continuar — ${chapterName}</button>
                 <button class="btn btn--ghost" data-act="abandon">Abandonar jornada atual</button>`
              : `<button class="btn btn--primary btn--lg" data-act="new">⚔️ Nova Jornada</button>`
          }
          ${
            !hasRun && campaignDone
              ? `<button class="btn btn--gold" data-act="ascend">🌌 Torre da Ascensão — Nível ${(m.ascensionBest || 0) + 1}</button>`
              : ""
          }
          <button class="btn" data-nav="gacha">💠 Portal de Invocação</button>
          <button class="btn" data-nav="roster">🗡️ Coleção &amp; Esquadrão</button>
          <button class="btn btn--ghost btn--sm" data-nav="admin">🛠 Painel ADM</button>
          <button class="btn btn--ghost btn--sm" data-act="reset">Reiniciar tudo</button>
        </div>
      </div>

      <aside class="menu__side">
        <div class="panel menu__panel">
          <div class="menu__sigil">✦</div>
          <div class="menu__stat-row"><span>Heróis reunidos</span> <b>${m.roster.length}/${Object.keys(HEROES).length}</b></div>
          <div class="menu__stat-row"><span>Lendas 5★</span> <b>${fiveCount}</b></div>
          <div class="menu__stat-row"><span>Invocações feitas</span> <b>${m.pulls}</b></div>
          <div class="menu__stat-row"><span>Jornadas vencidas</span> <b>${m.runsWon}</b></div>
          <div class="menu__stat-row"><span>Capítulo liberado</span> <b>${Math.min(m.unlockedChapter, CHAPTERS.length)}</b></div>
          ${campaignDone ? `<div class="menu__stat-row"><span>🌌 Ascensão superada</span> <b>${m.ascensionBest || 0}</b></div>` : ""}
          <div class="menu__stat-row"><span>Fragmentos Universais</span> <b>${m.frag} 💠</b></div>
        </div>
      </aside>
    </section>
  `)
  );

  mount.querySelector('[data-act="new"]')?.addEventListener("click", () => openChapterSelect());
  mount.querySelector('[data-act="ascend"]')?.addEventListener("click", () => startAscension());
  mount.querySelector('[data-act="continue"]')?.addEventListener("click", () => router.go("map"));
  mount.querySelector('[data-act="abandon"]')?.addEventListener("click", () => confirmAbandon());
  mount.querySelector('[data-act="reset"]')?.addEventListener("click", () => confirmReset());
}

/** Torre da Ascensão: sempre tenta o próximo nível não superado — sem seleção manual de nível. */
function startAscension() {
  if (state.squadEntries().length === 0) {
    toast("Monte um esquadrão antes de partir.", "bad");
    router.go("roster");
    return;
  }
  openPactSelect();
}

/** Pactos da Torre: modificadores opcionais de risco/recompensa antes de subir um nível. */
function openPactSelect() {
  const level = (state.meta.ascensionBest || 0) + 1;
  const selected = new Set();

  const list = PACTS.map(
    (p) => `
      <button class="choice" data-pact="${p.id}">
        <b>${p.emoji} ${p.name} <span class="dim" style="font-weight:400">— +${Math.round(p.rewardMul * 100)}% recompensa</span></b>
        <small>${p.text}</small>
      </button>`
  ).join("");

  const { box, close } = modal(`
    <h2 style="margin-bottom:6px">🌌 Ascensão ${level} — Pactos da Torre</h2>
    <p class="muted" style="margin-bottom:16px">
      Opcional: ative quantos pactos quiser para deixar os inimigos <b>deste nível</b> mais
      fortes — em troca, toda batalha do nível rende mais 💠 Fragmentos, 💎 Gemas e 📖 Tomos.
      Pode entrar sem nenhum.
    </p>
    <div class="choice-list" id="pact-list">${list}</div>
    <div class="row row--between" style="margin-top:18px; align-items:center">
      <span class="muted" id="pact-total">Bônus de recompensa: +0%</span>
      <button class="btn btn--primary" data-start>Entrar na Ascensão ${level}</button>
    </div>
  `);

  const totalEl = box.querySelector("#pact-total");
  const refreshTotal = () => {
    const pct = PACTS.filter((p) => selected.has(p.id)).reduce((s, p) => s + p.rewardMul, 0);
    totalEl.textContent = `Bônus de recompensa: +${Math.round(pct * 100)}%`;
  };

  box.querySelectorAll("[data-pact]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.pact;
      if (selected.has(id)) {
        selected.delete(id);
        btn.classList.remove("is-selected");
      } else {
        selected.add(id);
        btn.classList.add("is-selected");
      }
      refreshTotal();
    });
  });

  box.querySelector("[data-start]").addEventListener("click", () => {
    close();
    router.go("map", { newRun: CHAPTERS.length + level, ascension: level, pacts: [...selected] });
  });
}

export function openChapterSelect() {
  if (state.squadEntries().length === 0) {
    toast("Monte um esquadrão antes de partir.", "bad");
    router.go("roster");
    return;
  }

  const list = CHAPTERS.map((c) => {
    const locked = c.id > state.meta.unlockedChapter;
    return `
      <button class="choice" data-chapter="${c.id}" ${locked ? "disabled style='opacity:.4'" : ""}>
        <b>${c.scene} Capítulo ${c.id} — ${c.name}</b>
        <small>${c.locale}${locked ? " · 🔒 bloqueado" : ""}</small>
      </button>`;
  }).join("");

  const { box, close } = modal(`
    <h2 style="margin-bottom:6px">Escolha o Capítulo</h2>
    <p class="muted" style="margin-bottom:16px">Sua run leva o esquadrão atual. HP não regenera entre batalhas — só em nós de descanso.</p>
    <div class="choice-list">${list}</div>
  `);

  box.querySelectorAll("[data-chapter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      close();
      router.go("map", { newRun: Number(btn.dataset.chapter) });
    });
  });
}

function confirmAbandon() {
  const { box, close } = modal(`
    <h2>Abandonar a jornada?</h2>
    <p class="muted" style="margin:10px 0 18px">A run atual será perdida. Fragmentos e heróis já obtidos permanecem.</p>
    <div class="row">
      <button class="btn btn--primary" data-yes>Abandonar</button>
      <button class="btn btn--ghost" data-no>Voltar</button>
    </div>
  `);
  box.querySelector("[data-yes]").addEventListener("click", () => {
    abandonRun();
    close();
    router.go("menu");
  });
  box.querySelector("[data-no]").addEventListener("click", close);
}

function confirmReset() {
  const { box, close } = modal(`
    <h2>Reiniciar tudo?</h2>
    <p class="muted" style="margin:10px 0 18px">Apaga todo o progresso: heróis, Fragmentos, capítulos e a run atual. Não dá pra desfazer.</p>
    <div class="row">
      <button class="btn btn--primary" data-yes>Apagar progresso</button>
      <button class="btn btn--ghost" data-no>Cancelar</button>
    </div>
  `);
  box.querySelector("[data-yes]").addEventListener("click", () => {
    state.hardReset();
    close();
    toast("Progresso reiniciado.", "");
    router.go("menu");
  });
  box.querySelector("[data-no]").addEventListener("click", close);
}
