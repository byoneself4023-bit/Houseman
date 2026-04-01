import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { settlementMaster, buildingAccountMap } from '@/data';
import { useIsMobile, fmt } from '@/utils';
import { Card, SectionTitle } from '@/components';

const TYPE_LABELS: Record<string, string> = {
  "settlement": "건물주정산",
  "moveout": "퇴실정산",
  "manual": "수동입력",
};
const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "settlement": { bg: "var(--color-hm-blue-bg)", color: "var(--color-hm-blue-dark)", border: "#BFDBFE" },
  "moveout": { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  "manual": { bg: "#F3F4F6", color: "var(--color-hm-text-sub)", border: "var(--color-hm-input-border)" },
};
const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  "대기": { bg: "#FEF3C7", color: "#92400E", label: "송금 대기" },
  "완료": { bg: "var(--color-hm-success-bg)", color: "var(--color-hm-success)", label: "송금 완료" },
  "보류": { bg: "var(--color-hm-danger-bg)", color: "var(--color-hm-danger)", label: "보류" },
};

interface CashbookEntry {
  id: number;
  type: string;
  date: string;
  building: string;
  description: string;
  amount: number;
  direction: string;
  account: string;
  status: string;
  sentAt: string | null;
  round?: number;
  room?: string;
  accountHolder?: string;
}

interface CashBookPageProps {
  cashbookEntries?: CashbookEntry[];
  setCashbookEntries?: React.Dispatch<React.SetStateAction<CashbookEntry[]>>;
  buildingData?: Record<string, any>;
  isLoading?: boolean;
}

const inputCls = "w-full px-2.5 py-2 rounded-lg border border-hm-input-border text-xs font-[inherit] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors";

