import React, { useState } from 'react';
import { Card, RoomTypeBadge, ContractDropZone } from '@/components';
import { inputClassName } from '@/components/Field';
import { getRoomType } from '@/config';
import { roomMasterData } from '@/data';
import { fmt } from '@/utils';
import { getLateFee } from '../utils/billingStatus';
import { CompareModal } from '@/pages/calendar/components/PhotoModals';

interface MoveOutModalProps {
  selectedTenant: Record<string, any>;
  setSelectedTenant: (t: Record<string, any> | null) => void;
  actionMode: string | null;
  setActionMode: (v: string | null) => void;
  actionDone: boolean;
  doAction: () => void;
  activeTenants: Record<string, any>[];
  roomBalances: Record<string, number>;
  lateFeeOverrides: Record<string, any>;
  buildingData: Record<string, any>;
  // Move-out specific state
  moveoutDateStr: string;
  setMoveoutDateStr: (v: string) => void;
  manElec: { period: string; amt: number }[];
  manGas: { period: string; amt: number }[];
  manRepair: number | string;
  manWaste: number | string;
  manOther: { desc: string; amt: number }[];
  manRepairDesc: string;
  manWasteDesc: string;
  setManElecRow: (i: number, k: string, v: any) => void;
  setManGasRow: (i: number, k: string, v: any) => void;
  setManOtherRow: (i: number, k: string, v: any) => void;
  setManRepair: (v: any) => void;
  setManWaste: (v: any) => void;
  setManRepairDesc: (v: string) => void;
  setManWasteDesc: (v: string) => void;
  manRestoration: number | string;
  setManRestoration: (v: any) => void;
  manRestorationDesc: string;
  setManRestorationDesc: (v: string) => void;
  elevatorFee: boolean;
  setElevatorFee: (v: boolean) => void;
  restorationStatus: string;
  setRestorationStatus: (v: string) => void;
  restorationComment: string;
  setRestorationComment: (v: string) => void;
  restorationPhotos: any[];
  setRestorationPhotos: (fn: any) => void;
  meterElecReading: string;
  setMeterElecReading: (v: string) => void;
  meterGasReading: string;
  setMeterGasReading: (v: string) => void;
  refundBank: string;
  setRefundBank: (v: string) => void;
  refundAcct: string;
  setRefundAcct: (v: string) => void;
  refundName: string;
  setRefundName: (v: string) => void;
  meterPhotos: { electric: number[]; gas: number[] };
  setMeterPhotos: (fn: any) => void;
  meterZoom: Record<string, any> | null;
  setMeterZoom: (v: Record<string, any> | null) => void;
  moveoutCompare: Record<string, any> | null;
  setMoveoutCompare: (v: Record<string, any> | null) => void;
  setActiveTenants?: (fn: any) => void;
  // Renew specific state
  renewFiles: any[];
  setRenewFiles: (fn: any) => void;
}

