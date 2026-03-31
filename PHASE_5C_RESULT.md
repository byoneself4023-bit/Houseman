# Phase 5c 결과

> 완료일: 2026-03-31

## 도메인별 전환 현황

| # | 도메인 | Wrapper 수 | 변환 함수 | 비고 |
|---|--------|-----------|----------|------|
| 1 | Staff | 1 | staffResponseToStaff (사용 안 함 — StaffPage 자체 로딩) | |
| 2 | Buildings | 2 | buildingListToBuilding, contractToTenant, vacancyResponseToVacancy, pastContractGroupsToMap | BuildingsWrapper + BuildingDetailWrapper |
| 3 | Parking | 1 | contractToTenant, parkingArrayToRecord | Record 변환 신규 |
| 4 | Cashbook | 1 | cashbookEntryToLocal | buildingName→building 변환 신규 |
| 5 | Vacancies | 1 | vacancyResponseToVacancy, contractToTenant, calendarResponseToEvent, pastContractGroupsToMap | |
| 6 | Calendar | 2 | calendarResponseToEvent, vacancyResponseToVacancy, contractToTenant, pastContractGroupsToMap | CalendarWrapper + BrokerWrapper |
| 7 | Transactions | 1 | transactionResponseToTx, contractToTenant | |
| 8 | Contracts/Tenants | 3 | contractToTenant, pastContractGroupsToMap, vacancyResponseToVacancy, calendarResponseToEvent, billingRecordToLocal | TenantsWrapper + PastTenantsWrapper + RenewalWrapper |
| 9 | Billing | 3 | contractToTenant, billingRecordToLocal | Fixed + Variable + Unified |
| 10 | Settlement | 1 | contractToTenant, transactionResponseToTx, settlementExpenseResponseToExpense, pastContractGroupsToMap, billingRecordToLocal | |
| 11 | 복합 (다도메인) | 5 | 여러 변환 조합 | TaskDriver, ProfitDashboard, Collection, Owner, Homepage |
| 12 | 미변환 | 7 | (불필요) | Patrol, RouteSchedule, AS, Payroll, CompanySettings, HomepageEdit, DataUpload |

## 변환 함수 (12개 — Phase 5b의 9개 + Phase 5c 신규 3개)

| # | 함수 | BE → FE | 신규 여부 |
|---|------|---------|----------|
| 1 | contractToTenant | ContractResponse → Tenant | 5b |
| 2 | buildingListToBuilding | BuildingListResponse → Building | 5b |
| 3 | buildingDetailToFloorData | BuildingDetailResponse → BuildingFloorData | 5b |
| 4 | calendarResponseToEvent | CalendarEventResponse → CalendarEvent | 5b |
| 5 | vacancyResponseToVacancy | VacancyResponse → Vacancy | 5b |
| 6 | transactionResponseToTx | TransactionResponse → RecentTransaction | 5b |
| 7 | pastContractGroupsToMap | PastContractGroupResponse[] → Record | 5b |
| 8 | settlementExpenseResponseToExpense | SettlementExpenseResponse → SettlementExpense | 5b |
| 9 | staffResponseToStaff | StaffResponse → Staff | 5b |
| 10 | **billingRecordToLocal** | BillingRecordResponse → {building, room, items:{...}} | **5c 신규** |
| 11 | **cashbookEntryToLocal** | CashbookEntryResponse → {building, ...} | **5c 신규** |
| 12 | **parkingArrayToRecord** | ParkingInfoResponse[] → Record<contractId, {carNumber, carType}> | **5c 신규** |

## 추가 수정 (Phase 4.5 누락분)

| # | 파일 | 수정 내용 |
|---|------|----------|
| 1 | src/stores/authStore.ts | StaffInfo.assigned_buildings → assignedBuildings |
| 2 | src/layouts/AuthGate.tsx | LoginApiResponse snake_case → camelCase |
| 3 | src/hooks/useAuthQuery.ts | LoginResponse/StaffResponse snake_case → camelCase |
| 4 | src/lib/api.ts | refresh_token → refreshToken, access_token → accessToken |
| 5 | src/types/api.ts | CashbookEntryResponse에 buildingName 필드 추가 |

## buildingData 처리

`buildingData` (Record<string, BuildingFloorData>)는 API의 building list 응답과 구조가 다름.
→ CashBookWrapper, PatrolWrapper, RouteScheduleWrapper에서 `useApiOr(buildingsQ.data, ...)` 제거, `ctx.buildingData` 직접 사용.
→ Phase 5d에서 building detail API 또는 전용 엔드포인트로 전환 예정.

## VITE_USE_API 전환

- 전환 전: `false` (localStorage)
- 전환 후: **`true`** (Spring Boot API → PostgreSQL)

## API 데이터 확인

| 데이터 | 건수 | 상태 |
|--------|------|------|
| Buildings | 46+ | ✅ |
| Contracts | 488 | ✅ |
| Calendar Events | 14 | ✅ |
| Vacancies | 1 | ✅ |
| Past Contracts | 14 | ✅ |
| Billing Records | 0 | ✅ (운영 데이터 — 생성 전) |
| Cashbook | 0 | ✅ (운영 데이터) |
| Parking | 0 | ✅ (운영 데이터) |

## 빌드

- typecheck: ✅ (BuildingsWrapper 기존 에러만 — 신규 에러 0개)
- build: ✅ (8.69s)

## 잔여 이슈 (Phase 5d에서 처리)

| # | 내용 | 우선순위 |
|---|------|---------|
| 1 | buildingData (Record<string,any>) API 전환 — building detail 엔드포인트 필요 | 중 |
| 2 | Supabase 관련 코드 제거 (~3,100줄) | 중 |
| 3 | roomBalances, lateFeeOverrides, billingConfirmed, billingSent — localStorage 의존 잔류 | 중 |
| 4 | addBilling, addDeposit, addCashbookEntry — localStorage 직접 조작 함수 → API mutation 전환 | 높 |
| 5 | setActiveTenants 등 setter props — USE_API=true 시 undefined 전달 중, mutation+invalidate 패턴 전환 필요 | 중 |

## 다음 단계 (Phase 5d)

1. Supabase 코드 삭제 + featureFlag.ts 제거
2. buildingData API 전환
3. localStorage 직접 조작 함수 → API mutation 전환
4. setter props 정리
