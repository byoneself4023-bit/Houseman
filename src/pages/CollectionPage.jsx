import React, { useState, useMemo, useEffect } from 'react';
import { buildings, billingTypeMap } from '../data';
import { getRoomType, collectionAssigneeMap, initialStaffMembers } from '../config';

import { useIsMobile, fmt } from '../utils';
import { matchKorean } from '../utils/koreanSearch';
import { Card, SectionTitle, Table, StatusBadge, DunningTemplateSettings } from '../components';
import { useLocalStorage } from '../utils/useLocalStorage';

const rk = (t) => `${t.building}_${t.room}`;

// 계좌 모드별 청구 분할 계산
const getBillingSlots = (t, buildingAccounts, allBuildings) => {
  // 통합관리대장에서 업로드된 실제 청구 금액이 있으면 우선 사용
  // 통합관리대장에서 올라온 데이터면 G~J열 값만 사용
  if (t.fromLedger) {
    const bill1 = (t.prevBillOwner || 0) + (t.curBillOwner || 0);
    const bill2 = (t.prevBillHM || 0) + (t.curBillHM || 0) + (t.lateFeeAmount || 0);
    const slots = [];
    if (bill1) slots.push({ label: "①", amount: bill1 });
    if (bill2) slots.push({ label: "②", amount: bill2, lateFee: t.lateFeeAmount || 0 });
    return slots;
  }

  const bldg = allBuildings.find(b => b.name === t.building);
  const bTypes = (bldg?.type || "단기").split("+").map(s => s.trim());
  const roomType = getRoomType(t.building, t.room);
  const roomAcctType = roomType === "기업시설관리" ? "관리사무소" : roomType;
  const typeIdx = bTypes.findIndex(bt => (bt === "기업시설관리" ? "관리사무소" : bt) === roomAcctType);
  const suffix = typeIdx >= 0 ? String(typeIdx + 1) : "1";
  const bAccts = buildingAccounts[t.building] || {};
  const roomKey = `${t.building}_${t.room}`;
  const roomOverride = buildingAccounts[roomKey];
  const mode = roomOverride?.mode || bAccts[`mode${suffix}`] || "";
  const rent = t.rent || 0;
  const mgmt = t.mgmt || 0;
  if (mode === "houseman" || mode === "hm_owner1" || mode === "gs1") return [{ label: "①", amount: rent + mgmt }];
  if (mode === "owner1" || mode === "gs2a") return [{ label: "①", amount: rent }, { label: "②", amount: mgmt }];
  if (mode === "owner2" || mode === "gs2b") return [{ label: "①", amount: rent + mgmt }, { label: "②", amount: 0 }];
  if (mode === "gs3") return [{ label: "①", amount: rent }, { label: "②", amount: mgmt }, { label: "③", amount: 0 }];
  return [{ label: "①", amount: rent + mgmt }];
};

