import { useEffect, useState } from 'react';
import { useT } from '../../i18n';
import { levelOf, useGame, XP_PER_LEVEL } from '../../store/gameStore';
import { Icon } from '../art/Icon';
import { Logo } from '../art/Logo';
import { LangToggle } from './LangToggle';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  const t = useT();
  const { xp, coins, day, concepts, toggleNotebook, toggleHint, showHint, lang } = useGame();
  const step = useGame((s) => s.mission.step);
  const level = levelOf(xp);
  const inLevel = xp % XP_PER_LEVEL;

  // Nudge the hint button if the player sits on the same step for a while.
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    setIdle(false);
    const id = setTimeout(() => setIdle(true), 45_000);
    return () => clearTimeout(id);
  }, [step]);

  return (
    <div className="absolute top-3 left-3 right-3 flex items-center gap-3 pointer-events-none">
      <div className="pointer-events-auto card px-4 py-2 flex items-center gap-2 chunky">
        <Logo size={34} />
        <span className="font-display text-xl font-semibold tracking-wide">MODEL TOWN</span>
      </div>
      <div className="flex-1" />
      <div className="pointer-events-auto card px-4 py-2 flex items-center gap-5 font-display font-semibold text-lg chunky">
        <span title={t.hud.dayTitle} className="flex items-center gap-1.5"><Icon name="sun" size={24} /> {t.hud.day(day)}</span>
        <span title={t.hud.budget} className="flex items-center gap-1.5"><Icon name="coin" size={24} /> {coins.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR')}</span>
        <div className="flex items-center gap-2" title={t.hud.totalXp(xp)}>
          <span className="bg-berry text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">{level}</span>
          <div className="w-28 h-3 bg-bark/10 rounded-full overflow-hidden">
            <div className="h-full bg-berry rounded-full transition-all duration-700" style={{ width: `${(inLevel / XP_PER_LEVEL) * 100}%` }} />
          </div>
          <span className="text-xs text-bark-soft">{inLevel}/{XP_PER_LEVEL}</span>
        </div>
      </div>
      <button
        onClick={() => { toggleHint(); setIdle(false); }}
        title={t.hud.hintTitle}
        className={`pointer-events-auto card px-4 py-2 font-display font-semibold text-lg chunky flex items-center gap-2 ${showHint ? 'bg-sun' : 'hover:bg-cream'} ${idle && !showHint ? 'animate-wiggle ring-2 ring-sun/70' : ''}`}
      >
        <Icon name="bulb" size={24} /> {t.hud.hint}
      </button>
      <button onClick={() => toggleNotebook(true)} className="pointer-events-auto card px-4 py-2 font-display font-semibold text-lg chunky hover:bg-cream flex items-center gap-2">
        <Icon name="notebook" size={24} /> {t.hud.notebook} <span className="bg-sun rounded-full px-2 text-sm">{concepts.length}</span>
      </button>
      <LangToggle className="pointer-events-auto" />
      <ThemeToggle className="pointer-events-auto" />
    </div>
  );
}
