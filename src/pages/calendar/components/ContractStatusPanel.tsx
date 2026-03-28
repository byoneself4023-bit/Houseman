import React from 'react';
import { buildingFloors } from '@/data';
import { Card } from '@/components';
import { TYPE_COLORS } from '../constants';
import { persistUpdate, persistDelete } from '../calendarApi';

interface ContractStatusPanelProps {
  calendarEvents: Record<string, any>[];
  activeTenants: Record<string, any>[];
  activeVacancies: Record<string, any>[];
  buildingData: Record<string, any>;
  setEvents?: (fn: any) => void;
  setActiveVacancies?: (fn: any) => void;
  setPendingContract?: (v: any) => void;
  setPage?: (v: string) => void;
  openEditEvent: (evt: Record<string, any>) => void;
  setContractReport: (v: any) => void;
  setBreakReport: (v: any) => void;
  openSendModal: (evt: Record<string, any>) => void;
}

export const ContractStatusPanel: React.FC<ContractStatusPanelProps> = ({
  calendarEvents, activeTenants, activeVacancies, buildingData,
  setEvents, setActiveVacancies, setPendingContract, setPage,
  openEditEvent, setContractReport, setBreakReport, openSendModal,
}) => {
  const contractEvts = calendarEvents
    .filter(ev => ev.type === "계약" && ev.building && ev.room)
    .filter(ev => !activeTenants.some((t: any) => t.building === ev.building && String(t.room) === String(ev.room)));

  if (contractEvts.length === 0) return null;

  return (
    <Card style={{ marginBottom: 16, border: "2px solid #3B82F6", background: "#EFF6FF" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>📦</span>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#3B82F6" }}>계약현황 <span style={{ fontWeight: 600, fontSize: 11, color: "#8F95A3" }}>({contractEvts.length}건)</span></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {contractEvts.map((ev, i) => {
          const cSteps = [
            { label: "계약금확인", done: !!ev.depositConfirmed },
            { label: "건물주보고", done: !!ev.reported },
            { label: "잔금확인", done: !!ev.balanceConfirmed },
            { label: "계약서입력", done: false },
          ];
          const cDone = cSteps.filter(s => s.done).length;
          const allDone = cDone === cSteps.length;
          const currentStep = cSteps.findIndex(s => !s.done);
          return (
            <div key={i} style={{ background: allDone ? "#F9FAFB" : "#fff", border: allDone ? "1px solid #D1D5DB" : "1px solid #BFDBFE", borderRadius: 10, overflow: "hidden", filter: allDone ? "grayscale(1)" : "none", opacity: allDone ? 0.7 : 1, transition: "all 0.3s" }}
              onDoubleClick={() => openEditEvent(ev)}>
              {/* 스텝 인디케이터 */}
              <div style={{ padding: "10px 16px", background: allDone ? "#F3F4F6" : "linear-gradient(90deg, #EFF6FF, #F8FAFF)", borderBottom: allDone ? "1px solid #D1D5DB" : "1px solid #BFDBFE", display: "flex", alignItems: "center", gap: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: allDone ? "#9CA3AF" : "#3B82F6", marginRight: 6, whiteSpace: "nowrap" }}>{ev.building} {ev.room}호</div>
                {ev.registeredSource === "broker"
                  ? <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", background: "#EC4899", color: "#fff", borderRadius: 3, marginRight: 6, whiteSpace: "nowrap" }}>부동산</span>
                  : <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", background: "#6B7280", color: "#fff", borderRadius: 3, marginRight: 6, whiteSpace: "nowrap" }}>직접</span>
                }
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  {cSteps.map((step, si) => {
                    const isActive = si === currentStep;
                    const stepDone = step.done;
                    return (
                      <div key={si} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 56 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 800,
                            background: stepDone ? (allDone ? "#9CA3AF" : "#3B82F6") : isActive ? "#fff" : "#E5E7EB",
                            color: stepDone ? "#fff" : isActive ? "#3B82F6" : "#9CA3AF",
                            border: isActive && !stepDone ? "2px solid #3B82F6" : "2px solid transparent",
                            boxShadow: isActive && !stepDone ? "0 0 0 3px rgba(59,130,246,0.2)" : "none",
                            animation: isActive && !stepDone && !allDone ? "hm-blink 1.2s ease-in-out infinite" : "none",
                            transition: "all 0.3s"
                          }}>
                            {stepDone ? "✓" : si + 1}
                          </div>
                          <span style={{ fontSize: 9, fontWeight: stepDone || isActive ? 700 : 500, color: stepDone ? (allDone ? "#9CA3AF" : "#3B82F6") : isActive ? "#1D4ED8" : "#9CA3AF", whiteSpace: "nowrap", animation: isActive && !stepDone && !allDone ? "hm-blink 1.2s ease-in-out infinite" : "none" }}>{step.label}</span>
                        </div>
                        {si < cSteps.length - 1 && (
                          <div style={{ flex: 1, height: 2, background: stepDone ? (allDone ? "#D1D5DB" : "#3B82F6") : "#E5E7EB", margin: "0 4px", marginBottom: 16, borderRadius: 1, transition: "background 0.3s" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* 액션 버튼 행 */}
              <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {/* 계약금 확인 */}
                <span onClick={() => {
                  if (ev.depositConfirmed) return;
                  persistUpdate(ev.supabaseId, { depositConfirmed: true });
                  setEvents?.((prev: any[]) => prev.map((e: any) => e === ev ? { ...e, depositConfirmed: true } : e));
                }}
                  style={{ fontSize: 10, fontWeight: 700, color: ev.depositConfirmed ? "#9CA3AF" : "#0369A1", padding: "4px 10px", borderRadius: 6, border: ev.depositConfirmed ? "1px solid #D1D5DB" : "1px solid #BAE6FD", background: ev.depositConfirmed ? "#F3F4F6" : "#F0F9FF", cursor: ev.depositConfirmed ? "default" : "pointer", whiteSpace: "nowrap", textDecoration: ev.depositConfirmed ? "line-through" : "none" }}>
                  {ev.depositConfirmed ? "✔ 계약금확인" : "계약금 확인"}
                </span>
                {/* 건물주보고 */}
                <span onClick={() => {
                  if (ev.reported) return;
                  if (!ev.depositConfirmed) return alert("계약금 확인이 완료되어야 건물주보고가 가능합니다.");
                  const bd = buildingData[ev.building] || {};
                  const bf = (buildingFloors as any)[ev.building] || {};
                  const owners = bd.owners && bd.owners.length > 0 && bd.owners[0].name
                    ? bd.owners
                    : [{ name: bf.owner || "", phone: bf.phone || "" }];
                  const ownerName = owners[0]?.name || "건물주";
                  const msgLines = [
                    `[${ev.building} ${ev.room}호 계약 보고]`,
                    ``,
                    `안녕하세요, ${ownerName}건물주님.`,
                    `${ev.building} ${ev.room}호 계약이 진행되었습니다.`,
                    ``,
                    `▪ 보증금: ${ev.deposit ?? 0}만원`,
                    `▪ 월세: ${ev.rent ?? 0}만원`,
                    ev.mgmt ? `▪ 관리비: ${ev.mgmt}만원` : null,
                    `▪ 입주일: ${ev.moveIn || ev.date || "-"}`,
                    ev.expiry ? `▪ 만기일: ${ev.expiry}` : null,
                    ev.broker ? `▪ 부동산: ${ev.broker}` : null,
                    ``,
                    `감사합니다.`,
                    `- 하우스맨 드림`,
                  ].filter(Boolean);
                  setContractReport({ ev, owners, msgText: msgLines.join("\n") });
                }}
                  style={{ fontSize: 10, fontWeight: 700, color: ev.reported ? "#9CA3AF" : "#7C3AED", padding: "4px 10px", borderRadius: 6, border: ev.reported ? "1px solid #D1D5DB" : "1px solid #DDD6FE", background: ev.reported ? "#F3F4F6" : "#F5F3FF", cursor: ev.reported ? "default" : "pointer", whiteSpace: "nowrap", textDecoration: ev.reported ? "line-through" : "none" }}>
                  {ev.reported ? "✔ 건물주보고" : "건물주보고"}
                </span>
                {/* 잔금확인 */}
                <span onClick={() => {
                  if (ev.balanceConfirmed) return;
                  if (!ev.reported) return alert("건물주보고가 완료되어야 잔금확인이 가능합니다.");
                  persistUpdate(ev.supabaseId, { balanceConfirmed: true });
                  setEvents?.((prev: any[]) => prev.map((e: any) => e === ev ? { ...e, balanceConfirmed: true } : e));
                }}
                  style={{ fontSize: 10, fontWeight: 700, color: ev.balanceConfirmed ? "#9CA3AF" : "#059669", padding: "4px 10px", borderRadius: 6, border: ev.balanceConfirmed ? "1px solid #D1D5DB" : "1px solid #A7F3D0", background: ev.balanceConfirmed ? "#F3F4F6" : "#ECFDF5", cursor: ev.balanceConfirmed ? "default" : "pointer", whiteSpace: "nowrap", textDecoration: ev.balanceConfirmed ? "line-through" : "none" }}>
                  {ev.balanceConfirmed ? "✔ 잔금확인" : "잔금확인"}
                </span>
                {/* 계약서입력 */}
                {setPendingContract && setPage && (
                  <span onClick={() => {
                    if (!ev.reported) return alert("건물주보고가 완료되어야 계약서입력이 가능합니다.");
                    const vacancy = activeVacancies.find((v: any) => v.building === ev.building && String(v.room) === String(ev.room));
                    setPendingContract({ ...ev, vacancyData: vacancy || {} });
                    // 해당 건물/호실의 계약 이벤트 Supabase에서도 삭제
                    calendarEvents.filter((e: any) => e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room)).forEach((e: any) => persistDelete(e.supabaseId));
                    setEvents?.((prev: any[]) => prev.filter((e: any) => !(e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room))));
                    setPage("tenants");
                  }}
                    style={{ fontSize: 10, fontWeight: 700, color: "#92400E", padding: "4px 10px", borderRadius: 6, border: "1px solid #FDE68A", background: "#FEF3C7", cursor: "pointer", whiteSpace: "nowrap" }}>
                    계약서입력 →
                  </span>
                )}
                <div style={{ marginLeft: "auto" }} />
                {/* 계약파기 */}
                {setEvents && (
                  <span onClick={() => {
                    const bf = (buildingFloors as any)[ev.building] || {};
                    const isReported = !!ev.reported;
                    if (!isReported && ev.brokerPhone) {
                      const brokerMsg = [
                        `[${ev.building} ${ev.room}호 계약파기 안내]`,
                        ``,
                        `안녕하세요, 하우스맨입니다.`,
                        `${ev.building} ${ev.room}호 계약이 파기되었습니다.`,
                        ``,
                        `▪ 보증금: ${ev.deposit ?? 0}만원`,
                        `▪ 월세: ${ev.rent ?? 0}만원`,
                        `▪ 입주예정일: ${ev.moveIn || ev.date || "-"}`,
                        ``,
                        `해당 호실은 다시 공실로 전환됩니다.`,
                        `감사합니다.`,
                        `- 하우스맨`,
                      ].join("\n");
                      persistDelete(ev.supabaseId);
                      setEvents((prev: any[]) => prev.filter((e: any) => !(e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room))));
                      setActiveVacancies?.((prev: any[]) => prev.map((v: any) => v.building === ev.building && String(v.room) === String(ev.room) ? { ...v, status: "홍보중" } : v));
                      setBreakReport({ ev, owners: [{ name: ev.broker || "부동산", phone: ev.brokerPhone }], msgText: brokerMsg, targetBroker: true });
                      return;
                    }
                    const owners = [{ name: bf.owner || "", phone: bf.phone || "" }];
                    const ownerName = owners[0]?.name || "건물주";
                    const msgLines = [
                      `[${ev.building} ${ev.room}호 계약파기 보고]`,
                      ``,
                      `안녕하세요, ${ownerName}건물주님.`,
                      `${ev.building} ${ev.room}호 계약이 파기되었습니다.`,
                      ``,
                      `▪ 보증금: ${ev.deposit ?? 0}만원`,
                      `▪ 월세: ${ev.rent ?? 0}만원`,
                      ev.mgmt ? `▪ 관리비: ${ev.mgmt}만원` : null,
                      `▪ 입주예정일: ${ev.moveIn || ev.date || "-"}`,
                      ev.broker ? `▪ 부동산: ${ev.broker}` : null,
                      ``,
                      `※ 계약금 입금 후 파기 건입니다.`,
                      ``,
                      `감사합니다.`,
                      `- 하우스맨 드림`,
                    ].filter(Boolean);
                    persistDelete(ev.supabaseId);
                    setEvents((prev: any[]) => prev.filter((e: any) => !(e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room))));
                    setActiveVacancies?.((prev: any[]) => prev.map((v: any) => v.building === ev.building && String(v.room) === String(ev.room) ? { ...v, status: "홍보중" } : v));
                    setBreakReport({ ev, owners, msgText: msgLines.join("\n") });
                  }}
                    style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", padding: "4px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", cursor: "pointer", whiteSpace: "nowrap" }}>
                    계약파기
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
