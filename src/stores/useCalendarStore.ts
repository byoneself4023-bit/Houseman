// @ts-nocheck
import { create } from 'zustand';
import { calendarEvents as initialCalendarEvents, vacancies as staticVacancies } from '../data';

// Supabase가 메인 데이터소스. persist(localStorage) 제거.
// 앱 시작 시 static data → useSupabaseSync에서 Supabase 데이터로 교체
export const useCalendarStore = create(
  (set) => ({
    calendarEvts: initialCalendarEvents,
    activeVacancies: [...staticVacancies],
    parkingInfo: {},

    setCalendarEvts: (v) =>
      set((s) => ({ calendarEvts: typeof v === 'function' ? v(s.calendarEvts) : v })),
    setActiveVacancies: (v) =>
      set((s) => ({ activeVacancies: typeof v === 'function' ? v(s.activeVacancies) : v })),
    setParkingInfo: (v) =>
      set((s) => ({ parkingInfo: typeof v === 'function' ? v(s.parkingInfo) : v })),
  }),
);
