const XLSX = require('xlsx');
const path = require('path');
const templatePath = path.join(__dirname, '..', '① buildings_건물정보_작성중.xlsx');
const wb = XLSX.readFile(templatePath);
const data = XLSX.utils.sheet_to_json(wb.Sheets['buildings'], { header: 1 });
const headers = data[0];
const ci = {};
headers.forEach((h, i) => { ci[h] = i; });

// === 정산서에서 100% 확인된 데이터만 ===

// 1. fee_vat_type: 기존에 비어있던 건물 → 정산서에서 확인
// "전체"는 이미 매핑됨. 비어있는 건물만 채움.
const vatType = {
  // 정산서에서 VAT 섹션 자체가 없거나 0 → "없음"
  '제이앤제이': '없음',     // 수수료 0%라 VAT 무의미
  '스타빌': '없음',         // 정산서 VAT 0
  '에덴빌': '없음',         // 정산서 VAT 0
  '지앤지2': '없음',        // 정산서 VAT 없음
  '모던하우스': '없음',     // 정산서 부가세 항목 없음
  '한스텔': '없음',         // 정산서 VAT 섹션 없음
  // 정산서에서 명확히 별도 확인
  '아페이론': '별도',       // 세액 61,500 on 615,000
  '포유빌': '별도',         // 세액 29,700 on 297,000
  '미래홈': '별도',         // 세액 80,400 on 804,000
  '토브미하우스': '별도',   // 정산서 부가세 별도 명시
  '리트코하우스': '별도',   // 헤더에 6% VAT별도 명시
  '서우하우스': '별도',     // 정산서 "부가세 별도" 명시
  '제이에스하우스': '별도', // 세금계산서 발행
  '우영빌딩': '별도',       // 공급가 1,210,000 + 세액 121,000
  '우진빌딩': '별도',       // 공급가 854,545 + 세액 85,454
  '대치칼텍빌딩': '별도',   // 공급가 500,000 + 세액 50,000
  '서연빌': '별도',         // 공급가 500,000 + 세액 50,000
  '문화빌딩': '별도',       // 공급가 900,000 + 세액 90,000
  '집현전빌딩': '별도',     // 공급가 900,000 + 세액 90,000
  '어반그레이': '별도',     // 공급가 370,000 + 세액 37,000
  '이례빌딩': '별도',       // 공급가 800,000 + 세액 80,000
  'KMC코리아': '별도',      // 공급가 2,410,000 + 세액 241,000
  '상건빌딩': '별도',       // 공급가 876,636 + 세액 87,664
  '미진빌딩': '별도',       // 공급가 900,000 + 세액 90,000
  '유석빌딩': '별도',       // 공급가 827,272 + 세액 82,728
  '평해빌딩': '별도',       // 공급가 750,000 + 세액 75,000
  // 정산서에서 명확히 포함 확인
  'w하우스': '포함',         // 세액 0 표기 = 포함형
  '모닝빌': '포함',         // R12에 명시적 "포함" 텍스트
  '양지빌딩': '포함',       // 자동이체, 77만 부가세 포함 명시
  '신림프리미어': '포함',   // 148,000 = 1,480,000의 10% 포함
};

// 2. 더힐하우스 정산일 (정산서에서 확인: 말일)
// 폴더명에 정산일 없었음 → 정산서에서 말일 확인
const extraSettlement = {
  '더힐하우스': { count: 1, d1: 31 },
  '메종빌': { count: 2, d1: 15, d2: 31 },   // 정산서에서 1일, 15일 확인
  '집현전빌딩': { count: 1, d1: 31 },         // 정산서 날짜 2026-02-28 확인
  '어반그레이': { count: 1, d1: 31 },          // 정산서에서 말일 확인
  '문화빌딩': { count: 1, d1: 31 },            // 정산서에서 말일 확인
  '제이드하우스': { count: 1, d1: 31 },         // 정산서에서 말일 확인
  '평해빌딩': { count: 1, d1: 31 },            // 정산서에서 말일 확인
};

// 3. 정산서에서 확인된 청소비 (건물 청소 = 건물 운영 비용, 퇴실 청소비와 다름)
// → cleaning_fee는 "기본 청소비"로 정의되어 있어서, 정산서의 "건물청소"와 다를 수 있음
// → 애매하므로 매핑하지 않음

// === 적용 ===
const updates = {};
function inc(key) { updates[key] = (updates[key]||0)+1; }

for (let r = 3; r < data.length; r++) {
  const name = data[r][ci['building_name']];
  if (!name) continue;

  // VAT 유형 (기존 값이 비어있거나 "전체"인 경우 정산서 데이터로 교체)
  if (vatType[name]) {
    const current = data[r][ci['fee_vat_type']];
    if (!current || current === '' || current === '전체') {
      data[r][ci['fee_vat_type']] = vatType[name];
      inc('fee_vat_type');
    }
  }

  // 추가 정산일
  const sd = extraSettlement[name];
  if (sd) {
    const current = data[r][ci['settlement_count']];
    if (!current || current === '') {
      data[r][ci['settlement_count']] = sd.count;
      data[r][ci['settlement_day_1']] = sd.d1;
      if (sd.d2) data[r][ci['settlement_day_2']] = sd.d2;
      inc('settlement_extra');
    }
  }
}

// 저장
const ws_new = XLSX.utils.aoa_to_sheet(data);
ws_new['!cols'] = headers.map((h, i) => {
  let maxLen = h ? h.length : 10;
  data.forEach(row => { if (row[i]) maxLen = Math.max(maxLen, String(row[i]).length); });
  return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
});
const wb_out = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb_out, ws_new, 'buildings');
XLSX.writeFile(wb_out, templatePath);

console.log('=== 정산서 기반 추가 매핑 결과 ===');
Object.entries(updates).forEach(([k,v]) => console.log('  ' + k + ': ' + v + '건'));

// 아직 비어있는 필드 확인
console.log('\n=== 아직 비어있는 주요 필드 ===');
const checkFields = ['fee_vat_type','settlement_count','settlement_day_1','tenant_account_type','management_fee_billing_type','cleaning_fee'];
checkFields.forEach(field => {
  let empty = 0;
  const emptyNames = [];
  for (let r = 3; r < data.length; r++) {
    if (!data[r][ci[field]] || data[r][ci[field]] === '') {
      empty++;
      emptyNames.push(data[r][ci['building_name']]);
    }
  }
  if (empty > 0) console.log('  ' + field + ': ' + empty + '건 비어있음 → ' + emptyNames.join(', '));
});
