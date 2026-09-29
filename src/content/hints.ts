import type { Dict } from '../i18n/pt';
import type { BridgeMissionState } from '../store/gameStore';
import type { BuildingId } from './buildings';
import type { ConceptId } from './concepts';

/**
 * Context-aware hints, three layers so the player picks how much help to get:
 *   explain → the AI idea behind this moment · steps → what to do next · direct → the answer (on request)
 */
export interface Hint {
  title: string;
  concept?: ConceptId;
  explain: string;
  steps: string[];
  direct: string;
  building: BuildingId;
}

type Key = keyof Dict['hints']['items'];

function pick(m: BridgeMissionState): { key: Key; building: BuildingId; concept?: ConceptId } {
  const f = m.flags;
  switch (m.step) {
    case 'talk_mayor': return { key: 'talk_mayor', building: 'cityhall' };
    case 'explore_data': return f.dc_label ? { key: 'features', building: 'datacenter', concept: 'feature' } : { key: 'label', building: 'datacenter', concept: 'label' };
    case 'clean_data': return { key: 'clean', building: 'cleaning', concept: 'missing_values' };
    case 'train_model': return { key: 'train', building: 'mllab', concept: 'train_test_split' };
    case 'evaluate':
      if (!f.ev_seen) return { key: 'evalReveal', building: 'evaluation', concept: 'confusion_matrix' };
      if (!f.ev_incident) return { key: 'evalIncident', building: 'evaluation', concept: 'false_negative' };
      return { key: 'evalTune', building: 'evaluation', concept: 'threshold' };
    case 'deep_tree': return { key: 'deep', building: 'mllab', concept: 'decision_tree' };
    case 'deploy_deep': return { key: 'deploy', building: 'deploy', concept: 'deployment' };
    case 'monitor':
      if (!f.mon_stream1) return { key: 'monWatch', building: 'monitoring', concept: 'monitoring' };
      if (!f.mon_investigated) return { key: 'monWhy', building: 'monitoring', concept: 'generalization' };
      if (!m.finalModel) return { key: 'monFix', building: 'monitoring', concept: 'overfitting' };
      return { key: 'monConfirm', building: 'monitoring', concept: 'monitoring' };
    case 'report': return { key: 'report', building: 'cityhall' };
    case 'done': return { key: 'done', building: 'mllab' };
  }
}

export function getHint(m: BridgeMissionState, t: Dict): Hint {
  const { key, building, concept } = pick(m);
  const item = t.hints.items[key] as { title: string; explain: string; steps: string[]; direct: string };
  let steps = item.steps;
  if (key === 'clean') {
    const p = t.hints.items.cleanPending;
    const pending = [!m.cleaning.missing && p.missing, !m.cleaning.duplicates && p.duplicates, !m.cleaning.outliers && p.outliers].filter(Boolean) as string[];
    steps = pending.length ? [...pending, p.tryIt] : [p.allDone];
  }
  return { title: item.title, explain: item.explain, steps, direct: item.direct, building, concept };
}
