import { NUMERIC_FEATURES, PLAUSIBLE, isOutlier, type BridgeRow, type NumericFeature } from './dataset';

export type MissingStrategy = 'drop' | 'mean' | 'median' | 'zero';
export type DuplicateStrategy = 'drop' | 'keep';
export type OutlierStrategy = 'drop' | 'cap' | 'keep';

export interface CleaningDecisions {
  missing: MissingStrategy;
  duplicates: DuplicateStrategy;
  outliers: OutlierStrategy;
}

export interface CleaningReport {
  before: number;
  after: number;
  removedDuplicates: number;
  removedOutliers: number;
  cappedOutliers: number;
  removedMissing: number;
  filledMissing: number;
  fillValues: Partial<Record<NumericFeature, number>>;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(xs.length, 1);
const median = (xs: number[]) => {
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Order matters: duplicates → outliers → missing (so fill values are not skewed by typos). */
export function cleanDataset(raw: BridgeRow[], d: CleaningDecisions): { rows: BridgeRow[]; report: CleaningReport } {
  let rows = raw.map((r) => ({ ...r }));
  const report: CleaningReport = {
    before: raw.length, after: 0, removedDuplicates: 0, removedOutliers: 0,
    cappedOutliers: 0, removedMissing: 0, filledMissing: 0, fillValues: {},
  };

  if (d.duplicates === 'drop') {
    const seen = new Set<string>();
    rows = rows.filter((r) => {
      const k = JSON.stringify(r);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    report.removedDuplicates = raw.length - rows.length;
  }

  if (d.outliers === 'drop') {
    const n = rows.length;
    rows = rows.filter((r) => !NUMERIC_FEATURES.some((c) => isOutlier(c, r[c])));
    report.removedOutliers = n - rows.length;
  } else if (d.outliers === 'cap') {
    for (const c of NUMERIC_FEATURES) {
      const valid = rows.map((r) => r[c]).filter((v): v is number => v !== null && !isOutlier(c, v));
      const hi = Math.max(...valid);
      const [lo] = PLAUSIBLE[c];
      for (const r of rows) {
        const v = r[c];
        if (v !== null && isOutlier(c, v)) {
          r[c] = v > hi ? hi : lo;
          report.cappedOutliers++;
        }
      }
    }
  }

  if (d.missing === 'drop') {
    const n = rows.length;
    rows = rows.filter((r) => NUMERIC_FEATURES.every((c) => r[c] !== null));
    report.removedMissing = n - rows.length;
  } else {
    for (const c of NUMERIC_FEATURES) {
      const present = rows.map((r) => r[c]).filter((v): v is number => v !== null);
      const fill = d.missing === 'zero' ? 0 : d.missing === 'mean' ? mean(present) : median(present);
      let filled = 0;
      for (const r of rows) if (r[c] === null) { r[c] = Math.round(fill * 10) / 10; filled++; }
      if (filled) report.fillValues[c] = Math.round(fill * 10) / 10;
      report.filledMissing += filled;
    }
  }

  report.after = rows.length;
  return { rows, report };
}
