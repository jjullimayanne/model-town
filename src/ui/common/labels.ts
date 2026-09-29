import type { Dict } from '../../i18n/pt';
import type { FeatureKey } from '../../ml/dataset';
import type { Algorithm, ModelParams } from '../../ml/engine/types';
import { useGame } from '../../store/gameStore';
import type { IconName } from '../art/Icon';

export type ColumnKey = FeatureKey | 'precisa_manutencao';

export const COLUMN_ICON: Record<ColumnKey, IconName> = {
  nome_da_ponte: 'tag',
  idade_da_ponte: 'hourglass',
  trafego_diario: 'car',
  umidade_media: 'drop',
  anos_desde_manutencao: 'wrench',
  numero_de_chuvas: 'rain',
  numero_de_inspecoes: 'clipboard',
  precisa_manutencao: 'flag',
};

export const ALGO_ICON: Record<Algorithm, IconName> = {
  logistic_regression: 'scale',
  decision_tree: 'tree',
  random_forest: 'forest',
};

/** Column name as shown to the player (and used in the generated Python) in the current language. */
export const colName = (t: Dict, key: ColumnKey) => t.columns[key].id;

export const describeModel = (t: Dict, a: Algorithm, p: ModelParams) =>
  a === 'logistic_regression' ? t.model.lr(p.C ?? 1)
  : a === 'decision_tree' ? t.model.tree(p.max_depth ?? 5)
  : t.model.rf(p.n_estimators ?? 100, p.max_depth ?? 8);

export const fmt = (v: unknown) =>
  v === null || v === undefined ? '—'
  : typeof v === 'number' ? v.toLocaleString(useGame.getState().lang === 'en' ? 'en-US' : 'pt-BR')
  : String(v);
