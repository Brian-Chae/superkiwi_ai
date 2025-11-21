import { useState, useRef, useCallback } from 'react';
import type { TimeSeriesData, HeadPose } from '../types/biometric';
import { MAX_DATA_POINTS, TIME_SERIES_UPDATE_INTERVAL } from '../constants/biometric';

/**
 * 시계열 데이터 관리 훅
 */
export const useTimeSeriesData = () => {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData>({
    timestamps: [],
    earValues: [],
    smileLevels: [],
    headYaw: [],
    mouthOpen: [],
    eyebrowHeight: [],
    headRoll: [],
    headPitch: [],
  });

  const lastTimeSeriesUpdateRef = useRef<number>(0);

  /**
   * 시계열 데이터 업데이트
   */
  const updateTimeSeriesData = useCallback((
    earValue: number,
    smileLevel: number,
    headPose: HeadPose,
    mouthOpenRatio: number,
    eyebrowHeight: number
  ) => {
    const currentTime = Date.now();
    
    if (currentTime - lastTimeSeriesUpdateRef.current >= TIME_SERIES_UPDATE_INTERVAL) {
      lastTimeSeriesUpdateRef.current = currentTime;

      setTimeSeriesData(prev => {
        const newTimestamps = [...prev.timestamps, currentTime];
        const newEarValues = [...prev.earValues, earValue];
        const newSmileLevels = [...prev.smileLevels, smileLevel];
        const newHeadYaw = [...prev.headYaw, headPose.yaw];
        const newMouthOpen = [...prev.mouthOpen, mouthOpenRatio];
        const newEyebrowHeight = [...prev.eyebrowHeight, eyebrowHeight];
        const newHeadRoll = [...prev.headRoll, headPose.roll];
        const newHeadPitch = [...prev.headPitch, headPose.pitch];

        if (newTimestamps.length > MAX_DATA_POINTS) {
          newTimestamps.shift();
          newEarValues.shift();
          newSmileLevels.shift();
          newHeadYaw.shift();
          newMouthOpen.shift();
          newEyebrowHeight.shift();
          newHeadRoll.shift();
          newHeadPitch.shift();
        }

        return {
          timestamps: newTimestamps,
          earValues: newEarValues,
          smileLevels: newSmileLevels,
          headYaw: newHeadYaw,
          mouthOpen: newMouthOpen,
          eyebrowHeight: newEyebrowHeight,
          headRoll: newHeadRoll,
          headPitch: newHeadPitch,
        };
      });
    }
  }, []);

  /**
   * 시계열 데이터 초기화
   */
  const resetTimeSeriesData = useCallback(() => {
    setTimeSeriesData({
      timestamps: [],
      earValues: [],
      smileLevels: [],
      headYaw: [],
      mouthOpen: [],
      eyebrowHeight: [],
      headRoll: [],
      headPitch: [],
    });
    lastTimeSeriesUpdateRef.current = 0;
  }, []);

  return {
    timeSeriesData,
    updateTimeSeriesData,
    resetTimeSeriesData,
  };
};

