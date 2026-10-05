import { useEffect, useMemo, useRef, useState } from 'react';
import { EventBus } from '../../bridge/EventBus';
import { stepIndex } from '../../content/missions/bridgeMission';
import { useT } from '../../i18n';
import { cleanDataset, type CleaningDecisions } from '../../ml/cleaning';
import { generatePython, parsePython } from '../../ml/codegen';
import { NUMERIC_FEATURES, getRawBridgeDataset, type FeatureKey } from '../../ml/dataset';
import { engine, type Algorithm, type ModelParams, type TrainRequest, type TrainResult } from '../../ml/engine';
import { pct } from '../../ml/metrics';
import { useGame, useSkill } from '../../store/gameStore';
import { Button } from '../common/Button';
import { ALGO_ICON, COLUMN_ICON, colName } from '../common/labels';
import { Icon } from '../art/Icon';
import { Bar } from '../common/Metric';
import { goTo } from '../common/nav';
import { NotYet } from '../common/NotYet';
import { Speech } from '../common/Speech';
import { useChart } from '../common/chartTheme';
import { Console, PythonEditor } from '../code/PythonEditor';

const SEED = 42;
const DEFAULT_PARAMS: Record<Algorithm, ModelParams> = {
  logistic_regression: { C: 1 },
  decision_tree: { max_depth: 4 },
  random_forest: { n_estimators: 100, max_depth: 8 },
};

type ConsoleLine = { text: string; kind?: 'err' | 'ok' | 'dim' };

/** Centro Técnico "Intuição de hiperparâmetros": a rule-of-thumb read of the knobs, before training. */
function riskOf(algorithm: Algorithm, p: ModelParams): { level: 'ok' | 'over' | 'under'; text: string } {
  const d = p.max_depth ?? 4;
  if (algorithm === 'decision_tree') {
    if (d >= 10) return { level: 'over', text: `Profundidade ${d}: a árvore vai decorar o treino. Risco alto de overfitting.` };
    if (d <= 2) return { level: 'under', text: `Profundidade ${d}: perguntas demais de menos. Risco de underfitting.` };
    return { level: 'ok', text: `Profundidade ${d}: bom equilíbrio entre aprender e generalizar.` };
  }
  if (algorithm === 'random_forest') {
    if (d <= 2) return { level: 'under', text: `Árvores com profundidade ${d} são simples demais, mesmo em floresta. Risco de underfitting.` };
    if ((p.n_estimators ?? 100) <= 10) return { level: 'over', text: 'Só 10 árvores: a votação fica instável e o resultado varia muito.' };
    if (d >= 13) return { level: 'over', text: `Profundidade ${d}: a floresta compensa um pouco, mas ainda tende a decorar. Risco médio.` };
    return { level: 'ok', text: 'Muitas árvores de profundidade moderada: o ponto forte da Random Forest.' };
  }
  const C = p.C ?? 1;
  if (C >= 10) return { level: 'over', text: `C = ${C}: pouca regularização, o modelo pode se ajustar demais. Risco leve de overfitting.` };
  if (C <= 0.01) return { level: 'under', text: `C = ${C}: regularização forte demais, os pesos ficam pequenos. Risco de underfitting.` };
  return { level: 'ok', text: `C = ${C}: regularização equilibrada.` };
}

/** Centro Técnico "Python avançado": ready-made starting points for the Python mode. */
const SNIPPETS: { label: string; algorithm: Algorithm; params: ModelParams }[] = [
  { label: 'Floresta com 200 árvores', algorithm: 'random_forest', params: { n_estimators: 200, max_depth: 8 } },
  { label: 'Árvore rasa (profundidade 3)', algorithm: 'decision_tree', params: { max_depth: 3 } },
  { label: 'Logística regularizada (C=0.1)', algorithm: 'logistic_regression', params: { C: 0.1 } },
];

