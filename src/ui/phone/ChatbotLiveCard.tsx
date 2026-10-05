import { briefedFlag } from '../../content/missions/ragMission';
import { useGame } from '../../store/gameStore';
import { BuildingArt } from '../art/BuildingArt';
import { Icon } from '../art/Icon';
import { Button } from '../common/Button';
import { goTo } from '../common/nav';
import { useRagStatus } from './ragStatus';

export const CHATBOT_REWARD = 2000;

/** Shown once the chatbot ships and the phone is put away: the reward, and a nudge to see how townsfolk like it. */
export function ChatbotLiveCard() {
  const { active, step, briefed } = useRagStatus();
  const blocked = useGame((s) => s.showPhone || s.discoveryQueue.length > 0 || !!s.openBuilding);
  const flag = useGame((s) => s.ragFlag);
  if (!active || step !== 'done' || briefed || blocked) return null;
  const close = (go: boolean) => {
    flag(briefedFlag('done'));
    if (go) goTo('monitoring');
  };
  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-bark/30 backdrop-blur-[2px] p-4" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
      <div className="card chunky w-[min(440px,100%)] p-5 sm:p-7 text-center border-sun border-4 animate-pop">
        <div className="text-xs font-bold tracking-[0.25em] text-sun-dark flex items-center justify-center gap-2">
          <Icon name="sparkle" size={16} /> CHATBOT NO AR <Icon name="sparkle" size={16} />
        </div>
        <div className="font-display text-3xl font-semibold mt-3">Parabéns! 🎉</div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sun/20 px-4 py-1.5 font-display text-xl font-semibold">
          <Icon name="coin" size={26} /> +{CHATBOT_REWARD.toLocaleString('pt-BR')} moedas
        </div>
        <p className="mt-3 text-[15px] leading-snug">Você ganhou {CHATBOT_REWARD.toLocaleString('pt-BR')} moedas da Prefeitura pelo trabalho.</p>
        <p className="mt-2 text-[15px] leading-snug">
          Os moradores estão comentando sobre a sua nova entrega. Vá ao <b>Monitoring Center</b> para saber mais!
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="sun" onClick={() => close(true)} className="flex items-center justify-center gap-2">
            <BuildingArt id="monitoring" size={26} /> Ir ao Monitoring Center
          </Button>
          <Button variant="ghost" onClick={() => close(false)}>Depois</Button>
        </div>
      </div>
    </div>
  );
}
