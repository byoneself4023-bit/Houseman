import { useState, useMemo, useCallback } from 'react';
import { patrolBuildings } from '../data/patrolData';
import { asItems } from '../data/asItems';
import { useIsMobile } from '../utils';

// ── 권역 매핑 ──
const REGIONS = {
  '관악/동작': ['관악구', '동작구'],
  '강남/서초': ['강남구', '서초구'],
  '중구/마포': ['중구', '마포구', '용산구'],
  '영등포/구로': ['영등포구', '구로구', '금천구'],
  '남양주/외곽': ['남양주', '양주'],
  '기타': [],
};

const REGION_KEYS = Object.keys(REGIONS);

// ── 태스크 유형별 색상 ──
const TASK_COLORS = {
  as: '#EF4444',
  patrol: '#3B82F6',
  meter: '#F59E0B',
  moveinout: '#10B981',
};

const TASK_LABELS = {
  as: 'AS',
  patrol: '순회',
  meter: '검침',
  moveinout: '입퇴실',
};

const WEEKDAY_NAMES = ['월요일', '화요일', '수요일', '목요일', '금요일'];

// ── 주소에서 권역 추출 ──
function getRegion(address) {
  if (!address) return '기타';
  for (const [region, keywords] of Object.entries(REGIONS)) {
    if (region === '기타') continue;
    for (const kw of keywords) {
      if (address.includes(kw)) return region;
    }
  }
  return '기타';
}

// ── 주의 월~금 날짜 계산 ──
function getWeekDates(weekOffset) {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Mon offset
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function daysBetween(dateStr, refDate) {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const ref = refDate || new Date();
  return Math.floor((ref - d) / (1000 * 60 * 60 * 24));
}

// ── 시간 슬롯 생성 ──
function timeSlots(count, start = '09:30') {
  const [h, m] = start.split(':').map(Number);
  const slots = [];
  let minutes = h * 60 + m;
  for (let i = 0; i < count; i++) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
    minutes += 60; // 1시간 간격
    if (minutes === 12 * 60) minutes = 13 * 60; // 점심시간 skip
  }
  return slots;
}

