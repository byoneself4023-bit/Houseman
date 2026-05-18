# Review — Source of Truth + reviewer 본질

> 본 문서 = (1) 수치 단일 진실 공급원 (§7 정정 표) + (2) reviewer subagent 8 카테고리 검사 정의.
> AGENTS.md §13 / planner / implementer / reviewer가 본 §7을 수치 인용 source로 사용.
>
> Cross-link:
> - `docs/Apply.md §[1]` (Critical 3건 — reviewer 검사 B 카테고리)
> - `docs/Automation.md` (Hook 자동 차단 — reviewer 검사와 연동)
> - `.claude/agents/reviewer.md` (reviewer subagent 자기 인식 source)

---

## §[1] reviewer 본질

별도 컨텍스트로 검증. implementer 자가 점검 신뢰 X → Self-bias 회피 (`docs/Subagents.md §[7]`).

**권한**: Read + Bash (Read / Grep / Glob / Bash). **Write / Edit 0**.

**판정**: PASS | FAIL.
- PASS → orchestrator(운영자) PR 생성 (squash merge)
- FAIL → 구체 위반 사항 + 수정 제안 보고. orchestrator가 implementer 재호출 (1단계 nesting 제한).

---

## §[2] 8 카테고리 검사 (C1-b 실 운영 결과 기반)

C1-a + C1-b 카드 진행에서 도출된 검사 영역. 카드별 적용 영역 다름 (예: 매칭 룰 = C1-b 한정).

### A. 4원칙 (`docs/Apply.md §[3]`)

- [ ] #24 Think Before — planner 6 섹션 출력 확인
- [ ] #25 Simplicity — 신규 추상화 정당화 / 포팅 자산 재사용 확인
- [ ] #26 Surgical — diff 모든 줄이 카드와 1:1 매칭
- [ ] #27 Goal-Driven — 테스트 우선 + 회귀 PASS 확인

### B. Critical 3건 회귀 (`docs/Apply.md §[1]`)

- [ ] **C1** — `pays_for` 의미 관계 본문 명시 + markPaid/retroFit 시그니처 보존
- [ ] **C2** — MoveOutLinkController 변경 시 `JWT|signed|TTL` 명시 본문 포함
- [ ] **C3** — ContractService.moveOut 변경 시 `vacantConfirmed` 도달 전 자동 삭제 0

### C. 매칭 룰 정합 (C1-b 영역)

- [ ] Transaction.type literal = `'입금'` (한글, INFLOW X)
- [ ] 매칭 키 = `room_id + date.year + date.month + type='입금'` 4 필드
- [ ] 잔액 식 = `residual = txnSum - paidAmount`

### D. 멱등성 (C1-a/b 영역)

- [ ] PAID 상태 재호출 시 `IllegalStateException` catch → skip
- [ ] `residual <= 0` 시 skip (이미 충분 paid)
- [ ] dryRun=true 시 DB 변경 0 (read-only)

### E. 분기 정합

- [ ] feature flag 분기 (VITE_USE_API true/false) 본문 일치
- [ ] enum 확장 시 Kotlin enum + DB CHECK 제약 동시 (옵션 B 패턴 — C1-a 결정)
- [ ] 기존 호출자 후방호환 (옵셔널 파라미터 default 명시)

### F. 안티패턴 8종 (`docs/Apply.md §[3].5`)

- [ ] Self-bias / Approval Fatigue / Tool Poisoning / Architecture Drift
- [ ] Work Avoidance / Context Bloat / Doc-only Rules / No Measurement

### G. 테스트 품질

- [ ] 단위 + 통합 분리 (`@Test` 메소드 명 + 시나리오 1:1)
- [ ] 회귀 전체 (`./gradlew test`) PASS — 117 base 보존
- [ ] PostToolUse Hook (run-related-tests.sh) 자동 실행 결과 확인

### H. 적응 평가 (카드별 가변)

- [ ] 포팅 자산 재구현 0 (`docs/Mapping.md` 완료 10건 흔적)
- [ ] 명명 규칙 준수 (`docs/ARCHITECTURE.md §[7]`)
- [ ] 의미 관계 변경 시 `src/data/domainOntology.ts` + `docs/Ontology.md` 동시 갱신

---

## §[3] Critical 3건 회규 차단 패턴 (Hook + reviewer 이중)

| Critical | Hook 검사 (1차) | reviewer 검사 (2차) |
|---|---|---|
| **C1** | 검사 3 — TransactionService 변경 + BillingRecord 미언급 차단 | B-C1 + C 매칭 룰 + D 멱등성 |
| **C2** | 검사 4 — MoveOutLinkController 변경 + JWT/TTL 미언급 차단 | B-C2 |
| **C3** | 검사 5 — ContractService.moveOut + vacantConfirmed 미언급 차단 | B-C3 + H 포팅 자산 (ExitSettlementCalculator) |

