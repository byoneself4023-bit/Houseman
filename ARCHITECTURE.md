# feature/ceo-integration 전체 구조

> 이 문서를 읽는 사람: "내일부터 기능을 추가할 개발자"
> 브랜치: feature/ceo-integration
> 분석일: 2026-03-31

---

## 1. 프로젝트 개요

| 항목 | 값 |
|------|-----|
| 총 파일 수 | 213개 (.tsx + .ts) |
| 총 줄 수 | 53,289줄 |
| 라우팅 | React Router v7 (`createBrowserRouter`) — URL 기반, 코드 스플리팅 |
| 상태관리 | useAppData 훅 (17개 useState + localStorage 동기화) + Zustand 8개 스토어 |
| 서버 상태 | TanStack Query 5 (USE_API=true일 때만 활성) |
| 데이터 소스 | localStorage (현재) / Supabase + Spring Boot API (feature flag로 전환) |
| 스타일 | Tailwind CSS 4 + shadcn/ui (~90%) + 인라인 스타일 (~10%) |
| 빌드 | Vite 6, TypeScript strict mode, 빌드 성공 확인됨 |

### 새 페이지 추가 시 건드릴 파일 (4개)

| 순서 | 파일 | 할 일 |
|------|------|-------|
| 1 | `src/config/navigation.ts` | `menuSections`에 메뉴 항목 추가 + `pageIdToPath`에 경로 매핑 추가 |
| 2 | `src/pages/wrappers/NewWrapper.tsx` | 새 wrapper 생성 — useAppContext()로 데이터 받아서 페이지에 props 전달 |
| 3 | `src/router.tsx` | React.lazy import 추가 + children 배열에 route 추가 |
| 4 | `src/pages/NewPage.tsx` | 실제 페이지 컴포넌트 작성 |

> 사이드바/모바일 네비는 `menuSections` 기반으로 자동 렌더링되므로 별도 수정 불필요.

---

## 2. 디렉토리 구조

```
src/
├── main.tsx                    # 앱 진입점 (QueryClientProvider + RouterProvider + Toaster)
├── router.tsx (179줄)          # 모든 라우트 정의 — React.lazy 코드 스플리팅
├── index.css                   # Tailwind 설정 + 디자인 토큰 (oklch)
│
├── types/                      # 도메인 타입 정의
│   ├── index.ts (448줄)        # Building, Tenant, Vacancy, CalendarEvent, Staff 등 30+ 인터페이스
│   └── appContext.ts (74줄)    # AppData 인터페이스 + useAppContext() 훅
│
├── layouts/                    # 앱 골격 (인증/레이아웃/네비게이션)
│   ├── AppLayout.tsx (78줄)    # 인증 체크 → AuthGate 또는 Sidebar+TopBar+Outlet
│   ├── RoleGuard.tsx (24줄)    # 역할별 접근 제어 (admin/owner/cleaning/homepage)
│   ├── AuthGate.tsx (194줄)    # 로그인 화면 (USE_API에 따라 JWT or 로컬 인증)
│   ├── Sidebar.tsx (231줄)     # 데스크톱 사이드바 — menuSections 기반 렌더링
│   ├── TopBar.tsx (97줄)       # 상단바 — 페이지 제목, 담당자 정보, 시계
│   └── MobileNav.tsx (104줄)   # 모바일 하단 탭 — 역할별 다른 메뉴
│
├── stores/ (8개 스토어)        # Zustand 상태 관리
│   ├── authStore.ts            # 인증 (loggedInId, role, JWT) — persist: 'hm_auth'
│   ├── uiStore.ts              # UI (sidebarOpen, settingsOpen) — 비영속
│   ├── useFinanceStore.ts      # 재무 데이터 — persist: 'hm-finance'
│   ├── useBuildingStore.ts     # 건물 데이터 — 비영속 (Supabase)
│   ├── useCalendarStore.ts     # 캘린더/공실 — 비영속 (Supabase)
│   ├── useTenantStore.ts       # 임차인 — 비영속 (Supabase)
│   ├── usePendingStore.ts      # 진행중 계약/퇴실 — 비영속
│   ├── useAppStore.ts          # 레거시 앱 상태 — 비영속
│   ├── useSupabaseSync.ts (698줄) # Supabase 실시간 동기화
│   ├── useMigrations.ts        # 레거시 localStorage 키 정리
│   └── migrate.ts              # 마이그레이션 유틸
│
├── hooks/                      # 커스텀 훅
│   ├── useAppData.ts (709줄)   # ★ 핵심: 17개 도메인 상태 + localStorage 동기화 + 마이그레이션
│   ├── useNavigateCompat.ts    # pageId → URL 네비게이션
│   ├── useCurrentPageId.ts     # 현재 URL → pageId 변환
│   ├── useApiOr.ts             # API 데이터 vs 로컬 데이터 선택
│   └── queries/ (11개)         # TanStack Query 훅 (USE_API=true일 때만)
│
├── pages/ (30개 페이지)        # 페이지 컴포넌트
│   ├── wrappers/ (28개)        # 데이터 주입 래퍼 — useAppContext() → 페이지 props
│   ├── calendar/               # 입퇴실 일정 (CalendarPage + 15개 하위 컴포넌트)
│   ├── tenants/                # 임차인 관리 (TenantsPage + 7개 하위 컴포넌트)
│   ├── buildings/detail/       # 건물 상세 (BuildingDetailPage + 6개 하위 컴포넌트)
│   └── *.tsx                   # 나머지 독립 페이지
│
├── components/ (24개)          # 공유 컴포넌트
│   ├── ui/ (17개)              # shadcn/ui 프리미티브 (Button, Card, Dialog 등)
│   └── *.tsx                   # 비즈니스 컴포넌트 (Modal, Field, StatusBadge 등)
│
├── config/                     # 설정
│   ├── navigation.ts           # 메뉴 구조 + pageId↔path 매핑
│   ├── accountConfig.ts        # 청구 수납 계좌 흐름 설정
│   ├── staff.ts                # 테스트 직원 데이터
│   └── roomType.ts             # 호실 유형 관리
│
├── data/ (18개)                # 정적/초기 데이터
│   ├── tenants.ts (9,587줄)    # 전체 임차인 샘플 데이터
│   ├── billingConfig.ts (4,612줄) # 호실별 공과금 설정
│   ├── billingMaster.ts (1,077줄) # 전기/가스 계량기 매핑 + 정산 마스터
│   ├── buildingFloors.ts       # 건물 층/호 구조
│   └── roomMasterData.ts       # 호실 마스터 (보증금, 임대료 등)
│
├── lib/                        # 인프라 유틸
│   ├── supabaseData.ts (1,095줄) # ★ Supabase CRUD 전체 — 필드 매핑 + 변환
│   ├── supabase.ts             # Supabase 클라이언트 초기화
│   ├── api.ts                  # HTTP 클라이언트 (JWT Bearer)
│   ├── featureFlag.ts          # USE_API 플래그 (39개 파일에서 import)
│   ├── queryClient.ts          # React Query 클라이언트
│   └── utils.ts                # cn() 등
│
└── utils/                      # 유틸리티
    ├── helpers.ts              # getStaffBuildings(), fmt(), feeLabel()
    ├── koreanSearch.ts         # 초성 검색 (matchKorean)
    ├── validation.ts           # 전화번호, 사업자번호 등 검증
    ├── useLocalStorage.ts      # localStorage 동기화 훅
    └── useIsMobile.ts          # 반응형 브레이크포인트 (768px)
```

