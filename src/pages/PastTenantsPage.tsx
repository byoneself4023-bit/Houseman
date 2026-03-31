import { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { buildings } from '@/data';
import { useIsMobile, fmt } from '@/utils';
import { matchKorean } from '@/utils/koreanSearch';
import { Card, SectionTitle, Table } from '@/components';
import { inputClassName } from '@/components/Field';

const REASON_COLORS: Record<string, { bg: string; c: string }> = {
  "만기퇴실": { bg: "#F0FDF4", c: "#059669" },
  "만기전퇴실": { bg: "#FEF2F2", c: "#DC2626" },
  "재계약": { bg: "#EFF6FF", c: "#2563EB" },
};

interface PastTenantRecord {
  name: string;
  phone?: string;
  building: string;
  room: string;
  moveIn?: string;
  moveOut?: string;
  expiry?: string;
  deposit: number;
  rent: number;
  mgmt?: number;
  roomType?: string;
  reason: string;
  settlement?: string;
  settlementDate?: string;
  finalSettlement?: number;
  renewedAt?: string;
  contractFiles?: string[];
  moveInPhotos?: string[];
  moveInCheckPhotos?: string[];
  moveOutPhotos?: string[];
  isRentPrepaid?: boolean;
  isMgmtPrepaid?: boolean;
  cleanFee?: number;
  waterAmt?: number;
  internetAmt?: number;
  startDay?: number;
  daysInMonth?: number;
  usedDays?: number;
  netRent?: number;
  netMgmt?: number;
  netWater?: number;
  netInternet?: number;
  unpaidRent?: number;
  unpaidMgmt?: number;
  unpaidWater?: number;
  unpaidInternet?: number;
  totalRefund?: number;
  totalDeduct?: number;
  penalty7?: number;
  penaltyComm?: number;
  lateFee?: number;
  prevUnpaid?: number;
  usagePeriod?: string;
  manElec?: { amt: string | number; period?: string }[];
  manGas?: { amt: string | number; period?: string }[];
  manRepair?: number;
  manRepairDesc?: string;
  manWaste?: number;
  manWasteDesc?: string;
  manOther?: { amt: string | number; desc?: string }[];
  manRestoration?: number;
  manRestorationDesc?: string;
  _key: string;
  _idx: number;
  [key: string]: any;
}

interface SRowProps {
  label: string;
  sub?: string;
  value: number | string;
  color?: string;
  bold?: boolean;
}

interface PastTenantsPageProps {
  myBuildings?: string[];
  pastTenantsData?: Record<string, Record<string, any>[]>;
  activeTenants?: Record<string, any>[];
  isLoading?: boolean;
}

export const PastTenantsPage: React.FC<PastTenantsPageProps> = ({ myBuildings = [], pastTenantsData = {}, activeTenants = [] }) => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [filterBld, setFilterBld] = useState("전체");
  const [filterReason, setFilterReason] = useState("전체");
  const [selected, setSelected] = useState<PastTenantRecord | null>(null);
  const [viewMode, setViewMode] = useState("info"); // "info" | "settlement"
  const [capturing, setCapturing] = useState(false);
  const settlementRef = useRef<HTMLDivElement>(null);

  const allRecords = useMemo((): PastTenantRecord[] => {
    const list: PastTenantRecord[] = [];
    Object.entries(pastTenantsData).forEach(([key, records]) => {
      const [building, room] = key.split("_");
      if (myBuildings.length > 0 && !myBuildings.includes(building)) return;
      (records || []).forEach((r: Record<string, any>, idx: number) => {
        list.push({ ...r, building, room, _key: key, _idx: idx } as PastTenantRecord);
      });
    });
    list.sort((a, b) => (b.moveOut || "").localeCompare(a.moveOut || ""));
    return list;
  }, [pastTenantsData, myBuildings]);

  const buildingNames = useMemo(() => {
    const set = new Set(allRecords.map(r => r.building));
    return ["전체", ...set];
  }, [allRecords]);

  const reasons = ["전체", "만기퇴실", "만기전퇴실", "재계약"];

  const filtered = useMemo(() => allRecords.filter(r => {
    if (filterBld !== "전체" && r.building !== filterBld) return false;
    if (filterReason !== "전체" && r.reason !== filterReason) return false;
    if (search) {
      const q = search;
      if (!matchKorean(r.name || "", q) && !matchKorean(r.building, q) && !matchKorean(r.room, q) && !(r.phone || "").includes(q)) return false;
    }
    return true;
  }), [allRecords, filterBld, filterReason, search]);

  const stats = useMemo(() => {
    const moveout = allRecords.filter(r => r.reason !== "재계약").length;
    const renew = allRecords.filter(r => r.reason === "재계약").length;
    return { total: allRecords.length, moveout, renew };
  }, [allRecords]);

  const getReasonStyle = (reason: string) => REASON_COLORS[reason] || { bg: "#F3F4F6", c: "#5F6577" };

  // 정산서 이미지 캡처 & 다운로드
  const handleCapture = () => {
    if (!settlementRef.current) return;
    setCapturing(true);
    html2canvas(settlementRef.current, { scale: 2, useCORS: true, backgroundColor: "#fff" })
      .then(canvas => {
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = `퇴실정산서_${selected!.building}_${selected!.room}_${selected!.name}_${selected!.moveOut}.png`;
        a.click();
      })
      .catch(err => { console.warn("캡처 실패:", err); alert("이미지 캡처에 실패했습니다."); })
      .finally(() => setCapturing(false));
  };

  // ── Detail view ──
  if (selected) {
    const r = selected;
    const rc = getReasonStyle(r.reason);
    const currentTenant = activeTenants.find(t => t.building === r.building && t.room === r.room);
    const hasSettlement = r.finalSettlement !== undefined;
    const depositLabel = r.roomType === "단기" ? "예치금" : "보증금";
    const isManOff = r.roomType === "관리사무소";
    const pn = (v: any): number => Number(String(v).replace(/,/g, "")) || 0;

    const SRow: React.FC<SRowProps> = ({ label, sub, value, color, bold }) => (
      <div className="flex justify-between items-center py-[5px] border-b border-gray-100">
        <div><span className={`text-[11px] ${bold ? 'font-bold' : 'font-normal'}`} style={{ color: color || "#5F6577" }}>{label}</span>{sub && <span className="text-[9px] text-[#B0B5C1] ml-1.5">{sub}</span>}</div>
        <span className={`text-xs ${bold ? 'font-extrabold' : 'font-semibold'}`} style={{ color: color || "#1A1D23" }}>{typeof value === "number" ? (value < 0 ? `-${fmt(Math.abs(value))}` : fmt(value)) : value}</span>
      </div>
    );

    // 탭 버튼
    const tabs = [
      { key: "info", label: "기본정보" },
      ...(hasSettlement ? [{ key: "settlement", label: "퇴실정산서" }] : []),
    ];

    return (
      <div>
        <div className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { setSelected(null); setViewMode("info"); }}>
          <span className="text-xl">←</span>
          <span className="text-sm font-bold text-hm-blue">퇴실정보 목록으로</span>
        </div>

        {/* 탭 */}
        {tabs.length > 1 && (
          <div className="flex gap-1 mb-4">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setViewMode(tab.key)}
                className={`px-5 py-2 rounded-lg font-bold text-xs font-[inherit] cursor-pointer transition-all ${viewMode === tab.key ? 'border-2 border-hm-blue bg-hm-blue-bg text-hm-blue-dark' : 'border-[1.5px] border-hm-input-border bg-white text-hm-text-sub hover:bg-hm-bg-hover'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── 기본정보 탭 ── */}
        {viewMode === "info" && (
          <>
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xl font-extrabold text-hm-text">{r.name}</div>
                  <div className="text-xs text-hm-text-muted mt-0.5">{r.building} {r.room}호 · {r.phone || "-"}{r.roomType ? ` · ${r.roomType}` : ""}</div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md" style={{ background: rc.bg, color: rc.c }}>{r.reason}</span>
              </div>

              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-2.5 mb-3`}>
                <div className="p-2.5 px-3 bg-hm-bg-slate rounded-lg border border-hm-border">
                  <div className="text-[9px] text-hm-text-muted mb-0.5">입주일</div>
                  <div className="text-[13px] font-bold">{r.moveIn || "-"}</div>
                </div>
                <div className="p-2.5 px-3 bg-hm-bg-slate rounded-lg border border-hm-border">
                  <div className="text-[9px] text-hm-text-muted mb-0.5">만기일</div>
                  <div className="text-[13px] font-bold">{r.expiry || "-"}</div>
                </div>
                <div className="p-2.5 px-3 bg-hm-bg-slate rounded-lg border border-hm-border">
                  <div className="text-[9px] text-hm-text-muted mb-0.5">{r.reason === "재계약" ? "재계약일" : "퇴실일"}</div>
                  <div className="text-[13px] font-bold">{r.moveOut || "-"}</div>
                </div>
                <div className="p-2.5 px-3 bg-hm-bg-slate rounded-lg border border-hm-border">
                  <div className="text-[9px] text-hm-text-muted mb-0.5">정산일</div>
                  <div className="text-[13px] font-bold">{r.settlementDate || "-"}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="p-2.5 px-3 bg-hm-bg-slate rounded-lg border border-hm-border">
                  <div className="text-[9px] text-hm-text-muted mb-0.5">{depositLabel}</div>
                  <div className="text-[13px] font-bold">{fmt(r.deposit)}원</div>
                </div>
                <div className="p-2.5 px-3 bg-hm-bg-slate rounded-lg border border-hm-border">
                  <div className="text-[9px] text-hm-text-muted mb-0.5">월세</div>
                  <div className="text-[13px] font-bold">{fmt(r.rent)}원</div>
                </div>
                <div className="p-2.5 px-3 bg-hm-bg-slate rounded-lg border border-hm-border">
                  <div className="text-[9px] text-hm-text-muted mb-0.5">관리비</div>
                  <div className="text-[13px] font-bold">{fmt(r.mgmt || 0)}원</div>
                </div>
              </div>

              {/* 최종 정산 요약 */}
              {hasSettlement && (
                <div className={`rounded-[10px] px-[18px] py-3.5 mb-4 border-2 ${(r.finalSettlement! >= 0) ? 'bg-[#F0FDF4] border-hm-success-border' : 'bg-hm-danger-bg border-hm-danger-border'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-extrabold ${(r.finalSettlement! >= 0) ? 'text-[#065F46]' : 'text-[#991B1B]'}`}>{(r.finalSettlement! >= 0) ? "반환금액" : "추가청구"}</span>
                    <span className={`text-2xl font-black ${(r.finalSettlement! >= 0) ? 'text-hm-success' : 'text-hm-danger'}`}>{r.finalSettlement! < 0 ? `-${fmt(Math.abs(r.finalSettlement!))}` : fmt(r.finalSettlement!)}<span className="text-xs">원</span></span>
                  </div>
                </div>
              )}

              {!hasSettlement && r.reason !== "재계약" && (
                <div className="p-2.5 px-3 bg-hm-bg-slate rounded-lg border border-hm-border mb-4">
                  <div className="text-[9px] text-hm-text-muted mb-0.5">정산 상태</div>
                  <div className={`text-[13px] font-bold ${r.settlement === "정산완료" ? 'text-hm-success' : 'text-hm-danger'}`}>{r.settlement || "-"}</div>
                </div>
              )}

              {r.renewedAt && (
                <div className="p-2.5 px-3 bg-hm-blue-bg rounded-lg border border-[#BFDBFE] mb-4">
                  <div className="text-[9px] text-hm-text-muted mb-0.5">재계약 처리일</div>
                  <div className="text-[13px] font-bold text-hm-blue-dark">{r.renewedAt}</div>
                </div>
              )}

              {currentTenant && (
                <div className="px-3.5 py-3 bg-[#F0FDF4] rounded-lg border border-hm-success-border mb-4">
                  <div className="text-[10px] font-bold text-hm-success mb-1">현재 임차인</div>
                  <div className="text-[13px] font-bold text-hm-text">{currentTenant.name} · {currentTenant.phone}</div>
                  <div className="text-[11px] text-hm-text-sub mt-0.5">입주일 {currentTenant.moveIn || "-"} · 만기 {currentTenant.expiry || "-"} · 월세 {fmt(currentTenant.rent)}원</div>
                </div>
              )}

              {/* 계약서 파일 */}
              <div className="text-[11px] font-extrabold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">📎 계약서</div>
              {r.contractFiles && r.contractFiles.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {r.contractFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-hm-bg-slate rounded-md border border-hm-border">
                      <span className="text-xs text-hm-blue">📄</span>
                      <span className="text-xs text-hm-text flex-1">{f}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-[#B0B5C1] text-xs">첨부된 계약서가 없습니다</div>
              )}

              {/* 입주사진 */}
              {(r.moveInPhotos || []).length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-extrabold text-hm-success mb-2 pb-1.5 border-b-2 border-[#D1FAE5]">🏠 입주사진 ({r.moveInPhotos!.length}장) <span className="text-[9px] text-hm-text-muted font-semibold">{r.moveIn || ""}</span></div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {r.moveInPhotos!.map((src, pi) => (
                      <div key={pi} className="aspect-square rounded-md border-[1.5px] border-hm-success-border overflow-hidden bg-[#F0FDF4] flex items-center justify-center">
                        {src && src.startsWith("data:image/") && !src.includes("placeholder") ? (
                          <img src={src} alt={`입주 ${pi+1}`} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">🏠</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 시작 → 끝 비교: 입주체크사진 + 퇴실사진 */}
              {((r.moveInCheckPhotos || []).length > 0 || (r.moveOutPhotos || []).length > 0) && (
                <div className="mt-4">
                  <div className="text-xs font-extrabold text-hm-text mb-2.5 pb-1.5 border-b-[1.5px] border-hm-border">📸 호실 상태 비교 (시작 → 끝)</div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* 시작: 입주체크사진 */}
                    <div className="border-2 border-hm-warning-border rounded-xl p-3 bg-hm-warning-bg">
                      <div className="text-[11px] font-extrabold text-hm-warning mb-2">📋 입주체크사진 (시작) <span className="text-[9px] text-hm-text-muted font-semibold">{(r.moveInCheckPhotos || []).length}장</span></div>
                      {(r.moveInCheckPhotos || []).length > 0 ? (
                        <div className="grid grid-cols-3 gap-1">
                          {r.moveInCheckPhotos!.map((src, pi) => (
                            <div key={pi} className="aspect-square rounded-md border-[1.5px] border-hm-warning-border overflow-hidden bg-hm-warning-bg flex items-center justify-center">
                              {src && src.startsWith("data:image/") && !src.includes("placeholder") ? (
                                <img src={src} alt={`체크 ${pi+1}`} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm">📋</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-[#B0B5C1] text-[11px]">사진 없음</div>
                      )}
                    </div>
                    {/* 끝: 퇴실사진 */}
                    <div className="border-2 border-hm-danger-border rounded-xl p-3 bg-hm-danger-bg">
                      <div className="text-[11px] font-extrabold text-hm-danger mb-2">🚪 퇴실사진 (끝) <span className="text-[9px] text-hm-text-muted font-semibold">{(r.moveOutPhotos || []).length}장</span></div>
                      {(r.moveOutPhotos || []).length > 0 ? (
                        <div className="grid grid-cols-3 gap-1">
                          {r.moveOutPhotos!.map((src, pi) => (
                            <div key={pi} className="aspect-square rounded-md border-[1.5px] border-hm-danger-border overflow-hidden bg-hm-danger-bg flex items-center justify-center">
                              {src && src.startsWith("data:image/") && !src.includes("placeholder") ? (
                                <img src={src} alt={`퇴실 ${pi+1}`} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm">🚪</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-[#B0B5C1] text-[11px]">사진 없음</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* 같은 호실 전체 이력 */}
            {(() => {
              const roomRecords = (pastTenantsData[`${r.building}_${r.room}`] || []).map((rec: Record<string, any>, idx: number) => ({ ...rec, _idx: idx }));
              if (roomRecords.length <= 1) return null;
              return (
                <Card>
                  <SectionTitle sub={`${r.building} ${r.room}호`}>📋 해당 호실 전체 이력</SectionTitle>
                  <div className="flex flex-col gap-1.5">
                    {[...roomRecords].reverse().map((rec: Record<string, any>, i: number) => {
                      const rcs = getReasonStyle(rec.reason);
                      return (
                        <div key={i} className="flex justify-between items-center px-3 py-2 bg-hm-bg-slate rounded-lg border border-hm-border">
                          <div>
                            <span className="text-[13px] font-bold">{rec.name}</span>
                            <span className="text-[11px] text-hm-text-sub ml-2">{rec.phone || ""}</span>
                            <div className="text-[10px] text-hm-text-muted mt-0.5">{rec.moveIn || "-"} ~ {rec.moveOut || "-"} · 월세 {fmt(rec.rent)}원</div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: rcs.bg, color: rcs.c }}>{rec.reason}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })()}
          </>
        )}

        {/* ── 퇴실정산서 탭 ── */}
        {viewMode === "settlement" && hasSettlement && (
          <>
            {/* 프린트/다운로드 버튼 */}
            <div className="flex gap-2 mb-3">
              <button onClick={handleCapture} disabled={capturing}
                className="px-6 py-2.5 rounded-lg border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark font-bold text-xs cursor-pointer font-[inherit] hover:shadow-md transition-all disabled:opacity-50">
                {capturing ? "캡처중..." : "🖨 이미지 다운로드"}
              </button>
            </div>

            {/* 정산서 본문 (캡처 대상) */}
            <Card ref={settlementRef} className="max-w-[720px]">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-lg font-extrabold text-hm-danger flex items-center gap-2.5">
                    🚪 퇴실정산서
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-hm-text-sub">{r.roomType || ""}</span>
                  </div>
                  <div className="text-xs text-hm-text-muted mt-1">{r.building} {r.room}호 · {r.name} · {r.phone}</div>
                </div>
                <div className={`px-[18px] py-2 rounded-lg text-sm font-extrabold border-[1.5px] ${r.reason === "만기전퇴실" ? 'bg-hm-danger-bg text-hm-danger border-hm-danger-border' : 'bg-[#F0FDF4] text-hm-success border-hm-success-border'}`}>
                  {r.reason}
                </div>
              </div>

              {isManOff ? (
                /* 관리사무소: 간소 */
                <>
                  <div className="text-[11px] font-extrabold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">입주자 정보</div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div><div className="text-[9px] text-hm-text-muted mb-0.5">입주자</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs font-semibold">{r.name}</div></div>
                    <div><div className="text-[9px] text-hm-text-muted mb-0.5">연락처</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs">{r.phone}</div></div>
                  </div>
                  <div className="text-[11px] font-extrabold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">보증금 반환</div>
                  <div className="bg-[#F0FDF4] rounded-[10px] px-[18px] py-3.5 border-2 border-hm-success-border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-extrabold text-[#065F46]">반환금액 (보증금)</span>
                      <span className="text-2xl font-black text-hm-success">{fmt(r.deposit)}<span className="text-xs">원</span></span>
                    </div>
                  </div>
                </>
              ) : (
                /* 일반: 2컬럼 레이아웃 */
                <div className="grid grid-cols-[3fr_2fr] gap-4">
                  {/* Left */}
                  <div>
                    <div className="text-[11px] font-extrabold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">입주자 정보</div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div><div className="text-[9px] text-hm-text-muted mb-0.5">입주자</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs font-semibold">{r.name}</div></div>
                      <div><div className="text-[9px] text-hm-text-muted mb-0.5">연락처</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs">{r.phone}</div></div>
                    </div>

                    <div className="text-[11px] font-extrabold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">사용 기간</div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div><div className="text-[9px] text-hm-text-muted mb-0.5">입주일</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs">{r.moveIn || "-"}</div></div>
                      <div><div className="text-[9px] text-hm-text-muted mb-0.5">만기일</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs">{r.expiry || "-"}</div></div>
                      <div><div className="text-[9px] text-hm-text-muted mb-0.5">퇴실일</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-danger-bg text-xs font-bold text-hm-danger text-center">{r.moveOut}</div></div>
                      <div><div className="text-[9px] text-hm-text-muted mb-0.5">사용기간</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-blue-bg text-xs font-bold text-hm-blue-dark text-center">{r.usagePeriod || (() => { if (!r.moveIn || !r.moveOut) return "-"; const a = new Date(r.moveIn), b = new Date(r.moveOut); let m = (b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth()); let d = b.getDate()-a.getDate(); if(d<0){m--;d+=new Date(b.getFullYear(),b.getMonth(),0).getDate();} return `${m}개월 ${d}일`; })()}</div></div>
                    </div>

                    <div className="text-[11px] font-extrabold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">계약 정보</div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div><div className="text-[9px] text-hm-text-muted mb-0.5">{depositLabel}</div><div className="px-2.5 py-[7px] rounded-lg bg-[#F0FDF4] text-xs font-bold text-hm-success text-right">{fmt(r.deposit)}</div></div>
                      <div><div className="text-[9px] text-hm-text-muted mb-0.5">월세 <span className={`text-[8px] ${r.isRentPrepaid ? 'text-hm-success' : 'text-hm-danger'}`}>({r.isRentPrepaid ? "선불" : "후불"})</span></div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs font-semibold text-right">{fmt(r.rent)}</div></div>
                      <div><div className="text-[9px] text-hm-text-muted mb-0.5">관리비 <span className={`text-[8px] ${r.isMgmtPrepaid ? 'text-hm-success' : 'text-hm-danger'}`}>({r.isMgmtPrepaid ? "선불" : "후불"})</span></div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs font-semibold text-right">{fmt(r.mgmt || 0)}</div></div>
                    </div>
                    <div className={`grid gap-2 mb-3 ${(r.cleanFee ?? 0) > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                      {(r.cleanFee ?? 0) > 0 && <div><div className="text-[9px] text-hm-text-muted mb-0.5">퇴실청소비</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-danger-bg text-xs font-semibold text-right text-hm-danger">{fmt(r.cleanFee!)}</div></div>}
                      <div><div className="text-[9px] text-hm-text-muted mb-0.5">수도</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs text-right">{fmt(r.waterAmt || 0)}</div></div>
                      <div><div className="text-[9px] text-hm-text-muted mb-0.5">TV/인터넷</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs text-right">{fmt(r.internetAmt || 0)}</div></div>
                      <div><div className="text-[9px] text-hm-text-muted mb-0.5">만기일</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs">{r.expiry || "-"}</div></div>
                    </div>

                    {/* 수기 입력 내역 */}
                    {(() => {
                      const hasManual = (r.manElec||[]).some((x: any)=>pn(x.amt)>0) || (r.manGas||[]).some((x: any)=>pn(x.amt)>0) || (r.manRepair ?? 0)>0 || (r.manWaste ?? 0)>0 || (r.manOther||[]).some((x: any)=>pn(x.amt)>0) || (r.manRestoration ?? 0)>0;
                      if (!hasManual) return null;
                      return (<>
                        <div className="text-[11px] font-extrabold text-hm-warning mb-2 pb-1.5 border-b-[1.5px] border-hm-warning-border">✏️ 수기 입력 내역</div>
                        {(r.manElec||[]).map((row: any,i: number) => pn(row.amt) > 0 && (
                          <div key={`e${i}`} className="flex justify-between py-1 border-b border-hm-danger-bg">
                            <span className="text-[11px] text-hm-warning">전기{row.period ? ` (${row.period})` : ` ${i+1}`}</span>
                            <span className="text-xs font-semibold">{fmt(pn(row.amt))}</span>
                          </div>
                        ))}
                        {(r.manGas||[]).map((row: any,i: number) => pn(row.amt) > 0 && (
                          <div key={`g${i}`} className="flex justify-between py-1 border-b border-hm-danger-bg">
                            <span className="text-[11px] text-hm-warning">가스{row.period ? ` (${row.period})` : ` ${i+1}`}</span>
                            <span className="text-xs font-semibold">{fmt(pn(row.amt))}</span>
                          </div>
                        ))}
                        {(r.manRepair ?? 0) > 0 && (
                          <div className="flex justify-between py-1 border-b border-hm-danger-bg">
                            <span className="text-[11px] text-hm-warning">수리비{r.manRepairDesc ? ` (${r.manRepairDesc})` : ""}</span>
                            <span className="text-xs font-semibold">{fmt(r.manRepair!)}</span>
                          </div>
                        )}
                        {(r.manWaste ?? 0) > 0 && (
                          <div className="flex justify-between py-1 border-b border-hm-danger-bg">
                            <span className="text-[11px] text-hm-warning">폐기물{r.manWasteDesc ? ` (${r.manWasteDesc})` : ""}</span>
                            <span className="text-xs font-semibold">{fmt(r.manWaste!)}</span>
                          </div>
                        )}
                        {(r.manOther||[]).map((row: any,i: number) => pn(row.amt) > 0 && (
                          <div key={`o${i}`} className="flex justify-between py-1 border-b border-hm-danger-bg">
                            <span className="text-[11px] text-hm-warning">기타{i+1}{row.desc ? ` (${row.desc})` : ""}</span>
                            <span className="text-xs font-semibold">{fmt(pn(row.amt))}</span>
                          </div>
                        ))}
                        {(r.manRestoration ?? 0) > 0 && (
                          <div className="flex justify-between py-1 border-b border-hm-danger-bg">
                            <span className="text-[11px] text-[#7C3AED]">원상복구비{r.manRestorationDesc ? ` (${r.manRestorationDesc})` : ""}</span>
                            <span className="text-xs font-semibold">{fmt(r.manRestoration!)}</span>
                          </div>
                        )}
                        <div className="h-3" />
                      </>);
                    })()}
                  </div>

                  {/* Right - 정산 계산 */}
                  <div>
                    <div className="text-[11px] font-extrabold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">정산 내역</div>
                    <div className="text-[9px] text-hm-text-muted mb-1">기산일: {r.startDay}일 · 월 일수: {r.daysInMonth}일 · 당월 사용: {r.usedDays}일</div>

                    {/* 반환 */}
                    <div className="bg-[#F0FDF4] rounded-[10px] px-3.5 py-2.5 mb-2.5 border border-hm-success-border">
                      <div className="text-[10px] font-bold text-hm-success mb-1">반환 항목</div>
                      <SRow label={depositLabel} value={r.deposit} color="#059669" bold />
                      {(r.netRent ?? 0) < 0 && <SRow label="월세 환불" sub={`${r.daysInMonth! - r.usedDays!}일분${(r.unpaidRent ?? 0) > 0 ? " · 미납반영" : ""}`} value={-r.netRent!} color="#059669" />}
                      {(r.netMgmt ?? 0) < 0 && <SRow label="관리비 환불" sub={`${r.daysInMonth! - r.usedDays!}일분${(r.unpaidMgmt ?? 0) > 0 ? " · 미납반영" : ""}`} value={-r.netMgmt!} color="#059669" />}
                      {(r.netWater ?? 0) < 0 && <SRow label="수도 환불" sub={`${r.daysInMonth! - r.usedDays!}일분${(r.unpaidWater ?? 0) > 0 ? " · 미납반영" : ""}`} value={-r.netWater!} color="#059669" />}
                      {(r.netInternet ?? 0) < 0 && <SRow label="TV/인터넷 환불" sub={`${r.daysInMonth! - r.usedDays!}일분${(r.unpaidInternet ?? 0) > 0 ? " · 미납반영" : ""}`} value={-r.netInternet!} color="#059669" />}
                      <div className="flex justify-between py-1.5 mt-1 border-t-[1.5px] border-hm-success-border">
                        <span className="text-xs font-extrabold text-[#065F46]">반환소계</span>
                        <span className="text-sm font-black text-hm-success">{fmt(r.deposit + (r.totalRefund || 0))}</span>
                      </div>
                    </div>

                    {/* 공제 */}
                    <div className="bg-hm-danger-bg rounded-[10px] px-3.5 py-2.5 mb-2.5 border border-hm-danger-border">
                      <div className="text-[10px] font-bold text-hm-danger mb-1">공제 항목</div>
                      {(r.netRent ?? 0) > 0 && <SRow label="월세" sub={`${r.usedDays}일분${(r.unpaidRent ?? 0) > 0 ? " · 미납반영" : ""}`} value={r.netRent!} color="#DC2626" />}
                      {(r.netMgmt ?? 0) > 0 && <SRow label="관리비" sub={`${r.usedDays}일분${(r.unpaidMgmt ?? 0) > 0 ? " · 미납반영" : ""}`} value={r.netMgmt!} color="#DC2626" />}
                      {(r.netWater ?? 0) > 0 && <SRow label="수도" sub={`${r.usedDays}일분${(r.unpaidWater ?? 0) > 0 ? " · 미납반영" : ""}`} value={r.netWater!} color="#DC2626" />}
                      {(r.netInternet ?? 0) > 0 && <SRow label="TV/인터넷" sub={`${r.usedDays}일분${(r.unpaidInternet ?? 0) > 0 ? " · 미납반영" : ""}`} value={r.netInternet!} color="#DC2626" />}
                      {(r.cleanFee ?? 0) > 0 && <SRow label="퇴실청소비" value={r.cleanFee!} color="#DC2626" />}
                      {(r.manElec||[]).map((row: any,i: number) => pn(row.amt) > 0 && <SRow key={`e${i}`} label={`전기${row.period ? ` (${row.period})` : ` ${i+1}`}`} value={pn(row.amt)} color="#DC2626" />)}
                      {(r.manGas||[]).map((row: any,i: number) => pn(row.amt) > 0 && <SRow key={`g${i}`} label={`가스${row.period ? ` (${row.period})` : ` ${i+1}`}`} value={pn(row.amt)} color="#DC2626" />)}
                      {(r.manRepair ?? 0) > 0 && <SRow label={`수리비${r.manRepairDesc ? ` (${r.manRepairDesc})` : ""}`} value={r.manRepair!} color="#DC2626" />}
                      {(r.manWaste ?? 0) > 0 && <SRow label={`폐기물${r.manWasteDesc ? ` (${r.manWasteDesc})` : ""}`} value={r.manWaste!} color="#DC2626" />}
                      {(r.manOther||[]).map((row: any,i: number) => pn(row.amt) > 0 && <SRow key={`o${i}`} label={`기타${i+1}${row.desc ? ` (${row.desc})` : ""}`} value={pn(row.amt)} color="#DC2626" />)}
                      {(r.manRestoration ?? 0) > 0 && <SRow label={`원상복구비${r.manRestorationDesc ? ` (${r.manRestorationDesc})` : ""}`} value={r.manRestoration!} color="#7C3AED" />}
                      {((r.penalty7 ?? 0) > 0 || (r.penaltyComm ?? 0) > 0) && <>
                        <div className="h-px bg-hm-danger-border my-1" />
                        {(r.penalty7 ?? 0) > 0 && <SRow label="7일패널티" value={r.penalty7!} color="#DC2626" />}
                        {(r.penaltyComm ?? 0) > 0 && <SRow label="중개수수료" value={r.penaltyComm!} color="#DC2626" />}
                      </>}
                      {(r.lateFee ?? 0) > 0 && <SRow label="연체수수료" sub="미납임대료 5%" value={r.lateFee!} color="#DC2626" />}
                      {(r.prevUnpaid ?? 0) > 0 && <>
                        <div className="h-px bg-hm-danger-border my-1" />
                        <SRow label="전월 미납금" value={r.prevUnpaid!} color="#DC2626" bold />
                      </>}
                      <div className="flex justify-between py-1.5 mt-1 border-t-[1.5px] border-hm-danger-border">
                        <span className="text-xs font-extrabold text-[#991B1B]">공제소계</span>
                        <span className="text-sm font-black text-hm-danger">-{fmt(r.totalDeduct || 0)}</span>
                      </div>
                    </div>

                    {/* 최종 정산 */}
                    <div className={`rounded-[10px] px-[18px] py-3.5 border-2 ${r.finalSettlement! >= 0 ? 'bg-[#F0FDF4] border-hm-success-border' : 'bg-hm-danger-bg border-hm-danger-border'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-extrabold ${r.finalSettlement! >= 0 ? 'text-[#065F46]' : 'text-[#991B1B]'}`}>{r.finalSettlement! >= 0 ? "반환금액" : "추가청구"}</span>
                        <span className={`text-2xl font-black ${r.finalSettlement! >= 0 ? 'text-hm-success' : 'text-hm-danger'}`}>{r.finalSettlement! < 0 ? `-${fmt(Math.abs(r.finalSettlement!))}` : fmt(r.finalSettlement!)}<span className="text-xs">원</span></span>
                      </div>
                    </div>

                    {r.reason === "만기전퇴실" && ((r.penalty7 ?? 0) > 0 || (r.penaltyComm ?? 0) > 0) && (
                      <div className="mt-2 px-2.5 py-1.5 bg-hm-danger-bg rounded-md border border-hm-danger-border text-[10px] text-hm-danger font-semibold">
                        ⚠️ 만기전퇴실 위약금: {(r.penalty7 ?? 0) > 0 ? `${fmt(r.penalty7!)}원` : ""}{(r.penaltyComm ?? 0) > 0 ? ` + 중개수수료 ${fmt(r.penaltyComm!)}원` : ""}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    );
  }

  // ── List view ──
  const reasonColors: Record<string, string> = { "전체": "#1A1D23", "만기퇴실": "#059669", "만기전퇴실": "#DC2626", "재계약": "#2563EB" };
  const reasonCounts: Record<string, number> = { "전체": allRecords.length, "만기퇴실": stats.moveout - allRecords.filter(r => r.reason === "만기전퇴실").length, "만기전퇴실": allRecords.filter(r => r.reason === "만기전퇴실").length, "재계약": stats.renew };

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <SectionTitle sub="">📦 퇴실정보</SectionTitle>
      </div>

      {/* Summary tab badges */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {reasons.map(r => (
          <button key={r} onClick={() => setFilterReason(r)}
            className="px-4 py-[7px] rounded-lg font-semibold text-[12.5px] cursor-pointer font-[inherit] transition-all hover:shadow-sm"
            style={{ border: filterReason === r ? `2px solid ${reasonColors[r]}` : "1px solid #E0E3E9", background: filterReason === r ? `${reasonColors[r]}10` : "#fff", color: filterReason === r ? reasonColors[r] : "#5F6577" }}>
            {r} <span className="font-extrabold">{reasonCounts[r]}</span>
          </button>
        ))}
      </div>

      {/* Search + Building filter */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 건물, 호실, 연락처 검색..."
          className="w-60 px-3.5 py-2 rounded-lg border border-hm-input-border text-xs outline-none font-[inherit] bg-hm-bg-hover focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
        <select value={filterBld} onChange={e => setFilterBld(e.target.value)}
          className="px-3 py-2 rounded-lg border-[1.5px] border-hm-input-border text-xs font-semibold font-[inherit] focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors">
          {buildingNames.map(b => <option key={b}>{b}</option>)}
        </select>
      </div>

      {/* Main Table */}
      {filtered.length === 0 ? (
        <Card className="text-center p-12 text-hm-text-muted">
          <div className="text-[40px] mb-3">📦</div>
          <div className="text-sm font-semibold">{search || filterBld !== "전체" || filterReason !== "전체" ? "검색 결과가 없습니다" : "퇴실 이력이 없습니다"}</div>
        </Card>
      ) : (
        <Card className="overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-hm-border">
                {["건물명","호실","입주자","연락처","퇴실일","정산금액","사유"].map((h, i) => (
                  <th key={i} className={`px-2 py-2.5 text-[11px] font-bold text-hm-text-muted whitespace-nowrap ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const rc = getReasonStyle(r.reason);
                return (
                  <tr key={i} onClick={() => { setSelected(r); setViewMode("info"); }}
                    className="border-b border-[#F0F2F5] cursor-pointer hover:bg-hm-bg-hover transition-colors">
                    <td className="px-2 py-2.5 font-bold">{r.building}</td>
                    <td className="px-2 py-2.5">{r.room}</td>
                    <td className="px-2 py-2.5 font-bold">{r.name}</td>
                    <td className="px-2 py-2.5 text-[11px] text-hm-text-sub">{r.phone || "-"}</td>
                    <td className="px-2 py-2.5 text-[11px]">{r.moveOut ? r.moveOut.slice(2) : "-"}</td>
                    <td className={`px-2 py-2.5 text-right font-bold ${r.finalSettlement !== undefined ? (r.finalSettlement >= 0 ? 'text-hm-success' : 'text-hm-danger') : 'text-hm-text-muted'}`}>
                      {r.finalSettlement !== undefined ? (r.finalSettlement < 0 ? `-${fmt(Math.abs(r.finalSettlement))}` : fmt(r.finalSettlement)) : "-"}
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="text-[10px] font-bold px-2 py-[3px] rounded-[5px] whitespace-nowrap" style={{ background: rc.bg, color: rc.c }}>{r.reason}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
