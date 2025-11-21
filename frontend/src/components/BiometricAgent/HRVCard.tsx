import React, { memo } from 'react';
import type { HRVMetrics } from '../../types/biometric';

interface HRVCardProps {
  hrvMetrics: HRVMetrics | null;
  hrvStressHistory: number[];
}

/**
 * HRV 분석 카드 컴포넌트
 */
export const HRVCard: React.FC<HRVCardProps> = memo(({
  hrvMetrics,
  hrvStressHistory,
}) => {
  return (
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
  );
});

