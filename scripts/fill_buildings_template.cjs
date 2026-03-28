const XLSX = require('xlsx');
const path = require('path');

// ===== 소스 파일 읽기 =====
const wb1 = XLSX.readFile('C:/Users/legen/OneDrive/하우스맨/하우스맨정보.xlsx');
const wb2 = XLSX.readFile('C:/Users/legen/OneDrive/하우스맨/일일장부/■ 1. 통합관리대장_2026년.xlsx');

// 건물정보 시트 (통합관리대장)
const bldgSheet = XLSX.utils.sheet_to_json(wb2.Sheets['◆건물정보'], { header: 1, blankrows: false });
// 필수정보 시트 (하우스맨정보)
const infoSheet = XLSX.utils.sheet_to_json(wb1.Sheets['□필수정보(인쇄용)'], { header: 1, blankrows: false });
// 인터넷 약정
const netSheet = XLSX.utils.sheet_to_json(wb1.Sheets['인터넷 약정기간'], { header: 1, blankrows: false });
// 임대사업자
const bizSheet = XLSX.utils.sheet_to_json(wb1.Sheets['임대사업자등록여부'], { header: 1, blankrows: false });
// 창고
const storageSheet = XLSX.utils.sheet_to_json(wb1.Sheets['창고공간'], { header: 1, blankrows: false });

// ===== 인덱스 만들기 =====
// 필수정보: 건물명 → row (행1부터 데이터)
const infoMap = {};
infoSheet.slice(1).forEach(row => {
  if (row[1]) infoMap[row[1]] = row;
});

// 인터넷 약정: 건물명 → row
const netMap = {};
netSheet.slice(1).forEach(row => {
  if (row[0]) {
    // 건물명 정규화
    let name = row[0].replace(/\s/g, '');
    if (name === 'J$J') name = '제이앤제이';
    if (name === 'Y-1') name = '와이원빈티지';
    if (name.startsWith('지앤지2')) name = '지앤지2';
    if (name.startsWith('리트코')) name = '리트코하우스';
    if (name.startsWith('서우하우스')) name = '서우하우스';
    if (name.startsWith('다존하우스')) name = '다존하우스';
    if (name.startsWith('미래홈')) name = '미래홈';
    if (name.startsWith('옥당')) name = '옥당빌라';
    netMap[name] = row;
  }
});

// 임대사업자: 건물명 → row
const bizMap = {};
bizSheet.slice(1).forEach(row => {
  if (row[0]) {
    let name = row[0].replace(/\s/g, '');
    if (name === 'w하우스') name = 'W하우스';
    if (name === '우진') name = '우진빌딩';
    if (name === '우영') name = '우영빌딩';
    if (name === '대치') name = '대치칼텍빌딩';
    if (name === '서연') name = '서연빌';
    if (name === '집현전') name = '집현전빌딩';
    bizMap[name] = row;
  }
});

// 창고: 건물명 → row
const storageMap = {};
storageSheet.slice(1).forEach(row => {
  if (row[1]) storageMap[row[1]] = row;
});

// ===== 헬퍼 함수 =====
function excelDateToStr(serial) {
  if (!serial || typeof serial !== 'number') return '';
  if (serial < 10000) return ''; // 숫자가 아닌 경우
  const d = new Date((serial - 25569) * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}

function parseApprovedDate(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    if (val > 10000) return excelDateToStr(val);
    return '';
  }
  // "2011.11.14" 형식
  const s = String(val).replace(/\./g, '-');
  if (s.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
    const parts = s.split('-');
    return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
  }
  return '';
}

function parseFee(val) {
  if (val === null || val === undefined || val === '') return { type: '', rate: '', fixed: '' };
  if (typeof val === 'string') {
    // "140만+알파" 같은 경우
    return { type: 'fixed', rate: '', fixed: val };
  }
  if (typeof val === 'number') {
    if (val === 0) return { type: 'pct', rate: '0', fixed: '0' };
    if (val < 1) return { type: 'pct', rate: String(val), fixed: '0' };
    // 큰 숫자 = 정액
    return { type: 'fixed', rate: '0', fixed: String(Math.round(val)) };
  }
  return { type: '', rate: '', fixed: '' };
}

function parseVat(val) {
  if (!val) return '';
  if (val === '전체') return '전체';
  return String(val);
}

function parseStandardLease(val) {
  if (!val) return '';
  if (val === '전체') return 'TRUE';
  if (val === '일부') return 'TRUE'; // 노란색 표시 필요
  return '';
}