Hook 자동 차단으로 1차 안전망. reviewer 검사로 2차 외부자 시각 검증. 둘 다 통과해야 PR 생성.

---

## §[7] 수치 정정 표 ★ (Source of Truth)

AGENTS.md §13 / planner / implementer / reviewer 수치 인용 source. 본 표 외 수치 사용 금지.

| 영역 | 정정 전 (AGENTS.md §1 원본) | **정정 후 (현재)** | 출처 |
|---|---|---|---|
| **BE API 엔드포인트** | 63 | **65** | `grep -rE "@(Get\|Post\|Put\|Delete\|Patch)Mapping" houseman-server/src/main/kotlin/com/houseman/controller/*.kt \| wc -l` (2026-05-18) |
| **BE 테스트 @Test** | 105 (Phase 3d 완료 시점) | **117** | `grep -rE "@Test" houseman-server/src/test \| wc -l` (C1-b 머지 `152b308` 후) |
| **BE Controller 파일** | — | **16** | `find houseman-server/src/main/kotlin -name "*Controller.kt" \| wc -l` |
| **FE E2E spec** | 59 | **3** | `find e2e -name "*.spec.ts" \| wc -l` (현재 3 파일, 59는 case 단위 추정) |
| **BE Services** | 16 | **16** | `ls houseman-server/.../service/*.kt \| wc -l` (정합 유지) |
| **Critical 단절** | 3 | **3** (C1/C2/C3) | `docs/Apply.md §[1]` |
| **포팅 자산 (`docs/Mapping.md`)** | 14 (10 완료 / 4 미포팅) | **14 (10 완료 / 4 미포팅)** | 정합 유지 |
| **Ontology Entities** | 16 (AGENTS.md §11 원본) | **5 정의 + 4 암묵 = 9** | `src/data/domainOntology.ts` L33~52 (정의 5 노드) |
| **Ontology Relationships** | 11 (AGENTS.md §11 원본) | **7** | `src/data/domainOntology.ts` L54~65 (C1-a 후 pays_for 추가) |
| **Ontology Rules** | 6 (AGENTS.md §11 원본) | **11** | `src/data/domainOntology.ts` L113~125 |
| **Ontology Workflows** | (명시 X) | **5 그룹** | `src/data/domainOntology.ts` L67~111 (lifecycle / contract_steps / moveout_short / moveout_normal / billing_cycle) |
| **CLAUDE.md 규칙 수** | 19 + 8 (Agent Harness) | **19 + #20~#27 = 27** | `CLAUDE.md` L774~814 |

### 갱신 절차

- 신규 카드 진입 시 수치 변동 영역 (예: @Test, API) 본 표 동시 갱신
- AGENTS.md §1 / §11 본문 인용 수치는 본 표 참조 (cross-link 표기)
- 검증 명령 명시 (재현 가능성 보장)

### 117 @Test 내역 (2026-05-18)

```
BE 테스트 총 117 @Test / 26 파일:
- 단위 테스트 (service/): BillingService 5, BillingRetroFit 6, BillingCalculation 12,
  ElectricityRate 5, OwnerSettlement 4 = 32
- 컨트롤러 테스트 (controller/): Staff 3, Room 3, Calendar 7, Contract 9,
  Transaction 4, Auth 5, Building 3, Cashbook 7, Parking 7, Billing 9, Vacancy 5,
  Settlement 6 = 68
- 스케줄러 테스트 (infra/scheduling/): ContractExpiry 2, OverdueCheck 2 = 4
- 글로벌 (global/sse/): SseEmitterManager 4
- E2E (e2e/): Billing 1, MoveOut 1, Overdue 3, Payment 2, Contract 1 = 8
- App 컨텍스트: HousemanApplicationTest 1
계 = 32 + 68 + 4 + 4 + 8 + 1 = 117
```

---

## §[8] 검증 결과 형식 (`.claude/agents/reviewer.md` 정합)

```markdown
## reviewer 검증 결과

**결정**: PASS | FAIL

### 검사 8 카테고리
- [ ] A. 4원칙 (#24~#27)
- [ ] B. Critical 3건 회귀 (C1/C2/C3)
- [ ] C. 매칭 룰 정합 (해당 카드만)
- [ ] D. 멱등성 (해당 카드만)
- [ ] E. 분기 정합
- [ ] F. 안티패턴 8종
- [ ] G. 테스트 품질 (회귀 117 base)
- [ ] H. 적응 평가 (포팅 / 명명 / 의미 관계)

### 위반 (있으면)
- 원칙/규칙: [#N 명시]
- 위치: [파일:라인]
- 수정 제안: [구체 텍스트]

### 테스트 결과 (raw)
- BE: `./gradlew test` → PASS/FAIL (n/m)
- FE: `npm test` → PASS/FAIL (n/m)
- E2E: `npx playwright test` → PASS/FAIL (n/m)
```

PASS 조건: 8 카테고리 모두 `[x]` + 위반 0 + 테스트 회귀 117/117.
