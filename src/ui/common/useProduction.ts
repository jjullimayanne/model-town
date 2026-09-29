import { useEffect, useState } from 'react';
import { engine, type Prediction, type TrainRequest } from '../../ml/engine';
import { computeMetrics, type Metrics } from '../../ml/metrics';

export function useProduction(req?: TrainRequest, threshold = 0.5) {
  const [preds, setPreds] = useState<Prediction[] | null>(null);
  const key = req ? JSON.stringify(req) : '';
  useEffect(() => {
    let alive = true;
    if (!req) { setPreds(null); return; }
    engine.train(req).then((r) => engine.predictProduction(r.modelId)).then((p) => alive && setPreds(p));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const metrics: Metrics | null = preds ? computeMetrics(preds.map((p) => p.proba), preds.map((p) => p.actual), threshold) : null;
  return { preds, metrics };
}