function parsePenalty(val) {
  if (!val) return 'FALSE';
  if (val === 'O' || val === 'o') return 'TRUE';
  return 'FALSE';
}

function parseResidentReg(val) {
  if (val === null || val === undefined) return '';
  if (val === 0 || val === '0' || val === 'X' || val === 'x') return 'FALSE';
  if (val === 1 || val === 2 || val === '1' || val === '2') return 'TRUE';
  return '';
}

function parseBizRegistered(row) {
  if (!row || !row[1]) return '';
  const v = String(row[1]).trim();
  if (v === '등록함') return 'TRUE';
  if (v === 'X') return 'FALSE';
  if (v === '근생' || v === '근생으로 등록됨') return ''; // 애매
  if (v === '개인') return 'FALSE';
  if (v === '부재') return '';
  return '';
}

function parseRenthome(row) {
  if (!row || !row[2]) return '';
  const v = String(row[2]).trim().toLowerCase();
  if (v === 'o') return 'TRUE';
  if (v === 'x') return 'FALSE';
  if (v.includes('신고함')) return 'TRUE';
  if (v.includes('상관없음')) return '';
  return ''; // 애매한 건 비워두기
}

function parseNetExpiry(val) {
  if (!val) return '';
  const s = String(val).trim();
  // "26.3.30" → "2026-03-30"
  const m = s.match(/(\d{2})\.(\d{1,2})\.?(\d{1,2})?/);
  if (m) {
    const y = '20' + m[1];
    const mo = (m[2] || '').padStart(2, '0');
    const d = (m[3] || '01').padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }
  // 숫자 (Excel serial)
  if (typeof val === 'number' && val > 40000) return excelDateToStr(val);
  return ''; // "건물주님이 알아서 하겠다고 함" 등
}

function parseNetProvider(val) {
  if (!val) return '';
  const s = String(val);
  if (s.includes('딜라이브')) return '딜라이브';
  if (s.includes('KT') || s.includes('kt')) return 'KT';
  if (s.includes('LG') || s.includes('lg')) return 'LG';
  if (s.includes('SK') || s.includes('sk')) return 'SK';
  return '';
}

// ===== 건물 데이터 행 생성 =====
// 노란색 표시할 셀 좌표 수집
const yellowCells = [];

// 템플릿 컬럼 순서
const colNames = [
  'building_name','building_nickname','address_old','address_road','approved_date','building_area_total',
  'is_short_term_rental','is_long_term_rental','is_commercial','is_management_agency','is_corporate_facility',
  'owner_name','owner_resident_number','owner_phone','owner_email','owner_home_address',
  'owner_business_registration_number','owner_business_name','owner_business_address','owner_business_type','owner_business_item','owner_entity_type',
  'owner_2_name','owner_2_resident_number','owner_2_phone','owner_2_email','owner_2_home_address',
  'owner_3_name','owner_3_resident_number','owner_3_phone','owner_3_email','owner_3_home_address',
  'co_owner_memo',
  'owner_bank_account_1','owner_bank_account_1_type','owner_bank_account_2','owner_bank_account_2_type',
  'owner_bank_account_3','owner_bank_account_3_type','owner_bank_account_4','owner_bank_account_4_type',
  'contact_person_name','contact_person_phone','contact_person_email','is_contact_person_primary',
  'building_manager_name','building_manager_phone','building_manager_email',
  'tax_accountant_company','tax_accountant_name','tax_accountant_phone','tax_accountant_email',
  'total_rooms','has_rooms',
  'entrance_door_password','electric_meter_location','electric_meter_password',
  'gas_meter_location','gas_meter_password','parking_gate_info',
  'is_cctv','cctv_room_location','cctv_password','rooftop_access_method',
  'is_storage_available',
  'water_customer_number','electric_customer_number','electric_voltage_type',
  'internet_provider','internet_contract_expiry_date',
  'is_resident_registration_allowed','is_renthome_agency','is_standard_contract','tax_invoice_handler',
  'fee_type','fee_rate','fee_fixed_amount','fee_vat_type','is_penalty_7days',
  'cleaning_fee',
  'management_fee_billing_type','water_billing_type','internet_billing_type',
  'tenant_account_type','has_variable_management_fee',
  'settlement_count','settlement_day_1','settlement_day_2',
  'billing_cycle','contract_start_date',
  'septic_tank_cleaning_month_1','septic_tank_cleaning_month_2','monthly_inspection_count',
  'special_terms','memo'
];

