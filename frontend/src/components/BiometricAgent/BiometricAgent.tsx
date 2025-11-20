import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraView } from './CameraView';
import { detectFace, extractEyeLandmarks } from '../../lib/biometric/faceDetection';
import { calculateEAR, detectBlink, BlinkRateCalculator } from '../../lib/biometric/blinkEstimation';
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

interface BiometricData {
  faceDetected: boolean;
  gazeStability: number;
  blinkRate: number;
  focusScore: number;
  timestamp: number;
}

interface BiometricAgentProps {
  onDataUpdate?: (data: BiometricData) => void;
  enabled?: boolean;
}

export const BiometricAgent: React.FC<BiometricAgentProps> = ({
  onDataUpdate,
  enabled = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentData, setCurrentData] = useState<BiometricData | null>(null);

  const blinkRateCalculator = useRef(new BlinkRateCalculator());
  const gazeStabilityCalculator = useRef(new GazeStabilityCalculator());
  const focusScoreCalculator = useRef(new FocusScoreCalculator());
  const lastBlinkTime = useRef<number>(0);
  const lastEAR = useRef<number>(1.0);
  const baselineEAR = useRef<number>(0); // 개인별 기준 EAR
  const earHistory = useRef<number[]>([]); // EAR 히스토리 (기준값 계산용)
  const isBlinking = useRef<boolean>(false); // 현재 깜빡임 상태

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!enabled || !isInitialized || !videoRef.current) return;

    const processFrame = async () => {
      if (!videoRef.current) return;

      const video = videoRef.current;
      
      // 비디오가 준비되었는지 확인
      if (
        video.readyState < 2 || // HAVE_CURRENT_DATA
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const timestamp = performance.now();

      try {
        // 얼굴 감지
        const faceResult = await detectFace(video, timestamp);
        const faceDetected = faceResult.detected ? 1 : 0;

        if (faceResult.detected && faceResult.landmarks) {
          // 눈 랜드마크 추출
          const { leftEye, rightEye } = extractEyeLandmarks(faceResult.landmarks);

          // EAR 계산 및 깜빡임 감지
          const leftEAR = calculateEAR(leftEye);
          const rightEAR = calculateEAR(rightEye);
          const avgEAR = (leftEAR + rightEAR) / 2;

          // 기준 EAR 계산 (최근 30개 프레임의 평균)
          earHistory.current.push(avgEAR);
          if (earHistory.current.length > 30) {
            earHistory.current.shift();
          }
          if (earHistory.current.length >= 10) {
            baselineEAR.current = earHistory.current.reduce((a, b) => a + b, 0) / earHistory.current.length;
          }
          
          // 깜빡임 감지: 개인별 기준 EAR의 70% 아래로 떨어졌다가 다시 올라오면 깜빡임
          const blinkThreshold = baselineEAR.current > 0 ? baselineEAR.current * 0.7 : 0.21;
          const openThreshold = baselineEAR.current > 0 ? baselineEAR.current * 0.85 : 0.25;
          
          // 깜빡임 시작: EAR가 임계값 아래로 떨어짐
          if (avgEAR < blinkThreshold && !isBlinking.current) {
            isBlinking.current = true;
          }
          
          // 깜빡임 종료: EAR가 다시 임계값 위로 올라옴
          if (isBlinking.current && avgEAR >= openThreshold) {
            isBlinking.current = false;
            const now = Date.now();
            if (now - lastBlinkTime.current > 200) { // 최소 200ms 간격
              blinkRateCalculator.current.addBlink(now);
              lastBlinkTime.current = now;
            }
          }

          lastEAR.current = avgEAR;

          // 시선 안정성 계산
          const gazeCenter = calculateGazeCenter(leftEye, rightEye);
          const gazeVector = calculateGazeVector(gazeCenter);
          const gazeStability = calculateGazeStability(gazeVector);
          gazeStabilityCalculator.current.addStability(gazeStability, timestamp);

          // 깜빡임 안정성 계산
          const blinkRate = blinkRateCalculator.current.getBlinkRate();
          const blinkStability = calculateBlinkStability(blinkRate);

          // Focus Score 계산
          const avgGazeStability = gazeStabilityCalculator.current.getAverageStability();
          const focusScore = computeFocusScore(faceDetected, avgGazeStability, blinkStability);
          focusScoreCalculator.current.addScore(focusScore, timestamp);

          const data: BiometricData = {
            faceDetected: faceResult.detected,
            gazeStability: avgGazeStability,
            blinkRate,
            focusScore,
            timestamp,
          };

          setCurrentData(data);
          onDataUpdate?.(data);
        } else {
          // 얼굴이 감지되지 않으면 상태 초기화
          isBlinking.current = false;
          lastEAR.current = 1.0;
          
          // 얼굴이 감지되지 않으면 Focus Score는 0
          const data: BiometricData = {
            faceDetected: false,
            gazeStability: 0,
            blinkRate: blinkRateCalculator.current.getBlinkRate(), // 기존 깜빡임 비율 유지
            focusScore: 0,
            timestamp,
          };

          setCurrentData(data);
          onDataUpdate?.(data);
        }
      } catch (error) {
        console.error('Biometric processing error:', error);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, isInitialized, onDataUpdate]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="w-full">
      <CameraView
        onVideoReady={handleVideoReady}
        width={640}
        height={480}
        facingMode="user"
      />
      {currentData && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Face Detected</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentData.faceDetected ? '✓' : '✗'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Gaze Stability</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {(currentData.gazeStability * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Blink Rate</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentData.blinkRate.toFixed(1)} /min
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Focus Score</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {(currentData.focusScore * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

