import { EventBus } from '../../bridge/EventBus';
import { CONCEPT_ICON } from '../../content/concepts';
import { BRIDGE_MISSION, stepIndex } from '../../content/missions/bridgeMission';
import { WORLDS } from '../../content/worlds';
import { useT } from '../../i18n';
import { pct } from '../../ml/metrics';
import { useGame } from '../../store/gameStore';
import { Icon } from '../art/Icon';
import { Button } from '../common/Button';
import { Dialogue } from '../common/Dialogue';
import { describeModel } from '../common/labels';
import { goTo } from '../common/nav';
import { Speech } from '../common/Speech';
import { useProduction } from '../common/useProduction';
import { useTrainResult } from '../common/useTrain';

export function CityHallPanel() {
  const t = useT();
  const { mission, completeStep, gainCoins, gainXp, repairBridges, bridgesRepaired, concepts } = useGame();
  const step = mission.step;

  if (step === 'talk_mayor') {
    return (
      <div className="max-w-3xl mx-auto pt-4 space-y-6">
        <MissionPoster />
        <Dialogue
          lines={t.cityhall.intro.map((text) => ({ who: 'cityhall' as const, text }))}
          doneLabel={t.cityhall.accept}
          onDone={() => { completeStep('talk_mayor'); goTo('datacenter'); }}
        />
      </div>
    );
  }

  if (step === 'report')
    return (
      <Report
        onClaim={() => {
          gainCoins(BRIDGE_MISSION.reward.coins);
          gainXp(BRIDGE_MISSION.reward.xp, 'mission');
          repairBridges();
          EventBus.emit('town:bridgesRepaired', { repaired: true, animate: true });
          completeStep('report');
        }}
      />
    );

  return (
    <div className="grid md:grid-cols-[1fr_1.2fr] gap-6">
      <div className="space-y-4">
        <MissionPoster />
        {step === 'done' ? (
          <Speech who="cityhall" tone="good">{t.cityhall.done(bridgesRepaired)}</Speech>
        ) : (
          <>
            <Speech who="cityhall">{t.cityhall.status[step]}</Speech>
            <Button onClick={() => goTo(BRIDGE_MISSION.steps[stepIndex(step)].building)}>{t.common.goThere} →</Button>
          </>
        )}
        <Checklist />
      </div>
      <div className="card p-5">
        <div className="font-display text-xl font-semibold mb-3 flex items-center gap-2"><Icon name="map" size={26} /> {t.mission.worldsMap}</div>
        <div className="space-y-2">
          {WORLDS.map((w) => {
            const got = w.concepts.filter((c) => concepts.includes(c)).length;
            return (
              <div key={w.id} className={`rounded-2xl px-4 py-2.5 flex items-center gap-3 ${w.available ? 'bg-white border-2 border-bark/10' : 'bg-bark/5 opacity-60'}`}>
                <Icon name={w.available ? w.icon : 'lock'} size={30} />
                <div className="flex-1">
                  <div className="font-display font-semibold">{t.mission.world(w.id)} · {t.worlds[w.id].name}</div>
                  <div className="text-xs text-bark-soft">{t.worlds[w.id].topics.join(' · ')}</div>
                </div>
                {w.available ? (
                  <span className="text-sm font-bold flex items-center gap-1">{got}/{w.concepts.length} <Icon name="sparkle" size={14} /></span>
                ) : (
                  <span className="text-xs font-bold">{t.mission.soon}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MissionPoster() {
  const t = useT();
  return (
    <div className="wood rounded-3xl p-5 relative rotate-[-0.6deg] flex gap-4 items-center">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-danger border-2 border-white shadow" />
      <Icon name="crack" size={72} />
      <div>
        <div className="text-xs font-bold tracking-widest text-bark-soft">{t.mission.officialRequest}</div>
        <div className="font-display text-3xl font-semibold mt-1">{t.mission.title}</div>
        <p className="mt-1">{t.mission.summary}</p>
        <div className="mt-2 text-sm font-bold flex items-center gap-1">
          <Icon name="coin" size={18} /> {t.mission.reward(BRIDGE_MISSION.reward.coins, BRIDGE_MISSION.reward.xp)}
        </div>
      </div>
    </div>
  );
}

function Checklist() {
  const t = useT();
  const step = useGame((s) => s.mission.step);
  const idx = stepIndex(step);
  return (
    <div className="card p-4">
      <div className="font-display font-semibold mb-2 flex items-center gap-2"><Icon name="clipboard" size={22} /> {t.mission.stepsTitle}</div>
      <ol className="space-y-1">
        {BRIDGE_MISSION.steps.slice(0, -1).map((s, i) => (
          <li key={s.id} className={`flex gap-2 items-center text-sm ${i < idx ? 'text-leaf-dark line-through' : i === idx ? 'font-bold' : 'text-bark-soft/70'}`}>
            <Icon name={i < idx ? 'check' : i === idx ? 'pin' : 'lock'} size={18} className={i > idx ? 'opacity-40' : ''} />
            {i <= idx ? t.mission.steps[s.id] : '???'}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Report({ onClaim }: { onClaim: () => void }) {
  const t = useT();
  const m = useGame((s) => s.mission);
  const concepts = useGame((s) => s.concepts);
  const final = useTrainResult(m.finalModel);
  const deep = useProduction(m.deepModel);
  const prod = useProduction(m.finalModel, m.finalThreshold ?? 0.5);
  const dash = '…';
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Speech who="cityhall" tone="good">{t.cityhall.reportIntro}</Speech>
      <div className="card p-5">
        <div className="font-display text-2xl font-semibold mb-3 flex items-center gap-2"><Icon name="newspaper" size={30} /> {t.cityhall.reportTitle}</div>
        <div className="grid sm:grid-cols-2 gap-3 text-[15px]">
          <div className="bg-danger/10 rounded-2xl p-3">
            <div className="font-bold flex items-center gap-1.5"><Icon name="overfit" size={22} /> {t.cityhall.ottoModel}</div>
            <div>{t.cityhall.ottoLine(deep.metrics ? pct(deep.metrics.accuracy) : dash)}</div>
            <div className="text-xs text-bark-soft">{t.cityhall.ottoNote}</div>
          </div>
          <div className="bg-leaf/10 rounded-2xl p-3">
            <div className="font-bold flex items-center gap-1.5"><Icon name="star" size={22} /> {t.cityhall.yourModel}</div>
            <div className="text-sm">{m.finalModel && describeModel(t, m.finalModel.algorithm, m.finalModel.params)}</div>
            <div>{t.cityhall.yourLine(prod.metrics ? pct(prod.metrics.accuracy) : dash, prod.metrics ? pct(prod.metrics.recall) : dash)}</div>
            <div className="text-xs text-bark-soft">{t.cityhall.yourNote(final ? pct(final.trainMetrics.accuracy) : dash)}</div>
          </div>
        </div>
        {prod.metrics && (
          <p className="mt-3 flex items-center gap-2"><Icon name="wrench" size={22} /> {t.cityhall.found(prod.metrics.tp + prod.metrics.fn, prod.metrics.tp)}</p>
        )}
        <div className="mt-3 text-sm text-bark-soft flex flex-wrap items-center gap-1">
          {t.cityhall.concepts(concepts.length)} · {concepts.map((c) => <Icon key={c} name={CONCEPT_ICON[c]} size={18} title={t.concepts[c].name} />)}
        </div>
      </div>
      <div className="text-center">
        <Button size="lg" variant="leaf" onClick={onClaim} className="inline-flex items-center gap-2">
          <Icon name="package" size={24} /> {t.cityhall.claim}
        </Button>
      </div>
    </div>
  );
}
