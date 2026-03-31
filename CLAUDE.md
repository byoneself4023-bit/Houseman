# Houseman 아키텍처 전면 재구축 계획

기능과 UI 워크플로우는 100% 동일하게 유지하면서, 기반을 전면 재구축한다.

**절대 원칙: 기존 기능을 건드리지 않는다.**

- 도메인 로직(정산 계산, 계약 상태 전환, 연체료, 일할 계산 등)은 그대로 보존/이동한다
- 워크플로우(입주→청구→수금→퇴실→정산)의 순서와 동작을 변경하지 않는다
- 각 Phase 검증 단계에서 "기존과 동일하게 동작하는가"를 반드시 확인한다

------

## 최종 기술 스택

| 영역                  | 현재                                  | 전환                                        |
| --------------------- | ------------------------------------- | ------------------------------------------- |
| **Backend**           | 없음                                  | Spring Boot 3.4 + Kotlin + JPA/Hibernate    |
| **DB**                | localStorage 단일 blob                | PostgreSQL 16 + Flyway                      |
| **Auth**              | staff.js 평문 비밀번호                | Spring Security + JWT (access + refresh)    |
| **Real-time**         | 없음                                  | SSE (SseEmitter)                            |
| **Frontend Language** | JavaScript                            | TypeScript 5.7 (incremental, allowJs: true) |
| **Routing**           | switch + page state                   | React Router v7                             |
| **State**             | App.jsx 17개 useState + prop drilling | Zustand 5 (UI 상태만)                       |
| **Server State**      | 없음                                  | TanStack Query 5                            |
| **Styling**           | 100% inline styles                    | Tailwind CSS 4 + shadcn/ui                  |
| **Forms**             | 수동 useState (최대 49개)             | React Hook Form + Zod                       |
| **Build**             | Vite 6                                | Vite 6 + path alias @/                      |
| **Test (BE)**         | 없음                                  | JUnit 5 + Kotest + Testcontainers           |
| **Test (FE)**         | 없음                                  | Vitest + Testing Library + Playwright       |
| **Lint/Format**       | 없음                                  | ESLint + Prettier + ktlint                  |
| **Deploy**            | 수동                                  | Docker Compose + GitHub Actions             |
| **Error Tracking**    | 없음                                  | Sentry                                      |

------

## 실행 전략: 2단계 의사결정

### 확정 구간 (무조건 실행)

```
[Pre] 모노레포 전환 → Phase 0 (FE 툴링) → Phase 1 (FE 스켈레톤)
```

Phase 0~1만 완료해도:

- TypeScript 도입 완료
- React Router로 URL 기반 네비게이션 (딥링크, 뒤로가기)
- App.jsx 분해 (780줄 → 6개 파일)
- Prop drilling 제거 (24 props → 0)
- ESLint + Prettier로 코드 품질 확보
- Feature flag + Repository 인터페이스 선행 설치 (추후 API 전환 대비)

→ **여기서 대표님 반응 확인. "계속 가자" → Phase 2~6 진행. 아니면 여기서 끊어도 손해 없음.**

### 조건부 구간 (대표님 확인 후)

```
[Agent FE] Phase 2 (UI 업그레이드) ───────────────────────────┐
                                                                ├→ Phase 5 (페이지 분해 + API 연결) → Phase 6 (DevOps)
[Agent BE] Phase 3a → 3b → 3c → 3d → Phase 4 (API 완성) ────┘
```

**병렬 가능:** FE Phase 2 ↔ BE Phase 3a~3d/4 **합류 지점:** Phase 5

------

## Feature Flag 전환 타임라인

| Phase    | VITE_USE_API | 데이터 소스                | 설명                  |
| -------- | ------------ | -------------------------- | --------------------- |
| 0, 1     | `false`      | localStorage (기존 그대로) | FE만 리팩토링         |
| 2        | `false`      | localStorage               | UI 업그레이드         |
| 3a~3d, 4 | `false`      | localStorage               | BE 개발 중, FE는 로컬 |
| 5        | **`true`**   | **API → PostgreSQL**       | FE가 API에 연결       |
| 6        | `true`       | API → PostgreSQL           | 프로덕션 배포         |

------

## [Pre] 모노레포 전환 (Phase 0 시작 전)

```bash
mkdir houseman
mv /Users/kuka/Houseman houseman/houseman-client
# Phase 3에서 houseman-server/ 생성 예정

# 결과:
houseman/
├── houseman-client/        ← 기존 프로토타입 코드
├── docker-compose.yml      ← Phase 3에서 생성
├── .github/workflows/      ← Phase 6에서 생성
└── README.md
```

