import { getRoomType } from '@/config';

// 계좌 모드별 청구 분할 (수금관리와 동일)
export const getBillingSlots = (t: Record<string, any>, buildingAccounts: Record<string, any>, allBuildings: Record<string, any>[]) => {
  // 통합관리대장에서 업로드된 실제 청구 금액이 있으면 우선 사용
  if (t.fromLedger) {
    const bill1 = (t.prevBillOwner || 0) + (t.curBillOwner || 0);
    const bill2 = (t.prevBillHM || 0) + (t.curBillHM || 0) + (t.lateFeeAmount || 0);
    const slots: { label: string; amount: number; lateFee?: number }[] = [];
    if (bill1) slots.push({ label: "\u2460", amount: bill1 });
    if (bill2) slots.push({ label: "\u2461", amount: bill2, lateFee: t.lateFeeAmount || 0 });
    return slots;
  }

  const bldg = allBuildings.find(b => b.name === t.building);
  const bTypes = (bldg?.type || "단기").split("+").map((s: string) => s.trim());
  const roomType = getRoomType(t.building, t.room);
  const roomAcctType = roomType === "기업시설관리" ? "관리사무소" : roomType;
  const typeIdx = bTypes.findIndex((bt: string) => (bt === "기업시설관리" ? "관리사무소" : bt) === roomAcctType);
  const suffix = typeIdx >= 0 ? String(typeIdx + 1) : "1";
  const bAccts = buildingAccounts[t.building] || {};
  const roomKey = `${t.building}_${t.room}`;
  const roomOverride = buildingAccounts[roomKey];
  const mode = roomOverride?.mode || bAccts[`mode${suffix}`] || "";
  const rent = t.rent || 0;
  const mgmt = t.mgmt || 0;
  if (mode === "houseman" || mode === "hm_owner1" || mode === "gs1") {
    return [{ label: "\u2460", amount: rent + mgmt }];
  } else if (mode === "owner1" || mode === "gs2a") {
    return [{ label: "\u2460", amount: rent }, { label: "\u2461", amount: mgmt }];
  } else if (mode === "owner2" || mode === "gs2b") {
    return [{ label: "\u2460", amount: rent + mgmt }, { label: "\u2461", amount: 0 }];
  } else if (mode === "gs3") {
    return [{ label: "\u2460", amount: rent }, { label: "\u2461", amount: mgmt }, { label: "\u2462", amount: 0 }];
  }
  return [{ label: "\u2460", amount: rent + mgmt }];
};

// 단기 + 단일계좌 여부 판별 (houseman, hm_owner1 = 전체금액을 하나의 계좌로)
export const singleAcctModes = new Set(["houseman", "hm_owner1"]);
