# Houseman — 다음 Phase 전환 계획

> 작성일: 2026-03-31
> 기준: feature/ceo-integration 브랜치

---

## 1. 현재 완료 상태 (코드 기반 확인)

| Phase | 상태 | 근거 |
|-------|------|------|
| Phase 0 (FE 툴링) | ✅ 완료 | TS 5.9, ESLint 9, Prettier, Vitest, Vite 6, path alias @/ |
| Phase 1 (FE 스켈레톤) | ✅ 완료 | React Router v7 (30+경로), Zustand 12개 스토어, TanStack Query, AppLayout 6파일 분해, 31개 Wrapper |
| Phase 2 (UI 업그레이드) | ✅ 완료 | Tailwind v4, shadcn/ui 17개 컴포넌트, Sonner toast, 디자인 토큰 |
| Phase 3a (인프라) | ✅ 완료 | Spring Boot 3.4.3 + Kotlin, JWT auth, SecurityConfig, V1-V2 migration |
| Phase 3b (핵심 비즈니스) | ✅ 완료 | ContractController/Service, BillingController/Service, TransactionController, V3-V6 migration |
| Phase 3c (파생 도메인+SSE) | ✅ 완료 | CalendarController, VacancyController, SettlementController, SseController, OverdueCheckScheduler, V7-V8 migration |
| Phase 3d (부가기능) | ✅ 완료 | CashbookController, ParkingController, V9 migration |
| Phase 4 (API 마무리) | ⚠️ 대부분 완료 | 13 controllers, 14 services, 14 repositories, E2E 테스트 존재. 단, FE↔BE 타입 정합성 미검증 |
| Phase 5 (FE↔BE 연결) | ❌ 미착수 | VITE_USE_API=false, 앱은 localStorage로만 동작 중 |
| Phase 6 (DevOps) | ❌ 미착수 | CI 파이프라인 기본 구조만 존재 |

### 핵심 숫자

| 항목 | 수치 |
|------|------|
| Kotlin 파일 | 116개 |
| Flyway 마이그레이션 | V1~V9 (2,923줄) |
| FE .tsx 파일 | 138개 (99.3%) |
| FE .jsx 파일 | 2개 (App.jsx, main.jsx — 레거시) |
| @ts-nocheck 파일 | ~21개 |
| 쿼리 훅 | src/hooks/queries/ 13개 |
| Wrapper 컴포넌트 | 31개 |

---

## 2. 질문에 대한 답변

### Q1: 지금 Phase 3a를 시작하는 게 맞는가?

**아니다. Phase 3a~3d는 이미 완료되었다.**

- `houseman-server/` 디렉토리에 116개 Kotlin 파일이 존재
- 13개 Controller, 14개 Service, 14개 Repository 모두 구현됨
- V1~V9 Flyway 마이그레이션 (staff/building/room → contracts/transactions → billing → calendar/vacancy/settlement → cashbook/parking)
- E2E 테스트, 단위 테스트 모두 존재
- **지금 해야 할 것은 Phase 4 잔여 검증 → Phase 5 (FE↔BE 연결)**

### Q2: 프론트엔드에서 먼저 해야 할 잔여 작업이 있는가?

**있다. Phase 5 진입 전 필수 선행 작업:**

1. **Jackson 직렬화 규칙 확인** — BE `application.yml`의 `SNAKE_CASE` 설정과 FE 타입 정의(`camelCase`)의 불일치 해결 필요
2. **쿼리 훅 타입 안전성** — 현재 13개 쿼리 훅이 `unknown[]` 반환. API 응답 타입 정의 필요
3. **@ts-nocheck 정리** — 6개 Zustand 스토어의 `@ts-nocheck` 제거 및 타입 에러 수정
4. **App.jsx/main.jsx 정리** — 레거시 진입점. 현재 미사용 확인 후 제거

### Q3: Phase 3a~3d를 순서대로 해야 하는가, 병합/단축 가능한가?

**이미 완료. 병합 논의 불필요.** V1~V9 마이그레이션으로 모든 도메인 스키마가 생성되어 있고, 전 도메인의 Controller/Service가 구현되어 있다.

### Q4: houseman-server/ 디렉토리가 이미 존재하는가?

