// ============================================================
// API Response Types — matches Spring Boot DTO camelCase output
// ============================================================

// === Building ===

export interface BuildingListResponse {
  id: number;
  name: string;
  roomCount: number;
  occupiedCount: number;
  buildingType: string;
  feeType: string;
  fee: number;
  fixedFee: number;
  parkingTotal: number;
  address: string | null;
}

export interface BuildingDetailResponse extends BuildingListResponse {
  special: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerFee: number | null;
  ownerAccount: string | null;
  mgmtStart: string | null;
  floors: Record<string, string[]> | null;
}

// === Room ===

export interface RoomResponse {
  id: number;
  buildingId: number;
  buildingName: string;
  roomNumber: string;
  floorLabel: string;
  roomType: string;
  area: string;
  baseDeposit: number;
  baseRent: number;
  baseMgmt: number;
  waterFee: number;
  internetFee: number;
  cleanFee: number;
  commFee: number;
  elecNo: string | null;
  gasNo: string | null;
}

// === Contract (= FE Tenant) ===

export interface ContractResponse {
  id: number;
  buildingId: number;
  buildingName: string;
  roomId: number;
  roomNumber: string;
  name: string;
  phone: string;
  rent: number;
  mgmt: number;
  deposit: number;
  type: string;
  due: string;
  status: string;
  overdue: number;
  moveIn: string;
  expiry: string;
  prevUnpaid: number;
  currentUnpaid: number;
  overdueDays: number;
  carNumber: string | null;
  carType: string | null;
}

// === Past Contract ===

export interface PastContractRecord {
  id: number;
  buildingId: number;
  buildingName: string;
  roomId: number;
  roomNumber: string;
  name: string;
  phone: string;
  moveIn: string;
  moveOut: string;
  expiry: string | null;
  deposit: number;
  rent: number;
  mgmt: number;
  roomType: string | null;
  due: string | null;
  rentDay: number | null;
  reason: string;
  settlement: string;
  settlementDate: string | null;
  cleanFee: number | null;
  elecReading: number | null;
  gasReading: number | null;
  waterReading: number | null;
  damageFee: number | null;
  damageDesc: string | null;
  penalty7: number | null;
  penaltyReason: string | null;
  daysInMonth: number | null;
  usedDays: number | null;
  startDay: number | null;
  rentProRata: number | null;
  mgmtProRata: number | null;
  depositReturn: number | null;
  totalDeduct: number | null;
  finalRefund: number | null;
  brokerageFee: number | null;
}

export interface PastContractGroupResponse {
  buildingName: string;
  roomNumber: string;
  records: PastContractRecord[];
}

// === Calendar Event ===

export interface CalendarEventResponse {
  id: number;
  date: string;
  type: string;
  buildingId: number | null;
  buildingName: string | null;
  roomId: number | null;
  roomNumber: string | null;
  name: string;
  color: string;
}

// === Vacancy ===

export interface VacancyResponse {
  id: number;
  buildingId: number;
  buildingName: string;
  roomId: number;
  roomNumber: string;
  type: string;
  commBroker: number;
  commEvent: string;
  pw: string;
  deposit: number;
  rent: number;
  nego: number;
  mgmt: number;
  water: string;
  cable: string;
  exitFee: number;
  days: number;
  status: string;
}

// === Staff ===

export interface StaffResponse {
  id: number;
  name: string;
  phone: string;
  roles: string[];
  assignedBuildings: string[];
}

// === Transaction ===

export interface TransactionResponse {
  id: number;
  date: string;
  buildingId: number;
  buildingName: string;
  roomId: number | null;
  roomNumber: string | null;
  type: string;
  category: string;
  amount: number;
  description: string;
}

// === Billing Record ===

export interface BillingRecordResponse {
  id: number;
  buildingId: number;
  buildingName: string;
  roomId: number;
  roomNumber: string;
  contractId: number | null;
  periodYear: number;
  periodMonth: number;
  tenantName: string;
  rent: number;
  mgmt: number;
  water: number;
  electricity: number;
  gas: number;
  internet: number;
  lateFee: number;
  total: number;
  status: string;
  confirmedAt: string | null;
  sentAt: string | null;
  notes: string | null;
}

export interface BillingStatusResponse {
  total: number;
  draft: number;
  confirmed: number;
  sent: number;
}

// === Billing Config ===

export interface BillingConfigResponse {
  id: number;
  buildingId: number;
  buildingName: string;
  roomId: number;
  roomNumber: string;
  depositMonths: number;
  waterFee: number;
  cableFee: number;
  elecAmount: number;
  elecStart: string;
  elecEnd: string;
  elecPrice: number;
  elecSurcharge: number;
  elecTax: number;
  gasAmount: number;
  gasPeriod: string;
  gasPrice: number;
  gasColdPrice: number;
  gasTax: number;
}

// === Settlement Master ===

export interface SettlementMasterResponse {
  id: number;
  buildingId: number;
  buildingName: string;
  type: string;
  feeType: string;
  feeRate: number;
  feeAmount: number | null;
  feeAmountIncludesVat: boolean;
  direction: string;
  settlementDay: string;
  periodType: string;
  vat: boolean;
  vatMode: string | null;
  address: string;
  ownerName: string | null;
  notes: string;
  accountType: string | null;
  frequency: string | null;
  includeMgmt: boolean | null;
  dualAccount: boolean | null;
  moveoutOwnerBurden: boolean | null;
  hasCommercial: boolean | null;
  cashSplit: boolean | null;
  feeVariable: boolean | null;
  autoTransfer: boolean | null;
  dualSection: boolean | null;
  mgmtFeePerUnit: number | null;
  dates: unknown[] | null;
  customPeriod: Record<string, number> | null;
  subItems: unknown[] | null;
  costItems: unknown[] | null;
  hybridRules: unknown[] | null;
  elecCustomerMap: Record<string, Array<{ b: string; r: string; share?: number }>> | null;
  gasCodeMap: Record<string, Array<{ b: string; r: string }>> | null;
  billingType: string | null;
  accounts: Record<string, unknown> | null;
  abbr: string | null;
}

// === Settlement Expense ===

export interface SettlementExpenseResponse {
  id: number;
  buildingId: number;
  buildingName: string;
  roomId: number | null;
  roomNumber: string | null;
  month: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

// === Cashbook ===

export interface CashbookEntryResponse {
  id: number;
  buildingId: number;
  buildingName: string;
  date: string;
  type: string;
  direction: string;
  description: string;
  amount: number;
  account: string;
  accountHolder: string;
  status: string;
  sentAt: string | null;
  sourceId: string | null;
  room: string;
  round: number;
}

// === Parking ===

export interface ParkingInfoResponse {
  id: number;
  buildingId: number;
  buildingName: string;
  contractId: number | null;
  tenantName: string;
  roomNumber: string;
  carNumber: string;
  carType: string;
}

// === Auth ===

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  id: number;
  name: string;
  phone: string;
  roles: string[];
  assignedBuildings: string[];
}

// === Settlement Calculation ===

export interface SettlementCalculationResponse {
  buildingName: string;
  period: string;
  config: {
    feeType: string;
    feeRate: number;
    direction: string;
    settlementDay: string;
    vat: boolean;
  };
  roomSettlements: Array<{
    roomNumber: string;
    tenantName: string;
    rent: number;
    mgmt: number;
    total: number;
  }>;
  summary: {
    totalRent: number;
    totalMgmt: number;
    totalFee: number;
    finalAmount: number;
  };
}
