import React, { useState, useEffect, useMemo } from 'react';
import { asItems, buildingFloors, roomMasterData } from '@/data';
import { getRoomType } from '@/config';
import { useLocalStorage } from '@/utils/useLocalStorage';
import { initialStaffMembers } from '@/config';
import { useIsMobile, fmt, feeLabel } from '@/utils';
import { Card } from '@/components';
import { rtCfg } from '@/components/RoomTypeBadge';

import { BuildingInfoCard } from './components/BuildingInfoCard';
import { BuildingAccountSection } from './components/BuildingAccountSection';
import { BuildingStaffSection } from './components/BuildingStaffSection';
import { RoomGrid } from './components/RoomGrid';
import { RoomDetailPanel } from './components/RoomDetailPanel';
import { BuildingTypeEditor } from './components/BuildingTypeEditor';

const BUILDING_TYPES = ["단기", "일반임대", "근생", "관리사무소", "기업시설관리"];

interface BuildingDetailPageInnerProps {
  buildingName: string;
  onBack: () => void;
  buildingAccounts?: Record<string, any>;
  setBuildingAccounts?: (fn: any) => void;
  customBuildings?: Record<string, any>[];
  allBuildings?: Record<string, any>[];
  setAllBuildings?: (fn: any) => void;
  buildingData?: Record<string, any>;
  setBuildingData?: (fn: any) => void;
  activeTenants?: Record<string, any>[];
  activeVacancies?: Record<string, any>[];
  pastTenantsData?: Record<string, any>;
  isLoading?: boolean;
}