---

## 3. 데이터 흐름

### 3-1. 전체 흐름도

```
┌─────────────────────────────────────────────────────────┐
│ localStorage (appData 키)                                │
│  17개 hm_* 서브키로 도메인 데이터 저장                    │
└───────────────────────┬─────────────────────────────────┘
                        ↕ (읽기/쓰기)
┌───────────────────────┴─────────────────────────────────┐
│ useAppData() 훅 — src/hooks/useAppData.ts               │
│  17개 useState ←→ localStorage 양방향 동기화             │
│  + 5개 마이그레이션 useEffect                            │
│  + 3개 헬퍼 함수 (addBilling, addDeposit, addCashbook)   │
│  + 4개 파생값 (currentStaff, myBuildings, menuBadges 등) │
└───────────────────────┬─────────────────────────────────┘
                        ↓ (AppData 객체로 전달)
┌───────────────────────┴─────────────────────────────────┐
│ AppLayout — src/layouts/AppLayout.tsx                     │
│  useAppData() 호출 → <Outlet context={appData}> 로 전달  │
└───────────────────────┬─────────────────────────────────┘
                        ↓ (outlet context)
┌───────────────────────┴─────────────────────────────────┐
│ Wrapper — src/pages/wrappers/*.tsx                        │
│  useAppContext()로 AppData 수신                           │
│  + useQuery 훅으로 API 데이터 fetch (USE_API=true 시)    │
│  + useApiOr()로 데이터 소스 선택                          │
│  → 페이지에 필요한 props만 골라서 전달                    │
└───────────────────────┬─────────────────────────────────┘
                        ↓ (props)
┌───────────────────────┴─────────────────────────────────┐
│ Page — src/pages/*.tsx                                    │
│  props로 데이터 수신 → UI 렌더링                          │
│  사용자 액션 → setter 호출 → useAppData에서 localStorage  │
│                         → persistXxx() → Supabase 동기화  │
└─────────────────────────────────────────────────────────┘
```

### 3-2. state → 페이지 매핑표

> "이 state를 바꾸면 어떤 페이지가 영향받는가?"

| state (useAppData) | localStorage 키 | 사용하는 wrapper (→ page) |
|---|---|---|
| `activeTenants` | hm_activeTenants | Calendar, Tenants, Buildings, BuildingDetail, Collection, Settlement, PastTenants, Renewal, Owner, Parking, ProfitDashboard, TaskDriver, Transaction, RouteSchedule, DataUpload, Vacancy, Homepage |
| `calendarEvts` | hm_calendarEvts | Calendar, Broker, Vacancy, Homepage, TaskDriver, Tenants |
| `activeVacancies` | hm_activeVacancies | Calendar, Vacancy, Buildings, BuildingDetail, Owner, ProfitDashboard, TaskDriver, DataUpload |
| `billingHistory` | hm_billingHistory | BillingFixed, BillingVariable, BillingUnified, Collection, Settlement, TaskDriver, Tenants |
| `roomBalances` | hm_roomBalances | BillingFixed, BillingVariable, BillingUnified, Collection, Settlement, TaskDriver, Tenants, Transaction |
| `buildingData` | hm_buildingData | Calendar, Buildings, BuildingDetail, Collection, Settlement, Patrol, ProfitDashboard, TaskDriver, RouteSchedule, Homepage, Vacancy, Tenants, DataUpload |
| `pastTenantsData` | hm_pastTenantsData | Calendar, Tenants, PastTenants, BuildingDetail, Settlement, TaskDriver, Vacancy |
| `buildingAccounts` | hm_buildingAccounts | BuildingDetail, Tenants, Collection |
| `parkingInfo` | hm_parkingInfo | Parking, Tenants |
| `transactions` | hm_transactions | Transaction, Settlement |
| `billingConfirmed` | hm_billingConfirmed | BillingFixed, BillingVariable, BillingUnified |
| `billingSent` | hm_billingSent | BillingFixed, BillingVariable, BillingUnified |
| `lateFeeOverrides` | hm_lateFeeOverrides | Collection, Tenants |
| `settlementExpenses` | hm_settlementExpenses | Settlement, ProfitDashboard, TaskDriver |
| `cashbookEntries` | hm_cashbookEntries | CashBook, Settlement |
| `allBuildings` | hm_allBuildings | Buildings, BuildingDetail, DataUpload, Tenants, ProfitDashboard, Collection |
| `customBuildings` | hm_customBuildings | Buildings, BuildingDetail, DataUpload |

