# 도메인 워크플로우 추출 — Part 1: 계약 + 퇴실

## Context

CEO 코드(`origin/refactor/architecture`)의 CalendarPage(2668줄)와 TenantsPage(2939줄)에서 계약(입주)과 퇴실 워크플로우의 전체 흐름을 추출한다. 현장 시나리오 형태로 정리하여 백엔드 API 설계 및 도메인 모델링의 기초 자료로 사용한다.

---

## 시나리오 1: 신규 임차인 입주 (공실 → 계약 → 입주)

### 1단계: 공실 선택 + 계약 이벤트 생성 (CalendarPage)

**어디서:** CalendarPage 계약등록 영역 (lines 344-533)
**누가:** 직원 (currentStaff)

**흐름:**
1. 직원이 "홍보중" 상태의 공실 목록에서 호실 클릭 → `selectedVacancy` 설정
2. 공실 정보(sv)가 계약 폼에 자동 pre-fill
3. 직원이 부동산 정보, 입주일, 만기일 등을 입력/수정
4. "계약등록" 클릭

**입력 필드:**
- `formDate` (입주일) — **필수**
- `brokerPhone` (부동산 연락처) — **필수**
- `vacancyEdits.broker` (부동산명)
- `vacancyEdits.deposit/rent/nego/mgmt` (보증금/월세/네고/관리비) — 공실값이 기본
- `vacancyEdits.expiry` (만기일)
- 단기 전용: `waterFee`, `cable`, `exitFee`, `commBroker`

**선행 조건:**
- 입주일 필수: `if (!formDate) return alert("입주일을 선택하세요")`
- 부동산 연락처 필수: `if (!(vacancyEdits.brokerPhone || "").trim()) return alert("부동산 연락처를 입력하세요")`
- 기존 임차인 있으면 confirm: `"⚠️ ${building} ${room}호에 현재 임차인(${name})이 거주중입니다. 임차인연결로 진행하시겠습니까?"`

**생성되는 계약 이벤트 객체:**
```javascript
{
  date: formDate,
  type: "계약",
  building: sv.building,
  room: sv.room,
  name: "",
  color: TYPE_COLORS["계약"],
  registeredAt: "YYYY-MM-DD HH:mm",
  registeredBy: currentStaff.name,
  contractDate: todayStr,
  deposit, rent, nego, mgmt,           // 공실값 or 수정값
  broker, brokerPhone,
  moveIn: formDate,
  expiry: vacancyEdits.expiry,
  // 단기만:
  waterFee, cable, exitFee, commBroker,
  // Supabase 저장 후:
  supabaseId, source: 'supabase'
}
```

**후속 동작:**
1. Supabase `insertCalendarEvent(newEvt)` → supabaseId 획득
2. 공실 상태 변경: `"홍보중"` → `"계약서입력"`
3. 문자 발송 모달 오픈: `openSendModal(newEvt)` — 계약정보 문자

**문자 발송:**
4종의 문자 템플릿 제공:
- **기본**: 건물/호실/보증금/월세/관리비/입주일/만기일/부동산/담당
- **상세(단기포함)**: 위 + NEGO/수도/인터넷/퇴실청소비/중개수수료
- **간단**: "건물 호실호 / 보보증금/월월세/관관리비 / 입주 날짜"
- **건물 계약문자**: buildingData에 저장된 건물별 커스텀 템플릿 (fillBuildingContractMsg로 필드 치환)

---

### 2단계: 계약현황 체크리스트 (CalendarPage lines 1150-1346)

계약 이벤트가 생성되면 4단계 체크리스트 진행:

#### Step 2-1: 계약금확인 (depositConfirmed)
- **선행 조건:** 없음
- **동작:** `{ depositConfirmed: true }` 저장
- **UI:** 파란색 → 회색 + 취소선

#### Step 2-2: 건물주보고 (reported)
- **선행 조건:** `depositConfirmed === true` (아니면 alert: "계약금 확인이 완료되어야 건물주보고가 가능합니다")
- **동작:**
  1. `buildingData[building].owners`에서 건물주 정보 조회
  2. 보고 문자 생성:
  ```
  [건물 호실호 계약 보고]
  안녕하세요, OO건물주님.
  건물 호실호 계약이 진행되었습니다.
  ▪ 보증금: X만원
  ▪ 월세: X만원
  ▪ 관리비: X만원 (있으면)
  ▪ 입주일: YYYY-MM-DD
  ▪ 만기일: YYYY-MM-DD (있으면)
  ▪ 부동산: OO (있으면)
  감사합니다. - 하우스맨 드림
  ```
  3. SMS/카카오톡/복사 선택 모달 오픈
  4. 발송 후: `{ reported: true }` 저장
