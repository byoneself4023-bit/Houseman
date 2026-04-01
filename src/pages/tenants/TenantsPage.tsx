import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { persistUpdateTenant, persistDeactivateTenant } from './tenantsApi';
import { toast } from 'sonner';

export const TenantsPage = ({ myBuildings = [], parkingInfo = {}, setParkingInfo, pendingContract, setPendingContract, pendingMoveout, setPendingMoveout, buildingAccounts = {}, allBuildings = [], activeTenants = [], setActiveTenants, pastTenantsData = {}, setPastTenantsData, activeVacancies = [], setActiveVacancies, calendarEvts = [], setCalendarEvts, billingHistory = [], roomBalances = {}, lateFeeOverrides = {}, buildingData = {}, setBuildingData }: Record<string, any>) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [buildingFilter, setBuildingFilter] = useState("전체");
  const [selectedTenant, setSelectedTenant] = useState<Record<string, any> | null>(null);
  const [actionMode, setActionMode] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [extraCarCount, setExtraCarCount] = useState(0);
  const [detailEdit, setDetailEdit] = useState(false);
  const [renewEditMode, setRenewEditMode] = useState(false);
  const [showContractHistory, setShowContractHistory] = useState(false);
  const [renewFiles, setRenewFiles] = useState<any[]>([]);
  const [showMoveoutDoneModal, setShowMoveoutDoneModal] = useState(false);
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
        // 퇴실체크 공제 데이터 연동
        if (calEvt?.deductionItems?.length > 0) {
          setManOther(calEvt.deductionItems.map((d: any) => ({ desc: d.label || "", amt: d.amount || 0 })));
        }
        // 직접입력 환불계좌 연동
        if (calEvt?.refundBank) {
          setRefundBank(calEvt.refundBank);
          if (calEvt.refundAccount) setRefundAcct(calEvt.refundAccount);
          if (calEvt.refundHolder) setRefundName(calEvt.refundHolder);
        }
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
      // 캘린더 이벤트에서 공제 데이터 가져오기
      const calEvtForDeduction = (calendarEvts || []).find((e: any) => e.type === "퇴실" && e.building === t.building && String(e.room) === String(t.room));
      const deductFromEvt = calEvtForDeduction?.deductionItems?.length > 0
        ? calEvtForDeduction.deductionItems.map((d: any) => ({ desc: d.label || "", amt: d.amount || 0 }))
        : null;
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
      setManOther(deductFromEvt || emptyOther);
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
    if (buildingFilter !== "전체" && t.building !== buildingFilter) return false;
    if (statusFilter === "연체" && !(t.overdue > 0 || t.overdueDays > 0)) return false;
    if (statusFilter === "정상" && (t.overdue > 0 || t.overdueDays > 0)) return false;
    return true;
  }).sort((a: any, b: any) => {
    const bi = buildingOrder.indexOf(a.building) - buildingOrder.indexOf(b.building);
    if (bi !== 0) return bi;
    const aBase = a.room.toUpperCase().startsWith("B");
    const bBase = b.room.toUpperCase().startsWith("B");
    if (aBase && !bBase) return -1;
    if (!aBase && bBase) return 1;
    return a.room.localeCompare(b.room, undefined, { numeric: true });
  }), [myTenants, search, typeFilter, statusFilter, buildingFilter, buildingOrder]);

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
      // Supabase 동기화 (재계약)
      persistUpdateTenant(t.supabaseId, updated).catch(() => toast.error("재계약 DB 저장 실패"));
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

      // 캘린더 퇴실 이벤트에 settled: true 마킹 (공실전환까지 이벤트 유지)
      setCalendarEvts?.((prev: any[]) => prev.map((e: any) =>
        e.type === "퇴실" && e.building === t.building && String(e.room) === String(t.room)
          ? { ...e, settled: true } : e));
      setParkingInfo?.((prev: any) => ({ ...prev, [t.id]: { carNumber: "", carType: "" } }));
      setPastTenantsData?.((prev: any) => ({ ...prev, [historyKey]: [...(prev[historyKey] || []), record] }));
      setActiveTenants?.((prev: any[]) => prev.filter(x => x.id !== t.id));
      // Supabase 동기화 (퇴실 비활성화)
      persistDeactivateTenant(t.supabaseId, moveoutDateStr).catch(() => toast.error("퇴실 DB 반영 실패"));
      setActiveVacancies?.((prev: any[]) => {
        const exists = prev.some((v: any) => v.building === t.building && String(v.room) === String(t.room));
        if (exists) return prev.map((v: any) => v.building === t.building && String(v.room) === String(t.room) ? { ...v, status: "점검/청소중" } : v);
        return [...prev, {
          building: t.building, room: t.room, type: roomType,
          commBroker: 10, commEvent: "", pw: "",
          deposit: Math.round(t.deposit / 10000), rent: Math.round(t.rent / 10000),
          nego: Math.round(t.rent / 10000), mgmt: Math.round(t.mgmt / 10000),
          waterFee: "포함", cable: "포함", exitFee: 8, days: 0,
          status: "점검/청소중",
          moveInPhotos: t.moveOutCheckPhotos || [],
        }];
      });
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
      // 퇴실확정 후 입퇴실일정으로 이동 제안
      toast.success("퇴실이 확정되었습니다", { duration: 3000 });
      setTimeout(() => setShowMoveoutDoneModal(true), 300);
      return;
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
        setActiveTenants={setActiveTenants}
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
        buildingData={buildingData}
        setBuildingData={setBuildingData}
        extraCarCount={extraCarCount}
        setExtraCarCount={setExtraCarCount}
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
      <Card>
        <TenantSearchBar
          search={search} setSearch={setSearch}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          buildingFilter={buildingFilter} setBuildingFilter={setBuildingFilter}
          buildingNames={[...new Set(myTenants.map((t: any) => t.building))] as string[]}
        />
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
      </Card>

      {/* 퇴실사진 모달 */}
      {photoModalTenant && (() => {
        const pm = photoModalTenant;
        const photos = pm.moveOutPhotos || [];
        return (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-5"
            onClick={(e) => { if (e.target === e.currentTarget) setPhotoModalTenant(null); }}>
            <div className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-auto p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-lg font-bold text-hm-text">📷 퇴실사진 등록</div>
                  <div className="text-xs text-hm-text-muted mt-1">{pm.building} {pm.room}호 · {pm.name}</div>
                </div>
                <button onClick={() => setPhotoModalTenant(null)}
                  className="w-8 h-8 rounded-lg border border-hm-input-border bg-white cursor-pointer text-base font-[inherit] hover:bg-hm-bg-hover transition-colors">✕</button>
              </div>
              <PhotoDropZone
                photos={photos}
                maxPhotos={50}
                label="퇴실사진"
                color="var(--color-hm-danger)"
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
              <div className="mt-4 flex justify-end">
                <button onClick={() => setPhotoModalTenant(null)}
                  className={`py-2.5 px-7 rounded-lg border-none text-white font-bold text-sm cursor-pointer font-[inherit] transition-colors ${photos.length > 0 ? "bg-hm-success hover:bg-emerald-700" : "bg-hm-blue hover:bg-hm-blue-dark"}`}>
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
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
            onClick={() => setCheckPhotoView(null)}>
            <div onClick={(e: any) => e.stopPropagation()}
              className={`bg-white rounded-2xl p-6 max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${isMobile ? "w-[95%]" : "w-[600px]"}`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-lg font-bold text-hm-warning">📋 입주체크사진</div>
                  <div className="text-xs text-hm-text-muted mt-0.5">{checkPhotoView.building} {checkPhotoView.room}호 · {checkPhotoView.name} · {cpPhotos.length}장</div>
                </div>
                <button onClick={() => setCheckPhotoView(null)}
                  className="w-8 h-8 rounded-lg border border-hm-input-border bg-white cursor-pointer text-base font-[inherit] hover:bg-hm-bg-hover transition-colors">✕</button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {cpPhotos.map((src: any, i: number) => (
                  <div key={i} className="aspect-square rounded-lg border-[1.5px] border-hm-warning-border overflow-hidden bg-hm-warning-bg flex items-center justify-center">
                    {src && src.startsWith("data:image/") && !src.includes("placeholder") ? (
                      <img src={src} alt={`체크 ${i+1}`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">📋</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setCheckPhotoView(null)}
                  className="py-2.5 px-7 rounded-lg border-none bg-hm-warning text-white font-bold text-sm cursor-pointer font-[inherit] hover:brightness-110 transition">
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
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
            onClick={() => setCheckPhotoEdit(null)}>
            <div onClick={(e: any) => e.stopPropagation()}
              className={`bg-white rounded-2xl p-6 max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${isMobile ? "w-[95%]" : "w-[600px]"}`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-lg font-bold text-hm-warning">📋 입주체크사진 등록</div>
                  <div className="text-xs text-hm-text-muted mt-0.5">{cpe.building} {cpe.room}호 · {cpe.name}</div>
                </div>
                <button onClick={() => setCheckPhotoEdit(null)}
                  className="w-8 h-8 rounded-lg border border-hm-input-border bg-white cursor-pointer text-base font-[inherit] hover:bg-hm-bg-hover transition-colors">✕</button>
              </div>
              <PhotoDropZone
                label="입주체크사진" color="var(--color-hm-warning)" maxPhotos={50}
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
              <div className="mt-4 flex justify-end">
                <button onClick={() => setCheckPhotoEdit(null)}
                  className={`py-2.5 px-7 rounded-lg border-none text-white font-bold text-sm cursor-pointer font-[inherit] transition-colors ${cpPhotos.length > 0 ? "bg-hm-success hover:bg-emerald-700" : "bg-hm-warning hover:brightness-110"}`}>
                  {cpPhotos.length > 0 ? "✅ 완료" : "닫기"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 공과금 청구 이력 팝업 */}
      {billingPopup && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
          onClick={() => setBillingPopup(null)}>
          <div onClick={(e: any) => e.stopPropagation()}
            className="bg-white rounded-2xl py-6 px-7 max-w-[540px] w-[90%] max-h-[80vh] overflow-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-base font-bold text-hm-text">⚡ 공과금 청구 이력</div>
                <div className="text-xs text-hm-text-muted">{billingPopup.tenant.building} {billingPopup.tenant.room}호 {billingPopup.tenant.name} · 입주일 {billingPopup.tenant.moveIn}</div>
              </div>
              <button onClick={() => setBillingPopup(null)}
                className="w-7 h-7 rounded-md border border-hm-input-border bg-white cursor-pointer text-sm font-[inherit] hover:bg-hm-bg-hover transition-colors">✕</button>
            </div>
            <div className="flex flex-col gap-2">
              {billingPopup.bills.map((bill: any, i: number) => (
                <div key={i} className={`py-3 px-4 rounded-lg border ${i === 0 ? "bg-amber-50 border-amber-200" : "bg-hm-bg-slate border-hm-border"}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-hm-text">{bill.date}</span>
                      {i === 0 && <span className="text-xs py-0.5 px-1.5 rounded bg-amber-100 text-amber-800 font-bold">최근</span>}
                    </div>
                    <span className="text-base font-bold text-amber-800">{fmt(bill.total)}원</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {bill.items.rent > 0 && <span className="text-xs py-[3px] px-2 rounded bg-white border border-hm-border text-hm-text-sub">월세 {fmt(bill.items.rent)}</span>}
                    {bill.items.mgmt > 0 && <span className="text-xs py-[3px] px-2 rounded bg-white border border-hm-border text-hm-text-sub">관리비 {fmt(bill.items.mgmt)}</span>}
                    {bill.items.elec > 0 && <span className="text-xs py-[3px] px-2 rounded bg-amber-100 text-amber-800">전기 {fmt(bill.items.elec)}</span>}
                    {bill.items.gas > 0 && <span className="text-xs py-[3px] px-2 rounded bg-red-100 text-red-800">가스 {fmt(bill.items.gas)}</span>}
                    {bill.items.water > 0 && <span className="text-xs py-[3px] px-2 rounded bg-hm-blue-bg text-hm-blue-dark">수도 {fmt(bill.items.water)}</span>}
                    {bill.items.cable > 0 && <span className="text-xs py-[3px] px-2 rounded bg-green-50 text-hm-success">인터넷 {fmt(bill.items.cable)}</span>}
                    {bill.items.prevUnpaid > 0 && <span className="text-xs py-[3px] px-2 rounded bg-hm-danger-bg text-hm-danger">미납 {fmt(bill.items.prevUnpaid)}</span>}
                  </div>
                </div>
              ))}
            </div>
            {billingPopup.bills.length === 0 && (
              <div className="text-center py-[30px] text-hm-text-muted text-sm">청구 이력이 없습니다</div>
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
          <div className="fixed inset-0 z-[10001] bg-black/[.92] flex items-center justify-center select-none"
            onClick={() => { if (zoom <= 1) setPhotoViewer(null); }}
            onWheel={(e: any) => { e.preventDefault(); setZoomFn(zoom + (e.deltaY < 0 ? 0.3 : -0.3)); }}>
            {photos.length > 1 && zoom <= 1 && (
              <button onClick={(e: any) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/20 border-none text-white text-4xl w-[52px] h-[52px] rounded-full cursor-pointer flex items-center justify-center z-[3] backdrop-blur-[4px] hover:bg-white/30 transition-colors">
                &lsaquo;
              </button>
            )}
            <div onClick={(e: any) => e.stopPropagation()}
              className="max-w-[85vw] max-h-[85vh] relative overflow-hidden"
              style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
              onMouseDown={(e: any) => { if (zoom > 1) { e.preventDefault(); setPhotoViewer((prev: any) => ({ ...prev, dragging: true, dragStartX: e.clientX - panX, dragStartY: e.clientY - panY })); } }}
              onMouseMove={(e: any) => { if (photoViewer.dragging && zoom > 1) { setPhotoViewer((prev: any) => ({ ...prev, panX: e.clientX - prev.dragStartX, panY: e.clientY - prev.dragStartY })); } }}
              onMouseUp={() => setPhotoViewer((prev: any) => ({ ...prev, dragging: false }))}
              onMouseLeave={() => setPhotoViewer((prev: any) => ({ ...prev, dragging: false }))}
              onDoubleClick={(e: any) => { e.stopPropagation(); setZoomFn(zoom <= 1 ? 2.5 : 1); }}>
              {isImg ? (
                <img src={imgSrc} alt="" draggable={false}
                  className="block shadow-[0_0_60px_rgba(0,0,0,.6)]"
                  style={{ maxWidth: zoom <= 1 ? "85vw" : "none", maxHeight: zoom <= 1 ? "85vh" : "none", width: zoom > 1 ? `${85 * zoom}vw` : undefined, borderRadius: zoom <= 1 ? 8 : 0, transform: zoom > 1 ? `translate(${panX}px, ${panY}px)` : "none", transition: dragging ? "none" : "transform 0.1s" }} />
              ) : (
                <div className="w-80 h-80 bg-[#222] rounded-xl flex items-center justify-center flex-col gap-3">
                  <span className="text-7xl">🏠</span>
                  <span className="text-gray-400 text-sm">사진 {index + 1}</span>
                </div>
              )}
            </div>
            {photos.length > 1 && zoom <= 1 && (
              <button onClick={(e: any) => { e.stopPropagation(); goNext(); }}
                className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/20 border-none text-white text-4xl w-[52px] h-[52px] rounded-full cursor-pointer flex items-center justify-center z-[3] backdrop-blur-[4px] hover:bg-white/30 transition-colors">
                &rsaquo;
              </button>
            )}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-[3]">
              <button onClick={(e: any) => { e.stopPropagation(); setZoomFn(zoom - 0.5); }}
                className="bg-white/20 border-none text-white text-xl w-9 h-9 rounded-full cursor-pointer flex items-center justify-center backdrop-blur-[4px] hover:bg-white/30 transition-colors">
                &minus;
              </button>
              <div className="text-white text-sm font-bold bg-black/50 py-1.5 px-4 rounded-[20px] min-w-[100px] text-center">
                {index + 1} / {photos.length}{zoom > 1 ? ` · ${Math.round(zoom * 100)}%` : ""}
              </div>
              <button onClick={(e: any) => { e.stopPropagation(); setZoomFn(zoom + 0.5); }}
                className="bg-white/20 border-none text-white text-xl w-9 h-9 rounded-full cursor-pointer flex items-center justify-center backdrop-blur-[4px] hover:bg-white/30 transition-colors">
                +
              </button>
            </div>
            <button onClick={() => setPhotoViewer(null)}
              className="absolute top-5 right-5 bg-white/20 border-none text-2xl text-white cursor-pointer rounded-full w-11 h-11 flex items-center justify-center z-[3] backdrop-blur-[4px] hover:bg-white/30 transition-colors">
              ✕
            </button>
            {zoom <= 1 && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/50 text-xs z-[3]">
                더블클릭 또는 마우스휠로 확대 · 확대 시 드래그로 이동
              </div>
            )}
          </div>
        );
      })()}
    {/* 퇴실확정 후 이동 모달 */}
    {showMoveoutDoneModal && (
      <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center"
        onMouseDown={() => setShowMoveoutDoneModal(false)}>
        <div className="bg-white rounded-2xl p-6 w-[380px] shadow-[0_20px_60px_rgba(0,0,0,.3)]"
          onMouseDown={e => e.stopPropagation()}>
          <div className="text-base font-bold text-hm-text mb-3">퇴실 확정 완료</div>
          <div className="text-xs text-hm-text-sub leading-[1.6] mb-5">
            입퇴실일정에서 나머지 단계(청소/입주체크/공실전환)를 진행하시겠습니까?
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowMoveoutDoneModal(false); setActionMode(null); setSelectedTenant(null); }}
              className="py-2 px-5 rounded-lg border border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
              여기서 계속
            </button>
            <button onClick={() => { setShowMoveoutDoneModal(false); setActionMode(null); setSelectedTenant(null); navigate("/calendar"); }}
              className="py-2 px-5 rounded-lg border-none bg-hm-blue text-white font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-blue-dark transition-colors">
              입퇴실일정으로 이동
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};
