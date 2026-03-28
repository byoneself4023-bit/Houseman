// @ts-nocheck
// 테스트용 가상 데이터 - 유형별 조건부 표시 검증용
// 사용법: import { testBuildings, testTenants, testBuildingData } from './testData';
// 주의: 이 파일은 자동 로드되지 않음. 수동 import 필요.

// ============================================================
// 건물 데이터 (30개)
// ============================================================
export const testBuildings = [
  // --- 단기임대 10개 ---
  { name: "테스트단기1", rooms: 5, occupied: 5, type: "단기", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 3 },
  { name: "테스트단기2", rooms: 4, occupied: 4, type: "단기", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 2 },
  { name: "테스트단기3", rooms: 6, occupied: 5, type: "단기", feeType: "pct", fee: 0.04, fixedFee: 0, special: null, parkingTotal: 4 },
  { name: "테스트단기4", rooms: 4, occupied: 4, type: "단기", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 2 },
  { name: "테스트단기5", rooms: 3, occupied: 3, type: "단기", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 1 },
  { name: "테스트단기6", rooms: 4, occupied: 3, type: "단기", feeType: "pct", fee: 0.04, fixedFee: 0, special: null, parkingTotal: 2 },
  { name: "테스트단기7", rooms: 5, occupied: 5, type: "단기", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 3 },
  { name: "테스트단기8", rooms: 3, occupied: 3, type: "단기", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 1 },
  { name: "테스트단기9", rooms: 4, occupied: 4, type: "단기", feeType: "pct", fee: 0.04, fixedFee: 0, special: null, parkingTotal: 2 },
  { name: "테스트단기10", rooms: 3, occupied: 2, type: "단기", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 1 },
  // --- 일반임대 5개 ---
  { name: "테스트일반1", rooms: 4, occupied: 4, type: "일반", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 4 },
  { name: "테스트일반2", rooms: 5, occupied: 5, type: "일반", feeType: "pct", fee: 0.04, fixedFee: 0, special: null, parkingTotal: 5 },
  { name: "테스트일반3", rooms: 4, occupied: 3, type: "일반", feeType: "fixed", fee: 0, fixedFee: 300000, special: null, parkingTotal: 3 },
  { name: "테스트일반4", rooms: 3, occupied: 3, type: "일반", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 2 },
  { name: "테스트일반5", rooms: 4, occupied: 4, type: "일반", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 3 },
  // --- 근생 5개 ---
  { name: "테스트근생1", rooms: 3, occupied: 3, type: "근생", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 5 },
  { name: "테스트근생2", rooms: 4, occupied: 3, type: "근생", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 6 },
  { name: "테스트근생3", rooms: 3, occupied: 3, type: "근생", feeType: "fixed", fee: 0, fixedFee: 500000, special: null, parkingTotal: 4 },
  { name: "테스트근생4", rooms: 3, occupied: 3, type: "근생", feeType: "pct", fee: 0.04, fixedFee: 0, special: null, parkingTotal: 3 },
  { name: "테스트근생5", rooms: 3, occupied: 2, type: "근생", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 4 },
  // --- 단기+근생 혼합 3개 ---
  { name: "테스트혼합단근1", rooms: 5, occupied: 4, type: "혼합", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 4 },
  { name: "테스트혼합단근2", rooms: 4, occupied: 3, type: "혼합", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 3 },
  { name: "테스트혼합단근3", rooms: 4, occupied: 4, type: "혼합", feeType: "pct", fee: 0.04, fixedFee: 0, special: null, parkingTotal: 2 },
  // --- 단기+일반 혼합 3개 ---
  { name: "테스트혼합단일1", rooms: 4, occupied: 3, type: "혼합", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 3 },
  { name: "테스트혼합단일2", rooms: 3, occupied: 3, type: "혼합", feeType: "pct", fee: 0.05, fixedFee: 0, special: null, parkingTotal: 2 },
  { name: "테스트혼합단일3", rooms: 3, occupied: 2, type: "혼합", feeType: "pct", fee: 0.04, fixedFee: 0, special: null, parkingTotal: 1 },
  // --- 관리사무소대행 2개 ---
  { name: "테스트관리1", rooms: 6, occupied: 5, type: "관리", feeType: "perUnit", fee: 0, fixedFee: 90000, special: null, parkingTotal: 10 },
  { name: "테스트관리2", rooms: 5, occupied: 5, type: "관리", feeType: "perUnit", fee: 0, fixedFee: 90000, special: null, parkingTotal: 8 },
  // --- 기업시설관리 2개 (호실 없음) ---
  { name: "테스트기업1", rooms: 0, occupied: 0, type: "기업", feeType: "fixed", fee: 0, fixedFee: 2000000, special: null, parkingTotal: 20 },
  { name: "테스트기업2", rooms: 0, occupied: 0, type: "기업", feeType: "fixed", fee: 0, fixedFee: 3000000, special: null, parkingTotal: 30 },
];

