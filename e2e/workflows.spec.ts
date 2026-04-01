import { test, expect } from '@playwright/test';
import {
  authSeed,
  contractEventSeed,
  moveOutEventSeed,
  tenantsSeed,
  vacanciesSeed,
  buildingsSeed,
  buildingDataSeed,
} from './seed';

function makeAppData(evts: any[] = []) {
  return {
    hm_roomBalances: {}, hm_billingHistory: [], hm_transactions: [],
    hm_billingConfirmed: {}, hm_billingSent: {}, hm_parkingInfo: {},
    hm_buildingAccounts: {}, hm_customBuildings: [], hm_lateFeeOverrides: {},
    hm_settlementExpenses: [], hm_cashbookEntries: [], hm_pastTenantsData: {},
    hm_allBuildings: buildingsSeed,
    hm_activeTenants: tenantsSeed,
    hm_activeVacancies: vacanciesSeed,
    hm_calendarEvts: evts,
    hm_buildingData: buildingDataSeed,
  };
}

/** addInitScript로 localStorage를 페이지 JS 로드 전에 세팅 */
async function seedAndGo(page: import('@playwright/test').Page, appData: any, path = '/') {
  await page.addInitScript(({ auth, appData }) => {
    localStorage.setItem('hm_auth', JSON.stringify(auth));
    localStorage.setItem('appData', JSON.stringify(appData));
  }, { auth: authSeed, appData });
  await page.goto(path, { waitUntil: 'networkidle' });
}

// ═══════════════════════════════════════════════════════════
// Test 1: 계약 이벤트 시드 → 7단계 체크리스트
// ═══════════════════════════════════════════════════════════
test('1. 계약 등록 후 7단계 체크리스트 표시', async ({ page }) => {
  await seedAndGo(page, makeAppData([contractEventSeed]), '/calendar');

  await expect(page.getByText('계약금확인').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('건물주보고').first()).toBeVisible();
  await expect(page.getByText('잔금확인').first()).toBeVisible();
  await expect(page.getByText('계약서입력').first()).toBeVisible();
  await expect(page.getByText('최종납부').first()).toBeVisible();
  await expect(page.getByText('인테리어').first()).toBeVisible();
  await expect(page.getByText('중개료송금').first()).toBeVisible();
});

// ═══════════════════════════════════════════════════════════
// Test 2: 퇴실 등록 → 6단계 워크플로우 표시
// ═══════════════════════════════════════════════════════════
test('2. 퇴실 등록 후 6단계 워크플로우 표시', async ({ page }) => {
  await seedAndGo(page, makeAppData([moveOutEventSeed]), '/calendar');

  await expect(page.getByText('퇴실링크').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('퇴실체크').first()).toBeVisible();
  await expect(page.getByText('정산서').first()).toBeVisible();
  await expect(page.getByText('청소').first()).toBeVisible();
  await expect(page.getByText('입주체크').first()).toBeVisible();
  await expect(page.getByText('공실전환').first()).toBeVisible();

  // 퇴실 이벤트 정보 확인: 건물/호실 + 이름
  await expect(page.getByText('302').first()).toBeVisible();
  await expect(page.getByText('퇴실테스트').first()).toBeVisible();
});

// ═══════════════════════════════════════════════════════════
// Test 3: 청구 페이지 → 청구 설정 버튼 → 모달 표시
// ═══════════════════════════════════════════════════════════
test('3. 청구 설정 버튼 클릭 시 BillingSetupWizard 모달 표시', async ({ page }) => {
  await seedAndGo(page, makeAppData(), '/billing');

  // "⚙️ 청구 설정" 버튼 클릭
  const setupBtn = page.locator('button').filter({ hasText: '청구 설정' });
  await expect(setupBtn).toBeVisible({ timeout: 5_000 });
  await setupBtn.click();

  // BillingSetupWizard 모달 확인
  await expect(page.getByRole('heading', { name: '청구 초기설정' })).toBeVisible({ timeout: 5_000 });

  // 모달 backdrop 클릭으로 닫기
  await page.mouse.click(5, 5);
  await page.waitForTimeout(500);
  await expect(page.getByRole('heading', { name: '청구 초기설정' })).not.toBeVisible({ timeout: 3_000 });
});

