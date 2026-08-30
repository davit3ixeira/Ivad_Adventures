/**
 * heroes.js — fichas dos heróis invocáveis de "As Aventuras de Ivad".
 * Flavor e técnicas seguem o livro (Super Soco, Super Chute, Super Pulo,
 * Soco Nuclear, Soco da Natureza, Carapaça, Projeção, Forma de Meio-Demônio...).
 *
 * aff  : afinidade de energia  → 'fisico' | 'espiritual' | 'natureza'
 * role : arquétipo tático      → 'bruiser' | 'tank' | 'ranged' | 'skirmisher' | 'healer'
 * base : atributos no nível 1  (escalam com heroStats())
 * skill.effect.type : passiva lida por systems/battle.js
 *   opener      +pct ao iniciar com HP cheio
 *   pierce      ignora `flat` de Defesa do alvo
 *   bulwark     reduz `pct` do dano recebido
 *   naturePunch rouba `pct` do dano causado como vida
 *   riposte     +pct de dano ao CONTRA-ATACAR
 *   safeShot    +pct se o alvo não puder revidar
 *   swift       precisa de só `threshold` de SPD para atacar 2×
 *   packHunt    +pct por aliado adjacente ao alvo
 *   healer      cura em vez de atacar (flat + 0.6×ATK)
 *
 * emoji é só fallback — quando houver arte, aponte em data/manifest.js.
 */

export const LEVEL_CAP = 40;

export const AFFINITIES = {
  fisico: { label: "Físico / Marcial", icon: "🔴", beats: "natureza" },
  natureza: { label: "Natureza / Selvagem", icon: "🟢", beats: "espiritual" },
  espiritual: { label: "Espiritual / Ki", icon: "🔵", beats: "fisico" },
};

