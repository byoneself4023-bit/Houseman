# Subagents

> 이 시스템에서 Claude Code Subagent를 **어떻게/왜** 쓰는가 운영 매뉴얼.
> `.claude/agents/*.md` = Subagent 자신용 system prompt. 이 문서 = 운영자/Agent 관리자 매뉴얼.
> 일반 사상은 `docs/Harness.md`, 원칙 매핑은 `docs/Apply.md`.

---

## [0] 왜 Subagent를 쓰는가

이 시스템 컨텍스트:
- **47개 룰** (CLAUDE.md 19 + Agent Harness 8 + 4원칙 + 21 체크리스트) — 시니어도 매 작업 다 못 기억
- **Critical 3건** (C1 입금↔청구 / C2 public link / C3 퇴실 정산 BE) — 회귀 사고 = 운영 직격
- **44건 위반 흔적** (alert/confirm/prompt) — Doc-only Rules 안티패턴의 산 증거
- **운영자 1인** — 9원칙 위임 default 안 하면 throughput 천장 1세션

Subagent 4가지 가치:

1. **컨텍스트 격리** — 작업 잡음이 운영자 의사결정 컨텍스트에 안 침투
2. **권한 분리** — 검토자는 코드 못 고침 → 실수 자동 차단
3. **Self-bias 회피** — implementer 자가 합리화를 reviewer가 외부자 시각으로 잡음
4. **컨텍스트 윈도우 확장** — Main 200K + Subagent별 자체 200K (병렬 시 N×200K)

---

## [1] 3종 역할 분담

| Subagent | 권한 (`tools`) | 책임 | 호출 시점 |
|---|---|---|---|
| **planner** | `["Read", "Grep", "Glob"]` only | 카드 분해 + 6 섹션 plan 작성. 코드 작성 불가 (사고 누락) | 카드 시작 시 |
| **implementer** | `["Read", "Write", "Edit", "Bash", "Grep", "Glob"]` 전체 | plan 받아 코드 + 테스트 동시 작성 | planner 출력 컨펌 후 |
| **reviewer** | `["Read", "Grep", "Glob", "Bash"]` — Write/Edit 0 | 4원칙 + 안티패턴 + Critical 회귀 검증. 수정 권한 0 (검증만 강제) | implementer 출력 후 |

핵심 안전망: reviewer가 Write 못 함 → "검증한 척" 후 멋대로 수정 사고 차단. PASS/FAIL만 보고 → 운영자가 받고 implementer 재호출 (1단계 nesting 제한 정합).

---

## [2] 컨텍스트 격리 메커니즘

```
[Main 세션 — 운영자 의사결정 컨텍스트]
  │  Agent tool 호출
  │  (subagent에 전달: 카드 정의 + 선행 결정사항 명시)
  ↓
┌──────────────────────────────────────────────┐
│ [planner — 새 200K 윈도우, 깨끗한 시작]      │
│ Read docs/Apply.md 12K 토큰                  │
│ Read docs/Ontology.md 8K 토큰                │
│ Read TransactionService.kt 4K 토큰           │
│ 내부 추론 20K 토큰                            │
│ 합계 = 44K 소비                               │
│ ↓                                            │
│ return: 6 섹션 plan = 2K 토큰만 반환          │
└──────────────────────────────────────────────┘
  │
  ← Main이 받는 건 2K 토큰 결과만 (내부 44K는 0 침투)
```

운영자가 받는 건 정제된 결과만 → Main 컨텍스트 보존. 200K → 1M (Opus 4.7) 윈도우라도 잡음이 누적되면 신호 대 잡음비 무너짐. Subagent가 이걸 회피.

---

## [3] C1-a 카드 분해 전체 흐름

```
[Main] 운영자가 Claude Code에서:
  > @planner C1-a 카드 분해해줘 (dry run, 실 코드 X)
       │  SessionStart Hook이 AGENTS.md 자동 주입 → 16 섹션 컨텍스트
       │  Agent tool로 planner spawn
       ↓
┌──────────────────────────────────────────────┐
│ [planner subagent — Read only]               │
│ Read docs/Apply.md / Ontology.md / Mapping.md │
│ Read docs/Automation.md / CLAUDE.md          │
│ Grep "TransactionService" / Read 35-71 라인  │
│ 6 섹션 plan 작성:                              │
│  §1 가정 / §2 영향 범위 / §3 옵션 ≥2          │
│  §4 트레이드오프 / §5 실패 모드 / §6 검증 방법 │
│ return: markdown 6 섹션                       │
└──────────────────────────────────────────────┘
       │
[Main] plan 컨펌
  > @implementer plan 실행 (plan 전체 명시 전달 — §[5] 참조)
       ↓
┌──────────────────────────────────────────────┐
│ [implementer subagent — 전체 권한]            │
│ Read 관련 파일 + Write V12 SQL                │
│ Edit BillingService.kt + markPaid()           │
│ Edit domainOntology.ts + pays_for 박기        │
│ Write BillingServiceTest.kt + @Test 3건       │
│   ↓ Edit 호출 시점에                          │
│   PostToolUse Hook 자동 발동:                 │
│     - run-related-tests.sh (검증 1)           │
│     - critical-rules-check.sh (검증 2~6)      │
│   ↓ 위반 시 exit 1 → implementer 중단         │
│ Bash ./gradlew test → PASS                    │
│ return: 변경 파일 / diff / 자가 점검 / 테스트  │
└──────────────────────────────────────────────┘
       │
[Main] 결과 확인
  > @reviewer 검증
       ↓
┌──────────────────────────────────────────────┐
│ [reviewer subagent — Read+Bash, Write 0]      │
│ ★ Self-bias 회피: implementer 자가 점검 X     │
│   별도 컨텍스트로 외부자 재검증                │
│ Grep "alert|confirm|prompt" in src/            │
│ Grep "vacantConfirmed" in moveOut diff         │
│ Bash ./gradlew test 재실행                     │
│ return: PASS/FAIL + 검사 항목 + 다음 액션      │
└──────────────────────────────────────────────┘
       │
[Main] PASS → squash merge / FAIL → implementer 재호출
       │  세션 종료
       ↓
   Stop Hook → scripts/save-plan.sh
   → plans/2026-MM-DD-c1-a.md 자동 저장
```

