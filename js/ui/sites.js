/**
 * sites.js — nós não-combate: Evento (❓), Loja de Mácula (🛒), Descanso (⛺).
 */
import { state } from "../core/state.js";
import { router } from "./router.js";
import { toast } from "./toast.js";
import { h } from "./components.js";
import { rng } from "../core/rng.js";
import { EVENTS } from "../data/narrative.js";
import { applyEventEffects, clearNode, rollShop, buyShopItem, healSquad, reviveSquad } from "../systems/run.js";

const backToMap = (nodeId) => {
  clearNode(nodeId);
  router.go("map");
};

/* ------------------------------------------------------------------ EVENTO */
export function renderEvent(mount, { nodeId }) {
  const ev = rng.pick(EVENTS);

  const el = h(`
    <section class="narrative">
      <div class="narrative__scene">${ev.scene}</div>
      <div class="eyebrow" style="text-align:center">Evento</div>
      <h1 style="text-align:center; margin:4px 0 16px">${ev.title}</h1>
      <p class="narrative__text">${ev.text}</p>
      <div class="choice-list" id="choices"></div>
    </section>
  `);
  mount.appendChild(el);

  const box = el.querySelector("#choices");
  ev.choices.forEach((choice, i) => {
    const btn = h(`
      <button class="choice" data-i="${i}">
        <b>${choice.label}</b>
        <small>${choice.detail || ""}</small>
      </button>`);
    btn.addEventListener("click", () => resolveChoice(choice, nodeId, el));
    box.appendChild(btn);
  });
}

function resolveChoice(choice, nodeId, el) {
  if (choice.cost) {
    if (choice.cost.fragmentos && state.run.fragmentos < choice.cost.fragmentos) {
      return toast(`Faltam Fragmentos de Magma (${choice.cost.fragmentos} 🔥).`, "bad");
    }
    if (choice.cost.fragmentos) applyEventEffects([{ t: "fragmentos", n: -choice.cost.fragmentos }]);
  }

  const { needsUpgrade, lines } = applyEventEffects(choice.outcome.effects);

  el.innerHTML = `
    <div class="narrative__scene">✧</div>
    <p class="narrative__text">${choice.outcome.text}</p>
    <ul class="stack" style="--g:6px; margin:16px 0; list-style:none">
      ${lines.map((l) => `<li class="card" style="padding:10px 14px">${l}</li>`).join("")}
    </ul>
    <div class="row" style="justify-content:center">
      <button class="btn btn--primary" data-cont>Continuar</button>
    </div>`;

  el.querySelector("[data-cont]").addEventListener("click", () => {
    if (needsUpgrade) {
      router.go("reward", { nodeId, mode: "upgrade" });
    } else {
      backToMap(nodeId);
    }
  });
}

/* -------------------------------------------------------------------- LOJA */
export function renderShop(mount, { nodeId }) {
  const el = h(`
    <section class="narrative">
      <div class="narrative__scene">🛒</div>
      <div class="eyebrow" style="text-align:center">Loja de Mácula</div>
      <h1 style="text-align:center; margin:4px 0 6px">O Mercador Errante</h1>
      <p style="text-align:center" class="muted">Você tem <b>${state.run.fragmentos} 🔥</b> Fragmentos de Magma.</p>
      <div class="stack" id="stock" style="margin-top:18px"></div>
      <div class="row" style="justify-content:center; margin-top:20px">
        <button class="btn btn--primary" data-leave>Seguir viagem</button>
      </div>
    </section>
  `);
  mount.appendChild(el);

  const paint = () => {
    const stock = rollShop();
    const wrap = el.querySelector("#stock");
    wrap.innerHTML = stock
      .map(
        (it, i) => `
        <div class="shop-item ${it.sold ? "is-sold" : ""}">
          <span class="emoji">${it.emoji}</span>
          <div class="grow">
            <b>${it.name}</b>
            <div class="muted" style="font-size:.84rem">${it.desc}</div>
          </div>
          ${
            it.sold
              ? `<span class="muted">esgotado</span>`
              : `<button class="btn btn--sm" data-buy="${i}" ${state.run.fragmentos < it.price ? "disabled" : ""}>
                  <span class="price">${it.price} 🔥</span>
                 </button>`
          }
        </div>`
      )
      .join("");
    wrap.querySelectorAll("[data-buy]").forEach((b) =>
      b.addEventListener("click", () => {
        const r = buyShopItem(Number(b.dataset.buy));
        if (r.error) return toast("Fragmentos insuficientes.", "bad");
        toast(`Comprado: ${r.item.name}`, "good");
        el.querySelector("p.muted").innerHTML = `Você tem <b>${state.run.fragmentos} 🔥</b> Fragmentos de Magma.`;
        paint();
      })
    );
  };
  paint();

  el.querySelector("[data-leave]").addEventListener("click", () => {
    state.run.shopStock = null; // não reaproveita o estoque em outra loja
    backToMap(nodeId);
  });
}

/* ---------------------------------------------------------------- DESCANSO */
export function renderRest(mount, { nodeId }) {
  const el = h(`
    <section class="narrative">
      <div class="narrative__scene">⛺</div>
      <div class="eyebrow" style="text-align:center">Descanso / Meditação</div>
      <h1 style="text-align:center; margin:4px 0 16px">Uma trégua entre batalhas</h1>
      <p class="narrative__text">A fogueira estala. O esquadrão pode se recuperar — ou usar o silêncio para treinar.</p>
      <div class="choice-list">
        <button class="choice" data-act="heal">
          <b>⛺ Descansar</b>
          <small>Cura 45% do HP máximo de todo o esquadrão e reergue os caídos.</small>
        </button>
        <button class="choice" data-act="train">
          <b>🧘 Meditar &amp; Treinar</b>
          <small>Escolhe 1 carta de Mácula, mas cura apenas 15%.</small>
        </button>
      </div>
    </section>
  `);
  mount.appendChild(el);

  el.querySelector('[data-act="heal"]').addEventListener("click", () => {
    reviveSquad();
    toast("Esquadrão recuperado.", "good");
    backToMap(nodeId);
  });
  el.querySelector('[data-act="train"]').addEventListener("click", () => {
    healSquad(0.15);
    router.go("reward", { nodeId, mode: "upgrade" });
  });
}
