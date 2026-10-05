import { useEffect, useRef, type ReactNode } from 'react';
import { PORTRAITS, type BuildingId } from '../../content/buildings';
import type { ConceptId } from '../../content/concepts';
import { briefedFlag, RAG_BUILDING, RAG_STEPS, ragIndex, type RagStep } from '../../content/missions/ragMission';
import { CHUNKS, QUESTIONS, type CitizenQuestion } from '../../content/rag/manual';
import { askNaive, CONTEXT_WINDOW, MANUAL_TOKENS, type Answer } from '../../rag/retrieve';
import { useGame } from '../../store/gameStore';
import { Icon } from '../art/Icon';
import { Portrait } from '../art/Portrait';
import { goTo } from '../common/nav';
import { Conversation, type Node } from './Conversation';
import { grammarRun, keywordRun, semanticRun } from './RagActivity';
import { runBatch } from './widgets';
import { CHATBOT_REWARD } from './ChatbotLiveCard';
import { useRagStatus } from './ragStatus';
import { TechCenter } from './TechCenter';

const fmt = (n: number) => n.toLocaleString('pt-BR');
const Q = Object.fromEntries(QUESTIONS.map((q) => [q.id, q])) as Record<string, CitizenQuestion>;
const PLACE: Record<BuildingId, string> = {
  cityhall: 'na Prefeitura', datacenter: 'no Data Center', cleaning: 'no Data Cleaning Lab', mllab: 'no ML Lab',
  evaluation: 'no Evaluation Center', deploy: 'no Deployment Center', monitoring: 'no Monitoring Center',
};

/** Moves to the next step and celebrates the concepts the player just lived through. */
function useAdvance() {
  const completeRag = useGame((s) => s.completeRag);
  const discover = useGame((s) => s.discover);
  return (step: RagStep, ...concepts: ConceptId[]) => {
    completeRag(step);
    if (concepts.length) discover(...concepts);
  };
}

/** "Go to the building" reply: closes the phone and walks the player there. */
function useSendTo() {
  const flag = useGame((s) => s.ragFlag);
  const close = useGame((s) => s.togglePhone);
  return (step: RagStep) => () => {
    flag(briefedFlag(step));
    close(false);
    goTo(RAG_BUILDING[step]!);
  };
}

/** The Mayor tries the chatbot herself and reports back, question by question. */
function MayorTest({ answers }: { answers: Answer[] }) {
  const coins = answers.reduce((s, a) => s + a.coins, 0);
  return (
    <div className="space-y-1.5">
      <div>Testei agora mesmo:</div>
      {answers.map((a) => (
        <div key={a.question.id} className={`rounded-xl px-2.5 py-1.5 text-[13px] ${a.correct ? 'bg-leaf/15' : 'bg-danger/15'}`}>
          <div className="font-semibold">{a.correct ? '✓' : '✗'} {a.question.text}</div>
          <div className="text-bark-soft">Bot: "{a.text}"</div>
        </div>
      ))}
      <div className="text-[12px] text-bark-soft">Custo do meu teste: {fmt(coins)} moedas ({fmt(Math.round(coins / answers.length))} por pergunta)</div>
    </div>
  );
}

const test = (run: (q: CitizenQuestion) => Answer, ids: string[]) => ids.map((id) => run(Q[id]));
const waitFor = (b: BuildingId): Node => ({ say: <>Te espero {PLACE[b]}. Quando terminar, me manda mensagem! 📱</> });

type StepProps = { live: boolean; done: boolean };