// ═══════════════════════════════════════════════════════════
// Test 4: 오늘할일 → 직접 할 일 추가 → 목록 표시
// ═══════════════════════════════════════════════════════════
test('4. 커스텀 태스크 추가 후 목록에 표시', async ({ page }) => {
  await seedAndGo(page, makeAppData(), '/task-driver');

  await expect(page.getByRole('heading', { name: /할 일/ })).toBeVisible({ timeout: 10_000 });

  // "+ 직접 할 일 추가" 버튼 클릭
  const addBtn = page.locator('button').filter({ hasText: '직접 할 일 추가' });
  await expect(addBtn).toBeVisible({ timeout: 5_000 });
  await addBtn.click();

  // 태스크 입력 + 추가
  const input = page.getByPlaceholder('할 일을 입력하세요...');
  await expect(input).toBeVisible();
  await input.fill('E2E 테스트 태스크');
  await page.locator('button').filter({ hasText: /^추가$/ }).click();

  // 목록에 표시 확인
  await expect(page.getByText('E2E 테스트 태스크').first()).toBeVisible({ timeout: 3_000 });
  await expect(page.getByText('직접등록').first()).toBeVisible();
  await expect(page.getByText('직접 등록한 할 일').first()).toBeVisible();

  // localStorage 검증
  const stored = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('hm_tasks_'));
    if (keys.length === 0) return [];
    return JSON.parse(localStorage.getItem(keys[0]) || '[]');
  });
  expect(stored.length).toBe(1);
  expect(stored[0].title).toBe('E2E 테스트 태스크');
});

// ═══════════════════════════════════════════════════════════
// Test 5: 임차인 상세 → 퇴실확정 → activeTenants 제거 + pastTenantsData 추가
// ═══════════════════════════════════════════════════════════
test('5. 퇴실확정 시 임차인 이동 검증', async ({ page }) => {
  await seedAndGo(page, makeAppData(), '/tenants');

  // 임차인 목록 로드 대기 (이름이 5자 초과 시 잘림 처리됨)
  const tenantCell = page.locator('td[title="테스트임차인"]');
  await expect(tenantCell.first()).toBeVisible({ timeout: 15_000 });

  // 임차인 클릭 → 상세 열기 (행 클릭)
  await tenantCell.first().click();
  await page.waitForTimeout(500);

  // 정산 시뮬레이션 플로팅 버튼 클릭 (가상퇴실계산)
  const moveoutBtn = page.getByText('정산 시뮬레이션');
  await expect(moveoutBtn).toBeVisible({ timeout: 5_000 });
  await moveoutBtn.click();
  await page.waitForTimeout(500);

  // MoveOutModal 표시 확인
  const confirmBtn = page.getByText('🚪 퇴실 확정');
  const disabledBtn = page.getByText('퇴실사진 등록 필요');
  await expect(confirmBtn.or(disabledBtn)).toBeVisible({ timeout: 5_000 });

  if (await confirmBtn.isVisible()) {
    await confirmBtn.click();

    // 확인 다이얼로그
    await expect(page.getByText('정말 퇴실처리 하시겠습니까?')).toBeVisible({ timeout: 3_000 });
    const modalConfirm = page.locator('button').filter({ hasText: /^확인$/ }).last();
    await modalConfirm.click();

    // localStorage 반영 대기 (React state → useEffect → saveLS 비동기)
    await expect(async () => {
      const result = await page.evaluate(() => {
        const raw = localStorage.getItem('appData');
        const p = raw ? JSON.parse(raw) : {};
        const tenants = p.hm_activeTenants || [];
        return tenants.some((t: any) => t.id === 9001);
      });
      expect(result).toBe(false);
    }).toPass({ timeout: 15_000 });

    // pastTenantsData 검증
    const pastResult = await page.evaluate(() => {
      const raw = localStorage.getItem('appData');
      const p = raw ? JSON.parse(raw) : {};
      const past = p.hm_pastTenantsData || {};
      return Object.keys(past).some((k: string) => k.includes('스타빌') && k.includes('101'));
    });
    expect(pastResult).toBe(true);
  } else {
    await expect(disabledBtn).toBeVisible();
  }
});
