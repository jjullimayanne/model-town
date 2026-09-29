import type { Rng } from '../rng';
import type { Classifier, Labels, Matrix } from './types';

type Node =
  | { leaf: true; p: number; n: number }
  | { leaf: false; f: number; t: number; left: Node; right: Node };

export interface TreeParams {
  maxDepth: number;
  minSamplesLeaf?: number;
  /** Features considered per split (Random Forest uses sqrt(d)). */
  maxFeatures?: number;
  rng?: Rng;
}

const gini = (pos: number, n: number) => {
  if (n === 0) return 0;
  const p = pos / n;
  return 2 * p * (1 - p);
};

/** CART decision tree (Gini impurity), same idea as sklearn's DecisionTreeClassifier. */
export class DecisionTree implements Classifier {
  root: Node = { leaf: true, p: 0.5, n: 0 };
  private importance: number[] = [];
  private d = 0;

  constructor(private params: TreeParams) {}

  fit(X: Matrix, y: Labels) {
    this.d = X[0]?.length ?? 0;
    this.importance = new Array(this.d).fill(0);
    const idx = X.map((_, i) => i);
    this.root = this.build(X, y, idx, 0);
  }

  private candidateFeatures(): number[] {
    const all = Array.from({ length: this.d }, (_, i) => i);
    const k = this.params.maxFeatures;
    const rng = this.params.rng;
    if (!k || k >= this.d || !rng) return all;
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, k);
  }

  private build(X: Matrix, y: Labels, idx: number[], depth: number): Node {
    const n = idx.length;
    const pos = idx.reduce((a, i) => a + y[i], 0);
    const minLeaf = this.params.minSamplesLeaf ?? 1;
    if (depth >= this.params.maxDepth || pos === 0 || pos === n || n < 2 * minLeaf) {
      return { leaf: true, p: pos / n, n };
    }
    const parentImpurity = gini(pos, n);
    let best = { gain: 1e-9, f: -1, t: 0 };

    for (const f of this.candidateFeatures()) {
      const sorted = idx.slice().sort((a, b) => X[a][f] - X[b][f]);
      let leftPos = 0;
      for (let k = 0; k < n - 1; k++) {
        leftPos += y[sorted[k]];
        const lv = X[sorted[k]][f];
        const rv = X[sorted[k + 1]][f];
        if (lv === rv) continue;
        const nl = k + 1;
        const nr = n - nl;
        if (nl < minLeaf || nr < minLeaf) continue;
        const imp = (nl / n) * gini(leftPos, nl) + (nr / n) * gini(pos - leftPos, nr);
        const gain = parentImpurity - imp;
        if (gain > best.gain) best = { gain, f, t: (lv + rv) / 2 };
      }
    }
    if (best.f < 0) return { leaf: true, p: pos / n, n };

    this.importance[best.f] += best.gain * n;
    const l: number[] = [];
    const r: number[] = [];
    for (const i of idx) (X[i][best.f] <= best.t ? l : r).push(i);
    return {
      leaf: false,
      f: best.f,
      t: best.t,
      left: this.build(X, y, l, depth + 1),
      right: this.build(X, y, r, depth + 1),
    };
  }

  predictOne(row: number[]): number {
    let node = this.root;
    while (!node.leaf) node = row[node.f] <= node.t ? node.left : node.right;
    return node.p;
  }

  predictProba(X: Matrix) {
    return X.map((r) => this.predictOne(r));
  }

  featureImportance() {
    const s = this.importance.reduce((a, b) => a + b, 0) || 1;
    return this.importance.map((v) => v / s);
  }

  /** Number of leaves — a friendly "how complex is this tree" number for the UI. */
  leafCount(node: Node = this.root): number {
    return node.leaf ? 1 : this.leafCount(node.left) + this.leafCount(node.right);
  }
}
