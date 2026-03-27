# Backend API 마무리

---

## 실행 환경

- Phase 3(a~d) 완료 상태: API 48개, 테스트 98개, Flyway V1~V9, 20개 테이블
- 프론트엔드 VITE_USE_API=false 유지
- 기존 소스 코드 수정 없음 (E2E 테스트만 추가)

---

## 누락 API 확인

CLAUDE.md Phase 3a~3d 계획 대비 현재 48개 API. 계획의 46개보다 2개 많음 (billing/configs/{id}, contracts/past/{id} 추가). 누락 없음.

---

## E2E 플로우 테스트 (5개 파일, 7개 테스트)

크로스 도메인 워크플로우를 검증하는 시나리오 테스트. 기존 per-domain 테스트가 각 API를 독립적으로 검증한다면, E2E는 여러 도메인을 걸치는 비즈니스 흐름을 검증.

### ContractFlowTest (1개)

계약 등록 → 상세 조회 → 전체 목록에 포함 확인. POST /api/contracts로 새 계약 등록 후 GET으로 489개(기존 488 + 신규 1) 확인.

### MoveOutFlowTest (1개)

계약 등록 → 퇴실 처리 → PastContract 이동 → 원본 삭제(404) → 공실 등록 → 공실 목록 확인. 입주부터 퇴실까지 전체 생명주기 검증.

### BillingFlowTest (1개)

청구서 생성(DRAFT) → 확정(CONFIRMED) → 발송(SENT) → 현황 요약. 제이앤제이 2026-06 청구서 4건 생성 후 상태 전환 플로우 검증.

### PaymentFlowTest (1개)

입금 등록 → 지출 등록 → 건물별 거래 목록 확인. type="입금"과 "지출" 두 종류의 거래를 등록하고 필터링 검증.

### OverdueFlowTest (3개)

연체 계약 감지 → SSE OVERDUE_ALERT 브로드캐스트 검증. MockK 기반 단위 테스트로 OverdueCheckScheduler의 3가지 시나리오: 연체 있음(broadcast 호출), 연체 없음(broadcast 안 함), 빈 계약 목록.

@Profile("!test")로 Scheduler가 테스트 환경에서 빈 등록 안 되므로 직접 인스턴스 생성 후 수동 호출.

---

## 최종 검증 결과

| 항목 | 결과 |
|------|------|
| ./gradlew compileKotlin | ✅ BUILD SUCCESSFUL |
| ./gradlew test | ✅ 105개 테스트 통과 (기존 98 + E2E 7) |
| Swagger UI | ✅ localhost:8080/swagger-ui 접속 확인 |
| 기존 API | ✅ 48개 전부 정상 |
| 소스 코드 수정 | 0 (테스트만 추가) |

---

## Phase 3~4 백엔드 전체 누적

| 항목 | 수치 |
|------|------|
| API 엔드포인트 | 48개 |
| 테스트 | 105개 (전부 통과) |
| Flyway 마이그레이션 | V1~V9 |
| 테이블 | 20개 |
| 엔티티 | 15개 |
| 서비스 | 14개 |
| 컨트롤러 | 13개 |
| SSE 이벤트 타입 | 8개 |
| Scheduler | 2개 |
| 프론트엔드 변경 | 0 |

---

## 산출물 요약

### 신규 파일 (5개)

| 파일 | 테스트 수 | 검증 플로우 |
|------|---------|-----------|
| ContractFlowTest.kt | 1 | 계약 등록 → 조회 → 목록 |
| MoveOutFlowTest.kt | 1 | 등록 → 퇴실 → PastContract → 공실 |
| BillingFlowTest.kt | 1 | 생성 → 확정 → 발송 → 현황 |
| PaymentFlowTest.kt | 1 | 입금 → 지출 → 목록 |
| OverdueFlowTest.kt | 3 | 연체 감지 → SSE |

### 수정 파일

없음
