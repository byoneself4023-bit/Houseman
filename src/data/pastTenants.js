export const pastTenants = {
  // ── 제이앤제이 입퇴실 (정산서 테스트용, 시간순 정합) ──
  // B01호: 윤슬기 2025-03-05 입주 → 2026-02-05 퇴실 (월세일 5일, 5<15 줬음 → 환수)
  // → 새 입주자 2026-03-05 입주 (현재 임차인 tenants.js)
  "제이앤제이_B01": [{
    name: "윤슬기", phone: "010-2378-5747",
    moveIn: "2025-03-05", moveOut: "2026-02-05", expiry: "2025-09-05",
    deposit: 650000, rent: 650000, mgmt: 70000, roomType: "단기",
    due: "3/5", rentDay: 5,
    reason: "만기퇴실", settlement: "정산완료", settlementDate: "2026-02-05",
    cleanFee: 110000, elecReading: 35000, gasReading: 28000, waterReading: 8000,
    damageFee: 0, damageDesc: "",
    penalty7: 0, depositReturn: 650000, finalRefund: 469000,
    brokerageFee: 0,
  }],
  // 301호: 차민철 2025-05-21 입주 → 2026-02-08 퇴실 (월세일 21일, 21>=15 안줬음 → 지급)
  // → 김태호 2026-03-05 입주 (현재 임차인)
  "제이앤제이_301": [{
    name: "차민철", phone: "010-7799-5297",
    moveIn: "2025-05-21", moveOut: "2026-02-08", expiry: "2025-11-21",
    deposit: 1650000, rent: 1650000, mgmt: 120000, roomType: "단기",
    due: "3/21", rentDay: 21,
    reason: "조기퇴실", settlement: "정산완료", settlementDate: "2026-02-08",
    cleanFee: 150000, elecReading: 55000, gasReading: 42000, waterReading: 12000,
    damageFee: 80000, damageDesc: "벽지 훼손",
    penalty7: 0, depositReturn: 1650000, finalRefund: 1311000,
    brokerageFee: 0,
  }],
  // 401호: 박유하 2025-04-26 입주 → 2026-02-10 퇴실 (월세일 26일, 26>=15 안줬음 → 지급)
  // → 이서연 2026-02-20 입주 (현재 임차인)
  "제이앤제이_401": [{
    name: "박유하", phone: "010-2990-2972",
    moveIn: "2025-04-26", moveOut: "2026-02-10", expiry: "2025-10-26",
    deposit: 1950000, rent: 1950000, mgmt: 150000, roomType: "단기",
    due: "2/26", rentDay: 26,
    reason: "만기퇴실", settlement: "정산완료", settlementDate: "2026-02-10",
    cleanFee: 130000, elecReading: 48000, gasReading: 38000, waterReading: 10000,
    damageFee: 0, damageDesc: "",
    penalty7: 0, depositReturn: 1950000, finalRefund: 1724000,
    brokerageFee: 0,
  }],
  "스타빌_101": [
    { name: "박민수", phone: "010-9876-5432", moveIn: "2024-03-01", moveOut: "2025-08-31", deposit: 650000, rent: 600000, reason: "만기퇴실", settlement: "정산완료" },
    { name: "이정아", phone: "010-5555-1234", moveIn: "2023-01-15", moveOut: "2024-02-28", deposit: 600000, rent: 550000, reason: "만기전퇴실", settlement: "정산완료" },
    { name: "최용석", phone: "010-3333-7777", moveIn: "2021-09-01", moveOut: "2022-12-31", deposit: 550000, rent: 500000, reason: "만기퇴실", settlement: "정산완료" },
  ],
  "스타빌_102": [
    { name: "한지민", phone: "010-1111-2222", moveIn: "2024-06-01", moveOut: "2025-05-31", deposit: 700000, rent: 650000, reason: "만기퇴실", settlement: "정산완료" },
  ],
  "스타빌_201": [
    { name: "김태희", phone: "010-4444-8888", moveIn: "2023-07-01", moveOut: "2025-06-30", deposit: 650000, rent: 600000, reason: "만기퇴실", settlement: "정산완료" },
    { name: "오세진", phone: "010-6666-9999", moveIn: "2022-01-01", moveOut: "2023-06-15", deposit: 600000, rent: 550000, reason: "만기전퇴실", settlement: "위약금 발생" },
  ],
  // ── 2026년 3월 퇴실 (정산서 테스트용) ──
  "스타빌_405": [{
    name: "고영희", phone: "010-7570-5846",
    moveIn: "2025-09-15", moveOut: "2026-03-15", expiry: "2026-03-15",
    deposit: 750000, rent: 700000, mgmt: 80000, roomType: "단기",
    reason: "만기퇴실", settlement: "정산완료", settlementDate: "2026-03-15",
    // 일할계산: 15일/31일 (3월 1일~15일 거주)
    daysInMonth: 31, usedDays: 15, startDay: 1,
    rentProRata: 338710, mgmtProRata: 38710,
    // 퇴실 공제
    cleanFee: 110000,
    elecReading: 42000, gasReading: 35000, waterReading: 8000,
    damageFee: 0, damageDesc: "",
    penalty7: 0, penaltyReason: "",
    // 예치금 반환
    depositReturn: 750000,
    totalDeduct: 195000,
    finalRefund: 555000,
    // 중개수수료 (입주 시 발생했던)
    brokerageFee: 350000,
  }],
  "스타빌_301_2": [{
    name: "박성윤", phone: "010-4998-6676",
    moveIn: "2025-09-15", moveOut: "2026-03-10", expiry: "2026-03-15",
    deposit: 700000, rent: 700000, mgmt: 80000, roomType: "단기",
    reason: "조기퇴실", settlement: "정산완료", settlementDate: "2026-03-10",
    // 일할계산: 10일/31일 (3월 1일~10일 거주)
    daysInMonth: 31, usedDays: 10, startDay: 1,
    rentProRata: 225806, mgmtProRata: 25806,
    // 퇴실 공제
    cleanFee: 110000,
    elecReading: 38000, gasReading: 28000, waterReading: 5000,
    damageFee: 50000, damageDesc: "벽면 훼손 (입주사진 대비)",
    // 위약금: 7일치 월세+관리비 = (700000+80000)/31*7 ≈ 175,806
    penalty7: 175806, penaltyReason: "조기퇴실 (만기 03-15, 퇴실 03-10)",
    // 예치금 반환
    depositReturn: 700000,
    totalDeduct: 406806,
    finalRefund: 293194,
    brokerageFee: 0,
  }],
  "제이앤제이_101": [
    { name: "정수빈", phone: "010-2222-3333", moveIn: "2024-01-01", moveOut: "2025-07-31", deposit: 10000000, rent: 1100000, reason: "만기퇴실", settlement: "정산완료" },
  ],
  // ── 스타빌 2월 퇴실 (정산서 테스트용) ──
  // 205호: 김소희 2/15 퇴실 (월세일 11일, 11<28 줬음 → 환수)
  // → 새 입주자 tenants.js에서
  "스타빌_205_2": [{
    name: "김소희", phone: "010-7631-2483",
    moveIn: "2024-01-10", moveOut: "2026-02-15", expiry: "2024-07-10",
    deposit: 700000, rent: 700000, mgmt: 80000, roomType: "단기",
    due: "3/11", rentDay: 11,
    reason: "만기퇴실", settlement: "정산완료", settlementDate: "2026-02-15",
    cleanFee: 120000, elecReading: 38000, gasReading: 30000, waterReading: 8000,
    damageFee: 0, damageDesc: "",
    penalty7: 0, depositReturn: 700000, finalRefund: 504000,
    brokerageFee: 0,
  }],
  // 402호: 김혜서 2/20 퇴실 (월세일 3일, 3<28 줬음 → 환수)
  // → 새 입주자 tenants.js에서
  "스타빌_402_2": [{
    name: "김혜서", phone: "010-4014-8167",
    moveIn: "2025-11-02", moveOut: "2026-02-20", expiry: "2026-05-02",
    deposit: 750000, rent: 750000, mgmt: 80000, roomType: "단기",
    due: "3/3", rentDay: 3,
    reason: "만기전퇴실", settlement: "정산완료", settlementDate: "2026-02-20",
    cleanFee: 130000, elecReading: 42000, gasReading: 35000, waterReading: 10000,
    damageFee: 60000, damageDesc: "도배 오염",
    penalty7: 0, depositReturn: 750000, finalRefund: 473000,
    brokerageFee: 0,
  }],
};
