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
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 24 }}>🏠</span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A1D23" }}>건물주 포털</h1>
        </div>
        <p style={{ fontSize: 13, color: "#8F95A3" }}>내 건물 현황을 한눈에 확인하세요 · {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Building Selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {myBuildings.map(name => {
          const bldg = buildings.find(b => b.name === name);
          const active = selectedBldg === name;
          const vc = activeVacancies.filter(v => v.building === name).length;
          return (
            <div key={name} onClick={() => setSelectedBldg(name)}
              style={{
                flex: 1, padding: "16px", borderRadius: 14, cursor: "pointer", transition: "all 0.2s",
                background: active ? "#1B1F2E" : "#fff",
                border: active ? "2px solid #1B1F2E" : "1.5px solid #E8ECF0",
                boxShadow: active ? "0 4px 12px rgba(27,31,46,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: active ? "#fff" : "#1A1D23", marginBottom: 8 }}>{name}</div>
              <div style={{ display: "flex", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: active ? "#9CA3B0" : "#8F95A3" }}>입주율</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: active ? "#10B981" : "#059669" }}>{bldg ? ((bldg.occupied / bldg.rooms) * 100).toFixed(0) : 0}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: active ? "#9CA3B0" : "#8F95A3" }}>공실</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: active ? "#F59E0B" : "#D97706" }}>{vc}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: active ? "#9CA3B0" : "#8F95A3" }}>호실</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: active ? "#fff" : "#1A1D23" }}>{bldg ? bldg.rooms : 0}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "입주", value: filteredTenants.length, unit: "세대", color: "#10B981", bg: "#ECFDF5" },
          { label: "공실", value: filteredVacancies.length, unit: "실", color: "#F59E0B", bg: "#FFFBEB" },
          { label: "연체", value: filteredOverdue.length, unit: "건", color: "#EF4444", bg: "#FEF2F2" },
          { label: "AS", value: filteredAS.filter(a => a.status !== "완료").length, unit: "건", color: "#6366F1", bg: "#F0F4FF" },
        ].map((s, i) => (
          <Card key={i}>
            <div style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}<span style={{ fontSize: 11, fontWeight: 500, color: "#B0B5C1" }}> {s.unit}</span></div>
          </Card>
        ))}
      </div>

      {/* Pending Approvals (across all buildings) */}
      {pendingApprovals.length > 0 && (
        <Card style={{ marginBottom: 16, border: "2px solid #FDE68A", background: "#FFFDF5" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#D97706", letterSpacing: "0.05em" }}>📩 승인 대기 AS ({pendingApprovals.length}건)</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingApprovals.map((a, i) => (
              <div key={a.id || i} style={{ padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1px solid #FDE68A" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#1A1D23" }}>{a.building} {a.room}호</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <span style={{ fontSize: 11, color: "#B0B5C1" }}>{a.date}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1D23", marginBottom: 4 }}>{a.content || a.title}</div>
                <div style={{ fontSize: 12, color: "#5F6577", marginBottom: 8, lineHeight: 1.5 }}>{a.detail || a.desc}</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  {(a.estimatedCost || 0) > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "#FEF2F2", color: "#DC2626" }}>
                      예상비용 {fmt(a.estimatedCost)}원
                    </span>
                  )}
                  {a.vendor && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: "#F3F4F6", color: "#5F6577" }}>
                      업체: {a.vendor}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleApproval(a.id, "approved")}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    ✅ 승인
                  </button>
                  <button onClick={() => handleApproval(a.id, "rejected")}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
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
        <Card style={{ marginBottom: 16, border: "1.5px solid #FECACA" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", letterSpacing: "0.05em" }}>🚨 연체 현황</div>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#DC2626" }}>{fmt(filteredOverdue.reduce((s, t) => s + t.overdue, 0))}원</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredOverdue.sort((a, b) => b.overdue - a.overdue).map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#FEF2F2", borderRadius: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{t.room}호</span>
                  <span style={{ fontSize: 11, color: "#8F95A3", marginLeft: 8 }}>{t.name}</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: "#DC2626" }}>{fmt(t.overdue)}원</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "#8F95A3", textAlign: "center" }}>관리팀에서 독촉 진행 중입니다</div>
        </Card>
      )}

      {/* Vacancy */}
      {filteredVacancies.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#D97706", letterSpacing: "0.05em", marginBottom: 10 }}>📭 공실 현황</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredVacancies.map((v, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#FFFBEB", borderRadius: 10, border: "1px solid #FDE68A" }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23" }}>{v.room}호</span>
                  <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 8, padding: "2px 6px", borderRadius: 3, background: "#fff", border: "1px solid #E0E3E9" }}>{v.type}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{v.deposit > 0 ? `${fmt(v.deposit)}/${fmt(v.rent)}만` : "—"}</div>
                  <div style={{ fontSize: 10, color: v.days > 30 ? "#DC2626" : "#8F95A3", fontWeight: v.days > 30 ? 700 : 400 }}>{v.days > 0 ? `공실 ${v.days}일` : "신규"}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AS 현황 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", letterSpacing: "0.05em" }}>🔧 AS 현황 · {selectedBldg}</div>
          {asTotalCost > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>총 {fmt(asTotalCost)}원</span>
          )}
        </div>
        {/* Cost breakdown */}
        {asTotalCost > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#FEF2F2", textAlign: "center", border: "1px solid #FECACA" }}>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>유상 (세입자부담)</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#DC2626" }}>{fmt(asCostPaid)}원</div>
              <div style={{ fontSize: 10, color: "#DC2626" }}>{filteredAS.filter(a => a.paid === "유상").length}건</div>
            </div>
            <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#ECFDF5", textAlign: "center", border: "1px solid #A7F3D0" }}>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>무상 (건물주부담)</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>{fmt(asCostFree)}원</div>
              <div style={{ fontSize: 10, color: "#059669" }}>{filteredAS.filter(a => a.paid === "무상" && (a.cost || 0) > 0).length}건</div>
            </div>
          </div>
        )}
      </Card>

      {/* AS History */}
      {filteredAS.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#EA580C", letterSpacing: "0.05em" }}>🔧 AS 이력</div>
            <button onClick={() => window.print()} style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              💾 저장/출력
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredAS.map((a, i) => (
              <div key={i} style={{ padding: "16px", borderRadius: 12, background: a.status === "완료" ? "#F9FAFB" : a.status === "진행중" ? "#FFF7ED" : "#F0F4FF", border: `1px solid ${a.status === "완료" ? "#E8ECF0" : a.status === "진행중" ? "#FED7AA" : "#C7D2FE"}` }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23" }}>{a.room}호</span>
                    <StatusBadge status={a.status} />
                    <StatusBadge status={a.priority} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 5, background: a.paid === "유상" ? "#FEF2F2" : "#ECFDF5", color: a.paid === "유상" ? "#DC2626" : "#059669" }}>
                    {a.paid}{a.cost > 0 ? ` ${fmt(a.cost)}원` : ""}
                  </span>
                </div>
                {/* Approval badge */}
                {a.ownerApproval && (
                  <div style={{ marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                      background: a.ownerApproval === "pending" ? "#FFFBEB" : a.ownerApproval === "approved" ? "#ECFDF5" : "#FEF2F2",
                      color: a.ownerApproval === "pending" ? "#D97706" : a.ownerApproval === "approved" ? "#059669" : "#DC2626",
                    }}>
                      {a.ownerApproval === "pending" ? "승인대기" : a.ownerApproval === "approved" ? "승인완료" : "반려"}
                    </span>
                  </div>
                )}
                {/* Content */}
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1D23", marginBottom: 4 }}>{a.content || a.title}</div>
                <div style={{ fontSize: 12, color: "#5F6577", lineHeight: 1.6, marginBottom: 10 }}>{a.detail || a.desc}</div>
                {/* Timeline */}
                {a.steps && a.steps.length > 0 && (
                  <div style={{ padding: "12px", background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#8F95A3", marginBottom: 8 }}>처리 과정</div>
                    {a.steps.map((step: Record<string, any>, si: number) => (
                      <div key={si} style={{ display: "flex", gap: 10, marginBottom: si < a.steps.length - 1 ? 8 : 0, paddingBottom: si < a.steps.length - 1 ? 8 : 0, borderBottom: si < a.steps.length - 1 ? "1px solid #F0F2F5" : "none" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: si === a.steps.length - 1 ? "#3B82F6" : "#D1D5DB", marginTop: 5, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{step.action}</span>
                            <span style={{ fontSize: 10, color: "#B0B5C1" }}>{step.date}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: "#5F6577", lineHeight: 1.5 }}>{step.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Photos */}
                {(a.photoBefore || a.photoAfter) && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    {a.photoBefore && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, background: "#FEF2F2", color: "#DC2626" }}>📷 수리 전</span>}
                    {a.photoAfter && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, background: "#ECFDF5", color: "#059669" }}>📷 수리 후</span>}
                  </div>
                )}
                <div style={{ fontSize: 10, color: "#B0B5C1", marginTop: 8 }}>접수일 {a.date} · 담당 {a.assignee} · {a.category || "기타"}{a.vendor ? ` · ${a.vendor}` : ""}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 최근 순회 요약 (모든 건물) */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.05em", marginBottom: 10 }}>🚶 최근 순회</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {myBuildings.map(bName => {
            const latestRec = allPatrolRecords.find(r => r.building === bName);
            const bldgP = patrolBuildings.find(p => p.building === bName);
            if (!latestRec && !bldgP) return null;
            return (
              <div key={bName} onClick={() => setSelectedBldg(bName)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                  background: latestRec?.status === "이상발견" ? "#FEF2F2" : "#F8FAFC", border: `1px solid ${latestRec?.status === "이상발견" ? "#FECACA" : "#E8ECF0"}`,
                  transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = latestRec?.status === "이상발견" ? "#FEE2E2" : "#F0F2F5"}
                onMouseLeave={e => e.currentTarget.style.background = latestRec?.status === "이상발견" ? "#FEF2F2" : "#F8FAFC"}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#1A1D23" }}>{bName}</span>
                  {latestRec && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                      background: latestRec.status === "이상발견" ? "#FEE2E2" : "#D1FAE5",
                      color: latestRec.status === "이상발견" ? "#DC2626" : "#059669" }}>
                      {latestRec.status}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#8F95A3" }}>{latestRec ? latestRec.date.slice(5) : "미순회"}</span>
                  <span style={{ color: "#B0B5C1" }}>›</span>
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
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.05em" }}>🚶 순회 관리 리포트</div>
              {bldgPatrol && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#8F95A3" }}>월 {bldgPatrol.freq}회 · {interval}일 주기</span>
                  <span style={{ fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 6, background: bldgPatrol.doneCount >= bldgPatrol.freq ? "#D1FAE5" : "#FEF3C7", color: bldgPatrol.doneCount >= bldgPatrol.freq ? "#059669" : "#D97706" }}>
                    {bldgPatrol.doneCount}/{bldgPatrol.freq}회 완료
                  </span>
                </div>
              )}
            </div>
            {bldgPatrol && (
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#F5F3FF", textAlign: "center", border: "1px solid #DDD6FE" }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>담당자</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#7C3AED" }}>{bldgPatrol.assignee}</div>
                </div>
                <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#F5F3FF", textAlign: "center", border: "1px solid #DDD6FE" }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>마지막 순회</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1D23" }}>{bldgPatrol.lastDate ? bldgPatrol.lastDate.slice(5) : "—"}</div>
                </div>
                <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: bldgPatrol.lastStatus === "이상발견" ? "#FEF2F2" : "#F0FDF4", textAlign: "center", border: `1px solid ${bldgPatrol.lastStatus === "이상발견" ? "#FECACA" : "#BBF7D0"}` }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>최근 상태</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: bldgPatrol.lastStatus === "이상발견" ? "#DC2626" : "#059669" }}>{bldgPatrol.lastStatus || "—"}</div>
                </div>
              </div>
            )}
            {bldgRecords.length > 0 ? (
              <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid #E8ECF0", borderRadius: 10 }}>
                {bldgRecords.map((rec, i) => (
                  <div key={i} onClick={() => setExpandedPatrol(expandedPatrol === i ? null : i)}
                    style={{ padding: "10px 14px", cursor: "pointer", borderBottom: i < bldgRecords.length - 1 ? "1px solid #F0F2F5" : "none", background: rec.status === "이상발견" ? "#FEF2F2" : "#fff", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = rec.status === "이상발견" ? "#FEE2E2" : "#F9FAFB"}
                    onMouseLeave={e => e.currentTarget.style.background = rec.status === "이상발견" ? "#FEF2F2" : "#fff"}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#1A1D23" }}>{rec.date}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: rec.status === "이상발견" ? "#FEE2E2" : "#D1FAE5", color: rec.status === "이상발견" ? "#DC2626" : "#059669" }}>{rec.status}</span>
                        <span style={{ fontSize: 10, color: "#8F95A3" }}>{rec.assignee}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: "#8F95A3" }}>📸 {rec.photos.length}</span>
                        <span style={{ fontSize: 12, color: "#B0B5C1", transform: expandedPatrol === i ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s" }}>›</span>
                      </div>
                    </div>
                    {expandedPatrol !== i && <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.comment}</div>}
                    {expandedPatrol === i && (
                      <div style={{ marginTop: 8, padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                        {rec.checklist && rec.checklist.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", marginBottom: 4 }}>시설 점검 결과</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {rec.checklist.map((c: Record<string, any>, ci: number) => (
                                <span key={ci} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: c.status === "이상" ? "#FEE2E2" : "#D1FAE5", color: c.status === "이상" ? "#DC2626" : "#059669", fontWeight: 600 }}>
                                  {c.status === "정상" ? "✅" : "⚠"} {c.item}{c.comment ? `: ${c.comment}` : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: "#1A1D23", lineHeight: 1.8, marginBottom: 8 }}>{rec.comment}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {rec.photos.map((p: string, pi: number) => (
                            <div key={pi} style={{ width: 48, height: 48, borderRadius: 6, background: "#E8ECF0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#8F95A3" }}>📷</div>
                          ))}
                        </div>
                        {rec.photos.length > 0 && <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 6 }}>사진 {rec.photos.length}장</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#8F95A3", fontSize: 12 }}>이번 달 순회 기록이 아직 없습니다</div>
            )}
          </Card>
        );
      })()}

      {/* Recent Transactions */}
      {filteredTx.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: "0.05em", marginBottom: 10 }}>💰 최근 입출금</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filteredTx.map((tx, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: "#F9FAFB" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: tx.type === "입금" ? "#10B981" : "#EF4444", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, color: "#3D4251" }}>{tx.room ? `${tx.room}호` : ""} {tx.cat}</div>
                    <div style={{ fontSize: 10, color: "#B0B5C1" }}>{tx.date}</div>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: tx.type === "입금" ? "#059669" : "#DC2626" }}>{tx.type === "지출" ? "-" : "+"}{fmt(tx.amount)}원</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      {/* Footer */}
      <div style={{ marginTop: 24, padding: "16px", textAlign: "center", borderRadius: 10, background: "#F9FAFB", border: "1px solid #E8ECF0" }}>
        <div style={{ fontSize: 12, color: "#8F95A3" }}>문의사항은 관리팀으로 연락해주세요</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1D23", marginTop: 4 }}>📞 02-1234-5678 · 하우스맨 관리팀</div>
      </div>
    </div>
  );
};
