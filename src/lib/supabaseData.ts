// @ts-nocheck
import { supabase } from './supabase';

/**
 * 주민번호 → 앞6자리+뒤1자리만 저장 (예: "920315-1234567" → "920315-1")
 * 전체 주민번호 저장 금지. 생년월일+성별 구분용.
 */
function truncateResidentNumber(val) {
  if (!val) return null;
  const cleaned = String(val).replace(/\s/g, '');
  // 이미 7자리 이하면 그대로
  if (cleaned.replace('-', '').length <= 7) return cleaned;
  // 하이픈 포함: "920315-1234567" → "920315-1"
  const match = cleaned.match(/^(\d{6})-?(\d)/);
  if (match) return `${match[1]}-${match[2]}`;
  return cleaned.slice(0, 7);
}

// Supabase에서 건물 목록 가져오기
export async function fetchBuildings() {
  const { data, error } = await supabase
    .from('buildings')
    .select('*')
    .order('id');
  if (error) { console.error('buildings 로딩 실패:', error); return []; }
  return data;
}

// Supabase에서 호실 목록 가져오기 (건물 정보 포함)
export async function fetchRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*, buildings(building_name, building_nickname)')
    .order('id');
  if (error) { console.error('rooms 로딩 실패:', error); return []; }
  return data;
}

// Supabase에서 임차인 목록 가져오기 (호실+건물 정보 포함)
export async function fetchTenants() {
  const { data, error } = await supabase
    .from('tenants')
    .select('*, rooms(room_number, building_id, buildings(building_name, building_nickname))')
    .eq('is_active', true)
    .order('id');
  if (error) { console.error('tenants 로딩 실패:', error); return []; }
  return data;
}

// ── 건물 저장 (UI → Supabase) — 등록/수정 공통 ──

/**
 * UI 필드명 → Supabase 컬럼명 매핑 (단일 필드 변환용)
 * 새 컬럼 추가 시 여기만 수정하면 등록/수정 둘 다 적용됨
 */
