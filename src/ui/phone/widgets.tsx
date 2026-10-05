import { useMemo, useState } from 'react';
import { CHUNKS, QUESTIONS, type CitizenQuestion } from '../../content/rag/manual';
import { DIMS, cosine, project, wordVector } from '../../rag/embeddings';
import { askNaive, askRag, CONTEXT_WINDOW, MANUAL_TOKENS, type Answer } from '../../rag/retrieve';
import { analyze, FULL, type TextOptions } from '../../rag/text';
import { tokenize } from '../../rag/tokenizer';
import { Icon } from '../art/Icon';
import { hasSkill } from '../../store/gameStore';

const fmt = (n: number) => n.toLocaleString('pt-BR');
const TOKEN_BG = ['bg-sky/30', 'bg-sun/35', 'bg-leaf/35', 'bg-berry/35', 'bg-coral/35', 'bg-pink-300/30'];

/** Tappable list of citizen questions. */
export function QuestionChips({ onAsk, disabled, highlight }: { onAsk: (q: CitizenQuestion) => void; disabled?: boolean; highlight?: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {QUESTIONS.map((q) => (
        <button
          key={q.id}
          disabled={disabled}
          onClick={() => onAsk(q)}
          className={`text-left text-[13px] leading-snug rounded-2xl px-3 py-1.5 border transition active:scale-95 disabled:opacity-40 ${highlight?.includes(q.id) ? 'border-sun bg-sun/15' : 'border-sky/40 bg-paper hover:bg-cream'}`}
        >
          {q.text}
        </button>
      ))}
    </div>
  );
}

