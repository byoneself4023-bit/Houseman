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

const inputCls = "w-full px-2 py-1.5 rounded-md border border-hm-input-border text-xs font-[inherit] outline-none text-right focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors";

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
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-[10px] border border-hm-border">
          <button onClick={() => changeMonth(-1)} className="border-none bg-transparent text-base cursor-pointer text-hm-text-sub px-1.5 py-0.5 hover:text-hm-text transition-colors">◀</button>
          <span className="text-base font-bold text-hm-text min-w-[110px] text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="border-none bg-transparent text-base cursor-pointer text-hm-text-sub px-1.5 py-0.5 hover:text-hm-text transition-colors">▶</button>
        </div>
        <button onClick={copyFromPrevMonth}
          className="px-4 py-2 rounded-lg border border-hm-border bg-white text-xs font-semibold cursor-pointer font-[inherit] text-hm-text-sub hover:bg-hm-bg-hover transition-colors">
          전월 복사
        </button>
        <button onClick={() => setShowAddStaff(!showAddStaff)}
          className="ml-auto px-4 py-2 rounded-lg border-none bg-[#6366F1] text-white text-xs font-bold cursor-pointer font-[inherit] hover:bg-[#4F46E5] transition-colors">
          + 직원 추가
        </button>
      </div>

      {/* 요약 */}
      <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-4"} gap-3 mb-6`}>
        <Card style={{ borderLeft: "4px solid #6366F1" }}>
          <div className="text-xs font-semibold text-gray-500 mb-1">총 기본급</div>
          <div className="text-lg font-bold text-[#6366F1]">{fmt(totalBase)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #10B981" }}>
          <div className="text-xs font-semibold text-gray-500 mb-1">총 수당/보너스</div>
          <div className="text-lg font-bold text-[#10B981]">{fmt(totalBonus)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #EF4444" }}>
          <div className="text-xs font-semibold text-gray-500 mb-1">총 공제</div>
          <div className="text-lg font-bold text-[#EF4444]">{fmt(totalDeduction)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #F59E0B" }}>
          <div className="text-xs font-semibold text-gray-500 mb-1">지급 현황</div>
          <div className="text-lg font-bold text-[#F59E0B]">{paidCount}/{staffList.length}명</div>
          <div className="text-xs text-hm-text-muted mt-0.5">실지급 {fmt(totalBase + totalBonus - totalDeduction)}원</div>
        </Card>
      </div>

      {/* 직원 추가 폼 */}
      {showAddStaff && (
        <Card style={{ border: "2px solid #6366F1" }} className="mb-4">
          <div className="text-sm font-bold text-[#6366F1] mb-3">직원 추가</div>
          <div className="flex gap-2 items-end flex-wrap">
            <div>
              <div className="text-xs text-hm-text-muted mb-1">이름</div>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="직원명"
                className="px-2.5 py-2 rounded-lg border border-hm-input-border text-xs font-[inherit] w-[120px] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
            </div>
            <div>
              <div className="text-xs text-hm-text-muted mb-1">직급</div>
              <select value={newRole} onChange={e => setNewRole(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-hm-input-border text-xs font-[inherit] cursor-pointer outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors">
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-hm-text-muted mb-1">기본급</div>
              <input value={newBasePay} onChange={e => setNewBasePay(e.target.value)} type="number" placeholder="3,000,000"
                className="px-2.5 py-2 rounded-lg border border-hm-input-border text-xs font-[inherit] w-[140px] text-right outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
            </div>
            <button onClick={addStaff}
              className="px-5 py-2 rounded-lg border-none bg-[#6366F1] text-white text-xs font-bold cursor-pointer font-[inherit] hover:bg-[#4F46E5] transition-colors">추가</button>
          </div>
        </Card>
      )}

      {/* 직원별 급여 카드 */}
      <div className="flex flex-col gap-2">
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
              className={isPaid ? "opacity-80" : ""}
              style={{ border: isPaid ? "1.5px solid var(--color-hm-success-border)" : "1.5px solid var(--color-hm-border)" }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${isPaid ? "bg-hm-success-bg" : "bg-hm-blue-bg"}`}>
                    {isPaid ? "✓" : "👤"}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-base font-bold ${isPaid ? "text-gray-500" : "text-hm-text"}`}>{staff.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-hm-text-sub font-semibold">{staff.role}</span>
                      {isPaid && <span className="text-xs px-2 py-0.5 rounded-[10px] bg-hm-success-bg text-hm-success font-bold">지급완료</span>}
                    </div>
                    {isPaid && rec.paidAt && <div className="text-xs text-hm-success mt-0.5">{rec.paidAt}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${isPaid ? "text-gray-400" : "text-hm-blue-dark"}`}>{fmt(net)}원</div>
                  <div className="text-xs text-hm-text-muted">기본 {fmt(basePay)}{bonus > 0 ? ` + ${fmt(bonus)}` : ""}{deduction > 0 ? ` - ${fmt(deduction)}` : ""}</div>
                </div>
              </div>

              {/* 수정 모드 */}
              {isEditing && (
                <div className={`mt-3 pt-3 border-t border-hm-border grid ${isMobile ? "grid-cols-2" : "grid-cols-[1fr_1fr_1fr_1fr_auto]"} gap-2 items-end`}>
                  <div>
                    <div className="text-xs text-hm-text-muted mb-1">기본급</div>
                    <input value={basePay} onChange={e => upsertRecord(staff.id, { basePay: Number(e.target.value) || 0 })} type="number"
                      className={inputCls} />
                  </div>
                  <div>
                    <div className="text-xs text-hm-text-muted mb-1">수당/보너스</div>
                    <input value={bonus} onChange={e => upsertRecord(staff.id, { bonus: Number(e.target.value) || 0 })} type="number"
                      className={inputCls} />
                  </div>
                  <div>
                    <div className="text-xs text-hm-text-muted mb-1">공제</div>
                    <input value={deduction} onChange={e => upsertRecord(staff.id, { deduction: Number(e.target.value) || 0 })} type="number"
                      className={inputCls} />
                  </div>
                  <div>
                    <div className="text-xs text-hm-text-muted mb-1">비고</div>
                    <input value={rec?.note || ""} onChange={e => upsertRecord(staff.id, { note: e.target.value })} placeholder="비고"
                      className="w-full px-2 py-1.5 rounded-md border border-hm-input-border text-xs font-[inherit] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
                  </div>
                  <button onClick={() => setEditingId(null)}
                    className="px-4 py-1.5 rounded-md border border-hm-input-border bg-white text-xs font-semibold cursor-pointer font-[inherit] text-hm-text-sub hover:bg-hm-bg-hover transition-colors">닫기</button>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="mt-2.5 flex gap-1.5 justify-end">
                <button onClick={() => setEditingId(isEditing ? null : staff.id)}
                  className="px-3 py-[5px] rounded-md border border-hm-input-border bg-white text-xs font-semibold cursor-pointer font-[inherit] text-hm-text-sub hover:bg-hm-bg-hover transition-colors">
                  {isEditing ? "닫기" : "수정"}
                </button>
                {!isPaid && (
                  <button onClick={() => markPaid(staff.id)}
                    className="px-4 py-[5px] rounded-md border-none bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xs font-bold cursor-pointer font-[inherit] hover:from-emerald-600 hover:to-emerald-700 transition-all">
                    지급 완료
                  </button>
                )}
                {isPaid && (
                  <button onClick={() => upsertRecord(staff.id, { status: "대기", paidAt: null })}
                    className="px-3 py-[5px] rounded-md border border-red-200 bg-white text-xs font-semibold cursor-pointer font-[inherit] text-hm-danger hover:bg-hm-danger-bg transition-colors">
                    되돌리기
                  </button>
                )}
                <button onClick={() => { if (confirm(`${staff.name} 직원을 삭제하시겠습니까?`)) removeStaff(staff.id); }}
                  className="px-2.5 py-[5px] rounded-md border border-red-200 bg-white text-xs font-semibold cursor-pointer font-[inherit] text-hm-danger hover:bg-hm-danger-bg transition-colors">
                  삭제
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {staffList.length === 0 && (
        <div className="text-center py-[60px] text-hm-text-muted">
          <div className="text-[40px] mb-3 opacity-30">💵</div>
          <div className="text-sm font-semibold">등록된 직원이 없습니다</div>
          <div className="text-xs mt-1">상단의 "직원 추가" 버튼으로 직원을 등록하세요</div>
        </div>
      )}
    </div>
  );
};
