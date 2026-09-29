import { useEffect, useState } from 'react';
import { PORTRAITS, type HostId } from '../../content/buildings';
import { useT } from '../../i18n';
import { Portrait } from '../art/Portrait';
import { Button } from './Button';
import { hostName } from './Speech';
import { PersonCard } from './PersonCard';

export interface Line { who: HostId; text: string }

/** Visual-novel style dialogue with a typewriter effect. Click to skip / advance. */
export function Dialogue({ lines, onDone, doneLabel }: { lines: Line[]; onDone: () => void; doneLabel?: string }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const line = lines[i];
  const full = shown >= line.text.length;

  useEffect(() => setShown(0), [i]);
  useEffect(() => {
    if (full) return;
    const id = setTimeout(() => setShown((s) => s + 2), 18);
    return () => clearTimeout(id);
  }, [shown, full]);

  const next = () => {
    if (!full) return setShown(line.text.length);
    if (i < lines.length - 1) setI(i + 1);
    else onDone();
  };

  return (
    <div className="flex gap-4 items-end cursor-pointer select-none" onClick={next}>
      <span onClick={(e) => e.stopPropagation()}><PersonCard who={line.who}><Portrait spec={PORTRAITS[line.who]} size={104} className="animate-float" /></PersonCard></span>
      <div className="flex-1 wood rounded-3xl px-5 py-4 min-h-[120px] relative">
        <div className="font-display font-semibold text-lg">{hostName(t, line.who)}</div>
        <p className="text-lg leading-relaxed mt-1">{line.text.slice(0, shown)}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-bark-soft">{i + 1}/{lines.length}</span>
          {full && i === lines.length - 1 ? (
            <Button variant="leaf" onClick={(e) => { e.stopPropagation(); onDone(); }}>{doneLabel ?? t.common.letsGo}</Button>
          ) : (
            <span className="text-sm text-bark-soft animate-pulse">{t.common.clickNext} ›</span>
          )}
        </div>
      </div>
    </div>
  );
}
