import { useGame } from '../store/gameStore';
import { en } from './en';
import { pt, type Dict } from './pt';

export type Lang = 'pt' | 'en';
export type { Dict };

const DICTS: Record<Lang, Dict> = { pt, en };

export const getDict = (lang: Lang): Dict => DICTS[lang];

/** Current dictionary for React components; re-renders when the player switches language. */
export function useT(): Dict {
  return DICTS[useGame((s) => s.lang)];
}

/** Non-React access (store actions, Phaser). */
export const currentDict = (): Dict => DICTS[useGame.getState().lang];
