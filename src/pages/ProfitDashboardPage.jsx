import React, { useState, useMemo } from 'react';
import { useIsMobile, fmt } from '../utils';

const TOTAL_PAYROLL = 25000000;
const REPAIR_MARGIN_RATE = 0.30;
const UTILITY_MARGIN_PER_TENANT = 5000;

export function ProfitDashboardPage({ myBuildings = [], activeTenants = [], activeVacancies = [], settlementExpenses = [], buildingData = {}, allBuildings = [] }) {
  const isMobile = useIsMobile();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [viewMode, setViewMode] = useState('summary');
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    return `${y}년 ${parseInt(m)}월`;
  }, [selectedMonth]);

  const changeMonth = (delta) => {
    setSelectedMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y, m - 1 + delta, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  };

  const buildingProfitData = useMemo(() => {
    const managedBuildings = allBuildings.length > 0 ? allBuildings : myBuildings.map(name => ({ name, fee: 0, fixedFee: 0, rooms: 0 }));
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
      const repairExpenses = bldgExpenses.filter(e => e.category === 'repair').reduce((s, e) => s + (e.amount || 0), 0);
      const utilityExpenses = bldgExpenses.filter(e => e.category === 'utility').reduce((s, e) => s + (e.amount || 0), 0);
      const cleaningExpenses = bldgExpenses.filter(e => e.category === 'cleaning').reduce((s, e) => s + (e.amount || 0), 0);

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

  // --- Styles ---
  const styles = {
    container: {
      padding: isMobile ? 16 : 24,
      background: '#F8FAFC',
      minHeight: '100vh',
    },
    header: {
      fontSize: isMobile ? 20 : 24,
      fontWeight: 800,
      color: '#1E293B',
      marginBottom: 20,
    },
    summaryRow: {
      display: 'flex',
      gap: 16,
      marginBottom: 24,
      flexWrap: 'wrap',
    },
    summaryCard: (color) => ({
      flex: '1 1 200px',
      background: '#fff',
      border: '1px solid #E8ECF0',
      borderRadius: 12,
      padding: isMobile ? 16 : 20,
      borderTop: `3px solid ${color}`,
    }),
    summaryLabel: {
      fontSize: 13,
      color: '#64748B',
      fontWeight: 600,
      marginBottom: 8,
    },
    summaryValue: (color) => ({
      fontSize: isMobile ? 20 : 26,
      fontWeight: 800,
      color,
    }),
    summarySubtext: {
      fontSize: 12,
      color: '#94A3B8',
      marginTop: 4,
    },
    monthSelector: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginBottom: 24,
    },
    monthBtn: {
      width: 36,
      height: 36,
      borderRadius: '50%',
      border: '1px solid #E8ECF0',
      background: '#fff',
      cursor: 'pointer',
      fontSize: 16,
      fontWeight: 700,
      color: '#3B82F6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthText: {
      fontSize: 18,
      fontWeight: 700,
      color: '#1E293B',
    },
    viewTabs: {
      display: 'flex',
      gap: 8,
      marginBottom: 20,
    },
    tab: (active) => ({
      padding: '8px 18px',
      borderRadius: 8,
      border: 'none',
      background: active ? '#3B82F6' : '#E8ECF0',
      color: active ? '#fff' : '#64748B',
      fontWeight: 700,
      fontSize: 13,
      cursor: 'pointer',
    }),
    table: {
      width: '100%',
      background: '#fff',
      border: '1px solid #E8ECF0',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 24,
    },
    th: {
      padding: '12px 14px',
      textAlign: 'left',
      fontSize: 12,
      fontWeight: 700,
      color: '#64748B',
      background: '#F1F5F9',
      borderBottom: '1px solid #E8ECF0',
    },
    td: {
      padding: '12px 14px',
      fontSize: 13,
      color: '#1E293B',
      borderBottom: '1px solid #F1F5F9',
    },
    tdRight: {
      padding: '12px 14px',
      fontSize: 13,
      color: '#1E293B',
      borderBottom: '1px solid #F1F5F9',
      textAlign: 'right',
      fontVariantNumeric: 'tabular-nums',
    },
    rowClickable: {
      cursor: 'pointer',
      transition: 'background 0.15s',
    },
    warningBadge: {
      display: 'inline-block',
      background: '#FEF3C7',
      color: '#D97706',
      fontSize: 11,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 6,
    },
    detailPanel: {
      background: '#fff',
      border: '1px solid #E8ECF0',
      borderRadius: 12,
      padding: isMobile ? 16 : 24,
      marginBottom: 24,
    },
    detailTitle: {
      fontSize: 18,
      fontWeight: 800,
      color: '#1E293B',
      marginBottom: 16,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailSection: {
      marginBottom: 16,
    },
    detailSectionTitle: (color) => ({
      fontSize: 14,
      fontWeight: 700,
      color,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottom: `2px solid ${color}`,
    }),
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      fontSize: 13,
      color: '#334155',
    },
    bar: (width, color) => ({
      height: 18,
      width: `${width}%`,
      background: color,
      borderRadius: 4,
      minWidth: width > 0 ? 4 : 0,
      transition: 'width 0.3s ease',
    }),
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: 20,
      cursor: 'pointer',
      color: '#94A3B8',
      fontWeight: 700,
    },
  };

  const renderSummaryCards = () => (
    <div style={styles.summaryRow}>
      <div style={styles.summaryCard('#3B82F6')}>
        <div style={styles.summaryLabel}>총 매출</div>
        <div style={styles.summaryValue('#3B82F6')}>{fmt(totals.totalRevenue)}원</div>
      </div>
      <div style={styles.summaryCard('#F59E0B')}>
        <div style={styles.summaryLabel}>총 비용</div>
        <div style={styles.summaryValue('#F59E0B')}>{fmt(totals.totalCost)}원</div>
      </div>
      <div style={styles.summaryCard(totals.netProfit >= 0 ? '#10B981' : '#EF4444')}>
        <div style={styles.summaryLabel}>순이익</div>
        <div style={styles.summaryValue(totals.netProfit >= 0 ? '#10B981' : '#EF4444')}>{fmt(totals.netProfit)}원</div>
        <div style={styles.summarySubtext}>마진율 {totals.marginRate.toFixed(1)}%</div>
      </div>
    </div>
  );

  const renderMonthSelector = () => (
    <div style={styles.monthSelector}>
      <button style={styles.monthBtn} onClick={() => changeMonth(-1)}>&lt;</button>
      <span style={styles.monthText}>{monthLabel}</span>
      <button style={styles.monthBtn} onClick={() => changeMonth(1)}>&gt;</button>
    </div>
  );

  const renderViewTabs = () => (
    <div style={styles.viewTabs}>
      {[
        { key: 'summary', label: '요약' },
        { key: 'detail', label: '상세' },
        { key: 'trend', label: '추이' },
      ].map(tab => (
        <button
          key={tab.key}
          style={styles.tab(viewMode === tab.key)}
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
    const profitColor = d.netProfit >= 0 ? '#10B981' : '#EF4444';

    return (
      <div style={styles.detailPanel}>
        <div style={styles.detailTitle}>
          <span>{d.name} 수익 상세</span>
          <button style={styles.closeBtn} onClick={() => setSelectedBuilding(null)}>x</button>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px' }}>
            <div style={styles.detailSectionTitle('#3B82F6')}>매출 항목</div>
            <div style={styles.detailSection}>
              {d.revenue.mgmtFeePct > 0 && (
                <div style={styles.detailRow}>
                  <span>관리수수료 ({(d.feeRate * 100).toFixed(1)}%)</span>
                  <span style={{ fontWeight: 700 }}>{fmt(d.revenue.mgmtFeePct)}원</span>
                </div>
              )}
              {d.revenue.mgmtFeeFixed > 0 && (
                <div style={styles.detailRow}>
                  <span>관리수수료 (정액)</span>
                  <span style={{ fontWeight: 700 }}>{fmt(d.revenue.mgmtFeeFixed)}원</span>
                </div>
              )}
              <div style={styles.detailRow}>
                <span>전기/가스 마진 ({d.tenantCount}세대 x 5,000)</span>
                <span style={{ fontWeight: 700 }}>{fmt(d.revenue.utilityMargin)}원</span>
              </div>
              {d.revenue.repairMargin > 0 && (
                <div style={styles.detailRow}>
                  <span>수리/공사 마진 (30%)</span>
                  <span style={{ fontWeight: 700 }}>{fmt(d.revenue.repairMargin)}원</span>
                </div>
              )}
              <div style={{ ...styles.detailRow, fontWeight: 800, borderTop: '1px solid #E8ECF0', paddingTop: 8, marginTop: 4, color: '#3B82F6' }}>
                <span>매출 소계</span>
                <span>{fmt(d.revenue.total)}원</span>
              </div>
            </div>
          </div>
          <div style={{ flex: '1 1 280px' }}>
            <div style={styles.detailSectionTitle('#F59E0B')}>비용 항목</div>
            <div style={styles.detailSection}>
              <div style={styles.detailRow}>
                <span>인건비 배분</span>
                <span style={{ fontWeight: 700 }}>{fmt(d.cost.payroll)}원</span>
              </div>
              {d.cost.repair > 0 && (
                <div style={styles.detailRow}>
                  <span>수선비 (70%)</span>
                  <span style={{ fontWeight: 700 }}>{fmt(d.cost.repair)}원</span>
                </div>
              )}
              {d.cost.utility > 0 && (
                <div style={styles.detailRow}>
                  <span>공과금 (공용)</span>
                  <span style={{ fontWeight: 700 }}>{fmt(d.cost.utility)}원</span>
                </div>
              )}
              {d.cost.cleaning > 0 && (
                <div style={styles.detailRow}>
                  <span>청소비</span>
                  <span style={{ fontWeight: 700 }}>{fmt(d.cost.cleaning)}원</span>
                </div>
              )}
              <div style={{ ...styles.detailRow, fontWeight: 800, borderTop: '1px solid #E8ECF0', paddingTop: 8, marginTop: 4, color: '#F59E0B' }}>
                <span>비용 소계</span>
                <span>{fmt(d.cost.total)}원</span>
              </div>
            </div>
          </div>
        </div>
        {/* Net profit bar */}
        <div style={{ marginTop: 16, padding: '16px 0', borderTop: '1px solid #E8ECF0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>순이익</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: profitColor }}>{fmt(d.netProfit)}원</span>
          </div>
          <div style={{ background: '#F1F5F9', borderRadius: 6, height: 24, overflow: 'hidden', position: 'relative' }}>
            {d.revenue.total > 0 && (
              <div style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, (d.netProfit / d.revenue.total) * 100))}%`,
                background: profitColor,
                borderRadius: 6,
                transition: 'width 0.3s ease',
              }} />
            )}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, textAlign: 'right' }}>
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
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table} cellSpacing={0}>
          <thead>
            <tr>
              <th style={styles.th}>순위</th>
              <th style={styles.th}>건물</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>매출</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>비용</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>순이익</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>수익률</th>
              {!isMobile && <th style={{ ...styles.th, width: 120 }}>이익 바</th>}
            </tr>
          </thead>
          <tbody>
            {normalItems.map((b, i) => {
              const isBottom20 = b.profitRate <= bottom20Threshold && !b.needsReview;
              const profitColor = b.netProfit >= 0 ? '#10B981' : '#EF4444';
              const barW = maxProfit > 0 ? (Math.abs(b.netProfit) / maxProfit) * 100 : 0;

              return (
                <tr
                  key={b.name}
                  style={{
                    ...styles.rowClickable,
                    background: selectedBuilding === b.name ? '#EFF6FF' : (isBottom20 ? '#FFFBEB' : 'transparent'),
                  }}
                  onClick={() => setSelectedBuilding(b.name === selectedBuilding ? null : b.name)}
                  onMouseEnter={e => { if (selectedBuilding !== b.name) e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => {
                    if (selectedBuilding !== b.name) e.currentTarget.style.background = isBottom20 ? '#FFFBEB' : 'transparent';
                  }}
                >
                  <td style={styles.td}>{i + 1}</td>
                  <td style={{ ...styles.td, fontWeight: 700 }}>
                    {b.name}
                    {isBottom20 && <span style={{ ...styles.warningBadge, marginLeft: 6 }}>하위</span>}
                  </td>
                  <td style={styles.tdRight}>{fmt(b.revenue.total)}</td>
                  <td style={styles.tdRight}>{fmt(b.cost.total)}</td>
                  <td style={{ ...styles.tdRight, fontWeight: 700, color: profitColor }}>{fmt(b.netProfit)}</td>
                  <td style={{ ...styles.tdRight, color: profitColor }}>
                    {b.profitRate.toFixed(1)}%
                  </td>
                  {!isMobile && (
                    <td style={styles.td}>
                      <div style={styles.bar(barW, b.netProfit >= 0 ? '#10B981' : '#EF4444')} />
                    </td>
                  )}
                </tr>
              );
            })}
            {reviewItems.length > 0 && (
              <>
                <tr>
                  <td colSpan={isMobile ? 6 : 7} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#D97706', background: '#FEF3C7', borderBottom: '1px solid #E8ECF0' }}>
                    -- 재검토 필요 ({reviewItems.length}개 건물) --
                  </td>
                </tr>
                {reviewItems.map(b => (
                  <tr key={b.name} style={{ background: '#FFFBEB' }}>
                    <td style={styles.td}>-</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#D97706' }}>{b.name}</td>
                    <td style={styles.tdRight}>0</td>
                    <td style={styles.tdRight}>{fmt(b.cost.total)}</td>
                    <td style={{ ...styles.tdRight, color: '#EF4444', fontWeight: 700 }}>{fmt(b.netProfit)}</td>
                    <td style={{ ...styles.tdRight, color: '#D97706' }}>재검토 필요</td>
                    {!isMobile && <td style={styles.td} />}
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
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const [y, m] = selectedMonth.split('-').map(Number);
      const d = new Date(y, m - 1 - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const managedBuildings = allBuildings.length > 0 ? allBuildings : myBuildings.map(name => ({ name, fee: 0, fixedFee: 0, rooms: 0 }));
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
        const repairExp = bldgExp.filter(e => e.category === 'repair').reduce((s, e) => s + (e.amount || 0), 0);

        const rev = (bInfo.fee > 0 ? Math.round(totalRent * bInfo.fee) : 0)
          + (bInfo.fixedFee > 0 ? bInfo.fixedFee : 0)
          + tenants.length * UTILITY_MARGIN_PER_TENANT
          + Math.round(repairExp * REPAIR_MARGIN_RATE);

        const cost = payrollPerBuilding
          + Math.round(repairExp * 0.7)
          + bldgExp.filter(e => e.category === 'utility').reduce((s, e) => s + (e.amount || 0), 0)
          + bldgExp.filter(e => e.category === 'cleaning').reduce((s, e) => s + (e.amount || 0), 0);

        totalRev += rev;
        totalCst += cost;
      });

      return { month, revenue: totalRev, cost: totalCst, profit: totalRev - totalCst };
    });

    const maxVal = Math.max(...trendData.map(d => Math.max(d.revenue, d.cost, Math.abs(d.profit))), 1);

    return (
      <div style={{ background: '#fff', border: '1px solid #E8ECF0', borderRadius: 12, padding: isMobile ? 16 : 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>월별 추이 (최근 6개월)</div>
        <div style={{ display: 'flex', gap: isMobile ? 6 : 16, alignItems: 'flex-end', height: 200, borderBottom: '1px solid #E8ECF0', paddingBottom: 8, marginBottom: 8 }}>
          {trendData.map(d => {
            const revH = (d.revenue / maxVal) * 160;
            const costH = (d.cost / maxVal) * 160;
            const profH = (Math.abs(d.profit) / maxVal) * 160;
            return (
              <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 170 }}>
                  <div style={{ width: isMobile ? 8 : 16, height: Math.max(revH, 2), background: '#3B82F6', borderRadius: 3 }} title={`매출: ${fmt(d.revenue)}`} />
                  <div style={{ width: isMobile ? 8 : 16, height: Math.max(costH, 2), background: '#F59E0B', borderRadius: 3 }} title={`비용: ${fmt(d.cost)}`} />
                  <div style={{ width: isMobile ? 8 : 16, height: Math.max(profH, 2), background: d.profit >= 0 ? '#10B981' : '#EF4444', borderRadius: 3 }} title={`이익: ${fmt(d.profit)}`} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 6 : 16 }}>
          {trendData.map(d => (
            <div key={d.month} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#64748B' }}>
              {d.month.split('-')[1]}월
            </div>
          ))}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}>
          {[
            { color: '#3B82F6', label: '매출' },
            { color: '#F59E0B', label: '비용' },
            { color: '#10B981', label: '이익' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>수익 대시보드</div>
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
