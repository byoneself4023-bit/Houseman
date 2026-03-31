# Houseman 개발 환경 셋업 가이드

Windows 데스크탑에서 코드를 받아 실행하고, 기능을 추가하는 전체 과정입니다.

---

## 1. 환경 설정

### 1-1. Git 설치

https://git-scm.com/download/win 에서 다운로드 후 설치 (기본 옵션 그대로 Next).

설치 확인 (PowerShell 또는 Git Bash):

```bash
git --version
# git version 2.4x.x 이상이면 OK
```

### 1-2. 저장소 클론

```bash
cd C:\Users\%USERNAME%\Desktop
git clone https://github.com/your-org/houseman.git
cd houseman
```

> 실제 저장소 URL은 GitHub 레포 주소로 교체하세요.

### 1-3. Node.js 20 LTS 설치

https://nodejs.org/ 에서 **20 LTS** 다운로드 후 설치 (기본 옵션).

설치 확인:

```bash
node -v
# v20.x.x

npm -v
# 10.x.x
```

### 1-4. (선택) Docker Desktop 설치

풀스택 모드(BE + DB)로 실행할 때만 필요합니다. 프론트만 볼 때는 불필요.

https://www.docker.com/products/docker-desktop/ 에서 다운로드 후 설치.
설치 후 재부팅 → Docker Desktop 실행 → 트레이 아이콘이 초록색이면 준비 완료.

```bash
docker --version
# Docker version 2x.x.x
```

---

## 2. 실행 방법

### A) 프론트만 실행 (localStorage 모드)

DB/서버 없이 프론트엔드만 실행합니다. 데이터는 브라우저 localStorage에 저장됩니다.

```bash
# 1. 프로젝트 폴더로 이동
cd C:\Users\%USERNAME%\Desktop\houseman

# 2. 패키지 설치 (최초 1회, 또는 package.json 변경 시)
npm install

# 3. 환경변수 파일 생성
copy .env.example .env.local
```

`.env.local` 파일을 메모장으로 열어서 아래 내용으로 수정:

```
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_API=false
```

```bash
# 4. 개발 서버 시작
npm run dev
```

브라우저에서 **http://localhost:5173** 접속.
로그인: 아무 직원 이름 + 비밀번호 입력.

> 종료: 터미널에서 `Ctrl + C`

---

### B) 풀스택 실행 (BE + DB 포함)

Docker Desktop이 실행 중이어야 합니다.

```bash
# 1. 프로젝트 폴더로 이동
cd C:\Users\%USERNAME%\Desktop\houseman

# 2. 전체 서비스 시작 (DB + 서버 + 프론트)
docker compose up -d
```

시작 후 약 30초 대기. 상태 확인:

```bash
docker compose ps
# houseman-db       running (healthy)
# houseman-server   running
# houseman-client   running
```

| 서비스 | 주소 | 설명 |
|--------|------|------|
| 프론트엔드 | http://localhost:3000 | React 앱 |
| 백엔드 API | http://localhost:8080 | Spring Boot |
| API 문서 | http://localhost:8080/swagger-ui.html | Swagger UI |
| PostgreSQL | localhost:5434 | DB (user: houseman / pw: houseman) |

```bash
# 종료
docker compose down

# DB 데이터까지 완전 초기화
docker compose down -v
```

> `.env.local`에서 `VITE_USE_API=true`로 설정되어 있어야 API 모드로 동작합니다.

---

## 3. 기능 추가 시 주의사항

### 아키텍처 규칙

