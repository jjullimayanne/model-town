import Phaser from 'phaser';
import { BUILDINGS, type BuildingDef } from '../content/buildings';
import { createRng } from '../ml/rng';
import { TILE_H, TILE_W } from './iso';

/**
 * Every town texture is drawn in code (cyberpunk-cozy style: dusk, glass towers, neon).
 * Characters come from Kenney "Toon Characters" (CC0) and are recoloured to neon at load time.
 */
type G = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };

const EDGE = 0x1c1f30;
/** Lo-fi futurist accents: muted, warm, easy on the eyes during long study sessions. */
export const NEON = { cyan: 0x8fb8de, pink: 0xd9a0b4, violet: 0xa99bd6, yellow: 0xf2c46d, green: 0x9cc5a1, orange: 0xe8a87c };

export const shade = (c: number, f: number) => {
  const col = Phaser.Display.Color.IntegerToColor(c);
  const k = (v: number) => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f))));
  return Phaser.Display.Color.GetColor(k(col.red), k(col.green), k(col.blue));
};

function poly(g: G, pts: Pt[], fill: number, alpha = 1, stroke: number | null = EDGE, strokeAlpha = 0.6, width = 1.5) {
  g.fillStyle(fill, alpha);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach((p) => g.lineTo(p.x, p.y));
  g.closePath();
  g.fillPath();
  if (stroke !== null) {
    g.lineStyle(width, stroke, strokeAlpha);
    g.strokePath();
  }
}

function withGraphics(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

const diamond = (ox = 0, oy = 0): Pt[] => [
  { x: ox + TILE_W / 2, y: oy },
  { x: ox + TILE_W, y: oy + TILE_H / 2 },
  { x: ox + TILE_W / 2, y: oy + TILE_H },
  { x: ox, y: oy + TILE_H / 2 },
];

// ───────────────────────────── ground
function makeTiles(scene: Phaser.Scene) {
  // park turf
  [0x34474a, 0x364c4f, 0x314345].forEach((c, i) =>
    withGraphics(scene, `tile_grass_${i}`, TILE_W, TILE_H, (g) => {
      poly(g, diamond(), c, 1, null);
      g.fillStyle(NEON.green, 0.35);
      for (let k = 0; k < 4; k++) g.fillCircle(18 + ((k * 37 + i * 11) % 30), 10 + ((k * 13 + i * 7) % 12), 1);
    }),
  );
  // street: asphalt with faint neon seams
  withGraphics(scene, 'tile_path', TILE_W, TILE_H, (g) => {
    poly(g, diamond(), 0x383d57, 1, null);
    g.lineStyle(1, NEON.cyan, 0.12);
    g.strokePoints(diamond(), true);
  });
  withGraphics(scene, 'tile_plaza', TILE_W, TILE_H, (g) => {
    poly(g, diamond(), 0x44476a, 1, null);
    g.lineStyle(1, NEON.pink, 0.35);
    g.lineBetween(16, 8, 48, 24);
    g.lineBetween(48, 8, 16, 24);
    g.strokePoints(diamond(), true);
  });
  // highway lanes (the avenue runs along the grid y axis)
  const lane = (key: string, draw: (g: G) => void) =>
    withGraphics(scene, key, TILE_W, TILE_H, (g) => {
      poly(g, diamond(), 0x2b2f45, 1, null);
      draw(g);
    });
  lane('tile_hw_left', (g) => {
    g.lineStyle(2, NEON.cyan, 0.35);
    g.lineBetween(2, TILE_H / 2 - 1, TILE_W / 2, 1); // outer edge (T–L)
  });
  lane('tile_hw_right', (g) => {
    g.lineStyle(2, NEON.cyan, 0.35);
    g.lineBetween(TILE_W / 2, TILE_H - 1, TILE_W - 2, TILE_H / 2 + 1); // outer edge (B–R)
  });
  lane('tile_hw_mid', (g) => {
    // dashed centre line parallel to the avenue: from mid(T–R) to mid(L–B)
    const P = (t: number) => ({ x: 48 - 32 * t, y: 8 + 16 * t });
    g.lineStyle(2, NEON.yellow, 0.85);
    for (const [a, b] of [[0.04, 0.2], [0.42, 0.58], [0.8, 0.96]]) g.lineBetween(P(a).x, P(a).y, P(b).x, P(b).y);
  });
  // elevated footbridge deck (bridges run along the grid x axis, over the avenue)
  withGraphics(scene, 'tile_bridge', TILE_W, TILE_H + 22, (g) => {
    const lift = 0;
    poly(g, [{ x: 0, y: TILE_H / 2 + lift }, { x: TILE_W / 2, y: TILE_H + lift }, { x: TILE_W / 2, y: TILE_H + 10 }, { x: 0, y: TILE_H / 2 + 10 }], 0x444a6b, 1, null);
    poly(g, diamond(0, lift), 0x5d6488, 1, null);
    g.lineStyle(1, 0xffffff, 0.12);
    for (let k = 1; k < 6; k++) {
      const t = k / 6;
      g.lineBetween(32 + 32 * t, 16 * t, 32 * t, 16 + 16 * t);
    }
    g.lineStyle(2.5, NEON.cyan, 0.9);
    g.lineBetween(2, TILE_H / 2 - 5, TILE_W / 2, TILE_H - 5);
    g.lineBetween(TILE_W / 2, 0, TILE_W - 2, TILE_H / 2 - 5);
    g.fillStyle(0x353a52, 1);
    g.fillRect(TILE_W / 2 - 3, TILE_H + 8, 6, 14);
  });
  withGraphics(scene, 'crack', TILE_W, TILE_H, (g) => {
    g.lineStyle(4, NEON.orange, 0.35);
    const path = [[22, 12], [30, 16], [27, 20], [38, 23], [42, 20]];
    g.beginPath(); g.moveTo(path[0][0], path[0][1]); path.slice(1).forEach(([x, y]) => g.lineTo(x, y)); g.strokePath();
    g.lineStyle(1.5, 0xf7e3b5, 1);
    g.beginPath(); g.moveTo(path[0][0], path[0][1]); path.slice(1).forEach(([x, y]) => g.lineTo(x, y)); g.strokePath();
  });
  // floating-platform edges
  withGraphics(scene, 'edge_left', TILE_W / 2, TILE_H / 2 + 30, (g) => {
    poly(g, [{ x: 0, y: 0 }, { x: TILE_W / 2, y: TILE_H / 2 }, { x: TILE_W / 2, y: TILE_H / 2 + 30 }, { x: 0, y: 30 }], 0x3a3350, 1, null);
    g.lineStyle(2, NEON.cyan, 0.8);
    g.lineBetween(0, 6, TILE_W / 2, TILE_H / 2 + 6);
  });
  withGraphics(scene, 'edge_right', TILE_W / 2, TILE_H / 2 + 30, (g) => {
    poly(g, [{ x: 0, y: TILE_H / 2 }, { x: TILE_W / 2, y: 0 }, { x: TILE_W / 2, y: 30 }, { x: 0, y: TILE_H / 2 + 30 }], 0x2b2f45, 1, null);
    g.lineStyle(2, NEON.pink, 0.8);
    g.lineBetween(0, TILE_H / 2 + 6, TILE_W / 2, 6);
  });
}

// ───────────────────────────── towers
interface Geo { L: Pt; B: Pt; R: Pt; T: Pt; H: number }

function faceQuad(a: Pt, b: Pt, t0: number, t1: number, u0: number, u1: number): Pt[] {
  const at = (t: number, u: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - u });
  return [at(t0, u0), at(t1, u0), at(t1, u1), at(t0, u1)];
}

