# ARCHITECTURE

> 파일 위치 + 역할 일람. 새 파일 생성 / 파일 이동 / 참조 경로 작성 시 첫 참조 문서.
> 명명 규칙 포함됨.

---

## [0] 디렉토리 트리 전체

```
/Users/kuka/Houseman/
│
├── AGENTS.md                          (루트, Sub-1)
├── CLAUDE.md                          (루트, 기존 + Sub-1 갱신)
│
├── docs/                              (매뉴얼 13건)
│   ├── Karpathy.md
│   ├── Apply.md
│   ├── Harness.md
│   ├── Agent.md
│   ├── Roadmap.md
│   ├── Review.md
│   ├── Domain_Analysis.md
│   ├── Inventory.md
│   ├── Automation.md
│   ├── Ontology.md
│   ├── Subagents.md
│   ├── Mapping.md                     (Sub-1 산출물)
│   ├── ARCHITECTURE.md                (이 문서)
│   └── Hooks.md                       (Sub-3 산출물)
│
├── .claude/                           (Subagent + Hook, Sub-2/3)
│   ├── settings.json                  (Sub-3, Hook 4종 정의)
│   └── agents/
│       ├── planner.md                 (Sub-2, Read only)
│       ├── implementer.md             (Sub-2, 전체 권한)
│       └── reviewer.md                (Sub-2, Read+Bash)
│
├── scripts/                           (Sub-3)
│   ├── run-related-tests.sh
│   ├── critical-rules-check.sh
│   └── save-plan.sh
│
├── plans/                             (Sub-3 + 자동 누적, flat)
│   ├── README.md
│   ├── Agent_Harness.md               (Sub-4 산출물)
│   └── {카드명}.md                    (Stop Hook 자동 생성)
│
├── prompts/                           (단계별 실행 prompt 보관, 계층)
│   ├── Setup/
│   │   ├── Setup_1.md ~ Setup_4.md
│   └── Phase1/
│       ├── C1-a.md
│       └── (Phase 1 카드 누적)
│
└── (houseman-server/ + src/ + e2e/ + ... 기존 코드)
```

---

## [1] 루트 파일 (2개)

| 파일 | 역할 | 작성/수정 시점 |
|---|---|---|
| `AGENTS.md` | Agent Harness 진입점. 16 H2 섹션. SessionStart Hook이 매 세션 자동 주입. 80줄 미만 가드 | Sub-1 (신규) |
| `CLAUDE.md` | 재구축 계획서 (Phase 0~6) + Phase 3 포팅 자산 표 + 19 규칙 + 21 체크리스트 + 신규 #20~#27 | 기존 + Sub-1 갱신 (E2E 카테고리 직후 추가) |

---

## [2] docs/ — 매뉴얼 14건

### 분류

| 카테고리 | 파일 | 작성/수정 시점 |
|---|---|---|
| **사상** | Karpathy.md / Harness.md | 이전 세션 |
| **시장 분석** | Agent.md | 이전 세션 |
| **실 자산 매핑** | Apply.md / Roadmap.md / Automation.md / Ontology.md | 이전 + 이번 세션 |
| **시스템 분석** | Inventory.md / Domain_Analysis.md | 이전 세션 |
| **정정/검토** | Review.md | 이전 세션 |
| **운영 매뉴얼** | Subagents.md / Hooks.md / ARCHITECTURE.md | 이번 세션 + Sub-3 직후 |
| **산출물 (Sub-1)** | Mapping.md | Sub-1 |

### 파일별 역할

