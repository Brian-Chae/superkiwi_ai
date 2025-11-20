import React from 'react';
import { TimerController } from '../components/Timer/TimerController';

export const Timer: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          타이머
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          집중 작업 시간을 측정하고 관리하세요
        </p>
      </div>
      <TimerController />
    </div>
  );
};