export const CashBookPage = ({ cashbookEntries = [], setCashbookEntries, buildingData = {}, isLoading }: CashBookPageProps) => {
  const isMobile = useIsMobile();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterType, setFilterType] = useState("전체");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formBuilding, setFormBuilding] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formAccount, setFormAccount] = useState("");
  const [formDirection, setFormDirection] = useState("출금");

  const [y, m] = selectedMonth.split("-").map(Number);
  const changeMonth = (delta: number) => {
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const monthLabel = `${y}년 ${m}월`;

  // 해당 월 필터
  const monthEntries = useMemo(() => {
    let filtered = cashbookEntries.filter(e => e.date && e.date.startsWith(selectedMonth));
    if (filterType !== "전체") filtered = filtered.filter(e => e.type === filterType);
    if (filterStatus !== "전체") filtered = filtered.filter(e => e.status === filterStatus);
    return filtered.sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id - a.id);
  }, [cashbookEntries, selectedMonth, filterType, filterStatus]);

  // 요약
  const summary = useMemo(() => {
    const all = cashbookEntries.filter(e => e.date && e.date.startsWith(selectedMonth));
    const pending = all.filter(e => e.status === "대기");
    const done = all.filter(e => e.status === "완료");
    const held = all.filter(e => e.status === "보류");
    return {
      totalCount: all.length,
      totalAmount: all.reduce((s, e) => s + (e.amount || 0), 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, e) => s + (e.amount || 0), 0),
      doneCount: done.length,
      doneAmount: done.reduce((s, e) => s + (e.amount || 0), 0),
      heldCount: held.length,
      heldAmount: held.reduce((s, e) => s + (e.amount || 0), 0),
    };
  }, [cashbookEntries, selectedMonth]);

  const updateEntry = (id: number, patch: Partial<CashbookEntry>) => {
    setCashbookEntries?.(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  const markSent = (id: number) => {
    updateEntry(id, { status: "완료", sentAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
  };

  const markHold = (id: number) => {
    updateEntry(id, { status: "보류" });
  };

  const markPending = (id: number) => {
    updateEntry(id, { status: "대기", sentAt: null });
  };

  const deleteEntry = (id: number) => {
    setCashbookEntries?.(prev => prev.filter(e => e.id !== id));
  };

  const handleAddManual = () => {
    if (!formDesc.trim() || !formAmount) return;
    setCashbookEntries?.(prev => [...prev, {
      id: Date.now(),
      type: "manual",
      date: new Date().toISOString().slice(0, 10),
      building: formBuilding || "—",
      description: formDesc.trim(),
      amount: Number(formAmount),
      direction: formDirection,
      account: formAccount || "—",
      status: "대기",
      sentAt: null,
    }]);
    setFormDesc(""); setFormAmount(""); setFormAccount(""); setFormBuilding(""); setShowAddForm(false);
  };

  // 날짜별 그룹핑
  const dateGroups = useMemo(() => {
    const groups = new Map<string, CashbookEntry[]>();
    monthEntries.forEach(entry => {
      const d = entry.date || "미정";
      if (!groups.has(d)) groups.set(d, []);
      groups.get(d)!.push(entry);
    });
    return [...groups.entries()];
  }, [monthEntries]);

  return (
    <div>
      <SectionTitle sub={`${monthLabel} 출납 내역`}>출납관리</SectionTitle>

      {/* 월 선택기 + 필터 */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-hm-border">
          <button onClick={() => changeMonth(-1)} className="border-none bg-transparent text-base cursor-pointer text-hm-text-sub px-1.5 py-0.5 hover:text-hm-text transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-base font-bold text-hm-text min-w-[110px] text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="border-none bg-transparent text-base cursor-pointer text-hm-text-sub px-1.5 py-0.5 hover:text-hm-text transition-colors"><ChevronRight size={16} /></button>
        </div>
        <div className="flex gap-1">
          {["전체", "settlement", "moveout", "manual"].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg border border-hm-border text-xs font-semibold cursor-pointer font-[inherit] transition-colors ${filterType === t ? "bg-[#1e40af] text-white border-[#1e40af]" : "bg-white text-hm-text-sub hover:bg-hm-bg-hover"}`}>
              {t === "전체" ? "전체" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {["전체", "대기", "완료", "보류"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg border border-hm-border text-xs font-semibold cursor-pointer font-[inherit] transition-colors ${filterStatus === s && s !== "전체" ? "text-white border-transparent" : filterStatus === s ? "bg-[#1e40af] text-white border-[#1e40af]" : "bg-white text-hm-text-sub hover:bg-hm-bg-hover"}`}
              style={filterStatus === s && s !== "전체" ? { background: STATUS_MAP[s]?.color || "#1e40af" } : undefined}>
              {s === "전체" ? "전체" : STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="ml-auto px-4 py-2 rounded-lg border-none bg-[#1e40af] text-white text-xs font-bold cursor-pointer font-[inherit] hover:bg-[#1e3a8a] transition-colors">
          + 수동 입력
        </button>
      </div>

      {/* 요약 카드 */}
      <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-4"} gap-3 mb-6`}>
        <Card style={{ borderLeft: "4px solid #6366F1" }}>
          <div className="text-xs font-semibold text-gray-500 mb-1">전체 건수</div>
          <div className="text-xl font-bold text-[#6366F1]">{summary.totalCount}건</div>
          <div className="text-xs text-hm-text-muted mt-0.5">{fmt(summary.totalAmount)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #F59E0B" }}>
          <div className="text-xs font-semibold text-gray-500 mb-1">송금 대기</div>
          <div className="text-xl font-bold text-[#F59E0B]">{summary.pendingCount}건</div>
          <div className="text-xs text-hm-text-muted mt-0.5">{fmt(summary.pendingAmount)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #10B981" }}>
          <div className="text-xs font-semibold text-gray-500 mb-1">송금 완료</div>
          <div className="text-xl font-bold text-[#10B981]">{summary.doneCount}건</div>
          <div className="text-xs text-hm-text-muted mt-0.5">{fmt(summary.doneAmount)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #EF4444" }}>
          <div className="text-xs font-semibold text-gray-500 mb-1">보류</div>
          <div className="text-xl font-bold text-[#EF4444]">{summary.heldCount}건</div>
          <div className="text-xs text-hm-text-muted mt-0.5">{fmt(summary.heldAmount)}원</div>
        </Card>
      </div>

      {/* 수동 입력 폼 */}
      {showAddForm && (
        <Card style={{ border: "2px solid #6366F1" }} className="mb-4">
          <div className="text-sm font-bold text-[#6366F1] mb-3">수동 출납 입력</div>
          <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]"} gap-2 items-end`}>
            <div>
              <div className="text-xs text-hm-text-muted mb-1">건물</div>
              <input value={formBuilding} onChange={e => setFormBuilding(e.target.value)} placeholder="건물명"
                className={inputCls} />
            </div>
            <div>
              <div className="text-xs text-hm-text-muted mb-1">내역</div>
              <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="송금 내역"
                className={inputCls} />
            </div>
            <div>
              <div className="text-xs text-hm-text-muted mb-1">금액</div>
              <input value={formAmount} onChange={e => setFormAmount(e.target.value)} type="number" placeholder="금액"
                className={`${inputCls} text-right`} />
            </div>
            <div>
              <div className="text-xs text-hm-text-muted mb-1">계좌</div>
              <input value={formAccount} onChange={e => setFormAccount(e.target.value)} placeholder="은행 계좌번호"
                className={inputCls} />
            </div>
            <div>
              <div className="text-xs text-hm-text-muted mb-1">구분</div>
              <select value={formDirection} onChange={e => setFormDirection(e.target.value)}
                className={`${inputCls} cursor-pointer`}>
                <option value="출금">출금 (송금)</option>
                <option value="입금">입금</option>
              </select>
            </div>
            <button onClick={handleAddManual}
              className="px-5 py-2 rounded-lg border-none bg-[#6366F1] text-white text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-[#4F46E5] transition-colors">추가</button>
          </div>
        </Card>
      )}

      {/* 날짜별 출납 내역 */}
      <Card>
      {dateGroups.length === 0 ? (
        <div className="text-center py-[60px] text-hm-text-muted">
          <div className="text-[40px] mb-3 opacity-30">📋</div>
          <div className="text-sm font-semibold">이번 달 출납 내역이 없습니다</div>
          <div className="text-xs mt-1">건물주 정산 또는 퇴실정산 완료 시 자동으로 추가됩니다</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {dateGroups.map(([date, entries]) => {
            const dateObj = new Date(date + "T00:00:00");
            const dow = ["일", "월", "화", "수", "목", "금", "토"][dateObj.getDay()];
            const dayTotal = entries.reduce((s, e) => s + (e.amount || 0), 0);
            const pendingCount = entries.filter(e => e.status === "대기").length;

            return (
              <div key={date}>
                {/* 날짜 헤더 */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-hm-text">{date.slice(5)}</span>
                    <span className="text-xs font-semibold text-hm-text-muted">({dow})</span>
                  </div>
                  <div className="flex-1 h-px bg-hm-border" />
                  <span className="text-xs font-bold text-gray-700">{fmt(dayTotal)}원</span>
                  {pendingCount > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-[#FEF3C7] text-[#92400E] font-bold">대기 {pendingCount}</span>
                  )}
                </div>

                {/* 내역 카드들 */}
                <div className="flex flex-col gap-1.5">
                  {entries.map(entry => {
                    const typeStyle = TYPE_COLORS[entry.type] || TYPE_COLORS.manual;
                    const statusStyle = STATUS_MAP[entry.status] || STATUS_MAP["대기"];
                    const isSent = entry.status === "완료";

                    return (
                      <div key={entry.id}
                        className="px-4 py-3.5 rounded-xl transition-all"
                        style={{
                          background: isSent ? "#FAFBFC" : "#fff",
                          border: `1.5px solid ${isSent ? "#D1D5DB" : typeStyle.border}`,
                          opacity: isSent ? 0.75 : 1,
                        }}>
                        {/* 상단: 유형 + 건물 + 상태 + 금액 */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2.5 py-[3px] rounded-md font-bold"
                              style={{ background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}` }}>
                              {TYPE_LABELS[entry.type] || entry.type}
                            </span>
                            <span className={`text-sm font-bold ${isSent ? "text-gray-400" : "text-hm-text"}`}>{entry.building}</span>
                            {entry.round && entry.round > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-[#8B5CF6] text-white font-bold">{entry.round}차</span>
                            )}
                            {entry.room && (
                              <span className="text-xs text-hm-text-sub font-semibold">{entry.room}호</span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${isSent ? "text-gray-400" : entry.direction === "입금" ? "text-hm-success" : "text-hm-blue-dark"}`}>
                              {entry.direction === "입금" ? "+" : ""}{fmt(entry.amount)}원
                            </div>
                          </div>
                        </div>

                        {/* 중단: 내역 + 계좌 */}
                        <div className="flex flex-wrap gap-4 text-xs text-hm-text-sub mb-2">
                          <span>{entry.description}</span>
                          {entry.account && entry.account !== "—" && (
                            <span className="flex items-center gap-1">
                              <span className="text-xs text-hm-text-muted">계좌</span>
                              <strong className="text-hm-text font-mono text-xs">{entry.account}</strong>
                            </span>
                          )}
                          {entry.accountHolder && (
                            <span className="text-xs text-gray-700">({entry.accountHolder})</span>
                          )}
                        </div>

                        {/* 하단: 상태 + 보냄 시각 + 액션 버튼 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-3 py-[3px] rounded-lg font-bold"
                            style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {statusStyle.label}
                          </span>
                          {isSent && entry.sentAt && (
                            <span className="text-xs text-hm-success font-semibold">
                              {entry.sentAt} 송금완료
                            </span>
                          )}
                          <div className="ml-auto flex gap-1">
                            {entry.status === "대기" && (
                              <>
                                <button onClick={() => markSent(entry.id)}
                                  className="px-4 py-[5px] rounded-md border-none bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xs font-bold cursor-pointer font-[inherit] hover:from-emerald-600 hover:to-emerald-700 transition-all">
                                  송금 완료
                                </button>
                                <button onClick={() => markHold(entry.id)}
                                  className="px-3 py-[5px] rounded-md border border-red-200 bg-white text-hm-danger text-xs font-semibold cursor-pointer font-[inherit] hover:bg-hm-danger-bg transition-colors">
                                  보류
                                </button>
                              </>
                            )}
                            {entry.status === "완료" && (
                              <button onClick={() => markPending(entry.id)}
                                className="px-3 py-[5px] rounded-md border border-hm-input-border bg-white text-hm-text-sub text-xs font-semibold cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
                                되돌리기
                              </button>
                            )}
                            {entry.status === "보류" && (
                              <button onClick={() => markPending(entry.id)}
                                className="px-3 py-[5px] rounded-md border border-blue-200 bg-hm-blue-bg text-hm-blue-dark text-xs font-semibold cursor-pointer font-[inherit] hover:bg-blue-100 transition-colors">
                                대기로 변경
                              </button>
                            )}
                            {entry.type === "manual" && (
                              <button onClick={() => deleteEntry(entry.id)}
                                className="px-2.5 py-[5px] rounded-md border border-red-200 bg-white text-hm-danger text-xs font-semibold cursor-pointer font-[inherit] hover:bg-hm-danger-bg transition-colors">
                                삭제
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </Card>
    </div>
  );
};
