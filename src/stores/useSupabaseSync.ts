// @ts-nocheck
import { useEffect, useRef } from 'react';
import { useAllSupabaseData } from '../hooks/useSupabaseQueries';
import { useBuildingStore } from './useBuildingStore';
import { useTenantStore } from './useTenantStore';
import { useCalendarStore } from './useCalendarStore';
import { convertCalendarEvent } from '../lib/supabaseData';
import { setBuildingTypeCache } from '../config/roomType';

/**
 * Supabase → UI 건물유형 문자열 변환
 * boolean 5개 → "단기", "단기+근생" 등
 */
function buildTypeString(b) {
  const types = [];
  if (b.is_short_term_rental) types.push('단기');
  if (b.is_long_term_rental) types.push('일반임대');
  if (b.is_commercial) types.push('근생');
  if (b.is_management_agency) types.push('관리사무소');
  if (b.is_corporate_facility) types.push('기업시설관리');
  return types.length > 0 ? types.join('+') : '단기';
}

/**
 * Supabase owner_*, owner_2_*, owner_3_* → UI owners[] 배열 변환
 */
function buildOwnersArray(b) {
  const owners = [];
  if (b.owner_name) {
    owners.push({
      name: b.owner_name || '',
      phone: b.owner_phone || '',
      ssn: b.owner_resident_number || '',
      address: b.owner_home_address || '',
      settlement: '',
      email: b.owner_email || '',
      businessRegNo: b.owner_business_registration_number || '',
      businessName: b.owner_business_name || '',
      entityType: b.owner_entity_type || '',
    });
  }
  if (b.owner_2_name) {
    owners.push({
      name: b.owner_2_name || '',
      phone: b.owner_2_phone || '',
      ssn: b.owner_2_resident_number || '',
      address: b.owner_2_home_address || '',
      settlement: '',
      email: b.owner_2_email || '',
    });
  }
  if (b.owner_3_name) {
    owners.push({
      name: b.owner_3_name || '',
      phone: b.owner_3_phone || '',
      ssn: b.owner_3_resident_number || '',
      address: b.owner_3_home_address || '',
      settlement: '',
      email: b.owner_3_email || '',
    });
  }
  return owners.length > 0 ? owners : [{ name: '', phone: '', ssn: '', address: '', settlement: '' }];
}

/**
 * Supabase 건물 row → buildingData[건물명] 상세 필드 변환
 * BuildingDetailPage의 saved 객체 필드와 1:1 매칭
 */
