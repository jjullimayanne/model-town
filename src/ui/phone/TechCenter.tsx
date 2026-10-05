import { useEffect, useRef, useState } from 'react';
import { COURSES, COURSE_BY_ID, type CourseId } from '../../content/tech/courses';
import { useGame } from '../../store/gameStore';
import { Icon } from '../art/Icon';

const fmt = (n: number) => n.toLocaleString('pt-BR');

/** A bought course: a short lesson, then one question. Passing it turns the skill on. */
function Lesson({ id, onBack }: { id: CourseId; onBack: () => void }) {
  const c = COURSE_BY_ID[id];
  const pass = useGame((s) => s.passCourse);
  const state = useGame((s) => s.courses[id]);
  const [pick, setPick] = useState<number | null>(null);
  const right = pick === c.lesson.correct;
  const finishRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (right) finishRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [right]);
  return (
    <div className="space-y-3 animate-slide">
      <button onClick={onBack} className="text-sm font-bold text-bark-soft flex items-center gap-1">← Cursos</button>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-sun/20 flex items-center justify-center"><Icon name={c.icon} size={38} /></div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-bark-soft">Mini-aula</div>
          <div className="font-display text-xl font-semibold leading-tight">{c.name}</div>
        </div>
      </div>
      {c.lesson.text.map((p, i) => <p key={i} className="text-[14px] leading-snug">{p}</p>)}
      <div className="rounded-2xl bg-paper border border-bark/10 p-3 space-y-2">
        <div className="font-bold text-[14px]">{c.lesson.question}</div>
        {c.lesson.options.map((o, i) => {
          const chosen = pick === i;
          const tone = chosen ? (right ? 'border-leaf bg-leaf/20' : 'border-danger bg-danger/10') : 'border-bark/15 bg-cream/60';
          return (
            <button key={o} disabled={state === 'done' || right} onClick={() => setPick(i)} className={`w-full text-left rounded-xl border-2 px-3 py-2 text-[14px] transition active:scale-[.98] ${tone}`}>
              {o}
            </button>
          );
        })}
        {pick !== null && (
          <div className={`text-[13px] font-semibold ${right ? 'text-leaf-dark' : 'text-danger'}`}>
            {right ? `✓ ${c.lesson.why}` : '✗ Quase! Releia a aula e tente outra opção.'}
          </div>
        )}
      </div>
      {state === 'done' ? (
        <div className="rounded-xl bg-leaf/20 px-3 py-2 text-[14px] font-bold">Habilidade ativa: {c.effect}</div>
      ) : right ? (
        <button ref={finishRef} onClick={() => pass(id)} className="w-full chunky rounded-xl bg-leaf text-ink-dark font-display font-semibold py-2.5 active:scale-[.98]">
          Concluir curso e ativar habilidade
        </button>
      ) : null}
    </div>
  );
}

/** Centro Técnico: the phone app where coins buy skills for the next quests. */
export function TechCenter() {
  const coins = useGame((s) => s.coins);
  const courses = useGame((s) => s.courses);
  const buy = useGame((s) => s.buyCourse);
  const [open, setOpen] = useState<CourseId | null>(null);
  if (open) return <Lesson id={open} onBack={() => setOpen(null)} />;
  const doneCount = Object.values(courses).filter((v) => v === 'done').length;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-sun/15 border border-sun/40 px-3 py-2.5 text-[13px] leading-snug">
        Use as moedas da cidade para fazer cursos. Cada curso tem uma mini-aula e libera uma <b>habilidade</b> que ajuda nas próximas missões.
        <div className="mt-1 font-bold">{doneCount}/{COURSES.length} habilidades</div>
      </div>
      {COURSES.map((c) => {
        const st = courses[c.id];
        const afford = coins >= c.price;
        return (
          <div key={c.id} className={`rounded-2xl border p-3 ${st === 'done' ? 'bg-leaf/10 border-leaf/50' : 'bg-paper border-bark/10'}`}>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-cream flex items-center justify-center"><Icon name={c.icon} size={30} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold leading-tight">{c.name}</div>
                <div className="text-[13px] leading-snug">{c.effect}</div>
                <div className="text-[11px] text-bark-soft mt-0.5">Onde: {c.where}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-end gap-2">
              {st === 'done' ? (
                <span className="text-[13px] font-bold text-leaf-dark flex items-center gap-1"><Icon name="check" size={18} /> Habilidade ativa</span>
              ) : st === 'bought' ? (
                <button onClick={() => setOpen(c.id)} className="chunky rounded-xl bg-sun text-ink-dark font-display font-semibold px-4 py-1.5 text-sm">Continuar aula →</button>
              ) : (
                <>
                  {!afford && <span className="text-[11px] text-danger font-semibold">Faltam {fmt(c.price - coins)}</span>}
                  <button
                    disabled={!afford}
                    onClick={() => buy(c.id) && setOpen(c.id)}
                    className="chunky rounded-xl bg-sun text-ink-dark font-display font-semibold px-4 py-1.5 text-sm flex items-center gap-1 disabled:opacity-40"
                  >
                    <Icon name="coin" size={16} /> {fmt(c.price)}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
