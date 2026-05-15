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
