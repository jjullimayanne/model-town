import type { IconName } from '../ui/art/Icon';

export type ConceptId =
  | 'dataset' | 'label' | 'feature' | 'missing_values' | 'duplicates' | 'outliers' | 'train_test_split'
  | 'classification' | 'logistic_regression' | 'decision_tree' | 'random_forest'
  | 'accuracy' | 'confusion_matrix' | 'false_negative' | 'recall' | 'precision' | 'threshold'
  | 'overfitting' | 'underfitting' | 'generalization'
  | 'deployment' | 'monitoring';

export interface Concept {
  id: ConceptId;
  name: string;
  icon: IconName;
  /** One or two lines, shown only AFTER the player has experienced it. */
  insight: string;
}

export const CONCEPTS: Record<ConceptId, Concept> = {
  dataset: { id: 'dataset', name: 'Dataset', icon: 'table', insight: 'Uma coleção de exemplos. Aqui, cada linha é uma ponte que a cidade já conhece.' },
  label: { id: 'label', name: 'Label (Target)', icon: 'flag', insight: 'A resposta que o modelo deve aprender a prever. Nos dados históricos ela já é conhecida.' },
  feature: { id: 'feature', name: 'Feature', icon: 'magnifier', insight: 'Uma pista que o modelo usa para chegar à resposta. Pistas boas têm relação com o label.' },
  missing_values: { id: 'missing_values', name: 'Valores ausentes', icon: 'hole', insight: 'Buracos nos dados. Preencher com a mediana mantém as linhas sem inventar valores absurdos.' },
  duplicates: { id: 'duplicates', name: 'Duplicados', icon: 'copy', insight: 'A mesma ponte registrada duas vezes pode cair no treino E no teste: é como ver a prova antes.' },
  outliers: { id: 'outliers', name: 'Outliers', icon: 'outlier', insight: 'Valores muito fora do padrão. Às vezes são raros, às vezes são só erros de digitação.' },
  train_test_split: { id: 'train_test_split', name: 'Treino / Teste', icon: 'split', insight: 'Guardamos parte dos dados escondida para testar o modelo com pontes que ele nunca viu.' },
  classification: { id: 'classification', name: 'Classificação', icon: 'tag', insight: 'Prever uma categoria (precisa / não precisa) em vez de um número.' },
  logistic_regression: { id: 'logistic_regression', name: 'Regressão Logística', icon: 'scale', insight: 'Dá um peso a cada pista, soma tudo e transforma o total numa probabilidade.' },
  decision_tree: { id: 'decision_tree', name: 'Árvore de Decisão', icon: 'tree', insight: 'Uma sequência de perguntas de sim ou não. Quanto mais fundo, mais específicas ficam as perguntas.' },
  random_forest: { id: 'random_forest', name: 'Random Forest', icon: 'forest', insight: 'Muitas árvores, cada uma vendo um pedaço diferente dos dados, decidem por votação.' },
  accuracy: { id: 'accuracy', name: 'Accuracy', icon: 'check', insight: 'Porcentagem de acertos no geral. Parece ótima, mas trata todos os erros como se fossem iguais.' },
  confusion_matrix: { id: 'confusion_matrix', name: 'Matriz de Confusão', icon: 'grid', insight: 'Separa os acertos e os erros por tipo: quem o modelo alertou e quem ele deixou passar.' },
  false_negative: { id: 'false_negative', name: 'Falso Negativo', icon: 'crack', insight: 'Uma ponte perigosa classificada como segura. Aqui é o erro mais caro que existe.' },
  recall: { id: 'recall', name: 'Recall', icon: 'binoculars', insight: 'De todas as pontes que realmente precisavam de manutenção, quantas o modelo encontrou?' },
  precision: { id: 'precision', name: 'Precision', icon: 'target', insight: 'De todas as pontes que o modelo alertou, quantas realmente precisavam? Evita desperdiçar equipes.' },
  threshold: { id: 'threshold', name: 'Limiar de decisão', icon: 'sliders', insight: 'Baixar o limiar gera mais alertas: sobe o recall e cai a precision. É uma troca.' },
  overfitting: { id: 'overfitting', name: 'Overfitting', icon: 'overfit', insight: 'Seu modelo aprendeu muito bem os exemplos que recebeu, mas não generalizou para dados novos.' },
  underfitting: { id: 'underfitting', name: 'Underfitting', icon: 'underfit', insight: 'Modelo simples demais: erra até nos exemplos que já viu.' },
  generalization: { id: 'generalization', name: 'Generalização', icon: 'globe', insight: 'O que importa é acertar pontes novas, não decorar as antigas.' },
  deployment: { id: 'deployment', name: 'Deployment', icon: 'rocket', insight: 'Colocar o modelo para tomar decisões reais na cidade.' },
  monitoring: { id: 'monitoring', name: 'Monitoramento', icon: 'lighthouse', insight: 'Um modelo em produção precisa ser vigiado: o mundo real é a prova final.' },
};

export const CONCEPT_ICON = Object.fromEntries(Object.values(CONCEPTS).map((c) => [c.id, c.icon])) as Record<ConceptId, IconName>;
