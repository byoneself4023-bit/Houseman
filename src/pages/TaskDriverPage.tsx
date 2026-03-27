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
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  settlement: { bg: '#DBEAFE', color: '#1E40AF' },
  renewal: { bg: '#FEF3C7', color: '#92400E' },
  patrol: { bg: '#D1FAE5', color: '#065F46' },
  as: { bg: '#FCE7F3', color: '#9D174D' },
  vacancy: { bg: '#F3E8FF', color: '#6B21A8' },
  movein: { bg: '#CCFBF1', color: '#134E4A' },
  moveout: { bg: '#FFF7ED', color: '#9A3412' },
  billing: { bg: '#FEF2F2', color: '#DC2626' },
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
  { bg: '#EFF6FF', border: '#3B82F6', badge: '#3B82F6' },
  { bg: '#F0FDF4', border: '#22C55E', badge: '#16A34A' },
  { bg: '#FFF7ED', border: '#F97316', badge: '#EA580C' },
  { bg: '#FDF4FF', border: '#A855F7', badge: '#9333EA' },
  { bg: '#FEF2F2', border: '#EF4444', badge: '#DC2626' },
  { bg: '#ECFDF5', border: '#10B981', badge: '#059669' },
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

    return tasks;
  }, [myBuildings, activeTenants, activeVacancies, calendarEvts, buildingData, roomBalances, today]);

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

  // Styles
  const s = {
    page: {
      padding: '24px',
      background: '#F8FAFC',
      minHeight: '100vh',
      fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    } as React.CSSProperties,
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '12px', marginBottom: '20px' } as React.CSSProperties,
    headerLeft: { display: 'flex', flexDirection: 'column' as const, gap: '4px' } as React.CSSProperties,
    title: { fontSize: '24px', fontWeight: '700', color: '#1E293B', margin: 0 } as React.CSSProperties,
    dateLabel: { fontSize: '14px', color: '#64748B', margin: 0 } as React.CSSProperties,
    staffTabRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const, alignItems: 'center', marginBottom: '16px', padding: '12px 16px', background: '#fff', borderRadius: '12px', border: '1px solid #E8ECF0' } as React.CSSProperties,
    staffTab: (active: boolean): React.CSSProperties => ({ padding: '6px 14px', borderRadius: '20px', border: active ? '2px solid #3B82F6' : '1px solid #CBD5E1', background: active ? '#EFF6FF' : '#fff', color: active ? '#3B82F6' : '#475569', fontWeight: active ? '700' : '400', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px' }),
    staffTabCount: (active: boolean): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px', borderRadius: '9px', background: active ? '#3B82F6' : '#E2E8F0', color: active ? '#fff' : '#64748B', fontSize: '11px', fontWeight: '700', padding: '0 4px' }),
    sortRow: { display: 'flex', gap: '6px', alignItems: 'center', fontSize: '13px', color: '#64748B' } as React.CSSProperties,
    sortBtn: (active: boolean): React.CSSProperties => ({ padding: '4px 10px', borderRadius: '6px', border: 'none', background: active ? '#3B82F6' : '#E2E8F0', color: active ? '#fff' : '#475569', fontWeight: active ? '600' : '400', fontSize: '12px', cursor: 'pointer' }),
    summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' } as React.CSSProperties,
    summaryCard: (color: string): React.CSSProperties => ({ background: '#fff', border: '1px solid #E8ECF0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', borderBottom: `3px solid ${color}` }),
    summaryNum: (color: string): React.CSSProperties => ({ fontSize: '28px', fontWeight: '700', color, margin: 0 }),
    summaryLabel: { fontSize: '13px', color: '#64748B', margin: 0 } as React.CSSProperties,
    section: { marginBottom: '24px' } as React.CSSProperties,
    sectionHeader: (bgColor: string): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px 10px 0 0', background: bgColor, borderBottom: '1px solid #E8ECF0' }),
    sectionTitle: { fontSize: '15px', fontWeight: '600', color: '#1E293B', margin: 0 } as React.CSSProperties,
    sectionBadge: (bg: string, color: string): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '22px', height: '22px', borderRadius: '11px', background: bg, color, fontSize: '12px', fontWeight: '700', padding: '0 6px' }),
    sectionBody: { background: '#fff', border: '1px solid #E8ECF0', borderTop: 'none', borderRadius: '0 0 10px 10px' } as React.CSSProperties,
    taskItem: (isCompleted: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #F1F5F9', opacity: isCompleted ? 0.5 : 1, textDecoration: isCompleted ? 'line-through' : 'none', transition: 'all 0.15s' }),
    checkbox: (isCompleted: boolean): React.CSSProperties => ({ width: '20px', height: '20px', borderRadius: '4px', border: isCompleted ? '2px solid #10B981' : '2px solid #CBD5E1', background: isCompleted ? '#10B981' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: '12px', fontWeight: '700' }),
    taskContent: { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '2px', minWidth: 0 } as React.CSSProperties,
    taskTopRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const } as React.CSSProperties,
    typeBadge: (type: string): React.CSSProperties => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', background: (TYPE_COLORS[type] || { bg: '#F1F5F9' }).bg, color: (TYPE_COLORS[type] || { color: '#475569' }).color, whiteSpace: 'nowrap' }),
    taskTitle: { fontSize: '14px', fontWeight: '500', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis' } as React.CSSProperties,
    taskBottomRow: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#94A3B8' } as React.CSSProperties,
    taskRight: { display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: '4px', flexShrink: 0 } as React.CSSProperties,
    buildingLabel: { fontSize: '12px', fontWeight: '500', color: '#64748B', whiteSpace: 'nowrap' } as React.CSSProperties,
    dDayBadge: (overdueDays: number): React.CSSProperties => {
      let bg = '#EFF6FF';
      let color = '#3B82F6';
      if (overdueDays > 0) { bg = '#FEE2E2'; color = '#EF4444'; }
      else if (overdueDays === 0) { bg = '#FEF3C7'; color = '#D97706'; }
      return { display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: bg, color, whiteSpace: 'nowrap' };
    },
    completedTime: { fontSize: '11px', color: '#10B981', whiteSpace: 'nowrap' } as React.CSSProperties,
    emptySection: { padding: '24px', textAlign: 'center' as const, color: '#94A3B8', fontSize: '14px' } as React.CSSProperties,
  };

  const renderTaskItem = (task: Task) => {
    const isCompleted = !!completedTasks[task.id];
    const completedAt = completedTasks[task.id];
    return (
      <div key={task.id} style={s.taskItem(isCompleted)}>
        <div
          style={s.checkbox(isCompleted)}
          onClick={() => toggleTask(task.id)}
          title={isCompleted ? '완료 취소' : '완료 처리'}
        >
          {isCompleted && '\u2713'}
        </div>
        <div style={s.taskContent}>
          <div style={s.taskTopRow}>
            <span style={s.typeBadge(task.type)}>{TYPE_LABELS[task.type] || task.type}</span>
            <span style={s.taskTitle}>{task.title}</span>
          </div>
          <div style={s.taskBottomRow}>
            {task.priority === 'high' && (
              <span style={{ color: PRIORITY_COLORS.high, fontWeight: '600' }}>긴급</span>
            )}
          </div>
        </div>
        <div style={s.taskRight}>
          <span style={s.buildingLabel}>{task.building}</span>
          <span style={s.dDayBadge(task.overdueDays)}>{dDayLabel(task.overdueDays)}</span>
          {isCompleted && completedAt && (
            <span style={s.completedTime}>
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
      <div key={staffName} style={s.section}>
        <div style={{
          ...s.sectionHeader(colors.bg),
          borderLeft: `4px solid ${colors.border}`,
        }}>
          <span style={{ fontSize: '16px' }}>👤</span>
          <p style={{ ...s.sectionTitle, flex: 1 }}>{staffName}</p>
          {overdueCount > 0 && (
            <span style={s.sectionBadge('#EF4444', '#fff')}>{overdueCount} 지연</span>
          )}
          {highCount > 0 && (
            <span style={s.sectionBadge('#F59E0B', '#fff')}>{highCount} 긴급</span>
          )}
          <span style={s.sectionBadge(colors.badge, '#fff')}>{pending.length}건</span>
        </div>
        <div style={s.sectionBody}>
          {pending.length > 0 ? pending.map(renderTaskItem) : (
            <div style={s.emptySection}>할 일 없음</div>
          )}
          {done.length > 0 && (
            <details style={{ borderTop: '1px solid #E8ECF0' }}>
              <summary style={{
                padding: '8px 16px',
                fontSize: '13px',
                color: '#94A3B8',
                cursor: 'pointer',
                background: '#FAFBFC',
              }}>
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
          <div style={s.section}>
            <div style={{ ...s.sectionHeader('#FEF2F2'), borderLeft: '4px solid #EF4444' }}>
              <span style={{ fontSize: '16px' }}>🔴</span>
              <p style={{ ...s.sectionTitle, flex: 1 }}>미완료 (지연)</p>
              <span style={s.sectionBadge('#EF4444', '#fff')}>{overdue.length}</span>
            </div>
            <div style={s.sectionBody}>{overdue.map(renderTaskItem)}</div>
          </div>
        )}
        <div style={s.section}>
          <div style={{ ...s.sectionHeader('#FFFBEB'), borderLeft: '4px solid #F59E0B' }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <p style={{ ...s.sectionTitle, flex: 1 }}>오늘 할 일</p>
            <span style={s.sectionBadge('#F59E0B', '#fff')}>{todayList.length}</span>
          </div>
          <div style={s.sectionBody}>
            {todayList.length > 0 ? todayList.map(renderTaskItem) : (
              <div style={s.emptySection}>오늘 할 일 없음</div>
            )}
          </div>
        </div>
        {upcoming.length > 0 && (
          <div style={s.section}>
            <div style={{ ...s.sectionHeader('#F0F9FF'), borderLeft: '4px solid #3B82F6' }}>
              <span style={{ fontSize: '16px' }}>📋</span>
              <p style={{ ...s.sectionTitle, flex: 1 }}>이번 주 예정</p>
              <span style={s.sectionBadge('#3B82F6', '#fff')}>{upcoming.length}</span>
            </div>
            <div style={s.sectionBody}>{upcoming.map(renderTaskItem)}</div>
          </div>
        )}
        {done.length > 0 && (
          <div style={s.section}>
            <details>
              <summary style={{
                padding: '10px 16px', fontSize: '14px', fontWeight: '600', color: '#10B981',
                cursor: 'pointer', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #D1FAE5',
              }}>
                완료 {done.length}건
              </summary>
              <div style={{ ...s.sectionBody, borderRadius: '0 0 10px 10px', marginTop: '-1px' }}>
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
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <h1 style={s.title}>
            {isGeneral ? '오늘 할 일' : `${myName}님의 할 일`}
          </h1>
          <p style={s.dateLabel}>{dateStr}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <div style={s.sortRow}>
            <span>정렬:</span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                style={s.sortBtn(sortBy === opt.key)}
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
        <div style={s.staffTabRow}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginRight: '4px' }}>직원:</span>
          <button
            style={s.staffTab(viewStaff === 'all')}
            onClick={() => setViewStaff('all')}
          >
            전체
            <span style={s.staffTabCount(viewStaff === 'all')}>{allTasks.length}</span>
          </button>
          {initialStaffMembers.map((staff: Staff) => {
            const count = staffTaskCounts[staff.name] || 0;
            return (
              <button
                key={staff.id}
                style={s.staffTab(viewStaff === staff.name)}
                onClick={() => setViewStaff(staff.name)}
              >
                {staff.name}
                {count > 0 && <span style={s.staffTabCount(viewStaff === staff.name)}>{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Summary cards */}
      <div style={s.summaryRow}>
        <div style={s.summaryCard('#EF4444')}>
          <p style={s.summaryNum('#EF4444')}>{overdueTasks.length}</p>
          <p style={s.summaryLabel}>미완료 (지연)</p>
        </div>
        <div style={s.summaryCard('#F59E0B')}>
          <p style={s.summaryNum('#F59E0B')}>{todayTasks.length}</p>
          <p style={s.summaryLabel}>오늘 할 일</p>
        </div>
        <div style={s.summaryCard('#3B82F6')}>
          <p style={s.summaryNum('#3B82F6')}>{weekTasks.length}</p>
          <p style={s.summaryLabel}>이번 주 예정</p>
        </div>
        <div style={s.summaryCard('#10B981')}>
          <p style={s.summaryNum('#10B981')}>{completedCount}</p>
          <p style={s.summaryLabel}>완료</p>
        </div>
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