export const BUILDING_FIELD_MAP = {
  // ── 기본정보 ──
  name:                'building_name',
  buildingName:        'building_name',
  nickname:            'building_nickname',
  buildingNickname:    'building_nickname',
  address:             'address_road',
  roadAddress:         'address_road',
  addressRoad:         'address_road',
  addressOld:          'address_old',
  entrancePw:          'entrance_door_password',
  entranceDoorPassword:'entrance_door_password',
  areaTotal:           'building_area_total',
  buildingAreaTotal:   'building_area_total',
  approvalDate:        'approved_date',
  approvedDate:        'approved_date',
  contractStartDate:   'contract_start_date',
  startDate:           'contract_start_date',
  // ── 건물유형 boolean ──
  isShortTermRental:   'is_short_term_rental',
  isLongTermRental:    'is_long_term_rental',
  isCommercial:        'is_commercial',
  isManagementAgency:  'is_management_agency',
  isCorporateFacility: 'is_corporate_facility',
  isActive:            'is_active',
  // ── 수수료 ──
  managementFeeType:   'management_fee_type',
  managementFeeRate:   'management_fee_rate',
  managementFeeFixedAmount: 'management_fee_fixed_amount',
  // ── 설정/관리 ──
  penalty7daysOwnership: 'penalty_7days_ownership',
  standardLease:       'is_standard_contract',
  isStandardContract:  'is_standard_contract',
  cctvCount:           'cctv_count',
  cctvRoomLocation:    'cctv_room_location',
  cctvInstallInfo:     'cctv_install_info',
  isParkingAvailable:  'is_parking_available',
  parkingTotal:        'parking_total_spaces',
  parkingTotalSpaces:  'parking_total_spaces',
  parkingGatePassword: 'parking_gate_password',
  electricMeterBoxPassword: 'electric_meter_box_password',
  rooftopAccessMethod: 'rooftop_access_method',
  visitCycle:          'monthly_inspection_count',
  monthlyInspectionCount: 'monthly_inspection_count',
  fireInspectionSelf:  'is_fire_inspection_self',
  isFireInspectionSelf:'is_fire_inspection_self',
  isResidentRegistrationAllowed: 'is_resident_registration_allowed',
  isRenthomeWritingAgency: 'is_renthome_writing_agency',
  isStorageAvailable:  'is_storage_available',
  freeRepairLimit:     'free_repair_limit',
  electricCommonCustomerNumber: 'electric_common_customer_number',
  waterCommonCustomerNumber: 'water_common_customer_number',
  electricContractPower: 'electric_contract_power',
  internetProvider:    'internet_provider',
  septicTankCleaningMonth1: 'septic_tank_cleaning_month_1',
  septicTankCleaningMonth2: 'septic_tank_cleaning_month_2',
  // ── 청구/정산 설정 ──
  rentBillingType:     'rent_billing_type',
  managementFeeBillingType: 'management_fee_billing_type',
  waterBillingType:    'water_billing_type',
  internetBillingType: 'internet_billing_type',
  billingCycle:        'billing_cycle',
  settlementCount:     'settlement_count',
  settlementDay1:      'settlement_day_1',
  settlementDay2:      'settlement_day_2',
  // ── 검침/납부일 설정 (근생) ──
  electricReadingDay:   'electric_reading_day',
  waterReadingDay:      'water_reading_day',
  waterReadingCycle:    'water_reading_cycle',
  rentDueDay:           'rent_due_day',
  mgmtDueDay:           'mgmt_due_day',
  mgmtBillIssueDay:     'mgmt_bill_issue_day',
  // ── 계약서 특약사항 (건물유형별) ──
  contractSpecialTermsShortTerm:  'contract_special_terms_short_term',
  contractSpecialTermsLongTerm:   'contract_special_terms_long_term',
  contractSpecialTermsCommercial: 'contract_special_terms_commercial',
  // ── 건물주 1 ──
  ownerName:           'owner_name',
  ownerPhone:          'owner_phone',
  ownerResidentNumber: 'owner_resident_number',
  ownerEmail:          'owner_email',
  ownerEmail2:         'owner_email_2',
  ownerHomeAddress:    'owner_home_address',
  ownerHomeAddressDetail: 'owner_home_address_detail',
  ownerBusinessRegistrationNumber: 'owner_business_registration_number',
  ownerBusinessName:   'owner_business_name',
  ownerBusinessAddress:'owner_business_address',
  ownerBusinessType:   'owner_business_type',
  ownerBusinessItem:   'owner_business_item',
  ownerEntityType:     'owner_entity_type',
  // ── 건물주 2 ──
  owner2Name:          'owner_2_name',
  owner2Phone:         'owner_2_phone',
  owner2ResidentNumber:'owner_2_resident_number',
  owner2Email:         'owner_2_email',
  owner2HomeAddress:   'owner_2_home_address',
  owner2HomeAddressDetail: 'owner_2_home_address_detail',
  // ── 건물주 3 ──
  owner3Name:          'owner_3_name',
  owner3Phone:         'owner_3_phone',
  owner3ResidentNumber:'owner_3_resident_number',
  owner3Email:         'owner_3_email',
  owner3HomeAddress:   'owner_3_home_address',
  owner3HomeAddressDetail: 'owner_3_home_address_detail',
  // ── 공동소유 메모 ──
  coOwnerMemo:         'co_owner_memo',
  // ── 담당자/소장 ──
  contactPersonName:   'contact_person_name',
  contactPersonPhone:  'contact_person_phone',
  contactPersonEmail:  'contact_person_email',
  isContactPersonPrimary: 'is_contact_person_primary',
  siteManagerName:     'site_manager_name',
  siteManagerPhone:    'site_manager_phone',
  siteManagerEmail:    'site_manager_email',
  // ── 블럭 방식 계좌 타겟 (항목별 어느 계좌로 입금하는지) ──
  rentAccountTarget:    'rent_account_target',
  managementFeeAccountTarget:    'management_fee_account_target',
  utilityAccountTarget: 'utility_account_target',
  electricGasAccountTarget: 'electric_gas_account_target',
  depositAccountTarget: 'deposit_account_target',
  depositManagementAmount: 'deposit_management_amount',
  // ── 하우스맨 청구용 계좌 ──
  housemanBillingAccount: 'houseman_billing_account',
  // ── 청구용 건물주 계좌 ──
  billingAccount1:       'billing_account_1',
  billingAccount1Bank:   'billing_account_1_bank',
  billingAccount1Holder: 'billing_account_1_holder',
  billingAccount2:       'billing_account_2',
  billingAccount2Bank:   'billing_account_2_bank',
  billingAccount2Holder: 'billing_account_2_holder',
  billingAccount3:       'billing_account_3',
  billingAccount3Bank:   'billing_account_3_bank',
  billingAccount3Holder: 'billing_account_3_holder',
  // ── 정산용 계좌 ──
  settlementAccount1:       'settlement_account_1',
  settlementAccount1Bank:   'settlement_account_1_bank',
  settlementAccount1Holder: 'settlement_account_1_holder',
  settlementAccount2:       'settlement_account_2',
  settlementAccount2Bank:   'settlement_account_2_bank',
  settlementAccount2Holder: 'settlement_account_2_holder',
  // ── 정산 분배 ──
  settlementSplitType:  'settlement_split_type',
  settlementSplitValue: 'settlement_split_value',
  // ── 문서 URL ──
  fireInsuranceDocumentUrl:      'fire_insurance_document_url',
  documentBuildingRegisterUrl:   'document_building_register_url',
  documentManagementContractUrl: 'document_management_contract_url',
  documentBusinessRegistrationUrl: 'document_business_registration_url',
  documentCompletionDrawingUrl:  'document_completion_drawing_url',
  documentEtc1Url:               'document_etc_1_url',
  documentEtc2Url:               'document_etc_2_url',
  documentEtc3Url:               'document_etc_3_url',
  // ── 메모 ──
  notes:            'memo',
  buildingNotes:    'memo',
  memo:             'memo',
};

/**
 * UI 값 → Supabase 값 변환 (타입/형식 맞추기)
 */
export function convertBuildingValue(sbCol, val) {
  // boolean 필드들
  const BOOL_COLS = [
    'is_short_term_rental', 'is_long_term_rental', 'is_commercial',
    'is_management_agency', 'is_corporate_facility', 'is_active',
    'is_fire_inspection_self', 'is_resident_registration_allowed',
    'is_renthome_writing_agency', 'is_storage_available',
    'is_contact_person_primary', 'is_parking_available',
  ];
  if (BOOL_COLS.includes(sbCol)) return !!val;

  if (sbCol === 'is_standard_contract') return typeof val === 'string' ? val === '사용' : !!val;

  // 정수 필드들
  const INT_COLS = [
    'cctv_count', 'parking_total_spaces', 'free_repair_limit',
    'settlement_count', 'settlement_day_1', 'settlement_day_2',
    'septic_tank_cleaning_month_1', 'septic_tank_cleaning_month_2',
    'settlement_split_value',
    'electric_reading_day', 'water_reading_day',
    'rent_due_day', 'mgmt_due_day', 'mgmt_bill_issue_day',
  ];
  if (INT_COLS.includes(sbCol)) return parseInt(val) || 0;

  // 금액 필드 (콤마 제거)
  const MONEY_COLS = ['deposit_management_amount', 'management_fee_fixed_amount'];
  if (MONEY_COLS.includes(sbCol)) return parseInt(String(val).replace(/,/g, '')) || 0;

  if (sbCol === 'monthly_inspection_count') return typeof val === 'string' ? (parseInt(val.replace(/\D/g, '')) || null) : (parseInt(val) || null);
  if (sbCol === 'building_area_total') return val ? parseFloat(val) : null;
  if (sbCol === 'management_fee_rate') return parseFloat(val) || 0;
  // 주민번호: 7자리로 잘라내기
  const RESIDENT_COLS = ['owner_resident_number', 'owner_2_resident_number', 'owner_3_resident_number'];
  if (RESIDENT_COLS.includes(sbCol)) return truncateResidentNumber(val);
  return val || null;
}

