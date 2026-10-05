import { useEffect, useReducer, useRef, type ReactNode } from 'react';
import { PORTRAITS } from '../../content/buildings';
import { useGame } from '../../store/gameStore';
import { Portrait } from '../art/Portrait';

/**
 * A scripted chat. The Mayor "types" her lines one by one; at each `ask` the player picks a reply,
 * the Mayor answers that reply, and the script carries on. Picks are saved, so a reload resumes the chat.
 */
export interface Option {
  label: string;
  /** What the Mayor answers to this pick (may contain further asks). */
  reply?: Node[];
  /** Side effect on pick (e.g. move to the next step). */
  action?: () => void;
}

export type Node =
  | { say: ReactNode }
  | { ask: string; options: Option[] }
  | { widget: ReactNode; key: string };

type Item =
  | { key: string; kind: 'mayor'; content: ReactNode }
  | { key: string; kind: 'player'; content: string }
  | { key: string; kind: 'widget'; content: ReactNode }
  | { key: string; kind: 'options'; id: string; options: Option[] };

/**
 * Walks the script, following saved picks, and stops at the first unanswered question.
 * For finished steps (`autoPick`) an unanswered question takes its first option, so old saves still read as a full chat.
 */
function flatten(nodes: Node[], choices: Record<string, number>, prefix: string, out: Item[], autoPick = false): boolean {
  for (const [i, n] of nodes.entries()) {
    const key = `${prefix}.${i}`;
    if ('say' in n) out.push({ key, kind: 'mayor', content: n.say });
    else if ('widget' in n) out.push({ key: `${prefix}.w.${n.key}`, kind: 'widget', content: n.widget });
    else {
      const pick = choices[n.ask] ?? (autoPick ? 0 : undefined);
      if (pick === undefined) {
        out.push({ key, kind: 'options', id: n.ask, options: n.options });
        return false;
      }
      const opt = n.options[pick] ?? n.options[0];
      out.push({ key: `${key}.p`, kind: 'player', content: opt.label });
      if (opt.reply && !flatten(opt.reply, choices, `${key}.${pick}`, out, autoPick)) return false;
    }
  }
  return true;
}

// Lines already shown this session never re-animate (e.g. when a step re-renders).
const shown = new Set<string>();
const TYPING_MS = 750;

export function Typing() {
  return (
    <div className="flex items-end gap-2 animate-slide">
      <Portrait spec={PORTRAITS.cityhall} size={30} className="rounded-full shrink-0" />
      <div className="rounded-2xl rounded-bl-md bg-paper border border-bark/10 px-3 py-2.5 flex gap-1" aria-label="digitando">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-bark-soft/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export function MayorBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-end gap-2 animate-slide">
      <Portrait spec={PORTRAITS.cityhall} size={30} className="rounded-full shrink-0" />
      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-paper border border-bark/10 px-3 py-2 text-[14px] leading-snug">{children}</div>
    </div>
  );
}

function PlayerBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end animate-slide">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-sun text-ink-dark px-3 py-2 text-[14px] leading-snug font-semibold">{children}</div>
    </div>
  );
}

function Replies({ id, options }: { id: string; options: Option[] }) {
  const choose = useGame((s) => s.ragChoose);
  return (
    <div className="flex flex-col items-end gap-1.5 pt-1 animate-slide">
      <div className="text-[11px] font-bold uppercase tracking-wider text-bark-soft">Responder</div>
      {options.map((o, i) => (
        <button
          key={o.label}
          onClick={() => { choose(id, i); o.action?.(); }}
          className="max-w-[85%] text-right rounded-2xl rounded-br-md border-2 border-sun/70 bg-sun/10 hover:bg-sun/25 active:scale-95 transition px-3 py-2 text-[14px] font-semibold"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** `live` = this is the current step: new lines appear with a typing delay. */
export function Conversation({ nodes, id, live }: { nodes: Node[]; id: string; live: boolean }) {
  const choices = useGame((s) => s.rag.choices);
  const paused = useGame((s) => s.discoveryQueue.length > 0);
  const items: Item[] = [];
  flatten(nodes, choices, id, items, !live);
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const first = useRef(true);

  // Past steps, and whatever the player already answered before a reload, show at once.
  if (first.current) {
    first.current = false;
    const lastAnswer = items.map((it) => it.kind).lastIndexOf('player');
    items.forEach((it, i) => (!live || i <= lastAnswer) && shown.add(it.key));
  }

  const next = items.findIndex((it) => !shown.has(it.key));
  const pending = next === -1 ? null : items[next];

  // Keyed by the pending line (not the object) so unrelated re-renders don't restart the typing timer.
  const pendingKey = pending?.key;
  const pendingKind = pending?.kind;
  useEffect(() => {
    if (!pendingKey || paused) return;
    const delay = pendingKind === 'mayor' ? TYPING_MS : pendingKind === 'options' ? 250 : 0;
    const t = setTimeout(() => { shown.add(pendingKey); rerender(); }, delay);
    return () => clearTimeout(t);
  }, [pendingKey, pendingKind, paused]);

  const visible = next === -1 ? items : items.slice(0, next);
  return (
    <>
      {visible.map((it) =>
        it.kind === 'mayor' ? <MayorBubble key={it.key}>{it.content}</MayorBubble>
        : it.kind === 'player' ? <PlayerBubble key={it.key}>{it.content}</PlayerBubble>
        : it.kind === 'widget' ? <div key={it.key}>{it.content}</div>
        : live ? <Replies key={it.key} id={it.id} options={it.options} /> : null,
      )}
      {pending?.kind === 'mayor' && !paused && <Typing />}
    </>
  );
}