function buildSupabaseToBuildingData(b) {
  return {
    // 기본정보
    buildingName: b.building_name || '',
    buildingNickname: b.building_nickname || '',
    addressRoad: b.address_road || '',
    addressOld: b.address_old || '',
    entranceDoorPassword: b.entrance_door_password || '',
    buildingAreaTotal: b.building_area_total ? String(b.building_area_total) : '',
    approvedDate: b.approved_date || '',
    contractStartDate: b.contract_start_date || '',
    // 건물유형
    isShortTermRental: b.is_short_term_rental || false,
    isLongTermRental: b.is_long_term_rental || false,
    isCommercial: b.is_commercial || false,
    isManagementAgency: b.is_management_agency || false,
    isCorporateFacility: b.is_corporate_facility || false,
    isActive: b.is_active !== false,
    // CCTV/설비
    cctvCount: b.cctv_count || 0,
    cctvRoomLocation: b.cctv_room_location || '',
    cctvInstallInfo: b.cctv_install_info || '',
    electricCommonCustomerNumber: b.electric_common_customer_number || '',
    waterCommonCustomerNumber: b.water_common_customer_number || '',
    electricContractPower: b.electric_contract_power || '',
    internetProvider: b.internet_provider || '',
    parkingGatePassword: b.parking_gate_password || '',
    electricMeterBoxPassword: b.electric_meter_box_password || '',
    rooftopAccessMethod: b.rooftop_access_method || '',
    parkingTotalSpaces: b.parking_total_spaces || 0,
    septicTankCleaningMonth1: b.septic_tank_cleaning_month_1 || '',
    septicTankCleaningMonth2: b.septic_tank_cleaning_month_2 || '',
    monthlyInspectionCount: b.monthly_inspection_count || '',
    isFireInspectionSelf: b.is_fire_inspection_self || false,
    isResidentRegistrationAllowed: b.is_resident_registration_allowed || false,
    isStandardContract: b.is_standard_contract || false,
    isRenthomeWritingAgency: b.is_renthome_writing_agency || false,
    isStorageAvailable: b.is_storage_available || false,
    penalty7daysOwnership: b.penalty_7days_ownership || '',
    freeRepairLimit: b.free_repair_limit || 0,
    // 청구/정산
    managementFeeType: b.management_fee_type || '',
    managementFeeRate: b.management_fee_rate || '',
    managementFeeFixedAmount: b.management_fee_fixed_amount || '',
    rentBillingType: b.rent_billing_type || '',
    managementFeeBillingType: b.management_fee_billing_type || '',
    waterBillingType: b.water_billing_type || '',
    internetBillingType: b.internet_billing_type || '',
    billingCycle: b.billing_cycle || '',
    settlementCount: b.settlement_count || 1,
    settlementDay1: b.settlement_day_1 || '',
    settlementDay2: b.settlement_day_2 || '',
    // 검침/납부일 (근생)
    electricReadingDay: b.electric_reading_day || null,
    waterReadingDay: b.water_reading_day || null,
    waterReadingCycle: b.water_reading_cycle || null,
    rentDueDay: b.rent_due_day || null,
    mgmtDueDay: b.mgmt_due_day || null,
    mgmtBillIssueDay: b.mgmt_bill_issue_day || null,
    // 건물주 1
    ownerName: b.owner_name || '',
    ownerPhone: b.owner_phone || '',
    ownerResidentNumber: b.owner_resident_number || '',
    ownerEmail: b.owner_email || '',
    ownerEmail2: b.owner_email_2 || '',
    ownerHomeAddress: b.owner_home_address || '',
    ownerHomeAddressDetail: b.owner_home_address_detail || '',
    ownerBusinessRegistrationNumber: b.owner_business_registration_number || '',
    ownerBusinessName: b.owner_business_name || '',
    ownerBusinessAddress: b.owner_business_address || '',
    ownerBusinessType: b.owner_business_type || '',
    ownerBusinessItem: b.owner_business_item || '',
    ownerEntityType: b.owner_entity_type || '',
    // 건물주 2
    owner2Name: b.owner_2_name || '',
    owner2Phone: b.owner_2_phone || '',
    owner2ResidentNumber: b.owner_2_resident_number || '',
    owner2Email: b.owner_2_email || '',
    owner2HomeAddress: b.owner_2_home_address || '',
    owner2HomeAddressDetail: b.owner_2_home_address_detail || '',
    // 건물주 3
    owner3Name: b.owner_3_name || '',
    owner3Phone: b.owner_3_phone || '',
    owner3ResidentNumber: b.owner_3_resident_number || '',
    owner3Email: b.owner_3_email || '',
    owner3HomeAddress: b.owner_3_home_address || '',
    owner3HomeAddressDetail: b.owner_3_home_address_detail || '',
    // 공동소유 메모
    coOwnerMemo: b.co_owner_memo || '',
    // 담당자/소장
    contactPersonName: b.contact_person_name || '',
    contactPersonPhone: b.contact_person_phone || '',
    contactPersonEmail: b.contact_person_email || '',
    isContactPersonPrimary: b.is_contact_person_primary || false,
    siteManagerName: b.site_manager_name || '',
    siteManagerPhone: b.site_manager_phone || '',
    siteManagerEmail: b.site_manager_email || '',
    // 계좌 타겟
    rentAccountTarget: b.rent_account_target || '',
    managementFeeAccountTarget: b.management_fee_account_target || '',
    utilityAccountTarget: b.utility_account_target || '',
    electricGasAccountTarget: b.electric_gas_account_target || '',
    depositAccountTarget: b.deposit_account_target || '',
    depositManagementAmount: b.deposit_management_amount || 0,
    // 하우스맨 청구용 계좌
    housemanBillingAccount: b.houseman_billing_account || '',
    // 청구용 건물주 계좌
    billingAccount1: b.billing_account_1 || '',
    billingAccount1Bank: b.billing_account_1_bank || '',
    billingAccount1Holder: b.billing_account_1_holder || '',
    billingAccount2: b.billing_account_2 || '',
    billingAccount2Bank: b.billing_account_2_bank || '',
    billingAccount2Holder: b.billing_account_2_holder || '',
    billingAccount3: b.billing_account_3 || '',
    billingAccount3Bank: b.billing_account_3_bank || '',
    billingAccount3Holder: b.billing_account_3_holder || '',
    // 정산용 계좌
    settlementAccount1: b.settlement_account_1 || '',
    settlementAccount1Bank: b.settlement_account_1_bank || '',
    settlementAccount1Holder: b.settlement_account_1_holder || '',
    settlementAccount2: b.settlement_account_2 || '',
    settlementAccount2Bank: b.settlement_account_2_bank || '',
    settlementAccount2Holder: b.settlement_account_2_holder || '',
    // 정산 분배
    settlementSplitType: b.settlement_split_type || '',
    settlementSplitValue: b.settlement_split_value || null,
    // 문서 URL
    fireInsuranceDocumentUrl: b.fire_insurance_document_url || '',
    documentBuildingRegisterUrl: b.document_building_register_url || '',
    documentManagementContractUrl: b.document_management_contract_url || '',
    documentBusinessRegistrationUrl: b.document_business_registration_url || '',
    documentCompletionDrawingUrl: b.document_completion_drawing_url || '',
    documentEtc1Url: b.document_etc_1_url || '',
    documentEtc2Url: b.document_etc_2_url || '',
    documentEtc3Url: b.document_etc_3_url || '',
    // 계약서 특약사항
    contractSpecialTermsShortTerm: b.contract_special_terms_short_term || '',
    contractSpecialTermsLongTerm: b.contract_special_terms_long_term || '',
    contractSpecialTermsCommercial: b.contract_special_terms_commercial || '',
    // 메모
    memo: b.memo || '',
    // 메타
    _source: 'supabase',
    _supabaseId: b.id,
  };
}

