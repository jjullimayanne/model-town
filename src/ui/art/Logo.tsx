/**
 * Model Town mark: a map pin (the town) holding a small neural network (its intelligence).
 */
export function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={`shrink-0 ${className}`} role="img" aria-label="Model Town">
      <defs>
        <linearGradient id="mt-pin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b4063" />
          <stop offset="1" stopColor="#262a40" />
        </linearGradient>
        <radialGradient id="mt-core" cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor="#f2c46d" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f2c46d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="60" rx="9" ry="2.2" fill="#000" opacity="0.25" />
      <path d="M32 59 C20 45 12 36.5 12 25.5 A20 20 0 0 1 52 25.5 C52 36.5 44 45 32 59Z" fill="url(#mt-pin)" stroke="#f2c46d" strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="32" cy="27" r="15" fill="url(#mt-core)" />
      <g stroke="#8fb8de" strokeWidth="2" strokeLinecap="round">
        <line x1="22" y1="19" x2="32" y2="29" />
        <line x1="42" y1="19" x2="32" y2="29" />
        <line x1="22" y1="19" x2="42" y2="19" strokeOpacity="0.6" />
        <line x1="32" y1="29" x2="32" y2="39" />
        <line x1="22" y1="19" x2="22" y2="31" strokeOpacity="0.6" />
        <line x1="42" y1="19" x2="42" y2="31" strokeOpacity="0.6" />
      </g>
      <circle cx="22" cy="19" r="3.4" fill="#8fb8de" stroke="#1c1f30" strokeWidth="0.8" />
      <circle cx="42" cy="19" r="3.4" fill="#8fb8de" stroke="#1c1f30" strokeWidth="0.8" />
      <circle cx="32" cy="29" r="4.6" fill="#f2c46d" stroke="#1c1f30" strokeWidth="0.8" />
      <circle cx="32" cy="39" r="3" fill="#d9a0b4" stroke="#1c1f30" strokeWidth="0.8" />
      <circle cx="22" cy="31" r="2.5" fill="#d9a0b4" stroke="#1c1f30" strokeWidth="0.8" />
      <circle cx="42" cy="31" r="2.5" fill="#d9a0b4" stroke="#1c1f30" strokeWidth="0.8" />
    </svg>
  );
}
