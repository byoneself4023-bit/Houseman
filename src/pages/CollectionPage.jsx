import React, { useState, useMemo } from 'react';
import { buildings } from '../data';
import { getRoomType, collectionAssigneeMap, initialStaffMembers } from '../config';

import { useIsMobile, fmt } from '../utils';
import { matchKorean } from '../utils/koreanSearch';
import { Card, SectionTitle, Table, StatusBadge } from '../components';
import { useLocalStorage } from '../utils/useLocalStorage';

const rk = (t) => `${t.building}_${t.room}`;

export const CollectionPage = ({ myBuildings = [], activeTenants = [] }) => {
  const isMobile = useIsMobile();
  const [commentTarget, setCommentTarget] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [electricCut, setElectricCut] = useLocalStorage("hm_electricCut", {});
  const [commentFilter, setCommentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
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
  const getDueDay = (t) => parseInt(t.due.split("/")[1]);
  const _now = new Date();
  const today = _now.getDate();
  const daysInMonth = new Date(_now.getFullYear(), _now.getMonth() + 1, 0).getDate();
  const getDaysSinceDue = (t) => {
    const dueDay = getDueDay(t);
    let diff = today - dueDay;
    if (diff < -daysInMonth / 2) diff += daysInMonth; // wrapped from prev month
    return diff; // positive = overdue, negative = upcoming
  };

  const calcLateFee = (t) => t.overdueDays >= 5 ? Math.round(t.rent * 0.05) : 0;
  const calcBill = (t) => t.rent + t.mgmt + calcLateFee(t);
  const filteredFinal = useMemo(() => {
    const baseTenants = filterCollector === "전체"
      ? allMyTenants.filter(t => getRoomType(t.building, t.room) === "단기")
      : allMyTenants.filter(t => collectionAssigneeMap[t.building] === filterCollector);
    const filteredByBuilding = buildingSearch
      ? baseTenants.filter(t => matchKorean(t.building, buildingSearch))
      : baseTenants;

    // Filter: show only those whose due day passed or within 2 days before
    const filteredVisible = filteredByBuilding.filter(t => getDaysSinceDue(t) >= -2);

    // Sort: 1) prevUnpaid highest 2) has billing 3) due day overdue longest
    const sorted = [...filteredVisible].sort((a, b) => {
      if (b.prevUnpaid !== a.prevUnpaid) return b.prevUnpaid - a.prevUnpaid;
      const aBill = calcBill(a) > 0 ? 1 : 0;
      const bBill = calcBill(b) > 0 ? 1 : 0;
      if (bBill !== aBill) return bBill - aBill;
      return getDaysSinceDue(b) - getDaysSinceDue(a);
    });
    if (statusFilter === "전체") return sorted;
    if (statusFilter === "연체") return sorted.filter(t => t.prevUnpaid > 0 || t.overdueDays > 0);
    return sorted.filter(t => electricCut[rk(t)] === statusFilter);
  }, [allMyTenants, filterCollector, buildingSearch, statusFilter, electricCut]);

  const addComment = (key, tenant) => {
    if (!commentText.trim()) return;
    setComments(prev => ({ ...prev, [key]: [{ date: "2026-02-22", tenant, text: commentText.trim() }, ...(prev[key] || [])] }));
    setCommentText("");
    setCommentTarget(null);
  };

  const allComments = Object.entries(comments).flatMap(([key, cmts]) => {
    const [bld, rm] = key.split("_");
    return cmts.map(c => ({ ...c, building: bld, room: rm, key }));
  }).sort((a, b) => b.date.localeCompare(a.date));
  const filteredComments = commentFilter ? allComments.filter(c => c.building.includes(commentFilter) || c.room.includes(commentFilter) || c.tenant.includes(commentFilter)) : allComments;

  return (
    <div>
      <SectionTitle sub={filterCollector === "전체" ? "단기 임차인 수금 현황" : `${filterCollector} 전담 · ${filteredFinal.length}명`}>💰 수금 관리</SectionTitle>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {collectors.map(c => (
            <button key={c} onClick={() => { setFilterCollector(c); setViewMode("table"); }}
              style={{ padding: "8px 18px", borderRadius: 8, border: filterCollector === c && viewMode === "table" ? "2px solid #F59E0B" : "1.5px solid #E0E3E9", background: filterCollector === c && viewMode === "table" ? (c === "전체" ? "#1A1D23" : "#F59E0B") : "#fff", color: filterCollector === c && viewMode === "table" ? "#fff" : "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              {c} {c !== "전체" && <span style={{ fontSize: 10, opacity: 0.7 }}>({allMyTenants.filter(t => collectionAssigneeMap[t.building] === c).length})</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setViewMode(viewMode === "comments" ? "table" : "comments")}
          style={{ padding: "8px 16px", borderRadius: 8, border: viewMode === "comments" ? "2px solid #7C3AED" : "1.5px solid #E0E3E9", background: viewMode === "comments" ? "#7C3AED" : "#fff", color: viewMode === "comments" ? "#fff" : "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          📝 코멘트 모아보기 {allComments.length > 0 && <span style={{ background: viewMode === "comments" ? "rgba(255,255,255,0.3)" : "#EFF6FF", color: viewMode === "comments" ? "#fff" : "#3B82F6", padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>{allComments.length}</span>}
        </button>
      </div>

      {/* 건물 검색 */}
      {viewMode === "table" && (
        <div style={{ marginBottom: 12 }}>
          <input value={buildingSearch} onChange={e => setBuildingSearch(e.target.value)}
            placeholder="건물명 검색 (초성 가능)..."
            style={{ width: isMobile ? "100%" : 280, padding: "9px 14px", borderRadius: 10, border: "1px solid #E0E3E9", fontSize: 13, outline: "none", fontFamily: "inherit", background: "#F9FAFB" }} />
        </div>
      )}

      {/* 상태 필터 */}
      {viewMode === "table" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#8F95A3", fontWeight: 600, marginRight: 4 }}>조치 필터:</span>
          {(() => {
            const danCount = filteredFinal.filter(t => electricCut[rk(t)] === "단전").length;
            const warnCount = filteredFinal.filter(t => electricCut[rk(t)] === "위험").length;
            const overdueCount = filteredFinal.filter(t => t.prevUnpaid > 0 || t.overdueDays > 0).length;
            return [
              { id: "전체", label: `전체 (${filteredFinal.length})`, bg: "#F3F4F6", activeBg: "#1A1D23", activeColor: "#fff", color: "#5F6577", border: "#E0E3E9", activeBorder: "#1A1D23" },
              { id: "단전", label: `⚡ 단전 (${danCount})`, bg: "#FFF1F2", activeBg: "#DC2626", activeColor: "#fff", color: "#DC2626", border: "#FECACA", activeBorder: "#DC2626" },
              { id: "위험", label: `⚠ 위험 (${warnCount})`, bg: "#FFFBEB", activeBg: "#F59E0B", activeColor: "#fff", color: "#B45309", border: "#FDE68A", activeBorder: "#F59E0B" },
              { id: "연체", label: `🚨 연체 (${overdueCount})`, bg: "#FEF2F2", activeBg: "#EA580C", activeColor: "#fff", color: "#EA580C", border: "#FED7AA", activeBorder: "#EA580C" },
            ].map(f => (
              <button key={f.id} onClick={() => setStatusFilter(f.id)}
                style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  background: statusFilter === f.id ? f.activeBg : f.bg,
                  color: statusFilter === f.id ? f.activeColor : f.color,
                  border: `1.5px solid ${statusFilter === f.id ? f.activeBorder : f.border}` }}>
                {f.label}
              </button>
            ));
          })()}
        </div>
      )}

      {viewMode === "comments" ? (
        <div>
          <div style={{ marginBottom: 12 }}>
            <input value={commentFilter} onChange={e => setCommentFilter(e.target.value)}
              placeholder="건물명, 호수, 이름으로 검색..."
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
          </div>
          {filteredComments.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#B0B5C1", fontSize: 13 }}>코멘트가 없습니다</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredComments.map((c, i) => (
                <Card key={i} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#1A1D23" }}>{c.building} {c.room}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: c.tenant.includes("(전)") ? "#F3E8FF" : "#F3F4F6", color: c.tenant.includes("(전)") ? "#7C3AED" : "#5F6577", fontWeight: 600 }}>{c.tenant}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#8F95A3" }}>{c.date}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#3D4251", lineHeight: 1.5 }}>{c.text}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
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
              ) : filteredFinal.map((t, i) => {
                const key = rk(t);
                const lateFee = calcLateFee(t);
                const bill = calcBill(t);
                const roomComments = comments[key] || [];
                const days = getDaysSinceDue(t);
                return (
                  <Card key={i} style={{ padding: "10px 12px", background: electricCut[key] === "단전" ? "#FFF1F2" : electricCut[key] === "위험" ? "#FFFBEB" : t.prevUnpaid > 0 ? "#FEF2F2" : "transparent" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{t.building} {t.room}호</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23", marginLeft: 6 }}>{t.name}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: lateFee > 0 ? "#DC2626" : "#1A1D23" }}>{fmt(bill)}원</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#5F6577", marginBottom: 4 }}>
                      월세 {fmt(t.rent)} · 관리비 {fmt(t.mgmt)} · 보증금 {fmt(t.deposit)}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      {t.prevUnpaid > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#FEF2F2", color: "#DC2626" }}>미납 {fmt(t.prevUnpaid)}</span>}
                      {lateFee > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#FEF2F2", color: "#DC2626" }}>연체료 {fmt(lateFee)}</span>}
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
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E8ECF0" }}>
                {["조치","건물명","호수","이름","연락처","만기일","예치금","월세","관리비","전월미납","입주일","당월청구액",""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 8px", textAlign: i >= 6 ? "right" : i === 0 ? "center" : "left", fontSize: 11, fontWeight: 700, color: "#8F95A3", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFinal.length === 0 ? (
                <tr><td colSpan={13} style={{ padding: "40px 20px", textAlign: "center", color: "#8F95A3", fontSize: 13 }}>
                  {statusFilter === "단전" ? "⚡ 단전 처리된 임차인이 없습니다" : statusFilter === "위험" ? "⚠ 위험 처리된 임차인이 없습니다" : "🚨 연체 임차인이 없습니다"}
                </td></tr>
              ) : filteredFinal.map((t, i) => {
                const key = rk(t);
                const lateFee = calcLateFee(t);
                const bill = calcBill(t);
                const roomComments = comments[key] || [];
                const isOpen = commentTarget === key;
                return (
                  <React.Fragment key={i}>
                    <tr style={{ borderBottom: "1px solid #F0F2F5", background: electricCut[key] === "단전" ? "#FFF1F2" : electricCut[key] === "위험" ? "#FFFBEB" : t.prevUnpaid > 0 ? "#FEF2F2" : t.overdueDays >= 5 ? "#FFFBEB" : "transparent" }}>
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
                      <td style={{ padding: "10px 8px", fontWeight: 700 }}>{t.building}</td>
                      <td style={{ padding: "10px 8px" }}>{t.room}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 700 }}>{t.name}</td>
                      <td style={{ padding: "10px 8px" }}><a href={`tel:${t.phone}`} style={{ color: "#3B82F6", textDecoration: "none" }}>{t.phone}</a></td>
                      <td style={{ padding: "10px 8px" }}>{(() => { if (!t.expiry) return "-"; const exp = new Date(t.expiry); const diff = Math.ceil((exp - new Date()) / 86400000); return <span style={{ color: diff < 30 ? "#DC2626" : diff < 90 ? "#EA580C" : "#5F6577", fontWeight: diff < 30 ? 800 : 600 }}>{t.expiry.slice(2)}{diff < 30 ? ` (${diff}일)` : ""}</span>; })()}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>{fmt(t.deposit)}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>{fmt(t.rent)}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", color: t.mgmt > 0 ? "#1A1D23" : "#B0B5C1" }}>{t.mgmt > 0 ? fmt(t.mgmt) : "—"}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>{t.prevUnpaid > 0 ? <span style={{ fontWeight: 700, color: "#DC2626" }}>{fmt(t.prevUnpaid)}</span> : <span style={{ color: "#B0B5C1" }}>—</span>}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>
                        {(() => { const days = getDaysSinceDue(t); const dueDay = getDueDay(t); return <span style={{ fontSize: 12, fontWeight: days > 0 ? 700 : 600, color: days > 5 ? "#DC2626" : days > 0 ? "#EA580C" : "#5F6577" }}>{dueDay}일{days > 0 ? ` (+${days})` : days < 0 ? ` (D${days})` : " (오늘)"}</span>; })()}
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>
                        <span style={{ fontWeight: 800, color: lateFee > 0 ? "#DC2626" : "#1A1D23", fontSize: 13 }}>{fmt(bill)}</span>
                        {lateFee > 0 && <div style={{ fontSize: 9, color: "#DC2626" }}>연체료 {fmt(lateFee)} 포함</div>}
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "center" }}>
                        <button onClick={() => { setCommentTarget(isOpen ? null : key); setCommentText(""); }}
                          style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E0E3E9", background: roomComments.length > 0 ? "#EFF6FF" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, color: "#3B82F6" }}>
                          💬{roomComments.length > 0 ? ` ${roomComments.length}` : ""}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr><td colSpan={13} style={{ padding: 0 }}>
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
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#8F95A3", marginBottom: 2 }}>📋 {t.building} {t.room} 호실 코멘트 이력 (임차인 변경 포함)</div>
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
      )}
    </div>
  );
};
