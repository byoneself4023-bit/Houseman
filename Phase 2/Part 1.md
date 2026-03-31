# CEO 코드 통합 — Phase 1 + Phase 2 Part 1

---

## 실행 환경

- Phase 0~6 완료 상태: 백엔드 48 API + 프론트 25 페이지 + Docker 3-서비스 + CI
- 대표님 브랜치: origin/refactor/architecture (405개 파일 diff)
- 작업 브랜치: feature/ceo-integration
- 전략: 자동 merge 불가 → 기능 단위 수동 포팅

---

## Phase 1 — CEO 신규 파일 포팅

### 페이지 (6개)

CompanySettingsPage, MoveOutLinkPage, BrokerPage, BuildingsPage, PayrollPage, StaffPage. 전부 .jsx → .tsx 전환. @ts-nocheck 적용 (CEO 원본이 untyped).

### 컴포넌트 (7개)

SearchInput.tsx — 한글 초성 검색 지원 입력 필드. matchKorean 유틸 연동.

Toast.tsx — 커스텀 토스트 알림. 우리는 sonner 사용하므로 호환용.

LoadingSpinner.tsx — CSS keyframe 기반 로딩 인디케이터.

Modal.tsx — 범용 모달. ESC 키 닫기 + 배경 클릭 닫기 + 고정 너비 지원.

PageErrorBoundary.tsx — react-error-boundary 래핑. 에러 발생 시 사용자 친화적 메시지 + 재시도 버튼.

BuildingFormSections.tsx — 건물 등록/수정 폼. 유형 카드, 기본정보, 관리비, 계약조건, 층/호실 구성. @ts-nocheck (251줄).

RoomFormSection.tsx — 호실 등록/수정 폼. 사진 드롭존 연동. @ts-nocheck (247줄).

### Supabase 인프라 (4개)

supabase.ts — createClient 래퍼. 환경변수 없으면 null 반환 (방어 처리).

supabaseData.ts — buildings/rooms/tenants/calendar CRUD 함수. @ts-nocheck (1,071줄).

photoStorage.ts — Supabase Storage 사진 업로드/삭제. 버킷: 'photos', 경로: b{hash}/{room}/{type}/{timestamp}.

useSupabaseQueries.ts — TanStack Query 래핑. useSupabaseBuildings, useSupabaseRooms, useSupabaseTenants.

### Zustand 스토어 (9개 + barrel export)

useAppStore, useBuildingStore, useCalendarStore, useFinanceStore, usePendingStore, useTenantStore, useMigrations, useSupabaseSync, migrate. 전부 @ts-nocheck. stores/index.ts barrel export로 기존 authStore + uiStore와 통합.

### 유틸/데이터 (3개)

validation.ts — 필드 유효성 검사. validateRequired, validatePhone, validateEmail 등 (124줄, 타입 완전).

defaultFinanceData.ts — 초기 청구/입금 데이터 (79줄, 타입 완전).

testData.ts — 테스트용 가상 건물/임차인 데이터. @ts-nocheck (243줄).

### 기타

setBuildingTypeCache 추가 (roomType.ts) — CEO 코드가 건물 유형 캐시를 참조.

scripts/ 디렉토리 — Supabase 관련 스크립트 18개 복사 (upload_all.cjs, sync_tenants.cjs 등).

react-error-boundary, @supabase/supabase-js 패키지 설치.

---

## Phase 2 Part 1 — CalendarPage 기능 통합

### 분석

diff 2,223줄. CEO 원본 2,668줄. 기능 15개 식별. 우리 calendar/ 디렉토리 15개 파일에 매핑.

### types.ts (신규, 126줄)

CalendarEvent 인터페이스 — 기존 필드 + CEO 추가분: supabaseId, source, depositConfirmed, reported, balanceConfirmed, registeredSource, moveOutLinkCompleted, externalCheckDone, doorPassword, refundBank/Account/Holder, deductionItems, meterElec/Gas, repairType/Done/Needed, cleaningDone/FeeExtra/Comment, vacantConfirmed, ownerReported, ownerReportMsg. DeductionItem, ExternalCheckModalState, DirectInputModalState 타입.

