import { useGame } from '../../store/gameStore';
import { Icon } from '../art/Icon';
import { Button } from '../common/Button';
import { useTechUnlocked } from './Phone';

/** One-time notice when the Centro Técnico app appears on the phone. */
export function TechUnlockCard() {
  const unlocked = useTechUnlocked();
  const announced = useGame((s) => !!s.rag.flags.tech_announced || s.techSeen);
  const blocked = useGame((s) => s.showPhone || s.discoveryQueue.length > 0 || !!s.openBuilding || s.showFeedback);
  const flag = useGame((s) => s.ragFlag);
  const openPhone = useGame((s) => s.togglePhone);
  if (!unlocked || announced || blocked) return null;
  const close = (open: boolean) => {
    flag('tech_announced');
    if (open) openPhone(true, 'tech');
  };
  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-bark/30 backdrop-blur-[2px] p-4" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
      <div className="card chunky w-[min(440px,100%)] p-5 sm:p-7 text-center border-sky border-4 animate-pop">
        <div className="text-xs font-bold tracking-[0.25em] text-sky flex items-center justify-center gap-2">
          <Icon name="sparkle" size={16} /> NOVIDADE <Icon name="sparkle" size={16} />
        </div>
        <div className="my-4 flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-cream border-3 border-sky/50 flex items-center justify-center animate-float"><Icon name="gear" size={64} /></div>
        </div>
        <div className="font-display text-3xl font-semibold">Centro Técnico liberado!</div>
        <p className="mt-3 text-[15px] leading-snug">Use suas moedas para fazer cursos e ganhar <b>habilidades</b> que ajudam nas próximas missões.</p>
        <p className="mt-2 text-[15px] leading-snug flex items-center justify-center gap-1.5 flex-wrap">
          Agora você pode acessar pelo ícone do <b className="inline-flex items-center gap-1"><Icon name="phone" size={20} /> celular</b>.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="sun" onClick={() => close(true)}>Abrir o Centro Técnico</Button>
          <Button variant="ghost" onClick={() => close(false)}>Depois</Button>
        </div>
      </div>
    </div>
  );
}