export const MoveOutModal: React.FC<MoveOutModalProps> = ({
  selectedTenant,
  setSelectedTenant,
  actionMode,
  setActionMode,
  actionDone,
  doAction,
  activeTenants,
  roomBalances,
  lateFeeOverrides,
  buildingData,
  moveoutDateStr,
  setMoveoutDateStr,
  manElec,
  manGas,
  manRepair,
  manWaste,
  manOther,
  manRepairDesc,
  manWasteDesc,
  setManElecRow,
  setManGasRow,
  setManOtherRow,
  setManRepair,
  setManWaste,
  setManRepairDesc,
  setManWasteDesc,
  manRestoration,
  setManRestoration,
  manRestorationDesc,
  setManRestorationDesc,
  elevatorFee,
  setElevatorFee,
  restorationStatus,
  setRestorationStatus,
  restorationComment,
  setRestorationComment,
  restorationPhotos,
  setRestorationPhotos,
  meterElecReading,
  setMeterElecReading,
  meterGasReading,
  setMeterGasReading,
  refundBank,
  setRefundBank,
  refundAcct,
  setRefundAcct,
  refundName,
  setRefundName,
  meterPhotos,
  setMeterPhotos,
  meterZoom,
  setMeterZoom,
  moveoutCompare,
  setMoveoutCompare,
  setActiveTenants,
  renewFiles,
  setRenewFiles,
}) => {
  const [showMoveoutConfirmModal, setShowMoveoutConfirmModal] = useState(false);
  const t = activeTenants.find(x => x.id === selectedTenant.id) || selectedTenant;
  const depositLabel = getRoomType(t.building, t.room) === "단기" ? "예치금" : "보증금";
  const hasMoveOutPhotos = (t.moveOutPhotos || []).length > 0;

  if (actionDone) {
    const msgs: Record<string, string> = { moveout: "퇴실 처리가 완료되었습니다", movein: "입주 처리가 완료되었습니다", renew: "연장계약이 등록되었습니다" };
    return (
      <Card className="px-5 py-10 text-center">
        <span className="text-[48px]">✅</span>
        <div className="text-lg font-bold text-hm-success mt-3">{msgs[actionMode!]}</div>
        <div className="text-sm text-hm-text-muted mt-1.5">{t.building} {t.room}호 {t.name}</div>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 cursor-pointer" onClick={() => { setActionMode(null); setSelectedTenant(null); }}>
        <span className="text-xl">&larr;</span>
        <span className="text-sm font-bold text-hm-blue">임차인 목록으로</span>
      </div>

      {actionMode === "moveout" && (() => {
        const rm = roomMasterData[`${t.building}_${t.room}`] || {};
        const moveoutDate = new Date(moveoutDateStr);
        const expiryDate = new Date(t.expiry);
        const isEarlyMoveout = expiryDate > moveoutDate;
        const roomType = getRoomType(t.building, t.room);
        const isManagementOffice = roomType === "관리사무소";
        const showProRata = !isManagementOffice;
        const showCleanFee = roomType === "단기";
        const showPenalty = roomType === "단기";
        const showRestoration = roomType === "근생";
        const showManualInputs = !isManagementOffice;
        const moveInStr = t.moveIn || "";
        const moveInDate = moveInStr ? new Date(moveInStr) : null;
        // 사용기간
        const usagePeriod = (() => {
          if (!moveInDate) return "-";
          let months = (moveoutDate.getFullYear() - moveInDate.getFullYear()) * 12 + (moveoutDate.getMonth() - moveInDate.getMonth());
          let days = moveoutDate.getDate() - moveInDate.getDate();
          if (days < 0) { months--; const prev = new Date(moveoutDate.getFullYear(), moveoutDate.getMonth(), 0); days += prev.getDate(); }
          return `${months}개월 ${days}일`;
        })();
        const startDay = moveInDate ? moveInDate.getDate() : 1;
        const cycleStart = new Date(moveoutDate.getFullYear(), moveoutDate.getMonth(), startDay);
        const lastCycleStart = cycleStart <= moveoutDate
          ? cycleStart
          : new Date(moveoutDate.getFullYear(), moveoutDate.getMonth() - 1, startDay);
        const nextCycleStart = new Date(lastCycleStart.getFullYear(), lastCycleStart.getMonth() + 1, startDay);
        const daysInMonth = Math.round((nextCycleStart.getTime() - lastCycleStart.getTime()) / 86400000);
        const usedDays = Math.max(0, Math.ceil((moveoutDate.getTime() - lastCycleStart.getTime()) / 86400000));
        const isRentPrepaid = t.rentPayType !== "후불";
        const isMgmtPrepaid = t.mgmtPayType !== "후불";
        const rentDaily = Math.round(t.rent / daysInMonth);
        const mgmtDaily = t.mgmt > 0 ? Math.round(t.mgmt / daysInMonth) : 0;
        const rentProRata = showProRata ? (isRentPrepaid ? -rentDaily * (daysInMonth - usedDays) : rentDaily * usedDays) : 0;
        const mgmtProRata = showProRata ? (isMgmtPrepaid ? -mgmtDaily * (daysInMonth - usedDays) : mgmtDaily * usedDays) : 0;
        const cleanFee = showCleanFee ? (rm.cleanFee ? Number(String(rm.cleanFee).replace(/,/g, "")) : 120000) : 0;
        const waterAmt = rm.water ? Number(String(rm.water).replace(/,/g, "")) : 15000;
        const internetAmt = rm.internet ? Number(String(rm.internet).replace(/,/g, "")) : 25000;
        const isWaterPrepaid = t.waterPayType !== "후불";
        const isCablePrepaid = t.cablePayType !== "후불";
        const waterDaily = Math.round(waterAmt / daysInMonth);
        const internetDaily = Math.round(internetAmt / daysInMonth);
        const waterProRata = showProRata ? (isWaterPrepaid ? -waterDaily * (daysInMonth - usedDays) : waterDaily * usedDays) : 0;
        const internetProRata = showProRata ? (isCablePrepaid ? -internetDaily * (daysInMonth - usedDays) : internetDaily * usedDays) : 0;
        const curOverdue = t.overdue || 0;
        const unpaidRent = Math.min(curOverdue, t.rent);
        const unpaidMgmt = Math.min(Math.max(curOverdue - t.rent, 0), t.mgmt || 0);
        const unpaidUtil = Math.max(curOverdue - t.rent - (t.mgmt || 0), 0);
        const totalUtilAmt = waterAmt + internetAmt;
        const unpaidWater = totalUtilAmt > 0 ? Math.round(unpaidUtil * waterAmt / totalUtilAmt) : 0;
        const unpaidInternet = unpaidUtil - unpaidWater;
        const prevUnpaid = t.prevUnpaid || 0;
        const netRent = rentProRata + unpaidRent;
        const netMgmt = mgmtProRata + unpaidMgmt;
        const netWater = waterProRata + unpaidWater;
        const netInternet = internetProRata + unpaidInternet;
        const penalty7 = showPenalty && isEarlyMoveout ? Math.round((t.rent + (t.mgmt || 0)) / 30 * 7) : 0;
        const commBase = rm.commFee ? Number(String(rm.commFee).replace(/,/g, "")) : 0;
        const commEvt = t.commEvent ? (Number(String(t.commEvent).replace(/[^0-9.]/g, "")) || 0) : 0;
        const penaltyComm = showPenalty && isEarlyMoveout ? commBase + commEvt : 0;
        const penaltyTotal = penalty7 + penaltyComm;
        const lateFee = getLateFee(t, roomBalances, lateFeeOverrides);
        const parseNum = (v: any) => Number(String(v).replace(/,/g, "")) || 0;
        const sumArr = (arr: any[]) => arr.reduce((s, r) => s + parseNum(r.amt), 0);
        const elecTotal = sumArr(manElec);
        const gasTotal = sumArr(manGas);
        const otherTotal = sumArr(manOther);
        const elevatorFeeAmt = isManagementOffice && elevatorFee ? 100000 : 0;
        const bldgData = buildingData[t.building] || {};
        const penaltyRecipient = bldgData.penaltyOwner || "하우스맨";
        let prevElecReading: any = null;
        let prevGasReading: any = null;
        try {
          const chain = JSON.parse(localStorage.getItem("hm_meterChain") || "{}");
          const meterChainKey = `${t.building}_${t.room}`;
          if (chain[meterChainKey]?.elec?.value != null) prevElecReading = chain[meterChainKey].elec;
          if (chain[meterChainKey]?.gas?.value != null) prevGasReading = chain[meterChainKey].gas;
        } catch (e) { /* ignore */ }
        const totalDeduct = (netRent > 0 ? netRent : 0) + (netMgmt > 0 ? netMgmt : 0)
          + (netWater > 0 ? netWater : 0) + (netInternet > 0 ? netInternet : 0) + cleanFee
          + elecTotal + gasTotal + parseNum(manRepair) + parseNum(manWaste) + otherTotal
          + (showRestoration ? parseNum(manRestoration) : 0) + penaltyTotal + lateFee + prevUnpaid + elevatorFeeAmt;
        const totalRefund = (netRent < 0 ? -netRent : 0) + (netMgmt < 0 ? -netMgmt : 0)
          + (netWater < 0 ? -netWater : 0) + (netInternet < 0 ? -netInternet : 0);
        const settlement = t.deposit + totalRefund - totalDeduct;
        const SRow = ({ label, sub, value, color, bold }: { label: string; sub?: string; value: number | string; color?: string; bold?: boolean }) => (
          <div className="flex justify-between items-center py-[5px] border-b border-[#F3F4F6]">
            <div><span className={`text-xs ${bold ? 'font-bold' : 'font-normal'}`} style={{ color: color || "var(--color-hm-text-sub)" }}>{label}</span>{sub && <span className="text-xs text-[#B0B5C1] ml-1.5">{sub}</span>}</div>
            <span className={`text-xs ${bold ? 'font-bold' : 'font-semibold'}`} style={{ color: color || "var(--color-hm-text)" }}>{typeof value === "number" ? (value < 0 ? `-${fmt(Math.abs(value))}` : fmt(value)) : value}</span>
          </div>
        );
        const moveOutPhotos = t.moveOutPhotos || [];
        const moveInCheckPhotos = t.moveInCheckPhotos || [];
        const hasAnyPhotos = moveOutPhotos.length > 0 || moveInCheckPhotos.length > 0;
        return (
        <>
        {/* 사진 비교 버튼 */}
        {hasAnyPhotos && (
          <div className="max-w-[720px] mb-3">
            <button onClick={() => setMoveoutCompare({ building: t.building, room: t.room, moveInCheckPhotos, moveOutPhotos })}
              className="w-full p-3.5 rounded-[10px] border-2 border-[#6366F1] text-[#6366F1] text-sm font-bold cursor-pointer font-[inherit] flex items-center justify-center gap-2.5 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(90deg, #EEF2FF, #FAF5FF)" }}>
              🔍 입퇴실 사진 비교 (입주 {moveInCheckPhotos.length}장 / 퇴실 {moveOutPhotos.length}장)
            </button>
          </div>
        )}

        {/* 프린트 전용 스타일 */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: A4 portrait; margin: 20mm 18mm; }
            body * { visibility: hidden !important; }
            #settlement-print-area, #settlement-print-area * { visibility: visible !important; }
            #settlement-print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 24px 20px !important; box-shadow: none !important; border: none !important; }
            #settlement-print-area .no-print { display: none !important; }
            #settlement-print-area .print-only { display: flex !important; }
            #settlement-print-area input, #settlement-print-area select { border: none !important; background: transparent !important; padding: 0 !important; -webkit-appearance: none; }
            #settlement-print-area textarea { border: 1px solid #ddd !important; background: transparent !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}} />
        <Card id="settlement-print-area" className="max-w-[720px]">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-lg font-bold text-hm-danger flex items-center gap-2.5">
                🚪 퇴실정산서
                <RoomTypeBadge building={t.building} room={t.room} />
                <input type="date" value={moveoutDateStr} onChange={e => setMoveoutDateStr(e.target.value)}
                  className="text-sm font-bold px-2.5 py-[5px] rounded-lg border-[1.5px] border-hm-danger-border bg-hm-danger-bg text-hm-danger font-[inherit] cursor-pointer" />
              </div>
              <div className="text-xs text-hm-text-muted mt-1">{t.building} {t.room}호 · {t.name} · {t.phone}</div>
            </div>
            <div className={`px-[18px] py-2 rounded-lg text-sm font-bold ${isEarlyMoveout ? 'bg-hm-danger-bg text-hm-danger' : 'bg-[#F0FDF4] text-hm-success'}`}
              style={{ border: `1.5px solid ${isEarlyMoveout ? "var(--color-hm-danger-border)" : "#BBF7D0"}` }}>
              {isEarlyMoveout ? "만기전퇴실" : "만기퇴실"}
            </div>
          </div>

          <div className="gap-4" style={{ display: "grid", gridTemplateColumns: isManagementOffice ? "1fr" : "3fr 2fr" }}>
            {/* Left — 계약/기간 정보 (자동) */}
            <div>
              <div className="text-xs font-bold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">입주자 정보</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div><div className="text-xs text-hm-text-muted mb-0.5">입주자</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs font-semibold">{t.name}</div></div>
                <div><div className="text-xs text-hm-text-muted mb-0.5">연락처</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs">{t.phone}</div></div>
              </div>
              <div className="grid gap-0.5 mb-3 items-center" style={{ gridTemplateColumns: "20px auto 30px 1fr 30px 60px" }}>
                <div className="text-xs text-hm-text-muted">은행</div>
                <select value={refundBank} onChange={e => setRefundBank(e.target.value)} className={`${inputClassName} !px-1 !py-[5px] !text-xs font-semibold cursor-pointer`}>
                  <option value="" disabled>선택</option>
                  {["KB국민","신한","하나","우리","NH농협","IBK기업","SC제일","씨티","카카오뱅크","케이뱅크","토스뱅크","새마을금고","신협","우체국","수협","광주","전북","제주","경남","부산","대구","BNK","산업","KDB"].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <div className="text-xs text-hm-text-muted">계좌</div><input value={refundAcct} onChange={e => setRefundAcct(e.target.value)} placeholder="계좌번호" className={`${inputClassName} !px-1.5 !py-[5px] !text-xs`} />
                <div className="text-xs text-hm-text-muted">입금자</div><input value={refundName} onChange={e => setRefundName(e.target.value)} placeholder="입금자명" className={`${inputClassName} !px-1.5 !py-[5px] !text-xs !w-[60px]`} />
              </div>

              {showProRata && <>
              <div className="text-xs font-bold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">사용 기간</div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div><div className="text-xs text-hm-text-muted mb-0.5">입주일</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs">{moveInStr || "-"}</div></div>
                <div><div className="text-xs text-hm-text-muted mb-0.5">만기일</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs">{t.expiry}</div></div>
                <div><div className="text-xs text-hm-text-muted mb-0.5">사용기간</div><div className="px-2.5 py-[7px] rounded-lg bg-[#F0F4FF] text-xs font-bold text-hm-blue-dark text-center">{usagePeriod}</div></div>
              </div>

              <div className="text-xs font-bold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">계약 정보 (자동)</div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div><div className="text-xs text-hm-text-muted mb-0.5">{depositLabel}</div><div className="px-2.5 py-[7px] rounded-lg bg-[#F0FDF4] text-xs font-bold text-hm-success text-right">{fmt(t.deposit)}</div></div>
                <div><div className="text-xs text-hm-text-muted mb-0.5">월세 <span className={`text-[8px] ${isRentPrepaid ? 'text-hm-success' : 'text-hm-danger'}`}>({isRentPrepaid ? "선불" : "후불"})</span></div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs font-semibold text-right">{fmt(t.rent)}</div></div>
                <div><div className="text-xs text-hm-text-muted mb-0.5">관리비 <span className={`text-[8px] ${isMgmtPrepaid ? 'text-hm-success' : 'text-hm-danger'}`}>({isMgmtPrepaid ? "선불" : "후불"})</span></div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs font-semibold text-right">{fmt(t.mgmt || 0)}</div></div>
              </div>
              <div className="gap-2 mb-3" style={{ display: "grid", gridTemplateColumns: showCleanFee ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr" }}>
                {showCleanFee && <div><div className="text-xs text-hm-text-muted mb-0.5">퇴실청소비</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-danger-bg text-xs font-semibold text-right text-hm-danger">{fmt(cleanFee)}</div></div>}
                <div><div className="text-xs text-hm-text-muted mb-0.5">수도</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs text-right">{fmt(waterAmt)}</div></div>
                <div><div className="text-xs text-hm-text-muted mb-0.5">TV/인터넷</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs text-right">{fmt(internetAmt)}</div></div>
                <div><div className="text-xs text-hm-text-muted mb-0.5">만기일</div><div className="px-2.5 py-[7px] rounded-lg bg-hm-bg-slate text-xs">{t.expiry}</div></div>
              </div>
              </>}

              {/* 수기 입력 영역 */}
              {showManualInputs && <>
              <div className="text-xs font-bold text-hm-warning mb-2 pb-1.5 border-b-[1.5px] border-hm-warning-border">✏️ 수기 입력 (마지막 청구 이후)</div>
              <div className="grid gap-1.5 mb-1.5 mt-1.5 items-center" style={{ gridTemplateColumns: "60px 1fr 90px" }}>
                <span className="text-xs text-hm-warning font-semibold">애완동물</span>
                <input value={manRepairDesc} onChange={e => setManRepairDesc(e.target.value)} placeholder="내역" className={`${inputClassName} !px-2 !py-1.5 !text-xs !border-hm-warning-border`} />
                <input value={manRepair || ""} onChange={e => setManRepair(e.target.value)} placeholder="0" className={`${inputClassName} !px-2 !py-1.5 !text-xs !text-right !border-hm-warning-border`} />
              </div>
              <div className="grid gap-1.5 mb-1.5 items-center" style={{ gridTemplateColumns: "60px 1fr 90px" }}>
                <span className="text-xs text-hm-warning font-semibold">공제1</span>
                <input value={manWasteDesc} onChange={e => setManWasteDesc(e.target.value)} placeholder="내역" className={`${inputClassName} !px-2 !py-1.5 !text-xs !border-hm-warning-border`} />
                <input value={manWaste || ""} onChange={e => setManWaste(e.target.value)} placeholder="0" className={`${inputClassName} !px-2 !py-1.5 !text-xs !text-right !border-hm-warning-border`} />
              </div>
              {manOther.map((row, i) => (
                <div key={`other${i}`} className={`grid gap-1.5 items-center ${i < 2 ? 'mb-1' : 'mb-2'}`} style={{ gridTemplateColumns: "60px 1fr 90px" }}>
                  <span className="text-xs text-hm-warning font-semibold">공제{i+2}</span>
                  <input value={row.desc} onChange={e => setManOtherRow(i,"desc",e.target.value)} placeholder="내역" className={`${inputClassName} !px-2 !py-1.5 !text-xs !border-hm-warning-border`} />
                  <input value={row.amt || ""} onChange={e => setManOtherRow(i,"amt",e.target.value)} placeholder="0" className={`${inputClassName} !px-2 !py-1.5 !text-xs !text-right !border-hm-warning-border`} />
                </div>
              ))}
              {showRestoration && <div className="grid gap-1.5 mb-2 items-center" style={{ gridTemplateColumns: "80px 1fr 90px" }}>
                <span className="text-xs text-[#7C3AED] font-semibold">원상복구비</span>
                <input value={manRestorationDesc} onChange={e => setManRestorationDesc(e.target.value)} placeholder="내역" className={`${inputClassName} !px-2 !py-1.5 !text-xs !border-[#C4B5FD]`} />
                <input value={manRestoration || ""} onChange={e => setManRestoration(e.target.value)} placeholder="0" className={`${inputClassName} !px-2 !py-1.5 !text-xs !text-right !border-[#C4B5FD]`} />
              </div>}
              </>}

              {/* 관리사무소 — 보증금 정보 + 엘리베이터 사용비 */}
              {isManagementOffice && <>
              <div className="text-xs font-bold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">공제 항목</div>
              <label className="flex items-center gap-2 px-3.5 py-2.5 bg-hm-danger-bg rounded-lg border-[1.5px] border-hm-danger-border mb-3 cursor-pointer">
                <input type="checkbox" checked={elevatorFee} onChange={e => setElevatorFee(e.target.checked)} className="w-[18px] h-[18px] cursor-pointer" />
                <div>
                  <div className="text-xs font-bold text-hm-danger">엘리베이터 사용</div>
                  <div className="text-xs text-[#991B1B]">사용 시 100,000원 공제</div>
                </div>
                {elevatorFee && <span className="ml-auto text-sm font-bold text-hm-danger">{fmt(100000)}원</span>}
              </label>
              <div className="text-xs font-bold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">보증금 반환</div>
              <div className={`rounded-[10px] px-[18px] py-3.5 ${settlement >= 0 ? 'bg-[#F0FDF4]' : 'bg-hm-danger-bg'}`}
                style={{ border: `2px solid ${settlement >= 0 ? "#BBF7D0" : "var(--color-hm-danger-border)"}` }}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`text-sm font-bold ${settlement >= 0 ? 'text-[#065F46]' : 'text-[#991B1B]'}`}>{settlement >= 0 ? "반환금액" : "추가청구"}</span>
                    {elevatorFee && <div className="text-xs text-hm-text-muted mt-0.5">보증금 {fmt(t.deposit)} - 엘리베이터 {fmt(100000)}</div>}
                  </div>
                  <span className={`text-2xl font-[900] ${settlement >= 0 ? 'text-hm-success' : 'text-hm-danger'}`}>{settlement < 0 ? `-${fmt(Math.abs(settlement))}` : fmt(settlement)}<span className="text-xs">원</span></span>
                </div>
              </div>
              </>}
            </div>

            {/* Right — 정산 자동계산 (관리사무소 제외) */}
            {!isManagementOffice && <div>
              <div className="text-xs font-bold text-hm-text mb-2 pb-1.5 border-b-[1.5px] border-hm-border">정산 내역 (자동계산)</div>
              {showProRata && <div className="text-xs text-hm-text-muted mb-1">기산일: {startDay}일 · 일할기준: {daysInMonth}일 · 사용일수: {usedDays}일</div>}

              {/* 반환 항목 */}
              <div className="bg-[#F0FDF4] rounded-[10px] px-3.5 py-2.5 mb-2.5 border border-[#BBF7D0]">
                <div className="text-xs font-bold text-hm-success mb-1">반환 항목</div>
                <SRow label={depositLabel} value={t.deposit} color="var(--color-hm-success)" bold />
                {netRent < 0 && <SRow label="월세 환불" sub={`${daysInMonth - usedDays}일분${unpaidRent > 0 ? " · 미납반영" : ""}`} value={-netRent} color="var(--color-hm-success)" />}
                {netMgmt < 0 && <SRow label="관리비 환불" sub={`${daysInMonth - usedDays}일분${unpaidMgmt > 0 ? " · 미납반영" : ""}`} value={-netMgmt} color="var(--color-hm-success)" />}
                {netWater < 0 && <SRow label="수도 환불" sub={`${daysInMonth - usedDays}일분${unpaidWater > 0 ? " · 미납반영" : ""}`} value={-netWater} color="var(--color-hm-success)" />}
                {netInternet < 0 && <SRow label="TV/인터넷 환불" sub={`${daysInMonth - usedDays}일분${unpaidInternet > 0 ? " · 미납반영" : ""}`} value={-netInternet} color="var(--color-hm-success)" />}
                <div className="flex justify-between py-1.5 mt-1 border-t-[1.5px] border-[#BBF7D0]">
                  <span className="text-xs font-bold text-[#065F46]">반환소계</span>
                  <span className="text-sm font-[900] text-hm-success">{fmt(t.deposit + totalRefund)}</span>
                </div>
              </div>

              {/* 공제 항목 */}
              <div className="bg-hm-danger-bg rounded-[10px] px-3.5 py-2.5 mb-2.5 border border-hm-danger-border">
                <div className="text-xs font-bold text-hm-danger mb-1">공제 항목</div>
                {netRent > 0 && <SRow label="월세" sub={`${usedDays}일분${unpaidRent > 0 ? " · 미납반영" : ""}`} value={netRent} color="var(--color-hm-danger)" />}
                {netMgmt > 0 && <SRow label="관리비" sub={`${usedDays}일분${unpaidMgmt > 0 ? " · 미납반영" : ""}`} value={netMgmt} color="var(--color-hm-danger)" />}
                {netWater > 0 && <SRow label="수도" sub={`${usedDays}일분${unpaidWater > 0 ? " · 미납반영" : ""}`} value={netWater} color="var(--color-hm-danger)" />}
                {netInternet > 0 && <SRow label="TV/인터넷" sub={`${usedDays}일분${unpaidInternet > 0 ? " · 미납반영" : ""}`} value={netInternet} color="var(--color-hm-danger)" />}
                {showCleanFee && <SRow label="퇴실청소비" value={cleanFee} color="var(--color-hm-danger)" />}
                {showManualInputs && manElec.map((r,i) => parseNum(r.amt) > 0 && <SRow key={`e${i}`} label={`전기${r.period ? ` (${r.period})` : ` ${i+1}`}`} value={parseNum(r.amt)} color="var(--color-hm-danger)" />)}
                {showManualInputs && manGas.map((r,i) => parseNum(r.amt) > 0 && <SRow key={`g${i}`} label={`가스${r.period ? ` (${r.period})` : ` ${i+1}`}`} value={parseNum(r.amt)} color="var(--color-hm-danger)" />)}
                {showManualInputs && parseNum(manRepair) > 0 && <SRow label={`애완동물 ${manRepairDesc ? `(${manRepairDesc})` : ""}`} value={parseNum(manRepair)} color="var(--color-hm-danger)" />}
                {showManualInputs && parseNum(manWaste) > 0 && <SRow label={`공제1 ${manWasteDesc ? `(${manWasteDesc})` : ""}`} value={parseNum(manWaste)} color="var(--color-hm-danger)" />}
                {showManualInputs && manOther.map((r,i) => parseNum(r.amt) > 0 && <SRow key={`o${i}`} label={`공제${i+2}${r.desc ? ` (${r.desc})` : ""}`} value={parseNum(r.amt)} color="var(--color-hm-danger)" />)}
                {showRestoration && parseNum(manRestoration) > 0 && <SRow label={`원상복구비 ${manRestorationDesc ? `(${manRestorationDesc})` : ""}`} value={parseNum(manRestoration)} color="#7C3AED" />}
                {showPenalty && penaltyTotal > 0 && <>
                  <div className="h-px bg-hm-danger-border my-1" />
                  {penalty7 > 0 && <SRow label="7일패널티" sub={`귀속: ${penaltyRecipient}`} value={penalty7} color="var(--color-hm-danger)" />}
                  {penaltyComm > 0 && <SRow label="중개수수료" value={penaltyComm} color="var(--color-hm-danger)" />}
                </>}
                {lateFee > 0 && <SRow label="연체수수료" sub="임대료 월 5%" value={lateFee} color="var(--color-hm-danger)" />}
                {lateFeeOverrides[`${t.building}_${t.room}`]?.type === "exclude" && (
                  <div className="text-xs text-hm-success font-bold text-right py-0.5">수금관리에서 연체수수료 제외 처리됨</div>
                )}
                {lateFeeOverrides[`${t.building}_${t.room}`]?.type === "discount" && (
                  <div className="text-xs text-hm-blue-dark font-bold text-right py-0.5">수금관리에서 연체수수료 {fmt(lateFeeOverrides[`${t.building}_${t.room}`].amount)}원 할인 적용</div>
                )}
                {prevUnpaid > 0 && <>
                  <div className="h-px bg-hm-danger-border my-1" />
                  <SRow label="전월 미납금" value={prevUnpaid} color="var(--color-hm-danger)" bold />
                </>}
                <div className="flex justify-between py-1.5 mt-1 border-t-[1.5px] border-hm-danger-border">
                  <span className="text-xs font-bold text-[#991B1B]">공제소계</span>
                  <span className="text-sm font-[900] text-hm-danger">-{fmt(totalDeduct)}</span>
                </div>
              </div>

              {/* 최종 정산 */}
              <div className={`rounded-[10px] px-[18px] py-3.5 ${settlement >= 0 ? 'bg-[#F0FDF4]' : 'bg-hm-danger-bg'}`}
                style={{ border: `2px solid ${settlement >= 0 ? "#BBF7D0" : "var(--color-hm-danger-border)"}` }}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-bold ${settlement >= 0 ? 'text-[#065F46]' : 'text-[#991B1B]'}`}>{settlement >= 0 ? "반환금액" : "추가청구"}</span>
                  <span className={`text-2xl font-[900] ${settlement >= 0 ? 'text-hm-success' : 'text-hm-danger'}`}>{settlement < 0 ? `-${fmt(Math.abs(settlement))}` : fmt(settlement)}<span className="text-xs">원</span></span>
                </div>
              </div>

              {showPenalty && isEarlyMoveout && (
                <div className="mt-2 px-2.5 py-1.5 bg-hm-danger-bg rounded-md border border-hm-danger-border text-xs text-hm-danger font-semibold">
                  ⚠️ 만기전퇴실 위약금: (월세+관리비)/30x7 = {fmt(penalty7)}원{penaltyComm > 0 ? ` + 중개수수료 ${fmt(penaltyComm)}원` : ""}
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-bold ${penaltyRecipient === "하우스맨" ? 'bg-hm-blue-bg text-hm-blue-dark' : 'bg-hm-warning-bg text-hm-warning'}`}>귀속: {penaltyRecipient}</span>
                </div>
              )}
            </div>}
          </div>

          {/* 퇴실 검침값 현장 입력 */}
          {showManualInputs && (
            <div className="mt-4 px-4 py-3.5 bg-[#F0F4FF] rounded-xl border-2 border-[#BFDBFE]">
              <div className="text-sm font-bold text-[#1E40AF] mb-2.5 flex items-center gap-1.5">📋 퇴실 검침값</div>
              {roomType === "근생" && (
                <div className="px-3 py-2 bg-[#FEF3C7] rounded-lg mb-2.5 text-xs font-semibold text-[#92400E] border border-[#FDE68A]">
                  근생은 전기/가스/수도 이사정산을 임차인이 직접 처리합니다
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs font-bold text-[#FBBF24] mb-1.5 flex items-center justify-center gap-1">⚡ 전기 당월지침</div>
                  {prevElecReading && <div className="text-xs text-[#6B7280] mb-1">이전: {prevElecReading.value} kWh ({prevElecReading.date || "-"})</div>}
                  <input
                    type="number" inputMode="numeric"
                    value={meterElecReading} onChange={e => setMeterElecReading(e.target.value)}
                    placeholder="0"
                    className={`${inputClassName} !w-full !px-3 !py-3.5 !text-xl !font-bold !text-center !border-[#FBBF24] !border-2 !rounded-[10px] !bg-[#FFFBEB]`}
                  />
                  <div className="text-xs text-hm-text-muted mt-[3px]">kWh</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-[#60A5FA] mb-1.5 flex items-center justify-center gap-1">🔥 가스 당월지침</div>
                  {prevGasReading && <div className="text-xs text-[#6B7280] mb-1">이전: {prevGasReading.value} m3 ({prevGasReading.date || "-"})</div>}
                  <input
                    type="number" inputMode="numeric"
                    value={meterGasReading} onChange={e => setMeterGasReading(e.target.value)}
                    placeholder="0"
                    className={`${inputClassName} !w-full !px-3 !py-3.5 !text-xl !font-bold !text-center !border-[#60A5FA] !border-2 !rounded-[10px] !bg-hm-blue-bg`}
                  />
                  <div className="text-xs text-hm-text-muted mt-[3px]">m3</div>
                </div>
              </div>
            </div>
          )}

          {/* 전기/가스 금액 입력 */}
          {showManualInputs && (
            <div className="mt-3 px-3.5 py-3 bg-[#FFFBEB] rounded-[10px] border-[1.5px] border-[#FDE68A]">
              <div className="text-xs font-bold text-hm-warning mb-2">⚡🔥 전기 / 가스 청구금액</div>
              {(meterPhotos.electric.length > 0 || meterPhotos.gas.length > 0) && (
                <div className="no-print mb-2.5 p-2 bg-white rounded-lg border border-[#FDE68A]">
                  <div className="text-xs font-bold text-[#92400E] mb-1.5">📷 계량기 사진 (클릭하여 확대)</div>
                  <div className="flex gap-2 flex-wrap">
                    {meterPhotos.electric.map(pi => {
                      const photo = moveOutPhotos[pi];
                      if (!photo) return null;
                      const src = typeof photo === "string" ? photo : URL.createObjectURL(photo);
                      return (
                        <div key={`e${pi}`} onClick={() => setMeterZoom({ src, zoom: 1, pos: { x: 0, y: 0 } })}
                          className="relative cursor-pointer">
                          <img src={src} alt="" className="w-20 h-20 object-cover rounded-md border-2 border-[#FBBF24]" />
                          <span className="absolute bottom-0.5 left-0.5 text-[7px] font-bold px-1 py-px rounded-[3px] bg-[#FBBF24] text-black">⚡전기</span>
                        </div>
                      );
                    })}
                    {meterPhotos.gas.map(pi => {
                      const photo = moveOutPhotos[pi];
                      if (!photo) return null;
                      const src = typeof photo === "string" ? photo : URL.createObjectURL(photo);
                      return (
                        <div key={`g${pi}`} onClick={() => setMeterZoom({ src, zoom: 1, pos: { x: 0, y: 0 } })}
                          className="relative cursor-pointer">
                          <img src={src} alt="" className="w-20 h-20 object-cover rounded-md border-2 border-[#60A5FA]" />
                          <span className="absolute bottom-0.5 left-0.5 text-[7px] font-bold px-1 py-px rounded-[3px] bg-[#60A5FA] text-black">🔥가스</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-hm-warning font-semibold mb-1">전기</div>
                  {manElec.map((row, i) => (
                    <div key={`elec${i}`} className="grid gap-1 mb-1 items-center" style={{ gridTemplateColumns: "1fr 80px" }}>
                      <input value={row.period} onChange={e => setManElecRow(i,"period",e.target.value)} placeholder={`기간 ${i+1}`} className={`${inputClassName} !px-2 !py-1.5 !text-xs !border-hm-warning-border`} />
                      <input value={row.amt || ""} onChange={e => setManElecRow(i,"amt",e.target.value)} placeholder="0" className={`${inputClassName} !px-2 !py-1.5 !text-xs !text-right !border-hm-warning-border`} />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs text-hm-warning font-semibold mb-1">가스</div>
                  {manGas.map((row, i) => (
                    <div key={`gas${i}`} className="grid gap-1 mb-1 items-center" style={{ gridTemplateColumns: "1fr 80px" }}>
                      <input value={row.period} onChange={e => setManGasRow(i,"period",e.target.value)} placeholder={`기간 ${i+1}`} className={`${inputClassName} !px-2 !py-1.5 !text-xs !border-hm-warning-border`} />
                      <input value={row.amt || ""} onChange={e => setManGasRow(i,"amt",e.target.value)} placeholder="0" className={`${inputClassName} !px-2 !py-1.5 !text-xs !text-right !border-hm-warning-border`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 근생 원상복구 확인 */}
          {showRestoration && (
            <div className="mt-4 px-4 py-3.5 bg-[#F5F3FF] rounded-xl border-2 border-[#DDD6FE]">
              <div className="text-sm font-bold text-[#7C3AED] mb-2.5 flex items-center gap-1.5">🔧 원상복구 확인</div>
              <div className="px-3 py-2 bg-[#EDE9FE] rounded-lg mb-3 text-xs font-semibold text-[#6D28D9] border border-[#DDD6FE]">
                근생은 전기/가스/수도 이사정산을 임차인이 직접 처리합니다
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs text-hm-text-muted mb-1">복구 상태</div>
                  <div className="flex gap-1.5">
                    {["미확인", "진행중", "확인완료"].map(s => (
                      <button key={s} onClick={() => setRestorationStatus(s)}
                        className="flex-1 py-2 px-1 rounded-lg text-xs font-bold cursor-pointer font-[inherit] transition-colors"
                        style={{
                          border: restorationStatus === s ? "2px solid" : "1.5px solid var(--color-hm-input-border)",
                          background: restorationStatus === s ? (s === "확인완료" ? "#F0FDF4" : s === "진행중" ? "#FEF3C7" : "var(--color-hm-danger-bg)") : "#fff",
                          color: restorationStatus === s ? (s === "확인완료" ? "var(--color-hm-success)" : s === "진행중" ? "#92400E" : "var(--color-hm-danger)") : "var(--color-hm-text-muted)",
                          borderColor: restorationStatus === s ? (s === "확인완료" ? "#BBF7D0" : s === "진행중" ? "#FDE68A" : "var(--color-hm-danger-border)") : "var(--color-hm-input-border)",
                        }}>
                        {s === "미확인" ? "미확인" : s === "진행중" ? "진행중" : "확인완료"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-hm-text-muted mb-1">점검자 코멘트</div>
                  <input value={restorationComment} onChange={e => setRestorationComment(e.target.value)}
                    placeholder="점검 결과 메모..."
                    className={`${inputClassName} !w-full !px-2.5 !py-2 !text-xs !border-[#DDD6FE]`} />
                </div>
              </div>
              <div>
                <div className="text-xs text-hm-text-muted mb-1">점검 사진</div>
                <div className="flex gap-2 flex-wrap mb-2">
                  {restorationPhotos.map((photo: any, i: number) => {
                    const src = typeof photo === "string" ? photo : URL.createObjectURL(photo);
                    return (
                      <div key={i} className="relative">
                        <img src={src} alt="" className="w-[70px] h-[70px] object-cover rounded-md border-2 border-[#DDD6FE]"
                          onClick={() => setMeterZoom({ src, zoom: 1, pos: { x: 0, y: 0 } })} />
                        <button onClick={() => setRestorationPhotos((prev: any[]) => prev.filter((_: any, j: number) => j !== i))}
                          className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full border-none bg-hm-danger text-white text-xs font-bold cursor-pointer flex items-center justify-center">x</button>
                      </div>
                    );
                  })}
                  <label className="w-[70px] h-[70px] rounded-md border-2 border-dashed border-[#DDD6FE] flex items-center justify-center cursor-pointer bg-[#FAFAFE]">
                    <span className="text-2xl text-[#C4B5FD]">+</span>
                    <input type="file" accept="image/*" multiple hidden onChange={e => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) setRestorationPhotos((prev: any[]) => [...prev, ...files]);
                      e.target.value = "";
                    }} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 퇴실 메모 */}
          <div className="mt-4 mb-4">
            <div className="text-xs text-hm-text-muted mb-1">퇴실 메모</div>
            <textarea rows={2} placeholder="퇴실 사유, 참고사항..." className={`${inputClassName} resize-y leading-[1.6] !text-xs !px-3 !py-2.5`} />
          </div>

          {/* 인쇄 전용: 하단 */}
          <div className="print-only hidden justify-center mt-4 pt-2 border-t border-[#ddd] text-xs text-[#aaa]">
            하우스맨 건물관리 시스템 · {new Date().toLocaleDateString("ko-KR")} 출력
          </div>

          {/* Buttons */}
          <div className="no-print flex gap-2">
            <button onClick={() => { setActionMode(null); setSelectedTenant(null); }}
              className="flex-1 py-[13px] rounded-[10px] border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
            <button onClick={() => { window.print(); }}
              className="flex-1 py-[13px] rounded-[10px] border-[1.5px] border-hm-blue bg-hm-blue-bg text-hm-blue-dark font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">🖨 프린트</button>
            <button
              disabled={!hasMoveOutPhotos}
              onClick={() => { if (hasMoveOutPhotos) setShowMoveoutConfirmModal(true); }}
              className={`flex-[2] py-[13px] rounded-[10px] border-none font-bold text-sm font-[inherit] transition-opacity ${hasMoveOutPhotos ? 'bg-hm-danger text-white cursor-pointer hover:opacity-90' : 'bg-hm-input-border text-hm-text-muted cursor-not-allowed opacity-60'}`}
            >{hasMoveOutPhotos ? "🚪 퇴실 확정" : "📷 퇴실사진 등록 필요"}</button>
          </div>
        </Card>
        </>
        );
      })()}

      {actionMode === "movein" && (
        <Card>
          <div className="text-base font-bold text-hm-success mb-4 flex items-center gap-2">📦 입주 처리 <span className="text-xs font-medium text-hm-text-muted">신규 임차인 등록</span></div>
          <div className="px-4 py-3 bg-[#F0F4FF] rounded-lg mb-4 text-xs text-hm-blue font-semibold">📍 {t.building} {t.room}호 (현 임차인: {t.name})</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><div className="text-xs text-hm-text-muted mb-1">입주자명</div><input placeholder="이름" className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" /></div>
            <div><div className="text-xs text-hm-text-muted mb-1">연락처</div><input placeholder="010-0000-0000" className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div><div className="text-xs text-hm-text-muted mb-1">계약일</div><input type="date" defaultValue="2026-02-22" className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" /></div>
            <div><div className="text-xs text-hm-text-muted mb-1">입주일</div><input type="date" defaultValue="2026-03-01" className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" /></div>
            <div><div className="text-xs text-hm-text-muted mb-1">만기일</div><input type="date" defaultValue="2026-09-01" className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div><div className="text-xs text-hm-text-muted mb-1">{depositLabel}</div><input placeholder="0" className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" /></div>
            <div><div className="text-xs text-hm-text-muted mb-1">월세</div><input placeholder="0" className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" /></div>
            <div><div className="text-xs text-hm-text-muted mb-1">관리비</div><input placeholder="0" className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><div className="text-xs text-hm-text-muted mb-1">유형</div>
              <select defaultValue={t.type} className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit] cursor-pointer">
                {["단기", "일반임대", "근생", "관리사무소"].map(tp => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setActionMode(null); setSelectedTenant(null); }}
              className="flex-1 py-3 rounded-[10px] border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
            <button onClick={doAction}
              className="flex-[2] py-3 rounded-[10px] border-none bg-hm-success text-white font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">📦 입주 확정</button>
          </div>
        </Card>
      )}

      {actionMode === "renew" && (
        <Card>
          <div className="text-base font-bold text-hm-blue mb-4 flex items-center gap-2">📝 연장계약 <span className="text-xs font-medium text-hm-text-muted">{t.building} {t.room}호 {t.name}</span></div>
          <div className="px-4 py-3 bg-hm-bg-slate rounded-[10px] border border-hm-border mb-4">
            <div className="text-xs font-bold text-hm-text-muted mb-2">현재 계약</div>
            <div className="flex gap-5 text-xs flex-wrap">
              <div><span className="text-hm-text-muted">월세</span> <span className="font-bold">{fmt(t.rent)}원</span></div>
              <div><span className="text-hm-text-muted">관리비</span> <span className="font-bold">{fmt(t.mgmt)}원</span></div>
              <div><span className="text-hm-text-muted">{depositLabel}</span> <span className="font-bold">{fmt(t.deposit)}원</span></div>
              <div><span className="text-hm-text-muted">만기</span> <span className="font-bold">{t.expiry}</span></div>
              <div><span className="text-hm-text-muted">임대료</span> <span className="font-bold">{t.rentPayType === "후불" ? "후불" : "선불"}</span></div>
              <div><span className="text-hm-text-muted">관리비</span> <span className="font-bold">{t.mgmtPayType === "후불" ? "후불" : "선불"}</span></div>
            </div>
          </div>
          <div className="text-xs font-bold text-hm-text mb-2.5">연장계약 조건</div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div><div className="text-xs text-hm-text-muted mb-1">계약 작성일</div><input id="rn-contractDate" type="date" className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" /></div>
            <div><div className="text-xs text-hm-text-muted mb-1">새 계약 시작일</div><input id="rn-startDate" type="date" defaultValue={t.expiry} className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" /></div>
            <div><div className="text-xs text-hm-text-muted mb-1">새 만기일</div><input id="rn-expiry" type="date" className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <div className="text-xs text-hm-text-muted mb-1">새 {depositLabel}</div>
              <input id="rn-deposit" defaultValue={t.deposit} className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" />
              <div className="text-xs text-hm-text-muted mt-[3px]">현재 {fmt(t.deposit)}원</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-hm-text-muted">새 월세</span>
                <label className="flex items-center gap-[3px] cursor-pointer">
                  <input id="rn-rentPostpaid" type="checkbox" defaultChecked={t.rentPayType === "후불"} className="w-[13px] h-[13px] cursor-pointer" />
                  <span className="text-xs text-hm-danger font-semibold">후불</span>
                </label>
              </div>
              <input id="rn-rent" defaultValue={t.rent} className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" />
              <div className="text-xs text-hm-text-muted mt-[3px]">현재 {fmt(t.rent)}원 ({t.rentPayType === "후불" ? "후불" : "선불"})</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-hm-text-muted">새 관리비</span>
                <label className="flex items-center gap-[3px] cursor-pointer">
                  <input id="rn-mgmtPostpaid" type="checkbox" defaultChecked={t.mgmtPayType === "후불"} className="w-[13px] h-[13px] cursor-pointer" />
                  <span className="text-xs text-hm-danger font-semibold">후불</span>
                </label>
              </div>
              <input id="rn-mgmt" defaultValue={t.mgmt} className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit]" />
              <div className="text-xs text-hm-text-muted mt-[3px]">현재 {fmt(t.mgmt)}원 ({t.mgmtPayType === "후불" ? "후불" : "선불"})</div>
            </div>
          </div>
          <div className="mb-4"><div className="text-xs text-hm-text-muted mb-1">계약 메모</div><textarea id="rn-memo" rows={2} placeholder="인상 사유, 협의 내용, 특약 등..." className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-hm-input-border text-sm font-[inherit] resize-y" /></div>
          <div className="mb-4">
            <div className="text-xs text-hm-text-muted mb-1">📎 계약서 첨부</div>
            <ContractDropZone
              files={renewFiles}
              onAdd={(newFiles: any[]) => setRenewFiles((prev: any[]) => [...prev, ...newFiles])}
              onRemove={(idx: number) => setRenewFiles((prev: any[]) => prev.filter((_: any, i: number) => i !== idx))}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setActionMode(null); setSelectedTenant(null); setRenewFiles([]); }}
              className="flex-1 py-3 rounded-[10px] border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">취소</button>
            <button onClick={doAction}
              className="flex-[2] py-3 rounded-[10px] border-none bg-hm-blue text-white font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">📝 연장계약 등록</button>
          </div>
        </Card>
      )}
    <CompareModal compareData={moveoutCompare} setCompareData={setMoveoutCompare}
      onRemoveRight={(idx: number) => {
        if (!moveoutCompare) return;
        const updated = (moveoutCompare.moveOutPhotos || []).filter((_: any, i: number) => i !== idx);
        setMoveoutCompare({ ...moveoutCompare, moveOutPhotos: updated });
        setActiveTenants?.((prev: any[]) => prev.map((x: any) =>
          x.building === moveoutCompare.building && String(x.room) === String(moveoutCompare.room) ? { ...x, moveOutPhotos: updated } : x));
      }}
      onAddRight={(dataUrls: string[]) => {
        if (!moveoutCompare) return;
        const merged = [...(moveoutCompare.moveOutPhotos || []), ...dataUrls];
        setMoveoutCompare({ ...moveoutCompare, moveOutPhotos: merged });
        setActiveTenants?.((prev: any[]) => prev.map((x: any) =>
          x.building === moveoutCompare.building && String(x.room) === String(moveoutCompare.room) ? { ...x, moveOutPhotos: merged } : x));
      }}
    />
    {/* 퇴실확정 확인 모달 */}
    {showMoveoutConfirmModal && (
      <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center"
        onMouseDown={() => setShowMoveoutConfirmModal(false)}>
        <div className="bg-white rounded-2xl p-6 w-[380px] shadow-[0_20px_60px_rgba(0,0,0,.3)]"
          onMouseDown={e => e.stopPropagation()}>
          <div className="text-base font-bold text-hm-text mb-3">⚠️ 퇴실 확정</div>
          <div className="text-xs text-hm-text-sub leading-[1.6] mb-5">
            정말 퇴실처리 하시겠습니까?<br/>확정 후에는 되돌릴 수 없습니다.
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowMoveoutConfirmModal(false)}
              className="px-5 py-2 rounded-lg border border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
              취소
            </button>
            <button onClick={() => { setShowMoveoutConfirmModal(false); doAction(); }}
              className="px-5 py-2 rounded-lg border-none bg-hm-danger text-white font-bold text-xs cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
              확인
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};