/**
 * UI patch 객체 → Supabase patch 변환 (부분 수정용)
 * 예: { entrancePw: "1234" } → { entrance_door_password: "1234" }
 */
export function convertBuildingPatch(uiPatch) {
  const sbPatch = {};
  for (const [uiKey, val] of Object.entries(uiPatch)) {
    const sbCol = BUILDING_FIELD_MAP[uiKey];
    if (sbCol) sbPatch[sbCol] = convertBuildingValue(sbCol, val);
  }
  return sbPatch;
}

/**
 * UI regForm(전체) → Supabase row 변환 (신규 등록용)
 */
function regFormToSupabase(regForm) {
  // 단일 필드 매핑으로 변환 가능한 것들
  const base = convertBuildingPatch(regForm);

  // 등록 시에만 필요한 추가 필드 (매핑 테이블에 없는 것들)
  return {
    ...base,
    building_name: regForm.name || regForm.buildingName || null,
    // 건물유형 boolean
    is_short_term_rental: !!regForm.isShortTermRental,
    is_long_term_rental: !!regForm.isLongTermRental,
    is_commercial: !!regForm.isCommercial,
    is_management_agency: !!regForm.isManagementAgency,
    is_corporate_facility: !!regForm.isCorporateFacility,
    // 건물주 1 (new field names from BuildingDetailPage structure)
    owner_name: regForm.ownerName || null,
    owner_phone: regForm.ownerPhone || null,
    owner_resident_number: truncateResidentNumber(regForm.ownerResidentNumber),
    owner_home_address: regForm.ownerHomeAddress || null,
    owner_email: regForm.ownerEmail || null,
    owner_email_2: regForm.ownerEmail2 || null,
    // 사업자 정보
    owner_business_registration_number: regForm.ownerBusinessRegistrationNumber || null,
    owner_business_name: regForm.ownerBusinessName || null,
    owner_business_address: regForm.ownerBusinessAddress || null,
    owner_business_type: regForm.ownerBusinessType || null,
    owner_business_item: regForm.ownerBusinessItem || null,
    owner_entity_type: regForm.ownerEntityType || null,
    // 건물주 2
    ...(regForm.owner2Name ? {
      owner_2_name: regForm.owner2Name || null,
      owner_2_phone: regForm.owner2Phone || null,
      owner_2_resident_number: truncateResidentNumber(regForm.owner2ResidentNumber),
      owner_2_home_address: regForm.owner2HomeAddress || null,
      owner_2_email: regForm.owner2Email || null,
    } : {}),
    // 건물주 3
    ...(regForm.owner3Name ? {
      owner_3_name: regForm.owner3Name || null,
      owner_3_phone: regForm.owner3Phone || null,
      owner_3_resident_number: truncateResidentNumber(regForm.owner3ResidentNumber),
      owner_3_home_address: regForm.owner3HomeAddress || null,
      owner_3_email: regForm.owner3Email || null,
    } : {}),
  };
}

/**
 * 건물 신규 등록 → Supabase INSERT
 */
export async function insertBuilding(regForm) {
  const row = regFormToSupabase(regForm);
  const { data, error } = await supabase
    .from('buildings')
    .insert(row)
    .select()
    .single();
  if (error) { console.error('건물 등록 실패:', error); return null; }
  return data;
}

/**
 * 변경 이력 기록 (audit_logs)
 */
async function writeAuditLog(tableName, recordId, action, changedFields, changedBy) {
  try {
    await supabase.from('audit_logs').insert({
      table_name: tableName,
      record_id: recordId,
      action,
      changed_fields: changedFields || {},
      changed_by: changedBy || null,
    });
  } catch (e) { console.warn('[audit] 기록 실패:', e); }
}

/**
 * 건물 부분 수정 → Supabase UPDATE (patch 방식)
 */
export async function updateBuildingPatch(buildingId, uiPatch) {
  const sbPatch = convertBuildingPatch(uiPatch);
  if (Object.keys(sbPatch).length === 0) return null;
  const { data, error } = await supabase
    .from('buildings')
    .update(sbPatch)
    .eq('id', buildingId)
    .select()
    .single();
  if (error) { console.error('건물 수정 실패:', error); return null; }
  writeAuditLog('buildings', buildingId, 'update', sbPatch);
  return data;
}

/**
 * 건물 이름으로 부분 수정 → Supabase UPDATE (supabaseId 없을 때 fallback)
 */
export async function updateBuildingDataByName(buildingName, uiPatch) {
  const sbPatch = convertBuildingPatch(uiPatch);
  if (Object.keys(sbPatch).length === 0) return null;

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id')
    .eq('building_name', buildingName)
    .limit(1);

  if (!buildings?.length) {
    console.warn('[Supabase] updateBuildingDataByName: 건물 못 찾음:', buildingName);
    return null;
  }

  const { data, error } = await supabase
    .from('buildings')
    .update(sbPatch)
    .eq('id', buildings[0].id)
    .select()
    .single();
  if (error) { console.error('건물 수정 실패 (byName):', error); return null; }
  return data;
}

