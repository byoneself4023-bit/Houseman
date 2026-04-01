import { useState } from 'react';
import { asItems as staticAsItems } from '@/data';
import { buildings } from '@/data/buildings';
import { useIsMobile, fmt } from '@/utils';
import { Card, SectionTitle, Table, StatusBadge, PhotoDropZone } from '@/components';
import { inputClassName } from '@/components/Field';
import { initialStaffMembers } from '@/config';
import { useLocalStorage } from '@/utils/useLocalStorage';

interface ASStep {
  date: string;
  action: string;
  note: string;
}

interface ASAction {
  step: string;
  date: string;
  by: string;
}

interface ASItemRecord {
  id: number;
  building: string;
  room: string;
  date: string;
  title?: string;
  content?: string;
  detail?: string;
  desc?: string;
  status: string;
  priority: string;
  assignee: string;
  paid: string;
  cost: number;
  vendor: string;
  source?: string;
  category?: string;
  photos?: string[];
  photoBefore?: string;
  photoAfter?: string;
  steps?: ASStep[];
  actions?: ASAction[];
  ownerApproval?: string | null;
  estimatedCost?: number;
  [key: string]: any;
}

interface Vendor {
  name: string;
  phone: string;
  specialty: string;
  note: string;
}

interface ApprovalBadgeProps {
  status?: string | null;
}

interface ASPageProps {
  myBuildings?: string[];
  isLoading?: boolean;
}

