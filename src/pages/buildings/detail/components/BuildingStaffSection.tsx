import React, { useEffect } from 'react';
import { Card } from '@/components';
import { inputClassName } from '@/components/Field';
import { staffRoles } from '@/config';
import { persistFetchStaff, persistUpsertStaff } from '../buildingDetailApi';

interface BuildingStaffSectionProps {
  isMobile: boolean;
  detailBuildingTypes: string[];
  supabaseId?: string;
  // Section 3: Staff & Contract conditions
  sec3Open: boolean;
  setSec3Open: (v: boolean) => void;
  sec3Edit: boolean;
  setSec3Edit: (v: boolean) => void;
  staffList: Record<string, any>[];
  buildingMgrs: Record<string, string>;
  setBldgMgr: (roleId: string, val: string) => void;
  detailFeeType: string;
  setDetailFeeType: (v: string) => void;
  bdFeeValue: string;
  setBdFeeValue: (v: string) => void;
  bdPenaltyOwner: string;
  setBdPenaltyOwner: (v: string) => void;
  bdSettlementDates: string[];
  addSettlementDate: () => void;
  removeSettlementDate: (idx: number) => void;
  updateSettlementDate: (idx: number, val: string) => void;
  setBdSettlementDates: (v: string[]) => void;
  bdVatType: string;
  setBdVatType: (v: string) => void;
  bdMgmtType: string;
  setBdMgmtType: (v: string) => void;
  bdStandardLease: string;
  setBdStandardLease: (v: string) => void;
  bdVisitCycle: string;
  setBdVisitCycle: (v: string) => void;
  emails: string[];
  setEmails: (v: string[]) => void;
  // Section 4: Vendors
  sec4Open: boolean;
  setSec4Open: (v: boolean) => void;
  sec4Edit: boolean;
  setSec4Edit: (v: boolean) => void;
  vendorEnabled: Record<string, boolean>;
  toggleDetailVendor: (key: string) => void;
  fireMode: string;
  setFireMode: (v: string) => void;
  bdVendors: Record<string, any>;
  setBdVendor: (key: string, field: string, value: string) => void;
  bdApprovalDate: string;
  setBdApprovalDate: (v: string) => void;
  // Section 5: Notes
  sec5Open: boolean;
  setSec5Open: (v: boolean) => void;
  notesEdit: boolean;
  setNotesEdit: (v: boolean) => void;
  bdNotes: string;
  setBdNotes: (v: string) => void;
  // Section 6: Checklist
  sec6Open: boolean;
  setSec6Open: (v: boolean) => void;
  bdFacilityChecklist: string[];
  setBdFacilityChecklist: (v: string[]) => void;
  newChecklistItem: string;
  setNewChecklistItem: (v: string) => void;
}

