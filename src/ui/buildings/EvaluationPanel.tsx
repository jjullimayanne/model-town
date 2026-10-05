import { useEffect, useMemo, useState } from 'react';
import { stepIndex } from '../../content/missions/bridgeMission';
import { useT } from '../../i18n';
import type { Prediction, TrainRequest } from '../../ml/engine';
import { computeMetrics, pct } from '../../ml/metrics';
import { useGame, useSkill } from '../../store/gameStore';
import { crossValidate, type FoldResult } from '../../ml/engine/localEngine';
import { Bar } from '../common/Metric';
import { Icon } from '../art/Icon';
import { Button } from '../common/Button';
import { CELL_STYLE, ConfusionMatrix, type Cell } from '../common/ConfusionMatrix';
import { COLUMN_ICON, colName, describeModel, fmt, type ColumnKey } from '../common/labels';
import { MetricCard } from '../common/Metric';
import { goTo } from '../common/nav';
import { NotYet } from '../common/NotYet';
import { Speech } from '../common/Speech';
import { useTrainResult } from '../common/useTrain';

const GOAL = { recall: 0.9, precision: 0.5 };
const INSPECTION_COST = 300;

export function EvaluationPanel() {
  const t = useT();
  const ev = t.evaluation;
  const { mission, patchMission, setFlag, discover, completeStep, lang } = useGame();
  const step = mission.step;
  const result = useTrainResult(mission.currentModel);
  const flags = mission.flags;
  const [threshold, setThreshold] = useState(mission.threshold);
  const [cell, setCell] = useState<Cell | null>(null);
  const [reveal, setReveal] = useState(flags.ev_seen ? 1 : 0);
  const evaluating = step === 'evaluate';
  const past = stepIndex(step) > stepIndex('evaluate');
  const crossVal = useSkill('cross_validation');

  useEffect(() => {
    if (!result || reveal >= 1) return;
    const id = setInterval(() => setReveal((r) => Math.min(1, r + 0.04)), 30);
    return () => clearInterval(id);
  }, [result, reveal]);

  const preds = result?.testPredictions ?? [];
  const y = useMemo(() => preds.map((p) => p.actual), [preds]);
  const proba = useMemo(() => preds.map((p) => p.proba), [preds]);
  const m = useMemo(() => computeMetrics(proba, y, threshold), [proba, y, threshold]);
  const base = result?.testMetrics;
  const incident = useMemo(() => preds.filter((p) => p.actual === 1).sort((a, b) => a.proba - b.proba)[0], [preds]);

  if (stepIndex(step) < stepIndex('evaluate') || !mission.currentModel) return <NotYet who="evaluation" text={t.notYet.evaluation} />;
  if (!result || !base) return <div className="p-10 text-center text-2xl animate-pulse">{ev.opening}</div>;

  const phase = !evaluating ? 'sandbox' : !flags.ev_seen ? 'reveal' : !flags.ev_incident ? 'incident' : 'tune';
  const goalMet = m.recall >= GOAL.recall && m.precision >= GOAL.precision;
  const cellPreds = cell ? preds.filter((p) => cellOf(p, threshold) === cell) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="card px-4 py-2 font-display flex items-center gap-2"><Icon name="brain" size={24} /> <b>{describeModel(t, mission.currentModel.algorithm, mission.currentModel.params)}</b></div>
        <div className="card px-3 py-2 text-sm">{ev.testedOn(result.testSize)}</div>
        <ExperimentPicker current={mission.currentModel} onPick={(r) => { patchMission({ currentModel: r }); setCell(null); }} disabled={phase === 'reveal' || phase === 'incident'} />
      </div>

      {phase === 'reveal' && <Speech who="evaluation">{ev.envelope}</Speech>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon="check" label="Accuracy" value={phase === 'reveal' ? base.accuracy * reveal : m.accuracy} hint={ev.accuracyHint} highlight={phase === 'reveal' ? 'focus' : undefined} />
        {(phase !== 'reveal' || reveal >= 1) && (
          <>
            <MetricCard icon="target" label="Precision" value={m.precision} hint={ev.precisionHint} highlight={phase === 'tune' ? (m.precision >= GOAL.precision ? 'good' : 'bad') : undefined} />
            <MetricCard icon="binoculars" label="Recall" value={m.recall} hint={ev.recallHint} highlight={phase === 'tune' ? (m.recall >= GOAL.recall ? 'good' : 'bad') : phase === 'incident' ? 'focus' : undefined} />
            <MetricCard icon="scale" label="F1 Score" value={m.f1} hint={ev.f1Hint} />
          </>
        )}
      </div>

      {reveal >= 1 && (
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4">
          <div className="card p-4">
            <div className="font-display font-semibold mb-2 flex items-center gap-2">
              <Icon name="grid" size={22} /> {ev.matrixTitle} <span className="text-xs font-normal text-bark-soft">{ev.matrixClick}</span>
            </div>
            <ConfusionMatrix c={m} onCell={setCell} active={cell} pulse={phase === 'incident' ? 'fn' : undefined} />
            {cell && (
              <div className="mt-3 max-h-40 overflow-auto scroll-soft text-sm animate-pop">
                <div className="font-bold mb-1 flex items-center gap-1.5"><Icon name={CELL_STYLE[cell].icon} size={18} /> {t.cm[cell].title} ({cellPreds.length})</div>
                {cellPreds.slice(0, 30).map((p) => (
                  <div key={p.rowId} className="flex justify-between border-b border-bark/5 py-0.5">
                    <span>{p.name}</span><span className="text-bark-soft">{ev.risk(pct(p.proba))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {phase === 'reveal' && (
              <>
                <Speech who="evaluation" tone="good">{ev.revealLine(pct(base.accuracy), base.accuracy > 0.8)}</Speech>
                <Button size="lg" variant="leaf" className="w-full" onClick={() => { setFlag('ev_seen'); discover('accuracy', 'confusion_matrix'); }}>
                  {ev.showMayor} →
                </Button>
              </>
            )}

            {phase === 'incident' && incident && (
              <Incident p={incident} threshold={threshold} answer={mission.severityAnswer} onAnswer={(id) => patchMission({ severityAnswer: id })}
                onContinue={() => { setFlag('ev_incident'); discover('false_negative', 'recall'); }} />
            )}

            {(phase === 'tune' || phase === 'sandbox') && (
              <div className="card p-4 space-y-3">
                {phase === 'tune' && <Speech who="cityhall">{ev.rule}</Speech>}
                <div>
                  <div className="flex justify-between font-bold items-center">
                    <span className="flex items-center gap-1.5"><Icon name="sliders" size={20} /> {ev.thresholdLabel}</span>
                    <span className="font-display text-2xl">{pct(threshold)}</span>
                  </div>
                  <input type="range" min={5} max={95} value={Math.round(threshold * 100)} onChange={(e) => setThreshold(Number(e.target.value) / 100)} className="w-full accent-[#e0a020]" />
                  <div className="flex justify-between text-[11px] text-bark-soft"><span>{ev.thrLow}</span><span>{ev.thrHigh}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-sun/10 rounded-xl p-2 flex gap-2">
                    <Icon name="van" size={26} />
                    <div><b>{ev.crews(m.tp + m.fp)}</b><div className="text-xs text-bark-soft">{ev.cost(((m.tp + m.fp) * INSPECTION_COST).toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR'))}</div></div>
                  </div>
                  <div className={`rounded-xl p-2 flex gap-2 ${m.fn ? 'bg-danger/10' : 'bg-leaf/10'}`}>
                    <Icon name={m.fn ? 'crack' : 'shield'} size={26} />
                    <div><b>{ev.missed(m.fn)}</b><div className="text-xs text-bark-soft">{m.fn ? ev.stillMissing : ev.noneMissed}</div></div>
                  </div>
                </div>
                {phase === 'tune' && (
                  <>
                    {threshold !== mission.threshold && m.accuracy < base.accuracy && m.recall > base.recall && (
                      <Speech who="evaluation">{ev.tradeoff(pct(base.accuracy), pct(m.accuracy), m.fn)}</Speech>
                    )}
                    {!goalMet && m.recall >= GOAL.recall && <Speech who="evaluation" tone="warn">{ev.lowPrecision(pct(m.precision))}</Speech>}
                    <Button size="lg" className="w-full" variant="leaf" disabled={!goalMet} onClick={() => {
                      patchMission({ threshold });
                      discover('precision', 'threshold');
                      completeStep('evaluate');
                    }}>
                      {goalMet ? ev.approve : ev.goal}
                    </Button>
                    <button className="text-xs underline text-bark-soft w-full" onClick={() => goTo('mllab')}>{ev.tryOther}</button>
                  </>
                )}
                {phase === 'sandbox' && past && step === 'deep_tree' && (
                  <>
                    <Speech who="otto" tone="warn">{ev.ottoTease(pct(m.recall))}</Speech>
                    <Button className="w-full" variant="coral" onClick={() => goTo('mllab')}>{ev.acceptOtto} →</Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {crossVal && phase === 'sandbox' && <CrossValidationCard req={mission.currentModel} single={base.accuracy} />}
    </div>
  );
}

/** Centro Técnico "Validação cruzada": 5 folds instead of one lucky (or unlucky) split. */
function CrossValidationCard({ req, single }: { req: TrainRequest; single: number }) {
  const [folds, setFolds] = useState<FoldResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const key = JSON.stringify(req);
  useEffect(() => setFolds(null), [key]);
  const run = () => {
    setBusy(true);
    setTimeout(() => { setFolds(crossValidate(req, 5)); setBusy(false); }, 30);
  };
  const mean = folds ? folds.reduce((a, f) => a + f.accuracy, 0) / folds.length : 0;
  const std = folds ? Math.sqrt(folds.reduce((a, f) => a + (f.accuracy - mean) ** 2, 0) / folds.length) : 0;
  const gap = single - mean;
  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="font-display text-lg font-semibold flex items-center gap-2 flex-1"><Icon name="split" size={26} /> Validação cruzada (5 folds)</div>
        <Button variant="berry" disabled={busy} onClick={run}>{busy ? 'Treinando 5 modelos…' : folds ? 'Rodar de novo' : 'Rodar validação cruzada'}</Button>
      </div>
      {!folds && <div className="text-sm text-bark-soft">Os dados limpos são divididos em 5 partes. O modelo treina 5 vezes, cada vez testando numa parte que nunca viu.</div>}
      {folds && (
        <>
          <div className="space-y-1.5">
            {folds.map((f) => <Bar key={f.fold} label={`Fold ${f.fold}`} value={f.accuracy} color="#a99bd6" />)}
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-berry/10 px-3 py-2"><b>Média: {pct(mean)}</b> ± {pct(std, 1)}<div className="text-xs text-bark-soft">accuracy nos 5 folds</div></div>
            <div className="rounded-xl bg-cream px-3 py-2"><b>Teste único: {pct(single)}</b><div className="text-xs text-bark-soft">a divisão que você usou</div></div>
          </div>
          <Speech who="evaluation" tone={Math.abs(gap) > 0.03 ? 'warn' : 'good'}>
            {Math.abs(gap) <= 0.03
              ? 'O teste único bate com a média: dá para confiar nesse resultado.'
              : gap > 0
                ? `Seu teste único deu ${pct(gap)} acima da média. Foi uma divisão de sorte: o desempenho real é mais perto de ${pct(mean)}.`
                : `Seu teste único deu ${pct(-gap)} abaixo da média. Foi uma divisão difícil: o modelo é um pouco melhor que parecia.`}
          </Speech>
        </>
      )}
    </div>
  );
}

const cellOf = (p: Prediction, th: number): Cell => {
  const pred = p.proba >= th ? 1 : 0;
  return pred && p.actual ? 'tp' : pred ? 'fp' : p.actual ? 'fn' : 'tn';
};

function Incident({ p, threshold, answer, onAnswer, onContinue }: { p: Prediction; threshold: number; answer?: string; onAnswer: (id: string) => void; onContinue: () => void }) {
  const t = useT();
  const ev = t.evaluation;
  const chosen = ev.answers.find((a) => a.id === answer);
  const missed = p.proba < threshold;
  return (
    <div className="card p-4 space-y-3 border-danger/50 animate-pop">
      <div className="bg-danger text-white rounded-xl px-3 py-1 inline-flex items-center gap-2 font-display font-semibold">
        <Icon name="newspaper" size={20} /> {ev.newsTag}
      </div>
      <div className="flex gap-3 items-start">
        <Icon name="crack" size={56} />
        <div className="font-display text-xl font-semibold leading-tight">{ev.newsHeadline(p.name, missed)}</div>
      </div>
      <div className="text-sm bg-cream rounded-xl p-2 grid grid-cols-2 gap-x-3 gap-y-0.5">
        {Object.entries(p.values).slice(0, 6).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1"><Icon name={COLUMN_ICON[k as ColumnKey]} size={14} /> {colName(t, k as ColumnKey)}: <b>{fmt(v)}</b></div>
        ))}
        <div className="col-span-2 mt-1">{ev.riskCalc}: <b>{pct(p.proba)}</b> · {ev.reality}: <b>{ev.neededMaintenance}</b></div>
      </div>
      <Speech who="cityhall" tone="bad"><b>{ev.question}</b></Speech>
      {!chosen ? (
        <div className="space-y-2">
          {ev.answers.map((a) => (
            <button key={a.id} onClick={() => onAnswer(a.id)} className="chunky w-full text-left bg-white hover:bg-cream rounded-xl px-3 py-2 font-bold">{a.text}</button>
          ))}
        </div>
      ) : (
        <>
          <Speech who="evaluation" tone={chosen.id === 'grave' ? 'good' : 'warn'}>{chosen.reply} {ev.named}</Speech>
          <Button className="w-full" variant="sun" onClick={onContinue}>{ev.howFix} →</Button>
        </>
      )}
    </div>
  );
}

function ExperimentPicker({ current, onPick, disabled }: { current: TrainRequest; onPick: (r: TrainRequest) => void; disabled?: boolean }) {
  const t = useT();
  const experiments = useGame((s) => s.mission.experiments).filter((e) => !(e.algorithm === 'decision_tree' && (e.params.max_depth ?? 0) >= 10));
  if (experiments.length < 2) return null;
  const key = JSON.stringify(current);
  return (
    <select
      disabled={disabled}
      value={experiments.findIndex((e) => JSON.stringify(e) === key)}
      onChange={(e) => onPick(experiments[Number(e.target.value)])}
      className="card px-3 py-2 text-sm font-bold"
      title={t.evaluation.comparePick}
    >
      {experiments.map((e, i) => <option key={i} value={i}>#{i + 1} · {describeModel(t, e.algorithm, e.params)}</option>)}
    </select>
  );
}
