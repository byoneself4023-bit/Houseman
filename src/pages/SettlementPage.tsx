import React, { useState, useMemo } from 'react';
import { settlementMaster, buildingAccountMap, getSettlementPeriod, calcFee, calcProRata, calcVat } from '@/data';
import { useIsMobile, fmt } from '@/utils';
import { Card, SectionTitle } from '@/components';
import { inputClassName } from '@/components/Field';
import { SettlementPrintView } from '@/components/SettlementPrintView';
import type { Tenant, SettlementExpense } from '@/types';

interface SettlementPageProps {
  isLoading?: boolean;
  myBuildings?: string[];
  activeTenants?: Tenant[];
  transactions?: any[];
  settlementExpenses?: SettlementExpense[];
  setSettlementExpenses: React.Dispatch<React.SetStateAction<SettlementExpense[]>>;
  buildingData?: Record<string, any>;
  pastTenantsData?: Record<string, any>;
  addCashbookEntry?: (entry: Record<string, any>) => void;
  roomBalances?: Record<string, number>;
  billingHistory?: Record<string, any>;
}

interface SettlementErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SettlementErrorBoundary extends React.Component<{ children: React.ReactNode }, SettlementErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error("SettlementPage error:", error, info?.componentStack); }
  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-center">
        <div className="text-base font-[800] text-hm-danger mb-3">건물주 정산 로딩 오류</div>
        <div className="text-xs text-hm-text-sub mb-4 whitespace-pre-wrap">{String(this.state.error)}{this.state.error?.stack ? "\n\n" + this.state.error.stack : ""}</div>
        <button onClick={() => this.setState({ hasError: false, error: null })} className="px-5 py-2 rounded-lg border-none bg-hm-blue text-white font-bold cursor-pointer hover:opacity-90 transition-opacity">다시 시도</button>
      </div>;
    }
    return this.props.children;
  }
}

export const SettlementPage = (props: SettlementPageProps) => (
  <SettlementErrorBoundary><SettlementPageInner {...props} /></SettlementErrorBoundary>
);

const TYPE_LABELS: Record<string, string> = {
  "A": "단기(%)",
  "B": "1시트",
  "C": "건물주계좌",
  "S": "월급형",
  "F": "월정액",
  "D": "관리비수금",
  "X": "기타",
};

