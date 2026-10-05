/**
 * A toy subword tokenizer that behaves like the real ones (BPE) in the ways that matter for cost:
 * frequent words are one token, rare/long words split into pieces, accents and punctuation cost extra.
 * Real tokenizers learn their vocabulary from data; this one has a small hand-written vocabulary.
 */
import { stripAccents } from './text';

const WHOLE = new Set(
  ('a o e de do da em no na que para por com um uma os as se ao mais não sim como seu sua dia rua casa ' +
    'cidade ponte pontes lixo hora horas onde quando qual sobre the and of to in is it you for on ' +
    'bairro centro posto ônibus escola parque feira água luz').split(' '),
);
const PIECES = [
  'ção', 'ções', 'mente', 'idade', 'amento', 'agem', 'ador', 'eira', 'inho', 'ando', 'endo', 'ados', 'adas',
  'pre', 'pro', 'des', 'res', 'con', 'trans', 'inter', 'muni', 'cipal', 'coleta', 'imposto', 'vacina',
  'biblio', 'teca', 'feira', 'saúde', 'tribut', 'boleto',
].sort((a, b) => b.length - a.length);

export interface Token {
  text: string;
  /** Index in the palette, so neighbouring tokens get different colors. */
  color: number;
}

function splitWord(word: string): string[] {
  const low = word.toLowerCase();
  if (WHOLE.has(low)) return [word];
  const out: string[] = [];
  let i = 0;
  while (i < word.length) {
    const rest = low.slice(i);
    const piece = PIECES.find((p) => rest.startsWith(p));
    const len = piece ? piece.length : Math.min(3, word.length - i);
    out.push(word.slice(i, i + len));
    i += len;
  }
  // Accented letters live outside the common byte range: each one costs an extra token.
  const accents = [...word].filter((c) => stripAccents(c) !== c).length;
  for (let k = 0; k < accents; k++) out.push('·');
  return out;
}

export function tokenize(text: string): Token[] {
  const parts = text.match(/\s*[\p{L}\p{N}]+|\s*[^\s\p{L}\p{N}]/gu) ?? [];
  const tokens: Token[] = [];
  for (const p of parts) {
    const space = p.match(/^\s*/)![0] ? ' ' : '';
    const body = p.trim();
    if (!/[\p{L}\p{N}]/u.test(body)) {
      tokens.push({ text: space + body, color: tokens.length % 6 });
      continue;
    }
    splitWord(body).forEach((piece, i) => tokens.push({ text: (i === 0 ? space : '') + piece, color: tokens.length % 6 }));
  }
  return tokens;
}

export const countTokens = (text: string) => tokenize(text).length;
