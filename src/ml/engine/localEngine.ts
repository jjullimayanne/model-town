import { cleanDataset } from '../cleaning';
import { getProductionBridges, getRawBridgeDataset, type BridgeRow, type FeatureKey } from '../dataset';
import { computeMetrics } from '../metrics';
import { LogisticRegression } from '../models/logistic';
import { DecisionTree } from '../models/tree';
import { RandomForest } from '../models/forest';
import type { Classifier } from '../models/types';
import { toMatrix, trainTestSplit } from '../preprocess';
import type { MLEngine, Prediction, TrainRequest, TrainResult } from './types';

function makeModel(req: TrainRequest): Classifier {
  switch (req.algorithm) {
    case 'logistic_regression':
      return new LogisticRegression(req.params.C ?? 1);
    case 'decision_tree':
      return new DecisionTree({ maxDepth: req.params.max_depth ?? 5 });
    case 'random_forest':
      return new RandomForest(req.params.n_estimators ?? 100, req.params.max_depth ?? 8, req.seed);
  }
}

function toPredictions(rows: BridgeRow[], proba: number[], features: FeatureKey[]): Prediction[] {
  return rows.map((r, i) => ({
    rowId: r.id,
    name: r.nome_da_ponte,
    proba: proba[i],
    actual: r.precisa_manutencao,
    values: Object.fromEntries(features.map((f) => [f, r[f]])),
  }));
}

export const requestKey = (req: TrainRequest) => JSON.stringify(req);

/** Runs the whole pipeline in the browser. Deterministic: same request → same model. */
export class LocalEngine implements MLEngine {
  readonly kind = 'local' as const;
  private models = new Map<string, { model: Classifier; req: TrainRequest }>();
  private results = new Map<string, TrainResult>();

  async train(req: TrainRequest): Promise<TrainResult> {
    const key = requestKey(req);
    const cached = this.results.get(key);
    if (cached) return cached;
    return this.trainSync(req);
  }

  trainSync(req: TrainRequest): TrainResult {
    const key = requestKey(req);
    const t0 = performance.now();
    const { rows, report } = cleanDataset(getRawBridgeDataset(), req.cleaning);
    const { train, test } = trainTestSplit(rows, req.testSize, req.seed);
    const tr = toMatrix(train, req.features);
    const te = toMatrix(test, req.features);

    const model = makeModel(req);
    model.fit(tr.X, tr.y);
    const trainProba = model.predictProba(tr.X);
    const testProba = model.predictProba(te.X);

    const result: TrainResult = {
      modelId: key,
      request: req,
      cleaningReport: report,
      trainSize: train.length,
      testSize: test.length,
      trainMetrics: computeMetrics(trainProba, tr.y),
      testMetrics: computeMetrics(testProba, te.y),
      trainProba,
      trainLabels: tr.y,
      testPredictions: toPredictions(test, testProba, req.features),
      featureImportance: model
        .featureImportance()
        .map((importance, j) => ({ feature: req.features[j], importance }))
        .sort((a, b) => b.importance - a.importance),
      complexity: model instanceof DecisionTree ? { leaves: model.leafCount() } : undefined,
      durationMs: performance.now() - t0,
    };
    this.models.set(key, { model, req });
    this.results.set(key, result);
    return result;
  }

  async predictProduction(modelId: string): Promise<Prediction[]> {
    let entry = this.models.get(modelId);
    if (!entry) {
      this.trainSync(JSON.parse(modelId) as TrainRequest);
      entry = this.models.get(modelId)!;
    }
    const rows = getProductionBridges();
    const { X } = toMatrix(rows, entry.req.features);
    return toPredictions(rows, entry.model.predictProba(X), entry.req.features);
  }
}