| 파일 | 역할 | 누가 정독해야 |
|---|---|---|
| `Karpathy.md` | 9원칙 + 4원칙 사상 | planner 가능 (사상 이해) |
| `Apply.md` | 실 자산 1:1 매핑 + Source of Truth + Critical 3건 + Phase 1~3 카드 | planner / reviewer 필수 |
| `Harness.md` | 하네스 8원칙 + 안티패턴 8종 | reviewer 필수 (안티패턴) |
| `Agent.md` | Agent 시장 분석 + 기술 스택 갭 | planner (Roadmap 보강 시) |
| `Roadmap.md` | Top 후보 평가 + Phase 단계 | planner (카드 분해 시) |
| `Review.md` | Source of Truth (수치 정정 표) | 모든 Subagent (수치 인용 시) |
| `Domain_Analysis.md` | 도메인 한계 32건 + 기술 부채 16건 + Critical 3 | planner / implementer (도메인 영역 작업 시) |
| `Inventory.md` | 16 엔티티 + 63 API + 16 services + BE/FE 폴더 트리 | planner / implementer (코드 위치 파악) |
| `Automation.md` | 자동화 13 카테고리 + 5 도구 + 카드 A~G | planner (도구 분류 판단) |
| `Ontology.md` | 의미 그래프 (16 노드 + 11 관계 + 6 룰) | planner / implementer (의미 관계 변경 시) |
| `Subagents.md` | Subagent 운영 매뉴얼 + Opus 4.7 정합 + history 미공유 함정 | planner / implementer / reviewer 자기 인식용 |
| `Mapping.md` | 포팅 자산 14건 × Inventory 대조 | planner / implementer (재사용 판단) / reviewer (재구현 검출) |
| `Hooks.md` | Hook + Script 운영 매뉴얼 (Hook 4종 + 6 검사 + 예외 처리) | implementer / reviewer 정독 (자동 차단 인식) |
| `ARCHITECTURE.md` | 파일 위치 + 역할 일람 (이 문서) | 새 파일 생성 시 / 참조 경로 작성 시 |

---

## [3] .claude/ — Subagent + Hook (Sub-2/3 산출물)

### Subagent 3종 (`.claude/agents/`)

| 파일 | 권한 (`tools`) | 책임 |
|---|---|---|
| `planner.md` | `Read, Grep, Glob` | 카드 분해 + 6 섹션 plan 작성. 코드 작성 0 |
| `implementer.md` | `Read, Write, Edit, Bash, Grep, Glob` 전체 | plan 받아 코드 + 테스트 동시 생성 |
| `reviewer.md` | `Read, Grep, Glob, Bash` (Write/Edit 0) | 검증만 강제, 수정 권한 0 |

### Hook 정의 (`.claude/settings.json`)

| Hook | 매처 | 실행 스크립트 | 효과 |
|---|---|---|---|
| `SessionStart` | `*` | `cat AGENTS.md` | 매 세션 16 섹션 컨텍스트 주입 |
| `PostToolUse` | `Edit|Write` | `scripts/run-related-tests.sh` | 변경 파일 관련 테스트 자동 |
| `PostToolUse` | `Edit|Write` | `scripts/critical-rules-check.sh` | 6 검사 자동 차단 |
| `Stop` | `*` | `scripts/save-plan.sh` | `plans/` 자동 누적 |

---

## [4] scripts/ — 실행 셸 (Sub-3 산출물)

