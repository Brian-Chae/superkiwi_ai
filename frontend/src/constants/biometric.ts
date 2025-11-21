/**
 * 생체 인식 관련 상수 정의
 */

/**
 * 최대 데이터 포인트 수 (10초)
 */
export const MAX_DATA_POINTS = 50;

/**
 * 이동 평균 윈도우 크기
 */
export const SMOOTHING_WINDOW = 5;

/**
 * 눈 깜빡임 감지 임계값
 */
export const BLINK_THRESHOLD = 0.5;

/**
 * 심박수 업데이트 간격 (ms)
 */
export const HEART_RATE_UPDATE_INTERVAL = 1000;

/**
 * HRV 업데이트 간격 (ms)
 */
export const HRV_UPDATE_INTERVAL = 1000;

/**
 * 시계열 데이터 업데이트 간격 (ms)
 */
export const TIME_SERIES_UPDATE_INTERVAL = 1000;

/**
 * BlendShape 한글 번역 맵
 */
export const BLEND_SHAPE_KOREAN_MAP: { [key: string]: string } = {
  'eyeBlinkLeft': '왼눈 깜빡임',
  'eyeBlinkRight': '오른눈 깜빡임',
  'eyeLookDownLeft': '왼눈 아래',
  'eyeLookDownRight': '오른눈 아래',
  'eyeLookInLeft': '왼눈 안쪽',
  'eyeLookInRight': '오른눈 안쪽',
  'eyeLookOutLeft': '왼눈 바깥쪽',
  'eyeLookOutRight': '오른눈 바깥쪽',
  'eyeLookUpLeft': '왼눈 위',
  'eyeLookUpRight': '오른눈 위',
  'eyeSquintLeft': '왼눈 찡그림',
  'eyeSquintRight': '오른눈 찡그림',
  'eyeWideLeft': '왼눈 크게',
  'eyeWideRight': '오른눈 크게',
  'browDownLeft': '왼눈썹 내림',
  'browDownRight': '오른눈썹 내림',
  'browInnerUp': '눈썹 안쪽 올림',
  'browOuterUpLeft': '왼눈썹 바깥 올림',
  'browOuterUpRight': '오른눈썹 바깥 올림',
  'cheekPuff': '볼 부풀림',
  'cheekSquintLeft': '왼쪽 볼 찡그림',
  'cheekSquintRight': '오른쪽 볼 찡그림',
  'jawForward': '턱 앞으로',
  'jawLeft': '턱 왼쪽',
  'jawRight': '턱 오른쪽',
  'jawOpen': '입 벌림',
  'mouthClose': '입 다물기',
  'mouthFunnel': '입 오므림',
  'mouthPucker': '입술 내밈',
  'mouthLeft': '입 왼쪽',
  'mouthRight': '입 오른쪽',
  'mouthSmileLeft': '왼쪽 미소',
  'mouthSmileRight': '오른쪽 미소',
  'mouthFrownLeft': '왼쪽 입꼬리 내림',
  'mouthFrownRight': '오른쪽 입꼬리 내림',
  'mouthDimpleLeft': '왼쪽 보조개',
  'mouthDimpleRight': '오른쪽 보조개',
  'mouthStretchLeft': '왼쪽 입 늘림',
  'mouthStretchRight': '오른쪽 입 늘림',
  'mouthRollLower': '아랫입술 말기',
  'mouthRollUpper': '윗입술 말기',
  'mouthShrugLower': '아랫입술 올림',
  'mouthShrugUpper': '윗입술 올림',
  'mouthPressLeft': '왼쪽 입술 누름',
  'mouthPressRight': '오른쪽 입술 누름',
  'mouthLowerDownLeft': '왼쪽 아랫입술 내림',
  'mouthLowerDownRight': '오른쪽 아랫입술 내림',
  'mouthUpperUpLeft': '왼쪽 윗입술 올림',
  'mouthUpperUpRight': '오른쪽 윗입술 올림',
  'noseSneerLeft': '왼쪽 코 찡그림',
  'noseSneerRight': '오른쪽 코 찡그림',
  'tongueOut': '혀 내밈'
};

/**
 * 모든 BlendShape 항목 정의 (고정 순서)
 */
