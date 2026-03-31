# 도메인 워크플로우 추출 — Part 2: 청구 + 수금 + 정산

## Context

CEO 코드에서 월간 청구/수금 사이클, 연체 처리, 건물주 정산 워크플로우를 추출한다.
Houseman 도메인에서 가장 복잡한 영역으로, 42개 건물 × 수백 개 호실마다 설정이 다르다.

**핵심 파일:**
- `src/data/billingMaster.ts` (1,077줄) — 정산 계산 함수 + 건물별 정산 설정
- `src/data/billingConfig.ts` (4,612줄) — 호실별 공과금 설정 + 검침 데이터
- `src/data/settlementData.ts` (139줄) — 정산 비용 카테고리
- `src/pages/SettlementPage.tsx` — 건물주 정산서
- `src/pages/CollectionPage.tsx` — 수금 관리
- `src/pages/UtilityBillingPage.tsx` — 공과금 청구

---

## 시나리오 6: 월간 청구/수금 사이클

### 1단계: 공과금 데이터 입력 (UtilityBillingPage)

**어디서:** UtilityBillingPage — 매월 전기/가스 고지서 도착 후

**흐름:**
1. 전기/가스 고지서 엑셀 업로드
2. 시스템이 계량기 번호로 자동 매칭 (elecCustomerMap, gasCodeMap)
3. 매칭 안 되면 수동 입력
4. 검침값 확인 후 "확인" 처리

**호실별 공과금 데이터 구조 (billingConfig):**
```typescript
{
  b: '제이앤제이',    // 건물
  r: 'B01',           // 호실
  d: 5,               // 납부일
  w: 25000,           // 수도 (원/월, 정액)
  c: 25000,           // 케이블/인터넷 (원/월, 정액)
  ea: 22760,          // 전기요금 (원)
  es: '10/12',        // 전기 검침 시작일
  ee: '11/11',        // 전기 검침 종료일
  ep: 2575,           // 전기 전월 지침 (kWh)
  ec: 2719,           // 전기 당월 지침 (kWh)
  eu: 144,            // 전기 사용량 (kWh) = ec - ep
  ga: 30420,          // 가스요금 (원)
  gp: '12.20~01.19',  // 가스 검침 기간
  gpr: 2481,          // 가스 전월 지침
  gcr: 2509,          // 가스 당월 지침
  gu: 28,             // 가스 사용량 = gcr - gpr
}
```

**검침 체인 시스템:**
- `hm_meterChain` (localStorage) — 퇴실 검침값 → 다음 입주자 기준점
- 이전 검침값 자동 carry-forward

**중요:** 전기요금은 한전 누진 계산이 아님. 고지서 금액(`ea`)을 그대로 입력. 시스템은 데이터 입력/정산 플랫폼이지 요금 계산 엔진이 아님.

---

### 2단계: 청구서 생성 + 발송

**어디서:** UtilityBillingPage — 검침 데이터 확인 후

**임차인 타입별 청구 구성:**

| 타입 | 청구 항목 | 비고 |
|------|-----------|------|
| 단기 | 임대료 + 관리비 + 공과금 통합 | 청구일: 납부일 7~12일 전 |
| 일반임대 | 임대료 + 고정관리비 (± 변동관리비) | 청구일: 납부일 0~10일 전 |
| 근생 Method A | 임대료 + 관리비 + 변동관리비 | |
| 근생 Method B | 관리비 + 변동관리비 (임대료 제외) | |

**청구 발송 흐름:**
```
Step 1: confirmItem(item) — billingConfirmed[key] = true
Step 2: sendItem(item):
  - confirmed === true 필수
  - total = rent + mgmt + elec + gas + water + cable + prevUnpaid + lateFee + asRepair
  - addBilling(building, room, name, detail, total)
  - "발송완료" 마킹
```

**AS 수리비 연동:** `asRepairByRoom`에서 status='완료' + paid='유상' 항목이 청구에 포함

---

### 3단계: 계좌 분배 (getBillingSlots)

**건물/호실별로 청구금이 어느 계좌로 가는지 결정:**

```typescript
getBillingSlots(tenant, buildingAccounts, allBuildings) → Array<{ label, amount }>
```

**우선순위:** 통합관리대장 업로드 데이터 > 자동 계산