- **UI:** 보라색, 취소선

#### Step 2-3: 잔금확인 (balanceConfirmed)
- **선행 조건:** `reported === true` (아니면 alert: "건물주보고가 완료되어야 잔금확인이 가능합니다")
- **동작:** `{ balanceConfirmed: true }` 저장
- **UI:** 녹색, 취소선

#### Step 2-4: 계약서입력 (contractEntry → 페이지 전환)
- **선행 조건:** `reported === true` (아니면 alert: "건물주보고가 완료되어야 계약서입력이 가능합니다")
- **동작:**
  1. activeVacancies에서 building+room 매칭 공실 찾기
  2. `setPendingContract({ ...ev, vacancyData: vacancy || {} })` — 계약 이벤트 + 공실 데이터 전달
  3. 해당 계약 캘린더 이벤트 삭제 (Supabase + UI)
  4. `setPage("tenants")` — 임차인 페이지로 이동
- **UI:** 노란색, 취소선 없음

---

### 3단계: 임차인 등록 (TenantsPage lines 2507-2579)

**어디서:** TenantsPage — pendingContract 수신 시 자동 오픈되는 등록 폼

**pendingContract에서 넘어오는 데이터:**
- `building`, `room`, `deposit`, `rent`, `mgmt`, `moveIn`, `expiry`
- `broker`, `brokerPhone`, `contractDate`
- `contractFiles`
- `vacancyData` (공실 원본: moveInPhotos 포함)

**직원이 추가 입력하는 필드:**
- `name` (입주자명) — **필수**
- `phone` (연락처1) — **필수**, 패턴: `/^0\d{8,10}$/`
- `ssn` (주민등록번호) — **필수**
- `moveIn` (입주일) — **필수**
- `expiry` (만기일) — 입주일 이후여야 함
- `rentPayType` (월세 선불/후불)
- `mgmtPayType` (관리비 선불/후불)

**생성되는 임차인 객체:**
```javascript
{
  id: Date.now(),
  name, phone,
  building: pc.building,
  room: pc.room,
  rent: rent * 10000,           // 만원 → 원 변환
  mgmt: mgmt * 10000,
  deposit: deposit * 10000,
  type: roomType || "단기",
  due: "", status: "정상",
  overdue: 0, expiry,
  prevUnpaid: 0, currentUnpaid: 0, overdueDays: 0,
  rentPayType: "선불"/"후불",
  mgmtPayType: "선불"/"후불",
  contractFiles: pc.contractFiles || [],
  moveIn,
  moveInPhotos: pc.vacancyData?.moveInPhotos || [],
  moveInCheckPhotos: lastPast?.moveOutCheckPhotos || [],  // 이전 임차인 퇴실체크사진 승계
}
```

**비즈니스 규칙:**
- 동일 building+room에 기존 임차인 있으면 등록 차단: "이미 임차인이 입주 중입니다. 퇴실 처리 후 등록하세요."
- moveInCheckPhotos는 이전 임차인의 moveOutCheckPhotos를 자동 승계 (사진 체인)

---

## 시나리오 2: 임차인 퇴실 — 단기 (퇴실등록 → 링크 → 체크 → 정산 → 공실)

### 1단계: 퇴실 이벤트 생성 (CalendarPage lines 590-609)

**선행 조건:**
- 퇴실일 필수
- 건물+호실 필수
- 해당 호실에 임차인 존재 필수: "임차인이 있는 호실만 퇴실등록이 가능합니다."
- 해당 호실이 공실이 아닐 것: "공실에는 퇴실등록을 할 수 없습니다."

**생성되는 퇴실 이벤트:**
```javascript
{
  date: formDate,
  type: "퇴실",
  building: formBuilding,
  room: formRoom,
  name: "",
  color: TYPE_COLORS["퇴실"],
  registeredAt: "YYYY-MM-DD HH:mm",
  registeredBy: currentStaff.name,
}
```

**단기 판별:** `getRoomType(building, room) === "단기"` → `isShortTerm = true`

---

### 2단계: 퇴실링크 (moveOutLinkCompleted)

**3가지 경로 (CalendarPage lines 1411-1420):**