| 규칙 | 설명 |
|------|------|
| **wrapper + props 패턴 유지** | 각 페이지는 Wrapper 컴포넌트에서 데이터를 fetch하고 props로 전달. Zustand로 전환 금지. |
| **도메인 로직 불가침** | 정산/연체/청구/일할 계산 공식은 절대 수정 안 함. `billingMaster`, `billingConfig` 등 원본 기준. |
| **alert/confirm/prompt 금지** | `toast()` (sonner) 또는 커스텀 `<Modal>` 컴포넌트만 사용. |
| **모달 규격** | ESC 닫기 + 배경 클릭 닫기 + X 버튼 필수 포함. |
| **새 코드는 Tailwind** | 인라인 `style={{}}` 금지. Tailwind CSS 클래스만 사용. |

### 새 페이지 추가 절차

4곳을 모두 수정해야 페이지가 정상 동작합니다:

**1) 페이지 컴포넌트 생성**

```
src/pages/MyNewPage.tsx
```

**2) Wrapper 생성** (API에서 데이터 fetch → props 전달)

```
src/pages/wrappers/MyNewPageWrapper.tsx
```

```typescript
import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components';
// 필요한 query hook import

const MyNewPage = React.lazy(() =>
  import('@/pages/MyNewPage').then((m) => ({ default: m.MyNewPage })),
);

export const MyNewPageWrapper = () => {
  // const { data } = useMyQuery();
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MyNewPage /* data={data} */ />
    </Suspense>
  );
};
```

**3) 라우트 등록** (`src/router.tsx`)

```typescript
const MyNewPageWrapper = React.lazy(() =>
  import('@/pages/wrappers/MyNewPageWrapper').then((m) => ({ default: m.MyNewPageWrapper })),
);

// children 배열 안에 추가:
{ path: 'my-new-page', element: <MyNewPageWrapper /> }
```

**4) 사이드바 메뉴 등록** (`src/config/navigation.ts`)

```typescript
// menuSections 해당 섹션의 items 배열에 추가:
{ id: 'my-new-page', icon: '🆕', label: '새 페이지' }
```

`src/layouts/Sidebar.tsx`의 `iconMap`에 lucide-react 아이콘 매핑 추가:

```typescript
'my-new-page': FileText,  // lucide-react에서 import
```

`src/config/navigation.ts`의 `pageIdToPath`에 경로 매핑 추가:

```typescript
'my-new-page': '/my-new-page',
```

### 브랜치 규칙

```bash
# master에 직접 push 금지. 반드시 feature 브랜치에서 작업.

# 1. 새 브랜치 생성
git checkout -b feature/my-feature

# 2. 작업 후 커밋
git add -A
git commit -m "feat: 새 기능 설명"

# 3. 원격에 push
git push -u origin feature/my-feature

# 4. GitHub에서 Pull Request 생성 → master로 머지
```

PR을 올리면 CI가 자동으로 다음을 검증합니다:
- TypeScript 타입 체크
- ESLint 린트
- Vitest 단위 테스트
- Vite 프로덕션 빌드
- 백엔드 Gradle 테스트 (BE 코드 변경 시)

### 코드 작성 규칙

| 영역 | 위치 | 설명 |
|------|------|------|
| API 응답 타입 | `src/types/api.ts` | BE에서 오는 JSON 형태 정의 |
| 변환 함수 | `src/lib/transforms.ts` | API 응답 → FE 타입 변환 (예: `contractToTenant()`) |
| Query 훅 | `src/hooks/queries/` | TanStack Query 커스텀 훅 (예: `useContractQuery.ts`) |
| 디자인 토큰 | `src/index.css` | `--color-hm-*` 커스텀 색상 (Tailwind에서 `text-hm-*`로 사용) |
| AI 코딩 규칙 | `CLAUDE.md` | Claude Code 사용 시 자동 적용되는 프로젝트 규칙 |

### 검증 체크리스트 (PR 전 필수)

```bash
# 1. 타입 에러 확인 (0 에러여야 함)
npx tsc --noEmit

# 2. 프로덕션 빌드 (성공해야 함)
npm run build

# 3. E2E 테스트 (44/44 통과해야 함)
npx playwright test

# 4. BE 테스트 (BE 코드 수정 시)
cd houseman-server
./gradlew test
```

