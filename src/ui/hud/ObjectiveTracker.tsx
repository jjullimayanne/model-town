import { EventBus } from '../../bridge/EventBus';
import { BRIDGE_MISSION, stepDef, stepIndex } from '../../content/missions/bridgeMission';
import { useT } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { Icon } from '../art/Icon';
import { RAG_STEPS, ragIndex } from '../../content/missions/ragMission';
import { useRagStatus } from '../phone/ragStatus';

function RagTracker() {
  const t = useT();
  const { step, target, done } = useRagStatus();
  const open = useGame((s) => s.togglePhone);
  const coursesDone = useGame((s) => Object.values(s.courses).filter((c) => c === 'done').length);
  const idx = ragIndex(step);
  const finished = step === 'done' && done;
  const label = step === 'ring' ? RAG_STEPS[idx].objective
    : finished && !coursesDone ? 'Novo! Faça um curso no Centro Técnico (no celular)'
    : finished ? `Missões concluídas! ${coursesDone}/9 habilidades no Centro Técnico`
    : target ? `Vá ao ${t.buildings[target].name}: ${RAG_STEPS[idx].objective.toLowerCase()}`
    : done ? 'Mande mensagem para a Prefeita testar' : step === 'done' ? RAG_STEPS[idx].objective : 'Converse com a Prefeita no celular';
  return (
    <div className="absolute left-2 right-2 top-16 p-2.5 md:left-auto md:right-3 md:top-24 md:w-80 md:p-4 card chunky animate-pop" key={step}>
      <div className="hidden md:flex items-center gap-2">
        <Icon name="phone" size={36} />
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-bark-soft">Missão · Mundo 6</div>
          <div className="font-display font-semibold text-lg leading-tight">Chatbot da Cidade</div>
        </div>
      </div>
      <button className="md:mt-3 w-full text-left bg-sun/10 hover:bg-sun/20 active:bg-sun/20 rounded-xl px-3 py-2 flex gap-2 items-start transition" onClick={() => (target ? EventBus.emit('player:walkTo', { id: target }) : finished ? open(true, 'tech') : step !== 'done' && open(true))}>
        <Icon name={finished ? 'gear' : step === 'done' ? 'trophy' : target ? 'pin' : 'phone'} size={22} />
        <span className="text-sm md:text-[15px] font-bold leading-snug">{label}</span>
      </button>
      <div className="flex gap-1 mt-2 md:mt-3">
        {RAG_STEPS.slice(0, -1).map((s, i) => (
          <div key={s.id} className={`h-2 flex-1 rounded-full ${i < idx ? 'bg-leaf' : i === idx ? 'bg-sun animate-pulse' : 'bg-bark/10'}`} />
        ))}
      </div>
      {finished && coursesDone > 0 && (
        <button onClick={() => useGame.getState().toggleFeedback(true)} className="mt-3 w-full text-sm font-bold rounded-xl border border-bark/15 py-1.5 hover:bg-cream">{t.feedback.open}</button>
      )}
    </div>
  );
}

export function ObjectiveTracker() {
  const t = useT();
  const step = useGame((s) => s.mission.step);
  const hintOpen = useGame((s) => s.showHint);
  const rag = useGame((s) => s.activeMission === 'rag');
  const def = stepDef(step);
  const idx = stepIndex(step);
  const total = BRIDGE_MISSION.steps.length - 1;
  if (hintOpen) return null;
  if (rag) return <RagTracker />;
  return (
    <div className="absolute left-2 right-2 top-16 p-2.5 md:left-auto md:right-3 md:top-24 md:w-80 md:p-4 card chunky animate-pop" key={step}>
      <div className="hidden md:flex items-center gap-2">
        <Icon name="bridge" size={36} />
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-bark-soft">{t.hud.missionWorld}</div>
          <div className="font-display font-semibold text-lg leading-tight">{t.mission.title}</div>
        </div>
      </div>
      <button
        className="md:mt-3 w-full text-left bg-sun/10 hover:bg-sun/20 active:bg-sun/20 rounded-xl px-3 py-2 flex gap-2 items-start transition"
        onClick={() => step !== 'done' && EventBus.emit('player:walkTo', { id: def.building })}
      >
        <Icon name={step === 'done' ? 'trophy' : 'pin'} size={22} />
        <span className="text-sm md:text-[15px] font-bold leading-snug">{t.mission.steps[step]}</span>
      </button>
      <div className="flex gap-1 mt-2 md:mt-3">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${i < idx ? 'bg-leaf' : i === idx ? 'bg-sun animate-pulse' : 'bg-bark/10'}`} />
        ))}
      </div>
      {step !== 'done' && <div className="text-[11px] text-bark-soft mt-2 hidden md:block">{t.hud.clickObjective}</div>}
    </div>
  );
}