### 3-3. 핵심 질문 답변: "임차인 데이터는 어디서 생성되고 어디로 흐르는가?"

```
생성:
  1. 정적 데이터: src/data/tenants.ts (초기 샘플 100+건)
  2. 사용자 입력: CalendarPage 계약 이벤트 → "계약완료" 처리 시 activeTenants에 추가
  3. DataUploadPage: 엑셀 업로드로 일괄 등록

흐름:
  useAppData().activeTenants (useState + hm_activeTenants localStorage)
    → AppLayout outlet context
      → TenantsWrapper → TenantsPage (목록/상세/퇴실)
      → CalendarWrapper → CalendarPage (계약현황 패널)
      → CollectionWrapper → CollectionPage (수금 대상)
      → SettlementWrapper → SettlementPage (정산 계산 입력)
      → ... (총 17개 페이지)

수정:
  setActiveTenants()로 상태 변경 → useEffect가 localStorage 동기화
  persistUpdateTenant()로 Supabase 동기화 (USE_API=false일 때)
```

### 3-4. 핵심 질문 답변: "캘린더 이벤트를 수정하면 어떤 페이지가 영향받는가?"

```
calendarEvts 수정 시 영향받는 페이지 (6개):
  1. CalendarPage — 캘린더 그리드 + 이벤트 목록 + 계약/퇴실 현황 패널
  2. BrokerPage — 부동산에 공유할 계약 이벤트 필터
  3. VacancyPage — 공실 상태 판단 (계약 이벤트 존재 여부)
  4. HomepagePage — 홈페이지에 노출할 이벤트
  5. TaskDriverPage — 오늘 할 일 생성 (미완료 이벤트 기반)
  6. TenantsPage — 퇴실 처리 시 이벤트 플래그 참조

특히 위험한 수정:
  - type 필드 변경 → 모든 필터/분기가 '계약'|'퇴실'|'휴무' 리터럴에 의존
  - supabaseId 변경 → persist 함수가 이 ID로 Supabase 업데이트
  - 워크플로우 플래그 (depositConfirmed, settled 등) → MoveOutStatusPanel/ContractStatusPanel 분기
```

---

## 4. 페이지 목록 (30개)