**존재한다.** Spring Boot 3.4.3 + Kotlin 프로젝트가 완전히 구성됨:

```
houseman-server/
├── build.gradle.kts          (Spring Boot 3.4.3, JDK 17)
├── Dockerfile
├── src/main/kotlin/com/houseman/
│   ├── config/               (CORS, Jackson, Security, Scheduling)
│   ├── controller/           (13개: Auth~Vacancy)
│   ├── domain/               (12개 도메인 DTO/Entity)
│   ├── repository/           (14개 JPA Repository)
│   ├── service/              (14개 Service)
│   ├── security/             (JWT Provider, Filter)
│   ├── global/               (SSE, Exception, Logging)
│   └── infra/scheduling/     (Overdue, ContractExpiry)
├── src/main/resources/db/migration/  (V1~V9)
└── src/test/                 (controller, e2e, service, infra)
```

### Q5: Supabase에서 PostgreSQL로 완전 전환하는 시점은?

**지금이 적절하다. 이유:**

1. Supabase 프로젝트(ConveyorGuard)가 **INACTIVE** 상태 — 이미 사용 불가
2. `.env.local`에 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 미설정 — `supabase` 클라이언트는 `null`
3. 앱은 **localStorage 폴백**으로만 동작 중 — Supabase 레이어는 사실상 죽은 코드
4. Spring Boot 서버가 완전히 구현되어 있어 전환 대상이 준비됨
5. 1,803줄의 Supabase 관련 코드 (`supabaseData.ts` 1095줄 + `useSupabaseSync.ts` 698줄)가 불필요한 복잡성

**전환 전략: Supabase를 건너뛰고 localStorage → Spring Boot API로 직접 전환**

---

## 3. 현재 데이터 흐름 분석

### 3-1. 데이터 소스 계층

```
현재 (VITE_USE_API=false, Supabase INACTIVE):

사용자 액션
  → Page Component
    → useState setter (로컬 상태 변경)
    → saveLS() (localStorage 저장)
    → persistInsert/Update/Delete() → USE_API=false이므로 Supabase 호출
      → supabase = null이므로 빈 배열 반환 (no-op)

데이터 로드:
  useAppData() Hook
    → localStorage.getItem('appData')
    → 17개 키 (hm_activeTenants, hm_calendarEvts, hm_transactions 등)
    → static data (src/data/) fallback
    → Wrapper에서 props로 Page에 전달
```

### 3-2. Feature Flag 분기점

```typescript
// src/lib/featureFlag.ts
export const USE_API = import.meta.env.VITE_USE_API === 'true';
```

분기 사용처:
- `useAppData.ts:55` — `saveLS()`: USE_API=true면 localStorage 쓰기 차단
- `src/hooks/queries/*.ts` — 쿼리 훅의 `enabled: USE_API`
- `src/pages/wrappers/*.tsx` — `useApiOr(apiData, localData)` 분기
- `persistInsert/Update/Delete()` — USE_API=true면 no-op (Supabase 호출 안 함)

### 3-3. 듀얼 모드 Wrapper 패턴

```typescript
// src/pages/wrappers/CalendarWrapper.tsx (대표 패턴)
export function CalendarWrapper() {
  const ctx = useAppContext();           // localStorage 데이터
  const calendarQ = useCalendarEvents(); // TanStack Query (enabled: USE_API)

  return (
    <CalendarPage
      events={useApiOr(calendarQ.data, ctx.calendarEvts)}
      setEvents={USE_API ? undefined : ctx.setCalendarEvts}
    />
  );
}
```

### 3-4. 전환 시 핵심 위험

| 위험 | 설명 | 영향 |
|------|------|------|
| 타입 불일치 | BE DTO(`buildingId: Long`) ↔ FE Type(`building: string`) | 런타임 크래시 |
| Jackson SNAKE_CASE | BE가 `move_in`으로 보내지만 FE는 `moveIn` 기대 | 전 필드 undefined |
| Setter undefined | USE_API=true면 `setActiveTenants`가 undefined로 전달 | 쓰기 동작 실패 |
| 데이터 마이그레이션 | 실 데이터가 브라우저 localStorage에만 존재 | 데이터 유실 |
| @ts-nocheck | 21개 파일에서 타입 에러 숨겨짐 | 런타임 에러 |

