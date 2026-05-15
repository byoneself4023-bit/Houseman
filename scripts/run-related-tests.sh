#!/usr/bin/env bash
# PostToolUse(Edit|Write) Hook — 변경 파일 관련 테스트 자동 실행
# 분기: e2e/*.spec.ts → playwright (먼저 매치) / *.kt → gradle / *.ts|*.tsx → vitest --findRelatedTests
# 매치 없음 → exit 0 (조용히 통과)
# 실패 시 stderr + exit 1 → Hook이 작업 차단

set -u

file="${1:-}"

if [ -z "$file" ]; then
  exit 0
fi

# 절대경로 → 프로젝트 루트 기준 상대경로 (분기 매칭 안정화)
project_root="/Users/kuka/Houseman"
rel="${file#"$project_root"/}"

# 1) E2E 먼저 매치 (e2e/*.spec.ts)
if [[ "$rel" == e2e/*.spec.ts ]]; then
  cd "$project_root" || exit 0
  echo "[run-related-tests] playwright: $rel" >&2
  npx playwright test "$rel" 1>&2
  exit $?
fi

# 2) Kotlin BE
if [[ "$rel" == *.kt ]]; then
  base="$(basename "$rel" .kt)"
  cd "$project_root/houseman-server" || exit 0
  echo "[run-related-tests] gradle: *${base}*" >&2
  ./gradlew test --tests "*${base}*" 1>&2
  exit $?
fi

# 3) TS / TSX FE
if [[ "$rel" == *.ts || "$rel" == *.tsx ]]; then
  cd "$project_root" || exit 0
  echo "[run-related-tests] vitest --findRelatedTests: $rel" >&2
  npm test -- --findRelatedTests "$rel" 1>&2
  exit $?
fi

# 매치 없음
exit 0