const WINDOW_COLORS = [NEON.yellow, 0xf7e3b5, 0xffd89a, NEON.yellow, NEON.cyan, 0xf7e3b5];

function windows(g: G, a: Pt, b: Pt, H: number, cols: number, seed: number, base = 14) {
  const rng = createRng(seed);
  const rows = Math.max(1, Math.floor((H - base - 6) / 11));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const t0 = (c + 0.22) / cols, t1 = (c + 0.78) / cols;
      const u0 = base + r * 11, u1 = u0 + 6;
      const lit = rng() < 0.45;
      const col = lit ? WINDOW_COLORS[Math.floor(rng() * WINDOW_COLORS.length)] : 0x444a6b;
      poly(g, faceQuad(a, b, t0, t1, u0, u1), col, lit ? 0.75 : 0.8, null);
    }
}

/** Glass tower: two lit facades, neon edges, flat roof. Returns the roof centre. */
function tower(g: G, geo: Geo, accent: number, seed: number, wCols: number, hCols: number) {
  const { L, B, R, T, H } = geo;
  const up = (p: Pt, h = H) => ({ x: p.x, y: p.y - h });
  poly(g, [L, B, up(B), up(L)], 0x3b4063);
  poly(g, [B, R, up(R), up(B)], 0x2f3452);
  windows(g, L, B, H, wCols, seed);
  windows(g, B, R, H, hCols, seed + 1);
  poly(g, [up(T), up(R), up(B), up(L)], 0x474c72);
  // neon trims
  g.lineStyle(2, accent, 0.75);
  g.strokePoints([up(L), up(B), up(R)], false);
  g.lineBetween(B.x, B.y, B.x, B.y - H);
  g.lineStyle(1.5, accent, 0.35);
  g.strokePoints([up(T), up(R), up(B), up(L)], true);
  return { x: (L.x + R.x) / 2, y: (T.y + B.y) / 2 - H };
}

