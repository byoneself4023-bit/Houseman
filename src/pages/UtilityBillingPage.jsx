import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { buildings, billingConfig, elecCustomerMap, gasCodeMap, billingTypeMap, buildingAccountMap, buildingAbbr, truncate10, calcLateFee, roomMasterData } from '../data';
import { useIsMobile, fmt } from '../utils';
import { matchKorean } from '../utils/koreanSearch';
import { Card, SectionTitle, Table, StatusBadge, RoomTypeBadge } from '../components';
import { getRoomType } from '../config';
import { useLocalStorage } from '../utils/useLocalStorage';
import { initialStaffMembers } from '../config/staff';

export const UtilityBillingPage = ({ billingMode = "fixed", myBuildings = [], activeTenants = [], addBilling, billingConfirmed, setBillingConfirmed, billingSent, setBillingSent, roomBalances, billingHistory, buildingData = {} }) => {
  const isMobile = useIsMobile();
  // AS 유상수리 데이터 로드
  const [asItemsLocal, setAsItemsLocal] = useLocalStorage("hm_asItems", []);
  // 건물별 관리비유형 읽기 (buildingData prop에서)
  const getBldgMgmtType = (bName) => {
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [editValues, setEditValues] = useLocalStorage("hm_editValues", {});
  const [showUpload, setShowUpload] = useState(null); // "elec" | "gas" | null
  const [uploadResult, setUploadResult] = useState(null);
  const today = new Date().getDate();
  const billingMonth = `2026-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  // 청구 기간 = 월세일(납부일) 범위 필터
  // history: 이전 확정된 기간들 [{startDay, endDay, confirmedAt}]
  const [billingPeriod, setBillingPeriod] = useLocalStorage("hm_billingPeriod", { startDay: 1, endDay: 5, confirmed: false, history: [] });

  // 공과금 청구 담당자 (건물별로 별도 지정 가능)
  const [billingAssignees, setBillingAssignees] = useLocalStorage("hm_billingAssignees", {});
  const internalStaff = initialStaffMembers.filter(s => s.roles.includes("internal") || s.roles.includes("general"));
  const getBillingAssignee = (building) => billingAssignees[building] || "공원식 대리";

  // 유형별 필터
  const allTenants = useMemo(() => (myBuildings.length > 0 ? activeTenants.filter(t => myBuildings.includes(t.building)) : activeTenants)
    .filter(t => t.name && t.name !== "퇴실" && t.rent > 0), [myBuildings, activeTenants]);
  // 청구 분류: 단기=단기, 일반임대/근생 → 건물 mgmtType에 따라 고정관리비/변동관리비
  const getBillingCategory = (building, room) => {
    const rt = getRoomType(building, room);
    if (rt === "단기") return "단기";
    if (rt === "관리사무소") return "단기"; // 관리사무소는 단기 쪽에 포함
    const mt = getBldgMgmtType(building);
    return mt === "고정관리비" ? "고정관리비" : "변동관리비";
  };
  // 월세일 계산: rentDay 필드 > 입주일의 day > due에서 추출 > 1일
  const getRentDay = (t) => {
    if (t.rentDay) return t.rentDay;
    if (t.moveIn) return new Date(t.moveIn).getDate();
    if (t.due) return parseInt(t.due.replace(/\D/g, "")) || 1;
    return 1;
  };
  // ── 검침값 체인 시스템 (billingItems에서 사용하므로 먼저 선언) ──
  const loadMeterChain = () => {
    try { return JSON.parse(localStorage.getItem("hm_meterChain") || "{}"); } catch { return {}; }
  };
  const getLastReading = (roomKey, type) => {
    const chain = loadMeterChain();
    return chain[roomKey]?.[type] || null;
  };

  const typeCounts = useMemo(() => {
    const counts = { "단기": 0, "고정관리비": 0, "변동관리비": 0 };
    allTenants.forEach(t => { const cat = getBillingCategory(t.building, t.room); if (counts[cat] !== undefined) counts[cat]++; });
    return counts;
  }, [allTenants]);
  const myTenants = useMemo(() => allTenants.filter(t => getBillingCategory(t.building, t.room) === typeTab), [allTenants, typeTab]);
  const buildingNames = useMemo(() => ["전체", ...new Set(myTenants.map(t => t.building))], [myTenants]);

  // AS 유상수리 중 완료된 미청구 항목을 호실별로 그룹화
  const asRepairByRoom = useMemo(() => {
    const map = {};
    asItemsLocal.forEach(item => {
      if (item.status === "완료" && item.paid === "유상" && item.cost > 0 && !item.billed) {
        const key = `${item.building}_${item.room}`;
        if (!map[key]) map[key] = [];
        map[key].push(item);
      }
    });
    return map;
  }, [asItemsLocal]);

  const billingItems = myTenants.map(t => {
    const bc = billingConfig.find(b => b.b === t.building && b.r === t.room);
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
          const fmd = (d) => `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
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
              const fmd = (d) => `${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
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
    const asRepairCost = asRepairItems.reduce((s, a) => s + (a.cost || 0), 0);
    return { ...t, roomType, dueDay, daysUntilDue, isTarget, elec, gas, water, cable,
      elecStart, elecEnd, elecPrev, elecCur, elecUsage,
      gasPeriod, gasPrev, gasCur, gasUsage,
      noElec, noGas, carryOverElec, carryOverGas, matchStatus, prevUnpaid, key,
      asRepairItems, asRepairCost,
      confirmed: billingConfirmed[key] || false, sent: billingSent[key] || false };
  });


  const filtered = billingItems.filter(item => {
    if (filterBuilding !== "전체" && item.building !== filterBuilding) return false;
    if (filterTab === "미매칭") return item.matchStatus === "none" && !item.sent;
    if (filterTab === "수동매칭") return item.matchStatus === "manual" && !item.sent;
    if (filterTab === "자동매칭") return item.matchStatus === "auto" && !item.sent;
    if (filterTab === "확인완료") return item.confirmed && !item.sent;
    if (filterTab === "발송완료") return item.sent;
    // 전체 탭: 납부일 7일 전 ~ 납부일 당일까지만 (발송완료 제외)
    if (item.sent) return false;
    return item.daysUntilDue >= 0 && item.daysUntilDue <= 7;
  }).sort((a, b) => a.dueDay - b.dueDay);

  const unmatchedCount = billingItems.filter(i => i.matchStatus === "none" && !i.sent).length;
  const manualCount = billingItems.filter(i => i.matchStatus === "manual" && !i.sent).length;
  const autoCount = billingItems.filter(i => i.matchStatus === "auto" && !i.sent).length;
  const confirmedCount = billingItems.filter(i => i.confirmed && !i.sent).length;
  const sentCount = billingItems.filter(i => i.sent).length;

  const confirmItem = (item) => setBillingConfirmed(prev => ({ ...prev, [item.key]: true }));
  const sendItem = (item) => {
    if (!item.confirmed) return;
    setBillingSent(prev => ({ ...prev, [item.key]: true }));
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
      const billedIds = new Set(item.asRepairItems.map(a => a.id));
      setAsItemsLocal(prev => prev.map(a => billedIds.has(a.id) ? { ...a, billed: true } : a));
    }
  };

  const getEditVal = (key, field, fallback) => {
    if (editValues[key] && editValues[key][field] !== undefined) return editValues[key][field];
    return fallback;
  };
  const setEditVal = (key, field, val) => {
    setEditValues(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: parseInt(val) || 0 } }));
  };

  const fmtPeriod = (start, end) => {
    if (!start || !end) return "";
    const s = start.replace(/\//g, ".").replace("2025.", "").replace("2026.", "");
    const e = end.replace(/\//g, ".").replace("2025.", "").replace("2026.", "");
    return `${s}~${e}`;
  };

  // 엑셀 업로드 핸들러 (전기/가스)
  // 헤더명으로 컬럼 인덱스 자동 감지
  const findCol = (headers, names) => {
    for (const name of names) {
      const idx = headers.findIndex(h => String(h || "").trim() === name);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  // saveMeterChain은 업로드 핸들러에서만 사용
  const saveMeterChain = (updates) => {
    const chain = loadMeterChain();
    Object.entries(updates).forEach(([roomKey, data]) => {
      if (chain[roomKey] === undefined) chain[roomKey] = {};
      Object.entries(data).forEach(([type, val]) => {
        chain[roomKey][type] = val;
      });
    });
    localStorage.setItem("hm_meterChain", JSON.stringify(chain));
  };

  // 이전 달 검침값 불러오기 (레거시 호환)
  const loadPrevReadings = (type) => {
    try { return JSON.parse(localStorage.getItem(`hm_${type}Readings`) || "{}"); } catch { return {}; }
  };
  const saveCurReadings = (type, readings) => {
    const prev = loadPrevReadings(type);
    localStorage.setItem(`hm_${type}Readings`, JSON.stringify({ ...prev, ...readings }));
  };

  // 호실 마스터(elecNo/gasNo) + 하드코딩 맵을 합쳐 동적 매핑 빌드
  const buildElecMap = () => {
    const map = { ...elecCustomerMap };
    // buildingData + roomMasterData에서 호실별 전기고객번호 추출
    activeTenants.forEach(t => {
      const key = `${t.building}_${t.room}`;
      const rm = { ...(roomMasterData[key] || {}) };
      const bd = buildingData[t.building] || {};
      Object.assign(rm, bd[`room_${t.room}`] || {});
      if (rm.elecNo && !map[rm.elecNo]) {
        map[rm.elecNo] = [{ b: t.building, r: String(t.room) }];
      }
    });
    return map;
  };
  const buildGasMap = () => {
    const map = { ...gasCodeMap };
    activeTenants.forEach(t => {
      const key = `${t.building}_${t.room}`;
      const rm = { ...(roomMasterData[key] || {}) };
      const bd = buildingData[t.building] || {};
      Object.assign(rm, bd[`room_${t.room}`] || {});
      if (rm.gasNo && !map[rm.gasNo]) {
        map[rm.gasNo] = { b: t.building, r: String(t.room) };
      }
    });
    return map;
  };

  const handleFileUpload = (type, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        let matched = 0, unmatched = 0;
        const updates = {};
        const chainUpdates = {};
        const headers = rows[0] || [];

        if (type === "elec") {
          // 헤더명 기반 자동 감지 (한전빌링사 엑셀 호환)
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
          const newReadings = {}; // 이번 달 검침값 저장용
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

            // 이번달 당월지침 저장 (다음달 전월지침으로 사용)
            newReadings[custNo] = { reading: curReading, month: billingYM };

            targets.forEach(t => {
              const key = `${t.b}_${t.r}`;
              // 전월지침: ① 체인(퇴실검침/직전청구) → ② 엑셀값 → ③ 레거시 저장값
              const chainReading = getLastReading(key, "elec");
              let prevReading = parseInt(row[iPrev >= 0 ? iPrev : 74]) || 0;
              if (chainReading && chainReading.reading) {
                prevReading = chainReading.reading; // 퇴실검침 or 직전 청구서 값 우선
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
              // 체인에 당월지침 저장
              chainUpdates[key] = { elec: { reading: curReading, date: periodEnd, source: "billing" } };
              matched++;
            });
          });

          // 검침 체인 + 레거시 저장
          saveMeterChain(chainUpdates);
          saveCurReadings("elec", newReadings);

          // editValues에 반영
          setEditValues(prev => {
            const next = { ...prev };
            Object.entries(updates).forEach(([key, data]) => {
              next[key] = { ...(next[key] || {}), elec: data.elec, elecUploaded: true,
                es: data.es, ee: data.ee, ep: data.ep, ec: data.ec, eu: data.eu };
            });
            return next;
          });
          const savedCount = Object.keys(newReadings).length;
          setUploadResult({ type: "elec", success: true,
            msg: `전기 업로드 완료: ${rows.length - 1}행 읽음, ${matched}호실 매칭, ${unmatched}건 미매칭, ${savedCount}건 검침값 저장${Object.values(updates).some(u => u.shared) ? " (공유계량 자동분배 적용)" : ""}`,
            rows: rows.length - 1 });

        } else {
          // 가스: 헤더 = 호실고유값(0), 고객번호(1), 기간(2), 시작기간(3), 끝기간(4), 전월검침(5), 당월검침(6), 사용량(7), 금액(8), 금액절사(11)
          const prevReadings = loadPrevReadings("gas");
          const newReadings = {};
          const dynGasMap = buildGasMap();

          // 고객번호 → 건물/호실 매핑 구축 (호실정보의 gasNo 기반)
          const gasNoToRoom = {};
          activeTenants.forEach(t => {
            const rKey = `${t.building}_${t.room}`;
            const rm = { ...(roomMasterData[rKey] || {}) };
            const bd = buildingData[t.building] || {};
            Object.assign(rm, bd[`room_${t.room}`] || {});
            if (rm.gasNo) gasNoToRoom[String(rm.gasNo)] = { b: t.building, r: String(t.room) };
          });

          const gasMatchDetails = []; // 매칭 결과 상세 (화면 표시용)

          rows.forEach((row, idx) => {
            if (idx === 0) return;
            const code = String(row[0] || "").trim(); // 호실고유값
            const custNo = String(row[1] || "").trim(); // 가스고객번호
            if (!code || code === "합계") return;

            // 매칭 우선순위: ① 고객번호 → ② 호실고유값(기존 gasCodeMap)
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

            // 이전 청구 데이터 (editValues에서)
            const lastBilling = editValues[key] || {};
            const lastCur = lastBilling.gcr || 0; // 이전 당월검침
            const lastPeriod = lastBilling.gp || "-"; // 이전 기간
            const lastAmount = lastBilling.gas || 0;

            // 전월검침 = 이전 당월검침을 자동 대입 (체인 우선)
            const chainReading = getLastReading(key, "gas");
            let prevReading = lastCur; // 기본: 이전 당월검침 → 이번 전월검침
            if (chainReading && chainReading.reading) {
              prevReading = chainReading.reading; // 퇴실검침 등 체인값이 있으면 우선
            }
            if (!prevReading) {
              prevReading = parseInt(row[5]) || 0; // 체인도 없으면 엑셀값
            }
            if (!prevReading && prevReadings[code]) {
              prevReading = prevReadings[code].reading || 0;
            }

            const curReading = parseInt(row[6]) || 0;
            const gasUsage = prevReading > 0 ? curReading - prevReading : (parseInt(row[7]) || 0);

            newReadings[code] = { reading: curReading, month: period };
            chainUpdates[key] = { gas: { reading: curReading, date: String(row[4] || ""), source: "billing" } };
            updates[key] = { gas: amount, gp: period.replace(/\d{4}[\/.]/g, ""), gpr: prevReading, gcr: curReading, gu: gasUsage };
            matched++;

            gasMatchDetails.push({
              code, custNo, building: target.b, room: target.r, matched: true,
              period, prev: prevReading, cur: curReading, usage: gasUsage, amount,
              lastCur, lastPeriod, lastAmount,
              chainMatch: lastCur > 0 && prevReading === lastCur, // 이전→이번 연속성 일치 여부
            });
          });

          saveMeterChain(chainUpdates);
          saveCurReadings("gas", newReadings);

          setEditValues(prev => {
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
      } catch (err) {
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
    // 수기 입력값 반영
    const msgElecStart = ev.es ?? t.elecStart ?? "";
    const msgElecEnd = ev.ee ?? t.elecEnd ?? "";
    const msgElecPrev = ev.ep ?? t.elecPrev;
    const msgElecCur = ev.ec ?? t.elecCur;
    const msgElecUsage = ev.eu ?? t.elecUsage;
    const msgGasPeriod = ev.gp ?? t.gasPeriod ?? "";
    const msgGasPrev = ev.gpr ?? t.gasPrev;
    const msgGasCur = ev.gcr ?? t.gasCur;
    const msgGasUsage = ev.gu ?? t.gasUsage;

    // 청구 유형 A/B 판별
    const bType = billingTypeMap[t.building] || "A";
    const abbr = buildingAbbr[t.building] || t.building.slice(0, 2);
    const acctInfo = buildingAccountMap[t.building] || {};
    const hmAcct = buildingAccountMap._houseman;

    // 유형별 메시지 템플릿
    const rentLabel = t.roomType === "관리사무소" ? "관리비" : t.roomType === "근생" ? "임대료" : "월세";
    let msg = "";

    if (bType === "B" && acctInfo.owner) {
      // === 유형 B: 이중계좌 ===
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
          lines.push(`${fmtPeriod(msgElecStart, msgElecEnd)}(${msgElecPrev}→${msgElecCur})`);
          lines.push(`사용량:${msgElecUsage}kWh`);
        } else {
          lines.push("", `·전기 : 0원`, `청구서가 나오지 않음(다음달이어청구)`);
        }
        if (g > 0) {
          lines.push("", `·가스 : ${g.toLocaleString()}원`);
          lines.push(`${msgGasPeriod}(${msgGasPrev}→${msgGasCur})`);
          lines.push(`사용량:${msgGasUsage}`);
        } else {
          lines.push("", `·가스 : 0원`, `청구서가 나오지 않음(다음달이어청구)`);
        }
      }
      if (lateFee > 0) lines.push("", `·연체수수료(5%) : ${lateFee.toLocaleString()}`);
      if (asRepairCost > 0) {
        lines.push("", `·AS 유상수리 : ${asRepairCost.toLocaleString()}`);
        (t.asRepairItems || []).forEach(a => { lines.push(`  - ${a.content || a.title}: ${(a.cost || 0).toLocaleString()}원`); });
      }
      lines.push("", `납부일은 ${billingMonth.slice(5)}/${t.dueDay}일 입니다.`);
      msg = lines.join("\n");
    } else {
      // === 유형 A: 단일계좌 ===
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
          lines.push(`${fmtPeriod(msgElecStart, msgElecEnd)}(${msgElecPrev}→${msgElecCur})`);
          lines.push(`사용량:${msgElecUsage}kWh`);
        } else {
          lines.push("", `·전기 : 0원`, `청구서가 나오지 않음(다음달이어청구)`);
        }
        if (g > 0) {
          lines.push("", `·가스 : ${g.toLocaleString()}원`);
          lines.push(`${msgGasPeriod}(${msgGasPrev}→${msgGasCur})`);
          lines.push(`사용량:${msgGasUsage}`);
        } else {
          lines.push("", `·가스 : 0원`, `청구서가 나오지 않음(다음달이어청구)`);
        }
      }
      if (lateFee > 0) lines.push("", `·연체수수료(5%) : ${lateFee.toLocaleString()}`);
      if (asRepairCost > 0) {
        lines.push("", `·AS 유상수리 : ${asRepairCost.toLocaleString()}`);
        (t.asRepairItems || []).forEach(a => { lines.push(`  - ${a.content || a.title}: ${(a.cost || 0).toLocaleString()}원`); });
      }
      lines.push("", `납부일은 ${billingMonth.slice(5)}/${t.dueDay}일 입니다.`);
      msg = lines.join("\n");
    }

    const detailInputStyle = (isMissing) => ({
      width: 110, padding: "6px 10px", borderRadius: 6,
      border: isMissing ? "2px solid #EF4444" : "1.5px solid #E0E3E9",
      background: isMissing ? "#FEF2F2" : "#fff",
      fontSize: 13, textAlign: "right", fontFamily: "inherit", fontWeight: 700
    });

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }} onClick={() => setSelectedItem(null)}>
          <span style={{ fontSize: 20 }}>←</span><span style={{ fontSize: 14, fontWeight: 700, color: "#3B82F6" }}>목록으로</span>
        </div>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                ⚡ {t.building} {t.room}호
                <RoomTypeBadge building={t.building} room={t.room} />
              </div>
              <div style={{ fontSize: 13, color: "#8F95A3", marginTop: 4 }}>{t.name} · 납부일 매월 {t.dueDay}일</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ padding: "5px 10px", borderRadius: 6, background: bType === "B" ? "#FDF4FF" : "#F0F4FF", color: bType === "B" ? "#7C3AED" : "#2563EB", fontSize: 10, fontWeight: 700 }}>
                {bType === "B" ? "이중계좌" : "단일계좌"}
              </span>
              {lateFee > 0 && <span style={{ padding: "5px 10px", borderRadius: 6, background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 700 }}>연체 +{lateFee.toLocaleString()}</span>}
              {t.confirmed && <span style={{ padding: "5px 10px", borderRadius: 6, background: "#ECFDF5", color: "#059669", fontSize: 11, fontWeight: 700 }}>✓ 확인됨</span>}
              {t.sent && <span style={{ padding: "5px 10px", borderRadius: 6, background: "#EFF6FF", color: "#2563EB", fontSize: 11, fontWeight: 700 }}>✓ 발송됨</span>}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: 16 }}>
            {/* 좌: 청구내역 */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 10, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>📋 청구 내역</div>
              {t.prevUnpaid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700 }}>🔴 미납금</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#DC2626" }}>{t.prevUnpaid.toLocaleString()}원</span>
                </div>
              )}
              {[
                { label: `🏠 ${rentLabel}`, value: t.rent },
                t.mgmt > 0 && { label: "📋 관리비", value: t.mgmt },
                t.roomType === "단기" && t.water > 0 && { label: "💧 수도 (고정)", value: t.water },
                t.roomType === "단기" && t.cable > 0 && { label: "📺 인터넷/TV (고정)", value: t.cable },
              ].filter(Boolean).map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: "#F8FAFC", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#5F6577" }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{item.value.toLocaleString()}원</span>
                </div>
              ))}

              {/* 전기/가스 - 단기만 */}
              {t.roomType === "단기" && (
                <>
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: t.noElec ? "#FEF2F2" : "#FFFBEB", border: t.noElec ? "1.5px solid #EF4444" : "1px solid #FDE68A", marginBottom: 4, marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#92400E", fontWeight: 700 }}>⚡ 전기요금</span>
                      <input value={getEditVal(t.key, "elec", e)} onChange={ev => setEditVal(t.key, "elec", ev.target.value)} style={detailInputStyle(t.noElec)} />
                    </div>
                    <div style={{ fontSize: 10, color: t.noElec ? "#DC2626" : "#92400E" }}>
                      {t.noElec ? (t.carryOverElec ? "📌 이어 청구 — 이전 검침값에서 이어서 청구됩니다" : "⚠ 한전 데이터 미매칭 — 엑셀 업로드 또는 수기 입력") : `기간: ${elecPeriodStr} · 검침: ${t.elecPrev}→${t.elecCur} · ${t.elecUsage}kWh`}
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: t.noGas ? "#FEF2F2" : "#FFF1F2", border: t.noGas ? "1.5px solid #EF4444" : "1px solid #FECACA", marginBottom: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#991B1B", fontWeight: 700 }}>🔥 가스요금</span>
                      <input value={getEditVal(t.key, "gas", g)} onChange={ev => setEditVal(t.key, "gas", ev.target.value)} style={detailInputStyle(t.noGas)} />
                    </div>
                    <div style={{ fontSize: 10, color: t.noGas ? "#DC2626" : "#991B1B" }}>
                      {t.noGas ? (t.carryOverGas ? "📌 이어 청구 — 이전 검침값에서 이어서 청구됩니다" : "⚠ 가스 데이터 미매칭 — 파일 업로드 또는 수기 입력") : `기간: ${gasPeriodStr} · 검침: ${t.gasPrev}→${t.gasCur} (${t.gasUsage})`}
                    </div>
                  </div>
                </>
              )}

              {/* 일반임대 안내 */}
              {t.roomType === "일반임대" && (
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "#F0F4FF", border: "1px solid #C7D2FE", marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#4338CA", fontWeight: 600 }}>ℹ️ 일반임대 — 임대료 + 고정관리비</div>
                  <div style={{ fontSize: 10, color: "#6366F1", marginTop: 4 }}>변동관리비 추가 시 수동 입력 · 담당자 확인 후 발송</div>
                </div>
              )}
              {/* 근생 안내 */}
              {t.roomType === "근생" && (
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "#F5F3FF", border: "1px solid #C4B5FD", marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#6D28D9", fontWeight: 600 }}>ℹ️ 근생 — 방식A: 임대료+고정+변동 / 방식B: 고정+변동만</div>
                  <div style={{ fontSize: 10, color: "#7C3AED", marginTop: 4 }}>검침일에 사용량 입력 → 월세일에 통합 청구</div>
                </div>
              )}
              {/* 관리사무소 안내 */}
              {t.roomType === "관리사무소" && (
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "#F0FDFA", border: "1px solid #99F6E4", marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#0D9488", fontWeight: 600 }}>ℹ️ 관리사무소 — 관리비만 청구</div>
                </div>
              )}

              {lateFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: "#FEF2F2", border: "1px solid #FECACA", marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700 }}>⚠ 연체수수료 (5%)</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#DC2626" }}>{lateFee.toLocaleString()}원</span>
                </div>
              )}

              {/* AS 유상수리 비용 */}
              {asRepairCost > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: "#FDF4FF", border: "1px solid #E9D5FF", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#7C3AED", fontWeight: 700 }}>🔧 AS 유상수리</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#7C3AED" }}>{asRepairCost.toLocaleString()}원</span>
                  </div>
                  {(t.asRepairItems || []).map((a, ai) => (
                    <div key={ai} style={{ display: "flex", justifyContent: "space-between", padding: "4px 12px 4px 24px", fontSize: 10, color: "#8F95A3" }}>
                      <span>{a.content || a.title} ({a.date})</span>
                      <span style={{ fontWeight: 700 }}>{(a.cost || 0).toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              )}

              {bType === "B" && acctInfo.owner ? (
                /* 이중계좌: 임대료 / 관리비&공과금 분리 표시 */
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ padding: "12px", borderRadius: 8, background: "#FFF7ED", border: "1.5px solid #FDBA74" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#EA580C" }}>① {rentLabel}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#EA580C" }}>{t.rent.toLocaleString()}원</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#92400E" }}>{acctInfo.owner.bank} {acctInfo.owner.account} {acctInfo.owner.holder}</div>
                  </div>
                  <div style={{ padding: "12px", borderRadius: 8, background: "#FEF3C7", border: "1.5px solid #F59E0B" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#92400E" }}>② 관리비&공과금</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#92400E" }}>{(grandTotal - t.rent).toLocaleString()}원</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#92400E" }}>{(acctInfo.manager || hmAcct).bank} {(acctInfo.manager || hmAcct).account} {(acctInfo.manager || hmAcct).holder}</div>
                  </div>
                  <div style={{ padding: "8px 12px", borderRadius: 6, background: "#F3F4F6", textAlign: "center" }}>
                    <span style={{ fontSize: 11, color: "#5F6577" }}>합계 </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23" }}>{grandTotal.toLocaleString()}원</span>
                  </div>
                </div>
              ) : (
                /* 단일계좌: 하나로 표시 */
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderRadius: 8, background: "#FEF3C7", border: "1.5px solid #F59E0B", marginTop: 10 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#92400E" }}>총 청구액</span>
                    <div style={{ fontSize: 10, color: "#92400E", marginTop: 2 }}>{hmAcct.bank} {hmAcct.account} {hmAcct.holder}</div>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#92400E" }}>{grandTotal.toLocaleString()}원</span>
                </div>
              )}
            </div>

            {/* 우: 메시지 & 버튼 */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 10, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>📱 발송 메시지 미리보기</div>
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 16, border: "1px solid #E8ECF0", whiteSpace: "pre-line", fontSize: 11.5, color: "#374151", lineHeight: 1.8, marginBottom: 16, maxHeight: 360, overflow: "auto" }}>{msg}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {!t.confirmed ? (
                  <button onClick={() => { confirmItem(t); setSelectedItem({ ...t, confirmed: true }); }}
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#059669", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                    ✅ 금액 확인
                  </button>
                ) : !t.sent ? (
                  <button onClick={() => { sendItem(t); setSelectedItem({ ...t, sent: true }); }}
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#3B82F6", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                    📱 문자 발송
                  </button>
                ) : (
                  <button style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#D1D5DB", color: "#fff", fontSize: 14, fontWeight: 800, fontFamily: "inherit" }}>✓ 발송 완료</button>
                )}
                <button onClick={() => navigator.clipboard?.writeText(msg)} style={{ padding: "12px 20px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📋 복사</button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ===== 목록 뷰 =====
  const typeTabCfg = { "단기": { icon: "🏠", c: "#EA580C", bg: "#FFF7ED", desc: "임대료+관리비+공과금 통합 · 월세일 기준 청구" },
    "고정관리비": { icon: "🏢", c: "#2563EB", bg: "#EFF6FF", desc: "일반임대/근생 · 고정관리비 건물" },
    "변동관리비": { icon: "📊", c: "#7C3AED", bg: "#F5F3FF", desc: "일반임대/근생 · 변동관리비 건물" } };

  return (
    <div>
      <SectionTitle sub={`${billingMonth.slice(5)}월 · ${typeTab} ${myTenants.length}건`}>{billingMode === "unified" ? "⚡ 청구 관리" : billingMode === "variable" ? "📊 청구(변동관리비)" : "⚡ 청구(단기/고정관리비)"}</SectionTitle>

      {/* 유형 탭 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {availableTypes.map(t => {
          const cfg = typeTabCfg[t];
          const active = typeTab === t;
          return (
            <button key={t} onClick={() => { setTypeTab(t); setFilterTab("전체"); setFilterBuilding("전체"); }}
              style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: active ? `2px solid ${cfg.c}` : "1.5px solid #E0E3E9",
                background: active ? cfg.bg : "#fff", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: active ? cfg.c : "#5F6577" }}>{cfg.icon} {t} <span style={{ fontSize: 16, fontWeight: 900 }}>{typeCounts[t]}</span></div>
              <div style={{ fontSize: 8, color: "#8F95A3", marginTop: 1 }}>{cfg.desc}</div>
            </button>
          );
        })}
      </div>

      {/* 단기: 청구 기간 설정 + 업로드 */}
      {(typeTab === "단기" || typeTab === "고정관리비") && (
        <>
          {/* 청구 기간 설정 (월세일 필터) */}
          {(() => {
            const hist = billingPeriod.history || [];
            const lastEnd = hist.length > 0 ? hist[hist.length - 1].endDay : 0;
            const autoStart = lastEnd > 0 ? (lastEnd % 31) + 1 : billingPeriod.startDay;
            return (
              <Card style={{ marginBottom: 8, padding: "10px 14px", border: billingPeriod.confirmed ? "2px solid #059669" : "2px solid #F59E0B", background: billingPeriod.confirmed ? "#F0FDF4" : "#FFFBEB" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: billingPeriod.confirmed ? 0 : 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>📆</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: billingPeriod.confirmed ? "#059669" : "#92400E" }}>
                        {billingPeriod.confirmed ? "청구 기간 확정" : "청구 기간 설정 (월세일 범위)"}
                      </div>
                      {billingPeriod.confirmed && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23", marginTop: 2 }}>
                          매월 {billingPeriod.startDay}일 ~ {billingPeriod.endDay}일 납부 호실
                        </div>
                      )}
                    </div>
                  </div>
                  {billingPeriod.confirmed && (
                    <button onClick={() => setBillingPeriod({ ...billingPeriod, confirmed: false })}
                      style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", fontSize: 10, fontWeight: 700, color: "#5F6577", cursor: "pointer", fontFamily: "inherit" }}>
                      변경
                    </button>
                  )}
                </div>
                {!billingPeriod.confirmed && (
                  <>
                    {hist.length > 0 && (
                      <div style={{ fontSize: 10, color: "#059669", fontWeight: 600, marginBottom: 6, padding: "4px 8px", background: "#ECFDF5", borderRadius: 6 }}>
                        이전 청구: {hist.map((h, i) => `${h.startDay}~${h.endDay}일`).join(" → ")}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                        <span style={{ fontSize: 11, color: "#5F6577", fontWeight: 600 }}>매월</span>
                        <span style={{ padding: "6px 10px", borderRadius: 6, background: "#F3F4F6", border: "1.5px solid #E0E3E9", fontSize: 13, fontWeight: 700, color: "#1A1D23", minWidth: 36, textAlign: "center" }}>
                          {autoStart}
                        </span>
                        <span style={{ fontSize: 11, color: "#5F6577", fontWeight: 600 }}>일 ~</span>
                        <input type="number" min="1" max="31" value={billingPeriod.endDay}
                          onChange={e => setBillingPeriod({ ...billingPeriod, startDay: autoStart, endDay: Math.max(1, Math.min(31, parseInt(e.target.value) || 1)) })}
                          style={{ width: 52, padding: "6px 8px", borderRadius: 6, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit", textAlign: "center", fontWeight: 700 }} />
                        <span style={{ fontSize: 11, color: "#5F6577", fontWeight: 600 }}>일</span>
                      </div>
                      <button onClick={() => {
                        const newHistory = [...hist, { startDay: autoStart, endDay: billingPeriod.endDay, confirmedAt: new Date().toISOString() }];
                        setBillingPeriod({ startDay: autoStart, endDay: billingPeriod.endDay, confirmed: true, history: newHistory });
                      }}
                        style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#059669", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        확정
                      </button>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      <div style={{ fontSize: 9, color: "#8F95A3" }}>
                        💡 {hist.length > 0 ? `이전 ${hist[hist.length-1].endDay}일까지 청구 완료 → ${autoStart}일부터 시작` : "첫 번째 청구 기간을 설정하세요"}
                      </div>
                      {hist.length > 0 && (
                        <button onClick={() => setBillingPeriod({ startDay: 1, endDay: 5, confirmed: false, history: [] })}
                          style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #E0E3E9", background: "#fff", fontSize: 9, fontWeight: 600, color: "#8F95A3", cursor: "pointer", fontFamily: "inherit" }}>
                          이력 초기화
                        </button>
                      )}
                    </div>
                  </>
                )}
              </Card>
            );
          })()}

          {/* 업로드 버튼 (기간 확정 후만 활성화) */}
          <div style={{ display: "flex", gap: 4, marginBottom: 6, opacity: billingPeriod.confirmed ? 1 : 0.4, pointerEvents: billingPeriod.confirmed ? "auto" : "none" }}>
            <button onClick={() => setShowUpload(showUpload === "elec" ? null : "elec")}
              style={{ flex: 1, padding: "5px 10px", borderRadius: 6, border: showUpload === "elec" ? "2px solid #F59E0B" : "1.5px solid #E0E3E9",
                background: showUpload === "elec" ? "#FFFBEB" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, color: "#92400E" }}>
              ⚡ 전기 엑셀 업로드
            </button>
            <button onClick={() => setShowUpload(showUpload === "gas" ? null : "gas")}
              style={{ flex: 1, padding: "5px 10px", borderRadius: 6, border: showUpload === "gas" ? "2px solid #EF4444" : "1.5px solid #E0E3E9",
                background: showUpload === "gas" ? "#FEF2F2" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, color: "#991B1B" }}>
              🔥 가스 업로드
            </button>
            <button onClick={() => {
              const gasRows = [];
              const header = ["호실고유값", "고객번호", "기간", "시작기간", "끝기간", "전월검침", "당월검침", "사용량", "금액", "", "", "금액(절사)"];
              gasRows.push(header);
              billingItems.forEach(t => {
                if (t.roomType !== "단기") return;
                const rKey = `${t.building}_${t.room}`;
                const rm = { ...(roomMasterData[rKey] || {}) };
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
                        const fmtMD = (d) => `${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
                        const fmtFull = (d) => `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
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
              style={{ flex: "0 0 15%", padding: "5px 10px", borderRadius: 6, border: "1.5px solid #6366F1",
                background: "#EEF2FF", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, color: "#4338CA" }}>
              📥 가스양식
            </button>
          </div>
        </>
      )}

      {/* 업로드 패널 */}
      {showUpload && (
        <Card style={{ marginBottom: 12, border: showUpload === "elec" ? "2px solid #F59E0B" : "2px solid #EF4444" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: showUpload === "elec" ? "#92400E" : "#991B1B" }}>
              {showUpload === "elec" ? "⚡ 전기 빌링사 엑셀 업로드" : "🔥 가스 데이터 업로드"}
            </div>
            <button onClick={() => { setShowUpload(null); setUploadResult(null); }} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✕</button>
          </div>
          <div style={{ padding: "16px", borderRadius: 10, border: "2px dashed #D1D5DB", background: "#F9FAFB", textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{showUpload === "elec" ? "📊" : "📄"}</div>
            <div style={{ fontSize: 12, color: "#5F6577", marginBottom: 8 }}>
              {showUpload === "elec" ? "한전 빌링사에서 다운받은 엑셀(.xlsx)을 업로드하세요" : "가스 양식 엑셀(.xlsx)을 업로드하세요"}
            </div>
            <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 12 }}>
              {showUpload === "elec" ? "고객번호로 자동 매칭 · 기간/검침/사용량/금액 자동입력" : "가스고객번호로 자동 매칭 · 이전 청구값 비교 확인 가능"}
            </div>
            <label style={{ display: "inline-block", padding: "10px 24px", borderRadius: 8, background: showUpload === "elec" ? "#F59E0B" : "#EF4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              📤 파일 업로드
              <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
                onChange={e => { if (e.target.files[0]) handleFileUpload(showUpload, e.target.files[0]); }} />
            </label>
          </div>
          {uploadResult && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: uploadResult.success ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${uploadResult.success ? "#BBF7D0" : "#FECACA"}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: uploadResult.success ? "#059669" : "#DC2626", marginBottom: uploadResult.details ? 10 : 0 }}>
                {uploadResult.success ? "✅ " : "❌ "}{uploadResult.msg}
              </div>
              {/* 가스 업로드 상세 매칭 결과 */}
              {uploadResult.details && uploadResult.details.length > 0 && (
                <div style={{ maxHeight: 360, overflowY: "auto", marginTop: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E8ECF0" }}>
                        <th style={{ padding: "6px 4px", textAlign: "left", fontWeight: 700, color: "#5F6577" }}>건물/호실</th>
                        <th style={{ padding: "6px 4px", textAlign: "left", fontWeight: 700, color: "#5F6577" }}>고객번호</th>
                        <th style={{ padding: "6px 4px", textAlign: "right", fontWeight: 700, color: "#8B5CF6" }}>이전 기간</th>
                        <th style={{ padding: "6px 4px", textAlign: "center", fontWeight: 700, color: "#8B5CF6" }}>이전 당월</th>
                        <th style={{ padding: "6px 4px", textAlign: "center", fontWeight: 700, color: "#5F6577" }}>→</th>
                        <th style={{ padding: "6px 4px", textAlign: "center", fontWeight: 700, color: "#059669" }}>이번 전월</th>
                        <th style={{ padding: "6px 4px", textAlign: "right", fontWeight: 700, color: "#059669" }}>이번 기간</th>
                        <th style={{ padding: "6px 4px", textAlign: "right", fontWeight: 700, color: "#059669" }}>당월</th>
                        <th style={{ padding: "6px 4px", textAlign: "right", fontWeight: 700, color: "#059669" }}>사용량</th>
                        <th style={{ padding: "6px 4px", textAlign: "right", fontWeight: 700, color: "#059669" }}>금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.details.map((d, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #F0F2F5", background: !d.matched ? "#FEF2F2" : d.chainMatch ? "#fff" : (d.lastCur > 0 ? "#FFFBEB" : "#fff") }}>
                          <td style={{ padding: "5px 4px", fontWeight: 700 }}>{d.matched ? `${d.building} ${d.room}` : d.code}</td>
                          <td style={{ padding: "5px 4px", color: "#5F6577", fontSize: 9 }}>{d.custNo || "-"}</td>
                          {d.matched ? (<>
                            <td style={{ padding: "5px 4px", textAlign: "right", color: "#8B5CF6", fontSize: 9 }}>{d.lastPeriod}</td>
                            <td style={{ padding: "5px 4px", textAlign: "center", color: "#8B5CF6", fontWeight: 700 }}>{d.lastCur || "-"}</td>
                            <td style={{ padding: "5px 4px", textAlign: "center", fontSize: 12 }}>
                              {d.chainMatch ? <span style={{ color: "#059669" }}>→</span>
                                : d.lastCur > 0 ? <span style={{ color: "#F59E0B" }}>⚠</span>
                                : <span style={{ color: "#D1D5DB" }}>→</span>}
                            </td>
                            <td style={{ padding: "5px 4px", textAlign: "center", fontWeight: 700, color: d.chainMatch ? "#059669" : d.lastCur > 0 && d.prev !== d.lastCur ? "#DC2626" : "#059669" }}>{d.prev}</td>
                            <td style={{ padding: "5px 4px", textAlign: "right", color: "#059669", fontSize: 9 }}>{d.period}</td>
                            <td style={{ padding: "5px 4px", textAlign: "right", color: "#059669", fontWeight: 600 }}>{d.cur}</td>
                            <td style={{ padding: "5px 4px", textAlign: "right", color: "#059669" }}>{d.usage}</td>
                            <td style={{ padding: "5px 4px", textAlign: "right", color: "#1A1D23", fontWeight: 700 }}>{fmt(d.amount)}</td>
                          </>) : (
                            <td colSpan={8} style={{ padding: "5px 4px", color: "#DC2626", fontSize: 9 }}>미매칭 — 호실정보에 가스고객번호를 등록하세요</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 10, color: "#8F95A3", lineHeight: 1.6 }}>
            {showUpload === "elec" ? (
              <>💡 매칭 방식: 엑셀의 고객번호 → billingConfig의 전기고객번호로 자동 매칭<br/>
              미매칭 호실은 적색 표시 → 수기 입력 가능</>
            ) : (
              <>💡 매칭 방식: 가스고객번호(호실정보) → 엑셀 고객번호 자동 매칭<br/>
              이전 청구값과 이번 청구값을 비교하여 연속성 확인 가능<br/>
              미매칭 시 호실정보에서 가스고객번호를 먼저 등록하세요</>
            )}
          </div>
        </Card>
      )}

      {/* 유형별 안내 */}
      <div style={{ padding: "4px 10px", borderRadius: 6, background: typeTabCfg[typeTab].bg, border: `1px solid ${typeTabCfg[typeTab].c}30`, marginBottom: 8, fontSize: 10, color: typeTabCfg[typeTab].c }}>
        {typeTab === "단기" && <>💡 임대료+관리비+공과금 통합청구 · 월세일 기준 청구 · <strong style={{ color: "#DC2626" }}>적색=미매칭</strong></>}
        {typeTab === "고정관리비" && <>💡 일반임대/근생 · 고정관리비 건물 · 임대료+고정관리비 청구 · 담당자 확인 후 발송</>}
        {typeTab === "변동관리비" && <>💡 일반임대/근생 · 변동관리비 건물 · 공과금 기반 변동 청구 · 검침 후 발송</>}
      </div>

      {/* Status cards */}
      {typeTab === "단기" ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)", gap: 4, marginBottom: 8 }}>
          {[
            { label: "자동매칭", sub: "업로드완료", count: autoCount, color: "#059669", bg: "#ECFDF5", tab: "자동매칭" },
            { label: "수동매칭", sub: "수기입력", count: manualCount, color: "#2563EB", bg: "#EFF6FF", tab: "수동매칭" },
            { label: "미매칭", sub: "데이터없음", count: unmatchedCount, color: "#DC2626", bg: "#FEF2F2", tab: "미매칭" },
            { label: "확인완료", sub: "발송대기", count: confirmedCount, color: "#059669", bg: "#ECFDF5", tab: "확인완료" },
            { label: "발송완료", sub: "이번달", count: sentCount, color: "#3B82F6", bg: "#EFF6FF", tab: "발송완료" },
            { label: "전체", sub: "단기", count: billingItems.length, color: "#5F6577", bg: "#F8FAFC", tab: "전체" },
          ].map((s, i) => (
            <Card key={i} onClick={() => setFilterTab(s.tab)} style={{ cursor: "pointer", padding: "6px 8px", background: filterTab === s.tab ? s.bg : "#fff", border: filterTab === s.tab ? `2px solid ${s.color}` : "1px solid #E8ECF0" }}>
              <div style={{ fontSize: 8, color: "#8F95A3", fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.count}</div>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 4, marginBottom: 8 }}>
          {[
            { label: "확인완료", count: confirmedCount, color: "#059669", bg: "#ECFDF5", tab: "확인완료" },
            { label: "발송완료", count: sentCount, color: "#3B82F6", bg: "#EFF6FF", tab: "발송완료" },
            { label: "전체", count: billingItems.length, color: "#5F6577", bg: "#F8FAFC", tab: "전체" },
          ].map((s, i) => (
            <Card key={i} onClick={() => setFilterTab(s.tab)} style={{ cursor: "pointer", padding: "6px 8px", background: filterTab === s.tab ? s.bg : "#fff", border: filterTab === s.tab ? `2px solid ${s.color}` : "1px solid #E8ECF0" }}>
              <div style={{ fontSize: 8, color: "#8F95A3", fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.count}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 4, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
        <select value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
          {buildingNames.map(b => <option key={b}>{b}</option>)}
        </select>
        {/* 담당자 선택 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600 }}>담당:</span>
          <select
            value={filterBuilding !== "전체" ? getBillingAssignee(filterBuilding) : ""}
            onChange={e => {
              if (filterBuilding !== "전체") {
                setBillingAssignees(prev => ({ ...prev, [filterBuilding]: e.target.value }));
              }
            }}
            disabled={filterBuilding === "전체"}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 11, fontWeight: 600, fontFamily: "inherit", background: filterBuilding === "전체" ? "#F3F4F6" : "#fff" }}>
            {filterBuilding === "전체"
              ? <option>건물 선택 후 지정</option>
              : internalStaff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
            }
          </select>
        </div>
        {(() => {
          const matchedUnsent = billingItems.filter(i => (i.matchStatus === "auto" || i.matchStatus === "manual") && !i.sent);
          const cnt = matchedUnsent.length;
          return (
            <button onClick={() => {
              if (cnt === 0) return;
              if (!window.confirm(`매칭된 ${cnt}건을 확인+발송 처리합니다.`)) return;
              matchedUnsent.forEach(i => {
                if (!i.confirmed) confirmItem(i);
                sendItem({ ...i, confirmed: true });
              });
            }}
              style={{ marginLeft: "auto", padding: "7px 16px", borderRadius: 8, border: "none",
                background: cnt > 0 ? "#059669" : "#D1D5DB", color: "#fff", fontSize: 11, fontWeight: 700,
                cursor: cnt > 0 ? "pointer" : "default", fontFamily: "inherit", opacity: cnt > 0 ? 1 : 0.6 }}>
              📱 매칭 일괄발송 ({cnt}건)
            </button>
          );
        })()}
      </div>

      {/* 청구 리스트 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "#B0B5C1", fontSize: 13 }}>해당 조건 없음</div>}
        {filtered.map((r, i) => {
          const noData = r.noElec || r.noGas;
          const urgent = r.roomType === "단기" && !r.sent && r.daysUntilDue >= 0 && r.daysUntilDue <= 7;
          const ev = editValues[r.key] || {};
          const elecVal = ev.elec ?? r.elec;
          const gasVal = ev.gas ?? r.gas;
          const waterVal = ev.water ?? r.water;
          const cableVal = ev.cable ?? r.cable;
          const inpStyle = { padding: "7px 10px", borderRadius: 6, border: "1.5px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", textAlign: "right", fontWeight: 700, background: "#FAFBFC", outline: "none" };
          const lblStyle = { fontSize: 11, color: "#6B7280", fontWeight: 700, whiteSpace: "nowrap" };
          return (
            <div key={i}
              style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                background: urgent ? "#FEF2F2" : noData ? "#FEF2F2" : r.confirmed ? "#F0FDF4" : "#fff",
                border: `1.5px solid ${urgent ? "#FECACA" : noData ? "#FECACA" : r.confirmed ? "#BBF7D0" : "#E8ECF0"}` }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>
              {/* 1줄: 건물/호실/이름/월세일/D-day/상태 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}
                onClick={() => setSelectedItem(r)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#1A1D23", whiteSpace: "nowrap" }}>{r.building}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", whiteSpace: "nowrap" }}>{r.room}호</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#5F6577", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#92400E", padding: "2px 6px", borderRadius: 4, background: "#FFFBEB", whiteSpace: "nowrap" }}>
                    {r.dueDay}일
                  </span>
                  {r.daysUntilDue >= 0 ? (
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 5, whiteSpace: "nowrap",
                      background: r.daysUntilDue <= 3 ? "#DC2626" : r.daysUntilDue <= 7 ? "#F59E0B" : "#E5E7EB",
                      color: r.daysUntilDue <= 7 ? "#fff" : "#5F6577"
                    }}>D-{r.daysUntilDue}</span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "#F3F4F6", color: "#8F95A3", whiteSpace: "nowrap" }}>
                      D+{Math.abs(r.daysUntilDue)}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 5, whiteSpace: "nowrap",
                    background: r.confirmed ? "#ECFDF5" : r.matchStatus === "none" ? "#FEF2F2" : r.matchStatus === "manual" ? "#EFF6FF" : "#ECFDF5",
                    color: r.confirmed ? "#059669" : r.matchStatus === "none" ? "#DC2626" : r.matchStatus === "manual" ? "#2563EB" : "#059669",
                  }}>{r.confirmed ? "확인완료" : r.matchStatus === "none" ? "미매칭" : r.matchStatus === "manual" ? "수동매칭" : "자동매칭"}</span>
                  <div style={{ display: "flex", gap: 3 }} onClick={e => e.stopPropagation()}>
                    {!r.confirmed ? (
                      <button onClick={() => confirmItem(r)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #BBF7D0", background: "#ECFDF5", color: "#059669", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>✅확인</button>
                    ) : !r.sent ? (
                      <button onClick={() => sendItem(r)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>📱발송</button>
                    ) : null}
                  </div>
                </div>
              </div>
              {/* 2줄: 전기/가스 검침 인라인 수정 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
                {r.roomType === "단기" && <>
                  {/* 전기 행 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: r.noElec && !elecVal ? "8px 12px" : "4px 8px", background: r.noElec && !elecVal ? "#FEF2F2" : "#FFFBEB", borderRadius: 8, border: r.noElec && !elecVal ? "2.5px solid #EF4444" : `1px solid #FDE68A`, position: "relative" }}>
                    {r.noElec && !elecVal && <div style={{ position: "absolute", top: -1, right: 8, background: "#DC2626", color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 8px", borderRadius: "0 0 6px 6px", letterSpacing: "0.5px" }}>미매칭</div>}
                    <span style={{ fontSize: 13, fontWeight: 800, color: r.noElec && !elecVal ? "#DC2626" : "#D97706", whiteSpace: "nowrap", minWidth: 44 }}>⚡전기</span>
                    {r.noElec && !r.carryOverElec && !elecVal ? (
                      <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 800, background: "#fff", padding: "3px 10px", borderRadius: 6, border: "1.5px solid #FECACA" }}>데이터 없음 — 이번 청구 제외, 다음달 이어청구</span>
                    ) : null}
                    <span style={lblStyle}>기간</span>
                    <input type="text" value={((ev.es ?? r.elecStart) || "").replace(/^\d{4}\//, "")} onChange={e => setEditValues(prev => ({ ...prev, [r.key]: { ...prev[r.key], es: e.target.value } }))}
                      style={{ ...inpStyle, width: 66, textAlign: "center" }} placeholder="M/D" />
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#9CA3AF" }}>~</span>
                    <input type="text" value={((ev.ee ?? r.elecEnd) || "").replace(/^\d{4}\//, "")} onChange={e => setEditValues(prev => ({ ...prev, [r.key]: { ...prev[r.key], ee: e.target.value } }))}
                      style={{ ...inpStyle, width: 66, textAlign: "center" }} placeholder="M/D" />
                    <div style={{ width: 1, height: 20, background: "#E5E7EB", margin: "0 2px" }} />
                    <span style={lblStyle}>검침</span>
                    <input type="number" value={ev.ep ?? r.elecPrev} onChange={e => setEditValues(prev => ({ ...prev, [r.key]: { ...prev[r.key], ep: parseInt(e.target.value) || 0 } }))}
                      style={{ ...inpStyle, width: 80 }} placeholder="시작" />
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#9CA3AF" }}>-</span>
                    <input type="number" value={ev.ec ?? r.elecCur} onChange={e => setEditValues(prev => ({ ...prev, [r.key]: { ...prev[r.key], ec: parseInt(e.target.value) || 0 } }))}
                      style={{ ...inpStyle, width: 80 }} placeholder="끝" />
                    <div style={{ width: 1, height: 20, background: "#E5E7EB", margin: "0 2px" }} />
                    <span style={lblStyle}>사용</span>
                    <input type="number" value={ev.eu ?? r.elecUsage} onChange={e => setEditValues(prev => ({ ...prev, [r.key]: { ...prev[r.key], eu: parseInt(e.target.value) || 0 } }))}
                      style={{ ...inpStyle, width: 66 }} />
                    <span style={lblStyle}>금액</span>
                    <input type="text" value={elecVal ? fmt(elecVal) : ""} onChange={e => setEditValues(prev => ({ ...prev, [r.key]: { ...prev[r.key], elec: parseInt(e.target.value.replace(/,/g, "")) || 0 } }))}
                      style={{ ...inpStyle, width: 96, background: elecVal ? "#FFF7ED" : "#FEF2F2", borderColor: elecVal ? "#FDBA74" : "#FECACA", fontWeight: 800 }} placeholder="0" />
                  </div>
                  {/* 가스 행 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: r.noGas && !gasVal ? "8px 12px" : "4px 8px", background: r.noGas && !gasVal ? "#FEF2F2" : "#FFF1F2", borderRadius: 8, border: r.noGas && !gasVal ? "2.5px solid #EF4444" : `1px solid #FECDD3`, position: "relative" }}>
                    {r.noGas && !gasVal && <div style={{ position: "absolute", top: -1, right: 8, background: "#DC2626", color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 8px", borderRadius: "0 0 6px 6px", letterSpacing: "0.5px" }}>미매칭</div>}
                    <span style={{ fontSize: 13, fontWeight: 800, color: r.noGas && !gasVal ? "#DC2626" : "#DC2626", whiteSpace: "nowrap", minWidth: 44 }}>🔥가스</span>
                    {r.noGas && !r.carryOverGas && !gasVal ? (
                      <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 800, background: "#fff", padding: "3px 10px", borderRadius: 6, border: "1.5px solid #FECACA" }}>데이터 없음 — 이번 청구 제외, 다음달 이어청구</span>
                    ) : null}
                    <span style={lblStyle}>기간</span>
                    {(() => {
                      const gp = ev.gp ?? r.gasPeriod ?? "";
                      const parts = gp.split("~");
                      const gs = (parts[0] || "").trim().replace(/\./g, "/").replace(/^\d{4}\//, "");
                      const ge = (parts[1] || "").trim().replace(/\./g, "/").replace(/^\d{4}\//, "");
                      return <>
                        <input type="text" value={gs} onChange={e => {
                          const newGp = `${e.target.value.replace(/\//g, ".")}~${ge.replace(/\//g, ".")}`;
                          setEditValues(prev => ({ ...prev, [r.key]: { ...prev[r.key], gp: newGp } }));
                        }} style={{ ...inpStyle, width: 66, textAlign: "center" }} placeholder="M/D" />
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#9CA3AF" }}>~</span>
                        <input type="text" value={ge} onChange={e => {
                          const newGp = `${gs.replace(/\//g, ".")}~${e.target.value.replace(/\//g, ".")}`;
                          setEditValues(prev => ({ ...prev, [r.key]: { ...prev[r.key], gp: newGp } }));
                        }} style={{ ...inpStyle, width: 66, textAlign: "center" }} placeholder="M/D" />
                      </>;
                    })()}
                    <div style={{ width: 1, height: 20, background: "#E5E7EB", margin: "0 2px" }} />
                    <span style={lblStyle}>검침</span>
                    <input type="number" value={ev.gpr ?? r.gasPrev} onChange={e => setEditValues(prev => ({ ...prev, [r.key]: { ...prev[r.key], gpr: parseInt(e.target.value) || 0 } }))}
                      style={{ ...inpStyle, width: 80 }} placeholder="시작" />
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#9CA3AF" }}>-</span>
                    <input type="number" value={ev.gcr ?? r.gasCur} onChange={e => setEditValues(prev => ({ ...prev, [r.key]: { ...prev[r.key], gcr: parseInt(e.target.value) || 0 } }))}
                      style={{ ...inpStyle, width: 80 }} placeholder="끝" />
                    <div style={{ width: 1, height: 20, background: "#E5E7EB", margin: "0 2px" }} />
                    <span style={lblStyle}>사용</span>
                    <input type="number" value={ev.gu ?? r.gasUsage} onChange={e => setEditValues(prev => ({ ...prev, [r.key]: { ...prev[r.key], gu: parseInt(e.target.value) || 0 } }))}
                      style={{ ...inpStyle, width: 66 }} />
                    <span style={lblStyle}>금액</span>
                    <input type="text" value={gasVal ? fmt(gasVal) : ""} onChange={e => setEditValues(prev => ({ ...prev, [r.key]: { ...prev[r.key], gas: parseInt(e.target.value.replace(/,/g, "")) || 0 } }))}
                      style={{ ...inpStyle, width: 96, background: gasVal ? "#FFF1F2" : "#FEF2F2", borderColor: gasVal ? "#FDA4AF" : "#FECACA", fontWeight: 800 }} placeholder="0" />
                  </div>
                </>}
                {/* 합계 */}
                <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: "#1A1D23", whiteSpace: "nowrap" }}>
                  {fmt((ev.rent ?? r.rent) + (ev.mgmt ?? r.mgmt) + (r.roomType === "단기" ? elecVal + gasVal + (ev.water ?? r.water) + (ev.cable ?? r.cable) : 0))}원
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 4, fontSize: 9, color: "#B0B5C1", textAlign: "center" }}>
        ※ {typeTab === "단기" ? "임대료+관리비+공과금 통합 · 전기=엑셀 · 가스=파일 · 수도/인터넷=고정 · 월세일 기준 청구" : typeTab === "고정관리비" ? "고정관리비 건물 · 임대료+고정관리비 · 담당자 확인 후 발송" : "변동관리비 건물 · 공과금 기반 변동 청구 · 검침 후 발송"}
      </div>
    </div>
  );
};
