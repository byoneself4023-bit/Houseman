# 전수분석 결과: refactor/architecture vs feature/ceo-integration

> 분석일: 2026-03-31
> 원본: refactor/architecture (108파일, 36,053줄)
> 내 코드: feature/ceo-integration (213파일, 53,289줄)

---

## 누락 파일/컴포넌트 (10개)

> 원본에 존재하지만 내 코드에 없는 파일. Part 2에서 포팅해야 함.

| # | 파일 | 원본 줄수 | 역할 | 작업 난이도 | 비고 |
|---|------|----------|------|-----------|------|
| 1 | **src/lib/billingEngine.js** | 1,380 | 청구서 생성(generateBillingRecord), 변동비 배분(calculateApportion), 퇴실확정(confirmMoveOut), 발송모드(getSendMode), 연체료(calcLateFee) | 상 | 핵심 비즈니스 로직. 현재 ceo에는 이 로직이 분산/부재. |
| 2 | **src/lib/transactionEngine.js** | 782 | 입출금 자동 매칭, 카테고리 분류, 규칙 관리 | 상 | TransactionPage에서 사용. ceo에는 수동 매칭만 있음. |
| 3 | **src/components/AiChatBot.jsx** | 733 | AI 챗봇 어시스턴트 (채팅 인터페이스) | 중 | 독립 컴포넌트. 다른 기능에 의존 없음. |
| 4 | **src/components/VariableBillingView.jsx** | 517 | 변동 청구(전기/가스) 배분 결과 표시 | 중 | billingEngine.calculateApportion 결과를 렌더링. |
| 5 | **src/components/BillingSetupWizard.jsx** | 453 | 청구 설정 마법사 (단계별 설정) | 중 | UtilityBillingPage에서 호출. |
| 6 | **src/components/MeterUpload.jsx** | 359 | 전기/가스 검침 데이터 업로드 | 중 | UtilityBillingPage에서 사용. |
| 7 | **src/components/RoomBillingSettingsPanel.jsx** | 217 | 호실별 청구 설정 패널 | 하 | BuildingDetailPage에서 사용. |
| 8 | **src/components/BillingInvoiceTemplate.jsx** | 207 | 청구서 인쇄/발송 템플릿 | 하 | UtilityBillingPage에서 사용. |
| 9 | **src/pages/ContractLinkPage.jsx** | 306 | 공개 계약 링크 페이지 (/contract/:contractId) | 중 | MoveOutLinkPage와 유사 패턴. 인증 불필요. |
| 10 | **src/data/billingUtils.js** | 213 | 정산 계산 유틸 (calcFee, calcVat, calcProRata, getSettlementPeriod, settlementMaster 정의) | 상 | **주의**: ceo의 billingMaster.ts에 settlementMaster는 있음. 하지만 billingUtils의 계산 함수들이 billingEngine에서 쓰이므로 함께 포팅 필요. |

**합계: 5,167줄 누락**

---

## 누락 기능 (8개)

> 파일은 있지만 원본에 있는 특정 기능이 내 코드에 없는 경우.

| # | 페이지/영역 | 기능 | 원본 위치 | 설명 | 난이도 |
|---|------------|------|----------|------|--------|
| 1 | UtilityBillingPage | **청구서 자동 생성** (handleAutoGenerate) | billingEngine.js:generateBillingRecord | 호실별 임대료+관리비+공과금+연체료 자동 계산하여 청구서 생성. ceo에는 수동 입력만 있음. | 상 |
| 2 | UtilityBillingPage | **변동비 배분 계산** (calculateApportion) | billingEngine.js:342-419 | 건물 전체 전기/가스 청구액을 호실별 사용량 비율로 배분. 공용부 분배 + 공실분 건물주 부담 계산 포함. | 상 |
| 3 | UtilityBillingPage | **청구서 일괄 발송** (handleBulkSend) | billingEngine.js:getSendMode | 발송 모드 자동 판단 (auto/manual/first_month/skip_utility) 후 일괄 SMS/카카오 발송. | 중 |
| 4 | TransactionPage | **입출금 자동 매칭** (handleRunMatching) | transactionEngine.js | 은행 거래 내역을 임차인/건물/카테고리에 자동 매칭. 규칙 기반 + 패턴 매칭. | 상 |
| 5 | CalendarPage | **계약 워크플로우 추가 단계** | CalendarPage.jsx:1374+ | contractEntered(계약서입력), finalPaymentConfirmed(최종납부확인), interiorManaged(인테리어관리), brokerFeeSent(중개료송금) 4개 플래그 누락. | 중 |
| 6 | CalendarPage | **퇴실 확정 → Supabase 직접 처리** | billingEngine.js:confirmMoveOut | 원본은 confirmMoveOut()에서 tenant deactivate + billing_settings reset + room vacancy_status 변경을 한 트랜잭션으로 처리. ceo는 로컬 상태만 변경. | 상 |
| 7 | 라우팅 | **/contract/:contractId 공개 페이지** | ContractLinkPage.jsx | 계약 정보 공유 링크. MoveOutLinkPage와 유사하지만 계약용. | 중 |
| 8 | TaskDriverPage | **직원별 태스크 저장** (hm_tasks_${staffId}) | TaskDriverPage.jsx | 직원 ID별로 별도 태스크 목록 localStorage 저장. ceo에는 이 패턴 없음. | 하 |

