import { useState, useMemo, useCallback } from 'react';
import { patrolBuildings } from '@/data/patrolData';
import { asItems } from '@/data/asItems';
import { initialStaffMembers } from '@/config/staff';
import { getRoomType } from '@/config';
import type { Tenant, Vacancy, CalendarEvent, Staff } from '@/types';

interface TaskDriverPageProps {
  isLoading?: boolean;
  myBuildings?: string[];
  activeTenants?: Tenant[];
  activeVacancies?: Vacancy[];
  calendarEvts?: CalendarEvent[];
  buildingData?: Record<string, any>;
  settlementExpenses?: Record<string, any>;
  roomBalances?: Record<string, number>;
  billingHistory?: Record<string, any>;
  pastTenantsData?: Record<string, any>;
  currentStaff?: Staff | null;
  setPage?: (page: string) => void;
  setCalendarEvts?: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  parkingInfo?: Record<string, any>;
}

interface Task {
  id: string;
  type: string;
  title: string;
  building: string;
  room: string | null;
  assignee: string;
  dueDate: Date;
  priority: string;
  category: string;
  overdueDays: number;
}

const TYPE_LABELS: Record<string, string> = {
  settlement: '정산',
  renewal: '재계약',
  patrol: '순회',
  as: 'AS',
  vacancy: '공실',
  movein: '입주',
  moveout: '퇴실',
  billing: '청구',
  custom: '직접등록',
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  settlement: { bg: '#DBEAFE', color: '#1E40AF' },
  renewal: { bg: '#FEF3C7', color: '#92400E' },
  patrol: { bg: '#D1FAE5', color: '#065F46' },
  as: { bg: '#FCE7F3', color: '#9D174D' },
  vacancy: { bg: '#F3E8FF', color: '#6B21A8' },
  movein: { bg: '#CCFBF1', color: '#134E4A' },
  moveout: { bg: 'var(--color-hm-warning-bg)', color: '#9A3412' },
  billing: { bg: 'var(--color-hm-danger-bg)', color: 'var(--color-hm-danger)' },
  custom: { bg: '#EDE9FE', color: '#7C3AED' },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#6B7280',
};

const SORT_OPTIONS = [
  { key: 'due', label: '마감순' },
  { key: 'building', label: '건물별' },
  { key: 'type', label: '유형별' },
];

const STAFF_COLORS = [
  { bg: 'var(--color-hm-blue-bg)', border: 'var(--color-hm-blue)', badge: 'var(--color-hm-blue)' },
  { bg: '#F0FDF4', border: '#22C55E', badge: '#16A34A' },
  { bg: 'var(--color-hm-warning-bg)', border: '#F97316', badge: 'var(--color-hm-warning)' },
  { bg: '#FDF4FF', border: '#A855F7', badge: '#9333EA' },
  { bg: 'var(--color-hm-danger-bg)', border: '#EF4444', badge: 'var(--color-hm-danger)' },
  { bg: 'var(--color-hm-success-bg)', border: '#10B981', badge: 'var(--color-hm-success)' },
  { bg: '#FFFBEB', border: '#F59E0B', badge: '#D97706' },
  { bg: '#F0F9FF', border: '#0EA5E9', badge: '#0284C7' },
];

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function lsKey(staffId: number | string | undefined): string {
  return `hm_completedTasks_${staffId || 'global'}`;
}

function loadCompleted(staffId: number | string | undefined): Record<string, string> {
  try {
    const saved = localStorage.getItem(lsKey(staffId));
    if (saved) {
      const parsed = JSON.parse(saved);
      return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    }
  } catch { /* ignore */ }
  return {};
}

