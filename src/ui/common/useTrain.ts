import { useEffect, useState } from 'react';
import { engine, type TrainRequest, type TrainResult } from '../../ml/engine';

/** Resolves a (deterministic) training request to its result. Re-uses the engine cache. */
export function useTrainResult(req?: TrainRequest) {
  const [result, setResult] = useState<TrainResult | null>(null);
  const key = req ? JSON.stringify(req) : '';
  useEffect(() => {
    let alive = true;
    if (!req) { setResult(null); return; }
    engine.train(req).then((r) => alive && setResult(r));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return result;
}
