import { useMemo, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { useT } from '../../i18n';
import { cleanDataset, type CleaningDecisions } from '../../ml/cleaning';
import { detectIssues, getRawBridgeDataset, type BridgeRow } from '../../ml/dataset';
import { useGame } from '../../store/gameStore';
import { Icon, type IconName } from '../art/Icon';
import { Button } from '../common/Button';
import { useChart } from '../common/chartTheme';
import { colName, fmt } from '../common/labels';
import { goTo } from '../common/nav';
import { NotYet } from '../common/NotYet';
import { Speech } from '../common/Speech';

type Key = keyof CleaningDecisions;
type Tone = 'good' | 'warn' | 'bad';
interface Option<V extends string> { value: V; icon: IconName; tone: Tone }

const MISSING: Option<CleaningDecisions['missing']>[] = [
  { value: 'drop', icon: 'trash', tone: 'warn' },
  { value: 'mean', icon: 'mean', tone: 'good' },
  { value: 'median', icon: 'median', tone: 'good' },
  { value: 'zero', icon: 'zero', tone: 'bad' },
];
const DUPES: Option<CleaningDecisions['duplicates']>[] = [
  { value: 'drop', icon: 'scissors', tone: 'good' },
  { value: 'keep', icon: 'archive', tone: 'bad' },
];
const OUTLIERS: Option<CleaningDecisions['outliers']>[] = [
  { value: 'drop', icon: 'trash', tone: 'good' },
  { value: 'cap', icon: 'ruler', tone: 'good' },
  { value: 'keep', icon: 'archive', tone: 'bad' },
];

export function CleaningLabPanel() {
  const { SERIES, INK, MAG, tooltipStyle } = useChart();
  const t = useT();
  const cl = t.cleaning;
  const { mission, patchMission, discover, completeStep } = useGame();
  const raw = useMemo(() => getRawBridgeDataset(), []);
  const issues = useMemo(() => detectIssues(raw), [raw]);
  const c = mission.cleaning;
  const before = ['talk_mayor', 'explore_data'].includes(mission.step);
  const done = !before && mission.step !== 'clean_data';

  const preview = useMemo(
    () => cleanDataset(raw, { missing: c.missing ?? 'median', duplicates: c.duplicates ?? 'keep', outliers: c.outliers ?? 'keep' }),
    [raw, c.missing, c.duplicates, c.outliers],
  );

  const humidityHist = useMemo(() => {
    const rows = c.missing
      ? cleanDataset(raw, { missing: c.missing, duplicates: 'drop', outliers: 'drop' }).rows
      : raw.filter((r) => r.umidade_media !== null);
    const bins = new Map<number, number>();
    for (const r of rows) {
      const b = Math.min(90, Math.floor((r.umidade_media ?? 0) / 10) * 10);
      bins.set(b, (bins.get(b) ?? 0) + 1);
    }
    return Array.from({ length: 10 }, (_, i) => ({ faixa: `${i * 10}`, pontes: bins.get(i * 10) ?? 0 }));
  }, [raw, c.missing]);

  const firstDupe = useMemo(() => {
    const seen = new Map<string, BridgeRow>();
    for (const r of raw) {
      const k = JSON.stringify(r);
      if (seen.has(k)) return r;
      seen.set(k, r);
    }
    return null;
  }, [raw]);

  const scatter = useMemo(() => {
    const rows = cleanDataset(raw, { missing: 'median', duplicates: 'drop', outliers: c.outliers ?? 'keep' }).rows;
    return rows.map((r) => ({ idade: r.idade_da_ponte ?? 0, trafego: r.trafego_diario ?? 0 }));
  }, [raw, c.outliers]);

  if (before) return <NotYet who="cleaning" text={t.notYet.cleaning} />;

  const choose = <K extends Key>(k: K, v: CleaningDecisions[K]) => {
    if (done) return;
    patchMission({ cleaning: { ...useGame.getState().mission.cleaning, [k]: v } });
    discover(k === 'missing' ? 'missing_values' : k === 'duplicates' ? 'duplicates' : 'outliers');
  };
  const complete = c.missing && c.duplicates && c.outliers;

  return (
    <div className="space-y-4">
      <Speech who="cleaning">{done ? cl.introDone : cl.intro}</Speech>

      <div className="grid lg:grid-cols-3 gap-4">
        <Station
          title={cl.missingTitle} icon="hole" found={cl.missingFound(issues.missing.reduce((a, m) => a + m.count, 0))}
          detail={issues.missing.map((m) => `${colName(t, m.column)}: ${m.count}`).join(' · ')}
          options={MISSING} labels={cl.missing} value={c.missing} onChoose={(v) => choose('missing', v)} disabled={done}
        >
          <div className="text-xs text-bark-soft">{c.missing ? cl.humidityAfter : cl.humidityBefore}</div>
          <div className="h-32">
            <ResponsiveContainer>
              <BarChart data={humidityHist} margin={{ top: 6, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="faixa" tick={{ fontSize: 10, fill: INK.axis }} unit="%" />
                <YAxis tick={{ fontSize: 10, fill: INK.axis }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [v, cl.bridges]} />
                <Bar dataKey="pontes" fill={c.missing === 'zero' ? SERIES.test : MAG} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Station>

        <Station
          title={cl.dupTitle} icon="copy" found={cl.dupFound(issues.duplicates)} detail={cl.dupDetail}
          options={DUPES} labels={cl.duplicates} value={c.duplicates} onChoose={(v) => choose('duplicates', v)} disabled={done}
        >
          {firstDupe && (
            <div className="space-y-1">
              {[0, 1].map((k) => (
                <div key={k} className={`bg-sun/10 rounded-lg px-2 py-1 text-xs font-mono transition ${k === 1 && c.duplicates === 'drop' ? 'opacity-30 line-through' : ''}`}>
                  {cl.dupeRow(firstDupe.nome_da_ponte, firstDupe.idade_da_ponte, fmt(firstDupe.trafego_diario))}
                </div>
              ))}
              <div className="text-center text-sm font-bold text-bark-soft flex items-center justify-center gap-1 h-6">
                {c.duplicates === 'drop' && <><Icon name="scissors" size={18} /> {cl.oneRow}</>}
              </div>
            </div>
          )}
        </Station>

        <Station
          title={cl.outTitle} icon="outlier" found={cl.outFound(issues.outliers.reduce((a, o) => a + o.count, 0))}
          detail={issues.outliers.map((o) => `${colName(t, o.column)} = ${fmt(o.example)}`).join(' · ')}
          options={OUTLIERS} labels={cl.outliers} value={c.outliers} onChoose={(v) => choose('outliers', v)} disabled={done}
        >
          <div className="text-xs text-bark-soft">{cl.scatterCaption}</div>
          <div className="h-32">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={INK.grid} />
                <XAxis type="number" dataKey="idade" tick={{ fontSize: 10, fill: INK.axis }} name={cl.age} />
                <YAxis type="number" dataKey="trafego" tick={{ fontSize: 9, fill: INK.axis }} name={cl.traffic} tickFormatter={(v) => (v >= 1e6 ? `${v / 1e6}M` : `${Math.round(v / 1000)}k`)} />
                <Tooltip {...tooltipStyle} />
                <Scatter data={scatter} fill={MAG} fillOpacity={0.6} shape="circle" isAnimationActive={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Station>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="font-display text-lg flex items-center gap-2">
          <Icon name="bucket" size={28} />
          <span>
            {cl.summary(preview.report.before, preview.report.after)}
            {preview.report.filledMissing > 0 && <span className="text-sm text-bark-soft">{cl.filled(preview.report.filledMissing)}</span>}
            {preview.report.cappedOutliers > 0 && <span className="text-sm text-bark-soft">{cl.capped(preview.report.cappedOutliers)}</span>}
          </span>
        </div>
        <div className="flex-1" />
        {!done ? (
          <Button variant="leaf" disabled={!complete} onClick={() => { completeStep('clean_data'); goTo('mllab'); }}>
            {complete ? cl.ready : cl.solveAll}
          </Button>
        ) : (
          <span className="font-bold text-leaf-dark flex items-center gap-1"><Icon name="check" size={22} /> {cl.doneBadge}</span>
        )}
      </div>
    </div>
  );
}

function Station<V extends string>({ title, icon, found, detail, options, labels, value, onChoose, disabled, children }: {
  title: string; icon: IconName; found: string; detail: string; options: Option<V>[]; labels: Record<V, { label: string; reaction: string }>;
  value?: V; onChoose: (v: V) => void; disabled?: boolean; children: ReactNode;
}) {
  const chosen = options.find((o) => o.value === value);
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon name={icon} size={40} />
        <div className="flex-1">
          <div className="font-display text-lg font-semibold leading-tight">{title}</div>
          <div className="text-sm font-bold text-danger">{found}</div>
        </div>
        {value && <Icon name="check" size={28} />}
      </div>
      <div className="text-xs text-bark-soft">{detail}</div>
      {children}
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            disabled={disabled}
            onClick={() => onChoose(o.value)}
            className={`chunky rounded-xl px-2 py-2 text-sm font-bold text-left transition flex items-center gap-1.5 ${value === o.value ? 'bg-cream ring-2 ring-sky' : 'bg-white hover:bg-cream'} disabled:opacity-70`}
          >
            <Icon name={o.icon} size={22} /> {labels[o.value].label}
          </button>
        ))}
      </div>
      {chosen && <Speech who="cleaning" tone={chosen.tone}>{labels[chosen.value].reaction}</Speech>}
    </div>
  );
}
