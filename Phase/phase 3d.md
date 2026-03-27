# 부가 기능 — 실행 결과 분석

---

## 실행 환경

- Phase 3a~3c 완료 상태: 84개 테스트, 46건물, 488계약, Flyway V1~V8
- 프론트엔드 VITE_USE_API=false 유지
- 절대 원칙: 도메인 기능/워크플로우 변경 없음

---

## 핵심 결정

**Upload API 스킵** — 프로토타입의 DataUploadPage는 xlsx 라이브러리로 Excel → localStorage에 직접 쓰는 순수 프론트엔드 기능. 서버 API를 호출하지 않음. Phase 5에서 VITE_USE_API=true로 전환할 때 API 연동으로 교체 예정.

**시드 데이터 없음** — cashbook과 parking 모두 프로토타입에서 빈 상태로 시작. DDL만 생성하고 API로 채워지는 구조.

---

## Flyway V9 — DDL 2개 테이블

### cashbook_entries

프로토타입 CashBookPage.jsx 분석 기반. type(settlement/moveout/manual), direction(입금/출금), status(대기/완료/보류). sourceId로 중복 방지 (UNIQUE INDEX WHERE NOT NULL). account/accountHolder로 계좌 정보 관리.

### parking_infos

프로토타입 ParkingPage.jsx 분석 기반. 임차인 단위 차량 정보. contract_id FK (nullable). tenantName, roomNumber, carNumber, carType.

---

## Cashbook 도메인

### 엔티티 — CashbookEntry.kt

Building @ManyToOne. 12개 필드: date, type, direction, description, amount, account, accountHolder, status, sentAt, sourceId, room, round.

### 서비스 — CashbookService.kt

sourceId 중복 방지: create 시 sourceId가 있으면 기존 항목 조회 → 이미 있으면 기존 반환 (멱등성). update에서 상태 변경(대기↔완료↔보류) 지원.

### API 4개

GET /api/cashbook (?building_id), POST /api/cashbook, PUT /api/cashbook/{id}, DELETE /api/cashbook/{id}

---

## Parking 도메인

### 엔티티 — ParkingInfo.kt

Building @ManyToOne, Contract @ManyToOne (nullable). tenantName, roomNumber, carNumber, carType.

### API 4개

GET /api/parking (?building_id), POST /api/parking, PUT /api/parking/{id}, DELETE /api/parking/{id}

---

## 최종 검증 결과

| 항목 | 결과 |
|------|------|
| ./gradlew compileKotlin | ✅ BUILD SUCCESSFUL |
| ./gradlew test | ✅ 98개 테스트 통과 (기존 84 + 신규 14) |
| Flyway V9 | ✅ 성공 |
| 기존 API | ✅ 전부 정상 |

---

## 산출물 요약

### 신규 파일 (13개)

| 카테고리 | 파일 |
|---------|------|
| Flyway | V9__cashbook_parking.sql (DDL 2개 테이블) |
| 엔티티 | CashbookEntry.kt, ParkingInfo.kt |
| DTO | CashbookEntryDto.kt, ParkingInfoDto.kt |
| Repository | CashbookEntryRepository.kt, ParkingInfoRepository.kt |
| Service | CashbookService.kt, ParkingService.kt |
| Controller | CashbookController.kt, ParkingController.kt |
| 테스트 | CashbookControllerTest.kt (7개), ParkingControllerTest.kt (7개) |

### 수정 파일 (1개)

ErrorCode.kt — CB001, CB002, PK001 추가

---

## Phase 3 전체 누적 (3a + 3b + 3c + 3d)

| 항목 | 수치 |
|------|------|
| API | 53개 |
| 테스트 | 98개 (전부 통과) |
| Flyway | V1~V9 (9개 마이그레이션) |
| 엔티티 | 15개 |
| 서비스 | 14개 |
| 컨트롤러 | 13개 |
| 테이블 | 20개 |
| 프론트엔드 변경 | 0 |
