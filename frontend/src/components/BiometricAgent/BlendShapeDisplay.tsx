import React, { memo } from 'react';
import type { BlendShapes } from '../../types/biometric';
import { ALL_BLEND_SHAPES } from '../../constants/biometric';

interface BlendShapeDisplayProps {
  blendshapes: BlendShapes | null;
}

/**
 * BlendShape 표시 컴포넌트
 */
export const BlendShapeDisplay: React.FC<BlendShapeDisplayProps> = memo(({ blendshapes }) => {
  if (!blendshapes || !blendshapes.categories) {
    return null;
  }

  // 현재 BlendShape 값들을 맵으로 변환
  const currentScores: { [key: string]: number } = {};
  blendshapes.categories.forEach((shape) => {
    const key = shape.displayName || shape.categoryName;
    currentScores[key] = shape.score;
  });

  return (
    <div className="mt-4 bg-indigo-50 rounded-lg p-4">
      <div className="text-sm text-gray-700 mb-3 font-semibold">🎭 표정 세부 데이터 (전체 52개)</div>
      <div className="grid grid-cols-4 gap-x-3 gap-y-1">
        {ALL_BLEND_SHAPES.map((item) => {
          const score = currentScores[item.key] || 0;
          const isActive = score > 0.05;

          return (
            <div key={item.key} className="text-xs">
              <div className="flex justify-between items-center">
                <span className={`truncate text-[9px] ${isActive ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                  {item.name}
                </span>
                <span className={`ml-1 text-[9px] ${isActive ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                  {(score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-0.5 mt-0.5">
                <div
                  className={`h-0.5 rounded-full transition-all duration-200 ${
                    isActive ? 'bg-indigo-500' : 'bg-gray-300'
                  }`}
                  style={{ width: `${score * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

