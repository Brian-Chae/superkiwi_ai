import React, { useState, useRef, useEffect } from 'react';
import type { TimeBlock } from '../../state/useBlocksStore';
import { pixelsToTime, timeToPixels, getDurationMinutes } from '../../lib/time/timeUtils';

interface BlockDragLayerProps {
  block: TimeBlock;
  onDragEnd: (newStart: string, newEnd: string) => void;
  onResizeEnd: (newStart: string, newEnd: string) => void;
  pixelsPerHour?: number;
}

export const BlockDragLayer: React.FC<BlockDragLayerProps> = ({
  block,
  onDragEnd,
  onResizeEnd,
  pixelsPerHour = 100,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const blockRef = useRef<HTMLDivElement>(null);

  const startPixels = timeToPixels(block.start.split('T')[1]?.split('.')[0] || '00:00');
  const duration = getDurationMinutes(block.start, block.end);
  const height = (duration / 60) * pixelsPerHour;

  const handleMouseDown = (e: React.MouseEvent, resizeType?: 'start' | 'end') => {
    if (resizeType) {
      setIsResizing(resizeType);
      e.preventDefault();
    } else {
      setIsDragging(true);
      const rect = blockRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && blockRef.current) {
        const container = blockRef.current.closest('.time-canvas-container');
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const y = e.clientY - containerRect.top - dragOffset.y;
        const clampedY = Math.max(0, Math.min(y, 24 * pixelsPerHour - height));
        const newTime = pixelsToTime(clampedY);
        
        const today = new Date(block.start);
        today.setHours(parseInt(newTime.split(':')[0]), parseInt(newTime.split(':')[1]), 0, 0);
        const newStart = today.toISOString();
        const newEnd = new Date(today.getTime() + duration * 60 * 1000).toISOString();
        
        // Update block position visually (optimistic update)
        if (blockRef.current) {
          blockRef.current.style.top = `${clampedY}px`;
        }
      } else if (isResizing && blockRef.current) {
        const container = blockRef.current.closest('.time-canvas-container');
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const blockRect = blockRef.current.getBoundingClientRect();
        
        let newY: number;
        if (isResizing === 'start') {
          newY = e.clientY - containerRect.top;
          const clampedY = Math.max(0, Math.min(newY, blockRect.bottom - containerRect.top - 20));
          const newTime = pixelsToTime(clampedY);
          const today = new Date(block.start);
          today.setHours(parseInt(newTime.split(':')[0]), parseInt(newTime.split(':')[1]), 0, 0);
          const newStart = today.toISOString();
          
          if (blockRef.current) {
            const newHeight = height - (clampedY - startPixels);
            blockRef.current.style.top = `${clampedY}px`;
            blockRef.current.style.height = `${Math.max(20, newHeight)}px`;
          }
        } else {
          newY = e.clientY - containerRect.top;
          const clampedY = Math.max(blockRect.top - containerRect.top + 20, Math.min(newY, 24 * pixelsPerHour));
          const newHeight = clampedY - (blockRect.top - containerRect.top);
          
          if (blockRef.current) {
            blockRef.current.style.height = `${Math.max(20, newHeight)}px`;
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        const currentTop = blockRef.current?.style.top;
        if (currentTop) {
          const y = parseFloat(currentTop);
          const newTime = pixelsToTime(y);
          const today = new Date(block.start);
          today.setHours(parseInt(newTime.split(':')[0]), parseInt(newTime.split(':')[1]), 0, 0);
          const newStart = today.toISOString();
          const newEnd = new Date(today.getTime() + duration * 60 * 1000).toISOString();
          onDragEnd(newStart, newEnd);
        }
        setIsDragging(false);
      }
      if (isResizing) {
        const currentTop = blockRef.current?.style.top;
        const currentHeight = blockRef.current?.style.height;
        if (currentTop && currentHeight) {
          const y = parseFloat(currentTop);
          const height = parseFloat(currentHeight);
          const startTime = pixelsToTime(y);
          const endTime = pixelsToTime(y + height);
          
          const today = new Date(block.start);
          today.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0, 0);
          const newStart = today.toISOString();
          
          const endDate = new Date(block.start);
          endDate.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]), 0, 0);
          const newEnd = endDate.toISOString();
          
          onResizeEnd(newStart, newEnd);
        }
        setIsResizing(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, block, dragOffset, height, startPixels, duration, pixelsPerHour, onDragEnd, onResizeEnd]);

  return (
    <div
      ref={blockRef}
      className={`absolute left-16 right-4 ${
        isDragging ? 'opacity-50 z-50' : isResizing ? 'z-40' : 'z-10'
      }`}
      style={{
        top: `${startPixels}px`,
        height: `${height}px`,
      }}
      onMouseDown={(e) => handleMouseDown(e)}
    >
      {/* Resize handles */}
      <div
        className="absolute top-0 left-0 right-0 h-2 bg-transparent hover:bg-blue-400 cursor-ns-resize"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, 'start');
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-2 bg-transparent hover:bg-blue-400 cursor-ns-resize"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, 'end');
        }}
      />
    </div>
  );
};

