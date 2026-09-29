import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useT } from '../../i18n';
import { NUMERIC_FEATURES, TARGET, getRawBridgeDataset, isOutlier, type FeatureKey, type NumericFeature } from '../../ml/dataset';
import { useGame } from '../../store/gameStore';
import { Icon } from '../art/Icon';
import { Button } from '../common/Button';
import { useChart } from '../common/chartTheme';
import { COLUMN_ICON, colName, fmt, type ColumnKey } from '../common/labels';
import { goTo } from '../common/nav';
import { Speech } from '../common/Speech';

const ALL_COLUMNS: ColumnKey[] = ['nome_da_ponte', ...NUMERIC_FEATURES, TARGET];
const SELECTABLE: FeatureKey[] = ['nome_da_ponte', ...NUMERIC_FEATURES];

/** % of bridges needing maintenance per value bucket — lets the player *see* whether a column is a good clue. */
function clueChart(col: NumericFeature) {
  const rows = getRawBridgeDataset().filter((r) => r[col] !== null && !isOutlier(col, r[col]));
  const vals = rows.map((r) => r[col] as number).sort((a, b) => a - b);
  const edges = [0.2, 0.4, 0.6, 0.8].map((q) => vals[Math.floor(q * vals.length)]);
  const bucket = (v: number) => {
    const i = edges.findIndex((e) => v < e);
    return i === -1 ? 4 : i;
  };
  const agg = Array.from({ length: 5 }, () => ({ n: 0, pos: 0 }));
  rows.forEach((r) => { const b = bucket(r[col] as number); agg[b].n++; agg[b].pos += r.precisa_manutencao; });
  const lo = [vals[0], ...edges];
  const hi = [...edges, vals[vals.length - 1]];
  return agg.map((a, i) => ({ faixa: `${fmt(Math.round(lo[i]))}–${fmt(Math.round(hi[i]))}`, taxa: Math.round((a.pos / Math.max(a.n, 1)) * 100) }));
}

type Feedback = { text: string; tone: 'normal' | 'good' | 'warn' | 'bad' };

