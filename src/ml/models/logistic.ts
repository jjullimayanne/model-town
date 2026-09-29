import { sigmoid } from '../rng';
import type { Classifier, Labels, Matrix } from './types';

/** Batch gradient-descent logistic regression with L2 (C = 1/λ, like sklearn). */
export class LogisticRegression implements Classifier {
  private w: number[] = [];
  private b = 0;
  private mu: number[] = [];
  private sd: number[] = [];

  constructor(private C = 1, private maxIter = 600, private lr = 0.2) {}

  private scale(X: Matrix): Matrix {
    return X.map((row) => row.map((v, j) => (v - this.mu[j]) / this.sd[j]));
  }

  fit(X: Matrix, y: Labels) {
    const n = X.length;
    const d = X[0]?.length ?? 0;
    this.mu = Array.from({ length: d }, (_, j) => X.reduce((a, r) => a + r[j], 0) / n);
    this.sd = Array.from({ length: d }, (_, j) => {
      const v = X.reduce((a, r) => a + (r[j] - this.mu[j]) ** 2, 0) / n;
      return Math.sqrt(v) || 1;
    });
    const Xs = this.scale(X);
    this.w = new Array(d).fill(0);
    this.b = 0;
    const lambda = 1 / (this.C * n);
    for (let it = 0; it < this.maxIter; it++) {
      const gw = new Array(d).fill(0);
      let gb = 0;
      for (let i = 0; i < n; i++) {
        let z = this.b;
        for (let j = 0; j < d; j++) z += this.w[j] * Xs[i][j];
        const err = sigmoid(z) - y[i];
        for (let j = 0; j < d; j++) gw[j] += err * Xs[i][j];
        gb += err;
      }
      for (let j = 0; j < d; j++) this.w[j] -= this.lr * (gw[j] / n + lambda * this.w[j]);
      this.b -= (this.lr * gb) / n;
    }
  }

  predictProba(X: Matrix) {
    return this.scale(X).map((row) => sigmoid(row.reduce((z, v, j) => z + v * this.w[j], this.b)));
  }

  featureImportance() {
    const abs = this.w.map(Math.abs);
    const s = abs.reduce((a, b) => a + b, 0) || 1;
    return abs.map((v) => v / s);
  }
}
