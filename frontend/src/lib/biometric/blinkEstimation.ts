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
 * 레포지토리 방식: 위쪽/아래쪽 눈꺼풀의 여러 포인트를 사용한 더 정확한 계산
 */
export function calculateEAR(eyeLandmarks: Point[]): number {
  if (eyeLandmarks.length < 6) return 1.0;

  // 기존 방식 (6개 포인트 사용)
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
 * 개선된 EAR 계산 (랜드마크 배열에서 직접 계산)
 * 레포지토리 방식: 위쪽/아래쪽 눈꺼풀의 여러 포인트를 사용
 */
export function calculateEARFromLandmarks(landmarks: any[], eyeIndices: {
  upper: number[];
  lower: number[];
  left: number;
  right: number;
}): number {
  if (!landmarks || landmarks.length === 0) return 0;

  // 랜드마크 유효성 검사
  if (!landmarks[eyeIndices.upper[0]] || !landmarks[eyeIndices.lower[0]]) {
    return 0;
  }

  // 수직 거리 계산 (위쪽과 아래쪽 눈꺼풀 사이)
  // 레포지토리 방식: 모든 쌍의 거리를 합산
  let verticalDistances = 0;
  const pairs = Math.min(eyeIndices.upper.length, eyeIndices.lower.length);

  for (let i = 0; i < pairs; i++) {
    const upper = landmarks[eyeIndices.upper[i]];
    const lower = landmarks[eyeIndices.lower[i]];
    if (upper && lower && upper.x !== undefined && upper.y !== undefined && lower.x !== undefined && lower.y !== undefined) {
      const distance = Math.sqrt(
        Math.pow(upper.x - lower.x, 2) +
        Math.pow(upper.y - lower.y, 2)
      );
      verticalDistances += distance;
    } else {
      // 랜드마크가 없으면 0 반환
      return 0;
    }
  }

  // 수평 거리 계산 (눈의 가로 길이)
  const leftPoint = landmarks[eyeIndices.left];
  const rightPoint = landmarks[eyeIndices.right];
  let horizontalDistance = 0;

  if (leftPoint && rightPoint && leftPoint.x !== undefined && leftPoint.y !== undefined && rightPoint.x !== undefined && rightPoint.y !== undefined) {
    horizontalDistance = Math.sqrt(
      Math.pow(rightPoint.x - leftPoint.x, 2) +
      Math.pow(rightPoint.y - leftPoint.y, 2)
    );
  } else {
    return 0;
  }

  // EAR 계산: (수직 거리의 평균) / (수평 거리)
  // 레포지토리 방식: (verticalDistances / pairs) / horizontalDistance
  if (horizontalDistance === 0 || pairs === 0) return 0;

  const ear = (verticalDistances / pairs) / horizontalDistance;
  
  // EAR 값이 비정상적으로 높으면 0 반환 (디버깅)
  if (ear > 2.0) {
    console.warn(`⚠️ Abnormal EAR value: ${ear.toFixed(3)}. Check landmark indices.`, {
      eyeIndices,
      verticalDistances,
      horizontalDistance,
      pairs,
      upper0: landmarks[eyeIndices.upper[0]],
      lower0: landmarks[eyeIndices.lower[0]],
      left: landmarks[eyeIndices.left],
      right: landmarks[eyeIndices.right],
    });
    return 0;
  }

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
    // 최소 1번의 깜빡임만 있어도 계산 가능하도록 수정
    if (this.blinkHistory.length === 0) return 0;
    if (this.blinkHistory.length === 1) {
      // 깜빡임이 1번만 있으면 최근 10초 기준으로 추정
      const timeSinceFirstBlink = (Date.now() - this.blinkHistory[0]) / 1000; // 초
      if (timeSinceFirstBlink < 1) return 0; // 1초 미만이면 아직 계산 불가
      return (1 / timeSinceFirstBlink) * 60; // 분당 깜빡임 추정
    }
    const timeSpan = (this.blinkHistory[this.blinkHistory.length - 1] - this.blinkHistory[0]) / 1000; // 초
    if (timeSpan === 0) return 0;
    return (this.blinkHistory.length / timeSpan) * 60; // 분당 깜빡임
  }

  getBlinkCount(): number {
    return this.blinkHistory.length;
  }

  reset() {
    this.blinkHistory = [];
  }
}

