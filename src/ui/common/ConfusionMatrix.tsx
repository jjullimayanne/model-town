import { useT } from '../../i18n';
import type { Confusion } from '../../ml/metrics';
import { Icon, type IconName } from '../art/Icon';

export type Cell = 'tp' | 'fp' | 'tn' | 'fn';

export const CELL_STYLE: Record<Cell, { bg: string; icon: IconName }> = {
  tp: { bg: 'border-l-leaf', icon: 'wrench' },
  tn: { bg: 'border-l-sky', icon: 'shield' },
  fp: { bg: 'border-l-sun', icon: 'van' },
  fn: { bg: 'border-l-danger', icon: 'crack' },
};

/** Friendly 2×2 confusion matrix. Cells are clickable so players can inspect real bridges. */
export function ConfusionMatrix({ c, onCell, active, pulse }: { c: Confusion; onCell?: (cell: Cell) => void; active?: Cell | null; pulse?: Cell }) {
  const t = useT();
  const cell = (k: Cell) => (
    <button
      onClick={() => onCell?.(k)}
      className={`${CELL_STYLE[k].bg} rounded-2xl p-3 text-left border-3 transition hover:scale-[1.02] ${active === k ? 'border-bark' : 'border-transparent'} ${pulse === k ? 'animate-pulse ring-2 ring-danger/50' : ''}`}
    >
      <div className="flex justify-between items-start">
        <Icon name={CELL_STYLE[k].icon} size={30} />
        <span className="font-display text-3xl font-semibold">{c[k]}</span>
      </div>
      <div className="font-display font-semibold leading-tight">{t.cm[k].title}</div>
      <div className="text-[11px] text-bark-soft leading-tight">{t.cm[k].sub}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-bark-soft/70 mt-1">{k.toUpperCase()}</div>
    </button>
  );
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-stretch">
      <div />
      <div className="text-center text-xs font-bold text-bark-soft">{t.cm.saidNeeds}</div>
      <div className="text-center text-xs font-bold text-bark-soft">{t.cm.saidSafe}</div>
      <div className="flex items-center text-xs font-bold text-bark-soft [writing-mode:vertical-rl] rotate-180">{t.cm.realNeeds}</div>
      {cell('tp')}
      {cell('fn')}
      <div className="flex items-center text-xs font-bold text-bark-soft [writing-mode:vertical-rl] rotate-180">{t.cm.realSafe}</div>
      {cell('fp')}
      {cell('tn')}
    </div>
  );
}
