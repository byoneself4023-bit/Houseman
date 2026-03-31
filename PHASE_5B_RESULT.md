# Phase 5b 결과

> 완료일: 2026-03-31

## API 응답 타입 (src/types/api.ts)

| # | 타입 | 필드 수 | 대응 FE 타입 |
|---|------|---------|-------------|
| 1 | BuildingListResponse | 10 | Building |
| 2 | BuildingDetailResponse | 17 | BuildingFloorData |
| 3 | RoomResponse | 16 | RoomMaster |
| 4 | ContractResponse | 21 | Tenant |
| 5 | PastContractRecord | 33 | PastTenant |
| 6 | PastContractGroupResponse | 3 | Record<string, PastTenant[]> |
| 7 | CalendarEventResponse | 9 | CalendarEvent |
| 8 | VacancyResponse | 18 | Vacancy |
| 9 | StaffResponse | 5 | Staff |
| 10 | TransactionResponse | 10 | RecentTransaction |
| 11 | BillingRecordResponse | 21 | (신규 — FE에 대응 타입 없었음) |
| 12 | BillingStatusResponse | 4 | (신규) |
| 13 | BillingConfigResponse | 19 | BillingConfigItem |
| 14 | SettlementMasterResponse | 37 | SettlementMasterEntry |
| 15 | SettlementExpenseResponse | 10 | SettlementExpense |
| 16 | CashbookEntryResponse | 14 | (신규) |
| 17 | ParkingInfoResponse | 8 | (신규) |
| 18 | LoginResponse | 2 | — |
| 19 | MeResponse | 5 | Staff |
| 20 | SettlementCalculationResponse | 4 | (신규) |

## 변환 함수 (src/lib/transforms.ts)

| # | 함수 | BE 타입 → FE 타입 | 핵심 변환 |
|---|------|------------------|----------|
| 1 | contractToTenant | ContractResponse → Tenant | buildingName→building, roomNumber→room |
| 2 | buildingListToBuilding | BuildingListResponse → Building | roomCount→rooms, occupiedCount→occupied, buildingType→type |
| 3 | buildingDetailToFloorData | BuildingDetailResponse → BuildingFloorData | ownerName→owner, ownerPhone→phone |
| 4 | calendarResponseToEvent | CalendarEventResponse → CalendarEvent | buildingName→building, roomNumber→room, +id |
| 5 | vacancyResponseToVacancy | VacancyResponse → Vacancy | buildingName→building, roomNumber→room, +id/buildingId/roomId |
| 6 | transactionResponseToTx | TransactionResponse → RecentTransaction | buildingName→building, roomNumber→room, category→cat |
| 7 | pastContractGroupsToMap | PastContractGroupResponse[] → Record<string, PastTenant[]> | 그룹→맵, null→undefined |
| 8 | settlementExpenseResponseToExpense | SettlementExpenseResponse → SettlementExpense | buildingName→building, description→desc |
| 9 | staffResponseToStaff | StaffResponse → Staff | pw='' (서버에서 비밀번호 미반환) |

## 쿼리 훅 타이핑 (13개 → unknown[] 0개)

| # | 훅 | Before | After |
|---|------|--------|-------|
| 1 | useContracts | unknown[] | ContractResponse[] |
| 2 | useContractDetail | unknown | ContractResponse |
| 3 | useExpiringContracts | unknown[] | ContractResponse[] |
| 4 | usePastContracts | unknown[] | PastContractGroupResponse[] |
| 5 | useBuildings | unknown[] | BuildingListResponse[] |
| 6 | useBuildingDetail | unknown | BuildingDetailResponse |
| 7 | useBuildingRooms | unknown[] | RoomResponse[] |
| 8 | useCalendarEvents | unknown[] | CalendarEventResponse[] |
| 9 | useVacancies | unknown[] | VacancyResponse[] |
| 10 | useStaff | StaffResponse[] (기존) | StaffResponse[] (api.ts로 이동) |
| 11 | useTransactions | unknown[] | TransactionResponse[] |
| 12 | useBillingRecords | unknown[] | BillingRecordResponse[] |
| 13 | useBillingStatus | unknown | BillingStatusResponse |
| 14 | useBillingConfigs | unknown[] | BillingConfigResponse[] |
| 15 | useSettlementMasters | unknown[] | SettlementMasterResponse[] |
| 16 | useSettlementExpenses | unknown[] | SettlementExpenseResponse[] |
| 17 | useCashbookEntries | unknown[] | CashbookEntryResponse[] |
| 18 | useParkingInfos | unknown[] | ParkingInfoResponse[] |

## 추가 수정: query param 이름 통일

Phase 4.5에서 BE `@RequestParam("building_id")` → `"buildingId"`로 변경했으므로,
FE 쿼리 훅의 params도 `{ building_id: ... }` → `{ buildingId: ... }`로 통일함.

영향받은 훅: useContracts, useVacancies, useTransactions, useBillingRecords,
useBillingStatus, useBillingConfigs, useSettlementExpenses, useCashbookEntries, useParkingInfos (9개)

useGenerateBilling mutation의 `{ building_id, period_year, period_month }`도
`{ buildingId, periodYear, periodMonth }`로 변경.

## 빌드

- typecheck: ✅ (BuildingsWrapper 4개 기존 에러만 — 신규 에러 0개)
- build: ✅ (8.03s)
- unknown[] 잔여: **0개**

## 다음 단계 (Phase 5c)

Wrapper 컴포넌트에서 변환 함수 적용 + VITE_USE_API=true 전환
