import { useRef, useCallback } from 'react';
import { detectFace, extractEyeLandmarks, getEyeIndices } from '../lib/biometric/faceDetection';
import { calculateEARFromLandmarks, BlinkRateCalculator } from '../lib/biometric/blinkEstimation';
import {
  calculateGazeCenter,
  calculateGazeVector,
  calculateGazeStability,
  GazeStabilityCalculator,
} from '../lib/biometric/gazeEstimation';
import {
  computeFocusScore,
  calculateBlinkStability,
  FocusScoreCalculator,
} from '../lib/biometric/computeFocusScore';
import { calculateHeadPose } from '../lib/biometric/headPose';
import type { Landmark, FaceDetectionResult, BlendShapes, HeadPose } from '../types/biometric';
import { BLINK_THRESHOLD, SMOOTHING_WINDOW } from '../constants/biometric';

/**
 * 생체 인식 데이터 처리 훅
 */
export const useBiometricProcessing = () => {
  const blinkRateCalculator = useRef(new BlinkRateCalculator());
  const gazeStabilityCalculator = useRef(new GazeStabilityCalculator());
  const focusScoreCalculator = useRef(new FocusScoreCalculator());

  const lastBlinkTime = useRef<number>(0);
  const lastEAR = useRef<number>(1.0);
  const isBlinking = useRef<boolean>(false);
  const frameCount = useRef<number>(0);

  // 스무싱을 위한 값 히스토리
  const smoothingBufferRef = useRef<{
    headRotation: { pitch: number[]; yaw: number[]; roll: number[] };
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

  /**
   * 이동 평균 계산 함수
   */
  const getSmoothedValue = useCallback((values: number[], newValue: number, windowSize: number = SMOOTHING_WINDOW) => {
    values.push(newValue);
    if (values.length > windowSize) {
      values.shift();
    }
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : newValue;
  }, []);

  /**
   * 얼굴 거리 계산
   */
  const calculateFaceDistance = useCallback((landmarks: Landmark[]): number => {
    if (!landmarks || landmarks.length === 0) return 0;
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    if (!leftEye || !rightEye) return 0;
    const distance = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) +
      Math.pow(rightEye.y - leftEye.y, 2)
    );
    return Math.min(Math.max((distance - 0.05) * 5, 0), 1);
  }, []);

  /**
   * 입 벌림 정도 계산
   */
  const calculateMouthOpenRatio = useCallback((landmarks: Landmark[]): number => {
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

  /**
   * 눈썹 높이 계산
   */
  const calculateEyebrowHeight = useCallback((landmarks: Landmark[]): number => {
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

  /**
   * 미소 수준 계산 (BlendShape 활용)
   */
  const calculateSmileLevel = useCallback((landmarks: Landmark[], blendshapes?: BlendShapes | null): number => {
    // BlendShape 데이터가 있으면 우선 사용 (더 정확함)
    if (blendshapes && blendshapes.categories) {
      const mouthSmileLeft = blendshapes.categories.find((s) => 
        (s.displayName || s.categoryName) === 'mouthSmileLeft'
      );
      const mouthSmileRight = blendshapes.categories.find((s) => 
        (s.displayName || s.categoryName) === 'mouthSmileRight'
      );
      
      if (mouthSmileLeft && mouthSmileRight) {
        const avgSmile = (mouthSmileLeft.score + mouthSmileRight.score) / 2;
        return Math.min(Math.max(avgSmile, 0), 1);
      }
    }

    // BlendShape가 없으면 랜드마크 기반 계산
    if (!landmarks || landmarks.length === 0) return 0;
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];
    const noseBottom = landmarks[19];
    if (!leftMouth || !rightMouth || !noseBottom) return 0;
    
    const leftLift = noseBottom.y - leftMouth.y;
    const rightLift = noseBottom.y - rightMouth.y;
    const avgLift = (leftLift + rightLift) / 2;
    const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);

    return Math.min(Math.max(avgLift * 5 + mouthWidth * 2, 0), 1);
  }, []);

  /**
   * 얼굴 방향 계산
   */
  const calculateFacingDirection = useCallback((yaw: number): string => {
    if (yaw < -20) return '오른쪽';
    if (yaw > 20) return '왼쪽';
    if (yaw < -5) return '약간 오른쪽';
    if (yaw > 5) return '약간 왼쪽';
    return '정면';
  }, []);

  /**
   * EAR 값 계산 (BlendShape 또는 랜드마크 기반)
   */
  const calculateEAR = useCallback((faceResult: FaceDetectionResult): number => {
    let rawEARValue = 0.5; // 기본값

    if (faceResult.blendshapes && faceResult.blendshapes.categories) {
      const eyeBlinkLeft = faceResult.blendshapes.categories.find((s) => 
        (s.displayName || s.categoryName) === 'eyeBlinkLeft'
      );
      const eyeBlinkRight = faceResult.blendshapes.categories.find((s) => 
        (s.displayName || s.categoryName) === 'eyeBlinkRight'
      );
      
      if (eyeBlinkLeft && eyeBlinkRight) {
        const leftBlinkScore = eyeBlinkLeft.score || 0;
        const rightBlinkScore = eyeBlinkRight.score || 0;
        const avgBlinkScore = (leftBlinkScore + rightBlinkScore) / 2;
        rawEARValue = 0.6 - (avgBlinkScore * 0.2);
        
        if (import.meta.env.DEV && frameCount.current % 30 === 0) {
          console.log(`BlendShape EAR - Left: ${leftBlinkScore.toFixed(3)}, Right: ${rightBlinkScore.toFixed(3)}, Avg: ${avgBlinkScore.toFixed(3)}, EAR: ${rawEARValue.toFixed(3)}`);
        }
      } else {
        // BlendShape가 없으면 랜드마크 기반 계산 (폴백)
        rawEARValue = calculateEARFromLandmarksFallback(faceResult.landmarks);
      }
    } else {
      // BlendShape가 없으면 랜드마크 기반 계산 (폴백)
      rawEARValue = calculateEARFromLandmarksFallback(faceResult.landmarks);
    }

    return rawEARValue;
  }, []);

  /**
   * 랜드마크 기반 EAR 계산 (폴백)
   */
  const calculateEARFromLandmarksFallback = useCallback((landmarks: Landmark[] | null): number => {
    if (!landmarks || landmarks.length < 468) return 0.5;
    const eyeIndices = getEyeIndices();
    const leftEAR = calculateEARFromLandmarks(landmarks, eyeIndices.leftEye);
    const rightEAR = calculateEARFromLandmarks(landmarks, eyeIndices.rightEye);
    return (leftEAR + rightEAR) / 2;
  }, []);

  /**
   * 얼굴 감지 및 생체 인식 데이터 처리
   */
  const processBiometricData = useCallback(async (
    video: HTMLVideoElement,
    timestamp: number
  ): Promise<{
    faceResult: FaceDetectionResult;
    earValue: number;
    blinkDetected: boolean;
    blinkRate: number;
    gazeStability: number;
    focusScore: number;
    headPose: HeadPose;
    faceDistance: number;
    mouthOpenRatio: number;
    eyebrowHeight: number;
    smileLevel: number;
    faceVisibility: number;
    facingDirection: string;
  } | null> => {
    try {
      const faceResult = await detectFace(video, timestamp);
      
      if (!faceResult.detected || !faceResult.landmarks) {
        // 얼굴이 감지되지 않은 경우
        isBlinking.current = false;
        lastEAR.current = 1.0;
        return null;
      }

      // EAR 계산
      const rawEARValue = calculateEAR(faceResult);
      
      // 스무싱 적용
      const buffer = smoothingBufferRef.current;
      const smoothedEARValue = getSmoothedValue(buffer.earValue, rawEARValue, 3);
      
      // 깜빡임 감지
      const blinkDetected = smoothedEARValue < BLINK_THRESHOLD;

      // 디버깅 로그
      if (import.meta.env.DEV) {
        if (frameCount.current % 30 === 0) {
          console.log(`EAR - Raw: ${rawEARValue.toFixed(3)}, Smoothed: ${smoothedEARValue.toFixed(3)}, Threshold: ${BLINK_THRESHOLD}, Blink: ${blinkDetected ? 'YES' : 'NO'}`);
        }
        frameCount.current++;
      }

      // 깜빡임 감지 및 카운트
      if (blinkDetected && !isBlinking.current) {
        isBlinking.current = true;
        if (import.meta.env.DEV) {
          console.log(`👁️ Blink started - EAR: ${smoothedEARValue.toFixed(3)}`);
        }
      }
      
      if (!blinkDetected && isBlinking.current) {
        isBlinking.current = false;
        const now = Date.now();
        if (now - lastBlinkTime.current > 200) {
          blinkRateCalculator.current.addBlink(now);
          lastBlinkTime.current = now;
          if (import.meta.env.DEV) {
            console.log(`👁️ Blink completed! EAR: ${smoothedEARValue.toFixed(3)}, Count: ${blinkRateCalculator.current.getBlinkCount()}, Rate: ${blinkRateCalculator.current.getBlinkRate().toFixed(1)}/min`);
          }
        }
      }
      
      lastEAR.current = smoothedEARValue;

      // 시선 안정성 계산
      const { leftEye, rightEye } = extractEyeLandmarks(faceResult.landmarks);
      const gazeCenter = calculateGazeCenter(leftEye, rightEye);
      const gazeVector = calculateGazeVector(gazeCenter);
      const gazeStability = calculateGazeStability(gazeVector);
      gazeStabilityCalculator.current.addStability(gazeStability, timestamp);

      // 머리 자세 계산
      const headRotation = calculateHeadPose(faceResult.landmarks);
      const smoothedHeadRotation: HeadPose = {
        pitch: Math.round(getSmoothedValue(buffer.headRotation.pitch, headRotation.pitch, 7)),
        yaw: Math.round(getSmoothedValue(buffer.headRotation.yaw, headRotation.yaw, 7)),
        roll: Math.round(getSmoothedValue(buffer.headRotation.roll, headRotation.roll, 7)),
      };

      // 추가 데이터 계산
      const rawFaceDistance = calculateFaceDistance(faceResult.landmarks);
      const rawMouthOpenRatio = calculateMouthOpenRatio(faceResult.landmarks);
      const rawEyebrowHeight = calculateEyebrowHeight(faceResult.landmarks);
      const rawSmileLevel = calculateSmileLevel(faceResult.landmarks, faceResult.blendshapes);

      const smoothedFaceDistance = getSmoothedValue(buffer.faceDistance, rawFaceDistance);
      const smoothedMouthOpenRatio = getSmoothedValue(buffer.mouthOpenRatio, rawMouthOpenRatio, 3);
      const smoothedEyebrowHeight = getSmoothedValue(buffer.eyebrowHeight, rawEyebrowHeight);
      const smoothedSmileLevel = getSmoothedValue(buffer.smileLevel, rawSmileLevel, 8);

      const facingDirection = calculateFacingDirection(smoothedHeadRotation.yaw);

      // 얼굴 가시성
      const faceVisibility = faceResult.landmarks
        ? faceResult.landmarks.filter((l) => l.x >= 0 && l.x <= 1 && l.y >= 0 && l.y <= 1).length / faceResult.landmarks.length
        : 0;

      // Focus Score 계산
      const blinkRate = blinkRateCalculator.current.getBlinkRate();
      const blinkStability = calculateBlinkStability(blinkRate);
      const avgGazeStability = gazeStabilityCalculator.current.getAverageStability();
      const focusScore = computeFocusScore(1, avgGazeStability, blinkStability);
      focusScoreCalculator.current.addScore(focusScore, timestamp);

      return {
        faceResult,
        earValue: smoothedEARValue,
        blinkDetected,
        blinkRate,
        gazeStability: avgGazeStability,
        focusScore,
        headPose: smoothedHeadRotation,
        faceDistance: smoothedFaceDistance,
        mouthOpenRatio: smoothedMouthOpenRatio,
        eyebrowHeight: smoothedEyebrowHeight,
        smileLevel: smoothedSmileLevel,
        faceVisibility,
        facingDirection,
      };
    } catch (error) {
      console.error('Biometric processing error:', error);
      return null;
    }
  }, [calculateEAR, getSmoothedValue, calculateFaceDistance, calculateMouthOpenRatio, calculateEyebrowHeight, calculateSmileLevel, calculateFacingDirection, calculateEARFromLandmarksFallback]);

  /**
   * 초기화
   */
  const reset = useCallback(() => {
    blinkRateCalculator.current = new BlinkRateCalculator();
    gazeStabilityCalculator.current = new GazeStabilityCalculator();
    focusScoreCalculator.current = new FocusScoreCalculator();
    lastBlinkTime.current = 0;
    lastEAR.current = 1.0;
    isBlinking.current = false;
    frameCount.current = 0;
    smoothingBufferRef.current = {
      headRotation: { pitch: [], yaw: [], roll: [] },
      faceDistance: [],
      mouthOpenRatio: [],
      eyebrowHeight: [],
      smileLevel: [],
      earValue: [],
    };
  }, []);

  return {
    processBiometricData,
    reset,
  };
};

