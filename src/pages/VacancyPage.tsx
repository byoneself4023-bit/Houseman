import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { buildingFloors } from '@/data';
import { useIsMobile, fmt } from '@/utils';
import { matchKorean } from '@/utils/koreanSearch';
import { Card, SectionTitle, Table, StatusBadge } from '@/components';
import { useLocalStorage } from '@/utils/useLocalStorage';
import type { Vacancy, Tenant, CalendarEvent, Building } from '@/types';

interface VacancyPageProps {
  isLoading?: boolean;
  myBuildings?: string[];
  calendarEvts?: CalendarEvent[];
  setCalendarEvts: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  activeVacancies?: Vacancy[];
  setActiveVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
  buildingData?: Record<string, any>;
  activeTenants?: Tenant[];
  setActiveTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  pastTenantsData?: Record<string, any>;
  setPendingContract: (contract: any) => void;
  setPage: (page: string) => void;
}

export const VacancyPage = ({ myBuildings = [], calendarEvts = [], setCalendarEvts, setPage, setPendingContract, activeVacancies = [], setActiveVacancies, buildingData = {}, activeTenants = [], setActiveTenants, pastTenantsData = {}, isLoading }: VacancyPageProps) => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("전체");
  const [showPrint, setShowPrint] = useState(false);
  const [reportModal, setReportModal] = useState<any>(null);
  const [editRow, setEditRow] = useState<string | null>(null);
  const [linkModal, setLinkModal] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [confirmPromo, setConfirmPromo] = useState<any>(null);
  const [linkedRooms, setLinkedRooms] = useLocalStorage<Record<string, boolean>>("hm_linkedRooms", {}); // { "건물_호실": true }
  const types = ["전체", "점검/청소중", "홍보중", "임차인연결", "계약서입력"];

  const updateVacancy = (v: Vacancy, patch: Partial<Vacancy>) => {
    setActiveVacancies((prev: Vacancy[]) => prev.map((x: Vacancy) =>
      x.building === v.building && x.room === v.room ? { ...x, ...patch } : x
    ));
  };

  const rowKey = (r: Vacancy) => `${r.building}_${r.room}`;

  const handleEditSave = (r: Vacancy) => {
    const g = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value;
    const rk = rowKey(r);
    const patch: Record<string, any> = {};
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
    updateVacancy(r, patch as Partial<Vacancy>);
    setEditRow(null);
  };

  const renderVal = (value: any, isNum: boolean) => {
    if (isNum) return value > 0 ? fmt(value) : "—";
    if (value === "포함") return <span className="text-hm-success font-semibold">포함</span>;
    if (value === "별도") return <span className="text-hm-danger font-semibold">별도</span>;
    return value || "—";
  };
  const myVacancies = myBuildings.length > 0 ? activeVacancies.filter((v: Vacancy) => myBuildings.includes(v.building)) : activeVacancies;
  const getStatus = (v: Vacancy) => {
    // 임차인연결
    if (linkedRooms[`${v.building}_${v.room}`]) return "임차인연결";
    // 캘린더에 계약 이벤트가 있을 때만 계약서입력 (단일 소스)
    const hasContract = calendarEvts.some((ev: CalendarEvent) => ev.type === "계약" && ev.building === v.building && String(ev.room) === String(v.room));
    if (hasContract) return "계약서입력";
    if (v.status === "홍보중") return "홍보중";
    return "점검/청소중";
  };
  const filtered = useMemo(() => tab === "전체" ? myVacancies : myVacancies.filter((v: Vacancy) => getStatus(v) === tab), [tab, myVacancies, calendarEvts]);

  const handleStatusChange = (v: Vacancy, newStatus: string) => {
    setActiveVacancies((prev: Vacancy[]) => prev.map((x: Vacancy) =>
      x.building === v.building && x.room === v.room ? { ...x, status: newStatus } : x
    ));
  };

  const todayStr = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => { window.print(); setTimeout(() => setShowPrint(false), 500); }, 200);
  };

  if (showPrint) {
    const grouped: Record<string, Vacancy[]> = {};
    activeVacancies.filter((v: Vacancy) => getStatus(v) !== "점검/청소중").forEach((v: Vacancy) => {
      if (!grouped[v.building]) grouped[v.building] = [];
      grouped[v.building].push(v);
    });
    return (
      <div id="print-area" className="px-2.5 py-5 font-[Pretendard,sans-serif] bg-white text-black min-h-screen">
        <style>{`@media print { body * { visibility: hidden !important; } #print-area, #print-area * { visibility: visible !important; } #print-area { position: fixed; left: 0; top: 0; width: 100%; padding: 24px !important; font-size: 10px !important; } @page { margin: 10mm; size: A4 landscape; } }`}</style>
        <div className="text-center border-b-[3px] border-black pb-3 mb-4">
          <div className="text-xs text-gray-500 tracking-widest mb-1">하우스맨 HOUSEMAN</div>
          <div className="text-2xl font-bold">공실 현황표</div>
          <div className="text-xs text-gray-600 mt-1.5">{todayStr} 기준</div>
          <div className="flex justify-center gap-4 mt-2">
            {["점검/청소중","홍보중","계약서입력"].map(t => (
              <span key={t} className="text-xs font-bold">{t} <span className="text-base font-bold">{activeVacancies.filter((v: Vacancy) => getStatus(v) === t).length}</span></span>
            ))}
            <span className="text-xs font-bold">전체 <span className="text-base font-bold text-hm-danger">{activeVacancies.length}</span></span>
          </div>
        </div>
        <table className="w-full border-collapse text-[10.5px]">
          <thead>
            <tr className="bg-gray-100">
              {["수수료(이벤트/중개)","건물명","호수","현관비번","예치금","월세","NEGO","관리비","수도","케이블","퇴실비","공실기간"].map(h => (
                <th key={h} className="px-1.5 py-[5px] text-center font-bold border-b-2 border-gray-400 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeVacancies.filter((v: Vacancy) => getStatus(v) !== "점검/청소중").map((r: Vacancy, i: number) => (
              <tr key={i} className="border-b border-gray-300">
                <td className="px-1.5 py-1 text-center text-xs">{r.commEvent || "—"} / {r.commBroker > 0 ? (r.commBroker < 1 ? r.commBroker + "%" : r.commBroker + "만") : "—"}</td>
                <td className="px-1.5 py-1 font-bold">{r.building}</td>
                <td className="px-1.5 py-1 text-center">{r.room}</td>
                <td className="px-1.5 py-1 text-center font-mono">{(r as any).commFee || "—"}</td>
                <td className="px-1.5 py-1 text-right">{fmt(r.deposit)}</td>
                <td className="px-1.5 py-1 text-right">{fmt(r.rent)}</td>
                <td className="px-1.5 py-1 text-right font-bold" style={{ color: r.nego < r.rent ? "var(--color-hm-danger)" : "#000" }}>{fmt(r.nego)}</td>
                <td className="px-1.5 py-1 text-right">{r.mgmt > 0 ? fmt(r.mgmt) : "—"}</td>
                <td className="px-1.5 py-1 text-center text-xs">{r.water || "—"}</td>
                <td className="px-1.5 py-1 text-center text-xs">{r.cable || "—"}</td>
                <td className="px-1.5 py-1 text-right">{r.exitFee > 0 ? r.exitFee : "—"}</td>
                <td className="px-1.5 py-1 text-right" style={{ fontWeight: r.days > 30 ? 800 : 400, color: r.days > 30 ? "var(--color-hm-danger)" : "#000" }}>{r.days > 0 ? r.days : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-5 pt-3 border-t-2 border-black flex justify-between text-xs text-gray-400">
          <span>하우스맨 건물관리 시스템</span>
          <span>총 {activeVacancies.length}실 관리</span>
          <span>인쇄일: {todayStr}</span>
        </div>
        <div className="mt-6 text-center">
          <button onClick={() => setShowPrint(false)} className="px-8 py-2.5 rounded-lg border border-gray-300 bg-white cursor-pointer text-sm font-semibold font-[inherit] hover:bg-gray-50 transition-colors">← 돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes sparkle {
          0%, 100% { background-color: #F3F4F6; }
          50% { background-color: #FEE2E2; border-color: #EF4444; color: var(--color-hm-danger); }
        }
        .sparkle-btn { animation: sparkle 1.5s ease-in-out infinite; }
      `}</style>
      <div className="flex justify-between items-start mb-4">
        <SectionTitle sub="">📭 공실 관리</SectionTitle>
        <div className="flex gap-2">
          <button onClick={handlePrint}
            className="px-5 py-2 rounded-lg border border-hm-input-border bg-white cursor-pointer text-[12.5px] font-bold font-[inherit] flex items-center gap-1.5 text-hm-text hover:bg-[#1B1F2E] hover:text-white transition-colors">
            🖨️ 인쇄
          </button>
          <button onClick={() => { setLinkModal(true); setLinkSearch(""); }}
            className="px-5 py-2 rounded-lg border border-hm-danger-border bg-hm-danger-bg cursor-pointer text-[12.5px] font-bold font-[inherit] flex items-center gap-1.5 text-hm-danger hover:brightness-95 transition-colors">
            🔗 임차인 연결
          </button>
        </div>
      </div>

      {/* 임차인 연결 팝업 — 현재 입주 중인 임차인에서 선택 */}
      {linkModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-5"
          onClick={() => setLinkModal(false)}>
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-[520px] w-full max-h-[80vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="text-base font-bold mb-1">🔗 임차인 연결</div>
            <div className="text-xs text-hm-text-muted mb-4">현재 입주 중인 호실을 선택하면 공실에 "임차인연결"로 등록됩니다</div>
            <input autoFocus value={linkSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkSearch(e.target.value)}
              placeholder="건물명 검색 (초성 가능)..."
              className="w-full px-4 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit] outline-none mb-3 box-border focus:border-hm-danger transition-colors" />
            {/* 이미 연결된 호실 */}
            {Object.keys(linkedRooms).length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-bold text-hm-danger mb-1.5">연결 중 ({Object.keys(linkedRooms).length}건)</div>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.keys(linkedRooms).map(key => {
                    const [b, r] = key.split("_");
                    const tenant = activeTenants.find((t: Tenant) => t.building === b && String(t.room) === String(r));
                    return (
                      <div key={key} className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg bg-hm-danger-bg border border-hm-danger-border text-xs">
                        <span className="font-bold">{b} {r}호</span>
                        {tenant && <span className="text-hm-text-muted">{tenant.name}</span>}
                        <span onClick={() => {
                          setLinkedRooms((prev: Record<string, boolean>) => { const next = { ...prev }; delete next[key]; return next; });
                          // 공실에서도 제거
                          setActiveVacancies((prev: Vacancy[]) => prev.filter((v: Vacancy) => !(v.building === b && String(v.room) === String(r) && (v as any).linkedTenant)));
                        }} className="cursor-pointer text-hm-danger font-bold ml-1 hover:opacity-70 transition-opacity">✕</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {activeTenants
                .filter((t: Tenant) => t.name && t.name !== "퇴실" && (t.status as string) !== "퇴실")
                .filter((t: Tenant) => !linkSearch || matchKorean(t.building, linkSearch) || t.building.includes(linkSearch) || matchKorean(t.name, linkSearch))
                .filter((t: Tenant) => !linkedRooms[`${t.building}_${t.room}`]) // 이미 연결된 건 제외
                .map((t: Tenant, i: number) => (
                  <div key={i} onClick={() => {
                    const key = `${t.building}_${t.room}`;
                    // linkedRooms에 추가
                    setLinkedRooms((prev: Record<string, boolean>) => ({ ...prev, [key]: true }));
                    // 공실 목록에 없으면 추가
                    const exists = activeVacancies.some((v: Vacancy) => v.building === t.building && String(v.room) === String(t.room));
                    if (!exists) {
                      setActiveVacancies((prev: Vacancy[]) => [...prev, {
                        building: t.building, room: t.room, type: t.type || "단기",
                        deposit: t.deposit || 0, rent: t.rent || 0, mgmt: t.mgmt || 0,
                        nego: t.rent || 0, water: "", cable: "", exitFee: 0, days: 0,
                        commBroker: 0, commEvent: "", pw: "", status: "홍보중",
                        linkedTenant: t.name,
                      } as any]);
                    }
                  }}
                    className="flex items-center justify-between px-4 py-3 rounded-lg mb-1 cursor-pointer bg-hm-bg-hover hover:bg-hm-danger-bg transition-all">
                    <div>
                      <div className="text-sm font-bold">{t.building} {t.room}호 <span className="font-medium text-hm-text-sub">{t.name}</span></div>
                      <div className="text-xs text-hm-text-muted mt-0.5">만기: {t.expiry || "-"} · 월세: {fmt(t.rent)} · {t.type || "단기"}</div>
                    </div>
                    <div className="px-3 py-1 rounded-md text-xs font-bold bg-hm-danger-bg text-hm-danger border border-hm-danger-border whitespace-nowrap hover:brightness-95 transition-colors">
                      + 연결
                    </div>
                  </div>
                ))}
            </div>
            <button onClick={() => setLinkModal(false)} className="mt-4 p-3 rounded-lg border-none bg-hm-text text-white font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">닫기</button>
          </div>
        </div>
      )}

      {/* Summary badges */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {types.map(t => {
          const count = t === "전체" ? myVacancies.length : myVacancies.filter((v: Vacancy) => getStatus(v) === t).length;
          const colors: Record<string, string> = { "전체": "var(--color-hm-text)", "점검/청소중": "#6B7280", "홍보중": "var(--color-hm-blue)", "임차인연결": "var(--color-hm-danger)", "계약서입력": "#F59E0B" };
          return (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-[7px] rounded-lg font-semibold text-[12.5px] cursor-pointer font-[inherit] transition-colors"
              style={{ border: tab === t ? `2px solid ${colors[t]}` : "1px solid var(--color-hm-input-border)", background: tab === t ? `${colors[t]}10` : "#fff", color: tab === t ? colors[t] : "var(--color-hm-text-sub)" }}>
              {t} <span className="font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Main Table */}
      <Card style={{ overflow: "auto" }}>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-hm-border">
              {["","연결","수수료(이벤트/중개)","건물명","호수","현관비번","예치금","월세","NEGO","관리비","수도","케이블","퇴실비","공실기간",""].map((h, i) => (
                <th key={i} className={`px-2 py-2.5 text-xs font-bold text-hm-text-muted whitespace-nowrap ${(i >= 5 && i <= 12) ? "text-right" : i === 1 ? "text-center" : "text-left"} ${h === "NEGO" ? "bg-hm-danger-bg" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r: Vacancy, i: number) => {
              const negoDiscount = r.nego < r.rent;
              const st = getStatus(r);
              const contracted = st === "계약서입력";
              const cellDeco = contracted ? "line-through" : "none";
              const cellOpacity = contracted ? 0.5 : 1;
              const rk = rowKey(r);
              const isEditing = editRow === rk;
              const inpCls = "w-full px-1.5 py-1 rounded border-[1.5px] border-blue-300 text-xs font-[inherit] outline-none bg-hm-blue-bg focus:ring-1 focus:ring-blue-400 transition-colors";
              return (
                <tr key={i} className={`border-b border-[#F0F2F5] relative ${isEditing ? "bg-[#FAFBFF]" : "hover:bg-hm-bg-hover"} ${contracted && !isEditing ? "hover:!bg-[#F0FDF4]" : ""} transition-colors`}>
                  {/* 수정/완료 버튼 (맨앞) — 계약중이면 숨김 */}
                  <td className="px-1.5 py-2.5 text-center">
                    {contracted ? null : isEditing ? (
                      <button onClick={() => handleEditSave(r)}
                        className="px-2.5 py-[5px] rounded-md border-none bg-hm-success text-white text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:opacity-90 transition-opacity">
                        ✓ 완료
                      </button>
                    ) : (
                      <button onClick={() => setEditRow(rk)}
                        className="px-2 py-1 rounded-[5px] border border-blue-300 bg-hm-blue-bg text-hm-blue-dark text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-blue-100 transition-colors">
                        ✏️ 수정
                      </button>
                    )}
                  </td>
                  {/* 연결 */}
                  <td className="px-1 py-1 text-center">
                    {linkedRooms[rk] && (
                      <span className="text-xs font-bold px-2 py-[3px] rounded-[5px] bg-hm-danger-bg text-hm-danger border border-hm-danger-border whitespace-nowrap">연결</span>
                    )}
                  </td>
                  {/* 수수료(이벤트/중개) */}
                  {isEditing ? (
                    <td className="px-1 py-1 text-center whitespace-nowrap">
                      <div className="flex gap-0.5 justify-center">
                        <input id={`ve-${rk}-commEvent`} defaultValue={r.commEvent ?? ""} placeholder="이벤트" className={`${inpCls} !w-10 text-center`} />
                        <span className="text-xs text-[#B0B5C1] self-center">/</span>
                        <input id={`ve-${rk}-commBroker`} defaultValue={r.commBroker ?? ""} placeholder="중개" className={`${inpCls} !w-10 text-center`} />
                      </div>
                    </td>
                  ) : (
                    <td className="px-2 py-2.5 text-center whitespace-nowrap" style={{ textDecoration: cellDeco, opacity: cellOpacity }}>
                      <span className={`text-xs font-bold ${r.commEvent ? "text-purple-600" : "text-[#B0B5C1]"}`}>{r.commEvent || "—"}</span>
                      <span className="text-xs text-[#B0B5C1] mx-0.5">/</span>
                      <span className="text-xs font-bold text-hm-text">{r.commBroker > 0 ? (r.commBroker < 1 ? r.commBroker + "%" : r.commBroker + "만") : "—"}</span>
                    </td>
                  )}
                  <td className="px-2 py-2.5 font-bold" style={{ textDecoration: cellDeco, opacity: cellOpacity }}>{r.building}</td>
                  <td className="px-2 py-2.5" style={{ textDecoration: cellDeco, opacity: cellOpacity }}>{r.room}</td>
                  {/* 현관비번 */}
                  {isEditing ? (
                    <td className="px-1 py-1"><input id={`ve-${rk}-pw`} defaultValue={r.pw ?? ""} className={`${inpCls} text-left`} /></td>
                  ) : (
                    <td className="px-2 py-2.5" style={{ textDecoration: cellDeco, opacity: cellOpacity }}>{r.pw ? <code className="text-xs bg-hm-bg px-1.5 py-0.5 rounded font-semibold">{r.pw}</code> : "—"}</td>
                  )}
                  {/* 예치금~공실기간 */}
                  {[
                    { field: "deposit", value: r.deposit, num: true },
                    { field: "rent", value: r.rent, num: true },
                    { field: "nego", value: r.nego, num: true, extra: { fontWeight: 700, background: negoDiscount ? "var(--color-hm-danger-bg)" : "transparent", color: negoDiscount ? "var(--color-hm-danger)" : "var(--color-hm-text)" } },
                    { field: "mgmt", value: r.mgmt, num: true },
                    { field: "water", value: r.water, num: false },
                    { field: "cable", value: r.cable, num: false },
                    { field: "exitFee", value: r.exitFee, num: true },
                    { field: "days", value: r.days, num: true },
                  ].map((f, fi) => isEditing ? (
                    <td key={fi} className="px-1 py-1"><input id={`ve-${rk}-${f.field}`} defaultValue={f.value ?? ""} className={`${inpCls} text-right`} /></td>
                  ) : (
                    <td key={fi} className={`px-2 py-2.5 text-right ${!f.num ? "text-xs" : ""}`} style={{ textDecoration: cellDeco, opacity: cellOpacity, ...(f.extra || {}) }}>
                      {f.field === "days" ? (Number(f.value) > 0 ? <span className="font-bold" style={{ color: Number(f.value) > 30 ? "var(--color-hm-danger)" : Number(f.value) > 14 ? "var(--color-hm-warning)" : "var(--color-hm-text)" }}>{f.value}</span> : <span className="text-emerald-500 font-semibold text-xs">신규</span>) : renderVal(f.value, f.num)}
                    </td>
                  ))}
                  {/* 상태 버튼 (맨뒤) */}
                  <td className="px-1.5 py-2.5 text-center">
                    {st === "점검/청소중" ? (
                      <button className="sparkle-btn px-2.5 py-[5px] rounded-md border-[1.5px] border-gray-500 bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-gray-200 transition-colors" onClick={() => setConfirmPromo(r)}>
                        🔧 점검/청소중
                      </button>
                    ) : st === "홍보중" ? (
                      <button onClick={() => handleStatusChange(r, "점검/청소중")}
                        className="px-2.5 py-[5px] rounded-md border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-blue-100 transition-colors">
                        📢 홍보중
                      </button>
                    ) : st === "계약서입력" ? (
                      <span className="px-3 py-[5px] rounded-md bg-gray-100 text-gray-500 text-xs font-bold whitespace-nowrap cursor-default">
                        📋 계약중
                      </span>
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
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
            onClick={() => setReportModal(null)}>
            <div onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)]" style={{ width: isMobile ? "92%" : 480 }}>
              <div className="text-base font-bold text-hm-text mb-4 flex items-center justify-between">
                <span>📩 건물주 보고 — {rv.building} {rv.room}호</span>
                <button onClick={() => setReportModal(null)} className="w-7 h-7 rounded-md border border-hm-input-border bg-white cursor-pointer text-sm font-[inherit] hover:bg-gray-50 transition-colors">✕</button>
              </div>

              <div className="mb-3">
                <div className="text-xs font-bold text-purple-600 mb-1.5">👤 건물주 정보</div>
                {owners.map((o: any, oi: number) => (
                  <div key={oi} className="flex gap-2 mb-1 text-xs">
                    <span className="font-bold">{o.name || `건물주${oi + 1}`}</span>
                    <span className="text-hm-blue">{o.phone || "연락처 미등록"}</span>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <div className="text-xs font-bold text-hm-success mb-1.5">💬 전송 내용</div>
                <textarea id="report-msg" defaultValue={msgText} rows={14}
                  className="w-full p-3 rounded-lg border-[1.5px] border-hm-input-border text-xs font-[inherit] resize-y leading-relaxed focus:ring-1 focus:ring-hm-blue outline-none transition-colors" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => {
                  const msg = (document.getElementById("report-msg") as HTMLTextAreaElement | null)?.value || msgText;
                  if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
                  const smsUrl = `sms:${ownerPhone}?body=${encodeURIComponent(msg)}`;
                  window.open(smsUrl, "_blank");

                  setReportModal(null);
                }}
                  className="flex-1 p-3 rounded-lg border-none bg-hm-blue text-white font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
                  📱 문자 보내기
                </button>
                <button onClick={() => {
                  const msg = (document.getElementById("report-msg") as HTMLTextAreaElement | null)?.value || msgText;
                  if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
                  const kakaoUrl = `https://story.kakao.com/share?url=&text=${encodeURIComponent(msg)}`;
                  window.open(kakaoUrl, "_blank");

                  setReportModal(null);
                }}
                  className="flex-1 p-3 rounded-lg border-none bg-[#FEE500] text-[#3C1E1E] font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
                  💬 카카오톡
                </button>
                <button onClick={() => {
                  const msg = (document.getElementById("report-msg") as HTMLTextAreaElement | null)?.value || msgText;
                  navigator.clipboard.writeText(msg);
                  toast.success("메시지가 클립보드에 복사되었습니다.");
                }}
                  className="px-4 py-3 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] hover:bg-gray-50 transition-colors">
                  📋 복사
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 홍보 전환 확인 모달 */}
      {confirmPromo && (
        <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center"
          onMouseDown={() => setConfirmPromo(null)}>
          <div className="bg-white rounded-2xl p-6 w-[380px] shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
            onMouseDown={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="text-base font-bold text-hm-text">📢 홍보 전환</div>
              <button onClick={() => setConfirmPromo(null)} className="bg-none border-none text-xl cursor-pointer text-hm-text-muted hover:text-hm-text transition-colors">✕</button>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed">
              홍보 준비가 완료되었습니까?
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setConfirmPromo(null)}
                className="px-5 py-2 rounded-lg border border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button onClick={() => { handleStatusChange(confirmPromo, "홍보중"); setConfirmPromo(null); }}
                className="px-5 py-2 rounded-lg border-none bg-hm-blue text-white font-bold text-xs cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