/**
 * 건물 영구 삭제 → Supabase DELETE
 * FK CASCADE: rooms, tenants, bank_transactions, partners, staff_assignments, vendors 전부 함께 삭제
 */
export async function deleteBuilding(buildingId) {
  const { error } = await supabase
    .from('buildings')
    .delete()
    .eq('id', buildingId);
  if (error) { console.error('건물 삭제 실패:', error); return false; }
  return true;
}

// ── 건물 담당자 배정 (building_staff_assignments) ──

/**
 * 건물의 담당자 목록 가져오기
 * @returns [{assignment_role, assigned_name, assigned_phone, assignment_note}, ...]
 */
export async function fetchBuildingStaff(buildingId) {
  const { data, error } = await supabase
    .from('building_staff_assignments')
    .select('*')
    .eq('building_id', buildingId);
  if (error) { console.error('담당자 로딩 실패:', error); return []; }
  return data;
}

/**
 * 담당자 배정/변경 → UPSERT (있으면 UPDATE, 없으면 INSERT)
 * 한 건물에 같은 역할은 1명만 (UNIQUE: building_id + assignment_role)
 */
export async function upsertBuildingStaff(buildingId, role, name, phone) {
  const { data, error } = await supabase
    .from('building_staff_assignments')
    .upsert({
      building_id: buildingId,
      assignment_role: role,
      assigned_name: name || null,
      assigned_phone: phone || null,
    }, { onConflict: 'building_id,assignment_role' })
    .select()
    .single();
  if (error) { console.error('담당자 배정 실패:', error); return null; }
  return data;
}

/**
 * 호실 일괄 등록 → Supabase INSERT (건물 등록 시 호실도 함께)
 */
export async function insertRooms(buildingId, roomList) {
  if (!roomList || roomList.length === 0) return [];
  const rows = roomList.map(r => ({
    building_id: buildingId,
    room_number: r.room,
    room_layout: r.roomType || null,
    area: r.area ? parseFloat(r.area) : null,
    standard_deposit: r.standardDeposit ? parseInt(String(r.standardDeposit).replace(/,/g, '')) : null,
    standard_rent: r.standardRent ? parseInt(String(r.standardRent).replace(/,/g, '')) : null,
    standard_management_fee: r.standardManagementFee ? parseInt(String(r.standardManagementFee).replace(/,/g, '')) : null,
    standard_water_fee: r.standardWaterFee === '포함' ? 0 : (r.standardWaterFee ? parseInt(String(r.standardWaterFee).replace(/,/g, '')) : null),
    standard_internet_fee: r.standardInternetFee === '포함' ? 0 : (r.standardInternetFee ? parseInt(String(r.standardInternetFee).replace(/,/g, '')) : null),
    standard_cleaning_fee: r.standardCleaningFee ? parseInt(String(r.standardCleaningFee).replace(/,/g, '')) : null,
    standard_broker_fee: r.standardBrokerFee ? parseInt(String(r.standardBrokerFee).replace(/,/g, '')) : null,
    electric_customer_number: r.electricCustomerNumber || null,
    gas_customer_number: r.gasCustomerNumber || null,
    is_managed: true,
  }));
  const { data, error } = await supabase
    .from('rooms')
    .insert(rows)
    .select();
  if (error) { console.error('호실 등록 실패:', error); return []; }
  return data;
}

// ── 호실 수정 (UI → Supabase) ──

/**
 * UI 필드명 → rooms 테이블 컬럼명 매핑
 */
export const ROOM_FIELD_MAP = {
  area:           'area',
  roomLayout:     'room_layout',
  standardDeposit:        'standard_deposit',
  standardRent:           'standard_rent',
  standardManagementFee:  'standard_management_fee',
  standardWaterFee:       'standard_water_fee',
  standardInternetFee:    'standard_internet_fee',
  standardCleaningFee:    'standard_cleaning_fee',
  standardParkingFee:     'standard_parking_fee',
  standardBrokerFee:        'standard_broker_fee',
  electricCustomerNumber:         'electric_customer_number',
  gasCustomerNumber:          'gas_customer_number',
  electricGasPaymentType: 'electric_gas_payment_type',
  rentDiscountLimit:      'rent_discount_limit',
  isManaged:              'is_managed',
  waterPaymentType:       'water_payment_type',
  variableManagementFeeMemo: 'variable_management_fee_memo',
  managementFeeBillingTypeOverride: 'management_fee_billing_type',
  waterBillingTypeOverride:         'water_billing_type',
  internetBillingTypeOverride:      'internet_billing_type',
  // 계좌 타겟 (호실별 오버라이드)
  rentAccountTarget:    'rent_account_target',
  managementFeeAccountTarget:    'management_fee_account_target',
  utilityAccountTarget: 'utility_account_target',
  electricGasAccountTarget: 'electric_gas_account_target',
  depositAccountTarget: 'deposit_account_target',
  // 주차/사진
  standardParkingType:          'standard_parking_type',
  standardParkingRemoteDeposit: 'standard_parking_remote_deposit',
  roomPhotoUrls:                'room_photo_urls',
};

/**
 * UI 값 → Supabase 값 변환 (호실)
 */
function convertRoomValue(dbCol, val) {
  const intCols = new Set([
    'standard_deposit', 'standard_rent', 'standard_management_fee', 'standard_water_fee', 'standard_internet_fee',
    'standard_cleaning_fee', 'standard_parking_fee', 'standard_broker_fee', 'rent_discount_limit',
  ]);
  const floatCols = new Set(['area']);

  if (dbCol === 'is_managed') return !!val;
  if (intCols.has(dbCol)) {
    if (val === '포함') return 0;
    return val !== '' && val != null ? (parseInt(String(val).replace(/,/g, '')) || 0) : null;
  }
  if (floatCols.has(dbCol)) return val ? (parseFloat(val) || null) : null;
  return val === '' ? null : (val || null);
}