**모드별 분배:**

| 모드 | 슬롯 구성 | 사용 예 |
|------|-----------|---------|
| `houseman` | ① 임대료+관리비 (HM 계좌) | HM이 전액 수금 |
| `hm_owner1` | ① 임대료+관리비 (HM 계좌) | HM 우선, 건물주 보조 |
| `owner1` | ① 임대료 (건물주) + ② 관리비 (HM) | 임대료/관리비 분리 |
| `owner2` | ① 임대료+관리비 (건물주) | 건물주 전액 수금 |
| `gs2a` | ① 임대료 + ② 관리비 (분리) | GS 연동 |
| `gs2b` | ① 임대료+관리비 + ② (더미) | GS 연동 |
| `gs3` | ① 임대료 + ② 관리비 + ③ 공과금 | 3분할 |

**건물별 계좌 매핑:**
```typescript
buildingAccountMap = {
  스타빌: {
    mode1: "owner1",  // 단기: 임대료→건물주, 관리비→HM
    mode2: "houseman"  // 일반: 전액→HM
  },
  _houseman: { bank: '하나', account: '225-910048-15704', holder: '박종호(하우스맨)' }
}
```

**단일계좌 판별:**
```typescript
const singleAcctModes = new Set(["houseman", "hm_owner1"]);
// 이 모드들은 rent+mgmt를 하나의 슬롯으로 합침
```

---

### 4단계: 수금 확인 (CollectionPage)

**어디서:** CollectionPage — 납부일 이후 매일

**수금 상태 추적:**
- `roomBalances[building_room]` — 미납 잔액 (외부에서 관리, CollectionPage는 읽기만)
- `getDaysSinceDue(tenant)` — 납부기한 초과 일수

**테이블 컬럼:**
```
조치 | 건물 | 호수 | 이름 | 연락처 | 만기일 | 예치금 | 월세 | 관리비 | 미납 | 납부일 | 청구① | 청구② | 청구③ | 연체료
```

**필터 (6가지):**
- 전체: balance > 0 AND days ≥ 0
- 연체: days ≥ 0 AND balance > 0
- 확인/차단/해제: electricCut 상태별

**정렬 (2가지):**
- 연체일순: getDaysSinceDue 내림차순
- 위험도순: `risk = overdueDays - (paidAmount / dailyRate)` — 연체일 많고 납부 적을수록 위험

**담당자 배정:**
- `collectionAssigneeMap[building]` — 건물별 수금 담당 직원
- 필터로 담당자별 조회

---

## 시나리오 7: 연체 처리

### 연체 감지 (getBillingStatus)

```typescript
const getBillingStatus = (r, roomBalances) => {
  const balance = roomBalances[`${r.building}_${r.room}`] || 0;
  if (balance <= 0) return { label: "정상", days: 0, balance: 0 };

  // 월세일 = 입주일의 day, 없으면 due에서 추출
  const rentDay = r.moveIn ? new Date(r.moveIn).getDate() : 1;
  const diffDays = today - rentDate;  // 월세일 기준 경과 일수

  if (diffDays <= 0) return { label: "청구", days: 0, balance };
  return { label: `연체${diffDays}일`, days: diffDays, balance };
};
```

**상태 3가지:**
| 상태 | 조건 | UI |
|------|------|-----|
| 정상 | balance ≤ 0 | 녹색 배지 |
| 청구 | balance > 0, 납부기한 전 | 파란 배지 |
| 연체{N}일 | balance > 0, 납부기한 후 N일 | 빨간 배지 |

**핵심 규칙:** 청구 발생 이후에만 미납 판정 — roomBalances 기반. 청구된 잔액이 없으면 미납 아님.

---

### 연체수수료 계산 (getLateFee)

```typescript
const getLateFee = (r, roomBalances, lateFeeOverrides) => {
  const bs = getBillingStatus(r, roomBalances);
  if (bs.days < 5) return 0;                              // 5일 미만: 수수료 없음
  if (getRoomType(r.building, r.room) !== "단기") return 0; // 단기만 적용

  const override = lateFeeOverrides[`${r.building}_${r.room}`];
  if (override?.type === "exclude") return 0;               // 제외 처리됨

  const baseFee = Math.round((r.rent || 0) * 0.05);        // 월세의 5%
  if (override?.type === "discount")
    return Math.max(0, baseFee - (override.amount || 0));   // 할인 적용
  return baseFee;
};
```