#### 경로 A: 퇴실링크 전송 (📩 다른번호로 보내기)
- **URL 형식:** `${window.location.origin}/move-out/${supabaseId}`
- **SMS 내용:** `[하우스맨] 건물 호실호 퇴실 안내\n\n아래 링크에서 비밀번호, 환불계좌를 입력해주세요.\n{link}`
- **임차인 입력 항목 (MoveOutLinkPage):**
  1. 호실 비밀번호 — **필수**
  2. 환불 은행 — **필수** (22개 은행 목록)
  3. 환불 계좌번호 — **필수**
  4. 예금주 — **필수**
  5. 주의사항 확인 체크박스 — **필수**
- **저장:** `calendar_events` 테이블에 `move_out_link_completed: true`, `door_password`, `refund_bank`, `refund_account`, `refund_holder` 저장

#### 경로 B: 직접입력 (✏️ DirectInputModal, lines 1707-1784)
- **용도:** 임차인이 링크 접근 불가 시 직원이 대신 입력
- **입력 필드:** 퇴실일시(date+time), 호실 비밀번호(**필수**), 환불은행, 계좌번호, 예금주
- **예금주 불일치 감지:** `holder !== tenantName` → `_holderMismatch: true` 플래그 설정
- **저장:** `{ moveOutLinkCompleted: true, moveOutLinkCompletedAt: "날짜 시간 (직접입력)", doorPassword, refundBank, refundAccount, refundHolder }`

#### 경로 C: 자동저장값 수정 (📝)
- 임차인이 링크에서 입력한 값을 직원이 수정 (prefill 모드)
- DirectInputModal과 동일 UI, 기존값 pre-fill

---

### 3단계: 퇴실체크 (ExternalCheckModal, lines 2315-2594)

**선행 조건:** `moveOutLinkCompleted === true` (아니면 alert: "퇴실링크 완료 후 진행 가능합니다.")

**4개 섹션:**

#### 섹션 1: 입주 시 사진 (참고용)
- `moveInCheckPhotos` 표시 (최대 12장 그리드)
- 클릭 시 확대 (줌/팬 지원)

#### 섹션 2: 퇴실사진 촬영/업로드
- `PhotoDropZone` 컴포넌트 (최대 50장)
- Supabase Storage 업로드: `uploadPhotos(photos, building, room, "move-out")`
- `tenants.move_out_photos`에 저장
- **필수:** 완료 시 1장 이상 없으면 alert: "퇴실사진을 1장 이상 업로드해주세요."

#### 섹션 3: 손상내역 / 공제금액
- 동적 행 (기본 3행, "+" 버튼으로 추가)
- 각 행: `label` (손상 내역) + `amount` (공제 금액, 원)
- 합계 실시간 표시
- → `deductionItems: Array<{ label: string, amount: number }>` 로 저장
- **정산서와 연동:** TenantsPage에서 `manOther` 필드로 매핑

#### 섹션 4: 퇴실 검침값 + 이슈 체크
- **검침값:** 전기(`meterElec`), 가스(`meterGas`) — 숫자 입력
- **이슈 체크리스트** (5항목, 다중선택):
  - 외부업체 수리 필요
  - 가구/설비 교체 필요
  - 도배/장판 필요
  - 누수/배관 이슈
  - 기타 이슈 (텍스트 입력)
- → `repairNeeded: boolean`, `repairType: "외부업체, 도배"` (쉼표 구분)

**완료 시 저장되는 필드:**
```javascript
{
  externalCheckDone: true,
  externalCheckComment: "손상1 / 손상2",  // 라벨 join
  repairNeeded: boolean,
  repairType: "외부업체, 도배",
  deductionItems: [{ label, amount }, ...],
  meterElec: "12345",
  meterGas: "6789",
}
```

**삭제 가드:** `externalCheckDone === true`이면 이벤트 삭제 차단: "퇴실체크가 완료된 건은 삭제할 수 없습니다."

---

### 4단계: 정산서 (TenantsPage lines 311-479)

**선행 조건:** `externalCheckDone === true` (아니면 alert: "퇴실체크 완료 후 정산서 작성이 가능합니다.")

**진입:** CalendarPage에서 `setPendingMoveout({ building, room })` → `setPage("tenants")` → TenantsPage 퇴실모드 자동 진입