function daysDiff(a: Date, b: Date): number {
  const msPerDay = 86400000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getAssignee(building: string, patrolData: any[]): string {
  const p = patrolData.find((pb: any) => pb.building === building);
  return p ? p.assignee : '미배정';
}

function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function dDayLabel(overdueDays: number): string {
  if (overdueDays > 0) return `D+${overdueDays}`;
  if (overdueDays === 0) return 'D-Day';
  return `D${overdueDays}`;
}

export function TaskDriverPage({
  myBuildings = [],
  activeTenants = [],
  activeVacancies = [],
  calendarEvts = [],
  buildingData = {},
  settlementExpenses = {},
  roomBalances = {},
  billingHistory = {},
  pastTenantsData = {},
  currentStaff = null,
  isLoading,
}: TaskDriverPageProps) {
  const today = useMemo(() => new Date(), []);
  const todayStr = formatDate(today);
  const isGeneral = currentStaff?.roles?.includes('general');
  const myName = currentStaff?.name || '';

  // 대표용: 직원 선택 탭 (전체 or 특정 직원)
  const [viewStaff, setViewStaff] = useState('all');

  // 직원별 완료 태스크 (로그인 직원의 localStorage)
  const [completedTasks, setCompletedTasks] = useState<Record<string, string>>(() => loadCompleted(currentStaff?.id));

  // 직원별 커스텀 태스크 (hm_tasks_${staffId})
  const customTasksKey = `hm_tasks_${currentStaff?.id || 'global'}`;
  const [customTasks, setCustomTasks] = useState<{ id: string; title: string; createdAt: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem(customTasksKey) || '[]'); } catch { return []; }
  });
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const addCustomTask = useCallback(() => {
    if (!newTaskTitle.trim()) return;
    const task = { id: `custom_${Date.now()}`, title: newTaskTitle.trim(), createdAt: new Date().toISOString() };
    setCustomTasks(prev => {
      const next = [...prev, task];
      localStorage.setItem(customTasksKey, JSON.stringify(next));
      return next;
    });
    setNewTaskTitle('');
    setShowAddTask(false);
  }, [newTaskTitle, customTasksKey]);

  const removeCustomTask = useCallback((taskId: string) => {
    setCustomTasks(prev => {
      const next = prev.filter(t => t.id !== taskId);
      localStorage.setItem(customTasksKey, JSON.stringify(next));
      return next;
    });
  }, [customTasksKey]);

  const [sortBy, setSortBy] = useState('due');

  const toggleTask = useCallback((taskId: string) => {
    setCompletedTasks(prev => {
      const next = { ...prev };
      if (next[taskId]) {
        delete next[taskId];
      } else {
        next[taskId] = new Date().toISOString();
      }
      localStorage.setItem(lsKey(currentStaff?.id), JSON.stringify(next));
      return next;
    });
  }, [currentStaff?.id]);

  // Generate all tasks (전체 건물 기준 — myBuildings는 이미 총괄이면 전체)
  const allTasks = useMemo(() => {
    const tasks: Task[] = [];
    const now = today;
    const year = now.getFullYear();
    const month = now.getMonth();

    // 1. 정산일 D-7
    (myBuildings || []).forEach((b: any) => {
      const bName = typeof b === 'string' ? b : b.name;
      if (!bName) return;
      const settlDay = lastDayOfMonth(year, month);
      const settlDate = new Date(year, month, settlDay);
      const diff = daysDiff(now, settlDate);
      if (diff >= 0 && diff <= 7) {
        tasks.push({
          id: `settlement_${bName}_${year}${month}`,
          type: 'settlement',
          title: `${bName} 정산서 작성`,
          building: bName,
          room: null,
          assignee: getAssignee(bName, patrolBuildings),
          dueDate: settlDate,
          priority: diff <= 3 ? 'high' : 'medium',
          category: 'internal',
          overdueDays: -diff,
        });
      }
    });

    // 2 & 3. 재계약 D-60 / D-30
    (activeTenants || []).forEach((t: Tenant) => {
      if (!t.expiry || !t.name || t.name === '퇴실' || t.name === '건물주') return;
      const expiry = new Date(t.expiry);
      if (isNaN(expiry.getTime())) return;
      const daysToExpiry = daysDiff(now, expiry);

      if (daysToExpiry > 0 && daysToExpiry <= 30) {
        const contactDue = new Date(expiry);
        contactDue.setDate(contactDue.getDate() - 30);
        const overdue = daysDiff(now, contactDue);
        tasks.push({
          id: `renewal30_${t.building}_${t.room}`,
          type: 'renewal',
          title: `${t.room}호 재계약 연락 ⚠️ (만료 D-${daysToExpiry})`,
          building: t.building,
          room: t.room,
          assignee: getAssignee(t.building, patrolBuildings),
          dueDate: contactDue < now ? now : contactDue,
          priority: 'high',
          category: 'external',
          overdueDays: overdue <= 0 ? -overdue : 0,
        });
      } else if (daysToExpiry > 30 && daysToExpiry <= 60) {
        const contactDue = new Date(expiry);
        contactDue.setDate(contactDue.getDate() - 30);
        const overdue = daysDiff(now, contactDue);
        tasks.push({
          id: `renewal60_${t.building}_${t.room}`,
          type: 'renewal',
          title: `${t.room}호 재계약 연락 (만료 D-${daysToExpiry})`,
          building: t.building,
          room: t.room,
          assignee: getAssignee(t.building, patrolBuildings),
          dueDate: contactDue,
          priority: 'medium',
          category: 'external',
          overdueDays: overdue <= 0 ? -overdue : 0,
        });
      }
    });

    // 4. 순회 지연
    (patrolBuildings || []).forEach((pb: any) => {
      if (!pb.lastDate) {
        tasks.push({
          id: `patrol_${pb.building}_norecord`,
          type: 'patrol',
          title: `${pb.building} 순회 기록 없음 ⚠️`,
          building: pb.building,
          room: null,
          assignee: pb.assignee || '미배정',
          dueDate: now,
          priority: 'high',
          category: 'internal',
          overdueDays: 0,
        });
        return;
      }
      const lastDate = new Date(pb.lastDate);
      const daysSince = daysDiff(lastDate, now);
      const threshold = 30 / (pb.freq || 1);
      if (daysSince > threshold) {
        tasks.push({
          id: `patrol_${pb.building}_${pb.lastDate}`,
          type: 'patrol',
          title: `${pb.building} 순회 지연 ⚠️ (${daysSince}일 경과)`,
          building: pb.building,
          room: null,
          assignee: pb.assignee || '미배정',
          dueDate: new Date(lastDate.getTime() + threshold * 86400000),
          priority: daysSince > threshold * 1.5 ? 'high' : 'medium',
          category: 'internal',
          overdueDays: Math.max(0, daysSince - threshold),
        });
      }
    });

    // 5. AS 미처리
    (asItems || []).forEach((item: any) => {
      if (item.status === '완료') return;
      const itemDate = new Date(item.date);
      const daysSince = daysDiff(itemDate, now);
      if (daysSince > 3) {
        tasks.push({
          id: `as_${item.id}`,
          type: 'as',
          title: `${item.building} ${item.room}호 AS 지연 ⚠️ — ${item.content}`,
          building: item.building,
          room: item.room,
          assignee: item.assignee || getAssignee(item.building, patrolBuildings),
          dueDate: new Date(itemDate.getTime() + 3 * 86400000),
          priority: daysSince > 7 ? 'high' : 'medium',
          category: 'external',
          overdueDays: daysSince - 3,
        });
      }
    });

    // 6. 공실 경과
    (activeVacancies || []).forEach((v: Vacancy) => {
      const days = v.days || 0;
      if (days > 30) {
        tasks.push({
          id: `vacancy_${v.building}_${v.room}`,
          type: 'vacancy',
          title: `${v.room}호 공실 ${days}일째 — 홍보 확인`,
          building: v.building,
          room: v.room,
          assignee: getAssignee(v.building, patrolBuildings),
          dueDate: now,
          priority: days > 60 ? 'high' : 'medium',
          category: 'external',
          overdueDays: 0,
        });
      }
    });

    // 7. 입주 예정
    (calendarEvts || []).forEach((evt: any) => {
      const evtTitle = evt.title || evt.content || '';
      const evtDate = new Date(evt.date || evt.start);
      if (isNaN(evtDate.getTime())) return;
      const diff = daysDiff(now, evtDate);
      if (diff >= 0 && diff <= 1 && (evtTitle.includes('입주') || evtTitle.includes('이사'))) {
        const buildingMatch = evtTitle.match(/^(.+?)\s/) || [];
        const roomMatch = evtTitle.match(/(\d+호?)/) || [];
        tasks.push({
          id: `movein_${evt.id || evtTitle}_${evt.date || evt.start}`,
          type: 'movein',
          title: `${evtTitle} — 입주 준비`,
          building: evt.building || buildingMatch[1] || '',
          room: evt.room || roomMatch[1] || null,
          assignee: getAssignee(evt.building || buildingMatch[1] || '', patrolBuildings),
          dueDate: evtDate,
          priority: diff === 0 ? 'high' : 'medium',
          category: 'internal',
          overdueDays: -diff,
        });
      }
    });

    // 8. 단기 월세 청구 (납부일 7~12일 전, 6일 전이면 high)
    (activeTenants || []).forEach((t: Tenant) => {
      if (!t.name || t.name === '퇴실' || t.name === '건물주') return;
      if (getRoomType(t.building, t.room) !== '단기') return;
      // 납부일 = 입주일의 날짜(day)
      let rentDay: number | null = null;
      if (t.moveIn) {
        const mi = new Date(t.moveIn);
        if (!isNaN(mi.getTime())) rentDay = mi.getDate();
      }
      if (!rentDay && t.due) {
        const parts = t.due.split('/');
        if (parts.length === 2) rentDay = parseInt(parts[1], 10);
      }
      if (!rentDay) return;

      // 이번 달 납부일, 다음 달 납부일 중 가까운 것
      const thisMonthDue = new Date(year, month, rentDay);
      const nextMonthDue = new Date(year, month + 1, rentDay);
      const targets = [thisMonthDue, nextMonthDue];

      targets.forEach(dueDate => {
        const daysUntil = daysDiff(now, dueDate);
        // 12일 전 ~ 납부일 당일까지 표시
        if (daysUntil >= 0 && daysUntil <= 12) {
          tasks.push({
            id: `billing_${t.building}_${t.room}_${formatDate(dueDate)}`,
            type: 'billing',
            title: `${t.room}호 ${t.name} 월세 청구 (납부일 ${rentDay}일)`,
            building: t.building,
            room: t.room,
            assignee: '공원식 대리',
            dueDate: dueDate,
            priority: daysUntil <= 6 ? 'high' : 'medium',
            category: 'internal',
            overdueDays: -daysUntil,
          });
        }
      });
    });

    // 직원별 커스텀 태스크 합류
    customTasks.forEach(ct => {
      tasks.push({
        id: ct.id,
        type: 'custom',
        title: ct.title,
        building: '',
        room: null,
        assignee: myName,
        dueDate: today,
        priority: 'low',
        category: '직접등록',
        overdueDays: 0,
      });
    });

    return tasks;
  }, [myBuildings, activeTenants, activeVacancies, calendarEvts, buildingData, roomBalances, today, customTasks, myName]);

  // 보이는 태스크: 일반 직원은 자기 것만, 대표는 선택에 따라
  const visibleTasks = useMemo(() => {
    let tasks = allTasks;

    if (!isGeneral) {
      // 일반 직원: 자기 이름으로 배정된 것만
      tasks = tasks.filter(t => t.assignee === myName);
    } else if (viewStaff !== 'all') {
      // 대표가 특정 직원 선택
      tasks = tasks.filter(t => t.assignee === viewStaff);
    }

    return [...tasks].sort((a, b) => {
      if (sortBy === 'due') return a.dueDate.getTime() - b.dueDate.getTime();
      if (sortBy === 'building') return (a.building || '').localeCompare(b.building || '');
      if (sortBy === 'type') return (a.type || '').localeCompare(b.type || '');
      return 0;
    });
  }, [allTasks, isGeneral, myName, viewStaff, sortBy]);

  // 대표 전체보기: 직원별 그룹핑
  const tasksByStaff = useMemo(() => {
    if (!isGeneral || viewStaff !== 'all') return null;
    const grouped: Record<string, Task[]> = {};
    initialStaffMembers.forEach((s: Staff) => { grouped[s.name] = []; });
    grouped['미배정'] = [];

    visibleTasks.forEach(task => {
      const assignee = task.assignee || '미배정';
      if (grouped[assignee]) {
        grouped[assignee].push(task);
      } else {
        grouped['미배정'].push(task);
      }
    });
    return grouped;
  }, [isGeneral, viewStaff, visibleTasks]);

  // 직원별 태스크 수 (대표 탭에 건수 표시용)
  const staffTaskCounts = useMemo(() => {
    if (!isGeneral) return {};
    const counts: Record<string, number> = {};
    allTasks.forEach(t => {
      const a = t.assignee || '미배정';
      counts[a] = (counts[a] || 0) + 1;
    });
    return counts;
  }, [isGeneral, allTasks]);

  // 요약 수치 (현재 보이는 태스크 기준)
  const overdueTasks = useMemo(() =>
    visibleTasks.filter(t => !completedTasks[t.id] && t.overdueDays > 0),
    [visibleTasks, completedTasks]);

  const todayTasks = useMemo(() =>
    visibleTasks.filter(t => {
      const d = t.dueDate;
      return d && formatDate(d) === todayStr;
    }),
    [visibleTasks, todayStr]);

  const weekTasks = useMemo(() =>
    visibleTasks.filter(t => {
      const d = t.dueDate;
      if (!d) return false;
      const diff = daysDiff(today, d);
      return diff > 0 && diff <= 7;
    }),
    [visibleTasks, today]);

  const completedCount = useMemo(() =>
    visibleTasks.filter(t => completedTasks[t.id]).length,
    [visibleTasks, completedTasks]);

  const renderTaskItem = (task: Task) => {
    const isCompleted = !!completedTasks[task.id];
    const completedAt = completedTasks[task.id];
    const typeColor = TYPE_COLORS[task.type] || { bg: '#F1F5F9', color: '#475569' };
    return (
      <div key={task.id} className={`flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9] transition-all duration-150 ${isCompleted ? 'opacity-50 line-through' : ''}`}>
        <div
          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 cursor-pointer text-xs font-bold transition-colors duration-150 ${
            isCompleted
              ? 'border-2 border-emerald-500 bg-emerald-500 text-white'
              : 'border-2 border-slate-300 bg-white hover:border-slate-400'
          }`}
          onClick={() => toggleTask(task.id)}
          title={isCompleted ? '완료 취소' : '완료 처리'}
        >
          {isCompleted && '\u2713'}
        </div>
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap" style={{ background: typeColor.bg, color: typeColor.color }}>{TYPE_LABELS[task.type] || task.type}</span>
            <span className="text-sm font-medium text-slate-800 overflow-hidden text-ellipsis">{task.title}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {task.priority === 'high' && (
              <span className="font-semibold" style={{ color: PRIORITY_COLORS.high }}>긴급</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">{task.building}</span>
          <span className={`inline-block px-2 py-0.5 rounded-[10px] text-xs font-bold whitespace-nowrap ${
            task.overdueDays > 0
              ? 'bg-red-100 text-red-500'
              : task.overdueDays === 0
                ? 'bg-amber-100 text-amber-600'
                : 'bg-hm-blue-bg text-hm-blue'
          }`}>{dDayLabel(task.overdueDays)}</span>
          {isCompleted && completedAt && (
            <span className="text-xs text-emerald-500 whitespace-nowrap">
              {new Date(completedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 완료
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderStaffSection = (staffName: string, tasks: Task[], colorIdx: number) => {
    const colors = STAFF_COLORS[colorIdx % STAFF_COLORS.length];
    const pending = tasks.filter(t => !completedTasks[t.id]);
    const done = tasks.filter(t => completedTasks[t.id]);
    const overdueCount = pending.filter(t => t.overdueDays > 0).length;
    const highCount = pending.filter(t => t.priority === 'high').length;

    return (
      <div key={staffName} className="mb-6">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[10px] border-b border-hm-border" style={{ background: colors.bg, borderLeft: `4px solid ${colors.border}` }}>
          <span className="text-base">👤</span>
          <p className="text-base font-semibold text-slate-800 m-0 flex-1">{staffName}</p>
          {overdueCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-xs font-bold px-1.5">{overdueCount} 지연</span>
          )}
          {highCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-amber-500 text-white text-xs font-bold px-1.5">{highCount} 긴급</span>
          )}
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-white text-xs font-bold px-1.5" style={{ background: colors.badge }}>{pending.length}건</span>
        </div>
        <div className="bg-white border border-hm-border border-t-0 rounded-b-[10px]">
          {pending.length > 0 ? pending.map(renderTaskItem) : (
            <div className="p-6 text-center text-slate-400 text-sm">할 일 없음</div>
          )}
          {done.length > 0 && (
            <details className="border-t border-hm-border">
              <summary className="px-4 py-2 text-sm text-slate-400 cursor-pointer bg-[#FAFBFC] hover:bg-slate-100 transition-colors duration-150">
                완료 {done.length}건
              </summary>
              {done.map(renderTaskItem)}
            </details>
          )}
        </div>
      </div>
    );
  };

  // 일반 직원 뷰: 시간 기반 섹션
  const renderMyTaskSections = () => {
    const pending = visibleTasks.filter(t => !completedTasks[t.id]);
    const done = visibleTasks.filter(t => completedTasks[t.id]);
    const overdue = pending.filter(t => t.overdueDays > 0);
    const todayList = pending.filter(t => {
      const d = t.dueDate;
      return d && formatDate(d) === todayStr && t.overdueDays <= 0;
    });
    const upcoming = pending.filter(t => {
      const d = t.dueDate;
      if (!d) return false;
      const diff = daysDiff(today, d);
      return diff > 0 && diff <= 7;
    });

    return (
      <>
        {overdue.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[10px] bg-hm-danger-bg border-b border-hm-border border-l-4 border-l-red-500">
              <span className="text-base">🔴</span>
              <p className="text-base font-semibold text-slate-800 m-0 flex-1">미완료 (지연)</p>
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-xs font-bold px-1.5">{overdue.length}</span>
            </div>
            <div className="bg-white border border-hm-border border-t-0 rounded-b-[10px]">{overdue.map(renderTaskItem)}</div>
          </div>
        )}
        <div className="mb-6">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[10px] bg-[#FFFBEB] border-b border-hm-border border-l-4 border-l-amber-500">
            <span className="text-base">⚡</span>
            <p className="text-base font-semibold text-slate-800 m-0 flex-1">오늘 할 일</p>
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-amber-500 text-white text-xs font-bold px-1.5">{todayList.length}</span>
          </div>
          <div className="bg-white border border-hm-border border-t-0 rounded-b-[10px]">
            {todayList.length > 0 ? todayList.map(renderTaskItem) : (
              <div className="p-6 text-center text-slate-400 text-sm">오늘 할 일 없음</div>
            )}
          </div>
        </div>
        {upcoming.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[10px] bg-[#F0F9FF] border-b border-hm-border border-l-4 border-l-hm-blue">
              <span className="text-base">📋</span>
              <p className="text-base font-semibold text-slate-800 m-0 flex-1">이번 주 예정</p>
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-hm-blue text-white text-xs font-bold px-1.5">{upcoming.length}</span>
            </div>
            <div className="bg-white border border-hm-border border-t-0 rounded-b-[10px]">{upcoming.map(renderTaskItem)}</div>
          </div>
        )}
        {done.length > 0 && (
          <div className="mb-6">
            <details>
              <summary className="px-4 py-2.5 text-sm font-semibold text-emerald-500 cursor-pointer bg-[#F0FDF4] rounded-[10px] border border-[#D1FAE5] hover:bg-emerald-100 transition-colors duration-150">
                완료 {done.length}건
              </summary>
              <div className="bg-white border border-hm-border rounded-b-[10px] -mt-px">
                {done.map(renderTaskItem)}
              </div>
            </details>
          </div>
        )}
      </>
    );
  };

  const dayName = DAY_NAMES[today.getDay()];
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} (${dayName})`;

  return (
    <div className="p-6 bg-hm-bg-slate min-h-screen font-[Pretendard,-apple-system,BlinkMacSystemFont,sans-serif]">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3 mb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-800 m-0">
            {isGeneral ? '오늘 할 일' : `${myName}님의 할 일`}
          </h1>
          <p className="text-sm text-slate-500 m-0">{dateStr}</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-1.5 items-center text-sm text-slate-500">
            <span>정렬:</span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className={`px-2.5 py-1 rounded-md border-none text-xs cursor-pointer transition-colors duration-150 ${
                  sortBy === opt.key
                    ? 'bg-hm-blue text-white font-semibold'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
                onClick={() => setSortBy(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 대표용: 직원 선택 탭 */}
      {isGeneral && (
        <div className="flex gap-1.5 flex-wrap items-center mb-4 px-4 py-3 bg-white rounded-xl border border-hm-border">
          <span className="text-sm font-semibold text-gray-700 mr-1">직원:</span>
          <button
            className={`px-3.5 py-1.5 rounded-full text-sm cursor-pointer transition-all duration-150 flex items-center gap-1.5 ${
              viewStaff === 'all'
                ? 'border-2 border-hm-blue bg-hm-blue-bg text-hm-blue font-bold'
                : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400'
            }`}
            onClick={() => setViewStaff('all')}
          >
            전체
            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-[9px] text-xs font-bold px-1 ${
              viewStaff === 'all' ? 'bg-hm-blue text-white' : 'bg-slate-200 text-slate-500'
            }`}>{allTasks.length}</span>
          </button>
          {initialStaffMembers.map((staff: Staff) => {
            const count = staffTaskCounts[staff.name] || 0;
            return (
              <button
                key={staff.id}
                className={`px-3.5 py-1.5 rounded-full text-sm cursor-pointer transition-all duration-150 flex items-center gap-1.5 ${
                  viewStaff === staff.name
                    ? 'border-2 border-hm-blue bg-hm-blue-bg text-hm-blue font-bold'
                    : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                }`}
                onClick={() => setViewStaff(staff.name)}
              >
                {staff.name}
                {count > 0 && <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-[9px] text-xs font-bold px-1 ${
                  viewStaff === staff.name ? 'bg-hm-blue text-white' : 'bg-slate-200 text-slate-500'
                }`}>{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* 커스텀 태스크 추가 */}
      <div className="flex gap-2 items-center mb-4">
        {showAddTask ? (
          <div className="flex gap-2 items-center flex-1 px-4 py-2.5 bg-white rounded-xl border-2 border-hm-blue">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addCustomTask(); if (e.key === 'Escape') { setShowAddTask(false); setNewTaskTitle(''); } }}
              placeholder="할 일을 입력하세요..."
              autoFocus
              className="flex-1 border-none outline-none text-sm font-inherit bg-transparent"
            />
            <button onClick={addCustomTask}
              className="px-4 py-1.5 rounded-lg border-none bg-hm-blue text-white text-sm font-bold cursor-pointer font-inherit whitespace-nowrap hover:bg-blue-600 transition-colors duration-150">
              추가
            </button>
            <button onClick={() => { setShowAddTask(false); setNewTaskTitle(''); }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 text-sm font-semibold cursor-pointer font-inherit hover:bg-slate-50 transition-colors duration-150">
              취소
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAddTask(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] border-[1.5px] border-dashed border-slate-300 bg-white text-hm-blue text-sm font-bold cursor-pointer font-inherit transition-all duration-150 hover:border-hm-blue hover:bg-hm-blue-bg">
            <span className="text-lg leading-none">+</span> 직접 할 일 추가
          </button>
        )}
      </div>

      {/* 커스텀 태스크 목록 (직접등록) */}
      {customTasks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[10px] bg-[#F0F9FF] border-b border-hm-border border-l-4 border-l-violet-500">
            <span className="text-base">📌</span>
            <p className="text-base font-semibold text-slate-800 m-0 flex-1">직접 등록한 할 일</p>
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-violet-500 text-white text-xs font-bold px-1.5">{customTasks.length}</span>
          </div>
          <div className="bg-white border border-hm-border border-t-0 rounded-b-[10px]">
            {customTasks.map(ct => {
              const isCompleted = !!completedTasks[ct.id];
              return (
                <div key={ct.id} className={`flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9] justify-between transition-all duration-150 ${isCompleted ? 'opacity-50 line-through' : ''}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 cursor-pointer text-xs font-bold transition-colors duration-150 ${
                      isCompleted
                        ? 'border-2 border-emerald-500 bg-emerald-500 text-white'
                        : 'border-2 border-slate-300 bg-white hover:border-slate-400'
                    }`} onClick={() => toggleTask(ct.id)}>
                      {isCompleted && '\u2713'}
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap" style={{ background: TYPE_COLORS.custom.bg, color: TYPE_COLORS.custom.color }}>직접등록</span>
                        <span className="text-sm font-medium text-slate-800 overflow-hidden text-ellipsis">{ct.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{new Date(ct.createdAt).toLocaleDateString('ko-KR')} 등록</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeCustomTask(ct.id)}
                    className="border-none bg-none text-base cursor-pointer text-slate-400 px-2 py-1 hover:text-slate-600 transition-colors duration-150"
                    title="삭제">✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 mb-6">
        {[
          { count: overdueTasks.length, label: '미완료 (지연)', color: '#EF4444' },
          { count: todayTasks.length, label: '오늘 할 일', color: '#F59E0B' },
          { count: weekTasks.length, label: '이번 주 예정', color: 'var(--color-hm-blue)' },
          { count: completedCount, label: '완료', color: '#10B981' },
        ].map(card => (
          <div key={card.label} className="bg-white border border-hm-border rounded-xl p-4 flex flex-col items-center gap-1" style={{ borderBottom: `3px solid ${card.color}` }}>
            <p className="text-2xl font-bold m-0" style={{ color: card.color }}>{card.count}</p>
            <p className="text-sm text-slate-500 m-0">{card.label}</p>
          </div>
        ))}
      </div>

      {/* 태스크 목록 */}
      {isGeneral && viewStaff === 'all' ? (
        // 대표 전체보기: 직원별 그룹
        [...initialStaffMembers.map((s: Staff) => s.name), '미배정'].map((name, idx) => {
          const tasks = (tasksByStaff && tasksByStaff[name]) || [];
          if (tasks.length === 0) return null;
          return renderStaffSection(name, tasks, idx);
        })
      ) : isGeneral && viewStaff !== 'all' ? (
        // 대표가 특정 직원 선택: 시간 기반 섹션
        renderMyTaskSections()
      ) : (
        // 일반 직원: 자기 할 일만 시간 기반
        renderMyTaskSections()
      )}
    </div>
  );
}
