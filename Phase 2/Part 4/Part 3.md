# 도메인 워크플로우 추출 — Part 3: 건물관리 + 직원 + 설정

## Context

CEO 코드에서 건물/호실 관리, 직원/역할, 부동산 관리, 회사 설정 워크플로우를 추출한다.
BuildingDetailPage(1,469줄)가 가장 큰 페이지이며 건물 정보/호실 구성/정산 설정/담당자 배정을 모두 포함한다.

**핵심 파일:**
- `CEO BuildingDetailPage.jsx` (1,469줄) — 건물 상세 + 호실 관리
- `CEO StaffPage.jsx` (170줄) — 직원 CRUD
- `CEO CompanySettingsPage.jsx` (330줄) — 회사 설정
- `CEO BrokerPage.jsx` (164줄) — 부동산 관리
- `src/config/staff.ts` — 직원/역할 초기 데이터
- `src/components/BuildingFormSections.tsx` — 건물 폼 공유 컴포넌트

---

## 시나리오 9: 건물/호실 관리

### 1단계: 건물 등록

**어디서:** BuildingsPage → "건물 추가" 버튼

**건물 기본정보 필드:**
- `buildingName` — 건물명
- `buildingNickname` — 약칭
- `addressOld` — 지번 주소
- `addressRoad` — 도로명 주소
- `contractStartDate` / `start` — 관리 시작일

**건물 유형 (다중선택, Boolean 토글):**

| 유형 | 플래그 | 설명 |
|------|--------|------|
| 단기 | `isShortTermRental` | 단기 임대 호실 |
| 일반임대 | `isLongTermRental` | 장기 일반 임대 |
| 근생 | `isCommercial` | 근린생활시설 |
| 관리사무소 | `isManagementAgency` | 관리사무소 |
| 기업시설관리 | `isCorporateFacility` | 기업시설 관리 |

**유형별 UI 차이:**
- 기업시설관리만 체크: 호실 층 숨김, 최소 직원 배정 (내부/외부/수금만)
- 관리사무소만 체크: 호실 타입 강제 "관리사무소"
- 단기만: 직원 4역할 (총괄, 내부, 외부, 수금)
- 일반/근생 포함: 직원 5역할 (+ 계약팀)

---

### 2단계: 건물주 정보

**건물주 필드 (최대 3명):**
- `ownerName` — 건물주 이름
- `ownerPhone` — 연락처
- `ownerEmail` — 이메일
- `ownerBusinessRegistrationNumber` — 사업자등록번호

**다중 건물주:** showOwner2, showOwner3 토글로 2~3번째 건물주 추가 가능

---

### 3단계: 호실 구성

**호실 구조:**
```javascript
// buildingData[buildingName] 안에 호실별 키로 저장
// key: room_[호실번호] → value: { 호실 설정 }
// 층 구조: detail.floors = { "1": ["101", "102"], "B": ["B01"], ... }
```

**호실별 설정 필드:**
- `standardDeposit` — 기준 보증금
- `standardRent` — 기준 월세
- `standardManagementFee` — 기준 관리비
- `standardWaterFee` — 기준 수도료
- `standardInternetFee` — 기준 인터넷료
- `standardCleaningFee` — 기준 청소비 (단기)
- `standardBrokerFee` — 기준 중개수수료 (단기)
- `roomType` — 호실 유형 (단기/일반임대/근생/관리사무소)
- `area` — 면적 (㎡)
- `photos` / `roomPhotos_[room]` — 호실 사진 (최대 30장, Base64)
- `collectionAssignee` — 호실별 수금 담당자 (건물 기본값 오버라이드)

**호실 추가:**
1. 층 이름 + 호실 번호 입력
2. 자동으로 해당 층에 배치
3. 호실 상세 폼 자동 오픈

**호실 삭제 (2단계 확인):**
1. "호실 삭제하시겠습니까?" + 현재 임차인 경고
2. "되돌릴 수 없습니다!" + 삭제 항목 요약
3. → 호실 데이터 + 사진 + 임차인 기록 삭제

**호실 상태 표시:**
```javascript
getRoomStatus(room):
  → { status: "입주중" | "공실" | "계약중", name: "홍길동", overdue: 5 }
  // activeTenants, activeVacancies에서 매칭
```

---

### 4단계: 계좌/정산 설정 (건물 유형별)

**계좌 모드 (accountConfig):**

**단기:**

