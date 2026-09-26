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
  const level = (state.meta.ascensionBest || 0) + 1;
  openPactSelect(level);
}

/** Pactos de Punição: escolha opcional e combinável de risco↔recompensa antes de subir a Torre. */
function openPactSelect(level) {
  const chosen = new Set();

  const pactCard = (p) => `
    <button class="pact-card ${chosen.has(p.id) ? "is-on" : ""}" data-pact="${p.id}">
      <b>${p.emoji} ${p.name}</b>
      <small class="pact-card__risk">⚠️ ${p.text}</small>
      <small class="pact-card__boon">🎁 ${p.boon}</small>
    </button>`;

  const summary = () =>
    chosen.size === 0
      ? `<span class="muted">Nenhum Pacto selecionado — nível ${level} no seu ritmo normal.</span>`
      : `<b>${chosen.size} Pacto${chosen.size > 1 ? "s" : ""} ativo${chosen.size > 1 ? "s" : ""}.</b> Inimigos mais fortes, loot maior.`;

  const { box, close } = modal(`
    <h2 style="margin-bottom:6px">🌌 Torre da Ascensão — Nível ${level}</h2>
    <p class="muted" style="margin-bottom:16px">
      Pactos de Punição (opcional): fortaleça os inimigos deste nível em troca de mais Fragmentos, Gemas
      ou equipamentos. Combine quantos quiser — ou entre sem nenhum.
    </p>
    <div class="pact-list" id="pact-list">${PACTS.map(pactCard).join("")}</div>
    <div class="pact-summary" id="pact-summary">${summary()}</div>
    <div class="row" style="margin-top:16px">
      <button class="btn btn--primary" data-start>▶ Entrar na Torre</button>
      <button class="btn btn--ghost" data-cancel>Cancelar</button>
    </div>
  `);

  const wireCards = () => {
    box.querySelectorAll("[data-pact]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.pact;
        if (chosen.has(id)) chosen.delete(id);
        else chosen.add(id);
        box.querySelector("#pact-list").innerHTML = PACTS.map(pactCard).join("");
        box.querySelector("#pact-summary").innerHTML = summary();
        wireCards();
      });
    });
  };
  wireCards();

  box.querySelector("[data-start]").addEventListener("click", () => {
    close();
    router.go("map", { newRun: CHAPTERS.length + level, ascension: level, pacts: [...chosen] });
  });
  box.querySelector("[data-cancel]").addEventListener("click", close);
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
