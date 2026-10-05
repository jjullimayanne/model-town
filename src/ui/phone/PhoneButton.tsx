import { useEffect } from 'react';
import { useGame } from '../../store/gameStore';
import { Icon } from '../art/Icon';
import { useRagStatus } from './ragStatus';
import { useTechUnlocked } from './Phone';

/** The player's phone. Rings (and vibrates on phones) when the Mayor calls; glows when you have news for her. */
export function PhoneButton() {
  const { active, step, unread } = useRagStatus();
  const open = useGame((s) => s.showPhone);
  const toggle = useGame((s) => s.togglePhone);
  const ringing = step === 'ring';
  const techUnlocked = useTechUnlocked();
  const techSeen = useGame((s) => s.techSeen);
  const techNew = techUnlocked && !techSeen;

  useEffect(() => {
    if (!active || !ringing) return;
    const buzz = () => { try { navigator.vibrate?.([200, 100, 200]); } catch { /* not supported */ } };
    buzz();
    const id = setInterval(buzz, 3000);
    return () => clearInterval(id);
  }, [active, ringing]);

  if (!active || open) return null;
  const hot = ringing || unread || techNew;
  return (
    <button
      onClick={() => toggle(true)}
      aria-label={ringing ? 'Atender o celular' : 'Abrir celular'}
      className={`absolute right-2 bottom-16 md:right-6 md:bottom-6 z-40 card chunky flex items-center gap-2 pl-2.5 pr-4 py-2 font-display font-semibold ${hot ? 'bg-sun text-ink-dark ring-4 ring-sun/50' : ''} ${ringing ? 'animate-wiggle' : ''}`}
    >
      <span className="relative">
        <Icon name="phone" size={34} />
        {hot && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-danger animate-ping" />}
      </span>
      {ringing ? 'Atender!' : unread ? 'Avisar a Prefeita' : techNew ? 'Centro Técnico' : 'Celular'}
    </button>
  );
}