/**
 * Supabase 건물 → UI 건물 객체 변환
 */
function convertBuilding(b, sbTenants, sbRooms) {
  const buildingRoomCount = sbRooms.filter(r => r.building_id === b.id).length;
  return {
    name: b.building_name || '',
    nickname: b.building_nickname || '',
    rooms: buildingRoomCount,
    occupied: sbTenants.filter(t => t.building_id === b.id).length,
    type: buildTypeString(b),
    special: b.memo || null,
    parkingTotal: b.parking_total_spaces || 0,
    // 주소
    address: b.address_road || '',
    roadAddress: b.address_road || '',
    addressOld: b.address_old || '',
    // 건물주 정보
    ownerName: b.owner_name || '',
    ownerPhone: b.owner_phone || '',
    owners: buildOwnersArray(b),
    // 건물 설정
    entrancePw: b.entrance_door_password || '',
    cctvCount: b.cctv_count || 0,
    cctvLocation: b.cctv_room_location || '',
    cctvInstallInfo: b.cctv_install_info || '',
    // 수수료/정산
    managementFeeType: b.management_fee_type || '',
    managementFeeRate: b.management_fee_rate || 0,
    managementFeeFixedAmount: b.management_fee_fixed_amount || 0,
    penalty7daysOwnership: b.penalty_7days_ownership || '',
    standardLease: b.is_standard_contract ? '사용' : '미사용',
    settlementDates: [b.settlement_day_1, b.settlement_day_2].filter(Boolean),
    settlementCount: b.settlement_count || 1,
    // 순회/관리
    visitCycle: b.monthly_inspection_count ? `월 ${b.monthly_inspection_count}회` : '',
    approvalDate: b.approved_date || '',
    fireInspectionSelf: b.is_fire_inspection_self || false,
    startDate: b.contract_start_date || '',
    // 청구유형
    rentBillingType: b.rent_billing_type || '',
    mgmtBillingType: b.management_fee_billing_type || 'prepaid',
    waterBillingType: b.water_billing_type || 'prepaid',
    internetBillingType: b.internet_billing_type || 'prepaid',
    billingCycle: b.billing_cycle || '',
    // 검침/납부일 (근생)
    electricReadingDay: b.electric_reading_day || null,
    waterReadingDay: b.water_reading_day || null,
    waterReadingCycle: b.water_reading_cycle || null,
    rentDueDay: b.rent_due_day || null,
    mgmtDueDay: b.mgmt_due_day || null,
    mgmtBillIssueDay: b.mgmt_bill_issue_day || null,
    // 블럭 방식 계좌 타겟 (항목별 어느 계좌로 입금하는지)
    rentAccountTarget: b.rent_account_target || '',
    managementFeeAccountTarget: b.management_fee_account_target || '',
    utilityAccountTarget: b.utility_account_target || '',
    electricGasAccountTarget: b.electric_gas_account_target || '',
    depositAccountTarget: b.deposit_account_target || '',
    depositManagementAmount: b.deposit_management_amount || 0,
    // 하우스맨 청구용 계좌
    housemanBillingAccount: b.houseman_billing_account || '',
    // 청구용 건물주 계좌 (최대 3개)
    billingAccount1: b.billing_account_1 || '',
    billingAccount1Bank: b.billing_account_1_bank || '',
    billingAccount1Holder: b.billing_account_1_holder || '',
    billingAccount2: b.billing_account_2 || '',
    billingAccount2Bank: b.billing_account_2_bank || '',
    billingAccount2Holder: b.billing_account_2_holder || '',
    billingAccount3: b.billing_account_3 || '',
    billingAccount3Bank: b.billing_account_3_bank || '',
    billingAccount3Holder: b.billing_account_3_holder || '',
    // 정산용 계좌 (최대 2개)
    settlementAccount1: b.settlement_account_1 || '',
    settlementAccount1Bank: b.settlement_account_1_bank || '',
    settlementAccount1Holder: b.settlement_account_1_holder || '',
    settlementAccount2: b.settlement_account_2 || '',
    settlementAccount2Bank: b.settlement_account_2_bank || '',
    settlementAccount2Holder: b.settlement_account_2_holder || '',
    // 정산 분배
    settlementSplitType: b.settlement_split_type || '',
    settlementSplitValue: b.settlement_split_value || null,
    // 설비
    electricCommonCustomerNumber: b.electric_common_customer_number || '',
    waterCommonCustomerNumber: b.water_common_customer_number || '',
    electricContractPower: b.electric_contract_power || '',
    electricMeterBoxPassword: b.electric_meter_box_password || '',
    parkingGatePassword: b.parking_gate_password || '',
    internetProvider: b.internet_provider || '',
    // 기타
    freeRepairLimit: b.free_repair_limit || 0,
    email: b.owner_email || '',
    // 문서
    fireInsuranceUrl: b.fire_insurance_document_url || '',
    buildingRegisterUrl: b.document_building_register_url || '',
    managementContractUrl: b.document_management_contract_url || '',
    documentBusinessRegistrationUrl: b.document_business_registration_url || '',
    documentCompletionDrawingUrl: b.document_completion_drawing_url || '',
    documentEtc1Url: b.document_etc_1_url || '',
    documentEtc2Url: b.document_etc_2_url || '',
    documentEtc3Url: b.document_etc_3_url || '',
    // 메타
    source: 'supabase',
    supabaseId: b.id,
  };
}

