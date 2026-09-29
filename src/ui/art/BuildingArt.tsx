import type { BuildingId } from '../../content/buildings';
import { BUILDING_BY_ID } from '../../content/buildings';
import { createRng } from '../../ml/rng';

const EDGE = '#1c1f30';
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const WIN = ['#f2c46d', '#f7e3b5', '#ffd89a', '#f2c46d', '#8fb8de'];

/** Height of each tower in the 100×100 viewBox — mirrors the Phaser towers. */
const H: Record<BuildingId, number> = { cityhall: 46, datacenter: 42, cleaning: 32, mllab: 44, evaluation: 36, deploy: 28, monitoring: 50 };

/** A lit window grid on one facade, from corner a to corner b, rising `h`. */
function facade(a: [number, number], b: [number, number], h: number, cols: number, seed: number) {
  const rng = createRng(seed);
  const rows = Math.max(1, Math.floor((h - 8) / 6));
  const out = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const t0 = (c + 0.22) / cols, t1 = (c + 0.78) / cols;
      const u0 = 6 + r * 6, u1 = u0 + 3.2;
      const P = (t: number, u: number) => `${a[0] + (b[0] - a[0]) * t},${a[1] + (b[1] - a[1]) * t - u}`;
      const lit = rng() < 0.55;
      out.push(<polygon key={`${r}-${c}`} points={`${P(t0, u0)} ${P(t1, u0)} ${P(t1, u1)} ${P(t0, u1)}`} fill={lit ? WIN[Math.floor(rng() * WIN.length)] : '#444a6b'} />);
    }
  return out;
}

