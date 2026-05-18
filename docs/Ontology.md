# Ontology — 도메인 의미 그래프

> **Source of Truth**: `src/data/domainOntology.ts` (161줄, 코드).
> 본 문서 = ts 본문 1:1 markdown 변환. **변경 시 동시 갱신 영구 룰** — ts ↔ md 어느 한쪽만 수정 금지.
> 의미 관계 신규/수정 시 카드 산출물에 두 파일 모두 포함 (예: C1-a — `pays_for` 관계 추가 시 ts + md 동시).
>
> Cross-link:
> - `docs/Mapping.md` (포팅 자산 의미 매핑 — BillingService / ExitSettlementCalculator 등 의미 관계 구현 코드 추적)
> - `docs/Domain_Analysis.md` (의미 관계 위 도메인 계산식 — 정산 / 연체 / 청구 / 매칭)
> - `docs/Apply.md §[1]` (Critical 3건 — C1 `pays_for` 본질 정의)

---

## §[1] Entities (5 노드)

`src/data/domainOntology.ts` L33~52 `entities` 본문.

| name | types | properties | statuses |
|---|---|---|---|
| **Building** | 단기 / 일반임대 / 근생 / 관리사무소 / 기업시설 | name, address, owner, feeType, feeRate, entranceDoorPassword | — |
| **Room** | — | deposit, rent, mgmt, type, status | — |
| **Tenant** | 단기 / 일반 / 근생 | name, phone, moveIn, expiry, rent, mgmt, deposit | 정상 / 연체 |
| **Contract** | — | building, room, deposit, rent, broker, moveIn, expiry | — |
| **Settlement** | A(퍼센트) / S(월급) / F(고정액) / D(수금) / X(없음) | — | — |

추가 노드 (`relationships` 표에서 등장하나 entities 정의 없음 — 암묵 노드):
- **Owner** (Building.owned_by 대상)
- **LateFee** (Tenant.overdue 대상)
- **Transaction** (pays_for 주체) ← C1-a 도입
- **BillingRecord** (pays_for 대상) ← C1-a 도입

본 5개가 운영자 사고 단위. Transaction / BillingRecord는 BE-only 엔티티 (C1-a 시점 진입).

---

## §[2] Relationships (7 관계)

`src/data/domainOntology.ts` L54~65 `relationships` 본문.

| from | relation | to | 의미 |
|---|---|---|---|
| Building | has_rooms | Room[] | 건물 내 호실 목록 |
| Room | occupied_by | Tenant \| null | 호실 점유 임차인 (null = 공실) |
| Tenant | has_contract | Contract | 임차인의 계약 |
| Building | settlement_type | A \| S \| F \| D \| X | 건물별 정산 유형 (정산식 분기) |
| Building | owned_by | Owner[] | 건물주 (다중 소유 가능) |
| Tenant | overdue | LateFee (단기만 적용) | 연체료 (단기 임차인만 적용, 일반/근생 X) |
| **Transaction** | **pays_for** | **BillingRecord** | **입금 ↔ 청구 결제 관계 (C1-a 도입, 본질)**[^1] |

[^1]: **pays_for = C1 Critical 본질**. C1-a (master `8a70be9`) 시점 BillingService.markPaid + V12 마이그레이션 (paid_amount / paid_at 컬럼) + DB CHECK 제약으로 정식화. SENT → PARTIAL/PAID 자동 전이. 주체 = Transaction (실 거래 이벤트), Tenant는 결제 의지 보유자 (별개 관계, 후속 카드 영역). 운영 누적 데이터는 C1-b (`152b308`) retroFitPayments로 백필. 상세: `docs/Apply.md §[1] C1`.

---

## §[3] Rules (11 룰)

`src/data/domainOntology.ts` L113~125 `rules` 본문.

| id | condition | action | description |
|---|---|---|---|
| **lateFee** | `tenant.type == 단기 && overdueDays > 5` | `fee = rent * 0.05` | 단기 연체 6일째부터 월세 5% 수수료 |
| **noLateFee** | `tenant.type == 일반 \|\| tenant.type == 근생` | `fee = 0` | 일반/근생 연체수수료 없음 |
| **shortPenalty** | `moveOut.beforeExpiry && tenant.type == 단기` | `penalty = 7일 임대료 + 중개수수료` | 단기 조기퇴실 위약금 |
| **settlementCalc** | `moveOut` | `최종정산 = 보증금 + 환불금액 - 공제금액` | 퇴실 정산 공식 |
| **roundingFloor10** | `공과금 계산` | `Math.floor(x/10)*10` | 공과금 10원 단위 절사 |
| **roundingRound** | `수수료/연체/일할` | `Math.round` | 수수료 반올림 |
| **vatReverse** | `building.vatApplied` | `Math.round(total/1.1)` | VAT 역산 |
| **rec_expiryAlert** | `tenant.expiry <= 7days` | `recommend("갱신 여부 확인")` | 만기 7일 이내 계약 갱신 확인 권장 |
| **rec_overdueAlert** | `tenant.type == 단기 && overdueDays >= 5` | `recommend("독촉 문자 발송")` | 단기 연체 5일 이상 독촉 권장 |
| **rec_moveoutToday** | `event.type == 퇴실 && event.date == today` | `recommend("퇴실체크 진행")` | 오늘 퇴실 예정 확인 |
| **rec_longVacancy** | `vacancy.days >= 30` | `recommend("홍보 방법 변경")` | 장기 공실 30일 이상 홍보 전략 검토 |

