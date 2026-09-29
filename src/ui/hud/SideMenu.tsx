import { EventBus } from '../../bridge/EventBus';
import { BUILDINGS } from '../../content/buildings';
import { stepDef } from '../../content/missions/bridgeMission';
import { useT } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { BuildingArt } from '../art/BuildingArt';
import { Icon } from '../art/Icon';

export function SideMenu() {
  const t = useT();
  const step = useGame((s) => s.mission.step);
  const target = step === 'done' ? null : stepDef(step).building;
  return (
    <div className="absolute left-3 top-24 card p-2.5 w-56 chunky">
      <div className="font-display font-semibold text-sm text-bark-soft px-2 pb-1 flex items-center gap-1"><Icon name="map" size={18} /> {t.hud.buildings}</div>
      {BUILDINGS.map((b) => (
        <button
          key={b.id}
          onClick={() => EventBus.emit('player:walkTo', { id: b.id })}
          className={`w-full flex items-center gap-2 px-1.5 py-1 rounded-xl text-left transition hover:bg-cream ${target === b.id ? 'bg-sun/10' : ''}`}
          title={t.hud.walkThere(t.buildings[b.id].tagline)}
        >
          <BuildingArt id={b.id} size={34} />
          <span className="font-display text-[15px] flex-1 leading-tight">{t.buildings[b.id].name}</span>
          {target === b.id && <span className="bg-sun text-bark rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center animate-wiggle">!</span>}
        </button>
      ))}
    </div>
  );
}
