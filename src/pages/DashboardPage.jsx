import { useState, useMemo } from 'react';
import { buildings, asItems, recentTx, renewals } from '../data';
import { useIsMobile, fmt } from '../utils';
import { Card, StatusBadge, SectionTitle } from '../components';
import { useLocalStorage } from '../utils/useLocalStorage';

export const DashboardPage = ({ setPage, role, myBuildings = [], activeTenants = [], activeVacancies = [], calendarEvts = [] }) => {
  const isMobile = useIsMobile();
  const [selectedMenus, setSelectedMenus] = useLocalStorage("hm_selectedMenus", []);
  const [menuConfirmed, setMenuConfirmed] = useLocalStorage("hm_menuConfirmed", false);
  const myTenants = useMemo(() => activeTenants.filter(t => myBuildings.includes(t.building)), [myBuildings, activeTenants]);
  const overdueT = useMemo(() => myTenants.filter(t => t.status === "연체"), [myTenants]);
  const pendingAS = useMemo(() => asItems.filter(a => myBuildings.includes(a.building) && a.status !== "완료"), [myBuildings]);
  const todayTx = recentTx.filter(t => t.date === "2026-02-22" && myBuildings.includes(t.building));
  const todayIncome = todayTx.filter(t => t.type === "입금").reduce((s, t) => s + t.amount, 0);

  const vacantByType = { "단기": 0, "일반임대": 0, "근생": 0, "관리사무소": 0 };
  activeVacancies.forEach(v => vacantByType[v.type] = (vacantByType[v.type] || 0) + 1);

  // 퇴실예정: 입퇴실일정에서 type="퇴실" + 날짜 <= 오늘 + 아직 퇴실처리 안 된 건
  const todayDate = new Date(); todayDate.setHours(23,59,59,999);
  const moveOutDue = useMemo(() => {
    const allTenants = activeTenants.length > 0 ? activeTenants : myTenants;
    return calendarEvts
      .filter(ev => {
        if (ev.type !== "퇴실") return false;
        if (!ev.building || !ev.room) return false;
        const evDate = new Date(ev.date);
        if (evDate > todayDate) return false;
        // 이미 퇴실처리 완료된 건 제외
        const tenant = allTenants.find(t => t.building === ev.building && String(t.room) === String(ev.room));
        if (tenant && tenant.status === "퇴실") return false;
        return true;
      })
      .map(ev => {
        const tenant = allTenants.find(t => t.building === ev.building && String(t.room) === String(ev.room));
        return { ...ev, tenant };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [calendarEvts, activeTenants, myTenants]);

  return (
    <div>
      {/* 퇴실예정 워크플로우 */}
      {moveOutDue.length > 0 && (
        <Card style={{ marginBottom: 16, border: "2px solid #DC2626", background: "#FEF2F2" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🚪</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", letterSpacing: "0.05em" }}>퇴실 진행 ({moveOutDue.length}건)</div>
                <div style={{ fontSize: 12, color: "#8F95A3" }}>입퇴실일정 등록 · 퇴실 절차 미완료</div>
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#DC2626", cursor: "pointer" }} onClick={() => setPage("tenants")}>임차인정보 →</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {moveOutDue.map((ev, i) => {
              const t = ev.tenant;
              const hasPhotos = t && t.moveOutPhotos && t.moveOutPhotos.length > 0;
              const isSettled = t && t.status === "퇴실";
              const daysOver = Math.floor((todayDate - new Date(ev.date)) / 86400000);
              const steps = [
                { label: "퇴실예정", done: true },
                { label: "사진등록", done: hasPhotos },
                { label: "정산확정", done: isSettled },
                { label: "출금완료", done: false },
              ];
              return (
                <div key={i} style={{ padding: "12px 14px", background: "#fff", borderRadius: 10, border: "1px solid #FECACA" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#1A1D23" }}>{ev.building} {ev.room}호</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#5F6577" }}>{ev.name || (t ? t.name : "")}</span>
                      <span style={{ fontSize: 10, color: "#8F95A3" }}>{ev.date}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: daysOver > 3 ? "#DC2626" : daysOver > 0 ? "#F59E0B" : "#3B82F6", color: "#fff" }}>
                      {daysOver === 0 ? "오늘 퇴실" : `${daysOver}일 경과`}
                    </span>
                  </div>
                  {/* 프로세스 스텝 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    {steps.map((s, si) => (
                      <div key={si} style={{ display: "flex", alignItems: "center", flex: si < steps.length - 1 ? 1 : "none" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 56 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: "50%",
                            background: s.done ? "#059669" : "#E5E7EB",
                            color: s.done ? "#fff" : "#9CA3AF",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 800
                          }}>
                            {s.done ? "✓" : si + 1}
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 600, color: s.done ? "#059669" : "#9CA3AF", marginTop: 3, whiteSpace: "nowrap" }}>{s.label}</div>
                        </div>
                        {si < steps.length - 1 && (
                          <div style={{ flex: 1, height: 2, background: s.done && steps[si + 1].done ? "#059669" : "#E5E7EB", marginBottom: 14 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div style={{ marginBottom: isMobile ? 14 : 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#1A1D23", letterSpacing: "-0.03em" }}>
              오늘 할 일
            </h1>
            <p style={{ fontSize: isMobile ? 11 : 13, color: "#8F95A3", marginTop: 4 }}>{new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</p>
          </div>
          <div style={{ fontSize: isMobile ? 11 : 12, color: "#8F95A3" }}>오늘 입금 <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: "#059669" }}>{fmt(todayIncome)}원</span></div>
        </div>
      </div>

      {/* Lunch */}
      {(() => {
        const dayOfWeek = 1;
        const lunchMenus = [
          "김치찌개", "된장찌개", "순두부찌개", "부대찌개", "청국장", "동태찌개", "알탕", "감자탕",
          "제육볶음", "불고기", "갈비찜", "닭볶음탕", "닭갈비", "찜닭", "족발", "보쌈",
          "비빔밥", "돌솥비빔밥", "김밥", "볶음밥", "오므라이스", "카레라이스", "하이라이스", "중화덮밥",
          "칼국수", "수제비", "잔치국수", "냉면", "쌀국수", "우동", "라멘", "쯔유소바",
          "짜장면", "짬뽕", "탕수육", "마파두부", "볶음짬뽕", "깐풍기", "유린기", "양장피",
          "돈까스", "치킨까스", "생선까스", "함박스테이크", "오므돈까스", "치즈돈까스", "카츠동", "나베",
          "삼겹살", "목살구이", "쭈꾸미", "낙지볶음", "오징어볶음", "곱창볶음", "막창", "양념갈비",
          "뼈해장국", "육개장", "미역국", "설렁탕", "곰탕", "갈비탕", "삼계탕", "추어탕",
          "떡볶이", "라볶이", "김치볶음밥", "참치마요덮밥", "치킨마요덮밥", "제육덮밥", "오징어덮밥", "회덮밥",
          "피자", "햄버거", "샌드위치", "초밥", "파스타", "리조또", "타코", "부리또",
          "소불고기덮밥", "매운갈비찜", "고등어조림", "콩나물국밥", "순대국밥", "돼지국밥", "내장탕", "선지해장국",
          "쫄면", "비빔냉면", "밀면", "막국수", "메밀소바", "잔치비빔국수", "콩국수", "열무국수",
          "간장게장", "양념게장", "전복죽", "낙곱새", "해물탕", "아귀찜", "조개탕", "꽃게탕",
          "스테이크", "그라탱", "뇨끼", "크림파스타", "봉골레", "까르보나라", "알리오올리오", "라자냐",
          "규동", "오야꼬동", "텐동", "사시미정식", "가츠카레", "야끼소바", "오코노미야끼", "규카츠",
        ];

        if (dayOfWeek === 0 || dayOfWeek === 6) return null;
        const isOrderDay = dayOfWeek === 1 || dayOfWeek === 5;
        const isMyTurn = role === "admin" || role === "internal";
        const isDone = menuConfirmed && selectedMenus.length > 0;

        if (!isOrderDay) {
          return (<Card style={{ marginBottom: 16 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 16 }}>🏃</span><div style={{ fontSize: 13, fontWeight: 600, color: "#5F6577" }}>오늘은 밖에 나가서 식사하는 날입니다</div></div></Card>);
        }

        const toggleMenu = (menu) => {
          setSelectedMenus(prev => {
            if (prev.includes(menu)) return prev.filter(m => m !== menu);
            if (prev.length >= 2) return prev;
            return [...prev, menu];
          });
        };

        if (isDone) {
          return (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🍚</span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: "0.05em" }}>오늘 점심</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23" }}>{selectedMenus.join(" + ")}</div>
                  </div>
                </div>
                {isMyTurn && (
                  <button onClick={() => { setSelectedMenus([]); setMenuConfirmed(false); }}
                    style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 6, background: "#F3F4F6", border: "1px solid #E0E3E9", color: "#5F6577", cursor: "pointer", fontFamily: "inherit" }}>
                    다시 고르기
                  </button>
                )}
              </div>
            </Card>
          );
        }

        if (!isMyTurn) {
          return isDone ? null : (
            <Card style={{ marginBottom: 16, background: "#FFFBEB", border: "1.5px solid #FDE68A" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🍚</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>아직 점심 메뉴가 선택되지 않았습니다</div>
              </div>
            </Card>
          );
        }

        return (
          <Card style={{ marginBottom: 16, border: "2px solid #F59E0B", background: "#FFFBEB" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🍚</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#D97706", letterSpacing: "0.05em" }}>오늘 점심 메뉴 선택 (최대 2개)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1D23" }}>{selectedMenus.length === 0 ? "아직 안 골랐어요!" : `${selectedMenus.length}/2 선택`}</div>
                </div>
              </div>
              {selectedMenus.length > 0 && (
                <button onClick={() => { setSelectedMenus([]); setMenuConfirmed(false); }}
                  style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: "#fff", border: "1px solid #E0E3E9", color: "#5F6577", cursor: "pointer", fontFamily: "inherit" }}>초기화</button>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {lunchMenus.map((menu, i) => {
                const picked = selectedMenus.includes(menu);
                const full = selectedMenus.length >= 2 && !picked;
                return (
                  <button key={i} onClick={() => !full && toggleMenu(menu)}
                    style={{ padding: "5px 12px", borderRadius: 20, cursor: full ? "default" : "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: picked ? 800 : 600, whiteSpace: "nowrap", transition: "all 0.15s", border: picked ? "2px solid #F59E0B" : "1.5px solid #FDE68A", background: picked ? "#FEF3C7" : "#fff", color: full ? "#D1D5DB" : "#1A1D23", opacity: full ? 0.5 : 1 }}
                    onMouseEnter={e => { if (!picked && !full) { e.currentTarget.style.background = "#FEF3C7"; e.currentTarget.style.borderColor = "#F59E0B"; }}}
                    onMouseLeave={e => { if (!picked && !full) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#FDE68A"; }}}>
                    {picked ? `✓ ${menu}` : menu}
                  </button>
                );
              })}
            </div>
            {selectedMenus.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#fff", borderRadius: 10, border: "1.5px solid #FDE68A" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {selectedMenus.map((m, i) => (
                    <span key={i} onClick={() => toggleMenu(m)} style={{ padding: "4px 14px", borderRadius: 20, background: "#FEF3C7", border: "1.5px solid #F59E0B", fontSize: 13, fontWeight: 700, color: "#92400E", cursor: "pointer" }}>{m} ✕</span>
                  ))}
                </div>
                <button onClick={() => setMenuConfirmed(true)}
                  style={{ padding: "8px 18px", borderRadius: 8, background: "#F59E0B", border: "none", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>선택 완료</button>
              </div>
            )}
          </Card>
        );
      })()}


      {/* AS Pending */}
      {pendingAS.length > 0 && (
        <Card style={{ marginBottom: 16 }} onClick={() => setPage("as")}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#EA580C", letterSpacing: "0.05em", marginBottom: 10 }}>🔧 AS 처리 대기 ({pendingAS.length}건)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pendingAS.slice(0, 10).map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: a.status === "대기" ? "#F0F4FF" : "#FFF7ED", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <StatusBadge status={a.priority} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1A1D23" }}>{a.content}</div>
                    <div style={{ fontSize: 11, color: "#8F95A3" }}>{a.building} {a.room}호 · {a.date}</div>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
      {/* Urgent: Overdue */}
      {overdueT.length > 0 && (
        <Card style={{ marginBottom: 16, border: "1.5px solid #FECACA" }} onClick={() => setPage("collection")}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", letterSpacing: "0.05em" }}>🚨 연체 독촉 필요 ({overdueT.length}건)</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {overdueT.sort((a, b) => b.overdue - a.overdue).map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#FEF2F2", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</span>
                  <span style={{ fontSize: 11, color: "#8F95A3" }}>{t.building} {t.room}호</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#DC2626" }}>{fmt(t.overdue)}원</span>
                  <span style={{ fontSize: 18, cursor: "pointer" }} title="전화">📞</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {/* 미처리 민원 */}
        <Card onClick={() => setPage("as")}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", letterSpacing: "0.05em", marginBottom: 10 }}>🔧 미처리 민원</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { label: "높음", count: pendingAS.filter(a => a.priority === "높음").length, color: "#DC2626" },
              { label: "보통", count: pendingAS.filter(a => a.priority === "보통").length, color: "#F59E0B" },
              { label: "낮음", count: pendingAS.filter(a => a.priority === "낮음").length, color: "#3B82F6" },
              { label: "전체", count: pendingAS.length, color: "#1A1D23" },
            ].map((v, i) => (
              <div key={i} style={{ padding: "8px", borderRadius: 6, background: "#F9FAFB", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#8F95A3" }}>{v.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: v.color }}>{v.count}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Renewal */}
        <Card>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#EC4899", letterSpacing: "0.05em", marginBottom: 10 }}>📋 재계약 도래 ({renewals.length}건)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {renewals.slice(0, 3).map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{r.tenant}</span>
                  <span style={{ color: "#8F95A3", marginLeft: 4, fontSize: 11 }}>{r.building}</span>
                </div>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>{r.expiry}</span>
              </div>
            ))}
            {renewals.length > 3 && <div style={{ fontSize: 11, color: "#B0B5C1", textAlign: "center" }}>+{renewals.length - 3}건 더보기</div>}
          </div>
        </Card>
      </div>

      {/* Today Transactions */}
      {todayTx.length > 0 && (
        <Card onClick={() => setPage("ledger")}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: "0.05em", marginBottom: 10 }}>💰 오늘 입출금 ({todayTx.length}건)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {todayTx.map((tx, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 6, background: "#F9FAFB" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: tx.type === "입금" ? "#10B981" : "#EF4444", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#3D4251" }}>{tx.building} {tx.room} · {tx.cat}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: tx.type === "입금" ? "#059669" : "#DC2626" }}>{tx.type === "지출" ? "-" : "+"}{fmt(tx.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Special Management Buildings */}
      {(() => {
        const specials = buildings.filter(b => b.special);
        if (specials.length === 0) return null;
        return (
          <Card style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#EA580C", letterSpacing: "0.05em", marginBottom: 10 }}>⚠️ 특별관리 건물 ({specials.length})</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {specials.map((b, i) => (
                <div key={i} style={{ padding: "8px 14px", borderRadius: 8, background: b.special === "무리한 요구" ? "#FEF2F2" : "#FFF7ED", border: `1px solid ${b.special === "무리한 요구" ? "#FECACA" : "#FED7AA"}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{b.name}</div>
                  <div style={{ fontSize: 10, color: b.special === "무리한 요구" ? "#DC2626" : "#EA580C", fontWeight: 600, marginTop: 2 }}>⚠ {b.special}</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}
    </div>
  );
};