// ───────────────────────── 1. whole manual in every prompt
function NaiveStep({ live, done }: StepProps) {
  const advance = useAdvance();
  const sendTo = useSendTo();
  const go = sendTo('naive');
  const nodes: Node[] = [
    { say: 'Oi! Aqui é a Olívia, da Prefeitura. Tem um minutinho?' },
    { ask: 'n.hello', options: [
      { label: 'Oi, Prefeita! Pode falar.', reply: [{ say: 'Que bom que atendeu!' }] },
      { label: 'Depende… é trabalho? 😅', reply: [{ say: 'Hahaha, é sim. Mas é dos bons, prometo.' }] },
    ] },
    { say: 'A gente recebe centenas de perguntas por dia: horário da biblioteca, dia do lixo, IPTU… A equipe não dá conta.' },
    { say: <>Quero um <b>chatbot da cidade</b> que responda os moradores sozinho. Você topa montar?</> },
    { ask: 'n.accept', options: [
      { label: 'Topo! Como funciona?' },
      { label: 'Por que não contratar mais atendentes?', reply: [
        { say: 'Já pensei. Sai caro e ninguém atende de madrugada. Um chatbot responde 24 horas por dia.' },
        { ask: 'n.accept2', options: [{ label: 'Faz sentido. Topo!' }] },
      ] },
    ] },
    { say: <>Contratamos uma IA de linguagem. Ela escreve bem, mas <b>não sabe nada</b> sobre a nossa cidade. Por isso temos o <b>Manual da Cidade</b>.</> },
    { say: <>Um detalhe: a IA <b>cobra por token</b>, direto do orçamento da cidade. O manual tem {fmt(MANUAL_TOKENS)} tokens.</> },
    { ask: 'n.token', options: [
      { label: 'Sei o que é token.', reply: [{ say: 'Ótimo! Então você vai sentir isso no bolso 😬' }] },
      { label: 'O que é token?', reply: [{ say: 'É um pedacinho de texto: às vezes uma palavra inteira, às vezes só uma sílaba. A IA lê e cobra por pedacinho. Depois te mostro direitinho.' }] },
    ] },
    { say: <>O Otto sugeriu o óbvio: colar o <b>manual inteiro</b> junto com cada pergunta. A IA já está instalada no terminal do <b>Data Center</b>. Vai lá testar com as perguntas dos moradores?</> },
    { ask: 'n.go', options: [
      { label: 'Tô indo pro Data Center!', action: go },
      { label: 'Isso não vai sair caro?', reply: [
        { say: 'O Otto jura que não. Vai lá e me conta 😅' },
        { ask: 'n.go2', options: [{ label: 'Tá bom, tô indo!', action: go }] },
      ] },
    ] },
    waitFor('datacenter'),
  ];
  if (done) nodes.push(
    { ask: 'n.report', options: [{ label: 'Prefeita, testei a IA nova! Pode testar também?' }] },
    { say: 'Claro! Deixa eu perguntar umas coisas que os moradores sempre perguntam…' },
    { say: <MayorTest answers={test(askNaive, ['biblio', 'lixo', 'iptu'])} /> },
    { say: <>Espera… caro <b>e</b> errado?! O que você acha que aconteceu?</> },
    { ask: 'n.why', options: [
      { label: 'A IA inventou a resposta.', reply: [{ say: <>Inventou mesmo. Isso se chama <b>alucinação</b>. Mas o motivo por trás é outro…</> }] },
      { label: 'O manual era grande demais?', reply: [{ say: 'Na mosca! 🎯' }] },
      { label: 'Não faço ideia.', reply: [{ say: 'Eu também não sabia. Liguei pro suporte e descobri:' }] },
    ] },
    { say: <>A IA só lê <b>{fmt(CONTEXT_WINDOW)} tokens</b> de uma vez: a <b>janela de contexto</b>. O resto do manual foi cortado, e o lixo e o IPTU ficam lá no fim.</> },
    { ask: 'n.next', options: [{ label: 'Quero entender esses tokens.', action: () => advance('naive', 'token', 'context_window') }] },
  );
  return <Conversation id="naive" live={live} nodes={nodes} />;
}

