const XLSX = require('xlsx');
const path = require('path');

// ========== BUILDINGS 테이블 ==========
const buildingsColumns = [
  // 1행: 컬럼명, 2행: 한글설명, 3행: 데이터타입/입력규칙, 4행: 예시
  ['building_name', '건물명 (필수)', 'text', '제이앤제이'],
  ['building_nickname', '건물 약칭', 'text', '제이'],
  ['address_old', '지번 주소', 'text', '서울시 관악구 봉천동 123-45'],
  ['address_road', '도로명 주소', 'text', '서울시 관악구 봉천로 123'],
  ['approved_date', '사용승인일', 'YYYY-MM-DD', '2011-11-14'],
  ['building_area_total', '건물 총면적(㎡)', '숫자', '330.5'],
  ['is_short_term_rental', '단기임대 여부', 'TRUE / FALSE', 'TRUE'],
  ['is_long_term_rental', '일반임대 여부', 'TRUE / FALSE', 'FALSE'],
  ['is_commercial', '근생(상가) 여부', 'TRUE / FALSE', 'FALSE'],
  ['is_management_agency', '관리사무소 여부', 'TRUE / FALSE', 'FALSE'],
  ['is_corporate_facility', '기업시설관리 여부', 'TRUE / FALSE', 'FALSE'],
  ['owner_name', '건물주1 이름', 'text', '박주희'],
  ['owner_resident_number', '건물주1 주민등록번호', 'text (000000-0000000)', '760329-2018615'],
  ['owner_phone', '건물주1 전화번호', 'text', '010-4250-8245'],
  ['owner_email', '건물주1 이메일', 'text', 'owner@email.com'],
  ['owner_home_address', '건물주1 자택주소', 'text', '서울시 강남구 역삼동 123'],
  ['owner_business_registration_number', '건물주1 사업자등록번호', 'text', '123-45-67890'],
  ['owner_business_name', '건물주1 상호명', 'text', '○○부동산'],
  ['owner_business_address', '건물주1 사업장주소', 'text', '서울시 관악구 봉천로 123'],
  ['owner_business_type', '건물주1 업태', 'text', '부동산임대업'],
  ['owner_business_item', '건물주1 종목', 'text', '임대'],
  ['owner_entity_type', '건물주1 법인유형', 'text (개인/법인)', '개인'],
  ['owner_2_name', '건물주2(부) 이름', 'text (없으면 비워두기)', ''],
  ['owner_2_resident_number', '건물주2 주민등록번호', 'text', ''],
  ['owner_2_phone', '건물주2 전화번호', 'text', ''],
  ['owner_2_email', '건물주2 이메일', 'text', ''],
  ['owner_2_home_address', '건물주2 자택주소', 'text', ''],
  ['owner_3_name', '건물주3 이름', 'text (없으면 비워두기)', ''],
  ['owner_3_resident_number', '건물주3 주민등록번호', 'text', ''],
  ['owner_3_phone', '건물주3 전화번호', 'text', ''],
  ['owner_3_email', '건물주3 이메일', 'text', ''],
  ['owner_3_home_address', '건물주3 자택주소', 'text', ''],
  ['co_owner_memo', '공동소유 메모', 'text', '부부 공동명의'],
  ['contact_person_name', '건물 관리인 이름', 'text', '김관리'],
  ['contact_person_phone', '건물 관리인 전화', 'text', '010-1234-5678'],
  ['contact_person_email', '건물 관리인 이메일', 'text', ''],
  ['is_contact_person_primary', '관리인이 주연락처 여부', 'TRUE / FALSE', 'FALSE'],
  ['building_manager_name', '건물 담당직원 이름', 'text', '박시현'],
  ['building_manager_phone', '건물 담당직원 전화', 'text', '010-0000-0000'],
  ['building_manager_email', '건물 담당직원 이메일', 'text', ''],
  ['tax_accountant_company', '세무사 사무소명', 'text', '○○세무회계'],
  ['tax_accountant_name', '세무사 이름', 'text', '이세무'],
  ['tax_accountant_phone', '세무사 전화', 'text', '02-123-4567'],
  ['tax_accountant_email', '세무사 이메일', 'text', ''],
  ['total_rooms', '총 호실 수', '숫자', '5'],
  ['has_rooms', '호실 보유 여부', 'TRUE / FALSE', 'TRUE'],
  ['entrance_door_password', '현관 비밀번호', 'text', '1234*'],
  ['electric_meter_location', '전기계량기 위치', 'text', '1층 계단 아래'],
  ['electric_meter_password', '전기계량기 비밀번호', 'text', ''],
  ['gas_meter_location', '가스계량기 위치', 'text', '각 호실 베란다'],
  ['gas_meter_password', '가스계량기 비밀번호', 'text', ''],
  ['parking_gate_info', '주차장 게이트 정보', 'text', '리모컨 3개 / 비밀번호 1234'],
  ['is_cctv', 'CCTV 유무', 'TRUE / FALSE', 'TRUE'],
  ['cctv_room_location', 'CCTV 녹화기 위치', 'text', '1층 관리실'],
  ['cctv_password', 'CCTV 비밀번호', 'text', 'admin1234'],
  ['rooftop_access_method', '옥상 접근 방법', 'text', '5층 계단 옥상문 비번 4321'],
  ['is_storage_available', '창고 유무', 'TRUE / FALSE', 'FALSE'],
  ['water_customer_number', '수도 고객번호 (건물 전체)', 'text', '12345678'],
  ['electric_customer_number', '전기 고객번호 (건물 전체)', 'text (호실별은 rooms에)', ''],
  ['electric_voltage_type', '전기 전압 유형', 'text (low/high)', 'low'],
  ['internet_provider', '인터넷 통신사', 'text', 'KT'],
  ['internet_contract_expiry_date', '인터넷 계약만료일', 'YYYY-MM-DD', '2027-03-31'],
  ['is_resident_registration_allowed', '전입신고 가능 여부', 'TRUE / FALSE / 비워두기(미확인)', 'TRUE'],
  ['is_renthome_agency', '렌트홈 중개업소 여부', 'TRUE / FALSE', 'FALSE'],
  ['is_standard_contract', '표준임대차계약서 사용', 'TRUE / FALSE', 'FALSE'],
  ['tax_invoice_handler', '세금계산서 발행 담당', 'text', '하우스맨'],
  ['fee_type', '수수료 유형', 'text (pct=%, fixed=정액, salary=월급, mgmt_collect=관리비수금)', 'pct'],
  ['fee_rate', '수수료율 (%인 경우)', '숫자 (5%→0.05)', '0.05'],
  ['fee_fixed_amount', '수수료 정액 (원)', '숫자', '0'],
  ['fee_vat_type', '부가가치세 유형', 'text (포함/별도/없음/전체)', ''],
  ['is_penalty_7days', '7일패널티 적용 여부', 'TRUE / FALSE', 'FALSE'],
  ['cleaning_fee', '기본 청소비 (원)', '숫자', '100000'],
  ['management_fee_billing_type', '관리비 선/후불', 'text (prepaid/postpaid)', 'prepaid'],
  ['water_billing_type', '수도 선/후불', 'text (prepaid/postpaid)', 'prepaid'],
  ['internet_billing_type', '인터넷 선/후불', 'text (prepaid/postpaid)', 'prepaid'],
  ['settlement_count', '정산 횟수 (월)', '숫자 (1 또는 2)', '1'],
  ['settlement_day_1', '정산일 1', '숫자 (1~28, 말일=31)', ''],
  ['settlement_day_2', '정산일 2 (2회 정산인 경우)', '숫자', ''],
  ['billing_cycle', '기업시설관리 청구주기', 'text (monthly/quarterly 등)', ''],
  ['contract_start_date', '관리위탁 계약시작일', 'YYYY-MM-DD', '2020-01-01'],
  ['septic_tank_cleaning_month_1', '정화조 청소 월 1', '숫자 (1~12)', ''],
  ['septic_tank_cleaning_month_2', '정화조 청소 월 2', '숫자 (1~12)', ''],
  ['monthly_inspection_count', '월간 순회 횟수', '숫자 (1~4)', '4'],
  ['special_terms', '특약사항', 'text', ''],
  ['memo', '메모', 'text', ''],
];

