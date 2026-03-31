# FE ↔ BE 타입 매핑 분석

> 작성일: 2026-03-31
> 기준: Jackson `property-naming-strategy: SNAKE_CASE` (application.yml:21)

---

## 0. 치명적 이슈: Jackson SNAKE_CASE

**application.yml 설정:**
```yaml
jackson:
  property-naming-strategy: SNAKE_CASE
```

이 설정으로 인해 BE의 Kotlin DTO 필드가 JSON으로 직렬화될 때 **모두 snake_case로 변환**됨.

예: `buildingId` → `building_id`, `moveIn` → `move_in`, `roomNumber` → `room_number`

FE의 모든 타입은 **camelCase**로 정의되어 있어 전면 불일치 발생.

### 해결 방안 (택 1)

| 방안 | 변경 위치 | 영향 범위 | 권장 |
|------|----------|----------|------|
| **A. BE: SNAKE_CASE 제거** | application.yml 1줄 | BE 테스트 수정 필요 | **★ 권장** |
| B. FE: 변환 레이어 추가 | src/lib/transforms.ts | 모든 Wrapper 수정 | 비권장 |
| C. FE: snake_case 타입 추가 | src/types/api.ts | 이중 타입 관리 | 비권장 |

**방안 A 권장 이유:** Kotlin DTO 필드명이 이미 camelCase이고, FE 타입도 camelCase. SNAKE_CASE 설정만 제거하면 양쪽이 자연스럽게 일치함.

---

## 1. Contract (BE: ContractResponse) ↔ Tenant (FE)

### 구조적 차이

| 차이 유형 | 설명 |
|----------|------|
| **ID vs Name 참조** | BE는 `buildingId: Long` + `buildingName: String`, FE는 `building: string` (이름만) |
| **날짜 타입** | BE는 `LocalDate` (ISO "2026-03-31"), FE는 `string` |
| **금액 타입** | BE는 `Long`, FE는 `number` (호환 가능) |

### 필드 1:1 비교 (SNAKE_CASE 제거 가정)

| BE (ContractResponse) | JSON 키 | FE (Tenant) | 일치 | 변환 필요 |
|----------------------|---------|-------------|------|----------|
| `id: Long` | `id` | `id: number` | ✅ | 없음 |
| `buildingId: Long` | `buildingId` | ❌ 없음 | ❌ | FE에 없는 필드 |
| `buildingName: String` | `buildingName` | `building: string` | ❌ | **키 이름 다름**: `buildingName` → `building` |
| `roomId: Long` | `roomId` | ❌ 없음 | ❌ | FE에 없는 필드 |
| `roomNumber: String` | `roomNumber` | `room: string` | ❌ | **키 이름 다름**: `roomNumber` → `room` |
| `name: String` | `name` | `name: string` | ✅ | 없음 |
| `phone: String` | `phone` | `phone: string` | ✅ | 없음 |
| `rent: Long` | `rent` | `rent: number` | ✅ | 없음 |
| `mgmt: Long` | `mgmt` | `mgmt: number` | ✅ | 없음 |
| `deposit: Long` | `deposit` | `deposit: number` | ✅ | 없음 |
| `type: String` | `type` | `type: TenantType` | ✅ | 없음 |
| `due: String` | `due` | `due: string` | ✅ | 없음 |
| `status: String` | `status` | `status: TenantStatus` | ✅ | 없음 |
| `overdue: Long` | `overdue` | `overdue: number` | ✅ | 없음 |
| `moveIn: LocalDate` | `moveIn` | `moveIn: string` | ⚠️ | ISO string 자동 변환 (Jackson) |
| `expiry: LocalDate` | `expiry` | `expiry: string` | ⚠️ | ISO string 자동 변환 (Jackson) |
| `prevUnpaid: Long` | `prevUnpaid` | `prevUnpaid: number` | ✅ | 없음 |
| `currentUnpaid: Long` | `currentUnpaid` | `currentUnpaid: number` | ✅ | 없음 |
| `overdueDays: Int` | `overdueDays` | `overdueDays: number` | ✅ | 없음 |
| `carNumber: String?` | `carNumber` | `carNumber?: string` | ✅ | 없음 |
| `carType: String?` | `carType` | `carType?: string` | ✅ | 없음 |

### 필수 변환 함수

