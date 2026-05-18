# Apply — Critical 3건 + 원칙 7 + 4원칙 + Phase 1~6 로드맵

> 본 문서 = Houseman 시스템 작업의 **단일 진실 공급원** (Source of Truth).
> AGENTS.md / CLAUDE.md / planner / implementer / reviewer가 모두 이 문서를 인용.
>
> Cross-link:
> - `CLAUDE.md` (재구축 계획서 본문 — Phase 0~6 source, 19 규칙 + #20~#27)
> - `docs/Ontology.md` (의미 관계 — pays_for 본질)
> - `docs/Mapping.md` (포팅 자산 14건 — Phase 1→2 게이트 source)
> - `docs/Subagents.md` (Subagent 3종 운영)
> - `docs/Roadmap.md` (Phase 7~12 진화)
> - `docs/Review.md §7` (수치 정정 표 — Source of Truth)
> - `docs/Domain_Analysis.md` (정산 / 연체 / 청구 / 매칭 계산식)

---

## §[1] Critical 3건 — 회귀 시 운영 직격

운영 데이터 무결성을 직격하는 단절 3건. PostToolUse Hook (`scripts/critical-rules-check.sh`) 자동 차단 + reviewer 8 카테고리 검사 B 영역.

### C1 — 입금 ↔ 청구 paid 단절

**증상**: `Transaction` 입금 row와 `BillingRecord` SENT row가 분리. 운영자 수동 매핑 → 정산 D 타입 (수금 기준) 자동화 불가.

**본질**: `Transaction.pays_for(BillingRecord)` 의미 관계 부재 (Ontology §[2] 정식화 전).

**해소 카드**:
| 단계 | 카드 | 결과 | commit |
|---|---|---|---|
| 1 | C1-a | markPaid + V12 마이그레이션 (paid_amount / paid_at) + pays_for ts/md 동시 갱신 | `8a70be9` |
| 2 | C1-b | retroFitPayments (SENT/PARTIAL 백필) + 매칭 룰 (room + period + type='입금') | `152b308` |
| 3 | C1-c | SSE `BILLING_PAID` 이벤트 (markPaid 시 자동 발행) | 미시작 |

**Hook 차단** (검사 3): TransactionService 변경 + BillingRecord 미언급 시 `exit 1`. 본문: `scripts/critical-rules-check.sh`.

**테스트 회귀**: BillingServiceTest (markPaid 단위 5건) / BillingRetroFitTest (백필 5건) / PaymentFlowTest (통합 1건) = 11건 보존.

### C2 — public link 무인증

**증상**: `MoveOutLinkController` 엔드포인트 JWT 미적용 → 외부 무제한 접근 가능. 링크 유출 시 임차인 외 제3자가 퇴실 정보 조작.

**본질**: 공개 링크 인증 정책 부재 (JWT signed token + TTL 만료 정책 미정의).

**해소 카드**: C2 (미시작) — JWT signed token (HS256) + TTL 7일 + 1회용 nonce.

**Hook 차단** (검사 4): MoveOutLinkController 변경 + `JWT|signed|TTL` 미언급 시 `exit 1`.

### C3 — 퇴실 정산 BE 엔진 부재

**증상**: 정산 계산이 FE `billingEngine.js`에서만 수행. BE 검증 불가 → 운영자가 FE 결과 그대로 신뢰. 다른 화면/플랫폼에서 동일 결과 보장 0.

**본질**: `ExitSettlementCalculator.kt` 미포팅 (`docs/Mapping.md #10`).

**해소 카드**: C3 (미시작) — Mapping.md #10 ExitSettlementCalculator 포팅 + BE 단위 테스트로 FE 결과 정합 검증.

**Hook 차단** (검사 5): ContractService.moveOut 변경 + `vacantConfirmed` 미언급 시 `exit 1` (퇴실 이벤트 자동 삭제 차단).

---

## §[2] 원칙 7 — Rails 매트릭스

Karpathy "Build Rails" 사상 적용. 작업 영역별 자동 검증 가능성 / 안전망 강도 분류.

| 영역 | Rails 위치 | 자동 검증 | 회규 위험 | 작업 default |
|---|---|---|---|---|
| **단순 수정** (오타/주석) | Rails 안 | ESLint + tsc | 낮음 | 직접 처리 (subagent X) |
| **테스트 추가** | Rails 안 | gradle test + vitest 자동 | 낮음 | implementer만 |
| **신규 함수 + 단위 테스트** | Rails 안 | PostToolUse Hook → 관련 테스트 자동 | 낮음 | implementer만 |
| **멀티 파일 / 도메인 영역** | Rails 경계 | 4원칙 + 안티패턴 수동 검토 | 중간 | planner → implementer → reviewer 풀 흐름 |
| **Critical 3건 직접 영역** (C1/C2/C3) | **Rails 밖** | Hook 6 검사 + reviewer 8 카테고리 | **높음** | **풀 흐름 필수 + 운영자 plan 컨펌** |
| **docs/ 매뉴얼 수정** | Rails 안 (보호) | critical-rules-check.sh 검사 6 (화이트리스트 3 제외 차단) | 낮음 (정합성) | plan 승인 후 산출물 명세 |

**Rails 안 = 검증 가능** (자동 차단 가능, 운영자 부담 낮음).
**Rails 밖 = C1·C2·C3** (자동 차단만으론 부족, 외부 reviewer + 운영자 plan 컨펌 필수).

---

## §[3] 4원칙 (#24~#27 Micro)

`CLAUDE.md L811~814` 본문 확장. AI 호출당 적용. planner 6 섹션 / implementer 자가 점검 / reviewer 8 카테고리 모두 본 원칙 기준.

### §[3].1 #24 Think Before Coding

**규칙**: planner subagent는 작업 전 6 섹션 출력 필수.

6 섹션 (`docs/Karpathy.md §[3].2` source, D2 카드 작성 예정):
1. **가정** — 전제하는 사실 (포팅 자산 사용 여부 / 의미 관계 기존 박힘 여부)
2. **영향 범위** — 변경 파일 / 함수 / 테이블 / 의미 관계
3. **옵션 ≥ 2개** — 접근 + 근거 + 위험 (각 옵션)
4. **트레이드오프** — 선택지별 비용/이득 (구체 메트릭, 추측 X)
5. **실패 모드** — 시나리오 + 롤백 스크립트
6. **검증 방법** — 단위/통합/회귀 테스트 케이스

**위반 = Approval Fatigue 안티패턴** (사고 누락 후 합리화).

### §[3].2 #25 Simplicity First

**규칙**: implementer는 1차 구현 후 자가 점검 — "200줄 → 50줄 가능?" "이 추상화 정말 필요?" "기존 함수로 가능?"

**적용**:
- 포팅 자산 재사용 우선 (`docs/Mapping.md` 완료 10건)
- 신규 추상화 도입 시 정당화 필수 (예: BillingService.markPaid 시그니처 수정 X, 재호출만)
- DTO / Repository / Service 3 레이어 외 추가 레이어 도입 시 plan에 명시

**위반 = Architecture Drift 안티패턴** (Goal 없이 추상화 추가).

### §[3].3 #26 Surgical Changes

**규칙**: diff에 작업 카드와 직접 연결 없는 변경 금지.

**Hook 자동 차단** (검사 2): `git diff --cached --check` whitespace-only 차단.

**적용**:
- 카드 산출물 명세 외 파일 수정 0
- 무관 임포트 정리 / 무관 포맷팅 변경 0 (별도 카드)
- `1 카드 = 1 commit` 정합 (영구 룰)

**위반 = Tool Poisoning 안티패턴** (관계없는 변경 누적).

### §[3].4 #27 Goal-Driven Execution

**규칙**: 작업 흐름 = **테스트 먼저 작성 → 통과 → 회귀 확인 → 보고**.

**Hook 자동 실행** (PostToolUse Edit|Write): `scripts/run-related-tests.sh` 관련 테스트 자동.

**적용**:
- 카드 검증 영역 명세 (table 형식: # / 명령 / 기대)
- 테스트 PASS 후 회귀 (전체 `./gradlew test`) 1회 실행
- raw 출력 의무 (ASCII summary 표 압축 X — implementer 영구 룰)

**위반 = No Measurement 안티패턴** (테스트 없는 "동작 추정").

### §[3].5 안티패턴 8종 (`docs/Harness.md §[3]` source — D2 카드 작성 예정)

| # | 안티패턴 | 회피 |
|---|---|---|
| 1 | **Self-bias** | reviewer 별도 컨텍스트 검증 (Subagents.md §[7]) |
| 2 | **Approval Fatigue** | planner 6 섹션 강제 (#24) |
| 3 | **Tool Poisoning** | Surgical 강제 (#26 + Hook 검사 2) |
| 4 | **Architecture Drift** | Simplicity 자가 점검 (#25) |
| 5 | **Work Avoidance** | 카드 산출물 명세 강제 (orchestrator) |
| 6 | **Context Bloat** | AGENTS.md 80줄 가드 + Subagent 컨텍스트 격리 |
| 7 | **Doc-only Rules** | Hook 6 검사 강제 (Hooks.md §[0]) |
| 8 | **No Measurement** | Goal-Driven 검증 표 강제 (#27) |

---

## §[4] Phase 1~6 로드맵

`CLAUDE.md` Phase 0~6 본문 source. 본 문서 = 카드 분류 + 게이트 영역.

### §[4].1 Phase 매트릭스

| Phase | 영역 | 상태 | 본문 source |
|---|---|---|---|
| **0** | FE 툴링 (TS + ESLint + Prettier + Vitest) | 완료 | `CLAUDE.md` Phase 0 |
| **1** | FE 스켈레톤 (Router + Zustand + Repository) | 완료 | `CLAUDE.md` Phase 1 |
| **2** | UI 업그레이드 (Tailwind + shadcn/ui) | 완료 | `CLAUDE.md` Phase 2 |
| **3a** | BE 인프라 (auth + staff + building + room) | 완료 | `CLAUDE.md` Phase 3a |
| **3b** | BE 핵심 (contract + transaction + billing) | 완료 | `CLAUDE.md` Phase 3b |
| **3c** | BE 파생 (calendar + vacancy + settlement) + SSE | 완료 | `CLAUDE.md` Phase 3c |
| **3d** | BE 부가 (cashbook + parking + upload) | 완료 | `CLAUDE.md` Phase 3d |
| **4** | BE API 마무리 + 크로스 도메인 E2E | 일부 | `CLAUDE.md` Phase 4 |
| **5** | FE ↔ BE 연결 (VITE_USE_API=true) | 대기 | `CLAUDE.md` Phase 5 |
| **6** | DevOps (CI + Docker + Sentry + 백업) | 대기 | `CLAUDE.md` Phase 6 |

### §[4].2 Phase 1 카드 분류 (현재 진행 영역)

| 카테고리 | 카드 | 상태 |
|---|---|---|
| **C — Critical 해소** | C1-a (markPaid) / C1-b (retroFit) / C1-c (SSE) / C2 (public link JWT) / C3 (ExitSettlement BE) | C1-a/b 완료 / C1-c·C2·C3 미시작 |
| **A — 매칭 + 인사이트** | A4 (매칭 룰 정식화) / A5 (ContractStatus 머신) / A8 (BillingTextParser) | 미시작 |
| **D — 인프라 / 매뉴얼** | D1-Infra (부재 docs/ 6건) / D2 (부재 4건 — Karpathy / Harness / Agent / Inventory) | D1 진행 / D2 대기 |
| **H — 환경 정합** | H1 (CI/로컬 환경 — server-test ApplicationContext) | 미시작 |

### §[4].3 Phase 1 → 2 게이트 5조건 ★

**Phase 1 종료 + Phase 2 (실 운영 영역 — Routing/Auth/Domain 정합) 진입 게이트.**

(L328~337 본문 영역 — AGENTS.md / CLAUDE.md / Mapping.md:46 인용 source)

| # | 조건 | source / 검증 |
|---|---|---|
| **1** | C1 완료 — C1-a + C1-b + C1-c 3 단계 모두 master 진입 | `plans/C1-a.md` PASS + `plans/C1-b.md` PASS + C1-c 미시작 |
| **2** | C2 완료 — public link JWT signed + TTL 정책 | `docs/Apply.md §[1] C2` 본문 (미시작) |
| **3** | C3 완료 — ExitSettlementCalculator BE 포팅 + 단위 테스트 통과 | `docs/Mapping.md:46` 인용 — Mapping #10 미포팅 → 포팅 카드 진입 |
| **4** | A4 매칭 룰 정식화 — `room + period + type='입금'` 룰 docs/Domain_Analysis.md §[4] 표준화 + API 명세 | `docs/Domain_Analysis.md §[4]` 본문 (Phase 1 병렬) |
| **5** | D1 부재 docs/ 6건 작성 + AGENTS.md 인용 정합화 | **본 카드 (D1-Infra) — 작성 중** |

**게이트 통과 = 5 조건 AND**. 1건이라도 미해소 시 Phase 2 진입 불가.

**현재 상태** (2026-05-18):
- 조건 1: 2/3 진입 (C1-a / C1-b 완료, C1-c 미시작)
- 조건 2: 0/1 진입 (C2 미시작)
- 조건 3: 0/1 진입 (C3 미시작)
- 조건 4: 0/1 진입 (A4 미시작)
- 조건 5: 0/1 진입 → **본 카드 완료 시 1/1 → 게이트 1건 해소**

→ 게이트 통과까지 추가 카드 4건 필요 (C1-c + C2 + C3 + A4).

---

## §[5] 카드 진행 영구 룰

(C1-a 회고 채택 — 모든 카드 적용)

1. **1 카드 = 1 commit** — 산출물 N건 모두 단일 commit (Surgical #26 정합).
2. **Co-Authored-By 트레일러 0** — auto mode classifier 차단 회피.
3. **raw 출력 의무** — Bash / git status / 검증 명령 결과 그대로 (ASCII summary 표 압축 X).
4. **planner → implementer → reviewer 풀 흐름** — Critical 영역 + 멀티 파일 default. Subagent history 미공유 대응 (delegation prompt에 plan 전체 명시).
5. **검증 표 강제** — 카드 §검증 영역에 # / 명령 / 기대 3열 표 필수 (`#27` Goal-Driven).

---

## §[6] 출처 매핑 (Cross-link)

| 본 문서 영역 | source |
|---|---|
| §[1] Critical 3건 | `CLAUDE.md` 도메인 카테고리 + `docs/Mapping.md` 미포팅 4건 + C1-a/b 카드 본문 |
| §[2] 원칙 7 Rails 매트릭스 | `docs/Karpathy.md §[2]` (D2 작성 예정) + `docs/Subagents.md §[6]` |
| §[3] 4원칙 | `CLAUDE.md L811~814` + `docs/Karpathy.md §[3]` (D2 작성 예정) |
| §[3].5 안티패턴 8종 | `docs/Harness.md §[3]` (D2 작성 예정) — 본 문서 한 줄 요약 |
| §[4] Phase 1~6 | `CLAUDE.md` Phase 0~6 본문 (846줄) |
| §[4].3 게이트 5조건 | 본 카드 (D1-Infra) 신규 정의 — AGENTS.md / CLAUDE.md / Mapping.md:46 인용 정합 |
| §[5] 영구 룰 | C1-a 회고 + `implementer.md` 영구 룰 영역 |
