# Phase 2 Part 3 — AppLayout + 라우터 등록

---

## 실행 환경

- Phase 2 Part 1 (CalendarPage), Part 2 (TenantsPage) 완료 상태
- 신규 페이지 6개 중 4개 이미 라우터 등록됨 (Staff, Broker, Payroll, Buildings)
- 미등록: CompanySettingsPage, MoveOutLinkPage

---

## CompanySettingsWrapper.tsx (신규, 5줄)

minimal pass-through. CompanySettingsPage는 props 없이 내부 useLocalStorage 사용. StaffWrapper/PayrollWrapper와 동일 패턴.

---

## router.tsx 수정

MoveOutLinkPublic lazy import 추가. 2개 라우트 등록:

/company-settings — 내부 라우트 (RoleGuard children). CompanySettingsWrapper 렌더링. 인증 필요.

/move-out/:eventId — 공개 라우트 (AppLayout 밖). MoveOutLinkPage 렌더링. 인증 불필요. 임차인 외부 접근용. useParams()로 eventId 받아 Supabase 직접 조회.

---

## navigation.ts 수정

설정 섹션 첫 번째 항목으로 company-settings 추가: `{ id: 'company-settings', icon: '🏢', label: '하우스맨 기본정보' }`

pageIdToPath export 추가 — 전체 페이지 ID → URL 경로 매핑 (27개). contracts → /vacancies 매핑 주의 (CEO는 /contracts, 우리 라우터는 /vacancies).

---

## useNavigateCompat.ts 수정

PAGE_TO_PATH에 company-settings 경로 추가.

---

## Out of Scope

AiChatBot — CEO AppLayout에서 사이드패널로 사용. 컴포넌트 자체가 Supabase stores 직접 의존. 별도 포팅 필요.

Toast — CEO 커스텀 Toast 있으나 우리는 sonner Toaster를 main.tsx에서 이미 사용 중. 추가 작업 불필요.

---

## 산출물 요약

### 신규 파일 (1개)

| 파일 | 역할 |
|------|------|
| src/pages/wrappers/CompanySettingsWrapper.tsx | 회사설정 wrapper (minimal) |

### 수정 파일 (4개)

| 파일 | 변경 |
|------|------|
| src/pages/wrappers/index.ts | CompanySettingsWrapper export 추가 |
| src/router.tsx | company-settings 내부 + move-out/:eventId 공개 라우트 |
| src/config/navigation.ts | 하우스맨 기본정보 메뉴 + pageIdToPath export |
| src/hooks/useNavigateCompat.ts | company-settings 경로 추가 |

---

## 검증

- TypeScript: 에러 0개
- Build: 성공
