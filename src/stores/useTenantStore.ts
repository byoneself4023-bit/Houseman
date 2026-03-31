// @ts-nocheck
import { create } from 'zustand';
import { pastTenants as staticPastTenants } from '../data';

// tenants store
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
