import { create } from 'zustand';
import { activityMonitor, ActivityData } from '../lib/agent/activityMonitor';

interface ActivityState {
  activityData: ActivityData | null;
  updateActivity: (data: ActivityData) => void;
  startMonitoring: () => () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activityData: null,

  updateActivity: (data: ActivityData) => {
    set({ activityData: data });
  },

  startMonitoring: () => {
    // 초기 데이터 설정
    set({ activityData: activityMonitor.getActivityData() });

    // 리스너 등록
    const unsubscribe = activityMonitor.onActivityChange((data) => {
      set({ activityData: data });
    });

    // 주기적 모니터링 시작
    const stopMonitoring = activityMonitor.startMonitoring(1000);

    // 정리 함수
    return () => {
      unsubscribe();
      stopMonitoring();
    };
  },
}));