function door(g: G, L: Pt, B: Pt, accent: number) {
  poly(g, faceQuad(L, B, 0.4, 0.6, 0, 20), 0x1e2133, 1, null);
  g.lineStyle(2, accent, 1);
  g.strokePoints(faceQuad(L, B, 0.4, 0.6, 0, 20), true);
  poly(g, faceQuad(L, B, 0.35, 0.65, 20, 24), accent, 0.9, null);
}

export const TOWER_H: Record<string, number> = { cityhall: 118, datacenter: 104, cleaning: 78, mllab: 108, evaluation: 88, deploy: 70, monitoring: 150 };

function drawBuilding(scene: Phaser.Scene, b: BuildingDef) {
  const { w, h } = b.tile;
  const m = 24;
  const H = TOWER_H[b.id];
  const extra = b.id === 'monitoring' ? 70 : 60;
  const ox = h * (TILE_W / 2) + m;
  const oy = H + extra + m;
  const width = (w + h) * (TILE_W / 2) + m * 2;
  const height = oy + (w + h) * (TILE_H / 2) + m;
  const T = { x: ox, y: oy };
  const R = { x: ox + w * (TILE_W / 2), y: oy + w * (TILE_H / 2) };
  const B = { x: ox + (w - h) * (TILE_W / 2), y: oy + (w + h) * (TILE_H / 2) };
  const L = { x: ox - h * (TILE_W / 2), y: oy + h * (TILE_H / 2) };
  const accent = b.roof;
  const seed = b.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  withGraphics(scene, `bld_${b.id}`, width, height, (g) => {
    g.fillStyle(accent, 0.18);
    g.fillEllipse((L.x + R.x) / 2, (T.y + B.y) / 2 + 4, (R.x - L.x) * 1.25, (B.y - T.y) * 1.25);
    // podium
    const pod = 8;
    poly(g, [L, B, { x: B.x, y: B.y - pod }, { x: L.x, y: L.y - pod }], 0x30344d);
    poly(g, [B, R, { x: R.x, y: R.y - pod }, { x: B.x, y: B.y - pod }], 0x262a40);
    const inset = (p: Pt, k = 0.12) => ({ x: p.x + ((L.x + R.x) / 2 - p.x) * k, y: p.y + ((T.y + B.y) / 2 - p.y) * k - pod });
    const geo = { L: inset(L), B: inset(B), R: inset(R), T: inset(T), H: H - pod };
    const top = tower(g, geo, accent, seed, w * 3, h * 3);
    door(g, geo.L, geo.B, accent);

    const cx = top.x, cy = top.y;
    switch (b.id) {
      case 'cityhall': {
        g.fillStyle(0x474c72, 1);
        g.slice(cx, cy + 2, 26, Math.PI, 0, false); g.fillPath();
        g.lineStyle(2, accent, 1); g.beginPath(); g.arc(cx, cy + 2, 26, Math.PI, 0); g.strokePath();
        g.lineStyle(1.5, accent, 0.6); g.beginPath(); g.arc(cx, cy + 2, 16, Math.PI, 0); g.strokePath();
        g.lineStyle(3, 0xb9bdd6, 1); g.lineBetween(cx, cy - 24, cx, cy - 50);
        g.fillStyle(NEON.yellow, 1); g.fillCircle(cx, cy - 52, 4);
        g.fillStyle(NEON.yellow, 0.25); g.fillCircle(cx, cy - 52, 10);
        break;
      }
      case 'datacenter':
        for (let i = -1; i <= 1; i++) {
          poly(g, [{ x: cx + i * 16 - 6, y: cy - 2 }, { x: cx + i * 16 + 6, y: cy - 2 }, { x: cx + i * 16 + 6, y: cy - 20 }, { x: cx + i * 16 - 6, y: cy - 20 }], 0x343a5a, 1, EDGE);
          for (let k = 0; k < 4; k++) { g.fillStyle(k % 2 ? NEON.green : NEON.cyan, 1); g.fillRect(cx + i * 16 - 3, cy - 17 + k * 4, 2, 2); }
        }
        g.lineStyle(2, 0xb9bdd6, 1); g.lineBetween(cx + 26, cy - 4, cx + 26, cy - 36);
        g.lineStyle(2, NEON.cyan, 0.8); g.strokeEllipse(cx + 26, cy - 38, 16, 7);
        break;
      case 'cleaning':
        [-14, 12].forEach((dx, i) => {
          g.fillStyle(0x343a5a, 1); g.fillRect(cx + dx - 8, cy - 26, 16, 26);
          g.fillStyle(i ? NEON.cyan : NEON.green, 0.75); g.fillRect(cx + dx - 6, cy - 14, 12, 12);
          g.lineStyle(1.5, accent, 1); g.strokeRect(cx + dx - 8, cy - 26, 16, 26);
          g.fillStyle(0x474c72, 1); g.fillEllipse(cx + dx, cy - 26, 16, 6);
        });
        g.lineStyle(3, 0x8a86c8, 1); g.lineBetween(cx - 6, cy - 20, cx + 4, cy - 20);
        break;
      case 'mllab':
        g.fillStyle(NEON.violet, 0.25); g.fillCircle(cx, cy - 14, 30);
        g.fillStyle(0x3a3f63, 1); g.slice(cx, cy, 24, Math.PI, 0, false); g.fillPath();
        g.lineStyle(2.5, NEON.violet, 1); g.beginPath(); g.arc(cx, cy, 24, Math.PI, 0); g.strokePath();
        g.lineStyle(2, NEON.pink, 0.9);
        g.beginPath(); g.moveTo(cx - 14, cy - 6); g.lineTo(cx - 6, cy - 16); g.lineTo(cx + 2, cy - 8); g.lineTo(cx + 12, cy - 18); g.strokePath();
        [[cx - 14, cy - 6], [cx - 6, cy - 16], [cx + 2, cy - 8], [cx + 12, cy - 18]].forEach(([x, y]) => { g.fillStyle(NEON.cyan, 1); g.fillCircle(x, y, 2.5); });
        break;
      case 'evaluation':
        g.fillStyle(0x1c1f30, 0.85); g.fillRoundedRect(cx - 30, cy - 44, 60, 38, 5);
        g.lineStyle(2, accent, 1); g.strokeRoundedRect(cx - 30, cy - 44, 60, 38, 5);
        [[NEON.green, 14], [NEON.yellow, 24], [NEON.pink, 10], [NEON.cyan, 19]].forEach(([c, hh], i) => { g.fillStyle(c, 0.95); g.fillRect(cx - 22 + i * 12, cy - 10 - hh, 8, hh); });
        g.lineStyle(2, 0xb9bdd6, 1); g.lineBetween(cx - 16, cy - 6, cx - 16, cy + 2); g.lineBetween(cx + 16, cy - 6, cx + 16, cy + 2);
        break;
      case 'deploy': {
        g.fillStyle(0x343a5a, 1); g.fillEllipse(cx, cy - 2, 50, 18);
        g.lineStyle(2, accent, 1); g.strokeEllipse(cx, cy - 2, 50, 18);
        const rx = cx, ry = cy - 6;
        poly(g, [{ x: rx - 7, y: ry }, { x: rx + 7, y: ry }, { x: rx + 7, y: ry - 28 }, { x: rx, y: ry - 42 }, { x: rx - 7, y: ry - 28 }], 0xe6e4ee, 1, EDGE);
        poly(g, [{ x: rx - 7, y: ry }, { x: rx - 13, y: ry + 5 }, { x: rx - 7, y: ry - 10 }], accent, 1, EDGE);
        poly(g, [{ x: rx + 7, y: ry }, { x: rx + 13, y: ry + 5 }, { x: rx + 7, y: ry - 10 }], accent, 1, EDGE);
        g.fillStyle(NEON.cyan, 1); g.fillCircle(rx, ry - 22, 3.5);
        break;
      }
      case 'monitoring':
        g.lineStyle(4, 0xb9bdd6, 1); g.lineBetween(cx, cy, cx, cy - 46);
        g.fillStyle(0x474c72, 1); g.fillEllipse(cx - 10, cy - 52, 34, 14);
        g.lineStyle(2, accent, 1); g.strokeEllipse(cx - 10, cy - 52, 34, 14);
        g.lineStyle(2, 0xb9bdd6, 1); g.lineBetween(cx - 10, cy - 52, cx - 2, cy - 64);
        g.fillStyle(NEON.pink, 1); g.fillCircle(cx, cy - 66, 3.5);
        g.fillStyle(NEON.pink, 0.25); g.fillCircle(cx, cy - 66, 10);
        break;
    }
  });
  return { ox, oy };
}