| # | 페이지 | 파일 경로 | 줄수 | 주요 기능 | wrapper가 전달하는 핵심 props |
|---|--------|----------|------|----------|-----|
| 1 | 입퇴실일정 | pages/calendar/CalendarPage.tsx | 373 | 캘린더 그리드, 계약/퇴실 등록, 퇴실 워크플로우 | events, activeTenants, activeVacancies, setEvents |
| 2 | 임차인정보 | pages/tenants/TenantsPage.tsx | 817 | 임차인 목록/상세/수정, 퇴실 정산, 사진 | activeTenants, calendarEvts, billingHistory, roomBalances |
| 3 | 건물목록 | pages/BuildingsPage.tsx | 1064 | 건물 목록, 신규 건물 등록 (170+ 입력 필드) | allBuildings, buildingData, activeTenants |
| 4 | 건물상세 | pages/buildings/detail/BuildingDetailPage.tsx | 375 | 건물 설정, 호실 관리, 담당자/업체 | buildingData, activeTenants, activeVacancies |
| 5 | 공실관리 | pages/VacancyPage.tsx | 501 | 공실 상태 관리, 인쇄, 임차인 연결 | activeVacancies, calendarEvts, activeTenants |
| 6 | 청구관리 | pages/UtilityBillingPage.tsx | 1235 | 수도/전기/가스 청구서 생성, 확정, 발송 | activeTenants, billingConfirmed, roomBalances |
| 7 | 수금관리 | pages/CollectionPage.tsx | 554 | 연체 현황, 독촉, 입금 확인 | activeTenants, roomBalances, lateFeeOverrides |
| 8 | 입출금관리 | pages/TransactionPage.tsx | 609 | 입출금 내역, 예금주 매칭, 은행다 연동 | transactions, activeTenants, roomBalances |
| 9 | 정산 | pages/SettlementPage.tsx | 927 | 건물주 정산서 생성, 비용 관리, 인쇄 | activeTenants, transactions, settlementExpenses |
| 10 | 출납관리 | pages/CashBookPage.tsx | 375 | 현금출납부 관리 | cashbookEntries, buildingData |
| 11 | 재계약 | pages/RenewalPage.tsx | 529 | 만료 임박 계약 관리, 갱신 처리 | activeTenants |
| 12 | 퇴실정보 | pages/PastTenantsPage.tsx | 653 | 과거 임차인 이력 조회, 정산 내역 | pastTenantsData, activeTenants |
| 13 | AS관리 | pages/ASPage.tsx | 832 | 수리/점검 요청, 업체 관리, 승인 | myBuildings |
| 14 | 순회관리 | pages/PatrolPage.tsx | 570 | 건물 순회 일정/기록, 체크리스트, 사진 | myBuildings, buildingData |
| 15 | 주차관리 | pages/ParkingPage.tsx | 332 | 주차 배정, 차량 등록 | activeTenants, parkingInfo |
| 16 | 부동산 | pages/BrokerPage.tsx | 164 | 부동산 정보 관리, 이벤트 공유 | calendarEvts |
| 17 | 담당자 | pages/StaffPage.tsx | 171 | 직원 목록/등록/수정 | (없음) |
| 18 | 급여 | pages/PayrollPage.tsx | 262 | 직원 급여 기록 | (없음) |
| 19 | 오늘할일 | pages/TaskDriverPage.tsx | 747 | 미완료 작업 자동 감지, 우선순위 정렬 | activeTenants, calendarEvts, activeVacancies, buildingData |
| 20 | 수익대시보드 | pages/ProfitDashboardPage.tsx | 684 | 건물별 수익/지출 분석 | activeTenants, activeVacancies, settlementExpenses |
| 21 | 동선제안 | pages/RouteSchedulePage.tsx | 1041 | 건물 방문 경로 최적화, 지도 | myBuildings, buildingData, activeTenants |
| 22 | 데이터업로드 | pages/DataUploadPage.tsx | 928 | 엑셀 일괄 업로드, 데이터 초기화 | allBuildings, activeTenants, activeVacancies |
| 23 | 홈페이지 | pages/HomepagePage.tsx | 1225 | 공개 홈페이지 (공실 매물, 건물 소개) | buildingData, activeVacancies, calendarEvts |
| 24 | 홈페이지편집 | pages/HomepageEditPage.tsx | 144 | 홈페이지 콘텐츠 편집 | (없음) |
| 25 | 건물주대시보드 | pages/OwnerDashboard.tsx | 457 | 건물주용 요약 화면 | activeTenants, activeVacancies |
| 26 | 회사설정 | pages/CompanySettingsPage.tsx | 331 | 회사 기본 정보 설정 | (없음) |
| 27 | 퇴실링크 | pages/MoveOutLinkPage.tsx | 201 | 임차인이 직접 작성하는 퇴실 폼 (공개, 인증 불필요) | — |
| 28 | 공개홈페이지 | (HomepagePage, /homepage-public) | — | ?mode=homepage로 접근하는 공개 버전 | — |
| 29 | 청구(고정) | (UtilityBillingPage, /billing/fixed) | — | billingMode="fixed" | — |
| 30 | 청구(변동) | (UtilityBillingPage, /billing/variable) | — | billingMode="variable" | — |

---

## 5. 기능 맵 (주요 페이지별 핸들러)

### CalendarPage (373줄) + 하위 컴포넌트 15개

핵심 역할: 입퇴실 일정 관리의 허브. 계약 등록 → 진행 관리 → 퇴실 완료까지 전체 워크플로우.

| 함수/컴포넌트 | 역할 |
|---|---|
| ContractStatusPanel | 계약 진행 현황 (보증금확인→신고→잔금) — depositConfirmed, reported, balanceConfirmed 플래그 |
| MoveOutStatusPanel | 퇴실 워크플로우 (링크발송→외부점검→청소→공실확인→정산→건물주보고) — 6단계 플래그 |
| ContractEventForm | 계약 이벤트 등록 모달 — 건물/호실 자동완성, 보증금/임대료 입력 |
| MoveOutEventForm | 퇴실 이벤트 등록 모달 |
| EventDetailModal | 이벤트 수정/삭제 |
| SendLinkModal | 임차인에게 퇴실 링크 발송 |
| DirectInputModal | 퇴실 정보 직접 입력 (링크 대신) |
| ExternalCheckModal | 외부 점검 데이터 입력 (하자, 공제, 계량기) |
| PhotoModals | 입퇴실 사진 업로드/비교 (4종: Photo, CheckPhoto, Zoom, Compare) |
| OwnerReportModals | 건물주 보고서 (계약, 퇴실, 파손) |

### TenantsPage (817줄) + 하위 컴포넌트 7개

핵심 역할: 임차인 상세 관리. 정보 수정, 청구 현황, 퇴실 정산 처리.

| 컴포넌트 | 역할 |
|---|---|
| TenantSearchBar | 한국어 초성 검색 지원 |
| TenantList | 임차인 목록 (필터: 건물, 유형, 상태) |
| TenantDetail (519줄) | 임차인 상세 — 연락처, 계약, 청구, 주차 |
| TenantContractCard | 계약 상세 정보 카드 |
| TenantBillingCard | 청구/잔액 현황 카드 |
| MoveOutModal (775줄) | ★ 퇴실 정산 모달 — 30+ 입력 필드 (공과금, 공제, 환불 등) |
| MoveOutModal.doAction | 퇴실 확정 → activeTenants에서 제거 + pastTenantsData에 추가 + activeVacancies에 공실 등록 |

### SettlementPage (927줄)

핵심 역할: 건물주 정산서 계산 및 생성.

