import { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { buildings } from '@/data';
import { useIsMobile, fmt } from '@/utils';
import { matchKorean } from '@/utils/koreanSearch';
import { Card, SectionTitle, Table } from '@/components';
import { inputStyle } from '@/components/Field';

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #F3F4F6" }}>
        <div><span style={{ fontSize: 11, color: color || "#5F6577", fontWeight: bold ? 700 : 400 }}>{label}</span>{sub && <span style={{ fontSize: 9, color: "#B0B5C1", marginLeft: 6 }}>{sub}</span>}</div>
        <span style={{ fontSize: 12, fontWeight: bold ? 800 : 600, color: color || "#1A1D23" }}>{typeof value === "number" ? (value < 0 ? `-${fmt(Math.abs(value))}` : fmt(value)) : value}</span>
      </div>
    );

    // 탭 버튼
    const tabs = [
      { key: "info", label: "기본정보" },
      ...(hasSettlement ? [{ key: "settlement", label: "퇴실정산서" }] : []),
    ];

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }} onClick={() => { setSelected(null); setViewMode("info"); }}>
          <span style={{ fontSize: 20 }}>←</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#3B82F6" }}>퇴실정보 목록으로</span>
        </div>

        {/* 탭 */}
        {tabs.length > 1 && (
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setViewMode(tab.key)}
                style={{ padding: "8px 20px", borderRadius: 8, border: viewMode === tab.key ? "2px solid #3B82F6" : "1.5px solid #E0E3E9",
                  background: viewMode === tab.key ? "#EFF6FF" : "#fff", color: viewMode === tab.key ? "#2563EB" : "#5F6577",
                  fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── 기본정보 탭 ── */}
        {viewMode === "info" && (
          <>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#1A1D23" }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "#8F95A3", marginTop: 2 }}>{r.building} {r.room}호 · {r.phone || "-"}{r.roomType ? ` · ${r.roomType}` : ""}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: rc.bg, color: rc.c }}>{r.reason}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>입주일</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{r.moveIn || "-"}</div>
                </div>
                <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>만기일</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{r.expiry || "-"}</div>
                </div>
                <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>{r.reason === "재계약" ? "재계약일" : "퇴실일"}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{r.moveOut || "-"}</div>
                </div>
                <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>정산일</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{r.settlementDate || "-"}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>{depositLabel}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(r.deposit)}원</div>
                </div>
                <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>월세</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(r.rent)}원</div>
                </div>
                <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>관리비</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(r.mgmt || 0)}원</div>
                </div>
              </div>

              {/* 최종 정산 요약 */}
              {hasSettlement && (
                <div style={{ background: (r.finalSettlement! >= 0) ? "#F0FDF4" : "#FEF2F2", borderRadius: 10, padding: "14px 18px", marginBottom: 16, border: `2px solid ${(r.finalSettlement! >= 0) ? "#BBF7D0" : "#FECACA"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: (r.finalSettlement! >= 0) ? "#065F46" : "#991B1B" }}>{(r.finalSettlement! >= 0) ? "반환금액" : "추가청구"}</span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: (r.finalSettlement! >= 0) ? "#059669" : "#DC2626" }}>{r.finalSettlement! < 0 ? `-${fmt(Math.abs(r.finalSettlement!))}` : fmt(r.finalSettlement!)}<span style={{ fontSize: 12 }}>원</span></span>
                  </div>
                </div>
              )}

              {!hasSettlement && r.reason !== "재계약" && (
                <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0", marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>정산 상태</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: r.settlement === "정산완료" ? "#059669" : "#DC2626" }}>{r.settlement || "-"}</div>
                </div>
              )}

              {r.renewedAt && (
                <div style={{ padding: "10px 12px", background: "#EFF6FF", borderRadius: 8, border: "1px solid #BFDBFE", marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>재계약 처리일</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>{r.renewedAt}</div>
                </div>
              )}

              {currentTenant && (
                <div style={{ padding: "12px 14px", background: "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0", marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 4 }}>현재 임차인</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1D23" }}>{currentTenant.name} · {currentTenant.phone}</div>
                  <div style={{ fontSize: 11, color: "#5F6577", marginTop: 2 }}>입주일 {currentTenant.moveIn || "-"} · 만기 {currentTenant.expiry || "-"} · 월세 {fmt(currentTenant.rent)}원</div>
                </div>
              )}

              {/* 계약서 파일 */}
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>📎 계약서</div>
              {r.contractFiles && r.contractFiles.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {r.contractFiles.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#F8FAFC", borderRadius: 6, border: "1px solid #E8ECF0" }}>
                      <span style={{ fontSize: 12, color: "#3B82F6" }}>📄</span>
                      <span style={{ fontSize: 12, color: "#1A1D23", flex: 1 }}>{f}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "16px 0", textAlign: "center", color: "#B0B5C1", fontSize: 12 }}>첨부된 계약서가 없습니다</div>
              )}

              {/* 입주사진 */}
              {(r.moveInPhotos || []).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#059669", marginBottom: 8, paddingBottom: 6, borderBottom: "2px solid #D1FAE5" }}>🏠 입주사진 ({r.moveInPhotos!.length}장) <span style={{ fontSize: 9, color: "#8F95A3", fontWeight: 600 }}>{r.moveIn || ""}</span></div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                    {r.moveInPhotos!.map((src, pi) => (
                      <div key={pi} style={{ aspectRatio: "1", borderRadius: 6, border: "1.5px solid #BBF7D0", overflow: "hidden", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {src && src.startsWith("data:image/") && !src.includes("placeholder") ? (
                          <img src={src} alt={`입주 ${pi+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: 14 }}>🏠</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 시작 → 끝 비교: 입주체크사진 + 퇴실사진 */}
              {((r.moveInCheckPhotos || []).length > 0 || (r.moveOutPhotos || []).length > 0) && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#1A1D23", marginBottom: 10, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>📸 호실 상태 비교 (시작 → 끝)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {/* 시작: 입주체크사진 */}
                    <div style={{ border: "2px solid #FED7AA", borderRadius: 12, padding: 12, background: "#FFF7ED" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#EA580C", marginBottom: 8 }}>📋 입주체크사진 (시작) <span style={{ fontSize: 9, color: "#8F95A3", fontWeight: 600 }}>{(r.moveInCheckPhotos || []).length}장</span></div>
                      {(r.moveInCheckPhotos || []).length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                          {r.moveInCheckPhotos!.map((src, pi) => (
                            <div key={pi} style={{ aspectRatio: "1", borderRadius: 6, border: "1.5px solid #FED7AA", overflow: "hidden", background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {src && src.startsWith("data:image/") && !src.includes("placeholder") ? (
                                <img src={src} alt={`체크 ${pi+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <span style={{ fontSize: 14 }}>📋</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: "16px 0", textAlign: "center", color: "#B0B5C1", fontSize: 11 }}>사진 없음</div>
                      )}
                    </div>
                    {/* 끝: 퇴실사진 */}
                    <div style={{ border: "2px solid #FECACA", borderRadius: 12, padding: 12, background: "#FEF2F2" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", marginBottom: 8 }}>🚪 퇴실사진 (끝) <span style={{ fontSize: 9, color: "#8F95A3", fontWeight: 600 }}>{(r.moveOutPhotos || []).length}장</span></div>
                      {(r.moveOutPhotos || []).length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                          {r.moveOutPhotos!.map((src, pi) => (
                            <div key={pi} style={{ aspectRatio: "1", borderRadius: 6, border: "1.5px solid #FECACA", overflow: "hidden", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {src && src.startsWith("data:image/") && !src.includes("placeholder") ? (
                                <img src={src} alt={`퇴실 ${pi+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <span style={{ fontSize: 14 }}>🚪</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: "16px 0", textAlign: "center", color: "#B0B5C1", fontSize: 11 }}>사진 없음</div>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[...roomRecords].reverse().map((rec: Record<string, any>, i: number) => {
                      const rcs = getReasonStyle(rec.reason);
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{rec.name}</span>
                            <span style={{ fontSize: 11, color: "#5F6577", marginLeft: 8 }}>{rec.phone || ""}</span>
                            <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 2 }}>{rec.moveIn || "-"} ~ {rec.moveOut || "-"} · 월세 {fmt(rec.rent)}원</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: rcs.bg, color: rcs.c }}>{rec.reason}</span>
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
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button onClick={handleCapture} disabled={capturing}
                style={{ padding: "10px 24px", borderRadius: 8, border: "1.5px solid #3B82F6", background: "#EFF6FF", color: "#2563EB", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", opacity: capturing ? 0.5 : 1 }}>
                {capturing ? "캡처중..." : "🖨 이미지 다운로드"}
              </button>
            </div>

            {/* 정산서 본문 (캡처 대상) */}
            <Card ref={settlementRef} style={{ maxWidth: 720 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#DC2626", display: "flex", alignItems: "center", gap: 10 }}>
                    🚪 퇴실정산서
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#F3F4F6", color: "#5F6577" }}>{r.roomType || ""}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#8F95A3", marginTop: 4 }}>{r.building} {r.room}호 · {r.name} · {r.phone}</div>
                </div>
                <div style={{ padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 800,
                  background: r.reason === "만기전퇴실" ? "#FEF2F2" : "#F0FDF4",
                  color: r.reason === "만기전퇴실" ? "#DC2626" : "#059669",
                  border: `1.5px solid ${r.reason === "만기전퇴실" ? "#FECACA" : "#BBF7D0"}` }}>
                  {r.reason}
                </div>
              </div>

              {isManOff ? (
                /* 관리사무소: 간소 */
                <>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>입주자 정보</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>입주자</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12, fontWeight: 600 }}>{r.name}</div></div>
                    <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12 }}>{r.phone}</div></div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>보증금 반환</div>
                  <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "14px 18px", border: "2px solid #BBF7D0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#065F46" }}>반환금액 (보증금)</span>
                      <span style={{ fontSize: 24, fontWeight: 900, color: "#059669" }}>{fmt(r.deposit)}<span style={{ fontSize: 12 }}>원</span></span>
                    </div>
                  </div>
                </>
              ) : (
                /* 일반: 2컬럼 레이아웃 */
                <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
                  {/* Left */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>입주자 정보</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>입주자</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12, fontWeight: 600 }}>{r.name}</div></div>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12 }}>{r.phone}</div></div>
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>사용 기간</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>입주일</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12 }}>{r.moveIn || "-"}</div></div>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>만기일</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12 }}>{r.expiry || "-"}</div></div>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>퇴실일</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#FEF2F2", fontSize: 12, fontWeight: 700, color: "#DC2626", textAlign: "center" }}>{r.moveOut}</div></div>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>사용기간</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#EFF6FF", fontSize: 12, fontWeight: 700, color: "#2563EB", textAlign: "center" }}>{r.usagePeriod || (() => { if (!r.moveIn || !r.moveOut) return "-"; const a = new Date(r.moveIn), b = new Date(r.moveOut); let m = (b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth()); let d = b.getDate()-a.getDate(); if(d<0){m--;d+=new Date(b.getFullYear(),b.getMonth(),0).getDate();} return `${m}개월 ${d}일`; })()}</div></div>
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>계약 정보</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>{depositLabel}</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F0FDF4", fontSize: 12, fontWeight: 700, color: "#059669", textAlign: "right" }}>{fmt(r.deposit)}</div></div>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>월세 <span style={{ fontSize: 8, color: r.isRentPrepaid ? "#059669" : "#DC2626" }}>({r.isRentPrepaid ? "선불" : "후불"})</span></div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12, fontWeight: 600, textAlign: "right" }}>{fmt(r.rent)}</div></div>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>관리비 <span style={{ fontSize: 8, color: r.isMgmtPrepaid ? "#059669" : "#DC2626" }}>({r.isMgmtPrepaid ? "선불" : "후불"})</span></div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12, fontWeight: 600, textAlign: "right" }}>{fmt(r.mgmt || 0)}</div></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: (r.cleanFee ?? 0) > 0 ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                      {(r.cleanFee ?? 0) > 0 && <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>퇴실청소비</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#FEF2F2", fontSize: 12, fontWeight: 600, textAlign: "right", color: "#DC2626" }}>{fmt(r.cleanFee!)}</div></div>}
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>수도</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12, textAlign: "right" }}>{fmt(r.waterAmt || 0)}</div></div>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>TV/인터넷</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12, textAlign: "right" }}>{fmt(r.internetAmt || 0)}</div></div>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>만기일</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12 }}>{r.expiry || "-"}</div></div>
                    </div>

                    {/* 수기 입력 내역 */}
                    {(() => {
                      const hasManual = (r.manElec||[]).some((x: any)=>pn(x.amt)>0) || (r.manGas||[]).some((x: any)=>pn(x.amt)>0) || (r.manRepair ?? 0)>0 || (r.manWaste ?? 0)>0 || (r.manOther||[]).some((x: any)=>pn(x.amt)>0) || (r.manRestoration ?? 0)>0;
                      if (!hasManual) return null;
                      return (<>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#EA580C", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #FED7AA" }}>✏️ 수기 입력 내역</div>
                        {(r.manElec||[]).map((row: any,i: number) => pn(row.amt) > 0 && (
                          <div key={`e${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #FEF2F2" }}>
                            <span style={{ fontSize: 11, color: "#EA580C" }}>전기{row.period ? ` (${row.period})` : ` ${i+1}`}</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(pn(row.amt))}</span>
                          </div>
                        ))}
                        {(r.manGas||[]).map((row: any,i: number) => pn(row.amt) > 0 && (
                          <div key={`g${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #FEF2F2" }}>
                            <span style={{ fontSize: 11, color: "#EA580C" }}>가스{row.period ? ` (${row.period})` : ` ${i+1}`}</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(pn(row.amt))}</span>
                          </div>
                        ))}
                        {(r.manRepair ?? 0) > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #FEF2F2" }}>
                            <span style={{ fontSize: 11, color: "#EA580C" }}>수리비{r.manRepairDesc ? ` (${r.manRepairDesc})` : ""}</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(r.manRepair!)}</span>
                          </div>
                        )}
                        {(r.manWaste ?? 0) > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #FEF2F2" }}>
                            <span style={{ fontSize: 11, color: "#EA580C" }}>폐기물{r.manWasteDesc ? ` (${r.manWasteDesc})` : ""}</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(r.manWaste!)}</span>
                          </div>
                        )}
                        {(r.manOther||[]).map((row: any,i: number) => pn(row.amt) > 0 && (
                          <div key={`o${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #FEF2F2" }}>
                            <span style={{ fontSize: 11, color: "#EA580C" }}>기타{i+1}{row.desc ? ` (${row.desc})` : ""}</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(pn(row.amt))}</span>
                          </div>
                        ))}
                        {(r.manRestoration ?? 0) > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #FEF2F2" }}>
                            <span style={{ fontSize: 11, color: "#7C3AED" }}>원상복구비{r.manRestorationDesc ? ` (${r.manRestorationDesc})` : ""}</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(r.manRestoration!)}</span>
                          </div>
                        )}
                        <div style={{ height: 12 }} />
                      </>);
                    })()}
                  </div>

                  {/* Right - 정산 계산 */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>정산 내역</div>
                    <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 4 }}>기산일: {r.startDay}일 · 월 일수: {r.daysInMonth}일 · 당월 사용: {r.usedDays}일</div>

                    {/* 반환 */}
                    <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "10px 14px", marginBottom: 10, border: "1px solid #BBF7D0" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 4 }}>반환 항목</div>
                      <SRow label={depositLabel} value={r.deposit} color="#059669" bold />
                      {(r.netRent ?? 0) < 0 && <SRow label="월세 환불" sub={`${r.daysInMonth! - r.usedDays!}일분${(r.unpaidRent ?? 0) > 0 ? " · 미납반영" : ""}`} value={-r.netRent!} color="#059669" />}
                      {(r.netMgmt ?? 0) < 0 && <SRow label="관리비 환불" sub={`${r.daysInMonth! - r.usedDays!}일분${(r.unpaidMgmt ?? 0) > 0 ? " · 미납반영" : ""}`} value={-r.netMgmt!} color="#059669" />}
                      {(r.netWater ?? 0) < 0 && <SRow label="수도 환불" sub={`${r.daysInMonth! - r.usedDays!}일분${(r.unpaidWater ?? 0) > 0 ? " · 미납반영" : ""}`} value={-r.netWater!} color="#059669" />}
                      {(r.netInternet ?? 0) < 0 && <SRow label="TV/인터넷 환불" sub={`${r.daysInMonth! - r.usedDays!}일분${(r.unpaidInternet ?? 0) > 0 ? " · 미납반영" : ""}`} value={-r.netInternet!} color="#059669" />}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", marginTop: 4, borderTop: "1.5px solid #BBF7D0" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#065F46" }}>반환소계</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: "#059669" }}>{fmt(r.deposit + (r.totalRefund || 0))}</span>
                      </div>
                    </div>

                    {/* 공제 */}
                    <div style={{ background: "#FEF2F2", borderRadius: 10, padding: "10px 14px", marginBottom: 10, border: "1px solid #FECACA" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", marginBottom: 4 }}>공제 항목</div>
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
                        <div style={{ height: 1, background: "#FECACA", margin: "4px 0" }} />
                        {(r.penalty7 ?? 0) > 0 && <SRow label="7일패널티" value={r.penalty7!} color="#DC2626" />}
                        {(r.penaltyComm ?? 0) > 0 && <SRow label="중개수수료" value={r.penaltyComm!} color="#DC2626" />}
                      </>}
                      {(r.lateFee ?? 0) > 0 && <SRow label="연체수수료" sub="미납임대료 5%" value={r.lateFee!} color="#DC2626" />}
                      {(r.prevUnpaid ?? 0) > 0 && <>
                        <div style={{ height: 1, background: "#FECACA", margin: "4px 0" }} />
                        <SRow label="전월 미납금" value={r.prevUnpaid!} color="#DC2626" bold />
                      </>}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", marginTop: 4, borderTop: "1.5px solid #FECACA" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#991B1B" }}>공제소계</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: "#DC2626" }}>-{fmt(r.totalDeduct || 0)}</span>
                      </div>
                    </div>

                    {/* 최종 정산 */}
                    <div style={{ background: r.finalSettlement! >= 0 ? "#F0FDF4" : "#FEF2F2", borderRadius: 10, padding: "14px 18px", border: `2px solid ${r.finalSettlement! >= 0 ? "#BBF7D0" : "#FECACA"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: r.finalSettlement! >= 0 ? "#065F46" : "#991B1B" }}>{r.finalSettlement! >= 0 ? "반환금액" : "추가청구"}</span>
                        <span style={{ fontSize: 24, fontWeight: 900, color: r.finalSettlement! >= 0 ? "#059669" : "#DC2626" }}>{r.finalSettlement! < 0 ? `-${fmt(Math.abs(r.finalSettlement!))}` : fmt(r.finalSettlement!)}<span style={{ fontSize: 12 }}>원</span></span>
                      </div>
                    </div>

                    {r.reason === "만기전퇴실" && ((r.penalty7 ?? 0) > 0 || (r.penaltyComm ?? 0) > 0) && (
                      <div style={{ marginTop: 8, padding: "6px 10px", background: "#FEF2F2", borderRadius: 6, border: "1px solid #FECACA", fontSize: 10, color: "#DC2626", fontWeight: 600 }}>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <SectionTitle sub="">📦 퇴실정보</SectionTitle>
      </div>

      {/* Summary tab badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {reasons.map(r => (
          <button key={r} onClick={() => setFilterReason(r)}
            style={{ padding: "7px 16px", borderRadius: 8, border: filterReason === r ? `2px solid ${reasonColors[r]}` : "1px solid #E0E3E9", background: filterReason === r ? `${reasonColors[r]}10` : "#fff", color: filterReason === r ? reasonColors[r] : "#5F6577", fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
            {r} <span style={{ fontWeight: 800 }}>{reasonCounts[r]}</span>
          </button>
        ))}
      </div>

      {/* Search + Building filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 건물, 호실, 연락처 검색..."
          style={{ width: 240, padding: "8px 14px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, outline: "none", fontFamily: "inherit", background: "#F9FAFB" }} />
        <select value={filterBld} onChange={e => setFilterBld(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
          {buildingNames.map(b => <option key={b}>{b}</option>)}
        </select>
      </div>

      {/* Main Table */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 48, color: "#8F95A3" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{search || filterBld !== "전체" || filterReason !== "전체" ? "검색 결과가 없습니다" : "퇴실 이력이 없습니다"}</div>
        </Card>
      ) : (
        <Card style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E8ECF0" }}>
                {["건물명","호실","입주자","연락처","퇴실일","정산금액","사유"].map((h, i) => (
                  <th key={i} style={{ padding: "10px 8px", textAlign: i === 5 ? "right" : "left", fontSize: 11, fontWeight: 700, color: "#8F95A3", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const rc = getReasonStyle(r.reason);
                return (
                  <tr key={i} onClick={() => { setSelected(r); setViewMode("info"); }}
                    style={{ borderBottom: "1px solid #F0F2F5", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#F9FAFB"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>{r.building}</td>
                    <td style={{ padding: "10px 8px" }}>{r.room}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>{r.name}</td>
                    <td style={{ padding: "10px 8px", fontSize: 11, color: "#5F6577" }}>{r.phone || "-"}</td>
                    <td style={{ padding: "10px 8px", fontSize: 11 }}>{r.moveOut ? r.moveOut.slice(2) : "-"}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700,
                      color: r.finalSettlement !== undefined ? (r.finalSettlement >= 0 ? "#059669" : "#DC2626") : "#8F95A3" }}>
                      {r.finalSettlement !== undefined ? (r.finalSettlement < 0 ? `-${fmt(Math.abs(r.finalSettlement))}` : fmt(r.finalSettlement)) : "-"}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: rc.bg, color: rc.c, whiteSpace: "nowrap" }}>{r.reason}</span>
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
