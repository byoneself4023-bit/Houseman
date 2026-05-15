# C1-a — BillingService.markPaid + pays_for 관계 정식화

> Phase 1 첫 카드. C1 (입금↔청구 paid 단절) 해소 1단계.
> Setup_4 dry run에서 6 섹션 plan 검증 완료, 본 카드에서 실 코드 작성.

---

## Context

C1 Critical 근본 원인 = `Transaction.pays_for(BillingRecord)` 의미 관계 부재 (`docs/Ontology.md §[2]` L58). 이를 BE 모델 + 서비스 흐름 + 테스트로 정식화. 본 카드는 C1-a로, 다음 단계는 C1-b (retro-fit BE 배포 후) + C1-c (SSE `BILLING_PAID` 이벤트).

도메인 의미 변화:
- 이전: `Transaction` ↔ `BillingRecord` 무관계 (운영자 수동 매핑)
- 이후: `Transaction.pays_for(BillingRecord)` 명시 관계 + 자동 상태 전이 (`SENT → PAID/PARTIAL`)

---

## 선행 자산 점검 (planner 호출 전)

신규 세션 시작 후 다음 확인:

- AGENTS.md SessionStart 자동 주입 정상 (§1~§16)
- Hook 4종 작동 (settings.json 정합)
- `.claude/agents/*.md` 3개 호출 가능 (`/agents` 또는 `@planner` 매칭)
- `plans/Agent_Harness.md` 존재 (Setup_4 산출물, 6 섹션 dry run plan 포함)
- BillingService.kt (173줄) / TransactionService.kt (72줄) 위치 확인

미달 시 즉시 중단, 단계 1 산출물 정합 재확인.

---

## 입력 자산 (Subagent별 정독 필수)

### planner 정독 7개 (planner.md에 명시)

`docs/Apply.md` / `docs/Ontology.md` / `docs/Automation.md` / `docs/Mapping.md` / `docs/Subagents.md` / `docs/ARCHITECTURE.md` / `CLAUDE.md`

추가 본 카드 한정 참조:
- `plans/Agent_Harness.md` — Setup_4 dry run 시 출력된 C1-a 6 섹션 plan (재활용 가능)
- `houseman-server/src/main/kotlin/com/houseman/service/BillingService.kt` (173줄)
- `houseman-server/src/main/kotlin/com/houseman/service/TransactionService.kt:35-71` (create 메소드)
- `houseman-server/src/main/resources/db/migration/V*.sql` (Flyway 현재 상태)
- `src/data/domainOntology.ts` (FE Ontology — 11 관계 표 vs 실 정의 6 관계 격차 확인)

### implementer 정독 6개 (implementer.md에 명시)

planner delegation prompt 전체 / `docs/Apply.md §[2] 원칙 7` / `CLAUDE.md` 19 규칙 / `docs/Mapping.md` / `docs/Ontology.md` / `docs/ARCHITECTURE.md`

### reviewer 정독 7개 (reviewer.md에 명시)

implementer 출력 / `docs/Apply.md §[1] + §[3]` / `docs/Harness.md §[3]` / `CLAUDE.md` 19 + #20~#27 / `docs/Subagents.md §[7]` / `docs/Mapping.md` / `docs/ARCHITECTURE.md`

---

## 카드 정의

### 산출물 5건

1. **Flyway V12 마이그레이션** — `houseman-server/.../db/migration/V12__billing_record_paid_status.sql`
   - `billing_record.status` enum 확장: 현재 `DRAFT / CONFIRMED / SENT` → `DRAFT / CONFIRMED / SENT / PAID / PARTIAL`
   - 옵션 B 채택 (Setup_4 dry run §3): Kotlin enum + DB CHECK 제약 (PG ENUM 제외)
   - down 스크립트 포함 (Flyway baseline 위반 회피용 별도 SQL)

2. **BillingService.markPaid()** — `houseman-server/.../service/BillingService.kt` (+ ~40줄)
   - 시그니처: `fun markPaid(billingId: Long, transaction: Transaction): BillingRecordResponse`
   - 로직: 청구 잔액 = transaction.amount → PAID / 청구 잔액 > transaction.amount → PARTIAL
   - 부분 결제 시 누적 추적 (`paid_amount` 컬럼 추가, V12에 포함)

3. **TransactionService.create() 갱신** — `houseman-server/.../service/TransactionService.kt:35-71` (+ ~20줄)
   - INFLOW 카테고리 transaction 생성 시 `billingId` 인자 받아 BillingService.markPaid() 자동 호출
   - 기존 메소드 시그니처 후방호환 (`billingId: Long? = null` 옵셔널)

4. **PATCH /api/billing/{id}/paid** — `houseman-server/.../controller/BillingController.kt` (+ ~15줄)
   - 단독 호출 가능 (transaction 없이 수동 paid 처리 케이스)
   - DTO: `MarkPaidRequest(transactionId: Long?, paidAmount: Long?)`

5. **테스트 5+1건**
   - `BillingServiceTest.markPaid` — 단위 5건 (full pay / partial / 중복 호출 / 부정확 금액 / 비존재 ID)
   - `PaymentFlowTest` — 통합 1건 (Transaction.create → BillingService.markPaid 자동 호출 흐름)

### 도메인 의미 관계 갱신

- `src/data/domainOntology.ts` — `pays_for` 관계 1건 신규 추가 (현 6 관계 → 7 관계, Ontology.md 11 관계 표 격차 5건은 별도 카드)
- 본 카드 범위: `pays_for` 1건만. 나머지 4건 (`splits / generates / triggers / blocks 등 — Ontology §[2] 참조`) 별도 Phase 1 정식화 카드.

---

## Subagent 호출 흐름

### Step 1 — planner 호출

