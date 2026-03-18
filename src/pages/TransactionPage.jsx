import { useState, useMemo } from 'react';
import { buildings } from '../data';
import { useIsMobile, fmt } from '../utils';
import { Card, SectionTitle, Table } from '../components';
import { inputStyle } from '../components/Field';
import { useLocalStorage } from '../utils/useLocalStorage';

// 뱅크다 시뮬레이션 데이터 (실제로는 a.bankda.com API에서 가져옴)
const sampleBankData = [
  { id: "B001", date: "2026-03-15", depositor: "한유진", amount: 1280000, bank: "국민", memo: "" },
  { id: "B002", date: "2026-03-15", depositor: "박성윤", amount: 780000, bank: "신한", memo: "" },
  { id: "B003", date: "2026-03-15", depositor: "김세아", amount: 780000, bank: "우리", memo: "" },
  { id: "B004", date: "2026-03-14", depositor: "윤슬기", amount: 720000, bank: "국민", memo: "" },
  { id: "B005", date: "2026-03-14", depositor: "김도경", amount: 1400000, bank: "하나", memo: "" },
  { id: "B006", date: "2026-03-14", depositor: "황현호", amount: 730000, bank: "신한", memo: "" },
  { id: "B007", date: "2026-03-13", depositor: "박유빈", amount: 1280000, bank: "국민", memo: "" },
  { id: "B008", date: "2026-03-13", depositor: "정은혜", amount: 680000, bank: "우리", memo: "" },
  { id: "B009", date: "2026-03-13", depositor: "홍윤미", amount: 710000, bank: "신한", memo: "" },
  { id: "B010", date: "2026-03-12", depositor: "김태오", amount: 1330000, bank: "하나", memo: "" },
  { id: "B011", date: "2026-03-12", depositor: "권영우", amount: 1300000, bank: "국민", memo: "" },
  { id: "B012", date: "2026-03-12", depositor: "박유림", amount: 780000, bank: "신한", memo: "" },
  // 이름이 약간 다른 케이스 (별명, 가족 대납 등)
  { id: "B013", date: "2026-03-11", depositor: "이지현A", amount: 710000, bank: "우리", memo: "" },
  { id: "B014", date: "2026-03-11", depositor: "신현식", amount: 1350000, bank: "국민", memo: "" },
  { id: "B015", date: "2026-03-11", depositor: "김소희", amount: 780000, bank: "하나", memo: "" },
  { id: "B016", date: "2026-03-10", depositor: "고영희", amount: 780000, bank: "신한", memo: "" },
  { id: "B017", date: "2026-03-10", depositor: "정현민", amount: 1280000, bank: "우리", memo: "" },
  { id: "B018", date: "2026-03-10", depositor: "박정미", amount: 1400000, bank: "국민", memo: "" },
  // 금액이 다른 케이스 (분납 등)
  { id: "B019", date: "2026-03-09", depositor: "주여울", amount: 400000, bank: "신한", memo: "" },
  { id: "B020", date: "2026-03-09", depositor: "송예준", amount: 500000, bank: "하나", memo: "" },
  { id: "B021", date: "2026-03-08", depositor: "이준우", amount: 700000, bank: "국민", memo: "" },
  // 이름만 비슷한 케이스
  { id: "B022", date: "2026-03-08", depositor: "김혜서(모)", amount: 830000, bank: "우리", memo: "" },
  { id: "B023", date: "2026-03-07", depositor: "차민철", amount: 1770000, bank: "신한", memo: "" },
  { id: "B024", date: "2026-03-07", depositor: "박현진", amount: 780000, bank: "국민", memo: "" },
  // 완전 매칭 안되는 케이스
  { id: "B025", date: "2026-03-06", depositor: "최영수", amount: 500000, bank: "하나", memo: "" },
  { id: "B026", date: "2026-03-06", depositor: "강미래", amount: 350000, bank: "국민", memo: "" },
];

