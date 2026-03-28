import React from 'react';
import { Card, RoomTypeBadge, ContractDropZone } from '@/components';
import { inputStyle } from '@/components/Field';
import { getRoomType } from '@/config';
import { roomMasterData } from '@/data';
import { fmt } from '@/utils';
import { getLateFee } from '../utils/billingStatus';

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
  renewFiles,
  setRenewFiles,
}) => {
  const t = activeTenants.find(x => x.id === selectedTenant.id) || selectedTenant;
  const depositLabel = getRoomType(t.building, t.room) === "단기" ? "예치금" : "보증금";
  const hasMoveOutPhotos = (t.moveOutPhotos || []).length > 0;

  if (actionDone) {
    const msgs: Record<string, string> = { moveout: "퇴실 처리가 완료되었습니다", movein: "입주 처리가 완료되었습니다", renew: "연장계약이 등록되었습니다" };
    return (
      <Card style={{ padding: "40px 20px", textAlign: "center" }}>
        <span style={{ fontSize: 48 }}>✅</span>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#059669", marginTop: 12 }}>{msgs[actionMode!]}</div>
        <div style={{ fontSize: 13, color: "#8F95A3", marginTop: 6 }}>{t.building} {t.room}호 {t.name}</div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }} onClick={() => { setActionMode(null); setSelectedTenant(null); }}>
        <span style={{ fontSize: 20 }}>&larr;</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#3B82F6" }}>임차인 목록으로</span>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #F3F4F6" }}>
            <div><span style={{ fontSize: 11, color: color || "#5F6577", fontWeight: bold ? 700 : 400 }}>{label}</span>{sub && <span style={{ fontSize: 9, color: "#B0B5C1", marginLeft: 6 }}>{sub}</span>}</div>
            <span style={{ fontSize: 12, fontWeight: bold ? 800 : 600, color: color || "#1A1D23" }}>{typeof value === "number" ? (value < 0 ? `-${fmt(Math.abs(value))}` : fmt(value)) : value}</span>
          </div>
        );
        const moveOutPhotos = t.moveOutPhotos || [];
        const moveInCheckPhotos = t.moveInCheckPhotos || [];
        const hasAnyPhotos = moveOutPhotos.length > 0 || moveInCheckPhotos.length > 0;
        return (
        <>
        {/* 사진 비교 버튼 */}
        {hasAnyPhotos && (
          <div style={{ maxWidth: 720, marginBottom: 12 }}>
            <button onClick={() => setMoveoutCompare({ leftIdx: null, rightIdx: null, leftZoom: 1, rightZoom: 1, leftPos: { x: 0, y: 0 }, rightPos: { x: 0, y: 0 }, photos: { left: moveInCheckPhotos, right: moveOutPhotos }, building: t.building, room: t.room })}
              style={{ width: "100%", padding: "14px", borderRadius: 10, border: "2px solid #6366F1", background: "linear-gradient(90deg, #EEF2FF, #FAF5FF)", color: "#6366F1", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
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
        <Card id="settlement-print-area" style={{ maxWidth: 720 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#DC2626", display: "flex", alignItems: "center", gap: 10 }}>
                🚪 퇴실정산서
                <RoomTypeBadge building={t.building} room={t.room} />
                <input type="date" value={moveoutDateStr} onChange={e => setMoveoutDateStr(e.target.value)}
                  style={{ fontSize: 13, fontWeight: 700, padding: "5px 10px", borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontFamily: "inherit", cursor: "pointer" }} />
              </div>
              <div style={{ fontSize: 12, color: "#8F95A3", marginTop: 4 }}>{t.building} {t.room}호 · {t.name} · {t.phone}</div>
            </div>
            <div style={{ padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 800,
              background: isEarlyMoveout ? "#FEF2F2" : "#F0FDF4",
              color: isEarlyMoveout ? "#DC2626" : "#059669",
              border: `1.5px solid ${isEarlyMoveout ? "#FECACA" : "#BBF7D0"}` }}>
              {isEarlyMoveout ? "만기전퇴실" : "만기퇴실"}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isManagementOffice ? "1fr" : "3fr 2fr", gap: 16 }}>
            {/* Left — 계약/기간 정보 (자동) */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>입주자 정보</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>입주자</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12, fontWeight: 600 }}>{t.name}</div></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12 }}>{t.phone}</div></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "20px auto 30px 1fr 30px 60px", gap: 2, marginBottom: 12, alignItems: "center" }}>
                <div style={{ fontSize: 9, color: "#8F95A3" }}>은행</div>
                <select value={refundBank} onChange={e => setRefundBank(e.target.value)} style={{ ...inputStyle, padding: "5px 4px", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                  <option value="" disabled>선택</option>
                  {["KB국민","신한","하나","우리","NH농협","IBK기업","SC제일","씨티","카카오뱅크","케이뱅크","토스뱅크","새마을금고","신협","우체국","수협","광주","전북","제주","경남","부산","대구","BNK","산업","KDB"].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <div style={{ fontSize: 9, color: "#8F95A3" }}>계좌</div><input value={refundAcct} onChange={e => setRefundAcct(e.target.value)} placeholder="계좌번호" style={{ ...inputStyle, padding: "5px 6px", fontSize: 10 }} />
                <div style={{ fontSize: 9, color: "#8F95A3" }}>입금자</div><input value={refundName} onChange={e => setRefundName(e.target.value)} placeholder="입금자명" style={{ ...inputStyle, padding: "5px 6px", fontSize: 10, width: 60 }} />
              </div>

              {showProRata && <>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>사용 기간</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>입주일</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12 }}>{moveInStr || "-"}</div></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>만기일</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12 }}>{t.expiry}</div></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>사용기간</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F0F4FF", fontSize: 12, fontWeight: 700, color: "#2563EB", textAlign: "center" }}>{usagePeriod}</div></div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>계약 정보 (자동)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>{depositLabel}</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F0FDF4", fontSize: 12, fontWeight: 700, color: "#059669", textAlign: "right" }}>{fmt(t.deposit)}</div></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>월세 <span style={{ fontSize: 8, color: isRentPrepaid ? "#059669" : "#DC2626" }}>({isRentPrepaid ? "선불" : "후불"})</span></div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12, fontWeight: 600, textAlign: "right" }}>{fmt(t.rent)}</div></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>관리비 <span style={{ fontSize: 8, color: isMgmtPrepaid ? "#059669" : "#DC2626" }}>({isMgmtPrepaid ? "선불" : "후불"})</span></div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12, fontWeight: 600, textAlign: "right" }}>{fmt(t.mgmt || 0)}</div></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: showCleanFee ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {showCleanFee && <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>퇴실청소비</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#FEF2F2", fontSize: 12, fontWeight: 600, textAlign: "right", color: "#DC2626" }}>{fmt(cleanFee)}</div></div>}
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>수도</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12, textAlign: "right" }}>{fmt(waterAmt)}</div></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>TV/인터넷</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12, textAlign: "right" }}>{fmt(internetAmt)}</div></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>만기일</div><div style={{ padding: "7px 10px", borderRadius: 8, background: "#F8FAFC", fontSize: 12 }}>{t.expiry}</div></div>
              </div>
              </>}

              {/* 수기 입력 영역 */}
              {showManualInputs && <>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#EA580C", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #FED7AA" }}>✏️ 수기 입력 (마지막 청구 이후)</div>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 90px", gap: 6, marginBottom: 6, marginTop: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#EA580C", fontWeight: 600 }}>애완동물</span>
                <input value={manRepairDesc} onChange={e => setManRepairDesc(e.target.value)} placeholder="내역" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, borderColor: "#FED7AA" }} />
                <input value={manRepair || ""} onChange={e => setManRepair(e.target.value)} placeholder="0" style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, textAlign: "right", borderColor: "#FED7AA" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 90px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#EA580C", fontWeight: 600 }}>공제1</span>
                <input value={manWasteDesc} onChange={e => setManWasteDesc(e.target.value)} placeholder="내역" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, borderColor: "#FED7AA" }} />
                <input value={manWaste || ""} onChange={e => setManWaste(e.target.value)} placeholder="0" style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, textAlign: "right", borderColor: "#FED7AA" }} />
              </div>
              {manOther.map((row, i) => (
                <div key={`other${i}`} style={{ display: "grid", gridTemplateColumns: "60px 1fr 90px", gap: 6, marginBottom: i < 2 ? 4 : 8, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#EA580C", fontWeight: 600 }}>공제{i+2}</span>
                  <input value={row.desc} onChange={e => setManOtherRow(i,"desc",e.target.value)} placeholder="내역" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, borderColor: "#FED7AA" }} />
                  <input value={row.amt || ""} onChange={e => setManOtherRow(i,"amt",e.target.value)} placeholder="0" style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, textAlign: "right", borderColor: "#FED7AA" }} />
                </div>
              ))}
              {showRestoration && <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 90px", gap: 6, marginBottom: 8, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#7C3AED", fontWeight: 600 }}>원상복구비</span>
                <input value={manRestorationDesc} onChange={e => setManRestorationDesc(e.target.value)} placeholder="내역" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, borderColor: "#C4B5FD" }} />
                <input value={manRestoration || ""} onChange={e => setManRestoration(e.target.value)} placeholder="0" style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, textAlign: "right", borderColor: "#C4B5FD" }} />
              </div>}
              </>}

              {/* 관리사무소 — 보증금 정보 + 엘리베이터 사용비 */}
              {isManagementOffice && <>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>공제 항목</div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FEF2F2", borderRadius: 8, border: "1.5px solid #FECACA", marginBottom: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={elevatorFee} onChange={e => setElevatorFee(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer" }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626" }}>엘리베이터 사용</div>
                  <div style={{ fontSize: 10, color: "#991B1B" }}>사용 시 100,000원 공제</div>
                </div>
                {elevatorFee && <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 800, color: "#DC2626" }}>{fmt(100000)}원</span>}
              </label>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>보증금 반환</div>
              <div style={{ background: settlement >= 0 ? "#F0FDF4" : "#FEF2F2", borderRadius: 10, padding: "14px 18px", border: `2px solid ${settlement >= 0 ? "#BBF7D0" : "#FECACA"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: settlement >= 0 ? "#065F46" : "#991B1B" }}>{settlement >= 0 ? "반환금액" : "추가청구"}</span>
                    {elevatorFee && <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 2 }}>보증금 {fmt(t.deposit)} - 엘리베이터 {fmt(100000)}</div>}
                  </div>
                  <span style={{ fontSize: 24, fontWeight: 900, color: settlement >= 0 ? "#059669" : "#DC2626" }}>{settlement < 0 ? `-${fmt(Math.abs(settlement))}` : fmt(settlement)}<span style={{ fontSize: 12 }}>원</span></span>
                </div>
              </div>
              </>}
            </div>

            {/* Right — 정산 자동계산 (관리사무소 제외) */}
            {!isManagementOffice && <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>정산 내역 (자동계산)</div>
              {showProRata && <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 4 }}>기산일: {startDay}일 · 일할기준: {daysInMonth}일 · 사용일수: {usedDays}일</div>}

              {/* 반환 항목 */}
              <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "10px 14px", marginBottom: 10, border: "1px solid #BBF7D0" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 4 }}>반환 항목</div>
                <SRow label={depositLabel} value={t.deposit} color="#059669" bold />
                {netRent < 0 && <SRow label="월세 환불" sub={`${daysInMonth - usedDays}일분${unpaidRent > 0 ? " · 미납반영" : ""}`} value={-netRent} color="#059669" />}
                {netMgmt < 0 && <SRow label="관리비 환불" sub={`${daysInMonth - usedDays}일분${unpaidMgmt > 0 ? " · 미납반영" : ""}`} value={-netMgmt} color="#059669" />}
                {netWater < 0 && <SRow label="수도 환불" sub={`${daysInMonth - usedDays}일분${unpaidWater > 0 ? " · 미납반영" : ""}`} value={-netWater} color="#059669" />}
                {netInternet < 0 && <SRow label="TV/인터넷 환불" sub={`${daysInMonth - usedDays}일분${unpaidInternet > 0 ? " · 미납반영" : ""}`} value={-netInternet} color="#059669" />}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", marginTop: 4, borderTop: "1.5px solid #BBF7D0" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#065F46" }}>반환소계</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#059669" }}>{fmt(t.deposit + totalRefund)}</span>
                </div>
              </div>

              {/* 공제 항목 */}
              <div style={{ background: "#FEF2F2", borderRadius: 10, padding: "10px 14px", marginBottom: 10, border: "1px solid #FECACA" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", marginBottom: 4 }}>공제 항목</div>
                {netRent > 0 && <SRow label="월세" sub={`${usedDays}일분${unpaidRent > 0 ? " · 미납반영" : ""}`} value={netRent} color="#DC2626" />}
                {netMgmt > 0 && <SRow label="관리비" sub={`${usedDays}일분${unpaidMgmt > 0 ? " · 미납반영" : ""}`} value={netMgmt} color="#DC2626" />}
                {netWater > 0 && <SRow label="수도" sub={`${usedDays}일분${unpaidWater > 0 ? " · 미납반영" : ""}`} value={netWater} color="#DC2626" />}
                {netInternet > 0 && <SRow label="TV/인터넷" sub={`${usedDays}일분${unpaidInternet > 0 ? " · 미납반영" : ""}`} value={netInternet} color="#DC2626" />}
                {showCleanFee && <SRow label="퇴실청소비" value={cleanFee} color="#DC2626" />}
                {showManualInputs && manElec.map((r,i) => parseNum(r.amt) > 0 && <SRow key={`e${i}`} label={`전기${r.period ? ` (${r.period})` : ` ${i+1}`}`} value={parseNum(r.amt)} color="#DC2626" />)}
                {showManualInputs && manGas.map((r,i) => parseNum(r.amt) > 0 && <SRow key={`g${i}`} label={`가스${r.period ? ` (${r.period})` : ` ${i+1}`}`} value={parseNum(r.amt)} color="#DC2626" />)}
                {showManualInputs && parseNum(manRepair) > 0 && <SRow label={`애완동물 ${manRepairDesc ? `(${manRepairDesc})` : ""}`} value={parseNum(manRepair)} color="#DC2626" />}
                {showManualInputs && parseNum(manWaste) > 0 && <SRow label={`공제1 ${manWasteDesc ? `(${manWasteDesc})` : ""}`} value={parseNum(manWaste)} color="#DC2626" />}
                {showManualInputs && manOther.map((r,i) => parseNum(r.amt) > 0 && <SRow key={`o${i}`} label={`공제${i+2}${r.desc ? ` (${r.desc})` : ""}`} value={parseNum(r.amt)} color="#DC2626" />)}
                {showRestoration && parseNum(manRestoration) > 0 && <SRow label={`원상복구비 ${manRestorationDesc ? `(${manRestorationDesc})` : ""}`} value={parseNum(manRestoration)} color="#7C3AED" />}
                {showPenalty && penaltyTotal > 0 && <>
                  <div style={{ height: 1, background: "#FECACA", margin: "4px 0" }} />
                  {penalty7 > 0 && <SRow label="7일패널티" sub={`귀속: ${penaltyRecipient}`} value={penalty7} color="#DC2626" />}
                  {penaltyComm > 0 && <SRow label="중개수수료" value={penaltyComm} color="#DC2626" />}
                </>}
                {lateFee > 0 && <SRow label="연체수수료" sub="임대료 월 5%" value={lateFee} color="#DC2626" />}
                {lateFeeOverrides[`${t.building}_${t.room}`]?.type === "exclude" && (
                  <div style={{ fontSize: 10, color: "#059669", fontWeight: 700, textAlign: "right", padding: "2px 0" }}>수금관리에서 연체수수료 제외 처리됨</div>
                )}
                {lateFeeOverrides[`${t.building}_${t.room}`]?.type === "discount" && (
                  <div style={{ fontSize: 10, color: "#2563EB", fontWeight: 700, textAlign: "right", padding: "2px 0" }}>수금관리에서 연체수수료 {fmt(lateFeeOverrides[`${t.building}_${t.room}`].amount)}원 할인 적용</div>
                )}
                {prevUnpaid > 0 && <>
                  <div style={{ height: 1, background: "#FECACA", margin: "4px 0" }} />
                  <SRow label="전월 미납금" value={prevUnpaid} color="#DC2626" bold />
                </>}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", marginTop: 4, borderTop: "1.5px solid #FECACA" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#991B1B" }}>공제소계</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#DC2626" }}>-{fmt(totalDeduct)}</span>
                </div>
              </div>

              {/* 최종 정산 */}
              <div style={{ background: settlement >= 0 ? "#F0FDF4" : "#FEF2F2", borderRadius: 10, padding: "14px 18px", border: `2px solid ${settlement >= 0 ? "#BBF7D0" : "#FECACA"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: settlement >= 0 ? "#065F46" : "#991B1B" }}>{settlement >= 0 ? "반환금액" : "추가청구"}</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: settlement >= 0 ? "#059669" : "#DC2626" }}>{settlement < 0 ? `-${fmt(Math.abs(settlement))}` : fmt(settlement)}<span style={{ fontSize: 12 }}>원</span></span>
                </div>
              </div>

              {showPenalty && isEarlyMoveout && (
                <div style={{ marginTop: 8, padding: "6px 10px", background: "#FEF2F2", borderRadius: 6, border: "1px solid #FECACA", fontSize: 10, color: "#DC2626", fontWeight: 600 }}>
                  ⚠️ 만기전퇴실 위약금: (월세+관리비)/30x7 = {fmt(penalty7)}원{penaltyComm > 0 ? ` + 중개수수료 ${fmt(penaltyComm)}원` : ""}
                  <span style={{ marginLeft: 8, padding: "2px 6px", borderRadius: 4, background: penaltyRecipient === "하우스맨" ? "#EFF6FF" : "#FFF7ED", color: penaltyRecipient === "하우스맨" ? "#2563EB" : "#EA580C", fontWeight: 800, fontSize: 9 }}>귀속: {penaltyRecipient}</span>
                </div>
              )}
            </div>}
          </div>

          {/* 퇴실 검침값 현장 입력 */}
          {showManualInputs && (
            <div style={{ marginTop: 16, padding: "14px 16px", background: "#F0F4FF", borderRadius: 12, border: "2px solid #BFDBFE" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1E40AF", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>📋 퇴실 검침값</div>
              {roomType === "근생" && (
                <div style={{ padding: "8px 12px", background: "#FEF3C7", borderRadius: 8, marginBottom: 10, fontSize: 11, fontWeight: 600, color: "#92400E", border: "1px solid #FDE68A" }}>
                  근생은 전기/가스/수도 이사정산을 임차인이 직접 처리합니다
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#FBBF24", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>⚡ 전기 당월지침</div>
                  {prevElecReading && <div style={{ fontSize: 9, color: "#6B7280", marginBottom: 4 }}>이전: {prevElecReading.value} kWh ({prevElecReading.date || "-"})</div>}
                  <input
                    type="number" inputMode="numeric"
                    value={meterElecReading} onChange={e => setMeterElecReading(e.target.value)}
                    placeholder="0"
                    style={{ ...inputStyle, width: "100%", padding: "14px 12px", fontSize: 20, fontWeight: 800, textAlign: "center", borderColor: "#FBBF24", borderWidth: 2, borderRadius: 10, background: "#FFFBEB" }}
                  />
                  <div style={{ fontSize: 9, color: "#8F95A3", marginTop: 3 }}>kWh</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>🔥 가스 당월지침</div>
                  {prevGasReading && <div style={{ fontSize: 9, color: "#6B7280", marginBottom: 4 }}>이전: {prevGasReading.value} m3 ({prevGasReading.date || "-"})</div>}
                  <input
                    type="number" inputMode="numeric"
                    value={meterGasReading} onChange={e => setMeterGasReading(e.target.value)}
                    placeholder="0"
                    style={{ ...inputStyle, width: "100%", padding: "14px 12px", fontSize: 20, fontWeight: 800, textAlign: "center", borderColor: "#60A5FA", borderWidth: 2, borderRadius: 10, background: "#EFF6FF" }}
                  />
                  <div style={{ fontSize: 9, color: "#8F95A3", marginTop: 3 }}>m3</div>
                </div>
              </div>
            </div>
          )}

          {/* 전기/가스 금액 입력 */}
          {showManualInputs && (
            <div style={{ marginTop: 12, padding: "12px 14px", background: "#FFFBEB", borderRadius: 10, border: "1.5px solid #FDE68A" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#EA580C", marginBottom: 8 }}>⚡🔥 전기 / 가스 청구금액</div>
              {(meterPhotos.electric.length > 0 || meterPhotos.gas.length > 0) && (
                <div className="no-print" style={{ marginBottom: 10, padding: 8, background: "#fff", borderRadius: 8, border: "1px solid #FDE68A" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>📷 계량기 사진 (클릭하여 확대)</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {meterPhotos.electric.map(pi => {
                      const photo = moveOutPhotos[pi];
                      if (!photo) return null;
                      const src = typeof photo === "string" ? photo : URL.createObjectURL(photo);
                      return (
                        <div key={`e${pi}`} onClick={() => setMeterZoom({ src, zoom: 1, pos: { x: 0, y: 0 } })}
                          style={{ position: "relative", cursor: "pointer" }}>
                          <img src={src} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "2px solid #FBBF24" }} />
                          <span style={{ position: "absolute", bottom: 2, left: 2, fontSize: 7, fontWeight: 800, padding: "1px 4px", borderRadius: 3, background: "#FBBF24", color: "#000" }}>⚡전기</span>
                        </div>
                      );
                    })}
                    {meterPhotos.gas.map(pi => {
                      const photo = moveOutPhotos[pi];
                      if (!photo) return null;
                      const src = typeof photo === "string" ? photo : URL.createObjectURL(photo);
                      return (
                        <div key={`g${pi}`} onClick={() => setMeterZoom({ src, zoom: 1, pos: { x: 0, y: 0 } })}
                          style={{ position: "relative", cursor: "pointer" }}>
                          <img src={src} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "2px solid #60A5FA" }} />
                          <span style={{ position: "absolute", bottom: 2, left: 2, fontSize: 7, fontWeight: 800, padding: "1px 4px", borderRadius: 3, background: "#60A5FA", color: "#000" }}>🔥가스</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#EA580C", fontWeight: 600, marginBottom: 4 }}>전기</div>
                  {manElec.map((row, i) => (
                    <div key={`elec${i}`} style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 4, marginBottom: 4, alignItems: "center" }}>
                      <input value={row.period} onChange={e => setManElecRow(i,"period",e.target.value)} placeholder={`기간 ${i+1}`} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, borderColor: "#FED7AA" }} />
                      <input value={row.amt || ""} onChange={e => setManElecRow(i,"amt",e.target.value)} placeholder="0" style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, textAlign: "right", borderColor: "#FED7AA" }} />
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#EA580C", fontWeight: 600, marginBottom: 4 }}>가스</div>
                  {manGas.map((row, i) => (
                    <div key={`gas${i}`} style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 4, marginBottom: 4, alignItems: "center" }}>
                      <input value={row.period} onChange={e => setManGasRow(i,"period",e.target.value)} placeholder={`기간 ${i+1}`} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, borderColor: "#FED7AA" }} />
                      <input value={row.amt || ""} onChange={e => setManGasRow(i,"amt",e.target.value)} placeholder="0" style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, textAlign: "right", borderColor: "#FED7AA" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 근생 원상복구 확인 */}
          {showRestoration && (
            <div style={{ marginTop: 16, padding: "14px 16px", background: "#F5F3FF", borderRadius: 12, border: "2px solid #DDD6FE" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#7C3AED", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>🔧 원상복구 확인</div>
              <div style={{ padding: "8px 12px", background: "#EDE9FE", borderRadius: 8, marginBottom: 12, fontSize: 11, fontWeight: 600, color: "#6D28D9", border: "1px solid #DDD6FE" }}>
                근생은 전기/가스/수도 이사정산을 임차인이 직접 처리합니다
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>복구 상태</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["미확인", "진행중", "확인완료"].map(s => (
                      <button key={s} onClick={() => setRestorationStatus(s)}
                        style={{
                          flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                          border: restorationStatus === s ? "2px solid" : "1.5px solid #E0E3E9",
                          background: restorationStatus === s ? (s === "확인완료" ? "#F0FDF4" : s === "진행중" ? "#FEF3C7" : "#FEF2F2") : "#fff",
                          color: restorationStatus === s ? (s === "확인완료" ? "#059669" : s === "진행중" ? "#92400E" : "#DC2626") : "#8F95A3",
                          borderColor: restorationStatus === s ? (s === "확인완료" ? "#BBF7D0" : s === "진행중" ? "#FDE68A" : "#FECACA") : "#E0E3E9",
                        }}>
                        {s === "미확인" ? "미확인" : s === "진행중" ? "진행중" : "확인완료"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>점검자 코멘트</div>
                  <input value={restorationComment} onChange={e => setRestorationComment(e.target.value)}
                    placeholder="점검 결과 메모..."
                    style={{ ...inputStyle, width: "100%", padding: "8px 10px", fontSize: 11, borderColor: "#DDD6FE" }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>점검 사진</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {restorationPhotos.map((photo: any, i: number) => {
                    const src = typeof photo === "string" ? photo : URL.createObjectURL(photo);
                    return (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={src} alt="" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 6, border: "2px solid #DDD6FE" }}
                          onClick={() => setMeterZoom({ src, zoom: 1, pos: { x: 0, y: 0 } })} />
                        <button onClick={() => setRestorationPhotos((prev: any[]) => prev.filter((_: any, j: number) => j !== i))}
                          style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", border: "none", background: "#DC2626", color: "#fff", fontSize: 10, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>x</button>
                      </div>
                    );
                  })}
                  <label style={{ width: 70, height: 70, borderRadius: 6, border: "2px dashed #DDD6FE", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#FAFAFE" }}>
                    <span style={{ fontSize: 24, color: "#C4B5FD" }}>+</span>
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
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>퇴실 메모</div>
            <textarea rows={2} placeholder="퇴실 사유, 참고사항..." style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontSize: 12, padding: "10px 12px" }} />
          </div>

          {/* 인쇄 전용: 하단 */}
          <div className="print-only" style={{ display: "none", justifyContent: "center", marginTop: 16, paddingTop: 8, borderTop: "1px solid #ddd", fontSize: 9, color: "#aaa" }}>
            하우스맨 건물관리 시스템 · {new Date().toLocaleDateString("ko-KR")} 출력
          </div>

          {/* Buttons */}
          <div className="no-print" style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setActionMode(null); setSelectedTenant(null); }} style={{ flex: 1, padding: "13px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
            <button onClick={() => { window.print(); }}
              style={{ flex: 1, padding: "13px", borderRadius: 10, border: "1.5px solid #3B82F6", background: "#EFF6FF", color: "#2563EB", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>🖨 프린트</button>
            <button
              disabled={!hasMoveOutPhotos}
              onClick={() => { if (hasMoveOutPhotos && window.confirm("정말 퇴실처리하겠습니다.\nYes를 누르면 다시 되돌릴 수 없습니다.")) doAction(); }}
              style={{ flex: 2, padding: "13px", borderRadius: 10, border: "none", background: hasMoveOutPhotos ? "#DC2626" : "#E0E3E9", color: hasMoveOutPhotos ? "#fff" : "#8F95A3", fontWeight: 800, fontSize: 14, cursor: hasMoveOutPhotos ? "pointer" : "not-allowed", fontFamily: "inherit", opacity: hasMoveOutPhotos ? 1 : 0.6 }}
            >{hasMoveOutPhotos ? "🚪 퇴실확정" : "📷 퇴실사진 등록 필요"}</button>
          </div>
        </Card>
        </>
        );
      })()}

      {actionMode === "movein" && (
        <Card>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>📦 입주 처리 <span style={{ fontSize: 12, fontWeight: 500, color: "#8F95A3" }}>신규 임차인 등록</span></div>
          <div style={{ padding: "12px 16px", background: "#F0F4FF", borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#3B82F6", fontWeight: 600 }}>📍 {t.building} {t.room}호 (현 임차인: {t.name})</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>입주자명</div><input placeholder="이름" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} /></div>
            <div><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>연락처</div><input placeholder="010-0000-0000" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>계약일</div><input type="date" defaultValue="2026-02-22" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} /></div>
            <div><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>입주일</div><input type="date" defaultValue="2026-03-01" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} /></div>
            <div><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>만기일</div><input type="date" defaultValue="2026-09-01" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>{depositLabel}</div><input placeholder="0" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} /></div>
            <div><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>월세</div><input placeholder="0" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} /></div>
            <div><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>관리비</div><input placeholder="0" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>유형</div>
              <select defaultValue={t.type} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                {["단기", "일반임대", "근생", "관리사무소"].map(tp => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setActionMode(null); setSelectedTenant(null); }} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
            <button onClick={doAction} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "#059669", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>📦 입주 확정</button>
          </div>
        </Card>
      )}

      {actionMode === "renew" && (
        <Card>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#3B82F6", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>📝 연장계약 <span style={{ fontSize: 12, fontWeight: 500, color: "#8F95A3" }}>{t.building} {t.room}호 {t.name}</span></div>
          <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E8ECF0", marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8F95A3", marginBottom: 8 }}>현재 계약</div>
            <div style={{ display: "flex", gap: 20, fontSize: 12, flexWrap: "wrap" }}>
              <div><span style={{ color: "#8F95A3" }}>월세</span> <span style={{ fontWeight: 700 }}>{fmt(t.rent)}원</span></div>
              <div><span style={{ color: "#8F95A3" }}>관리비</span> <span style={{ fontWeight: 700 }}>{fmt(t.mgmt)}원</span></div>
              <div><span style={{ color: "#8F95A3" }}>{depositLabel}</span> <span style={{ fontWeight: 700 }}>{fmt(t.deposit)}원</span></div>
              <div><span style={{ color: "#8F95A3" }}>만기</span> <span style={{ fontWeight: 700 }}>{t.expiry}</span></div>
              <div><span style={{ color: "#8F95A3" }}>임대료</span> <span style={{ fontWeight: 700 }}>{t.rentPayType === "후불" ? "후불" : "선불"}</span></div>
              <div><span style={{ color: "#8F95A3" }}>관리비</span> <span style={{ fontWeight: 700 }}>{t.mgmtPayType === "후불" ? "후불" : "선불"}</span></div>
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1A1D23", marginBottom: 10 }}>연장계약 조건</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>계약 작성일</div><input id="rn-contractDate" type="date" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} /></div>
            <div><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>새 계약 시작일</div><input id="rn-startDate" type="date" defaultValue={t.expiry} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} /></div>
            <div><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>새 만기일</div><input id="rn-expiry" type="date" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>새 {depositLabel}</div>
              <input id="rn-deposit" defaultValue={t.deposit} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} />
              <div style={{ fontSize: 9, color: "#8F95A3", marginTop: 3 }}>현재 {fmt(t.deposit)}원</div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#8F95A3" }}>새 월세</span>
                <label style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
                  <input id="rn-rentPostpaid" type="checkbox" defaultChecked={t.rentPayType === "후불"} style={{ width: 13, height: 13, cursor: "pointer" }} />
                  <span style={{ fontSize: 9, color: "#DC2626", fontWeight: 600 }}>후불</span>
                </label>
              </div>
              <input id="rn-rent" defaultValue={t.rent} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} />
              <div style={{ fontSize: 9, color: "#8F95A3", marginTop: 3 }}>현재 {fmt(t.rent)}원 ({t.rentPayType === "후불" ? "후불" : "선불"})</div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#8F95A3" }}>새 관리비</span>
                <label style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
                  <input id="rn-mgmtPostpaid" type="checkbox" defaultChecked={t.mgmtPayType === "후불"} style={{ width: 13, height: 13, cursor: "pointer" }} />
                  <span style={{ fontSize: 9, color: "#DC2626", fontWeight: 600 }}>후불</span>
                </label>
              </div>
              <input id="rn-mgmt" defaultValue={t.mgmt} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit" }} />
              <div style={{ fontSize: 9, color: "#8F95A3", marginTop: 3 }}>현재 {fmt(t.mgmt)}원 ({t.mgmtPayType === "후불" ? "후불" : "선불"})</div>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}><div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>계약 메모</div><textarea id="rn-memo" rows={2} placeholder="인상 사유, 협의 내용, 특약 등..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 13, fontFamily: "inherit", resize: "vertical" }} /></div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>📎 계약서 첨부</div>
            <ContractDropZone
              files={renewFiles}
              onAdd={(newFiles: any[]) => setRenewFiles((prev: any[]) => [...prev, ...newFiles])}
              onRemove={(idx: number) => setRenewFiles((prev: any[]) => prev.filter((_: any, i: number) => i !== idx))}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setActionMode(null); setSelectedTenant(null); setRenewFiles([]); }} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
            <button onClick={doAction} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "#3B82F6", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>📝 연장계약 등록</button>
          </div>
        </Card>
      )}
    </div>
  );
};
