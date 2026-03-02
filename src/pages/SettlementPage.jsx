import React, { useState, useMemo } from 'react';
import { buildings } from '../data';
import { expenseCategories } from '../data';
import { useIsMobile, fmt } from '../utils';
import { Card, SectionTitle } from '../components';

export const SettlementPage = ({ myBuildings = [], activeTenants = [], transactions = [], settlementExpenses = [], setSettlementExpenses, buildingData = {} }) => {
  const isMobile = useIsMobile();

  // 월 선택
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 건물 필터
  const [selectedBuilding, setSelectedBuilding] = useState("전체");

  // 지출 등록 폼
  const [showForm, setShowForm] = useState(false);
  const [formBuilding, setFormBuilding] = useState("");
  const [formCategory, setFormCategory] = useState("repair");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");

  // 월 이동
  const changeMonth = (delta) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = (() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return `${y}년 ${m}월`;
  })();

  // 관리 건물 목록
  const buildingList = useMemo(() => {
    const names = [...new Set(activeTenants.map(t => t.building))];
    if (myBuildings.length > 0) return names.filter(n => myBuildings.includes(n));
    return names;
  }, [activeTenants, myBuildings]);

  // 표시할 건물 목록
  const displayBuildings = selectedBuilding === "전체" ? buildingList : [selectedBuilding];

  // 건물별 수입/지출 계산
  const buildingSettlements = useMemo(() => {
    return displayBuildings.map(bName => {
      // 해당 건물 임차인
      const bTenants = activeTenants.filter(t => t.building === bName);

      // 수입
      const rentIncome = bTenants.reduce((sum, t) => sum + (t.rent || 0), 0);
      const mgmtIncome = bTenants.reduce((sum, t) => sum + (t.mgmt || 0), 0);
      const totalIncome = rentIncome + mgmtIncome;

      // 지출 - 관리수수료 자동 계산
      const bInfo = buildings.find(b => b.name === bName);
      let mgmtFee = 0;
      if (bInfo) {
        if (bInfo.feeType === "pct" && bInfo.fee > 0) {
          mgmtFee = Math.round(rentIncome * bInfo.fee);
        } else if (bInfo.feeType === "fixed" && bInfo.fixedFee > 0) {
          mgmtFee = bInfo.fixedFee;
        }
      }

      // 수동 지출
      const manualExpenses = settlementExpenses.filter(e => e.building === bName && e.month === selectedMonth);

      // 카테고리별 지출 합계
      const expenseByCategory = {};
      expenseCategories.forEach(cat => {
        if (cat.id === "mgmtFee") {
          expenseByCategory[cat.id] = mgmtFee;
        } else {
          expenseByCategory[cat.id] = manualExpenses
            .filter(e => e.category === cat.id)
            .reduce((sum, e) => sum + e.amount, 0);
        }
      });

      const totalExpense = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);
      const settlement = totalIncome - totalExpense;

      return {
        building: bName,
        rentIncome,
        mgmtIncome,
        totalIncome,
        mgmtFee,
        manualExpenses,
        expenseByCategory,
        totalExpense,
        settlement,
        tenantCount: bTenants.length,
      };
    });
  }, [displayBuildings, activeTenants, settlementExpenses, selectedMonth]);

  // 전체 요약
  const totalSummary = useMemo(() => {
    return buildingSettlements.reduce((acc, b) => ({
      income: acc.income + b.totalIncome,
      expense: acc.expense + b.totalExpense,
      settlement: acc.settlement + b.settlement,
    }), { income: 0, expense: 0, settlement: 0 });
  }, [buildingSettlements]);

  // 지출 등록
  const handleAddExpense = () => {
    if (!formBuilding || !formDesc.trim() || !formAmount) return;
    const newExpense = {
      id: Date.now(),
      month: selectedMonth,
      building: formBuilding,
      category: formCategory,
      desc: formDesc.trim(),
      amount: Number(formAmount),
    };
    setSettlementExpenses(prev => [...prev, newExpense]);
    setFormDesc("");
    setFormAmount("");
  };

  // 지출 삭제
  const handleDeleteExpense = (id) => {
    setSettlementExpenses(prev => prev.filter(e => e.id !== id));
  };

  const manualCategories = expenseCategories.filter(c => c.type === "manual");

  return (
    <div>
      {/* 월 선택기 + 건물 필터 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "8px 16px", borderRadius: 10, border: "1px solid #E8ECF0" }}>
          <button onClick={() => changeMonth(-1)} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", color: "#5F6577", padding: "2px 6px" }}>◀</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1D23", minWidth: 110, textAlign: "center" }}>{monthLabel}</span>
          <button onClick={() => changeMonth(1)} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", color: "#5F6577", padding: "2px 6px" }}>▶</button>
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button
            onClick={() => setSelectedBuilding("전체")}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              background: selectedBuilding === "전체" ? "#2563EB" : "#fff",
              color: selectedBuilding === "전체" ? "#fff" : "#5F6577",
            }}
          >전체</button>
          {buildingList.map(b => (
            <button key={b}
              onClick={() => setSelectedBuilding(b)}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                background: selectedBuilding === b ? "#2563EB" : "#fff",
                color: selectedBuilding === b ? "#fff" : "#5F6577",
              }}
            >{b}</button>
          ))}
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8ECF0", borderLeft: "4px solid #10B981" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>총 수입</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#10B981" }}>{fmt(totalSummary.income)}원</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8ECF0", borderLeft: "4px solid #EF4444" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>총 지출</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#EF4444" }}>{fmt(totalSummary.expense)}원</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8ECF0", borderLeft: "4px solid #3B82F6" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>정산금액 (건물주 지급)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#3B82F6" }}>{fmt(totalSummary.settlement)}원</div>
        </div>
      </div>

      {/* 건물별 정산표 */}
      {buildingSettlements.map(bs => (
        <div key={bs.building} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8ECF0", marginBottom: 16, overflow: "hidden" }}>
          {/* 건물 헤더 */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8ECF0", background: "#F9FAFB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🏢</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1D23" }}>{bs.building}</span>
              <span style={{ fontSize: 11, color: "#8F95A3", fontWeight: 500 }}>({bs.tenantCount}세대)</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: bs.settlement >= 0 ? "#3B82F6" : "#EF4444" }}>
              정산: {fmt(bs.settlement)}원
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 0 }}>
            {/* 수입 */}
            <div style={{ padding: "16px 20px", borderRight: isMobile ? "none" : "1px solid #E8ECF0", borderBottom: isMobile ? "1px solid #E8ECF0" : "none" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#10B981", marginBottom: 12 }}>📈 수입</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>임대수입</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1D23" }}>{fmt(bs.rentIncome)}원</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>관리비수입</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1D23" }}>{fmt(bs.mgmtIncome)}원</span>
                </div>
                <div style={{ borderTop: "1px solid #E8ECF0", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>수입 합계</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#10B981" }}>{fmt(bs.totalIncome)}원</span>
                </div>
              </div>
            </div>

            {/* 지출 */}
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#EF4444", marginBottom: 12 }}>📉 지출</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {expenseCategories.map(cat => {
                  const amount = bs.expenseByCategory[cat.id] || 0;
                  if (amount === 0) return null;
                  return (
                    <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#374151" }}>
                        {cat.label}
                        {cat.type === "auto" && <span style={{ fontSize: 9, color: "#8F95A3", marginLeft: 4 }}>(자동)</span>}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1D23" }}>{fmt(amount)}원</span>
                    </div>
                  );
                })}
                <div style={{ borderTop: "1px solid #E8ECF0", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>지출 합계</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#EF4444" }}>{fmt(bs.totalExpense)}원</span>
                </div>
              </div>
            </div>
          </div>

          {/* 지출 상세 내역 */}
          {bs.manualExpenses.length > 0 && (
            <div style={{ borderTop: "1px solid #E8ECF0", padding: "12px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#8F95A3", marginBottom: 8 }}>지출 상세 내역</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {bs.manualExpenses.map(exp => {
                  const catLabel = expenseCategories.find(c => c.id === exp.category)?.label || exp.category;
                  return (
                    <div key={exp.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: "#F9FAFB", fontSize: 12 }}>
                      <span style={{ padding: "2px 6px", borderRadius: 4, background: "#EFF6FF", color: "#2563EB", fontWeight: 600, fontSize: 10 }}>{catLabel}</span>
                      <span style={{ flex: 1, color: "#374151" }}>{exp.desc}</span>
                      <span style={{ fontWeight: 600, color: "#1A1D23" }}>{fmt(exp.amount)}원</span>
                      <button onClick={() => handleDeleteExpense(exp.id)}
                        style={{ border: "none", background: "#FEE2E2", color: "#DC2626", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        삭제
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* 지출 등록 */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8ECF0", overflow: "hidden" }}>
        <div
          onClick={() => setShowForm(!showForm)}
          style={{ padding: "14px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F9FAFB" }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1D23" }}>➕ 지출 등록</span>
          <span style={{ fontSize: 12, color: "#8F95A3" }}>{showForm ? "▲ 접기" : "▼ 펼치기"}</span>
        </div>

        {showForm && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid #E8ECF0" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 2fr 1fr auto", gap: 10, alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#5F6577", marginBottom: 4 }}>건물</div>
                <select value={formBuilding} onChange={e => setFormBuilding(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }}>
                  <option value="">선택</option>
                  {buildingList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#5F6577", marginBottom: 4 }}>항목</div>
                <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }}>
                  {manualCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#5F6577", marginBottom: 4 }}>내용</div>
                <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="지출 내용 입력"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#5F6577", marginBottom: 4 }}>금액</div>
                <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} />
              </div>
              <button onClick={handleAddExpense}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  background: formBuilding && formDesc.trim() && formAmount ? "#2563EB" : "#D1D5DB",
                  color: "#fff", whiteSpace: "nowrap",
                }}>
                등록
              </button>
            </div>
          </div>
        )}
      </div>

      {buildingSettlements.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#8F95A3", fontSize: 14 }}>
          해당 월에 정산할 건물이 없습니다.
        </div>
      )}
    </div>
  );
};