// ───────────────────────── 2. what is a token
function TokensStep({ live, done }: StepProps) {
  const advance = useAdvance();
  const go = useSendTo()('tokens');
  const nodes: Node[] = [
    { say: <>A Dra. Íris, do <b>ML Lab</b>, tem um <b>Tokenizador</b>: ele mostra o texto do jeito que a IA lê. Passa lá?</> },
    { ask: 't.go', options: [{ label: 'Indo pro ML Lab!', action: go }] },
    waitFor('mllab'),
  ];
  if (done) nodes.push(
    { ask: 't.report', options: [{ label: 'Prefeita, voltei do ML Lab! Entendi os tokens.' }] },
    { say: 'E aí, o que você reparou?' },
    { ask: 't.notice', options: [
      { label: 'Palavra longa vira vários tokens.', reply: [{ say: 'Isso! "inconstitucionalmente" vira um monte de pedaços.' }] },
      { label: 'Acento custa token extra.', reply: [{ say: 'Exato. Por isso texto em português costuma sair mais caro que em inglês.' }] },
      { label: 'Token não é a mesma coisa que palavra.', reply: [{ say: 'Isso! A IA lê pedaços, não palavras.' }] },
    ] },
    { say: <>Então: <b>menos tokens enviados = menos moedas</b>. Como mandar menos texto sem perder a resposta?</> },
    { ask: 't.idea', options: [
      { label: 'Mandar só a parte certa do manual.', reply: [{ say: 'Exatamente o que a Nina sugeriu!' }] },
      { label: 'Resumir o manual inteiro.', reply: [{ say: 'Ajuda um pouco, mas resumo perde detalhe, tipo o horário da biblioteca no sábado. A Nina tem uma ideia melhor.' }] },
    ] },
    { ask: 't.next', options: [{ label: 'Me conta a ideia da Nina.', action: () => advance('tokens', 'tokenization') }] },
  );
  return <Conversation id="tokens" live={live} nodes={nodes} />;
}

// ───────────────────────── 3. RAG with keyword search
function KeywordStep({ live, done }: StepProps) {
  const advance = useAdvance();
  const go = useSendTo()('keyword');
  const nodes: Node[] = [
    { say: <>A Nina sugeriu: picar o manual em <b>{CHUNKS.length} trechos</b> (um por parágrafo). A cada pergunta, a gente <b>busca</b> os 3 trechos mais parecidos e manda <b>só eles</b> para a IA.</> },
    { ask: 'k.rag', options: [
      { label: 'Isso é RAG, né?', reply: [{ say: <>Isso! <b>Retrieval-Augmented Generation</b>: primeiro busca (retrieval), depois a IA gera a resposta com o que foi achado.</> }] },
      { label: 'Nunca ouvi falar disso.', reply: [
        { say: <>Tem nome: <b>RAG</b>, Retrieval-Augmented Generation. Em português: geração aumentada por busca.</> },
        { say: 'É tipo consultar o índice do livro antes de responder: primeiro acha as páginas certas, depois lê só elas.' },
      ] },
      { label: 'Como a busca sabe o que é parecido?', reply: [{ say: <>Boa! Começa pelo jeito mais simples: <b>contar palavras iguais</b> entre a pergunta e o trecho. Isso tudo junto se chama <b>RAG</b>.</> }] },
    ] },
    { say: <>A Nina já picou o manual. Vai no <b>Data Center</b> testar a busca?</> },
    { ask: 'k.go', options: [{ label: 'Bora pro Data Center!', action: go }] },
    waitFor('datacenter'),
  ];
  if (done) nodes.push(
    { ask: 'k.report', options: [{ label: 'Prefeita, a busca tá pronta! Pode testar o novo chatbot?' }] },
    { say: 'Opa! Testando…' },
    { say: <MayorTest answers={test(keywordRun, ['onibus', 'pontes', 'lixo'])} /> },
    { say: <>O custo despencou! 🎉 Mas ainda tem erro. Por quê?</> },
    { ask: 'k.why', options: [
      { label: 'A busca conta palavras tipo "a" e "de".', reply: [{ say: 'Isso! Essas palavras aparecem em todo trecho e bagunçam a pontuação.' }] },
      { label: '"Pontes" não bateu com "ponte".', reply: [{ say: 'Isso! Para essa busca, são palavras totalmente diferentes. Maiúscula também atrapalha.' }] },
    ] },
    { say: <>A busca precisa entender um pouco de <b>gramática</b>.</> },
    { ask: 'k.next', options: [{ label: 'Bora ensinar gramática!', action: () => advance('keyword', 'rag') }] },
  );
  return <Conversation id="keyword" live={live} nodes={nodes} />;
}

