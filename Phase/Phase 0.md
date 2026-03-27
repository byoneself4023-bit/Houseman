# FE 툴링 기반 구축 — 실행 결과 분석

---

## 실행 환경

- 프로젝트: houseman-prototype (React 18.3.1 + Vite 6.0.0 + JavaScript)
- 코드 규모: 24,232줄 (src/ 내 .js + .jsx), 25개 페이지, 10개 공유 컴포넌트
- 절대 원칙: pages/*.jsx, App.jsx, main.jsx 미수정. 데이터 값 미변경.

---

## Step 1: 패키지 정리

### 작업 내용

package.json에서 playwright를 dependencies → devDependencies로 이동하고, TypeScript/ESLint/Prettier/Vitest 관련 devDependencies 14개를 추가 설치했다.

### 발생 문제: peer dependency 충돌

최초 `npm install -D eslint @eslint/js typescript-eslint ...` 실행 시 eslint@10이 설치되면서 typescript-eslint@8과 peer dependency가 맞지 않아 `ERESOLVE could not resolve` 에러 발생.

**해결:** eslint 버전을 명시적으로 `eslint@^9`로 고정해서 재설치. eslint@9 + @eslint/js@^9 + typescript-eslint@^8 조합으로 충돌 해소. 356개 패키지가 정상 설치됨.

### scripts 추가

```json
"typecheck": "tsc --noEmit",
"lint": "eslint src/",
"format": "prettier --write 'src/**/*.{ts,tsx}'",
"format:check": "prettier --check 'src/**/*.{ts,tsx}'",
"test": "vitest run",
"test:watch": "vitest"
```

format/format:check의 glob 패턴이 `*.{ts,tsx}`만 대상으로 잡혀있어서, 기존 JS/JSX 파일은 Prettier가 건드리지 않는다. 기존 코드 스타일 보존.

### 검증: `npm run build` 통과 (기존 빌드와 동일)

---

## Step 2: 설정 파일 생성 (7개)

### tsconfig.json

```json
{
  "strict": true,
  "allowJs": true,
  "checkJs": false,
  "noEmit": true,
  "moduleResolution": "bundler",
  "paths": { "@/*": ["src/*"] }
}
```

`allowJs: true` + `checkJs: false` 조합이 이 Phase의 핵심 설정이다. .ts와 .js 파일을 동일 프로젝트에서 혼용 가능하게 하면서, 기존 JS 파일에 대한 타입 검사는 수행하지 않는다. 이래야 pages/*.jsx를 수정하지 않아도 `tsc --noEmit`이 통과한다.

`noEmit: true`는 tsc를 타입 체크 전용으로 제한한다. 실제 JavaScript 변환과 번들링은 Vite(esbuild)가 담당하므로 tsc가 파일을 생성할 필요가 없다.

### eslint.config.js

ESLint 9의 flat config 형식으로 작성. 3개 설정 블록으로 분리했다:

- **TS/TSX 블록** (`src/**/*.{ts,tsx}`): 엄격한 타입 규칙. `@typescript-eslint/no-explicit-any: "warn"`, `no-empty: allowEmptyCatch: true`.
- **Data 파일 블록** (`src/data/**/*.ts`): `no-useless-escape: off`, `@typescript-eslint/no-unused-expressions: off`. 원본 데이터에 포함된 정규식 패턴과 표현식을 린트가 건드리지 않게.
- **JS/JSX 블록** (`src/**/*.{js,jsx}`): 브라우저 globals 30개+ 등록, `no-undef: off`, `no-useless-escape: off`, `no-empty: off`. pages와 App.jsx를 수정하지 않으면서 린트 에러 0개를 만들기 위한 설정.

eslint-config-prettier를 배열 마지막에 배치해서 ESLint의 포맷팅 규칙을 비활성화. 포맷팅은 Prettier가 전담한다.

### 그 외 설정 파일

- `.prettierrc`: semi: true, singleQuote: true, trailingComma: "all", printWidth: 100, tabWidth: 2
- `.prettierignore`: dist, node_modules, *.css
- `vitest.config.ts`: jsdom 환경, globals: true, setupFiles로 @testing-library/jest-dom 로드
- `.env.example`: VITE_API_BASE_URL, VITE_SENTRY_DSN, VITE_USE_API=false (Feature Flag)
- `.gitignore`에 .env, .env.local, .env.*.local 추가

### 검증: `npm run build` 통과

---

## Step 3-1: 도메인 타입 정의 — src/types/index.ts (434줄)

### 작업 방식

Claude Code가 src/data/ 15개 파일과 src/config/ 3개 파일을 전부 읽고(15 tool calls, 63.5k 토큰, 1분 11초 소요) 실제 데이터의 shape을 분석한 뒤 TypeScript 인터페이스를 생성했다.

### 생성된 타입 (30+개)

| 타입 | 원본 | 필드 수 |
|------|------|---------|
| Building | data/buildings.js | name, rooms, occupied, type, feeType, fee, fixedFee, special, parkingTotal 등 |
| Tenant | data/tenants.js | id, name, building, room, phone, rent, mgmt, deposit, type, due, status, overdue, moveIn, expiry, prevUnpaid, currentUnpaid, overdueDays, carNumber?, carType? |
| BillingConfigItem | data/billingConfig.js | b, r, d, w, c, ea, es, ee, ep, ec, eu, ga, gp, gpr, gcr, gu |
| SettlementMasterEntry | data/billingMaster.js | type, feeType, feeRate, direction, settlementDay, periodType, vat, address, notes + 20개 이상 optional 필드 |
| PastTenant | data/pastTenants.js | name, phone, moveIn, moveOut, settlement 관련 25개+ 필드 |
| BuildingFloorData | data/buildingFloors.js | owner, phone, fee, account, start, address, floors |
| RoomMaster | data/roomMasterData.js | roomType, area, deposit, rent, mgmt, water, internet, cleanFee, commFee 등 |
| Vacancy | data/vacancies.js | building, room, type, deposit, rent, nego, mgmt, status 등 |
| CalendarEvent | data/calendarEvents.js | date, type, building?, room?, name, color |
| Staff, StaffRole | config/staff.js | id, name, phone, pw, roles, assignedBuildings |
| PatrolBuilding, PatrolRecord | data/patrolData.js | building, freq, assignee / id, date, status, photos |
| ASItem, ASStep | data/asItems.js | id, date, building, room, content, priority, status, steps[] |
| ExpenseCategory, SettlementExpense | data/settlementData.js | id, label, type / month, building, category, amount |
| ViewMode, MenuItem, MenuSection | config/navigation.js | 메뉴 구조 |
| ApiResponse\<T\>, PaginatedResponse\<T\>, ErrorResponse | (신규) | Phase 5 API 연결 대비 |

### 검증: `npm run build` 통과 (타입 파일 추가만, 기존 코드 미변경)

---

## Step 3-2: utils/ 전환 (4파일 + barrel)

### 전환 순서: 의존성 없는 것부터

1. **koreanSearch.js → .ts** — 파라미터/리턴 타입 추가. `getChosung(str: string): string`, `matchKorean(target: string, query: string): boolean`.
2. **useIsMobile.js → .ts** — `(breakpoint: number = 768): boolean`.
3. **useLocalStorage.js → .ts** — 제네릭 `<T>` 도입. `useLocalStorage<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>]`. React의 `Dispatch`, `SetStateAction` 타입을 명시적으로 import.
4. **helpers.js → .ts** — `import type { Building, Staff } from '../types'` 추가. `getStaffBuildings(staff: Staff | null): string[]`, `fmt(n: number | null | undefined): string`, `feeLabel(b: Building): string`.
5. **index.js → .ts** — barrel re-export 유지.

### 검증: `npm run build` 통과

---

## Step 3-3 + 3-4: data/ + config/ 전환 (21파일) — 병렬 실행

### 병렬 에이전트 구성

data/ 15파일과 config/ 5파일의 상호 의존성이 거의 없어서 Claude Code가 두 개의 sub-agent를 동시에 실행.

- **Data 에이전트**: 50 tool calls, 59.1k 토큰 소요
- **Config 에이전트**: 23 tool calls, 20.1k 토큰 소요

### data/ 전환 순서

leaf 파일(내부 import 없는 파일) 13개를 먼저 전환한 뒤, 의존성이 있는 patrolData.ts(buildings import), billingMaster.ts(가장 복잡) 순으로 진행.

전환 방식: `import type { X } from '../types'` 추가 + export 배열/객체에 타입 어노테이션 부착. 데이터 값은 한 글자도 변경하지 않음.

### config/ 전환

staff.ts(Staff[]), navigation.ts(MenuSection[]), collectionAssigneeMap.ts(Record<string, string>), accountConfig.ts(복잡한 중첩 객체), roomType.ts(런타임 mutation 패턴) 순으로 전환.

### 발생 문제: typecheck 에러 5건

병렬 전환 완료 후 `npx tsc --noEmit` 실행 시 에러 발생:

**에러 1-2: PastTenant.depositReturn / finalRefund 필수 필드**

```
src/data/pastTenants.ts — Type '{}' is not assignable to type 'PastTenant'
  Property 'depositReturn' is missing