**연체수수료 규칙:**
- **적용 대상:** 단기 호실만 (일반임대/근생은 적용 안 함)
- **시작 시점:** 납부일로부터 5일 초과 (1~4일은 유예)
- **요율:** 월세의 5% (고정)
- **반올림:** Math.round (10원 절사 아님)
- **오버라이드:** 수금관리에서 제외/할인 가능
  - `exclude`: 연체수수료 0원
  - `discount`: baseFee - amount (최소 0)

---

### 10원 단위 절사 규칙 (truncate10)

```typescript
export const truncate10 = (amount: number): number => Math.floor(amount / 10) * 10;
```

- **적용 대상:** 공과금 계산에만 (전기/가스/수도/케이블)
- **미적용:** 연체수수료, 일할계산, 수수료 — 이들은 Math.round 사용

---

## 시나리오 8: 건물주 정산

### 정산 방식 4종

| 유형 | 코드 | 설명 | 계산 |
|------|------|------|------|
| A (퍼센트형) | `feeType: 'pct'` | 임대료의 N% = HM 수수료 | rent × feeRate |
| S (월급형) | `feeType: 'salary'` | 건물주 → HM 고정 월급 | 고정금액 + 부가항목 |
| F (월정액형) | `feeType: 'fixed'` | 하이브리드 (고정+퍼센트) | 고정금 + rent × % |
| D (수금형) | `feeType: 'collection'` | 관리비 수금 - 비용 = HM 몫 | (호수 × 단가) - 비용 |

---

### 건물별 정산 설정 (settlementMaster)

**55개+ 건물 설정. 주요 건물:**

| 건물 | 유형 | 수수료율 | VAT | 정산일 | 정산기간 | 특이사항 |
|------|------|---------|-----|--------|---------|---------|
| 제이앤제이 | A | 0% | X | 15일 | mid (15일~14일) | 수수료 없음 |
| 스타빌 | A | 5% | X | 말일 | month | |
| 아페이론 | A | 5% | O | 말일 | month | |
| 다존하우스 | A | 10% | O | 말일 | month | 관리비 제외 (월세만) |
| 포유빌 | A | 6% | O | 2회 | month | frequency: 'twice' |
| 미래홈 | A | 10% | O | 말일 | month | |
| 메종빌 | A | 6% | X | 2회 | month | |
| 모닝빌 | A | 6.3% | O | 말일 | custom (20일~말일) | |
| 와이원빈티지 | A | 6% | X | 말일 | month | 건물주 직접 계좌 |
| 모던하우스 | A | 9% | X | 말일 | month | 건물주 직접 계좌 |
| 신림프리미어 | S | 150만원 | O | 말일 | month | 월급형 |
| 우영빌딩 | S | 60만원+α | O | 말일 | month | 부가항목 있음 |
| 제이드하우스 | F | 110만원 | X | 말일 | month | 고정형 |
| 더힐하우스 | D | 9만/호 | X | 말일 | month | 수금형 |

**특수 플래그:**
- `dualAccount: true` — 정산을 2개 계좌로 분할 (포유빌, 지앤지2 등)
- `accountType: 'owner'` — 임대료가 건물주 계좌로 직접 (와이원빈티지, 굿모닝빌 등)
- `includeMgmt: false` — 수수료 계산에서 관리비 제외 (다존하우스)
- `moveoutOwnerBurden: true` — 퇴실 비용 건물주 부담 (굿모닝빌)
- `vatMode: 'end_of_month_only'` — VAT 말일에만 반영 (토브미하우스)
- `frequency: 'twice'` — 월 2회 정산 (포유빌, 메종빌 등)

---

### 정산기간 유형 3종

```typescript
getSettlementPeriod(building, year, month):

// (1) month (기본): 1일 ~ 말일
start: month/01, end: month/lastDay

// (2) mid (15일 정산): 전월 15일 ~ 당월 14일
start: prevMonth/15, end: currentMonth/14

// (3) custom: 전월 20일 ~ 전월 말일 (모닝빌)
start: prevMonth/20, end: prevMonth/lastDay
```

---

### 정산 계산 흐름 (SettlementPage)