/**
 * 자동 매칭 알고리즘
 * 100% 조건 (자동 처리):
 *   1) 임차인 이름 정확 일치 + 금액(월세+관리비) 정확 일치
 *   2) 이름 다르지만 금액이 1원 단위까지 일치하고, 해당 금액의 임차인이 딱 1명 → 이름 저장
 *   3) 회사 지정 입금자명(건물호실 조합이름)과 일치
 * 그 외 → 확률 표시, 수동 지정
 */
const calcMatch = (bankTx, allTenants, nameAliases, depositNames, prevTransactions) => {
  const dep = bankTx.depositor.trim();
  const amt = bankTx.amount;

  // === 100% 케이스 3: 회사 지정 입금자명 ===
  for (const t of allTenants) {
    const key = `${t.building}_${t.room}`;
    const designated = depositNames[key];
    if (designated && designated === dep) {
      return { score: 100, tenant: t, reason: "지정 입금자명 일치", saveName: false };
    }
  }

  // === 100% 케이스 1: 이름 정확 일치 + 금액 정확 일치 ===
  for (const t of allTenants) {
    const totalDue = t.rent + (t.mgmt || 0);
    if (dep === t.name && amt === totalDue) {
      return { score: 100, tenant: t, reason: "이름+금액 일치", saveName: false };
    }
  }

  // === 100% 케이스 1-b: 저장된 별명 일치 + 금액 정확 일치 ===
  for (const t of allTenants) {
    const key = `${t.building}_${t.room}`;
    const aliases = nameAliases[key] || [];
    const totalDue = t.rent + (t.mgmt || 0);
    if (aliases.includes(dep) && amt === totalDue) {
      return { score: 100, tenant: t, reason: "저장된 입금자명+금액 일치", saveName: false };
    }
  }

  // === 100% 케이스 2: 이름 다르지만 금액이 정확히 일치 & 해당 금액 임차인 1명 ===
  const amtMatches = allTenants.filter(t => t.rent + (t.mgmt || 0) === amt);
  if (amtMatches.length === 1) {
    return { score: 100, tenant: amtMatches[0], reason: "금액 유일 일치 (이름 저장)", saveName: true };
  }

  // === 확률 매칭 ===
  const candidates = allTenants.map(t => {
    let score = 0;
    let reasons = [];
    const totalDue = t.rent + (t.mgmt || 0);
    const key = `${t.building}_${t.room}`;
    const aliases = nameAliases[key] || [];

    // 이름 관련
    if (dep === t.name) { score += 40; reasons.push("이름 일치"); }
    else if (aliases.includes(dep)) { score += 35; reasons.push("저장된 별명"); }
    else if (dep.includes(t.name) || t.name.includes(dep)) { score += 25; reasons.push("이름 유사"); }
    else {
      // 이전 입금자명 일치
      const prevNames = prevTransactions.filter(tx => tx.building === t.building && tx.room === t.room).map(tx => tx.name);
      if (prevNames.includes(dep)) { score += 30; reasons.push("이전 입금자명"); }
    }

    // 금액 관련
    if (amt === totalDue) { score += 40; reasons.push("금액 일치"); }
    else if (amt === t.rent) { score += 20; reasons.push("월세 일치"); }

    return { tenant: t, score: Math.min(score, 95), reasons };
  }).filter(c => c.score > 0).sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    return { score: candidates[0].score, tenant: candidates[0].tenant, reason: candidates[0].reasons.join("+"), saveName: false, candidates };
  }

  return { score: 0, tenant: null, reason: "매칭 대상 없음", saveName: false, candidates: [] };
};

