#!/usr/bin/env bash
# PostToolUse(Edit|Write) Hook — Critical 룰 6 검사 자동 차단
# 위반 시 ❌ 메시지 stderr + exit 1
# 운영 매뉴얼: docs/Hooks.md §[2]

set -u

cd /Users/kuka/Houseman || exit 0

diff_cached="$(git diff --cached 2>/dev/null)"
diff_files="$(git diff --cached --name-only 2>/dev/null)"

# 검사 1: alert / confirm / prompt 추가 차단 (CLAUDE.md #5)
if echo "$diff_cached" | grep -E "^\+.*\b(alert|confirm|prompt)\s*\(" >/dev/null 2>&1; then
  echo "❌ Critical 룰 #1 위반: alert/confirm/prompt 사용 감지 — toast(sonner) 또는 커스텀 모달로 교체" >&2
  exit 1
fi

# 검사 2: whitespace-only 변경 차단 (#26 Surgical)
if ! git diff --cached --check >/dev/null 2>&1; then
  echo "❌ Critical 룰 #2 위반: whitespace-only 변경 감지 — 카드 범위 외 변경 제거" >&2
  exit 1
fi

# 검사 3: TransactionService 변경 시 BillingRecord 미언급 차단 (C1 회귀)
if echo "$diff_files" | grep -q "TransactionService"; then
  if ! echo "$diff_cached" | grep -q "BillingRecord"; then
    echo "❌ Critical 룰 #3 위반: TransactionService 변경 시 BillingRecord 미언급 — pays_for 관계 회귀 위험 (C1)" >&2
    exit 1
  fi
fi

# 검사 4: MoveOutLinkController 변경 시 JWT|signed|TTL 미언급 차단 (C2 회귀)
if echo "$diff_files" | grep -q "MoveOutLinkController"; then
  if ! echo "$diff_cached" | grep -E "JWT|signed|TTL" >/dev/null 2>&1; then
    echo "❌ Critical 룰 #4 위반: MoveOutLinkController 변경 시 JWT|signed|TTL 미언급 — public link 무인증 회귀 위험 (C2)" >&2
    exit 1
  fi
fi

# 검사 5: ContractService.moveOut 변경 시 vacantConfirmed 미언급 차단 (CLAUDE.md #11 + C3)
if echo "$diff_cached" | grep -E "ContractService.*moveOut|fun moveOut" >/dev/null 2>&1; then
  if ! echo "$diff_cached" | grep -q "vacantConfirmed"; then
    echo "❌ Critical 룰 #5 위반: ContractService.moveOut 변경 시 vacantConfirmed 미언급 — 퇴실 이벤트 자동 삭제 사고 위험 (C3)" >&2
    exit 1
  fi
fi

# 검사 6: docs/*.md 수정 차단 (Doc-only Rules 안티패턴)
# 화이트리스트: docs/Mapping.md + docs/Hooks.md + docs/ARCHITECTURE.md
docs_changed="$(echo "$diff_files" | grep -E "^docs/.*\.md$" || true)"
if [ -n "$docs_changed" ]; then
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    if [ "$f" != "docs/Mapping.md" ] && [ "$f" != "docs/Hooks.md" ] && [ "$f" != "docs/ARCHITECTURE.md" ]; then
      echo "❌ Critical 룰 #6 위반: $f 수정 차단 — 화이트리스트 (docs/Mapping.md, docs/Hooks.md, docs/ARCHITECTURE.md) 외 매뉴얼 임의 변경 금지" >&2
      exit 1
    fi
  done <<< "$docs_changed"
fi

exit 0
