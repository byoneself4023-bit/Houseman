// @ts-nocheck
import { create } from 'zustand';

export const useAppStore = create((set) => ({
  page: 'calendar',
  sidebarOpen: true,
  settingsOpen: false,
  selectedBuilding: null,
  showMobileMore: false,
  time: new Date(),

  setPage: (page) => set({ page, selectedBuilding: null }),
  setPageKeepBuilding: (page) => set({ page }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  setSelectedBuilding: (v) => set({ selectedBuilding: v }),
  setShowMobileMore: (v) => set({ showMobileMore: v }),
  setTime: (v) => set({ time: v }),
}));
