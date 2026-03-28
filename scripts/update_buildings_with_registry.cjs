const XLSX = require('xlsx');
const path = require('path');

// 건축물대장에서 추출한 데이터 (주소로 매핑)
// 확실하게 판독된 것만 포함, 애매한 건 제외
const registryData = {
  // 팀1
  '제이앤제이': { area: null, approved: '2001-11-14', structure: '철근콘크리트조', parking: '자주식 2대', address_road: '서울특별시 강남구 학동로8길 7-4', jibun: '논현동 124-25' },
  '스타빌': { area: 215.54, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: null },
  '아페이론': { area: 726, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: null },
  '다존하우스': { area: 718.12, approved: '2012-09-18', structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 동작구 대림로 32', jibun: '신대방동' },
  'W하우스': { area: 1185.97, approved: null, structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 강남구 강남대로112길 35', jibun: '논현동 197-16' },
  '포유빌': { area: 195, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: null },
  '미래홈': { area: 320, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: null },
  '굿모닝빌': { area: 400, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: null },
  '모닝빌': { area: 651.45, approved: null, structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 강남구 강남대로116길 18', jibun: '논현동' },
  '에덴빌': { area: 400, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: null },

  // 팀2
  '와이원빈티지': { area: 372.66, approved: '2019-05-30', structure: '철근콘크리트구조', parking: null, address_road: null, jibun: '논현동 189-4' },
  '한스텔': { area: null, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: null },
  '지앤지2': { area: 420, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: null },
  '토브미하우스': { area: 660, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: null },
  '리트코하우스': { area: null, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: null },
  '모던하우스': { area: 710.41, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: '논현동 159-10' },
  '모던라이프': { area: 190, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: '논현동 55-69' },
  '서우하우스': { area: null, approved: null, structure: null, parking: null, address_road: null, jibun: null },
  // 메종빌: PDF 빈 파일
  '제이드하우스': { area: 635.69, approved: null, structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 강남구 언주로147길', jibun: '논현동 64-1' },
  '신림프리미어': { area: 1639.35, approved: '2021-06-10', structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 관악구 신림로67길 15', jibun: '신림동 1432-54' },
  '제이에스하우스': { area: 349.18, approved: null, structure: '일반철골구조', parking: null, address_road: '서울특별시 강동구 천호대로155길 21', jibun: '천호동' },

  // 팀3
  '풍림빌딩': { area: 1148.21, approved: '2016-09-20', structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 성동구 독서당로 216', jibun: '옥수동 285-73' },
  '우영빌딩': { area: 762.78, approved: '2022-12-16', structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 강남구 학동로4길 50', jibun: '논현동 163-18' },
  '우진빌딩': { area: 844, approved: '2013-07-05', structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 강남구 테헤란로13길 18', jibun: '역삼동 637-18' },
  '대치칼텍빌딩': { area: 597.91, approved: null, structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 강남구 역삼로78길 21', jibun: '대치동 915-23' },
  '서연빌': { area: 476.99, approved: '2019-06-29', structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 강남구 삼성로69길 21', jibun: '대치동 915' },
  '문화빌딩': { area: 653.79, approved: null, structure: '철근콘크리트구조', parking: null, address_road: null, jibun: null },
  '집현전빌딩': { area: null, approved: '2016-06-16', structure: '철근콘크리트구조', parking: null, address_road: null, jibun: null },
  // 더힐하우스 = 총괄표제부 (4개동 합산 2486.64m2, 개별동 면적은 별도)
  '더힐하우스101동': { area: null, approved: '2016-06-16', structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 강남구 선릉로72길 10-13', jibun: '대치동 920-27' },
  '더힐하우스102동': { area: null, approved: '2016-06-16', structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 강남구 선릉로72길 10-13', jibun: '대치동 920-27' },
  '더힐하우스103동': { area: null, approved: '2016-06-16', structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 강남구 선릉로72길 10-13', jibun: '대치동 920-27' },
  '더힐하우스104동': { area: null, approved: '2016-06-16', structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 강남구 선릉로72길 10-13', jibun: '대치동 920-27' },
  '어반그레이': { area: 740.36, approved: '2022-11-18', structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 강남구 논현로111길 42', jibun: '논현동' },
  '이례빌딩': { area: 1739.89, approved: '2012-06-29', structure: '철근콘크리트구조', parking: null, address_road: '서울특별시 광진구 동일로 144', jibun: '화양동 41-14' },
};

// 기존 템플릿 읽기
const templatePath = path.join(__dirname, '..', '① buildings_건물정보_작성중.xlsx');
const wb = XLSX.readFile(templatePath);
const ws = wb.Sheets['buildings'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

// 컬럼 인덱스 찾기
const headers = data[0];
const colIdx = {};
headers.forEach((h, i) => { colIdx[h] = i; });

const updated = { area: 0, approved: 0, road: 0 };
const yellowCells = [];

// 데이터 행 업데이트 (행 3부터 = index 3)
for (let r = 3; r < data.length; r++) {
  const row = data[r];
  const name = row[colIdx['building_name']];
  if (!name) continue;

  const reg = registryData[name];
  if (!reg) continue;

  // 연면적 → building_area_total
  const areaCol = colIdx['building_area_total'];
  if (reg.area && (!row[areaCol] || row[areaCol] === '')) {
    // 추정치(약 xxx)는 노란색, 정확한 건 그냥 채움
    const approxBuildings = ['포유빌','미래홈','굿모닝빌','에덴빌','지앤지2','토브미하우스','모던라이프','아페이론','문화빌딩','모닝빌'];
    row[areaCol] = reg.area;
    if (approxBuildings.includes(name)) {
      yellowCells.push({ r, c: areaCol });
    }
    updated.area++;
  }

  // 사용승인일 → approved_date (기존 값이 없거나 비어있을 때만)
  const approvedCol = colIdx['approved_date'];
  if (reg.approved && (!row[approvedCol] || row[approvedCol] === '')) {
    row[approvedCol] = reg.approved;
    updated.approved++;
  }

  // 도로명주소 보완 (기존 하우스맨정보보다 건축물대장이 더 정확)
  // 기존 값이 있어도 건축물대장 값이 더 정확할 수 있으므로 노란색으로 표시만
  // → 실제로는 기존 값 유지, 건축물대장 주소가 다르면 memo에 추가
}

// 엑셀 다시 쓰기
const ws_new = XLSX.utils.aoa_to_sheet(data);

// 열 너비 복원
ws_new['!cols'] = headers.map((h, i) => {
  let maxLen = h ? h.length : 10;
  data.forEach(row => { if (row[i]) maxLen = Math.max(maxLen, String(row[i]).length); });
  return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
});

// 노란색 표시
yellowCells.forEach(({ r, c }) => {
  const cellRef = XLSX.utils.encode_cell({ r, c });
  if (ws_new[cellRef]) {
    if (!ws_new[cellRef].s) ws_new[cellRef].s = {};
    ws_new[cellRef].s = { fill: { fgColor: { rgb: 'FFFF00' } } };
  }
});

const wb_out = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb_out, ws_new, 'buildings');

const outPath = path.join(__dirname, '..', '① buildings_건물정보_작성중.xlsx');
XLSX.writeFile(wb_out, outPath);

console.log('업데이트 완료:', outPath);
console.log('추가된 연면적:', updated.area + '건');
console.log('추가된 사용승인일:', updated.approved + '건');
console.log('노란색(추정치) 셀:', yellowCells.length + '개');

// 매핑 안 된 건물 리스트
const allBuildings = data.slice(3).map(r => r[0]).filter(Boolean);
const notMatched = allBuildings.filter(name => !registryData[name]);
if (notMatched.length > 0) {
  console.log('\n건축물대장 데이터 없는 건물:', notMatched.join(', '));
}

// 판독 불가 건물
const noData = Object.entries(registryData).filter(([k, v]) => !v.area && !v.approved);
if (noData.length > 0) {
  console.log('판독 불가 건물:', noData.map(([k]) => k).join(', '));
}
