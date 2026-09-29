import { EventBus } from '../../bridge/EventBus';
import type { BuildingId } from '../../content/buildings';
import { useT } from '../../i18n';
import { BuildingArt } from '../art/BuildingArt';

export function InteractPrompt({ near }: { near: BuildingId | null }) {
  const t = useT();
  if (!near) return null;
  return (
    <button
      onClick={() => EventBus.emit('building:enter', { id: near })}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 card chunky px-5 py-2.5 flex items-center gap-3 animate-pop hover:bg-cream"
    >
      <kbd className="bg-bark text-cream font-display rounded-lg px-2.5 py-1 text-lg">E</kbd>
      <BuildingArt id={near} size={36} />
      <span className="font-display text-lg font-semibold">{t.hud.enter(t.buildings[near].name)}</span>
    </button>
  );
}

export function ControlsHint() {
  const t = useT();
  return <div className="absolute bottom-3 left-3 text-xs bg-white/70 rounded-xl px-3 py-1.5 text-bark-soft">{t.hud.controls}</div>;
}
