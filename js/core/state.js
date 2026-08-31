/**
 * state.js — estado global do jogo.
 *
 *   meta : progresso permanente (moeda, roster, esquadrão, capítulos)
 *   run  : a run roguelike em andamento (ou null)
 *
 * Toda mutação passa por métodos que emitem eventos e persistem.
 */
import { storage } from "./storage.js";
import { bus } from "./bus.js";
import { HEROES, heroStats, xpForNext, LEVEL_CAP } from "../data/heroes.js";

const SAVE_VERSION = 2; // v2: sistema de tipos (físico/projeção/mana), rebalanço
const STARTING_SEMENTES = 100;
const STARTER_HERO = "joao"; // tanque durável p/ começar; Davi (curandeiro) e Ivad vêm da Invocação

let _seq = 0;
const newUid = () => `h${Date.now().toString(36)}${(_seq++).toString(36)}`;

function freshMeta() {
  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    sementes: STARTING_SEMENTES,
    pity: 0, // invocações desde o último 5★
    pulls: 0, // total de invocações
    roster: [], // [{ uid, id, level, xp, dupes }]
    squad: [], // [uid, ...] até 4
    unlockedChapter: 1,
    runsWon: 0,
    firstFivePity: 60, // 5★ garantido nesta contagem
  };
}

function bumpLevel(entry) {
  while (entry.level < LEVEL_CAP && entry.xp >= xpForNext(entry.level)) {
    entry.xp -= xpForNext(entry.level);
    entry.level += 1;
  }
  if (entry.level >= LEVEL_CAP) entry.xp = 0;
}

export const state = {
  meta: freshMeta(),
  run: null,

  init() {
    const saved = storage.load();
    if (saved?.meta?.version === SAVE_VERSION) {
      this.meta = { ...freshMeta(), ...saved.meta };
      this.run = saved.run ?? null;
    } else if (saved?.meta?.roster) {
      // migração de versão anterior: mantém coleção e moedas, descarta a run
      const old = saved.meta;
      this.meta = {
        ...freshMeta(),
        sementes: old.sementes ?? STARTING_SEMENTES,
        pity: old.pity ?? 0,
        pulls: old.pulls ?? 0,
        roster: (old.roster || []).filter((e) => HEROES[e.id]),
        squad: (old.squad || []).slice(0, 4),
        unlockedChapter: old.unlockedChapter ?? 1,
        runsWon: old.runsWon ?? 0,
      };
      this.run = null;
      if (this.meta.roster.length === 0) this.grantHero(STARTER_HERO, { quiet: true });
    } else {
      this.meta = freshMeta();
      this.run = null;
      this.grantHero(STARTER_HERO, { quiet: true });
    }
    this.persist();
    return this;
  },

  persist() {
    storage.save({ meta: this.meta, run: this.run });
    bus.emit("state:saved");
  },

  hardReset() {
    storage.wipe();
    this.meta = freshMeta();
    this.run = null;
    this.grantHero(STARTER_HERO, { quiet: true });
    this.persist();
    bus.emit("state:reset");
  },

  // ---------------------------------------------------- moeda
  addSementes(n) {
    this.meta.sementes = Math.max(0, this.meta.sementes + n);
    bus.emit("wallet:changed");
    this.persist();
  },

  spendSementes(n) {
    if (this.meta.sementes < n) return false;
    this.meta.sementes -= n;
    bus.emit("wallet:changed");
    this.persist();
    return true;
  },

  // ---------------------------------------------------- roster
  grantHero(heroId, { quiet = false } = {}) {
    const def = HEROES[heroId];
    if (!def) return null;

    const existing = this.meta.roster.find((h) => h.id === heroId);
    if (existing) {
      existing.dupes += 1;
      existing.xp += 240; // duplicata → progresso
      bumpLevel(existing);
      this.persist();
      bus.emit("roster:changed");
      if (!quiet) bus.emit("hero:duplicate", { heroId, entry: existing });
      return { entry: existing, isNew: false };
    }

    const entry = { uid: newUid(), id: heroId, level: 1, xp: 0, dupes: 0 };
    this.meta.roster.push(entry);
    if (this.meta.squad.length < 4) this.meta.squad.push(entry.uid);
    this.persist();
    bus.emit("roster:changed");
    if (!quiet) bus.emit("hero:new", { heroId, entry });
    return { entry, isNew: true };
  },

  getEntry(uid) {
    return this.meta.roster.find((h) => h.uid === uid) ?? null;
  },

  rosterView() {
    return this.meta.roster
      .filter((e) => HEROES[e.id])
      .map((e) => ({ ...e, def: HEROES[e.id], stats: heroStats(e) }))
      .sort((a, b) => b.def.star - a.def.star || a.def.name.localeCompare(b.def.name));
  },

  squadEntries() {
    return this.meta.squad.map((u) => this.getEntry(u)).filter((e) => e && HEROES[e.id]);
  },

  isInSquad(uid) {
    return this.meta.squad.includes(uid);
  },

  toggleSquad(uid) {
    const i = this.meta.squad.indexOf(uid);
    if (i >= 0) {
      this.meta.squad.splice(i, 1);
    } else {
      if (this.meta.squad.length >= 4) return "full";
      this.meta.squad.push(uid);
    }
    this.persist();
    bus.emit("roster:changed");
    return "ok";
  },

  awardHeroXp(uid, amount) {
    const entry = this.getEntry(uid);
    if (!entry) return null;
    const before = entry.level;
    entry.xp += amount;
    bumpLevel(entry);
    this.persist();
    bus.emit("roster:changed");
    return { entry, leveledUp: entry.level > before, from: before };
  },

  // ---------------------------------------------------- capítulos
  unlockChapter(id) {
    if (id > this.meta.unlockedChapter) {
      this.meta.unlockedChapter = id;
      this.persist();
      bus.emit("chapter:unlocked", id);
    }
  },

  // ---------------------------------------------------- run
  setRun(run) {
    this.run = run;
    this.persist();
  },

  clearRun() {
    this.run = null;
    this.persist();
  },
};
