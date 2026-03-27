import React, { useState, useMemo } from 'react';
import { settlementMaster, buildingAccountMap } from '@/data';
import { useIsMobile, fmt } from '@/utils';
import { Card, SectionTitle } from '@/components';

const TYPE_LABELS: Record<string, string> = {
  "settlement": "건물주정산",
  "moveout": "퇴실정산",
  "manual": "수동입력",
};
const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "settlement": { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  "moveout": { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  "manual": { bg: "#F3F4F6", color: "#5F6577", border: "#E0E3E9" },
};
const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  "대기": { bg: "#FEF3C7", color: "#92400E", label: "송금 대기" },
  "완료": { bg: "#ECFDF5", color: "#059669", label: "송금 완료" },
  "보류": { bg: "#FEF2F2", color: "#DC2626", label: "보류" },
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "8px 16px", borderRadius: 10, border: "1px solid #E8ECF0" }}>
          <button onClick={() => changeMonth(-1)} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", color: "#5F6577", padding: "2px 6px" }}>◀</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1D23", minWidth: 110, textAlign: "center" }}>{monthLabel}</span>
          <button onClick={() => changeMonth(1)} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", color: "#5F6577", padding: "2px 6px" }}>▶</button>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["전체", "settlement", "moveout", "manual"].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: filterType === t ? "#1e40af" : "#fff", color: filterType === t ? "#fff" : "#5F6577" }}>
              {t === "전체" ? "전체" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["전체", "대기", "완료", "보류"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: filterStatus === s ? (STATUS_MAP[s]?.color || "#1e40af") : "#fff", color: filterStatus === s ? "#fff" : "#5F6577" }}>
              {s === "전체" ? "전체" : STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 8, border: "none", background: "#1e40af", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + 수동 입력
        </button>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <Card style={{ borderLeft: "4px solid #6366F1" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>전체 건수</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#6366F1" }}>{summary.totalCount}건</div>
          <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>{fmt(summary.totalAmount)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #F59E0B" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>송금 대기</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F59E0B" }}>{summary.pendingCount}건</div>
          <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>{fmt(summary.pendingAmount)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #10B981" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>송금 완료</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#10B981" }}>{summary.doneCount}건</div>
          <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>{fmt(summary.doneAmount)}원</div>
        </Card>
        <Card style={{ borderLeft: "4px solid #EF4444" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>보류</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#EF4444" }}>{summary.heldCount}건</div>
          <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>{fmt(summary.heldAmount)}원</div>
        </Card>
      </div>

      {/* 수동 입력 폼 */}
      {showAddForm && (
        <Card style={{ marginBottom: 16, border: "2px solid #6366F1" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#6366F1", marginBottom: 12 }}>수동 출납 입력</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
            <div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>건물</div>
              <input value={formBuilding} onChange={e => setFormBuilding(e.target.value)} placeholder="건물명"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>내역</div>
              <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="송금 내역"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>금액</div>
              <input value={formAmount} onChange={e => setFormAmount(e.target.value)} type="number" placeholder="금액"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", textAlign: "right" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>계좌</div>
              <input value={formAccount} onChange={e => setFormAccount(e.target.value)} placeholder="은행 계좌번호"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 2 }}>구분</div>
              <select value={formDirection} onChange={e => setFormDirection(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
                <option value="출금">출금 (송금)</option>
                <option value="입금">입금</option>
              </select>
            </div>
            <button onClick={handleAddManual}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#6366F1", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>추가</button>
          </div>
        </Card>
      )}

      {/* 날짜별 출납 내역 */}
      {dateGroups.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#8F95A3" }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>이번 달 출납 내역이 없습니다</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>건물주 정산 또는 퇴실정산 완료 시 자동으로 추가됩니다</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {dateGroups.map(([date, entries]) => {
            const dateObj = new Date(date + "T00:00:00");
            const dow = ["일", "월", "화", "수", "목", "금", "토"][dateObj.getDay()];
            const dayTotal = entries.reduce((s, e) => s + (e.amount || 0), 0);
            const pendingCount = entries.filter(e => e.status === "대기").length;

            return (
              <div key={date}>
                {/* 날짜 헤더 */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>{date.slice(5)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#8F95A3" }}>({dow})</span>
                  </div>
                  <div style={{ flex: 1, height: 1, background: "#E8ECF0" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{fmt(dayTotal)}원</span>
                  {pendingCount > 0 && (
                    <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 10, background: "#FEF3C7", color: "#92400E", fontWeight: 700 }}>대기 {pendingCount}</span>
                  )}
                </div>

                {/* 내역 카드들 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {entries.map(entry => {
                    const typeStyle = TYPE_COLORS[entry.type] || TYPE_COLORS.manual;
                    const statusStyle = STATUS_MAP[entry.status] || STATUS_MAP["대기"];
                    const isSent = entry.status === "완료";

                    return (
                      <div key={entry.id}
                        style={{
                          padding: "14px 16px", borderRadius: 12,
                          background: isSent ? "#FAFBFC" : "#fff",
                          border: `1.5px solid ${isSent ? "#D1D5DB" : typeStyle.border}`,
                          opacity: isSent ? 0.75 : 1,
                          transition: "all 0.15s",
                        }}>
                        {/* 상단: 유형 + 건물 + 상태 + 금액 */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: typeStyle.bg, color: typeStyle.color, fontWeight: 700, border: `1px solid ${typeStyle.border}` }}>
                              {TYPE_LABELS[entry.type] || entry.type}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: isSent ? "#9CA3AF" : "#1A1D23" }}>{entry.building}</span>
                            {entry.round && entry.round > 0 && (
                              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#8B5CF6", color: "#fff", fontWeight: 700 }}>{entry.round}차</span>
                            )}
                            {entry.room && (
                              <span style={{ fontSize: 11, color: "#5F6577", fontWeight: 600 }}>{entry.room}호</span>
                            )}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: isSent ? "#9CA3AF" : entry.direction === "입금" ? "#059669" : "#2563EB" }}>
                              {entry.direction === "입금" ? "+" : ""}{fmt(entry.amount)}원
                            </div>
                          </div>
                        </div>

                        {/* 중단: 내역 + 계좌 */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: "#5F6577", marginBottom: 8 }}>
                          <span>{entry.description}</span>
                          {entry.account && entry.account !== "—" && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ fontSize: 10, color: "#8F95A3" }}>계좌</span>
                              <strong style={{ color: "#1A1D23", fontFamily: "monospace", fontSize: 11 }}>{entry.account}</strong>
                            </span>
                          )}
                          {entry.accountHolder && (
                            <span style={{ fontSize: 11, color: "#374151" }}>({entry.accountHolder})</span>
                          )}
                        </div>

                        {/* 하단: 상태 + 보냄 시각 + 액션 버튼 */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: 10, padding: "3px 12px", borderRadius: 10,
                            background: statusStyle.bg, color: statusStyle.color, fontWeight: 700,
                          }}>
                            {statusStyle.label}
                          </span>
                          {isSent && entry.sentAt && (
                            <span style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>
                              {entry.sentAt} 송금완료
                            </span>
                          )}
                          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                            {entry.status === "대기" && (
                              <>
                                <button onClick={() => markSent(entry.id)}
                                  style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                  송금 완료
                                </button>
                                <button onClick={() => markHold(entry.id)}
                                  style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #FECACA", background: "#fff", color: "#DC2626", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                  보류
                                </button>
                              </>
                            )}
                            {entry.status === "완료" && (
                              <button onClick={() => markPending(entry.id)}
                                style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", color: "#5F6577", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                되돌리기
                              </button>
                            )}
                            {entry.status === "보류" && (
                              <button onClick={() => markPending(entry.id)}
                                style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                대기로 변경
                              </button>
                            )}
                            {entry.type === "manual" && (
                              <button onClick={() => deleteEntry(entry.id)}
                                style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "#fff", color: "#DC2626", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
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
    </div>
  );
};