룰 카테고리:
- **계산식** (4건): lateFee / noLateFee / shortPenalty / settlementCalc → `docs/Domain_Analysis.md §[1]~§[2]` 정산/연체 식 본문
- **반올림** (3건): roundingFloor10 / roundingRound / vatReverse → 청구 금액 처리
- **권장 (rec_*)** (4건): expiryAlert / overdueAlert / moveoutToday / longVacancy → 운영자 알림 (현재는 FE 권장 로직, BE 자동화 미구현)

---

## §[4] Workflows (5 그룹)

`src/data/domainOntology.ts` L67~111 `workflows` 본문.

### §[4].1 lifecycle (전체 사이클)

```
공실 → 계약(선행: vacant) → 입주(선행: contract)
     → 매월 청구/수금(선행: moveIn) → 퇴실(선행: moveIn)
     → 정산(선행: moveOut) → 다시 공실
```

### §[4].2 contract_steps (계약 워크플로우)

| id | name | requires |
|---|---|---|
| depositConfirm | 계약금확인 | — |
| ownerReport | 건물주보고 | depositConfirm |
| balanceConfirm | 잔금확인 | ownerReport |
| contractEntry | 계약서입력 | ownerReport |
| finalPayment | 최종납부 | balanceConfirm |
| interior | 인테리어 | — |
| brokerFee | 중개료송금 | — |

### §[4].3 moveout_short (퇴실 — 단기)

| id | name | requires |
|---|---|---|
| moveOutLink | 퇴실링크 | — |
| externalCheck | 퇴실체크 | moveOutLink |
| settlement | 정산서 | externalCheck |
| cleaning | 청소 | — |
| moveInPhoto | 입주체크사진 | cleaning |
| **vacantConfirm** | **공실전환** | **settlement, moveInPhoto** |

**핵심**: `vacantConfirm`(공실전환) 도달 전까지 퇴실 이벤트 절대 자동 삭제 금지 (CLAUDE.md #11 + critical-rules-check.sh 검사 5).

### §[4].4 moveout_normal (퇴실 — 일반/근생)

| id | name | requires |
|---|---|---|
| moveOutMsg | 퇴실문자 | — |
| password | 비밀번호 | — |
| moveOutPhoto | 퇴실사진 | — |
| settlement | 정산서 | — |
| ownerContact | 건물주연락 | settlement |
| moveInPhoto | 입주체크사진 | — |

### §[4].5 billing_cycle (월별 청구)

| id | name | requires |
|---|---|---|
| utilityInput | 공과금 데이터 입력 | — |
| invoiceGenerate | 청구서 생성+발송 | utilityInput |
| accountDistribute | 계좌 분배 | invoiceGenerate |
| collectionCheck | 수금 확인 | accountDistribute |

`collectionCheck` 단계가 **C1 영역** — `Transaction.pays_for(BillingRecord)` 관계로 자동화 진입.

---

## §[5] 수치 요약 (AGENTS.md §11 정합 source)

| 카테고리 | 개수 | 본문 |
|---|---|---|
| Entities (정의 노드) | **5** | Building / Room / Tenant / Contract / Settlement |
| Entities (암묵 노드) | 4 | Owner / LateFee / Transaction / BillingRecord (relationships 등장) |
| Relationships | **7** | has_rooms / occupied_by / has_contract / settlement_type / owned_by / overdue / **pays_for** |
| Rules | **11** | 계산식 4 + 반올림 3 + 권장 4 |
| Workflows (그룹) | **5** | lifecycle / contract_steps / moveout_short / moveout_normal / billing_cycle |

AGENTS.md §11 인용 정합: **"5 노드 + 7 관계 + 11 룰 + 5 워크플로우"** (이전 "16/11/6" 오기 정정 — D1-Infra 카드).

---

## §[6] 영구 룰 (변경 절차)

1. **ts 변경** → 같은 PR에서 **md 동시 변경** (1 카드 = 1 commit 정합)
2. md 본문 카운트 (Entities/Relationships/Rules/Workflows) 변경 시 **AGENTS.md §11 + §[5] 수치 요약 동반 갱신**
3. `pays_for` 등 Critical 관계 변경 시 `docs/Apply.md §[1] Critical 3건` 영역 동반 점검
4. 신규 관계 추가 시 의미 관계 footnote 영역에 도입 카드명 + commit hash 명시 (예: `pays_for` 도입 = C1-a `8a70be9`)
