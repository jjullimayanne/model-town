export const TILE_W = 64;
export const TILE_H = 32;
export const MAP_SIZE = 28;

export const gridToScreen = (gx: number, gy: number) => ({
  x: (gx - gy) * (TILE_W / 2),
  y: (gx + gy) * (TILE_H / 2),
});

export const screenToGrid = (sx: number, sy: number) => ({
  x: (sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2,
  y: (sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2,
});