// ========== ROOMS 테이블 ==========
const roomsColumns = [
  ['building_name', '건물명 (필수, 매핑용 — buildings에 있는 이름과 동일해야 함)', 'text', '제이앤제이'],
  ['room_number', '호실번호 (필수)', 'text', '201'],
  ['is_managed', '관리 대상 여부', 'TRUE / FALSE', 'TRUE'],
  ['room_type', '호실 임대유형', '숫자 (1=단기, 2=일반임대, 3=상가/사무실)', '1'],
  ['area', '면적 (㎡)', '숫자', '33.5'],
  ['room_layout', '방 구조', 'text', '원룸 / 투룸 / 쓰리룸'],
  ['electric_customer_number', '전기 고객번호 (호실별)', 'text', '01-0316-7564'],
  ['gas_customer_number', '가스 고객번호 (호실별)', 'text', '18030055'],
  ['utility_payment_type', '공과금 청구 방식', 'text (auto=자동, manual=수기)', ''],
  ['standard_deposit', '기본 보증금/예치금 (원)', '숫자', '10000000'],
  ['standard_rent', '기본 임대료 (원)', '숫자', '1400000'],
  ['standard_management_fee', '기본 관리비 (원)', '숫자', '120000'],
  ['standard_water_fee', '수도료 (원)', '숫자', '25000'],
  ['water_payment_type', '수도 납부 방식', 'text', ''],
  ['standard_internet_fee', '인터넷/케이블 비용 (원)', '숫자', '25000'],
  ['standard_cleaning_fee', '청소비 (원)', '숫자', '100000'],
  ['variable_management_fee_memo', '변동관리비 메모', 'text', ''],
  ['standard_parking_fee', '주차비 (원)', '숫자', '0'],
  ['rent_discount_limit', '임대료 할인 한도 (원)', '숫자', ''],
  ['management_fee_billing_type', '관리비 선/후불 (호실 개별 설정, 비워두면 건물 설정 따름)', 'text (prepaid/postpaid)', ''],
  ['water_billing_type', '수도 선/후불 (호실 개별)', 'text (prepaid/postpaid)', ''],
  ['internet_billing_type', '인터넷 선/후불 (호실 개별)', 'text (prepaid/postpaid)', ''],
];