| 모드 | 설명 | 임대료 | 관리비+공과금 |
|------|------|--------|-------------|
| `houseman` | 전액 HM | HM 계좌 | HM 계좌 |
| `hm_owner1` | 전액 건물주 | 건물주 계좌 | 건물주 계좌 |
| `owner1` | 임대/관리 분리 | 건물주 계좌 | HM 계좌 |
| `owner2` | 임대+관리/공과 분리 | 건물주 계좌 | HM 계좌 |
| `owner3` | 임대+관리/수도+인터넷 분리 | 건물주 계좌 | 후불 처리 |

**일반임대/근생:**

| 모드 | 설명 | 계좌1 | 계좌2 | 계좌3 |
|------|------|-------|-------|-------|
| `gs1` | 전액 1계좌 | 전액 | - | - |
| `gs2a` | 임대/관리 분리 | 임대료 | 관리비+공과금 | - |
| `gs2b` | 합산/공과 분리 | 임대+관리 | 공과금 | - |
| `gs3` | 3분할 | 임대료 | 관리비 | 공과금 |

**관리사무소:**

| 모드 | 설명 |
|------|------|
| `mgmt_houseman` | 전액 HM 계좌 |
| `mgmt_building` | 전액 건물 대표 계좌 |

**호실별 계좌 오버라이드:**
- 각 호실이 건물 기본 설정을 개별 오버라이드 가능
- `enableRoomCustom()` → 건물 설정 복사 → 호실 레벨 편집
- `disableRoomCustom()` → 호실 오버라이드 제거 → 건물 기본값 사용

**HM 기본 계좌:** 하나은행 225-910048-15704 박종호(하우스맨)

---

### 5단계: 담당자 배정 (Section 7)

**저장 위치:** Supabase `building_staff_assignments` 테이블

**건물 유형별 필요 역할:**

| 건물 유형 | 필요 역할 |
|-----------|-----------|
| 단기만 | 총괄, 내부팀, 외부팀, 수금팀 |
| 일반임대/근생 포함 | 총괄, 내부팀, 외부팀, 수금팀, 계약팀 |
| 관리사무소/기업시설 | 내부팀, 외부팀, 수금팀 |

**배정 방식:** 역할별 드롭다운 → 직원 선택 → Supabase UPSERT
**미배정 경고:** 빨간 배경 + "필수" 배지 + 하단 경고 메시지

---

### 편집 모드 패턴 (BuildingDetailPage)

**2가지 모드:**

| 모드 | 동작 | 저장 |
|------|------|------|
| 보기 모드 (기본) | 편집 즉시 Supabase 반영 (silent) | 자동 |
| 편집 모드 | editBuffer에만 저장, 3초 debounce 자동저장 | 수동 "저장" 버튼 |

```javascript
// 편집 모드에서의 데이터 머지:
const realSaved = buildingData[buildingName] || {};
const saved = editMode ? { ...realSaved, ...editBuffer } : realSaved;
```

**데이터 원본 우선순위:**
```
Supabase roomMaster (DB) → 단일 원본
  ↓ 없으면
정적 데이터 fallback (billingConfig 등)
```

---

### 건물 삭제 (3단계 확인)

1. "이 건물을 영구 삭제하시겠습니까?" + 호실 수 표시
2. "정말요? 되돌릴 수 없습니다!" + 캐스케이드 삭제 경고 (임차인, AS 기록 등)
3. 건물명 직접 타이핑 확인 → `deleteBuilding(sbId)` → FK 캐스케이드

---

## 시나리오 10: 직원 관리 + 역할 분기

### 직원 데이터 구조

```typescript
{
  id: number,              // Date.now() 기반 고유 ID
  name: string,            // 이름
  phone: string,           // 연락처
  pw: string,              // 비밀번호 (평문)
  roles: string[],         // 역할 배열 (다중 가능)
  assignedBuildings: []    // 담당 건물 (현재 미구현)
}
```

### 역할 5종

| 역할 ID | 라벨 | 아이콘 | 색상 | 설명 |
|---------|------|--------|------|------|
| `general` | 총괄 | 👑 | 빨강 | 대표/총괄 — 모든 건물 접근 |
| `internal` | 내부팀 | 🏢 | 파랑 | 사내 관리 직원 |
| `external` | 외부팀 | 🔧 | 초록 | 외부 파견 직원 |
| `collection` | 수금팀 | 💰 | 노랑 | 수금 담당 |
| `contract` | 계약팀 | 📝 | 보라 | 계약/재계약 담당 |

