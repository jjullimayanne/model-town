import { EventBus } from '../../bridge/EventBus';
import type { BuildingId } from '../../content/buildings';
import { useGame } from '../../store/gameStore';

/** Close the current building and walk the player to the next one. */
export function goTo(id: BuildingId) {
  useGame.getState().enter(null);
  setTimeout(() => EventBus.emit('player:walkTo', { id }), 50);
}
