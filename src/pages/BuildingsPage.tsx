import { useState } from 'react';
import { tenants, vacancies, asItems } from '@/data';
import { staffRoles, initialStaffMembers } from '@/config';
import { useLocalStorage } from '@/utils/useLocalStorage';
import { modeOptions, ownerFieldCfg, housemanUsageMap, ownerFirstModes, flowMap, banks, acctTypeBg, acctTypeColor, defaultHousemanAccount } from '@/config/accountConfig';
import { useIsMobile, fmt, feeLabel } from '@/utils';
import { matchKorean } from '@/utils/koreanSearch';
import { Card, SectionTitle, StatusBadge, PhotoDropZone, Field } from '@/components';
import { inputStyle } from '@/components/Field';

const emptyVendor = (withManager: boolean) => ({
  company: "", phone: "", contact: "", contactPhone: "",
  ...(withManager ? { manager: "", managerPhone: "", managerNote: "" } : {}),
});

const initialRegForm: Record<string, any> = {
  name: "", address: "", types: [] as string[],
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
  // 호실
  roomList: [],
  newFloor: "", newFrom: "", newTo: "", editIdx: null,
};

/* ── 접기/펼치기 Card 헤더 ── */
interface SectionHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
}

const SectionHeader = ({ icon, title, subtitle, open, onToggle }: SectionHeaderProps) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? 12 : 0, cursor: "pointer" }} onClick={onToggle}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>{icon} {title}</div>
      {subtitle && <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>{subtitle}</div>}
    </div>
    <span style={{ fontSize: 14, color: "#8F95A3", transition: "transform 0.2s", transform: open ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
  </div>
);

interface BuildingsPageProps {
  onSelectBuilding: (building: string) => void;
  myBuildings?: string[];
  customBuildings?: Record<string, any>[];
  setCustomBuildings?: React.Dispatch<React.SetStateAction<Record<string, any>[]>>;
  allBuildings?: Record<string, any>[];
  setAllBuildings?: React.Dispatch<React.SetStateAction<Record<string, any>[]>>;
  activeTenants?: Record<string, any>[];
  activeVacancies?: Record<string, any>[];
  buildingData?: Record<string, any>;
  setBuildingData?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  parkingInfo?: Record<string, any>;
  isLoading?: boolean;
}

export const BuildingsPage = ({ onSelectBuilding, myBuildings = [], customBuildings = [], setCustomBuildings, allBuildings = [], setAllBuildings, activeTenants = [], activeVacancies = [], isLoading }: BuildingsPageProps) => {
  const isMobile = useIsMobile();
  const [staffList] = useLocalStorage("hm_staffList", initialStaffMembers);
  const filteredBuildings = myBuildings.length > 0 ? allBuildings.filter(b => myBuildings.includes(b.name)) : allBuildings;
  const [subTab, setSubTab] = useState("list");
  const [searchText, setSearchText] = useState("");
  const [regForm, setRegForm] = useState({ ...initialRegForm });
  const [regDone, setRegDone] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // 섹션 접기/펼치기 state
  const [sec1Open, setSec1Open] = useState(true);   // 기본 정보
  const [sec2Open, setSec2Open] = useState(true);   // 건물주 정보
  const [sec3Open, setSec3Open] = useState(false);  // 건물 계좌 정보
  const [sec4Open, setSec4Open] = useState(false);  // 담당자 & 계약 조건
  const [sec5Open, setSec5Open] = useState(false);  // 협력업체
  const [sec6Open, setSec6Open] = useState(false);  // 건물 특이사항
  const [sec7Open, setSec7Open] = useState(true);   // 호실 등록
  const [fireMode, setFireMode] = useState("direct"); // "direct" 직접관리 | "vendor" 협력업체관리

  const set = (patch: Record<string, any>) => setRegForm(f => ({ ...f, ...patch }));
  const setOwner = (idx: number, field: string, value: any) => setRegForm(f => {
    const updated = [...f.owners];
    updated[idx] = { ...updated[idx], [field]: value };
    return { ...f, owners: updated };
  });
  const addOwner = () => setRegForm(f => f.owners.length < 4 ? { ...f, owners: [...f.owners, { name: "", phone: "", ssn: "", address: "", settlement: "" }] } : f);
  const removeOwner = (idx: number) => setRegForm(f => f.owners.length > 1 ? { ...f, owners: f.owners.filter((_: any, i: number) => i !== idx) } : f);
  const setVendor = (key: string, field: string, value: any) => setRegForm(f => ({
    ...f,
    vendors: { ...f.vendors, [key]: { ...f.vendors[key], [field]: value } }
  }));
  const toggleVendor = (key: string) => setRegForm(f => ({
    ...f,
    vendorEnabled: { ...f.vendorEnabled, [key]: !f.vendorEnabled[key] }
  }));

  const addRooms = () => {
    const f = regForm.newFloor;
    const from = parseInt(regForm.newFrom);
    const to = parseInt(regForm.newTo || regForm.newFrom);
    if (!f || isNaN(from)) return;
    const newRooms = [];
    for (let i = from; i <= to; i++) {
      const roomNum = `${f.startsWith("B") || f.startsWith("b") ? f.toUpperCase() : f}${String(i).padStart(2, "0")}`;
      if (!regForm.roomList.find((r: any) => r.room === roomNum)) {
        newRooms.push({ room: roomNum, roomType: "", buildingType: "", area: "", rent: "", mgmt: "", deposit: "", water: "", internet: "", cleanFee: "", elecNo: "", gasNo: "", commFee: "", photos: [] });
      }
    }
    const startIdx = regForm.roomList.length;
    set({ roomList: [...regForm.roomList, ...newRooms], newFloor: "", newFrom: "", newTo: "", editIdx: startIdx });
  };

  const updateRoom = (idx: number, field: string, value: any) => {
    const updated = [...regForm.roomList];
    updated[idx] = { ...updated[idx], [field]: value };
    set({ roomList: updated });
  };

  const removeRoom = (idx: number) => {
    const updated = [...regForm.roomList];
    updated.splice(idx, 1);
    const newIdx = updated.length === 0 ? null : idx >= updated.length ? updated.length - 1 : idx;
    set({ roomList: updated, editIdx: newIdx });
  };

  const handlePreview = () => {
    if (!regForm.name || !regForm.address || regForm.roomList.length === 0) return;
    setShowPreview(true);
  };

  const handleReg = () => {
    // 건물 데이터 구조에 맞게 변환하여 저장
    const newBuilding = {
      name: regForm.name,
      rooms: regForm.roomList.length,
      occupied: 0,
      type: regForm.types.join("+"),
      feeType: regForm.feeType,
      fee: regForm.feeType === "pct" ? parseFloat(regForm.fee) / 100 || 0 : 0,
      fixedFee: regForm.feeType === "fixed" ? parseInt(String(regForm.fixedFee).replace(/,/g, "")) || 0 : 0,
      special: null,
      parkingTotal: parseInt(regForm.parkingTotal) || 0,
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
    setShowPreview(false);
    setRegDone(true);
    setTimeout(() => { setRegDone(false); setSubTab("list"); setRegForm({ ...initialRegForm }); }, 1500);
  };

  // 건물유형 배열 → 계좌타입 직접 파생
  const allBuildingTypes = ["단기", "일반임대", "근생", "관리사무소", "기업시설관리"];
  const buildingTypeLabel: Record<string, string> = { "단기": "단기", "일반임대": "일반임대(주택)", "근생": "근생", "관리사무소": "관리사무소", "기업시설관리": "기업시설관리" };
  const acctTypes = regForm.types.map((t: string) => t === "기업시설관리" ? "관리사무소" : t);

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
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="건물 검색 (초성 가능: ㅅㅌ → 스타빌, ㄷㅎ → 더힐하우스)"
              style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 10, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit", background: "#F8FAFC", outline: "none", boxSizing: "border-box" }} />
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#8F95A3" }}>🔍</span>
            {searchText && <button onClick={() => setSearchText("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 14, color: "#8F95A3", cursor: "pointer" }}>✕</button>}
          </div>
          {searchText && <div style={{ fontSize: 11, color: "#8F95A3", marginBottom: 8 }}>검색결과: {filteredBuildings.filter(b => matchKorean(b.name, searchText)).length}개</div>}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : "repeat(3, 1fr)", gap: 12 }}>
          {filteredBuildings.filter(b => matchKorean(b.name, searchText)).map((b, i) => {
            const dynOccupied = activeTenants.filter(t => t.building === b.name).length;
            const dynVacant = activeVacancies.filter(v => v.building === b.name).length;
            const pendingCount = asItems.filter(a => a.building === b.name && a.status !== "완료").length;
            return (
              <Card key={i} onClick={() => onSelectBuilding(b.name)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#1A1D23" }}>{b.name}</span>
                      {b._custom && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}>신규</span>
                      )}
                      {b.special && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: b.special === "무리한 요구" ? "#FEF2F2" : "#FFF7ED", color: b.special === "무리한 요구" ? "#DC2626" : "#EA580C", border: `1px solid ${b.special === "무리한 요구" ? "#FECACA" : "#FED7AA"}` }}>
                          ⚠ {b.special}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>{b.type}{feeLabel(b as any) && ` · ${feeLabel(b as any)}`}</div>
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
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowPreview(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #A0AEC0", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← 수정하기</button>
              <button onClick={handleReg} style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#10B981", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(16,185,129,0.4)" }}>등록 확인</button>
            </div>
          </div>

          {/* 미리보기: 기본 정보 */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>📋 기본 정보</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { l: "건물명", v: regForm.name },
                { l: "건물 유형", v: regForm.types.join(" + ") },
                { l: "주소", v: regForm.address },
                { l: "도로명 주소", v: regForm.roadAddress },
                { l: "관리 시작일", v: regForm.startDate },
                { l: "사용승인일", v: regForm.approvalDate },
                { l: "현관 비밀번호", v: regForm.entrancePw },
                { l: "CCTV 대수", v: regForm.cctvCount ? `${regForm.cctvCount}대` : "" },
                { l: "건물주차총대수", v: regForm.parkingTotal ? `${regForm.parkingTotal}대` : "" },
              ].filter(x => x.v).map((x, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 11, color: "#8F95A3", fontWeight: 600, minWidth: 90 }}>{x.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{x.v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 미리보기: 건물주 정보 */}
          {regForm.owners.some((ow: any) => ow.name) && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>👤 건물주 정보</div>
              {(() => {
                const ownerColors = [
                  { bg: "#F0F4FF", color: "#2563EB", label: "주" },
                  { bg: "#F5F3FF", color: "#7C3AED", label: "부" },
                  { bg: "#FFF7ED", color: "#EA580C", label: "" },
                  { bg: "#F0FDF4", color: "#059669", label: "" },
                ];
                return regForm.owners.filter((ow: any) => ow.name).map((ow: any, oi: number) => {
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
                      {ow.settlement && <div style={{ marginTop: 2 }}><span style={{ fontSize: 9, color: "#8F95A3" }}>정산계좌</span><div style={{ fontSize: 12, fontWeight: 700 }}>{ow.settlement}</div></div>}
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
                {acctTypes.map((aType: string, ai: number) => {
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

          {/* 미리보기: 담당자 & 계약 조건 */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🏢 담당자 & 계약 조건</div>
            {/* 담당자 */}
            {(() => {
              const mgrs = [
                { key: "internalMgr", role: "internal" },
                { key: "externalMgr", role: "external" },
                { key: "collectionMgr", role: "collection" },
                { key: "contractMgr", role: "contract" },
                { key: "generalMgr", role: "general" },
              ].filter(m => regForm[m.key]);
              return mgrs.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {mgrs.map(m => {
                    const sr = staffRoles.find(r => r.id === m.role)!;
                    return (
                      <span key={m.key} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: sr?.color + "15", color: sr?.color, border: `1px solid ${sr?.color}40` }}>
                        {sr?.icon} {sr?.label}: {regForm[m.key]}
                      </span>
                    );
                  })}
                </div>
              );
            })()}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[
                { l: "수수료", v: regForm.feeType === "pct" ? (regForm.fee ? `${regForm.fee}%` : "") : (regForm.fixedFee ? `${regForm.fixedFee}원` : "") },
                regForm.types.includes("단기") ? { l: "7일패널티", v: regForm.penaltyOwner } : null,
                { l: "부가가치세", v: regForm.vatType },
                (regForm.types.includes("단기") || regForm.types.includes("일반임대")) ? { l: "표준임대차", v: regForm.standardLease } : null,
                { l: "순회주기", v: regForm.visitCycle },
                { l: "E-MAIL", v: regForm.email },
              ].filter(x => x && x.v).map((x: any, i: number) => (
                <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 10, color: "#8F95A3" }}>{x.l}</span>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{x.v}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* 미리보기: 협력업체 */}
          {Object.values(regForm.vendorEnabled).some(v => v) && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🔧 협력업체</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { key: "cleaning", label: "청소", icon: "🧹", color: "#10B981" },
                  { key: "elevator", label: "승강기", icon: "🛗", color: "#3B82F6" },
                  { key: "fire", label: "소방", icon: "🔥", color: "#DC2626" },
                  { key: "mechElevator", label: "기계식승강기", icon: "⚙️", color: "#6366F1" },
                  { key: "disinfect", label: "소독", icon: "🧴", color: "#8B5CF6" },
                  { key: "custom1", label: "기타1", icon: "📋", color: "#64748B" },
                  { key: "custom2", label: "기타2", icon: "📋", color: "#64748B" },
                ].filter(v => regForm.vendorEnabled[v.key]).map(v => {
                  const vd = regForm.vendors[v.key];
                  const displayLabel = v.label.startsWith("기타") ? (vd.label || v.label) : v.label;
                  return (
                    <div key={v.key} style={{ padding: "8px 12px", background: v.color + "08", borderRadius: 8, border: `1px solid ${v.color}30` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: v.color, marginBottom: 4 }}>{v.icon} {displayLabel}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, fontSize: 11 }}>
                        {[
                          { l: "업체명", v: vd.company },
                          { l: "연락처", v: vd.phone },
                          { l: "담당자", v: vd.contact },
                          { l: "담당자 휴대폰", v: vd.contactPhone },
                        ].filter(x => x.v).map((x, i) => (
                          <div key={i}><span style={{ fontSize: 9, color: "#8F95A3" }}>{x.l}</span><div style={{ fontWeight: 600 }}>{x.v}</div></div>
                        ))}
                      </div>
                      {vd.manager && (
                        <div style={{ marginTop: 4, paddingTop: 4, borderTop: `1px dashed ${v.color}40`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, fontSize: 11 }}>
                          {[
                            { l: "안전관리자", v: vd.manager },
                            { l: "연락처", v: vd.managerPhone },
                            { l: "자격/비고", v: vd.managerNote },
                          ].filter(x => x.v).map((x, i) => (
                            <div key={i}><span style={{ fontSize: 9, color: "#8F95A3" }}>{x.l}</span><div style={{ fontWeight: 600 }}>{x.v}</div></div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* 미리보기: 건물 특이사항 */}
          {regForm.buildingNotes && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>📝 건물 특이사항</div>
              <div style={{ fontSize: 12, color: "#3D4251", lineHeight: 1.8, whiteSpace: "pre-wrap", padding: "10px 12px", background: "#FAFBFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                {regForm.buildingNotes}
              </div>
            </Card>
          )}

          {/* 미리보기: 호실 목록 */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 10, borderBottom: "2px solid #E5E7EB", paddingBottom: 8 }}>🚪 호실 등록 ({regForm.roomList.length}개)</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 8 }}>
              {regForm.roomList.map((r: any, i: number) => {
                const filled = r.roomType && r.rent;
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
                    {(r.rent || r.deposit || r.mgmt) && (
                      <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 2 }}>
                        {[r.deposit && `예치금 ${r.deposit}`, r.rent && `임대료 ${r.rent}`, r.mgmt && `관리비 ${r.mgmt}`].filter(Boolean).join(" · ")}
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
          {/* ── Section 1: 기본 정보 ── */}
          <Card style={{ marginBottom: 16 }}>
            <SectionHeader icon="📋" title="기본 정보" subtitle="건물명 · 주소 · 유형 · 시설" open={sec1Open} onToggle={() => setSec1Open(!sec1Open)} />
            {sec1Open && <div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>건물명 <span style={{ color: "#DC2626" }}>*</span></div>
                <input value={regForm.name} onChange={e => set({name: e.target.value})} placeholder="예: 스타빌" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>건물 유형 (최대 3개) <span style={{ color: "#DC2626" }}>*</span></div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    {(() => {
                      const firstType = regForm.types[0] || "";
                      const acctKey = firstType === "기업시설관리" ? "관리사무소" : firstType;
                      return (
                        <select value={firstType} onChange={e => {
                          const v = e.target.value;
                          if (!v) { set({ types: [] }); return; }
                          const updated = [...regForm.types];
                          if (updated.length === 0) updated.push(v); else updated[0] = v;
                          set({ types: updated });
                        }}
                          style={{ ...inputStyle, width: "auto", padding: "5px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", background: firstType ? (acctTypeBg[acctKey] || "#F3F4F6") : "#fff", color: firstType ? (acctTypeColor[acctKey] || "#5F6577") : "#8F95A3", borderColor: firstType ? (acctTypeColor[acctKey] || "#E0E3E9") + "60" : "#E0E3E9" }}>
                          <option value="">-- 유형 선택 --</option>
                          {allBuildingTypes.map(bt => (
                            <option key={bt} value={bt} disabled={regForm.types.includes(bt) && regForm.types[0] !== bt}>{buildingTypeLabel[bt]}</option>
                          ))}
                        </select>
                      );
                    })()}
                    {regForm.types.slice(1).map((t: string, ti: number) => {
                      const realIdx = ti + 1;
                      const acctKey = t === "기업시설관리" ? "관리사무소" : t;
                      return (
                        <div key={realIdx} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <select value={t} onChange={e => { const updated = [...regForm.types]; updated[realIdx] = e.target.value; set({ types: updated }); }}
                            style={{ ...inputStyle, width: "auto", padding: "5px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", background: acctTypeBg[acctKey] || "#F3F4F6", color: acctTypeColor[acctKey] || "#5F6577", borderColor: (acctTypeColor[acctKey] || "#E0E3E9") + "60" }}>
                            {allBuildingTypes.map(bt => (
                              <option key={bt} value={bt} disabled={bt !== t && regForm.types.includes(bt)}>{buildingTypeLabel[bt]}</option>
                            ))}
                          </select>
                          <button onClick={() => set({ types: regForm.types.filter((_: any, i: number) => i !== realIdx) })}
                            style={{ width: 20, height: 20, borderRadius: 5, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontFamily: "inherit" }}>✕</button>
                        </div>
                      );
                    })}
                    {regForm.types.length >= 1 && regForm.types.length < 3 && (
                      <button onClick={() => { const remaining = allBuildingTypes.filter(bt => !regForm.types.includes(bt)); if (remaining.length > 0) set({ types: [...regForm.types, remaining[0]] }); }}
                        style={{ padding: "5px 12px", borderRadius: 6, border: "1.5px dashed #3B82F6", background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        ＋ 유형 추가
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>관리시작일 <span style={{ color: "#DC2626" }}>*</span></div>
                  <input type="date" value={regForm.startDate} onChange={e => set({startDate: e.target.value})} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>🔑 현관 비밀번호</div>
                  <input value={regForm.entrancePw} onChange={e => set({entrancePw: e.target.value})} placeholder="비밀번호" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, fontFamily: "monospace", letterSpacing: 1 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>주소 <span style={{ color: "#DC2626" }}>*</span></div>
                  <input value={regForm.address} onChange={e => set({address: e.target.value})} placeholder="예: 서울 관악구 봉천동 123-45" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>도로명 주소</div>
                  <input value={regForm.roadAddress} onChange={e => set({roadAddress: e.target.value})} placeholder="도로명 주소" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>시설</div>
                  <div style={{ display: "flex", gap: 8, padding: "6px 0", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#3D4251" }}>CCTV</span>
                    <input type="number" min="0" value={regForm.cctvCount} onChange={e => set({cctvCount: e.target.value})} placeholder="0" style={{ ...inputStyle, width: 44, padding: "4px 6px", fontSize: 10, textAlign: "center" }} />
                    <span style={{ fontSize: 9, color: "#8F95A3" }}>대</span>
                    <span style={{ fontSize: 10, color: "#3D4251", marginLeft: 6 }}>건물주차총대수</span>
                    <input type="number" min="0" value={regForm.parkingTotal} onChange={e => set({parkingTotal: e.target.value})} placeholder="0" style={{ ...inputStyle, width: 44, padding: "4px 6px", fontSize: 10, textAlign: "center" }} />
                    <span style={{ fontSize: 9, color: "#8F95A3" }}>대</span>
                  </div>
                </div>
              </div>
            </div>}
          </Card>

          {/* ── Section 2: 건물주 정보 ── */}
          <Card style={{ marginBottom: 16 }}>
            <SectionHeader icon="👤" title="건물주 정보" subtitle={`건물주 ${regForm.owners.length}명 · 최대 4명`} open={sec2Open} onToggle={() => setSec2Open(!sec2Open)} />
            {sec2Open && <div>
              {(() => {
                const ownerColors = [
                  { bg: "#F0F4FF", border: "#BFDBFE", color: "#2563EB", label: "주" },
                  { bg: "#F5F3FF", border: "#DDD6FE", color: "#7C3AED", label: "부" },
                  { bg: "#FFF7ED", border: "#FED7AA", color: "#EA580C", label: "" },
                  { bg: "#F0FDF4", border: "#BBF7D0", color: "#059669", label: "" },
                ];
                return regForm.owners.map((ow: any, oi: number) => {
                  const c = ownerColors[oi] || ownerColors[0];
                  return (
                    <div key={oi} style={{ padding: "10px 12px", background: c.bg, borderRadius: 8, border: `1px solid ${c.border}`, marginBottom: oi < regForm.owners.length - 1 ? 10 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: c.color }}>건물주 {oi + 1}{c.label ? ` (${c.label})` : ""}</span>
                          {oi === 0 && regForm.owners.length < 4 && (
                            <button onClick={addOwner}
                              style={{ padding: "2px 10px", borderRadius: 5, border: `1.5px dashed ${c.color}`, background: "transparent", color: c.color, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>＋ 건물주 추가</button>
                          )}
                        </div>
                        {oi > 0 && (
                          <button onClick={() => removeOwner(oi)}
                            style={{ padding: "2px 8px", borderRadius: 5, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✕ 삭제</button>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                        <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>이름</div><input value={ow.name} onChange={e => setOwner(oi, "name", e.target.value)} placeholder="홍길동" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                        <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>주민등록번호</div><input value={ow.ssn} onChange={e => setOwner(oi, "ssn", e.target.value)} placeholder="000000-0000000" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} /></div>
                        <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>전화번호</div><input value={ow.phone} onChange={e => setOwner(oi, "phone", e.target.value)} placeholder="010-0000-0000" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      </div>
                      <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>주소</div><input value={ow.address} onChange={e => setOwner(oi, "address", e.target.value)} placeholder="건물주 주소" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      <div style={{ marginTop: 6 }}><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>정산계좌</div><input value={ow.settlement} onChange={e => setOwner(oi, "settlement", e.target.value)} placeholder="은행명 + 계좌번호 + 예금주" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                    </div>
                  );
                });
              })()}
            </div>}
          </Card>

          {/* ── Section 3: 건물 계좌 정보 ── */}
          <Card style={{ marginBottom: 16 }}>
            <SectionHeader icon="🏦" title="건물 계좌 정보" subtitle={`기본정보 건물유형(${regForm.types.join(" + ")})에서 자동 반영 · 호실이 자동으로 상속합니다`} open={sec3Open} onToggle={() => setSec3Open(!sec3Open)} />
            {sec3Open && <div>
              <div style={{ display: "grid", gridTemplateColumns: acctTypes.length === 3 ? "1fr 1fr 1fr" : acctTypes.length === 2 ? "1fr 1fr" : "1fr", gap: 12 }}>
                {acctTypes.map((aType: string, ai: number) => {
                  const suffix = String(ai + 1);
                  const modeKey = `acctMode${suffix}`;
                  const hmKey = `housemanAccount${suffix}`;
                  const ownerKey = `ownerAccounts${suffix}`;
                  const currentOptions = modeOptions[aType] || [];
                  const currentMode = currentOptions.find(o => o.id === regForm[modeKey]) ? regForm[modeKey] : "";
                  const currentOwnerFields = ownerFieldCfg[currentMode] || [];
                  const currentHmUsage = housemanUsageMap[currentMode];
                  return (
                    <div key={aType} style={{ padding: "10px 12px", background: acctTypeBg[aType], borderRadius: 8, border: `1.5px solid ${acctTypeColor[aType]}40` }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: acctTypeColor[aType], marginBottom: 8 }}>{aType}</div>
                      {/* 모드 선택 */}
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: currentMode ? 8 : 0 }}>
                        {currentOptions.map(opt => (
                          <button key={opt.id} onClick={() => set({ [modeKey]: opt.id, [ownerKey]: {} })}
                            style={{ padding: "5px 10px", borderRadius: 6, border: currentMode === opt.id ? "1.5px solid #F59E0B" : "1px solid #E0E3E9", background: currentMode === opt.id ? "#FEF3C7" : "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: currentMode === opt.id ? "#92400E" : "#5F6577" }}
                            title={opt.desc}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {/* 계좌 입력 */}
                      {currentMode && (() => {
                        const hmSection = currentHmUsage && (
                          <div key="hm" style={{ padding: "8px 10px", background: "#F0F4FF", borderRadius: 6, border: "1px solid #BFDBFE" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#2563EB", marginBottom: 4 }}>🏗️ 하우스맨 계좌 <span style={{ color: "#8F95A3", fontWeight: 500 }}>({currentHmUsage})</span></div>
                            <input value={regForm[hmKey]} onChange={e => set({ [hmKey]: e.target.value })}
                              style={{ ...inputStyle, padding: "6px 10px", fontSize: 11, width: "100%", fontFamily: "monospace" }} />
                          </div>
                        );
                        const ownerSection = currentOwnerFields.length > 0 && (
                          <div key="owner" style={{ padding: "8px 10px", background: "#FFF7ED", borderRadius: 6, border: "1px solid #FED7AA" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#EA580C", marginBottom: 4 }}>👤 건물주 계좌</div>
                            {currentOwnerFields.map(f => (
                              <div key={f.key} style={{ marginBottom: 4 }}>
                                <div style={{ fontSize: 8, fontWeight: 700, color: "#EA580C", marginBottom: 2 }}>{f.label}</div>
                                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 70px", gap: 4 }}>
                                  <select value={(regForm[ownerKey] || {})[f.key + "_bank"] || ""} onChange={e => set({ [ownerKey]: { ...regForm[ownerKey], [f.key + "_bank"]: e.target.value } })}
                                    style={{ ...inputStyle, padding: "5px 6px", fontSize: 10, cursor: "pointer" }}>
                                    <option value="">은행</option>
                                    {banks.map(b => <option key={b} value={b}>{b}</option>)}
                                  </select>
                                  <input value={(regForm[ownerKey] || {})[f.key] || ""} onChange={e => set({ [ownerKey]: { ...regForm[ownerKey], [f.key]: e.target.value } })}
                                    placeholder="계좌번호" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} />
                                  <input value={(regForm[ownerKey] || {})[f.key + "_holder"] || ""} onChange={e => set({ [ownerKey]: { ...regForm[ownerKey], [f.key + "_holder"]: e.target.value } })}
                                    placeholder="예금주" style={{ ...inputStyle, padding: "5px 8px", fontSize: 10 }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {ownerFirstModes[currentMode] ? <>{ownerSection}{hmSection}</> : <>{hmSection}{ownerSection}</>}
                            <div style={{ fontSize: 10, color: "#5F6577", padding: "4px 0" }}>💡 {flowMap[currentMode]}</div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>}
          </Card>

          {/* ── Section 4: 담당자 & 계약 조건 ── */}
          <Card style={{ marginBottom: 16 }}>
            <SectionHeader icon="🏢" title="담당자 & 계약 조건" subtitle="역할별 담당자 · 수수료 · 순회주기 · 정산계좌 · 이메일" open={sec4Open} onToggle={() => setSec4Open(!sec4Open)} />
            {sec4Open && <div>
              {/* 담당자 배정 */}
              <div style={{ padding: "8px 12px", background: "#F0F4FF", borderRadius: 8, marginBottom: 12, border: "1px solid #BFDBFE" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#2563EB", marginBottom: 6 }}>👤 담당자 배정</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 6 }}>
                  {[
                    { key: "internalMgr", role: "internal" },
                    { key: "externalMgr", role: "external" },
                    { key: "collectionMgr", role: "collection" },
                    { key: "contractMgr", role: "contract" },
                    { key: "generalMgr", role: "general" },
                  ].map(m => {
                    const sr = staffRoles.find(r => r.id === m.role)!;
                    return (
                      <div key={m.key}>
                        <div style={{ fontSize: 9, color: sr?.color, fontWeight: 700, marginBottom: 2 }}>{sr?.icon} {sr?.label}</div>
                        <select value={regForm[m.key]} onChange={e => set({[m.key]: e.target.value})} style={{...inputStyle, padding: "5px 8px", fontSize: 10, cursor: "pointer"}}>
                          <option value="">선택</option>
                          {staffList.filter(s => s.roles.includes(m.role)).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* 수수료 & 계약조건 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>수수료 유형</div>
                  <select value={regForm.feeType} onChange={e => set({feeType: e.target.value})} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>
                    <option value="pct">수수료율 (%)</option>
                    <option value="fixed">정액제 (원)</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>{regForm.feeType === "pct" ? "수수료율" : "정액 금액"}</div>
                  {regForm.feeType === "pct" ? (
                    <input value={regForm.fee} onChange={e => set({fee: e.target.value})} placeholder="예: 7.0%" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, textAlign: "right" }} />
                  ) : (
                    <input value={regForm.fixedFee} onChange={e => set({fixedFee: e.target.value})} placeholder="예: 1,500,000" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, textAlign: "right" }} />
                  )}
                </div>
                {regForm.types.includes("단기") && <div>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>7일패널티 소유</div>
                  <select value={regForm.penaltyOwner} onChange={e => set({penaltyOwner: e.target.value})} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>
                    {["건물주", "하우스맨", "해당없음"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>}
                <div>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부가가치세</div>
                  <select value={regForm.vatType} onChange={e => set({vatType: e.target.value})} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>
                    {["포함", "별도", "없음"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                {(regForm.types.includes("단기") || regForm.types.includes("일반임대")) && <div>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>표준임대차</div>
                  <select value={regForm.standardLease} onChange={e => set({standardLease: e.target.value})} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>
                    {["사용", "미사용"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>}
                <div>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>🚶 순회주기</div>
                  <select value={regForm.visitCycle} onChange={e => set({visitCycle: e.target.value})} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>
                    <option value="">선택</option>
                    {["매일", "격일", "주2회", "주1회", "월4회", "월3회", "월2회", "월1회", "없음"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>E-MAIL</div>
                  <input value={regForm.email} onChange={e => set({email: e.target.value})} placeholder="example@email.com" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }} />
                </div>
              </div>
            </div>}
          </Card>

          {/* ── Section 5: 협력업체 ── */}
          <Card style={{ marginBottom: 16 }}>
            <SectionHeader icon="🔧" title="협력업체" subtitle="소방 · 승강기 · 청소 · 소독 등 외주업체" open={sec5Open} onToggle={() => setSec5Open(!sec5Open)} />
            {sec5Open && <div>
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
                  <label key={v.key} onClick={() => toggleVendor(v.key)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                      background: regForm.vendorEnabled[v.key] ? (v.color + "15") : "#fff",
                      border: `1.5px solid ${regForm.vendorEnabled[v.key] ? v.color : "#E0E3E9"}`,
                      color: regForm.vendorEnabled[v.key] ? v.color : "#8F95A3" }}>
                    <input type="checkbox" checked={regForm.vendorEnabled[v.key]} readOnly
                      style={{ accentColor: v.color, cursor: "pointer" }} />
                    <span>{v.icon}</span> {v.label}
                  </label>
                ))}
              </div>

              {/* 선택된 업체 입력 폼 (순서: 청소→승강기→소방→기계식승강기→소독→기타1→기타2) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {/* 관리자 있는 업체: 소방/승강기/기계식승강기 */}
                {[
                  { key: "cleaning", label: "청소", icon: "🧹", color: "#10B981", type: "simple" },
                  { key: "elevator", label: "승강기", icon: "🛗", color: "#3B82F6", person: "승강기안전관리자", type: "withManager" },
                  { key: "fire", label: "소방", icon: "🔥", color: "#DC2626", person: "소방안전관리자", type: "withManager" },
                  { key: "mechElevator", label: "기계식승강기", icon: "⚙️", color: "#6366F1", person: "기계식승강기안전관리자", type: "withManager" },
                  { key: "disinfect", label: "소독", icon: "🧴", color: "#8B5CF6", type: "simple" },
                  { key: "custom1", label: "custom1", icon: "📋", color: "#64748B", type: "simple" },
                  { key: "custom2", label: "custom2", icon: "📋", color: "#64748B", type: "simple" },
                ].filter(v => regForm.vendorEnabled[v.key]).map((v, i) => v.key === "fire" ? (
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
                      <div><input type="date" value={regForm.approvalDate} onChange={e => set({approvalDate: e.target.value})} style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, maxWidth: 180 }} /></div>
                    </div>
                    {fireMode === "vendor" && (
                      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600 }}>협력업체</span>
                        <div><input value={regForm.vendors[v.key].company} onChange={e => setVendor(v.key, "company", e.target.value)} placeholder="업체명" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                        <div><input value={regForm.vendors[v.key].phone} onChange={e => setVendor(v.key, "phone", e.target.value)} placeholder="업체 연락처" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                        <div><input value={regForm.vendors[v.key].contact} onChange={e => setVendor(v.key, "contact", e.target.value)} placeholder="업체 담당자" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                        <div><input value={regForm.vendors[v.key].contactPhone} onChange={e => setVendor(v.key, "contactPhone", e.target.value)} placeholder="담당자 휴대폰" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "6px 0 0 0", borderTop: `1px dashed ${v.color}40` }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: v.color }}>👤 소방안전관리자</span>
                      <div><input value={regForm.vendors[v.key].manager} onChange={e => setVendor(v.key, "manager", e.target.value)} placeholder="성명" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      <div><input value={regForm.vendors[v.key].managerPhone} onChange={e => setVendor(v.key, "managerPhone", e.target.value)} placeholder="연락처" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      <div><input value={regForm.vendors[v.key].managerNote} onChange={e => setVendor(v.key, "managerNote", e.target.value)} placeholder="자격/비고" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                    </div>
                  </div>
                ) : v.type === "withManager" ? (
                  <div key={v.key} style={{ padding: "10px 12px", background: i % 2 === 0 ? "#FAFBFC" : "#fff", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: v.color, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <span>{v.icon}</span> {v.label}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600 }}>협력업체</span>
                      <div><input value={regForm.vendors[v.key].company} onChange={e => setVendor(v.key, "company", e.target.value)} placeholder="업체명" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      <div><input value={regForm.vendors[v.key].phone} onChange={e => setVendor(v.key, "phone", e.target.value)} placeholder="업체 연락처" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      <div><input value={regForm.vendors[v.key].contact} onChange={e => setVendor(v.key, "contact", e.target.value)} placeholder="업체 담당자" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      <div><input value={regForm.vendors[v.key].contactPhone} onChange={e => setVendor(v.key, "contactPhone", e.target.value)} placeholder="담당자 휴대폰" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "6px 0 0 0", borderTop: `1px dashed ${v.color}40` }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: v.color }}>👤 {v.person}</span>
                      <div><input value={regForm.vendors[v.key].manager} onChange={e => setVendor(v.key, "manager", e.target.value)} placeholder="성명" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      <div><input value={regForm.vendors[v.key].managerPhone} onChange={e => setVendor(v.key, "managerPhone", e.target.value)} placeholder="연락처" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      <div><input value={regForm.vendors[v.key].managerNote} onChange={e => setVendor(v.key, "managerNote", e.target.value)} placeholder="자격/비고" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                    </div>
                  </div>
                ) : (
                  <div key={v.key} style={{ padding: "8px 12px", background: i % 2 === 0 ? "#FAFBFC" : "#fff", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
                      {v.label.startsWith("custom") ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{v.icon}</span>
                          <input value={regForm.vendors[v.key].label || ""} onChange={e => setVendor(v.key, "label", e.target.value)} placeholder={`기타${v.label.slice(-1)} (입력)`} style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontWeight: 700 }} />
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, fontWeight: 700, color: v.color, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{v.icon}</span> {v.label}
                        </div>
                      )}
                      <div><input value={regForm.vendors[v.key].company} onChange={e => setVendor(v.key, "company", e.target.value)} placeholder="회사명" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      <div><input value={regForm.vendors[v.key].phone} onChange={e => setVendor(v.key, "phone", e.target.value)} placeholder="연락처" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      <div><input value={regForm.vendors[v.key].contact} onChange={e => setVendor(v.key, "contact", e.target.value)} placeholder="담당자명" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                      <div><input value={regForm.vendors[v.key].contactPhone} onChange={e => setVendor(v.key, "contactPhone", e.target.value)} placeholder="담당자 휴대폰" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} /></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 아무것도 선택 안 했을 때 안내 */}
              {!Object.values(regForm.vendorEnabled).some(v => v) && (
                <div style={{ padding: "20px", textAlign: "center", color: "#B0B5C1", fontSize: 12 }}>
                  위 체크박스를 선택하면 해당 협력업체 입력란이 표시됩니다
                </div>
              )}
            </div>}
          </Card>

          {/* ── Section 6: 건물 특이사항 ── */}
          <Card style={{ marginBottom: 16 }}>
            <SectionHeader icon="📝" title="건물 특이사항" subtitle="관리 참고사항 · 이력 기록" open={sec6Open} onToggle={() => setSec6Open(!sec6Open)} />
            {sec6Open &&
              <textarea value={regForm.buildingNotes} onChange={e => set({buildingNotes: e.target.value})}
                placeholder={"건물 특이사항을 순차적으로 기록하세요.\n\n예시:\n- 2024.03 관리 시작. 1층 상가 분리 계량기 없어 공용전기에서 차감\n- 2024.05 옥상 방수공사 완료 (건물주 부담)\n- 2024.08 3층 배관 노후로 전체 교체\n- 세무사: 홍길동 세무사 (010-1234-5678)\n- 2025.01 소방점검 지적사항: 2층 비상구 표지등 불량\n..."}
                rows={12}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.8, fontSize: 12, padding: "12px 14px", minHeight: 200 }} />
            }
          </Card>

          {/* ── Section 7: 호실 등록 ── */}
          <Card style={{ marginBottom: 16 }}>
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
                  {/* Room tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
                    {regForm.roomList.map((r: any, i: number) => {
                      const filled = r.roomType && r.rent;
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
                            <button onClick={() => removeRoom(idx)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>삭제</button>
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
                              {acctTypes.map((at: string) => (
                                <button key={at} onClick={() => updateRoom(idx, "buildingType", at)}
                                  style={{ padding: "5px 14px", borderRadius: 6, border: (r.buildingType || acctTypes[0]) === at ? `1.5px solid ${acctTypeColor[at]}` : "1px solid #E0E3E9", background: (r.buildingType || acctTypes[0]) === at ? acctTypeBg[at] : "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: (r.buildingType || acctTypes[0]) === at ? acctTypeColor[at] : "#8F95A3" }}>
                                  {at}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>방형태</div>
                                <select value={r.roomType} onChange={e => updateRoom(idx, "roomType", e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>
                                  <option value="">선택</option>
                                  {["원룸","투룸","쓰리룸","복층","상가","사무실"].map(t => <option key={t} value={t}>{t}</option>)}
                                </select></div>
                              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>면적 (㎡)</div>
                                <input value={r.area} onChange={e => updateRoom(idx, "area", e.target.value)} placeholder="26.4" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11 }} /></div>
                              <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산수수료</div>
                                <input value={r.commFee} onChange={e => updateRoom(idx, "commFee", e.target.value)} placeholder="200,000" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, textAlign: "right" }} /></div>
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 6 }}>💰 기준 금액</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                              {[
                                { key: "deposit", label: "예치금", ph: "650,000" },
                                { key: "rent", label: "임대료", ph: "650,000" },
                                { key: "mgmt", label: "관리비", ph: "80,000" },
                                { key: "water", label: "수도", ph: "10,000" },
                                { key: "internet", label: "인터넷", ph: "20,000" },
                                { key: "cleanFee", label: "퇴실청소비", ph: "150,000" },
                              ].map(f => (
                                <div key={f.key}><div style={{ fontSize: 8, color: "#059669", marginBottom: 2 }}>{f.label}</div>
                                  <input value={r[f.key]} onChange={e => updateRoom(idx, f.key, e.target.value)} placeholder={f.ph} style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, textAlign: "right" }} /></div>
                              ))}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", marginBottom: 6 }}>🔌 고객번호</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                              <div><div style={{ fontSize: 8, color: "#6366F1", marginBottom: 2 }}>전기</div>
                                <input value={r.elecNo} onChange={e => updateRoom(idx, "elecNo", e.target.value)} placeholder="고객번호" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} /></div>
                              <div><div style={{ fontSize: 8, color: "#6366F1", marginBottom: 2 }}>가스</div>
                                <input value={r.gasNo} onChange={e => updateRoom(idx, "gasNo", e.target.value)} placeholder="고객번호" style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }} /></div>
                            </div>
                          </div>
                          <PhotoDropZone photos={r.photos} maxPhotos={30} label="호실 사진"
                            onAdd={(dataUrls) => updateRoom(idx, "photos", [...r.photos, ...dataUrls].slice(0, 30))}
                            onRemove={(pi) => { const updated = [...r.photos]; updated.splice(pi, 1); updateRoom(idx, "photos", updated); }}
                          />
                        </div>

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
                          const updateRoomAcctField = (field: string, value: any) => updateRoom(idx, "roomAcctCustom", { ...r.roomAcctCustom, [field]: value });
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
                          const mgrKeyMap: Record<string, string> = { internal: "internalMgr", external: "externalMgr", collection: "collectionMgr", contract: "contractMgr", general: "generalMgr" };
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
              ) : (
                <div style={{ padding: "30px 20px", textAlign: "center", color: "#B0B5C1", background: "#FAFBFC", borderRadius: 10, border: "1.5px dashed #E0E3E9" }}>
                  <span style={{ fontSize: 28 }}>🚪</span>
                  <div style={{ fontSize: 12, marginTop: 8 }}>위에서 층과 호수 범위를 입력하여 호실을 추가하세요</div>
                </div>
              )}
            </div>}
          </Card>

          {/* Submit Buttons - always visible */}
          {(() => {
            const canSave = !!(regForm.name && regForm.address && regForm.roadAddress && regForm.startDate && regForm.entrancePw);
            const canPreview = canSave && regForm.roomList.length > 0;
            const missingFields = [!regForm.name && "건물명", !regForm.address && "주소", !regForm.roadAddress && "도로명주소", !regForm.startDate && "관리시작일", !regForm.entrancePw && "현관비번"].filter(Boolean);
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
