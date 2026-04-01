// @ts-nocheck
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { asItems } from '../data';
import { staffRoles, initialStaffMembers } from '../config';
import { useLocalStorage } from '../utils/useLocalStorage';
import { api } from '@/lib/api';
import { modeOptions, ownerFieldCfg, housemanUsageMap, ownerFirstModes, flowMap, banks, acctTypeBg, acctTypeColor, defaultHousemanAccount } from '../config/accountConfig';
import { useIsMobile, fmt, feeLabel } from '../utils';
import { SearchInput, matchKorean } from '../components/SearchInput';
import { Card, SectionTitle, RoomFormSection } from '../components';
import { inputClassName } from '../components/Field';
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
  <div className="flex justify-between items-center cursor-pointer" style={{ marginBottom: open ? 12 : 0 }} onClick={onToggle}>
    <div className="flex-1">
      <div className="text-base font-bold text-hm-text">{icon} {title}</div>
      {subtitle && <div className="text-xs text-hm-text-muted mt-0.5">{subtitle}</div>}
    </div>
    <span className="text-sm text-hm-text-muted transition-transform duration-200" style={{ transform: open ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
  </div>
);

/* ── Helper: label with DB column hint ── */
const RegDbLabel = ({ label, col }) => (
  <div className="text-xs text-hm-text-muted mb-1">{label}</div>
);

/* ── Helper: text input bound to regForm.field via setRegField ── */
const RegInput = ({ saved, field, updateBD, placeholder, type, style: extraStyle, ...rest }) => (
  <input type={type || "text"} value={saved[field] || ""} onChange={e => updateBD({ [field]: type === "number" ? e.target.value : e.target.value })}
    placeholder={placeholder} className={`${inputClassName} !py-2 !px-3 !text-xs`} style={extraStyle} {...rest} />
);

/* ── Helper: checkbox bound to regForm.field via setRegField ── */
const RegCheck = ({ saved, field, updateBD, label, col }) => (
  <div className="flex items-center gap-3">
    <input type="checkbox" checked={!!saved[field]} onChange={e => updateBD({ [field]: e.target.checked })} />
    <div className="text-xs text-hm-text-muted">{label}</div>
  </div>
);

/* ── Helper: select bound to regForm.field via setRegField ── */
const RegSelect = ({ saved, field, updateBD, options, style: extraStyle }) => (
  <select value={saved[field] || ""} onChange={e => updateBD({ [field]: e.target.value })} className={`${inputClassName} !py-2 !px-3 !text-xs`} style={extraStyle}>
    <option value="">선택</option>
    {options.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

/* ── Helper: textarea bound to regForm.field via setRegField ── */
const RegTextarea = ({ saved, field, updateBD, placeholder, rows }) => (
  <textarea value={saved[field] || ""} onChange={e => updateBD({ [field]: e.target.value })}
    placeholder={placeholder} rows={rows || 3}
    className={`${inputClassName} !py-2 !px-3 !text-xs !min-h-[60px] w-full resize-y`} />
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
      <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
      {!value ? (
        <button onClick={() => fileRef.current?.click()}
          className="w-full py-5 px-3 rounded-lg border-[1.5px] border-dashed border-gray-300 bg-hm-bg-hover text-gray-500 text-xs cursor-pointer font-[inherit] text-center hover:border-hm-blue hover:text-hm-blue transition-colors">
          파일 첨부 (이미지/PDF)
        </button>
      ) : (
        <div className="relative">
          <div className="w-full h-20 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center bg-hm-bg-hover">
            {isPdf ? (
              <div className="text-center">
                <div className="text-2xl">PDF</div>
                <div className="text-xs text-gray-500 mt-0.5">{fileName}</div>
              </div>
            ) : (
              <img src={value} alt={label} className="max-w-full max-h-full object-contain" />
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); updateBD({ [field]: null, [field + 'Name']: null, [field + 'Type']: null }); }}
            className="absolute top-1 right-1 w-5 h-5 rounded-full border-none bg-red-500 text-white text-xs cursor-pointer flex items-center justify-center p-0 hover:bg-red-600 transition-colors">X</button>
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

    // API에도 저장
    try {
      const sbBuilding = await api.post<any>('/api/buildings', regForm);
      if (sbBuilding) {
        newBuilding.supabaseId = sbBuilding.id;
        newBuilding.source = 'api';
        console.info(`[API] 건물 "${regForm.name}" + 호실 ${regForm.roomList.length}개 저장 완료`);
      }
    } catch (e) {
      console.error('[API] 건물 저장 실패:', e);
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
      <div className="flex justify-between items-center mb-4">
        <SectionTitle sub={subTab === "list" ? `총 ${filteredBuildings.length}개 건물` : "새 건물 정보 입력"}>🏢 건물 · 호실정보</SectionTitle>
        {subTab === "list" && (
          <button onClick={() => setSubTab("register")}
            className="py-2.5 px-6 rounded-lg border-none bg-hm-blue-dark text-white font-bold text-sm cursor-pointer font-[inherit] flex items-center gap-1.5 whitespace-nowrap shadow-[0_2px_8px_rgba(37,99,235,0.3)] hover:bg-blue-800 active:scale-[0.98] transition-all">
            ➕ 신규 건물 등록
          </button>
        )}
        {subTab === "register" && (
          <button onClick={() => setSubTab("list")}
            className="py-2.5 px-6 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] whitespace-nowrap hover:bg-hm-bg-hover active:scale-[0.98] transition-all">
            ← 건물 목록
          </button>
        )}
      </div>

      {subTab === "list" ? (
        <div>
          {/* 건물 검색 */}
          {/* NOTE: 건물 목록 렌더 시작 */}
          <div className="flex gap-3 items-center mb-3">
            <div className="flex-1">
              <SearchInput value={searchText} onChange={setSearchText} placeholder="건물 검색 (초성 가능: ㅅㅌ → 스타빌, ㄷㅎ → 더힐하우스)" />
            </div>
          </div>
          {/* KPI 요약 */}
          {(() => {
            const totalRooms = filteredBuildings.reduce((s, b) => s + (b.rooms || 0), 0);
            const totalOccupied = activeTenants.filter(t => filteredBuildings.some(b => b.name === t.building)).length;
            const totalVacant = activeVacancies.filter(v => filteredBuildings.some(b => b.name === v.building)).length;
            return (
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-3 mb-4`}>
                <Card className="!p-4 text-center">
                  <div className="text-2xl font-bold text-hm-gray-950">{filteredBuildings.length}</div>
                  <div className="text-xs text-hm-gray-500">총 건물</div>
                </Card>
                <Card className="!p-4 text-center">
                  <div className="text-2xl font-bold text-hm-primary">{totalRooms}</div>
                  <div className="text-xs text-hm-gray-500">총 호실</div>
                </Card>
                <Card className="!p-4 text-center">
                  <div className="text-2xl font-bold text-hm-success">{totalOccupied}</div>
                  <div className="text-xs text-hm-gray-500">입주 중</div>
                </Card>
                <Card className="!p-4 text-center">
                  <div className="text-2xl font-bold text-hm-warning">{totalVacant}</div>
                  <div className="text-xs text-hm-gray-500">공실</div>
                </Card>
              </div>
            );
          })()}

          {(() => {
            const bd = buildingData || {};
            const visibleBuildings = filteredBuildings.filter(b => matchKorean(b.name, searchText));
            return (<>
              {searchText && <div className="text-xs text-hm-text-muted mb-2">검색결과: {visibleBuildings.length}개</div>}
          <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
          {visibleBuildings.map((b, i) => {
            const dynOccupied = activeTenants.filter(t => t.building === b.name).length;
            const dynVacant = activeVacancies.filter(v => v.building === b.name).length;
            const pendingCount = asItems.filter(a => a.building === b.name && a.status !== "완료").length;
            return (
              <Card key={i} onClick={() => onSelectBuilding(b.name)}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-base text-hm-text">{b.name}</span>
                      {b.source === "supabase" && (
                        <span className="text-xs font-bold py-0.5 px-[7px] rounded bg-green-100 text-green-600 border border-green-200">DB</span>
                      )}
                      {b._custom && (
                        <span className="text-xs font-bold py-0.5 px-[7px] rounded bg-hm-blue-bg text-hm-blue-dark border border-blue-200">신규</span>
                      )}
                      {b.special && (
                        <span className={`text-xs font-bold py-0.5 px-[7px] rounded border ${b.special === "무리한 요구" ? "bg-hm-danger-bg text-hm-danger border-hm-danger-border" : "bg-hm-warning-bg text-hm-warning border-hm-warning-border"}`}>
                          ⚠ {b.special}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-hm-text-muted mt-0.5">{b.type}{feeLabel(b) && ` · ${feeLabel(b)}`}</div>
                  </div>
                  {pendingCount > 0 ? (
                    <div className="bg-hm-danger-bg text-hm-danger py-[3px] px-2.5 rounded-md text-xs font-bold">🔧 {pendingCount}건</div>
                  ) : (
                    <div className="bg-hm-success-bg text-hm-success py-[3px] px-2.5 rounded-md text-xs font-bold">민원없음</div>
                  )}
                </div>
                <div className="flex gap-4 text-xs">
                  <div><span className="text-hm-text-muted">전체</span> <span className="font-bold">{b.rooms}실</span></div>
                  <div><span className="text-hm-text-muted">입주</span> <span className="font-bold text-hm-success">{dynOccupied}</span></div>
                  <div><span className="text-hm-text-muted">공실</span> <span className={`font-bold ${dynVacant > 0 ? "text-hm-danger" : "text-hm-text-muted"}`}>{dynVacant}</span></div>
                </div>
              </Card>
            );
          })}
        </div>
            </>);
          })()}
        </div>
      ) : regDone ? (
        <Card className="!py-10 !px-5 text-center">
          <span className="text-5xl">✅</span>
          <div className="text-lg font-bold text-hm-success mt-3">건물이 등록되었습니다</div>
          <div className="text-sm text-hm-text-muted mt-1.5">{regForm.name} · {regForm.roomList.length}개 호실 · 곧 건물 목록으로 이동합니다</div>
        </Card>
      ) : showPreview ? (
        /* ── 미리보기 ── */
        <div>
          <div className="py-3.5 px-5 rounded-xl mb-4 flex justify-between items-center" style={{ background: "linear-gradient(135deg, #1A1D23 0%, #2D3748 100%)" }}>
            <div>
              <div className="text-lg font-[900] text-white">📋 등록 미리보기</div>
              <div className="text-xs text-gray-400 mt-0.5">입력하신 내용을 확인하세요</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPreview(false)} className="py-2 px-5 rounded-lg border-[1.5px] border-gray-400 bg-transparent text-white font-bold text-xs cursor-pointer font-[inherit] hover:bg-white/10 transition-colors">← 수정하기</button>
              <button onClick={handleReg} className="py-2 px-6 rounded-lg border-none bg-emerald-500 text-white font-bold text-sm cursor-pointer font-[inherit] shadow-[0_2px_8px_rgba(16,185,129,0.4)] hover:bg-emerald-600 active:scale-[0.98] transition-all">등록 확인</button>
            </div>
          </div>

          {/* 미리보기: 기본 정보 */}
          <Card className="!mb-3">
            <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">📋 기본 정보</div>
            <div className="grid grid-cols-2 gap-3">
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
                <div key={i} className="flex gap-3 py-[5px] border-b border-gray-100">
                  <span className="text-xs text-hm-text-muted font-semibold min-w-[90px]">{x.l}</span>
                  <span className="text-xs font-bold text-hm-text">{x.v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 미리보기: 건물주 정보 */}
          {regForm.ownerName && (
            <Card className="!mb-3">
              <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">👤 건물주 정보</div>
              {(() => {
                const owners = [
                  { name: regForm.ownerName, ssn: regForm.ownerResidentNumber, phone: regForm.ownerPhone, email: regForm.ownerEmail, address: regForm.ownerHomeAddress },
                  regForm.owner2Name ? { name: regForm.owner2Name, ssn: regForm.owner2ResidentNumber, phone: regForm.owner2Phone, email: regForm.owner2Email, address: regForm.owner2HomeAddress } : null,
                  regForm.owner3Name ? { name: regForm.owner3Name, ssn: regForm.owner3ResidentNumber, phone: regForm.owner3Phone, email: regForm.owner3Email, address: regForm.owner3HomeAddress } : null,
                ].filter(Boolean);
                const ownerColors = [
                  { bg: "bg-blue-50", color: "text-hm-blue-dark", label: "주" },
                  { bg: "bg-purple-50", color: "text-purple-600", label: "부" },
                  { bg: "bg-green-50", color: "text-hm-success", label: "" },
                ];
                return owners.map((ow, oi) => {
                  const c = ownerColors[oi] || ownerColors[0];
                  return (
                    <div key={oi} className={`py-2 px-3 rounded-lg mb-2 ${c.bg}`}>
                      <div className={`text-xs font-bold mb-1.5 ${c.color}`}>건물주 {oi + 1}{c.label ? ` (${c.label})` : ""}</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[{ l: "이름", v: ow.name }, { l: "주민등록번호", v: ow.ssn }, { l: "전화번호", v: ow.phone }].filter(x => x.v).map((x, i) => (
                          <div key={i}><span className="text-xs text-hm-text-muted">{x.l}</span><div className="text-xs font-bold">{x.v}</div></div>
                        ))}
                      </div>
                      {ow.address && <div className="mt-1"><span className="text-xs text-hm-text-muted">주소</span><div className="text-xs font-bold">{ow.address}</div></div>}
                    </div>
                  );
                });
              })()}
            </Card>
          )}

          {/* 미리보기: 건물 계좌 정보 */}
          {(regForm.acctMode1 || regForm.acctMode2) && (
            <Card className="!mb-3">
              <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">🏦 건물 계좌 정보</div>
              <div className={`grid gap-3 ${acctTypes.length === 3 ? "grid-cols-3" : acctTypes.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                {acctTypes.map((aType, ai) => {
                  const suffix = String(ai + 1);
                  const currentMode = regForm[`acctMode${suffix}`];
                  if (!currentMode) return null;
                  const currentOptions = modeOptions[aType] || [];
                  const modeLabel = currentOptions.find(o => o.id === currentMode)?.label || currentMode;
                  const currentOwnerFields = ownerFieldCfg[currentMode] || [];
                  const hmUsage = housemanUsageMap[currentMode];
                  return (
                    <div key={aType} className="py-2.5 px-3 rounded-lg" style={{ background: acctTypeBg[aType], border: `1.5px solid ${acctTypeColor[aType]}40` }}>
                      <div className="text-xs font-bold mb-1.5" style={{ color: acctTypeColor[aType] }}>{aType} · {modeLabel}</div>
                      <div className="text-xs text-hm-text-sub mb-1">💡 {flowMap[currentMode]}</div>
                      {hmUsage && (
                        <div className="text-xs mb-1">
                          <span className="text-hm-blue-dark font-semibold">하우스맨 계좌 ({hmUsage}):</span>
                          <span className="font-mono ml-1">{regForm[`housemanAccount${suffix}`]}</span>
                        </div>
                      )}
                      {currentOwnerFields.map(f => {
                        const accts = regForm[`ownerAccounts${suffix}`] || {};
                        const bank = accts[f.key + "_bank"] || "";
                        const num = accts[f.key] || "";
                        const holder = accts[f.key + "_holder"] || "";
                        if (!bank && !num && !holder) return null;
                        return (
                          <div key={f.key} className="text-xs mb-1">
                            <span className="text-hm-warning font-semibold">{f.label}:</span>
                            <span className="font-mono ml-1">{[bank, num, holder].filter(Boolean).join(" ")}</span>
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
          <Card className="!mb-3">
            <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">💰 정산·청구</div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { l: "수수료 방식", v: regForm.managementFeeType === "percent" ? "%" : regForm.managementFeeType === "fixed" ? "고정" : regForm.managementFeeType === "hybrid" ? "혼합" : "" },
                { l: "수수료율", v: regForm.managementFeeRate ? `${regForm.managementFeeRate}%` : "" },
                { l: "고정 수수료", v: regForm.managementFeeFixedAmount },
                { l: "정산일", v: regForm.settlementDay1 },
                { l: "정산일 2", v: regForm.settlementDay2 },
                { l: "임대료 선후불", v: regForm.rentBillingType === "prepaid" ? "선불" : regForm.rentBillingType === "postpaid" ? "후불" : "" },
                { l: "관리비 선후불", v: regForm.managementFeeBillingType === "prepaid" ? "선불" : regForm.managementFeeBillingType === "postpaid" ? "후불" : "" },
              ].filter(x => x.v).map((x, i) => (
                <div key={i} className="py-1 border-b border-gray-100">
                  <span className="text-xs text-hm-text-muted">{x.l}</span>
                  <div className="text-xs font-bold">{x.v}</div>
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
              <Card className="!mb-3">
                <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">📎 서류</div>
                <div className="flex flex-wrap gap-1.5">
                  {docs.map(d => (
                    <span key={d.field} className="py-1 px-2.5 rounded-md text-xs font-bold bg-hm-success-bg text-hm-success border border-hm-success-border">
                      {d.label} ({regForm[d.field + 'Name'] || '첨부됨'})
                    </span>
                  ))}
                </div>
              </Card>
            );
          })()}

          {/* 미리보기: 호실 목록 */}
          <Card className="!mb-3">
            <div className="text-sm font-bold text-hm-text mb-2.5 border-b-2 border-gray-200 pb-2">🚪 호실 등록 ({regForm.roomList.length}개)</div>
            <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              {regForm.roomList.map((r, i) => {
                const filled = r.roomType && r.standardRent;
                return (
                  <div key={i} className={`py-2.5 px-3 rounded-lg border-[1.5px] ${filled ? "border-hm-success-border bg-green-50" : "border-amber-400 bg-amber-50"}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-hm-text">{r.room}호</span>
                      <span className={`text-xs font-bold py-0.5 px-2 rounded ${filled ? "text-hm-success bg-green-100" : "text-amber-600 bg-amber-100"}`}>
                        {filled ? "입력완료" : "미완성"}
                      </span>
                    </div>
                    {r.roomType && <div className="text-xs text-hm-text-sub">{r.roomType}{r.area ? ` · ${r.area}㎡` : ""}</div>}
                    {acctTypes.length > 1 && (r.buildingType || acctTypes[0]) && (
                      <span className="text-xs py-px px-1.5 rounded font-semibold" style={{ background: acctTypeBg[r.buildingType || acctTypes[0]], color: acctTypeColor[r.buildingType || acctTypes[0]] }}>{r.buildingType || acctTypes[0]}</span>
                    )}
                    {(r.standardRent || r.standardDeposit || r.standardManagementFee) && (
                      <div className="text-xs text-hm-text-muted mt-0.5">
                        {[r.standardDeposit && `예치금 ${r.standardDeposit}`, r.standardRent && `임대료 ${r.standardRent}`, r.standardManagementFee && `관리비 ${r.standardManagementFee}`].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    {r.photos.length > 0 && <div className="text-xs text-hm-blue mt-0.5">📸 사진 {r.photos.length}장</div>}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 하단 버튼 */}
          <div className="flex gap-3 mt-1">
            <button onClick={() => setShowPreview(false)}
              className="flex-1 py-3.5 rounded-xl border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-bg-hover active:scale-[0.98] transition-all">
              ← 수정하기
            </button>
            <button onClick={handleReg}
              className="flex-[2] py-3.5 rounded-xl border-none bg-emerald-500 text-white font-bold text-base cursor-pointer font-[inherit] shadow-[0_2px_12px_rgba(16,185,129,0.4)] hover:bg-emerald-600 active:scale-[0.98] transition-all">
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
              <div className="mb-4 py-2.5 px-4 bg-hm-bg-slate rounded-lg border border-hm-border">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-gray-700">등록 진행률</span>
                  <span className={`text-xs font-bold ${pct === 100 ? "text-hm-success" : "text-amber-600"}`}>{done}/{checks.length} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-sm overflow-hidden mb-1.5">
                  <div className={`h-full rounded-sm transition-[width] duration-300 ${pct === 100 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {checks.map(c => (
                    <span key={c.label} className={`text-xs py-0.5 px-2 rounded font-semibold ${c.done ? "bg-hm-success-bg text-emerald-800" : "bg-hm-danger-bg text-red-800"}`}>
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
          {!corporateOnly && <Card className="!mb-4">
            <SectionHeader icon="🚪" title={`호실 등록 (${regForm.roomList.length}개)`} subtitle="층별 호실 추가 · 상세 정보 입력" open={sec7Open} onToggle={() => setSec7Open(!sec7Open)} />
            {sec7Open && <div>
              {/* Add rooms by floor */}
              <div className="py-3.5 px-4 bg-hm-bg-slate rounded-lg border border-hm-border mb-4">
                <div className="text-xs font-bold text-hm-text-sub mb-2.5">층별 호실 추가</div>
                <div className="flex gap-1.5 items-end">
                  <div className="flex-1">
                    <div className="text-xs text-hm-text-muted mb-[3px]">층</div>
                    <input value={regForm.newFloor} onChange={e => set({newFloor: e.target.value})} placeholder="예: 1, B1"
                      className={`${inputClassName} !py-2 !px-2.5 !text-sm`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-hm-text-muted mb-[3px]">시작 호</div>
                    <input type="number" value={regForm.newFrom} onChange={e => set({newFrom: e.target.value})} placeholder="01"
                      className={`${inputClassName} !py-2 !px-2.5 !text-sm`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-hm-text-muted mb-[3px]">끝 호</div>
                    <input type="number" value={regForm.newTo} onChange={e => set({newTo: e.target.value})} placeholder="04"
                      className={`${inputClassName} !py-2 !px-2.5 !text-sm`} />
                  </div>
                  <button onClick={addRooms}
                    className="py-2 px-4 rounded-lg border-none bg-hm-blue text-white font-bold text-xs cursor-pointer font-[inherit] whitespace-nowrap hover:bg-blue-600 active:scale-[0.98] transition-all">
                    + 추가
                  </button>
                </div>
                <div className="text-xs text-hm-text-muted mt-1.5">1층에 4호실 → 층 "1" 시작 "01" 끝 "04" → 101~104 생성 · 층별로 반복 추가</div>
              </div>

              {/* Room Detail */}
              {regForm.roomList.length > 0 ? (
                <div>
                  {/* 보기 모드 토글: 개별 / 일괄 */}
                  <div className="flex gap-1.5 mb-3">
                    <button onClick={() => set({ roomViewMode: "individual" })}
                      className={`py-1.5 px-4 rounded-md text-xs font-bold cursor-pointer font-[inherit] border-none transition-colors ${(regForm.roomViewMode || "individual") === "individual" ? "bg-hm-text text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      개별 편집
                    </button>
                    <button onClick={() => set({ roomViewMode: "bulk" })}
                      className={`py-1.5 px-4 rounded-md text-xs font-bold cursor-pointer font-[inherit] border-none transition-colors ${regForm.roomViewMode === "bulk" ? "bg-hm-text text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      일괄 편집
                    </button>
                  </div>

                  {/* 일괄 편집 테이블 */}
                  {regForm.roomViewMode === "bulk" ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="py-2 px-2.5 text-left font-bold text-gray-700 border-b border-gray-200 whitespace-nowrap">호실</th>
                            <th className="py-2 px-2.5 text-left font-bold text-gray-700 border-b border-gray-200 whitespace-nowrap">유형</th>
                            <th className="py-2 px-2.5 text-right font-bold text-gray-700 border-b border-gray-200 whitespace-nowrap">면적(㎡)</th>
                            <th className="py-2 px-2.5 text-right font-bold text-gray-700 border-b border-gray-200 whitespace-nowrap">보증금</th>
                            <th className="py-2 px-2.5 text-right font-bold text-gray-700 border-b border-gray-200 whitespace-nowrap">월세</th>
                            <th className="py-2 px-2.5 text-right font-bold text-gray-700 border-b border-gray-200 whitespace-nowrap">관리비</th>
                            <th className="py-2 px-1.5 text-center font-bold text-hm-danger border-b border-gray-200">삭제</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regForm.roomList.map((r, i) => {
                            return (
                              <tr key={i} className="hover:bg-hm-bg-hover transition-colors">
                                <td className="py-1 px-1.5 border-b border-gray-100 font-bold text-xs text-gray-800">{r.room}</td>
                                <td className="py-1 px-1.5 border-b border-gray-100">
                                  <select value={r.roomType || ""} onChange={e => { const updated = [...regForm.roomList]; updated[i] = { ...updated[i], roomType: e.target.value }; set({ roomList: updated }); }}
                                    className={`${inputClassName} !py-1.5 !px-1 !text-xs w-full`}>
                                    <option value="">선택</option>
                                    <option value="원룸">원룸</option><option value="투룸">투룸</option><option value="쓰리룸">쓰리룸</option>
                                    <option value="근생">근생</option><option value="사무실">사무실</option>
                                  </select>
                                </td>
                                <td className="py-1 px-1.5 border-b border-gray-100"><input value={r.area || ""} onChange={e => { const updated = [...regForm.roomList]; updated[i] = { ...updated[i], area: e.target.value }; set({ roomList: updated }); }} className={`${inputClassName} !py-1.5 !px-2 !text-xs w-full text-right`} placeholder="19.8" /></td>
                                <td className="py-1 px-1.5 border-b border-gray-100"><input value={r.standardDeposit || ""} onChange={e => { const updated = [...regForm.roomList]; updated[i] = { ...updated[i], standardDeposit: e.target.value }; set({ roomList: updated }); }} className={`${inputClassName} !py-1.5 !px-2 !text-xs w-full text-right`} placeholder="0" /></td>
                                <td className="py-1 px-1.5 border-b border-gray-100"><input value={r.standardRent || ""} onChange={e => { const updated = [...regForm.roomList]; updated[i] = { ...updated[i], standardRent: e.target.value }; set({ roomList: updated }); }} className={`${inputClassName} !py-1.5 !px-2 !text-xs w-full text-right`} placeholder="0" /></td>
                                <td className="py-1 px-1.5 border-b border-gray-100"><input value={r.standardManagementFee || ""} onChange={e => { const updated = [...regForm.roomList]; updated[i] = { ...updated[i], standardManagementFee: e.target.value }; set({ roomList: updated }); }} className={`${inputClassName} !py-1.5 !px-2 !text-xs w-full text-right`} placeholder="0" /></td>
                                <td className="py-1 px-1.5 border-b border-gray-100 text-center">
                                  <button onClick={() => removeRoom(i)} className="bg-transparent border-none text-hm-danger cursor-pointer text-sm hover:text-red-700 transition-colors">✕</button>
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
                  <div className="flex flex-wrap gap-1 mb-4">
                    {regForm.roomList.map((r, i) => {
                      const filled = r.roomType && r.standardRent;
                      const selected = regForm.editIdx === i;
                      return (
                        <div key={i} onClick={() => set({editIdx: i})}
                          className={`py-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all border-[1.5px] ${selected ? "bg-hm-text text-white border-hm-text" : filled ? "bg-green-100 text-hm-success border-hm-success-border hover:bg-green-200" : "bg-hm-blue-bg text-hm-blue-dark border-blue-200 hover:bg-blue-100"}`}>
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
                      <div className="p-4 bg-hm-bg-slate rounded-xl border-[1.5px] border-hm-input-border">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-[900] text-hm-text">🚪 {r.room}호</span>
                          </div>
                          <div className="flex gap-1.5">
                            {idx > 0 && <button onClick={() => set({editIdx: idx - 1})} className="py-1 px-2.5 rounded-md border border-hm-input-border bg-white text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">← 이전</button>}
                            {idx < regForm.roomList.length - 1 && <button onClick={() => set({editIdx: idx + 1})} className="py-1 px-2.5 rounded-md border border-hm-input-border bg-white text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">다음 →</button>}
                            <button onClick={() => { if (window.confirm(`${r.room}호를 삭제하시겠습니까?`)) removeRoom(idx); }} className="py-1 px-2.5 rounded-md border border-hm-danger-border bg-hm-danger-bg text-hm-danger text-xs font-bold cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">삭제</button>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-hm-blue-dark mb-2.5 pb-1.5 border-b-2 border-blue-200 flex items-center gap-1.5">
                          📋 호실 기본정보 <span className="text-xs font-medium text-hm-text-muted">이 정보가 공실관리 · 홈페이지의 기준값이 됩니다</span>
                        </div>

                        {/* 복합 유형일 때 호실 건물유형 선택 */}
                        {acctTypes.length > 1 && (
                          <div className="mb-2.5 py-2 px-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3">
                            <div className="text-xs font-bold text-hm-blue-dark whitespace-nowrap">🏢 호실 유형</div>
                            <div className="flex gap-1">
                              {acctTypes.map(at => (
                                <button key={at} onClick={() => updateRoom(idx, "buildingType", at)}
                                  className="py-[5px] px-4 rounded-md text-xs font-bold cursor-pointer font-[inherit] transition-colors"
                                  style={{
                                    border: (r.buildingType || acctTypes[0]) === at ? `1.5px solid ${acctTypeColor[at]}` : "1px solid var(--color-hm-input-border)",
                                    background: (r.buildingType || acctTypes[0]) === at ? acctTypeBg[at] : "#fff",
                                    color: (r.buildingType || acctTypes[0]) === at ? acctTypeColor[at] : "var(--color-hm-text-muted)"
                                  }}>
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
                            <div className="mt-3.5 py-2.5 px-4 bg-[#FFFBF0] rounded-lg border border-amber-200">
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-xs font-bold text-amber-800">🏦 계좌 정보</span>
                                <span className="text-xs py-0.5 px-2 rounded font-bold" style={{ background: acctTypeBg[roomBldgType], color: acctTypeColor[roomBldgType] }}>{roomBldgType}</span>
                              </div>
                              {/* 건물 따름 / 호실 개별 토글 */}
                              <div className="flex gap-1 mb-2.5">
                                <button onClick={() => { if (isRoomCustom) disableRoomCustom(); }}
                                  className={`py-[5px] px-3 rounded-md text-xs font-bold cursor-pointer font-[inherit] transition-colors ${!isRoomCustom ? "border-[1.5px] border-emerald-500 bg-green-100 text-emerald-800" : "border border-hm-input-border bg-[#FAFBFC] text-hm-text-sub"}`}>
                                  🏢 건물 설정 따름
                                </button>
                                <button onClick={() => { if (!isRoomCustom) enableRoomCustom(); }}
                                  className={`py-[5px] px-3 rounded-md text-xs font-bold cursor-pointer font-[inherit] transition-colors ${isRoomCustom ? "border-[1.5px] border-amber-500 bg-amber-100 text-amber-800" : "border border-hm-input-border bg-[#FAFBFC] text-hm-text-sub"}`}>
                                  🚪 호실 개별 설정
                                </button>
                              </div>
                              {/* 건물 따름: 읽기전용 표시 — 건물 계좌의 실제 입력값 표시 */}
                              {!isRoomCustom && (
                                <div className="opacity-70">
                                  {!regForm[`acctMode${roomSuffix}`] && <div className="text-xs text-hm-text-muted py-2">건물 계좌가 아직 설정되지 않았습니다. 건물 계좌 정보에서 먼저 설정해주세요.</div>}
                                  {regForm[`acctMode${roomSuffix}`] && (() => {
                                    const curMode = regForm[`acctMode${roomSuffix}`];
                                    const curHmUsage = housemanUsageMap[curMode];
                                    const curHmAcct = regForm[`housemanAccount${roomSuffix}`];
                                    const curOwnerAccts = regForm[`ownerAccounts${roomSuffix}`] || {};
                                    const curOwnerFields = ownerFieldCfg[curMode] || [];
                                    return (
                                      <div className="flex flex-col gap-1.5">
                                        <div className="text-xs text-emerald-800 font-semibold py-1 px-2 bg-hm-success-bg rounded">건물 기본 설정을 따르고 있습니다 (읽기전용)</div>
                                        <div className="py-2 px-2.5 rounded-md" style={{ background: acctTypeBg[roomBldgType], border: `1px solid ${acctTypeColor[roomBldgType]}30` }}>
                                          <div className="text-xs font-bold mb-1" style={{ color: acctTypeColor[roomBldgType] }}>{roomBldgType}</div>
                                          <div className="text-xs text-hm-text-sub mb-1">💡 {flowMap[curMode]}</div>
                                          {/* 하우스맨 계좌 */}
                                          {curHmUsage && (
                                            <div className="py-[5px] px-2 bg-blue-50 rounded-[5px] border border-blue-200 mb-1">
                                              <div className="text-[8px] font-bold text-hm-blue-dark mb-1">🏗️ 하우스맨 ({curHmUsage})</div>
                                              <div className="text-xs font-semibold text-hm-blue-dark font-mono">{curHmAcct || <span className="text-gray-400">미입력</span>}</div>
                                            </div>
                                          )}
                                          {/* 건물주 계좌 */}
                                          {curOwnerFields.length > 0 && (
                                            <div className="py-[5px] px-2 bg-hm-warning-bg rounded-[5px] border border-hm-warning-border">
                                              <div className="text-[8px] font-bold text-hm-warning mb-1">👤 건물주 계좌</div>
                                              {curOwnerFields.map(f => (
                                                <div key={f.key} className="mb-1">
                                                  <div className="text-[7px] font-bold text-hm-warning mb-px">{f.label}</div>
                                                  <div className="text-xs font-semibold text-hm-warning font-mono">
                                                    {curOwnerAccts[f.key + "_bank"] || curOwnerAccts[f.key] ? (
                                                      <>{curOwnerAccts[f.key + "_bank"] || ""} {curOwnerAccts[f.key] || ""}{curOwnerAccts[f.key + "_holder"] ? ` (${curOwnerAccts[f.key + "_holder"]})` : ""}</>
                                                    ) : <span className="text-gray-400 font-sans">미입력</span>}
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
                                      <div key={aType} className="py-2 px-2.5 rounded-md" style={{ background: acctTypeBg[aType], border: `1px solid ${acctTypeColor[aType]}30` }}>
                                        <div className="text-xs font-bold mb-1.5" style={{ color: acctTypeColor[aType] }}>{aType}</div>
                                        <div className="flex gap-[3px] flex-wrap" style={{ marginBottom: curMode ? 6 : 0 }}>
                                          {curOptions.map(opt => (
                                            <button key={opt.id} onClick={() => updateRoomAcctField(modeKey, opt.id)}
                                              className={`py-1 px-2 rounded-[5px] text-xs font-bold cursor-pointer font-[inherit] transition-colors ${curMode === opt.id ? "border-[1.5px] border-amber-500 bg-amber-100 text-amber-800" : "border border-hm-input-border bg-white text-hm-text-sub hover:bg-hm-bg-hover"}`}
                                              title={opt.desc}>{opt.label}</button>
                                          ))}
                                        </div>
                                        {curMode && (() => {
                                          const hmSec = curHmUsage && (
                                            <div key="hm" className="py-1.5 px-2 bg-blue-50 rounded-[5px] border border-blue-200">
                                              <div className="text-[8px] font-bold text-hm-blue-dark mb-[3px]">🏗️ 하우스맨 ({curHmUsage})</div>
                                              <input value={r.roomAcctCustom[hmKey]} onChange={e => updateRoomAcctField(hmKey, e.target.value)}
                                                className={`${inputClassName} !py-1 !px-2 !text-xs w-full font-mono`} />
                                            </div>
                                          );
                                          const owSec = curOwnerFields.length > 0 && (
                                            <div key="ow" className="py-1.5 px-2 bg-hm-warning-bg rounded-[5px] border border-hm-warning-border">
                                              <div className="text-[8px] font-bold text-hm-warning mb-[3px]">👤 건물주 계좌</div>
                                              {curOwnerFields.map(f => (
                                                <div key={f.key} className="mb-[3px]">
                                                  <div className="text-[7px] font-bold text-hm-warning mb-px">{f.label}</div>
                                                  <div className="grid grid-cols-[80px_1fr_60px] gap-[3px]">
                                                    <select value={(r.roomAcctCustom[ownerKey] || {})[f.key + "_bank"] || ""} onChange={e => updateRoomAcctField(ownerKey, { ...r.roomAcctCustom[ownerKey], [f.key + "_bank"]: e.target.value })}
                                                      className={`${inputClassName} !py-1 !px-[5px] !text-xs cursor-pointer`}>
                                                      <option value="">은행</option>
                                                      {banks.map(b => <option key={b} value={b}>{b}</option>)}
                                                    </select>
                                                    <input value={(r.roomAcctCustom[ownerKey] || {})[f.key] || ""} onChange={e => updateRoomAcctField(ownerKey, { ...r.roomAcctCustom[ownerKey], [f.key]: e.target.value })}
                                                      placeholder="계좌번호" className={`${inputClassName} !py-1 !px-1.5 !text-xs font-mono`} />
                                                    <input value={(r.roomAcctCustom[ownerKey] || {})[f.key + "_holder"] || ""} onChange={e => updateRoomAcctField(ownerKey, { ...r.roomAcctCustom[ownerKey], [f.key + "_holder"]: e.target.value })}
                                                      placeholder="예금주" className={`${inputClassName} !py-1 !px-1.5 !text-xs`} />
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          );
                                          return (
                                            <div className="flex flex-col gap-1">
                                              {ownerFirstModes[curMode] ? <>{owSec}{hmSec}</> : <>{hmSec}{owSec}</>}
                                              <div className="text-xs text-hm-text-sub">💡 {flowMap[curMode]}</div>
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
                            <div className="mt-3.5 py-2.5 px-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-bold text-hm-blue-dark">👤 호실 담당자 <span className="text-xs font-medium text-hm-text-muted">건물 기본값 자동 적용 · 호실별 변경 가능</span></div>
                              </div>
                              <div className={`grid gap-1.5 ${isMobile ? "grid-cols-2" : "grid-cols-5"}`}>
                                {staffRoles.map(sr => {
                                  const buildingMgr = regForm[mgrKeyMap[sr.id]] || "";
                                  const roomMgr = r[`room_${sr.id}`];
                                  const effectiveMgr = roomMgr || buildingMgr;
                                  const isOverridden = roomMgr && roomMgr !== buildingMgr;
                                  return (
                                    <div key={sr.id}>
                                      <div className="text-[8px] font-bold mb-1" style={{ color: sr.color }}>{sr.icon} {sr.label}</div>
                                      <select value={roomMgr || ""} onChange={e => updateRoom(idx, `room_${sr.id}`, e.target.value)}
                                        className={`${inputClassName} !py-[5px] !px-1.5 !text-xs cursor-pointer`}
                                        style={{ border: isOverridden ? `1.5px solid ${sr.color}` : undefined, background: isOverridden ? sr.color + "10" : undefined }}>
                                        <option value="">{buildingMgr ? `${buildingMgr} (건물)` : "미배정"}</option>
                                        {staffList.filter(s => s.roles.includes(sr.id)).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                      </select>
                                      {isOverridden && <div className="text-[7px] mt-px font-semibold" style={{ color: sr.color }}>개별 배정</div>}
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
                <div className="py-[30px] px-5 text-center text-gray-400 bg-[#FAFBFC] rounded-lg border-[1.5px] border-dashed border-hm-input-border">
                  <span className="text-2xl">🚪</span>
                  <div className="text-xs mt-2">위에서 층과 호수 범위를 입력하여 호실을 추가하세요</div>
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
              <div className="flex gap-3 mt-1">
                <button onClick={handlePreview}
                  className={`flex-1 py-4 rounded-xl border-none text-white font-bold text-base font-[inherit] ${canPreview ? "bg-hm-text cursor-pointer hover:bg-gray-800 active:scale-[0.98]" : "bg-gray-300 cursor-default"} transition-all`}>
                  {canPreview ? `📋 미리보기` : "📋 미리보기 (호실 필요)"}
                </button>
                <button onClick={() => { if (canSave) handleReg(); }}
                  className={`flex-1 py-4 rounded-xl border-none text-white font-bold text-base font-[inherit] ${canSave ? "bg-emerald-500 cursor-pointer shadow-[0_2px_12px_rgba(16,185,129,0.4)] hover:bg-emerald-600 active:scale-[0.98]" : "bg-gray-300 cursor-default shadow-none"} transition-all`}>
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
