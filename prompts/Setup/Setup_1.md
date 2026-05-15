# Setup_1 — 단계 1 Sub-1 (문서 영역)

**Plan mode 필수**. 단계 1 = Houseman Agent Harness 구축. Sub-1은 문서 영역만.

---

## 입력 자산 (11개 — 정독 후 plan 작성)

`docs/Karpathy.md` / `docs/Apply.md` / `docs/Harness.md` / `docs/Agent.md` / `docs/Roadmap.md` / `docs/Review.md` / `docs/Domain_Analysis.md` / `docs/Inventory.md` / `docs/Automation.md` / `docs/Ontology.md` + 루트 `CLAUDE.md`.

---

## CLAUDE.md 처리 (절대 보존 + 끝에 카테고리 추가)

기존 35KB 전체 보존: 재구축 계획서 (Pre/Phase 0~6) + 최종 기술 스택 표 + HAUT 포팅 워크플로우 + HAUT 자산 표 14건 + Phase 5 페이지 분해 후보 + **19 규칙** (아키 4 / UI 4 / 도메인 3 / 빌드 2 / E2E 6) + **21 체크리스트** (통합 7 / BE 5 / FE 5 / DevOps 4).

마지막 카테고리 (`## E2E 테스트 (Playwright)`) 다음에 신규 카테고리 `## Agent Harness 운영` 추가 + 명시 번호 `### #20` ~ `### #27`:

- **#20 Subagent 호출 규칙** — planner(Read only) / implementer(전체) / reviewer(Read+Bash) 위임 default. orchestrator 직접 코드 작성 금지.
- **#21 Hook 동작** — SessionStart(AGENTS.md 주입) / PostToolUse(Edit|Write)(test) / PostToolUse(Edit)(critical-rules) / Stop(save-plan).
- **#22 plans/ 저장 규칙** — 카드 1개 = 파일 1개 (`plans/YYYY-MM-DD-카드명.md`), 동일 카드 재실행 시 덮어쓰기.
- **#23 Critical 룰 자동 차단** — `critical-rules-check.sh` 6개 검사 (Sub-3에서 구현). 위반 시 exit 1.
- **#24 Think Before Coding** — planner 6 섹션 출력 필수.
- **#25 Simplicity First** — implementer 자가 점검 (200→50줄 가능?).
- **#26 Surgical Changes** — diff에 작업과 직접 연결 없는 변경 금지. Hook 자동 차단.
- **#27 Goal-Driven Execution** — 테스트 먼저 → 통과 → 회귀 확인. Hook 자동 실행.

기존 19 규칙 통합 번호 매핑 (참조용, 본문 수정 X): 아키 #1~#4 / UI #5~#8 / 도메인 #9~#11 / 빌드 #12~#13 / E2E #14~#19. (#5 alert/confirm/prompt 금지 / #11 vacantConfirmed 가 자주 인용)

---

## 산출물 3개

### 산출물 1: `AGENTS.md` 신규 (루트)

**목차 역할만. 본문 80줄 미만 가드라인** (Harness.md 원칙 1 "컨텍스트는 예산". SessionStart Hook이 매 세션 주입하므로 길면 컨텍스트 소비).

16 섹션, 각 섹션 2~5줄 압축:

- §1 프로젝트 개요 — 8명 운영 부동산 / 63 API / 105 @Test / 59 E2E. history는 `CLAUDE.md` 참조.
- §2 시스템 구조 → `docs/Inventory.md`
- §3 도메인 → `docs/Domain_Analysis.md`
- §4 카파시 9원칙 → `docs/Karpathy.md §2` + `docs/Apply.md §[2]`
- §5 4원칙 → `docs/Karpathy.md §3` + `docs/Apply.md §[3]` (직접 박힘: `CLAUDE.md #24~#27`)
- §6 Rails 매트릭스 → `docs/Apply.md §[2] 원칙 7 표`
- §7 Subagents 3종 → `.claude/agents/*.md` (Sub-2 산출물)
- §8 Hooks 4종 → `.claude/settings.json` (Sub-3 산출물)
- §9 Critical 3건 (C1/C2/C3) → `docs/Apply.md §[1]`
- §10 자동화 영역 → `docs/Automation.md` (5종 도구 + 13 카테고리)
- §11 도메인 온톨로지 → `docs/Ontology.md` (16 노드 + 11 관계 + 6 룰). **`pays_for` 관계 = C1 본질** 명시.
- §12 HAUT 포팅 자산 → `docs/HAUT_Mapping.md` (산출물 3)
- §13 Source of Truth → `docs/Review.md §7`
- §14 Roadmap → `docs/Apply.md §[4]` Phase 1~3. **#1 매칭 + #8 인사이트 Phase 1 병렬**.
- §15 4원칙 한 줄 → `CLAUDE.md #24~#27`
- §16 인덱스 — docs/*.md 10개 + CLAUDE.md + plans/ + .claude/agents/ 링크

### 산출물 2: `CLAUDE.md` 갱신

위 "## Agent Harness 운영" 카테고리 신규 추가 (#20~#27 박기). 기존 영역 0 수정.

### 산출물 3: `docs/HAUT_Mapping.md` 신규

CLAUDE.md "HAUT에서 그대로 가져올 자산" 14건 × `Inventory.md` 16 services 대조 표. 3 분류:

| 분류 | 자산 |
|---|---|
| 포팅 완료 (Inventory.md 확인) | SecurityConfig / JwtProvider / JwtAuthFilter / BaseEntity / ApiResponse / SseEmitterManager / BillingService / ElectricityRateService / OverdueCheckScheduler (예상 9건) |
| 명칭 변경 의심 | grep 결과로 확인 |
| 미포팅 (작업 필요) | BillingTextParser → A8 / ExitSettlementCalculator → B1 / RuleEngine → C5 / ContractStatusService → A5+C1 |

각 자산별 행: HAUT 이름 / Houseman 경로 (Inventory.md 기준) / 분류 / 영향 카드 (Automation.md 참조).

---

## 검증 3건

1. `wc -l AGENTS.md` → 80줄 미만 확인
2. `grep -c "^## \|^### " AGENTS.md` → 16 섹션 다 채워짐
3. CLAUDE.md 기존 영역 보존 확인 — `git diff HEAD -- CLAUDE.md | grep "^-" | grep -v "^---"` 결과가 빈 줄만 (제거 줄 0)

---

## 보고

- 3개 파일 경로 + 라인 수
- 검증 1~3 결과 (PASS/FAIL)
- CLAUDE.md 추가 부분 diff 요약 (#20~#27 박힌 위치)
- HAUT_Mapping.md 대조 분류 결과 (포팅 완료 / 명칭 변경 / 미포팅 각 N건)

---

## 절대 금지

- CLAUDE.md 기존 내용 0 수정
- docs/*.md 10개 기존 파일 수정 (HAUT_Mapping.md는 **신규** 파일이라 OK)
- AGENTS.md 본문 80줄 초과
- orchestrator 직접 코드 작성 (Subagent 부재 단계라 직접 작성 가능. 단 산출물은 문서/마크다운만)
