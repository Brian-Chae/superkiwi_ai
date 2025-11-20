import React from 'react';
import { Recommendation } from '../../lib/ai/recommendationEngine';

interface SuggestionBannerProps {
  recommendations: Recommendation[];
  onDismiss: (index: number) => void;
}

const priorityColors = {
  low: 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700',
  medium: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700',
  high: 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700',
};

const priorityTextColors = {
  low: 'text-blue-800 dark:text-blue-200',
  medium: 'text-yellow-800 dark:text-yellow-200',
  high: 'text-red-800 dark:text-red-200',
};

export const SuggestionBanner: React.FC<SuggestionBannerProps> = ({
  recommendations,
  onDismiss,
}) => {
  if (recommendations.length === 0) return null;

  // 우선순위가 높은 순으로 정렬
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <div className="space-y-2">
      {sortedRecommendations.map((rec, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border ${priorityColors[rec.priority]} ${priorityTextColors[rec.priority]}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold mb-1">{rec.message}</div>
              <div className="text-xs opacity-75">
                {rec.type === 'break-suggestion' && '💤 휴식'}
                {rec.type === 'extend-deepwork' && '⏱️ 연장'}
                {rec.type === 'return-to-task' && '🔄 복귀'}
                {rec.type === 'meeting-prep' && '📅 미팅 준비'}
              </div>
            </div>
            <button
              onClick={() => onDismiss(index)}
              className="ml-4 text-lg opacity-75 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