---

## 4. 실행 계획: Phase 4.5 → 5a → 5b → 5c → 5d → 6

### Phase 4.5: 연결 전 사전 검증

> 목표: BE 부팅 확인 + FE↔BE 타입 정합성 확보

**4.5-1. 백엔드 부팅 + 테스트 통과 확인**
```bash
cd houseman-server
docker compose up -d db   # PostgreSQL 기동
./gradlew test            # 전체 테스트 실행
```

**4.5-2. Jackson 직렬화 규칙 통일**
- `application.yml`에서 `property-naming-strategy` 확인
- FE 타입과 맞추기: **camelCase 통일 권장** (BE DTO가 이미 camelCase)
- Jackson SNAKE_CASE 설정이 있다면 제거

**4.5-3. API 응답 Shape 검증**
- 각 Controller의 응답 DTO와 FE `src/types/index.ts`의 타입 비교
- 핵심 매핑: `ContractResponse` ↔ `Tenant`, `BillingRecordResponse` ↔ `BillingEntry`
- 불일치 목록 작성 → 변환 함수 설계

**4.5-4. @ts-nocheck 정리 (Zustand 스토어 6개)**
- `useAppStore.ts`, `useBuildingStore.ts`, `useCalendarStore.ts`
- `useFinanceStore.ts`, `useTenantStore.ts`, `usePendingStore.ts`

---

### Phase 5a: 데이터 마이그레이션

> 목표: localStorage 실 데이터 → PostgreSQL 이전

**5a-1. localStorage 내보내기 스크립트**
```
scripts/export-localstorage.cjs
- 브라우저에서 JSON.stringify(localStorage.getItem('appData')) 복사
- 17개 키를 파싱하여 SQL INSERT 문 생성
- 매핑: activeTenants → contracts, calendarEvts → calendar_events 등
```

**5a-2. /api/upload/seed 엔드포인트 활용 (또는 신규 생성)**
- localStorage JSON blob을 받아 Spring Boot Service를 통해 DB에 저장
- 기존 Service 레이어를 활용하여 데이터 무결성 보장

**5a-3. 검증**
- Swagger UI에서 각 도메인 GET 엔드포인트 호출
- localStorage 원본 데이터와 API 응답 비교

---

### Phase 5b: 타입 정렬 + 쿼리 훅 타이핑

> 목표: FE가 BE 응답을 안전하게 소비할 수 있는 타입 체계 구축

**5b-1. API 응답 타입 정의**
```typescript
// src/types/api.ts (신규)
export interface ContractResponse {
  id: number;
  buildingId: number;
  buildingName: string;
  roomId: number;
  roomNumber: string;
  tenantName: string;
  moveInDate: string; // ISO date
  expiryDate: string;
  // ...
}
```

**5b-2. 쿼리 훅 타입 적용**
- 13개 쿼리 훅의 `unknown[]` → 구체적 API 응답 타입으로 변경
- 예: `useQuery<ContractResponse[]>({ queryKey: ['contracts'], ... })`

**5b-3. 변환 함수 작성**
```typescript
// src/lib/transforms.ts (신규)
export function contractToTenant(c: ContractResponse): Tenant { ... }
export function billingRecordToEntry(b: BillingResponse): BillingEntry { ... }
```

**5b-4. Wrapper에서 변환 적용**
```typescript
// TenantsWrapper.tsx
const apiTenants = contractsQ.data?.map(contractToTenant);
return <TenantsPage tenants={useApiOr(apiTenants, ctx.activeTenants)} />;
```

---

### Phase 5c: Wrapper 재배선 + 플래그 전환

> 목표: VITE_USE_API=true 전환 및 전 도메인 검증

**5c-1. Mutation 훅 연결**
- 각 도메인의 create/update/delete mutation을 Wrapper에서 Page로 전달
- `setActiveTenants` → `useCreateContract().mutate` + `queryClient.invalidateQueries`

**5c-2. 도메인별 순차 전환 (위험 낮은 순)**

