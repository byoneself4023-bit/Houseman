import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  settingsOpen: boolean;
  showMobileMore: boolean;
  roomTypeVer: number;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSettingsOpen: (open: boolean) => void;
  setShowMobileMore: (show: boolean) => void;
  bumpRoomTypeVer: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  settingsOpen: false,
  showMobileMore: false,
  roomTypeVer: 0,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setShowMobileMore: (show) => set({ showMobileMore: show }),
  bumpRoomTypeVer: () => set((s) => ({ roomTypeVer: s.roomTypeVer + 1 })),
}));
