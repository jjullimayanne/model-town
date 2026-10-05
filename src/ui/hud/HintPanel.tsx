import { useEffect, useState } from 'react';
import { EventBus } from '../../bridge/EventBus';
import { getHint } from '../../content/hints';
import { CONCEPT_ICON } from '../../content/concepts';
import { useT } from '../../i18n';
import { useGame, useSkill } from '../../store/gameStore';
import { Icon } from '../art/Icon';
import { Owl } from '../art/BuildingArt';
import { Button } from '../common/Button';
import { goTo } from '../common/nav';
import { RAG_HINTS } from '../../content/missions/ragMission';
import { useRagStatus } from '../phone/ragStatus';

/** Tuca the owl: explains the AI idea behind the current moment and how to move on. */
export function HintPanel() {
  const t = useT();
  const show = useGame((s) => s.showHint);
  const toggle = useGame((s) => s.toggleHint);
  const mission = useGame((s) => s.mission);
  const open = useGame((s) => s.openBuilding);
  const [revealed, setRevealed] = useState(false);
  const [fromBridge, setFromBridge] = useState(false);
  const ragStep = useGame((s) => (s.activeMission === 'rag' ? s.rag.step : null));
  const openPhone = useGame((s) => s.togglePhone);
  const ragTarget = useRagStatus().target;
  const hint = ragStep ? { ...RAG_HINTS[ragStep], building: 'cityhall' as const } : getHint(mission, t);
  const hintKey = `${ragStep ?? mission.step}-${hint.title}`;

  // Centro Técnico "Coruja sábia": the direct hint is already open.
  const wise = useSkill('wise_owl');
  useEffect(() => setRevealed(wise), [hintKey, wise]);
  useEffect(() => EventBus.on('bridge:click', () => { setFromBridge(true); useGame.getState().toggleHint(true); }), []);
  useEffect(() => { if (!show) setFromBridge(false); }, [show]);

  if (!show) return null;
  const concept = hint.concept;
  return (
    <div className="absolute left-2 right-2 top-16 md:left-auto md:right-4 md:top-24 z-[65] md:w-[400px] max-h-[calc(100%-5rem)] md:max-h-[calc(100%-7rem)] overflow-y-auto overscroll-contain scroll-soft card chunky p-4 md:p-5 animate-pop border-sky/60">
      <div className="flex items-start gap-3">
        <Owl size={56} className="animate-float shrink-0" />
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-bark-soft">{t.hud.hint} · {t.hints.guide}</div>
          <div className="font-display text-xl font-semibold leading-tight">{hint.title}</div>
          {concept && (
            <span className="inline-flex items-center gap-1 mt-1 bg-sky/10 rounded-full px-2 py-0.5 text-xs font-bold">
              <Icon name={CONCEPT_ICON[concept]} size={14} /> {t.hints.concept}: {t.concepts[concept].name}
            </span>
          )}
        </div>
        <button onClick={() => toggle(false)} className="w-10 h-10 -mr-1 -mt-1 shrink-0 rounded-full hover:bg-cream flex items-center justify-center" title={t.common.close} aria-label={t.common.close}>
          <Icon name="close" size={16} />
        </button>
      </div>

      {fromBridge && (
        <div className="mt-3 bg-danger/10 rounded-xl px-3 py-2 text-sm flex gap-2">
          <Icon name="crack" size={28} /> <span>{t.hints.bridgeClick}</span>
        </div>
      )}

      <div className="mt-4">
        <div className="text-xs font-bold uppercase tracking-wider text-sky flex items-center gap-1"><Icon name="bulb" size={16} /> {t.hints.understand}</div>
        <p className="mt-1 text-[15px] leading-snug">{hint.explain}</p>
      </div>

      <div className="mt-4">
        <div className="text-xs font-bold uppercase tracking-wider text-leaf-dark flex items-center gap-1"><Icon name="map" size={16} /> {t.hints.howTo}</div>
        <ol className="mt-1 space-y-1.5">
          {hint.steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-[15px] leading-snug">
              <span className="shrink-0 w-6 h-6 rounded-full bg-leaf text-ink-dark text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4">
        {revealed ? (
          <div className="bg-sun/10 rounded-xl px-3 py-2 animate-pop">
            <div className="text-xs font-bold uppercase tracking-wider text-sun-dark flex items-center gap-1"><Icon name="sparkle" size={14} /> {t.hints.direct}</div>
            <p className="text-[15px] leading-snug mt-0.5">{hint.direct}</p>
          </div>
        ) : (
          <button onClick={() => setRevealed(true)} className="w-full chunky rounded-xl bg-white hover:bg-cream px-3 py-2 text-sm font-bold flex items-center justify-center gap-2">
            <Icon name="eye" size={18} /> {t.hints.showDirect}
          </button>
        )}
      </div>

      {ragStep && ragStep !== 'done' && (ragTarget ? (
        <Button className="w-full mt-3" variant="sun" onClick={() => { toggle(false); goTo(ragTarget); }}>
          {t.common.takeMeThere}: {t.buildings[ragTarget].name} →
        </Button>
      ) : (
        <Button className="w-full mt-3" variant="sun" onClick={() => { toggle(false); openPhone(true); }}>
          Abrir o celular →
        </Button>
      ))}
      {!ragStep && open !== hint.building && (
        <Button className="w-full mt-3" variant="sun" onClick={() => { toggle(false); goTo(hint.building); }}>
          {t.common.takeMeThere}: {t.buildings[hint.building].name} →
        </Button>
      )}
    </div>
  );
}
