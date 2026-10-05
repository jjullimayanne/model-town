import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BuildingId } from '../content/buildings';
import type { ConceptId } from '../content/concepts';
import { BRIDGE_MISSION, stepDef, stepIndex, type BridgeStep } from '../content/missions/bridgeMission';
import { RAG_STEPS, ragIndex, type RagStep } from '../content/missions/ragMission';
import { COURSE_BY_ID, type CourseId } from '../content/tech/courses';
import type { CleaningDecisions } from '../ml/cleaning';
import type { FeatureKey } from '../ml/dataset';
import type { TrainRequest } from '../ml/engine/types';
import { getDict, type Lang } from '../i18n';
import { track } from '../analytics';

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

export interface RagMissionState {
  step: RagStep;
  /** Question ids asked in each step, in order (answers are recomputed from them). */
  asked: Partial<Record<RagStep, string[]>>;
  /** Coins spent on "AI" calls per step — the bill the player is trying to shrink. */
  spent: Partial<Record<RagStep, number>>;
  flags: Record<string, boolean>;
  /** The player's replies in the Mayor's chat: choice id → option index. */
  choices: Record<string, number>;
}

export type MissionId = 'bridges' | 'rag';
export type PhoneApp = 'home' | 'chat' | 'tech';
/** A course is bought first, then its lesson is passed (only then the skill works). */
export type CourseState = 'bought' | 'done';

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
  activeMission: MissionId;
  rag: RagMissionState;
  bridgesRepaired: boolean;
  feedbackPrompted: boolean;
  // transient (not persisted)
  openBuilding: BuildingId | null;
  showNotebook: boolean;
  showHint: boolean;
  showFeedback: boolean;
  showPhone: boolean;
  phoneApp: PhoneApp;
  /** Centro Técnico progress. */
  courses: Partial<Record<CourseId, CourseState>>;
  /** Set once the player has opened the Centro Técnico app (clears the "new" badge). */
  techSeen: boolean;
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
  /** Starts quest 2 (the citizen chatbot): the phone rings. */
  startRag: () => void;
  togglePhone: (v?: boolean, app?: PhoneApp) => void;
  setPhoneApp: (app: PhoneApp) => void;
  buyCourse: (id: CourseId) => boolean;
  passCourse: (id: CourseId) => void;
  ragAsk: (step: RagStep, questionId: string, coins: number) => void;
  ragFlag: (flag: string, value?: boolean) => void;
  ragChoose: (id: string, option: number) => void;
  completeRag: (step: RagStep) => void;
}

