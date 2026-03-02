import { useState } from 'react';
import { asItems } from '../data';
import { useIsMobile, fmt } from '../utils';
import { matchKorean } from '../utils/koreanSearch';
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
  const statuses = ["전체", "대기", "진행중", "완료"];
  const myAS = myBuildings.length > 0 ? asItems.filter(a => myBuildings.includes(a.building)) : asItems;
  const [staffList] = useLocalStorage("hm_staffList", initialStaffMembers);
  const externalStaffAS = staffList.filter(s => s.roles.includes("external")).map(s => s.name);
  const assigneesAS = ["전체", ...externalStaffAS];
  const filteredByAssigneeAS = filterAssigneeAS === "전체" ? myAS : myAS.filter(a => a.assignee === filterAssigneeAS);
  const filtered = tab === "전체" ? filteredByAssigneeAS : filteredByAssigneeAS.filter(a => a.status === tab);

  const totalCost = myAS.reduce((s, a) => s + a.cost, 0);
  const paidCount = myAS.filter(a => a.paid === "유상").length;
  const paidCost = myAS.filter(a => a.paid === "유상").reduce((s, a) => s + a.cost, 0);

  const actionColors = {
    "접수": { bg: "#EFF6FF", color: "#2563EB", icon: "📋" },
    "현장확인": { bg: "#FFF7ED", color: "#EA580C", icon: "🔍" },
    "현장출동": { bg: "#FFF7ED", color: "#EA580C", icon: "🚗" },
    "부품발주": { bg: "#F5F3FF", color: "#7C3AED", icon: "📦" },
    "견적전달": { bg: "#FFFBEB", color: "#D97706", icon: "💰" },
    "수리완료": { bg: "#ECFDF5", color: "#059669", icon: "✅" },
    "완료확인": { bg: "#ECFDF5", color: "#059669", icon: "👍" },
  };

  if (selectedAS) {
    const as = selectedAS;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setSelectedAS(null)} style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", flexShrink: 0 }}>‹</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23" }}>AS #{as.id}</h1>
              <StatusBadge status={as.status} />
            </div>
            <p style={{ fontSize: 12, color: "#8F95A3", marginTop: 3 }}>{as.building} {as.room}호 · {as.date}</p>
          </div>
        </div>

        {/* Status + Cost Quick Bar - horizontal scroll on mobile */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4 }}>
          {[
            { label: "긴급도", value: as.priority, bg: as.priority === "높음" ? "#FEF2F2" : as.priority === "보통" ? "#FFF7ED" : "#F0F4FF", color: as.priority === "높음" ? "#DC2626" : as.priority === "보통" ? "#EA580C" : "#4F46E5" },
            { label: "유/무상", value: as.paid, bg: as.paid === "유상" ? "#FEF2F2" : "#ECFDF5", color: as.paid === "유상" ? "#DC2626" : "#059669" },
            { label: "비용", value: as.cost > 0 ? `${fmt(as.cost)}원` : "없음", bg: as.cost > 0 ? "#FEF2F2" : "#F3F4F6", color: as.cost > 0 ? "#DC2626" : "#8F95A3" },
            { label: "담당", value: as.assignee, bg: "#EFF6FF", color: "#2563EB" },
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
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1D23", marginBottom: 8, lineHeight: 1.4 }}>{as.content}</div>
          <div style={{ fontSize: 13, color: "#5F6577", lineHeight: 1.7, padding: "12px 14px", background: "#F9FAFB", borderRadius: 10 }}>{as.detail}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <div style={{ padding: "8px 14px", background: "#F3F4F6", borderRadius: 8, fontSize: 12 }}>
              🏷️ <span style={{ fontWeight: 700 }}>{as.category}</span>
            </div>
            <div style={{ padding: "8px 14px", background: "#F3F4F6", borderRadius: 8, fontSize: 12 }}>
              🏪 <span style={{ fontWeight: 700 }}>{as.vendor || "자체처리"}</span>
            </div>
          </div>
        </Card>

        {/* Before/After Photos - Side by Side */}
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

        {/* Timeline - single column, mobile friendly */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", letterSpacing: "0.05em", marginBottom: 12 }}>🔄 처리 과정</div>
          <div style={{ position: "relative", paddingLeft: 24 }}>
            <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: "#E5E7EB" }} />
            {as.steps.map((step, i) => {
              const ac = actionColors[step.action] || { bg: "#F3F4F6", color: "#5F6577", icon: "📌" };
              const isLast = i === as.steps.length - 1;
              return (
                <div key={i} style={{ position: "relative", marginBottom: i < as.steps.length - 1 ? 16 : 0 }}>
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
          {as.status !== "완료" && (
            <button style={{ width: "100%", marginTop: 16, padding: "14px", borderRadius: 10, border: "2px dashed #3B82F6", background: "#EFF6FF", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#2563EB", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              ⏭️ 다음 단계 기록하기
            </button>
          )}
        </Card>

        {/* Quick Action Buttons - large touch targets */}
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

        {/* Summary Info - 2 column grid for compact mobile view */}
        <Card>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", letterSpacing: "0.05em", marginBottom: 10 }}>ℹ️ 요약 정보</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {[
              { label: "접수일", value: as.date },
              { label: "건물/호실", value: `${as.building} ${as.room}호` },
              { label: "분류", value: as.category },
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

  return (
    <div>
      <SectionTitle sub="시설물 유지보수 관리">🔧 AS 관리</SectionTitle>
      {/* Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 6 : 12, marginBottom: isMobile ? 10 : 20 }}>
        {[
          { label: "대기", count: asItems.filter(a => a.status === "대기").length, color: "#4F46E5", bg: "#F0F4FF" },
          { label: "진행중", count: asItems.filter(a => a.status === "진행중").length, color: "#EA580C", bg: "#FFF7ED" },
          { label: "완료", count: asItems.filter(a => a.status === "완료").length, color: "#059669", bg: "#ECFDF5" },
          { label: "유상", count: paidCount, sub: `${fmt(paidCost)}원`, color: "#DC2626", bg: "#FEF2F2" },
        ].map((s, i) => (
          <Card key={i} onClick={() => setTab(s.label === "유상" ? "전체" : s.label)} style={{ background: tab === s.label ? s.bg : "#fff", border: tab === s.label ? `2px solid ${s.color}` : "1px solid #E8ECF0", padding: isMobile ? "8px 10px" : undefined }}>
            <div style={{ fontSize: isMobile ? 10 : 11, color: "#8F95A3", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: s.color }}>{s.count}</div>
            {s.sub && <div style={{ fontSize: isMobile ? 10 : 11, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.sub}</div>}
          </Card>
        ))}
      </div>

      {/* Filters - horizontal scroll on mobile */}
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
            <Card key={i} onClick={() => setSelectedAS(a)} style={{ cursor: "pointer", padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusBadge status={a.status} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1D23" }}>{a.content}</span>
                </div>
                <span style={{ fontSize: 11, color: "#B0B5C1", flexShrink: 0 }}>{a.date}</span>
              </div>
              <div style={{ fontSize: 12, color: "#5F6577", marginBottom: 8 }}>
                {a.building} {a.room}호 · {a.category}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: a.paid === "유상" ? "#FEF2F2" : "#ECFDF5", color: a.paid === "유상" ? "#DC2626" : "#059669" }}>{a.paid}</span>
                {a.cost > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626" }}>{fmt(a.cost)}원</span>}
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: a.priority === "높음" ? "#FEF2F2" : a.priority === "보통" ? "#FFF7ED" : "#F0F4FF", color: a.priority === "높음" ? "#DC2626" : a.priority === "보통" ? "#EA580C" : "#4F46E5", fontWeight: 600 }}>{a.priority}</span>
                <span style={{ fontSize: 10, color: "#8F95A3", marginLeft: "auto" }}>{a.assignee} · {a.steps.length}단계</span>
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
              { label: "분류", render: r => <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#F3F4F6", fontWeight: 600 }}>{r.category}</span> },
              { label: "내용", key: "content" },
              { label: "유/무상", render: r => <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: r.paid === "유상" ? "#FEF2F2" : "#ECFDF5", color: r.paid === "유상" ? "#DC2626" : "#059669" }}>{r.paid}</span> },
              { label: "비용", align: "right", render: r => r.cost > 0 ? <span style={{ fontWeight: 700 }}>{fmt(r.cost)}원</span> : <span style={{ color: "#ccc" }}>—</span> },
              { label: "긴급도", render: r => <StatusBadge status={r.priority} /> },
              { label: "담당", key: "assignee" },
              { label: "진행", render: r => <span style={{ fontSize: 11, color: "#8F95A3" }}>{r.steps.length}단계</span> },
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
        <button style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: "#3B82F6", color: "#fff", border: "none", fontSize: 28, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(59,130,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>+</button>
      )}
    </div>
  );
};
