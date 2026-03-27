// ============================================================
// Domain Types — Houseman Property Management
// ============================================================

// ── Building ──

export type BuildingType = '단기';
export type FeeType = 'pct' | 'fixed';

export interface Building {
  name: string;
  rooms: number;
  occupied: number;
  type: BuildingType;
  feeType: FeeType;
  fee: number;
  fixedFee: number;
  special: string | null;
  parkingTotal: number;
}

// ── Tenant ──

export type TenantType = '단기' | '일반임대' | '근생' | '관리사무소';
export type TenantStatus = '정상' | '연체';

export interface Tenant {
  id: number;
  name: string;
  building: string;
  room: string;
  phone: string;
  rent: number;
  mgmt: number;
  deposit: number;
  type: TenantType;
  due: string;
  status: TenantStatus;
  overdue: number;
  moveIn: string;
  expiry: string;
  prevUnpaid: number;
  currentUnpaid: number;
  overdueDays: number;
  carNumber?: string;
  carType?: string;
}

// ── BillingConfig ──

export interface BillingConfigItem {
  b: string;
  r: string;
  d: number;
  w: number;
  c: number;
  ea: number;
  es: string;
  ee: string;
  ep: number;
  ec: number;
  eu: number;
  ga: number;
  gp: string;
  gpr: number;
  gcr: number;
  gu: number;
}

// ── BuildingFloors ──

export interface BuildingFloorData {
  owner: string;
  phone: string;
  fee: number;
  account: string;
  start: string;
  address: string;
  floors: Record<string, string[]>;
}

// ── RoomMaster ──

export interface RoomMaster {
  roomType: string;
  area: string;
  deposit: string;
  rent: string;
  mgmt: string;
  water: string;
  internet: string;
  cleanFee: string;
  commFee: string;
  elecNo?: string;
  gasNo?: string;
  photos?: string[];
}

// ── Staff ──

export interface StaffRole {
  id: string;
  label: string;
  icon: string;
  color: string;
  desc: string;
}

export interface Staff {
  id: number;
  name: string;
  phone: string;
  pw: string;
  roles: string[];
  assignedBuildings: string[];
}

// ── Calendar ──

export type CalendarEventType = '계약' | '퇴실' | '휴무';

export interface CalendarEvent {
  date: string;
  type: CalendarEventType;
  building?: string;
  room?: string;
  name: string;
  color: string;
}

// ── Transactions ──

export type TxType = '입금' | '지출';

export interface RecentTransaction {
  date: string;
  building: string;
  room: string;
  type: TxType;
  cat: string;
  amount: number;
  desc: string;
}

// ── Vacancy ──

