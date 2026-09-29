import { useEffect } from 'react';
import { CONCEPT_ICON } from '../../content/concepts';
import { WORLDS } from '../../content/worlds';
import { useT } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { Icon } from '../art/Icon';

/** The player's collection of discovered concepts — the game's "inventory". */
export function NotebookPanel() {
  const t = useT();
  const { showNotebook, toggleNotebook, concepts } = useGame();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && toggleNotebook(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleNotebook]);
  if (!showNotebook) return null;
  const got = new Set(concepts);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-bark/25 p-4" onMouseDown={(e) => e.target === e.currentTarget && toggleNotebook(false)}>
      <div className="w-full max-w-5xl h-[88vh] wood rounded-[28px] flex flex-col overflow-hidden animate-pop">
        <div className="flex items-center px-6 py-4 gap-3">
          <Icon name="notebook" size={44} />
          <div className="flex-1">
            <div className="font-display text-3xl font-semibold">{t.notebook.title}</div>
            <div className="text-sm text-bark-soft">{t.notebook.subtitle}</div>
          </div>
          <button onClick={() => toggleNotebook(false)} className="w-10 h-10 rounded-full bg-white/70 hover:bg-white flex items-center justify-center" title={t.common.close}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-soft px-6 pb-6 space-y-5">
          {WORLDS.map((w) => (
            <div key={w.id}>
              <div className="font-display text-lg font-semibold mb-2 flex items-center gap-2">
                <Icon name={w.available ? w.icon : 'lock'} size={26} /> {t.mission.world(w.id)} · {t.worlds[w.id].name}
                {!w.available && <span className="text-xs bg-bark/10 rounded-full px-2 py-0.5">{t.notebook.soon(t.worlds[w.id].topics.join(', '))}</span>}
              </div>
              {w.concepts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {w.concepts.map((id) => {
                    const has = got.has(id);
                    return (
                      <div key={id} className={`rounded-2xl p-3 border-3 ${has ? 'bg-paper border-sun/60' : 'bg-bark/5 border-dashed border-bark/15'}`}>
                        <Icon name={has ? CONCEPT_ICON[id] : 'question'} size={40} className={has ? '' : 'opacity-50'} />
                        <div className="font-display font-semibold mt-1">{has ? t.concepts[id].name : t.notebook.locked}</div>
                        <div className="text-xs leading-snug text-bark-soft mt-1">{has ? t.concepts[id].insight : t.notebook.keepPlaying}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