```

실제 데이터에 퇴실 정산이 완료되지 않은 건이 존재해서 이 필드가 없는 레코드가 있었다. `depositReturn?: number`, `finalRefund?: number`로 optional 변경.

**에러 3: SettlementExpense.room 필수 필드**

건물 전체에 해당하는 비용 항목은 room이 없다. `room?: string`으로 optional 변경.

**에러 4: billingMaster.ts 354줄 산술 연산**

```typescript
// 원본: cfg.settlementDay - 1
// 문제: cfg.settlementDay 타입이 number | "말일" (union)이라 산술 불가
// 해결: (cfg.settlementDay as number) - 1 캐스팅
```

이 코드 분기에서는 `cfg.periodType`이 "custom"이 아닌 경우라 settlementDay가 항상 number이지만, 타입 시스템은 그걸 모른다. `as number` 캐스팅으로 해결. Phase 1에서 타입 가드로 개선 가능.

**에러 5: roomType.ts 타입 할당**

```typescript
// 원본: if (found) found.type = newType;
// 문제: found.type은 TenantType인데 newType은 string
// 해결: (found as any).type = newType;
```

런타임에 tenants 배열의 객체를 직접 mutate하는 레거시 패턴. Phase 5에서 API 전환 시 이 코드 자체가 제거될 예정.

### patrolData.ts Record 타입 추가

건물명 → 순찰 빈도/담당자/실적 매핑 객체 3개에 타입 어노테이션이 없어서 인덱스 접근 시 에러. `Record<string, number>`, `Record<string, string>`, `Record<string, { dates: string[]; status: string }>` 추가.

### billingMaster.ts — 프로젝트에서 가장 복잡한 파일

390줄. settlementMaster 객체에 42개 건물 각각의 정산 설정이 들어있고, optional 필드가 20개 이상. `SettlementMasterEntry` 인터페이스를 적용했다. `billingComposition` 같은 극도로 복잡한 중첩 객체(단기/일반임대/근생 별로 구조가 다름)는 `Record<string, any>`로 임시 처리하고 `// TODO: Phase 1에서 정확한 타입으로 교체` 주석을 남김.

