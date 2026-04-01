import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { buildings, billingConfig, elecCustomerMap, gasCodeMap, billingTypeMap, buildingAccountMap, buildingAbbr, truncate10, calcLateFee, roomMasterData } from '@/data';
import { useIsMobile, fmt } from '@/utils';
import { matchKorean } from '@/utils/koreanSearch';
import { Card, SectionTitle, Table, StatusBadge, RoomTypeBadge } from '@/components';
import { getRoomType } from '@/config';
import { useLocalStorage } from '@/utils/useLocalStorage';
import { initialStaffMembers } from '@/config/staff';
import VariableBillingView from '@/components/VariableBillingView';
import BillingSetupWizard from '@/components/BillingSetupWizard';
import MeterUpload from '@/components/MeterUpload';
import RoomBillingSettingsPanel from '@/components/RoomBillingSettingsPanel';
import BillingInvoiceTemplate from '@/components/BillingInvoiceTemplate';
import { autoGenerateBillingRecords, bulkSendBilling } from '@/lib/billingEngine';
import { toast } from 'sonner';
import type { Tenant, BillingConfigItem, Staff } from '@/types';

interface UtilityBillingPageProps {
  isLoading?: boolean;
  billingMode?: string;
  myBuildings?: string[];
  activeTenants?: Tenant[];
  addBilling: (building: string, room: string, name: string, detail: Record<string, any>, total: number) => void;
  billingConfirmed: Record<string, boolean>;
  setBillingConfirmed: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  billingSent: Record<string, boolean>;
  setBillingSent: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  roomBalances: Record<string, number>;
  billingHistory: Record<string, any>;
  buildingData?: Record<string, any>;
}

