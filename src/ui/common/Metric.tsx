import { pct } from '../../ml/metrics';
import { Icon, type IconName } from '../art/Icon';

export function MetricCard({ label, value, hint, highlight, icon }: { label: string; value: number; hint?: string; highlight?: 'good' | 'bad' | 'focus'; icon?: IconName }) {
  const ring = highlight === 'focus' ? 'ring-2 ring-sun/70' : highlight === 'bad' ? 'ring-2 ring-danger/50' : highlight === 'good' ? 'ring-2 ring-leaf/60' : '';
  return (
    <div className={`card px-4 py-3 text-center transition ${ring}`} title={hint}>
      <div className="text-xs font-bold uppercase tracking-wide text-bark-soft flex items-center justify-center gap-1">
        {icon && <Icon name={icon} size={16} />} {label}
      </div>
      <div className="font-display text-3xl font-semibold">{pct(value)}</div>
      <div className="h-2 rounded-full bg-bark/10 mt-1 overflow-hidden">
        <div className="h-full rounded-full bg-leaf transition-all duration-500" style={{ width: `${value * 100}%` }} />
      </div>
      {hint && <div className="text-[11px] leading-tight text-bark-soft mt-1.5">{hint}</div>}
    </div>
  );
}

export function Bar({ value, color = '#7cc46a', label, icon }: { value: number; color?: string; label?: string; icon?: IconName }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="w-32 text-xs font-bold truncate flex items-center gap-1">{icon && <Icon name={icon} size={14} />}{label}</span>}
      <div className="flex-1 h-4 bg-bark/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span className="w-12 text-right font-display font-semibold">{pct(value)}</span>
    </div>
  );
}
