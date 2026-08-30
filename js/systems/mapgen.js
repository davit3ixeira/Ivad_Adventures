/**
 * mapgen.js — gera o mapa de nós ramificados de um capítulo
 * (estilo Slay the Spire / FEH Tempest Trials).
 *
 * Nó: { id, row, col, type, x, y, next: string[], enemyId?, cleared }
 * type ∈ start | battle | elite | event | shop | rest | boss
 */
import { makeRng } from "../core/rng.js";
import { getChapter } from "../data/chapters.js";

export const NODE_META = {
  start: { icon: "✦", label: "Início" },
  battle: { icon: "⚔️", label: "Batalha" },
  elite: { icon: "☠️", label: "Elite" },
  event: { icon: "❓", label: "Evento" },
  shop: { icon: "🛒", label: "Loja de Mácula" },
  rest: { icon: "⛺", label: "Descanso" },
  boss: { icon: "🔱", label: "Chefe" },
};

const BOARD_W = 760;
const ROW_H = 108;
const PAD_Y = 46;

function pickType(r, row, totalRows) {
  const late = row / totalRows;
  const weights = {
    battle: 50,
    event: 22,
    shop: row >= 2 ? 12 : 0,
    rest: row >= 3 ? 12 : 0,
    elite: late >= 0.35 ? 16 + Math.round(late * 14) : 0,
  };
  const bag = [];
  for (const [t, w] of Object.entries(weights)) for (let i = 0; i < w; i++) bag.push(t);
  return r.pick(bag);
}

export function generateMap(chapterId, seed) {
  const chapter = getChapter(chapterId);
  const r = makeRng(seed >>> 0);
  const ROWS = chapter.rows;

  /** @type {any[][]} */
  const rows = [];
  let idc = 0;
  const mk = (row, col, type, count) => {
    const x = Math.round((BOARD_W * (col + 1)) / (count + 1) + r.int(-16, 16));
    const y = PAD_Y + row * ROW_H;
    return { id: `n${idc++}`, row, col, type, x, y, next: [], cleared: false };
  };

  // linha 0: início único
  rows.push([mk(0, 0, "start", 1)]);
  rows[0][0].x = BOARD_W / 2;

  // linhas intermediárias
  for (let row = 1; row < ROWS - 1; row++) {
    const count = row === 1 ? r.int(2, 3) : r.int(2, 4);
    const rowNodes = [];
    let restPlaced = false;
    for (let col = 0; col < count; col++) {
      let type = row === 1 ? "battle" : pickType(r, row, ROWS);
      // no máximo um descanso por linha
      if (type === "rest" && restPlaced) type = "event";
      if (type === "rest") restPlaced = true;
      rowNodes.push(mk(row, col, type, count));
    }
    // garante um descanso na antepenúltima linha
    if (row === ROWS - 2 && !rowNodes.some((n) => n.type === "rest")) {
      r.pick(rowNodes).type = "rest";
    }
    rows.push(rowNodes);
  }

  // linha final: chefe
  const bossRow = [mk(ROWS - 1, 0, "boss", 1)];
  bossRow[0].x = BOARD_W / 2;
  bossRow[0].enemyId = chapter.boss;
  rows.push(bossRow);

  // arestas: cada nó liga a 1–2 vizinhos "próximos" da linha seguinte
  for (let row = 0; row < rows.length - 1; row++) {
    const cur = rows[row];
    const nxt = rows[row + 1];
    cur.forEach((node, i) => {
      const proj = nxt.length === 1 ? 0 : Math.round((i / Math.max(1, cur.length - 1)) * (nxt.length - 1));
      const links = new Set([clamp(proj, 0, nxt.length - 1)]);
      if (r.chance(0.5) && nxt.length > 1) links.add(clamp(proj + r.pick([-1, 1]), 0, nxt.length - 1));
      links.forEach((li) => node.next.push(nxt[li].id));
    });
    // toda casa da próxima linha precisa de ao menos uma entrada
    nxt.forEach((n, li) => {
      if (!cur.some((c) => c.next.includes(n.id))) {
        const src = cur.reduce((best, c) =>
          Math.abs(colOf(c, cur) - li) < Math.abs(colOf(best, cur) - li) ? c : best
        );
        src.next.push(n.id);
      }
    });
  }

  // atribui inimigos a nós de batalha/elite
  for (const rowNodes of rows) {
    for (const node of rowNodes) {
      if (node.type === "battle") node.enemyId = r.pick(chapter.grunts);
      if (node.type === "elite") node.enemyId = r.pick(chapter.elites);
    }
  }

  const all = rows.flat();
  // `rows` fica só na geração — persistir apenas `nodes` evita objetos
  // duplicados no save (cada nó apareceria em rows e em nodes).
  return {
    chapterId,
    seed,
    nodes: Object.fromEntries(all.map((n) => [n.id, n])),
    startId: rows[0][0].id,
    bossId: bossRow[0].id,
    width: BOARD_W,
    height: PAD_Y * 2 + (ROWS - 1) * ROW_H + 56,
  };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const colOf = (node, rowNodes) => rowNodes.indexOf(node);