/**
 * 호실 단건 수정 → Supabase UPDATE
 */
export async function updateRoom(roomId, patch) {
  const dbPatch = {};
  for (const [key, value] of Object.entries(patch)) {
    const dbCol = ROOM_FIELD_MAP[key];
    if (dbCol) dbPatch[dbCol] = convertRoomValue(dbCol, value);
  }
  if (Object.keys(dbPatch).length === 0) return { error: null };

  const { error } = await supabase
    .from('rooms')
    .update(dbPatch)
    .eq('id', roomId);

  if (error) console.error('[Supabase] 호실 수정 실패:', error);
  return { error };
}

/**
 * 건물명 + 호실번호로 rooms.id 찾기
 */
export async function findRoom(buildingName, roomNumber) {
  const { data: blds } = await supabase
    .from('buildings')
    .select('id')
    .eq('building_name', buildingName)
    .limit(1);

  if (!blds?.length) return null;

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id')
    .eq('building_id', blds[0].id)
    .eq('room_number', String(roomNumber))
    .limit(1);

  return rooms?.[0] || null;
}

// ── 임차인 저장 (UI → Supabase) ──

/**
 * 임차인 필드 통합 매핑 (UI 필드명 or DB 컬럼명 → tenants 테이블 컬럼명)
 * UI camelCase 키와 DB snake_case 키 모두 지원
 */
export const TENANT_FIELD_MAP = {
  // ── 기본정보 ──
  name:                           'name',
  phone:                          'phone',
  phonePrevious1:                 'phone_previous_1',
  phonePrevious2:                 'phone_previous_2',
  phone_previous_1:               'phone_previous_1',
  phone_previous_2:               'phone_previous_2',
  ssn:                            'id_number',
  id_number:                      'id_number',
  email:                          'email',
  // ── 계약정보 ──
  moveIn:                         'move_in_date',
  move_in_date:                   'move_in_date',
  expiry:                         'contract_end_date',
  contract_end_date:              'contract_end_date',
  first_move_in_date:             'first_move_in_date',
  move_out_date:                  'move_out_date',
  is_active:                      'is_active',
  // ── 금액 ──
  deposit:                        'deposit',
  rent:                           'rent',
  mgmt:                           'management_fee',
  management_fee:                 'management_fee',
  waterAmount:                    'water_fee',
  water_fee:                      'water_fee',
  cableAmount:                    'internet_fee',
  internet_fee:                   'internet_fee',
  cleaning_fee:                   'cleaning_fee',
  // ── 납부유형 ──
  rentPayType:                    'rent_billing_type',
  rent_billing_type:              'rent_billing_type',
  management_fee_billing_type:    'management_fee_billing_type',
  water_billing_type:             'water_billing_type',
  internet_billing_type:          'internet_billing_type',
  rentDay:                        'payment_due_day',
  payment_due_day:                'payment_due_day',
  mgmtDay:                        'management_fee_due_day',
  management_fee_due_day:         'management_fee_due_day',
  payment_due_day_temp:           'payment_due_day_temp',
  // ── 주차/차량 ──
  carNumber:                      'car_number_1',
  car_number_1:                   'car_number_1',
  carType:                        'car_type_1',
  car_type_1:                     'car_type_1',
  car_number_2:                   'car_number_2',
  car_type_2:                     'car_type_2',
  car_number_3:                   'car_number_3',
  car_type_3:                     'car_type_3',
  car_number_4:                   'car_number_4',
  car_type_4:                     'car_type_4',
  car_number_5:                   'car_number_5',
  car_type_5:                     'car_type_5',
  parking_type_1:                 'parking_type_1',
  parking_type_2:                 'parking_type_2',
  parking_type_3:                 'parking_type_3',
  parking_type_4:                 'parking_type_4',
  parking_type_5:                 'parking_type_5',
  parking_fee_1:                  'parking_fee_1',
  parking_fee_2:                  'parking_fee_2',
  parking_fee_3:                  'parking_fee_3',
  parking_fee_4:                  'parking_fee_4',
  parking_fee_5:                  'parking_fee_5',
  parking_remote_deposit_1:       'parking_remote_deposit_1',
  parking_remote_deposit_2:       'parking_remote_deposit_2',
  parking_remote_deposit_3:       'parking_remote_deposit_3',
  parking_remote_deposit_4:       'parking_remote_deposit_4',
  parking_remote_deposit_5:       'parking_remote_deposit_5',
  // ── 기타 보증금 ──
  other_deposit1_desc:            'other_deposit1_desc',
  other_deposit1_amount:          'other_deposit1_amount',
  other_deposit2_desc:            'other_deposit2_desc',
  other_deposit2_amount:          'other_deposit2_amount',
  // ── 비상연락처 ──
  emergency_contact_name:         'emergency_contact_name',
  emergency_contact_phone:        'emergency_contact_phone',
  emergency_contact_relation:     'emergency_contact_relation',
  // ── 중개 부동산 ──
  broker_name:                    'broker_name',
  broker_phone:                   'broker_phone',
  broker_fee_amount:              'broker_fee_amount',
  // ── 사업자 정보 ──
  business_name:                  'business_name',
  business_address:               'business_address',
  business_type:                  'business_type',
  business_item:                  'business_item',
  business_registration_number:   'business_registration_number',
  entity_type:                    'entity_type',
  // ── 매물 등록 ──
  is_listing:                     'is_listing',
  listing_available_date:         'listing_available_date',
  // ── 파일 ──
  contract_file_url:              'contract_file_url',
  business_registration_file_url: 'business_registration_file_url',
  // ── 메모 ──
  memo:                           'memo',
  memo_1:                         'memo_1',
  memo_2:                         'memo_2',
  memo_3:                         'memo_3',
  memo_4:                         'memo_4',
  memo_5:                         'memo_5',
  // ── 기타 ──
  payment_alias:                  'payment_alias',
  payment_alias_previous_1:       'payment_alias_previous_1',
  payment_alias_previous_2:       'payment_alias_previous_2',
  payment_alias_previous_3:       'payment_alias_previous_3',
  resident_caught:                'resident_caught',
  status:                         'status',
  // ── 애완동물 발견 기록 ──
  pet_record_1:                   'pet_record_1',
  pet_record_1_date:              'pet_record_1_date',
  pet_record_2:                   'pet_record_2',
  pet_record_2_date:              'pet_record_2_date',
  pet_record_3:                   'pet_record_3',
  pet_record_3_date:              'pet_record_3_date',
  // ── 연락처 변경일 ──
  phone_previous_1_date:          'phone_previous_1_date',
  phone_previous_2_date:          'phone_previous_2_date',
  // ── 렌트프리 ──
  rent_free_1_type:               'rent_free_1_type',
  rent_free_1_months:             'rent_free_1_months',
  rent_free_1_start_date:         'rent_free_1_start_date',
  rent_free_1_end_date:           'rent_free_1_end_date',
  rent_free_2_type:               'rent_free_2_type',
  rent_free_2_months:             'rent_free_2_months',
  rent_free_2_start_date:         'rent_free_2_start_date',
  rent_free_2_end_date:           'rent_free_2_end_date',
};