export const ASPage: React.FC<ASPageProps> = ({ myBuildings = [] }) => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("전체");
  const [selectedAS, setSelectedAS] = useState<ASItemRecord | null>(null);
  const [filterAssigneeAS, setFilterAssigneeAS] = useState("전체");
  const [asBeforePhotos, setAsBeforePhotos] = useLocalStorage<string[]>("hm_asBeforePhotos", []);
  const [asAfterPhotos, setAsAfterPhotos] = useLocalStorage<string[]>("hm_asAfterPhotos", []);
  const [localAsItems, setLocalAsItems] = useLocalStorage<ASItemRecord[]>("hm_asItems", []);
  const [vendors, setVendors] = useLocalStorage<Vendor[]>("hm_vendors", []);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showVendorMgmt, setShowVendorMgmt] = useState(false);

  // New AS form state
  const [newBuilding, setNewBuilding] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [newPriority, setNewPriority] = useState("일반");
  const [newSource, setNewSource] = useState("사무실접수");
  const [newAssignee, setNewAssignee] = useState("");

  // Vendor form state
  const [vendorForm, setVendorForm] = useState<Vendor>({ name: "", phone: "", specialty: "", note: "" });
  const [editingVendorIdx, setEditingVendorIdx] = useState<number | null>(null);

  // Status update modal state
  const [showStatusModal, setShowStatusModal] = useState<string | null>(null); // "진행중" | "완료" | null
  const [completePaid, setCompletePaid] = useState("무상");
  const [completeCost, setCompleteCost] = useState("");
  const [completeVendor, setCompleteVendor] = useState("");

  // Owner approval state
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalCost, setApprovalCost] = useState("");
  const [approvalVendor, setApprovalVendor] = useState("");

  const statuses = ["전체", "대기", "진행중", "완료"];
  const [staffList] = useLocalStorage("hm_staffList", initialStaffMembers);
  const externalStaffAS = (staffList as any[]).filter(s => s.roles.includes("external")).map(s => s.name);
  const allStaff = (staffList as any[]).map(s => s.name);

  // Merge static + localStorage AS items
  const allAsItems: ASItemRecord[] = [...(staticAsItems as any[]), ...localAsItems];
  const myAS = myBuildings.length > 0 ? allAsItems.filter(a => myBuildings.includes(a.building)) : allAsItems;

  const assigneesAS = ["전체", ...externalStaffAS];
  const filteredByAssigneeAS = filterAssigneeAS === "전체" ? myAS : myAS.filter(a => a.assignee === filterAssigneeAS);
  const filtered = tab === "전체" ? filteredByAssigneeAS : filteredByAssigneeAS.filter(a => a.status === tab);

  const totalCost = myAS.reduce((s, a) => s + (a.cost || 0), 0);
  const paidCount = myAS.filter(a => a.paid === "유상").length;
  const paidCost = myAS.filter(a => a.paid === "유상").reduce((s, a) => s + (a.cost || 0), 0);

  const actionColors: Record<string, { bg: string; color: string; icon: string }> = {
    "접수": { bg: "var(--color-hm-blue-bg)", color: "var(--color-hm-blue-dark)", icon: "📋" },
    "현장확인": { bg: "var(--color-hm-warning-bg)", color: "var(--color-hm-warning)", icon: "🔍" },
    "현장출동": { bg: "var(--color-hm-warning-bg)", color: "var(--color-hm-warning)", icon: "🚗" },
    "부품발주": { bg: "#F5F3FF", color: "#7C3AED", icon: "📦" },
    "견적전달": { bg: "#FFFBEB", color: "#D97706", icon: "💰" },
    "수리완료": { bg: "var(--color-hm-success-bg)", color: "var(--color-hm-success)", icon: "✅" },
    "완료확인": { bg: "var(--color-hm-success-bg)", color: "var(--color-hm-success)", icon: "👍" },
    "진행시작": { bg: "var(--color-hm-warning-bg)", color: "var(--color-hm-warning)", icon: "▶️" },
    "건물주승인요청": { bg: "#FFFBEB", color: "#D97706", icon: "📩" },
    "건물주승인": { bg: "var(--color-hm-success-bg)", color: "var(--color-hm-success)", icon: "✅" },
    "건물주반려": { bg: "var(--color-hm-danger-bg)", color: "var(--color-hm-danger)", icon: "❌" },
  };

  const today = new Date().toISOString().slice(0, 10);

  const buildingNames = buildings.map(b => b.name);

  // Helper to update a local AS item
  const updateLocalItem = (id: number, updater: (item: ASItemRecord) => ASItemRecord) => {
    setLocalAsItems(prev => prev.map(item => item.id === id ? updater(item) : item));
  };

  // Check if item is from localStorage (editable)
  const isLocalItem = (item: ASItemRecord): boolean => localAsItems.some(li => li.id === item.id);

  // Handle new AS submission
  const handleSubmitAS = () => {
    if (!newBuilding || !newDesc.trim()) return;
    const titleLine = newDesc.trim().split("\n")[0].slice(0, 30);
    const newItem: ASItemRecord = {
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
  const ApprovalBadge: React.FC<ApprovalBadgeProps> = ({ status }) => {
    if (!status) return null;
    const cfg: Record<string, { label: string; bg: string; color: string; border: string }> = {
      pending: { label: "승인대기", bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
      approved: { label: "승인완료", bg: "var(--color-hm-success-bg)", color: "var(--color-hm-success)", border: "var(--color-hm-success-border)" },
      rejected: { label: "반려", bg: "var(--color-hm-danger-bg)", color: "var(--color-hm-danger)", border: "var(--color-hm-danger-border)" },
    };
    const c = cfg[status];
    if (!c) return null;
    return (
      <span className="text-xs font-bold px-2.5 py-[3px] rounded-md" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
        {c.label}
      </span>
    );
  };

  // ─── DETAIL VIEW ────────────────────────────────────────
  if (selectedAS) {
    const as_ = selectedAS;
    const canEdit = isLocalItem(as_);
    const steps = as_.steps || [];

    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setSelectedAS(null); setShowStatusModal(null); setShowApprovalForm(false); }} className="w-10 h-10 rounded-[10px] border border-hm-input-border bg-white cursor-pointer text-lg flex items-center justify-center font-[inherit] shrink-0 hover:bg-hm-bg-hover transition-colors">‹</button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-lg font-bold text-hm-text">AS #{as_.id}</h1>
              <StatusBadge status={as_.status} />
              <ApprovalBadge status={as_.ownerApproval} />
            </div>
            <p className="text-xs text-hm-text-muted mt-[3px]">{as_.building} {as_.room}호 · {as_.date}</p>
          </div>
        </div>

        {/* Status + Cost Quick Bar */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
          {[
            ...(as_.priority === "높음" ? [{ label: "긴급도", value: "높음", bg: "var(--color-hm-danger-bg)", color: "var(--color-hm-danger)" }] : []),
            { label: "유/무상", value: as_.paid, bg: as_.paid === "유상" ? "var(--color-hm-danger-bg)" : "var(--color-hm-success-bg)", color: as_.paid === "유상" ? "var(--color-hm-danger)" : "var(--color-hm-success)" },
            { label: "비용", value: as_.cost > 0 ? `${fmt(as_.cost)}원` : "없음", bg: as_.cost > 0 ? "var(--color-hm-danger-bg)" : "#F3F4F6", color: as_.cost > 0 ? "var(--color-hm-danger)" : "var(--color-hm-text-muted)" },
            { label: "담당", value: as_.assignee, bg: "var(--color-hm-blue-bg)", color: "var(--color-hm-blue-dark)" },
            ...(as_.source ? [{ label: "접수경로", value: as_.source, bg: "#F5F3FF", color: "#7C3AED" }] : []),
          ].map((chip, i) => (
            <div key={i} className="shrink-0 px-3.5 py-2.5 rounded-[10px] text-center min-w-[80px]" style={{ background: chip.bg }}>
              <div className="text-xs text-hm-text-muted font-semibold mb-[3px]">{chip.label}</div>
              <div className="text-sm font-bold" style={{ color: chip.color }}>{chip.value}</div>
            </div>
          ))}
        </div>

        {/* Paid Alert Banner */}
        {as_.paid === "유상" && (
          <div className="mb-4 px-4 py-3.5 rounded-xl bg-hm-danger-bg border-[1.5px] border-hm-danger-border flex items-center gap-3">
            <span className="text-2xl shrink-0">💰</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#991B1B]">유상 수리 · 세입자 부담</div>
              <div className="text-xl font-bold text-hm-danger">{fmt(as_.cost)}<span className="text-xs font-medium">원</span></div>
            </div>
            <div className="px-3 py-1.5 bg-white rounded-lg border border-hm-danger-border text-center">
              <div className="text-xs text-hm-text-muted">업체</div>
              <div className="text-xs font-bold">{as_.vendor}</div>
            </div>
          </div>
        )}

        {/* Content Card */}
        <Card className="mb-4">
          <div className="text-xs font-bold text-hm-blue tracking-wider mb-2">📋 접수 내용</div>
          <div className="text-base font-bold text-hm-text mb-2 leading-snug">{as_.content || as_.title}</div>
          <div className="text-sm text-hm-text-sub leading-relaxed px-3.5 py-3 bg-hm-bg-hover rounded-[10px]">{as_.detail || as_.desc}</div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <div className="px-3.5 py-2 bg-hm-bg rounded-lg text-xs">
              🏷️ <span className="font-bold">{as_.category || "기타"}</span>
            </div>
            <div className="px-3.5 py-2 bg-hm-bg rounded-lg text-xs">
              🏪 <span className="font-bold">{as_.vendor || "자체처리"}</span>
            </div>
          </div>
        </Card>

        {/* Before/After Photos */}
        <Card className="mb-4">
          <div className="text-xs font-bold text-hm-blue tracking-wider mb-3">📸 현장 사진</div>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2.5`}>
            <PhotoDropZone photos={asBeforePhotos} maxPhotos={30} label="수리 전 사진" color="var(--color-hm-danger)"
              onAdd={(dataUrls: string[]) => setAsBeforePhotos(prev => [...prev, ...dataUrls].slice(0, 30))}
              onRemove={(pi: number) => setAsBeforePhotos(prev => prev.filter((_, i) => i !== pi))} />
            <PhotoDropZone photos={asAfterPhotos} maxPhotos={30} label="수리 후 사진" color="var(--color-hm-success)"
              onAdd={(dataUrls: string[]) => setAsAfterPhotos(prev => [...prev, ...dataUrls].slice(0, 30))}
              onRemove={(pi: number) => setAsAfterPhotos(prev => prev.filter((_, i) => i !== pi))} />
          </div>
        </Card>

        {/* Timeline */}
        <Card className="mb-4">
          <div className="text-xs font-bold text-hm-blue tracking-wider mb-3">🔄 처리 과정</div>
          <div className="relative pl-6">
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />
            {steps.map((step, i) => {
              const ac = actionColors[step.action] || { bg: "#F3F4F6", color: "var(--color-hm-text-sub)", icon: "📌" };
              const isLast = i === steps.length - 1;
              return (
                <div key={i} className={`relative ${i < steps.length - 1 ? 'mb-4' : ''}`}>
                  <div className="absolute w-4 h-4 rounded-full z-[1]" style={{ left: -20, top: 6, background: isLast ? ac.color : "#fff", border: `2.5px solid ${ac.color}` }} />
                  <div className="px-3 py-2.5 rounded-[10px]" style={{ background: isLast ? ac.bg : "#fff", border: `1px solid ${isLast ? ac.color + "40" : "var(--color-hm-border)"}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{ac.icon}</span>
                        <span className="text-sm font-bold" style={{ color: ac.color }}>{step.action}</span>
                      </div>
                      <span className="text-xs text-[#B0B5C1]">{step.date}</span>
                    </div>
                    <div className="text-[12.5px] text-[#3D4251] leading-relaxed">{step.note}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Update Buttons */}
          {as_.status !== "완료" && canEdit && (
            <div className="flex gap-2 mt-4">
              {as_.status === "대기" && (
                <button onClick={() => {
                  updateLocalItem(as_.id, item => ({
                    ...item,
                    status: "진행중",
                    steps: [...(item.steps || []), { date: today, action: "진행시작", note: "AS 처리 진행 시작" }],
                    actions: [...(item.actions || []), { step: "진행시작", date: today, by: "사무실" }],
                  }));
                  setSelectedAS(prev => prev ? ({
                    ...prev,
                    status: "진행중",
                    steps: [...(prev.steps || []), { date: today, action: "진행시작", note: "AS 처리 진행 시작" }],
                  }) : null);
                }}
                  className="flex-1 py-3.5 rounded-[10px] border-2 border-hm-warning bg-hm-warning-bg cursor-pointer text-sm font-bold text-hm-warning font-[inherit] flex items-center justify-center gap-2 hover:shadow-md transition-all">
                  ▶️ 진행중으로 변경
                </button>
              )}
              {(as_.status === "대기" || as_.status === "진행중") && (
                <button onClick={() => setShowStatusModal("완료")}
                  className="flex-1 py-3.5 rounded-[10px] border-2 border-hm-success bg-hm-success-bg cursor-pointer text-sm font-bold text-hm-success font-[inherit] flex items-center justify-center gap-2 hover:shadow-md transition-all">
                  ✅ 완료 처리
                </button>
              )}
            </div>
          )}

          {/* Status change for static items - just shows button but no-op with note */}
          {as_.status !== "완료" && !canEdit && (
            <button className="w-full mt-4 py-3.5 rounded-[10px] border-2 border-dashed border-hm-blue bg-hm-blue-bg cursor-pointer text-sm font-bold text-hm-blue-dark font-[inherit] flex items-center justify-center gap-2 hover:shadow-md transition-all">
              ⏭️ 다음 단계 기록하기
            </button>
          )}
        </Card>

        {/* Complete Status Modal */}
        {showStatusModal === "완료" && canEdit && (
          <Card className="mb-4 border-2 border-hm-success">
            <div className="text-xs font-bold text-hm-success mb-3">✅ 완료 처리</div>
            <div className="flex gap-2 mb-3">
              {["무상", "유상"].map(p => (
                <button key={p} onClick={() => setCompletePaid(p)}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm cursor-pointer font-[inherit] transition-all ${completePaid === p ? (p === "유상" ? 'border-2 border-hm-danger bg-hm-danger-bg text-hm-danger' : 'border-2 border-hm-success bg-hm-success-bg text-hm-success') : 'border-[1.5px] border-hm-input-border bg-white text-hm-text-sub hover:bg-hm-bg-hover'}`}>
                  {p}
                </button>
              ))}
            </div>
            {completePaid === "유상" && (
              <div className="mb-3">
                <div className="text-xs font-bold text-hm-text-sub mb-1">비용 (원)</div>
                <input value={completeCost} onChange={e => setCompleteCost(e.target.value)} placeholder="85000" type="number"
                  className={inputClassName} />
              </div>
            )}
            <div className="mb-3">
              <div className="text-xs font-bold text-hm-text-sub mb-1">처리업체</div>
              <select value={completeVendor} onChange={e => setCompleteVendor(e.target.value)}
                className={inputClassName}>
                <option value="">자체처리</option>
                {vendors.map((v, i) => <option key={i} value={v.name}>{v.name} ({v.specialty})</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowStatusModal(null)}
                className="flex-1 py-2.5 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
                취소
              </button>
              <button onClick={() => {
                const cost = completePaid === "유상" ? (parseInt(completeCost) || 0) : 0;
                updateLocalItem(as_.id, item => ({
                  ...item,
                  status: "완료",
                  paid: completePaid,
                  cost,
                  vendor: completeVendor,
                  steps: [...(item.steps || []), { date: today, action: "수리완료", note: `${completePaid} 처리 완료${cost > 0 ? ` · ${fmt(cost)}원` : ""}${completeVendor ? ` · ${completeVendor}` : ""}` }],
                  actions: [...(item.actions || []), { step: "완료", date: today, by: "사무실" }],
                }));
                setSelectedAS(prev => prev ? ({
                  ...prev,
                  status: "완료",
                  paid: completePaid,
                  cost,
                  vendor: completeVendor,
                  steps: [...(prev.steps || []), { date: today, action: "수리완료", note: `${completePaid} 처리 완료${cost > 0 ? ` · ${fmt(cost)}원` : ""}${completeVendor ? ` · ${completeVendor}` : ""}` }],
                }) : null);
                setShowStatusModal(null);
                setCompletePaid("무상");
                setCompleteCost("");
                setCompleteVendor("");
              }}
                className="flex-1 py-2.5 rounded-lg border-none bg-hm-success text-white font-bold text-xs cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
                완료 처리
              </button>
            </div>
          </Card>
        )}

        {/* Owner Approval Section */}
        {as_.status !== "완료" && canEdit && (
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-[#D97706] tracking-wider">🏠 건물주 승인</div>
              {as_.ownerApproval && <ApprovalBadge status={as_.ownerApproval} />}
            </div>
            {!as_.ownerApproval && !showApprovalForm && (
              <button onClick={() => setShowApprovalForm(true)}
                className="w-full py-3 rounded-[10px] border-[1.5px] border-[#FDE68A] bg-[#FFFBEB] cursor-pointer text-sm font-bold text-[#D97706] font-[inherit] hover:shadow-md transition-all">
                📩 건물주 승인 요청
              </button>
            )}
            {showApprovalForm && !as_.ownerApproval && (
              <div>
                <div className="mb-2.5">
                  <div className="text-xs font-bold text-hm-text-sub mb-1">예상 비용 (원)</div>
                  <input value={approvalCost} onChange={e => setApprovalCost(e.target.value)} placeholder="예상 수리 비용" type="number"
                    className={inputClassName} />
                </div>
                <div className="mb-2.5">
                  <div className="text-xs font-bold text-hm-text-sub mb-1">처리업체</div>
                  <select value={approvalVendor} onChange={e => setApprovalVendor(e.target.value)}
                    className={inputClassName}>
                    <option value="">선택</option>
                    {vendors.map((v, i) => <option key={i} value={v.name}>{v.name} ({v.specialty})</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowApprovalForm(false)}
                    className="flex-1 py-2.5 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
                    취소
                  </button>
                  <button onClick={() => {
                    const cost = parseInt(approvalCost) || 0;
                    updateLocalItem(as_.id, item => ({
                      ...item,
                      ownerApproval: "pending",
                      estimatedCost: cost,
                      vendor: approvalVendor || item.vendor,
                      steps: [...(item.steps || []), { date: today, action: "건물주승인요청", note: `건물주 승인 요청${cost > 0 ? ` · 예상비용 ${fmt(cost)}원` : ""}${approvalVendor ? ` · ${approvalVendor}` : ""}` }],
                      actions: [...(item.actions || []), { step: "건물주승인요청", date: today, by: "사무실" }],
                    }));
                    setSelectedAS(prev => prev ? ({
                      ...prev,
                      ownerApproval: "pending",
                      estimatedCost: cost,
                      vendor: approvalVendor || prev.vendor,
                      steps: [...(prev.steps || []), { date: today, action: "건물주승인요청", note: `건물주 승인 요청${cost > 0 ? ` · 예상비용 ${fmt(cost)}원` : ""}${approvalVendor ? ` · ${approvalVendor}` : ""}` }],
                    }) : null);
                    setShowApprovalForm(false);
                    setApprovalCost("");
                    setApprovalVendor("");
                  }}
                    className="flex-1 py-2.5 rounded-lg border-none bg-[#D97706] text-white font-bold text-xs cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
                    승인 요청
                  </button>
                </div>
              </div>
            )}
            {as_.ownerApproval === "pending" && (
              <div className="px-3.5 py-3 bg-[#FFFBEB] rounded-lg border border-[#FDE68A] text-xs text-[#92400E]">
                건물주 승인 대기 중입니다{(as_.estimatedCost ?? 0) > 0 ? ` · 예상비용 ${fmt(as_.estimatedCost!)}원` : ""}
              </div>
            )}
            {as_.ownerApproval === "approved" && (
              <div className="px-3.5 py-3 bg-hm-success-bg rounded-lg border border-hm-success-border text-xs text-[#065F46]">
                건물주가 승인했습니다. 진행해 주세요.
              </div>
            )}
            {as_.ownerApproval === "rejected" && (
              <div className="px-3.5 py-3 bg-hm-danger-bg rounded-lg border border-hm-danger-border text-xs text-[#991B1B]">
                건물주가 반려했습니다. 재검토가 필요합니다.
              </div>
            )}
          </Card>
        )}

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button className="p-4 rounded-xl border border-hm-input-border bg-white cursor-pointer font-[inherit] flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-2xl">📞</span>
            <span className="text-xs font-bold text-hm-text">세입자 연락</span>
          </button>
          <button className="p-4 rounded-xl border border-hm-input-border bg-white cursor-pointer font-[inherit] flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-2xl">📸</span>
            <span className="text-xs font-bold text-hm-text">사진 촬영</span>
          </button>
          <button className="p-4 rounded-xl border border-hm-input-border bg-white cursor-pointer font-[inherit] flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-2xl">💰</span>
            <span className="text-xs font-bold text-hm-text">견적 입력</span>
          </button>
          <button className={`p-4 rounded-xl cursor-pointer font-[inherit] flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md transition-shadow ${as_.status !== "완료" ? 'border-2 border-[#10B981] bg-hm-success-bg' : 'border border-hm-input-border bg-white'}`}>
            <span className="text-2xl">✅</span>
            <span className={`text-xs font-bold ${as_.status !== "완료" ? 'text-hm-success' : 'text-hm-text'}`}>처리 완료</span>
          </button>
        </div>

        {/* Summary Info */}
        <Card>
          <div className="text-xs font-bold text-hm-blue tracking-wider mb-2.5">ℹ️ 요약 정보</div>
          <div className="grid grid-cols-2">
            {[
              { label: "접수일", value: as_.date },
              { label: "건물/호실", value: `${as_.building} ${as_.room}호` },
              { label: "분류", value: as_.category || "기타" },
              { label: "긴급도", value: as_.priority },
              { label: "담당자", value: as_.assignee },
              { label: "유/무상", value: as_.paid, highlight: as_.paid === "유상" },
              { label: "비용", value: as_.cost > 0 ? `${fmt(as_.cost)}원` : "—", highlight: as_.cost > 0 },
              { label: "처리업체", value: as_.vendor || "자체처리" },
            ].map((item, i) => (
              <div key={i} className={`px-3 py-2.5 border-b border-[#F0F2F5] ${i % 2 === 0 ? 'border-r border-r-[#F0F2F5]' : ''}`}>
                <div className="text-xs text-hm-text-muted mb-0.5">{item.label}</div>
                <div className={`text-sm ${item.highlight ? 'font-bold text-hm-danger' : 'font-semibold text-hm-text'}`}>{item.value}</div>
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
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setShowNewForm(false)} className="w-10 h-10 rounded-[10px] border border-hm-input-border bg-white cursor-pointer text-lg flex items-center justify-center font-[inherit] shrink-0 hover:bg-hm-bg-hover transition-colors">‹</button>
          <h1 className="text-lg font-bold text-hm-text">새 AS 접수</h1>
        </div>

        <Card className="mb-4">
          {/* Building */}
          <div className="mb-3.5">
            <div className="text-xs font-bold text-hm-text-sub mb-1">건물 *</div>
            <select value={newBuilding} onChange={e => setNewBuilding(e.target.value)}
              className={inputClassName}>
              <option value="">선택하세요</option>
              {buildingNames.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Room */}
          <div className="mb-3.5">
            <div className="text-xs font-bold text-hm-text-sub mb-1">호실</div>
            <input value={newRoom} onChange={e => setNewRoom(e.target.value)} placeholder="예: 301"
              className={inputClassName} />
          </div>

          {/* Description */}
          <div className="mb-3.5">
            <div className="text-xs font-bold text-hm-text-sub mb-1">설명 *</div>
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="AS 내용을 입력하세요 (첫 줄이 제목으로 사용됩니다)" rows={4}
              className={`${inputClassName} resize-y min-h-[80px]`} />
          </div>

          {/* Photos */}
          <div className="mb-3.5">
            <div className="text-xs font-bold text-hm-text-sub mb-1">사진</div>
            <PhotoDropZone photos={newPhotos} maxPhotos={10} label="접수 사진" color="var(--color-hm-blue)"
              onAdd={(dataUrls: string[]) => setNewPhotos(prev => [...prev, ...dataUrls].slice(0, 10))}
              onRemove={(pi: number) => setNewPhotos(prev => prev.filter((_, i) => i !== pi))} />
          </div>

          {/* Priority */}
          <div className="mb-3.5">
            <div className="text-xs font-bold text-hm-text-sub mb-1">긴급도</div>
            <div className="flex gap-2">
              {["일반", "긴급"].map(p => (
                <button key={p} onClick={() => setNewPriority(p)}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm cursor-pointer font-[inherit] transition-all ${newPriority === p ? (p === "긴급" ? 'border-2 border-hm-danger bg-hm-danger-bg text-hm-danger' : 'border-2 border-hm-blue bg-hm-blue-bg text-hm-blue-dark') : 'border-[1.5px] border-hm-input-border bg-white text-hm-text-sub hover:bg-hm-bg-hover'}`}>
                  {p === "긴급" ? "🚨 " : ""}{p}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div className="mb-3.5">
            <div className="text-xs font-bold text-hm-text-sub mb-1">접수 경로</div>
            <select value={newSource} onChange={e => setNewSource(e.target.value)}
              className={inputClassName}>
              <option value="사무실접수">사무실접수</option>
              <option value="임차인접수">임차인접수</option>
              <option value="순회발견">순회발견</option>
            </select>
          </div>

          {/* Assignee */}
          <div className="mb-3.5">
            <div className="text-xs font-bold text-hm-text-sub mb-1">담당자</div>
            <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)}
              className={inputClassName}>
              <option value="">선택하세요</option>
              {allStaff.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Submit */}
          <div className="flex gap-2">
            <button onClick={() => setShowNewForm(false)}
              className="flex-1 py-3.5 rounded-[10px] border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
              취소
            </button>
            <button onClick={handleSubmitAS} disabled={!newBuilding || !newDesc.trim()}
              className={`flex-[2] py-3.5 rounded-[10px] border-none text-white font-bold text-sm font-[inherit] transition-opacity ${newBuilding && newDesc.trim() ? 'bg-hm-blue cursor-pointer hover:opacity-90' : 'bg-gray-300 cursor-default'}`}>
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
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setShowVendorMgmt(false)} className="w-10 h-10 rounded-[10px] border border-hm-input-border bg-white cursor-pointer text-lg flex items-center justify-center font-[inherit] shrink-0 hover:bg-hm-bg-hover transition-colors">‹</button>
          <h1 className="text-lg font-bold text-hm-text">🏪 협력업체 관리</h1>
        </div>

        {/* Add/Edit Vendor Form */}
        <Card className="mb-4">
          <div className="text-xs font-bold text-hm-blue tracking-wider mb-2.5">
            {editingVendorIdx !== null ? "✏️ 업체 수정" : "➕ 업체 추가"}
          </div>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2.5 mb-3`}>
            <div>
              <div className="text-xs font-bold text-hm-text-sub mb-1">업체명 *</div>
              <input value={vendorForm.name} onChange={e => setVendorForm(p => ({ ...p, name: e.target.value }))} placeholder="업체명"
                className={inputClassName} />
            </div>
            <div>
              <div className="text-xs font-bold text-hm-text-sub mb-1">연락처</div>
              <input value={vendorForm.phone} onChange={e => setVendorForm(p => ({ ...p, phone: e.target.value }))} placeholder="010-0000-0000"
                className={inputClassName} />
            </div>
            <div>
              <div className="text-xs font-bold text-hm-text-sub mb-1">전문분야</div>
              <input value={vendorForm.specialty} onChange={e => setVendorForm(p => ({ ...p, specialty: e.target.value }))} placeholder="예: 보일러, 전기, 배관"
                className={inputClassName} />
            </div>
            <div>
              <div className="text-xs font-bold text-hm-text-sub mb-1">비고</div>
              <input value={vendorForm.note} onChange={e => setVendorForm(p => ({ ...p, note: e.target.value }))} placeholder="메모"
                className={inputClassName} />
            </div>
          </div>
          <div className="flex gap-2">
            {editingVendorIdx !== null && (
              <button onClick={() => { setEditingVendorIdx(null); setVendorForm({ name: "", phone: "", specialty: "", note: "" }); }}
                className="px-5 py-2.5 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
                취소
              </button>
            )}
            <button onClick={handleSaveVendor} disabled={!vendorForm.name.trim()}
              className={`px-5 py-2.5 rounded-lg border-none text-white font-bold text-xs font-[inherit] transition-opacity ${vendorForm.name.trim() ? 'bg-hm-blue cursor-pointer hover:opacity-90' : 'bg-gray-300 cursor-default'}`}>
              {editingVendorIdx !== null ? "수정" : "추가"}
            </button>
          </div>
        </Card>

        {/* Vendor List */}
        <Card>
          <div className="text-xs font-bold text-hm-blue tracking-wider mb-2.5">📋 등록된 업체 ({vendors.length})</div>
          {vendors.length === 0 ? (
            <div className="text-center py-[30px] text-[#B0B5C1] text-sm">등록된 협력업체가 없습니다</div>
          ) : (
            <div className="flex flex-col gap-2">
              {vendors.map((v, i) => (
                <div key={i} className="flex items-center justify-between px-3.5 py-3 bg-hm-bg-hover rounded-[10px] border border-hm-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-hm-text">{v.name}</span>
                      {v.specialty && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-hm-blue-bg text-hm-blue-dark">{v.specialty}</span>}
                    </div>
                    <div className="text-xs text-hm-text-muted">
                      {v.phone && <span>📞 {v.phone}</span>}
                      {v.note && <span className="ml-2">· {v.note}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingVendorIdx(i); setVendorForm({ ...v }); }}
                      className="px-2.5 py-1.5 rounded-md border border-hm-input-border bg-white text-xs font-semibold cursor-pointer font-[inherit] text-hm-blue hover:bg-hm-bg-hover transition-colors">
                      수정
                    </button>
                    <button onClick={() => { if (confirm("삭제하시겠습니까?")) setVendors(prev => prev.filter((_, idx) => idx !== i)); }}
                      className="px-2.5 py-1.5 rounded-md border border-hm-danger-border bg-hm-danger-bg text-xs font-semibold cursor-pointer font-[inherit] text-hm-danger hover:opacity-80 transition-opacity">
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
      <div className={`flex gap-2 ${isMobile ? 'mb-2.5' : 'mb-4'} flex-wrap`}>
        <button onClick={() => setShowNewForm(true)}
          className="px-5 py-2.5 rounded-[10px] border-none bg-hm-blue text-white font-bold text-sm cursor-pointer font-[inherit] flex items-center gap-1.5 shadow-[0_2px_8px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.4)] transition-shadow">
          ➕ 새 AS 접수
        </button>
        <button onClick={() => setShowVendorMgmt(true)}
          className="px-5 py-2.5 rounded-[10px] border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] flex items-center gap-1.5 hover:bg-hm-bg-hover transition-colors">
          🏪 협력업체 관리
          {vendors.length > 0 && <span className="bg-hm-blue-bg text-hm-blue px-[7px] py-[1px] rounded-[10px] text-xs font-bold">{vendors.length}</span>}
        </button>
      </div>

      {/* Status Cards */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-1.5' : 'grid-cols-4 gap-3'} ${isMobile ? 'mb-2.5' : 'mb-5'}`}>
        {[
          { label: "대기", count: allAsItems.filter(a => a.status === "대기").length, color: "#4F46E5", bg: "#F0F4FF" },
          { label: "진행중", count: allAsItems.filter(a => a.status === "진행중").length, color: "var(--color-hm-warning)", bg: "var(--color-hm-warning-bg)" },
          { label: "완료", count: allAsItems.filter(a => a.status === "완료").length, color: "var(--color-hm-success)", bg: "var(--color-hm-success-bg)" },
          { label: "유상", count: paidCount, sub: `${fmt(paidCost)}원`, color: "var(--color-hm-danger)", bg: "var(--color-hm-danger-bg)" },
        ].map((s, i) => (
          <Card key={i} onClick={() => setTab(s.label === "유상" ? "전체" : s.label)}
            className={`text-center flex flex-col justify-center items-center cursor-pointer transition-all hover:shadow-md ${isMobile ? 'px-2.5 py-2' : ''}`}
            style={{ background: tab === s.label ? s.bg : "#fff", border: tab === s.label ? `2px solid ${s.color}` : "1px solid var(--color-hm-border)" }}>
            <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-hm-text-muted font-semibold mb-1`}>{s.label}</div>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: s.color }}>{s.count}</div>
            {s.sub && <div className={`${isMobile ? 'text-xs' : 'text-xs'} font-semibold mt-0.5`} style={{ color: s.color }}>{s.sub}</div>}
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-2 overflow-x-auto pb-0.5" style={{ WebkitOverflowScrolling: "touch" }}>
        {assigneesAS.map(a => (
          <button key={a} onClick={() => setFilterAssigneeAS(a)}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer font-[inherit] transition-all ${filterAssigneeAS === a ? 'border-2 border-[#10B981] bg-[#10B981] text-white' : 'border-[1.5px] border-hm-input-border bg-white text-hm-text-sub hover:bg-hm-bg-hover'}`}>
            {a} {a !== "전체" && <span className="text-xs opacity-70">({myAS.filter(item => item.assignee === a).length})</span>}
          </button>
        ))}
      </div>
      <div className={`flex gap-1 ${isMobile ? 'mb-2' : 'mb-3'} overflow-x-auto pb-0.5`} style={{ WebkitOverflowScrolling: "touch" }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setTab(s)}
            className={`shrink-0 px-3 py-1.5 rounded-[7px] font-semibold text-xs cursor-pointer font-[inherit] transition-all ${tab === s ? 'border-2 border-hm-blue bg-hm-blue-bg text-hm-blue-dark' : 'border border-hm-input-border bg-white text-hm-text-sub hover:bg-hm-bg-hover'}`}>
            {s}
          </button>
        ))}
        <span className="shrink-0 text-xs text-hm-text-muted px-2 py-1.5">비용 {fmt(totalCost)}원</span>
      </div>

      {/* Mobile: Card List / Desktop: Table */}
      {isMobile ? (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-[#B0B5C1] text-sm">해당 조건의 AS 내역이 없습니다</div>
          )}
          {filtered.map((a, i) => (
            <Card key={a.id || i} onClick={() => setSelectedAS(a)} className="cursor-pointer px-3.5 py-3 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={a.status} />
                  <span className="text-sm font-bold text-hm-text">{a.content || a.title}</span>
                </div>
                <span className="text-xs text-[#B0B5C1] shrink-0">{a.date}</span>
              </div>
              <div className="text-xs text-hm-text-sub mb-2">
                {a.building} {a.room}호 · {a.category || "기타"}
              </div>
              <div className="flex gap-1.5 flex-wrap items-center">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${a.paid === "유상" ? 'bg-hm-danger-bg text-hm-danger' : 'bg-hm-success-bg text-hm-success'}`}>{a.paid}</span>
                {a.cost > 0 && <span className="text-xs font-bold text-hm-danger">{fmt(a.cost)}원</span>}
                {(a.priority === "높음" || a.priority === "긴급") && <span className="text-xs px-2 py-0.5 rounded bg-hm-danger-bg text-hm-danger font-semibold">{a.priority}</span>}
                {a.ownerApproval && <ApprovalBadge status={a.ownerApproval} />}
                <span className="text-xs text-hm-text-muted ml-auto">{a.assignee} · {(a.steps || []).length}단계</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table
            columns={[
              { label: "접수일", key: "date" },
              { label: "건물", render: (r: ASItemRecord) => `${r.building} ${r.room}호` },
              { label: "분류", render: (r: ASItemRecord) => <span className="text-xs px-2 py-0.5 rounded bg-hm-bg font-semibold">{r.category || "기타"}</span> },
              { label: "내용", render: (r: ASItemRecord) => r.content || r.title },
              { label: "유/무상", render: (r: ASItemRecord) => <span className={`text-xs font-bold px-2 py-0.5 rounded ${r.paid === "유상" ? 'bg-hm-danger-bg text-hm-danger' : 'bg-hm-success-bg text-hm-success'}`}>{r.paid}</span> },
              { label: "비용", align: "right" as const, render: (r: ASItemRecord) => r.cost > 0 ? <span className="font-bold">{fmt(r.cost)}원</span> : <span className="text-gray-300">—</span> },
              { label: "긴급도", render: (r: ASItemRecord) => (r.priority === "높음" || r.priority === "긴급") ? <StatusBadge status={r.priority} /> : null },
              { label: "담당", key: "assignee" },
              { label: "승인", render: (r: ASItemRecord) => <ApprovalBadge status={r.ownerApproval} /> },
              { label: "진행", render: (r: ASItemRecord) => <span className="text-xs text-hm-text-muted">{(r.steps || []).length}단계</span> },
              { label: "상태", render: (r: ASItemRecord) => <StatusBadge status={r.status} /> },
            ]}
            data={filtered}
            onRowClick={(row: ASItemRecord) => setSelectedAS(row)}
          />
          <div className="mt-2.5 text-xs text-[#B0B5C1] text-center">행을 클릭하면 상세 화면으로 이동합니다</div>
        </Card>
      )}

      {/* Mobile FAB - New AS */}
      {isMobile && (
        <button onClick={() => setShowNewForm(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-hm-blue text-white border-none text-2xl font-bold cursor-pointer shadow-[0_4px_14px_rgba(59,130,246,0.4)] flex items-center justify-center z-[100] hover:shadow-[0_6px_20px_rgba(59,130,246,0.5)] transition-shadow">+</button>
      )}
    </div>
  );
};
