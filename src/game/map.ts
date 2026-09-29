import { BUILDINGS } from '../content/buildings';
import { createRng } from '../ml/rng';
import { MAP_SIZE } from './iso';

export type Ground = 'grass' | 'path' | 'plaza' | 'highway' | 'bridge';
export type DecoKind = 'tree' | 'pine' | 'bush' | 'flowers' | 'lamp' | 'fountain' | 'bench';

export interface Deco { kind: DecoKind; x: number; y: number; blocks: boolean; variant: number }
export interface House { x: number; y: number; roof: number }

export interface TownMap {
  ground: Ground[][];
  blocked: boolean[][];
  decos: Deco[];
  houses: House[];
  bridges: { x: number; y: number }[][];
  spawn: { x: number; y: number };
}

/** The expressway: three lanes along the grid y axis. */
export const HIGHWAY_X = [12, 13, 14] as const;

export function buildTownMap(): TownMap {
  const N = MAP_SIZE;
  const ground: Ground[][] = Array.from({ length: N }, () => Array<Ground>(N).fill('grass'));
  const blocked: boolean[][] = Array.from({ length: N }, () => Array<boolean>(N).fill(false));
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N;

  // Expressway
  for (let y = 0; y < N; y++) for (const x of HIGHWAY_X) ground[x][y] = 'highway';

  // Streets
  const road = (x: number, y: number) => {
    if (!at(x, y)) return;
    ground[x][y] = ground[x][y] === 'highway' ? 'bridge' : 'path';
  };
  for (const y of [7, 14, 22]) for (let x = 2; x <= 26; x++) road(x, y);
  for (const x of [9, 17]) for (let y = 3; y <= 25; y++) road(x, y);
  for (let y = 14; y <= 22; y++) road(24, y);
  for (let x = 4; x <= 8; x++) for (let y = 14; y <= 16; y++) if (ground[x][y] !== 'path') ground[x][y] = 'plaza';

  // Group bridge tiles per street
  const bridges = [7, 14, 22].map((y) => {
    const tiles: { x: number; y: number }[] = [];
    for (let x = 0; x < N; x++) if (ground[x][y] === 'bridge') tiles.push({ x, y });
    return tiles;
  });

  // Buildings
  for (const b of BUILDINGS)
    for (let x = b.tile.x; x < b.tile.x + b.tile.w; x++)
      for (let y = b.tile.y; y < b.tile.y + b.tile.h; y++) blocked[x][y] = true;

  const houseSpots: [number, number][] = [
    [2, 8], [7, 9], [2, 17], [7, 24], [2, 24], [22, 8], [25, 8], [18, 15], [22, 24], [25, 24], [24, 2], [20, 1],
  ];
  const roofs = [0xd9725b, 0x6f9fd8, 0xe3a44a, 0x8fbf6a, 0xc77fb5, 0xe07b7b];
  const houses: House[] = houseSpots.map(([x, y], i) => {
    for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) blocked[x + dx][y + dy] = true;
    return { x, y, roof: roofs[i % roofs.length] };
  });

  const decos: Deco[] = [];
  const place = (kind: DecoKind, x: number, y: number, blocks = true, variant = 0) => {
    if (!at(x, y) || blocked[x][y] || ground[x][y] === 'highway' || ground[x][y] === 'bridge') return;
    decos.push({ kind, x, y, blocks, variant });
    if (blocks) blocked[x][y] = true;
  };
  place('fountain', 4, 16);
  place('bench', 8, 16);
  for (const [x, y] of [[10, 6], [16, 6], [10, 13], [16, 13], [10, 21], [16, 21], [8, 8], [21, 15]]) place('lamp', x, y);

  // Keep doors & their neighbourhood free
  const reserved = new Set<string>();
  for (const b of BUILDINGS)
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) reserved.add(`${b.door.x + dx},${b.door.y + dy}`);

  const rng = createRng(77);
  for (let x = 0; x < N; x++)
    for (let y = 0; y < N; y++) {
      if (ground[x][y] !== 'grass' || blocked[x][y] || reserved.has(`${x},${y}`)) continue;
      const nearHighway = [[1, 0], [-1, 0]].some(([dx, dy]) => at(x + dx, y + dy) && ground[x + dx][y + dy] === 'highway');
      const edge = x < 2 || y < 2 || x > N - 3 || y > N - 3;
      const r = rng();
      if (nearHighway) { if (r < 0.3) place('flowers', x, y, false, Math.floor(rng() * 4)); continue; }
      if (r < (edge ? 0.45 : 0.1)) place(rng() < 0.35 ? 'pine' : 'tree', x, y, true, Math.floor(rng() * 3));
      else if (r < (edge ? 0.5 : 0.16)) place('bush', x, y, true, Math.floor(rng() * 3));
      else if (r < 0.3) place('flowers', x, y, false, Math.floor(rng() * 4));
    }

  return { ground, blocked, decos, houses, bridges, spawn: { x: 8, y: 15 } };
}

export function isWalkable(map: TownMap, x: number, y: number): boolean {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (gx < 0 || gy < 0 || gx >= MAP_SIZE || gy >= MAP_SIZE) return false;
  return map.ground[gx][gy] !== 'highway' && !map.blocked[gx][gy];
}
