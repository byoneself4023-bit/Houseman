// @ts-nocheck
import { create } from 'zustand';
import { calendarEvents as initialCalendarEvents, vacancies as staticVacancies } from '../data';

// calendar + vacancy + parking store
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
