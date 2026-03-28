const path = require('path');
const XLSX = require('xlsx');

// ─── Read source data ───
const filePath = path.join('C:', 'Users', 'legen', 'OneDrive', '하우스맨', '일일장부', '■ 1. 통합관리대장_2026년.xlsx');
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets['■입주정보'];
const srcData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });

// ─── Helper: Excel serial date → YYYY-MM-DD ───
function serialToDate(serial) {
  if (serial === '' || serial === null || serial === undefined) return '';
  if (typeof serial === 'string') {
    // Already a date string?
    if (/^\d{4}-\d{2}-\d{2}$/.test(serial)) return serial;
    // Try parsing as number
    const n = Number(serial);
    if (isNaN(n) || n < 10000) return ''; // not a valid serial
    serial = n;
  }
  if (typeof serial !== 'number' || serial < 10000) return '';
  const d = new Date((serial - 25569) * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}

// ─── Helper: Clean phone number ───
function cleanPhone(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (!s) return '';
  return s;
}

// ─── Helper: Classify ID vs business registration ───
function classifyId(v) {
  if (!v) return { id_number: '', business_registration_number: '' };
  const s = String(v).trim();
  // Business: XXX-XX-XXXXX (10 digits with dashes)
  if (/^\d{3}-\d{2}-\d{5}$/.test(s)) {
    return { id_number: '', business_registration_number: s };
  }
  // Otherwise treat as id_number
  return { id_number: s, business_registration_number: '' };
}

// ─── Helper: safe number ───
function safeNum(v) {
  if (v === '' || v === null || v === undefined) return '';
  const n = Number(v);
  if (isNaN(n)) return '';
  return n;
}

// ─── Helper: safe string ───
function safeStr(v) {
  if (v === '' || v === null || v === undefined) return '';
  return String(v).trim();
}

// ─── Column definitions ───
const columns = [
  { key: 'building_name', ko: '건물명 (매핑용 — buildings 테이블의 building_name과 정확히 동일해야 함)', rule: 'text (필수)', example: '제이앤제이' },
  { key: 'room_number', ko: '호실번호 (매핑용 — rooms 테이블의 room_number와 정확히 동일해야 함)', rule: 'text (필수)', example: '201' },
  { key: 'name', ko: '임차인 이름 (필수)', rule: 'text (필수)', example: '박정미' },
  { key: 'phone', ko: '연락처', rule: 'text (010-0000-0000 형식)', example: '010-8720-2709' },
  { key: 'email', ko: '이메일', rule: 'text', example: '' },
  { key: 'business_registration_number', ko: '사업자등록번호 (상가 임차인만, 000-00-00000 형식)', rule: 'text (000-00-00000)', example: '' },
  { key: 'id_number', ko: '주민등록번호 (000000-0000000 형식)', rule: 'text (000000-0000000)', example: '641101-2454626' },
  { key: 'emergency_contact_name', ko: '긴급연락처 이름', rule: 'text', example: '' },
  { key: 'emergency_contact_phone', ko: '긴급연락처 전화', rule: 'text (010-0000-0000)', example: '' },
  { key: 'emergency_contact_relation', ko: '긴급연락처 관계 (부모/배우자/형제/자녀 등)', rule: 'text', example: '' },
  { key: 'contract_start_date', ko: '계약시작일 (=입주일과 같을 수 있음)', rule: 'YYYY-MM-DD', example: '2018-03-05' },
  { key: 'contract_end_date', ko: '계약만기일', rule: 'YYYY-MM-DD', example: '2018-09-13' },
  { key: 'move_in_date', ko: '실제 입주일', rule: 'YYYY-MM-DD', example: '2018-03-05' },
  { key: 'move_out_date', ko: '퇴실일 (현재 거주중이면 비워두기)', rule: 'YYYY-MM-DD', example: '' },
  { key: 'is_active', ko: '현재 입주 중 여부 (퇴실/공실/건물주이면 FALSE)', rule: 'TRUE / FALSE', example: 'TRUE' },
  { key: 'deposit', ko: '실제 보증금/예치금 (원)', rule: '숫자', example: 1400000 },
  { key: 'other_deposit1_desc', ko: '기타보증금1 설명 (주차키보증금 등)', rule: 'text', example: '' },
  { key: 'other_deposit1_amount', ko: '기타보증금1 금액 (원)', rule: '숫자', example: '' },
  { key: 'other_deposit2_desc', ko: '기타보증금2 설명', rule: 'text', example: '' },
  { key: 'other_deposit2_amount', ko: '기타보증금2 금액 (원)', rule: '숫자', example: '' },
  { key: 'rent', ko: '실제 임대료 (원)', rule: '숫자', example: 1300000 },
  { key: 'management_fee', ko: '실제 관리비 (원)', rule: '숫자', example: 100000 },
  { key: 'water_fee', ko: '실제 수도료 (원)', rule: '숫자', example: 15000 },
  { key: 'internet_fee', ko: '실제 인터넷/케이블 (원)', rule: '숫자', example: 25000 },
  { key: 'cleaning_fee', ko: '실제 청소비 (원, 퇴실시 부과)', rule: '숫자', example: 150000 },
  { key: 'parking_fee_1', ko: '주차비 (원, 월)', rule: '숫자', example: '' },
  { key: 'rent_billing_type', ko: '임대료 선/후불 (비워두면 선불 기본)', rule: 'text (prepaid / postpaid)', example: '' },
  { key: 'car_number_1', ko: '차량 번호', rule: 'text', example: '' },
  { key: 'car_type_1', ko: '차량 종류', rule: 'text', example: '' },
  { key: 'broker_name', ko: '중개 부동산명', rule: 'text', example: '도성부동산' },
  { key: 'broker_phone', ko: '중개 부동산 연락처', rule: 'text', example: '010-5184-6988' },
  { key: 'broker_fee_amount', ko: '중개수수료 기본 (원)', rule: '숫자', example: 150000 },
  { key: 'broker_fee_paid', ko: '중개수수료 지급완료', rule: 'TRUE / FALSE', example: '' },
  { key: 'broker_fee_paid_date', ko: '중개수수료 지급일', rule: 'YYYY-MM-DD', example: '' },
  { key: 'pet_discovered_date', ko: '애완동물 발견일 (없으면 비워두기)', rule: 'YYYY-MM-DD', example: '' },
  { key: 'is_listing', ko: '매물등록 여부', rule: 'TRUE / FALSE', example: '' },
  { key: 'listing_available_date', ko: '매물 가능일', rule: 'YYYY-MM-DD', example: '' },
  { key: 'renewal_contract_start_date', ko: '재계약 시작일 (재계약 없으면 비워두기)', rule: 'YYYY-MM-DD', example: '' },
  { key: 'renewal_contract_end_date', ko: '재계약 만기일', rule: 'YYYY-MM-DD', example: '' },
  { key: 'renewal_deposit', ko: '재계약 보증금 (원)', rule: '숫자', example: '' },
  { key: 'renewal_rent', ko: '재계약 임대료 (원)', rule: '숫자', example: '' },
  { key: 'renewal_management_fee', ko: '재계약 관리비 (원)', rule: '숫자', example: '' },
  { key: 'prev_contract_start_date', ko: '이전계약 시작일', rule: 'YYYY-MM-DD', example: '' },
  { key: 'prev_contract_end_date', ko: '이전계약 만기일', rule: 'YYYY-MM-DD', example: '' },
  { key: 'prev_deposit', ko: '이전계약 보증금 (원)', rule: '숫자', example: '' },
  { key: 'prev_rent', ko: '이전계약 임대료 (원)', rule: '숫자', example: '' },
  { key: 'prev_management_fee', ko: '이전계약 관리비 (원)', rule: '숫자', example: '' },
  { key: 'first_move_in_date', ko: '최초 입주일 (재계약 이전 첫 입주, 재계약 없으면 비워두기)', rule: 'YYYY-MM-DD', example: '' },
  { key: 'payment_due_day', ko: '월세 납부일 (매월 몇일)', rule: '숫자 (1~31)', example: 3 },
  { key: 'management_fee_due_day', ko: '관리비 납부일 (월세일과 다를 경우만 입력)', rule: '숫자 (1~31)', example: '' },
  { key: 'memo', ko: '메모 (특이사항, 할인사유, 특약 등)', rule: 'text', example: '20/5/3부터 월세130만원으로 인하./셋탑박스하우스맨 보관' },
  // ── 렌트프리 ──
  { key: 'rent_free_1_type', ko: '1차 렌트프리 유형 (rent_only=임대료만면제, full=임대료+관리비면제)', rule: 'rent_only / full', example: 'rent_only' },
  { key: 'rent_free_1_months', ko: '1차 렌트프리 기간 (개월)', rule: '숫자', example: 2 },
  { key: 'rent_free_1_start_date', ko: '1차 렌트프리 시작일', rule: 'YYYY-MM-DD', example: '2026-04-01' },
  { key: 'rent_free_1_end_date', ko: '1차 렌트프리 종료일', rule: 'YYYY-MM-DD', example: '2026-05-31' },
  { key: 'rent_free_2_type', ko: '2차 렌트프리 유형 (최대 2회, 후반부 등)', rule: 'rent_only / full', example: '' },
  { key: 'rent_free_2_months', ko: '2차 렌트프리 기간 (개월)', rule: '숫자', example: '' },
  { key: 'rent_free_2_start_date', ko: '2차 렌트프리 시작일', rule: 'YYYY-MM-DD', example: '' },
  { key: 'rent_free_2_end_date', ko: '2차 렌트프리 종료일', rule: 'YYYY-MM-DD', example: '' },
];

// ─── Build header rows ───
const row1_en = columns.map(c => c.key);
const row2_ko = columns.map(c => c.ko);
const row3_rule = columns.map(c => c.rule);
const row4_example = columns.map(c => c.example);

// ─── Map source data ───
const INACTIVE_NAMES = ['퇴실', '공실', '건물주', ''];

const dataRows = [];
for (let i = 3; i < srcData.length; i++) {
  const row = srcData[i];
  const building = safeStr(row[1]);
  if (!building) continue;

  const name = safeStr(row[3]);
  const isActive = !INACTIVE_NAMES.includes(name) ? 'TRUE' : 'FALSE';

  const { id_number, business_registration_number } = classifyId(row[13]);

  // rent_billing_type: only map if clearly 후불
  let rentBillingType = '';
  const billingRaw = safeStr(row[17]);
  if (billingRaw === '후불') rentBillingType = 'postpaid';

  // pet_discovered_date: only if it looks like a date serial or date string
  let petDate = '';
  const petRaw = row[33];
  if (petRaw) {
    const converted = serialToDate(petRaw);
    if (converted) petDate = converted;
  }

  // renewal_contract_start_date from row[37]
  let renewalStart = '';
  const renewalRaw = row[37];
  if (renewalRaw) {
    const converted = serialToDate(renewalRaw);
    if (converted) renewalStart = converted;
  }

  const mapped = {
    building_name: building,
    room_number: String(row[2]),
    name: name,
    phone: cleanPhone(row[14]),
    email: '',
    business_registration_number: business_registration_number,
    id_number: id_number,
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    contract_start_date: serialToDate(row[11]),
    contract_end_date: serialToDate(row[12]),
    move_in_date: serialToDate(row[11]),
    move_out_date: '',
    is_active: isActive,
    deposit: safeNum(row[15]),
    other_deposit1_desc: safeStr(row[25]),
    other_deposit1_amount: safeNum(row[24]),
    other_deposit2_desc: '',
    other_deposit2_amount: '',
    rent: safeNum(row[16]),
    management_fee: safeNum(row[18]),
    water_fee: safeNum(row[20]),
    internet_fee: safeNum(row[22]),
    cleaning_fee: safeNum(row[27]),
    parking_fee_1: '',
    rent_billing_type: rentBillingType,
    car_number_1: safeStr(row[26]),
    car_type_1: '',
    broker_name: safeStr(row[30]),
    broker_phone: cleanPhone(row[31]),
    broker_fee_amount: safeNum(row[28]),
    broker_fee_paid: '',
    broker_fee_paid_date: '',
    pet_discovered_date: petDate,
    is_listing: '',
    listing_available_date: '',
    renewal_contract_start_date: renewalStart,
    renewal_contract_end_date: '',
    renewal_deposit: '',
    renewal_rent: '',
    renewal_management_fee: '',
    prev_contract_start_date: '',
    prev_contract_end_date: '',
    prev_deposit: '',
    prev_rent: '',
    prev_management_fee: '',
    first_move_in_date: '',
    payment_due_day: safeNum(row[38]),
    management_fee_due_day: '',
    memo: safeStr(row[34]),
  };

  dataRows.push(columns.map(c => mapped[c.key]));
}

console.log(`Mapped ${dataRows.length} data rows`);

// ─── Build worksheet ───
const allRows = [row1_en, row2_ko, row3_rule, row4_example, ...dataRows];
const newWs = XLSX.utils.aoa_to_sheet(allRows);

// ─── Column widths ───
const colWidths = columns.map(c => {
  // Use Korean description length as base, min 12, max 35
  const len = Math.max(12, Math.min(35, c.ko.length + 2));
  return { wch: len };
});
newWs['!cols'] = colWidths;

// ─── Freeze panes: freeze rows 1-3, scroll data from row 4 ───
// Also freeze first 3 columns (building, room, name)
newWs['!freeze'] = { xSplit: 3, ySplit: 3 };

// ─── Write output ───
const outWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(outWb, newWs, 'tenants');
const outPath = path.join('C:', 'Users', 'legen', 'OneDrive', '바탕 화면', '클로드코드수업', '260228', '③ tenants_임차인정보_작성중.xlsx');
XLSX.writeFile(outWb, outPath);
console.log('Written to:', outPath);
