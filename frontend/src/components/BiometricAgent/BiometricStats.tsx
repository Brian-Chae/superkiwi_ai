import React, { memo, useRef, useEffect, useState } from 'react';
import type { EnhancedBiometricData } from '../../types/biometric';

interface BiometricStatsProps {
  data: EnhancedBiometricData;
  earValue: number;
}

/**
 * 생체 인식 통계 패널 컴포넌트
 */
export const BiometricStats: React.FC<BiometricStatsProps> = memo(({ data, earValue }) => {
  // 측정 시작 시간 추적 (첫 번째 얼굴 감지 시점)
  const measurementStartTimeRef = useRef<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);

  // 첫 번째 얼굴 감지 시점 기록
  useEffect(() => {
    if (data.faceDetected && measurementStartTimeRef.current === null) {
      measurementStartTimeRef.current = Date.now();
    }
  }, [data.faceDetected]);

  // 경과 시간 업데이트 (1초마다)
  useEffect(() => {
    if (measurementStartTimeRef.current === null) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - measurementStartTimeRef.current!) / 1000; // 초 단위
      setTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 초기화 중인지 확인 (1분 = 60초)
  const INITIALIZATION_DURATION = 60; // 초
  const isInitializing = measurementStartTimeRef.current !== null && timeElapsed < INITIALIZATION_DURATION;
  const remainingTime = isInitializing ? Math.ceil(INITIALIZATION_DURATION - timeElapsed) : 0;
  return (
    <>
      {/* 통계 패널 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Eye Blinking Rate</div>
          {isInitializing ? (
            <>
              <div className="flex items-center gap-2 mt-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div className="text-lg font-semibold text-blue-600">초기화중...</div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                남은 시간: {remainingTime}초
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeElapsed / INITIALIZATION_DURATION) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-blue-600">
                {data.blinkRate.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">blinks/min</div>
            </>
          )}
        </div>
      </div>

      {/* EAR 실시간 모니터링 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="text-sm text-gray-700 mb-2">👁️ Eye Aspect Ratio (EAR) 실시간 모니터링</div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="bg-gray-200 rounded-full h-4 relative overflow-hidden">
              {(() => {
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
    </>
  );
});

