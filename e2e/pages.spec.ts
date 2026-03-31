import { test, expect, Page } from '@playwright/test';
import {
  authSeed,
  buildingsSeed,
  tenantsSeed,
  vacanciesSeed,
  buildingDataSeed,
} from './seed';

function makeAppData(overrides: Record<string, any> = {}) {
  return {
    hm_roomBalances: {},
    hm_billingHistory: [],
    hm_transactions: [
      { id: 1, date: '2026-03-01', type: '입금', building: '스타빌', room: '101', name: '테스트임차인', amount: 300000, method: '계좌이체', note: '' },
    ],
    hm_billingConfirmed: {},
    hm_billingSent: {},
    hm_parkingInfo: {},
    hm_buildingAccounts: {},
    hm_customBuildings: [],
    hm_lateFeeOverrides: {},
    hm_settlementExpenses: [],
    hm_cashbookEntries: [
      { id: 1, date: '2026-03-01', type: '관리비', direction: '출금', description: '테스트 출금', amount: 100000, status: '대기' },
    ],
    hm_pastTenantsData: {
      '스타빌_999': [{ name: '과거임차인', room: '999', moveOut: '2025-12-31' }],
    },
    hm_allBuildings: buildingsSeed,
    hm_activeTenants: tenantsSeed,
    hm_activeVacancies: vacanciesSeed,
    hm_calendarEvts: [],
    hm_buildingData: buildingDataSeed,
    ...overrides,
  };
}

async function seedAndGo(page: Page, path: string, overrides: Record<string, any> = {}) {
  const appData = makeAppData(overrides);
  await page.addInitScript(({ auth, appData }) => {
    localStorage.setItem('hm_auth', JSON.stringify(auth));
    localStorage.setItem('appData', JSON.stringify(appData));
  }, { auth: authSeed, appData });
  await page.goto(path, { waitUntil: 'networkidle' });
}

// ═══════════════════════════════════════════════════════════
// 30개 페이지 렌더링 테스트
// 각 페이지 접속 → 에러 없이 로드 → 최소 1개 고유 텍스트 표시
// ═══════════════════════════════════════════════════════════

const routes: { path: string; texts: string[] }[] = [
  { path: '/calendar', texts: ['입퇴실일정'] },
  { path: '/buildings', texts: ['건물'] },
  { path: '/buildings/%EC%8A%A4%ED%83%80%EB%B9%8C', texts: ['스타빌'] }, // /buildings/스타빌
  { path: '/tenants', texts: ['임차인'] },
  { path: '/past-tenants', texts: ['퇴실'] },
  { path: '/renewal', texts: ['갱신'] },
  { path: '/vacancies', texts: ['공실'] },
  { path: '/collection', texts: ['수금'] },
  { path: '/billing', texts: ['청구'] },
  { path: '/billing/fixed', texts: ['청구'] },
  { path: '/billing/variable', texts: ['청구'] },
  { path: '/transactions', texts: ['입금'] },
  { path: '/parking', texts: ['주차'] },
  { path: '/as', texts: ['AS 관리', 'AS'] },
  { path: '/patrol', texts: ['순회 관리', '순회'] },
  { path: '/settlement', texts: ['정산'] },
  { path: '/cashbook', texts: ['출납'] },
  { path: '/payroll', texts: ['급여'] },
  { path: '/task-driver', texts: ['할 일'] },
  { path: '/profit-dashboard', texts: ['수익'] },
  { path: '/route-schedule', texts: ['동선'] },
  { path: '/company-settings', texts: ['설정'] },
  { path: '/data-upload', texts: ['업로드'] },
  { path: '/homepage-edit', texts: ['홈페이지'] },
  { path: '/homepage', texts: ['홈페이지'] },
  { path: '/staff', texts: ['담당자 관리', '담당자'] },
  { path: '/broker', texts: ['부동산 관리', '부동산'] },
  { path: '/owner', texts: ['건물주'] },
];

for (const route of routes) {
  test(`페이지 렌더링: ${route.path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await seedAndGo(page, route.path);

    // React 에러 바운더리 없음
    await expect(page.locator('text=Something went wrong')).not.toBeVisible({ timeout: 3_000 });

    // 고유 텍스트 최소 1개 표시
    let found = false;
    for (const txt of route.texts) {
      const loc = page.getByText(txt, { exact: false }).first();
      try {
        await expect(loc).toBeVisible({ timeout: 10_000 });
        found = true;
        break;
      } catch {
        // try next text
      }
    }
    expect(found).toBe(true);

    // 콘솔 에러 0건 (API 404는 VITE_USE_API=false에서 무관하므로 필터)
    const realErrors = errors.filter(e => !e.includes('fetch') && !e.includes('network'));
    expect(realErrors).toHaveLength(0);
  });
}

// 공개 페이지 (auth 불필요)
test('페이지 렌더링: /homepage-public', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/homepage-public', { waitUntil: 'networkidle' });
  await expect(page.locator('text=Something went wrong')).not.toBeVisible({ timeout: 3_000 });

  const realErrors = errors.filter(e => !e.includes('fetch') && !e.includes('network'));
  expect(realErrors).toHaveLength(0);
});
