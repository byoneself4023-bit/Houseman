import { useState, useMemo, type DragEvent, type MouseEvent } from 'react';
import { useIsMobile, fmt } from '@/utils';
import { useLocalStorage } from '@/utils/useLocalStorage';
import { matchKorean } from '@/utils/koreanSearch';
import { Card, SectionTitle, RoomTypeBadge } from '@/components';
import { getRoomType } from '@/config';

interface RenewalNote {
  note: string;
  date: string;
  time: string;
  done: boolean;
  building: string;
  room: string;
}

interface RenewedRoom {
  date: string;
}

interface RenewalTenant {
  name: string;
  building: string;
  room: string;
  phone: string;
  deposit: number;
  rent: number;
  moveIn?: string;
  expiry?: string;
  daysLeft: number;
  renewalDate: Date | null;
  tacit: boolean;
  [key: string]: any;
}

interface FilterItem {
  id: string;
  label: string;
  bg: string;
  activeBg: string;
  color: string;
  activeColor: string;
  emphasized?: boolean;
}

interface NoteItem extends RenewalNote {
  rk: string;
}

interface RenewalPageProps {
  myBuildings?: string[];
  activeTenants?: Record<string, any>[];
  isLoading?: boolean;
}

export const RenewalPage: React.FC<RenewalPageProps> = ({ myBuildings = [], activeTenants = [] }) => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [rangeFilter, setRangeFilter] = useState("전체");
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  // { "건물_호실": { note, date, time, done, building, room } }
  const [renewalNotes, setRenewalNotes] = useLocalStorage<Record<string, RenewalNote>>("hm_renewalNotes", {});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formNote, setFormNote] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("10:00");
  const [formBuilding, setFormBuilding] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [dropTargetDay, setDropTargetDay] = useState<number | null>(null);
  // 재계약 완료 목록 (만기 연장된 호실)
  const [renewedRooms, setRenewedRooms] = useLocalStorage<Record<string, RenewedRoom>>("hm_renewedRooms", {});

  const today = new Date();

  // 묵시적 갱신: 만기가 지났으면 매년 같은 월/일이 재계약 시점
  // 다음 돌아오는 월/일까지 남은 일수를 반환
  const getNextRenewalDate = (t: Record<string, any>): { date: Date | null; daysLeft: number; tacit: boolean } => {
    if (!t.expiry) return { date: null, daysLeft: Infinity, tacit: false };
    const exp = new Date(t.expiry);
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    // 아직 만기 전이면 그대로
    if (diff >= 0) return { date: exp, daysLeft: diff, tacit: false };
    // 만기 지남 → 묵시적 갱신. 올해 같은 월/일 찾기
    const thisYear = today.getFullYear();
    const m = exp.getMonth();
    const d = exp.getDate();
    let next = new Date(thisYear, m, d);
    // 올해 날짜가 이미 지났으면 내년으로
    if (next < today) next = new Date(thisYear + 1, m, d);
    const daysLeft = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { date: next, daysLeft, tacit: true };
  };

  const tenants = useMemo((): RenewalTenant[] => {
    const base = myBuildings.length > 0
      ? activeTenants.filter(t => myBuildings.includes(t.building))
      : activeTenants;
    const renewalTypes = new Set(["일반임대", "근생"]);
    return base
      .filter(t => {
        if (!t.name || t.name === "퇴실" || !t.expiry) return false;
        const rt = getRoomType(t.building, t.room);
        if (!renewalTypes.has(rt)) return false;
        if (renewedRooms[`${t.building}_${t.room}`]) return false;
        const { daysLeft } = getNextRenewalDate(t);
        return daysLeft <= 90;
      })
      .map(t => {
        const { date, daysLeft, tacit } = getNextRenewalDate(t);
        return { ...t, daysLeft, renewalDate: date, tacit } as RenewalTenant;
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [myBuildings, activeTenants]);

  const filtered = useMemo(() => {
    let list = tenants;
    if (search) list = list.filter(t => matchKorean(t.building, search) || matchKorean(t.name, search) || t.room.includes(search));
    if (rangeFilter === "묵시적갱신") list = list.filter(t => t.tacit);
    else if (rangeFilter === "1개월") list = list.filter(t => t.daysLeft <= 30);
    else if (rangeFilter === "2개월") list = list.filter(t => t.daysLeft > 30 && t.daysLeft <= 60);
    else if (rangeFilter === "3개월") list = list.filter(t => t.daysLeft > 60 && t.daysLeft <= 90);
    return list;
  }, [tenants, search, rangeFilter]);

  const tacitCount = tenants.filter(t => t.tacit).length;
  const within1m = tenants.filter(t => t.daysLeft <= 30).length;
  const within2m = tenants.filter(t => t.daysLeft > 30 && t.daysLeft <= 60).length;
  const within3m = tenants.filter(t => t.daysLeft > 60 && t.daysLeft <= 90).length;

  // 65일 알림 대상 (60~70일 범위)
  const alert65Tenants = tenants.filter(t => t.daysLeft >= 60 && t.daysLeft <= 70);

  const filters: FilterItem[] = [
    { id: "전체", label: `전체 (${tenants.length})`, bg: "#F3F4F6", activeBg: "#1A1D23", color: "#5F6577", activeColor: "#fff" },
    { id: "묵시적갱신", label: `묵시적갱신 (${tacitCount})`, bg: "#FEF2F2", activeBg: "#DC2626", color: "#DC2626", activeColor: "#fff" },
    { id: "1개월", label: `1개월이내 (${within1m})`, bg: "#FFF7ED", activeBg: "#EA580C", color: "#EA580C", activeColor: "#fff" },
    { id: "2개월", label: `2개월이내 (${within2m})`, bg: "#FFFBEB", activeBg: "#F59E0B", color: "#B45309", activeColor: "#fff" },
    { id: "3개월", label: `3개월이내 (${within3m})`, bg: "#DBEAFE", activeBg: "#2563EB", color: "#1D4ED8", activeColor: "#fff" },
  ];

  const getExpiryColor = (daysLeft: number): string => {
    if (daysLeft <= 30) return "#EA580C";
    if (daysLeft <= 60) return "#F59E0B";
    return "#2563EB";
  };

  const getExpiryLabel = (daysLeft: number, tacit?: boolean): string => {
    const prefix = tacit ? "묵시적 " : "";
    if (daysLeft === 0) return `${prefix}오늘 만기`;
    return `${prefix}D-${daysLeft}`;
  };

  // 캘린더 계산
  const calYear = calMonth.getFullYear();
  const calMon = calMonth.getMonth();
  const daysInMonth = new Date(calYear, calMon + 1, 0).getDate();
  const firstDay = new Date(calYear, calMon, 1).getDay();
  const calMonStr = `${calYear}-${String(calMon + 1).padStart(2, "0")}`;
  const todayDate = today.getDate();
  const todayMonStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const isTodayFn = (d: number): boolean => todayMonStr === calMonStr && d === todayDate;

  const calDays = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstDay, daysInMonth]);

  // 만기일(또는 묵시적 갱신일) 날짜별 그룹핑
  const expiryByDay = useMemo(() => {
    const map: Record<number, RenewalTenant[]> = {};
    tenants.forEach(t => {
      if (!t.renewalDate) return;
      const rd = t.renewalDate;
      const rdMonStr = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, "0")}`;
      if (rdMonStr === calMonStr) {
        const day = rd.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(t);
      }
    });
    return map;
  }, [tenants, calMonStr]);

  // 요청사항 날짜별 그룹핑
  const notesByDay = useMemo(() => {
    const map: Record<number, NoteItem[]> = {};
    Object.entries(renewalNotes).forEach(([rk, data]) => {
      if (!data.date) return;
      const [y, m, d] = data.date.split("-");
      if (`${y}-${m}` === calMonStr) {
        const day = parseInt(d);
        if (!map[day]) map[day] = [];
        map[day].push({ ...data, rk });
      }
    });
    return map;
  }, [renewalNotes, calMonStr]);

  // 선택일 데이터
  const selectedDayExpiry = selectedDay ? (expiryByDay[selectedDay] || []) : [];
  const selectedDayNotes = selectedDay ? (notesByDay[selectedDay] || []) : [];

  const prevMonth = () => setCalMonth(new Date(calYear, calMon - 1, 1));
  const nextMonth = () => setCalMonth(new Date(calYear, calMon + 1, 1));

  // 요청사항 입력 폼 열기 (팝업)
  const openNoteForm = (rk: string, building: string, room: string) => {
    const existing = renewalNotes[rk];
    setEditingKey(rk);
    setFormBuilding(building);
    setFormRoom(room);
    setFormNote(existing?.note || "");
    setFormDate(existing?.date || today.toISOString().slice(0, 10));
    setFormTime(existing?.time || "10:00");
  };

  // 요청사항 저장
  const saveNote = () => {
    if (!editingKey || !formNote.trim()) return;
    const [building, room] = editingKey.split("_");
    setRenewalNotes(prev => ({
      ...prev,
      [editingKey]: { note: formNote.trim(), date: formDate, time: formTime, done: prev[editingKey]?.done || false, building, room }
    }));
    setEditingKey(null);
  };

  // 요청사항 삭제
  const deleteNote = (rk: string) => {
    setRenewalNotes(prev => { const next = { ...prev }; delete next[rk]; return next; });
  };

  // 드래그로 날짜 변경
  const handleNoteDrop = (day: number, e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropTargetDay(null);
    try {
      const rk = e.dataTransfer.getData("text/plain");
      if (!rk || !renewalNotes[rk]) return;
      const newDate = `${calYear}-${String(calMon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      setRenewalNotes(prev => ({ ...prev, [rk]: { ...prev[rk], date: newDate } }));
    } catch { /* ignore */ }
  };

  return (
    <div>
      <SectionTitle sub={`일반임대·근생 · 만기 3개월 이내 ${tenants.length}건${tacitCount > 0 ? ` (묵시적갱신 ${tacitCount}건 포함)` : ""}`}>🔄 재계약 관리</SectionTitle>

      {/* 65일 알림 배너 */}
      {alert65Tenants.length > 0 && (
        <Card style={{ padding: "14px 18px", marginBottom: 12, background: "linear-gradient(135deg, #FFF7ED, #FFFBEB)", border: "2px solid #F59E0B" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 22, lineHeight: 1 }}>{"\u26A0\uFE0F"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#B45309", marginBottom: 3 }}>
                65일 전 알림: {alert65Tenants[0].building} {alert65Tenants[0].room}호 {alert65Tenants[0].name}
                {alert65Tenants.length > 1 ? ` 외 ${alert65Tenants.length - 1}건` : ""}
                {" \u2014 "}재계약 협의를 시작하세요
              </div>
              <div style={{ fontSize: 10, color: "#92400E" }}>
                {alert65Tenants.map(t => `${t.building} ${t.room}호(D-${t.daysLeft})`).join(", ")}
              </div>
            </div>
            <div style={{ background: "#F59E0B", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>
              {alert65Tenants.length}건
            </div>
          </div>
        </Card>
      )}

      {/* 캘린더 */}
      <Card style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>‹</button>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23", margin: 0 }}>{calYear}년 {calMon + 1}월</h3>
            <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>›</button>
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 9, color: "#8F95A3" }}>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#EA580C20", border: "1px solid #EA580C", marginRight: 3, verticalAlign: "middle" }} />만기</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#7C3AED20", border: "1px solid #7C3AED", marginRight: 3, verticalAlign: "middle" }} />요청</span>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#8F95A3", padding: "8px 0" }}>{d}</div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(7, 1fr)", gap: 2 }}>
          {calDays.map((day, i) => {
            if (!day) return <div key={i} style={{ minHeight: 120 }} />;
            const dayOfWeek = (firstDay + day - 1) % 7;
            const selected = selectedDay === day;
            const isDrop = dropTargetDay === day;
            const expiryItems = expiryByDay[day] || [];
            const noteItems = notesByDay[day] || [];
            return (
              <div key={i}
                onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDragEnter={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDropTargetDay(day); }}
                onDragLeave={(e: DragEvent<HTMLDivElement>) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTargetDay(null); }}
                onDrop={(e: DragEvent<HTMLDivElement>) => handleNoteDrop(day, e)}
                style={{
                  minHeight: 120, padding: "4px 6px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
                  background: isDrop ? "#F3E8FF" : selected ? "#EFF6FF" : isTodayFn(day) ? "#FFFBEB" : "transparent",
                  border: isDrop ? "2px dashed #7C3AED" : selected ? "2px solid #3B82F6" : isTodayFn(day) ? "1px solid #FDE68A" : "1px solid #F0F2F5",
                }}
                onMouseEnter={(e: MouseEvent<HTMLDivElement>) => !selected && !isDrop && (e.currentTarget.style.background = "#F9FAFB")}
                onMouseLeave={(e: MouseEvent<HTMLDivElement>) => !selected && !isDrop && (e.currentTarget.style.background = isTodayFn(day) ? "#FFFBEB" : "transparent")}>
                <div style={{ fontSize: 12, fontWeight: isTodayFn(day) ? 800 : 600, color: dayOfWeek === 0 ? "#EF4444" : dayOfWeek === 6 ? "#3B82F6" : "#1A1D23", marginBottom: 3 }}>
                  {day}
                  {isTodayFn(day) && <span style={{ fontSize: 8, background: "#F59E0B", color: "#fff", padding: "1px 4px", borderRadius: 3, marginLeft: 3, fontWeight: 700 }}>오늘</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* 만기 건 */}
                  {expiryItems.slice(0, 2).map((t, ti) => (
                    <div key={`e${ti}`} style={{ fontSize: 9.5, fontWeight: 600, padding: "2px 4px", borderRadius: 4, background: getExpiryColor(t.daysLeft) + "18", color: getExpiryColor(t.daysLeft), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      🔄 {t.building} {t.room}
                    </div>
                  ))}
                  {expiryItems.length > 2 && <div style={{ fontSize: 8, color: "#8F95A3", textAlign: "center" }}>+{expiryItems.length - 2} 만기</div>}
                  {/* 요청사항 건 */}
                  {noteItems.slice(0, 2).map((n, ni) => (
                    <div key={`n${ni}`}
                      draggable
                      onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                      onDragStart={(e: DragEvent<HTMLDivElement>) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", n.rk); e.currentTarget.style.opacity = "0.4"; }}
                      onDragEnd={(e: DragEvent<HTMLDivElement>) => { e.currentTarget.style.opacity = "1"; setDropTargetDay(null); }}
                      style={{ fontSize: 9.5, fontWeight: 600, padding: "2px 4px", borderRadius: 4, background: n.done ? "#ECFDF5" : "#F3E8FF", color: n.done ? "#059669" : "#7C3AED", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "grab", textDecoration: n.done ? "line-through" : "none" }}>
                      📋 {n.time} {n.building} {n.room}
                    </div>
                  ))}
                  {noteItems.length > 2 && <div style={{ fontSize: 8, color: "#8F95A3", textAlign: "center" }}>+{noteItems.length - 2} 요청</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 선택 일자 상세 */}
      {selectedDay && (
        <Card style={{ marginBottom: 12, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 12 }}>{calMon + 1}/{selectedDay} 상세</div>
          {selectedDayExpiry.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#EA580C", marginBottom: 6 }}>🔄 만기 도래</div>
              {selectedDayExpiry.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: "#FFF7ED", border: "1px solid #FED7AA", marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{t.building} {t.room}호 <span style={{ color: "#5F6577" }}>{t.name}</span></div>
                    <div style={{ fontSize: 9, color: "#8F95A3", marginTop: 2 }}>{t.phone} · 보증금 {fmt(t.deposit)} · 월세 {fmt(t.rent)}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: getExpiryColor(t.daysLeft) }}>{getExpiryLabel(t.daysLeft)}</div>
                </div>
              ))}
            </div>
          )}
          {selectedDayNotes.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", marginBottom: 6 }}>📋 건물주 요청</div>
              {selectedDayNotes.map((n, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: n.done ? "#ECFDF5" : "#F5F3FF", border: `1px solid ${n.done ? "#A7F3D0" : "#DDD6FE"}`, marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, textDecoration: n.done ? "line-through" : "none" }}>{n.building} {n.room}호 · {n.time}</div>
                    <div style={{ fontSize: 10, color: "#5F6577", marginTop: 2, textDecoration: n.done ? "line-through" : "none" }}>{n.note}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <input type="checkbox" checked={n.done} onChange={(e) => { e.stopPropagation(); setRenewalNotes(prev => ({ ...prev, [n.rk]: { ...prev[n.rk], done: e.target.checked } })); }}
                      style={{ cursor: "pointer", width: 14, height: 14, accentColor: "#059669" }} />
                    <button onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); deleteNote(n.rk); }}
                      style={{ width: 20, height: 20, borderRadius: 4, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 10, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedDayExpiry.length === 0 && selectedDayNotes.length === 0 && (
            <div style={{ padding: "16px 0", textAlign: "center", color: "#B0B5C1", fontSize: 13 }}>해당일 일정이 없습니다</div>
          )}
        </Card>
      )}

      <div style={{ marginBottom: 8 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="건물명 · 호실 · 이름 검색..."
          style={{ width: isMobile ? "100%" : 260, padding: "7px 12px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, outline: "none", fontFamily: "inherit", background: "#F9FAFB" }} />
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setRangeFilter(f.id)}
            style={{ padding: "5px 10px", borderRadius: 6, fontSize: f.emphasized ? 11 : 10, fontWeight: f.emphasized ? 800 : 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              background: rangeFilter === f.id ? f.activeBg : f.bg,
              color: rangeFilter === f.id ? f.activeColor : f.color,
              border: `1.5px solid ${rangeFilter === f.id ? f.activeBg : f.emphasized ? f.color : "#E0E3E9"}`,
              boxShadow: f.emphasized && rangeFilter !== f.id ? "0 0 0 1px " + f.color + "40" : "none" }}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 48, color: "#8F95A3" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>해당 조건의 임차인이 없습니다</div>
        </Card>
      ) : (
        <Card style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E8ECF0" }}>
                {["유형", "건물명", "호실", "입주자", "연락처", "입주일", "만기일", "건물주 요청사항", "완료"].map((h, i) => (
                  <th key={i} style={{ padding: (i >= 4 && i <= 6) ? "8px 1px" : "8px 2px", textAlign: i === 8 ? "center" : "left", fontSize: 10, fontWeight: 700, color: "#8F95A3", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const rk = `${t.building}_${t.room}`;
                const data = renewalNotes[rk] || {} as Partial<RenewalNote>;
                const hasNote = !!(data as RenewalNote).note;
                const isFormOpen = editingKey === rk;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #F0F2F5" }}
                    onMouseEnter={(e: MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.background = "#F9FAFB"; }}
                    onMouseLeave={(e: MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "8px 2px" }}><RoomTypeBadge building={t.building} room={t.room} /></td>
                    <td style={{ padding: "8px 2px", fontWeight: 700, fontSize: 11 }}>{t.building}</td>
                    <td style={{ padding: "8px 2px", fontSize: 11 }}>{t.room}</td>
                    <td style={{ padding: "8px 2px", fontWeight: 700, fontSize: 11, maxWidth: 50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.name}>{t.name.length > 5 ? t.name.slice(0, 5) + "…" : t.name}</td>
                    <td style={{ padding: "8px 1px", fontSize: 10, color: "#5F6577" }}>{t.phone}</td>
                    <td style={{ padding: "8px 1px", fontSize: 10 }}>{t.moveIn ? t.moveIn.slice(2) : "-"}</td>
                    <td style={{ padding: "8px 1px", fontSize: 10, color: getExpiryColor(t.daysLeft), fontWeight: 700 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                        <span>{t.renewalDate ? `${t.renewalDate.getFullYear()}-${String(t.renewalDate.getMonth()+1).padStart(2,"0")}-${String(t.renewalDate.getDate()).padStart(2,"0")}`.slice(2) : "-"}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: getExpiryColor(t.daysLeft) }}>{getExpiryLabel(t.daysLeft, t.tacit)}</span>
                        {t.tacit && (
                          <span style={{ display: "inline-block", padding: "1px 5px", borderRadius: 4, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 9, fontWeight: 800, whiteSpace: "nowrap" }}>묵시적</span>
                        )}
                        {t.daysLeft >= 60 && t.daysLeft <= 70 && (
                          <span style={{ display: "inline-block", padding: "1px 5px", borderRadius: 4, background: "#FEF3C7", border: "1px solid #F59E0B", color: "#B45309", fontSize: 9, fontWeight: 800, whiteSpace: "nowrap" }}>{"\uD83D\uDD14"} 65일 알림</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "4px 2px", minWidth: 160 }} onClick={(e: MouseEvent<HTMLTableDataCellElement>) => e.stopPropagation()}>
                      {hasNote ? (
                        <div onClick={() => openNoteForm(rk, t.building, t.room)}
                          style={{ padding: "4px 6px", fontSize: 10, cursor: "pointer", borderRadius: 4, textDecoration: (data as RenewalNote).done ? "line-through" : "none", color: (data as RenewalNote).done ? "#059669" : "#1A1D23" }}>
                          <span style={{ color: "#7C3AED", fontWeight: 700, marginRight: 4 }}>{(data as RenewalNote).date?.slice(5)} {(data as RenewalNote).time}</span>
                          {(data as RenewalNote).note}
                        </div>
                      ) : (
                        <div onClick={() => openNoteForm(rk, t.building, t.room)}
                          style={{ padding: "4px 6px", fontSize: 10, color: "#B0B5C1", cursor: "pointer" }}>
                          클릭하여 입력...
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "4px 2px", textAlign: "center" }} onClick={(e: MouseEvent<HTMLTableDataCellElement>) => e.stopPropagation()}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        {hasNote && (
                          <input type="checkbox" checked={(data as RenewalNote).done || false}
                            onChange={e => setRenewalNotes(prev => ({ ...prev, [rk]: { ...prev[rk], done: e.target.checked } }))}
                            style={{ cursor: "pointer", width: 14, height: 14, accentColor: "#059669" }} />
                        )}
                        <button onClick={() => { if (confirm(`${t.building} ${t.room}호 재계약 완료 처리하시겠습니까?\n목록에서 제외됩니다.`)) { setRenewedRooms(prev => ({ ...prev, [rk]: { date: today.toISOString().slice(0, 10) } })); deleteNote(rk); } }}
                          style={{ padding: "2px 5px", borderRadius: 3, border: "1px solid #A7F3D0", background: "#ECFDF5", color: "#059669", fontSize: 8, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>재계약</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      {/* 요청사항 입력 팝업 */}
      {editingKey && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setEditingKey(null)}>
          <div onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23", marginBottom: 4 }}>📋 건물주 요청사항</div>
            <div style={{ fontSize: 12, color: "#8F95A3", marginBottom: 16 }}>{formBuilding} {formRoom}호</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>요청 내용</div>
              <input autoFocus value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="건물주 요청사항 입력..."
                style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1.5px solid #DDD6FE", borderRadius: 8, outline: "none", fontFamily: "inherit", background: "#F5F3FF", boxSizing: "border-box" }}
                onKeyDown={e => { if (e.key === "Enter" && formNote.trim()) saveNote(); }} />
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>날짜</div>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: "1.5px solid #DDD6FE", borderRadius: 8, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div style={{ width: 110 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>시간</div>
                <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: "1.5px solid #DDD6FE", borderRadius: 8, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveNote}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#7C3AED", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
              <button onClick={() => setEditingKey(null)}
                style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
              {renewalNotes[editingKey]?.note && (
                <button onClick={() => { deleteNote(editingKey); setEditingKey(null); }}
                  style={{ padding: "10px 16px", borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>삭제</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
