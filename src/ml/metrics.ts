export interface Confusion { tp: number; fp: number; tn: number; fn: number }

export interface Metrics extends Confusion {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  total: number;
}

export function computeMetrics(proba: number[], y: (0 | 1)[], threshold = 0.5): Metrics {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  proba.forEach((p, i) => {
    const pred = p >= threshold ? 1 : 0;
    if (pred === 1 && y[i] === 1) tp++;
    else if (pred === 1) fp++;
    else if (y[i] === 1) fn++;
    else tn++;
  });
  const total = tp + fp + tn + fn;
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { tp, fp, tn, fn, total, accuracy: total ? (tp + tn) / total : 0, precision, recall, f1 };
}

export const pct = (v: number, digits = 0) => `${(v * 100).toFixed(digits)}%`;