Git history 유지를 위해 `git mv` 사용 권장.

------

## Phase 0: FE 툴링 기반

### 0-1. 패키지 정리

- playwright를 dependencies → devDependencies로 이동
- 새 devDependencies: typescript, @types/react, @types/react-dom, eslint, prettier, vitest, @testing-library/react, jsdom
- package.json scripts: `typecheck`, `lint`, `format`, `test`

### 0-2. 설정 파일 생성

- `tsconfig.json` — allowJs: true, strict: true, paths: { "@/*": ["./src/*"] }
- `eslint.config.js` — flat config + typescript-eslint + react-hooks
- `.prettierrc` — semi, singleQuote, trailingComma
- `vitest.config.ts` — jsdom environment
- `vite.config.ts` — (rename from .js) path alias @/
- `.env.example` — VITE_API_BASE_URL, VITE_SENTRY_DSN, VITE_USE_API

### 0-3. TypeScript 점진적 전환 (bottom-up)

1. `src/types/*.ts` 신규 생성
2. `src/utils/*.js` → `.ts`
3. `src/config/*.js` → `.ts`
4. `src/data/*.js` → `.ts`
5. `src/components/*.jsx` → `.tsx`
6. `src/pages/*.jsx` → `.tsx` (Phase 5에서 분해와 동시에)
7. `src/App.jsx` → `.tsx` (Phase 1 분해 후)

### 검증

- `npm run dev` 정상 기동
- `npm run build` 성공
- `npm run typecheck` 통과
- **기존 모든 기능 정상 동작 확인** (로그인, 페이지 전환, 데이터 조회 등)

------

## Phase 1: FE 아키텍처 스켈레톤

### 1-1. 도메인 타입 정의 (src/types/)

| 파일           | 주요 인터페이스                                            |
| -------------- | ---------------------------------------------------------- |
| building.ts    | Building, BuildingFloor, BuildingData                      |
| tenant.ts      | Tenant, Contract                                           |
| transaction.ts | Transaction, BillingEntry, CashbookEntry                   |
| settlement.ts  | SettlementMasterConfig, ExpenseCategory, SettlementExpense |
| vacancy.ts     | Vacancy                                                    |
| calendar.ts    | CalendarEvent                                              |
| staff.ts       | Staff, StaffRole                                           |
| room.ts        | Room, RoomMasterData                                       |
| api.ts         | ApiResponse<T>, PaginatedResponse<T>, ErrorResponse        |
| index.ts       | barrel export                                              |

### 1-2. Zustand 스토어 — UI 상태만

| 스토어       | 관리 상태                                                    |
| ------------ | ------------------------------------------------------------ |
| authStore.ts | loggedInUser, accessToken, refreshToken, role, login(), logout() |
| uiStore.ts   | page, sidebarOpen, settingsOpen, selectedBuilding, showMobileMore |

### 1-3. Feature Flag + Repository 인터페이스 (선행 설치)

```typescript
// src/lib/dataSource.ts
const USE_API = import.meta.env.VITE_USE_API === 'true';

export interface ContractRepository {
  findAll(filters?: ContractFilters): Promise<Contract[]>;
  findById(id: string): Promise<Contract>;
  create(data: CreateContractDto): Promise<Contract>;
  moveOut(id: string, data: MoveOutDto): Promise<void>;
}

// Phase 0~4: localStorage 구현 (기존 프로토타입 로직 그대로 래핑)
class LocalContractRepository implements ContractRepository {
  findAll(filters?: ContractFilters) {
    const data = JSON.parse(localStorage.getItem('appData') || '{}');
    return data.activeTenants?.filter(...) ?? [];
  }
}

// Phase 5: API 구현으로 전환
class ApiContractRepository implements ContractRepository {
  findAll(filters?: ContractFilters) {
    return api.get<Contract[]>('/api/contracts', { params: filters });
  }
}

export function getContractRepository(): ContractRepository {
  return USE_API ? new ApiContractRepository() : new LocalContractRepository();
}
```

각 도메인별 Repository 인터페이스 동일 패턴: BuildingRepository, TransactionRepository, BillingRepository, CalendarRepository, VacancyRepository, SettlementRepository, CashbookRepository, ParkingRepository

### 1-4. React Router v7

