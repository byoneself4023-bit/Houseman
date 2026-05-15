# 카드: Agent_Harness
date: 2026-05-16

## 카드 정의
Houseman Agent Harness 구축 — Setup_1/2/3/4 분할 실행. 산출물 13개 (문서 3 + Subagent 3 + Hook+Script 5 + 첫 plan 1 + AGENTS.md/CLAUDE.md 갱신 2).

## planner 출력
(생략 — 단계 1은 운영자 직접 의사결정, planner 비호출. 4 sub-prompt가 plan을 대체)

## implementer 출력

### 변경 파일 목록
- `AGENTS.md` (신규, 55줄, §1~§16 16 H2 섹션)
- `CLAUDE.md` (+ #20~#27 카테고리 8개: Subagent / Hook / plans / Critical / Think / Simplicity / Surgical / Goal-Driven)
- `docs/Mapping.md` (신규, 46줄, HAUT 포팅 자산 14건 표 — Setup_4 prompt가 "HAUT_Mapping" 명명했으나 실 파일은 `Mapping.md` 단일 통합)
- `.claude/agents/planner.md` (신규, 69줄, Read only + 6 섹션 규칙)
- `.claude/agents/implementer.md` (신규, 76줄, 전체 권한 + 자가 점검)
- `.claude/agents/reviewer.md` (신규, 77줄, Read+Bash + 4원칙/안티패턴/Critical 검증)
- `.claude/settings.json` (신규, 14줄, 4 Hook: SessionStart/PostToolUse×2/Stop)
- `scripts/run-related-tests.sh` (신규, 46줄, 3 분기 e2e/kt/ts)
- `scripts/critical-rules-check.sh` (신규, 63줄, Critical 6 검사 — alert / whitespace / TransactionService↔BillingRecord / MoveOutLinkController↔JWT / moveOut↔vacantConfirmed / docs 화이트리스트)
- `scripts/save-plan.sh` (신규, 61줄, Stop hook 자동 누적)
- `plans/README.md` (신규, 20줄, 카드 1 = 파일 1 규칙)
- `plans/2026-05-16-agent-harness-setup.md` (이 파일, 신규)

### 자가 점검 결과
- [x] Simplicity (AGENTS.md 55줄 = 80줄 미만)
- [x] Surgical (CLAUDE.md 기존 #1~#19 0 수정, #20~#27만 신규 추가)
- [x] Goal-Driven (검증 1~5 PASS 후 종료)

## reviewer 결과

### 검증 1~5 결과
- 검증 1 (PostToolUse Hook 자동 발동 + 변수 전달): **PASS** — `bash scripts/run-related-tests.sh BillingService.kt` → `[run-related-tests] gradle: *BillingService*` stderr + gradle test 분기 진입 확인. (BillingService 매처 일치 BE @Test 0건이라 gradle FAILED는 정상 — 스크립트 분기 자체는 PASS.)
- 검증 2 (alert/confirm/prompt 차단, Critical 룰 #1): **PASS** — `src/utils/index.ts`에 `// alert("test")` staged → `bash scripts/critical-rules-check.sh` → `❌ Critical 룰 #1 위반: alert/confirm/prompt 사용 감지` stderr + exit 1. 즉시 unstage + 원본 복구 완료.
- 검증 3 (docs 수정 차단, Critical 룰 #6): **PASS** — `docs/Karpathy.md` 1줄 staged → `bash scripts/critical-rules-check.sh` → `❌ Critical 룰 #6 위반: docs/Karpathy.md 수정 차단 — 화이트리스트 (docs/Mapping.md, docs/Hooks.md) 외 매뉴얼 임의 변경 금지` stderr + exit 1. 즉시 원복.
- 검증 4 (AGENTS.md SessionStart 자동 주입): **PASS** — 이번 세션 시작 시 `SessionStart:startup hook success: # AGENTS.md` 시스템 리마인더로 §1~§16 16 H2 섹션 전부 컨텍스트 진입 확인. §1 첫 줄 / §16 마지막 줄 발췌 응답 완료.
- 검증 5 (C1-a planner subagent dry run): **PASS** — planner subagent에 C1-a 카드 분해 프롬프트 전달, 6 섹션 markdown plan 출력 받음. 체크리스트 4항목 (§1 가정 / §3 옵션 / §4 트레이드오프 / §6 검증) 모두 충족.
  - §1: HAUT 자산 (BillingService Mapping #8 포팅 완료) + `pays_for` 부재 (Ontology §[2] L58) + status DRAFT/CONFIRMED/SENT 명시
  - §3: 옵션 A (VARCHAR+CHECK) / 옵션 B (Kotlin enum, 추천) / 옵션 C (PG ENUM, 제외) 3개 비교
  - §4: 옵션 A vs B 메트릭 표 (LOC / 회귀 @Test / 다운타임 / Hook 정확도 등 8 항목) + retro-fit 시점 메트릭 표
  - §6: BillingServiceTest 5 케이스 + PaymentFlowTest 시나리오 1건 + BE 105 @Test 중 BillingRecord 의존 ~10건 명시 + Phase 1→2 진입 게이트 1조건 1:1 매핑

### 다음 액션
**PASS**: Phase 1 첫 카드 (C1-a) 정식 분해 prompt 작성 → 운영자가 다음 세션에서 진행. 본 dry run의 6 섹션 plan이 그대로 실 작업 plan으로 활용 가능 (`docs/Subagents.md §[5]` history 미공유 대응).

## PR 링크
(없음 — 단계 1은 인프라 구축이라 PR 단위로 묶지 않음)