const descRow = [
  '건물명 (필수)','건물 약칭','지번 주소','도로명 주소','사용승인일','건물 총면적(㎡)',
  '단기임대 여부','일반임대 여부','근생(상가) 여부','관리사무소 여부','기업시설관리 여부',
  '건물주1 이름','건물주1 주민등록번호','건물주1 전화번호','건물주1 이메일','건물주1 자택주소',
  '건물주1 사업자등록번호','건물주1 상호명','건물주1 사업장주소','건물주1 업태','건물주1 종목','건물주1 법인유형',
  '건물주2(부) 이름','건물주2 주민등록번호','건물주2 전화번호','건물주2 이메일','건물주2 자택주소',
  '건물주3 이름','건물주3 주민등록번호','건물주3 전화번호','건물주3 이메일','건물주3 자택주소',
  '공동소유 메모',
  '건물주 정산계좌1','정산계좌1 용도','건물주 정산계좌2','정산계좌2 용도',
  '건물주 정산계좌3','정산계좌3 용도','건물주 정산계좌4','정산계좌4 용도',
  '건물 관리인 이름','건물 관리인 전화','건물 관리인 이메일','관리인=주연락처',
  '하우스맨 담당직원','담당직원 전화','담당직원 이메일',
  '세무사 사무소명','세무사 이름','세무사 전화','세무사 이메일',
  '총 호실 수','호실 보유 여부',
  '현관 비밀번호','전기계량기 위치','전기계량기 비밀번호',
  '가스계량기 위치','가스계량기 비밀번호','주차장 정보',
  'CCTV 유무','CCTV 녹화기 위치','CCTV 비밀번호','옥상 접근 방법',
  '창고 유무',
  '수도 고객번호(건물)','전기 고객번호(건물)','전기전압(low/high)',
  '인터넷 통신사','인터넷 계약만료일',
  '전입신고 가능 여부','렌트홈 중개업소','표준임대차계약서','세금계산서 담당',
  '수수료 유형(pct/fixed/salary)','수수료율(소수)','수수료 정액(원)','부가가치세','7일패널티',
  '기본 청소비(원)',
  '관리비 선후불','수도 선후불','인터넷 선후불',
  '입금계좌유형(houseman/owner)','변동관리비 여부',
  '정산횟수(월)','정산일1','정산일2',
  '청구주기','관리위탁 시작일',
  '정화조1월','정화조2월','순회횟수(월)',
  '특약사항','메모'
];

const ruleRow = [
  'text','text','text','text','YYYY-MM-DD','숫자',
  'TRUE/FALSE','TRUE/FALSE','TRUE/FALSE','TRUE/FALSE','TRUE/FALSE',
  'text','000000-0000000','text','text','text',
  'text','text','text','text','text','개인/법인',
  'text','text','text','text','text',
  'text','text','text','text','text',
  'text',
  '은행 계좌번호 예금주','text','text','text',
  'text','text','text','text',
  'text','text','text','TRUE/FALSE',
  'text','text','text',
  'text','text','text','text',
  '숫자','TRUE/FALSE',
  'text','text','text',
  'text','text','text',
  'TRUE/FALSE','text','text','text',
  'TRUE/FALSE',
  'text','text','low/high',
  'text','YYYY-MM-DD',
  'TRUE/FALSE','TRUE/FALSE','TRUE/FALSE','text',
  'pct/fixed/salary','숫자(5%→0.05)','숫자','포함/별도/없음/전체','TRUE/FALSE',
  '숫자',
  'prepaid/postpaid','prepaid/postpaid','prepaid/postpaid',
  'houseman/owner','TRUE/FALSE',
  '1또는2','1~31','1~31',
  'text','YYYY-MM-DD',
  '1~12','1~12','1~4',
  'text','text'
];

// ===== 데이터 행 생성 =====
const dataRows = [];