/** Miniature neon glass tower for each building (menus, panel headers, title screen). */
export function BuildingArt({ id, size = 40, className = '' }: { id: BuildingId; size?: number; className?: string }) {
  const b = BUILDING_BY_ID[id];
  const accent = hex(b.roof);
  const h = H[id];
  // footprint: T(50,64) R(80,79) B(50,94) L(20,79)
  const L: [number, number] = [20, 79], B: [number, number] = [50, 94], R: [number, number] = [80, 79], T: [number, number] = [50, 64];
  const up = (p: [number, number]) => `${p[0]},${p[1] - h}`;
  const pt = (p: [number, number]) => `${p[0]},${p[1]}`;
  const topY = 79 - h;
  const seed = id.length * 31 + h;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 ${className}`} aria-hidden>
      <ellipse cx="50" cy="86" rx="40" ry="11" fill={accent} opacity="0.2" />
      <polygon points={`${pt(L)} ${pt(B)} ${up(B)} ${up(L)}`} fill="#3b4063" stroke={EDGE} strokeWidth="1" />
      <polygon points={`${pt(B)} ${pt(R)} ${up(R)} ${up(B)}`} fill="#2f3452" stroke={EDGE} strokeWidth="1" />
      {facade(L, B, h, 3, seed)}
      {facade(B, R, h, 3, seed + 1)}
      <polygon points={`${up(T)} ${up(R)} ${up(B)} ${up(L)}`} fill="#474c72" stroke={accent} strokeWidth="1.2" />
      <polyline points={`${up(L)} ${up(B)} ${up(R)}`} fill="none" stroke={accent} strokeWidth="2" />
      <line x1={B[0]} y1={B[1]} x2={B[0]} y2={B[1] - h} stroke={accent} strokeWidth="1.6" />
      <polygon points="31,86 37,89 37,80 31,77" fill="#1e2133" stroke={accent} strokeWidth="1.2" />
      {id === 'cityhall' && (
        <g>
          <path d={`M36 ${topY} A14 14 0 0 1 64 ${topY}Z`} fill="#474c72" stroke={accent} strokeWidth="1.5" />
          <line x1="50" y1={topY - 14} x2="50" y2={topY - 26} stroke="#b9bdd6" strokeWidth="2" />
          <circle cx="50" cy={topY - 27} r="2.6" fill="#f2c46d" />
        </g>
      )}
      {id === 'datacenter' && (
        <g>
          {[-9, 0, 9].map((dx) => <rect key={dx} x={47 + dx} y={topY - 10} width="6" height="10" fill="#343a5a" stroke={accent} strokeWidth="0.8" />)}
          <line x1="64" y1={topY} x2="64" y2={topY - 16} stroke="#b9bdd6" strokeWidth="1.5" />
          <ellipse cx="64" cy={topY - 17} rx="6" ry="2.6" fill="none" stroke={accent} strokeWidth="1.3" />
        </g>
      )}
      {id === 'cleaning' && (
        <g>
          {[-8, 8].map((dx, i) => (
            <g key={dx}>
              <rect x={45 + dx} y={topY - 14} width="10" height="14" fill="#343a5a" stroke={accent} strokeWidth="1" />
              <rect x={46.5 + dx} y={topY - 8} width="7" height="7" fill={i ? '#8fb8de' : '#9cc5a1'} opacity="0.85" />
            </g>
          ))}
        </g>
      )}
      {id === 'mllab' && (
        <g>
          <circle cx="50" cy={topY - 4} r="17" fill={accent} opacity="0.2" />
          <path d={`M36 ${topY} A14 14 0 0 1 64 ${topY}Z`} fill="#3a3f63" stroke={accent} strokeWidth="1.6" />
          <polyline points={`42,${topY - 3} 46,${topY - 9} 51,${topY - 4} 57,${topY - 10}`} fill="none" stroke="#d9a0b4" strokeWidth="1.3" />
        </g>
      )}
      {id === 'evaluation' && (
        <g>
          <rect x="33" y={topY - 24} width="34" height="20" rx="3" fill="#1c1f30" stroke={accent} strokeWidth="1.3" />
          {[['#9cc5a1', 7], ['#f2c46d', 13], ['#d9a0b4', 5], ['#8fb8de', 10]].map(([c, hh], i) => (
            <rect key={i} x={37 + i * 7} y={topY - 7 - (hh as number)} width="4.5" height={hh as number} fill={c as string} />
          ))}
        </g>
      )}
      {id === 'deploy' && (
        <g>
          <ellipse cx="50" cy={topY} rx="14" ry="5" fill="#343a5a" stroke={accent} strokeWidth="1.2" />
          <path d={`M46 ${topY - 2} h8 v-14 l-4 -8 l-4 8Z`} fill="#e6e4ee" stroke={EDGE} strokeWidth="0.8" />
          <circle cx="50" cy={topY - 11} r="1.8" fill="#8fb8de" />
        </g>
      )}
      {id === 'monitoring' && (
        <g>
          <line x1="50" y1={topY} x2="50" y2={topY - 18} stroke="#b9bdd6" strokeWidth="2" />
          <ellipse cx="45" cy={topY - 20} rx="10" ry="4" fill="#474c72" stroke={accent} strokeWidth="1.3" />
          <circle cx="52" cy={topY - 26} r="2.4" fill="#d9a0b4" />
        </g>
      )}
    </svg>
  );
}

/** Tuca, the owl who gives hints — a little robo-owl with a neon visor. */
export function Owl({ size = 56, className = '' }: { size?: number; className?: string }) {
  const s = { stroke: EDGE, strokeWidth: 2.2, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`shrink-0 ${className}`} aria-hidden>
      <ellipse cx="50" cy="94" rx="26" ry="4" fill="#8fb8de" opacity="0.25" />
      <path d="M22 30 L30 12 L40 26Z M78 30 L70 12 L60 26Z" fill="#6b6f8f" {...s} />
      <path d="M20 50 C20 24 80 24 80 50 C80 78 68 92 50 92 S20 78 20 50Z" fill="#8a8fae" {...s} />
      <path d="M32 62 C32 50 68 50 68 62 C68 80 60 88 50 88 S32 80 32 62Z" fill="#e3e4ee" {...s} />
      <path d="M40 66 l4 4 4-4 M52 66 l4 4 4-4 M44 76 l4 4 4-4" fill="none" stroke="#a9aac4" strokeWidth={2} strokeLinecap="round" />
      <rect x="22" y="34" width="56" height="20" rx="10" fill="#1e2133" {...s} />
      <rect x="27" y="39" width="46" height="10" rx="5" fill="#8fb8de" opacity="0.9" />
      <circle cx="38" cy="44" r="3" fill="#fff" />
      <circle cx="62" cy="44" r="3" fill="#fff" />
      <path d="M46 57 L54 57 L50 63Z" fill="#e8a87c" {...s} />
      <path d="M20 54 C12 60 12 72 22 76 M80 54 C88 60 88 72 78 76" fill="#6b6f8f" {...s} />
      <line x1="50" y1="24" x2="50" y2="12" stroke="#b9bdd6" strokeWidth="2.2" />
      <circle cx="50" cy="10" r="3.5" fill="#d9a0b4" {...s} strokeWidth={1.5} />
    </svg>
  );
}