| 경로              | 페이지                        |
| ----------------- | ----------------------------- |
| /                 | CalendarPage                  |
| /buildings        | BuildingsPage                 |
| /buildings/:name  | BuildingDetailPage            |
| /tenants          | TenantsPage                   |
| /past-tenants     | PastTenantsPage               |
| /renewal          | RenewalPage                   |
| /vacancies        | VacancyPage                   |
| /collection       | CollectionPage                |
| /billing          | UtilityBillingPage            |
| /billing/fixed    | UtilityBillingPage (fixed)    |
| /billing/variable | UtilityBillingPage (variable) |
| /transactions     | TransactionPage               |
| /parking          | ParkingPage                   |
| /as               | ASPage                        |
| /calendar         | CalendarPage                  |
| /patrol           | PatrolPage                    |
| /settlement       | SettlementPage                |
| /cashbook         | CashBookPage                  |
| /payroll          | PayrollPage                   |
| /task-driver      | TaskDriverPage                |
| /profit-dashboard | ProfitDashboardPage           |
| /route-schedule   | RouteSchedulePage             |
| /data-upload      | DataUploadPage                |
| /homepage-edit    | HomepageEditPage              |
| /staff            | StaffPage                     |
| /broker           | BrokerPage                    |
| /owner            | OwnerDashboard                |
| /homepage         | HomepagePage                  |

### 1-5. App.jsx 분해

780줄 → 6개 파일:

| 새 파일                   | 역할                                  |
| ------------------------- | ------------------------------------- |
| src/main.tsx              | RouterProvider, QueryClientProvider   |
| src/router.tsx            | 라우트 정의                           |
| src/layouts/AppLayout.tsx | Sidebar + TopBar + Outlet + MobileNav |
| src/layouts/AuthGate.tsx  | 로그인 폼                             |
| src/layouts/Sidebar.tsx   | 데스크톱 사이드바                     |
| src/layouts/TopBar.tsx    | 상단 바                               |
| src/layouts/MobileNav.tsx | 모바일 바텀탭 + 더보기 메뉴           |

핵심: 모든 페이지가 props 대신 Repository 인터페이스에서 데이터를 읽도록 변경.

### 1-6. API 클라이언트 (src/lib/api.ts)

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  if (res.status === 401) { /* refresh token rotation */ }
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return res.json();
}

export const api = {
  get: <T>(path: string, config?: { params?: Record<string, unknown> }) =>
    fetchApi<T>(path + toQueryString(config?.params)),
  post: <T>(path: string, body: unknown) =>
    fetchApi<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    fetchApi<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    fetchApi<T>(path, { method: 'DELETE' }),
};
```

### 1-7. TanStack Query 설정

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false },
  },
});
```

### 검증

- 모든 25개 페이지 렌더링 정상 (VITE_USE_API=false)
- URL 직접 접근 및 브라우저 뒤로가기
- 로그인/로그아웃/역할 전환
- 모바일 레이아웃
- **기존 워크플로우 전체 정상 동작** (임차인 등록/수정, 청구, 정산 등)

### → 여기서 대표님 반응 확인. Phase 2~6 진행 여부 결정.

------

## Phase 2: UI 업그레이드

**전략: "픽셀 동일"이 아닌 "같은 기능 + 더 세련된 UI"**

기존 기능과 워크플로우는 100% 보존하되, 비주얼이 한 단계 올라간다. 대표님이 화면 열었을 때 "오" 하는 첫인상을 만든다.

### 2-1. 디자인 토큰 정의

기존 인라인 값을 shadcn 디자인 시스템에 맞춰 정제:

```css
:root {
  /* 배경 */
  --background: 240 5% 96%;
  --card: 0 0% 100%;
  --muted: 220 14% 96%;

  /* 브랜드 */
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;

  /* 시맨틱 */
  --destructive: 0 84% 60%;
  --warning: 38 92% 50%;
  --success: 142 76% 36%;

  /* 보더 */
  --border: 220 13% 91%;
  --ring: 217 91% 60%;

  /* 사이드바 */
  --sidebar-background: 222 28% 14%;
  --sidebar-foreground: 210 40% 98%;
  --sidebar-active: 222 28% 22%;

  --radius: 0.5rem;
}
```

### 2-2. Tailwind + shadcn/ui 설치

```bash
npm install -D tailwindcss @tailwindcss/postcss postcss
npm install tailwind-merge clsx class-variance-authority tw-animate-css
npx shadcn@latest init
npx shadcn@latest add button badge card table input label select textarea
npx shadcn@latest add dialog sheet separator tabs tooltip
npx shadcn@latest add skeleton avatar dropdown-menu
npm install sonner
```

### 2-3. 공유 컴포넌트 업그레이드