**다중 역할:** 한 직원이 2~5개 역할 동시 보유 가능
- 예: 유은혜 부장 = 내부팀 + 수금팀
- 예: 나호용 차장 = 수금팀 + 외부팀

### 초기 직원 9명

| 이름 | 직급 | 역할 |
|------|------|------|
| 박종호 | 대표 | 총괄 |
| 유은혜 | 부장 | 내부팀, 수금팀 |
| 나호용 | 차장 | 수금팀, 외부팀 |
| 공원식 | 대리 | 내부팀 |
| 유인식 | 과장 | 외부팀 |
| 이재혁 | 사원 | 외부팀 |
| 이진아 | 사원 | 내부팀 |
| 조현경 | 사원 | 내부팀 |
| 이우정 | 과장 | 수금팀 |

### CRUD

- **추가:** 이름(필수) + 역할(필수, 다중선택) + 전화/비밀번호(선택)
- **수정:** 인라인 편집, 동일 검증
- **삭제:** 즉시 필터 삭제 (확인 없음)
- **저장:** localStorage (`hm_staffList`), 즉시 반영

### 역할 기반 접근 제어 (RBAC)

**핵심 훅: `useMyBuildings()`**

```typescript
const { currentStaff, myBuildings } = useMyBuildings();

// general 역할: 모든 건물 접근
// 그 외: assignedBuildings에 해당하는 건물만
```

**적용 범위:**
- **CalendarPage:** 담당 건물의 이벤트만 표시
- **TenantsPage:** 담당 건물의 임차인만 표시
- **BuildingDetailPage:** 모든 건물 접근 가능 (단, 편집은 역할에 따라)

**이벤트 추적:**
- 모든 계약/퇴실/휴무 이벤트에 `registeredBy: currentStaff.name` 기록
- 감사 추적(audit trail) 용도

**호실별 수금 담당 오버라이드:**
- 건물 기본 수금 담당 vs 호실별 개별 지정
- `collectionAssignee` 필드로 호실 레벨 오버라이드
- CollectionPage에서 "경고" 표시 (건물 기본값과 다를 때)

---

## 시나리오 11: 부동산 관리

### 부동산 데이터 구조

```typescript
{
  id: number,      // Date.now()
  name: string,    // 부동산/중개사무소명
  phone: string,   // 연락처
  area: string     // 담당 지역/건물 (쉼표 구분)
}
```

### 자동 수집 (collectedBrokers)

```javascript
// calendarEvts에서 type === "계약" 이벤트를 스캔
// brokerPhone 기준 중복 제거 (전화번호 정규화: 공백/하이픈/괄호 제거)
// 결과: { name, phone, buildings: Set<string> }
```

**흐름:**
1. 계약 이벤트 생성 시 `broker` + `brokerPhone` 필드 입력
2. BrokerPage에서 자동 수집되어 "계약 이력에서 수집" 섹션에 표시
3. "등록" 버튼 클릭 → brokerList에 추가
4. 이미 등록된 부동산은 "등록됨" (녹색) 표시

### 수동 CRUD

- **추가:** 부동산명(필수) + 연락처(필수) + 담당 지역(선택)
- **수정:** 인라인 편집 (이름, 연락처, 담당 지역)
- **삭제:** 즉시 필터 삭제
- **저장:** localStorage (`hm_brokerList`)

### 부동산과 계약의 관계

```
계약 이벤트 (CalendarPage)
  ├─ broker: "OO공인중개사"      ← 부동산명
  ├─ brokerPhone: "02-xxxx-xxxx"  ← 부동산 연락처
  └─ commBroker: 10               ← 중개수수료율 (%)

BrokerPage
  ├─ 자동 수집: calendarEvts에서 brokerPhone 기준 추출
  └─ 수동 등록: brokerList (localStorage)

정산서 (SettlementPage)
  └─ 입주 정산 시 중개수수료 공제
```

---

## 시나리오 12: 회사 설정

### 설정 항목

**회사 기본정보:**
- `company_name` — 회사명
- `company_phone` — 전화번호
- `company_email` — 이메일
- `company_address` — 주소 (다음 우편번호 API 연동)

### 하우스맨 계좌 관리

**계좌 데이터 구조:**
```typescript
{
  id: number,
  alias: string,           // 별칭 ("관리비통장", "월세통장")
  account_number: string,  // 계좌번호
  bank: string,           // 은행 (21개 목록)
  holder: string,         // 예금주
  status: string,         // "active" | "deprecating" | "inactive"
  note: string,           // 메모
  isPrimary: boolean      // 주 계좌 여부 (1개만)
}
```

