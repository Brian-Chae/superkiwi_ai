import React, { useState, useEffect } from 'react';
import { timeToPixels, dateToTimeString } from '../../lib/time/timeUtils';

interface NowIndicatorProps {
  pixelsPerHour?: number;
}

export const NowIndicator: React.FC<NowIndicatorProps> = ({ pixelsPerHour = 100 }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();
  
  // 오늘이 아니면 표시하지 않음
  if (now.toDateString() !== today.toDateString()) {
    return null;
  }

  const timeString = dateToTimeString(now);
  const position = timeToPixels(timeString);

  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{ top: `${position}px` }}
    >
      <div className="flex items-center">
        <div className="h-0.5 w-full bg-red-500 dark:bg-red-400" />
        <div className="ml-2 px-2 py-0.5 bg-red-500 dark:bg-red-400 text-white text-xs rounded">
          {timeString}
        </div>
      </div>
    </div>
  );
};

