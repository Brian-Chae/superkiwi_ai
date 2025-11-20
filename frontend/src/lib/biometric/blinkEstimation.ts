/**
 * Eye Aspect Ratio (EAR) 계산
 * 눈의 세로 비율을 계산하여 깜빡임 감지
 */

interface Point {
  x: number;
  y: number;
}

/**
 * 두 점 사이의 유클리드 거리 계산
 */
function euclideanDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * EAR (Eye Aspect Ratio) 계산
 * 눈의 세로 비율을 계산하여 눈이 감겼는지 판단
 */
export function calculateEAR(eyeLandmarks: Point[]): number {
  if (eyeLandmarks.length < 6) return 1.0;

  // 눈의 수직 거리들
  const vertical1 = euclideanDistance(eyeLandmarks[1], eyeLandmarks[5]);
  const vertical2 = euclideanDistance(eyeLandmarks[2], eyeLandmarks[4]);
  
  // 눈의 수평 거리
  const horizontal = euclideanDistance(eyeLandmarks[0], eyeLandmarks[3]);

  // EAR = (수직1 + 수직2) / (2 * 수평)
  const ear = (vertical1 + vertical2) / (2.0 * horizontal);
  return ear;
}

/**
 * 깜빡임 감지 (EAR 임계값: 0.21)
 */
export function detectBlink(ear: number, threshold: number = 0.21): boolean {
  return ear < threshold;
}

/**
 * 분당 깜빡임 횟수 계산
 */
export class BlinkRateCalculator {
  private blinkHistory: number[] = [];
  private readonly windowSize = 60; // 60초 윈도우

  addBlink(timestamp: number) {
    this.blinkHistory.push(timestamp);
    // 60초 이전 데이터 제거
    const cutoff = timestamp - this.windowSize * 1000;
    this.blinkHistory = this.blinkHistory.filter((t) => t > cutoff);
  }

  getBlinkRate(): number {
    if (this.blinkHistory.length < 2) return 0;
    const timeSpan = (this.blinkHistory[this.blinkHistory.length - 1] - this.blinkHistory[0]) / 1000; // 초
    if (timeSpan === 0) return 0;
    return (this.blinkHistory.length / timeSpan) * 60; // 분당 깜빡임
  }

  reset() {
    this.blinkHistory = [];
  }
}

