import { useEffect, useState } from 'react';
import { EventBus } from './bridge/EventBus';
import type { BuildingId } from './content/buildings';
import { stepDef } from './content/missions/bridgeMission';
import { PhaserGame } from './game/PhaserGame';
import { useGame } from './store/gameStore';
import { BuildingPanel } from './ui/BuildingPanel';
import { DiscoveryOverlay } from './ui/hud/DiscoveryOverlay';
import { HintPanel } from './ui/hud/HintPanel';
import { FeedbackBanner } from './ui/hud/FeedbackBanner';
import { ControlsHint, InteractPrompt } from './ui/hud/InteractPrompt';
import { ObjectiveTracker } from './ui/hud/ObjectiveTracker';
import { SideMenu } from './ui/hud/SideMenu';
import { Toasts } from './ui/hud/Toasts';
import { TopBar } from './ui/hud/TopBar';
import { NotebookPanel } from './ui/notebook/NotebookPanel';
import { TitleScreen } from './ui/screens/TitleScreen';

/** Keeps the Phaser town in sync with the React store (single source of truth). */
function useGameBridge() {
  const [near, setNear] = useState<BuildingId | null>(null);
  const step = useGame((s) => s.mission.step);
  const open = useGame((s) => s.openBuilding);
  const notebook = useGame((s) => s.showNotebook);
  const discovering = useGame((s) => s.discoveryQueue.length > 0);
  const feedback = useGame((s) => s.showFeedback);
  const repaired = useGame((s) => s.bridgesRepaired);
  const lang = useGame((s) => s.lang);
  const [ready, setReady] = useState(0);

  useEffect(() => {
    const offs = [
      EventBus.on('scene:ready', () => setReady((r) => r + 1)),
      EventBus.on('building:near', ({ id }) => setNear(id)),
      EventBus.on('building:enter', ({ id }) => useGame.getState().enter(id)),
    ];
    return () => offs.forEach((o) => o());
  }, []);

  useEffect(() => {
    EventBus.emit('objective:set', { id: step === 'done' ? null : stepDef(step).building });
  }, [step, ready]);
  useEffect(() => {
    EventBus.emit('input:lock', { locked: !!open || notebook || discovering || feedback });
  }, [open, notebook, discovering, feedback, ready]);
  useEffect(() => {
    if (repaired) EventBus.emit('town:bridgesRepaired', { repaired: true });
  }, [repaired, ready]);
  const theme = useGame((s) => s.theme);
  useEffect(() => {
    EventBus.emit('theme:set', { theme });
  }, [theme, ready]);
  useEffect(() => {
    EventBus.emit('lang:set', { lang });
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
  }, [lang, ready]);

  // End of current content: invite feedback once, after the celebration cards are dismissed.
  const prompted = useGame((s) => s.feedbackPrompted);
  useEffect(() => {
    if (step !== 'done' || prompted || discovering || open) return;
    const id = setTimeout(() => useGame.getState().toggleFeedback(true), 900);
    return () => clearTimeout(id);
  }, [step, prompted, discovering, open]);

  return near;
}

function GameScreen() {
  const near = useGameBridge();
  const open = useGame((s) => s.openBuilding);
  return (
    <div className="relative h-full w-full overflow-hidden">
      <PhaserGame />
      <TopBar />
      <SideMenu />
      <ObjectiveTracker />
      {!open && <InteractPrompt near={near} />}
      <ControlsHint />
      <BuildingPanel />
      <NotebookPanel />
      <HintPanel />
      <FeedbackBanner />
      <DiscoveryOverlay />
      <Toasts />
    </div>
  );
}

/** Applies the theme to <html> (CSS tokens switch on data-theme). */
function useThemeAttribute() {
  const theme = useGame((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    EventBus.emit('theme:set', { theme });
  }, [theme]);
}

export default function App() {
  useThemeAttribute();
  const started = useGame((s) => s.started);
  return started ? <GameScreen /> : <TitleScreen />;
}
