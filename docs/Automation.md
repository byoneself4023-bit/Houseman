# Automation — 자동화 도구 + 13 카테고리 + 회고 채택 6 룰

> 본 문서 = 자동화 영역 단일 진실 공급원.
> AGENTS.md §10이 본 문서 인용. C1-a + C1-b 카드 회고에서 채택된 자동화 룰 포함.
>
> Cross-link:
> - `docs/Hooks.md` (Hook 4종 + 6 검사 — 본 문서의 도구 1)
> - `docs/Subagents.md` (Subagent 3종 — 본 문서의 도구 2)
> - `docs/Review.md` (reviewer 8 카테고리 — 자동화 연동)
> - `docs/Apply.md §[3] 4원칙` (자동화 = 안티패턴 회피 강제)

---

## §[1] 자동화 도구 5종

| 도구 | 책임 | 본문 source |
|---|---|---|
| **Hook** | PostToolUse / SessionStart / Stop 자동 발동 — 코드 변경 시 즉시 검사 | `docs/Hooks.md` |
| **Subagent** | planner / implementer / reviewer 권한 분리 + 컨텍스트 격리 | `docs/Subagents.md` |
| **Cron / Scheduled** | BE `@Scheduled` — 매일 09:00 OverdueCheck / 매월 1일 ContractExpiry | `BE/.../infra/scheduling/*.kt` |
| **Webhook / SSE** | 실시간 알림 (OVERDUE_ALERT / PAYMENT_RECEIVED / BILLING_CONFIRMED 등 7종) | `BE/.../global/sse/SseEmitterManager.kt` |
| **외부 CLI** | git / gh / npm / gradle / claude CLI — 운영자 단발성 호출 | `CLAUDE.md` 명령 본문 |

---

## §[2] 13 카테고리 분류 (카드 A~G)

자동화 카드 영역 분류. C1-a 회고 시점 도출.

| 카테고리 | 카드 | 도구 |
|---|---|---|
| A — 청구/정산 자동화 | A1 markPaid / A4 매칭 / A8 BillingTextParser / A9 D 타입 정산 | Hook + Subagent |
| B — 퇴실 자동화 | B1 ExitSettlement BE | Subagent |
| C — Critical 회규 차단 | C1 pays_for / C2 JWT / C3 vacantConfirmed / C5 RuleEngine | Hook |
| D — 운영 알림 | D1-Infra (본 카드) / 운영자 알림 | SSE + Hook |
| E — 보안 | E1~E5 (SecurityConfig / JWT / refresh) | Hook |
| F — 개발 도구 | F1~F3 (error handler / logging) | — |
| G — 테스트 자동화 | G1~G3 (PostToolUse 테스트 자동) | Hook |

---

## §[3] 회고 채택 6 룰 (C1-a + C1-b 운영 결과)

C1-a 카드 후 운영자 회고에서 채택. 모든 카드 영구 적용.

### 룰 1 — wrapper 셸 (`/exit` + `claude` + 첫 메시지 압축)

**문제**: 세션 종료 후 재시작 시 운영자가 매번 첫 메시지 직접 입력 → 컨텍스트 누락.

**채택**: wrapper 셸로 `/exit` → `claude` 자동 재시작 + 첫 메시지에 다음 카드 prompt 압축 자동 주입.

**적용**: 별도 카드 §17 영구화 예정 (도구 = 외부 CLI 도구 5).

### 룰 2 — chore PR 자동 생성 wrapper

**문제**: 카드 완료 후 chore PR (회고 / 영구 룰 변경) 운영자 손 작업 N회.

**채택**: implementer 카드 commit 직후 chore PR (분리) 자동 생성 wrapper.

**적용**: C1-a 회고 commit (`f2ff7a9`)에서 일부 적용. 별도 카드 영구화 예정.

### 룰 3 — chore PR 통합 자동화 (시각 검토 5초 영역)

**문제**: chore PR이 다건 누적 시 운영자 1건씩 검토 → 시간 비효율.

**채택**: chore PR 통합 자동화 (단일 squash) + 운영자 시각 검토 5초 가드. **본 D1-Infra 카드 진행 영역도 적용 가능 후보**.

**보류 조건**: chore PR 내용이 도메인/Critical 영역 0인 경우만 (docs/ 매뉴얼 정합 / 회고 정리 등).

### 룰 4 — reviewer FAIL → implementer 재호출 자동 prompt

**문제**: reviewer FAIL 시 운영자가 implementer 재호출 prompt 직접 작성 → 위반 사항 누락.

**채택**: reviewer FAIL 결과 (위반 사항 본문) → implementer 재호출 prompt 자동 조합 (구체 위반 + 수정 제안 포함).

**제약**: subagent → subagent 직접 호출 불가 (1단계 nesting). orchestrator (Main) 자동 prompt 조합만.

### 룰 5 — `save-plan.sh` Subagent 출력 자동 누적

**문제**: Subagent 출력 (6 섹션 plan / implementer 보고 / reviewer 결과)이 운영자 컨텍스트에만 남고 plans/ 미저장 → 사후 추적 불가.

