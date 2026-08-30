/**
 * manifest.js — ponte entre IDs lógicos e arquivos de arte/áudio.
 *
 * Enquanto a pasta assets/ estiver vazia, MANIFEST fica vazio e asset()
 * devolve null → a UI usa o emoji da ficha. Quando a arte chegar, basta
 * preencher aqui, por exemplo:
 *
 *   heroes:  { ivad: "assets/heroes/ivad.png" },
 *   bg:      { haluho: "assets/bg/haluho.webp" },
 *   sfx:     { summon: "assets/audio/sfx/summon.ogg" },
 *
 * Nenhum outro arquivo precisa mudar.
 */

export const MANIFEST = {
  heroes: {},
  enemies: {},
  tiles: {},
  bg: {},
  ui: {},
  bgm: {},
  sfx: {},
};

/** Caminho do asset ou null se ainda não existir. */
export function asset(category, id) {
  return MANIFEST[category]?.[id] ?? null;
}

/**
 * Devolve markup de retrato: <img> se houver arte, senão o emoji.
 * Usado por todos os componentes de UI.
 */
export function portrait(category, id, emoji, cls = "") {
  const src = asset(category, id);
  if (src) return `<img src="${src}" alt="" class="${cls}" loading="lazy" />`;
  return `<span class="emoji ${cls}" aria-hidden="true">${emoji ?? "❔"}</span>`;
}

/** Toca um SFX se o arquivo existir (silencioso caso contrário). */
const audioCache = new Map();
export function playSfx(id, volume = 0.7) {
  const src = asset("sfx", id);
  if (!src) return;
  let a = audioCache.get(id);
  if (!a) {
    a = new Audio(src);
    audioCache.set(id, a);
  }
  a.volume = volume;
  a.currentTime = 0;
  a.play().catch(() => {});
}
