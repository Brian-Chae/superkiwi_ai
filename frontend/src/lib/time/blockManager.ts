import type { TimeBlock } from '../../state/useBlocksStore';
import { getDurationMinutes, isoToDate } from './timeUtils';

/**
 * 블록 관리 로직
 */

/**
 * 블록이 겹치는지 확인
 */
export function isBlockOverlapping(
  blocks: TimeBlock[],
  newBlock: Omit<TimeBlock, 'id'>,
  excludeId?: string
): boolean {
  const newStart = isoToDate(newBlock.start);
  const newEnd = isoToDate(newBlock.end);

  return blocks.some((block) => {
    if (excludeId && block.id === excludeId) return false;
    
    const blockStart = isoToDate(block.start);
    const blockEnd = isoToDate(block.end);
    
    return (
      (newStart >= blockStart && newStart < blockEnd) ||
      (newEnd > blockStart && newEnd <= blockEnd) ||
      (newStart <= blockStart && newEnd >= blockEnd)
    );
  });
}

/**
 * 블록 유효성 검사
 */
export function validateBlock(block: Omit<TimeBlock, 'id'>): {
  valid: boolean;
  error?: string;
} {
  const start = isoToDate(block.start);
  const end = isoToDate(block.end);
  
  if (start >= end) {
    return { valid: false, error: '시작 시간은 종료 시간보다 빨라야 합니다' };
  }
  
  const duration = getDurationMinutes(block.start, block.end);
  if (duration < 5) {
    return { valid: false, error: '최소 5분 이상이어야 합니다' };
  }
  
  if (duration > 24 * 60) {
    return { valid: false, error: '최대 24시간까지 가능합니다' };
  }
  
  return { valid: true };
}

/**
 * 블록을 시간순으로 정렬
 */
export function sortBlocksByTime(blocks: TimeBlock[]): TimeBlock[] {
  return [...blocks].sort((a, b) => {
    const aStart = isoToDate(a.start);
    const bStart = isoToDate(b.start);
    return aStart.getTime() - bStart.getTime();
  });
}

/**
 * 특정 시간에 블록이 있는지 확인
 */
export function hasBlockAtTime(blocks: TimeBlock[], time: Date): boolean {
  return blocks.some((block) => {
    const start = isoToDate(block.start);
    const end = isoToDate(block.end);
    return time >= start && time < end;
  });
}