// ============================================================
// 건물 유형 플래그 (buildingData)
// ============================================================
export const testBuildingData = {
  // 단기임대
  "테스트단기1": { isShortTermRental: true },
  "테스트단기2": { isShortTermRental: true },
  "테스트단기3": { isShortTermRental: true },
  "테스트단기4": { isShortTermRental: true },
  "테스트단기5": { isShortTermRental: true },
  "테스트단기6": { isShortTermRental: true },
  "테스트단기7": { isShortTermRental: true },
  "테스트단기8": { isShortTermRental: true },
  "테스트단기9": { isShortTermRental: true },
  "테스트단기10": { isShortTermRental: true },
  // 일반임대
  "테스트일반1": { isLongTermRental: true },
  "테스트일반2": { isLongTermRental: true },
  "테스트일반3": { isLongTermRental: true },
  "테스트일반4": { isLongTermRental: true },
  "테스트일반5": { isLongTermRental: true },
  // 근생
  "테스트근생1": { isCommercial: true },
  "테스트근생2": { isCommercial: true },
  "테스트근생3": { isCommercial: true },
  "테스트근생4": { isCommercial: true },
  "테스트근생5": { isCommercial: true },
  // 단기+근생 혼합
  "테스트혼합단근1": { isShortTermRental: true, isCommercial: true },
  "테스트혼합단근2": { isShortTermRental: true, isCommercial: true },
  "테스트혼합단근3": { isShortTermRental: true, isCommercial: true },
  // 단기+일반 혼합
  "테스트혼합단일1": { isShortTermRental: true, isLongTermRental: true },
  "테스트혼합단일2": { isShortTermRental: true, isLongTermRental: true },
  "테스트혼합단일3": { isShortTermRental: true, isLongTermRental: true },
  // 관리사무소대행
  "테스트관리1": { isManagementAgency: true },
  "테스트관리2": { isManagementAgency: true },
  // 기업시설관리
  "테스트기업1": { isCorporateFacility: true },
  "테스트기업2": { isCorporateFacility: true },
};

// ============================================================
// 임차인 데이터 (103명)
// ============================================================

let _id = 9000;
const nextId = () => ++_id;