// ========== TENANTS 테이블 ==========
const tenantsColumns = [
  ['building_name', '건물명 (필수, 매핑용 — buildings에 있는 이름과 동일해야 함)', 'text', '제이앤제이'],
  ['room_number', '호실번호 (필수, 매핑용 — rooms에 있는 번호와 동일해야 함)', 'text', '201'],
  ['name', '임차인 이름 (필수)', 'text', '박정미'],
  ['phone', '연락처', 'text', '010-1234-5678'],
  ['email', '이메일', 'text', ''],
  ['business_registration_number', '사업자등록번호 (상가 임차인)', 'text', ''],
  ['id_number', '주민등록번호', 'text (000000-0000000)', '641101-2454626'],
  ['emergency_contact_name', '긴급연락처 이름', 'text', ''],
  ['emergency_contact_phone', '긴급연락처 전화', 'text', ''],
  ['emergency_contact_relation', '긴급연락처 관계', 'text (부모/배우자/형제 등)', ''],
  ['contract_start_date', '계약 시작일', 'YYYY-MM-DD', '2025-03-21'],
  ['contract_end_date', '계약 만기일', 'YYYY-MM-DD', '2027-03-20'],
  ['move_in_date', '실제 입주일', 'YYYY-MM-DD', '2025-03-21'],
  ['move_out_date', '퇴실일 (현재 거주중이면 비워두기)', 'YYYY-MM-DD', ''],
  ['is_active', '현재 입주 중 여부', 'TRUE / FALSE', 'TRUE'],
  ['deposit', '실제 보증금/예치금 (원)', '숫자', '10000000'],
  ['other_deposit1_desc', '기타 보증금1 설명', 'text', ''],
  ['other_deposit1_amount', '기타 보증금1 금액 (원)', '숫자', ''],
  ['other_deposit2_desc', '기타 보증금2 설명', 'text', ''],
  ['other_deposit2_amount', '기타 보증금2 금액 (원)', '숫자', ''],
  ['rent', '실제 임대료 (원)', '숫자', '1400000'],
  ['management_fee', '실제 관리비 (원)', '숫자', '120000'],
  ['water_fee', '실제 수도료 (원)', '숫자', '25000'],
  ['internet_fee', '실제 인터넷/케이블 (원)', '숫자', '25000'],
  ['cleaning_fee', '실제 청소비 (원)', '숫자', '100000'],
  ['parking_fee_1', '주차비 (원)', '숫자', ''],
  ['rent_billing_type', '임대료 선/후불', 'text (prepaid=선불, postpaid=후불)', 'prepaid'],
  ['car_number_1', '차량 번호', 'text', '12가 3456'],
  ['car_type_1', '차량 종류', 'text', '현대 아반떼'],
  ['broker_name', '중개 부동산명', 'text', '리안부동산'],
  ['broker_phone', '중개 부동산 연락처', 'text', '010-2640-9065'],
  ['broker_fee_amount', '중개수수료 (원)', '숫자', '100000'],
  ['broker_fee_paid', '중개수수료 지급 완료', 'TRUE / FALSE', 'FALSE'],
  ['broker_fee_paid_date', '중개수수료 지급일', 'YYYY-MM-DD', ''],
  ['pet_discovered_date', '애완동물 발견일', 'YYYY-MM-DD (없으면 비워두기)', ''],
  ['is_listing', '매물 등록 여부', 'TRUE / FALSE', 'FALSE'],
  ['listing_available_date', '매물 가능일', 'YYYY-MM-DD', ''],
  ['renewal_contract_start_date', '재계약 시작일', 'YYYY-MM-DD (재계약 없으면 비워두기)', ''],
  ['renewal_contract_end_date', '재계약 만기일', 'YYYY-MM-DD', ''],
  ['renewal_deposit', '재계약 보증금 (원)', '숫자', ''],
  ['renewal_rent', '재계약 임대료 (원)', '숫자', ''],
  ['renewal_management_fee', '재계약 관리비 (원)', '숫자', ''],
  ['prev_contract_start_date', '이전계약 시작일', 'YYYY-MM-DD', ''],
  ['prev_contract_end_date', '이전계약 만기일', 'YYYY-MM-DD', ''],
  ['prev_deposit', '이전계약 보증금 (원)', '숫자', ''],
  ['prev_rent', '이전계약 임대료 (원)', '숫자', ''],
  ['prev_management_fee', '이전계약 관리비 (원)', '숫자', ''],
  ['first_move_in_date', '최초 입주일 (재계약 이전 첫 입주)', 'YYYY-MM-DD', ''],
  ['payment_due_day', '월세 납부일', '숫자 (1~31)', '21'],
  ['management_fee_due_day', '관리비 납부일 (월세일과 다른 경우만)', '숫자 (1~31)', ''],
  ['memo', '메모 (특이사항, 할인 사유 등)', 'text', '20/5/3부터 월세130만원으로 인하'],
];

// ========== 엑셀 생성 ==========
function createSheet(columns) {
  const header = columns.map(c => c[0]);         // 1행: 컬럼명 (영문)
  const desc = columns.map(c => c[1]);            // 2행: 한글 설명
  const rule = columns.map(c => c[2]);            // 3행: 입력 규칙
  const example = columns.map(c => c[3]);         // 4행: 예시
  const data = [header, desc, rule, example];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // 열 너비 자동 조정
  ws['!cols'] = columns.map(c => {
    const maxLen = Math.max(c[0].length, c[1].length, c[2].length, c[3].length);
    return { wch: Math.min(Math.max(maxLen + 4, 15), 50) };
  });

  return ws;
}

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, createSheet(buildingsColumns), 'buildings');
XLSX.utils.book_append_sheet(wb, createSheet(roomsColumns), 'rooms');
XLSX.utils.book_append_sheet(wb, createSheet(tenantsColumns), 'tenants');

const outPath = path.join(__dirname, '..', 'Supabase_업로드_템플릿.xlsx');
XLSX.writeFile(wb, outPath);
console.log('생성 완료:', outPath);
