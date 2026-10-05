import { useMemo, useRef, useState, type ComponentType } from 'react';
import type { BuildingId } from '../../content/buildings';
import { doneFlag, UNREAD, type RagStep } from '../../content/missions/ragMission';
import { QUESTIONS, type CitizenQuestion } from '../../content/rag/manual';
import { askNaive, askRag, type Answer } from '../../rag/retrieve';
import { FULL, RAW, type TextOptions } from '../../rag/text';
import { useT } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { BuildingArt } from '../art/BuildingArt';
import { Icon } from '../art/Icon';
import { Button } from '../common/Button';
import { goTo } from '../common/nav';
import { Speech } from '../common/Speech';
import { AskWidget, Comparison, EmbeddingLab, GrammarLab, runBatch, TokenizerLab, type Batch } from './widgets';
import { useRagStatus } from './ragStatus';
import { SatisfactionDashboard } from './SatisfactionDashboard';

const fmt = (n: number) => n.toLocaleString('pt-BR');
const Q = Object.fromEntries(QUESTIONS.map((q) => [q.id, q])) as Record<string, CitizenQuestion>;

export const keywordRun = (q: CitizenQuestion) => askRag(q, 'keyword', RAW, 3);
export const grammarRun = (q: CitizenQuestion) => askRag(q, 'keyword', FULL, 3);
export const semanticRun = (q: CitizenQuestion) => askRag(q, 'semantic', FULL, 3);

/** Bills the "AI call" to the town budget, with a toast so the cost is felt. */
function useCharge(step: RagStep) {
  const ragAsk = useGame((s) => s.ragAsk);
  const toast = useGame((s) => s.toast);
  return (a: Answer) => {
    ragAsk(step, a.question.id, a.coins);
    toast(`−${fmt(a.coins)} moedas · ${fmt(a.tokensIn + a.tokensOut)} tokens`, a.coins > 60 ? 'warn' : 'coins');
  };
}

/** Answers for a step, recomputed from the saved question ids (so a reload keeps the history). */
function useAsked(step: RagStep, run: (q: CitizenQuestion) => Answer) {
  const ids = useGame((s) => s.rag.asked[step]);
  return useMemo(() => (ids ?? []).filter((id) => Q[id]).map((id) => run(Q[id])), [ids, run]);
}

/** Marks the step's work as finished (once) and tells the player to report back to the Mayor. */
function useFinish(step: RagStep) {
  const flag = useGame((s) => s.ragFlag);
  const toast = useGame((s) => s.toast);
  const done = useGame((s) => !!s.rag.flags[doneFlag(step)]);
  return (ok: boolean) => {
    if (!ok || done) return;
    flag(doneFlag(step));
    flag(UNREAD);
    toast('Pronto! Avise a Prefeita pelo celular', 'good');
  };
}

function ReportBack() {
  const open = useGame((s) => s.togglePhone);
  return (
    <div className="rounded-2xl bg-sun/15 border-2 border-sun/60 px-4 py-3 flex flex-wrap items-center gap-3 animate-pop">
      <Icon name="phone" size={36} />
      <div className="flex-1 min-w-[180px] text-[15px] font-semibold">Trabalho feito! Mande uma mensagem para a Prefeita testar.</div>
      <Button variant="sun" onClick={() => open(true)}>Mandar mensagem →</Button>
    </div>
  );
}

// ───────────────────────── one activity per step
function NaiveLab() {
  const charge = useCharge('naive');
  const finish = useFinish('naive');
  const results = useAsked('naive', askNaive);
  return (
    <>
      <Speech who="datacenter">A Prefeita avisou que você vinha! A IA nova está instalada neste terminal. Do jeito do Otto, cada pergunta vai junto com o manual inteiro.</Speech>
      <AskWidget mode="naive" results={results} onAsk={(q) => {
        const a = askNaive(q);
        charge(a);
        const all = [...results, a];
        finish(all.length >= 3 && all.some((x) => !x.correct));
      }} />
      {results.length >= 3 && results.every((a) => a.correct) && (
        <Speech who="datacenter" tone="warn">Por enquanto acertou tudo… mas olha o custo. Testa a do lixo ou a do IPTU.</Speech>
      )}
    </>
  );
}

function TokenLab() {
  const finish = useFinish('tokens');
  const seen = useRef(new Set<string>());
  return (
    <>
      <Speech who="mllab">Este é o Tokenizador. Ele mostra o texto do jeito que a IA lê: em tokens. Teste pelo menos duas frases diferentes.</Speech>
      <TokenizerLab onTry={(t) => { seen.current.add(t.trim()); finish(seen.current.size >= 2); }} />
    </>
  );
}

function KeywordLab() {
  const charge = useCharge('keyword');
  const finish = useFinish('keyword');
  const results = useAsked('keyword', keywordRun);
  return (
    <>
      <Speech who="datacenter">Piquei o manual em trechos, um por parágrafo. Agora a busca pega os 3 trechos com mais palavras em comum com a pergunta, e só eles vão para a IA.</Speech>
      <AskWidget mode="rag" results={results} onAsk={(q) => {
        const a = keywordRun(q);
        charge(a);
        const all = [...results, a];
        finish(all.length >= 3 && all.some((x) => !x.correct));
      }} />
    </>
  );
}

