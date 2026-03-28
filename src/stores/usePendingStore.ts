// @ts-nocheck
import { create } from 'zustand';

export const usePendingStore = create((set) => ({
  pendingContract: null,
  pendingMoveout: null,

  setPendingContract: (v) => set({ pendingContract: v }),
  setPendingMoveout: (v) => set({ pendingMoveout: v }),
}));