/** One test of the chatbot: question → what was sent → answer → was it right? */
export function Exchange({ a, mode }: { a: Answer; mode: 'naive' | 'rag' }) {
  const answerTitle = CHUNKS.find((c) => c.id === a.question.answer)!.title;
  return (
    <div className="space-y-1.5 animate-slide">
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-sky/25 px-3 py-2 text-[14px]">
        <div className="text-[11px] font-bold text-bark-soft">{a.question.who} pergunta</div>
        {a.question.text}
      </div>
      <div className="mx-auto max-w-[95%] rounded-xl border border-dashed border-bark/20 px-3 py-1.5 text-[12px] text-bark-soft">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="font-bold text-bark">Enviado à IA: {fmt(a.tokensIn)} tokens{hasSkill('lean_prompt') ? ' (Prompt enxuto −20%)' : ''}</span>
          <span className="flex items-center gap-1"><Icon name="coin" size={14} /> −{fmt(a.coins)}</span>
        </div>
        {mode === 'naive' && a.truncated && (
          <div className="text-danger font-semibold">Manual inteiro ({fmt(MANUAL_TOKENS)} tokens) cortado em {fmt(CONTEXT_WINDOW)}: o final não coube.</div>
        )}
        {a.hits && (
          <ul className="mt-1 space-y-0.5">
            {a.hits.length === 0 && <li className="text-danger">A busca não achou nada parecido.</li>}
            {a.hits.map((h) => (
              <li key={h.chunk.id} className={`flex gap-1.5 ${h.chunk.id === a.question.answer ? 'text-leaf-dark font-semibold' : ''}`}>
                <span className="tabular-nums w-9 shrink-0 text-right">{Number.isInteger(h.score) ? h.score : h.score.toFixed(2)}</span>
                <span className="truncate">{h.chunk.title}: {h.chunk.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-paper border border-bark/10 px-3 py-2 text-[14px]">
        <div className="text-[11px] font-bold text-bark-soft">Chatbot da Cidade</div>
        {a.text}
        <div className={`mt-1 text-[12px] font-bold ${a.correct ? 'text-leaf-dark' : 'text-danger'}`}>
          {a.correct ? `✓ ${a.question.who}: "Isso mesmo, obrigada!"` : `✗ Errado! A resposta estava em "${answerTitle}"`}
        </div>
      </div>
    </div>
  );
}

/** Shared "ask the bot" widget for the naive and retrieval steps. */
export function AskWidget({ results, onAsk, mode }: { results: Answer[]; onAsk: (q: CitizenQuestion) => void; mode: 'naive' | 'rag' }) {
  return (
    <div className="space-y-3">
      {results.map((a, i) => <Exchange key={i} a={a} mode={mode} />)}
      <div className="rounded-2xl bg-cream/70 p-2.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-bark-soft mb-1.5">Perguntas dos moradores · toque para testar</div>
        <QuestionChips onAsk={onAsk} />
      </div>
    </div>
  );
}

// ───────────────────────── tokenizer lab
const PRESETS = ['lixo', 'Coleta de resíduos domiciliares', 'inconstitucionalmente', 'the garbage truck', 'Até que horas a biblioteca abre no sábado?'];

export function TokenizerLab({ onTry }: { onTry: (text: string) => void }) {
  const [text, setText] = useState('Que dia o caminhão de lixo passa na minha rua?');
  const tokens = useMemo(() => tokenize(text), [text]);
  const wordCount = (text.match(/[\p{L}\p{N}]+/gu) ?? []).length;
  const set = (v: string) => { setText(v); onTry(v); };
  return (
    <div className="rounded-2xl bg-cream/70 p-3 space-y-2">
      <div className="text-[11px] font-bold uppercase tracking-wider text-bark-soft">Tokenizador</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onTry(text)}
        rows={2}
        className="w-full rounded-xl bg-paper border border-bark/15 px-3 py-2 text-[16px] sm:text-[14px] resize-none"
      />
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button key={p} onClick={() => set(p)} className="text-[12px] rounded-full border border-bark/15 px-2.5 py-1 bg-paper hover:bg-cream active:scale-95">{p}</button>
        ))}
      </div>
      <div className="rounded-xl bg-paper border border-bark/10 p-2 font-mono text-[13px] leading-7 break-words">
        {tokens.map((t, i) => (
          <span key={i} className={`${TOKEN_BG[t.color]} rounded px-0.5 mx-[1px] whitespace-pre`}>{t.text}</span>
        ))}
      </div>
      <div className="flex gap-4 text-[13px]">
        <span><b>{wordCount}</b> palavras</span>
        <span><b>{tokens.length}</b> tokens</span>
        <span className="text-bark-soft">· = acento (custa 1 token extra)</span>
      </div>
      <div className="text-[12px] text-bark-soft">Manual inteiro: <b>{fmt(MANUAL_TOKENS)}</b> tokens · a IA lê no máximo <b>{fmt(CONTEXT_WINDOW)}</b> por vez.</div>
    </div>
  );
}

// ───────────────────────── grammar lab
const OPT_LABEL: [keyof TextOptions, string, string][] = [
  ['normalize', 'Minúsculas e sem acento', '"Pontes" → "pontes"'],
  ['stopwords', 'Tirar stopwords', '"as", "de", "que" somem'],
  ['stem', 'Radical (stemming)', '"fechadas" → "fech"'],
];

export function GrammarLab({ opts, setOpts, sample }: { opts: TextOptions; setOpts: (o: TextOptions) => void; sample: string }) {
  const terms = analyze(sample, opts);
  return (
    <div className="rounded-2xl bg-cream/70 p-3 space-y-2">
      <div className="text-[11px] font-bold uppercase tracking-wider text-bark-soft">Análise gramatical da busca</div>
      <div className="grid gap-1.5">
        {OPT_LABEL.map(([k, label, ex]) => (
          <button
            key={k}
            onClick={() => setOpts({ ...opts, [k]: !opts[k] })}
            aria-pressed={opts[k]}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left border transition ${opts[k] ? 'bg-leaf/25 border-leaf' : 'bg-paper border-bark/15'}`}
          >
            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-[12px] font-bold ${opts[k] ? 'bg-leaf border-leaf text-ink-dark' : 'border-bark/30'}`}>{opts[k] ? '✓' : ''}</span>
            <span className="flex-1 text-[14px] font-semibold">{label}</span>
            <span className="text-[11px] text-bark-soft">{ex}</span>
          </button>
        ))}
      </div>
      <div className="text-[12px] text-bark-soft">Como a busca enxerga: <i>{sample}</i></div>
      <div className="flex flex-wrap gap-1">
        {terms.map((t, i) =>
          t.term === null ? (
            <span key={i} className="text-[13px] rounded-lg px-2 py-0.5 bg-bark/5 line-through text-bark-soft">{t.original}</span>
          ) : (
            <span key={i} className="text-[13px] rounded-lg px-2 py-0.5 bg-sky/25 font-mono">{t.term}</span>
          ),
        )}
      </div>
    </div>
  );
}

// ───────────────────────── embeddings lab
const MAP_WORDS = ['lixo', 'resíduos', 'coleta', 'caminhão', 'imposto', 'IPTU', 'boleto', 'ponte', 'reparos', 'vacina', 'saúde', 'biblioteca', 'livros', 'ônibus', 'festa', 'gatos'];
const PAIRS: [string, string][] = [['lixo', 'resíduos'], ['imposto', 'IPTU'], ['caminhão', 'coleta'], ['lixo', 'biblioteca']];

export function EmbeddingLab() {
  const [sel, setSel] = useState('lixo');
  const size = 280, r = 105, c = size / 2;
  const selV = wordVector(sel)!;
  const placed = MAP_WORDS.map((w, i) => {
    const p = project(wordVector(w)!);
    // tiny deterministic spread so synonyms that share a vector don't print on top of each other
    const a = i * 2.4;
    return { w, x: c + p.x * r + Math.cos(a) * 9, y: c + p.y * r + Math.sin(a) * 9, sim: cosine(selV, wordVector(w)!) };
  });
  return (
    <div className="rounded-2xl bg-cream/70 p-3 space-y-2">
      <div className="text-[11px] font-bold uppercase tracking-wider text-bark-soft">Mapa de embeddings · toque numa palavra</div>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px] mx-auto block">
        <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} />
        {DIMS.map((d, i) => {
          const a = (i / DIMS.length) * Math.PI * 2 - Math.PI / 2;
          return <text key={d} x={c + Math.cos(a) * (r + 22)} y={c + Math.sin(a) * (r + 22)} fontSize="9" textAnchor="middle" dominantBaseline="middle" fill="currentColor" opacity={0.45}>{d}</text>;
        })}
        {placed.map((p) => (
          <g key={p.w} onClick={() => setSel(p.w)} className="cursor-pointer">
            <circle cx={p.x} cy={p.y} r={p.w === sel ? 6 : 4} fill={p.w === sel ? '#f2c46d' : p.sim > 0.7 ? '#9cc5a1' : '#8fb8de'} />
            <text x={p.x} y={p.y - 8} fontSize="10" textAnchor="middle" fill="currentColor" fontWeight={p.w === sel ? 700 : 400}>{p.w}</text>
          </g>
        ))}
      </svg>
      <div className="text-[12px]">
        Vetor de <b>{sel}</b>: <span className="font-mono">[{selV.map((v) => v.toFixed(1)).join(', ')}]</span>
      </div>
      <div className="grid grid-cols-2 gap-1 text-[12px]">
        {PAIRS.map(([a, b]) => {
          const s = cosine(wordVector(a)!, wordVector(b)!);
          return (
            <div key={a + b} className="rounded-lg bg-paper px-2 py-1 flex justify-between gap-2">
              <span>{a} ↔ {b}</span>
              <b className={s > 0.6 ? 'text-leaf-dark' : 'text-bark-soft'}>{s.toFixed(2)}</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────── final comparison
export interface Batch {
  k: number;
  answers: Answer[];
}

export function runBatch(k: number): Batch {
  return { k, answers: QUESTIONS.map((q) => askRag(q, 'semantic', FULL, k)) };
}

export function naiveBatch(): Answer[] {
  return QUESTIONS.map((q) => askNaive(q));
}

export function Comparison({ batch }: { batch: Batch }) {
  const naive = useMemo(naiveBatch, []);
  const row = (label: string, list: Answer[]) => {
    const hits = list.filter((a) => a.correct).length;
    const tokens = list.reduce((s, a) => s + a.tokensIn + a.tokensOut, 0);
    const coins = list.reduce((s, a) => s + a.coins, 0);
    return { label, hits, tokens, coins };
  };
  const rows = [row('Manual inteiro', naive), row(`RAG semântico, top-${batch.k}`, batch.answers)];
  const saving = 1 - rows[1].coins / rows[0].coins;
  return (
    <div className="rounded-2xl bg-paper border border-bark/10 p-3 space-y-2 animate-pop">
      <table className="w-full text-[13px]">
        <thead className="text-[11px] uppercase tracking-wider text-bark-soft">
          <tr><th className="text-left font-bold">6 perguntas</th><th className="font-bold">Acertos</th><th className="font-bold">Tokens</th><th className="font-bold">Moedas</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.label} className={i ? 'font-bold' : ''}>
              <td className="py-1">{r.label}</td>
              <td className={`text-center ${r.hits === 6 ? 'text-leaf-dark' : 'text-danger'}`}>{r.hits}/6</td>
              <td className="text-center tabular-nums">{fmt(r.tokens)}</td>
              <td className="text-center tabular-nums">{fmt(r.coins)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-[12px] text-bark-soft">
        Com 1.000 perguntas por mês: {fmt(Math.round(rows[0].coins / 6 * 1000))} → <b className="text-bark">{fmt(Math.round(rows[1].coins / 6 * 1000))}</b> moedas ({Math.round(saving * 100)}% a menos).
      </div>
      {batch.answers.filter((a) => !a.correct).map((a) => (
        <div key={a.question.id} className="text-[12px] text-danger">✗ "{a.question.text}": o trecho certo ficou de fora do top-{batch.k}.</div>
      ))}
    </div>
  );
}

