import type { MLEngine, Prediction, TrainRequest, TrainResult } from './types';

/**
 * Future backend adapter (FastAPI + scikit-learn / PyTorch).
 * Expected endpoints:
 *   POST {baseUrl}/train               body: TrainRequest → TrainResult
 *   POST {baseUrl}/models/{id}/predict body: { dataset: "production" } → Prediction[]
 *   POST {baseUrl}/run-python          body: { code, request } → TrainResult   (Python mode)
 */
export class RemoteEngine implements MLEngine {
  readonly kind = 'remote' as const;
  constructor(private baseUrl: string) {}

  async train(req: TrainRequest): Promise<TrainResult> {
    const res = await fetch(`${this.baseUrl}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`Train failed: ${res.status}`);
    return res.json();
  }

  async predictProduction(modelId: string): Promise<Prediction[]> {
    const res = await fetch(`${this.baseUrl}/models/${encodeURIComponent(modelId)}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset: 'production' }),
    });
    if (!res.ok) throw new Error(`Predict failed: ${res.status}`);
    return res.json();
  }
}