export const buildingTextureOrigin: Record<string, { ox: number; oy: number }> = {};
export const houseOrigins: Record<string, { ox: number; oy: number }> = {};

/** Small residential towers that fill the town. */
function makeHouse(scene: Phaser.Scene, key: string, accent: number, seed: number) {
  const rng = createRng(seed);
  const H = 44 + Math.floor(rng() * 50);
  const m = 16;
  const ox = 2 * 32 + m, oy = H + m + 16;
  const T = { x: ox, y: oy }, R = { x: ox + 64, y: oy + 32 }, B = { x: ox, y: oy + 64 }, L = { x: ox - 64, y: oy + 32 };
  withGraphics(scene, key, 4 * 32 + m * 2, oy + 64 + m, (g) => {
    g.fillStyle(accent, 0.12);
    g.fillEllipse(ox, oy + 32, 150, 76);
    const inset = (p: Pt) => ({ x: p.x + (ox - p.x) * 0.18, y: p.y + (oy + 32 - p.y) * 0.18 });
    const geo = { L: inset(L), B: inset(B), R: inset(R), T: inset(T), H };
    const top = tower(g, geo, accent, seed, 4, 4);
    door(g, geo.L, geo.B, accent);
    if (rng() < 0.5) {
      g.lineStyle(2, 0xb9bdd6, 1); g.lineBetween(top.x + 10, top.y, top.x + 10, top.y - 14);
      g.fillStyle(NEON.pink, 1); g.fillCircle(top.x + 10, top.y - 15, 2);
    } else {
      g.fillStyle(NEON.green, 0.8); g.fillEllipse(top.x - 6, top.y - 2, 22, 8);
    }
  });
  houseOrigins[key] = { ox, oy };
}

