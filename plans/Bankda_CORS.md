# 카드: Bankda_CORS
date: 2026-05-16

## 카드 정의
fix: bankda CORS proxy + E2E config adjustments

## 변경 통계
```
 .env.example                                       |  10 +
 CLAUDE.md                                          |  12 +-
 Dockerfile                                         |   6 +
 docker-compose.yml                                 |  10 +-
 e2e/seed.ts                                        | 227 ++++++++++++
 src/components/AiChatBot.tsx                       | 393 +++++++++++++++++----
 src/data/calendarEvents.ts                         |   8 -
 src/hooks/useAppData.ts                            |   6 +-
 src/hooks/useSse.ts                                |   2 +-
 src/layouts/AppLayout.tsx                          |   2 +-
 src/pages/CollectionPage.tsx                       |   9 +-
 src/pages/TaskDriverPage.tsx                       |  47 +++
 src/pages/VacancyPage.tsx                          |  23 +-
 src/pages/calendar/CalendarPage.tsx                |  25 +-
 .../calendar/components/OwnerReportModals.tsx      |  63 ++--
 src/pages/calendar/components/SendLinkModal.tsx    |  22 +-
 src/pages/calendar/components/SendMessageModal.tsx |   2 +-
 src/pages/tenants/TenantsPage.tsx                  |   1 -
 src/types/index.ts                                 |   1 +
 src/utils/index.ts                                 |   1 +
 vite.config.ts                                     |  83 +++--
 21 files changed, 778 insertions(+), 175 deletions(-)
```

## planner 출력
(6 섹션 — Subagent 호출 시 자동 박힘)

## implementer 출력
(변경 파일 + diff 요약 + 자가 점검 + 테스트 결과)

## reviewer 결과
(PASS/FAIL + 검사 항목 + 위반 + 다음 액션)

## PR 링크

