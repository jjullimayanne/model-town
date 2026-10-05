import { useEffect, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { doneFlag } from '../../content/missions/ragMission';
import { QUESTIONS } from '../../content/rag/manual';
import { askNaive } from '../../rag/retrieve';
import { useGame, useSkill } from '../../store/gameStore';
import { Icon, type IconName } from '../art/Icon';
import { Button } from '../common/Button';
import { useChart } from '../common/chartTheme';
import { Speech } from '../common/Speech';
import { runBatch } from './widgets';

const fmt = (n: number) => n.toLocaleString('pt-BR');

// First week in production (made-up but consistent: per-day questions sum to the total, topics too).
const WEEK = [
  { dia: 'Seg', perguntas: 1200, satisfacao: 81 }, { dia: 'Ter', perguntas: 1550, satisfacao: 86 },
  { dia: 'Qua', perguntas: 1720, satisfacao: 89 }, { dia: 'Qui', perguntas: 1890, satisfacao: 91 },
  { dia: 'Sex', perguntas: 1980, satisfacao: 93 }, { dia: 'Sáb', perguntas: 2040, satisfacao: 94 },
  { dia: 'Dom', perguntas: 2100, satisfacao: 95 },
];
const TOPICS = [
  { tema: 'Lixo', n: 3120 }, { tema: 'IPTU', n: 2410 }, { tema: 'Ônibus', n: 1980 }, { tema: 'Saúde', n: 1650 },
  { tema: 'Biblioteca', n: 1190 }, { tema: 'Outros', n: 1150 }, { tema: 'Pontes', n: 980 },
];
const COMMENTS = [
  { who: 'Dona Cida', stars: 5, text: 'Perguntei do lixo e ele sabia até o horário de deixar os sacos!' },
  { who: 'Seu Jorge', stars: 5, text: 'Parcelei o IPTU sem sair de casa.' },
  { who: 'Bia', stars: 4, text: 'Muito rápido. Só queria que falasse dos eventos também.' },
  { who: 'Caio', stars: 5, text: 'Me avisou da ponte fechada antes de eu sair. Salvou meu dia.' },
];

function Kpi({ icon, label, value, hint }: { icon: IconName; label: string; value: string; hint: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-xs font-bold uppercase tracking-wide text-bark-soft flex items-center gap-1"><Icon name={icon} size={16} /> {label}</div>
      <div className="font-display text-3xl font-semibold mt-0.5">{value}</div>
      <div className="text-[12px] text-bark-soft leading-tight">{hint}</div>
    </div>
  );
}

/** Lu's dashboard: how townsfolk feel about the chatbot in its first week. Visiting it closes quest 2. */
export function SatisfactionDashboard() {
  const { SERIES, INK, MAG, textColor, tooltipStyle } = useChart();
  const flag = useGame((s) => s.ragFlag);
  const seen = useGame((s) => !!s.rag.flags[doneFlag('done')]);
  const openFeedback = () => useGame.getState().toggleFeedback(true);
  const lean = useSkill('lean_prompt');
  const proactive = useSkill('proactive_monitoring');

  useEffect(() => { if (!seen) flag(doneFlag('done')); }, [seen, flag]);

  // Real numbers from the player's own pipeline: whole manual vs RAG top-3.
  const cost = useMemo(() => {
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const before = avg(QUESTIONS.map((q) => askNaive(q).coins));
    const after = avg(runBatch(3).answers.map((a) => a.coins));
    return { before: Math.round(before), after: Math.round(after), saving: Math.round((1 - after / before) * 100) };
  }, [lean]);
  const total = WEEK.reduce((s, d) => s + d.perguntas, 0);
  const today = WEEK[WEEK.length - 1].satisfacao;

  return (
    <div className="space-y-4">
      <Speech who="monitoring" tone="good">Os moradores não param de falar do chatbot! Olha os números da primeira semana no ar.</Speech>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon="clipboard" label="Perguntas" value={fmt(total)} hint="respondidas na 1ª semana" />
        <Kpi icon="star" label="Satisfeitos" value={`${today}%`} hint={`de ${WEEK[0].satisfacao}% no 1º dia`} />
        <Kpi icon="coin" label="Custo/pergunta" value={`${cost.after}`} hint={`antes: ${cost.before} moedas (−${cost.saving}%)${lean ? ' · Prompt enxuto' : ''}`} />
        <Kpi icon="hourglass" label="Resposta" value="1,2 s" hint="24 horas por dia" />
      </div>

      {proactive && (
        <div className="rounded-2xl border-2 border-coral/60 bg-coral/10 px-4 py-3 flex gap-3 items-start">
          <Icon name="warning" size={32} />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-bark-soft">Monitoramento proativo · alerta de drift</div>
            <div className="font-display text-lg font-semibold leading-tight">Perguntas sobre eventos subiram 40% esta semana</div>
            <div className="text-sm leading-snug mt-0.5">O Manual da Cidade não fala de eventos, e a satisfação nesse tema está em 61%. O uso mudou e a base de conhecimento não acompanhou: é hora de atualizar antes que as reclamações cheguem.</div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="font-display font-semibold">Moradores satisfeitos por dia (%)</div>
          <div className="h-56 mt-2">
            <ResponsiveContainer>
              <LineChart data={WEEK} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={INK.grid} vertical={false} />
                <XAxis dataKey="dia" stroke={INK.axis} tickLine={false} />
                <YAxis domain={[70, 100]} ticks={[70, 80, 90, 100]} width={44} stroke={INK.axis} tickLine={false} unit="%" />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Satisfeitos']} />
                <Line type="monotone" dataKey="satisfacao" stroke={SERIES.train} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false}>
                  <LabelList dataKey="satisfacao" position="top" formatter={(v) => (v === today ? `${v}%` : '')} fill={textColor} fontSize={12} fontWeight={700} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <div className="font-display font-semibold">Perguntas por tema</div>
          <div className="h-56 mt-2">
            <ResponsiveContainer>
              <BarChart data={TOPICS} layout="vertical" margin={{ top: 0, right: 48, left: 4, bottom: 0 }} barCategoryGap={6}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="tema" width={78} stroke={INK.axis} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: INK.grid }} formatter={(v) => [fmt(Number(v)), 'Perguntas']} />
                <Bar dataKey="n" fill={MAG} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  <LabelList dataKey="n" position="right" formatter={(v) => fmt(Number(v))} fill={textColor} fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="font-display font-semibold mb-2">O que os moradores estão dizendo</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {COMMENTS.map((c) => (
            <div key={c.who} className="rounded-xl bg-cream/70 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[14px]">{c.who}</span>
                <span className="text-sun-dark text-[13px]" aria-label={`${c.stars} de 5 estrelas`}>{'★'.repeat(c.stars)}{'☆'.repeat(5 - c.stars)}</span>
              </div>
              <div className="text-[14px] leading-snug">{c.text}</div>
            </div>
          ))}
        </div>
      </div>

      <Speech who="monitoring">É pra isso que serve monitorar: ver se o modelo funciona no mundo real, com gente de verdade. A Bia já pediu eventos… quem sabe na próxima missão? 😉</Speech>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="sun" onClick={openFeedback}>Contar o que achei do jogo</Button>
        <span className="text-sm text-bark-soft">Missão 2 concluída!</span>
      </div>
    </div>
  );
}
