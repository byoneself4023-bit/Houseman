import { useState } from 'react';
import { asItems as staticAsItems } from '../data';
import { buildings } from '../data/buildings';
import { useIsMobile, fmt } from '../utils';
import { Card, SectionTitle, Table, StatusBadge, PhotoDropZone } from '../components';
import { inputStyle } from '../components/Field';
import { initialStaffMembers } from '../config';
import { useLocalStorage } from '../utils/useLocalStorage';


export const ASPage = ({ myBuildings = [] }) => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("전체");
  const [selectedAS, setSelectedAS] = useState(null);
  const [filterAssigneeAS, setFilterAssigneeAS] = useState("전체");
  const [asBeforePhotos, setAsBeforePhotos] = useLocalStorage("hm_asBeforePhotos", []);
  const [asAfterPhotos, setAsAfterPhotos] = useLocalStorage("hm_asAfterPhotos", []);
  const [localAsItems, setLocalAsItems] = useLocalStorage("hm_asItems", []);
  const [vendors, setVendors] = useLocalStorage("hm_vendors", []);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showVendorMgmt, setShowVendorMgmt] = useState(false);

  // New AS form state
  const [newBuilding, setNewBuilding] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPhotos, setNewPhotos] = useState([]);
  const [newPriority, setNewPriority] = useState("일반");
  const [newSource, setNewSource] = useState("사무실접수");
  const [newAssignee, setNewAssignee] = useState("");

  // Vendor form state
  const [vendorForm, setVendorForm] = useState({ name: "", phone: "", specialty: "", note: "" });
  const [editingVendorIdx, setEditingVendorIdx] = useState(null);

  // Status update modal state
  const [showStatusModal, setShowStatusModal] = useState(null); // "진행중" | "완료" | null
  const [completePaid, setCompletePaid] = useState("무상");
  const [completeCost, setCompleteCost] = useState("");
  const [completeVendor, setCompleteVendor] = useState("");

  // Owner approval state
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalCost, setApprovalCost] = useState("");
  const [approvalVendor, setApprovalVendor] = useState("");

  const statuses = ["전체", "대기", "진행중", "완료"];
  const [staffList] = useLocalStorage("hm_staffList", initialStaffMembers);
  const externalStaffAS = staffList.filter(s => s.roles.includes("external")).map(s => s.name);
  const allStaff = staffList.map(s => s.name);

  // Merge static + localStorage AS items
  const allAsItems = [...staticAsItems, ...localAsItems];
  const myAS = myBuildings.length > 0 ? allAsItems.filter(a => myBuildings.includes(a.building)) : allAsItems;

  const assigneesAS = ["전체", ...externalStaffAS];
  const filteredByAssigneeAS = filterAssigneeAS === "전체" ? myAS : myAS.filter(a => a.assignee === filterAssigneeAS);
  const filtered = tab === "전체" ? filteredByAssigneeAS : filteredByAssigneeAS.filter(a => a.status === tab);

  const totalCost = myAS.reduce((s, a) => s + (a.cost || 0), 0);
  const paidCount = myAS.filter(a => a.paid === "유상").length;
  const paidCost = myAS.filter(a => a.paid === "유상").reduce((s, a) => s + (a.cost || 0), 0);

  const actionColors = {
    "접수": { bg: "#EFF6FF", color: "#2563EB", icon: "📋" },
    "현장확인": { bg: "#FFF7ED", color: "#EA580C", icon: "🔍" },
    "현장출동": { bg: "#FFF7ED", color: "#EA580C", icon: "🚗" },
    "부품발주": { bg: "#F5F3FF", color: "#7C3AED", icon: "📦" },
    "견적전달": { bg: "#FFFBEB", color: "#D97706", icon: "💰" },
    "수리완료": { bg: "#ECFDF5", color: "#059669", icon: "✅" },
    "완료확인": { bg: "#ECFDF5", color: "#059669", icon: "👍" },
    "진행시작": { bg: "#FFF7ED", color: "#EA580C", icon: "▶️" },
    "건물주승인요청": { bg: "#FFFBEB", color: "#D97706", icon: "📩" },
    "건물주승인": { bg: "#ECFDF5", color: "#059669", icon: "✅" },
    "건물주반려": { bg: "#FEF2F2", color: "#DC2626", icon: "❌" },
  };

  const today = new Date().toISOString().slice(0, 10);

  const buildingNames = buildings.map(b => b.name);

  // Helper to update a local AS item
  const updateLocalItem = (id, updater) => {
    setLocalAsItems(prev => prev.map(item => item.id === id ? updater(item) : item));
  };

  // Check if item is from localStorage (editable)
  const isLocalItem = (item) => localAsItems.some(li => li.id === item.id);

  // Handle new AS submission
  const handleSubmitAS = () => {
    if (!newBuilding || !newDesc.trim()) return;
    const titleLine = newDesc.trim().split("\n")[0].slice(0, 30);
    const newItem = {
      id: Date.now(),
      building: newBuilding,
      room: newRoom,
      date: today,
      title: titleLine,
      content: titleLine,
      detail: newDesc.trim(),
      desc: newDesc.trim(),
      status: "대기",
      priority: newPriority === "긴급" ? "높음" : "보통",
      assignee: newAssignee || "미지정",
      paid: "무상",
      cost: 0,
      vendor: "",
      source: newSource,
      category: "기타",
      photos: [...newPhotos],
      photoBefore: newPhotos.length > 0 ? "📷 접수사진" : "",
      photoAfter: "",
      steps: [{ date: today, action: "접수", note: `${newSource} · ${titleLine}` }],
      actions: [{ step: "접수", date: today, by: newSource === "사무실접수" ? "사무실" : newSource === "임차인접수" ? "임차인" : "순회" }],
      ownerApproval: null,
    };
    setLocalAsItems(prev => [...prev, newItem]);
    // Reset form
    setNewBuilding("");
    setNewRoom("");
    setNewDesc("");
    setNewPhotos([]);
    setNewPriority("일반");
    setNewSource("사무실접수");
    setNewAssignee("");
    setShowNewForm(false);
  };

  // Handle vendor save
  const handleSaveVendor = () => {
    if (!vendorForm.name.trim()) return;
    if (editingVendorIdx !== null) {
      setVendors(prev => prev.map((v, i) => i === editingVendorIdx ? { ...vendorForm } : v));
      setEditingVendorIdx(null);
    } else {
      setVendors(prev => [...prev, { ...vendorForm }]);
    }
    setVendorForm({ name: "", phone: "", specialty: "", note: "" });
  };

  // Approval status badge
  const ApprovalBadge = ({ status }) => {
    if (!status) return null;
    const cfg = {
      pending: { label: "승인대기", bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
      approved: { label: "승인완료", bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
      rejected: { label: "반려", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    };
    const c = cfg[status];
    if (!c) return null;
    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
        {c.label}
      </span>
    );
  };

  // ─── DETAIL VIEW ────────────────────────────────────────
  if (selectedAS) {
    const as = selectedAS;
    const canEdit = isLocalItem(as);
    const steps = as.steps || [];

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => { setSelectedAS(null); setShowStatusModal(null); setShowApprovalForm(false); }} style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", flexShrink: 0 }}>‹</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23" }}>AS #{as.id}</h1>
              <StatusBadge status={as.status} />
              <ApprovalBadge status={as.ownerApproval} />
            </div>
            <p style={{ fontSize: 12, color: "#8F95A3", marginTop: 3 }}>{as.building} {as.room}호 · {as.date}</p>
          </div>
        </div>

        {/* Status + Cost Quick Bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4 }}>
          {[
            ...(as.priority === "높음" ? [{ label: "긴급도", value: "높음", bg: "#FEF2F2", color: "#DC2626" }] : []),
            { label: "유/무상", value: as.paid, bg: as.paid === "유상" ? "#FEF2F2" : "#ECFDF5", color: as.paid === "유상" ? "#DC2626" : "#059669" },
            { label: "비용", value: as.cost > 0 ? `${fmt(as.cost)}원` : "없음", bg: as.cost > 0 ? "#FEF2F2" : "#F3F4F6", color: as.cost > 0 ? "#DC2626" : "#8F95A3" },
            { label: "담당", value: as.assignee, bg: "#EFF6FF", color: "#2563EB" },
            ...(as.source ? [{ label: "접수경로", value: as.source, bg: "#F5F3FF", color: "#7C3AED" }] : []),
          ].map((chip, i) => (
            <div key={i} style={{ flexShrink: 0, padding: "10px 14px", borderRadius: 10, background: chip.bg, textAlign: "center", minWidth: 80 }}>
              <div style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600, marginBottom: 3 }}>{chip.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: chip.color }}>{chip.value}</div>
            </div>
          ))}
        </div>

        {/* Paid Alert Banner */}
        {as.paid === "유상" && (
          <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 12, background: "#FEF2F2", border: "1.5px solid #FECACA", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>💰</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#991B1B" }}>유상 수리 · 세입자 부담</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#DC2626" }}>{fmt(as.cost)}<span style={{ fontSize: 12, fontWeight: 500 }}>원</span></div>
            </div>
            <div style={{ padding: "6px 12px", background: "#fff", borderRadius: 8, border: "1px solid #FECACA", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#8F95A3" }}>업체</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{as.vendor}</div>
            </div>
          </div>
        )}

        {/* Content Card */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", letterSpacing: "0.05em", marginBottom: 8 }}>📋 접수 내용</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1D23", marginBottom: 8, lineHeight: 1.4 }}>{as.content || as.title}</div>
          <div style={{ fontSize: 13, color: "#5F6577", lineHeight: 1.7, padding: "12px 14px", background: "#F9FAFB", borderRadius: 10 }}>{as.detail || as.desc}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <div style={{ padding: "8px 14px", background: "#F3F4F6", borderRadius: 8, fontSize: 12 }}>
              🏷️ <span style={{ fontWeight: 700 }}>{as.category || "기타"}</span>
            </div>
            <div style={{ padding: "8px 14px", background: "#F3F4F6", borderRadius: 8, fontSize: 12 }}>
              🏪 <span style={{ fontWeight: 700 }}>{as.vendor || "자체처리"}</span>
            </div>
          </div>
        </Card>

        {/* Before/After Photos */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", letterSpacing: "0.05em", marginBottom: 12 }}>📸 현장 사진</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            <PhotoDropZone photos={asBeforePhotos} maxPhotos={30} label="수리 전 사진" color="#DC2626"
              onAdd={(dataUrls) => setAsBeforePhotos(prev => [...prev, ...dataUrls].slice(0, 30))}
              onRemove={(pi) => setAsBeforePhotos(prev => prev.filter((_, i) => i !== pi))} />
            <PhotoDropZone photos={asAfterPhotos} maxPhotos={30} label="수리 후 사진" color="#059669"
              onAdd={(dataUrls) => setAsAfterPhotos(prev => [...prev, ...dataUrls].slice(0, 30))}
              onRemove={(pi) => setAsAfterPhotos(prev => prev.filter((_, i) => i !== pi))} />
          </div>
        </Card>

        {/* Timeline */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", letterSpacing: "0.05em", marginBottom: 12 }}>🔄 처리 과정</div>
          <div style={{ position: "relative", paddingLeft: 24 }}>
            <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: "#E5E7EB" }} />
            {steps.map((step, i) => {
              const ac = actionColors[step.action] || { bg: "#F3F4F6", color: "#5F6577", icon: "📌" };
              const isLast = i === steps.length - 1;
              return (
                <div key={i} style={{ position: "relative", marginBottom: i < steps.length - 1 ? 16 : 0 }}>
                  <div style={{ position: "absolute", left: -20, top: 6, width: 16, height: 16, borderRadius: "50%", background: isLast ? ac.color : "#fff", border: `2.5px solid ${ac.color}`, zIndex: 1 }} />
                  <div style={{ padding: "10px 12px", background: isLast ? ac.bg : "#fff", borderRadius: 10, border: `1px solid ${isLast ? ac.color + "40" : "#E8ECF0"}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{ac.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: ac.color }}>{step.action}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#B0B5C1" }}>{step.date}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: "#3D4251", lineHeight: 1.6 }}>{step.note}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Update Buttons */}
          {as.status !== "완료" && canEdit && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {as.status === "대기" && (
                <button onClick={() => {
                  updateLocalItem(as.id, item => ({
                    ...item,
                    status: "진행중",
                    steps: [...(item.steps || []), { date: today, action: "진행시작", note: "AS 처리 진행 시작" }],
                    actions: [...(item.actions || []), { step: "진행시작", date: today, by: "사무실" }],
                  }));
                  setSelectedAS(prev => ({
                    ...prev,
                    status: "진행중",
                    steps: [...(prev.steps || []), { date: today, action: "진행시작", note: "AS 처리 진행 시작" }],
                  }));
                }}
                  style={{ flex: 1, padding: "14px", borderRadius: 10, border: "2px solid #EA580C", background: "#FFF7ED", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#EA580C", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  ▶️ 진행중으로 변경
                </button>
              )}
              {(as.status === "대기" || as.status === "진행중") && (
                <button onClick={() => setShowStatusModal("완료")}
                  style={{ flex: 1, padding: "14px", borderRadius: 10, border: "2px solid #059669", background: "#ECFDF5", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#059669", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  ✅ 완료 처리
                </button>
              )}
            </div>
          )}

          {/* Status change for static items - just shows button but no-op with note */}
          {as.status !== "완료" && !canEdit && (
            <button style={{ width: "100%", marginTop: 16, padding: "14px", borderRadius: 10, border: "2px dashed #3B82F6", background: "#EFF6FF", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#2563EB", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              ⏭️ 다음 단계 기록하기
            </button>
          )}
        </Card>

        {/* Complete Status Modal */}
        {showStatusModal === "완료" && canEdit && (
          <Card style={{ marginBottom: 16, border: "2px solid #059669" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 12 }}>✅ 완료 처리</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["무상", "유상"].map(p => (
                <button key={p} onClick={() => setCompletePaid(p)}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: completePaid === p ? `2px solid ${p === "유상" ? "#DC2626" : "#059669"}` : "1.5px solid #E0E3E9", background: completePaid === p ? (p === "유상" ? "#FEF2F2" : "#ECFDF5") : "#fff", color: completePaid === p ? (p === "유상" ? "#DC2626" : "#059669") : "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  {p}
                </button>
              ))}
            </div>
            {completePaid === "유상" && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>비용 (원)</div>
                <input value={completeCost} onChange={e => setCompleteCost(e.target.value)} placeholder="85000" type="number"
                  style={{ ...inputStyle, width: "100%" }} />
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>처리업체</div>
              <select value={completeVendor} onChange={e => setCompleteVendor(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}>
                <option value="">자체처리</option>
                {vendors.map((v, i) => <option key={i} value={v.name}>{v.name} ({v.specialty})</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowStatusModal(null)}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                취소
              </button>
              <button onClick={() => {
                const cost = completePaid === "유상" ? (parseInt(completeCost) || 0) : 0;
                updateLocalItem(as.id, item => ({
                  ...item,
                  status: "완료",
                  paid: completePaid,
                  cost,
                  vendor: completeVendor,
                  steps: [...(item.steps || []), { date: today, action: "수리완료", note: `${completePaid} 처리 완료${cost > 0 ? ` · ${fmt(cost)}원` : ""}${completeVendor ? ` · ${completeVendor}` : ""}` }],
                  actions: [...(item.actions || []), { step: "완료", date: today, by: "사무실" }],
                }));
                setSelectedAS(prev => ({
                  ...prev,
                  status: "완료",
                  paid: completePaid,
                  cost,
                  vendor: completeVendor,
                  steps: [...(prev.steps || []), { date: today, action: "수리완료", note: `${completePaid} 처리 완료${cost > 0 ? ` · ${fmt(cost)}원` : ""}${completeVendor ? ` · ${completeVendor}` : ""}` }],
                }));
                setShowStatusModal(null);
                setCompletePaid("무상");
                setCompleteCost("");
                setCompleteVendor("");
              }}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                완료 처리
              </button>
            </div>
          </Card>
        )}

        {/* Owner Approval Section */}
        {as.status !== "완료" && canEdit && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#D97706", letterSpacing: "0.05em" }}>🏠 건물주 승인</div>
              {as.ownerApproval && <ApprovalBadge status={as.ownerApproval} />}
            </div>
            {!as.ownerApproval && !showApprovalForm && (
              <button onClick={() => setShowApprovalForm(true)}
                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #FDE68A", background: "#FFFBEB", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#D97706", fontFamily: "inherit" }}>
                📩 건물주 승인 요청
              </button>
            )}
            {showApprovalForm && !as.ownerApproval && (
              <div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>예상 비용 (원)</div>
                  <input value={approvalCost} onChange={e => setApprovalCost(e.target.value)} placeholder="예상 수리 비용" type="number"
                    style={{ ...inputStyle, width: "100%" }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>처리업체</div>
                  <select value={approvalVendor} onChange={e => setApprovalVendor(e.target.value)}
                    style={{ ...inputStyle, width: "100%" }}>
                    <option value="">선택</option>
                    {vendors.map((v, i) => <option key={i} value={v.name}>{v.name} ({v.specialty})</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowApprovalForm(false)}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    취소
                  </button>
                  <button onClick={() => {
                    const cost = parseInt(approvalCost) || 0;
                    updateLocalItem(as.id, item => ({
                      ...item,
                      ownerApproval: "pending",
                      estimatedCost: cost,
                      vendor: approvalVendor || item.vendor,
                      steps: [...(item.steps || []), { date: today, action: "건물주승인요청", note: `건물주 승인 요청${cost > 0 ? ` · 예상비용 ${fmt(cost)}원` : ""}${approvalVendor ? ` · ${approvalVendor}` : ""}` }],
                      actions: [...(item.actions || []), { step: "건물주승인요청", date: today, by: "사무실" }],
                    }));
                    setSelectedAS(prev => ({
                      ...prev,
                      ownerApproval: "pending",
                      estimatedCost: cost,
                      vendor: approvalVendor || prev.vendor,
                      steps: [...(prev.steps || []), { date: today, action: "건물주승인요청", note: `건물주 승인 요청${cost > 0 ? ` · 예상비용 ${fmt(cost)}원` : ""}${approvalVendor ? ` · ${approvalVendor}` : ""}` }],
                    }));
                    setShowApprovalForm(false);
                    setApprovalCost("");
                    setApprovalVendor("");
                  }}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#D97706", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    승인 요청
                  </button>
                </div>
              </div>
            )}
            {as.ownerApproval === "pending" && (
              <div style={{ padding: "12px 14px", background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A", fontSize: 12, color: "#92400E" }}>
                건물주 승인 대기 중입니다{as.estimatedCost > 0 ? ` · 예상비용 ${fmt(as.estimatedCost)}원` : ""}
              </div>
            )}
            {as.ownerApproval === "approved" && (
              <div style={{ padding: "12px 14px", background: "#ECFDF5", borderRadius: 8, border: "1px solid #A7F3D0", fontSize: 12, color: "#065F46" }}>
                건물주가 승인했습니다. 진행해 주세요.
              </div>
            )}
            {as.ownerApproval === "rejected" && (
              <div style={{ padding: "12px 14px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA", fontSize: 12, color: "#991B1B" }}>
                건물주가 반려했습니다. 재검토가 필요합니다.
              </div>
            )}
          </Card>
        )}

        {/* Quick Action Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <button style={{ padding: "16px", borderRadius: 12, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <span style={{ fontSize: 24 }}>📞</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>세입자 연락</span>
          </button>
          <button style={{ padding: "16px", borderRadius: 12, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <span style={{ fontSize: 24 }}>📸</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>사진 촬영</span>
          </button>
          <button style={{ padding: "16px", borderRadius: 12, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <span style={{ fontSize: 24 }}>💰</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>견적 입력</span>
          </button>
          <button style={{ padding: "16px", borderRadius: 12, border: as.status !== "완료" ? "2px solid #10B981" : "1px solid #E0E3E9", background: as.status !== "완료" ? "#ECFDF5" : "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: as.status !== "완료" ? "#059669" : "#1A1D23" }}>처리 완료</span>
          </button>
        </div>

        {/* Summary Info */}
        <Card>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", letterSpacing: "0.05em", marginBottom: 10 }}>ℹ️ 요약 정보</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {[
              { label: "접수일", value: as.date },
              { label: "건물/호실", value: `${as.building} ${as.room}호` },
              { label: "분류", value: as.category || "기타" },
              { label: "긴급도", value: as.priority },
              { label: "담당자", value: as.assignee },
              { label: "유/무상", value: as.paid, highlight: as.paid === "유상" },
              { label: "비용", value: as.cost > 0 ? `${fmt(as.cost)}원` : "—", highlight: as.cost > 0 },
              { label: "처리업체", value: as.vendor || "자체처리" },
            ].map((item, i) => (
              <div key={i} style={{ padding: "10px 12px", borderBottom: "1px solid #F0F2F5", borderRight: i % 2 === 0 ? "1px solid #F0F2F5" : "none" }}>
                <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: item.highlight ? 700 : 600, color: item.highlight ? "#DC2626" : "#1A1D23" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ─── NEW AS FORM ────────────────────────────────────────
  if (showNewForm) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setShowNewForm(false)} style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", flexShrink: 0 }}>‹</button>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23" }}>새 AS 접수</h1>
        </div>

        <Card style={{ marginBottom: 16 }}>
          {/* Building */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>건물 *</div>
            <select value={newBuilding} onChange={e => setNewBuilding(e.target.value)}
              style={{ ...inputStyle, width: "100%" }}>
              <option value="">선택하세요</option>
              {buildingNames.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Room */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>호실</div>
            <input value={newRoom} onChange={e => setNewRoom(e.target.value)} placeholder="예: 301"
              style={{ ...inputStyle, width: "100%" }} />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>설명 *</div>
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="AS 내용을 입력하세요 (첫 줄이 제목으로 사용됩니다)" rows={4}
              style={{ ...inputStyle, width: "100%", resize: "vertical", minHeight: 80 }} />
          </div>

          {/* Photos */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>사진</div>
            <PhotoDropZone photos={newPhotos} maxPhotos={10} label="접수 사진" color="#3B82F6"
              onAdd={(dataUrls) => setNewPhotos(prev => [...prev, ...dataUrls].slice(0, 10))}
              onRemove={(pi) => setNewPhotos(prev => prev.filter((_, i) => i !== pi))} />
          </div>

          {/* Priority */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>긴급도</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["일반", "긴급"].map(p => (
                <button key={p} onClick={() => setNewPriority(p)}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: newPriority === p ? `2px solid ${p === "긴급" ? "#DC2626" : "#3B82F6"}` : "1.5px solid #E0E3E9", background: newPriority === p ? (p === "긴급" ? "#FEF2F2" : "#EFF6FF") : "#fff", color: newPriority === p ? (p === "긴급" ? "#DC2626" : "#2563EB") : "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  {p === "긴급" ? "🚨 " : ""}{p}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>접수 경로</div>
            <select value={newSource} onChange={e => setNewSource(e.target.value)}
              style={{ ...inputStyle, width: "100%" }}>
              <option value="사무실접수">사무실접수</option>
              <option value="임차인접수">임차인접수</option>
              <option value="순회발견">순회발견</option>
            </select>
          </div>

          {/* Assignee */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>담당자</div>
            <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)}
              style={{ ...inputStyle, width: "100%" }}>
              <option value="">선택하세요</option>
              {allStaff.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowNewForm(false)}
              style={{ flex: 1, padding: "14px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              취소
            </button>
            <button onClick={handleSubmitAS} disabled={!newBuilding || !newDesc.trim()}
              style={{ flex: 2, padding: "14px", borderRadius: 10, border: "none", background: newBuilding && newDesc.trim() ? "#3B82F6" : "#D1D5DB", color: "#fff", fontWeight: 700, fontSize: 13, cursor: newBuilding && newDesc.trim() ? "pointer" : "default", fontFamily: "inherit" }}>
              접수하기
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── VENDOR MANAGEMENT ────────────────────────────────────
  if (showVendorMgmt) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setShowVendorMgmt(false)} style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", flexShrink: 0 }}>‹</button>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23" }}>🏪 협력업체 관리</h1>
        </div>

        {/* Add/Edit Vendor Form */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", letterSpacing: "0.05em", marginBottom: 10 }}>
            {editingVendorIdx !== null ? "✏️ 업체 수정" : "➕ 업체 추가"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>업체명 *</div>
              <input value={vendorForm.name} onChange={e => setVendorForm(p => ({ ...p, name: e.target.value }))} placeholder="업체명"
                style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>연락처</div>
              <input value={vendorForm.phone} onChange={e => setVendorForm(p => ({ ...p, phone: e.target.value }))} placeholder="010-0000-0000"
                style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>전문분야</div>
              <input value={vendorForm.specialty} onChange={e => setVendorForm(p => ({ ...p, specialty: e.target.value }))} placeholder="예: 보일러, 전기, 배관"
                style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>비고</div>
              <input value={vendorForm.note} onChange={e => setVendorForm(p => ({ ...p, note: e.target.value }))} placeholder="메모"
                style={{ ...inputStyle, width: "100%" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {editingVendorIdx !== null && (
              <button onClick={() => { setEditingVendorIdx(null); setVendorForm({ name: "", phone: "", specialty: "", note: "" }); }}
                style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                취소
              </button>
            )}
            <button onClick={handleSaveVendor} disabled={!vendorForm.name.trim()}
              style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: vendorForm.name.trim() ? "#3B82F6" : "#D1D5DB", color: "#fff", fontWeight: 700, fontSize: 12, cursor: vendorForm.name.trim() ? "pointer" : "default", fontFamily: "inherit" }}>
              {editingVendorIdx !== null ? "수정" : "추가"}
            </button>
          </div>
        </Card>

        {/* Vendor List */}
        <Card>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", letterSpacing: "0.05em", marginBottom: 10 }}>📋 등록된 업체 ({vendors.length})</div>
          {vendors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#B0B5C1", fontSize: 13 }}>등록된 협력업체가 없습니다</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {vendors.map((v, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #E8ECF0" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1D23" }}>{v.name}</span>
                      {v.specialty && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#EFF6FF", color: "#2563EB" }}>{v.specialty}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#8F95A3" }}>
                      {v.phone && <span>📞 {v.phone}</span>}
                      {v.note && <span style={{ marginLeft: 8 }}>· {v.note}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => { setEditingVendorIdx(i); setVendorForm({ ...v }); }}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#3B82F6" }}>
                      수정
                    </button>
                    <button onClick={() => { if (confirm("삭제하시겠습니까?")) setVendors(prev => prev.filter((_, idx) => idx !== i)); }}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#DC2626" }}>
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ─── MAIN LIST VIEW ────────────────────────────────────────
  return (
    <div>
      <SectionTitle sub="시설물 유지보수 관리">🔧 AS 관리</SectionTitle>

      {/* Top Action Bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: isMobile ? 10 : 16, flexWrap: "wrap" }}>
        <button onClick={() => setShowNewForm(true)}
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#3B82F6", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(59,130,246,0.3)" }}>
          ➕ 새 AS 접수
        </button>
        <button onClick={() => setShowVendorMgmt(true)}
          style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          🏪 협력업체 관리
          {vendors.length > 0 && <span style={{ background: "#EFF6FF", color: "#3B82F6", padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>{vendors.length}</span>}
        </button>
      </div>

      {/* Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 6 : 12, marginBottom: isMobile ? 10 : 20 }}>
        {[
          { label: "대기", count: allAsItems.filter(a => a.status === "대기").length, color: "#4F46E5", bg: "#F0F4FF" },
          { label: "진행중", count: allAsItems.filter(a => a.status === "진행중").length, color: "#EA580C", bg: "#FFF7ED" },
          { label: "완료", count: allAsItems.filter(a => a.status === "완료").length, color: "#059669", bg: "#ECFDF5" },
          { label: "유상", count: paidCount, sub: `${fmt(paidCost)}원`, color: "#DC2626", bg: "#FEF2F2" },
        ].map((s, i) => (
          <Card key={i} onClick={() => setTab(s.label === "유상" ? "전체" : s.label)} style={{ background: tab === s.label ? s.bg : "#fff", border: tab === s.label ? `2px solid ${s.color}` : "1px solid #E8ECF0", padding: isMobile ? "8px 10px" : undefined, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div style={{ fontSize: isMobile ? 10 : 11, color: "#8F95A3", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: s.color }}>{s.count}</div>
            {s.sub && <div style={{ fontSize: isMobile ? 10 : 11, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.sub}</div>}
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
        {assigneesAS.map(a => (
          <button key={a} onClick={() => setFilterAssigneeAS(a)}
            style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 8, border: filterAssigneeAS === a ? "2px solid #10B981" : "1.5px solid #E0E3E9", background: filterAssigneeAS === a ? "#10B981" : "#fff", color: filterAssigneeAS === a ? "#fff" : "#5F6577", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
            {a} {a !== "전체" && <span style={{ fontSize: 10, opacity: 0.7 }}>({myAS.filter(item => item.assignee === a).length})</span>}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: isMobile ? 8 : 12, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setTab(s)}
            style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 7, border: tab === s ? "2px solid #3B82F6" : "1px solid #E0E3E9", background: tab === s ? "#EFF6FF" : "#fff", color: tab === s ? "#2563EB" : "#5F6577", fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
            {s}
          </button>
        ))}
        <span style={{ flexShrink: 0, fontSize: 11, color: "#8F95A3", padding: "6px 8px" }}>비용 {fmt(totalCost)}원</span>
      </div>

      {/* Mobile: Card List / Desktop: Table */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#B0B5C1", fontSize: 13 }}>해당 조건의 AS 내역이 없습니다</div>
          )}
          {filtered.map((a, i) => (
            <Card key={a.id || i} onClick={() => setSelectedAS(a)} style={{ cursor: "pointer", padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusBadge status={a.status} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1D23" }}>{a.content || a.title}</span>
                </div>
                <span style={{ fontSize: 11, color: "#B0B5C1", flexShrink: 0 }}>{a.date}</span>
              </div>
              <div style={{ fontSize: 12, color: "#5F6577", marginBottom: 8 }}>
                {a.building} {a.room}호 · {a.category || "기타"}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: a.paid === "유상" ? "#FEF2F2" : "#ECFDF5", color: a.paid === "유상" ? "#DC2626" : "#059669" }}>{a.paid}</span>
                {a.cost > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626" }}>{fmt(a.cost)}원</span>}
                {(a.priority === "높음" || a.priority === "긴급") && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#FEF2F2", color: "#DC2626", fontWeight: 600 }}>{a.priority}</span>}
                {a.ownerApproval && <ApprovalBadge status={a.ownerApproval} />}
                <span style={{ fontSize: 10, color: "#8F95A3", marginLeft: "auto" }}>{a.assignee} · {(a.steps || []).length}단계</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table
            columns={[
              { label: "접수일", key: "date" },
              { label: "건물", render: r => `${r.building} ${r.room}호` },
              { label: "분류", render: r => <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#F3F4F6", fontWeight: 600 }}>{r.category || "기타"}</span> },
              { label: "내용", render: r => r.content || r.title },
              { label: "유/무상", render: r => <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: r.paid === "유상" ? "#FEF2F2" : "#ECFDF5", color: r.paid === "유상" ? "#DC2626" : "#059669" }}>{r.paid}</span> },
              { label: "비용", align: "right", render: r => r.cost > 0 ? <span style={{ fontWeight: 700 }}>{fmt(r.cost)}원</span> : <span style={{ color: "#ccc" }}>—</span> },
              { label: "긴급도", render: r => (r.priority === "높음" || r.priority === "긴급") ? <StatusBadge status={r.priority} /> : null },
              { label: "담당", key: "assignee" },
              { label: "승인", render: r => <ApprovalBadge status={r.ownerApproval} /> },
              { label: "진행", render: r => <span style={{ fontSize: 11, color: "#8F95A3" }}>{(r.steps || []).length}단계</span> },
              { label: "상태", render: r => <StatusBadge status={r.status} /> },
            ]}
            data={filtered}
            onRowClick={(row) => setSelectedAS(row)}
          />
          <div style={{ marginTop: 10, fontSize: 11, color: "#B0B5C1", textAlign: "center" }}>행을 클릭하면 상세 화면으로 이동합니다</div>
        </Card>
      )}

      {/* Mobile FAB - New AS */}
      {isMobile && (
        <button onClick={() => setShowNewForm(true)} style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: "#3B82F6", color: "#fff", border: "none", fontSize: 28, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(59,130,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>+</button>
      )}
    </div>
  );
};
