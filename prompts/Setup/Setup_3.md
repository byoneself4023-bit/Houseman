# Setup_3 — 단계 1 Sub-3 (Hook + Scripts + plans/)

**Plan mode 필수**. Sub-1 + Sub-2 산출물 완료 후 진행.

---

## 선행 자산 확인

- Sub-1 산출물: `AGENTS.md` / `docs/HAUT_Mapping.md` / `CLAUDE.md #20~#27`
- Sub-2 산출물: `.claude/agents/planner.md` / `implementer.md` / `reviewer.md`
- 미박힘 시 즉시 중단

## 입력 자산

Sub-1+2 산출물 + `docs/*.md` 10개 + `CLAUDE.md`.

---

## 산출물 4개

### 산출물 1: `.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "cat AGENTS.md"}]}
    ],
    "PostToolUse": [
      {"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "bash scripts/run-related-tests.sh \"${file}\""}]},
      {"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "bash scripts/critical-rules-check.sh \"${file}\""}]}
    ],
    "Stop": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "bash scripts/save-plan.sh"}]}
    ]
  }
}
```

### 산출물 2: `scripts/run-related-tests.sh`

대상 파일에 따라 자동 분기:
- `*.kt` (BE): `cd houseman-server && ./gradlew test --tests "*${basename}*"`
- `*.ts | *.tsx` (FE): `npm test -- --findRelatedTests "${file}"`
- `e2e/*.spec.ts` (E2E): `npx playwright test "${file}"`
- 매치 없음: exit 0 (조용히 통과)

실패 시 stderr에 명확한 에러 + exit 1 → PostToolUse Hook이 작업 차단.

### 산출물 3: `scripts/critical-rules-check.sh` — **6개 검사** (기존 5 + docs 보호 신규)

위반 시 exit 1로 작업 차단:

1. **검사 1**: `git diff --cached | grep -E "^\+.*\b(alert|confirm|prompt)\s*\("` → 매치 시 차단 (CLAUDE.md #5 + #26 Surgical)
2. **검사 2**: `git diff --cached --check` → whitespace-only 변경 차단 (#26 Surgical)
3. **검사 3**: `TransactionService` 변경 시 `BillingRecord` 미언급 차단 (C1 회귀 방지)
4. **검사 4**: `MoveOutLinkController` 변경 시 `JWT|signed|TTL` 미언급 차단 (C2 회귀 방지)
5. **검사 5**: `ContractService.moveOut` 변경 시 `vacantConfirmed` 미언급 차단 (CLAUDE.md #11)
6. **검사 6 (신규)**: `docs/*.md` 10개 중 임의 수정 차단 (Doc-only Rules 안티패턴 회피). 
   - 단 `docs/HAUT_Mapping.md` + 신규 docs는 화이트리스트 제외 (변경 가능 — 작업으로 갱신 정당).
   - 화이트리스트: `docs/HAUT_Mapping.md`.

각 검사 위반 시 "❌ Critical 룰 #N 위반: {파일} — {수정 제안}" stderr 출력 + exit 1.

### 산출물 4: `scripts/save-plan.sh`

- 카드명 추출: `git branch --show-current` (현재 브랜치명) 또는 `git log -1 --format=%s` (첫 commit msg) — 둘 다 없으면 timestamp
- 저장 위치: `plans/$(date +%Y-%m-%d)-${card_name}.md`
- 내용 템플릿 (Stop Hook이 자동 채움):

```markdown
# 카드: {card_name}
date: {YYYY-MM-DD}

## 카드 정의
{git log -1 또는 카드 prompt 추출}

## planner 출력
{6 섹션}

## implementer 출력
{변경 파일 + diff 요약 + 자가 점검 + 테스트 결과}

## reviewer 결과
{PASS/FAIL + 검사 항목 + 위반 + 다음 액션}

## PR 링크
{gh pr view --json url -q .url}
```

### 산출물 5: `plans/README.md`

```markdown
# plans/

Houseman Agent Harness 작업 이력. Stop Hook이 자동 누적.

## 운영 규칙
- 카드 1개 = 파일 1개 (`YYYY-MM-DD-카드명.md`)
- 동일 카드 재실행 시 덮어쓰기 (last write wins)
- 파일 구조: 카드 정의 → planner 6 섹션 → implementer 출력 → reviewer 결과 → PR 링크

## 첫 번째 카드
`YYYY-MM-DD-agent-harness-setup.md` — 단계 1 자체. Sub-4에서 박힘 (CLAUDE.md #22 + 메타 자기참조).
```

---

## 검증 4건

1. **BE 테스트 자동 실행**: `bash scripts/run-related-tests.sh houseman-server/.../BillingService.kt` → BE 테스트 실행 + 결과 출력
2. **alert 차단**: 임의 `.tsx`에 `alert("test")` 추가 → `git add` → `bash scripts/critical-rules-check.sh` exit 1 + 검사 1 위반 메시지
3. **docs 보호 (검사 6)**: `docs/Apply.md` 임의 수정 → `git add` → `bash scripts/critical-rules-check.sh` exit 1 + 검사 6 위반 메시지. **단 `docs/HAUT_Mapping.md`는 수정 가능 확인** (화이트리스트)
4. **AGENTS.md 자동 주입**: 새 Claude Code 세션 시작 → SessionStart Hook이 `cat AGENTS.md` 실행 → AGENTS.md 16 섹션 컨텍스트 박힘

---

## 보고

- 5개 파일 경로 + 라인 수 (settings.json + 3 셸 + plans/README.md)
- 검증 1~4 결과 (PASS/FAIL)
- 발견한 이슈

---

## 절대 금지

- Hook을 셸 외 다른 언어 (셸만)
- critical-rules-check.sh 검사 6개 미만으로 박기
- docs/HAUT_Mapping.md 화이트리스트 누락
- Sub-1, Sub-2 산출물 수정
- docs/*.md 10개 (HAUT_Mapping 제외) 수정