/**
 * Supabase rooms → roomMasterData 형식 변환
 * key: "건물명_호실번호" → { roomType, area, standardDeposit, standardRent, ... }
 */
function buildRoomMasterData(sbRooms, sbBuildings) {
  const result = {};
  for (const r of sbRooms) {
    const building = sbBuildings.find(b => b.id === r.building_id);
    if (!building) continue;
    const key = `${building.building_name}_${r.room_number}`;
    result[key] = {
      roomType: r.room_layout || '',
      area: r.area ? String(r.area) : '',
      standardDeposit: r.deposit ? r.deposit.toLocaleString() : '0',
      standardRent: r.rent ? r.rent.toLocaleString() : '0',
      standardManagementFee: r.management_fee ? r.management_fee.toLocaleString() : '0',
      standardWaterFee: r.water_fee || 0,
      standardInternetFee: r.internet_fee || 0,
      standardCleaningFee: r.cleaning_fee ? r.cleaning_fee.toLocaleString() : '0',
      standardBrokerFee: r.standard_broker_fee ? r.standard_broker_fee.toLocaleString() : '0',
      electricCustomerNumber: r.electric_customer_number || '',
      gasCustomerNumber: r.gas_customer_number || '',
      standardParkingFee: r.standard_parking_fee || 0,
      standardParkingType: r.standard_parking_type || '',
      standardParkingRemoteDeposit: r.standard_parking_remote_deposit || 0,
      isManaged: r.is_managed !== false,
      electricGasPaymentType: r.electric_gas_payment_type || '',
      waterPaymentType: r.water_payment_type || '',
      rentDiscountLimit: r.rent_discount_limit || 0,
      variableManagementFeeMemo: r.variable_management_fee_memo || '',
      // 계좌 타겟 (호실별 오버라이드)
      rentAccountTarget: r.rent_account_target || '',
      managementFeeAccountTarget: r.management_fee_account_target || '',
      utilityAccountTarget: r.utility_account_target || '',
      electricGasAccountTarget: r.electric_gas_account_target || '',
      depositAccountTarget: r.deposit_account_target || '',
      roomPhotoUrls: r.room_photo_urls || [],
      source: 'supabase',
      supabaseId: r.id,
    };
  }
  return result;
}

