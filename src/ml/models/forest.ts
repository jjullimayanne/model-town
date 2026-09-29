import { createRng } from '../rng';
import { DecisionTree } from './tree';
import type { Classifier, Labels, Matrix } from './types';

/** Bagging + random feature subsets, like sklearn's RandomForestClassifier. */
export class RandomForest implements Classifier {
  private trees: DecisionTree[] = [];

  constructor(private nEstimators = 100, private maxDepth = 8, private seed = 42) {}

  fit(X: Matrix, y: Labels) {
    const rng = createRng(this.seed);
    const n = X.length;
    const d = X[0]?.length ?? 0;
    const maxFeatures = Math.max(1, Math.round(Math.sqrt(d)));
    this.trees = [];
    for (let t = 0; t < this.nEstimators; t++) {
      const bx: Matrix = [];
      const by: Labels = [];
      for (let i = 0; i < n; i++) {
        const k = Math.floor(rng() * n);
        bx.push(X[k]);
        by.push(y[k]);
      }
      const tree = new DecisionTree({ maxDepth: this.maxDepth, maxFeatures, rng });
      tree.fit(bx, by);
      this.trees.push(tree);
    }
  }

  predictProba(X: Matrix) {
    return X.map((row) => this.trees.reduce((a, t) => a + t.predictOne(row), 0) / this.trees.length);
  }

  featureImportance() {
    const acc = this.trees[0]?.featureImportance().map(() => 0) ?? [];
    for (const t of this.trees) t.featureImportance().forEach((v, j) => (acc[j] += v));
    const s = acc.reduce((a, b) => a + b, 0) || 1;
    return acc.map((v) => v / s);
  }
}
