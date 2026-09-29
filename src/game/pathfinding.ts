import type { TownMap } from './map';
import { isWalkable } from './map';

type P = { x: number; y: number };

/** 8-directional A* on the tile grid (no corner cutting). */
export function findPath(map: TownMap, from: P, to: P): P[] | null {
  const key = (p: P) => p.y * 1000 + p.x;
  const h = (p: P) => Math.hypot(p.x - to.x, p.y - to.y);
  const open: P[] = [from];
  const came = new Map<number, P>();
  const g = new Map<number, number>([[key(from), 0]]);
  const f = new Map<number, number>([[key(from), h(from)]]);
  const closed = new Set<number>();

  while (open.length) {
    open.sort((a, b) => (f.get(key(a)) ?? Infinity) - (f.get(key(b)) ?? Infinity));
    const cur = open.shift()!;
    if (cur.x === to.x && cur.y === to.y) {
      const path = [cur];
      let k = key(cur);
      while (came.has(k)) {
        const p = came.get(k)!;
        path.unshift(p);
        k = key(p);
      }
      return path;
    }
    closed.add(key(cur));
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const n = { x: cur.x + dx, y: cur.y + dy };
        if (!isWalkable(map, n.x, n.y) || closed.has(key(n))) continue;
        if (dx && dy && (!isWalkable(map, cur.x + dx, cur.y) || !isWalkable(map, cur.x, cur.y + dy))) continue;
        const cost = (g.get(key(cur)) ?? 0) + (dx && dy ? 1.414 : 1);
        if (cost < (g.get(key(n)) ?? Infinity)) {
          came.set(key(n), cur);
          g.set(key(n), cost);
          f.set(key(n), cost + h(n));
          if (!open.some((o) => o.x === n.x && o.y === n.y)) open.push(n);
        }
      }
  }
  return null;
}
