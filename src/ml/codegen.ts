import type { Algorithm, ModelParams, TrainRequest } from './engine/types';
import type { FeatureKey } from './dataset';
import type { Dict } from '../i18n/pt';

const CLASS: Record<Algorithm, { module: string; name: string }> = {
  logistic_regression: { module: 'sklearn.linear_model', name: 'LogisticRegression' },
  decision_tree: { module: 'sklearn.tree', name: 'DecisionTreeClassifier' },
  random_forest: { module: 'sklearn.ensemble', name: 'RandomForestClassifier' },
};

function paramsToPy(algorithm: Algorithm, p: ModelParams, seed: number): string {
  const args: string[] = [];
  if (algorithm === 'logistic_regression') args.push(`C=${p.C ?? 1}`);
  if (algorithm === 'random_forest') args.push(`n_estimators=${p.n_estimators ?? 100}`);
  if (algorithm !== 'logistic_regression') args.push(`max_depth=${p.max_depth ?? 5}`);
  args.push(`random_state=${seed}`);
  return args.map((a) => `    ${a}`).join(',\n');
}

/** Python that is equivalent to what the visual mode configures. */
export function generatePython(req: Omit<TrainRequest, 'datasetId'>, t: Dict): string {
  const cls = CLASS[req.algorithm];
  const col = (k: keyof Dict['columns']) => t.columns[k].id;
  const feats = req.features.map((f) => `    "${col(f)}",`).join('\n');
  const fill =
    req.cleaning.missing === 'drop'
      ? 'df = df.dropna()'
      : req.cleaning.missing === 'zero'
        ? 'df = df.fillna(0)'
        : `df = df.fillna(df.${req.cleaning.missing}(numeric_only=True))`;
  const outl =
    req.cleaning.outliers === 'drop'
      ? `df = df[(df.${col('idade_da_ponte')} <= 200) & (df.${col('trafego_diario')} <= 100_000)]`
      : req.cleaning.outliers === 'cap'
        ? `df["${col('idade_da_ponte')}"] = df.${col('idade_da_ponte')}.clip(upper=90)\ndf["${col('trafego_diario')}"] = df.${col('trafego_diario')}.clip(upper=45_000)`
        : t.code.outliersKept;
  return `import pandas as pd
from sklearn.model_selection import train_test_split
from ${cls.module} import ${cls.name}

df = pd.read_csv("${t.code.csv}")
${req.cleaning.duplicates === 'drop' ? 'df = df.drop_duplicates()' : t.code.duplicatesKept}
${outl}
${fill}

features = [
${feats}
]
X = df[features]
y = df["${col('precisa_manutencao')}"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=${req.testSize},
    random_state=${req.seed}
)

model = ${cls.name}(
${paramsToPy(req.algorithm, req.params, req.seed)}
)

model.fit(X_train, y_train)
print("${t.code.trainPrint}:", model.score(X_train, y_train))
print("${t.code.testPrint}:", model.score(X_test, y_test))
`;
}

export interface ParsedPython {
  algorithm?: Algorithm;
  params: ModelParams;
  testSize?: number;
  features?: FeatureKey[];
  errors: string[];
}

/**
 * MVP "interpreter": reads the knobs the player edited in the Python code.
 * A real backend would just execute the code instead.
 */
export function parsePython(code: string, knownFeatures: FeatureKey[], t: Dict): ParsedPython {
  const errors: string[] = [];
  const out: ParsedPython = { params: {}, errors };
  const modelMatch = code.match(/model\s*=\s*(\w+)\s*\(/);
  const found = (Object.keys(CLASS) as Algorithm[]).find((a) => CLASS[a].name === modelMatch?.[1]);
  if (!modelMatch) errors.push(t.code.noModelLine);
  else if (!found) errors.push(`NameError: name '${modelMatch[1]}' is not defined`);
  else {
    out.algorithm = found;
    if (!code.includes(`import ${CLASS[found].name}`))
      errors.push(t.code.missingImport(CLASS[found].name));
  }
  const num = (re: RegExp) => {
    const m = code.match(re);
    return m ? Number(m[1]) : undefined;
  };
  const md = num(/max_depth\s*=\s*(\d+)/);
  const ne = num(/n_estimators\s*=\s*(\d+)/);
  const C = num(/\bC\s*=\s*([\d.]+)/);
  const ts = num(/test_size\s*=\s*([\d.]+)/);
  if (md !== undefined) out.params.max_depth = Math.min(Math.max(md, 1), 20);
  if (ne !== undefined) out.params.n_estimators = Math.min(Math.max(ne, 1), 300);
  if (C !== undefined) out.params.C = C;
  if (ts !== undefined) {
    if (ts <= 0 || ts >= 1) errors.push(t.code.testSizeRange);
    else out.testSize = ts;
  }
  const block = code.match(/features\s*=\s*\[([\s\S]*?)\]/);
  if (block) {
    const names = [...block[1].matchAll(/["'](\w+)["']/g)].map((m) => m[1]);
    const byName = new Map(knownFeatures.map((k) => [t.columns[k].id, k] as const));
    const bad = names.filter((n) => !byName.has(n));
    if (bad.length) errors.push(t.code.unknownColumn(bad[0]));
    else if (names.length === 0) errors.push(t.code.noFeatures);
    else out.features = names.map((n) => byName.get(n)!);
  }
  if (!/model\.fit\(\s*X_train\s*,\s*y_train\s*\)/.test(code))
    errors.push(t.code.noFit);
  return out;
}