// ───────────────────────── 4. grammatical analysis
function GrammarStep({ live, done }: StepProps) {
  const advance = useAdvance();
  const go = useSendTo()('grammar');
  const nodes: Node[] = [
    { say: <>Análise gramatical em três passos: <b>minúsculas e sem acento</b>, tirar as <b>stopwords</b> e reduzir cada palavra ao <b>radical</b>.</> },
    { ask: 'g.what', options: [
      { label: 'O que são stopwords?', reply: [{ say: 'Palavras que aparecem em todo lugar e não dizem nada sozinhas: "a", "de", "que", "para"…' }] },
      { label: 'O que é radical?', reply: [{ say: <>É o pedaço que sobra quando tira as terminações: "fechadas", "fechada" e "fechar" viram "fech". Isso se chama <b>stemming</b>.</> }] },
      { label: 'Já sei, bora!', reply: [{ say: 'Gostei! 😎' }] },
    ] },
    { say: <>O Seu Bento, do <b>Data Cleaning Lab</b>, diz que texto também se lava. Vai lá?</> },
    { ask: 'g.go', options: [{ label: 'Indo pro Cleaning Lab!', action: go }] },
    waitFor('cleaning'),
  ];
  if (done) nodes.push(
    { ask: 'g.report', options: [{ label: 'Prefeita, a busca aprendeu gramática! Testa de novo?' }] },
    { say: 'Vamos ver…' },
    { say: <MayorTest answers={test(grammarRun, ['pontes', 'lixo'])} /> },
    { say: <>A das pontes resolveu! Mas o manual fala em "coleta de <b>resíduos</b>", e eu perguntei do <b>lixo</b>…</> },
    { ask: 'g.lixo', options: [
      { label: 'Não tem nenhuma palavra em comum…', reply: [{ say: 'Pois é. Gramática não resolve: a busca precisa entender o significado.' }] },
      { label: 'Coloca "lixo" no manual e pronto.', reply: [{ say: 'Dá pra fazer com uma palavra, mas o povo fala "lixo", "lixeiro", "caminhão", "entulho"… não dá pra prever tudo. A busca precisa entender o significado.' }] },
    ] },
    { ask: 'g.next', options: [{ label: 'Como uma busca entende significado?', action: () => advance('grammar', 'nlp_preprocessing') }] },
  );
  return <Conversation id="grammar" live={live} nodes={nodes} />;
}

// ───────────────────────── 5. embeddings
function EmbeddingsStep({ live, done }: StepProps) {
  const advance = useAdvance();
  const go = useSendTo()('embeddings');
  const nodes: Node[] = [
    { say: <>A Lu, do Monitoring, me falou de <b>embeddings</b>.</> },
    { ask: 'e.what', options: [
      { label: 'O que é embedding?', reply: [{ say: 'Cada palavra vira uma lista de números (um vetor), tipo coordenadas num mapa. Palavras com sentido parecido ficam perto.' }] },
      { label: 'Já sei, são vetores!', reply: [{ say: 'Isso! E palavras com sentido parecido têm vetores parecidos.' }] },
    ] },
    { say: <>A Dra. Íris gerou os embeddings do manual no <b>ML Lab</b>. Vai lá ver o mapa e testar a busca por significado?</> },
    { ask: 'e.go', options: [{ label: 'Indo pro ML Lab!', action: go }] },
    waitFor('mllab'),
  ];
  if (done) nodes.push(
    { ask: 'e.report', options: [{ label: 'Prefeita, agora a busca entende significado! Pode testar?' }] },
    { say: 'Testando as que deram errado antes…' },
    { say: <MayorTest answers={test(semanticRun, ['lixo', 'iptu', 'pontes'])} /> },
    { say: 'Agora sim! "lixo" achou "coleta de resíduos" e "imposto" achou "IPTU". 🤩 Como a busca sabe que são parecidas?' },
    { ask: 'e.map', options: [
      { label: 'Os vetores ficam perto no mapa.', reply: [{ say: 'Isso! Sem nenhuma letra em comum.' }] },
      { label: 'Pelo ângulo entre os vetores.', reply: [{ say: <>Exato: a <b>similaridade de cosseno</b>. 1 = mesmo sentido, 0 = nada a ver.</> }] },
    ] },
    { ask: 'e.next', options: [{ label: 'Já dá pra colocar no ar?', action: () => advance('embeddings', 'embeddings', 'semantic_search') }] },
  );
  return <Conversation id="embeddings" live={live} nodes={nodes} />;
}

