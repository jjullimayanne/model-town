import { useT } from '../../i18n';
import { useGame } from '../../store/gameStore';

/** Sun / moon switch. The choice is saved with the game (localStorage). */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const t = useT();
  const theme = useGame((s) => s.theme);
  const setTheme = useGame((s) => s.setTheme);
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      onClick={() => setTheme(next)}
      className={`card chunky w-11 h-11 flex items-center justify-center hover:bg-cream ${className}`}
      title={next === 'light' ? t.hud.themeLight : t.hud.themeDark}
      aria-label={next === 'light' ? t.hud.themeLight : t.hud.themeDark}
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="#f2c46d" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="12" y1="2.5" x2="12" y2="5" transform={`rotate(${a} 12 12)`} />)}
          <circle cx="12" cy="12" r="4.8" fill="#ffd23f" />
        </svg>
      )}
    </button>
  );
}
