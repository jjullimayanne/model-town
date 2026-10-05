/**
 * Grammatical analysis for Portuguese, small enough to read in one sitting:
 * normalize (lowercase + strip accents) → drop stopwords → light stemming.
 * Each stage can be switched off so the player sees what it buys.
 */

export interface TextOptions {
  normalize: boolean;
  stopwords: boolean;
  stem: boolean;
}

export const RAW: TextOptions = { normalize: false, stopwords: false, stem: false };
export const FULL: TextOptions = { normalize: true, stopwords: true, stem: true };

export const STOPWORDS = new Set(
  ('a o as os um uma uns umas de do da dos das no na nos nas em ao aos à às por pelo pela pelos pelas para pra ' +
    'e ou que se com sem como mais mas eu tu ele ela nós eles elas meu minha meus minhas seu sua seus suas ' +
    'é são ser estar está estão foi tem têm ter há qual quais quando onde quem isso isto esse essa este esta ' +
    'me te lhe nossa nosso já não sim também muito muita até sobre entre depois antes dia')
    .split(' ')
    .flatMap((w) => [w, stripAccents(w)]),
);

export function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Splits into words (keeps accents and case unless normalizing). */
export function words(text: string): string[] {
  return text.match(/[\p{L}\p{N}]+/gu) ?? [];
}

// Ordered longest-first; the first suffix that leaves a stem of 3+ letters wins.
const SUFFIXES = [
  'amentos', 'imentos', 'amento', 'imento', 'mente', 'idades', 'idade', 'coes', 'cao', 'sões', 'soes', 'sao',
  'ando', 'endo', 'indo', 'adas', 'idas', 'ados', 'idos', 'ada', 'ida', 'ado', 'ido', 'ais', 'eis',
  'ar', 'er', 'ir', 'as', 'es', 'os', 'is', 'a', 'e', 'o', 's',
];

export function stem(word: string): string {
  const w = stripAccents(word.toLowerCase());
  for (const suf of SUFFIXES) if (w.endsWith(suf) && w.length - suf.length >= 3) return w.slice(0, -suf.length);
  return w;
}

export interface Term {
  original: string;
  /** null = removed (stopword). */
  term: string | null;
}

/** Shows each word's fate, for the grammar lab UI. */
export function analyze(text: string, o: TextOptions): Term[] {
  return words(text).map((original) => {
    let t = o.normalize ? stripAccents(original.toLowerCase()) : original;
    if (o.stopwords && STOPWORDS.has(t.toLowerCase())) return { original, term: null };
    if (o.stem) t = stem(t);
    return { original, term: t };
  });
}

export const terms = (text: string, o: TextOptions) =>
  analyze(text, o).flatMap((x) => (x.term === null ? [] : [x.term]));