---

## 불일치 로직 (4개) — 의도적 개선 제외

> 양쪽 다 있지만 로직이 다른 곳. 도메인 로직은 원본이 맞음.

| # | 영역 | 내용 | 원본 방식 | 내 방식 | 판정 |
|---|------|------|----------|---------|------|
| 1 | /cashbook 라우팅 | CashBook 페이지 존재 여부 | `/cashbook` → `/transactions`로 리다이렉트 (CashBook 없음) | `/cashbook` → CashBookPage (독립 페이지) | **내 코드가 맞음** — ceo에서 출납관리를 독립 페이지로 분리한 것은 의도적 개선. |
| 2 | 퇴실 확정 처리 | confirmMoveOut 로직 | billingEngine.js에서 Supabase 직접: (1) tenant deactivate (2) billing_settings reset (3) room vacancy_status='금액체크' | MoveOutModal.tsx에서 로컬: (1) activeTenants 제거 (2) pastTenantsData 추가 (3) activeVacancies 추가 + persistDeactivateTenant() | **원본이 더 완전** — billing_settings reset이 ceo에 없음. room vacancy_status 직접 업데이트도 없음. |
| 3 | 연체료 계산 | calcLateFee 파라미터 | billingEngine.js: `calcLateFee(amount, dueDate, buildingSettings, tenantOverride)` — 건물별/임차인별 연체율 설정 가능 | billingMaster.ts: `calcLateFee(amount, dueDay)` — 고정 5%, 5일 초과 시 적용 | **원본이 더 유연** — 건물별/임차인별 커스텀 연체율 지원. ceo는 일괄 5% 고정. |
| 4 | 청구 모드 | /billing 라우트 경로 | `/utility-fixed`, `/utility-variable` | `/billing/fixed`, `/billing/variable` | **내 코드가 맞음** — 더 깔끔한 중첩 라우트. 기능은 동일. |

---

## 의도적 개선 (참고용, 수정 불필요)

| # | 내용 | 이유 |
|---|------|------|
| 1 | TypeScript 전환 (.jsx → .tsx) | 타입 안전성 확보 |
| 2 | wrapper 패턴 도입 (28개) | 데이터 주입 분리, 코드 스플리팅 개선 |
| 3 | AppData context (useAppContext) | prop drilling 제거 |
| 4 | Tailwind CSS + shadcn/ui | 인라인 스타일 → 디자인 시스템 |
| 5 | toast (sonner) 도입 | alert() 대체 |
| 6 | 커스텀 ConfirmDialog | confirm() 대체 |
| 7 | persistXxx() 패턴 | localStorage + Supabase 이중 저장 |
| 8 | React Router v7 코드 스플리팅 | 모든 페이지 React.lazy |
| 9 | Zustand 8개 스토어 분리 | 단일 App.jsx state → 도메인별 스토어 |
| 10 | ESC 닫기, 공실 중복 방지 | UX 개선 |
| 11 | CashBookPage 독립 페이지 | 원본은 리다이렉트였으나 출납관리 독립 기능으로 개선 |
| 12 | /billing/fixed, /billing/variable 경로 | 원본의 /utility-fixed 보다 깔끔한 중첩 라우트 |

---

## config/data 파일 비교 (3건)

| # | 파일 | 차이 내용 | 정산/청구 영향 |
|---|------|----------|---------------|
| 1 | **billingMaster** | 원본: 390줄, settlementMaster 37건. ceo: 1,077줄, settlementMaster 40건 + billingTypeMap, billingComposition, buildingAccountMap, buildingAbbr 포함. | **ceo가 더 완전**. 원본보다 3개 건물 더 많고 추가 매핑 포함. 정산 결과 동일하거나 ceo가 더 정확. |
| 2 | **billingConfig** | 원본: 259줄, 49건. ceo: 4,612줄, 200+건. | **ceo가 훨씬 완전**. 원본은 일부 건물만, ceo는 전체 건물 포함. |
| 3 | **buildingFloors** | 원본: 13~17건물. ceo: 27+건물. | **ceo가 더 완전**. 추가 건물 포함. |

