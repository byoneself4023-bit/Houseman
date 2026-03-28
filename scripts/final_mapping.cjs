const XLSX = require('xlsx');
const templatePath = require('path').join(__dirname, '..', '① buildings_건물정보_작성중.xlsx');
const wb = XLSX.readFile(templatePath);
const data = XLSX.utils.sheet_to_json(wb.Sheets['buildings'], { header: 1 });
const headers = data[0];
const ci = {};
headers.forEach((h, i) => { ci[h] = i; });

// === 1. 호실 수 ===
const roomCounts = {
  '제이앤제이':5,'스타빌':16,'아페이론':10,'다존하우스':33,'w하우스':18,
  '포유빌':10,'미래홈':23,'굿모닝빌':12,'모닝빌':16,'에덴빌':9,
  '와이원빈티지':14,'한스텔':16,'지앤지2':9,'풍림빌딩':7,'토브미하우스':8,
  '리트코하우스':18,'모던하우스':19,'모던라이프':16,'서우하우스':4,
  '제이에스하우스':9,'우진빌딩':6,'우영빌딩':7,'대치칼텍빌딩':5,
  '서연빌':9,'더힐하우스':44,'신림프리미어':45,'메종빌':16,
  '문화빌딩':6,'어반그레이':5,'집현전빌딩':9,'이례빌딩':11,
  'KMC코리아':6,'제이드하우스':10,'양지빌딩':8,'상건빌딩':10,
  '미진빌딩':9,'유석빌딩':7,'에이스빌딩':12,'평해빌딩':6
};

// === 2. 정산일 (폴더명) ===
const settlementDays = {
  '제이앤제이':{count:1,d1:15},'스타빌':{count:1,d1:15},
  '아페이론':{count:2,d1:22,d2:29},'다존하우스':{count:1,d1:21},
  'w하우스':{count:1,d1:31},'포유빌':{count:2,d1:15,d2:31},
  '미래홈':{count:1,d1:31},'굿모닝빌':{count:1,d1:31},
  '모닝빌':{count:2,d1:20,d2:31},'에덴빌':{count:2,d1:20,d2:31},
  '와이원빈티지':{count:1,d1:31},'한스텔':{count:1,d1:31},
  '지앤지2':{count:2,d1:10,d2:25},'토브미하우스':{count:2,d1:15,d2:31},
  '리트코하우스':{count:1,d1:31},'모던하우스':{count:1,d1:20},
  '모던라이프':{count:1,d1:20},'서우하우스':{count:1,d1:31},
  '제이에스하우스':{count:1,d1:31},
  '이례빌딩':{count:1,d1:5},'KMC코리아':{count:1,d1:5},
  '양지빌딩':{count:1,d1:1},'상건빌딩':{count:1,d1:5},
  '미진빌딩':{count:1,d1:5},'유석빌딩':{count:1,d1:5},
  '에이스빌딩':{count:1,d1:5}
};

// === 3. 계좌유형 (전 호실 동일만) ===
const acctTypes = {
  '제이앤제이':'houseman','스타빌':'houseman','아페이론':'houseman',
  '다존하우스':'houseman','포유빌':'houseman','미래홈':'houseman',
  '에덴빌':'houseman','지앤지2':'houseman','리트코하우스':'houseman',
  '서우하우스':'houseman','메종빌':'houseman',
  '굿모닝빌':'owner','와이원빈티지':'owner','한스텔':'owner',
  '모던하우스':'owner','모던라이프':'owner',
  '풍림빌딩':'owner','우진빌딩':'owner','우영빌딩':'owner',
  '대치칼텍빌딩':'owner','서연빌':'owner','신림프리미어':'owner',
  '문화빌딩':'owner','어반그레이':'owner','집현전빌딩':'owner',
  '이례빌딩':'owner','KMC코리아':'owner','양지빌딩':'owner',
  '상건빌딩':'owner','미진빌딩':'owner','유석빌딩':'owner',
  '에이스빌딩':'owner','더힐하우스':'houseman'
};

// === 4. 7일패널티 ===
const penalty = { '아페이론':true,'굿모닝빌':true,'모닝빌':true,'지앤지2':true,'모던하우스':true,'모던라이프':true };