```typescript
function contractToTenant(c: ContractResponse): Tenant {
  return {
    ...c,
    building: c.buildingName,  // buildingName → building
    room: c.roomNumber,        // roomNumber → room
  };
}
```

**변환 필요 필드: 2개** (`buildingName` → `building`, `roomNumber` → `room`)

---

## 2. Building (BE: BuildingListResponse / BuildingDetailResponse) ↔ Building (FE)

### 필드 1:1 비교

| BE (BuildingListResponse) | JSON 키 | FE (Building) | 일치 | 변환 필요 |
|--------------------------|---------|---------------|------|----------|
| `id: Long` | `id` | ❌ 없음 | ❌ | FE에 없는 필드 (추가 권장) |
| `name: String` | `name` | `name: string` | ✅ | 없음 |
| `roomCount: Int` | `roomCount` | `rooms: number` | ❌ | **키 이름 다름**: `roomCount` → `rooms` |
| `occupiedCount: Int` | `occupiedCount` | `occupied: number` | ❌ | **키 이름 다름**: `occupiedCount` → `occupied` |
| `buildingType: String` | `buildingType` | `type: BuildingType` | ❌ | **키 이름 다름**: `buildingType` → `type` |
| `feeType: String` | `feeType` | `feeType: FeeType` | ✅ | 없음 |
| `fee: BigDecimal` | `fee` | `fee: number` | ⚠️ | BigDecimal → number (JSON에서는 number) |
| `fixedFee: Long` | `fixedFee` | `fixedFee: number` | ✅ | 없음 |
| `parkingTotal: Int` | `parkingTotal` | `parkingTotal: number` | ✅ | 없음 |
| `address: String?` | `address` | ❌ 없음 | ❌ | FE에 없는 필드 |
| ❌ 없음 | — | `special: string \| null` | ❌ | List에 없음 (Detail에는 있음) |

### BE BuildingDetailResponse 추가 필드 (FE 대응 = BuildingFloorData)

| BE (BuildingDetailResponse) | FE (BuildingFloorData) | 일치 |
|---------------------------|----------------------|------|
| `ownerName: String?` | `owner: string` | ❌ 키 다름 |
| `ownerPhone: String?` | `phone: string` | ❌ 키 다름 |
| `ownerFee: BigDecimal?` | `fee: number` | ❌ 키 다름 |
| `ownerAccount: String?` | `account: string` | ❌ 키 다름 |
| `mgmtStart: LocalDate?` | `start: string` | ❌ 키 다름 |
| `address: String?` | `address: string` | ✅ |
| `floors: Map<String, List<String>>?` | `floors: Record<string, string[]>` | ✅ |

### 필수 변환 함수

```typescript
function buildingResponseToBuilding(b: BuildingListResponse): Building {
  return {
    name: b.name,
    rooms: b.roomCount,        // roomCount → rooms
    occupied: b.occupiedCount,  // occupiedCount → occupied
    type: b.buildingType as BuildingType,  // buildingType → type
    feeType: b.feeType as FeeType,
    fee: Number(b.fee),
    fixedFee: b.fixedFee,
    special: null,  // List에 없음
    parkingTotal: b.parkingTotal,
  };
}
```

**변환 필요 필드: 3개** (`roomCount` → `rooms`, `occupiedCount` → `occupied`, `buildingType` → `type`)

---

## 3. Calendar (BE: CalendarEventResponse) ↔ CalendarEvent (FE)

### 필드 1:1 비교

| BE (CalendarEventResponse) | JSON 키 | FE (CalendarEvent) | 일치 | 변환 필요 |
|---------------------------|---------|-------------------|------|----------|
| `id: Long` | `id` | ❌ 없음 | ❌ | FE에 없는 필드 (추가 필수 — CRUD에 필요) |
| `date: LocalDate` | `date` | `date: string` | ⚠️ | ISO string 자동 변환 |
| `type: String` | `type` | `type: CalendarEventType` | ✅ | 없음 |
| `buildingId: Long?` | `buildingId` | ❌ 없음 | ❌ | FE에 없는 필드 |
| `buildingName: String?` | `buildingName` | `building?: string` | ❌ | **키 이름 다름**: `buildingName` → `building` |
| `roomId: Long?` | `roomId` | ❌ 없음 | ❌ | FE에 없는 필드 |
| `roomNumber: String?` | `roomNumber` | `room?: string` | ❌ | **키 이름 다름**: `roomNumber` → `room` |
| `name: String` | `name` | `name: string` | ✅ | 없음 |
| `color: String` | `color` | `color: string` | ✅ | 없음 |

