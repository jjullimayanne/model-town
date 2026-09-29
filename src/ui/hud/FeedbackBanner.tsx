import { useState } from 'react';
import { useT } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { Icon } from '../art/Icon';
import { Logo } from '../art/Logo';
import { Button } from '../common/Button';

/** Where feedback goes. No backend yet: we open the player's mail app pre-filled (mailto). */
export const FEEDBACK_EMAIL = 'jubsmayanne@gmail.com';

/** End-of-content banner: "that's all for now" + a small feedback form. */
export function FeedbackBanner() {
  const t = useT();
  const f = t.feedback;
  const show = useGame((s) => s.showFeedback);
  const close = () => useGame.getState().toggleFeedback(false);
  const { xp, concepts, lang } = useGame();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent' | 'copied'>('idle');

  if (!show) return null;

  const body = [
    `${f.bodyRating}: ${rating ? `${rating}/5 (${f.ratingLabels[rating - 1]})` : '-'}`,
    `${f.bodyName}: ${name.trim() || '-'}`,
    '',
    `${f.bodyMessage}:`,
    message.trim() || '-',
    '',
    `${f.bodyStats}: ${xp} XP · ${concepts.length} ${lang === 'en' ? 'concepts' : 'conceitos'} · ${lang.toUpperCase()}`,
  ].join('\n');

  const send = () => {
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(f.subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    setStatus('sent');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${f.subject}\n\n${body}`);
      setStatus('copied');
    } catch {
      setStatus('idle');
    }
  };

  const shown = hover || rating;
  return (
    <div className="absolute inset-0 z-[75] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="card w-full max-w-lg p-6 animate-pop max-h-[92vh] overflow-y-auto scroll-soft">
        <div className="flex items-start gap-4">
          <Logo size={64} />
          <div className="flex-1">
            <div className="font-display text-3xl font-semibold leading-tight">{f.title}</div>
            <p className="text-bark-soft mt-1 leading-snug">{f.subtitle}</p>
          </div>
          <button onClick={close} className="w-9 h-9 rounded-full hover:bg-cream flex items-center justify-center" title={t.common.close}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <p className="mt-4 text-[15px]">{f.ask}</p>

        <div className="mt-4">
          <div className="text-sm font-bold mb-1">{f.rating}</div>
          <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={f.ratingLabels[n - 1]}
                aria-pressed={rating === n}
                className={`p-0.5 transition ${n <= shown ? '' : 'opacity-25 grayscale'}`}
              >
                <Icon name="star" size={32} />
              </button>
            ))}
            <span className="ml-2 text-sm text-bark-soft">{shown ? f.ratingLabels[shown - 1] : ''}</span>
          </div>
        </div>

        <label className="block mt-4">
          <span className="text-sm font-bold">{f.message}</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={f.placeholder}
            rows={4}
            className="mt-1 w-full rounded-xl bg-white border border-bark/15 px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-sky resize-y"
          />
        </label>
        <label className="block mt-3">
          <span className="text-sm font-bold">{f.name}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl bg-white border border-bark/15 px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-sky"
          />
        </label>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button variant="sun" onClick={send} disabled={!rating && !message.trim()} className="flex items-center gap-2">
            <Icon name="newspaper" size={20} /> {f.send}
          </Button>
          <Button variant="ghost" onClick={copy}>{status === 'copied' ? f.copied : f.copy}</Button>
          <div className="flex-1" />
          <button onClick={close} className="text-sm text-bark-soft hover:underline">{f.later}</button>
        </div>

        <div className="mt-3 text-xs text-bark-soft">
          {status === 'sent' ? <b className="text-leaf-dark">{f.thanks} </b> : null}
          {f.sentHint} {f.orSend} <span className="font-bold select-all text-bark">{FEEDBACK_EMAIL}</span>
        </div>
      </div>
    </div>
  );
}
