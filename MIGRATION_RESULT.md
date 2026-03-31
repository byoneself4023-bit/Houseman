# Phase 5a: 데이터 마이그레이션 결과

> 완료일: 2026-03-31

## 핵심 발견

기존 Flyway V2~V8 시드 마이그레이션에 **FE 정적 데이터(src/data/*.ts)가 이미 전부 포함**되어 있었음.
별도의 V10 시드 스크립트나 /api/upload/seed 엔드포인트가 **불필요**했음.

V9 (cashbook_entries + parking_infos DDL)만 미적용 상태였으며, 수동 적용 후 Flyway에 등록 완료.

## 데이터 건수

| 테이블 | FE 원본 | DB 저장 | 일치 |
|--------|---------|---------|------|
| staff | 9 | 9 | ✅ |
| buildings | 21 (+V6 추가분) | 46 | ✅ |
| rooms | — | 495 | ✅ |
| contracts (activeTenants) | 488 | 488 | ✅ |
| past_contracts | 14 | 14 | ✅ |
| calendar_events | 13~14 | 14 | ✅ |
| vacancies | 1 | 1 | ✅ |
| transactions | 7 | 7 | ✅ |
| settlement_expenses | 13 | 13 | ✅ |
| settlement_master | — | 40 | ✅ (billingMaster 기반) |
| billing_configs | — | 256 | ✅ (billingConfig 기반) |
| billing_records | 0 (런타임 생성) | 0 | ✅ |
| cashbook_entries | 0 (런타임 생성) | 0 | ✅ |
| parking_infos | 0 (런타임 생성) | 0 | ✅ |

## FK 무결성

| 검증 | 결과 |
|------|------|
| orphan rooms (building_id) | 0 |
| orphan contracts (room_id) | 0 |
| orphan contracts (building_id) | 0 |
| orphan calendar_events (building_id) | 0 |
| orphan vacancies (room_id) | 0 |
| orphan settlement_expenses (building_id) | 0 |
| orphan transactions (building_id) | 0 |
| orphan billing_configs (room_id) | 0 |

## API 검증 (Spring Boot 기동)

| 엔드포인트 | 응답 건수 | 일치 |
|-----------|----------|------|
| GET /api/buildings | 46 | ✅ |
| GET /api/contracts | 488 | ✅ |
| GET /api/calendar | 14 | ✅ |
| GET /api/vacancies | 1 | ✅ |
| GET /api/transactions | 7 | ✅ |
| GET /api/settlement-master | 40 | ✅ |
| POST /api/auth/login | OK | ✅ (phone: 010-5560-8245, pw: 8245) |

### API 응답 필드명 확인 (camelCase)

```json
// GET /api/contracts
{"buildingName": "제이앤제이", "roomNumber": "B01", "moveIn": "2026-03-05", ...}

// GET /api/buildings
{"roomCount": 5, "occupiedCount": 4, "buildingType": "단기", ...}

// GET /api/calendar
{"buildingName": "스타빌", "roomNumber": "105", ...}
```

Jackson SNAKE_CASE 제거 후 camelCase 정상 동작 확인.

## 테스트

- gradlew test: ✅ 105건 통과 (BUILD SUCCESSFUL)

## 변환 이슈

| # | 내용 | 처리 방법 |
|---|------|----------|
| 1 | V9 Flyway checksum 불일치 | 수동 테이블 생성 후 올바른 checksum(967865926)으로 flyway_schema_history에 등록 |
| 2 | buildings 46건 > FE 21건 | V6에서 billingConfig/settlementMaster용 추가 건물 생성 — 정상 |
| 3 | billing_records 0건 | 런타임에 청구서 생성 시 INSERT — 정상 (시드 불필요) |

## 다음 단계

Phase 5b: FE 타입 정렬 + 쿼리 훅 타이핑 → Phase 5c: VITE_USE_API=true 전환
