import type { BuildingId } from '../content/buildings';

/** Every message that crosses the React ⇄ Phaser boundary is declared here. */
export interface BusEvents {
  // Phaser → React
  'scene:ready': void;
  'building:near': { id: BuildingId | null };
  'building:enter': { id: BuildingId };
  'bridge:click': void;
  // React → Phaser
  'player:walkTo': { id: BuildingId };
  'objective:set': { id: BuildingId | null };
  'input:lock': { locked: boolean };
  'fx:celebrate': void;
  'fx:training': { on: boolean };
  'fx:deploy': void;
  'town:bridgesRepaired': { repaired: boolean; animate?: boolean };
  'lang:set': { lang: 'pt' | 'en' };
  'theme:set': { theme: 'light' | 'dark' };
}

type Handler<T> = (payload: T) => void;

class TypedBus {
  private handlers = new Map<keyof BusEvents, Set<Handler<unknown>>>();

  on<K extends keyof BusEvents>(event: K, fn: Handler<BusEvents[K]>): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(fn as Handler<unknown>);
    return () => this.handlers.get(event)?.delete(fn as Handler<unknown>);
  }

  emit<K extends keyof BusEvents>(event: K, ...payload: BusEvents[K] extends void ? [] : [BusEvents[K]]) {
    this.handlers.get(event)?.forEach((fn) => fn(payload[0]));
  }
}

export const EventBus = new TypedBus();
