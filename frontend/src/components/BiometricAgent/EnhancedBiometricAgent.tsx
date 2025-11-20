import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraView, type CameraViewHandle } from './CameraView';
import { FaceLandmarkCanvas } from './FaceLandmarkCanvas';
import { detectFace, extractEyeLandmarks, getEyeIndices } from '../../lib/biometric/faceDetection';
import { calculateEAR, calculateEARFromLandmarks, BlinkRateCalculator } from '../../lib/biometric/blinkEstimation';
import {
  calculateGazeCenter,
  calculateGazeVector,
  calculateGazeStability,
  GazeStabilityCalculator,
} from '../../lib/biometric/gazeEstimation';
import {
  computeFocusScore,
  calculateBlinkStability,
  FocusScoreCalculator,
} from '../../lib/biometric/computeFocusScore';
import { calculateHeadPose } from '../../lib/biometric/headPose';
import { RPPGAnalyzer } from '../../lib/biometric/rppgAnalyzer';
import { HRVAnalyzer } from '../../lib/biometric/hrvAnalyzer';

export interface EnhancedBiometricData {
  faceDetected: boolean;
  gazeStability: number;
  blinkRate: number;
  focusScore: number;
  timestamp: number;
  headPose?: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  heartRate?: number | null;
  hrv?: {
    sdnn: number;
    rmssd: number;
    pnn50: number;
  } | null;
  fps?: number;
  confidence?: number;
  ear?: number;
  landmarks?: any[] | null;
  faceDistance?: number;
  mouthOpenRatio?: number;
  eyebrowHeight?: number;
  smileLevel?: number;
  faceVisibility?: number;
  facingDirection?: string;
  blinkDetected?: boolean;
  blendshapes?: any;
}

interface EnhancedBiometricAgentProps {
  onDataUpdate?: (data: EnhancedBiometricData) => void;
  enabled?: boolean;
  showVisualization?: boolean;
}

const MAX_DATA_POINTS = 50; // 최대 데이터 포인트 수 (10초)
const SMOOTHING_WINDOW = 5; // 이동 평균 윈도우 크기

