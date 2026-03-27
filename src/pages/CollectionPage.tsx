import React, { useState, useMemo, useEffect } from 'react';
import { buildings, billingTypeMap } from '@/data';
import { getRoomType, collectionAssigneeMap, initialStaffMembers } from '@/config';

import { useIsMobile, fmt } from '@/utils';
import { matchKorean } from '@/utils/koreanSearch';
import { Card, SectionTitle, Table, StatusBadge, DunningTemplateSettings } from '@/components';
import { useLocalStorage } from '@/utils/useLocalStorage';

const rk = (t: Record<string, any>) => `${t.building}_${t.room}`;

// 계좌 모드별 청구 분할 계산
const getBillingSlots = (t: Record<string, any>, buildingAccounts: Record<string, any>, allBuildings: Record<string, any>[]): { label: string; amount: number; lateFee?: number }[] => {
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
  const bTypes = (bldg?.type || "\uB2E8\uAE30").split("+").map((s: string) => s.trim());
  const roomType = getRoomType(t.building, t.room);
  const roomAcctType = roomType === "\uAE30\uC5C5\uC2DC\uC124\uAD00\uB9AC" ? "\uAD00\uB9AC\uC0AC\uBB34\uC18C" : roomType;
  const typeIdx = bTypes.findIndex((bt: string) => (bt === "\uAE30\uC5C5\uC2DC\uC124\uAD00\uB9AC" ? "\uAD00\uB9AC\uC0AC\uBB34\uC18C" : bt) === roomAcctType);
  const suffix = typeIdx >= 0 ? String(typeIdx + 1) : "1";
  const bAccts = buildingAccounts[t.building] || {};
  const roomKey = `${t.building}_${t.room}`;
  const roomOverride = buildingAccounts[roomKey];
  const mode = roomOverride?.mode || bAccts[`mode${suffix}`] || "";
  const rent = t.rent || 0;
  const mgmt = t.mgmt || 0;
  if (mode === "houseman" || mode === "hm_owner1" || mode === "gs1") return [{ label: "\u2460", amount: rent + mgmt }];
  if (mode === "owner1" || mode === "gs2a") return [{ label: "\u2460", amount: rent }, { label: "\u2461", amount: mgmt }];
  if (mode === "owner2" || mode === "gs2b") return [{ label: "\u2460", amount: rent + mgmt }, { label: "\u2461", amount: 0 }];
  if (mode === "gs3") return [{ label: "\u2460", amount: rent }, { label: "\u2461", amount: mgmt }, { label: "\u2462", amount: 0 }];
  return [{ label: "\u2460", amount: rent + mgmt }];
};

interface CollectionPageProps {
  myBuildings?: string[];
  activeTenants?: Record<string, any>[];
  roomBalances?: Record<string, number>;
  lateFeeOverrides?: Record<string, any>;
  setLateFeeOverrides?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  buildingAccounts?: Record<string, any>;
  allBuildings?: Record<string, any>[];
  billingHistory?: Record<string, any>[];
  buildingData?: Record<string, any>;
  isLoading?: boolean;
}