export function MLLabPanel() {
  const { SERIES } = useChart();
  const t = useT();
  const ml = t.mllab;
  const { mission, patchMission, addExperiment, discover, completeStep } = useGame();
  const step = mission.step;
  const idx = stepIndex(step);
  const locked = idx < stepIndex('train_model');
  const isDeep = step === 'deep_tree';
  const hideTest = step === 'train_model' || isDeep || (step === 'evaluate' && !mission.flags.ev_seen);

  const base = isDeep ? undefined : mission.currentModel;
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(isDeep ? 'decision_tree' : base?.algorithm ?? null);
  const [params, setParams] = useState<Record<Algorithm, ModelParams>>(() => ({
    ...DEFAULT_PARAMS,
    ...(base ? { [base.algorithm]: base.params } : {}),
    ...(isDeep ? { decision_tree: { max_depth: 15 } } : {}),
  }));
  const [testSize, setTestSize] = useState(base?.testSize ?? 0.2);
  const [mode, setMode] = useState<'visual' | 'python'>('visual');
  const [code, setCode] = useState('');
  const [codeDirty, setCodeDirty] = useState(false);
  const [consoleLines, setConsole] = useState<ConsoleLine[]>([]);
  const [training, setTraining] = useState<{ progress: number; stage: number } | null>(null);
  const [result, setResult] = useState<TrainResult | null>(null);
  const [ottoLine, setOttoLine] = useState<string | null>(null);
  const timer = useRef<number>();
  const intuition = useSkill('hyper_intuition');
  const pythonPro = useSkill('python_pro');

  const cleaning = mission.cleaning as CleaningDecisions;
  const rowCount = useMemo(() => (cleaning.missing ? cleanDataset(getRawBridgeDataset(), cleaning).report.after : 0), [cleaning]);

  const makeRequest = (over?: Partial<TrainRequest>): TrainRequest | null =>
    algorithm ? { datasetId: 'bridges-v1', cleaning, features: mission.features, algorithm, params: params[algorithm], testSize, seed: SEED, ...over } : null;

  // keep the Python view in sync with the visual knobs until the player edits it
  useEffect(() => {
    const req = makeRequest();
    if (req && !codeDirty) setCode(generatePython(req, t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm, params, testSize, codeDirty, mission.features, t]);

  useEffect(() => () => { window.clearInterval(timer.current); EventBus.emit('fx:training', { on: false }); }, []);

  if (locked) return <NotYet who="mllab" text={t.notYet.mllab} />;

  const onTrained = (req: TrainRequest, r: TrainResult) => {
    addExperiment(req);
    discover('train_test_split', 'classification', req.algorithm);
    if (isDeep) {
      const deep = req.algorithm === 'decision_tree' && (req.params.max_depth ?? 0) >= 10;
      if (!deep) {
        setOttoLine(req.algorithm !== 'decision_tree' ? ml.ottoWrongAlgo : ml.ottoShallow(req.params.max_depth ?? 0));
        return;
      }
      setOttoLine(ml.ottoPerfect(pct(r.trainMetrics.accuracy)));
      patchMission({ deepModel: req });
      return;
    }
    if (step === 'train_model' || step === 'evaluate') patchMission({ currentModel: req });
    if (step === 'train_model') completeStep('train_model');
  };

  const runTraining = (req: TrainRequest, pythonMode = false) => {
    setResult(null);
    setOttoLine(null);
    setTraining({ progress: 0, stage: 0 });
    EventBus.emit('fx:training', { on: true });
    if (pythonMode) setConsole([{ text: '$ python treinar_pontes.py', kind: 'dim' }]);
    const t0 = performance.now();
    const duration = req.algorithm === 'random_forest' ? 2200 : 1500;
    let computed: TrainResult | null = null;
    setTimeout(() => engine.train(req).then((r) => (computed = r)), 120);
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / duration);
      setTraining({ progress: p, stage: Math.min(ml.stages.length - 1, Math.floor(p * ml.stages.length)) });
      if (p >= 1 && computed) {
        window.clearInterval(timer.current);
        const r = computed as TrainResult;
        setTraining(null);
        setResult(r);
        EventBus.emit('fx:training', { on: false });
        if (pythonMode)
          setConsole((c) => [
            ...c,
            { text: `${ml.consoleTrain}: ${r.trainMetrics.accuracy.toFixed(3)}`, kind: 'ok' },
            { text: hideTest ? ml.consoleTest : `${ml.consoleTestLabel}: ${r.testMetrics.accuracy.toFixed(3)}`, kind: 'ok' },
            { text: ml.finished((r.durationMs / 1000).toFixed(2)), kind: 'dim' },
          ]);
        onTrained(req, r);
      }
    }, 50);
  };

  const trainVisual = () => {
    const req = makeRequest();
    if (req) runTraining(req);
  };

  const runPython = () => {
    const parsed = parsePython(code, ['nome_da_ponte', ...NUMERIC_FEATURES], t);
    if (parsed.errors.length || !parsed.algorithm) {
      setConsole([
        { text: '$ python treinar_pontes.py', kind: 'dim' },
        { text: 'Traceback (most recent call last):', kind: 'err' },
        ...parsed.errors.map((e) => ({ text: `  ${e}`, kind: 'err' as const })),
      ]);
      return;
    }
    const algo = parsed.algorithm;
    const merged = { ...params[algo], ...parsed.params };
    setAlgorithm(algo);
    setParams((p) => ({ ...p, [algo]: merged }));
    if (parsed.testSize) setTestSize(parsed.testSize);
    const req: TrainRequest = {
      datasetId: 'bridges-v1', cleaning, features: parsed.features ?? mission.features, algorithm: algo,
      params: merged, testSize: parsed.testSize ?? testSize, seed: SEED,
    };
    if (parsed.features) patchMission({ features: parsed.features as FeatureKey[] });
    runTraining(req, true);
  };

  const p = algorithm ? params[algorithm] : {};
  const setP = (patch: ModelParams) => algorithm && setParams((all) => ({ ...all, [algorithm]: { ...all[algorithm], ...patch } }));
  const nTest = Math.round(rowCount * testSize);

  return (
    <div className="space-y-4">
      {isDeep ? (
        <div className="space-y-2">
          <Speech who="otto" tone="warn">{ml.ottoChallenge}</Speech>
          {ottoLine && <Speech who="otto" tone={mission.deepModel ? 'good' : 'bad'}>{ottoLine}</Speech>}
        </div>
      ) : (
        <Speech who="mllab">{step === 'train_model' ? ml.introFirst(pct(testSize)) : ml.introSandbox}</Speech>
      )}

      <div className="flex gap-2">
        {(['visual', 'python'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`chunky rounded-xl px-4 py-2 font-display font-semibold flex items-center gap-2 ${mode === m ? 'bg-cream ring-2 ring-berry' : 'bg-white'}`}>
            <Icon name={m === 'visual' ? 'sliders' : 'code'} size={22} /> {m === 'visual' ? ml.visual : ml.python}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
        {mode === 'visual' ? (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              {(Object.keys(ALGO_ICON) as Algorithm[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setAlgorithm(a)}
                  className={`chunky rounded-2xl p-3 text-left transition border-3 ${algorithm === a ? 'bg-cream border-berry/60' : 'bg-white border-transparent hover:bg-cream'} ${isDeep && a === 'decision_tree' ? 'ring-2 ring-sun/70' : ''}`}
                >
                  <Icon name={ALGO_ICON[a]} size={44} />
                  <div className="font-display font-semibold leading-tight mt-1">{t.algos[a].name}</div>
                  <div className="text-xs text-bark-soft mt-1 leading-snug">{t.algos[a].pitch}</div>
                </button>
              ))}
            </div>

            {algorithm && (
              <div className="card p-4 space-y-4 animate-pop" key={algorithm}>
                <div className="font-display font-semibold flex items-center gap-2"><Icon name="gear" size={22} /> {ml.params}</div>
                {algorithm === 'logistic_regression' && (
                  <Choice label={ml.cLabel} hint={ml.cHint} options={[0.01, 0.1, 1, 10]} value={p.C ?? 1} onChange={(v) => setP({ C: v })} />
                )}
                {algorithm === 'random_forest' && (
                  <Choice label={ml.nEst} options={[10, 50, 100, 200]} value={p.n_estimators ?? 100} onChange={(v) => setP({ n_estimators: v })} />
                )}
                {algorithm !== 'logistic_regression' && (
                  <div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>{ml.depth}</span>
                      <span className="font-display text-lg">{p.max_depth}</span>
                    </div>
                    <input type="range" min={1} max={15} value={p.max_depth ?? 4} onChange={(e) => setP({ max_depth: Number(e.target.value) })} className="w-full accent-[#9b6bdf]" />
                    <div className="flex justify-between text-[11px] text-bark-soft"><span>{ml.depthLow}</span><span>{ml.depthHigh}</span></div>
                    <div className="flex gap-2 mt-1">
                      {[2, 5, 15].map((d) => <button key={d} onClick={() => setP({ max_depth: d })} className="text-xs bg-white chunky rounded-lg px-2 py-0.5">{d}</button>)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>{ml.split}</span>
                    <span>{pct(1 - testSize)} / {pct(testSize)}</span>
                  </div>
                  <input type="range" min={10} max={50} step={5} value={testSize * 100} onChange={(e) => setTestSize(Number(e.target.value) / 100)} className="w-full accent-[#9b6bdf]" />
                  <div className="flex h-7 rounded-xl overflow-hidden text-xs font-bold text-white mt-1">
                    <div className="flex items-center justify-center" style={{ width: `${(1 - testSize) * 100}%`, background: SERIES.train }}>{ml.trainBar(rowCount - nTest)}</div>
                    <div className="flex items-center justify-center gap-1" style={{ width: `${testSize * 100}%`, background: SERIES.test }}>{ml.testBar(nTest)}</div>
                  </div>
                </div>
                {intuition && (() => {
                  const r = riskOf(algorithm, p);
                  const tone = r.level === 'ok' ? 'bg-leaf/15 border-leaf/50' : r.level === 'over' ? 'bg-coral/15 border-coral/60' : 'bg-sky/15 border-sky/50';
                  return (
                    <div className={`rounded-xl border-2 px-3 py-2 text-sm ${tone}`}>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-bark-soft flex items-center gap-1"><Icon name="sliders" size={14} /> Intuição de hiperparâmetros</div>
                      <div className="font-semibold">{r.level === 'ok' ? '✓ ' : '⚠ '}{r.text}</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-bark-soft flex-1">{ml.codeHelp}</span>
              {codeDirty && <button className="text-xs underline flex items-center gap-1" onClick={() => setCodeDirty(false)}><Icon name="refresh" size={14} /> {ml.restore}</button>}
            </div>
            {pythonPro && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-bark-soft flex items-center gap-1"><Icon name="code" size={14} /> Trechos prontos</span>
                {SNIPPETS.map((sn) => (
                  <button
                    key={sn.label}
                    className="text-xs chunky rounded-lg bg-white hover:bg-cream px-2 py-1 font-bold"
                    onClick={() => {
                      const params = { ...DEFAULT_PARAMS[sn.algorithm], ...sn.params };
                      setAlgorithm(sn.algorithm);
                      setParams((all) => ({ ...all, [sn.algorithm]: params }));
                      setCode(generatePython({ cleaning, features: mission.features, algorithm: sn.algorithm, params, testSize, seed: SEED }, t));
                      setCodeDirty(true);
                    }}
                  >
                    {sn.label}
                  </button>
                ))}
              </div>
            )}
            <PythonEditor value={code} onChange={(v) => { setCode(v); setCodeDirty(true); }} />
            <Console lines={consoleLines} />
          </div>
        )}

        <div className="space-y-3">
          <div className="card p-4">
            <div className="text-sm text-bark-soft">{ml.usedFeatures}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {mission.features.map((f) => (
                <span key={f} className="bg-leaf/10 rounded-lg px-2 py-0.5 text-xs font-bold flex items-center gap-1"><Icon name={COLUMN_ICON[f]} size={14} /> {colName(t, f)}</span>
              ))}
            </div>
            <Button className="w-full mt-4 flex items-center justify-center gap-2" size="lg" variant="berry" disabled={!algorithm || !!training} onClick={mode === 'python' ? runPython : trainVisual}>
              <Icon name={mode === 'python' ? 'play' : 'brain'} size={24} /> {training ? ml.training : mode === 'python' ? ml.run : ml.train}
            </Button>
          </div>

          {training && (
            <div className="card p-4 animate-pop">
              <div className="font-display font-semibold">{ml.stages[training.stage]}</div>
              <div className="h-4 bg-bark/10 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-berry rounded-full" style={{ width: `${training.progress * 100}%` }} />
              </div>
              <div className="flex justify-center mt-2 animate-wiggle"><Icon name={algorithm ? ALGO_ICON[algorithm] : 'brain'} size={48} /></div>
            </div>
          )}

          {result && <ResultCard r={result} hideTest={hideTest} deepOk={isDeep && !!mission.deepModel} />}
        </div>
      </div>
    </div>
  );
}

function Choice({ label, hint, options, value, onChange }: { label: string; hint?: string; options: number[]; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="text-sm font-bold">{label}</div>
      {hint && <div className="text-[11px] text-bark-soft">{hint}</div>}
      <div className="flex gap-2 mt-1">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} className={`chunky rounded-lg px-3 py-1 font-display ${value === o ? 'bg-cream ring-2 ring-berry' : 'bg-white'}`}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function ResultCard({ r, hideTest, deepOk }: { r: TrainResult; hideTest: boolean; deepOk: boolean }) {
  const { SERIES } = useChart();
  const t = useT();
  const ml = t.mllab;
  const step = useGame((s) => s.mission.step);
  const top = r.featureImportance.slice(0, 4);
  return (
    <div className="card p-4 space-y-3 animate-pop border-berry/40">
      <div className="font-display text-lg font-semibold flex items-center gap-2"><Icon name="sparkle" size={22} /> {ml.trained}</div>
      <div>
        <div className="text-xs font-bold text-bark-soft uppercase">{ml.trainAcc}</div>
        <div className={`font-display font-semibold ${deepOk ? 'text-5xl text-leaf-dark' : 'text-4xl'}`}>{pct(r.trainMetrics.accuracy, 1)}</div>
      </div>
      {hideTest ? (
        <div className="bg-bark/5 rounded-xl px-3 py-2 text-sm flex items-center gap-2">
          <Icon name="lock" size={22} /> <span><b>{ml.locked(r.testSize)}</b> {deepOk ? ml.ottoRefused : ml.onlyTereza}</span>
        </div>
      ) : (
        <div>
          <div className="text-xs font-bold text-bark-soft uppercase">{ml.testAcc}</div>
          <div className="font-display text-4xl font-semibold">{pct(r.testMetrics.accuracy, 1)}</div>
        </div>
      )}
      {r.complexity?.leaves && <div className="text-xs text-bark-soft flex items-center gap-1"><Icon name="tree" size={16} /> {ml.leaves(r.complexity.leaves)}</div>}
      <div>
        <div className="text-xs font-bold text-bark-soft uppercase mb-1">{ml.importance}</div>
        <div className="space-y-1">{top.map((f) => <Bar key={f.feature} value={f.importance} color={SERIES.train} icon={COLUMN_ICON[f.feature]} label={t.columns[f.feature].short} />)}</div>
      </div>
      {step === 'evaluate' && <Button className="w-full" variant="sun" onClick={() => goTo('evaluation')}>{ml.toTereza} →</Button>}
      {deepOk && <Button className="w-full" variant="coral" onClick={() => { useGame.getState().completeStep('deep_tree'); goTo('deploy'); }}>{ml.toDeploy} →</Button>}
    </div>
  );
}