// ───────────────────────────── props
function makeProps(scene: Phaser.Scene) {
  [[0x9cc5a1, 0x6f9a7a], [NEON.violet, 0x7d71ad], [NEON.pink, 0xa9778a]].forEach(([c, d], i) =>
    withGraphics(scene, `tree_${i}`, 56, 76, (g) => {
      g.fillStyle(c, 0.18); g.fillEllipse(28, 70, 40, 12);
      g.fillStyle(0x3a3350, 1); g.fillRect(25, 44, 6, 26);
      g.fillStyle(d, 1); g.fillCircle(18, 38, 14); g.fillCircle(38, 38, 14);
      g.fillStyle(c, 1); g.fillCircle(28, 26, 19); g.fillCircle(16, 34, 11);
      g.fillStyle(0xffffff, 0.9);
      [[20, 20], [34, 30], [24, 38], [38, 22]].forEach(([x, y]) => g.fillCircle(x, y, 1.6));
    }),
  );
  [NEON.cyan, NEON.violet, NEON.green].forEach((c, i) =>
    withGraphics(scene, `pine_${i}`, 48, 80, (g) => {
      g.fillStyle(c, 0.16); g.fillEllipse(24, 74, 34, 10);
      g.fillStyle(0x3a3350, 1); g.fillRect(22, 60, 4, 14);
      [[62, 20], [46, 16], [30, 12]].forEach(([y, r]) => {
        g.fillStyle(c, 0.35); g.fillTriangle(24 - r, y, 24 + r, y, 24, y - 26);
        g.lineStyle(1.5, c, 1); g.strokeTriangle(24 - r, y, 24 + r, y, 24, y - 26);
      });
    }),
  );
  [NEON.green, NEON.pink, NEON.cyan].forEach((c, i) =>
    withGraphics(scene, `bush_${i}`, 40, 32, (g) => {
      poly(g, [{ x: 6, y: 20 }, { x: 34, y: 20 }, { x: 31, y: 30 }, { x: 9, y: 30 }], 0x3b4063, 1, c, 0.9);
      g.fillStyle(0x6f9a7a, 1); g.fillCircle(14, 16, 7); g.fillCircle(26, 16, 7);
      g.fillStyle(c, 0.9); g.fillCircle(20, 12, 4); g.fillCircle(12, 13, 2); g.fillCircle(28, 12, 2);
    }),
  );
  [NEON.pink, NEON.cyan, NEON.yellow, NEON.violet].forEach((p, i) =>
    withGraphics(scene, `flowers_${i}`, TILE_W, TILE_H, (g) => {
      [[20, 12], [32, 18], [42, 11], [28, 8], [38, 22]].forEach(([x, y]) => {
        g.fillStyle(p, 0.3); g.fillCircle(x, y, 4);
        g.fillStyle(p, 1); g.fillCircle(x, y, 1.6);
      });
    }),
  );
  withGraphics(scene, 'lamp', 30, 64, (g) => {
    g.fillStyle(NEON.cyan, 0.15); g.fillCircle(20, 10, 10);
    g.fillStyle(0x474c72, 1); g.fillRect(6, 14, 3, 48);
    g.lineStyle(3, 0x474c72, 1); g.beginPath(); g.arc(14, 14, 7, Math.PI, Math.PI * 1.8); g.strokePath();
    g.fillStyle(NEON.cyan, 1); g.fillRoundedRect(15, 8, 10, 4, 2);
  });
  withGraphics(scene, 'fountain', 70, 70, (g) => {
    g.fillStyle(0x3b4063, 1); g.fillEllipse(35, 56, 60, 22);
    g.lineStyle(2, NEON.cyan, 1); g.strokeEllipse(35, 56, 60, 22);
    g.fillStyle(NEON.cyan, 0.18); g.fillTriangle(35, 8, 20, 54, 50, 54);
    g.lineStyle(1.5, NEON.cyan, 0.8); g.strokeTriangle(35, 8, 20, 54, 50, 54);
    g.fillStyle(NEON.pink, 1); g.fillCircle(35, 24, 5);
  });
  withGraphics(scene, 'bench', 40, 26, (g) => {
    poly(g, [{ x: 4, y: 12 }, { x: 26, y: 2 }, { x: 36, y: 8 }, { x: 14, y: 18 }], 0x474c72, 1, NEON.pink, 0.8);
    g.fillStyle(0x3a3350, 1); g.fillRect(8, 16, 3, 8); g.fillRect(30, 8, 3, 8);
  });
  withGraphics(scene, 'shadow', 28, 12, (g) => { g.fillStyle(0x000000, 0.35); g.fillEllipse(14, 6, 26, 10); });
  withGraphics(scene, 'dot', 12, 12, (g) => { g.fillStyle(0xffffff, 1); g.fillCircle(6, 6, 6); });
  withGraphics(scene, 'spark', 16, 16, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(8, 0, 10, 8, 6, 8); g.fillTriangle(8, 16, 10, 8, 6, 8);
    g.fillTriangle(0, 8, 8, 6, 8, 10); g.fillTriangle(16, 8, 8, 6, 8, 10);
  });
  withGraphics(scene, 'confetti', 8, 5, (g) => { g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 8, 5); });
  withGraphics(scene, 'marker', 30, 34, (g) => {
    g.fillStyle(NEON.yellow, 0.3); g.fillCircle(15, 14, 15);
    g.fillStyle(NEON.yellow, 1); g.fillTriangle(3, 4, 27, 4, 15, 30);
    g.lineStyle(2.5, EDGE, 1); g.strokeTriangle(3, 4, 27, 4, 15, 30);
  });
  withGraphics(scene, 'ring', TILE_W, TILE_H, (g) => {
    g.lineStyle(3, NEON.yellow, 1); g.strokeEllipse(32, 16, 56, 26);
  });
  withGraphics(scene, 'warn_sign', 34, 52, (g) => {
    g.fillStyle(NEON.orange, 0.25); g.fillCircle(17, 18, 17);
    g.fillStyle(0x474c72, 1); g.fillRect(15, 26, 4, 26);
    g.fillStyle(NEON.yellow, 1); g.fillTriangle(17, 2, 33, 30, 1, 30);
    g.lineStyle(2.5, EDGE, 1); g.strokeTriangle(17, 2, 33, 30, 1, 30);
    g.fillStyle(EDGE, 1); g.fillRect(15.5, 11, 3, 10); g.fillCircle(17, 25, 1.8);
  });
  withGraphics(scene, 'rocket', 28, 46, (g) => {
    g.fillStyle(NEON.orange, 1); g.fillTriangle(8, 34, 20, 34, 14, 46);
    g.fillStyle(NEON.pink, 1); g.fillTriangle(6, 24, 6, 36, 0, 36); g.fillTriangle(22, 24, 22, 36, 28, 36);
    g.fillStyle(0xe6e4ee, 1); g.fillRoundedRect(6, 6, 16, 30, 7); g.fillTriangle(6, 12, 22, 12, 14, 0);
    g.fillStyle(NEON.cyan, 1); g.fillCircle(14, 18, 4);
  });
  // chatter bubbles with tiny drawings (language-free)
  const bubble = (key: string, draw: (g: G) => void) =>
    withGraphics(scene, key, 34, 32, (g) => {
      g.fillStyle(0x2f3452, 0.95); g.fillRoundedRect(1, 1, 32, 24, 10); g.fillTriangle(12, 24, 20, 24, 14, 31);
      g.lineStyle(1.5, NEON.cyan, 0.8); g.strokeRoundedRect(1, 1, 32, 24, 10);
      draw(g);
    });
  bubble('bub_heart', (g) => { g.fillStyle(NEON.pink, 1); g.fillCircle(13.5, 10, 4); g.fillCircle(20.5, 10, 4); g.fillTriangle(9.6, 11.5, 24.4, 11.5, 17, 19.5); });
  bubble('bub_note', (g) => { g.fillStyle(NEON.violet, 1); g.fillEllipse(13, 17, 7, 5); g.fillEllipse(23, 15, 7, 5); g.fillRect(15.5, 6, 2, 11); g.fillRect(25.5, 4, 2, 11); g.fillRect(15.5, 4, 12, 3); });
  bubble('bub_cup', (g) => { g.fillStyle(NEON.orange, 1); g.fillRoundedRect(10, 9, 13, 11, 3); g.lineStyle(2, NEON.orange, 1); g.strokeCircle(24, 13.5, 3); });
  bubble('bub_flower', (g) => { g.fillStyle(NEON.yellow, 1); [[0, -5], [5, 0], [0, 5], [-5, 0]].forEach(([dx, dy]) => g.fillCircle(17 + dx, 12 + dy, 3.5)); g.fillStyle(NEON.pink, 1); g.fillCircle(17, 12, 3); });
  bubble('bub_bridge', (g) => { g.fillStyle(NEON.cyan, 1); g.fillRect(6, 9, 22, 4); g.lineStyle(2.5, NEON.cyan, 1); g.beginPath(); g.arc(17, 20, 9, Math.PI, 0); g.strokePath(); g.fillStyle(NEON.orange, 1); g.fillRect(16, 3, 2.5, 5); });
}

