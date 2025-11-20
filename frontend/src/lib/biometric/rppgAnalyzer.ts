/**
 * rPPG (Remote Photoplethysmography) 심박수 분석
 * 카메라 기반 심박수 측정
 */

import { fft } from 'fft-js';

const BUFFER_SIZE = 300; // 30 FPS * 10초
const MIN_HR = 45; // 최소 심박수 (BPM)
const MAX_HR = 180; // 최대 심박수 (BPM)
const MIN_FREQ = MIN_HR / 60; // 0.75 Hz
const MAX_FREQ = MAX_HR / 60; // 3.0 Hz

interface RGBSignal {
  r: number[];
  g: number[];
  b: number[];
  timestamp: number[];
}

export class RPPGAnalyzer {
  private rgbBuffer: RGBSignal = {
    r: [],
    g: [],
    b: [],
    timestamp: [],
  };

  /**
   * ROI 영역에서 RGB 신호 추출
   */
  extractROISignal(
    video: HTMLVideoElement,
    landmarks: any[]
  ): { r: number; g: number; b: number } | null {
    if (!landmarks || landmarks.length < 468) return null;

    // 이마 영역 ROI (랜드마크 인덱스)
    const foreheadIndices = [10, 151, 9, 10, 337, 299, 333, 298, 301];
    const cheekIndices = [116, 117, 118, 119, 120, 121, 126, 142, 36, 205, 206, 207, 213, 192, 147, 187, 207, 216, 212, 202];

    // ROI 영역 계산
    const roiPoints = [
      ...foreheadIndices.map((idx) => landmarks[idx]),
      ...cheekIndices.map((idx) => landmarks[idx]),
    ].filter(Boolean);

    if (roiPoints.length === 0) return null;

    // ROI 바운딩 박스
    const minX = Math.min(...roiPoints.map((p) => p.x));
    const maxX = Math.max(...roiPoints.map((p) => p.x));
    const minY = Math.min(...roiPoints.map((p) => p.y));
    const maxY = Math.max(...roiPoints.map((p) => p.y));

    // Canvas에서 ROI 영역 색상 추출
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0);
      
      const x = Math.floor(minX * canvas.width);
      const y = Math.floor(minY * canvas.height);
      const width = Math.max(1, Math.floor((maxX - minX) * canvas.width));
      const height = Math.max(1, Math.floor((maxY - minY) * canvas.height));

      const imageData = ctx.getImageData(x, y, width, height);

      // 평균 RGB 계산
      let r = 0, g = 0, b = 0;
      const pixelCount = imageData.data.length / 4;
      if (pixelCount === 0) return null;

      for (let i = 0; i < imageData.data.length; i += 4) {
        r += imageData.data[i];
        g += imageData.data[i + 1];
        b += imageData.data[i + 2];
      }

      return {
        r: r / pixelCount,
        g: g / pixelCount,
        b: b / pixelCount,
      };
    } catch (error) {
      console.error('ROI extraction error:', error);
      return null;
    }
  }

  /**
   * RGB 신호 추가
   */
  addSignal(rgb: { r: number; g: number; b: number }, timestamp: number) {
    this.rgbBuffer.r.push(rgb.r);
    this.rgbBuffer.g.push(rgb.g);
    this.rgbBuffer.b.push(rgb.b);
    this.rgbBuffer.timestamp.push(timestamp);

    // 버퍼 크기 제한
    if (this.rgbBuffer.r.length > BUFFER_SIZE) {
      this.rgbBuffer.r.shift();
      this.rgbBuffer.g.shift();
      this.rgbBuffer.b.shift();
      this.rgbBuffer.timestamp.shift();
    }
  }

  /**
   * 심박수 계산 (BPM)
   */
  calculateHeartRate(): number | null {
    if (this.rgbBuffer.r.length < BUFFER_SIZE) {
      return null; // 버퍼가 아직 채워지지 않음
    }

    // Green 채널 사용 (가장 강한 신호)
    const signal = this.rgbBuffer.g;

    if (signal.length === 0) {
      return null;
    }

    // 트렌드 제거 (선형 디트렌딩)
    const detrended = this.detrend(signal);

    // 대역통과 필터 (0.75 Hz ~ 3.0 Hz)
    const filtered = this.bandpassFilter(detrended);

    if (filtered.length === 0) {
      return null;
    }

    // FFT는 2의 거듭제곱 길이를 요구할 수 있으므로, 가장 가까운 2의 거듭제곱으로 패딩
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(filtered.length)));
    const paddedSignal = [...filtered];
    while (paddedSignal.length < nextPowerOfTwo) {
      paddedSignal.push(0);
    }

    try {
      // FFT 분석
      const fftResult = fft(paddedSignal);
      
      if (!fftResult || !Array.isArray(fftResult) || fftResult.length === 0) {
        return null;
      }

      const magnitudes = fftResult.map((c) => {
        if (!Array.isArray(c) || c.length < 2) {
          return 0;
        }
        return Math.sqrt(c[0] ** 2 + c[1] ** 2);
      });

      // 주파수 범위 내에서 최대값 찾기
      const sampleRate = 30; // 30 FPS
      const nyquist = sampleRate / 2;
      const binSize = sampleRate / paddedSignal.length;

      let maxMagnitude = 0;
      let peakFreq = 0;

      for (let i = 0; i < magnitudes.length; i++) {
        const freq = i * binSize;
        if (freq >= MIN_FREQ && freq <= MAX_FREQ) {
          if (magnitudes[i] > maxMagnitude) {
            maxMagnitude = magnitudes[i];
            peakFreq = freq;
          }
        }
      }

      if (peakFreq === 0) return null;

      // BPM 변환
      const bpm = Math.round(peakFreq * 60);
      return Math.max(MIN_HR, Math.min(MAX_HR, bpm));
    } catch (error) {
      console.error('FFT calculation error:', error);
      return null;
    }
  }

  /**
   * 선형 디트렌딩
   */
  private detrend(signal: number[]): number[] {
    const n = signal.length;
    const mean = signal.reduce((a, b) => a + b, 0) / n;
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = x.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (signal[i] - mean);
      denominator += (x[i] - xMean) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = mean - slope * xMean;

    return signal.map((val, i) => val - (slope * i + intercept));
  }

  /**
   * 대역통과 필터 (Butterworth 2차)
   */
  private bandpassFilter(signal: number[]): number[] {
    // 간단한 이동 평균 필터 (실제로는 Butterworth 필터 사용 권장)
    const filtered: number[] = [];
    const windowSize = 5;

    for (let i = 0; i < signal.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(signal.length, i + Math.ceil(windowSize / 2));
      const window = signal.slice(start, end);
      const avg = window.reduce((a, b) => a + b, 0) / window.length;
      filtered.push(avg);
    }

    return filtered;
  }

  /**
   * 버퍼 초기화
   */
  reset() {
    this.rgbBuffer = {
      r: [],
      g: [],
      b: [],
      timestamp: [],
    };
  }

  /**
   * 버퍼 준비 상태 확인
   */
  isReady(): boolean {
    return this.rgbBuffer.r.length >= BUFFER_SIZE;
  }
}

