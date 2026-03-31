import React from 'react';
import { Card } from '@/components';
import { rtCfg } from '@/components/RoomTypeBadge';
import { inputClassName } from '@/components/Field';
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
      <Card className="mb-4">
        <div className={`flex justify-between items-center ${sec1Open ? 'mb-3' : ''}`}>
          <div onClick={() => setSec1Open(!sec1Open)} className="cursor-pointer flex-1">
            <div className="text-[15px] font-extrabold text-hm-text">📋 기본 정보</div>
            <div className="text-[11px] text-hm-text-muted mt-0.5">건물 유형 · 주소 · 시설 · 관리 시작일</div>
          </div>
          <div className="flex items-center gap-2">
            {sec1Open && (sec1Edit ? (
              <>
                <button onClick={() => setSec1Edit(false)} className="px-3.5 py-[5px] rounded-md border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-[11px] cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
                <button onClick={() => setSec1Edit(false)} className="px-3.5 py-[5px] rounded-md border-none bg-hm-blue-dark text-white font-bold text-[11px] cursor-pointer font-[inherit] hover:brightness-90 transition-all">💾 저장</button>
              </>
            ) : (
              <button onClick={() => setSec1Edit(true)} className="px-3.5 py-[5px] rounded-md border-none bg-hm-blue-dark text-white font-bold text-[11px] cursor-pointer font-[inherit] hover:brightness-90 transition-all">✏️ 수정</button>
            ))}
            <span onClick={() => setSec1Open(!sec1Open)} className="text-sm text-hm-text-muted cursor-pointer transition-transform duration-200" style={{ transform: sec1Open ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
          </div>
        </div>
        {sec1Open && <div className={`transition-opacity duration-200 ${sec1Edit ? 'opacity-100' : 'opacity-70 pointer-events-none'}`}>
          <div className="grid grid-cols-4 gap-2 mb-2.5">
            <div className="col-span-full">
              <div className="text-[9px] text-hm-text-muted mb-0.5">건물 유형 (최대 3개)</div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {detailBuildingTypes.map((t, ti) => {
                  const acctKey = t === "기업시설관리" ? "관리사무소" : t;
                  return (
                    <div key={ti} className="flex items-center gap-1">
                      <select value={t} onChange={e => { const updated = [...detailBuildingTypes]; updated[ti] = e.target.value; setDetailBuildingTypes(updated); }}
                        className={`${inputClassName} !px-2 !py-[5px] !text-[11px] !font-bold !cursor-pointer`}
                        style={{ background: acctTypeBg[acctKey] || "#F3F4F6", color: acctTypeColor[acctKey] || "#5F6577", borderColor: (acctTypeColor[acctKey] || "#E0E3E9") + "60" }}>
                        {BUILDING_TYPES.map(bt => (
                          <option key={bt} value={bt} disabled={bt !== t && detailBuildingTypes.includes(bt)}>{bt === "일반임대" ? "일반임대(주택)" : bt}</option>
                        ))}
                      </select>
                      {detailBuildingTypes.length > 1 && (
                        <button onClick={() => setDetailBuildingTypes(detailBuildingTypes.filter((_, i) => i !== ti))}
                          className="w-5 h-5 rounded-[5px] border border-red-300 bg-hm-danger-bg text-hm-danger cursor-pointer text-[11px] flex items-center justify-center p-0 font-[inherit] hover:brightness-90 transition-all">✕</button>
                      )}
                    </div>
                  );
                })}
                {detailBuildingTypes.length < 3 && (
                  <button onClick={() => { const remaining = BUILDING_TYPES.filter(bt => !detailBuildingTypes.includes(bt)); if (remaining.length > 0) setDetailBuildingTypes([...detailBuildingTypes, remaining[0]]); }}
                    className="px-3 py-[5px] rounded-md border-[1.5px] border-dashed border-hm-blue bg-hm-blue-bg text-hm-blue-dark text-[10px] font-bold cursor-pointer font-[inherit] hover:brightness-95 transition-all">
                    + 유형 추가
                  </button>
                )}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-hm-text-muted mb-0.5">관리시작일</div>
              <input value={bdStartDate} onChange={e => setBdStartDate(e.target.value)} className={`${inputClassName} !px-2 !py-1.5 !text-[11px]`} />
            </div>
            <div>
              <div className="text-[9px] text-hm-text-muted mb-0.5">🔑 현관 비밀번호</div>
              <input value={bdEntrancePw} onChange={e => setBdEntrancePw(e.target.value)} placeholder="비밀번호" className={`${inputClassName} !px-2 !py-1.5 !text-[11px] !font-mono !tracking-wider`} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2.5">
            <div>
              <div className="text-[9px] text-hm-text-muted mb-0.5">주소</div>
              <input value={bdAddress} onChange={e => setBdAddress(e.target.value)} className={`${inputClassName} !px-2 !py-1.5 !text-[11px]`} />
            </div>
            <div>
              <div className="text-[9px] text-hm-text-muted mb-0.5">도로명 주소</div>
              <input value={bdRoadAddress} onChange={e => setBdRoadAddress(e.target.value)} placeholder="도로명 주소" className={`${inputClassName} !px-2 !py-1.5 !text-[11px]`} />
            </div>
            <div>
              <div className="text-[9px] text-hm-text-muted mb-0.5">시설</div>
              <div className="flex gap-2 py-1.5 items-center">
                <span className="text-[10px] text-[#3D4251]">CCTV</span>
                <input type="number" min="0" value={bdCctvCount} onChange={e => setBdCctvCount(e.target.value)} placeholder="0" className={`${inputClassName} !w-11 !px-1.5 !py-1 !text-[10px] !text-center`} />
                <span className="text-[9px] text-hm-text-muted">대</span>
                <span className="text-[10px] text-[#3D4251] ml-1.5">건물주차총대수</span>
                <input type="number" min="0" value={bdParkingTotal} onChange={e => setBdParkingTotal(e.target.value)} placeholder="0" className={`${inputClassName} !w-11 !px-1.5 !py-1 !text-[10px] !text-center`} />
                <span className="text-[9px] text-hm-text-muted">대</span>
              </div>
            </div>
          </div>
        </div>}
      </Card>

      {/* Section 2: Owner Info */}
      <Card className="mb-4">
        <div className={`flex justify-between items-center ${sec2Open ? 'mb-3' : ''}`}>
          <div onClick={() => setSec2Open(!sec2Open)} className="cursor-pointer flex-1">
            <div className="text-[15px] font-extrabold text-hm-text">👤 건물주 정보</div>
            <div className="text-[11px] text-hm-text-muted mt-0.5">{`건물주 ${bdOwners.length}명 · 최대 4명`}</div>
          </div>
          <div className="flex items-center gap-2">
            {sec2Open && (sec2Edit ? (
              <>
                <button onClick={() => setSec2Edit(false)} className="px-3.5 py-[5px] rounded-md border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-[11px] cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
                <button onClick={() => setSec2Edit(false)} className="px-3.5 py-[5px] rounded-md border-none bg-hm-blue-dark text-white font-bold text-[11px] cursor-pointer font-[inherit] hover:brightness-90 transition-all">💾 저장</button>
              </>
            ) : (
              <button onClick={() => setSec2Edit(true)} className="px-3.5 py-[5px] rounded-md border-none bg-hm-blue-dark text-white font-bold text-[11px] cursor-pointer font-[inherit] hover:brightness-90 transition-all">✏️ 수정</button>
            ))}
            <span onClick={() => setSec2Open(!sec2Open)} className="text-sm text-hm-text-muted cursor-pointer transition-transform duration-200" style={{ transform: sec2Open ? "rotate(0)" : "rotate(-90deg)" }}>▼</span>
          </div>
        </div>
        {sec2Open && <div className={`transition-opacity duration-200 ${sec2Edit ? 'opacity-100' : 'opacity-70 pointer-events-none'}`}>
          {(() => {
            return bdOwners.map((ow: Record<string, any>, oi: number) => {
              const c = OWNER_COLORS[oi] || OWNER_COLORS[0];
              return (
                <div key={oi} className={`px-3 py-2.5 rounded-lg ${oi < bdOwners.length - 1 ? 'mb-2.5' : ''}`} style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold" style={{ color: c.color }}>건물주 {oi + 1}{c.label ? ` (${c.label})` : ""}</span>
                      {oi === 0 && bdOwners.length < 4 && (
                        <button onClick={addBdOwner}
                          className="px-2.5 py-0.5 rounded-[5px] border-[1.5px] border-dashed bg-transparent text-[10px] font-bold cursor-pointer font-[inherit] hover:brightness-90 transition-all" style={{ borderColor: c.color, color: c.color }}>+ 건물주 추가</button>
                      )}
                    </div>
                    {oi > 0 && (
                      <button onClick={() => removeBdOwner(oi)}
                        className="px-2 py-0.5 rounded-[5px] border border-red-300 bg-hm-danger-bg text-hm-danger text-[10px] font-bold cursor-pointer font-[inherit] hover:brightness-90 transition-all">✕ 삭제</button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                    <div><div className="text-[9px] text-hm-text-muted mb-0.5">이름</div><input value={ow.name} onChange={e => setBdOwnerField(oi, "name", e.target.value)} placeholder="홍길동" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                    <div><div className="text-[9px] text-hm-text-muted mb-0.5">주민등록번호</div><input value={ow.ssn} onChange={e => setBdOwnerField(oi, "ssn", e.target.value)} placeholder="000000-0000000" className={`${inputClassName} !px-2 !py-[5px] !text-[11px] !font-mono`} /></div>
                    <div><div className="text-[9px] text-hm-text-muted mb-0.5">전화번호</div><input value={ow.phone} onChange={e => setBdOwnerField(oi, "phone", e.target.value)} placeholder="010-0000-0000" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                  </div>
                  <div><div className="text-[9px] text-hm-text-muted mb-0.5">주소</div><input value={ow.address} onChange={e => setBdOwnerField(oi, "address", e.target.value)} placeholder="건물주 주소" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                  <div className="mt-1.5"><div className="text-[9px] text-hm-text-muted mb-0.5">정산계좌</div><input value={ow.settlement || ""} onChange={e => setBdOwnerField(oi, "settlement", e.target.value)} placeholder="은행명 + 계좌번호 + 예금주" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                </div>
              );
            });
          })()}
        </div>}
      </Card>
    </>
  );
};
