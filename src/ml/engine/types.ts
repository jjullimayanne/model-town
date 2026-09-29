import type { CleaningDecisions, CleaningReport } from '../cleaning';
import type { FeatureKey } from '../dataset';
import type { Metrics } from '../metrics';

export type Algorithm = 'logistic_regression' | 'decision_tree' | 'random_forest';

export interface ModelParams {
  max_depth?: number;
  n_estimators?: number;
  C?: number;
}

/**
 * Fully serialisable training request. This is the contract a future
 * FastAPI + scikit-learn backend implements at POST /train.
 */
export interface TrainRequest {
  datasetId: 'bridges-v1';
  cleaning: CleaningDecisions;
  features: FeatureKey[];
  algorithm: Algorithm;
  params: ModelParams;
  testSize: number;
  seed: number;
}

export interface Prediction {
  rowId: number;
  name: string;
  proba: number;
  actual: 0 | 1;
  values: Record<string, number | string | null>;
}

export interface TrainResult {
  modelId: string;
  request: TrainRequest;
  cleaningReport: CleaningReport;
  trainSize: number;
  testSize: number;
  trainMetrics: Metrics;
  testMetrics: Metrics;
  trainProba: number[];
  trainLabels: (0 | 1)[];
  testPredictions: Prediction[];
  featureImportance: { feature: FeatureKey; importance: number }[];
  complexity?: { leaves?: number };
  durationMs: number;
}

export interface MLEngine {
  readonly kind: 'local' | 'remote';
  train(req: TrainRequest): Promise<TrainResult>;
  /** Run a trained model against brand-new bridges (production traffic). */
  predictProduction(modelId: string): Promise<Prediction[]>;
}
