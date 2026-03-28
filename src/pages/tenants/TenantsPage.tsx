import { useState, useMemo, useEffect, useCallback } from 'react';
import { buildings, roomMasterData, billingConfig } from '@/data';
import { getRoomType } from '@/config';
import { useIsMobile, fmt } from '@/utils';
import { matchKorean } from '@/utils/koreanSearch';
import { Card, SectionTitle } from '@/components';
import { PhotoDropZone } from '@/components/PhotoDropZone';
import { getBillingStatus, getLateFee } from './utils/billingStatus';
import { getBillingSlots, singleAcctModes } from './utils/billingSlots';
import { TenantSearchBar } from './components/TenantSearchBar';
import { TenantSummaryCards } from './components/TenantSummaryCards';
import { TenantList } from './components/TenantList';
import { TenantDetail } from './components/TenantDetail';
import { TenantContractCard } from './components/TenantContractCard';
import { MoveOutModal } from './components/MoveOutModal';

export const TenantsPage = ({ myBuildings = [], parkingInfo = {}, setParkingInfo, pendingContract, setPendingContract, pendingMoveout, setPendingMoveout, buildingAccounts = {}, allBuildings = [], activeTenants = [], setActiveTenants, pastTenantsData = {}, setPastTenantsData, activeVacancies = [], setActiveVacancies, calendarEvts = [], setCalendarEvts, billingHistory = [], roomBalances = {}, lateFeeOverrides = {}, buildingData = {} }: Record<string, any>) => {
  const isMobile = useIsMobile();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [selectedTenant, setSelectedTenant] = useState<Record<string, any> | null>(null);
  const [actionMode, setActionMode] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [detailEdit, setDetailEdit] = useState(false);
  const [renewEditMode, setRenewEditMode] = useState(false);
  const [showContractHistory, setShowContractHistory] = useState(false);
  const [renewFiles, setRenewFiles] = useState<any[]>([]);
  const [photoModalTenant, setPhotoModalTenant] = useState<Record<string, any> | null>(null);
  const [checkPhotoEdit, setCheckPhotoEdit] = useState<Record<string, any> | null>(null);
  const [checkPhotoView, setCheckPhotoView] = useState<Record<string, any> | null>(null);
  const [photoViewer, setPhotoViewer] = useState<Record<string, any> | null>(null);
  const [billingPopup, setBillingPopup] = useState<Record<string, any> | null>(null);
  // 퇴실정산서 수기 입력 항목
  const [manElec, setManElec] = useState([{period:"",amt:0},{period:"",amt:0},{period:"",amt:0}]);
  const [manGas, setManGas] = useState([{period:"",amt:0},{period:"",amt:0},{period:"",amt:0}]);
  const [manRepair, setManRepair] = useState<number | string>(0);
  const [manWaste, setManWaste] = useState<number | string>(0);
  const [manOther, setManOther] = useState([{desc:"",amt:0},{desc:"",amt:0},{desc:"",amt:0}]);
  const [manRepairDesc, setManRepairDesc] = useState("");
  const [manWasteDesc, setManWasteDesc] = useState("");
  const setManElecRow = (i: number, k: string, v: any) => setManElec(prev => prev.map((r,j) => j===i ? {...r,[k]:v} : r));
  const setManGasRow = (i: number, k: string, v: any) => setManGas(prev => prev.map((r,j) => j===i ? {...r,[k]:v} : r));
  const setManOtherRow = (i: number, k: string, v: any) => setManOther(prev => prev.map((r,j) => j===i ? {...r,[k]:v} : r));
  const [manRestoration, setManRestoration] = useState<number | string>(0);
  const [manRestorationDesc, setManRestorationDesc] = useState("");
  const [moveoutDateStr, setMoveoutDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [moveoutCompare, setMoveoutCompare] = useState<Record<string, any> | null>(null);
  const [meterPhotos, setMeterPhotos] = useState<{ electric: number[]; gas: number[] }>({ electric: [], gas: [] });
  const [meterZoom, setMeterZoom] = useState<Record<string, any> | null>(null);
  const [refundBank, setRefundBank] = useState("");
  const [refundAcct, setRefundAcct] = useState("");
  const [refundName, setRefundName] = useState("");
  const [elevatorFee, setElevatorFee] = useState(false);
  const [restorationStatus, setRestorationStatus] = useState("미확인");
  const [restorationComment, setRestorationComment] = useState("");
  const [restorationPhotos, setRestorationPhotos] = useState<any[]>([]);
  const [meterElecReading, setMeterElecReading] = useState("");
  const [meterGasReading, setMeterGasReading] = useState("");

  // pendingMoveout: 입퇴실일정에서 버튼 클릭 시 해당 임차인 퇴실정산서로 이동
  useEffect(() => {
    if (pendingMoveout) {
      const t = activeTenants.find((x: any) => x.building === pendingMoveout.building && String(x.room) === String(pendingMoveout.room));
      if (t) {
        setSelectedTenant(t);
        setActionMode("moveout");
        // 퇴실문자에서 은행/계좌/입금자 자동 추출
        const calEvt = (calendarEvts || []).find((e: any) => e.type === "퇴실" && e.building === pendingMoveout.building && String(e.room) === String(pendingMoveout.room));
        if (calEvt && calEvt.moveOutMsg) {
          const msg = calEvt.moveOutMsg;
          const bankList = ["KB국민","신한","하나","우리","NH농협","IBK기업","SC제일","씨티","카카오뱅크","케이뱅크","토스뱅크","새마을금고","신협","우체국","수협","광주","전북","제주","경남","부산","대구","BNK","산업","KDB","국민은행","농협은행","기업은행","국민","농협","기업"];
          const normBank = (b: string) => b === "국민은행" || b === "국민" ? "KB국민" : b === "농협은행" || b === "농협" ? "NH농협" : b === "기업은행" || b === "기업" ? "IBK기업" : b;
          const bankMatch = bankList.find(b => msg.includes(b));
          if (bankMatch) {
            setRefundBank(normBank(bankMatch));
            const afterBank = msg.slice(msg.indexOf(bankMatch) + bankMatch.length);
            const acctM = afterBank.match(/([\d][\d\-]{5,})/);
            if (acctM) setRefundAcct(acctM[1]);
            const nameM = afterBank.match(/([가-힣]{2,4})/);
            if (nameM) setRefundName(nameM[1]);
          }
        }
      }
      setPendingMoveout?.(null);
    }
  }, [pendingMoveout]);

  // 퇴실모드 진입 시 수기 필드 초기화 + 단기 미납 시 전기/가스 자동기입
  useEffect(() => {
    if (actionMode === "moveout" && selectedTenant) {
      const tCur = activeTenants.find((x: any) => x.id === selectedTenant.id) || selectedTenant;
      if (tCur.pet) {
        setManRepairDesc(tCur.pet);
      } else {
        setManRepairDesc("");
      }
      setManRepair(0); setManWaste(0); setManWasteDesc("");
      setManRestoration(0); setManRestorationDesc("");
      setElevatorFee(false);
      setRestorationStatus("미확인"); setRestorationComment(""); setRestorationPhotos([]);
      setMeterElecReading(""); setMeterGasReading("");
      const emptyElec = [{period:"",amt:0},{period:"",amt:0},{period:"",amt:0}];
      const emptyGas = [{period:"",amt:0},{period:"",amt:0},{period:"",amt:0}];
      const emptyOther = [{desc:"",amt:0},{desc:"",amt:0},{desc:"",amt:0}];
      const t = activeTenants.find((x: any) => x.id === selectedTenant.id) || selectedTenant;
      const rt = getRoomType(t.building, t.room);
      if (rt === "단기" && (t.overdue || 0) > 0) {
        const bcList = billingConfig.filter((x: any) => x.b === t.building && x.r === t.room);
        const newElec = [...emptyElec];
        const newGas = [...emptyGas];
        bcList.forEach((bc: any, idx: number) => {
          if (idx > 2) return;
          if (bc.ea > 0) {
            const ePeriod = `${bc.es.slice(5).replace(/\//g,".")}~${bc.ee.slice(5).replace(/\//g,".")}`;
            newElec[idx] = { period: `${ePeriod} (${bc.eu}kWh)`, amt: bc.ea };
          }
          if (bc.ga > 0) {
            newGas[idx] = { period: `${bc.gp} (${bc.gu}㎥)`, amt: bc.ga };
          }
        });
        setManElec(newElec);
        setManGas(newGas);
      } else {
        setManElec(emptyElec);
        setManGas(emptyGas);
      }
      setManOther(emptyOther);
    }
  }, [actionMode, selectedTenant]);

  const isSingleAcct = (buildingName: string) => {
    const bldg = allBuildings.find((b: any) => b.name === buildingName);
    if (!bldg) return false;
    const bType = bldg.type || "단기";
    if (!bType.split("+").map((s: string) => s.trim()).every((t: string) => t === "단기")) return false;
    const accts = buildingAccounts[buildingName] || {};
    const mode = accts.mode1 || "";
    return singleAcctModes.has(mode);
  };

  const buildingOrder = buildings.map((b: any) => b.name);
  const myTenants = myBuildings.length > 0 ? activeTenants.filter((t: any) => myBuildings.includes(t.building)) : activeTenants;
  const filtered = useMemo(() => myTenants.filter((t: any) => {
    if (search && !matchKorean(t.name, search) && !matchKorean(t.building, search) && !t.room.includes(search)) return false;
    if (typeFilter !== "전체" && getRoomType(t.building, t.room) !== typeFilter) return false;
    return true;
  }).sort((a: any, b: any) => {
    const bi = buildingOrder.indexOf(a.building) - buildingOrder.indexOf(b.building);
    if (bi !== 0) return bi;
    const aBase = a.room.toUpperCase().startsWith("B");
    const bBase = b.room.toUpperCase().startsWith("B");
    if (aBase && !bBase) return -1;
    if (!aBase && bBase) return 1;
    return a.room.localeCompare(b.room, undefined, { numeric: true });
  }), [myTenants, search, typeFilter, buildingOrder]);

  const [visibleCount, setVisibleCount] = useState(100);
  useEffect(() => { setVisibleCount(100); }, [search, typeFilter]);
  const visibleFiltered = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const doAction = () => {
    if (actionMode === "renew" && selectedTenant) {
      const t = activeTenants.find((x: any) => x.id === selectedTenant.id) || selectedTenant;
      const g = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value ?? "";
      const newStartDate = g("rn-startDate");
      const newExpiry = g("rn-expiry");
      const newRent = Number(g("rn-rent").replace(/,/g, "")) || t.rent;
      const newMgmt = Number(g("rn-mgmt").replace(/,/g, "")) || t.mgmt;
      const newDeposit = Number(g("rn-deposit").replace(/,/g, "")) || t.deposit;
      const rentPostpaid = (document.getElementById("rn-rentPostpaid") as HTMLInputElement)?.checked;
      const mgmtPostpaid = (document.getElementById("rn-mgmtPostpaid") as HTMLInputElement)?.checked;
      if (!newExpiry) { alert("새 만기일을 입력하세요"); return; }
      const historyKey = `${t.building}_${t.room}`;
      const prevRecord = {
        name: t.name, phone: t.phone,
        moveIn: t.moveIn || "", moveOut: newStartDate || t.expiry || "",
        deposit: t.deposit, rent: t.rent,
        reason: "재계약", settlement: "재계약",
        contractFiles: renewFiles.map((f: any) => f.name),
        renewedAt: new Date().toISOString().slice(0, 10),
      };
      setPastTenantsData?.((prev: any) => ({ ...prev, [historyKey]: [...(prev[historyKey] || []), prevRecord] }));
      const updated = {
        ...t,
        moveIn: newStartDate || t.expiry || t.moveIn,
        expiry: newExpiry,
        rent: newRent,
        mgmt: newMgmt,
        deposit: newDeposit,
        rentPayType: rentPostpaid ? "후불" : "선불",
        mgmtPayType: mgmtPostpaid ? "후불" : "선불",
        overdue: 0,
        prevUnpaid: 0,
        status: "정상",
        contractFiles: renewFiles.map((f: any) => f.name),
      };
      setActiveTenants?.((prev: any[]) => prev.map(x => x.id === t.id ? { ...x, ...updated } : x));
      setSelectedTenant({ ...t, ...updated });
      setRenewFiles([]);
    }
    if (actionMode === "moveout" && selectedTenant) {
      const t = activeTenants.find((x: any) => x.id === selectedTenant.id) || selectedTenant;
      const historyKey = `${t.building}_${t.room}`;
      const expiry = new Date(t.expiry);
      const moveoutDate = new Date(moveoutDateStr);
      const reason = moveoutDate <= expiry ? "만기전퇴실" : "만기퇴실";
      const roomType = getRoomType(t.building, t.room);
      const parseNum = (v: any) => Number(String(v).replace(/,/g, "")) || 0;
      const sumArr = (arr: any[]) => arr.reduce((s, r) => s + parseNum(r.amt), 0);
      const rm = roomMasterData[`${t.building}_${t.room}`] || {};
      const moveInDate = t.moveIn ? new Date(t.moveIn) : null;
      const startDay = moveInDate ? moveInDate.getDate() : 1;
      const cycleStart = new Date(moveoutDate.getFullYear(), moveoutDate.getMonth(), startDay);
      const lastCycleStart = cycleStart <= moveoutDate ? cycleStart : new Date(moveoutDate.getFullYear(), moveoutDate.getMonth() - 1, startDay);
      const nextCycleStart = new Date(lastCycleStart.getFullYear(), lastCycleStart.getMonth() + 1, startDay);
      const daysInMonth = Math.round((nextCycleStart.getTime() - lastCycleStart.getTime()) / 86400000);
      const usedDays = Math.max(0, Math.ceil((moveoutDate.getTime() - lastCycleStart.getTime()) / 86400000));
      const isManOff = roomType === "관리사무소";
      const isShort = roomType === "단기";
      const isRentPre = t.rentPayType !== "후불";
      const isMgmtPre = t.mgmtPayType !== "후불";
      const waterAmt = rm.water ? Number(String(rm.water).replace(/,/g,"")) : 15000;
      const internetAmt = rm.internet ? Number(String(rm.internet).replace(/,/g,"")) : 25000;
      const cleanFee = isShort ? (rm.cleanFee ? Number(String(rm.cleanFee).replace(/,/g,"")) : 120000) : 0;
      const rentDaily = Math.round(t.rent / daysInMonth);
      const mgmtDaily = t.mgmt > 0 ? Math.round(t.mgmt / daysInMonth) : 0;
      const waterDaily = Math.round(waterAmt / daysInMonth);
      const internetDaily = Math.round(internetAmt / daysInMonth);
      const rentProRata = !isManOff ? (isRentPre ? -rentDaily*(daysInMonth-usedDays) : rentDaily*usedDays) : 0;
      const mgmtProRata = !isManOff ? (isMgmtPre ? -mgmtDaily*(daysInMonth-usedDays) : mgmtDaily*usedDays) : 0;
      const isWPre = t.waterPayType !== "후불";
      const isCPre = t.cablePayType !== "후불";
      const waterProRata = !isManOff ? (isWPre ? -waterDaily*(daysInMonth-usedDays) : waterDaily*usedDays) : 0;
      const internetProRata = !isManOff ? (isCPre ? -internetDaily*(daysInMonth-usedDays) : internetDaily*usedDays) : 0;
      const curOverdue = t.overdue || 0;
      const unpaidRent = Math.min(curOverdue, t.rent);
      const unpaidMgmt = Math.min(Math.max(curOverdue - t.rent, 0), t.mgmt || 0);
      const unpaidUtil = Math.max(curOverdue - t.rent - (t.mgmt || 0), 0);
      const totalUtilAmt = waterAmt + internetAmt;
      const unpaidWater = totalUtilAmt > 0 ? Math.round(unpaidUtil * waterAmt / totalUtilAmt) : 0;
      const unpaidInternet = unpaidUtil - unpaidWater;
      const prevUnpaidAmt = t.prevUnpaid || 0;
      const netRent = rentProRata + unpaidRent;
      const netMgmt = mgmtProRata + unpaidMgmt;
      const netWater = waterProRata + unpaidWater;
      const netInternet = internetProRata + unpaidInternet;
      const isEarly = new Date(t.expiry) > moveoutDate;
      const penalty7 = isShort && isEarly ? Math.round((t.rent + (t.mgmt||0)) / 30 * 7) : 0;
      const commBase = rm.commFee ? Number(String(rm.commFee).replace(/,/g,"")) : 0;
      const commEvt = t.commEvent ? (Number(String(t.commEvent).replace(/[^0-9.]/g,""))||0) : 0;
      const penaltyComm = isShort && isEarly ? commBase + commEvt : 0;
      const lateFee = getLateFee(t, roomBalances, lateFeeOverrides);
      const elecTotal = sumArr(manElec);
      const gasTotal = sumArr(manGas);
      const otherTotal = sumArr(manOther);
      const elevatorFeeAmt = isManOff && elevatorFee ? 100000 : 0;
      const bldgData = buildingData[t.building] || {};
      const penaltyRecipient = bldgData.penaltyOwner || "하우스맨";
      const totalDeductAmt = (netRent>0?netRent:0)+(netMgmt>0?netMgmt:0)+(netWater>0?netWater:0)+(netInternet>0?netInternet:0)+cleanFee+elecTotal+gasTotal+parseNum(manRepair)+parseNum(manWaste)+otherTotal+(roomType==="근생"?parseNum(manRestoration):0)+penalty7+penaltyComm+lateFee+prevUnpaidAmt+elevatorFeeAmt;
      const totalRefundAmt = (netRent<0?-netRent:0)+(netMgmt<0?-netMgmt:0)+(netWater<0?-netWater:0)+(netInternet<0?-netInternet:0);
      const finalSettlement = t.deposit + totalRefundAmt - totalDeductAmt;

      const usagePeriod = (() => {
        if (!moveInDate) return "-";
        let m = (moveoutDate.getFullYear() - moveInDate.getFullYear()) * 12 + (moveoutDate.getMonth() - moveInDate.getMonth());
        let d = moveoutDate.getDate() - moveInDate.getDate();
        if (d < 0) { m--; const prev = new Date(moveoutDate.getFullYear(), moveoutDate.getMonth(), 0); d += prev.getDate(); }
        return `${m}개월 ${d}일`;
      })();
      const totalUsedDays = moveInDate ? Math.ceil((moveoutDate.getTime() - moveInDate.getTime()) / 86400000) : 0;

      const record: Record<string, any> = {
        name: t.name, phone: t.phone,
        moveIn: t.moveIn || "", moveOut: moveoutDate.toISOString().slice(0, 10),
        expiry: t.expiry, deposit: t.deposit, rent: t.rent, mgmt: t.mgmt || 0,
        reason, settlement: "정산완료", roomType,
        contractFiles: t.contractFiles || [],
        settlementDate: new Date().toISOString().slice(0, 10),
        daysInMonth, usedDays, startDay,
        usagePeriod, totalUsedDays,
        isRentPrepaid: isRentPre, isMgmtPrepaid: isMgmtPre,
        rentProRata, mgmtProRata, waterProRata, internetProRata,
        netRent, netMgmt, netWater, netInternet,
        cleanFee, waterAmt, internetAmt,
        overdue: curOverdue, prevUnpaid: prevUnpaidAmt,
        unpaidRent, unpaidMgmt, unpaidWater, unpaidInternet,
        penalty7, penaltyComm, lateFee,
        manElec, manGas,
        manRepair: parseNum(manRepair), manRepairDesc,
        manWaste: parseNum(manWaste), manWasteDesc,
        manOther,
        manRestoration: parseNum(manRestoration), manRestorationDesc,
        refundBank, refundAcct, refundName,
        elevatorFee: elevatorFeeAmt,
        penaltyRecipient,
        restorationStatus: roomType === "근생" ? restorationStatus : undefined,
        restorationComment: roomType === "근생" ? restorationComment : undefined,
        meterElecReading: meterElecReading || undefined,
        meterGasReading: meterGasReading || undefined,
        totalDeduct: totalDeductAmt, totalRefund: totalRefundAmt,
        finalSettlement,
        moveInPhotos: t.moveInPhotos || [],
        moveOutPhotos: t.moveOutPhotos || [],
        moveOutCheckPhotos: t.moveOutCheckPhotos || [],
        moveInCheckPhotos: t.moveInCheckPhotos || [],
      };
      // 검침 체인에 퇴실검침 기록
      try {
        const chain = JSON.parse(localStorage.getItem("hm_meterChain") || "{}");
        const moveOutDate = moveoutDate.toISOString().slice(0, 10);
        if (!chain[historyKey]) chain[historyKey] = {};
        if (meterElecReading) {
          chain[historyKey].elec = { value: Number(meterElecReading) || 0, source: "moveout", date: moveOutDate };
        } else if (chain[historyKey].elec) {
          chain[historyKey].elec = { ...chain[historyKey].elec, source: "moveout", date: moveOutDate };
        }
        if (meterGasReading) {
          chain[historyKey].gas = { value: Number(meterGasReading) || 0, source: "moveout", date: moveOutDate };
        } else if (chain[historyKey].gas) {
          chain[historyKey].gas = { ...chain[historyKey].gas, source: "moveout", date: moveOutDate };
        }
        localStorage.setItem("hm_meterChain", JSON.stringify(chain));
      } catch (e) { console.warn("검침체인 저장 실패:", e); }

      const tenantBills = billingHistory.filter((b: any) => b.building === t.building && b.room === t.room && b.name === t.name);
      if (tenantBills.length > 0) record.billingHistory = tenantBills;

      setParkingInfo?.((prev: any) => ({ ...prev, [t.id]: { carNumber: "", carType: "" } }));
      setPastTenantsData?.((prev: any) => ({ ...prev, [historyKey]: [...(prev[historyKey] || []), record] }));
      setActiveTenants?.((prev: any[]) => prev.filter(x => x.id !== t.id));
      setActiveVacancies?.((prev: any[]) => [...prev, {
        building: t.building, room: t.room, type: roomType,
        commBroker: 10, commEvent: "", pw: "",
        deposit: Math.round(t.deposit / 10000), rent: Math.round(t.rent / 10000),
        nego: Math.round(t.rent / 10000), mgmt: Math.round(t.mgmt / 10000),
        water: "포함", cable: "포함", exitFee: 8, days: 0,
        status: "점검/청소중",
        moveInPhotos: t.moveOutCheckPhotos || [],
      }]);
      if (finalSettlement < 0) {
        try {
          const debts = JSON.parse(localStorage.getItem("hm_moveoutDebts") || "[]");
          debts.push({
            id: Date.now(),
            building: t.building,
            room: t.room,
            name: t.name,
            amount: Math.abs(finalSettlement),
            date: moveoutDate.toISOString().slice(0, 10),
            status: "미수",
          });
          localStorage.setItem("hm_moveoutDebts", JSON.stringify(debts));
        } catch (e) { console.warn("퇴실 미수금 저장 실패:", e); }
      }
      console.log("[퇴실확정]", t.building, t.room, t.name, "→ 공실추가, 정산이력추가");
    }
    setActionDone(true);
    setTimeout(() => { setActionDone(false); setActionMode(null); setSelectedTenant(null); }, 1500);
  };

  // Action panel (moveout / movein / renew)
  if (selectedTenant && actionMode) {
    return (
      <MoveOutModal
        selectedTenant={selectedTenant}
        setSelectedTenant={setSelectedTenant}
        actionMode={actionMode}
        setActionMode={setActionMode}
        actionDone={actionDone}
        doAction={doAction}
        activeTenants={activeTenants}
        roomBalances={roomBalances}
        lateFeeOverrides={lateFeeOverrides}
        buildingData={buildingData}
        moveoutDateStr={moveoutDateStr}
        setMoveoutDateStr={setMoveoutDateStr}
        manElec={manElec}
        manGas={manGas}
        manRepair={manRepair}
        manWaste={manWaste}
        manOther={manOther}
        manRepairDesc={manRepairDesc}
        manWasteDesc={manWasteDesc}
        setManElecRow={setManElecRow}
        setManGasRow={setManGasRow}
        setManOtherRow={setManOtherRow}
        setManRepair={setManRepair}
        setManWaste={setManWaste}
        setManRepairDesc={setManRepairDesc}
        setManWasteDesc={setManWasteDesc}
        manRestoration={manRestoration}
        setManRestoration={setManRestoration}
        manRestorationDesc={manRestorationDesc}
        setManRestorationDesc={setManRestorationDesc}
        elevatorFee={elevatorFee}
        setElevatorFee={setElevatorFee}
        restorationStatus={restorationStatus}
        setRestorationStatus={setRestorationStatus}
        restorationComment={restorationComment}
        setRestorationComment={setRestorationComment}
        restorationPhotos={restorationPhotos}
        setRestorationPhotos={setRestorationPhotos}
        meterElecReading={meterElecReading}
        setMeterElecReading={setMeterElecReading}
        meterGasReading={meterGasReading}
        setMeterGasReading={setMeterGasReading}
        refundBank={refundBank}
        setRefundBank={setRefundBank}
        refundAcct={refundAcct}
        setRefundAcct={setRefundAcct}
        refundName={refundName}
        setRefundName={setRefundName}
        meterPhotos={meterPhotos}
        setMeterPhotos={setMeterPhotos}
        meterZoom={meterZoom}
        setMeterZoom={setMeterZoom}
        moveoutCompare={moveoutCompare}
        setMoveoutCompare={setMoveoutCompare}
        renewFiles={renewFiles}
        setRenewFiles={setRenewFiles}
      />
    );
  }

  // Tenant detail
  if (selectedTenant) {
    return (
      <TenantDetail
        selectedTenant={selectedTenant}
        setSelectedTenant={setSelectedTenant}
        activeTenants={activeTenants}
        setActiveTenants={setActiveTenants}
        detailEdit={detailEdit}
        setDetailEdit={setDetailEdit}
        renewEditMode={renewEditMode}
        setRenewEditMode={setRenewEditMode}
        showContractHistory={showContractHistory}
        setShowContractHistory={setShowContractHistory}
        setActionMode={setActionMode}
        parkingInfo={parkingInfo}
        setParkingInfo={setParkingInfo}
        allBuildings={allBuildings}
        buildingAccounts={buildingAccounts}
        roomBalances={roomBalances}
        lateFeeOverrides={lateFeeOverrides}
        billingHistory={billingHistory}
        pastTenantsData={pastTenantsData}
        setPastTenantsData={setPastTenantsData}
        billingPopup={billingPopup}
        setBillingPopup={setBillingPopup}
        photoModalTenant={photoModalTenant}
        setPhotoModalTenant={setPhotoModalTenant}
        checkPhotoEdit={checkPhotoEdit}
        setCheckPhotoEdit={setCheckPhotoEdit}
        checkPhotoView={checkPhotoView}
        setCheckPhotoView={setCheckPhotoView}
        photoViewer={photoViewer}
        setPhotoViewer={setPhotoViewer}
      />
    );
  }

  // Main list view
  return (
    <div>
      <SectionTitle sub={`총 ${activeTenants.length}명 입주 중`}>👤 임차인 관리</SectionTitle>

      {/* 공실→임차인 계약서 입력 */}
      {pendingContract && (
        <TenantContractCard
          pendingContract={pendingContract}
          setPendingContract={setPendingContract}
          hasParking={hasParking}
          setHasParking={setHasParking}
          activeTenants={activeTenants}
          setActiveTenants={setActiveTenants}
          pastTenantsData={pastTenantsData}
          setActiveVacancies={setActiveVacancies}
          setCalendarEvts={setCalendarEvts}
          setParkingInfo={setParkingInfo}
        />
      )}

      <TenantSummaryCards myTenants={myTenants} typeFilter={typeFilter} setTypeFilter={setTypeFilter} />
      <TenantSearchBar search={search} setSearch={setSearch} />
      <TenantList
        filtered={filtered}
        visibleFiltered={visibleFiltered}
        visibleCount={visibleCount}
        setVisibleCount={setVisibleCount}
        setSelectedTenant={setSelectedTenant}
        roomBalances={roomBalances}
        buildingAccounts={buildingAccounts}
        allBuildings={allBuildings}
      />

      {/* 퇴실사진 모달 */}
      {photoModalTenant && (() => {
        const pm = photoModalTenant;
        const photos = pm.moveOutPhotos || [];
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={(e) => { if (e.target === e.currentTarget) setPhotoModalTenant(null); }}>
            <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23" }}>📷 퇴실사진 등록</div>
                  <div style={{ fontSize: 12, color: "#8F95A3", marginTop: 4 }}>{pm.building} {pm.room}호 · {pm.name}</div>
                </div>
                <button onClick={() => setPhotoModalTenant(null)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>✕</button>
              </div>
              <PhotoDropZone
                photos={photos}
                maxPhotos={50}
                label="퇴실사진"
                color="#DC2626"
                onAdd={(newPhotos: any[]) => {
                  const merged = [...photos, ...newPhotos];
                  setActiveTenants?.((prev: any[]) => prev.map(x => x.id === pm.id ? { ...x, moveOutPhotos: merged } : x));
                  setPhotoModalTenant((prev: any) => ({ ...prev, moveOutPhotos: merged }));
                  setSelectedTenant((prev: any) => prev && prev.id === pm.id ? { ...prev, moveOutPhotos: merged } : prev);
                }}
                onRemove={(idx: number) => {
                  const updated = photos.filter((_: any, i: number) => i !== idx);
                  setActiveTenants?.((prev: any[]) => prev.map(x => x.id === pm.id ? { ...x, moveOutPhotos: updated } : x));
                  setPhotoModalTenant((prev: any) => ({ ...prev, moveOutPhotos: updated }));
                  setSelectedTenant((prev: any) => prev && prev.id === pm.id ? { ...prev, moveOutPhotos: updated } : prev);
                }}
              />
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setPhotoModalTenant(null)}
                  style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: photos.length > 0 ? "#059669" : "#3B82F6", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  {photos.length > 0 ? "✅ 완료" : "닫기"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 입주체크사진 보기 모달 */}
      {checkPhotoView && (() => {
        const cpPhotos = checkPhotoView.moveInCheckPhotos || [];
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setCheckPhotoView(null)}>
            <div onClick={(e: any) => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: 16, padding: 24, width: isMobile ? "95%" : 600, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#EA580C" }}>📋 입주체크사진</div>
                  <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>{checkPhotoView.building} {checkPhotoView.room}호 · {checkPhotoView.name} · {cpPhotos.length}장</div>
                </div>
                <button onClick={() => setCheckPhotoView(null)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {cpPhotos.map((src: any, i: number) => (
                  <div key={i} style={{ aspectRatio: "1", borderRadius: 8, border: "1.5px solid #FED7AA", overflow: "hidden", background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {src && src.startsWith("data:image/") && !src.includes("placeholder") ? (
                      <img src={src} alt={`체크 ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 20 }}>📋</span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setCheckPhotoView(null)}
                  style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: "#EA580C", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 입주체크사진 등록/편집 모달 */}
      {checkPhotoEdit && (() => {
        const cpe = checkPhotoEdit;
        const cpPhotos = cpe.moveOutCheckPhotos || [];
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setCheckPhotoEdit(null)}>
            <div onClick={(e: any) => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: 16, padding: 24, width: isMobile ? "95%" : 600, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#EA580C" }}>📋 입주체크사진 등록</div>
                  <div style={{ fontSize: 11, color: "#8F95A3", marginTop: 2 }}>{cpe.building} {cpe.room}호 · {cpe.name}</div>
                </div>
                <button onClick={() => setCheckPhotoEdit(null)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>✕</button>
              </div>
              <PhotoDropZone
                label="입주체크사진" color="#EA580C" maxPhotos={50}
                photos={cpPhotos}
                onAdd={(newPhotos: any[]) => {
                  const updated = [...cpPhotos, ...newPhotos];
                  setCheckPhotoEdit((prev: any) => ({ ...prev, moveOutCheckPhotos: updated }));
                  setActiveTenants?.((prev: any[]) => prev.map(x => x.id === cpe.id ? { ...x, moveOutCheckPhotos: updated } : x));
                  setSelectedTenant((prev: any) => prev && prev.id === cpe.id ? { ...prev, moveOutCheckPhotos: updated } : prev);
                }}
                onRemove={(idx: number) => {
                  const updated = cpPhotos.filter((_: any, i: number) => i !== idx);
                  setCheckPhotoEdit((prev: any) => ({ ...prev, moveOutCheckPhotos: updated }));
                  setActiveTenants?.((prev: any[]) => prev.map(x => x.id === cpe.id ? { ...x, moveOutCheckPhotos: updated } : x));
                  setSelectedTenant((prev: any) => prev && prev.id === cpe.id ? { ...prev, moveOutCheckPhotos: updated } : prev);
                }}
              />
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setCheckPhotoEdit(null)}
                  style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: cpPhotos.length > 0 ? "#059669" : "#EA580C", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  {cpPhotos.length > 0 ? "✅ 완료" : "닫기"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 공과금 청구 이력 팝업 */}
      {billingPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setBillingPopup(null)}>
          <div onClick={(e: any) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", maxWidth: 540, width: "90%", maxHeight: "80vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23" }}>⚡ 공과금 청구 이력</div>
                <div style={{ fontSize: 12, color: "#8F95A3" }}>{billingPopup.tenant.building} {billingPopup.tenant.room}호 {billingPopup.tenant.name} · 입주일 {billingPopup.tenant.moveIn}</div>
              </div>
              <button onClick={() => setBillingPopup(null)}
                style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {billingPopup.bills.map((bill: any, i: number) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: i === 0 ? "#FFFBEB" : "#F8FAFC", border: `1px solid ${i === 0 ? "#FDE68A" : "#E8ECF0"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D23" }}>{bill.date}</span>
                      {i === 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#FEF3C7", color: "#92400E", fontWeight: 700 }}>최근</span>}
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#92400E" }}>{fmt(bill.total)}원</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {bill.items.rent > 0 && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#fff", border: "1px solid #E8ECF0", color: "#5F6577" }}>월세 {fmt(bill.items.rent)}</span>}
                    {bill.items.mgmt > 0 && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#fff", border: "1px solid #E8ECF0", color: "#5F6577" }}>관리비 {fmt(bill.items.mgmt)}</span>}
                    {bill.items.elec > 0 && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#FEF3C7", color: "#92400E" }}>전기 {fmt(bill.items.elec)}</span>}
                    {bill.items.gas > 0 && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#FEE2E2", color: "#991B1B" }}>가스 {fmt(bill.items.gas)}</span>}
                    {bill.items.water > 0 && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#EFF6FF", color: "#2563EB" }}>수도 {fmt(bill.items.water)}</span>}
                    {bill.items.cable > 0 && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#F0FDF4", color: "#059669" }}>인터넷 {fmt(bill.items.cable)}</span>}
                    {bill.items.prevUnpaid > 0 && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#FEF2F2", color: "#DC2626" }}>미납 {fmt(bill.items.prevUnpaid)}</span>}
                  </div>
                </div>
              ))}
            </div>
            {billingPopup.bills.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#8F95A3", fontSize: 13 }}>청구 이력이 없습니다</div>
            )}
          </div>
        </div>
      )}

      {/* 사진 뷰어 모달 */}
      {photoViewer && (() => {
        const { photos, index, zoom = 1, panX = 0, panY = 0, dragging = false } = photoViewer;
        const raw = photos[index];
        const imgSrc = raw instanceof File ? URL.createObjectURL(raw) : raw;
        const isImg = imgSrc && typeof imgSrc === "string" && (imgSrc.startsWith("data:image/") || imgSrc.startsWith("blob:") || imgSrc.startsWith("http"));
        const goTo = (i: number) => setPhotoViewer((prev: any) => ({ ...prev, index: i, zoom: 1, panX: 0, panY: 0 }));
        const goPrev = () => goTo((index - 1 + photos.length) % photos.length);
        const goNext = () => goTo((index + 1) % photos.length);
        const setZoomFn = (z: number) => {
          const nz = Math.max(1, Math.min(5, z));
          setPhotoViewer((prev: any) => nz <= 1 ? { ...prev, zoom: 1, panX: 0, panY: 0 } : { ...prev, zoom: nz });
        };
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}
            onClick={() => { if (zoom <= 1) setPhotoViewer(null); }}
            onWheel={(e: any) => { e.preventDefault(); setZoomFn(zoom + (e.deltaY < 0 ? 0.3 : -0.3)); }}>
            {photos.length > 1 && zoom <= 1 && (
              <button onClick={(e: any) => { e.stopPropagation(); goPrev(); }}
                style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.2)", border: "none", color: "#fff", fontSize: 36, width: 52, height: 52, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, backdropFilter: "blur(4px)" }}>
                &lsaquo;
              </button>
            )}
            <div onClick={(e: any) => e.stopPropagation()}
              style={{ maxWidth: "85vw", maxHeight: "85vh", position: "relative", overflow: "hidden", cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
              onMouseDown={(e: any) => { if (zoom > 1) { e.preventDefault(); setPhotoViewer((prev: any) => ({ ...prev, dragging: true, dragStartX: e.clientX - panX, dragStartY: e.clientY - panY })); } }}
              onMouseMove={(e: any) => { if (photoViewer.dragging && zoom > 1) { setPhotoViewer((prev: any) => ({ ...prev, panX: e.clientX - prev.dragStartX, panY: e.clientY - prev.dragStartY })); } }}
              onMouseUp={() => setPhotoViewer((prev: any) => ({ ...prev, dragging: false }))}
              onMouseLeave={() => setPhotoViewer((prev: any) => ({ ...prev, dragging: false }))}
              onDoubleClick={(e: any) => { e.stopPropagation(); setZoomFn(zoom <= 1 ? 2.5 : 1); }}>
              {isImg ? (
                <img src={imgSrc} alt="" draggable={false}
                  style={{ maxWidth: zoom <= 1 ? "85vw" : "none", maxHeight: zoom <= 1 ? "85vh" : "none", width: zoom > 1 ? `${85 * zoom}vw` : undefined, borderRadius: zoom <= 1 ? 8 : 0, boxShadow: "0 0 60px rgba(0,0,0,.6)", display: "block", transform: zoom > 1 ? `translate(${panX}px, ${panY}px)` : "none", transition: dragging ? "none" : "transform 0.1s" }} />
              ) : (
                <div style={{ width: 320, height: 320, background: "#222", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                  <span style={{ fontSize: 72 }}>🏠</span>
                  <span style={{ color: "#999", fontSize: 13 }}>사진 {index + 1}</span>
                </div>
              )}
            </div>
            {photos.length > 1 && zoom <= 1 && (
              <button onClick={(e: any) => { e.stopPropagation(); goNext(); }}
                style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.2)", border: "none", color: "#fff", fontSize: 36, width: 52, height: 52, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, backdropFilter: "blur(4px)" }}>
                &rsaquo;
              </button>
            )}
            <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 12, zIndex: 3 }}>
              <button onClick={(e: any) => { e.stopPropagation(); setZoomFn(zoom - 0.5); }}
                style={{ background: "rgba(255,255,255,.2)", border: "none", color: "#fff", fontSize: 20, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                &minus;
              </button>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,.5)", padding: "6px 16px", borderRadius: 20, minWidth: 100, textAlign: "center" }}>
                {index + 1} / {photos.length}{zoom > 1 ? ` · ${Math.round(zoom * 100)}%` : ""}
              </div>
              <button onClick={(e: any) => { e.stopPropagation(); setZoomFn(zoom + 0.5); }}
                style={{ background: "rgba(255,255,255,.2)", border: "none", color: "#fff", fontSize: 20, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                +
              </button>
            </div>
            <button onClick={() => setPhotoViewer(null)}
              style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.2)", border: "none", fontSize: 24, color: "#fff", cursor: "pointer", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, backdropFilter: "blur(4px)" }}>
              ✕
            </button>
            {zoom <= 1 && (
              <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,.5)", fontSize: 11, zIndex: 3 }}>
                더블클릭 또는 마우스휠로 확대 · 확대 시 드래그로 이동
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