/**
 * Supabase 임차인 → UI 임차인 객체 변환
 */
function convertTenant(t, sbRooms, sbBuildings) {
  const room = sbRooms.find(r => r.id === t.room_id);
  const building = sbBuildings.find(b => b.id === t.building_id);
  const dueDay = t.payment_due_day || 1;
  const now = new Date();
  const dueStr = `${now.getMonth() + 1}/${dueDay}`;

  // 유형 판별
  const typeStr = building
    ? (building.is_management_agency ? '관리사무소'
      : building.is_corporate_facility ? '관리사무소'
      : building.is_short_term_rental ? '단기'
      : building.is_long_term_rental ? '일반임대'
      : building.is_commercial ? '근생'
      : '단기')
    : '단기';

  return {
    id: 90000 + t.id,
    name: t.name,
    building: building ? building.building_name : '',
    room: room ? room.room_number : '',
    phone: t.phone || '',
    email: t.email || '',
    // 금액
    rent: t.rent || 0,
    mgmt: t.management_fee || 0,
    deposit: t.deposit || 0,
    waterFee: t.water_fee || 0,
    internetFee: t.internet_fee || 0,
    cleaningFee: t.cleaning_fee || 0,
    parkingFee: t.parking_fee_1 || 0,
    // 기타 보증금
    otherDeposit1Desc: t.other_deposit1_desc || '',
    otherDeposit1Amount: t.other_deposit1_amount || 0,
    otherDeposit2Desc: t.other_deposit2_desc || '',
    otherDeposit2Amount: t.other_deposit2_amount || 0,
    // 유형/상태
    type: typeStr,
    due: dueStr,
    rentDay: dueDay,
    status: t.status || '정상',
    overdue: 0,
    overdueDays: 0,
    prevUnpaid: 0,
    currentUnpaid: 0,
    // 날짜
    moveIn: t.move_in_date || '',
    expiry: t.contract_end_date || '',
    firstMoveInDate: t.first_move_in_date || '',
    moveOut: t.move_out_date || '',
    // 부동산
    broker: t.broker_name || '',
    brokerPhone: t.broker_phone || '',
    brokerFee: t.broker_fee_amount || 0,
    // 차량
    carNumber: t.car_number_1 || '',
    carType: t.car_type_1 || '',
    // 사업자 정보
    businessName: t.business_name || '',
    businessAddress: t.business_address || '',
    businessType: t.business_type || '',
    businessItem: t.business_item || '',
    entityType: t.entity_type || '',
    businessRegistrationNumber: t.business_registration_number || '',
    businessRegistrationFileUrl: t.business_registration_file_url || '',
    // 주차
    parkingType1: t.parking_type_1 || '',
    parking_type_2: t.parking_type_2 || '',
    parking_type_3: t.parking_type_3 || '',
    parking_type_4: t.parking_type_4 || '',
    parking_type_5: t.parking_type_5 || '',
    // 납부
    paymentDueDayTemp: t.payment_due_day_temp || null,
    managementFeeDueDay: t.management_fee_due_day || null,
    // 기타
    paymentAlias: t.payment_alias || '',
    isListing: t.is_listing || false,
    listingAvailableDate: t.listing_available_date || '',
    contractFileUrl: t.contract_file_url || '',
    rentBillingType: t.rent_billing_type || 'prepaid',
    managementFeeBillingType: t.management_fee_billing_type || '',
    waterBillingType: t.water_billing_type || '',
    internetBillingType: t.internet_billing_type || '',
    memo: t.memo || '',
    // 메모 1~5
    memo_1: t.memo_1 || '', memo_2: t.memo_2 || '', memo_3: t.memo_3 || '', memo_4: t.memo_4 || '', memo_5: t.memo_5 || '',
    // 애완동물 기록
    pet_record_1: t.pet_record_1 || '', pet_record_1_date: t.pet_record_1_date || '',
    pet_record_2: t.pet_record_2 || '', pet_record_2_date: t.pet_record_2_date || '',
    pet_record_3: t.pet_record_3 || '', pet_record_3_date: t.pet_record_3_date || '',
    // 렌트프리
    rent_free_1_type: t.rent_free_1_type || '', rent_free_1_months: t.rent_free_1_months || null,
    rent_free_1_start_date: t.rent_free_1_start_date || '', rent_free_1_end_date: t.rent_free_1_end_date || '',
    rent_free_2_type: t.rent_free_2_type || '', rent_free_2_months: t.rent_free_2_months || null,
    rent_free_2_start_date: t.rent_free_2_start_date || '', rent_free_2_end_date: t.rent_free_2_end_date || '',
    // 연락처 변경일
    phone_previous_1_date: t.phone_previous_1_date || '', phone_previous_2_date: t.phone_previous_2_date || '',
    // 주차 보증금/비용 1~5
    parking_fee_1: t.parking_fee_1 || '', parking_remote_deposit_1: t.parking_remote_deposit_1 || '',
    parking_fee_2: t.parking_fee_2 || '', parking_remote_deposit_2: t.parking_remote_deposit_2 || '',
    parking_fee_3: t.parking_fee_3 || '', parking_remote_deposit_3: t.parking_remote_deposit_3 || '',
    parking_fee_4: t.parking_fee_4 || '', parking_remote_deposit_4: t.parking_remote_deposit_4 || '',
    parking_fee_5: t.parking_fee_5 || '', parking_remote_deposit_5: t.parking_remote_deposit_5 || '',
    // 차량 2~5
    car_number_2: t.car_number_2 || '', car_type_2: t.car_type_2 || '',
    car_number_3: t.car_number_3 || '', car_type_3: t.car_type_3 || '',
    car_number_4: t.car_number_4 || '', car_type_4: t.car_type_4 || '',
    car_number_5: t.car_number_5 || '', car_type_5: t.car_type_5 || '',
    // 전입신고적발
    resident_caught: t.resident_caught || false,
    isActive: t.is_active !== false,
    // 비상연락처
    emergencyName: t.emergency_contact_name || '',
    emergencyPhone: t.emergency_contact_phone || '',
    emergencyRelation: t.emergency_contact_relation || '',
    // 연락처/별칭 이력 (3차까지)
    phonePrevious1: t.phone_previous_1 || '',
    phonePrevious2: t.phone_previous_2 || '',
    paymentAliasPrevious1: t.payment_alias_previous_1 || '',
    paymentAliasPrevious2: t.payment_alias_previous_2 || '',
    paymentAliasPrevious3: t.payment_alias_previous_3 || '',
    // 사진
    moveInCheckPhotos: t.move_in_photos || [],
    moveOutPhotos: t.move_out_photos || [],
    // 메타
    source: 'supabase',
    supabaseId: t.id,
    buildingId: t.building_id,
    roomId: t.room_id,
  };
}

