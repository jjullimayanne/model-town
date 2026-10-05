import { EventBus } from '../../bridge/EventBus';
import type { BuildingId } from '../../content/buildings';
import { useT } from '../../i18n';
import { BuildingArt } from '../art/BuildingArt';
import { useTouch } from '../common/useTouch';
import { useEffect, useState } from 'react';

export function InteractPrompt({ near }: { near: BuildingId | null }) {
  const t = useT();
  const touch = useTouch();
  if (!near) return null;
  return (
    <button
      onClick={() => EventBus.emit('building:enter', { id: near })}
      className="absolute bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 max-w-[calc(100%-1rem)] card chunky px-4 sm:px-5 py-2.5 flex items-center gap-3 animate-pop hover:bg-cream active:bg-cream ring-2 ring-sun/60"
    >
      {!touch && <kbd className="bg-bark text-cream font-display rounded-lg px-2.5 py-1 text-lg">E</kbd>}
      <BuildingArt id={near} size={36} />
      <span className="font-display text-lg font-semibold truncate">{t.hud.enter(t.buildings[near].name)}</span>
    </button>
  );
}

/** Desktop: permanent key reminder. Touch: a short tip that fades after the first few seconds. */
export function ControlsHint() {
  const t = useT();
  const touch = useTouch();
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (!touch) return;
    setShow(true);
    const id = setTimeout(() => setShow(false), 9000);
    return () => clearTimeout(id);
  }, [touch]);
  if (touch) {
    if (!show) return null;
    return (
      <div className="absolute bottom-36 md:bottom-3 left-1/2 -translate-x-1/2 md:left-3 md:translate-x-0 text-xs bg-paper/85 rounded-xl px-3 py-1.5 text-bark-soft text-center w-max max-w-[calc(100%-1rem)] animate-slide pointer-events-none">
        {t.hud.controlsTouch}
      </div>
    );
  }
  return <div className="absolute bottom-3 left-3 text-xs bg-white/70 rounded-xl px-3 py-1.5 text-bark-soft hidden md:block">{t.hud.controls}</div>;
}