**계좌 상태 3종:**

| 상태 | 라벨 | 색상 | 용도 |
|------|------|------|------|
| `active` | 사용중 | 녹색 | 현재 사용 중인 계좌 |
| `deprecating` | 폐기예정 | 주황 | 전환 중인 계좌 |
| `inactive` | 미사용 | 회색 | 비활성 계좌 |

**은행 목록 (21개):**
국민, 신한, 우리, 하나, 농협, 기업, SC제일, 씨티, 카카오, 토스, 케이, 새마을금고, 신협, 우체국, 수협, 대구, 부산, 경남, 광주, 전북, 제주

**CRUD:**
- 추가: 빈 템플릿 생성 (id: Date.now())
- 수정: 인덱스 기반 필드 업데이트
- 삭제: 인덱스 기반 필터
- 주 계좌 설정: 1개만 isPrimary: true (나머지 false)

**저장:** localStorage (`hm_companySettings`), 즉시 반영
**주소 검색:** 다음 우편번호 API 동적 로드

---

## Supabase 연동 현황

| 데이터 | 저장소 | 비고 |
|--------|--------|------|
| 건물 기본정보 | Supabase (buildings 테이블) | 단일 원본, 정적 데이터 fallback |
| 호실 정보 | Supabase (room_master 테이블) | 단일 원본 |
| 건물 담당자 배정 | Supabase (building_staff_assignments) | UPSERT |
| 직원 목록 | localStorage (hm_staffList) | Supabase 미연동 |
| 부동산 목록 | localStorage (hm_brokerList) | Supabase 미연동 |
| 회사 설정 | localStorage (hm_companySettings) | Supabase 미연동 |
| 계약 이벤트 (broker 정보) | Supabase (calendar_events) | 부동산 자동 수집 소스 |

---

## 핵심 비즈니스 규칙 요약

### 건물 관리 규칙

1. **건물 유형 다중선택:** 한 건물이 "단기+일반임대" 등 복합 유형 가능
2. **유형별 UI 분기:** 기업시설관리 → 호실 숨김, 관리사무소 → 호실타입 강제
3. **건물 삭제 3단계:** 경고 → 확인 → 건물명 입력 (FK 캐스케이드: 임차인/AS 모두 삭제)
4. **호실 삭제 2단계:** 임차인 경고 → 확인
5. **파일 업로드:** 5MB 제한, Base64 변환

### 직원/역할 규칙

6. **총괄(general) = 전체 접근:** 모든 건물 열람/편집
7. **담당자 = 배정 건물만:** assignedBuildings 기반 필터
8. **다중 역할:** 한 직원이 여러 역할 동시 보유
9. **건물별 필수 역할:** 유형에 따라 배정 필요 역할이 다름
10. **호실별 수금 담당 오버라이드:** 건물 기본 담당자와 다른 직원 지정 가능

### 부동산 규칙

11. **자동 수집:** 계약 이벤트에서 brokerPhone 기준 자동 추출
12. **중복 판별:** 전화번호 정규화 (공백/하이픈/괄호 제거) 후 비교
13. **계약 연동:** 계약 시 broker 필드로 부동산 정보 기록

### 데이터 흐름

```
Staff Master (localStorage)
  ├→ Building Staff Assignments (Supabase)
  │   └→ 건물별/역할별 담당자 배정
  ├→ Calendar Events (Supabase)
  │   └→ registeredBy: currentStaff.name (감사 추적)
  │   └→ broker/brokerPhone → BrokerPage 자동 수집
  └→ useMyBuildings() (런타임)
      └→ 페이지별 건물 필터링 (Tenants, Calendar)

Building Data (Supabase)
  ├→ room_[호실]: 호실 기준 설정값
  ├→ 계좌 설정: 건물/호실별 청구 계좌 분배
  └→ 담당자 배정: 역할별 직원 매핑

Company Settings (localStorage)
  └→ 계좌 정보 + 회사 연락처 → 청구서/정산서 발행 시 사용
```

---

## 검증 방법

코드 읽기 전용 분석이므로 실행 검증 불필요. 다음 작업에서 활용:
1. 백엔드 Building/Staff/Broker API 설계 시 필드 목록 참조
2. RBAC 설계 시 역할 5종 + 접근 제어 규칙 참조
3. 건물 유형별 정산/계좌 설정 → SettlementConfig 엔티티 설계
4. localStorage → PostgreSQL 마이그레이션 대상 식별 (직원, 부동산, 회사설정)
