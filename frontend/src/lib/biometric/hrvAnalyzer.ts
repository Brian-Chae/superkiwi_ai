/**
 * HRV (Heart Rate Variability) 분석
 */

import { Time } from '@avihimsa/heart-rate-variability-analysis';

interface HRVData {
  sdnn: number;
  rmssd: number;
  pnn50: number;
  timestamp: number;
}

export class HRVAnalyzer {
  private rrIntervals: number[] = [];
  private hrvHistory: HRVData[] = [];
  private readonly windowSize = 30; // 30초 롤링 윈도우

  /**
   * RR 간격 추가 (밀리초 단위)
   */
  addRRInterval(rrInterval: number) {
    this.rrIntervals.push(rrInterval);
    
    // 30초 윈도우 유지 (평균 심박수 60 BPM 기준)
    const maxIntervals = 30; // 30초 * 1초당 1회
    if (this.rrIntervals.length > maxIntervals) {
      this.rrIntervals.shift();
    }
  }

  /**
   * HRV 메트릭 계산
   */
  calculateHRV(): HRVData | null {
    if (this.rrIntervals.length < 20) {
      return null; // 최소 20개 RR interval 필요 (레포지토리와 동일)
    }

    try {
      const sdnn = Time.SDNN(this.rrIntervals);
      const rmssd = Time.RMSSD(this.rrIntervals);
      const pnn50 = Time.PNN50(this.rrIntervals);

      const hrvData: HRVData = {
        sdnn: Math.round(sdnn * 10) / 10,
        rmssd: Math.round(rmssd * 10) / 10,
        pnn50: Math.round(pnn50 * 100 * 10) / 10, // 퍼센트
        timestamp: Date.now(),
      };

      // 히스토리 추가
      this.hrvHistory.push(hrvData);
      if (this.hrvHistory.length > this.windowSize) {
        this.hrvHistory.shift();
      }

      return hrvData;
    } catch (error) {
      console.error('HRV calculation error:', error);
      return null;
    }
  }

  /**
   * HRV 히스토리 가져오기
   */
  getHistory(): HRVData[] {
    return [...this.hrvHistory];
  }

  /**
   * 초기화
   */
  reset() {
    this.rrIntervals = [];
    this.hrvHistory = [];
  }
}

