import type { MissionDef } from './types';

export type BridgeStep =
  | 'talk_mayor'
  | 'explore_data'
  | 'clean_data'
  | 'train_model'
  | 'evaluate'
  | 'deep_tree'
  | 'deploy_deep'
  | 'monitor'
  | 'report'
  | 'done';

export const BRIDGE_MISSION: MissionDef<BridgeStep> = {
  id: 'bridges',
  title: 'Pontes em Perigo',
  client: 'Prefeita Olívia',
  summary: 'Prever quais pontes precisam de manutenção antes que seja tarde.',
  reward: { xp: 150, coins: 2500 },
  steps: [
    { id: 'talk_mayor', objective: 'Fale com a Prefeita na Prefeitura', building: 'cityhall', xp: 20 },
    { id: 'explore_data', objective: 'Examine os registros de pontes no Data Center', building: 'datacenter', xp: 40 },
    { id: 'clean_data', objective: 'Limpe os dados no Data Cleaning Lab', building: 'cleaning', xp: 40 },
    { id: 'train_model', objective: 'Treine seu primeiro modelo no ML Lab', building: 'mllab', xp: 40 },
    { id: 'evaluate', objective: 'Descubra se o modelo é confiável no Evaluation Center', building: 'evaluation', xp: 60 },
    { id: 'deep_tree', objective: 'Aceite o desafio do Otto no ML Lab', building: 'mllab', xp: 20 },
    { id: 'deploy_deep', objective: 'Coloque o modelo "perfeito" em produção', building: 'deploy', xp: 20 },
    { id: 'monitor', objective: 'Veja o modelo trabalhando no Monitoring Center', building: 'monitoring', xp: 80 },
    { id: 'report', objective: 'Volte à Prefeitura com o resultado', building: 'cityhall', xp: 0 },
    { id: 'done', objective: 'Missão concluída! Explore a cidade', building: 'cityhall', xp: 0 },
  ],
};

export const stepIndex = (s: BridgeStep) => BRIDGE_MISSION.steps.findIndex((x) => x.id === s);
export const stepDef = (s: BridgeStep) => BRIDGE_MISSION.steps[stepIndex(s)];
