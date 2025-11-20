/**
 * Focus Score 계산
 * Face Detection (0.4) + Gaze Stability (0.4) + Blink Stability (0.2)
 */

/**
 * 깜빡임 안정성 점수 계산 (0-1)
 * 정상적인 깜빡임 속도: 15-20 blinks/min
 */
export function calculateBlinkStability(blinkRate: number): number {
  const optimalRate = 17.5; // 평균 깜빡임 속도
  const tolerance = 5; // 허용 오차

  if (blinkRate === 0) return 0; // 깜빡임이 없으면 0

  const deviation = Math.abs(blinkRate - optimalRate);
  if (deviation <= tolerance) {
    return 1.0; // 최적 범위 내
  }

  // 편차가 클수록 낮은 점수
  const normalizedDeviation = Math.min(deviation / (optimalRate * 2), 1.0);
  return Math.max(0, 1 - normalizedDeviation);
}

/**
 * Focus Score 계산
 * @param faceDetected 얼굴 감지 여부 (0 또는 1)
 * @param gazeStability 시선 안정성 (0-1)
 * @param blinkStability 깜빡임 안정성 (0-1)
 * @returns Focus Score (0-1)
 */
export function computeFocusScore(
  faceDetected: number,
  gazeStability: number,
  blinkStability: number
): number {
  const faceWeight = 0.4;
  const gazeWeight = 0.4;
  const blinkWeight = 0.2;

  const score =
    faceDetected * faceWeight +
    gazeStability * gazeWeight +
    blinkStability * blinkWeight;

  return Math.max(0, Math.min(1, score)); // 0-1 범위로 클램핑
}

/**
 * 1분 단위 Focus Score 평균 계산
 */
export class FocusScoreCalculator {
  private scores: Array<{ score: number; timestamp: number }> = [];
  private readonly windowSize = 60 * 1000; // 60초 (밀리초)

  addScore(score: number, timestamp: number) {
    this.scores.push({ score, timestamp });
    
    // 60초 이전 데이터 제거
    const cutoff = timestamp - this.windowSize;
    this.scores = this.scores.filter((item) => item.timestamp > cutoff);
  }

  getAverageScore(): number {
    if (this.scores.length === 0) return 0;
    const sum = this.scores.reduce((acc, item) => acc + item.score, 0);
    return sum / this.scores.length;
  }

  getLatestScore(): number {
    if (this.scores.length === 0) return 0;
    return this.scores[this.scores.length - 1].score;
  }

  reset() {
    this.scores = [];
  }
}