| 기존              | 업그레이드 내용                                              |
| ----------------- | ------------------------------------------------------------ |
| Card.jsx          | shadcn Card + CardHeader/CardContent + hover:shadow-md 트랜지션 |
| StatusBadge.jsx   | shadcn Badge + 커스텀 variants (overdue, normal, pending, vacant) + lucide 아이콘 |
| Table.jsx         | shadcn Table + 행 hover:bg-muted/50 + 헤더 font-medium text-muted-foreground |
| Field.jsx         | shadcn Label + Input + focus-visible:ring-2 + 에러 상태 border-destructive |
| SectionTitle.jsx  | text-lg font-semibold tracking-tight                         |
| RoomTypeBadge.jsx | shadcn Badge variant="outline" + 호실 유형별 색상            |

### 2-4. 신규 공통 컴포넌트

| 컴포넌트            | 역할                                          | 연결 시점                          |
| ------------------- | --------------------------------------------- | ---------------------------------- |
| LoadingSkeleton.tsx | shadcn Skeleton 기반 카드/테이블 로딩         | Phase 5 (TanStack Query isLoading) |
| EmptyState.tsx      | 아이콘 + 제목 + 설명 ("임차인이 없습니다" 등) | Phase 5                            |
| ConfirmDialog.tsx   | shadcn AlertDialog (퇴실, 삭제 등 위험 액션)  | Phase 5                            |
| Toaster (sonner)    | main.tsx에 설정만                             | Phase 5 (SSE 알림 표시)            |

### 2-5. 레이아웃 업그레이드

**Sidebar.tsx**

- bg-sidebar-background, 메뉴 hover 트랜지션 (150ms)
- 활성 상태: bg-sidebar-active + left-2 border-primary 인디케이터
- lucide-react 아이콘 (Building2, Users, Calendar 등)
- 그룹 헤더 (text-xs uppercase tracking-wider text-muted-foreground)

**TopBar.tsx**

- bg-card border-b shadow-sm
- 건물 선택 → shadcn Select
- 사용자 메뉴 → shadcn DropdownMenu + Avatar

**MobileNav.tsx**

- fixed bottom-0 bg-card border-t
- 아이콘 + 라벨 (text-xs), active: text-primary
- 터치 피드백: active:scale-95 transition

**AuthGate.tsx (로그인)**

- 센터 카드 레이아웃, shadcn Card + Input + Button
- 로딩 상태 (Button disabled + spinner)

### 2-6. 페이지 내부 인라인

Phase 2에서는 레이아웃과 공유 컴포넌트만 업그레이드. **페이지 내부 인라인 스타일은 Phase 5 분해 시 Tailwind로 변환.**

단, 페이지가 공유 컴포넌트를 사용하는 부분은 자동으로 업그레이드됨:

- Card → shadcn Card로 바뀌면 모든 페이지의 카드가 업그레이드
- Table → 모든 페이지의 테이블이 업그레이드
- Badge → 모든 페이지의 상태 배지가 업그레이드

### 2-7. Before/After 시각 변화

| Before (프로토타입)       | After (Phase 2)                     |
| ------------------------- | ----------------------------------- |
| 밋밋한 인라인 스타일 카드 | 그림자 + 호버 트랜지션 카드         |
| 투박한 테이블             | 행 호버 + 스트라이프 + 정렬 헤더    |
| 경고 없는 모달            | backdrop blur + 슬라이드 애니메이션 |
| 로딩 시 빈 화면           | Skeleton 로딩 (Phase 5 연결)        |
| 데이터 없을 때 빈 화면    | EmptyState 안내 (Phase 5 연결)      |
| 알림 없음                 | 토스트 알림 (Phase 5 SSE 연결)      |
| 투박한 input/select       | focus ring + 에러 상태 표시         |
| 사이드바 호버 없음        | 부드러운 호버 + 활성 인디케이터     |

### 검증

- **기능 체크리스트**: 모든 25개 페이지에서 기존 기능 동일 동작
  - 로그인/로그아웃/역할 전환
  - 각 메뉴 네비게이션
  - 임차인 목록 필터/검색
  - 건물 상세 진입
  - 청구/정산/수금 워크플로우
  - 모바일 레이아웃 전환
- **시각 품질 체크**: 레이아웃 깨짐, 겹침, 잘림 없음
- **시각 차이는 의도적**: shadcn 기반 모던 UI 업그레이드이므로 기존과 다른 건 정상

------

## Phase 3: Backend (서브페이즈 분할) — HAUT 포팅

### HAUT 포팅 워크플로우

```
1. HAUT 소스 파일 복사 → houseman-server 대응 위치 배치
2. 패키지명 변경: com.houseman.haut → com.houseman
3. HAUT 전용 기능 제거 (n8n webhook, Redis 캐시 등)
4. 엔티티/DTO 필드 조정
5. 테스트 포팅 + 조정
6. 컴파일 + 테스트 통과
```

