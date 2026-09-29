import type { ReactNode } from 'react';
import { PORTRAITS, type HostId } from '../../content/buildings';
import { useT } from '../../i18n';
import { Portrait } from '../art/Portrait';
import { PersonCard } from './PersonCard';

/** A short line from a character — the main way the game gives contextual feedback. */
export function Speech({ who, children, tone = 'normal', className = '' }: { who: HostId; children: ReactNode; tone?: 'normal' | 'good' | 'warn' | 'bad'; className?: string }) {
  const t = useT();
  const edge = { normal: 'border-l-bark/15', good: 'border-l-leaf', warn: 'border-l-sun', bad: 'border-l-danger' }[tone];
  return (
    <div className={`flex items-start gap-3 animate-slide ${className}`}>
      <PersonCard who={who}><Portrait spec={PORTRAITS[who]} size={52} /></PersonCard>
      <div className={`relative rounded-2xl bg-white border border-bark/10 border-l-4 ${edge} px-4 py-2.5 text-[15px] leading-snug`}>
        <div className="font-display text-xs font-semibold text-bark-soft mb-0.5">{hostName(t, who)}</div>
        {children}
      </div>
    </div>
  );
}

export const hostName = (t: ReturnType<typeof useT>, who: HostId) => (who === 'otto' ? t.buildings.otto.name : t.buildings[who].host);