export const CollectionPage = ({ myBuildings = [], activeTenants = [], roomBalances = {}, lateFeeOverrides = {}, setLateFeeOverrides, buildingAccounts = {}, allBuildings = [], billingHistory = [], isLoading }: CollectionPageProps) => {
  const isMobile = useIsMobile();
  const [historyTarget, setHistoryTarget] = useState<Record<string, any> | null>(null);
  const [commentTarget, setCommentTarget] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(100);
  const [commentText, setCommentText] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [electricCut, setElectricCut] = useLocalStorage<Record<string, string | undefined>>("hm_electricCut", {});
  const [statusFilter, setStatusFilter] = useState("\uC804\uCCB4");
  const [sortMode, setSortMode] = useState("\uC5F0\uCCB4\uC77C\uC21C");
  const [filterCollector, setFilterCollector] = useState("\uC804\uCCB4");
  const [buildingSearch, setBuildingSearch] = useState("");
  const [staffList] = useLocalStorage<Record<string, any>[]>("hm_staffList", initialStaffMembers);
  const collectionStaff = staffList.filter(s => s.roles.includes("collection")).map(s => s.name);
  const collectors = ["\uC804\uCCB4", ...collectionStaff];
  const allMyTenants = myBuildings.length > 0 ? activeTenants.filter(t => myBuildings.includes(t.building)) : activeTenants;
  const [comments, setComments] = useLocalStorage<Record<string, { date: string; tenant: string; text: string }[]>>("hm_comments", {
    "\uBAA8\uB358\uB77C\uC774\uD504_501": [{ date: "2026-02-23", tenant: "\uC774\uBCF4\uB78C", text: "2/25\uC77C\uC5D0 \uB0A9\uBD80\uD55C\uB370\uC11C \uCD5C\uC18C 200\uB9CC\uC6D0\uC740 \uB3FC\uC57C\uD55C\uB2E4\uD568" }],
    "\uC9C0\uC564\uC9C02_401": [{ date: "2026-02-23", tenant: "\uBC15\uC885\uD638", text: "[\uC720\uC740\uD61C\uAD00\uB9AC] \uBCF4\uC99D\uAE08 2\uC5B5\uC73C\uB85C \uCDA9\uBD84\uD558\uB098 \uC218\uAE08 \uC6D0\uCE59\uC0C1 \uB3C5\uCD09 \uC9C4\uD589" }],
    "\uD55C\uC2A4\uD154_104": [{ date: "2026-02-23", tenant: "\uAE40\uADE0\uC5FD", text: "(\uB9E4\uB2EC 4\uC77C \uB0A9\uBD80. 5\uC77C\uC5D4 \uC5F0\uCCB4\uC218\uC218\uB8CC)" }],
    "\uBBF8\uB798\uD648_104": [{ date: "2026-02-23", tenant: "\uAE40\uD61C\uC21C", text: "2/14 9\uC2DC 35\uBD84 \uC624\uBCD1\uCC9C\uC73C\uB85C 10\uB9CC\uC6D0 \uC785\uAE08, \uB098\uBA38\uC9C0 2/25\uAE4C\uC9C0 \uC644\uB0A9\uC57D\uC18D" }],
    "\uC5D0\uB374\uBE4C_301": [{ date: "2026-02-23", tenant: "\uC815\uC18C\uC815", text: "2/25\uC5D0 \uB0A9\uBD80\uD55C\uB370\uC11C \uC624\uC804\uAE4C\uC9C0\uB294 \uD558\uB77C\uD568" }],
    "\uBBF8\uB798\uD648_203": [{ date: "2026-02-23", tenant: "\uC774\uD638\uACBD", text: "3/15\uD1F4\uC2E4, 2/23\uBD80\uD130 25\uAE4C\uC9C0 \uC644\uB0A9\uC57D\uC18D. \uCD1D 596,460\uC6D0\uC911 20\uB9CC\uC6D0\uC740 \uBCF4\uC99D\uAE08" }],
    "\uC9C0\uC564\uC9C02_201": [{ date: "2026-02-23", tenant: "\uAE40\uAE30\uC6A9", text: "<15\uC77C\uB0A9\uBD80> \uC124\uC9C0\uB098\uACE0 \uB0A9\uBD80\uB0A0\uC9DC \uB2E4\uC2DC\uC5F0\uB77D\uC900\uB2E4\uD568" }],
    "\uAD7F\uBAA8\uB2DD\uBE4C_304": [{ date: "2026-02-23", tenant: "\uBC15\uC131\uC6B1", text: "\uAE09\uC5EC\uB0A0\uC9DC 10\uC77C [11\uC77C \uC5F0\uCCB4\uC218\uC218\uB8CC \uBD80\uACFC], \uAE09\uC5EC \uBC00\uB824\uC11C \uC124\uB05D\uB098\uACE0 \uCD5C\uB300\uD55C\uBE68\uB9AC\uC900\uB2E4\uD568" }],
    "\uBA54\uC885\uBE4C_202": [{ date: "2026-02-23", tenant: "\uBC15\uCC44\uB9B0", text: "2/24 \uC644\uB0A9\uC57D\uC18D\uC778\uB370 3/8\uC5D0\uB294 \uC774\uC81C \uD1F4\uC2E4\uD558\uB77C\uD568" }],
    "W\uD558\uC6B0\uC2A4_503": [{ date: "2026-02-23", tenant: "\uAE40\uD604\uC6B0", text: "(\uCE74\uD1A1) 2/22\uAE4C\uC9C0 30\uB9CC\uC6D0 \uBD84\uB0A9\uD6C4 25\uC77C\uAE4C\uC9C0 \uC644\uB0A9\uC57D\uC18D" }],
    "W\uD558\uC6B0\uC2A4_302": [{ date: "2026-02-23", tenant: "\uAD8C\uC18C\uC815", text: "<\uB0A9\uBD80\uC77C 20\uC77C\uB85C \uBCC0\uACBD> \uBBF8\uB0A93\uC77C\uCC28 \uC218\uC218\uB8CC\uBD80\uACFC" }],
    "\uB2E4\uC874\uD558\uC6B0\uC2A4_203": [{ date: "2026-02-23", tenant: "\uBC15\uAC74\uD76C", text: "\uACF5\uACFC\uAE08\uB9CC 2/28\uAE4C\uC9C0 \uC644\uB0A9\uC57D\uC18D. \uC6D4\uAE09\uC774 \uB2A6\uC5B4\uC84C\uB2E4\uD568" }],
    "\uB2E4\uC874\uD558\uC6B0\uC2A4_305": [{ date: "2026-02-23", tenant: "\uCD5C\uC11C\uC5F0", text: "\uBC88\uD638 \uCE74\uD1A1 \uB2E4\uC0AC\uB77C\uC9D0 \uBC29\uBB38\uD574\uC11C \uC5F0\uB77D\uCC98 \uC54C\uB824\uB2EC\uB77C\uD558\uAE30" }],
    "\uB9AC\uD2B8\uCF54\uD558\uC6B0\uC2A4_502": [{ date: "2026-02-23", tenant: "\uBC15\uC18C\uD604", text: "\uACC4\uC57D\uC11C\uB300\uB85C\uBA74 20\uC77C \uB0A9\uBD80\uC77C\uC774\uB77C \uC218\uC218\uB8CC4\uC77C\uCC28 \uC544\uB2C8\uB0D0\uACE0\uD568, 2/23 \uC644\uB0A9\uC57D\uC18D" }],
    "\uBAA8\uB2DD\uBE4C_305": [{ date: "2026-02-23", tenant: "\uC870\uBCD1\uC775", text: "2/16 60\uB9CC\uC6D0 \uB0A9\uBD80\uD6C4 3/10 3\uC6D4\uC6D4\uC138\uB791 \uAC19\uC774 \uB0A9\uBD80\uD55C\uB2E4\uD568, \uBBF8\uB0A9 10\uC77C\uCC28" }],
    "\uC2A4\uD0C0\uBE4C_403": [{ date: "2026-02-23", tenant: "\uC1A1\uC608\uC900", text: "1/14\uAE4C\uC9C0 \uC644\uB0A9\uD55C\uB2E4\uB294\uB370 12\uC77C\uC5D0 30\uB9CC\uC6D0\uC774\uC0C1\uBD84\uB0A9\uC548\uB418\uBA74 \uD1F4\uC2E4\uB3FC\uC57C\uD55C\uB2E4\uD568" }],
    "\uBA54\uC885\uBE4C_301": [{ date: "2026-02-23", tenant: "\uCD5C\uAE30\uC5F0", text: "2\uC6D4\uAE4C\uC9C0 \uD55C\uB2EC\uB354 \uC5F0\uC7A5\uD55C\uB2E4\uACE0\uD568, 1/26\uAE4C\uC9C0 \uC644\uB0A9\uC548\uB418\uBA74 \uC5F0\uC7A5 \uC5B4\uB835\uB2E4\uD568" }],
    "\uBA54\uC885\uBE4C_601": [{ date: "2026-02-23", tenant: "\uBC15\uC218\uC5F0", text: "2/20 40\uB9CC\uC6D0 \uC120\uB0A9\uBA3C\uC800\uD568" }],
    "W\uD558\uC6B0\uC2A4_601": [{ date: "2026-02-23", tenant: "\uC11C\uC740\uAE30", text: "12/18 \uC644\uB0A9\uC57D\uC18D" }],
    "\uB9AC\uD2B8\uCF54\uD558\uC6B0\uC2A4_606": [{ date: "2026-02-23", tenant: "\uBB38\uC5F4\uB9E4", text: "2/25\uAE4C\uC9C0 \uC644\uB0A9\uD558\uB77C\uD568" }],
  });


  // due is "M/D" format → extract day as rent day
  const getDueDay = (t: Record<string, any>) => {
    if (!t.due || !t.due.includes("/")) return 0;
    return parseInt(t.due.split("/")[1]) || 0;
  };
  const _now = new Date();
  const today = _now.getDate();
  const daysInMonth = new Date(_now.getFullYear(), _now.getMonth() + 1, 0).getDate();
  const getDaysSinceDue = (t: Record<string, any>) => {
    const dueDay = getDueDay(t);
    if (!dueDay) return 0;
    let diff = today - dueDay;
    if (diff < -daysInMonth / 2) diff += daysInMonth;
    return diff;
  };

  const getBalance = (t: Record<string, any>) => {
    if (t.fromLedger) {
      return (t.prevBillOwner || 0) + (t.curBillOwner || 0) + (t.prevBillHM || 0) + (t.curBillHM || 0) + (t.lateFeeAmount || 0);
    }
    return roomBalances[rk(t)] || 0;
  };
  const calcLateFee = (t: Record<string, any>) => {
    const balance = getBalance(t);
    if (balance <= 0) return 0;
    const daysSince = getDaysSinceDue(t);
    if (daysSince < 5) return 0;
    const key = rk(t);
    const override = lateFeeOverrides[key];
    if (override?.type === "exclude") return 0;
    const baseFee = Math.round((t.rent || 0) * 0.05);
    if (override?.type === "discount") return Math.max(0, baseFee - (override.amount || 0));
    return baseFee;
  };
  const calcBill = (t: Record<string, any>) => t.rent + t.mgmt + calcLateFee(t);

  const setFeeOverride = (key: string, type: string | null, amount?: number) => {
    if (!setLateFeeOverrides) return;
    if (!type) {
      setLateFeeOverrides(prev => { const next = { ...prev }; delete next[key]; return next; });
    } else {
      setLateFeeOverrides(prev => ({ ...prev, [key]: { type, amount: amount || 0, date: new Date().toISOString().slice(0, 10) } }));
    }
  };

  const filteredFinal = useMemo(() => {
    const baseTenants = filterCollector === "\uC804\uCCB4"
      ? allMyTenants
      : allMyTenants.filter(t => collectionAssigneeMap[t.building] === filterCollector);
    const filteredByBuilding = buildingSearch
      ? baseTenants.filter(t => matchKorean(t.building, buildingSearch))
      : baseTenants;
    const filteredVisible = filteredByBuilding.filter(t => {
      const slots = getBillingSlots(t, buildingAccounts, allBuildings);
      const totalBill = slots.reduce((s, sl) => s + Math.abs(sl.amount || 0), 0);
      const balance = getBalance(t);
      const days = getDaysSinceDue(t);
      if (t.building === "\uC5D0\uB374\uBE4C" && t.room === "301") {
        console.log("\uC5D0\uB374\uBE4C301 \uB514\uBC84\uADF8:", { fromLedger: t.fromLedger, due: t.due, days, balance, totalBill, slots, curBillHM: t.curBillHM, prevBillHM: t.prevBillHM });
      }
      if (t.name === "\uD1F4\uC2E4" || t.status === "\uD1F4\uC2E4") return false;
      if (t.fromLedger && totalBill > 0) return true;
      if (balance > 0 && days >= 0) return true;
      if (totalBill > 0 && days >= -2) return true;
      return false;
    });
    const getRisk = (t: Record<string, any>) => {
      const days = getDaysSinceDue(t);
      const balance = getBalance(t);
      const total = (t.rent || 0) + (t.mgmt || 0);
      if (total <= 0 || balance <= 0) return days;
      const paid = total - balance;
      const dailyRate = total / 30;
      const daysCovered = dailyRate > 0 ? paid / dailyRate : 0;
      return days - daysCovered;
    };
    const sorted = [...filteredVisible].sort((a, b) => {
      const balA = getBalance(a), balB = getBalance(b);
      if ((balA > 0) !== (balB > 0)) return balA > 0 ? -1 : 1;
      if (balA > 0 && balB > 0) {
        if (sortMode === "\uC704\uD5D8\uB3C4\uC21C") return getRisk(b) - getRisk(a);
        return getDaysSinceDue(b) - getDaysSinceDue(a);
      }
      return getDaysSinceDue(b) - getDaysSinceDue(a);
    });
    if (statusFilter === "\uC804\uCCB4") return sorted;
    if (statusFilter === "\uC5F0\uCCB4") return sorted.filter(t => getBalance(t) > 0 && getDaysSinceDue(t) >= 0);
    return sorted.filter(t => electricCut[rk(t)] === statusFilter);
  }, [allMyTenants, filterCollector, buildingSearch, statusFilter, electricCut, sortMode, roomBalances]);

  useEffect(() => { setVisibleCount(100); }, [filterCollector, buildingSearch, statusFilter]);
  const visibleFinal = useMemo(() => filteredFinal.slice(0, visibleCount), [filteredFinal, visibleCount]);

  const addComment = (key: string, tenant: string) => {
    if (!commentText.trim()) return;
    setComments(prev => ({ ...prev, [key]: [{ date: new Date().toISOString().slice(0, 10), tenant, text: commentText.trim() }, ...(prev[key] || [])] }));
    setCommentText("");
    setCommentTarget(null);
  };

  const historyData = useMemo(() => {
    if (!historyTarget) return [];
    const key = rk(historyTarget);
    return billingHistory
      .filter(h => `${h.building}_${h.room}` === key)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historyTarget, billingHistory]);

  return (
    <div>
      {/* 청구 이력 팝업 */}
      {historyTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setHistoryTarget(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 520, width: "100%", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{historyTarget.building} {historyTarget.room}호</div>
                <div style={{ fontSize: 13, color: "#5F6577", marginTop: 2 }}>{historyTarget.name} · {historyTarget.phone}</div>
              </div>
              <div onClick={() => setHistoryTarget(null)} style={{ cursor: "pointer", fontSize: 18, color: "#8F95A3", padding: "4px 8px" }}>✕</div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, padding: "12px 16px", background: "#F8FAFC", borderRadius: 10 }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 10, color: "#8F95A3" }}>보증금</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{fmt(historyTarget.deposit)}</div>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 10, color: "#8F95A3" }}>월세</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#2563EB" }}>{fmt(historyTarget.rent)}</div>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 10, color: "#8F95A3" }}>관리비</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{fmt(historyTarget.mgmt)}</div>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 10, color: "#8F95A3" }}>잔액</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: roomBalances[rk(historyTarget)] > 0 ? "#DC2626" : "#059669" }}>{fmt(roomBalances[rk(historyTarget)] || 0)}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>청구 이력</div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {historyData.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", color: "#B0B5C1", fontSize: 13 }}>청구 이력이 없습니다</div>
              ) : historyData.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, marginBottom: 4, background: i % 2 === 0 ? "#F9FAFB" : "#fff" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{h.date}</div>
                    <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 2 }}>{h.type || "청구"} {h.cat || ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: h.amount >= 0 ? "#DC2626" : "#059669" }}>{h.amount >= 0 ? "+" : ""}{fmt(h.amount)}원</div>
                    {h.paid !== undefined && <div style={{ fontSize: 10, color: h.paid ? "#059669" : "#DC2626", fontWeight: 600 }}>{h.paid ? "납부완료" : "미납"}</div>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setHistoryTarget(null)} style={{ marginTop: 16, padding: "12px", borderRadius: 10, border: "none", background: "#1A1D23", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>닫기</button>
          </div>
        </div>
      )}

      <SectionTitle sub={filterCollector === "\uC804\uCCB4" ? "\uC218\uAE08 \uAD00\uB9AC" : `${filterCollector} \uC804\uB2F4 · ${filteredFinal.length}\uBA85`}>💰 수금 관리</SectionTitle>

      {/* 상단 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "table", label: "💰 수금 테이블" },
          { key: "settings", label: "⚙ 독촉 설정" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setViewMode(tab.key)}
            style={{
              padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
              border: viewMode === tab.key ? "2px solid #3B82F6" : "1.5px solid #E0E3E9",
              background: viewMode === tab.key ? "#EFF6FF" : "#fff",
              color: viewMode === tab.key ? "#2563EB" : "#5F6577",
              fontWeight: viewMode === tab.key ? 800 : 600, fontSize: 13,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {viewMode === "settings" && <DunningTemplateSettings />}

      {viewMode === "table" && <>
      {/* 수금담당 필터 */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
            {collectors.map(c => (
              <button key={c} onClick={() => setFilterCollector(c)}
                style={{ padding: "8px 18px", borderRadius: 8, border: filterCollector === c ? "2px solid #F59E0B" : "1.5px solid #E0E3E9", background: filterCollector === c ? (c === "\uC804\uCCB4" ? "#1A1D23" : "#F59E0B") : "#fff", color: filterCollector === c ? "#fff" : "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {c} {c !== "\uC804\uCCB4" && <span style={{ fontSize: 10, opacity: 0.7 }}>({allMyTenants.filter(t => collectionAssigneeMap[t.building] === c).length})</span>}
              </button>
            ))}
          </div>

          {/* 건물 검색 */}
          <div style={{ marginBottom: 12 }}>
            <input value={buildingSearch} onChange={e => setBuildingSearch(e.target.value)}
              placeholder="건물명 검색 (초성 가능)..."
              style={{ width: isMobile ? "100%" : 280, padding: "9px 14px", borderRadius: 10, border: "1px solid #E0E3E9", fontSize: 13, outline: "none", fontFamily: "inherit", background: "#F9FAFB" }} />
          </div>

          {/* 정렬 & 상태 필터 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#8F95A3", fontWeight: 600, marginRight: 4 }}>정렬:</span>
            {["\uC5F0\uCCB4\uC77C\uC21C", "\uC704\uD5D8\uB3C4\uC21C"].map(m => (
              <button key={m} onClick={() => setSortMode(m)}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  background: sortMode === m ? "#1E40AF" : "#EFF6FF", color: sortMode === m ? "#fff" : "#2563EB",
                  border: `1.5px solid ${sortMode === m ? "#1E40AF" : "#BFDBFE"}` }}>
                {m === "\uC5F0\uCCB4\uC77C\uC21C" ? "📅 연체일순" : "⚡ 위험도순"}
              </button>
            ))}
            <span style={{ fontSize: 11, color: "#8F95A3", fontWeight: 600, marginLeft: 8, marginRight: 4 }}>조치 필터:</span>
            {(() => {
              const danCount = filteredFinal.filter(t => electricCut[rk(t)] === "\uB2E8\uC804").length;
              const warnCount = filteredFinal.filter(t => electricCut[rk(t)] === "\uC704\uD5D8").length;
              const overdueCount = filteredFinal.filter(t => getBalance(t) > 0 && getDaysSinceDue(t) >= 0).length;
              return [
                { id: "\uC804\uCCB4", label: `전체 (${filteredFinal.length})`, bg: "#F3F4F6", activeBg: "#1A1D23", activeColor: "#fff", color: "#5F6577", border: "#E0E3E9", activeBorder: "#1A1D23" },
                { id: "\uB2E8\uC804", label: `⚡ 단전 (${danCount})`, bg: "#FFF1F2", activeBg: "#DC2626", activeColor: "#fff", color: "#DC2626", border: "#FECACA", activeBorder: "#DC2626" },
                { id: "\uC704\uD5D8", label: `⚠ 위험 (${warnCount})`, bg: "#FFFBEB", activeBg: "#F59E0B", activeColor: "#fff", color: "#B45309", border: "#FDE68A", activeBorder: "#F59E0B" },
                { id: "\uC5F0\uCCB4", label: `🚨 연체 (${overdueCount})`, bg: "#FEF2F2", activeBg: "#EA580C", activeColor: "#fff", color: "#EA580C", border: "#FED7AA", activeBorder: "#EA580C" },
              ].map(f => (
                <button key={f.id} onClick={() => setStatusFilter(f.id)}
                  style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                    background: statusFilter === f.id ? f.activeBg : f.bg, color: statusFilter === f.id ? f.activeColor : f.color,
                    border: `1.5px solid ${statusFilter === f.id ? f.activeBorder : f.border}` }}>
                  {f.label}
                </button>
              ));
            })()}
          </div>

          <Card style={{ overflow: "auto" }}>
            {statusFilter !== "\uC804\uCCB4" && (
              <div style={{ padding: "8px 14px", marginBottom: 10, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between",
                background: statusFilter === "\uB2E8\uC804" ? "#FFF1F2" : statusFilter === "\uC704\uD5D8" ? "#FFFBEB" : "#FEF2F2",
                border: `1px solid ${statusFilter === "\uB2E8\uC804" ? "#FECACA" : statusFilter === "\uC704\uD5D8" ? "#FDE68A" : "#FED7AA"}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: statusFilter === "\uB2E8\uC804" ? "#DC2626" : statusFilter === "\uC704\uD5D8" ? "#B45309" : "#EA580C" }}>
                  {statusFilter === "\uB2E8\uC804" ? "⚡" : statusFilter === "\uC704\uD5D8" ? "⚠" : "🚨"} {statusFilter} 필터 적용 중 · {filteredFinal.length}건
                </span>
                <button onClick={() => setStatusFilter("\uC804\uCCB4")} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 10, fontWeight: 700, color: "#5F6577", cursor: "pointer", fontFamily: "inherit" }}>필터 해제</button>
              </div>
            )}
            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {filteredFinal.length === 0 ? (
                  <div style={{ padding: "40px 0", textAlign: "center", color: "#8F95A3", fontSize: 13 }}>해당 조건의 임차인이 없습니다</div>
                ) : visibleFinal.map((t, i) => {
                  const key = rk(t);
                  const lateFee = calcLateFee(t);
                  const bill = calcBill(t);
                  const roomComments = comments[key] || [];
                  const days = getDaysSinceDue(t);
                  return (
                    <Card key={i} onClick={() => setHistoryTarget(t)} style={{ padding: "10px 12px", cursor: "pointer", background: electricCut[key] === "\uB2E8\uC804" ? "#FFF1F2" : electricCut[key] === "\uC704\uD5D8" ? "#FFFBEB" : getBalance(t) > 0 ? "#FEF2F2" : (days >= -6 && days < 0) ? "#FFF5F5" : "transparent" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{t.building} {t.room}호</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23", marginLeft: 6 }}>{t.name}</span>
                        </div>
                        {(() => {
                          const slots = getBillingSlots(t, buildingAccounts, allBuildings);
                          const colors = ["#EA580C", "#92400E", "#2563EB"];
                          return slots.length > 1 ? (
                            <div style={{ textAlign: "right" }}>
                              {slots.map((s, si) => (
                                <div key={si} style={{ fontSize: 11, color: colors[si], fontWeight: 700 }}>{s.label}{fmt(s.amount)}</div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 14, fontWeight: 800, color: lateFee > 0 ? "#DC2626" : "#1A1D23" }}>{fmt(bill)}원</span>
                          );
                        })()}
                      </div>
                      <div style={{ fontSize: 11, color: "#5F6577", marginBottom: 4 }}>
                        월세 {fmt(t.rent)} · 관리비 {fmt(t.mgmt)} · 보증금 {fmt(t.deposit)}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        {getBalance(t) > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#FEF2F2", color: "#DC2626" }}>미납 {fmt(getBalance(t))}</span>}
                        {lateFee > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#FEF2F2", color: "#DC2626" }}>연체료 {fmt(lateFee)}</span>}
                        {lateFeeOverrides[key]?.type === "exclude" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#ECFDF5", color: "#059669" }}>연체료 제외</span>}
                        {lateFeeOverrides[key]?.type === "discount" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#EFF6FF", color: "#2563EB" }}>할인 {fmt(lateFeeOverrides[key].amount)}</span>}
                        <span style={{ fontSize: 10, fontWeight: days > 5 ? 700 : 500, color: days > 5 ? "#DC2626" : days > 0 ? "#EA580C" : "#8F95A3" }}>{days > 0 ? `+${days}일` : days < 0 ? `D${days}` : "오늘"}</span>
                        {electricCut[key] && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: electricCut[key] === "\uB2E8\uC804" ? "#DC2626" : "#F59E0B", color: "#fff" }}>{electricCut[key]}</span>}
                        <a href={`tel:${t.phone}`} style={{ fontSize: 10, color: "#3B82F6", marginLeft: "auto" }}>📞 {t.phone}</a>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button onClick={() => { setCommentTarget(commentTarget === key ? null : key); setCommentText(""); }}
                          style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid #E0E3E9", background: roomComments.length > 0 ? "#EFF6FF" : "#fff", fontSize: 11, fontWeight: 600, color: "#3B82F6", cursor: "pointer", fontFamily: "inherit" }}>
                          💬 코멘트{roomComments.length > 0 ? ` (${roomComments.length})` : ""}
                        </button>
                        <button onClick={() => setElectricCut(prev => { const cur = prev[key]; return { ...prev, [key]: !cur ? "\uC704\uD5D8" : cur === "\uC704\uD5D8" ? "\uB2E8\uC804" : undefined }; })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 11, fontWeight: 600, color: "#5F6577", cursor: "pointer", fontFamily: "inherit" }}>
                          ⚡ 조치
                        </button>
                        {days >= 5 && getRoomType(t.building, t.room) === "\uB2E8\uAE30" && (
                          <button onClick={() => {
                            const cur = lateFeeOverrides[key]?.type;
                            if (!cur) setFeeOverride(key, "exclude");
                            else if (cur === "exclude") setFeeOverride(key, "discount", Math.round((t.rent || 0) * 0.025));
                            else setFeeOverride(key, null);
                          }}
                            style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${lateFeeOverrides[key]?.type === "exclude" ? "#059669" : lateFeeOverrides[key]?.type === "discount" ? "#2563EB" : "#E0E3E9"}`,
                              background: lateFeeOverrides[key]?.type === "exclude" ? "#ECFDF5" : lateFeeOverrides[key]?.type === "discount" ? "#EFF6FF" : "#fff",
                              fontSize: 11, fontWeight: 600, color: lateFeeOverrides[key]?.type === "exclude" ? "#059669" : lateFeeOverrides[key]?.type === "discount" ? "#2563EB" : "#5F6577", cursor: "pointer", fontFamily: "inherit" }}>
                            {lateFeeOverrides[key]?.type === "exclude" ? "제외중" : lateFeeOverrides[key]?.type === "discount" ? "할인중" : "연체료"}
                          </button>
                        )}
                      </div>
                      {commentTarget === key && (
                        <div style={{ marginTop: 8, padding: "8px", background: "#F8FAFC", borderRadius: 8 }}>
                          <div style={{ display: "flex", gap: 6, marginBottom: roomComments.length > 0 ? 8 : 0 }}>
                            <input value={commentText} onChange={e => setCommentText(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && addComment(key, t.name)}
                              placeholder="코멘트 입력..." style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 11, fontFamily: "inherit" }} />
                            <button onClick={() => addComment(key, t.name)} style={{ padding: "6px 12px", borderRadius: 6, background: "#3B82F6", border: "none", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
                          </div>
                          {roomComments.map((c, ci) => (
                            <div key={ci} style={{ padding: "6px 8px", background: "#fff", borderRadius: 4, border: "1px solid #E8ECF0", marginBottom: 4, fontSize: 11 }}>
                              <span style={{ fontWeight: 700, color: "#1A1D23" }}>{c.date}</span> <span style={{ color: "#8F95A3" }}>{c.tenant}</span> — {c.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #E8ECF0" }}>
                    {["조치","건물","호수","이름","연락처","만기일","예치금","월세","관리비","미납","납부일","청구①","청구②","청구③","연체료",""].map((h, i) => (
                      <th key={i} style={{ padding: i >= 11 && i <= 13 ? "8px 10px" : "8px 4px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#8F95A3", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFinal.length === 0 ? (
                    <tr><td colSpan={16} style={{ padding: "40px 20px", textAlign: "center", color: "#8F95A3", fontSize: 13 }}>
                      {statusFilter === "\uB2E8\uC804" ? "⚡ 단전 처리된 임차인이 없습니다" : statusFilter === "\uC704\uD5D8" ? "⚠ 위험 처리된 임차인이 없습니다" : "해당 조건의 임차인이 없습니다"}
                    </td></tr>
                  ) : visibleFinal.map((t, i) => {
                    const key = rk(t);
                    const lateFee = calcLateFee(t);
                    const roomComments = comments[key] || [];
                    const isOpen = commentTarget === key;
                    return (
                      <React.Fragment key={i}>
                        <tr onClick={() => setHistoryTarget(t)} style={{ cursor: "pointer", borderBottom: "1px solid #F0F2F5", background: electricCut[key] === "\uB2E8\uC804" ? "#FFF1F2" : electricCut[key] === "\uC704\uD5D8" ? "#FFFBEB" : getBalance(t) > 0 ? "#FEF2F2" : (getDaysSinceDue(t) >= -6 && getDaysSinceDue(t) < 0) ? "#FFF5F5" : "transparent" }}>
                          <td style={{ padding: "10px 6px", textAlign: "center" }}>
                            <div onClick={() => setElectricCut(prev => {
                              const cur = prev[key];
                              const next = !cur ? "\uC704\uD5D8" : cur === "\uC704\uD5D8" ? "\uB2E8\uC804" : undefined;
                              return { ...prev, [key]: next };
                            })}
                              style={{ width: 44, height: 24, borderRadius: 6, margin: "0 auto", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, transition: "all 0.15s",
                                background: electricCut[key] === "\uB2E8\uC804" ? "#DC2626" : electricCut[key] === "\uC704\uD5D8" ? "#F59E0B" : "#F3F4F6",
                                color: electricCut[key] ? "#fff" : "#B0B5C1",
                                border: `1.5px solid ${electricCut[key] === "\uB2E8\uC804" ? "#DC2626" : electricCut[key] === "\uC704\uD5D8" ? "#F59E0B" : "#D1D5DB"}` }}>
                              {electricCut[key] === "\uB2E8\uC804" ? "단전" : electricCut[key] === "\uC704\uD5D8" ? "위험" : "—"}
                            </div>
                          </td>
                          <td style={{ padding: "8px 4px", fontWeight: 700, fontSize: 11 }}>{t.building}</td>
                          <td style={{ padding: "8px 4px", fontSize: 11 }}>{t.room}</td>
                          <td style={{ padding: "8px 4px", fontWeight: 700, fontSize: 11, maxWidth: 50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.name}>{t.name.length > 5 ? t.name.slice(0, 5) + "\u2026" : t.name}</td>
                          <td style={{ padding: "8px 4px", fontSize: 10 }}><a href={`tel:${t.phone}`} style={{ color: "#3B82F6", textDecoration: "none" }}>{t.phone}</a></td>
                          <td style={{ padding: "8px 4px", fontSize: 10 }}>{(() => { if (!t.expiry) return "-"; const exp = new Date(t.expiry); const diff = Math.ceil((exp.getTime() - new Date().getTime()) / 86400000); return <span style={{ color: diff > 0 ? "#DC2626" : "#1A1D23", fontWeight: 600 }}>{t.expiry.slice(2)}</span>; })()}</td>
                          <td style={{ padding: "8px 4px", textAlign: "right", fontSize: 11 }}>{fmt(t.deposit)}</td>
                          <td style={{ padding: "8px 4px", textAlign: "right", fontSize: 11 }}>{fmt(t.rent)}</td>
                          <td style={{ padding: "8px 4px", textAlign: "right", fontSize: 11, color: t.mgmt > 0 ? "#1A1D23" : "#B0B5C1" }}>{t.mgmt > 0 ? fmt(t.mgmt) : "—"}</td>
                          <td style={{ padding: "8px 4px", textAlign: "right", fontSize: 11 }}>{getBalance(t) > 0 ? <span style={{ fontWeight: 700, color: "#DC2626" }}>{fmt(getBalance(t))}</span> : <span style={{ color: "#B0B5C1" }}>—</span>}</td>
                          <td style={{ padding: "8px 4px", textAlign: "right", fontSize: 11 }}>
                            {(() => { const dueDay = getDueDay(t); const elapsed = getDaysSinceDue(t); return <><span style={{ fontWeight: 600, color: "#5F6577" }}>{dueDay}일</span>{elapsed > 0 && <span style={{ fontSize: 9, color: "#DC2626", fontWeight: 700 }}> +{elapsed}</span>}{elapsed === 0 && <span style={{ fontSize: 9, color: "#F59E0B", fontWeight: 700 }}> D</span>}</>; })()}
                          </td>
                          {(() => {
                            const slots = getBillingSlots(t, buildingAccounts, allBuildings);
                            const colors = ["#EA580C", "#92400E", "#2563EB"];
                            return [0, 1, 2].map(si => (
                              <td key={si} style={{ padding: "8px 10px", textAlign: "right", fontSize: 11 }}>
                                {slots[si] ? <><span style={{ fontWeight: 700, color: colors[si] }}>{fmt(slots[si].amount)}</span>{slots[si].lateFee && slots[si].lateFee! > 0 && <div style={{ fontSize: 9, color: "#DC2626", fontWeight: 600 }}>연체료 {fmt(slots[si].lateFee!)}</div>}</> : <span style={{ color: "#D1D5DB" }}>—</span>}
                              </td>
                            ));
                          })()}
                          <td style={{ padding: "10px 8px", textAlign: "center" }}>
                            {(() => {
                              const days = getDaysSinceDue(t);
                              const isShortTerm = getRoomType(t.building, t.room) === "\uB2E8\uAE30";
                              const override = lateFeeOverrides[key];
                              if (days < 5 || !isShortTerm) return <span style={{ color: "#B0B5C1", fontSize: 11 }}>—</span>;
                              return (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                                  {lateFee > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626" }}>{fmt(lateFee)}</span>}
                                  <button onClick={() => {
                                    if (!override) setFeeOverride(key, "exclude");
                                    else if (override.type === "exclude") setFeeOverride(key, "discount", Math.round((t.rent || 0) * 0.025));
                                    else setFeeOverride(key, null);
                                  }}
                                    style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${override?.type === "exclude" ? "#059669" : override?.type === "discount" ? "#2563EB" : "#D1D5DB"}`,
                                      background: override?.type === "exclude" ? "#ECFDF5" : override?.type === "discount" ? "#EFF6FF" : "#F9FAFB",
                                      fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                      color: override?.type === "exclude" ? "#059669" : override?.type === "discount" ? "#2563EB" : "#8F95A3" }}>
                                    {override?.type === "exclude" ? "제외" : override?.type === "discount" ? `할인 ${fmt(override.amount)}` : "5%적용"}
                                  </button>
                                </div>
                              );
                            })()}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "center" }}>
                            <button onClick={() => { setCommentTarget(isOpen ? null : key); setCommentText(""); }}
                              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E0E3E9", background: roomComments.length > 0 ? "#EFF6FF" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, color: "#3B82F6" }}>
                              💬{roomComments.length > 0 ? ` ${roomComments.length}` : ""}
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr><td colSpan={16} style={{ padding: 0 }}>
                            <div style={{ padding: "12px 16px", background: "#F8FAFC", borderBottom: "2px solid #E0E3E9" }}>
                              <div style={{ display: "flex", gap: 8, marginBottom: roomComments.length > 0 ? 12 : 0 }}>
                                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                                  onKeyDown={e => e.key === "Enter" && addComment(key, t.name)}
                                  placeholder={`${t.building} ${t.room} 수금 코멘트 입력...`}
                                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #D1D5DB", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                                <button onClick={() => addComment(key, t.name)}
                                  style={{ padding: "8px 16px", borderRadius: 8, background: "#3B82F6", border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
                              </div>
                              {roomComments.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#8F95A3", marginBottom: 2 }}>📋 {t.building} {t.room} 호실 코멘트 이력</div>
                                  {roomComments.map((c, ci) => (
                                    <div key={ci} style={{ display: "flex", gap: 10, padding: "8px 10px", background: "#fff", borderRadius: 6, border: "1px solid #E8ECF0" }}>
                                      <div style={{ flexShrink: 0, minWidth: 80 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#1A1D23" }}>{c.date}</div>
                                        <div style={{ fontSize: 10, color: c.tenant === t.name ? "#3B82F6" : "#9333EA", fontWeight: 600 }}>
                                          {c.tenant}{c.tenant !== t.name && !c.tenant.includes("(전)") ? " (이전)" : ""}
                                        </div>
                                      </div>
                                      <div style={{ fontSize: 12, color: "#3D4251", lineHeight: 1.5 }}>{c.text}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td></tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
      </>}
    </div>
  );
};
