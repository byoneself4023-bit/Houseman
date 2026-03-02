import { useState } from 'react';
import { patrolBuildings, patrolRecords } from '../data/patrolData';
import { useIsMobile } from '../utils';
import { matchKorean } from '../utils/koreanSearch';
import { Card, SectionTitle, StatusBadge, PhotoDropZone } from '../components';
import { initialStaffMembers } from '../config';
import { useLocalStorage } from '../utils/useLocalStorage';

export const PatrolPage = ({ myBuildings = [], buildingData = {} }) => {
  const isMobile = useIsMobile();
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState("전체");
  const [patrolPhotos, setPatrolPhotos] = useLocalStorage("hm_patrolPhotos", []);

  const today = new Date();

  // 건물호실정보의 순회주기 + 담당자 설정 반영 (buildingData 우선, 없으면 기본값 월1회)
  const parseCycleFreq = (cycle) => { const m = cycle?.match(/월(\d+)회/); return m ? parseInt(m[1]) : 1; };
  const rawPatrol = myBuildings.length > 0 ? patrolBuildings.filter(b => myBuildings.includes(b.building)) : patrolBuildings;
  const myPatrolBuildings = rawPatrol.map(b => {
    const bd = buildingData[b.building];
    return {
      ...b,
      freq: parseCycleFreq(bd?.visitCycle),
      assignee: bd?.managers?.external || b.assignee,
    };
  });

  const [staffList] = useLocalStorage("hm_staffList", initialStaffMembers);
  const externalStaff = staffList.filter(s => s.roles.includes("external")).map(s => s.name);
  const assignees = ["전체", ...externalStaff];

  // Urgency: days until next patrol due. Lower = more urgent = top
  const getUrgency = (b) => {
    const interval = Math.floor(28 / b.freq);
    if (!b.lastDate) return -999; // never patrolled = most urgent
    const daysSince = Math.ceil((today - new Date(b.lastDate)) / 86400000);
    return interval - daysSince; // negative = overdue, 0 = due today, positive = days left
  };

  const filteredByAssignee = filterAssignee === "전체" ? myPatrolBuildings : myPatrolBuildings.filter(b => b.assignee === filterAssignee);
  const sorted = [...filteredByAssignee].sort((a, b) => getUrgency(a) - getUrgency(b));

  const totalDone = myPatrolBuildings.reduce((s, b) => s + b.doneCount, 0);
  const totalRequired = myPatrolBuildings.reduce((s, b) => s + b.freq, 0);
  const progressPct = totalRequired > 0 ? ((totalDone / totalRequired) * 100).toFixed(0) : 0;
  const overdueBuildings = myPatrolBuildings.filter(b => {
    if (!b.lastDate) return true;
    const days = Math.ceil((today - new Date(b.lastDate)) / 86400000);
    const interval = Math.floor(28 / b.freq);
    return days > interval;
  });

  // Detail view
  if (selectedRecord) {
    const rec = selectedRecord;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }} onClick={() => setSelectedRecord(null)}>
          <span style={{ fontSize: 20 }}>←</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#3B82F6" }}>순회 목록으로</span>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23" }}>{rec.building}</div>
              <div style={{ fontSize: 12, color: "#8F95A3", marginTop: 2 }}>{rec.date} · {rec.assignee}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: rec.status === "이상발견" ? "#FEE2E2" : "#D1FAE5", color: rec.status === "이상발견" ? "#DC2626" : "#059669" }}>{rec.status}</span>
          </div>
          <div style={{ padding: "14px 16px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E8ECF0", marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", marginBottom: 6 }}>📝 순회 코멘트</div>
            <div style={{ fontSize: 13, color: "#1A1D23", lineHeight: 1.8 }}>{rec.comment}</div>
          </div>
          <div>
            <PhotoDropZone photos={rec.photos} maxPhotos={30} label={`현장 사진 (${rec.photos.length}장)`} color="#3B82F6" />
          </div>
        </Card>
      </div>
    );
  }

  // Building detail
  if (selectedBuilding) {
    const b = myPatrolBuildings.find(p => p.building === selectedBuilding);
    if (!b) { setSelectedBuilding(null); return null; }
    const records = patrolRecords.filter(r => r.building === selectedBuilding);
    const interval = Math.floor(28 / b.freq);
    const daysSince = b.lastDate ? Math.ceil((today - new Date(b.lastDate)) / 86400000) : null;
    const remain = b.freq - b.doneCount;

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }} onClick={() => setSelectedBuilding(null)}>
          <span style={{ fontSize: 20 }}>←</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#3B82F6" }}>순회 목록으로</span>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1A1D23" }}>{b.building}</div>
              <div style={{ fontSize: 12, color: "#8F95A3", marginTop: 2 }}>월 {b.freq}회 순회 · {interval}일 주기 · 👤 {b.assignee}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: remain > 0 ? "#DC2626" : "#059669" }}>{b.doneCount}<span style={{ fontSize: 14, color: "#8F95A3" }}>/{b.freq}</span></div>
              <div style={{ fontSize: 10, color: remain > 0 ? "#DC2626" : "#059669", fontWeight: 600 }}>{remain > 0 ? `${remain}회 남음` : "완료"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#F0F4FF", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>마지막 순회</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23" }}>{b.lastDate ? b.lastDate.slice(5) : "—"}</div>
              {daysSince !== null && <div style={{ fontSize: 10, color: daysSince > interval ? "#DC2626" : "#8F95A3" }}>{daysSince}일 전</div>}
            </div>
            <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: b.lastStatus === "이상발견" ? "#FEF2F2" : "#F0FDF4", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>마지막 상태</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: b.lastStatus === "이상발견" ? "#DC2626" : "#059669" }}>{b.lastStatus || "—"}</div>
            </div>
          </div>
        </Card>

        {/* New patrol form */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1D23", marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #E8ECF0" }}>🚶 새 순회 기록</div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 5 }}>코멘트 (필수)</div>
            <textarea placeholder="순회 결과를 기록해주세요..." rows={6}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", minHeight: 140, boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <PhotoDropZone photos={patrolPhotos} maxPhotos={30} label="현장 사진 (20장 이상 권장)" color="#3B82F6"
              onAdd={(dataUrls) => setPatrolPhotos(prev => [...prev, ...dataUrls].slice(0, 30))}
              onRemove={(idx) => setPatrolPhotos(patrolPhotos.filter((_, i) => i !== idx))} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {["정상", "이상발견"].map(s => (
              <button key={s} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: s === "정상" ? "#059669" : "#DC2626", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                {s === "정상" ? "✅ 정상 완료" : "⚠ 이상발견 저장"}
              </button>
            ))}
          </div>
          <button onClick={() => { alert(`[${b.building}] 순회관리 완료 리포트가 건물주에게 발송되었습니다.`); }}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "2px solid #7C3AED", background: "#F5F3FF", color: "#7C3AED", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            📤 순회관리완료 (건물주 리포트 발송)
          </button>
          <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 6, textAlign: "center" }}>이번 달 순회 기록을 정리하여 건물주 대시보드에 공유합니다</div>
        </Card>

        {/* History */}
        {records.length > 0 && (
          <Card>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8F95A3", letterSpacing: "0.05em", marginBottom: 12 }}>📋 순회 이력</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {records.map((rec, i) => (
                <div key={i} onClick={() => setSelectedRecord(rec)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, cursor: "pointer", background: rec.status === "이상발견" ? "#FEF2F2" : "#F8FAFC", border: `1px solid ${rec.status === "이상발견" ? "#FECACA" : "#E8ECF0"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: rec.status === "이상발견" ? "#FEE2E2" : "#D1FAE5", color: rec.status === "이상발견" ? "#DC2626" : "#059669" }}>{rec.status}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1D23" }}>{rec.date}</div>
                      <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 1 }}>{rec.comment.slice(0, 40)}...</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#8F95A3" }}>📸 {rec.photos.length}장</span>
                    <span style={{ color: "#B0B5C1" }}>›</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionTitle sub={`2026년 2월 · 이번 달 ${totalDone}/${totalRequired}회 완료`}>🚶 순회 관리</SectionTitle>

      {/* Progress */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1A1D23" }}>{progressPct}<span style={{ fontSize: 14, color: "#8F95A3" }}>%</span></div>
            <div style={{ fontSize: 11, color: "#8F95A3" }}>이번 달 진행률</div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>{totalDone}</div><div style={{ fontSize: 9, color: "#8F95A3" }}>완료</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: "#DC2626" }}>{totalRequired - totalDone}</div><div style={{ fontSize: 9, color: "#8F95A3" }}>남음</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: "#EA580C" }}>{overdueBuildings.length}</div><div style={{ fontSize: 9, color: "#8F95A3" }}>주기초과</div></div>
          </div>
        </div>
        <div style={{ height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${progressPct}%`, height: "100%", background: progressPct >= 80 ? "#10B981" : progressPct >= 50 ? "#F59E0B" : "#EF4444", borderRadius: 4, transition: "width 0.3s" }} />
        </div>
      </Card>

      {/* Building List */}
      {/* Assignee filter */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {assignees.map(a => (
          <button key={a} onClick={() => setFilterAssignee(a)}
            style={{ padding: "6px 14px", borderRadius: 8, border: filterAssignee === a ? "2px solid #1A1D23" : "1.5px solid #E0E3E9", background: filterAssignee === a ? "#1A1D23" : "#fff", color: filterAssignee === a ? "#fff" : "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {a} {a !== "전체" && <span style={{ fontSize: 10, opacity: 0.7 }}>({myPatrolBuildings.filter(b => b.assignee === a).length})</span>}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : "repeat(3, 1fr)", gap: 10 }}>
        {sorted.map((b, i) => {
          const remain = b.freq - b.doneCount;
          const interval = Math.floor(28 / b.freq);
          const daysSince = b.lastDate ? Math.ceil((today - new Date(b.lastDate)) / 86400000) : null;
          const daysLeft = daysSince !== null ? interval - daysSince : -999;
          const overdue = daysLeft < 0;
          const greenThreshold = b.freq >= 4 ? 3 : 7; // 월4회→3일, 그 외→7일
          const approaching = !overdue && daysLeft >= 0 && daysLeft <= greenThreshold;
          const done = remain <= 0;
          // 색상: 초과=적색, 임박=녹색, 완료=연녹색, 그 외=무색
          const bgColor = overdue ? "#FEF2F2" : approaching ? "#F0FDF4" : done ? "#F0FDF4" : "#fff";
          const bdColor = overdue ? "#FECACA" : approaching ? "#BBF7D0" : done ? "#BBF7D0" : "#E8ECF0";
          return (
            <Card key={i} onClick={() => setSelectedBuilding(b.building)}
              style={{ cursor: "pointer", background: bgColor, border: `1.5px solid ${bdColor}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23" }}>{b.building}</span>
                {overdue ? (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#FEE2E2", color: "#DC2626", animation: "pulse 1.5s infinite" }}>🚨 초과 {Math.abs(daysLeft)}일</span>
                ) : approaching ? (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#D1FAE5", color: "#059669" }}>🟢 {daysLeft}일 남음</span>
                ) : done ? (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#D1FAE5", color: "#059669" }}>✅ 완료</span>
                ) : (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#F3F4F6", color: "#6B7280" }}>{daysLeft}일 후</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 40, height: 5, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${(b.doneCount / b.freq) * 100}%`, height: "100%", background: done ? "#10B981" : "#3B82F6", borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#5F6577" }}>{b.doneCount}/{b.freq}</span>
                </div>
                <span style={{ fontSize: 9, color: "#8F95A3" }}>월{b.freq}회 · {interval}일주기</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#8F95A3" }}>👤 {b.assignee}</span>
                <span style={{ fontSize: 10, color: overdue ? "#DC2626" : "#8F95A3" }}>
                  {b.lastDate ? `${b.lastDate.slice(5)}` : "미순회"} {b.lastStatus === "이상발견" ? "⚠" : ""}
                </span>
              </div>
              {(overdue || approaching) && !done && (
                <div style={{ marginTop: 6, padding: "4px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, textAlign: "center",
                  background: overdue ? "#DC2626" : "#059669", color: "#fff" }}>
                  {overdue ? `⚠ 순회 필요! (주기 ${interval}일 초과)` : `순회 예정 (${daysLeft}일 이내)`}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Urgency Alert Panel */}
      {(() => {
        const alerts = sorted.map(b => {
          const interval = Math.floor(28 / b.freq);
          const daysSince = b.lastDate ? Math.ceil((today - new Date(b.lastDate)) / 86400000) : null;
          const daysLeft = daysSince !== null ? interval - daysSince : -999;
          const greenThreshold = b.freq >= 4 ? 3 : 7;
          const overdue = daysLeft < 0;
          const approaching = !overdue && daysLeft >= 0 && daysLeft <= greenThreshold;
          if (!overdue && !approaching) return null;
          return { ...b, daysLeft, overdue, interval };
        }).filter(Boolean);
        const overdueList = alerts.filter(a => a.overdue).sort((a, b) => a.daysLeft - b.daysLeft);
        const approachList = alerts.filter(a => !a.overdue).sort((a, b) => a.daysLeft - b.daysLeft);
        if (alerts.length === 0) return null;
        return (
          <Card style={{ marginTop: 16, marginBottom: 0, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 10 }}>⏰ 순회 알림</div>
            {overdueList.length > 0 && (
              <div style={{ marginBottom: approachList.length > 0 ? 10 : 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>🚨 주기 초과 ({overdueList.length}건)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {overdueList.map((a, i) => (
                    <div key={i} onClick={() => setSelectedBuilding(a.building)}
                      style={{ padding: "6px 12px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FEE2E2"}
                      onMouseLeave={e => e.currentTarget.style.background = "#FEF2F2"}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{a.building}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626" }}>+{Math.abs(a.daysLeft)}일</span>
                      <span style={{ fontSize: 9, color: "#8F95A3" }}>월{a.freq}회</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {approachList.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 6 }}>🟢 순회 임박 ({approachList.length}건)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {approachList.map((a, i) => (
                    <div key={i} onClick={() => setSelectedBuilding(a.building)}
                      style={{ padding: "6px 12px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#DCFCE7"}
                      onMouseLeave={e => e.currentTarget.style.background = "#F0FDF4"}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{a.building}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#059669" }}>{a.daysLeft}일</span>
                      <span style={{ fontSize: 9, color: "#8F95A3" }}>월{a.freq}회</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })()}

      {/* Recent Records */}
      <Card style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#8F95A3", letterSpacing: "0.05em", marginBottom: 12 }}>📋 최근 순회 기록</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {patrolRecords.map((rec, i) => (
            <div key={i} onClick={() => setSelectedRecord(rec)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                background: rec.status === "이상발견" ? "#FEF2F2" : "#F8FAFC", border: `1px solid ${rec.status === "이상발견" ? "#FECACA" : "#E8ECF0"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: rec.status === "이상발견" ? "#FEE2E2" : "#D1FAE5", color: rec.status === "이상발견" ? "#DC2626" : "#059669" }}>{rec.status}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{rec.building} · {rec.date}</div>
                  <div style={{ fontSize: 10, color: "#8F95A3" }}>{rec.assignee} · {rec.comment.slice(0, 35)}...</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#8F95A3" }}>📸{rec.photos.length}</span>
                <span style={{ color: "#B0B5C1" }}>›</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
