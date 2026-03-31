// @ts-nocheck
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { asItems } from '../data';
import { staffRoles, initialStaffMembers } from '../config';
import { useLocalStorage } from '../utils/useLocalStorage';
import { insertBuilding, insertRooms } from '../lib/supabaseData';
import { modeOptions, ownerFieldCfg, housemanUsageMap, ownerFirstModes, flowMap, banks, acctTypeBg, acctTypeColor, defaultHousemanAccount } from '../config/accountConfig';
import { useIsMobile, fmt, feeLabel } from '../utils';
import { SearchInput, matchKorean } from '../components/SearchInput';
import { Card, SectionTitle, RoomFormSection } from '../components';
import { inputStyle } from '../components/Field';
import { BuildingTypeCards, BuildingInfoSection, OwnerSection, SettlementBillingSection, DocumentSection } from '../components/BuildingFormSections';
import { useMyBuildings } from '../hooks/useMyBuildings';
const emptyVendor = (withManager) => ({
  company: "", phone: "", contact: "", contactPhone: "",
  ...(withManager ? { manager: "", managerPhone: "", managerNote: "" } : {}),
});

const initialRegForm = {
  name: "", address: "",
  isShortTermRental: false, isLongTermRental: false, isCommercial: false, isManagementAgency: false, isCorporateFacility: false,
  feeType: "pct", fee: "", fixedFee: "",
  owners: [{ name: "", phone: "", ssn: "", address: "", settlement: "" }],
  startDate: "", approvalDate: "", entrancePw: "",
  internalMgr: "", externalMgr: "", collectionMgr: "", contractMgr: "", generalMgr: "",
  penaltyOwner: "건물주", vatType: "포함", standardLease: "사용",
  memo: "", cctvCount: "", parkingTotal: "", roadAddress: "",
  email: "",
  // 건물 계좌 정보 (건물유형에서 자동 파생)
  acctMode1: "", housemanAccount1: defaultHousemanAccount, ownerAccounts1: {},
  acctMode2: "", housemanAccount2: defaultHousemanAccount, ownerAccounts2: {},
  acctMode3: "", housemanAccount3: defaultHousemanAccount, ownerAccounts3: {},
  // 순회주기
  visitCycle: "",
  // 협력업체 활성화 체크박스
  vendorEnabled: { fire: false, elevator: false, mechElevator: false, cleaning: false, disinfect: false, custom1: false, custom2: false },
  // 협력업체
  vendors: {
    fire: emptyVendor(true),
    elevator: emptyVendor(true),
    mechElevator: emptyVendor(true),
    cleaning: emptyVendor(false),
    disinfect: emptyVendor(false),
    custom1: { label: "", ...emptyVendor(false) },
    custom2: { label: "", ...emptyVendor(false) },
  },
  // 건물 특이사항
  buildingNotes: "",
  // ── BuildingDetailPage 필드들 ──
  buildingName: "", buildingNickname: "",
  contractStartDate: "", entranceDoorPassword: "",
  addressRoad: "", addressOld: "", approvedDate: "",
  buildingAreaTotal: "",
  cctvRoomLocation: "", cctvInstallInfo: "",
  electricCommonCustomerNumber: "", waterCommonCustomerNumber: "",
  electricContractPower: "", internetProvider: "",
  parkingGatePassword: "", electricMeterBoxPassword: "",
  rooftopAccessMethod: "", parkingTotalSpaces: "",
  septicTankCleaningMonth1: "", septicTankCleaningMonth2: "",
  monthlyInspectionCount: "", isFireInspectionSelf: false,
  // 단기 전용
  isResidentRegistrationAllowed: false, isStandardContract: false,
  isRenthomeWritingAgency: false, isStorageAvailable: false,
  penalty7daysOwnership: "", freeRepairLimit: "",
  waterBillingType: "", internetBillingType: "",
  // 건물주
  ownerName: "", ownerResidentNumber: "", ownerPhone: "",
  ownerEmail: "", ownerEmail2: "", ownerHomeAddress: "", ownerHomeAddressDetail: "",
  ownerBusinessRegistrationNumber: "", ownerBusinessName: "", ownerBusinessAddress: "",
  ownerBusinessType: "", ownerBusinessItem: "", ownerEntityType: "",
  owner2Name: "", owner2ResidentNumber: "", owner2Phone: "", owner2Email: "", owner2HomeAddress: "", owner2HomeAddressDetail: "",
  owner3Name: "", owner3ResidentNumber: "", owner3Phone: "", owner3Email: "", owner3HomeAddress: "", owner3HomeAddressDetail: "",
  coOwnerMemo: "",
  // 건물주 정산계좌
  settlementAccount1Bank: "", settlementAccount1: "", settlementAccount1Holder: "",
  settlementAccount2Bank: "", settlementAccount2: "", settlementAccount2Holder: "",
  settlementSplitType: "", settlementSplitValue: "",
  // 연락 담당자
  contactPersonName: "", contactPersonPhone: "", contactPersonEmail: "",
  isContactPersonPrimary: false,
  siteManagerName: "", siteManagerPhone: "", siteManagerEmail: "",
  // 정산/청구
  managementFeeType: "", managementFeeRate: "", managementFeeFixedAmount: "",
  settlementDay1: "", settlementCount: "", settlementDay2: "",
  rentBillingType: "", managementFeeBillingType: "",
  tenantAccountType: "", hasVariableManagementFee: false, billingCycle: "",
  // 임차인 청구 계좌
  housemanBillingAccount: "",
  billingAccount1Bank: "", billingAccount1: "", billingAccount1Holder: "",
  billingAccount2Bank: "", billingAccount2: "", billingAccount2Holder: "",
  billingAccount3Bank: "", billingAccount3: "", billingAccount3Holder: "",
  // 항목별 입금 계좌 지정
  rentAccountTarget: "", managementFeeAccountTarget: "", utilityAccountTarget: "", electricGasAccountTarget: "",
  // 예치금 설정
  depositManagementAmount: "",
  // 서류 (base64)
  fireInsuranceDocumentUrl: null, fireInsuranceDocumentUrlName: null, fireInsuranceDocumentUrlType: null,
  documentBuildingRegisterUrl: null, documentBuildingRegisterUrlName: null, documentBuildingRegisterUrlType: null,
  documentManagementContractUrl: null, documentManagementContractUrlName: null, documentManagementContractUrlType: null,
  documentBusinessRegistrationUrl: null, documentBusinessRegistrationUrlName: null, documentBusinessRegistrationUrlType: null,
  documentCompletionDrawingUrl: null, documentCompletionDrawingUrlName: null, documentCompletionDrawingUrlType: null,
  // 호실
  roomList: [],
  newFloor: "", newFrom: "", newTo: "", editIdx: null,
};