const freshRag = (): RagMissionState => ({ step: 'ring', asked: {}, spent: {}, flags: {}, choices: {} });

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
      activeMission: 'bridges',
      rag: freshRag(),
      bridgesRepaired: false,
      showPhone: false,
      phoneApp: 'home',
      courses: {},
      techSeen: false,
      openBuilding: null,
      showNotebook: false,
      showHint: false,
      showFeedback: false,
      feedbackPrompted: false,
      toasts: [],
      discoveryQueue: [],

      newGame: () => {
        track('new-game');
        set({
          started: true, xp: 0, coins: 1200, day: 1, concepts: [], mission: freshMission(), activeMission: 'bridges', rag: freshRag(), courses: {}, techSeen: false,
          bridgesRepaired: false, feedbackPrompted: false, openBuilding: null, discoveryQueue: [],
        });
      },
      continueGame: () => {
        track(`continue/${get().mission.step}`);
        set({ started: true });
      },
      enter: (id) => set({ openBuilding: id }),
      toggleNotebook: (v) => set((s) => ({ showNotebook: v ?? !s.showNotebook })),
      toggleHint: (v) => {
        const open = v ?? !get().showHint;
        if (open) track(`hint/${get().mission.step}`);
        set({ showHint: open });
      },
      toggleFeedback: (v) => {
        const open = v ?? !get().showFeedback;
        if (open) track('feedback/open');
        set({ showFeedback: open, feedbackPrompted: true });
      },
      setLang: (lang) => {
        if (lang !== get().lang) track(`lang/${lang}`);
        set({ lang });
      },
      setTheme: (theme) => {
        if (theme !== get().theme) track(`theme/${theme}`);
        set({ theme });
      },

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
        const bonus = amount > 0 && get().courses.city_budget === 'done' ? Math.round(amount * 0.1) : 0;
        set((s) => ({ coins: s.coins + amount + bonus }));
        get().toast(getDict(get().lang).toast.coins(amount + bonus) + (bonus ? ' (+10% Orçamento da cidade)' : ''), 'coins');
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
        track(next.id === 'done' ? 'mission/bridges-complete' : `step/${step}`);
        get().gainXp(stepDef(step).xp, 'step');
      },

      addExperiment: (req) =>
        set((s) => {
          const key = JSON.stringify(req);
          const rest = s.mission.experiments.filter((e) => JSON.stringify(e) !== key);
          return { mission: { ...s.mission, experiments: [...rest, req].slice(-8) } };
        }),

      repairBridges: () => set({ bridgesRepaired: true }),

      startRag: () => {
        track('mission/rag-start');
        set({ started: true, activeMission: 'rag', rag: freshRag(), openBuilding: null, discoveryQueue: [] });
      },
      togglePhone: (v, app) => {
        const open = v ?? !get().showPhone;
        // The Mayor's chat is the default while quest 2 still has something to say; otherwise the home screen.
        const r = get().rag;
        const chatFirst = r.step !== 'done' || !r.flags.done_done || r.flags.unread;
        const nextApp = app ?? (chatFirst ? 'chat' : 'home');
        if (open) get().setPhoneApp(nextApp);
        set({ showPhone: open, openBuilding: open ? null : get().openBuilding });
        if (open && get().rag.step === 'ring') get().completeRag('ring');
        if (open && get().rag.flags.unread) get().ragFlag('unread', false);
      },
      ragAsk: (step, questionId, coins) => {
        set((s) => ({
          coins: s.coins - coins,
          rag: {
            ...s.rag,
            asked: { ...s.rag.asked, [step]: [...(s.rag.asked[step] ?? []), questionId] },
            spent: { ...s.rag.spent, [step]: (s.rag.spent[step] ?? 0) + coins },
          },
        }));
      },
      setPhoneApp: (app) => set((s) => ({ phoneApp: app, techSeen: s.techSeen || app === 'tech' })),
      buyCourse: (id) => {
        const c = COURSE_BY_ID[id];
        if (get().courses[id] || get().coins < c.price) return false;
        track(`course/buy/${id}`);
        set((s) => ({ coins: s.coins - c.price, courses: { ...s.courses, [id]: 'bought' } }));
        get().toast(`−${c.price.toLocaleString('pt-BR')} moedas · ${c.name}`, 'coins');
        return true;
      },
      passCourse: (id) => {
        if (get().courses[id] !== 'bought') return;
        track(`course/pass/${id}`);
        set((s) => ({ courses: { ...s.courses, [id]: 'done' } }));
        get().toast(`Habilidade nova: ${COURSE_BY_ID[id].name}!`, 'good');
        const concept = COURSE_BY_ID[id].concept;
        if (concept) get().discover(concept);
      },
      ragFlag: (flag, value = true) => set((s) => ({ rag: { ...s.rag, flags: { ...s.rag.flags, [flag]: value } } })),
      ragChoose: (id, option) => set((s) => ({ rag: { ...s.rag, choices: { ...s.rag.choices, [id]: option } } })),
      completeRag: (step) => {
        const { rag } = get();
        if (rag.step !== step) return;
        const next = RAG_STEPS[ragIndex(step) + 1];
        if (!next) return;
        set((s) => ({ rag: { ...s.rag, step: next.id }, day: s.day + 1 }));
        track(next.id === 'done' ? 'mission/rag-complete' : `rag/${step}`);
        get().gainXp(RAG_STEPS[ragIndex(step)].xp, 'step');
      },
    }),
    {
      name: 'model-town-save-v1',
      version: 1,
      partialize: (s) => ({
        started: s.started, lang: s.lang, theme: s.theme, xp: s.xp, coins: s.coins, day: s.day, concepts: s.concepts,
        mission: s.mission, activeMission: s.activeMission, rag: s.rag, courses: s.courses, techSeen: s.techSeen, bridgesRepaired: s.bridgesRepaired, feedbackPrompted: s.feedbackPrompted,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<GameState>;
        return { ...current, ...p, rag: { ...freshRag(), ...p.rag }, started: false };
      },
    },
  ),
);

/** One line about where a saved game stands, for the title screen. */
export function progressSummary(s: Pick<GameState, 'activeMission' | 'mission' | 'rag' | 'courses'>, t: { mission: { steps: Record<string, string> } }): string {
  if (s.activeMission !== 'rag') return s.mission.step === 'done' ? 'Missão 1 concluída' : `Missão 1 · ${t.mission.steps[s.mission.step]}`;
  if (s.rag.step !== 'done') return `Missão 2 · ${RAG_STEPS[ragIndex(s.rag.step)].objective}`;
  if (!s.rag.flags.done_done) return 'Missão 2 concluída · veja o painel no Monitoring Center';
  const courses = Object.values(s.courses).filter((c) => c === 'done').length;
  return `Missões 1 e 2 concluídas · ${courses}/9 cursos no Centro Técnico`;
}

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

/** Is this Centro Técnico skill active (course bought AND lesson passed)? */
export const hasSkill = (id: CourseId) => useGame.getState().courses[id] === 'done';
export const useSkill = (id: CourseId) => useGame((s) => s.courses[id] === 'done');
