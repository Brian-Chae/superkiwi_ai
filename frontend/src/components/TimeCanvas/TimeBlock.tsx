import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TimeBlock as TimeBlockType } from '../../state/useBlocksStore';
import { timeToPixels, getDurationMinutes, pixelsToTime } from '../../lib/time/timeUtils';

interface TimeBlockProps {
  block: TimeBlockType;
  onSelect?: (block: TimeBlockType) => void;
  onDragEnd?: (newStart: string, newEnd: string) => void;
  onResizeEnd?: (newStart: string, newEnd: string) => void;
  isSelected?: boolean;
}

const blockColors = {
  deepwork: 'bg-blue-500 dark:bg-blue-600',
  break: 'bg-green-500 dark:bg-green-600',
  meeting: 'bg-purple-500 dark:bg-purple-600',
};

const blockBorders = {
  deepwork: 'border-blue-600 dark:border-blue-700',
  break: 'border-green-600 dark:border-green-700',
  meeting: 'border-purple-600 dark:border-purple-700',
};

export const TimeBlockComponent: React.FC<TimeBlockProps> = ({
  block,
  onSelect,
  onDragEnd,
  onResizeEnd,
  isSelected = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialTop, setInitialTop] = useState(0);
  const blockRef = useRef<HTMLDivElement>(null);

  const startPixels = timeToPixels(block.start.split('T')[1]?.split('.')[0] || '00:00');
  const duration = getDurationMinutes(block.start, block.end);
  const height = (duration / 60) * 100; // pixelsPerHour = 100

  const colorClass = blockColors[block.type] || blockColors.deepwork;
  const borderClass = blockBorders[block.type] || blockBorders.deepwork;

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!blockRef.current) return;
      const container = blockRef.current.closest('.time-canvas-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const y = e.clientY - containerRect.top;

      if (isDragging) {
        const newY = Math.max(0, Math.min(y - dragStartY + initialTop, 24 * 100 - height));
        blockRef.current.style.top = `${newY}px`;
      } else if (isResizing === 'start') {
        const newY = Math.max(0, Math.min(y, initialTop + height - 20));
        const newHeight = initialTop + height - newY;
        blockRef.current.style.top = `${newY}px`;
        blockRef.current.style.height = `${Math.max(20, newHeight)}px`;
      } else if (isResizing === 'end') {
        const newHeight = Math.max(20, y - initialTop);
        blockRef.current.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDragging && blockRef.current && onDragEnd) {
        const top = parseFloat(blockRef.current.style.top);
        const newTime = pixelsToTime(top);
        const today = new Date(block.start);
        today.setHours(parseInt(newTime.split(':')[0]), parseInt(newTime.split(':')[1]), 0, 0);
        const newStart = today.toISOString();
        const newEnd = new Date(today.getTime() + duration * 60 * 1000).toISOString();
        onDragEnd(newStart, newEnd);
      }
      if (isResizing && blockRef.current && onResizeEnd) {
        const top = parseFloat(blockRef.current.style.top);
        const height = parseFloat(blockRef.current.style.height);
        const startTime = pixelsToTime(top);
        const endTime = pixelsToTime(top + height);
        
        const today = new Date(block.start);
        today.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0, 0);
        const newStart = today.toISOString();
        
        const endDate = new Date(block.start);
        endDate.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]), 0, 0);
        const newEnd = endDate.toISOString();
        
        onResizeEnd(newStart, newEnd);
      }
      setIsDragging(false);
      setIsResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStartY, initialTop, height, duration, block.start, onDragEnd, onResizeEnd]);

  const handleMouseDown = (e: React.MouseEvent, resizeType?: 'start' | 'end') => {
    if (resizeType) {
      e.stopPropagation();
      setIsResizing(resizeType);
      if (blockRef.current) {
        setInitialTop(parseFloat(blockRef.current.style.top) || startPixels);
      }
    } else {
      setIsDragging(true);
      if (blockRef.current) {
        const rect = blockRef.current.getBoundingClientRect();
        const container = blockRef.current.closest('.time-canvas-container');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          setDragStartY(e.clientY - containerRect.top);
          setInitialTop(parseFloat(blockRef.current.style.top) || startPixels);
        }
      }
    }
  };

  return (
    <motion.div
      ref={blockRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isDragging || isResizing ? 0.7 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`absolute left-16 right-4 rounded-lg border-2 ${colorClass} ${borderClass} ${
        isSelected ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : ''
      } ${isDragging || isResizing ? 'cursor-grabbing z-50' : 'cursor-move'} hover:opacity-90 transition-opacity shadow-md`}
      style={{
        top: `${startPixels}px`,
        height: `${height}px`,
        minHeight: '20px',
      }}
      onClick={() => onSelect?.(block)}
      onMouseDown={(e) => handleMouseDown(e)}
    >
      {/* Resize handles */}
      <div
        className="absolute top-0 left-0 right-0 h-2 bg-transparent hover:bg-white/20 cursor-ns-resize"
        onMouseDown={(e) => handleMouseDown(e, 'start')}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-2 bg-transparent hover:bg-white/20 cursor-ns-resize"
        onMouseDown={(e) => handleMouseDown(e, 'end')}
      />
      
      <div className="p-2 h-full flex flex-col justify-between pointer-events-none">
        <div className="text-white text-sm font-semibold">
          {block.meta?.title || block.type}
        </div>
        {block.meta?.tags && block.meta.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {block.meta.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

