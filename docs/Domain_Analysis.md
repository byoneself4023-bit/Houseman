# Domain Analysis — 도메인 계산식 + 7대 갭 + 실 코드 매핑

> 본 문서 = 도메인 본질 분석. 8명 운영 부동산 관리 SaaS (단기 / 일반임대 / 근생 / 관리사무소 / 기업시설 5 유형 통합).
> Ontology 의미 관계 위에 계산식 + 갭 + 실 코드 매핑 3축 정리.
>
> Cross-link:
> - `docs/Ontology.md §[3]` (룰 11건 = 본 문서 계산식 source)
> - `docs/Apply.md §[1]` (Critical 3건 = 본 문서 7대 갭의 1·2·3순위)
> - `docs/Mapping.md` (실 코드 매핑 = 본 문서 §[6] 실 코드 영역)

---

## §[1] 정산 계산식 — Settlement 5 타입

`Ontology.md §[1]` Settlement 본문 → 5 타입별 계산식:

| 타입 | 정의 | 계산식 | 적용 건물 |
|---|---|---|---|
| **A (퍼센트)** | 수입 % | `정산금 = (rent + mgmt + utility) × feeRate` | 단기 / 일반임대 (대다수) |
| **S (월급)** | 고정 월급 | `정산금 = staff.salary` | 관리사무소 (직원 1인 배치) |
| **F (고정액)** | 고정 금액 | `정산금 = building.fixedFee` | 기업시설 (단가 계약) |
| **D (수금)** | 실 수금 기준 | `정산금 = collected × feeRate` (paid_amount 합산) | 단기 (수금 변동성) |
| **X (없음)** | 정산 없음 | `정산금 = 0` | 근생 (직접 운영) |

**핵심**: D 타입(수금)은 `Transaction.pays_for(BillingRecord)` 관계의 `paid_amount` 컬럼 직접 합산. C1-a 이전엔 운영자 수동 산정, C1-a 이후 자동.

실 코드: `OwnerSettlementService.calculate` (`BE/.../service/OwnerSettlementService.kt:30`).

---

## §[2] 연체료 계산식 — LateFee (단기만)

`Ontology.md §[3]` `lateFee` / `noLateFee` 룰:

| 케이스 | 식 |
|---|---|
| 단기 + overdueDays > 5 | `fee = rent × 0.05` (rule lateFee) |
| 일반 / 근생 | `fee = 0` (rule noLateFee) |
| 단기 + 조기퇴실 | `penalty = 7일 임대료 + 중개수수료` (rule shortPenalty) |

**일할 계산** (월 중간 입주/퇴실):
```
일할 = (rent + mgmt) × usedDays / monthDays
```
`Math.round` 적용 (rule roundingRound).

실 코드:
- `LateFeeOverrideService.kt` — 단기 연체료 수동 override (운영자 1회성 면제 케이스)
- `OverdueCheckScheduler.kt` (`BE/.../infra/scheduling/`) — 매일 09:00 연체 감지, SSE `OVERDUE_ALERT` 발행

---

## §[3] 청구 계산식 — BillingRecord

`Ontology.md §[4].5 billing_cycle` workflow:

```
BillingRecord.total = rent + mgmt + utility + lateFee + adjustments
                       (모든 부분 Math.round 후 합산)
utility = electricity + gas + water + 기타
electricity = ElectricityRateService.calculate(usage)  // 한전 누진 3구간
```

**한전 누진 3구간** (실 코드 `ElectricityRateService.calculate:25`):
| 구간 | 사용량 | 단가 |
|---|---|---|
| 1구간 | 0 ~ 200 kWh | 기본요금 + kWh당 단가1 |
| 2구간 | 201 ~ 400 kWh | 1구간 + 초과 kWh × 단가2 |
| 3구간 | 401+ kWh | 1+2구간 + 초과 kWh × 단가3 |

**VAT 역산** (rule vatReverse, 건물 옵션):
```
total_without_vat = Math.round(total / 1.1)
vat = total - total_without_vat
```

실 코드:
- `BillingService.generate` (`BE/.../service/BillingService.kt:52`) — 청구서 생성 (전체 진입점)
- `BillingCalculationService` — 항목별 계산 (분리)
- `MeterReadingService` — 검침 데이터 입력 (utility 입력 source)

---

## §[4] 매칭 계산식 — pays_for 관계 (C1)

C1-b `BillingService.retroFitPayments:200` 본문 매칭 룰:

```
매칭 = transaction.room_id == billingRecord.room.id
       && transaction.date.year == billingRecord.periodYear
       && transaction.date.month == billingRecord.periodMonth
       && transaction.type == '입금'  (한글 literal, INFLOW X)
```

