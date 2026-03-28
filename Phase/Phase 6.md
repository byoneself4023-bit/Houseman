# DevOps

---

## 실행 환경

- Phase 5 완료 상태: 프론트 ↔ 백엔드 연결 완료, VITE_USE_API=true 기본
- Docker: PostgreSQL 16만 기동 중 (port 5434)
- CI/CD, 백업, 컨테이너화 없음

---

## Docker Compose 확장 (3-서비스 구성)

### houseman-server/Dockerfile

Multi-stage 빌드: eclipse-temurin:17-jdk-alpine(빌드) → eclipse-temurin:17-jre-alpine(실행). Gradle dependency 캐시 레이어 분리로 재빌드 최적화. bootJar -x test로 테스트 스킵.

### Dockerfile (프론트)

Multi-stage: node:20-alpine(빌드) → nginx:alpine(서빙). npm ci → npm run build → dist를 nginx html로 복사. nginx.conf 포함.

### nginx.conf

SPA fallback: try_files $uri $uri/ /index.html. API 프록시: /api/ → http://server:8080. SSE 전용 설정: /api/sse/ 경로에 proxy_buffering off + proxy_read_timeout 3600s (실시간 알림 버퍼링 방지).

### docker-compose.yml

기존 db 서비스 유지 + server/client 추가. db에 healthcheck 추가(pg_isready) → server가 DB ready 후 시작(condition: service_healthy). `docker compose up --build`로 3개 서비스 한번에 기동.

---

## GitHub Actions CI

### .github/workflows/ci.yml

push/PR to main, master 트리거. 2개 job 병렬 실행:

server-test: ubuntu-latest, PostgreSQL 16 service container, Java 17(temurin), Gradle 캐시, ./gradlew test.

client-test: ubuntu-latest, Node 20, npm 캐시, npx tsc --noEmit → npm run lint → npm run test -- --run → npm run build.

---

## 백업/복원

### scripts/backup.sh

docker compose exec로 pg_dump → gzip 압축. 파일명에 타임스탬프(YYYYMMDD_HHMMSS). 7일 이상 파일 자동 삭제. set -euo pipefail로 에러 시 중단.

### scripts/restore.sh

gunzip -c → docker compose exec psql로 복원. 파일 존재 여부 체크. 사용법: `./scripts/restore.sh backup_file.sql.gz`

---

## 산출물 요약

### 신규 파일 (9개)

| 파일 | 역할 |
|------|------|
| houseman-server/Dockerfile | Spring Boot multi-stage 빌드 |
| Dockerfile | 프론트 multi-stage 빌드 (Vite → Nginx) |
| nginx.conf | SPA fallback + API 프록시 + SSE 프록시 |
| .github/workflows/ci.yml | CI: 서버 테스트 + 클라이언트 빌드 |
| scripts/backup.sh | DB 백업 + 7일 자동 정리 |
| scripts/restore.sh | DB 복원 |
| .dockerignore | 프론트 빌드 컨텍스트 제외 |
| houseman-server/.dockerignore | 서버 빌드 컨텍스트 제외 |

### 수정 파일 (1개)

| 파일 | 변경 |
|------|------|
| docker-compose.yml | db healthcheck + server/client 서비스 추가 |

---

## 전체 프로젝트 최종 누적

| 항목 | 수치 |
|------|------|
| API 엔드포인트 | 48개 |
| 백엔드 테스트 | 105개 |
| 프론트 테스트 | 14개 |
| Flyway 마이그레이션 | V1~V9 |
| DB 테이블 | 20개 |
| 엔티티 | 15개 |
| 서비스 | 14개 |
| 컨트롤러 | 13개 |
| SSE 이벤트 타입 | 8개 |
| Scheduler | 2개 |
| TanStack Query 훅 | 10개 도메인 |
| 페이지 (.tsx) | 25개 |
| Docker 서비스 | 3개 (db + server + client) |
| CI jobs | 2개 (server-test + client-test) |