// ───────────────────────── 6. top-k and delivery
function FinalStep({ live, done }: StepProps) {
  const advance = useAdvance();
  const gainCoins = useGame((s) => s.gainCoins);
  const go = useSendTo()('final');
  const nodes: Node[] = [
    { say: <>Quase! Falta decidir <b>quantos trechos</b> mandar para a IA. Isso se chama <b>top-k</b>.</> },
    { ask: 'f.k', options: [
      { label: 'Manda só 1, sai mais barato.', reply: [{ say: 'Barato é bom… mas e se o trecho certo for o segundo da lista?' }] },
      { label: 'Manda uns 5, é mais seguro.', reply: [{ say: 'Seguro, mas cada trecho a mais é token a mais.' }] },
      { label: 'Melhor testar antes de decidir.', reply: [{ say: 'Isso! Decisão com dado 📊' }] },
    ] },
    { say: <>A Tereza, do <b>Evaluation Center</b>, compara todas as versões. Leva o chatbot pra ela?</> },
    { ask: 'f.go', options: [{ label: 'Indo pro Evaluation Center!', action: go }] },
    waitFor('evaluation'),
  ];
  if (done) nodes.push(
    { ask: 'f.report', options: [{ label: 'Prefeita, o chatbot final tá pronto! Testa?' }] },
    { say: 'Vou fazer as 6 perguntas de uma vez…' },
    { say: <MayorTest answers={runBatch(3).answers} /> },
    { say: '6 de 6, gastando uma fração do começo! 👏' },
    { ask: 'f.next', options: [{ label: 'Pode colocar no ar! 🚀', action: () => { advance('final', 'top_k'); gainCoins(CHATBOT_REWARD); } }] },
  );
  return <Conversation id="final" live={live} nodes={nodes} />;
}

function DoneStep() {
  const spent = useGame((s) => s.rag.spent.naive ?? 0);
  const nodes: Node[] = [
    { say: <><b>O chatbot está no ar!</b> No primeiro teste gastamos {fmt(spent)} moedas e errávamos muito. Agora ele acerta tudo por bem menos.</> },
    { say: 'Toma 2.000 moedas de bônus. Você virou a pessoa de IA da Prefeitura 💜' },
    { ask: 'd.bye', options: [
      { label: 'Valeu, Prefeita!', reply: [{ say: 'Eu que agradeço! Qualquer coisa te ligo.' }] },
      { label: 'Qual é o próximo desafio?', reply: [{ say: 'Calma, descansa um pouco 😄 Te ligo quando aparecer coisa nova.' }] },
    ] },
  ];
  return <Conversation id="done" live nodes={nodes} />;
}

const STEPS: Record<Exclude<RagStep, 'ring' | 'done'>, (p: StepProps) => ReactNode> = {
  naive: NaiveStep, tokens: TokensStep, keyword: KeywordStep, grammar: GrammarStep, embeddings: EmbeddingsStep, final: FinalStep,
};

/** The Centro Técnico unlocks once quest 2 is fully wrapped up (after Lu's dashboard). */
export const useTechUnlocked = () => useGame((s) => s.activeMission === 'rag' && s.rag.step === 'done' && !!s.rag.flags.done_done);