export const CollectionPage = ({ myBuildings = [], activeTenants = [], roomBalances = {}, lateFeeOverrides = {}, setLateFeeOverrides, buildingAccounts = {}, allBuildings = [], billingHistory = [] }) => {
  const isMobile = useIsMobile();
  const [historyTarget, setHistoryTarget] = useState(null);
  const [commentTarget, setCommentTarget] = useState(null);
  const [visibleCount, setVisibleCount] = useState(40);
  const [commentText, setCommentText] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [electricCut, setElectricCut] = useLocalStorage("hm_electricCut", {});
  const [statusFilter, setStatusFilter] = useState("전체");
  const [sortMode, setSortMode] = useState("연체일순");
  const [filterCollector, setFilterCollector] = useState("전체");
  const [buildingSearch, setBuildingSearch] = useState("");
  const [staffList] = useLocalStorage("hm_staffList", initialStaffMembers);
  const collectionStaff = staffList.filter(s => s.roles.includes("collection")).map(s => s.name);
  const collectors = ["전체", ...collectionStaff];
  const allMyTenants = myBuildings.length > 0 ? activeTenants.filter(t => myBuildings.includes(t.building)) : activeTenants;
  const [comments, setComments] = useLocalStorage("hm_comments", {
    "모던라이프_501": [{ date: "2026-02-23", tenant: "이보람", text: "2/25일에 납부한데서 최소 200만원은 되야한다함" }],
    "지앤지2_401": [{ date: "2026-02-23", tenant: "박종호", text: "[유은혜관리] 보증금 2억으로 충분하나 수금 원칙상 독촉 진행" }],
    "한스텔_104": [{ date: "2026-02-23", tenant: "김균엽", text: "(매달 4일 납부. 5일엔 연체수수료)" }],
    "미래홈_104": [{ date: "2026-02-23", tenant: "김혜순", text: "2/14 9시 35분 오병천으로 10만원 입금, 나머지 2/25까지 완납약속" }],
    "에덴빌_301": [{ date: "2026-02-23", tenant: "정소정", text: "2/25에 납부한데서 오전까지는 하라함" }],
    "미래홈_203": [{ date: "2026-02-23", tenant: "이호경", text: "3/15퇴실, 2/23부터 25까지 완납약속. 총 596,460원중 20만원은 보증금" }],
    "지앤지2_201": [{ date: "2026-02-23", tenant: "김기용", text: "<15일납부> 설지나고 납부날짜 다시연락준다함" }],
    "굿모닝빌_304": [{ date: "2026-02-23", tenant: "박성욱", text: "급여날짜 10일 [11일 연체수수료 부과], 급여 밀려서 설끝나고 최대한빨리준다함" }],
    "메종빌_202": [{ date: "2026-02-23", tenant: "박채린", text: "2/24 완납약속인데 3/8에는 이제 퇴실하라함" }],
    "W하우스_503": [{ date: "2026-02-23", tenant: "김현우", text: "(카톡) 2/22까지 30만원 분납후 25일까지 완납약속" }],
    "W하우스_302": [{ date: "2026-02-23", tenant: "권소정", text: "<납부일 20일로 변경> 미납3일차 수수료부과" }],
    "다존하우스_203": [{ date: "2026-02-23", tenant: "박건희", text: "공과금만 2/28까지 완납약속. 월급이 늦어졌다함" }],
    "다존하우스_305": [{ date: "2026-02-23", tenant: "최서연", text: "번호 카톡 다사라짐 방문해서 연락처 알려달라하기" }],
    "리트코하우스_502": [{ date: "2026-02-23", tenant: "박소현", text: "계약서대로면 20일 납부일이라 수수료4일차 아니냐고함, 2/23 완납약속" }],
    "모닝빌_305": [{ date: "2026-02-23", tenant: "조병익", text: "2/16 60만원 납부후 3/10 3월월세랑 같이 납부한다함, 미납 10일차" }],
    "스타빌_403": [{ date: "2026-02-23", tenant: "송예준", text: "1/14까지 완납한다는데 12일에 30만원이상분납안되면 퇴실되야한다함" }],
    "메종빌_301": [{ date: "2026-02-23", tenant: "최기연", text: "2월까지 한달더 연장한다고함, 1/26까지 완납안되면 연장 어렵다함" }],
    "메종빌_601": [{ date: "2026-02-23", tenant: "박수연", text: "2/20 40만원 선납먼저함" }],
    "W하우스_601": [{ date: "2026-02-23", tenant: "서은기", text: "12/18 완납약속" }],
    "리트코하우스_606": [{ date: "2026-02-23", tenant: "문열매", text: "2/25까지 완납하라함" }],
  });


  // due is "M/D" format → extract day as rent day
  const getDueDay = (t) => {
    if (!t.due || !t.due.includes("/")) return 0;
    return parseInt(t.due.split("/")[1]) || 0;
  };
  const _now = new Date();
  const today = _now.getDate();
  const daysInMonth = new Date(_now.getFullYear(), _now.getMonth() + 1, 0).getDate();
  const getDaysSinceDue = (t) => {
    const dueDay = getDueDay(t);
    if (!dueDay) return 0;
    let diff = today - dueDay;
    if (diff < -daysInMonth / 2) diff += daysInMonth;
    return diff;
  };

  const getBalance = (t) => {
    // 통합관리대장 데이터면 임차인 데이터에서 직접 계산
    if (t.fromLedger) {
      return (t.prevBillOwner || 0) + (t.curBillOwner || 0) + (t.prevBillHM || 0) + (t.curBillHM || 0) + (t.lateFeeAmount || 0);
    }
    // 기존 데이터
    return roomBalances[rk(t)] || 0;
  };
  const calcLateFee = (t) => {
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
  const calcBill = (t) => t.rent + t.mgmt + calcLateFee(t);

  const setFeeOverride = (key, type, amount) => {
    if (!setLateFeeOverrides) return;
    if (!type) {
      setLateFeeOverrides(prev => { const next = { ...prev }; delete next[key]; return next; });
    } else {
      setLateFeeOverrides(prev => ({ ...prev, [key]: { type, amount: amount || 0, date: new Date().toISOString().slice(0, 10) } }));
    }
  };

  const filteredFinal = useMemo(() => {
    const baseTenants = filterCollector === "전체"
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
      // 디버그: 에덴빌 301
      if (t.building === "에덴빌" && t.room === "301") {
        console.log("에덴빌301 디버그:", { fromLedger: t.fromLedger, due: t.due, days, balance, totalBill, slots, curBillHM: t.curBillHM, prevBillHM: t.prevBillHM });
      }
      // 퇴실자 제외
      if (t.name === "퇴실" || t.status === "퇴실") return false;
      // 통합관리대장 데이터: 청구금액이 있으면 무조건 표시
      if (t.fromLedger && totalBill > 0) return true;
      // 잔액이 있고 월세일 지남
      if (balance > 0 && days >= 0) return true;
      // 청구 예정 (월세일 2일 전)
      if (totalBill > 0 && days >= -2) return true;
      return false;
    });
    const getRisk = (t) => {
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
      // 잔액 있는 사람 먼저
      if ((balA > 0) !== (balB > 0)) return balA > 0 ? -1 : 1;
      // 둘 다 잔액 있으면 연체일 많은 순
      if (balA > 0 && balB > 0) {
        if (sortMode === "위험도순") return getRisk(b) - getRisk(a);
        return getDaysSinceDue(b) - getDaysSinceDue(a);
      }
      // 둘 다 잔액 없으면 청구일 가까운 순
      return getDaysSinceDue(b) - getDaysSinceDue(a);
    });
    if (statusFilter === "전체") return sorted;
    if (statusFilter === "연체") return sorted.filter(t => getBalance(t) > 0 && getDaysSinceDue(t) >= 0);
    return sorted.filter(t => electricCut[rk(t)] === statusFilter);
  }, [allMyTenants, filterCollector, buildingSearch, statusFilter, electricCut, sortMode, roomBalances]);

  useEffect(() => { setVisibleCount(40); }, [filterCollector, buildingSearch, statusFilter]);
  const visibleFinal = useMemo(() => filteredFinal.slice(0, visibleCount), [filteredFinal, visibleCount]);

  const addComment = (key, tenant) => {
    if (!commentText.trim()) return;
    setComments(prev => ({ ...prev, [key]: [{ date: new Date().toISOString().slice(0, 10), tenant, text: commentText.trim() }, ...(prev[key] || [])] }));
    setCommentText("");
    setCommentTarget(null);
  };

  // ===== 렌더링 =====
  // 청구 이력 데이터
  const historyData = useMemo(() => {
    if (!historyTarget) return [];
    const key = rk(historyTarget);
    return billingHistory
      .filter(h => `${h.building}_${h.room}` === key)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
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

      <SectionTitle sub={filterCollector === "전체" ? "수금 관리" : `${filterCollector} 전담 · ${filteredFinal.length}명`}>💰 수금 관리</SectionTitle>

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
                style={{ padding: "8px 18px", borderRadius: 8, border: filterCollector === c ? "2px solid #F59E0B" : "1.5px solid #E0E3E9", background: filterCollector === c ? (c === "전체" ? "#1A1D23" : "#F59E0B") : "#fff", color: filterCollector === c ? "#fff" : "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {c} {c !== "전체" && <span style={{ fontSize: 10, opacity: 0.7 }}>({allMyTenants.filter(t => collectionAssigneeMap[t.building] === c).length})</span>}
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
            {["연체일순", "위험도순"].map(m => (
              <button key={m} onClick={() => setSortMode(m)}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  background: sortMode === m ? "#1E40AF" : "#EFF6FF", color: sortMode === m ? "#fff" : "#2563EB",
                  border: `1.5px solid ${sortMode === m ? "#1E40AF" : "#BFDBFE"}` }}>
                {m === "연체일순" ? "📅 연체일순" : "⚡ 위험도순"}
              </button>
            ))}
            <span style={{ fontSize: 11, color: "#8F95A3", fontWeight: 600, marginLeft: 8, marginRight: 4 }}>조치 필터:</span>
            {(() => {
              const danCount = filteredFinal.filter(t => electricCut[rk(t)] === "단전").length;
              const warnCount = filteredFinal.filter(t => electricCut[rk(t)] === "위험").length;
              const overdueCount = filteredFinal.filter(t => getBalance(t) > 0 && getDaysSinceDue(t) >= 0).length;
              return [
                { id: "전체", label: `전체 (${filteredFinal.length})`, bg: "#F3F4F6", activeBg: "#1A1D23", activeColor: "#fff", color: "#5F6577", border: "#E0E3E9", activeBorder: "#1A1D23" },
                { id: "단전", label: `⚡ 단전 (${danCount})`, bg: "#FFF1F2", activeBg: "#DC2626", activeColor: "#fff", color: "#DC2626", border: "#FECACA", activeBorder: "#DC2626" },
                { id: "위험", label: `⚠ 위험 (${warnCount})`, bg: "#FFFBEB", activeBg: "#F59E0B", activeColor: "#fff", color: "#B45309", border: "#FDE68A", activeBorder: "#F59E0B" },
                { id: "연체", label: `🚨 연체 (${overdueCount})`, bg: "#FEF2F2", activeBg: "#EA580C", activeColor: "#fff", color: "#EA580C", border: "#FED7AA", activeBorder: "#EA580C" },
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
            {statusFilter !== "전체" && (
              <div style={{ padding: "8px 14px", marginBottom: 10, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between",
                background: statusFilter === "단전" ? "#FFF1F2" : statusFilter === "위험" ? "#FFFBEB" : "#FEF2F2",
                border: `1px solid ${statusFilter === "단전" ? "#FECACA" : statusFilter === "위험" ? "#FDE68A" : "#FED7AA"}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: statusFilter === "단전" ? "#DC2626" : statusFilter === "위험" ? "#B45309" : "#EA580C" }}>
                  {statusFilter === "단전" ? "⚡" : statusFilter === "위험" ? "⚠" : "🚨"} {statusFilter} 필터 적용 중 · {filteredFinal.length}건
                </span>
                <button onClick={() => setStatusFilter("전체")} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 10, fontWeight: 700, color: "#5F6577", cursor: "pointer", fontFamily: "inherit" }}>필터 해제</button>
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
                    <Card key={i} onClick={() => setHistoryTarget(t)} style={{ padding: "10px 12px", cursor: "pointer", background: electricCut[key] === "단전" ? "#FFF1F2" : electricCut[key] === "위험" ? "#FFFBEB" : getBalance(t) > 0 ? "#FEF2F2" : (days >= -6 && days < 0) ? "#FFF5F5" : "transparent" }}>
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
                        {electricCut[key] && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: electricCut[key] === "단전" ? "#DC2626" : "#F59E0B", color: "#fff" }}>{electricCut[key]}</span>}
                        <a href={`tel:${t.phone}`} style={{ fontSize: 10, color: "#3B82F6", marginLeft: "auto" }}>📞 {t.phone}</a>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button onClick={() => { setCommentTarget(commentTarget === key ? null : key); setCommentText(""); }}
                          style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid #E0E3E9", background: roomComments.length > 0 ? "#EFF6FF" : "#fff", fontSize: 11, fontWeight: 600, color: "#3B82F6", cursor: "pointer", fontFamily: "inherit" }}>
                          💬 코멘트{roomComments.length > 0 ? ` (${roomComments.length})` : ""}
                        </button>
                        <button onClick={() => setElectricCut(prev => { const cur = prev[key]; return { ...prev, [key]: !cur ? "위험" : cur === "위험" ? "단전" : undefined }; })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 11, fontWeight: 600, color: "#5F6577", cursor: "pointer", fontFamily: "inherit" }}>
                          ⚡ 조치
                        </button>
                        {days >= 5 && getRoomType(t.building, t.room) === "단기" && (
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
                      {statusFilter === "단전" ? "⚡ 단전 처리된 임차인이 없습니다" : statusFilter === "위험" ? "⚠ 위험 처리된 임차인이 없습니다" : "해당 조건의 임차인이 없습니다"}
                    </td></tr>
                  ) : visibleFinal.map((t, i) => {
                    const key = rk(t);
                    const lateFee = calcLateFee(t);
                    const roomComments = comments[key] || [];
                    const isOpen = commentTarget === key;
                    return (
                      <React.Fragment key={i}>
                        <tr onClick={() => setHistoryTarget(t)} style={{ cursor: "pointer", borderBottom: "1px solid #F0F2F5", background: electricCut[key] === "단전" ? "#FFF1F2" : electricCut[key] === "위험" ? "#FFFBEB" : getBalance(t) > 0 ? "#FEF2F2" : (getDaysSinceDue(t) >= -6 && getDaysSinceDue(t) < 0) ? "#FFF5F5" : "transparent" }}>
                          <td style={{ padding: "10px 6px", textAlign: "center" }}>
                            <div onClick={() => setElectricCut(prev => {
                              const cur = prev[key];
                              const next = !cur ? "위험" : cur === "위험" ? "단전" : null;
                              return { ...prev, [key]: next || undefined };
                            })}
                              style={{ width: 44, height: 24, borderRadius: 6, margin: "0 auto", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, transition: "all 0.15s",
                                background: electricCut[key] === "단전" ? "#DC2626" : electricCut[key] === "위험" ? "#F59E0B" : "#F3F4F6",
                                color: electricCut[key] ? "#fff" : "#B0B5C1",
                                border: `1.5px solid ${electricCut[key] === "단전" ? "#DC2626" : electricCut[key] === "위험" ? "#F59E0B" : "#D1D5DB"}` }}>
                              {electricCut[key] === "단전" ? "단전" : electricCut[key] === "위험" ? "위험" : "—"}
                            </div>
                          </td>
                          <td style={{ padding: "8px 4px", fontWeight: 700, fontSize: 11 }}>{t.building}</td>
                          <td style={{ padding: "8px 4px", fontSize: 11 }}>{t.room}</td>
                          <td style={{ padding: "8px 4px", fontWeight: 700, fontSize: 11, maxWidth: 50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.name}>{t.name.length > 5 ? t.name.slice(0, 5) + "…" : t.name}</td>
                          <td style={{ padding: "8px 4px", fontSize: 10 }}><a href={`tel:${t.phone}`} style={{ color: "#3B82F6", textDecoration: "none" }}>{t.phone}</a></td>
                          <td style={{ padding: "8px 4px", fontSize: 10 }}>{(() => { if (!t.expiry) return "-"; const exp = new Date(t.expiry); const diff = Math.ceil((exp - new Date()) / 86400000); return <span style={{ color: diff > 0 ? "#DC2626" : "#1A1D23", fontWeight: 600 }}>{t.expiry.slice(2)}</span>; })()}</td>
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
                                {slots[si] ? <><span style={{ fontWeight: 700, color: colors[si] }}>{fmt(slots[si].amount)}</span>{slots[si].lateFee > 0 && <div style={{ fontSize: 9, color: "#DC2626", fontWeight: 600 }}>연체료 {fmt(slots[si].lateFee)}</div>}</> : <span style={{ color: "#D1D5DB" }}>—</span>}
                              </td>
                            ));
                          })()}
                          <td style={{ padding: "10px 8px", textAlign: "center" }}>
                            {(() => {
                              const days = getDaysSinceDue(t);
                              const isShortTerm = getRoomType(t.building, t.room) === "단기";
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
