import { useState, useMemo } from 'react';
import { buildings } from '@/data';
import { useIsMobile, fmt } from '@/utils';
import { Card, SectionTitle, Table } from '@/components';
import { inputClassName } from '@/components/Field';
import { useLocalStorage } from '@/utils/useLocalStorage';

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

interface MatchResult {
  score: number;
  tenant: Record<string, any> | null;
  reason: string;
  saveName: boolean;
  candidates?: { tenant: Record<string, any>; score: number; reasons: string[] }[];
}

/**
 * 자동 매칭 알고리즘
 */
const calcMatch = (bankTx: Record<string, any>, allTenants: Record<string, any>[], nameAliases: Record<string, string[]>, depositNames: Record<string, string>, prevTransactions: Record<string, any>[]): MatchResult => {
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
    let reasons: string[] = [];
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

interface TransactionPageProps {
  myBuildings?: string[];
  activeTenants?: Record<string, any>[];
  transactions: Record<string, any>[];
  addDeposit: (building: string, room: string, name: string, amount: number, method: string, note: string) => void;
  roomBalances: Record<string, number>;
  isLoading?: boolean;
}

export const TransactionPage = ({ myBuildings = [], activeTenants = [], transactions, addDeposit, roomBalances, isLoading }: TransactionPageProps) => {
  const isMobile = useIsMobile();
  const [showForm, setShowForm] = useState(false);
  const [showDebtSection, setShowDebtSection] = useState(false);
  const [moveoutDebts, setMoveoutDebts] = useLocalStorage<Record<string, any>[]>("hm_moveoutDebts", []);
  const [formBld, setFormBld] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState("계좌이체");
  const [formNote, setFormNote] = useState("");
  const [filterBld, setFilterBld] = useState("전체");
  const [done, setDone] = useState(false);
  const [showBankda, setShowBankda] = useState(false);
  const [matchedItems, setMatchedItems] = useLocalStorage<Record<string, boolean>>("hm_bankdaMatched", {});
  const [nameAliases, setNameAliases] = useLocalStorage<Record<string, string[]>>("hm_nameAliases", {});
  const [depositNames, setDepositNames] = useLocalStorage<Record<string, string>>("hm_depositNames", {});
  const [manualAssign, setManualAssign] = useState<string | null>(null);
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

  const handleMatch = (bankTx: Record<string, any>, tenant: Record<string, any>, saveName: boolean) => {
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

  const selectClassName = "w-full px-2.5 py-2 rounded-lg border-[1.5px] border-hm-input-border text-xs font-[inherit] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors cursor-pointer";

  return (
    <div>
      <SectionTitle sub={`총 ${transactions.length}건`}>🏦 입출금 관리</SectionTitle>

      {/* 안내 코멘트 */}
      <Card className="mb-4 !px-[18px] !py-3.5 bg-hm-bg-slate border border-hm-border">
        <div className="text-xs font-extrabold text-hm-text mb-2">a.bankda.com 연동 자동 입금 확인</div>
        <div className="text-[11px] text-hm-text-sub leading-[1.8]">
          뱅크다(a.bankda.com)와 연결되어 입출금 내역을 자동으로 확인합니다.
        </div>
        <div className="mt-2 px-3 py-2.5 rounded-lg bg-hm-blue-bg border border-[#BFDBFE]">
          <div className="text-[11px] font-bold text-hm-blue-dark mb-1.5">자동 확인 규칙 (100% 자동매칭)</div>
          <div className="text-[11px] text-[#1E40AF] leading-8">
            <strong>1. 이름 + 금액 일치</strong> — 임차인 이름과 월세+관리비 금액이 정확히 일치하면 100% 자동 처리<br />
            <strong>2. 금액 유일 일치</strong> — 이름이 달라도 입금 금액이 1원 단위까지 정확히 일치하고, 해당 금액의 임차인이 1명뿐이면 100% 자동 처리 (입금자명 자동 저장)<br />
            <strong>3. 지정 입금자명</strong> — 회사가 건물+호실별로 지정한 입금자명과 일치하면 100% 자동 처리
          </div>
        </div>
        <div className="mt-1.5 text-[10px] text-hm-text-muted leading-relaxed">
          * 100%가 아닌 경우 확률(%)로 표시되며, 담당자가 직접 확인 후 승인하거나 수동으로 임차인을 지정할 수 있습니다.<br />
          * 한번 매칭된 입금자명은 자동 저장되어 다음부터 100% 자동매칭됩니다.
        </div>
      </Card>

      <div className={`grid gap-3 mb-5 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <Card className="bg-hm-success-bg border border-[#BBF7D0]">
          <div className="text-[10px] text-hm-text-muted font-semibold mb-1">이번달 입금</div>
          <div className="text-[22px] font-extrabold text-hm-success">{fmt(transactions.filter(t => t.type === "입금").reduce((s, t) => s + t.amount, 0))}원</div>
        </Card>
        <Card className="bg-hm-danger-bg border border-hm-danger-border">
          <div className="text-[10px] text-hm-text-muted font-semibold mb-1">총 미수금</div>
          <div className="text-[22px] font-extrabold text-hm-danger">{fmt(Object.values(roomBalances).reduce((s, v) => s + v, 0))}원</div>
        </Card>
        <Card className="bg-hm-blue-bg border border-[#BFDBFE]">
          <div className="text-[10px] text-hm-text-muted font-semibold mb-1">미납 호실</div>
          <div className="text-[22px] font-extrabold text-hm-blue">{overdueRooms.length}건</div>
        </Card>
        <Card className="bg-[#FDF4FF] border border-[#E9D5FF] cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowBankda(!showBankda)}>
          <div className="text-[10px] text-hm-text-muted font-semibold mb-1">뱅크다 미매칭</div>
          <div className="text-[22px] font-extrabold text-[#7C3AED]">{bankMatches.length}건</div>
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
            <Card className={`mb-4 cursor-pointer ${totalDebtAmt > 0 ? 'border-2 border-hm-danger bg-hm-danger-bg' : 'border-[1.5px] border-hm-border bg-hm-bg-slate'}`} onClick={() => setShowDebtSection(!showDebtSection)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚪</span>
                  <div>
                    <div className={`text-sm font-extrabold ${totalDebtAmt > 0 ? 'text-hm-danger' : 'text-hm-text'}`}>퇴실 미수금</div>
                    <div className="text-[10px] text-hm-text-muted">퇴실 정산 후 미회수 잔액</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-extrabold ${totalDebtAmt > 0 ? 'text-hm-danger' : 'text-hm-success'}`}>{totalDebtAmt > 0 ? fmt(totalDebtAmt) + "원" : "없음"}</div>
                  <div className="text-[10px] text-hm-text-muted">미수 {pendingDebts.length}건 / 전체 {myDebts.length}건</div>
                </div>
              </div>
            </Card>
            {showDebtSection && (
              <Card className="mb-4 border-[1.5px] border-hm-danger-border bg-white">
                <div className="text-[13px] font-extrabold text-hm-danger mb-3">🚪 퇴실 미수금 내역</div>
                <div className="flex gap-1.5 mb-3">
                  {["전체", "미수", "회수완료", "포기"].map(s => {
                    const cnt = s === "전체" ? myDebts.length : myDebts.filter(d => d.status === s).length;
                    return (
                      <span key={s} className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${s === "미수" ? 'bg-hm-danger-bg text-hm-danger' : s === "회수완료" ? 'bg-hm-success-bg text-hm-success' : s === "포기" ? 'bg-[#F3F4F6] text-hm-text-muted' : 'bg-hm-blue-bg text-hm-blue-dark'}`}>
                        {s} {cnt}
                      </span>
                    );
                  })}
                </div>
                {myDebts.length === 0 ? (
                  <div className="text-center py-5 text-[#B0B5C1] text-[13px]">퇴실 미수금 내역이 없습니다</div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {myDebts.map((d, i) => (
                      <div key={d.id || i} className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${d.status === "미수" ? 'bg-hm-danger-bg border border-hm-danger-border' : d.status === "회수완료" ? 'bg-hm-success-bg border border-[#BBF7D0]' : 'bg-hm-bg-slate border border-hm-border'}`}>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-extrabold text-hm-text">{d.building} {d.room}호</span>
                            <span className="text-[11px] font-bold text-hm-text-sub">{d.name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${d.status === "미수" ? 'bg-hm-danger' : d.status === "회수완료" ? 'bg-hm-success' : 'bg-hm-text-muted'}`}>{d.status}</span>
                          </div>
                          <div className="text-[10px] text-hm-text-muted">퇴실일: {d.date}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[15px] font-extrabold ${d.status === "미수" ? 'text-hm-danger' : d.status === "회수완료" ? 'text-hm-success' : 'text-hm-text-muted'}`}>{fmt(d.amount)}원</span>
                          {d.status === "미수" && (
                            <div className="flex gap-1">
                              <button onClick={(e) => { e.stopPropagation(); setMoveoutDebts(prev => prev.map(x => x.id === d.id ? { ...x, status: "회수완료" } : x)); }}
                                className="text-[9px] font-bold px-2 py-1 rounded-[5px] border-none bg-hm-success text-white cursor-pointer font-[inherit] hover:opacity-90 active:scale-95 transition-all">
                                회수완료
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); if (confirm("정말 포기하시겠습니까?")) setMoveoutDebts(prev => prev.map(x => x.id === d.id ? { ...x, status: "포기" } : x)); }}
                                className="text-[9px] font-bold px-2 py-1 rounded-[5px] border border-hm-input-border bg-white text-hm-text-muted cursor-pointer font-[inherit] hover:bg-hm-bg-hover active:scale-95 transition-all">
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
        <Card className="mb-4 border-2 border-[#7C3AED] bg-[#FEFBFF]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-base">🏦</span>
              <div>
                <div className="text-sm font-extrabold text-[#7C3AED]">뱅크다 입금 매칭</div>
                <div className="text-[10px] text-hm-text-muted">a.bankda.com 거래내역</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <span className="text-[10px] px-2.5 py-1 rounded-md bg-hm-success-bg text-hm-success font-bold">100% {auto100.length}건</span>
              <span className="text-[10px] px-2.5 py-1 rounded-md bg-[#FEF3C7] text-[#92400E] font-bold">수동확인 {manualNeeded.length}건</span>
              <button onClick={() => setShowDepositNames(!showDepositNames)}
                className={`text-[10px] px-2.5 py-1 rounded-md border font-bold cursor-pointer font-[inherit] transition-colors ${showDepositNames ? 'border-[#E9D5FF] bg-[#7C3AED] text-white' : 'border-[#E9D5FF] bg-[#F5F3FF] text-[#7C3AED] hover:bg-[#EDE9FE]'}`}>
                지정 입금자명
              </button>
            </div>
          </div>

          {/* 지정 입금자명 관리 */}
          {showDepositNames && (
            <div className="mb-4 px-3.5 py-3 rounded-[10px] bg-[#F5F3FF] border border-[#E9D5FF]">
              <div className="text-[11px] font-extrabold text-[#7C3AED] mb-2.5">지정 입금자명 관리</div>
              <div className="text-[10px] text-hm-text-muted mb-2.5">건물+호실별로 지정 입금자명을 등록하면 해당 이름으로 입금 시 100% 자동매칭됩니다.</div>
              {/* 등록된 목록 */}
              {Object.keys(depositNames).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {Object.entries(depositNames).map(([key, name]) => (
                    <div key={key} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E9D5FF] text-[11px]">
                      <span className="font-bold">{key.replace("_", " ")}</span>
                      <span className="text-[#7C3AED] font-semibold">{name}</span>
                      <span onClick={() => setDepositNames(prev => { const n = { ...prev }; delete n[key]; return n; })}
                        className="text-hm-danger cursor-pointer font-extrabold ml-1 hover:opacity-70 transition-opacity">×</span>
                    </div>
                  ))}
                </div>
              )}
              {/* 저장된 별명 목록 */}
              {Object.keys(nameAliases).length > 0 && (
                <div className="mb-2.5">
                  <div className="text-[10px] text-hm-text-muted mb-1">자동 저장된 입금자명</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(nameAliases).map(([key, names]) => names.map((n, i) => (
                      <span key={`${key}_${i}`} className="text-[10px] px-2 py-0.5 rounded bg-hm-success-bg text-hm-success font-semibold">
                        {key.replace("_", " ")} ← {n}
                      </span>
                    )))}
                  </div>
                </div>
              )}
              {/* 새로 등록 */}
              <div className="flex gap-1.5 items-center">
                <select value={editDepKey} onChange={e => setEditDepKey(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md border-[1.5px] border-hm-input-border text-[11px] font-[inherit] outline-none focus:ring-2 focus:ring-ring transition-colors">
                  <option value="">건물+호실 선택</option>
                  {myTenants.map(t => <option key={`${t.building}_${t.room}`} value={`${t.building}_${t.room}`}>{t.building} {t.room} ({t.name})</option>)}
                </select>
                <input value={editDepVal} onChange={e => setEditDepVal(e.target.value)} placeholder="지정 입금자명"
                  className="px-2.5 py-1.5 rounded-md border-[1.5px] border-hm-input-border text-[11px] font-[inherit] w-[120px] outline-none focus:ring-2 focus:ring-ring transition-colors" />
                <button onClick={() => {
                  if (!editDepKey || !editDepVal) return;
                  setDepositNames(prev => ({ ...prev, [editDepKey]: editDepVal }));
                  setEditDepKey(""); setEditDepVal("");
                }}
                  className="px-3.5 py-1.5 rounded-md border-none bg-[#7C3AED] text-white text-[11px] font-bold cursor-pointer font-[inherit] hover:opacity-90 active:scale-95 transition-all">등록</button>
              </div>
            </div>
          )}

          {/* 100% 자동매칭 일괄 처리 */}
          {auto100.length > 0 && (
            <button onClick={() => auto100.forEach(m => handleMatch(m.bankTx, m.tenant!, m.saveName))}
              className="w-full py-2.5 rounded-lg border-none bg-hm-success text-white text-[13px] font-extrabold cursor-pointer font-[inherit] mb-3 hover:opacity-90 active:scale-[0.98] transition-all">
              100% 매칭 {auto100.length}건 일괄 입금처리
            </button>
          )}

          <div className="flex flex-col gap-2">
            {bankMatches.map((m) => {
              const { bankTx, score, tenant, reason, saveName, candidates } = m;
              const isManual = manualAssign === bankTx.id;
              return (
                <div key={bankTx.id} className={`px-3.5 py-3 rounded-[10px] border-[1.5px] ${score === 100 ? 'bg-[#F0FDF4] border-[#BBF7D0]' : score >= 50 ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-hm-danger-bg border-hm-danger-border'}`}>
                  {/* 뱅크다 거래 정보 */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-hm-text">{bankTx.depositor}</span>
                      <span className="text-[10px] text-hm-text-muted">{bankTx.date.slice(5)} · {bankTx.bank}은행</span>
                    </div>
                    <span className="text-sm font-extrabold text-hm-success">{fmt(bankTx.amount)}원</span>
                  </div>

                  {/* 매칭 결과 */}
                  {tenant ? (
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md text-white ${score === 100 ? 'bg-hm-success' : score >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'}`}>
                          {score}%
                        </span>
                        <span className="text-xs font-bold text-hm-text">
                          {tenant.building} {tenant.room}호 {tenant.name}
                        </span>
                        <span className="text-[10px] text-hm-text-muted">({reason})</span>
                        {saveName && <span className="text-[9px] px-1.5 py-0.5 rounded bg-hm-blue-bg text-hm-blue-dark font-semibold">이름 자동저장</span>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleMatch(bankTx, tenant, saveName)}
                          className="text-[10px] font-bold px-3 py-1 rounded-md border-none bg-hm-success text-white cursor-pointer font-[inherit] hover:opacity-90 active:scale-95 transition-all">
                          {score === 100 ? "확인" : "승인"}
                        </button>
                        {score < 100 && (
                          <button onClick={() => setManualAssign(isManual ? null : bankTx.id)}
                            className="text-[10px] font-bold px-3 py-1 rounded-md border border-hm-input-border bg-white text-hm-text-sub cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
                            {isManual ? "닫기" : "수동"}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-[#EF4444] text-white">0%</span>
                        <span className="text-[11px] text-hm-danger font-semibold">매칭 대상 없음</span>
                      </div>
                      <button onClick={() => setManualAssign(isManual ? null : bankTx.id)}
                        className="text-[10px] font-bold px-3 py-1 rounded-md border border-hm-input-border bg-white text-hm-text-sub cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
                        {isManual ? "닫기" : "수동 지정"}
                      </button>
                    </div>
                  )}

                  {/* 수동 지정 패널 */}
                  {isManual && (
                    <div className="mt-2.5 px-3 py-2.5 rounded-lg bg-hm-bg-slate border border-hm-border">
                      <div className="text-[10px] font-bold text-hm-text-sub mb-2">임차인 선택</div>
                      {candidates && candidates.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[9px] text-hm-text-muted mb-1">추천 (유사도순)</div>
                          <div className="flex flex-wrap gap-1">
                            {candidates.slice(0, 5).map((c, ci) => (
                              <button key={ci} onClick={() => handleMatch(bankTx, c.tenant, true)}
                                className="text-[10px] font-semibold px-2.5 py-1 rounded-md border border-hm-input-border bg-white cursor-pointer font-[inherit] flex items-center gap-1 hover:bg-hm-bg-hover transition-colors">
                                <span className={`text-[9px] font-extrabold px-1.5 py-px rounded ${c.score >= 80 ? 'bg-[#D1FAE5] text-hm-success' : c.score >= 50 ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#FEE2E2] text-hm-danger'}`}>{c.score}%</span>
                                {c.tenant.building} {c.tenant.room} {c.tenant.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-[9px] text-hm-text-muted mb-1">전체 임차인</div>
                      <div className="max-h-[150px] overflow-y-auto flex flex-wrap gap-1">
                        {myTenants.map((t, ti) => (
                          <button key={ti} onClick={() => handleMatch(bankTx, t, true)}
                            className="text-[10px] px-2 py-0.5 rounded-[5px] border border-hm-input-border bg-white cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
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
            <div className="text-center py-8 text-hm-text-muted text-[13px]">
              모든 거래가 매칭 완료되었습니다
            </div>
          )}
        </Card>
      )}

      <div className="flex justify-between items-center mb-4">
        <select value={filterBld} onChange={e => setFilterBld(e.target.value)}
          className="px-3 py-[7px] rounded-lg border-[1.5px] border-hm-input-border text-xs font-semibold font-[inherit] outline-none focus:ring-2 focus:ring-ring transition-colors">
          {buildingNames.map(b => <option key={b}>{b}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className={`px-5 py-2 rounded-lg border-none text-white text-xs font-bold cursor-pointer font-[inherit] hover:opacity-90 active:scale-95 transition-all ${showForm ? 'bg-hm-danger' : 'bg-hm-success'}`}>
          {showForm ? "✕ 닫기" : "💵 입금 등록"}
        </button>
      </div>

      {showForm && (
        <Card className="mb-4 border-2 border-hm-success">
          {done ? (
            <div className="text-center p-5">
              <span className="text-[40px]">✅</span>
              <div className="text-base font-extrabold text-hm-success mt-2">입금 처리 완료</div>
            </div>
          ) : (
            <>
              <div className="text-[13px] font-extrabold mb-3 text-hm-success">💵 입금 등록</div>
              <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                <div>
                  <div className="text-[10px] text-hm-text-muted mb-1">건물</div>
                  <select value={formBld} onChange={e => { setFormBld(e.target.value); setFormRoom(""); }}
                    className={selectClassName}>
                    <option value="">선택</option>
                    {buildingNames.filter(b => b !== "전체").map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-hm-text-muted mb-1">호실</div>
                  <select value={formRoom} onChange={e => setFormRoom(e.target.value)}
                    className={selectClassName}>
                    <option value="">선택</option>
                    {roomsForBld.map(r => {
                      const bal = roomBalances[`${formBld}_${r}`] || 0;
                      return <option key={r} value={r}>{r} {bal > 0 ? `(미납 ${fmt(bal)})` : ""}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-hm-text-muted mb-1">입금액</div>
                  <input value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="금액"
                    className="w-full px-2.5 py-2 rounded-lg border-[1.5px] border-hm-input-border text-[13px] font-[inherit] text-right font-bold outline-none focus:ring-2 focus:ring-ring transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-[120px_1fr_auto] gap-2.5 items-end">
                <div>
                  <div className="text-[10px] text-hm-text-muted mb-1">입금방법</div>
                  <select value={formMethod} onChange={e => setFormMethod(e.target.value)}
                    className={selectClassName}>
                    <option>계좌이체</option><option>카드</option><option>현금</option>
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-hm-text-muted mb-1">비고</div>
                  <input value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="메모"
                    className="w-full px-2.5 py-2 rounded-lg border-[1.5px] border-hm-input-border text-xs font-[inherit] outline-none focus:ring-2 focus:ring-ring transition-colors" />
                </div>
                <button onClick={handleSubmit}
                  className="px-6 py-2 rounded-lg border-none bg-hm-success text-white text-[13px] font-extrabold cursor-pointer font-[inherit] whitespace-nowrap hover:opacity-90 active:scale-95 transition-all">등록</button>
              </div>
              {formBld && formRoom && (
                <div className="mt-2.5 px-3 py-2 rounded-md bg-hm-bg-slate text-xs text-hm-text-sub">
                  현재 잔액: <strong className={(roomBalances[`${formBld}_${formRoom}`] || 0) > 0 ? 'text-hm-danger' : 'text-hm-success'}>{fmt(roomBalances[`${formBld}_${formRoom}`] || 0)}원</strong>
                  {formAmount && <> → 입금 후: <strong className="text-hm-success">{fmt(Math.max(0, (roomBalances[`${formBld}_${formRoom}`] || 0) - parseInt(formAmount.replace(/,/g, "") || "0")))}원</strong></>}
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {isMobile ? (
        <div className="flex flex-col gap-1.5">
          {sortedTx.length === 0 && <div className="text-center py-10 text-[#B0B5C1] text-[13px]">입출금 내역이 없습니다</div>}
          {sortedTx.map((r, i) => (
            <Card key={i} className="!px-3 !py-2.5">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.type === "입금" ? 'bg-hm-success-bg text-hm-success' : 'bg-hm-danger-bg text-hm-danger'}`}>{r.type}</span>
                  <span className="text-[13px] font-bold">{r.name}</span>
                </div>
                <span className={`text-sm font-extrabold ${r.type === "입금" ? 'text-hm-success' : 'text-hm-danger'}`}>{r.type === "입금" ? "+" : "-"}{fmt(r.amount)}원</span>
              </div>
              <div className="text-[11px] text-hm-text-sub">{r.building} {r.room}호 · {r.date.slice(5)} · {r.method}</div>
              {r.note && <div className="text-[10px] text-hm-text-muted mt-0.5">{r.note}</div>}
            </Card>
          ))}
        </div>
      ) : (
      <Table
        columns={[
          { label: "일자", render: (r: Record<string, any>) => <span className="text-[11px]">{r.date.slice(5)}</span> },
          { label: "유형", render: (r: Record<string, any>) => <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.type === "입금" ? 'bg-hm-success-bg text-hm-success' : 'bg-hm-danger-bg text-hm-danger'}`}>{r.type}</span> },
          { label: "건물", render: (r: Record<string, any>) => <span className="font-semibold text-[11px]">{r.building}</span> },
          { label: "호실", render: (r: Record<string, any>) => r.room },
          { label: "입주자", render: (r: Record<string, any>) => <span className="font-bold inline-block max-w-[5em] overflow-hidden text-ellipsis whitespace-nowrap align-middle">{r.name}</span> },
          { label: "금액", align: "right" as const, render: (r: Record<string, any>) => <span className={`font-extrabold ${r.type === "입금" ? 'text-hm-success' : 'text-hm-danger'}`}>{r.type === "입금" ? "+" : "-"}{fmt(r.amount)}원</span> },
          { label: "방법", render: (r: Record<string, any>) => <span className="text-[10px] text-hm-text-muted">{r.method}</span> },
          { label: "잔액", align: "right" as const, render: (r: Record<string, any>) => {
            const bal = roomBalances[`${r.building}_${r.room}`] || 0;
            return <span className={`font-bold text-[11px] ${bal > 0 ? 'text-hm-danger' : 'text-hm-success'}`}>{fmt(bal)}원</span>;
          }},
          { label: "비고", render: (r: Record<string, any>) => <span className="text-[10px] text-hm-text-muted">{r.note}</span> },
        ]}
        data={sortedTx}
      />
      )}
    </div>
  );
};
