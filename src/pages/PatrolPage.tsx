import { useState, useMemo } from 'react';
import { patrolBuildings, patrolRecords } from '@/data/patrolData';
import { useIsMobile } from '@/utils';
import { matchKorean } from '@/utils/koreanSearch';
import { Card, SectionTitle, StatusBadge, PhotoDropZone } from '@/components';
import { initialStaffMembers } from '@/config';
import { useLocalStorage } from '@/utils/useLocalStorage';

const DEFAULT_CHECKLIST = ["복도 조명", "옥상 배수구", "CCTV 작동", "소방시설", "주차장"];

interface ChecklistItem {
  item: string;
  status: string;
  comment?: string;
}

interface PatrolRecordItem {
  id: number;
  building: string;
  date: string;
  assignee: string;
  checklist?: ChecklistItem[];
  comment: string;
  photos: string[];
  status: string;
  [key: string]: any;
}

interface PatrolBuildingItem {
  building: string;
  freq: number;
  assignee: string;
  doneCount: number;
  lastDate: string | null;
  lastStatus: string | null;
  [key: string]: any;
}

interface FormChecklistItem {
  item: string;
  status: string;
  comment: string;
}

interface PatrolPageProps {
  myBuildings?: string[];
  buildingData?: Record<string, any>;
  isLoading?: boolean;
}

