import { useEffect } from 'react';
import { EventBus } from '../../bridge/EventBus';
import { CONCEPT_ICON } from '../../content/concepts';
import { useT } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { Icon } from '../art/Icon';
import { Button } from '../common/Button';

/** "CONCEPT DISCOVERED" — appears right after the player experienced something. */
export function DiscoveryOverlay() {
  const t = useT();
  const queue = useGame((s) => s.discoveryQueue);
  const dismiss = useGame((s) => s.dismissDiscovery);
  const id = queue[0];
  useEffect(() => {
    if (id) EventBus.emit('fx:celebrate');
  }, [id]);
  if (!id) return null;
  const c = t.concepts[id];
  const big = id === 'overfitting' || id === 'recall';
  return (
    <div className="absolute inset-0 z-[85] flex items-center justify-center bg-bark/30 backdrop-blur-[2px] p-4" onClick={dismiss}>
      <div className="relative animate-pop" key={id} onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-0 -m-16 rounded-full bg-[conic-gradient(from_0deg,#ffd23f55,transparent_20%,#ffd23f55_40%,transparent_60%,#ffd23f55_80%,transparent)] animate-shine" />
        <div className="relative card w-[min(420px,calc(100vw-2rem))] p-5 sm:p-7 text-center border-sun border-4">
          <div className="text-xs font-bold tracking-[0.25em] text-sun-dark flex items-center justify-center gap-2">
            <Icon name="sparkle" size={16} /> {big ? t.discovery.big : t.discovery.found} <Icon name="sparkle" size={16} />
          </div>
          <div className="my-4 flex justify-center">
            <div className="w-28 h-28 rounded-3xl bg-cream border-3 border-sun/50 flex items-center justify-center animate-float">
              <Icon name={CONCEPT_ICON[id]} size={80} />
            </div>
          </div>
          <div className="font-display text-4xl font-semibold uppercase">{c.name}</div>
          <p className="mt-3 text-lg leading-snug">{c.insight}</p>
          <div className="text-xs text-bark-soft mt-2">{t.discovery.saved}</div>
          <Button className="mt-5" variant="leaf" onClick={dismiss}>
            {queue.length > 1 ? `${t.discovery.next(queue.length - 1)} →` : t.discovery.cool}
          </Button>
        </div>
      </div>
    </div>
  );
}