// 하위 호환: TENANT_EXTRA_FIELD_MAP은 TENANT_FIELD_MAP과 동일
export const TENANT_EXTRA_FIELD_MAP = TENANT_FIELD_MAP;

/**
 * 임차인 값 변환 (타입 맞추기)
 */
function convertTenantValue(dbCol, val) {
  const intCols = new Set([
    'deposit', 'rent', 'management_fee',
    'water_fee', 'internet_fee', 'cleaning_fee',
    'parking_fee_1', 'broker_fee_amount',
    'other_deposit1_amount', 'other_deposit2_amount',
  ]);
  const smallintCols = new Set([
    'payment_due_day', 'management_fee_due_day', 'payment_due_day_temp',
  ]);
  const boolCols = new Set(['is_active', 'is_listing']);
  const dateCols = new Set([
    'move_in_date', 'contract_end_date',
    'first_move_in_date', 'move_out_date',
    'listing_available_date',
  ]);

  if (boolCols.has(dbCol)) return !!val;
  if (intCols.has(dbCol)) return val !== '' && val != null ? (parseInt(String(val).replace(/,/g, '')) || 0) : null;
  if (smallintCols.has(dbCol)) return val !== '' && val != null ? (parseInt(val) || null) : null;
  if (dateCols.has(dbCol)) return val || null;
  // billing_type: 선불/후불 → prepaid/postpaid
  const billingTypeCols = new Set(['rent_billing_type', 'management_fee_billing_type', 'water_billing_type', 'internet_billing_type']);
  if (billingTypeCols.has(dbCol)) {
    if (val === '후불') return 'postpaid';
    if (val === '선불') return 'prepaid';
    return val || null;
  }
  // 주민번호: 7자리로 잘라내기
  if (dbCol === 'id_number') return truncateResidentNumber(val);
  return val === '' ? null : (val || null);
}

/**
 * 임차인 단건 수정 → Supabase UPDATE
 * @param {number} tenantId - Supabase tenants.id
 * @param {object} patch - UI 필드 or DB 컬럼 혼합 가능
 */
export async function updateTenant(tenantId, patch) {
  const dbPatch = {};

  for (const [key, value] of Object.entries(patch)) {
    const mapped = TENANT_FIELD_MAP[key];
    if (mapped) {
      dbPatch[mapped] = convertTenantValue(mapped, value);
    }
  }

  if (Object.keys(dbPatch).length === 0) return { error: null };

  const { error } = await supabase
    .from('tenants')
    .update(dbPatch)
    .eq('id', tenantId);

  if (error) console.error('[Supabase] 임차인 수정 실패:', error, 'patch:', dbPatch);
  if (!error) writeAuditLog('tenants', tenantId, 'update', dbPatch);
  return { error };
}

/**
 * 임차인 신규 등록 → Supabase INSERT
 */
export async function insertTenant(tenant) {
  const dbTenant = {
    room_id: tenant.roomId,
    building_id: tenant.buildingId,
    name: tenant.name,
    phone: tenant.phone || null,
    id_number: truncateResidentNumber(tenant.ssn),
    rent: tenant.rent != null ? (parseInt(String(tenant.rent).replace(/,/g, '')) || 0) : null,
    management_fee: tenant.mgmt != null ? (parseInt(String(tenant.mgmt).replace(/,/g, '')) || 0) : null,
    deposit: tenant.deposit != null ? (parseInt(String(tenant.deposit).replace(/,/g, '')) || 0) : null,
    move_in_date: tenant.moveIn || null,
    contract_end_date: tenant.expiry || null,
    is_active: true,
    payment_due_day: tenant.rentDay || null,
    rent_billing_type: tenant.rentPayType === '후불' ? 'postpaid' : 'prepaid',
    car_number_1: tenant.carNumber || null,
    car_type_1: tenant.carType || null,
    water_fee: tenant.waterFee != null ? (parseInt(String(tenant.waterFee).replace(/,/g, '')) || 0) : null,
    internet_fee: tenant.internetFee != null ? (parseInt(String(tenant.internetFee).replace(/,/g, '')) || 0) : null,
    cleaning_fee: tenant.cleaningFee != null ? (parseInt(String(tenant.cleaningFee).replace(/,/g, '')) || 0) : null,
    broker_name: tenant.broker || null,
    broker_phone: tenant.brokerPhone || null,
    broker_fee_amount: tenant.brokerFee != null ? (parseInt(String(tenant.brokerFee).replace(/,/g, '')) || 0) : null,
  };

  const { data, error } = await supabase
    .from('tenants')
    .insert(dbTenant)
    .select();

  if (error) console.error('[Supabase] 임차인 등록 실패:', error);
  return { data: data?.[0], error };
}

