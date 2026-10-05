import { useMemo, useState } from 'react';
import type { BuildingId } from '../../content/buildings';
import { useT } from '../../i18n';
import { createRng } from '../../ml/rng';
import { hasSave, progressSummary, useGame } from '../../store/gameStore';
import { BuildingArt } from '../art/BuildingArt';
import { Icon } from '../art/Icon';
import { Logo } from '../art/Logo';
import { NeonCharacter } from '../art/NeonCharacter';
import { CAR_COLORS, SideCarShape } from '../art/Vehicles';
import { Button } from '../common/Button';
import { useTouch } from '../common/useTouch';
import { LangToggle } from '../hud/LangToggle';
import { ThemeToggle } from '../hud/ThemeToggle';
import { GOATCOUNTER_CODE } from '../../analytics';

const SKY = {
  dark: 'linear-gradient(to bottom, #1f2338 0%, #2f3452 45%, #4f4a6b 75%, #9a7f8f 100%)',
  light: 'linear-gradient(to bottom, #c6d8e8 0%, #dfe3ee 50%, #ece5ea 80%, #f3e3d8 100%)',
};
const WIN = ['#f2c46d', '#f7e3b5', '#ffd89a', '#8fb8de', '#d9a0b4'];

/** Distant skyline: flat towers with lit windows, drawn once from a seed. */
function Skyline({ seed, height, color, bottom }: { seed: number; height: number; color: string; bottom: string }) {
  const towers = useMemo(() => {
    const rng = createRng(seed);
    const out: { x: number; w: number; h: number; wins: { x: number; y: number; c: string }[] }[] = [];
    let x = -10;
    while (x < 1210) {
      const w = 40 + rng() * 70;
      const h = height * (0.35 + rng() * 0.65);
      const wins = [];
      for (let yy = 12; yy < h - 10; yy += 14)
        for (let xx = 8; xx < w - 8; xx += 12) if (rng() < 0.35) wins.push({ x: xx, y: yy, c: WIN[Math.floor(rng() * WIN.length)] });
      out.push({ x, w, h, wins });
      x += w + 6 + rng() * 14;
    }
    return out;
  }, [seed, height]);
  return (
    <svg viewBox={`0 0 1200 ${height}`} preserveAspectRatio="xMidYMax slice" className="absolute left-0 w-full" style={{ bottom, height: `${height / 7}%` }} aria-hidden>
      {towers.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${height - t.h})`}>
          <rect width={t.w} height={t.h} fill={color} />
          <rect width={t.w} height="2" fill="#f2c46d" opacity="0.35" />
          {t.wins.map((w, j) => <rect key={j} x={w.x} y={w.y} width="6" height="5" fill={w.c} opacity="0.6" />)}
        </g>
      ))}
    </svg>
  );
}

/** Straight avenue along the bottom, with the town's own cars driving both ways (CSS animation). */
function Avenue({ theme }: { theme: 'light' | 'dark' }) {
  const road = theme === 'dark' ? 'from-[#33384f] to-[#262a40]' : 'from-[#b7bdd0] to-[#9aa1b8]';
  return (
    <div className="absolute left-0 right-0 bottom-0 h-[26%] overflow-hidden" aria-hidden>
      <div className={`absolute inset-0 bg-gradient-to-b ${road}`} />
      <div className="absolute left-0 right-0 top-0 h-[2px] bg-[#8fb8de] opacity-60" />
      <div className="absolute left-0 right-0 top-[48%] h-[2px] bg-[repeating-linear-gradient(90deg,#f2c46d_0_28px,transparent_28px_56px)] opacity-70" />
      <div className="absolute left-0 right-0 bottom-[8%] h-[2px] bg-[#d9a0b4] opacity-50" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const toRight = i % 2 === 0;
        const color = CAR_COLORS[i % CAR_COLORS.length];
        return (
          <div
            key={i}
            className="absolute left-0"
            style={{ top: toRight ? '2%' : '44%', animation: `${toRight ? 'car-right' : 'car-left-noflip'} ${8 + (i % 3) * 2}s linear ${-i * 2.2}s infinite` }}
          >
            {/* the town car in profile, facing the way it drives */}
            <svg viewBox="0 0 62 36" width={62 * 1.9} height={36 * 1.9} style={{ transform: toRight ? undefined : 'scaleX(-1)' }}>
              <SideCarShape color={color} />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

export function TitleScreen() {
  const t = useT();
  const touch = useTouch();
  const { newGame, continueGame } = useGame();
  const theme = useGame((s) => s.theme);
  const save = hasSave();
  const [confirmNew, setConfirmNew] = useState(false);
  const stars = useMemo(() => {
    const rng = createRng(9);
    return Array.from({ length: 60 }, () => ({ x: rng() * 100, y: rng() * 45, s: 1 + rng() * 2, d: rng() * 3 }));
  }, []);
  const front: { id: BuildingId; left: string; size: number }[] = [
    { id: 'datacenter', left: '2%', size: 170 },
    { id: 'cityhall', left: '14%', size: 210 },
    { id: 'mllab', left: '70%', size: 180 },
    { id: 'monitoring', left: '84%', size: 210 },
  ];

  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center" style={{ background: SKY[theme] }}>
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-20 flex items-center gap-2">
        <LangToggle />
        <ThemeToggle />
      </div>

      {theme === 'dark' &&
        stars.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-white animate-pulse" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
        ))}


      <Skyline seed={4} height={420} color={theme === 'dark' ? '#2f3452' : '#b3b8cc'} bottom="26%" />
      <Skyline seed={7} height={300} color={theme === 'dark' ? '#383d5e' : '#9aa0b8'} bottom="26%" />
      <Avenue theme={theme} />

      {front.map((b) => (
        <div key={b.id} className="absolute" style={{ left: b.left, bottom: '18%' }}>
          <BuildingArt id={b.id} size={b.size} />
        </div>
      ))}
      <NeonCharacter sheet="femaleAdventurer" height={120} glow="#8fb8de66" className="absolute bottom-[6%] left-[36%] animate-float" />
      <NeonCharacter sheet="malePerson" frame={[7, 0]} height={100} flip glow="#d9a0b466" className="absolute bottom-[7%] right-[34%]" />

      <a
        href="https://www.dicebear.com/styles/adventurer/"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 right-3 z-20 text-[11px] text-bark-soft/80 hover:text-bark bg-paper/70 rounded-full px-3 py-0.5"
      >
        {t.title.credits}
      </a>

      <div className="relative z-10 text-center animate-pop -mt-24 mx-4">
        <div className="card chunky inline-block px-5 py-6 sm:px-10 sm:py-7">
          <Logo size={72} className="mx-auto mb-2" />
          <h1 className="font-display text-5xl sm:text-7xl font-semibold text-bark neon-text">Model Town</h1>
          <p className="font-display text-xl sm:text-2xl text-bark-soft mt-2">{t.title.subtitle}</p>
          <p className="text-bark-soft mt-1">{t.title.tagline}</p>

          <div className="mt-7 flex flex-col items-center gap-3">
            {save && (
              <div className="flex flex-col items-center gap-1">
                <Button size="lg" variant="leaf" onClick={continueGame} className="flex items-center gap-2">
                  <Icon name="play" size={22} /> {t.title.continue}
                </Button>
                <span className="text-sm text-bark-soft max-w-xs">{progressSummary(useGame.getState(), t)}</span>
              </div>
            )}
            {!confirmNew ? (
              <Button size="lg" variant={save ? 'ghost' : 'sun'} onClick={() => (save ? setConfirmNew(true) : newGame())} className="flex items-center gap-2">
                <Icon name="seed" size={24} /> {t.title.newGame}
              </Button>
            ) : (
              <div className="card px-4 py-3 flex flex-wrap items-center justify-center gap-3 animate-pop">
                <span>{t.title.confirmErase}</span>
                <Button size="sm" variant="danger" onClick={newGame}>{t.title.yesRestart}</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmNew(false)}>{t.title.cancel}</Button>
              </div>
            )}
          </div>
          <div className="mt-5 text-sm text-bark-soft flex items-center justify-center gap-2">
            <Icon name={touch ? 'mouse' : 'keyboard'} size={20} /> {touch ? t.title.controlsTouch : t.title.controls}
          </div>
          <div className="text-xs text-bark-soft/80 mt-1">
            {t.title.savedLocally}
            {GOATCOUNTER_CODE && <> {t.title.privacy}</>}
          </div>
        </div>
      </div>
    </div>
  );
}
