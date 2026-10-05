import type { BuildingId } from '../buildings';
import type { ConceptId } from '../concepts';

export type RagStep = 'ring' | 'naive' | 'tokens' | 'keyword' | 'grammar' | 'embeddings' | 'final' | 'done';

export const RAG_STEPS: { id: RagStep; objective: string; xp: number }[] = [
  { id: 'ring', objective: 'Seu celular está tocando! Atenda', xp: 10 },
  { id: 'naive', objective: 'Teste o chatbot mandando o manual inteiro', xp: 30 },
  { id: 'tokens', objective: 'Descubra o que é um token', xp: 30 },
  { id: 'keyword', objective: 'Busque só os trechos certos (RAG)', xp: 40 },
  { id: 'grammar', objective: 'Use análise gramatical na busca', xp: 40 },
  { id: 'embeddings', objective: 'Busque por significado com embeddings', xp: 60 },
  { id: 'final', objective: 'Ajuste o top-k e entregue o chatbot', xp: 60 },
  { id: 'done', objective: 'Veja o que os moradores acham do chatbot', xp: 0 },
];

export const ragIndex = (s: RagStep) => RAG_STEPS.findIndex((x) => x.id === s);

/** Where each step's hands-on work happens. The phone is only for talking to the Mayor. */
export const RAG_BUILDING: Partial<Record<RagStep, BuildingId>> = {
  naive: 'datacenter', tokens: 'mllab', keyword: 'datacenter', grammar: 'cleaning', embeddings: 'mllab', final: 'evaluation',
  // After shipping: the celebration card sends you to Lu's satisfaction dashboard.
  done: 'monitoring',
};

/** Per-step progress flags: briefed (Mayor sent you to the building) → done (work finished there). */
export const briefedFlag = (s: RagStep) => `${s}_briefed`;
export const doneFlag = (s: RagStep) => `${s}_done`;
export const UNREAD = 'unread';

/** Tuca's hints for quest 2 (same three layers as quest 1: explain · steps · direct). */
export const RAG_HINTS: Record<RagStep, { title: string; concept?: ConceptId; explain: string; steps: string[]; direct: string }> = {
  ring: {
    title: 'Seu celular está tocando', explain: 'A Prefeita tem um trabalho novo para você, e ele vai chegar por mensagem.',
    steps: ['Toque no botão do celular no canto da tela.'], direct: 'Toque em "Atender!".',
  },
  naive: {
    title: 'Colar tudo no prompt', concept: 'context_window',
    explain: 'Toda pergunta leva o manual inteiro. Isso custa caro, e a IA só lê um tanto de tokens de uma vez (a janela de contexto). O que sobra é cortado.',
    steps: ['Converse com a Prefeita no celular.', 'No Data Center, teste as perguntas dos moradores no terminal da IA.', 'Repare no custo de cada pergunta e nas respostas erradas.'],
    direct: 'Teste a pergunta do lixo, a das pontes ou a do IPTU: os trechos delas estão no fim do manual e são cortados.',
  },
  tokens: {
    title: 'O que é um token?', concept: 'tokenization',
    explain: 'A IA quebra o texto em tokens. Palavras comuns viram 1 token; palavras longas, raras ou com acento viram vários. Você paga por token.',
    steps: ['Vá ao ML Lab e use o Tokenizador da Dra. Íris.', 'Compare o número de palavras com o de tokens.'],
    direct: 'Teste "inconstitucionalmente" e "lixo": uma palavra longa custa muitos tokens.',
  },
  keyword: {
    title: 'RAG: buscar antes de perguntar', concept: 'rag',
    explain: 'Em vez do manual inteiro, mandamos só os 3 trechos mais parecidos com a pergunta. Menos tokens, menos custo.',
    steps: ['No Data Center, teste várias perguntas e veja quais trechos a busca escolheu.', 'Repare que palavras como "a" e "de" contam pontos.'],
    direct: 'Pergunte sobre as pontes: "Pontes" e "fechadas" não batem com "ponte" e "fechada".',
  },
  grammar: {
    title: 'Análise gramatical', concept: 'nlp_preprocessing',
    explain: 'Normalizar (minúsculas, sem acento), tirar stopwords e reduzir ao radical faz "pontes fechadas" bater com "ponte fechada".',
    steps: ['Vá ao Data Cleaning Lab.', 'Ligue as três opções.', 'Pergunte de novo sobre as pontes.'],
    direct: 'Ligue tudo e toque em "As pontes estão fechadas?".',
  },
  embeddings: {
    title: 'Buscar por significado', concept: 'embeddings',
    explain: 'Embeddings transformam palavras em vetores. "lixo" e "resíduos" não têm letras em comum, mas ficam perto no mapa: o sentido é parecido.',
    steps: ['Vá ao ML Lab e toque nas palavras do mapa.', 'Teste a pergunta do lixo e a do IPTU.'],
    direct: 'Toque em "Que dia o caminhão de lixo passa…" e em "Como eu pago o imposto…".',
  },
  final: {
    title: 'Quantos trechos mandar?', concept: 'top_k',
    explain: 'Top-k é quantos trechos vão para a IA. Com poucos, a resposta pode ficar de fora; com muitos, você paga tokens à toa.',
    steps: ['Vá ao Evaluation Center.', 'Escolha um top-k e rode as 6 perguntas.', 'Compare acertos e moedas com o manual inteiro.'],
    direct: 'Top-1 erra a da biblioteca. Top-3 acerta tudo gastando pouco.',
  },
  done: {
    title: 'O chatbot está no ar!', concept: 'monitoring',
    explain: 'Você montou um RAG: tokens, janela de contexto, busca, gramática, embeddings e top-k. Agora é ver como ele se sai com os moradores de verdade.',
    steps: ['Vá ao Monitoring Center ver o painel de satisfação da Lu.', 'Abra o Caderno para rever os conceitos.'], direct: 'Toque no Monitoring Center no menu de prédios.',
  },
};
