# 포팅 자산 대조표

**Source**: `CLAUDE.md` Phase 3 "그대로 가져올 자산" (14건) × `docs/Inventory.md` (16 services + global 영역).
**기준일**: 2026-05-14 (Phase 3d 완료 시점).
**검증**: `grep -ri "TextParser|ExitSettle|RuleEngine|ContractStatus" houseman-server/src/main/kotlin/` → 0건 (명칭 변경 의심 없음).

## 분류 요약

| 분류 | 건수 |
|---|---|
| 포팅 완료 (Inventory 확인됨) | 10 |
| 명칭 변경 의심 | 0 |
| 미포팅 (작업 필요) | 4 |
| **총** | **14** |

## 상세 대조

| # | 원본 자산 (Phase 3 표) | 현재 경로 (Inventory 행) | 분류 | 영향 카드 (Automation.md) |
|---|---|---|---|---|
| 1 | global/config/SecurityConfig.kt | `houseman-server/.../global/config/SecurityConfig.kt` (Inv L19) | 포팅 완료 | E1~E5 (보안) |
| 2 | global/security/JwtProvider.kt | `.../global/security/JwtProvider.kt` (Inv L63) | 포팅 완료 | E2 |
| 3 | global/security/JwtAuthFilter.kt | `.../global/security/JwtAuthFilter.kt` (Inv L64) | 포팅 완료 | E2 |
| 4 | global/error/* | `.../global/error/ErrorCode + GlobalExceptionHandler` (Inv L55) | 포팅 완료 | F (개발) |
| 5 | global/common/BaseEntity.kt | `.../global/common/BaseEntity.kt` (Inv L52) | 포팅 완료 | — |
| 6 | global/common/ApiResponse.kt | `.../global/common/ApiResponse.kt` (Inv L54) | 포팅 완료 | — |
| 7 | global/sse/SseEmitterManager.kt | `.../global/sse/SseEmitterManager.kt` (Inv L57) | 포팅 완료 | D (운영 알림) |
| 8 | domain/billing/.../BillingService.kt | `.../domain/billing/service/BillingService.kt` (Inv L68) | 포팅 완료 | A1~A9 |
| 9 | domain/billing/.../BillingTextParser.kt | (없음) | **미포팅** | **A8** (공과금 문자 자동 파싱) |
| 10 | domain/settlement/.../ExitSettlementCalculator.kt | (없음 — 현재 BE 계산 엔진 부재, FE billingEngine.js에서 계산) | **미포팅** | **B1** + Critical **C3** (퇴실 정산 BE 엔진) |
| 11 | domain/billing/.../ElectricityRateService.kt | `.../domain/billing/service/ElectricityRateService.kt` (Inv L73) | 포팅 완료 | A (한전 누진 3구간) |
| 12 | domain/building/rule/RuleEngine.kt | (없음) | **미포팅** | **C5** (건물별 룰 엔진) |
| 13 | domain/contract/.../ContractStatusService.kt | (없음 — 상태 전환은 `ContractService` 내부 메소드로 분산) | **미포팅** | **A5 + C1** (계약 상태 머신 통합) |
| 14 | infra/scheduling/OverdueCheckScheduler.kt | `.../infra/scheduling/OverdueCheckScheduler.kt` (Inv L60) | 포팅 완료 | A3 (연체 감지) |

## 미포팅 4건 — Phase 1 Critical 연결

| 자산 | 카드 | 연결되는 Critical | 비고 |
|---|---|---|---|
| BillingTextParser | A8 | (없음, 자동화 편의) | KT/SKT 문자 → BillingRecord 자동 변환 |
| ExitSettlementCalculator | B1 | **C3** | FE에서 BE로 정산 엔진 이관 = Phase 1 진입 게이트 조건 |
| RuleEngine | C5 | (없음, 건물별 특수성) | 건물별 보증금 룰, 옵션 항목 등 |
| ContractStatusService | A5+C1 | **C1** | `pays_for` 관계 구현 시 상태 머신 통합 필요 (Ontology.md L58) |

## 후속 작업
- **Phase 1 진입 전 재확인**: 카드 시작 시점에 `grep -ri "TextParser\|ExitSettle\|RuleEngine\|ContractStatus" houseman-server/src/main/kotlin/` 재실행. 0건 유지 시 표 그대로, 1건 이상 검출 시 "명칭 변경 의심" 행으로 이동.
- **C3 해소 우선순위**: ExitSettlementCalculator 포팅 = Phase 1→2 게이트 5조건 중 하나 (Apply.md §[4] L328~337).

---

## §[5] 단일 진실 공급원 매핑 (Source of Truth)

> D1-Infra 회고 채택 결정 #19/#20 본문. 운영자가 "이 영역의 source는 어디?" 질문 시 즉시 추적 가능.
> 영구 룰: source 본문 변경 시 인용 파일도 동시 갱신 (Ontology §[6] 동일 패턴).

| 영역 | Source of Truth (실 파일) | 인용 문서 | 영구 룰 |
|---|---|---|---|
| 4원칙 (#24~#27) | `CLAUDE.md` L791~814 | `docs/Apply.md §[3]` + `AGENTS.md §15` | Apply.md 본문 = CLAUDE.md 본문 1:1 |
| 19 규칙 (CLAUDE.md #1~#19) | `CLAUDE.md` L668~790 | `docs/Apply.md §[3]` + `.claude/agents/implementer.md` | 변경 시 implementer 정독 7 docs 갱신 |
| Critical 3건 (C1/C2/C3) | `docs/Apply.md §[1]` | `AGENTS.md §9` + `docs/Mapping.md §미포팅` + `docs/Domain_Analysis.md` | 본문 변경 시 reviewer 검사 카테고리 B 갱신 |
| Phase 게이트 5조건 | `docs/Apply.md §[4]` (L328~337 영역) | `docs/Mapping.md L46` + `AGENTS.md §14` | 5조건 변경 시 plans/ source 1:1 갱신 |
| 도메인 의미 관계 (16+ 노드) | `src/data/domainOntology.ts` (코드) | `docs/Ontology.md` (1:1 변환) + `AGENTS.md §11` | ts 변경 시 md 동시 갱신, AGENTS.md 수치 동반 |
| 자동화 룰 (회고 채택 6) | `docs/Automation.md §[3]` | `AGENTS.md §10` + planner/implementer/reviewer 영구 룰 영역 | 룰 추가 시 본 표 + 해당 agent.md 동시 갱신 |
| 영구 룰 3건 (1 카드 = 1 commit 등) | `.claude/agents/implementer.md §영구 룰` | `docs/Apply.md §[5]` + `docs/Automation.md` | 룰 추가 시 implementer.md = 본 매핑 1:1 |
| 운영 결정 라운드 양식 | `.claude/agents/planner.md §7` | `docs/Apply.md §[3]` (예정) | planner 6→7 섹션 확장 (D1-Infra 회고) |
| Hook 4종 + 검사 | `.claude/settings.json` + `scripts/*.sh` + `.claude/hooks/*.sh` | `docs/Hooks.md` + `docs/Automation.md §[1]` | Hook 추가 시 settings.json + Hooks.md 동시 갱신 |
| Subagent 3종 본질 | `.claude/agents/{planner,implementer,reviewer}.md` | `docs/Subagents.md` + `docs/Review.md` (reviewer 8 카테고리) | agent.md 변경 시 Subagents/Review 동반 |
| 수치 (BE API / @Test / FE spec) | 실 코드 grep | `docs/Review.md §7` + `AGENTS.md §1/§13` | 카드 머지 시 §7 갱신, AGENTS.md 동반 |

**검증 영역**: `.claude/hooks/agents-md-integrity.sh` (SessionStart) — AGENTS.md 인용 정합 자동 확인.

**향후 확장**: 본 §[5] 표 row 추가 시 영구 룰 1줄 명시 (인용 ↔ source 동시 갱신 의무).