export const PatrolPage: React.FC<PatrolPageProps> = ({ myBuildings = [], buildingData = {} }) => {
  const isMobile = useIsMobile();
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PatrolRecordItem | null>(null);
  const [filterAssignee, setFilterAssignee] = useState("전체");
  const [patrolPhotos, setPatrolPhotos] = useLocalStorage<string[]>("hm_patrolPhotos", []);
  const [savedPatrolRecords, setSavedPatrolRecords] = useLocalStorage<PatrolRecordItem[]>("hm_patrolRecords", []);

  // New patrol form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [formBuilding, setFormBuilding] = useState("");
  const [formChecklist, setFormChecklist] = useState<FormChecklistItem[]>([]);
  const [formComment, setFormComment] = useState("");
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [formAssignee, setFormAssignee] = useState("");

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Merge static and localStorage records
  const allRecords = useMemo((): PatrolRecordItem[] => {
    const merged = [...patrolRecords, ...savedPatrolRecords] as PatrolRecordItem[];
    return merged.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }, [savedPatrolRecords]);

  // 건물호실정보의 순회주기 + 담당자 설정 반영 (buildingData 우선, 없으면 기본값 월1회)
  const parseCycleFreq = (cycle?: string): number => { const m = cycle?.match(/월(\d+)회/); return m ? parseInt(m[1]) : 1; };
  const rawPatrol = myBuildings.length > 0 ? patrolBuildings.filter(b => myBuildings.includes(b.building)) : patrolBuildings;
  const myPatrolBuildings: PatrolBuildingItem[] = rawPatrol.map(b => {
    const bd = buildingData[b.building];
    // Include saved records in done count
    const savedForBuilding = savedPatrolRecords.filter(r => r.building === b.building && r.date.startsWith(today.toISOString().slice(0, 7)));
    return {
      ...b,
      freq: parseCycleFreq(bd?.visitCycle),
      assignee: bd?.managers?.external || b.assignee,
      doneCount: b.doneCount + savedForBuilding.length,
      lastDate: savedForBuilding.length > 0 ? savedForBuilding[0].date : b.lastDate,
      lastStatus: savedForBuilding.length > 0 ? savedForBuilding[0].status : b.lastStatus,
    };
  });

  const [staffList] = useLocalStorage("hm_staffList", initialStaffMembers);
  const externalStaff = (staffList as any[]).filter(s => s.roles.includes("external")).map(s => s.name);
  const assignees = ["전체", ...externalStaff];

  // Urgency: days until next patrol due. Lower = more urgent = top
  const getUrgency = (b: PatrolBuildingItem): number => {
    const interval = Math.floor(28 / b.freq);
    if (!b.lastDate) return -999; // never patrolled = most urgent
    const daysSince = Math.ceil((today.getTime() - new Date(b.lastDate).getTime()) / 86400000);
    return interval - daysSince; // negative = overdue, 0 = due today, positive = days left
  };

  const filteredByAssignee = filterAssignee === "전체" ? myPatrolBuildings : myPatrolBuildings.filter(b => b.assignee === filterAssignee);
  const sorted = [...filteredByAssignee].sort((a, b) => getUrgency(a) - getUrgency(b));

  const totalDone = myPatrolBuildings.reduce((s, b) => s + b.doneCount, 0);
  const totalRequired = myPatrolBuildings.reduce((s, b) => s + b.freq, 0);
  const progressPct = totalRequired > 0 ? ((totalDone / totalRequired) * 100).toFixed(0) : "0";
  const overdueBuildings = myPatrolBuildings.filter(b => {
    if (!b.lastDate) return true;
    const days = Math.ceil((today.getTime() - new Date(b.lastDate).getTime()) / 86400000);
    const interval = Math.floor(28 / b.freq);
    return days > interval;
  });

  // Initialize new patrol form
  const openNewForm = (buildingName: string) => {
    const bd = buildingData[buildingName];
    const checklist: string[] = bd?.facilityChecklist || DEFAULT_CHECKLIST;
    setFormBuilding(buildingName || (myPatrolBuildings[0]?.building || ""));
    setFormChecklist(checklist.map(item => ({ item, status: "정상", comment: "" })));
    setFormComment("");
    setFormPhotos([]);
    setFormAssignee(bd?.managers?.external || myPatrolBuildings.find(p => p.building === buildingName)?.assignee || externalStaff[0] || "");
    setShowNewForm(true);
  };

  const updateFormBuilding = (name: string) => {
    const bd = buildingData[name];
    const checklist: string[] = bd?.facilityChecklist || DEFAULT_CHECKLIST;
    setFormBuilding(name);
    setFormChecklist(checklist.map(item => ({ item, status: "정상", comment: "" })));
    setFormAssignee(bd?.managers?.external || myPatrolBuildings.find(p => p.building === name)?.assignee || externalStaff[0] || "");
  };

  const savePatrolRecord = () => {
    if (!formBuilding) { alert("건물을 선택해주세요."); return; }
    const hasIssue = formChecklist.some(c => c.status === "이상");
    const record: PatrolRecordItem = {
      id: Date.now(),
      building: formBuilding,
      date: todayStr,
      assignee: formAssignee,
      checklist: formChecklist.map(c => c.status === "이상" ? { item: c.item, status: c.status, comment: c.comment } : { item: c.item, status: c.status }),
      comment: formComment || (hasIssue ? "이상 항목 발견" : "전체 정상 확인"),
      photos: formPhotos,
      status: hasIssue ? "이상발견" : "정상",
    };
    setSavedPatrolRecords(prev => [record, ...prev]);
    setShowNewForm(false);
    setPatrolPhotos([]);
    alert(`[${formBuilding}] 순회 기록이 저장되었습니다.`);
  };

  const selectClassName = "w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-[13px] font-[inherit] outline-none cursor-pointer bg-white focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors";

  // Detail view
  if (selectedRecord) {
    const rec = selectedRecord;
    return (
      <div>
        <div className="flex items-center gap-2 mb-5 cursor-pointer group" onClick={() => setSelectedRecord(null)}>
          <span className="text-xl">←</span>
          <span className="text-sm font-bold text-hm-blue group-hover:underline">순회 목록으로</span>
        </div>
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-extrabold text-hm-text">{rec.building}</div>
              <div className="text-xs text-hm-text-muted mt-0.5">{rec.date} · {rec.assignee}</div>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-md ${rec.status === "이상발견" ? 'bg-[#FEE2E2] text-hm-danger' : 'bg-[#D1FAE5] text-hm-success'}`}>{rec.status}</span>
          </div>

          {/* Checklist details */}
          {rec.checklist && rec.checklist.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] font-bold text-hm-blue mb-2">✅ 시설 점검 결과</div>
              <div className="flex flex-col gap-1">
                {rec.checklist.map((c, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${c.status === "이상" ? 'bg-hm-danger-bg border border-hm-danger-border' : 'bg-[#F0FDF4] border border-[#BBF7D0]'}`}>
                    <span className="text-sm">{c.status === "정상" ? "✅" : "⚠️"}</span>
                    <span className="text-[13px] font-bold text-hm-text flex-1">{c.item}</span>
                    <span className={`text-[11px] font-bold ${c.status === "이상" ? 'text-hm-danger' : 'text-hm-success'}`}>{c.status}</span>
                    {c.comment && <span className="text-[11px] text-hm-danger ml-1">· {c.comment}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 py-3.5 bg-hm-bg-slate rounded-[10px] border border-hm-border mb-4">
            <div className="text-[10px] font-bold text-hm-blue mb-1.5">📝 순회 코멘트</div>
            <div className="text-[13px] text-hm-text leading-[1.8]">{rec.comment}</div>
          </div>
          <div>
            <PhotoDropZone photos={rec.photos} maxPhotos={30} label={`현장 사진 (${rec.photos.length}장)`} color="var(--color-hm-blue)" />
          </div>
        </Card>
      </div>
    );
  }

  // New patrol form
  if (showNewForm) {
    const buildingOptions = myPatrolBuildings.map(b => b.building);
    return (
      <div>
        <div className="flex items-center gap-2 mb-5 cursor-pointer group" onClick={() => setShowNewForm(false)}>
          <span className="text-xl">←</span>
          <span className="text-sm font-bold text-hm-blue group-hover:underline">순회 목록으로</span>
        </div>
        <Card className="mb-4">
          <div className="text-[15px] font-extrabold text-hm-text mb-4 pb-2.5 border-b-2 border-hm-border">🚶 새 순회 기록</div>

          {/* Building selector */}
          <div className="mb-3.5">
            <div className="text-[11px] font-bold text-hm-text-sub mb-1.5">건물 선택</div>
            <select value={formBuilding} onChange={e => updateFormBuilding(e.target.value)}
              className={selectClassName}>
              {buildingOptions.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div className="mb-3.5">
            <div className="text-[11px] font-bold text-hm-text-sub mb-1.5">담당자</div>
            <select value={formAssignee} onChange={e => setFormAssignee(e.target.value)}
              className={selectClassName}>
              {externalStaff.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="mb-3.5">
            <div className="text-[11px] font-bold text-hm-text-sub mb-1.5">순회일자</div>
            <div className="px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-[13px] bg-hm-bg-slate text-hm-text font-semibold">{todayStr}</div>
          </div>

          {/* Facility Checklist */}
          <div className="mb-3.5">
            <div className="text-[11px] font-bold text-hm-text-sub mb-2">시설 점검 체크리스트</div>
            <div className="flex flex-col gap-1.5">
              {formChecklist.map((c, i) => (
                <div key={i} className={`px-3 py-2.5 rounded-lg border-[1.5px] transition-all ${c.status === "이상" ? 'bg-hm-danger-bg border-hm-danger-border' : 'bg-[#F0FDF4] border-[#BBF7D0]'}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[13px] font-bold text-hm-text flex-1">{c.item}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { const u = [...formChecklist]; u[i] = { ...u[i], status: "정상", comment: "" }; setFormChecklist(u); }}
                        className={`px-3 py-1.5 rounded-md font-bold text-[11px] cursor-pointer font-[inherit] transition-all ${c.status === "정상" ? 'border-2 border-hm-success bg-[#D1FAE5] text-hm-success' : 'border-[1.5px] border-hm-input-border bg-white text-hm-text-muted hover:bg-hm-bg-hover'}`}>
                        ✅ 정상
                      </button>
                      <button onClick={() => { const u = [...formChecklist]; u[i] = { ...u[i], status: "이상" }; setFormChecklist(u); }}
                        className={`px-3 py-1.5 rounded-md font-bold text-[11px] cursor-pointer font-[inherit] transition-all ${c.status === "이상" ? 'border-2 border-hm-danger bg-[#FEE2E2] text-hm-danger' : 'border-[1.5px] border-hm-input-border bg-white text-hm-text-muted hover:bg-hm-bg-hover'}`}>
                        ⚠ 이상
                      </button>
                    </div>
                  </div>
                  {c.status === "이상" && (
                    <div className="mt-2">
                      <input value={c.comment} onChange={e => { const u = [...formChecklist]; u[i] = { ...u[i], comment: e.target.value }; setFormChecklist(u); }}
                        placeholder="이상 내용을 입력하세요..."
                        className="w-full px-2.5 py-2 rounded-md border-[1.5px] border-hm-danger-border text-xs font-[inherit] outline-none box-border bg-white focus:ring-2 focus:ring-ring transition-colors" />
                    </div>
                  )}
                </div>
              ))}
              {formChecklist.length === 0 && (
                <div className="p-4 text-center text-[#B0B5C1] text-xs">이 건물에 설정된 체크리스트가 없습니다. 건물 상세에서 추가해주세요.</div>
              )}
            </div>
          </div>

          {/* General comment */}
          <div className="mb-3.5">
            <div className="text-[11px] font-bold text-hm-text-sub mb-1.5">전체 코멘트</div>
            <textarea value={formComment} onChange={e => setFormComment(e.target.value)}
              placeholder="순회 결과를 기록해주세요..." rows={4}
              className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-[13px] font-[inherit] resize-y outline-none min-h-[80px] box-border focus:ring-2 focus:ring-ring transition-colors" />
          </div>

          {/* Photos */}
          <div className="mb-3.5">
            <PhotoDropZone photos={formPhotos} maxPhotos={30} label="현장 사진 (20장 이상 권장)" color="var(--color-hm-blue)"
              onAdd={(dataUrls: string[]) => setFormPhotos(prev => [...prev, ...dataUrls].slice(0, 30))}
              onRemove={(idx: number) => setFormPhotos(formPhotos.filter((_, i) => i !== idx))} />
          </div>

          {/* Save buttons */}
          <button onClick={savePatrolRecord}
            className="w-full py-3.5 rounded-[10px] border-none bg-hm-blue-dark text-white font-extrabold text-sm cursor-pointer font-[inherit] mb-2 hover:opacity-90 active:scale-[0.98] transition-all">
            💾 순회 기록 저장
          </button>
          <button onClick={() => setShowNewForm(false)}
            className="w-full py-3 rounded-[10px] border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-[13px] cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
            취소
          </button>
        </Card>
      </div>
    );
  }

  // Building detail
  if (selectedBuilding) {
    const b = myPatrolBuildings.find(p => p.building === selectedBuilding);
    if (!b) { setSelectedBuilding(null); return null; }
    const records = allRecords.filter(r => r.building === selectedBuilding);
    const interval = Math.floor(28 / b.freq);
    const daysSince = b.lastDate ? Math.ceil((today.getTime() - new Date(b.lastDate).getTime()) / 86400000) : null;
    const remain = b.freq - b.doneCount;

    return (
      <div>
        <div className="flex items-center gap-2 mb-5 cursor-pointer group" onClick={() => setSelectedBuilding(null)}>
          <span className="text-xl">←</span>
          <span className="text-sm font-bold text-hm-blue group-hover:underline">순회 목록으로</span>
        </div>
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xl font-extrabold text-hm-text">{b.building}</div>
              <div className="text-xs text-hm-text-muted mt-0.5">월 {b.freq}회 순회 · {interval}일 주기 · 👤 {b.assignee}</div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-extrabold ${remain > 0 ? 'text-hm-danger' : 'text-hm-success'}`}>{b.doneCount}<span className="text-sm text-hm-text-muted">/{b.freq}</span></div>
              <div className={`text-[10px] font-semibold ${remain > 0 ? 'text-hm-danger' : 'text-hm-success'}`}>{remain > 0 ? `${remain}회 남음` : "완료"}</div>
            </div>
          </div>
          <div className="flex gap-3 mb-3">
            <div className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#F0F4FF] text-center">
              <div className="text-[10px] text-hm-text-muted mb-1">마지막 순회</div>
              <div className="text-sm font-extrabold text-hm-text">{b.lastDate ? b.lastDate.slice(5) : "—"}</div>
              {daysSince !== null && <div className={`text-[10px] ${daysSince > interval ? 'text-hm-danger' : 'text-hm-text-muted'}`}>{daysSince}일 전</div>}
            </div>
            <div className={`flex-1 px-3.5 py-2.5 rounded-lg text-center ${b.lastStatus === "이상발견" ? 'bg-hm-danger-bg' : 'bg-[#F0FDF4]'}`}>
              <div className="text-[10px] text-hm-text-muted mb-1">마지막 상태</div>
              <div className={`text-sm font-extrabold ${b.lastStatus === "이상발견" ? 'text-hm-danger' : 'text-hm-success'}`}>{b.lastStatus || "—"}</div>
            </div>
          </div>
          {/* New patrol button */}
          <button onClick={() => openNewForm(b.building)}
            className="w-full py-3 rounded-[10px] border-none bg-hm-blue-dark text-white font-extrabold text-sm cursor-pointer font-[inherit] hover:opacity-90 active:scale-[0.98] transition-all">
            + 새 순회 기록
          </button>
        </Card>

        {/* Report button */}
        <Card className="mb-4">
          <button onClick={() => { alert(`[${b.building}] 순회관리 완료 리포트가 건물주에게 발송되었습니다.`); }}
            className="w-full py-3 rounded-[10px] border-2 border-[#7C3AED] bg-[#F5F3FF] text-[#7C3AED] font-extrabold text-sm cursor-pointer font-[inherit] hover:bg-[#EDE9FE] active:scale-[0.98] transition-all">
            📤 순회관리완료 (건물주 리포트 발송)
          </button>
          <div className="text-[10px] text-hm-text-muted mt-1.5 text-center">이번 달 순회 기록을 정리하여 건물주 대시보드에 공유합니다</div>
        </Card>

        {/* History */}
        {records.length > 0 && (
          <Card>
            <div className="text-[10px] font-bold text-hm-text-muted tracking-wider mb-3">📋 순회 이력</div>
            <div className="flex flex-col gap-2">
              {records.map((rec, i) => (
                <div key={rec.id || i} onClick={() => setSelectedRecord(rec)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-[10px] cursor-pointer transition-colors ${rec.status === "이상발견" ? 'bg-hm-danger-bg border border-hm-danger-border hover:bg-[#FEE2E2]' : 'bg-hm-bg-slate border border-hm-border hover:bg-hm-bg-hover'}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rec.status === "이상발견" ? 'bg-[#FEE2E2] text-hm-danger' : 'bg-[#D1FAE5] text-hm-success'}`}>{rec.status}</span>
                    <div>
                      <div className="text-[13px] font-bold text-hm-text">{rec.date}</div>
                      <div className="text-[11px] text-hm-text-muted mt-px">
                        {rec.checklist ? `${rec.checklist.filter(c => c.status === "이상").length}건 이상 · ` : ""}
                        {rec.comment.slice(0, 40)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-hm-text-muted">📸 {rec.photos.length}장</span>
                    <span className="text-[#B0B5C1]">›</span>
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
      <SectionTitle sub={`${today.getFullYear()}년 ${today.getMonth() + 1}월 · 이번 달 ${totalDone}/${totalRequired}회 완료`}>🚶 순회 관리</SectionTitle>

      {/* New patrol button */}
      <div className="mb-4">
        <button onClick={() => openNewForm(myPatrolBuildings[0]?.building || "")}
          className="w-full py-3.5 rounded-xl border-none bg-hm-blue-dark text-white font-extrabold text-sm cursor-pointer font-[inherit] shadow-[0_2px_8px_rgba(37,99,235,0.25)] hover:opacity-90 active:scale-[0.98] transition-all">
          + 새 순회 기록
        </button>
      </div>

      {/* Progress */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[22px] font-extrabold text-hm-text">{progressPct}<span className="text-sm text-hm-text-muted">%</span></div>
            <div className="text-[11px] text-hm-text-muted">이번 달 진행률</div>
          </div>
          <div className="flex gap-4">
            <div className="text-center"><div className="text-lg font-extrabold text-hm-success">{totalDone}</div><div className="text-[9px] text-hm-text-muted">완료</div></div>
            <div className="text-center"><div className="text-lg font-extrabold text-hm-danger">{totalRequired - totalDone}</div><div className="text-[9px] text-hm-text-muted">남음</div></div>
            <div className="text-center"><div className="text-lg font-extrabold text-hm-warning">{overdueBuildings.length}</div><div className="text-[9px] text-hm-text-muted">주기초과</div></div>
          </div>
        </div>
        <div className="h-2 bg-[#E5E7EB] rounded overflow-hidden">
          <div className="h-full rounded transition-[width] duration-300" style={{ width: `${progressPct}%`, background: Number(progressPct) >= 80 ? "#10B981" : Number(progressPct) >= 50 ? "#F59E0B" : "#EF4444" }} />
        </div>
      </Card>

      {/* Building List */}
      {/* Assignee filter */}
      <div className="flex gap-1 mb-3">
        {assignees.map(a => (
          <button key={a} onClick={() => setFilterAssignee(a)}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs cursor-pointer font-[inherit] transition-all ${filterAssignee === a ? 'border-2 border-hm-text bg-hm-text text-white' : 'border-[1.5px] border-hm-input-border bg-white text-hm-text-sub hover:bg-hm-bg-hover'}`}>
            {a} {a !== "전체" && <span className="text-[10px] opacity-70">({myPatrolBuildings.filter(b => b.assignee === a).length})</span>}
          </button>
        ))}
      </div>
      <div className={`grid gap-2.5 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {sorted.map((b, i) => {
          const remain = b.freq - b.doneCount;
          const interval = Math.floor(28 / b.freq);
          const daysSince = b.lastDate ? Math.ceil((today.getTime() - new Date(b.lastDate).getTime()) / 86400000) : null;
          const daysLeft = daysSince !== null ? interval - daysSince : -999;
          const overdue = daysLeft < 0;
          const greenThreshold = b.freq >= 4 ? 3 : 7; // 월4회→3일, 그 외→7일
          const approaching = !overdue && daysLeft >= 0 && daysLeft <= greenThreshold;
          const done = remain <= 0;
          // 색상: 초과=적색, 임박=녹색, 완료=연녹색, 그 외=무색
          const bgClass = overdue ? 'bg-hm-danger-bg' : approaching ? 'bg-[#F0FDF4]' : done ? 'bg-[#F0FDF4]' : 'bg-white';
          const bdClass = overdue ? 'border-hm-danger-border' : approaching ? 'border-[#BBF7D0]' : done ? 'border-[#BBF7D0]' : 'border-hm-border';
          return (
            <Card key={i} onClick={() => setSelectedBuilding(b.building)}
              className={`cursor-pointer border-[1.5px] ${bgClass} ${bdClass} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-extrabold text-hm-text">{b.building}</span>
                {overdue ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#FEE2E2] text-hm-danger animate-pulse">🚨 초과 {Math.abs(daysLeft)}일</span>
                ) : approaching ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#D1FAE5] text-hm-success">🟢 {daysLeft}일 남음</span>
                ) : done ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#D1FAE5] text-hm-success">✅ 완료</span>
                ) : (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">{daysLeft}일 후</span>
                )}
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-10 h-[5px] bg-[#E5E7EB] rounded-sm overflow-hidden">
                    <div className="h-full rounded-sm" style={{ width: `${(b.doneCount / b.freq) * 100}%`, background: done ? "#10B981" : "var(--color-hm-blue)" }} />
                  </div>
                  <span className="text-[11px] font-bold text-hm-text-sub">{b.doneCount}/{b.freq}</span>
                </div>
                <span className="text-[9px] text-hm-text-muted">월{b.freq}회 · {interval}일주기</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-hm-text-muted">👤 {b.assignee}</span>
                <span className={`text-[10px] ${overdue ? 'text-hm-danger' : 'text-hm-text-muted'}`}>
                  {b.lastDate ? `${b.lastDate.slice(5)}` : "미순회"} {b.lastStatus === "이상발견" ? "⚠" : ""}
                </span>
              </div>
              {(overdue || approaching) && !done && (
                <div className={`mt-1.5 px-2 py-1 rounded-[5px] text-[10px] font-bold text-center text-white ${overdue ? 'bg-hm-danger' : 'bg-hm-success'}`}>
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
          const daysSince = b.lastDate ? Math.ceil((today.getTime() - new Date(b.lastDate).getTime()) / 86400000) : null;
          const daysLeft = daysSince !== null ? interval - daysSince : -999;
          const greenThreshold = b.freq >= 4 ? 3 : 7;
          const overdue = daysLeft < 0;
          const approaching = !overdue && daysLeft >= 0 && daysLeft <= greenThreshold;
          if (!overdue && !approaching) return null;
          return { ...b, daysLeft, overdue, interval };
        }).filter(Boolean) as (PatrolBuildingItem & { daysLeft: number; overdue: boolean; interval: number })[];
        const overdueList = alerts.filter(a => a.overdue).sort((a, b) => a.daysLeft - b.daysLeft);
        const approachList = alerts.filter(a => !a.overdue).sort((a, b) => a.daysLeft - b.daysLeft);
        if (alerts.length === 0) return null;
        return (
          <Card className="mt-4 mb-0 !px-[18px] !py-3.5">
            <div className="text-[11px] font-extrabold text-hm-text mb-2.5">⏰ 순회 알림</div>
            {overdueList.length > 0 && (
              <div className={approachList.length > 0 ? 'mb-2.5' : ''}>
                <div className="text-[10px] font-bold text-hm-danger mb-1.5">🚨 주기 초과 ({overdueList.length}건)</div>
                <div className="flex flex-wrap gap-1.5">
                  {overdueList.map((a, i) => (
                    <div key={i} onClick={() => setSelectedBuilding(a.building)}
                      className="px-3 py-1.5 rounded-lg bg-hm-danger-bg border border-hm-danger-border cursor-pointer flex items-center gap-1.5 hover:bg-[#FEE2E2] transition-colors">
                      <span className="text-xs font-bold text-hm-text">{a.building}</span>
                      <span className="text-[10px] font-bold text-hm-danger">+{Math.abs(a.daysLeft)}일</span>
                      <span className="text-[9px] text-hm-text-muted">월{a.freq}회</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {approachList.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-hm-success mb-1.5">🟢 순회 임박 ({approachList.length}건)</div>
                <div className="flex flex-wrap gap-1.5">
                  {approachList.map((a, i) => (
                    <div key={i} onClick={() => setSelectedBuilding(a.building)}
                      className="px-3 py-1.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] cursor-pointer flex items-center gap-1.5 hover:bg-[#DCFCE7] transition-colors">
                      <span className="text-xs font-bold text-hm-text">{a.building}</span>
                      <span className="text-[10px] font-bold text-hm-success">{a.daysLeft}일</span>
                      <span className="text-[9px] text-hm-text-muted">월{a.freq}회</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })()}

      {/* Recent Records */}
      <Card className="mt-4">
        <div className="text-[10px] font-bold text-hm-text-muted tracking-wider mb-3">📋 최근 순회 기록</div>
        <div className="flex flex-col gap-1.5">
          {allRecords.slice(0, 20).map((rec, i) => (
            <div key={rec.id || i} onClick={() => setSelectedRecord(rec)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors ${rec.status === "이상발견" ? 'bg-hm-danger-bg border border-hm-danger-border hover:bg-[#FEE2E2]' : 'bg-hm-bg-slate border border-hm-border hover:bg-hm-bg-hover'}`}>
              <div className="flex items-center gap-2.5">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${rec.status === "이상발견" ? 'bg-[#FEE2E2] text-hm-danger' : 'bg-[#D1FAE5] text-hm-success'}`}>{rec.status}</span>
                <div>
                  <div className="text-xs font-bold">{rec.building} · {rec.date}</div>
                  <div className="text-[10px] text-hm-text-muted">
                    {rec.assignee}
                    {rec.checklist ? ` · 점검 ${rec.checklist.length}항목` : ""}
                    {" · "}{rec.comment.slice(0, 35)}...
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-hm-text-muted">📸{rec.photos.length}</span>
                <span className="text-[#B0B5C1]">›</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