bldgSheet.slice(2).forEach((bRow, rowIdx) => {
  const name = bRow[1];
  if (!name) return;

  const info = infoMap[name] || [];
  const net = netMap[name] || [];
  const biz = bizMap[name] || [];
  const storage = storageMap[name] || [];
  const fee = parseFee(bRow[3]);

  // 정산계좌: 줄바꿈으로 여러개일 수 있음
  const accountStr = bRow[15] ? String(bRow[15]) : '';
  const accounts = accountStr.split(/\r?\n/).map(s => s.trim()).filter(s => s);

  // 건물유형 추론 (애매 → 노란색)
  // 임대사업자 시트에서 "근생" 표시된 건물
  const bizVal = biz[1] ? String(biz[1]).trim() : '';
  const isCommercial = bizVal === '근생' || bizVal === '근생으로 등록됨';
  // 나머지는 대부분 단기임대이지만 확신 없으므로 노란색

  const row = colNames.map(() => '');

  // === 확실한 매핑 ===
  row[0] = name; // building_name
  row[2] = info[3] || ''; // address_old (하우스맨정보.구주소)
  row[3] = info[4] || ''; // address_road (하우스맨정보.신주소)
  row[4] = parseApprovedDate(bRow[22]); // approved_date (건물정보.사용승인일)

  // 건물주1
  row[11] = bRow[7] || ''; // owner_name
  row[12] = bRow[8] ? String(bRow[8]) : ''; // owner_resident_number
  row[13] = bRow[9] ? String(bRow[9]).trim() : ''; // owner_phone
  row[14] = bRow[14] ? String(bRow[14]).trim() : ''; // owner_email
  row[15] = bRow[13] ? String(bRow[13]).trim() : ''; // owner_home_address (건물정보.주소 = 건물주 자택주소)

  // 건물주2
  row[22] = bRow[10] || ''; // owner_2_name
  row[23] = bRow[11] ? String(bRow[11]) : ''; // owner_2_resident_number
  row[24] = bRow[12] ? String(bRow[12]).trim() : ''; // owner_2_phone

  // 정산계좌
  if (accounts[0]) row[33] = accounts[0]; // owner_bank_account_1
  if (accounts[1]) row[35] = accounts[1]; // owner_bank_account_2

  // 세무사 (건물정보에 이메일만 있음)
  if (bRow[20]) row[50] = String(bRow[20]).trim(); // tax_accountant_email → 하지만 이건 세무사이메일이 아닐수도

  // 하우스맨 담당직원
  row[45] = info[0] || ''; // building_manager_name (하우스맨정보.담당자)

  // 시설 정보 (하우스맨정보)
  row[53] = info[8] || ''; // entrance_door_password
  row[54] = info[10] || ''; // electric_meter_location
  row[55] = (info[11] !== undefined && info[11] !== null) ? String(info[11]) : ''; // electric_meter_password
  row[56] = info[12] || ''; // gas_meter_location
  row[57] = (info[13] !== undefined && info[13] !== null) ? String(info[13]) : ''; // gas_meter_password

  // 주차 정보 합치기
  const parkParts = [];
  if (info[5]) parkParts.push('가능: ' + info[5]);
  if (info[6]) parkParts.push(String(info[6]));
  if (info[14]) parkParts.push('차단기: ' + info[14]);
  if (info[15]) parkParts.push('위치: ' + info[15]);
  row[58] = parkParts.join(' / '); // parking_gate_info

  // CCTV
  const hasCctv = info[16] && info[16] !== 'X' && info[16] !== 'x';
  row[59] = hasCctv ? 'TRUE' : 'FALSE'; // is_cctv
  row[60] = hasCctv ? String(info[16]) : ''; // cctv_room_location
  row[61] = info[18] ? String(info[18]) : ''; // cctv_password

  // 옥상
  row[62] = info[9] || ''; // rooftop_access_method

  // 창고
  const hasStorage = storage[2] && storage[2] !== 'X' && storage[2] !== 'x';
  row[63] = hasStorage ? 'TRUE' : 'FALSE'; // is_storage_available

  // 인터넷
  row[67] = parseNetProvider(net[2]) || (bRow[21] ? String(bRow[21]) : ''); // internet_provider
  row[68] = parseNetExpiry(net[1]); // internet_contract_expiry_date

  // 전입신고
  row[69] = parseResidentReg(info[19]); // is_resident_registration_allowed

  // 임대사업자 / 렌트홈
  row[70] = parseBizRegistered(biz); // is_renthome_agency → 아 이건 is_rental_business_registered가 맞는데 buildings테이블에 없음. renthome이 맞음
  row[70] = parseRenthome(biz); // is_renthome_agency

  // 표준임대차
  const stdLease = bRow[6];
  row[71] = stdLease === '전체' ? 'TRUE' : stdLease === '일부' ? 'TRUE' : stdLease ? String(stdLease) : ''; // is_standard_contract

  // 수수료
  row[73] = fee.type; // fee_type
  row[74] = fee.rate; // fee_rate
  row[75] = fee.fixed; // fee_fixed_amount
  row[76] = parseVat(bRow[5]); // fee_vat_type
  row[77] = parsePenalty(bRow[4]); // is_penalty_7days

  // 관리시작일
  row[87] = excelDateToStr(bRow[2]); // contract_start_date

  // === 애매한 매핑 (노란색) ===
  const dataRowNum = rowIdx + 4; // 0-indexed row in sheet (0=header, 1=desc, 2=rule, 3+=data)

  // 건물유형 - 추론이므로 노란색
  if (isCommercial) {
    row[8] = 'TRUE'; // is_commercial
  }
  // 단기임대/일반임대 → 소스에서 직접 구분 안됨 → 노란색
  yellowCells.push({ r: dataRowNum, c: 6 }); // is_short_term_rental
  yellowCells.push({ r: dataRowNum, c: 7 }); // is_long_term_rental
  if (isCommercial) yellowCells.push({ r: dataRowNum, c: 8 }); // is_commercial (추론)

  // owner_home_address - 건물정보.주소가 건물주 자택인지 확실치 않은 경우
  if (row[15]) yellowCells.push({ r: dataRowNum, c: 15 });

  // 표준임대차 "일부"인 경우
  if (stdLease === '일부') yellowCells.push({ r: dataRowNum, c: 71 });

  // 세무사 이메일 (건물정보 컬럼[20]이 세무사인지 불확실)
  if (bRow[20]) yellowCells.push({ r: dataRowNum, c: 50 });

  // 수수료가 특이한 경우 ("140만+알파", 454545 등)
  if (fee.type === 'fixed' && fee.fixed && isNaN(Number(fee.fixed))) yellowCells.push({ r: dataRowNum, c: 75 });

  dataRows.push(row);
});

