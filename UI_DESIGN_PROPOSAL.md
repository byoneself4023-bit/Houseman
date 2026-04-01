# Houseman UI Design Renewal Proposal

> **원칙:** 기능/워크플로우 변경 없음. CSS/Tailwind/shadcn 변경만.
> **목표:** 모던 + 신뢰감(부동산/금융) + 눈 피로도 최소화(장시간 사용)

---

## 1. 색상 시스템

### Before (현재)

- `--color-hm-blue: #3B82F6` (Tailwind blue-500) — 범용적이고 브랜드 차별성 없음
- 시맨틱 색상 3개만 정의 (success/warning/danger), info 없음
- 그레이 스케일이 5개 토큰에 산발적 분포 (`hm-text`, `hm-text-muted`, `hm-text-sub`, `hm-border`, `hm-input-border`)
- 하드코딩 hex값 다수 (#DC2626 112회, #059669 67회 등) — 토큰 미사용

### After (제안)

**브랜드 컬러: Indigo-Blue `#4361EE`**

부동산/금융 도메인에 맞는 차분하면서 신뢰감 있는 인디고 블루. 기존 #3B82F6보다 채도를 약간 낮추고 색상을 보라 방향으로 이동.

```css
/* Brand */
--color-hm-primary: #4361EE;
--color-hm-primary-hover: #3A56D4;
--color-hm-primary-light: #EEF2FF;    /* 배경, 선택 상태 */

/* Semantic 4색 */
--color-hm-success: #16A34A;           /* green-600 — 정상, 완료, 수금 */
--color-hm-success-bg: #F0FDF4;
--color-hm-success-border: #BBF7D0;

--color-hm-warning: #D97706;           /* amber-600 — 청구, 예정, 대기 */
--color-hm-warning-bg: #FFFBEB;
--color-hm-warning-border: #FDE68A;

--color-hm-danger: #DC2626;            /* red-600 — 연체, 도래, 높음 */
--color-hm-danger-bg: #FEF2F2;
--color-hm-danger-border: #FECACA;

--color-hm-info: #0284C7;             /* sky-600 — 관심, 낮음, 안내 */
--color-hm-info-bg: #F0F9FF;
--color-hm-info-border: #BAE6FD;

/* Gray Scale 7단계 */
--color-hm-gray-950: #0F172A;          /* 최진한 — 페이지 타이틀 */
--color-hm-gray-800: #1E293B;          /* 본문 텍스트 */
--color-hm-gray-600: #475569;          /* 보조 텍스트 */
--color-hm-gray-500: #64748B;          /* 비활성 텍스트 */
--color-hm-gray-300: #CBD5E1;          /* 비활성 border */
--color-hm-gray-200: #E2E8F0;          /* 구분선, border */
--color-hm-gray-100: #F1F5F9;          /* 섹션 배경 */
--color-hm-gray-50: #F8FAFC;           /* 페이지 배경 */
```

**기존 토큰 매핑 (하위호환):**

| 기존 토큰 | 새 토큰 |
|-----------|---------|
| `hm-blue` | `hm-primary` |
| `hm-blue-dark` | `hm-primary-hover` |
| `hm-blue-bg` | `hm-primary-light` |
| `hm-text` (#1A1D23) | `hm-gray-800` (#1E293B) |
| `hm-text-muted` (#8F95A3) | `hm-gray-500` (#64748B) |
| `hm-text-sub` (#5F6577) | `hm-gray-600` (#475569) |
| `hm-bg` (#F3F4F8) | `hm-gray-50` (#F8FAFC) |
| `hm-border` (#E8ECF0) | `hm-gray-200` (#E2E8F0) |
| `hm-input-border` (#E0E3E9) | `hm-gray-200` (#E2E8F0) 통합 |

### 변경 파일
- `src/index.css` — `@theme inline` 블록 내 토큰 재정의
- 전 컴포넌트 — 하드코딩 hex → `hm-*` 토큰 치환 (단계적)

### 레퍼런스
- [Dealroom](https://dealroom.co) — 부동산 거래 플랫폼, Indigo-Blue 브랜드
- [Mercury Bank](https://mercury.com) — 금융 SaaS, 차분한 인디고 + 넓은 여백
- [Linear](https://linear.app) — 업무 도구, 체계적 그레이 스케일

---

## 2. 타이포그래피

### Before (현재)

- 폰트 사이즈 산발적: `text-[9px]`(9회), `text-[10px]`(38회), `text-[11px]`(34회), `text-[13px]`(17회), `text-[15px]`(8회), `text-[17px]`, `text-[22px]`, `text-[26px]`, `text-[28px]`
- 웨이트 혼재: `font-bold`(978회), `font-extrabold`(374회), `font-[800]`(147회), `font-black`(22회) — 4가지가 거의 같은 역할
- 가독성 문제: 9~11px은 장시간 사용 시 눈 피로

### After (제안)

**5단계 시스템:**

| 토큰 | 크기 | 용도 |
|------|------|------|
| `text-xs` | 12px | 배지, 캡션, 사이드바 접힌 상태 |
| `text-sm` | 14px | 테이블 셀, 폼 라벨, 보조 텍스트 |
| `text-base` | 16px | 본문, 입력 필드 |
| `text-lg` | 18px | 섹션 타이틀, 카드 헤더 |
| `text-xl` | 24px | 페이지 타이틀, 대시보드 숫자 |

**3단계 웨이트:**

| 웨이트 | 용도 |
|--------|------|
| `font-normal` (400) | 본문, 테이블 셀, 입력값 |
| `font-semibold` (600) | 라벨, 섹션 제목, 배지, 테이블 헤더 |
| `font-bold` (700) | 페이지 타이틀, 대시보드 KPI 숫자 |

**핵심 변경:**
- `font-extrabold`(800), `font-[800]`, `font-black`(900) → 모두 `font-bold`(700)로 통일
- `text-[9px]`, `text-[10px]`, `text-[11px]` → `text-xs`(12px)로 통일 (최소 사이즈 12px)
- `text-[13px]` → `text-sm`(14px)
- `text-[15px]`, `text-[17px]` → `text-lg`(18px)
- `text-[22px]` 이상 → `text-xl`(24px)

**행간:** `leading-relaxed` (1.625) 기본 → 데이터 밀도 높은 테이블은 `leading-normal` (1.5)

### 변경 파일
- `src/components/SectionTitle.tsx` — `text-[17px] font-extrabold` → `text-lg font-bold`
- `src/components/StatusBadge.tsx` — `text-[11px]` → `text-xs`
- `src/components/Field.tsx` — `fontSize: 13` → `text-sm`
- `src/layouts/Sidebar.tsx` — `text-[9px]`, `text-[10px]` → `text-xs`
- 전 페이지 컴포넌트 — 임의 사이즈 → 5단계 토큰

### 레퍼런스
- Apple HIG — 최소 11pt (웹에서 12px 동급)
- [Vercel Dashboard](https://vercel.com) — 5단계 타이포 스케일, semibold 중심

---

## 3. 여백 리듬

### Before (현재)

- 비표준 값 다수: `py-[9px]`, `px-3.5`, `gap-2.5`, `mb-0.5`, `mb-3.5`
- 카드 패딩 `p-5` (20px) — 4의 배수 아님
- 사이드바 메뉴 아이템 `px-3 py-[9px]` — 혼합

### After (제안)

**4px 배수 스케일:**

| 토큰 | 값 | 용도 |
|------|-----|------|
| `1` | 4px | 아이콘-텍스트 간격, 배지 내부 |
| `2` | 8px | 인라인 요소 간격, 리스트 아이템 간 |
| `3` | 12px | 폼 필드 내부 패딩, 버튼 내부 |
| `4` | 16px | 카드 내부 패딩 (컴팩트), 섹션 내 요소 간격 |
| `6` | 24px | 카드 내부 패딩 (기본), 섹션 간 간격 |
| `8` | 32px | 페이지 패딩, 큰 섹션 간 간격 |

**변경 포인트:**

| 현재 | 제안 | 위치 |
|------|------|------|
| `p-5` (20px) | `p-6` (24px) | Card 컴포넌트 |
| `py-[9px]` | `py-2.5` (10px) 또는 `py-3` (12px) | 사이드바 메뉴, 입력 필드 |
| `px-3.5` (14px) | `px-4` (16px) | 사이드바 헤더 |
| `gap-2.5` (10px) | `gap-3` (12px) | 메뉴 리스트 |
| `mb-0.5` (2px) | `mb-1` (4px) | 라벨-필드 간 |
| `p-6` → `p-4` mobile | 유지 | 메인 콘텐츠 |

### 변경 파일
- `src/components/Card.tsx` — `p-5` → `p-6`
- `src/layouts/Sidebar.tsx` — 패딩/간격 정리
- `src/components/Field.tsx` — `padding: '9px 12px'` → `px-3 py-2.5`
- 전체 — 비표준 간격 → 4px 배수

### 레퍼런스
- [Tailwind Spacing Scale](https://tailwindcss.com/docs/customizing-spacing) — 4px 기반 기본 스케일
- [Ant Design Spacing](https://ant.design/docs/spec/layout) — 4/8/12/16/24/32 체계

---

## 4. 카드/컨테이너

### Before (현재)

```tsx
// Card.tsx
'bg-white rounded-xl border border-[#E8ECF0] p-5 shadow-sm transition-shadow duration-200'
// hover 시: shadow-md
```
- `rounded-xl` (12px) 카드에 사용
- 프로젝트 전체 radius 혼재: `rounded-lg`(400회), `rounded-md`(294회), `rounded-xl`(78회), `rounded-[9px]`, `rounded-[10px]`

### After (제안)

**그림자 2단계:**

```css
/* index.css에 추가 */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
--shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
```

| 단계 | 값 | 용도 |
|------|-----|------|
| `shadow-card` (sm) | 위 정의 | 카드 기본 상태 |
| `shadow-card-hover` (md) | 위 정의 | 카드 hover, 모달, 드롭다운 |

**border-radius 통일:**

| 요소 | 현재 | 제안 |
|------|------|------|
| 카드 | `rounded-xl` (12px) | `rounded-xl` (12px) 유지 |
| 버튼 | `rounded-md` (6px) | `rounded-lg` (8px) |
| 배지 | `rounded-md` (6px) | `rounded-md` (6px) 유지 |
| 입력 필드 | `rounded-lg` (8px) 혼재 | `rounded-lg` (8px) 통일 |
| 모달 | `rounded-2xl` (16px) | `rounded-xl` (12px) — 카드와 통일 |
| 사이드바 아이템 | `rounded-[9px]` | `rounded-lg` (8px) |

**Card 컴포넌트 개선:**

```tsx
// Card.tsx
const cardBase = cn(
  'bg-white rounded-xl border border-hm-gray-200 p-6',
  'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]',
  'transition-shadow duration-200',
  onClick && 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] cursor-pointer',
  className
);
```

### 변경 파일
- `src/index.css` — 커스텀 shadow 토큰 추가
- `src/components/Card.tsx` — shadow + padding + border 색상 토큰화
- `src/components/Modal.tsx` — `rounded-2xl` → `rounded-xl`
- `src/layouts/Sidebar.tsx` — `rounded-[9px]` → `rounded-lg`

### 레퍼런스
- [Stripe Dashboard](https://dashboard.stripe.com) — 낮은 그림자 + 깔끔한 border
- [Notion](https://notion.so) — 미니멀 카드, 일관된 radius

---

## 5. 버튼 체계

### Before (현재)

shadcn Button 6 variants (default, destructive, outline, secondary, ghost, link) + 3 sizes (sm, default, lg, icon).
실제 페이지에서는 인라인 스타일 버튼도 혼재:
```tsx
style={{ background: '#3B82F6', color: '#fff', borderRadius: 8, padding: '9px 18px' }}
```

### After (제안)

**4종 체계 (shadcn variant 활용):**

| Variant | 용도 | 스타일 |
|---------|------|--------|
| `default` (Primary) | 주요 액션: 저장, 등록, 확인 | `bg-hm-primary text-white hover:bg-hm-primary-hover` |
| `outline` (Secondary) | 보조 액션: 취소, 닫기, 필터 | `border-hm-gray-200 text-hm-gray-800 hover:bg-hm-gray-100` |
| `ghost` | 인라인 액션: 편집, 더보기 | `text-hm-gray-600 hover:bg-hm-gray-100` |
| `destructive` (Danger) | 위험 액션: 삭제, 퇴실 확정 | `bg-hm-danger text-white hover:bg-red-700` |

**3종 크기:**

| Size | 높이 | 패딩 | 폰트 | 용도 |
|------|------|------|------|------|
| `sm` | 32px (`h-8`) | `px-3` | `text-xs` | 테이블 행 내, 배지 옆 |
| `md` (default) | 36px (`h-9`) | `px-4` | `text-sm` | 폼 버튼, 모달 버튼 |
| `lg` | 44px (`h-11`) | `px-6` | `text-base` | 로그인, 전체 너비 CTA |

**인라인 스타일 버튼 제거:** 모든 `<button style={{...}}>` → `<Button variant="..." size="...">`

### 변경 파일
- `src/components/ui/button.tsx` — variant 색상을 hm-* 토큰으로 교체
- 전 페이지 — 인라인 스타일 버튼 → shadcn Button 컴포넌트

### 레퍼런스
- [shadcn/ui Button](https://ui.shadcn.com/docs/components/button) — 기본 체계
- [Radix Themes](https://www.radix-ui.com/themes) — 4 variant + 3 size 패턴

---

## 6. 아이콘

### Before (현재)

- **사이드바**: lucide-react 아이콘 (iconMap 21개 매핑)
- **모바일 네비게이션**: 이모지 (`'✅'`, `'📊'`, `'👤'`, `'💰'` 등)
- **TopBar**: 이모지 (`'🔔'` 등) + lucide Bell
- **페이지 내부**: 이모지 (`'📌'`, `'🏠'`, `'👤'`) + 유니코드 (`'✕'`, `'◀'`, `'▶'`)
- 혼재 사용으로 시각적 일관성 없음

### After (제안)

**전면 lucide-react 전환.** 이모지/유니코드 문자 모두 lucide 아이콘으로 교체.

**사이드바 아이콘 매핑 (기존 유지 + 보완):**

| 메뉴 ID | 현재 이모지 | lucide 아이콘 |
|----------|-------------|---------------|
| `task-driver` | ✅ | `CheckSquare` (기존) |
| `calendar` | 📅 | `Calendar` (기존) |
| `buildings` | 🏗️ | `Building2` (기존) |
| `tenants` | 👤 | `Users` |
| `past-tenants` | 🚶 | `UserMinus` |
| `collection` | 💰 | `Coins` (기존) |
| `billing` | ⚡ | `Zap` (기존) |
| `transactions` | 💳 | `CreditCard` (기존) |
| `settlement` | 📊 | `BarChart3` (기존) |
| `cashbook` | 📒 | `BookOpen` |
| `parking` | 🅿️ | `SquareParking` (기존) |
| `as` | 🔧 | `Wrench` (기존) |
| `patrol` | 🧹 | `Footprints` (기존) |
| `payroll` | 💵 | `Banknote` (기존) |
| `vacancies` | 🏠 | `DoorOpen` |
| `renewal` | 🔄 | `RefreshCw` (기존) |
| `route-schedule` | 🗺️ | `MapPin` (기존) |
| `data-upload` | 📤 | `FolderUp` (기존) |
| `homepage-edit` | 🌐 | `Globe` (기존) |
| `staff` | 👥 | `Users` |
| `broker` | 🤝 | `Handshake` |
| `profit-dashboard` | 📈 | `TrendingUp` |

**페이지 헤더 아이콘:** 각 페이지 타이틀 왼쪽에 lucide 아이콘 배치 (size={20}, `text-hm-gray-500`)

**상태 표시 아이콘:**

| 상태 | 아이콘 |
|------|--------|
| 정상/완료 | `CircleCheck` |
| 연체/위험 | `AlertTriangle` |
| 대기/진행 | `Clock` |
| 공실 | `DoorOpen` |
| 닫기(X) | `X` (lucide) |
| 이전/다음 | `ChevronLeft` / `ChevronRight` |

**아이콘 크기 규칙:**

| 위치 | 크기 |
|------|------|
| 사이드바 메뉴 | `size={18}` |
| 페이지 헤더 | `size={20}` |
| 버튼 내부 | `size={16}` |
| 배지 내부 | `size={14}` |
| TopBar 알림 | `size={20}` |
| 모바일 네비 | `size={22}` |

### 변경 파일
- `src/layouts/Sidebar.tsx` — iconMap 이미 존재, 누락분 추가
- `src/layouts/MobileNav.tsx` — `m.icon` (이모지) → lucide 컴포넌트
- `src/layouts/TopBar.tsx` — 이모지 → lucide
- `src/components/StatusBadge.tsx` — 상태별 아이콘 추가 (선택)
- 각 페이지 — 이모지 리터럴 → lucide import

### 레퍼런스
- [Lucide Icons](https://lucide.dev/icons) — 전체 아이콘 목록
- [Linear](https://linear.app) — lucide 기반 일관된 아이콘 사용

---

## 7. 사이드바

### Before (현재)

- 다크 배경: `#1B1F2E`
- 활성 메뉴: `bg-[#2A3352]` + `border-l-[3px] border-[#3B82F6]`
- 텍스트: `#9CA3B0`
- 로고: `text-[13px] font-extrabold`
- 접힘/펼침: 230px ↔ 64px
- 역할 탭: `text-[9px]`

### After (제안)

**다크 배경 유지 — 강력 권장.**

이유:
1. 콘텐츠 영역(흰색)과 네비게이션의 시각적 분리가 명확
2. 장시간 사용 시 시선 집중 영역(콘텐츠)과 참조 영역(사이드바) 구분
3. 부동산/금융 앱의 프로페셔널 톤에 부합

**개선안:**

```css
/* 사이드바 전용 색상 — 살짝 더 따뜻한 다크 */
--color-hm-sidebar: #181C2A;           /* 약간 더 진하게 */
--color-hm-sidebar-active: #252D4A;    /* 활성 배경 */
--color-hm-sidebar-hover: #1F2640;     /* 호버 배경 */
--color-hm-sidebar-border: #2A2F42;    /* 유지 */
--color-hm-sidebar-text: #94A3B8;      /* slate-400 — 비활성 텍스트 */
--color-hm-sidebar-text-active: #F1F5F9; /* slate-100 — 활성 텍스트 */
```

**활성 메뉴 인디케이터 개선:**

```
현재: border-l-[3px] border-[#3B82F6] + bg-[#2A3352]
제안: border-l-[3px] border-hm-primary + bg-hm-sidebar-active
      + 텍스트 color → hm-sidebar-text-active (밝게)
      + 아이콘 color → hm-primary
```

**그룹 헤더:**
```
text-[10px] → text-xs
font-bold → font-semibold
uppercase tracking-[0.08em] text-hm-sidebar-text/60
mt-6 mb-2 px-4
```

그룹 구분:
- **일상 업무**: 할일, 캘린더
- **건물 관리**: 건물, 임차인, 과거임차인, 갱신, 공실
- **재무**: 수금, 청구, 거래, 정산, 출납
- **운영**: A/S, 순찰, 주차, 급여
- **설정**: 직원, 중개사, 데이터, 홈페이지

### 변경 파일
- `src/index.css` — 사이드바 토큰 조정
- `src/layouts/Sidebar.tsx` — 그룹 헤더 추가, 색상 토큰화, 폰트 사이즈 정리

### 레퍼런스
- [Notion](https://notion.so) — 다크 사이드바 + 그룹 헤더
- [Linear](https://linear.app) — 다크 사이드바 + 활성 인디케이터
- [Figma](https://figma.com) — 아이콘 + 레이블 네비게이션

---

## 8. 테이블

### Before (현재)

```tsx
// Table.tsx (shadcn)
// 기본 shadcn 테이블 + 커스텀 Table 컴포넌트
// 헤더: bg-[#F7F8FA], text-[#5F6577]
// 테두리: border-[#E8ECF0]
// hover, 스트라이프, 고정 헤더 없음
```

### After (제안)

**행 hover:**
```tsx
<TableRow className="hover:bg-hm-gray-50 transition-colors duration-100">
```

**스트라이프 (선택적):**
```tsx
// 데이터 밀도가 높은 테이블(임차인 488건)에만 적용
<TableRow className="even:bg-hm-gray-50/50">
```
- TenantList, CollectionPage, TransactionPage에 적용 권장
- 10행 미만 테이블에는 스트라이프 불필요

**고정 헤더:**
```tsx
// 스크롤이 필요한 긴 테이블에 적용
<div className="max-h-[calc(100vh-200px)] overflow-y-auto">
  <Table>
    <TableHeader className="sticky top-0 z-10 bg-hm-gray-100 shadow-[0_1px_0_0_theme(colors.hm.gray.200)]">
```
- TenantList, CollectionPage에 적용 권장

**정렬 표시:**
```tsx
// 정렬 가능한 컬럼 헤더
<TableHead className="cursor-pointer select-none hover:text-hm-gray-800 group">
  이름
  <ArrowUpDown size={14} className="ml-1 inline opacity-0 group-hover:opacity-50" />
</TableHead>
```

**헤더 스타일:**
```
bg-hm-gray-100 text-hm-gray-600 text-xs font-semibold uppercase tracking-wider
```

**셀 패딩:** `px-4 py-3` (기본) / `px-3 py-2` (컴팩트 모바일)

### 변경 파일
- `src/components/Table.tsx` (커스텀) — hover, 스트라이프 기본 적용
- `src/components/ui/table.tsx` (shadcn) — 헤더 스타일 개선
- `src/pages/TenantsPage.tsx` — 고정 헤더 적용
- `src/pages/CollectionPage.tsx` — 고정 헤더 + 스트라이프

### 레퍼런스
- [Airtable](https://airtable.com) — 고정 헤더 + 행 hover
- [Monday.com](https://monday.com) — 컬러풀 상태 + 행 hover

---

## 9. 상태 표현

### Before (현재)

StatusBadge에 13개 상태가 각각 하드코딩된 색상 가짐.
일부 상태가 동일 색상을 공유하지만 코드상 분산:
- 정상/완료 → 같은 green
- 연체/도래/높음 → 같은 red
- 청구/진행중/예정/보통 → 같은 orange
- 대기/관심/낮음 → 같은 indigo

### After (제안)

**4색 시맨틱 체계로 통합:**

| 시맨틱 | 색상 | 적용 상태 |
|--------|------|-----------|
| `success` | Green | 정상, 완료, 수금완료 |
| `danger` | Red | 연체, 도래, 높음, 미납 |
| `warning` | Amber | 청구, 진행중, 예정, 보통, 임차인연결 |
| `info` | Sky Blue | 대기, 관심, 낮음 |
| `neutral` | Gray | 공실, 비활성, 기본 |

**StatusBadge 개선:**

```tsx
type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-hm-success-bg text-hm-success border-hm-success-border',
  danger:  'bg-hm-danger-bg text-hm-danger border-hm-danger-border',
  warning: 'bg-hm-warning-bg text-hm-warning border-hm-warning-border',
  info:    'bg-hm-info-bg text-hm-info border-hm-info-border',
  neutral: 'bg-hm-gray-100 text-hm-gray-600 border-hm-gray-200',
};

const statusToVariant: Record<string, BadgeVariant> = {
  '정상': 'success', '완료': 'success',
  '연체': 'danger', '도래': 'danger', '높음': 'danger',
  '청구': 'warning', '진행중': 'warning', '예정': 'warning', '보통': 'warning', '임차인연결': 'warning',
  '대기': 'info', '관심': 'info', '낮음': 'info',
  '공실': 'neutral',
};
```

**배지 스타일 통일:**
```
text-xs font-semibold px-2.5 py-0.5 rounded-md border inline-flex items-center gap-1
```
- `text-[11px]` → `text-xs` (12px)
- 선택적으로 앞에 작은 원형 도트 (`w-1.5 h-1.5 rounded-full bg-current`) 추가

### 변경 파일
- `src/components/StatusBadge.tsx` — variant 기반 리팩토링
- `src/index.css` — `--color-hm-info-*` 토큰 추가

### 레퍼런스
- [GitHub Issues](https://github.com) — Open(green), Closed(purple) 2색 시스템
- [Jira](https://www.atlassian.com/software/jira) — To Do(blue), In Progress(yellow), Done(green)

---

## 10. 마이크로 인터랙션

### Before (현재)

- Card: `transition-shadow duration-200` → hover 시 `shadow-md`
- Sidebar: `transition-[width] duration-[250ms]`
- 커스텀 애니메이션: `fadeIn 0.3s`, `bell-ring 0.6s`
- 버튼: transition 없음 (일부 인라인 스타일 버튼)
- 모달: 즉시 표시 (fade 없음)
- 토스트: sonner 기본 설정

### After (제안)

**버튼:**
```tsx
// button.tsx에 추가
'transition-all duration-150 ease-in-out'
'active:scale-[0.98]'  // 클릭 시 살짝 눌리는 효과
```

**카드 hover:**
```tsx
// 클릭 가능한 카드만
'transition-all duration-200 ease-out'
'hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5'
```
- `-translate-y-0.5` (1px 위로) — 미묘하지만 인터랙티브 느낌

**모달 fade-in:**
```tsx
// Dialog/Modal 컴포넌트
// shadcn Dialog에 이미 애니메이션 포함 (tw-animate-css)
// 커스텀 Modal.tsx에도 동일 적용:
'animate-in fade-in-0 zoom-in-95 duration-200'
// backdrop:
'animate-in fade-in-0 duration-150'
```

**토스트 (sonner):**
```tsx
// main.tsx Toaster 설정
<Toaster
  position="top-right"
  toastOptions={{
    className: 'font-sans text-sm',
    duration: 4000,
  }}
/>
```

**페이지 전환:**
```tsx
// 기존 fadeIn 유지하되 timing 조정
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }  /* 6px → 4px 더 미묘하게 */
  to { opacity: 1; transform: translateY(0); }
}
// duration: 0.3s → 0.2s (더 빠르게)
```

**사이드바 메뉴 호버:**
```tsx
'transition-colors duration-100'  /* 빠른 색상 전환 */
```

**주의:** 과도한 애니메이션 금지. 업무 도구이므로 0.1~0.2s 범위의 미묘한 전환만.

### 변경 파일
- `src/components/ui/button.tsx` — `active:scale-[0.98]` 추가
- `src/components/Card.tsx` — hover translate 추가
- `src/components/Modal.tsx` — fade-in 애니메이션 추가
- `src/index.css` — fadeIn 키프레임 미세 조정
- `src/main.tsx` — Toaster 설정

### 레퍼런스
- [Vercel](https://vercel.com) — 미묘한 hover 상승 효과
- [Stripe](https://stripe.com) — 버튼 active scale, 빠른 전환

---

## 11. 다크 모드

### 결정: 지원하지 않음 (현 단계)

### 근거

1. **비용 대비 효과 낮음:**
   - 현재 `.dark` CSS 변수는 정의되어 있지만, 실제 컴포넌트의 하드코딩 색상(#HEXCODE)이 수백 개 → 다크 모드 전환 시 깨지는 UI 대량 발생
   - 모든 하드코딩 색상을 토큰으로 치환해야 다크 모드가 제대로 동작 — 이것만 해도 대규모 작업

2. **사용 패턴:**
   - 건물관리 실무 → 주간 업무 시간(09:00~18:00)에 집중 사용
   - 현장(건물)에서 모바일 사용 → 밝은 환경에서 다크 모드는 가독성 저하

3. **우선순위:**
   - 라이트 모드 완성도를 높이는 것이 먼저
   - 색상 토큰 통일이 완료된 후 다크 모드 추가가 훨씬 용이

4. **대안:**
   - `prefers-color-scheme: dark` 미디어 쿼리로 시스템 설정 존중하는 것은 향후 고려 가능
   - 색상 토큰 통일 작업(1번 항목)이 완료되면 다크 모드 추가 비용 대폭 감소

### 액션
- `index.css`의 `.dark` 블록은 삭제하지 않고 유지 (향후 대비)
- 새로 추가하는 `hm-*` 토큰에 대해서는 다크 모드 값도 함께 정의해두면 좋음
- 토글 UI는 구현하지 않음

### 변경 파일
- 없음 (현 단계에서는 변경 없음)

---

## 12. 로딩/빈 상태

### Before (현재)

**LoadingSkeleton** (`src/components/LoadingSkeleton.tsx`):
- 카드/테이블 스켈레톤 존재
- `animate-pulse` 사용
- 하드코딩 색상: `bg-white`, `border-[#E8ECF0]`, `bg-[#F7F8FA]`

**EmptyState** (`src/components/EmptyState.tsx`):
- 아이콘(이모지) + 제목 + 설명
- `py-16`, `text-sm font-semibold`, `text-xs text-[#8F95A3]`

**에러 바운더리**: 없음

### After (제안)

**LoadingSkeleton 개선:**

```tsx
// Skeleton 블록 색상 통일
'bg-hm-gray-100 animate-pulse rounded-lg'

// 카드 스켈레톤
<div className="bg-white rounded-xl border border-hm-gray-200 p-6 space-y-4">
  <Skeleton className="h-5 w-1/3" />      {/* 제목 */}
  <Skeleton className="h-4 w-2/3" />      {/* 설명 */}
  <Skeleton className="h-4 w-1/2" />      {/* 보조 */}
</div>

// 테이블 스켈레톤 — 행 수는 실제 데이터 예상 수와 맞춤
<TableSkeleton rows={8} columns={5} />
```

**EmptyState 개선:**

```tsx
interface EmptyStateProps {
  icon: LucideIcon;        // 이모지 → lucide 아이콘
  title: string;
  description?: string;
  action?: {               // CTA 버튼 추가
    label: string;
    onClick: () => void;
  };
}

// 스타일
<div className="flex flex-col items-center justify-center py-20 text-center">
  <div className="w-12 h-12 rounded-xl bg-hm-gray-100 flex items-center justify-center mb-4">
    <Icon size={24} className="text-hm-gray-400" />
  </div>
  <h3 className="text-sm font-semibold text-hm-gray-800 mb-1">{title}</h3>
  <p className="text-sm text-hm-gray-500 max-w-[320px]">{description}</p>
  {action && (
    <Button variant="outline" size="sm" className="mt-4" onClick={action.onClick}>
      {action.label}
    </Button>
  )}
</div>
```

**에러 바운더리 추가:**

```tsx
// src/components/ErrorBoundary.tsx (신규)
// React Error Boundary + 사용자 친화적 UI

<div className="flex flex-col items-center justify-center py-20 text-center">
  <div className="w-12 h-12 rounded-xl bg-hm-danger-bg flex items-center justify-center mb-4">
    <AlertTriangle size={24} className="text-hm-danger" />
  </div>
  <h3 className="text-sm font-semibold text-hm-gray-800 mb-1">
    문제가 발생했습니다
  </h3>
  <p className="text-sm text-hm-gray-500 max-w-[320px] mb-4">
    페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
  </p>
  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
    새로고침
  </Button>
</div>
```

**적용 위치:**
- `AppLayout.tsx`에서 `<Outlet />`을 `<ErrorBoundary>`로 감싸기
- 각 페이지 데이터 로딩 시: isLoading → Skeleton, data.length === 0 → EmptyState

### 변경 파일
- `src/components/LoadingSkeleton.tsx` — 색상 토큰화, Skeleton 컴포넌트 활용
- `src/components/EmptyState.tsx` — 이모지 → lucide, CTA 버튼 추가
- `src/components/ErrorBoundary.tsx` — 신규 생성
- `src/layouts/AppLayout.tsx` — ErrorBoundary 래핑

### 레퍼런스
- [Stripe Dashboard](https://dashboard.stripe.com) — 우아한 로딩 스켈레톤
- [Notion](https://notion.so) — EmptyState + CTA 패턴
- [Sentry](https://sentry.io) — 에러 바운더리 UI

---

## 실행 우선순위

작업량과 영향도를 기준으로 단계별 실행 권장:

### Phase A: 토큰 기반 구축 (영향도 높음, 의존성 많음)
1. **색상 시스템** (#1) — 모든 후속 작업의 기반
2. **타이포그래피** (#2) — 전체 가독성 개선
3. **여백 리듬** (#3) — 시각적 일관성

### Phase B: 컴포넌트 업그레이드 (독립적)
4. **카드/컨테이너** (#4)
5. **버튼 체계** (#5)
6. **상태 표현** (#9) — StatusBadge 리팩토링
7. **테이블** (#8)

### Phase C: 네비게이션 + 인터랙션
8. **아이콘 전환** (#6) — 사이드바/모바일/페이지 전면
9. **사이드바** (#7) — 그룹 헤더 추가
10. **마이크로 인터랙션** (#10)

### Phase D: 안정성
11. **로딩/빈 상태** (#12) — ErrorBoundary 추가
12. **다크 모드** (#11) — 보류 (토큰 통일 후 재검토)

---

## 변경 범위 요약

| 카테고리 | 파일 수 | 비고 |
|----------|---------|------|
| `src/index.css` | 1 | 토큰 재정의 (핵심) |
| `src/components/*.tsx` | ~8 | Card, StatusBadge, Modal, Field, Table, EmptyState, LoadingSkeleton, ErrorBoundary |
| `src/components/ui/*.tsx` | ~2 | button.tsx, table.tsx |
| `src/layouts/*.tsx` | ~4 | Sidebar, TopBar, MobileNav, AppLayout |
| 페이지 파일 | ~30 | 하드코딩 hex → 토큰 (단계적) |
| **총 영향 파일** | **~45** | 기능 변경 0건 |
