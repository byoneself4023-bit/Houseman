import React, { useState } from 'react';
import { toast } from 'sonner';
import { buildingFloors } from '@/data';
import { getRoomType } from '@/config';
import { Card } from '@/components';
import { inputClassName } from '@/components/Field';
import { persistUpdate } from '../calendarApi';
import { resetBillingSettingsOnMoveOut } from '@/lib/billingEngine';

interface MoveOutStatusPanelProps {
  calendarEvents: Record<string, any>[];
  activeTenants: Record<string, any>[];
  activeVacancies?: Record<string, any>[];
  pastTenantsData: Record<string, any>;
  buildingData: Record<string, any>;
  setEvents?: (fn: any) => void;
  setActiveVacancies?: (fn: any) => void;
  setPage?: (v: string) => void;
  setPendingMoveout?: (v: any) => void;
  setPhotoModalTenant: (v: any) => void;
  setCheckPhotoModalTenant: (v: any) => void;
  setCompareData: (v: any) => void;
  setMoveOutMsgModal: (v: any) => void;
  setMoveOutOwnerReport: (v: any) => void;
  setExternalCheckModal?: (v: any) => void;
  setDirectInputModal?: (v: any) => void;
  setSendLinkModal?: (v: any) => void;
  openEditEvent: (evt: Record<string, any>) => void;
}

