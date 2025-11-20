import React, { useRef, useEffect } from 'react';
import type { EnhancedBiometricData } from './EnhancedBiometricAgent';

interface BiometricGraphProps {
  data: EnhancedBiometricData[];
  type: 'heartRate' | 'focusScore' | 'ear' | 'hrv';
  width?: number;
  height?: number;
  color?: string;
}

/**
 * 생체신호 데이터를 그래프로 표시하는 컴포넌트
 */
export const BiometricGraph: React.FC<BiometricGraphProps> = ({
  data,
  type,
  width = 300,
  height = 100,
  color = '#3b82f6',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // 배경 지우기
    ctx.clearRect(0, 0, width, height);

    // 최근 30개 데이터만 표시
    const recentData = data.slice(-30);
    if (recentData.length < 2) return;

    // 값 추출
    const values = recentData.map((d) => {
      switch (type) {
        case 'heartRate':
          return d.heartRate || 0;
        case 'focusScore':
          return d.focusScore * 100;
        case 'ear':
          return (d.ear || 0) * 100;
        case 'hrv':
          return d.hrv?.sdnn || 0;
        default:
          return 0;
      }
    }).filter(v => v > 0); // 0보다 큰 값만 사용

    if (values.length === 0) return;

    // 최소/최대값 계산
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // 그리드 그리기
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 그래프 그리기
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    let firstPoint = true;
    values.forEach((value, index) => {
      const x = (width / (values.length - 1)) * index;
      const normalizedValue = (value - minValue) / range;
      const y = height - (normalizedValue * height * 0.8) - height * 0.1;

      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // 현재 값 표시
    if (values.length > 0) {
      const lastValue = values[values.length - 1];
      ctx.fillStyle = color;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(
        `${lastValue.toFixed(type === 'heartRate' ? 0 : 1)}${type === 'heartRate' ? ' BPM' : type === 'focusScore' || type === 'ear' ? '%' : ' ms'}`,
        width - 5,
        15
      );
    }
  }, [data, type, width, height, color]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width, height }}
      />
    </div>
  );
};

