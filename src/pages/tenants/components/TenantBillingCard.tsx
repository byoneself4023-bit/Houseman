import React, { useState } from 'react';
import { getRoomType } from '@/config';
import { flowMap, defaultHousemanAccount } from '@/config/accountConfig';
import { fmt } from '@/utils';
import { getLateFee } from '../utils/billingStatus';

interface TenantBillingCardProps {
  t: Record<string, any>;
  allBuildings: Record<string, any>[];
  buildingAccounts: Record<string, any>;
  roomBalances: Record<string, number>;
  lateFeeOverrides: Record<string, any>;
  billingHistory: Record<string, any>[];
  billingPopup: Record<string, any> | null;
  setBillingPopup: (v: Record<string, any> | null) => void;
}

export const TenantBillingCard: React.FC<TenantBillingCardProps> = ({
  t,
  allBuildings,
  buildingAccounts,
  roomBalances,
  lateFeeOverrides,
  billingHistory,
  billingPopup,
  setBillingPopup,
}) => {
  // 계좌 모드 결정
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
  const housemanAcct = roomOverride?.housemanAccount || bAccts[`housemanAccount${suffix}`] || defaultHousemanAccount;
  const ownerAccts = roomOverride?.ownerAccounts || bAccts[`ownerAccounts${suffix}`] || {};
  const flow = flowMap[mode] || "";

  // 모드별 청구 슬롯 (수금관리와 동일)
  const rent = t.rent || 0;
  const mgmt = t.mgmt || 0;
  let slots: { label: string; amount: number }[] = [];
  let acctInfo: { tags: string[]; acct: string; hasUtility?: boolean }[] = [];
  if (mode === "houseman") {
    slots = [{ label: "청구\u2460", amount: rent + mgmt }];
    acctInfo = [{ tags: ["임대료", "관리비", "공과금"], acct: housemanAcct }];
  } else if (mode === "hm_owner1") {
    slots = [{ label: "청구\u2460", amount: rent + mgmt }];
    acctInfo = [{ tags: ["임대료", "관리비", "공과금"], acct: ownerAccts.rent || "" }];
  } else if (mode === "owner1" || mode === "gs2a") {
    slots = [{ label: "청구\u2460", amount: rent }, { label: "청구\u2461", amount: mgmt }];
    acctInfo = [
      { tags: ["임대료"], acct: ownerAccts.rent || "" },
      { tags: ["관리비", "공과금"], acct: mode === "gs2a" ? (ownerAccts.mgmt || "") : housemanAcct, hasUtility: true },
    ];
  } else if (mode === "owner2" || mode === "gs2b") {
    slots = [{ label: "청구\u2460", amount: rent + mgmt }, { label: "청구\u2461", amount: 0 }];
    acctInfo = [
      { tags: ["임대료", "관리비"], acct: ownerAccts.rent || "" },
      { tags: ["공과금"], acct: mode === "gs2b" ? (ownerAccts.utility || "") : housemanAcct, hasUtility: true },
    ];
  } else if (mode === "gs1") {
    slots = [{ label: "청구\u2460", amount: rent + mgmt }];
    acctInfo = [{ tags: ["임대료", "관리비", "공과금"], acct: ownerAccts.rent || "" }];
  } else if (mode === "gs3") {
    slots = [{ label: "청구\u2460", amount: rent }, { label: "청구\u2461", amount: mgmt }, { label: "청구\u2462", amount: 0 }];
    acctInfo = [
      { tags: ["임대료"], acct: ownerAccts.rent || "" },
      { tags: ["관리비"], acct: ownerAccts.mgmt || "" },
      { tags: ["공과금"], acct: ownerAccts.utility || "", hasUtility: true },
    ];
  } else {
    // 모드 미설정: 기본 단일
    slots = [{ label: "청구\u2460", amount: rent + mgmt }];
    acctInfo = [{ tags: ["임대료", "관리비"], acct: "" }];
  }

  const slotColors = [
    { bg: "#FFF7ED", border: "#FDBA74", text: "#EA580C", light: "#92400E" },
    { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", light: "#78716C" },
    { bg: "#EFF6FF", border: "#93C5FD", text: "#2563EB", light: "#1E40AF" },
  ];

  const bal = roomBalances[`${t.building}_${t.room}`] || 0;
  const lf = getLateFee(t, roomBalances, lateFeeOverrides);
  const overrideKey = `${t.building}_${t.room}`;
  const override = lateFeeOverrides[overrideKey];

  // 가상퇴실계산 + 청구 이력 누적
  const myBills = billingHistory.filter(b => b.building === t.building && b.room === t.room).sort((a, b) => a.id - b.id);
  const cumulative = { rent: 0, mgmt: 0, elec: 0, gas: 0, water: 0, cable: 0, lateFee: 0, asRepair: 0, total: 0 };
  myBills.forEach(b => {
    if (b.items) {
      cumulative.rent += b.items.rent || 0;
      cumulative.mgmt += b.items.mgmt || 0;
      cumulative.elec += b.items.elec || 0;
      cumulative.gas += b.items.gas || 0;
      cumulative.water += b.items.water || 0;
      cumulative.cable += b.items.cable || 0;
      cumulative.lateFee += b.items.lateFee || 0;
      cumulative.asRepair += b.items.asRepair || 0;
    }
    cumulative.total += b.total || 0;
  });
  const balance = roomBalances[`${t.building}_${t.room}`] || 0;
  const paid = cumulative.total - balance;
  const [billOpen, setBillOpen] = [billingPopup?.tenant?.id === t.id, (open: boolean) => open ? setBillingPopup({ tenant: t, bills: myBills }) : setBillingPopup(null)] as const;

  return (
    <>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #FECACA" }}>🚨 청구/미납현황</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {/* 흐름 안내 */}
        {flow && <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2, padding: "4px 8px", background: "#F8FAFC", borderRadius: 6 }}>💰 {flow}</div>}
        {/* 청구①②③ 슬롯 (수금관리와 동일) */}
        {slots.map((slot, si) => {
          const c = slotColors[si % slotColors.length];
          const info = acctInfo[si] || {} as any;
          return (
            <div key={si} style={{ padding: "10px 12px", borderRadius: 8, background: c.bg, border: `1.5px solid ${c.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: c.text }}>{slot.label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: c.text }}>
                  {slot.amount.toLocaleString()}원{info.hasUtility ? "+" : ""}
                </span>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: info.acct ? 4 : 0 }}>
                {(info.tags || []).map((tag: string) => (
                  <span key={tag} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#fff", color: "#5F6577" }}>{tag}</span>
                ))}
              </div>
              {info.acct && <div style={{ fontSize: 9, color: c.light }}>{info.acct}</div>}
            </div>
          );
        })}
        {/* 미납 잔액 (roomBalances 기반) */}
        {bal > 0 && (
          <div style={{ padding: "8px 10px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626" }}>미납 잔액</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#DC2626" }}>{bal.toLocaleString()}원</span>
            </div>
            {lf > 0 && <div style={{ fontSize: 9, color: "#DC2626", marginTop: 2 }}>연체수수료 {fmt(lf)}원 (5%)</div>}
            {override?.type === "exclude" && <div style={{ fontSize: 9, color: "#059669", marginTop: 2 }}>연체수수료 제외 (수금관리)</div>}
            {override?.type === "discount" && <div style={{ fontSize: 9, color: "#2563EB", marginTop: 2 }}>연체수수료 {fmt(override.amount)}원 할인 (수금관리)</div>}
          </div>
        )}
      </div>

      {/* 가상퇴실계산 + 청구 이력 누적 */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setBillOpen(!billOpen)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: billOpen ? "2px solid #F59E0B" : "1.5px solid #E8ECF0", background: billOpen ? "#FFFBEB" : "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13 }}>🧾</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#92400E" }}>가상퇴실계산</span>
            <span style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600 }}>청구 {myBills.length}건</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: balance > 0 ? "#DC2626" : "#059669" }}>
              {balance > 0 ? `미납 ${fmt(balance)}원` : `완납`}
            </span>
            <span style={{ fontSize: 11, color: "#8F95A3" }}>{billOpen ? "▲" : "▼"}</span>
          </div>
        </button>
        {billOpen && (
          <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 10, background: "#FFFBEB", border: "1.5px solid #FDE68A" }}>
            {/* 누적 요약 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #FDE68A" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#92400E" }}>누적 청구: {fmt(cumulative.total)}원</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#059669" }}>납부: {fmt(paid)}원</span>
              {balance > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626" }}>미납: {fmt(balance)}원</span>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
              {cumulative.rent > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#fff", color: "#5F6577" }}>월세 {fmt(cumulative.rent)}</span>}
              {cumulative.mgmt > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#fff", color: "#5F6577" }}>관리비 {fmt(cumulative.mgmt)}</span>}
              {cumulative.elec > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#FEF3C7", color: "#92400E" }}>전기 {fmt(cumulative.elec)}</span>}
              {cumulative.gas > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#FEE2E2", color: "#991B1B" }}>가스 {fmt(cumulative.gas)}</span>}
              {cumulative.water > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#EFF6FF", color: "#2563EB" }}>수도 {fmt(cumulative.water)}</span>}
              {cumulative.cable > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#F3F4F6", color: "#5F6577" }}>인터넷 {fmt(cumulative.cable)}</span>}
              {cumulative.lateFee > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#FEF2F2", color: "#DC2626" }}>연체료 {fmt(cumulative.lateFee)}</span>}
              {cumulative.asRepair > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#F5F3FF", color: "#7C3AED" }}>수리비 {fmt(cumulative.asRepair)}</span>}
            </div>
            {/* 개별 청구 내역 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[...myBills].reverse().map((b, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: 6, background: "#fff", border: "1px solid #FDE68A" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#D97706", background: "#FEF3C7", padding: "1px 5px", borderRadius: 4 }}>{i + 1}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#5F6577" }}>{b.date}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {b.items?.elec > 0 && <span style={{ fontSize: 8, color: "#92400E" }}>⚡{fmt(b.items.elec)}</span>}
                    {b.items?.gas > 0 && <span style={{ fontSize: 8, color: "#991B1B" }}>🔥{fmt(b.items.gas)}</span>}
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#92400E" }}>{fmt(b.total)}원</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
