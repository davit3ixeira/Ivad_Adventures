/**
 * router.js — troca de telas. Cada tela registra uma função render(mount, params).
 */
import { bus } from "../core/bus.js";

const routes = new Map();
let currentName = null;

export const router = {
  register(name, renderFn) {
    routes.set(name, renderFn);
  },

  go(name, params = {}) {
    const render = routes.get(name);
    if (!render) {
      console.error(`[router] rota desconhecida: ${name}`);
      return;
    }
    currentName = name;
    document.body.dataset.route = name;
    const mount = document.getElementById("app");
    mount.innerHTML = "";
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    render(mount, params);
    bus.emit("route:changed", name);
  },

  get current() {
    return currentName;
  },
};
