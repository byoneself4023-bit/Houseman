# Setup_2 — 단계 1 Sub-2 (Subagent 3종)

**Plan mode 필수**. Sub-1 산출물 (AGENTS.md / CLAUDE.md #20~#27 / Mapping.md) 완료 후 진행.

---

## 선행 자산 확인

- Sub-1 산출물 박혀있는지 먼저 확인:
  - 루트 `AGENTS.md` 존재 (55줄, 16 H2 섹션)
  - `docs/Mapping.md` 존재 (포팅 자산 대조표)
  - `CLAUDE.md` 끝부분에 `## Agent Harness 운영` 카테고리 + `- #20` ~ `- #27` 8건 박힘
- 미박힘 시 즉시 중단, Sub-1 먼저 실행

## 입력 자산 (13개 — 정독 후 plan 작성)

`docs/Karpathy.md` / `docs/Apply.md` / `docs/Harness.md` / `docs/Agent.md` / `docs/Roadmap.md` / `docs/Review.md` / `docs/Domain_Analysis.md` / `docs/Inventory.md` / `docs/Automation.md` / `docs/Ontology.md` / `docs/Subagents.md` / `docs/Mapping.md` / `docs/ARCHITECTURE.md` + 루트 `CLAUDE.md` + `AGENTS.md`.

특히 **`docs/Subagents.md` 정독 필수** — 3종 권한/역할/흐름/Opus 4.7 정합/history 미공유/함정이 박힌 운영 매뉴얼. Sub-2 산출물 `.claude/agents/*.md` system prompt가 이걸 따라야 함.

**`docs/ARCHITECTURE.md` 정독 필수** — 파일 위치 + 명명 규칙. Sub-2 산출물이 `.claude/agents/` 안에 들어가는데 위치/이름이 정합한지 확인 (planner.md / implementer.md / reviewer.md 소문자 + 하이픈 컨벤션).

---

## 산출물 3개 — `.claude/agents/`

### 산출물 1: `planner.md`

```yaml
---
name: planner
description: 카드 분해 + 6 섹션 plan 작성. Read only.
tools: ["Read", "Grep", "Glob"]
---
```

**책임** (`docs/Subagents.md §[1]` 참조):
- 카드 받아서 6 섹션 plan 작성 (CLAUDE.md #24 Think Before 강제)
- Rails 안/밖 판단 (`docs/Apply.md §[2] 원칙 7 표`)
- 자동화 도구 분류 판단 (`docs/Automation.md [1]` — Hook/cron/webhook/Service/Agent 중 적합한 것)
- 포팅 자산 재사용 판단 (`docs/Mapping.md` — 포팅 완료 10건 재사용 우선)
- 도메인 의미 관계 변경/추가 판단 (`docs/Ontology.md §[2]`)
- 코드 작성 X (사고 누락 — Read only로 강제)

**정독 필수 7개** (plan 작성 전):
1. `docs/Apply.md` — Source of Truth + Critical 3건 + Phase 1~3 카드
2. `docs/Ontology.md` — 16 노드 + 11 관계 + 6 룰 (의미 관계 변경 판단)
3. `docs/Automation.md` — 5종 도구 + 13 카테고리 (적합한 도구 판단)
4. `docs/Mapping.md` — 포팅 자산 재사용 판단
5. `docs/Subagents.md` — 자기 자신의 권한/책임 인식
6. `docs/ARCHITECTURE.md` — 파일 위치 / 명명 규칙 (새 파일 생성 시 결정 흐름)
7. `CLAUDE.md` — 19 규칙 + 21 체크리스트 + 재구축 계획서

**출력 6 섹션 (필수)** — `docs/Subagents.md §[3]` 흐름 + CLAUDE.md #24 박힘:

```markdown
## 카드: {카드명}

### §1 가정
- 전제하는 사실 (포팅 자산 사용 여부 / 의미 관계 기존 박힘 여부)

### §2 영향 범위
- 변경되는 파일 / 함수 / 테이블 / 의미 관계

### §3 옵션 ≥ 2개
- **A**: {접근} — 근거 + 위험
- **B**: {접근} — 근거 + 위험
- **추천**: {A or B} (근거 1줄)

### §4 트레이드오프
- 선택지별 비용/이득 (구체 메트릭, 추측 X)

### §5 실패 모드
- 시나리오 1: {위험} → 롤백 {스크립트/Flyway down}
- 시나리오 2: ...

### §6 검증 방법 (Goal-Driven #27)
- 단위 테스트: {파일} 어떤 케이스
- 통합 테스트: {파일} 회귀
- 회귀: 105 @Test 중 영향 받는 N건
```

### 산출물 2: `implementer.md`

```yaml
---
name: implementer
description: 코드 작성 + 단위 테스트. 전체 권한.
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
---
```

**책임**:
- planner 6 섹션 plan 받아 실 코드 + 테스트 동시 생성
- BE: `houseman-server/src/test/` 패턴 따라 `@Test` 동시 (BE 105 @Test base)
- FE: wrapper + props 패턴 (CLAUDE.md #1) + Zustand UI 상태만
- 포팅 자산 재사용 우선 (`docs/Mapping.md` 포팅 완료 10건 재구현 금지)
- 도메인 의미 관계 변경 시 `src/data/domainOntology.ts` 동시 갱신
- **delegation prompt에 명시된 plan 결정사항 그대로 따름** (history 미공유 — `docs/Subagents.md §[5]`)

**정독 필수 6개** (코드 작성 전):
1. planner delegation prompt (plan 6 섹션 전체 — 요약 X)
2. `docs/Apply.md §[2] 원칙 7` (Rails 안/밖 판단)
3. `CLAUDE.md` 19 규칙 (특히 #5 alert/confirm/prompt / #11 vacantConfirmed)
4. `docs/Mapping.md` (포팅 자산 재사용 / 재구현 금지)
5. `docs/Ontology.md` (의미 관계 변경 시 — 특히 C1 영향 카드)
6. `docs/ARCHITECTURE.md` (새 파일 생성 위치 / 명명 규칙 확인)

**자가 점검** (코드 작성 직전 markdown 체크박스 출력):

```markdown
## implementer 자가 점검
- [ ] CLAUDE.md #25 Simplicity — 200줄 → 50줄 가능 여부 확인
- [ ] CLAUDE.md #26 Surgical — 변경된 모든 줄이 plan에 직접 연결
- [ ] CLAUDE.md #27 Goal-Driven — 테스트 먼저 작성
- [ ] CLAUDE.md #1~#19 위반 0 (특히 #5 alert/confirm/prompt / #11 vacantConfirmed)
- [ ] 포팅 자산 재사용 가능한 부분 재구현 0
- [ ] 의미 관계 변경 시 `domainOntology.ts` 동시 갱신
```

**출력 형식 (필수)**:

```markdown
## implementer 출력

### 변경 파일 목록
- `houseman-server/.../BillingService.kt` (+45 / -2)
- `houseman-server/.../db/migration/V12__add_paid_status.sql` (신규)
- `houseman-server/src/test/.../BillingServiceTest.kt` (+30)

### diff 요약 (Surgical 보장)
- BillingService: markPaid() 신규 + JavaDoc — 카드 step 1
- V12: status enum 확장 SENT → PAID/PARTIAL — 카드 step 2
- 테스트: markPaid 단위 3건 + 회귀 12건 — 카드 step 3

### 자가 점검 결과
- [x] Simplicity / [x] Surgical / [x] Goal-Driven / [x] 19 규칙 / [x] 포팅 자산 / [x] 온톨로지

### 테스트 실행 결과 (Bash)
- `./gradlew test --tests "BillingServiceTest*"` → PASS (15/15)
- 회귀: `./gradlew test` → PASS (108/108, 신규 3건 추가)
```

### 산출물 3: `reviewer.md`

```yaml
---
name: reviewer
description: 4원칙 + 안티패턴 + Critical 회귀 검증. Read+Bash, Write/Edit 0.
tools: ["Read", "Grep", "Glob", "Bash"]
---
```

**책임** (`docs/Subagents.md §[7]` Self-bias 회피 핵심):
- 별도 컨텍스트로 검증 (implementer 자가 점검 신뢰 X)
- 4원칙 위반 + 안티패턴 8종 (Harness.md §[3]) 스캔
- CLAUDE.md 19 규칙 + #20~#27 위반 검출
- Critical 3건 회귀 검증 (C1 `pays_for` 포함 여부 / C2 JWT TTL / C3 vacantConfirmed)
- **Write/Edit 호출 시도 시 권한 거부** (system prompt 차원에서 명시)

**정독 필수 7개** (검증 전):
1. implementer 출력 (변경 파일 / diff / 자가 점검 / 테스트 결과)
2. `docs/Apply.md §[3]` (4원칙) + `docs/Apply.md §[1]` (Critical 3건)
3. `docs/Harness.md §[3]` (안티패턴 8종)
4. `CLAUDE.md` 19 규칙 + #20~#27
5. `docs/Subagents.md §[7]` (Self-bias 회피 — 자신의 검증 자세 인식)
6. `docs/Mapping.md` (포팅 자산 재구현 흔적 검출)
7. `docs/ARCHITECTURE.md` (파일 위치 / 명명 규칙 위반 검출)

**검사 항목 (markdown 체크박스)**:

```markdown
## reviewer 검증 결과

**결정**: PASS | FAIL

### 검사 항목
- [ ] 4원칙 — #24 Think Before / #25 Simplicity / #26 Surgical / #27 Goal-Driven
- [ ] CLAUDE.md 19 규칙 (특히 #5 alert/confirm/prompt / #11 vacantConfirmed)
- [ ] CLAUDE.md #20~#27 Agent Harness 운영 (Subagent 위임 / Hook 미회피)
- [ ] Critical 3건 회귀 (C1 `pays_for` 관계 박힘 / C2 JWT+TTL / C3 vacantConfirmed)
- [ ] 안티패턴 8종 (Self-bias / Approval Fatigue / Tool Poisoning / Architecture Drift / Work Avoidance / Context Bloat / Doc-only Rules / No Measurement)
- [ ] 포팅 자산 재구현 0 (`docs/Mapping.md` 10건 중 재구현 흔적 검출)
- [ ] 의미 관계 변경 시 `src/data/domainOntology.ts` 동시 갱신 확인

### 위반 (있으면)
- 원칙/규칙: [#N 명시]
- 위치: [파일:라인]
- 수정 제안: [구체 텍스트]

### 테스트 결과 (Bash 실행)
- BE: `./gradlew test` → PASS/FAIL (n/m)
- FE: `npm test` → PASS/FAIL (n/m)
- E2E: `npx playwright test` → PASS/FAIL (n/m)

### 다음 액션
- PASS: PR 생성 (squash merge 권장)
- FAIL: implementer 재호출 + 구체 지시
```

---

## 검증 1건

더미 카드 dry run (실제 코드 작성 X, planner subagent 호출만):

```
@planner hello-world 카드 분해: AGENTS.md에 'Hello' 한 줄 추가 (의미 없음, 테스트용)
```

확인:
1. planner 6 섹션 다 출력? (가정 / 영향 범위 / 옵션 ≥ 2 / 트레이드오프 / 실패 모드 / 검증 방법)
2. 정독 필수 6개 docs 흔적? (가정 섹션에 "Apply.md / Ontology.md / Automation.md / Mapping.md / Subagents.md / CLAUDE.md 참조" 류)
3. 검증 방법 섹션에 구체 테스트 명시?

---

## 보고

- 3개 파일 경로 + 라인 수
- 검증 1 결과 (PASS/FAIL)
- planner 출력 샘플 (hello-world dry run)

---

## 절대 금지

- Subagent 권한 임의 확장 (planner=Read only / implementer=전체 / reviewer=Read+Bash 엄수)
- planner 출력 6 섹션 중 일부 생략
- implementer 출력 형식 임의 변경
- reviewer가 Write/Edit 사용 (Read+Bash만)
- Sub-1 산출물 (AGENTS.md / CLAUDE.md / Mapping.md) 수정
- docs/*.md 11개 기존 파일 수정
- 시스템 이름 / 외부 자산 약어 등 redundant prefix 박기 (메모리 명명 규칙 위반)