### calendarApi.ts (신규, 86줄)

Supabase CRUD feature flag 래퍼. USE_API=true → no-op (TanStack mutation에서 처리). USE_API=false → insertCalendarEvent/updateCalendarEvent/deleteCalendarEvent/uploadPhotos 호출. persistInsert, persistUpdate, persistDelete, persistUploadPhotos 4개 함수.

### DirectInputModal.tsx (신규, ~110줄)

퇴실정보 직접입력 모달. 비밀번호 + 환불계좌(은행 드롭다운 22개) + 계좌번호 + 예금주. prefill 모드(자동저장값 수정) vs 신규 입력. 예금주 ≠ 계약자 이름 불일치 경고. persistUpdate 호출.

### ExternalCheckModal.tsx (신규, ~280줄)

퇴실체크 모달 4섹션. 사진비교: 입주사진(참조) + 퇴실사진 업로드(PhotoDropZone + persistUploadPhotos). 공제항목: 동적 행 추가/삭제, 금액 + 사유. 계량기: 전기/가스 검침값. 이슈체크: 5개 체크리스트 + 기타 텍스트, 수리완료 토글. 완료 후 view-only 모드. persistUpdate 호출.

### 기존 컴포넌트 수정 (11개)

EventDetailModal.tsx — water → waterFee. save 시 persistUpdate, delete 시 persistDelete. externalCheckDone 삭제 가드.

SendMessageModal.tsx — water → waterFee.

ContractEventForm.tsx — water → waterFee 3곳. submit 시 persistInsert + supabaseId 설정.

MoveOutEventForm.tsx — submit 시 persistInsert + supabaseId 설정.

VacationEventForm.tsx — submit 시 persistInsert + supabaseId 설정.

CalendarGrid.tsx — drag-drop 시 persistUpdate(date 변경).

EventListView.tsx — delete 시 persistDelete. externalCheckDone 삭제 가드.

ContractStatusPanel.tsx — 계약금확인/잔금확인 시 persistUpdate. 계약서입력/계약파기 시 persistDelete.

MoveOutStatusPanel.tsx — 청소완료/공실전환 시 persistUpdate. 단기/일반 분기(getRoomType). 예금주 불일치 경고 배너.

PhotoModals.tsx — onAdd에 persistUploadPhotos + Supabase tenants 테이블 업데이트 + toast.success.

CalendarPage.tsx — 모달 렌더링(DirectInput + ExternalCheck). auto-cleanup에 persistDelete. saveEditEvent에 persistUpdate. allBuildings prop 추가 + BUILDING_NAMES useMemo에 합산.

CalendarWrapper.tsx — allBuildings={ctx.allBuildings} prop 전달 추가.

### 반영하지 않은 항목

props → Zustand store 전환 — wrapper + props 패턴 유지 (dual-mode 구조와 충돌).

useToast() 커스텀 훅 — sonner toast() 사용.

useMyBuildings() 직접 호출 — wrapper에서 props로 전달.

buildingFloors 제거 — fallback으로 유지.

---

## 산출물 요약

### 신규 파일

