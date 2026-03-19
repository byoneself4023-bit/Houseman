import React, { useState, useMemo } from 'react';
import { settlementMaster, buildingAccountMap, getSettlementPeriod, calcFee, calcProRata, calcVat } from '../data';
import { useIsMobile, fmt } from '../utils';
import { Card, SectionTitle } from '../components';
import { SettlementPrintView } from '../components/SettlementPrintView';

class SettlementErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("SettlementPage error:", error, info?.componentStack); }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#DC2626", marginBottom: 12 }}>건물주 정산 로딩 오류</div>
        <div style={{ fontSize: 12, color: "#5F6577", marginBottom: 16, whiteSpace: "pre-wrap" }}>{String(this.state.error)}{this.state.error?.stack ? "\n\n" + this.state.error.stack : ""}</div>
        <button onClick={() => this.setState({ hasError: false, error: null })} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontWeight: 700, cursor: "pointer" }}>다시 시도</button>
      </div>;
    }
    return this.props.children;
  }
}

export const SettlementPage = (props) => (
  <SettlementErrorBoundary><SettlementPageInner {...props} /></SettlementErrorBoundary>
);

const TYPE_LABELS = {
  "A": "단기(%)",
  "B": "1시트",
  "C": "건물주계좌",
  "S": "월급형",
  "F": "월정액",
  "D": "관리비수금",
  "X": "기타",
};

