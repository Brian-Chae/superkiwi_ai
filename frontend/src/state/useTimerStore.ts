import { create } from 'zustand';

export interface TimerSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number; // seconds
  avgFocusScore: number;
  maxFocusScore: number;
  minFocusScore: number;
  focusHistory: number[];
}

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  elapsedTime: number; // seconds
  session: TimerSession | null;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => TimerSession | null;
  updateElapsedTime: (seconds: number) => void;
  addFocusScore: (score: number) => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  elapsedTime: 0,
  session: null,

  startTimer: () => {
    const session: TimerSession = {
      id: crypto.randomUUID(),
      startTime: Date.now(),
      duration: 0,
      avgFocusScore: 0,
      maxFocusScore: 0,
      minFocusScore: 1,
      focusHistory: [],
    };

    set({
      isRunning: true,
      isPaused: false,
      elapsedTime: 0,
      session,
    });
  },

  pauseTimer: () => {
    set({ isPaused: true, isRunning: false });
  },

  resumeTimer: () => {
    set({ isPaused: false, isRunning: true });
  },

  stopTimer: () => {
    const state = get();
    if (!state.session) return null;

    const session: TimerSession = {
      ...state.session,
      endTime: Date.now(),
      duration: state.elapsedTime,
      avgFocusScore:
        state.session.focusHistory.length > 0
          ? state.session.focusHistory.reduce((sum, score) => sum + score, 0) /
            state.session.focusHistory.length
          : 0,
      maxFocusScore: Math.max(...state.session.focusHistory, 0),
      minFocusScore:
        state.session.focusHistory.length > 0
          ? Math.min(...state.session.focusHistory)
          : 1,
    };

    set({
      isRunning: false,
      isPaused: false,
      elapsedTime: 0,
      session: null,
    });

    return session;
  },

  updateElapsedTime: (seconds: number) => {
    set({ elapsedTime: seconds });
    const state = get();
    if (state.session) {
      set({
        session: {
          ...state.session,
          duration: seconds,
        },
      });
    }
  },

  addFocusScore: (score: number) => {
    const state = get();
    if (state.session) {
      set({
        session: {
          ...state.session,
          focusHistory: [...state.session.focusHistory, score],
        },
      });
    }
  },

  reset: () => {
    set({
      isRunning: false,
      isPaused: false,
      elapsedTime: 0,
      session: null,
    });
  },
}));