const SettlementPageInner = ({ myBuildings = [], activeTenants = [], transactions = [], settlementExpenses = [], setSettlementExpenses, buildingData = {}, pastTenantsData = {}, addCashbookEntry, isLoading }: SettlementPageProps) => {
  const isMobile = useIsMobile();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedBuilding, setSelectedBuilding] = useState("전체");
  const [detailBuilding, setDetailBuilding] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formBuilding, setFormBuilding] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [y, m] = selectedMonth.split("-").map(Number);
  const changeMonth = (delta: number) => {
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const monthLabel = `${y}년 ${m}월`;

  // 건물 리스트: activeTenants + settlementMaster에 등록된 건물 합산
  const buildingList = useMemo(() => {
    const fromTenants = new Set(activeTenants.map((t: Tenant) => t.building));
    const fromMaster = new Set(Object.keys(settlementMaster));
    const all = [...new Set([...fromTenants, ...fromMaster])];
    if (myBuildings.length > 0) return all.filter(n => myBuildings.includes(n));
    return all.sort((a, b) => {
      const ta = (settlementMaster as any)[a]?.type || "Z";
      const tb = (settlementMaster as any)[b]?.type || "Z";
      return ta.localeCompare(tb) || a.localeCompare(b);
    });
  }, [activeTenants, myBuildings]);

  const displayBuildings = selectedBuilding === "전체" ? buildingList : [selectedBuilding];

  // 건물별 정산 계산
  const buildingSettlements = useMemo(() => {
    return displayBuildings.map(bName => {
      const masterCfg = (settlementMaster as any)[bName] || {};
      const cfg: Record<string, any> = { type: "A", feeType: "pct", feeRate: 0, direction: "hm_to_owner", settlementDay: "말일", periodType: "month", vat: false, address: "", notes: "", ...masterCfg };
      const period = getSettlementPeriod(bName, y, m);
      const bTenants = activeTenants.filter((t: Tenant) => t.building === bName);
      const acctInfo = (buildingAccountMap as any)[bName] || {};

      // 입주자 (해당월 신규)
      const moveInTenants = bTenants.filter((t: Tenant) => t.moveIn && t.moveIn.startsWith(selectedMonth));
      const moveInCount = moveInTenants.length;

      // 퇴실자 (pastTenantsData에서 — 필드: moveOut)
      const moveOutTenants: any[] = [];
      try {
        Object.entries(pastTenantsData || {}).forEach(([key, records]: [string, any]) => {
          if (!key.startsWith(bName + "_")) return;
          if (!Array.isArray(records)) return;
          records.forEach((rec: any) => {
            const moDate = rec?.moveOut || rec?.moveOutDate;
            if (rec && moDate && moDate.startsWith(selectedMonth)) {
              const room = key.split("_").slice(1).join("_"); // "301_2" → "301_2" or "405" → "405"
              moveOutTenants.push({ ...rec, room: room.replace(/_\d+$/, ""), building: bName, moveOutDate: moDate });
            }
          });
        });
      } catch(e) { console.warn("pastTenantsData 파싱 오류:", e); }

      // 1. 호실별 월세 정산
      const roomSettlements = bTenants.map((t: Tenant) => {
        const fee = calcFee(t.rent, bName);
        const settlementAmt = t.rent - fee;
        const mgmtSettlement = cfg.includeMgmt ? (t.mgmt || 0) : 0;
        return {
          room: t.room, name: t.name, moveIn: t.moveIn, expiry: t.expiry,
          deposit: t.deposit || 0, rent: t.rent || 0, mgmt: t.mgmt || 0,
          rentDay: parseInt(t.due?.split("/")[1]) || 0,
          fee, settlementAmt, mgmtSettlement,
          status: "입주",
          delinquent: 0,
        };
      });

      const totalRent = roomSettlements.reduce((s: number, r: any) => s + r.rent, 0);
      const totalFee = roomSettlements.reduce((s: number, r: any) => s + r.fee, 0);
      const totalRentSettlement = roomSettlements.reduce((s: number, r: any) => s + r.settlementAmt, 0);
      const totalMgmtSettlement = roomSettlements.reduce((s: number, r: any) => s + r.mgmtSettlement, 0);

      // 2. 입주 정산 (예치금, 중개수수료)
      const moveInSettlements = moveInTenants.map((t: Tenant) => ({
        room: t.room, name: t.name, moveIn: t.moveIn,
        deposit: t.deposit || 0,
        brokerageFee: (t as any).brokerageFee || 0, // 중개수수료 (마이너스 값으로 반영)
      }));
      const totalBrokerage = moveInSettlements.reduce((s: number, r: any) => s + (r.brokerageFee || 0), 0);

      // 3. 퇴실 정산 (일할 + 청소비 + 검침 + 위약금 + 훼손 + 예치금반환)
      const moveOutSettlements = moveOutTenants.map((mt: any) => {
        const moveOutDay = parseInt(mt.moveOutDate?.split("-")[2]) || 1;
        const rent = mt.rent || 0;
        const mgmt = mt.mgmt || 0;
        const totalDays = new Date(y, m, 0).getDate();
        const usedDays = mt.usedDays || moveOutDay;

        // 일할계산 (pastTenants에 이미 계산된 값 우선 사용)
        const rentProRata = mt.rentProRata != null ? mt.rentProRata : Math.round(rent * usedDays / totalDays);
        const mgmtProRata = mt.mgmtProRata != null ? mt.mgmtProRata : Math.round(mgmt * usedDays / totalDays);
        const fee = calcFee(rentProRata, bName);

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

        // 정산서 반영 금액: 일할 월세정산금 - 수수료
        const settlementAmt = rentProRata - fee;

        return {
          room: mt.room, name: mt.name, moveOutDate: mt.moveOutDate,
          moveIn: mt.moveIn, expiry: mt.expiry,
          reason: mt.reason || "",
          rent, mgmt, usedDays, totalDays,
          rentProRata, mgmtProRata, fee, settlementAmt,
          cleanFee, elecReading, gasReading, waterReading,
          damageFee, damageDesc: mt.damageDesc || "",
          penalty7, penaltyReason: mt.penaltyReason || "",
          depositReturn, totalDeductItems, finalRefund,
          brokerageFee: mt.brokerageFee || 0,
        };
      });
      const totalMoveOutRent = moveOutSettlements.reduce((s: number, r: any) => s + r.settlementAmt, 0);
      const totalPenalty = moveOutSettlements.reduce((s: number, r: any) => s + r.penalty7, 0);
      const totalDepositReturn = moveOutSettlements.reduce((s: number, r: any) => s + r.depositReturn, 0);
      const totalMoveOutBrokerage = moveOutSettlements.reduce((s: number, r: any) => s + (r.brokerageFee || 0), 0);

      // 4. 공제내역
      const deductions = settlementExpenses.filter((e: SettlementExpense) => e.building === bName && e.month === selectedMonth);
      const totalDeduction = deductions.reduce((s: number, e: SettlementExpense) => s + e.amount, 0);

      // 합산 중개수수료 (입주 + 퇴실시 기록된)
      const allBrokerage = totalBrokerage + totalMoveOutBrokerage;

      // 5. 최종 정산금 계산 (유형별)
      let subtotal: number, finalAmount: number;
      if (cfg.feeType === "salary") {
        // 월급형: 관리수수료 + 부가항목 + 지출
        const subItemsTotal = (cfg.subItems || []).reduce((s: number, si: any) => s + si.amount, 0);
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
        const costsTotal = (cfg.costItems || []).reduce((s: number, ci: any) => s + ci.amount, 0);
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

  const totalSummary = useMemo(() => buildingSettlements.reduce((acc: any, b: any) => ({
    rent: acc.rent + b.totalRentSettlement,
    deduction: acc.deduction + b.totalDeduction,
    final: acc.final + b.finalAmount,
  }), { rent: 0, deduction: 0, final: 0 }), [buildingSettlements]);

  const handleAddExpense = () => {
    if (!formBuilding || !formDesc.trim() || !formAmount) return;
    setSettlementExpenses((prev: SettlementExpense[]) => [...prev, {
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
    const lunar: Record<number, string[]> = {
      2025: [`2025-01-28`, `2025-01-29`, `2025-01-30`, `2025-05-05`, `2025-09-06`, `2025-09-07`, `2025-09-08`],
      2026: [`2026-02-16`, `2026-02-17`, `2026-02-18`, `2026-05-24`, `2026-09-24`, `2026-09-25`, `2026-09-26`],
      2027: [`2027-02-05`, `2027-02-06`, `2027-02-07`, `2027-05-13`, `2027-10-14`, `2027-10-15`, `2027-10-16`],
    };
    return new Set([...fixed, ...(lunar[y] || [])]);
  }, [y]);

  const isBusinessDay = (date: Date): boolean => {
    const dow = date.getDay();
    if (dow === 0 || dow === 6) return false;
    const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return !koreanHolidays.has(ds);
  };

  const getNextBusinessDay = (date: Date): Date => {
    const d = new Date(date);
    while (!isBusinessDay(d)) { d.setDate(d.getDate() + 1); }
    return d;
  };

  const resolveSettlementDay = (dayVal: string | number, year: number, month: number): Date => {
    const lastDay = new Date(year, month, 0).getDate();
    const day = dayVal === "말일" ? lastDay : Math.min(Number(dayVal) || lastDay, lastDay);
    const base = new Date(year, month - 1, day);
    return getNextBusinessDay(base);
  };

  const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

  const timelineItems = useMemo(() => {
    const items: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    buildingSettlements.forEach((bs: any) => {
      const bsCfg = bs.cfg;
      const savedDates = buildingData[bs.building]?.settlementDates;
      let dates: string[];
      if (savedDates && savedDates.length > 0) {
        dates = savedDates;
      } else if (bsCfg.frequency === "twice" && bsCfg.dates) {
        dates = bsCfg.dates.map((d: any) => String(d));
      } else {
        dates = [String(bsCfg.settlementDay || "말일")];
      }

      dates.forEach((dayVal: string, idx: number) => {
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

    items.sort((a: any, b: any) => a.resolvedDate - b.resolvedDate);
    return items;
  }, [buildingSettlements, y, m, buildingData, koreanHolidays]);

  const dateGroups = useMemo(() => {
    const groups = new Map<string, any[]>();
    timelineItems.forEach((item: any) => {
      const key = item.resolvedStr;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });
    return [...groups.entries()];
  }, [timelineItems]);

  // ===== 인쇄 미리보기 =====
  if (printMode && detailBuilding) {
    const bs = buildingSettlements.find((b: any) => b.building === detailBuilding);
    if (!bs) { setPrintMode(false); return null; }
    return <SettlementPrintView data={bs} onClose={() => setPrintMode(false)} />;
  }

  // ===== 상세 보기 =====
  if (detailBuilding) {
    const bs = buildingSettlements.find((b: any) => b.building === detailBuilding);
    if (!bs) return <div className="p-10 text-center text-hm-text-muted"><span className="cursor-pointer text-hm-blue hover:underline transition-colors" onClick={() => setDetailBuilding(null)}>← 목록으로</span></div>;
    const cfg = bs.cfg || {};
    const period = bs.period || {};
    const acctInfo = bs.acctInfo || {};
    const isSalary = cfg.feeType === "salary";
    const typeLabel = TYPE_LABELS[cfg.type] || cfg.type;
    const dirLabel = isSalary ? "건물주 → 하우스맨" : "하우스맨 → 건물주";

    return (
      <div>
        {/* 상단 네비 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setDetailBuilding(null)}>
            <span className="text-xl">←</span><span className="text-sm font-bold text-hm-blue">정산 목록으로</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPrintMode(true)}
              className="px-5 py-2 rounded-lg border-none bg-[#1e40af] text-white text-[13px] font-bold cursor-pointer font-[inherit] flex items-center gap-1.5 hover:bg-[#1e3a8a] transition-colors">
              정산서 출력
            </button>
            {addCashbookEntry && (
              <button
                onClick={() => {
                  const acct = (buildingAccountMap as any)[bs.building] || {};
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
                className="px-5 py-2 rounded-lg border-none text-white text-[13px] font-bold cursor-pointer font-[inherit] hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #10B981, var(--color-hm-success))" }}>
                출납 등록
              </button>
            )}
          </div>
        </div>

        {/* ===== 갑지 (요약) ===== */}
        <Card className="mb-4 border-2 border-hm-blue">
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className="text-xl font-[800] text-hm-text">{bs.building} 정산서</div>
              <div className="text-[11px] text-hm-text-muted mt-1">{monthLabel} · {typeLabel} · {dirLabel}</div>
            </div>
            <div className="flex gap-1.5">
              {cfg.feeRate > 0 && (
                <span className="text-[10px] px-3 py-1 rounded-md bg-hm-blue-bg text-hm-blue-dark font-bold">
                  수수료 {(cfg.feeRate * 100).toFixed(1)}%
                </span>
              )}
              {cfg.feeAmount > 0 && (
                <span className="text-[10px] px-3 py-1 rounded-md bg-[#F5F3FF] text-[#7C3AED] font-bold">
                  월정액 {fmt(cfg.feeAmount)}원
                </span>
              )}
            </div>
          </div>

          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {/* 좌: 건물 정보 */}
            <div>
              {cfg.notes && <div className="px-3 py-2 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[11px] text-[#92400E] mb-2.5">* {cfg.notes}</div>}
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between"><span className="text-hm-text-muted">주소</span><span className="font-semibold">{cfg.address || "—"}</span></div>
                <div className="flex justify-between"><span className="text-hm-text-muted">정산계좌</span><span className="font-semibold">{acctInfo.owner ? `${acctInfo.owner.bank} ${acctInfo.owner.account}` : "하우스맨 통합"}</span></div>
                <div className="flex justify-between"><span className="text-hm-text-muted">정산기간</span><span className="font-semibold">{period.start} ~ {period.end}</span></div>
                <div className="flex justify-between"><span className="text-hm-text-muted">입주</span><span className="font-semibold">{bs.tenantCount}세대 (신규 {bs.moveInCount})</span></div>
                <div className="flex justify-between"><span className="text-hm-text-muted">퇴실</span><span className="font-semibold">{bs.moveOutCount}건</span></div>
              </div>
            </div>

            {/* 우: 정산 계산 */}
            <div>
              <div className="text-xs font-[800] text-hm-text mb-2.5 pb-1.5 border-b-[1.5px] border-hm-border">정산 계산</div>
              <div className="flex flex-col gap-2">
                {!isSalary && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-700">1. 월세 정산금(a)</span>
                    <span className="text-[13px] font-bold text-hm-success">{fmt(bs.totalRentSettlement)}원</span>
                  </div>
                )}
                {isSalary && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-700">1. 관리 수수료</span>
                      <span className="text-[13px] font-bold text-[#7C3AED]">{fmt(cfg.feeAmount)}원</span>
                    </div>
                    {cfg.subItems && cfg.subItems.map((si: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-xs text-gray-700">   {si.name}</span>
                        <span className="text-xs font-semibold text-hm-text-sub">{fmt(si.amount)}원</span>
                      </div>
                    ))}
                  </>
                )}
                {!isSalary && bs.totalMgmtSettlement > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-700">   관리비 정산</span>
                    <span className="text-[13px] font-bold text-hm-success">{fmt(bs.totalMgmtSettlement)}원</span>
                  </div>
                )}
                {bs.moveOutSettlements.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-700">2. 퇴실 일할 정산</span>
                    <span className="text-[13px] font-bold text-hm-blue-dark">{fmt(bs.totalMoveOutRent)}원</span>
                  </div>
                )}
                {bs.totalBrokerage > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-700">3. 입주시 중개수수료</span>
                    <span className="text-[13px] font-bold text-hm-danger">-{fmt(bs.totalBrokerage)}원</span>
                  </div>
                )}
                {bs.totalPenalty > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-700">4. 퇴실시 위약금</span>
                    <span className="text-[13px] font-bold text-[#F59E0B]">{fmt(bs.totalPenalty)}원</span>
                  </div>
                )}
                {bs.totalDepositReturn > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-700">5. 예치금(b)</span>
                    <span className="text-[13px] font-bold text-hm-danger">-{fmt(bs.totalDepositReturn)}원</span>
                  </div>
                )}
                {bs.totalDeduction > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-700">6. 공제 내역(d)</span>
                    <span className="text-[13px] font-bold text-hm-danger">{isSalary ? "" : "-"}{fmt(bs.totalDeduction)}원</span>
                  </div>
                )}
                {cfg.vat && bs.vatInfo.tax > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-700">   공급가액</span>
                      <span className="text-xs text-hm-text-sub">{fmt(bs.vatInfo.supply)}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-700">   부가세 (10%)</span>
                      <span className="text-xs text-hm-text-sub">{fmt(bs.vatInfo.tax)}원</span>
                    </div>
                  </>
                )}
                <div className="border-t-2 border-hm-text pt-2 flex justify-between">
                  <span className="text-sm font-[800] text-hm-text">최종 정산금</span>
                  <span className={`text-xl font-[800] ${isSalary ? 'text-[#7C3AED]' : 'text-hm-blue'}`}>{fmt(bs.finalAmount)}원</span>
                </div>
                <div className="text-[10px] text-hm-text-muted text-right">{dirLabel}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* The rest of the detail view is very long - continuing with the same pattern */}
        {/* ===== 상세내역: 호실 정산 ===== */}
        <Card className="mb-4">
          <div className="text-[13px] font-[800] text-hm-text mb-3 pb-2 border-b-2 border-hm-border">
            {isSalary ? "호실 현황" : "월세 정산 상세"} ({bs.roomSettlements.length}호실)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-hm-border">
                  {(isSalary
                    ? ["호실", "상태", "임차인", "입주일", "만기일", "보증금", "임대료", "관리비"]
                    : ["호실", "상태", "세입자", "입주일", "예치금", "월세", "월세일", `수수료(${(cfg.feeRate*100).toFixed(1)}%)`, "정산금", ...(cfg.includeMgmt ? ["관리비"] : [])]
                  ).map((h: string, i: number) => (
                    <th key={i} className={`px-2.5 py-2 text-[11px] font-bold text-hm-text-muted whitespace-nowrap ${i >= (isSalary ? 5 : 4) ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bs.roomSettlements.map((r: any, i: number) => (
                  <tr key={i} className="border-b border-[#F0F2F5]">
                    <td className="px-2.5 py-2 font-bold">{r.room}</td>
                    <td className="px-2.5 py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-hm-success-bg text-hm-success font-semibold">{r.status}</span></td>
                    <td className="px-2.5 py-2 font-semibold">{r.name}</td>
                    <td className="px-2.5 py-2 text-[11px] text-hm-text-sub">{r.moveIn?.slice(2)}</td>
                    {isSalary && <td className="px-2.5 py-2 text-[11px] text-hm-text-sub">{r.expiry?.slice(2) || "—"}</td>}
                    <td className="px-2.5 py-2 text-right">{fmt(r.deposit)}</td>
                    <td className="px-2.5 py-2 text-right font-bold">{fmt(r.rent)}</td>
                    {isSalary ? (
                      <td className="px-2.5 py-2 text-right">{fmt(r.mgmt)}</td>
                    ) : (
                      <>
                        <td className="px-2.5 py-2 text-right">{r.rentDay}일</td>
                        <td className={`px-2.5 py-2 text-right ${r.fee > 0 ? 'text-hm-danger' : 'text-[#B0B5C1]'}`}>{r.fee > 0 ? `-${fmt(r.fee)}` : "—"}</td>
                        <td className="px-2.5 py-2 text-right font-[800] text-hm-success">{fmt(r.settlementAmt)}</td>
                        {cfg.includeMgmt && <td className="px-2.5 py-2 text-right">{fmt(r.mgmt)}</td>}
                      </>
                    )}
                  </tr>
                ))}
                {bs.roomSettlements.length > 0 && (
                  <tr className="border-t-2 border-hm-text bg-hm-bg-hover">
                    <td colSpan={isSalary ? 5 : 5} className="p-2.5 font-[800] text-[13px]">합계</td>
                    <td className="p-2.5 text-right font-[800]">{fmt(bs.roomSettlements.reduce((s: number,r: any) => s + r.deposit, 0))}</td>
                    <td className="p-2.5 text-right font-[800]">{fmt(bs.totalRent)}</td>
                    {isSalary ? (
                      <td className="p-2.5 text-right font-[800]">{fmt(bs.roomSettlements.reduce((s: number,r: any) => s + (r.mgmt || 0), 0))}</td>
                    ) : (
                      <>
                        <td></td>
                        <td className="p-2.5 text-right font-[800] text-hm-danger">{bs.totalFee > 0 ? `-${fmt(bs.totalFee)}` : "—"}</td>
                        <td className="p-2.5 text-right font-[800] text-hm-success text-sm">{fmt(bs.totalRentSettlement)}</td>
                        {cfg.includeMgmt && <td className="p-2.5 text-right font-[800]">{fmt(bs.totalMgmtSettlement)}</td>}
                      </>
                    )}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {bs.roomSettlements.length === 0 && (
            <div className="text-center py-5 text-[#B0B5C1] text-xs">등록된 임차인이 없습니다</div>
          )}
        </Card>

        {/* ===== 월급형: 부가항목 ===== */}
        {isSalary && cfg.subItems && cfg.subItems.length > 0 && (
          <Card className="mb-4">
            <div className="text-[13px] font-[800] text-[#7C3AED] mb-3 pb-2 border-b-2 border-[#DDD6FE]">
              관리 부가항목
            </div>
            <div className="flex flex-col gap-1.5">
              {cfg.subItems.map((si: any, i: number) => (
                <div key={i} className="flex justify-between items-center px-2.5 py-2 rounded-md bg-[#F5F3FF] border border-[#DDD6FE]">
                  <div>
                    <span className="font-semibold">{si.name}</span>
                    {si.vendor && <span className="ml-2 text-[11px] text-hm-text-muted">{si.vendor}</span>}
                  </div>
                  <span className="font-bold text-[#7C3AED]">{fmt(si.amount)}원</span>
                </div>
              ))}
              <div className="flex justify-between px-2.5 py-2 border-t-2 border-[#7C3AED]">
                <span className="font-[800]">부가항목 합계</span>
                <span className="font-[800] text-[#7C3AED] text-sm">{fmt(cfg.subItems.reduce((s: number, si: any) => s + si.amount, 0))}원</span>
              </div>
            </div>
          </Card>
        )}

        {/* ===== 입주 정산 ===== */}
        {bs.moveInSettlements && bs.moveInSettlements.length > 0 && (
          <Card className="mb-4">
            <div className="text-[13px] font-[800] text-hm-success mb-3 pb-2 border-b-2 border-hm-success-border">
              입주 정산 ({bs.moveInSettlements.length}건)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-hm-border">
                    {["호실", "세입자", "입주일", "예치금(b)", "중개수수료(c)"].map((h, i) => (
                      <th key={i} className={`px-2.5 py-2 text-[11px] font-bold text-hm-text-muted ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bs.moveInSettlements.map((mi: any, i: number) => (
                    <tr key={i} className="border-b border-[#F0F2F5]">
                      <td className="px-2.5 py-2 font-bold">{mi.room}</td>
                      <td className="px-2.5 py-2">{mi.name}</td>
                      <td className="px-2.5 py-2 text-[11px] text-hm-text-sub">{mi.moveIn}</td>
                      <td className="px-2.5 py-2 text-right font-semibold">{fmt(mi.deposit)}</td>
                      <td className={`px-2.5 py-2 text-right ${mi.brokerageFee ? 'text-hm-danger' : 'text-[#B0B5C1]'}`}>
                        {mi.brokerageFee ? `-${fmt(mi.brokerageFee)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ===== 퇴실 정산 ===== */}
        {bs.moveOutSettlements.length > 0 && (
          <Card className="mb-4">
            <div className="text-[13px] font-[800] text-hm-blue-dark mb-3 pb-2 border-b-2 border-[#BFDBFE]">
              퇴실 정산 ({bs.moveOutSettlements.length}건)
            </div>
            <div className="flex flex-col gap-3">
              {bs.moveOutSettlements.map((mt: any, i: number) => (
                <div key={i} className="p-3.5 px-4 rounded-[10px] bg-hm-blue-bg border border-[#BFDBFE]">
                  <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-[#BFDBFE]">
                    <div>
                      <span className="font-[800] text-sm">{mt.room}호</span>
                      <span className="ml-2 text-hm-text-sub font-semibold">{mt.name}</span>
                      <span className={`ml-2 text-[10px] px-2 py-0.5 rounded ${mt.reason === "조기퇴실" ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-hm-success-bg text-hm-success'} font-semibold`}>
                        {mt.reason || "퇴실"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] mb-2">
                    <div><span className="text-hm-text-muted">퇴실일</span> <strong>{mt.moveOutDate}</strong></div>
                    <div><span className="text-hm-text-muted">입주일</span> <strong>{mt.moveIn?.slice(5)}</strong></div>
                    <div><span className="text-hm-text-muted">만기일</span> <strong>{mt.expiry?.slice(5) || "—"}</strong></div>
                  </div>
                  <div className="bg-white rounded-md px-2.5 py-2 mb-1.5">
                    <div className="text-[11px] font-bold text-gray-700 mb-1">일할계산 ({mt.usedDays}일 / {mt.totalDays}일)</div>
                    <div className="flex gap-4 text-[11px]">
                      <span>월세 일할: <strong>{fmt(mt.rentProRata)}</strong></span>
                      <span>관리비 일할: <strong>{fmt(mt.mgmtProRata)}</strong></span>
                      <span>수수료({(cfg.feeRate*100).toFixed(1)}%): <strong className="text-hm-danger">-{fmt(mt.fee)}</strong></span>
                      <span>정산금: <strong className="text-hm-blue-dark">{fmt(mt.settlementAmt)}</strong></span>
                    </div>
                  </div>
                  <div className="bg-white rounded-md px-2.5 py-2 mb-1.5">
                    <div className="text-[11px] font-bold text-hm-danger mb-1">퇴실 공제</div>
                    <div className="grid grid-cols-3 gap-1 text-[11px]">
                      {mt.cleanFee > 0 && <span>퇴실청소비: <strong>{fmt(mt.cleanFee)}</strong></span>}
                      {mt.elecReading > 0 && <span>전기검침: <strong>{fmt(mt.elecReading)}</strong></span>}
                      {mt.gasReading > 0 && <span>가스검침: <strong>{fmt(mt.gasReading)}</strong></span>}
                      {mt.waterReading > 0 && <span>수도검침: <strong>{fmt(mt.waterReading)}</strong></span>}
                      {mt.damageFee > 0 && <span>훼손/파손: <strong>{fmt(mt.damageFee)}</strong> <span className="text-[9px] text-hm-text-muted">({mt.damageDesc})</span></span>}
                      {mt.penalty7 > 0 && <span className="text-hm-danger">위약금(7일): <strong>{fmt(mt.penalty7)}</strong></span>}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold">공제합계: <strong className="text-hm-danger">{fmt(mt.totalDeductItems)}</strong></div>
                  </div>
                  <div className="bg-white rounded-md px-2.5 py-2">
                    <div className="flex justify-between text-xs">
                      <span>예치금: <strong>{fmt(mt.depositReturn)}</strong></span>
                      <span>공제: <strong className="text-hm-danger">-{fmt(mt.totalDeductItems)}</strong></span>
                      <span className={`font-[800] text-sm ${mt.finalRefund >= 0 ? 'text-hm-success' : 'text-hm-danger'}`}>
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
        <Card className="mb-4">
          <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-hm-danger-border">
            <div className="text-[13px] font-[800] text-hm-danger">{isSalary ? "지출(A/S) / 기타 비용" : "공제내역"}</div>
            <span className="text-xs font-[800] text-hm-danger">{isSalary ? "" : "-"}{fmt(bs.totalDeduction)}원</span>
          </div>
          {bs.deductions.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {bs.deductions.map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-hm-danger-bg border border-hm-danger-border">
                  <span className="text-[11px] text-hm-text-sub min-w-[70px]">{d.date}</span>
                  {d.room && <span className="text-[11px] font-semibold">{d.room}호</span>}
                  <span className="flex-1 text-xs text-gray-700">{d.desc}</span>
                  <span className="text-xs font-bold text-hm-danger">{fmt(d.amount)}원</span>
                  <button onClick={() => setSettlementExpenses((prev: SettlementExpense[]) => prev.filter((e: SettlementExpense) => e.id !== d.id))}
                    className="border-none bg-white text-hm-danger rounded px-2 py-0.5 text-[10px] font-semibold cursor-pointer font-[inherit] hover:bg-hm-danger-bg transition-colors">삭제</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 text-[#B0B5C1] text-xs">{isSalary ? "지출 내역이 없습니다" : "공제내역이 없습니다"}</div>
          )}
          {/* 공제 추가 폼 */}
          <div className="mt-2.5 flex gap-1.5 items-center flex-wrap">
            <input value={formDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDate(e.target.value)} type="date"
              className="px-2.5 py-1.5 rounded-md border border-hm-input-border text-[11px] font-[inherit] w-[130px] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
            <input value={formRoom} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormRoom(e.target.value)} placeholder="호실"
              className="px-2.5 py-1.5 rounded-md border border-hm-input-border text-[11px] font-[inherit] w-[60px] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
            <input value={formDesc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDesc(e.target.value)} placeholder="내역 (수리비, 청소비 등)"
              className="px-2.5 py-1.5 rounded-md border border-hm-input-border text-[11px] font-[inherit] flex-1 min-w-[120px] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
            <input value={formAmount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormAmount(e.target.value)} type="number" placeholder="금액"
              className="px-2.5 py-1.5 rounded-md border border-hm-input-border text-[11px] font-[inherit] w-[90px] text-right outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
            <button onClick={() => { setFormBuilding(bs.building); handleAddExpense(); }}
              className="px-3.5 py-1.5 rounded-md border-none bg-hm-danger text-white text-[11px] font-bold cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">추가</button>
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
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-[10px] border border-hm-border">
          <button onClick={() => changeMonth(-1)} className="border-none bg-none text-base cursor-pointer text-hm-text-sub px-1.5 py-0.5 hover:text-hm-text transition-colors">◀</button>
          <span className="text-[15px] font-bold text-hm-text min-w-[110px] text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="border-none bg-none text-base cursor-pointer text-hm-text-sub px-1.5 py-0.5 hover:text-hm-text transition-colors">▶</button>
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setSelectedBuilding("전체")}
            className={`px-3.5 py-1.5 rounded-lg border border-hm-border text-xs font-semibold cursor-pointer font-[inherit] transition-colors ${selectedBuilding === "전체" ? 'bg-hm-blue-dark text-white border-hm-blue-dark' : 'bg-white text-hm-text-sub hover:bg-hm-bg-hover'}`}>전체</button>
          {buildingList.map(b => (
            <button key={b} onClick={() => setSelectedBuilding(b)}
              className={`px-3.5 py-1.5 rounded-lg border border-hm-border text-xs font-semibold cursor-pointer font-[inherit] transition-colors ${selectedBuilding === b ? 'bg-hm-blue-dark text-white border-hm-blue-dark' : 'bg-white text-hm-text-sub hover:bg-hm-bg-hover'}`}>{b}</button>
          ))}
        </div>
      </div>

      {/* 전체 요약 */}
      <div className={`grid gap-3 mb-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
        <Card className="border-l-4 border-l-[#10B981]">
          <div className="text-[11px] font-semibold text-[#6B7280] mb-1">총 월세/임대료 정산</div>
          <div className="text-xl font-[800] text-[#10B981]">{fmt(totalSummary.rent)}원</div>
        </Card>
        <Card className="border-l-4 border-l-[#EF4444]">
          <div className="text-[11px] font-semibold text-[#6B7280] mb-1">총 공제/지출</div>
          <div className="text-xl font-[800] text-[#EF4444]">{fmt(totalSummary.deduction)}원</div>
        </Card>
        <Card className="border-l-4 border-l-hm-blue">
          <div className="text-[11px] font-semibold text-[#6B7280] mb-1">정산 합계</div>
          <div className="text-xl font-[800] text-hm-blue">{fmt(totalSummary.final)}원</div>
        </Card>
        <Card className="border-l-4 border-l-[#F59E0B]">
          <div className="text-[11px] font-semibold text-[#6B7280] mb-1">이번 달 정산 건수</div>
          <div className="text-xl font-[800] text-[#F59E0B]">{timelineItems.length}건</div>
          <div className="text-[10px] text-hm-text-muted mt-0.5">
            {timelineItems.filter((i: any) => i.isPast).length}건 완료 · {timelineItems.filter((i: any) => !i.isPast && i.daysUntil <= 7).length}건 오픈 · {timelineItems.filter((i: any) => i.daysUntil > 7).length}건 예정
          </div>
        </Card>
      </div>

      {/* ===== 날짜별 타임라인 ===== */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-[3px] rounded-sm z-0" style={{ background: "linear-gradient(180deg, var(--color-hm-blue) 0%, #8B5CF6 50%, #EC4899 100%)" }} />

        <div className="flex flex-col gap-0">
          {dateGroups.map(([dateStr, items]) => {
            const d = items[0].resolvedDate;
            const dayNum = d.getDate();
            const weekday = items[0].weekday;
            const isPast = items[0].isPast;
            const isToday = items[0].isToday;
            const isUrgent = items[0].isUrgent;
            const totalAmount = items.reduce((s: number, i: any) => s + (i.bs.finalAmount / (i.totalRounds || 1)), 0);

            return (
              <div key={dateStr} className="relative pl-[52px] mb-2">
                <div className="absolute left-1.5 top-1 w-8 h-8 rounded-full flex items-center justify-center z-[1]"
                  style={{
                    background: isToday ? "linear-gradient(135deg, var(--color-hm-blue), var(--color-hm-blue-dark))" : isPast ? "#D1D5DB" : isUrgent ? "linear-gradient(135deg, #F59E0B, #EF4444)" : "linear-gradient(135deg, #8B5CF6, #6366F1)",
                    boxShadow: isToday ? "0 0 0 4px rgba(59,130,246,0.2)" : isUrgent && !isPast ? "0 0 0 4px rgba(245,158,11,0.2)" : "none",
                  }}>
                  <span className="text-[13px] font-[800] text-white">{dayNum}</span>
                </div>

                <div className="flex items-center gap-2 mb-1.5 pt-1">
                  <span className={`text-sm font-[800] ${isToday ? 'text-hm-blue-dark' : isPast ? 'text-[#9CA3AF]' : 'text-hm-text'}`}>
                    {m}월 {dayNum}일 ({weekday})
                  </span>
                  {isToday && <span className="text-[10px] px-2.5 py-0.5 rounded-[10px] text-white font-bold" style={{ background: "linear-gradient(135deg, var(--color-hm-blue), var(--color-hm-blue-dark))" }}>TODAY</span>}
                  {!isPast && !isToday && isUrgent && <span className="text-[10px] px-2.5 py-0.5 rounded-[10px] text-white font-bold" style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}>D-{items[0].daysUntil}</span>}
                  {!isPast && !isToday && !isUrgent && items[0].isSoon && <span className="text-[10px] px-2.5 py-0.5 rounded-[10px] bg-hm-blue-bg text-hm-blue-dark font-bold">D-{items[0].daysUntil}</span>}
                  {isPast && <span className="text-[10px] px-2.5 py-0.5 rounded-[10px] bg-[#F3F4F6] text-[#9CA3AF] font-semibold">완료</span>}
                  <span className={`ml-auto text-xs font-bold ${isPast ? 'text-[#9CA3AF]' : 'text-gray-700'}`}>{items.length}건</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {items.map((item: any, idx: number) => {
                    const { bs: ibs, cfg: icfg, round, totalRounds, wasAdjusted, originalDay } = item;
                    const typeLabel = TYPE_LABELS[icfg.type] || icfg.type;
                    const isSal = icfg.feeType === "salary";
                    const dirColor = isSal ? "#7C3AED" : "var(--color-hm-blue)";
                    const roundLabel = totalRounds > 1 ? `${round}차` : "";
                    const roundColors = ["", "var(--color-hm-blue)", "#8B5CF6", "#EC4899"];

                    const isOpen = item.daysUntil <= 7;

                    return (
                      <div key={`${item.building}-${round}`}
                        onClick={() => isOpen ? setDetailBuilding(item.building) : null}
                        className={`p-3 px-4 rounded-xl transition-all duration-150 ${isOpen ? 'cursor-pointer' : 'cursor-default'} ${!isOpen ? 'bg-hm-bg-hover border-[1.5px] border-dashed border-[#D1D5DB] opacity-60' : isPast ? 'bg-[#FAFAFA] opacity-70' : 'bg-white'} ${isOpen && !isPast ? 'hover:shadow-md hover:-translate-y-px' : ''}`}
                        style={{
                          border: !isOpen ? undefined : isToday ? "2px solid var(--color-hm-blue)" : isUrgent && !isPast ? "2px solid #F59E0B" : "1.5px solid var(--color-hm-border)",
                        }}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {totalRounds > 1 && (
                              <span className="text-[10px] px-2.5 py-[3px] rounded-md text-white font-[800] tracking-wider" style={{ background: !isOpen ? "#D1D5DB" : (roundColors[round] || "var(--color-hm-blue)") }}>{roundLabel}</span>
                            )}
                            <span className={`text-[15px] font-[800] ${!isOpen ? 'text-[#9CA3AF]' : isPast ? 'text-[#9CA3AF]' : 'text-hm-text'}`}>{item.building}</span>
                            {ibs.tenantCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-[#F3F4F6] text-hm-text-sub font-semibold">{ibs.tenantCount}세대</span>}
                            <span className={`text-[10px] px-2 py-0.5 rounded ${isSal ? 'bg-[#F5F3FF] text-[#7C3AED]' : 'bg-hm-blue-bg text-hm-blue-dark'} font-semibold`}>{typeLabel}</span>
                            {icfg.vat && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-semibold">VAT</span>}
                          </div>
                          <div className="text-right">
                            {isOpen ? (
                              <>
                                <div className="text-[17px] font-[800]" style={{ color: isPast ? "#9CA3AF" : dirColor }}>{fmt(Math.round(ibs.finalAmount / totalRounds))}원</div>
                                {totalRounds > 1 && <div className="text-[9px] text-hm-text-muted">총 {fmt(ibs.finalAmount)}원 중 {round}차분</div>}
                              </>
                            ) : (
                              <span className="text-xs font-bold text-[#B0B5C1] italic">D-{item.daysUntil} 준비중</span>
                            )}
                          </div>
                        </div>
                        {isOpen && (
                          <div className={`flex gap-3 text-[11px] mt-1.5 ${isPast ? 'text-[#B0B5C1]' : 'text-hm-text-sub'}`}>
                            {!isSal && ibs.totalRent > 0 && <span>월세 <strong>{fmt(ibs.totalRent)}</strong></span>}
                            {!isSal && ibs.totalFee > 0 && <span>수수료 <strong className={isPast ? 'text-[#D1D5DB]' : 'text-hm-danger'}>-{fmt(ibs.totalFee)}</strong></span>}
                            {isSal && <span>관리수수료 <strong className="text-[#7C3AED]">{fmt(icfg.feeAmount)}</strong></span>}
                            {ibs.totalDeduction > 0 && <span>공제 <strong className={isPast ? 'text-[#D1D5DB]' : 'text-hm-danger'}>{fmt(ibs.totalDeduction)}</strong></span>}
                            {ibs.moveOutCount > 0 && <span>퇴실 <strong>{ibs.moveOutCount}건</strong></span>}
                            <span className="ml-auto text-hm-text-muted text-[10px]">
                              {ibs.period.start.slice(5)} ~ {ibs.period.end.slice(5)}
                              {wasAdjusted && <span className="ml-1 text-[#F59E0B] font-semibold">(영업일 조정)</span>}
                            </span>
                          </div>
                        )}
                        {isOpen && !isPast && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="text-[10px] px-2.5 py-[3px] rounded-md bg-[#FEF3C7] text-[#92400E] font-semibold">정산서 작성</span>
                            {icfg.vat && <span className="text-[10px] px-2.5 py-[3px] rounded-md bg-[#FDE8E8] text-hm-danger font-semibold">세금계산서 발행</span>}
                            <span className="text-[10px] px-2.5 py-[3px] rounded-md bg-hm-blue-bg text-hm-blue-dark font-semibold">{isSal ? "청구서 발송" : "송금 처리"}</span>
                            <span className="text-[10px] px-2.5 py-[3px] rounded-md bg-[#F0FDF4] text-hm-success font-semibold">건물주 발송</span>
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
        <div className="text-center p-10 text-hm-text-muted text-sm">해당 월에 정산할 건물이 없습니다.</div>
      )}
    </div>
  );
};
