import { CHUNKS, MANUAL_TEXT, type Chunk, type CitizenQuestion } from '../content/rag/manual';
import { cosine, embed } from './embeddings';
import { terms, FULL, type TextOptions } from './text';
import { countTokens } from './tokenizer';
import { hasSkill } from '../store/gameStore';

export type SearchMode = 'keyword' | 'semantic';

export interface Hit {
  chunk: Chunk;
  score: number;
}

/** Keyword search: how many of the question's terms appear in the chunk. */
function keywordScore(q: string[], chunk: Chunk, o: TextOptions) {
  const bag = new Set(terms(chunk.text, o));
  return q.filter((t) => bag.has(t)).length;
}

export function search(question: string, mode: SearchMode, o: TextOptions, k: number): Hit[] {
  const q = terms(question, mode === 'semantic' ? FULL : o);
  const qv = mode === 'semantic' ? embed(q) : [];
  return CHUNKS.map((chunk) => ({
    chunk,
    score: mode === 'semantic' ? cosine(qv, embed(terms(chunk.text, FULL))) : keywordScore(q, chunk, o),
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/** Prices are made up but proportional, like real APIs: you pay per token in and out. */
export const COINS_PER_1K_TOKENS = 250;
export const MANUAL_TOKENS = countTokens(MANUAL_TEXT);
/** The model only "reads" this many tokens; anything after it is cut. */
export const CONTEXT_WINDOW = Math.round(MANUAL_TOKENS * 0.55 / 50) * 50;
const INSTRUCTIONS = 'Você é o assistente da cidade. Responda usando só as informações abaixo.';

export interface Answer {
  question: CitizenQuestion;
  tokensIn: number;
  tokensOut: number;
  coins: number;
  correct: boolean;
  text: string;
  hits?: Hit[];
  truncated?: boolean;
}

const price = (tokens: number) => Math.max(1, Math.round((tokens / 1000) * COINS_PER_1K_TOKENS));

/** Naive: the whole manual goes into every prompt. Whatever does not fit the window is silently cut. */
export function askNaive(q: CitizenQuestion): Answer {
  const prompt = `${INSTRUCTIONS}\n\n${MANUAL_TEXT}\n\nPergunta: ${q.text}`;
  const full = countTokens(prompt);
  const tokensIn = Math.min(full, CONTEXT_WINDOW);
  // Is the answer paragraph inside the part of the manual that fit?
  const answerChunk = CHUNKS.find((c) => c.id === q.answer)!;
  const before = MANUAL_TEXT.slice(0, MANUAL_TEXT.indexOf(answerChunk.text) + answerChunk.text.length);
  const correct = countTokens(`${INSTRUCTIONS}\n\n${before}`) <= CONTEXT_WINDOW;
  return finish(q, tokensIn, correct, { truncated: full > CONTEXT_WINDOW });
}

/** RAG: search first, then send only the top-k chunks. */
export function askRag(q: CitizenQuestion, mode: SearchMode, o: TextOptions, k: number): Answer {
  const hits = search(q.text, mode, o, k).filter((h) => h.score > 0);
  const context = hits.map((h) => h.chunk.text).join('\n');
  const tokensIn = countTokens(`${INSTRUCTIONS}\n\n${context}\n\nPergunta: ${q.text}`);
  return finish(q, tokensIn, hits.some((h) => h.chunk.id === q.answer), { hits });
}

/** Centro Técnico "Prompt enxuto": shorter instructions, 20% fewer tokens sent per call. */
export const LEAN_FACTOR = 0.8;

function finish(q: CitizenQuestion, rawTokensIn: number, correct: boolean, extra: Partial<Answer>): Answer {
  const tokensIn = hasSkill('lean_prompt') ? Math.round(rawTokensIn * LEAN_FACTOR) : rawTokensIn;
  const text = correct ? q.good : q.bad;
  const tokensOut = countTokens(text);
  return { question: q, tokensIn, tokensOut, coins: price(tokensIn + tokensOut), correct, text, ...extra };
}