### 필수 변환 함수

```typescript
function calendarResponseToEvent(e: CalendarEventResponse): CalendarEvent & { id: number } {
  return {
    id: e.id,
    date: e.date,              // ISO string
    type: e.type as CalendarEventType,
    building: e.buildingName,  // buildingName → building
    room: e.roomNumber,        // roomNumber → room
    name: e.name,
    color: e.color,
  };
}
```

**변환 필요 필드: 2개** (`buildingName` → `building`, `roomNumber` → `room`)
**FE 타입 확장 필요: `id` 필드 추가**

---

## 4. Vacancy (BE: VacancyResponse) ↔ Vacancy (FE)

### 필드 1:1 비교

| BE (VacancyResponse) | JSON 키 | FE (Vacancy) | 일치 | 변환 필요 |
|---------------------|---------|-------------|------|----------|
| `id: Long` | `id` | ❌ 없음 | ❌ | FE에 없는 필드 (추가 필수) |
| `buildingId: Long` | `buildingId` | ❌ 없음 | ❌ | FE에 없는 필드 |
| `buildingName: String` | `buildingName` | `building: string` | ❌ | **키 이름 다름**: `buildingName` → `building` |
| `roomId: Long` | `roomId` | ❌ 없음 | ❌ | FE에 없는 필드 |
| `roomNumber: String` | `roomNumber` | `room: string` | ❌ | **키 이름 다름**: `roomNumber` → `room` |
| `type: String` | `type` | `type: string` | ✅ | 없음 |
| `commBroker: BigDecimal` | `commBroker` | `commBroker: number` | ⚠️ | BigDecimal → number |
| `commEvent: String` | `commEvent` | `commEvent: string` | ✅ | 없음 |
| `pw: String` | `pw` | `pw: string` | ✅ | 없음 |
| `deposit: Long` | `deposit` | `deposit: number` | ✅ | 없음 |
| `rent: Long` | `rent` | `rent: number` | ✅ | 없음 |
| `nego: Long` | `nego` | `nego: number` | ✅ | 없음 |
| `mgmt: Long` | `mgmt` | `mgmt: number` | ✅ | 없음 |
| `water: String` | `water` | `water: string` | ✅ | 없음 |
| `cable: String` | `cable` | `cable: string` | ✅ | 없음 |
| `exitFee: Long` | `exitFee` | `exitFee: number` | ✅ | 없음 |
| `days: Int` | `days` | `days: number` | ✅ | 없음 |
| `status: String` | `status` | `status: string` | ✅ | 없음 |

### 필수 변환 함수

```typescript
function vacancyResponseToVacancy(v: VacancyResponse): Vacancy & { id: number } {
  return {
    id: v.id,
    building: v.buildingName,  // buildingName → building
    room: v.roomNumber,        // roomNumber → room
    type: v.type,
    commBroker: Number(v.commBroker),
    commEvent: v.commEvent,
    pw: v.pw,
    deposit: v.deposit,
    rent: v.rent,
    nego: v.nego,
    mgmt: v.mgmt,
    water: v.water,
    cable: v.cable,
    exitFee: v.exitFee,
    days: v.days,
    status: v.status,
  };
}
```

**변환 필요 필드: 2개** (`buildingName` → `building`, `roomNumber` → `room`)
**FE 타입 확장 필요: `id` 필드 추가**

---

## 5. Billing (BE: BillingRecordResponse) ↔ FE

### FE 대응 타입 부재

FE에는 `BillingRecordResponse`에 대응하는 명확한 타입이 **없음**.
- `BillingConfigItem`은 공과금 설정 (약어 필드: b, r, d, w 등) — BillingRecord와 다름
- `billingHistory`는 `any[]`로 타이핑됨 (appContext.ts:5)

### BE BillingRecordResponse 필드

