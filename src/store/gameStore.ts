import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BuildingId } from '../content/buildings';
import type { ConceptId } from '../content/concepts';
import { BRIDGE_MISSION, stepDef, stepIndex, type BridgeStep } from '../content/missions/bridgeMission';
import type { CleaningDecisions } from '../ml/cleaning';
import type { FeatureKey } from '../ml/dataset';
import type { TrainRequest } from '../ml/engine/types';
import { getDict, type Lang } from '../i18n';

export interface BridgeMissionState {
  step: BridgeStep;
  features: FeatureKey[];
  cleaning: Partial<CleaningDecisions>;
  /** Every model the player trained (latest last) — powers comparison. */
  experiments: TrainRequest[];
  /** The model under evaluation. */
  currentModel?: TrainRequest;
  threshold: number;
  severityAnswer?: string;
  deepModel?: TrainRequest;
  finalModel?: TrainRequest;
  finalThreshold?: number;
  /** Per-panel sub-progress so reloading resumes mid-step. */
  flags: Record<string, boolean>;
}

export interface Toast {
  id: number;
  text: string;
  kind: 'xp' | 'coins' | 'info' | 'good' | 'warn';
}

interface GameState {
  started: boolean;
  lang: Lang;
  theme: Theme;
  xp: number;
  coins: number;
  day: number;
  concepts: ConceptId[];
  mission: BridgeMissionState;
  bridgesRepaired: boolean;
  feedbackPrompted: boolean;
  // transient (not persisted)
  openBuilding: BuildingId | null;
  showNotebook: boolean;
  showHint: boolean;
  showFeedback: boolean;
  toasts: Toast[];
  discoveryQueue: ConceptId[];

  newGame: () => void;
  continueGame: () => void;
  enter: (id: BuildingId | null) => void;
  toggleNotebook: (v?: boolean) => void;
  toggleHint: (v?: boolean) => void;
  toggleFeedback: (v?: boolean) => void;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  gainXp: (amount: number, reason?: 'step' | 'discovery' | 'mission') => void;
  gainCoins: (amount: number) => void;
  discover: (...ids: ConceptId[]) => void;
  dismissDiscovery: () => void;
  toast: (text: string, kind?: Toast['kind']) => void;
  patchMission: (p: Partial<BridgeMissionState>) => void;
  setFlag: (flag: string) => void;
  /** Completes the current step (if it matches) and moves to the next one. */
  completeStep: (step: BridgeStep) => void;
  addExperiment: (req: TrainRequest) => void;
  repairBridges: () => void;
}

const freshMission = (): BridgeMissionState => ({
  step: 'talk_mayor',
  features: [],
  cleaning: {},
  experiments: [],
  threshold: 0.5,
  flags: {},
});

let toastId = 1;

export type Theme = 'light' | 'dark';
const systemTheme = (): Theme => {
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

export const XP_PER_LEVEL = 150;
export const levelOf = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      started: false,
      lang: 'pt',
      theme: systemTheme(),
      xp: 0,
      coins: 1200,
      day: 1,
      concepts: [],
      mission: freshMission(),
      bridgesRepaired: false,
      openBuilding: null,
      showNotebook: false,
      showHint: false,
      showFeedback: false,
      feedbackPrompted: false,
      toasts: [],
      discoveryQueue: [],

      newGame: () =>
        set({
          started: true, xp: 0, coins: 1200, day: 1, concepts: [], mission: freshMission(),
          bridgesRepaired: false, feedbackPrompted: false, openBuilding: null, discoveryQueue: [],
        }),
      continueGame: () => set({ started: true }),
      enter: (id) => set({ openBuilding: id }),
      toggleNotebook: (v) => set((s) => ({ showNotebook: v ?? !s.showNotebook })),
      toggleHint: (v) => set((s) => ({ showHint: v ?? !s.showHint })),
      toggleFeedback: (v) => set((s) => ({ showFeedback: v ?? !s.showFeedback, feedbackPrompted: true })),
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),

      gainXp: (amount, reason) => {
        if (amount <= 0) return;
        const before = levelOf(get().xp);
        set((s) => ({ xp: s.xp + amount }));
        const t = getDict(get().lang).toast;
        get().toast(t.xp(amount, reason ? t[reason] : undefined), 'xp');
        const after = levelOf(get().xp);
        if (after > before) get().toast(t.level(after), 'good');
      },
      gainCoins: (amount) => {
        set((s) => ({ coins: s.coins + amount }));
        get().toast(getDict(get().lang).toast.coins(amount), 'coins');
      },

      discover: (...ids) => {
        const known = new Set(get().concepts);
        const fresh = ids.filter((id) => !known.has(id));
        if (!fresh.length) return;
        set((s) => ({ concepts: [...s.concepts, ...fresh], discoveryQueue: [...s.discoveryQueue, ...fresh] }));
        get().gainXp(10 * fresh.length, 'discovery');
      },
      dismissDiscovery: () => set((s) => ({ discoveryQueue: s.discoveryQueue.slice(1) })),

      toast: (text, kind = 'info') => {
        const id = toastId++;
        set((s) => ({ toasts: [...s.toasts.slice(-4), { id, text, kind }] }));
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
      },

      patchMission: (p) => set((s) => ({ mission: { ...s.mission, ...p } })),
      setFlag: (flag) => set((s) => ({ mission: { ...s.mission, flags: { ...s.mission.flags, [flag]: true } } })),

      completeStep: (step) => {
        const { mission } = get();
        if (mission.step !== step) return;
        const next = BRIDGE_MISSION.steps[stepIndex(step) + 1];
        if (!next) return;
        set((s) => ({ mission: { ...s.mission, step: next.id }, day: s.day + 1 }));
        get().gainXp(stepDef(step).xp, 'step');
      },

      addExperiment: (req) =>
        set((s) => {
          const key = JSON.stringify(req);
          const rest = s.mission.experiments.filter((e) => JSON.stringify(e) !== key);
          return { mission: { ...s.mission, experiments: [...rest, req].slice(-8) } };
        }),

      repairBridges: () => set({ bridgesRepaired: true }),
    }),
    {
      name: 'model-town-save-v1',
      version: 1,
      partialize: (s) => ({
        started: s.started, lang: s.lang, theme: s.theme, xp: s.xp, coins: s.coins, day: s.day, concepts: s.concepts,
        mission: s.mission, bridgesRepaired: s.bridgesRepaired, feedbackPrompted: s.feedbackPrompted,
      }),
      merge: (persisted, current) => ({ ...current, ...(persisted as object), started: false }),
    },
  ),
);

export const hasSave = () => {
  try {
    const raw = localStorage.getItem('model-town-save-v1');
    if (!raw) return false;
    const s = JSON.parse(raw).state;
    return s && (s.xp > 0 || s.mission?.step !== 'talk_mayor');
  } catch {
    return false;
  }
};
