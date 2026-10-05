import { briefedFlag, doneFlag, RAG_BUILDING, UNREAD } from '../../content/missions/ragMission';
import { useShallow } from 'zustand/react/shallow';
import { useGame } from '../../store/gameStore';

/** Where quest 2 stands right now: which building to visit, and whether the Mayor has news. */
export function useRagStatus() {
  return useGame(useShallow((s) => {
    const active = s.activeMission === 'rag';
    const step = s.rag.step;
    const building = RAG_BUILDING[step] ?? null;
    const briefed = !!s.rag.flags[briefedFlag(step)];
    const done = !!s.rag.flags[doneFlag(step)];
    return {
      active,
      step,
      building,
      briefed,
      done,
      unread: !!s.rag.flags[UNREAD],
      /** The building the player should walk to now (null = talk to the Mayor on the phone). */
      target: active && building && briefed && !done ? building : null,
    };
  }));
}
