/**
 * 규칙 기반 AI 추천 엔진
 */

import type { FocusData } from '../../state/useFocusStore';
import type { ActivityData } from '../agent/activityMonitor';
import type { TimerSession } from '../../state/useTimerStore';

export type RecommendationType =
  | 'break-suggestion'
  | 'extend-deepwork'
  | 'return-to-task'
  | 'meeting-prep';

export interface Recommendation {
  type: RecommendationType;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * 추천 엔진 클래스
 */
export class RecommendationEngine {
  private focusHistory: FocusData[] = [];
  private readonly windowSize = 5 * 60 * 1000; // 5분 (밀리초)

  /**
   * Focus 데이터 추가
   */
  addFocusData(data: FocusData) {
    this.focusHistory.push(data);
    // 5분 이전 데이터 제거
    const cutoff = data.timestamp - this.windowSize;
    this.focusHistory = this.focusHistory.filter((item) => item.timestamp > cutoff);
  }

  /**
   * 추천 생성
   */
  generateRecommendations(
    currentFocus: FocusData | null,
    activityData: ActivityData | null,
    currentSession: TimerSession | null
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Rule 1: Focus < 0.3 for 5 min → 휴식 제안
    if (this.shouldSuggestBreak(currentFocus)) {
      recommendations.push({
        type: 'break-suggestion',
        message: '집중도가 낮습니다. 잠시 휴식을 취하는 것을 권장합니다.',
        priority: 'high',
      });
    }

    // Rule 2: Session > 25 min && Focus > 0.7 → Deep Work 연장 제안
    if (this.shouldExtendDeepWork(currentSession, currentFocus)) {
      recommendations.push({
        type: 'extend-deepwork',
        message: '집중도가 높고 세션이 25분 이상 지속되었습니다. Deep Work를 연장하시겠습니까?',
        priority: 'medium',
      });
    }

    // Rule 3: IdleTime > 10 min → 작업 복귀 제안
    if (this.shouldReturnToTask(activityData)) {
      recommendations.push({
        type: 'return-to-task',
        message: '10분 이상 활동이 없었습니다. 작업으로 돌아오시겠습니까?',
        priority: 'medium',
      });
    }

    // Rule 4: Meeting in 20 min → 준비 블록 할당 제안
    // (이 규칙은 Time Canvas의 미래 블록을 확인해야 하므로 나중에 구현)

    return recommendations;
  }

  /**
   * Rule 1: Focus < 0.3 for 5 min
   */
  private shouldSuggestBreak(currentFocus: FocusData | null): boolean {
    if (!currentFocus) return false;

    // 최근 5분간의 평균 Focus Score 계산
    const recentFocus = this.focusHistory.filter(
      (item) => item.timestamp > currentFocus.timestamp - this.windowSize
    );

    if (recentFocus.length < 10) return false; // 최소 10개 데이터 필요

    const avgFocus =
      recentFocus.reduce((sum, item) => sum + item.focusScore, 0) / recentFocus.length;

    return avgFocus < 0.3;
  }

  /**
   * Rule 2: Session > 25 min && Focus > 0.7
   */
  private shouldExtendDeepWork(
    session: TimerSession | null,
    currentFocus: FocusData | null
  ): boolean {
    if (!session || !currentFocus) return false;

    const sessionMinutes = session.duration / 60;
    return sessionMinutes > 25 && currentFocus.focusScore > 0.7;
  }

  /**
   * Rule 3: IdleTime > 10 min
   */
  private shouldReturnToTask(activityData: ActivityData | null): boolean {
    if (!activityData) return false;
    return activityData.idleTime > 10 * 60; // 10분 = 600초
  }

  reset() {
    this.focusHistory = [];
  }
}

// 싱글톤 인스턴스
export const recommendationEngine = new RecommendationEngine();