| 파일 | 역할 |
|------|------|
| src/pages/CompanySettingsPage.tsx | 회사 설정 페이지 |
| src/pages/MoveOutLinkPage.tsx | 퇴실 링크 페이지 |
| src/pages/BrokerPage.tsx | 중개 페이지 |
| src/pages/BuildingsPage.tsx | 건물 관리 페이지 |
| src/pages/PayrollPage.tsx | 급여 페이지 |
| src/pages/StaffPage.tsx | 직원 관리 페이지 |
| src/components/SearchInput.tsx | 한글 초성 검색 입력 |
| src/components/Toast.tsx | 커스텀 토스트 (호환용) |
| src/components/LoadingSpinner.tsx | 로딩 인디케이터 |
| src/components/Modal.tsx | 범용 모달 |
| src/components/PageErrorBoundary.tsx | 에러 바운더리 |
| src/components/BuildingFormSections.tsx | 건물 폼 섹션 |
| src/components/RoomFormSection.tsx | 호실 폼 섹션 |
| src/lib/supabase.ts | Supabase 클라이언트 |
| src/lib/supabaseData.ts | Supabase CRUD |
| src/lib/photoStorage.ts | Supabase Storage 사진 |
| src/hooks/useSupabaseQueries.ts | Supabase TanStack Query 훅 |
| src/hooks/useMyBuildings.ts | 담당 건물 필터 |
| src/stores/useAppStore.ts | 앱 전역 상태 |
| src/stores/useBuildingStore.ts | 건물 상태 |
| src/stores/useCalendarStore.ts | 캘린더 상태 |
| src/stores/useFinanceStore.ts | 재무 상태 |
| src/stores/usePendingStore.ts | 대기열 상태 |
| src/stores/useTenantStore.ts | 임차인 상태 |
| src/stores/useMigrations.ts | 마이그레이션 |
| src/stores/useSupabaseSync.ts | Supabase 동기화 |
| src/stores/migrate.ts | 데이터 마이그레이션 |
| src/stores/index.ts | 스토어 barrel export |
| src/utils/validation.ts | 필드 유효성 검사 |
| src/data/defaultFinanceData.ts | 초기 재무 데이터 |
| src/data/testData.ts | 테스트 데이터 |
| src/pages/calendar/types.ts | 캘린더 이벤트 타입 |
| src/pages/calendar/calendarApi.ts | Supabase CRUD feature flag 래퍼 |
| src/pages/calendar/components/DirectInputModal.tsx | 퇴실정보 직접입력 모달 |
| src/pages/calendar/components/ExternalCheckModal.tsx | 퇴실체크 모달 (4섹션) |

### 수정 파일

| 파일 | 변경 |
|------|------|
| src/config/roomType.ts | setBuildingTypeCache + getRoomType에 캐시 참조 추가 |
| src/config/index.ts | setBuildingTypeCache export 추가 |
| src/components/index.ts | 신규 컴포넌트 6개 export 추가 |
| src/pages/wrappers/BuildingsWrapper.tsx | CEO BuildingsPage 직접 렌더링 (임시) |
| src/pages/wrappers/CalendarWrapper.tsx | allBuildings prop 전달 추가 |
| src/pages/calendar/CalendarPage.tsx | 모달 렌더링 + Supabase + allBuildings |
| src/pages/calendar/components/EventDetailModal.tsx | waterFee + Supabase + 삭제 가드 |
| src/pages/calendar/components/SendMessageModal.tsx | waterFee |
| src/pages/calendar/components/ContractEventForm.tsx | waterFee + persistInsert |
| src/pages/calendar/components/MoveOutEventForm.tsx | persistInsert |
| src/pages/calendar/components/VacationEventForm.tsx | persistInsert |
| src/pages/calendar/components/CalendarGrid.tsx | drag-drop persistUpdate |
| src/pages/calendar/components/EventListView.tsx | persistDelete + 삭제 가드 |
| src/pages/calendar/components/ContractStatusPanel.tsx | persistUpdate + persistDelete |
| src/pages/calendar/components/MoveOutStatusPanel.tsx | persistUpdate + 단기/일반 분기 + 예금주 경고 |
| src/pages/calendar/components/PhotoModals.tsx | Supabase Storage + toast |
| src/pages/calendar/constants.ts | wobble 애니메이션 + waterFee |

---

## 검증

- TypeScript: 에러 0개
- Build: 성공

---

## 남은 작업

| 작업 | 상태 |
|------|------|
| Phase 2 Part 2 — TenantsPage 기능 통합 | ⬜ |
| Phase 2 Part 3 — AppLayout + 라우터 등록 | ⬜ |
| Phase 2 Part 4 — BuildingsWrapper 복구 + Store 이중 구조 정리 | ⬜ |
| Phase 3 — Supabase 격리 | ⬜ |
