// @ts-nocheck
import { create } from 'zustand';

// buildings: Supabase 전용 (localStorage 사용 안 함)
// 앱 시작 시 빈 상태 → useSupabaseSync에서 Supabase 데이터로 채움
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
