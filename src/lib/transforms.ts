// ============================================================
// API Response → FE Type 변환 함수
// BE는 buildingName/roomNumber + ID 기반, FE는 building/room (이름) 기반
// ============================================================

import type {
  BuildingListResponse,
  BuildingDetailResponse,
  ContractResponse,
  CalendarEventResponse,
  VacancyResponse,
  TransactionResponse,
  PastContractGroupResponse,
  SettlementExpenseResponse,
  StaffResponse,
} from '@/types/api';
import type {
  Building,
  BuildingFloorData,
  Tenant,
  CalendarEvent,
  Vacancy,
  RecentTransaction,
  PastTenant,
  SettlementExpense,
  Staff,
} from '@/types';

// === Contract → Tenant ===

export function contractToTenant(c: ContractResponse): Tenant {
  return {
    id: c.id,
    name: c.name,
    building: c.buildingName,
    room: c.roomNumber,
    phone: c.phone,
    rent: c.rent,
    mgmt: c.mgmt,
    deposit: c.deposit,
    type: c.type as Tenant['type'],
    due: c.due,
    status: c.status as Tenant['status'],
    overdue: c.overdue,
    moveIn: c.moveIn,
    expiry: c.expiry,
    prevUnpaid: c.prevUnpaid,
    currentUnpaid: c.currentUnpaid,
    overdueDays: c.overdueDays,
    carNumber: c.carNumber ?? undefined,
    carType: c.carType ?? undefined,
  };
}

// === Building (List) → Building ===

export function buildingListToBuilding(b: BuildingListResponse): Building {
  return {
    name: b.name,
    rooms: b.roomCount,
    occupied: b.occupiedCount,
    type: b.buildingType as Building['type'],
    feeType: b.feeType as Building['feeType'],
    fee: b.fee,
    fixedFee: b.fixedFee,
    special: null,
    parkingTotal: b.parkingTotal,
  };
}

// === Building (Detail) → BuildingFloorData ===

export function buildingDetailToFloorData(b: BuildingDetailResponse): BuildingFloorData {
  return {
    owner: b.ownerName ?? '',
    phone: b.ownerPhone ?? '',
    fee: b.ownerFee ?? 0,
    account: b.ownerAccount ?? '',
    start: b.mgmtStart ?? '',
    address: b.address ?? '',
    floors: b.floors ?? {},
  };
}

// === CalendarEvent ===

export function calendarResponseToEvent(
  e: CalendarEventResponse,
): CalendarEvent & { id: number; buildingId?: number | null; roomId?: number | null } {
  return {
    id: e.id,
    date: e.date,
    type: e.type as CalendarEvent['type'],
    building: e.buildingName ?? undefined,
    room: e.roomNumber ?? undefined,
    name: e.name,
    color: e.color,
    buildingId: e.buildingId,
    roomId: e.roomId,
  };
}

// === Vacancy ===

export function vacancyResponseToVacancy(
  v: VacancyResponse,
): Vacancy & { id: number; buildingId: number; roomId: number } {
  return {
    id: v.id,
    buildingId: v.buildingId,
    roomId: v.roomId,
    building: v.buildingName,
    room: v.roomNumber,
    type: v.type,
    commBroker: v.commBroker,
    commEvent: v.commEvent,
    pw: v.pw,
    deposit: v.deposit,
    rent: v.rent,
    nego: v.nego,
    mgmt: v.mgmt,
    water: v.water,
    cable: v.cable,
    exitFee: v.exitFee,
    days: v.days,
    status: v.status,
  };
}

// === Transaction ===

export function transactionResponseToTx(t: TransactionResponse): RecentTransaction {
  return {
    date: t.date,
    building: t.buildingName,
    room: t.roomNumber ?? '',
    type: t.type as RecentTransaction['type'],
    cat: t.category,
    amount: t.amount,
    desc: t.description,
  };
}

// === Past Contracts → pastTenantsData (Record<string, PastTenant[]>) ===

export function pastContractGroupsToMap(
  groups: PastContractGroupResponse[],
): Record<string, PastTenant[]> {
  const result: Record<string, PastTenant[]> = {};
  for (const group of groups) {
    const key = `${group.buildingName}_${group.roomNumber}`;
    result[key] = group.records.map((r) => ({
      name: r.name,
      phone: r.phone,
      moveIn: r.moveIn,
      moveOut: r.moveOut,
      expiry: r.expiry ?? undefined,
      deposit: r.deposit,
      rent: r.rent,
      mgmt: r.mgmt,
      roomType: r.roomType ?? undefined,
      due: r.due ?? undefined,
      rentDay: r.rentDay ?? undefined,
      reason: r.reason,
      settlement: r.settlement,
      settlementDate: r.settlementDate ?? undefined,
      cleanFee: r.cleanFee ?? undefined,
      elecReading: r.elecReading ?? undefined,
      gasReading: r.gasReading ?? undefined,
      waterReading: r.waterReading ?? undefined,
      damageFee: r.damageFee ?? undefined,
      damageDesc: r.damageDesc ?? undefined,
      penalty7: r.penalty7 ?? undefined,
      penaltyReason: r.penaltyReason ?? undefined,
      daysInMonth: r.daysInMonth ?? undefined,
      usedDays: r.usedDays ?? undefined,
      startDay: r.startDay ?? undefined,
      rentProRata: r.rentProRata ?? undefined,
      mgmtProRata: r.mgmtProRata ?? undefined,
      depositReturn: r.depositReturn ?? undefined,
      totalDeduct: r.totalDeduct ?? undefined,
      finalRefund: r.finalRefund ?? undefined,
      brokerageFee: r.brokerageFee ?? undefined,
    }));
  }
  return result;
}

// === Settlement Expense ===

export function settlementExpenseResponseToExpense(e: SettlementExpenseResponse): SettlementExpense {
  return {
    id: e.id,
    month: e.month,
    building: e.buildingName,
    room: e.roomNumber ?? undefined,
    category: e.category,
    desc: e.description,
    amount: e.amount,
    date: e.date,
  };
}

// === Staff ===

export function staffResponseToStaff(s: StaffResponse): Staff {
  return {
    id: s.id,
    name: s.name,
    phone: s.phone,
    pw: '',
    roles: s.roles,
    assignedBuildings: s.assignedBuildings,
  };
}
