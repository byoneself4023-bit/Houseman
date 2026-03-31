# Phase 2 Part 5 — BuildingDetailPage Supabase 통합

---

## 실행 환경

- Phase 2 Part 1~4 + 전수 분석/허점 보완 완료 상태
- BuildingDetailPage: 우리 buildings/detail/ 8개 파일 2,642줄 (CEO 1,469줄보다 큰 상태)
- 분석 결과: 기능 95% 이미 존재. Supabase 연동 계층만 누락

---

## buildingDetailApi.ts (신규, 111줄)

calendarApi.ts / tenantsApi.ts와 동일 패턴. USE_API=true → no-op. USE_API=false → Supabase 직접 호출.

persistBuildingPatch — 건물 정보 수정 시 Supabase 동기화. supabaseId 또는 buildingName 기반.

persistDeleteBuilding — 건물 삭제. FK 캐스케이드 (호실, 임차인, AS 모두 삭제).

persistFetchStaff — 담당자 조회. supabaseId 기반. building_staff_assignments 테이블.

persistUpsertStaff — 담당자 배정. UPSERT (같은 역할 1명만).

persistUpdateRoom — 호실 수정. buildingName + roomNumber로 rooms.id 조회 후 UPDATE.

---

## BuildingDetailPage.tsx 수정

updateBD에 Supabase 연동 추가. 기존 로컬 상태 즉시 반영 + persistBuildingPatch 비동기 호출 (silent). useCallback으로 최적화.

supabaseId prop을 BuildingStaffSection, BuildingTypeEditor에 전달.

beforeunload 경고 추가. 편집 모드(sec1~4Edit, secAcctEdit, notesEdit, roomEditMode 중 하나라도 true) 중 페이지 이탈 시 브라우저 확인 팝업.

---

## BuildingTypeEditor.tsx 수정

건물 삭제 확인 후 persistDeleteBuilding 호출 추가. setAllBuildings로 로컬 상태에서도 해당 건물 제거 후 onBack(). supabaseId, setAllBuildings prop 수신.

---

## BuildingStaffSection.tsx 수정

컴포넌트 마운트 시 persistFetchStaff → 담당자 state 초기화. 담당자 변경 시 persistUpsertStaff 호출 (역할, 이름, 연락처). supabaseId prop 수신.

---

## RoomDetailPanel.tsx 수정

호실 저장 시 persistUpdateRoom 호출 추가. buildingName + selectedRoom + updated patch 전달.

---

## 산출물 요약

### 신규 파일 (1개)

| 파일 | 역할 |
|------|------|
| buildings/detail/buildingDetailApi.ts | Supabase CRUD feature flag 래퍼 (5개 함수) |

### 수정 파일 (4개)

| 파일 | 변경 |
|------|------|
| BuildingDetailPage.tsx | updateBD Supabase 연동 + supabaseId prop 전달 + beforeunload |
| BuildingTypeEditor.tsx | 삭제 시 persistDeleteBuilding + setAllBuildings |
| BuildingStaffSection.tsx | 마운트 시 fetchStaff + 변경 시 upsertStaff |
| RoomDetailPanel.tsx | 호실 저장 시 persistUpdateRoom |

### 알려진 이슈

| 이슈 | 심각도 | 해결 |
|------|--------|------|
| BrokerWrapper.tsx TS 에러 (CalendarEvent[] → never[]) | LOW | BrokerPage prop 타입 `any[]`로 수정 필요 |

---

## 검증

- TypeScript: 우리 파일 에러 0건 (BrokerWrapper pre-existing 1건)
- Build: 성공 (7.34s)
