// @ts-nocheck
import { create } from 'zustand';

// buildings store
export const useBuildingStore = create(
  (set) => ({
    allBuildings: [],
    customBuildings: [],
    buildingData: {},
    buildingAccounts: {},

    setAllBuildings: (v) =>
      set((s) => ({ allBuildings: typeof v === 'function' ? v(s.allBuildings) : v })),
    setCustomBuildings: (v) =>
      set((s) => ({ customBuildings: typeof v === 'function' ? v(s.customBuildings) : v })),
    setBuildingData: (v) =>
      set((s) => ({ buildingData: typeof v === 'function' ? v(s.buildingData) : v })),
    setBuildingAccounts: (v) =>
      set((s) => ({ buildingAccounts: typeof v === 'function' ? v(s.buildingAccounts) : v })),
  }),
);