**잔액 계산** (멱등성 보장):
```
residual = SUM(matching_transactions.amount) - billingRecord.paidAmount
if residual <= 0: skip (이미 충분)
else:
  markPaid(billingRecord.id, residual)
  newPaidAmount = paidAmount + residual
  status = (newPaidAmount >= total) ? PAID : PARTIAL
```

**핵심 제약**:
- Transaction 엔티티에 `billingId` FK 0 (기존 데이터 호환성 — C1-b 결정)
- 매칭 키 = room + 기간 + type (4 필드 조합)
- markPaid 시그니처 `(billingId, paymentAmount)` 재호출 — 시그니처 수정 0

실 코드:
- `BillingService.markPaid:147` — paymentAmount 받아 paidAmount 누적 + 상태 전이
- `BillingService.retroFitPayments:200` — SENT/PARTIAL 일괄 매칭 + markPaid 호출

---

## §[5] 7대 갭 (도메인 본질 결함)

운영 실 데이터 + 카드 진행 누적에서 드러난 영역:

| # | 갭 | 설명 | 영향 카드 |
|---|---|---|---|
| **1** | **C1 입금 ↔ 청구 paid 단절** | `Transaction.pays_for(BillingRecord)` 관계 부재 → 운영자 수동 매핑 → 정산 D 타입 자동화 불가 | **C1-a / C1-b / C1-c** (master 진입 완료) |
| **2** | **C2 public link 무인증** | MoveOutLinkController JWT/TTL 0 → 링크 유출 시 외부 무제한 접근 | **C2** (미시작) |
| **3** | **C3 퇴실 정산 BE 엔진 부재** | ExitSettlementCalculator 미포팅 → FE billingEngine.js에서 계산 → BE 계산 정합 검증 불가 | **C3** (미시작, Mapping.md #10) |
| 4 | A4 매칭 룰 정식화 부재 | room + period + INFLOW 매칭 룰이 retroFitPayments 본문에만 존재 → 표준 docs/API 명세 X | A4 (Phase 1 병렬) |
| 5 | ContractStatusService 분산 | 상태 전환 로직 ContractService 내부 메소드로 분산 → 단일 상태 머신 X | A5+C1 (Mapping.md #13 미포팅) |
| 6 | BillingTextParser 미포팅 | KT/SKT 문자 → BillingRecord 자동 변환 부재 → 운영자 수동 입력 | A8 (Mapping.md #9 미포팅) |
| 7 | RuleEngine 미포팅 | 건물별 보증금 룰 / 옵션 항목 / 특수 정산 룰 분기 분산 | C5 (Mapping.md #12 미포팅) |

**Critical 3건** (C1/C2/C3) = `docs/Apply.md §[1]` 단일 진실. 갭 4~7 = 일반 영역 (회귀 차단 대상은 C1~C3만).

---

## §[6] 실 코드 매핑

### §[6].1 포팅 완료 (10건 — 재구현 금지)

`docs/Mapping.md` 완료 10건 중 도메인 영역:

| 자산 | 현재 경로 | 역할 |
|---|---|---|
| BillingService | `BE/.../service/BillingService.kt` | 청구 생성 + markPaid + retroFitPayments |
| ElectricityRateService | `BE/.../service/ElectricityRateService.kt` | 한전 누진 3구간 |
| OverdueCheckScheduler | `BE/.../infra/scheduling/OverdueCheckScheduler.kt` | 매일 09:00 연체 감지 |
| SseEmitterManager | `BE/.../global/sse/SseEmitterManager.kt` | 실시간 알림 (OVERDUE_ALERT 등) |

### §[6].2 포팅 대기 (4건 — Critical 직결)

| 자산 | 직결 Critical | 비고 |
|---|---|---|
| **ExitSettlementCalculator** | **C3** | Phase 1→2 게이트 5조건 (`Apply.md §[4]`) |
| **ContractStatusService** | **C1** + A5 | `pays_for` 관계 구현 시 상태 머신 통합 필요 |
| BillingTextParser | (없음, A8 편의) | KT/SKT 문자 자동 파싱 |
| RuleEngine | (없음, C5) | 건물별 특수 룰 |

---

## §[7] 도메인 영역별 절대 금지 (CLAUDE.md 도메인 카테고리)

- **정산/연체/청구/일할 계산식 수정 0** — Ontology §[3] 룰 11건 본문 + §[1]~§[4] 계산식
- **config 파일 수정 0** — `billingMaster.js` / `billingConfig.js` / `buildingFloors.ts` / `roomMasterData.js`
- **포팅 완료 10건 재구현 0** — `docs/Mapping.md` 완료 표 참조
- **vacantConfirm 도달 전 퇴실 이벤트 자동 삭제 0** — Ontology §[4].3 moveout_short

위반 시 `scripts/critical-rules-check.sh` 자동 차단 (검사 3 = TransactionService↔BillingRecord / 검사 5 = ContractService.moveOut↔vacantConfirmed). 상세: `docs/Hooks.md §[2]`.
