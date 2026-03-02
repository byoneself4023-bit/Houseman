import { useState, useMemo } from 'react';
import { buildingFloors } from '../data';
import { useIsMobile, fmt } from '../utils';
import { matchKorean } from '../utils/koreanSearch';
import { Card, SectionTitle, Table, StatusBadge } from '../components';

export const VacancyPage = ({ myBuildings = [], calendarEvts = [], setCalendarEvts, setPage, setPendingContract, activeVacancies = [], setActiveVacancies, buildingData = {}, activeTenants = [], setActiveTenants, pastTenantsData = {} }) => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("전체");
  const [showPrint, setShowPrint] = useState(false);
  const [reportModal, setReportModal] = useState(null);
  const [editRow, setEditRow] = useState(null); // "building_room" key of row being edited
  const types = ["전체", "점검/청소중", "홍보중", "계약서입력"];

  const updateVacancy = (v, patch) => {
    setActiveVacancies(prev => prev.map(x =>
      x.building === v.building && x.room === v.room ? { ...x, ...patch } : x
    ));
  };

  const rowKey = (r) => `${r.building}_${r.room}`;

  const handleEditSave = (r) => {
    const g = (id) => document.getElementById(id)?.value;
    const rk = rowKey(r);
    const patch = {};
    const fields = [
      { id: `ve-${rk}-commEvent`, key: "commEvent", num: false },
      { id: `ve-${rk}-commBroker`, key: "commBroker", num: true },
      { id: `ve-${rk}-pw`, key: "pw", num: false },
      { id: `ve-${rk}-deposit`, key: "deposit", num: true },
      { id: `ve-${rk}-rent`, key: "rent", num: true },
      { id: `ve-${rk}-nego`, key: "nego", num: true },
      { id: `ve-${rk}-mgmt`, key: "mgmt", num: true },
      { id: `ve-${rk}-water`, key: "water", num: false },
      { id: `ve-${rk}-cable`, key: "cable", num: false },
      { id: `ve-${rk}-exitFee`, key: "exitFee", num: true },
      { id: `ve-${rk}-days`, key: "days", num: true },
    ];
    fields.forEach(f => {
      const v = g(f.id);
      if (v !== undefined) patch[f.key] = f.num ? (Number(v) || 0) : v;
    });
    updateVacancy(r, patch);
    setEditRow(null);
  };

  const renderVal = (value, isNum) => {
    if (isNum) return value > 0 ? fmt(value) : "—";
    if (value === "포함") return <span style={{ color: "#059669", fontWeight: 600 }}>포함</span>;
    if (value === "별도") return <span style={{ color: "#DC2626", fontWeight: 600 }}>별도</span>;
    return value || "—";
  };
  const myVacancies = myBuildings.length > 0 ? activeVacancies.filter(v => myBuildings.includes(v.building)) : activeVacancies;
  const getStatus = (v) => {
    if (v.status === "계약서입력") return "계약서입력";
    if (v.status === "홍보중") return "홍보중";
    return "점검/청소중";
  };
  const filtered = useMemo(() => tab === "전체" ? myVacancies : myVacancies.filter(v => getStatus(v) === tab), [tab, myVacancies, calendarEvts]);

  const handleStatusChange = (v, newStatus) => {
    setActiveVacancies(prev => prev.map(x =>
      x.building === v.building && x.room === v.room ? { ...x, status: newStatus } : x
    ));
  };

  const todayStr = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => { window.print(); setTimeout(() => setShowPrint(false), 500); }, 200);
  };

  if (showPrint) {
    const grouped = {};
    activeVacancies.filter(v => getStatus(v) !== "점검/청소중").forEach(v => {
      if (!grouped[v.building]) grouped[v.building] = [];
      grouped[v.building].push(v);
    });
    return (
      <div id="print-area" style={{ padding: "20px 10px", fontFamily: "'Pretendard', sans-serif", background: "#fff", color: "#000", minHeight: "100vh" }}>
        <style>{`@media print { body * { visibility: hidden !important; } #print-area, #print-area * { visibility: visible !important; } #print-area { position: fixed; left: 0; top: 0; width: 100%; padding: 24px !important; font-size: 10px !important; } @page { margin: 10mm; size: A4 landscape; } }`}</style>
        <div style={{ textAlign: "center", borderBottom: "3px solid #000", paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#666", letterSpacing: "0.1em", marginBottom: 4 }}>하우스맨 HOUSEMAN</div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>공실 현황표</div>
          <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>{todayStr} 기준</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
            {["점검/청소중","홍보중","계약서입력"].map(t => (
              <span key={t} style={{ fontSize: 12, fontWeight: 700 }}>{t} <span style={{ fontSize: 16, fontWeight: 900 }}>{activeVacancies.filter(v => getStatus(v) === t).length}</span></span>
            ))}
            <span style={{ fontSize: 12, fontWeight: 700 }}>전체 <span style={{ fontSize: 16, fontWeight: 900, color: "#DC2626" }}>{activeVacancies.length}</span></span>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
          <thead>
            <tr style={{ background: "#F3F4F6" }}>
              {["수수료(이벤트/중개)","건물명","호수","현관비번","예치금","월세","NEGO","관리비","수도","케이블","퇴실비","공실기간"].map(h => (
                <th key={h} style={{ padding: "5px 6px", textAlign: "center", fontWeight: 700, borderBottom: "2px solid #999", fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeVacancies.filter(v => getStatus(v) !== "점검/청소중").map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "4px 6px", textAlign: "center", fontSize: 10 }}>{r.commEvent || "—"} / {r.commBroker > 0 ? (r.commBroker < 1 ? r.commBroker + "%" : r.commBroker + "만") : "—"}</td>
                <td style={{ padding: "4px 6px", fontWeight: 700 }}>{r.building}</td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>{r.room}</td>
                <td style={{ padding: "4px 6px", textAlign: "center", fontFamily: "monospace" }}>{r.commFee || "—"}</td>
                <td style={{ padding: "4px 6px", textAlign: "right" }}>{fmt(r.deposit)}</td>
                <td style={{ padding: "4px 6px", textAlign: "right" }}>{fmt(r.rent)}</td>
                <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700, color: r.nego < r.rent ? "#DC2626" : "#000" }}>{fmt(r.nego)}</td>
                <td style={{ padding: "4px 6px", textAlign: "right" }}>{r.mgmt > 0 ? fmt(r.mgmt) : "—"}</td>
                <td style={{ padding: "4px 6px", textAlign: "center", fontSize: 10 }}>{r.water || "—"}</td>
                <td style={{ padding: "4px 6px", textAlign: "center", fontSize: 10 }}>{r.cable || "—"}</td>
                <td style={{ padding: "4px 6px", textAlign: "right" }}>{r.exitFee > 0 ? r.exitFee : "—"}</td>
                <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: r.days > 30 ? 800 : 400, color: r.days > 30 ? "#DC2626" : "#000" }}>{r.days > 0 ? r.days : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 20, paddingTop: 12, borderTop: "2px solid #000", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888" }}>
          <span>하우스맨 건물관리 시스템</span>
          <span>총 {activeVacancies.length}실 관리</span>
          <span>인쇄일: {todayStr}</span>
        </div>
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button onClick={() => setShowPrint(false)} style={{ padding: "10px 32px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>← 돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <SectionTitle sub="">📭 공실 관리</SectionTitle>
        <button onClick={handlePrint}
          style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, color: "#1A1D23" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#1B1F2E"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1A1D23"; }}>
          🖨️ 인쇄
        </button>
      </div>

      {/* Summary badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {types.map(t => {
          const count = t === "전체" ? myVacancies.length : myVacancies.filter(v => getStatus(v) === t).length;
          const colors = { "전체": "#1A1D23", "점검/청소중": "#6B7280", "홍보중": "#3B82F6", "계약서입력": "#F59E0B" };
          return (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "7px 16px", borderRadius: 8, border: tab === t ? `2px solid ${colors[t]}` : "1px solid #E0E3E9", background: tab === t ? `${colors[t]}10` : "#fff", color: tab === t ? colors[t] : "#5F6577", fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
              {t} <span style={{ fontWeight: 800 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Main Table */}
      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E8ECF0" }}>
              {["","수수료(이벤트/중개)","건물명","호수","현관비번","예치금","월세","NEGO","관리비","수도","케이블","퇴실비","공실기간",""].map((h, i) => (
                <th key={i} style={{ padding: "10px 8px", textAlign: (i >= 5 && i <= 12) ? "right" : (i === 1) ? "center" : "left", fontSize: 11, fontWeight: 700, color: "#8F95A3", whiteSpace: "nowrap",
                  background: h === "NEGO" ? "#FEF2F2" : "transparent" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const negoDiscount = r.nego < r.rent;
              const st = getStatus(r);
              const contracted = st === "계약서입력";
              const cellDeco = contracted ? "line-through" : "none";
              const cellOpacity = contracted ? 0.5 : 1;
              const rk = rowKey(r);
              const isEditing = editRow === rk;
              const inpSt = { width: "100%", padding: "4px 6px", borderRadius: 4, border: "1.5px solid #93C5FD", fontSize: 11, fontFamily: "inherit", outline: "none", background: "#EFF6FF" };
              return (
                <tr key={i} style={{ borderBottom: "1px solid #F0F2F5", position: "relative", background: isEditing ? "#FAFBFF" : "transparent" }}
                  onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = contracted ? "#F0FDF4" : "#F9FAFB"; }}
                  onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = "transparent"; }}>
                  {/* 수정/완료 버튼 (맨앞) */}
                  <td style={{ padding: "10px 6px", textAlign: "center" }}>
                    {isEditing ? (
                      <button onClick={() => handleEditSave(r)}
                        style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#059669", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        ✓ 완료
                      </button>
                    ) : (
                      <button onClick={() => setEditRow(rk)}
                        style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid #93C5FD", background: "#EFF6FF", color: "#2563EB", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        ✏️ 수정
                      </button>
                    )}
                  </td>
                  {/* 수수료(이벤트/중개) */}
                  {isEditing ? (
                    <td style={{ padding: "4px 4px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                        <input id={`ve-${rk}-commEvent`} defaultValue={r.commEvent ?? ""} placeholder="이벤트" style={{ ...inpSt, width: 40, textAlign: "center" }} />
                        <span style={{ fontSize: 10, color: "#B0B5C1", alignSelf: "center" }}>/</span>
                        <input id={`ve-${rk}-commBroker`} defaultValue={r.commBroker ?? ""} placeholder="중개" style={{ ...inpSt, width: 40, textAlign: "center" }} />
                      </div>
                    </td>
                  ) : (
                    <td style={{ padding: "10px 8px", textAlign: "center", whiteSpace: "nowrap", textDecoration: cellDeco, opacity: cellOpacity }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: r.commEvent ? "#7C3AED" : "#B0B5C1" }}>{r.commEvent || "—"}</span>
                      <span style={{ fontSize: 10, color: "#B0B5C1", margin: "0 2px" }}>/</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{r.commBroker > 0 ? (r.commBroker < 1 ? r.commBroker + "%" : r.commBroker + "만") : "—"}</span>
                    </td>
                  )}
                  <td style={{ padding: "10px 8px", fontWeight: 700, textDecoration: cellDeco, opacity: cellOpacity }}>{r.building}</td>
                  <td style={{ padding: "10px 8px", textDecoration: cellDeco, opacity: cellOpacity }}>{r.room}</td>
                  {/* 현관비번 */}
                  {isEditing ? (
                    <td style={{ padding: "4px 4px" }}><input id={`ve-${rk}-pw`} defaultValue={r.pw ?? ""} style={{ ...inpSt, textAlign: "left" }} /></td>
                  ) : (
                    <td style={{ padding: "10px 8px", textDecoration: cellDeco, opacity: cellOpacity }}>{r.pw ? <code style={{ fontSize: 11, background: "#F3F4F6", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>{r.pw}</code> : "—"}</td>
                  )}
                  {/* 예치금~공실기간 */}
                  {[
                    { field: "deposit", value: r.deposit, num: true },
                    { field: "rent", value: r.rent, num: true },
                    { field: "nego", value: r.nego, num: true, extra: { fontWeight: 700, background: negoDiscount ? "#FEF2F2" : "transparent", color: negoDiscount ? "#DC2626" : "#1A1D23" } },
                    { field: "mgmt", value: r.mgmt, num: true },
                    { field: "water", value: r.water, num: false },
                    { field: "cable", value: r.cable, num: false },
                    { field: "exitFee", value: r.exitFee, num: true },
                    { field: "days", value: r.days, num: true },
                  ].map((f, fi) => isEditing ? (
                    <td key={fi} style={{ padding: "4px 4px" }}><input id={`ve-${rk}-${f.field}`} defaultValue={f.value ?? ""} style={{ ...inpSt, textAlign: "right" }} /></td>
                  ) : (
                    <td key={fi} style={{ padding: "10px 8px", textAlign: "right", textDecoration: cellDeco, opacity: cellOpacity, ...(f.extra || {}), fontSize: !f.num ? 11 : undefined }}>
                      {f.field === "days" ? (f.value > 0 ? <span style={{ fontWeight: 700, color: f.value > 30 ? "#DC2626" : f.value > 14 ? "#EA580C" : "#1A1D23" }}>{f.value}</span> : <span style={{ color: "#10B981", fontWeight: 600, fontSize: 11 }}>신규</span>) : renderVal(f.value, f.num)}
                    </td>
                  ))}
                  {/* 상태 버튼 (맨뒤) */}
                  <td style={{ padding: "10px 6px", textAlign: "center" }}>
                    {st === "점검/청소중" ? (
                      <button onClick={() => handleStatusChange(r, "홍보중")}
                        style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #6B7280", background: "#F3F4F6", color: "#374151", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        🔧 점검/청소중
                      </button>
                    ) : st === "홍보중" ? (
                      <button onClick={() => handleStatusChange(r, "점검/청소중")}
                        style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #3B82F6", background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        📢 홍보중
                      </button>
                    ) : st === "계약서입력" ? (
                      <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                        <button onClick={() => {
                            const evt = calendarEvts.find(e => e.type === "계약" && e.building === r.building && e.room === r.room);
                            const bd = buildingData[r.building] || {};
                            const bf = buildingFloors[r.building] || {};
                            const owners = bd.owners && bd.owners.length > 0 && bd.owners[0].name
                              ? bd.owners
                              : [{ name: bf.owner || "", phone: bf.phone || "" }];
                            setReportModal({ vacancy: r, evt, owners });
                          }}
                            style={{ padding: "5px 8px", borderRadius: 6, border: "1.5px solid #7C3AED", background: "#F5F3FF", color: "#7C3AED", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                            📩 건물주보고
                          </button>
                        <button onClick={() => {
                          const evt = calendarEvts.find(e => e.type === "계약" && e.building === r.building && e.room === r.room);
                          if (evt && setPendingContract) {
                            setPendingContract({ ...evt, vacancyData: r });
                            setPage && setPage("tenants");
                          }
                        }}
                          style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #F59E0B", background: "#FEF3C7", color: "#92400E", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                          📝 계약서입력
                        </button>
                        <button onClick={() => {
                          setActiveVacancies(prev => prev.map(x =>
                            x.building === r.building && x.room === r.room ? { ...x, status: "홍보중", reported: false, moveInPhotos: undefined } : x
                          ));
                          setCalendarEvts?.(prev => prev.filter(e => !(e.type === "계약" && e.building === r.building && e.room === r.room)));
                        }}
                          style={{ padding: "5px 8px", borderRadius: 6, border: "1.5px solid #DC2626", background: "#FEF2F2", color: "#DC2626", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                          계약파기
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* 건물주보고 모달 */}
      {reportModal && (() => {
        const { vacancy: rv, evt, owners } = reportModal;
        const ownerName = owners[0]?.name || "건물주";
        const ownerPhone = owners[0]?.phone || "";
        const msgLines = [
          `[${rv.building} ${rv.room}호 계약 보고]`,
          ``,
          `안녕하세요, ${ownerName}건물주님.`,
          `${rv.building} ${rv.room}호 계약이 진행되었습니다.`,
          ``,
          `▪ 보증금: ${rv.deposit}만원`,
          `▪ 월세: ${rv.rent}만원`,
          `▪ 관리비: ${rv.mgmt > 0 ? rv.mgmt + "만원" : "없음"}`,
          ...(evt ? [
            `▪ 입주일: ${evt.moveIn || evt.date || "-"}`,
            `▪ 만기일: ${evt.expiry || "-"}`,
            `▪ 부동산: ${evt.broker || "-"}`,
          ] : []),
          ``,
          `감사합니다.`,
          `- 하우스맨 드림`,
        ];
        const msgText = msgLines.join("\n");
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setReportModal(null)}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: 16, padding: 24, width: isMobile ? "92%" : 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>📩 건물주 보고 — {rv.building} {rv.room}호</span>
                <button onClick={() => setReportModal(null)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", marginBottom: 6 }}>👤 건물주 정보</div>
                {owners.map((o, oi) => (
                  <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 12 }}>
                    <span style={{ fontWeight: 700 }}>{o.name || `건물주${oi + 1}`}</span>
                    <span style={{ color: "#3B82F6" }}>{o.phone || "연락처 미등록"}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 6 }}>💬 전송 내용</div>
                <textarea id="report-msg" defaultValue={msgText} rows={14}
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 }} />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => {
                  const msg = document.getElementById("report-msg")?.value || msgText;
                  if (!ownerPhone) return alert("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요.");
                  const smsUrl = `sms:${ownerPhone}?body=${encodeURIComponent(msg)}`;
                  window.open(smsUrl, "_blank");

                  setReportModal(null);
                }}
                  style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  📱 문자 보내기
                </button>
                <button onClick={() => {
                  const msg = document.getElementById("report-msg")?.value || msgText;
                  if (!ownerPhone) return alert("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요.");
                  const kakaoUrl = `https://story.kakao.com/share?url=&text=${encodeURIComponent(msg)}`;
                  window.open(kakaoUrl, "_blank");

                  setReportModal(null);
                }}
                  style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "#FEE500", color: "#3C1E1E", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  💬 카카오톡
                </button>
                <button onClick={() => {
                  const msg = document.getElementById("report-msg")?.value || msgText;
                  navigator.clipboard.writeText(msg);
                  alert("메시지가 클립보드에 복사되었습니다.");
                }}
                  style={{ padding: "12px 16px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  📋 복사
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
