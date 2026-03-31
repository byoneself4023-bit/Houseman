/**
 * E2E 테스트 시드 데이터
 * localStorage에 주입하여 앱을 초기 상태로 설정
 */

// 대표 계정 — general 역할 (모든 건물 접근)
export const STAFF_PHONE = '010-5560-8245';
export const STAFF_PW = '8245';
export const STAFF_ID = 1;
export const STAFF_NAME = '박종호 대표';

// Zustand persist 포맷: hm_auth
export const authSeed = {
  state: {
    loggedInId: STAFF_ID,
    role: 'admin',
    accessToken: null,
    refreshToken: null,
    staffName: STAFF_NAME,
    roles: ['general'],
    assignedBuildings: [],
  },
  version: 0,
};

export const buildingsSeed = [
  {
    name: '스타빌',
    rooms: 10,
    occupied: 8,
    type: '단기',
    feeType: 'pct',
    fee: 0,
    fixedFee: 0,
    special: null,
    parkingTotal: 5,
  },
  {
    name: '제이앤제이',
    rooms: 5,
    occupied: 4,
    type: '단기',
    feeType: 'pct',
    fee: 0,
    fixedFee: 0,
    special: null,
    parkingTotal: 3,
  },
];

export const tenantsSeed = [
  {
    id: 9001,
    name: '테스트임차인',
    building: '스타빌',
    room: '101',
    phone: '010-1111-2222',
    rent: 500000,
    mgmt: 50000,
    deposit: 5000000,
    type: '단기',
    due: '3/5',
    status: '정상',
    overdue: 0,
    moveIn: '2025-06-01',
    expiry: '2026-06-01',
    prevUnpaid: 0,
    currentUnpaid: 0,
    overdueDays: 0,
    moveOutPhotos: ['data:image/png;base64,placeholder'],
  },
];

export const vacanciesSeed = [
  {
    building: '스타빌',
    room: '201',
    type: '단기',
    deposit: 500,
    rent: 50,
    nego: 45,
    mgmt: 5,
    days: 12,
    status: '홍보중',
    commBroker: 10,
    commEvent: '',
    pw: '1234',
    waterFee: '포함',
    cable: '포함',
    exitFee: 8,
  },
];

// 계약 이벤트 — 7단계 테스트용
export const contractEventSeed = {
  date: new Date().toISOString().slice(0, 10),
  type: '계약' as const,
  building: '스타빌',
  room: '201',
  name: '신규입주자',
  color: '#3B82F6',
  registeredBy: STAFF_NAME,
  contractDate: new Date().toISOString().slice(0, 10),
  deposit: 500,
  rent: 50,
  mgmt: 5,
  moveIn: new Date().toISOString().slice(0, 10),
  expiry: '2027-03-31',
  broker: '테스트부동산',
  brokerPhone: '010-9999-8888',
  registeredSource: '부동산' as const,
  source: 'local' as const,
};

// 퇴실 이벤트 — 6단계 워크플로우 테스트용
export const moveOutEventSeed = {
  date: new Date().toISOString().slice(0, 10),
  type: '퇴실' as const,
  building: '스타빌',
  room: '302',
  name: '퇴실테스트',
  color: '#EF4444',
  registeredBy: STAFF_NAME,
  source: 'local' as const,
  moveOutLinkSent: true, // 자동정리 방지: 워크플로우 진행 상태 필요
};

export const buildingDataSeed: Record<string, any> = {
  '스타빌': {
    address: '서울시 강남구 테스트로 1',
    visitCycle: '월1회',
    managers: {
      internal: '공원식 대리',
      external: '유인식 과장',
      collection: '나호용 차장',
      contract: '',
      general: '박종호 대표',
    },
  },
  '제이앤제이': {
    address: '서울시 서초구 테스트로 2',
    visitCycle: '월2회',
    managers: {
      internal: '이진아 사원',
      external: '이재혁 사원',
      collection: '유은혜 부장',
      contract: '',
      general: '박종호 대표',
    },
  },
};

/**
 * appData blob 생성 — useAppData는 'appData' 키 하나에서 모든 데이터를 읽음
 */
function makeAppData(overrides: Record<string, any> = {}) {
  return {
    hm_roomBalances: {},
    hm_billingHistory: [],
    hm_transactions: [],
    hm_billingConfirmed: {},
    hm_billingSent: {},
    hm_parkingInfo: {},
    hm_buildingAccounts: {},
    hm_customBuildings: [],
    hm_lateFeeOverrides: {},
    hm_settlementExpenses: [],
    hm_cashbookEntries: [],
    hm_pastTenantsData: {},
    hm_allBuildings: buildingsSeed,
    hm_activeTenants: tenantsSeed,
    hm_activeVacancies: vacanciesSeed,
    hm_calendarEvts: [] as any[],
    hm_buildingData: buildingDataSeed,
    ...overrides,
  };
}

/**
 * 모든 시드 데이터를 localStorage에 주입
 * 핵심: useAppData는 'appData' 키 하나에서 blob으로 읽음
 */
export function injectSeedData(page: import('@playwright/test').Page) {
  return page.addInitScript(({ auth, appData }) => {
    localStorage.setItem('hm_auth', JSON.stringify(auth));
    localStorage.setItem('appData', JSON.stringify(appData));
  }, {
    auth: authSeed,
    appData: makeAppData(),
  });
}

/**
 * 특정 calendarEvts를 포함한 시드 주입
 */
export function injectSeedWithEvents(page: import('@playwright/test').Page, events: any[]) {
  return page.addInitScript(({ auth, appData }) => {
    localStorage.setItem('hm_auth', JSON.stringify(auth));
    localStorage.setItem('appData', JSON.stringify(appData));
  }, {
    auth: authSeed,
    appData: makeAppData({ hm_calendarEvts: events }),
  });
}

/**
 * 로그인 UI를 통해 로그인 (auth seed 없이)
 */
export async function loginViaUI(page: import('@playwright/test').Page) {
  await page.getByPlaceholder('010-0000-0000').fill(STAFF_PHONE);
  await page.getByPlaceholder('비밀번호 입력').fill(STAFF_PW);
  await page.getByRole('button', { name: '로그인' }).click();
}
