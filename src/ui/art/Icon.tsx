import type { ReactElement } from 'react';

/**
 * Model Town's hand-drawn icon set. One visual language everywhere:
 * warm bark outline, round joins, flat pastel fills. viewBox is 48×48.
 */
const INK = 'currentColor';
const C = {
  sun: '#ffd23f', sunDark: '#e0a020', coral: '#ff8a5b', red: '#e8574c', leaf: '#7cc46a', leafDark: '#4f9e62',
  sky: '#6fb7e8', skyLight: '#bfe6f5', berry: '#9b6bdf', cream: '#fff8e7', paper: '#fffdf6', wood: '#c98b55',
  woodDark: '#9a6437', gray: '#b8c0c8', pink: '#f7a1c4', water: '#6cc4e8', dark: '#3b2a20',
};

const pine = (x: number, y: number, s = 1) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 -14 L9 2 L-9 2 Z" fill={C.leafDark} />
    <path d="M0 -6 L11 10 L-11 10 Z" fill={C.leaf} />
    <rect x="-2" y="10" width="4" height="5" fill={C.woodDark} />
  </g>
);

const ICONS = {
  coin: (
    <>
      <circle cx="24" cy="24" r="16" fill={C.sun} />
      <circle cx="24" cy="24" r="10.5" fill="none" stroke={C.sunDark} />
      <path d="M24 17 v14 M20 21 h6 a3 3 0 0 1 0 6 h-6" fill="none" stroke={C.sunDark} />
    </>
  ),
  sun: (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1="24" y1="6" x2="24" y2="11" transform={`rotate(${a} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="9.5" fill={C.sun} />
    </>
  ),
  notebook: (
    <>
      <rect x="11" y="7" width="27" height="34" rx="4" fill={C.coral} />
      <rect x="11" y="7" width="7" height="34" rx="3" fill={C.red} />
      <rect x="22" y="14" width="12" height="7" rx="2" fill={C.paper} />
      <line x1="22" y1="28" x2="33" y2="28" /><line x1="22" y1="33" x2="30" y2="33" />
    </>
  ),
  star: <path d="M24 6 l5.3 11.2 12.2 1.6-9 8.5 2.3 12.1L24 33.5l-10.8 5.9 2.3-12.1-9-8.5 12.2-1.6Z" fill={C.sun} />,
  sparkle: (
    <>
      <path d="M24 5 C26 18 30 22 43 24 C30 26 26 30 24 43 C22 30 18 26 5 24 C18 22 22 18 24 5Z" fill={C.sun} />
      <circle cx="38" cy="10" r="2.5" fill={C.sun} />
    </>
  ),
  pin: (
    <>
      <path d="M24 43 C14 31 11 25 11 19 a13 13 0 0 1 26 0 c0 6-3 12-13 24Z" fill={C.coral} />
      <circle cx="24" cy="19" r="5" fill={C.paper} />
    </>
  ),
  trophy: (
    <>
      <path d="M15 8 h18 v9 a9 9 0 0 1-18 0Z" fill={C.sun} />
      <path d="M15 11 h-5 a5 5 0 0 0 6 7 M33 11 h5 a5 5 0 0 1-6 7" fill="none" />
      <rect x="21" y="26" width="6" height="7" fill={C.sunDark} />
      <rect x="14" y="33" width="20" height="7" rx="2" fill={C.wood} />
    </>
  ),
  map: (
    <>
      <path d="M6 12 L17 8 L31 12 L42 8 V36 L31 40 L17 36 L6 40Z" fill={C.cream} />
      <path d="M17 8 V36 M31 12 V40" fill="none" />
      <path d="M9 30 C14 24 20 30 24 22 S34 18 39 14" fill="none" stroke={C.coral} strokeDasharray="3 3" />
      <circle cx="37" cy="16" r="3" fill={C.red} />
    </>
  ),
  check: (
    <>
      <circle cx="24" cy="24" r="17" fill={C.leaf} />
      <path d="M15.5 24.5 l6 6 11-12" fill="none" stroke="#fff" strokeWidth="4" />
    </>
  ),
  lock: (
    <>
      <path d="M16 21 v-5 a8 8 0 0 1 16 0 v5" fill="none" strokeWidth="3.5" />
      <rect x="11" y="21" width="26" height="20" rx="5" fill={C.sun} />
      <circle cx="24" cy="30" r="3" fill={INK} />
    </>
  ),
  bulb: (
    <>
      <path d="M24 6 a12 12 0 0 1 7 21.7 c-1.3 1-2 2.3-2 3.8 V33 h-10 v-1.5 c0-1.5-0.7-2.8-2-3.8 A12 12 0 0 1 24 6Z" fill="#fff3b0" />
      <rect x="18.5" y="33" width="11" height="6" rx="2" fill={C.gray} />
      <path d="M21 42 h6" />
      <path d="M20 19 a5 5 0 0 1 4-4" fill="none" stroke={C.sunDark} />
    </>
  ),
  bridge: (
    <>
      <path d="M4 34 C12 38 18 30 24 34 S36 38 44 34 V42 H4Z" fill={C.water} strokeWidth="0" />
      <path d="M6 32 C6 22 14 17 24 17 S42 22 42 32" fill="none" stroke={C.woodDark} strokeWidth="4" />
      <rect x="4" y="15" width="40" height="6" rx="2" fill={C.wood} />
      <line x1="14" y1="21" x2="14" y2="29" /><line x1="24" y1="21" x2="24" y2="27" /><line x1="34" y1="21" x2="34" y2="29" />
    </>
  ),
  crack: (
    <>
      <path d="M4 36 C12 40 18 32 24 36 S36 40 44 36 V43 H4Z" fill={C.water} strokeWidth="0" />
      <rect x="4" y="16" width="40" height="7" rx="2" fill={C.wood} />
      <path d="M6 33 C6 25 13 23 20 23 M28 23 C36 23 42 25 42 33" fill="none" stroke={C.woodDark} strokeWidth="4" />
      <path d="M22 12 l4 6-3 3 4 5-2 4" fill="none" stroke={C.red} strokeWidth="3" />
    </>
  ),
  warning: (
    <>
      <path d="M24 6 L43 39 H5Z" fill={C.sun} />
      <line x1="24" y1="18" x2="24" y2="28" strokeWidth="4" />
      <circle cx="24" cy="33.5" r="2" fill={INK} />
    </>
  ),
  newspaper: (
    <>
      <rect x="7" y="9" width="34" height="30" rx="3" fill={C.paper} />
      <rect x="7" y="9" width="34" height="8" rx="3" fill={C.red} />
      <rect x="12" y="21" width="10" height="9" rx="1.5" fill={C.skyLight} />
      <path d="M26 22 h10 M26 27 h10 M12 34 h24" />
    </>
  ),
  van: (
    <>
      <path d="M5 16 h24 v17 H5Z" fill={C.sun} />
      <path d="M29 20 h7 l6 7 v6 H29Z" fill={C.sun} />
      <path d="M31 22 h4 l4 5 h-8Z" fill={C.skyLight} />
      <circle cx="13" cy="34" r="4.5" fill={INK} /><circle cx="35" cy="34" r="4.5" fill={INK} />
    </>
  ),
  wrench: (
    <path d="M30 6 a10 10 0 0 0-9 13 L8 32 a4 4 0 0 0 6 6 L27 25 a10 10 0 0 0 13-9 l-6 4-5-1-1-5 6-4 a10 10 0 0 0-4-4Z" fill={C.gray} />
  ),
  broom: (
    <>
      <line x1="36" y1="5" x2="23" y2="25" strokeWidth="4" stroke={C.woodDark} />
      <path d="M18 22 l10 6 -6 14 c-5 0-12-4-14-8Z" fill={C.sun} />
      <path d="M14 34 l6 3 M18 29 l6 4" fill="none" />
    </>
  ),
  trash: (
    <>
      <path d="M12 15 h24 l-2 25 H14Z" fill={C.gray} />
      <rect x="9" y="10" width="30" height="5" rx="2" fill={C.gray} />
      <path d="M20 10 v-3 h8 v3 M20 20 v15 M28 20 v15" fill="none" />
    </>
  ),
  bucket: (
    <>
      <path d="M11 18 h26 l-4 22 H15Z" fill={C.sky} />
      <ellipse cx="24" cy="18" rx="13" ry="4" fill={C.skyLight} />
      <path d="M11 18 C11 6 37 6 37 18" fill="none" />
      <path d="M37 26 c3 3 3 6 0 7" fill="none" stroke={C.sky} />
    </>
  ),
  scissors: (
    <>
      <circle cx="13" cy="34" r="6" fill={C.coral} /><circle cx="35" cy="34" r="6" fill={C.coral} />
      <path d="M17 30 L34 8 M31 30 L14 8" fill="none" strokeWidth="3.5" />
      <circle cx="24" cy="20" r="1.8" fill={INK} />
    </>
  ),
  ruler: (
    <>
      <rect x="4" y="17" width="40" height="14" rx="2" fill={C.sun} transform="rotate(-20 24 24)" />
      <g transform="rotate(-20 24 24)">
        {[9, 15, 21, 27, 33, 39].map((x, i) => <line key={x} x1={x} y1="17" x2={x} y2={i % 2 ? 22 : 25} />)}
      </g>
    </>
  ),
  archive: (
    <>
      <rect x="7" y="10" width="34" height="9" rx="2" fill={C.wood} />
      <path d="M10 19 h28 v20 H10Z" fill={C.cream} />
      <rect x="19" y="24" width="10" height="4" rx="2" fill={C.wood} />
    </>
  ),
  book: (
    <>
      <path d="M24 12 C18 8 11 8 6 10 V38 C11 36 18 36 24 40 Z" fill={C.paper} />
      <path d="M24 12 C30 8 37 8 42 10 V38 C37 36 30 36 24 40 Z" fill={C.cream} />
      <path d="M10 17 h9 M10 23 h9 M29 17 h9 M29 23 h9" />
    </>
  ),
  zero: (
    <>
      <rect x="8" y="8" width="32" height="32" rx="8" fill={C.skyLight} />
      <ellipse cx="24" cy="24" rx="7" ry="10" fill="none" strokeWidth="3.5" />
    </>
  ),
  median: (
    <>
      <rect x="6" y="28" width="7" height="12" rx="2" fill={C.leaf} />
      <rect x="15" y="20" width="7" height="20" rx="2" fill={C.leaf} />
      <rect x="24" y="12" width="7" height="28" rx="2" fill={C.sun} />
      <rect x="33" y="22" width="7" height="18" rx="2" fill={C.leaf} />
      <path d="M27.5 5 v5" stroke={C.red} />
    </>
  ),
  mean: (
    <>
      <rect x="6" y="24" width="8" height="16" rx="2" fill={C.leaf} />
      <rect x="17" y="14" width="8" height="26" rx="2" fill={C.leaf} />
      <rect x="28" y="20" width="8" height="20" rx="2" fill={C.leaf} />
      <path d="M4 22 h40" stroke={C.red} strokeDasharray="4 3" />
    </>
  ),
  target: (
    <>
      <circle cx="22" cy="26" r="16" fill={C.paper} />
      <circle cx="22" cy="26" r="10.5" fill={C.coral} />
      <circle cx="22" cy="26" r="5" fill={C.paper} />
      <path d="M22 26 L40 8 M34 8 h6 v6" fill="none" strokeWidth="3" />
    </>
  ),
  flag: (
    <>
      <line x1="12" y1="6" x2="12" y2="43" strokeWidth="3.5" />
      <path d="M12 8 C20 4 26 12 38 8 V26 C26 30 20 22 12 26Z" fill={C.sun} />
    </>
  ),
  magnifier: (
    <>
      <circle cx="20" cy="20" r="12" fill={C.skyLight} />
      <path d="M14 17 a7 7 0 0 1 5-5" fill="none" stroke="#fff" strokeWidth="3" />
      <line x1="29" y1="29" x2="41" y2="41" strokeWidth="6" stroke={C.woodDark} />
    </>
  ),
  binoculars: (
    <>
      <rect x="6" y="14" width="15" height="24" rx="7" fill={C.berry} />
      <rect x="27" y="14" width="15" height="24" rx="7" fill={C.berry} />
      <rect x="19" y="18" width="10" height="8" rx="2" fill={C.gray} />
      <circle cx="13.5" cy="30" r="4.5" fill={C.skyLight} /><circle cx="34.5" cy="30" r="4.5" fill={C.skyLight} />
    </>
  ),
  hole: (
    <>
      <rect x="6" y="8" width="36" height="30" rx="4" fill={C.paper} />
      <path d="M6 18 h36 M6 28 h36 M18 8 v30 M30 8 v30" fill="none" strokeWidth="1.5" />
      <rect x="19.5" y="19.5" width="9" height="7" fill={C.red} strokeWidth="0" opacity="0.8" />
    </>
  ),
  copy: (
    <>
      <rect x="6" y="6" width="24" height="28" rx="4" fill={C.cream} />
      <rect x="18" y="14" width="24" height="28" rx="4" fill={C.sun} />
      <path d="M23 23 h14 M23 29 h14 M23 35 h9" />
    </>
  ),
  outlier: (
    <>
      <path d="M6 6 V42 H44" fill="none" />
      {[[11, 34], [15, 30], [18, 35], [21, 28], [24, 31], [14, 37]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.5" fill={C.leaf} />)}
      <circle cx="38" cy="11" r="4.5" fill={C.coral} />
    </>
  ),
  split: (
    <>
      <rect x="4" y="16" width="30" height="16" rx="4" fill="#7b5cd6" />
      <rect x="36" y="16" width="9" height="16" rx="3" fill="#d9822b" />
      <path d="M35 10 v28" strokeDasharray="3 3" />
    </>
  ),
  tag: (
    <>
      <path d="M6 22 V8 h14 l22 22-14 14Z" fill={C.sun} />
      <circle cx="14" cy="16" r="3" fill={C.paper} />
    </>
  ),
  scale: (
    <>
      <line x1="24" y1="8" x2="24" y2="38" strokeWidth="3.5" />
      <path d="M8 14 h32" strokeWidth="3" />
      <path d="M8 14 l-5 12 h10Z M40 14 l-5 12 h10Z" fill={C.sun} />
      <path d="M16 40 h16" strokeWidth="4" />
    </>
  ),
  tree: (
    <>
      <rect x="21" y="28" width="6" height="14" rx="2" fill={C.woodDark} />
      <circle cx="16" cy="24" r="9" fill={C.leafDark} />
      <circle cx="32" cy="24" r="9" fill={C.leafDark} />
      <circle cx="24" cy="16" r="11" fill={C.leaf} />
      <circle cx="20" cy="12" r="3" fill="#b8e59a" strokeWidth="0" />
    </>
  ),
  forest: <>{pine(12, 26, 0.85)}{pine(36, 26, 0.85)}{pine(24, 22, 1.1)}</>,
  hourglass: (
    <>
      <path d="M12 6 h24 M12 42 h24" strokeWidth="3.5" />
      <path d="M14 6 C14 18 34 18 34 6 M14 42 C14 30 34 30 34 42" fill={C.cream} />
      <path d="M14 6 C14 17 22 20 24 24 C26 20 34 17 34 6 M14 42 C14 31 22 28 24 24 C26 28 34 31 34 42" fill="none" />
      <path d="M17 40 C19 34 29 34 31 40Z" fill={C.sun} />
    </>
  ),
  car: (
    <>
      <path d="M6 28 l5-10 h22 l7 10 v8 H6Z" fill={C.coral} />
      <path d="M14 20 h8 v7 h-11Z M25 20 h7 l4 7 h-11Z" fill={C.skyLight} />
      <circle cx="14" cy="36" r="4.5" fill={INK} /><circle cx="34" cy="36" r="4.5" fill={INK} />
    </>
  ),
  drop: <path d="M24 6 C31 17 37 23 37 30 a13 13 0 0 1-26 0 c0-7 6-13 13-24Z" fill={C.sky} />,
  rain: (
    <>
      <path d="M13 28 a8 8 0 0 1 1-16 a11 11 0 0 1 21 3 a7 7 0 0 1 0 13Z" fill={C.paper} />
      <path d="M16 34 l-2 5 M25 34 l-2 5 M34 34 l-2 5" stroke={C.sky} strokeWidth="3" />
    </>
  ),
  clipboard: (
    <>
      <rect x="10" y="9" width="28" height="33" rx="4" fill={C.wood} />
      <rect x="14" y="14" width="20" height="24" rx="2" fill={C.paper} />
      <rect x="18" y="6" width="12" height="6" rx="2" fill={C.gray} />
      <path d="M18 22 l2 2 4-4 M18 31 l2 2 4-4 M27 22 h4 M27 31 h4" fill="none" />
    </>
  ),
  rocket: (
    <>
      <path d="M24 4 C32 10 34 20 32 32 H16 C14 20 16 10 24 4Z" fill={C.paper} />
      <circle cx="24" cy="18" r="4" fill={C.sky} />
      <path d="M16 26 l-6 8 h7 M32 26 l6 8 h-7" fill={C.pink} />
      <path d="M19 32 c0 6 5 9 5 11 c0-2 5-5 5-11Z" fill={C.coral} />
    </>
  ),
  lighthouse: (
    <>
      <path d="M18 42 L20 16 h8 l2 26Z" fill={C.paper} />
      <path d="M19.3 26 h9.4 l0.6 7 h-10.6Z" fill={C.red} strokeWidth="0" />
      <rect x="17" y="10" width="14" height="7" rx="1" fill="#fff3b0" />
      <path d="M16 10 l8-6 8 6Z" fill={C.red} />
      <path d="M31 13 l12-5 M31 14 l12 3" stroke={C.sunDark} />
    </>
  ),
  chartUp: (
    <>
      <rect x="5" y="7" width="38" height="34" rx="5" fill={C.paper} />
      <path d="M10 33 L19 24 L26 29 L38 14" fill="none" stroke={C.leafDark} strokeWidth="3.5" />
      <path d="M32 14 h6 v6" fill="none" stroke={C.leafDark} strokeWidth="3" />
    </>
  ),
  bars: (
    <>
      <rect x="7" y="26" width="8" height="15" rx="2" fill={C.leaf} />
      <rect x="20" y="16" width="8" height="25" rx="2" fill={C.sun} />
      <rect x="33" y="8" width="8" height="33" rx="2" fill={C.sky} />
    </>
  ),
  box: (
    <>
      <path d="M24 6 L42 15 V34 L24 43 L6 34 V15Z" fill={C.wood} />
      <path d="M6 15 L24 24 L42 15 M24 24 V43" fill="none" />
      <path d="M15 10.5 L33 19.5 V26" fill="none" stroke={C.sun} strokeWidth="3" />
    </>
  ),
  gear: (
    <>
      <path d="M21 5 h6 l1 5 4 2 4-3 4 4-3 4 2 4 5 1 v6 l-5 1-2 4 3 4-4 4-4-3-4 2-1 5 h-6 l-1-5-4-2-4 3-4-4 3-4-2-4-5-1 v-6 l5-1 2-4-3-4 4-4 4 3 4-2Z" fill={C.gray} />
      <circle cx="24" cy="24" r="6" fill={C.paper} />
    </>
  ),
  code: (
    <>
      <rect x="4" y="8" width="40" height="32" rx="6" fill={C.dark} />
      <path d="M15 18 l-5 6 5 6 M33 18 l5 6-5 6 M27 15 l-6 18" fill="none" stroke={C.sun} strokeWidth="3" />
    </>
  ),
  sliders: (
    <>
      <path d="M8 14 h32 M8 24 h32 M8 34 h32" fill="none" stroke={C.gray} strokeWidth="3.5" />
      <circle cx="16" cy="14" r="4.5" fill={C.berry} /><circle cx="32" cy="24" r="4.5" fill={C.berry} /><circle cx="22" cy="34" r="4.5" fill={C.berry} />
    </>
  ),
  brain: (
    <>
      <path d="M22 8 C14 6 8 12 9 18 C4 21 5 29 10 31 C10 37 16 41 22 39Z" fill={C.pink} />
      <path d="M26 8 C34 6 40 12 39 18 C44 21 43 29 38 31 C38 37 32 41 26 39Z" fill={C.pink} />
      <path d="M15 17 c3 0 5 2 5 5 M33 17 c-3 0-5 2-5 5 M14 29 c3-1 5 0 6 3 M34 29 c-3-1-5 0-6 3" fill="none" />
    </>
  ),
  zzz: <path d="M10 14 h10 l-10 12 h10 M24 24 h8 l-8 9 h8 M34 32 h6 l-6 7 h6" fill="none" stroke={C.sky} strokeWidth="3" />,
  grid: (
    <>
      <rect x="6" y="6" width="17" height="17" rx="3" fill="#dff3d6" />
      <rect x="25" y="6" width="17" height="17" rx="3" fill="#ffd9d3" />
      <rect x="6" y="25" width="17" height="17" rx="3" fill="#fff1cf" />
      <rect x="25" y="25" width="17" height="17" rx="3" fill="#e6f1fb" />
    </>
  ),
  shield: (
    <>
      <path d="M24 5 L40 11 V23 C40 33 33 40 24 43 C15 40 8 33 8 23 V11Z" fill={C.skyLight} />
      <path d="M16 24 l6 6 10-11" fill="none" stroke={C.leafDark} strokeWidth="3.5" />
    </>
  ),
  table: (
    <>
      <rect x="6" y="8" width="36" height="32" rx="4" fill={C.paper} />
      <rect x="6" y="8" width="36" height="8" rx="4" fill={C.sky} />
      <path d="M6 24 h36 M6 32 h36 M18 16 v24 M30 16 v24" fill="none" strokeWidth="1.8" />
    </>
  ),
  overfit: (
    <>
      <path d="M6 42 H44 M6 6 V42" fill="none" />
      <path d="M9 34 C12 18 14 38 18 26 S23 10 26 28 S32 38 34 20 S40 12 42 16" fill="none" stroke={C.coral} strokeWidth="3" />
      {[[12, 30], [18, 26], [24, 20], [30, 30], [36, 18], [41, 15]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.5" fill={C.berry} />)}
    </>
  ),
  underfit: (
    <>
      <path d="M6 42 H44 M6 6 V42" fill="none" />
      <path d="M8 25 H43" stroke={C.sky} strokeWidth="3" />
      {[[12, 36], [18, 30], [24, 22], [30, 16], [36, 12], [41, 9]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.5" fill={C.berry} />)}
    </>
  ),
  globe: (
    <>
      <circle cx="24" cy="24" r="17" fill={C.sky} />
      <path d="M13 14 c5 2 5 7 10 7 s3 7 8 7 M30 9 c-2 4 2 6 6 6 M12 30 c4-1 6 2 6 6" fill="none" stroke={C.leafDark} strokeWidth="3" />
    </>
  ),
  arrowRight: <path d="M8 24 h28 M26 13 l11 11-11 11" fill="none" strokeWidth="4" />,
  close: <path d="M13 13 L35 35 M35 13 L13 35" fill="none" strokeWidth="4.5" />,
  play: <path d="M15 9 L39 24 L15 39Z" fill={C.leaf} />,
  seed: (
    <>
      <path d="M24 42 V24" strokeWidth="3.5" stroke={C.leafDark} />
      <path d="M24 26 C14 26 9 20 9 12 C18 12 24 17 24 26Z" fill={C.leaf} />
      <path d="M24 22 C32 22 38 17 38 9 C30 9 24 13 24 22Z" fill={C.leaf} />
    </>
  ),
  dna: (
    <>
      <path d="M14 6 C14 18 34 20 34 42 M34 6 C34 18 14 20 14 42" fill="none" stroke={C.berry} strokeWidth="3.5" />
      <path d="M17 12 h14 M20 24 h8 M17 36 h14" />
    </>
  ),
  city: (
    <>
      <rect x="6" y="20" width="12" height="22" fill={C.sky} />
      <rect x="18" y="10" width="14" height="32" fill={C.coral} />
      <rect x="32" y="24" width="10" height="18" fill={C.leaf} />
      <path d="M21 16 h3 M26 16 h3 M21 23 h3 M26 23 h3 M9 26 h3 M9 32 h3" strokeWidth="2" />
    </>
  ),
  heart: <path d="M24 40 C8 30 5 21 9 14 c4-6 11-5 15 1 c4-6 11-7 15-1 c4 7 1 16-15 26Z" fill={C.pink} />,
  cup: (
    <>
      <path d="M9 18 h24 v10 a12 12 0 0 1-24 0Z" fill={C.paper} />
      <path d="M33 21 h3 a5 5 0 0 1 0 10 h-4" fill="none" />
      <path d="M16 6 c-2 3 2 5 0 8 M23 6 c-2 3 2 5 0 8" fill="none" stroke={C.gray} />
    </>
  ),
  question: (
    <>
      <circle cx="24" cy="24" r="17" fill={C.cream} />
      <path d="M18 19 a6 6 0 1 1 8 5.6 c-1.5.6-2 1.6-2 3.4" fill="none" strokeWidth="3.5" />
      <circle cx="24" cy="34" r="2.2" fill={INK} />
    </>
  ),
  eye: (
    <>
      <path d="M4 24 C12 12 36 12 44 24 C36 36 12 36 4 24Z" fill={C.paper} />
      <circle cx="24" cy="24" r="7" fill={C.sky} /><circle cx="24" cy="24" r="3" fill={INK} />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 24 C12 12 36 12 44 24 C36 36 12 36 4 24Z" fill={C.paper} />
      <path d="M8 40 L40 8" strokeWidth="3.5" />
    </>
  ),
  door: (
    <>
      <rect x="12" y="6" width="24" height="36" rx="3" fill={C.wood} />
      <circle cx="30" cy="25" r="2" fill={C.sun} />
      <path d="M6 42 h36" strokeWidth="3.5" />
    </>
  ),
  keyboard: (
    <>
      <rect x="4" y="13" width="40" height="22" rx="4" fill={C.paper} />
      <path d="M10 20 h2 M16 20 h2 M22 20 h2 M28 20 h2 M34 20 h2 M14 28 h20" strokeWidth="3" />
    </>
  ),
  mouse: (
    <>
      <rect x="13" y="6" width="22" height="36" rx="11" fill={C.paper} />
      <path d="M24 6 v12 M13 18 h22" fill="none" />
    </>
  ),
  package: (
    <>
      <rect x="7" y="14" width="34" height="26" rx="3" fill={C.wood} />
      <rect x="5" y="9" width="38" height="8" rx="2" fill={C.woodDark} />
      <path d="M24 9 v31" stroke={C.sun} strokeWidth="4" />
    </>
  ),
  dotGreen: <circle cx="24" cy="24" r="12" fill={C.leaf} />,
  down: <path d="M24 8 v28 M13 26 l11 11 11-11" fill="none" strokeWidth="4" />,
  refresh: <path d="M38 22 a14 14 0 1 1-4-10 M36 5 v8 h-8" fill="none" strokeWidth="3.5" />,
  undo: <path d="M16 12 L7 21 l9 9 M7 21 h21 a11 11 0 0 1 0 22 h-6" fill="none" strokeWidth="3.5" />,
  worker: (
    <>
      <path d="M10 26 a14 14 0 0 1 28 0Z" fill={C.sun} />
      <rect x="6" y="25" width="36" height="6" rx="3" fill={C.sunDark} />
    </>
  ),
  news: (
    <>
      <path d="M8 8 h32 v32 H8Z" fill={C.paper} />
      <path d="M13 15 h22 M13 22 h22 M13 29 h14" />
    </>
  ),
} satisfies Record<string, ReactElement>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 24, className = '', title }: { name: IconName; size?: number; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`inline-block shrink-0 align-middle ${className}`}
      stroke={INK}
      strokeWidth={2.5}
      strokeLinejoin="round"
      strokeLinecap="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {ICONS[name]}
    </svg>
  );
}
