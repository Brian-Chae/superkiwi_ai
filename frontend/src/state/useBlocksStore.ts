import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

interface BlocksState {
  blocks: TimeBlock[];
  addBlock: (block: Omit<TimeBlock, 'id'>) => void;
  updateBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteBlock: (id: string) => void;
  setBlocks: (blocks: TimeBlock[]) => void;
}

export const useBlocksStore = create<BlocksState>()(
  persist(
    (set) => ({
      blocks: [],
      addBlock: (block) =>
        set((state) => ({
          blocks: [
            ...state.blocks,
            {
              ...block,
              id: crypto.randomUUID(),
            },
          ],
        })),
      updateBlock: (id, updates) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id ? { ...block, ...updates } : block
          ),
        })),
      deleteBlock: (id) =>
        set((state) => ({
          blocks: state.blocks.filter((block) => block.id !== id),
        })),
      setBlocks: (blocks) => set({ blocks }),
    }),
    {
      name: 'time-blocks-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

