#!/usr/bin/env bash
# SessionStart Hook — AGENTS.md docs/ 인용 정합 검증
# AGENTS.md가 인용하는 docs/X.md 실 파일 존재 검증.
# 부재 시 [FAIL] 메시지 stderr — exit 0 (정보 제공, 차단 X).
#
# D1-Infra 회고 채택 결정 #20 본문 정착.
# 운영 매뉴얼: docs/Hooks.md §[2] (예정).

set -u

cd /Users/kuka/Houseman || exit 0

agents_md="AGENTS.md"
[ -f "$agents_md" ] || exit 0

# AGENTS.md 본문에서 docs/X.md 인용 추출
refs="$(grep -oE "docs/[A-Za-z_]+\.md" "$agents_md" | sort -u)"

[ -z "$refs" ] && exit 0

missing=0
echo "" >&2
echo "=== AGENTS.md 인용 정합 검증 ===" >&2

while IFS= read -r ref; do
  if [ ! -f "$ref" ]; then
    echo "[FAIL] $ref 부재 (AGENTS.md 인용)" >&2
    missing=$((missing + 1))
  fi
done <<< "$refs"

if [ "$missing" -eq 0 ]; then
  total="$(echo "$refs" | wc -l | tr -d ' ')"
  echo "[PASS] AGENTS.md docs/ 인용 ${total}건 모두 존재" >&2
else
  echo "[WARN] 부재 ${missing}건 — D2 카드 또는 후속 작업 대상" >&2
fi
echo "" >&2

exit 0