export const MoveOutStatusPanel: React.FC<MoveOutStatusPanelProps> = ({
  calendarEvents, activeTenants, activeVacancies = [], pastTenantsData, buildingData,
  setEvents, setActiveVacancies, setPage, setPendingMoveout,
  setPhotoModalTenant, setCheckPhotoModalTenant, setCompareData,
  setMoveOutMsgModal, setMoveOutOwnerReport,
  setExternalCheckModal, setDirectInputModal, setSendLinkModal,
  openEditEvent,
}) => {
  const [cleaningModal, setCleaningModal] = useState<{ origEvent: any; supabaseId?: string } | null>(null);
  const [vacantModal, setVacantModal] = useState<{ origEvent: any; ev: any } | null>(null);
  const [cleaningCheckModal, setCleaningCheckModal] = useState<{ origEvent: any; tm: any } | null>(null);
  const todayD = new Date(); todayD.setHours(23,59,59,999);
  const moveOutEvts = calendarEvents
    .filter(ev => ev.type === "퇴실" && ev.building && ev.room && new Date(ev.date) <= todayD)
    .map(ev => {
      const hk = `${ev.building}_${ev.room}`;
      const tenant = activeTenants.find((t: any) => t.building === ev.building && String(t.room) === String(ev.room));
      const pastRecords = pastTenantsData[hk] || [];
      const settled = ev.settled || (!tenant && pastRecords.length > 0);
      const pastInfo = settled ? pastRecords[pastRecords.length - 1] : null;
      const hasPhotos = ev.moveOutPhotos?.length > 0 || (tenant
        ? (tenant.moveOutPhotos && tenant.moveOutPhotos.length > 0)
        : !!(pastInfo && pastInfo.moveOutPhotos && pastInfo.moveOutPhotos.length > 0));
      const hasCheckPhotos = ev.moveOutCheckPhotos?.length > 0 || (tenant
        ? (tenant.moveOutCheckPhotos && tenant.moveOutCheckPhotos.length > 0)
        : !!(pastInfo && pastInfo.moveOutCheckPhotos && pastInfo.moveOutCheckPhotos.length > 0));
      // _holderMismatch: 임차인 이름과 예금주가 다르면 true
      const tenantName = tenant?.name || ev.name || pastInfo?.name || "";
      const _holderMismatch = ev.refundHolder && ev.refundHolder !== tenantName;
      const allDone = !!ev.vacantConfirmed;
      const tenantForModal = tenant || {
        building: ev.building, room: ev.room,
        name: tenantName,
        phone: pastInfo?.phone || "",
        moveOutPhotos: ev.moveOutPhotos || pastInfo?.moveOutPhotos || [],
        moveOutCheckPhotos: ev.moveOutCheckPhotos || pastInfo?.moveOutCheckPhotos || [],
        moveInCheckPhotos: pastInfo?.moveInCheckPhotos || [],
        _isPastTenant: true
      };
      return { ...ev, _origEvent: ev, tenant, tenantForModal, settled, pastInfo, hasPhotos, hasCheckPhotos, allDone, _holderMismatch } as any;
    })
    .filter(Boolean) as any[];

  const activeMoveOutEvts = moveOutEvts.filter((ev: any) => !ev.allDone && !ev.isCompleted);
  if (activeMoveOutEvts.length === 0) return null;

  return (
    <>
    <Card className="mb-4 border-2 border-hm-danger bg-hm-danger-bg">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-base">{"\uD83D\uDEAA"}</span>
        <div className="text-sm font-bold text-hm-danger">퇴실현황 <span className="font-semibold text-xs text-hm-text-muted">({activeMoveOutEvts.length}건)</span></div>
      </div>
      <div className="flex flex-col gap-3">
        {activeMoveOutEvts.map((ev, i) => {
          const t = ev.tenant;
          const tm = ev.tenantForModal;
          const evRoomType = getRoomType(ev.building, ev.room);
          const isShortTerm = evRoomType === "단기";
          const needsOwnerReport = evRoomType === "일반임대" || evRoomType === "근생";

          // 단기: 6단계 원형 스텝 (링크→체크→정산→청소→입주체크→공실전환)
          // 일반/근생: 기존 선형 스텝
          const mSteps = isShortTerm ? [
            { label: "퇴실링크", icon: "\uD83D\uDCE9", done: !!ev.moveOutLinkCompleted,
              sentStatus: ev.moveOutLinkSent && !ev.moveOutLinkCompleted ? "전송완료" : null,
              onClick: () => {
                const linkId = ev.supabaseId || `${ev.building}_${ev.room}_${ev.date}`;
                const link = `${window.location.origin}/move-out/${linkId}`;
                setSendLinkModal?.({ ev: ev._origEvent, link, building: ev.building, room: ev.room });
              },
              actions: setSendLinkModal ? [
                { label: "\uD83D\uDCE9 다른번호로 보내기", onClick: () => {
                  const linkId = ev.supabaseId || `${ev.building}_${ev.room}_${ev.date}`;
                  const link = `${window.location.origin}/move-out/${linkId}`;
                  setSendLinkModal({ ev: ev._origEvent, link, building: ev.building, room: ev.room });
                }},
                { label: "\uD83D\uDCDD 자동저장값 수정", onClick: () => setDirectInputModal?.({ ev: ev._origEvent, tm, tenantName: t?.name || ev.name || "", prefill: true }) },
                { label: "\u270F\uFE0F 직접입력", onClick: () => setDirectInputModal?.({ ev: ev._origEvent, tm, tenantName: t?.name || ev.name || "" }) },
              ] : undefined },
            { label: "퇴실체크", icon: "\uD83D\uDD0D", done: !!ev.externalCheckDone,
              onClick: () => {
                if (!ev.moveOutLinkCompleted) { toast.error("퇴실링크 완료 후 진행 가능합니다."); return; }
                const di = ev.deductionItems || [];
                setExternalCheckModal?.({
                  ev: ev._origEvent, tm,
                  _comments: di.map((d: any) => d.label || ""),
                  _deductions: di.map((d: any) => d.amount ? String(d.amount) : ""),
                  _deductionCount: Math.max(di.length, 3),
                  _comment: ev.externalCheckComment || "",
                  _meterElec: ev.meterElec || "",
                  _meterGas: ev.meterGas || "",
                  _issues: ev.repairType ? Object.fromEntries((ev.repairType || "").split(", ").map((k: string) => [k, true])) : {},
                });
              },
              extraIcon: ev.externalCheckDone && ev.hasPhotos ? { icon: "\uD83D\uDD0D", onClick: () => setCompareData({ building: ev.building, room: ev.room, moveInCheckPhotos: tm.moveInCheckPhotos || [], moveOutPhotos: tm.moveOutPhotos || [] }) } : null },
            { label: "정산서", icon: "\uD83D\uDCCB", done: ev.settled,
              onClick: () => {
                if (!ev.externalCheckDone) { toast.error("퇴실체크 완료 후 정산서 작성이 가능합니다."); return; }
                if (ev._holderMismatch) toast.warning(`⚠️ 임차인 이름과 예금주가 다릅니다.\n임차인: ${t?.name || ev.name || "—"} / 예금주: ${ev.refundHolder}`);
                setPendingMoveout?.({ building: ev.building, room: ev.room });
                setPage?.("tenants");
              }},
            { label: "청소", icon: "\uD83E\uDDF9", done: !!ev.cleaningDone,
              onClick: () => {
                if (!ev.externalCheckDone) {
                  setCleaningCheckModal({ origEvent: ev._origEvent, tm });
                  return;
                }
                setCleaningModal({ origEvent: ev._origEvent, supabaseId: ev._origEvent?.supabaseId });
              }},
            { label: "입주체크", icon: "\uD83D\uDCF7", done: ev.hasCheckPhotos,
              onClick: () => {
                if (!ev.cleaningDone) { toast.error("청소 완료 후 입주체크사진을 등록할 수 있습니다."); return; }
                setCheckPhotoModalTenant(tm);
              }},
            { label: "공실전환", icon: "\uD83C\uDFE0", done: !!ev.vacantConfirmed,
              onClick: () => {
                if (!ev.settled) { toast.error("정산서 완료가 필요합니다."); return; }
                if (!ev.hasCheckPhotos) { toast.error("입주체크사진 등록이 필요합니다."); return; }
                setVacantModal({ origEvent: ev._origEvent, ev });
              }},
          ] : [
            { label: "퇴실문자", done: !!ev.moveOutMsg },
            { label: "비밀번호", done: !!ev.doorPassword },
            { label: "퇴실사진", done: ev.hasPhotos },
            { label: "정산서", done: ev.settled },
            ...(needsOwnerReport ? [{ label: "건물주연락", done: !!ev.ownerReported }] : []),
            { label: "입주체크사진", done: ev.hasCheckPhotos },
          ];

          const mDone = mSteps.filter((s: any) => s.done).length;
          const allDone = mDone === mSteps.length;
          const currentStep = mSteps.findIndex((s: any) => !s.done);

          return (
            <div key={i} className={`rounded-lg overflow-hidden transition-all duration-300 ${allDone ? 'bg-hm-bg-hover border border-gray-300 grayscale opacity-70' : 'bg-white border border-red-200'}`}
              onDoubleClick={() => { if (setEvents) openEditEvent(ev); }}>
              {/* 스텝 인디케이터 */}
              <div className={`px-4 py-2.5 flex items-center gap-0 ${allDone ? 'bg-gray-100 border-b border-gray-300' : 'border-b border-red-200'}`}
                style={!allDone ? { background: "linear-gradient(90deg, var(--color-hm-danger-bg), #FFF8F8)" } : undefined}>
                <div className="flex flex-col mr-3 whitespace-nowrap">
                  <span className={`text-xs font-bold ${allDone ? 'text-gray-400' : 'text-hm-danger'}`}>{ev.building} {ev.room}호
                    <span className="text-xs font-bold px-1.5 py-px rounded ml-1 align-middle"
                      style={{
                        background: evRoomType === "단기" ? "#FEF3C7" : evRoomType === "근생" ? "#D1FAE5" : "#DBEAFE",
                        color: evRoomType === "단기" ? "#92400E" : evRoomType === "근생" ? "#065F46" : "#1E40AF",
                      }}>{evRoomType}</span>
                  </span>
                  <span className={`text-xs ${allDone ? 'text-[#B0B5C1]' : 'text-hm-text-muted'}`}>{ev.date} · {ev.name || (t ? t.name : ev.pastInfo?.name || "\u2014")}</span>
                </div>
                <div className="flex-1 flex items-center">
                  {mSteps.map((step: any, si: number) => {
                    const isActive = si === currentStep;
                    const stepDone = step.done;
                    return (
                      <div key={si} className="flex items-center flex-1"
                        onClick={() => { if (step.onClick) step.onClick(); }}>
                        <div className={`flex flex-col items-center gap-0.5 min-w-[52px] relative ${step.onClick ? 'cursor-pointer' : 'cursor-default'}`}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                            style={{
                              background: stepDone ? (allDone ? "#9CA3AF" : "var(--color-hm-danger)") : isActive ? "#fff" : "#E5E7EB",
                              color: stepDone ? "#fff" : isActive ? "var(--color-hm-danger)" : "#9CA3AF",
                              border: isActive && !stepDone ? "2px solid var(--color-hm-danger)" : "2px solid transparent",
                              boxShadow: isActive && !stepDone ? "0 0 0 3px rgba(220,38,38,0.2)" : "none",
                              animation: isActive && !stepDone && !allDone ? "hm-blink 1.2s ease-in-out infinite" : "none",
                            }}>
                            {stepDone ? "\u2713" : (step.icon || String(si + 1))}
                          </div>
                          <span className="text-xs whitespace-nowrap"
                            style={{
                              fontWeight: stepDone || isActive ? 700 : 500,
                              color: stepDone ? (allDone ? "#9CA3AF" : "var(--color-hm-danger)") : isActive ? "#B91C1C" : "#9CA3AF",
                              animation: isActive && !stepDone && !allDone ? "hm-blink 1.2s ease-in-out infinite" : "none",
                            }}>{step.label}</span>
                          {step.sentStatus && (
                            <span className="text-[7px] font-bold text-amber-500 whitespace-nowrap">📩 {step.sentStatus}</span>
                          )}
                          {/* 단기 퇴실링크: 액션 드롭다운 아이콘 */}
                          {step.actions && (
                            <span className="absolute -top-1 right-px text-base cursor-pointer leading-none"
                              style={{ animation: "hm-wobble 1s ease-in-out infinite", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
                              onClick={(e) => { e.stopPropagation(); step.actions[2]?.onClick(); }}>
                              {"\u270F\uFE0F"}
                            </span>
                          )}
                          {/* extraIcon (사진비교 등) */}
                          {step.extraIcon && (
                            <span onClick={(e) => { e.stopPropagation(); step.extraIcon.onClick(); }}
                              className="absolute -top-1 left-px text-xs cursor-pointer">
                              {step.extraIcon.icon}
                            </span>
                          )}
                        </div>
                        {si < mSteps.length - 1 && (
                          <div className="flex-1 h-0.5 mx-0.5 mb-4 rounded-sm transition-colors duration-300"
                            style={{ background: stepDone ? (allDone ? "#D1D5DB" : "var(--color-hm-danger)") : "#E5E7EB" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 액션 버튼 행 — 일반/근생만 (단기는 원형 스텝에서 처리) */}
              {!isShortTerm && (
                <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
                  {/* 입주사진 보기 */}
                  {(tm.moveInCheckPhotos && tm.moveInCheckPhotos.length > 0) ? (
                    <span onClick={() => setCheckPhotoModalTenant({ ...tm, _viewModeOnly: "moveIn" })}
                      className="text-xs font-bold text-hm-success px-2.5 py-1 rounded-md border border-emerald-200 bg-hm-success-bg cursor-pointer hover:opacity-80 transition-opacity">
                      {"\uD83C\uDFE0"} 입주사진 ({tm.moveInCheckPhotos.length})
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[#C4C7CF] px-2.5 py-1 rounded-md border border-gray-200 bg-hm-bg-hover">{"\uD83C\uDFE0"} 입주사진 없음</span>
                  )}
                  {/* 퇴실문자 */}
                  {ev.moveOutMsg ? (
                    <span onClick={(e) => { e.stopPropagation(); setMoveOutMsgModal({ ev, text: ev.moveOutMsg }); }}
                      className="text-xs font-bold text-gray-400 px-2.5 py-1 rounded-md border border-gray-300 bg-gray-100 cursor-pointer line-through hover:opacity-80 transition-opacity">{"\u2714"} 퇴실문자</span>
                  ) : (
                    <span onClick={(e) => { e.stopPropagation(); setMoveOutMsgModal({ ev, text: "" }); }}
                      className="text-xs font-bold text-white px-2.5 py-1 rounded-md bg-amber-500 cursor-pointer whitespace-nowrap hover:bg-amber-600 transition-colors">
                      {"\uD83D\uDCE9"} 퇴실문자
                    </span>
                  )}
                  {/* 비밀번호 */}
                  {ev.doorPassword ? (
                    <span className="text-xs font-bold text-gray-400 px-2.5 py-1 rounded-md border border-gray-300 bg-gray-100 line-through">{"\u2714"} 비번 {ev.doorPassword}</span>
                  ) : (
                    <span className="text-xs font-semibold text-[#C4C7CF] px-2.5 py-1 rounded-md border border-gray-200 bg-hm-bg-hover">비밀번호 {"\u2014"}</span>
                  )}
                  {/* 퇴실사진 */}
                  {ev.hasPhotos ? (
                    <span onClick={() => setPhotoModalTenant(tm)}
                      className="text-xs font-bold text-gray-400 px-2.5 py-1 rounded-md border border-gray-300 bg-gray-100 cursor-pointer line-through hover:opacity-80 transition-opacity">{"\u2714"} 퇴실사진</span>
                  ) : (
                    <span onClick={() => setPhotoModalTenant(tm)}
                      className="text-xs font-bold text-white px-2.5 py-1 rounded-md bg-hm-danger cursor-pointer hover:bg-red-700 transition-colors">
                      {"\uD83D\uDCF7"} 퇴실사진
                    </span>
                  )}
                  {/* 건물주연락 (일반임대/근생만) */}
                  {needsOwnerReport && (
                    ev.ownerReported ? (
                      <span onClick={() => {
                        const bd = buildingData[ev.building] || {};
                        const bf = (buildingFloors as any)[ev.building] || {};
                        const owners = bd.owners && bd.owners.length > 0 && bd.owners[0].name ? bd.owners : [{ name: bf.owner || "", phone: bf.phone || "" }];
                        setMoveOutOwnerReport({ ev, owners, msgText: ev.ownerReportMsg || "" });
                      }}
                        className="text-xs font-bold text-gray-400 px-2.5 py-1 rounded-md border border-gray-300 bg-gray-100 cursor-pointer line-through hover:opacity-80 transition-opacity">{"\u2714"} 건물주연락</span>
                    ) : (
                      <span onClick={() => {
                        if (!ev.settled) { toast.error("정산서가 완료되어야 건물주연락이 가능합니다."); return; }
                        const bd = buildingData[ev.building] || {};
                        const bf = (buildingFloors as any)[ev.building] || {};
                        const owners = bd.owners && bd.owners.length > 0 && bd.owners[0].name ? bd.owners : [{ name: bf.owner || "", phone: bf.phone || "" }];
                        const ownerName = owners[0]?.name || "건물주";
                        const hk = `${ev.building}_${ev.room}`;
                        const pastRecs = pastTenantsData[hk] || [];
                        const lastRec = Array.isArray(pastRecs) ? pastRecs[pastRecs.length - 1] : null;
                        const deposit = lastRec?.deposit || t?.deposit || 0;
                        const rent = lastRec?.rent || t?.rent || 0;
                        const refundTotal = lastRec?.refundTotal ?? "";
                        const msgLines = [
                          `[${ev.building} ${ev.room}호 퇴실정산 안내]`,
                          ``,
                          `안녕하세요, ${ownerName}건물주님.`,
                          `${ev.building} ${ev.room}호 퇴실정산이 완료되었습니다.`,
                          ``,
                          `\u25AA 세입자: ${ev.name || t?.name || lastRec?.name || "\u2014"}`,
                          `\u25AA 퇴실일: ${ev.date || "\u2014"}`,
                          `\u25AA 보증금: ${deposit ? deposit.toLocaleString() + "원" : "\u2014"}`,
                          `\u25AA 월세: ${rent ? rent.toLocaleString() + "원" : "\u2014"}`,
                          refundTotal !== "" ? `\u25AA 정산금: ${Number(refundTotal).toLocaleString()}원` : null,
                          ``,
                          `감사합니다.`,
                          `- 하우스맨 드림`,
                        ].filter(Boolean);
                        setMoveOutOwnerReport({ ev, owners, msgText: msgLines.join("\n") });
                      }}
                        className="text-xs font-bold text-white px-2.5 py-1 rounded-md bg-violet-600 cursor-pointer whitespace-nowrap hover:bg-violet-700 transition-colors">
                        {"\uD83D\uDCDE"} 건물주연락
                      </span>
                    )
                  )}
                  {/* 입주체크사진 */}
                  {ev.hasCheckPhotos ? (
                    <span onClick={() => setCheckPhotoModalTenant(tm)}
                      className="text-xs font-bold text-gray-400 px-2.5 py-1 rounded-md border border-gray-300 bg-gray-100 cursor-pointer line-through hover:opacity-80 transition-opacity">{"\u2714"} 입주체크사진</span>
                  ) : (
                    <span onClick={() => setCheckPhotoModalTenant(tm)}
                      className="text-xs font-bold text-white px-2.5 py-1 rounded-md bg-amber-500 cursor-pointer hover:bg-amber-600 transition-colors">
                      {"\uD83D\uDCF7"} 입주체크사진
                    </span>
                  )}
                  {/* 사진비교 */}
                  {ev.hasPhotos && (
                    <span onClick={() => setCompareData({ building: ev.building, room: ev.room, moveInCheckPhotos: tm.moveInCheckPhotos || [], moveOutPhotos: tm.moveOutPhotos || [] })}
                      className="text-xs font-bold text-indigo-500 px-2.5 py-1 rounded-md border border-indigo-200 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors">
                      {"\uD83D\uDD0D"} 비교
                    </span>
                  )}
                  <div className="ml-auto" />
                  {/* 퇴실정산서 (맨 오른쪽) */}
                  {ev.settled ? (
                    <span className="text-xs font-bold text-gray-400 px-2.5 py-1 rounded-md border border-gray-300 bg-gray-100 line-through">{"\u2714"} 정산완료</span>
                  ) : t && setPage && ev.hasPhotos ? (
                    <span onClick={() => { setPendingMoveout?.({ building: ev.building, room: ev.room }); setPage("tenants"); }}
                      className="text-xs font-bold text-white px-2.5 py-1 rounded-md bg-hm-danger cursor-pointer whitespace-nowrap hover:bg-red-700 transition-colors">
                      정산서 {"\u2192"}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400 px-2.5 py-1 rounded-md border border-gray-200 bg-hm-bg-hover">정산 대기</span>
                  )}
                </div>
              )}

              {/* 단기 퇴실: 예금주 불일치 경고 */}
              {isShortTerm && ev._holderMismatch && (
                <div className="px-4 py-1.5 text-xs text-amber-700 bg-amber-50 border-t border-amber-200">
                  {"\u26A0\uFE0F"} 예금주 불일치: 임차인 [{t?.name || ev.name}] vs 예금주 [{ev.refundHolder}]
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>

    {/* 청소 완료 모달 */}
    {cleaningModal && (
      <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center"
        onMouseDown={() => setCleaningModal(null)}>
        <div className="bg-white rounded-2xl p-6 w-[380px] shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
          onMouseDown={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <div className="text-base font-bold text-hm-text">🧹 청소 완료</div>
            <button onClick={() => setCleaningModal(null)} className="bg-transparent border-none text-xl cursor-pointer text-hm-text-muted hover:text-hm-text transition-colors">✕</button>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs font-bold text-hm-text-sub mb-[3px]">청소비 가중치</div>
              <input id="cl-fee" placeholder="없으면 빈칸" className={`${inputClassName} !py-2 !px-2.5 !text-xs`} />
            </div>
            <div>
              <div className="text-xs font-bold text-hm-text-sub mb-[3px]">청소 코멘트</div>
              <input id="cl-comment" placeholder="없으면 빈칸" className={`${inputClassName} !py-2 !px-2.5 !text-xs`} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setCleaningModal(null)}
              className="px-5 py-2 rounded-lg border border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
              취소
            </button>
            <button onClick={() => {
              const fee = (document.getElementById("cl-fee") as HTMLInputElement)?.value;
              const comment = (document.getElementById("cl-comment") as HTMLInputElement)?.value;
              const cleaningPatch = { cleaningDone: true, cleaningFeeExtra: fee || null, cleaningComment: comment || null };
              persistUpdate(cleaningModal.supabaseId, cleaningPatch);
              setEvents?.((prev: any[]) => prev.map((e: any) => e === cleaningModal.origEvent ? { ...e, ...cleaningPatch } : e));
              setCleaningModal(null);
            }}
              className="px-5 py-2 rounded-lg border-none bg-hm-blue text-white font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-blue-dark transition-colors">
              완료
            </button>
          </div>
        </div>
      </div>
    )}

    {/* 공실전환 확인 모달 */}
    {vacantModal && (
      <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center"
        onMouseDown={() => setVacantModal(null)}>
        <div className="bg-white rounded-2xl p-6 w-[380px] shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
          onMouseDown={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <div className="text-base font-bold text-hm-text">🏠 공실 전환</div>
            <button onClick={() => setVacantModal(null)} className="bg-transparent border-none text-xl cursor-pointer text-hm-text-muted hover:text-hm-text transition-colors">✕</button>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed">
            공실로 전환하시겠습니까?<br />
            금액체크 상태로 공실에 등록됩니다.
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setVacantModal(null)}
              className="px-5 py-2 rounded-lg border border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
              취소
            </button>
            <button onClick={() => {
              const { origEvent, ev } = vacantModal;
              const vacantPatch = { vacantConfirmed: true, isCompleted: true };
              persistUpdate(origEvent?.supabaseId, vacantPatch);
              setEvents?.((prev: any[]) => prev.map((e: any) => e === origEvent ? { ...e, ...vacantPatch } : e));
              setActiveVacancies?.((prev: any[]) => {
                const exists = prev.some((v: any) => v.building === ev.building && String(v.room) === String(ev.room));
                if (exists) return prev.map((v: any) => v.building === ev.building && String(v.room) === String(ev.room) ? { ...v, status: "금액체크" } : v);
                return [...prev, { building: ev.building, room: ev.room, type: "단기", status: "금액체크", deposit: "", rent: "", managementFee: "" }];
              });
              // billing_settings 리셋 (Supabase)
              const tenant = activeTenants.find((t: any) => t.building === ev.building && String(t.room) === String(ev.room));
              if (tenant?.roomId || tenant?.room_id) {
                resetBillingSettingsOnMoveOut(tenant.roomId || tenant.room_id).catch(console.error);
              }
              toast.success(`${ev.building} ${ev.room}호 공실 전환 완료`);
              setVacantModal(null);
            }}
              className="px-5 py-2 rounded-lg border-none bg-hm-blue text-white font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-blue-dark transition-colors">
              확인
            </button>
          </div>
        </div>
      </div>
    )}

    {/* 청소팀 퇴실체크 확인 모달 */}
    {cleaningCheckModal && (
      <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center"
        onMouseDown={() => setCleaningCheckModal(null)}>
        <div className="bg-white rounded-2xl p-6 w-[380px] shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
          onMouseDown={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <div className="text-base font-bold text-hm-text">🔍 퇴실체크</div>
            <button onClick={() => setCleaningCheckModal(null)} className="bg-transparent border-none text-xl cursor-pointer text-hm-text-muted hover:text-hm-text transition-colors">✕</button>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed">
            퇴실체크가 완료되지 않았습니다.<br />
            청소팀이 퇴실체크를 대신 진행하시겠습니까?
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setCleaningCheckModal(null)}
              className="px-5 py-2 rounded-lg border border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
              취소
            </button>
            <button onClick={() => {
              setExternalCheckModal?.({ ev: cleaningCheckModal.origEvent, tm: cleaningCheckModal.tm });
              setCleaningCheckModal(null);
            }}
              className="px-5 py-2 rounded-lg border-none bg-hm-blue text-white font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-blue-dark transition-colors">
              확인
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
