# 추가 E2E 결과

## 페이지 렌더링 (29개)
| # | 경로 | 상태 |
|---|------|------|
| 1 | /calendar | PASS |
| 2 | /buildings | PASS |
| 3 | /buildings/스타빌 | PASS |
| 4 | /tenants | PASS |
| 5 | /past-tenants | PASS |
| 6 | /renewal | PASS |
| 7 | /vacancies | PASS |
| 8 | /collection | PASS |
| 9 | /billing | PASS |
| 10 | /billing/fixed | PASS |
| 11 | /billing/variable | PASS |
| 12 | /transactions | PASS |
| 13 | /parking | PASS |
| 14 | /as | PASS |
| 15 | /patrol | PASS |
| 16 | /settlement | PASS |
| 17 | /cashbook | PASS |
| 18 | /payroll | PASS |
| 19 | /task-driver | PASS |
| 20 | /profit-dashboard | PASS |
| 21 | /route-schedule | PASS |
| 22 | /company-settings | PASS |
| 23 | /data-upload | PASS |
| 24 | /homepage-edit | PASS |
| 25 | /homepage | PASS |
| 26 | /staff | PASS |
| 27 | /broker | PASS |
| 28 | /owner | PASS |
| 29 | /homepage-public | PASS |

## UI 동작 (10개)
| # | 테스트 | 상태 |
|---|--------|------|
| 6 | 건물 목록 → 상세 페이지 | PASS |
| 7 | 임차인 목록 시드 데이터 표시 | PASS |
| 8 | 건물 필터 동작 | PASS |
| 9 | 사이드바 메뉴 네비게이션 | PASS |
| 10 | 모바일 뷰포트 하단 네비게이션 | PASS |
| 11 | 공실 목록 데이터 표시 | PASS |
| 12 | 수금 페이지 데이터 표시 | PASS |
| 13 | 캘린더 월 이동 에러 없음 | PASS |
| 14 | 정산 페이지 데이터 표시 | PASS |
| 15 | 오늘할일 태스크 표시 | PASS |

## 기존 워크플로우 (5개)
| # | 테스트 | 상태 | 비고 |
|---|--------|------|------|
| 1 | 계약 7단계 체크리스트 | PASS | |
| 2 | 퇴실 6단계 워크플로우 | PASS | |
| 3 | 청구 설정 모달 | PASS | |
| 4 | 커스텀 태스크 추가 | PASS | |
| 5 | 퇴실확정 임차인 이동 | FAIL | 기존 이슈 — 퇴실 로직이 appData에 즉시 반영되지 않음 |

## 전체 E2E 통계
- 기존 워크플로우: 4/5
- 페이지 렌더링: 29/29
- UI 동작: 10/10
- **총 통과율: 43/44** (97.7%)
- 실행 시간: 44.7s