export const TransactionPage = ({ myBuildings = [], activeTenants = [], transactions, addDeposit, roomBalances }) => {
  const isMobile = useIsMobile();
  const [showForm, setShowForm] = useState(false);
  const [showDebtSection, setShowDebtSection] = useState(false);
  const [moveoutDebts, setMoveoutDebts] = useLocalStorage("hm_moveoutDebts", []);
  const [formBld, setFormBld] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState("계좌이체");
  const [formNote, setFormNote] = useState("");
  const [filterBld, setFilterBld] = useState("전체");
  const [done, setDone] = useState(false);
  const [showBankda, setShowBankda] = useState(false);
  const [matchedItems, setMatchedItems] = useLocalStorage("hm_bankdaMatched", {});
  const [nameAliases, setNameAliases] = useLocalStorage("hm_nameAliases", {});
  const [depositNames, setDepositNames] = useLocalStorage("hm_depositNames", {});
  const [manualAssign, setManualAssign] = useState(null);
  const [showDepositNames, setShowDepositNames] = useState(false);
  const [editDepKey, setEditDepKey] = useState("");
  const [editDepVal, setEditDepVal] = useState("");

  const myTenants = useMemo(() => myBuildings.length > 0 ? activeTenants.filter(t => myBuildings.includes(t.building)) : activeTenants, [myBuildings, activeTenants]);
  const buildingNames = useMemo(() => ["전체", ...new Set(myTenants.map(t => t.building))], [myTenants]);
  const filtered = useMemo(() => filterBld === "전체" ? transactions : transactions.filter(tx => tx.building === filterBld), [filterBld, transactions]);
  const sortedTx = useMemo(() => [...filtered].sort((a, b) => b.id - a.id), [filtered]);
  const overdueRooms = useMemo(() => myTenants.filter(t => (roomBalances[`${t.building}_${t.room}`] || 0) > 0), [myTenants, roomBalances]);
  const roomsForBld = useMemo(() => formBld ? [...new Set(myTenants.filter(t => t.building === formBld).map(t => t.room))] : [], [formBld, myTenants]);

  // 뱅크다 매칭 계산
  const bankMatches = useMemo(() => {
    return sampleBankData.filter(b => !matchedItems[b.id]).map(bankTx => {
      const result = calcMatch(bankTx, myTenants, nameAliases, depositNames, transactions);
      return { bankTx, ...result };
    });
  }, [myTenants, transactions, matchedItems, nameAliases, depositNames]);

  const auto100 = bankMatches.filter(m => m.score === 100);
  const manualNeeded = bankMatches.filter(m => m.score < 100);

  const handleMatch = (bankTx, tenant, saveName) => {
    addDeposit(tenant.building, tenant.room, tenant.name, bankTx.amount, "계좌이체", `뱅크다 매칭 (${bankTx.depositor})`);
    setMatchedItems(prev => ({ ...prev, [bankTx.id]: true }));
    // 이름이 다르면 별명 저장
    const dep = bankTx.depositor.trim();
    if (saveName || dep !== tenant.name) {
      const key = `${tenant.building}_${tenant.room}`;
      setNameAliases(prev => ({ ...prev, [key]: [...new Set([...(prev[key] || []), dep])] }));
    }
    setManualAssign(null);
  };

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

      {/* 안내 코멘트 */}
      <Card style={{ marginBottom: 16, padding: "14px 18px", background: "#F8FAFC", border: "1px solid #E8ECF0" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#1A1D23", marginBottom: 8 }}>a.bankda.com 연동 자동 입금 확인</div>
        <div style={{ fontSize: 11, color: "#5F6577", lineHeight: 1.8 }}>
          뱅크다(a.bankda.com)와 연결되어 입출금 내역을 자동으로 확인합니다.
        </div>
        <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 8, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", marginBottom: 6 }}>자동 확인 규칙 (100% 자동매칭)</div>
          <div style={{ fontSize: 11, color: "#1E40AF", lineHeight: 2 }}>
            <strong>1. 이름 + 금액 일치</strong> — 임차인 이름과 월세+관리비 금액이 정확히 일치하면 100% 자동 처리<br />
            <strong>2. 금액 유일 일치</strong> — 이름이 달라도 입금 금액이 1원 단위까지 정확히 일치하고, 해당 금액의 임차인이 1명뿐이면 100% 자동 처리 (입금자명 자동 저장)<br />
            <strong>3. 지정 입금자명</strong> — 회사가 건물+호실별로 지정한 입금자명과 일치하면 100% 자동 처리
          </div>
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: "#8F95A3", lineHeight: 1.6 }}>
          * 100%가 아닌 경우 확률(%)로 표시되며, 담당자가 직접 확인 후 승인하거나 수동으로 임차인을 지정할 수 있습니다.<br />
          * 한번 매칭된 입금자명은 자동 저장되어 다음부터 100% 자동매칭됩니다.
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
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
        <Card style={{ background: "#FDF4FF", border: "1px solid #E9D5FF", cursor: "pointer" }} onClick={() => setShowBankda(!showBankda)}>
          <div style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600, marginBottom: 4 }}>뱅크다 미매칭</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#7C3AED" }}>{bankMatches.length}건</div>
        </Card>
      </div>

      {/* 퇴실 미수금 섹션 */}
      {(() => {
        const myDebts = myBuildings.length > 0 ? moveoutDebts.filter(d => myBuildings.includes(d.building)) : moveoutDebts;
        const pendingDebts = myDebts.filter(d => d.status === "미수");
        const totalDebtAmt = pendingDebts.reduce((s, d) => s + d.amount, 0);
        if (myDebts.length === 0) return null;
        return (
          <>
            <Card style={{ marginBottom: 16, cursor: "pointer", border: totalDebtAmt > 0 ? "2px solid #DC2626" : "1.5px solid #E8ECF0", background: totalDebtAmt > 0 ? "#FEF2F2" : "#F8FAFC" }} onClick={() => setShowDebtSection(!showDebtSection)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🚪</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: totalDebtAmt > 0 ? "#DC2626" : "#1A1D23" }}>퇴실 미수금</div>
                    <div style={{ fontSize: 10, color: "#8F95A3" }}>퇴실 정산 후 미회수 잔액</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: totalDebtAmt > 0 ? "#DC2626" : "#059669" }}>{totalDebtAmt > 0 ? fmt(totalDebtAmt) + "원" : "없음"}</div>
                  <div style={{ fontSize: 10, color: "#8F95A3" }}>미수 {pendingDebts.length}건 / 전체 {myDebts.length}건</div>
                </div>
              </div>
            </Card>
            {showDebtSection && (
              <Card style={{ marginBottom: 16, border: "1.5px solid #FECACA", background: "#fff" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#DC2626", marginBottom: 12 }}>🚪 퇴실 미수금 내역</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {["전체", "미수", "회수완료", "포기"].map(s => {
                    const cnt = s === "전체" ? myDebts.length : myDebts.filter(d => d.status === s).length;
                    return (
                      <span key={s} style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                        background: s === "미수" ? "#FEF2F2" : s === "회수완료" ? "#ECFDF5" : s === "포기" ? "#F3F4F6" : "#EFF6FF",
                        color: s === "미수" ? "#DC2626" : s === "회수완료" ? "#059669" : s === "포기" ? "#8F95A3" : "#2563EB" }}>
                        {s} {cnt}
                      </span>
                    );
                  })}
                </div>
                {myDebts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#B0B5C1", fontSize: 13 }}>퇴실 미수금 내역이 없습니다</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {myDebts.map((d, i) => (
                      <div key={d.id || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8,
                        background: d.status === "미수" ? "#FEF2F2" : d.status === "회수완료" ? "#ECFDF5" : "#F8FAFC",
                        border: `1px solid ${d.status === "미수" ? "#FECACA" : d.status === "회수완료" ? "#BBF7D0" : "#E8ECF0"}` }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: "#1A1D23" }}>{d.building} {d.room}호</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#5F6577" }}>{d.name}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                              background: d.status === "미수" ? "#DC2626" : d.status === "회수완료" ? "#059669" : "#8F95A3",
                              color: "#fff" }}>{d.status}</span>
                          </div>
                          <div style={{ fontSize: 10, color: "#8F95A3" }}>퇴실일: {d.date}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: d.status === "미수" ? "#DC2626" : d.status === "회수완료" ? "#059669" : "#8F95A3" }}>{fmt(d.amount)}원</span>
                          {d.status === "미수" && (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={(e) => { e.stopPropagation(); setMoveoutDebts(prev => prev.map(x => x.id === d.id ? { ...x, status: "회수완료" } : x)); }}
                                style={{ fontSize: 9, fontWeight: 700, padding: "4px 8px", borderRadius: 5, border: "none", background: "#059669", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                                회수완료
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); if (confirm("정말 포기하시겠습니까?")) setMoveoutDebts(prev => prev.map(x => x.id === d.id ? { ...x, status: "포기" } : x)); }}
                                style={{ fontSize: 9, fontWeight: 700, padding: "4px 8px", borderRadius: 5, border: "1px solid #E0E3E9", background: "#fff", color: "#8F95A3", cursor: "pointer", fontFamily: "inherit" }}>
                                포기
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </>
        );
      })()}

      {/* 뱅크다 자동매칭 섹션 */}
      {showBankda && (
        <Card style={{ marginBottom: 16, border: "2px solid #7C3AED", background: "#FEFBFF" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🏦</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#7C3AED" }}>뱅크다 입금 매칭</div>
                <div style={{ fontSize: 10, color: "#8F95A3" }}>a.bankda.com 거래내역</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: "#ECFDF5", color: "#059669", fontWeight: 700 }}>100% {auto100.length}건</span>
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: "#FEF3C7", color: "#92400E", fontWeight: 700 }}>수동확인 {manualNeeded.length}건</span>
              <button onClick={() => setShowDepositNames(!showDepositNames)}
                style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid #E9D5FF", background: showDepositNames ? "#7C3AED" : "#F5F3FF", color: showDepositNames ? "#fff" : "#7C3AED", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                지정 입금자명
              </button>
            </div>
          </div>

          {/* 지정 입금자명 관리 */}
          {showDepositNames && (
            <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 10, background: "#F5F3FF", border: "1px solid #E9D5FF" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#7C3AED", marginBottom: 10 }}>지정 입금자명 관리</div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 10 }}>건물+호실별로 지정 입금자명을 등록하면 해당 이름으로 입금 시 100% 자동매칭됩니다.</div>
              {/* 등록된 목록 */}
              {Object.keys(depositNames).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {Object.entries(depositNames).map(([key, name]) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "#fff", border: "1px solid #E9D5FF", fontSize: 11 }}>
                      <span style={{ fontWeight: 700 }}>{key.replace("_", " ")}</span>
                      <span style={{ color: "#7C3AED", fontWeight: 600 }}>{name}</span>
                      <span onClick={() => setDepositNames(prev => { const n = { ...prev }; delete n[key]; return n; })}
                        style={{ color: "#DC2626", cursor: "pointer", fontWeight: 800, marginLeft: 4 }}>×</span>
                    </div>
                  ))}
                </div>
              )}
              {/* 저장된 별명 목록 */}
              {Object.keys(nameAliases).length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>자동 저장된 입금자명</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {Object.entries(nameAliases).map(([key, names]) => names.map((n, i) => (
                      <span key={`${key}_${i}`} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#ECFDF5", color: "#059669", fontWeight: 600 }}>
                        {key.replace("_", " ")} ← {n}
                      </span>
                    )))}
                  </div>
                </div>
              )}
              {/* 새로 등록 */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select value={editDepKey} onChange={e => setEditDepKey(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: 6, border: "1.5px solid #E0E3E9", fontSize: 11, fontFamily: "inherit" }}>
                  <option value="">건물+호실 선택</option>
                  {myTenants.map(t => <option key={`${t.building}_${t.room}`} value={`${t.building}_${t.room}`}>{t.building} {t.room} ({t.name})</option>)}
                </select>
                <input value={editDepVal} onChange={e => setEditDepVal(e.target.value)} placeholder="지정 입금자명"
                  style={{ padding: "6px 10px", borderRadius: 6, border: "1.5px solid #E0E3E9", fontSize: 11, fontFamily: "inherit", width: 120 }} />
                <button onClick={() => {
                  if (!editDepKey || !editDepVal) return;
                  setDepositNames(prev => ({ ...prev, [editDepKey]: editDepVal }));
                  setEditDepKey(""); setEditDepVal("");
                }}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#7C3AED", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>등록</button>
              </div>
            </div>
          )}

          {/* 100% 자동매칭 일괄 처리 */}
          {auto100.length > 0 && (
            <button onClick={() => auto100.forEach(m => handleMatch(m.bankTx, m.tenant, m.saveName))}
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>
              100% 매칭 {auto100.length}건 일괄 입금처리
            </button>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {bankMatches.map((m) => {
              const { bankTx, score, tenant, reason, saveName, candidates } = m;
              const isManual = manualAssign === bankTx.id;
              return (
                <div key={bankTx.id} style={{ padding: "12px 14px", borderRadius: 10, background: score === 100 ? "#F0FDF4" : score >= 50 ? "#FFFBEB" : "#FEF2F2", border: `1.5px solid ${score === 100 ? "#BBF7D0" : score >= 50 ? "#FDE68A" : "#FECACA"}` }}>
                  {/* 뱅크다 거래 정보 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#1A1D23" }}>{bankTx.depositor}</span>
                      <span style={{ fontSize: 10, color: "#8F95A3" }}>{bankTx.date.slice(5)} · {bankTx.bank}은행</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>{fmt(bankTx.amount)}원</span>
                  </div>

                  {/* 매칭 결과 */}
                  {tenant ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 6,
                          background: score === 100 ? "#059669" : score >= 50 ? "#F59E0B" : "#EF4444",
                          color: "#fff"
                        }}>
                          {score}%
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>
                          {tenant.building} {tenant.room}호 {tenant.name}
                        </span>
                        <span style={{ fontSize: 10, color: "#8F95A3" }}>({reason})</span>
                        {saveName && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#EFF6FF", color: "#2563EB", fontWeight: 600 }}>이름 자동저장</span>}
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => handleMatch(bankTx, tenant, saveName)}
                          style={{ fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 6, border: "none", background: "#059669", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                          {score === 100 ? "확인" : "승인"}
                        </button>
                        {score < 100 && (
                          <button onClick={() => setManualAssign(isManual ? null : bankTx.id)}
                            style={{ fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", color: "#5F6577", cursor: "pointer", fontFamily: "inherit" }}>
                            {isManual ? "닫기" : "수동"}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 6, background: "#EF4444", color: "#fff" }}>0%</span>
                        <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 600 }}>매칭 대상 없음</span>
                      </div>
                      <button onClick={() => setManualAssign(isManual ? null : bankTx.id)}
                        style={{ fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", color: "#5F6577", cursor: "pointer", fontFamily: "inherit" }}>
                        {isManual ? "닫기" : "수동 지정"}
                      </button>
                    </div>
                  )}

                  {/* 수동 지정 패널 */}
                  {isManual && (
                    <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "#F8FAFC", border: "1px solid #E8ECF0" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 8 }}>임차인 선택</div>
                      {candidates && candidates.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 4 }}>추천 (유사도순)</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {candidates.slice(0, 5).map((c, ci) => (
                              <button key={ci} onClick={() => handleMatch(bankTx, c.tenant, true)}
                                style={{ fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{
                                  fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4,
                                  background: c.score >= 80 ? "#D1FAE5" : c.score >= 50 ? "#FEF3C7" : "#FEE2E2",
                                  color: c.score >= 80 ? "#059669" : c.score >= 50 ? "#92400E" : "#DC2626"
                                }}>{c.score}%</span>
                                {c.tenant.building} {c.tenant.room} {c.tenant.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 4 }}>전체 임차인</div>
                      <div style={{ maxHeight: 150, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {myTenants.map((t, ti) => (
                          <button key={ti} onClick={() => handleMatch(bankTx, t, true)}
                            style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                            {t.building} {t.room} {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {bankMatches.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#8F95A3", fontSize: 13 }}>
              모든 거래가 매칭 완료되었습니다
            </div>
          )}
        </Card>
      )}

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
