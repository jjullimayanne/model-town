import type { IconName } from '../../ui/art/Icon';
import type { ConceptId } from '../concepts';

/**
 * Centro Técnico: courses bought with town coins. Each one is a short lesson + one question;
 * passing it unlocks a skill that changes a real mechanic somewhere in town.
 */
export type CourseId =
  | 'lean_prompt' | 'data_reading' | 'outlier_detective' | 'hyper_intuition' | 'cross_validation'
  | 'python_pro' | 'wise_owl' | 'city_budget' | 'proactive_monitoring';

export interface Course {
  id: CourseId;
  name: string;
  icon: IconName;
  price: number;
  /** What the skill does, in one line. */
  effect: string;
  /** Where the player will notice it. */
  where: string;
  concept?: ConceptId;
  lesson: { text: string[]; question: string; options: string[]; correct: number; why: string };
}

export const COURSES: Course[] = [
  {
    id: 'lean_prompt', name: 'Prompt enxuto', icon: 'scissors', price: 800, concept: 'prompt_engineering',
    effect: '−20% de tokens em toda chamada de IA', where: 'Custo do chatbot (painel da Lu e testes no celular)',
    lesson: {
      text: [
        'Toda chamada de IA leva instruções + contexto + pergunta. Instruções longas e repetidas são pagas em toda chamada.',
        'Prompt enxuto: instruções curtas e diretas, sem repetir regras, e só o contexto necessário.',
      ],
      question: 'Qual destas mudanças economiza tokens sem piorar a resposta?',
      options: ['Repetir as regras duas vezes para a IA não esquecer', 'Trocar 3 parágrafos de instrução por 2 frases claras', 'Mandar o manual inteiro "por garantia"'],
      correct: 1, why: 'Instrução clara e curta diz o mesmo com menos tokens. Repetir regra ou mandar tudo só aumenta a conta.',
    },
  },
  {
    id: 'data_reading', name: 'Leitura de dados', icon: 'magnifier', price: 600, concept: 'correlation',
    effect: 'Mostra a correlação de cada coluna com o label', where: 'Data Center (cabeçalho da tabela)',
    lesson: {
      text: [
        'Correlação mede o quanto duas colunas andam juntas: vai de −1 (uma sobe, a outra desce) a +1 (sobem juntas). Perto de 0 = pouca relação.',
        'Uma feature com correlação alta com o label costuma ser uma boa pista. Mas correlação não é causa!',
      ],
      question: 'A coluna "idade da ponte" tem correlação +0,5 com "precisa de manutenção". O que isso indica?',
      options: ['Pontes mais velhas tendem a precisar mais de manutenção', 'A idade causa 50% dos problemas', 'Não tem relação nenhuma'],
      correct: 0, why: 'Correlação positiva: quando uma sobe, a outra tende a subir. Ela mostra tendência, não prova causa.',
    },
  },
  {
    id: 'outlier_detective', name: 'Detetive de outliers', icon: 'outlier', price: 600, concept: 'iqr',
    effect: 'Destaca os valores suspeitos automaticamente', where: 'Data Cleaning Lab (estação de outliers)',
    lesson: {
      text: [
        'Uma regra clássica para achar outliers é o IQR: pegue o intervalo entre o 1º e o 3º quartil (onde está a metade do meio dos dados).',
        'Valores muito abaixo ou muito acima desse intervalo (1,5 × IQR) são suspeitos. Suspeito não é errado: investigue antes de apagar.',
      ],
      question: 'Uma ponte aparece com 312 anos de idade e a cidade foi fundada há 120. O que fazer?',
      options: ['Manter, é um dado raro e valioso', 'Tratar como erro de digitação (corrigir ou limitar)', 'Apagar a coluna de idade inteira'],
      correct: 1, why: 'Um valor impossível é erro de registro. Corrigir ou limitar mantém a linha sem enganar o modelo.',
    },
  },
  {
    id: 'hyper_intuition', name: 'Intuição de hiperparâmetros', icon: 'sliders', price: 1000, concept: 'hyperparameters',
    effect: 'Prevê o risco de overfitting antes de treinar', where: 'ML Lab (abaixo dos parâmetros)',
    lesson: {
      text: [
        'Hiperparâmetros são as escolhas que você faz antes de treinar: profundidade da árvore, número de árvores, regularização (C).',
        'Árvore muito funda decora os dados (overfitting). Árvore rasa demais nem aprende (underfitting). O ponto bom fica no meio.',
      ],
      question: 'Uma árvore com profundidade 15 tem 100% no treino e 70% no teste. O que mexer?',
      options: ['Aumentar a profundidade para 20', 'Diminuir a profundidade', 'Usar menos dados de teste'],
      correct: 1, why: 'A distância entre treino e teste é sinal de overfitting. Uma árvore mais rasa generaliza melhor.',
    },
  },
  {
    id: 'cross_validation', name: 'Validação cruzada', icon: 'split', price: 1200, concept: 'cross_validation',
    effect: 'Nova ferramenta: avaliar o modelo em 5 divisões diferentes', where: 'Evaluation Center (fim do painel)',
    lesson: {
      text: [
        'Uma única divisão treino/teste pode dar sorte (ou azar). Na validação cruzada, os dados são divididos em 5 partes (folds).',
        'O modelo treina 5 vezes, cada vez testando numa parte diferente. A média mostra o desempenho de verdade, e a variação mostra o quanto ele é estável.',
      ],
      question: 'Por que a validação cruzada é mais confiável que um único teste?',
      options: ['Porque usa um modelo mais forte', 'Porque testa em várias divisões e tira a média', 'Porque não precisa de dados de teste'],
      correct: 1, why: 'Avaliar em várias divisões reduz a chance de um resultado de sorte.',
    },
  },
  {
    id: 'python_pro', name: 'Python avançado', icon: 'code', price: 1000, concept: 'sklearn',
    effect: 'Trechos de código prontos no modo Python', where: 'ML Lab (modo Python)',
    lesson: {
      text: [
        'No mundo real, modelos são treinados com bibliotecas como o scikit-learn: você escolhe o modelo, chama .fit() para treinar e .predict() para prever.',
        'Trocar de modelo é trocar uma linha: RandomForestClassifier, DecisionTreeClassifier, LogisticRegression…',
      ],
      question: 'No scikit-learn, qual método treina o modelo?',
      options: ['model.fit(X_treino, y_treino)', 'model.train_all()', 'model.predict(X_treino)'],
      correct: 0, why: '.fit() aprende com os dados de treino; .predict() usa o que foi aprendido.',
    },
  },
  {
    id: 'wise_owl', name: 'Coruja sábia', icon: 'bulb', price: 400,
    effect: 'A Tuca já mostra a pista direta, sem precisar pedir', where: 'Botão Pista',
    lesson: {
      text: ['A Tuca estudou com você! Com este curso, ela já abre a pista direta junto com a explicação.', 'Use com sabedoria: tentar sozinho primeiro ainda é o jeito que mais ensina.'],
      question: 'Qual é o melhor jeito de usar uma pista?',
      options: ['Ler a resposta antes de tentar', 'Tentar, errar, e então ler a explicação', 'Nunca usar pistas'],
      correct: 1, why: 'Tentar antes faz a explicação fazer sentido, e você lembra por mais tempo.',
    },
  },
  {
    id: 'city_budget', name: 'Orçamento da cidade', icon: 'coin', price: 1500,
    effect: '+10% de moedas em todas as recompensas', where: 'Toda vez que você ganhar moedas',
    lesson: {
      text: ['Projeto bem entregue gera confiança, e confiança gera orçamento.', 'Com este curso de gestão, a Prefeitura passa a pagar 10% a mais em cada recompensa.'],
      question: 'Uma recompensa de 2.000 moedas, com o bônus, vira quanto?',
      options: ['2.010', '2.200', '2.100'],
      correct: 1, why: '10% de 2.000 são 200, então 2.000 + 200 = 2.200.',
    },
  },
  {
    id: 'proactive_monitoring', name: 'Monitoramento proativo', icon: 'lighthouse', price: 900, concept: 'drift',
    effect: 'Alerta de drift antes de o problema estourar', where: 'Monitoring Center (painel da Lu)',
    lesson: {
      text: [
        'Drift é quando o mundo muda e o modelo não acompanha: aparecem perguntas novas, comportamentos novos, dados diferentes dos do treino.',
        'Monitorar de forma proativa é vigiar esses sinais e agir antes de os usuários reclamarem.',
      ],
      question: 'As perguntas sobre "eventos" cresceram 40% e o manual não fala de eventos. Isso é sinal de…',
      options: ['Drift: o uso mudou e a base não cobre', 'Overfitting do chatbot', 'Nada, é normal'],
      correct: 0, why: 'O mundo mudou (novas perguntas) e a base de conhecimento não acompanhou. É hora de atualizar.',
    },
  },
];

export const COURSE_BY_ID = Object.fromEntries(COURSES.map((c) => [c.id, c])) as Record<CourseId, Course>;
