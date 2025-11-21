/**
 * 생체 인식 관련 타입 정의
 */

/**
 * 얼굴 랜드마크 포인트
 */
export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

/**
 * BlendShape 카테고리
 */
export interface BlendShape {
  categoryName: string;
  displayName?: string;
  score: number;
}

/**
 * BlendShapes 데이터 구조
 */
export interface BlendShapes {
  categories: BlendShape[];
}

/**
 * 얼굴 감지 결과
 */
export interface FaceDetectionResult {
  detected: boolean;
  landmarks: Landmark[] | null;
  blendshapes?: BlendShapes | null;
  confidence?: number;
}

/**
 * 머리 자세 (Head Pose)
 */
export interface HeadPose {
  pitch: number;
  yaw: number;
  roll: number;
}

/**
 * HRV 메트릭
 */
export interface HRVMetrics {
  sdnn: number;
  rmssd: number;
  pnn50: number;
  stress?: number;
}

/**
 * 시계열 데이터
 */
export interface TimeSeriesData {
  timestamps: number[];
  earValues: number[];
  smileLevels: number[];
  headYaw: number[];
  mouthOpen: number[];
  eyebrowHeight: number[];
  headRoll: number[];
  headPitch: number[];
}

/**
 * 향상된 생체 인식 데이터
 */
export interface EnhancedBiometricData {
  faceDetected: boolean;
  gazeStability: number;
  blinkRate: number;
  focusScore: number;
  timestamp: number;
  headPose?: HeadPose;
  heartRate?: number | null;
  hrv?: HRVMetrics | null;
  fps?: number;
  confidence?: number;
  ear?: number;
  landmarks?: Landmark[] | null;
  faceDistance?: number;
  mouthOpenRatio?: number;
  eyebrowHeight?: number;
  smileLevel?: number;
  faceVisibility?: number;
  facingDirection?: string;
  blinkDetected?: boolean;
  blendshapes?: BlendShapes | null;
}