**예금주 불일치 경고:** `_holderMismatch` 플래그 있으면 alert:
```
⚠️ 임차인 이름과 예금주가 다릅니다.
임차인: 홍길동
예금주: 김철수
계좌: 국민은행 123-456-789
정산서 작성 시 확인해주세요.
```

**데이터 연동 (CalendarPage → TenantsPage):**
- `deductionItems` → `manOther` 필드 매핑: `di.map(d => ({ desc: d.label, amt: d.amount }))`
- `refundBank/refundAccount/refundHolder` → 정산서 환불계좌 pre-fill
- `meterElecReading/meterGasReading` → 검침값 표시

**정산 계산 공식:**
```
일할계산:
  rentDaily = rent / daysInMonth
  mgmtDaily = mgmt / daysInMonth
  waterDaily = waterAmt / daysInMonth
  internetDaily = internetAmt / daysInMonth

  선불인 경우: ProRata = -daily * (남은일수)     // 환불
  후불인 경우: ProRata = daily * (사용일수)      // 추가 청구

공제합계(totalDeduct) =
  max(netRent, 0) + max(netMgmt, 0) + max(netWater, 0) + max(netInternet, 0)
  + cleaningFee        // 단기만
  + elecTotal + gasTotal + manRepair + manWaste + otherTotal  // 수기입력
  + manRestoration     // 근생만
  + penalty7           // 단기+조기퇴실: 7일분 위약금
  + penaltyComm        // 단기+조기퇴실: 중개수수료
  + lateFee            // 연체수수료
  + prevUnpaid         // 이전 미납
  + elevatorFee        // 관리사무소만

환불합계(totalRefund) =
  max(-netRent, 0) + max(-netMgmt, 0) + max(-netWater, 0) + max(-netInternet, 0)

최종정산금 = deposit + totalRefund - totalDeduct
```

**단기 위약금 규칙:**
- `isEarly = expiry > moveoutDate` (만기 전 퇴실)
- `penalty7 = Math.round((rent + mgmt) / 30 * 7)` — 7일분
- `penaltyComm = standardBrokerFee + commEvent` — 중개수수료

**연체수수료:** `getLateFee(tenant, roomBalances, lateFeeOverrides)` — 연체 5일차부터 월 임대료의 5%

**퇴실 확정 시 동작:**
1. `setPastTenantsData` — 정산 기록 저장 (전체 정산 명세 포함)
2. `setActiveTenants` — 해당 임차인 제거
3. `setActiveVacancies` — 새 공실 추가 (상태: "점검/청소중")
4. `setParkingInfo` — 주차 정보 초기화
5. Supabase: `deactivateTenant(supabaseId, moveoutDate)`
6. **미수금 기록:** `finalSettlement < 0`이면 `hm_moveoutDebts`에 저장
7. **검침 체인:** `hm_meterChain`에 퇴실 검침값 저장 (다음 입주자 기준점)
8. **청구 이력:** 해당 임차인의 billingHistory를 정산 기록에 포함

**새 공실 객체:**
```javascript
{
  building, room,
  type: roomType,
  status: "점검/청소중",
  commBroker: 10, commEvent: "", pw: "",
  deposit: Math.round(deposit/10000),  // 원 → 만원
  rent: Math.round(rent/10000),
  nego: Math.round(rent/10000),
  mgmt: Math.round(mgmt/10000),
  waterFee: "포함", cable: "포함", exitFee: 8, days: 0,
  moveInPhotos: tenant.moveOutCheckPhotos || [],  // 사진 체인: 퇴실체크사진 → 다음 입주사진
}
```

---

### 5단계: 청소 (cleaningDone)

**선행 조건:** `externalCheckDone === true`
- 아니면 confirm: "퇴실체크가 완료되지 않았습니다. 청소팀이 퇴실체크를 대신 진행하시겠습니까?" → Yes: ExternalCheckModal 오픈

**동작:**
1. prompt: "청소비 가중치 (없으면 빈칸)"
2. prompt: "청소 코멘트 (없으면 빈칸)"
3. 저장: `{ cleaningDone: true, cleaningFeeExtra, cleaningComment }`

---

### 6단계: 입주체크사진 (hasCheckPhotos)

**선행 조건:** `cleaningDone === true` (아니면 alert: "청소 완료 후 입주체크사진을 등록할 수 있습니다.")

**동작:** CheckPhotoModal 오픈 → 사진 업로드 → `moveOutCheckPhotos` 저장
- 이 사진은 다음 입주자의 `moveInCheckPhotos`가 됨 (사진 체인)