### 검증: `npx tsc --noEmit` 에러 0개, `npm run build` 통과

---

## Step 3-5: components/ 전환 (10파일 + barrel)

### 작업 방식

Claude Code가 sub-agent를 띄워 10개 컴포넌트를 순차 전환. 44 tool calls, 67.4k 토큰, 10분 32초 소요. 각 컴포넌트마다: 파일 읽기 → Props interface 정의 → .jsx → .tsx 리네임 → 빌드 확인.

### 전환 결과

| 컴포넌트 | Props interface |
|----------|----------------|
| Field.tsx | `{ label: string; children: ReactNode; required?: boolean }` |
| SectionTitle.tsx | `{ children: ReactNode; sub?: string }` |
| StatusBadge.tsx | `{ status: string; label?: string }` |
| Card.tsx | `forwardRef<HTMLDivElement, CardProps>` 패턴. onClick, style, className 등 HTMLDivElement 속성 확장. |
| Table.tsx | 제네릭 `TableColumn<T>`, `TableProps<T>`. 컬럼 정의와 데이터 배열의 타입이 연동. |
| RoomTypeBadge.tsx | `{ building: string; room: string }` |
| ContractDropZone.tsx | `{ onDrop: (files: File[]) => void }` |
| PhotoDropZone.tsx | `{ photos: string[]; onAdd: (files: File[]) => void; onRemove: (index: number) => void }` |
| DunningTemplateSettings.tsx | 내부 state 타입 추가. 큰 컴포넌트라 여러 개의 로컬 인터페이스. |
| SettlementPrintView.tsx | `{ bs: any }`. 정산 결과 객체가 billingMaster에서 동적 생성되어 shape이 복잡. TODO 주석. |