### HAUT에서 그대로 가져올 자산

| HAUT 소스                                             | Houseman 대상      | 조정 사항             |
| ----------------------------------------------------- | ------------------ | --------------------- |
| global/config/SecurityConfig.kt                       | global/config/     | CORS origin만 변경    |
| global/security/JwtProvider.kt                        | global/security/   | 거의 그대로           |
| global/security/JwtAuthFilter.kt                      | global/security/   | 거의 그대로           |
| global/error/*                                        | global/error/      | 불필요 에러 코드 제거 |
| global/common/BaseEntity.kt                           | global/common/     | 그대로                |
| global/common/ApiResponse.kt                          | global/common/     | 그대로                |
| global/sse/SseEmitterManager.kt                       | global/sse/        | 이벤트 타입 조정      |
| domain/billing/service/BillingService.kt              | domain/billing/    | 핵심 정산 로직 동일   |
| domain/billing/service/BillingTextParser.kt           | domain/billing/    | 공과금 문자 파싱      |
| domain/settlement/service/ExitSettlementCalculator.kt | domain/settlement/ | 퇴실 정산 동일        |
| domain/billing/service/ElectricityRateService.kt      | domain/billing/    | 한전 누진 3구간       |
| domain/building/rule/RuleEngine.kt                    | domain/building/   | 건물별 특수 규칙      |
| domain/contract/service/ContractStatusService.kt      | domain/contract/   | 상태 머신 동일        |
| infra/scheduling/OverdueCheckScheduler.kt             | infra/scheduling/  | 거의 그대로           |

### HAUT에서 패턴만 참조

| HAUT 패턴                                               | 적용 방식                         |
| ------------------------------------------------------- | --------------------------------- |
| 도메인 패키지 구조 (entity/repo/service/controller/dto) | 그대로 적용                       |
| Kotest + Testcontainers 테스트 설정                     | build.gradle.kts 복사             |
| Flyway 마이그레이션 구조                                | 참조하되 Houseman 스키마로 재작성 |

------

### Phase 3a: 기본 인프라 (auth + staff + building + room)

프로젝트 생성 + global/ 전체 + 4개 도메인.

**Flyway:** V1__init_staff_building_room.sql, V2__seed.sql

**API:**

| Method | Path                         | 설명                    |
| ------ | ---------------------------- | ----------------------- |
| POST   | /api/auth/login              | JWT 발급                |
| POST   | /api/auth/refresh            | 토큰 갱신               |
| GET    | /api/auth/me                 | 현재 사용자             |
| GET    | /api/staff                   | 직원 목록               |
| POST   | /api/staff                   | 직원 등록               |
| PUT    | /api/staff/{id}              | 직원 수정               |
| GET    | /api/buildings               | 건물 목록 (역할별 필터) |
| GET    | /api/buildings/{id}          | 건물 상세               |
| PUT    | /api/buildings/{id}          | 건물 수정               |
| GET    | /api/buildings/{id}/rooms    | 호실 목록               |
| GET    | /api/buildings/{id}/accounts | 계좌 정보               |
| PUT    | /api/buildings/{id}/accounts | 계좌 수정               |

**검증:** docker compose up, Flyway 성공, JWT 발급, 역할별 접근 제어

------

### Phase 3b: 핵심 비즈니스 (contract + transaction + billing)

**핵심 포팅:** BillingService, BillingTextParser, ElectricityRateService, ContractStatusService

**Flyway:** V3__contracts_transactions_billing.sql

**API:**

| Method | Path                         | 설명                    |
| ------ | ---------------------------- | ----------------------- |
| GET    | /api/contracts               | 계약 목록               |
| GET    | /api/contracts/{id}          | 계약 상세               |
| POST   | /api/contracts               | 계약 등록               |
| PUT    | /api/contracts/{id}          | 계약 수정               |
| POST   | /api/contracts/{id}/move-out | 퇴실 처리               |
| GET    | /api/contracts/expiring      | 만료 임박               |
| GET    | /api/transactions            | 거래 내역               |
| POST   | /api/transactions            | 거래 등록               |
| GET    | /api/billing                 | 청구 내역               |
| POST   | /api/billing/generate        | 청구서 생성 (서버 계산) |
| PUT    | /api/billing/{id}/confirm    | 청구 확정               |
| PUT    | /api/billing/{id}/send       | 발송 처리               |
| GET    | /api/billing/status          | 청구 현황 요약          |

**검증:** BillingService = billingMaster.js 결과 일치 (단위 테스트), 계약 → 퇴실 플로우 (통합 테스트)

------

### Phase 3c: 파생 도메인 + SSE (calendar + vacancy + settlement)

**핵심 포팅:** ExitSettlementCalculator, SseEmitterManager, OverdueCheckScheduler

**Flyway:** V4__calendar_vacancy_settlement.sql

**API:**

| Method | Path                       | 설명         |
| ------ | -------------------------- | ------------ |
| GET    | /api/calendar              | 이벤트 목록  |
| POST   | /api/calendar              | 이벤트 등록  |
| PUT    | /api/calendar/{id}         | 수정         |
| DELETE | /api/calendar/{id}         | 삭제         |
| GET    | /api/vacancies             | 공실 목록    |
| POST   | /api/vacancies             | 등록         |
| PUT    | /api/vacancies/{id}        | 수정         |
| DELETE | /api/vacancies/{id}        | 삭제         |
| GET    | /api/settlements           | 정산 내역    |
| POST   | /api/settlements/calculate | 정산서 계산  |
| GET    | /api/settlements/{id}/pdf  | PDF 다운로드 |
| POST   | /api/settlements/expenses  | 비용 등록    |
| GET    | /api/sse/connect           | SSE 연결     |

**SSE 이벤트 타입:**

| 이벤트             | 트리거                          |
| ------------------ | ------------------------------- |
| OVERDUE_ALERT      | @Scheduled 매일 09:00 연체 감지 |
| BILLING_CONFIRMED  | 청구서 확정 시                  |
| CONTRACT_EXPIRING  | @Scheduled 매월 1일 만료 임박   |
| MOVE_IN_SCHEDULED  | 계약 등록 시                    |
| MOVE_OUT_SCHEDULED | 퇴실 처리 시                    |
| VACANCY_CREATED    | 공실 발생 시                    |
| PAYMENT_RECEIVED   | 입금 등록 시                    |

**검증:** 퇴실 정산 일치, 계약→캘린더 자동 생성, SSE 연결 + 이벤트 수신, @Scheduled 연체 감지

------

### Phase 3d: 부가 기능 (cashbook + parking + upload)

**Flyway:** V5__cashbook_parking.sql

**API:**

| Method | Path              | 설명              |
| ------ | ----------------- | ----------------- |
| GET    | /api/cashbook     | 출납장            |
| POST   | /api/cashbook     | 항목 등록         |
| GET    | /api/parking      | 주차 정보         |
| POST   | /api/parking      | 등록              |
| PUT    | /api/parking/{id} | 수정              |
| DELETE | /api/parking/{id} | 삭제              |
| POST   | /api/upload/excel | 엑셀 업로드       |
| POST   | /api/upload/seed  | localStorage 시딩 |

**검증:** 전체 API Swagger UI, 엑셀 업로드 → DB 반영

------

## Phase 4: Backend API 마무리 + 크로스 도메인 통합

### 4-1. E2E 플로우 테스트

```
플로우 1: 계약 등록 → 캘린더 이벤트 자동 생성 → SSE MOVE_IN_SCHEDULED
플로우 2: 퇴실 처리 → 정산 계산 → 공실 전환 → SSE MOVE_OUT_SCHEDULED
플로우 3: 청구서 생성 → 확정 → SSE BILLING_CONFIRMED
플로우 4: 입금 등록 → 잔액 갱신 → SSE PAYMENT_RECEIVED
플로우 5: @Scheduled 연체 감지 → SSE OVERDUE_ALERT
```

### 4-2. 최종 API 수

Auth 3 + Staff 3 + Buildings 6 + Contracts 6 + Billing 5 + Transactions 2 + Calendar 4 + Vacancies 4 + Settlement 4 + Cashbook 2 + Parking 4 + SSE 1 + Upload 2 = **총 46개 API**

### 검증

- Swagger UI 전체 확인
- 크로스 도메인 E2E 5개 플로우 통과
- 역할별 접근 제어 전체 확인
- **기존 billingMaster.js 계산 결과와 BillingService.kt 결과 100% 일치**

------

## Phase 5: 페이지 분해 + API 연결 (합류)

**이 Phase에서 VITE_USE_API=true로 전환.**

### 5-1. TanStack Query 훅

Repository 인터페이스가 이미 있으므로 VITE_USE_API만 바꾸면 전환 완료:

```typescript
export function useContracts(filters?: ContractFilters) {
  return useQuery({
    queryKey: ['contracts', filters],
    queryFn: () => getContractRepository().findAll(filters),
  });
}
```

### 5-2. SSE 훅

```typescript
export function useSse() {
  const { accessToken } = useAuthStore();
  useEffect(() => {
    if (import.meta.env.VITE_USE_API !== 'true') return;
    const es = new EventSource(`${API_BASE}/api/sse/connect?token=${accessToken}`);
    es.addEventListener('OVERDUE_ALERT', (e) => { /* toast + invalidate */ });
    es.addEventListener('PAYMENT_RECEIVED', (e) => { /* toast + invalidate */ });
    return () => es.close();
  }, [accessToken]);
}
```

### 5-3. 페이지 분해

**TenantsPage (2,258줄) → src/pages/tenants/**

```
index.tsx, hooks/useTenantFilters.ts, hooks/useBillingStatus.ts,
components/TenantList.tsx, TenantDetail.tsx, TenantBillingCard.tsx,
TenantContractCard.tsx, MoveOutModal.tsx, ContractModal.tsx, TenantSearchBar.tsx
```

**BuildingDetailPage (2,169줄) → src/pages/buildings/[name]/**

```
index.tsx, components/BuildingInfoCard.tsx, RoomGrid.tsx,
BuildingAccountSection.tsx, BuildingStaffSection.tsx, RoomDetailModal.tsx
```

**CalendarPage (2,016줄) → src/pages/calendar/**

```
index.tsx, components/CalendarGrid.tsx, EventCard.tsx,
MoveOutEventForm.tsx, ContractEventForm.tsx, EventDetailModal.tsx,
hooks/useCalendarFilters.ts
```

나머지 1,000줄+ 동일 패턴. 500줄 미만은 .tsx 전환 + Tailwind 변환만.

### 5-4. React Hook Form + Zod

```
src/schemas/tenant.schema.ts, contract.schema.ts, moveout.schema.ts,
building.schema.ts, vacancy.schema.ts
```

### 5-5. Phase 2 준비 컴포넌트 연결

- LoadingSkeleton → TanStack Query isLoading 상태에 연결
- EmptyState → 데이터 0건일 때 표시
- ConfirmDialog → 퇴실/삭제 액션에 연결
- Toaster → SSE 이벤트 수신 시 toast 표시

### 5-6. localStorage 제거

VITE_USE_API=true 확인 후 LocalRepository 제거, appData 키 정리.

### 검증

- 모든 페이지 API 데이터 렌더링
- SSE 알림 토스트 정상
- Skeleton 로딩 표시
- EmptyState 표시
- **기존 워크플로우 전체 정상 동작** (입주→청구→수금→퇴실→정산)
- localStorage 완전 제거 확인

------

## Phase 6: DevOps

### 6-1. 환경 변수

서버: application-local.yml, application-prod.yml 클라이언트: .env.local

### 6-2. GitHub Actions CI

```yaml
jobs:
  server-test:
    - ./gradlew test
    - ./gradlew ktlintCheck
  client-test:
    - npm ci → typecheck → lint → test → build
  e2e:
    - docker compose up -d
    - npx playwright test