---

## [4] Opus 4.7 환경 정합 — 명시 호출 강제

Anthropic 공식 docs: Opus 4.7은 default가 **inline 처리 (subagent 덜 spawn)**. 4.6의 over-spawn 경향과 반대 방향. 운영자가 **명시 호출**해야 spawn.

| 4.7 default 동작 | 운영자 대응 |
|---|---|
| 단순 작업: 직접 처리 (subagent 0) | 그대로 OK — Karpathy 원칙 1 정합 |
| 멀티스텝 작업: 한 응답에 fan-out 시도 | `@planner` 명시 호출 → 강제 위임 |
| description 자동 매칭 | imperfect → 명시 호출 default 유지 |

CLAUDE.md #20에 박힌 명시 호출 default가 Opus 4.7에서 더 중요. `@mention` 패턴 운영자 머슬 메모리화.

---

## [5] Subagent는 conversation history 미공유

Anthropic 공식: subagent는 부모 conversation history를 0 공유. delegation prompt에 전달된 텍스트만 봄.

함정: planner가 "옵션 A 선택, 근거 X"라고 결정해도, implementer 호출 시 plan 전체 전달 안 하면 implementer는 옵션 A인 줄 모름.

운영자 대응:
- planner 6 섹션 출력을 **그대로** implementer 입력으로 복붙 (요약 X)
- "결정사항: 옵션 A 선택, 근거 X" 등 컨텍스트는 prompt에 명시

```
[Main] @implementer 다음 plan 실행:

[planner 6 섹션 출력 그대로 복붙]

추가 결정사항: 옵션 A 선택 (근거: ...). 절대 옵션 B로 가지 마.
```

이 규칙은 Sub-2 작성 시 implementer.md system prompt에 박힘.

---

## [6] 호출 시점 가이드

| 카드 성격 | 호출 패턴 |
|---|---|
| 단순 grep / 파일 1개 읽기 | 직접 처리 (subagent X) — 운영자가 Main에서 |
| 단순 텍스트 수정 (오타) | 직접 처리 |
| 1 파일 함수 1개 수정 + 테스트 | implementer만 (planner 생략 가능) |
| 멀티 파일 / 도메인 로직 / Critical 영역 | **planner → implementer → reviewer 풀 흐름** |
| Phase 1 카드 (C1-a/b/c, A4, D1 등) | **풀 흐름 필수** |
| 코드 정독 + 분석 (Read only) | planner만 (분석 보고서) |

**default = 풀 흐름**. 단순 작업이라 판단되면 그제서야 단축. 안전 default가 정합.

---

## [7] Self-bias 회피 메커니즘

같은 모델(Sonnet 또는 Opus)이라도 **컨텍스트 분리만으로 객관성 증가**:

- implementer 컨텍스트엔 "내가 작성한 코드"가 있음 → 자가 합리화 본능 ("이건 일부러 그런 거야")
- reviewer 컨텍스트엔 "코드 + docs만" 있음 → 외부자 시각

비유: Mock interview에서 친구에게 보이지 않던 게 처음 보는 사람에게 보이는 원리. **모델 능력이 아니라 컨텍스트 분리가 안전망**.

운영자가 reviewer를 implementer 직후가 아니라 **새 세션 시작 후** 호출하면 더 강력 (전혀 다른 컨텍스트). 단 일반 흐름은 같은 세션 내 호출 OK.

---

## [8] 함정 + 대응 표

| 함정 | 원인 | 대응 |
|---|---|---|
| Opus 4.7 under-spawn | 4.7 default가 inline 처리 | `@mention` 명시 호출 강제 (CLAUDE.md #20) |
| history 미공유로 결정 누락 | subagent는 부모 컨텍스트 0 봄 | delegation prompt에 plan 전체 명시 전달 |
| description 자동 매칭 imperfect | Claude가 description 보고 잘못 spawn | 명시 호출 default. description은 보조용 |
| 1단계 nesting 제한 | subagent가 또 subagent 못 spawn | reviewer FAIL 시 Main이 implementer 재호출 (자동 X) |
| Observability 부재 | subagent 내부 trace 보기 어려움 | Stop Hook이 `plans/{date}-카드.md` 자동 누적 → 사후 추적 |
| 비용 — Opus subagent 다중 호출 | 단순 작업도 spawn하면 비싸짐 | `model: sonnet` 또는 `model: haiku` per-agent 설정 (Sub-2에서 검토) |

---

## 핵심 메시지 3개

1. **Subagent = 컨텍스트 격리 + 권한 분리 안전망** — 47개 룰 + Critical 3건을 운영자 머리 X, 시스템이 강제.

2. **Opus 4.7은 under-spawn default → 명시 호출 강제** — `@mention` 패턴 운영자 머슬 메모리. CLAUDE.md #20 박힘.

3. **delegation prompt에 결정사항 명시 전달 필수** — subagent는 history 0 공유. plan 전체 복붙 + 추가 결정 명시. 요약 X.
