# 핵심 비즈니스 — 실행 결과 분석

---

## 실행 환경

- Phase 3a 완료 상태: auth/staff/building/room API 12개, 테스트 14개, staff 9명/buildings 21개/rooms 200개
- 프론트엔드 VITE_USE_API=false 유지
- 절대 원칙: 도메인 로직/워크플로우 변경 없음, 프로토타입 데이터 구조 보존

---

## Part 1: 계약(Contract) + 거래(Transaction)

### Flyway V3 — 누락 건물 + DDL

tenants.ts에서 42개 건물이 참조되지만 V2에는 21개만 시드되어 있었다. V3에서 누락 21개 건물(KMC코리아, 대치칼텍빌딩, 더힐하우스101~104동 등)을 추가하여 총 42개. contracts, past_contracts, transactions 3개 테이블 DDL 포함.

### Flyway V4 — 시드 데이터 (488+14+7)

488개 계약의 FK 해석(건물이름 → building_id, 호실번호 → room_id)을 PL/pgSQL 헬퍼 함수로 처리. Node.js 스크립트로 tenants.ts를 파싱하여 SQL VALUES 자동 생성. pastTenants.ts 14건, recentTx.ts 7건도 시드.

### 엔티티 3개

Contract.kt — tenants.ts의 Tenant 인터페이스 1:1 매핑. Building/Room @ManyToOne 관계.

PastContract.kt — pastTenants.ts의 PastTenant 인터페이스 매핑. 정산 관련 필드(depositReturn, finalRefund, penalty7 등) 전부 nullable.

Transaction.kt — recentTx.ts 매핑. room은 nullable (@ManyToOne, 건물 단위 지출 가능).

### API 10개

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/contracts | 계약 목록 (?building_id 필터) |
| GET | /api/contracts/expiring | 만료 임박 (30일 이내) |
| GET | /api/contracts/{id} | 계약 상세 |
| POST | /api/contracts | 계약 등록 |
| PUT | /api/contracts/{id} | 계약 수정 |
| POST | /api/contracts/{id}/move-out | 퇴실 처리 → PastContract 이동 |
| GET | /api/contracts/past | 퇴실 임차인 (그룹별) |
| GET | /api/contracts/past/{id} | 퇴실 임차인 상세 |
| GET | /api/transactions | 거래 내역 (?building_id 필터) |
| POST | /api/transactions | 거래 등록 |

### 테스트 12개 (ContractControllerTest 9개 + TransactionControllerTest 3개)

### 발생 문제 및 해결 (Part 1)

**1. 건물 수 테스트 기대값 불일치** — V3에서 21개 건물 추가로 총 42개. BuildingControllerTest 기대값 21→42 수정.

**2. Flyway 시드 중 서버 500 에러** — bootRun 프로세스 포트 충돌. 기존 프로세스 kill 후 재시작으로 해결.

### Part 1 curl 검증

| 항목 | 기대값 | 실제값 |
|------|--------|--------|
| 계약 목록 | 488개 | 488개 ✅ |
| 제이앤제이 계약 | 4개 | 4개 ✅ |
| 퇴실 그룹 | 11개 | 11개 ✅ |
| 거래 내역 | 7개 | 7개 ✅ |
| 토큰 없이 접근 | 401 | 401 ✅ |

---

## Part 2: 청구(Billing)

### 핵심 결정 2건

**billingHistory.ts 파일 미존재** — billing_records 테이블은 빈 DDL만 생성. 시드 데이터 없음. POST /api/billing/generate API로 채워지는 구조.

**BillingTextParser(공과금 문자 파싱) 제외** — HAUT에는 있지만 프로토타입에는 없는 기능. 필요 시 나중에 추가.

### Flyway V5 — DDL 3개 테이블

settlement_master — billingMaster.ts의 SettlementMasterEntry 매핑. 스칼라 필드는 컬럼, 복잡한 중첩 구조(subItems, costItems, hybridRules, dates, customPeriod, elecCustomerMap, gasCodeMap, accounts)는 JSONB.

billing_configs — billingConfig.ts의 BillingConfigItem 1:1 매핑. 호실별 공과금 설정(전기/가스/수도 계량, 단가, 검침 기간 등).

billing_records — 빈 테이블. DRAFT→CONFIRMED→SENT 상태 전환. UNIQUE(building_id, room_id, period_year, period_month).

### Flyway V6 — 시드 데이터 (40+256)

billingMaster.ts를 Node.js 스크립트로 파싱. TypeScript 구문을 제거한 뒤 JS로 eval하여 실제 객체를 추출하는 전략. 정규식 파싱보다 정확.

settlement_master 40행: Type A(20)/S(16)/F(2)/D(1)/X(2). elecCustomerMap, gasCodeMap, billingTypeMap, buildingAccountMap, buildingAbbr을 해당 건물의 settlement_master 행에 JSONB로 병합.

billing_configs 256행: 21개 건물의 호실별 공과금 설정. PL/pgSQL 헬퍼 함수로 FK 해석.