export const testTenants = [
  // ================================================================
  // 단기임대 임차인 (~40명) - rent 50~80만, deposit=rent, mgmt 6~10만, 6개월 계약
  // ================================================================
  // 테스트단기1 (5명)
  { id: nextId(), name: "김민수", building: "테스트단기1", room: "101", phone: "010-1234-5001", rent: 600000, mgmt: 80000, deposit: 600000, due: "3/5", overdue: 0, moveIn: "2026-03-05", expiry: "2026-09-05" },
  { id: nextId(), name: "이서윤", building: "테스트단기1", room: "102", phone: "010-1234-5002", rent: 650000, mgmt: 80000, deposit: 650000, due: "3/10", overdue: 0, moveIn: "2026-01-10", expiry: "2026-07-10" },
  { id: nextId(), name: "박준혁", building: "테스트단기1", room: "201", phone: "010-1234-5003", rent: 700000, mgmt: 80000, deposit: 700000, due: "2/28", overdue: 0, moveIn: "2025-12-28", expiry: "2026-06-28" },
  { id: nextId(), name: "최수아", building: "테스트단기1", room: "202", phone: "010-1234-5004", rent: 550000, mgmt: 70000, deposit: 550000, due: "3/15", overdue: 0, moveIn: "2026-03-15", expiry: "2026-09-15" },
  { id: nextId(), name: "정하준", building: "테스트단기1", room: "301", phone: "010-1234-5005", rent: 750000, mgmt: 90000, deposit: 750000, due: "3/1", overdue: 1, moveIn: "2025-09-01", expiry: "2026-03-01" },
  // 테스트단기2 (4명)
  { id: nextId(), name: "한도윤", building: "테스트단기2", room: "101", phone: "010-2345-6001", rent: 500000, mgmt: 60000, deposit: 500000, due: "3/7", overdue: 0, moveIn: "2026-01-07", expiry: "2026-07-07" },
  { id: nextId(), name: "강지호", building: "테스트단기2", room: "102", phone: "010-2345-6002", rent: 520000, mgmt: 60000, deposit: 520000, due: "3/12", overdue: 0, moveIn: "2025-11-12", expiry: "2026-05-12" },
  { id: nextId(), name: "윤서진", building: "테스트단기2", room: "201", phone: "010-2345-6003", rent: 580000, mgmt: 70000, deposit: 580000, due: "3/20", overdue: 0, moveIn: "2026-01-20", expiry: "2026-07-20" },
  { id: nextId(), name: "임채원", building: "테스트단기2", room: "202", phone: "010-2345-6004", rent: 550000, mgmt: 60000, deposit: 550000, due: "2/25", overdue: 0, moveIn: "2025-10-25", expiry: "2026-04-25" },
  // 테스트단기3 (5명)
  { id: nextId(), name: "오시우", building: "테스트단기3", room: "101", phone: "010-3456-7001", rent: 680000, mgmt: 80000, deposit: 680000, due: "3/3", overdue: 0, moveIn: "2025-12-03", expiry: "2026-06-03" },
  { id: nextId(), name: "배예준", building: "테스트단기3", room: "102", phone: "010-3456-7002", rent: 700000, mgmt: 80000, deposit: 700000, due: "3/8", overdue: 0, moveIn: "2026-01-08", expiry: "2026-07-08" },
  { id: nextId(), name: "조민재", building: "테스트단기3", room: "201", phone: "010-3456-7003", rent: 720000, mgmt: 90000, deposit: 720000, due: "3/14", overdue: 2, moveIn: "2025-07-14", expiry: "2026-01-14" },
  { id: nextId(), name: "서지안", building: "테스트단기3", room: "202", phone: "010-3456-7004", rent: 650000, mgmt: 70000, deposit: 650000, due: "3/18", overdue: 0, moveIn: "2026-01-18", expiry: "2026-07-18" },
  { id: nextId(), name: "신이준", building: "테스트단기3", room: "301", phone: "010-3456-7005", rent: 600000, mgmt: 70000, deposit: 600000, due: "3/22", overdue: 0, moveIn: "2026-02-22", expiry: "2026-08-22" },
  // 테스트단기4 (4명)
  { id: nextId(), name: "류하은", building: "테스트단기4", room: "101", phone: "010-4567-8001", rent: 800000, mgmt: 100000, deposit: 800000, due: "3/5", overdue: 0, moveIn: "2026-03-05", expiry: "2026-09-05" },
  { id: nextId(), name: "문소율", building: "테스트단기4", room: "102", phone: "010-4567-8002", rent: 780000, mgmt: 90000, deposit: 780000, due: "3/10", overdue: 0, moveIn: "2026-02-10", expiry: "2026-08-10" },
  { id: nextId(), name: "양건우", building: "테스트단기4", room: "201", phone: "010-4567-8003", rent: 760000, mgmt: 90000, deposit: 760000, due: "3/16", overdue: 0, moveIn: "2025-11-16", expiry: "2026-05-16" },
  { id: nextId(), name: "구지유", building: "테스트단기4", room: "202", phone: "010-4567-8004", rent: 750000, mgmt: 80000, deposit: 750000, due: "3/21", overdue: 0, moveIn: "2026-01-21", expiry: "2026-07-21" },
  // 테스트단기5 (3명)
  { id: nextId(), name: "남현우", building: "테스트단기5", room: "101", phone: "010-5678-9001", rent: 550000, mgmt: 60000, deposit: 550000, due: "3/4", overdue: 0, moveIn: "2026-01-04", expiry: "2026-07-04" },
  { id: nextId(), name: "전서현", building: "테스트단기5", room: "201", phone: "010-5678-9002", rent: 580000, mgmt: 70000, deposit: 580000, due: "3/9", overdue: 0, moveIn: "2025-12-09", expiry: "2026-06-09" },
  { id: nextId(), name: "황지원", building: "테스트단기5", room: "301", phone: "010-5678-9003", rent: 620000, mgmt: 70000, deposit: 620000, due: "3/17", overdue: 0, moveIn: "2026-02-17", expiry: "2026-08-17" },
  // 테스트단기6 (3명)
  { id: nextId(), name: "노유준", building: "테스트단기6", room: "101", phone: "010-6789-0001", rent: 500000, mgmt: 60000, deposit: 500000, due: "3/6", overdue: 0, moveIn: "2026-01-06", expiry: "2026-07-06" },
  { id: nextId(), name: "고민서", building: "테스트단기6", room: "102", phone: "010-6789-0002", rent: 530000, mgmt: 60000, deposit: 530000, due: "3/11", overdue: 0, moveIn: "2025-11-11", expiry: "2026-05-11" },
  { id: nextId(), name: "백승현", building: "테스트단기6", room: "201", phone: "010-6789-0003", rent: 570000, mgmt: 70000, deposit: 570000, due: "3/19", overdue: 1, moveIn: "2025-09-19", expiry: "2026-03-19" },
  // 테스트단기7 (5명)
  { id: nextId(), name: "유수빈", building: "테스트단기7", room: "101", phone: "010-7890-1001", rent: 650000, mgmt: 80000, deposit: 650000, due: "3/2", overdue: 0, moveIn: "2026-01-02", expiry: "2026-07-02" },
  { id: nextId(), name: "허예린", building: "테스트단기7", room: "102", phone: "010-7890-1002", rent: 680000, mgmt: 80000, deposit: 680000, due: "3/8", overdue: 0, moveIn: "2025-12-08", expiry: "2026-06-08" },
  { id: nextId(), name: "차동혁", building: "테스트단기7", room: "201", phone: "010-7890-1003", rent: 700000, mgmt: 80000, deposit: 700000, due: "3/13", overdue: 0, moveIn: "2026-02-13", expiry: "2026-08-13" },
  { id: nextId(), name: "송예나", building: "테스트단기7", room: "202", phone: "010-7890-1004", rent: 720000, mgmt: 90000, deposit: 720000, due: "3/18", overdue: 0, moveIn: "2026-01-18", expiry: "2026-07-18" },
  { id: nextId(), name: "곽태양", building: "테스트단기7", room: "301", phone: "010-7890-1005", rent: 680000, mgmt: 80000, deposit: 680000, due: "3/23", overdue: 0, moveIn: "2026-02-23", expiry: "2026-08-23" },
  // 테스트단기8 (3명)
  { id: nextId(), name: "마재민", building: "테스트단기8", room: "101", phone: "010-8901-2001", rent: 600000, mgmt: 70000, deposit: 600000, due: "3/4", overdue: 0, moveIn: "2026-01-04", expiry: "2026-07-04" },
  { id: nextId(), name: "방소연", building: "테스트단기8", room: "201", phone: "010-8901-2002", rent: 630000, mgmt: 70000, deposit: 630000, due: "3/9", overdue: 0, moveIn: "2025-12-09", expiry: "2026-06-09" },
  { id: nextId(), name: "석영진", building: "테스트단기8", room: "301", phone: "010-8901-2003", rent: 580000, mgmt: 70000, deposit: 580000, due: "3/15", overdue: 0, moveIn: "2026-02-15", expiry: "2026-08-15" },
  // 테스트단기9 (4명)
  { id: nextId(), name: "피우진", building: "테스트단기9", room: "101", phone: "010-9012-3001", rent: 710000, mgmt: 80000, deposit: 710000, due: "3/6", overdue: 0, moveIn: "2026-01-06", expiry: "2026-07-06" },
  { id: nextId(), name: "추지아", building: "테스트단기9", room: "102", phone: "010-9012-3002", rent: 730000, mgmt: 90000, deposit: 730000, due: "3/11", overdue: 0, moveIn: "2025-11-11", expiry: "2026-05-11" },
  { id: nextId(), name: "탁시현", building: "테스트단기9", room: "201", phone: "010-9012-3003", rent: 690000, mgmt: 80000, deposit: 690000, due: "3/16", overdue: 0, moveIn: "2026-02-16", expiry: "2026-08-16" },
  { id: nextId(), name: "길하윤", building: "테스트단기9", room: "202", phone: "010-9012-3004", rent: 660000, mgmt: 80000, deposit: 660000, due: "3/21", overdue: 0, moveIn: "2026-01-21", expiry: "2026-07-21" },
  // 테스트단기10 (2명)
  { id: nextId(), name: "엄태호", building: "테스트단기10", room: "101", phone: "010-0123-4001", rent: 500000, mgmt: 60000, deposit: 500000, due: "3/7", overdue: 0, moveIn: "2026-01-07", expiry: "2026-07-07" },
  { id: nextId(), name: "봉수정", building: "테스트단기10", room: "201", phone: "010-0123-4002", rent: 520000, mgmt: 60000, deposit: 520000, due: "3/12", overdue: 0, moveIn: "2025-12-12", expiry: "2026-06-12" },

  // ================================================================
  // 일반임대 임차인 (~20명) - rent 80~150만, deposit 1000~3000만, mgmt 10~20만, 2년 계약
  // ================================================================
  // 테스트일반1 (4명)
  { id: nextId(), name: "김영호", building: "테스트일반1", room: "101", phone: "010-1111-2001", rent: 800000, mgmt: 100000, deposit: 10000000, due: "3/5", overdue: 0, moveIn: "2025-03-05", expiry: "2027-03-05" },
  { id: nextId(), name: "이미경", building: "테스트일반1", room: "102", phone: "010-1111-2002", rent: 900000, mgmt: 120000, deposit: 15000000, due: "3/10", overdue: 0, moveIn: "2024-09-10", expiry: "2026-09-10" },
  { id: nextId(), name: "박상철", building: "테스트일반1", room: "201", phone: "010-1111-2003", rent: 1000000, mgmt: 150000, deposit: 20000000, due: "3/15", overdue: 1, moveIn: "2024-03-15", expiry: "2026-03-15" },
  { id: nextId(), name: "최윤정", building: "테스트일반1", room: "202", phone: "010-1111-2004", rent: 850000, mgmt: 110000, deposit: 12000000, due: "3/20", overdue: 0, moveIn: "2025-05-20", expiry: "2027-05-20" },
  // 테스트일반2 (5명)
  { id: nextId(), name: "정태우", building: "테스트일반2", room: "101", phone: "010-2222-3001", rent: 1200000, mgmt: 150000, deposit: 25000000, due: "3/3", overdue: 0, moveIn: "2024-09-03", expiry: "2026-09-03" },
  { id: nextId(), name: "한소희", building: "테스트일반2", room: "102", phone: "010-2222-3002", rent: 1100000, mgmt: 140000, deposit: 22000000, due: "3/8", overdue: 0, moveIn: "2025-01-08", expiry: "2027-01-08" },
  { id: nextId(), name: "강동원", building: "테스트일반2", room: "201", phone: "010-2222-3003", rent: 1300000, mgmt: 160000, deposit: 28000000, due: "3/12", overdue: 0, moveIn: "2024-06-12", expiry: "2026-06-12" },
  { id: nextId(), name: "윤보라", building: "테스트일반2", room: "202", phone: "010-2222-3004", rent: 1150000, mgmt: 150000, deposit: 20000000, due: "3/17", overdue: 0, moveIn: "2025-03-17", expiry: "2027-03-17" },
  { id: nextId(), name: "임수진", building: "테스트일반2", room: "301", phone: "010-2222-3005", rent: 1250000, mgmt: 160000, deposit: 24000000, due: "3/22", overdue: 0, moveIn: "2024-11-22", expiry: "2026-11-22" },
  // 테스트일반3 (3명)
  { id: nextId(), name: "오정민", building: "테스트일반3", room: "101", phone: "010-3333-4001", rent: 950000, mgmt: 120000, deposit: 18000000, due: "3/5", overdue: 0, moveIn: "2025-01-05", expiry: "2027-01-05" },
  { id: nextId(), name: "배수현", building: "테스트일반3", room: "102", phone: "010-3333-4002", rent: 880000, mgmt: 110000, deposit: 15000000, due: "3/10", overdue: 0, moveIn: "2024-07-10", expiry: "2026-07-10" },
  { id: nextId(), name: "조현아", building: "테스트일반3", room: "201", phone: "010-3333-4003", rent: 1050000, mgmt: 130000, deposit: 20000000, due: "3/16", overdue: 0, moveIn: "2025-05-16", expiry: "2027-05-16" },
  // 테스트일반4 (3명)
  { id: nextId(), name: "서동현", building: "테스트일반4", room: "101", phone: "010-4444-5001", rent: 1400000, mgmt: 180000, deposit: 30000000, due: "3/7", overdue: 0, moveIn: "2024-09-07", expiry: "2026-09-07" },
  { id: nextId(), name: "신미래", building: "테스트일반4", room: "201", phone: "010-4444-5002", rent: 1350000, mgmt: 170000, deposit: 28000000, due: "3/12", overdue: 2, moveIn: "2024-03-12", expiry: "2026-03-12" },
  { id: nextId(), name: "류지훈", building: "테스트일반4", room: "301", phone: "010-4444-5003", rent: 1500000, mgmt: 200000, deposit: 30000000, due: "3/18", overdue: 0, moveIn: "2025-07-18", expiry: "2027-07-18" },
  // 테스트일반5 (4명)
  { id: nextId(), name: "문재윤", building: "테스트일반5", room: "101", phone: "010-5555-6001", rent: 1100000, mgmt: 140000, deposit: 22000000, due: "3/4", overdue: 0, moveIn: "2025-01-04", expiry: "2027-01-04" },
  { id: nextId(), name: "양서영", building: "테스트일반5", room: "102", phone: "010-5555-6002", rent: 1050000, mgmt: 130000, deposit: 20000000, due: "3/9", overdue: 0, moveIn: "2024-09-09", expiry: "2026-09-09" },
  { id: nextId(), name: "구본석", building: "테스트일반5", room: "201", phone: "010-5555-6003", rent: 1200000, mgmt: 150000, deposit: 25000000, due: "3/14", overdue: 0, moveIn: "2025-05-14", expiry: "2027-05-14" },
  { id: nextId(), name: "남지은", building: "테스트일반5", room: "202", phone: "010-5555-6004", rent: 980000, mgmt: 120000, deposit: 18000000, due: "3/19", overdue: 0, moveIn: "2024-11-19", expiry: "2026-11-19" },

  // ================================================================
  // 근생 임차인 (~15명) - rent 100~300만, deposit 2000~5000만, mgmt 20~50만, 2년, 사업자정보
  // ================================================================
  // 테스트근생1 (3명)
  { id: nextId(), name: "김상호", building: "테스트근생1", room: "1층", phone: "010-6666-7001", rent: 2000000, mgmt: 300000, deposit: 30000000, due: "3/5", overdue: 0, moveIn: "2024-03-05", expiry: "2026-03-05", businessName: "김상호식당", businessNumber: "123-45-67890" },
  { id: nextId(), name: "이정숙", building: "테스트근생1", room: "2층", phone: "010-6666-7002", rent: 2500000, mgmt: 350000, deposit: 40000000, due: "3/10", overdue: 0, moveIn: "2023-09-10", expiry: "2025-09-10", businessName: "이정숙헤어", businessNumber: "234-56-78901" },
  { id: nextId(), name: "박찬호", building: "테스트근생1", room: "3층", phone: "010-6666-7003", rent: 1800000, mgmt: 250000, deposit: 25000000, due: "3/15", overdue: 0, moveIn: "2025-01-15", expiry: "2027-01-15", businessName: "찬호학원", businessNumber: "345-67-89012" },
  // 테스트근생2 (3명)
  { id: nextId(), name: "최동수", building: "테스트근생2", room: "101", phone: "010-7777-8001", rent: 3000000, mgmt: 500000, deposit: 50000000, due: "3/3", overdue: 0, moveIn: "2024-06-03", expiry: "2026-06-03", businessName: "동수약국", businessNumber: "456-78-90123" },
  { id: nextId(), name: "정미숙", building: "테스트근생2", room: "102", phone: "010-7777-8002", rent: 2800000, mgmt: 450000, deposit: 45000000, due: "3/8", overdue: 1, moveIn: "2024-01-08", expiry: "2026-01-08", businessName: "미숙카페", businessNumber: "567-89-01234" },
  { id: nextId(), name: "한성민", building: "테스트근생2", room: "201", phone: "010-7777-8003", rent: 2200000, mgmt: 300000, deposit: 35000000, due: "3/12", overdue: 0, moveIn: "2025-03-12", expiry: "2027-03-12", businessName: "성민사무소", businessNumber: "678-90-12345" },
  // 테스트근생3 (3명)
  { id: nextId(), name: "강현정", building: "테스트근생3", room: "1층A", phone: "010-8888-9001", rent: 1500000, mgmt: 200000, deposit: 25000000, due: "3/5", overdue: 0, moveIn: "2024-09-05", expiry: "2026-09-05", businessName: "현정베이커리", businessNumber: "789-01-23456" },
  { id: nextId(), name: "윤태석", building: "테스트근생3", room: "1층B", phone: "010-8888-9002", rent: 1200000, mgmt: 200000, deposit: 20000000, due: "3/10", overdue: 0, moveIn: "2025-01-10", expiry: "2027-01-10", businessName: "태석세탁", businessNumber: "890-12-34567" },
  { id: nextId(), name: "임보현", building: "테스트근생3", room: "2층", phone: "010-8888-9003", rent: 1000000, mgmt: 200000, deposit: 20000000, due: "3/15", overdue: 0, moveIn: "2024-05-15", expiry: "2026-05-15", businessName: "보현필라테스", businessNumber: "901-23-45678" },
  // 테스트근생4 (3명)
  { id: nextId(), name: "오병철", building: "테스트근생4", room: "1층", phone: "010-9999-0001", rent: 2600000, mgmt: 400000, deposit: 40000000, due: "3/7", overdue: 0, moveIn: "2024-03-07", expiry: "2026-03-07", businessName: "병철한의원", businessNumber: "012-34-56789" },
  { id: nextId(), name: "배은영", building: "테스트근생4", room: "2층", phone: "010-9999-0002", rent: 2400000, mgmt: 350000, deposit: 38000000, due: "3/12", overdue: 0, moveIn: "2025-06-12", expiry: "2027-06-12", businessName: "은영피부과", businessNumber: "123-45-67891" },
  { id: nextId(), name: "조명석", building: "테스트근생4", room: "3층", phone: "010-9999-0003", rent: 1900000, mgmt: 280000, deposit: 30000000, due: "3/17", overdue: 0, moveIn: "2024-11-17", expiry: "2026-11-17", businessName: "명석법률", businessNumber: "234-56-78902" },
  // 테스트근생5 (2명)
  { id: nextId(), name: "서민재", building: "테스트근생5", room: "1층", phone: "010-1010-2001", rent: 2100000, mgmt: 300000, deposit: 35000000, due: "3/6", overdue: 0, moveIn: "2024-06-06", expiry: "2026-06-06", businessName: "민재정형외과", businessNumber: "345-67-89013" },
  { id: nextId(), name: "신은하", building: "테스트근생5", room: "2층", phone: "010-1010-2002", rent: 1700000, mgmt: 250000, deposit: 28000000, due: "3/11", overdue: 0, moveIn: "2025-01-11", expiry: "2027-01-11", businessName: "은하네일", businessNumber: "456-78-90124" },

  // ================================================================
  // 단기+근생 혼합 임차인 (~10명)
  // ================================================================
  // 테스트혼합단근1 (4명: 2단기 + 2근생)
  { id: nextId(), name: "김태민", building: "테스트혼합단근1", room: "201", phone: "010-1212-3001", rent: 650000, mgmt: 80000, deposit: 650000, due: "3/5", overdue: 0, moveIn: "2026-01-05", expiry: "2026-07-05" },
  { id: nextId(), name: "이주하", building: "테스트혼합단근1", room: "202", phone: "010-1212-3002", rent: 700000, mgmt: 80000, deposit: 700000, due: "3/10", overdue: 0, moveIn: "2025-12-10", expiry: "2026-06-10" },
  { id: nextId(), name: "박승우", building: "테스트혼합단근1", room: "1층A", phone: "010-1212-3003", rent: 1800000, mgmt: 250000, deposit: 30000000, due: "3/15", overdue: 0, moveIn: "2024-09-15", expiry: "2026-09-15", businessName: "승우치과", businessNumber: "567-89-01235" },
  { id: nextId(), name: "최은주", building: "테스트혼합단근1", room: "1층B", phone: "010-1212-3004", rent: 1500000, mgmt: 200000, deposit: 25000000, due: "3/20", overdue: 0, moveIn: "2025-03-20", expiry: "2027-03-20", businessName: "은주약국", businessNumber: "678-90-12346" },
  // 테스트혼합단근2 (3명: 1단기 + 2근생)
  { id: nextId(), name: "정유찬", building: "테스트혼합단근2", room: "301", phone: "010-1313-4001", rent: 600000, mgmt: 70000, deposit: 600000, due: "3/7", overdue: 0, moveIn: "2026-01-07", expiry: "2026-07-07" },
  { id: nextId(), name: "한가영", building: "테스트혼합단근2", room: "1층", phone: "010-1313-4002", rent: 2200000, mgmt: 300000, deposit: 35000000, due: "3/12", overdue: 1, moveIn: "2024-06-12", expiry: "2026-06-12", businessName: "가영카페", businessNumber: "789-01-23457" },
  { id: nextId(), name: "강지수", building: "테스트혼합단근2", room: "2층", phone: "010-1313-4003", rent: 1600000, mgmt: 220000, deposit: 28000000, due: "3/18", overdue: 0, moveIn: "2025-05-18", expiry: "2027-05-18", businessName: "지수미용실", businessNumber: "890-12-34568" },
  // 테스트혼합단근3 (4명: 2단기 + 2근생)
  { id: nextId(), name: "윤채은", building: "테스트혼합단근3", room: "301", phone: "010-1414-5001", rent: 580000, mgmt: 70000, deposit: 580000, due: "3/4", overdue: 0, moveIn: "2026-02-04", expiry: "2026-08-04" },
  { id: nextId(), name: "임서준", building: "테스트혼합단근3", room: "302", phone: "010-1414-5002", rent: 620000, mgmt: 70000, deposit: 620000, due: "3/9", overdue: 0, moveIn: "2025-12-09", expiry: "2026-06-09" },
  { id: nextId(), name: "오재현", building: "테스트혼합단근3", room: "1층", phone: "010-1414-5003", rent: 2000000, mgmt: 280000, deposit: 32000000, due: "3/14", overdue: 0, moveIn: "2024-08-14", expiry: "2026-08-14", businessName: "재현부동산", businessNumber: "901-23-45679" },
  { id: nextId(), name: "배하린", building: "테스트혼합단근3", room: "2층", phone: "010-1414-5004", rent: 1400000, mgmt: 200000, deposit: 22000000, due: "3/19", overdue: 0, moveIn: "2025-07-19", expiry: "2027-07-19", businessName: "하린네일아트", businessNumber: "012-34-56790" },

  // ================================================================
  // 단기+일반 혼합 임차인 (~8명)
  // ================================================================
  // 테스트혼합단일1 (3명: 1단기 + 2일반)
  { id: nextId(), name: "조시현", building: "테스트혼합단일1", room: "101", phone: "010-1515-6001", rent: 700000, mgmt: 80000, deposit: 700000, due: "3/5", overdue: 0, moveIn: "2026-01-05", expiry: "2026-07-05" },
  { id: nextId(), name: "서유나", building: "테스트혼합단일1", room: "201", phone: "010-1515-6002", rent: 1100000, mgmt: 140000, deposit: 22000000, due: "3/10", overdue: 0, moveIn: "2024-09-10", expiry: "2026-09-10" },
  { id: nextId(), name: "신재혁", building: "테스트혼합단일1", room: "301", phone: "010-1515-6003", rent: 1300000, mgmt: 160000, deposit: 26000000, due: "3/15", overdue: 0, moveIn: "2025-03-15", expiry: "2027-03-15" },
  // 테스트혼합단일2 (3명: 2단기 + 1일반)
  { id: nextId(), name: "류민지", building: "테스트혼합단일2", room: "101", phone: "010-1616-7001", rent: 650000, mgmt: 80000, deposit: 650000, due: "3/7", overdue: 0, moveIn: "2026-02-07", expiry: "2026-08-07" },
  { id: nextId(), name: "문하영", building: "테스트혼합단일2", room: "102", phone: "010-1616-7002", rent: 680000, mgmt: 80000, deposit: 680000, due: "3/12", overdue: 0, moveIn: "2025-12-12", expiry: "2026-06-12" },
  { id: nextId(), name: "양성호", building: "테스트혼합단일2", room: "201", phone: "010-1616-7003", rent: 1000000, mgmt: 130000, deposit: 20000000, due: "3/18", overdue: 1, moveIn: "2024-09-18", expiry: "2026-09-18", },
  // 테스트혼합단일3 (2명: 1단기 + 1일반)
  { id: nextId(), name: "구하준", building: "테스트혼합단일3", room: "101", phone: "010-1717-8001", rent: 600000, mgmt: 70000, deposit: 600000, due: "3/6", overdue: 0, moveIn: "2026-01-06", expiry: "2026-07-06" },
  { id: nextId(), name: "남수아", building: "테스트혼합단일3", room: "201", phone: "010-1717-8002", rent: 900000, mgmt: 110000, deposit: 15000000, due: "3/11", overdue: 0, moveIn: "2025-05-11", expiry: "2027-05-11" },

  // ================================================================
  // 관리사무소대행 임차인 (~10명) - mgmt 9만/세대, rent 없음
  // ================================================================
  // 테스트관리1 (5명)
  { id: nextId(), name: "전도현", building: "테스트관리1", room: "101", phone: "010-1818-9001", rent: 0, mgmt: 90000, deposit: 0, due: "3/5", overdue: 0, moveIn: "2024-03-05", expiry: "" },
  { id: nextId(), name: "황미연", building: "테스트관리1", room: "102", phone: "010-1818-9002", rent: 0, mgmt: 90000, deposit: 0, due: "3/10", overdue: 0, moveIn: "2023-09-10", expiry: "" },
  { id: nextId(), name: "노승우", building: "테스트관리1", room: "201", phone: "010-1818-9003", rent: 0, mgmt: 90000, deposit: 0, due: "3/15", overdue: 1, moveIn: "2025-01-15", expiry: "" },
  { id: nextId(), name: "고은비", building: "테스트관리1", room: "202", phone: "010-1818-9004", rent: 0, mgmt: 90000, deposit: 0, due: "3/20", overdue: 0, moveIn: "2024-06-20", expiry: "" },
  { id: nextId(), name: "백재윤", building: "테스트관리1", room: "301", phone: "010-1818-9005", rent: 0, mgmt: 90000, deposit: 0, due: "3/25", overdue: 0, moveIn: "2025-03-25", expiry: "" },
  // 테스트관리2 (5명)
  { id: nextId(), name: "유진영", building: "테스트관리2", room: "101", phone: "010-1919-0001", rent: 0, mgmt: 90000, deposit: 0, due: "3/3", overdue: 0, moveIn: "2024-01-03", expiry: "" },
  { id: nextId(), name: "허성훈", building: "테스트관리2", room: "102", phone: "010-1919-0002", rent: 0, mgmt: 90000, deposit: 0, due: "3/8", overdue: 0, moveIn: "2023-07-08", expiry: "" },
  { id: nextId(), name: "차연주", building: "테스트관리2", room: "201", phone: "010-1919-0003", rent: 0, mgmt: 90000, deposit: 0, due: "3/13", overdue: 0, moveIn: "2024-09-13", expiry: "" },
  { id: nextId(), name: "송민혁", building: "테스트관리2", room: "202", phone: "010-1919-0004", rent: 0, mgmt: 90000, deposit: 0, due: "3/18", overdue: 2, moveIn: "2025-05-18", expiry: "" },
  { id: nextId(), name: "곽예지", building: "테스트관리2", room: "301", phone: "010-1919-0005", rent: 0, mgmt: 90000, deposit: 0, due: "3/22", overdue: 0, moveIn: "2024-11-22", expiry: "" },

  // ================================================================
  // 추가 임차인 (총 103명 이상 충족)
  // ================================================================
  // 테스트단기3 추가 1명 (공실→입주)
  { id: nextId(), name: "홍성빈", building: "테스트단기3", room: "302", phone: "010-3456-7006", rent: 640000, mgmt: 70000, deposit: 640000, due: "3/24", overdue: 0, moveIn: "2026-03-24", expiry: "2026-09-24" },
  // 테스트일반3 추가 1명
  { id: nextId(), name: "김도연", building: "테스트일반3", room: "202", phone: "010-3333-4004", rent: 920000, mgmt: 110000, deposit: 16000000, due: "3/22", overdue: 0, moveIn: "2025-09-22", expiry: "2027-09-22" },
  // 테스트근생5 추가 1명
  { id: nextId(), name: "장혜원", building: "테스트근생5", room: "3층", phone: "010-1010-2003", rent: 1300000, mgmt: 200000, deposit: 22000000, due: "3/16", overdue: 0, moveIn: "2025-08-16", expiry: "2027-08-16", businessName: "혜원치과", businessNumber: "567-89-01236" },

  // 기업시설관리: 임차인 없음 (호실 없음)
];
