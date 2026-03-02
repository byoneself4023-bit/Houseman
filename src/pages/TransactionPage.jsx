import { useState, useMemo } from 'react';
import { buildings } from '../data';
import { useIsMobile, fmt } from '../utils';
import { Card, SectionTitle, Table } from '../components';
import { inputStyle } from '../components/Field';

export const TransactionPage = ({ myBuildings = [], activeTenants = [], transactions, addDeposit, roomBalances }) => {
  const isMobile = useIsMobile();
  const [showForm, setShowForm] = useState(false);
  const [formBld, setFormBld] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState("계좌이체");
  const [formNote, setFormNote] = useState("");
  const [filterBld, setFilterBld] = useState("전체");
  const [done, setDone] = useState(false);

  const myTenants = useMemo(() => myBuildings.length > 0 ? activeTenants.filter(t => myBuildings.includes(t.building)) : activeTenants, [myBuildings, activeTenants]);
  const buildingNames = useMemo(() => ["전체", ...new Set(myTenants.map(t => t.building))], [myTenants]);
  const filtered = useMemo(() => filterBld === "전체" ? transactions : transactions.filter(tx => tx.building === filterBld), [filterBld, transactions]);
  const sortedTx = useMemo(() => [...filtered].sort((a, b) => b.id - a.id), [filtered]);
  const overdueRooms = useMemo(() => myTenants.filter(t => (roomBalances[`${t.building}_${t.room}`] || 0) > 0), [myTenants, roomBalances]);
  const roomsForBld = useMemo(() => formBld ? [...new Set(myTenants.filter(t => t.building === formBld).map(t => t.room))] : [], [formBld, myTenants]);

  const handleSubmit = () => {
    if (!formBld || !formRoom || !formAmount) return;
    const t = myTenants.find(t => t.building === formBld && t.room === formRoom);
    addDeposit(formBld, formRoom, t?.name || "", parseInt(formAmount.replace(/,/g, "")), formMethod, formNote);
    setDone(true);
    setTimeout(() => { setDone(false); setShowForm(false); setFormAmount(""); setFormNote(""); }, 1500);
  };

  return (
    <div>
      <SectionTitle sub={`총 ${transactions.length}건`}>🏦 입출금 관리</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <Card style={{ background: "#ECFDF5", border: "1px solid #BBF7D0" }}>
          <div style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600, marginBottom: 4 }}>이번달 입금</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>{fmt(transactions.filter(t => t.type === "입금").reduce((s, t) => s + t.amount, 0))}원</div>
        </Card>
        <Card style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <div style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600, marginBottom: 4 }}>총 미수금</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#DC2626" }}>{fmt(Object.values(roomBalances).reduce((s, v) => s + v, 0))}원</div>
        </Card>
        <Card style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <div style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600, marginBottom: 4 }}>미납 호실</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#3B82F6" }}>{overdueRooms.length}건</div>
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <select value={filterBld} onChange={e => setFilterBld(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
          {buildingNames.map(b => <option key={b}>{b}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: showForm ? "#DC2626" : "#059669", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {showForm ? "✕ 닫기" : "💵 입금 등록"}
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16, border: "2px solid #059669" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <span style={{ fontSize: 40 }}>✅</span>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", marginTop: 8 }}>입금 처리 완료</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: "#059669" }}>💵 입금 등록</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>건물</div>
                  <select value={formBld} onChange={e => { setFormBld(e.target.value); setFormRoom(""); }}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 12, fontFamily: "inherit" }}>
                    <option value="">선택</option>
                    {buildingNames.filter(b => b !== "전체").map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>호실</div>
                  <select value={formRoom} onChange={e => setFormRoom(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 12, fontFamily: "inherit" }}>
                    <option value="">선택</option>
                    {roomsForBld.map(r => {
                      const bal = roomBalances[`${formBld}_${r}`] || 0;
                      return <option key={r} value={r}>{r} {bal > 0 ? `(미납 ${fmt(bal)})` : ""}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>입금액</div>
                  <input value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="금액"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit", textAlign: "right", fontWeight: 700 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 10, alignItems: "end" }}>
                <div>
                  <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>입금방법</div>
                  <select value={formMethod} onChange={e => setFormMethod(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 12, fontFamily: "inherit" }}>
                    <option>계좌이체</option><option>카드</option><option>현금</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>비고</div>
                  <input value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="메모"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 12, fontFamily: "inherit" }} />
                </div>
                <button onClick={handleSubmit}
                  style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>등록</button>
              </div>
              {formBld && formRoom && (
                <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, background: "#F8FAFC", fontSize: 12, color: "#5F6577" }}>
                  현재 잔액: <strong style={{ color: (roomBalances[`${formBld}_${formRoom}`] || 0) > 0 ? "#DC2626" : "#059669" }}>{fmt(roomBalances[`${formBld}_${formRoom}`] || 0)}원</strong>
                  {formAmount && <> → 입금 후: <strong style={{ color: "#059669" }}>{fmt(Math.max(0, (roomBalances[`${formBld}_${formRoom}`] || 0) - parseInt(formAmount.replace(/,/g, "") || 0)))}원</strong></>}
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sortedTx.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "#B0B5C1", fontSize: 13 }}>입출금 내역이 없습니다</div>}
          {sortedTx.map((r, i) => (
            <Card key={i} style={{ padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: r.type === "입금" ? "#ECFDF5" : "#FEF2F2", color: r.type === "입금" ? "#059669" : "#DC2626" }}>{r.type}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: r.type === "입금" ? "#059669" : "#DC2626" }}>{r.type === "입금" ? "+" : "-"}{fmt(r.amount)}원</span>
              </div>
              <div style={{ fontSize: 11, color: "#5F6577" }}>{r.building} {r.room}호 · {r.date.slice(5)} · {r.method}</div>
              {r.note && <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 2 }}>{r.note}</div>}
            </Card>
          ))}
        </div>
      ) : (
      <Table
        columns={[
          { label: "일자", render: r => <span style={{ fontSize: 11 }}>{r.date.slice(5)}</span> },
          { label: "유형", render: r => <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: r.type === "입금" ? "#ECFDF5" : "#FEF2F2", color: r.type === "입금" ? "#059669" : "#DC2626" }}>{r.type}</span> },
          { label: "건물", render: r => <span style={{ fontWeight: 600, fontSize: 11 }}>{r.building}</span> },
          { label: "호실", render: r => r.room },
          { label: "입주자", render: r => <span style={{ fontWeight: 700, display: "inline-block", maxWidth: "5em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle" }}>{r.name}</span> },
          { label: "금액", align: "right", render: r => <span style={{ fontWeight: 800, color: r.type === "입금" ? "#059669" : "#DC2626" }}>{r.type === "입금" ? "+" : "-"}{fmt(r.amount)}원</span> },
          { label: "방법", render: r => <span style={{ fontSize: 10, color: "#8F95A3" }}>{r.method}</span> },
          { label: "잔액", align: "right", render: r => {
            const bal = roomBalances[`${r.building}_${r.room}`] || 0;
            return <span style={{ fontWeight: 700, fontSize: 11, color: bal > 0 ? "#DC2626" : "#059669" }}>{fmt(bal)}원</span>;
          }},
          { label: "비고", render: r => <span style={{ fontSize: 10, color: "#8F95A3" }}>{r.note}</span> },
        ]}
        data={sortedTx}
      />
      )}
    </div>
  );
};
