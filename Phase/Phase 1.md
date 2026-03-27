# Phase 1: FE 아키텍처 스켈레톤 — 실행 결과 분석

---

## 실행 환경

- Phase 0 완료 상태: TypeScript, ESLint, Prettier, Vitest 설정 완료. 도메인 타입 30+개 정의. 37개 파일 .ts/.tsx 전환 완료.
- 절대 원칙: pages/*.jsx 내부 로직 미변경 (import 경로 수정만 허용). 데이터 값 미변경. Zustand에 도메인 데이터 넣지 않음.

---

## 작업 내역

### Step 1: 패키지 설치

react-router-dom@^7, zustand@^5, @tanstack/react-query@^5 설치.

### Step 2: 스켈레톤 파일 생성

**src/lib/api.ts** — Phase 5 API 연결 대비 HTTP 클라이언트. 현재는 placeholder로 모든 메서드가 `throw new Error('API not enabled')`. JWT 토큰 자동 첨부, 401 처리, query string 변환 유틸 포함.

**src/lib/queryClient.ts** — TanStack Query 클라이언트. staleTime 5분, retry 1회, refetchOnWindowFocus false. Phase 5에서 API 연결 시 서버 상태 캐싱에 사용.

### Step 3: Zustand 스토어 (2개)

**src/stores/authStore.ts** — 로그인 상태 관리. `loggedInId`, `role`을 persist 미들웨어로 localStorage(`hm_auth` 키)에 저장. 페이지 새로고침/URL 직접 입력 시에도 로그인 상태 유지.

**src/stores/uiStore.ts** — UI 상태 관리. `sidebarOpen`, `settingsOpen`, `showMobileMore`, `roomTypeVer`. page와 selectedBuilding은 React Router URL에서 관리하므로 Zustand에 넣지 않음.

### Step 4: 타입 정의 + 네비게이션 훅 (3개)

**src/types/appContext.ts** — AppData 인터페이스 정의. 도메인 상태 17쌍(값+setter) + 임시 상태 2쌍 + 파생값(myBuildings, currentStaff, isGeneral, menuBadges) + 헬퍼 함수 3개 + navigateTo 포함.

**src/hooks/useNavigateCompat.ts** — 기존 `setPage("tenants")` 호출을 React Router `navigate("/tenants")`로 변환하는 호환 레이어. 25개 page ID → URL 경로 매핑. `contracts → /vacancies` 같은 ID≠경로 케이스 포함.

**src/hooks/useCurrentPageId.ts** — URL 경로 → page ID 역매핑. `/buildings/:name → 'buildings'` 특수 처리. Sidebar active 상태 판별용.

### Step 5: useAppData 훅 (핵심, ~250줄)

App.jsx에서 도메인 상태 전체를 추출한 커스텀 훅:

- localStorage 헬퍼 (loadAppData, saveAppData, _appCache)
- 도메인 useState 17개 (roomBalances, billingHistory, transactions, activeTenants, activeVacancies, pastTenantsData 등)
- localStorage sync useEffect 17개
- 마이그레이션 useEffect 5개 (moveIn 필드, pastTenants 병합, buildingFloors 건물 추가, 미노출 임차인/공실 정리, buildingData 기본값)
- 임시 상태 2개 (pendingContract, pendingMoveout)
- 헬퍼 함수 3개 (addBilling, addCashbookEntry, addDeposit)
- 파생값 (currentStaff, isGeneral, myBuildings, menuBadges)

AppLayout이 이 훅을 호출하고 Outlet context로 모든 페이지에 전달.

### Step 6: 레이아웃 컴포넌트 (4개)

**src/layouts/AuthGate.tsx (~80줄)** — App.jsx의 로그인 폼 추출. 테스트 계정 그리드 포함. 로그인 성공 시 authStore.setLoggedInId() 호출. 기존 인라인 스타일 100% 유지.

**src/layouts/Sidebar.tsx (~150줄)** — 데스크톱 사이드바. navigation.ts의 메뉴 구조 사용. 역할별 메뉴 필터링. useCurrentPageId()로 active 메뉴 판별. useNavigateCompat()로 페이지 이동. 역할 탭 클릭 시 setRole + navigateTo 동시 호출.

**src/layouts/TopBar.tsx (~60줄)** — 상단 바. 시간 표시(로컬 state), 사용자 정보, 역할 표시, Staff Filter Banner(비총괄 직원용).

**src/layouts/MobileNav.tsx (~80줄)** — 모바일 바텀탭 + 더보기 메뉴. useIsMobile() 훅 활용.

### Step 7: AppLayout + RoleGuard

**src/layouts/RoleGuard.tsx (~25줄)** — 역할별 접근 제어. owner → /owner만 허용, cleaning → /calendar|/patrol만 허용, homepage → /homepage만 허용. admin은 제한 없음. Outlet context를 자식에게 전달.

**src/layouts/AppLayout.tsx (~130줄)** — 전체 레이아웃 셸. loggedInId null 체크 → AuthGate 표시. useAppData() 호출 → Outlet context 조립. Sidebar + TopBar + Outlet + MobileNav 조합. pathname을 key로 fadeIn 애니메이션 유지.

### Step 8: 페이지 래퍼 (27개)

src/pages/wrappers/ 디렉토리에 각 페이지별 thin wrapper 컴포넌트 생성. useAppContext()에서 해당 페이지에 필요한 props만 추출하여 기존 page에 전달.

- TenantsWrapper: 16 props (가장 많음)
- SettlementWrapper: 10 props
- VacancyWrapper: 10 props + setPage 호환
- CalendarWrapper: setPage → navigateTo 호환
- BuildingsWrapper: onSelectBuilding → navigate(`/buildings/${name}`)
- BuildingDetailWrapper: useParams로 건물명 추출, onBack → navigate('/buildings')
- StaffWrapper, BrokerWrapper, PayrollWrapper, HomepageEditWrapper: 0 props

### Step 9: router.tsx + main.tsx

**src/router.tsx (~80줄)** — createBrowserRouter로 25개 경로 정의. AppLayout → RoleGuard → 각 페이지 래퍼 구조. SettlementWrapper만 eager import, 나머지 전부 React.lazy(). /homepage-public은 레이아웃 밖 독립 경로.

**src/main.tsx (~25줄)** — ?mode=homepage → /homepage-public redirect. QueryClientProvider + RouterProvider 래핑.

**index.html** — main.jsx → main.tsx 참조 변경.

---

## 발생 문제 및 해결 (4건)

### 1. TypeScript 에러: wrapper에서 JSX 페이지 props 타입 불일치

pages/*.jsx가 타입 선언이 없어서 props가 `never[]`로 추론됨. 20개 wrapper + router.tsx에서 에러.

**해결:** 페이지 import에 `as React.ComponentType<any>` 캐스팅 적용. Phase 5에서 pages를 .tsx로 전환할 때 제거될 임시 조치.

### 2. RoleGuard Outlet context 미전달

AppLayout → RoleGuard → CalendarWrapper 체인에서 RoleGuard가 `<Outlet />`만 렌더링하고 context를 전달하지 않아, 모든 wrapper의 `useOutletContext()`가 undefined 반환.

**해결:** RoleGuard에 `useOutletContext()` + `<Outlet context={ctx} />` 3줄 추가. 1파일 수정으로 27개 페이지 전부 해결.

### 3. 로그인 상태 유지 안 됨

authStore에 persist 미들웨어가 빠져있어서 페이지 새로고침/URL 직접 입력 시 loggedInId가 null로 초기화 → AuthGate 표시.

**해결:** authStore에 Zustand persist 미들웨어 추가. `name: 'hm_auth'`, partialize로 loggedInId + role만 localStorage에 저장. 새로고침/URL 입력 시에도 로그인 상태 유지.

### 4. 사이드바 "관리" 역할 탭 클릭 시 페이지 미이동

setRole만 호출하고 navigate를 안 해서, admin 전환 시 이전 페이지에 머무름. owner/cleaning/homepage는 RoleGuard redirect가 있어서 우연히 동작했지만 admin은 redirect 없음.

**해결:** 역할 탭 onClick에 `navigateTo(landingPages[r.id])` 추가. 모든 역할 전환 시 명시적으로 랜딩 페이지로 이동.

### 5. AppLayout 조건부 hooks 호출

loggedInId null 체크 후 early return으로 AuthGate를 렌더링하는데, 그 뒤에 hooks가 호출되어 `react-hooks/rules-of-hooks` 린트 에러 4건.

**해결:** 모든 hooks를 early return 위로 이동. React hooks 규칙(매 렌더링에서 동일 순서로 호출) 준수.

---

## 최종 검증 결과

| 명령 | 결과 |
|------|------|
| `npm run build` | ✅ 5.11초 성공 |
| `npm run typecheck` | ✅ 에러 0개 |
| `npm run lint` | ✅ 에러 0개 (경고 111개 — 대부분 기존 .jsx 파일의 any) |
| `npm run test` | ✅ 14/14 통과 |

---

## Phase 0~1 완료 후 체감 변화

화면은 똑같아 보이는 게 정상이다. Phase 0~1은 겉은 안 바꾸고 속만 바꾼 Phase다.

### 브라우저에서 바로 확인할 수 있는 차이 4가지

**1. URL이 생겼다**

이전에는 어떤 페이지를 가든 주소창이 `localhost:5173`으로 고정이었다. 지금은 사이드바에서 메뉴를 클릭하면 `/calendar`, `/tenants`, `/buildings` 이런 식으로 주소가 바뀐다.

**2. 뒤로가기가 된다**

이전에는 브라우저 뒤로가기를 누르면 아예 다른 사이트로 나갔다. 지금은 임차인정보 → 건물·호실정보로 이동한 뒤 뒤로가기를 누르면 임차인정보로 돌아온다.

**3. URL 직접 입력이 된다**

이전에는 `localhost:5173` 외에 아무 주소도 먹히지 않았다. 지금은 주소창에 `localhost:5173/tenants`를 직접 치면 바로 임차인 페이지로 간다. 이 URL을 다른 사람한테 공유할 수도 있다.

**4. 새 탭에서 열기가 된다**

이전에는 불가능했다. 지금은 `localhost:5173/buildings`를 새 탭에 붙여넣으면 건물 페이지가 바로 뜬다.

### 눈에 안 보이지만 바뀐 것

**App.jsx 780줄이 6개 파일로 쪼개졌다** — 유지보수할 때 "로그인 버그면 AuthGate.tsx, 사이드바 버그면 Sidebar.tsx"처럼 바로 찾아갈 수 있다.

**TypeScript가 적용됐다** — 임차인 데이터에 `tenant.bulding` 같은 오타를 쓰면 빌드 시점에 잡아준다. 이전에는 런타임에 터졌다.

**ESLint + Prettier가 적용됐다** — 코드 스타일이 자동 통일된다.

**테스트 14개가 돌아간다** — 초성 검색, 금액 포맷이 코드 변경 후에도 정확한지 자동으로 확인한다.

### 브라우저 테스트 체크리스트 (수동 확인 결과)

| # | 항목 | 결과 |
|---|------|------|
| 1 | 로그인 | ✅ 테스트 계정 클릭 → 로그인 성공 |
| 2 | 사이드바 메뉴 이동 + 주소 변경 | ✅ 5~6개 메뉴 클릭, URL 변경 확인 |
| 3 | 뒤로가기/앞으로가기 | ✅ 페이지 간 이동 후 정상 동작 |
| 4 | URL 직접 입력 (/tenants) | ✅ 로그인 상태에서 정상 접근 |
| 5 | 건물목록 → 건물 클릭 → 상세 → 뒤로가기 | ✅ /buildings/제이앤제이 → /buildings 복귀 |
| 6 | 역할 탭 전환 (관리/건물주/청소/홈페이지) | ✅ 4개 탭 모두 전환 + 랜딩 페이지 이동 |
| 7 | 모바일 바텀탭 | 미확인 (Phase 2에서 확인 예정) |

### 참고: 역할 탭 뒤로가기

역할 전환(관리 → 건물주) 후 브라우저 뒤로가기를 누르면 이전 역할 페이지로 돌아가지 않는다. 이건 정상 동작이다. 역할은 Zustand 상태로 관리되어 URL 히스토리와 독립적이며, RoleGuard가 현재 역할에 맞지 않는 경로를 자동 redirect한다.

### 참고: TopBar 우측 상단

TopBar의 "🏗️ 관리" 표시, 🔔 알림 아이콘, "박종호 대표" 이름은 현재 표시 전용(클릭 불가)이다. 원래 App.jsx에서도 동일하게 표시만 하는 요소였다. Phase 2 UI 업그레이드에서 클릭 가능한 요소로 개선 예정:

- "🏗️ 관리" → 삭제 또는 "계정 관리" 드롭다운으로 변경
- 🔔 알림 → 클릭 시 알림 패널 (Phase 5 SSE 연결)
- "박종호 대표" → 클릭 시 계정 메뉴 (로그아웃, 프로필 등)

---

## 산출물 요약

### 신규 생성 (~40개)

| 카테고리 | 파일 |
|----------|------|
| 스토어 | src/stores/authStore.ts, uiStore.ts |
| 훅 | src/hooks/useAppData.ts, useNavigateCompat.ts, useCurrentPageId.ts |
| 타입 | src/types/appContext.ts |
| 레이아웃 | src/layouts/AppLayout.tsx, AuthGate.tsx, Sidebar.tsx, TopBar.tsx, MobileNav.tsx, RoleGuard.tsx |
| 라이브러리 | src/lib/api.ts, queryClient.ts |
| 라우터 | src/router.tsx, src/main.tsx |
| 래퍼 | src/pages/wrappers/ (27개 + index.ts) |

### 수정 (3개)

- index.html — main.jsx → main.tsx
- vite.config.ts — vendor chunk에 react-router-dom 추가
- tsconfig.json — "types": ["vite/client"] 추가

### 미수정 (절대 원칙 준수)

- src/pages/*.jsx (25개) — 내부 로직 불변
- src/App.jsx — dead code로 유지 (최종 확인 후 삭제 가능)
- src/data/, src/config/, src/utils/, src/components/ — 불변
