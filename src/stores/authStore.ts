import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StaffInfo {
  id: number;
  name: string;
  phone: string;
  roles: string[];
  assigned_buildings: string[];
}

interface LoginPayload {
  accessToken: string;
  refreshToken: string;
  staff: StaffInfo;
}

interface AuthState {
  // Legacy (used by useAppData when USE_API=false)
  loggedInId: number | null;
  role: string;

  // JWT tokens
  accessToken: string | null;
  refreshToken: string | null;

  // Staff info from server
  staffName: string | null;
  roles: string[];
  assignedBuildings: string[];

  // Actions
  setLoggedInId: (id: number | null) => void;
  setRole: (role: string) => void;
  login: (payload: LoginPayload) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      loggedInId: null,
      role: 'admin',
      accessToken: null,
      refreshToken: null,
      staffName: null,
      roles: [],
      assignedBuildings: [],

      setLoggedInId: (id) => set({ loggedInId: id }),
      setRole: (role) => set({ role }),

      login: ({ accessToken, refreshToken, staff }) =>
        set({
          loggedInId: staff.id,
          accessToken,
          refreshToken,
          staffName: staff.name,
          roles: staff.roles,
          assignedBuildings: staff.assigned_buildings,
          role: staff.roles.includes('general') ? 'admin' : 'admin',
        }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      logout: () =>
        set({
          loggedInId: null,
          role: 'admin',
          accessToken: null,
          refreshToken: null,
          staffName: null,
          roles: [],
          assignedBuildings: [],
        }),
    }),
    {
      name: 'hm_auth',
      partialize: (state) => ({
        loggedInId: state.loggedInId,
        role: state.role,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        staffName: state.staffName,
        roles: state.roles,
        assignedBuildings: state.assignedBuildings,
      }),
    },
  ),
);
