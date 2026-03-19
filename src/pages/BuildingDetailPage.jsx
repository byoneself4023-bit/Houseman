import React, { useState, useEffect, useMemo } from 'react';
import { asItems, billingConfig, buildingFloors, roomMasterData } from '../data';

class BuildingDetailErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 24 }}>
        <div style={{ padding: 20, background: "#FEF2F2", border: "2px solid #FECACA", borderRadius: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#DC2626", marginBottom: 8 }}>페이지 렌더링 오류</div>
          <pre style={{ fontSize: 12, color: "#991B1B", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{this.state.error.message}</pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontWeight: 700, cursor: "pointer" }}>다시 시도</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}
import { getRoomType, changeRoomType, collectionAssigneeMap, staffRoles, initialStaffMembers } from '../config';
import { useLocalStorage } from '../utils/useLocalStorage';
import { modeOptions, ownerFieldCfg, housemanUsageMap, ownerFirstModes, flowMap, banks, acctTypeBg, acctTypeColor, defaultHousemanAccount } from '../config/accountConfig';
import { useIsMobile, fmt, feeLabel } from '../utils';
import { matchKorean } from '../utils/koreanSearch';
import { Card, SectionTitle, Table, StatusBadge, RoomTypeBadge, PhotoDropZone, Field } from '../components';
import { ROOM_TYPE_CFG, rtCfg } from '../components/RoomTypeBadge';
import { inputStyle } from '../components/Field';

const acctTypeLabel = { "단기": "단기", "일반임대": "일반임대", "근생": "근생", "관리사무소": "관리사무소" };

const BUILDING_TYPES = ["단기", "일반임대", "근생", "관리사무소", "기업시설관리"];

const OWNER_COLORS = [
  { bg: "#F0F4FF", border: "#BFDBFE", color: "#2563EB", label: "주" },
  { bg: "#F5F3FF", border: "#DDD6FE", color: "#7C3AED", label: "부" },
  { bg: "#FFF7ED", border: "#FED7AA", color: "#EA580C", label: "" },
  { bg: "#F0FDF4", border: "#BBF7D0", color: "#059669", label: "" },
];

const statusStyle = (status) => {
  switch (status) {
    case "공실": return { bg: "#FEF3C7", border: "#FDE68A", color: "#92400E", icon: "□" };
    case "연체": return { bg: "#FEE2E2", border: "#FECACA", color: "#991B1B", icon: "!" };
    default: return { bg: "#D1FAE5", border: "#A7F3D0", color: "#065F46", icon: "●" };
  }
};

export const BuildingDetailPage = (props) => (
  <BuildingDetailErrorBoundary>
    <BuildingDetailPageInner {...props} />
  </BuildingDetailErrorBoundary>
);

const BuildingDetailPageInner = ({ buildingName, onBack, buildingAccounts = {}, setBuildingAccounts, customBuildings = [], allBuildings = [], setAllBuildings, buildingData = {}, setBuildingData, activeTenants = [], activeVacancies = [], pastTenantsData = {} }) => {
  const isMobile = useIsMobile();
  const [staffList] = useLocalStorage("hm_staffList", initialStaffMembers);
  const [depositNames, setDepositNames] = useLocalStorage("hm_depositNames", {});
  const rawDetail = buildingFloors[buildingName];
  const bldg = allBuildings.find(b => b.name === buildingName) || customBuildings.find(b => b.name === buildingName)
    || (rawDetail ? { name: buildingName, rooms: rawDetail.floors ? Object.values(rawDetail.floors).flat().length : 0, occupied: 0, type: "단기", feeType: "pct", fee: rawDetail.fee || 0, fixedFee: 0, special: null, parkingTotal: 0 } : null);
  const customDetail = (!rawDetail && bldg?._custom && bldg._regForm) ? (() => {
    const floors = {};
    bldg._regForm.roomList.forEach(r => {
      const floorMatch = r.room.match(/^([A-Za-z]*\d*?)(\d{2})$/);
      const floorKey = floorMatch ? floorMatch[1] : r.room.slice(0, -2) || "1";
      if (!floors[floorKey]) floors[floorKey] = [];
      floors[floorKey].push(r.room);
    });
    return { floors, owner: bldg._regForm.ownerName || "", ownerPhone: bldg._regForm.ownerPhone || "", start: bldg._regForm.startDate || "" };
  })() : null;
  const detail = rawDetail || customDetail;

  // ── 영속 데이터: buildingData[buildingName] 에서 읽기/쓰기 ──
  const saved = buildingData[buildingName] || {};
  const updateBD = (patch) => setBuildingData && setBuildingData(prev => ({
    ...prev,
    [buildingName]: { ...(prev[buildingName] || {}), ...patch }
  }));

  // 건물유형 (영속)
  const initTypes = () => {
    if (saved.types && Array.isArray(saved.types) && saved.types.length > 0) return saved.types;
    const raw = bldg?.type || "단기";
    const validTypes = BUILDING_TYPES;
    const typeMap = { "주택": "단기" };
    return raw.split("+").map(s => s.trim()).map(t => typeMap[t] || (validTypes.includes(t) ? t : "단기"));
  };
  const [detailBuildingTypes, _setDetailBuildingTypes] = useState(initTypes);
  const setDetailBuildingTypes = (v) => { _setDetailBuildingTypes(v); updateBD({ types: v }); };

  // 기본정보 필드 (영속)
  const [bdStartDate, _setBdStartDate] = useState(saved.startDate ?? detail?.start ?? "");
  const setBdStartDate = (v) => { _setBdStartDate(v); updateBD({ startDate: v }); };
  const [bdEntrancePw, _setBdEntrancePw] = useState(saved.entrancePw ?? "");
  const setBdEntrancePw = (v) => { _setBdEntrancePw(v); updateBD({ entrancePw: v }); };
  const [bdAddress, _setBdAddress] = useState(saved.address ?? detail?.address ?? "");
  const setBdAddress = (v) => { _setBdAddress(v); updateBD({ address: v }); };
  // 건물 상세 최초 진입 시 주소를 buildingData에 저장 (홈페이지 등에서 참조)
  useEffect(() => { if (!saved.address && bdAddress) updateBD({ address: bdAddress }); }, []);
  const [bdRoadAddress, _setBdRoadAddress] = useState(saved.roadAddress ?? "");
  const setBdRoadAddress = (v) => { _setBdRoadAddress(v); updateBD({ roadAddress: v }); };
  const [bdCctvCount, _setBdCctvCount] = useState(saved.cctvCount ?? "");
  const setBdCctvCount = (v) => { _setBdCctvCount(v); updateBD({ cctvCount: v }); };
  const [bdParkingTotal, _setBdParkingTotal] = useState(saved.parkingTotal ?? bldg?.parkingTotal ?? "");
  const setBdParkingTotal = (v) => { _setBdParkingTotal(v); updateBD({ parkingTotal: v }); };

  // 건물주 정보 (영속) - 동적 배열 (최대 4명)
  const defaultOwners = [{ name: detail?.owner || "", ssn: "", phone: detail?.ownerPhone || "", address: "", settlement: "" }];
  const [bdOwners, _setBdOwners] = useState(saved.owners ?? defaultOwners);
  const setBdOwners = (v) => { _setBdOwners(v); updateBD({ owners: v }); };
  const setBdOwnerField = (idx, field, value) => {
    const updated = bdOwners.map((o, i) => i === idx ? { ...o, [field]: value } : o);
    setBdOwners(updated);
  };
  const addBdOwner = () => { if (bdOwners.length < 4) setBdOwners([...bdOwners, { name: "", ssn: "", phone: "", address: "", settlement: "" }]); };
  const removeBdOwner = (idx) => { if (bdOwners.length > 1) setBdOwners(bdOwners.filter((_, i) => i !== idx)); };
  const [emails, _setEmails] = useState(saved.emails ?? [""]);
  const setEmails = (v) => { _setEmails(v); updateBD({ emails: v }); };

  // 담당자&계약조건 (영속)
  const [detailFeeType, _setDetailFeeType] = useState(saved.feeType ?? bldg?.feeType ?? "pct");
  const setDetailFeeType = (v) => { _setDetailFeeType(v); updateBD({ feeType: v }); };
  const [bdFeeValue, _setBdFeeValue] = useState(saved.feeValue ?? (bldg?.feeType === "pct" ? (bldg.fee * 100) + "%" : bldg?.fixedFee ? bldg.fixedFee.toLocaleString() : ""));
  const setBdFeeValue = (v) => { _setBdFeeValue(v); updateBD({ feeValue: v }); };
  const [bdPenaltyOwner, _setBdPenaltyOwner] = useState(saved.penaltyOwner ?? "하우스맨");
  const setBdPenaltyOwner = (v) => { _setBdPenaltyOwner(v); updateBD({ penaltyOwner: v }); };
  // 정산일 (최대 3회, 각각 날짜)
  const [bdSettlementDates, _setBdSettlementDates] = useState(saved.settlementDates ?? ["말일"]);
  const setBdSettlementDates = (v) => { _setBdSettlementDates(v); updateBD({ settlementDates: v }); };
  const addSettlementDate = () => { if (bdSettlementDates.length < 3) setBdSettlementDates([...bdSettlementDates, "말일"]); };
  const removeSettlementDate = (idx) => { if (bdSettlementDates.length > 1) setBdSettlementDates(bdSettlementDates.filter((_, i) => i !== idx)); };
  const updateSettlementDate = (idx, val) => { const u = [...bdSettlementDates]; u[idx] = val; setBdSettlementDates(u); };
  const [bdVatType, _setBdVatType] = useState(saved.vatType ?? "포함");
  const setBdVatType = (v) => { _setBdVatType(v); updateBD({ vatType: v }); };
  const [bdMgmtType, _setBdMgmtType] = useState(saved.mgmtType ?? "변동관리비");
  const setBdMgmtType = (v) => { _setBdMgmtType(v); updateBD({ mgmtType: v }); };
  const [bdStandardLease, _setBdStandardLease] = useState(saved.standardLease ?? "사용");
  const setBdStandardLease = (v) => { _setBdStandardLease(v); updateBD({ standardLease: v }); };
  const [bdVisitCycle, _setBdVisitCycle] = useState(saved.visitCycle ?? "월1회");
  const setBdVisitCycle = (v) => { _setBdVisitCycle(v); updateBD({ visitCycle: v }); };
  const [buildingMgrs, _setBuildingMgrs] = useState(saved.managers ?? { internal: "", external: "", collection: "", contract: "", general: "" });
  const setBuildingMgrs = (v) => { _setBuildingMgrs(v); updateBD({ managers: v }); };
  const setBldgMgr = (roleId, val) => { const u = { ...buildingMgrs, [roleId]: val }; setBuildingMgrs(u); };

  // 협력업체 (영속)
  const emptyVendorData = { company: "", phone: "", contact: "", contactPhone: "", manager: "", managerPhone: "", managerNote: "" };
  const [vendorEnabled, _setVendorEnabled] = useState(saved.vendorEnabled ?? { fire: false, elevator: false, mechElevator: false, cleaning: false, disinfect: false, custom1: false, custom2: false });
  const setVendorEnabled = (v) => { _setVendorEnabled(v); updateBD({ vendorEnabled: v }); };
  const toggleDetailVendor = (key) => { const u = { ...vendorEnabled, [key]: !vendorEnabled[key] }; setVendorEnabled(u); };
  const [fireMode, _setFireMode] = useState(saved.fireMode ?? "direct");
  const setFireMode = (v) => { _setFireMode(v); updateBD({ fireMode: v }); };
  const [bdVendors, _setBdVendors] = useState(saved.vendors ?? { fire: { ...emptyVendorData }, elevator: { ...emptyVendorData }, mechElevator: { ...emptyVendorData }, cleaning: { ...emptyVendorData }, disinfect: { ...emptyVendorData }, custom1: { label: "", ...emptyVendorData }, custom2: { label: "", ...emptyVendorData } });
  const setBdVendor = (key, field, value) => { const u = { ...bdVendors, [key]: { ...bdVendors[key], [field]: value } }; _setBdVendors(u); updateBD({ vendors: u }); };
  const [bdApprovalDate, _setBdApprovalDate] = useState(saved.approvalDate ?? "");
  const setBdApprovalDate = (v) => { _setBdApprovalDate(v); updateBD({ approvalDate: v }); };

  // 건물 특이사항 (영속)
  const [bdNotes, _setBdNotes] = useState(saved.notes ?? "");
  const setBdNotes = (v) => { _setBdNotes(v); updateBD({ notes: v }); };

  // 시설 체크리스트 (영속)
  const DEFAULT_CHECKLIST = ["복도 조명", "옥상 배수구", "CCTV 작동", "소방시설", "주차장"];
  const [bdFacilityChecklist, _setBdFacilityChecklist] = useState(saved.facilityChecklist ?? DEFAULT_CHECKLIST);
  const setBdFacilityChecklist = (v) => { _setBdFacilityChecklist(v); updateBD({ facilityChecklist: v }); };
  const [newChecklistItem, setNewChecklistItem] = useState("");

  // UI-only state (비영속)
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomEditMode, setRoomEditMode] = useState(false);
  const [roomDeleteStep, setRoomDeleteStep] = useState(0);
  const [roomTab, setRoomTab] = useState("info");
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [addRoomFloor, setAddRoomFloor] = useState("");
  const [addRoomNum, setAddRoomNum] = useState("");
  const [sec1Edit, setSec1Edit] = useState(false);
  const [sec2Edit, setSec2Edit] = useState(false);
  const [secAcctEdit, setSecAcctEdit] = useState(false);
  const [photoViewTarget, setPhotoViewTarget] = useState(null);
  const [sec3Edit, setSec3Edit] = useState(false);
  const [sec4Edit, setSec4Edit] = useState(false);
  const [sec1Open, setSec1Open] = useState(true);
  const [sec2Open, setSec2Open] = useState(false);
  const [sec3Open, setSec3Open] = useState(false);
  const [sec4Open, setSec4Open] = useState(false);
  const [sec5Open, setSec5Open] = useState(false);
  const [sec6Open, setSec6Open] = useState(false);
  const [secAcctOpen, setSecAcctOpen] = useState(false);
  const [bldgAcctType, setBldgAcctType] = useState("단기");
  const [notesEdit, setNotesEdit] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);
  const [showDetailPreview, setShowDetailPreview] = useState(false);

  // useMemo hooks MUST be called before any conditional return (React Rules of Hooks)
  const bldgTenants = useMemo(() => activeTenants.filter(t => t.building === buildingName), [activeTenants, buildingName]);
  const bldgVacancies = useMemo(() => activeVacancies.filter(v => v.building === buildingName), [activeVacancies, buildingName]);
  const bldgAS = useMemo(() => asItems.filter(a => a.building === buildingName), [buildingName]);
  const overdueCount = useMemo(() => bldgTenants.filter(t => t.overdue > 0).length, [bldgTenants]);
  const totalOverdue = useMemo(() => bldgTenants.reduce((s, t) => s + t.overdue, 0), [bldgTenants]);
  const allRooms = useMemo(() => detail?.floors ? Object.values(detail.floors).flat() : [], [detail]);
  const typeCounts = useMemo(() => {
    const counts = { "단기": 0, "일반임대": 0, "근생": 0, "관리사무소": 0 };
    allRooms.forEach(r => { const rt = getRoomType(buildingName, r); if (counts[rt] !== undefined) counts[rt]++; });
    return counts;
  }, [allRooms, buildingName]);

  if (!bldg || !detail) return <div>건물 정보를 찾을 수 없습니다.</div>;

  const getRoomStatus = (room) => {
    const t = bldgTenants.find(x => x.room === room);
    if (t) return { status: t.status, name: t.name, overdue: t.overdue };
    const v = bldgVacancies.find(x => x.room === room);
    if (v) return { status: "공실", name: "", type: v.type, days: v.days };
    return { status: "공실", name: "", overdue: 0 };
  };

  const floorKeys = Object.keys(detail.floors).reverse();

  return (
    <div>
      {/* Header with Back */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: bldg.special ? 12 : 24 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A1D23", letterSpacing: "-0.02em" }}>{buildingName}</h1>
            {bldg.special && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 5, background: bldg.special === "무리한 요구" ? "#FEF2F2" : "#FFF7ED", color: bldg.special === "무리한 요구" ? "#DC2626" : "#EA580C", border: `1px solid ${bldg.special === "무리한 요구" ? "#FECACA" : "#FED7AA"}` }}>
                ⚠ 특별관리 · {bldg.special}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "#8F95A3", marginTop: 2 }}>
            {detail.owner && `건물주: ${detail.owner}`}{feeLabel(bldg) && ` · ${feeLabel(bldg)}`}{detail.start && ` · 관리시작 ${detail.start}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowDetailPreview(true)} style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid #2563EB", background: "#EFF6FF", color: "#2563EB", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>📋 미리보기</button>
          <button onClick={() => setDeleteStep(1)} style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>🗑 삭제</button>
        </div>
      </div>

      {/* Special Management Alert */}
      {bldg.special && (
        <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 10, background: bldg.special === "무리한 요구" ? "#FEF2F2" : "#FFF7ED", border: `1.5px solid ${bldg.special === "무리한 요구" ? "#FECACA" : "#FED7AA"}`, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: bldg.special === "무리한 요구" ? "#991B1B" : "#92400E", marginBottom: 4 }}>특별관리 건물 · {bldg.special}</div>
            <div style={{ fontSize: 12, color: bldg.special === "무리한 요구" ? "#B91C1C" : "#B45309", lineHeight: 1.6 }}>{bldg.specialNote}</div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10, marginBottom: 8 }}>
        {[
          { label: "전체", value: bldg.rooms, unit: "실", color: "#3B82F6" },
          { label: "입주", value: bldg.occupied, unit: "실", color: "#10B981" },
          { label: "공실", value: bldgVacancies.length, unit: "실", color: "#F59E0B" },
          { label: "연체", value: overdueCount, unit: "건", color: "#EF4444" },
        ].map((s, i) => (
          <Card key={i}>
            <div style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}<span style={{ fontSize: 11, fontWeight: 500, color: "#B0B5C1" }}> {s.unit}</span></div>
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
        <span style={{ fontSize: 11, color: "#8F95A3", fontWeight: 600 }}>유형별:</span>
        {Object.entries(typeCounts).filter(([,v]) => v > 0).map(([t, v]) => (
          <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: rtCfg(t).bg, color: rtCfg(t).c }}>{t} {v}</span>
        ))}
      </div>

      {/* ── Section 1: 기본 정보 ── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sec1Open ? 12 : 0 }}>
          <div onClick={() => setSec1Open(!sec1Open)} style={{ cursor: "pointer", flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>📋 기본 정보</div>
            <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>건물 유형 · 주소 · 시설 · 관리 시작일</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sec1Open && (sec1Edit ? (
              <>
                <button onClick={() => setSec1Edit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                <button onClick={() => setSec1Edit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>💾 저장</button>
              </>
            ) : (
              <button onClick={() => setSec1Edit(true)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✏️ 수정</button>
            ))}
            <span onClick={() => setSec1Open(!sec1Open)} style={{ fontSize: 14, color: "#8F95A3", cursor: "pointer", transition: "transform 0.2s", transform: sec1Open ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
          </div>
        </div>
        {sec1Open && <div style={{ pointerEvents: sec1Edit ? "auto" : "none", opacity: sec1Edit ? 1 : 0.7, transition: "opacity 0.2s" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>건물 유형 (최대 3개)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {detailBuildingTypes.map((t, ti) => {
                  const acctKey = t === "기업시설관리" ? "관리사무소" : t;
                  return (
                    <div key={ti} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <select value={t} onChange={e => { const updated = [...detailBuildingTypes]; updated[ti] = e.target.value; setDetailBuildingTypes(updated); }}
                        style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", background: acctTypeBg[acctKey] || "#F3F4F6", color: acctTypeColor[acctKey] || "#5F6577", borderColor: (acctTypeColor[acctKey] || "#E0E3E9") + "60" }}>
                        {BUILDING_TYPES.map(bt => (
                          <option key={bt} value={bt} disabled={bt !== t && detailBuildingTypes.includes(bt)}>{bt === "일반임대" ? "일반임대(주택)" : bt}</option>
                        ))}
                      </select>
                      {detailBuildingTypes.length > 1 && (
                        <button onClick={() => setDetailBuildingTypes(detailBuildingTypes.filter((_, i) => i !== ti))}
                          style={{ width: 20, height: 20, borderRadius: 5, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontFamily: "inherit" }}>✕</button>
                      )}
                    </div>
                  );
                })}
                {detailBuildingTypes.length < 3 && (
                  <button onClick={() => { const remaining = BUILDING_TYPES.filter(bt => !detailBuildingTypes.includes(bt)); if (remaining.length > 0) setDetailBuildingTypes([...detailBuildingTypes, remaining[0]]); }}
                    style={{ padding: "5px 12px", borderRadius: 6, border: "1.5px dashed #3B82F6", background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    ＋ 유형 추가
                  </button>
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>관리시작일</div>
              <input value={bdStartDate} onChange={e => setBdStartDate(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>🔑 현관 비밀번호</div>
              <input value={bdEntrancePw} onChange={e => setBdEntrancePw(e.target.value)} placeholder="비밀번호" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, fontFamily: "monospace", letterSpacing: 1 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>주소</div>
              <input value={bdAddress} onChange={e => setBdAddress(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>도로명 주소</div>
              <input value={bdRoadAddress} onChange={e => setBdRoadAddress(e.target.value)} placeholder="도로명 주소" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>시설</div>
              <div style={{ display: "flex", gap: 8, padding: "6px 0", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#3D4251" }}>CCTV</span>
                <input type="number" min="0" value={bdCctvCount} onChange={e => setBdCctvCount(e.target.value)} placeholder="0" style={{ ...inputStyle, width: 44, padding: "4px 6px", fontSize: 10, textAlign: "center" }} />
                <span style={{ fontSize: 9, color: "#8F95A3" }}>대</span>
                <span style={{ fontSize: 10, color: "#3D4251", marginLeft: 6 }}>건물주차총대수</span>
                <input type="number" min="0" value={bdParkingTotal} onChange={e => setBdParkingTotal(e.target.value)} placeholder="0" style={{ ...inputStyle, width: 44, padding: "4px 6px", fontSize: 10, textAlign: "center" }} />
                <span style={{ fontSize: 9, color: "#8F95A3" }}>대</span>
              </div>
            </div>
          </div>
        </div>}
      </Card>

      {/* ── Section 2: 건물주 정보 ── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sec2Open ? 12 : 0 }}>
          <div onClick={() => setSec2Open(!sec2Open)} style={{ cursor: "pointer", flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>👤 건물주 정보</div>
            <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>{`건물주 ${bdOwners.length}명 · 최대 4명`}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sec2Open && (sec2Edit ? (
              <>
                <button onClick={() => setSec2Edit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                <button onClick={() => setSec2Edit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>💾 저장</button>
              </>
            ) : (
              <button onClick={() => setSec2Edit(true)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✏️ 수정</button>
            ))}
            <span onClick={() => setSec2Open(!sec2Open)} style={{ fontSize: 14, color: "#8F95A3", cursor: "pointer", transition: "transform 0.2s", transform: sec2Open ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
          </div>
        </div>
        {sec2Open && <div style={{ pointerEvents: sec2Edit ? "auto" : "none", opacity: sec2Edit ? 1 : 0.7, transition: "opacity 0.2s" }}>
          {(() => {
            return bdOwners.map((ow, oi) => {
              const c = OWNER_COLORS[oi] || OWNER_COLORS[0];
              return (
                <div key={oi} style={{ padding: "10px 12px", background: c.bg, borderRadius: 8, border: `1px solid ${c.border}`, marginBottom: oi < bdOwners.length - 1 ? 10 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: c.color }}>건물주 {oi + 1}{c.label ? ` (${c.label})` : ""}</span>
                      {oi === 0 && bdOwners.length < 4 && (
                        <button onClick={addBdOwner}
                          style={{ padding: "2px 10px", borderRadius: 5, border: `1.5px dashed ${c.color}`, background: "transparent", color: c.color, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>＋ 건물주 추가</button>
                      )}
                    </div>
                    {oi > 0 && (
                      <button onClick={() => removeBdOwner(oi)}
                        style={{ padding: "2px 8px", borderRadius: 5, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✕ 삭제</button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                    <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>이름</div><input value={ow.name} onChange={e => setBdOwnerField(oi, "name", e.target.value)} placeholder="홍길동" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                    <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>주민등록번호</div><input value={ow.ssn} onChange={e => setBdOwnerField(oi, "ssn", e.target.value)} placeholder="000000-0000000" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} /></div>
                    <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>전화번호</div><input value={ow.phone} onChange={e => setBdOwnerField(oi, "phone", e.target.value)} placeholder="010-0000-0000" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                  </div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>주소</div><input value={ow.address} onChange={e => setBdOwnerField(oi, "address", e.target.value)} placeholder="건물주 주소" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                  <div style={{ marginTop: 6 }}><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>정산계좌</div><input value={ow.settlement || ""} onChange={e => setBdOwnerField(oi, "settlement", e.target.value)} placeholder="은행명 + 계좌번호 + 예금주" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                </div>
              );
            });
          })()}
        </div>}
      </Card>

      {/* ── 건물 계좌 정보 & 계약 문자 ── */}
      {(() => {
        const detailAcctTypes = detailBuildingTypes.map(t => t === "기업시설관리" ? "관리사무소" : t);
        const bldgAccts = buildingAccounts[buildingName] || { mode1: "", housemanAccount1: defaultHousemanAccount, ownerAccounts1: {}, mode2: "", housemanAccount2: defaultHousemanAccount, ownerAccounts2: {}, mode3: "", housemanAccount3: defaultHousemanAccount, ownerAccounts3: {} };
        const updateBldgAcct = (patch) => setBuildingAccounts && setBuildingAccounts(prev => ({ ...prev, [buildingName]: { ...bldgAccts, ...patch } }));
        const contractMsg = saved.contractMsg || "";
        return (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: secAcctOpen ? 12 : 0 }}>
              <div onClick={() => setSecAcctOpen(!secAcctOpen)} style={{ cursor: "pointer", flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>🏦 건물 계좌 정보 & 계약 문자</div>
                <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>계좌: 건물유형({detailBuildingTypes.join(" + ")})에서 자동 반영 · 계약 문자: 계약 시 발송할 문구</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {secAcctOpen && (secAcctEdit ? (
                  <>
                    <button onClick={() => setSecAcctEdit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                    <button onClick={() => setSecAcctEdit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>💾 저장</button>
                  </>
                ) : (
                  <button onClick={() => setSecAcctEdit(true)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✏️ 수정</button>
                ))}
                <span onClick={() => setSecAcctOpen(!secAcctOpen)} style={{ fontSize: 14, color: "#8F95A3", cursor: "pointer", transition: "transform 0.2s", transform: secAcctOpen ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
              </div>
            </div>
            {secAcctOpen && <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              {/* 왼쪽: 건물 계좌 정보 */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#2563EB", marginBottom: 10, padding: "6px 10px", background: "#EFF6FF", borderRadius: 6, border: "1px solid #BFDBFE" }}>🏦 건물 계좌 정보</div>
                <div style={{ pointerEvents: secAcctEdit ? "auto" : "none", opacity: secAcctEdit ? 1 : 0.7, transition: "opacity 0.2s" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {detailAcctTypes.map((aType, ai) => {
                      const suffix = String(ai + 1);
                      const modeKey = `mode${suffix}`;
                      const hmKey = `housemanAccount${suffix}`;
                      const ownerKey = `ownerAccounts${suffix}`;
                      const curOptions = modeOptions[aType] || [];
                      const curMode = curOptions.find(o => o.id === bldgAccts[modeKey]) ? bldgAccts[modeKey] : "";
                      const curOwnerFields = ownerFieldCfg[curMode] || [];
                      const curHmUsage = housemanUsageMap[curMode];
                      return (
                        <div key={aType} style={{ padding: "10px 12px", background: acctTypeBg[aType], borderRadius: 8, border: `1.5px solid ${acctTypeColor[aType]}40` }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: acctTypeColor[aType], marginBottom: 8 }}>{aType}</div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: curMode ? 8 : 0 }}>
                            {curOptions.map(opt => (
                              <button key={opt.id} onClick={() => updateBldgAcct({ [modeKey]: opt.id, [ownerKey]: {} })}
                                style={{ padding: "5px 10px", borderRadius: 6, border: curMode === opt.id ? "1.5px solid #F59E0B" : "1px solid #E0E3E9", background: curMode === opt.id ? "#FEF3C7" : "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: curMode === opt.id ? "#92400E" : "#5F6577" }}
                                title={opt.desc}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          {curMode && (() => {
                            const hmSection = curHmUsage && (
                              <div key="hm" style={{ padding: "8px 10px", background: "#F0F4FF", borderRadius: 6, border: "1px solid #BFDBFE" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: "#2563EB", marginBottom: 4 }}>🏗️ 하우스맨 계좌 <span style={{ color: "#8F95A3", fontWeight: 500 }}>({curHmUsage})</span></div>
                                <input value={bldgAccts[hmKey]} onChange={e => updateBldgAcct({ [hmKey]: e.target.value })}
                                  style={{ ...inputStyle, padding: "6px 10px", fontSize: 11, width: "100%", fontFamily: "monospace" }} />
                              </div>
                            );
                            const ownerSection = curOwnerFields.length > 0 && (
                              <div key="owner" style={{ padding: "8px 10px", background: "#FFF7ED", borderRadius: 6, border: "1px solid #FED7AA" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>👤 건물주 계좌</div>
                                {curOwnerFields.map(f => (
                                  <div key={f.key} style={{ marginBottom: 4 }}>
                                    <div style={{ fontSize: 8, fontWeight: 700, color: "#EA580C", marginBottom: 2 }}>{f.label}</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 70px", gap: 4 }}>
                                      <select value={(bldgAccts[ownerKey] || {})[f.key + "_bank"] || ""} onChange={e => updateBldgAcct({ [ownerKey]: { ...bldgAccts[ownerKey], [f.key + "_bank"]: e.target.value } })}
                                        style={{ ...inputStyle, padding: "5px 6px", fontSize: 10, cursor: "pointer" }}>
                                        <option value="">은행</option>
                                        {banks.map(b => <option key={b} value={b}>{b}</option>)}
                                      </select>
                                      <input value={(bldgAccts[ownerKey] || {})[f.key] || ""} onChange={e => updateBldgAcct({ [ownerKey]: { ...bldgAccts[ownerKey], [f.key]: e.target.value } })}
                                        placeholder="계좌번호" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} />
                                      <input value={(bldgAccts[ownerKey] || {})[f.key + "_holder"] || ""} onChange={e => updateBldgAcct({ [ownerKey]: { ...bldgAccts[ownerKey], [f.key + "_holder"]: e.target.value } })}
                                        placeholder="예금주" style={{ ...inputStyle, padding: "5px 8px", fontSize: 10 }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {ownerFirstModes[curMode] ? <>{ownerSection}{hmSection}</> : <>{hmSection}{ownerSection}</>}
                                <div style={{ fontSize: 10, color: "#5F6577", padding: "4px 0" }}>💡 {flowMap[curMode]}</div>
                                {/* 예치금 보관 선택: 단기 + 하우스맨 계좌 1개일 때만 */}
                                {aType === "단기" && curMode === "houseman" && (
                                  <div style={{ marginTop: 6, padding: "8px 10px", background: "#fff", borderRadius: 6, border: "1px solid #E5E7EB" }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: "#374151", marginBottom: 6 }}>예치금 보관</div>
                                    <div style={{ display: "flex", gap: 4 }}>
                                      {[{ id: "hm", label: "하우스맨 보관" }, { id: "owner", label: "건물주 보관" }].map(opt => {
                                        const cur = bldgAccts.depositHolder || "hm";
                                        return (
                                          <button key={opt.id} onClick={() => updateBldgAcct({ depositHolder: opt.id })}
                                            style={{ padding: "5px 12px", borderRadius: 6, border: cur === opt.id ? "1.5px solid #3B82F6" : "1px solid #E0E3E9", background: cur === opt.id ? "#EFF6FF" : "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: cur === opt.id ? "#2563EB" : "#5F6577" }}>
                                            {opt.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 4 }}>
                                      {(bldgAccts.depositHolder || "hm") === "hm" ? "퇴실 시 하우스맨에서 임차인에게 직접 반환" : "퇴실 시 건물주에게 반환 요청 후 임차인에게 반환"}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 입주금 계산식 */}
                {(() => {
                  const calcTypes = detailAcctTypes.filter(t => ["단기", "일반임대", "근생"].includes(t));
                  if (calcTypes.length === 0) return null;
                  const calcType = saved.calcType && calcTypes.includes(saved.calcType) ? saved.calcType : calcTypes[0];
                  const calcIdx = detailAcctTypes.indexOf(calcType);
                  const suffix = String(calcIdx + 1);
                  const curMode = bldgAccts[`mode${suffix}`] || "";
                  // 계좌 1개 모드 판별
                  const isSingleAcct = ["houseman", "hm_owner1", "gs1"].includes(curMode);
                  return (
                    <div style={{ marginTop: 14, padding: "12px 14px", background: "#FFFBEB", borderRadius: 8, border: "1.5px solid #FDE68A" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#92400E" }}>🧮 입주금 계산식</div>
                        {calcTypes.length > 1 && (
                          <div style={{ display: "flex", gap: 4 }}>
                            {calcTypes.map(ct => (
                              <button key={ct} onClick={() => updateBD({ calcType: ct })}
                                style={{ padding: "3px 10px", borderRadius: 5, border: calcType === ct ? "1.5px solid #F59E0B" : "1px solid #E0E3E9", background: calcType === ct ? "#FEF3C7" : "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: calcType === ct ? "#92400E" : "#8F95A3" }}>
                                {ct}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {calcType === "단기" ? (
                        isSingleAcct || !curMode ? (
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23", lineHeight: 1.8 }}>
                            <span style={{ color: "#DC2626", fontWeight: 800 }}>입주금 총합</span> = 보증금(예치금) + 월세(임대료) + 관리비 + 수도 + 인터넷TV
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: "#8F95A3", padding: "8px 0" }}>
                            계좌 2개/3개 방식의 계산식은 추후 지원 예정입니다.
                          </div>
                        )
                      ) : (
                        <div style={{ fontSize: 11, color: "#8F95A3", padding: "8px 0" }}>
                          {calcType} 유형의 입주금 계산식은 추후 지원 예정입니다.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              {/* 오른쪽: 계약 문자 */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#059669", marginBottom: 10, padding: "6px 10px", background: "#F0FDF4", borderRadius: 6, border: "1px solid #BBF7D0" }}>📩 계약 문자</div>
                <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 8 }}>계약 체결 시 임차인에게 발송할 안내 문자를 입력하세요.</div>
                <textarea
                  value={contractMsg}
                  onChange={e => updateBD({ contractMsg: e.target.value })}
                  placeholder={"예시)\n안녕하세요, " + buildingName + " 입니다.\n계약이 완료되었습니다.\n\n입주일: \n보증금: \n월세: \n관리비: \n\n입금계좌: \n\n감사합니다."}
                  style={{ ...inputStyle, width: "100%", minHeight: 280, padding: "12px 14px", fontSize: 12, lineHeight: 1.7, resize: "vertical", background: "#fff", fontFamily: "inherit" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
                  <button onClick={() => {
                    if (contractMsg) navigator.clipboard.writeText(contractMsg).then(() => alert("복사되었습니다"));
                  }}
                    style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #BBF7D0", background: "#F0FDF4", color: "#059669", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    📋 복사
                  </button>
                </div>
              </div>
            </div>}
          </Card>
        );
      })()}

      {/* ── Section 3: 담당자 & 계약 조건 ── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sec3Open ? 12 : 0 }}>
          <div onClick={() => setSec3Open(!sec3Open)} style={{ cursor: "pointer", flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>🏢 담당자 & 계약 조건</div>
            <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>역할별 담당자 · 수수료 · 정산계좌 · 이메일</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sec3Open && (sec3Edit ? (
              <>
                <button onClick={() => setSec3Edit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                <button onClick={() => setSec3Edit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>💾 저장</button>
              </>
            ) : (
              <button onClick={() => setSec3Edit(true)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✏️ 수정</button>
            ))}
            <span onClick={() => setSec3Open(!sec3Open)} style={{ fontSize: 14, color: "#8F95A3", cursor: "pointer", transition: "transform 0.2s", transform: sec3Open ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
          </div>
        </div>
        {sec3Open && <div style={{ pointerEvents: sec3Edit ? "auto" : "none", opacity: sec3Edit ? 1 : 0.7, transition: "opacity 0.2s" }}>
          {/* 담당자 배정 */}
          <div style={{ padding: "8px 12px", background: "#F0F4FF", borderRadius: 8, marginBottom: 12, border: "1px solid #BFDBFE" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#2563EB", marginBottom: 6 }}>👤 담당자 배정</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 6 }}>
              {staffRoles.map((d, i) => (
                <div key={i}>
                  <div style={{ fontSize: 9, color: d.color, fontWeight: 700, marginBottom: 2 }}>{d.icon} {d.label}</div>
                  <select value={buildingMgrs[d.id] || ""} onChange={e => setBldgMgr(d.id, e.target.value)} style={{ ...inputStyle, padding: "5px 8px", fontSize: 10, cursor: "pointer" }}>
                    <option value="">선택</option>
                    {staffList.filter(s => s.roles.includes(d.id)).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
          {/* 수수료 & 계약조건 */}
          <div style={{ display: "grid", gridTemplateColumns: detailBuildingTypes.includes("단기") ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>수수료 유형</div>
              <select value={detailFeeType} onChange={e => setDetailFeeType(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>
                <option value="pct">수수료율 (%)</option>
                <option value="fixed">정액제 (원)</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>{detailFeeType === "pct" ? "수수료율" : "정액 금액"}</div>
              <input value={bdFeeValue} onChange={e => setBdFeeValue(e.target.value)} placeholder={detailFeeType === "pct" ? "5%" : "1,500,000"} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, textAlign: "right" }} />
            </div>
            {detailBuildingTypes.includes("단기") && <div>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>7일패널티 소유</div>
              <select value={bdPenaltyOwner} onChange={e => setBdPenaltyOwner(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>
                {["건물주", "하우스맨", "해당없음"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>}
            <div>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부가가치세</div>
              <select value={bdVatType} onChange={e => setBdVatType(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>
                {["포함", "별도", "없음"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          {/* 정산일 */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: "#8F95A3" }}>정산일 ({bdSettlementDates.length}회/월)</span>
              {bdSettlementDates.length < 3 && (
                <button onClick={addSettlementDate} style={{ fontSize: 9, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>+ 추가</button>
              )}
            </div>
            {detailBuildingTypes.includes("근생") && !detailBuildingTypes.includes("단기") && !detailBuildingTypes.includes("일반임대") ? (
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <div style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, background: "#F3F4F6", color: "#6B7280", flex: 1 }}>정산기간: 1일 ~ 말일 (고정)</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#8F95A3", minWidth: 50 }}>정산일</span>
                  <select value={bdSettlementDates[0] === "5" || bdSettlementDates[0] === 5 ? "5" : "1"} onChange={e => setBdSettlementDates([e.target.value])} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer", flex: 1 }}>
                    <option value="1">매월 1일</option>
                    <option value="5">매월 5일</option>
                  </select>
                  <span style={{ fontSize: 9, color: "#F59E0B", fontWeight: 600, whiteSpace: "nowrap" }}>* 토/일/공휴일 → 다음 영업일</span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {bdSettlementDates.map((d, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#8F95A3", minWidth: 30, fontWeight: 600 }}>{i + 1}차</span>
                    <select value={d} onChange={e => updateSettlementDate(i, e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer", flex: 1 }}>
                      {[...Array(28).keys()].map(n => <option key={n + 1} value={String(n + 1)}>{n + 1}일</option>)}
                      <option value="말일">말일</option>
                    </select>
                    {bdSettlementDates.length > 1 && (
                      <button onClick={() => removeSettlementDate(i)} style={{ padding: "2px 8px", background: "none", border: "1px solid #FECACA", borderRadius: 4, color: "#DC2626", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* 관리비 유형 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>관리비 유형</div>
              {detailBuildingTypes.includes("단기") && !detailBuildingTypes.includes("일반임대") && !detailBuildingTypes.includes("근생") ? (
                <div style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, background: "#F3F4F6", color: "#6B7280" }}>변동관리비 (단기 고정)</div>
              ) : (
                <select value={bdMgmtType} onChange={e => setBdMgmtType(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>
                  <option value="고정관리비">고정관리비</option>
                  <option value="변동관리비">변동관리비</option>
                </select>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", paddingTop: 14 }}>
              <span style={{ fontSize: 10, color: bdMgmtType === "고정관리비" || (detailBuildingTypes.includes("단기") && !detailBuildingTypes.includes("일반임대") && !detailBuildingTypes.includes("근생")) ? "#6B7280" : "#2563EB", fontWeight: 600 }}>
                {(detailBuildingTypes.includes("단기") && !detailBuildingTypes.includes("일반임대") && !detailBuildingTypes.includes("근생")) ? "💡 단기는 변동관리비 고정" : bdMgmtType === "고정관리비" ? "💡 매월 동일한 관리비 청구" : "💡 공과금 기반 변동 청구"}
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            {(detailBuildingTypes.includes("단기") || detailBuildingTypes.includes("일반임대")) && <div>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>표준임대차</div>
              <select value={bdStandardLease} onChange={e => setBdStandardLease(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>
                {["사용", "미사용"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>}
            <div>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>순회주기</div>
              <select value={bdVisitCycle} onChange={e => setBdVisitCycle(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>
                {["월4회", "월3회", "월2회", "월1회"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 9, color: "#8F95A3" }}>E-MAIL</span>
                <button onClick={() => setEmails([...emails, ""])} style={{ fontSize: 9, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>+ 추가</button>
              </div>
              {emails.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 4, marginBottom: i < emails.length - 1 ? 3 : 0 }}>
                  <input value={e} onChange={ev => { const u = [...emails]; u[i] = ev.target.value; setEmails(u); }} placeholder="example@email.com" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, flex: 1 }} />
                  {emails.length > 1 && <button onClick={() => setEmails(emails.filter((_, j) => j !== i))} style={{ padding: "0 6px", background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 13 }}>✕</button>}
                </div>
              ))}
            </div>
          </div>
        </div>}
      </Card>

      {/* ── Section 4: 협력업체 ── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sec4Open ? 12 : 0 }}>
          <div onClick={() => setSec4Open(!sec4Open)} style={{ cursor: "pointer", flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>🔧 협력업체</div>
            <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>소방 · 승강기 · 청소 · 소독 등 외주업체</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sec4Open && (sec4Edit ? (
              <>
                <button onClick={() => setSec4Edit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                <button onClick={() => setSec4Edit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>💾 저장</button>
              </>
            ) : (
              <button onClick={() => setSec4Edit(true)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✏️ 수정</button>
            ))}
            <span onClick={() => setSec4Open(!sec4Open)} style={{ fontSize: 14, color: "#8F95A3", cursor: "pointer", transition: "transform 0.2s", transform: sec4Open ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
          </div>
        </div>
        {sec4Open && <div style={{ pointerEvents: sec4Edit ? "auto" : "none", opacity: sec4Edit ? 1 : 0.7, transition: "opacity 0.2s" }}>
        {/* 체크박스 선택 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
          {[
            { key: "cleaning", label: "청소", icon: "🧹", color: "#10B981" },
            { key: "elevator", label: "승강기", icon: "🛗", color: "#3B82F6" },
            { key: "fire", label: "소방", icon: "🔥", color: "#DC2626" },
            { key: "mechElevator", label: "기계식승강기", icon: "⚙️", color: "#6366F1" },
            { key: "disinfect", label: "소독", icon: "🧴", color: "#8B5CF6" },
            { key: "custom1", label: "기타1", icon: "📋", color: "#64748B" },
            { key: "custom2", label: "기타2", icon: "📋", color: "#64748B" },
          ].map(v => (
            <label key={v.key} onClick={() => sec4Edit && toggleDetailVendor(v.key)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, cursor: sec4Edit ? "pointer" : "default", fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                background: vendorEnabled[v.key] ? (v.color + "15") : "#fff",
                border: `1.5px solid ${vendorEnabled[v.key] ? v.color : "#E0E3E9"}`,
                color: vendorEnabled[v.key] ? v.color : "#8F95A3",
                opacity: sec4Edit ? 1 : 0.7 }}>
              <input type="checkbox" checked={vendorEnabled[v.key]} readOnly
                style={{ accentColor: v.color, cursor: sec4Edit ? "pointer" : "default" }} />
              <span>{v.icon}</span> {v.label}
            </label>
          ))}
        </div>

        {/* 선택된 업체 입력 폼 (순서: 청소→승강기→소방→기계식승강기→소독→기타1→기타2) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { key: "cleaning", label: "청소", icon: "🧹", color: "#10B981", type: "simple" },
            { key: "elevator", label: "승강기", icon: "🛗", color: "#3B82F6", person: "승강기안전관리자", type: "withManager" },
            { key: "fire", label: "소방", icon: "🔥", color: "#DC2626", person: "소방안전관리자", type: "withManager" },
            { key: "mechElevator", label: "기계식승강기", icon: "⚙️", color: "#6366F1", person: "기계식승강기안전관리자", type: "withManager" },
            { key: "disinfect", label: "소독", icon: "🧴", color: "#8B5CF6", type: "simple" },
            { key: "custom1", label: "custom1", icon: "📋", color: "#64748B", type: "simple" },
            { key: "custom2", label: "custom2", icon: "📋", color: "#64748B", type: "simple" },
          ].filter(v => vendorEnabled[v.key]).map((v, i) => v.key === "fire" ? (
            <div key={v.key} style={{ padding: "10px 12px", background: i % 2 === 0 ? "#FAFBFC" : "#fff", borderRadius: 8, border: "1px solid #E8ECF0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: v.color, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{v.icon}</span> {v.label}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[{ id: "direct", label: "직접관리" }, { id: "vendor", label: "협력업체관리" }].map(m => (
                    <button key={m.id} onClick={() => setFireMode(m.id)}
                      style={{ padding: "4px 12px", borderRadius: 6, border: fireMode === m.id ? "1.5px solid #DC2626" : "1px solid #E0E3E9", background: fireMode === m.id ? "#FEF2F2" : "#fff", color: fireMode === m.id ? "#DC2626" : "#8F95A3", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "#DC2626", fontWeight: 600 }}>사용승인일</span>
                <div><input type="date" value={bdApprovalDate} onChange={e => setBdApprovalDate(e.target.value)} style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, maxWidth: 180 }} /></div>
              </div>
              {fireMode === "vendor" && (
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600 }}>협력업체</span>
                  <div><input value={bdVendors.fire.company} onChange={e => setBdVendor("fire", "company", e.target.value)} placeholder="업체명" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                  <div><input value={bdVendors.fire.phone} onChange={e => setBdVendor("fire", "phone", e.target.value)} placeholder="업체 연락처" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                  <div><input value={bdVendors.fire.contact} onChange={e => setBdVendor("fire", "contact", e.target.value)} placeholder="업체 담당자" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                  <div><input value={bdVendors.fire.contactPhone} onChange={e => setBdVendor("fire", "contactPhone", e.target.value)} placeholder="담당자 휴대폰" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                  <button style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 10, cursor: "pointer", fontFamily: "inherit", color: "#3B82F6", fontWeight: 700, whiteSpace: "nowrap" }}>📎 계약서</button>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "6px 0 0 0", borderTop: `1px dashed ${v.color}40` }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: v.color }}>👤 소방안전관리자</span>
                <div><input value={bdVendors.fire.manager} onChange={e => setBdVendor("fire", "manager", e.target.value)} placeholder="성명" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                <div><input value={bdVendors.fire.managerPhone} onChange={e => setBdVendor("fire", "managerPhone", e.target.value)} placeholder="연락처" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                <div><input value={bdVendors.fire.managerNote} onChange={e => setBdVendor("fire", "managerNote", e.target.value)} placeholder="자격/비고" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
              </div>
            </div>
          ) : v.type === "withManager" ? (
            <div key={v.key} style={{ padding: "10px 12px", background: i % 2 === 0 ? "#FAFBFC" : "#fff", borderRadius: 8, border: "1px solid #E8ECF0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: v.color, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span>{v.icon}</span> {v.label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600 }}>협력업체</span>
                <div><input value={bdVendors[v.key]?.company || ""} onChange={e => setBdVendor(v.key, "company", e.target.value)} placeholder="업체명" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                <div><input value={bdVendors[v.key]?.phone || ""} onChange={e => setBdVendor(v.key, "phone", e.target.value)} placeholder="업체 연락처" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                <div><input value={bdVendors[v.key]?.contact || ""} onChange={e => setBdVendor(v.key, "contact", e.target.value)} placeholder="업체 담당자" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                <div><input value={bdVendors[v.key]?.contactPhone || ""} onChange={e => setBdVendor(v.key, "contactPhone", e.target.value)} placeholder="담당자 휴대폰" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                <button style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 10, cursor: "pointer", fontFamily: "inherit", color: "#3B82F6", fontWeight: 700, whiteSpace: "nowrap" }}>📎 계약서</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "6px 0 0 0", borderTop: `1px dashed ${v.color}40` }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: v.color }}>👤 {v.person}</span>
                <div><input value={bdVendors[v.key]?.manager || ""} onChange={e => setBdVendor(v.key, "manager", e.target.value)} placeholder="성명" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                <div><input value={bdVendors[v.key]?.managerPhone || ""} onChange={e => setBdVendor(v.key, "managerPhone", e.target.value)} placeholder="연락처" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                <div><input value={bdVendors[v.key]?.managerNote || ""} onChange={e => setBdVendor(v.key, "managerNote", e.target.value)} placeholder="자격/비고" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
              </div>
            </div>
          ) : (
            <div key={v.key} style={{ padding: "8px 12px", background: i % 2 === 0 ? "#FAFBFC" : "#fff", borderRadius: 8, border: "1px solid #E8ECF0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
                {v.label.startsWith("custom") ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{v.icon}</span>
                    <input value={bdVendors[v.key]?.label || ""} onChange={e => setBdVendor(v.key, "label", e.target.value)} placeholder={`기타${v.label.slice(-1)} (입력)`} style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontWeight: 700 }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 700, color: v.color, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{v.icon}</span> {v.label}
                  </div>
                )}
                <div><input value={bdVendors[v.key]?.company || ""} onChange={e => setBdVendor(v.key, "company", e.target.value)} placeholder="회사명" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                <div><input value={bdVendors[v.key]?.phone || ""} onChange={e => setBdVendor(v.key, "phone", e.target.value)} placeholder="연락처" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                <div><input value={bdVendors[v.key]?.contact || ""} onChange={e => setBdVendor(v.key, "contact", e.target.value)} placeholder="담당자명" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                <div><input value={bdVendors[v.key]?.contactPhone || ""} onChange={e => setBdVendor(v.key, "contactPhone", e.target.value)} placeholder="담당자 휴대폰" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                <button style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 10, cursor: "pointer", fontFamily: "inherit", color: "#3B82F6", fontWeight: 700, whiteSpace: "nowrap" }}>📎 계약서</button>
              </div>
            </div>
          ))}
        </div>

        {/* 아무것도 선택 안 했을 때 안내 */}
        {!Object.values(vendorEnabled).some(v => v) && (
          <div style={{ padding: "20px", textAlign: "center", color: "#B0B5C1", fontSize: 12 }}>
            위 체크박스를 선택하면 해당 협력업체 입력란이 표시됩니다
          </div>
        )}
        </div>}
      </Card>

      {/* ── Section 5: 건물 특이사항 (독립 편집) ── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sec5Open ? 12 : 0 }}>
          <div onClick={() => setSec5Open(!sec5Open)} style={{ cursor: "pointer", flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>📝 건물 특이사항</div>
            <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>관리 참고사항 · 이력 기록</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sec5Open && (notesEdit ? (
              <>
                <button onClick={() => setNotesEdit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                <button onClick={() => setNotesEdit(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>💾 저장</button>
              </>
            ) : (
              <button onClick={() => setNotesEdit(true)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✏️ 수정</button>
            ))}
            <span onClick={() => setSec5Open(!sec5Open)} style={{ fontSize: 14, color: "#8F95A3", cursor: "pointer", transition: "transform 0.2s", transform: sec5Open ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
          </div>
        </div>
        {sec5Open &&
        <textarea value={bdNotes} onChange={e => setBdNotes(e.target.value)} readOnly={!notesEdit} placeholder={"건물 특이사항을 순차적으로 기록하세요.\n\n예시:\n- 2024.03 관리 시작. 1층 상가 분리 계량기 없어 공용전기에서 차감\n- 2024.05 옥상 방수공사 완료 (건물주 부담)\n- 2024.08 3층 배관 노후로 전체 교체\n- 세무사: 홍길동 세무사 (010-1234-5678)\n- 2025.01 소방점검 지적사항: 2층 비상구 표지등 불량\n..."} rows={12}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.8, fontSize: 12, padding: "12px 14px", minHeight: 200, background: notesEdit ? "#fff" : "#F8FAFC", opacity: notesEdit ? 1 : 0.75 }} />
        }
      </Card>

      {/* ── Section 6: 시설 체크리스트 ── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sec6Open ? 12 : 0 }}>
          <div onClick={() => setSec6Open(!sec6Open)} style={{ cursor: "pointer", flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>✅ 시설 체크리스트</div>
            <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>순회 시 점검할 시설 항목 관리 · {bdFacilityChecklist.length}개 항목</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span onClick={() => setSec6Open(!sec6Open)} style={{ fontSize: 14, color: "#8F95A3", cursor: "pointer", transition: "transform 0.2s", transform: sec6Open ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
          </div>
        </div>
        {sec6Open && <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {bdFacilityChecklist.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", minWidth: 20 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1D23" }}>{item}</span>
                </div>
                <button onClick={() => setBdFacilityChecklist(bdFacilityChecklist.filter((_, idx) => idx !== i))}
                  style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontFamily: "inherit" }}>✕</button>
              </div>
            ))}
            {bdFacilityChecklist.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: "#B0B5C1", fontSize: 12 }}>체크리스트 항목이 없습니다</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newChecklistItem.trim()) { setBdFacilityChecklist([...bdFacilityChecklist, newChecklistItem.trim()]); setNewChecklistItem(""); } }}
              placeholder="새 점검 항목 입력..." style={{ ...inputStyle, flex: 1, padding: "8px 12px", fontSize: 12 }} />
            <button onClick={() => { if (newChecklistItem.trim()) { setBdFacilityChecklist([...bdFacilityChecklist, newChecklistItem.trim()]); setNewChecklistItem(""); } }}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ 추가</button>
          </div>
        </div>}
      </Card>

      {/* ── 미리보기 모달 ── */}
      {showDetailPreview && (() => {
        const previewAcctTypes = detailBuildingTypes.map(t => t === "기업시설관리" ? "관리사무소" : t);
        const previewAccts = buildingAccounts[buildingName] || { mode1: "", housemanAccount1: defaultHousemanAccount, ownerAccounts1: {}, mode2: "", housemanAccount2: defaultHousemanAccount, ownerAccounts2: {}, mode3: "", housemanAccount3: defaultHousemanAccount, ownerAccounts3: {} };
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 9999, overflowY: "auto", padding: "40px 20px" }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: "0", maxWidth: 800, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              {/* 미리보기 헤더 */}
              <div style={{ padding: "20px 28px", background: "linear-gradient(135deg, #1A1D23 0%, #2D3748 100%)", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>📋 {buildingName} 미리보기</div>
                  <div style={{ fontSize: 11, color: "#A0AEC0", marginTop: 2 }}>{detailBuildingTypes.join(" + ")} · {bldg.rooms}실 · {detail.owner && `건물주: ${detail.owner}`}</div>
                </div>
                <button onClick={() => setShowDetailPreview(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #A0AEC0", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✕ 닫기</button>
              </div>

              <div style={{ padding: "20px 28px" }}>
                {/* 미리보기: 기본 정보 */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>📋 기본 정보</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { l: "건물명", v: buildingName },
                      { l: "건물 유형", v: detailBuildingTypes.join(" + ") },
                      { l: "주소", v: "서울 관악구 봉천동 123-45" },
                      { l: "관리시작일", v: detail.start },
                      { l: "전체 호실", v: `${bldg.rooms}실` },
                      { l: "입주", v: `${bldg.occupied}실` },
                      { l: "공실", v: `${bldgVacancies.length}실` },
                      { l: "연체", v: overdueCount > 0 ? `${overdueCount}건` : "" },
                    ].filter(x => x.v).map((x, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid #F3F4F6" }}>
                        <span style={{ fontSize: 11, color: "#8F95A3", fontWeight: 600, minWidth: 80 }}>{x.l}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{x.v}</span>
                      </div>
                    ))}
                  </div>
                  {/* 유형별 현황 */}
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {Object.entries(typeCounts).filter(([,v]) => v > 0).map(([t, v]) => (
                      <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: rtCfg(t).bg, color: rtCfg(t).c }}>{t} {v}</span>
                    ))}
                  </div>
                </div>

                {/* 미리보기: 건물주 정보 */}
                {detail.owner && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>👤 건물주 정보</div>
                    <div style={{ padding: "8px 12px", background: "#F0F4FF", borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#2563EB", marginBottom: 6 }}>건물주 1 (주)</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <div><span style={{ fontSize: 9, color: "#8F95A3" }}>이름</span><div style={{ fontSize: 12, fontWeight: 700 }}>{detail.owner}</div></div>
                        {detail.ownerPhone && <div><span style={{ fontSize: 9, color: "#8F95A3" }}>전화번호</span><div style={{ fontSize: 12, fontWeight: 700 }}>{detail.ownerPhone}</div></div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* 미리보기: 건물 계좌 정보 */}
                {(previewAccts.mode1 || previewAccts.mode2) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🏦 건물 계좌 정보</div>
                    <div style={{ display: "grid", gridTemplateColumns: previewAcctTypes.length === 3 ? "1fr 1fr 1fr" : previewAcctTypes.length === 2 ? "1fr 1fr" : "1fr", gap: 10 }}>
                      {previewAcctTypes.map((aType, ai) => {
                        const suffix = String(ai + 1);
                        const curMode = previewAccts[`mode${suffix}`];
                        if (!curMode) return null;
                        const curOptions = modeOptions[aType] || [];
                        const modeLabel = curOptions.find(o => o.id === curMode)?.label || curMode;
                        const curOwnerFields = ownerFieldCfg[curMode] || [];
                        const hmUsage = housemanUsageMap[curMode];
                        return (
                          <div key={aType} style={{ padding: "10px 12px", background: acctTypeBg[aType], borderRadius: 8, border: `1.5px solid ${acctTypeColor[aType]}40` }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: acctTypeColor[aType], marginBottom: 6 }}>{aType} · {modeLabel}</div>
                            <div style={{ fontSize: 10, color: "#5F6577", marginBottom: 4 }}>💡 {flowMap[curMode]}</div>
                            {hmUsage && (
                              <div style={{ fontSize: 10, marginBottom: 4 }}>
                                <span style={{ color: "#2563EB", fontWeight: 600 }}>하우스맨 계좌 ({hmUsage}):</span>
                                <span style={{ fontFamily: "monospace", marginLeft: 4 }}>{previewAccts[`housemanAccount${suffix}`]}</span>
                              </div>
                            )}
                            {curOwnerFields.map(f => {
                              const accts = previewAccts[`ownerAccounts${suffix}`] || {};
                              const bank = accts[f.key + "_bank"] || "";
                              const num = accts[f.key] || "";
                              const holder = accts[f.key + "_holder"] || "";
                              if (!bank && !num && !holder) return null;
                              return (
                                <div key={f.key} style={{ fontSize: 10, marginBottom: 2 }}>
                                  <span style={{ color: "#EA580C", fontWeight: 600 }}>{f.label}:</span>
                                  <span style={{ fontFamily: "monospace", marginLeft: 4 }}>{[bank, num, holder].filter(Boolean).join(" ")}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 미리보기: 담당자 & 계약 조건 */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🏢 담당자 & 계약 조건</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    {[
                      { l: "수수료", v: bldg.feeType === "pct" ? `${(bldg.fee * 100)}%` : (bldg.fixedFee ? `${bldg.fixedFee.toLocaleString()}원` : "") },
                      { l: "수수료 유형", v: bldg.feeType === "pct" ? "수수료율" : "정액제" },
                      { l: "관리비 유형", v: bdMgmtType || "변동관리비" },
                      { l: "관리시작일", v: detail.start },
                    ].filter(x => x.v).map((x, i) => (
                      <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid #F3F4F6" }}>
                        <span style={{ fontSize: 10, color: "#8F95A3" }}>{x.l}</span>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 미리보기: 협력업체 */}
                {Object.values(vendorEnabled).some(v => v) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🔧 협력업체</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[
                        { key: "cleaning", label: "청소", icon: "🧹", color: "#10B981" },
                        { key: "elevator", label: "승강기", icon: "🛗", color: "#3B82F6" },
                        { key: "fire", label: "소방", icon: "🔥", color: "#DC2626" },
                        { key: "mechElevator", label: "기계식승강기", icon: "⚙️", color: "#6366F1" },
                        { key: "disinfect", label: "소독", icon: "🧴", color: "#8B5CF6" },
                        { key: "custom1", label: "기타1", icon: "📋", color: "#64748B" },
                        { key: "custom2", label: "기타2", icon: "📋", color: "#64748B" },
                      ].filter(v => vendorEnabled[v.key]).map(v => (
                        <span key={v.key} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: v.color + "15", color: v.color, border: `1px solid ${v.color}40` }}>
                          {v.icon} {v.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 미리보기: 층별 호실 현황 */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🏗️ 층별 호실 현황</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {floorKeys.map(floor => {
                      const rooms = detail.floors[floor];
                      return (
                        <div key={floor} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: "#1B1F2E", padding: "4px 10px", borderRadius: 6, minWidth: 36, textAlign: "center" }}>{floor}</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {rooms.map(room => {
                              const info = getRoomStatus(room);
                              const st = statusStyle(info.status === "정상" ? "입주" : info.status === "연체" ? "연체" : info.status);
                              return (
                                <span key={room} style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                                  {room}{info.name ? ` ${info.name}` : ""}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 미리보기: 퇴실자 사진 */}
                {(() => {
                  const pastKeys = Object.keys(pastTenantsData).filter(k => k.startsWith(buildingName + "_"));
                  if (pastKeys.length === 0) return null;
                  return (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>📷 퇴실자 사진 ({pastKeys.length}건)</div>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 6 }}>
                        {pastKeys.slice(0, 6).map(k => {
                          const rawRec = pastTenantsData[k];
                          const records = Array.isArray(rawRec) ? rawRec : [rawRec].filter(Boolean);
                          if (records.length === 0) return null;
                          const last = records[records.length - 1];
                          const room = k.split("_")[1];
                          return (
                            <div key={k} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", cursor: "pointer" }}
                              onClick={() => setPhotoViewTarget({ key: k, room, records })}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 13, fontWeight: 800 }}>{room}호 {last?.name}</span>
                                <span style={{ fontSize: 9, color: "#8F95A3" }}>{last?.moveOut || ""}</span>
                              </div>
                              <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 2 }}>
                                입주 {(last?.moveInPhotos||[]).length}장 · 퇴실 {(last?.moveOutPhotos||[]).length}장
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 미리보기: AS 현황 */}
                {bldgAS.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🔧 AS 현황 ({bldgAS.length}건)</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {bldgAS.map((a, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, padding: "6px 10px", background: i % 2 === 0 ? "#FAFBFC" : "#fff", borderRadius: 6, border: "1px solid #E8ECF0", alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: "#8F95A3", minWidth: 70 }}>{a.date}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, minWidth: 40 }}>{a.room}</span>
                          <span style={{ fontSize: 11, flex: 1 }}>{a.content}</span>
                          <StatusBadge status={a.priority} />
                          <StatusBadge status={a.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 닫기 버튼 */}
              <div style={{ padding: "16px 28px", borderTop: "1px solid #E5E7EB", textAlign: "center" }}>
                <button onClick={() => setShowDetailPreview(false)}
                  style={{ padding: "10px 40px", borderRadius: 10, border: "none", background: "#1A1D23", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {deleteStep > 0 && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px 36px", maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            {deleteStep === 1 && (
              <>
                <div style={{ fontSize: 36, textAlign: "center", marginBottom: 16 }}>⚠️</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23", textAlign: "center", marginBottom: 8 }}>건물을 삭제하시겠습니까?</div>
                <div style={{ fontSize: 13, color: "#5F6577", textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
                  <strong style={{ color: "#DC2626" }}>{buildingName}</strong>의 모든 정보와<br />
                  <strong style={{ color: "#DC2626" }}>{Object.values(detail.floors).flat().length}개 호실</strong>이 영구적으로 삭제됩니다.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setDeleteStep(0)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                  <button onClick={() => setDeleteStep(2)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "#DC2626", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>삭제 진행</button>
                </div>
              </>
            )}
            {deleteStep === 2 && (
              <>
                <div style={{ fontSize: 36, textAlign: "center", marginBottom: 16 }}>🚨</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#DC2626", textAlign: "center", marginBottom: 8 }}>정말요? 되돌릴 수 없습니다!</div>
                <div style={{ fontSize: 13, color: "#5F6577", textAlign: "center", marginBottom: 16, lineHeight: 1.6 }}>
                  삭제 시 복구가 불가능합니다.<br />
                  입주자 정보, 수금 내역, AS 이력, 순회 기록까지<br />
                  모두 함께 삭제됩니다.
                </div>
                <div style={{ padding: "12px 16px", background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA", marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600, textAlign: "center" }}>
                    ⚡ {buildingName} · {Object.values(detail.floors).flat().length}개 호실 · {bldgTenants.length}명 입주자 · AS {bldgAS.length}건
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setDeleteStep(0)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>아니요, 취소</button>
                  <button onClick={() => setDeleteStep(3)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "#991B1B", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>그래도 삭제</button>
                </div>
              </>
            )}
            {deleteStep === 3 && (
              <>
                <div style={{ fontSize: 36, textAlign: "center", marginBottom: 16 }}>💀</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23", textAlign: "center", marginBottom: 8 }}>마지막 확인입니다</div>
                <div style={{ fontSize: 14, color: "#DC2626", textAlign: "center", marginBottom: 16, fontWeight: 700 }}>
                  "{buildingName}" 를 입력하고 삭제 버튼을 누르세요.
                </div>
                <input id="deleteConfirmInput" placeholder={`"${buildingName}" 입력`} style={{ ...inputStyle, padding: "12px 16px", fontSize: 14, textAlign: "center", marginBottom: 16, border: "2px solid #FECACA" }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setDeleteStep(0)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                  <button onClick={() => {
                    const input = document.getElementById("deleteConfirmInput");
                    if (input && input.value === buildingName) { setDeleteStep(0); onBack(); }
                    else { input.style.borderColor = "#DC2626"; input.style.background = "#FEF2F2"; input.placeholder = "건물명이 일치하지 않습니다"; }
                  }} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "#7F1D1D", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>🗑 영구 삭제</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floor Map */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <SectionTitle sub="호실을 클릭하면 상세 정보를 볼 수 있습니다">🏗️ 층별 호실 현황</SectionTitle>
          <button onClick={() => setShowAddRoom(!showAddRoom)} style={{ padding: "7px 16px", borderRadius: 8, border: showAddRoom ? "1.5px solid #E0E3E9" : "1.5px solid #3B82F6", background: showAddRoom ? "#fff" : "#EFF6FF", color: showAddRoom ? "#5F6577" : "#2563EB", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            {showAddRoom ? "취소" : "➕ 호실 추가"}
          </button>
        </div>

        {showAddRoom && (
          <div style={{ padding: "14px 16px", background: "#F0F4FF", borderRadius: 10, border: "1.5px solid #BFDBFE", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", marginBottom: 10 }}>새 호실 추가</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>층</div>
                <input value={addRoomFloor} onChange={e => setAddRoomFloor(e.target.value)} placeholder="예: 1, B1, 2" style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>호실번호</div>
                <input value={addRoomNum} onChange={e => setAddRoomNum(e.target.value)} placeholder="예: 101, 1층" style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
              </div>
              <button onClick={() => { if (addRoomFloor && addRoomNum) { setAddRoomFloor(""); setAddRoomNum(""); setShowAddRoom(false); setSelectedRoom(addRoomNum); setRoomEditMode(true); }}} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: addRoomFloor && addRoomNum ? "#2563EB" : "#D1D5DB", color: "#fff", fontWeight: 700, fontSize: 12, cursor: addRoomFloor && addRoomNum ? "pointer" : "default", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                추가 후 정보입력
              </button>
            </div>
            <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 6 }}>추가하면 바로 호실 상세 입력 화면이 열립니다. (기준금액, 사진 등)</div>
          </div>
        )}

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16, padding: "8px 12px", background: "#F9FAFB", borderRadius: 8 }}>
          {[
            { label: "입주중", bg: "#D1FAE5", border: "#A7F3D0" },
            { label: "연체", bg: "#FEE2E2", border: "#FECACA" },
            { label: "공실", bg: "#FEF3C7", border: "#FDE68A" },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#5F6577" }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: l.bg, border: `1.5px solid ${l.border}` }} />
              {l.label}
            </div>
          ))}
        </div>

        {/* Floor Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {floorKeys.map(floor => {
            const rooms = detail.floors[floor];
            return (
              <div key={floor} style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
                {/* Floor Label */}
                <div style={{ width: 52, display: "flex", alignItems: "center", justifyContent: "center", background: "#1B1F2E", color: "#fff", fontWeight: 800, fontSize: 12, borderRadius: "8px 0 0 8px", flexShrink: 0 }}>
                  {floor}
                </div>
                {/* Rooms */}
                <div style={{ flex: 1, display: "flex", gap: 4, padding: "6px 8px", background: "#F7F8FA", borderRadius: "0 8px 8px 0", flexWrap: "wrap" }}>
                  {rooms.map(room => {
                    const info = getRoomStatus(room);
                    const st = statusStyle(info.status === "정상" ? "입주" : info.status === "연체" ? "연체" : info.status);
                    return (
                      <div key={room} title={info.name ? `${room}호 ${info.name}${info.overdue > 0 ? ` (연체 ${fmt(info.overdue)}원)` : ""}` : `${room}호 ${info.status}${info.days > 0 ? ` (${info.days}일)` : ""}`}
                        onClick={() => { setSelectedRoom(selectedRoom === room ? null : room); setRoomEditMode(false); setRoomDeleteStep(0); setRoomTab("info"); }}
                        style={{
                          minWidth: 72, padding: "10px 10px", borderRadius: 8, background: selectedRoom === room ? "#1A1D23" : st.bg, border: `1.5px solid ${selectedRoom === room ? "#1A1D23" : st.border}`,
                          cursor: "pointer", transition: "all 0.15s", textAlign: "center", position: "relative",
                        }}
                        onMouseEnter={e => { if (selectedRoom !== room) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)"; }}}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 800, color: selectedRoom === room ? "#fff" : st.color, marginBottom: 2 }}>{room}</div>
                        <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 1, color: selectedRoom === room ? "#ccc" : rtCfg(getRoomType(buildingName, room)).c }}>{getRoomType(buildingName, room)}</div>
                        <div style={{ fontSize: 10, color: selectedRoom === room ? "#ccc" : st.color, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {info.name || (info.status === "공실" ? "공실" : "입주중")}
                        </div>
                        {info.overdue > 0 && (
                          <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>!</div>
                        )}
                        {info.status === "공실" && info.days > 30 && (
                          <div style={{ position: "absolute", top: -4, right: -4, fontSize: 8, background: "#DC2626", color: "#fff", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>{info.days}일</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Room Detail Panel */}
      {selectedRoom && (() => {
        const key = `${buildingName}_${selectedRoom}`;
        const savedRoom = saved[`room_${selectedRoom}`] || {};
        const master = { ...(roomMasterData[key] || {}), ...savedRoom };
        const info = getRoomStatus(selectedRoom);
        const tenant = bldgTenants.find(t => t.room === selectedRoom);
        const vacancy = bldgVacancies.find(v => v.room === selectedRoom);
        const roomPhotoKey = `roomPhotos_${selectedRoom}`;
        const roomPhotos = saved[roomPhotoKey] || master.photos || [];
        const addRoomPhotos = (dataUrls) => updateBD({ [roomPhotoKey]: [...roomPhotos, ...dataUrls].slice(0, 30) });
        const removeRoomPhoto = (pi) => { const updated = [...roomPhotos]; updated.splice(pi, 1); updateBD({ [roomPhotoKey]: updated }); };
        const photoCount = roomPhotos.length;
        return (
          <Card style={{ marginBottom: 20, border: "2px solid #3B82F6" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: "#1A1D23" }}>🚪 {selectedRoom}호</span>
                <select value={getRoomType(buildingName, selectedRoom)} onChange={e => { changeRoomType(buildingName, selectedRoom, e.target.value); setRoomTab(roomTab); /* force re-render */ }}
                  style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, border: "1.5px solid #E0E3E9", cursor: "pointer", fontFamily: "inherit",
                    background: rtCfg(getRoomType(buildingName, selectedRoom)).bg,
                    color: rtCfg(getRoomType(buildingName, selectedRoom)).c }}>
                  <option value="단기">단기</option><option value="일반임대">일반임대</option><option value="근생">근생</option><option value="관리사무소">관리사무소</option>
                </select>
                <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, fontWeight: 700,
                  background: tenant ? (tenant.overdue > 0 ? "#FEE2E2" : "#D1FAE5") : vacancy ? "#FEF3C7" : "#FEF3C7",
                  color: tenant ? (tenant.overdue > 0 ? "#991B1B" : "#065F46") : vacancy ? "#92400E" : "#92400E" }}>
                  {tenant ? (tenant.overdue > 0 ? "연체" : "입주중") : "공실"}
                </span>
                {master.roomType && <span style={{ fontSize: 11, color: "#8F95A3" }}>{master.roomType} · {master.area}㎡</span>}
              </div>
              <button onClick={() => setSelectedRoom(null)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
            </div>

            {/* ===== 호실정보 ===== */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#2563EB", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid #BFDBFE", display: "flex", alignItems: "center", gap: 6 }}>
                📋 호실 기본정보 <span style={{ fontSize: 10, fontWeight: 500, color: "#8F95A3" }}>이 정보가 공실관리 · 홈페이지의 기준값이 됩니다</span>
              </div>
              {roomEditMode ? (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, alignItems: "stretch" }}>
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>방형태</div>
                        <select id="re-roomType" defaultValue={master.roomType || ""} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }}><option value="">선택</option>{["원룸","투룸","쓰리룸","복층","상가","사무실"].map(t => <option key={t}>{t}</option>)}</select></div>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>면적 (㎡)</div>
                        <input id="re-area" defaultValue={master.area || ""} placeholder="26.4" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }} /></div>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산수수료</div>
                        <input id="re-commFee" defaultValue={master.commFee || ""} placeholder="100,000" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, textAlign: "right" }} /></div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 6 }}>💰 기준 금액</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                      {[
                        { label: "예치금", key: "deposit", value: master.deposit }, { label: "임대료", key: "rent", value: master.rent }, { label: "관리비", key: "mgmt", value: master.mgmt },
                        { label: "수도", key: "water", value: master.water }, { label: "인터넷", key: "internet", value: master.internet }, { label: "퇴실청소비", key: "cleanFee", value: master.cleanFee },
                      ].map((f, i) => (
                        <div key={i}><div style={{ fontSize: 8, color: "#059669", marginBottom: 2 }}>{f.label}</div>
                          <input id={`re-${f.key}`} defaultValue={f.value || ""} placeholder="0" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, textAlign: "right" }} /></div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", marginBottom: 6 }}>🔌 고객번호</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <div><div style={{ fontSize: 8, color: "#6366F1", marginBottom: 2 }}>전기</div>
                        <input id="re-elecNo" defaultValue={master.elecNo || ""} style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} /></div>
                      <div><div style={{ fontSize: 8, color: "#6366F1", marginBottom: 2 }}>가스</div>
                        <input id="re-gasNo" defaultValue={master.gasNo || ""} style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} /></div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>📝 계약시 특약사항상단</div>
                      <textarea id="re-specialTerms" defaultValue={master.specialTerms || ""} placeholder="특약사항 상단 입력..."
                        style={{ ...inputStyle, padding: "8px 10px", fontSize: 11, resize: "none", lineHeight: 1.6, width: "100%", flex: 1 }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>📝 계약시 특약사항하단</div>
                      <textarea id="re-specialTermsBottom" defaultValue={master.specialTermsBottom || ""} placeholder="특약사항 하단 입력..."
                        style={{ ...inputStyle, padding: "8px 10px", fontSize: 11, resize: "none", lineHeight: 1.6, width: "100%", flex: 1 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <PhotoDropZone photos={roomPhotos} maxPhotos={30} label="호실 사진" onAdd={addRoomPhotos} onRemove={removeRoomPhoto} />
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, alignItems: "stretch" }}>
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                      {[
                        { label: "방형태", value: master.roomType || "-" },
                        { label: "면적", value: master.area ? `${master.area}㎡` : "-" },
                        { label: "부동산수수료", value: master.commFee || "-" },
                      ].map((f, i) => (
                        <div key={i} style={{ padding: "8px 10px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                          <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>{f.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 6 }}>💰 기준 금액</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                      {[
                        { label: "예치금", value: master.deposit }, { label: "임대료", value: master.rent }, { label: "관리비", value: master.mgmt },
                        { label: "수도", value: master.water }, { label: "인터넷", value: master.internet }, { label: "퇴실청소비", value: master.cleanFee },
                      ].map((f, i) => (
                        <div key={i} style={{ padding: "6px 8px", background: "#F0FDF4", borderRadius: 6, border: "1px solid #BBF7D0" }}>
                          <div style={{ fontSize: 8, color: "#059669", marginBottom: 2 }}>{f.label}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46" }}>{f.value || "-"}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", marginBottom: 6 }}>🔌 고객번호</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {[{ label: "전기", value: master.elecNo }, { label: "가스", value: master.gasNo }].map((f, i) => (
                        <div key={i} style={{ padding: "6px 8px", background: "#F5F3FF", borderRadius: 6, border: "1px solid #DDD6FE" }}>
                          <div style={{ fontSize: 8, color: "#6366F1", marginBottom: 2 }}>{f.label}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#4338CA", fontFamily: "monospace" }}>{f.value || "-"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>📝 계약시 특약사항상단</div>
                      <div style={{ padding: "10px 12px", background: "#FFF7ED", borderRadius: 8, border: "1px solid #FED7AA", fontSize: 11, color: "#9A3412", lineHeight: 1.6, whiteSpace: "pre-wrap", flex: 1 }}>
                        {master.specialTerms || <span style={{ color: "#D1D5DB" }}>등록된 내용이 없습니다</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>📝 계약시 특약사항하단</div>
                      <div style={{ padding: "10px 12px", background: "#FFF7ED", borderRadius: 8, border: "1px solid #FED7AA", fontSize: 11, color: "#9A3412", lineHeight: 1.6, whiteSpace: "pre-wrap", flex: 1 }}>
                        {master.specialTermsBottom || <span style={{ color: "#D1D5DB" }}>등록된 내용이 없습니다</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <PhotoDropZone photos={roomPhotos} maxPhotos={30} label="호실 사진" onAdd={addRoomPhotos} onRemove={removeRoomPhoto} />
                  </div>
                </div>
              )}
              {/* 🏦 호실 계좌 정보 + 입주금 계산 */}
              {(() => {
                const roomAcctKey = `${buildingName}_${selectedRoom}`;
                const roomType = getRoomType(buildingName, selectedRoom);
                // 호실 유형 → 계좌 유형 매핑 (기업시설관리 → 관리사무소)
                const roomAcctType = roomType === "기업시설관리" ? "관리사무소" : roomType;
                // 건물 유형 배열에서 매칭되는 suffix 찾기
                const typeIndex = detailBuildingTypes.findIndex(t => {
                  const at = t === "기업시설관리" ? "관리사무소" : t;
                  return at === roomAcctType;
                });
                const suffix = typeIndex >= 0 ? String(typeIndex + 1) : "1";
                // 건물 기본값 (suffix 기반으로 읽기)
                const bldgAcctsRaw = buildingAccounts[buildingName] || {};
                const buildingAcct = {
                  mode: bldgAcctsRaw[`mode${suffix}`] || "",
                  housemanAccount: bldgAcctsRaw[`housemanAccount${suffix}`] || defaultHousemanAccount,
                  ownerAccounts: bldgAcctsRaw[`ownerAccounts${suffix}`] || {}
                };
                // 호실 오버라이드
                const roomOverride = buildingAccounts[roomAcctKey];
                const isRoomCustom = !!roomOverride;
                const effectiveAcct = roomOverride || buildingAcct;
                // 호실 개별 설정 관련 함수
                const enableRoomCustom = () => {
                  setBuildingAccounts && setBuildingAccounts(prev => ({
                    ...prev,
                    [roomAcctKey]: { ...buildingAcct }
                  }));
                };
                const disableRoomCustom = () => {
                  setBuildingAccounts && setBuildingAccounts(prev => {
                    const next = { ...prev };
                    delete next[roomAcctKey];
                    return next;
                  });
                };
                const updateRoomAcct = (patch) => setBuildingAccounts && setBuildingAccounts(prev => ({ ...prev, [roomAcctKey]: { ...(prev[roomAcctKey] || buildingAcct), ...patch } }));
                const setRoomAcctMode = (v) => updateRoomAcct({ mode: v, ownerAccounts: {} });
                const setRoomHousemanAcct = (v) => updateRoomAcct({ housemanAccount: v });
                const setRoomOwnerAccts = (fn) => { const cur = buildingAccounts[roomAcctKey] || buildingAcct; const next = typeof fn === "function" ? fn(cur.ownerAccounts) : fn; updateRoomAcct({ ownerAccounts: next }); };
                const currentOptions = modeOptions[roomAcctType] || [];
                const validMode = currentOptions.find(o => o.id === effectiveAcct.mode) ? effectiveAcct.mode : "";
                const ownerFields = ownerFieldCfg[validMode] || [];
                const hmUsage = housemanUsageMap[validMode];
                // 입주금 계산 (단기 전용)
                const isDangiRoom = roomAcctType === "단기";
                const pn = (s) => { if (!s) return 0; const n = parseFloat(String(s).replace(/,/g, '')); return isNaN(n) ? 0 : n; };
                const rmKey2 = `${buildingName}_${selectedRoom}`;
                const sr2 = saved[`room_${selectedRoom}`] || {};
                const ri2 = { ...(roomMasterData[rmKey2] || {}), ...sr2 };
                const riDeposit = pn(ri2.deposit);
                const riRent = pn(ri2.rent);
                const riMgmt = pn(ri2.mgmt);
                const riWater = pn(ri2.water);
                const riInternet = pn(ri2.internet);

                const moveInCalc = (() => {
                  if (!isDangiRoom) return null;
                  const total = riDeposit + riRent + riMgmt + riWater + riInternet;
                  const fmtW = (n) => n >= 10000 ? `${(n/10000).toFixed(n%10000===0?0:1)}만` : n > 0 ? `${n.toLocaleString()}원` : "0원";

                  if (validMode === "houseman" || validMode === "hm_owner1" || !validMode) {
                    // 계좌 1개: 전부 한 계좌
                    const acctName = validMode === "hm_owner1" ? "건물주계좌" : "하우스맨계좌";
                    return { type: "single", acctName, items: [
                      { l: "예치금", v: riDeposit }, { l: "임대료", v: riRent }, { l: "관리비", v: riMgmt },
                      { l: "수도", v: riWater }, { l: "인터넷", v: riInternet },
                    ], total };
                  }
                  if (validMode === "owner1") {
                    // 건물주: 임대료, 하우스맨: 관리비+공과금
                    return { type: "dual", accounts: [
                      { name: "건물주계좌", items: [{ l: "예치금", v: riDeposit }, { l: "임대료", v: riRent }], sub: riDeposit + riRent },
                      { name: "하우스맨계좌", items: [{ l: "관리비", v: riMgmt }, { l: "수도", v: riWater }, { l: "인터넷", v: riInternet }], sub: riMgmt + riWater + riInternet },
                    ], total };
                  }
                  if (validMode === "owner2") {
                    // 건물주: 임대료+관리비, 하우스맨: 수도+인터넷
                    return { type: "dual", accounts: [
                      { name: "건물주계좌", items: [{ l: "예치금", v: riDeposit }, { l: "임대료", v: riRent }, { l: "관리비", v: riMgmt }], sub: riDeposit + riRent + riMgmt },
                      { name: "하우스맨계좌", items: [{ l: "수도", v: riWater }, { l: "인터넷", v: riInternet }], sub: riWater + riInternet },
                    ], total };
                  }
                  if (validMode === "owner3") {
                    // 건물주: 임대료+관리비, 수도+인터넷 후불
                    return { type: "dual_deferred", accounts: [
                      { name: "건물주계좌", items: [{ l: "예치금", v: riDeposit }, { l: "임대료", v: riRent }, { l: "관리비", v: riMgmt }], sub: riDeposit + riRent + riMgmt },
                    ], deferred: [{ l: "수도", v: riWater }, { l: "인터넷", v: riInternet }],
                    deferredSub: riWater + riInternet, total: riDeposit + riRent + riMgmt };
                  }
                  return null;
                })();

                return (
                  <div style={{ marginTop: 14, display: isDangiRoom ? "grid" : "block", gridTemplateColumns: isDangiRoom ? "1fr 1fr" : "1fr", gap: 12 }}>
                  {/* 왼쪽: 계좌 정보 */}
                  <div style={{ padding: "10px 14px", background: "#FFFBF0", borderRadius: 10, border: "1px solid #FDE68A" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#92400E" }}>🏦 계좌 정보</span>
                      <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: acctTypeBg[roomAcctType], color: acctTypeColor[roomAcctType], fontWeight: 700 }}>{acctTypeLabel[roomAcctType]}</span>
                    </div>
                    {/* 건물 따름 / 호실 개별 토글 */}
                    <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                      <button onClick={() => { if (isRoomCustom) disableRoomCustom(); }}
                        style={{ padding: "5px 12px", borderRadius: 6, border: !isRoomCustom ? "1.5px solid #10B981" : "1px solid #E0E3E9", background: !isRoomCustom ? "#D1FAE5" : "#FAFBFC", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: !isRoomCustom ? "#065F46" : "#5F6577" }}>
                        🏢 건물 설정 따름
                      </button>
                      <button onClick={() => { if (!isRoomCustom) enableRoomCustom(); }}
                        style={{ padding: "5px 12px", borderRadius: 6, border: isRoomCustom ? "1.5px solid #F59E0B" : "1px solid #E0E3E9", background: isRoomCustom ? "#FEF3C7" : "#FAFBFC", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: isRoomCustom ? "#92400E" : "#5F6577" }}>
                        🚪 호실 개별 설정
                      </button>
                    </div>
                    {/* 건물 따름: 읽기전용 표시 */}
                    {!isRoomCustom && (
                      <div style={{ opacity: 0.7 }}>
                        {!validMode && <div style={{ fontSize: 11, color: "#8F95A3", padding: "8px 0" }}>건물 계좌가 아직 설정되지 않았습니다. 건물정보에서 먼저 설정해주세요.</div>}
                        {validMode && (() => {
                          const roHm = hmUsage && (
                            <div key="hm" style={{ padding: "8px 10px", background: "#F0F4FF", borderRadius: 6, border: "1px solid #BFDBFE" }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "#2563EB", marginBottom: 4 }}>🏗️ 하우스맨 계좌 <span style={{ color: "#8F95A3", fontWeight: 500 }}>({hmUsage})</span></div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", fontFamily: "monospace" }}>{effectiveAcct.housemanAccount}</div>
                            </div>
                          );
                          const roOwner = ownerFields.length > 0 && (
                            <div key="owner" style={{ padding: "8px 10px", background: "#FFF7ED", borderRadius: 6, border: "1px solid #FED7AA" }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>👤 건물주 계좌</div>
                              {ownerFields.map(f => (
                                <div key={f.key} style={{ marginBottom: 4 }}>
                                  <div style={{ fontSize: 8, fontWeight: 700, color: "#EA580C", marginBottom: 2 }}>{f.label}</div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: "#EA580C", fontFamily: "monospace" }}>
                                    {effectiveAcct.ownerAccounts[f.key + "_bank"] || ""} {effectiveAcct.ownerAccounts[f.key] || ""}{effectiveAcct.ownerAccounts[f.key + "_holder"] ? ` (${effectiveAcct.ownerAccounts[f.key + "_holder"]})` : ""}
                                    {!effectiveAcct.ownerAccounts[f.key + "_bank"] && !effectiveAcct.ownerAccounts[f.key] && <span style={{ color: "#B0B5C1", fontFamily: "inherit" }}>미입력</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <div style={{ fontSize: 9, color: "#065F46", fontWeight: 600, padding: "4px 8px", background: "#ECFDF5", borderRadius: 4 }}>건물 기본 설정을 따르고 있습니다 (읽기전용)</div>
                              {ownerFirstModes[validMode] ? <>{roOwner}{roHm}</> : <>{roHm}{roOwner}</>}
                              <div style={{ fontSize: 10, color: "#5F6577", padding: "4px 0" }}>💡 {flowMap[validMode]}</div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {/* 호실 개별 설정: 편집 가능 */}
                    {isRoomCustom && <>
                      {/* 모드 선택 */}
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: validMode ? 8 : 0 }}>
                        {currentOptions.map(opt => (
                          <button key={opt.id} onClick={() => setRoomAcctMode(opt.id)}
                            style={{ padding: "5px 10px", borderRadius: 6, border: validMode === opt.id ? "1.5px solid #F59E0B" : "1px solid #E0E3E9", background: validMode === opt.id ? "#FEF3C7" : "#FAFBFC", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: validMode === opt.id ? "#92400E" : "#5F6577" }}
                            title={opt.desc}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {/* 계좌 입력 + 요약 */}
                      {validMode && (() => {
                        const editHm = hmUsage && (
                          <div key="hm" style={{ padding: "8px 10px", background: "#F0F4FF", borderRadius: 6, border: "1px solid #BFDBFE" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#2563EB", marginBottom: 4 }}>🏗️ 하우스맨 계좌 <span style={{ color: "#8F95A3", fontWeight: 500 }}>({hmUsage})</span></div>
                            {roomEditMode ? (
                              <input value={effectiveAcct.housemanAccount} onChange={e => setRoomHousemanAcct(e.target.value)}
                                style={{ ...inputStyle, padding: "6px 10px", fontSize: 11, width: "100%", fontFamily: "monospace" }} />
                            ) : (
                              <div style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", fontFamily: "monospace" }}>{effectiveAcct.housemanAccount}</div>
                            )}
                          </div>
                        );
                        const editOwner = ownerFields.length > 0 && (
                          <div key="owner" style={{ padding: "8px 10px", background: "#FFF7ED", borderRadius: 6, border: "1px solid #FED7AA" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>👤 건물주 계좌</div>
                            {ownerFields.map(f => (
                              <div key={f.key} style={{ marginBottom: 4 }}>
                                <div style={{ fontSize: 8, fontWeight: 700, color: "#EA580C", marginBottom: 2 }}>{f.label}</div>
                                {roomEditMode ? (
                                  <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 70px", gap: 4 }}>
                                    <select value={effectiveAcct.ownerAccounts[f.key + "_bank"] || ""} onChange={e => setRoomOwnerAccts(prev => ({ ...prev, [f.key + "_bank"]: e.target.value }))}
                                      style={{ ...inputStyle, padding: "5px 6px", fontSize: 10, cursor: "pointer" }}>
                                      <option value="">은행</option>
                                      {banks.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <input value={effectiveAcct.ownerAccounts[f.key] || ""} onChange={e => setRoomOwnerAccts(prev => ({ ...prev, [f.key]: e.target.value }))}
                                      placeholder="계좌번호" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} />
                                    <input value={effectiveAcct.ownerAccounts[f.key + "_holder"] || ""} onChange={e => setRoomOwnerAccts(prev => ({ ...prev, [f.key + "_holder"]: e.target.value }))}
                                      placeholder="예금주" style={{ ...inputStyle, padding: "5px 8px", fontSize: 10 }} />
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 11, fontWeight: 600, color: "#EA580C", fontFamily: "monospace" }}>
                                    {effectiveAcct.ownerAccounts[f.key + "_bank"] || ""} {effectiveAcct.ownerAccounts[f.key] || ""}{effectiveAcct.ownerAccounts[f.key + "_holder"] ? ` (${effectiveAcct.ownerAccounts[f.key + "_holder"]})` : ""}
                                    {!effectiveAcct.ownerAccounts[f.key + "_bank"] && !effectiveAcct.ownerAccounts[f.key] && <span style={{ color: "#B0B5C1", fontFamily: "inherit" }}>미입력</span>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {ownerFirstModes[validMode] ? <>{editOwner}{editHm}</> : <>{editHm}{editOwner}</>}
                            <div style={{ fontSize: 10, color: "#5F6577", padding: "4px 0" }}>💡 {flowMap[validMode]}</div>
                          </div>
                        );
                      })()}
                    </>}
                  </div>

                  {/* 오른쪽: 입주금 계산 (단기 전용) */}
                  {isDangiRoom && moveInCalc && (
                    <div style={{ padding: "10px 14px", background: "#F0FDF4", borderRadius: 10, border: "1px solid #BBF7D0" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#065F46", marginBottom: 4 }}>💰 입주금 계산</div>
                      <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 10, lineHeight: 1.5 }}>
                        {moveInCalc.type === "single" && (moveInCalc.acctName === "건물주계좌"
                          ? "이 건물은 전체 입주금을 건물주 계좌로 입금합니다."
                          : "이 건물은 전체 입주금을 하우스맨 계좌로 입금합니다."
                        )}
                        {moveInCalc.type === "dual" && validMode === "owner1" && "이 건물은 예치금+임대료는 건물주 계좌, 관리비+공과금은 하우스맨 계좌로 분리 입금합니다."}
                        {moveInCalc.type === "dual" && validMode === "owner2" && "이 건물은 예치금+임대료+관리비는 건물주 계좌, 수도+인터넷은 하우스맨 계좌로 분리 입금합니다."}
                        {moveInCalc.type === "dual_deferred" && "이 건물은 예치금+임대료+관리비는 건물주 계좌로 입금하고, 수도+인터넷은 후불로 정산합니다."}
                      </div>
                      {moveInCalc.type === "single" && (
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "#065F46", marginBottom: 6, padding: "3px 8px", background: "#DCFCE7", borderRadius: 4 }}>{moveInCalc.acctName}</div>
                          {moveInCalc.items.filter(x => x.v > 0).map((x, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0", color: "#374151" }}>
                              <span>{x.l}</span>
                              <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{x.v.toLocaleString()}원</span>
                            </div>
                          ))}
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, color: "#065F46", borderTop: "2px solid #065F46", marginTop: 6, paddingTop: 6 }}>
                            <span>합계</span>
                            <span style={{ fontFamily: "monospace" }}>{moveInCalc.total.toLocaleString()}원</span>
                          </div>
                        </div>
                      )}
                      {(moveInCalc.type === "dual" || moveInCalc.type === "dual_deferred") && (
                        <div>
                          {moveInCalc.accounts.map((acct, ai) => (
                            <div key={ai} style={{ marginBottom: 8 }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: ai === 0 ? "#EA580C" : "#2563EB", marginBottom: 4, padding: "3px 8px", background: ai === 0 ? "#FFF7ED" : "#EFF6FF", borderRadius: 4 }}>{acct.name}</div>
                              {acct.items.filter(x => x.v > 0).map((x, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0", color: "#374151" }}>
                                  <span>{x.l}</span>
                                  <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{x.v.toLocaleString()}원</span>
                                </div>
                              ))}
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: ai === 0 ? "#EA580C" : "#2563EB", borderTop: "1px solid #E5E7EB", marginTop: 3, paddingTop: 3 }}>
                                <span>소계</span>
                                <span style={{ fontFamily: "monospace" }}>{acct.sub.toLocaleString()}원</span>
                              </div>
                            </div>
                          ))}
                          {moveInCalc.type === "dual_deferred" && moveInCalc.deferredSub > 0 && (
                            <div style={{ padding: "6px 8px", background: "#FEF3C7", borderRadius: 4, marginBottom: 8 }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "#92400E", marginBottom: 3 }}>후불 항목</div>
                              {moveInCalc.deferred.filter(x => x.v > 0).map((x, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "1px 0", color: "#92400E" }}>
                                  <span>{x.l}</span>
                                  <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{x.v.toLocaleString()}원</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, color: "#065F46", borderTop: "2px solid #065F46", paddingTop: 6 }}>
                            <span>입주금 합계</span>
                            <span style={{ fontFamily: "monospace" }}>{moveInCalc.total.toLocaleString()}원</span>
                          </div>
                          {moveInCalc.type === "dual_deferred" && <div style={{ fontSize: 10, color: "#92400E", marginTop: 4 }}>※ 수도/인터넷은 후불 정산</div>}
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                );
              })()}

              {/* 입금확인 이름 (뱅크다 자동매칭용) */}
              {(() => {
                const depKey = `${buildingName}_${selectedRoom}`;
                const currentDepName = depositNames[depKey] || "";
                return (
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "#FDF4FF", borderRadius: 10, border: "1px solid #E9D5FF" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#7C3AED", marginBottom: 6 }}>🏦 입금확인 이름 <span style={{ fontSize: 9, fontWeight: 500, color: "#8F95A3" }}>이 이름으로 입금 시 자동 100% 매칭</span></div>
                    {roomEditMode ? (
                      <input value={currentDepName} onChange={e => setDepositNames(prev => ({ ...prev, [depKey]: e.target.value }))}
                        placeholder="입금자명 입력 (예: 건물호실조합, 회사명 등)"
                        style={{ ...inputStyle, padding: "6px 10px", fontSize: 11, width: "100%" }} />
                    ) : (
                      <div style={{ fontSize: 11, fontWeight: 600, color: currentDepName ? "#7C3AED" : "#B0B5C1", padding: "4px 6px", background: "#fff", borderRadius: 5, border: "1px solid #E9D5FF" }}>
                        {currentDepName || "미설정"}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 호실별 담당자 오버라이드 */}
              {(() => {
                return (
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "#F0F4FF", borderRadius: 10, border: "1px solid #BFDBFE" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#2563EB" }}>👤 호실 담당자 <span style={{ fontSize: 9, fontWeight: 500, color: "#8F95A3" }}>건물 기본값 자동 적용 · 호실별 변경 가능</span></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 6 }}>
                      {staffRoles.map(sr => {
                        const bMgr = buildingMgrs[sr.id] || "";
                        const roomMgrKey = `room_${sr.id}_${selectedRoom}`;
                        const roomMgr = ""; // placeholder - no persistent room state yet
                        const isOverridden = roomMgr && roomMgr !== bMgr;
                        return (
                          <div key={sr.id}>
                            <div style={{ fontSize: 8, color: sr.color, fontWeight: 700, marginBottom: 2 }}>{sr.icon} {sr.label}</div>
                            {roomEditMode ? (
                              <select defaultValue={roomMgr || ""} style={{ ...inputStyle, padding: "5px 6px", fontSize: 10, cursor: "pointer", border: isOverridden ? `1.5px solid ${sr.color}` : undefined, background: isOverridden ? sr.color + "10" : undefined }}>
                                <option value="">{bMgr ? `${bMgr} (건물)` : "미배정"}</option>
                                {staffList.filter(s => s.roles.includes(sr.id)).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                              </select>
                            ) : (
                              <div style={{ padding: "4px 6px", background: "#fff", borderRadius: 5, border: isOverridden ? `1.5px solid ${sr.color}` : "1px solid #E0E3E9", fontSize: 10, color: isOverridden ? sr.color : "#5F6577", fontWeight: isOverridden ? 600 : 400 }}>
                                {roomMgr || bMgr || "미배정"}
                                {isOverridden && <span style={{ fontSize: 7, marginLeft: 4, color: sr.color }}>개별</span>}
                                {!roomMgr && bMgr && <span style={{ fontSize: 7, marginLeft: 4, color: "#8F95A3" }}>(건물)</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "space-between" }}>
                <div>
                  {!roomEditMode && (
                    <button onClick={() => setRoomDeleteStep(1)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>🗑 호실 삭제</button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {roomEditMode ? (
                    <>
                      <button onClick={() => setRoomEditMode(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                      <button onClick={() => {
                        const g = (id) => document.getElementById(id)?.value ?? "";
                        const updated = {
                          roomType: g("re-roomType"), area: g("re-area"), commFee: g("re-commFee"),
                          deposit: g("re-deposit"), rent: g("re-rent"), mgmt: g("re-mgmt"),
                          water: g("re-water"), internet: g("re-internet"), cleanFee: g("re-cleanFee"),
                          elecNo: g("re-elecNo"), gasNo: g("re-gasNo"), specialTerms: g("re-specialTerms"), specialTermsBottom: g("re-specialTermsBottom"),
                        };
                        const rmKey = `${buildingName}_${selectedRoom}`;
                        roomMasterData[rmKey] = { ...(roomMasterData[rmKey] || {}), ...updated };
                        updateBD({ [`room_${selectedRoom}`]: updated });
                        setRoomEditMode(false);
                      }} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>💾 저장</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setRoomEditMode(true)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #3B82F6", background: "#EFF6FF", color: "#2563EB", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✏️ 호실 정보 수정</button>
                      <button onClick={() => setSelectedRoom(null)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>닫기</button>
                    </>
                  )}
                </div>
              </div>

            {/* 지난 임차인 이력 */}
            {(() => {
              const historyKey = `${buildingName}_${selectedRoom}`;
              const history = pastTenantsData[historyKey] || [];
              if (history.length === 0) return null;
              return (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#6366F1", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #C7D2FE", display: "flex", alignItems: "center", gap: 6 }}>
                    📜 지난 임차인 이력 <span style={{ fontSize: 10, fontWeight: 500, color: "#8F95A3" }}>{history.length}명</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {history.map((h, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: "#FAFBFC", border: "1px solid #E8ECF0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#6366F1" }}>{i + 1}</div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{h.name}</span>
                              <span style={{ fontSize: 10, color: "#5F6577" }}>{h.phone || ""}</span>
                              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, fontWeight: 600,
                                background: h.reason === "만기퇴실" ? "#D1FAE5" : "#FEF3C7",
                                color: h.reason === "만기퇴실" ? "#065F46" : "#92400E" }}>{h.reason}</span>
                              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, fontWeight: 600,
                                background: h.settlement === "정산완료" ? "#EFF6FF" : "#FEF2F2",
                                color: h.settlement === "정산완료" ? "#2563EB" : "#DC2626" }}>{h.settlement}</span>
                            </div>
                            <div style={{ fontSize: 9, color: "#8F95A3", marginTop: 1 }}>
                              {h.moveIn} ~ {h.moveOut} · 보증금 {fmt(h.deposit)} · 월세 {fmt(h.rent)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, color: "#8F95A3" }}>{h.phone}</span>
                          <button onClick={() => {
                            const lines = [
                              `퇴실정산서`,
                              `━━━━━━━━━━━━━━━━━━━━━━━━`,
                              `건물: ${buildingName}  호실: ${selectedRoom}호`,
                              `입주자: ${h.name}  연락처: ${h.phone || "-"}`,
                              ``,
                              `입주일: ${h.moveIn || "-"}`,
                              `퇴실일: ${h.moveOut || "-"}`,
                              `퇴실사유: ${h.reason || "-"}`,
                              ``,
                              `보증금: ${fmt(h.deposit)}원`,
                              `월세: ${fmt(h.rent)}원`,
                              ``,
                              `정산결과: ${h.settlement || "-"}`,
                              `━━━━━━━━━━━━━━━━━━━━━━━━`,
                              `하우스맨 건물관리 시스템`,
                            ];
                            const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `퇴실정산서_${buildingName}_${selectedRoom}_${h.name}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                            style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #C7D2FE", background: "#EDE9FE", color: "#6366F1", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                            📄 퇴실정산서
                          </button>
                          <button onClick={() => {
                            const lines = [
                              `임대차 계약서`,
                              `━━━━━━━━━━━━━━━━━━━━━━━━`,
                              `건물: ${buildingName}  호실: ${selectedRoom}호`,
                              `임차인: ${h.name}  연락처: ${h.phone || "-"}`,
                              ``,
                              `계약기간: ${h.moveIn || "-"} ~ ${h.moveOut || "-"}`,
                              `보증금: ${fmt(h.deposit)}원`,
                              `월세: ${fmt(h.rent)}원`,
                              ``,
                              `퇴실사유: ${h.reason || "-"}`,
                              `━━━━━━━━━━━━━━━━━━━━━━━━`,
                              `하우스맨 건물관리 시스템`,
                            ];
                            const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `계약서_${buildingName}_${selectedRoom}_${h.name}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                            style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                            📋 계약서
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 계약(재계약) 이력 */}
            {(() => {
              const historyKey = `${buildingName}_${selectedRoom}`;
              const records = (pastTenantsData[historyKey] || []).filter(r => r.reason === "재계약");
              if (records.length === 0) return null;
              return (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #BFDBFE", display: "flex", alignItems: "center", gap: 6 }}>
                    📋 재계약 이력 <span style={{ fontSize: 10, fontWeight: 500, color: "#8F95A3" }}>{records.length}건</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {records.map((rec, i) => (
                      <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "#F0F9FF", border: "1px solid #BFDBFE" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700 }}>{rec.name}</span>
                          <span style={{ fontSize: 10, color: "#8F95A3" }}>재계약일: {rec.renewedAt || "—"}</span>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#5F6577", flexWrap: "wrap" }}>
                          <span>입주: {rec.moveIn || "—"}</span>
                          <span>만기: {rec.expiry || rec.moveOut || "—"}</span>
                          <span>보증금: {(rec.deposit || 0).toLocaleString()}원</span>
                          <span>월세: {(rec.rent || 0).toLocaleString()}원</span>
                          {rec.mgmt > 0 && <span>관리비: {(rec.mgmt || 0).toLocaleString()}원</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Room Delete Confirmation */}
            {roomDeleteStep > 0 && (
              <div style={{ marginTop: 16, padding: "16px 20px", borderRadius: 12, border: "2px solid #FECACA", background: "#FEF2F2" }}>
                {roomDeleteStep === 1 && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#991B1B", marginBottom: 8 }}>⚠️ {selectedRoom}호를 삭제하시겠습니까?</div>
                    <div style={{ fontSize: 12, color: "#B91C1C", marginBottom: 12, lineHeight: 1.6 }}>
                      호실의 기본정보, 사진, 기준금액, 고객번호가 모두 삭제됩니다.
                      {tenant && <><br /><strong>현재 입주자 ({tenant.name})가 있습니다. 입주자 정보도 함께 삭제됩니다.</strong></>}
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => setRoomDeleteStep(0)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                      <button onClick={() => setRoomDeleteStep(2)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>삭제 진행</button>
                    </div>
                  </>
                )}
                {roomDeleteStep === 2 && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#7F1D1D", marginBottom: 8 }}>🚨 되돌릴 수 없습니다!</div>
                    <div style={{ fontSize: 12, color: "#991B1B", marginBottom: 6 }}>
                      {buildingName} {selectedRoom}호의 모든 데이터가 영구 삭제됩니다.
                    </div>
                    <div style={{ padding: "8px 12px", background: "#fff", borderRadius: 8, border: "1px solid #FECACA", marginBottom: 12, fontSize: 11, color: "#991B1B" }}>
                      삭제 항목: 호실정보 · 사진 {photoCount}장 · 기준금액 · 전기/가스 고객번호{tenant ? ` · 입주자 (${tenant.name})` : ""}
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => setRoomDeleteStep(0)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>아니요</button>
                      <button onClick={() => { setRoomDeleteStep(0); setSelectedRoom(null); }} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#7F1D1D", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>🗑 영구 삭제</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>
        );
      })()}

      {/* 퇴실자 입주/퇴실 사진 */}
      {(() => {
        const pastKeys = Object.keys(pastTenantsData).filter(k => k.startsWith(buildingName + "_"));
        if (pastKeys.length === 0) return null;
        return (
          <Card style={{ marginBottom: 20 }}>
            <SectionTitle sub={`${pastKeys.length}건 퇴실 기록`}>📷 퇴실자 사진</SectionTitle>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E8ECF0" }}>
                  {["호실","퇴실자","퇴실일","입주사진","입주체크사진","퇴실사진",""].map((h, i) => (
                    <th key={i} style={{ padding: "8px 10px", textAlign: i >= 3 ? "center" : "left", fontSize: 11, fontWeight: 700, color: "#8F95A3" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pastKeys.map(k => {
                  const rawRecords = pastTenantsData[k];
                  const records = Array.isArray(rawRecords) ? rawRecords : [rawRecords].filter(Boolean);
                  if (records.length === 0) return null;
                  const last = records[records.length - 1];
                  const room = k.split("_")[1];
                  const miCount = (last?.moveInPhotos || []).length;
                  const mcCount = (last?.moveInCheckPhotos || []).length;
                  const moCount = (last?.moveOutPhotos || []).length;
                  return (
                    <tr key={k} style={{ borderBottom: "1px solid #F0F2F5" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "8px 10px", fontWeight: 700 }}>{room}호</td>
                      <td style={{ padding: "8px 10px" }}>{last?.name}</td>
                      <td style={{ padding: "8px 10px", fontSize: 11, color: "#DC2626" }}>{last?.moveOut || "—"}</td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        {miCount > 0 ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", padding: "2px 8px", borderRadius: 4, background: "#D1FAE5" }}>🏠 {miCount}장</span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        {mcCount > 0 ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#EA580C", padding: "2px 8px", borderRadius: 4, background: "#FFF7ED" }}>📋 {mcCount}장</span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        {moCount > 0 ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", padding: "2px 8px", borderRadius: 4, background: "#FEE2E2" }}>🚪 {moCount}장</span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        {(miCount + mcCount + moCount) > 0 && (
                          <button onClick={() => setPhotoViewTarget({ key: k, room, records })}
                            style={{ padding: "4px 12px", borderRadius: 6, border: "1.5px solid #3B82F6", background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            👁️ 보기
                          </button>
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

      {/* AS */}
      {bldgAS.length > 0 && (
        <Card>
          <SectionTitle sub="이 건물 AS 이력">🔧 AS 현황</SectionTitle>
          <Table
            columns={[
              { label: "접수일", key: "date" },
              { label: "호실", key: "room" },
              { label: "내용", key: "content" },
              { label: "긴급도", render: r => <StatusBadge status={r.priority} /> },
              { label: "상태", render: r => <StatusBadge status={r.status} /> },
            ]}
            data={bldgAS}
          />
        </Card>
      )}
      {/* 퇴실자 사진 보기 팝업 */}
      {photoViewTarget && (() => {
        const { room, records: rawRec } = photoViewTarget;
        const records = Array.isArray(rawRec) ? rawRec : [rawRec].filter(Boolean);
        if (records.length === 0) return null;
        const last = records[records.length - 1];
        const miPhotos = last?.moveInPhotos || [];
        const mcPhotos = last?.moveInCheckPhotos || [];
        const moPhotos = last?.moveOutPhotos || [];
        const renderPhoto = (src, idx, icon) => (
          <div key={idx} style={{ aspectRatio: "1", borderRadius: 8, border: "1.5px solid #E0E3E9", overflow: "hidden", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {src && src.startsWith("data:image/") && !src.includes("placeholder") ? (
              <img src={src} alt={`사진 ${idx+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 20 }}>{icon}</span>
            )}
          </div>
        );
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setPhotoViewTarget(null)}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: 16, padding: 24, width: isMobile ? "95%" : 700, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23" }}>{buildingName} {room}호 — {last.name}</div>
                  <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>입주: {last.moveIn || "—"} → 퇴실: {last.moveOut || "—"}</div>
                </div>
                <button onClick={() => setPhotoViewTarget(null)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>✕</button>
              </div>

              {miPhotos.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#059669", marginBottom: 8, paddingBottom: 6, borderBottom: "2px solid #D1FAE5" }}>
                    🏠 입주사진 ({miPhotos.length}장) <span style={{ fontSize: 10, fontWeight: 600, color: "#8F95A3" }}>{last.moveIn || ""}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                    {miPhotos.map((src, i) => renderPhoto(src, i, "🏠"))}
                  </div>
                </div>
              )}

              {/* 시작 → 끝 비교: 입주체크사진 + 퇴실사진 */}
              {(mcPhotos.length > 0 || moPhotos.length > 0) && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1D23", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid #E8ECF0" }}>
                    📸 호실 상태 비교 (시작 → 끝)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ border: "2px solid #FED7AA", borderRadius: 12, padding: 12, background: "#FFF7ED" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#EA580C", marginBottom: 8 }}>📋 입주체크사진 (시작) <span style={{ fontSize: 9, color: "#8F95A3", fontWeight: 600 }}>{mcPhotos.length}장</span></div>
                      {mcPhotos.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                          {mcPhotos.map((src, i) => renderPhoto(src, i, "📋"))}
                        </div>
                      ) : (
                        <div style={{ padding: "16px 0", textAlign: "center", color: "#B0B5C1", fontSize: 11 }}>사진 없음</div>
                      )}
                    </div>
                    <div style={{ border: "2px solid #FECACA", borderRadius: 12, padding: 12, background: "#FEF2F2" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", marginBottom: 8 }}>🚪 퇴실사진 (끝) <span style={{ fontSize: 9, color: "#8F95A3", fontWeight: 600 }}>{moPhotos.length}장</span></div>
                      {moPhotos.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                          {moPhotos.map((src, i) => renderPhoto(src, i, "🚪"))}
                        </div>
                      ) : (
                        <div style={{ padding: "16px 0", textAlign: "center", color: "#B0B5C1", fontSize: 11 }}>사진 없음</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 비교 섹션 없이 퇴실사진만 있는 경우 (입주체크사진이 없을 때는 위 비교 블록에서 처리) */}

              {miPhotos.length === 0 && mcPhotos.length === 0 && moPhotos.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "#8F95A3", fontSize: 13 }}>등록된 사진이 없습니다</div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