```

### 6-3. Docker Compose + Sentry + 백업

```bash
# scripts/backup.sh — cron 매일
pg_dump -U houseman houseman | gzip > /backups/houseman_$(date +%Y%m%d).sql.gz
find /backups -name "*.sql.gz" -mtime +7 -delete
```

### 검증

- CI 통과
- Docker 원커맨드 기동
- Sentry 수신
- 백업 → 복원

------

## 대표님 체감 차이 종합

| Before (프로토타입)              | After (재구축)                        |
| -------------------------------- | ------------------------------------- |
| 1명만 사용 가능                  | 8명 동시 접속 + 역할별 화면           |
| 브라우저 캐시 날리면 데이터 증발 | 서버 DB + 자동 백업 (복구 가능)       |
| 새 탭/뒤로가기 불가              | URL 공유, 딥링크, 브라우저 네비게이션 |
| 알림 없음                        | 연체/입금/만료 실시간 SSE 알림 토스트 |
| 정산 계산을 브라우저에서         | 서버에서 정확한 계산 + PDF 생성       |
| DevTools로 데이터/역할 조작 가능 | JWT + 서버 검증 (조작 불가)           |
| 비밀번호 소스코드 노출           | BCrypt 해시 + DB 저장                 |
| 에러 발생 시 모름                | Sentry 자동 보고                      |
| 밋밋한 인라인 스타일             | shadcn/ui 기반 모던 UI + 트랜지션     |
| 로딩 시 빈 화면                  | Skeleton 로딩                         |
| 빈 데이터 시 빈 화면             | EmptyState 안내                       |

------

## 모노레포 최종 구조

```
houseman/
├── houseman-server/
│   ├── build.gradle.kts
│   ├── Dockerfile
│   └── src/
├── houseman-client/
│   ├── package.json
│   ├── Dockerfile
│   └── src/
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

