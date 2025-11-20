import React from 'react';
import type { TimerSession } from '../../state/useTimerStore';

interface SessionReportProps {
  session: TimerSession;
  onClose: () => void;
  onSaveToCanvas?: () => void;
}

export const SessionReport: React.FC<SessionReportProps> = ({
  session,
  onClose,
  onSaveToCanvas,
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Session Report</h2>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatDuration(session.duration)}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Focus</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {(session.avgFocusScore * 100).toFixed(1)}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Max Focus</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {(session.maxFocusScore * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Min Focus</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                {(session.minFocusScore * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Focus Trend</div>
            <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded p-2">
              {/* 간단한 그래프는 나중에 구현 */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {session.focusHistory.length} data points
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          {onSaveToCanvas && (
            <button
              onClick={onSaveToCanvas}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save to Canvas
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

