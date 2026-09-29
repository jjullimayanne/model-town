import type { IconName } from '../ui/art/Icon';
import type { ConceptId } from './concepts';

export interface WorldDef {
  id: number;
  name: string;
  icon: IconName;
  topics: string[];
  /** Concepts collectible in the notebook for this world (MVP subset). */
  concepts: ConceptId[];
  missions: string[];
  available: boolean;
}

/** Progression map. New missions plug in by id; unavailable worlds render as "em breve". */
export const WORLDS: WorldDef[] = [
  { id: 1, name: 'Fundamentos', icon: 'seed', topics: ['datasets', 'features', 'labels', 'train/test'],
    concepts: ['dataset', 'label', 'feature', 'missing_values', 'duplicates', 'outliers', 'train_test_split'], missions: ['bridges'], available: true },
  { id: 2, name: 'Machine Learning', icon: 'tree', topics: ['classificação', 'regressão', 'árvores', 'Random Forest', 'KNN'],
    concepts: ['classification', 'logistic_regression', 'decision_tree', 'random_forest'], missions: ['bridges'], available: true },
  { id: 3, name: 'Avaliação', icon: 'bars', topics: ['accuracy', 'precision', 'recall', 'F1', 'confusion matrix'],
    concepts: ['accuracy', 'confusion_matrix', 'false_negative', 'recall', 'precision', 'threshold'], missions: ['bridges'], available: true },
  { id: 4, name: 'Problemas', icon: 'overfit', topics: ['overfitting', 'underfitting', 'bias', 'variance', 'data leakage', 'class imbalance'],
    concepts: ['overfitting', 'underfitting', 'generalization'], missions: ['bridges'], available: true },
  { id: 5, name: 'Deep Learning', icon: 'brain', topics: ['neurônios', 'layers', 'activation', 'loss', 'gradient descent'], concepts: [], missions: [], available: false },
  { id: 6, name: 'Generative AI', icon: 'sparkle', topics: ['tokens', 'embeddings', 'transformers', 'attention', 'RAG', 'fine-tuning'], concepts: [], missions: [], available: false },
  { id: 7, name: 'MLOps', icon: 'gear', topics: ['deployment', 'model registry', 'monitoring', 'drift', 'retraining'],
    concepts: ['deployment', 'monitoring'], missions: ['bridges'], available: true },
];
