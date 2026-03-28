// @ts-nocheck
import { useState, useMemo, useEffect } from 'react';
import { useIsMobile, fmt } from '../utils';
import { Card, SectionTitle } from '../components';

const ROLES = ["대표", "부장", "과장", "대리", "사원", "인턴", "파트타임", "외주"];

const defaultStaff = [
  { id: 1, name: "김대표", role: "대표", basePay: 5000000, bonus: 0, deduction: 0, note: "" },
  { id: 2, name: "박부장", role: "부장", basePay: 3500000, bonus: 0, deduction: 0, note: "" },
  { id: 3, name: "이과장", role: "과장", basePay: 3000000, bonus: 0, deduction: 0, note: "" },
];

export const PayrollPage = () => {
  const isMobile = useIsMobile();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [staffList, setStaffList] = useState(() => {
    try { const v = localStorage.getItem("hm_payrollStaff"); return v ? JSON.parse(v) : defaultStaff; } catch { return defaultStaff; }
  });
  const [payrollRecords, setPayrollRecords] = useState(() => {
    try { const v = localStorage.getItem("hm_payrollRecords"); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("사원");
  const [newBasePay, setNewBasePay] = useState("");
  const [editingId, setEditingId] = useState(null);

  // persist
  useEffect(() => { localStorage.setItem("hm_payrollStaff", JSON.stringify(staffList)); }, [staffList]);
  useEffect(() => { localStorage.setItem("hm_payrollRecords", JSON.stringify(payrollRecords)); }, [payrollRecords]);

  const [y, m] = selectedMonth.split("-").map(Number);
  const changeMonth = (delta) => {
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const monthLabel = `${y}년 ${m}월`;

  // 해당 월 급여 레코드
  const monthRecords = useMemo(() => {
    return payrollRecords.filter(r => r.month === selectedMonth);
  }, [payrollRecords, selectedMonth]);

  const getRecord = (staffId) => monthRecords.find(r => r.staffId === staffId);

  const upsertRecord = (staffId, patch) => {
    setPayrollRecords(prev => {
      const existing = prev.find(r => r.staffId === staffId && r.month === selectedMonth);
      if (existing) return prev.map(r => r.staffId === staffId && r.month === selectedMonth ? { ...r, ...patch } : r);
      const staff = staffList.find(s => s.id === staffId);
      return [...prev, { staffId, month: selectedMonth, basePay: staff?.basePay || 0, bonus: 0, deduction: 0, note: "", status: "대기", paidAt: null, ...patch }];
    });
  };

  const markPaid = (staffId) => {
    upsertRecord(staffId, { status: "지급완료", paidAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
  };

  const addStaff = () => {
    if (!newName.trim()) return;
    setStaffList(prev => [...prev, { id: Date.now(), name: newName.trim(), role: newRole, basePay: Number(newBasePay) || 0, bonus: 0, deduction: 0, note: "" }]);
    setNewName(""); setNewBasePay(""); setShowAddStaff(false);
  };

  const removeStaff = (id) => {
    setStaffList(prev => prev.filter(s => s.id !== id));
  };

  // 요약
  const totalBase = staffList.reduce((s, st) => s + (getRecord(st.id)?.basePay ?? st.basePay), 0);
  const totalBonus = monthRecords.reduce((s, r) => s + (r.bonus || 0), 0);
  const totalDeduction = monthRecords.reduce((s, r) => s + (r.deduction || 0), 0);
  const paidCount = monthRecords.filter(r => r.status === "지급완료").length;

  // 전월 복사
  const copyFromPrevMonth = () => {
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;
    const prevKey = `${prevY}-${String(prevM).padStart(2, '0')}`;
    const prevRecords = payrollRecords.filter(r => r.month === prevKey);
    if (prevRecords.length === 0) { alert("전월 데이터가 없습니다."); return; }
    setPayrollRecords(prev => {
      const existing = new Set(prev.filter(r => r.month === selectedMonth).map(r => r.staffId));
      const newRecords = prevRecords.filter(r => !existing.has(r.staffId)).map(r => ({ ...r, month: selectedMonth, status: "대기", paidAt: null }));
      return [...prev, ...newRecords];
    });
  };

  return (
    <div>
      <SectionTitle sub={`${monthLabel} 급여 관리`}>급여내역</SectionTitle>

      {/* 월 선택기 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "8px 16px", borderRadius: 10, border: "1px solid #E8ECF0" }}>
          <button onClick={() => changeMonth(-1)} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", color: "#5F6577", padding: "2px 6px" }}>◀</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1D23", minWidth: 110, textAlign: "center" }}>{monthLabel}</span>
          <button onClick={() => changeMonth(1)} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", color: "#5F6577", padding: "2px 6px" }}>▶</button>
        </div>
        <button onClick={copyFromPrevMonth}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E8ECF0", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#5F6577" }}>
          전월 복사
        </button>
        <button onClick={() => setShowAddStaff(!showAddStaff)}
          style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 8, border: "none", background: "#6366F1", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + 직원 추가
        </button>
      </div>

      {/* 요약 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <Card style={{ borderLeft: "4px solid #6366F1" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>총 기본급</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#6366F1" }}>{fmt(totalBase)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #10B981" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>총 수당/보너스</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#10B981" }}>{fmt(totalBonus)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #EF4444" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>총 공제</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#EF4444" }}>{fmt(totalDeduction)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #F59E0B" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>지급 현황</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#F59E0B" }}>{paidCount}/{staffList.length}명</div>
          <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 2 }}>실지급 {fmt(totalBase + totalBonus - totalDeduction)}원</div>
        </Card>
      </div>

      {/* 직원 추가 폼 */}
      {showAddStaff && (
        <Card style={{ marginBottom: 16, border: "2px solid #6366F1" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#6366F1", marginBottom: 12 }}>직원 추가</div>
          <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>이름</div>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="직원명"
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", width: 120 }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>직급</div>
              <select value={newRole} onChange={e => setNewRole(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>기본급</div>
              <input value={newBasePay} onChange={e => setNewBasePay(e.target.value)} type="number" placeholder="3,000,000"
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", width: 140, textAlign: "right" }} />
            </div>
            <button onClick={addStaff}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#6366F1", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>추가</button>
          </div>
        </Card>
      )}

      {/* 직원별 급여 카드 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {staffList.map(staff => {
          const rec = getRecord(staff.id);
          const basePay = rec?.basePay ?? staff.basePay;
          const bonus = rec?.bonus || 0;
          const deduction = rec?.deduction || 0;
          const net = basePay + bonus - deduction;
          const isPaid = rec?.status === "지급완료";
          const isEditing = editingId === staff.id;

          return (
            <Card key={staff.id}
              style={{ border: isPaid ? "1.5px solid #A7F3D0" : "1.5px solid #E8ECF0", opacity: isPaid ? 0.8 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: isPaid ? "#ECFDF5" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {isPaid ? "✓" : "👤"}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: isPaid ? "#6B7280" : "#1A1D23" }}>{staff.name}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#F3F4F6", color: "#5F6577", fontWeight: 600 }}>{staff.role}</span>
                      {isPaid && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#ECFDF5", color: "#059669", fontWeight: 700 }}>지급완료</span>}
                    </div>
                    {isPaid && rec.paidAt && <div style={{ fontSize: 10, color: "#059669", marginTop: 2 }}>{rec.paidAt}</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isPaid ? "#9CA3AF" : "#2563EB" }}>{fmt(net)}원</div>
                  <div style={{ fontSize: 10, color: "#8F95A3" }}>기본 {fmt(basePay)}{bonus > 0 ? ` + ${fmt(bonus)}` : ""}{deduction > 0 ? ` - ${fmt(deduction)}` : ""}</div>
                </div>
              </div>

              {/* 수정 모드 */}
              {isEditing && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E8ECF0", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>기본급</div>
                    <input value={basePay} onChange={e => upsertRecord(staff.id, { basePay: Number(e.target.value) || 0 })} type="number"
                      style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", textAlign: "right" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>수당/보너스</div>
                    <input value={bonus} onChange={e => upsertRecord(staff.id, { bonus: Number(e.target.value) || 0 })} type="number"
                      style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", textAlign: "right" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>공제</div>
                    <input value={deduction} onChange={e => upsertRecord(staff.id, { deduction: Number(e.target.value) || 0 })} type="number"
                      style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", textAlign: "right" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>비고</div>
                    <input value={rec?.note || ""} onChange={e => upsertRecord(staff.id, { note: e.target.value })} placeholder="비고"
                      style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit" }} />
                  </div>
                  <button onClick={() => setEditingId(null)}
                    style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#5F6577" }}>닫기</button>
                </div>
              )}

              {/* 액션 버튼 */}
              <div style={{ marginTop: 10, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button onClick={() => setEditingId(isEditing ? null : staff.id)}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#5F6577" }}>
                  {isEditing ? "닫기" : "수정"}
                </button>
                {!isPaid && (
                  <button onClick={() => markPaid(staff.id)}
                    style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    지급 완료
                  </button>
                )}
                {isPaid && (
                  <button onClick={() => upsertRecord(staff.id, { status: "대기", paidAt: null })}
                    style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #FECACA", background: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#DC2626" }}>
                    되돌리기
                  </button>
                )}
                <button onClick={() => { if (confirm(`${staff.name} 직원을 삭제하시겠습니까?`)) removeStaff(staff.id); }}
                  style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#DC2626" }}>
                  삭제
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {staffList.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#8F95A3" }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>💵</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>등록된 직원이 없습니다</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>상단의 "직원 추가" 버튼으로 직원을 등록하세요</div>
        </div>
      )}
    </div>
  );
};