| BE 필드 | JSON 키 | FE 대응 | 비고 |
|---------|---------|---------|------|
| `id: Long` | `id` | — | 신규 |
| `buildingId: Long` | `buildingId` | — | 신규 |
| `buildingName: String` | `buildingName` | — | 신규 |
| `roomId: Long` | `roomId` | — | 신규 |
| `roomNumber: String` | `roomNumber` | — | 신규 |
| `contractId: Long?` | `contractId` | — | 신규 |
| `periodYear: Int` | `periodYear` | — | 신규 |
| `periodMonth: Int` | `periodMonth` | — | 신규 |
| `tenantName: String` | `tenantName` | — | 신규 |
| `rent: Long` | `rent` | — | 공통 |
| `mgmt: Long` | `mgmt` | — | 공통 |
| `water: Long` | `water` | — | 공통 |
| `electricity: Long` | `electricity` | — | 공통 |
| `gas: Long` | `gas` | — | 공통 |
| `internet: Long` | `internet` | — | 공통 |
| `lateFee: Long` | `lateFee` | — | 공통 |
| `total: Long` | `total` | — | 공통 |
| `status: String` | `status` | — | 공통 |
| `confirmedAt: OffsetDateTime?` | `confirmedAt` | — | 신규 |
| `sentAt: OffsetDateTime?` | `sentAt` | — | 신규 |
| `notes: String?` | `notes` | — | 신규 |

**필요 작업: FE에 `BillingRecord` 타입 신규 정의**

---

## 6. API 응답 래퍼

### BE ApiResponse

```kotlin
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ErrorResponse? = null,
    val timestamp: LocalDateTime
)
```

Jackson SNAKE_CASE 제거 후 JSON:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-03-31T14:30:00"
}
```

### FE ApiResponse (src/types/index.ts:430)

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ErrorResponse;
  timestamp?: string;
}
```

**일치**: ✅ (SNAKE_CASE 제거 후)

### FE api.ts에서 data 추출 필요

현재 쿼리 훅이 `/api/contracts`를 호출하면 `ApiResponse<ContractResponse[]>`가 반환됨.
FE 쿼리 훅은 `.data` 를 추출해야 함:

```typescript
queryFn: async () => {
  const res = await api.get<ApiResponse<ContractResponse[]>>('/api/contracts');
  return res.data;  // ApiResponse.data 추출
}
```

---

## 7. 공통 패턴 요약

### 반복되는 불일치 패턴

| 패턴 | BE 필드 | FE 필드 | 발생 도메인 |
|------|---------|---------|------------|
| **buildingName → building** | `buildingName` | `building` | Contract, Calendar, Vacancy |
| **roomNumber → room** | `roomNumber` | `room` | Contract, Calendar, Vacancy |
| **roomCount → rooms** | `roomCount` | `rooms` | Building |
| **occupiedCount → occupied** | `occupiedCount` | `occupied` | Building |
| **buildingType → type** | `buildingType` | `type` | Building |
| **ID 필드 부재** | `id`, `buildingId`, `roomId` | ❌ 없음 | Calendar, Vacancy, Building |

### 권장 조치

1. **application.yml에서 SNAKE_CASE 제거** — 최우선
2. **공통 변환 유틸 작성** (`src/lib/transforms.ts`)
   - `mapBuildingName(response)` — `buildingName` → `building`, `roomNumber` → `room` 공통 변환
3. **FE 타입 확장** — `CalendarEvent`, `Vacancy`, `Building`에 `id` 필드 추가
4. **BillingRecord 타입 신규 정의**
5. **쿼리 훅에서 ApiResponse.data 추출 로직 확인**

---

## 8. SNAKE_CASE 제거 시 BE 테스트 영향

SNAKE_CASE를 제거하면 BE 테스트에서 JSON 필드명이 바뀜:

```
Before: {"building_id": 1, "building_name": "하우스원", "room_number": "101"}
After:  {"buildingId": 1, "buildingName": "하우스원", "roomNumber": "101"}
```

**영향받는 테스트:** Controller 테스트에서 `jsonPath` 검증하는 부분.
- 예: `.andExpect(jsonPath("$.data.building_id").value(1))` → `.andExpect(jsonPath("$.data.buildingId").value(1))`

**추정 수정량:** Controller 테스트 13개 파일의 jsonPath 문자열 치환 (일괄 치환 가능)

---

## 9. Docker 미실행 상태

```
현재 Docker 데몬이 실행되고 있지 않음.
백엔드 부팅 + 테스트 실행은 Docker 시작 후 진행 필요.

$ docker compose up -d db    # PostgreSQL 시작
$ ./gradlew test             # 테스트 실행
```