> BuildingsWrapper 관련 TS 에러는 기존 허용된 것. 그 외 새 에러만 수정하면 됩니다.

---

## 4. 디렉토리 구조 요약

```
houseman/
├── src/                          # 프론트엔드 소스
│   ├── pages/                    # 페이지 컴포넌트 (27개)
│   │   ├── calendar/             #   캘린더 (13개 하위 컴포넌트)
│   │   ├── tenants/              #   임차인 (7개 하위 컴포넌트)
│   │   ├── buildings/detail/     #   건물 상세 (6개 하위 컴포넌트)
│   │   └── wrappers/             #   데이터 fetch용 Wrapper
│   ├── hooks/queries/            # TanStack Query 훅 (11개)
│   ├── lib/
│   │   ├── api.ts                #   HTTP 클라이언트 (get/post/put/delete)
│   │   └── transforms.ts         #   API ↔ FE 타입 변환 함수
│   ├── types/
│   │   ├── api.ts                #   API 응답 타입 정의
│   │   └── index.ts              #   FE 도메인 타입
│   ├── components/               # 공유 컴포넌트 (Card, Modal, Table 등)
│   ├── layouts/                  # AppLayout, Sidebar, TopBar, MobileNav
│   ├── config/                   # navigation.ts, billingMaster 등
│   └── index.css                 # Tailwind 설정 + 디자인 토큰
│
├── houseman-server/              # 백엔드 (Spring Boot + Kotlin)
│   └── src/main/kotlin/com/houseman/
│       ├── domain/               #   도메인별 패키지 (contract, billing 등)
│       ├── global/               #   공통 (security, error, config)
│       └── infra/                #   스케줄러, 외부 연동
│
├── e2e/                          # Playwright E2E 테스트
├── docker-compose.yml            # DB + BE + FE 통합 실행
├── CLAUDE.md                     # AI 코딩 규칙 (Claude Code용)
├── .env.example                  # 환경변수 템플릿
└── .github/workflows/            # CI/CD (ci.yml, deploy-pages.yml)
```

---

## 5. 현재 미완성 기능 (TODO)

아래 항목은 BE API는 존재하지만 FE 연동이 완전하지 않은 부분입니다.

| 항목 | 현재 상태 | 필요 작업 |
|------|-----------|-----------|
| `addBilling` mutation | API shape 불일치 | `transforms.ts`에 변환 함수 추가 + mutation 훅 수정 |
| `billingEngine` I/O | stub 상태 | BE `/api/billing/generate` 응답을 FE billingEngine 입력 형태로 변환 |
| MoveOutLinkPage BE endpoint | FE는 `/api/calendar/:id`로 호출 중 | 공개 API `GET/PUT /api/move-out-link/:eventId` 신규 생성 |
| MeterUpload BE endpoint | FE 파싱만 구현 | `POST /api/upload/meter` 엔드포인트 생성 + 검침값 DB 저장 |
| `hm_lateFeeOverrides` | localStorage 직접 읽기 | BE에 연체료 override CRUD API 추가 + query 훅 연결 |
| `hm_buildingData` | localStorage 직접 읽기 | `useBuildingQuery` 훅으로 전환 (building detail API 활용) |

---

## 자주 쓰는 명령어 모음

```bash
# 개발 서버 시작
npm run dev

# 타입 체크
npx tsc --noEmit

# 빌드
npm run build

# E2E 테스트
npx playwright test

# E2E 테스트 (브라우저 UI 보면서)
npx playwright test --ui

# 린트
npm run lint

# 포맷팅
npm run format

# Docker 전체 시작
docker compose up -d

# Docker 로그 확인
docker compose logs -f server

# Docker 종료
docker compose down

# BE 테스트
cd houseman-server && ./gradlew test

# Git: 현재 변경사항 확인
git status

# Git: 브랜치 목록
git branch -a
```
