/**
 * TimeBlock 타입 정의
 */

export interface TimeBlock {
  id: string;
  type: 'deepwork' | 'break' | 'meeting';
  start: string; // ISO 8601 format
  end: string;
  meta?: {
    title?: string;
    tags?: string[];
    notes?: string;
  };
}