| 파일 | 역할 |
|---|---|
| `run-related-tests.sh` | `.kt` → `./gradlew test --tests "*${basename}*"` / `.tsx` → `npm test --findRelatedTests` / `e2e/*.spec.ts` → `npx playwright test` |
| `critical-rules-check.sh` | 6 검사 — alert/confirm/prompt / whitespace-only / TransactionService↔BillingRecord / MoveOutLinkController↔JWT+TTL / ContractService.moveOut↔vacantConfirmed / docs/*.md 보호 (Mapping/Hooks 화이트리스트) |
| `save-plan.sh` | `git branch --show-current` → `plans/$(date +%Y-%m-%d)-${branch}.md` 자동 누적 |

---

## [5] plans/ — 카드 작업 이력 (Sub-3 시드 + 자동 누적)

| 파일 | 역할 |
|---|---|
| `README.md` | 운영 규칙: 카드 1개 = 파일 1개 / last write wins / 구조 (카드 정의 → planner → implementer → reviewer → PR) |
| `{카드명}.md` | Stop Hook이 매 세션 종료 시 자동 생성/덮어쓰기 (날짜 prefix 없음, git history로 시간 추적) |

첫 카드 = `Agent_Harness.md` (Sub-4 산출물, 메타 자기참조).

---

## [5.5] prompts/ — 단계별 실행 prompt 보관 (계층 구조)

```
prompts/
├── Setup/                  (단계 1 Sub-1~4)
│   ├── Setup_1.md
│   ├── Setup_2.md
│   ├── Setup_3.md
│   └── Setup_4.md
└── Phase1/                 (Phase 1+ 카드 prompt 누적)
    ├── C1-a.md
    └── (C1-b.md, A4.md, D1.md ... 추가)
```

`plans/`와 대칭 구조 — `plans/`는 작업 결과 / `prompts/`는 작업 지시. 단 `plans/`는 Stop Hook 단순성 위해 flat, `prompts/`는 운영자 수동 작성이라 계층 OK.

---

## [6] Sub-1~4 산출물 추적

| Sub | 산출물 위치 | 산출물 수 | 검증 건수 |
|---|---|---|---|
| Sub-1 (문서 영역) | 루트 `AGENTS.md` / 루트 `CLAUDE.md` 갱신 / `docs/Mapping.md` | 3 | 3 |
| Sub-2 (Subagent 3종) | `.claude/agents/{planner,implementer,reviewer}.md` | 3 | 1 (dry run) |
| Sub-3 (Hook + Script) | `.claude/settings.json` / `scripts/*.sh` 3 / `plans/README.md` | 5 | 4 |
| Sub-4 (검증 + 첫 plan) | `plans/{date}-agent-harness-setup.md` | 1 | 1 (C1-a dry run) |
| **계** | — | **12** | **9** |

추가 매뉴얼 (Subagents.md / ARCHITECTURE.md / Hooks.md)은 산출물 외 별도 작성.

---

## [7] 파일 명명 규칙

| 규칙 | 예시 |
|---|---|
| 단일 단어 + 첫글자 대문자 + `.md` | `Karpathy.md` / `Apply.md` / `Subagents.md` / `Mapping.md` |
| 두 단어 underscore 연결 (예외) | `Domain_Analysis.md` |
| 시스템 이름 prefix 0 (메모리 #29) | ❌ `HOUSEMAN_Subagents.md` / ❌ `Houseman_Mapping.md` |
| 외부 약어 prefix 0 (메모리 #29) | ❌ `HAUT_Mapping.md` |
| 약어 사용 전 풀이 필요 시 별도 매뉴얼 | (예: HAUT는 CLAUDE.md 원본 표현 유지, 새 docs/*.md에는 사용 X) |
| Subagent 정의 (`.claude/agents/`): 소문자 + 하이픈 | `planner.md` / `implementer.md` / `reviewer.md` (Claude Code 컨벤션) |
| 셸 스크립트 (`scripts/`): kebab-case + `.sh` | `run-related-tests.sh` / `critical-rules-check.sh` |
| plans 자동 생성: `{카드명}.md` (첫글자 대문자, 날짜 X) | `Agent_Harness.md` / `C1-a.md` |
| prompts/Setup/: `Setup_N.md` (대문자 시작) | `Setup_1.md` ~ `Setup_4.md` |
| prompts/Phase{N}/: `{카드ID}.md` (카드 ID 원본 표기) | `C1-a.md` / `A4.md` / `D1.md` |
| 카드 ID 예외: 카드 ID 본질 표기 유지 (소문자/하이픈 허용) | `C1-a`, `A4` (Apply.md / Roadmap.md 명시 표기) |

---

## [8] 새 파일 생성 시 결정 흐름

```
새 매뉴얼 생성?
  ├─ 운영자/Agent 매뉴얼 → docs/{단어}.md (한 단어 첫글자 대문자)
  ├─ 일회성 작업 산출물 → docs/{단어}.md 또는 outputs/
  └─ 시스템 외 별명 X (HAUT, AETHER 등 prefix 사용 X)

새 Subagent 추가?
  └─ .claude/agents/{name}.md (소문자 + 하이픈)
     + AGENTS.md §7 추가
     + Subagents.md §[1] 표 추가
     + Setup_2.md 산출물 명세 추가

새 Hook 추가?
  └─ .claude/settings.json 매처 추가
     + scripts/{kebab-case}.sh 추가
     + Hooks.md 운영 매뉴얼 추가
     + AGENTS.md §8 갱신

새 카드 plan?
  └─ Stop Hook이 자동 생성 plans/{카드명}.md (운영자 손 작업 0)
     카드명 = git branch에서 추출, 첫글자 대문자 권장

새 실행 prompt 작성?
  └─ Setup_N: prompts/Setup/Setup_N.md
     Phase 카드: prompts/Phase{N}/{카드ID}.md (예: prompts/Phase1/C1-a.md)
     정정 작업 시 Claude Code Edit tool로 즉시 처리 가능
```
