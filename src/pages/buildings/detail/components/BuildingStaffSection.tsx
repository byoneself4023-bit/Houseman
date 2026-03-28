import React from 'react';
import { Card } from '@/components';
import { inputStyle } from '@/components/Field';
import { staffRoles } from '@/config';

interface BuildingStaffSectionProps {
  isMobile: boolean;
  detailBuildingTypes: string[];
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
  isMobile, detailBuildingTypes,
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
  return (
    <>
      {/* Section 3: Staff & Contract Conditions */}
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
          {/* Staff assignment */}
          <div style={{ padding: "8px 12px", background: "#F0F4FF", borderRadius: 8, marginBottom: 12, border: "1px solid #BFDBFE" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#2563EB", marginBottom: 6 }}>👤 담당자 배정</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 6 }}>
              {staffRoles.map((d: any, i: number) => (
                <div key={i}>
                  <div style={{ fontSize: 9, color: d.color, fontWeight: 700, marginBottom: 2 }}>{d.icon} {d.label}</div>
                  <select value={buildingMgrs[d.id] || ""} onChange={e => setBldgMgr(d.id, e.target.value)} style={{ ...inputStyle, padding: "5px 8px", fontSize: 10, cursor: "pointer" }}>
                    <option value="">선택</option>
                    {staffList.filter((s: any) => s.roles.includes(d.id)).map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
          {/* Fee & contract conditions */}
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
          {/* Settlement dates */}
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
                  <select value={bdSettlementDates[0] === "5" || bdSettlementDates[0] === (5 as any) ? "5" : "1"} onChange={e => setBdSettlementDates([e.target.value])} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, cursor: "pointer", flex: 1 }}>
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
          {/* Management fee type */}
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

      {/* Section 4: Vendors */}
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
        {/* Checkbox selection */}
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

        {/* Vendor input forms */}
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

        {/* Empty state */}
        {!Object.values(vendorEnabled).some(v => v) && (
          <div style={{ padding: "20px", textAlign: "center", color: "#B0B5C1", fontSize: 12 }}>
            위 체크박스를 선택하면 해당 협력업체 입력란이 표시됩니다
          </div>
        )}
        </div>}
      </Card>

      {/* Section 5: Building Notes */}
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

      {/* Section 6: Facility Checklist */}
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
    </>
  );
};