```
@planner C1-a 카드 분해.

카드 정의: 위 §카드 정의 산출물 5건 + 의미 관계 갱신.
재활용: plans/Agent_Harness.md에 Setup_4 dry run 6 섹션 plan 존재 → 정독 후 갱신 (실 작업용으로 트레이드오프 §4 메트릭 구체화 + 검증 §6 회귀 N건 확정).

출력: 6 섹션 plan markdown.
```

planner 응답 받은 후 운영자가 §1~§6 검수. 옵션 B (Kotlin enum + CHECK 제약) 추천 확인.

### Step 2 — implementer 호출

```
@implementer 다음 plan 그대로 실행.

[planner 6 섹션 출력 전체 복붙 — 요약 X, history 미공유 대응 docs/Subagents.md §[5]]

추가 결정: 옵션 B (Kotlin enum + DB CHECK) 채택. 옵션 A/C 미진행.

산출물 5건 작성 순서:
1. V12 마이그레이션 (down 스크립트 동반)
2. BillingService.markPaid() + 단위 테스트 5건 동시
3. TransactionService.create() 갱신 (billingId 옵셔널)
4. BillingController PATCH 엔드포인트
5. PaymentFlowTest 통합 1건
6. domainOntology.ts pays_for 관계 추가
```

implementer가 코드 작성 시 PostToolUse Hook 자동 발동:
- `run-related-tests.sh` — 변경 .kt 파일별 gradle test 자동
- `critical-rules-check.sh` 검사 3 자동 발동 — TransactionService 변경 + BillingRecord 미언급 시 차단 (본 카드는 BillingRecord 명시 작업이라 통과)

### Step 3 — reviewer 호출

```
@reviewer C1-a implementer 출력 검증.

[implementer 출력 전체 복붙]

핵심 검사:
- C1 회귀 점검 (`pays_for` 의미 관계 명시 포함)
- 4원칙 (#24~#27)
- 안티패턴 8종
- BillingServiceTest 5건 + PaymentFlowTest 1건 실행 결과
- 회귀: BE 105 @Test → 108+ @Test (신규 3+ 추가)
```

reviewer PASS 시 PR 생성 (squash merge). FAIL 시 orchestrator(운영자)가 implementer 재호출.

---

## 검증 (Goal-Driven #27)

| 검증 | 명령 | 기대 |
|---|---|---|
| 1. V12 마이그레이션 | `./gradlew flywayMigrate` | SUCCESS + `billing_record.status` enum 확장 + `paid_amount` 컬럼 추가 |
| 2. BillingServiceTest | `./gradlew test --tests "BillingServiceTest"` | PASS 5+ 케이스 (markPaid 단위) |
| 3. PaymentFlowTest | `./gradlew test --tests "PaymentFlowTest"` | PASS 1 시나리오 (통합) |
| 4. 회귀 | `./gradlew test` | PASS 108+ (신규 6건 추가, 기존 105 보존) |
| 5. Hook 자동 차단 검증 | (자동) PostToolUse가 검사 3 발동 → BillingRecord 명시로 통과 | exit 0 + 조용히 통과 |
| 6. 의미 관계 갱신 | `grep "pays_for" src/data/domainOntology.ts` | 1+ 매치 (관계 신규 추가) |

---

## 절대 금지

1. 도메인 로직(정산/연체/청구/일할 계산) 수정 (CLAUDE.md 도메인 카테고리)
2. 포팅 자산 (`docs/Mapping.md` 완료 10건) 재구현
3. `billingMaster / billingConfig / buildingFloors / roomMasterData` config 파일 수정
4. `alert / confirm / prompt` 사용 (CLAUDE.md #5 — Hook 검사 1 자동 차단)
5. C1-b / C1-c 영역 (retro-fit / SSE 이벤트) 본 카드 포함 시도
6. `pays_for` 외 의미 관계 (`splits / generates / triggers / blocks`) 동시 정식화 — 별도 카드
7. 옵션 A (VARCHAR + CHECK) / 옵션 C (PG ENUM) 진행 — 옵션 B 채택 결정 위반

---

## 보고 형식 (단계 D — orchestrator 최종)

reviewer PASS 시:

```markdown
## C1-a 종료 보고

### 산출물 5건
[파일 경로 + 라인 수 + 신규/수정]

### 검증 1~6 결과
[PASS/FAIL]

### 변경 통계
- BE 코드 +N줄
- BE 테스트 +M줄
- FE Ontology +1 관계

### 회고 (자동화 90% → ?%)
- 운영자 액션 횟수 측정 (예상: 3~4회)
- Hook 작동 횟수 측정 (예상: 검사 3 자동 발동 N회)
- 자동화 가지치기 후보 (있으면)

### 다음 카드
C1-b (retro-fit) 또는 다음 Phase 1 카드.
```

회고 부분에서 자동화 도달 측정 + 가지치기 결정. 이전 약속 — "47 룰 / 정독 필수 / Hook 6검사 작동 측정 + 가지치기" 환기 시점.

---

## 참조 자산

- `prompts/Setup/Setup_4.md` (이전 단계 — Sub-4 dry run 결과)
- `plans/Agent_Harness.md` (Setup_4 산출물 — 6 섹션 plan 재활용)
- `.claude/agents/{planner,implementer,reviewer}.md` (Sub-2)
- `.claude/settings.json` (Sub-3 — Hook 4종)
- `scripts/{run-related-tests,critical-rules-check,save-plan}.sh` (Sub-3)
- `docs/Apply.md §[1]` (C1 정의) + `§[4] L328~337` (Phase 1→2 게이트 5조건)
- `docs/Ontology.md §[2]` (의미 그래프, `pays_for` 본질)
- `docs/Mapping.md` (BillingService 포팅 완료 — 재사용 우선)