// ───────────────────────────── vehicles
/** Iso car driving along the grid y axis. `forward` = heading +y (towards bottom-left of the screen). */
function makeCars(scene: Phaser.Scene) {
  const colors = [NEON.pink, NEON.cyan, NEON.yellow, NEON.violet, NEON.green, 0xe6e4ee];
  const proj = (gx: number, gy: number, z: number, cx: number, cy: number) => ({ x: cx + (gx - gy) * (TILE_W / 2), y: cy + (gx + gy) * (TILE_H / 2) - z });
  colors.forEach((c, i) =>
    [true, false].forEach((forward) =>
      withGraphics(scene, `car_${i}_${forward ? 'f' : 'b'}`, 60, 46, (g) => {
        const cx = 30, cy = 22;
        const hx = 0.2, hy = 0.42;
        const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top: number, left: number, right: number) => {
          const P = (x: number, y: number, z: number) => proj(x, y, z, cx, cy);
          poly(g, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], left, 1, EDGE, 0.7, 1);
          poly(g, [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], right, 1, EDGE, 0.7, 1);
          poly(g, [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], top, 1, EDGE, 0.7, 1);
        };
        g.fillStyle(c, 0.25);
        g.fillEllipse(cx, cy + 4, 40, 18);
        box(-hx, hx, -hy, hy, 2, 9, shade(c, 0.2), shade(c, -0.15), shade(c, -0.35));
        box(-hx * 0.8, hx * 0.8, -hy * 0.45, hy * 0.35, 9, 15, NEON.cyan, 0x2c3450, 0x252c44);
        const front = forward ? hy : -hy;
        const back = -front;
        const Pf = (x: number) => proj(x, front, 6, cx, cy);
        const Pb = (x: number) => proj(x, back, 6, cx, cy);
        g.fillStyle(0xf7e3b5, 1); g.fillCircle(Pf(-0.12).x, Pf(-0.12).y, 1.8); g.fillCircle(Pf(0.12).x, Pf(0.12).y, 1.8);
        g.fillStyle(0xd27a7a, 1); g.fillCircle(Pb(-0.12).x, Pb(-0.12).y, 1.5); g.fillCircle(Pb(0.12).x, Pb(0.12).y, 1.5);
      }),
    ),
  );
  // sky traffic
  [NEON.pink, NEON.cyan, NEON.yellow].forEach((c, i) =>
    withGraphics(scene, `hover_${i}`, 44, 22, (g) => {
      g.fillStyle(c, 0.25); g.fillEllipse(22, 18, 36, 6);
      g.fillStyle(0x3b4063, 1); g.fillRoundedRect(4, 6, 36, 9, 4);
      g.fillStyle(NEON.cyan, 0.9); g.fillRoundedRect(14, 2, 14, 6, 3);
      g.lineStyle(1.5, c, 1); g.strokeRoundedRect(4, 6, 36, 9, 4);
      g.fillStyle(0xf7e3b5, 1); g.fillCircle(40, 10, 1.8);
    }),
  );
}

