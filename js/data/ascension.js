/**
 * ascension.js — Torre da Ascensão: modo pós-campanha, infinito, para quem já
 * bateu os 10 capítulos. Não é um capítulo novo escrito à mão — é um gerador
 * puro que reaproveita o bestiário e os cenários de toda a campanha:
 * cada nível "ecoa" um capítulo (mesmo chefe, terreno, pool de tropa/elite
 * de TODOS os capítulos somados) escalado bem além do que o capítulo 10 pede.
 *
 * `resolveChapter(id)` é o ponto único de leitura de "chapter" pro resto do
 * jogo: id ≤10 → capítulo canônico; id >10 → nível de Ascensão gerado aqui.
 * Isso mantém `run.chapter` como um número só, sem duplicar branches em
 * battle/run/map/reward para saber de onde puxar os dados.
 */
import { CHAPTERS } from "./chapters.js";
import { ENEMIES } from "./enemies.js";

export const ASCENSION_BASE = CHAPTERS.length; // 10 — nível de Ascensão N vira chapter.id = 10+N

const GRUNT_POOL = [...new Set(CHAPTERS.flatMap((c) => c.grunts))];
const ELITE_POOL = [...new Set(CHAPTERS.flatMap((c) => c.elites))];
const SCENES = ["🌌", "⏳", "🔺", "♾️", "🌠", "🔮"];

/** Gera o "capítulo" do nível N de Ascensão (determinístico — mesmo N, mesmo resultado). */
export function getAscensionChapter(level) {
  const lvl = Math.max(1, Math.floor(level));
  const echo = CHAPTERS[(lvl - 1) % CHAPTERS.length];
  const bossDef = ENEMIES[echo.boss];
  const rows = Math.min(13, 10 + Math.floor((lvl - 1) / 5));

  return {
    id: ASCENSION_BASE + lvl,
    ascension: lvl,
    name: `Ascensão ${lvl}`,
    locale: `Eco de ${echo.locale}`,
    scene: SCENES[(lvl - 1) % SCENES.length],
    bg: "ascensao",
    rows,
    grunts: GRUNT_POOL,
    elites: ELITE_POOL,
    boss: echo.boss,
    terrains: echo.terrains,
    intro:
      `O Selo Primordial, exaurido por tudo que o esquadrão já cruzou, começa a repetir o que já viveu — só que ` +
      `mais faminto. O eco de ${bossDef.name} volta multiplicado pela força bruta da Ascensão ${lvl}. Não existe ` +
      `capítulo pronto pra isso. Só o quanto vocês aguentam.`,
    outro:
      `${bossDef.name} se desfaz em luz fragmentada, de volta pro Selo — que já pulsa, pronto pra ressoar mais forte ` +
      `ainda. Ascensão ${lvl} superada.`,
    reward: { frag: Math.round(50 + lvl * 18) },
  };
}

/** Lê um "chapter" a partir do id salvo em `run.chapter` — canônico ou gerado. */
export function resolveChapter(id) {
  const canon = CHAPTERS.find((c) => c.id === id);
  if (canon) return canon;
  if (id > ASCENSION_BASE) return getAscensionChapter(id - ASCENSION_BASE);
  return CHAPTERS[0];
}