---

### 7단계: 공실전환 (vacantConfirmed)

**선행 조건:**
- `settled === true` (아니면 alert: "정산서 완료가 필요합니다.")
- `hasCheckPhotos === true` (아니면 alert: "입주체크사진 등록이 필요합니다.")

**동작:**
1. confirm: "공실로 전환하시겠습니까? (금액체크 상태로 공실에 등록됩니다)"
2. `{ vacantConfirmed: true, isCompleted: true }` 저장
3. `updateRoomVacancyStatus(building, room, "금액체크")`
4. `setActiveVacancies` → 새 공실 추가 (상태: "금액체크", type: "단기")

---

## 시나리오 3: 임차인 퇴실 — 일반/근생 (CalendarPage lines 1583-1666)

일반임대/근생은 단기와 다른 체크리스트 사용:

### 체크리스트 비교

| 순서 | 단기 (isShortTerm) | 일반/근생 |
|------|-------------------|-----------|
| 1 | 퇴실링크 (모달 3종) | 퇴실문자 (moveOutMsg) |
| 2 | 퇴실체크 (ExternalCheckModal) | 비밀번호 (doorPassword) |
| 3 | 정산서 → TenantsPage | 퇴실사진 (moveOutPhotos) |
| 4 | 청소 (cleaningDone) | 정산서 → TenantsPage |
| 5 | 입주체크사진 | 건물주연락 (일반임대/근생만) |
| 6 | 공실전환 | 입주체크사진 |

### 완료 판정

- **단기:** `vacantConfirmed === true`
- **일반:** `hasPhotos && hasCheckPhotos && settled`

### 일반 전용 단계

#### 퇴실문자 (moveOutMsg)
- 모달에서 문자 내용 작성 → SMS 전송
- 저장: `{ moveOutMsg: true }`

#### 퇴실사진
- PhotoDropZone으로 업로드 (최대 50장)
- 퇴실체크 없이 직접 업로드

#### 정산서 진입 조건
- 일반: `hasPhotos === true` (퇴실사진 필수)
- 단기: `externalCheckDone === true` (퇴실체크 필수)

#### 건물주연락 (ownerReported) — 일반임대/근생만
- **선행 조건:** `settled === true` (아니면 alert: "정산서가 완료되어야 건물주연락이 가능합니다.")
- **문자 내용:**
```
[건물 호실호 퇴실정산 안내]
안녕하세요, OO건물주님.
건물 호실호 퇴실정산이 완료되었습니다.
▪ 세입자: 홍길동
▪ 퇴실일: YYYY-MM-DD
▪ 보증금: X원
▪ 월세: X원
▪ 정산금: X원 (있으면)
감사합니다. - 하우스맨 드림
```

---

## 시나리오 4: 재계약 (TenantsPage lines 265-309, 2255-2323)

**어디서:** TenantsPage 임차인 상세 화면 → "📝 재계약입력" 버튼

**입력 필드:**
- 새 만기일 (newExpiry) — **필수**
- 새 입주일 (newStartDate) — optional
- 새 월세 (newRent) — 만원 단위
- 새 관리비 (newMgmt) — 만원 단위
- 월세 선불/후불
- 관리비 선불/후불
- 새 계약서 파일 (renewFiles)

**동작:**
1. **이전 계약 이력 저장** → `setPastTenantsData`:
```javascript
{
  name, phone, moveIn, moveOut: newStartDate || expiry,
  expiry, deposit, rent, mgmt,
  reason: "재계약",
  settlement: "재계약",
  renewedAt: "YYYY-MM-DD",
  contractFiles: renewFiles.map(f => f.name),
}
```
2. **현재 임차인 업데이트:**
```javascript
{
  moveIn: newStartDate || moveIn,
  expiry: newExpiry,
  rent: newRent * 10000,
  mgmt: newMgmt * 10000,
  contractFiles: [...existing, ...renewFiles],
  rentPayType, mgmtPayType,
}
```
3. Supabase: `updateTenant()`
4. alert: "재계약이 저장되었습니다."

**비즈니스 규칙:**
- 비단기(non-단기) 타입만 재계약 가능
- 이전 계약 정보가 과거 임차인 이력에 보존됨

---

## 시나리오 5: 계약 파기 (CalendarPage lines 1285-1338)

**어디서:** CalendarPage 계약현황 패널의 빨간색 "계약파기" 버튼

