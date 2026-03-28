// @ts-nocheck
import { create } from 'zustand';
import { pastTenants as staticPastTenants } from '../data';

// Supabase가 단일 원본 — useSupabaseSync에서 채워짐. localStorage 미사용.
export const useTenantStore = create(
  (set) => ({
    activeTenants: [],
    pastTenantsData: { ...staticPastTenants },

    setActiveTenants: (v) =>
      set((s) => ({ activeTenants: typeof v === 'function' ? v(s.activeTenants) : v })),
    setPastTenantsData: (v) =>
      set((s) => ({ pastTenantsData: typeof v === 'function' ? v(s.pastTenantsData) : v })),
  }),
);
