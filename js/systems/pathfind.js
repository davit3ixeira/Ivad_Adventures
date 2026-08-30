/**
 * pathfind.js — utilidades de grid para o combate tático.
 * grid = { w, h, tiles: string[y][x] }  onde tile ∈ plain|magma|forest|wall|ruin
 */

export const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export const key = (x, y) => `${x},${y}`;
export const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export function terrainCost(type) {
  return type === "forest" ? 2 : 1;
}

export function isWall(type) {
  return type === "wall";
}

/**
 * Dijkstra limitado por `budget`.
 * @param blocked (x,y) => bool  — não pode ENTRAR na casa (parede/unidade)
 * @returns Map<"x,y", custo>  incluindo a origem (custo 0)
 */
export function reachable(grid, start, budget, blocked) {
  const dist = new Map([[key(start.x, start.y), 0]]);
  const pq = [[start.x, start.y, 0]];

  while (pq.length) {
    let bi = 0;
    for (let i = 1; i < pq.length; i++) if (pq[i][2] < pq[bi][2]) bi = i;
    const [x, y, d] = pq.splice(bi, 1)[0];
    if (d > (dist.get(key(x, y)) ?? Infinity)) continue;

    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= grid.w || ny >= grid.h) continue;
      const t = grid.tiles[ny][nx];
      if (isWall(t)) continue;
      if (blocked(nx, ny)) continue;
      const nd = d + terrainCost(t);
      if (nd > budget) continue;
      if (nd < (dist.get(key(nx, ny)) ?? Infinity)) {
        dist.set(key(nx, ny), nd);
        pq.push([nx, ny, nd]);
      }
    }
  }
  return dist;
}

/**
 * Caminho passo a passo de start até goal (custo mínimo), ignorando o budget.
 * `blockedExceptGoal` deixa o alvo entrar na casa objetivo mesmo se ocupada.
 * @returns Array<{x,y}> sem a origem, ou null se inalcançável.
 */
export function pathTo(grid, start, goal, blocked) {
  const prev = new Map();
  const dist = new Map([[key(start.x, start.y), 0]]);
  const pq = [[start.x, start.y, 0]];
  const goalKey = key(goal.x, goal.y);

  while (pq.length) {
    let bi = 0;
    for (let i = 1; i < pq.length; i++) if (pq[i][2] < pq[bi][2]) bi = i;
    const [x, y, d] = pq.splice(bi, 1)[0];
    if (key(x, y) === goalKey) break;
    if (d > (dist.get(key(x, y)) ?? Infinity)) continue;

    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= grid.w || ny >= grid.h) continue;
      const t = grid.tiles[ny][nx];
      if (isWall(t)) continue;
      const atGoal = key(nx, ny) === goalKey;
      if (!atGoal && blocked(nx, ny)) continue;
      const nd = d + terrainCost(t);
      if (nd < (dist.get(key(nx, ny)) ?? Infinity)) {
        dist.set(key(nx, ny), nd);
        prev.set(key(nx, ny), key(x, y));
        pq.push([nx, ny, nd]);
      }
    }
  }

  if (!prev.has(goalKey) && key(start.x, start.y) !== goalKey) return null;
  const path = [];
  let cur = goalKey;
  while (cur && cur !== key(start.x, start.y)) {
    const [px, py] = cur.split(",").map(Number);
    path.unshift({ x: px, y: py });
    cur = prev.get(cur);
  }
  return path;
}

/** Casas dentro do alcance `rng` (distância Manhattan) a partir de um ponto. */
export function tilesInRange(grid, from, rng) {
  const out = [];
  for (let y = 0; y < grid.h; y++) {
    for (let x = 0; x < grid.w; x++) {
      const d = Math.abs(x - from.x) + Math.abs(y - from.y);
      if (d >= 1 && d <= rng) out.push({ x, y, d });
    }
  }
  return out;
}
