/**
 * 통합관리대장 엑셀 → 정규화된 JSON 추출
 * 실행: node scripts/extract-excel-data.cjs
 * 결과: scripts/output/ 폴더에 테이블별 JSON 생성
 */
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const EXCEL_PATH = path.join('C:', 'Users', 'legen', 'OneDrive', '하우스맨', '일일장부', '■ 1. 통합관리대장_2026년.xlsx');
const OUTPUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const wb = XLSX.readFile(EXCEL_PATH);
console.log('엑셀 로드 완료:', wb.SheetNames.join(', '));

// ── 유틸리티 ──
const excelDateToISO = (v) => {
  if (!v) return null;
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    if (/^\d{4}\.\d{2}\.\d{2}/.test(v)) return v.replace(/\./g, '-').slice(0, 10);
    return null;
  }
  if (typeof v === 'number' && v > 40000) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  }
  return null;
};

const toInt = (v) => {
  if (v == null || v === '' || v === '-') return 0;
  if (typeof v === 'number') return Math.round(v);
  const n = parseInt(String(v).replace(/[,원\s]/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

const toStr = (v) => (v == null ? '' : String(v).trim());

// ── 1. 건물정보 시트 → buildings 테이블 ──
// Row0: 번호|건물명|관리시작일|수수료율|7일패널티책임|부가가치세|표준임대차|건물주1㈜(이름/주민/전화)|건물주2(이름/주민/전화)|주소|E-MAIL|정산계좌|TV인터넷|세무사|통신사|사용승인일
// Row1: 서브헤더
// Row2~: 데이터
function extractBuildings() {
  const ws = wb.Sheets['◆건물정보'];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const buildings = [];
  for (let i = 2; i < raw.length; i++) {
    const row = raw[i];
    const name = toStr(row[1]);
    if (!name || name === '합계' || name === '소계') continue;

    buildings.push({
      name,
      mgmt_start: excelDateToISO(row[2]),    // C: 관리시작일
      fee_rate_or_amount: row[3],             // D: 수수료율
      penalty7_responsibility: toStr(row[4]), // E: 7일패널티책임
      vat: toStr(row[5]),                     // F: 부가가치세
      standard_lease: toStr(row[6]),          // G: 표준임대차
      owner1_name: toStr(row[7]),             // H: 건물주1 이름
      owner1_id: toStr(row[8]),               // I: 건물주1 주민번호
      owner1_phone: toStr(row[9]),            // J: 건물주1 전화
      owner2_name: toStr(row[10]),            // K: 건물주2 이름
      owner2_id: toStr(row[11]),              // L: 건물주2 주민번호
      owner2_phone: toStr(row[12]),           // M: 건물주2 전화
      address: toStr(row[13]),                // N: 주소
      email: toStr(row[14]),                  // O: E-MAIL
      settlement_account: toStr(row[15]),     // P: 정산계좌
      tv_internet: toStr(row[16]),            // Q: TV인터넷 계약
      tax_accountant: toStr(row[17]),         // R: 세무사
      telecom: toStr(row[18]),                // S: 통신사
      approval_date: excelDateToISO(row[19]), // T: 사용승인일
      raw_extra: row.slice(20, 23).map(c => c === '' ? null : c),
    });
  }

  console.log(`건물정보: ${buildings.length}건 추출`);
  return buildings;
}

// ── 2. 관리정보 시트 → rooms 테이블 ──
// Row0: 번호(1~22)
// Row1: 번호|건물명|호실|계좌|||| 고객번호||임대형태|전기가스청구|관리팀|수금팀|건물청소|퇴실청소|청소비지급|호실정보1~4|%|관리비
// Row2~: 데이터
function extractRooms() {
  const ws = wb.Sheets['◆관리정보'];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const rooms = [];
  for (let i = 2; i < raw.length; i++) {
    const row = raw[i];
    const building = toStr(row[1]);
    const room = toStr(row[2]);
    if (!building || !room) continue;

    rooms.push({
      building_name: building,
      room_number: room,
      account_type: toStr(row[3]),     // 4: 계좌
      deposit_name: toStr(row[4]),     // 5: (입금이름?)
      account1: toStr(row[5]),         // 6:
      account2: toStr(row[6]),         // 7:
      elec_no: toStr(row[7]),          // 8: 전기고객번호
      gas_no: toStr(row[8]),           // 9: 가스고객번호
      tenant_type: toStr(row[9]),      // 10: 임대형태
      utility_billing: toStr(row[10]), // 11: 전기가스청구
      mgmt_team: toStr(row[11]),       // 12: 관리팀
      collection_team: toStr(row[12]), // 13: 수금팀
      building_clean: toStr(row[13]),  // 14: 건물청소
      exit_clean: toStr(row[14]),      // 15: 퇴실청소
      clean_fee_payment: toStr(row[15]), // 16: 청소비지급
      info1: toStr(row[16]),           // 17: 호실정보1
      info2: toStr(row[17]),           // 18: 호실정보2
      info3: toStr(row[18]),           // 19: 호실정보3
      info4: toStr(row[19]),           // 20: 호실정보4
      fee_pct: row[20],               // 21: %
      mgmt_fee: toStr(row[21]),        // 22: 관리비
    });
  }

  console.log(`관리정보(rooms): ${rooms.length}건 추출`);
  return rooms;
}

// ── 3. 입주정보 시트 → tenants 테이블 ──
// Row0: 헤더 (건물명/호실/입주자/코드/납부기한/전월청구x2/당월청구x2/연체료/입주일/만기일/주민번호/연락처/예치금/임대료/""/관리비/""/수도/""/케이블/""/기타보증금/""/차량번호/청소비/중개수수료/""/부동산x2/전입신고/애완동물/기타/세입자연결/호실유형/재계약일/납부일)
// Row1~2: 서브헤더/번호
// Row3~: 데이터 (B열=건물명, C열=호실, D열=입주자)
function extractTenants() {
  const ws = wb.Sheets['■입주정보'];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const tenants = [];
  for (let i = 3; i < raw.length; i++) {
    const row = raw[i];
    const building = toStr(row[1]);  // B열: 건물명
    const room = toStr(row[2]);      // C열: 호실
    const name = toStr(row[3]);      // D열: 입주자
    if (!building || !room || !name) continue;
    if (['퇴실', '미노출', '공실', '1'].includes(name)) continue;

    tenants.push({
      building_name: building,
      room_number: room,
      name,
      code: toStr(row[4]),             // E: 코드
      due_day: row[5],                 // F: 납부기한 (엑셀 시리얼)
      prev_billing_owner: toInt(row[6]),  // G: 전월청구(건물주)
      prev_billing_hm: toInt(row[7]),    // H: 전월청구(하우스맨)
      curr_billing_owner: toInt(row[8]), // I: 당월청구(건물주)
      curr_billing_hm: toInt(row[9]),    // J: 당월청구(하우스맨)
      late_fee: toInt(row[10]),        // K: 연체료
      move_in: excelDateToISO(row[11]),  // L: 입주일
      expiry: excelDateToISO(row[12]),   // M: 만기일
      id_number: toStr(row[13]),       // N: 주민번호
      phone: toStr(row[14]),           // O: 연락처
      deposit: toInt(row[15]),         // P: 예치금
      rent: toInt(row[16]),            // Q: 임대료
      rent_type: toStr(row[17]),       // R: (선/후불)
      mgmt: toInt(row[18]),            // S: 관리비
      mgmt_type: toStr(row[19]),       // T: (선/후불)
      waterFee: toInt(row[20]),           // U: 수도
      water_type: toStr(row[21]),      // V: (선/후불)
      cable: toInt(row[22]),           // W: 케이블
      cable_type: toStr(row[23]),      // X: (선/후불)
      extra_deposit: toInt(row[24]),   // Y: 기타보증금
      extra_deposit_type: toStr(row[25]), // Z: 유형
      car_number_1: toStr(row[26]),      // AA: 차량번호
      clean_fee: toInt(row[27]),       // AB: 청소비
      brokerage_fee: toInt(row[28]),   // AC: 중개수수료
      brokerage_type: toStr(row[29]),  // AD: (유형)
      broker_name: toStr(row[30]),     // AE: 부동산
      broker_phone: toStr(row[31]),    // AF: 부동산 연락처
      registration: toStr(row[32]),    // AG: 전입신고
      pet: toStr(row[33]),             // AH: 애완동물
      memo: toStr(row[34]),            // AI: 기타
      tenant_link: toStr(row[35]),     // AJ: 세입자 연결
      room_type: toStr(row[36]),       // AK: 호실 유형
      renewal_date: excelDateToISO(row[37]), // AL: 재계약일
      pay_day: toInt(row[38]),         // AM: 납부일
    });
  }

  console.log(`입주정보(tenants): ${tenants.length}건 추출`);
  return tenants;
}

// ── 4. 퇴실정보 시트 → past_tenants 테이블 ──
// Row0: 번호|건물명|호실|코드명|퇴실일|전기지침|가스지침|이름|입주일|만기일|예치금|임대료|관리비|퇴실청소비|중개수수료|주차
// Row1~: 데이터
function extractPastTenants() {
  const ws = wb.Sheets['■퇴실정보'];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const pastTenants = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    const building = toStr(row[1]);
    const room = toStr(row[2]);
    const name = toStr(row[7]);
    if (!building || !room || !name) continue;

    pastTenants.push({
      seq: toInt(row[0]),
      building_name: building,
      room_number: room,
      code: toStr(row[3]),
      move_out: excelDateToISO(row[4]),
      elec_reading: toStr(row[5]),
      gas_reading: toStr(row[6]),
      name,
      move_in: excelDateToISO(row[8]),
      expiry: excelDateToISO(row[9]),
      deposit: toInt(row[10]),
      rent: toInt(row[11]),
      mgmt: toInt(row[12]),
      clean_fee: toInt(row[13]),
      brokerage_fee: toInt(row[14]),
      parking: toStr(row[15]),
    });
  }

  console.log(`퇴실정보: ${pastTenants.length}건 추출`);
  return pastTenants;
}

// ── 5. 공실현황 시트 → vacancies 테이블 ──
// Row3: 중개수수료(추가/기본)|건물명|호수|현관비번|예치금|월세|NEGO|관리비|수도|케이블|퇴실비|공실기간|단기/일반/상가
// Row5~: 데이터 (금액은 만원 단위)
// 우측 (col 19~29): 기초 값 (전 호실 임대 조건)
function extractVacancies() {
  const ws = wb.Sheets['□공실현황'];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // 좌측: 현재 공실 (Row 5~, col 0~14)
  const vacancies = [];
  for (let i = 5; i < raw.length; i++) {
    const row = raw[i];
    const building = toStr(row[2]);  // col C: 건물명
    const room = toStr(row[3]);      // col D: 호수
    if (!building || !room) continue;

    vacancies.push({
      brokerage_extra: toStr(row[0]),  // A: 중개수수료(추가)
      brokerage_base: toStr(row[1]),   // B: 중개수수료(기본)
      building_name: building,
      room_number: room,
      password: toStr(row[4]),         // E: 현관비번
      deposit: row[5],                 // F: 예치금 (만원 단위)
      rent: row[6],                    // G: 월세 (만원 단위)
      nego: row[7],                    // H: NEGO
      mgmt: row[8],                    // I: 관리비 (만원 단위)
      waterFee: toStr(row[9]),            // J: 수도
      cable: toStr(row[10]),           // K: 케이블
      exit_fee: row[11],               // L: 퇴실비 (만원 단위)
      vacant_days: toInt(row[12]),     // M: 공실기간
      tenant_type: toStr(row[13]),     // N: 단기/일반/상가
    });
  }

  // 우측: 기초 값 (전 호실 임대조건, col 19~29)
  const baseValues = [];
  for (let i = 5; i < raw.length; i++) {
    const row = raw[i];
    const building = toStr(row[21]); // col V: 건물명
    const deposit = row[22];         // col W: 예치금
    if (!building) continue;

    baseValues.push({
      building_name: building,
      deposit: deposit,              // 만원 단위
      rent: row[23],                 // 월세 (만원)
      nego: row[24],                 // NEGO
      mgmt: row[25],                 // 관리비 (만원)
      waterFee: toStr(row[26]),         // 수도
      cable: toStr(row[27]),         // 케이블
      clean_fee: row[28],            // 퇴실청소비 (만원)
      room_type: toStr(row[29]),     // 룸 형태
    });
  }

  console.log(`공실현황: ${vacancies.length}건 (현재공실) + ${baseValues.length}건 (기초값)`);
  return { current: vacancies, base_values: baseValues };
}

// ── 6. 재계약 일정 ──
// Row0이 "내용" 헤더 — 실제로는 요약 행이 상단에 있을 수 있음
function extractRenewals() {
  const ws = wb.Sheets['□재계약 일정'];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // 실제 데이터 헤더 찾기
  const headerIdx = raw.findIndex(r => {
    const s = toStr(r[0]);
    return s === '건물명' || s === '번호';
  });

  const startRow = headerIdx >= 0 ? headerIdx + 1 : 1;

  const renewals = [];
  for (let i = startRow; i < raw.length; i++) {
    const row = raw[i];
    const building = toStr(row[0]);
    const room = toStr(row[1]);
    if (!building || !room) continue;

    renewals.push({
      building_name: building,
      room_number: room,
      name: toStr(row[2]),
      expiry: excelDateToISO(row[3]),
      contract_date: excelDateToISO(row[4]),
      rent: toInt(row[5]),
      mgmt: toInt(row[6]),
      memo: toStr(row[7]),
    });
  }

  console.log(`재계약: ${renewals.length}건 추출`);
  return renewals;
}

// ── 7. 관리건물 목록 ──
function extractBuildingList() {
  const ws = wb.Sheets['관리건물_목록'];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const list = raw.map(r => toStr(r[0])).filter(n => n && n !== '건물명' && n !== '관리건물 목록');
  console.log(`관리건물 목록: ${list.length}개`);
  return list;
}

// ── 실행 ──
console.log('\n=== 추출 시작 ===\n');

const buildingList = extractBuildingList();
const buildings = extractBuildings();
const rooms = extractRooms();
const tenants = extractTenants();
const pastTenants = extractPastTenants();
const vacancyData = extractVacancies();
const renewals = extractRenewals();

// 저장
const save = (name, data) => {
  const p = path.join(OUTPUT_DIR, `${name}.json`);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  const count = Array.isArray(data) ? data.length + '건' : (data.current ? data.current.length + '+' + data.base_values.length + '건' : 'object');
  console.log(`  → ${name}.json (${count})`);
};

console.log('\n=== 저장 ===\n');
save('building_list', buildingList);
save('buildings', buildings);
save('rooms', rooms);
save('tenants', tenants);
save('past_tenants', pastTenants);
save('vacancies', vacancyData);
save('renewals', renewals);

// ── 요약 통계 ──
console.log('\n=== 요약 ===');
console.log(`건물 목록: ${buildingList.length}개`);
console.log(`건물 정보: ${buildings.length}건`);
console.log(`관리 호실: ${rooms.length}건`);
console.log(`입주 임차인: ${tenants.length}건`);
console.log(`퇴실 임차인: ${pastTenants.length}건`);
console.log(`현재 공실: ${vacancyData.current.length}건`);
console.log(`기초 임대조건: ${vacancyData.base_values.length}건`);
console.log(`재계약: ${renewals.length}건`);

// 건물별 임차인 수
const bCount = {};
tenants.forEach(t => { bCount[t.building_name] = (bCount[t.building_name] || 0) + 1; });
console.log('\n건물별 입주 현황:');
Object.entries(bCount).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}명`));

// 검증: 빈 필수 필드
const issues = [];
tenants.forEach((t, i) => {
  if (!t.move_in) issues.push(`입주 #${i+1} ${t.building_name} ${t.room_number} ${t.name}: 입주일 없음`);
  if (t.rent === 0 && t.deposit === 0) issues.push(`입주 #${i+1} ${t.building_name} ${t.room_number} ${t.name}: 월세+예치금 모두 0`);
});
if (issues.length > 0) {
  console.log(`\n=== 주의 사항 (${issues.length}건) ===`);
  issues.slice(0, 20).forEach(i => console.log(`  ⚠ ${i}`));
  if (issues.length > 20) console.log(`  ... 외 ${issues.length - 20}건`);
}
