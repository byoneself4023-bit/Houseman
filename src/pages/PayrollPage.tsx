import React, { useState, useMemo } from 'react';
import { useIsMobile, fmt } from '@/utils';
import { Card, SectionTitle } from '@/components';

const ROLES = ["대표", "부장", "과장", "대리", "사원", "인턴", "파트타임", "외주"];

interface PayrollStaff {
  id: number;
  name: string;
  role: string;
  basePay: number;
  bonus: number;
  deduction: number;
  note: string;
}

interface PayrollRecord {
  staffId: number;
  month: string;
  basePay: number;
  bonus: number;
  deduction: number;
  note: string;
  status: string;
  paidAt: string | null;
}

const defaultStaff: PayrollStaff[] = [
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
  const [staffList, setStaffList] = useState<PayrollStaff[]>(() => {
    try { const v = localStorage.getItem("hm_payrollStaff"); return v ? JSON.parse(v) : defaultStaff; } catch { return defaultStaff; }
  });
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    try { const v = localStorage.getItem("hm_payrollRecords"); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("사원");
  const [newBasePay, setNewBasePay] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // persist
  React.useEffect(() => { localStorage.setItem("hm_payrollStaff", JSON.stringify(staffList)); }, [staffList]);
  React.useEffect(() => { localStorage.setItem("hm_payrollRecords", JSON.stringify(payrollRecords)); }, [payrollRecords]);

  const [y, m] = selectedMonth.split("-").map(Number);
  const changeMonth = (delta: number) => {
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const monthLabel = `${y}년 ${m}월`;

  const monthRecords = useMemo(() => {
    return payrollRecords.filter(r => r.month === selectedMonth);
  }, [payrollRecords, selectedMonth]);

  const getRecord = (staffId: number) => monthRecords.find(r => r.staffId === staffId);

  const upsertRecord = (staffId: number, patch: Partial<PayrollRecord>) => {
    setPayrollRecords(prev => {
      const existing = prev.find(r => r.staffId === staffId && r.month === selectedMonth);
      if (existing) return prev.map(r => r.staffId === staffId && r.month === selectedMonth ? { ...r, ...patch } : r);
      const staff = staffList.find(s => s.id === staffId);
      return [...prev, { staffId, month: selectedMonth, basePay: staff?.basePay || 0, bonus: 0, deduction: 0, note: "", status: "대기", paidAt: null, ...patch }];
    });
  };

  const markPaid = (staffId: number) => {
    upsertRecord(staffId, { status: "지급완료", paidAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
  };

  const addStaff = () => {
    if (!newName.trim()) return;
    setStaffList(prev => [...prev, { id: Date.now(), name: newName.trim(), role: newRole, basePay: Number(newBasePay) || 0, bonus: 0, deduction: 0, note: "" }]);
    setNewName(""); setNewBasePay(""); setShowAddStaff(false);
  };

  const removeStaff = (id: number) => {
    setStaffList(prev => prev.filter(s => s.id !== id));
  };

  // 요약
  const totalBase = staffList.reduce((s, st) => s + (getRecord(st.id)?.basePay ?? st.basePay), 0);
  const totalBonus = monthRecords.reduce((s, r) => s + (r.bonus || 0), 0);
  const totalDeduction = monthRecords.reduce((s, r) => s + (r.deduction || 0), 0);
  const paidCount = monthRecords.filter(r => r.status === "지급완료").length;

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

  const summaryCards = [
    { label: "총 기본급", value: `${fmt(totalBase)}원`, color: "#6366F1" },
    { label: "총 수당/보너스", value: `${fmt(totalBonus)}원`, color: "#10B981" },
    { label: "총 공제", value: `${fmt(totalDeduction)}원`, color: "#EF4444" },
    { label: "지급 현황", value: `${paidCount}/${staffList.length}명`, color: "#F59E0B", sub: `실지급 ${fmt(totalBase + totalBonus - totalDeduction)}원` },
  ];

  return (
    <div>
      <SectionTitle sub={`${monthLabel} 급여 관리`}>급여내역</SectionTitle>

      {/* 월 선택기 */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-[10px] border border-[#E8ECF0]">
          <button onClick={() => changeMonth(-1)} className="border-none bg-transparent text-base cursor-pointer text-[#5F6577] px-1.5 py-0.5">◀</button>
          <span className="text-[15px] font-bold text-[#1A1D23] min-w-[110px] text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="border-none bg-transparent text-base cursor-pointer text-[#5F6577] px-1.5 py-0.5">▶</button>
        </div>
        <button onClick={copyFromPrevMonth}
          className="px-4 py-2 rounded-lg border border-[#E8ECF0] bg-white text-xs font-semibold cursor-pointer text-[#5F6577]">
          전월 복사
        </button>
        <button onClick={() => setShowAddStaff(!showAddStaff)}
          className="ml-auto px-4 py-2 rounded-lg border-none bg-indigo-500 text-white text-xs font-bold cursor-pointer">
          + 직원 추가
        </button>
      </div>

      {/* 요약 */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-3 mb-6`}>
        {summaryCards.map((c, i) => (
          <Card key={i} style={{ borderLeft: `4px solid ${c.color}` }}>
            <div className="text-[11px] font-semibold text-gray-500 mb-1">{c.label}</div>
            <div className="text-lg font-extrabold" style={{ color: c.color }}>{c.value}</div>
            {c.sub && <div className="text-[10px] text-[#8F95A3] mt-0.5">{c.sub}</div>}
          </Card>
        ))}
      </div>

      {/* 직원 추가 폼 */}
      {showAddStaff && (
        <Card className="mb-4 border-2 border-indigo-500">
          <div className="text-[13px] font-extrabold text-indigo-500 mb-3">직원 추가</div>
          <div className="flex gap-2 items-end flex-wrap">
            <div>
              <div className="text-[10px] text-[#8F95A3] mb-0.5">이름</div>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="직원명"
                className="px-2.5 py-2 rounded-lg border border-[#E0E3E9] text-xs w-[120px]" />
            </div>
            <div>
              <div className="text-[10px] text-[#8F95A3] mb-0.5">직급</div>
              <select value={newRole} onChange={e => setNewRole(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-[#E0E3E9] text-xs cursor-pointer">
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] text-[#8F95A3] mb-0.5">기본급</div>
              <input value={newBasePay} onChange={e => setNewBasePay(e.target.value)} type="number" placeholder="3,000,000"
                className="px-2.5 py-2 rounded-lg border border-[#E0E3E9] text-xs w-[140px] text-right" />
            </div>
            <button onClick={addStaff}
              className="px-5 py-2 rounded-lg border-none bg-indigo-500 text-white text-xs font-bold cursor-pointer">추가</button>
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
            <Card key={staff.id} className={`${isPaid ? 'border-[1.5px] border-green-200 opacity-80' : 'border-[1.5px] border-[#E8ECF0]'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${isPaid ? 'bg-green-50' : 'bg-blue-50'}`}>
                    {isPaid ? "✓" : "👤"}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[15px] font-extrabold ${isPaid ? 'text-gray-500' : 'text-[#1A1D23]'}`}>{staff.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-[#5F6577] font-semibold">{staff.role}</span>
                      {isPaid && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-emerald-600 font-bold">지급완료</span>}
                    </div>
                    {isPaid && rec?.paidAt && <div className="text-[10px] text-emerald-600 mt-0.5">{rec.paidAt}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-extrabold ${isPaid ? 'text-gray-400' : 'text-blue-600'}`}>{fmt(net)}원</div>
                  <div className="text-[10px] text-[#8F95A3]">기본 {fmt(basePay)}{bonus > 0 ? ` + ${fmt(bonus)}` : ""}{deduction > 0 ? ` - ${fmt(deduction)}` : ""}</div>
                </div>
              </div>

              {/* 수정 모드 */}
              {isEditing && (
                <div className={`mt-3 pt-3 border-t border-[#E8ECF0] grid ${isMobile ? 'grid-cols-2' : 'grid-cols-[1fr_1fr_1fr_1fr_auto]'} gap-2 items-end`}>
                  <div>
                    <div className="text-[10px] text-[#8F95A3] mb-0.5">기본급</div>
                    <input value={basePay} onChange={e => upsertRecord(staff.id, { basePay: Number(e.target.value) || 0 })} type="number"
                      className="w-full px-2 py-1.5 rounded-md border border-[#E0E3E9] text-xs text-right" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8F95A3] mb-0.5">수당/보너스</div>
                    <input value={bonus} onChange={e => upsertRecord(staff.id, { bonus: Number(e.target.value) || 0 })} type="number"
                      className="w-full px-2 py-1.5 rounded-md border border-[#E0E3E9] text-xs text-right" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8F95A3] mb-0.5">공제</div>
                    <input value={deduction} onChange={e => upsertRecord(staff.id, { deduction: Number(e.target.value) || 0 })} type="number"
                      className="w-full px-2 py-1.5 rounded-md border border-[#E0E3E9] text-xs text-right" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8F95A3] mb-0.5">비고</div>
                    <input value={rec?.note || ""} onChange={e => upsertRecord(staff.id, { note: e.target.value })} placeholder="비고"
                      className="w-full px-2 py-1.5 rounded-md border border-[#E0E3E9] text-xs" />
                  </div>
                  <button onClick={() => setEditingId(null)}
                    className="px-3.5 py-1.5 rounded-md border border-[#E0E3E9] bg-white text-[11px] font-semibold cursor-pointer text-[#5F6577]">닫기</button>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="mt-2.5 flex gap-1.5 justify-end">
                <button onClick={() => setEditingId(isEditing ? null : staff.id)}
                  className="px-3 py-1 rounded-md border border-[#E0E3E9] bg-white text-[11px] font-semibold cursor-pointer text-[#5F6577]">
                  {isEditing ? "닫기" : "수정"}
                </button>
                {!isPaid && (
                  <button onClick={() => markPaid(staff.id)}
                    className="px-3.5 py-1 rounded-md border-none text-white text-[11px] font-bold cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                    지급 완료
                  </button>
                )}
                {isPaid && (
                  <button onClick={() => upsertRecord(staff.id, { status: "대기", paidAt: null })}
                    className="px-3 py-1 rounded-md border border-red-200 bg-white text-[11px] font-semibold cursor-pointer text-red-600">
                    되돌리기
                  </button>
                )}
                <button onClick={() => { if (confirm(`${staff.name} 직원을 삭제하시겠습니까?`)) removeStaff(staff.id); }}
                  className="px-2.5 py-1 rounded-md border border-red-200 bg-white text-[11px] font-semibold cursor-pointer text-red-600">
                  삭제
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {staffList.length === 0 && (
        <div className="text-center py-16 text-[#8F95A3]">
          <div className="text-[40px] mb-3 opacity-30">💵</div>
          <div className="text-sm font-semibold">등록된 직원이 없습니다</div>
          <div className="text-xs mt-1">상단의 "직원 추가" 버튼으로 직원을 등록하세요</div>
        </div>
      )}
    </div>
  );
};
