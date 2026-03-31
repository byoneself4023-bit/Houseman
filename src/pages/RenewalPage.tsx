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
          <div className="flex items-center gap-2.5">
            <div className="text-[22px] leading-none">{"\u26A0\uFE0F"}</div>
            <div className="flex-1">
              <div className="text-[13px] font-extrabold text-amber-800 mb-[3px]">
                65일 전 알림: {alert65Tenants[0].building} {alert65Tenants[0].room}호 {alert65Tenants[0].name}
                {alert65Tenants.length > 1 ? ` 외 ${alert65Tenants.length - 1}건` : ""}
                {" \u2014 "}재계약 협의를 시작하세요
              </div>
              <div className="text-[10px] text-amber-900">
                {alert65Tenants.map(t => `${t.building} ${t.room}호(D-${t.daysLeft})`).join(", ")}
              </div>
            </div>
            <div className="bg-amber-500 text-white px-2.5 py-1 rounded-md text-[11px] font-extrabold whitespace-nowrap">
              {alert65Tenants.length}건
            </div>
          </div>
        </Card>
      )}

      {/* 캘린더 */}
      <Card className="!p-4 !mb-3">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-9 h-9 rounded-lg border border-hm-input-border bg-white cursor-pointer text-base flex items-center justify-center font-[inherit] hover:bg-gray-50 transition-colors">‹</button>
            <h3 className="text-lg font-extrabold text-hm-text m-0">{calYear}년 {calMon + 1}월</h3>
            <button onClick={nextMonth} className="w-9 h-9 rounded-lg border border-hm-input-border bg-white cursor-pointer text-base flex items-center justify-center font-[inherit] hover:bg-gray-50 transition-colors">›</button>
          </div>
          <div className="flex gap-2 text-[9px] text-hm-text-muted">
            <span><span className="inline-block w-2 h-2 rounded-sm bg-[#EA580C20] border border-hm-warning mr-[3px] align-middle" />만기</span>
            <span><span className="inline-block w-2 h-2 rounded-sm bg-[#7C3AED20] border border-purple-600 mr-[3px] align-middle" />요청</span>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className={`grid ${isMobile ? "grid-cols-4" : "grid-cols-7"} gap-0.5 mb-1`}>
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div key={i} className={`text-center text-[11.5px] font-bold py-2 ${i === 0 ? "text-red-500" : i === 6 ? "text-hm-blue" : "text-hm-text-muted"}`}>{d}</div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className={`grid ${isMobile ? "grid-cols-4" : "grid-cols-7"} gap-0.5`}>
          {calDays.map((day, i) => {
            if (!day) return <div key={i} className="min-h-[120px]" />;
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
                className={`min-h-[120px] px-1.5 py-1 rounded-lg cursor-pointer transition-all
                  ${isDrop ? "bg-purple-50 border-2 border-dashed border-purple-600" :
                    selected ? "bg-hm-blue-bg border-2 border-hm-blue" :
                    isTodayFn(day) ? "bg-amber-50 border border-amber-200" :
                    "border border-[#F0F2F5] hover:bg-hm-bg-hover"}`}>
                <div className={`text-xs mb-[3px] ${isTodayFn(day) ? "font-extrabold" : "font-semibold"} ${dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-hm-blue" : "text-hm-text"}`}>
                  {day}
                  {isTodayFn(day) && <span className="text-[8px] bg-amber-500 text-white px-1 py-px rounded-[3px] ml-[3px] font-bold">오늘</span>}
                </div>
                <div className="flex flex-col gap-0.5">
                  {/* 만기 건 */}
                  {expiryItems.slice(0, 2).map((t, ti) => (
                    <div key={`e${ti}`} className="text-[9.5px] font-semibold px-1 py-0.5 rounded whitespace-nowrap overflow-hidden text-ellipsis" style={{ background: getExpiryColor(t.daysLeft) + "18", color: getExpiryColor(t.daysLeft) }}>
                      🔄 {t.building} {t.room}
                    </div>
                  ))}
                  {expiryItems.length > 2 && <div className="text-[8px] text-hm-text-muted text-center">+{expiryItems.length - 2} 만기</div>}
                  {/* 요청사항 건 */}
                  {noteItems.slice(0, 2).map((n, ni) => (
                    <div key={`n${ni}`}
                      draggable
                      onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                      onDragStart={(e: DragEvent<HTMLDivElement>) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", n.rk); e.currentTarget.style.opacity = "0.4"; }}
                      onDragEnd={(e: DragEvent<HTMLDivElement>) => { e.currentTarget.style.opacity = "1"; setDropTargetDay(null); }}
                      className={`text-[9.5px] font-semibold px-1 py-0.5 rounded whitespace-nowrap overflow-hidden text-ellipsis cursor-grab ${n.done ? "bg-hm-success-bg text-hm-success line-through" : "bg-purple-50 text-purple-600"}`}>
                      📋 {n.time} {n.building} {n.room}
                    </div>
                  ))}
                  {noteItems.length > 2 && <div className="text-[8px] text-hm-text-muted text-center">+{noteItems.length - 2} 요청</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 선택 일자 상세 */}
      {selectedDay && (
        <Card className="!mb-3 !p-4">
          <div className="text-sm font-extrabold text-hm-text mb-3">{calMon + 1}/{selectedDay} 상세</div>
          {selectedDayExpiry.length > 0 && (
            <div className="mb-2.5">
              <div className="text-[11px] font-bold text-hm-warning mb-1.5">🔄 만기 도래</div>
              {selectedDayExpiry.map((t, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-hm-warning-bg border border-hm-warning-border mb-1">
                  <div>
                    <div className="text-xs font-bold">{t.building} {t.room}호 <span className="text-hm-text-sub">{t.name}</span></div>
                    <div className="text-[9px] text-hm-text-muted mt-0.5">{t.phone} · 보증금 {fmt(t.deposit)} · 월세 {fmt(t.rent)}</div>
                  </div>
                  <div className="text-[13px] font-extrabold" style={{ color: getExpiryColor(t.daysLeft) }}>{getExpiryLabel(t.daysLeft)}</div>
                </div>
              ))}
            </div>
          )}
          {selectedDayNotes.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-purple-600 mb-1.5">📋 건물주 요청</div>
              {selectedDayNotes.map((n, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg mb-1 ${n.done ? "bg-hm-success-bg border border-hm-success-border" : "bg-purple-50 border border-purple-200"}`}>
                  <div>
                    <div className={`text-xs font-bold ${n.done ? "line-through" : ""}`}>{n.building} {n.room}호 · {n.time}</div>
                    <div className={`text-[10px] text-hm-text-sub mt-0.5 ${n.done ? "line-through" : ""}`}>{n.note}</div>
                  </div>
                  <div className="flex gap-1 items-center">
                    <input type="checkbox" checked={n.done} onChange={(e) => { e.stopPropagation(); setRenewalNotes(prev => ({ ...prev, [n.rk]: { ...prev[n.rk], done: e.target.checked } })); }}
                      className="cursor-pointer w-3.5 h-3.5 accent-hm-success" />
                    <button onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); deleteNote(n.rk); }}
                      className="w-5 h-5 rounded border border-hm-danger-border bg-hm-danger-bg text-hm-danger text-[10px] cursor-pointer font-[inherit] flex items-center justify-center hover:bg-red-100 transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedDayExpiry.length === 0 && selectedDayNotes.length === 0 && (
            <div className="py-4 text-center text-[#B0B5C1] text-[13px]">해당일 일정이 없습니다</div>
          )}
        </Card>
      )}

      <div className="mb-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="건물명 · 호실 · 이름 검색..."
          className="px-3 py-[7px] rounded-lg border border-hm-input-border text-xs outline-none font-[inherit] bg-hm-bg-hover focus:ring-1 focus:ring-hm-blue transition-colors"
          style={{ width: isMobile ? "100%" : 260 }} />
      </div>

      <div className="flex gap-1 mb-2.5 flex-wrap">
        {filters.map(f => (
          <button key={f.id} onClick={() => setRangeFilter(f.id)}
            className="px-2.5 py-[5px] rounded-md cursor-pointer font-[inherit] transition-all"
            style={{
              fontSize: f.emphasized ? 11 : 10, fontWeight: f.emphasized ? 800 : 700,
              background: rangeFilter === f.id ? f.activeBg : f.bg,
              color: rangeFilter === f.id ? f.activeColor : f.color,
              border: `1.5px solid ${rangeFilter === f.id ? f.activeBg : f.emphasized ? f.color : "#E0E3E9"}`,
              boxShadow: f.emphasized && rangeFilter !== f.id ? "0 0 0 1px " + f.color + "40" : "none" }}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="!text-center !p-12 text-hm-text-muted">
          <div className="text-sm font-semibold">해당 조건의 임차인이 없습니다</div>
        </Card>
      ) : (
        <Card style={{ overflow: "auto" }}>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b-2 border-hm-border">
                {["유형", "건물명", "호실", "입주자", "연락처", "입주일", "만기일", "건물주 요청사항", "완료"].map((h, i) => (
                  <th key={i} className={`${(i >= 4 && i <= 6) ? "px-[1px]" : "px-0.5"} py-2 text-[10px] font-bold text-hm-text-muted whitespace-nowrap ${i === 8 ? "text-center" : "text-left"}`}>{h}</th>
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
                  <tr key={i} className="border-b border-[#F0F2F5] hover:bg-hm-bg-hover transition-colors">
                    <td className="py-2 px-0.5"><RoomTypeBadge building={t.building} room={t.room} /></td>
                    <td className="py-2 px-0.5 font-bold text-[11px]">{t.building}</td>
                    <td className="py-2 px-0.5 text-[11px]">{t.room}</td>
                    <td className="py-2 px-0.5 font-bold text-[11px] max-w-[50px] overflow-hidden text-ellipsis whitespace-nowrap" title={t.name}>{t.name.length > 5 ? t.name.slice(0, 5) + "…" : t.name}</td>
                    <td className="py-2 px-[1px] text-[10px] text-hm-text-sub">{t.phone}</td>
                    <td className="py-2 px-[1px] text-[10px]">{t.moveIn ? t.moveIn.slice(2) : "-"}</td>
                    <td className="py-2 px-[1px] text-[10px] font-bold" style={{ color: getExpiryColor(t.daysLeft) }}>
                      <div className="flex items-center gap-[3px] flex-wrap">
                        <span>{t.renewalDate ? `${t.renewalDate.getFullYear()}-${String(t.renewalDate.getMonth()+1).padStart(2,"0")}-${String(t.renewalDate.getDate()).padStart(2,"0")}`.slice(2) : "-"}</span>
                        <span className="text-[10px] font-extrabold" style={{ color: getExpiryColor(t.daysLeft) }}>{getExpiryLabel(t.daysLeft, t.tacit)}</span>
                        {t.tacit && (
                          <span className="inline-block px-[5px] py-px rounded bg-hm-danger-bg border border-hm-danger-border text-hm-danger text-[9px] font-extrabold whitespace-nowrap">묵시적</span>
                        )}
                        {t.daysLeft >= 60 && t.daysLeft <= 70 && (
                          <span className="inline-block px-[5px] py-px rounded bg-amber-100 border border-amber-500 text-amber-800 text-[9px] font-extrabold whitespace-nowrap">{"\uD83D\uDD14"} 65일 알림</span>
                        )}
                      </div>
                    </td>
                    <td className="py-1 px-0.5 min-w-[160px]" onClick={(e: MouseEvent<HTMLTableDataCellElement>) => e.stopPropagation()}>
                      {hasNote ? (
                        <div onClick={() => openNoteForm(rk, t.building, t.room)}
                          className={`px-1.5 py-1 text-[10px] cursor-pointer rounded hover:bg-gray-50 transition-colors ${(data as RenewalNote).done ? "line-through text-hm-success" : "text-hm-text"}`}>
                          <span className="text-purple-600 font-bold mr-1">{(data as RenewalNote).date?.slice(5)} {(data as RenewalNote).time}</span>
                          {(data as RenewalNote).note}
                        </div>
                      ) : (
                        <div onClick={() => openNoteForm(rk, t.building, t.room)}
                          className="px-1.5 py-1 text-[10px] text-[#B0B5C1] cursor-pointer hover:text-hm-text-muted transition-colors">
                          클릭하여 입력...
                        </div>
                      )}
                    </td>
                    <td className="py-1 px-0.5 text-center" onClick={(e: MouseEvent<HTMLTableDataCellElement>) => e.stopPropagation()}>
                      <div className="flex flex-col items-center gap-0.5">
                        {hasNote && (
                          <input type="checkbox" checked={(data as RenewalNote).done || false}
                            onChange={e => setRenewalNotes(prev => ({ ...prev, [rk]: { ...prev[rk], done: e.target.checked } }))}
                            className="cursor-pointer w-3.5 h-3.5 accent-hm-success" />
                        )}
                        <button onClick={() => { if (confirm(`${t.building} ${t.room}호 재계약 완료 처리하시겠습니까?\n목록에서 제외됩니다.`)) { setRenewedRooms(prev => ({ ...prev, [rk]: { date: today.toISOString().slice(0, 10) } })); deleteNote(rk); } }}
                          className="px-[5px] py-0.5 rounded-[3px] border border-hm-success-border bg-hm-success-bg text-hm-success text-[8px] font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-emerald-100 transition-colors">재계약</button>
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
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-5"
          onClick={() => setEditingKey(null)}>
          <div onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            className="bg-white rounded-2xl px-7 py-6 max-w-[400px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <div className="text-base font-extrabold text-hm-text mb-1">📋 건물주 요청사항</div>
            <div className="text-xs text-hm-text-muted mb-4">{formBuilding} {formRoom}호</div>

            <div className="mb-3">
              <div className="text-[11px] font-bold text-hm-text-sub mb-1">요청 내용</div>
              <input autoFocus value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="건물주 요청사항 입력..."
                className="w-full px-3 py-2.5 text-[13px] border-[1.5px] border-purple-200 rounded-lg outline-none font-[inherit] bg-purple-50 box-border focus:ring-1 focus:ring-purple-400 transition-colors"
                onKeyDown={e => { if (e.key === "Enter" && formNote.trim()) saveNote(); }} />
            </div>

            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <div className="text-[11px] font-bold text-hm-text-sub mb-1">날짜</div>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border-[1.5px] border-purple-200 rounded-lg outline-none font-[inherit] box-border focus:ring-1 focus:ring-purple-400 transition-colors" />
              </div>
              <div className="w-[110px]">
                <div className="text-[11px] font-bold text-hm-text-sub mb-1">시간</div>
                <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border-[1.5px] border-purple-200 rounded-lg outline-none font-[inherit] box-border focus:ring-1 focus:ring-purple-400 transition-colors" />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={saveNote}
                className="flex-1 py-2.5 rounded-lg border-none bg-purple-600 text-white text-[13px] font-extrabold cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">저장</button>
              <button onClick={() => setEditingKey(null)}
                className="px-5 py-2.5 rounded-lg border-[1.5px] border-hm-input-border bg-white text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-gray-50 transition-colors">취소</button>
              {renewalNotes[editingKey]?.note && (
                <button onClick={() => { deleteNote(editingKey); setEditingKey(null); }}
                  className="px-4 py-2.5 rounded-lg border-[1.5px] border-hm-danger-border bg-hm-danger-bg text-hm-danger text-[13px] font-semibold cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">삭제</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
