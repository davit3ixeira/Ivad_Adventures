/**
 * equipment.js — equipamentos permanentes (meta). Ganhos em batalhas da run,
 * distribuídos no fim dela, equipados nos heróis pelo Arsenal.
 *
 * slot : 'arma' | 'armadura' | 'reliquia'   (1 de cada por herói)
 * rank : 'comum' | 'raro' | 'epico' | 'lendario'
 * mods : { atk, def, maxHP, spd }  — somados aos atributos base do herói
 *
 * As "Relíquias de Mácula" do livro entram no slot `reliquia`.
 */
import { rng } from "../core/rng.js";

export const EQUIP_SLOTS = ["arma", "armadura", "reliquia"];

export const RANKS = {
  comum: { label: "Comum", color: "#9aa4b2", order: 0 },
  raro: { label: "Raro", color: "#63b6ff", order: 1 },
  epico: { label: "Épico", color: "#c86bff", order: 2 },
  lendario: { label: "Lendário", color: "#ffce6b", order: 3 },
};

export const EQUIPMENT = {
  // ───────────── ARMAS ─────────────
  bastao_treino: { id: "bastao_treino", name: "Bastão de Treino", slot: "arma", rank: "comum", emoji: "🥢", mods: { atk: 4 }, desc: "Do tronco marcado da floresta na Terra." },
  manopla_gasta: { id: "manopla_gasta", name: "Manopla Gasta", slot: "arma", rank: "comum", emoji: "🧤", mods: { atk: 3, def: 2 }, desc: "Serve. Mais ou menos." },
  luvas_poder: { id: "luvas_poder", name: "Luvas do Planeta Poder", slot: "arma", rank: "raro", emoji: "🥊", mods: { atk: 9 }, desc: "Canalizam a força descomunal do planeta natal do Poderoso." },
  espada_xing: { id: "espada_xing", name: "Espada Curta do Dojo", slot: "arma", rank: "raro", emoji: "🗡️", mods: { atk: 7, spd: 3 }, desc: "Forjada nas Montanhas de Xing Zang." },
  lamina_projecao: { id: "lamina_projecao", name: "Lâmina de Projeção", slot: "arma", rank: "epico", emoji: "🔹", mods: { atk: 15, spd: 4 }, desc: "Energia sólida da Dimensão Alfa — corta o que a matéria não corta." },
  pistola_macula: { id: "pistola_macula", name: "Pistola Lendária de Mácula", slot: "arma", rank: "lendario", emoji: "🔫", mods: { atk: 26, spd: 5 }, desc: "A relíquia de Joe Pistoleiro. Explodiu uma montanha com um tiro." },
  espadas_gemeas: { id: "espadas_gemeas", name: "Espadas Gêmeas de Takimatida", slot: "arma", rank: "lendario", emoji: "⚔️", mods: { atk: 22, def: 6, spd: 4 }, desc: "Cruzadas nas costas do Mestre. Poucos as viram sair da bainha." },

  // ───────────── ARMADURAS ─────────────
  faixas_pano: { id: "faixas_pano", name: "Faixas de Pano", slot: "armadura", rank: "comum", emoji: "🧵", mods: { def: 4 }, desc: "Aperta e reza." },
  colete_couro: { id: "colete_couro", name: "Colete de Couro", slot: "armadura", rank: "comum", emoji: "🦺", mods: { def: 3, maxHP: 8 }, desc: "Padrão dos sobreviventes da Terra." },
  manto_dojo: { id: "manto_dojo", name: "Manto do Dojo", slot: "armadura", rank: "raro", emoji: "🥋", mods: { def: 6, spd: 3, maxHP: 12 }, desc: "Leve como o vento das montanhas." },
  placa_poder: { id: "placa_poder", name: "Placa do Planeta Poder", slot: "armadura", rank: "raro", emoji: "🛡️", mods: { def: 11, maxHP: 10 }, desc: "Metal que não deveria existir na Terra." },
  carapaca_reserva: { id: "carapaca_reserva", name: "Carapaça de Reserva", slot: "armadura", rank: "epico", emoji: "🐢", mods: { def: 16, maxHP: 30 }, desc: "Fragmento da Carapaça de Oaoj, ainda pulsando." },
  armadura_ariexiet: { id: "armadura_ariexiet", name: "Armadura de Ariexiet", slot: "armadura", rank: "lendario", emoji: "🌗", mods: { def: 20, maxHP: 55, spd: 3 }, desc: "Temperada sob os dois sóis do refúgio." },

  // ───────────── RELÍQUIAS DE MÁCULA ─────────────
  amuleto_osso: { id: "amuleto_osso", name: "Amuleto de Osso Haluhu", slot: "reliquia", rank: "comum", emoji: "🦴", mods: { atk: 3, maxHP: 6 }, desc: "Arrancado de um soldado caído." },
  fragmento_semente: { id: "fragmento_semente", name: "Estilhaço de Semente", slot: "reliquia", rank: "comum", emoji: "🌰", mods: { maxHP: 14 }, desc: "Um caco da Semente Primordial. Ainda quente." },
  talisma_centris: { id: "talisma_centris", name: "Talismã de Centris", slot: "reliquia", rank: "raro", emoji: "🪬", mods: { atk: 5, def: 5, maxHP: 10 }, desc: "Feito pelas crianças do vilarejo. Funciona mesmo assim." },
  obsidiana_branca: { id: "obsidiana_branca", name: "Fragmento de Obsidiana Branca", slot: "reliquia", rank: "epico", emoji: "🔳", mods: { def: 12, maxHP: 20 }, desc: "Relíquia de Mácula: absorve o primeiro golpe de cada troca. Testa a paciência de quem a usa." },
  mascara_interseccao: { id: "mascara_interseccao", name: "Máscara de Intersecção", slot: "reliquia", rank: "epico", emoji: "🎭", mods: { atk: 14, spd: 5 }, desc: "Relíquia de Mácula: mostra segredos do passado do deus. Uma cientista enlouqueceu tentando entendê-los." },
  coracao_macula: { id: "coracao_macula", name: "Coração Pulsante de Mácula", slot: "reliquia", rank: "lendario", emoji: "🫀", mods: { atk: 18, def: 10, maxHP: 40 }, desc: "Relíquia de Mácula: bate no ritmo de quem a carrega. Promessa de poder absoluto — e a lembrança de que nada é de graça." },
  prisma_distancia: { id: "prisma_distancia", name: "Prisma da Distância Infinita", slot: "reliquia", rank: "lendario", emoji: "🔺", mods: { atk: 12, spd: 10, maxHP: 20 }, desc: "Relíquia de Mácula: um guerreiro salvou uma cidade inteira com ela — e sumiu entre dimensões para sempre." },
  olho_do_caos: { id: "olho_do_caos", name: "Fragmento do Olho do Caos", slot: "reliquia", rank: "lendario", emoji: "👁️", mods: { atk: 24, def: -4, spd: 6 }, desc: "Arrancado do peito de Korlok. Sussurra. Não pare para ouvir." },
};

