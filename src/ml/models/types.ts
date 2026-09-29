export type Matrix = number[][];
export type Labels = (0 | 1)[];

export interface Classifier {
  fit(X: Matrix, y: Labels): void;
  /** Probability of class 1 ("precisa manutenção") for each row. */
  predictProba(X: Matrix): number[];
  /** Relative importance per feature column (sums to ~1). */
  featureImportance(): number[];
}
