import type { Lang } from '../../i18n';
import { useGame } from '../../store/gameStore';

export function LangToggle({ className = '' }: { className?: string }) {
  const lang = useGame((s) => s.lang);
  const setLang = useGame((s) => s.setLang);
  const opt = (l: Lang, label: string) => (
    <button
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      className={`px-3 py-1 rounded-full font-display font-semibold text-sm transition ${lang === l ? 'bg-bark text-cream' : 'text-bark hover:bg-cream'}`}
    >
      {label}
    </button>
  );
  return (
    <div className={`card chunky flex items-center gap-0.5 p-1 ${className}`} role="group" aria-label="Language / Idioma">
      {opt('pt', 'PT')}
      {opt('en', 'EN')}
    </div>
  );
}