billingMaster.ts에만 있고 DB에 없던 4개 건물(대치칼텍, 더힐하우스, 이브릿지, 제이드하우스)을 V6 앞에 INSERT (ON CONFLICT DO NOTHING).

### 엔티티 3개

SettlementMaster.kt — 8개 JSONB 필드(@JdbcTypeCode(SqlTypes.JSON)). 20개 이상의 nullable 설정 필드.

BillingConfig.kt — Building/Room @ManyToOne. 전기(amount/start/end/price/surcharge/tax), 가스(amount/period/price/coldPrice/tax), 수도(waterFee), 케이블(cableFee).

BillingRecord.kt — Building/Room/Contract @ManyToOne. 청구 항목별 금액(rent/mgmt/water/electricity/gas/internet/lateFee/total). 상태(DRAFT/CONFIRMED/SENT) + 타임스탬프.

### 서비스 3개 — 핵심 비즈니스 로직

**ElectricityRateService.kt** — 한전 누진 3구간 요금 계산. Tier 1(0~200kWh, 기본 910원, 93.3원/kWh), Tier 2(201~400kWh, 1,600원, 187.9원/kWh), Tier 3(401+kWh, 7,300원, 280.6원/kWh). VAT 10% + 전력산업기반기금 3.7%.

**BillingCalculationService.kt** — billingMaster.ts의 5개 계산 함수를 Kotlin으로 1:1 포팅:
- truncate10: 10원 단위 절사
- calcLateFee: 납부기한 5일 초과 시 5% (10원 절사)
- calcFee: 수수료 계산 (pct/salary/fixed/hybrid 유형별)
- calcProRata: 퇴실 일할 계산
- calcVat: 부가세 계산
- getSettlementPeriod: 정산기간 (month/mid/custom 3가지)

**BillingService.kt** — CRUD + 청구서 생성:
- generate: 건물+월 → billing_configs 조회 → contracts 매칭 → 호실별 청구 레코드 생성 (DRAFT)
- confirm: DRAFT→CONFIRMED 상태 변경 + confirmedAt 타임스탬프
- send: CONFIRMED→SENT 상태 변경 + sentAt 타임스탬프
- getStatus: 청구 현황 요약 (total/draft/confirmed/sent 건수)

### API 9개

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/billing | 청구 내역 (?building_id, ?year, ?month) |
| POST | /api/billing/generate | 청구서 생성 (서버 계산) |
| PUT | /api/billing/{id}/confirm | 청구 확정 |
| PUT | /api/billing/{id}/send | 발송 처리 |
| GET | /api/billing/status | 청구 현황 요약 |
| GET | /api/billing/configs | 청구 설정 목록 (?building_id) |
| GET | /api/billing/configs/{id} | 청구 설정 상세 |
| GET | /api/settlement-master | 정산 마스터 목록 |
| GET | /api/settlement-master/{buildingId} | 정산 마스터 상세 |

### 테스트 16개 (ElectricityRateServiceTest 4개 + BillingCalculationServiceTest 6개 + BillingControllerTest 6개)

---

## 발생 문제 및 해결 (Part 2: 8건)

### 1. billingMaster.ts 파싱 실패 — 정규식 한계

처음 정규식 기반 파서로 40개 중 일부만 추출됨. settlementMaster 블록 경계를 잘못 잡았고, gasCodeMap 등의 패턴과 혼동.

**해결:** TypeScript 구문을 strip한 뒤 JS로 eval하는 전략으로 전환. `require('/tmp/_billing_master_eval.js')`로 실제 객체를 정확히 추출.

### 2. TypeScript `as number` 구문 JS eval 에러

billingMaster.ts의 `(cfg.settlementDay as number)` 같은 TypeScript 캐스트 구문이 JS에서 SyntaxError.

**해결:** `.replace(/as number/g, '')` 추가.

### 3. billingConfig.ts 256개 중 8개 누락

정규식에서 `es: '([^']+)'` 패턴이 빈 문자열(`es: ''`)을 매치하지 못함. `+`는 1개 이상이므로 빈 문자열 불가.

**해결:** `[^']+` → `[^']*`로 변경하여 빈 문자열도 매치.

### 4. 건물 이름 불일치 — billingMaster.ts vs DB

billingMaster.ts에 '대치칼텍'이 있지만 DB에는 '대치칼텍빌딩'. '더힐하우스'가 있지만 DB에는 '더힐하우스101동'. '이브릿지'와 '제이드하우스'는 DB에 아예 없음.

**해결:** V6 마이그레이션 앞에 4개 건물(대치칼텍, 더힐하우스, 이브릿지, 제이드하우스) INSERT 추가. ON CONFLICT (name) DO NOTHING으로 중복 방지.

### 5. gas_period VARCHAR(20) 초과

billingConfig.ts의 gas_period 값 `'2025-12-26 ~ 2026-01-25'`이 25자. VARCHAR(20) 초과.

