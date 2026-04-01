import { useState, useMemo } from 'react';
import { buildings, asItems as staticAsItems, ownerBuildings, recentTx } from '@/data';
import { patrolBuildings, patrolRecords } from '@/data/patrolData';
import { useIsMobile, fmt } from '@/utils';
import { useLocalStorage } from '@/utils/useLocalStorage';
import { Card, SectionTitle, Table, StatusBadge } from '@/components';
interface OwnerDashboardProps {
  activeTenants?: Record<string, any>[];
  activeVacancies?: Record<string, any>[];
  isLoading?: boolean;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ activeTenants = [], activeVacancies = [] }) => {
  const isMobile = useIsMobile();
  const myBuildings = ownerBuildings["owner"] || [];
  const myBldgData = buildings.filter(b => myBuildings.includes(b.name));
  const [savedPatrolRecords] = useLocalStorage<Record<string, any>[]>("hm_patrolRecords", []);
  const allPatrolRecords = useMemo(() => [...patrolRecords, ...(savedPatrolRecords as any[])].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [savedPatrolRecords]);
  const [localAsItems, setLocalAsItems] = useLocalStorage<Record<string, any>[]>("hm_asItems", []);
  const allAsItems: Record<string, any>[] = useMemo(() => [...(staticAsItems as any[]), ...localAsItems], [localAsItems]);
  const myTenants = activeTenants.filter(t => myBuildings.includes(t.building));
  const myOverdue = myTenants.filter(t => t.overdue > 0);
  const myTotalOverdue = myOverdue.reduce((s, t) => s + t.overdue, 0);
  const myVacancies = activeVacancies.filter(v => myBuildings.includes(v.building));
  const myAS = allAsItems.filter(a => myBuildings.includes(a.building));
  const myTx = recentTx.filter(t => myBuildings.includes(t.building));
  const totalRooms = myBldgData.reduce((s, b) => s + b.rooms, 0);
  const totalOccupied = myBldgData.reduce((s, b) => s + b.occupied, 0);
  const occupancyRate = totalRooms > 0 ? ((totalOccupied / totalRooms) * 100).toFixed(0) : 0;

  const [selectedBldg, setSelectedBldg] = useState(myBuildings[0] || "");
  const [expandedPatrol, setExpandedPatrol] = useState<number | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // Pending approvals across all buildings
  const pendingApprovals = myAS.filter(a => a.ownerApproval === "pending");

  // Handle owner approval/rejection
  const handleApproval = (asId: number, decision: string) => {
    setLocalAsItems(prev => prev.map(item => {
      if (item.id !== asId) return item;
      const actionLabel = decision === "approved" ? "건물주승인" : "건물주반려";
      const noteText = decision === "approved" ? "건물주가 승인했습니다" : "건물주가 반려했습니다";
      return {
        ...item,
        ownerApproval: decision,
        steps: [...(item.steps || []), { date: today, action: actionLabel, note: noteText }],
        actions: [...(item.actions || []), { step: actionLabel, date: today, by: "건물주" }],
      };
    }));
  };

  // AS cost breakdown for selected building
  const asCostPaid = myAS.filter(a => a.building === selectedBldg && a.paid === "유상").reduce((s, a) => s + (a.cost || 0), 0);
  const asCostFree = myAS.filter(a => a.building === selectedBldg && a.paid === "무상" && (a.cost || 0) > 0).reduce((s, a) => s + (a.cost || 0), 0);
  const asTotalCost = myAS.filter(a => a.building === selectedBldg).reduce((s, a) => s + (a.cost || 0), 0);

  const filteredTenants = myTenants.filter(t => t.building === selectedBldg);
  const filteredOverdue = myOverdue.filter(t => t.building === selectedBldg);
  const filteredVacancies = myVacancies.filter(v => v.building === selectedBldg);
  const filteredAS = myAS.filter(a => a.building === selectedBldg);
  const filteredTx = myTx.filter(t => t.building === selectedBldg);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-2xl">🏠</span>
          <h1 className="text-xl font-bold text-hm-text">건물주 포털</h1>
        </div>
        <p className="text-sm text-hm-text-muted">내 건물 현황을 한눈에 확인하세요 · {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Building Selector */}
      <div className="flex gap-2 mb-5">
        {myBuildings.map(name => {
          const bldg = buildings.find(b => b.name === name);
          const active = selectedBldg === name;
          const vc = activeVacancies.filter(v => v.building === name).length;
          return (
            <div key={name} onClick={() => setSelectedBldg(name)}
              className={`flex-1 p-4 rounded-[14px] cursor-pointer transition-all ${active ? 'bg-[#1B1F2E] border-2 border-[#1B1F2E] shadow-[0_4px_12px_rgba(27,31,46,0.15)]' : 'bg-white border-[1.5px] border-hm-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md'}`}>
              <div className={`text-base font-bold mb-2 ${active ? 'text-white' : 'text-hm-text'}`}>{name}</div>
              <div className="flex gap-3">
                <div>
                  <div className={`text-xs ${active ? 'text-[#9CA3B0]' : 'text-hm-text-muted'}`}>입주율</div>
                  <div className={`text-base font-bold ${active ? 'text-[#10B981]' : 'text-hm-success'}`}>{bldg ? ((bldg.occupied / bldg.rooms) * 100).toFixed(0) : 0}%</div>
                </div>
                <div>
                  <div className={`text-xs ${active ? 'text-[#9CA3B0]' : 'text-hm-text-muted'}`}>공실</div>
                  <div className={`text-base font-bold ${active ? 'text-[#F59E0B]' : 'text-[#D97706]'}`}>{vc}</div>
                </div>
                <div>
                  <div className={`text-xs ${active ? 'text-[#9CA3B0]' : 'text-hm-text-muted'}`}>호실</div>
                  <div className={`text-base font-bold ${active ? 'text-white' : 'text-hm-text'}`}>{bldg ? bldg.rooms : 0}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Row */}
      <div className={`grid gap-2.5 mb-5 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {[
          { label: "입주", value: filteredTenants.length, unit: "세대", color: "text-[#10B981]", bg: "bg-hm-success-bg" },
          { label: "공실", value: filteredVacancies.length, unit: "실", color: "text-[#F59E0B]", bg: "bg-[#FFFBEB]" },
          { label: "연체", value: filteredOverdue.length, unit: "건", color: "text-[#EF4444]", bg: "bg-hm-danger-bg" },
          { label: "AS", value: filteredAS.filter(a => a.status !== "완료").length, unit: "건", color: "text-[#6366F1]", bg: "bg-[#F0F4FF]" },
        ].map((s, i) => (
          <Card key={i}>
            <div className="text-xs text-hm-text-muted font-semibold mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}<span className="text-xs font-medium text-[#B0B5C1]"> {s.unit}</span></div>
          </Card>
        ))}
      </div>

      {/* Pending Approvals (across all buildings) */}
      {pendingApprovals.length > 0 && (
        <Card className="mb-4 border-2 border-[#FDE68A] bg-[#FFFDF5]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-[#D97706] tracking-wider">📩 승인 대기 AS ({pendingApprovals.length}건)</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {pendingApprovals.map((a, i) => (
              <div key={a.id || i} className="px-4 py-3.5 rounded-xl bg-white border border-[#FDE68A]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-hm-text">{a.building} {a.room}호</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <span className="text-xs text-[#B0B5C1]">{a.date}</span>
                </div>
                <div className="text-sm font-semibold text-hm-text mb-1">{a.content || a.title}</div>
                <div className="text-xs text-hm-text-sub mb-2 leading-relaxed">{a.detail || a.desc}</div>
                <div className="flex gap-2 mb-2.5 flex-wrap">
                  {(a.estimatedCost || 0) > 0 && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-hm-danger-bg text-hm-danger">
                      예상비용 {fmt(a.estimatedCost)}원
                    </span>
                  )}
                  {a.vendor && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#F3F4F6] text-hm-text-sub">
                      업체: {a.vendor}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproval(a.id, "approved")}
                    className="flex-1 py-2.5 rounded-lg border-none bg-hm-success text-white font-bold text-xs cursor-pointer font-[inherit] hover:opacity-90 active:scale-[0.98] transition-all">
                    ✅ 승인
                  </button>
                  <button onClick={() => handleApproval(a.id, "rejected")}
                    className="flex-1 py-2.5 rounded-lg border-[1.5px] border-hm-danger-border bg-hm-danger-bg text-hm-danger font-bold text-xs cursor-pointer font-[inherit] hover:bg-[#FEE2E2] active:scale-[0.98] transition-all">
                    ❌ 반려
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Overdue */}
      {filteredOverdue.length > 0 && (
        <Card className="mb-4 border-[1.5px] border-hm-danger-border">
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-xs font-bold text-hm-danger tracking-wider">🚨 연체 현황</div>
            <span className="text-sm font-bold text-hm-danger">{fmt(filteredOverdue.reduce((s, t) => s + t.overdue, 0))}원</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {filteredOverdue.sort((a, b) => b.overdue - a.overdue).map((t, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-hm-danger-bg rounded-lg">
                <div>
                  <span className="font-bold text-sm">{t.room}호</span>
                  <span className="text-xs text-hm-text-muted ml-2">{t.name}</span>
                </div>
                <span className="font-bold text-sm text-hm-danger">{fmt(t.overdue)}원</span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 text-xs text-hm-text-muted text-center">관리팀에서 독촉 진행 중입니다</div>
        </Card>
      )}

      {/* Vacancy */}
      {filteredVacancies.length > 0 && (
        <Card className="mb-4">
          <div className="text-xs font-bold text-[#D97706] tracking-wider mb-2.5">📭 공실 현황</div>
          <div className="flex flex-col gap-2">
            {filteredVacancies.map((v, i) => (
              <div key={i} className="flex items-center justify-between px-3.5 py-3 bg-[#FFFBEB] rounded-[10px] border border-[#FDE68A]">
                <div>
                  <span className="text-sm font-bold text-hm-text">{v.room}호</span>
                  <span className="text-xs font-semibold ml-2 px-1.5 py-0.5 rounded bg-white border border-hm-input-border">{v.type}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold">{v.deposit > 0 ? `${fmt(v.deposit)}/${fmt(v.rent)}만` : "—"}</div>
                  <div className={`text-xs ${v.days > 30 ? 'text-hm-danger font-bold' : 'text-hm-text-muted font-normal'}`}>{v.days > 0 ? `공실 ${v.days}일` : "신규"}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AS 현황 */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-[#6366F1] tracking-wider">🔧 AS 현황 · {selectedBldg}</div>
          {asTotalCost > 0 && (
            <span className="text-xs font-bold text-hm-text">총 {fmt(asTotalCost)}원</span>
          )}
        </div>
        {/* Cost breakdown */}
        {asTotalCost > 0 && (
          <div className="flex gap-2.5 mb-3.5">
            <div className="flex-1 px-3.5 py-2.5 rounded-lg bg-hm-danger-bg text-center border border-hm-danger-border">
              <div className="text-xs text-hm-text-muted mb-0.5">유상 (세입자부담)</div>
              <div className="text-sm font-bold text-hm-danger">{fmt(asCostPaid)}원</div>
              <div className="text-xs text-hm-danger">{filteredAS.filter(a => a.paid === "유상").length}건</div>
            </div>
            <div className="flex-1 px-3.5 py-2.5 rounded-lg bg-hm-success-bg text-center border border-hm-success-border">
              <div className="text-xs text-hm-text-muted mb-0.5">무상 (건물주부담)</div>
              <div className="text-sm font-bold text-hm-success">{fmt(asCostFree)}원</div>
              <div className="text-xs text-hm-success">{filteredAS.filter(a => a.paid === "무상" && (a.cost || 0) > 0).length}건</div>
            </div>
          </div>
        )}
      </Card>

      {/* AS History */}
      {filteredAS.length > 0 && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-hm-warning tracking-wider">🔧 AS 이력</div>
            <button onClick={() => window.print()} className="text-xs font-semibold px-3 py-1.5 rounded-md border border-hm-input-border bg-white cursor-pointer font-[inherit] flex items-center gap-1 hover:bg-hm-bg-hover transition-colors">
              💾 저장/출력
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {filteredAS.map((a, i) => (
              <div key={i} className={`p-4 rounded-xl ${a.status === "완료" ? 'bg-hm-bg-hover border border-hm-border' : a.status === "진행중" ? 'bg-hm-warning-bg border border-hm-warning-border' : 'bg-[#F0F4FF] border border-[#C7D2FE]'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-hm-text">{a.room}호</span>
                    <StatusBadge status={a.status} />
                    <StatusBadge status={a.priority} />
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-[5px] ${a.paid === "유상" ? 'bg-hm-danger-bg text-hm-danger' : 'bg-hm-success-bg text-hm-success'}`}>
                    {a.paid}{a.cost > 0 ? ` ${fmt(a.cost)}원` : ""}
                  </span>
                </div>
                {/* Approval badge */}
                {a.ownerApproval && (
                  <div className="mb-1.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${a.ownerApproval === "pending" ? 'bg-[#FFFBEB] text-[#D97706]' : a.ownerApproval === "approved" ? 'bg-hm-success-bg text-hm-success' : 'bg-hm-danger-bg text-hm-danger'}`}>
                      {a.ownerApproval === "pending" ? "승인대기" : a.ownerApproval === "approved" ? "승인완료" : "반려"}
                    </span>
                  </div>
                )}
                {/* Content */}
                <div className="text-sm font-bold text-hm-text mb-1">{a.content || a.title}</div>
                <div className="text-xs text-hm-text-sub leading-relaxed mb-2.5">{a.detail || a.desc}</div>
                {/* Timeline */}
                {a.steps && a.steps.length > 0 && (
                  <div className="p-3 bg-white rounded-[10px] border border-hm-border">
                    <div className="text-xs font-bold text-hm-text-muted mb-2">처리 과정</div>
                    {a.steps.map((step: Record<string, any>, si: number) => (
                      <div key={si} className={`flex gap-2.5 ${si < a.steps.length - 1 ? 'mb-2 pb-2 border-b border-[#F0F2F5]' : ''}`}>
                        <div className={`w-2 h-2 rounded-full mt-[5px] shrink-0 ${si === a.steps.length - 1 ? 'bg-hm-blue' : 'bg-[#D1D5DB]'}`} />
                        <div className="flex-1">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-xs font-bold text-hm-text">{step.action}</span>
                            <span className="text-xs text-[#B0B5C1]">{step.date}</span>
                          </div>
                          <div className="text-[11.5px] text-hm-text-sub leading-relaxed">{step.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Photos */}
                {(a.photoBefore || a.photoAfter) && (
                  <div className="flex gap-2 mt-2.5">
                    {a.photoBefore && <span className="text-xs px-2 py-0.5 rounded-[5px] bg-hm-danger-bg text-hm-danger">📷 수리 전</span>}
                    {a.photoAfter && <span className="text-xs px-2 py-0.5 rounded-[5px] bg-hm-success-bg text-hm-success">📷 수리 후</span>}
                  </div>
                )}
                <div className="text-xs text-[#B0B5C1] mt-2">접수일 {a.date} · 담당 {a.assignee} · {a.category || "기타"}{a.vendor ? ` · ${a.vendor}` : ""}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 최근 순회 요약 (모든 건물) */}
      <Card className="mb-4">
        <div className="text-xs font-bold text-[#7C3AED] tracking-wider mb-2.5">🚶 최근 순회</div>
        <div className="flex flex-col gap-1.5">
          {myBuildings.map(bName => {
            const latestRec = allPatrolRecords.find(r => r.building === bName);
            const bldgP = patrolBuildings.find(p => p.building === bName);
            if (!latestRec && !bldgP) return null;
            return (
              <div key={bName} onClick={() => setSelectedBldg(bName)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors ${latestRec?.status === "이상발견" ? 'bg-hm-danger-bg border border-hm-danger-border hover:bg-[#FEE2E2]' : 'bg-hm-bg-slate border border-hm-border hover:bg-[#F0F2F5]'}`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-hm-text">{bName}</span>
                  {latestRec && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${latestRec.status === "이상발견" ? 'bg-[#FEE2E2] text-hm-danger' : 'bg-[#D1FAE5] text-hm-success'}`}>
                      {latestRec.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-hm-text-muted">{latestRec ? latestRec.date.slice(5) : "미순회"}</span>
                  <span className="text-[#B0B5C1]">›</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Patrol Report */}
      {(() => {
        const bldgPatrol = patrolBuildings.find(p => p.building === selectedBldg);
        const bldgRecords = allPatrolRecords.filter(r => r.building === selectedBldg);
        if (!bldgPatrol && bldgRecords.length === 0) return null;
        const interval = bldgPatrol ? Math.floor(28 / bldgPatrol.freq) : 14;
        return (
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-[#7C3AED] tracking-wider">🚶 순회 관리 리포트</div>
              {bldgPatrol && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-hm-text-muted">월 {bldgPatrol.freq}회 · {interval}일 주기</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${bldgPatrol.doneCount >= bldgPatrol.freq ? 'bg-[#D1FAE5] text-hm-success' : 'bg-[#FEF3C7] text-[#D97706]'}`}>
                    {bldgPatrol.doneCount}/{bldgPatrol.freq}회 완료
                  </span>
                </div>
              )}
            </div>
            {bldgPatrol && (
              <div className="flex gap-2.5 mb-3.5">
                <div className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#F5F3FF] text-center border border-[#DDD6FE]">
                  <div className="text-xs text-hm-text-muted mb-0.5">담당자</div>
                  <div className="text-sm font-bold text-[#7C3AED]">{bldgPatrol.assignee}</div>
                </div>
                <div className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#F5F3FF] text-center border border-[#DDD6FE]">
                  <div className="text-xs text-hm-text-muted mb-0.5">마지막 순회</div>
                  <div className="text-sm font-bold text-hm-text">{bldgPatrol.lastDate ? bldgPatrol.lastDate.slice(5) : "—"}</div>
                </div>
                <div className={`flex-1 px-3.5 py-2.5 rounded-lg text-center ${bldgPatrol.lastStatus === "이상발견" ? 'bg-hm-danger-bg border border-hm-danger-border' : 'bg-[#F0FDF4] border border-[#BBF7D0]'}`}>
                  <div className="text-xs text-hm-text-muted mb-0.5">최근 상태</div>
                  <div className={`text-sm font-bold ${bldgPatrol.lastStatus === "이상발견" ? 'text-hm-danger' : 'text-hm-success'}`}>{bldgPatrol.lastStatus || "—"}</div>
                </div>
              </div>
            )}
            {bldgRecords.length > 0 ? (
              <div className="max-h-[280px] overflow-y-auto border border-hm-border rounded-[10px]">
                {bldgRecords.map((rec, i) => (
                  <div key={i} onClick={() => setExpandedPatrol(expandedPatrol === i ? null : i)}
                    className={`px-3.5 py-2.5 cursor-pointer transition-colors ${i < bldgRecords.length - 1 ? 'border-b border-[#F0F2F5]' : ''} ${rec.status === "이상발견" ? 'bg-hm-danger-bg hover:bg-[#FEE2E2]' : 'bg-white hover:bg-hm-bg-hover'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-hm-text">{rec.date}</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${rec.status === "이상발견" ? 'bg-[#FEE2E2] text-hm-danger' : 'bg-[#D1FAE5] text-hm-success'}`}>{rec.status}</span>
                        <span className="text-xs text-hm-text-muted">{rec.assignee}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-hm-text-muted">📸 {rec.photos.length}</span>
                        <span className="text-xs text-[#B0B5C1] transition-transform duration-150" style={{ transform: expandedPatrol === i ? "rotate(90deg)" : "rotate(0)" }}>›</span>
                      </div>
                    </div>
                    {expandedPatrol !== i && <div className="text-xs text-hm-text-muted mt-1 overflow-hidden text-ellipsis whitespace-nowrap">{rec.comment}</div>}
                    {expandedPatrol === i && (
                      <div className="mt-2 px-3 py-2.5 bg-hm-bg-slate rounded-lg border border-hm-border">
                        {rec.checklist && rec.checklist.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs font-bold text-hm-blue mb-1">시설 점검 결과</div>
                            <div className="flex flex-wrap gap-1">
                              {rec.checklist.map((c: Record<string, any>, ci: number) => (
                                <span key={ci} className={`text-xs px-2 py-0.5 rounded font-semibold ${c.status === "이상" ? 'bg-[#FEE2E2] text-hm-danger' : 'bg-[#D1FAE5] text-hm-success'}`}>
                                  {c.status === "정상" ? "✅" : "⚠"} {c.item}{c.comment ? `: ${c.comment}` : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-hm-text leading-[1.8] mb-2">{rec.comment}</div>
                        <div className="flex gap-1.5 flex-wrap">
                          {rec.photos.map((p: string, pi: number) => (
                            <div key={pi} className="w-12 h-12 rounded-md bg-hm-border flex items-center justify-center text-xs text-hm-text-muted">📷</div>
                          ))}
                        </div>
                        {rec.photos.length > 0 && <div className="text-xs text-hm-text-muted mt-1.5">사진 {rec.photos.length}장</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-5 text-center text-hm-text-muted text-xs">이번 달 순회 기록이 아직 없습니다</div>
            )}
          </Card>
        );
      })()}

      {/* Recent Transactions */}
      {filteredTx.length > 0 && (
        <Card className="mb-4">
          <div className="text-xs font-bold text-hm-success tracking-wider mb-2.5">💰 최근 입출금</div>
          <div className="flex flex-col gap-1">
            {filteredTx.map((tx, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-hm-bg-hover">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tx.type === "입금" ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                  <div>
                    <div className="text-xs text-[#3D4251]">{tx.room ? `${tx.room}호` : ""} {tx.cat}</div>
                    <div className="text-xs text-[#B0B5C1]">{tx.date}</div>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.type === "입금" ? 'text-hm-success' : 'text-hm-danger'}`}>{tx.type === "지출" ? "-" : "+"}{fmt(tx.amount)}원</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      {/* Footer */}
      <div className="mt-6 p-4 text-center rounded-[10px] bg-hm-bg-hover border border-hm-border">
        <div className="text-xs text-hm-text-muted">문의사항은 관리팀으로 연락해주세요</div>
        <div className="text-sm font-bold text-hm-text mt-1">📞 02-1234-5678 · 하우스맨 관리팀</div>
      </div>
    </div>
  );
};
