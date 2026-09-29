import { EventBus } from '../../bridge/EventBus';
import { BRIDGE_MISSION, stepDef, stepIndex } from '../../content/missions/bridgeMission';
import { useT } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { Icon } from '../art/Icon';

export function ObjectiveTracker() {
  const t = useT();
  const step = useGame((s) => s.mission.step);
  const hintOpen = useGame((s) => s.showHint);
  const def = stepDef(step);
  const idx = stepIndex(step);
  const total = BRIDGE_MISSION.steps.length - 1;
  if (hintOpen) return null;
  return (
    <div className="absolute right-3 top-24 card p-4 w-80 chunky animate-pop" key={step}>
      <div className="flex items-center gap-2">
        <Icon name="bridge" size={36} />
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-bark-soft">{t.hud.missionWorld}</div>
          <div className="font-display font-semibold text-lg leading-tight">{t.mission.title}</div>
        </div>
      </div>
      <button
        className="mt-3 w-full text-left bg-sun/10 hover:bg-sun/10 rounded-xl px-3 py-2 flex gap-2 items-start transition"
        onClick={() => step !== 'done' && EventBus.emit('player:walkTo', { id: def.building })}
      >
        <Icon name={step === 'done' ? 'trophy' : 'pin'} size={22} />
        <span className="text-[15px] font-bold leading-snug">{t.mission.steps[step]}</span>
      </button>
      <div className="flex gap-1 mt-3">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${i < idx ? 'bg-leaf' : i === idx ? 'bg-sun animate-pulse' : 'bg-bark/10'}`} />
        ))}
      </div>
      {step !== 'done' ? (
        <div className="text-[11px] text-bark-soft mt-2">{t.hud.clickObjective}</div>
      ) : (
        <button onClick={() => useGame.getState().toggleFeedback(true)} className="mt-3 w-full text-sm font-bold rounded-xl border border-bark/15 py-1.5 hover:bg-cream">{t.feedback.open}</button>
      )}
    </div>
  );
}
