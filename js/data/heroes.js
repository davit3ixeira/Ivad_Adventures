/**
 * heroes.js — fichas dos heróis invocáveis de "As Aventuras de Ivad".
 *
 *   types  — 1, 2 ou 3 de: 'fisico' | 'projecao' | 'mana'
 *            (3 tipos = DIVINO, transcende o triângulo). Ver systems/affinity.js.
 *   skill  — PASSIVA (sempre ativa)
 *   active — ESPECIAL (carrega +1 por turno para o último herói usado)
 *
 * ── PASSIVAS (skill.effect.type) ──────────────────────────────────────────
 *   opener  · pierce · bulwark · naturePunch · thorns · safeShot · swift · packHunt · healer
 *
 * ── ESPECIAIS (active.kind) ───────────────────────────────────────────────
 *   nuke · blast · aura · line · heal · shield · rally · dash · reflect
 *   charge : turnos até ficar pronto   ·   banner : texto na tela   ·   fx : efeito
 */

export const LEVEL_CAP = 40;

export const HEROES = {
  // ═══════════════ Terra — os jovens de Takimatida ═══════════════
  davi: {
    id: "davi",
    name: "Davi",
    title: "Sobrevivente da Terra",
    star: 3,
    types: ["fisico"],
    role: "healer",
    emoji: "🧑",
    quote: "Se não formos nós, quem mais?",
    base: { hp: 40, atk: 18, def: 8, spd: 9 },
    mov: 3,
    rng: 2,
    skill: { name: "Luz nas Mãos", text: "Em vez de atacar, cura um aliado à distância 2 em (12 + 0,6×ATK).", effect: { type: "healer", flat: 12 } },
    active: {
      name: "Mãos de Luz",
      banner: "MÃOS DE LUZ",
      text: "A luz brota das mãos e cura TODO o esquadrão em 30% do HP máximo.",
      kind: "heal",
      shape: "all",
      power: 0.3,
      charge: 3,
      fx: "sparkle",
    },
  },

  joao: {
    id: "joao",
    name: "João",
    title: "O Brincalhão de Punho Firme",
    star: 3,
    types: ["fisico"],
    role: "tank",
    emoji: "🧔",
    quote: "É só apontar na direção certa que eu resolvo.",
    base: { hp: 48, atk: 21, def: 11, spd: 6 },
    mov: 3,
    rng: 1,
    skill: { name: "Carapaça", text: "Reduz em 14% todo o dano recebido.", effect: { type: "bulwark", pct: 0.14 } },
    active: {
      name: "Super Chute",
      banner: "SUPER CHUTE!",
      text: "Um chute que estoura o chão: acerta o alvo e todos ao redor dele.",
      kind: "blast",
      shape: "cross",
      power: 1.6,
      range: 1,
      charge: 3,
      fx: "blast",
    },
  },

  // ═══════════════ Formas despertas ═══════════════
  ivad: {
    id: "ivad",
    name: "Ivad",
    title: "O Herdeiro do Soco Nuclear",
    star: 5,
    types: ["fisico", "mana"],
    role: "bruiser",
    emoji: "🥊",
    quote: "A Terra não vai cair enquanto eu estiver de pé.",
    base: { hp: 47, atk: 27, def: 9, spd: 10 },
    mov: 3,
    rng: 1,
    skill: { name: "Forma de Meio-Demônio", text: "Ao iniciar o combate com HP cheio, +30% de dano.", effect: { type: "opener", pct: 0.3 } },
    active: {
      name: "Soco de Ivad",
      banner: "SOCO DE IVAD!",
      text: "Concentra tudo num único soco devastador. Dano imenso e atravessa a Defesa.",
      kind: "nuke",
      power: 2.9,
      pierce: 10,
      range: 1,
      charge: 3,
      fx: "impact",
    },
  },

  oaoj: {
    id: "oaoj",
    name: "Oaoj",
    title: "O Punho da Carapaça Suprema",
    star: 5,
    types: ["fisico", "projecao"],
    role: "tank",
    emoji: "🐢",
    quote: "Pode bater. A Carapaça aguenta.",
    base: { hp: 58, atk: 23, def: 13, spd: 7 },
    mov: 3,
    rng: 1,
    skill: { name: "Carapaça Suprema", text: "Reduz em 22% todo o dano recebido, sem perder mobilidade.", effect: { type: "bulwark", pct: 0.22 } },
    active: {
      name: "Domo de Carapaça",
      banner: "CARAPAÇA SUPREMA",
      text: "Ergue um domo sobre o esquadrão: −45% de dano no próximo turno inimigo.",
      kind: "shield",
      power: 0,
      charge: 3,
      fx: "shield",
    },
  },

  takimatida: {
    id: "takimatida",
    name: "Takimatida",
    title: "Mestre de Duas Espadas",
    star: 5,
    types: ["mana"],
    role: "skirmisher",
    emoji: "⚔️",
    quote: "O verdadeiro desafio não são os soldados.",
    base: { hp: 43, atk: 25, def: 9, spd: 12 },
    mov: 3,
    rng: 1,
    skill: { name: "Espadas Gêmeas", text: "Os cortes cruzados ignoram 5 de Defesa do alvo.", effect: { type: "pierce", flat: 5 } },
    active: {
      name: "Estratégia de Guerra",
      banner: "ESTRATÉGIA DE GUERRA",
      text: "Lê o campo e reposiciona todos: +7 de Ataque para o esquadrão por 2 turnos.",
      kind: "rally",
      power: 7,
      charge: 3,
      fx: "rally",
    },
  },

  xingzang: {
    id: "xingzang",
    name: "Xing Zang",
    title: "Mestre do Dojo nas Montanhas",
    star: 5,
    types: ["projecao"],
    role: "skirmisher",
    emoji: "🥷",
    quote: "Poder sem controle é uma tempestade sem direção.",
    base: { hp: 43, atk: 24, def: 8, spd: 13 },
    mov: 3,
    rng: 1,
    skill: { name: "Harmonia", text: "Recupera 20% do dano causado como HP.", effect: { type: "naturePunch", pct: 0.2 } },
    active: {
      name: "Soco da Natureza",
      banner: "SOCO DA NATUREZA!",
      text: "\"As estrelas contam o céu...\" Uma onda de energia parte do herói e atinge todos os inimigos por perto.",
      kind: "aura",
      power: 1.8,
      radius: 2,
      charge: 3,
      fx: "nova",
    },
  },

  poderoso: {
    id: "poderoso",
    name: "Poderoso",
    title: "O Exilado do Planeta Poder",
    star: 5,
    types: ["fisico", "projecao"],
    role: "tank",
    emoji: "🗿",
    quote: "Pode bater. Eu espero.",
    base: { hp: 62, atk: 24, def: 13, spd: 5 },
    mov: 2,
    rng: 1,
    skill: { name: "Soco Forte", text: "Ao iniciar o combate com HP cheio, +25% de dano.", effect: { type: "opener", pct: 0.25 } },
    active: {
      name: "Raio do Planeta Poder",
      banner: "RAIO DO PLANETA PODER",
      text: "Energia pura dos punhos — um raio que varre uma linha inteira de inimigos.",
      kind: "line",
      power: 2.2,
      range: 5,
      charge: 4,
      fx: "beam",
    },
  },

  // ═══════════════ Aliados reunidos ═══════════════
  ketchou: {
    id: "ketchou",
    name: "KetchouEtchou",
    title: "Portador do Feixe de Luz",
    star: 4,
    types: ["mana"],
    role: "ranged",
    emoji: "✨",
    quote: "Pelo poder de Ketchou, pelo poder de Etchou...",
    base: { hp: 36, atk: 24, def: 6, spd: 9 },
    mov: 2,
    rng: 2,
    skill: { name: "Feixe Ketchou", text: "Se o alvo não puder revidar, +20% de dano.", effect: { type: "safeShot", pct: 0.2 } },
    active: {
      name: "KetchouEtchou!",
      banner: "PELO PODER DE KETCHOU, PELO PODER DE ETCHOU… KETCHOUETCHOU!",
      text: "Um feixe de luz que rasga o ar e perfura todos os inimigos numa linha reta.",
      kind: "line",
      power: 1.9,
      range: 5,
      charge: 2,
      fx: "beam",
    },
  },

  haluhaluho: {
    id: "haluhaluho",
    name: "Haluhaluho",
    title: "O Irmão do Vento",
    star: 4,
    types: ["projecao", "mana"],
    role: "skirmisher",
    emoji: "🌪️",
    quote: "Confie nos instintos. O vento aponta o caminho.",
    base: { hp: 38, atk: 22, def: 7, spd: 14 },
    mov: 4,
    rng: 1,
    skill: { name: "Passos do Vento", text: "Precisa de só +3 de Velocidade (em vez de +5) para atacar duas vezes.", effect: { type: "swift", threshold: 3 } },
    active: {
      name: "Rajada do Vento",
      banner: "RAJADA DO VENTO",
      text: "Super Pulo: cruza o campo num átimo e desaba sobre um inimigo.",
      kind: "dash",
      power: 1.9,
      range: 4,
      charge: 2,
      fx: "dash",
    },
  },

  joepistoleiro: {
    id: "joepistoleiro",
    name: "Joe Pistoleiro",
    title: "A Pistola Lendária de Mácula",
    star: 4,
    types: ["fisico", "mana"],
    role: "ranged",
    emoji: "🤠",
    quote: "Se vamos lutar, vamos lutar para vencer.",
    base: { hp: 37, atk: 26, def: 5, spd: 10 },
    mov: 3,
    rng: 2,
    skill: { name: "Tiro de Mácula", text: "Precisão absurda: o disparo ignora 5 de Defesa do alvo.", effect: { type: "pierce", flat: 5 } },
    active: {
      name: "Tiro Lendário",
      banner: "TIRO LENDÁRIO",
      text: "Um disparo que explodiu uma montanha. Atravessa toda uma linha; devastador no primeiro alvo.",
      kind: "line",
      power: 2.5,
      falloff: 0.4,
      range: 6,
      charge: 3,
      fx: "beam",
    },
  },

  kaowoji: {
    id: "kaowoji",
    name: "Kão-Woji",
    title: "O Rei do Deserto",
    star: 4,
    types: ["fisico"],
    role: "bruiser",
    emoji: "🐺",
    quote: "Você fala demais. Prove que vale o esforço.",
    base: { hp: 48, atk: 22, def: 11, spd: 8 },
    mov: 3,
    rng: 1,
    skill: { name: "Pele de Espinhos", text: "Quem o ataca corpo a corpo leva de volta 35% do dano causado.", effect: { type: "thorns", pct: 0.35 } },
    active: {
      name: "Reflexo Total",
      banner: "REFLEXO TOTAL",
      text: "Postura de espelho: o próximo golpe recebido é devolvido 100% ao agressor. Cura ao ativar.",
      kind: "reflect",
      power: 0.2,
      charge: 2,
      fx: "mirror",
    },
  },

  alkor: {
    id: "alkor",
    name: "Al-Kor",
    title: "Guardião da Dimensão Alfa",
    star: 4,
    types: ["projecao", "mana"],
    role: "ranged",
    emoji: "🔷",
    quote: "O Escolhido é apenas uma fração do verdadeiro perigo.",
    base: { hp: 36, atk: 24, def: 7, spd: 9 },
    mov: 2,
    rng: 2,
    skill: { name: "Projeção", text: "As lâminas de energia ignoram 3 de Defesa do alvo.", effect: { type: "pierce", flat: 3 } },
    active: {
      name: "Colosso de Projeção",
      banner: "COLOSSO DE PROJEÇÃO",
      text: "Ergue uma figura gigantesca de energia que esmaga uma área 3×3 inteira.",
      kind: "blast",
      shape: "square",
      power: 1.6,
      range: 4,
      charge: 4,
      fx: "nova",
    },
  },

  // ═══════════════ Nova geração de Centris ═══════════════
  joefino: {
    id: "joefino",
    name: "Joe Fino",
    title: "Estrategista da Linhagem Joe",
    star: 3,
    types: ["projecao"],
    role: "skirmisher",
    emoji: "🎩",
    quote: "Se agirmos como peças soltas, ele nos esmaga um por um.",
    base: { hp: 34, atk: 21, def: 6, spd: 12 },
    mov: 4,
    rng: 1,
    skill: { name: "Golpe Estratégico", text: "Mira os pontos fracos: ignora 4 de Defesa do alvo.", effect: { type: "pierce", flat: 4 } },
    active: {
      name: "Pontos Vitais",
      banner: "PONTOS VITAIS",
      text: "Circula o inimigo em alta velocidade e acerta uma sequência que ignora TODA a Defesa.",
      kind: "dash",
      power: 2.2,
      pierce: 999,
      range: 4,
      charge: 2,
      fx: "dash",
    },
  },

  bob: {
    id: "bob",
    name: "Bob",
    title: "Aprendiz de Centris",
    star: 3,
    types: ["mana"],
    role: "ranged",
    emoji: "🔮",
    quote: "Acho que fiz certo dessa vez.",
    base: { hp: 33, atk: 21, def: 5, spd: 8 },
    mov: 2,
    rng: 2,
    skill: { name: "Fagulha de Ki", text: "Ataque básico de energia à distância 2.", effect: { type: "none" } },
    active: {
      name: "Fagulha Instável",
      banner: "FAGULHA INSTÁVEL!",
      text: "Concentra o Ki e solta uma explosão — ainda meio sem controle, mas pega uma área.",
      kind: "blast",
      shape: "cross",
      power: 1.3,
      range: 3,
      charge: 2,
      fx: "blast",
    },
  },

  calico: {
    id: "calico",
    name: "Calico",
    title: "Criança de Linhagem Divina",
    star: 3,
    types: ["fisico", "projecao", "mana"], // DIVINO
    role: "healer",
    emoji: "🐈",
    quote: "Fica quieto que isso aqui arde um pouco.",
    base: { hp: 40, atk: 16, def: 8, spd: 9 },
    mov: 3,
    rng: 2,
    skill: { name: "Bálsamo Felino", text: "Em vez de atacar, cura um aliado à distância 2 em (14 + 0,6×ATK).", effect: { type: "healer", flat: 14 } },
    active: {
      name: "Bênção Divina",
      banner: "BÊNÇÃO DIVINA",
      text: "A linhagem divina se manifesta: cura TODO o esquadrão em 40% do HP máximo e reergue os caídos com 30%.",
      kind: "heal",
      shape: "all",
      power: 0.4,
      revive: 0.3,
      charge: 4,
      fx: "sparkle",
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