function GrammarRoom() {
  const charge = useCharge('grammar');
  const finish = useFinish('grammar');
  const [opts, setOpts] = useState<TextOptions>(RAW);
  const [results, setResults] = useState<Answer[]>([]);
  return (
    <>
      <Speech who="cleaning">Dado sujo a gente lava, e texto também! Liga as três lavagens e vê como a pergunta fica. Depois pergunta de novo sobre as pontes.</Speech>
      <GrammarLab opts={opts} setOpts={setOpts} sample={results.at(-1)?.question.text ?? 'As pontes estão fechadas?'} />
      <AskWidget mode="rag" results={results} onAsk={(q) => {
        const a = askRag(q, 'keyword', opts, 3);
        setResults([...results, a]);
        charge(a);
        finish(q.id === 'pontes' && a.correct);
      }} />
    </>
  );
}

function EmbeddingRoom() {
  const charge = useCharge('embeddings');
  const finish = useFinish('embeddings');
  const results = useAsked('embeddings', semanticRun);
  return (
    <>
      <Speech who="mllab">Gerei os embeddings do manual. Toque nas palavras do mapa: as de sentido parecido ficam perto. Depois teste a do lixo e a do IPTU.</Speech>
      <EmbeddingLab />
      <AskWidget mode="rag" results={results} onAsk={(q) => {
        const a = semanticRun(q);
        charge(a);
        const all = [...results, a];
        const ok = (id: string) => all.some((x) => x.question.id === id && x.correct);
        finish(ok('lixo') && ok('iptu'));
      }} />
    </>
  );
}

function TopKRoom() {
  const ragAsk = useGame((s) => s.ragAsk);
  const finish = useFinish('final');
  const [k, setK] = useState(3);
  const [batch, setBatch] = useState<Batch | null>(null);
  const run = () => {
    const b = runBatch(k);
    setBatch(b);
    ragAsk('final', `batch-k${k}`, b.answers.reduce((s, a) => s + a.coins, 0));
    finish(b.answers.every((a) => a.correct));
  };
  return (
    <>
      <Speech who="evaluation">Aqui é a hora da verdade. Escolha quantos trechos mandar para a IA (top-k) e eu rodo as 6 perguntas, comparando com o manual inteiro.</Speech>
      <div className="rounded-2xl bg-cream/70 p-3 space-y-2 max-w-md">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold flex-1">Top-k</span>
          {[1, 3, 5].map((n) => (
            <button key={n} onClick={() => setK(n)} aria-pressed={k === n} className={`w-12 h-10 rounded-xl font-display font-semibold border ${k === n ? 'bg-sun text-ink-dark border-sun' : 'bg-paper border-bark/15'}`}>{n}</button>
          ))}
        </div>
        <Button variant="leaf" className="w-full" onClick={run}>Rodar as 6 perguntas</Button>
      </div>
      {batch && <div className="max-w-md"><Comparison batch={batch} /></div>}
    </>
  );
}

const LABS: Partial<Record<RagStep, ComponentType>> = {
  naive: NaiveLab, tokens: TokenLab, keyword: KeywordLab, grammar: GrammarRoom, embeddings: EmbeddingRoom, final: TopKRoom,
  done: SatisfactionDashboard,
};

/** What a building shows during quest 2: the step's activity, or a pointer to where the work is. */
export function RagBuildingContent({ here }: { here: BuildingId }) {
  const t = useT();
  const { step, building, briefed, done } = useRagStatus();
  const open = useGame((s) => s.togglePhone);
  const Lab = LABS[step];
  if (Lab && building === here && briefed) {
    return (
      <div className="space-y-4">
        <Lab />
        {done && step !== 'done' && <ReportBack />}
      </div>
    );
  }
  const elsewhere = building && briefed && !done ? building : null;
  return (
    <div className="rounded-2xl bg-white border border-bark/10 border-l-4 border-l-sun px-4 py-3 flex flex-wrap items-center gap-3 animate-pop">
      {elsewhere ? <BuildingArt id={elsewhere} size={52} /> : <Icon name="phone" size={44} />}
      <div className="flex-1 min-w-[180px]">
        <div className="text-[11px] font-bold uppercase tracking-wider text-sun-dark">{t.common.nextStep}</div>
        <div className="font-display text-lg font-semibold leading-tight">
          {elsewhere ? `O trabalho agora é no ${t.buildings[elsewhere].name}` : 'A Prefeita quer falar com você no celular'}
        </div>
      </div>
      {elsewhere ? (
        <Button variant="sun" onClick={() => goTo(elsewhere)}>{t.common.takeMeThere} →</Button>
      ) : (
        <Button variant="sun" onClick={() => open(true)}>Abrir celular →</Button>
      )}
    </div>
  );
}

