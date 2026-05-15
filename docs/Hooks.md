# Hooks

> Hook + Script 운영 매뉴얼. `.claude/settings.json` Hook 4종 + `scripts/*.sh` 3개 자동 차단/누적 회로 매뉴얼.
> Subagent 매뉴얼은 `docs/Subagents.md`. 사상은 `docs/Harness.md`.

---

## [0] 왜 Hook을 강제하는가

8가지 이유:

1. **운영자 망각** — 47개 룰을 매 작업 다 기억 못 함. 시스템이 강제해야 정합.
2. **Subagent도 망각** — implementer가 self-bias로 위반 합리화. Hook은 외부 강제.
3. **Self-bias 회피** — reviewer 직전에 Hook이 자동 차단 → 대화 합의로 우회 불가.
4. **Doc-only Rules 안티패턴 회피** — CLAUDE.md만 박고 자동 강제 0이면 44건 alert 위반 같은 산 증거 누적.
5. **Surgical 자동** — `git diff --check` whitespace-only 차단으로 카드 범위 외 변경 차단.
6. **Goal-Driven 자동** — PostToolUse가 관련 테스트 자동 실행 → "테스트 안 돌렸음" 사고 0.
7. **Audit trail** — Stop Hook이 `plans/` 자동 누적 → 사후 추적 + 재현 가능.
8. **컨텍스트 절약** — Hook이 검사 자동 → Main 컨텍스트에 검증 잡음 0 침투.

---

## [1] Hook 4종 (`.claude/settings.json`)

| Hook | matcher | 실행 | 효과 |
|---|---|---|---|
| `SessionStart` | `*` | `cat AGENTS.md` | 매 세션 16 섹션 컨텍스트 자동 주입 |
| `PostToolUse` | `Edit|Write` | `bash scripts/run-related-tests.sh` | 변경 파일 관련 테스트 자동 실행 |
| `PostToolUse` | `Edit|Write` | `bash scripts/critical-rules-check.sh` | 6 검사 자동 차단 |
| `Stop` | `*` | `bash scripts/save-plan.sh` | `plans/` 자동 누적 |

PostToolUse 2개는 직렬 실행. 어느 하나 exit 1이면 Hook 실패 → Claude가 차단 인지.

---

## [2] critical-rules-check.sh 6 검사

각 위반 시 `❌ Critical 룰 #N 위반: {파일} — {수정 제안}` stderr + exit 1.

| # | 검사 | 산 증거 / 근거 |
|---|---|---|
| 1 | `git diff --cached`에 `^\+.*\b(alert|confirm|prompt)\s*\(` 차단 | CLAUDE.md #5 + 44건 위반 흔적 |
| 2 | `git diff --cached --check` whitespace-only 차단 | CLAUDE.md #26 Surgical |
| 3 | `TransactionService` 변경 시 `BillingRecord` 미언급 차단 | C1 회귀 — `pays_for` 관계 부재 본질 |
| 4 | `MoveOutLinkController` 변경 시 `JWT|signed|TTL` 미언급 차단 | C2 회귀 — public link 무인증 |
| 5 | `ContractService.moveOut` 변경 시 `vacantConfirmed` 미언급 차단 | CLAUDE.md #11 + C3 — 퇴실 이벤트 자동 삭제 금지 |
| 6 | `docs/*.md` 수정 차단 (화이트리스트 2건 제외) | Doc-only Rules 안티패턴 회피 — 매뉴얼 임의 변경 시 정합 깨짐 |

---

## [3] 화이트리스트 (검사 6)

| 파일 | 사유 |
|---|---|
| `docs/Mapping.md` | Sub-1 산출물 — 포팅 자산 표는 카드 진행 시 갱신 정당 (재사용/재구현 대조 표 라이브 갱신) |
| `docs/Hooks.md` | 본 문서 — Hook 신규 추가 / 검사 추가 시 매뉴얼 갱신 정당 |
| `docs/ARCHITECTURE.md` | 파일 위치 매뉴얼 — 새 디렉토리/파일 추가 시 갱신 정당 |

그 외 `docs/*.md` 10건 (Apply / Karpathy / Harness / Agent / Roadmap / Review / Domain_Analysis / Inventory / Automation / Ontology / Subagents / ARCHITECTURE)은 임의 수정 차단. 갱신 정당 사유 있을 시 운영자가 Hook 일시 우회 (§[4]) 또는 plan 승인 후 산출물 명세에 포함.

---

## [4] Hook 예외 처리 시점

운영자가 의도적 우회 정당한 케이스:

- 마이그레이션 작업 중 일시 정지 (대량 파일 일괄 수정 시 Hook 매 파일 발동 비효율)
- 매뉴얼 정정 작업 (docs/*.md 다건 갱신 시 plan 승인 후 일시 우회)
- 신규 Hook/Script 추가 시 (자기참조 회피)

우회 방법 (수동만):
```bash
# 일시 우회: settings.json hooks 필드 임시 백업
mv .claude/settings.json .claude/settings.json.bak
# 작업 종료 후
mv .claude/settings.json.bak .claude/settings.json
```

자동 우회 0. 매 우회 운영자 의식적 결정.

---

## [5] 안전벨트 비유

Hook = 자동차 안전벨트. Default 강제, 의식 안 해도 자동. 시동 걸면 알람 → 매면 조용. 우회 가능하지만 의식적 결정 + 사고 책임 운전자.

CLAUDE.md 19 규칙은 운전 매뉴얼 (지식). Hook은 안전벨트 (강제 장치). 둘 다 있어야 사고 0.

대비:
- 안전벨트 0 + 매뉴얼만 → 44건 alert 위반 (Doc-only Rules 산 증거)
- 안전벨트 + 매뉴얼 → 위반 0 + 사고 시 충격 흡수

---

## [6] AGENTS.md §8 + CLAUDE.md #21·#23 매핑

| 위치 | 박힌 내용 |
|---|---|
| `AGENTS.md §8` | "Hooks 4종 → `.claude/settings.json` (Sub-3). SessionStart / PostToolUse×2 / Stop." |
| `CLAUDE.md #21` | Hook 동작 일람 (SessionStart→AGENTS.md / PostToolUse→test+critical / Stop→save-plan) |
| `CLAUDE.md #23` | Critical 룰 자동 차단 6 검사 명시. 본 문서 §[2]가 상세 |

운영자/Subagent는 AGENTS.md §8 → CLAUDE.md #21·#23 → 본 문서 순으로 정독.