### 검증: `npm run build` + `npx tsc --noEmit` 둘 다 통과

---

## Step 4: vite.config.js → vite.config.ts

### 변경 내용

1. 파일 리네임: `.js` → `.ts`
2. `import path from 'path'` 추가
3. `resolve.alias`에 `'@': path.resolve(__dirname, 'src')` 추가 (tsconfig.json의 paths와 매칭)
4. manualChunks 경로 업데이트: `'./src/data/tenants.js'` → `'./src/data/tenants.ts'`, `'./src/data/billingConfig.js'` → `'./src/data/billingConfig.ts'`
5. 기존 설정(react plugin, port 5173, strictPort) 유지

### 검증: `npm run build` 통과

---

## Step 5: 스모크 테스트 (2파일, 14개 테스트)

### src/utils/__tests__/koreanSearch.test.ts (7개 테스트)

- `getChosung('한지우')` → `'ㅎㅈㅇ'` (초성 추출)
- 비한글 문자 통과 (`'abc'` → `'abc'`)
- 빈 문자열 처리
- `matchKorean('한지우', 'ㅎㅈ')` → `true` (초성 매칭)
- `matchKorean('한지우', '한지')` → `true` (부분 문자열 매칭)
- `matchKorean('한지우', '김')` → `false` (불일치)
- `matchKorean('한지우', '')` → `true` (빈 쿼리는 전부 매칭)

### src/utils/__tests__/helpers.test.ts (7개 테스트)

- `fmt(1000000)` → `'1,000,000'` (한국 로케일 포맷)
- `fmt(null)` → `'0'`, `fmt(undefined)` → `'0'` (null safety)
- `fmt(0)` → `'0'`
- `feeLabel({ feeType: 'pct', fee: 0.05 })` → `'수수료 5.0%'`
- `feeLabel({ feeType: 'fixed', fixedFee: 300000 })` → `'정액 300,000원/월'`
- `feeLabel({ feeType: 'pct', fee: 0 })` → `''` (수수료 없음)

### 검증: `npm run test` — 14/14 통과

---

## ESLint 에러 해결 과정 (3단계)

### 1차: `no-undef` 에러 — pages/*.jsx에서 브라우저 전역 변수

