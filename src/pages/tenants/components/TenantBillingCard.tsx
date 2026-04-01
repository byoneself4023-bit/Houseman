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
    { bg: "var(--color-hm-warning-bg)", border: "#FDBA74", text: "var(--color-hm-warning)", light: "#92400E" },
    { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", light: "#78716C" },
    { bg: "var(--color-hm-blue-bg)", border: "#93C5FD", text: "var(--color-hm-blue-dark)", light: "#1E40AF" },
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
      <div className="text-xs font-bold text-hm-danger mb-2 pb-1.5" style={{ borderBottom: "1.5px solid var(--color-hm-danger-border)" }}>🚨 청구/미납현황</div>
      <div className="flex flex-col gap-1.5 mb-3">
        {/* 흐름 안내 */}
        {flow && <div className="text-xs text-hm-text-muted mb-1 px-2 py-1 bg-hm-bg-slate rounded-md">💰 {flow}</div>}
        {/* 청구①②③ 슬롯 (수금관리와 동일) */}
        {slots.map((slot, si) => {
          const c = slotColors[si % slotColors.length];
          const info = acctInfo[si] || {} as any;
          return (
            <div key={si} className="px-3 py-2.5 rounded-lg" style={{ background: c.bg, border: `1.5px solid ${c.border}` }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold" style={{ color: c.text }}>{slot.label}</span>
                <span className="text-base font-bold" style={{ color: c.text }}>
                  {slot.amount.toLocaleString()}원{info.hasUtility ? "+" : ""}
                </span>
              </div>
              <div className={`flex gap-1 flex-wrap${info.acct ? " mb-1" : ""}`}>
                {(info.tags || []).map((tag: string) => (
                  <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white text-hm-text-sub">{tag}</span>
                ))}
              </div>
              {info.acct && <div className="text-xs" style={{ color: c.light }}>{info.acct}</div>}
            </div>
          );
        })}
        {/* 미납 잔액 (roomBalances 기반) */}
        {bal > 0 && (
          <div className="px-2.5 py-2 rounded-lg bg-hm-danger-bg border border-hm-danger-border">
            <div className="flex justify-between">
              <span className="text-xs font-bold text-hm-danger">미납 잔액</span>
              <span className="text-sm font-bold text-hm-danger">{bal.toLocaleString()}원</span>
            </div>
            {lf > 0 && <div className="text-xs text-hm-danger mt-0.5">연체수수료 {fmt(lf)}원 (5%)</div>}
            {override?.type === "exclude" && <div className="text-xs text-hm-success mt-0.5">연체수수료 제외 (수금관리)</div>}
            {override?.type === "discount" && <div className="text-xs text-hm-blue-dark mt-0.5">연체수수료 {fmt(override.amount)}원 할인 (수금관리)</div>}
          </div>
        )}
      </div>

      {/* 가상퇴실계산 + 청구 이력 누적 */}
      <div className="mb-3">
        <button onClick={() => setBillOpen(!billOpen)}
          className={`w-full px-4 py-2.5 rounded-[10px] cursor-pointer font-[inherit] flex items-center justify-between transition-colors hover:opacity-90 ${billOpen ? "bg-[#FFFBEB]" : "bg-white"}`}
          style={{ border: billOpen ? "2px solid #F59E0B" : "1.5px solid var(--color-hm-border)" }}>
          <div className="flex items-center gap-2">
            <span className="text-sm">🧾</span>
            <span className="text-xs font-bold text-[#92400E]">가상퇴실계산</span>
            <span className="text-xs text-hm-text-muted font-semibold">청구 {myBills.length}건</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${balance > 0 ? "text-hm-danger" : "text-hm-success"}`}>
              {balance > 0 ? `미납 ${fmt(balance)}원` : `완납`}
            </span>
            <span className="text-xs text-hm-text-muted">{billOpen ? "▲" : "▼"}</span>
          </div>
        </button>
        {billOpen && (
          <div className="mt-2 px-4 py-3 rounded-[10px] bg-[#FFFBEB]" style={{ border: "1.5px solid #FDE68A" }}>
            {/* 누적 요약 */}
            <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2 border-b border-[#FDE68A]">
              <span className="text-xs font-bold text-[#92400E]">누적 청구: {fmt(cumulative.total)}원</span>
              <span className="text-xs font-bold text-hm-success">납부: {fmt(paid)}원</span>
              {balance > 0 && <span className="text-xs font-bold text-hm-danger">미납: {fmt(balance)}원</span>}
            </div>
            <div className="flex flex-wrap gap-1 mb-2.5">
              {cumulative.rent > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-white text-hm-text-sub">월세 {fmt(cumulative.rent)}</span>}
              {cumulative.mgmt > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-white text-hm-text-sub">관리비 {fmt(cumulative.mgmt)}</span>}
              {cumulative.elec > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E]">전기 {fmt(cumulative.elec)}</span>}
              {cumulative.gas > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B]">가스 {fmt(cumulative.gas)}</span>}
              {cumulative.water > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-hm-blue-bg text-hm-blue-dark">수도 {fmt(cumulative.water)}</span>}
              {cumulative.cable > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-[#F3F4F6] text-hm-text-sub">인터넷 {fmt(cumulative.cable)}</span>}
              {cumulative.lateFee > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-hm-danger-bg text-hm-danger">연체료 {fmt(cumulative.lateFee)}</span>}
              {cumulative.asRepair > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-[#F5F3FF] text-[#7C3AED]">수리비 {fmt(cumulative.asRepair)}</span>}
            </div>
            {/* 개별 청구 내역 */}
            <div className="flex flex-col gap-1">
              {[...myBills].reverse().map((b, i) => (
                <div key={i} className="flex justify-between items-center px-2.5 py-1.5 rounded-md bg-white border border-[#FDE68A]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-[5px] py-px rounded">{ i + 1}</span>
                    <span className="text-xs font-semibold text-hm-text-sub">{b.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {b.items?.elec > 0 && <span className="text-[8px] text-[#92400E]">⚡{fmt(b.items.elec)}</span>}
                    {b.items?.gas > 0 && <span className="text-[8px] text-[#991B1B]">🔥{fmt(b.items.gas)}</span>}
                    <span className="text-xs font-bold text-[#92400E]">{fmt(b.total)}원</span>
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