export const EnhancedBiometricAgent: React.FC<EnhancedBiometricAgentProps> = ({
  onDataUpdate,
  enabled = true,
  showVisualization = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraViewRef = useRef<CameraViewHandle | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentData, setCurrentData] = useState<EnhancedBiometricData | null>(null);
  const [dataHistory, setDataHistory] = useState<EnhancedBiometricData[]>([]);
  const [currentLandmarks, setCurrentLandmarks] = useState<any[] | null>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showConnectors, setShowConnectors] = useState(true);

  // 시계열 데이터
  const [timeSeriesData, setTimeSeriesData] = useState<{
    timestamps: number[];
    earValues: number[];
    smileLevels: number[];
    headYaw: number[];
    mouthOpen: number[];
    eyebrowHeight: number[];
    headRoll: number[];
    headPitch: number[];
  }>({
    timestamps: [],
    earValues: [],
    smileLevels: [],
    headYaw: [],
    mouthOpen: [],
    eyebrowHeight: [],
    headRoll: [],
    headPitch: [],
  });

  // 심박수 및 HRV 히스토리
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([]);
  const [hrvStressHistory, setHrvStressHistory] = useState<number[]>([]);
  const [earValue, setEarValue] = useState<number>(0);

  const blinkRateCalculator = useRef(new BlinkRateCalculator());
  const gazeStabilityCalculator = useRef(new GazeStabilityCalculator());
  const focusScoreCalculator = useRef(new FocusScoreCalculator());
  const rppgAnalyzer = useRef(new RPPGAnalyzer());
  const hrvAnalyzer = useRef(new HRVAnalyzer());

  const lastBlinkTime = useRef<number>(0);
  const lastEAR = useRef<number>(1.0);
  const baselineEAR = useRef<number>(0);
  const earHistory = useRef<number[]>([]);
  const isBlinking = useRef<boolean>(false);

  // FPS 계산
  const fpsRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const fpsCounterRef = useRef<{ times: number[], lastTime: number }>({ times: [], lastTime: 0 });

  // 심박수 관련
  const lastHeartRateTime = useRef<number>(0);
  const lastHeartRate = useRef<number | null>(null);
  const heartRateAccumulatorRef = useRef<number[]>([]);
  const [heartRate, setHeartRate] = useState<number>(0);
  const [heartRateConfidence, setHeartRateConfidence] = useState<number>(0);
  const [signalQuality, setSignalQuality] = useState<number>(0);
  const [isHeartRateReady, setIsHeartRateReady] = useState(false);
  
  // HRV 관련 (깜빡임 방지를 위해 별도 상태 관리)
  const [hrvMetrics, setHrvMetrics] = useState<{
    sdnn: number;
    rmssd: number;
    pnn50: number;
    stress?: number;
  } | null>(null);
  const lastHrvDataRef = useRef<{
    sdnn: number;
    rmssd: number;
    pnn50: number;
    stress?: number;
  } | null>(null);

  // 마지막 업데이트 시간 추적
  const lastHeartRateUpdateRef = useRef<number>(0);
  const lastHrvUpdateRef = useRef<number>(0);
  const lastTimeSeriesUpdateRef = useRef<number>(0);
  const lastStatsUpdateRef = useRef<number>(0);

  // 스무싱을 위한 값 히스토리
  const smoothingBufferRef = useRef<{
    headRotation: { pitch: number[], yaw: number[], roll: number[] };
    faceDistance: number[];
    mouthOpenRatio: number[];
    eyebrowHeight: number[];
    smileLevel: number[];
    earValue: number[];
  }>({
    headRotation: { pitch: [], yaw: [], roll: [] },
    faceDistance: [],
    mouthOpenRatio: [],
    eyebrowHeight: [],
    smileLevel: [],
    earValue: [],
  });

  // 이동 평균 계산 함수
  const getSmoothedValue = useCallback((values: number[], newValue: number, windowSize: number = SMOOTHING_WINDOW) => {
    values.push(newValue);
    if (values.length > windowSize) {
      values.shift();
    }
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : newValue;
  }, []);

  // FPS 계산 함수
  const calculateFPS = useCallback(() => {
    const now = performance.now();
    const counter = fpsCounterRef.current;

    while (counter.times.length > 0 && counter.times[0] <= now - 1000) {
      counter.times.shift();
    }
    counter.times.push(now);

    const fps = counter.times.length;
    counter.lastTime = now;

    return fps;
  }, []);

  // 얼굴 거리 계산
  const calculateFaceDistance = useCallback((landmarks: any[]): number => {
    if (!landmarks || landmarks.length === 0) return 0;
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    if (!leftEye || !rightEye) return 0;
    const distance = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) +
      Math.pow(rightEye.y - leftEye.y, 2)
    );
    // 정규화: 0.1 ~ 0.3 범위를 0 ~ 1로 매핑하되, 0.3을 더해 스케일 조정
    // (distance - 0.1 + 0.3) * 5 = (distance + 0.2) * 5
    return Math.min(Math.max((distance - 0.05) * 5, 0), 1);
  }, []);

  // 입 벌림 정도 계산
  const calculateMouthOpenRatio = useCallback((landmarks: any[]): number => {
    if (!landmarks || landmarks.length === 0) return 0;
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];
    const leftCorner = landmarks[61];
    const rightCorner = landmarks[291];
    if (!upperLip || !lowerLip || !leftCorner || !rightCorner) return 0;
    const verticalDistance = Math.abs(lowerLip.y - upperLip.y);
    const horizontalDistance = Math.abs(rightCorner.x - leftCorner.x);
    if (horizontalDistance === 0) return 0;
    return Math.min((verticalDistance / horizontalDistance) * 3, 1);
  }, []);

  // 눈썹 높이 계산
  const calculateEyebrowHeight = useCallback((landmarks: any[]): number => {
    if (!landmarks || landmarks.length === 0) return 0;
    const leftEyebrow = landmarks[70];
    const leftEye = landmarks[33];
    const rightEyebrow = landmarks[300];
    const rightEye = landmarks[263];
    if (!leftEyebrow || !leftEye || !rightEyebrow || !rightEye) return 0;
    const leftDistance = Math.abs(leftEyebrow.y - leftEye.y);
    const rightDistance = Math.abs(rightEyebrow.y - rightEye.y);
    const avgDistance = (leftDistance + rightDistance) / 2;
    return Math.min(avgDistance * 10, 1);
  }, []);

  // 미소 수준 계산 (레포지토리 방식 + BlendShape 활용)
  const calculateSmileLevel = useCallback((landmarks: any[], blendshapes?: any): number => {
    // BlendShape 데이터가 있으면 우선 사용 (더 정확함)
    if (blendshapes && blendshapes.categories) {
      const mouthSmileLeft = blendshapes.categories.find((s: any) => 
        (s.displayName || s.categoryName) === 'mouthSmileLeft'
      );
      const mouthSmileRight = blendshapes.categories.find((s: any) => 
        (s.displayName || s.categoryName) === 'mouthSmileRight'
      );
      
      if (mouthSmileLeft && mouthSmileRight) {
        // 양쪽 미소의 평균값 사용
        const avgSmile = (mouthSmileLeft.score + mouthSmileRight.score) / 2;
        return Math.min(Math.max(avgSmile, 0), 1);
      }
    }

    // BlendShape가 없으면 랜드마크 기반 계산 (레포지토리 방식)
    if (!landmarks || landmarks.length === 0) return 0;
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];
    const noseBottom = landmarks[19];
    if (!leftMouth || !rightMouth || !noseBottom) return 0;
    
    // 입꼬리가 코보다 얼마나 올라갔는지 계산
    const leftLift = noseBottom.y - leftMouth.y;
    const rightLift = noseBottom.y - rightMouth.y;
    const avgLift = (leftLift + rightLift) / 2;

    // 입 너비도 고려
    const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);

    // 미소 레벨 계산 (0-1)
    return Math.min(Math.max(avgLift * 5 + mouthWidth * 2, 0), 1);
  }, []);

  // 얼굴 방향 계산
  const calculateFacingDirection = useCallback((yaw: number): string => {
    if (yaw < -20) return '오른쪽';
    if (yaw > 20) return '왼쪽';
    if (yaw < -5) return '약간 오른쪽';
    if (yaw > 5) return '약간 왼쪽';
    return '정면';
  }, []);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
    setVideoDimensions({
      width: video.videoWidth || 640,
      height: video.videoHeight || 480,
    });
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!enabled || !isInitialized || !videoRef.current) return;

    const processFrame = async () => {
      if (!videoRef.current) return;

      const video = videoRef.current;
      
      if (
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const timestamp = performance.now();

      // FPS 계산
      const fps = calculateFPS();
      fpsRef.current = fps;

      try {
        const faceResult = await detectFace(video, timestamp);
        const faceDetected = faceResult.detected ? 1 : 0;
        let confidence = 0;

        if (faceResult.detected && faceResult.landmarks) {
          confidence = 0.95;
          setCurrentLandmarks(faceResult.landmarks);

          // BlendShape 기반 EAR 계산 (eyeBlinkLeft/Right 사용)
          let rawEARValue = 0.5; // 기본값
          
          if (faceResult.blendshapes && faceResult.blendshapes.categories) {
            const eyeBlinkLeft = faceResult.blendshapes.categories.find((s: any) => 
              (s.displayName || s.categoryName) === 'eyeBlinkLeft'
            );
            const eyeBlinkRight = faceResult.blendshapes.categories.find((s: any) => 
              (s.displayName || s.categoryName) === 'eyeBlinkRight'
            );
            
            if (eyeBlinkLeft && eyeBlinkRight) {
              // BlendShape 값: 0 (눈 뜸) ~ 1 (눈 감김)
              // EAR 값: 0.6 (눈 뜸) ~ 0.4 (눈 감김)
              // 변환 공식: EAR = 0.6 - (eyeBlink * 0.2)
              const leftBlinkScore = eyeBlinkLeft.score || 0;
              const rightBlinkScore = eyeBlinkRight.score || 0;
              const avgBlinkScore = (leftBlinkScore + rightBlinkScore) / 2;
              
              // EAR 계산: 0.6 (완전히 뜸) ~ 0.4 (완전히 감김)
              rawEARValue = 0.6 - (avgBlinkScore * 0.2);
              
              // 디버깅: BlendShape 기반 EAR 계산 로그
              if (import.meta.env.DEV && frameCount.current % 30 === 0) {
                console.log(`BlendShape EAR - Left: ${leftBlinkScore.toFixed(3)}, Right: ${rightBlinkScore.toFixed(3)}, Avg: ${avgBlinkScore.toFixed(3)}, EAR: ${rawEARValue.toFixed(3)}`);
              }
            } else {
              // BlendShape가 없으면 랜드마크 기반 계산 (폴백)
              const eyeIndices = getEyeIndices();
              if (faceResult.landmarks && faceResult.landmarks.length >= 468) {
                const leftEAR = calculateEARFromLandmarks(faceResult.landmarks, eyeIndices.leftEye);
                const rightEAR = calculateEARFromLandmarks(faceResult.landmarks, eyeIndices.rightEye);
                rawEARValue = (leftEAR + rightEAR) / 2;
              }
            }
          } else {
            // BlendShape가 없으면 랜드마크 기반 계산 (폴백)
            const eyeIndices = getEyeIndices();
            if (faceResult.landmarks && faceResult.landmarks.length >= 468) {
              const leftEAR = calculateEARFromLandmarks(faceResult.landmarks, eyeIndices.leftEye);
              const rightEAR = calculateEARFromLandmarks(faceResult.landmarks, eyeIndices.rightEye);
              rawEARValue = (leftEAR + rightEAR) / 2;
            }
          }

          // 스무싱 적용 (레포지토리 방식: 스무싱 후 깜빡임 판단)
          const buffer = smoothingBufferRef.current;
          const smoothedEARValue = getSmoothedValue(buffer.earValue, rawEARValue, 3);
          setEarValue(smoothedEARValue);

          // 레포지토리 방식: 스무싱된 값으로 깜빡임 판단 (고정 임계값 사용)
          const BLINK_THRESHOLD = 0.5;
          const blinkDetected = smoothedEARValue < BLINK_THRESHOLD;

          // 디버깅: EAR 값 모니터링 (개발 환경, 매 프레임)
          if (import.meta.env.DEV) {
            // 30프레임마다 로그 출력 (약 1초)
            if (frameCount.current % 30 === 0) {
              console.log(`EAR - Raw: ${rawEARValue.toFixed(3)}, Smoothed: ${smoothedEARValue.toFixed(3)}, Threshold: ${BLINK_THRESHOLD}, Blink: ${blinkDetected ? 'YES' : 'NO'}`);
            }
            frameCount.current++;
          }

          // 깜빡임 감지 및 카운트 (레포지토리 방식: 스무싱된 값 사용)
          if (blinkDetected && !isBlinking.current) {
            isBlinking.current = true;
            // 깜빡임 시작 로그 (개발 환경)
            if (import.meta.env.DEV) {
              console.log(`👁️ Blink started - EAR: ${smoothedEARValue.toFixed(3)}`);
            }
          }
          
          if (!blinkDetected && isBlinking.current) {
            // 깜빡임 완료
            isBlinking.current = false;
            const now = Date.now();
            if (now - lastBlinkTime.current > 200) {
              blinkRateCalculator.current.addBlink(now);
              lastBlinkTime.current = now;
              // 깜빡임 완료 로그 (개발 환경)
              if (import.meta.env.DEV) {
                console.log(`👁️ Blink completed! EAR: ${smoothedEARValue.toFixed(3)}, Count: ${blinkRateCalculator.current.getBlinkCount()}, Rate: ${blinkRateCalculator.current.getBlinkRate().toFixed(1)}/min`);
              }
            }
          }
          
          lastEAR.current = smoothedEARValue;

          // 시선 안정성 계산 (눈 랜드마크 추출)
          const { leftEye, rightEye } = extractEyeLandmarks(faceResult.landmarks);
          const gazeCenter = calculateGazeCenter(leftEye, rightEye);
          const gazeVector = calculateGazeVector(gazeCenter);
          const gazeStability = calculateGazeStability(gazeVector);
          gazeStabilityCalculator.current.addStability(gazeStability, timestamp);

          // 머리 자세 계산
          const headRotation = calculateHeadPose(faceResult.landmarks);
          const smoothedHeadRotation = {
            pitch: Math.round(getSmoothedValue(buffer.headRotation.pitch, headRotation.pitch, 7)),
            yaw: Math.round(getSmoothedValue(buffer.headRotation.yaw, headRotation.yaw, 7)),
            roll: Math.round(getSmoothedValue(buffer.headRotation.roll, headRotation.roll, 7)),
          };

          // 추가 데이터 계산
          const rawFaceDistance = calculateFaceDistance(faceResult.landmarks);
          const rawMouthOpenRatio = calculateMouthOpenRatio(faceResult.landmarks);
          const rawEyebrowHeight = calculateEyebrowHeight(faceResult.landmarks);
          // BlendShape 데이터를 활용한 미소 수준 계산
          const rawSmileLevel = calculateSmileLevel(faceResult.landmarks, faceResult.blendshapes);

          const smoothedFaceDistance = getSmoothedValue(buffer.faceDistance, rawFaceDistance);
          const smoothedMouthOpenRatio = getSmoothedValue(buffer.mouthOpenRatio, rawMouthOpenRatio, 3);
          const smoothedEyebrowHeight = getSmoothedValue(buffer.eyebrowHeight, rawEyebrowHeight);
          const smoothedSmileLevel = getSmoothedValue(buffer.smileLevel, rawSmileLevel, 8);

          const facingDirection = calculateFacingDirection(smoothedHeadRotation.yaw);

          // 얼굴 가시성
          const faceVisibility = faceResult.landmarks
            ? faceResult.landmarks.filter((l: any) => l.x >= 0 && l.x <= 1 && l.y >= 0 && l.y <= 1).length / faceResult.landmarks.length
            : 0;

          // rPPG 심박수 측정
          const rgbSignal = rppgAnalyzer.current.extractROISignal(video, faceResult.landmarks);
          if (rgbSignal) {
            rppgAnalyzer.current.addSignal(rgbSignal, timestamp);
            const heartRate = rppgAnalyzer.current.calculateHeartRate();
            if (heartRate !== null) {
              lastHeartRate.current = heartRate;
              lastHeartRateTime.current = timestamp;
              heartRateAccumulatorRef.current.push(heartRate);

              // RR 간격 계산
              const rrInterval = (60 / heartRate) * 1000;
              hrvAnalyzer.current.addRRInterval(rrInterval);
            }
          }

          // HRV 계산 (1초마다, 깜빡임 방지를 위해 이전 값 유지)
          const currentTime = Date.now();
          if (currentTime - lastHrvUpdateRef.current >= 1000 && lastHeartRate.current) {
            const hrvData = hrvAnalyzer.current.calculateHRV();
            if (hrvData) {
              // 스트레스 지수 계산 (레포지토리 방식)
              const stressIndex = Math.max(0, Math.min(100, 100 - (hrvData.sdnn + hrvData.rmssd) / 2));
              const hrvWithStress = {
                ...hrvData,
                stress: Math.round(stressIndex),
              };
              
              // HRV 상태 업데이트 (깜빡임 방지)
              lastHrvDataRef.current = hrvWithStress;
              setHrvMetrics(hrvWithStress);
              
              // 스트레스 히스토리 업데이트
              setHrvStressHistory(prev => {
                const newHistory = [...prev, stressIndex];
                if (newHistory.length > 30) {
                  newHistory.shift();
                }
                return newHistory;
              });
            }
            // HRV 데이터가 없어도 이전 값을 유지 (깜빡임 방지)
            lastHrvUpdateRef.current = currentTime;
          }

          // 1초마다 평균 심박수 업데이트
          if (currentTime - lastHeartRateUpdateRef.current >= 1000) {
            lastHeartRateUpdateRef.current = currentTime;

            if (heartRateAccumulatorRef.current.length > 0) {
              const averageHeartRate = Math.round(
                heartRateAccumulatorRef.current.reduce((a, b) => a + b, 0) /
                heartRateAccumulatorRef.current.length
              );

              setHeartRate(averageHeartRate);
              setIsHeartRateReady(true);
              setHeartRateHistory((prev) => [...prev.slice(-29), averageHeartRate]);
              heartRateAccumulatorRef.current = [];
            }
          }

          // Focus Score
          const blinkRate = blinkRateCalculator.current.getBlinkRate();
          const blinkStability = calculateBlinkStability(blinkRate);
          const avgGazeStability = gazeStabilityCalculator.current.getAverageStability();
          const focusScore = computeFocusScore(faceDetected, avgGazeStability, blinkStability);
          focusScoreCalculator.current.addScore(focusScore, timestamp);

          // BlendShape 한글 번역 맵 (레포지토리와 동일)
          const blendShapeKoreanMap: { [key: string]: string } = {
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

          const data: EnhancedBiometricData = {
            faceDetected: true,
            gazeStability: avgGazeStability,
            blinkRate,
            focusScore,
            timestamp,
            headPose: smoothedHeadRotation,
            heartRate: lastHeartRate.current,
            hrv: lastHrvDataRef.current, // 이전 값 유지 (깜빡임 방지)
            fps,
            confidence,
            ear: smoothedEARValue,
            landmarks: faceResult.landmarks,
            faceDistance: smoothedFaceDistance,
            mouthOpenRatio: smoothedMouthOpenRatio,
            eyebrowHeight: smoothedEyebrowHeight,
            smileLevel: smoothedSmileLevel,
            faceVisibility,
            facingDirection,
            blinkDetected,
            blendshapes: faceResult.blendshapes || null,
          };

          setCurrentData(data);
          setDataHistory((prev) => {
            const newHistory = [...prev, data];
            return newHistory.slice(-60);
          });

          // 시계열 데이터 업데이트 (1초 간격)
          if (currentTime - lastTimeSeriesUpdateRef.current >= 1000) {
            lastTimeSeriesUpdateRef.current = currentTime;

            setTimeSeriesData(prev => {
              const newTimestamps = [...prev.timestamps, currentTime];
              const newEarValues = [...prev.earValues, smoothedEARValue];
              const newSmileLevels = [...prev.smileLevels, smoothedSmileLevel];
              const newHeadYaw = [...prev.headYaw, smoothedHeadRotation.yaw];
              const newMouthOpen = [...prev.mouthOpen, smoothedMouthOpenRatio];
              const newEyebrowHeight = [...prev.eyebrowHeight, smoothedEyebrowHeight];
              const newHeadRoll = [...prev.headRoll, smoothedHeadRotation.roll];
              const newHeadPitch = [...prev.headPitch, smoothedHeadRotation.pitch];

              if (newTimestamps.length > MAX_DATA_POINTS) {
                newTimestamps.shift();
                newEarValues.shift();
                newSmileLevels.shift();
                newHeadYaw.shift();
                newMouthOpen.shift();
                newEyebrowHeight.shift();
                newHeadRoll.shift();
                newHeadPitch.shift();
              }

              return {
                timestamps: newTimestamps,
                earValues: newEarValues,
                smileLevels: newSmileLevels,
                headYaw: newHeadYaw,
                mouthOpen: newMouthOpen,
                eyebrowHeight: newEyebrowHeight,
                headRoll: newHeadRoll,
                headPitch: newHeadPitch,
              };
            });
          }

          onDataUpdate?.(data);
        } else {
          isBlinking.current = false;
          lastEAR.current = 1.0;
          setCurrentLandmarks(null);
          
          const data: EnhancedBiometricData = {
            faceDetected: false,
            gazeStability: 0,
            blinkRate: blinkRateCalculator.current.getBlinkRate(),
            focusScore: 0,
            timestamp,
            fps,
            confidence: 0,
            landmarks: null,
          };

          setCurrentData(data);
          setDataHistory((prev) => {
            const newHistory = [...prev, data];
            return newHistory.slice(-60);
          });
          onDataUpdate?.(data);
        }
      } catch (error) {
        console.error('Biometric processing error:', error);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);
    lastFrameTime.current = performance.now();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, isInitialized, onDataUpdate, calculateFPS, getSmoothedValue, calculateFaceDistance, calculateMouthOpenRatio, calculateEyebrowHeight, calculateSmileLevel, calculateFacingDirection]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* 비디오 및 캔버스 */}
        <div className="relative bg-black rounded-lg overflow-hidden mb-6">
          <CameraView
            ref={cameraViewRef}
            onVideoReady={handleVideoReady}
            width={1280}
            height={720}
            facingMode="user"
          />
          {currentLandmarks && showVisualization && cameraViewRef.current && (
            <FaceLandmarkCanvas
              video={cameraViewRef.current.getVideo()}
              landmarks={currentLandmarks}
              width={videoDimensions.width}
              height={videoDimensions.height}
              showConnectors={showConnectors}
              showLandmarks={showLandmarks}
              blinkDetected={currentData?.blinkDetected || false}
              earValue={earValue}
            />
          )}
          {currentData && showVisualization && (
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex gap-2">
              <span>FPS: {currentData.fps || 0}</span>
              <span>Confidence: {((currentData.confidence || 0) * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* 데이터 표시 */}
        {currentData && (
          <EnhancedBiometricDisplay
            data={currentData}
            dataHistory={dataHistory}
            heartRate={heartRate}
            heartRateHistory={heartRateHistory}
            heartRateConfidence={heartRateConfidence}
            signalQuality={signalQuality}
            isHeartRateReady={isHeartRateReady}
            hrvMetrics={hrvMetrics}
            hrvStressHistory={hrvStressHistory}
            timeSeriesData={timeSeriesData}
            earValue={earValue}
            showLandmarks={showLandmarks}
            showConnectors={showConnectors}
            onToggleLandmarks={() => setShowLandmarks(!showLandmarks)}
            onToggleConnectors={() => setShowConnectors(!showConnectors)}
          />
        )}
      </div>
    </div>
  );
};

// 확장된 데이터 표시 컴포넌트 (레포지토리 스타일)
const EnhancedBiometricDisplay: React.FC<{
  data: EnhancedBiometricData;
  dataHistory: EnhancedBiometricData[];
  heartRate: number;
  heartRateHistory: number[];
  heartRateConfidence: number;
  signalQuality: number;
  isHeartRateReady: boolean;
  hrvMetrics: {
    sdnn: number;
    rmssd: number;
    pnn50: number;
    stress?: number;
  } | null;
  hrvStressHistory: number[];
  timeSeriesData: {
    timestamps: number[];
    earValues: number[];
    smileLevels: number[];
    headYaw: number[];
    mouthOpen: number[];
    eyebrowHeight: number[];
    headRoll: number[];
    headPitch: number[];
  };
  earValue: number;
  showLandmarks: boolean;
  showConnectors: boolean;
  onToggleLandmarks: () => void;
  onToggleConnectors: () => void;
}> = ({
  data,
  heartRate,
  heartRateHistory,
  heartRateConfidence,
  signalQuality,
  isHeartRateReady,
  hrvMetrics,
  hrvStressHistory,
  timeSeriesData,
  earValue,
  showLandmarks,
  showConnectors,
  onToggleLandmarks,
  onToggleConnectors,
}) => {
  return (
    <div className="space-y-6">
      {/* 심박수 및 HRV 모니터링 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 심박수 카드 */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">❤️ 심박수 (rPPG)</h3>
            {isHeartRateReady ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">측정 중</span>
            ) : (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">준비 중...</span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-red-600">
              {heartRate > 0 ? heartRate : '--'}
            </span>
            <div className="flex flex-col">
              <span className="text-lg text-gray-600">BPM</span>
              <span className="text-xs text-gray-500">(1초 평균)</span>
            </div>
          </div>

          {/* 심박수 실시간 그래프 */}
          <div className="mt-4">
            <div className="text-xs text-gray-600 mb-2">실시간 변화 (30초)</div>
            <div className="h-20 relative bg-white rounded-lg p-2">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="gridHR" width="10" height="25" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="25" stroke="#f3f4f6" strokeWidth="0.5" />
                    <line x1="0" y1="0" x2="10" y2="0" stroke="#f3f4f6" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#gridHR)" />
                <rect
                  x="0"
                  y={`${(1 - 100/200) * 100}`}
                  width="100"
                  height={`${(100-60)/200 * 100}`}
                  fill="#10b981"
                  opacity="0.1"
                />
                {heartRateHistory.length > 1 && (
                  <polyline
                    points={heartRateHistory.map((value, i) =>
                      `${(i / (heartRateHistory.length - 1)) * 100},${(1 - value/200) * 100}`
                    ).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
                {heartRateHistory.length > 0 && (
                  <circle
                    cx="100"
                    cy={`${(1 - heartRateHistory[heartRateHistory.length - 1]/200) * 100}`}
                    r="3"
                    fill="#ef4444"
                  />
                )}
              </svg>
              <div className="absolute top-0 left-0 text-[9px] text-gray-400">200</div>
              <div className="absolute bottom-0 left-0 text-[9px] text-gray-400">0</div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">신뢰도</span>
              <span className={`font-medium ${
                heartRateConfidence > 0.7 ? 'text-green-600' :
                heartRateConfidence > 0.4 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {(heartRateConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  heartRateConfidence > 0.7 ? 'bg-green-500' :
                  heartRateConfidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${heartRateConfidence * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">신호 품질</span>
              <span className={`font-medium ${
                signalQuality > 0.7 ? 'text-green-600' :
                signalQuality > 0.4 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {signalQuality > 0.7 ? '우수' : signalQuality > 0.4 ? '보통' : '불량'}
              </span>
            </div>
          </div>
        </div>

        {/* HRV 분석 카드 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">📊 HRV 분석</h3>
            {hrvMetrics ? (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">분석 완료</span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">데이터 수집 중</span>
            )}
          </div>

          {hrvMetrics ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">SDNN</div>
                  <div className="text-lg font-bold text-blue-600">{hrvMetrics.sdnn.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">ms</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">RMSSD</div>
                  <div className="text-lg font-bold text-blue-600">{hrvMetrics.rmssd.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">ms</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">pNN50</div>
                  <div className="text-lg font-bold text-blue-600">{hrvMetrics.pnn50.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">%</div>
                </div>
              </div>

              {/* 스트레스 지수 그래프 */}
              {hrvMetrics.stress !== undefined && (
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-2">스트레스 지수 변화</div>
                  <div className="h-16 relative">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <pattern id="gridStress" width="10" height="25" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="25" stroke="#f3f4f6" strokeWidth="0.5" />
                          <line x1="0" y1="0" x2="10" y2="0" stroke="#f3f4f6" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100" height="100" fill="url(#gridStress)" />
                      <rect x="0" y="70" width="100" height="30" fill="#10b981" opacity="0.1" />
                      <rect x="0" y="30" width="100" height="40" fill="#eab308" opacity="0.1" />
                      <rect x="0" y="0" width="100" height="30" fill="#ef4444" opacity="0.1" />
                      {hrvStressHistory.length > 1 && (
                        <polyline
                          points={hrvStressHistory.map((value, i) =>
                            `${(i / (hrvStressHistory.length - 1)) * 100},${(1 - value/100) * 100}`
                          ).join(' ')}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="2"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      )}
                      {hrvStressHistory.length > 0 && (
                        <circle
                          cx="100"
                          cy={`${(1 - hrvStressHistory[hrvStressHistory.length - 1]/100) * 100}`}
                          r="3"
                          fill="#6366f1"
                        />
                      )}
                    </svg>
                    <div className="absolute top-0 right-0 text-[9px] text-gray-400">100%</div>
                    <div className="absolute bottom-0 right-0 text-[9px] text-gray-400">0%</div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-2xl font-bold">
                      {hrvMetrics.stress < 30 ? '😊' : hrvMetrics.stress < 60 ? '😐' : '😰'}
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${
                        hrvMetrics.stress < 30 ? 'text-green-600' :
                        hrvMetrics.stress < 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {hrvMetrics.stress}%
                      </div>
                      <div className="text-xs text-gray-600">
                        {hrvMetrics.stress < 30 ? '낮음' : hrvMetrics.stress < 60 ? '보통' : '높음'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-2">
                <div className="animate-pulse inline-block">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm">30초 이상 측정 필요</p>
              <p className="text-xs mt-1">안정된 상태 유지</p>
            </div>
          )}
        </div>
      </div>

      {/* 실시간 그래프 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-700 mb-3 font-semibold">📊 실시간 변화 추적 (최근 10초)</div>
        <div className="grid grid-cols-2 gap-4">
          {/* EAR 그래프 */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-xs text-gray-600 mb-2">👁️ 눈 깜빡임 추적 (EAR)</div>
            <div className="h-24 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid1" width="20" height="25" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
                    <line x1="0" y1="0" x2="20" y2="0" stroke="#e5e7eb" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid1)" />
                
                {/* 임계값 0.5 라인 */}
                <line
                  x1="0"
                  y1={`${(1 - (0.5 - 0.4) / (0.8 - 0.4)) * 100}`}
                  x2="100"
                  y2={`${(1 - (0.5 - 0.4) / (0.8 - 0.4)) * 100}`}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                  opacity="0.8"
                />
                <text
                  x="2"
                  y={`${(1 - (0.5 - 0.4) / (0.8 - 0.4)) * 100 - 2}`}
                  fill="#ef4444"
                  fontSize="8"
                  fontWeight="bold"
                >
                  0.5
                </text>
                
                {/* EAR 값 라인 */}
                {timeSeriesData.earValues.length > 1 && (
                  <polyline
                    points={timeSeriesData.earValues.map((value, i) => {
                      // 값이 범위를 벗어나면 클리핑
                      const clampedValue = Math.max(0.4, Math.min(0.8, value));
                      // 0.4 ~ 0.8 범위를 0 ~ 100으로 매핑
                      const normalizedY = (1 - (clampedValue - 0.4) / (0.8 - 0.4)) * 100;
                      return `${(i / (MAX_DATA_POINTS - 1)) * 100},${normalizedY}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
                
                {/* 현재 값 점 */}
                {timeSeriesData.earValues.length > 0 && (
                  <circle
                    cx="100"
                    cy={`${(1 - (Math.max(0.4, Math.min(0.8, timeSeriesData.earValues[timeSeriesData.earValues.length - 1])) - 0.4) / (0.8 - 0.4)) * 100}`}
                    r="3"
                    fill="#3b82f6"
                  />
                )}
              </svg>
              <div className="absolute bottom-0 left-0 text-[10px] text-gray-500">0.4</div>
              <div className="absolute top-0 left-0 text-[10px] text-gray-500">0.8</div>
              <div className="absolute bottom-0 right-0 text-[10px] text-gray-500">현재: {earValue.toFixed(3)}</div>
            </div>
          </div>

          {/* Head Roll 그래프 */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-xs text-gray-600 mb-2">🎯 고개 기울임 (기울기)</div>
            <div className="h-24 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="50" x2="100" y2="50" stroke="#9ca3af" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                {timeSeriesData.headRoll.length > 1 && (
                  <polyline
                    points={timeSeriesData.headRoll.map((value, i) =>
                      `${(i / (MAX_DATA_POINTS - 1)) * 100},${50 - (value / 45) * 50}`
                    ).join(' ')}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="absolute bottom-0 left-0 text-[10px] text-gray-500">-45°</div>
              <div className="absolute top-0 left-0 text-[10px] text-gray-500">+45°</div>
              <div className="absolute bottom-0 right-0 text-[10px] text-gray-500">현재: {data.headPose?.roll || 0}°</div>
            </div>
          </div>

          {/* Head Yaw 그래프 */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-xs text-gray-600 mb-2">🔄 머리 회전 (좌/우)</div>
            <div className="h-24 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="50" x2="100" y2="50" stroke="#9ca3af" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                {timeSeriesData.headYaw.length > 1 && (
                  <polyline
                    points={timeSeriesData.headYaw.map((value, i) =>
                      `${(i / (MAX_DATA_POINTS - 1)) * 100},${50 - (value / 90) * 50}`
                    ).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="absolute bottom-0 left-0 text-[10px] text-gray-500">-45°</div>
              <div className="absolute top-0 left-0 text-[10px] text-gray-500">+45°</div>
              <div className="absolute bottom-0 right-0 text-[10px] text-gray-500">현재: {data.headPose?.yaw || 0}°</div>
            </div>
          </div>

          {/* Head Pitch 그래프 */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-xs text-gray-600 mb-2">⬆️ 고개 기울기 (위/아래)</div>
            <div className="h-24 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="50" x2="100" y2="50" stroke="#9ca3af" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                {timeSeriesData.headPitch.length > 1 && (
                  <polyline
                    points={timeSeriesData.headPitch.map((value, i) =>
                      `${(i / (MAX_DATA_POINTS - 1)) * 100},${50 - (value / 45) * 50}`
                    ).join(' ')}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="absolute bottom-0 left-0 text-[10px] text-gray-500">-45°</div>
              <div className="absolute top-0 left-0 text-[10px] text-gray-500">+45°</div>
              <div className="absolute bottom-0 right-0 text-[10px] text-gray-500">현재: {data.headPose?.pitch || 0}°</div>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 패널 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">감지된 얼굴</div>
          <div className="text-2xl font-bold text-gray-800">{data.faceDetected ? '1개' : '0개'}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">FPS</div>
          <div className="text-2xl font-bold text-gray-800">{data.fps || 0}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">신뢰도</div>
          <div className="text-2xl font-bold text-gray-800">
            {((data.confidence || 0) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">눈 깜빡임</div>
          <div className={`text-2xl font-bold ${data.blinkDetected ? 'text-green-600' : 'text-gray-800'}`}>
            {data.blinkDetected ? '감지됨' : '감지안됨'}
          </div>
          <div className="text-xs text-gray-500 mt-1">EAR: {earValue.toFixed(3)}</div>
        </div>
      </div>

      {/* EAR 실시간 모니터링 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="text-sm text-gray-700 mb-2">👁️ Eye Aspect Ratio (EAR) 실시간 모니터링</div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="bg-gray-200 rounded-full h-4 relative overflow-hidden">
              {(() => {
                // 0.5~0.6 범위로 정규화 (0.5 미만은 0%, 0.6 초과는 100%)
                const clampedValue = Math.max(0.5, Math.min(0.6, earValue));
                const normalizedWidth = ((clampedValue - 0.5) / (0.6 - 0.5)) * 100;
                return (
                  <>
                    <div
                      className={`h-full transition-all duration-100 ${
                        earValue < 0.5 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${normalizedWidth}%` }}
                    />
                    {/* 임계값 0.5 라인 (시작점) */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                      style={{ left: '0%' }}
                    />
                  </>
                );
              })()}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>0.5</span>
              <span>0.6</span>
            </div>
          </div>
          <div className="text-sm font-mono">
            <span className={`font-bold ${earValue < 0.5 ? 'text-green-600' : 'text-blue-600'}`}>
              {earValue.toFixed(4)}
            </span>
            <div className="text-xs text-gray-500">
              {earValue < 0.5 ? '눈 감김' : '눈 뜸'}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          빨간선: 임계값(0.5) | 눈 뜸: &gt;0.5 | 눈 감김: &lt;0.5 | 범위: 0.5~0.6
        </div>
      </div>

      {/* 머리 회전 정보 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600 mb-2">머리 회전 각도</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500">Pitch (위/아래)</div>
            <div className="text-lg font-bold">{data.headPose?.pitch || 0}°</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Yaw (좌/우)</div>
            <div className="text-lg font-bold">{data.headPose?.yaw || 0}°</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Roll (기울기)</div>
            <div className="text-lg font-bold">{data.headPose?.roll || 0}°</div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="text-sm font-medium text-gray-700">얼굴 방향: </span>
          <span className="text-sm font-bold text-blue-600">{data.facingDirection || '정면'}</span>
        </div>
      </div>

      {/* 표정 분석 대시보드 */}
      <div className="bg-purple-50 rounded-lg p-4">
        <div className="text-sm text-gray-700 mb-3 font-semibold">😊 표정 분석</div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">미소 수준</span>
              <span className="font-medium">{((data.smileLevel || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(data.smileLevel || 0) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">입 벌림 정도</span>
              <span className="font-medium">{((data.mouthOpenRatio || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-pink-400 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(data.mouthOpenRatio || 0) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">놀람 표정</span>
              <span className="font-medium">{((data.eyebrowHeight || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(data.eyebrowHeight || 0) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 거리 및 가시성 정보 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">📏 카메라 거리</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(data.faceDistance || 0) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-700">
              {(data.faceDistance || 0) > 0.7 ? '가까움' :
               (data.faceDistance || 0) > 0.3 ? '적당함' : '멀음'}
            </span>
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">👁️ 얼굴 가시성</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-orange-400 to-orange-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(data.faceVisibility || 0) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-700">
              {((data.faceVisibility || 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* BlendShapes 데이터 (있을 경우) */}
      {data.blendshapes && data.blendshapes.categories && (
        <div className="mt-4 bg-indigo-50 rounded-lg p-4">
          <div className="text-sm text-gray-700 mb-3 font-semibold">🎭 표정 세부 데이터 (전체 52개)</div>
          <div className="grid grid-cols-4 gap-x-3 gap-y-1">
            {(() => {
              // 모든 BlendShape 항목들을 고정 순서로 정의
              const allBlendShapes = [
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
              ];

              // 현재 BlendShape 값들을 맵으로 변환
              const currentScores: { [key: string]: number } = {};
              data.blendshapes.categories.forEach((shape: any) => {
                const key = shape.displayName || shape.categoryName;
                currentScores[key] = shape.score;
              });

              // 모든 항목 표시 (고정 순서)
              return allBlendShapes.map((item) => {
                const score = currentScores[item.key] || 0;
                const isActive = score > 0.05;

                return (
                  <div key={item.key} className="text-xs">
                    <div className="flex justify-between items-center">
                      <span className={`truncate text-[9px] ${isActive ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        {item.name}
                      </span>
                      <span className={`ml-1 text-[9px] ${isActive ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-0.5 mt-0.5">
                      <div
                        className={`h-0.5 rounded-full transition-all duration-200 ${
                          isActive ? 'bg-indigo-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${score * 100}%` }}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* 토글 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={onToggleLandmarks}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            showLandmarks
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showLandmarks ? '랜드마크 숨기기' : '랜드마크 표시'}
        </button>
        <button
          onClick={onToggleConnectors}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            showConnectors
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showConnectors ? '연결선 숨기기' : '연결선 표시'}
        </button>
      </div>
    </div>
  );
};
