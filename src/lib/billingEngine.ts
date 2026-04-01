/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// billingEngine.ts — 청구 시스템 핵심 엔진
//
// 기능:
// 1. 청구수수료 계산 (단기 전기/가스)
// 2. 미납금 항목별 분해
// 3. 검침 매칭 (날짜 기준, 계량기 교체 대비)
// 4. 변동관리비 안분 (전기/수도, 공용 배분)
// 5. 발송 타이밍 판정
// 6. 청구서 생성
// ============================================================

import { truncate10, calcDueAmounts } from '@/data';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// localStorage helpers (appData blob)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function readAppData(): Record<string, any> {
  try {
    const raw = localStorage.getItem('appData');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeAppKey(key: string, value: any): void {
  try {
    const data = readAppData();
    data[key] = value;
    localStorage.setItem('appData', JSON.stringify(data));
  } catch { /* ignore */ }
}

let _nextBillingId = Date.now();
function nextId(): number { return _nextBillingId++; }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface BillingSurcharges {
  elecFee: number;
  gasFee: number;
}

interface BillingSettings {
  elec_billing_fee?: number;
  gas_billing_fee?: number;
  elec_payment_method?: string;
  gas_payment_method?: string;
  billing_case?: string;
  late_fee_rate?: number | null;
  late_fee_apply_type?: string | null;
  late_fee_apply_value?: number | null;
  tenant_id?: number | null;
  room_id?: number;
  building_id?: number;
  [key: string]: any;
}

interface UnpaidItems {
  rent: number;
  mgmt: number;
  elec: number;
  gas: number;
  water: number;
  internet: number;
  parking: number;
  surcharge: number;
  lateFee: number;
  extra: number;
  total: number;
}

interface MeterUsageResult {
  usage: number;
  amount: number;
  isMeterReplaced: boolean;
  matched?: boolean;
}

interface RoomMatch {
  buildingId: number;
  roomId: number;
  roomNumber: string;
  share: number;
}

interface ApportionRoom {
  roomId: number;
  roomNumber?: string;
  usage: number;
  isOccupied: boolean;
  moveInDate?: string;
  isDirectPay?: boolean;
}

interface ApportionParams {
  totalBillAmount: number;
  totalBillUsage: number;
  rooms: ApportionRoom[];
  periodStart: string;
  periodEnd: string;
}

interface ApportionRoomResult {
  roomId: number;
  roomNumber?: string;
  usage: number;
  amount: number;
  commonAmount: number;
  proRataRatio: number;
  total: number;
}

interface ApportionResult {
  rooms: ApportionRoomResult[];
  commonUsage: number;
  commonAmount: number;
  ownerBurden: number;
  totalVerified: boolean;
}

interface SendModeResult {
  mode: string;
  autoSend: boolean;
  reason: string;
}

interface SendModeParams {
  buildingType: string;
  monthsSinceMoveIn: number;
  isMatched: boolean;
  daysBeforeDue: number;
}

interface AccountInfo {
  bank: string;
  account: string;
  holder: string;
}

interface MeterInfo {
  periodStart?: string;
  periodEnd?: string;
  prevReading?: string | number;
  currReading?: string | number;
  usage?: number;
}

interface MessageOpts {
  billingType?: string;
  meterElec?: MeterInfo;
  meterGas?: MeterInfo;
  isFirstMonth?: boolean;
  isDirectPayUtility?: boolean;
}

interface BillingKpi {
  total: number;
  draft: number;
  confirmed: number;
  sent: number;
  paid: number;
  partial: number;
  overdue: number;
  unpaidTotal: number;
  [key: string]: number;
}

interface RiskScoreResult {
  score: number;
  label: string;
  overdueDays?: number;
  balanceDays?: number;
}

interface PowerCutStageResult {
  stage: string;
  day: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. 청구수수료 (단기에서만)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_ELEC_FEE = 2500;
const DEFAULT_GAS_FEE = 1370;

/**
 * 청구수수료를 계산합니다.
 * @param billingSettings - billing_settings 행 (없으면 기본값)
 * @param isShortTerm - 단기 건물 여부
 */
export const getBillingSurcharges = (billingSettings: BillingSettings = {}, isShortTerm = false): BillingSurcharges => {
  if (!isShortTerm) return { elecFee: 0, gasFee: 0 };
  return {
    elecFee: billingSettings.elec_billing_fee ?? DEFAULT_ELEC_FEE,
    gasFee: billingSettings.gas_billing_fee ?? DEFAULT_GAS_FEE,
  };
};

/**
 * 퇴실 시 청구 설정을 기본값으로 리셋합니다.
 */
export const resetBillingSettingsOnMoveOut = async (roomId: number): Promise<void> => {
  const data = readAppData();
  const settings: Record<string, any> = data.hm_billingSettings || {};
  delete settings[String(roomId)];
  writeAppKey('hm_billingSettings', settings);
};

/**
 * 퇴실 확정 통합 함수 — 모든 상태를 한 번에 처리
 * CalendarPage, TenantsPage 어디서든 이 함수 하나만 호출
 */
export async function confirmMoveOut(params: { tenantId: number; roomId: number; moveOutDate: string }): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = [];
  const data = readAppData();

  // 1) activeTenants에서 제거
  const tenants: any[] = data.hm_activeTenants || [];
  const tenant = tenants.find((t: any) => t.id === params.tenantId);
  if (!tenant) {
    errors.push('임차인을 찾을 수 없습니다.');
    return { ok: false, errors };
  }
  data.hm_activeTenants = tenants.filter((t: any) => t.id !== params.tenantId);

  // 2) pastTenantsData에 추가
  const past: Record<string, any> = data.hm_pastTenantsData || {};
  const key = `${tenant.building}_${tenant.room}`;
  if (!past[key]) past[key] = [];
  past[key].push({ ...tenant, moveOutDate: params.moveOutDate, movedOutAt: new Date().toISOString() });
  data.hm_pastTenantsData = past;

  // 3) 공실 등록
  const vacancies: any[] = data.hm_activeVacancies || [];
  const exists = vacancies.find((v: any) => v.building === tenant.building && v.room === tenant.room);
  if (!exists) {
    vacancies.push({
      id: nextId(),
      building: tenant.building,
      room: tenant.room,
      availableDate: params.moveOutDate,
      status: '공실',
      createdAt: new Date().toISOString(),
    });
    data.hm_activeVacancies = vacancies;
  }

  // 4) 청구 설정 초기화
  const settings: Record<string, any> = data.hm_billingSettings || {};
  delete settings[String(params.roomId)];
  data.hm_billingSettings = settings;

  localStorage.setItem('appData', JSON.stringify(data));
  return { ok: true, errors };
}

// ── billing_initial_setup CRUD ──

/**
 * 건물의 초기설정을 조회합니다.
 */
export const getBillingInitialSetup = async (buildingId: number): Promise<any | null> => {
  const data = readAppData();
  const setups: Record<string, any> = data.hm_billingInitialSetup || {};
  return setups[String(buildingId)] || null;
};

/**
 * 건물의 초기설정을 저장(upsert)합니다.
 */
export const saveBillingInitialSetup = async (setup: any): Promise<any | null> => {
  const data = readAppData();
  const setups: Record<string, any> = data.hm_billingInitialSetup || {};
  const id = setup.building_id;
  const saved = { ...setup, id: setup.id || nextId(), updated_at: new Date().toISOString() };
  setups[String(id)] = saved;
  writeAppKey('hm_billingInitialSetup', setups);
  return saved;
};

/**
 * 특정 호실의 billing_settings를 조회합니다.
 */
export const getBillingSettings = async (roomId: number): Promise<any | null> => {
  const data = readAppData();
  const settings: Record<string, any> = data.hm_billingSettings || {};
  return settings[String(roomId)] || null;
};

/**
 * 특정 건물의 모든 호실 billing_settings를 조회합니다.
 */
export const getBillingSettingsByBuilding = async (buildingId: number): Promise<any[]> => {
  const data = readAppData();
  const settings: Record<string, any> = data.hm_billingSettings || {};
  return Object.values(settings).filter((s: any) => s.building_id === buildingId);
};

/**
 * billing_settings를 저장(upsert)합니다.
 */
export const saveBillingSettings = async (settings: any): Promise<any | null> => {
  const data = readAppData();
  const all: Record<string, any> = data.hm_billingSettings || {};
  const roomId = settings.room_id;
  const saved = { ...settings, id: settings.id || nextId(), updated_at: new Date().toISOString() };
  all[String(roomId)] = saved;
  writeAppKey('hm_billingSettings', all);
  return saved;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. 미납금 항목별 분해
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 빈 미납금 객체
 */
export const emptyUnpaid = (): UnpaidItems => ({
  rent: 0, mgmt: 0, elec: 0, gas: 0, water: 0,
  internet: 0, parking: 0, surcharge: 0, lateFee: 0, extra: 0, total: 0,
});

/**
 * billing_records에서 미납 항목을 집계합니다.
 * status가 'sent' 또는 'overdue'이고 완납되지 않은 건
 */
export const getUnpaidByItems = async (roomId: number, excludeMonth = ''): Promise<UnpaidItems> => {
  const data = readAppData();
  const records: any[] = data.hm_billingRecords || [];
  const unpaid = emptyUnpaid();

  records
    .filter((r: any) =>
      r.room_id === roomId &&
      ['sent', 'overdue', 'partial'].includes(r.status) &&
      r.billing_month !== excludeMonth
    )
    .forEach((r: any) => {
      unpaid.rent += r.rent || 0;
      unpaid.mgmt += r.management_fee || 0;
      unpaid.elec += r.electric_fee || 0;
      unpaid.gas += r.gas_fee || 0;
      unpaid.water += r.water_fee || 0;
      unpaid.internet += r.internet_fee || 0;
      unpaid.parking += r.parking_fee || 0;
      unpaid.surcharge += (r.elec_billing_surcharge || 0) + (r.gas_billing_surcharge || 0);
      unpaid.lateFee += r.late_fee || 0;
      unpaid.extra += r.extra_charge || 0;
    });

  unpaid.total = unpaid.rent + unpaid.mgmt + unpaid.elec + unpaid.gas + unpaid.water +
    unpaid.internet + unpaid.parking + unpaid.surcharge + unpaid.lateFee + unpaid.extra;

  return unpaid;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. 검침 매칭 (날짜 기준)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 특정 호실의 마지막 검침을 조회합니다.
 */
export const getLastReading = async (roomId: number, type: 'elec' | 'gas' | 'water'): Promise<any | null> => {
  const data = readAppData();
  const readings: any[] = data.hm_meterReadings || [];
  const matched = readings
    .filter((r: any) => r.room_id === roomId && r.type === type)
    .sort((a: any, b: any) => (b.reading_date || '').localeCompare(a.reading_date || ''));
  return matched[0] || null;
};

/**
 * 검침 데이터를 저장합니다.
 */
export const saveReading = async (reading: any): Promise<boolean> => {
  try {
    const data = readAppData();
    const readings: any[] = data.hm_meterReadings || [];
    readings.push({ ...reading, id: reading.id || nextId(), created_at: new Date().toISOString() });
    writeAppKey('hm_meterReadings', readings);
    return true;
  } catch { return false; }
};

/**
 * 같은 달에 2건의 검침이 있으면 계량기 교체로 판단하고 사용량을 합산합니다.
 */
export const getMonthlyUsage = async (roomId: number, type: 'elec' | 'gas' | 'water', billingMonth: string): Promise<MeterUsageResult> => {
  const data = readAppData();
  const readings: any[] = data.hm_meterReadings || [];
  const matched = readings.filter((r: any) => r.room_id === roomId && r.type === type && r.billing_month === billingMonth);

  if (matched.length === 0) return { usage: 0, amount: 0, isMeterReplaced: false, matched: false };

  const totalUsage = matched.reduce((sum: number, r: any) => sum + (r.usage || 0), 0);
  const totalAmount = matched.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

  return {
    usage: totalUsage,
    amount: totalAmount,
    isMeterReplaced: matched.length > 1,
    matched: true,
  };
};

/**
 * 고객번호 + 기간으로 엑셀 데이터를 호실에 매칭합니다.
 * rooms 테이블의 electric_customer_number / gas_customer_number 사용
 */
export const matchByCustomerNumber = (customerNumber: string, type: 'elec' | 'gas', rooms: any[]): RoomMatch[] => {
  if (!customerNumber) return [];
  const field = type === 'elec' ? 'electricCustomerNumber' : 'gasCustomerNumber';
  return rooms
    .filter((r: any) => r[field] === customerNumber)
    .map((r: any) => ({
      buildingId: r.buildingId || r.building_id,
      roomId: r.id || r.room_id,
      roomNumber: r.roomNumber || r.room_number,
      share: r.electricShareRatio || 1, // 스타빌 공유계량 대비
    }));
};

/**
 * 임차인의 입주 개월 수를 계산합니다.
 */
export const getMonthsSinceMoveIn = (moveInDate: string, billingMonth: string): number => {
  if (!moveInDate || !billingMonth) return 99;
  const moveIn = new Date(moveInDate);
  const [y, m] = billingMonth.split('-').map(Number);
  const billing = new Date(y, m - 1, 1);
  const months = (billing.getFullYear() - moveIn.getFullYear()) * 12 +
    (billing.getMonth() - moveIn.getMonth()) + 1;
  return Math.max(1, months);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. 변동관리비 안분 엔진
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 호실별 전기/수도 안분을 계산합니다.
 * 한전/수도 총 청구 금액과 호실별 합계가 정확히 일치해야 합니다.
 */
export const calculateApportion = ({
  totalBillAmount,
  totalBillUsage,
  rooms,
  periodStart,
  periodEnd,
}: ApportionParams): ApportionResult => {
  // 직접납부 호실 제외
  const targetRooms = rooms.filter(r => !r.isDirectPay);
  const occupiedRooms = targetRooms.filter(r => r.isOccupied);
  const vacantRooms = targetRooms.filter(r => !r.isOccupied);

  // 호실별 사용량 합계
  const totalRoomUsage = targetRooms.reduce((sum, r) => sum + (r.usage || 0), 0);

  // 공용 사용량 = 총 사용량 - 호실 합계
  const commonUsage = Math.max(0, totalBillUsage - totalRoomUsage);

  // 단가 (금액 기준 안분을 위한 기준)
  const unitPrice = totalBillUsage > 0 ? totalBillAmount / totalBillUsage : 0;

  // 일할 계산 (입주일이 사용기간 중간인 경우)
  const periodDays = daysBetween(periodStart, periodEnd);

  const result: ApportionRoomResult[] = occupiedRooms.map(r => {
    // 호실 사용분 금액
    const roomAmount = truncate10(Math.round((r.usage || 0) * unitPrice));

    // 일할 비율 (입주일이 사용기간 내에 있으면)
    let proRataRatio = 1;
    if (r.moveInDate && periodStart) {
      const moveIn = new Date(r.moveInDate);
      const start = new Date(periodStart);
      const end = new Date(periodEnd);
      if (moveIn > start && moveIn <= end) {
        const occupiedDays = daysBetween(r.moveInDate, periodEnd);
        proRataRatio = periodDays > 0 ? occupiedDays / periodDays : 1;
      }
    }

    // 공용전기 안분 (입주 호실에만, 일할 적용)
    const commonShare = occupiedRooms.length > 0
      ? truncate10(Math.round((commonUsage * unitPrice * proRataRatio) / occupiedRooms.length))
      : 0;

    return {
      roomId: r.roomId,
      roomNumber: r.roomNumber,
      usage: r.usage || 0,
      amount: roomAmount,
      commonAmount: commonShare,
      proRataRatio,
      total: roomAmount + commonShare,
    };
  });

  // 공실분 = 건물주 부담
  const vacantCommonAmount = vacantRooms.length > 0
    ? truncate10(Math.round((commonUsage * unitPrice * vacantRooms.length) / targetRooms.length))
    : 0;

  // 오차 보정: 호실 합계를 총 청구금액과 일치시킴
  const currentTotal = result.reduce((sum, r) => sum + r.total, 0) + vacantCommonAmount;
  const diff = totalBillAmount - currentTotal;
  if (diff !== 0 && result.length > 0) {
    // 오차를 마지막 호실에 가감
    result[result.length - 1].total += diff;
    result[result.length - 1].commonAmount += diff;
  }

  return {
    rooms: result,
    commonUsage,
    commonAmount: truncate10(Math.round(commonUsage * unitPrice)),
    ownerBurden: vacantCommonAmount,
    totalVerified: result.reduce((sum, r) => sum + r.total, 0) + vacantCommonAmount === totalBillAmount,
  };
};

/** 두 날짜 사이의 일수 */
const daysBetween = (start: string, end: string): number => {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. 발송 타이밍 판정
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 호실별 발송 모드를 판정합니다.
 */
export const getSendMode = ({ buildingType, monthsSinceMoveIn, isMatched, daysBeforeDue }: SendModeParams): SendModeResult => {
  // 변동관리비 → 항상 수동
  if (buildingType === 'variable') {
    return { mode: 'manual', autoSend: false, reason: '변동관리비: 관리자 확인 필수' };
  }

  // 고정관리비 → 7일 전 자동
  if (buildingType === 'fixed') {
    if (daysBeforeDue <= 7) {
      return { mode: 'auto', autoSend: true, reason: '고정관리비: 자동발송' };
    }
    return { mode: 'pending', autoSend: false, reason: `발송 대기 (D-${daysBeforeDue})` };
  }

  // 단기
  if (buildingType === 'short') {
    // 1달차: 전기/가스 미청구
    if (monthsSinceMoveIn <= 1) {
      return { mode: 'first_month', autoSend: false, reason: '1달차: 전기/가스 미청구' };
    }
    // 2달차: 무조건 수동 검증
    if (monthsSinceMoveIn === 2) {
      return { mode: 'second_month', autoSend: false, reason: '2달차: 수동 검증 필요 (공실기간 확인)' };
    }
    // 3달차~
    if (isMatched) {
      if (daysBeforeDue <= 7) {
        return { mode: 'auto', autoSend: true, reason: '자동매칭 완료: 자동발송' };
      }
      return { mode: 'pending', autoSend: false, reason: `매칭 완료, 발송 대기 (D-${daysBeforeDue})` };
    }
    // 미매칭
    if (daysBeforeDue <= 2) {
      return { mode: 'skip_utility', autoSend: false, reason: '2일 전 미매칭: 전기/가스 빼고 발송 권장' };
    }
    return { mode: 'unmatched', autoSend: false, reason: '미매칭: 수동 입력 필요' };
  }

  return { mode: 'unknown', autoSend: false, reason: '알 수 없는 건물 유형' };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. 청구서 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 단기+고정관리비 청구서를 생성합니다.
 */
export const generateBillingRecord = ({
  tenant,
  building,
  room = null,
  billingSettings = {} as BillingSettings,
  meterData = {} as any,
  unpaid = emptyUnpaid(),
  billingMonth,
  extraCharge = 0,
  extraChargeDesc = '',
}: {
  tenant: any;
  building: any;
  room?: any;
  billingSettings?: BillingSettings;
  meterData?: any;
  unpaid?: UnpaidItems;
  billingMonth: string;
  extraCharge?: number;
  extraChargeDesc?: string;
}): any => {
  const isShort = building.isShortTermRental;
  const surcharges = getBillingSurcharges(billingSettings, isShort);

  // 전기/가스 납부방식 체크 (직접납부면 0)
  const elecMethod = billingSettings.elec_payment_method || 'proxy';
  const gasMethod = billingSettings.gas_payment_method || 'proxy';
  const elecFee = elecMethod === 'direct' ? 0 : (meterData.elec?.amount || 0);
  const gasFee = gasMethod === 'direct' ? 0 : (meterData.gas?.amount || 0);
  const elecSurcharge = elecMethod === 'direct' ? 0 : (elecFee > 0 ? surcharges.elecFee : 0);
  const gasSurcharge = gasMethod === 'direct' ? 0 : (gasFee > 0 ? surcharges.gasFee : 0);

  const rent = truncate10(tenant.rent || 0);
  const mgmt = truncate10(tenant.managementFee || tenant.management_fee || 0);
  const water = truncate10(tenant.waterFee || tenant.water_fee || 0);
  const internet = truncate10(tenant.internetFee || tenant.internet_fee || 0);
  const parking = truncate10(tenant.parkingFee || 0);

  const currentTotal = rent + mgmt + truncate10(elecFee) + truncate10(gasFee) +
    water + internet + parking + elecSurcharge + gasSurcharge + extraCharge;

  const totalWithUnpaid = currentTotal + unpaid.total;

  // 납기내/납기후 계산
  const dueDay = tenant.paymentDueDay || tenant.payment_due_day || new Date(tenant.moveInDate || tenant.move_in_date).getDate();
  const now = new Date();
  const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
  const dueDateStr = dueDate.toISOString().slice(0, 10);

  const { totalWithinDue, totalAfterDue, lateFee, applyDate } = calcDueAmounts(
    totalWithUnpaid, dueDateStr,
    { late_fee_rate: building.lateFeeRate, late_fee_apply_type: building.lateFeeApplyType as 'days' | 'months' | null | undefined, late_fee_apply_value: building.lateFeeApplyValue },
    { late_fee_rate: billingSettings.late_fee_rate, late_fee_apply_type: billingSettings.late_fee_apply_type as 'days' | 'months' | null | undefined, late_fee_apply_value: billingSettings.late_fee_apply_value },
  );

  return {
    building_id: building._supabaseId || building.id,
    room_id: tenant.roomId || tenant.room_id,
    tenant_id: tenant.supabaseId || tenant.id,
    // 스냅샷: 생성 시점 확정 (이후 임차인 정보 변경되어도 유지)
    tenant_name: tenant.name || '',
    tenant_phone: tenant.phone || '',
    room_number: room?.room_number || room?.roomNumber || tenant.room || tenant.roomNumber || '',
    building_name: building.buildingName || building.building_name || '',
    billing_month: billingMonth,
    rent,
    management_fee: mgmt,
    electric_fee: truncate10(elecFee),
    gas_fee: truncate10(gasFee),
    water_fee: water,
    internet_fee: internet,
    parking_fee: parking,
    elec_billing_surcharge: elecSurcharge,
    gas_billing_surcharge: gasSurcharge,
    late_fee: lateFee,
    extra_charge: extraCharge,
    extra_charge_desc: extraChargeDesc,
    total: totalWithUnpaid,
    total_within_due: totalWithinDue,
    total_after_due: totalAfterDue,
    due_date: dueDateStr,
    late_fee_apply_date: applyDate ? applyDate.toISOString().slice(0, 10) : null,
    prev_unpaid_rent: unpaid.rent,
    prev_unpaid_mgmt: unpaid.mgmt,
    prev_unpaid_elec: unpaid.elec,
    prev_unpaid_gas: unpaid.gas,
    prev_unpaid_water: unpaid.water,
    prev_unpaid_other: unpaid.internet + unpaid.parking + unpaid.surcharge + unpaid.lateFee + unpaid.extra,
    prev_unpaid_total: unpaid.total,
    status: 'draft',
  };
};

/**
 * billing_records를 Supabase에 저장합니다.
 */
export const saveBillingRecord = async (record: any): Promise<any | null> => {
  try {
    const data = readAppData();
    const records: any[] = data.hm_billingRecords || [];
    const saved = { ...record, id: record.id || nextId(), created_at: new Date().toISOString() };
    records.push(saved);
    writeAppKey('hm_billingRecords', records);
    return saved;
  } catch { return null; }
};

/**
 * 특정 청구월의 모든 billing_records를 조회합니다.
 */
export const getBillingRecords = async (billingMonth: string, buildingId: number | null = null): Promise<any[]> => {
  const data = readAppData();
  const records: any[] = data.hm_billingRecords || [];
  return records.filter((r: any) =>
    r.billing_month === billingMonth &&
    (buildingId == null || r.building_id === buildingId)
  );
};

/**
 * KPI 집계: 특정 청구월의 상태별 건수 + 미납 합계
 */
export const getBillingKpi = async (billingMonth: string): Promise<BillingKpi> => {
  const records = await getBillingRecords(billingMonth);
  const kpi: BillingKpi = { total: records.length, draft: 0, confirmed: 0, sent: 0, paid: 0, partial: 0, overdue: 0, unpaidTotal: 0 };
  records.forEach((r: any) => {
    if (r.status in kpi) kpi[r.status]++;
    if (['sent', 'overdue', 'partial'].includes(r.status)) kpi.unpaidTotal += r.total || 0;
  });
  return kpi;
};

/**
 * 청구서 상태를 업데이트합니다.
 */
export const updateBillingStatus = async (recordId: number, status: string, extra: any = {}): Promise<boolean> => {
  try {
    const data = readAppData();
    const records: any[] = data.hm_billingRecords || [];
    const idx = records.findIndex((r: any) => r.id === recordId);
    if (idx === -1) return false;

    records[idx] = {
      ...records[idx],
      ...extra,
      status,
      ...(status === 'sent' ? { sent_at: new Date().toISOString() } : {}),
      ...(status === 'confirmed' ? { confirmed_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    };
    writeAppKey('hm_billingRecords', records);
    return true;
  } catch { return false; }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. 대량 일괄 처리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 고정관리비 + 단기 1달차 + 단기 3달차~ 매칭완료 → billing_records 자동 생성
 */
export const autoGenerateBillingRecords = async (
  billingMonth: string,
  tenants: any[],
  buildingDataMap: any,
  _meterReadings: any[],
  getRoomTypeFn: ((building: string, room: string) => string) | null,
  _calendarEvents: any[] = [],
): Promise<{ created: number; skipped: number; reviewRequired: number }> => {
  let created = 0;
  let skipped = 0;
  let reviewRequired = 0;

  for (const tenant of tenants) {
    const buildingName = tenant.building || tenant.buildingName;
    const building = buildingDataMap[buildingName];
    if (!building) { skipped++; continue; }

    const roomType = getRoomTypeFn ? getRoomTypeFn(buildingName, tenant.room || tenant.roomNumber) : 'short';
    const isShort = roomType === '단기' || building.isShortTermRental;
    const monthsSince = getMonthsSinceMoveIn(tenant.moveInDate || tenant.move_in_date, billingMonth);

    // 단기 1달차: 전기/가스 미청구 → 수동 검증 필요
    if (isShort && monthsSince <= 1) { reviewRequired++; continue; }
    // 단기 2달차: 수동 검증 필요
    if (isShort && monthsSince === 2) { reviewRequired++; continue; }

    const roomId = tenant.roomId || tenant.room_id;
    const billingSettings = await getBillingSettings(roomId) || {};
    const unpaid = await getUnpaidByItems(roomId, billingMonth);

    const record = generateBillingRecord({
      tenant, building, billingSettings, unpaid, billingMonth,
    });

    const saved = await saveBillingRecord(record);
    if (saved) created++;
    else skipped++;
  }

  return { created, skipped, reviewRequired };
};

/**
 * confirmed 상태인 전체 건 일괄 발송
 */
export const bulkSendBilling = async (
  billingMonth: string,
  _buildingDataMap: any,
  _tenants: any[],
  onProgress?: (current: number, total: number) => void,
): Promise<{ sent: number; failed: number }> => {
  const data = readAppData();
  const records: any[] = data.hm_billingRecords || [];
  const targets = records.filter((r: any) => r.billing_month === billingMonth && r.status === 'confirmed');

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const ok = await updateBillingStatus(targets[i].id, 'sent');
    if (ok) sent++;
    else failed++;
    onProgress?.(i + 1, targets.length);
  }

  return { sent, failed };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. 케이스별 billing_records 분리 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 케이스 A~E에 따라 billing_records를 생성합니다.
 * A, B2, C, E → 1건 (billing_type='full')
 * B1 → 2건 (billing_type='rent' + 'mgmt')
 * D → 2건 (billing_type='rent_mgmt' + 'variable')
 */
export const generateCaseBillingRecords = async (params: any): Promise<any[]> => {
  const billingCase = params.billingCase || 'A';
  const base = generateBillingRecord(params);
  const saved: any[] = [];

  if (billingCase === 'B1') {
    // 월세 청구서
    const rentRecord: any = {
      ...base,
      billing_type: 'rent',
      management_fee: 0, electric_fee: 0, gas_fee: 0, water_fee: 0,
      internet_fee: 0, parking_fee: 0, elec_billing_surcharge: 0, gas_billing_surcharge: 0,
      total: base.rent,
      total_within_due: base.rent + (base.prev_unpaid_rent || 0),
      total_after_due: base.rent + (base.prev_unpaid_rent || 0),
      prev_unpaid_mgmt: 0, prev_unpaid_elec: 0, prev_unpaid_gas: 0,
      prev_unpaid_water: 0, prev_unpaid_other: 0,
      prev_unpaid_total: base.prev_unpaid_rent || 0,
    };
    rentRecord.total = rentRecord.total_within_due;
    const s1 = await saveBillingRecord(rentRecord);
    if (s1) saved.push(s1);

    // 관리비 청구서
    const mgmtRecord: any = {
      ...base,
      billing_type: 'mgmt',
      rent: 0,
      total: base.management_fee + base.electric_fee + base.gas_fee + base.water_fee + base.internet_fee + base.parking_fee + base.elec_billing_surcharge + base.gas_billing_surcharge,
      prev_unpaid_rent: 0,
      prev_unpaid_total: (base.prev_unpaid_mgmt || 0) + (base.prev_unpaid_elec || 0) + (base.prev_unpaid_gas || 0) + (base.prev_unpaid_water || 0) + (base.prev_unpaid_other || 0),
    };
    mgmtRecord.total_within_due = mgmtRecord.total + mgmtRecord.prev_unpaid_total;
    mgmtRecord.total_after_due = mgmtRecord.total_within_due;
    mgmtRecord.total = mgmtRecord.total_within_due;
    const s2 = await saveBillingRecord(mgmtRecord);
    if (s2) saved.push(s2);

  } else if (billingCase === 'D') {
    // 월세+고정관리비 청구서
    const rentMgmtRecord: any = {
      ...base,
      billing_type: 'rent_mgmt',
      electric_fee: 0, gas_fee: 0, water_fee: 0, internet_fee: 0, parking_fee: 0,
      elec_billing_surcharge: 0, gas_billing_surcharge: 0,
      total: base.rent + base.management_fee,
      prev_unpaid_elec: 0, prev_unpaid_gas: 0, prev_unpaid_water: 0, prev_unpaid_other: 0,
      prev_unpaid_total: (base.prev_unpaid_rent || 0) + (base.prev_unpaid_mgmt || 0),
    };
    rentMgmtRecord.total_within_due = rentMgmtRecord.total + rentMgmtRecord.prev_unpaid_total;
    rentMgmtRecord.total_after_due = rentMgmtRecord.total_within_due;
    rentMgmtRecord.total = rentMgmtRecord.total_within_due;
    const s1 = await saveBillingRecord(rentMgmtRecord);
    if (s1) saved.push(s1);

    // 변동관리비 청구서
    const variableRecord: any = {
      ...base,
      billing_type: 'variable',
      rent: 0, management_fee: 0,
      total: base.electric_fee + base.gas_fee + base.water_fee + base.internet_fee + base.parking_fee + base.elec_billing_surcharge + base.gas_billing_surcharge,
      prev_unpaid_rent: 0, prev_unpaid_mgmt: 0,
      prev_unpaid_total: (base.prev_unpaid_elec || 0) + (base.prev_unpaid_gas || 0) + (base.prev_unpaid_water || 0) + (base.prev_unpaid_other || 0),
    };
    variableRecord.total_within_due = variableRecord.total + variableRecord.prev_unpaid_total;
    variableRecord.total_after_due = variableRecord.total_within_due;
    variableRecord.total = variableRecord.total_within_due;
    const s2 = await saveBillingRecord(variableRecord);
    if (s2) saved.push(s2);

  } else {
    // A, B2, C, E → 1건
    base.billing_type = 'full';
    const s = await saveBillingRecord(base);
    if (s) saved.push(s);
  }

  return saved;
};

/**
 * 케이스별 메시지 생성 (항목 필터링)
 * C: 변동관리비만 / E: 월세 제외 / B2: 구분 표시 / A: 전부 합산
 * B1, D는 billing_type별로 이미 분리되어 있으므로 그대로 생성
 */
export const generateCaseMessage = (record: any, tenant: any, building: any, roomNumber: string, accountInfo: AccountInfo, billingCase: string): string => {
  // B1, D는 billing_type으로 이미 분리된 record이므로 그대로 메시지 생성
  if (billingCase === 'B1' || billingCase === 'D') {
    return generateSimpleMessage(record, tenant, building, roomNumber, accountInfo);
  }

  // C: 변동관리비만 → 월세/관리비 0으로 메시지 생성
  if (billingCase === 'C') {
    const filtered = { ...record, rent: 0, management_fee: 0 };
    return generateSimpleMessage(filtered, tenant, building, roomNumber, accountInfo);
  }

  // E: 월세 안 보냄 → 월세 0으로 메시지 생성
  if (billingCase === 'E') {
    const filtered = { ...record, rent: 0 };
    return generateSimpleMessage(filtered, tenant, building, roomNumber, accountInfo);
  }

  // A, B2: 전부 포함
  return generateSimpleMessage(record, tenant, building, roomNumber, accountInfo);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. 청구서 메시지 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fmtMoney = (n: number): string => n ? n.toLocaleString() : '0';
const fmtDate = (d: string | null): string => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
};

/**
 * 간단 메시지 (SMS/카카오) 생성 — 실 운영 데이터 300건+ 기반 업그레이드
 */
export const generateSimpleMessage = (record: any, tenant: any, building: any, roomNumber: string, accountInfo: AccountInfo, opts: MessageOpts = {}): string => {
  const L: string[] = [];
  const bName = building.buildingName || building.building_name || record.building_name || '';
  const tName = tenant.name || record.tenant_name || '';
  const rNum = roomNumber || record.room_number || '';
  const contactPhone = building.contactPhone || building.contact_phone || '010-4456-4150';
  const aliasPrefix = building.depositAliasPrefix || building.deposit_alias_prefix || '';
  const billingType = opts.billingType || record.billing_type || 'full';
  const isFirstMonth = opts.isFirstMonth || false;
  const isDirectPay = opts.isDirectPayUtility || false;

  // 합계 계산
  const total = record.total || 0;
  const prepaid = record.prepaid_credit || 0; // 음수

  // ── 헤더 ──
  const isManagementOnly = !record.rent && record.management_fee > 0 && !record.electric_fee && !record.gas_fee;
  const headerSuffix = isManagementOnly ? '관리비 청구서' : '월세&공과금 청구서';
  L.push(`[${bName} ${headerSuffix}]`);
  L.push(`${rNum}호 ${tName}님`);
  L.push('');
  L.push(`[납부문의] : ${contactPhone}`);
  L.push(`[일반문의] : 02-549-4150`);
  L.push('');

  // ── 단일계좌 (A, full) ──
  if (billingType === 'full') {
    // 0원 표시
    if (total + prepaid <= 0) {
      L.push(`■납부할 금액 : 0원`);
      L.push(`▶금월 납부할 금액이 없음◀`);
    } else {
      L.push(`■납부할 금액 : ${fmtMoney(total + prepaid)}원`);
    }
    if (accountInfo?.account) L.push(`${accountInfo.bank} ${accountInfo.account} ${accountInfo.holder}`);
    if (aliasPrefix) L.push(`\n[입금자명을 '${aliasPrefix}${rNum}'로 입금 부탁드립니다.]`);
    L.push('');
    L.push('<상세내역>');
    L.push('');

    // 선납/미납
    if (prepaid < 0) L.push(`·선납 : ${fmtMoney(prepaid)}`);
    if (record.prev_unpaid_total > 0) L.push(`·미납 : ${fmtMoney(record.prev_unpaid_total)}`);
    if (!prepaid && !record.prev_unpaid_total) L.push(`·미납 : 0`);

    // 항목
    L.push(`·월세 : ${fmtMoney(record.rent || 0)}`);
    L.push(`·관리비 : ${fmtMoney(record.management_fee || 0)}`);
    if (record.vat > 0) L.push(`·부가세 : ${fmtMoney(record.vat)}`);
    L.push(`·수도 : ${record.water_fee > 0 ? fmtMoney(record.water_fee) : '0'}`);
    L.push(`·케이블 : ${record.internet_fee > 0 ? fmtMoney(record.internet_fee) : '0'}`);

    // 연체수수료
    if (record.late_fee > 0) {
      L.push(`·연체수수료 미납 : ${fmtMoney(record.late_fee)}`);
    } else if (!isManagementOnly && !isFirstMonth && !isDirectPay) {
      L.push(`·연체수수료 미납 : 0`);
    }

    // 전기/가스
    if (isFirstMonth) {
      L.push('');
      L.push('(전기 가스는 다음달 부터 청구)');
    } else if (isDirectPay) {
      L.push('');
      L.push('(전기 가스는 개별 납부)');
    } else {
      // 전기
      if (record.electric_fee > 0 || opts.meterElec) {
        const me = opts.meterElec || {};
        const elecTotal = (record.electric_fee || 0) + (record.elec_billing_surcharge || 0);
        L.push('');
        L.push(`·전기 : ${fmtMoney(elecTotal)}원`);
        if (me.periodStart && me.periodEnd) {
          L.push(`${me.periodStart}(${me.prevReading || ''})~${me.periodEnd}(${me.currReading || ''})`);
          L.push(`사용량:${me.usage || 0}`);
        }
      } else if (record.electric_fee === 0 && !isFirstMonth && !isDirectPay) {
        L.push('');
        L.push(`·전기 : 0원`);
        L.push(`청구서가 나오지 않음`);
      }

      // 가스
      if (record.gas_fee > 0 || opts.meterGas) {
        const mg = opts.meterGas || {};
        const gasTotal = (record.gas_fee || 0) + (record.gas_billing_surcharge || 0);
        L.push('');
        L.push(`·가스 : ${fmtMoney(gasTotal)}원`);
        if (mg.periodStart && mg.periodEnd) {
          L.push(`${mg.periodStart}(${mg.prevReading || ''})~${mg.periodEnd}(${mg.currReading || ''})`);
          L.push(`사용량:${mg.usage || 0}`);
        }
      } else if (record.gas_fee === 0 && !isFirstMonth && !isDirectPay) {
        L.push('');
        L.push(`·가스 : 0원`);
        L.push(`청구서가 나오지 않음`);
      }
    }
  }

  // ── 2통 분리: B1 (rent / mgmt) ──
  if (billingType === 'rent') {
    L.push(`①월세 : ${fmtMoney(total + prepaid)}원`);
    if (accountInfo?.account) L.push(`${accountInfo.bank} ${accountInfo.account} ${accountInfo.holder}`);
    if (aliasPrefix) L.push(`\n[입금자명을 '${aliasPrefix}${rNum}'로 입금 부탁드립니다.]`);
    L.push('');
    L.push('<내역①>');
    L.push('');
    if (prepaid < 0) L.push(`·선납월세 : ${fmtMoney(prepaid)}`);
    if (record.prev_unpaid_total > 0) L.push(`·미납월세 : ${fmtMoney(record.prev_unpaid_total)}`);
    if (!prepaid && !record.prev_unpaid_total) L.push(`·미납월세 : 0`);
    L.push(`·월세 : ${fmtMoney(record.rent || 0)}`);
  }

  if (billingType === 'mgmt') {
    L.push(`②관리비&공과금 : ${fmtMoney(total + prepaid)}원`);
    if (accountInfo?.account) L.push(`${accountInfo.bank} ${accountInfo.account} ${accountInfo.holder}`);
    if (aliasPrefix) L.push(`\n[입금자명을 '${aliasPrefix}${rNum}'로 입금 부탁드립니다.]`);
    L.push('');
    L.push('<내역②>');
    L.push('');
    if (prepaid < 0) L.push(`·선납 관리비&공과금 : ${fmtMoney(prepaid)}`);
    if (record.prev_unpaid_total > 0) L.push(`·미납 관리비&공과금 : ${fmtMoney(record.prev_unpaid_total)}`);
    if (!prepaid && !record.prev_unpaid_total) L.push(`·미납 관리비&공과금 : 0`);
    L.push(`·관리비 : ${fmtMoney(record.management_fee || 0)}`);
    L.push(`·수도 : ${record.water_fee > 0 ? fmtMoney(record.water_fee) : '0'}`);
    L.push(`·케이블 : ${record.internet_fee > 0 ? fmtMoney(record.internet_fee) : '0'}`);
    if (record.late_fee > 0) L.push(`·연체수수료 미납 : ${fmtMoney(record.late_fee)}`);
    else L.push(`·연체수수료 미납 : 0`);

    // 전기/가스 (B1의 mgmt에 포함)
    if (isFirstMonth) {
      L.push('');
      L.push('(전기 가스는 다음달 부터 청구)');
    } else {
      const me = opts.meterElec || {};
      const mg = opts.meterGas || {};
      if (record.electric_fee > 0 || me.periodStart) {
        const elecTotal = (record.electric_fee || 0) + (record.elec_billing_surcharge || 0);
        L.push('');
        L.push(`·전기 : ${fmtMoney(elecTotal)}원`);
        if (me.periodStart) L.push(`${me.periodStart}(${me.prevReading || ''})~${me.periodEnd}(${me.currReading || ''})`);
        if (me.usage != null) L.push(`사용량:${me.usage}`);
      }
      if (record.gas_fee > 0 || mg.periodStart) {
        const gasTotal = (record.gas_fee || 0) + (record.gas_billing_surcharge || 0);
        L.push('');
        L.push(`·가스 : ${fmtMoney(gasTotal)}원`);
        if (mg.periodStart) L.push(`${mg.periodStart}(${mg.prevReading || ''})~${mg.periodEnd}(${mg.currReading || ''})`);
        if (mg.usage != null) L.push(`사용량:${mg.usage}`);
      }
    }
  }

  // ── 2통 분리: D (rent_mgmt / variable) ──
  if (billingType === 'rent_mgmt') {
    L.push(`①월세&관리비 : ${fmtMoney(total + prepaid)}원`);
    if (accountInfo?.account) L.push(`${accountInfo.bank} ${accountInfo.account} ${accountInfo.holder}`);
    if (aliasPrefix) L.push(`\n[입금자명을 '${aliasPrefix}${rNum}'로 입금 부탁드립니다.]`);
    L.push('');
    L.push('<내역①>');
    L.push('');
    if (prepaid < 0) L.push(`·선납 월세&관리비 : ${fmtMoney(prepaid)}`);
    if (record.prev_unpaid_total > 0) L.push(`·미납 월세&관리비 : ${fmtMoney(record.prev_unpaid_total)}`);
    if (!prepaid && !record.prev_unpaid_total) L.push(`·미납 월세&관리비 : 0`);
    L.push('');
    L.push(`·월세 : ${fmtMoney(record.rent || 0)}`);
    L.push(`·관리비 : ${fmtMoney(record.management_fee || 0)}`);
    L.push(`·수도 : ${record.water_fee > 0 ? fmtMoney(record.water_fee) : '0'}`);
    L.push(`·케이블 : ${record.internet_fee > 0 ? fmtMoney(record.internet_fee) : '0'}`);
    if (record.late_fee > 0) L.push(`·연체수수료 미납 : ${fmtMoney(record.late_fee)}`);
    else L.push(`·연체수수료 미납 : 0`);
  }

  if (billingType === 'variable') {
    L.push(`②전기&가스&기타 : ${fmtMoney(total + prepaid)}원`);
    if (accountInfo?.account) L.push(`${accountInfo.bank} ${accountInfo.account} ${accountInfo.holder}`);
    if (aliasPrefix) L.push(`\n[입금자명을 '${aliasPrefix}${rNum}'로 입금 부탁드립니다.]`);
    L.push('');
    L.push('<내역②>');
    L.push('');
    if (prepaid < 0) L.push(`·선납 전기&가스 : ${fmtMoney(prepaid)}`);
    if (record.prev_unpaid_total > 0) L.push(`·미납 전기&가스 : ${fmtMoney(record.prev_unpaid_total)}`);
    if (!prepaid && !record.prev_unpaid_total) L.push(`·미납 전기&가스 : 0`);

    const me = opts.meterElec || {};
    const mg = opts.meterGas || {};
    if (record.electric_fee > 0 || me.periodStart) {
      L.push(`·전기 : ${fmtMoney(record.electric_fee || 0)}원`);
      if (me.periodStart) L.push(`${me.periodStart}(${me.prevReading || ''})~${me.periodEnd}(${me.currReading || ''})`);
      if (me.usage != null) L.push(`사용량:${me.usage}`);
    }
    if (record.gas_fee > 0 || mg.periodStart) {
      L.push('');
      L.push(`·가스 : ${fmtMoney(record.gas_fee || 0)}원`);
      if (mg.periodStart) L.push(`${mg.periodStart}(${mg.prevReading || ''})~${mg.periodEnd}(${mg.currReading || ''})`);
      if (mg.usage != null) L.push(`사용량:${mg.usage}`);
    }
  }

  // ── 푸터 ──
  L.push('');
  if (!isManagementOnly && !isDirectPay) {
    L.push('[5일연체시 5%의 연체수수료가 부과됩니다.]');
    L.push('');
  }

  // 납부일
  if (record.due_date) {
    const dd = new Date(record.due_date);
    const dm = dd.getMonth() + 1;
    const day = dd.getDate();
    // 말일 처리
    const lastDay = new Date(dd.getFullYear(), dm, 0).getDate();
    const dayStr = day >= lastDay ? '말일' : `${day}일`;
    L.push(`납부일은 ${dm}/${dayStr} 입니다.`);
  }

  return L.join('\n');
};

/**
 * 블럭 계좌 설정에서 입금 계좌 정보를 추출합니다.
 */
export const resolveAccountInfo = (building: any): AccountInfo => {
  // rent_account_target 기준으로 계좌 결정
  const target = building.rentAccountTarget || building.rent_account_target || 'houseman';
  if (target === 'houseman' || target === 'hm') {
    return {
      bank: '하나',
      account: building.housemanBillingAccount || building.houseman_billing_account || '225-910048-15704',
      holder: '박종호(하우스맨)',
    };
  }
  // owner_1
  if (target === 'owner_1' || target === 'owner1') {
    return {
      bank: building.billingAccount1Bank || building.billing_account_1_bank || '',
      account: building.billingAccount1 || building.billing_account_1 || '',
      holder: building.billingAccount1Holder || building.billing_account_1_holder || '',
    };
  }
  // owner_2
  if (target === 'owner_2' || target === 'owner2') {
    return {
      bank: building.billingAccount2Bank || building.billing_account_2_bank || '',
      account: building.billingAccount2 || building.billing_account_2 || '',
      holder: building.billingAccount2Holder || building.billing_account_2_holder || '',
    };
  }
  // fallback
  return { bank: '하나', account: '225-910048-15704', holder: '박종호(하우스맨)' };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. 수금관리 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 연체료 해제 + billing_records 수정 + 메시지 재생성
 */
export const waiveLateFee = async (recordId: number, _building: any = {}, _tenant: any = {}): Promise<{ success: boolean; record: any | null }> => {
  try {
    const data = readAppData();
    const records: any[] = data.hm_billingRecords || [];
    const idx = records.findIndex((r: any) => r.id === recordId);
    if (idx === -1) return { success: false, record: null };

    const record = records[idx];
    const lateFee = record.late_fee || 0;
    records[idx] = {
      ...record,
      late_fee: 0,
      late_fee_waived: true,
      late_fee_waived_amount: lateFee,
      total: (record.total || 0) - lateFee,
      total_within_due: (record.total_within_due || 0) - lateFee,
      total_after_due: (record.total_after_due || 0) - lateFee,
      updated_at: new Date().toISOString(),
    };
    writeAppKey('hm_billingRecords', records);
    return { success: true, record: records[idx] };
  } catch { return { success: false, record: null }; }
};

/**
 * 위험도 계산 (단기만)
 */
export const calcRiskScore = (record: any, paidAmount = 0): RiskScoreResult => {
  const total = record.total || 0;
  if (total <= 0) return { score: 0, label: '정상' };

  const balance = total - paidAmount;
  if (balance <= 0) return { score: 0, label: '완납' };

  const dailyCharge = total / 30;
  if (dailyCharge <= 0) return { score: 0, label: '정상' };

  const balanceDays = balance / dailyCharge; // 잔액이 몇 일분인지

  // 연체일수
  const dueDate = record.due_date ? new Date(record.due_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueDays = dueDate ? Math.max(0, Math.floor((today.getTime() - new Date(dueDate).getTime()) / 86400000)) : 0;

  if (overdueDays <= 0) return { score: 0, label: '납기내' };

  // 위험도 = 잔액일수 / 연체일수 (1 이하면 커버 가능, 높을수록 위험)
  const score = Math.round((balanceDays / overdueDays) * 100) / 100;

  let label = '정상';
  if (score >= 2) label = '위험';
  else if (score >= 1.5) label = '주의';
  else if (score >= 1) label = '관찰';

  return { score, label, overdueDays, balanceDays: Math.round(balanceDays) };
};

/**
 * 단전 단계 판별 (단기만, 납부일 기준)
 */
export const getPowerCutStage = (record: any): PowerCutStageResult => {
  const dueDate = record.due_date ? new Date(record.due_date) : null;
  if (!dueDate) return { stage: 'none', day: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = Math.floor((today.getTime() - new Date(dueDate).getTime()) / 86400000);

  if (day >= 7) return { stage: 'cut', day };
  if (day >= 6) return { stage: 'notice', day };
  if (day >= 5) return { stage: 'warning', day };
  return { stage: 'none', day };
};

// ── collection_notes CRUD ──

/**
 * 수금 노트 저장
 */
export const saveCollectionNote = async (note: any): Promise<any | null> => {
  try {
    const data = readAppData();
    const notes: any[] = data.hm_collectionNotes || [];
    const saved = { ...note, id: note.id || nextId(), created_at: new Date().toISOString() };
    notes.push(saved);
    writeAppKey('hm_collectionNotes', notes);
    return saved;
  } catch { return null; }
};

/**
 * 특정 호실의 수금 노트 히스토리 조회
 */
export const getCollectionNotes = async (roomId: number): Promise<any[]> => {
  const data = readAppData();
  const notes: any[] = data.hm_collectionNotes || [];
  return notes
    .filter((n: any) => n.room_id === roomId)
    .sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''));
};

/**
 * 오늘 약속인 건 조회 (스케줄러용)
 */
export const getTodayPromises = async (): Promise<any[]> => {
  const data = readAppData();
  const notes: any[] = data.hm_collectionNotes || [];
  const today = new Date().toISOString().slice(0, 10);
  return notes
    .filter((n: any) => n.note_type === 'promise' && n.promised_date?.slice(0, 10) === today)
    .sort((a: any, b: any) => (a.promised_date || '').localeCompare(b.promised_date || ''));
};