export function DataCenterPanel() {
  const { INK, MAG, tooltipStyle } = useChart();
  const t = useT();
  const d = t.datacenter;
  const { mission, patchMission, setFlag, discover, completeStep } = useGame();
  const raw = useMemo(() => getRawBridgeDataset(), []);
  const labelFound = !!mission.flags.dc_label;
  const done = mission.step !== 'explore_data' && mission.step !== 'talk_mayor';
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [focus, setFocus] = useState<FeatureKey | null>(null);
  const [warnName, setWarnName] = useState(false);
  const selected = mission.features;

  if (mission.step === 'talk_mayor') return <Speech who="datacenter">{t.notYet.datacenter}</Speech>;

  const toggle = (c: FeatureKey) => {
    setFocus(c);
    if (done) return;
    const current = useGame.getState().mission.features;
    const next = current.includes(c) ? current.filter((f) => f !== c) : [...current, c];
    patchMission({ features: next });
    if (c === 'nome_da_ponte' && !current.includes(c)) setFeedback({ tone: 'warn', text: d.nameWarn });
    else setFeedback(null);
  };

  const clickColumn = (c: ColumnKey) => {
    if (!labelFound && !done) {
      if (c === TARGET) {
        setFlag('dc_label');
        discover('dataset', 'label');
        setFeedback({ tone: 'good', text: d.labelFound });
      } else {
        setFeedback({ tone: 'warn', text: d.wrongLabel[c] ?? d.wrongLabelGeneric(colName(t, c)) });
      }
      return;
    }
    if (c === TARGET) return setFeedback({ tone: 'normal', text: d.targetIsNotFeature });
    toggle(c);
  };

  const proceed = () => {
    if (selected.includes('nome_da_ponte') && !warnName) { setWarnName(true); return; }
    discover('feature');
    completeStep('explore_data');
    goTo('cleaning');
  };

  const chart = focus && focus !== 'nome_da_ponte' ? clueChart(focus) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="card px-4 py-2 font-display flex items-center gap-2"><Icon name="table" size={28} /><b className="text-2xl">{d.datasetName}</b></div>
        <Stat n={raw.length} label={d.rows} />
        <Stat n={SELECTABLE.length} label={d.cols} />
        <Stat n={labelFound || done ? 1 : '?'} label={d.target} />
        <Stat n={selected.length} label={d.chosen} highlight />
      </div>

      {!labelFound && !done ? (
        <Speech who="datacenter">{d.askLabel}</Speech>
      ) : !done ? (
        <Speech who="datacenter">{d.askFeatures}</Speech>
      ) : (
        <Speech who="datacenter" tone="good">{d.doneLine(selected.map((f) => colName(t, f)).join(', '))}</Speech>
      )}
      {feedback && <Speech who="datacenter" tone={feedback.tone}>{feedback.text}</Speech>}

      {!labelFound && !done && (
        <div className="card p-4 border-sun/60 animate-pop">
          <div className="font-display text-lg font-semibold flex items-center gap-2"><Icon name="flag" size={24} /> {d.labelQuestion}</div>
          <div className="text-sm text-bark-soft mb-3">{d.labelQuestionHelp}</div>
          <div className="flex flex-wrap gap-2">
            {ALL_COLUMNS.map((c) => (
              <button key={c} onClick={() => clickColumn(c)} className="chunky rounded-xl bg-white hover:bg-cream px-3 py-2 text-sm font-bold flex items-center gap-1.5 border border-sky/30">
                <Icon name={COLUMN_ICON[c]} size={18} /> {colName(t, c)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="card overflow-auto scroll-soft max-h-[46vh]">
          <table className="text-sm w-max min-w-full">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="bg-cream px-2 py-2 text-xs">#</th>
                {ALL_COLUMNS.map((c) => {
                  const isTarget = c === TARGET;
                  const isSel = !isTarget && selected.includes(c as FeatureKey);
                  const showTarget = isTarget && (labelFound || done);
                  return (
                    <th key={c} className={`px-2 py-1.5 text-left transition ${showTarget ? 'bg-sun/30' : isSel ? 'bg-leaf/15' : 'bg-cream hover:bg-berry/10'} ${!labelFound && !done ? 'animate-pulse' : ''}`}>
                      <button onClick={() => clickColumn(c)} className="flex items-center gap-1.5 font-bold whitespace-nowrap">
                        {labelFound && !isTarget && (
                          <span className={`w-4 h-4 rounded border-2 border-bark/40 flex items-center justify-center ${isSel ? 'bg-leaf-dark' : 'bg-white'}`}>
                            {isSel && <svg viewBox="0 0 12 12" width="10" height="10"><path d="M2 6 l3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" /></svg>}
                          </span>
                        )}
                        <Icon name={COLUMN_ICON[c]} size={18} /> {colName(t, c)}
                        {showTarget && <span className="text-[10px] bg-bark text-sun rounded px-1">LABEL</span>}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {raw.slice(0, 80).map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-cream/60">
                  <td className="px-2 py-1 text-xs text-bark-soft">{i + 1}</td>
                  {ALL_COLUMNS.map((c) => {
                    const v = r[c as keyof typeof r];
                    const miss = v === null;
                    const out = c !== TARGET && c !== 'nome_da_ponte' && isOutlier(c as NumericFeature, v as number | null);
                    return (
                      <td key={c} className={`px-2 py-1 whitespace-nowrap ${miss ? 'bg-danger/10 text-danger font-bold' : out ? 'bg-coral/10 font-bold' : ''} ${c === TARGET ? 'font-bold text-center' : ''}`}>
                        {c === TARGET ? (
                          <span className={`inline-block min-w-6 rounded-md px-1.5 ${v ? 'bg-danger/10 text-danger' : 'bg-leaf/10 text-leaf-dark'}`}>{String(v)}</span>
                        ) : fmt(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-bark-soft p-2">{d.showing(80, raw.length)}</div>
        </div>

        <div className="space-y-3">
          <div className="card p-4">
            <div className="font-display font-semibold mb-2 flex items-center gap-2"><Icon name="magnifier" size={22} /> {d.featuresBox}</div>
            {SELECTABLE.map((c) => (
              <label key={c} className={`flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer hover:bg-cream ${focus === c ? 'bg-sun/10' : ''} ${!labelFound && !done ? 'opacity-40 pointer-events-none' : ''}`}>
                <input type="checkbox" className="w-4 h-4 accent-[#4f9e62]" checked={selected.includes(c)} disabled={done} onChange={() => toggle(c)} />
                <Icon name={COLUMN_ICON[c]} size={18} />
                <span className="text-sm font-bold flex-1">{colName(t, c)}</span>
                <button className="text-xs text-bark-soft hover:underline" onClick={(e) => { e.preventDefault(); setFocus(c); }}>{d.see}</button>
              </label>
            ))}
            <div className="flex items-center gap-2 py-1 px-2 mt-1 border-t-2 border-dashed border-bark/10 pt-2">
              <Icon name="flag" size={18} /><span className="text-sm font-bold flex-1">{colName(t, TARGET)}</span>
              <span className="text-[10px] font-bold bg-sun rounded px-1.5">{labelFound || done ? 'LABEL' : '?'}</span>
            </div>
          </div>

          {focus && (
            <div className="card p-4 animate-pop" key={focus}>
              <div className="font-display font-semibold text-sm flex items-center gap-1.5"><Icon name={COLUMN_ICON[focus]} size={18} /> {colName(t, focus)}</div>
              {chart ? (
                <>
                  <div className="text-xs text-bark-soft mb-1">{d.chartCaption}</div>
                  <div className="h-40">
                    <ResponsiveContainer>
                      <BarChart data={chart} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke={INK.grid} />
                        <XAxis dataKey="faixa" tick={{ fontSize: 9, fill: INK.axis }} interval={0} />
                        <YAxis tick={{ fontSize: 10, fill: INK.axis }} domain={[0, 100]} unit="%" />
                        <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, d.needed]} />
                        <Bar dataKey="taxa" fill={MAG} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-xs text-bark-soft">{d.chartHelp}</div>
                </>
              ) : (
                <p className="text-sm mt-1">{d.nameChart}</p>
              )}
            </div>
          )}

          {!done && labelFound && (
            <div className="card p-4">
              {warnName && selected.includes('nome_da_ponte') && <p className="text-sm mb-2 text-danger font-bold">{d.nameConfirm}</p>}
              <Button className="w-full" variant="leaf" disabled={selected.length === 0} onClick={proceed}>{d.continue}</Button>
              {selected.length === 0 && <div className="text-xs text-bark-soft mt-1 text-center">{d.pickOne}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label, highlight }: { n: number | string; label: string; highlight?: boolean }) {
  return (
    <div className={`card px-3 py-1.5 ${highlight ? 'bg-leaf/10' : ''}`}>
      <span className="font-display text-xl font-semibold">{n}</span> <span className="text-sm text-bark-soft">{label}</span>
    </div>
  );
}
