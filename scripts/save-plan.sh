#!/usr/bin/env bash
# Stop Hook — plans/ 자동 누적
# 가드: 변경 없는 세션 (`git diff HEAD --stat` 빈 출력) → exit 0
# 카드명: branch → log subject → timestamp 순
# 저장: plans/$(date +%Y-%m-%d)-${card_name}.md (덮어쓰기, last write wins)
# 운영 매뉴얼: CLAUDE.md #22 + plans/README.md

set -u

cd /Users/kuka/Houseman || exit 0

# 가드: 변경 없는 세션 → 의미 없는 plan 누적 회피
diff_stat="$(git diff HEAD --stat 2>/dev/null)"
if [ -z "$diff_stat" ]; then
  exit 0
fi

# 카드명 추출 (master/main 시 skip — 카드 작업이 아니라 fallback plan 의미 없음)
card_name="$(git branch --show-current 2>/dev/null)"
if [ -z "$card_name" ] || [ "$card_name" = "master" ] || [ "$card_name" = "main" ]; then
  echo "[save-plan] skipped: on master/main branch (not a card branch)" >&2
  exit 0
fi

out="plans/${card_name}.md"

mkdir -p plans

pr_url="$(gh pr view --json url -q .url 2>/dev/null || echo '')"

cat > "$out" <<EOF
# 카드: ${card_name}
date: $(date +%Y-%m-%d)

## 카드 정의
$(git log -1 --format=%s 2>/dev/null || echo '(N/A)')

## 변경 통계
\`\`\`
${diff_stat}
\`\`\`

## planner 출력
(6 섹션 — Subagent 호출 시 자동 박힘)

## implementer 출력
(변경 파일 + diff 요약 + 자가 점검 + 테스트 결과)

## reviewer 결과
(PASS/FAIL + 검사 항목 + 위반 + 다음 액션)

## PR 링크
${pr_url}
EOF

echo "[save-plan] saved: $out" >&2
exit 0