export const UtilityBillingPage = ({ billingMode = "fixed", myBuildings = [], activeTenants = [], addBilling, billingConfirmed, setBillingConfirmed, billingSent, setBillingSent, roomBalances, billingHistory, buildingData = {}, isLoading }: UtilityBillingPageProps) => {
  const isMobile = useIsMobile();
  // AS 유상수리 데이터 로드
  const [asItemsLocal, setAsItemsLocal] = useLocalStorage<any[]>("hm_asItems", []);
  // 건물별 관리비유형 읽기 (buildingData prop에서)
  const getBldgMgmtType = (bName: string): string => {
    const d = buildingData[bName] || {};
    return d.mgmtType || "변동관리비";
  };
  const fixedTypes = ["단기", "고정관리비"];
  const variableTypes = ["변동관리비"];
  const allTypes = ["단기", "고정관리비", "변동관리비"];
  const availableTypes = billingMode === "unified" ? allTypes : billingMode === "variable" ? variableTypes : fixedTypes;
  const [typeTab, setTypeTab] = useState(availableTypes[0]);
  const [filterBuilding, setFilterBuilding] = useState("전체");
  const [filterTab, setFilterTab] = useState("전체");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editValues, setEditValues] = useLocalStorage<Record<string, any>>("hm_editValues", {});
  const [showUpload, setShowUpload] = useState<string | null>(null); // "elec" | "gas" | null
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showMeterUpload, setShowMeterUpload] = useState<string | null>(null); // "elec" | "gas" | null
  const [showVariableView, setShowVariableView] = useState<string | null>(null); // building name
  const [showRoomSettings, setShowRoomSettings] = useState<any>(null); // { roomId, buildingId }
  const [showInvoice, setShowInvoice] = useState<any>(null); // billing record
  const today = new Date().getDate();
  const billingMonth = `2026-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  // 청구 기간 = 월세일(납부일) 범위 필터
  // history: 이전 확정된 기간들 [{startDay, endDay, confirmedAt}]
  const [billingPeriod, setBillingPeriod] = useLocalStorage<Record<string, any>>("hm_billingPeriod", { startDay: 1, endDay: 5, confirmed: false, history: [] });

  // 공과금 청구 담당자 (건물별로 별도 지정 가능)
  const [billingAssignees, setBillingAssignees] = useLocalStorage<Record<string, string>>("hm_billingAssignees", {});
  const internalStaff = initialStaffMembers.filter((s: Staff) => s.roles.includes("internal") || s.roles.includes("general"));
  const getBillingAssignee = (building: string): string => billingAssignees[building] || "공원식 대리";

  // 유형별 필터
  const allTenants = useMemo(() => (myBuildings.length > 0 ? activeTenants.filter((t: Tenant) => myBuildings.includes(t.building)) : activeTenants)
    .filter((t: Tenant) => t.name && t.name !== "퇴실" && t.rent > 0), [myBuildings, activeTenants]);
  // 청구 분류: 단기=단기, 일반임대/근생 → 건물 mgmtType에 따라 고정관리비/변동관리비
  const getBillingCategory = (building: string, room: string): string => {
    const rt = getRoomType(building, room);
    if (rt === "단기") return "단기";
    if (rt === "관리사무소") return "단기"; // 관리사무소는 단기 쪽에 포함
    const mt = getBldgMgmtType(building);
    return mt === "고정관리비" ? "고정관리비" : "변동관리비";
  };
  // 월세일 계산: rentDay 필드 > 입주일의 day > due에서 추출 > 1일
  const getRentDay = (t: any): number => {
    if (t.rentDay) return t.rentDay;
    if (t.moveIn) return new Date(t.moveIn).getDate();
    if (t.due) return parseInt(t.due.replace(/\D/g, "")) || 1;
    return 1;
  };
  // ── 검침값 체인 시스템 (billingItems에서 사용하므로 먼저 선언) ──
  const loadMeterChain = (): Record<string, any> => {
    try { return JSON.parse(localStorage.getItem("hm_meterChain") || "{}"); } catch { return {}; }
  };
  const getLastReading = (roomKey: string, type: string): any => {
    const chain = loadMeterChain();
    return chain[roomKey]?.[type] || null;
  };

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { "단기": 0, "고정관리비": 0, "변동관리비": 0 };
    allTenants.forEach((t: Tenant) => { const cat = getBillingCategory(t.building, t.room); if (counts[cat] !== undefined) counts[cat]++; });
    return counts;
  }, [allTenants]);
  const myTenants = useMemo(() => allTenants.filter((t: Tenant) => getBillingCategory(t.building, t.room) === typeTab), [allTenants, typeTab]);
  const buildingNames = useMemo(() => ["전체", ...new Set(myTenants.map((t: Tenant) => t.building))], [myTenants]);

  // AS 유상수리 중 완료된 미청구 항목을 호실별로 그룹화
  const asRepairByRoom = useMemo(() => {
    const map: Record<string, any[]> = {};
    asItemsLocal.forEach((item: any) => {
      if (item.status === "완료" && item.paid === "유상" && item.cost > 0 && !item.billed) {
        const key = `${item.building}_${item.room}`;
        if (!map[key]) map[key] = [];
        map[key].push(item);
      }
    });
    return map;
  }, [asItemsLocal]);

  const billingItems = myTenants.map((t: Tenant) => {
    const bc = billingConfig.find((b: any) => b.b === t.building && b.r === t.room);
    const key = `${t.building}_${t.room}`;
    const roomType = getRoomType(t.building, t.room);
    const dueDay = getRentDay(t);
    // 월 경계를 고려한 납부일까지 남은 일수
    const _dim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    let daysUntilDue = dueDay - today;
    if (daysUntilDue < -_dim / 2) daysUntilDue += _dim; // 다음달 납부일
    if (daysUntilDue > _dim / 2) daysUntilDue -= _dim; // 이번달 납부일 지남
    // 청구기간(월세일 필터) 기반 대상 판별
    const isTarget = billingPeriod.confirmed
      ? (billingPeriod.startDay <= billingPeriod.endDay
        ? (dueDay >= billingPeriod.startDay && dueDay <= billingPeriod.endDay)
        : (dueDay >= billingPeriod.startDay || dueDay <= billingPeriod.endDay))
      : false;
    // 단기: 전기/가스/수도/인터넷 모두 통합 청구
    // 일반임대: 임대료 + 고정관리비 (변동관리비 추가 가능)
    // 근생: ①임대료+고정+변동 또는 ②고정+변동만 (임대료 제외)
    const elec = roomType === "단기" ? (bc?.ea || 0) : 0;
    const gas = roomType === "단기" ? (bc?.ga || 0) : 0;
    const water = roomType === "단기" ? (bc?.w || 0) : 0;
    const cable = roomType === "단기" ? (bc?.c || 0) : 0;
    let elecStart = bc?.es || ""; let elecEnd = bc?.ee || "";
    let elecPrev = bc?.ep || 0; const elecCur = bc?.ec || 0; const elecUsage = bc?.eu || 0;
    let gasPeriod = bc?.gp || "";
    let gasPrev = bc?.gpr || 0; const gasCur = bc?.gcr || 0; const gasUsage = bc?.gu || 0;

    // 미매칭이어도 이전 청구에서 다음 기간/시작 검침값 가져오기
    const ev0 = editValues[key] || {};
    if (roomType === "단기" && !elec && !elecStart) {
      const lastEs = ev0.ee || ""; // 이전 끝기간 → 이번 시작기간 기반
      const chainElec = getLastReading(key, "elec");
      if (chainElec?.reading) elecPrev = chainElec.reading;
      else if (ev0.ec) elecPrev = ev0.ec; // 이전 당월검침 → 이번 전월검침
      if (lastEs) {
        // 이전 끝기간+1일 → 이번 시작기간 계산
        const p = lastEs.replace(/^\d{4}\//, "").split("/");
        if (p.length === 2) {
          const yr = new Date().getFullYear();
          const sd = new Date(yr, parseInt(p[0])-1, parseInt(p[1])+1);
          const ed = new Date(yr, sd.getMonth()+1, parseInt(p[1]));
          const fmd = (d: Date) => `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
          elecStart = fmd(sd);
          elecEnd = fmd(ed);
        }
      }
    }
    if (roomType === "단기" && !gas && !gasPeriod) {
      const lastGp = ev0.gp || "";
      const chainGas = getLastReading(key, "gas");
      if (chainGas?.reading) gasPrev = chainGas.reading;
      else if (ev0.gcr) gasPrev = ev0.gcr;
      if (lastGp) {
        const parts = lastGp.split("~");
        if (parts.length === 2) {
          const endStr = parts[1].trim().replace(/\./g, "/").replace(/^\d{4}\//, "");
          const ep = endStr.split("/");
          if (ep.length === 2) {
            const yr = new Date().getFullYear();
            const sd = new Date(yr, parseInt(ep[0])-1, parseInt(ep[1])+1);
            const sp = parts[0].trim().replace(/\./g, "/").replace(/^\d{4}\//, "").split("/");
            if (sp.length === 2) {
              const ed = new Date(yr, sd.getMonth()+1, parseInt(sp[1])-1);
              const fmd = (d: Date) => `${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
              gasPeriod = `${fmd(sd)}~${fmd(ed)}`;
            }
          }
        }
      }
    }

    // 매칭 상태: 자동매칭(업로드) / 수동매칭(수기입력) / 미매칭
    const hasElecManual = ev0.ec > 0 && ev0.elec > 0;
    const hasGasManual = ev0.gcr > 0 && ev0.gas > 0;
    const elecUploaded = !!ev0.elecUploaded;
    const gasUploaded = !!ev0.gasUploaded;

    const elecStatus = elecUploaded ? "auto" : hasElecManual ? "manual" : "none";
    const gasStatus = gasUploaded ? "auto" : hasGasManual ? "manual" : "none";
    // 종합 매칭 상태
    const matchStatus = (roomType !== "단기") ? "auto"
      : (elecStatus === "none" || gasStatus === "none") ? "none"
      : (elecStatus === "manual" || gasStatus === "manual") ? "manual"
      : "auto";

    const noElec = roomType === "단기" && elecStatus === "none";
    const noGas = roomType === "단기" && gasStatus === "none";
    const carryOverElec = noElec && (getLastReading(key, "elec") || ev0.ec);
    const carryOverGas = noGas && (getLastReading(key, "gas") || ev0.gcr);
    const prevUnpaid = roomBalances[key] || 0;
    // AS 유상수리 비용
    const asRepairItems = asRepairByRoom[key] || [];
    const asRepairCost = asRepairItems.reduce((s: number, a: any) => s + (a.cost || 0), 0);
    return { ...t, roomType, dueDay, daysUntilDue, isTarget, elec, gas, water, cable,
      elecStart, elecEnd, elecPrev, elecCur, elecUsage,
      gasPeriod, gasPrev, gasCur, gasUsage,
      noElec, noGas, carryOverElec, carryOverGas, matchStatus, prevUnpaid, key,
      asRepairItems, asRepairCost,
      confirmed: billingConfirmed[key] || false, sent: billingSent[key] || false };
  });


  const filtered = billingItems.filter((item: any) => {
    if (filterBuilding !== "전체" && item.building !== filterBuilding) return false;
    if (filterTab === "미매칭") return item.matchStatus === "none" && !item.sent;
    if (filterTab === "수동매칭") return item.matchStatus === "manual" && !item.sent;
    if (filterTab === "자동매칭") return item.matchStatus === "auto" && !item.sent;
    if (filterTab === "확인완료") return item.confirmed && !item.sent;
    if (filterTab === "발송완료") return item.sent;
    // 전체 탭: 납부일 7일 전 ~ 납부일 당일까지만 (발송완료 제외)
    if (item.sent) return false;
    return item.daysUntilDue >= 0 && item.daysUntilDue <= 7;
  }).sort((a: any, b: any) => a.dueDay - b.dueDay);

  const unmatchedCount = billingItems.filter((i: any) => i.matchStatus === "none" && !i.sent).length;
  const manualCount = billingItems.filter((i: any) => i.matchStatus === "manual" && !i.sent).length;
  const autoCount = billingItems.filter((i: any) => i.matchStatus === "auto" && !i.sent).length;
  const confirmedCount = billingItems.filter((i: any) => i.confirmed && !i.sent).length;
  const sentCount = billingItems.filter((i: any) => i.sent).length;

  const confirmItem = (item: any) => setBillingConfirmed((prev: Record<string, boolean>) => ({ ...prev, [item.key]: true }));
  const sendItem = (item: any) => {
    if (!item.confirmed) return;
    setBillingSent((prev: Record<string, boolean>) => ({ ...prev, [item.key]: true }));
    const ev = editValues[item.key] || {};
    const e = truncate10(ev.elec ?? item.elec);
    const g = truncate10(ev.gas ?? item.gas);
    const lateFee = calcLateFee(item.rent + item.mgmt + e + g + item.water + item.cable, item.dueDay);
    const asRepairCost = item.asRepairCost || 0;
    const total = item.rent + item.mgmt + e + g + item.water + item.cable + item.prevUnpaid + lateFee + asRepairCost;
    addBilling(item.building, item.room, item.name,
      { rent: item.rent, mgmt: item.mgmt, elec: e, gas: g, water: item.water, cable: item.cable, prevUnpaid: item.prevUnpaid, lateFee, asRepair: asRepairCost },
      total);
    // AS 유상수리 항목을 billed 처리
    if (item.asRepairItems && item.asRepairItems.length > 0) {
      const billedIds = new Set(item.asRepairItems.map((a: any) => a.id));
      setAsItemsLocal((prev: any[]) => prev.map((a: any) => billedIds.has(a.id) ? { ...a, billed: true } : a));
    }
  };

  const getEditVal = (key: string, field: string, fallback: any): any => {
    if (editValues[key] && editValues[key][field] !== undefined) return editValues[key][field];
    return fallback;
  };
  const setEditVal = (key: string, field: string, val: string) => {
    setEditValues((prev: Record<string, any>) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: parseInt(val) || 0 } }));
  };

  const fmtPeriod = (start: string, end: string): string => {
    if (!start || !end) return "";
    const s = start.replace(/\//g, ".").replace("2025.", "").replace("2026.", "");
    const e = end.replace(/\//g, ".").replace("2025.", "").replace("2026.", "");
    return `${s}~${e}`;
  };

  // 엑셀 업로드 핸들러 (전기/가스)
  // 헤더명으로 컬럼 인덱스 자동 감지
  const findCol = (headers: any[], names: string[]): number => {
    for (const name of names) {
      const idx = headers.findIndex((h: any) => String(h || "").trim() === name);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  // saveMeterChain은 업로드 핸들러에서만 사용
  const saveMeterChain = (updates: Record<string, any>) => {
    const chain = loadMeterChain();
    Object.entries(updates).forEach(([roomKey, data]) => {
      if (chain[roomKey] === undefined) chain[roomKey] = {};
      Object.entries(data as Record<string, any>).forEach(([type, val]) => {
        chain[roomKey][type] = val;
      });
    });
    localStorage.setItem("hm_meterChain", JSON.stringify(chain));
  };

  // 이전 달 검침값 불러오기 (레거시 호환)
  const loadPrevReadings = (type: string): Record<string, any> => {
    try { return JSON.parse(localStorage.getItem(`hm_${type}Readings`) || "{}"); } catch { return {}; }
  };
  const saveCurReadings = (type: string, readings: Record<string, any>) => {
    const prev = loadPrevReadings(type);
    localStorage.setItem(`hm_${type}Readings`, JSON.stringify({ ...prev, ...readings }));
  };

  // 호실 마스터(elecNo/gasNo) + 하드코딩 맵을 합쳐 동적 매핑 빌드
  const buildElecMap = (): Record<string, any[]> => {
    const map: Record<string, any[]> = { ...elecCustomerMap };
    activeTenants.forEach((t: Tenant) => {
      const key = `${t.building}_${t.room}`;
      const rm: Record<string, any> = { ...(roomMasterData[key] || {}) };
      const bd = buildingData[t.building] || {};
      Object.assign(rm, bd[`room_${t.room}`] || {});
      if (rm.elecNo && !map[rm.elecNo]) {
        map[rm.elecNo] = [{ b: t.building, r: String(t.room) }];
      }
    });
    return map;
  };
  const buildGasMap = (): Record<string, any> => {
    const map: Record<string, any> = { ...gasCodeMap };
    activeTenants.forEach((t: Tenant) => {
      const key = `${t.building}_${t.room}`;
      const rm: Record<string, any> = { ...(roomMasterData[key] || {}) };
      const bd = buildingData[t.building] || {};
      Object.assign(rm, bd[`room_${t.room}`] || {});
      if (rm.gasNo && !map[rm.gasNo]) {
        map[rm.gasNo] = { b: t.building, r: String(t.room) };
      }
    });
    return map;
  };

  const handleFileUpload = (type: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        let matched = 0, unmatched = 0;
        const updates: Record<string, any> = {};
        const chainUpdates: Record<string, any> = {};
        const headers = rows[0] || [];

        if (type === "elec") {
          const iCust = findCol(headers, ["고객번호"]);
          const iStart = findCol(headers, ["사용기간 시작"]);
          const iEnd = findCol(headers, ["사용기간 끝"]);
          const iBill = findCol(headers, ["청구요금"]);
          const iPrev = findCol(headers, ["전월지침"]);
          const iCur = findCol(headers, ["당월지침"]);
          const iUsage = findCol(headers, ["사용량"]);
          const iMonth = findCol(headers, ["청구년월"]);

          if (iCust < 0) {
            setUploadResult({ type, success: false, msg: "고객번호 컬럼을 찾을 수 없습니다. 한전빌링사 엑셀 형식을 확인하세요." });
            return;
          }

          const dynElecMap = buildElecMap();
          const prevReadings = loadPrevReadings("elec");
          const newReadings: Record<string, any> = {};
          let billingYM = "";

          rows.forEach((row, idx) => {
            if (idx === 0) return;
            const custNo = String(row[iCust] || "").trim();
            if (!custNo || custNo === "합계") return;
            const targets = dynElecMap[custNo];
            if (!targets) { unmatched++; return; }

            const amount = truncate10(parseInt(row[iBill >= 0 ? iBill : 69]) || 0);
            const periodStart = iStart >= 0 ? String(row[iStart] || "") : "";
            const periodEnd = iEnd >= 0 ? String(row[iEnd] || "") : "";
            const curReading = parseInt(row[iCur >= 0 ? iCur : 75]) || 0;
            const usage = parseInt(row[iUsage >= 0 ? iUsage : 76]) || 0;
            if (!billingYM && iMonth >= 0) billingYM = String(row[iMonth] || "");

            newReadings[custNo] = { reading: curReading, month: billingYM };

            targets.forEach((t: any) => {
              const key = `${t.b}_${t.r}`;
              const chainReading = getLastReading(key, "elec");
              let prevReading = parseInt(row[iPrev >= 0 ? iPrev : 74]) || 0;
              if (chainReading && chainReading.reading) {
                prevReading = chainReading.reading;
              } else if (!prevReading && prevReadings[custNo]) {
                prevReading = prevReadings[custNo].reading || 0;
              }

              const shareAmt = t.share ? truncate10(Math.round(amount * t.share)) : amount;
              const shareUsage = t.share ? Math.round(usage * t.share) : usage;
              updates[key] = {
                elec: shareAmt, es: periodStart.replace(/^\d{4}\//, ""), ee: periodEnd.replace(/^\d{4}\//, ""),
                ep: prevReading, ec: curReading, eu: shareUsage,
                shared: !!t.share
              };
              chainUpdates[key] = { elec: { reading: curReading, date: periodEnd, source: "billing" } };
              matched++;
            });
          });

          saveMeterChain(chainUpdates);
          saveCurReadings("elec", newReadings);

          setEditValues((prev: Record<string, any>) => {
            const next = { ...prev };
            Object.entries(updates).forEach(([key, data]) => {
              next[key] = { ...(next[key] || {}), elec: data.elec, elecUploaded: true,
                es: data.es, ee: data.ee, ep: data.ep, ec: data.ec, eu: data.eu };
            });
            return next;
          });
          const savedCount = Object.keys(newReadings).length;
          setUploadResult({ type: "elec", success: true,
            msg: `전기 업로드 완료: ${rows.length - 1}행 읽음, ${matched}호실 매칭, ${unmatched}건 미매칭, ${savedCount}건 검침값 저장${Object.values(updates).some((u: any) => u.shared) ? " (공유계량 자동분배 적용)" : ""}`,
            rows: rows.length - 1 });

        } else {
          const prevReadings = loadPrevReadings("gas");
          const newReadings: Record<string, any> = {};
          const dynGasMap = buildGasMap();

          const gasNoToRoom: Record<string, any> = {};
          activeTenants.forEach((t: Tenant) => {
            const rKey = `${t.building}_${t.room}`;
            const rm: Record<string, any> = { ...(roomMasterData[rKey] || {}) };
            const bd = buildingData[t.building] || {};
            Object.assign(rm, bd[`room_${t.room}`] || {});
            if (rm.gasNo) gasNoToRoom[String(rm.gasNo)] = { b: t.building, r: String(t.room) };
          });

          const gasMatchDetails: any[] = [];

          rows.forEach((row, idx) => {
            if (idx === 0) return;
            const code = String(row[0] || "").trim();
            const custNo = String(row[1] || "").trim();
            if (!code || code === "합계") return;

            let target = custNo ? gasNoToRoom[custNo] : null;
            if (!target) target = dynGasMap[code];
            if (!target) {
              unmatched++;
              gasMatchDetails.push({ code, custNo, building: "?", room: "?", matched: false });
              return;
            }

            const key = `${target.b}_${target.r}`;
            const amount = truncate10(parseInt(row[11]) || parseInt(row[8]) || 0);
            const period = String(row[2] || "");

            const lastBilling = editValues[key] || {};
            const lastCur = lastBilling.gcr || 0;
            const lastPeriod = lastBilling.gp || "-";
            const lastAmount = lastBilling.gas || 0;

            const chainReading = getLastReading(key, "gas");
            let prevReading = lastCur;
            if (chainReading && chainReading.reading) {
              prevReading = chainReading.reading;
            }
            if (!prevReading) {
              prevReading = parseInt(row[5]) || 0;
            }
            if (!prevReading && prevReadings[code]) {
              prevReading = prevReadings[code].reading || 0;
            }

            const curReading = parseInt(row[6]) || 0;
            const gasUsageVal = prevReading > 0 ? curReading - prevReading : (parseInt(row[7]) || 0);

            newReadings[code] = { reading: curReading, month: period };
            chainUpdates[key] = { gas: { reading: curReading, date: String(row[4] || ""), source: "billing" } };
            updates[key] = { gas: amount, gp: period.replace(/\d{4}[\/.]/g, ""), gpr: prevReading, gcr: curReading, gu: gasUsageVal };
            matched++;

            gasMatchDetails.push({
              code, custNo, building: target.b, room: target.r, matched: true,
              period, prev: prevReading, cur: curReading, usage: gasUsageVal, amount,
              lastCur, lastPeriod, lastAmount,
              chainMatch: lastCur > 0 && prevReading === lastCur,
            });
          });

          saveMeterChain(chainUpdates);
          saveCurReadings("gas", newReadings);

          setEditValues((prev: Record<string, any>) => {
            const next = { ...prev };
            Object.entries(updates).forEach(([key, data]) => {
              next[key] = { ...(next[key] || {}), gas: data.gas, gasUploaded: true,
                gp: data.gp, gpr: data.gpr, gcr: data.gcr, gu: data.gu };
            });
            return next;
          });
          const savedCount = Object.keys(newReadings).length;
          setUploadResult({ type: "gas", success: true,
            msg: `가스 업로드 완료: ${rows.length - 1}행 읽음, ${matched}호실 매칭, ${unmatched}건 미매칭, ${savedCount}건 검침값 저장`,
            rows: rows.length - 1, details: gasMatchDetails });
        }
      } catch (err: any) {
        setUploadResult({ type, success: false, msg: `파일 처리 오류: ${err.message}` });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ===== 상세 보기 =====
  if (selectedItem) {
    const t = selectedItem;
    const ev = editValues[t.key] || {};
    const e = truncate10(ev.elec ?? t.elec);
    const g = truncate10(ev.gas ?? t.gas);
    const fixedTotal = t.rent + t.mgmt + t.water + t.cable;
    const utilTotal = e + g;
    const lateFee = calcLateFee(fixedTotal + utilTotal, t.dueDay);
    const asRepairCost = t.asRepairCost || 0;
    const grandTotal = fixedTotal + utilTotal + t.prevUnpaid + lateFee + asRepairCost;
    const msgElecStart = ev.es ?? t.elecStart ?? "";
    const msgElecEnd = ev.ee ?? t.elecEnd ?? "";
    const msgElecPrev = ev.ep ?? t.elecPrev;
    const msgElecCur = ev.ec ?? t.elecCur;
    const msgElecUsage = ev.eu ?? t.elecUsage;
    const msgGasPeriod = ev.gp ?? t.gasPeriod ?? "";
    const msgGasPrev = ev.gpr ?? t.gasPrev;
    const msgGasCur = ev.gcr ?? t.gasCur;
    const msgGasUsage = ev.gu ?? t.gasUsage;

    const bType = (billingTypeMap as Record<string, string>)[t.building] || "A";
    const abbr = (buildingAbbr as Record<string, string>)[t.building] || t.building.slice(0, 2);
    const acctInfo = (buildingAccountMap as Record<string, any>)[t.building] || {};
    const hmAcct = (buildingAccountMap as Record<string, any>)._houseman;

    const elecPeriodStr = fmtPeriod(msgElecStart, msgElecEnd);
    const gasPeriodStr = msgGasPeriod;

    const rentLabel = t.roomType === "관리사무소" ? "관리비" : t.roomType === "근생" ? "임대료" : "월세";
    let msg = "";

    if (bType === "B" && acctInfo.owner) {
      const rentTotal = t.rent + (t.prevUnpaid > 0 ? Math.round(t.prevUnpaid * 0.5) : 0);
      const utilGrandTotal = t.mgmt + e + g + t.water + t.cable + (t.prevUnpaid > 0 ? Math.round(t.prevUnpaid * 0.5) : 0) + lateFee;
      const lines = [
        `[${t.building} ${rentLabel}&공과금 청구서]`,
        `${t.room}호 ${t.name}님`,
        "",
        `①${rentLabel} : ${t.rent.toLocaleString()}원`,
        `${acctInfo.owner.bank} ${acctInfo.owner.account} ${acctInfo.owner.holder}`,
        "",
        `②관리비&공과금 : ${utilGrandTotal.toLocaleString()}원`,
        `${(acctInfo.manager || hmAcct).bank} ${(acctInfo.manager || hmAcct).account} ${(acctInfo.manager || hmAcct).holder}`,
        "",
        `[입금자명을 '${abbr}${t.room}'로 입금 부탁드립니다.]`,
        "",
        `<내역①>`,
      ];
      if (t.prevUnpaid > 0) lines.push(`·미납${rentLabel} : ${Math.round(t.prevUnpaid * 0.5).toLocaleString()}`);
      lines.push(`·${rentLabel} : ${t.rent.toLocaleString()}`);
      lines.push("", `<내역②>`);
      if (t.prevUnpaid > 0) lines.push(`·미납 관리비&공과금 : ${Math.round(t.prevUnpaid * 0.5).toLocaleString()}`);
      if (t.mgmt > 0) lines.push(`·관리비 : ${t.mgmt.toLocaleString()}`);
      if (t.roomType === "단기") {
        if (t.water > 0) lines.push(`·수도 : ${t.water.toLocaleString()}`);
        if (t.cable > 0) lines.push(`·케이블 : ${t.cable.toLocaleString()}`);
        if (e > 0) {
          lines.push("", `·전기 : ${e.toLocaleString()}원`);
          lines.push(`${elecPeriodStr}(${msgElecPrev}→${msgElecCur})`);
          lines.push(`사용량:${msgElecUsage}kWh`);
        } else {
          lines.push("", `·전기 : 0원`, `청구서가 나오지 않음(다음달이어청구)`);
        }
        if (g > 0) {
          lines.push("", `·가스 : ${g.toLocaleString()}원`);
          lines.push(`${gasPeriodStr}(${msgGasPrev}→${msgGasCur})`);
          lines.push(`사용량:${msgGasUsage}`);
        } else {
          lines.push("", `·가스 : 0원`, `청구서가 나오지 않음(다음달이어청구)`);
        }
      }
      if (lateFee > 0) lines.push("", `·연체수수료(5%) : ${lateFee.toLocaleString()}`);
      if (asRepairCost > 0) {
        lines.push("", `·AS 유상수리 : ${asRepairCost.toLocaleString()}`);
        (t.asRepairItems || []).forEach((a: any) => { lines.push(`  - ${a.content || a.title}: ${(a.cost || 0).toLocaleString()}원`); });
      }
      lines.push("", `납부일은 ${billingMonth.slice(5)}/${t.dueDay}일 입니다.`);
      msg = lines.join("\n");
    } else {
      const lines = [
        `[${t.building} ${rentLabel}&공과금 청구서]`,
        `${t.room}호 ${t.name}님`,
        "",
        `■납부할 금액 : ${grandTotal.toLocaleString()}원`,
        `${hmAcct.bank} ${hmAcct.account} ${hmAcct.holder}`,
        "",
        `[입금자명을 '${abbr}${t.room}'로 입금 부탁드립니다.]`,
        "",
        `<상세내역>`,
      ];
      if (t.prevUnpaid > 0) lines.push(`·미납 : ${t.prevUnpaid.toLocaleString()}`);
      lines.push(`·${rentLabel} : ${t.rent.toLocaleString()}`);
      if (t.mgmt > 0) lines.push(`·관리비 : ${t.mgmt.toLocaleString()}`);
      if (t.roomType === "단기") {
        if (t.water > 0) lines.push(`·수도 : ${t.water.toLocaleString()}`);
        if (t.cable > 0) lines.push(`·케이블 : ${t.cable.toLocaleString()}`);
        if (e > 0) {
          lines.push("", `·전기 : ${e.toLocaleString()}원`);
          lines.push(`${elecPeriodStr}(${msgElecPrev}→${msgElecCur})`);
          lines.push(`사용량:${msgElecUsage}kWh`);
        } else {
          lines.push("", `·전기 : 0원`, `청구서가 나오지 않음(다음달이어청구)`);
        }
        if (g > 0) {
          lines.push("", `·가스 : ${g.toLocaleString()}원`);
          lines.push(`${gasPeriodStr}(${msgGasPrev}→${msgGasCur})`);
          lines.push(`사용량:${msgGasUsage}`);
        } else {
          lines.push("", `·가스 : 0원`, `청구서가 나오지 않음(다음달이어청구)`);
        }
      }
      if (lateFee > 0) lines.push("", `·연체수수료(5%) : ${lateFee.toLocaleString()}`);
      if (asRepairCost > 0) {
        lines.push("", `·AS 유상수리 : ${asRepairCost.toLocaleString()}`);
        (t.asRepairItems || []).forEach((a: any) => { lines.push(`  - ${a.content || a.title}: ${(a.cost || 0).toLocaleString()}원`); });
      }
      lines.push("", `납부일은 ${billingMonth.slice(5)}/${t.dueDay}일 입니다.`);
      msg = lines.join("\n");
    }

    const detailInputCls = (isMissing: boolean) =>
      `w-[110px] px-2.5 py-1.5 rounded-md text-sm text-right font-[inherit] font-bold ${isMissing ? 'border-2 border-red-500 bg-hm-danger-bg' : 'border-[1.5px] border-hm-input-border bg-white'}`;

    return (
      <div>
        <div className="flex items-center gap-2 mb-5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedItem(null)}>
          <span className="text-xl">←</span><span className="text-sm font-bold text-hm-blue">목록으로</span>
        </div>
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-lg font-bold flex items-center gap-2">
                ⚡ {t.building} {t.room}호
                <RoomTypeBadge building={t.building} room={t.room} />
              </div>
              <div className="text-sm text-hm-text-muted mt-1">{t.name} · 납부일 매월 {t.dueDay}일</div>
            </div>
            <div className="flex gap-1.5">
              <span className={`px-2.5 py-[5px] rounded-md text-xs font-bold ${bType === "B" ? 'bg-[#FDF4FF] text-[#7C3AED]' : 'bg-[#F0F4FF] text-hm-blue-dark'}`}>
                {bType === "B" ? "이중계좌" : "단일계좌"}
              </span>
              {lateFee > 0 && <span className="px-2.5 py-[5px] rounded-md bg-hm-danger-bg text-hm-danger text-xs font-bold">연체 +{lateFee.toLocaleString()}</span>}
              {t.confirmed && <span className="px-2.5 py-[5px] rounded-md bg-hm-success-bg text-hm-success text-xs font-bold">✓ 확인됨</span>}
              {t.sent && <span className="px-2.5 py-[5px] rounded-md bg-hm-blue-bg text-hm-blue-dark text-xs font-bold">✓ 발송됨</span>}
            </div>
          </div>
          <div className="grid gap-4 grid-cols-[2fr_3fr]">
            {/* 좌: 청구내역 */}
            <div>
              <div className="text-xs font-bold mb-2.5 pb-1.5 border-b-[1.5px] border-hm-border">📋 청구 내역</div>
              {t.prevUnpaid > 0 && (
                <div className="flex justify-between px-3 py-2 rounded-md bg-hm-danger-bg border border-hm-danger-border mb-1">
                  <span className="text-xs text-hm-danger font-bold">🔴 미납금</span>
                  <span className="text-sm font-bold text-hm-danger">{t.prevUnpaid.toLocaleString()}원</span>
                </div>
              )}
              {[
                { label: `🏠 ${rentLabel}`, value: t.rent },
                t.mgmt > 0 && { label: "📋 관리비", value: t.mgmt },
                t.roomType === "단기" && t.water > 0 && { label: "💧 수도 (고정)", value: t.water },
                t.roomType === "단기" && t.cable > 0 && { label: "📺 인터넷/TV (고정)", value: t.cable },
              ].filter(Boolean).map((item: any, i: number) => (
                <div key={i} className="flex justify-between px-3 py-2 rounded-md bg-hm-bg-slate mb-1">
                  <span className="text-xs text-hm-text-sub">{item.label}</span>
                  <span className="text-sm font-bold">{item.value.toLocaleString()}원</span>
                </div>
              ))}

              {/* 전기/가스 - 단기만 */}
              {t.roomType === "단기" && (
                <>
                  <div className={`px-3 py-2.5 rounded-lg mb-1 mt-2 ${t.noElec ? 'bg-hm-danger-bg border-[1.5px] border-red-500' : 'bg-[#FFFBEB] border border-[#FDE68A]'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-[#92400E] font-bold">⚡ 전기요금</span>
                      <input value={getEditVal(t.key, "elec", e)} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEditVal(t.key, "elec", ev.target.value)} className={detailInputCls(t.noElec)} />
                    </div>
                    <div className={`text-xs ${t.noElec ? 'text-hm-danger' : 'text-[#92400E]'}`}>
                      {t.noElec ? (t.carryOverElec ? "📌 이어 청구 — 이전 검침값에서 이어서 청구됩니다" : "⚠ 한전 데이터 미매칭 — 엑셀 업로드 또는 수기 입력") : `기간: ${elecPeriodStr} · 검침: ${t.elecPrev}→${t.elecCur} · ${t.elecUsage}kWh`}
                    </div>
                  </div>
                  <div className={`px-3 py-2.5 rounded-lg mb-1 ${t.noGas ? 'bg-hm-danger-bg border-[1.5px] border-red-500' : 'bg-[#FFF1F2] border border-hm-danger-border'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-[#991B1B] font-bold">🔥 가스요금</span>
                      <input value={getEditVal(t.key, "gas", g)} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEditVal(t.key, "gas", ev.target.value)} className={detailInputCls(t.noGas)} />
                    </div>
                    <div className={`text-xs ${t.noGas ? 'text-hm-danger' : 'text-[#991B1B]'}`}>
                      {t.noGas ? (t.carryOverGas ? "📌 이어 청구 — 이전 검침값에서 이어서 청구됩니다" : "⚠ 가스 데이터 미매칭 — 파일 업로드 또는 수기 입력") : `기간: ${gasPeriodStr} · 검침: ${t.gasPrev}→${t.gasCur} (${t.gasUsage})`}
                    </div>
                  </div>
                </>
              )}

              {lateFee > 0 && (
                <div className="flex justify-between px-3 py-2 rounded-md bg-hm-danger-bg border border-hm-danger-border mt-2">
                  <span className="text-xs text-hm-danger font-bold">⚠ 연체수수료 (5%)</span>
                  <span className="text-sm font-bold text-hm-danger">{lateFee.toLocaleString()}원</span>
                </div>
              )}

              {/* AS 유상수리 비용 */}
              {asRepairCost > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between px-3 py-2 rounded-md bg-[#FDF4FF] border border-[#E9D5FF] mb-1">
                    <span className="text-xs text-[#7C3AED] font-bold">🔧 AS 유상수리</span>
                    <span className="text-sm font-bold text-[#7C3AED]">{asRepairCost.toLocaleString()}원</span>
                  </div>
                  {(t.asRepairItems || []).map((a: any, ai: number) => (
                    <div key={ai} className="flex justify-between py-1 px-3 pl-6 text-xs text-hm-text-muted">
                      <span>{a.content || a.title} ({a.date})</span>
                      <span className="font-bold">{(a.cost || 0).toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              )}

              {bType === "B" && acctInfo.owner ? (
                <div className="mt-2.5 flex flex-col gap-1.5">
                  <div className="p-3 rounded-lg bg-hm-warning-bg border-[1.5px] border-[#FDBA74]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-hm-warning">① {rentLabel}</span>
                      <span className="text-lg font-bold text-hm-warning">{t.rent.toLocaleString()}원</span>
                    </div>
                    <div className="text-xs text-[#92400E]">{acctInfo.owner.bank} {acctInfo.owner.account} {acctInfo.owner.holder}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#FEF3C7] border-[1.5px] border-[#F59E0B]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-[#92400E]">② 관리비&공과금</span>
                      <span className="text-lg font-bold text-[#92400E]">{(grandTotal - t.rent).toLocaleString()}원</span>
                    </div>
                    <div className="text-xs text-[#92400E]">{(acctInfo.manager || hmAcct).bank} {(acctInfo.manager || hmAcct).account} {(acctInfo.manager || hmAcct).holder}</div>
                  </div>
                  <div className="px-3 py-2 rounded-md bg-gray-100 text-center">
                    <span className="text-xs text-hm-text-sub">합계 </span>
                    <span className="text-base font-bold text-hm-text">{grandTotal.toLocaleString()}원</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between p-3 rounded-lg bg-[#FEF3C7] border-[1.5px] border-[#F59E0B] mt-2.5">
                  <div>
                    <span className="text-sm font-bold text-[#92400E]">총 청구액</span>
                    <div className="text-xs text-[#92400E] mt-0.5">{hmAcct.bank} {hmAcct.account} {hmAcct.holder}</div>
                  </div>
                  <span className="text-xl font-bold text-[#92400E]">{grandTotal.toLocaleString()}원</span>
                </div>
              )}
            </div>

            {/* 우: 메시지 & 버튼 */}
            <div>
              <div className="text-xs font-bold mb-2.5 pb-1.5 border-b-[1.5px] border-hm-border">📱 발송 메시지 미리보기</div>
              <div className="bg-hm-bg-slate rounded-lg p-4 border border-hm-border whitespace-pre-line text-[11.5px] text-gray-700 leading-[1.8] mb-4 max-h-[360px] overflow-auto">{msg}</div>
              <div className="flex gap-2">
                {!t.confirmed ? (
                  <button onClick={() => { confirmItem(t); setSelectedItem({ ...t, confirmed: true }); }}
                    className="flex-1 p-3 rounded-lg border-none bg-hm-success text-white text-sm font-bold cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
                    ✅ 금액 확인
                  </button>
                ) : !t.sent ? (
                  <button onClick={() => { sendItem(t); setSelectedItem({ ...t, sent: true }); }}
                    className="flex-1 p-3 rounded-lg border-none bg-hm-blue text-white text-sm font-bold cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
                    📱 문자 발송
                  </button>
                ) : (
                  <button className="flex-1 p-3 rounded-lg border-none bg-gray-300 text-white text-sm font-bold font-[inherit]">✓ 발송 완료</button>
                )}
                <button onClick={() => navigator.clipboard?.writeText(msg)} className="px-5 py-3 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub text-sm font-bold cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">📋 복사</button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ===== 목록 뷰 =====
  const typeTabCfg: Record<string, any> = { "단기": { icon: "🏠", c: "var(--color-hm-warning)", bg: "var(--color-hm-warning-bg)", desc: "임대료+관리비+공과금 통합 · 월세일 기준 청구" },
    "고정관리비": { icon: "🏢", c: "var(--color-hm-blue-dark)", bg: "var(--color-hm-blue-bg)", desc: "일반임대/근생 · 고정관리비 건물" },
    "변동관리비": { icon: "📊", c: "#7C3AED", bg: "#F5F3FF", desc: "일반임대/근생 · 변동관리비 건물" } };

  return (
    <div>
      <SectionTitle sub={`${billingMonth.slice(5)}월 · ${typeTab} ${myTenants.length}건`}>{billingMode === "unified" ? "⚡ 청구 관리" : billingMode === "variable" ? "📊 청구(변동관리비)" : "⚡ 청구(단기/고정관리비)"}</SectionTitle>

      {/* 도구 버튼 행 */}
      <div className="flex gap-1.5 mb-2 flex-wrap">
        <button onClick={() => setShowSetupWizard(true)}
          className="px-3 py-1.5 rounded-lg border-[1.5px] border-[#C4B5FD] bg-[#F5F3FF] text-xs font-bold text-[#7C3AED] cursor-pointer font-[inherit] hover:shadow-sm transition-shadow">
          ⚙️ 청구 설정
        </button>
        <button onClick={() => setShowMeterUpload("elec")}
          className="px-3 py-1.5 rounded-lg border-[1.5px] border-[#BFDBFE] bg-hm-blue-bg text-xs font-bold text-hm-blue-dark cursor-pointer font-[inherit] hover:shadow-sm transition-shadow">
          📊 검침 업로드
        </button>
        {typeTab === "변동관리비" && filterBuilding !== "전체" && (
          <button onClick={() => setShowVariableView(filterBuilding)}
            className="px-3 py-1.5 rounded-lg border-[1.5px] border-[#BBF7D0] bg-[#F0FDF4] text-xs font-bold text-hm-success cursor-pointer font-[inherit] hover:shadow-sm transition-shadow">
            📈 변동비 안분
          </button>
        )}
      </div>

      {/* 유형 탭 */}
      <div className="flex gap-1 mb-2">
        {availableTypes.map(t => {
          const cfg = typeTabCfg[t];
          const active = typeTab === t;
          return (
            <button key={t} onClick={() => { setTypeTab(t); setFilterTab("전체"); setFilterBuilding("전체"); }}
              className="flex-1 px-1 py-1.5 rounded-lg cursor-pointer font-[inherit] transition-all"
              style={{ border: active ? `2px solid ${cfg.c}` : "1.5px solid var(--color-hm-input-border)", background: active ? cfg.bg : "#fff" }}>
              <div className="text-xs font-bold" style={{ color: active ? cfg.c : "var(--color-hm-text-sub)" }}>{cfg.icon} {t} <span className="text-base font-bold">{typeCounts[t]}</span></div>
              <div className="text-[8px] text-hm-text-muted mt-[1px]">{cfg.desc}</div>
            </button>
          );
        })}
      </div>

      {/* 단기: 청구 기간 설정 + 업로드 */}
      {(typeTab === "단기" || typeTab === "고정관리비") && (
        <>
          {(() => {
            const hist: any[] = billingPeriod.history || [];
            const lastEnd = hist.length > 0 ? hist[hist.length - 1].endDay : 0;
            const autoStart = lastEnd > 0 ? (lastEnd % 31) + 1 : billingPeriod.startDay;
            return (
              <Card className={`mb-2 !px-4 !py-2.5 ${billingPeriod.confirmed ? 'border-2 border-hm-success bg-[#F0FDF4]' : 'border-2 border-[#F59E0B] bg-[#FFFBEB]'}`}>
                <div className={`flex items-center justify-between ${billingPeriod.confirmed ? '' : 'mb-2'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📆</span>
                    <div>
                      <div className={`text-xs font-bold ${billingPeriod.confirmed ? 'text-hm-success' : 'text-[#92400E]'}`}>
                        {billingPeriod.confirmed ? "청구 기간 확정" : "청구 기간 설정 (월세일 범위)"}
                      </div>
                      {billingPeriod.confirmed && (
                        <div className="text-xs font-bold text-hm-text mt-0.5">
                          매월 {billingPeriod.startDay}일 ~ {billingPeriod.endDay}일 납부 호실
                        </div>
                      )}
                    </div>
                  </div>
                  {billingPeriod.confirmed && (
                    <button onClick={() => setBillingPeriod({ ...billingPeriod, confirmed: false })}
                      className="px-3 py-1 rounded-md border border-gray-300 bg-white text-xs font-bold text-hm-text-sub cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
                      변경
                    </button>
                  )}
                </div>
                {!billingPeriod.confirmed && (
                  <>
                    {hist.length > 0 && (
                      <div className="text-xs text-hm-success font-semibold mb-1.5 px-2 py-1 bg-hm-success-bg rounded-md">
                        이전 청구: {hist.map((h: any) => `${h.startDay}~${h.endDay}일`).join(" → ")}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-xs text-hm-text-sub font-semibold">매월</span>
                        <span className="px-2.5 py-1.5 rounded-md bg-gray-100 border-[1.5px] border-hm-input-border text-sm font-bold text-hm-text min-w-[36px] text-center">
                          {autoStart}
                        </span>
                        <span className="text-xs text-hm-text-sub font-semibold">일 ~</span>
                        <input type="number" min="1" max="31" value={billingPeriod.endDay}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBillingPeriod({ ...billingPeriod, startDay: autoStart, endDay: Math.max(1, Math.min(31, parseInt(e.target.value) || 1)) })}
                          className="w-[52px] px-2 py-1.5 rounded-md border-[1.5px] border-hm-input-border text-sm font-[inherit] text-center font-bold focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
                        <span className="text-xs text-hm-text-sub font-semibold">일</span>
                      </div>
                      <button onClick={() => {
                        const newHistory = [...hist, { startDay: autoStart, endDay: billingPeriod.endDay, confirmedAt: new Date().toISOString() }];
                        setBillingPeriod({ startDay: autoStart, endDay: billingPeriod.endDay, confirmed: true, history: newHistory });
                      }}
                        className="px-4 py-1.5 rounded-md border-none bg-hm-success text-white text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:opacity-90 transition-opacity">
                        확정
                      </button>
                    </div>
                  </>
                )}
              </Card>
            );
          })()}

          {/* 업로드 버튼 (기간 확정 후만 활성화) */}
          <div className={`flex gap-1 mb-1.5 ${billingPeriod.confirmed ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <button onClick={() => setShowUpload(showUpload === "elec" ? null : "elec")}
              className={`flex-1 px-2.5 py-[5px] rounded-md cursor-pointer font-[inherit] text-xs font-bold text-[#92400E] transition-all ${showUpload === "elec" ? 'border-2 border-[#F59E0B] bg-[#FFFBEB]' : 'border-[1.5px] border-hm-input-border bg-white hover:bg-hm-bg-hover'}`}>
              ⚡ 전기 엑셀 업로드
            </button>
            <button onClick={() => setShowUpload(showUpload === "gas" ? null : "gas")}
              className={`flex-1 px-2.5 py-[5px] rounded-md cursor-pointer font-[inherit] text-xs font-bold text-[#991B1B] transition-all ${showUpload === "gas" ? 'border-2 border-red-500 bg-hm-danger-bg' : 'border-[1.5px] border-hm-input-border bg-white hover:bg-hm-bg-hover'}`}>
              🔥 가스 업로드
            </button>
            <button onClick={() => {
              const gasRows: any[][] = [];
              const header = ["호실고유값", "고객번호", "기간", "시작기간", "끝기간", "전월검침", "당월검침", "사용량", "금액", "", "", "금액(절사)"];
              gasRows.push(header);
              billingItems.forEach((t: any) => {
                if (t.roomType !== "단기") return;
                const rKey = `${t.building}_${t.room}`;
                const rm: Record<string, any> = { ...(roomMasterData[rKey] || {}) };
                const bd = buildingData[t.building] || {};
                Object.assign(rm, bd[`room_${t.room}`] || {});
                const gasNo = rm.gasNo || "";
                const ev = editValues[rKey] || {};
                const lastCur = ev.gcr || t.gasCur || 0;
                const lastPeriod = ev.gp || t.gasPeriod || "";
                let nextPeriod = "", nextStartFull = "", nextEndFull = "";
                if (lastPeriod) {
                  const parts = lastPeriod.split("~");
                  if (parts.length === 2) {
                    const endStr = parts[1].trim();
                    const ep = endStr.split(".");
                    if (ep.length === 2) {
                      const eMonth = parseInt(ep[0], 10);
                      const eDay = parseInt(ep[1], 10);
                      const yr = new Date().getFullYear();
                      const startDate = new Date(yr, eMonth - 1, eDay + 1);
                      const sp = parts[0].trim().split(".");
                      if (sp.length === 2) {
                        const sDay = parseInt(sp[1], 10);
                        const endDate = new Date(yr, startDate.getMonth() + 1, sDay - 1);
                        const fmtMD = (d: Date) => `${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
                        const fmtFull = (d: Date) => `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
                        nextPeriod = `${fmtMD(startDate)}~${fmtMD(endDate)}`;
                        nextStartFull = fmtFull(startDate);
                        nextEndFull = fmtFull(endDate);
                      }
                    }
                  }
                }
                const code = `${t.building.replace(/\s/g, "")}${t.room}`;
                gasRows.push([code, gasNo, nextPeriod, nextStartFull, nextEndFull, lastCur, "", "", "", "", "", ""]);
              });
              const ws = XLSX.utils.aoa_to_sheet(gasRows);
              ws["!cols"] = [{ wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 4 }, { wch: 4 }, { wch: 12 }];
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "가스당월");
              const now = new Date();
              XLSX.writeFile(wb, `가스양식_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}.xlsx`);
            }}
              className="flex-[0_0_15%] px-2.5 py-[5px] rounded-md border-[1.5px] border-[#6366F1] bg-[#EEF2FF] cursor-pointer font-[inherit] text-xs font-bold text-[#4338CA] hover:shadow-sm transition-shadow">
              📥 가스양식
            </button>
          </div>
        </>
      )}

      {/* 업로드 패널 */}
      {showUpload && (
        <Card className={`mb-3 ${showUpload === "elec" ? 'border-2 border-[#F59E0B]' : 'border-2 border-red-500'}`}>
          <div className="flex justify-between items-center mb-3">
            <div className={`text-sm font-bold ${showUpload === "elec" ? 'text-[#92400E]' : 'text-[#991B1B]'}`}>
              {showUpload === "elec" ? "⚡ 전기 빌링사 엑셀 업로드" : "🔥 가스 데이터 업로드"}
            </div>
            <button onClick={() => { setShowUpload(null); setUploadResult(null); }} className="w-6 h-6 rounded border border-hm-input-border bg-white cursor-pointer text-xs font-[inherit] hover:bg-hm-bg-hover transition-colors">✕</button>
          </div>
          <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-hm-bg-hover text-center mb-3">
            <div className="text-2xl mb-2">{showUpload === "elec" ? "📊" : "📄"}</div>
            <div className="text-xs text-hm-text-sub mb-2">
              {showUpload === "elec" ? "한전 빌링사에서 다운받은 엑셀(.xlsx)을 업로드하세요" : "가스 양식 엑셀(.xlsx)을 업로드하세요"}
            </div>
            <label className={`inline-block px-6 py-2.5 rounded-lg text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity ${showUpload === "elec" ? 'bg-[#F59E0B]' : 'bg-red-500'}`}>
              📤 파일 업로드
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleFileUpload(showUpload, e.target.files[0]); }} />
            </label>
          </div>
          {uploadResult && (
            <div className={`px-4 py-2.5 rounded-lg border ${uploadResult.success ? 'bg-hm-success-bg border-[#BBF7D0]' : 'bg-hm-danger-bg border-hm-danger-border'}`}>
              <div className={`text-xs font-bold ${uploadResult.success ? 'text-hm-success' : 'text-hm-danger'} ${uploadResult.details ? 'mb-2.5' : ''}`}>
                {uploadResult.success ? "✅ " : "❌ "}{uploadResult.msg}
              </div>
              {uploadResult.details && uploadResult.details.length > 0 && (
                <div className="max-h-[360px] overflow-y-auto mt-2">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-hm-bg-slate border-b-2 border-hm-border">
                        {["건물/호실","고객번호","이전 기간","이전 당월","→","이번 전월","이번 기간","당월","사용량","금액"].map((h, hi) => (
                          <th key={hi} className={`px-1 py-1.5 font-bold text-hm-text-sub ${hi >= 2 ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.details.map((d: any, i: number) => (
                        <tr key={i} className="border-b border-[#F0F2F5]" style={{ background: !d.matched ? "var(--color-hm-danger-bg)" : d.chainMatch ? "#fff" : (d.lastCur > 0 ? "#FFFBEB" : "#fff") }}>
                          <td className="px-1 py-[5px] font-bold">{d.matched ? `${d.building} ${d.room}` : d.code}</td>
                          <td className="px-1 py-[5px] text-hm-text-sub text-xs">{d.custNo || "-"}</td>
                          {d.matched ? (<>
                            <td className="px-1 py-[5px] text-right text-[#8B5CF6] text-xs">{d.lastPeriod}</td>
                            <td className="px-1 py-[5px] text-center text-[#8B5CF6] font-bold">{d.lastCur || "-"}</td>
                            <td className="px-1 py-[5px] text-center text-xs">
                              {d.chainMatch ? <span className="text-hm-success">→</span>
                                : d.lastCur > 0 ? <span className="text-[#F59E0B]">⚠</span>
                                : <span className="text-gray-300">→</span>}
                            </td>
                            <td className={`px-1 py-[5px] text-center font-bold ${d.chainMatch ? 'text-hm-success' : d.lastCur > 0 && d.prev !== d.lastCur ? 'text-hm-danger' : 'text-hm-success'}`}>{d.prev}</td>
                            <td className="px-1 py-[5px] text-right text-hm-success text-xs">{d.period}</td>
                            <td className="px-1 py-[5px] text-right text-hm-success font-semibold">{d.cur}</td>
                            <td className="px-1 py-[5px] text-right text-hm-success">{d.usage}</td>
                            <td className="px-1 py-[5px] text-right text-hm-text font-bold">{fmt(d.amount)}</td>
                          </>) : (
                            <td colSpan={8} className="px-1 py-[5px] text-hm-danger text-xs">미매칭 — 호실정보에 가스고객번호를 등록하세요</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Status info bar */}
      <div className="px-2.5 py-1 rounded-md mb-2 text-xs" style={{ background: typeTabCfg[typeTab].bg, border: `1px solid ${typeTabCfg[typeTab].c}30`, color: typeTabCfg[typeTab].c }}>
        {typeTab === "단기" && <>💡 임대료+관리비+공과금 통합청구 · 월세일 기준 청구 · <strong className="text-hm-danger">적색=미매칭</strong></>}
        {typeTab === "고정관리비" && <>💡 일반임대/근생 · 고정관리비 건물 · 임대료+고정관리비 청구 · 담당자 확인 후 발송</>}
        {typeTab === "변동관리비" && <>💡 일반임대/근생 · 변동관리비 건물 · 공과금 기반 변동 청구 · 검침 후 발송</>}
      </div>

      {/* Status cards */}
      {typeTab === "단기" ? (
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-6'} gap-1 mb-2`}>
          {[
            { label: "자동매칭", sub: "업로드완료", count: autoCount, color: "var(--color-hm-success)", bg: "var(--color-hm-success-bg)", tab: "자동매칭" },
            { label: "수동매칭", sub: "수기입력", count: manualCount, color: "var(--color-hm-blue-dark)", bg: "var(--color-hm-blue-bg)", tab: "수동매칭" },
            { label: "미매칭", sub: "데이터없음", count: unmatchedCount, color: "var(--color-hm-danger)", bg: "var(--color-hm-danger-bg)", tab: "미매칭" },
            { label: "확인완료", sub: "발송대기", count: confirmedCount, color: "var(--color-hm-success)", bg: "var(--color-hm-success-bg)", tab: "확인완료" },
            { label: "발송완료", sub: "이번달", count: sentCount, color: "var(--color-hm-blue)", bg: "var(--color-hm-blue-bg)", tab: "발송완료" },
            { label: "전체", sub: "단기", count: billingItems.length, color: "var(--color-hm-text-sub)", bg: "var(--color-hm-bg-slate)", tab: "전체" },
          ].map((s, i) => (
            <Card key={i} onClick={() => setFilterTab(s.tab)} className="cursor-pointer !px-2 !py-1.5 transition-all hover:shadow-md" style={{ background: filterTab === s.tab ? s.bg : "#fff", border: filterTab === s.tab ? `2px solid ${s.color}` : "1px solid var(--color-hm-border)" }}>
              <div className="text-[8px] text-hm-text-muted font-semibold">{s.label}</div>
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.count}</div>
            </Card>
          ))}
        </div>
      ) : (
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-1 mb-2`}>
          {[
            { label: "확인완료", count: confirmedCount, color: "var(--color-hm-success)", bg: "var(--color-hm-success-bg)", tab: "확인완료" },
            { label: "발송완료", count: sentCount, color: "var(--color-hm-blue)", bg: "var(--color-hm-blue-bg)", tab: "발송완료" },
            { label: "전체", count: billingItems.length, color: "var(--color-hm-text-sub)", bg: "var(--color-hm-bg-slate)", tab: "전체" },
          ].map((s, i) => (
            <Card key={i} onClick={() => setFilterTab(s.tab)} className="cursor-pointer !px-2 !py-1.5 transition-all hover:shadow-md" style={{ background: filterTab === s.tab ? s.bg : "#fff", border: filterTab === s.tab ? `2px solid ${s.color}` : "1px solid var(--color-hm-border)" }}>
              <div className="text-[8px] text-hm-text-muted font-semibold">{s.label}</div>
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.count}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 mb-1.5 items-center flex-wrap">
        <select value={filterBuilding} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterBuilding(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border-[1.5px] border-hm-input-border text-xs font-semibold font-[inherit] focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors">
          {buildingNames.map(b => <option key={b}>{b}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <span className="text-xs text-hm-text-muted font-semibold">담당:</span>
          <select
            value={filterBuilding !== "전체" ? getBillingAssignee(filterBuilding) : ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              if (filterBuilding !== "전체") {
                setBillingAssignees((prev: Record<string, string>) => ({ ...prev, [filterBuilding]: e.target.value }));
              }
            }}
            disabled={filterBuilding === "전체"}
            className={`px-2.5 py-1.5 rounded-lg border-[1.5px] border-hm-input-border text-xs font-semibold font-[inherit] focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors ${filterBuilding === "전체" ? 'bg-hm-bg' : 'bg-white'}`}>
            {filterBuilding === "전체"
              ? <option>건물 선택 후 지정</option>
              : internalStaff.map((s: Staff) => <option key={s.id} value={s.name}>{s.name}</option>)
            }
          </select>
        </div>
        {(() => {
          const matchedUnsent = billingItems.filter((i: any) => (i.matchStatus === "auto" || i.matchStatus === "manual") && !i.sent);
          const cnt = matchedUnsent.length;
          return (
            <button onClick={() => {
              if (cnt === 0) return;
              if (!window.confirm(`매칭된 ${cnt}건을 확인+발송 처리합니다.`)) return;
              matchedUnsent.forEach((i: any) => {
                if (!i.confirmed) confirmItem(i);
                sendItem({ ...i, confirmed: true });
              });
            }}
              className={`ml-auto px-4 py-[7px] rounded-lg border-none text-white text-xs font-bold font-[inherit] transition-opacity ${cnt > 0 ? 'bg-hm-success cursor-pointer hover:opacity-90' : 'bg-gray-300 cursor-default opacity-60'}`}>
              📱 매칭 일괄발송 ({cnt}건)
            </button>
          );
        })()}
      </div>

      {/* 청구 리스트 */}
      <div className="flex flex-col gap-1.5">
        {filtered.length === 0 && <div className="text-center py-10 text-[#B0B5C1] text-sm">해당 조건 없음</div>}
        {filtered.map((r: any, i: number) => {
          const noData = r.noElec || r.noGas;
          const urgent = r.roomType === "단기" && !r.sent && r.daysUntilDue >= 0 && r.daysUntilDue <= 7;
          const ev = editValues[r.key] || {};
          const elecVal = ev.elec ?? r.elec;
          const gasVal = ev.gas ?? r.gas;
          const inpCls = "px-2.5 py-[7px] rounded-md border-[1.5px] border-gray-300 text-sm font-[inherit] text-right font-bold bg-[#FAFBFC] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors";
          return (
            <div key={i}
              className={`px-4 py-2.5 rounded-lg cursor-pointer transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${urgent ? 'bg-hm-danger-bg border-[1.5px] border-hm-danger-border' : noData ? 'bg-hm-danger-bg border-[1.5px] border-hm-danger-border' : r.confirmed ? 'bg-[#F0FDF4] border-[1.5px] border-[#BBF7D0]' : 'bg-white border-[1.5px] border-hm-border'}`}>
              <div className="flex items-center justify-between mb-1.5"
                onClick={() => setSelectedItem(r)}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-bold text-hm-text whitespace-nowrap">{r.building}</span>
                  <span className="text-xs font-bold text-hm-blue whitespace-nowrap">{r.room}호</span>
                  <span className="text-xs font-semibold text-hm-text-sub whitespace-nowrap overflow-hidden text-ellipsis">{r.name}</span>
                  <span className="text-xs font-bold text-[#92400E] px-1.5 py-0.5 rounded bg-[#FFFBEB] whitespace-nowrap">{r.dueDay}일</span>
                  {r.daysUntilDue >= 0 ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-[5px] whitespace-nowrap text-white"
                      style={{ background: r.daysUntilDue <= 3 ? "var(--color-hm-danger)" : r.daysUntilDue <= 7 ? "#F59E0B" : "#E5E7EB", color: r.daysUntilDue <= 7 ? "#fff" : "var(--color-hm-text-sub)" }}>D-{r.daysUntilDue}</span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-[5px] bg-hm-bg text-hm-text-muted whitespace-nowrap">D+{Math.abs(r.daysUntilDue)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold px-2 py-[3px] rounded-[5px] whitespace-nowrap"
                    style={{
                      background: r.confirmed ? "var(--color-hm-success-bg)" : r.matchStatus === "none" ? "var(--color-hm-danger-bg)" : r.matchStatus === "manual" ? "var(--color-hm-blue-bg)" : "var(--color-hm-success-bg)",
                      color: r.confirmed ? "var(--color-hm-success)" : r.matchStatus === "none" ? "var(--color-hm-danger)" : r.matchStatus === "manual" ? "var(--color-hm-blue-dark)" : "var(--color-hm-success)",
                    }}>{r.confirmed ? "확인완료" : r.matchStatus === "none" ? "미매칭" : r.matchStatus === "manual" ? "수동매칭" : "자동매칭"}</span>
                  <div className="flex gap-[3px]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    {!r.confirmed ? (
                      <button onClick={() => confirmItem(r)} className="px-2.5 py-1 rounded-[5px] border border-[#BBF7D0] bg-hm-success-bg text-hm-success text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:shadow-sm transition-shadow">✅확인</button>
                    ) : !r.sent ? (
                      <button onClick={() => sendItem(r)} className="px-2.5 py-1 rounded-[5px] border border-[#BFDBFE] bg-hm-blue-bg text-hm-blue-dark text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:shadow-sm transition-shadow">📱발송</button>
                    ) : null}
                    <button onClick={() => setShowRoomSettings({ roomId: r.roomId, buildingId: r.buildingId, tenantName: r.name, roomNumber: r.room, buildingName: r.building })}
                      className="px-2 py-1 rounded-[5px] border border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED] text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:shadow-sm transition-shadow" title="호실 청구 설정">⚙️</button>
                    {r.confirmed && (
                      <button onClick={() => setShowInvoice({ ...r, tenantName: r.name, buildingName: r.building, roomNumber: r.room })}
                        className="px-2 py-1 rounded-[5px] border border-[#FDE68A] bg-[#FFFBEB] text-[#92400E] text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:shadow-sm transition-shadow" title="청구서 보기">🧾</button>
                    )}
                  </div>
                </div>
              </div>
              {/* 2줄: 전기/가스 검침 인라인 수정 */}
              <div className="flex items-center gap-2 flex-wrap" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                {r.roomType === "단기" && <>
                  <div className={`flex items-center gap-1.5 w-full rounded-lg relative ${r.noElec && !elecVal ? 'py-2 px-3 bg-hm-danger-bg border-[2.5px] border-red-500' : 'py-1 px-2 bg-[#FFFBEB] border border-[#FDE68A]'}`}>
                    {r.noElec && !elecVal && <div className="absolute -top-px right-2 bg-hm-danger text-white text-xs font-bold px-2 py-[1px] rounded-b-md tracking-wider">미매칭</div>}
                    <span className={`text-sm font-bold whitespace-nowrap min-w-[44px] ${r.noElec && !elecVal ? 'text-hm-danger' : 'text-[#D97706]'}`}>⚡전기</span>
                    {r.noElec && !r.carryOverElec && !elecVal ? (
                      <span className="text-xs text-hm-danger font-bold bg-white px-2.5 py-[3px] rounded-md border-[1.5px] border-hm-danger-border">데이터 없음 — 이번 청구 제외, 다음달 이어청구</span>
                    ) : null}
                    <span className="text-xs text-gray-500 font-bold whitespace-nowrap">기간</span>
                    <input type="text" value={((ev.es ?? r.elecStart) || "").replace(/^\d{4}\//, "")} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues((prev: Record<string, any>) => ({ ...prev, [r.key]: { ...prev[r.key], es: e.target.value } }))}
                      className={`${inpCls} w-[66px] !text-center`} placeholder="M/D" />
                    <span className="text-sm font-bold text-gray-400">~</span>
                    <input type="text" value={((ev.ee ?? r.elecEnd) || "").replace(/^\d{4}\//, "")} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues((prev: Record<string, any>) => ({ ...prev, [r.key]: { ...prev[r.key], ee: e.target.value } }))}
                      className={`${inpCls} w-[66px] !text-center`} placeholder="M/D" />
                    <div className="w-px h-5 bg-gray-200 mx-0.5" />
                    <span className="text-xs text-gray-500 font-bold whitespace-nowrap">검침</span>
                    <input type="number" value={ev.ep ?? r.elecPrev} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues((prev: Record<string, any>) => ({ ...prev, [r.key]: { ...prev[r.key], ep: parseInt(e.target.value) || 0 } }))}
                      className={`${inpCls} w-20`} placeholder="시작" />
                    <span className="text-base font-bold text-gray-400">-</span>
                    <input type="number" value={ev.ec ?? r.elecCur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues((prev: Record<string, any>) => ({ ...prev, [r.key]: { ...prev[r.key], ec: parseInt(e.target.value) || 0 } }))}
                      className={`${inpCls} w-20`} placeholder="끝" />
                    <div className="w-px h-5 bg-gray-200 mx-0.5" />
                    <span className="text-xs text-gray-500 font-bold whitespace-nowrap">사용</span>
                    <input type="number" value={ev.eu ?? r.elecUsage} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues((prev: Record<string, any>) => ({ ...prev, [r.key]: { ...prev[r.key], eu: parseInt(e.target.value) || 0 } }))}
                      className={`${inpCls} w-[66px]`} />
                    <span className="text-xs text-gray-500 font-bold whitespace-nowrap">금액</span>
                    <input type="text" value={elecVal ? fmt(elecVal) : ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues((prev: Record<string, any>) => ({ ...prev, [r.key]: { ...prev[r.key], elec: parseInt(e.target.value.replace(/,/g, "")) || 0 } }))}
                      className={`${inpCls} w-24 !font-bold`} style={{ background: elecVal ? "var(--color-hm-warning-bg)" : "var(--color-hm-danger-bg)", borderColor: elecVal ? "#FDBA74" : "var(--color-hm-danger-border)" }} placeholder="0" />
                  </div>
                  <div className={`flex items-center gap-1.5 w-full rounded-lg relative ${r.noGas && !gasVal ? 'py-2 px-3 bg-hm-danger-bg border-[2.5px] border-red-500' : 'py-1 px-2 bg-[#FFF1F2] border border-[#FECDD3]'}`}>
                    {r.noGas && !gasVal && <div className="absolute -top-px right-2 bg-hm-danger text-white text-xs font-bold px-2 py-[1px] rounded-b-md tracking-wider">미매칭</div>}
                    <span className={`text-sm font-bold whitespace-nowrap min-w-[44px] ${r.noGas && !gasVal ? 'text-hm-danger' : 'text-hm-danger'}`}>🔥가스</span>
                    {r.noGas && !r.carryOverGas && !gasVal ? (
                      <span className="text-xs text-hm-danger font-bold bg-white px-2.5 py-[3px] rounded-md border-[1.5px] border-hm-danger-border">데이터 없음 — 이번 청구 제외, 다음달 이어청구</span>
                    ) : null}
                    <span className="text-xs text-gray-500 font-bold whitespace-nowrap">기간</span>
                    {(() => {
                      const gp = ev.gp ?? r.gasPeriod ?? "";
                      const parts = gp.split("~");
                      const gs = (parts[0] || "").trim().replace(/\./g, "/").replace(/^\d{4}\//, "");
                      const ge = (parts[1] || "").trim().replace(/\./g, "/").replace(/^\d{4}\//, "");
                      return <>
                        <input type="text" value={gs} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newGp = `${e.target.value.replace(/\//g, ".")}~${ge.replace(/\//g, ".")}`;
                          setEditValues((prev: Record<string, any>) => ({ ...prev, [r.key]: { ...prev[r.key], gp: newGp } }));
                        }} className={`${inpCls} w-[66px] !text-center`} placeholder="M/D" />
                        <span className="text-sm font-bold text-gray-400">~</span>
                        <input type="text" value={ge} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newGp = `${gs.replace(/\//g, ".")}~${e.target.value.replace(/\//g, ".")}`;
                          setEditValues((prev: Record<string, any>) => ({ ...prev, [r.key]: { ...prev[r.key], gp: newGp } }));
                        }} className={`${inpCls} w-[66px] !text-center`} placeholder="M/D" />
                      </>;
                    })()}
                    <div className="w-px h-5 bg-gray-200 mx-0.5" />
                    <span className="text-xs text-gray-500 font-bold whitespace-nowrap">검침</span>
                    <input type="number" value={ev.gpr ?? r.gasPrev} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues((prev: Record<string, any>) => ({ ...prev, [r.key]: { ...prev[r.key], gpr: parseInt(e.target.value) || 0 } }))}
                      className={`${inpCls} w-20`} placeholder="시작" />
                    <span className="text-base font-bold text-gray-400">-</span>
                    <input type="number" value={ev.gcr ?? r.gasCur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues((prev: Record<string, any>) => ({ ...prev, [r.key]: { ...prev[r.key], gcr: parseInt(e.target.value) || 0 } }))}
                      className={`${inpCls} w-20`} placeholder="끝" />
                    <div className="w-px h-5 bg-gray-200 mx-0.5" />
                    <span className="text-xs text-gray-500 font-bold whitespace-nowrap">사용</span>
                    <input type="number" value={ev.gu ?? r.gasUsage} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues((prev: Record<string, any>) => ({ ...prev, [r.key]: { ...prev[r.key], gu: parseInt(e.target.value) || 0 } }))}
                      className={`${inpCls} w-[66px]`} />
                    <span className="text-xs text-gray-500 font-bold whitespace-nowrap">금액</span>
                    <input type="text" value={gasVal ? fmt(gasVal) : ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues((prev: Record<string, any>) => ({ ...prev, [r.key]: { ...prev[r.key], gas: parseInt(e.target.value.replace(/,/g, "")) || 0 } }))}
                      className={`${inpCls} w-24 !font-bold`} style={{ background: gasVal ? "#FFF1F2" : "var(--color-hm-danger-bg)", borderColor: gasVal ? "#FDA4AF" : "var(--color-hm-danger-border)" }} placeholder="0" />
                  </div>
                </>}
                <div className="ml-auto text-xs font-bold text-hm-text whitespace-nowrap">
                  {fmt((ev.rent ?? r.rent) + (ev.mgmt ?? r.mgmt) + (r.roomType === "단기" ? elecVal + gasVal + (ev.water ?? r.water) + (ev.cable ?? r.cable) : 0))}원
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 text-xs text-[#B0B5C1] text-center">
        ※ {typeTab === "단기" ? "임대료+관리비+공과금 통합 · 전기=엑셀 · 가스=파일 · 수도/인터넷=고정 · 월세일 기준 청구" : typeTab === "고정관리비" ? "고정관리비 건물 · 임대료+고정관리비 · 담당자 확인 후 발송" : "변동관리비 건물 · 공과금 기반 변동 청구 · 검침 후 발송"}
      </div>

      {/* ── 청구 설정 마법사 모달 ── */}
      {showSetupWizard && (
        <div className="fixed inset-0 z-[9000] bg-black/45 flex items-center justify-center"
          onClick={() => setShowSetupWizard(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-[600px] w-[95vw] max-h-[90vh] overflow-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <BillingSetupWizard
              buildingId={null}
              buildingName={filterBuilding !== "전체" ? filterBuilding : ""}
              buildingType={typeTab === "단기" ? "short" : typeTab === "고정관리비" ? "fixed" : "variable"}
              onComplete={() => { setShowSetupWizard(false); toast.success("청구 설정이 저장되었습니다."); }}
              onCancel={() => setShowSetupWizard(false)}
            />
          </div>
        </div>
      )}

      {/* ── 검침 업로드 모달 ── */}
      {showMeterUpload && (
        <div className="fixed inset-0 z-[9000] bg-black/45 flex items-center justify-center"
          onClick={() => setShowMeterUpload(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-[600px] w-[95vw] max-h-[90vh] overflow-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-base font-bold">📊 검침 엑셀 업로드</span>
              <button onClick={() => setShowMeterUpload(null)} className="border-none bg-transparent text-xl cursor-pointer text-[#94A3B8] hover:text-hm-text transition-colors">✕</button>
            </div>
            <MeterUpload
              billingMonth={billingMonth}
              onComplete={(result) => { setShowMeterUpload(null); toast.success(`검침 매칭 완료: ${result.matched.length}건 성공, ${result.unmatched.length}건 미매칭`); }}
            />
          </div>
        </div>
      )}

      {/* ── 변동관리비 뷰 모달 ── */}
      {showVariableView && (
        <div className="fixed inset-0 z-[9000] bg-black/45 flex items-center justify-center"
          onClick={() => setShowVariableView(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-[900px] w-[95vw] max-h-[90vh] overflow-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <VariableBillingView
              buildingName={showVariableView}
              tenants={myTenants.filter((t: any) => t.building === showVariableView)}
              onBack={() => setShowVariableView(null)}
              billingMonth={billingMonth}
            />
          </div>
        </div>
      )}

      {/* ── 호실별 청구 설정 패널 ── */}
      {showRoomSettings && (
        <div className="fixed inset-0 z-[9000] bg-black/45 flex items-center justify-center"
          onClick={() => setShowRoomSettings(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-[500px] w-[95vw] max-h-[90vh] overflow-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <RoomBillingSettingsPanel
              roomId={showRoomSettings?.roomId}
              buildingId={showRoomSettings?.buildingId}
              tenantName={showRoomSettings?.tenantName}
              roomNumber={showRoomSettings?.roomNumber}
              buildingName={showRoomSettings?.buildingName}
              onClose={() => setShowRoomSettings(null)}
              onSaved={() => { setShowRoomSettings(null); toast.success("호실 청구 설정이 저장되었습니다."); }}
            />
          </div>
        </div>
      )}

      {/* ── 청구서 미리보기 모달 ── */}
      {showInvoice && (
        <div className="fixed inset-0 z-[9000] bg-black/45 flex items-center justify-center"
          onClick={() => setShowInvoice(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-[500px] w-[95vw] max-h-[90vh] overflow-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-base font-bold">🧾 청구서 미리보기</span>
              <button onClick={() => setShowInvoice(null)} className="border-none bg-transparent text-xl cursor-pointer text-[#94A3B8] hover:text-hm-text transition-colors">✕</button>
            </div>
            <BillingInvoiceTemplate
              record={showInvoice}
              tenantName={showInvoice?.tenantName}
              buildingName={showInvoice?.buildingName}
              roomNumber={showInvoice?.roomNumber}
              billingMonth={billingMonth}
            />
          </div>
        </div>
      )}
    </div>
  );
};
