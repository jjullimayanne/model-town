import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { stepIndex } from '../../content/missions/bridgeMission';
import { useT } from '../../i18n';
import { Icon } from '../art/Icon';
import { engine, type TrainRequest, type TrainResult } from '../../ml/engine';
import { computeMetrics, pct } from '../../ml/metrics';
import { useGame } from '../../store/gameStore';
import { Button } from '../common/Button';
import { useChart } from '../common/chartTheme';
import { describeModel } from '../common/labels';
import { goTo } from '../common/nav';
import { NotYet } from '../common/NotYet';
import { Speech } from '../common/Speech';
import { useProduction } from '../common/useProduction';
import { useTrainResult } from '../common/useTrain';

const DAYS = 8;
const MAX_GAP = 0.15;
const MIN_PROD = 0.72;

export function MonitoringPanel() {
  const t = useT();
  const mo = t.monitoring;
  const { mission, setFlag, patchMission, discover, completeStep } = useGame();
  const step = mission.step;
  const f = mission.flags;

  if (stepIndex(step) < stepIndex('monitor') || !mission.deepModel) {
    return <NotYet who="monitoring" text={t.notYet.monitoring} />;
  }

  const fixed = !!mission.finalModel;
  return (
    <div className="space-y-4">
      {!fixed && (
        <>
          <Speech who="monitoring">{mo.watchIntro}</Speech>
          <ProductionStream req={mission.deepModel} threshold={0.5} autoplay={!f.mon_stream1} onDone={() => setFlag('mon_stream1')} />
          {f.mon_stream1 && !f.mon_investigated && (
            <div className="card p-5 text-center space-y-3 animate-pop">
              <div className="flex justify-center"><Icon name="question" size={64} /></div>
              <div className="font-display text-2xl font-semibold">{mo.why}</div>
              <Button size="lg" variant="sun" onClick={() => setFlag('mon_investigated')} className="inline-flex items-center gap-2"><Icon name="magnifier" size={24} /> {mo.investigate}</Button>
            </div>
          )}
          {f.mon_investigated && (
            <Investigation
              onAccept={(req, threshold) => patchMission({ finalModel: req, finalThreshold: threshold })}
              onUnderfit={() => discover('underfitting')}
              onInsight={() => discover('overfitting', 'generalization')}
            />
          )}
        </>
      )}
      {fixed && (
        <>
          <Speech who="monitoring" tone="good">{mo.fixedIntro}</Speech>
          <ProductionStream req={mission.finalModel!} threshold={mission.finalThreshold ?? 0.5} autoplay={step === 'monitor'} onDone={() => setFlag('mon_stream2')} />
          {step === 'monitor' && f.mon_stream2 && (
            <div className="text-center">
              <Button size="lg" variant="leaf" onClick={() => { discover('monitoring'); completeStep('monitor'); goTo('cityhall'); }}>{mo.tellMayor} →</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Streams production days one by one: accuracy vs. training reference. */
function ProductionStream({ req, threshold, autoplay, onDone }: { req: TrainRequest; threshold: number; autoplay: boolean; onDone: () => void }) {
  const { SERIES, INK, tooltipStyle } = useChart();
  const t = useT();
  const mo = t.monitoring;
  const train = useTrainResult(req);
  const { preds, metrics } = useProduction(req, threshold);
  const [day, setDay] = useState(autoplay ? 0 : DAYS);

  useEffect(() => {
    if (!preds || day >= DAYS) return;
    const t = setTimeout(() => setDay((d) => d + 1), 650);
    return () => clearTimeout(t);
  }, [preds, day]);
  useEffect(() => {
    if (preds && day >= DAYS) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, preds]);

  const perDay = preds ? Math.floor(preds.length / DAYS) : 0;
  const data = useMemo(() => {
    if (!preds) return [];
    return Array.from({ length: day }, (_, d) => {
      const slice = preds.slice(0, (d + 1) * perDay); // cumulative: steadier than a 30-bridge day
      const mm = computeMetrics(slice.map((p) => p.proba), slice.map((p) => p.actual), threshold);
      return { dia: mo.day(d + 1), producao: Math.round(mm.accuracy * 100) };
    });
  }, [preds, day, perDay, threshold, mo]);

  const seen = preds ? preds.slice(0, day * perDay) : [];
  const live = computeMetrics(seen.map((p) => p.proba), seen.map((p) => p.actual), threshold);
  const feed = seen.filter((p) => (p.proba >= threshold) !== (p.actual === 1)).slice(-4).reverse();
  const trainAcc = train ? Math.round(train.trainMetrics.accuracy * 100) : 0;

  return (
    <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
      <div className="card p-4">
        <div className="flex justify-between items-baseline">
          <div className="font-display font-semibold flex items-center gap-2"><Icon name="lighthouse" size={22} /> {mo.chartTitle(describeModel(t, req.algorithm, req.params))}</div>
          <div className="text-sm text-bark-soft">{mo.days(day, DAYS)}</div>
        </div>
        <div className="h-60 mt-2">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 16, right: 84, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={INK.grid} />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: INK.axis }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: INK.axis }} unit="%" />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, mo.production]} />
              <ReferenceLine y={trainAcc} stroke={SERIES.train} strokeDasharray="6 4" strokeWidth={2} label={{ value: mo.trainRef(trainAcc), position: 'right', fill: 'currentColor', fontSize: 12 }} />
              <Line type="monotone" dataKey="producao" stroke={SERIES.test} strokeWidth={2.5} dot={{ r: 4 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 text-xs text-bark-soft mt-1">
          <span><span className="inline-block w-5 border-t-2 border-dashed align-middle mr-1" style={{ borderColor: SERIES.train }} />{mo.legendTrain}</span>
          <span><span className="inline-block w-5 border-t-2 align-middle mr-1" style={{ borderColor: SERIES.test }} />{mo.legendProd}</span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="card p-4 text-center">
          <div className="text-xs font-bold uppercase text-bark-soft">{mo.trainToProd}</div>
          <div className="font-display text-4xl font-semibold">
            {trainAcc}% → <span className={day && live.accuracy < 0.75 ? 'text-danger' : 'text-leaf-dark'}>{day ? pct(live.accuracy) : '…'}</span>
          </div>
          {day > 0 && <div className="text-sm mt-1">{mo.liveCounts(live.fn, live.fp)}</div>}
          {metrics && day >= DAYS && <div className="text-xs text-bark-soft mt-1">{mo.prodRecall(pct(metrics.recall))}</div>}
        </div>
        <div className="card p-3 space-y-1 min-h-[120px]">
          <div className="text-xs font-bold uppercase text-bark-soft">{mo.recent}</div>
          {feed.map((p) => (
            <div key={p.rowId} className="text-sm animate-slide flex items-center gap-1.5">
              <Icon name={p.actual ? 'crack' : 'van'} size={18} /> {p.actual ? mo.missedEvent(p.name) : mo.falseEvent(p.name)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Direct label at the last point so identity never relies on color alone.
const endLabel = (text: string) => (props: { x?: number | string; y?: number | string; index?: number }) =>
  props.index === 14 ? <text x={Number(props.x) + 6} y={Number(props.y)} fontSize={12} fill="currentColor" dominantBaseline="middle">{text}</text> : <g />;

/** Depth sweep: the player discovers the train/test gap themselves, then picks a fix. */
function Investigation({ onAccept, onUnderfit, onInsight }: { onAccept: (req: TrainRequest, threshold: number) => void; onUnderfit: () => void; onInsight: () => void }) {
  const { SERIES, INK, tooltipStyle } = useChart();
  const t = useT();
  const mo = t.monitoring;
  const mission = useGame((s) => s.mission);
  const deep = mission.deepModel!;
  const [sweep, setSweep] = useState<{ depth: number; treino: number; teste: number; r: TrainResult }[]>([]);
  const [depth, setDepth] = useState(4);
  const [msg, setMsg] = useState<{ text: string; tone: 'good' | 'warn' | 'bad' } | null>(null);
  const [checking, setChecking] = useState(false);

  // Train accuracy vs. accuracy on brand-new city bridges (independent of any leakage in the test split).
  useEffect(() => {
    let alive = true;
    (async () => {
      const out = [];
      for (let d = 1; d <= 15; d++) {
        const r = await engine.train({ ...deep, algorithm: 'decision_tree', params: { max_depth: d } });
        const prod = await engine.predictProduction(r.modelId);
        const pm = computeMetrics(prod.map((p) => p.proba), prod.map((p) => p.actual));
        out.push({ depth: d, treino: Math.round(r.trainMetrics.accuracy * 100), teste: Math.round(pm.accuracy * 100), r });
      }
      if (alive) setSweep(out);
    })();
    return () => { alive = false; };
  }, [deep]);

  // Let the player look at the diverging lines first; the name comes after.
  useEffect(() => {
    if (!sweep.length) return;
    const t = setTimeout(onInsight, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sweep.length]);

  const tryModel = async (req: TrainRequest, threshold: number) => {
    setChecking(true);
    const r = await engine.train(req);
    const prod = await engine.predictProduction(r.modelId);
    // Judge model quality at the neutral 50% cut; the player's alert threshold is kept for production.
    const pm = computeMetrics(prod.map((p) => p.proba), prod.map((p) => p.actual), 0.5);
    const gap = r.trainMetrics.accuracy - pm.accuracy;
    setChecking(false);
    if (req.algorithm === 'decision_tree' && (req.params.max_depth ?? 0) <= 2) {
      onUnderfit();
      return setMsg({ tone: 'warn', text: mo.underfit(pct(r.trainMetrics.accuracy)) });
    }
    if (gap >= MAX_GAP) return setMsg({ tone: 'bad', text: mo.stillMemorizing(pct(r.trainMetrics.accuracy), pct(pm.accuracy)) });
    if (pm.accuracy < MIN_PROD) return setMsg({ tone: 'warn', text: mo.tooWeak(pct(pm.accuracy)) });
    onAccept(req, threshold);
  };

  const sel = sweep.find((s) => s.depth === depth);
  return (
    <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 animate-pop">
      <div className="card p-4">
        <div className="font-display font-semibold flex items-center gap-2"><Icon name="overfit" size={22} /> {mo.sweepTitle}</div>
        <div className="h-64 mt-2">
          {sweep.length ? (
            <ResponsiveContainer>
              <LineChart data={sweep} margin={{ top: 10, right: 56, left: -10, bottom: 10 }}>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="depth" tick={{ fontSize: 11, fill: INK.axis }} label={{ value: 'max_depth', position: 'insideBottom', offset: -6, fontSize: 11, fill: INK.axis }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: INK.axis }} unit="%" />
                <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v}%`, n]} labelFormatter={(d) => `max_depth = ${d}`} />
                <Legend verticalAlign="top" height={24} iconType="plainline" />
                <ReferenceLine x={depth} stroke="#f3ecff" strokeOpacity={0.35} strokeWidth={8} />
                <Line name={mo.seriesTrain} type="monotone" dataKey="treino" stroke={SERIES.train} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} label={endLabel(mo.endTrain)} />
                <Line name={mo.seriesNew} type="monotone" dataKey="teste" stroke={SERIES.test} strokeWidth={2} dot={{ r: 3 }} label={endLabel(mo.endNew)} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-full flex items-center justify-center gap-2 animate-pulse"><Icon name="tree" size={28} /> {mo.sweepLoading}</div>}
        </div>
      </div>
      <div className="space-y-3">
        <Speech who="monitoring">{mo.explain}</Speech>
        {mission.cleaning.duplicates === 'keep' && (
          <Speech who="monitoring" tone="warn">{mo.dupWarn}</Speech>
        )}
        <div className="card p-4 space-y-3">
          <div className="flex justify-between font-bold"><span>{mo.newDepth}</span><span className="font-display text-2xl">{depth}</span></div>
          <input type="range" min={1} max={15} value={depth} onChange={(e) => { setDepth(Number(e.target.value)); setMsg(null); }} className="w-full accent-[#9b6bdf]" />
          {sel && <div className="text-sm font-bold">{mo.selInfo(sel.treino, sel.teste)}</div>}
          <Button className="w-full" variant="berry" disabled={checking} onClick={() => tryModel({ ...deep, algorithm: 'decision_tree', params: { max_depth: depth } }, mission.threshold)}>
            {mo.retrain(depth)}
          </Button>
          {mission.currentModel && (
            <Button className="w-full" variant="ghost" size="sm" disabled={checking} onClick={() => tryModel(mission.currentModel!, mission.threshold)}>
              {mo.useApproved(describeModel(t, mission.currentModel.algorithm, mission.currentModel.params), pct(mission.threshold))}
            </Button>
          )}
          {msg && <Speech who="monitoring" tone={msg.tone}>{msg.text}</Speech>}
        </div>
      </div>
    </div>
  );
}
