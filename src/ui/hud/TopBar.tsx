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
  const [settings, setSettings] = useState(false);

  // Nudge the hint button if the player sits on the same step for a while.
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    setIdle(false);
    const id = setTimeout(() => setIdle(true), 45_000);
    return () => clearTimeout(id);
  }, [step]);

  return (
    <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex items-center gap-1.5 sm:gap-3 pointer-events-none">
      <div className="pointer-events-auto card px-4 py-2 hidden sm:flex items-center gap-2 chunky">
        <Logo size={34} />
        <span className="font-display text-xl font-semibold tracking-wide hidden lg:inline">MODEL TOWN</span>
      </div>
      <div className="pointer-events-auto card px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-3 sm:gap-5 font-display font-semibold text-base sm:text-lg chunky min-w-0">
        <span title={t.hud.dayTitle} className="hidden md:flex items-center gap-1.5"><Icon name="sun" size={24} /> {t.hud.day(day)}</span>
        <span title={t.hud.budget} className="flex items-center gap-1"><Icon name="coin" size={22} /> {coins.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR')}</span>
        <div className="flex items-center gap-1.5 sm:gap-2" title={t.hud.totalXp(xp)}>
          <span className="bg-berry text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm">{level}</span>
          <div className="w-12 sm:w-28 h-3 bg-bark/10 rounded-full overflow-hidden">
            <div className="h-full bg-berry rounded-full transition-all duration-700" style={{ width: `${(inLevel / XP_PER_LEVEL) * 100}%` }} />
          </div>
          <span className="text-xs text-bark-soft hidden sm:inline">{inLevel}/{XP_PER_LEVEL}</span>
        </div>
      </div>
      <div className="flex-1" />
      <button
        onClick={() => { toggleHint(); setIdle(false); }}
        title={t.hud.hintTitle}
        aria-label={t.hud.hint}
        className={`pointer-events-auto card px-2.5 sm:px-4 py-2 font-display font-semibold text-lg chunky flex items-center gap-2 ${showHint ? 'bg-sun text-ink-dark' : 'hover:bg-cream'} ${idle && !showHint ? 'animate-wiggle ring-2 ring-sun/70' : ''}`}
      >
        <Icon name="bulb" size={24} /> <span className="hidden md:inline">{t.hud.hint}</span>
      </button>
      <button
        onClick={() => toggleNotebook(true)}
        aria-label={t.hud.notebook}
        className="pointer-events-auto card px-2.5 sm:px-4 py-2 font-display font-semibold text-lg chunky hover:bg-cream flex items-center gap-1.5 sm:gap-2"
      >
        <Icon name="notebook" size={24} /> <span className="hidden md:inline">{t.hud.notebook}</span> <span className="bg-sun text-ink-dark rounded-full px-2 text-sm">{concepts.length}</span>
      </button>
      <div className="pointer-events-auto hidden sm:flex items-center gap-3">
        <LangToggle />
        <ThemeToggle />
      </div>
      {/* Phones: language + theme live behind one button to keep the bar on a single row. */}
      <div className="relative sm:hidden pointer-events-auto">
        <button
          onClick={() => setSettings((v) => !v)}
          aria-label={t.hud.settings}
          aria-expanded={settings}
          className={`card chunky w-11 h-11 flex items-center justify-center ${settings ? 'bg-cream' : ''}`}
        >
          <Icon name="gear" size={22} />
        </button>
        {settings && (
          <div className="absolute right-0 top-13 card chunky p-2 flex items-center gap-2 animate-pop">
            <LangToggle />
            <ThemeToggle />
          </div>
        )}
      </div>
    </div>
  );
}