---

# Houseman 프로젝트 고유 규칙 — 모든 코드 작업 시 필수 준수

## 아키텍처
- props → Zustand 전환 안 함. wrapper + props 패턴 유지.
- Supabase 호출은 VITE_USE_API feature flag로 분기.
- 캘린더 이벤트 수정/생성/삭제 시 반드시 persistUpdate/persistInsert/persistDelete 호출.
- 페이지 추가 시: App.tsx 라우팅 + 사이드바 메뉴 + wrapper(필요시) 모두 확인.

## UI/UX
- alert() / confirm() / prompt() 전면 금지. toast(sonner) 또는 커스텀 모달만 사용.
- 모든 모달: ESC 키 닫기 + 배경 클릭 닫기 + X 버튼 포함.
- 커스텀 모달 스타일: position fixed, 중앙 배치, 반투명 배경(rgba(0,0,0,.45)), borderRadius 16, padding 24.
- 공실 추가 시 중복 체크 필수: exists → status 업데이트, 없으면 push.

## 도메인
- 도메인 로직(정산, 연체, 청구, 일할 계산)은 절대 수정 안 함.
- config/data 파일(billingMaster, billingConfig, buildingFloors, roomMasterData)은 원본 기준.
- 퇴실 이벤트는 vacantConfirmed(공실전환) 전까지 절대 자동 삭제 안 됨.

