import React, { memo } from 'react';
import type { TimeSeriesData, HeadPose } from '../../types/biometric';
import { MAX_DATA_POINTS } from '../../constants/biometric';

interface BiometricGraphsProps {
  timeSeriesData: TimeSeriesData;
  earValue: number;
  headPose?: HeadPose;
}

/**
 * 생체 인식 그래프 컴포넌트
 */
export const BiometricGraphs: React.FC<BiometricGraphsProps> = memo(({
  timeSeriesData,
  earValue,
  headPose,
}) => {
  return (
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
                    const clampedValue = Math.max(0.4, Math.min(0.8, value));
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
            <div className="absolute bottom-0 right-0 text-[10px] text-gray-500">현재: {headPose?.roll || 0}°</div>
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
            <div className="absolute bottom-0 right-0 text-[10px] text-gray-500">현재: {headPose?.yaw || 0}°</div>
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
            <div className="absolute bottom-0 right-0 text-[10px] text-gray-500">현재: {headPose?.pitch || 0}°</div>
          </div>
        </div>
      </div>
    </div>
  );
});

