/**
 * Tiny hand-made word embeddings. Real ones have hundreds of dimensions learned from billions of words;
 * here each dimension is a readable theme, so the player can see WHY "lixo" lands next to "resíduos".
 * A text's embedding is the average of its words' vectors; similarity is the cosine between them.
 */
import { stem } from './text';

export const DIMS = ['limpeza', 'transporte', 'dinheiro', 'obras', 'saúde', 'educação', 'moradia', 'lazer', 'animais', 'serviços'] as const;

const GROUPS: [number, string[]][] = [
  [0, ['lixo', 'resíduos', 'coleta', 'caminhão', 'sacos', 'recicláveis', 'entulho', 'limpeza', 'recolhidos', 'calçada', 'lixeira']],
  [1, ['ônibus', 'linha', 'transporte', 'passe', 'terminal', 'trânsito', 'carros', 'caminhão', 'cartão']],
  [2, ['imposto', 'IPTU', 'tributo', 'boleto', 'pago', 'pagar', 'quitado', 'parcelas', 'desconto', 'isenção', 'renda', 'fazenda', 'dinheiro']],
  [3, ['ponte', 'pontes', 'obras', 'reparos', 'recapeamento', 'fechada', 'fechadas', 'liberada', 'travessia', 'rio']],
  [4, ['vacina', 'vacinar', 'vacinação', 'gripe', 'saúde', 'posto', 'postos', 'hospital', 'consultas', 'clínico', 'médico']],
  [5, ['escola', 'escolas', 'matrículas', 'alunos', 'merenda', 'biblioteca', 'livros', 'estudantes', 'criança']],
  [6, ['casa', 'residência', 'endereço', 'rua', 'bairro', 'moram', 'domiciliares', 'imóvel']],
  [7, ['festa', 'shows', 'cinema', 'feira', 'parque', 'fogos', 'filmes', 'artesanato', 'praça']],
  [8, ['animais', 'cães', 'gatos', 'castração', 'abrigo', 'adoção', 'zoonoses']],
  [9, ['água', 'vazamento', 'saneamento', 'lâmpada', 'postes', 'iluminação', 'aplicativo', 'telefone', 'alvará']],
];
// A few cross-theme links make the space less tidy, like real embeddings.
const LINKS: [string, number, number][] = [
  ['imposto', 6, 0.35], ['IPTU', 6, 0.5], ['casa', 2, 0.2], ['caminhão', 0, 0.4], ['rua', 0, 0.25],
  ['ônibus', 4, 0.1], ['hospital', 1, 0.15], ['biblioteca', 7, 0.3], ['feira', 2, 0.15],
];

const LEXICON = new Map<string, number[]>();
const vecFor = (word: string) => {
  const k = stem(word);
  if (!LEXICON.has(k)) LEXICON.set(k, new Array(DIMS.length).fill(0));
  return LEXICON.get(k)!;
};
for (const [dim, ws] of GROUPS) for (const w of ws) vecFor(w)[dim] = Math.max(vecFor(w)[dim], 1);
for (const [w, dim, v] of LINKS) vecFor(w)[dim] = Math.max(vecFor(w)[dim], v);

export const wordVector = (word: string): number[] | undefined => LEXICON.get(stem(word));

export function embed(stems: string[]): number[] {
  const out = new Array(DIMS.length).fill(0);
  for (const s of stems) LEXICON.get(s)?.forEach((v, i) => (out[i] += v));
  return out;
}

export function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** 2D position for the embedding map: themes sit on a circle, a word sits at the weighted mix of its themes. */
export function project(v: number[]): { x: number; y: number } {
  let x = 0, y = 0, sum = 0;
  v.forEach((w, i) => {
    const a = (i / DIMS.length) * Math.PI * 2 - Math.PI / 2;
    x += Math.cos(a) * w; y += Math.sin(a) * w; sum += w;
  });
  return sum ? { x: x / sum, y: y / sum } : { x: 0, y: 0 };
}
