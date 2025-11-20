import React, { useEffect, useState } from 'react';
import { useTimerStore } from '../../state/useTimerStore';
import type { TimerSession } from '../../state/useTimerStore';
import { useFocusStore } from '../../state/useFocusStore';
import { useBlocksStore } from '../../state/useBlocksStore';
import { SessionReport } from './SessionReport';

export const TimerController: React.FC = () => {
  const [completedSession, setCompletedSession] = useState<TimerSession | null>(null);
  
  const {
    isRunning,
    isPaused,
    elapsedTime,
    session,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    updateElapsedTime,
    addFocusScore,
  } = useTimerStore();

  const { currentFocus, averageFocus } = useFocusStore();
  const { addBlock } = useBlocksStore();

  // 타이머 카운트다운
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      updateElapsedTime(elapsedTime + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, elapsedTime, updateElapsedTime]);

  // Focus Score 업데이트
  useEffect(() => {
    if (isRunning && !isPaused && currentFocus) {
      addFocusScore(currentFocus.focusScore);
    }
  }, [isRunning, isPaused, currentFocus, addFocusScore]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStart = () => {
    startTimer();
  };

  const handlePause = () => {
    if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  const handleStop = () => {
    const session = stopTimer();
    if (session) {
      setCompletedSession(session);
      // 세션 완료 처리 (나중에 API 호출 등)
      console.log('Session completed:', session);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Deep Work Timer</h2>

      <div className="text-center mb-6">
        <div className="text-6xl font-mono font-bold text-gray-900 dark:text-white mb-2">
          {formatTime(elapsedTime)}
        </div>
        {session && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Average Focus: {(averageFocus * 100).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center mb-4">
        {!isRunning && !isPaused && (
          <button
            onClick={handleStart}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            Start
          </button>
        )}
        {isRunning && (
          <button
            onClick={handlePause}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        )}
        {(isRunning || isPaused) && (
          <button
            onClick={handleStop}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
          >
            Stop
          </button>
        )}
      </div>

      {currentFocus && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Focus</div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
            <div
              className="bg-blue-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${currentFocus.focusScore * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
            {(currentFocus.focusScore * 100).toFixed(1)}%
          </div>
        </div>
      )}

      {completedSession && (
        <SessionReport
          session={completedSession}
          onClose={() => setCompletedSession(null)}
          onSaveToCanvas={() => {
            if (completedSession) {
              const startDate = new Date(completedSession.startTime);
              const endDate = completedSession.endTime
                ? new Date(completedSession.endTime)
                : new Date(completedSession.startTime + completedSession.duration * 1000);

              addBlock({
                type: 'deepwork',
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                meta: {
                  title: `Deep Work Session (${(completedSession.avgFocusScore * 100).toFixed(0)}% focus)`,
                  notes: `Average Focus: ${(completedSession.avgFocusScore * 100).toFixed(1)}%\nMax Focus: ${(completedSession.maxFocusScore * 100).toFixed(1)}%\nDuration: ${Math.floor(completedSession.duration / 60)} minutes`,
                },
              });
            }
            setCompletedSession(null);
          }}
        />
      )}
    </div>
  );
};