> **결론**: config/data 파일은 ceo가 원본보다 완전함. 원본→ceo 방향의 데이터 포팅 불필요.

---

## 누락 CalendarEvent 필드 (5개)

> 원본의 CalendarEvent에 있지만 ceo의 types.ts에 없는 필드.
> 계약 워크플로우 확장 단계에 사용됨.

| # | 필드 (원본 snake_case) | camelCase | 용도 |
|---|----------------------|-----------|------|
| 1 | contract_entered | contractEntered | 계약서 입력 완료 여부 |
| 2 | final_payment_confirmed | finalPaymentConfirmed | 최종 납부 확인 |
| 3 | interior_managed | interiorManaged | 인테리어 관리 완료 |
| 4 | broker_fee_sent | brokerFeeSent | 중개수수료 송금 완료 |
| 5 | move_out_owner_reported | moveOutOwnerReported | 퇴실 시 건물주 보고 (ownerReported와 별도) |

---

## 누락 localStorage 키 (2개)

| # | 키 | 용도 | 영향 |
|---|-----|------|------|
| 1 | `hm_contracts` | 계약 데이터 저장 (ContractLinkPage에서 사용) | ContractLinkPage 자체가 누락이므로 함께 포팅 |
| 2 | `hm_tasks_${staffId}` | 직원별 태스크 목록 저장 | TaskDriverPage에서 직원별 할일 목록 유지 |

---

## 누락 모달 (2개)

| # | 모달 | 트리거 | 원본 위치 |
|---|------|--------|----------|
| 1 | BillingSetupWizard | UtilityBillingPage "설정" 버튼 | components/BillingSetupWizard.jsx |
| 2 | MeterUpload 모달 | UtilityBillingPage "검침 업로드" 버튼 | components/MeterUpload.jsx |

---

## 워크플로우 끊김 (2건)

| # | 워크플로우 | 끊기는 단계 | 원인 |
|---|-----------|-----------|------|
| 1 | **계약 워크플로우** | 보증금확인 → (끊김) → 잔금확인 | 원본에는 contractEntered, finalPaymentConfirmed, interiorManaged, brokerFeeSent 4단계가 추가로 있음. ceo는 depositConfirmed → reported → balanceConfirmed 3단계만. |
| 2 | **퇴실 확정 후 정리** | 정산완료(settled) → (끊김) → billing 초기화 | 원본의 confirmMoveOut()은 billing_settings 리셋 + room vacancy_status 변경까지 수행. ceo는 로컬 상태만 변경하고 billing_settings 리셋 없음. |

---

## persist 연동 차이 (3건)

| # | 내용 | Part 2에서 어떻게 처리할지 |
|---|------|--------------------------|
| 1 | **confirmMoveOut Supabase 직접 호출** | 원본의 billingEngine.confirmMoveOut() 로직을 ceo의 persistDeactivateTenant()에 통합. billing_settings 리셋 + room vacancy_status 업데이트 추가. |
| 2 | **billing_settings 테이블 연동** | 원본은 Supabase billing_settings 테이블로 호실별 청구 설정 관리. ceo에는 이 테이블 연동 없음. billingEngine 포팅 시 함께 추가. |
| 3 | **meter_readings 테이블 연동** | 원본은 Supabase meter_readings 테이블에 검침 데이터 저장. ceo에는 없음. MeterUpload 포팅 시 함께 추가. |

---

## Part 2 작업 우선순위 제안

### P0: 즉시 필요 (비즈니스 로직 누락)
1. billingEngine.js → billingEngine.ts 포팅 (confirmMoveOut, calcLateFee 확장)
2. CalendarEvent 필드 5개 추가 + ContractStatusPanel 확장
3. 퇴실 확정 시 billing_settings 리셋 로직 추가

### P1: 핵심 기능 (청구 시스템 완성)
4. billingUtils.js → billingUtils.ts 포팅 (계산 함수)
5. VariableBillingView 포팅
6. BillingSetupWizard 포팅
7. MeterUpload 포팅
8. BillingInvoiceTemplate 포팅

### P2: 중요 기능
9. transactionEngine.js → transactionEngine.ts 포팅
10. ContractLinkPage 포팅
11. RoomBillingSettingsPanel 포팅

### P3: 부가 기능
12. AiChatBot 포팅
13. hm_tasks_${staffId} 패턴 추가
