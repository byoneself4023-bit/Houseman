# plans/

Houseman Agent Harness 작업 이력. Stop Hook이 자동 누적.

## 운영 규칙

- 카드 1개 = 파일 1개 (`{카드명}.md`, 날짜 prefix 없음, git history로 시간 추적)
- 동일 카드 재실행 시 덮어쓰기 (last write wins, CLAUDE.md #22)
- 파일 구조: 카드 정의 → planner 6 섹션 → implementer 출력 → reviewer 결과 → PR 링크

## 자동 생성 동작

- Stop Hook이 `scripts/save-plan.sh` 실행
- 카드명 추출: `git branch --show-current` → fallback `git log -1 --format=%s` → fallback timestamp
- 변경 없는 세션 (`git diff HEAD --stat` 빈 출력) → exit 0 (의미 없는 plan 누적 회피)

## 첫 번째 카드

`Agent_Harness.md` — 단계 1 자체. Sub-4 산출물 (CLAUDE.md #22 + 메타 자기참조).