| 순서 | 도메인 | 난이도 | 이유 |
|------|--------|--------|------|
| 1 | Staff | ★☆☆ | 단순 CRUD, 의존성 없음 |
| 2 | Buildings + Rooms | ★☆☆ | 읽기 중심, 쓰기 적음 |
| 3 | Calendar | ★★☆ | 독립적이지만 이벤트 복잡 |
| 4 | Vacancies | ★☆☆ | 독립적 |
| 5 | Parking | ★☆☆ | 독립적 |
| 6 | Cashbook | ★☆☆ | 독립적 |
| 7 | Transactions | ★★☆ | 계약 의존성 |
| 8 | Contracts (임차인) | ★★★ | 핵심 도메인, 크로스 의존 |
| 9 | Billing | ★★★ | 복잡한 계산 로직 |
| 10 | Settlement | ★★★ | Billing+Contract 의존 |

**5c-3. 플래그 전환**
```bash
# .env.local
VITE_USE_API=true
VITE_API_BASE_URL=http://localhost:8080
```

**5c-4. 전체 워크플로우 검증**
- 입주 → 청구 → 수금 → 퇴실 → 정산 E2E 플로우
- 각 25개+ 페이지 렌더링 확인
- 모바일 레이아웃 확인

---

### Phase 5d: 클린업 — Supabase + localStorage 제거

> 목표: 죽은 코드 제거, 단일 데이터 경로로 단순화

**삭제 대상:**
| 파일 | 줄 수 | 이유 |
|------|-------|------|
| `src/lib/supabaseData.ts` | 1,095 | Supabase CRUD (미사용) |
| `src/lib/supabase.ts` | 10 | Supabase 클라이언트 (null) |
| `src/stores/useSupabaseSync.ts` | 698 | 동기화 (미사용) |
| `src/hooks/useSupabaseQueries.ts` | — | Supabase 쿼리 |
| `src/pages/*/supabaseApi.ts` | — | per-page Supabase API |
| `src/lib/featureFlag.ts` | 1 | USE_API 플래그 (불필요) |
| `src/hooks/useAppData.ts` | ~500 | localStorage 데이터 (대체됨) |
| `App.jsx` + `main.jsx` | ~804 | 레거시 진입점 |

**의존성 제거:**
```bash
npm uninstall @supabase/supabase-js
```

**예상 제거량: ~3,100줄+**

---

### Phase 6: DevOps

**6-1. Docker Compose 프로덕션 설정**
```yaml
services:
  db:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]
  server:
    build: ./houseman-server
    depends_on: [db]
    environment:
      - SPRING_PROFILES_ACTIVE=prod
  client:
    build: ./houseman-client
    depends_on: [server]
```

**6-2. CI/CD (GitHub Actions)**
- server: `./gradlew test` + `./gradlew ktlintCheck`
- client: `npm ci` → `typecheck` → `lint` → `test` → `build`
- E2E: `docker compose up -d` → `npx playwright test`

**6-3. 백업**
- `pg_dump` cron (매일)
- 7일 보관 정책

---

## 5. 즉시 실행 가능한 다음 단계

```
1단계 (지금): Phase 4.5-1 — 백엔드 부팅 + 테스트 확인
   cd houseman-server && docker compose up -d db && ./gradlew test

2단계: Phase 4.5-2 — Jackson 직렬화 규칙 확인/통일
   application.yml의 property-naming-strategy 확인

3단계: Phase 4.5-3 — API 응답 Shape vs FE 타입 매핑표 작성
   ContractResponse ↔ Tenant, BillingResponse ↔ BillingEntry 등

4단계: Phase 5a — localStorage 실 데이터 내보내기 + DB 시딩
5단계: Phase 5b — 타입 정렬 + 변환 함수 작성
6단계: Phase 5c — 도메인별 순차 전환 (Staff → ... → Settlement)
7단계: Phase 5d — Supabase/localStorage 코드 삭제
8단계: Phase 6 — Docker + CI + 백업
```

---

## 6. 주의사항

- **절대 원칙 준수**: 도메인 로직(정산/연체/청구/일할 계산)은 변경 금지
- **데이터 백업 필수**: localStorage `appData`를 JSON 파일로 먼저 백업
- **점진적 전환**: 한 번에 모든 도메인을 전환하지 말고, 도메인별 순차 검증
- **rollback 가능**: `.env.local`에서 `VITE_USE_API=false`로 되돌리면 즉시 localStorage 모드 복귀