**해결:** V5 DDL에서 gas_period VARCHAR(20) → VARCHAR(50)으로 확장.

### 6. 테스트 기대값 — 건물 수 42→46

V6에서 4개 건물 추가로 총 46개. BuildingControllerTest 기대값 수정.

### 7. 테스트 기대값 — 건물별 정산 유형 불일치

W하우스가 salary가 아닌 pct. 제이앤제이가 month가 아닌 mid. 실제 billingMaster.ts 데이터와 테스트 기대값 불일치.

**해결:** calcFee salary 테스트를 신림프리미어(실제 salary)로 변경. getSettlementPeriod에서 제이앤제이(mid)와 스타빌(month)을 올바르게 배정.

### 8. JSON snake_case 불일치

Jackson SNAKE_CASE 설정에 의해 JSON 필드명이 building_id, period_year 등으로 자동 변환. 테스트에서 camelCase로 보내고 camelCase 경로로 검증하여 실패.

**해결:** 테스트 JSON body와 jsonPath를 snake_case로 수정 (buildingId → building_id, confirmedAt → confirmed_at 등).

---

## 최종 검증 결과

| 항목 | 결과 |
|------|------|
| ./gradlew compileKotlin | ✅ BUILD SUCCESSFUL |
| ./gradlew test | ✅ 54개 테스트 통과 |
| ./gradlew bootRun + Flyway | ✅ V1~V6 마이그레이션 성공 |

### SQL 검증

| 테이블 | 레코드 수 |
|--------|----------|
| staff | 9 |
| buildings | 46 |
| rooms | 200+ (V4/V6에서 자동 생성 포함) |
| contracts | 488 |
| past_contracts | 14 |
| transactions | 7 |
| settlement_master | 40 |
| billing_configs | 256 |
| billing_records | 0 (generate 전) |

### curl 검증

| 엔드포인트 | 결과 |
|-----------|------|
| GET /api/settlement-master | ✅ 40개 |
| GET /api/billing/configs?building_id=1 | ✅ 4개 (제이앤제이) |
| POST /api/billing/generate (제이앤제이 2026-03) | ✅ 4건 생성 |
| GET /api/billing/status | ✅ 현황 반환 |
| GET /api/contracts | ✅ 488개 (기존 API 정상) |
| GET /api/transactions | ✅ 7개 (기존 API 정상) |

---

## 산출물 요약

### Part 1 — 계약 + 거래 (15개 신규 + 3개 수정)

| 카테고리 | 파일 |
|---------|------|
| Flyway | V3__contracts_transactions.sql (누락 건물 21개 + DDL 3개 테이블) |
| Flyway | V4__seed_contracts_transactions.sql (시드 488+14+7) |
| 엔티티 | Contract.kt, PastContract.kt, Transaction.kt |
| DTO | ContractDto.kt, PastContractDto.kt, TransactionDto.kt |
| Repository | ContractRepository.kt, PastContractRepository.kt, TransactionRepository.kt |
| Service | ContractService.kt, TransactionService.kt |
| Controller | ContractController.kt, TransactionController.kt |
| 테스트 | ContractControllerTest.kt, TransactionControllerTest.kt |
| 수정 | ErrorCode.kt (+3), RoomRepository.kt (+메서드), BuildingControllerTest.kt (21→42) |

### Part 2 — 청구 (16개 신규 + 2개 수정)

| 카테고리 | 파일 |
|---------|------|
| Flyway | V5__billing.sql (DDL 3개 테이블) |
| Flyway | V6__seed_billing.sql (시드 40+256) |
| 엔티티 | SettlementMaster.kt, BillingConfig.kt, BillingRecord.kt |
| DTO | SettlementMasterDto.kt, BillingConfigDto.kt, BillingRecordDto.kt |
| Repository | SettlementMasterRepository.kt, BillingConfigRepository.kt, BillingRecordRepository.kt |
| Service | ElectricityRateService.kt, BillingCalculationService.kt, BillingService.kt |
| Controller | BillingController.kt |
| 테스트 | ElectricityRateServiceTest.kt, BillingCalculationServiceTest.kt, BillingControllerTest.kt |
| 수정 | ErrorCode.kt (+3), BuildingControllerTest.kt (42→46) |

### Phase 3b 누적 (Part 1 + Part 2)

- 신규 API: 19개 (contracts 8 + transactions 2 + billing 9)
- 신규 테스트: 28개 (contracts 9 + transactions 3 + billing 16)
- Flyway: V3~V6 (4개 마이그레이션)
- 시드 데이터: contracts 488 / past_contracts 14 / transactions 7 / settlement_master 40 / billing_configs 256
- 프론트엔드 변경: 0

### 미수정

- 프론트엔드 코드 전부 미수정 (VITE_USE_API=false 유지)
- billingMaster.ts의 계산 로직 보존 (같은 입력 → 같은 출력)
- 프로토타입 데이터 구조 변경 없음