/**
 * Supabase 데이터 연동: TanStack Query로 fetch → 기존 스토어에 병합
 * - 캐시 5분, 실패 시 2회 재시도, 백그라운드 refetch (QueryClient 설정)
 */
export function useSupabaseSync() {
  const merged = useRef(false);
  const { data, isError, error } = useAllSupabaseData();

  useEffect(() => {
    if (isError) {
      console.error('[Supabase] 데이터 로드 실패:', error);
      return;
    }
    if (!data) return; // 아직 로딩 중

    const { buildings: sbBuildings, rooms: sbRooms, tenants: sbTenants } = data;
    if (!sbBuildings.length && !sbTenants.length) return;

    const { setAllBuildings, setBuildingData } = useBuildingStore.getState();
    const { setActiveTenants } = useTenantStore.getState();

    // ── 건물: Supabase가 메인 (교체 방식) ──
    // Supabase 데이터로 완전 교체.
    const sbBuildingItems = sbBuildings.map(b => convertBuilding(b, sbTenants, sbRooms));
    setAllBuildings(sbBuildingItems);

    // 건물 유형 캐시 세팅 (단일 유형 건물의 roomType 자동 판별용)
    const bTypeMap = {};
    sbBuildings.forEach(b => {
      const types = [];
      if (b.is_short_term_rental) types.push('단기');
      if (b.is_long_term_rental) types.push('일반임대');
      if (b.is_commercial) types.push('근생');
      if (b.is_management_agency) types.push('관리사무소');
      if (b.is_corporate_facility) types.push('기업시설관리');
      // 단일 유형 건물만 캐시 (복합건물은 호실별 판별 필요)
      if (types.length === 1) {
        bTypeMap[b.building_name] = types[0] === '기업시설관리' ? '관리사무소' : types[0];
      }
    });
    setBuildingTypeCache(bTypeMap);

    // ── buildingData: Supabase → UI 상세 필드 교체 ──
    // BuildingDetailPage의 saved(=buildingData[buildingName]) 필드를 Supabase에서 채움
    const buildingDataFromSB = {};
    sbBuildings.forEach(b => {
      buildingDataFromSB[b.building_name] = buildSupabaseToBuildingData(b);
    });

    // ── rooms → roomMasterData 변환 & 병합 ──
    const sbRoomMaster = buildRoomMasterData(sbRooms, sbBuildings);

    // buildingData를 Supabase 기준으로 교체 (roomMaster도 함께)
    setBuildingData(prev => {
      const updated = { ...buildingDataFromSB };
      // localStorage에만 있는 비-건물 키 보존 (room_ 프리픽스, _supabase 프리픽스, 기타 메타)
      for (const [key, val] of Object.entries(prev)) {
        if (key.startsWith('room_') || key.startsWith('_')) {
          // roomMaster는 Supabase 것으로 덮어쓰기
        } else if (!buildingDataFromSB[key]) {
          // Supabase에 없는 건물(로컬 전용)은 보존
          updated[key] = val;
        }
      }
      // roomMasterData 병합
      for (const [key, roomData] of Object.entries(sbRoomMaster)) {
        updated[`room_${key}`] = roomData;
      }
      updated._supabaseRoomMaster = sbRoomMaster;
      return updated;
    });

    // ── 임차인 변환 & 병합 ──
    const sbTenantItems = sbTenants.map(t => convertTenant(t, sbRooms, sbBuildings));
    setActiveTenants(sbTenantItems);
    // roomType.js에서 Supabase store 접근용 전역 세팅
    window.__hm_activeTenants = sbTenantItems;

    // ── 임차인 extra 데이터 → buildingData[tenant_${id}]에 반영 ──
    setBuildingData(prev => {
      const updated = { ...prev };
      sbTenantItems.forEach(t => {
        const key = `tenant_${t.id}`;
        const existing = prev[key] || {};
        updated[key] = {
          ...existing,
          // 메모
          memo_1: t.memo_1, memo_2: t.memo_2, memo_3: t.memo_3, memo_4: t.memo_4, memo_5: t.memo_5,
          // 애완동물
          pet_record_1: t.pet_record_1, pet_record_1_date: t.pet_record_1_date,
          pet_record_2: t.pet_record_2, pet_record_2_date: t.pet_record_2_date,
          pet_record_3: t.pet_record_3, pet_record_3_date: t.pet_record_3_date,
          // 렌트프리
          rent_free_1_type: t.rent_free_1_type, rent_free_1_months: t.rent_free_1_months,
          rent_free_1_start_date: t.rent_free_1_start_date, rent_free_1_end_date: t.rent_free_1_end_date,
          rent_free_2_type: t.rent_free_2_type, rent_free_2_months: t.rent_free_2_months,
          rent_free_2_start_date: t.rent_free_2_start_date, rent_free_2_end_date: t.rent_free_2_end_date,
          // 연락처 변경일
          phone_previous_1_date: t.phone_previous_1_date, phone_previous_2_date: t.phone_previous_2_date,
          // 주차
          parking_type_1: t.parkingType1, parking_fee_1: t.parking_fee_1, parking_remote_deposit_1: t.parking_remote_deposit_1,
          parking_fee_2: t.parking_fee_2, parking_remote_deposit_2: t.parking_remote_deposit_2,
          parking_fee_3: t.parking_fee_3, parking_remote_deposit_3: t.parking_remote_deposit_3,
          parking_fee_4: t.parking_fee_4, parking_remote_deposit_4: t.parking_remote_deposit_4,
          parking_fee_5: t.parking_fee_5, parking_remote_deposit_5: t.parking_remote_deposit_5,
          // 차량 2~5
          car_number_1: t.carNumber, car_type_1: t.carType,
          car_number_2: t.car_number_2, car_type_2: t.car_type_2,
          car_number_3: t.car_number_3, car_type_3: t.car_type_3,
          car_number_4: t.car_number_4, car_type_4: t.car_type_4,
          car_number_5: t.car_number_5, car_type_5: t.car_type_5,
          // 기타
          email: t.email, payment_alias: t.paymentAlias,
          business_registration_number: t.businessRegistrationNumber,
          first_move_in_date: t.firstMoveInDate, move_out_date: t.moveOut,
          is_active: t.isActive, rent_billing_type: t.rentBillingType,
          payment_due_day_temp: t.paymentDueDayTemp, management_fee_due_day: t.managementFeeDueDay,
          water_fee: t.waterFee, internet_fee: t.internetFee,
          cleaning_fee: t.cleaningFee,
          other_deposit1_desc: t.otherDeposit1Desc, other_deposit1_amount: t.otherDeposit1Amount,
          other_deposit2_desc: t.otherDeposit2Desc, other_deposit2_amount: t.otherDeposit2Amount,
          emergency_contact_name: t.emergencyName, emergency_contact_phone: t.emergencyPhone,
          emergency_contact_relation: t.emergencyRelation,
          broker_name: t.broker, broker_phone: t.brokerPhone, broker_fee_amount: t.brokerFee,
          business_name: t.businessName, business_address: t.businessAddress,
          business_type: t.businessType, business_item: t.businessItem, entity_type: t.entityType,
          is_listing: t.isListing, listing_available_date: t.listingAvailableDate,
          contract_file_url: t.contractFileUrl, business_registration_file_url: t.businessRegistrationFileUrl,
          resident_caught: t.resident_caught,
        };
      });
      return updated;
    });

    // ── 캘린더 이벤트: Supabase → 스토어 ──
    const { calendarEvents: sbCalEvents } = data;
    if (sbCalEvents && sbCalEvents.length > 0) {
      const { setCalendarEvts } = useCalendarStore.getState();
      const sbEventItems = sbCalEvents.map(e => convertCalendarEvent(e));
      setCalendarEvts(prev => {
        // Supabase 이벤트로 완전 교체
        // supabaseId 없는 로컬 이벤트는 Supabase에 자동 저장 시도
        const localOnly = prev.filter(e => !e.supabaseId && !e.source && e.building);
        if (localOnly.length > 0) {
          console.info(`[Supabase] supabaseId 없는 로컬 이벤트 ${localOnly.length}건 → DB 저장 시도`);
          localOnly.forEach(async (evt) => {
            try {
              const { data } = await insertCalendarEvent(evt);
              if (data) {
                setCalendarEvts(p => p.map(e =>
                  e === evt || (e.building === evt.building && String(e.room) === String(evt.room) && e.type === evt.type && e.date === evt.date)
                    ? { ...e, supabaseId: data.id, source: 'supabase' } : e
                ));
              }
            } catch (err) { console.warn('[Supabase] 로컬 이벤트 DB 저장 실패:', err); }
          });
        }
        return [...sbEventItems, ...localOnly];
      });
      console.info(`[Supabase] 캘린더 이벤트 ${sbEventItems.length}건 로드 완료`);
    }

    // ── 공실 목록: rooms.vacancy_status 기반으로 activeVacancies 생성 ──
    const { setActiveVacancies } = useCalendarStore.getState();
    const vacanciesFromRooms = [];
    console.info(`[Supabase] 공실 체크: sbRooms ${sbRooms.length}개 중 vacancy_status 있는 것 ${sbRooms.filter(r => r.vacancy_status).length}개`);
    for (const r of sbRooms) {
      if (!r.vacancy_status) continue;
      const building = sbBuildings.find(b => b.id === r.building_id);
      if (!building) continue;
      // 관리사무소대행은 공실관리 제외 (기업시설관리는 호실 자체가 없음)
      if (building.is_management_agency && !building.is_short_term_rental && !building.is_long_term_rental && !building.is_commercial) continue;
      vacanciesFromRooms.push({
        building: building.building_name,
        room: r.room_number,
        type: buildTypeString(building),
        status: r.vacancy_status,
        deposit: r.standard_deposit || 0,
        rent: r.standard_rent || 0,
        nego: r.standard_rent || 0,
        mgmt: r.standard_management_fee || 0,
        waterFee: r.standard_water_fee || 0,
        cable: '', exitFee: 0, days: 0,
        commBroker: r.standard_broker_fee || 0,
        commEvent: '', pw: '',
        supabaseRoomId: r.id,
      });
    }
    // DB 기반으로 완전 교체 (정적 데이터 제거)
    console.info(`[Supabase] 공실 setActiveVacancies 호출: ${vacanciesFromRooms.length}건`);
    setActiveVacancies(vacanciesFromRooms);
    console.info(`[Supabase] 공실 setActiveVacancies 완료. 현재 store:`, useCalendarStore.getState().activeVacancies.length);

    // eslint-disable-next-line no-console
    console.info(`[Supabase] 건물 ${sbBuildingItems.length}개, 호실 ${Object.keys(sbRoomMaster).length}개, 임차인 ${sbTenantItems.length}명 로드 완료`);
  }, [data, isError, error]);
}