// === 5. 관리시작일 ===
const contractStart = {
  '제이앤제이':'2012-08-17','스타빌':'2013-01-16','아페이론':'2013-02-01',
  '다존하우스':'2013-08-07','w하우스':'2014-07-28','포유빌':'2016-07-15',
  '미래홈':'2016-12-14','굿모닝빌':'2016-11-30','모닝빌':'2017-02-01',
  '에덴빌':'2017-03-28','와이원빈티지':'2017-05-26','한스텔':'2017-11-14',
  '지앤지2':'2018-04-05','풍림빌딩':'2018-10-01','토브미하우스':'2019-01-03',
  '리트코하우스':'2020-07-06','모던하우스':'2021-02-16','모던라이프':'2021-02-23',
  '서우하우스':'2023-01-06','제이에스하우스':'2024-02-15','우진빌딩':'2024-04-11',
  '우영빌딩':'2024-04-23','서연빌':'2024-06-01','대치칼텍빌딩':'2024-06-01',
  '더힐하우스':'2024-06-21','신림프리미어':'2024-08-06','메종빌':'2024-08-12',
  '문화빌딩':'2025-02-01','집현전빌딩':'2025-06-01','이례빌딩':'2025-08-01',
  'KMC코리아':'2025-08-01','제이드하우스':'2025-10-01','양지빌딩':'2025-10-01',
  '상건빌딩':'2025-12-01','미진빌딩':'2025-12-01','유석빌딩':'2026-01-13',
  '에이스빌딩':'2026-02-03','평해빌딩':'2026-03-01'
};

// === 6. 표준임대차 (확실한 것만) ===
const stdContract = { '포유빌':true,'굿모닝빌':true,'모닝빌':true,'토브미하우스':true,'모던하우스':true,'모던라이프':true };

// === 7. 관리비 선/후불 (전 호실 동일만) ===
const mgmtBilling = {
  '제이앤제이':'prepaid','스타빌':'prepaid','아페이론':'prepaid',
  '다존하우스':'prepaid','w하우스':'prepaid','포유빌':'prepaid',
  '미래홈':'prepaid','굿모닝빌':'prepaid','모닝빌':'prepaid',
  '에덴빌':'prepaid','와이원빈티지':'prepaid','한스텔':'prepaid',
  '지앤지2':'prepaid','토브미하우스':'prepaid','리트코하우스':'prepaid',
  '모던하우스':'prepaid','모던라이프':'prepaid','서우하우스':'prepaid',
  '대치칼텍빌딩':'prepaid','서연빌':'prepaid','메종빌':'prepaid',
  '제이드하우스':'prepaid','우진빌딩':'prepaid','우영빌딩':'prepaid',
  '신림프리미어':'prepaid',
  'KMC코리아':'postpaid','상건빌딩':'postpaid','미진빌딩':'postpaid'
};

// === 적용 ===
const updates = {};
function inc(key) { updates[key] = (updates[key]||0)+1; }

for (let r = 3; r < data.length; r++) {
  const name = data[r][ci['building_name']];
  if (!name) continue;

  // 호실수
  if (roomCounts[name] !== undefined) {
    data[r][ci['total_rooms']] = roomCounts[name];
    data[r][ci['has_rooms']] = 'TRUE';
    inc('total_rooms');
  }

  // 정산일
  const sd = settlementDays[name];
  if (sd) {
    data[r][ci['settlement_count']] = sd.count;
    data[r][ci['settlement_day_1']] = sd.d1;
    if (sd.d2) data[r][ci['settlement_day_2']] = sd.d2;
    inc('settlement');
  }

  // 계좌유형
  if (acctTypes[name]) {
    data[r][ci['tenant_account_type']] = acctTypes[name];
    inc('tenant_account_type');
  }

  // 7일패널티
  if (penalty[name]) {
    data[r][ci['is_penalty_7days']] = 'TRUE';
    inc('penalty_true');
  } else if (!data[r][ci['is_penalty_7days']] || data[r][ci['is_penalty_7days']] === '') {
    data[r][ci['is_penalty_7days']] = 'FALSE';
    inc('penalty_false');
  }

  // 관리시작일
  if (contractStart[name]) {
    data[r][ci['contract_start_date']] = contractStart[name];
    inc('contract_start');
  }

  // 표준임대차
  if (stdContract[name]) {
    data[r][ci['is_standard_contract']] = 'TRUE';
    inc('std_contract_true');
  } else if (!data[r][ci['is_standard_contract']] || data[r][ci['is_standard_contract']] === '') {
    data[r][ci['is_standard_contract']] = 'FALSE';
    inc('std_contract_false');
  }

  // 관리비 선후불
  if (mgmtBilling[name]) {
    data[r][ci['management_fee_billing_type']] = mgmtBilling[name];
    inc('mgmt_billing');
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

console.log('=== 추가 매핑 결과 ===');
Object.entries(updates).forEach(([k,v]) => console.log('  ' + k + ': ' + v + '건'));