| 주요 로직 | 설명 |
|---|---|
| settlementMaster 참조 | data/billingMaster.ts의 건물별 정산 설정 (유형A/S/F/D/X) |
| 수수료 계산 | 임대수입 × feeRate% (또는 정액/급여형) |
| VAT 분리 | 일부 건물 supply/tax 분리 (÷1.1) |
| 비용 차감 | settlementExpenses에서 해당 건물 비용 집계 |
| 기간 산출 | getSettlementPeriod()로 정산 시작/종료일 |
| PDF 인쇄 | SettlementPrintView.tsx로 인쇄용 렌더링 |

---

## 6. 데이터 구조

### 6-1. localStorage 키 (21개)

| # | 키 | 저장 주체 | 용도 |
|---|-----|----------|------|
| 1 | `appData` | useAppData.ts | 17개 hm_* 서브키를 감싸는 최상위 JSON blob |
| 2 | `hm_activeTenants` | appData 내부 | 현재 임차인 배열 |
| 3 | `hm_calendarEvts` | appData 내부 | 캘린더 이벤트 배열 |
| 4 | `hm_activeVacancies` | appData 내부 | 공실 배열 |
| 5 | `hm_billingHistory` | appData 내부 | 청구 이력 배열 |
| 6 | `hm_roomBalances` | appData 내부 | 호실별 잔액 (key: "건물_호실") |
| 7 | `hm_buildingData` | appData 내부 | 건물 메타데이터 (주소, 담당자 등) |
| 8 | `hm_buildingAccounts` | appData 내부 | 건물별 계좌 정보 |
| 9 | `hm_pastTenantsData` | appData 내부 | 퇴실 임차인 이력 (key: "건물_호실") |
| 10 | `hm_transactions` | appData 내부 | 입출금 내역 배열 |
| 11 | `hm_billingConfirmed` | appData 내부 | 청구 확정 상태 |
| 12 | `hm_billingSent` | appData 내부 | 청구 발송 상태 |
| 13 | `hm_parkingInfo` | appData 내부 | 주차 정보 |
| 14 | `hm_lateFeeOverrides` | appData 내부 | 연체료 예외 설정 |
| 15 | `hm_settlementExpenses` | appData 내부 | 정산 비용 배열 |
| 16 | `hm_cashbookEntries` | appData 내부 | 출납 항목 배열 |
| 17 | `hm_customBuildings` | appData 내부 | 사용자 추가 건물 |
| 18 | `hm_allBuildings` | appData 내부 | 전체 건물 목록 |
| 19 | `hm_auth` | Zustand persist | 인증 정보 (loggedInId, role, JWT) |
| 20 | `hm-finance` | Zustand persist | 재무 데이터 (useFinanceStore) |
| 21 | `hm_routeSchedule` | RouteSchedulePage 직접 | 동선 일정 데이터 |

> 삭제 대상 레거시 키 (useMigrations.ts에서 정리): hm_buildingFloors_override, hm_roomMasterData_override, hm_editValues, hm_electricCut

### 6-2. 주요 객체 필드

#### Tenant (임차인)
```typescript
{
  id: number;              // 고유 ID
  name: string;            // 이름
  building: string;        // 건물명
  room: string;            // 호실
  phone: string;           // 연락처
  rent: number;            // 월 임대료
  mgmt: number;            // 관리비
  deposit: number;         // 보증금
  type: '단기' | '일반임대' | '근생' | '관리사무소';
  due: string;             // 납부일
  status: '정상' | '연체';
  overdue: number;         // 연체 금액
  moveIn: string;          // 입주일 (YYYY-MM-DD)
  expiry: string;          // 만료일
  prevUnpaid: number;      // 전월 미납
  currentUnpaid: number;   // 당월 미납
  overdueDays: number;     // 연체 일수
  carNumber?: string;      // 차량번호
  carType?: string;        // 차량유형
}
```

#### CalendarEvent (캘린더 이벤트) — src/pages/calendar/types.ts
```typescript
{
  // 공통
  type: '계약' | '퇴실' | '휴무';
  date: string;
  supabaseId?: string;
  source?: 'supabase' | 'local';
  isCompleted?: boolean;

  // 계약 전용
  building, room, name, deposit, rent, mgmt, broker, brokerPhone,
  moveIn, expiry, contractDate, registeredSource,
  depositConfirmed?: boolean;    // 보증금 확인됨
  reported?: boolean;            // 전입신고됨
  balanceConfirmed?: boolean;    // 잔금 확인됨

  // 퇴실 전용
  moveOutLinkCompleted?: boolean;  // 임차인이 퇴실링크 작성 완료
  externalCheckDone?: boolean;     // 외부 점검 완료
  cleaningDone?: boolean;          // 청소 완료
  vacantConfirmed?: boolean;       // 공실 확인
  ownerReported?: boolean;         // 건물주 보고 완료
  settled?: boolean;               // 최종 정산 완료
  repairDone?: boolean;            // 수리 완료
  repairNeeded?: boolean;          // 수리 필요
  deductionItems?: {label, amount}[];  // 공제 항목
  refundBank, refundAccount, refundHolder,
  meterElec, meterGas,
  moveOutPhotos?, moveOutCheckPhotos?, moveInCheckPhotos?
}
```

#### Vacancy (공실)
```typescript
{
  building, room, type, status,
  commBroker: number;    // 중개수수료
  commEvent: string;     // 수수료 이벤트
  pw: string;            // 현관 비밀번호
  deposit, rent, nego, mgmt: number;
  water, cable: string;
  exitFee: number;       // 퇴실 청소비
  days: number;          // 공실 일수
}
```

