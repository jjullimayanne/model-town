import { useGame } from '../../store/gameStore';
import { Icon, type IconName } from '../art/Icon';

const STYLE: Record<string, { cls: string; icon: IconName }> = {
  xp: { cls: 'bg-berry text-white', icon: 'star' },
  coins: { cls: 'bg-sun text-ink-dark', icon: 'coin' },
  info: { cls: 'bg-white border border-sky/40', icon: 'bulb' },
  good: { cls: 'bg-leaf text-ink-dark', icon: 'star' },
  warn: { cls: 'bg-coral text-ink-dark', icon: 'warning' },
};

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="absolute bottom-24 right-4 flex flex-col items-end gap-2 z-[80] pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`chunky rounded-2xl px-4 py-2 font-display font-semibold animate-slide flex items-center gap-2 ${STYLE[t.kind].cls}`}>
          <Icon name={STYLE[t.kind].icon} size={20} /> {t.text}
        </div>
      ))}
    </div>
  );
}
