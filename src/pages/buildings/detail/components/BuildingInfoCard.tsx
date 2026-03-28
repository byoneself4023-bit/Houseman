import React from 'react';
import { Card } from '@/components';
import { rtCfg } from '@/components/RoomTypeBadge';
import { inputStyle } from '@/components/Field';
import { acctTypeBg, acctTypeColor } from '@/config/accountConfig';

const BUILDING_TYPES = ["단기", "일반임대", "근생", "관리사무소", "기업시설관리"];

const OWNER_COLORS = [
  { bg: "#F0F4FF", border: "#BFDBFE", color: "#2563EB", label: "주" },
  { bg: "#F5F3FF", border: "#DDD6FE", color: "#7C3AED", label: "부" },
  { bg: "#FFF7ED", border: "#FED7AA", color: "#EA580C", label: "" },
  { bg: "#F0FDF4", border: "#BBF7D0", color: "#059669", label: "" },
];

interface BuildingInfoCardProps {
  sec1Open: boolean;
  setSec1Open: (v: boolean) => void;
  sec1Edit: boolean;
  setSec1Edit: (v: boolean) => void;
  detailBuildingTypes: string[];
  setDetailBuildingTypes: (v: string[]) => void;
  bdStartDate: string;
  setBdStartDate: (v: string) => void;
  bdEntrancePw: string;
  setBdEntrancePw: (v: string) => void;
  bdAddress: string;
  setBdAddress: (v: string) => void;
  bdRoadAddress: string;
  setBdRoadAddress: (v: string) => void;
  bdCctvCount: string;
  setBdCctvCount: (v: string) => void;
  bdParkingTotal: string;
  setBdParkingTotal: (v: string) => void;
  // Section 2: Owner info
  sec2Open: boolean;
  setSec2Open: (v: boolean) => void;
  sec2Edit: boolean;
  setSec2Edit: (v: boolean) => void;
  bdOwners: Record<string, any>[];
  addBdOwner: () => void;
  removeBdOwner: (idx: number) => void;
  setBdOwnerField: (idx: number, field: string, value: string) => void;
}

export const BuildingInfoCard: React.FC<BuildingInfoCardProps> = ({
  sec1Open, setSec1Open, sec1Edit, setSec1Edit,
  detailBuildingTypes, setDetailBuildingTypes,
  bdStartDate, setBdStartDate,
  bdEntrancePw, setBdEntrancePw,
  bdAddress, setBdAddress,
  bdRoadAddress, setBdRoadAddress,
  bdCctvCount, setBdCctvCount,
  bdParkingTotal, setBdParkingTotal,
  sec2Open, setSec2Open, sec2Edit, setSec2Edit,
  bdOwners, addBdOwner, removeBdOwner, setBdOwnerField,
}) => {
  return (
    <>
      {/* Section 1: Basic Info */}
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

      {/* Section 2: Owner Info */}
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
            return bdOwners.map((ow: Record<string, any>, oi: number) => {
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
    </>
  );
};
