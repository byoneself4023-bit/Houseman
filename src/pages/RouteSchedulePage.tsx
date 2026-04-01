import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { patrolBuildings } from '@/data/patrolData';
import { asItems } from '@/data/asItems';
import { useIsMobile } from '@/utils';
import { useLocalStorage } from '@/utils/useLocalStorage';
import { initialStaffMembers } from '@/config';
import { buildingCoords } from '@/data/buildingCoords';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── 권역 매핑 ──
const REGIONS: Record<string, string[]> = {
  '관악/동작': ['관악구', '동작구'],
  '강남/서초': ['강남구', '서초구'],
  '중구/마포': ['중구', '마포구', '용산구'],
  '영등포/구로': ['영등포구', '구로구', '금천구'],
  '남양주/외곽': ['남양주', '양주'],
  '기타': [],
};

const REGION_KEYS = Object.keys(REGIONS);

// ── 태스크 유형별 색상 ──
const TASK_COLORS: Record<string, string> = {
  as: '#EF4444',
  patrol: 'var(--color-hm-blue)',
  meter: '#F59E0B',
  moveinout: '#10B981',
};

const TASK_LABELS: Record<string, string> = {
  as: 'AS',
  patrol: '순회',
  meter: '검침',
  moveinout: '입퇴실',
};

const WEEKDAY_NAMES = ['월요일', '화요일', '수요일', '목요일', '금요일'];

