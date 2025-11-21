import React, { memo } from 'react';

interface HeartRateCardProps {
  heartRate: number;
  heartRateHistory: number[];
  heartRateConfidence: number;
  signalQuality: number;
  isHeartRateReady: boolean;
}

/**
 * 심박수 카드 컴포넌트
 */
export const HeartRateCard: React.FC<HeartRateCardProps> = memo(({
  heartRate,
  heartRateHistory,
  heartRateConfidence,
  signalQuality,
  isHeartRateReady,
}) => {
  return (
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
  );
});