## 빌드
- 매 수정마다 npx tsc --noEmit + npm run build 확인.
- BuildingsWrapper TS 에러는 기존 허용. 그 외 새 에러 발생 시 즉시 수정.

## E2E 테스트 (Playwright)
- 데이터 주입은 반드시 addInitScript 사용. page.evaluate로 주입하면 useAppData 초기화에 덮어씌워짐.
- localStorage는 개별 hm_* 키가 아닌 'appData' 키 하나에 blob으로 저장. 앱은 이 키에서만 읽음.
- 셀렉터는 .first() 필수. 사이드바와 콘텐츠에 동일 텍스트 존재 → strict mode 위반.
- 페이지 이동 후 waitForLoadState('networkidle') 또는 특정 요소 toBeVisible({ timeout: 10_000 }) 대기.
- 모달은 page 레벨에서 검색 (fixed position이라 콘텐츠 영역 밖).
- 테스트 간 localStorage 격리: 각 테스트에서 독립적으로 시드 주입.

---

# 프롬프트 설계 체크리스트 — 모든 작업 전 참고

## 통합 (모든 작업 공통)
1. 역할 복합: "직접 운영하는 8명 직원 중 한 명이면서 시니어 개발자" 관점
2. "왜"를 먼저: 문제의 맥락을 이해하고 해결 범위를 스스로 판단
3. 실패 조건: 빌드 통과만으로 끝이 아님. 기존 워크플로우 깨지면 실패
4. 결과물 소비자: 누가 읽는지에 따라 품질 조절
5. 제약 구체적으로: wrapper+props 유지, alert 금지→toast만, persist 패턴 준수
6. 사고 과정: 바로 수정 대신 영향 범위 분석→계획→실행
7. Before/After: 변경 전후를 명확히

## 백엔드
1. 도메인 로직 불가침: 정산/연체/청구 계산 공식 절대 안 바꿈
2. 데이터 무결성: 퇴실확정 시 3개(임차인제거+퇴실이력+공실등록) 다 돼야 성공
3. 엣지 케이스: 0원 보증금, 연락처 없음, 공실 중복, 동시 이벤트
4. 마이그레이션 안전성: localStorage 키 변경 시 기존 데이터 보호
5. 계산 결과 검증: 원본과 숫자 비교로 검증

## 프론트엔드
1. 사용자 시나리오로 요구: 기능이 아닌 직원의 행동 흐름으로 생각
2. 상태 전이: 각 단계 완료돼야 다음 단계 가능, 미완료 시 toast
3. 반응형: 최소 320px, 모달 max-width 95vw, 터치 44px
4. 기존 패턴 참조: "DirectInputModal과 동일한 스타일로"
5. 에러/빈 상태: 데이터 0건, 로딩, 에러 모두 처리

## DevOps
1. 환경별 차이: 로컬/스테이징/프로덕션 분리
2. 실패 복구: 배포 실패 시 30초 내 롤백
3. 모니터링 기준: 에러율/응답시간 임계값 설정
4. CI 검증: typecheck→lint→test→build→E2E, 실패→머지 차단