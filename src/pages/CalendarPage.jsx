import { useState, useMemo } from 'react';
import { calendarEvents as defaultEvents, buildingFloors } from '../data';
import { buildings } from '../data';
import { useIsMobile } from '../utils';
import { matchKorean } from '../utils/koreanSearch';
import { Card, SectionTitle, StatusBadge } from '../components';
import { PhotoDropZone } from '../components/PhotoDropZone';
import { inputStyle } from '../components/Field';

const TYPE_COLORS = { 계약: "#3B82F6", 퇴실: "#EF4444", 휴무: "#8B5CF6" };
const TYPE_BG = { 계약: "#EFF6FF", 퇴실: "#FEF2F2", 휴무: "#F5F3FF" };
const TYPE_BORDER = { 계약: "#BFDBFE", 퇴실: "#FECACA", 휴무: "#DDD6FE" };
const TYPE_ICON = { 계약: "📦", 퇴실: "🚪", 휴무: "🏖️" };
const BUILDING_NAMES = buildings.map(b => b.name);

const MSG_TEMPLATES = {
  "기본": (e) => [
    `[계약정보 안내]`,
    `건물: ${e.building}`,
    `호실: ${e.room}호`,
    `보증금: ${e.deposit}만원 / 월세: ${e.rent}만원`,
    e.mgmt ? `관리비: ${e.mgmt}만원` : null,
    e.moveIn ? `입주일: ${e.moveIn}` : null,
    e.expiry ? `만기일: ${e.expiry}` : null,
    e.contractDate ? `계약일: ${e.contractDate}` : null,
    e.broker ? `부동산: ${e.broker}` : null,
    e.registeredBy ? `담당: ${e.registeredBy}` : null,
  ].filter(Boolean).join("\n"),
  "상세(단기포함)": (e) => [
    `[계약정보 상세안내]`,
    `━━━━━━━━━━━━━━━`,
    `건물: ${e.building}`,
    `호실: ${e.room}호`,
    `━━━━━━━━━━━━━━━`,
    `보증금: ${e.deposit}만원`,
    `월세: ${e.rent}만원`,
    e.nego ? `NEGO: ${e.nego}만원` : null,
    e.mgmt ? `관리비: ${e.mgmt}만원` : null,
    e.water ? `수도: ${e.water}` : null,
    e.cable ? `인터넷/케이블: ${e.cable}` : null,
    e.exitFee ? `퇴실청소비: ${e.exitFee}만원` : null,
    e.commBroker ? `중개수수료: ${e.commBroker}%` : null,
    `━━━━━━━━━━━━━━━`,
    e.moveIn ? `입주일: ${e.moveIn}` : null,
    e.expiry ? `만기일: ${e.expiry}` : null,
    e.contractDate ? `계약일: ${e.contractDate}` : null,
    `━━━━━━━━━━━━━━━`,
    e.broker ? `부동산: ${e.broker}` : null,
    e.brokerPhone ? `연락처: ${e.brokerPhone}` : null,
    e.registeredBy ? `담당자: ${e.registeredBy}` : null,
  ].filter(Boolean).join("\n"),
  "간단": (e) => [
    `${e.building} ${e.room}호`,
    `보${e.deposit}/월${e.rent}${e.mgmt ? `/관${e.mgmt}` : ""}`,
    e.moveIn ? `입주 ${e.moveIn}` : null,
  ].filter(Boolean).join("\n"),
};

// 건물 계약문자 템플릿에서 금액을 자동 매칭하여 채워넣기
const fillBuildingContractMsg = (template, e) => {
  if (!template) return null;
  // 입주금 총합 계산
  const dep = Number(e.deposit) || 0;
  const rent = Number(e.rent) || 0;
  const mgmt = Number(e.mgmt) || 0;
  const water = typeof e.water === "string" && e.water && !isNaN(Number(e.water)) ? Number(e.water) : 0;
  const cable = typeof e.cable === "string" && e.cable && !isNaN(Number(e.cable)) ? Number(e.cable) : 0;
  const exitFee = Number(e.exitFee) || 0;
  const total = dep + rent + mgmt + water + cable;
  // 계약기간
  const period = (e.moveIn && e.expiry) ? `${e.moveIn} ~ ${e.expiry}` : (e.moveIn || "");
  let msg = template;
  // 호수 매칭: "호수 : 제이앤제이  호" → "호수 : 제이앤제이 301호"
  msg = msg.replace(/(호수\s*:\s*\S+)\s+호/, `$1 ${e.room}호`);
  // 부동산 매칭
  msg = msg.replace(/(부동산\s*:)\s*/, `$1 ${e.broker || ""} `);
  // 계약기간 매칭
  msg = msg.replace(/(계약기간\s*:)\s*/, `$1 ${period} `);
  // 입주금 정보 - "만원(관리비/수도/케이블 선불)" 앞에 총합 삽입
  msg = msg.replace(/(\n)만원\(관리비\/수도\/케이블 선불\)/, `\n${total}만원(관리비/수도/케이블 선불)`);
  // 금액 정보 매칭
  msg = msg.replace(/예치금\s*만원/, `예치금 ${dep}만원`);
  msg = msg.replace(/월세\s*만원/, `월세 ${rent}만원`);
  msg = msg.replace(/관리비\s*만원/, `관리비 ${mgmt}만원`);
  msg = msg.replace(/수도\s*만원/, `수도 ${water || e.water || 0}만원`);
  msg = msg.replace(/케이블\s*만원/, `케이블 ${cable || e.cable || 0}만원`);
  msg = msg.replace(/퇴실청소비\s*만원/, `퇴실청소비 ${exitFee}만원`);
  return msg;
};