### 경로 A: 보고 전 파기 + 부동산 연락처 있음

**조건:** `!ev.reported && ev.brokerPhone`

**동작:**
1. 계약 캘린더 이벤트 삭제 (Supabase + UI)
2. 공실 상태 복원: `"계약서입력"` → `"홍보중"`
3. 부동산에게 문자 모달 오픈:
```
[건물 호실호 계약파기 안내]
안녕하세요, 하우스맨입니다.
건물 호실호 계약이 파기되었습니다.
▪ 보증금: X만원
▪ 월세: X만원
▪ 입주예정일: YYYY-MM-DD
해당 호실은 다시 공실로 전환됩니다.
감사합니다. - 하우스맨
```

### 경로 B: 보고 후 파기 (건물주에게 보고)

**조건:** `ev.reported` 또는 `!ev.brokerPhone`

**동작:**
1. 동일하게 이벤트 삭제 + 공실 복원
2. 건물주에게 문자 모달 오픈:
```
[건물 호실호 계약파기 보고]
안녕하세요, OO건물주님.
건물 호실호 계약이 파기되었습니다.
▪ 보증금: X만원
▪ 월세: X만원
▪ 관리비: X만원 (있으면)
▪ 입주예정일: YYYY-MM-DD
▪ 부동산: OO (있으면)
※ 계약금 입금 후 파기 건입니다.
감사합니다. - 하우스맨 드림
```

---

## 사진 체인 (Photo Chain)

```
이전 임차인 퇴실 시:
  moveOutPhotos           → 퇴실사진 (정산서 증빙)
  moveOutCheckPhotos      → 청소 후 호실 상태 사진

새 임차인 입주 시:
  moveInPhotos            → 입주 시 촬영 사진 (공실의 moveInPhotos)
  moveInCheckPhotos       → 이전 임차인의 moveOutCheckPhotos 자동 승계

비교:
  입퇴실 사진 비교 = moveInCheckPhotos(입주 시) vs moveOutPhotos(퇴실 시)
```

---

## 문자 발송 요약

| 시점 | 수신자 | 내용 | 트리거 |
|------|--------|------|--------|
| 계약 등록 | 부동산/관계자 | 계약정보 (4종 템플릿) | 계약 이벤트 생성 후 자동 모달 |
| 건물주보고 | 건물주 | 계약 진행 안내 | 계약금확인 후 수동 클릭 |
| 계약파기 (보고전) | 부동산 | 파기 안내 + 공실 전환 | 수동 클릭 |
| 계약파기 (보고후) | 건물주 | 파기 보고 | 수동 클릭 |
| 퇴실링크 | 임차인 | 링크 + 비밀번호/계좌 입력 요청 | 수동 클릭 (단기) |
| 퇴실정산 안내 | 건물주 | 정산 완료 안내 | 정산서 완료 후 수동 (일반/근생) |

---

## 핵심 비즈니스 규칙 요약

1. **계약 단계 순서 강제:** 계약금확인 → 건물주보고 → 잔금확인/계약서입력 (이전 단계 미완료 시 차단)
2. **퇴실 단계 순서 강제:** 퇴실링크 → 퇴실체크 → 정산서 → 청소 → 입주체크 → 공실전환 (각각 선행 조건)
3. **퇴실체크 완료 후 삭제 불가:** `externalCheckDone`이면 이벤트 삭제 차단
4. **예금주 불일치 감지:** holder !== tenantName이면 경고 (차단은 안 함)
5. **사진 체인:** 이전 임차인 퇴실체크사진 → 새 임차인 입주체크사진 자동 승계
6. **검침 체인:** 퇴실 검침값 → 다음 입주자 기준점 (hm_meterChain)
7. **미수금 자동 기록:** 정산금 음수(보증금 < 공제)이면 미수금 발생
8. **단기 위약금:** 만기 전 퇴실 시 7일분 임대료 + 중개수수료
9. **공실 상태 전이:** 홍보중 → 계약서입력 → (계약파기시) 홍보중 / (퇴실시) 점검/청소중 → 금액체크

---

## 검증 방법

이 문서는 코드 읽기 전용 분석이므로 실행 검증 불필요. 다음 작업에서 활용:
1. 백엔드 API 설계 시 상태 전이 다이어그램으로 변환
2. 도메인 엔티티 설계 시 필드 목록으로 활용
3. E2E 테스트 시나리오 작성 시 선행조건/후속동작 체크리스트로 활용