export function RouteSchedulePage({ myBuildings = [], buildingData = {}, activeTenants = [] }) {
  const isMobile = useIsMobile();
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedDay, setExpandedDay] = useState(null);
  const [highlightedBuilding, setHighlightedBuilding] = useState(null);
  const [scheduleOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hm_routeSchedule') || '{}');
    } catch { return {}; }
  });

  const today = new Date();
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekLabel = weekOffset === 0 ? '이번 주' : weekOffset === 1 ? '다음 주' : `${weekOffset > 0 ? '+' : ''}${weekOffset}주`;

  // ── 건물별 주소/권역 매핑 ──
  const buildingRegions = useMemo(() => {
    const map = {};
    const allNames = new Set([
      ...patrolBuildings.map(b => b.building),
      ...(myBuildings.length > 0 ? myBuildings : []),
    ]);
    for (const name of allNames) {
      const bd = buildingData[name];
      const addr = bd?.address || '';
      map[name] = { address: addr, region: getRegion(addr) };
    }
    return map;
  }, [buildingData, myBuildings]);

  // ── 건물별 미처리 태스크 수집 ──
  const pendingTasks = useMemo(() => {
    const tasks = []; // { building, type, label, priority, daysSince }

    // 1) AS 미완료
    const pendingAS = asItems.filter(a => a.status !== '완료');
    for (const a of pendingAS) {
      tasks.push({
        building: a.building,
        type: 'as',
        label: `${a.room}호 ${a.content}`,
        priority: a.priority === '높음' ? 1 : a.priority === '보통' ? 2 : 3,
        daysSince: daysBetween(a.date, today),
      });
    }

    // 2) 순회 지연 (30일 * freq 초과)
    const relevantPatrol = myBuildings.length > 0
      ? patrolBuildings.filter(b => myBuildings.includes(b.building))
      : patrolBuildings;

    for (const pb of relevantPatrol) {
      const threshold = 30 / (pb.freq || 1);
      const elapsed = daysBetween(pb.lastDate, today);
      if (elapsed > threshold) {
        tasks.push({
          building: pb.building,
          type: 'patrol',
          label: `${elapsed}일 경과`,
          priority: elapsed > 45 ? 1 : elapsed > 30 ? 2 : 3,
          daysSince: elapsed,
        });
      }
    }

    // 3) 입퇴실 관련 (activeTenants에서 moveIn/moveOut 근접건)
    for (const t of activeTenants) {
      if (!t.building) continue;
      const moveIn = t.moveIn || t.startDate;
      const moveOut = t.moveOut || t.endDate;
      for (const [dateStr, taskLabel] of [[moveIn, '입주 체크'], [moveOut, '퇴실 체크']]) {
        if (!dateStr) continue;
        const diff = daysBetween(toDateStr(today), new Date(dateStr)); // future days
        const diffAbs = Math.abs(daysBetween(dateStr, today));
        if (diffAbs <= 14) {
          tasks.push({
            building: t.building,
            type: 'moveinout',
            label: `${taskLabel}: ${t.room || ''}호`,
            priority: 2,
            daysSince: diffAbs,
            targetDate: dateStr,
          });
        }
      }
    }

    return tasks;
  }, [myBuildings, activeTenants, today.toDateString()]);

  // ── 권역별 그룹 + 주간 배분 ──
  const { dailySchedule, unassigned, delayRanking } = useMemo(() => {
    // 건물별 태스크 그룹핑
    const buildingTasks = {};
    for (const t of pendingTasks) {
      if (!buildingTasks[t.building]) buildingTasks[t.building] = [];
      buildingTasks[t.building].push(t);
    }

    // 권역별 건물 그룹
    const regionBuildings = {};
    for (const [bName, tasks] of Object.entries(buildingTasks)) {
      const region = buildingRegions[bName]?.region || '기타';
      if (!regionBuildings[region]) regionBuildings[region] = [];
      regionBuildings[region].push({ building: bName, tasks, priority: Math.min(...tasks.map(t => t.priority)) });
    }

    // 권역을 요일에 배분 (우선순위 높은 것부터)
    const regions = Object.entries(regionBuildings).sort((a, b) => {
      const aPri = Math.min(...a[1].map(x => x.priority));
      const bPri = Math.min(...b[1].map(x => x.priority));
      return aPri - bPri || b[1].length - a[1].length;
    });

    const daily = Array.from({ length: 5 }, () => ({ region: '', buildings: [] }));
    const unassignedList = [];

    // 가용한 요일에 권역 배분
    let dayIdx = 0;
    for (const [region, buildings] of regions) {
      if (region === '남양주/외곽' || region === '기타') {
        // 외곽은 미배정으로
        for (const b of buildings) {
          unassignedList.push({ ...b, region });
        }
        continue;
      }

      // 같은 권역 건물이 5개 넘으면 여러 날로 분배
      const sorted = [...buildings].sort((a, b) => a.priority - b.priority);
      const perDay = Math.ceil(sorted.length / Math.max(1, Math.ceil(sorted.length / 6)));
      let chunk = [];

      for (let i = 0; i < sorted.length; i++) {
        chunk.push(sorted[i]);
        if (chunk.length >= perDay || i === sorted.length - 1) {
          if (dayIdx < 5) {
            daily[dayIdx].region = region;
            daily[dayIdx].buildings = chunk;
            dayIdx++;
          } else {
            unassignedList.push(...chunk.map(b => ({ ...b, region })));
          }
          chunk = [];
        }
      }
    }

    // scheduleOverrides 적용
    for (const [key, override] of Object.entries(scheduleOverrides)) {
      const idx = parseInt(key);
      if (!isNaN(idx) && idx >= 0 && idx < 5 && override) {
        // override format: { region, buildings } — manual overrides preserved
      }
    }

    // 순회 지연 랭킹
    const patrolTasks = pendingTasks
      .filter(t => t.type === 'patrol')
      .sort((a, b) => b.daysSince - a.daysSince)
      .slice(0, 5);

    return { dailySchedule: daily, unassigned: unassignedList, delayRanking: patrolTasks };
  }, [pendingTasks, buildingRegions, scheduleOverrides]);

  // ── 근처 건물 제안 ──
  const nearbyBuildings = useMemo(() => {
    if (!highlightedBuilding) return [];
    const region = buildingRegions[highlightedBuilding]?.region;
    if (!region) return [];
    return pendingTasks
      .filter(t => t.building !== highlightedBuilding && buildingRegions[t.building]?.region === region)
      .reduce((acc, t) => {
        if (!acc.find(x => x.building === t.building)) {
          acc.push({ building: t.building, type: t.type, label: t.label });
        }
        return acc;
      }, [])
      .slice(0, 5);
  }, [highlightedBuilding, pendingTasks, buildingRegions]);

  const toggleDay = useCallback((idx) => {
    setExpandedDay(prev => prev === idx ? null : idx);
  }, []);

  // ── Styles ──
  const containerStyle = {
    padding: isMobile ? 16 : 24,
    maxWidth: 1200,
    margin: '0 auto',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  };

  const navBtnStyle = {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
  };

  const weekLabelStyle = {
    fontSize: isMobile ? 16 : 20,
    fontWeight: 800,
    color: '#111827',
  };

  const mainGrid = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : nearbyBuildings.length > 0 || delayRanking.length > 0 ? '1fr 300px' : '1fr',
    gap: 20,
  };

  const cardStyle = {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #E8ECF0',
    padding: 16,
    marginBottom: 12,
    cursor: 'pointer',
    transition: 'box-shadow 0.15s',
  };

  const dotStyle = (color) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  });

  const lineStyle = {
    width: 2,
    background: '#E5E7EB',
    minHeight: 24,
    marginLeft: 4,
  };

  const taskBadge = (type) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    background: TASK_COLORS[type] || '#6B7280',
    marginRight: 6,
  });

  return (
    <div style={containerStyle}>
      {/* ── Header / Week Nav ── */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#111827' }}>
            순회 동선 제안
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', background: '#F3F4F6', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>
            {pendingTasks.length}건 미처리
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={navBtnStyle} onClick={() => setWeekOffset(w => w - 1)}>&lt;</button>
          <div style={weekLabelStyle}>
            {weekLabel} ({formatDate(weekDates[0])} ~ {formatDate(weekDates[4])})
          </div>
          <button style={navBtnStyle} onClick={() => setWeekOffset(w => w + 1)}>&gt;</button>
          {weekOffset !== 0 && (
            <button
              style={{ ...navBtnStyle, fontSize: 12, padding: '4px 10px', color: '#6B7280' }}
              onClick={() => setWeekOffset(0)}
            >
              오늘
            </button>
          )}
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(TASK_LABELS).map(([type, label]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}>
            <div style={dotStyle(TASK_COLORS[type])} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div style={mainGrid}>
        {/* ── Left: Daily Schedule Cards ── */}
        <div>
          {dailySchedule.map((day, idx) => {
            const date = weekDates[idx];
            const isExpanded = expandedDay === idx || !isMobile;
            const totalTasks = day.buildings.reduce((s, b) => s + b.tasks.length, 0);
            const slots = timeSlots(totalTasks);
            let slotIdx = 0;

            return (
              <div
                key={idx}
                style={{
                  ...cardStyle,
                  borderLeft: `4px solid ${totalTasks > 0 ? '#3B82F6' : '#E5E7EB'}`,
                }}
                onClick={() => isMobile && toggleDay(idx)}
              >
                {/* Day Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded && totalTasks > 0 ? 12 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>
                      {WEEKDAY_NAMES[idx]} ({formatDate(date)})
                    </span>
                    {day.region && (
                      <span style={{ fontSize: 12, color: '#6366F1', background: '#EEF2FF', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>
                        {day.region} 권역
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: totalTasks > 0 ? '#3B82F6' : '#9CA3AF' }}>
                    {totalTasks}건
                  </span>
                </div>

                {/* Timeline */}
                {isExpanded && totalTasks > 0 && (
                  <div style={{ paddingLeft: 4 }}>
                    {day.buildings.map((b, bIdx) => (
                      b.tasks.map((task, tIdx) => {
                        const isFirst = bIdx === 0 && tIdx === 0;
                        const isLast = bIdx === day.buildings.length - 1 && tIdx === b.tasks.length - 1;
                        const currentSlot = slots[slotIdx] || '';
                        slotIdx++;

                        return (
                          <div
                            key={`${b.building}-${tIdx}`}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative' }}
                            onMouseEnter={() => setHighlightedBuilding(b.building)}
                            onMouseLeave={() => setHighlightedBuilding(null)}
                          >
                            {/* Timeline connector */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10 }}>
                              {!isFirst && <div style={lineStyle} />}
                              <div style={dotStyle(TASK_COLORS[task.type])} />
                              {!isLast && <div style={{ ...lineStyle, flex: 1 }} />}
                            </div>

                            {/* Content */}
                            <div style={{
                              flex: 1,
                              paddingBottom: isLast ? 0 : 8,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              flexWrap: 'wrap',
                            }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', minWidth: 40, fontVariantNumeric: 'tabular-nums' }}>
                                {currentSlot}
                              </span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                                {b.building}
                              </span>
                              <span style={taskBadge(task.type)}>
                                {TASK_LABELS[task.type]}
                              </span>
                              <span style={{ fontSize: 12, color: '#6B7280' }}>
                                {task.label}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ))}
                  </div>
                )}

                {/* Empty day */}
                {totalTasks === 0 && (
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                    배정된 일정 없음
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Unassigned Section ── */}
          {unassigned.length > 0 && (
            <div style={{ ...cardStyle, borderLeft: '4px solid #F59E0B', background: '#FFFBEB' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#92400E', marginBottom: 8 }}>
                {'\u26A0\uFE0F'} 미배정 건물 (별도 일정 필요)
              </div>
              {unassigned.map((b, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}
                  onMouseEnter={() => setHighlightedBuilding(b.building)}
                  onMouseLeave={() => setHighlightedBuilding(null)}
                >
                  <span style={{ fontWeight: 700, color: '#111827' }}>{b.building}</span>
                  {b.region && (
                    <span style={{ fontSize: 11, color: '#92400E' }}>({b.region})</span>
                  )}
                  <span style={{ color: '#6B7280' }}>
                    {b.tasks.map(t => `${TASK_LABELS[t.type]} ${t.label}`).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        {!isMobile && (
          <div>
            {/* 근처 건물 제안 */}
            {highlightedBuilding && nearbyBuildings.length > 0 && (
              <div style={{ ...cardStyle, background: '#F0F9FF', borderColor: '#BAE6FD' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0369A1', marginBottom: 8 }}>
                  {'\uD83D\uDCCD'} 근처 건물 제안
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                  <strong>{highlightedBuilding}</strong>에서 같은 권역 내:
                </div>
                {nearbyBuildings.map((nb, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 12 }}>
                    <div style={dotStyle(TASK_COLORS[nb.type])} />
                    <span style={{ fontWeight: 600, color: '#111827' }}>{nb.building}</span>
                    <span style={{ color: '#6B7280' }}>({TASK_LABELS[nb.type]} {nb.label})</span>
                  </div>
                ))}
              </div>
            )}

            {/* 순회 지연 TOP 5 */}
            {delayRanking.length > 0 && (
              <div style={{ ...cardStyle }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 10 }}>
                  순회 지연 TOP {delayRanking.length}
                </div>
                {delayRanking.map((t, i) => {
                  const severity = t.daysSince > 45 ? '#EF4444' : t.daysSince > 30 ? '#F59E0B' : '#9CA3AF';
                  const icon = t.daysSince > 45 ? '\uD83D\uDD34' : t.daysSince > 30 ? '\uD83D\uDFE1' : '';
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: i < delayRanking.length - 1 ? '1px solid #F3F4F6' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#9CA3AF', width: 18 }}>{i + 1}.</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{t.building}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: severity }}>{t.daysSince}일 경과</span>
                        <span style={{ fontSize: 12 }}>{icon}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 요약 통계 */}
            <div style={{ ...cardStyle, background: '#F9FAFB' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
                이번 주 요약
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Object.entries(TASK_LABELS).map(([type, label]) => {
                  const count = pendingTasks.filter(t => t.type === type).length;
                  return (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <div style={dotStyle(TASK_COLORS[type])} />
                      <span style={{ color: '#6B7280' }}>{label}</span>
                      <span style={{ fontWeight: 800, color: '#111827' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #E5E7EB', fontSize: 12, color: '#6B7280' }}>
                총 <strong style={{ color: '#111827' }}>{new Set(pendingTasks.map(t => t.building)).size}</strong>개 건물 /{' '}
                <strong style={{ color: '#111827' }}>{pendingTasks.length}</strong>건 미처리
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile: delay ranking at bottom ── */}
      {isMobile && delayRanking.length > 0 && (
        <div style={{ ...cardStyle, marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 10 }}>
            순회 지연 TOP {delayRanking.length}
          </div>
          {delayRanking.map((t, i) => {
            const severity = t.daysSince > 45 ? '#EF4444' : t.daysSince > 30 ? '#F59E0B' : '#9CA3AF';
            const icon = t.daysSince > 45 ? '\uD83D\uDD34' : t.daysSince > 30 ? '\uD83D\uDFE1' : '';
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: i < delayRanking.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#9CA3AF', width: 18 }}>{i + 1}.</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{t.building}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: severity }}>{t.daysSince}일 경과</span>
                  <span style={{ fontSize: 12 }}>{icon}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