export const BuildingStaffSection: React.FC<BuildingStaffSectionProps> = ({
  isMobile, detailBuildingTypes, supabaseId,
  sec3Open, setSec3Open, sec3Edit, setSec3Edit,
  staffList, buildingMgrs, setBldgMgr,
  detailFeeType, setDetailFeeType,
  bdFeeValue, setBdFeeValue,
  bdPenaltyOwner, setBdPenaltyOwner,
  bdSettlementDates, addSettlementDate, removeSettlementDate, updateSettlementDate, setBdSettlementDates,
  bdVatType, setBdVatType,
  bdMgmtType, setBdMgmtType,
  bdStandardLease, setBdStandardLease,
  bdVisitCycle, setBdVisitCycle,
  emails, setEmails,
  sec4Open, setSec4Open, sec4Edit, setSec4Edit,
  vendorEnabled, toggleDetailVendor,
  fireMode, setFireMode,
  bdVendors, setBdVendor,
  bdApprovalDate, setBdApprovalDate,
  sec5Open, setSec5Open, notesEdit, setNotesEdit, bdNotes, setBdNotes,
  sec6Open, setSec6Open,
  bdFacilityChecklist, setBdFacilityChecklist,
  newChecklistItem, setNewChecklistItem,
}) => {
  // Supabase: 담당자 초기 로드
  useEffect(() => {
    if (!supabaseId) return;
    persistFetchStaff(supabaseId).then(map => {
      Object.entries(map).forEach(([role, name]) => {
        if (name) setBldgMgr(role, name);
      });
    });
  }, [supabaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Section 3: Staff & Contract Conditions */}
      <Card className="mb-4">
        <div className={`flex justify-between items-center ${sec3Open ? 'mb-3' : ''}`}>
          <div onClick={() => setSec3Open(!sec3Open)} className="cursor-pointer flex-1">
            <div className="text-[15px] font-extrabold text-hm-text">🏢 담당자 & 계약 조건</div>
            <div className="text-[11px] text-hm-text-muted mt-0.5">역할별 담당자 · 수수료 · 정산계좌 · 이메일</div>
          </div>
          <div className="flex items-center gap-2">
            {sec3Open && (sec3Edit ? (
              <>
                <button onClick={() => setSec3Edit(false)} className="px-3.5 py-[5px] rounded-md border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-[11px] cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
                <button onClick={() => setSec3Edit(false)} className="px-3.5 py-[5px] rounded-md border-none bg-hm-blue-dark text-white font-bold text-[11px] cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">💾 저장</button>
              </>
            ) : (
              <button onClick={() => setSec3Edit(true)} className="px-3.5 py-[5px] rounded-md border-none bg-hm-blue-dark text-white font-bold text-[11px] cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">✏️ 수정</button>
            ))}
            <span onClick={() => setSec3Open(!sec3Open)} className={`text-sm text-hm-text-muted cursor-pointer transition-transform duration-200 inline-block ${sec3Open ? 'rotate-0' : '-rotate-90'}`}>▼</span>
          </div>
        </div>
        {sec3Open && <div className={`transition-opacity duration-200 ${sec3Edit ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-70'}`}>
          {/* Staff assignment */}
          <div className="px-3 py-2 bg-[#F0F4FF] rounded-lg mb-3 border border-[#BFDBFE]">
            <div className="text-[10px] font-extrabold text-hm-blue-dark mb-1.5">👤 담당자 배정</div>
            <div className={`grid gap-1.5 ${isMobile ? 'grid-cols-2' : 'grid-cols-5'}`}>
              {staffRoles.map((d: any, i: number) => (
                <div key={i}>
                  <div className="text-[9px] font-bold mb-0.5" style={{ color: d.color }}>{d.icon} {d.label}</div>
                  <select value={buildingMgrs[d.id] || ""} onChange={e => {
                    const name = e.target.value;
                    setBldgMgr(d.id, name);
                    const staff = staffList.find((s: any) => s.name === name);
                    persistUpsertStaff(supabaseId, d.id, name, staff?.phone || '');
                  }} className={`${inputClassName} !px-2 !py-[5px] !text-[10px] cursor-pointer`}>
                    <option value="">선택</option>
                    {staffList.filter((s: any) => s.roles.includes(d.id)).map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
          {/* Fee & contract conditions */}
          <div className={`grid gap-2 mb-2.5 ${detailBuildingTypes.includes("단기") ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <div>
              <div className="text-[9px] text-hm-text-muted mb-0.5">수수료 유형</div>
              <select value={detailFeeType} onChange={e => setDetailFeeType(e.target.value)} className={`${inputClassName} !px-2 !py-1.5 !text-[11px] cursor-pointer`}>
                <option value="pct">수수료율 (%)</option>
                <option value="fixed">정액제 (원)</option>
              </select>
            </div>
            <div>
              <div className="text-[9px] text-hm-text-muted mb-0.5">{detailFeeType === "pct" ? "수수료율" : "정액 금액"}</div>
              <input value={bdFeeValue} onChange={e => setBdFeeValue(e.target.value)} placeholder={detailFeeType === "pct" ? "5%" : "1,500,000"} className={`${inputClassName} !px-2 !py-1.5 !text-[11px] text-right`} />
            </div>
            {detailBuildingTypes.includes("단기") && <div>
              <div className="text-[9px] text-hm-text-muted mb-0.5">7일패널티 소유</div>
              <select value={bdPenaltyOwner} onChange={e => setBdPenaltyOwner(e.target.value)} className={`${inputClassName} !px-2 !py-1.5 !text-[11px] cursor-pointer`}>
                {["건물주", "하우스맨", "해당없음"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>}
            <div>
              <div className="text-[9px] text-hm-text-muted mb-0.5">부가가치세</div>
              <select value={bdVatType} onChange={e => setBdVatType(e.target.value)} className={`${inputClassName} !px-2 !py-1.5 !text-[11px] cursor-pointer`}>
                {["포함", "별도", "없음"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          {/* Settlement dates */}
          <div className="mb-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-hm-text-muted">정산일 ({bdSettlementDates.length}회/월)</span>
              {bdSettlementDates.length < 3 && (
                <button onClick={addSettlementDate} className="text-[9px] text-hm-blue bg-transparent border-none cursor-pointer font-[inherit] font-bold hover:underline">+ 추가</button>
              )}
            </div>
            {detailBuildingTypes.includes("근생") && !detailBuildingTypes.includes("단기") && !detailBuildingTypes.includes("일반임대") ? (
              <div>
                <div className="flex gap-1.5 items-center mb-1">
                  <div className={`${inputClassName} !px-2 !py-1.5 !text-[11px] !bg-gray-100 !text-gray-500 flex-1`}>정산기간: 1일 ~ 말일 (고정)</div>
                </div>
                <div className="flex gap-1.5 items-center">
                  <span className="text-[10px] text-hm-text-muted min-w-[50px]">정산일</span>
                  <select value={bdSettlementDates[0] === "5" || bdSettlementDates[0] === (5 as any) ? "5" : "1"} onChange={e => setBdSettlementDates([e.target.value])} className={`${inputClassName} !px-2 !py-1.5 !text-[11px] cursor-pointer flex-1`}>
                    <option value="1">매월 1일</option>
                    <option value="5">매월 5일</option>
                  </select>
                  <span className="text-[9px] text-amber-500 font-semibold whitespace-nowrap">* 토/일/공휴일 → 다음 영업일</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {bdSettlementDates.map((d, i) => (
                  <div key={i} className="flex gap-1.5 items-center">
                    <span className="text-[10px] text-hm-text-muted min-w-[30px] font-semibold">{i + 1}차</span>
                    <select value={d} onChange={e => updateSettlementDate(i, e.target.value)} className={`${inputClassName} !px-2 !py-1.5 !text-[11px] cursor-pointer flex-1`}>
                      {[...Array(28).keys()].map(n => <option key={n + 1} value={String(n + 1)}>{n + 1}일</option>)}
                      <option value="말일">말일</option>
                    </select>
                    {bdSettlementDates.length > 1 && (
                      <button onClick={() => removeSettlementDate(i)} className="px-2 py-0.5 bg-transparent border border-hm-danger-border rounded text-hm-danger cursor-pointer text-[11px] font-[inherit] hover:bg-hm-danger-bg transition-colors">✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Management fee type */}
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <div>
              <div className="text-[9px] text-hm-text-muted mb-0.5">관리비 유형</div>
              {detailBuildingTypes.includes("단기") && !detailBuildingTypes.includes("일반임대") && !detailBuildingTypes.includes("근생") ? (
                <div className={`${inputClassName} !px-2 !py-1.5 !text-[11px] !bg-gray-100 !text-gray-500`}>변동관리비 (단기 고정)</div>
              ) : (
                <select value={bdMgmtType} onChange={e => setBdMgmtType(e.target.value)} className={`${inputClassName} !px-2 !py-1.5 !text-[11px] cursor-pointer`}>
                  <option value="고정관리비">고정관리비</option>
                  <option value="변동관리비">변동관리비</option>
                </select>
              )}
            </div>
            <div className="flex items-center pt-3.5">
              <span className={`text-[10px] font-semibold ${(detailBuildingTypes.includes("단기") && !detailBuildingTypes.includes("일반임대") && !detailBuildingTypes.includes("근생")) ? 'text-gray-500' : bdMgmtType === "고정관리비" ? 'text-gray-500' : 'text-hm-blue-dark'}`}>
                {(detailBuildingTypes.includes("단기") && !detailBuildingTypes.includes("일반임대") && !detailBuildingTypes.includes("근생")) ? "💡 단기는 변동관리비 고정" : bdMgmtType === "고정관리비" ? "💡 매월 동일한 관리비 청구" : "💡 공과금 기반 변동 청구"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2.5">
            {(detailBuildingTypes.includes("단기") || detailBuildingTypes.includes("일반임대")) && <div>
              <div className="text-[9px] text-hm-text-muted mb-0.5">표준임대차</div>
              <select value={bdStandardLease} onChange={e => setBdStandardLease(e.target.value)} className={`${inputClassName} !px-2 !py-1.5 !text-[11px] cursor-pointer`}>
                {["사용", "미사용"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>}
            <div>
              <div className="text-[9px] text-hm-text-muted mb-0.5">순회주기</div>
              <select value={bdVisitCycle} onChange={e => setBdVisitCycle(e.target.value)} className={`${inputClassName} !px-2 !py-1.5 !text-[11px] cursor-pointer`}>
                {["월4회", "월3회", "월2회", "월1회"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] text-hm-text-muted">E-MAIL</span>
                <button onClick={() => setEmails([...emails, ""])} className="text-[9px] text-hm-blue bg-transparent border-none cursor-pointer font-[inherit] font-bold hover:underline">+ 추가</button>
              </div>
              {emails.map((e, i) => (
                <div key={i} className={`flex gap-1 ${i < emails.length - 1 ? 'mb-[3px]' : ''}`}>
                  <input value={e} onChange={ev => { const u = [...emails]; u[i] = ev.target.value; setEmails(u); }} placeholder="example@email.com" className={`${inputClassName} !px-2 !py-[5px] !text-[11px] flex-1`} />
                  {emails.length > 1 && <button onClick={() => setEmails(emails.filter((_, j) => j !== i))} className="px-1.5 bg-transparent border-none text-hm-danger cursor-pointer text-[13px] hover:opacity-70 transition-opacity">✕</button>}
                </div>
              ))}
            </div>
          </div>
        </div>}
      </Card>

      {/* Section 4: Vendors */}
      <Card className="mb-4">
        <div className={`flex justify-between items-center ${sec4Open ? 'mb-3' : ''}`}>
          <div onClick={() => setSec4Open(!sec4Open)} className="cursor-pointer flex-1">
            <div className="text-[15px] font-extrabold text-hm-text">🔧 협력업체</div>
            <div className="text-[11px] text-hm-text-muted mt-0.5">소방 · 승강기 · 청소 · 소독 등 외주업체</div>
          </div>
          <div className="flex items-center gap-2">
            {sec4Open && (sec4Edit ? (
              <>
                <button onClick={() => setSec4Edit(false)} className="px-3.5 py-[5px] rounded-md border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-[11px] cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
                <button onClick={() => setSec4Edit(false)} className="px-3.5 py-[5px] rounded-md border-none bg-hm-blue-dark text-white font-bold text-[11px] cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">💾 저장</button>
              </>
            ) : (
              <button onClick={() => setSec4Edit(true)} className="px-3.5 py-[5px] rounded-md border-none bg-hm-blue-dark text-white font-bold text-[11px] cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">✏️ 수정</button>
            ))}
            <span onClick={() => setSec4Open(!sec4Open)} className={`text-sm text-hm-text-muted cursor-pointer transition-transform duration-200 inline-block ${sec4Open ? 'rotate-0' : '-rotate-90'}`}>▼</span>
          </div>
        </div>
        {sec4Open && <div className={`transition-opacity duration-200 ${sec4Edit ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-70'}`}>
        {/* Checkbox selection */}
        <div className="flex flex-wrap gap-1.5 mb-3 px-3.5 py-2.5 bg-hm-bg-slate rounded-lg border border-hm-border">
          {[
            { key: "cleaning", label: "청소", icon: "🧹", color: "#10B981" },
            { key: "elevator", label: "승강기", icon: "🛗", color: "var(--color-hm-blue)" },
            { key: "fire", label: "소방", icon: "🔥", color: "var(--color-hm-danger)" },
            { key: "mechElevator", label: "기계식승강기", icon: "⚙️", color: "#6366F1" },
            { key: "disinfect", label: "소독", icon: "🧴", color: "#8B5CF6" },
            { key: "custom1", label: "기타1", icon: "📋", color: "#64748B" },
            { key: "custom2", label: "기타2", icon: "📋", color: "#64748B" },
          ].map(v => (
            <label key={v.key} onClick={() => sec4Edit && toggleDetailVendor(v.key)}
              className={`flex items-center gap-[5px] px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-150 ${sec4Edit ? 'cursor-pointer' : 'cursor-default'} ${!sec4Edit ? 'opacity-70' : ''}`}
              style={{
                background: vendorEnabled[v.key] ? (v.color + "15") : "#fff",
                border: `1.5px solid ${vendorEnabled[v.key] ? v.color : "var(--color-hm-input-border)"}`,
                color: vendorEnabled[v.key] ? v.color : "var(--color-hm-text-muted)",
              }}>
              <input type="checkbox" checked={vendorEnabled[v.key]} readOnly
                className={`${sec4Edit ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ accentColor: v.color }} />
              <span>{v.icon}</span> {v.label}
            </label>
          ))}
        </div>

        {/* Vendor input forms */}
        <div className="flex flex-col gap-1.5">
          {[
            { key: "cleaning", label: "청소", icon: "🧹", color: "#10B981", type: "simple" },
            { key: "elevator", label: "승강기", icon: "🛗", color: "var(--color-hm-blue)", person: "승강기안전관리자", type: "withManager" },
            { key: "fire", label: "소방", icon: "🔥", color: "var(--color-hm-danger)", person: "소방안전관리자", type: "withManager" },
            { key: "mechElevator", label: "기계식승강기", icon: "⚙️", color: "#6366F1", person: "기계식승강기안전관리자", type: "withManager" },
            { key: "disinfect", label: "소독", icon: "🧴", color: "#8B5CF6", type: "simple" },
            { key: "custom1", label: "custom1", icon: "📋", color: "#64748B", type: "simple" },
            { key: "custom2", label: "custom2", icon: "📋", color: "#64748B", type: "simple" },
          ].filter(v => vendorEnabled[v.key]).map((v, i) => v.key === "fire" ? (
            <div key={v.key} className={`px-3 py-2.5 rounded-lg border border-hm-border ${i % 2 === 0 ? 'bg-hm-bg-hover' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: v.color }}>
                  <span>{v.icon}</span> {v.label}
                </div>
                <div className="flex gap-1">
                  {[{ id: "direct", label: "직접관리" }, { id: "vendor", label: "협력업체관리" }].map(m => (
                    <button key={m.id} onClick={() => setFireMode(m.id)}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer font-[inherit] transition-colors ${fireMode === m.id ? 'border-[1.5px] border-hm-danger bg-hm-danger-bg text-hm-danger' : 'border border-hm-input-border bg-white text-hm-text-muted'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 items-center mb-1.5">
                <span className="text-[10px] text-hm-danger font-semibold">사용승인일</span>
                <div><input type="date" value={bdApprovalDate} onChange={e => setBdApprovalDate(e.target.value)} className={`${inputClassName} !px-2 !py-[5px] !text-[11px] max-w-[180px]`} /></div>
              </div>
              {fireMode === "vendor" && (
                <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_auto] gap-2 items-center mb-1.5">
                  <span className="text-[10px] text-hm-text-muted font-semibold">협력업체</span>
                  <div><input value={bdVendors.fire.company} onChange={e => setBdVendor("fire", "company", e.target.value)} placeholder="업체명" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                  <div><input value={bdVendors.fire.phone} onChange={e => setBdVendor("fire", "phone", e.target.value)} placeholder="업체 연락처" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                  <div><input value={bdVendors.fire.contact} onChange={e => setBdVendor("fire", "contact", e.target.value)} placeholder="업체 담당자" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                  <div><input value={bdVendors.fire.contactPhone} onChange={e => setBdVendor("fire", "contactPhone", e.target.value)} placeholder="담당자 휴대폰" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                  <button className="px-2.5 py-1 rounded-md border border-hm-input-border bg-white text-[10px] cursor-pointer font-[inherit] text-hm-blue font-bold whitespace-nowrap hover:bg-hm-blue-bg transition-colors">📎 계약서</button>
                </div>
              )}
              <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-2 items-center pt-1.5" style={{ borderTop: `1px dashed ${v.color}40` }}>
                <span className="text-[10px] font-bold" style={{ color: v.color }}>👤 소방안전관리자</span>
                <div><input value={bdVendors.fire.manager} onChange={e => setBdVendor("fire", "manager", e.target.value)} placeholder="성명" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                <div><input value={bdVendors.fire.managerPhone} onChange={e => setBdVendor("fire", "managerPhone", e.target.value)} placeholder="연락처" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                <div><input value={bdVendors.fire.managerNote} onChange={e => setBdVendor("fire", "managerNote", e.target.value)} placeholder="자격/비고" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
              </div>
            </div>
          ) : v.type === "withManager" ? (
            <div key={v.key} className={`px-3 py-2.5 rounded-lg border border-hm-border ${i % 2 === 0 ? 'bg-hm-bg-hover' : 'bg-white'}`}>
              <div className="text-xs font-bold flex items-center gap-1.5 mb-2" style={{ color: v.color }}>
                <span>{v.icon}</span> {v.label}
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_auto] gap-2 items-center mb-1.5">
                <span className="text-[10px] text-hm-text-muted font-semibold">협력업체</span>
                <div><input value={bdVendors[v.key]?.company || ""} onChange={e => setBdVendor(v.key, "company", e.target.value)} placeholder="업체명" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                <div><input value={bdVendors[v.key]?.phone || ""} onChange={e => setBdVendor(v.key, "phone", e.target.value)} placeholder="업체 연락처" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                <div><input value={bdVendors[v.key]?.contact || ""} onChange={e => setBdVendor(v.key, "contact", e.target.value)} placeholder="업체 담당자" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                <div><input value={bdVendors[v.key]?.contactPhone || ""} onChange={e => setBdVendor(v.key, "contactPhone", e.target.value)} placeholder="담당자 휴대폰" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                <button className="px-2.5 py-1 rounded-md border border-hm-input-border bg-white text-[10px] cursor-pointer font-[inherit] text-hm-blue font-bold whitespace-nowrap hover:bg-hm-blue-bg transition-colors">📎 계약서</button>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-2 items-center pt-1.5" style={{ borderTop: `1px dashed ${v.color}40` }}>
                <span className="text-[10px] font-bold" style={{ color: v.color }}>👤 {v.person}</span>
                <div><input value={bdVendors[v.key]?.manager || ""} onChange={e => setBdVendor(v.key, "manager", e.target.value)} placeholder="성명" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                <div><input value={bdVendors[v.key]?.managerPhone || ""} onChange={e => setBdVendor(v.key, "managerPhone", e.target.value)} placeholder="연락처" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                <div><input value={bdVendors[v.key]?.managerNote || ""} onChange={e => setBdVendor(v.key, "managerNote", e.target.value)} placeholder="자격/비고" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
              </div>
            </div>
          ) : (
            <div key={v.key} className={`px-3 py-2 rounded-lg border border-hm-border ${i % 2 === 0 ? 'bg-hm-bg-hover' : 'bg-white'}`}>
              <div className="grid grid-cols-[160px_1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                {v.label.startsWith("custom") ? (
                  <div className="flex items-center gap-1.5">
                    <span>{v.icon}</span>
                    <input value={bdVendors[v.key]?.label || ""} onChange={e => setBdVendor(v.key, "label", e.target.value)} placeholder={`기타${v.label.slice(-1)} (입력)`} className={`${inputClassName} !px-2 !py-[5px] !text-[11px] !font-bold`} />
                  </div>
                ) : (
                  <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: v.color }}>
                    <span>{v.icon}</span> {v.label}
                  </div>
                )}
                <div><input value={bdVendors[v.key]?.company || ""} onChange={e => setBdVendor(v.key, "company", e.target.value)} placeholder="회사명" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                <div><input value={bdVendors[v.key]?.phone || ""} onChange={e => setBdVendor(v.key, "phone", e.target.value)} placeholder="연락처" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                <div><input value={bdVendors[v.key]?.contact || ""} onChange={e => setBdVendor(v.key, "contact", e.target.value)} placeholder="담당자명" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                <div><input value={bdVendors[v.key]?.contactPhone || ""} onChange={e => setBdVendor(v.key, "contactPhone", e.target.value)} placeholder="담당자 휴대폰" className={`${inputClassName} !px-2 !py-[5px] !text-[11px]`} /></div>
                <button className="px-2.5 py-1 rounded-md border border-hm-input-border bg-white text-[10px] cursor-pointer font-[inherit] text-hm-blue font-bold whitespace-nowrap hover:bg-hm-blue-bg transition-colors">📎 계약서</button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!Object.values(vendorEnabled).some(v => v) && (
          <div className="py-5 text-center text-[#B0B5C1] text-xs">
            위 체크박스를 선택하면 해당 협력업체 입력란이 표시됩니다
          </div>
        )}
        </div>}
      </Card>

      {/* Section 5: Building Notes */}
      <Card className="mb-4">
        <div className={`flex justify-between items-center ${sec5Open ? 'mb-3' : ''}`}>
          <div onClick={() => setSec5Open(!sec5Open)} className="cursor-pointer flex-1">
            <div className="text-[15px] font-extrabold text-hm-text">📝 건물 특이사항</div>
            <div className="text-[11px] text-hm-text-muted mt-0.5">관리 참고사항 · 이력 기록</div>
          </div>
          <div className="flex items-center gap-2">
            {sec5Open && (notesEdit ? (
              <>
                <button onClick={() => setNotesEdit(false)} className="px-3.5 py-[5px] rounded-md border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-[11px] cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
                <button onClick={() => setNotesEdit(false)} className="px-3.5 py-[5px] rounded-md border-none bg-hm-blue-dark text-white font-bold text-[11px] cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">💾 저장</button>
              </>
            ) : (
              <button onClick={() => setNotesEdit(true)} className="px-3.5 py-[5px] rounded-md border-none bg-hm-blue-dark text-white font-bold text-[11px] cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">✏️ 수정</button>
            ))}
            <span onClick={() => setSec5Open(!sec5Open)} className={`text-sm text-hm-text-muted cursor-pointer transition-transform duration-200 inline-block ${sec5Open ? 'rotate-0' : '-rotate-90'}`}>▼</span>
          </div>
        </div>
        {sec5Open &&
        <textarea value={bdNotes} onChange={e => setBdNotes(e.target.value)} readOnly={!notesEdit} placeholder={"건물 특이사항을 순차적으로 기록하세요.\n\n예시:\n- 2024.03 관리 시작. 1층 상가 분리 계량기 없어 공용전기에서 차감\n- 2024.05 옥상 방수공사 완료 (건물주 부담)\n- 2024.08 3층 배관 노후로 전체 교체\n- 세무사: 홍길동 세무사 (010-1234-5678)\n- 2025.01 소방점검 지적사항: 2층 비상구 표지등 불량\n..."} rows={12}
          className={`${inputClassName} resize-y leading-[1.8] !text-xs !px-3.5 !py-3 min-h-[200px] ${notesEdit ? 'bg-white opacity-100' : 'bg-hm-bg-slate opacity-75'}`} />
        }
      </Card>

      {/* Section 6: Facility Checklist */}
      <Card className="mb-4">
        <div className={`flex justify-between items-center ${sec6Open ? 'mb-3' : ''}`}>
          <div onClick={() => setSec6Open(!sec6Open)} className="cursor-pointer flex-1">
            <div className="text-[15px] font-extrabold text-hm-text">✅ 시설 체크리스트</div>
            <div className="text-[11px] text-hm-text-muted mt-0.5">순회 시 점검할 시설 항목 관리 · {bdFacilityChecklist.length}개 항목</div>
          </div>
          <div className="flex items-center gap-2">
            <span onClick={() => setSec6Open(!sec6Open)} className={`text-sm text-hm-text-muted cursor-pointer transition-transform duration-200 inline-block ${sec6Open ? 'rotate-0' : '-rotate-90'}`}>▼</span>
          </div>
        </div>
        {sec6Open && <div>
          <div className="flex flex-col gap-1.5 mb-3">
            {bdFacilityChecklist.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-hm-bg-slate rounded-lg border border-hm-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-hm-blue min-w-[20px]">{i + 1}</span>
                  <span className="text-[13px] font-semibold text-hm-text">{item}</span>
                </div>
                <button onClick={() => setBdFacilityChecklist(bdFacilityChecklist.filter((_, idx) => idx !== i))}
                  className="w-6 h-6 rounded-md border border-hm-danger-border bg-hm-danger-bg text-hm-danger cursor-pointer text-xs flex items-center justify-center p-0 font-[inherit] hover:bg-red-100 transition-colors">✕</button>
              </div>
            ))}
            {bdFacilityChecklist.length === 0 && (
              <div className="py-4 text-center text-[#B0B5C1] text-xs">체크리스트 항목이 없습니다</div>
            )}
          </div>
          <div className="flex gap-2">
            <input value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newChecklistItem.trim()) { setBdFacilityChecklist([...bdFacilityChecklist, newChecklistItem.trim()]); setNewChecklistItem(""); } }}
              placeholder="새 점검 항목 입력..." className={`${inputClassName} flex-1 !px-3 !py-2 !text-xs`} />
            <button onClick={() => { if (newChecklistItem.trim()) { setBdFacilityChecklist([...bdFacilityChecklist, newChecklistItem.trim()]); setNewChecklistItem(""); } }}
              className="px-4 py-2 rounded-lg border-none bg-hm-blue-dark text-white font-bold text-xs cursor-pointer font-[inherit] whitespace-nowrap hover:opacity-90 transition-opacity">+ 추가</button>
          </div>
        </div>}
      </Card>
    </>
  );
};
