/**
 * menu.js — Santuário (tela inicial).
 */
import { state } from "../core/state.js";
import { router } from "./router.js";
import { modal, toast } from "./toast.js";
import { h } from "./components.js";
import { HEROES } from "../data/heroes.js";
import { CHAPTERS } from "../data/chapters.js";
import { abandonRun } from "../systems/run.js";

export function renderMenu(mount) {
  const m = state.meta;
  const fiveCount = m.roster.filter((e) => HEROES[e.id]?.star === 5).length;
  const hasRun = !!state.run;
  const chapterName = hasRun ? CHAPTERS.find((c) => c.id === state.run.chapter)?.name : null;

  mount.appendChild(
    h(`
    <section class="menu">
      <div class="menu__hero">
        <div class="menu__logo">As Aventuras<br>de Ivad</div>
        <div class="menu__tag">Selo Primordial</div>
        <p class="menu__desc">
          O céu rubro de Haluho racha sobre os mundos. Invoque os heróis da saga com
          Fragmentos Universais, forme seu esquadrão e enfrente os Irmãos Demônios,
          Korlok e o próprio Rei Demônio numa campanha tática roguelike.
        </p>
        <div class="menu__actions">
          ${
            hasRun
              ? `<button class="btn btn--primary btn--lg" data-act="continue">▶ Continuar — ${chapterName}</button>
                 <button class="btn btn--ghost" data-act="abandon">Abandonar jornada atual</button>`
              : `<button class="btn btn--primary btn--lg" data-act="new">⚔️ Nova Jornada</button>`
          }
          <button class="btn" data-nav="gacha">💠 Portal de Invocação</button>
          <button class="btn" data-nav="roster">🗡️ Coleção &amp; Esquadrão</button>
          <button class="btn btn--ghost btn--sm" data-act="adm">🛠 ADM — Fragmentos</button>
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
          <div class="menu__stat-row"><span>Capítulo liberado</span> <b>${m.unlockedChapter}</b></div>
          <div class="menu__stat-row"><span>Fragmentos Universais</span> <b>${m.frag} 💠</b></div>
        </div>
      </aside>
    </section>
  `)
  );

  mount.querySelector('[data-act="new"]')?.addEventListener("click", () => openChapterSelect());
  mount.querySelector('[data-act="continue"]')?.addEventListener("click", () => router.go("map"));
  mount.querySelector('[data-act="abandon"]')?.addEventListener("click", () => confirmAbandon());
  mount.querySelector('[data-act="adm"]')?.addEventListener("click", () => openAdmPanel());
  mount.querySelector('[data-act="reset"]')?.addEventListener("click", () => confirmReset());
}

function openAdmPanel() {
  const amounts = [10, 50, 100, 500];
  const { box, close } = modal(`
    <h2 style="margin-bottom:4px">🛠 Painel ADM</h2>
    <p class="muted" style="margin-bottom:14px" id="adm-bal">Fragmentos Universais: <b>${state.meta.frag} 💠</b></p>
    <div class="stack" style="--g:8px">
      <div class="row" style="gap:8px; flex-wrap:wrap">
        ${amounts.map((n) => `<button class="btn btn--sm" data-add="${n}">＋${n} 💠</button>`).join("")}
      </div>
      <div class="row" style="gap:8px; flex-wrap:wrap">
        ${amounts.map((n) => `<button class="btn btn--ghost btn--sm" data-add="${-n}">−${n} 💠</button>`).join("")}
      </div>
      <button class="btn btn--ghost btn--sm" data-zero>Zerar Fragmentos</button>
    </div>
    <div class="row" style="margin-top:16px">
      <button class="btn btn--primary" data-close>Fechar</button>
    </div>
  `);
  const refresh = () => {
    box.querySelector("#adm-bal").innerHTML = `Fragmentos Universais: <b>${state.meta.frag} 💠</b>`;
  };
  box.querySelectorAll("[data-add]").forEach((b) =>
    b.addEventListener("click", () => {
      state.addFrag(Number(b.dataset.add));
      refresh();
    })
  );
  box.querySelector("[data-zero]").addEventListener("click", () => {
    state.addFrag(-state.meta.frag);
    refresh();
  });
  box.querySelector("[data-close]").addEventListener("click", () => {
    close();
    router.go("menu"); // re-renderiza o painel lateral com o novo saldo
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