#### Step 1: 호실별 월세 정산

```
각 활성 임차인:
  room rent → calcFee(rent, building) = rent × feeRate
  settlement = rent - fee
  management = (cfg.includeMgmt ? mgmt : 0)
```

#### Step 2: 입주 정산

```
신규 입주자:
  deposit 수령
  brokerage (중개수수료) 공제
```

#### Step 3: 퇴실 정산

```
퇴실자 (pastTenantsData에서):
  rentProRata = rent × (usedDays / totalDays)
  mgmtProRata = mgmt × (usedDays / totalDays)
  fee = calcFee(rentProRata, building)
  settleAmount = rentProRata - fee

  공제:
  - cleanFee (청소비)
  - elec/gas/water reading (검침료)
  - damageFee (훼손료)
  - penalty7 (위약금)

  Deposit return = deposit - deductions
```

#### Step 4: 비용 공제 (settlementExpenses)

```
카테고리:
  mgmtFee (관리수수료) — auto 계산
  repair (수선비) — 수동 입력
  utility (공과금-공용) — 수동 입력
  cleaning (청소비) — 수동 입력
  insurance (보험료) — 수동 입력
  elevator (승강기 유지비) — 수동 입력
  other (기타 지출) — 수동 입력
```

#### Step 5: 최종 정산 계산

**퍼센트형 (Type A):**
```
subtotal = totalRentSettlement + totalMgmtSettlement
         + totalMoveOutRent + totalPenalty
         - allBrokerage - totalDepositReturn - totalDeduction

VAT (cfg.vat = true):
  supply = Math.round(subtotal / 1.1)
  tax = subtotal - supply

finalAmount = cfg.vat ? supply + tax : subtotal
```

**월급형 (Type S):**
```
subItemsTotal = sum(cfg.subItems)  // 청소비, 승강기, 소방 등
subtotal = feeAmount + subItemsTotal + totalDeduction

VAT:
  vatBase = feeAmount + subItemsTotal
  supply = Math.round(vatBase / 1.1)
  tax = vatBase - supply

finalAmount = feeAmount + subItemsTotal + totalDeduction
```

**수금형 (Type D):**
```
collected = tenantCount × mgmtFeePerUnit
costsTotal = sum(cfg.costItems)
finalAmount = collected - costsTotal - totalDeduction
```

---

### VAT 계산 (역산 방식)

```typescript
calcVat(amount, building):
  if (!cfg.vat) return { supply: amount, tax: 0, total: amount };
  supply = Math.round(amount / 1.1);
  tax = amount - supply;
  return { supply, tax, total: amount };
```

- **VAT 적용 건물:** 아페이론, 다존하우스, 포유빌, 미래홈, 리트코하우스, 모닝빌, 토브미하우스
- **VAT 미적용:** 제이앤제이, 스타빌, 메종빌, 에덴빌, 지앤지2, 서우하우스 등

---

### 수수료 계산 (calcFee)

```typescript
calcFee(rent, building):
  cfg = settlementMaster[building];
  if (!cfg) return 0;
  if (feeType in ['salary', 'fixed', 'collection', 'none']) return 0;
  return Math.round(rent * (cfg.feeRate || 0));
```

- **퍼센트형만 수수료 계산** (salary/fixed/collection은 별도 체계)
- 건물별 수수료율: 0% ~ 10%

---

### 일할계산 (calcProRata)

```typescript
calcProRata(rent, moveOutDay, rentDay, year, month):
  totalDays = 해당 월 총 일수
  residenceDays = moveOutDay - (rentDay || 1) + 1  // 양 끝 포함
  if (residenceDays <= 0 || residenceDays >= totalDays) return rent;
  return Math.round((rent * residenceDays) / totalDays);
```

- **양 끝 포함** (inclusive): 시작일과 종료일 모두 포함
- **경계 조건:** 0일 이하 또는 전체일수 이상이면 전액 반환
- **반올림:** Math.round (절사 아님)

---

### 정산서 출력 (SettlementPrintView)

**정산서 구성:**

