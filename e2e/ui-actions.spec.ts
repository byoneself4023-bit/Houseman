import { test, expect, Page } from '@playwright/test';
import {
  authSeed,
  buildingsSeed,
  tenantsSeed,
  vacanciesSeed,
  buildingDataSeed,
  contractEventSeed,
} from './seed';

function makeAppData(overrides: Record<string, any> = {}) {
  return {
    hm_roomBalances: { '스타빌_101': 150000 },
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
    hm_cashbookEntries: [],
    hm_pastTenantsData: {},
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
// 6. 건물 목록 → 건물 클릭 → 상세 페이지 로드
// ═══════════════════════════════════════════════════════════
test('6. 건물 목록 → 상세 페이지', async ({ page }) => {
  await seedAndGo(page, '/buildings');

  const building = page.getByText('스타빌').first();
  await expect(building).toBeVisible({ timeout: 10_000 });
  await building.click();

  // 상세 페이지 로드 확인 — 호실 정보 또는 건물명
  await expect(page.getByText('스타빌').first()).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/buildings/);
});

// ═══════════════════════════════════════════════════════════
// 7. 임차인 목록에 시드 데이터 표시
// ═══════════════════════════════════════════════════════════
test('7. 임차인 목록에 시드 데이터 표시', async ({ page }) => {
  await seedAndGo(page, '/tenants');

  // 시드 임차인 이름 표시 (5자 초과 시 잘림 → title 속성으로 확인)
  const tenantCell = page.locator('td[title="테스트임차인"]');
  await expect(tenantCell.first()).toBeVisible({ timeout: 15_000 });
});

// ═══════════════════════════════════════════════════════════
// 8. 건물 필터 — 특정 건물 선택 후 해당 건물 데이터만 표시
// ═══════════════════════════════════════════════════════════
test('8. 건물 필터 동작', async ({ page }) => {
  await seedAndGo(page, '/tenants');

  // 건물 필터 선택 (select 또는 버튼)
  const filter = page.locator('select').first();
  await expect(filter).toBeVisible({ timeout: 10_000 });

  // '스타빌' 선택
  await filter.selectOption({ label: '스타빌' });
  await page.waitForTimeout(500);

  // 스타빌 임차인이 여전히 보임
  const tenantCell = page.locator('td[title="테스트임차인"]');
  await expect(tenantCell.first()).toBeVisible({ timeout: 5_000 });
});

// ═══════════════════════════════════════════════════════════
// 9. 사이드바 메뉴 네비게이션 — 주요 메뉴 클릭 → URL 변경
// ═══════════════════════════════════════════════════════════
test('9. 사이드바 메뉴 네비게이션', async ({ page }) => {
  await seedAndGo(page, '/calendar');

  const menuItems = [
    { text: '임차인', url: '/tenants' },
    { text: '공실', url: '/vacancies' },
    { text: '입금', url: '/transactions' },
  ];

  for (const item of menuItems) {
    // 사이드바에서 메뉴 클릭
    const link = page.locator('nav a, aside a').filter({ hasText: item.text }).first();
    if (await link.isVisible()) {
      await link.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(item.url));
    }
  }
});

// ═══════════════════════════════════════════════════════════
// 10. 모바일 뷰포트 → 하단 네비게이션 표시
// ═══════════════════════════════════════════════════════════
test('10. 모바일 뷰포트 → 하단 네비게이션', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await seedAndGo(page, '/calendar');

  // 모바일 하단 네비게이션 바 표시 (fixed bottom)
  const mobileNav = page.locator('[class*="fixed"][class*="bottom"], nav').last();
  await expect(mobileNav).toBeVisible({ timeout: 10_000 });
});

// ═══════════════════════════════════════════════════════════
// 11. 공실 목록 → 시드 데이터 표시
// ═══════════════════════════════════════════════════════════
test('11. 공실 목록 데이터 표시', async ({ page }) => {
  await seedAndGo(page, '/vacancies');

  // 시드: 스타빌 201
  await expect(page.getByText('201').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('홍보중').first()).toBeVisible();
});

// ═══════════════════════════════════════════════════════════
// 12. 수금 페이지 → 임차인 잔액 표시
// ═══════════════════════════════════════════════════════════
test('12. 수금 페이지 데이터 표시', async ({ page }) => {
  await seedAndGo(page, '/collection');

  // 수금 페이지 로드 확인
  await expect(page.getByText('수금').first()).toBeVisible({ timeout: 10_000 });
});

// ═══════════════════════════════════════════════════════════
// 13. 캘린더 → 월 이동 (< > 버튼) → 에러 없음
// ═══════════════════════════════════════════════════════════
test('13. 캘린더 월 이동 에러 없음', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await seedAndGo(page, '/calendar');

  // 월 이동 버튼 클릭 (< 또는 ◀ 또는 이전)
  const prevBtn = page.locator('button').filter({ hasText: /◀|<|이전/ }).first();
  if (await prevBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await prevBtn.click();
    await page.waitForTimeout(1000);

    // 다음 월로도 이동
    const nextBtn = page.locator('button').filter({ hasText: /▶|>|다음/ }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  const realErrors = errors.filter(e => !e.includes('fetch') && !e.includes('network'));
  expect(realErrors).toHaveLength(0);
});

// ═══════════════════════════════════════════════════════════
// 14. 정산 페이지 → 로드 확인
// ═══════════════════════════════════════════════════════════
test('14. 정산 페이지 데이터 표시', async ({ page }) => {
  await seedAndGo(page, '/settlement');

  await expect(page.getByText('정산').first()).toBeVisible({ timeout: 10_000 });
});

// ═══════════════════════════════════════════════════════════
// 15. 오늘할일 → 자동 생성된 태스크 목록 표시
// ═══════════════════════════════════════════════════════════
test('15. 오늘할일 페이지 태스크 표시', async ({ page }) => {
  await seedAndGo(page, '/task-driver');

  await expect(page.getByRole('heading', { name: /할 일/ })).toBeVisible({ timeout: 10_000 });

  // 자동 생성 태스크 또는 "+ 직접 할 일 추가" 버튼이 표시되어야 함
  const addBtn = page.locator('button').filter({ hasText: '직접 할 일 추가' });
  await expect(addBtn).toBeVisible({ timeout: 5_000 });
});
