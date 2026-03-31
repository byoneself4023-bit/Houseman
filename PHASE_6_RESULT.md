# Phase 6 결과

## Docker Compose
- FE + BE + DB 원커맨드 기동: `docker compose up`
- 포트: DB(5434), BE(8080), FE(3000)
- container_name: houseman-db, houseman-server, houseman-client
- DB healthcheck → server depends_on → client depends_on 순서 보장

## GitHub Actions CI
- `.github/workflows/ci.yml`
  - server-test: Gradle test + PostgreSQL 16 service container
  - client-test: typecheck + lint + test + build
  - 트리거: push(main/master/feature/*) + PR(main/master)

## GitHub Pages 배포
- `.github/workflows/deploy-pages.yml`
- 모드: `VITE_USE_API=false` (정적, localStorage)
- base 경로: `/Houseman/` (GitHub Pages용)
- 배포 URL: `https://<username>.github.io/Houseman/`

## 백업
- `scripts/backup.sh`: `docker compose exec db pg_dump` + gzip + 7일 보관
- `scripts/restore.sh`: gunzip + psql

## 빌드 검증
- typecheck: ✅ (0 new errors)
- build (API mode): ✅ (7.38s)
- build (GitHub Pages mode): ✅ (7.55s)
- YAML 문법: ✅

## 전체 프로젝트 통계

| 항목 | 수치 |
|------|------|
| BE Kotlin 파일 | 116개 |
| FE TS/TSX 파일 | 219개 |
| Flyway 마이그레이션 | V1~V9 |
| BE 테스트 파일 | 25개 |
| E2E 테스트 파일 | 1개 |
| 삭제된 Supabase 코드 | ~2,700줄 |
| API 응답 타입 | 12개 |
| 변환 함수 | 12개 |
| 쿼리 훅 | 11개 |
| Wrapper | 28개 |

## Phase 6 잔여 TODO

| # | 내용 | 비고 |
|---|------|------|
| 1 | addBilling mutation | API shape 변환 필요 (buildingId/year/month vs building/room/items) |
| 2 | MoveOutLinkPage BE endpoint | 공개 페이지, 별도 API 필요 |
| 3 | MeterUpload BE endpoint | meter_readings 테이블 API 필요 |
| 4 | billingEngine I/O → API 완전 전환 | 현재 stub, api.ts 호출로 교체 필요 |
| 5 | BillingSetupWizard 연체수수료 API | PUT /api/buildings/{id} 연결 |
| 6 | hm_lateFeeOverrides BE 전환 | endpoint 없음 |
| 7 | hm_buildingData BE 전환 | building detail endpoint 확장 필요 |
| 8 | featureFlag.ts 제거 | E2E 호환성 유지 필요 — 추후 |
| 9 | EC2 배포 | BE 서버 배포 (Docker Compose) |
| 10 | Sentry 연동 | Error tracking |