function AppIcon({ icon, label, badge, locked, onClick }: { icon: 'phone' | 'gear'; label: string; badge?: string; locked?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={locked} className="flex flex-col items-center gap-1.5 disabled:opacity-45 active:scale-95 transition">
      <span className="relative w-16 h-16 rounded-[20px] bg-paper border border-bark/10 shadow flex items-center justify-center">
        <Icon name={locked ? 'lock' : icon === 'phone' ? 'phone' : 'gear'} size={36} />
        {badge && <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-danger text-white text-[11px] font-bold flex items-center justify-center">{badge}</span>}
      </span>
      <span className="text-[12px] font-semibold text-center leading-tight">{label}</span>
    </button>
  );
}

function Home() {
  const setApp = useGame((s) => s.setPhoneApp);
  const unread = useGame((s) => !!s.rag.flags.unread);
  const techSeen = useGame((s) => s.techSeen);
  const unlocked = useTechUnlocked();
  const day = useGame((s) => s.day);
  return (
    <div className="space-y-6">
      <div className="text-center pt-4">
        <div className="font-display text-5xl font-semibold">{String(8 + (day % 10)).padStart(2, '0')}:{String((day * 17) % 60).padStart(2, '0')}</div>
        <div className="text-[13px] text-bark-soft">Model Town · Dia {day}</div>
      </div>
      <div className="grid grid-cols-3 gap-y-5 px-2">
        <AppIcon icon="phone" label="Mensagens" badge={unread ? '1' : undefined} onClick={() => setApp('chat')} />
        <AppIcon icon="gear" label="Centro Técnico" badge={unlocked && !techSeen ? 'novo' : undefined} locked={!unlocked} onClick={() => setApp('tech')} />
      </div>
      {!unlocked && <div className="text-center text-[12px] text-bark-soft px-6">O Centro Técnico abre depois que o chatbot da cidade for para o ar.</div>}
    </div>
  );
}

/** The player's phone: a home screen with the Mayor's chat (quest 2) and the Centro Técnico app. */
export function Phone() {
  const show = useGame((s) => s.showPhone);
  const toggle = useGame((s) => s.togglePhone);
  const app = useGame((s) => s.phoneApp);
  const setApp = useGame((s) => s.setPhoneApp);
  const coins = useGame((s) => s.coins);
  const { step, done } = useRagStatus();
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && toggle(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, toggle]);

  // Chat: keep the newest message in view as it grows.
  useEffect(() => {
    const el = body.current;
    if (!el || app !== 'chat') return;
    el.scrollTop = el.scrollHeight;
    const obs = new MutationObserver(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
    obs.observe(el, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [show, app]);

  if (!show) return null;
  const idx = ragIndex(step);
  const title = app === 'chat' ? 'Prefeita Olívia' : app === 'tech' ? 'Centro Técnico' : 'Celular';
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center sm:justify-end bg-bark/30 backdrop-blur-[1.5px] sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && toggle(false)}>
      <div className="w-full h-full sm:w-[400px] sm:h-[min(820px,100%)] flex flex-col overflow-hidden bg-cream sm:rounded-[44px] sm:border-[10px] sm:border-ink-dark shadow-2xl animate-pop">
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-paper border-b border-bark/10">
          {app === 'home' ? (
            <button onClick={() => toggle(false)} className="w-10 h-10 rounded-full hover:bg-cream flex items-center justify-center" aria-label="Fechar celular">
              <Icon name="close" size={16} />
            </button>
          ) : (
            <button onClick={() => setApp('home')} className="w-10 h-10 rounded-full hover:bg-cream flex items-center justify-center text-xl font-bold" aria-label="Voltar para a tela inicial">←</button>
          )}
          {app === 'chat' ? <Portrait spec={PORTRAITS.cityhall} size={38} className="rounded-full" /> : <Icon name={app === 'tech' ? 'gear' : 'phone'} size={34} />}
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold leading-tight">{title}</div>
            {app === 'chat' && <div className="text-[11px] text-leaf-dark">online</div>}
            {app === 'tech' && <div className="text-[11px] text-bark-soft">Cursos e habilidades</div>}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 font-display font-semibold text-sm" title="Orçamento da cidade">
            <Icon name="coin" size={18} /> {fmt(coins)}
          </div>
          {app !== 'home' && (
            <button onClick={() => toggle(false)} className="w-9 h-9 rounded-full hover:bg-cream flex items-center justify-center" aria-label="Fechar celular">
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
        {app === 'chat' && (
          <div className="h-1 bg-bark/10">
            <div className="h-full bg-sun transition-all duration-700" style={{ width: `${(idx / (RAG_STEPS.length - 1)) * 100}%` }} />
          </div>
        )}
        <div ref={body} className="flex-1 overflow-y-auto overscroll-contain scroll-soft px-3 py-4 space-y-3">
          {app === 'home' && <Home />}
          {app === 'tech' && <TechCenter />}
          {app === 'chat' && RAG_STEPS.slice(1, Math.max(2, idx + 1)).map(({ id }) => {
            if (id === 'done') return <DoneStep key={id} />;
            const Step = STEPS[id as keyof typeof STEPS];
            // Earlier steps are history: their building work is necessarily done.
            return <Step key={id} live={id === step} done={id !== step || done} />;
          })}
        </div>
      </div>
    </div>
  );
}