// ───────────────────────────── sky
export function makeSky(scene: Phaser.Scene) {
  const skies: Record<string, [number, string][]> = {
    sky_dark: [[0, '#1f2338'], [0.45, '#2f3452'], [0.75, '#4f4a6b'], [1, '#9a7f8f']],
    sky_light: [[0, '#c6d8e8'], [0.5, '#dfe3ee'], [0.8, '#ece5ea'], [1, '#f3e3d8']],
  };
  for (const [key, stops] of Object.entries(skies)) {
    if (scene.textures.exists(key)) continue;
    const tex = scene.textures.createCanvas(key, 8, 512);
    if (!tex) continue;
    const ctx = tex.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    stops.forEach(([o, c]) => grad.addColorStop(o, c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, 512);
    tex.refresh();
  }
}

// ───────────────────────────── characters (Kenney Toon Characters, CC0)
export const CHARACTER_SHEETS = ['femaleAdventurer', 'maleAdventurer', 'femalePerson', 'malePerson'] as const;
export type CharacterSheet = (typeof CHARACTER_SHEETS)[number];

/** source colour → neon colour, per sheet. Skin tones are left untouched on purpose. */
export const NEON_RECOLOR: Record<CharacterSheet, [number, number][]> = {
  femaleAdventurer: [[0xdb855c, 0xc98a9e], [0xbf7958, 0x6e6a99], [0x71a2be, 0x8fb8de], [0x578cab, 0x6f95bd]],
  maleAdventurer: [[0xe59b5c, 0xe0b56a], [0xbf7958, 0x5f6690], [0x3cbd7a, 0x9cc5a1]],
  femalePerson: [[0x3c3e41, 0x4b4870], [0x39b373, 0x8fb8de], [0x71a2be, 0xd9a0b4], [0x6063b9, 0x3b4063]],
  malePerson: [[0x6467c0, 0xa99bd6], [0xe89c5d, 0xf2c46d], [0xe2eef7, 0xe6e4ee], [0x3c3e41, 0x3a3350]],
};

const rgb = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Pixel recolour: each pixel close to a key colour takes the neon target, keeping its relative shading. */
export function recolorPixels(data: Uint8ClampedArray, map: [number, number][], maxDist = 46) {
  const keys = map.map(([s, t]) => ({ s: rgb(s), t: rgb(t) }));
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    let best = -1, bestD = maxDist;
    keys.forEach((k, j) => {
      const d = Math.hypot(r - k.s[0], g - k.s[1], b - k.s[2]);
      if (d < bestD) { bestD = d; best = j; }
    });
    if (best < 0) continue;
    const k = keys[best];
    const f = Math.min(1.6, (lum(r, g, b) + 1) / (lum(k.s[0], k.s[1], k.s[2]) + 1));
    data[i] = Math.min(255, k.t[0] * f);
    data[i + 1] = Math.min(255, k.t[1] * f);
    data[i + 2] = Math.min(255, k.t[2] * f);
  }
}