export const HEROES = {
  ivad: {
    id: "ivad",
    name: "Ivad",
    title: "O Herdeiro do Soco Nuclear",
    star: 5,
    aff: "fisico",
    role: "bruiser",
    emoji: "🥊",
    quote: "Perdi minha família para Haluho. Não vou perder o resto do mundo.",
    base: { hp: 46, atk: 26, def: 9, spd: 10 },
    mov: 3,
    rng: 1,
    skill: {
      name: "Soco Nuclear",
      text: "Ao iniciar o combate com HP cheio, causa +30% de dano (Forma de Meio-Demônio).",
      effect: { type: "opener", pct: 0.3 },
    },
  },

  takimatida: {
    id: "takimatida",
    name: "Takimatida",
    title: "Mestre de Duas Espadas",
    star: 5,
    aff: "espiritual",
    role: "skirmisher",
    emoji: "⚔️",
    quote: "Arrogância é o caminho mais rápido para a morte.",
    base: { hp: 42, atk: 25, def: 9, spd: 12 },
    mov: 3,
    rng: 1,
    skill: {
      name: "Espadas Gêmeas",
      text: "Os cortes cruzados ignoram 5 de Defesa do alvo.",
      effect: { type: "pierce", flat: 5 },
    },
  },

  poderoso: {
    id: "poderoso",
    name: "Poderoso",
    title: "O Exilado do Planeta Poder",
    star: 5,
    aff: "fisico",
    role: "tank",
    emoji: "🗿",
    quote: "Pode bater. Eu espero.",
    base: { hp: 62, atk: 24, def: 13, spd: 5 },
    mov: 2,
    rng: 1,
    skill: {
      name: "Soco Forte",
      text: "Ao iniciar o combate com HP cheio, +25% de dano — força capaz de arrasar um estado.",
      effect: { type: "opener", pct: 0.25 },
    },
  },

  xingzang: {
    id: "xingzang",
    name: "Xing Zang",
    title: "Mestre do Dojo nas Montanhas",
    star: 5,
    aff: "natureza",
    role: "skirmisher",
    emoji: "🥷",
    quote: "Poder sem controle é uma tempestade sem direção.",
    base: { hp: 42, atk: 23, def: 8, spd: 13 },
    mov: 3,
    rng: 1,
    skill: {
      name: "Soco da Natureza",
      text: "Em harmonia com o universo: recupera 20% do dano causado como HP.",
      effect: { type: "naturePunch", pct: 0.2 },
    },
  },

  oaoj: {
    id: "oaoj",
    name: "Oaoj",
    title: "O Punho da Carapaça",
    star: 4,
    aff: "fisico",
    role: "tank",
    emoji: "🐢",
    quote: "É só apontar na direção certa que eu resolvo.",
    base: { hp: 52, atk: 23, def: 11, spd: 7 },
    mov: 3,
    rng: 1,
    skill: {
      name: "Carapaça",
      text: "Reduz em 20% todo o dano recebido, sem perder mobilidade.",
      effect: { type: "bulwark", pct: 0.2 },
    },
  },

  ketchou: {
    id: "ketchou",
    name: "KetchouEtchou",
    title: "Portador do Feixe de Luz",
    star: 4,
    aff: "espiritual",
    role: "ranged",
    emoji: "✨",
    quote: "Pelo poder de Ketchou, pelo poder de Etchou... KETCHOU!",
    base: { hp: 36, atk: 24, def: 6, spd: 9 },
    mov: 2,
    rng: 2,
    skill: {
      name: "Feixe Ketchou",
      text: "Ataca à distância 2; se o alvo não puder revidar, +20% de dano.",
      effect: { type: "safeShot", pct: 0.2 },
    },
  },

  joepistoleiro: {
    id: "joepistoleiro",
    name: "Joe Pistoleiro",
    title: "A Pistola Lendária de Mácula",
    star: 4,
    aff: "fisico",
    role: "ranged",
    emoji: "🤠",
    quote: "Se vamos lutar, vamos lutar para vencer.",
    base: { hp: 37, atk: 26, def: 5, spd: 10 },
    mov: 3,
    rng: 2,
    skill: {
      name: "Tiro de Mácula",
      text: "Precisão absurda: o disparo ignora 5 de Defesa do alvo.",
      effect: { type: "pierce", flat: 5 },
    },
  },

  kaowoji: {
    id: "kaowoji",
    name: "Kão-Woji",
    title: "O Rei do Deserto",
    star: 4,
    aff: "natureza",
    role: "bruiser",
    emoji: "🐺",
    quote: "Você fala demais, sabia? Prove que vale o esforço.",
    base: { hp: 46, atk: 22, def: 10, spd: 8 },
    mov: 3,
    rng: 1,
    skill: {
      name: "Reflexo do Deserto",
      text: "Ao revidar, devolve o golpe com o dobro da força (+60% no contra-ataque).",
      effect: { type: "riposte", pct: 0.6 },
    },
  },

  joefino: {
    id: "joefino",
    name: "Joe Fino",
    title: "Estrategista da Linhagem Joe",
    star: 3,
    aff: "natureza",
    role: "skirmisher",
    emoji: "🎩",
    quote: "Se agirmos como peças soltas, ele nos esmaga um por um.",
    base: { hp: 34, atk: 21, def: 6, spd: 12 },
    mov: 4,
    rng: 1,
    skill: {
      name: "Golpe Estratégico",
      text: "Mira os pontos fracos: ignora 4 de Defesa do alvo.",
      effect: { type: "pierce", flat: 4 },
    },
  },

  bob: {
    id: "bob",
    name: "Bob",
    title: "Aprendiz de Centris",
    star: 3,
    aff: "espiritual",
    role: "ranged",
    emoji: "🔮",
    quote: "Acho que fiz certo dessa vez.",
    base: { hp: 33, atk: 21, def: 5, spd: 8 },
    mov: 2,
    rng: 2,
    skill: {
      name: "Fagulha de Ki",
      text: "Ataque básico de energia à distância 2.",
      effect: { type: "none" },
    },
  },

  calico: {
    id: "calico",
    name: "Calico",
    title: "Criança de Linhagem Divina",
    star: 3,
    aff: "natureza",
    role: "healer",
    emoji: "🐈",
    quote: "Fica quieto que isso aqui arde um pouco.",
    base: { hp: 38, atk: 16, def: 8, spd: 9 },
    mov: 3,
    rng: 2,
    skill: {
      name: "Bênção Serena",
      text: "Em vez de atacar, cura um aliado à distância 2 em (14 + 0,6×ATK).",
      effect: { type: "healer", flat: 14 },
    },
  },
};

export const HERO_IDS = Object.keys(HEROES);

/** Atributos efetivos de um herói do roster no seu nível atual. */
export function heroStats(entry) {
  const def = HEROES[entry.id];
  const L = entry.level - 1;
  const grow = (b, rate, floor = 0) => Math.round(b + L * (b * rate + floor));
  return {
    maxHP: grow(def.base.hp, 0.06),
    atk: grow(def.base.atk, 0.055),
    def: grow(def.base.def, 0.04, 0.25),
    spd: grow(def.base.spd, 0.03),
    mov: def.mov,
    rng: def.rng,
  };
}

/** XP necessário para sair do nível informado. */
export function xpForNext(level) {
  return 60 + level * 45;
}
