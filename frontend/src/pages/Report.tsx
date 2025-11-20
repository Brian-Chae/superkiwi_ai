import React, { useState, useMemo } from 'react';
import { useBlocksStore } from '../state/useBlocksStore';
import { useFocusStore } from '../state/useFocusStore';
import { FiCalendar, FiClock, FiTrendingUp, FiActivity } from 'react-icons/fi';

type ViewMode = 'day' | 'week' | 'month';

export const Report: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const { blocks } = useBlocksStore();
  const { focusHistory, averageFocus } = useFocusStore();

  // 날짜 범위 계산
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);

    switch (viewMode) {
      case 'day':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(start.getDate() - start.getDay()); // 이번 주 월요일
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }

    return { start, end };
  }, [viewMode]);

  // 필터링된 블록들
  const filteredBlocks = useMemo(() => {
    return blocks.filter((block) => {
      const blockStart = new Date(block.start);
      return blockStart >= dateRange.start && blockStart <= dateRange.end;
    });
  }, [blocks, dateRange]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalDuration = filteredBlocks.reduce((sum, block) => {
      const start = new Date(block.start);
      const end = new Date(block.end);
      return sum + (end.getTime() - start.getTime());
    }, 0);

    const deepWorkBlocks = filteredBlocks.filter((b) => b.type === 'deepwork');
    const deepWorkDuration = deepWorkBlocks.reduce((sum, block) => {
      const start = new Date(block.start);
      const end = new Date(block.end);
      return sum + (end.getTime() - start.getTime());
    }, 0);

    const avgFocus = focusHistory.length > 0
      ? focusHistory.reduce((sum, f) => sum + f.focusScore, 0) / focusHistory.length
      : averageFocus;

    return {
      totalBlocks: filteredBlocks.length,
      totalHours: totalDuration / (1000 * 60 * 60),
      deepWorkHours: deepWorkDuration / (1000 * 60 * 60),
      averageFocus: avgFocus,
      deepWorkBlocks: deepWorkBlocks.length,
    };
  }, [filteredBlocks, focusHistory, averageFocus]);

  const formatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          리포트
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          생산성 데이터를 분석하고 통계를 확인하세요
        </p>
      </div>

      {/* 뷰 모드 선택 */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setViewMode('day')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'day'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          일별
        </button>
        <button
          onClick={() => setViewMode('week')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'week'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          주간별
        </button>
        <button
          onClick={() => setViewMode('month')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'month'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          월별
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">총 작업 시간</div>
            <FiClock className="text-blue-500 text-xl" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatHours(stats.totalHours)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">Deep Work 시간</div>
            <FiActivity className="text-purple-500 text-xl" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatHours(stats.deepWorkHours)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">평균 집중도</div>
            <FiTrendingUp className="text-green-500 text-xl" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {(stats.averageFocus * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">총 블록 수</div>
            <FiCalendar className="text-orange-500 text-xl" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalBlocks}
          </div>
        </div>
      </div>

      {/* 블록 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          시간 블록 목록
        </h2>
        {filteredBlocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            선택한 기간에 블록이 없습니다
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBlocks.map((block) => {
              const start = new Date(block.start);
              const end = new Date(block.end);
              const duration = (end.getTime() - start.getTime()) / (1000 * 60);
              
              return (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {block.meta?.title || 'Untitled Block'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {start.toLocaleString('ko-KR')} - {end.toLocaleTimeString('ko-KR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {Math.floor(duration / 60)}h {Math.floor(duration % 60)}m
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      block.type === 'deepwork'
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                        : block.type === 'break'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    }`}>
                      {block.type === 'deepwork' ? 'Deep Work' : block.type === 'break' ? 'Break' : 'Meeting'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

