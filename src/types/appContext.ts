import type { Dispatch, SetStateAction } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Building, Tenant, Vacancy, CalendarEvent, Staff } from './index';

export interface AppData {
  // Domain state (17 pairs)
  roomBalances: Record<string, number>;
  setRoomBalances: Dispatch<SetStateAction<Record<string, number>>>;
  billingHistory: any[];
  setBillingHistory: Dispatch<SetStateAction<any[]>>;
  transactions: any[];
  setTransactions: Dispatch<SetStateAction<any[]>>;
  billingConfirmed: Record<string, any>;
  setBillingConfirmed: Dispatch<SetStateAction<Record<string, any>>>;
  billingSent: Record<string, any>;
  setBillingSent: Dispatch<SetStateAction<Record<string, any>>>;
  parkingInfo: Record<string, any>;
  setParkingInfo: Dispatch<SetStateAction<Record<string, any>>>;
  calendarEvts: CalendarEvent[];
  setCalendarEvts: Dispatch<SetStateAction<CalendarEvent[]>>;
  buildingAccounts: Record<string, any>;
  setBuildingAccounts: Dispatch<SetStateAction<Record<string, any>>>;
  customBuildings: any[];
  setCustomBuildings: Dispatch<SetStateAction<any[]>>;
  allBuildings: Building[];
  setAllBuildings: Dispatch<SetStateAction<Building[]>>;
  buildingData: Record<string, any>;
  setBuildingData: Dispatch<SetStateAction<Record<string, any>>>;
  lateFeeOverrides: Record<string, any>;
  setLateFeeOverrides: Dispatch<SetStateAction<Record<string, any>>>;
  activeTenants: Tenant[];
  setActiveTenants: Dispatch<SetStateAction<Tenant[]>>;
  pastTenantsData: Record<string, any>;
  setPastTenantsData: Dispatch<SetStateAction<Record<string, any>>>;
  activeVacancies: Vacancy[];
  setActiveVacancies: Dispatch<SetStateAction<Vacancy[]>>;
  settlementExpenses: any[];
  setSettlementExpenses: Dispatch<SetStateAction<any[]>>;
  cashbookEntries: any[];
  setCashbookEntries: Dispatch<SetStateAction<any[]>>;

  // Ephemeral state
  pendingContract: any;
  setPendingContract: Dispatch<SetStateAction<any>>;
  pendingMoveout: any;
  setPendingMoveout: Dispatch<SetStateAction<any>>;

  // Derived values
  myBuildings: string[];
  currentStaff: Staff | null;
  isGeneral: boolean;
  menuBadges: Record<string, number>;
  loggedInId: number | null;

  // Helper functions
  addBilling: (building: string, room: string, name: string, items: any, total: number) => void;
  addCashbookEntry: (entry: any) => void;
  addDeposit: (
    building: string,
    room: string,
    name: string,
    amount: number,
    method: string,
    note: string,
  ) => void;

  // Navigation
  navigateTo: (pageId: string) => void;
}

export function useAppContext(): AppData {
  return useOutletContext<AppData>();
}