#### SettlementMasterEntry (건물별 정산 설정)
```typescript
{
  type: 'A'|'S'|'F'|'D'|'X';  // 정산 유형
  feeType: 'pct'|'salary'|'fixed'|'collection'|'none'|'hybrid';
  feeRate: number;              // 수수료율 (%)
  direction: 'hm_to_owner'|'owner_to_hm'|'none';
  settlementDay: number|'말일'; // 정산일
  vat: boolean;                 // 부가세 적용
  // ... 20+ 추가 필드 (hybridRules, subItems 등)
}
```

---

## 7. 모달 목록 (주요 65개 state)

### CalendarPage 모달 (12개)
| state | 역할 |
|---|---|
| showForm + formType | 계약/퇴실/휴무 등록 폼 토글 |
| editEvent | 이벤트 수정 모달 |
| photoModalTenant | 입주 사진 모달 |
| checkPhotoModalTenant | 퇴실 점검 사진 |
| zoomPhoto | 사진 확대 |
| compareData | Before/After 비교 |
| moveOutMsgModal | 퇴실 메시지 |
| externalCheckModal | 외부 점검 입력 |
| directInputModal | 직접 입력 |
| sendLinkModal | 링크 발송 |
| contractReport / moveOutOwnerReport / breakReport | 건물주 보고서 |

### TenantsPage 모달 (8개)
| state | 역할 |
|---|---|
| actionMode="moveout" | MoveOutModal 열림 |
| showContractHistory | 계약 이력 |
| showMoveoutDoneModal | 퇴실 완료 확인 |
| photoModalTenant | 사진 모달 |
| billingPopup | 청구 정보 팝업 |

### BuildingsPage / BuildingDetailPage 모달 (10개)
| state | 역할 |
|---|---|
| showPreview | 건물 등록 미리보기 |
| showAddRoom | 호실 추가 |
| showDetailPreview | 건물 유형 편집기 |
| sec1~6Open, secAcctOpen | 섹션 접기/펼치기 |

### 기타 페이지 모달
- VacancyPage: showPrint, reportModal, linkModal, showHelp, confirmPromo
- ASPage: showNewForm, showVendorMgmt, showStatusModal, showApprovalForm
- TransactionPage: showForm, showBankda, showDepositNames
- SettlementPage: showForm
- PatrolPage: showNewForm
- PayrollPage: showAddStaff
- BrokerPage: showAdd
- StaffPage: showAdd
- CashBookPage: showAddForm

---

## 8. 워크플로우 상태 플래그 (14개)

CalendarEvent의 boolean 플래그가 퇴실/계약 워크플로우의 진행 상태를 제어함.

### 계약 워크플로우 (3단계)
| # | 플래그 | 의미 | 설정 위치 | 읽기 위치 |
|---|--------|------|----------|----------|
| 1 | `depositConfirmed` | 보증금 입금 확인 | ContractStatusPanel | ContractStatusPanel, TaskDriverPage |
| 2 | `reported` | 전입 신고 완료 | ContractStatusPanel | ContractStatusPanel, TaskDriverPage |
| 3 | `balanceConfirmed` | 잔금 확인 | ContractStatusPanel | ContractStatusPanel, TaskDriverPage |

### 퇴실 워크플로우 (8단계)
| # | 플래그 | 의미 | 설정 위치 | 읽기 위치 |
|---|--------|------|----------|----------|
| 4 | `moveOutLinkCompleted` | 임차인 퇴실링크 작성 완료 | MoveOutLinkPage, DirectInputModal | MoveOutStatusPanel, TaskDriverPage |
| 5 | `externalCheckDone` | 외부 점검 완료 | ExternalCheckModal | MoveOutStatusPanel, TaskDriverPage |
| 6 | `repairNeeded` | 수리 필요 여부 | ExternalCheckModal | MoveOutStatusPanel |
| 7 | `repairDone` | 수리 완료 | MoveOutStatusPanel | MoveOutStatusPanel |
| 8 | `cleaningDone` | 청소 완료 | MoveOutStatusPanel | MoveOutStatusPanel, TaskDriverPage |
| 9 | `vacantConfirmed` | 공실 확인 (열쇠 회수) | MoveOutStatusPanel | MoveOutStatusPanel, TaskDriverPage |
| 10 | `ownerReported` | 건물주 보고 완료 | OwnerReportModals | MoveOutStatusPanel, TaskDriverPage |
| 11 | `settled` | 최종 정산 완료 | MoveOutStatusPanel | MoveOutStatusPanel, TaskDriverPage |

### 공통 플래그
| # | 플래그 | 의미 |
|---|--------|------|
| 12 | `isCompleted` | 이벤트 완전 종료 (자동 정리 대상) |
| 13 | `applyNego` | 네고 가격 적용 여부 (계약) |
| 14 | `_holderMismatch` | 환불 계좌 명의 불일치 경고 |

---

## 9. persist 연동 (Supabase)

### 9-1. 아키텍처

```
페이지 → setXxx() (로컬 상태 변경)
     → persistXxx() (Supabase 동기화, 비동기)

USE_API=false: persistXxx()가 직접 Supabase 호출
USE_API=true:  persistXxx() 대신 API 호출 (TanStack Query mutation)
```

### 9-2. persist 함수 목록