`npm run lint` 첫 실행 시 pages/*.jsx에서 `document`, `setTimeout`, `window` 등이 `no-undef` 에러. ESLint의 recommended 규칙에 `no-undef`가 포함되는데, JS 파일에는 브라우저 globals가 선언되어 있지 않기 때문.

**해결:** JS/JSX 블록에 `languageOptions.globals`로 브라우저 전역 변수 30개+ 등록 (window, document, navigator, localStorage, setTimeout, fetch, URL, FileReader, Blob, HTMLElement 등). 추가로 `no-undef: 'off'` 설정.

### 2차: `react-hooks/exhaustive-deps` 정의 없음 — App.jsx

App.jsx에 `// eslint-disable-next-line react-hooks/exhaustive-deps` 주석이 5곳 있는데, JS/JSX 블록에 react-hooks 플러그인이 로드되지 않아 "Definition for rule 'react-hooks/exhaustive-deps' was not found" 에러 4건 발생.

**해결:** JS/JSX 블록에 `plugins: { 'react-hooks': reactHooksPlugin }` 추가. App.jsx를 수정하지 않고 ESLint 설정에서 플러그인을 로드하는 것으로 해결.

### 3차: data 파일 원본 코드의 정규식/표현식

billingMaster.ts에서 `no-useless-escape` (불필요한 정규식 이스케이프), `@typescript-eslint/no-unused-expressions` 에러. 원본 데이터 파일의 코드를 수정할 수 없으므로 `src/data/**/*.ts` 전용 블록에서 해당 규칙 off.

### 최종 결과: 에러 0개, 경고 21개 (전부 `@typescript-eslint/no-explicit-any`)

경고 21개는 any 타입을 사용한 곳. 점진적 전환 과정에서 불가피한 부분이며 Phase 1~5에서 순차적으로 제거 예정.

---

## Prettier 포맷 적용

`npm run format:check` 첫 실행 시 전환된 TS/TSX 파일 대부분이 Prettier 규칙 미준수. `npm run format` 실행으로 전체 자동 포맷 적용. 이후 `npm run format:check` 통과.

---

## 최종 검증 (5개 명령 전부 통과)

```
npm run build          → ✓ built in 4.52s
npm run typecheck      → (에러 0개, 출력 없음)
npm run lint           → ✖ 21 problems (0 errors, 21 warnings)
npm run format:check   → All matched files use Prettier code style!
npm run test           → 2 test files | 14 tests passed
```

---

## 산출물 요약

### 신규 생성 (12개)

| 파일 | 설명 |
|------|------|
| tsconfig.json | TypeScript 설정 (strict + allowJs + paths) |
| eslint.config.js | ESLint flat config (TS/Data/JS 3블록 분리) |
| .prettierrc | Prettier 포맷 규칙 |
| .prettierignore | Prettier 제외 대상 |
| vitest.config.ts | Vitest 테스트 설정 |
| .env.example | 환경 변수 템플릿 |
| src/types/index.ts | 도메인 타입 30+개 (434줄) |
| src/test/setup.ts | 테스트 셋업 (@testing-library/jest-dom) |
| src/utils/__tests__/koreanSearch.test.ts | 초성 검색 테스트 7개 |
| src/utils/__tests__/helpers.test.ts | 포맷/수수료 테스트 7개 |

### 전환 (37개 파일)

| 디렉토리 | 파일 수 | 주요 변경 |
|----------|---------|----------|
| src/utils/ | 5 (4 + barrel) | 파라미터/리턴 타입 추가, 제네릭 도입 |
| src/data/ | 16 (15 + barrel) | import type + export 타입 어노테이션. 데이터 값 미변경. |
| src/config/ | 6 (5 + barrel) | Staff[], MenuSection[] 등 타입 적용 |
| src/components/ | 11 (10 + barrel) | Props interface 정의, .jsx → .tsx |
| vite.config | 1 | .js → .ts, @/ alias 추가, manualChunks 경로 업데이트 |

### 수정 (2개)

- package.json: playwright 이동 + devDependencies 추가 + scripts 추가
- .gitignore: .env 관련 항목 추가

### 미수정 (절대 원칙 준수)

- src/pages/*.jsx — 25개 페이지 전부 미수정
- src/App.jsx — 미수정
- src/main.jsx — 미수정
- src/data/ 파일 데이터 값 — 미변경 (타입 어노테이션만 추가)