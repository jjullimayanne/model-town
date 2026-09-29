import { NEON } from '../../game/textures';

/**
 * SVG ports of the in-game vehicle textures (see makeCars in game/textures.ts):
 * same projection, proportions, shading and colours, so the title screen shows the exact cars of the town.
 */
const TILE_W = 64;
const TILE_H = 32;
const EDGE = '#1c1f30';
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** Same lighten/darken rule as the Phaser `shade` helper. */
function shade(c: number, f: number) {
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f))));
  return hex((ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255));
}

export const CAR_COLORS = [NEON.pink, NEON.cyan, NEON.yellow, NEON.violet, NEON.green, 0xe6e4ee];
export const HOVER_COLORS = [NEON.pink, NEON.cyan, NEON.yellow];

type P = { x: number; y: number };
const pts = (ps: P[]) => ps.map((p) => `${p.x},${p.y}`).join(' ');

/**
 * Isometric car driving along the grid y axis, drawn in the texture's own 60×46 box
 * (centre at 30,22). `forward` = heading +y (towards the bottom-left of the screen).
 */
export function IsoCarShape({ color, forward }: { color: number; forward: boolean }) {
  const cx = 30, cy = 22, hx = 0.2, hy = 0.42;
  const proj = (gx: number, gy: number, z: number): P => ({ x: cx + (gx - gy) * (TILE_W / 2), y: cy + (gx + gy) * (TILE_H / 2) - z });
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top: string, left: string, right: string, key: string) => (
    <g key={key} stroke={EDGE} strokeOpacity={0.7} strokeWidth={1} strokeLinejoin="round">
      <polygon points={pts([proj(x0, y1, z0), proj(x1, y1, z0), proj(x1, y1, z1), proj(x0, y1, z1)])} fill={left} />
      <polygon points={pts([proj(x1, y0, z0), proj(x1, y1, z0), proj(x1, y1, z1), proj(x1, y0, z1)])} fill={right} />
      <polygon points={pts([proj(x0, y0, z1), proj(x1, y0, z1), proj(x1, y1, z1), proj(x0, y1, z1)])} fill={top} />
    </g>
  );
  const front = forward ? hy : -hy;
  const back = -front;
  const Pf = (x: number) => proj(x, front, 6);
  const Pb = (x: number) => proj(x, back, 6);
  return (
    <g>
      <ellipse cx={cx} cy={cy + 4} rx={20} ry={9} fill={hex(color)} opacity={0.25} />
      {box(-hx, hx, -hy, hy, 2, 9, shade(color, 0.2), shade(color, -0.15), shade(color, -0.35), 'body')}
      {box(-hx * 0.8, hx * 0.8, -hy * 0.45, hy * 0.35, 9, 15, hex(NEON.cyan), '#2c3450', '#252c44', 'cabin')}
      <circle cx={Pf(-0.12).x} cy={Pf(-0.12).y} r={1.8} fill="#f7e3b5" />
      <circle cx={Pf(0.12).x} cy={Pf(0.12).y} r={1.8} fill="#f7e3b5" />
      <circle cx={Pb(-0.12).x} cy={Pb(-0.12).y} r={1.5} fill="#d27a7a" />
      <circle cx={Pb(0.12).x} cy={Pb(0.12).y} r={1.5} fill="#d27a7a" />
    </g>
  );
}

/** The sky hover car (texture `hover_i`, 44×22). Faces right. */
export function HoverCarShape({ color }: { color: number }) {
  const c = hex(color);
  return (
    <g>
      <ellipse cx={22} cy={18} rx={18} ry={3} fill={c} opacity={0.25} />
      <rect x={4} y={6} width={36} height={9} rx={4} fill="#3b4063" stroke={c} strokeWidth={1.5} />
      <rect x={14} y={2} width={14} height={6} rx={3} fill={hex(NEON.cyan)} opacity={0.9} />
      <circle cx={40} cy={10} r={1.8} fill="#f7e3b5" />
    </g>
  );
}

/** Standalone hover car, e.g. drifting across the title sky. */
export function HoverCar({ color, scale = 1.6, flip = false }: { color: number; scale?: number; flip?: boolean }) {
  return (
    <svg viewBox="0 0 44 22" width={44 * scale} height={22 * scale} style={{ transform: flip ? 'scaleX(-1)' : undefined }} aria-hidden>
      <HoverCarShape color={color} />
    </svg>
  );
}

/**
 * The same town car seen from the side (for straight, horizontal roads): identical palette,
 * block body with a lit top face, glass cabin, head/tail lights and the hover glow. Faces right.
 */
export function SideCarShape({ color }: { color: number }) {
  return (
    <g stroke={EDGE} strokeOpacity={0.7} strokeWidth={1} strokeLinejoin="round">
      <ellipse cx={31} cy={32} rx={25} ry={3} fill={hex(color)} opacity={0.35} stroke="none" />
      {/* body with sloped nose and tail */}
      <path d="M5 24 V19 Q5 15.5 9 15.2 L16 14.5 L22 8.5 L40 8.5 L47.5 14.5 L53 15.2 Q57 16 57 20 V24 Q57 26.5 54.5 26.5 H7.5 Q5 26.5 5 24Z" fill={shade(color, -0.12)} />
      {/* roof / lit top */}
      <path d="M22 8.5 L40 8.5 L47.5 14.5 L16 14.5Z" fill={shade(color, 0.22)} />
      {/* glass */}
      <path d="M23.2 10 H30.4 V14 H18.4Z" fill={hex(NEON.cyan)} opacity={0.9} />
      <path d="M32.2 10 H39.3 L44.2 14 H32.2Z" fill={hex(NEON.cyan)} opacity={0.9} />
      {/* skirt + light strip */}
      <path d="M5 22.5 H57 V24 Q57 26.5 54.5 26.5 H7.5 Q5 26.5 5 24Z" fill={shade(color, -0.4)} />
      <line x1={9} y1={19.5} x2={52} y2={19.5} stroke={shade(color, 0.45)} strokeOpacity={0.9} strokeWidth={1.4} />
      <rect x={53.5} y={17} width={3.5} height={2.6} rx={1} fill="#f7e3b5" stroke="none" />
      <rect x={5} y={17} width={2.8} height={2.6} rx={1} fill="#d27a7a" stroke="none" />
    </g>
  );
}