| 파일 | 함수 | 역할 |
|------|------|------|
| **calendarApi.ts** | `persistInsert(evt)` | 캘린더 이벤트 생성 |
| | `persistUpdate(supabaseId, patch)` | 이벤트 부분 업데이트 |
| | `persistDelete(supabaseId)` | 이벤트 삭제 |
| | `persistUploadPhotos(dataUrls, building, room, type)` | Supabase Storage 사진 업로드 |
| | `persistDeletePhoto(publicUrl)` | 사진 삭제 |
| **tenantsApi.ts** | `persistUpdateTenant(supabaseId, patch)` | 임차인 정보 업데이트 |
| | `persistDeactivateTenant(supabaseId, moveOutDate)` | 퇴실 처리 (is_active=false) |
| | `persistInsertTenant(tenant)` | 신규 임차인 등록 |
| **buildingDetailApi.ts** | `persistBuildingPatch(supabaseId, name, patch)` | 건물 정보 업데이트 |
| | `persistDeleteBuilding(supabaseId)` | 건물 삭제 (CASCADE) |
| | `persistFetchStaff(supabaseId)` | 건물 담당자 조회 |
| | `persistUpsertStaff(supabaseId, role, name, phone)` | 담당자 배정 |
| | `persistUpdateRoom(buildingName, roomNumber, patch)` | 호실 정보 업데이트 |
| **supabaseData.ts** | 32개 함수 | 건물/호실/임차인/캘린더 CRUD + 필드 매핑 + 변환 |

### 9-3. 호출 패턴

```typescript
// 예: 캘린더 이벤트 수정
const saveEditEvent = () => {
  // 1. 로컬 상태 변경 (즉시 UI 반영)
  setEvents(prev => prev.map(e =>
    e === editEvent.evt ? { ...e, ...editEvent.edits } : e
  ));

  // 2. Supabase 동기화 (비동기, fire-and-forget)
  if (editEvent.evt.supabaseId) {
    persistUpdate(editEvent.evt.supabaseId, editEvent.edits);
  }
};
```

---

## 10. 공유 컴포넌트 + config + data

### 공유 컴포넌트 (src/components/)

| 컴포넌트 | 역할 | 사용처 |
|---|---|---|
| Modal.tsx | 범용 모달 래퍼 (fixed + backdrop + ESC) | 거의 모든 페이지 |
| Field.tsx | 폼 필드 (label + children) + inputStyle 상수 | 모든 폼 |
| StatusBadge.tsx | 상태 뱃지 (정상/연체/계약/퇴실) | Tenants, Calendar, Collection |
| RoomTypeBadge.tsx | 호실유형 컬러 뱃지 (단기/일반/근생 등) | Buildings, Tenants, Calendar |
| SectionTitle.tsx | 페이지 섹션 헤더 | 모든 페이지 |
| PhotoDropZone.tsx | 사진 드래그앤드롭 업로드 | Calendar(사진), Patrol, AS |
| ContractDropZone.tsx | 계약서 PDF 업로드 | Tenants |
| BuildingFormSections.tsx (1,082줄) | 건물 등록 폼 (7개 섹션) | BuildingsPage |
| RoomFormSection.tsx (511줄) | 호실 입력 폼 | BuildingsPage |
| SettlementPrintView.tsx (582줄) | 정산서 인쇄 레이아웃 | SettlementPage |
| DunningTemplateSettings.tsx (465줄) | 독촉 메시지 템플릿 | CollectionPage |
| LoadingSkeleton.tsx | 로딩 스켈레톤 | USE_API=true 시 |
| EmptyState.tsx | 빈 상태 안내 | 데이터 0건 시 |
| ConfirmDialog.tsx | 삭제/퇴실 확인 다이얼로그 | 위험 액션 |
| PageErrorBoundary.tsx | 에러 경계 | 라우트 래핑 |
| ui/ (17개) | shadcn/ui 프리미티브 | 전역 |

### config

| 파일 | 역할 |
|------|------|
| navigation.ts | 메뉴 구조 (4섹션 23항목) + pageId↔path 매핑 (27개) |
| accountConfig.ts | 수납 계좌 흐름 설정 (단기/일반/근생/관리사무소별 모드) |
| staff.ts | 테스트 직원 8명 데이터 + 역할 정의 |
| roomType.ts | 호실 유형 캐싱 + 조회 |

### data (정적 데이터)

| 파일 | 줄수 | 역할 |
|------|------|------|
| tenants.ts | 9,587 | 임차인 샘플 데이터 100+건 |
| billingConfig.ts | 4,612 | 호실별 수도/전기/가스 설정 200+건 |
| billingMaster.ts | 1,077 | 전기 계량기 매핑(elecCustomerMap), 가스 코드(gasCodeMap), 건물별 정산 마스터(settlementMaster) |
| buildingFloors.ts | — | 건물별 층/호 구조 (27+ 건물) |
| roomMasterData.ts | — | 호실별 보증금/임대료/관리비/면적 |
| vacancies.ts | — | 초기 공실 데이터 |
| pastTenants.ts | 308 | 과거 임차인 이력 |
| buildings.ts | — | 초기 건물 목록 |
| calendar.ts | — | 초기 캘린더 이벤트 |

---

## 11. ★ 위험 지점 (수정 시 주의 필요)

