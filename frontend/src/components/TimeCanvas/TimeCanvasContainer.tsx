import React, { useState } from 'react';
import { useBlocksStore } from '../../state/useBlocksStore';
import type { TimeBlock } from '../../state/useBlocksStore';
import { HourGrid } from './HourGrid';
import { NowIndicator } from './NowIndicator';
import { TimeBlockComponent } from './TimeBlock';
import { BlockEditModal } from './BlockEditModal';
import { getTodayStartISO, getTodayEndISO } from '../../lib/time/timeUtils';
import { isBlockOverlapping, validateBlock } from '../../lib/time/blockManager';

export const TimeCanvasContainer: React.FC = () => {
  const { blocks, addBlock, updateBlock, deleteBlock } = useBlocksStore();
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);

  // 오늘 날짜의 블록만 필터링
  const todayStart = getTodayStartISO();
  const todayEnd = getTodayEndISO();
  
  const todayBlocks = blocks.filter((block) => {
    return block.start >= todayStart && block.start < todayEnd;
  });

  const handleBlockSelect = (block: TimeBlock) => {
    setSelectedBlock(block);
  };

  const handleAddBlock = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000); // 1시간 후
    
    const newBlock = {
      type: 'deepwork' as const,
      start: now.toISOString(),
      end: end.toISOString(),
      meta: {
        title: 'New Block',
      },
    };

    const validation = validateBlock(newBlock);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    if (isBlockOverlapping(todayBlocks, newBlock)) {
      alert('이 시간대에 이미 블록이 있습니다');
      return;
    }
    
    addBlock(newBlock);
  };

  const handleBlockDragEnd = (blockId: string, newStart: string, newEnd: string) => {
    const validation = validateBlock({ type: 'deepwork', start: newStart, end: newEnd });
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const block = todayBlocks.find(b => b.id === blockId);
    if (!block) return;

    if (isBlockOverlapping(todayBlocks, { ...block, start: newStart, end: newEnd }, blockId)) {
      alert('이 시간대에 이미 블록이 있습니다');
      return;
    }

    updateBlock(blockId, { start: newStart, end: newEnd });
  };

  const handleBlockResizeEnd = (blockId: string, newStart: string, newEnd: string) => {
    const validation = validateBlock({ type: 'deepwork', start: newStart, end: newEnd });
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const block = todayBlocks.find(b => b.id === blockId);
    if (!block) return;

    if (isBlockOverlapping(todayBlocks, { ...block, start: newStart, end: newEnd }, blockId)) {
      alert('이 시간대에 이미 블록이 있습니다');
      return;
    }

    updateBlock(blockId, { start: newStart, end: newEnd });
  };

  return (
    <div className="w-full h-screen bg-white dark:bg-gray-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Time Canvas
        </h1>
        <button
          onClick={handleAddBlock}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Add Block
        </button>
      </div>

      <div className="relative border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 time-canvas-container">
        <div
          className="relative"
          style={{
            height: `${24 * 100}px`, // 24시간 * 100px
            minHeight: '600px',
          }}
        >
          <HourGrid />
          <NowIndicator />
          
          {todayBlocks.map((block) => (
            <TimeBlockComponent
              key={block.id}
              block={block}
              onSelect={handleBlockSelect}
              onDragEnd={(newStart, newEnd) => handleBlockDragEnd(block.id, newStart, newEnd)}
              onResizeEnd={(newStart, newEnd) => handleBlockResizeEnd(block.id, newStart, newEnd)}
              isSelected={selectedBlock?.id === block.id}
            />
          ))}
        </div>
      </div>

      <BlockEditModal
        block={selectedBlock}
        onClose={() => setSelectedBlock(null)}
        onSave={(updates) => {
          if (selectedBlock) {
            updateBlock(selectedBlock.id, updates);
            setSelectedBlock(null);
          }
        }}
        onDelete={() => {
          if (selectedBlock) {
            deleteBlock(selectedBlock.id);
            setSelectedBlock(null);
          }
        }}
      />
    </div>
  );
};