// ── 주소에서 권역 추출 ──
function getRegion(address: string): string {
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
function getWeekDates(weekOffset: number): Date[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Mon offset
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function daysBetween(dateStr: string | undefined, refDate?: Date): number {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const ref = refDate || new Date();
  return Math.floor((ref.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Haversine 거리 계산 (km) ──
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface PendingTask {
  building: string;
  type: string;
  label: string;
  priority: number;
  daysSince: number;
  targetDate?: string;
}

interface BuildingTask {
  building: string;
  tasks: PendingTask[];
  priority: number;
  region?: string;
}

// ── 최근접 이웃 알고리즘으로 동선 최적화 ──
function optimizeRoute(buildings: BuildingTask[]): BuildingTask[] {
  if (buildings.length <= 1) return buildings;
  const coords = buildings.map(b => buildingCoords[b.building]).filter(Boolean);
  if (coords.length < 2) return buildings;

  const remaining = [...buildings];
  const route = [remaining.shift()!];

  while (remaining.length > 0) {
    const last = route[route.length - 1];
    const lastCoord = buildingCoords[last.building];
    if (!lastCoord) { route.push(remaining.shift()!); continue; }

    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const c = buildingCoords[remaining[i].building];
      if (!c) continue;
      const d = haversine(lastCoord.lat, lastCoord.lng, c.lat, c.lng);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    route.push(remaining.splice(bestIdx, 1)[0]);
  }
  return route;
}

// ── 요일별 색상 ──
const DAY_COLORS = ['#EF4444', '#F59E0B', '#10B981', 'var(--color-hm-blue)', '#8B5CF6'];

// ── 시간 슬롯 생성 ──
function timeSlots(count: number, start = '09:30'): string[] {
  const [h, m] = start.split(':').map(Number);
  const slots: string[] = [];
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

interface DaySchedule {
  region: string;
  buildings: BuildingTask[];
}

interface RouteSchedulePageProps {
  myBuildings?: string[];
  buildingData?: Record<string, any>;
  activeTenants?: Record<string, any>[];
  isLoading?: boolean;
}

export function RouteSchedulePage({ myBuildings = [], buildingData = {}, activeTenants = [] }: RouteSchedulePageProps) {
  const isMobile = useIsMobile();
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [highlightedBuilding, setHighlightedBuilding] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState('전체');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapDay, setMapDay] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const [scheduleOverrides] = useState<Record<string, any>>(() => {
    try {
      return JSON.parse(localStorage.getItem('hm_routeSchedule') || '{}');
    } catch { return {}; }
  });

  const [staffList] = useLocalStorage("hm_staffList", initialStaffMembers);
  const externalStaff = useMemo(() => (staffList as any[]).filter(s => s.roles.includes("external")), [staffList]);

  // 외부직원별 담당 건물 매핑 (patrolBuildings의 assignee 기준)
  const staffBuildingMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const s of externalStaff) {
      map[s.name] = patrolBuildings.filter(pb => pb.assignee === s.name).map(pb => pb.building);
    }
    return map;
  }, [externalStaff]);

  const today = new Date();
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekLabel = weekOffset === 0 ? '이번 주' : weekOffset === 1 ? '다음 주' : `${weekOffset > 0 ? '+' : ''}${weekOffset}주`;

  // 선택된 직원 기준 건물 필터
  const filteredBuildings = useMemo(() => {
    if (selectedStaff === '전체') return myBuildings;
    const staffBuildings = staffBuildingMap[selectedStaff] || [];
    if (myBuildings.length > 0) {
      return myBuildings.filter(b => staffBuildings.includes(b));
    }
    return staffBuildings;
  }, [selectedStaff, myBuildings, staffBuildingMap]);

  // ── 건물별 주소/권역 매핑 ──
  const buildingRegions = useMemo(() => {
    const map: Record<string, { address: string; region: string }> = {};
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
    const tasks: PendingTask[] = [];

    // 선택 직원의 건물 목록
    const staffBuildings = selectedStaff !== '전체' ? (staffBuildingMap[selectedStaff] || []) : null;
    const isInScope = (building: string): boolean => {
      if (staffBuildings && !staffBuildings.includes(building)) return false;
      if (filteredBuildings.length > 0 && !filteredBuildings.includes(building)) return false;
      return true;
    };

    // 1) AS 미완료
    const pendingAS = asItems.filter(a => a.status !== '완료' && isInScope(a.building));
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
    const relevantPatrol = filteredBuildings.length > 0
      ? patrolBuildings.filter(b => filteredBuildings.includes(b.building))
      : selectedStaff !== '전체'
        ? patrolBuildings.filter(b => staffBuildings && staffBuildings.includes(b.building))
        : patrolBuildings;

    for (const pb of relevantPatrol) {
      const threshold = 30 / (pb.freq || 1);
      const elapsed = daysBetween(pb.lastDate ?? undefined, today);
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
      if (!t.building || !isInScope(t.building)) continue;
      const moveIn = t.moveIn || t.startDate;
      const moveOut = t.moveOut || t.endDate;
      for (const [dateStr, taskLabel] of [[moveIn, '입주 체크'], [moveOut, '퇴실 체크']] as [string, string][]) {
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
  }, [filteredBuildings, selectedStaff, staffBuildingMap, activeTenants, today.toDateString()]);

  // ── 권역별 그룹 + 주간 배분 ──
  const { dailySchedule, unassigned, delayRanking } = useMemo(() => {
    // 건물별 태스크 그룹핑
    const buildingTasks: Record<string, PendingTask[]> = {};
    for (const t of pendingTasks) {
      if (!buildingTasks[t.building]) buildingTasks[t.building] = [];
      buildingTasks[t.building].push(t);
    }

    // 권역별 건물 그룹
    const regionBuildings: Record<string, BuildingTask[]> = {};
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

    const daily: DaySchedule[] = Array.from({ length: 5 }, () => ({ region: '', buildings: [] }));
    const unassignedList: (BuildingTask & { region: string })[] = [];

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
      let chunk: BuildingTask[] = [];

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
      .reduce((acc: { building: string; type: string; label: string }[], t) => {
        if (!acc.find(x => x.building === t.building)) {
          acc.push({ building: t.building, type: t.type, label: t.label });
        }
        return acc;
      }, [])
      .slice(0, 5);
  }, [highlightedBuilding, pendingTasks, buildingRegions]);

  // ── 거리 기반 동선 최적화 적용 ──
  const optimizedSchedule = useMemo(() => {
    return dailySchedule.map(day => ({
      ...day,
      buildings: optimizeRoute(day.buildings),
    }));
  }, [dailySchedule]);

  // ── 지도 렌더링 ──
  useEffect(() => {
    if (viewMode !== 'map') return;
    if (!mapRef.current) return;

    // 지도 초기화
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [37.484, 126.929],
        zoom: 13,
        zoomControl: true,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // 기존 마커/라인 제거
    markersRef.current.forEach(m => map.removeLayer(m));
    polylinesRef.current.forEach(p => map.removeLayer(p));
    markersRef.current = [];
    polylinesRef.current = [];

    const allBounds: L.LatLngTuple[] = [];
    const daysToShow = mapDay !== null ? [mapDay] : [0, 1, 2, 3, 4];

    for (const dayIdx of daysToShow) {
      const day = optimizedSchedule[dayIdx];
      if (!day || day.buildings.length === 0) continue;

      const dayColor = DAY_COLORS[dayIdx];
      const routeCoords: L.LatLngTuple[] = [];

      day.buildings.forEach((b, bIdx) => {
        const coord = buildingCoords[b.building];
        if (!coord) return;

        const latlng: L.LatLngTuple = [coord.lat, coord.lng];
        routeCoords.push(latlng);
        allBounds.push(latlng);

        const mainType = b.tasks[0]?.type || 'patrol';
        const markerColor = TASK_COLORS[mainType];

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:${markerColor};color:#fff;
            display:flex;align-items:center;justify-content:center;
            font-size:12px;font-weight:800;
            border:3px solid ${dayColor};
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
          ">${bIdx + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const taskList = b.tasks.map(t =>
          `<span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;color:#fff;background:${TASK_COLORS[t.type]};margin-right:4px">${TASK_LABELS[t.type]}</span> ${t.label}`
        ).join('<br/>');

        const marker = L.marker(latlng, { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:160px">
              <div style="font-weight:800;font-size:14px;margin-bottom:6px">${b.building}</div>
              <div style="font-size:11px;color:#6B7280;margin-bottom:4px">${WEEKDAY_NAMES[dayIdx]} ${bIdx + 1}번째</div>
              ${taskList}
              ${coord.address ? `<div style="font-size:10px;color:#9CA3AF;margin-top:6px">${coord.address}</div>` : ''}
            </div>
          `);

        markersRef.current.push(marker);
      });

      if (routeCoords.length >= 2) {
        const polyline = L.polyline(routeCoords, {
          color: dayColor,
          weight: 3,
          opacity: 0.8,
          dashArray: mapDay === null ? '8, 6' : undefined,
        }).addTo(map);
        polylinesRef.current.push(polyline);
      }
    }

    if (allBounds.length > 0) {
      map.fitBounds(allBounds, { padding: [40, 40], maxZoom: 15 });
    }

    setTimeout(() => map.invalidateSize(), 100);
  }, [viewMode, optimizedSchedule, mapDay]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const toggleDay = useCallback((idx: number) => {
    setExpandedDay(prev => prev === idx ? null : idx);
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto" style={{ padding: isMobile ? 16 : 24 }}>
      {/* ── Header / Week Nav ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className={`${isMobile ? "text-lg" : "text-[22px]"} font-extrabold text-gray-900`}>
            순회 동선 제안
          </div>
          <div className="text-xs text-gray-400 bg-gray-100 rounded-md px-2 py-0.5 font-semibold">
            {pendingTasks.length}건 미처리
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setWeekOffset(w => w - 1)}>&lt;</button>
          <div className={`${isMobile ? "text-base" : "text-xl"} font-extrabold text-gray-900`}>
            {weekLabel} ({formatDate(weekDates[0])} ~ {formatDate(weekDates[4])})
          </div>
          <button className="px-4 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setWeekOffset(w => w + 1)}>&gt;</button>
          {weekOffset !== 0 && (
            <button
              className="px-2.5 py-1 rounded-lg border border-gray-300 bg-white cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              onClick={() => setWeekOffset(0)}
            >
              오늘
            </button>
          )}
        </div>
      </div>

      {/* ── Staff Filter ── */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <span className="text-[13px] font-bold text-gray-500 mr-1">담당자:</span>
        {['전체', ...externalStaff.map(s => s.name)].map(name => {
          const isActive = selectedStaff === name;
          const staffInfo = externalStaff.find(s => s.name === name);
          const buildingCount = name === '전체' ? null : (staffBuildingMap[name] || []).length;
          return (
            <button
              key={name}
              onClick={() => setSelectedStaff(name)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] cursor-pointer transition-all ${
                isActive
                  ? 'border-2 border-hm-blue bg-hm-blue-bg text-blue-700 font-extrabold'
                  : 'border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50'
              }`}
            >
              {name}
              {buildingCount != null && (
                <span className={`text-[11px] ml-1 ${isActive ? 'text-hm-blue' : 'text-gray-400'}`}>
                  ({buildingCount})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legend + View Toggle ── */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div className="flex gap-4 flex-wrap">
          {Object.entries(TASK_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TASK_COLORS[type] }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {([['list', '목록'], ['map', '지도']] as [string, string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => {
                if (mode !== viewMode) {
                  if (mode === 'list' && mapInstanceRef.current) {
                    mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
                  }
                  setViewMode(mode as 'list' | 'map');
                }
              }}
              className={`px-3.5 py-[5px] rounded-md border-none text-[13px] cursor-pointer transition-all ${
                viewMode === mode
                  ? 'bg-white text-gray-900 font-bold shadow-sm'
                  : 'bg-transparent text-gray-500 font-medium hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Map View ── */}
      {viewMode === 'map' && (
        <div className="mb-5">
          {/* 요일 필터 */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            <button
              onClick={() => setMapDay(null)}
              className={`px-3 py-[5px] rounded-md border-none text-xs font-bold cursor-pointer transition-colors ${
                mapDay === null ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {WEEKDAY_NAMES.map((name, idx) => {
              const count = optimizedSchedule[idx]?.buildings.length || 0;
              return (
                <button
                  key={idx}
                  onClick={() => setMapDay(idx)}
                  className="px-3 py-[5px] rounded-md border-none text-xs font-bold cursor-pointer transition-colors"
                  style={{
                    background: mapDay === idx ? DAY_COLORS[idx] : '#F3F4F6',
                    color: mapDay === idx ? '#fff' : '#6B7280',
                  }}
                >
                  {name.slice(0, 1)} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>

          {/* 지도 요일 범례 */}
          <div className="flex gap-3 mb-2 flex-wrap">
            {WEEKDAY_NAMES.map((name, idx) => (
              <div key={idx} className="flex items-center gap-1 text-[11px] text-gray-500">
                <div className="w-3 h-[3px] rounded-sm" style={{ background: DAY_COLORS[idx] }} />
                <span>{name.slice(0, 1)}</span>
              </div>
            ))}
          </div>

          {/* 지도 컨테이너 */}
          <div
            ref={mapRef}
            className="w-full rounded-xl border border-hm-border overflow-hidden"
            style={{ height: isMobile ? 400 : 550 }}
          />

          {/* 선택된 날의 동선 순서 표시 */}
          {mapDay !== null && optimizedSchedule[mapDay]?.buildings.length > 0 && (
            <div className="mt-3 p-3 bg-hm-bg-hover rounded-[10px]" style={{ border: `2px solid ${DAY_COLORS[mapDay]}20` }}>
              <div className="text-[13px] font-extrabold text-gray-900 mb-2">
                {WEEKDAY_NAMES[mapDay]} 최적 동선 ({optimizedSchedule[mapDay].buildings.length}개 건물)
              </div>
              <div className="flex items-center flex-wrap gap-1">
                {optimizedSchedule[mapDay].buildings.map((b, i) => {
                  const coord = buildingCoords[b.building];
                  const prevCoord = i > 0 ? buildingCoords[optimizedSchedule[mapDay!].buildings[i - 1].building] : null;
                  const dist = prevCoord && coord ? haversine(prevCoord.lat, prevCoord.lng, coord.lat, coord.lng).toFixed(1) : null;
                  return (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && (
                        <span className="text-[11px] text-gray-400">
                          → {dist && `${dist}km`}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md text-xs font-bold text-gray-900" style={{ background: `${DAY_COLORS[mapDay!]}15`, border: `1px solid ${DAY_COLORS[mapDay!]}30` }}>
                        <span className="w-[18px] h-[18px] rounded-full text-[10px] font-extrabold text-white inline-flex items-center justify-center" style={{ background: DAY_COLORS[mapDay!] }}>{i + 1}</span>
                        {b.building}
                      </span>
                    </span>
                  );
                })}
              </div>
              {(() => {
                const blds = optimizedSchedule[mapDay!].buildings;
                let totalDist = 0;
                for (let i = 1; i < blds.length; i++) {
                  const prev = buildingCoords[blds[i - 1].building];
                  const curr = buildingCoords[blds[i].building];
                  if (prev && curr) totalDist += haversine(prev.lat, prev.lng, curr.lat, curr.lng);
                }
                return totalDist > 0 ? (
                  <div className="text-[11px] text-gray-500 mt-2">
                    총 이동거리: <strong className="text-gray-900">{totalDist.toFixed(1)}km</strong> (직선거리 기준)
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' && <div className={`grid gap-5 ${isMobile ? "grid-cols-1" : nearbyBuildings.length > 0 || delayRanking.length > 0 ? "grid-cols-[1fr_300px]" : "grid-cols-1"}`}>
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
                className="bg-white rounded-xl border border-hm-border p-4 mb-3 cursor-pointer transition-shadow hover:shadow-md"
                style={{ borderLeft: `4px solid ${totalTasks > 0 ? 'var(--color-hm-blue)' : '#E5E7EB'}` }}
                onClick={() => isMobile && toggleDay(idx)}
              >
                {/* Day Header */}
                <div className={`flex justify-between items-center ${isExpanded && totalTasks > 0 ? "mb-3" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-extrabold text-gray-900">
                      {WEEKDAY_NAMES[idx]} ({formatDate(date)})
                    </span>
                    {day.region && (
                      <span className="text-xs text-indigo-500 bg-indigo-50 rounded-md px-2 py-0.5 font-semibold">
                        {day.region} 권역
                      </span>
                    )}
                  </div>
                  <span className={`text-[13px] font-bold ${totalTasks > 0 ? 'text-hm-blue' : 'text-gray-400'}`}>
                    {totalTasks}건
                  </span>
                </div>

                {/* Timeline */}
                {isExpanded && totalTasks > 0 && (
                  <div className="pl-1">
                    {day.buildings.map((b, bIdx) => (
                      b.tasks.map((task, tIdx) => {
                        const isFirst = bIdx === 0 && tIdx === 0;
                        const isLast = bIdx === day.buildings.length - 1 && tIdx === b.tasks.length - 1;
                        const currentSlot = slots[slotIdx] || '';
                        slotIdx++;

                        return (
                          <div
                            key={`${b.building}-${tIdx}`}
                            className="flex items-start gap-2.5 relative"
                            onMouseEnter={() => setHighlightedBuilding(b.building)}
                            onMouseLeave={() => setHighlightedBuilding(null)}
                          >
                            {/* Timeline connector */}
                            <div className="flex flex-col items-center w-2.5">
                              {!isFirst && <div className="w-0.5 bg-gray-200 min-h-[24px] ml-1" />}
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TASK_COLORS[task.type] }} />
                              {!isLast && <div className="w-0.5 bg-gray-200 flex-1 ml-1" />}
                            </div>

                            {/* Content */}
                            <div className={`flex-1 flex items-center gap-2 flex-wrap ${isLast ? "" : "pb-2"}`}>
                              <span className="text-[13px] font-bold text-gray-500 min-w-[40px] tabular-nums">
                                {currentSlot}
                              </span>
                              <span className="text-sm font-bold text-gray-900">
                                {b.building}
                              </span>
                              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold text-white mr-1.5" style={{ background: TASK_COLORS[task.type] || '#6B7280' }}>
                                {TASK_LABELS[task.type]}
                              </span>
                              <span className="text-xs text-gray-500">
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
                  <div className="text-[13px] text-gray-400 mt-1">
                    배정된 일정 없음
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Unassigned Section ── */}
          {unassigned.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-hm-border p-4 mb-3 cursor-pointer transition-shadow hover:shadow-md" style={{ borderLeft: '4px solid #F59E0B' }}>
              <div className="text-sm font-extrabold text-amber-900 mb-2">
                {'\u26A0\uFE0F'} 미배정 건물 (별도 일정 필요)
              </div>
              {unassigned.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-1 text-[13px]"
                  onMouseEnter={() => setHighlightedBuilding(b.building)}
                  onMouseLeave={() => setHighlightedBuilding(null)}
                >
                  <span className="font-bold text-gray-900">{b.building}</span>
                  {b.region && (
                    <span className="text-[11px] text-amber-900">({b.region})</span>
                  )}
                  <span className="text-gray-500">
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
              <div className="bg-sky-50 rounded-xl border border-sky-200 p-4 mb-3 cursor-pointer transition-shadow hover:shadow-md">
                <div className="text-[13px] font-extrabold text-sky-700 mb-2">
                  {'\uD83D\uDCCD'} 근처 건물 제안
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  <strong>{highlightedBuilding}</strong>에서 같은 권역 내:
                </div>
                {nearbyBuildings.map((nb, i) => (
                  <div key={i} className="flex items-center gap-1.5 py-[3px] text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TASK_COLORS[nb.type] }} />
                    <span className="font-semibold text-gray-900">{nb.building}</span>
                    <span className="text-gray-500">({TASK_LABELS[nb.type]} {nb.label})</span>
                  </div>
                ))}
              </div>
            )}

            {/* 순회 지연 TOP 5 */}
            {delayRanking.length > 0 && (
              <div className="bg-white rounded-xl border border-hm-border p-4 mb-3 cursor-pointer transition-shadow hover:shadow-md">
                <div className="text-[13px] font-extrabold text-gray-900 mb-2.5">
                  순회 지연 TOP {delayRanking.length}
                </div>
                {delayRanking.map((t, i) => {
                  const severity = t.daysSince > 45 ? '#EF4444' : t.daysSince > 30 ? '#F59E0B' : '#9CA3AF';
                  const icon = t.daysSince > 45 ? '\uD83D\uDD34' : t.daysSince > 30 ? '\uD83D\uDFE1' : '';
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between py-1.5 ${i < delayRanking.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-extrabold text-gray-400 w-[18px]">{i + 1}.</span>
                        <span className="text-[13px] font-bold text-gray-900">{t.building}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold" style={{ color: severity }}>{t.daysSince}일 경과</span>
                        <span className="text-xs">{icon}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 요약 통계 */}
            <div className="bg-hm-bg-hover rounded-xl border border-hm-border p-4 mb-3 cursor-pointer transition-shadow hover:shadow-md">
              <div className="text-[13px] font-extrabold text-gray-900 mb-2">
                이번 주 요약
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TASK_LABELS).map(([type, label]) => {
                  const count = pendingTasks.filter(t => t.type === type).length;
                  return (
                    <div key={type} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TASK_COLORS[type] }} />
                      <span className="text-gray-500">{label}</span>
                      <span className="font-extrabold text-gray-900">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-gray-200 text-xs text-gray-500">
                총 <strong className="text-gray-900">{new Set(pendingTasks.map(t => t.building)).size}</strong>개 건물 /{' '}
                <strong className="text-gray-900">{pendingTasks.length}</strong>건 미처리
              </div>
            </div>
          </div>
        )}
      </div>}

      {/* ── Mobile: delay ranking at bottom ── */}
      {isMobile && delayRanking.length > 0 && (
        <div className="bg-white rounded-xl border border-hm-border p-4 mt-3 cursor-pointer transition-shadow hover:shadow-md">
          <div className="text-[13px] font-extrabold text-gray-900 mb-2.5">
            순회 지연 TOP {delayRanking.length}
          </div>
          {delayRanking.map((t, i) => {
            const severity = t.daysSince > 45 ? '#EF4444' : t.daysSince > 30 ? '#F59E0B' : '#9CA3AF';
            const icon = t.daysSince > 45 ? '\uD83D\uDD34' : t.daysSince > 30 ? '\uD83D\uDFE1' : '';
            return (
              <div
                key={i}
                className={`flex items-center justify-between py-1.5 ${i < delayRanking.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-extrabold text-gray-400 w-[18px]">{i + 1}.</span>
                  <span className="text-[13px] font-bold text-gray-900">{t.building}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold" style={{ color: severity }}>{t.daysSince}일 경과</span>
                  <span className="text-xs">{icon}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
