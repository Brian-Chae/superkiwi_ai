/**
 * 브라우저 레벨 활동 모니터링
 * Page Visibility API를 사용하여 탭 전환 감지
 */

export interface ActivityData {
  isVisible: boolean;
  lastActiveTime: number;
  idleTime: number; // seconds
}

class ActivityMonitor {
  private isVisible: boolean = true;
  private lastActiveTime: number = Date.now();
  private visibilityListeners: Array<(visible: boolean) => void> = [];
  private activityListeners: Array<(data: ActivityData) => void> = [];

  constructor() {
    this.setupVisibilityListener();
    this.setupActivityListeners();
  }

  private setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      this.lastActiveTime = Date.now();
      this.visibilityListeners.forEach((listener) => listener(this.isVisible));
      this.notifyActivityListeners();
    });
  }

  private setupActivityListeners() {
    // 마우스 활동 감지
    const handleActivity = () => {
      if (this.isVisible) {
        this.lastActiveTime = Date.now();
        this.notifyActivityListeners();
      }
    };

    document.addEventListener('mousemove', handleActivity, { passive: true });
    document.addEventListener('mousedown', handleActivity, { passive: true });
    document.addEventListener('keydown', handleActivity, { passive: true });
    document.addEventListener('scroll', handleActivity, { passive: true });
  }

  private notifyActivityListeners() {
    const data: ActivityData = {
      isVisible: this.isVisible,
      lastActiveTime: this.lastActiveTime,
      idleTime: this.getIdleTime(),
    };
    this.activityListeners.forEach((listener) => listener(data));
  }

  /**
   * Idle time 계산 (초 단위)
   */
  getIdleTime(): number {
    if (!this.isVisible) {
      return (Date.now() - this.lastActiveTime) / 1000;
    }
    return 0;
  }

  /**
   * 현재 활동 상태 가져오기
   */
  getActivityData(): ActivityData {
    return {
      isVisible: this.isVisible,
      lastActiveTime: this.lastActiveTime,
      idleTime: this.getIdleTime(),
    };
  }

  /**
   * 가시성 변경 리스너 등록
   */
  onVisibilityChange(listener: (visible: boolean) => void) {
    this.visibilityListeners.push(listener);
    return () => {
      this.visibilityListeners = this.visibilityListeners.filter((l) => l !== listener);
    };
  }

  /**
   * 활동 변경 리스너 등록
   */
  onActivityChange(listener: (data: ActivityData) => void) {
    this.activityListeners.push(listener);
    return () => {
      this.activityListeners = this.activityListeners.filter((l) => l !== listener);
    };
  }

  /**
   * 주기적으로 활동 상태 확인 (1초마다)
   */
  startMonitoring(interval: number = 1000) {
    const checkInterval = setInterval(() => {
      this.notifyActivityListeners();
    }, interval);

    return () => clearInterval(checkInterval);
  }
}

// 싱글톤 인스턴스
export const activityMonitor = new ActivityMonitor();

