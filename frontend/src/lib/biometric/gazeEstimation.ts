/**
 * 시선 추정 (Gaze Estimation)
 * 눈 중심점과 화면 중앙의 벡터를 계산하여 시선 안정성 측정
 */

interface Point {
  x: number;
  y: number;
  z?: number;
}

/**
 * 눈 중심점 계산
 */
export function calculateEyeCenter(eyeLandmarks: Point[]): Point {
  if (eyeLandmarks.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const sum = eyeLandmarks.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
      z: (acc.z || 0) + (point.z || 0),
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: sum.x / eyeLandmarks.length,
    y: sum.y / eyeLandmarks.length,
    z: sum.z ? sum.z / eyeLandmarks.length : 0,
  };
}

/**
 * 두 눈의 중심점 계산
 */
export function calculateGazeCenter(leftEye: Point[], rightEye: Point[]): Point {
  const leftCenter = calculateEyeCenter(leftEye);
  const rightCenter = calculateEyeCenter(rightEye);

  return {
    x: (leftCenter.x + rightCenter.x) / 2,
    y: (leftCenter.y + rightCenter.y) / 2,
    z: ((leftCenter.z || 0) + (rightCenter.z || 0)) / 2,
  };
}

/**
 * 시선 벡터 계산 (화면 중앙 기준)
 * 화면 중앙: (0.5, 0.5)
 */
export function calculateGazeVector(gazeCenter: Point): { x: number; y: number; distance: number } {
  const screenCenter = { x: 0.5, y: 0.5 };
  const dx = gazeCenter.x - screenCenter.x;
  const dy = gazeCenter.y - screenCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return { x: dx, y: dy, distance };
}

/**
 * 시선 안정성 점수 계산 (0-1)
 * 화면 중앙에 가까울수록 높은 점수
 */
export function calculateGazeStability(gazeVector: { distance: number }): number {
  // 최대 거리: 대각선 길이 (약 0.707)
  const maxDistance = Math.sqrt(0.5 * 0.5 + 0.5 * 0.5);
  
  // 거리가 가까울수록 높은 점수 (1 - normalized_distance)
  const normalizedDistance = Math.min(gazeVector.distance / maxDistance, 1.0);
  return Math.max(0, 1 - normalizedDistance);
}

/**
 * 시선 안정성 히스토리 관리
 */
export class GazeStabilityCalculator {
  private stabilityHistory: number[] = [];
  private readonly windowSize = 60; // 60초 윈도우

  addStability(stability: number, timestamp: number) {
    this.stabilityHistory.push(stability);
    // 60초 이전 데이터 제거
    const cutoff = timestamp - this.windowSize * 1000;
    // 타임스탬프는 별도로 관리하지 않고 배열 길이로만 관리
    if (this.stabilityHistory.length > this.windowSize) {
      this.stabilityHistory.shift();
    }
  }

  getAverageStability(): number {
    if (this.stabilityHistory.length === 0) return 0;
    const sum = this.stabilityHistory.reduce((acc, val) => acc + val, 0);
    return sum / this.stabilityHistory.length;
  }

  reset() {
    this.stabilityHistory = [];
  }
}

