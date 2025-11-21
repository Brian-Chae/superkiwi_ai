import { useRef, useCallback } from 'react';

/**
 * FPS 계산 훅
 */
export const useFPS = () => {
  const fpsCounterRef = useRef<{ times: number[]; lastTime: number }>({ times: [], lastTime: 0 });

  /**
   * FPS 계산 함수
   */
  const calculateFPS = useCallback(() => {
    const now = performance.now();
    const counter = fpsCounterRef.current;

    while (counter.times.length > 0 && counter.times[0] <= now - 1000) {
      counter.times.shift();
    }
    counter.times.push(now);

    const fps = counter.times.length;
    counter.lastTime = now;

    return fps;
  }, []);

  return {
    calculateFPS,
  };
};