/* ── 접기/펼치기 Card 헤더 ── */
const SectionHeader = ({ icon, title, subtitle, open, onToggle }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? 12 : 0, cursor: "pointer" }} onClick={onToggle}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>{icon} {title}</div>
      {subtitle && <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>{subtitle}</div>}
    </div>
    <span style={{ fontSize: 14, color: "#8F95A3", transition: "transform 0.2s", transform: open ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
  </div>
);

/* ── Helper: label with DB column hint ── */
const RegDbLabel = ({ label, col }) => (
  <div style={{ fontSize: 11, color: "#8F95A3", marginBottom: 2 }}>{label}</div>
);

/* ── Helper: text input bound to regForm.field via setRegField ── */
const RegInput = ({ saved, field, updateBD, placeholder, type, style: extraStyle, ...rest }) => (
  <input type={type || "text"} value={saved[field] || ""} onChange={e => updateBD({ [field]: type === "number" ? e.target.value : e.target.value })}
    placeholder={placeholder} style={{ ...inputStyle, padding: "8px 12px", fontSize: 12, ...extraStyle }} {...rest} />
);

/* ── Helper: checkbox bound to regForm.field via setRegField ── */
const RegCheck = ({ saved, field, updateBD, label, col }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <input type="checkbox" checked={!!saved[field]} onChange={e => updateBD({ [field]: e.target.checked })} />
    <div style={{ fontSize: 12, color: "#8F95A3" }}>{label}</div>
  </div>
);

/* ── Helper: select bound to regForm.field via setRegField ── */
const RegSelect = ({ saved, field, updateBD, options, style: extraStyle }) => (
  <select value={saved[field] || ""} onChange={e => updateBD({ [field]: e.target.value })} style={{ ...inputStyle, padding: "8px 12px", fontSize: 12, ...extraStyle }}>
    <option value="">선택</option>
    {options.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

/* ── Helper: textarea bound to regForm.field via setRegField ── */
const RegTextarea = ({ saved, field, updateBD, placeholder, rows }) => (
  <textarea value={saved[field] || ""} onChange={e => updateBD({ [field]: e.target.value })}
    placeholder={placeholder} rows={rows || 3}
    style={{ ...inputStyle, padding: "8px 12px", fontSize: 12, minHeight: 60, width: "100%", resize: "vertical" }} />
);

/* ── Helper: file upload with thumbnail ── */
const RegFileUpload = ({ saved, field, label, col, updateBD }) => {
  const fileRef = useRef(null);
  const value = saved[field];
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('파일 크기는 5MB 이하만 가능합니다.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      updateBD({ [field]: reader.result, [field + 'Name']: file.name, [field + 'Type']: file.type });
    };
    reader.readAsDataURL(file);
  };
  const isPdf = saved[field + 'Type']?.includes('pdf');
  const fileName = saved[field + 'Name'] || '파일';
  return (
    <div>
      <RegDbLabel label={label} col={col} />
      <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleUpload} style={{ display: 'none' }} />
      {!value ? (
        <button onClick={() => fileRef.current?.click()}
          style={{ width: '100%', padding: '20px 12px', borderRadius: 8, border: '1.5px dashed #D1D5DB', background: '#F9FAFB', color: '#6B7280', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
          파일 첨부 (이미지/PDF)
        </button>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ width: '100%', height: 80, borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
            {isPdf ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>PDF</div>
                <div style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>{fileName}</div>
              </div>
            ) : (
              <img src={value} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); updateBD({ [field]: null, [field + 'Name']: null, [field + 'Type']: null }); }}
            style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#EF4444', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>X</button>
        </div>
      )}
    </div>
  );
};

export const BuildingsPage = ({
  customBuildings = [],
  setCustomBuildings,
  allBuildings = [],
  setAllBuildings,
  buildingData = {},
  activeTenants = [],
  activeVacancies = [],
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const onSelectBuilding = (name) => navigate(`/buildings/${encodeURIComponent(name)}`);
  const { myBuildings } = useMyBuildings();
  const isMobile = useIsMobile();
  const [staffList] = useLocalStorage("hm_staffList", initialStaffMembers);
  const filteredBuildings = myBuildings.length > 0 ? allBuildings.filter(b => myBuildings.includes(b.name)) : allBuildings;
  const [subTab, setSubTab] = useState("list");
  const [searchText, setSearchText] = useState("");
  const [regForm, setRegForm] = useState({ ...initialRegForm });
  const [regDone, setRegDone] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // 섹션 접기/펼치기 state (BuildingDetailPage 구조와 일치)
  const [sec1Open, setSec1Open] = useState(true);     // 건물 정보
  const [sec3Open, setSec3Open] = useState(true);     // 건물주
  const [showOwner2, setShowOwner2] = useState(false);
  const [showOwner3, setShowOwner3] = useState(false);
  const [sec12Open, setSec12Open] = useState(true);   // 정산·청구
  const [sec16Open, setSec16Open] = useState(true);   // 서류
  const [sec7Open, setSec7Open] = useState(true);     // 호실 등록
  const [fireMode, setFireMode] = useState("direct"); // "direct" 직접관리 | "vendor" 협력업체관리

  const set = (patch) => setRegForm(f => ({ ...f, ...patch }));
  const setRegField = (patch) => setRegForm(prev => ({ ...prev, ...patch }));
  const setOwner = (idx, field, value) => setRegForm(f => {
    const updated = [...f.owners];
    updated[idx] = { ...updated[idx], [field]: value };
    return { ...f, owners: updated };
  });
  const addOwner = () => setRegForm(f => f.owners.length < 4 ? { ...f, owners: [...f.owners, { name: "", phone: "", ssn: "", address: "", settlement: "" }] } : f);
  const removeOwner = (idx) => setRegForm(f => f.owners.length > 1 ? { ...f, owners: f.owners.filter((_, i) => i !== idx) } : f);
  const setVendor = (key, field, value) => setRegForm(f => ({
    ...f,
    vendors: { ...f.vendors, [key]: { ...f.vendors[key], [field]: value } }
  }));
  const toggleVendor = (key) => setRegForm(f => ({
    ...f,
    vendorEnabled: { ...f.vendorEnabled, [key]: !f.vendorEnabled[key] }
  }));

  const addRooms = () => {
    const f = regForm.newFloor;
    const from = parseInt(regForm.newFrom);
    const to = parseInt(regForm.newTo || regForm.newFrom);
    if (!f || isNaN(from)) { alert("층과 시작 호를 입력하세요."); return; }
    if (!isNaN(to) && to < from) { alert(`시작 호(${from})가 끝 호(${to})보다 큽니다. 순서를 확인하세요.`); return; }
    if (!isNaN(to) && (to - from) > 50) { alert(`한 번에 50개 이상의 호실은 추가할 수 없습니다.`); return; }
    const newRooms = [];
    for (let i = from; i <= to; i++) {
      const roomNum = `${f.startsWith("B") || f.startsWith("b") ? f.toUpperCase() : f}${String(i).padStart(2, "0")}`;
      if (!regForm.roomList.find(r => r.room === roomNum)) {
        newRooms.push({ room: roomNum, roomType: "", buildingType: "", area: "", standardRent: "", standardManagementFee: "", standardDeposit: "", standardWaterFee: "", standardInternetFee: "", standardCleaningFee: "", electricCustomerNumber: "", gasCustomerNumber: "", standardBrokerFee: "", photos: [] });
      }
    }
    const startIdx = regForm.roomList.length;
    set({ roomList: [...regForm.roomList, ...newRooms], newFloor: "", newFrom: "", newTo: "", editIdx: startIdx });
  };

  const updateRoom = (idx, field, value) => {
    const updated = [...regForm.roomList];
    updated[idx] = { ...updated[idx], [field]: value };
    set({ roomList: updated });
  };

  const removeRoom = (idx) => {
    const updated = [...regForm.roomList];
    updated.splice(idx, 1);
    const newIdx = updated.length === 0 ? null : idx >= updated.length ? updated.length - 1 : idx;
    set({ roomList: updated, editIdx: newIdx });
  };

  const handlePreview = () => {
    const errors = [];
    if (!regForm.name?.trim()) errors.push("건물명");
    if (!(regForm.addressOld || regForm.addressRoad)) errors.push("주소(도로명 또는 지번)");
    if (regForm.roomList.length === 0) errors.push("호실 (최소 1개)");
    const hasType = regForm.isShortTermRental || regForm.isLongTermRental || regForm.isCommercial || regForm.isManagementAgency || regForm.isCorporateFacility;
    if (!hasType) errors.push("건물유형 (최소 1개 선택)");
    if (errors.length > 0) {
      alert("다음 항목을 확인해주세요:\n• " + errors.join("\n• "));
      return;
    }
    // 중복 건물명 체크
    if (allBuildings.some(b => b.name === regForm.name.trim())) {
      alert(`"${regForm.name}" 건물이 이미 존재합니다.`);
      return;
    }
    setShowPreview(true);
  };

  const handleReg = async () => {
    // 건물 데이터 구조에 맞게 변환하여 저장
    const newBuilding = {
      name: regForm.name,
      rooms: regForm.roomList.length,
      occupied: 0,
      type: [regForm.isShortTermRental && "단기", regForm.isLongTermRental && "일반임대", regForm.isCommercial && "근생", regForm.isManagementAgency && "관리사무소", regForm.isCorporateFacility && "기업시설관리"].filter(Boolean).join("+"),
      feeType: regForm.managementFeeType === "percent" ? "pct" : regForm.managementFeeType === "fixed" ? "fixed" : "pct",
      fee: regForm.managementFeeType === "percent" || regForm.managementFeeType === "hybrid" ? parseFloat(regForm.managementFeeRate) / 100 || 0 : 0,
      fixedFee: regForm.managementFeeType === "fixed" || regForm.managementFeeType === "hybrid" ? parseInt(String(regForm.managementFeeFixedAmount).replace(/,/g, "")) || 0 : 0,
      special: null,
      parkingTotal: parseInt(regForm.parkingTotalSpaces) || 0,
      // 추가 정보 보존
      _custom: true,
      _regForm: { ...regForm },
    };
    if (setCustomBuildings) {
      setCustomBuildings(prev => [...prev, newBuilding]);
    }
    if (setAllBuildings) {
      setAllBuildings(prev => [...prev, newBuilding]);
    }

    // Supabase에도 저장
    const sbBuilding = await insertBuilding(regForm);
    if (sbBuilding) {
      // 호실도 Supabase에 저장
      if (regForm.roomList.length > 0) {
        await insertRooms(sbBuilding.id, regForm.roomList);
      }
      newBuilding.supabaseId = sbBuilding.id;
      newBuilding.source = 'supabase';
      console.info(`[Supabase] 건물 "${regForm.name}" + 호실 ${regForm.roomList.length}개 저장 완료`);
    }

    setShowPreview(false);
    setRegDone(true);
    setTimeout(() => { setRegDone(false); setSubTab("list"); setRegForm({ ...initialRegForm }); }, 1500);
  };

  // 건물유형 boolean → 문자열 배열 파생 (계좌타입, 표시용)
  const regFormTypes = [regForm.isShortTermRental && "단기", regForm.isLongTermRental && "일반임대", regForm.isCommercial && "근생", regForm.isManagementAgency && "관리사무소", regForm.isCorporateFacility && "기업시설관리"].filter(Boolean);
  const acctTypes = regFormTypes.map(t => t === "기업시설관리" ? "관리사무소" : t);

  // ── Conditional field visibility helpers (BuildingDetailPage 동일) ──
  const anyTypeChecked = regForm.isShortTermRental || regForm.isLongTermRental || regForm.isCommercial || regForm.isManagementAgency || regForm.isCorporateFacility;
  const isType = (...types) => !anyTypeChecked || types.some(t => regForm[t]);
  const notCorporateOnly = isType('isShortTermRental', 'isLongTermRental', 'isCommercial', 'isManagementAgency');
  const isRentalOrCommercial = isType('isShortTermRental', 'isLongTermRental', 'isCommercial');
  const isCommercialOrAgency = isType('isCommercial', 'isManagementAgency');
  const corporateOnly = anyTypeChecked && regForm.isCorporateFacility && !regForm.isShortTermRental && !regForm.isLongTermRental && !regForm.isCommercial && !regForm.isManagementAgency;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <SectionTitle sub={subTab === "list" ? `총 ${filteredBuildings.length}개 건물` : "새 건물 정보 입력"}>🏢 건물 · 호실정보</SectionTitle>
        {subTab === "list" && (
          <button onClick={() => setSubTab("register")}
            style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#2563EB", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1D4ED8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#2563EB"; }}>
            ➕ 신규 건물 등록
          </button>
        )}
        {subTab === "register" && (
          <button onClick={() => setSubTab("list")}
            style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            ← 건물 목록
          </button>
        )}
      </div>

      {subTab === "list" ? (
        <div>
          {/* 건물 검색 */}
          {/* NOTE: 건물 목록 렌더 시작 */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <SearchInput value={searchText} onChange={setSearchText} placeholder="건물 검색 (초성 가능: ㅅㅌ → 스타빌, ㄷㅎ → 더힐하우스)" />
            </div>
          </div>
          {(() => {
            const bd = buildingData || {};
            const visibleBuildings = filteredBuildings.filter(b => matchKorean(b.name, searchText));
            return (<>
              {searchText && <div style={{ fontSize: 11, color: "#8F95A3", marginBottom: 8 }}>검색결과: {visibleBuildings.length}개</div>}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : "repeat(3, 1fr)", gap: 12 }}>
          {visibleBuildings.map((b, i) => {
            const dynOccupied = activeTenants.filter(t => t.building === b.name).length;
            const dynVacant = activeVacancies.filter(v => v.building === b.name).length;
            const pendingCount = asItems.filter(a => a.building === b.name && a.status !== "완료").length;
            return (
              <Card key={i} onClick={() => onSelectBuilding(b.name)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#1A1D23" }}>{b.name}</span>
                      {b.source === "supabase" && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#DCFCE7", color: "#16A34A", border: "1px solid #BBF7D0" }}>DB</span>
                      )}
                      {b._custom && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}>신규</span>
                      )}
                      {b.special && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: b.special === "무리한 요구" ? "#FEF2F2" : "#FFF7ED", color: b.special === "무리한 요구" ? "#DC2626" : "#EA580C", border: `1px solid ${b.special === "무리한 요구" ? "#FECACA" : "#FED7AA"}` }}>
                          ⚠ {b.special}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>{b.type}{feeLabel(b) && ` · ${feeLabel(b)}`}</div>
                  </div>
                  {pendingCount > 0 ? (
                    <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>🔧 {pendingCount}건</div>
                  ) : (
                    <div style={{ background: "#ECFDF5", color: "#059669", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>민원없음</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                  <div><span style={{ color: "#8F95A3" }}>전체</span> <span style={{ fontWeight: 700 }}>{b.rooms}실</span></div>
                  <div><span style={{ color: "#8F95A3" }}>입주</span> <span style={{ fontWeight: 700, color: "#059669" }}>{dynOccupied}</span></div>
                  <div><span style={{ color: "#8F95A3" }}>공실</span> <span style={{ fontWeight: 700, color: dynVacant > 0 ? "#DC2626" : "#8F95A3" }}>{dynVacant}</span></div>
                </div>
              </Card>
            );
          })}
        </div>
            </>);
          })()}
        </div>
      ) : regDone ? (
        <Card style={{ padding: "40px 20px", textAlign: "center" }}>
          <span style={{ fontSize: 48 }}>✅</span>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#059669", marginTop: 12 }}>건물이 등록되었습니다</div>
          <div style={{ fontSize: 13, color: "#8F95A3", marginTop: 6 }}>{regForm.name} · {regForm.roomList.length}개 호실 · 곧 건물 목록으로 이동합니다</div>
        </Card>
      ) : showPreview ? (
        /* ── 미리보기 ── */
        <div>
          <div style={{ padding: "14px 20px", background: "linear-gradient(135deg, #1A1D23 0%, #2D3748 100%)", borderRadius: 12, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>📋 등록 미리보기</div>
              <div style={{ fontSize: 11, color: "#A0AEC0", marginTop: 2 }}>입력하신 내용을 확인하세요</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowPreview(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #A0AEC0", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← 수정하기</button>
              <button onClick={handleReg} style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#10B981", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(16,185,129,0.4)" }}>등록 확인</button>
            </div>
          </div>

          {/* 미리보기: 기본 정보 */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>📋 기본 정보</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { l: "건물명", v: regForm.name },
                { l: "건물 유형", v: regFormTypes.join(" + ") },
                { l: "지번 주소", v: regForm.addressOld },
                { l: "도로명 주소", v: regForm.addressRoad },
                { l: "관리 시작일", v: regForm.contractStartDate },
                { l: "사용승인일", v: regForm.approvedDate },
                { l: "현관 비밀번호", v: regForm.entranceDoorPassword },
                { l: "CCTV 대수", v: regForm.cctvCount ? `${regForm.cctvCount}대` : "" },
                { l: "주차 총 대수", v: regForm.parkingTotalSpaces ? `${regForm.parkingTotalSpaces}대` : "" },
              ].filter(x => x.v).map((x, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "5px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 11, color: "#8F95A3", fontWeight: 600, minWidth: 90 }}>{x.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{x.v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 미리보기: 건물주 정보 */}
          {regForm.ownerName && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>👤 건물주 정보</div>
              {(() => {
                const owners = [
                  { name: regForm.ownerName, ssn: regForm.ownerResidentNumber, phone: regForm.ownerPhone, email: regForm.ownerEmail, address: regForm.ownerHomeAddress },
                  regForm.owner2Name ? { name: regForm.owner2Name, ssn: regForm.owner2ResidentNumber, phone: regForm.owner2Phone, email: regForm.owner2Email, address: regForm.owner2HomeAddress } : null,
                  regForm.owner3Name ? { name: regForm.owner3Name, ssn: regForm.owner3ResidentNumber, phone: regForm.owner3Phone, email: regForm.owner3Email, address: regForm.owner3HomeAddress } : null,
                ].filter(Boolean);
                const ownerColors = [
                  { bg: "#F0F4FF", color: "#2563EB", label: "주" },
                  { bg: "#F5F3FF", color: "#7C3AED", label: "부" },
                  { bg: "#F0FDF4", color: "#059669", label: "" },
                ];
                return owners.map((ow, oi) => {
                  const c = ownerColors[oi] || ownerColors[0];
                  return (
                    <div key={oi} style={{ padding: "8px 12px", background: c.bg, borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: c.color, marginBottom: 6 }}>건물주 {oi + 1}{c.label ? ` (${c.label})` : ""}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                        {[{ l: "이름", v: ow.name }, { l: "주민등록번호", v: ow.ssn }, { l: "전화번호", v: ow.phone }].filter(x => x.v).map((x, i) => (
                          <div key={i}><span style={{ fontSize: 9, color: "#8F95A3" }}>{x.l}</span><div style={{ fontSize: 12, fontWeight: 700 }}>{x.v}</div></div>
                        ))}
                      </div>
                      {ow.address && <div style={{ marginTop: 4 }}><span style={{ fontSize: 9, color: "#8F95A3" }}>주소</span><div style={{ fontSize: 12, fontWeight: 700 }}>{ow.address}</div></div>}
                    </div>
                  );
                });
              })()}
            </Card>
          )}

          {/* 미리보기: 건물 계좌 정보 */}
          {(regForm.acctMode1 || regForm.acctMode2) && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🏦 건물 계좌 정보</div>
              <div style={{ display: "grid", gridTemplateColumns: acctTypes.length === 3 ? "1fr 1fr 1fr" : acctTypes.length === 2 ? "1fr 1fr" : "1fr", gap: 10 }}>
                {acctTypes.map((aType, ai) => {
                  const suffix = String(ai + 1);
                  const currentMode = regForm[`acctMode${suffix}`];
                  if (!currentMode) return null;
                  const currentOptions = modeOptions[aType] || [];
                  const modeLabel = currentOptions.find(o => o.id === currentMode)?.label || currentMode;
                  const currentOwnerFields = ownerFieldCfg[currentMode] || [];
                  const hmUsage = housemanUsageMap[currentMode];
                  return (
                    <div key={aType} style={{ padding: "10px 12px", background: acctTypeBg[aType], borderRadius: 8, border: `1.5px solid ${acctTypeColor[aType]}40` }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: acctTypeColor[aType], marginBottom: 6 }}>{aType} · {modeLabel}</div>
                      <div style={{ fontSize: 10, color: "#5F6577", marginBottom: 4 }}>💡 {flowMap[currentMode]}</div>
                      {hmUsage && (
                        <div style={{ fontSize: 10, marginBottom: 4 }}>
                          <span style={{ color: "#2563EB", fontWeight: 600 }}>하우스맨 계좌 ({hmUsage}):</span>
                          <span style={{ fontFamily: "monospace", marginLeft: 4 }}>{regForm[`housemanAccount${suffix}`]}</span>
                        </div>
                      )}
                      {currentOwnerFields.map(f => {
                        const accts = regForm[`ownerAccounts${suffix}`] || {};
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
            </Card>
          )}

          {/* 미리보기: 정산·청구 */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>💰 정산·청구</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[
                { l: "수수료 방식", v: regForm.managementFeeType === "percent" ? "%" : regForm.managementFeeType === "fixed" ? "고정" : regForm.managementFeeType === "hybrid" ? "혼합" : "" },
                { l: "수수료율", v: regForm.managementFeeRate ? `${regForm.managementFeeRate}%` : "" },
                { l: "고정 수수료", v: regForm.managementFeeFixedAmount },
                { l: "정산일", v: regForm.settlementDay1 },
                { l: "정산일 2", v: regForm.settlementDay2 },
                { l: "임대료 선후불", v: regForm.rentBillingType === "prepaid" ? "선불" : regForm.rentBillingType === "postpaid" ? "후불" : "" },
                { l: "관리비 선후불", v: regForm.managementFeeBillingType === "prepaid" ? "선불" : regForm.managementFeeBillingType === "postpaid" ? "후불" : "" },
              ].filter(x => x.v).map((x, i) => (
                <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 10, color: "#8F95A3" }}>{x.l}</span>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{x.v}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* 미리보기: 서류 */}
          {(() => {
            const docs = [
              { label: "화재보험 증권", field: "fireInsuranceDocumentUrl" },
              { label: "건축물대장", field: "documentBuildingRegisterUrl" },
              { label: "관리용역계약서", field: "documentManagementContractUrl" },
              { label: "사업자등록증", field: "documentBusinessRegistrationUrl" },
              { label: "준공도면", field: "documentCompletionDrawingUrl" },
            ].filter(d => regForm[d.field]);
            return docs.length > 0 && (
              <Card style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>📎 서류</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {docs.map(d => (
                    <span key={d.field} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}>
                      {d.label} ({regForm[d.field + 'Name'] || '첨부됨'})
                    </span>
                  ))}
                </div>
              </Card>
            );
          })()}

          {/* 미리보기: 호실 목록 */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🚪 호실 등록 ({regForm.roomList.length}개)</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
              {regForm.roomList.map((r, i) => {
                const filled = r.roomType && r.standardRent;
                return (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${filled ? "#A7F3D0" : "#FBBF24"}`, background: filled ? "#F0FDF4" : "#FFFBEB" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#1A1D23" }}>{r.room}호</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: filled ? "#059669" : "#D97706", padding: "2px 8px", borderRadius: 4, background: filled ? "#D1FAE5" : "#FEF3C7" }}>
                        {filled ? "입력완료" : "미완성"}
                      </span>
                    </div>
                    {r.roomType && <div style={{ fontSize: 11, color: "#5F6577" }}>{r.roomType}{r.area ? ` · ${r.area}㎡` : ""}</div>}
                    {acctTypes.length > 1 && (r.buildingType || acctTypes[0]) && (
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: acctTypeBg[r.buildingType || acctTypes[0]], color: acctTypeColor[r.buildingType || acctTypes[0]], fontWeight: 600 }}>{r.buildingType || acctTypes[0]}</span>
                    )}
                    {(r.standardRent || r.standardDeposit || r.standardManagementFee) && (
                      <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 2 }}>
                        {[r.standardDeposit && `예치금 ${r.standardDeposit}`, r.standardRent && `임대료 ${r.standardRent}`, r.standardManagementFee && `관리비 ${r.standardManagementFee}`].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    {r.photos.length > 0 && <div style={{ fontSize: 10, color: "#3B82F6", marginTop: 2 }}>📸 사진 {r.photos.length}장</div>}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 하단 버튼 */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => setShowPreview(false)}
              style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              ← 수정하기
            </button>
            <button onClick={handleReg}
              style={{ flex: 2, padding: "14px", borderRadius: 12, border: "none", background: "#10B981", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 12px rgba(16,185,129,0.4)" }}>
              ✓ {regForm.name} · {regForm.roomList.length}개 호실 등록 확인
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* ── 등록 진행률 ── */}
          {(() => {
            const checks = [
              { label: "건물유형", done: regForm.isShortTermRental || regForm.isLongTermRental || regForm.isCommercial || regForm.isManagementAgency || regForm.isCorporateFacility },
              { label: "건물명", done: !!regForm.name?.trim() },
              { label: "주소", done: !!(regForm.addressOld || regForm.addressRoad) },
              { label: "건물주", done: !!regForm.ownerName?.trim() },
              { label: "수수료", done: !!regForm.managementFeeType },
              { label: "정산일", done: regForm.settlementDay1 !== undefined && regForm.settlementDay1 !== "" },
              { label: "호실", done: regForm.roomList?.length > 0 },
            ];
            const done = checks.filter(c => c.done).length;
            const pct = Math.round((done / checks.length) * 100);
            return (
              <div style={{ marginBottom: 16, padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E8ECF0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>등록 진행률</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: pct === 100 ? "#059669" : "#D97706" }}>{done}/{checks.length} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#10B981" : "#F59E0B", borderRadius: 3, transition: "width 0.3s" }} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {checks.map(c => (
                    <span key={c.label} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: c.done ? "#ECFDF5" : "#FEF2F2", color: c.done ? "#065F46" : "#991B1B", fontWeight: 600 }}>
                      {c.done ? "✓" : "○"} {c.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── 건물 유형 (shared component) ── */}
          <BuildingTypeCards data={regForm} onChange={setRegField} />

          {/* ── 건물 정보 (shared component) ── */}
          <BuildingInfoSection data={regForm} onChange={(patch) => { setRegField(patch); if (patch.buildingName !== undefined) set({ name: patch.buildingName }); }} editMode={true} isMobile={isMobile} defaultOpen={sec1Open} buildingNamePlaceholder={regForm.name || "건물명"} />

          {/* ── 건물주 (shared component) ── */}
          <OwnerSection data={regForm} onChange={setRegField} editMode={true} defaultOpen={sec3Open} />


          {/* ── 정산·청구 (shared component) ── */}
          <SettlementBillingSection data={regForm} onChange={setRegField} editMode={true} isMobile={isMobile} defaultOpen={sec12Open} buildingTypes={regFormTypes} />

          {/* ── 서류 (shared component) ── */}
          <DocumentSection data={regForm} onChange={setRegField} editMode={true} defaultOpen={sec16Open} />

          {/* ── Section 7: 호실 등록 (기업시설관리 제외) ── */}
          {!corporateOnly && <Card style={{ marginBottom: 16 }}>
            <SectionHeader icon="🚪" title={`호실 등록 (${regForm.roomList.length}개)`} subtitle="층별 호실 추가 · 상세 정보 입력" open={sec7Open} onToggle={() => setSec7Open(!sec7Open)} />
            {sec7Open && <div>
              {/* Add rooms by floor */}
              <div style={{ padding: "14px 16px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E8ECF0", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 10 }}>층별 호실 추가</div>
                <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>층</div>
                    <input value={regForm.newFloor} onChange={e => set({newFloor: e.target.value})} placeholder="예: 1, B1"
                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 13 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>시작 호</div>
                    <input type="number" value={regForm.newFrom} onChange={e => set({newFrom: e.target.value})} placeholder="01"
                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 13 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>끝 호</div>
                    <input type="number" value={regForm.newTo} onChange={e => set({newTo: e.target.value})} placeholder="04"
                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 13 }} />
                  </div>
                  <button onClick={addRooms}
                    style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    + 추가
                  </button>
                </div>
                <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 6 }}>1층에 4호실 → 층 "1" 시작 "01" 끝 "04" → 101~104 생성 · 층별로 반복 추가</div>
              </div>

              {/* Room Detail */}
              {regForm.roomList.length > 0 ? (
                <div>
                  {/* 보기 모드 토글: 개별 / 일괄 */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                    <button onClick={() => set({ roomViewMode: "individual" })}
                      style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        background: (regForm.roomViewMode || "individual") === "individual" ? "#1A1D23" : "#F3F4F6",
                        color: (regForm.roomViewMode || "individual") === "individual" ? "#fff" : "#6B7280",
                        border: "none" }}>
                      개별 편집
                    </button>
                    <button onClick={() => set({ roomViewMode: "bulk" })}
                      style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        background: regForm.roomViewMode === "bulk" ? "#1A1D23" : "#F3F4F6",
                        color: regForm.roomViewMode === "bulk" ? "#fff" : "#6B7280",
                        border: "none" }}>
                      일괄 편집
                    </button>
                  </div>

                  {/* 일괄 편집 테이블 */}
                  {regForm.roomViewMode === "bulk" ? (
                    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #E5E7EB" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <thead>
                          <tr style={{ background: "#F3F4F6" }}>
                            <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>호실</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>유형</th>
                            <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#374151", borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>면적(㎡)</th>
                            <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#374151", borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>보증금</th>
                            <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#374151", borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>월세</th>
                            <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#374151", borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>관리비</th>
                            <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: "#DC2626", borderBottom: "1px solid #E5E7EB" }}>삭제</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regForm.roomList.map((r, i) => {
                            const cellStyle = { padding: "4px 6px", borderBottom: "1px solid #F3F4F6" };
                            const inpStyle = { ...inputStyle, padding: "6px 8px", fontSize: 11, width: "100%", textAlign: "right" };
                            return (
                              <tr key={i}>
                                <td style={{ ...cellStyle, fontWeight: 700, fontSize: 12, color: "#1F2937" }}>{r.room}</td>
                                <td style={cellStyle}>
                                  <select value={r.roomType || ""} onChange={e => { const updated = [...regForm.roomList]; updated[i] = { ...updated[i], roomType: e.target.value }; set({ roomList: updated }); }}
                                    style={{ ...inputStyle, padding: "6px 4px", fontSize: 11, width: "100%" }}>
                                    <option value="">선택</option>
                                    <option value="원룸">원룸</option><option value="투룸">투룸</option><option value="쓰리룸">쓰리룸</option>
                                    <option value="근생">근생</option><option value="사무실">사무실</option>
                                  </select>
                                </td>
                                <td style={cellStyle}><input value={r.area || ""} onChange={e => { const updated = [...regForm.roomList]; updated[i] = { ...updated[i], area: e.target.value }; set({ roomList: updated }); }} style={inpStyle} placeholder="19.8" /></td>
                                <td style={cellStyle}><input value={r.standardDeposit || ""} onChange={e => { const updated = [...regForm.roomList]; updated[i] = { ...updated[i], standardDeposit: e.target.value }; set({ roomList: updated }); }} style={inpStyle} placeholder="0" /></td>
                                <td style={cellStyle}><input value={r.standardRent || ""} onChange={e => { const updated = [...regForm.roomList]; updated[i] = { ...updated[i], standardRent: e.target.value }; set({ roomList: updated }); }} style={inpStyle} placeholder="0" /></td>
                                <td style={cellStyle}><input value={r.standardManagementFee || ""} onChange={e => { const updated = [...regForm.roomList]; updated[i] = { ...updated[i], standardManagementFee: e.target.value }; set({ roomList: updated }); }} style={inpStyle} placeholder="0" /></td>
                                <td style={{ ...cellStyle, textAlign: "center" }}>
                                  <button onClick={() => removeRoom(i)} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 14 }}>✕</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                  <div>
                  {/* Room tags (개별 편집 모드) */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
                    {regForm.roomList.map((r, i) => {
                      const filled = r.roomType && r.standardRent;
                      const selected = regForm.editIdx === i;
                      return (
                        <div key={i} onClick={() => set({editIdx: i})}
                          style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.1s",
                            background: selected ? "#1A1D23" : filled ? "#D1FAE5" : "#EFF6FF",
                            color: selected ? "#fff" : filled ? "#059669" : "#2563EB",
                            border: `1.5px solid ${selected ? "#1A1D23" : filled ? "#A7F3D0" : "#BFDBFE"}` }}>
                          {r.room} {filled ? "✓" : ""}
                        </div>
                      );
                    })}
                  </div>

                  {/* Edit form for selected room */}
                  {regForm.editIdx !== undefined && regForm.editIdx !== null && regForm.roomList[regForm.editIdx] && (() => {
                    const idx = regForm.editIdx;
                    const r = regForm.roomList[idx];
                    return (
                      <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: 12, border: "1.5px solid #E0E3E9" }}>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#1A1D23" }}>🚪 {r.room}호</span>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {idx > 0 && <button onClick={() => set({editIdx: idx - 1})} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>← 이전</button>}
                            {idx < regForm.roomList.length - 1 && <button onClick={() => set({editIdx: idx + 1})} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>다음 →</button>}
                            <button onClick={() => { if (window.confirm(`${r.room}호를 삭제하시겠습니까?`)) removeRoom(idx); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>삭제</button>
                          </div>
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 800, color: "#2563EB", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid #BFDBFE", display: "flex", alignItems: "center", gap: 6 }}>
                          📋 호실 기본정보 <span style={{ fontSize: 10, fontWeight: 500, color: "#8F95A3" }}>이 정보가 공실관리 · 홈페이지의 기준값이 됩니다</span>
                        </div>

                        {/* 복합 유형일 때 호실 건물유형 선택 */}
                        {acctTypes.length > 1 && (
                          <div style={{ marginBottom: 10, padding: "8px 12px", background: "#F0F4FF", borderRadius: 8, border: "1px solid #BFDBFE", display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "#2563EB", whiteSpace: "nowrap" }}>🏢 호실 유형</div>
                            <div style={{ display: "flex", gap: 4 }}>
                              {acctTypes.map(at => (
                                <button key={at} onClick={() => updateRoom(idx, "buildingType", at)}
                                  style={{ padding: "5px 14px", borderRadius: 6, border: (r.buildingType || acctTypes[0]) === at ? `1.5px solid ${acctTypeColor[at]}` : "1px solid #E0E3E9", background: (r.buildingType || acctTypes[0]) === at ? acctTypeBg[at] : "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: (r.buildingType || acctTypes[0]) === at ? acctTypeColor[at] : "#8F95A3" }}>
                                  {at}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <RoomFormSection
                          data={r}
                          onChange={(patch) => {
                            const updated = [...regForm.roomList];
                            updated[idx] = { ...updated[idx], ...patch };
                            set({ roomList: updated });
                          }}
                          buildingData={regForm}
                          editMode={true}
                          roomType={(() => {
                            const roomBldgType = acctTypes.length > 1 ? (r.buildingType || acctTypes[0]) : acctTypes[0];
                            return roomBldgType;
                          })()}
                          buildingTypes={acctTypes}
                          photos={r.photos}
                          onAddPhotos={(dataUrls) => updateRoom(idx, "photos", [...r.photos, ...dataUrls].slice(0, 30))}
                          onRemovePhoto={(pi) => { const updated = [...r.photos]; updated.splice(pi, 1); updateRoom(idx, "photos", updated); }}
                        />

                        {/* 🏦 호실 계좌 정보 — 건물 기본값 상속 + 호실 개별 설정 */}
                        {(() => {
                          // 복합 유형이면 호실의 개별 유형 하나만, 단일 유형이면 그대로
                          const roomBldgType = acctTypes.length > 1 ? (r.buildingType || acctTypes[0]) : acctTypes[0];
                          const roomAcctTypes = [roomBldgType];
                          // roomBldgType이 acctTypes 내 몇번째인지 → suffix 결정
                          const roomSuffixIdx = acctTypes.indexOf(roomBldgType);
                          const roomSuffix = String(roomSuffixIdx + 1);
                          // 호실별 개별 설정 여부
                          const isRoomCustom = !!r.roomAcctCustom;
                          const enableRoomCustom = () => {
                            const s = roomSuffix;
                            updateRoom(idx, "roomAcctCustom", { mode1: regForm[`acctMode${s}`], housemanAccount1: regForm[`housemanAccount${s}`], ownerAccounts1: { ...regForm[`ownerAccounts${s}`] } });
                          };
                          const disableRoomCustom = () => updateRoom(idx, "roomAcctCustom", null);
                          const updateRoomAcctField = (field, value) => updateRoom(idx, "roomAcctCustom", { ...r.roomAcctCustom, [field]: value });
                          return (
                            <div style={{ marginTop: 14, padding: "10px 14px", background: "#FFFBF0", borderRadius: 10, border: "1px solid #FDE68A" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 800, color: "#92400E" }}>🏦 계좌 정보</span>
                                <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: acctTypeBg[roomBldgType], color: acctTypeColor[roomBldgType], fontWeight: 700 }}>{roomBldgType}</span>
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
                              {/* 건물 따름: 읽기전용 표시 — 건물 계좌의 실제 입력값 표시 */}
                              {!isRoomCustom && (
                                <div style={{ opacity: 0.7 }}>
                                  {!regForm[`acctMode${roomSuffix}`] && <div style={{ fontSize: 11, color: "#8F95A3", padding: "8px 0" }}>건물 계좌가 아직 설정되지 않았습니다. 건물 계좌 정보에서 먼저 설정해주세요.</div>}
                                  {regForm[`acctMode${roomSuffix}`] && (() => {
                                    const curMode = regForm[`acctMode${roomSuffix}`];
                                    const curHmUsage = housemanUsageMap[curMode];
                                    const curHmAcct = regForm[`housemanAccount${roomSuffix}`];
                                    const curOwnerAccts = regForm[`ownerAccounts${roomSuffix}`] || {};
                                    const curOwnerFields = ownerFieldCfg[curMode] || [];
                                    return (
                                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <div style={{ fontSize: 9, color: "#065F46", fontWeight: 600, padding: "4px 8px", background: "#ECFDF5", borderRadius: 4 }}>건물 기본 설정을 따르고 있습니다 (읽기전용)</div>
                                        <div style={{ padding: "8px 10px", background: acctTypeBg[roomBldgType], borderRadius: 6, border: `1px solid ${acctTypeColor[roomBldgType]}30` }}>
                                          <div style={{ fontSize: 10, fontWeight: 700, color: acctTypeColor[roomBldgType], marginBottom: 4 }}>{roomBldgType}</div>
                                          <div style={{ fontSize: 10, color: "#5F6577", marginBottom: 4 }}>💡 {flowMap[curMode]}</div>
                                          {/* 하우스맨 계좌 */}
                                          {curHmUsage && (
                                            <div style={{ padding: "5px 8px", background: "#F0F4FF", borderRadius: 5, border: "1px solid #BFDBFE", marginBottom: 4 }}>
                                              <div style={{ fontSize: 8, fontWeight: 700, color: "#2563EB", marginBottom: 2 }}>🏗️ 하우스맨 ({curHmUsage})</div>
                                              <div style={{ fontSize: 10, fontWeight: 600, color: "#2563EB", fontFamily: "monospace" }}>{curHmAcct || <span style={{ color: "#B0B5C1" }}>미입력</span>}</div>
                                            </div>
                                          )}
                                          {/* 건물주 계좌 */}
                                          {curOwnerFields.length > 0 && (
                                            <div style={{ padding: "5px 8px", background: "#FFF7ED", borderRadius: 5, border: "1px solid #FED7AA" }}>
                                              <div style={{ fontSize: 8, fontWeight: 700, color: "#EA580C", marginBottom: 2 }}>👤 건물주 계좌</div>
                                              {curOwnerFields.map(f => (
                                                <div key={f.key} style={{ marginBottom: 2 }}>
                                                  <div style={{ fontSize: 7, fontWeight: 700, color: "#EA580C", marginBottom: 1 }}>{f.label}</div>
                                                  <div style={{ fontSize: 10, fontWeight: 600, color: "#EA580C", fontFamily: "monospace" }}>
                                                    {curOwnerAccts[f.key + "_bank"] || curOwnerAccts[f.key] ? (
                                                      <>{curOwnerAccts[f.key + "_bank"] || ""} {curOwnerAccts[f.key] || ""}{curOwnerAccts[f.key + "_holder"] ? ` (${curOwnerAccts[f.key + "_holder"]})` : ""}</>
                                                    ) : <span style={{ color: "#B0B5C1", fontFamily: "inherit" }}>미입력</span>}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                              {/* 호실 개별 설정: 편집 가능 */}
                              {isRoomCustom && (
                                <div>
                                  {roomAcctTypes.map((aType) => {
                                    const modeKey = "mode1";
                                    const hmKey = "housemanAccount1";
                                    const ownerKey = "ownerAccounts1";
                                    const curOptions = modeOptions[aType] || [];
                                    const curMode = curOptions.find(o => o.id === r.roomAcctCustom[modeKey]) ? r.roomAcctCustom[modeKey] : "";
                                    const curOwnerFields = ownerFieldCfg[curMode] || [];
                                    const curHmUsage = housemanUsageMap[curMode];
                                    return (
                                      <div key={aType} style={{ padding: "8px 10px", background: acctTypeBg[aType], borderRadius: 6, border: `1px solid ${acctTypeColor[aType]}30` }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: acctTypeColor[aType], marginBottom: 6 }}>{aType}</div>
                                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: curMode ? 6 : 0 }}>
                                          {curOptions.map(opt => (
                                            <button key={opt.id} onClick={() => updateRoomAcctField(modeKey, opt.id)}
                                              style={{ padding: "4px 8px", borderRadius: 5, border: curMode === opt.id ? "1.5px solid #F59E0B" : "1px solid #E0E3E9", background: curMode === opt.id ? "#FEF3C7" : "#fff", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: curMode === opt.id ? "#92400E" : "#5F6577" }}
                                              title={opt.desc}>{opt.label}</button>
                                          ))}
                                        </div>
                                        {curMode && (() => {
                                          const hmSec = curHmUsage && (
                                            <div key="hm" style={{ padding: "6px 8px", background: "#F0F4FF", borderRadius: 5, border: "1px solid #BFDBFE" }}>
                                              <div style={{ fontSize: 8, fontWeight: 700, color: "#2563EB", marginBottom: 3 }}>🏗️ 하우스맨 ({curHmUsage})</div>
                                              <input value={r.roomAcctCustom[hmKey]} onChange={e => updateRoomAcctField(hmKey, e.target.value)}
                                                style={{ ...inputStyle, padding: "4px 8px", fontSize: 10, width: "100%", fontFamily: "monospace" }} />
                                            </div>
                                          );
                                          const owSec = curOwnerFields.length > 0 && (
                                            <div key="ow" style={{ padding: "6px 8px", background: "#FFF7ED", borderRadius: 5, border: "1px solid #FED7AA" }}>
                                              <div style={{ fontSize: 8, fontWeight: 700, color: "#EA580C", marginBottom: 3 }}>👤 건물주 계좌</div>
                                              {curOwnerFields.map(f => (
                                                <div key={f.key} style={{ marginBottom: 3 }}>
                                                  <div style={{ fontSize: 7, fontWeight: 700, color: "#EA580C", marginBottom: 1 }}>{f.label}</div>
                                                  <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 60px", gap: 3 }}>
                                                    <select value={(r.roomAcctCustom[ownerKey] || {})[f.key + "_bank"] || ""} onChange={e => updateRoomAcctField(ownerKey, { ...r.roomAcctCustom[ownerKey], [f.key + "_bank"]: e.target.value })}
                                                      style={{ ...inputStyle, padding: "4px 5px", fontSize: 9, cursor: "pointer" }}>
                                                      <option value="">은행</option>
                                                      {banks.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                    <input value={(r.roomAcctCustom[ownerKey] || {})[f.key] || ""} onChange={e => updateRoomAcctField(ownerKey, { ...r.roomAcctCustom[ownerKey], [f.key]: e.target.value })}
                                                      placeholder="계좌번호" style={{ ...inputStyle, padding: "4px 6px", fontSize: 10, fontFamily: "monospace" }} />
                                                    <input value={(r.roomAcctCustom[ownerKey] || {})[f.key + "_holder"] || ""} onChange={e => updateRoomAcctField(ownerKey, { ...r.roomAcctCustom[ownerKey], [f.key + "_holder"]: e.target.value })}
                                                      placeholder="예금주" style={{ ...inputStyle, padding: "4px 6px", fontSize: 9 }} />
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          );
                                          return (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                              {ownerFirstModes[curMode] ? <>{owSec}{hmSec}</> : <>{hmSec}{owSec}</>}
                                              <div style={{ fontSize: 9, color: "#5F6577" }}>💡 {flowMap[curMode]}</div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* 👤 호실 담당자 오버라이드 */}
                        {(() => {
                          const mgrKeyMap = { internal: "internalMgr", external: "externalMgr", collection: "collectionMgr", contract: "contractMgr", general: "generalMgr" };
                          return (
                            <div style={{ marginTop: 14, padding: "10px 14px", background: "#F0F4FF", borderRadius: 10, border: "1px solid #BFDBFE" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: "#2563EB" }}>👤 호실 담당자 <span style={{ fontSize: 9, fontWeight: 500, color: "#8F95A3" }}>건물 기본값 자동 적용 · 호실별 변경 가능</span></div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 6 }}>
                                {staffRoles.map(sr => {
                                  const buildingMgr = regForm[mgrKeyMap[sr.id]] || "";
                                  const roomMgr = r[`room_${sr.id}`];
                                  const effectiveMgr = roomMgr || buildingMgr;
                                  const isOverridden = roomMgr && roomMgr !== buildingMgr;
                                  return (
                                    <div key={sr.id}>
                                      <div style={{ fontSize: 8, color: sr.color, fontWeight: 700, marginBottom: 2 }}>{sr.icon} {sr.label}</div>
                                      <select value={roomMgr || ""} onChange={e => updateRoom(idx, `room_${sr.id}`, e.target.value)}
                                        style={{ ...inputStyle, padding: "5px 6px", fontSize: 10, cursor: "pointer", border: isOverridden ? `1.5px solid ${sr.color}` : undefined, background: isOverridden ? sr.color + "10" : undefined }}>
                                        <option value="">{buildingMgr ? `${buildingMgr} (건물)` : "미배정"}</option>
                                        {staffList.filter(s => s.roles.includes(sr.id)).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                      </select>
                                      {isOverridden && <div style={{ fontSize: 7, color: sr.color, marginTop: 1, fontWeight: 600 }}>개별 배정</div>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>
                )}
                </div>
              ) : (
                <div style={{ padding: "30px 20px", textAlign: "center", color: "#B0B5C1", background: "#FAFBFC", borderRadius: 10, border: "1.5px dashed #E0E3E9" }}>
                  <span style={{ fontSize: 28 }}>🚪</span>
                  <div style={{ fontSize: 12, marginTop: 8 }}>위에서 층과 호수 범위를 입력하여 호실을 추가하세요</div>
                </div>
              )}
            </div>}
          </Card>}

          {/* Submit Buttons - always visible */}
          {(() => {
            const canSave = !!(regForm.name && (regForm.addressOld || regForm.addressRoad) && regForm.contractStartDate);
            const canPreview = canSave && (corporateOnly || regForm.roomList.length > 0);
            const missingFields = [!regForm.name && "건물명", !(regForm.addressOld || regForm.addressRoad) && "주소", !regForm.contractStartDate && "관리시작일"].filter(Boolean);
            return (
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={handlePreview}
                  style={{ flex: 1, padding: "16px", borderRadius: 12, background: canPreview ? "#1A1D23" : "#D1D5DB", border: "none", color: "#fff", fontWeight: 800, fontSize: 15, cursor: canPreview ? "pointer" : "default", fontFamily: "inherit" }}>
                  {canPreview ? `📋 미리보기` : "📋 미리보기 (호실 필요)"}
                </button>
                <button onClick={() => { if (canSave) handleReg(); }}
                  style={{ flex: 1, padding: "16px", borderRadius: 12, background: canSave ? "#10B981" : "#D1D5DB", border: "none", color: "#fff", fontWeight: 800, fontSize: 15, cursor: canSave ? "pointer" : "default", fontFamily: "inherit", boxShadow: canSave ? "0 2px 12px rgba(16,185,129,0.4)" : "none" }}>
                  {canSave ? `✓ ${regForm.name} 저장` : `${missingFields.join(", ")} 입력 필요`}
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