/** Respects Vite's `base`, so it also works under a GitHub Pages subpath. */
const ASSET_BASE = `${import.meta.env.BASE_URL}assets/kenney-toon/`;

export function loadCharacterSheets(scene: Phaser.Scene) {
  for (const k of CHARACTER_SHEETS)
    scene.load.atlasXML(`src_${k}`, `${ASSET_BASE}character_${k}_sheet.png`, `${ASSET_BASE}character_${k}_sheet.xml`);
}

/** Builds neon copies (`toon_<sheet>`) of the loaded atlases, with the same frames, plus walk animations. */
export function prepareCharacters(scene: Phaser.Scene) {
  for (const k of CHARACTER_SHEETS) {
    const key = `toon_${k}`;
    if (!scene.textures.exists(key)) {
      const src = scene.textures.get(`src_${k}`);
      const img = src.getSourceImage() as HTMLImageElement;
      const canvas = scene.textures.createCanvas(key, img.width, img.height)!;
      const ctx = canvas.getContext();
      ctx.drawImage(img, 0, 0);
      const px = ctx.getImageData(0, 0, img.width, img.height);
      recolorPixels(px.data, NEON_RECOLOR[k]);
      ctx.putImageData(px, 0, 0);
      for (const name of src.getFrameNames()) {
        const f = src.get(name);
        canvas.add(name, 0, f.cutX, f.cutY, f.cutWidth, f.cutHeight);
      }
      canvas.refresh();
    }
    if (!scene.anims.exists(`${k}_walk`))
      scene.anims.create({
        key: `${k}_walk`,
        frames: Array.from({ length: 8 }, (_, i) => ({ key, frame: `walk${i}` })),
        frameRate: 14,
        repeat: -1,
      });
  }
}

export function generateAllTextures(scene: Phaser.Scene, houses: { roof: number }[]) {
  makeTiles(scene);
  makeProps(scene);
  makeCars(scene);
  makeSky(scene);
  for (const b of BUILDINGS) buildingTextureOrigin[b.id] = drawBuilding(scene, b);
  const accents = [NEON.pink, NEON.cyan, NEON.violet, NEON.yellow, NEON.green, NEON.orange];
  houses.forEach((_, i) => makeHouse(scene, `house_${i}`, accents[i % accents.length], 900 + i * 17));
}
