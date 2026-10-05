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
import { Phone } from './ui/phone/Phone';
import { PhoneButton } from './ui/phone/PhoneButton';
import { useRagStatus } from './ui/phone/ragStatus';
import { ChatbotLiveCard } from './ui/phone/ChatbotLiveCard';
import { TechUnlockCard } from './ui/phone/TechUnlockCard';

/** Keeps the Phaser town in sync with the React store (single source of truth). */
function useGameBridge() {
  const [near, setNear] = useState<BuildingId | null>(null);
  const step = useGame((s) => s.mission.step);
  const open = useGame((s) => s.openBuilding);
  const notebook = useGame((s) => s.showNotebook);
  const discovering = useGame((s) => s.discoveryQueue.length > 0);
  const feedback = useGame((s) => s.showFeedback);
  const phone = useGame((s) => s.showPhone);
  const rag = useGame((s) => s.activeMission === 'rag');
  const ragTarget = useRagStatus().target;
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
    EventBus.emit('objective:set', { id: rag ? ragTarget : step === 'done' ? null : stepDef(step).building });
  }, [step, rag, ragTarget, ready]);
  useEffect(() => {
    EventBus.emit('input:lock', { locked: !!open || notebook || discovering || feedback || phone });
  }, [open, notebook, discovering, feedback, phone, ready]);
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

  // Quest 1 done: once the celebration cards are dismissed, the phone rings with quest 2.
  useEffect(() => {
    if (rag || step !== 'done' || discovering || open) return;
    const id = setTimeout(() => useGame.getState().startRag(), 1500);
    return () => clearTimeout(id);
  }, [rag, step, discovering, open]);

  // Quest 2 shipped: townsfolk start praising the chatbot (once the phone is put away, so you see it).
  const ragDone = useGame((s) => s.rag.step === 'done');
  useEffect(() => {
    EventBus.emit('town:chatbotLive', { live: rag && ragDone && !phone });
  }, [rag, ragDone, phone, ready]);

  // End of current content: after the first Centro Técnico course, invite feedback once (phone and panels closed).
  const prompted = useGame((s) => s.feedbackPrompted);
  const firstCourse = useGame((s) => Object.values(s.courses).includes('done'));
  useEffect(() => {
    if (!rag || !firstCourse || prompted || discovering || open || phone) return;
    const id = setTimeout(() => useGame.getState().toggleFeedback(true), 900);
    return () => clearTimeout(id);
  }, [rag, firstCourse, prompted, discovering, open, phone]);

  return near;
}

function GameScreen() {
  const near = useGameBridge();
  const open = useGame((s) => s.openBuilding);
  return (
    <div className="relative h-full w-full overflow-hidden">
      <PhaserGame />
      <div className="hud-safe">
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
        <PhoneButton />
        <Phone />
        <ChatbotLiveCard />
        <TechUnlockCard />
        <Toasts />
      </div>
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
