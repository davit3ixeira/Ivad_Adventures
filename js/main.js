/**
 * main.js — ponto de entrada. Inicializa estado, registra telas,
 * liga a topbar e abre o Santuário.
 */
import { state } from "./core/state.js";
import { bus } from "./core/bus.js";
import { router } from "./ui/router.js";
import { toast } from "./ui/toast.js";
import { HEROES } from "./data/heroes.js";

import { renderMenu } from "./ui/menu.js";
import { renderGacha } from "./ui/gacha.js";
import { renderRoster } from "./ui/roster.js";
import { renderMap } from "./ui/map.js";
import { renderBattle } from "./ui/battle.js";
import { renderEvent, renderShop, renderRest } from "./ui/sites.js";
import { renderReward } from "./ui/reward.js";
import { renderAdmin } from "./ui/admin.js";

state.init();

router.register("menu", renderMenu);
router.register("gacha", renderGacha);
router.register("roster", renderRoster);
router.register("map", renderMap);
router.register("battle", renderBattle);
router.register("event", renderEvent);
router.register("shop", renderShop);
router.register("rest", renderRest);
router.register("reward", renderReward);
router.register("admin", renderAdmin);

/* ---------------------------------------------------------- topbar / wallet */
const topbar = document.getElementById("topbar");
const elSem = document.getElementById("wallet-sementes");
const elFrag = document.getElementById("wallet-fragmentos");
const fragWrap = document.getElementById("wallet-fragmentos-wrap");

function bump(el) {
  const pill = el.closest(".wallet__item");
  if (!pill) return;
  pill.classList.remove("is-bump");
  void pill.offsetWidth; // reinicia a animação
  pill.classList.add("is-bump");
}

function refreshWallet() {
  const frag = String(state.meta.frag);
  if (elSem.textContent !== frag && elSem.textContent !== "") bump(elSem);
  elSem.textContent = frag;

  if (state.run) {
    fragWrap.hidden = false;
    const g = String(state.run.gemas);
    if (elFrag.textContent !== g && elFrag.textContent !== "") bump(elFrag);
    elFrag.textContent = g;
  } else {
    fragWrap.hidden = true;
  }
}

["wallet:changed", "run:changed", "run:started", "run:ended", "state:saved", "state:reset"].forEach((ev) =>
  bus.on(ev, refreshWallet)
);

bus.on("route:changed", () => {
  topbar.hidden = false;
  refreshWallet();
});

/* ---------------------------------------------------------- navegação global */
document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-nav]");
  if (nav) router.go(nav.dataset.nav);
});

/* ---------------------------------------------------------- feedback de gacha */
bus.on("hero:new", ({ heroId }) => {
  if (HEROES[heroId]?.star === 5) toast(`✦ Lenda reunida: ${HEROES[heroId].name}!`, "gold", 3200);
});

/* ---------------------------------------------------------- run encerrada */
bus.on("run:ended", ({ victory, abandoned, loot }) => {
  if (abandoned) return;
  if (victory) toast("Capítulo concluído! 🌟", "good", 3200);
  else toast("A jornada terminou. Tente de novo com um novo esquadrão.", "bad", 3600);
  if (loot > 0) toast(`🎒 ${loot} equipamento${loot > 1 ? "s" : ""} no Arsenal.`, "gold", 3000);
});

/* ---------------------------------------------------------- start */
router.go("menu");

// atalho de dev: ?seed de sementes
if (new URLSearchParams(location.search).has("rico")) {
  state.addFrag(500);
}