| # | 파일 | 줄수 | 위험 이유 | 영향 범위 |
|---|------|------|----------|----------|
| 1 | **src/hooks/useAppData.ts** | 709 | 17개 도메인 상태의 원천. 여기서 state 이름이나 초기값을 바꾸면 전체 앱이 깨짐. 6개 마이그레이션 effect가 순서에 민감. | 모든 페이지 (28개 wrapper가 의존) |
| 2 | **src/lib/supabaseData.ts** | 1,095 | Supabase CRUD 전체. BUILDING_FIELD_MAP/TENANT_FIELD_MAP 필드 매핑이 틀리면 데이터 저장/조회 실패. | 모든 persist 함수, 모든 데이터 CRUD |
| 3 | **src/data/billingMaster.ts** | 1,077 | 정산 계산의 핵심. settlementMaster의 feeRate 하나 바꾸면 건물주 정산액이 틀어짐. elecCustomerMap 매핑이 틀리면 전기료가 잘못된 호실에 부과. | SettlementPage, UtilityBillingPage, CollectionPage |
| 4 | **src/data/billingConfig.ts** | 4,612 | 200+ 호실의 공과금 설정. 단가나 계량기 번호가 틀리면 청구서 금액 오류. | UtilityBillingPage |
| 5 | **src/data/tenants.ts** | 9,587 | 초기 임차인 데이터. useAppData 마이그레이션에서 참조. 필드 구조를 바꾸면 마이그레이션이 깨짐. | useAppData 초기화, 15+ 페이지 |
| 6 | **src/pages/tenants/components/MoveOutModal.tsx** | 775 | 퇴실 정산 핵심. doAction()에서 3개 동시 처리 (임차인제거 + 퇴실이력 + 공실등록). 하나라도 빠지면 데이터 무결성 깨짐. | TenantsPage, CalendarPage, VacancyPage |
| 7 | **src/types/index.ts** | 448 | 30+ 인터페이스 정의. 필드명 변경 시 전체 코드에 파급. | 전체 |
| 8 | **src/lib/featureFlag.ts** | 2 | 단 2줄이지만 39개 파일에서 import. USE_API 값이 앱 전체 동작 모드를 결정. | 전체 |
| 9 | **src/pages/calendar/types.ts** | 126 | CalendarEvent 확장 인터페이스. 14개 워크플로우 플래그 정의. 필드명 변경 시 퇴실 워크플로우 전체 깨짐. | CalendarPage + 모든 하위 컴포넌트, TaskDriverPage |
| 10 | **src/config/accountConfig.ts** | 123 | 수납 계좌 흐름 설정. modeOptions가 틀리면 돈이 잘못된 계좌로 안내됨. | BuildingsPage, BuildingDetailPage, CollectionPage |

### 수정 시 반드시 확인할 체크리스트

1. **useAppData.ts 수정 시**: state 추가/변경 후 AppData 인터페이스(appContext.ts)도 함께 수정. 모든 wrapper가 새 prop을 전달하는지 확인.
2. **billingMaster.ts 수정 시**: 기존 settlementMaster 엔트리의 숫자를 절대 바꾸지 않음. 추가만 가능.
3. **MoveOutModal 수정 시**: doAction() 내 3개 처리(임차인제거+퇴실이력+공실등록)가 모두 실행되는지 확인.
4. **CalendarEvent 플래그 수정 시**: MoveOutStatusPanel, ContractStatusPanel, TaskDriverPage 3곳의 조건 분기 확인.
5. **supabaseData.ts 필드 매핑 수정 시**: Supabase 테이블 컬럼명과 일치하는지 확인.

---

## 12. 빌드 상태

| 항목 | 상태 |
|------|------|
| `npm run build` | 성공 (2100 모듈, gzip 후 ~300KB) |
| `tsc --noEmit` | 통과 (strict mode) |
| Feature flag | `VITE_USE_API=false` (localStorage 모드) |

### 번들 크기
- vendor-react: 232KB → 76KB gzip
- index.js (메인): 337KB → 92KB gzip
- xlsx 라이브러리: 425KB → 141KB gzip

---

## 부록: 5가지 핵심 질문 요약 답변

### Q1. "임차인 데이터는 어디서 생성되고, 어떤 경로로 어떤 페이지까지 흘러가는가?"
**생성**: data/tenants.ts(초기), CalendarPage(계약완료), DataUploadPage(엑셀)
**경로**: useAppData.activeTenants → AppLayout context → 17개 wrapper → 17개 page
**수정**: setActiveTenants() + persistUpdateTenant()

### Q2. "캘린더 이벤트를 수정하면 다른 어떤 페이지가 영향을 받는가?"
CalendarPage, BrokerPage, VacancyPage, HomepagePage, TaskDriverPage, TenantsPage (6개)

### Q3. "새 페이지를 추가하려면 어떤 파일을 건드려야 하는가?"
1. config/navigation.ts (메뉴+경로), 2. wrappers/NewWrapper.tsx, 3. router.tsx (라우트), 4. pages/NewPage.tsx

### Q4. "정산 계산 로직은 어떤 파일에 있고, 어떤 데이터를 입력받아 어떤 결과를 내는가?"
**파일**: data/billingMaster.ts (settlementMaster, getSettlementPeriod, calcFee, calcVat, calcProRata)
**입력**: 건물명 → settlementMaster에서 유형/수수료율/VAT/정산일 조회 + activeTenants(임대수입) + settlementExpenses(비용)
**출력**: 정산서 (임대수입 - 수수료 - 비용 ± VAT = 건물주 지급액)

### Q5. "이 코드에서 가장 복잡하고 건드리면 위험한 파일은 무엇이고, 왜 위험한가?"
1. **useAppData.ts** — 전체 앱 상태의 원천 (17개 state + 6개 마이그레이션). 여기가 깨지면 모든 페이지 먹통.
2. **billingMaster.ts** — 돈 계산 로직. 숫자 하나 틀리면 건물주 정산액 오류 → 실제 금전 피해.
3. **MoveOutModal.tsx** — 퇴실 정산 3개 동시 처리. 하나라도 빠지면 데이터 불일치 (임차인은 삭제됐는데 공실은 안 생김).
