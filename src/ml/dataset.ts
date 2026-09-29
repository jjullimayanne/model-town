import { clamp, createRng, normal, shuffle, sigmoid, uniform, type Rng } from './rng';

export const NUMERIC_FEATURES = [
  'idade_da_ponte',
  'trafego_diario',
  'umidade_media',
  'anos_desde_manutencao',
  'numero_de_chuvas',
  'numero_de_inspecoes',
] as const;

export type NumericFeature = (typeof NUMERIC_FEATURES)[number];
export type FeatureKey = NumericFeature | 'nome_da_ponte';
export const TARGET = 'precisa_manutencao' as const;

export interface BridgeRow {
  id: number;
  nome_da_ponte: string;
  idade_da_ponte: number | null;
  trafego_diario: number | null;
  umidade_media: number | null;
  anos_desde_manutencao: number | null;
  numero_de_chuvas: number | null;
  numero_de_inspecoes: number | null;
  precisa_manutencao: 0 | 1;
}

const PLACES = [
  'Riacho', 'Moinho', 'Castanheira', 'Vale Azul', 'Pedra Lisa', 'Girassol', 'Lago Manso', 'Ipê',
  'Colina', 'Farol', 'Pomar', 'Sabiá', 'Três Rios', 'Jardim', 'Vila Nova', 'Bambuzal',
  'Cachoeira', 'Pinheiro', 'Ribeirão', 'Morro Alto', 'Estação', 'Figueira', 'Lavanda', 'Beija-Flor', 'Horta',
];
const SUFFIXES = [
  'Velha', 'Nova', 'do Norte', 'do Sul', 'Leste', 'Oeste', 'Pequena', 'Grande', 'de Pedra', 'de Ferro',
  'Alta', 'Baixa', 'Central', 'do Mercado', 'da Escola', 'da Praça', 'do Parque', 'Dourada', 'Verde', 'Antiga',
];

function bridgeName(i: number): string {
  const place = PLACES[i % PLACES.length];
  const suffix = SUFFIXES[Math.floor(i / PLACES.length) % SUFFIXES.length];
  return `Ponte ${place} ${suffix}`;
}

/**
 * The hidden "physics" of Model Town bridges. Labels are sampled from a probability,
 * so there is irreducible noise: a model that fits the training set perfectly
 * is memorising noise — which is exactly what makes overfitting show up for real.
 */
function sampleBridge(rng: Rng, id: number, nameIdx: number): BridgeRow {
  const idade = Math.round(uniform(rng, 3, 90));
  const trafego = Math.round(clamp(Math.exp(normal(rng, 8.9, 0.55)), 800, 45000));
  const umidade = Math.round(clamp(normal(rng, 66, 12), 35, 98));
  const anos = Math.round(clamp(Math.min(idade, -Math.log(Math.max(rng(), 1e-6)) * 7), 0, 30));
  const chuvas = Math.round(clamp(40 + (umidade - 35) * 1.4 + normal(rng, 0, 14), 20, 190));
  const insp = Math.round(clamp(normal(rng, 4.5, 2.2), 0, 10));

  const z =
    0.03 * (idade - 46) +
    0.00007 * (trafego - 8000) +
    0.028 * (umidade - 66) +
    0.17 * (anos - 6) +
    0.006 * (chuvas - 100) -
    0.33 * (insp - 4.5) -
    0.35;
  const label: 0 | 1 = rng() < sigmoid(2.4 * z) ? 1 : 0;

  return {
    id,
    nome_da_ponte: bridgeName(nameIdx),
    idade_da_ponte: idade,
    trafego_diario: trafego,
    umidade_media: umidade,
    anos_desde_manutencao: anos,
    numero_de_chuvas: chuvas,
    numero_de_inspecoes: insp,
    precisa_manutencao: label,
  };
}

export interface DatasetIssues {
  missing: { column: NumericFeature; count: number }[];
  duplicates: number;
  outliers: { column: NumericFeature; count: number; example: number }[];
}

export const DATASET_SEED = 1207;
const UNIQUE = 480;
const DUPES = 20;

let cachedRaw: BridgeRow[] | null = null;

/** The historical dataset the City Hall hands over: 500 rows, intentionally dirty. */
export function getRawBridgeDataset(): BridgeRow[] {
  if (cachedRaw) return cachedRaw;
  const rng = createRng(DATASET_SEED);
  const rows: BridgeRow[] = [];
  for (let i = 0; i < UNIQUE; i++) rows.push(sampleBridge(rng, i + 1, i));

  // Missing values (sensor offline / forms left blank)
  const pick = (n: number) => shuffle(rows.map((_, i) => i), rng).slice(0, n);
  for (const i of pick(28)) rows[i].umidade_media = null;
  for (const i of pick(14)) rows[i].numero_de_inspecoes = null;

  // Outliers (typing errors)
  for (const i of pick(4)) rows[i].idade_da_ponte = 999;
  for (const i of pick(3)) rows[i].trafego_diario = 9_999_999;

  // Duplicates (the same form was submitted twice)
  const dupSources = pick(DUPES);
  const withDupes = rows.slice();
  for (const i of dupSources) {
    const insertAt = Math.floor(rng() * withDupes.length);
    withDupes.splice(insertAt, 0, { ...rows[i] });
  }
  cachedRaw = withDupes;
  return withDupes;
}

export function detectIssues(rows: BridgeRow[]): DatasetIssues {
  const missing = NUMERIC_FEATURES.map((column) => ({
    column,
    count: rows.filter((r) => r[column] === null).length,
  })).filter((m) => m.count > 0);

  const seen = new Set<string>();
  let duplicates = 0;
  for (const r of rows) {
    const key = JSON.stringify(r);
    if (seen.has(key)) duplicates++;
    else seen.add(key);
  }

  const outliers = NUMERIC_FEATURES.map((column) => {
    const bad = rows.filter((r) => isOutlier(column, r[column]));
    return { column, count: bad.length, example: bad[0]?.[column] ?? 0 };
  }).filter((o) => o.count > 0);

  return { missing, duplicates, outliers };
}

/** Plausible physical ranges — anything outside is a data-entry error. */
export const PLAUSIBLE: Record<NumericFeature, [number, number]> = {
  idade_da_ponte: [0, 200],
  trafego_diario: [0, 100_000],
  umidade_media: [0, 100],
  anos_desde_manutencao: [0, 200],
  numero_de_chuvas: [0, 365],
  numero_de_inspecoes: [0, 50],
};

export function isOutlier(column: NumericFeature, v: number | null): boolean {
  if (v === null) return false;
  const [lo, hi] = PLAUSIBLE[column];
  return v < lo || v > hi;
}

let cachedProd: BridgeRow[] | null = null;

/** Brand-new bridges the model will meet after deployment (never seen in training). */
export function getProductionBridges(): BridgeRow[] {
  if (cachedProd) return cachedProd;
  const rng = createRng(DATASET_SEED * 7 + 3);
  const rows: BridgeRow[] = [];
  for (let i = 0; i < 240; i++) rows.push(sampleBridge(rng, 10_000 + i, UNIQUE + i));
  cachedProd = rows;
  return rows;
}
