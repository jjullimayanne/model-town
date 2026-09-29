import { useEffect, type ComponentType } from 'react';
import { BUILDING_BY_ID, PORTRAITS, type BuildingId } from '../content/buildings';
import { stepDef } from '../content/missions/bridgeMission';
import { useT } from '../i18n';
import { useGame } from '../store/gameStore';
import { BuildingArt } from './art/BuildingArt';
import { Icon } from './art/Icon';
import { Portrait } from './art/Portrait';
import { Button } from './common/Button';
import { PersonCard } from './common/PersonCard';
import { goTo } from './common/nav';
import { CityHallPanel } from './buildings/CityHallPanel';
import { DataCenterPanel } from './buildings/DataCenterPanel';
import { CleaningLabPanel } from './buildings/CleaningLabPanel';
import { MLLabPanel } from './buildings/MLLabPanel';
import { EvaluationPanel } from './buildings/EvaluationPanel';
import { DeployPanel } from './buildings/DeployPanel';
import { MonitoringPanel } from './buildings/MonitoringPanel';

const CONTENT: Record<BuildingId, ComponentType> = {
  cityhall: CityHallPanel,
  datacenter: DataCenterPanel,
  cleaning: CleaningLabPanel,
  mllab: MLLabPanel,
  evaluation: EvaluationPanel,
  deploy: DeployPanel,
  monitoring: MonitoringPanel,
};

/** When the current quest step happens elsewhere, say so loudly instead of leaving the player stuck. */
function NextStepCard({ here }: { here: BuildingId }) {
  const t = useT();
  const step = useGame((s) => s.mission.step);
  if (step === 'done') return null;
  const target = stepDef(step).building;
  if (target === here) return null;
  return (
    <div className="mb-4 rounded-2xl bg-white border border-bark/10 border-l-4 border-l-sun px-4 py-3 flex flex-wrap items-center gap-3 animate-pop">
      <BuildingArt id={target} size={52} />
      <div className="flex-1 min-w-[200px]">
        <div className="text-[11px] font-bold uppercase tracking-wider text-sun-dark">{t.common.nextStep}</div>
        <div className="text-sm text-bark-soft">{t.common.nothingHere}</div>
        <div className="font-display text-lg font-semibold leading-tight">{t.mission.steps[step]}</div>
      </div>
      <Button variant="sun" onClick={() => goTo(target)}>{t.common.takeMeThere} →</Button>
    </div>
  );
}

export function BuildingPanel() {
  const t = useT();
  const id = useGame((s) => s.openBuilding);
  const enter = useGame((s) => s.enter);
  const toggleHint = useGame((s) => s.toggleHint);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && enter(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enter]);

  if (!id) return null;
  const b = BUILDING_BY_ID[id];
  const Content = CONTENT[id];
  const bt = t.buildings[id];
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-bark/25 backdrop-blur-[1.5px] p-4" onMouseDown={(e) => e.target === e.currentTarget && enter(null)}>
      <div className="w-full max-w-6xl h-[90vh] card flex flex-col overflow-hidden animate-pop shadow-2xl" >
        <div className="flex items-center gap-3 px-5 py-2.5 bg-paper border-b border-bark/10 relative">
          <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: b.accent }} />
          <BuildingArt id={id} size={44} />
          <div className="flex-1">
            <div className="font-display text-2xl font-semibold leading-none">{bt.name}</div>
            <div className="text-sm text-bark-soft">{bt.tagline}</div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-cream rounded-full pl-1 pr-3 py-1">
            <PersonCard who={id}><Portrait spec={PORTRAITS[id]} size={34} /></PersonCard>
            <span className="text-sm font-bold">{bt.host}</span>
          </div>
          <button onClick={() => toggleHint()} className="flex items-center gap-1.5 bg-cream text-bark rounded-full px-3 py-1.5 font-display font-semibold hover:bg-white border border-bark/10" title={t.hud.hintTitle}>
            <Icon name="bulb" size={20} /> {t.hud.hint}
          </button>
          <button onClick={() => enter(null)} className="ml-1 w-10 h-10 rounded-full hover:bg-cream flex items-center justify-center" title={t.hud.exit}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-soft p-5">
          <NextStepCard here={id} />
          <Content />
        </div>
      </div>
    </div>
  );
}
