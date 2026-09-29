import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PORTRAITS, type HostId } from '../../content/buildings';
import { useT } from '../../i18n';
import { BuildingArt } from '../art/BuildingArt';
import { Portrait } from '../art/Portrait';

/** Wraps a portrait: hovering (or focusing) it shows who that person is. Rendered in a portal so panels never clip it. */
export function PersonCard({ who, children }: { who: HostId; children: ReactNode }) {
  const t = useT();
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const W = 300, H = 230;
    const x = Math.min(Math.max(8, r.left), window.innerWidth - W - 8);
    const below = r.bottom + 8 + H < window.innerHeight;
    setPos({ x, y: below ? r.bottom + 8 : Math.max(8, r.top - H - 8) });
  };
  const hide = () => setPos(null);

  const name = who === 'otto' ? t.buildings.otto.name : t.buildings[who].host;
  const role = who === 'otto' ? t.buildings.otto.role : t.buildings[who].role;
  const info = t.people[who];

  return (
    <span ref={ref} className="inline-flex shrink-0 cursor-help rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky" tabIndex={0}
      onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} aria-label={`${name}: ${role}`}>
      {children}
      {pos &&
        createPortal(
          <div role="tooltip" className="fixed z-[90] w-[300px] card p-4 animate-pop pointer-events-none" style={{ left: pos.x, top: pos.y }}>
            <div className="flex items-center gap-3">
              <Portrait spec={PORTRAITS[who]} size={56} />
              <div>
                <div className="font-display text-lg font-semibold leading-tight">{name}</div>
                <div className="text-xs text-bark-soft">{role}</div>
              </div>
            </div>
            <p className="text-sm leading-snug mt-3">{info.bio}</p>
            <div className="mt-3 pt-3 border-t border-bark/10 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <span className="text-bark-soft">{t.personCard.teaches}</span>
              <span className="font-bold">{info.teaches}</span>
              <span className="text-bark-soft">{t.personCard.where}</span>
              <span className="font-bold flex items-center gap-1">
                {who === 'otto' ? t.personCard.visiting : <><BuildingArt id={who} size={18} /> {t.buildings[who].name}</>}
              </span>
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
