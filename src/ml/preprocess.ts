import type { BridgeRow, FeatureKey } from './dataset';
import { createRng, shuffle } from './rng';
import type { Labels, Matrix } from './models/types';

/** Turns rows into a numeric matrix. `nome_da_ponte` becomes an arbitrary id (useless on purpose). */
export function toMatrix(rows: BridgeRow[], features: FeatureKey[]): { X: Matrix; y: Labels } {
  const X = rows.map((r) =>
    features.map((f) => {
      if (f === 'nome_da_ponte') return nameCode(r.nome_da_ponte);
      return (r[f] as number | null) ?? 0;
    }),
  );
  return { X, y: rows.map((r) => r.precisa_manutencao) };
}

function nameCode(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 100_000;
  return h;
}

export function trainTestSplit<T>(rows: T[], testSize: number, seed: number): { train: T[]; test: T[] } {
  const shuffled = shuffle(rows, createRng(seed));
  const nTest = Math.round(rows.length * testSize);
  return { test: shuffled.slice(0, nTest), train: shuffled.slice(nTest) };
}
