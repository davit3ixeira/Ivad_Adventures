/**
 * reward.js — espólios pós-batalha e escolha de Carta de Mácula.
 *
 * modos:
 *   'battle'  → resumo de recompensas + escolha de 1 de 3 upgrades
 *   'upgrade' → só a escolha (vindo de evento / descanso)
 */
import { state } from "../core/state.js";
import { router } from "./router.js";
import { modal } from "./toast.js";
import { h } from "./components.js";
import { clearNode, grantRandomUpgradeChoices, addUpgrade, endRunVictory } from "../systems/run.js";
import { getChapter, CHAPTERS } from "../data/chapters.js";
import { EQUIPMENT, RANKS } from "../data/equipment.js";

export function renderReward(mount, { nodeId, mode = "upgrade", outcome = null }) {
  const run = state.run;
  if (!run) return router.go("menu");

  const isBoss = !!outcome?.isBoss;
  const choices = grantRandomUpgradeChoices(3);

  const rewardCards =
    mode === "battle" && outcome
      ? `<div class="reward-grid" style="margin-bottom:28px">
          <div class="reward-card" style="cursor:default"><span class="emoji">💠</span><b>+${outcome.rewards.frag}</b><p>Fragmentos Universais</p></div>
          <div class="reward-card" style="cursor:default"><span class="emoji">💎</span><b>+${outcome.rewards.gemas}</b><p>Gemas</p></div>
          ${
            outcome.rewards.relic
              ? `<div class="reward-card" style="cursor:default"><span class="emoji">${outcome.rewards.relic.emoji}</span><b>${outcome.rewards.relic.name}</b><p>${outcome.rewards.relic.text}</p></div>`
              : ""
          }
          ${
            outcome.rewards.equip && EQUIPMENT[outcome.rewards.equip.id]
              ? (() => {
                  const d = EQUIPMENT[outcome.rewards.equip.id];
                  return `<div class="reward-card rank-${d.rank}" style="cursor:default"><span class="emoji">${d.emoji}</span><b>${d.name}</b><p><span class="rank-tag">${RANKS[d.rank].label}</span> — vai pro Arsenal</p></div>`;
                })()
              : ""
          }
        </div>`
      : "";

  const el = h(`
    <section>
      <div class="screen-head" style="text-align:center">
        <div class="eyebrow">${mode === "battle" ? (isBoss ? "✦ Chefe derrotado ✦" : "Vitória") : "Recompensa"}</div>
        <h1 class="screen-title">${mode === "battle" ? "Espólios de Batalha" : "Carta de Mácula"}</h1>
        <p class="screen-sub" style="margin:6px auto 0">Escolha 1 melhoria temporária para o esquadrão nesta run.</p>
      </div>
      ${rewardCards}
      <div class="reward-grid" id="ups"></div>
      <div class="row" style="justify-content:center; margin-top:24px">
        <button class="btn btn--ghost btn--sm" data-skip>Dispensar melhoria</button>
      </div>
    </section>
  `);
  mount.appendChild(el);

  const proceed = () => {
    if (isBoss) {
      showOutro(getChapter(run.chapter));
    } else {
      clearNode(nodeId);
      router.go("map");
    }
  };

  const ups = el.querySelector("#ups");
  choices.forEach((u) => {
    const card = h(`
      <button class="reward-card">
        <span class="emoji">${u.emoji}</span>
        <b>${u.name}</b>
        <p>${u.text}</p>
      </button>`);
    card.addEventListener("click", () => {
      addUpgrade(u.id);
      proceed();
    });
    ups.appendChild(card);
  });

  el.querySelector("[data-skip]").addEventListener("click", proceed);
}

function showOutro(chapter) {
  const nextChapter = CHAPTERS.find((c) => c.id === chapter.id + 1);
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    if (state.run) endRunVictory();
    router.go("menu");
  };

  const { box, close } = modal(
    `
    <div class="narrative">
      <div class="narrative__scene">${chapter.scene}</div>
      <div class="eyebrow" style="text-align:center">Capítulo ${chapter.id} concluído</div>
      <h2 style="text-align:center; margin:4px 0 14px">${chapter.name}</h2>
      <p class="narrative__text">${chapter.outro}</p>
      <p class="muted" style="margin-top:14px; text-align:center">
        ${nextChapter ? `Capítulo ${nextChapter.id} — “${nextChapter.name}” liberado.` : "Você chegou ao fim da saga. Por enquanto."}
      </p>
      <div class="row" style="justify-content:center; margin-top:22px">
        <button class="btn btn--primary" data-fin>Voltar ao Santuário</button>
      </div>
    </div>
  `,
    { onClose: finish }
  );
  box.querySelector("[data-fin]").addEventListener("click", close);
}
