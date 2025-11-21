import React from 'react';
import type { EnhancedBiometricData, TimeSeriesData, HRVMetrics } from '../../types/biometric';
import { HeartRateCard } from './HeartRateCard';
import { HRVCard } from './HRVCard';
import { BiometricGraphs } from './BiometricGraphs';
import { BiometricStats } from './BiometricStats';
import { BlendShapeDisplay } from './BlendShapeDisplay';

interface BiometricDisplayProps {
  data: EnhancedBiometricData;
  dataHistory: EnhancedBiometricData[];
  heartRate: number;
  heartRateHistory: number[];
  heartRateConfidence: number;
  signalQuality: number;
  isHeartRateReady: boolean;
  hrvMetrics: HRVMetrics | null;
  hrvStressHistory: number[];
  timeSeriesData: TimeSeriesData;
  earValue: number;
  showLandmarks: boolean;
  showConnectors: boolean;
  onToggleLandmarks: () => void;
  onToggleConnectors: () => void;
}

/**
 * 생체 인식 데이터 표시 컴포넌트
 */
export const BiometricDisplay: React.FC<BiometricDisplayProps> = ({
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
        <HeartRateCard
          heartRate={heartRate}
          heartRateHistory={heartRateHistory}
          heartRateConfidence={heartRateConfidence}
          signalQuality={signalQuality}
          isHeartRateReady={isHeartRateReady}
        />
        <HRVCard
          hrvMetrics={hrvMetrics}
          hrvStressHistory={hrvStressHistory}
        />
      </div>

      {/* 실시간 그래프 */}
      <BiometricGraphs
        timeSeriesData={timeSeriesData}
        earValue={earValue}
        headPose={data.headPose}
      />

      {/* 통계 및 기타 정보 */}
      <BiometricStats
        data={data}
        earValue={earValue}
      />

      {/* BlendShapes 데이터 */}
      {data.blendshapes && (
        <BlendShapeDisplay blendshapes={data.blendshapes} />
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