**채택**: Stop Hook의 `save-plan.sh`가 Subagent 출력 자동 누적 (현재는 카드명 단위 덮어쓰기, 향후 append 영역).

**구현**: `scripts/save-plan.sh` (현재 활성).

### 룰 6 — reviewer commit 메시지 직접 추천 → orchestrator 1회 commit

**문제**: 카드 commit 메시지 운영자 직접 작성 → 카드 산출물 누락 / 영구 룰 위반 (Co-Authored-By 등).

**채택**: reviewer PASS 시 commit 메시지 본문 직접 추천 (HEREDOC 형식). orchestrator는 그대로 1회 commit.

**적용**: C1-a / C1-b commit 메시지 (`8a70be9` / `152b308`) 이미 적용. 본 D1-Infra 카드도 적용 (카드 본문에 commit 메시지 포함).

---

## §[4] 보류 2건 (채택 X — 위험)

### 보류 1 — planner → implementer 자동 파이프

**제안**: planner 6 섹션 출력을 즉시 implementer에 자동 전달 (운영자 컨펌 0).

**보류 사유**: planner 옵션 선택 운영자 결정 영역 → 자동화 시 잘못된 옵션 선택 위험 (예: C1-a 옵션 B 결정은 운영자 판단).

**대안**: orchestrator가 옵션 결정 명시 후 implementer 호출 (현재 패턴 유지).

### 보류 2 — Claude CLI `--prompt` 일괄 실행

**제안**: 카드 prompt를 `claude --prompt "$(cat prompts/Phase1/D1-Infra.md)"` 형식으로 일괄 실행.

**보류 사유**: 카드 진행 중 운영자 의사결정 영역 다수 (planner 옵션 / implementer 자가 점검 검수 / reviewer FAIL 시 재호출). 일괄 실행 시 의사결정 누락.

**대안**: 운영자 명시 호출 (`@planner` → `@implementer` → `@reviewer`) 패턴 유지.

---

## §[5] 도구 책임 매트릭스

| 책임 | Hook | Subagent | Cron | SSE | 외부 CLI |
|---|---|---|---|---|---|
| 코드 변경 시 즉시 검사 | ◎ | — | — | — | — |
| 카드 분해 + 6 섹션 plan | — | ◎ (planner) | — | — | — |
| 코드 작성 + 테스트 | — | ◎ (implementer) | — | — | — |
| 외부자 시각 검증 | — | ◎ (reviewer) | — | — | — |
| 매일 연체 감지 | — | — | ◎ | — | — |
| 운영자 실시간 알림 | — | — | — | ◎ | — |
| git / gh / gradle 실행 | — | — | — | — | ◎ |
| 영구 룰 자동 차단 (alert/confirm/prompt) | ◎ | — | — | — | — |
| Critical 회규 차단 (C1/C2/C3) | ◎ | ◎ (reviewer) | — | — | — |
| 매뉴얼 임의 수정 차단 | ◎ (검사 6 화이트리스트) | — | — | — | — |
| 카드 작업 이력 누적 | ◎ (Stop) | — | — | — | — |
| 회고 commit 자동 추천 | — | ◎ (reviewer) | — | — | — |

---

## §[6] Hook 4종 + 6 검사 요약 (`docs/Hooks.md` 본문 참조)

| Hook | matcher | 스크립트 | 효과 |
|---|---|---|---|
| SessionStart | `*` | `cat AGENTS.md` | 매 세션 16 섹션 컨텍스트 주입 |
| PostToolUse | `Edit\|Write` | `run-related-tests.sh` | 변경 파일 관련 테스트 자동 |
| PostToolUse | `Edit\|Write` | `critical-rules-check.sh` | 6 검사 자동 차단 |
| Stop | `*` | `save-plan.sh` | `plans/` 자동 누적 |

**6 검사 영역**:
1. alert/confirm/prompt 사용
2. whitespace-only 차단 (Surgical)
3. TransactionService ↔ BillingRecord (C1)
4. MoveOutLinkController ↔ JWT+TTL (C2)
5. ContractService.moveOut ↔ vacantConfirmed (C3)
6. docs/*.md 수정 (화이트리스트 3건 제외)

화이트리스트: `docs/Mapping.md` / `docs/Hooks.md` / `docs/ARCHITECTURE.md` (자기참조 갱신 정당).

---

## §[7] 도구별 영구 룰 (운영자 머슬 메모리)

| 도구 | 영구 룰 |
|---|---|
| Hook | 우회 시 의식적 결정 (settings.json 백업 → 작업 → 복원). 자동 우회 0. |
| Subagent | `@mention` 명시 호출 default. Opus 4.7 under-spawn 대응 (Subagents.md §[4]). |
| Cron | `@Scheduled` 변경 시 cron 표현식 docs/Domain_Analysis.md §[2] 동반 갱신. |
| SSE | 신규 이벤트 추가 시 7종 표 (`CLAUDE.md` Phase 3c) + reviewer 검사 영역 동반. |
| 외부 CLI | git commit 메시지 Co-Authored-By 0 / 1 카드 = 1 commit / raw 출력 의무. |
