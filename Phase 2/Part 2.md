# Phase 2 Part 2 — TenantsPage 기능 통합

---

## 실행 환경

- Phase 2 Part 1 (CalendarPage) 완료 상태
- CEO TenantsPage.jsx: 2,939줄
- 우리 tenants/ 디렉토리: 11개 파일, 2,461줄
- 작업: Round 1(로직) → Round 2(Supabase) → Round 3(UI) 하나의 커밋으로

---

## tenantsApi.ts (신규, 68줄)

calendarApi.ts와 동일 패턴. USE_API=true → no-op. USE_API=false → Supabase 직접 호출.

persistUpdateTenant — 임차인 정보 수정 시 Supabase 동기화. supabaseId 기반.

persistDeactivateTenant — 퇴실 처리 시 Supabase에서 비활성화. moveOutDate 전달.

persistInsertTenant — 신규 입주 등록. findRoomAndBuilding으로 roomId/buildingId 조회 후 insertTenant.

---

## 필터 보강

### TenantSearchBar.tsx (15줄 → 46줄)

기존: 이름/건물/호실 텍스트 검색만.

추가: 건물별 select 드롭다운 + 상태 토글(전체/정상/연체) + 초기화 버튼. 연체 빨간색, 정상 초록색 배경.

### TenantsPage.tsx 필터 로직

statusFilter/buildingFilter state 추가. useMemo filtered에 조건 2개 추가: buildingFilter 일치 + statusFilter(overdue/overdueDays 기준). deps 배열에 반영.

---

## 퇴실체크 데이터 연동

### deductionItems 연동

pendingMoveout 진입 시 + 퇴실모드 초기화 시, 캘린더 퇴실 이벤트에서 deductionItems(ExternalCheckModal에서 입력한 공제 항목)를 가져와서 manOther에 자동 세팅. 기존에는 항상 빈 배열로 시작.

### refundBank 연동

DirectInputModal에서 입력된 환불 계좌(bank/account/holder)를 pendingMoveout 진입 시 자동 세팅. 기존에는 moveOutMsg 파싱으로만 추출.

---

## 공실 필드명 통일

water → waterFee. CalendarPage 통합에서 통일한 필드명을 TenantsPage의 공실 등록에도 적용.

---

## Supabase 영속화 (4곳)

재계약 — persistUpdateTenant(t.supabaseId, updated). toast.error 실패 알림.

퇴실 — persistDeactivateTenant(t.supabaseId, moveoutDateStr). toast.error 실패 알림.

상세 수정 — TenantDetail 저장 시 persistUpdateTenant. toast.error 실패 알림.

신규 입주 — TenantContractCard 호실등록 시 persistInsertTenant. 성공 시 supabaseId + source 세팅. toast.success 완료 알림.

---

## DB 소스 배지

TenantDetail 헤더 — source === "supabase"일 때 초록색 "DB" 배지 표시.

TenantList 리스트 행 — 이름 옆에 작은 초록색 "DB" 배지 표시.

---

## 임차인연결 (매물등록) 시스템

조건: 일반임대/근생 호실만 표시.

is_listing 체크박스 + listing_available_date 날짜 입력. 잠금/해제 토글(🔒/🔓)로 실수 방지. buildingData[tenant_${id}]에 저장. Supabase 동기화 연동.

TenantsWrapper → TenantsPage → TenantDetail로 setBuildingData props 전달 경로 추가.

---

## 다중 차량 (근생 최대 5대)

TenantDetail 주차 섹션에 차량 2~5 그리드 추가. 주차유형 select(선착순/지정무료/리모컨/주차비/리모컨+주차비), 주차비, 리모컨보증금, 차번호, 차종. 차량 추가/삭제 버튼. 총 주차비 + 총 리모컨보증금 요약 배너.

extraCarCount state: TenantsPage → TenantDetail로 전달.

---

## 산출물 요약

### 신규 파일 (1개)

| 파일 | 역할 |
|------|------|
| src/pages/tenants/tenantsApi.ts | Supabase CRUD feature flag 래퍼 |

### 수정 파일 (6개)

| 파일 | 변경 |
|------|------|
| TenantsPage.tsx | 필터 state + filter 로직 + deductionItems/refundBank 연동 + Supabase 동기화 + waterFee + setBuildingData + extraCarCount |
| TenantSearchBar.tsx | 건물 select + 상태 토글 + 초기화 버튼 |
| TenantDetail.tsx | DB배지 + 임차인연결 시스템 + 다중차량 + Supabase 동기화 |
| TenantContractCard.tsx | 신규 입주 Supabase 등록 + toast |
| TenantList.tsx | DB배지 |
| TenantsWrapper.tsx | setBuildingData prop 추가 |

---

## 검증

- TypeScript: 에러 0개
- Build: 성공 (6.80s)

---

## 남은 작업

| 작업 | 상태 |
|------|------|
| Phase 2 Part 3 — AppLayout + 라우터 등록 | ⬜ |
| Phase 2 Part 4 — BuildingsWrapper 복구 + Store 이중 구조 정리 | ⬜ |
| Phase 3 — Supabase 격리 | ⬜ |
| TenantsPage Round 4 — 클라우드 사진/계약서 업로드 | ⬜ (별도 PR) |
