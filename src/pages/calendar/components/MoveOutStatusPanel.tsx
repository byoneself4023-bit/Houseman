import React from 'react';
import { buildingFloors } from '@/data';
import { getRoomType } from '@/config';
import { Card } from '@/components';
import { persistUpdate } from '../calendarApi';

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
  const todayD = new Date(); todayD.setHours(23,59,59,999);
  const moveOutEvts = calendarEvents
    .filter(ev => ev.type === "퇴실" && ev.building && ev.room && new Date(ev.date) <= todayD)
    .map(ev => {
      const hk = `${ev.building}_${ev.room}`;
      const tenant = activeTenants.find((t: any) => t.building === ev.building && String(t.room) === String(ev.room));
      const pastRecords = pastTenantsData[hk] || [];
      const settled = !tenant && pastRecords.length > 0;
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
      const allDone = hasPhotos && hasCheckPhotos && settled;
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

  const activeMoveOutEvts = moveOutEvts.filter((ev: any) => !ev.allDone);
  if (activeMoveOutEvts.length === 0) return null;

  return (
    <Card style={{ marginBottom: 16, border: "2px solid #DC2626", background: "#FEF2F2" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>{"\uD83D\uDEAA"}</span>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#DC2626" }}>퇴실현황 <span style={{ fontWeight: 600, fontSize: 11, color: "#8F95A3" }}>({activeMoveOutEvts.length}건)</span></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                if (!ev.moveOutLinkCompleted) return alert("퇴실링크 완료 후 진행 가능합니다.");
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
                if (!ev.externalCheckDone) return alert("퇴실체크 완료 후 정산서 작성이 가능합니다.");
                if (ev._holderMismatch) alert(`\u26A0\uFE0F 임차인 이름과 예금주가 다릅니다.\n\n임차인: ${t?.name || ev.name || "\u2014"}\n예금주: ${ev.refundHolder}\n계좌: ${ev.refundBank} ${ev.refundAccount}\n\n정산서 작성 시 확인해주세요.`);
                setPendingMoveout?.({ building: ev.building, room: ev.room });
                setPage?.("tenants");
              }},
            { label: "청소", icon: "\uD83E\uDDF9", done: !!ev.cleaningDone,
              onClick: () => {
                if (!ev.externalCheckDone) {
                  if (confirm("퇴실체크가 완료되지 않았습니다.\n청소팀이 퇴실체크를 대신 진행하시겠습니까?")) {
                    setExternalCheckModal?.({ ev: ev._origEvent, tm });
                  }
                  return;
                }
                const fee = prompt("청소비 가중치 (없으면 빈칸):");
                const comment = prompt("청소 코멘트 (없으면 빈칸):");
                const cleaningPatch = { cleaningDone: true, cleaningFeeExtra: fee || null, cleaningComment: comment || null };
                persistUpdate(ev._origEvent?.supabaseId, cleaningPatch);
                setEvents?.((prev: any[]) => prev.map((e: any) => e === ev._origEvent ? { ...e, ...cleaningPatch } : e));
              }},
            { label: "입주체크", icon: "\uD83D\uDCF7", done: ev.hasCheckPhotos,
              onClick: () => {
                if (!ev.cleaningDone) return alert("청소 완료 후 입주체크사진을 등록할 수 있습니다.");
                setCheckPhotoModalTenant(tm);
              }},
            { label: "공실전환", icon: "\uD83C\uDFE0", done: !!ev.vacantConfirmed,
              onClick: () => {
                if (!ev.settled) return alert("정산서 완료가 필요합니다.");
                if (!ev.hasCheckPhotos) return alert("입주체크사진 등록이 필요합니다.");
                if (confirm("공실로 전환하시겠습니까? (금액체크 상태로 공실에 등록됩니다)")) {
                  const vacantPatch = { vacantConfirmed: true, isCompleted: true };
                  persistUpdate(ev._origEvent?.supabaseId, vacantPatch);
                  setEvents?.((prev: any[]) => prev.map((e: any) => e === ev._origEvent ? { ...e, ...vacantPatch } : e));
                  setActiveVacancies?.((prev: any[]) => [...prev, { building: ev.building, room: ev.room, type: "단기", status: "금액체크", deposit: "", rent: "", managementFee: "" }]);
                }
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
            <div key={i} style={{ background: allDone ? "#F9FAFB" : "#fff", border: allDone ? "1px solid #D1D5DB" : "1px solid #FECACA", borderRadius: 10, overflow: "hidden", filter: allDone ? "grayscale(1)" : "none", opacity: allDone ? 0.7 : 1, transition: "all 0.3s" }}
              onDoubleClick={() => { if (setEvents) openEditEvent(ev); }}>
              {/* 스텝 인디케이터 */}
              <div style={{ padding: "10px 16px", background: allDone ? "#F3F4F6" : "linear-gradient(90deg, #FEF2F2, #FFF8F8)", borderBottom: allDone ? "1px solid #D1D5DB" : "1px solid #FECACA", display: "flex", alignItems: "center", gap: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", marginRight: 12, whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: allDone ? "#9CA3AF" : "#DC2626" }}>{ev.building} {ev.room}호</span>
                  <span style={{ fontSize: 9, color: allDone ? "#B0B5C1" : "#8F95A3" }}>{ev.date} · {ev.name || (t ? t.name : ev.pastInfo?.name || "\u2014")}</span>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  {mSteps.map((step: any, si: number) => {
                    const isActive = si === currentStep;
                    const stepDone = step.done;
                    return (
                      <div key={si} style={{ display: "flex", alignItems: "center", flex: 1 }}
                        onClick={() => { if (step.onClick && !stepDone) step.onClick(); }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 52, cursor: step.onClick ? "pointer" : "default", position: "relative" }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 800,
                            background: stepDone ? (allDone ? "#9CA3AF" : "#DC2626") : isActive ? "#fff" : "#E5E7EB",
                            color: stepDone ? "#fff" : isActive ? "#DC2626" : "#9CA3AF",
                            border: isActive && !stepDone ? "2px solid #DC2626" : "2px solid transparent",
                            boxShadow: isActive && !stepDone ? "0 0 0 3px rgba(220,38,38,0.2)" : "none",
                            animation: isActive && !stepDone && !allDone ? "hm-blink 1.2s ease-in-out infinite" : "none",
                            transition: "all 0.3s"
                          }}>
                            {stepDone ? "\u2713" : (step.icon || String(si + 1))}
                          </div>
                          <span style={{ fontSize: 9, fontWeight: stepDone || isActive ? 700 : 500, color: stepDone ? (allDone ? "#9CA3AF" : "#DC2626") : isActive ? "#B91C1C" : "#9CA3AF", whiteSpace: "nowrap", animation: isActive && !stepDone && !allDone ? "hm-blink 1.2s ease-in-out infinite" : "none" }}>{step.label}</span>
                          {/* 단기 퇴실링크: 액션 드롭다운 아이콘 */}
                          {step.actions && stepDone && (
                            <span style={{ position: "absolute", top: -4, right: 1, fontSize: 16, cursor: "pointer", animation: "hm-wobble 1s ease-in-out infinite", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))", lineHeight: 1 }}
                              onClick={(e) => { e.stopPropagation(); step.actions[2]?.onClick(); }}>
                              {"\u270F\uFE0F"}
                            </span>
                          )}
                          {/* extraIcon (사진비교 등) */}
                          {step.extraIcon && (
                            <span onClick={(e) => { e.stopPropagation(); step.extraIcon.onClick(); }}
                              style={{ position: "absolute", top: -4, left: 1, fontSize: 12, cursor: "pointer" }}>
                              {step.extraIcon.icon}
                            </span>
                          )}
                        </div>
                        {si < mSteps.length - 1 && (
                          <div style={{ flex: 1, height: 2, background: stepDone ? (allDone ? "#D1D5DB" : "#DC2626") : "#E5E7EB", margin: "0 2px", marginBottom: 16, borderRadius: 1, transition: "background 0.3s" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 액션 버튼 행 — 일반/근생만 (단기는 원형 스텝에서 처리) */}
              {!isShortTerm && (
                <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {/* 입주사진 보기 */}
                  {(tm.moveInCheckPhotos && tm.moveInCheckPhotos.length > 0) ? (
                    <span onClick={() => setCheckPhotoModalTenant({ ...tm, _viewModeOnly: "moveIn" })}
                      style={{ fontSize: 10, fontWeight: 700, color: "#059669", padding: "4px 10px", borderRadius: 6, border: "1px solid #A7F3D0", background: "#ECFDF5", cursor: "pointer" }}>
                      {"\uD83C\uDFE0"} 입주사진 ({tm.moveInCheckPhotos.length})
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#C4C7CF", padding: "4px 10px", borderRadius: 6, border: "1px solid #E5E7EB", background: "#F9FAFB" }}>{"\uD83C\uDFE0"} 입주사진 없음</span>
                  )}
                  {/* 퇴실문자 */}
                  {ev.moveOutMsg ? (
                    <span onClick={(e) => { e.stopPropagation(); setMoveOutMsgModal({ ev, text: ev.moveOutMsg }); }}
                      style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", padding: "4px 10px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#F3F4F6", cursor: "pointer", textDecoration: "line-through" }}>{"\u2714"} 퇴실문자</span>
                  ) : (
                    <span onClick={(e) => { e.stopPropagation(); setMoveOutMsgModal({ ev, text: "" }); }}
                      style={{ fontSize: 10, fontWeight: 700, color: "#fff", padding: "4px 10px", borderRadius: 6, background: "#F59E0B", cursor: "pointer", whiteSpace: "nowrap" }}>
                      {"\uD83D\uDCE9"} 퇴실문자
                    </span>
                  )}
                  {/* 비밀번호 */}
                  {ev.doorPassword ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", padding: "4px 10px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#F3F4F6", textDecoration: "line-through" }}>{"\u2714"} 비번 {ev.doorPassword}</span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#C4C7CF", padding: "4px 10px", borderRadius: 6, border: "1px solid #E5E7EB", background: "#F9FAFB" }}>비밀번호 {"\u2014"}</span>
                  )}
                  {/* 퇴실사진 */}
                  {ev.hasPhotos ? (
                    <span onClick={() => setPhotoModalTenant(tm)}
                      style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", padding: "4px 10px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#F3F4F6", cursor: "pointer", textDecoration: "line-through" }}>{"\u2714"} 퇴실사진</span>
                  ) : (
                    <span onClick={() => setPhotoModalTenant(tm)}
                      style={{ fontSize: 10, fontWeight: 700, color: "#fff", padding: "4px 10px", borderRadius: 6, background: "#DC2626", cursor: "pointer" }}>
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
                        style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", padding: "4px 10px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#F3F4F6", cursor: "pointer", textDecoration: "line-through" }}>{"\u2714"} 건물주연락</span>
                    ) : (
                      <span onClick={() => {
                        if (!ev.settled) return alert("정산서가 완료되어야 건물주연락이 가능합니다.");
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
                        style={{ fontSize: 10, fontWeight: 700, color: "#fff", padding: "4px 10px", borderRadius: 6, background: "#7C3AED", cursor: "pointer", whiteSpace: "nowrap" }}>
                        {"\uD83D\uDCDE"} 건물주연락
                      </span>
                    )
                  )}
                  {/* 입주체크사진 */}
                  {ev.hasCheckPhotos ? (
                    <span onClick={() => setCheckPhotoModalTenant(tm)}
                      style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", padding: "4px 10px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#F3F4F6", cursor: "pointer", textDecoration: "line-through" }}>{"\u2714"} 입주체크사진</span>
                  ) : (
                    <span onClick={() => setCheckPhotoModalTenant(tm)}
                      style={{ fontSize: 10, fontWeight: 700, color: "#fff", padding: "4px 10px", borderRadius: 6, background: "#F59E0B", cursor: "pointer" }}>
                      {"\uD83D\uDCF7"} 입주체크사진
                    </span>
                  )}
                  {/* 사진비교 */}
                  {ev.hasPhotos && (
                    <span onClick={() => setCompareData({ building: ev.building, room: ev.room, moveInCheckPhotos: tm.moveInCheckPhotos || [], moveOutPhotos: tm.moveOutPhotos || [] })}
                      style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", padding: "4px 10px", borderRadius: 6, border: "1px solid #C7D2FE", background: "#EEF2FF", cursor: "pointer" }}>
                      {"\uD83D\uDD0D"} 비교
                    </span>
                  )}
                  <div style={{ marginLeft: "auto" }} />
                  {/* 퇴실정산서 (맨 오른쪽) */}
                  {ev.settled ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", padding: "4px 10px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#F3F4F6", textDecoration: "line-through" }}>{"\u2714"} 정산완료</span>
                  ) : t && setPage && ev.hasPhotos ? (
                    <span onClick={() => { setPendingMoveout?.({ building: ev.building, room: ev.room }); setPage("tenants"); }}
                      style={{ fontSize: 10, fontWeight: 700, color: "#fff", padding: "4px 10px", borderRadius: 6, background: "#DC2626", cursor: "pointer", whiteSpace: "nowrap" }}>
                      정산서 {"\u2192"}
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", padding: "4px 10px", borderRadius: 6, border: "1px solid #E5E7EB", background: "#F9FAFB" }}>정산 대기</span>
                  )}
                </div>
              )}

              {/* 단기 퇴실: 예금주 불일치 경고 */}
              {isShortTerm && ev._holderMismatch && (
                <div style={{ padding: "6px 16px", fontSize: 10, color: "#B45309", background: "#FFFBEB", borderTop: "1px solid #FDE68A" }}>
                  {"\u26A0\uFE0F"} 예금주 불일치: 임차인 [{t?.name || ev.name}] vs 예금주 [{ev.refundHolder}]
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
