import React, { useState, useMemo } from 'react';
import { useIsMobile, fmt } from '@/utils';

const TOTAL_PAYROLL = 25000000;
const REPAIR_MARGIN_RATE = 0.30;
const UTILITY_MARGIN_PER_TENANT = 5000;

interface BuildingInfo {
  name: string;
  fee?: number;
  fixedFee?: number;
  rooms?: number;
  [key: string]: any;
}

interface BuildingProfitEntry {
  name: string;
  rooms: number;
  tenantCount: number;
  totalRent: number;
  feeRate: number;
  fixedFee: number;
  revenue: {
    mgmtFeePct: number;
    mgmtFeeFixed: number;
    utilityMargin: number;
    repairMargin: number;
    total: number;
  };
  cost: {
    payroll: number;
    repair: number;
    utility: number;
    cleaning: number;
    total: number;
  };
  netProfit: number;
  profitRate: number;
  needsReview: boolean;
}

interface ProfitDashboardPageProps {
  myBuildings?: string[];
  activeTenants?: Record<string, any>[];
  activeVacancies?: Record<string, any>[];
  settlementExpenses?: Record<string, any>[];
  buildingData?: Record<string, any>;
  allBuildings?: BuildingInfo[];
  isLoading?: boolean;
}

export function ProfitDashboardPage({ myBuildings = [], activeTenants = [], activeVacancies = [], settlementExpenses = [], buildingData = {}, allBuildings = [], isLoading }: ProfitDashboardPageProps) {
  const isMobile = useIsMobile();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [viewMode, setViewMode] = useState('summary');
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    return `${y}년 ${parseInt(m)}월`;
  }, [selectedMonth]);

  const changeMonth = (delta: number) => {
    setSelectedMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y, m - 1 + delta, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  };

  const buildingProfitData: BuildingProfitEntry[] = useMemo(() => {
    const managedBuildings: BuildingInfo[] = allBuildings.length > 0 ? allBuildings : myBuildings.map(name => ({ name, fee: 0, fixedFee: 0, rooms: 0 }));
    const buildingCount = managedBuildings.length || 1;
    const payrollPerBuilding = Math.round(TOTAL_PAYROLL / buildingCount);

    const monthExpenses = settlementExpenses.filter(e => e.month === selectedMonth);

    return managedBuildings.map(bldg => {
      const name = typeof bldg === 'string' ? bldg : bldg.name;
      const bInfo = allBuildings.find(b => b.name === name) || bldg;
      const feeRate = bInfo.fee || 0;
      const fixedFee = bInfo.fixedFee || 0;
      const rooms = bInfo.rooms || 0;

      const tenants = activeTenants.filter(t => t.building === name);
      const tenantCount = tenants.length;
      const totalRent = tenants.reduce((sum, t) => sum + (t.rent || 0), 0);

      const bldgExpenses = monthExpenses.filter(e => e.building === name);
      const repairExpenses = bldgExpenses.filter(e => e.category === 'repair').reduce((s: number, e: any) => s + (e.amount || 0), 0);
      const utilityExpenses = bldgExpenses.filter(e => e.category === 'utility').reduce((s: number, e: any) => s + (e.amount || 0), 0);
      const cleaningExpenses = bldgExpenses.filter(e => e.category === 'cleaning').reduce((s: number, e: any) => s + (e.amount || 0), 0);

      // Revenue
      const mgmtFeePct = feeRate > 0 ? Math.round(totalRent * feeRate) : 0;
      const mgmtFeeFixed = fixedFee > 0 ? fixedFee : 0;
      const utilityMargin = tenantCount * UTILITY_MARGIN_PER_TENANT;
      const repairMargin = Math.round(repairExpenses * REPAIR_MARGIN_RATE);

      const totalRevenue = mgmtFeePct + mgmtFeeFixed + utilityMargin + repairMargin;

      // Cost
      const repairCost = Math.round(repairExpenses * 0.70);
      const totalCost = payrollPerBuilding + repairCost + utilityExpenses + cleaningExpenses;

      const netProfit = totalRevenue - totalCost;
      const profitRate = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : (tenantCount === 0 && rooms === 0 ? -999 : 0);

      return {
        name,
        rooms,
        tenantCount,
        totalRent,
        feeRate,
        fixedFee,
        revenue: {
          mgmtFeePct,
          mgmtFeeFixed,
          utilityMargin,
          repairMargin,
          total: totalRevenue,
        },
        cost: {
          payroll: payrollPerBuilding,
          repair: repairCost,
          utility: utilityExpenses,
          cleaning: cleaningExpenses,
          total: totalCost,
        },
        netProfit,
        profitRate,
        needsReview: rooms === 0 && tenantCount === 0,
      };
    }).sort((a, b) => b.netProfit - a.netProfit);
  }, [allBuildings, myBuildings, activeTenants, settlementExpenses, selectedMonth]);

  const totals = useMemo(() => {
    const totalRevenue = buildingProfitData.reduce((s, b) => s + b.revenue.total, 0);
    const totalCost = buildingProfitData.reduce((s, b) => s + b.cost.total, 0);
    const netProfit = totalRevenue - totalCost;
    const marginRate = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    return { totalRevenue, totalCost, netProfit, marginRate };
  }, [buildingProfitData]);

  const bottom20Threshold = useMemo(() => {
    const sorted = [...buildingProfitData].filter(b => !b.needsReview).sort((a, b) => a.profitRate - b.profitRate);
    const cutoff = Math.ceil(sorted.length * 0.2);
    if (cutoff > 0 && sorted.length > 0) {
      return sorted[cutoff - 1]?.profitRate ?? -Infinity;
    }
    return -Infinity;
  }, [buildingProfitData]);

  const maxProfit = useMemo(() => {
    return Math.max(...buildingProfitData.map(b => Math.abs(b.netProfit)), 1);
  }, [buildingProfitData]);

  const detailData = useMemo(() => {
    if (!selectedBuilding) return null;
    return buildingProfitData.find(b => b.name === selectedBuilding) || null;
  }, [selectedBuilding, buildingProfitData]);

  const renderSummaryCards = () => (
    <div className="flex gap-4 mb-6 flex-wrap">
      <div className="flex-[1_1_200px] bg-white border border-hm-border rounded-xl p-4 md:p-5 border-t-[3px] border-t-blue-500">
        <div className="text-[13px] text-slate-500 font-semibold mb-2">총 매출</div>
        <div className={`${isMobile ? 'text-xl' : 'text-[26px]'} font-extrabold text-blue-500`}>{fmt(totals.totalRevenue)}원</div>
      </div>
      <div className="flex-[1_1_200px] bg-white border border-hm-border rounded-xl p-4 md:p-5 border-t-[3px] border-t-amber-500">
        <div className="text-[13px] text-slate-500 font-semibold mb-2">총 비용</div>
        <div className={`${isMobile ? 'text-xl' : 'text-[26px]'} font-extrabold text-amber-500`}>{fmt(totals.totalCost)}원</div>
      </div>
      <div className={`flex-[1_1_200px] bg-white border border-hm-border rounded-xl p-4 md:p-5 border-t-[3px] ${totals.netProfit >= 0 ? 'border-t-emerald-500' : 'border-t-red-500'}`}>
        <div className="text-[13px] text-slate-500 font-semibold mb-2">순이익</div>
        <div className={`${isMobile ? 'text-xl' : 'text-[26px]'} font-extrabold ${totals.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmt(totals.netProfit)}원</div>
        <div className="text-xs text-slate-400 mt-1">마진율 {totals.marginRate.toFixed(1)}%</div>
      </div>
    </div>
  );

  const renderMonthSelector = () => (
    <div className="flex items-center justify-center gap-4 mb-6">
      <button className="w-9 h-9 rounded-full border border-hm-border bg-white cursor-pointer text-base font-bold text-blue-500 flex items-center justify-center hover:bg-slate-50 transition-colors" onClick={() => changeMonth(-1)}>&lt;</button>
      <span className="text-lg font-bold text-slate-800">{monthLabel}</span>
      <button className="w-9 h-9 rounded-full border border-hm-border bg-white cursor-pointer text-base font-bold text-blue-500 flex items-center justify-center hover:bg-slate-50 transition-colors" onClick={() => changeMonth(1)}>&gt;</button>
    </div>
  );

  const renderViewTabs = () => (
    <div className="flex gap-2 mb-5">
      {[
        { key: 'summary', label: '요약' },
        { key: 'detail', label: '상세' },
        { key: 'trend', label: '추이' },
      ].map(tab => (
        <button
          key={tab.key}
          className={`px-[18px] py-2 rounded-lg border-none font-bold text-[13px] cursor-pointer transition-colors ${viewMode === tab.key ? 'bg-blue-500 text-white' : 'bg-hm-border text-slate-500 hover:bg-slate-200'}`}
          onClick={() => { setViewMode(tab.key); setSelectedBuilding(null); }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderBuildingDetail = () => {
    if (!detailData) return null;
    const d = detailData;
    const profitColor = d.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500';
    const profitBg = d.netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500';

    return (
      <div className={`bg-white border border-hm-border rounded-xl ${isMobile ? 'p-4' : 'p-6'} mb-6`}>
        <div className="text-lg font-extrabold text-slate-800 mb-4 flex justify-between items-center">
          <span>{d.name} 수익 상세</span>
          <button className="bg-transparent border-none text-xl cursor-pointer text-slate-400 font-bold hover:text-slate-600 transition-colors" onClick={() => setSelectedBuilding(null)}>x</button>
        </div>
        <div className="flex gap-6 flex-wrap">
          <div className="flex-[1_1_280px]">
            <div className="text-sm font-bold text-blue-500 mb-2 pb-1 border-b-2 border-blue-500">매출 항목</div>
            <div className="mb-4">
              {d.revenue.mgmtFeePct > 0 && (
                <div className="flex justify-between py-1.5 text-[13px] text-slate-700">
                  <span>관리수수료 ({(d.feeRate * 100).toFixed(1)}%)</span>
                  <span className="font-bold">{fmt(d.revenue.mgmtFeePct)}원</span>
                </div>
              )}
              {d.revenue.mgmtFeeFixed > 0 && (
                <div className="flex justify-between py-1.5 text-[13px] text-slate-700">
                  <span>관리수수료 (정액)</span>
                  <span className="font-bold">{fmt(d.revenue.mgmtFeeFixed)}원</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 text-[13px] text-slate-700">
                <span>전기/가스 마진 ({d.tenantCount}세대 x 5,000)</span>
                <span className="font-bold">{fmt(d.revenue.utilityMargin)}원</span>
              </div>
              {d.revenue.repairMargin > 0 && (
                <div className="flex justify-between py-1.5 text-[13px] text-slate-700">
                  <span>수리/공사 마진 (30%)</span>
                  <span className="font-bold">{fmt(d.revenue.repairMargin)}원</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 text-[13px] font-extrabold border-t border-hm-border pt-2 mt-1 text-blue-500">
                <span>매출 소계</span>
                <span>{fmt(d.revenue.total)}원</span>
              </div>
            </div>
          </div>
          <div className="flex-[1_1_280px]">
            <div className="text-sm font-bold text-amber-500 mb-2 pb-1 border-b-2 border-amber-500">비용 항목</div>
            <div className="mb-4">
              <div className="flex justify-between py-1.5 text-[13px] text-slate-700">
                <span>인건비 배분</span>
                <span className="font-bold">{fmt(d.cost.payroll)}원</span>
              </div>
              {d.cost.repair > 0 && (
                <div className="flex justify-between py-1.5 text-[13px] text-slate-700">
                  <span>수선비 (70%)</span>
                  <span className="font-bold">{fmt(d.cost.repair)}원</span>
                </div>
              )}
              {d.cost.utility > 0 && (
                <div className="flex justify-between py-1.5 text-[13px] text-slate-700">
                  <span>공과금 (공용)</span>
                  <span className="font-bold">{fmt(d.cost.utility)}원</span>
                </div>
              )}
              {d.cost.cleaning > 0 && (
                <div className="flex justify-between py-1.5 text-[13px] text-slate-700">
                  <span>청소비</span>
                  <span className="font-bold">{fmt(d.cost.cleaning)}원</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 text-[13px] font-extrabold border-t border-hm-border pt-2 mt-1 text-amber-500">
                <span>비용 소계</span>
                <span>{fmt(d.cost.total)}원</span>
              </div>
            </div>
          </div>
        </div>
        {/* Net profit bar */}
        <div className="mt-4 pt-4 border-t border-hm-border">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-slate-800">순이익</span>
            <span className={`text-lg font-extrabold ${profitColor}`}>{fmt(d.netProfit)}원</span>
          </div>
          <div className="bg-slate-100 rounded-md h-6 overflow-hidden relative">
            {d.revenue.total > 0 && (
              <div className={`h-full ${profitBg} rounded-md transition-all duration-300 ease-in-out`} style={{
                width: `${Math.max(0, Math.min(100, (d.netProfit / d.revenue.total) * 100))}%`,
              }} />
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1 text-right">
            수익률 {d.profitRate !== -999 ? `${d.profitRate.toFixed(1)}%` : '-'}
          </div>
        </div>
      </div>
    );
  };

  const renderSummaryTable = () => {
    const reviewItems = buildingProfitData.filter(b => b.needsReview);
    const normalItems = buildingProfitData.filter(b => !b.needsReview);

    return (
      <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <table className="w-full bg-white border border-hm-border rounded-xl overflow-hidden mb-6 min-w-[560px]" cellSpacing={0}>
          <thead>
            <tr>
              <th className="px-3.5 py-3 text-left text-xs font-bold text-slate-500 bg-slate-100 border-b border-hm-border">순위</th>
              <th className="px-3.5 py-3 text-left text-xs font-bold text-slate-500 bg-slate-100 border-b border-hm-border">건물</th>
              <th className="px-3.5 py-3 text-right text-xs font-bold text-slate-500 bg-slate-100 border-b border-hm-border">매출</th>
              <th className="px-3.5 py-3 text-right text-xs font-bold text-slate-500 bg-slate-100 border-b border-hm-border">비용</th>
              <th className="px-3.5 py-3 text-right text-xs font-bold text-slate-500 bg-slate-100 border-b border-hm-border">순이익</th>
              <th className="px-3.5 py-3 text-right text-xs font-bold text-slate-500 bg-slate-100 border-b border-hm-border">수익률</th>
              {!isMobile && <th className="px-3.5 py-3 text-left text-xs font-bold text-slate-500 bg-slate-100 border-b border-hm-border w-[120px]">이익 바</th>}
            </tr>
          </thead>
          <tbody>
            {normalItems.map((b, i) => {
              const isBottom20 = b.profitRate <= bottom20Threshold && !b.needsReview;
              const profitColor = b.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500';
              const barW = maxProfit > 0 ? (Math.abs(b.netProfit) / maxProfit) * 100 : 0;

              return (
                <tr
                  key={b.name}
                  className="cursor-pointer transition-colors duration-150 hover:bg-slate-50"
                  style={{
                    background: selectedBuilding === b.name ? '#EFF6FF' : (isBottom20 ? '#FFFBEB' : undefined),
                  }}
                  onClick={() => setSelectedBuilding(b.name === selectedBuilding ? null : b.name)}
                >
                  <td className="px-3.5 py-3 text-[13px] text-slate-800 border-b border-slate-100">{i + 1}</td>
                  <td className="px-3.5 py-3 text-[13px] text-slate-800 border-b border-slate-100 font-bold">
                    {b.name}
                    {isBottom20 && <span className="inline-block bg-amber-100 text-amber-600 text-[11px] font-bold px-2 py-0.5 rounded-md ml-1.5">하위</span>}
                  </td>
                  <td className="px-3.5 py-3 text-[13px] text-slate-800 border-b border-slate-100 text-right tabular-nums">{fmt(b.revenue.total)}</td>
                  <td className="px-3.5 py-3 text-[13px] text-slate-800 border-b border-slate-100 text-right tabular-nums">{fmt(b.cost.total)}</td>
                  <td className={`px-3.5 py-3 text-[13px] border-b border-slate-100 text-right tabular-nums font-bold ${profitColor}`}>{fmt(b.netProfit)}</td>
                  <td className={`px-3.5 py-3 text-[13px] border-b border-slate-100 text-right tabular-nums ${profitColor}`}>
                    {b.profitRate.toFixed(1)}%
                  </td>
                  {!isMobile && (
                    <td className="px-3.5 py-3 text-[13px] text-slate-800 border-b border-slate-100">
                      <div className={`h-[18px] rounded ${b.netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'} transition-all duration-300 ease-in-out`} style={{ width: `${barW}%`, minWidth: barW > 0 ? 4 : 0 }} />
                    </td>
                  )}
                </tr>
              );
            })}
            {reviewItems.length > 0 && (
              <>
                <tr>
                  <td colSpan={isMobile ? 6 : 7} className="px-3.5 py-2 text-xs font-bold text-amber-600 bg-amber-100 border-b border-hm-border">
                    -- 재검토 필요 ({reviewItems.length}개 건물) --
                  </td>
                </tr>
                {reviewItems.map(b => (
                  <tr key={b.name} className="bg-amber-50">
                    <td className="px-3.5 py-3 text-[13px] text-slate-800 border-b border-slate-100">-</td>
                    <td className="px-3.5 py-3 text-[13px] border-b border-slate-100 font-bold text-amber-600">{b.name}</td>
                    <td className="px-3.5 py-3 text-[13px] text-slate-800 border-b border-slate-100 text-right tabular-nums">0</td>
                    <td className="px-3.5 py-3 text-[13px] text-slate-800 border-b border-slate-100 text-right tabular-nums">{fmt(b.cost.total)}</td>
                    <td className="px-3.5 py-3 text-[13px] border-b border-slate-100 text-right tabular-nums text-red-500 font-bold">{fmt(b.netProfit)}</td>
                    <td className="px-3.5 py-3 text-[13px] border-b border-slate-100 text-right tabular-nums text-amber-600">재검토 필요</td>
                    {!isMobile && <td className="px-3.5 py-3 text-[13px] text-slate-800 border-b border-slate-100" />}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDetailView = () => (
    <div>
      {selectedBuilding && renderBuildingDetail()}
      {renderSummaryTable()}
    </div>
  );

  const renderTrendView = () => {
    // Generate last 6 months for trend display
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const [y, m] = selectedMonth.split('-').map(Number);
      const d = new Date(y, m - 1 - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const managedBuildings: BuildingInfo[] = allBuildings.length > 0 ? allBuildings : myBuildings.map(name => ({ name, fee: 0, fixedFee: 0, rooms: 0 }));
    const buildingCount = managedBuildings.length || 1;
    const payrollPerBuilding = Math.round(TOTAL_PAYROLL / buildingCount);

    const trendData = months.map(month => {
      const monthExp = settlementExpenses.filter(e => e.month === month);
      let totalRev = 0;
      let totalCst = 0;

      managedBuildings.forEach(bldg => {
        const name = typeof bldg === 'string' ? bldg : bldg.name;
        const bInfo = allBuildings.find(b => b.name === name) || bldg;
        const tenants = activeTenants.filter(t => t.building === name);
        const totalRent = tenants.reduce((s, t) => s + (t.rent || 0), 0);
        const bldgExp = monthExp.filter(e => e.building === name);
        const repairExp = bldgExp.filter(e => e.category === 'repair').reduce((s: number, e: any) => s + (e.amount || 0), 0);

        const rev = (bInfo.fee && bInfo.fee > 0 ? Math.round(totalRent * bInfo.fee) : 0)
          + (bInfo.fixedFee && bInfo.fixedFee > 0 ? bInfo.fixedFee : 0)
          + tenants.length * UTILITY_MARGIN_PER_TENANT
          + Math.round(repairExp * REPAIR_MARGIN_RATE);

        const cost = payrollPerBuilding
          + Math.round(repairExp * 0.7)
          + bldgExp.filter(e => e.category === 'utility').reduce((s: number, e: any) => s + (e.amount || 0), 0)
          + bldgExp.filter(e => e.category === 'cleaning').reduce((s: number, e: any) => s + (e.amount || 0), 0);

        totalRev += rev;
        totalCst += cost;
      });

      return { month, revenue: totalRev, cost: totalCst, profit: totalRev - totalCst };
    });

    const maxVal = Math.max(...trendData.map(d => Math.max(d.revenue, d.cost, Math.abs(d.profit))), 1);

    return (
      <div className={`bg-white border border-hm-border rounded-xl ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="text-base font-bold text-slate-800 mb-4">월별 추이 (최근 6개월)</div>
        <div className={`flex ${isMobile ? 'gap-1.5' : 'gap-4'} items-end h-[200px] border-b border-hm-border pb-2 mb-2`}>
          {trendData.map(d => {
            const revH = (d.revenue / maxVal) * 160;
            const costH = (d.cost / maxVal) * 160;
            const profH = (Math.abs(d.profit) / maxVal) * 160;
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="flex gap-0.5 items-end h-[170px]">
                  <div className={`${isMobile ? 'w-2' : 'w-4'} bg-blue-500 rounded-sm`} style={{ height: Math.max(revH, 2) }} title={`매출: ${fmt(d.revenue)}`} />
                  <div className={`${isMobile ? 'w-2' : 'w-4'} bg-amber-500 rounded-sm`} style={{ height: Math.max(costH, 2) }} title={`비용: ${fmt(d.cost)}`} />
                  <div className={`${isMobile ? 'w-2' : 'w-4'} ${d.profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'} rounded-sm`} style={{ height: Math.max(profH, 2) }} title={`이익: ${fmt(d.profit)}`} />
                </div>
              </div>
            );
          })}
        </div>
        <div className={`flex ${isMobile ? 'gap-1.5' : 'gap-4'}`}>
          {trendData.map(d => (
            <div key={d.month} className="flex-1 text-center text-[11px] text-slate-500">
              {d.month.split('-')[1]}월
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-4 justify-center mt-4">
          {[
            { color: 'bg-blue-500', label: '매출' },
            { color: 'bg-amber-500', label: '비용' },
            { color: 'bg-emerald-500', label: '이익' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className={`w-3 h-3 rounded-sm ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} bg-slate-50 min-h-screen`}>
      <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-extrabold text-slate-800 mb-5`}>수익 대시보드</div>
      {renderMonthSelector()}
      {renderSummaryCards()}
      {renderViewTabs()}
      {viewMode === 'summary' && (
        <>
          {selectedBuilding && renderBuildingDetail()}
          {renderSummaryTable()}
        </>
      )}
      {viewMode === 'detail' && renderDetailView()}
      {viewMode === 'trend' && renderTrendView()}
    </div>
  );
}