// ===== 엑셀 생성 =====
const allRows = [colNames, descRow, ruleRow, ...dataRows];
const ws = XLSX.utils.aoa_to_sheet(allRows);

// 열 너비
ws['!cols'] = colNames.map((c, i) => {
  let maxLen = Math.max(c.length, descRow[i].length);
  dataRows.forEach(r => { if (r[i]) maxLen = Math.max(maxLen, String(r[i]).length); });
  return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
});

// 노란색 배경 적용
yellowCells.forEach(({ r, c }) => {
  const cellRef = XLSX.utils.encode_cell({ r, c });
  if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
  if (!ws[cellRef].s) ws[cellRef].s = {};
  ws[cellRef].s = { fill: { fgColor: { rgb: 'FFFF00' } } };
});

// 헤더 행 스타일 (1행: 굵게)
colNames.forEach((_, c) => {
  const cellRef = XLSX.utils.encode_cell({ r: 0, c });
  if (ws[cellRef]) {
    if (!ws[cellRef].s) ws[cellRef].s = {};
    ws[cellRef].s.font = { bold: true };
  }
});

const wb_out = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb_out, ws, 'buildings');

const outPath = path.join(__dirname, '..', '① buildings_건물정보_작성중.xlsx');
XLSX.writeFile(wb_out, outPath, { cellStyles: true });

// 결과 리포트
console.log('생성 완료:', outPath);
console.log('건물 수:', dataRows.length);
console.log('노란색(확인필요) 셀:', yellowCells.length + '개');
console.log('\n=== 비워둔 항목 (소스 데이터 없음) ===');
const emptyFields = [
  'building_nickname (건물 약칭)',
  'building_area_total (건물 면적)',
  'owner_business_* (건물주 사업자 정보)',
  'owner_entity_type (법인유형)',
  'owner_2_email, owner_2_home_address',
  'owner_3_* (건물주3)',
  'owner_bank_account_*_type (계좌 용도)',
  'contact_person_* (건물 관리인)',
  'building_manager_phone/email (담당직원 연락처)',
  'tax_accountant_company/name/phone (세무사 상세)',
  'total_rooms (호실수)',
  'water/electric_customer_number (건물 공과금 번호)',
  'cleaning_fee (기본 청소비)',
  'billing_type 선후불 (관리비/수도/인터넷)',
  'tenant_account_type (입금계좌유형)',
  'settlement_count/day (정산일)',
  'monthly_inspection_count (순회횟수)',
  'special_terms (특약)',
];
emptyFields.forEach(f => console.log('  -', f));

console.log('\n=== 노란색(확인필요) 항목 ===');
console.log('  - is_short_term_rental / is_long_term_rental (건물유형 직접 판단 필요)');
console.log('  - is_commercial (임대사업자 시트에서 추론, 확인 필요)');
console.log('  - owner_home_address (건물정보.주소 = 건물주자택? 확인 필요)');
console.log('  - 표준임대차 "일부"인 건물');
console.log('  - 세무사 이메일 (건물정보 컬럼이 세무사인지 불확실)');
