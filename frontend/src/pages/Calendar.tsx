import React from 'react';
import { TimeCanvasContainer } from '../components/TimeCanvas/TimeCanvasContainer';

export const Calendar: React.FC = () => {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          캘린더
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          시간 블록을 관리하고 일정을 확인하세요
        </p>
      </div>
      <TimeCanvasContainer />
    </div>
  );
};