export const BuildingDetailPageInner: React.FC<BuildingDetailPageInnerProps> = ({
  buildingName, onBack,
  buildingAccounts = {}, setBuildingAccounts,
  customBuildings = [], allBuildings = [], setAllBuildings,
  buildingData = {}, setBuildingData,
  activeTenants = [], activeVacancies = [],
  pastTenantsData = {},
}) => {
  const isMobile = useIsMobile();
  const [staffList] = useLocalStorage("hm_staffList", initialStaffMembers);
  const [depositNames, setDepositNames] = useLocalStorage("hm_depositNames", {});
  const rawDetail = (buildingFloors as Record<string, any>)[buildingName];
  const bldg = allBuildings.find(b => b.name === buildingName) || customBuildings.find(b => b.name === buildingName)
    || (rawDetail ? { name: buildingName, rooms: rawDetail.floors ? Object.values(rawDetail.floors).flat().length : 0, occupied: 0, type: "단기", feeType: "pct", fee: rawDetail.fee || 0, fixedFee: 0, special: null, parkingTotal: 0 } : null);
  const customDetail = (!rawDetail && bldg?._custom && bldg._regForm) ? (() => {
    const floors: Record<string, string[]> = {};
    bldg._regForm.roomList.forEach((r: any) => {
      const floorMatch = r.room.match(/^([A-Za-z]*\d*?)(\d{2})$/);
      const floorKey = floorMatch ? floorMatch[1] : r.room.slice(0, -2) || "1";
      if (!floors[floorKey]) floors[floorKey] = [];
      floors[floorKey].push(r.room);
    });
    return { floors, owner: bldg._regForm.ownerName || "", ownerPhone: bldg._regForm.ownerPhone || "", start: bldg._regForm.startDate || "" };
  })() : null;
  const detail = rawDetail || customDetail;

  // Persistent data: buildingData[buildingName]
  const saved = buildingData[buildingName] || {};
  const updateBD = (patch: Record<string, any>) => setBuildingData && setBuildingData((prev: Record<string, any>) => ({
    ...prev,
    [buildingName]: { ...(prev[buildingName] || {}), ...patch }
  }));

  // Building types (persistent)
  const initTypes = () => {
    if (saved.types && Array.isArray(saved.types) && saved.types.length > 0) return saved.types;
    const raw = bldg?.type || "단기";
    const validTypes = BUILDING_TYPES;
    const typeMap: Record<string, string> = { "주택": "단기" };
    return raw.split("+").map((s: string) => s.trim()).map((t: string) => typeMap[t] || (validTypes.includes(t) ? t : "단기"));
  };
  const [detailBuildingTypes, _setDetailBuildingTypes] = useState<string[]>(initTypes);
  const setDetailBuildingTypes = (v: string[]) => { _setDetailBuildingTypes(v); updateBD({ types: v }); };

  // Basic info fields (persistent)
  const [bdStartDate, _setBdStartDate] = useState(saved.startDate ?? detail?.start ?? "");
  const setBdStartDate = (v: string) => { _setBdStartDate(v); updateBD({ startDate: v }); };
  const [bdEntrancePw, _setBdEntrancePw] = useState(saved.entrancePw ?? "");
  const setBdEntrancePw = (v: string) => { _setBdEntrancePw(v); updateBD({ entrancePw: v }); };
  const [bdAddress, _setBdAddress] = useState(saved.address ?? detail?.address ?? "");
  const setBdAddress = (v: string) => { _setBdAddress(v); updateBD({ address: v }); };
  useEffect(() => { if (!saved.address && bdAddress) updateBD({ address: bdAddress }); }, []);
  const [bdRoadAddress, _setBdRoadAddress] = useState(saved.roadAddress ?? "");
  const setBdRoadAddress = (v: string) => { _setBdRoadAddress(v); updateBD({ roadAddress: v }); };
  const [bdCctvCount, _setBdCctvCount] = useState(saved.cctvCount ?? "");
  const setBdCctvCount = (v: string) => { _setBdCctvCount(v); updateBD({ cctvCount: v }); };
  const [bdParkingTotal, _setBdParkingTotal] = useState(saved.parkingTotal ?? bldg?.parkingTotal ?? "");
  const setBdParkingTotal = (v: string) => { _setBdParkingTotal(v); updateBD({ parkingTotal: v }); };

  // Owner info (persistent)
  const defaultOwners = [{ name: detail?.owner || "", ssn: "", phone: detail?.ownerPhone || "", address: "", settlement: "" }];
  const [bdOwners, _setBdOwners] = useState(saved.owners ?? defaultOwners);
  const setBdOwners = (v: Record<string, any>[]) => { _setBdOwners(v); updateBD({ owners: v }); };
  const setBdOwnerField = (idx: number, field: string, value: string) => {
    const updated = bdOwners.map((o: any, i: number) => i === idx ? { ...o, [field]: value } : o);
    setBdOwners(updated);
  };
  const addBdOwner = () => { if (bdOwners.length < 4) setBdOwners([...bdOwners, { name: "", ssn: "", phone: "", address: "", settlement: "" }]); };
  const removeBdOwner = (idx: number) => { if (bdOwners.length > 1) setBdOwners(bdOwners.filter((_: any, i: number) => i !== idx)); };
  const [emails, _setEmails] = useState<string[]>(saved.emails ?? [""]);
  const setEmails = (v: string[]) => { _setEmails(v); updateBD({ emails: v }); };

  // Staff & contract conditions (persistent)
  const [detailFeeType, _setDetailFeeType] = useState(saved.feeType ?? bldg?.feeType ?? "pct");
  const setDetailFeeType = (v: string) => { _setDetailFeeType(v); updateBD({ feeType: v }); };
  const [bdFeeValue, _setBdFeeValue] = useState(saved.feeValue ?? (bldg?.feeType === "pct" ? (bldg.fee * 100) + "%" : bldg?.fixedFee ? bldg.fixedFee.toLocaleString() : ""));
  const setBdFeeValue = (v: string) => { _setBdFeeValue(v); updateBD({ feeValue: v }); };
  const [bdPenaltyOwner, _setBdPenaltyOwner] = useState(saved.penaltyOwner ?? "하우스맨");
  const setBdPenaltyOwner = (v: string) => { _setBdPenaltyOwner(v); updateBD({ penaltyOwner: v }); };
  const [bdSettlementDates, _setBdSettlementDates] = useState<string[]>(saved.settlementDates ?? ["말일"]);
  const setBdSettlementDates = (v: string[]) => { _setBdSettlementDates(v); updateBD({ settlementDates: v }); };
  const addSettlementDate = () => { if (bdSettlementDates.length < 3) setBdSettlementDates([...bdSettlementDates, "말일"]); };
  const removeSettlementDate = (idx: number) => { if (bdSettlementDates.length > 1) setBdSettlementDates(bdSettlementDates.filter((_: string, i: number) => i !== idx)); };
  const updateSettlementDate = (idx: number, val: string) => { const u = [...bdSettlementDates]; u[idx] = val; setBdSettlementDates(u); };
  const [bdVatType, _setBdVatType] = useState(saved.vatType ?? "포함");
  const setBdVatType = (v: string) => { _setBdVatType(v); updateBD({ vatType: v }); };
  const [bdMgmtType, _setBdMgmtType] = useState(saved.mgmtType ?? "변동관리비");
  const setBdMgmtType = (v: string) => { _setBdMgmtType(v); updateBD({ mgmtType: v }); };
  const [bdStandardLease, _setBdStandardLease] = useState(saved.standardLease ?? "사용");
  const setBdStandardLease = (v: string) => { _setBdStandardLease(v); updateBD({ standardLease: v }); };
  const [bdVisitCycle, _setBdVisitCycle] = useState(saved.visitCycle ?? "월1회");
  const setBdVisitCycle = (v: string) => { _setBdVisitCycle(v); updateBD({ visitCycle: v }); };
  const [buildingMgrs, _setBuildingMgrs] = useState<Record<string, string>>(saved.managers ?? { internal: "", external: "", collection: "", contract: "", general: "" });
  const setBuildingMgrs = (v: Record<string, string>) => { _setBuildingMgrs(v); updateBD({ managers: v }); };
  const setBldgMgr = (roleId: string, val: string) => { const u = { ...buildingMgrs, [roleId]: val }; setBuildingMgrs(u); };

  // Vendors (persistent)
  const emptyVendorData = { company: "", phone: "", contact: "", contactPhone: "", manager: "", managerPhone: "", managerNote: "" };
  const [vendorEnabled, _setVendorEnabled] = useState<Record<string, boolean>>(saved.vendorEnabled ?? { fire: false, elevator: false, mechElevator: false, cleaning: false, disinfect: false, custom1: false, custom2: false });
  const setVendorEnabled = (v: Record<string, boolean>) => { _setVendorEnabled(v); updateBD({ vendorEnabled: v }); };
  const toggleDetailVendor = (key: string) => { const u = { ...vendorEnabled, [key]: !vendorEnabled[key] }; setVendorEnabled(u); };
  const [fireMode, _setFireMode] = useState(saved.fireMode ?? "direct");
  const setFireMode = (v: string) => { _setFireMode(v); updateBD({ fireMode: v }); };
  const [bdVendors, _setBdVendors] = useState<Record<string, any>>(saved.vendors ?? { fire: { ...emptyVendorData }, elevator: { ...emptyVendorData }, mechElevator: { ...emptyVendorData }, cleaning: { ...emptyVendorData }, disinfect: { ...emptyVendorData }, custom1: { label: "", ...emptyVendorData }, custom2: { label: "", ...emptyVendorData } });
  const setBdVendor = (key: string, field: string, value: string) => { const u = { ...bdVendors, [key]: { ...bdVendors[key], [field]: value } }; _setBdVendors(u); updateBD({ vendors: u }); };
  const [bdApprovalDate, _setBdApprovalDate] = useState(saved.approvalDate ?? "");
  const setBdApprovalDate = (v: string) => { _setBdApprovalDate(v); updateBD({ approvalDate: v }); };

  // Notes (persistent)
  const [bdNotes, _setBdNotes] = useState(saved.notes ?? "");
  const setBdNotes = (v: string) => { _setBdNotes(v); updateBD({ notes: v }); };

  // Facility checklist (persistent)
  const DEFAULT_CHECKLIST = ["복도 조명", "옥상 배수구", "CCTV 작동", "소방시설", "주차장"];
  const [bdFacilityChecklist, _setBdFacilityChecklist] = useState<string[]>(saved.facilityChecklist ?? DEFAULT_CHECKLIST);
  const setBdFacilityChecklist = (v: string[]) => { _setBdFacilityChecklist(v); updateBD({ facilityChecklist: v }); };
  const [newChecklistItem, setNewChecklistItem] = useState("");

  // UI-only state
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [roomEditMode, setRoomEditMode] = useState(false);
  const [roomDeleteStep, setRoomDeleteStep] = useState(0);
  const [roomTab, setRoomTab] = useState("info");
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [addRoomFloor, setAddRoomFloor] = useState("");
  const [addRoomNum, setAddRoomNum] = useState("");
  const [sec1Edit, setSec1Edit] = useState(false);
  const [sec2Edit, setSec2Edit] = useState(false);
  const [secAcctEdit, setSecAcctEdit] = useState(false);
  const [photoViewTarget, setPhotoViewTarget] = useState<Record<string, any> | null>(null);
  const [sec3Edit, setSec3Edit] = useState(false);
  const [sec4Edit, setSec4Edit] = useState(false);
  const [sec1Open, setSec1Open] = useState(true);
  const [sec2Open, setSec2Open] = useState(false);
  const [sec3Open, setSec3Open] = useState(false);
  const [sec4Open, setSec4Open] = useState(false);
  const [sec5Open, setSec5Open] = useState(false);
  const [sec6Open, setSec6Open] = useState(false);
  const [secAcctOpen, setSecAcctOpen] = useState(false);
  const [notesEdit, setNotesEdit] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);
  const [showDetailPreview, setShowDetailPreview] = useState(false);

  // Computed values (must be before conditional return)
  const bldgTenants = useMemo(() => activeTenants.filter(t => t.building === buildingName), [activeTenants, buildingName]);
  const bldgVacancies = useMemo(() => activeVacancies.filter(v => v.building === buildingName), [activeVacancies, buildingName]);
  const bldgAS = useMemo(() => asItems.filter((a: any) => a.building === buildingName), [buildingName]);
  const overdueCount = useMemo(() => bldgTenants.filter(t => t.overdue > 0).length, [bldgTenants]);
  const totalOverdue = useMemo(() => bldgTenants.reduce((s, t) => s + t.overdue, 0), [bldgTenants]);
  const allRooms = useMemo(() => detail?.floors ? Object.values(detail.floors).flat() : [], [detail]);
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { "단기": 0, "일반임대": 0, "근생": 0, "관리사무소": 0 };
    (allRooms as string[]).forEach(r => { const rt = getRoomType(buildingName, r); if (counts[rt] !== undefined) counts[rt]++; });
    return counts;
  }, [allRooms, buildingName]);

  if (!bldg || !detail) return <div>건물 정보를 찾을 수 없습니다.</div>;

  const getRoomStatus = (room: string) => {
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
            {detail.owner && `건물주: ${detail.owner}`}{feeLabel(bldg as any) && ` · ${feeLabel(bldg as any)}`}{detail.start && ` · 관리시작 ${detail.start}`}
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

      {/* Section 1 & 2: Basic Info + Owner Info */}
      <BuildingInfoCard
        sec1Open={sec1Open} setSec1Open={setSec1Open} sec1Edit={sec1Edit} setSec1Edit={setSec1Edit}
        detailBuildingTypes={detailBuildingTypes} setDetailBuildingTypes={setDetailBuildingTypes}
        bdStartDate={bdStartDate} setBdStartDate={setBdStartDate}
        bdEntrancePw={bdEntrancePw} setBdEntrancePw={setBdEntrancePw}
        bdAddress={bdAddress} setBdAddress={setBdAddress}
        bdRoadAddress={bdRoadAddress} setBdRoadAddress={setBdRoadAddress}
        bdCctvCount={bdCctvCount} setBdCctvCount={setBdCctvCount}
        bdParkingTotal={bdParkingTotal} setBdParkingTotal={setBdParkingTotal}
        sec2Open={sec2Open} setSec2Open={setSec2Open} sec2Edit={sec2Edit} setSec2Edit={setSec2Edit}
        bdOwners={bdOwners} addBdOwner={addBdOwner} removeBdOwner={removeBdOwner} setBdOwnerField={setBdOwnerField}
      />

      {/* Account & Contract Message Section */}
      <BuildingAccountSection
        isMobile={isMobile} buildingName={buildingName}
        detailBuildingTypes={detailBuildingTypes}
        buildingAccounts={buildingAccounts} setBuildingAccounts={setBuildingAccounts}
        saved={saved} updateBD={updateBD}
        secAcctOpen={secAcctOpen} setSecAcctOpen={setSecAcctOpen}
        secAcctEdit={secAcctEdit} setSecAcctEdit={setSecAcctEdit}
      />

      {/* Staff, Vendors, Notes, Checklist Sections */}
      <BuildingStaffSection
        isMobile={isMobile} detailBuildingTypes={detailBuildingTypes}
        sec3Open={sec3Open} setSec3Open={setSec3Open} sec3Edit={sec3Edit} setSec3Edit={setSec3Edit}
        staffList={staffList} buildingMgrs={buildingMgrs} setBldgMgr={setBldgMgr}
        detailFeeType={detailFeeType} setDetailFeeType={setDetailFeeType}
        bdFeeValue={bdFeeValue} setBdFeeValue={setBdFeeValue}
        bdPenaltyOwner={bdPenaltyOwner} setBdPenaltyOwner={setBdPenaltyOwner}
        bdSettlementDates={bdSettlementDates} addSettlementDate={addSettlementDate}
        removeSettlementDate={removeSettlementDate} updateSettlementDate={updateSettlementDate}
        setBdSettlementDates={setBdSettlementDates}
        bdVatType={bdVatType} setBdVatType={setBdVatType}
        bdMgmtType={bdMgmtType} setBdMgmtType={setBdMgmtType}
        bdStandardLease={bdStandardLease} setBdStandardLease={setBdStandardLease}
        bdVisitCycle={bdVisitCycle} setBdVisitCycle={setBdVisitCycle}
        emails={emails} setEmails={setEmails}
        sec4Open={sec4Open} setSec4Open={setSec4Open} sec4Edit={sec4Edit} setSec4Edit={setSec4Edit}
        vendorEnabled={vendorEnabled} toggleDetailVendor={toggleDetailVendor}
        fireMode={fireMode} setFireMode={setFireMode}
        bdVendors={bdVendors} setBdVendor={setBdVendor}
        bdApprovalDate={bdApprovalDate} setBdApprovalDate={setBdApprovalDate}
        sec5Open={sec5Open} setSec5Open={setSec5Open} notesEdit={notesEdit} setNotesEdit={setNotesEdit}
        bdNotes={bdNotes} setBdNotes={setBdNotes}
        sec6Open={sec6Open} setSec6Open={setSec6Open}
        bdFacilityChecklist={bdFacilityChecklist} setBdFacilityChecklist={setBdFacilityChecklist}
        newChecklistItem={newChecklistItem} setNewChecklistItem={setNewChecklistItem}
      />

      {/* Floor Map */}
      <RoomGrid
        buildingName={buildingName} detail={detail}
        selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom}
        setRoomEditMode={setRoomEditMode} setRoomDeleteStep={setRoomDeleteStep} setRoomTab={setRoomTab}
        showAddRoom={showAddRoom} setShowAddRoom={setShowAddRoom}
        addRoomFloor={addRoomFloor} setAddRoomFloor={setAddRoomFloor}
        addRoomNum={addRoomNum} setAddRoomNum={setAddRoomNum}
        getRoomStatus={getRoomStatus} floorKeys={floorKeys}
      />

      {/* Room Detail Panel */}
      {selectedRoom && (
        <RoomDetailPanel
          isMobile={isMobile} buildingName={buildingName}
          selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom}
          roomEditMode={roomEditMode} setRoomEditMode={setRoomEditMode}
          roomDeleteStep={roomDeleteStep} setRoomDeleteStep={setRoomDeleteStep}
          roomTab={roomTab} setRoomTab={setRoomTab}
          saved={saved} updateBD={updateBD}
          bldgTenants={bldgTenants} bldgVacancies={bldgVacancies}
          pastTenantsData={pastTenantsData}
          detailBuildingTypes={detailBuildingTypes}
          buildingAccounts={buildingAccounts} setBuildingAccounts={setBuildingAccounts}
          buildingMgrs={buildingMgrs} staffList={staffList}
          depositNames={depositNames} setDepositNames={setDepositNames}
        />
      )}

      {/* Modals, Past Tenant Photos, AS, Photo View */}
      <BuildingTypeEditor
        isMobile={isMobile} buildingName={buildingName}
        bldg={bldg} detail={detail}
        detailBuildingTypes={detailBuildingTypes}
        buildingAccounts={buildingAccounts}
        buildingMgrs={buildingMgrs} bdMgmtType={bdMgmtType}
        typeCounts={typeCounts} overdueCount={overdueCount}
        bldgTenants={bldgTenants} bldgVacancies={bldgVacancies}
        bldgAS={bldgAS} pastTenantsData={pastTenantsData}
        vendorEnabled={vendorEnabled} floorKeys={floorKeys}
        getRoomStatus={getRoomStatus}
        showDetailPreview={showDetailPreview} setShowDetailPreview={setShowDetailPreview}
        deleteStep={deleteStep} setDeleteStep={setDeleteStep} onBack={onBack}
        photoViewTarget={photoViewTarget} setPhotoViewTarget={setPhotoViewTarget}
      />
    </div>
  );
};
