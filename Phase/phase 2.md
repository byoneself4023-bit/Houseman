# UI 업그레이드 — 실행 결과 분석

---

## 실행 환경

- Phase 0~1 완료 상태: TypeScript, ESLint, Prettier, Vitest, React Router v7, Zustand, TanStack Query
- 100% 인라인 스타일, CSS 파일 없음 (src/index.css 미존재)
- 공유 컴포넌트 10개, 레이아웃 6개 파일
- 절대 원칙: pages/*.jsx 미수정. 공유 컴포넌트 Props API 하위 호환 유지.

---

## Step 1: Tailwind CSS v4 + shadcn/ui 설치

### 설치 패키지

devDependencies: tailwindcss, @tailwindcss/postcss, postcss

dependencies: tailwind-merge, clsx, class-variance-authority, tw-animate-css, lucide-react, sonner

### shadcn/ui 초기화

components.json 수동 생성 (interactive CLI 대신). rsc: false, tsx: true, baseColor: neutral, cssVariables: true.

src/lib/utils.ts 생성 — `cn()` 유틸 함수 (clsx + tailwind-merge 조합).

### shadcn 프리미티브 17개 설치

button, badge, card, table, input, label, select, textarea, dialog, sheet, separator, tabs, tooltip, skeleton, avatar, dropdown-menu, alert-dialog → src/components/ui/ 디렉토리에 자동 생성.

### postcss.config.js 생성

@tailwindcss/postcss 플러그인 등록.

### 검증: `npm run build` 통과

---

## Step 2: 디자인 토큰 + 글로벌 스타일 (src/index.css)

### CSS 엔트리포인트 생성

src/index.css 신규 생성. Tailwind v4 directives + oklch 색상 토큰 + 다크 모드 커스텀 variant 포함.

src/main.tsx에 `import './index.css'` 추가.

### shadcn 기본 토큰

oklch 색상 체계로 --background, --foreground, --card, --primary, --destructive, --border, --ring 등 정의. shadcn 컴포넌트가 이 토큰을 참조.

### Houseman 커스텀 색상

기존 인라인 스타일에서 반복되는 색상값을 CSS 변수로 정의:

- `--color-hm-sidebar: #1B1F2E` (사이드바 배경)
- `--color-hm-sidebar-active: #2A3352` (사이드바 활성)
- `--color-hm-text: #1A1D23` (본문 텍스트)
- `--color-hm-border: #E8ECF0` (보더)
- `--color-hm-bg: #F3F4F8` (앱 배경)
- `--color-hm-success: #059669` / `--color-hm-danger: #DC2626` / `--color-hm-warning: #EA580C` (상태 색상)

### 글로벌 스타일 이전

AppLayout.tsx의 `<style>` 태그 내용을 index.css로 이동:

- Pretendard 폰트 @import
- 스크롤바 커스텀 (width: 6px, thumb: #D1D5DB)
- @keyframes fadeIn (opacity + translateY 전환)

### 검증: `npm run build` 통과

---

## Step 3: 공유 컴포넌트 업그레이드 (6개)

모든 컴포넌트에서 **기존 Props interface를 100% 유지**하고 내부 구현만 인라인 스타일 → Tailwind 클래스로 전환.

### Card.tsx

인라인 스타일(background, borderRadius, border, boxShadow, transition) 제거. Tailwind 클래스로 교체: `bg-white rounded-xl border border-[#E8ECF0] p-5 shadow-sm transition-shadow duration-200`. onClick 있을 때 `cursor-pointer hover:shadow-md` 추가. onMouseEnter/onMouseLeave 핸들러 제거 (Tailwind hover로 대체). style prop은 그대로 merge 유지 (pages에서 style override 사용).

### StatusBadge.tsx

13개 상태별 색상 매핑을 인라인 객체(`{ bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' }`)에서 Tailwind 클래스 객체(`{ bg: 'bg-[#ECFDF5]', text: 'text-[#059669]', border: 'border-[#A7F3D0]' }`)로 전환. 색상값 자체는 동일. statusMap을 컴포넌트 외부 상수로 분리 (렌더링마다 재생성 방지).

### Table.tsx

제네릭 `TableColumn<T>`, `TableProps<T>` 유지. 테이블 래퍼: `overflow-x-auto rounded-[10px] border border-[#E8ECF0]`. 헤더: `bg-[#F7F8FA]` + `font-bold text-[11px] text-[#5F6577]`. 행 hover: `hover:bg-[#F9FAFB]` + `transition-colors duration-100`. onMouseEnter/onMouseLeave 제거. col.width는 style prop으로 유지 (Tailwind에서 동적 width 처리 불가).

### Field.tsx

`mb-3.5` + `text-[11px] font-bold text-[#5F6577] mb-[5px]` + required 별표 `text-[#DC2626]`. inputStyle export 동일 유지.

### SectionTitle.tsx

`text-[17px] font-extrabold text-[#1A1D23] tracking-tight` + sub `text-xs text-[#8F95A3] mt-0.5`.

### RoomTypeBadge.tsx

`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded`. 동적 색상(cfg.bg, cfg.c)은 style prop으로 유지 (ROOM_TYPE_CFG의 색상이 런타임 값이라 Tailwind 클래스로 변환 불가).

### 검증: `npm run build` 통과

---

## Step 4: 신규 공통 컴포넌트 (3개 + Toaster)

### LoadingSkeleton.tsx

shadcn Skeleton 기반. CardSkeleton(3줄 스켈레톤), TableSkeleton(헤더+5행), DetailSkeleton(좌측 폼+우측 패널) export. Phase 5 TanStack Query isLoading 연결 대비.

### EmptyState.tsx

icon(ReactNode) + title(string) + description(string?) + action(ReactNode?). 텍스트 가운데 정렬. Phase 5 빈 데이터 화면용.

### ConfirmDialog.tsx

shadcn AlertDialog 기반. open, onOpenChange, title, description, onConfirm, variant('default' | 'destructive'). variant가 destructive면 확인 버튼이 빨간색. Phase 5 퇴실/삭제 확인용.

### Toaster 설정

src/main.tsx에 sonner의 `<Toaster position="top-right" richColors />` 추가. Phase 5 SSE 알림 표시 대비.

### 검증: `npm run build` 통과

---

## Step 5: 레이아웃 업그레이드 (5개)

### AppLayout.tsx

`<style>` 태그 제거 (index.css로 이동됨). 인라인 스타일 → Tailwind 클래스 전환: `flex h-screen bg-[#F3F4F8] overflow-hidden`. 콘텐츠 영역 padding: `p-6` (데스크톱) / `p-3 pb-[72px]` (모바일). fadeIn 애니메이션은 style prop 유지 (Tailwind에서 커스텀 keyframe 참조 복잡).

### AuthGate.tsx

로그인 폼 전체 Tailwind 전환. 배경: `bg-gradient-to-br from-[#1B1F2E] to-[#2A3352]`. 카드: `w-[380px] p-9 rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)]`. Input: `w-full px-4 py-3 rounded-[10px] border-[1.5px] border-[#E0E3E9] focus:border-[#3B82F6]`. 테스트 계정 그리드: `grid grid-cols-2 gap-1` + `hover:bg-[#EFF6FF]`. onFocus/onBlur 인라인 핸들러 제거 (Tailwind focus: pseudo-class로 대체).

### Sidebar.tsx

lucide-react 아이콘 22개 매핑: Calendar, Building2, User, Package, RefreshCw, Mail, Landmark, ClipboardList, CreditCard, Coins, Zap, SquareParking, Wrench, Footprints, MapPin, Banknote, Home, Users, FolderUp, Globe, CheckSquare, BarChart3. 접기 버튼: PanelLeftClose / PanelLeft 아이콘. 설정 섹션: Settings 아이콘. 메뉴 hover: `hover:bg-[#22273A] transition-colors duration-150`. 역할 탭 hover: `hover:bg-[#2A3352]/50 transition-colors`. onMouseEnter/onMouseLeave 핸들러 전부 제거.

### TopBar.tsx

lucide Bell 아이콘 (기존 🔔 이모지 대체). 배지 카운트: `absolute -top-0.5 -right-1 w-3.5 h-3.5 rounded-full bg-[#EF4444]`. Staff Filter Banner: `bg-gradient-to-r from-[#FEF3C7] to-[#FFF7ED]`.

### MobileNav.tsx

터치 피드백: `active:scale-95 transition-transform duration-100`. 더보기 오버레이: `fixed inset-0 bg-black/30 z-[998]`. 바텀탭: `fixed bottom-0 h-14 bg-white border-t z-[999]`. safe-area-inset-bottom은 style prop 유지 (Tailwind에서 env() 지원 제한).

### 검증: `npm run build` 통과

---

## Step 6: 레이아웃 세련화 (Phase 2 확장)

pages를 건드리지 않으면서 레이아웃만으로 첫인상을 바꾸는 추가 작업. AuthGate.tsx, Sidebar.tsx, TopBar.tsx 3파일 + index.css만 수정.

### AuthGate.tsx — 2단 레이아웃

기존 1단 카드(그라데이션 배경 + 흰색 카드 380px)를 2단 레이아웃으로 전환. 좌측 브랜드 패널(w-[480px], 그라데이션 배경, Building2 아이콘 + "HOUSEMAN" + "건물관리의 새로운 기준" 슬로건 + © 2026 Houseman) + 우측 폼 패널(bg-white, shadcn Input/Button 적용). 모바일(768px 미만)에서는 브랜드 패널 숨김 → 기존과 동일한 1단 레이아웃 자동 전환.

로그인 로직(handleLogin, setLoggedInId, 테스트 계정 클릭 → 자동 채움) 변경 없음.

### Sidebar.tsx — 활성 인디케이터 + 밀도 완화

활성 메뉴: 기존 파란 점(5px dot) → 좌측 3px 파란 바 인디케이터(`border-l-[3px] border-[#3B82F6]`). 비활성 메뉴에도 `border-l-[3px] border-transparent` 적용하여 정렬 유지. 비활성 아이콘 색상 #9CA3B0 → #A0AEC0 (밝게 조정). 메뉴 간격 mb-px → mb-0.5 (밀도 완화). 섹션 헤더 tracking-[0.1em] → tracking-[0.15em]. 역할 탭 활성 시 하단 2px 파란 바(`border-b-2 border-b-[#3B82F6]`). 접기 버튼에 title 속성(브라우저 기본 tooltip) 추가. 하단에 "v2.0" 텍스트(8px, muted).

renderMenuItem 헬퍼 함수로 중복 코드 제거 (설정 섹션 + 일반 섹션 메뉴 아이템 렌더링 통합).

메뉴 구조, 역할 탭, 접기/펼치기, 배지 카운트 기능 변경 없음.

### TopBar.tsx — Avatar + 역할 표시 삭제

"👤 박종호 대표" 텍스트 → shadcn Avatar(이니셜 1글자, w-7 h-7, bg-[#3B82F6] text-white) + 이름 조합. 우측 끝 "🏗️ 관리" 역할 배지 삭제 (사이드바 역할 탭으로 충분). viewModes import 제거. 날짜/시간 사이 세로 구분선(`w-px h-3 bg-[#E0E3E9]`) 추가. 데스크톱 높이 h-14(56px) → h-[60px]. 미세 그림자 `shadow-[0_1px_3px_rgba(0,0,0,0.05)]` 추가.

Bell 아이콘에 `hover:animate-bell-ring` 추가 — hover 시 좌우 미세 흔들림.

시간 표시, Staff Filter Banner, Bell 배지 기능 변경 없음.

### index.css — bell-ring 애니메이션

@keyframes bell-ring 추가 (0→15deg→-15deg→8deg→-8deg→0, 0.6초). @theme inline에 --animate-bell-ring 변수 등록.

---

## 발생 문제 및 해결 (3건)

### 1. Tailwind v4 utility 클래스 전부 무효화 (근본 원인)

index.css에 추가한 `* { padding: 0; margin: 0; }` 글로벌 리셋이 Tailwind v4의 @layer 기반 utility 클래스보다 CSS 우선순위가 높아서, `py-2`, `px-3`, `py-[9px]` 등 모든 padding/margin 클래스가 0px로 덮어써짐. 이전 인라인 스타일은 CSS보다 우선순위가 높아서 이 문제가 없었지만, Tailwind 클래스로 전환하면서 발생.

**해결:** `* { box-sizing: border-box; margin: 0; padding: 0; }` 블록 제거. Tailwind v4 preflight가 이미 동일한 리셋을 @layer 내에서 처리하므로 중복이고 충돌.

Puppeteer로 sidebar width(230px), menu padding-top(9px), padding-left(12px), gap(10px), TopBar height(56px), shadow(none) 전부 검증.

### 2. Sidebar 아이콘/패딩 불일치

lucide 아이콘 size를 17px로 설정했으나 원본 App.jsx는 fontSize: 16px. 메뉴 아이템 py-2(8px)가 원본 9px와 불일치. 설정 토글 접힌 상태 py-2.5(10px)가 원본 9px와 불일치.

**해결:** lucide icon size 17→16, py-2→py-[9px] (2곳), py-2.5→py-[9px] (1곳).

### 3. TopBar 불필요한 스타일 추가

shadow-sm과 Bell 아이콘 래퍼의 p-1 + hover 효과가 원본에 없는 스타일.

**해결:** shadow-sm 제거, Bell 아이콘 래퍼에서 p-1 + rounded-md + hover:bg 제거.

### 4. 콘텐츠 영역 max-width 조정

원본 App.jsx의 maxWidth: 1200px가 넓은 화면에서 우측에 큰 빈 공간을 만듦.

**해결:** `max-w-[1200px]` → `max-w-[1600px] mx-auto`. 넓은 화면에서 콘텐츠가 1600px까지 확장되고 가운데 정렬.

### 5. useIsMobile 모바일 감지 불안정

useIsMobile 훅이 window.addEventListener('resize')를 사용해서 Chrome DevTools 디바이스 토글, 일부 브라우저에서 resize 이벤트가 누락됨.

**해결:** window.matchMedia API로 교체. 브레이크포인트를 넘을 때만 이벤트 발생 (매 픽셀 resize보다 성능 우수). DevTools 디바이스 토글, 화면 방향 전환 등 모든 뷰포트 변경에 안정적 반응.

---

## 최종 검증 결과

| 명령 | 결과 |
|------|------|
| `npm run build` | ✅ 9.08초 성공 |
| `npm run typecheck` | ✅ 에러 0개 |
| `npm run lint` | ✅ 에러 0개 (경고는 기존 any 타입) |
| `npm run test` | ✅ 14/14 통과 |

---

## 브라우저 테스트 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | lucide 아이콘 적용 | ✅ |
| 2 | 메뉴 hover 전환 | ✅ |
| 3 | 활성 메뉴 파란 점 | ✅ |
| 4 | 접기 버튼 아이콘 | ✅ |
| 5 | 메뉴 간격 동일 | ✅ |
| 6 | TopBar 그림자 없음 | ✅ |
| 7 | Bell 아이콘 | ✅ |
| 8 | 배지 숫자 | ✅ |
| 9 | 카드 hover | ✅ |
| 10 | 테이블 행 hover | ✅ |
| 11 | 로그인 카드 폼 | ✅ |
| 12 | 모바일 바텀탭 | ✅ |
| 13 | 우측 빈 공간 축소 | ✅ |
| 14 | 메뉴 이동 정상 | ✅ |
| 15 | 역할 탭 전환 | ✅ |
| 16 | 데이터 표시 | ✅ |

---

## Phase 2에서 화면이 크게 안 달라진 이유

pages/*.jsx를 안 건드렸기 때문이다. 화면의 90%가 페이지 내부 콘텐츠인데, 그 안의 인라인 스타일은 Phase 5에서 페이지를 .tsx로 분해할 때 Tailwind로 전환한다. Phase 2에서는 공유 컴포넌트(Card, Table, StatusBadge, Field, SectionTitle, RoomTypeBadge)와 레이아웃(Sidebar, TopBar, AuthGate, AppLayout, MobileNav)만 Tailwind로 전환한 것이다.

Phase 2 확장(B 옵션)에서 로그인 화면 + 사이드바를 세련되게 만드는 추가 작업을 진행하면 레이아웃 영역에서 첫인상이 달라진다. 그 후 Phase 5에서 페이지 내부까지 전체 UI가 바뀐다.

---

## 산출물 요약

### 신규 생성

| 파일 | 설명 |
|------|------|
| postcss.config.js | PostCSS 설정 |
| components.json | shadcn 설정 |
| src/index.css | Tailwind directives + 디자인 토큰 + 글로벌 스타일 |
| src/lib/utils.ts | cn() 유틸 (shadcn 필수) |
| src/components/ui/* | shadcn 프리미티브 17개 |
| src/components/LoadingSkeleton.tsx | 로딩 스켈레톤 3종 |
| src/components/EmptyState.tsx | 빈 데이터 안내 |
| src/components/ConfirmDialog.tsx | 확인 다이얼로그 |

### 수정 (인라인 → Tailwind 전환)

| 파일 | 변경 |
|------|------|
| src/components/Card.tsx | hover:shadow-md, onMouseEnter/Leave 제거 |
| src/components/StatusBadge.tsx | 13색상 Tailwind 클래스 맵 |
| src/components/Table.tsx | hover:bg-[#F9FAFB] 행 호버 |
| src/components/Field.tsx | Tailwind 클래스 |
| src/components/SectionTitle.tsx | tracking-tight font-extrabold |
| src/components/RoomTypeBadge.tsx | Tailwind + style prop (동적 색상) |
| src/layouts/AppLayout.tsx | style 태그 제거, max-w-[1600px] |
| src/layouts/AuthGate.tsx | Tailwind 로그인 폼, focus 상태 |
| src/layouts/Sidebar.tsx | lucide 22아이콘, hover transition |
| src/layouts/TopBar.tsx | lucide Bell, Tailwind 전환 |
| src/layouts/MobileNav.tsx | active:scale-95 터치 피드백 |
| src/main.tsx | CSS import + Toaster 추가 |
| src/components/index.ts | 신규 컴포넌트 export 추가 |
| src/utils/useIsMobile.ts | resize → matchMedia 전환 |

### 미수정 (절대 원칙 준수)

- src/pages/*.jsx — 25개 페이지 전부 미수정
- src/pages/wrappers/*.tsx — 전부 미수정
- src/data/, src/config/, src/stores/, src/hooks/ — 미수정
