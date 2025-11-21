import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraView, type CameraViewHandle } from './CameraView';
import { FaceLandmarkCanvas } from './FaceLandmarkCanvas';
import { BiometricDisplay } from './BiometricDisplay';
import { useBiometricProcessing } from '../../hooks/useBiometricProcessing';
import { useHeartRate } from '../../hooks/useHeartRate';
import { useHRV } from '../../hooks/useHRV';
import { useTimeSeriesData } from '../../hooks/useTimeSeriesData';
import { useFPS } from '../../hooks/useFPS';
import type { EnhancedBiometricData, Landmark } from '../../types/biometric';

interface EnhancedBiometricAgentProps {
  onDataUpdate?: (data: EnhancedBiometricData) => void;
  enabled?: boolean;
  showVisualization?: boolean;
}

/**
 * 향상된 생체 인식 에이전트 컴포넌트
 * 
 * 주요 기능:
 * - 실시간 얼굴 감지 및 랜드마크 추출
 * - 눈 깜빡임 감지 (EAR 기반)
 * - 시선 안정성 분석
 * - 심박수 측정 (rPPG)
 * - HRV 분석
 * - 표정 분석 (미소, 입 벌림 등)
 */
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
  const [currentLandmarks, setCurrentLandmarks] = useState<Landmark[] | null>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showConnectors, setShowConnectors] = useState(true);
  const [earValue, setEarValue] = useState<number>(0);

  // 커스텀 훅 사용
  const { processBiometricData } = useBiometricProcessing();
  const {
    heartRate,
    isHeartRateReady,
    heartRateHistory,
    processHeartRate,
    updateAverageHeartRate,
    getCurrentHeartRate,
  } = useHeartRate();
  const {
    hrvMetrics,
    hrvStressHistory,
    addRRInterval,
    updateHRVMetrics,
    getCurrentHRVMetrics,
  } = useHRV();
  const { timeSeriesData, updateTimeSeriesData } = useTimeSeriesData();
  const { calculateFPS } = useFPS();

  /**
   * 비디오 준비 완료 핸들러
   */
  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
    setVideoDimensions({
      width: video.videoWidth || 640,
      height: video.videoHeight || 480,
    });
    setIsInitialized(true);
  }, []);

  /**
   * 프레임 처리 메인 로직
   */
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

      try {
        // 생체 인식 데이터 처리
        const biometricResult = await processBiometricData(video, timestamp);
        
        if (!biometricResult) {
          // 얼굴이 감지되지 않은 경우
          setCurrentLandmarks(null);
          
          const data: EnhancedBiometricData = {
            faceDetected: false,
            gazeStability: 0,
            blinkRate: 0,
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
        } else {
          const {
            faceResult,
            earValue: processedEARValue,
            blinkDetected,
            blinkRate,
            gazeStability,
            focusScore,
            headPose,
            faceDistance,
            mouthOpenRatio,
            eyebrowHeight,
            smileLevel,
            faceVisibility,
            facingDirection,
          } = biometricResult;

          setCurrentLandmarks(faceResult.landmarks);
          setEarValue(processedEARValue);

          // 심박수 처리
          if (faceResult.landmarks) {
            processHeartRate(video, faceResult.landmarks, timestamp);
            updateAverageHeartRate();
          }

          // HRV 처리
          const currentHeartRate = getCurrentHeartRate();
          if (currentHeartRate) {
            addRRInterval(currentHeartRate);
            updateHRVMetrics();
          }

          // 시계열 데이터 업데이트
          updateTimeSeriesData(
            processedEARValue,
            smileLevel,
            headPose,
            mouthOpenRatio,
            eyebrowHeight
          );

          const data: EnhancedBiometricData = {
            faceDetected: true,
            gazeStability,
            blinkRate,
            focusScore,
            timestamp,
            headPose,
            heartRate: currentHeartRate,
            hrv: getCurrentHRVMetrics(),
            fps,
            confidence: 0.95,
            ear: processedEARValue,
            landmarks: faceResult.landmarks,
            faceDistance,
            mouthOpenRatio,
            eyebrowHeight,
            smileLevel,
            faceVisibility,
            facingDirection,
            blinkDetected,
            blendshapes: faceResult.blendshapes || null,
          };

          setCurrentData(data);
          
          // dataHistory에는 메모리 절약을 위해 landmarks와 blendshapes 제외
          setDataHistory((prev) => {
            const historyData: EnhancedBiometricData = {
              ...data,
              landmarks: null,
              blendshapes: null,
            };
            const newHistory = [...prev, historyData];
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

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    enabled,
    isInitialized,
    onDataUpdate,
    calculateFPS,
    processBiometricData,
    processHeartRate,
    updateAverageHeartRate,
    getCurrentHeartRate,
    addRRInterval,
    updateHRVMetrics,
    getCurrentHRVMetrics,
    updateTimeSeriesData,
  ]);

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
          <BiometricDisplay
            data={currentData}
            dataHistory={dataHistory}
            heartRate={heartRate}
            heartRateHistory={heartRateHistory}
            heartRateConfidence={0}
            signalQuality={0}
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
