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
import { equipBonus, EQUIPMENT } from "../data/equipment.js";

const SAVE_VERSION = 4; // v4: começo sem herói, 20 Fragmentos iniciais, Tomos de Ascensão
const START_FRAG = 20; // gacha-gated: o jogador invoca o primeiro esquadrão (Ivad incluso no pool)

let _seq = 0;
const newUid = () => `h${Date.now().toString(36)}${(_seq++).toString(36)}`;

function freshMeta() {
  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    frag: START_FRAG, // Fragmentos Universais — moeda de Invocação
    pity: 0, // invocações desde o último 5★
    pulls: 0, // total de invocações
    roster: [], // [{ uid, id, level, xp, dupes, equip:{arma,armadura,reliquia} }]
    squad: [], // [uid, ...] até 4
    builds: [], // [{ id, name, squad:[uid,...] }] esquadrões salvos
    inventory: [], // [{ iid, id }] equipamentos obtidos
    tomes: 0, // Tomos de Ascensão — sobem 1 nível de um herói (ganhos em batalha)
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
        frag: old.sementes ?? old.frag ?? START_FRAG,
        pity: old.pity ?? 0,
        pulls: old.pulls ?? 0,
        roster: (old.roster || []).filter((e) => HEROES[e.id]).map((e) => ({ ...e, equip: e.equip || {} })),
        squad: (old.squad || []).slice(0, 4),
        builds: old.builds || [],
        inventory: old.inventory || [],
        tomes: old.tomes || 0,
        unlockedChapter: old.unlockedChapter ?? 1,
        runsWon: old.runsWon ?? 0,
      };
      this.run = null;
      // (não concede herói inicial — jogadores antigos mantêm a coleção que já têm)
    } else {
      // jogo novo: sem herói nenhum, só os 20 Fragmentos para a primeira invocação
      this.meta = freshMeta();
      this.run = null;
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
    this.persist();
    bus.emit("state:reset");
  },

  // ---------------------------------------------------- moeda
  addFrag(n) {
    this.meta.frag = Math.max(0, this.meta.frag + n);
    bus.emit("wallet:changed");
    this.persist();
  },

  spendFrag(n) {
    if (this.meta.frag < n) return false;
    this.meta.frag -= n;
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

    const entry = { uid: newUid(), id: heroId, level: 1, xp: 0, dupes: 0, equip: {} };
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
      .map((e) => {
        const s = heroStats(e);
        const eb = equipBonus(e, this.meta.inventory);
        return {
          ...e,
          def: HEROES[e.id],
          stats: {
            maxHP: s.maxHP + eb.maxHP,
            atk: Math.max(1, s.atk + eb.atk),
            def: Math.max(0, s.def + eb.def),
            spd: Math.max(1, s.spd + eb.spd),
            mov: s.mov,
            rng: s.rng,
          },
          baseStats: s,
          equipBonus: eb,
        };
      })
      .sort((a, b) => b.def.star - a.def.star || a.def.name.localeCompare(b.def.name));
  },

  // ---------------------------------------------------- equipamentos
  equipItem(uid, iid) {
    const entry = this.getEntry(uid);
    const inst = this.meta.inventory.find((x) => x.iid === iid);
    if (!entry || !inst) return false;
    const def = EQUIPMENT[inst.id];
    if (!def) return false;
    // tira o item de quem já estiver com ele
    for (const other of this.meta.roster) {
      if (other.equip?.[def.slot] === iid) other.equip[def.slot] = null;
    }
    entry.equip = entry.equip || {};
    entry.equip[def.slot] = iid;
    this.persist();
    bus.emit("roster:changed");
    return true;
  },

  unequipItem(uid, slot) {
    const entry = this.getEntry(uid);
    if (entry?.equip?.[slot]) {
      entry.equip[slot] = null;
      this.persist();
      bus.emit("roster:changed");
    }
  },

  equipMods(uid) {
    const entry = this.getEntry(uid);
    return entry ? equipBonus(entry, this.meta.inventory) : { atk: 0, def: 0, maxHP: 0, spd: 0 };
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

  // ---------------------------------------------------- esquadrões salvos (builds)
  saveBuild(name) {
    const squad = this.meta.squad.filter((uid) => this.getEntry(uid)).slice(0, 4);
    if (!squad.length) return null;
    const build = {
      id: newUid(),
      name: (name || "").trim() || `Esquadrão ${this.meta.builds.length + 1}`,
      squad,
    };
    this.meta.builds.push(build);
    this.persist();
    bus.emit("roster:changed");
    return build;
  },

  loadBuild(id) {
    const build = this.meta.builds.find((b) => b.id === id);
    if (!build) return false;
    this.meta.squad = build.squad.filter((uid) => this.getEntry(uid)).slice(0, 4);
    this.persist();
    bus.emit("roster:changed");
    return true;
  },

  deleteBuild(id) {
    this.meta.builds = this.meta.builds.filter((b) => b.id !== id);
    this.persist();
    bus.emit("roster:changed");
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

  // ---------------------------------------------------- Tomos de Ascensão
  addTomes(n) {
    this.meta.tomes = Math.max(0, (this.meta.tomes || 0) + n);
    this.persist();
    bus.emit("roster:changed");
  },

  /** Gasta 1 Tomo para subir 1 nível cheio do herói. */
  useTome(uid) {
    const entry = this.getEntry(uid);
    if (!entry || (this.meta.tomes || 0) <= 0) return { error: "sem-tomo" };
    if (entry.level >= LEVEL_CAP) return { error: "nivel-max" };
    this.meta.tomes -= 1;
    const before = entry.level;
    entry.xp += xpForNext(entry.level);
    bumpLevel(entry);
    this.persist();
    bus.emit("roster:changed");
    return { entry, from: before, to: entry.level };
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

  // ---------------------------------------------------- ADM (painel de admin)
  /** Grava campos arbitrários em meta (usado só pelo Painel ADM). */
  adminPatchMeta(patch) {
    Object.assign(this.meta, patch);
    this.persist();
    bus.emit("wallet:changed");
    bus.emit("roster:changed");
  },

  /** Grava campos arbitrários na run atual. */
  adminPatchRun(patch) {
    if (!this.run) return;
    Object.assign(this.run, patch);
    this.persist();
    bus.emit("run:changed");
  },

  /** Define o nível de um herói diretamente (ADM). */
  adminSetLevel(uid, level) {
    const entry = this.getEntry(uid);
    if (!entry) return;
    entry.level = Math.max(1, Math.min(LEVEL_CAP, Math.round(level) || 1));
    entry.xp = 0;
    this.persist();
    bus.emit("roster:changed");
  },
};