export const EQUIP_IDS = Object.keys(EQUIPMENT);
const BY_RANK = {};
for (const it of Object.values(EQUIPMENT)) {
  (BY_RANK[it.rank] ||= []).push(it.id);
}

let _eq = 0;
const newIid = () => `eq${Date.now().toString(36)}${(_eq++).toString(36)}`;

const RANK_WEIGHTS = {
  battle: { comum: 72, raro: 24, epico: 4, lendario: 0 },
  elite: { comum: 34, raro: 44, epico: 19, lendario: 3 },
  boss: { comum: 6, raro: 34, epico: 44, lendario: 16 },
};

/** Sorteia um drop de equipamento. Devolve uma instância { iid, id } ou null. */
export function rollEquipDrop(context = "battle", chapter = 1) {
  const base = RANK_WEIGHTS[context] || RANK_WEIGHTS.battle;
  // capítulos mais avançados empurram a raridade para cima
  const shift = (chapter - 1) * 0.5;
  const w = {
    comum: Math.max(0, base.comum - shift * 12),
    raro: base.raro,
    epico: base.epico + shift * 6,
    lendario: base.lendario + shift * 4,
  };
  const bag = [];
  for (const [rank, n] of Object.entries(w)) for (let i = 0; i < Math.round(n); i++) bag.push(rank);
  const rank = bag.length ? rng.pick(bag) : "comum";
  const pool = BY_RANK[rank] || BY_RANK.comum;
  return { iid: newIid(), id: rng.pick(pool) };
}

/** Soma dos mods dos itens equipados por um herói do roster. */
export function equipBonus(entry, inventory = []) {
  const out = { atk: 0, def: 0, maxHP: 0, spd: 0 };
  const eq = entry?.equip || {};
  for (const slot of EQUIP_SLOTS) {
    const iid = eq[slot];
    if (!iid) continue;
    const inst = inventory.find((x) => x.iid === iid);
    const def = inst && EQUIPMENT[inst.id];
    if (!def) continue;
    for (const k of Object.keys(out)) out[k] += def.mods[k] || 0;
  }
  return out;
}

/** Itens do inventário que NÃO estão equipados em ninguém (para um slot). */
export function availableForSlot(inventory, roster, slot) {
  const used = new Set();
  for (const e of roster) if (e.equip?.[slot]) used.add(e.equip[slot]);
  return inventory.filter((inst) => EQUIPMENT[inst.id]?.slot === slot && !used.has(inst.iid));
}
