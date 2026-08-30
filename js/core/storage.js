/**
 * storage.js — persistência em localStorage com versionamento de schema.
 */
const KEY = "ivad.save.v1";

export const storage = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn("[storage] save corrompido, ignorando", err);
      return null;
    }
  },

  save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error("[storage] falha ao gravar", err);
      return false;
    }
  },

  wipe() {
    localStorage.removeItem(KEY);
  },
};
