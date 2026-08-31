/**
 * gacha.js — tela do Portal de Invocação.
 */
import { state } from "../core/state.js";
import { GACHA, summon, canAfford, ratesLabel } from "../systems/gacha.js";
import { router } from "./router.js";
import { toast } from "./toast.js";
import { h, stars } from "./components.js";
import { portrait, playSfx } from "../data/manifest.js";

export function renderGacha(mount) {
  const rates = ratesLabel();
  const softLeft = Math.max(0, GACHA.softPityStart - state.meta.pity);

  const el = h(`
    <section>
      <div class="screen-head">
        <div class="eyebrow">Portal de Invocação</div>
        <h1 class="screen-title">Fragmentos Universais</h1>
        <p class="screen-sub">Ecos dos heróis da saga respondem ao chamado. Gaste Fragmentos e veja quem atende.</p>
      </div>

      <div class="summon">
        <div class="summon__stage" id="summon-stage">
          <div class="summon__altar">💠</div>
          <div class="summon__hint">O altar aguarda uma oferenda.</div>
        </div>

        <div class="panel summon__panel">
          <div class="row row--between">
            <b>Saldo</b><b>${state.meta.frag} 💠</b>
          </div>
          <div class="summon__rates">
            <div><span class="stars" style="--rar:var(--r5)">${stars(5)}</span><span>${rates[5]}</span></div>
            <div><span class="stars" style="--rar:var(--r4)">${stars(4)}</span><span>${rates[4]}</span></div>
            <div><span class="stars" style="--rar:var(--r3)">${stars(3)}</span><span>${rates[3]}</span></div>
          </div>
          <div class="pity-track">
            <div class="bar bar--xp"><div class="bar__fill" style="width:${Math.min(100, (state.meta.pity / GACHA.hardPity) * 100)}%"></div></div>
            <small>${
              state.meta.pity >= GACHA.softPityStart
                ? `Sorte crescente! 5★ em no máximo ${GACHA.hardPity - state.meta.pity} invocações.`
                : `${softLeft} invocações até a sorte começar a subir.`
            }</small>
          </div>

          <div class="stack" style="--g:10px; margin-top:18px">
            <button class="btn btn--primary btn--block" id="pull-1" ${canAfford("single") ? "" : "disabled"}>
              Invocar ×1 — ${GACHA.costSingle} 💠
            </button>
            <button class="btn btn--gold btn--block" id="pull-5" ${canAfford("multi") ? "" : "disabled"}>
              Invocar ×5 — ${GACHA.costMulti} 💠 <span class="muted" style="font-size:.8rem">(4★ garantido)</span>
            </button>
            <button class="btn btn--ghost btn--block" data-nav="roster">Ver Coleção</button>
          </div>
        </div>
      </div>
    </section>
  `);
  mount.appendChild(el);

  const stage = el.querySelector("#summon-stage");
  const pull = (kind) => {
    const res = summon(kind);
    if (res.error) {
      toast("Fragmentos Universais insuficientes.", "bad");
      return;
    }
    playSfx("summon");
    showReveal(stage, res.results, res.refund, () => renderGacha(reset(mount)));
  };

  el.querySelector("#pull-1").addEventListener("click", () => pull("single"));
  el.querySelector("#pull-5").addEventListener("click", () => pull("multi"));
}

function reset(mount) {
  mount.innerHTML = "";
  return mount;
}

function showReveal(stage, results, refund, done) {
  const best = Math.max(...results.map((r) => r.star));
  const cards = results
    .map(
      (r) => `
      <div class="reveal-card rar-${r.star} ${r.isNew ? "is-new" : ""}" style="--rar:var(--r${r.star})">
        ${portrait("heroes", r.heroId, r.emoji)}
        <div>${r.name}</div>
        <div class="stars">${stars(r.star)}</div>
      </div>`
    )
    .join("");

  const overlay = h(`
    <div class="reveal ${best === 5 ? "flash-5" : ""}">
      <div class="eyebrow">${best === 5 ? "Lenda Invocada" : best === 4 ? "Invocação Rara" : "Invocação"}</div>
      <div class="reveal__cards">${cards}</div>
      <div class="muted" style="font-size:.82rem; min-height:1em">${
        refund > 0 ? `Cópias converteram-se em +${refund} 💠 e progresso de nível.` : ""
      }</div>
      <div class="reveal__hint">toque para continuar</div>
    </div>
  `);
  stage.appendChild(overlay);
  // sem botão: toca em qualquer lugar para seguir (após um instante, p/ não pular sem querer)
  let armed = false;
  setTimeout(() => (armed = true), 350);
  overlay.addEventListener("click", () => {
    if (armed) done();
  });
}