export const CalendarPage = ({ events: propEvents, setEvents, currentStaff, activeVacancies = [], setActiveVacancies, activeTenants = [], setActiveTenants, pastTenantsData = {}, setPastTenantsData, setPage, setPendingMoveout, buildingData = {} }) => {
  const isMobile = useIsMobile();
  const calendarEvents = propEvents || defaultEvents;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState("전체");
  const [selectedDay, setSelectedDay] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("계약");
  const [formDate, setFormDate] = useState("");
  const [formBuilding, setFormBuilding] = useState("");
  const [formBuildingSearch, setFormBuildingSearch] = useState("");
  const [showBuildingSuggestions, setShowBuildingSuggestions] = useState(false);
  const [formRoom, setFormRoom] = useState("");
  const [formName, setFormName] = useState("");
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [vacancyEdits, setVacancyEdits] = useState({});
  const [photoModalTenant, setPhotoModalTenant] = useState(null);
  const [checkPhotoModalTenant, setCheckPhotoModalTenant] = useState(null);
  const [compareData, setCompareData] = useState(null); // { building, room, moveInCheckPhotos, moveOutPhotos }
  const [zoomPhoto, setZoomPhoto] = useState(null); // { photos: [], index: number, zoom: number }
  const [dragEventIndex, setDragEventIndex] = useState(null);
  const [dropTargetDay, setDropTargetDay] = useState(null);
  const [editEvent, setEditEvent] = useState(null); // { idx, evt, edits }
  const [breakReport, setBreakReport] = useState(null); // { ev, owners, msgText } 계약파기 건물주보고
  const openEditEvent = (evt) => {
    const idx = calendarEvents.indexOf(evt);
    if (idx < 0 || !setEvents) return;
    setEditEvent({ idx, evt, edits: { ...evt } });
  };
  const saveEditEvent = () => {
    if (!editEvent || !setEvents) return;
    const { idx, edits } = editEvent;
    setEvents(prev => prev.map((e, i) => i === idx ? { ...e, ...edits } : e));
    setEditEvent(null);
  };
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEvents = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    let evts = calendarEvents.filter(e => e.date === dateStr);
    if (filter !== "전체") evts = evts.filter(e => e.type === filter);
    return evts;
  };

  const monthEvents = useMemo(() => calendarEvents.filter(e => e.date.startsWith(monthStr)), [calendarEvents, monthStr]);
  const filteredMonthEvents = useMemo(() => filter === "전체" ? monthEvents : monthEvents.filter(e => e.type === filter), [monthEvents, filter]);

  const selectedDateStr = selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : null;
  const selectedEvents = selectedDay ? getEvents(selectedDay) : [];

  const [pendingSendEvt, setPendingSendEvt] = useState(null);
  const [sendMsg, setSendMsg] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("기본");

  const buildContractMsg = (evt, template) => {
    if (template === "건물 계약문자") {
      const bldgMsg = (buildingData[evt.building] || {}).contractMsg || "";
      if (bldgMsg) return fillBuildingContractMsg(bldgMsg, evt);
      return MSG_TEMPLATES["기본"](evt);
    }
    const fn = MSG_TEMPLATES[template || "기본"];
    return fn ? fn(evt) : MSG_TEMPLATES["기본"](evt);
  };

  const getTemplateKeys = (evt) => {
    const keys = [...Object.keys(MSG_TEMPLATES)];
    const bldgMsg = (buildingData[evt?.building] || {}).contractMsg;
    if (bldgMsg) keys.unshift("건물 계약문자");
    return keys;
  };

  const openSendModal = (evt) => {
    setPendingSendEvt(evt);
    const bldgMsg = (buildingData[evt.building] || {}).contractMsg;
    const defaultTpl = bldgMsg ? "건물 계약문자" : "기본";
    setSelectedTemplate(defaultTpl);
    setSendMsg(buildContractMsg(evt, defaultTpl));
  };

  const handleSendSMS = (evt, msg) => {
    const text = msg || buildContractMsg(evt);
    const phone = (evt.brokerPhone || "").replace(/-/g, "");
    window.open(`sms:${phone}?body=${encodeURIComponent(text)}`);
    setPendingSendEvt(null);
  };

  const handleSendKakao = (evt, msg) => {
    const text = msg || buildContractMsg(evt);
    navigator.clipboard.writeText(text).then(() => {
      alert("계약정보가 클립보드에 복사되었습니다.\n카카오톡에서 붙여넣기(Ctrl+V) 하세요.");
    }).catch(() => {
      prompt("아래 내용을 복사하세요:", text);
    });
    setPendingSendEvt(null);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);


  return (
    <div>
      <SectionTitle sub="입퇴실 일정 & 직원 휴무 관리">📅 입퇴실일정</SectionTitle>

      {/* 계약현황 — 캘린더 등록 계약건 */}
      {(() => {
        const contractEvts = calendarEvents
          .filter(ev => ev.type === "계약" && ev.building && ev.room);
        if (contractEvts.length === 0) return null;
        return (
          <Card style={{ marginBottom: 16, border: "2px solid #3B82F6", background: "#EFF6FF" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>📦</span>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#3B82F6" }}>계약현황 <span style={{ fontWeight: 600, fontSize: 11, color: "#8F95A3" }}>({contractEvts.length}건)</span></div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #BFDBFE" }}>
                  {["계약일","건물명","호실","입주일","보증금","월세","관리비","부동산","연락처",""].map((h, i) => (
                    <th key={i} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#8F95A3", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contractEvts.map((ev, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #DBEAFE" }}
                    onDoubleClick={() => openEditEvent(ev)}
                    onMouseEnter={e => { e.currentTarget.style.background = "#F0F7FF"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: "#3B82F6" }}>{ev.date}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 700 }}>{ev.building}</td>
                    <td style={{ padding: "8px 10px" }}>{ev.room}</td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "#059669", fontWeight: 600 }}>{ev.moveIn || "—"}</td>
                    <td style={{ padding: "8px 10px" }}>{ev.deposit ?? "—"}</td>
                    <td style={{ padding: "8px 10px" }}>{ev.rent ?? "—"}</td>
                    <td style={{ padding: "8px 10px" }}>{ev.mgmt || "—"}</td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "#5F6577" }}>{ev.broker || "—"}</td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "#5F6577" }}>{ev.brokerPhone || "—"}</td>
                    <td style={{ padding: "8px 6px", textAlign: "center" }}>
                      {setEvents && (
                        <span onClick={() => {
                          const bf = buildingFloors[ev.building] || {};
                          const owners = [{ name: bf.owner || "", phone: bf.phone || "" }];
                          const ownerName = owners[0]?.name || "건물주";
                          const msgLines = [
                            `[${ev.building} ${ev.room}호 계약파기 보고]`,
                            ``,
                            `안녕하세요, ${ownerName}건물주님.`,
                            `${ev.building} ${ev.room}호 계약이 파기되었습니다.`,
                            ``,
                            `▪ 보증금: ${ev.deposit ?? 0}만원`,
                            `▪ 월세: ${ev.rent ?? 0}만원`,
                            ev.mgmt ? `▪ 관리비: ${ev.mgmt}만원` : null,
                            `▪ 입주예정일: ${ev.moveIn || ev.date || "-"}`,
                            ev.broker ? `▪ 부동산: ${ev.broker}` : null,
                            ``,
                            `※ 계약금 입금 후 파기 건입니다.`,
                            ``,
                            `감사합니다.`,
                            `- 하우스맨 드림`,
                          ].filter(Boolean);
                          // 캘린더에서 계약 삭제
                          setEvents(prev => prev.filter(e => !(e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room))));
                          // 공실 상태 홍보중으로 복원
                          setActiveVacancies?.(prev => prev.map(v => v.building === ev.building && String(v.room) === String(ev.room) ? { ...v, status: "홍보중" } : v));
                          // 건물주 보고 모달 열기
                          setBreakReport({ ev, owners, msgText: msgLines.join("\n") });
                        }}
                          style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", padding: "3px 8px", borderRadius: 5, border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer", whiteSpace: "nowrap" }}>
                          계약파기
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );
      })()}

      {/* 퇴실현황 — 캘린더 등록 퇴실건 */}
      {(() => {
        const todayD = new Date(); todayD.setHours(23,59,59,999);
        const moveOutEvts = calendarEvents
          .filter(ev => ev.type === "퇴실" && ev.building && ev.room && new Date(ev.date) <= todayD)
          .map(ev => {
            const hk = `${ev.building}_${ev.room}`;
            const tenant = activeTenants.find(t => t.building === ev.building && String(t.room) === String(ev.room));
            const pastRecords = pastTenantsData[hk] || [];
            const settled = !tenant && pastRecords.length > 0;
            const pastInfo = settled ? pastRecords[pastRecords.length - 1] : null;
            const hasPhotos = tenant
              ? (tenant.moveOutPhotos && tenant.moveOutPhotos.length > 0)
              : !!(pastInfo && pastInfo.moveOutPhotos && pastInfo.moveOutPhotos.length > 0);
            const hasCheckPhotos = tenant
              ? (tenant.moveOutCheckPhotos && tenant.moveOutCheckPhotos.length > 0)
              : !!(pastInfo && pastInfo.moveOutCheckPhotos && pastInfo.moveOutCheckPhotos.length > 0);
            // 퇴실사진 + 입주체크사진 + 퇴실처리 3개 모두 완료 → 숨김
            if (hasPhotos && hasCheckPhotos && settled) return null;
            // tenant가 이미 퇴실확정되어 activeTenants에 없는 경우, pastInfo로 모달용 객체 생성
            const tenantForModal = tenant || {
              building: ev.building, room: ev.room,
              name: ev.name || (pastInfo ? pastInfo.name : ""),
              phone: pastInfo?.phone || "",
              moveOutPhotos: pastInfo?.moveOutPhotos || [],
              moveOutCheckPhotos: pastInfo?.moveOutCheckPhotos || [],
              moveInCheckPhotos: pastInfo?.moveInCheckPhotos || [],
              _isPastTenant: true
            };
            return { ...ev, tenant, tenantForModal, settled, pastInfo, hasPhotos, hasCheckPhotos };
          })
          .filter(Boolean);
        if (moveOutEvts.length === 0) return null;
        return (
          <Card style={{ marginBottom: 16, border: "2px solid #DC2626", background: "#FEF2F2" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>🚪</span>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#DC2626" }}>퇴실현황 <span style={{ fontWeight: 600, fontSize: 11, color: "#8F95A3" }}>({moveOutEvts.length}건)</span></div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #FECACA" }}>
                  {["퇴실일","건물명","호실","입주자","연락처","","사진비교","퇴실사진","입주체크사진","퇴실정산서"].map((h, i) => (
                    <th key={i} style={{ padding: "8px 10px", textAlign: i >= 6 ? "center" : "left", fontSize: 11, fontWeight: 700, color: "#8F95A3", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {moveOutEvts.map((ev, i) => {
                  const t = ev.tenant;
                  const tm = ev.tenantForModal;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #FEE2E2", cursor: "pointer" }}
                      onDoubleClick={() => { if (setEvents) openEditEvent(ev); }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#FFF5F5"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                      <td style={{ padding: "8px 10px", fontWeight: 700, color: "#DC2626" }}>{ev.date}</td>
                      <td style={{ padding: "8px 10px", fontWeight: 700 }}>{ev.building}</td>
                      <td style={{ padding: "8px 10px" }}>{ev.room}</td>
                      <td style={{ padding: "8px 10px", fontWeight: 700 }}>{ev.name || (t ? t.name : ev.pastInfo ? ev.pastInfo.name : "—")}</td>
                      <td style={{ padding: "8px 10px", fontSize: 11, color: "#5F6577" }}>
                        {t ? t.phone : ev.pastInfo ? ev.pastInfo.phone : "—"}
                      </td>
                      <td style={{ padding: "4px 6px", textAlign: "center" }}>
                        {t && setPage && ev.hasPhotos && !ev.settled && (
                          <span onClick={() => { setPendingMoveout?.({ building: ev.building, room: ev.room }); setPage("tenants"); }}
                            style={{ fontSize: 10, fontWeight: 700, color: "#fff", padding: "3px 8px", borderRadius: 5, background: "#DC2626", cursor: "pointer", whiteSpace: "nowrap" }}>
                            퇴실정산서 →
                          </span>
                        )}
                      </td>
                      {/* 사진비교 */}
                      <td style={{ padding: "8px 6px", textAlign: "center" }}>
                        <span onClick={ev.hasPhotos ? () => setCompareData({ building: ev.building, room: ev.room, moveInCheckPhotos: tm.moveInCheckPhotos || [], moveOutPhotos: tm.moveOutPhotos || [] }) : undefined}
                          style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap",
                            ...(ev.hasPhotos
                              ? { color: "#6366F1", background: "#EEF2FF", border: "1px solid #C7D2FE", cursor: "pointer" }
                              : { color: "#C4C7CF", background: "#F3F4F6", cursor: "default" })
                          }}>
                          🔍 비교
                        </span>
                      </td>
                      {/* 퇴실사진 */}
                      <td style={{ padding: "8px 6px", textAlign: "center" }}>
                        {ev.hasPhotos ? (
                          <span onClick={() => setPhotoModalTenant(tm)}
                            style={{ fontSize: 11, fontWeight: 700, color: "#059669", padding: "2px 10px", borderRadius: 4, background: "#D1FAE5", cursor: "pointer" }}>✅ 완료</span>
                        ) : (
                          <span onClick={() => setPhotoModalTenant(tm)}
                            style={{ fontSize: 11, fontWeight: 700, color: "#fff", padding: "4px 10px", borderRadius: 6, background: "#DC2626", cursor: "pointer" }}>
                            📷 등록
                          </span>
                        )}
                      </td>
                      {/* 입주체크사진 */}
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        {ev.hasCheckPhotos ? (
                          <span onClick={() => setCheckPhotoModalTenant(tm)}
                            style={{ fontSize: 11, fontWeight: 700, color: "#059669", padding: "2px 10px", borderRadius: 4, background: "#D1FAE5", cursor: "pointer" }}>✅ 완료</span>
                        ) : (
                          <span onClick={() => setCheckPhotoModalTenant(tm)}
                            style={{ fontSize: 11, fontWeight: 700, color: "#fff", padding: "4px 10px", borderRadius: 6, background: "#F59E0B", cursor: "pointer" }}>
                            📷 등록
                          </span>
                        )}
                      </td>
                      {/* 퇴실정산서 */}
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        {ev.settled ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", padding: "2px 10px", borderRadius: 4, background: "#D1FAE5" }}>✅ 완료</span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", padding: "2px 10px", borderRadius: 4, background: "#F3F4F6" }}>대기</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        );
      })()}

      {/* Filter Tabs + Registration Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["전체", "계약", "퇴실", "휴무"].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              style={{ padding: "6px 16px", borderRadius: 8, border: filter === t ? `2px solid ${TYPE_COLORS[t] || "#3B82F6"}` : "1px solid #E0E3E9", background: filter === t ? (TYPE_BG[t] || "#EFF6FF") : "#fff", color: filter === t ? (TYPE_COLORS[t] || "#2563EB") : "#5F6577", fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
              {t !== "전체" && <span style={{ marginRight: 4 }}>{TYPE_ICON[t]}</span>}{t}
            </button>
          ))}
        </div>
      </div>

      {/* 계약 등록 Form — 팝업 */}
      {showForm && formType === "계약" && setEvents && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { setShowForm(false); setSelectedVacancy(null); setVacancyEdits({}); }}>
          <div style={{ background: "#FAFBFF", borderRadius: 16, padding: 24, width: 600, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", border: "2px solid #3B82F6" }}
            onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23", marginBottom: 14 }}>📦 계약 등록 — 공실 선택</div>

          <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid #E0E3E9", borderRadius: 8, marginBottom: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#F3F4F8", position: "sticky", top: 0 }}>
                  {["건물", "호실", "유형", "보증금", "월세", "NEGO", "관리비", "공실일"].map(h => (
                    <th key={h} style={{ padding: "7px 8px", fontWeight: 700, color: "#5F6577", textAlign: "left", borderBottom: "1px solid #E0E3E9", fontSize: 10 }}>{h}</th>
                  ))}
                  <th style={{ padding: "7px 8px", borderBottom: "1px solid #E0E3E9" }}></th>
                </tr>
              </thead>
              <tbody>
                {activeVacancies.filter(v => v.status === "홍보중").map((v, vi) => {
                  const isSelected = selectedVacancy === vi;
                  return (
                    <tr key={vi} onClick={() => {
                      setSelectedVacancy(vi);
                      const edits = { deposit: v.deposit, rent: v.rent, nego: v.nego, mgmt: v.mgmt };
                      if (v.type === "단기") { edits.water = v.water; edits.cable = v.cable; edits.exitFee = v.exitFee; edits.commBroker = v.commBroker; }
                      setVacancyEdits(edits);
                    }}
                      style={{ background: isSelected ? "#EFF6FF" : vi % 2 === 0 ? "#fff" : "#FAFBFC", cursor: "pointer", transition: "background 0.1s" }}>
                      <td style={{ padding: "7px 8px", fontWeight: 600, borderBottom: "1px solid #F0F2F5" }}>{v.building}</td>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5" }}>{v.room}</td>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5" }}>
                        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 600, background: v.type === "단기" ? "#EFF6FF" : v.type === "일반임대" ? "#F0FDF4" : v.type === "근생" ? "#FFF7ED" : "#F5F3FF", color: v.type === "단기" ? "#2563EB" : v.type === "일반임대" ? "#16A34A" : v.type === "근생" ? "#EA580C" : "#7C3AED" }}>{v.type}</span>
                      </td>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5" }}>{v.deposit}</td>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5" }}>{v.rent}</td>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5", color: v.nego < v.rent ? "#DC2626" : "inherit", fontWeight: v.nego < v.rent ? 700 : 400 }}>{v.nego}</td>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5" }}>{v.mgmt}</td>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5", color: v.days > 30 ? "#DC2626" : "#5F6577", fontWeight: v.days > 30 ? 700 : 400 }}>{v.days}일</td>
                      <td style={{ padding: "7px 8px", borderBottom: "1px solid #F0F2F5" }}>{isSelected && <span style={{ fontSize: 12, color: "#3B82F6" }}>✓</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedVacancy !== null && (() => {
            const promoVacancies = activeVacancies.filter(v => v.status === "홍보중");
            const sv = promoVacancies[selectedVacancy];
            const isDangi = sv.type === "단기";
            return (
              <div style={{ padding: 14, background: "#fff", border: "1px solid #BFDBFE", borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1A1D23", marginBottom: 10 }}>
                  📦 {sv.building} {sv.room}호 계약 등록
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, marginLeft: 6, fontWeight: 600, background: isDangi ? "#EFF6FF" : "#F0FDF4", color: isDangi ? "#2563EB" : "#16A34A" }}>{sv.type}</span>
                </div>
                {/* 부동산명, 연락처, 입주일, 기간, 만기일 */}
                <div style={{ padding: 12, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#DC2626", marginBottom: 3 }}>부동산명 *</div>
                      <input value={vacancyEdits.broker ?? ""} onChange={e => setVacancyEdits(prev => ({ ...prev, broker: e.target.value }))}
                        placeholder="부동산명 입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#DC2626", marginBottom: 3 }}>연락처 *</div>
                      <input value={vacancyEdits.brokerPhone ?? ""} onChange={e => setVacancyEdits(prev => ({ ...prev, brokerPhone: e.target.value }))}
                        placeholder="010-0000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff", borderColor: !(vacancyEdits.brokerPhone) ? "#FECACA" : undefined }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr auto 1fr" : "1fr auto 1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#DC2626", marginBottom: 3 }}>입주일 *</div>
                      <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                        style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff", borderColor: "#FECACA" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4, gap: 4 }}>
                      {isDangi ? (
                        <button onClick={() => {
                          if (!formDate) return alert("입주일을 먼저 선택하세요");
                          const d = new Date(formDate); d.setMonth(d.getMonth() + 3); d.setDate(d.getDate() - 1);
                          setVacancyEdits(prev => ({ ...prev, expiry: d.toISOString().slice(0, 10) }));
                        }}
                          style={{ padding: "6px 14px", borderRadius: 6, border: "1.5px solid #DC2626", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                          3개월 →
                        </button>
                      ) : (<>
                        <button onClick={() => {
                          if (!formDate) return alert("입주일을 먼저 선택하세요");
                          const d = new Date(formDate); d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1);
                          setVacancyEdits(prev => ({ ...prev, expiry: d.toISOString().slice(0, 10) }));
                        }}
                          style={{ padding: "6px 10px", borderRadius: 6, border: "1.5px solid #DC2626", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                          1년 →
                        </button>
                        <button onClick={() => {
                          if (!formDate) return alert("입주일을 먼저 선택하세요");
                          const d = new Date(formDate); d.setFullYear(d.getFullYear() + 2); d.setDate(d.getDate() - 1);
                          setVacancyEdits(prev => ({ ...prev, expiry: d.toISOString().slice(0, 10) }));
                        }}
                          style={{ padding: "6px 10px", borderRadius: 6, border: "1.5px solid #DC2626", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                          2년 →
                        </button>
                      </>)}
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#DC2626", marginBottom: 3 }}>만기일 *</div>
                      <input type="date" value={vacancyEdits.expiry ?? ""} onChange={e => setVacancyEdits(prev => ({ ...prev, expiry: e.target.value }))}
                        style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff", borderColor: "#FECACA" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>계약일 (자동)</div>
                      <div style={{ padding: "8px 10px", fontSize: 12, background: "#F3F4F6", borderRadius: 8, border: "1px solid #E0E3E9", color: "#5F6577" }}>
                        {new Date().toISOString().slice(0, 10)}
                      </div>
                    </div>
                  </div>
                </div>
                {/* 기본 금액 */}
                {(() => {
                  const negoApplied = vacancyEdits.negoApplied === true;
                  const negoVal = Number(vacancyEdits.nego) || sv.nego;
                  const rentVal = Number(vacancyEdits.rent) || sv.rent;
                  const hasNego = negoVal < (Number(vacancyEdits.rentOriginal) || sv.rent);
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>보증금 (만원)</div>
                        <input type="number" value={vacancyEdits.deposit ?? ""} onChange={e => setVacancyEdits(prev => ({ ...prev, deposit: e.target.value }))}
                          style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: negoApplied ? "#DC2626" : "#8F95A3", marginBottom: 3 }}>월세 (만원) {negoApplied && <span style={{ fontSize: 8, color: "#DC2626" }}>NEGO적용</span>}</div>
                        <input type="number" value={vacancyEdits.rent ?? ""} onChange={e => setVacancyEdits(prev => ({ ...prev, rent: e.target.value }))}
                          style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: negoApplied ? "#FEF2F2" : "#fff", color: negoApplied ? "#DC2626" : "#1A1D23", fontWeight: negoApplied ? 700 : 400 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>NEGO ({sv.nego}만)</div>
                        <button onClick={() => {
                          if (negoApplied) {
                            setVacancyEdits(prev => ({ ...prev, negoApplied: false, rent: String(prev.rentOriginal || sv.rent) }));
                          } else {
                            setVacancyEdits(prev => ({ ...prev, negoApplied: true, rentOriginal: Number(prev.rent) || sv.rent, rent: String(negoVal) }));
                          }
                        }}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                            border: negoApplied ? "1.5px solid #DC2626" : "1.5px solid #3B82F6",
                            background: negoApplied ? "#DC2626" : "#EFF6FF",
                            color: negoApplied ? "#fff" : "#2563EB" }}>
                          {negoApplied ? "✓ 적용" : "미적용"}
                        </button>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>관리비 (만원)</div>
                        <input type="number" value={vacancyEdits.mgmt ?? ""} onChange={e => setVacancyEdits(prev => ({ ...prev, mgmt: e.target.value }))}
                          style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                      </div>
                    </div>
                  );
                })()}
                {/* Row 3: 단기 전용 — 수도, 인터넷, 퇴실청소비, 중개수수료 */}
                {isDangi && (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>수도</div>
                      <input value={vacancyEdits.water ?? ""} onChange={e => setVacancyEdits(prev => ({ ...prev, water: e.target.value }))}
                        style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>인터넷/케이블</div>
                      <input value={vacancyEdits.cable ?? ""} onChange={e => setVacancyEdits(prev => ({ ...prev, cable: e.target.value }))}
                        style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>퇴실청소비 (만원)</div>
                      <input type="number" value={vacancyEdits.exitFee ?? ""} onChange={e => setVacancyEdits(prev => ({ ...prev, exitFee: e.target.value }))}
                        style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#8F95A3", marginBottom: 3 }}>중개수수료 (%)</div>
                      <input type="number" value={vacancyEdits.commBroker ?? ""} onChange={e => setVacancyEdits(prev => ({ ...prev, commBroker: e.target.value }))}
                        style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <button onClick={() => {
                    if (!formDate) return alert("입주일을 선택하세요");
                    if (!(vacancyEdits.brokerPhone || "").trim()) return alert("부동산 연락처를 입력하세요");
                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
                    const registeredAt = `${todayStr} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
                    const newEvt = {
                      date: formDate, type: "계약",
                      building: sv.building, room: sv.room, name: "",
                      color: TYPE_COLORS["계약"], registeredAt, registeredBy: currentStaff?.name || "알수없음",
                      contractDate: todayStr,
                      deposit: Number(vacancyEdits.deposit) || sv.deposit,
                      rent: Number(vacancyEdits.rent) || sv.rent,
                      nego: Number(vacancyEdits.nego) || sv.nego,
                      mgmt: Number(vacancyEdits.mgmt) || sv.mgmt,
                      broker: vacancyEdits.broker || "", brokerPhone: vacancyEdits.brokerPhone || "",
                      moveIn: formDate, expiry: vacancyEdits.expiry || "",
                      ...(isDangi ? {
                        water: vacancyEdits.water ?? sv.water,
                        cable: vacancyEdits.cable ?? sv.cable,
                        exitFee: Number(vacancyEdits.exitFee) || sv.exitFee,
                        commBroker: Number(vacancyEdits.commBroker) || sv.commBroker,
                      } : {}),
                    };
                    setEvents(prev => [...prev, newEvt]);
                    // 공실 상태를 "계약서입력"으로 변경
                    if (setActiveVacancies) {
                      setActiveVacancies(prev => prev.map(x =>
                        x.building === sv.building && x.room === sv.room ? { ...x, status: "계약서입력" } : x
                      ));
                    }
                    openSendModal(newEvt);
                    setFormDate(""); setSelectedVacancy(null); setVacancyEdits({});
                    setShowForm(false);
                  }}
                    style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    계약 등록
                  </button>
                </div>
              </div>
            );
          })()}
          </div>
        </div>
      )}

      {/* 퇴실 등록 Form — 팝업 */}
      {showForm && formType === "퇴실" && setEvents && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { setShowForm(false); setFormBuildingSearch(""); setFormBuilding(""); setFormRoom(""); setFormDate(""); }}>
          <div style={{ background: "#FFFBFB", borderRadius: 16, padding: 24, width: 480, maxWidth: "95vw", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", border: "2px solid #EF4444" }}
            onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23", marginBottom: 14 }}>🚪 퇴실 등록</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>퇴실일</div>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                style={{ ...inputStyle, padding: "9px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
            </div>
            <div style={{ minWidth: 160, position: "relative" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>건물</div>
              <input value={formBuildingSearch} onChange={e => {
                  const v = e.target.value;
                  setFormBuildingSearch(v);
                  setFormBuilding("");
                  setShowBuildingSuggestions(true);
                }}
                onFocus={() => setShowBuildingSuggestions(true)}
                onBlur={() => setTimeout(() => setShowBuildingSuggestions(false), 150)}
                placeholder="건물명 검색 (초성 가능)"
                style={{ ...inputStyle, padding: "9px 10px", fontSize: 12, width: "100%", background: formBuilding ? "#EFF6FF" : "#fff" }} />
              {formBuilding && <div style={{ fontSize: 10, color: "#3B82F6", fontWeight: 700, marginTop: 2 }}>{formBuilding}</div>}
              {showBuildingSuggestions && !formBuilding && (() => {
                const suggestions = BUILDING_NAMES.filter(b => !formBuildingSearch || matchKorean(b, formBuildingSearch));
                return suggestions.length > 0 ? (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #E0E3E9", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: 180, overflowY: "auto", marginTop: 2 }}>
                    {suggestions.map(b => (
                      <div key={b} onMouseDown={e => { e.preventDefault(); setFormBuilding(b); setFormBuildingSearch(b); setShowBuildingSuggestions(false); }}
                        style={{ padding: "8px 12px", fontSize: 12, cursor: "pointer", borderBottom: "1px solid #F3F4F6" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                        {b}
                      </div>
                    ))}
                  </div>
                ) : formBuildingSearch ? (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #E0E3E9", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, marginTop: 2 }}>
                    <div style={{ padding: "10px 12px", fontSize: 11, color: "#8F95A3", textAlign: "center" }}>일치하는 건물이 없습니다</div>
                  </div>
                ) : null;
              })()}
            </div>
            <div style={{ minWidth: 100 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>호실</div>
              <input value={formRoom} onChange={e => setFormRoom(e.target.value)} placeholder="301"
                style={{ ...inputStyle, padding: "9px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
            </div>
            <button onClick={() => {
              if (!formDate) return alert("퇴실일을 선택하세요");
              if (!formBuilding || !formRoom) return alert("건물, 호실을 입력하세요");
              const isVacant = activeVacancies.some(v => v.building === formBuilding && String(v.room) === String(formRoom));
              if (isVacant) return alert("해당 호실은 공실관리에 등록된 호실입니다.\n공실에는 퇴실등록을 할 수 없습니다.");
              const now = new Date();
              const registeredAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
              setEvents(prev => [...prev, { date: formDate, type: "퇴실", building: formBuilding, room: formRoom, name: "", color: TYPE_COLORS["퇴실"], registeredAt, registeredBy: currentStaff?.name || "알수없음" }]);
              setFormDate(""); setFormBuilding(""); setFormBuildingSearch(""); setFormRoom(""); setShowForm(false);
            }}
              style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#EF4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              퇴실 등록
            </button>
          </div>
          </div>
        </div>
      )}

      {/* 휴무 등록 Form — 팝업 */}
      {showForm && formType === "휴무" && setEvents && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { setShowForm(false); setFormDate(""); setFormName(""); }}>
          <div style={{ background: "#FDFBFF", borderRadius: 16, padding: 24, width: 400, maxWidth: "95vw", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", border: "2px solid #8B5CF6" }}
            onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23", marginBottom: 14 }}>🏖️ 휴무 등록</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>휴무일</div>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                style={{ ...inputStyle, padding: "9px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
            </div>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>이름</div>
              <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="직원명"
                style={{ ...inputStyle, padding: "9px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
            </div>
            <button onClick={() => {
              if (!formDate) return alert("휴무일을 선택하세요");
              if (!formName) return alert("이름을 입력하세요");
              const now = new Date();
              const registeredAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
              setEvents(prev => [...prev, { date: formDate, type: "휴무", name: formName, color: TYPE_COLORS["휴무"], registeredAt, registeredBy: currentStaff?.name || "알수없음" }]);
              setFormDate(""); setFormName(""); setShowForm(false);
            }}
              style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#8B5CF6", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              휴무 등록
            </button>
          </div>
          </div>
        </div>
      )}

      {/* 계약정보 전송 모달 — 건물 계약문자 템플릿 지원 */}
      {pendingSendEvt && (() => {
        const evt = pendingSendEvt;
        const tplKeys = getTemplateKeys(evt);
        const dep = Number(evt.deposit) || 0;
        const rent = Number(evt.rent) || 0;
        const mgmt = Number(evt.mgmt) || 0;
        const water = typeof evt.water === "string" && !isNaN(Number(evt.water)) ? Number(evt.water) : 0;
        const cable = typeof evt.cable === "string" && !isNaN(Number(evt.cable)) ? Number(evt.cable) : 0;
        const exitFee = Number(evt.exitFee) || 0;
        const total = dep + rent + mgmt + water + cable;
        return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setPendingSendEvt(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 0, width: 480, maxWidth: "95vw", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
            onClick={e => e.stopPropagation()}>
            {/* 헤더 */}
            <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #1E40AF, #3B82F6)", color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>📤 계약정보 전송</div>
                <button onClick={() => setPendingSendEvt(null)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>✕</button>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                {evt.building} {evt.room}호 → {evt.broker || "부동산"} ({evt.brokerPhone || "-"})
              </div>
            </div>

            <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
              {/* 계약 요약 카드 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
                {[
                  { label: "예치금", value: `${dep}만`, color: "#059669" },
                  { label: "월세", value: `${rent}만`, color: "#2563EB" },
                  { label: "입주금 총합", value: `${total}만`, color: "#DC2626" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: s.color + "08", border: `1px solid ${s.color}25`, textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#8F95A3", fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* 템플릿 선택 */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {tplKeys.map(tpl => (
                  <button key={tpl} onClick={() => { setSelectedTemplate(tpl); setSendMsg(buildContractMsg(evt, tpl)); }}
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                      border: selectedTemplate === tpl ? "2px solid #3B82F6" : "1px solid #E0E3E9",
                      background: selectedTemplate === tpl ? (tpl === "건물 계약문자" ? "#EFF6FF" : "#EFF6FF") : "#fff",
                      color: selectedTemplate === tpl ? "#1E40AF" : "#5F6577",
                      boxShadow: selectedTemplate === tpl ? "0 2px 8px rgba(59,130,246,0.15)" : "none",
                    }}>
                    {tpl === "건물 계약문자" ? `🏢 ${evt.building} 전용` : tpl}
                  </button>
                ))}
              </div>

              {/* 메시지 편집 영역 */}
              <textarea value={sendMsg} onChange={e => setSendMsg(e.target.value)}
                style={{ width: "100%", minHeight: 260, padding: 14, borderRadius: 10, border: "1.5px solid #E0E3E9", fontSize: 12.5, fontFamily: "inherit", lineHeight: 1.8, color: "#1A1D23", resize: "vertical", boxSizing: "border-box", background: "#FAFBFC" }} />
              <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 4, textAlign: "right" }}>
                전송 전 내용을 자유롭게 수정할 수 있습니다
              </div>
            </div>

            {/* 전송 버튼 */}
            <div style={{ padding: "14px 24px 18px", borderTop: "1px solid #F0F2F5", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { handleSendSMS(evt, sendMsg); setPendingSendEvt(null); }}
                  style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  💬 문자(SMS) 전송
                </button>
                <button onClick={() => { handleSendKakao(evt, sendMsg); setPendingSendEvt(null); }}
                  style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: "none", background: "#FEE500", color: "#3C1E1E", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  💛 카카오톡 복사
                </button>
              </div>
              <button onClick={() => setPendingSendEvt(null)}
                style={{ width: "100%", padding: "10px 16px", borderRadius: 10, border: "1px solid #E0E3E9", background: "#fff", color: "#8F95A3", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                나중에 전송
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        {/* Calendar Grid */}
        <Card style={{ padding: 16 }}>
          {/* Month Navigation + Registration Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>‹</button>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23", margin: 0 }}>
                {year}년 {month + 1}월
              </h3>
              <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>›</button>
            </div>
            {setEvents && (
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { type: "계약", label: "📦 계약등록", bg: "#3B82F6" },
                  { type: "퇴실", label: "🚪 퇴실등록", bg: "#EF4444" },
                  { type: "휴무", label: "🏖️ 휴무등록", bg: "#8B5CF6" },
                ].map(btn => {
                  const isActive = showForm && formType === btn.type;
                  return (
                    <button key={btn.type} onClick={() => {
                      if (isActive) { setShowForm(false); }
                      else { setShowForm(true); setFormType(btn.type); setSelectedVacancy(null); setVacancyEdits({}); setFormDate(selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : ""); setFormBuilding(""); setFormRoom(""); setFormName(""); }
                    }}
                      style={{ padding: "6px 12px", borderRadius: 8, border: isActive ? `2px solid ${btn.bg}` : "1px solid #E0E3E9", background: isActive ? "#fff" : btn.bg, color: isActive ? btn.bg : "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {isActive ? "✕ 닫기" : btn.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Day Headers */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#8F95A3", padding: "8px 0" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(7, 1fr)", gap: 2 }}>
            {days.map((day, i) => {
              if (!day) return <div key={i} style={{ minHeight: 120 }} />;
              const evts = getEvents(day);
              const dayOfWeek = (firstDay + day - 1) % 7;
              const selected = selectedDay === day;
              const isDrop = dropTargetDay === day;
              return (
                <div key={i} onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                  onDragEnter={e => { e.preventDefault(); setDropTargetDay(day); }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropTargetDay(null); }}
                  onDrop={e => {
                    e.preventDefault();
                    setDropTargetDay(null);
                    if (!setEvents) return;
                    const newDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    try {
                      const raw = e.dataTransfer.getData("text/plain");
                      if (!raw) return;
                      const d = JSON.parse(raw);
                      if (d.date === newDate) { setDragEventIndex(null); return; }
                      let matched = false;
                      setEvents(prev => prev.map(evt => {
                        if (!matched && evt.date === d.date && evt.type === d.type
                          && (evt.building || "") === d.building && (evt.room || "") === d.room && (evt.name || "") === d.name) {
                          matched = true;
                          const updated = { ...evt, date: newDate };
                          if (evt.moveIn && evt.moveIn === d.date) updated.moveIn = newDate;
                          return updated;
                        }
                        return evt;
                      }));
                    } catch(err) { console.warn("drag-drop error:", err); }
                    setDragEventIndex(null);
                    setSelectedDay(day);
                  }}
                  style={{
                    minHeight: 120, padding: "4px 6px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
                    background: isDrop ? "#DBEAFE" : selected ? "#EFF6FF" : isToday(day) ? "#FFFBEB" : "transparent",
                    border: isDrop ? "2px dashed #3B82F6" : selected ? "2px solid #3B82F6" : isToday(day) ? "1px solid #FDE68A" : "1px solid #F0F2F5",
                  }}
                  onMouseEnter={e => !selected && !isDrop && (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={e => !selected && !isDrop && (e.currentTarget.style.background = isToday(day) ? "#FFFBEB" : "transparent")}>
                  <div style={{ fontSize: 12, fontWeight: isToday(day) ? 800 : 600, color: dayOfWeek === 0 ? "#EF4444" : dayOfWeek === 6 ? "#3B82F6" : "#1A1D23", marginBottom: 3 }}>
                    {day}
                    {isToday(day) && <span style={{ fontSize: 8, background: "#F59E0B", color: "#fff", padding: "1px 4px", borderRadius: 3, marginLeft: 3, fontWeight: 700 }}>오늘</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {evts.slice(0, 3).map((evt, ei) => (
                      <div key={ei}
                        draggable={!!setEvents}
                        onClick={e => e.stopPropagation()}
                        onDoubleClick={e => { e.stopPropagation(); if (setEvents) openEditEvent(evt); }}
                        onDragStart={e => {
                          setDragEventIndex(true);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", JSON.stringify({ date: evt.date, type: evt.type, building: evt.building || "", room: evt.room || "", name: evt.name || "" }));
                          e.currentTarget.style.opacity = "0.4";
                        }}
                        onDragEnd={e => { e.currentTarget.style.opacity = "1"; setDragEventIndex(null); setDropTargetDay(null); }}
                        style={{ fontSize: 9.5, fontWeight: 600, padding: "2px 4px", borderRadius: 4, background: TYPE_BG[evt.type], color: TYPE_COLORS[evt.type], whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: setEvents ? "grab" : "default" }}>
                        {TYPE_ICON[evt.type]} {evt.type === "휴무" ? evt.name : `${evt.building} ${evt.room}`}
                      </div>
                    ))}
                    {evts.length > 3 && <div style={{ fontSize: 9, color: "#8F95A3", textAlign: "center" }}>+{evts.length - 3}건</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Side Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Selected Day Detail */}
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 12 }}>
              {selectedDay ? `${month + 1}/${selectedDay} 일정` : "날짜를 선택하세요"}
            </div>
            {selectedDay && selectedEvents.length === 0 && (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#B0B5C1", fontSize: 13 }}>일정이 없습니다</div>
            )}
            {selectedEvents.map((evt, i) => (
              <div key={i} onDoubleClick={() => { if (setEvents) openEditEvent(evt); }}
                style={{ padding: "10px 12px", marginBottom: 8, borderRadius: 8, background: TYPE_BG[evt.type], border: `1px solid ${TYPE_BORDER[evt.type]}`, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{TYPE_ICON[evt.type]}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: TYPE_COLORS[evt.type] }}>{evt.type}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {setEvents && (
                      <button onClick={() => openEditEvent(evt)}
                        style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        수정
                      </button>
                    )}
                    {setEvents && (
                      <button onClick={() => { const idx = calendarEvents.indexOf(evt); if (idx > -1) setEvents(prev => prev.filter((_, j) => j !== idx)); }}
                        style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        삭제
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1D23" }}>{evt.type === "휴무" ? `${evt.name} 휴무` : `${evt.building} ${evt.room}호 ${evt.type}`}</div>
                {evt.type === "계약" && evt.deposit != null && (
                  <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 10, color: "#5F6577" }}>
                    <span>보증금 {evt.deposit}</span><span>월세 {evt.rent}</span>{evt.mgmt > 0 && <span>관리 {evt.mgmt}</span>}
                  </div>
                )}
                {evt.type === "계약" && (evt.moveIn || evt.expiry) && (
                  <div style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 10, color: "#3B82F6" }}>
                    {evt.moveIn && <span>입주 {evt.moveIn}</span>}{evt.expiry && <span>만기 {evt.expiry}</span>}
                  </div>
                )}
                {evt.broker && <div style={{ fontSize: 10, color: "#6B7280", marginTop: 3 }}>🏠 {evt.broker}{evt.brokerPhone ? ` · ${evt.brokerPhone}` : ""}</div>}
                {evt.registeredBy && <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 3 }}>등록: {evt.registeredBy} · {evt.registeredAt}</div>}
                {evt.type === "계약" && (
                  <div style={{ marginTop: 6 }}>
                    <button onClick={(e) => { e.stopPropagation(); openSendModal(evt); }}
                      style={{ padding: "4px 12px", borderRadius: 6, border: "1.5px solid #10B981", background: "#ECFDF5", color: "#059669", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      📤 계약정보 전송
                    </button>
                  </div>
                )}
              </div>
            ))}
          </Card>

          {/* Upcoming Events */}
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1D23", marginBottom: 12 }}>📋 이번 달 전체 일정</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
              {filteredMonthEvents.sort((a, b) => a.date.localeCompare(b.date)).map((evt, i) => (
                <div key={i} onClick={() => setSelectedDay(parseInt(evt.date.split("-")[2]))}
                  onDoubleClick={() => { if (setEvents) openEditEvent(evt); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 7, cursor: "pointer", transition: "background 0.1s", border: "1px solid #F0F2F5" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23" }}>{parseInt(evt.date.split("-")[2])}</div>
                    <div style={{ fontSize: 9, color: "#B0B5C1" }}>{month + 1}월</div>
                  </div>
                  <div style={{ width: 3, height: 28, borderRadius: 2, background: TYPE_COLORS[evt.type], flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1A1D23", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {TYPE_ICON[evt.type]} {evt.type === "휴무" ? `${evt.name} 휴무` : `${evt.building} ${evt.room}${evt.type}`}
                    </div>
                    {evt.building && <div style={{ fontSize: 10, color: "#8F95A3" }}>{evt.name}</div>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: TYPE_BG[evt.type], color: TYPE_COLORS[evt.type], flexShrink: 0 }}>{evt.type}</span>
                  {setEvents && (
                    <button onClick={(e) => { e.stopPropagation(); openEditEvent(evt); }}
                      style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 9, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                      수정
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Registration List — newest first */}
      <Card style={{ padding: 16, marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 14 }}>📋 등록 일정 리스트</div>
        {filteredMonthEvents.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "#B0B5C1", fontSize: 13 }}>등록된 일정이 없습니다</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...filteredMonthEvents].sort((a, b) => b.date.localeCompare(a.date)).map((evt, i) => (
              <div key={i} onClick={() => setSelectedDay(parseInt(evt.date.split("-")[2]))}
                onDoubleClick={() => { if (setEvents) openEditEvent(evt); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, cursor: "pointer", transition: "background 0.1s", border: "1px solid #F0F2F5" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 44, textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23" }}>{parseInt(evt.date.split("-")[2])}</div>
                  <div style={{ fontSize: 9, color: "#B0B5C1" }}>{month + 1}월</div>
                </div>
                <div style={{ width: 3, height: 32, borderRadius: 2, background: TYPE_COLORS[evt.type], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1D23", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {TYPE_ICON[evt.type]} {evt.type === "휴무" ? `${evt.name} 휴무` : `${evt.building} ${evt.room}호 ${evt.type}`}
                  </div>
                  {evt.type === "계약" && evt.deposit != null && (
                    <div style={{ display: "flex", gap: 6, marginTop: 2, fontSize: 10, color: "#3B82F6", flexWrap: "wrap" }}>
                      <span>보증금 {evt.deposit}</span><span>월세 {evt.rent}</span>{evt.mgmt > 0 && <span>관리 {evt.mgmt}</span>}
                      {evt.moveIn && <span style={{ color: "#059669" }}>입주 {evt.moveIn}</span>}
                      {evt.expiry && <span style={{ color: "#DC2626" }}>만기 {evt.expiry}</span>}
                      {evt.broker && <span style={{ color: "#6B7280" }}>· 🏠 {evt.broker}{evt.brokerPhone ? ` ${evt.brokerPhone}` : ""}</span>}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                    {evt.registeredBy && <span style={{ fontSize: 10, color: "#6B7280" }}>등록: {evt.registeredBy}</span>}
                    {evt.registeredAt && <span style={{ fontSize: 10, color: "#B0B5C1" }}>{evt.registeredAt}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#8F95A3", flexShrink: 0, marginRight: 4 }}>{evt.date}</div>
                <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 5, background: TYPE_BG[evt.type], color: TYPE_COLORS[evt.type], flexShrink: 0 }}>{evt.type}</span>
                {evt.type === "계약" && (
                  <button onClick={(e) => { e.stopPropagation(); openSendModal(evt); }}
                    style={{ padding: "3px 10px", borderRadius: 5, border: "1.5px solid #10B981", background: "#ECFDF5", color: "#059669", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                    📤 전송
                  </button>
                )}
                {setEvents && (
                  <button onClick={(e) => { e.stopPropagation(); openEditEvent(evt); }}
                    style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                    수정
                  </button>
                )}
                {setEvents && (
                  <button onClick={(e) => { e.stopPropagation(); const idx = calendarEvents.indexOf(evt); if (idx > -1) setEvents(prev => prev.filter((_, j) => j !== idx)); }}
                    style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 퇴실사진 등록 모달 */}
      {photoModalTenant && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setPhotoModalTenant(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>📷 퇴실사진 등록 — {photoModalTenant.building} {photoModalTenant.room}호</div>
              <button onClick={() => setPhotoModalTenant(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8F95A3" }}>✕</button>
            </div>
            <PhotoDropZone
              label="퇴실사진" color="#DC2626" maxPhotos={50}
              photos={photoModalTenant.moveOutPhotos || []}
              onZoom={(idx) => setZoomPhoto({ photos: photoModalTenant.moveOutPhotos || [], index: idx, zoom: 1 })}
              onAdd={(newPhotos) => {
                const updated = [...(photoModalTenant.moveOutPhotos || []), ...newPhotos];
                setPhotoModalTenant(prev => ({ ...prev, moveOutPhotos: updated }));
                if (photoModalTenant._isPastTenant) {
                  const hk = `${photoModalTenant.building}_${photoModalTenant.room}`;
                  setPastTenantsData?.(prev => {
                    const records = [...(prev[hk] || [])];
                    if (records.length > 0) records[records.length - 1] = { ...records[records.length - 1], moveOutPhotos: updated };
                    return { ...prev, [hk]: records };
                  });
                } else {
                  setActiveTenants(prev => prev.map(t =>
                    (photoModalTenant.id && t.id === photoModalTenant.id) ||
                    (t.building === photoModalTenant.building && String(t.room) === String(photoModalTenant.room))
                      ? { ...t, moveOutPhotos: updated } : t
                  ));
                }
              }}
              onRemove={(idx) => {
                const updated = (photoModalTenant.moveOutPhotos || []).filter((_, j) => j !== idx);
                setPhotoModalTenant(prev => ({ ...prev, moveOutPhotos: updated }));
                if (photoModalTenant._isPastTenant) {
                  const hk = `${photoModalTenant.building}_${photoModalTenant.room}`;
                  setPastTenantsData?.(prev => {
                    const records = [...(prev[hk] || [])];
                    if (records.length > 0) records[records.length - 1] = { ...records[records.length - 1], moveOutPhotos: updated };
                    return { ...prev, [hk]: records };
                  });
                } else {
                  setActiveTenants(prev => prev.map(t =>
                    (photoModalTenant.id && t.id === photoModalTenant.id) ||
                    (t.building === photoModalTenant.building && String(t.room) === String(photoModalTenant.room))
                      ? { ...t, moveOutPhotos: updated } : t
                  ));
                }
              }}
            />
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button onClick={() => setPhotoModalTenant(null)}
                style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 입주체크사진 등록/수정 모달 */}
      {checkPhotoModalTenant && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setCheckPhotoModalTenant(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>📷 입주체크사진 등록 — {checkPhotoModalTenant.building} {checkPhotoModalTenant.room}호</div>
              <button onClick={() => setCheckPhotoModalTenant(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8F95A3" }}>✕</button>
            </div>
            <PhotoDropZone
              label="입주체크사진" color="#F59E0B" maxPhotos={50}
              photos={checkPhotoModalTenant.moveOutCheckPhotos || []}
              onZoom={(idx) => setZoomPhoto({ photos: checkPhotoModalTenant.moveOutCheckPhotos || [], index: idx, zoom: 1 })}
              onAdd={(newPhotos) => {
                const updated = [...(checkPhotoModalTenant.moveOutCheckPhotos || []), ...newPhotos];
                setCheckPhotoModalTenant(prev => ({ ...prev, moveOutCheckPhotos: updated }));
                if (checkPhotoModalTenant._isPastTenant) {
                  const hk = `${checkPhotoModalTenant.building}_${checkPhotoModalTenant.room}`;
                  setPastTenantsData?.(prev => {
                    const records = [...(prev[hk] || [])];
                    if (records.length > 0) records[records.length - 1] = { ...records[records.length - 1], moveOutCheckPhotos: updated };
                    return { ...prev, [hk]: records };
                  });
                } else {
                  setActiveTenants(prev => prev.map(t =>
                    (checkPhotoModalTenant.id && t.id === checkPhotoModalTenant.id) ||
                    (t.building === checkPhotoModalTenant.building && String(t.room) === String(checkPhotoModalTenant.room))
                      ? { ...t, moveOutCheckPhotos: updated } : t
                  ));
                }
              }}
              onRemove={(idx) => {
                const updated = (checkPhotoModalTenant.moveOutCheckPhotos || []).filter((_, j) => j !== idx);
                setCheckPhotoModalTenant(prev => ({ ...prev, moveOutCheckPhotos: updated }));
                if (checkPhotoModalTenant._isPastTenant) {
                  const hk = `${checkPhotoModalTenant.building}_${checkPhotoModalTenant.room}`;
                  setPastTenantsData?.(prev => {
                    const records = [...(prev[hk] || [])];
                    if (records.length > 0) records[records.length - 1] = { ...records[records.length - 1], moveOutCheckPhotos: updated };
                    return { ...prev, [hk]: records };
                  });
                } else {
                  setActiveTenants(prev => prev.map(t =>
                    (checkPhotoModalTenant.id && t.id === checkPhotoModalTenant.id) ||
                    (t.building === checkPhotoModalTenant.building && String(t.room) === String(checkPhotoModalTenant.room))
                      ? { ...t, moveOutCheckPhotos: updated } : t
                  ));
                }
              }}
            />
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button onClick={() => setCheckPhotoModalTenant(null)}
                style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#F59E0B", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 수정 모달 */}
      {editEvent && (() => {
        const { edits } = editEvent;
        const edt = (k, v) => setEditEvent(prev => ({ ...prev, edits: { ...prev.edits, [k]: v } }));
        const fld = (label, key, type = "text") => (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>{label}</div>
            <input value={edits[key] || ""} onChange={e => edt(key, type === "number" ? Number(e.target.value) || 0 : e.target.value)}
              type={type} style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
          </div>
        );
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setEditEvent(null)}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 420, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23" }}>✏️ {edits.type} 수정</div>
                <button onClick={() => setEditEvent(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8F95A3" }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* 공통: 날짜 */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>날짜</div>
                  <input type="date" value={edits.date || ""} onChange={e => {
                    edt("date", e.target.value);
                    if (edits.type === "계약" && edits.moveIn === editEvent.evt.date) edt("moveIn", e.target.value);
                  }} style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
                </div>

                {/* 계약 */}
                {edits.type === "계약" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {fld("건물명", "building")}
                      {fld("호실", "room")}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {fld("보증금 (만원)", "deposit", "number")}
                      {fld("월세 (만원)", "rent", "number")}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {fld("NEGO (만원)", "nego", "number")}
                      {fld("관리비 (만원)", "mgmt", "number")}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>입주일</div>
                        <input type="date" value={edits.moveIn || ""} onChange={e => edt("moveIn", e.target.value)}
                          style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>만기일</div>
                        <input type="date" value={edits.expiry || ""} onChange={e => edt("expiry", e.target.value)}
                          style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>계약일</div>
                        <input type="date" value={edits.contractDate || ""} onChange={e => edt("contractDate", e.target.value)}
                          style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>등록자</div>
                        <input value={edits.registeredBy || ""} readOnly
                          style={{ ...inputStyle, padding: "8px 10px", fontSize: 12, background: "#F3F4F6", color: "#8F95A3" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {fld("부동산", "broker")}
                      {fld("부동산 연락처", "brokerPhone")}
                    </div>
                    {(edits.water != null || edits.cable != null || edits.exitFee != null || edits.commBroker != null) && (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", marginTop: 4 }}>단기 전용</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {fld("수도", "water")}
                          {fld("인터넷/케이블", "cable")}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {fld("퇴실청소비 (만원)", "exitFee", "number")}
                          {fld("중개수수료 (%)", "commBroker", "number")}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* 퇴실 */}
                {edits.type === "퇴실" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {fld("건물명", "building")}
                      {fld("호실", "room")}
                    </div>
                  </>
                )}

                {/* 휴무 */}
                {edits.type === "휴무" && (
                  <>
                    {fld("이름", "name")}
                  </>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
                <button onClick={() => { const idx = editEvent.idx; setEditEvent(null); setEvents(prev => prev.filter((_, j) => j !== idx)); }}
                  style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  일정삭제
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setEditEvent(null)}
                    style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    취소
                  </button>
                  <button onClick={saveEditEvent}
                    style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 사진비교 모달 — 입주체크사진(시작) vs 퇴실사진(끝) */}
      {compareData && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setCompareData(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "90%", maxWidth: 900, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>🔍 사진 비교 — {compareData.building} {compareData.room}호</div>
              <button onClick={() => setCompareData(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8F95A3" }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {/* 왼쪽: 입주체크사진 (시작) */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#F59E0B", marginBottom: 8, padding: "4px 10px", borderRadius: 6, background: "#FFFBEB", textAlign: "center" }}>
                  📋 입주체크사진 (시작) — {compareData.moveInCheckPhotos.length}장
                </div>
                {compareData.moveInCheckPhotos.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 12, background: "#F9FAFB", borderRadius: 8 }}>등록된 사진 없음</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                    {compareData.moveInCheckPhotos.map((p, i) => (
                      <div key={i} onClick={() => setZoomPhoto({ photos: compareData.moveInCheckPhotos, index: i, zoom: 1 })} style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", border: "2px solid #FDE68A", aspectRatio: "1" }}>
                        <img src={typeof p === "string" ? p : URL.createObjectURL(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* 가운데 화살표 */}
              <div style={{ display: "flex", alignItems: "center", fontSize: 24, color: "#9CA3AF", flexShrink: 0 }}>→</div>
              {/* 오른쪽: 퇴실사진 (끝) */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#DC2626", marginBottom: 8, padding: "4px 10px", borderRadius: 6, background: "#FEF2F2", textAlign: "center" }}>
                  🚪 퇴실사진 (끝) — {compareData.moveOutPhotos.length}장
                </div>
                {compareData.moveOutPhotos.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 12, background: "#F9FAFB", borderRadius: 8 }}>등록된 사진 없음</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                    {compareData.moveOutPhotos.map((p, i) => (
                      <div key={i} onClick={() => setZoomPhoto({ photos: compareData.moveOutPhotos, index: i, zoom: 1 })} style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", border: "2px solid #FECACA", aspectRatio: "1" }}>
                        <img src={typeof p === "string" ? p : URL.createObjectURL(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right", marginTop: 16 }}>
              <button onClick={() => setCompareData(null)}
                style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#6366F1", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사진 확대 모달 — 스크롤 줌 + 좌우 방향키 */}
      {zoomPhoto && (() => {
        const zp = zoomPhoto;
        const photo = zp.photos[zp.index];
        const src = typeof photo === "string" ? photo : URL.createObjectURL(photo);
        const goTo = (dir) => {
          const next = zp.index + dir;
          if (next >= 0 && next < zp.photos.length) setZoomPhoto({ ...zp, index: next, zoom: 1 });
        };
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,.9)", display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}
            tabIndex={0} ref={el => el && el.focus()}
            onClick={() => setZoomPhoto(null)}
            onKeyDown={e => {
              if (e.key === "ArrowLeft") { e.preventDefault(); goTo(-1); }
              else if (e.key === "ArrowRight") { e.preventDefault(); goTo(1); }
              else if (e.key === "Escape") setZoomPhoto(null);
            }}
            onWheel={e => {
              e.stopPropagation();
              const delta = e.deltaY > 0 ? -0.15 : 0.15;
              setZoomPhoto(prev => prev ? { ...prev, zoom: Math.max(0.3, Math.min(5, prev.zoom + delta)) } : null);
            }}>
            {/* 왼쪽 화살표 */}
            {zp.index > 0 && (
              <button onClick={e => { e.stopPropagation(); goTo(-1); }}
                style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.15)", border: "none", fontSize: 28, color: "#fff", cursor: "pointer", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                ‹
              </button>
            )}
            {/* 오른쪽 화살표 */}
            {zp.index < zp.photos.length - 1 && (
              <button onClick={e => { e.stopPropagation(); goTo(1); }}
                style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.15)", border: "none", fontSize: 28, color: "#fff", cursor: "pointer", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                ›
              </button>
            )}
            {/* 사진 */}
            <img src={src} alt=""
              style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, boxShadow: "0 0 40px rgba(0,0,0,.5)", transform: `scale(${zp.zoom})`, transition: "transform 0.1s ease-out" }}
              onClick={e => e.stopPropagation()}
              draggable={false} />
            {/* 상단 정보 */}
            <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.5)", borderRadius: 20, padding: "6px 16px", color: "#fff", fontSize: 13, fontWeight: 700 }}>
              {zp.index + 1} / {zp.photos.length}
              {zp.zoom !== 1 && <span style={{ marginLeft: 8, fontSize: 11, color: "#93C5FD" }}>{Math.round(zp.zoom * 100)}%</span>}
            </div>
            {/* 닫기 */}
            <button onClick={() => setZoomPhoto(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,.2)", border: "none", fontSize: 24, color: "#fff", cursor: "pointer", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>
            {/* 하단 안내 */}
            <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,.4)", fontSize: 11 }}>
              ← → 이전/다음 · 스크롤 확대/축소 · ESC 닫기
            </div>
          </div>
        );
      })()}
      {/* 계약파기 건물주보고 모달 */}
      {breakReport && (() => {
        const { ev, owners, msgText } = breakReport;
        const ownerPhone = owners[0]?.phone || "";
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setBreakReport(null)}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: 16, padding: 24, width: isMobile ? "92%" : 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>📩 계약파기 건물주 보고 — {ev.building} {ev.room}호</span>
                <button onClick={() => setBreakReport(null)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
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
                <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>💬 전송 내용</div>
                <textarea id="break-report-msg" defaultValue={msgText} rows={14}
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => {
                  const msg = document.getElementById("break-report-msg")?.value || msgText;
                  if (!ownerPhone) return alert("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요.");
                  window.open(`sms:${ownerPhone}?body=${encodeURIComponent(msg)}`, "_blank");
                  setBreakReport(null);
                }}
                  style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  📱 문자 보내기
                </button>
                <button onClick={() => {
                  const msg = document.getElementById("break-report-msg")?.value || msgText;
                  if (!ownerPhone) return alert("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요.");
                  window.open(`https://story.kakao.com/share?url=&text=${encodeURIComponent(msg)}`, "_blank");
                  setBreakReport(null);
                }}
                  style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "#FEE500", color: "#3C1E1E", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  💬 카카오톡
                </button>
                <button onClick={() => {
                  const msg = document.getElementById("break-report-msg")?.value || msgText;
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