export const ALL_BLEND_SHAPES = [
  // 눈 관련
  { key: 'eyeBlinkLeft', name: '왼눈 깜빡임' },
  { key: 'eyeBlinkRight', name: '오른눈 깜빡임' },
  { key: 'eyeLookDownLeft', name: '왼눈 아래' },
  { key: 'eyeLookDownRight', name: '오른눈 아래' },
  { key: 'eyeLookInLeft', name: '왼눈 안쪽' },
  { key: 'eyeLookInRight', name: '오른눈 안쪽' },
  { key: 'eyeLookOutLeft', name: '왼눈 바깥쪽' },
  { key: 'eyeLookOutRight', name: '오른눈 바깥쪽' },
  { key: 'eyeLookUpLeft', name: '왼눈 위' },
  { key: 'eyeLookUpRight', name: '오른눈 위' },
  { key: 'eyeSquintLeft', name: '왼눈 찡그림' },
  { key: 'eyeSquintRight', name: '오른눈 찡그림' },
  { key: 'eyeWideLeft', name: '왼눈 크게' },
  { key: 'eyeWideRight', name: '오른눈 크게' },
  // 눈썹 관련
  { key: 'browDownLeft', name: '왼눈썹 내림' },
  { key: 'browDownRight', name: '오른눈썹 내림' },
  { key: 'browInnerUp', name: '눈썹 안쪽 올림' },
  { key: 'browOuterUpLeft', name: '왼눈썹 바깥 올림' },
  { key: 'browOuterUpRight', name: '오른눈썹 바깥 올림' },
  // 볼 관련
  { key: 'cheekPuff', name: '볼 부풀림' },
  { key: 'cheekSquintLeft', name: '왼쪽 볼 찡그림' },
  { key: 'cheekSquintRight', name: '오른쪽 볼 찡그림' },
  // 턱 관련
  { key: 'jawForward', name: '턱 앞으로' },
  { key: 'jawLeft', name: '턱 왼쪽' },
  { key: 'jawRight', name: '턱 오른쪽' },
  { key: 'jawOpen', name: '입 벌림' },
  // 입 관련
  { key: 'mouthClose', name: '입 다물기' },
  { key: 'mouthFunnel', name: '입 오므림' },
  { key: 'mouthPucker', name: '입술 내밈' },
  { key: 'mouthLeft', name: '입 왼쪽' },
  { key: 'mouthRight', name: '입 오른쪽' },
  { key: 'mouthSmileLeft', name: '왼쪽 미소' },
  { key: 'mouthSmileRight', name: '오른쪽 미소' },
  { key: 'mouthFrownLeft', name: '왼쪽 입꼬리 내림' },
  { key: 'mouthFrownRight', name: '오른쪽 입꼬리 내림' },
  { key: 'mouthDimpleLeft', name: '왼쪽 보조개' },
  { key: 'mouthDimpleRight', name: '오른쪽 보조개' },
  { key: 'mouthStretchLeft', name: '왼쪽 입 늘림' },
  { key: 'mouthStretchRight', name: '오른쪽 입 늘림' },
  { key: 'mouthRollLower', name: '아랫입술 말기' },
  { key: 'mouthRollUpper', name: '윗입술 말기' },
  { key: 'mouthShrugLower', name: '아랫입술 올림' },
  { key: 'mouthShrugUpper', name: '윗입술 올림' },
  { key: 'mouthPressLeft', name: '왼쪽 입술 누름' },
  { key: 'mouthPressRight', name: '오른쪽 입술 누름' },
  { key: 'mouthLowerDownLeft', name: '왼쪽 아랫입술 내림' },
  { key: 'mouthLowerDownRight', name: '오른쪽 아랫입술 내림' },
  { key: 'mouthUpperUpLeft', name: '왼쪽 윗입술 올림' },
  { key: 'mouthUpperUpRight', name: '오른쪽 윗입술 올림' },
  // 코 관련
  { key: 'noseSneerLeft', name: '왼쪽 코 찡그림' },
  { key: 'noseSneerRight', name: '오른쪽 코 찡그림' },
  // 혀 관련
  { key: 'tongueOut', name: '혀 내밈' }
] as const;

