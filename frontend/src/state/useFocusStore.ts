import { create } from 'zustand';

export interface FocusData {
  faceDetected: boolean;
  gazeStability: number;
  blinkRate: number;
  focusScore: number;
  timestamp: number;
}

interface FocusState {
  currentFocus: FocusData | null;
  focusHistory: FocusData[];
  averageFocus: number; // 1분 평균
  updateFocus: (data: FocusData) => void;
  reset: () => void;
}

export const useFocusStore = create<FocusState>((set, get) => ({
  currentFocus: null,
  focusHistory: [],
  averageFocus: 0,

  updateFocus: (data: FocusData) => {
    const state = get();
    const history = [...state.focusHistory, data];
    
    // 1분 이전 데이터 제거
    const oneMinuteAgo = data.timestamp - 60 * 1000;
    const filteredHistory = history.filter((item) => item.timestamp > oneMinuteAgo);

    // 1분 평균 계산
    const average =
      filteredHistory.length > 0
        ? filteredHistory.reduce((sum, item) => sum + item.focusScore, 0) /
          filteredHistory.length
        : 0;

    set({
      currentFocus: data,
      focusHistory: filteredHistory,
      averageFocus: average,
    });
  },

  reset: () => {
    set({
      currentFocus: null,
      focusHistory: [],
      averageFocus: 0,
    });
  },
}));