/**
 * 임차인 비활성화 (퇴실 처리)
 */
export async function deactivateTenant(tenantId, moveOutDate) {
  const { error } = await supabase
    .from('tenants')
    .update({
      is_active: false,
      move_out_date: moveOutDate || new Date().toISOString().slice(0, 10),
    })
    .eq('id', tenantId);

  if (error) console.error('[Supabase] 임차인 비활성화 실패:', error);
  return { error };
}

/**
 * 건물명 + 호실번호로 room_id, building_id 찾기 (임차인 등록 시 사용)
 */
export async function findRoomAndBuilding(buildingName, roomNumber) {
  const { data: blds } = await supabase
    .from('buildings')
    .select('id')
    .eq('building_name', buildingName)
    .limit(1);

  if (!blds?.length) return null;

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id')
    .eq('building_id', blds[0].id)
    .eq('room_number', String(roomNumber))
    .limit(1);

  if (!rooms?.length) return null;
  return { buildingId: blds[0].id, roomId: rooms[0].id };
}

// 임차인 사진 업로드 (입주/퇴실)
export async function uploadTenantPhotos(tenantId, files, type) {
  const col = type === 'move_in' ? 'move_in_photos' : 'move_out_photos';
  const urls = [];
  for (const file of files) {
    const ext = file.name.split('.').pop();
    const path = `tenants/${tenantId}/${type}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('tenant-files').upload(path, file);
    if (error) { console.error('사진 업로드 실패:', error); continue; }
    const { data: urlData } = supabase.storage.from('tenant-files').getPublicUrl(path);
    if (urlData?.publicUrl) urls.push(urlData.publicUrl);
  }
  if (urls.length > 0) {
    const { data: current } = await supabase.from('tenants').select(col).eq('id', tenantId).single();
    const existing = current?.[col] || [];
    await supabase.from('tenants').update({ [col]: [...existing, ...urls] }).eq('id', tenantId);
  }
  return urls;
}

// 계약서 파일 업로드
export async function uploadContractFile(tenantId, file) {
  const ext = file.name.split('.').pop();
  const path = `tenants/${tenantId}/contract_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('tenant-files').upload(path, file);
  if (error) { console.error('계약서 업로드 실패:', error); return null; }
  const { data: urlData } = supabase.storage.from('tenant-files').getPublicUrl(path);
  const url = urlData?.publicUrl;
  if (url) {
    await supabase.from('tenants').update({ contract_file_url: url }).eq('id', tenantId);
  }
  return url;
}

// 전체 데이터 한번에 가져오기
export async function fetchAllData() {
  const [buildings, rooms, tenants, calendarEvents] = await Promise.all([
    fetchBuildings(),
    fetchRooms(),
    fetchTenants(),
    fetchCalendarEvents(),
  ]);
  return { buildings, rooms, tenants, calendarEvents };
}

// ═══════════════════════════════════════════
// calendar_events CRUD
// ═══════════════════════════════════════════

/**
 * calendar_events 전체 조회
 */
export async function fetchCalendarEvents() {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('event_date', { ascending: true });
  if (error) { console.error('[Supabase] calendar_events 조회 실패:', error); return []; }
  return data || [];
}

/**
 * Supabase calendar_event → UI 이벤트 객체 변환
 */
function convertCalendarEvent(e) {
  return {
    supabaseId: e.id,
    date: e.event_date,
    type: e.event_type,
    building: e.building_name || '',
    room: e.room_number || '',
    name: e.name || '',
    color: e.color || '#3B82F6',
    buildingId: e.building_id,
    roomId: e.room_id,
    tenantId: e.tenant_id,
    // 계약 정보
    deposit: e.deposit,
    rent: e.rent,
    managementFee: e.management_fee,
    moveIn: e.move_in_date || '',
    expiry: e.contract_end_date || '',
    contractDate: e.contract_date || '',
    nego: e.nego,
    broker: e.broker_name || '',
    brokerPhone: e.broker_phone || '',
    registeredSource: e.registered_source || '',
    registeredBy: e.registered_by || '',
    // 계약 단계
    depositConfirmed: !!e.deposit_confirmed,
    reported: !!e.owner_reported,
    balanceConfirmed: !!e.balance_confirmed,
    contractEntered: !!e.contract_entered,
    // 퇴실 단계 (일반/근생)
    moveOutMsg: e.move_out_msg || '',
    doorPassword: e.door_password || '',
    ownerReported: !!e.move_out_owner_reported,
    // 단기 퇴실 단계
    moveOutLinkCompleted: !!e.move_out_link_completed,
    moveOutLinkCompletedAt: e.move_out_link_completed_at || '',
    refundBank: e.refund_bank || '',
    refundAccount: e.refund_account || '',
    refundHolder: e.refund_holder || '',
    externalCheckDone: !!e.external_check_done,
    externalCheckComment: e.external_check_comment || '',
    repairNeeded: !!e.repair_needed,
    repairType: e.repair_type || '',
    repairDone: !!e.repair_done,
    cleaningDone: !!e.cleaning_done,
    cleaningFeeExtra: e.cleaning_fee_extra || '',
    cleaningComment: e.cleaning_comment || '',
    vacantConfirmed: !!e.vacant_confirmed,
    // 사진
    moveOutCheckPhotos: e.move_out_check_photos || [],
    moveInCheckPhotos: e.move_in_check_photos || [],
    // 공제항목
    deductionItems: e.deduction_items || [],
    // 검침값
    meterElec: e.meter_elec || "",
    meterGas: e.meter_gas || "",
    // 메타
    isCompleted: !!e.is_completed,
    source: 'supabase',
  };
}

/**
 * UI 이벤트 객체 → Supabase INSERT/UPDATE 용 변환
 */
function convertEventToDb(evt) {
  const db = {
    event_date: evt.date || evt.event_date,
    event_type: evt.type || evt.event_type,
    building_name: evt.building || null,
    room_number: evt.room || null,
    name: evt.name || null,
    color: evt.color || null,
  };
  // 계약 정보
  if (evt.deposit != null) db.deposit = parseInt(String(evt.deposit).replace(/,/g, '')) || null;
  if (evt.rent != null) db.rent = parseInt(String(evt.rent).replace(/,/g, '')) || null;
  if (evt.managementFee != null || evt.mgmt != null) db.management_fee = parseInt(String(evt.managementFee || evt.mgmt || 0).replace(/,/g, '')) || null;
  if (evt.moveIn) db.move_in_date = evt.moveIn;
  if (evt.expiry) db.contract_end_date = evt.expiry;
  if (evt.contractDate) db.contract_date = evt.contractDate;
  if (evt.nego != null) db.nego = parseInt(evt.nego) || null;
  if (evt.broker) db.broker_name = evt.broker;
  if (evt.brokerPhone) db.broker_phone = evt.brokerPhone;
  if (evt.registeredSource) db.registered_source = evt.registeredSource;
  if (evt.registeredBy) db.registered_by = evt.registeredBy;
  // 계약 단계
  if (evt.depositConfirmed !== undefined) db.deposit_confirmed = !!evt.depositConfirmed;
  if (evt.reported !== undefined) db.owner_reported = !!evt.reported;
  if (evt.balanceConfirmed !== undefined) db.balance_confirmed = !!evt.balanceConfirmed;
  if (evt.contractEntered !== undefined) db.contract_entered = !!evt.contractEntered;
  // 퇴실 단계
  if (evt.moveOutMsg !== undefined) db.move_out_msg = evt.moveOutMsg || null;
  if (evt.doorPassword !== undefined) db.door_password = evt.doorPassword || null;
  if (evt.ownerReported !== undefined) db.move_out_owner_reported = !!evt.ownerReported;
  // 단기 퇴실 단계
  if (evt.moveOutLinkCompleted !== undefined) db.move_out_link_completed = !!evt.moveOutLinkCompleted;
  if (evt.moveOutLinkCompletedAt !== undefined) db.move_out_link_completed_at = evt.moveOutLinkCompletedAt || null;
  if (evt.refundBank !== undefined) db.refund_bank = evt.refundBank || null;
  if (evt.refundAccount !== undefined) db.refund_account = evt.refundAccount || null;
  if (evt.refundHolder !== undefined) db.refund_holder = evt.refundHolder || null;
  if (evt.externalCheckDone !== undefined) db.external_check_done = !!evt.externalCheckDone;
  if (evt.externalCheckComment !== undefined) db.external_check_comment = evt.externalCheckComment || null;
  if (evt.repairNeeded !== undefined) db.repair_needed = !!evt.repairNeeded;
  if (evt.repairType !== undefined) db.repair_type = evt.repairType || null;
  if (evt.repairDone !== undefined) db.repair_done = !!evt.repairDone;
  if (evt.cleaningDone !== undefined) db.cleaning_done = !!evt.cleaningDone;
  if (evt.cleaningFeeExtra !== undefined) db.cleaning_fee_extra = evt.cleaningFeeExtra || null;
  if (evt.cleaningComment !== undefined) db.cleaning_comment = evt.cleaningComment || null;
  if (evt.vacantConfirmed !== undefined) db.vacant_confirmed = !!evt.vacantConfirmed;
  // 사진
  if (evt.move_out_check_photos !== undefined) db.move_out_check_photos = evt.move_out_check_photos;
  if (evt.move_in_check_photos !== undefined) db.move_in_check_photos = evt.move_in_check_photos;
  // 공제항목
  if (evt.deductionItems !== undefined) db.deduction_items = evt.deductionItems;
  // 검침값
  if (evt.meterElec !== undefined) db.meter_elec = evt.meterElec || null;
  if (evt.meterGas !== undefined) db.meter_gas = evt.meterGas || null;
  // 메타
  if (evt.isCompleted !== undefined) db.is_completed = !!evt.isCompleted;
  return db;
}

/**
 * 캘린더 이벤트 등록
 */
export async function insertCalendarEvent(evt) {
  const dbEvt = convertEventToDb(evt);
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(dbEvt)
    .select();
  if (error) console.error('[Supabase] 캘린더 이벤트 등록 실패:', error);
  return { data: data?.[0] || null, error };
}

/**
 * 캘린더 이벤트 수정
 */
export async function updateCalendarEvent(eventId, patch) {
  const dbPatch = convertEventToDb(patch);
  const { data, error } = await supabase
    .from('calendar_events')
    .update(dbPatch)
    .eq('id', eventId)
    .select();
  if (error) console.error('[Supabase] 캘린더 이벤트 수정 실패:', error);
  return { data: data?.[0] || null, error };
}

/**
 * 캘린더 이벤트 삭제
 */
export async function deleteCalendarEvent(eventId) {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);
  if (error) console.error('[Supabase] 캘린더 이벤트 삭제 실패:', error);
  return { error };
}

/**
 * convertCalendarEvent export (useSupabaseSync에서 사용)
 */
export { convertCalendarEvent };