const SettlementPageInner = ({ myBuildings = [], activeTenants = [], transactions = [], settlementExpenses = [], setSettlementExpenses, buildingData = {}, pastTenantsData = {}, addCashbookEntry, roomBalances = {}, billingHistory = [] }) => {
  const isMobile = useIsMobile();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedBuilding, setSelectedBuilding] = useState("전체");
  const [detailBuilding, setDetailBuilding] = useState(null);
  const [printMode, setPrintMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formBuilding, setFormBuilding] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [y, m] = selectedMonth.split("-").map(Number);
  const changeMonth = (delta) => {
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const monthLabel = `${y}년 ${m}월`;

  // 건물 리스트: activeTenants + settlementMaster에 등록된 건물 합산
  const buildingList = useMemo(() => {
    const fromTenants = new Set(activeTenants.map(t => t.building));
    const fromMaster = new Set(Object.keys(settlementMaster));
    const all = [...new Set([...fromTenants, ...fromMaster])];
    if (myBuildings.length > 0) return all.filter(n => myBuildings.includes(n));
    return all.sort((a, b) => {
      const ta = settlementMaster[a]?.type || "Z";
      const tb = settlementMaster[b]?.type || "Z";
      return ta.localeCompare(tb) || a.localeCompare(b);
    });
  }, [activeTenants, myBuildings]);

  const displayBuildings = selectedBuilding === "전체" ? buildingList : [selectedBuilding];

  // 건물별 정산 계산
  const buildingSettlements = useMemo(() => {
    return displayBuildings.map(bName => {
      const masterCfg = settlementMaster[bName] || {};
      const cfg = { type: "A", feeType: "pct", feeRate: 0, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: false, address: "", notes: "", ...masterCfg };
      const period = getSettlementPeriod(bName, y, m);
      const bTenants = activeTenants.filter(t => t.building === bName);
      const acctInfo = buildingAccountMap[bName] || {};
      const totalDays = new Date(y, m, 0).getDate();

      // 입주자 (해당월 신규)
      const moveInTenants = bTenants.filter(t => t.moveIn && t.moveIn.startsWith(selectedMonth));
      const moveInCount = moveInTenants.length;

      // 퇴실자 (pastTenantsData에서 — 필드: moveOut)
      const moveOutTenants = [];
      try {
        Object.entries(pastTenantsData || {}).forEach(([key, records]) => {
          if (!key.startsWith(bName + "_")) return;
          if (!Array.isArray(records)) return;
          records.forEach(rec => {
            const moDate = rec?.moveOut || rec?.moveOutDate;
            if (rec && moDate && moDate.startsWith(selectedMonth)) {
              const room = key.split("_").slice(1).join("_"); // "301_2" → "301_2" or "405" → "405"
              moveOutTenants.push({ ...rec, room: room.replace(/_\d+$/, ""), building: bName, moveOutDate: moDate });
            }
          });
        });
      } catch(e) { console.warn("pastTenantsData 파싱 오류:", e); }

      // 1. 호실별 월세 정산
      // 퇴실된 호실 목록
      const movedOutRooms = new Set(moveOutTenants.map(mt => mt.room));
      // 이번달 입주한 호실 목록
      const movedInRooms = new Set(moveInTenants.map(t => t.room));
      const roomSettlements = bTenants
        .filter(t => {
          // 퇴실됐고 아직 새 입주 안 된 호실은 메인에서 제외 (퇴실 섹션에서 처리)
          if (movedOutRooms.has(t.room) && !movedInRooms.has(t.room)) return false;
          return true;
        })
        .map(t => {
        const fee = calcFee(t.rent, bName);
        const settlementAmt = t.rent - fee;
        const mgmtSettlement = cfg.includeMgmt ? (t.mgmt || 0) : 0;
        // 이번달 신규 입주면 상태 표시
        const isNewMoveIn = movedInRooms.has(t.room);
        return {
          room: t.room, name: t.name, moveIn: t.moveIn, expiry: t.expiry,
          deposit: t.deposit || 0, rent: t.rent || 0, mgmt: t.mgmt || 0,
          rentDay: parseInt(t.due?.split("/")[1]) || 0,
          fee, settlementAmt, mgmtSettlement,
          status: isNewMoveIn ? "신규입주" : "입주",
          delinquent: 0,
        };
      });

      const totalRent = roomSettlements.reduce((s, r) => s + r.rent, 0);
      const totalFee = roomSettlements.reduce((s, r) => s + r.fee, 0);
      const totalRentSettlement = roomSettlements.reduce((s, r) => s + r.settlementAmt, 0);
      const totalMgmtSettlement = roomSettlements.reduce((s, r) => s + r.mgmtSettlement, 0);

      // 2. 입주 정산 (입주 일할 + 예치금)
      const settleDayNum = cfg.settlementDay === "말일" ? totalDays : (cfg.settlementDay || 15);
      const moveInSettlements = moveInTenants.map(t => {
        const moveInDay = parseInt(t.moveIn?.split("-")[2]) || 1;
        // 입주일~말일까지, 시작일 포함, 해당 월 실제 일수 기준
        const moveInUsedDays = totalDays - moveInDay + 1;
        const rentProRata = Math.round((t.rent || 0) * moveInUsedDays / totalDays);
        const mgmtProRata = Math.round((t.mgmt || 0) * moveInUsedDays / totalDays);
        return {
          room: t.room, name: t.name, moveIn: t.moveIn,
          deposit: t.deposit || 0, rent: t.rent || 0, mgmt: t.mgmt || 0,
          moveInDay, moveInUsedDays, rentProRata, mgmtProRata,
          settlementAmt: rentProRata + mgmtProRata,
          brokerageFee: t.brokerageFee || 0,
        };
      });
      const totalBrokerage = moveInSettlements.reduce((s, r) => s + (r.brokerageFee || 0), 0);
      const totalMoveInSettlement = moveInSettlements.reduce((s, r) => s + r.settlementAmt, 0);

      // 3. 퇴실 정산 (일할 + 청소비 + 검침 + 위약금 + 훼손 + 예치금반환)
      const moveOutSettlements = moveOutTenants.map(mt => {
        const moveOutDay = parseInt(mt.moveOutDate?.split("-")[2]) || 1;
        const rent = mt.rent || 0;
        const mgmt = mt.mgmt || 0;
        // 기간정산: 월세일~퇴실일, 시작일 포함
        const rentDay = parseInt(mt.rentDay || mt.due?.split("/")[1]) || parseInt(mt.moveIn?.split("-")[2]) || 1;
        const settlementDay = cfg.settlementDay === "말일" ? totalDays : (cfg.settlementDay || 15);
        // 사용일수: 월세일부터 퇴실일까지 (시작일 포함) — 항상 재계산
        // 1달 = 해당 월의 실제 일수 (28/29/30/31)
        const monthDays = totalDays; // 해당 월 실제 일수
        const usedDays = moveOutDay >= rentDay ? moveOutDay - rentDay + 1 : monthDays - rentDay + moveOutDay + 1;
        // 이미 건물주에게 줬는지: 월세일 < 정산일 → 줬음(환수), 월세일 >= 정산일 → 안줬음(지급)
        const alreadyPaid = rentDay < settlementDay;
        const proRataDays = alreadyPaid ? (monthDays - usedDays) : usedDays;
        const rentProRata = Math.round(rent * proRataDays / monthDays);
        const mgmtProRata = Math.round(mgmt * proRataDays / monthDays);
        const fee = calcFee(Math.round(rent * usedDays / 30), bName);

        // 퇴실 공제 항목
        const cleanFee = mt.cleanFee || 0;
        const elecReading = mt.elecReading || 0;
        const gasReading = mt.gasReading || 0;
        const waterReading = mt.waterReading || 0;
        const damageFee = mt.damageFee || 0;
        const penalty7 = mt.penalty7 || 0;

        // 예치금 반환
        const depositReturn = mt.depositReturn || mt.deposit || 0;
        const totalDeductItems = cleanFee + elecReading + gasReading + waterReading + damageFee + penalty7;
        const finalRefund = mt.finalRefund != null ? mt.finalRefund : (depositReturn - totalDeductItems);

        // 정산서 반영: 환수(-)  또는 지급(+)
        const settlementAmt = alreadyPaid ? -(rentProRata + mgmtProRata) : (rentProRata + mgmtProRata);

        return {
          room: mt.room, name: mt.name, moveOutDate: mt.moveOutDate,
          moveIn: mt.moveIn, expiry: mt.expiry,
          reason: mt.reason || "",
          rent, mgmt, usedDays, totalDays, monthDays, alreadyPaid, proRataDays,
          rentProRata, mgmtProRata, fee, settlementAmt,
          cleanFee, elecReading, gasReading, waterReading,
          damageFee, damageDesc: mt.damageDesc || "",
          penalty7, penaltyReason: mt.penaltyReason || "",
          depositReturn, totalDeductItems, finalRefund,
          brokerageFee: mt.brokerageFee || 0,
          rentDay,
        };
      });
      const totalMoveOutRent = moveOutSettlements.reduce((s, r) => s + r.settlementAmt, 0);
      const totalPenalty = moveOutSettlements.reduce((s, r) => s + r.penalty7, 0);
      const totalDepositReturn = moveOutSettlements.reduce((s, r) => s + r.depositReturn, 0);
      const totalMoveOutBrokerage = moveOutSettlements.reduce((s, r) => s + (r.brokerageFee || 0), 0);

      // 4. 공제내역
      const deductions = settlementExpenses.filter(e => e.building === bName && e.month === selectedMonth);
      const totalDeduction = deductions.reduce((s, e) => s + e.amount, 0);

      // 합산 중개수수료 (입주 + 퇴실시 기록된)
      const allBrokerage = totalBrokerage + totalMoveOutBrokerage;

      // 5. 최종 정산금 계산 (유형별)
      let subtotal, finalAmount;
      if (cfg.feeType === "salary") {
        // 월급형: 관리수수료 + 부가항목 + 지출
        const subItemsTotal = (cfg.subItems || []).reduce((s, si) => s + si.amount, 0);
        subtotal = (cfg.feeAmount || 0) + subItemsTotal + totalDeduction;
        const vatInfo = cfg.vat ? { supply: Math.round(subtotal / 1.1), tax: subtotal - Math.round(subtotal / 1.1), total: subtotal } : { supply: subtotal, tax: 0, total: subtotal };
        finalAmount = cfg.vat ? (cfg.feeAmount || 0) + subItemsTotal + totalDeduction : subtotal;
        // 부가세는 수수료+부가항목에만 적용 (지출은 별도)
        const vatBase = (cfg.feeAmount || 0) + subItemsTotal;
        const vatCalc = cfg.vat ? { supply: Math.round(vatBase / 1.1), tax: vatBase - Math.round(vatBase / 1.1), total: vatBase } : { supply: vatBase, tax: 0, total: vatBase };

        return {
          building: bName, cfg, period, acctInfo,
          tenantCount: bTenants.length, vacantCount: 0, moveInCount, moveOutCount: moveOutTenants.length,
          roomSettlements, totalRent, totalFee, totalRentSettlement, totalMgmtSettlement,
          moveInSettlements, totalBrokerage: allBrokerage,
          moveOutSettlements, totalMoveOutRent: 0, totalPenalty: 0, totalDepositReturn: 0,
          deductions, totalDeduction,
          vatInfo: vatCalc,
          finalAmount: vatBase + totalDeduction,
        };
      } else if (cfg.feeType === "collection") {
        // 관리비수금형: 수금 - 비용 = 건물주에게
        const collected = bTenants.length * (cfg.mgmtFeePerUnit || 0);
        const costsTotal = (cfg.costItems || []).reduce((s, ci) => s + ci.amount, 0);
        subtotal = collected - costsTotal - totalDeduction;
        return {
          building: bName, cfg, period, acctInfo,
          tenantCount: bTenants.length, vacantCount: 0, moveInCount, moveOutCount: moveOutTenants.length,
          roomSettlements, totalRent, totalFee: 0, totalRentSettlement: collected, totalMgmtSettlement: 0,
          moveInSettlements, totalBrokerage: 0,
          moveOutSettlements, totalMoveOutRent: 0, totalPenalty: 0, totalDepositReturn: 0,
          deductions, totalDeduction,
          vatInfo: { supply: subtotal, tax: 0, total: subtotal },
          finalAmount: subtotal,
        };
      } else {
        // 퍼센트형 (기본)
        // 정산금 = 월세정산 + 관리비정산 + 퇴실일할 + 위약금 - 중개수수료 - 예치금반환 - 공제
        subtotal = totalRentSettlement + totalMgmtSettlement + totalMoveOutRent + totalPenalty
          - allBrokerage - totalDepositReturn - totalDeduction;
        const vatInfo = calcVat(subtotal, bName);
        finalAmount = cfg.vat ? vatInfo.total : subtotal;

        return {
          building: bName, cfg, period, acctInfo,
          tenantCount: bTenants.length, vacantCount: 0, moveInCount, moveOutCount: moveOutTenants.length,
          roomSettlements, totalRent, totalFee, totalRentSettlement, totalMgmtSettlement,
          moveInSettlements, totalBrokerage: allBrokerage,
          moveOutSettlements, totalMoveOutRent, totalPenalty, totalDepositReturn,
          deductions, totalDeduction,
          vatInfo, finalAmount,
        };
      }
    });
  }, [displayBuildings, activeTenants, settlementExpenses, selectedMonth, pastTenantsData]);

  const totalSummary = useMemo(() => buildingSettlements.reduce((acc, b) => ({
    rent: acc.rent + b.totalRentSettlement,
    deduction: acc.deduction + b.totalDeduction,
    final: acc.final + b.finalAmount,
  }), { rent: 0, deduction: 0, final: 0 }), [buildingSettlements]);

  const handleAddExpense = () => {
    if (!formBuilding || !formDesc.trim() || !formAmount) return;
    setSettlementExpenses(prev => [...prev, {
      id: Date.now(), month: selectedMonth, building: formBuilding,
      room: formRoom, category: "deduction", desc: formDesc.trim(),
      amount: Number(formAmount), date: formDate,
    }]);
    setFormDesc(""); setFormAmount(""); setFormRoom("");
  };

  // ===== 공휴일 & 영업일 계산 (hooks는 early return 전에 위치해야 함) =====
  const koreanHolidays = useMemo(() => {
    const fixed = [
      `${y}-01-01`, `${y}-03-01`, `${y}-05-05`, `${y}-06-06`,
      `${y}-08-15`, `${y}-10-03`, `${y}-10-09`, `${y}-12-25`,
    ];
    const lunar = {
      2025: [`2025-01-28`, `2025-01-29`, `2025-01-30`, `2025-05-05`, `2025-09-06`, `2025-09-07`, `2025-09-08`],
      2026: [`2026-02-16`, `2026-02-17`, `2026-02-18`, `2026-05-24`, `2026-09-24`, `2026-09-25`, `2026-09-26`],
      2027: [`2027-02-05`, `2027-02-06`, `2027-02-07`, `2027-05-13`, `2027-10-14`, `2027-10-15`, `2027-10-16`],
    };
    return new Set([...fixed, ...(lunar[y] || [])]);
  }, [y]);

  const isBusinessDay = (date) => {
    const dow = date.getDay();
    if (dow === 0 || dow === 6) return false;
    const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return !koreanHolidays.has(ds);
  };

  const getNextBusinessDay = (date) => {
    const d = new Date(date);
    while (!isBusinessDay(d)) { d.setDate(d.getDate() + 1); }
    return d;
  };

  const resolveSettlementDay = (dayVal, year, month) => {
    const lastDay = new Date(year, month, 0).getDate();
    const day = dayVal === "말일" ? lastDay : Math.min(Number(dayVal) || lastDay, lastDay);
    const base = new Date(year, month - 1, day);
    return getNextBusinessDay(base);
  };

  const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

  const timelineItems = useMemo(() => {
    const items = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    buildingSettlements.forEach(bs => {
      const bsCfg = bs.cfg;
      const savedDates = buildingData[bs.building]?.settlementDates;
      let dates;
      if (savedDates && savedDates.length > 0) {
        dates = savedDates;
      } else if (bsCfg.frequency === "twice" && bsCfg.dates) {
        dates = bsCfg.dates.map(d => String(d));
      } else {
        dates = [String(bsCfg.settlementDay || "말일")];
      }

      dates.forEach((dayVal, idx) => {
        const resolved = resolveSettlementDay(dayVal, y, m);
        const originalDay = dayVal === "말일" ? new Date(y, m, 0).getDate() : Number(dayVal);
        const wasAdjusted = resolved.getDate() !== originalDay || resolved.getMonth() + 1 !== m;
        const diffMs = resolved.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        items.push({
          building: bs.building, bs, cfg: bsCfg,
          round: dates.length > 1 ? idx + 1 : 0,
          totalRounds: dates.length, dayVal, resolvedDate: resolved,
          resolvedStr: `${resolved.getFullYear()}-${String(resolved.getMonth() + 1).padStart(2, "0")}-${String(resolved.getDate()).padStart(2, "0")}`,
          weekday: WEEKDAY_KR[resolved.getDay()],
          wasAdjusted, originalDay, daysUntil,
          isPast: daysUntil < 0, isToday: daysUntil === 0,
          isUrgent: daysUntil >= 0 && daysUntil <= 3,
          isSoon: daysUntil >= 0 && daysUntil <= 7,
        });
      });
    });

    items.sort((a, b) => a.resolvedDate - b.resolvedDate);
    return items;
  }, [buildingSettlements, y, m, buildingData, koreanHolidays]);

  const dateGroups = useMemo(() => {
    const groups = new Map();
    timelineItems.forEach(item => {
      const key = item.resolvedStr;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    return [...groups.entries()];
  }, [timelineItems]);

  // ===== 인쇄 미리보기 =====
  if (printMode && detailBuilding) {
    const bs = buildingSettlements.find(b => b.building === detailBuilding);
    if (!bs) { setPrintMode(false); return null; }
    return <SettlementPrintView data={bs} onClose={() => setPrintMode(false)} />;
  }

  // ===== 상세 보기 =====
  if (detailBuilding) {
    const bs = buildingSettlements.find(b => b.building === detailBuilding);
    if (!bs) return <div style={{ padding: 40, textAlign: "center", color: "#8F95A3" }}><span style={{ cursor: "pointer", color: "#3B82F6" }} onClick={() => setDetailBuilding(null)}>← 목록으로</span></div>;
    const cfg = bs.cfg || {};
    const period = bs.period || {};
    const acctInfo = bs.acctInfo || {};
    const isSalary = cfg.feeType === "salary";
    const typeLabel = TYPE_LABELS[cfg.type] || cfg.type;
    const dirLabel = isSalary ? "건물주 → 하우스맨" : "하우스맨 → 건물주";

    return (
      <div>
        {/* 상단 네비 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setDetailBuilding(null)}>
            <span style={{ fontSize: 20 }}>←</span><span style={{ fontSize: 14, fontWeight: 700, color: "#3B82F6" }}>정산 목록으로</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setPrintMode(true)}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#1e40af", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
              정산서 출력
            </button>
            {addCashbookEntry && (
              <button
                onClick={() => {
                  const acct = buildingAccountMap[bs.building] || {};
                  const ownerAcct = acct.owner ? `${acct.owner.bank} ${acct.owner.account}` : "";
                  const holder = acct.owner?.name || "";
                  addCashbookEntry({
                    type: "settlement",
                    sourceId: `settlement_${bs.building}_${selectedMonth}`,
                    date: new Date().toISOString().slice(0, 10),
                    building: bs.building,
                    description: `${monthLabel} 건물주 정산 (${typeLabel})`,
                    amount: bs.finalAmount,
                    account: ownerAcct,
                    accountHolder: holder,
                    direction: cfg.feeType === "salary" ? "입금" : "출금",
                  });
                  alert(`${bs.building} 정산 내역이 출납관리에 등록되었습니다.`);
                }}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                출납 등록
              </button>
            )}
          </div>
        </div>

        {/* ===== 갑지 (요약) ===== */}
        <Card style={{ marginBottom: 16, border: "2px solid #3B82F6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1A1D23" }}>{bs.building} 정산서</div>
              <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 4 }}>{cfg.ownerName ? `${cfg.ownerName} 건물주님 · ` : ""}{monthLabel} · {typeLabel}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {cfg.feeAmount > 0 && (
                <span style={{ fontSize: 10, padding: "4px 12px", borderRadius: 6, background: "#F5F3FF", color: "#7C3AED", fontWeight: 700 }}>
                  월정액 {fmt(cfg.feeAmount)}원
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {/* 좌: 건물 정보 */}
            <div>
              {cfg.notes && <div style={{ padding: "8px 12px", borderRadius: 8, background: "#FEF3C7", border: "1px solid #FDE68A", fontSize: 11, color: "#92400E", marginBottom: 10 }}>* {cfg.notes}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#8F95A3" }}>주소</span><span style={{ fontWeight: 600 }}>{cfg.address || "—"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#8F95A3" }}>정산계좌</span><span style={{ fontWeight: 600 }}>{acctInfo.owner ? `${acctInfo.owner.bank} ${acctInfo.owner.account}` : "하우스맨 통합"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#8F95A3" }}>정산기간</span><span style={{ fontWeight: 600 }}>{period.start} ~ {period.end}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#8F95A3" }}>입주</span><span style={{ fontWeight: 600 }}>{bs.tenantCount}세대 (신규 {bs.moveInCount})</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#8F95A3" }}>퇴실</span><span style={{ fontWeight: 600 }}>{bs.moveOutCount}건</span></div>
              </div>
            </div>

            {/* 우: 정산 계산 */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1A1D23", marginBottom: 10, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>정산 계산</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {!isSalary && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#374151" }}>1. 월세 정산금(a)</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{fmt(bs.totalRentSettlement)}원</span>
                  </div>
                )}
                {isSalary && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#374151" }}>1. 관리비</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED" }}>{fmt(cfg.feeAmount)}원</span>
                    </div>
                    {cfg.subItems && cfg.subItems.map((si, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "#374151" }}>   {si.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#5F6577" }}>{fmt(si.amount)}원</span>
                      </div>
                    ))}
                  </>
                )}
                {!isSalary && bs.totalMgmtSettlement > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#374151" }}>   관리비 정산</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{fmt(bs.totalMgmtSettlement)}원</span>
                  </div>
                )}
                {bs.moveOutSettlements.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#374151" }}>2. 퇴실 일할 정산</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>{fmt(bs.totalMoveOutRent)}원</span>
                  </div>
                )}
                {bs.totalBrokerage > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#374151" }}>3. 입주시 중개수수료</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>-{fmt(bs.totalBrokerage)}원</span>
                  </div>
                )}
                {bs.totalPenalty > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#374151" }}>4. 퇴실시 위약금</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>{fmt(bs.totalPenalty)}원</span>
                  </div>
                )}
                {bs.totalDepositReturn > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#374151" }}>5. 예치금(b)</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>-{fmt(bs.totalDepositReturn)}원</span>
                  </div>
                )}
                {bs.totalDeduction > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#374151" }}>6. 공제 내역(d)</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>{isSalary ? "" : "-"}{fmt(bs.totalDeduction)}원</span>
                  </div>
                )}
                {cfg.vat && bs.vatInfo.tax > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#374151" }}>   공급가액</span>
                      <span style={{ fontSize: 12, color: "#5F6577" }}>{fmt(bs.vatInfo.supply)}원</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#374151" }}>   부가세 (10%)</span>
                      <span style={{ fontSize: 12, color: "#5F6577" }}>{fmt(bs.vatInfo.tax)}원</span>
                    </div>
                  </>
                )}
                <div style={{ borderTop: "2px solid #1A1D23", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23" }}>최종 정산금</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: isSalary ? "#7C3AED" : "#3B82F6" }}>{fmt(bs.finalAmount)}원</span>
                </div>
                <div style={{ fontSize: 10, color: "#8F95A3", textAlign: "right" }}>{dirLabel}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* ===== 상세내역: 호실 정산 ===== */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1D23", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #E8ECF0" }}>
            {isSalary ? "호실 현황" : "월세 정산 상세"} ({bs.roomSettlements.length}호실)
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E8ECF0" }}>
                  {(isSalary
                    ? ["호실", "상태", "임차인", "입주일", "만기일", "보증금", "임대료", "관리비"]
                    : ["호실", "상태", "세입자", "입주일", "예치금", "월세", "월세일", "정산금", ...(cfg.includeMgmt ? ["관리비"] : [])]
                  ).map((h, i) => (
                    <th key={i} style={{ padding: "8px 10px", textAlign: i >= (isSalary ? 5 : 4) ? "right" : "left", fontSize: 11, fontWeight: 700, color: "#8F95A3", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bs.roomSettlements.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F0F2F5" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700 }}>{r.room}</td>
                    <td style={{ padding: "8px 10px" }}><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#ECFDF5", color: "#059669", fontWeight: 600 }}>{r.status}</span></td>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "#5F6577" }}>{r.moveIn?.slice(2)}</td>
                    {isSalary && <td style={{ padding: "8px 10px", fontSize: 11, color: "#5F6577" }}>{r.expiry?.slice(2) || "—"}</td>}
                    <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmt(r.deposit)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>{fmt(r.rent)}</td>
                    {isSalary ? (
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmt(r.mgmt)}</td>
                    ) : (
                      <>
                        <td style={{ padding: "8px 10px", textAlign: "right" }}>{r.rentDay}일</td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 800, color: "#059669" }}>{fmt(r.settlementAmt)}</td>
                        {cfg.includeMgmt && <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmt(r.mgmt)}</td>}
                      </>
                    )}
                  </tr>
                ))}
                {bs.roomSettlements.length > 0 && (
                  <tr style={{ borderTop: "2px solid #1A1D23", background: "#F9FAFB" }}>
                    <td colSpan={isSalary ? 5 : 5} style={{ padding: "10px", fontWeight: 800, fontSize: 13 }}>합계</td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: 800 }}>{fmt(bs.roomSettlements.reduce((s,r) => s + r.deposit, 0))}</td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: 800 }}>{fmt(bs.totalRent)}</td>
                    {isSalary ? (
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: 800 }}>{fmt(bs.roomSettlements.reduce((s,r) => s + (r.mgmt || 0), 0))}</td>
                    ) : (
                      <>
                        <td></td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: 800, color: "#DC2626" }}>{bs.totalFee > 0 ? `-${fmt(bs.totalFee)}` : "—"}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: 800, color: "#059669", fontSize: 14 }}>{fmt(bs.totalRentSettlement)}</td>
                        {cfg.includeMgmt && <td style={{ padding: "10px", textAlign: "right", fontWeight: 800 }}>{fmt(bs.totalMgmtSettlement)}</td>}
                      </>
                    )}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {bs.roomSettlements.length === 0 && (
            <div style={{ textAlign: "center", padding: 20, color: "#B0B5C1", fontSize: 12 }}>등록된 임차인이 없습니다</div>
          )}
        </Card>

        {/* ===== 월급형: 부가항목 ===== */}
        {isSalary && cfg.subItems && cfg.subItems.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#7C3AED", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #DDD6FE" }}>
              관리 부가항목
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cfg.subItems.map((si, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 6, background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{si.name}</span>
                    {si.vendor && <span style={{ marginLeft: 8, fontSize: 11, color: "#8F95A3" }}>{si.vendor}</span>}
                  </div>
                  <span style={{ fontWeight: 700, color: "#7C3AED" }}>{fmt(si.amount)}원</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderTop: "2px solid #7C3AED" }}>
                <span style={{ fontWeight: 800 }}>부가항목 합계</span>
                <span style={{ fontWeight: 800, color: "#7C3AED", fontSize: 14 }}>{fmt(cfg.subItems.reduce((s, si) => s + si.amount, 0))}원</span>
              </div>
            </div>
          </Card>
        )}

        {/* ===== 입주 정산 ===== */}
        {bs.moveInSettlements && bs.moveInSettlements.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#059669", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #A7F3D0" }}>
              입주 정산 ({bs.moveInSettlements.length}건)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {bs.moveInSettlements.map((mi, i) => (
                <div key={i} style={{ border: "1px solid #A7F3D0", overflow: "hidden" }}>
                  <div style={{ padding: "8px 16px", background: "#059669", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span><strong>{mi.room}호</strong> {mi.name}</span>
                    <span style={{ fontSize: 11 }}>입주 {mi.moveIn}</span>
                  </div>
                  <div style={{ padding: "10px 16px", background: "#ECFDF5" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 6 }}>
                      입주 일할 ({mi.moveInUsedDays}일 / {bs.period.totalDays || totalDays}일) — {mi.moveInDay}일 입주 → {bs.period.totalDays || totalDays}일까지
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #A7F3D0" }}>
                          <td style={{ padding: "4px 0", color: "#374151" }}>월세</td>
                          <td style={{ padding: "4px 0", textAlign: "right", color: "#6B7280", fontSize: 11 }}>{fmt(mi.rent)} x {mi.moveInUsedDays}일 / {totalDays}일</td>
                          <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 700, minWidth: 90 }}>{fmt(mi.rentProRata)}원</td>
                        </tr>
                        {mi.mgmt > 0 && <tr style={{ borderBottom: "1px solid #A7F3D0" }}>
                          <td style={{ padding: "4px 0", color: "#374151" }}>관리비</td>
                          <td style={{ padding: "4px 0", textAlign: "right", color: "#6B7280", fontSize: 11 }}>{fmt(mi.mgmt)} x {mi.moveInUsedDays}일 / {totalDays}일</td>
                          <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 700 }}>{fmt(mi.mgmtProRata)}원</td>
                        </tr>}
                        <tr>
                          <td colSpan={2} style={{ padding: "6px 0", fontWeight: 700, color: "#059669" }}>지급 합계 (HM → 건물주)</td>
                          <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 800, color: "#059669", fontSize: 13 }}>+{fmt(mi.settlementAmt)}원</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ===== 퇴실 정산 ===== */}
        {bs.moveOutSettlements.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#2563EB", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #BFDBFE" }}>
              퇴실 정산 ({bs.moveOutSettlements.length}건)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {bs.moveOutSettlements.map((mt, i) => (
                <div key={i} style={{ border: "1px solid #BFDBFE", overflow: "hidden" }}>
                  {/* 헤더 */}
                  <div style={{ padding: "10px 16px", background: "#2563EB", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{mt.room}호</span>
                      <span style={{ marginLeft: 8, fontWeight: 500, opacity: 0.9 }}>{mt.name}</span>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 10px",
                      background: mt.reason === "조기퇴실" ? "#FDE68A" : "rgba(255,255,255,0.2)",
                      color: mt.reason === "조기퇴실" ? "#92400E" : "#fff", fontWeight: 600 }}>
                      {mt.reason || "만기퇴실"}
                    </span>
                  </div>

                  {/* 계약 정보 테이블 */}
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                        <td style={{ padding: "6px 16px", background: "#F9FAFB", color: "#6B7280", fontWeight: 600, width: "25%" }}>입주일</td>
                        <td style={{ padding: "6px 16px", fontWeight: 600 }}>{mt.moveIn || "—"}</td>
                        <td style={{ padding: "6px 16px", background: "#F9FAFB", color: "#6B7280", fontWeight: 600, width: "25%" }}>퇴실일</td>
                        <td style={{ padding: "6px 16px", fontWeight: 600 }}>{mt.moveOutDate}</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                        <td style={{ padding: "6px 16px", background: "#F9FAFB", color: "#6B7280", fontWeight: 600 }}>만기일</td>
                        <td style={{ padding: "6px 16px", fontWeight: 600 }}>{mt.expiry || "—"}</td>
                        <td style={{ padding: "6px 16px", background: "#F9FAFB", color: "#6B7280", fontWeight: 600 }}>기간정산</td>
                        <td style={{ padding: "6px 16px", fontWeight: 600 }}>{mt.usedDays}일</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                        <td style={{ padding: "6px 16px", background: "#F9FAFB", color: "#6B7280", fontWeight: 600 }}>예치금</td>
                        <td style={{ padding: "6px 16px", fontWeight: 600 }}>{fmt(mt.depositReturn)}원</td>
                        <td style={{ padding: "6px 16px", background: "#F9FAFB", color: "#6B7280", fontWeight: 600 }}>월세</td>
                        <td style={{ padding: "6px 16px", fontWeight: 600 }}>{fmt(mt.rent)}원</td>
                      </tr>
                      {mt.mgmt > 0 && <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                        <td style={{ padding: "6px 16px", background: "#F9FAFB", color: "#6B7280", fontWeight: 600 }}>관리비</td>
                        <td colSpan={3} style={{ padding: "6px 16px", fontWeight: 600 }}>{fmt(mt.mgmt)}원</td>
                      </tr>}
                    </tbody>
                  </table>

                  {/* 일할계산 */}
                  <div style={{ padding: "10px 16px", background: mt.alreadyPaid ? "#FEF2F2" : "#EFF6FF", borderTop: `1px solid ${mt.alreadyPaid ? "#FECACA" : "#BFDBFE"}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: mt.alreadyPaid ? "#DC2626" : "#1D4ED8", marginBottom: 6 }}>
                      {mt.alreadyPaid
                        ? `미사용분 환수 (사용 ${mt.usedDays}일 → 미사용 ${mt.proRataDays}일 돌려받음)`
                        : `사용분 지급 (${mt.usedDays}일 사용 → ${mt.proRataDays}일분 지급)`
                      }
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <tbody>
                        <tr style={{ borderBottom: `1px solid ${mt.alreadyPaid ? "#FECACA" : "#BFDBFE"}` }}>
                          <td style={{ padding: "4px 0", color: "#374151" }}>월세</td>
                          <td style={{ padding: "4px 0", textAlign: "right", color: "#6B7280", fontSize: 11 }}>
                            {fmt(mt.rent)} x {mt.proRataDays}일 / {mt.totalDays}일
                          </td>
                          <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 700, minWidth: 90, color: mt.alreadyPaid ? "#DC2626" : "#111" }}>
                            {mt.alreadyPaid ? "-" : ""}{fmt(mt.rentProRata)}원
                          </td>
                        </tr>
                        {mt.mgmt > 0 && <tr style={{ borderBottom: `1px solid ${mt.alreadyPaid ? "#FECACA" : "#BFDBFE"}` }}>
                          <td style={{ padding: "4px 0", color: "#374151" }}>관리비</td>
                          <td style={{ padding: "4px 0", textAlign: "right", color: "#6B7280", fontSize: 11 }}>
                            {fmt(mt.mgmt)} x {mt.proRataDays}일 / {mt.totalDays}일
                          </td>
                          <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 700, color: mt.alreadyPaid ? "#DC2626" : "#111" }}>
                            {mt.alreadyPaid ? "-" : ""}{fmt(mt.mgmtProRata)}원
                          </td>
                        </tr>}
                        <tr>
                          <td colSpan={2} style={{ padding: "6px 0", fontWeight: 700, color: mt.alreadyPaid ? "#DC2626" : "#1D4ED8" }}>
                            {mt.alreadyPaid ? "환수 합계 (건물주 → HM)" : "지급 합계 (HM → 건물주)"}
                          </td>
                          <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 800, color: mt.alreadyPaid ? "#DC2626" : "#1D4ED8", fontSize: 13 }}>
                            {fmt(mt.settlementAmt)}원
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 예치금 반환 */}
                  <div style={{ padding: "12px 16px", background: "#F9FAFB", borderTop: "2px solid #111" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span>예치금: <strong>{fmt(mt.depositReturn)}</strong></span>
                      <span>공제: <strong style={{ color: "#DC2626" }}>-{fmt(mt.totalDeductItems)}</strong></span>
                      <span style={{ fontWeight: 800, color: mt.finalRefund >= 0 ? "#059669" : "#DC2626", fontSize: 14 }}>
                        환불: {fmt(mt.finalRefund)}원
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ===== 공제내역 ===== */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #FECACA" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#DC2626" }}>{isSalary ? "지출(A/S) / 기타 비용" : "공제내역"}</div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#DC2626" }}>{isSalary ? "" : "-"}{fmt(bs.totalDeduction)}원</span>
          </div>
          {bs.deductions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {bs.deductions.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <span style={{ fontSize: 11, color: "#5F6577", minWidth: 70 }}>{d.date}</span>
                  {d.room && <span style={{ fontSize: 11, fontWeight: 600 }}>{d.room}호</span>}
                  <span style={{ flex: 1, fontSize: 12, color: "#374151" }}>{d.desc}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#DC2626" }}>{fmt(d.amount)}원</span>
                  <button onClick={() => setSettlementExpenses(prev => prev.filter(e => e.id !== d.id))}
                    style={{ border: "none", background: "#fff", color: "#DC2626", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>삭제</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#B0B5C1", fontSize: 12 }}>{isSalary ? "지출 내역이 없습니다" : "공제내역이 없습니다"}</div>
          )}
          {/* 공제 추가 폼 */}
          <div style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <input value={formDate} onChange={e => setFormDate(e.target.value)} type="date"
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E0E3E9", fontSize: 11, fontFamily: "inherit", width: 130 }} />
            <input value={formRoom} onChange={e => setFormRoom(e.target.value)} placeholder="호실"
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E0E3E9", fontSize: 11, fontFamily: "inherit", width: 60 }} />
            <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="내역 (수리비, 청소비 등)"
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E0E3E9", fontSize: 11, fontFamily: "inherit", flex: 1, minWidth: 120 }} />
            <input value={formAmount} onChange={e => setFormAmount(e.target.value)} type="number" placeholder="금액"
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E0E3E9", fontSize: 11, fontFamily: "inherit", width: 90, textAlign: "right" }} />
            <button onClick={() => { setFormBuilding(bs.building); handleAddExpense(); }}
              style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#DC2626", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>추가</button>
          </div>
        </Card>
      </div>
    );
  }

  // ===== 목록 뷰 =====
  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div>
      <SectionTitle sub={`${monthLabel} 건물주 정산`}>건물주 정산</SectionTitle>

      {/* 월 선택기 + 건물 필터 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "8px 16px", borderRadius: 10, border: "1px solid #E8ECF0" }}>
          <button onClick={() => changeMonth(-1)} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", color: "#5F6577", padding: "2px 6px" }}>◀</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1D23", minWidth: 110, textAlign: "center" }}>{monthLabel}</span>
          <button onClick={() => changeMonth(1)} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", color: "#5F6577", padding: "2px 6px" }}>▶</button>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button onClick={() => setSelectedBuilding("전체")}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: selectedBuilding === "전체" ? "#2563EB" : "#fff", color: selectedBuilding === "전체" ? "#fff" : "#5F6577" }}>전체</button>
          {buildingList.map(b => (
            <button key={b} onClick={() => setSelectedBuilding(b)}
              style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: selectedBuilding === b ? "#2563EB" : "#fff", color: selectedBuilding === b ? "#fff" : "#5F6577" }}>{b}</button>
          ))}
        </div>
      </div>

      {/* 전체 요약 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <Card style={{ borderLeft: "4px solid #10B981" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>총 월세/임대료 정산</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#10B981" }}>{fmt(totalSummary.rent)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #EF4444" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>총 공제/지출</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#EF4444" }}>{fmt(totalSummary.deduction)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #3B82F6" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>정산 합계</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#3B82F6" }}>{fmt(totalSummary.final)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #F59E0B" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>이번 달 정산 건수</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F59E0B" }}>{timelineItems.length}건</div>
          <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 2 }}>
            {timelineItems.filter(i => i.isPast).length}건 완료 · {timelineItems.filter(i => !i.isPast && i.daysUntil <= 7).length}건 오픈 · {timelineItems.filter(i => i.daysUntil > 7).length}건 예정
          </div>
        </Card>
      </div>

      {/* ===== 날짜별 타임라인 ===== */}
      <div style={{ position: "relative" }}>
        {/* 타임라인 세로선 */}
        <div style={{ position: "absolute", left: 20, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)", borderRadius: 2, zIndex: 0 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {dateGroups.map(([dateStr, items]) => {
            const d = items[0].resolvedDate;
            const dayNum = d.getDate();
            const weekday = items[0].weekday;
            const isPast = items[0].isPast;
            const isToday = items[0].isToday;
            const isUrgent = items[0].isUrgent;
            const totalAmount = items.reduce((s, i) => s + (i.bs.finalAmount / (i.totalRounds || 1)), 0);

            return (
              <div key={dateStr} style={{ position: "relative", paddingLeft: 52, marginBottom: 8 }}>
                {/* 날짜 노드 */}
                <div style={{
                  position: "absolute", left: 6, top: 4, width: 32, height: 32, borderRadius: "50%",
                  background: isToday ? "linear-gradient(135deg, #3B82F6, #2563EB)" : isPast ? "#D1D5DB" : isUrgent ? "linear-gradient(135deg, #F59E0B, #EF4444)" : "linear-gradient(135deg, #8B5CF6, #6366F1)",
                  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
                  boxShadow: isToday ? "0 0 0 4px rgba(59,130,246,0.2)" : isUrgent && !isPast ? "0 0 0 4px rgba(245,158,11,0.2)" : "none",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{dayNum}</span>
                </div>

                {/* 날짜 헤더 */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingTop: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: isToday ? "#2563EB" : isPast ? "#9CA3AF" : "#1A1D23" }}>
                    {m}월 {dayNum}일 ({weekday})
                  </span>
                  {isToday && <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#fff", fontWeight: 700 }}>TODAY</span>}
                  {!isPast && !isToday && isUrgent && <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: "linear-gradient(135deg, #F59E0B, #EF4444)", color: "#fff", fontWeight: 700 }}>D-{items[0].daysUntil}</span>}
                  {!isPast && !isToday && !isUrgent && items[0].isSoon && <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: "#EFF6FF", color: "#2563EB", fontWeight: 700 }}>D-{items[0].daysUntil}</span>}
                  {isPast && <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: "#F3F4F6", color: "#9CA3AF", fontWeight: 600 }}>완료</span>}
                  <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: isPast ? "#9CA3AF" : "#374151" }}>{items.length}건</span>
                </div>

                {/* 해당 날짜 건물 카드들 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map((item, idx) => {
                    const { bs: ibs, cfg: icfg, round, totalRounds, wasAdjusted, originalDay } = item;
                    const typeLabel = TYPE_LABELS[icfg.type] || icfg.type;
                    const isSal = icfg.feeType === "salary";
                    const dirColor = isSal ? "#7C3AED" : "#3B82F6";
                    const roundLabel = totalRounds > 1 ? `${round}차` : "";
                    const roundColors = ["", "#3B82F6", "#8B5CF6", "#EC4899"];

                    const isOpen = item.daysUntil <= 7; // D-7 이내만 금액 오픈

                    return (
                      <div key={`${item.building}-${round}`}
                        onClick={() => isOpen ? setDetailBuilding(item.building) : null}
                        style={{
                          cursor: isOpen ? "pointer" : "default", padding: "12px 16px", borderRadius: 12,
                          background: !isOpen ? "#F9FAFB" : isPast ? "#FAFAFA" : "#fff",
                          border: !isOpen ? "1.5px dashed #D1D5DB" : isToday ? "2px solid #3B82F6" : isUrgent && !isPast ? "2px solid #F59E0B" : "1.5px solid #E8ECF0",
                          opacity: !isOpen ? 0.6 : isPast ? 0.7 : 1,
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => { if (isOpen && !isPast) { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {totalRounds > 1 && (
                              <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: !isOpen ? "#D1D5DB" : (roundColors[round] || "#3B82F6"), color: "#fff", fontWeight: 800, letterSpacing: 1 }}>{roundLabel}</span>
                            )}
                            <span style={{ fontSize: 15, fontWeight: 800, color: !isOpen ? "#9CA3AF" : isPast ? "#9CA3AF" : "#1A1D23" }}>{item.building}</span>
                            {ibs.tenantCount > 0 && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#F3F4F6", color: "#5F6577", fontWeight: 600 }}>{ibs.tenantCount}세대</span>}
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: isSal ? "#F5F3FF" : "#EFF6FF", color: isSal ? "#7C3AED" : "#2563EB", fontWeight: 600 }}>{typeLabel}</span>
                            {icfg.vat && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#FEF3C7", color: "#92400E", fontWeight: 600 }}>VAT</span>}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            {isOpen ? (
                              <>
                                <div style={{ fontSize: 17, fontWeight: 800, color: isPast ? "#9CA3AF" : dirColor }}>{fmt(Math.round(ibs.finalAmount / totalRounds))}원</div>
                                {totalRounds > 1 && <div style={{ fontSize: 9, color: "#8F95A3" }}>총 {fmt(ibs.finalAmount)}원 중 {round}차분</div>}
                              </>
                            ) : (
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#B0B5C1", fontStyle: "italic" }}>D-{item.daysUntil} 준비중</span>
                            )}
                          </div>
                        </div>
                        {/* 상세 정보 줄 — 오픈 상태에서만 */}
                        {isOpen && (
                          <div style={{ display: "flex", gap: 12, fontSize: 11, color: isPast ? "#B0B5C1" : "#5F6577", marginTop: 6 }}>
                            {!isSal && ibs.totalRent > 0 && <span>월세 <strong>{fmt(ibs.totalRent)}</strong></span>}
                            {isSal && <span>관리비 <strong style={{ color: "#7C3AED" }}>{fmt(icfg.feeAmount)}</strong></span>}
                            {ibs.totalDeduction > 0 && <span>공제 <strong style={{ color: isPast ? "#D1D5DB" : "#DC2626" }}>{fmt(ibs.totalDeduction)}</strong></span>}
                            {ibs.moveOutCount > 0 && <span>퇴실 <strong>{ibs.moveOutCount}건</strong></span>}
                            <span style={{ marginLeft: "auto", color: "#8F95A3", fontSize: 10 }}>
                              {ibs.period.start.slice(5)} ~ {ibs.period.end.slice(5)}
                              {wasAdjusted && <span style={{ marginLeft: 4, color: "#F59E0B", fontWeight: 600 }}>(영업일 조정)</span>}
                            </span>
                          </div>
                        )}
                        {/* 할 일 체크리스트 — 오픈 + 미래만 */}
                        {isOpen && !isPast && (
                          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "#FEF3C7", color: "#92400E", fontWeight: 600 }}>정산서 작성</span>
                            {icfg.vat && <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "#FDE8E8", color: "#DC2626", fontWeight: 600 }}>세금계산서 발행</span>}
                            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "#EFF6FF", color: "#2563EB", fontWeight: 600 }}>{isSal ? "청구서 발송" : "송금 처리"}</span>
                            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "#F0FDF4", color: "#059669", fontWeight: 600 }}>건물주 발송</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {buildingSettlements.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#8F95A3", fontSize: 14 }}>해당 월에 정산할 건물이 없습니다.</div>
      )}
    </div>
  );
};
