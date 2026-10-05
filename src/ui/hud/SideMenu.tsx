import { useState } from 'react';
import { EventBus } from '../../bridge/EventBus';
import { BUILDINGS, type BuildingId } from '../../content/buildings';
import { stepDef } from '../../content/missions/bridgeMission';
import { useT } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { BuildingArt } from '../art/BuildingArt';
import { Icon } from '../art/Icon';

function BuildingList({ target, onPick }: { target: BuildingId | null; onPick?: () => void }) {
  const t = useT();
  return (
    <>
      {BUILDINGS.map((b) => (
        <button
          key={b.id}
          onClick={() => { EventBus.emit('player:walkTo', { id: b.id }); onPick?.(); }}
          className={`w-full flex items-center gap-2 px-1.5 py-1 rounded-xl text-left transition hover:bg-cream ${target === b.id ? 'bg-sun/10' : ''}`}
          title={t.hud.walkThere(t.buildings[b.id].tagline)}
        >
          <BuildingArt id={b.id} size={34} />
          <span className="font-display text-[15px] flex-1 leading-tight">{t.buildings[b.id].name}</span>
          {target === b.id && <span className="bg-sun text-ink-dark rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center animate-wiggle">!</span>}
        </button>
      ))}
    </>
  );
}

export function SideMenu() {
  const t = useT();
  const step = useGame((s) => s.mission.step);
  const rag = useGame((s) => s.activeMission === 'rag');
  const target = rag || step === 'done' ? null : stepDef(step).building;
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="absolute left-3 top-24 card p-2.5 w-56 chunky hidden md:block">
        <div className="font-display font-semibold text-sm text-bark-soft px-2 pb-1 flex items-center gap-1"><Icon name="map" size={18} /> {t.hud.buildings}</div>
        <BuildingList target={target} />
      </div>

      {/* Phones/tablets: the list folds into a button so the map stays visible. */}
      <div className="md:hidden absolute left-2 bottom-2 flex flex-col items-start gap-2 pointer-events-none">
        {open && (
          <div className="pointer-events-auto card chunky p-2 w-60 max-h-[60dvh] overflow-y-auto scroll-soft animate-pop">
            <BuildingList target={target} onPick={() => setOpen(false)} />
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`pointer-events-auto card chunky h-12 px-3 flex items-center gap-1.5 font-display font-semibold ${open ? 'bg-cream' : ''}`}
        >
          <Icon name={open ? 'close' : 'map'} size={22} /> {t.hud.buildings}
        </button>
      </div>
    </>
  );
}
