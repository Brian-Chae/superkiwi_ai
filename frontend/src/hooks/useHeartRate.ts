import { useState, useRef, useCallback } from 'react';
import { RPPGAnalyzer } from '../lib/biometric/rppgAnalyzer';
import { HEART_RATE_UPDATE_INTERVAL } from '../constants/biometric';
import type { Landmark } from '../types/biometric';

/**
 * 심박수 측정 및 관리 훅
 */
export const useHeartRate = () => {
  const rppgAnalyzer = useRef(new RPPGAnalyzer());
  const lastHeartRateTime = useRef<number>(0);
  const lastHeartRate = useRef<number | null>(null);
  const heartRateAccumulatorRef = useRef<number[]>([]);
  const [heartRate, setHeartRate] = useState<number>(0);
  const [isHeartRateReady, setIsHeartRateReady] = useState(false);
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([]);

  /**
   * rPPG 신호 처리 및 심박수 계산
   */
  const processHeartRate = useCallback((
    video: HTMLVideoElement,
    landmarks: Landmark[],
    timestamp: number
  ) => {
    const rgbSignal = rppgAnalyzer.current.extractROISignal(video, landmarks);
    if (rgbSignal) {
      rppgAnalyzer.current.addSignal(rgbSignal, timestamp);
      const calculatedHeartRate = rppgAnalyzer.current.calculateHeartRate();
      if (calculatedHeartRate !== null) {
        lastHeartRate.current = calculatedHeartRate;
        lastHeartRateTime.current = timestamp;
        heartRateAccumulatorRef.current.push(calculatedHeartRate);
      }
    }
  }, []);

  /**
   * 평균 심박수 업데이트 (1초마다)
   */
  const updateAverageHeartRate = useCallback(() => {
    const currentTime = Date.now();
    if (currentTime - lastHeartRateTime.current >= HEART_RATE_UPDATE_INTERVAL) {
      lastHeartRateTime.current = currentTime;

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
  }, []);

  /**
   * 현재 심박수 반환
   */
  const getCurrentHeartRate = useCallback(() => {
    return lastHeartRate.current;
  }, []);

  /**
   * 심박수 데이터 초기화
   */
  const resetHeartRate = useCallback(() => {
    setHeartRate(0);
    setIsHeartRateReady(false);
    setHeartRateHistory([]);
    lastHeartRate.current = null;
    lastHeartRateTime.current = 0;
    heartRateAccumulatorRef.current = [];
    rppgAnalyzer.current = new RPPGAnalyzer();
  }, []);

  return {
    heartRate,
    isHeartRateReady,
    heartRateHistory,
    processHeartRate,
    updateAverageHeartRate,
    getCurrentHeartRate,
    resetHeartRate,
  };
};