export interface Vacancy {
  building: string;
  room: string;
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

// ── PastTenant ──

export interface PastTenant {
  name: string;
  phone: string;
  moveIn: string;
  moveOut: string;
  expiry?: string;
  deposit: number;
  rent: number;
  mgmt?: number;
  roomType?: string;
  due?: string;
  rentDay?: number;
  reason: string;
  settlement: string;
  settlementDate?: string;
  cleanFee?: number;
  elecReading?: number;
  gasReading?: number;
  waterReading?: number;
  damageFee?: number;
  damageDesc?: string;
  penalty7?: number;
  penaltyReason?: string;
  daysInMonth?: number;
  usedDays?: number;
  startDay?: number;
  rentProRata?: number;
  mgmtProRata?: number;
  depositReturn?: number;
  totalDeduct?: number;
  finalRefund?: number;
  brokerageFee?: number;
}

// ── Settlement ──

export interface ExpenseCategory {
  id: string;
  label: string;
  type: 'auto' | 'manual';
}

export interface SettlementExpense {
  id: number;
  month: string;
  building: string;
  room?: string;
  category: string;
  desc: string;
  amount: number;
  date: string;
}

export type SettlementType = 'A' | 'S' | 'F' | 'D' | 'X';
export type SettlementFeeType = 'pct' | 'salary' | 'fixed' | 'collection' | 'none' | 'hybrid';
export type SettlementDirection = 'hm_to_owner' | 'owner_to_hm' | 'none';

export interface SettlementSubItem {
  name: string;
  amount: number;
  vendor: string;
}

export interface SettlementCostItem {
  name: string;
  amount: number;
}

export interface HybridRule {
  unitType: string;
  feeType: string;
  feeRate?: number;
  feeAmount?: number;
}

export interface SettlementMasterEntry {
  type: SettlementType;
  feeType: SettlementFeeType;
  feeRate: number;
  direction: SettlementDirection;
  settlementDay: number | '말일';
  periodType: string;
  vat: boolean;
  address: string;
  notes: string;
  ownerName?: string;
  feeAmount?: number;
  feeAmountIncludesVat?: boolean;
  accountType?: string;
  frequency?: string;
  dates?: (number | string)[];
  includeMgmt?: boolean;
  dualAccount?: boolean;
  moveoutOwnerBurden?: boolean;
  hasCommercial?: boolean;
  cashSplit?: boolean;
  feeVariable?: boolean;
  autoTransfer?: boolean;
  vatMode?: string;
  customPeriod?: { startDay: number; endDay: number };
  subItems?: SettlementSubItem[];
  costItems?: SettlementCostItem[];
  hybridRules?: HybridRule[];
  dualSection?: boolean;
  mgmtFeePerUnit?: number;
}

// ── Patrol ──

export interface PatrolBuilding {
  building: string;
  freq: number;
  assignee: string;
  doneCount: number;
  lastDate: string | null;
  lastStatus: string | null;
}

export interface PatrolChecklistItem {
  item: string;
  status: string;
  comment?: string;
}

export interface PatrolRecord {
  id: number;
  building: string;
  date: string;
  assignee: string;
  status: string;
  comment: string;
  photos: string[];
  checklist?: PatrolChecklistItem[];
}

// ── AS Items ──

export interface ASStep {
  date: string;
  action: string;
  note: string;
}

export interface ASAction {
  step: string;
  date: string;
  by: string;
}

export interface ASItem {
  id: number;
  date: string;
  building: string;
  room: string;
  content: string;
  title?: string;
  detail: string;
  desc?: string;
  priority: string;
  assignee: string;
  status: string;
  category: string;
  paid: string;
  cost: number;
  vendor: string;
  source?: string;
  photoBefore: string;
  photoAfter: string;
  steps: ASStep[];
  actions?: ASAction[];
  ownerApproval?: string | null;
  estimatedCost?: number;
}

// ── Building Coords ──

export interface BuildingCoord {
  lat: number;
  lng: number;
  address: string;
}

// ── BillingMaster Maps ──

export interface ElecCustomerEntry {
  b: string;
  r: string;
  share?: number;
}

export interface GasCodeEntry {
  b: string;
  r: string;
}

export interface BankAccount {
  bank: string;
  account: string;
  holder: string;
}

export interface BuildingAccountEntry {
  owner?: BankAccount | null;
  manager?: BankAccount;
  bank?: string;
  account?: string;
  holder?: string;
}

// ── Navigation ──

export interface ViewMode {
  id: string;
  icon: string;
  label: string;
  color: string;
}

export interface MenuItem {
  id: string;
  icon: string;
  label: string;
}

export interface MenuSection {
  section: string;
  items: MenuItem[];
}

// ── Account Config ──

export interface ModeOption {
  id: string;
  label: string;
  desc: string;
}

export interface OwnerFieldCfgEntry {
  key: string;
  label: string;
}

// ── OwnerBuildings ──

export type OwnerBuildingsMap = Record<string, string[]>;

// ── Settlement Period ──

export interface SettlementPeriod {
  start: string;
  end: string;
}

// ── VAT Result ──

export interface VatResult {
  supply: number;
  tax: number;
  total: number;
}

// ── API (Phase 1+) ──

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ErrorResponse;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}
