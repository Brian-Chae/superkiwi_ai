import { useState, useRef, useCallback } from 'react';
import { HRVAnalyzer } from '../lib/biometric/hrvAnalyzer';
import { HRV_UPDATE_INTERVAL } from '../constants/biometric';
import type { HRVMetrics } from '../types/biometric';

/**
 * HRV (Heart Rate Variability) 분석 및 관리 훅
 */
export const useHRV = () => {
  const hrvAnalyzer = useRef(new HRVAnalyzer());
  const lastHrvUpdateRef = useRef<number>(0);
  const lastHrvDataRef = useRef<HRVMetrics | null>(null);
  const [hrvMetrics, setHrvMetrics] = useState<HRVMetrics | null>(null);
  const [hrvStressHistory, setHrvStressHistory] = useState<number[]>([]);

  /**
   * RR 간격 추가 (심박수로부터 계산)
   */
  const addRRInterval = useCallback((heartRate: number) => {
    const rrInterval = (60 / heartRate) * 1000;
    hrvAnalyzer.current.addRRInterval(rrInterval);
  }, []);

  /**
   * HRV 메트릭 계산 및 업데이트 (1초마다)
   */
  const updateHRVMetrics = useCallback(() => {
    const currentTime = Date.now();
    if (currentTime - lastHrvUpdateRef.current >= HRV_UPDATE_INTERVAL) {
      lastHrvUpdateRef.current = currentTime;

      const hrvData = hrvAnalyzer.current.calculateHRV();
      if (hrvData) {
        // 스트레스 지수 계산
        const stressIndex = Math.max(0, Math.min(100, 100 - (hrvData.sdnn + hrvData.rmssd) / 2));
        const hrvWithStress: HRVMetrics = {
          ...hrvData,
          stress: Math.round(stressIndex),
        };

        // HRV 상태 업데이트 (깜빡임 방지를 위해 이전 값 유지)
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
    }
  }, []);

  /**
   * 현재 HRV 메트릭 반환
   */
  const getCurrentHRVMetrics = useCallback(() => {
    return lastHrvDataRef.current;
  }, []);

  /**
   * HRV 데이터 초기화
   */
  const resetHRV = useCallback(() => {
    setHrvMetrics(null);
    setHrvStressHistory([]);
    lastHrvDataRef.current = null;
    lastHrvUpdateRef.current = 0;
    hrvAnalyzer.current = new HRVAnalyzer();
  }, []);

  return {
    hrvMetrics,
    hrvStressHistory,
    addRRInterval,
    updateHRVMetrics,
    getCurrentHRVMetrics,
    resetHRV,
  };
};