| 영역 | 내용 |
|------|------|
| 좌상 | 건물 주소, 정산계좌, 정산기간, 입주/퇴실 수 |
| 우상 | ① 월세 정산 ② 퇴실 일할 정산 ③ 입주 중개수수료(-) ④ 보증금 반환(-) ⑤ 위약금(+) ⑥ 공제(-) → **최종 정산금** |
| 하단 테이블 1 | 호실별 월세 정산: 호실, 상태, 임차인, 입주일, 보증금, 월세, 납부일, 수수료%, 정산금 |
| 하단 테이블 2 | 입주 정산: 호실, 임차인, 입주일, 보증금, 중개수수료 |
| 하단 테이블 3 | 퇴실 정산: 호실, 임차인, 퇴실일, 일할 임대/관리, 공제내역, 보증금 반환, 최종환불 |

---

### 출납장 연동 (CashBookPage)

**정산 → 출납 흐름:**
1. SettlementPage에서 "출납 등록" 클릭
2. CashBookPage에 자동 등록:
```javascript
{
  type: 'settlement',
  sourceId: `settlement_{building}_{month}`,
  direction: 'income' | 'expense',
  amount: finalAmount,
  description: `{month} 건물주 정산 ({typeLabel})`,
  status: '대기'
}
```

**출납 상태 관리:**
- 대기 → 완료 (송금완료)
- 대기 → 보류 (보류)
- 보류 → 대기 (복원)

**정산 타임라인:**
- 건물별 정산일 기준 정렬
- 3일 이내: urgent (긴급)
- 7일 이내: soon (임박)
- 공휴일/주말 보정 (2025~2027 한국 공휴일 하드코딩)

---

## 핵심 비즈니스 규칙 요약

### 금액 처리 규칙

| 계산 항목 | 반올림 방식 | 적용 |
|-----------|------------|------|
| 공과금 (전기/가스/수도/케이블) | `truncate10()` — 10원 절사 | billingMaster |
| 연체수수료 | `Math.round()` | getLateFee |
| 일할계산 | `Math.round()` | calcProRata |
| 수수료 | `Math.round()` | calcFee |
| VAT 역산 | `Math.round(amount / 1.1)` | calcVat |

### 연체 규칙

| 규칙 | 값 | 비고 |
|------|-----|------|
| 연체 시작 | 납부일 당일 | diffDays ≥ 0 |
| 연체수수료 시작 | 5일 초과 | days > 5 (not ≥ 5) |
| 연체수수료율 | 월세의 5% | 고정, 일별 누적 아님 |
| 적용 대상 | 단기 호실만 | 일반임대/근생 미적용 |
| 오버라이드 | exclude/discount | 수금관리에서 설정 |

### 정산 규칙

| 규칙 | 값 | 비고 |
|------|-----|------|
| 정산 빈도 | 월 1회 또는 2회 | 건물별 다름 |
| 정산기간 | month/mid/custom | 건물별 다름 |
| 수수료율 | 0% ~ 10% | 건물별 다름 |
| VAT | 건물별 적용/미적용 | 역산 방식 |
| 비용 공제 | 7개 카테고리 | 수동 입력 |

### 데이터 흐름 요약

```
┌─ billingConfig (검침 데이터) ──→ UtilityBillingPage (청구 생성)
│                                       ↓
│                               roomBalances 업데이트
│                                       ↓
├─ roomBalances ──────────────→ CollectionPage (수금 추적)
│                                       ↓
│                               getBillingStatus (연체 감지)
│                               getLateFee (연체수수료)
│                                       ↓
├─ activeTenants ─────────────→ SettlementPage (건물주 정산)
├─ pastTenantsData ───────────→   └─ 퇴실 일할계산
├─ settlementExpenses ────────→   └─ 비용 공제
├─ settlementMaster ──────────→   └─ 수수료/VAT 계산
│                                       ↓
└─ CashBookPage (출납 관리) ←── 정산 결과 등록
                                  └─ 대기/완료/보류 상태 관리
```

---

## 검증 방법

코드 읽기 전용 분석이므로 실행 검증 불필요. 다음 작업에서 활용:
1. 백엔드 BillingService 설계 시 계산 공식 참조
2. 도메인 엔티티(Settlement, Billing, Collection) 필드 목록으로 활용
3. billingMaster.ts → BillingService.kt 포팅 시 1:1 대응 확인용
4. E2E 테스트 시나리오: 청구생성 → 수금확인 → 연체감지 → 정산서생성 → 출납등록
