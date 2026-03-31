import React from 'react';
import { toast } from 'sonner';
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
    <Card className="mb-4 border-2 border-hm-blue bg-hm-blue-bg">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-base">📦</span>
        <div className="text-[13px] font-extrabold text-hm-blue">계약현황 <span className="font-semibold text-[11px] text-hm-text-muted">({contractEvts.length}건)</span></div>
      </div>
      <div className="flex flex-col gap-3">
        {contractEvts.map((ev, i) => {
          const cSteps = [
            { label: "계약금확인", done: !!ev.depositConfirmed },
            { label: "건물주보고", done: !!ev.reported },
            { label: "잔금확인", done: !!ev.balanceConfirmed },
            { label: "계약서입력", done: !!ev.contractEntered },
            { label: "최종납부", done: !!ev.finalPaymentConfirmed },
            { label: "인테리어", done: !!ev.interiorManaged },
            { label: "중개료송금", done: !!ev.brokerFeeSent },
          ];
          const cDone = cSteps.filter(s => s.done).length;
          const allDone = cDone === cSteps.length;
          const currentStep = cSteps.findIndex(s => !s.done);
          return (
            <div key={i}
              className={`rounded-[10px] overflow-hidden transition-all duration-300 ${
                allDone
                  ? 'bg-hm-bg-hover border border-[#D1D5DB] grayscale opacity-70'
                  : 'bg-white border border-[#BFDBFE]'
              }`}
              onDoubleClick={() => openEditEvent(ev)}>
              {/* 스텝 인디케이터 */}
              <div className={`px-4 py-2.5 flex items-center gap-0 ${
                allDone
                  ? 'bg-[#F3F4F6] border-b border-[#D1D5DB]'
                  : 'border-b border-[#BFDBFE]'
              }`}
                style={{ background: allDone ? undefined : "linear-gradient(90deg, #EFF6FF, #F8FAFF)" }}>
                <div className={`text-[11px] font-bold mr-1.5 whitespace-nowrap ${allDone ? 'text-[#9CA3AF]' : 'text-hm-blue'}`}>{ev.building} {ev.room}호</div>
                {ev.registeredSource === "broker"
                  ? <span className="text-[9px] font-bold py-0.5 px-1.5 bg-[#EC4899] text-white rounded-[3px] mr-1.5 whitespace-nowrap">부동산</span>
                  : <span className="text-[9px] font-bold py-0.5 px-1.5 bg-[#6B7280] text-white rounded-[3px] mr-1.5 whitespace-nowrap">직접</span>
                }
                <div className="flex-1 flex items-center">
                  {cSteps.map((step, si) => {
                    const isActive = si === currentStep;
                    const stepDone = step.done;
                    return (
                      <div key={si} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-0.5 min-w-[56px]">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all duration-300"
                            style={{
                              background: stepDone ? (allDone ? "#9CA3AF" : "#3B82F6") : isActive ? "#fff" : "#E5E7EB",
                              color: stepDone ? "#fff" : isActive ? "#3B82F6" : "#9CA3AF",
                              border: isActive && !stepDone ? "2px solid #3B82F6" : "2px solid transparent",
                              boxShadow: isActive && !stepDone ? "0 0 0 3px rgba(59,130,246,0.2)" : "none",
                              animation: isActive && !stepDone && !allDone ? "hm-blink 1.2s ease-in-out infinite" : "none",
                            }}>
                            {stepDone ? "✓" : si + 1}
                          </div>
                          <span className="text-[9px] whitespace-nowrap"
                            style={{
                              fontWeight: stepDone || isActive ? 700 : 500,
                              color: stepDone ? (allDone ? "#9CA3AF" : "#3B82F6") : isActive ? "#1D4ED8" : "#9CA3AF",
                              animation: isActive && !stepDone && !allDone ? "hm-blink 1.2s ease-in-out infinite" : "none",
                            }}>{step.label}</span>
                        </div>
                        {si < cSteps.length - 1 && (
                          <div className="flex-1 h-0.5 mx-1 mb-4 rounded-[1px] transition-colors duration-300"
                            style={{ background: stepDone ? (allDone ? "#D1D5DB" : "#3B82F6") : "#E5E7EB" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* 액션 버튼 행 */}
              <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
                {/* 계약금 확인 */}
                <span onClick={() => {
                  if (ev.depositConfirmed) return;
                  persistUpdate(ev.supabaseId, { depositConfirmed: true });
                  setEvents?.((prev: any[]) => prev.map((e: any) => e === ev ? { ...e, depositConfirmed: true } : e));
                }}
                  className={`text-[10px] font-bold py-1 px-2.5 rounded-md whitespace-nowrap transition-colors ${
                    ev.depositConfirmed
                      ? 'text-[#9CA3AF] border border-[#D1D5DB] bg-[#F3F4F6] cursor-default line-through'
                      : 'text-[#0369A1] border border-[#BAE6FD] bg-[#F0F9FF] cursor-pointer hover:bg-[#E0F2FE]'
                  }`}>
                  {ev.depositConfirmed ? "✔ 계약금확인" : "계약금 확인"}
                </span>
                {/* 건물주보고 */}
                <span onClick={() => {
                  if (ev.reported) return;
                  if (!ev.depositConfirmed) { toast.error("계약금 확인이 완료되어야 건물주보고가 가능합니다."); return; }
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
                  className={`text-[10px] font-bold py-1 px-2.5 rounded-md whitespace-nowrap transition-colors ${
                    ev.reported
                      ? 'text-[#9CA3AF] border border-[#D1D5DB] bg-[#F3F4F6] cursor-default line-through'
                      : 'text-[#7C3AED] border border-[#DDD6FE] bg-[#F5F3FF] cursor-pointer hover:bg-[#EDE9FE]'
                  }`}>
                  {ev.reported ? "✔ 건물주보고" : "건물주보고"}
                </span>
                {/* 잔금확인 */}
                <span onClick={() => {
                  if (ev.balanceConfirmed) return;
                  if (!ev.reported) { toast.error("건물주보고가 완료되어야 잔금확인이 가능합니다."); return; }
                  persistUpdate(ev.supabaseId, { balanceConfirmed: true });
                  setEvents?.((prev: any[]) => prev.map((e: any) => e === ev ? { ...e, balanceConfirmed: true } : e));
                }}
                  className={`text-[10px] font-bold py-1 px-2.5 rounded-md whitespace-nowrap transition-colors ${
                    ev.balanceConfirmed
                      ? 'text-[#9CA3AF] border border-[#D1D5DB] bg-[#F3F4F6] cursor-default line-through'
                      : 'text-hm-success border border-[#A7F3D0] bg-hm-success-bg cursor-pointer hover:bg-[#D1FAE5]'
                  }`}>
                  {ev.balanceConfirmed ? "✔ 잔금확인" : "잔금확인"}
                </span>
                {/* 계약서입력 */}
                {setPendingContract && setPage && (
                  <span onClick={() => {
                    if (!ev.reported) { toast.error("건물주보고가 완료되어야 계약서입력이 가능합니다."); return; }
                    const vacancy = activeVacancies.find((v: any) => v.building === ev.building && String(v.room) === String(ev.room));
                    setPendingContract({ ...ev, vacancyData: vacancy || {} });
                    calendarEvents.filter((e: any) => e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room)).forEach((e: any) => persistDelete(e.supabaseId));
                    setEvents?.((prev: any[]) => prev.filter((e: any) => !(e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room))));
                    setPage("tenants");
                  }}
                    className="text-[10px] font-bold text-[#92400E] py-1 px-2.5 rounded-md border border-[#FDE68A] bg-[#FEF3C7] cursor-pointer whitespace-nowrap hover:bg-[#FDE68A] transition-colors">
                    계약서입력 →
                  </span>
                )}
                {/* 최종납부 확인 */}
                <span onClick={() => {
                  if (ev.finalPaymentConfirmed) return;
                  if (!ev.balanceConfirmed) { toast.error("잔금확인이 완료되어야 최종납부확인이 가능합니다."); return; }
                  persistUpdate(ev.supabaseId, { finalPaymentConfirmed: true });
                  setEvents?.((prev: any[]) => prev.map((e: any) => e === ev ? { ...e, finalPaymentConfirmed: true } : e));
                }}
                  className={`text-[10px] font-bold py-1 px-2.5 rounded-md whitespace-nowrap transition-colors ${
                    ev.finalPaymentConfirmed
                      ? 'text-[#9CA3AF] border border-[#D1D5DB] bg-[#F3F4F6] cursor-default line-through'
                      : 'text-[#0369A1] border border-[#BAE6FD] bg-[#F0F9FF] cursor-pointer hover:bg-[#E0F2FE]'
                  }`}>
                  {ev.finalPaymentConfirmed ? "✔ 최종납부" : "최종납부"}
                </span>
                {/* 인테리어 관리 */}
                <span onClick={() => {
                  if (ev.interiorManaged) return;
                  persistUpdate(ev.supabaseId, { interiorManaged: true });
                  setEvents?.((prev: any[]) => prev.map((e: any) => e === ev ? { ...e, interiorManaged: true } : e));
                }}
                  className={`text-[10px] font-bold py-1 px-2.5 rounded-md whitespace-nowrap transition-colors ${
                    ev.interiorManaged
                      ? 'text-[#9CA3AF] border border-[#D1D5DB] bg-[#F3F4F6] cursor-default line-through'
                      : 'text-[#7C3AED] border border-[#DDD6FE] bg-[#F5F3FF] cursor-pointer hover:bg-[#EDE9FE]'
                  }`}>
                  {ev.interiorManaged ? "✔ 인테리어" : "인테리어"}
                </span>
                {/* 중개료 송금 */}
                <span onClick={() => {
                  if (ev.brokerFeeSent) return;
                  persistUpdate(ev.supabaseId, { brokerFeeSent: true });
                  setEvents?.((prev: any[]) => prev.map((e: any) => e === ev ? { ...e, brokerFeeSent: true } : e));
                }}
                  className={`text-[10px] font-bold py-1 px-2.5 rounded-md whitespace-nowrap transition-colors ${
                    ev.brokerFeeSent
                      ? 'text-[#9CA3AF] border border-[#D1D5DB] bg-[#F3F4F6] cursor-default line-through'
                      : 'text-hm-success border border-[#A7F3D0] bg-hm-success-bg cursor-pointer hover:bg-[#D1FAE5]'
                  }`}>
                  {ev.brokerFeeSent ? "✔ 중개료" : "중개료송금"}
                </span>
                <div className="ml-auto" />
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
                    className="text-[10px] font-bold text-hm-danger py-1 px-2.5 rounded-md border border-[#FECACA] bg-hm-danger-bg cursor-pointer whitespace-nowrap hover:bg-[#FEE2E2] transition-colors">
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
