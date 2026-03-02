import { useState, useMemo, useEffect } from 'react';
import { buildings, roomMasterData, billingConfig } from '../data';
import { getRoomType, changeRoomType } from '../config';
import { useIsMobile, fmt } from '../utils';
import { matchKorean } from '../utils/koreanSearch';
import { Card, SectionTitle, Table, StatusBadge, RoomTypeBadge, Field, ContractDropZone } from '../components';
import { PhotoDropZone } from '../components/PhotoDropZone';
import { rtCfg } from '../components/RoomTypeBadge';
import { inputStyle } from '../components/Field';

// 월세일(입주일 기준) 연체 상태 계산
const today = new Date();
const getBillingStatus = (r) => {
  if (!r.overdue || r.overdue <= 0) return { label: r.status, days: 0 };
  // 월세일 = 입주일의 day, 없으면 due에서 추출
  const rentDay = r.moveIn ? new Date(r.moveIn).getDate() : (r.due ? parseInt(r.due.replace(/\D/g, "")) || 1 : 1);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), rentDay);
  const rentDate = thisMonth <= today ? thisMonth : new Date(today.getFullYear(), today.getMonth() - 1, rentDay);
  const diffDays = Math.floor((today - rentDate) / 86400000);
  if (diffDays <= 0) return { label: "청구", days: 0 };
  return { label: `연체${diffDays}일`, days: diffDays };
};

// 단기 연체수수료 계산 (연체 5일차부터 남아있는 임대료의 5%)
const getLateFee = (r) => {
  const bs = getBillingStatus(r);
  if (bs.days < 5) return 0;
  if (getRoomType(r.building, r.room) !== "단기") return 0;
  const oRent = Math.min(r.overdue, r.rent);
  return Math.round(oRent * 0.05);
};

// 단기 + 단일계좌 여부 판별 (houseman, hm_owner1 = 전체금액을 하나의 계좌로)
const singleAcctModes = new Set(["houseman", "hm_owner1"]);

export const TenantsPage = ({ myBuildings = [], parkingInfo = {}, setParkingInfo, pendingContract, setPendingContract, pendingMoveout, setPendingMoveout, buildingAccounts = {}, allBuildings = [], activeTenants = [], setActiveTenants, pastTenantsData = {}, setPastTenantsData, activeVacancies = [], setActiveVacancies, calendarEvts = [] }) => {
  const isMobile = useIsMobile();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [actionDone, setActionDone] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [detailEdit, setDetailEdit] = useState(false);
  const [renewFiles, setRenewFiles] = useState([]);
  const [photoModalTenant, setPhotoModalTenant] = useState(null);
  const [checkPhotoEdit, setCheckPhotoEdit] = useState(null);
  const [checkPhotoView, setCheckPhotoView] = useState(null);
  const [photoViewer, setPhotoViewer] = useState(null); // { photos: [], index: 0 }
  // 퇴실정산서 수기 입력 항목
  const [manElec, setManElec] = useState([{period:"",amt:0},{period:"",amt:0},{period:"",amt:0}]);
  const [manGas, setManGas] = useState([{period:"",amt:0},{period:"",amt:0},{period:"",amt:0}]);
  const [manRepair, setManRepair] = useState(0);
  const [manWaste, setManWaste] = useState(0);
  const [manOther, setManOther] = useState([{desc:"",amt:0},{desc:"",amt:0},{desc:"",amt:0}]);
  const [manRepairDesc, setManRepairDesc] = useState("");
  const [manWasteDesc, setManWasteDesc] = useState("");
  const setManElecRow = (i,k,v) => setManElec(prev => prev.map((r,j) => j===i ? {...r,[k]:v} : r));
  const setManGasRow = (i,k,v) => setManGas(prev => prev.map((r,j) => j===i ? {...r,[k]:v} : r));
  const setManOtherRow = (i,k,v) => setManOther(prev => prev.map((r,j) => j===i ? {...r,[k]:v} : r));
  const [manRestoration, setManRestoration] = useState(0);
  const [manRestorationDesc, setManRestorationDesc] = useState("");
  const [moveoutDateStr, setMoveoutDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  // pendingMoveout: 입퇴실일정에서 버튼 클릭 시 해당 임차인 퇴실정산서로 이동
  useEffect(() => {
    if (pendingMoveout) {
      const t = activeTenants.find(x => x.building === pendingMoveout.building && String(x.room) === String(pendingMoveout.room));
      if (t) {
        setSelectedTenant(t);
        setActionMode("moveout");
      }
      setPendingMoveout?.(null);
    }
  }, [pendingMoveout]);
  // 퇴실모드 진입 시 수기 필드 초기화 + 단기 미납 시 전기/가스 자동기입
  useEffect(() => {
    if (actionMode === "moveout" && selectedTenant) {
      // 수기 필드 초기화
      setManRepair(0); setManWaste(0); setManRepairDesc(""); setManWasteDesc("");
      setManRestoration(0); setManRestorationDesc("");
      const emptyElec = [{period:"",amt:0},{period:"",amt:0},{period:"",amt:0}];
      const emptyGas = [{period:"",amt:0},{period:"",amt:0},{period:"",amt:0}];
      const emptyOther = [{desc:"",amt:0},{desc:"",amt:0},{desc:"",amt:0}];
      const t = activeTenants.find(x => x.id === selectedTenant.id) || selectedTenant;
      const rt = getRoomType(t.building, t.room);
      if (rt === "단기" && (t.overdue || 0) > 0) {
        // billingConfig에서 해당 호실의 청구 데이터 조회
        const bcList = billingConfig.filter(x => x.b === t.building && x.r === t.room);
        const newElec = [...emptyElec];
        const newGas = [...emptyGas];
        bcList.forEach((bc, idx) => {
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
  // 단기 + 단일계좌인 건물인지 판별
  const isSingleAcct = (buildingName) => {
    const bldg = allBuildings.find(b => b.name === buildingName);
    if (!bldg) return false;
    const bType = bldg.type || "단기";
    if (!bType.split("+").map(s => s.trim()).every(t => t === "단기")) return false;
    const accts = buildingAccounts[buildingName] || {};
    const mode = accts.mode1 || "";
    return singleAcctModes.has(mode);
  };
  const buildingOrder = buildings.map(b => b.name);
  const myTenants = myBuildings.length > 0 ? activeTenants.filter(t => myBuildings.includes(t.building)) : activeTenants;
  const filtered = useMemo(() => myTenants.filter(t => {
    if (search && !matchKorean(t.name, search) && !matchKorean(t.building, search) && !t.room.includes(search)) return false;
    if (typeFilter !== "전체" && getRoomType(t.building, t.room) !== typeFilter) return false;
    return true;
  }).sort((a, b) => {
    const bi = buildingOrder.indexOf(a.building) - buildingOrder.indexOf(b.building);
    if (bi !== 0) return bi;
    const aBase = a.room.toUpperCase().startsWith("B");
    const bBase = b.room.toUpperCase().startsWith("B");
    if (aBase && !bBase) return -1;
    if (!aBase && bBase) return 1;
    return a.room.localeCompare(b.room, undefined, { numeric: true });
  }), [myTenants, search, typeFilter, buildingOrder]);

  const doAction = () => {
    if (actionMode === "renew" && selectedTenant) {
      const t = activeTenants.find(x => x.id === selectedTenant.id) || selectedTenant;
      const g = (id) => document.getElementById(id)?.value ?? "";
      const newStartDate = g("rn-startDate");
      const newExpiry = g("rn-expiry");
      const newRent = Number(g("rn-rent").replace(/,/g, "")) || t.rent;
      const newMgmt = Number(g("rn-mgmt").replace(/,/g, "")) || t.mgmt;
      const newDeposit = Number(g("rn-deposit").replace(/,/g, "")) || t.deposit;
      const rentPostpaid = document.getElementById("rn-rentPostpaid")?.checked;
      const mgmtPostpaid = document.getElementById("rn-mgmtPostpaid")?.checked;
      if (!newExpiry) { alert("새 만기일을 입력하세요"); return; }
      // 이전 계약 정보를 pastTenantsData에 재계약 이력으로 저장
      const historyKey = `${t.building}_${t.room}`;
      const prevRecord = {
        name: t.name, phone: t.phone,
        moveIn: t.moveIn || "", moveOut: newStartDate || t.expiry || "",
        deposit: t.deposit, rent: t.rent,
        reason: "재계약", settlement: "재계약",
        contractFiles: renewFiles.map(f => f.name),
        renewedAt: new Date().toISOString().slice(0, 10),
      };
      setPastTenantsData?.(prev => ({ ...prev, [historyKey]: [...(prev[historyKey] || []), prevRecord] }));
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
        contractFiles: renewFiles.map(f => f.name),
      };
      setActiveTenants?.(prev => prev.map(x => x.id === t.id ? { ...x, ...updated } : x));
      setSelectedTenant({ ...t, ...updated });
      setRenewFiles([]);
    }
    if (actionMode === "moveout" && selectedTenant) {
      const t = activeTenants.find(x => x.id === selectedTenant.id) || selectedTenant;
      const historyKey = `${t.building}_${t.room}`;
      const expiry = new Date(t.expiry);
      const moveoutDate = new Date(moveoutDateStr);
      const reason = moveoutDate <= expiry ? "만기전퇴실" : "만기퇴실";
      const roomType = getRoomType(t.building, t.room);
      const parseNum = (v) => Number(String(v).replace(/,/g, "")) || 0;
      const sumArr = (arr) => arr.reduce((s, r) => s + parseNum(r.amt), 0);
      // 정산 데이터 계산 (doAction 시점에서 현재 화면과 동일한 값)
      const rm = roomMasterData[`${t.building}_${t.room}`] || {};
      const moveInDate = t.moveIn ? new Date(t.moveIn) : null;
      const startDay = moveInDate ? moveInDate.getDate() : 1;
      const cycleStart = new Date(moveoutDate.getFullYear(), moveoutDate.getMonth(), startDay);
      const lastCycleStart = cycleStart <= moveoutDate ? cycleStart : new Date(moveoutDate.getFullYear(), moveoutDate.getMonth() - 1, startDay);
      const nextCycleStart = new Date(lastCycleStart.getFullYear(), lastCycleStart.getMonth() + 1, startDay);
      const daysInMonth = Math.round((nextCycleStart - lastCycleStart) / 86400000);
      const usedDays = Math.max(0, Math.ceil((moveoutDate - lastCycleStart) / 86400000));
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
      const lateFee = getLateFee(t);
      const elecTotal = sumArr(manElec);
      const gasTotal = sumArr(manGas);
      const otherTotal = sumArr(manOther);
      const totalDeductAmt = (netRent>0?netRent:0)+(netMgmt>0?netMgmt:0)+(netWater>0?netWater:0)+(netInternet>0?netInternet:0)+cleanFee+elecTotal+gasTotal+parseNum(manRepair)+parseNum(manWaste)+otherTotal+(roomType==="근생"?parseNum(manRestoration):0)+penalty7+penaltyComm+lateFee+prevUnpaidAmt;
      const totalRefundAmt = (netRent<0?-netRent:0)+(netMgmt<0?-netMgmt:0)+(netWater<0?-netWater:0)+(netInternet<0?-netInternet:0);
      const finalSettlement = t.deposit + totalRefundAmt - totalDeductAmt;

      const record = {
        name: t.name, phone: t.phone,
        moveIn: t.moveIn || "", moveOut: moveoutDate.toISOString().slice(0, 10),
        expiry: t.expiry, deposit: t.deposit, rent: t.rent, mgmt: t.mgmt || 0,
        reason, settlement: "정산완료", roomType,
        contractFiles: t.contractFiles || [],
        settlementDate: new Date().toISOString().slice(0, 10),
        daysInMonth, usedDays, startDay,
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
        totalDeduct: totalDeductAmt, totalRefund: totalRefundAmt,
        finalSettlement,
        moveInPhotos: t.moveInPhotos || [],
        moveOutPhotos: t.moveOutPhotos || [],
        moveOutCheckPhotos: t.moveOutCheckPhotos || [],
        moveInCheckPhotos: t.moveInCheckPhotos || [],
      };
      setParkingInfo?.(prev => ({ ...prev, [t.id]: { carNumber: "", carType: "" } }));
      setPastTenantsData?.(prev => ({ ...prev, [historyKey]: [...(prev[historyKey] || []), record] }));
      setActiveTenants?.(prev => prev.filter(x => x.id !== t.id));
      setActiveVacancies?.(prev => [...prev, {
        building: t.building, room: t.room, type: roomType,
        commBroker: 10, commEvent: "", pw: "",
        deposit: Math.round(t.deposit / 10000), rent: Math.round(t.rent / 10000),
        nego: Math.round(t.rent / 10000), mgmt: Math.round(t.mgmt / 10000),
        water: "포함", cable: "포함", exitFee: 8, days: 0,
        status: "점검/청소중",
        moveInPhotos: t.moveOutCheckPhotos || [],
      }]);
      console.log("[퇴실확정]", t.building, t.room, t.name, "→ 공실추가, 정산이력추가");
    }
    setActionDone(true);
    setTimeout(() => { setActionDone(false); setActionMode(null); setSelectedTenant(null); }, 1500);
  };

  // Action panel
  if (selectedTenant && actionMode) {
    const t = activeTenants.find(x => x.id === selectedTenant.id) || selectedTenant;
    const depositLabel = getRoomType(t.building, t.room) === "단기" ? "예치금" : "보증금";
    const hasMoveOutPhotos = (t.moveOutPhotos || []).length > 0;
    if (actionDone) {
      const msgs = { moveout: "퇴실 처리가 완료되었습니다", movein: "입주 처리가 완료되었습니다", renew: "연장계약이 등록되었습니다" };
      return (
        <Card style={{ padding: "40px 20px", textAlign: "center" }}>
          <span style={{ fontSize: 48 }}>✅</span>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#059669", marginTop: 12 }}>{msgs[actionMode]}</div>
          <div style={{ fontSize: 13, color: "#8F95A3", marginTop: 6 }}>{t.building} {t.room}호 {t.name}</div>
        </Card>
      );
    }

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }} onClick={() => { setActionMode(null); setSelectedTenant(null); }}>
          <span style={{ fontSize: 20 }}>←</span>
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
          // 기산일 = 입주일의 day (매월 반복), 없으면 1일
          const startDay = moveInDate ? moveInDate.getDate() : 1;
          const cycleStart = new Date(moveoutDate.getFullYear(), moveoutDate.getMonth(), startDay);
          // 퇴실일이 기산일 이전이면 전월 기산일부터 계산
          const lastCycleStart = cycleStart <= moveoutDate
            ? cycleStart
            : new Date(moveoutDate.getFullYear(), moveoutDate.getMonth() - 1, startDay);
          const nextCycleStart = new Date(lastCycleStart.getFullYear(), lastCycleStart.getMonth() + 1, startDay);
          const daysInMonth = Math.round((nextCycleStart - lastCycleStart) / 86400000);
          const usedDays = Math.max(0, Math.ceil((moveoutDate - lastCycleStart) / 86400000));
          const isRentPrepaid = t.rentPayType !== "후불";
          const isMgmtPrepaid = t.mgmtPayType !== "후불";
          // 일할계산 (선불: 환불, 후불: 청구)
          const rentDaily = Math.round(t.rent / daysInMonth);
          const mgmtDaily = t.mgmt > 0 ? Math.round(t.mgmt / daysInMonth) : 0;
          const rentProRata = showProRata ? (isRentPrepaid ? -rentDaily * (daysInMonth - usedDays) : rentDaily * usedDays) : 0;
          const mgmtProRata = showProRata ? (isMgmtPrepaid ? -mgmtDaily * (daysInMonth - usedDays) : mgmtDaily * usedDays) : 0;
          // 고정 공제 (퇴실청소비)
          const cleanFee = showCleanFee ? (rm.cleanFee ? Number(String(rm.cleanFee).replace(/,/g, "")) : 120000) : 0;
          // 수도/TV인터넷 (일할계산)
          const waterAmt = rm.water ? Number(String(rm.water).replace(/,/g, "")) : 15000;
          const internetAmt = rm.internet ? Number(String(rm.internet).replace(/,/g, "")) : 25000;
          const isWaterPrepaid = t.waterPayType !== "후불";
          const isCablePrepaid = t.cablePayType !== "후불";
          const waterDaily = Math.round(waterAmt / daysInMonth);
          const internetDaily = Math.round(internetAmt / daysInMonth);
          const waterProRata = showProRata ? (isWaterPrepaid ? -waterDaily * (daysInMonth - usedDays) : waterDaily * usedDays) : 0;
          const internetProRata = showProRata ? (isCablePrepaid ? -internetDaily * (daysInMonth - usedDays) : internetDaily * usedDays) : 0;
          // 미납금 항목별 분해
          const curOverdue = t.overdue || 0;
          const unpaidRent = Math.min(curOverdue, t.rent);
          const unpaidMgmt = Math.min(Math.max(curOverdue - t.rent, 0), t.mgmt || 0);
          const unpaidUtil = Math.max(curOverdue - t.rent - (t.mgmt || 0), 0);
          const totalUtilAmt = waterAmt + internetAmt;
          const unpaidWater = totalUtilAmt > 0 ? Math.round(unpaidUtil * waterAmt / totalUtilAmt) : 0;
          const unpaidInternet = unpaidUtil - unpaidWater;
          const prevUnpaid = t.prevUnpaid || 0;
          // 순액 (일할 + 미납 합산) → 양수=공제, 음수=환불
          const netRent = rentProRata + unpaidRent;
          const netMgmt = mgmtProRata + unpaidMgmt;
          const netWater = waterProRata + unpaidWater;
          const netInternet = internetProRata + unpaidInternet;
          // 위약금
          const penalty7 = showPenalty && isEarlyMoveout ? Math.round((t.rent + (t.mgmt || 0)) / 30 * 7) : 0;
          const commBase = rm.commFee ? Number(String(rm.commFee).replace(/,/g, "")) : 0;
          const commEvt = t.commEvent ? (Number(String(t.commEvent).replace(/[^0-9.]/g, "")) || 0) : 0;
          const penaltyComm = showPenalty && isEarlyMoveout ? commBase + commEvt : 0;
          const penaltyTotal = penalty7 + penaltyComm;
          const lateFee = getLateFee(t);
          const parseNum = (v) => Number(String(v).replace(/,/g, "")) || 0;
          const sumArr = (arr) => arr.reduce((s, r) => s + parseNum(r.amt), 0);
          const elecTotal = sumArr(manElec);
          const gasTotal = sumArr(manGas);
          const otherTotal = sumArr(manOther);
          // 자동 합산
          const totalDeduct = (netRent > 0 ? netRent : 0) + (netMgmt > 0 ? netMgmt : 0)
            + (netWater > 0 ? netWater : 0) + (netInternet > 0 ? netInternet : 0) + cleanFee
            + elecTotal + gasTotal + parseNum(manRepair) + parseNum(manWaste) + otherTotal
            + (showRestoration ? parseNum(manRestoration) : 0) + penaltyTotal + lateFee + prevUnpaid;
          const totalRefund = (netRent < 0 ? -netRent : 0) + (netMgmt < 0 ? -netMgmt : 0)
            + (netWater < 0 ? -netWater : 0) + (netInternet < 0 ? -netInternet : 0);
          const settlement = t.deposit + totalRefund - totalDeduct;
          const SRow = ({ label, sub, value, color, bold }) => (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #F3F4F6" }}>
              <div><span style={{ fontSize: 11, color: color || "#5F6577", fontWeight: bold ? 700 : 400 }}>{label}</span>{sub && <span style={{ fontSize: 9, color: "#B0B5C1", marginLeft: 6 }}>{sub}</span>}</div>
              <span style={{ fontSize: 12, fontWeight: bold ? 800 : 600, color: color || "#1A1D23" }}>{typeof value === "number" ? (value < 0 ? `-${fmt(Math.abs(value))}` : fmt(value)) : value}</span>
            </div>
          );
          return (
          <Card style={{ maxWidth: 720 }}>
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
                  <select defaultValue="" style={{ ...inputStyle, padding: "5px 4px", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                    <option value="" disabled>선택</option>
                    {["KB국민","신한","하나","우리","NH농협","IBK기업","SC제일","씨티","카카오뱅크","케이뱅크","토스뱅크","새마을금고","신협","우체국","수협","광주","전북","제주","경남","부산","대구","BNK","산업","KDB"].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <div style={{ fontSize: 9, color: "#8F95A3" }}>계좌</div><input defaultValue="" placeholder="계좌번호" style={{ ...inputStyle, padding: "5px 6px", fontSize: 10 }} />
                  <div style={{ fontSize: 9, color: "#8F95A3" }}>입금자</div><input defaultValue="" placeholder="입금자명" style={{ ...inputStyle, padding: "5px 6px", fontSize: 10, width: 60 }} />
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
                {/* 전기 3행 */}
                <div style={{ fontSize: 10, color: "#EA580C", fontWeight: 600, marginBottom: 4 }}>전기</div>
                {manElec.map((row, i) => (
                  <div key={`elec${i}`} style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 6, marginBottom: 4, alignItems: "center" }}>
                    <input value={row.period} onChange={e => setManElecRow(i,"period",e.target.value)} placeholder={`기간 ${i+1}`} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, borderColor: "#FED7AA" }} />
                    <input value={row.amt || ""} onChange={e => setManElecRow(i,"amt",e.target.value)} placeholder="0" style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, textAlign: "right", borderColor: "#FED7AA" }} />
                  </div>
                ))}
                {/* 가스 3행 */}
                <div style={{ fontSize: 10, color: "#EA580C", fontWeight: 600, marginBottom: 4, marginTop: 6 }}>가스</div>
                {manGas.map((row, i) => (
                  <div key={`gas${i}`} style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 6, marginBottom: 4, alignItems: "center" }}>
                    <input value={row.period} onChange={e => setManGasRow(i,"period",e.target.value)} placeholder={`기간 ${i+1}`} style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, borderColor: "#FED7AA" }} />
                    <input value={row.amt || ""} onChange={e => setManGasRow(i,"amt",e.target.value)} placeholder="0" style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, textAlign: "right", borderColor: "#FED7AA" }} />
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 90px", gap: 6, marginBottom: 6, marginTop: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#EA580C", fontWeight: 600 }}>수리비</span>
                  <input value={manRepairDesc} onChange={e => setManRepairDesc(e.target.value)} placeholder="내역" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, borderColor: "#FED7AA" }} />
                  <input value={manRepair || ""} onChange={e => setManRepair(e.target.value)} placeholder="0" style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, textAlign: "right", borderColor: "#FED7AA" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 90px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#EA580C", fontWeight: 600 }}>폐기물</span>
                  <input value={manWasteDesc} onChange={e => setManWasteDesc(e.target.value)} placeholder="내역" style={{ ...inputStyle, padding: "6px 8px", fontSize: 11, borderColor: "#FED7AA" }} />
                  <input value={manWaste || ""} onChange={e => setManWaste(e.target.value)} placeholder="0" style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, textAlign: "right", borderColor: "#FED7AA" }} />
                </div>
                {/* 기타 1,2,3 */}
                {manOther.map((row, i) => (
                  <div key={`other${i}`} style={{ display: "grid", gridTemplateColumns: "60px 1fr 90px", gap: 6, marginBottom: i < 2 ? 4 : 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#EA580C", fontWeight: 600 }}>기타{i+1}</span>
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

                {/* 관리사무소 — 보증금 정보만 간략히 */}
                {isManagementOffice && <>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>보증금 반환</div>
                <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "14px 18px", border: "2px solid #BBF7D0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#065F46" }}>반환금액 (보증금)</span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: "#059669" }}>{fmt(t.deposit)}<span style={{ fontSize: 12 }}>원</span></span>
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
                  {showManualInputs && parseNum(manRepair) > 0 && <SRow label={`수리비 ${manRepairDesc ? `(${manRepairDesc})` : ""}`} value={parseNum(manRepair)} color="#DC2626" />}
                  {showManualInputs && parseNum(manWaste) > 0 && <SRow label={`폐기물 ${manWasteDesc ? `(${manWasteDesc})` : ""}`} value={parseNum(manWaste)} color="#DC2626" />}
                  {showManualInputs && manOther.map((r,i) => parseNum(r.amt) > 0 && <SRow key={`o${i}`} label={`기타${i+1}${r.desc ? ` (${r.desc})` : ""}`} value={parseNum(r.amt)} color="#DC2626" />)}
                  {showRestoration && parseNum(manRestoration) > 0 && <SRow label={`원상복구비 ${manRestorationDesc ? `(${manRestorationDesc})` : ""}`} value={parseNum(manRestoration)} color="#7C3AED" />}
                  {showPenalty && penaltyTotal > 0 && <>
                    <div style={{ height: 1, background: "#FECACA", margin: "4px 0" }} />
                    {penalty7 > 0 && <SRow label="7일패널티" value={penalty7} color="#DC2626" />}
                    {penaltyComm > 0 && <SRow label="중개수수료" value={penaltyComm} color="#DC2626" />}
                  </>}
                  {lateFee > 0 && <SRow label="연체수수료" sub="미납임대료 5%" value={lateFee} color="#DC2626" />}
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
                    ⚠️ 만기전퇴실 위약금: (월세+관리비)/30×7 = {fmt(penalty7)}원{penaltyComm > 0 ? ` + 중개수수료 ${fmt(penaltyComm)}원` : ""}
                  </div>
                )}
              </div>}
            </div>

            {/* 퇴실 메모 */}
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#8F95A3", marginBottom: 4 }}>퇴실 메모</div>
              <textarea rows={2} placeholder="퇴실 사유, 참고사항..." style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontSize: 12, padding: "10px 12px" }} />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setActionMode(null); setSelectedTenant(null); }} style={{ flex: 1, padding: "13px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
              <button style={{ flex: 1, padding: "13px", borderRadius: 10, border: "1.5px solid #3B82F6", background: "#EFF6FF", color: "#2563EB", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>🖨 프린트</button>
              <button
                disabled={!hasMoveOutPhotos}
                onClick={() => { if (hasMoveOutPhotos && window.confirm("정말 퇴실처리하겠습니다.\nYes를 누르면 다시 되돌릴 수 없습니다.")) doAction(); }}
                style={{ flex: 2, padding: "13px", borderRadius: 10, border: "none", background: hasMoveOutPhotos ? "#DC2626" : "#E0E3E9", color: hasMoveOutPhotos ? "#fff" : "#8F95A3", fontWeight: 800, fontSize: 14, cursor: hasMoveOutPhotos ? "pointer" : "not-allowed", fontFamily: "inherit", opacity: hasMoveOutPhotos ? 1 : 0.6 }}
              >{hasMoveOutPhotos ? "🚪 퇴실확정" : "📷 퇴실사진 등록 필요"}</button>
            </div>
          </Card>
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
                files={renewFiles.map(f => f.name)}
                onAdd={(newFiles) => setRenewFiles(prev => [...prev, ...newFiles])}
                onRemove={(idx) => setRenewFiles(prev => prev.filter((_, i) => i !== idx))}
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
  }

  // Tenant detail
  if (selectedTenant) {
    const t = activeTenants.find(x => x.id === selectedTenant.id) || selectedTenant;
    const daysToExpiry = t.expiry ? Math.ceil((new Date(t.expiry) - new Date()) / 86400000) : 0;
    const roomType = getRoomType(t.building, t.room);
    const depositLabel = roomType === "단기" ? "예치금" : "보증금";
    const hasMoveOutPhotos = (t.moveOutPhotos || []).length > 0;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }} onClick={() => setSelectedTenant(null)}>
          <span style={{ fontSize: 20 }}>←</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#3B82F6" }}>임차인 목록으로</span>
        </div>

        {/* Header */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1A1D23" }}>{t.name}</div>
              <div style={{ fontSize: 12, color: "#8F95A3", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                {t.building} {t.room}호 ·
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                    background: rtCfg(getRoomType(t.building, t.room)).bg,
                    color: rtCfg(getRoomType(t.building, t.room)).c }}>
                  {getRoomType(t.building, t.room)}
                </span>
              </div>
            </div>
            <StatusBadge status={t.status} />
          </div>
        </Card>

        {/* Full Info */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <SectionTitle sub="임차인 전체 정보">📋 임차인 상세</SectionTitle>
            {detailEdit ? (
              <button onClick={() => {
                const g = (id) => document.getElementById(id)?.value ?? "";
                const updated = {
                  ...t,
                  name: g("td-name") || t.name,
                  phone: g("td-phone") || t.phone,
                  phone2: g("td-phone2") || "",
                  phone3: g("td-phone3") || "",
                  moveIn: g("td-movein") || t.moveIn || "",
                  expiry: g("td-expiry") || t.expiry,
                  ssn: g("td-ssn") || "",
                  deposit: Number(g("td-deposit").replace(/,/g, "")) || t.deposit,
                  rent: Number(g("td-rent").replace(/,/g, "")) || t.rent,
                  mgmt: Number(g("td-mgmt").replace(/,/g, "")) || 0,
                  rentPayType: document.getElementById("td-rentPostpaid")?.checked ? "후불" : "선불",
                  mgmtPayType: document.getElementById("td-mgmtPostpaid")?.checked ? "후불" : "선불",
                  waterPayType: document.getElementById("td-waterPostpaid")?.checked ? "후불" : "선불",
                  waterAmount: g("td-water") || "",
                  cablePayType: document.getElementById("td-cablePostpaid")?.checked ? "후불" : "선불",
                  cableAmount: g("td-cable") || "",
                };
                setActiveTenants?.(prev => prev.map(x => x.id === t.id ? { ...x, ...updated } : x));
                setSelectedTenant({ ...t, ...updated });
                setDetailEdit(false);
              }}
                style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                ✓ 수정완료
              </button>
            ) : (
              <button onClick={() => setDetailEdit(true)}
                style={{ padding: "6px 16px", borderRadius: 8, border: "1.5px solid #3B82F6", background: "#EFF6FF", color: "#2563EB", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                ✏️ 수정
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Left */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>기본 정보</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 8 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>입주자명</div><input id="td-name" defaultValue={t.name} readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>입주일</div><input id="td-movein" type="date" defaultValue={t.moveIn || ""} readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>만기일</div><input id="td-expiry" type="date" defaultValue={t.expiry} readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, color: daysToExpiry < 30 ? "#DC2626" : "#1A1D23", fontWeight: daysToExpiry < 30 ? 700 : 400, background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처1</div><input id="td-phone" defaultValue={t.phone} readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처2</div><input id="td-phone2" defaultValue={t.phone2 || ""} placeholder="010-0000-0000" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처3</div><input id="td-phone3" defaultValue={t.phone3 || ""} placeholder="010-0000-0000" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>주민등록번호</div><input id="td-ssn" defaultValue={t.ssn || ""} placeholder="000000-0000000" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, fontFamily: "monospace", background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>전입신고</div>
                  <select id="td-resident" defaultValue={t.resident || ""} disabled={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, cursor: detailEdit ? "pointer" : "default", background: detailEdit ? "#fff" : "#F8FAFC" }}>
                    <option value="">미확인</option><option value="완료">완료</option><option value="미신고">미신고</option>
                  </select>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>💰 금액 정보</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>{depositLabel}</div><input id="td-deposit" defaultValue={t.deposit.toLocaleString()} readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 9, color: "#8F95A3" }}>임대료</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: detailEdit ? "pointer" : "default" }}>
                      <input id="td-rentPostpaid" type="checkbox" defaultChecked={t.rentPayType === "후불"} disabled={!detailEdit} style={{ width: 12, height: 12, cursor: detailEdit ? "pointer" : "default" }} />
                      <span style={{ fontSize: 8, color: t.rentPayType === "후불" ? "#DC2626" : "#8F95A3", fontWeight: t.rentPayType === "후불" ? 700 : 400 }}>후불</span>
                    </label>
                  </div>
                  <input id="td-rent" defaultValue={t.rent.toLocaleString()} readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: detailEdit ? "#fff" : "#F8FAFC" }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 9, color: "#8F95A3" }}>관리비</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: detailEdit ? "pointer" : "default" }}>
                      <input id="td-mgmtPostpaid" type="checkbox" defaultChecked={t.mgmtPayType === "후불"} disabled={!detailEdit} style={{ width: 12, height: 12, cursor: detailEdit ? "pointer" : "default" }} />
                      <span style={{ fontSize: 8, color: t.mgmtPayType === "후불" ? "#DC2626" : "#8F95A3", fontWeight: t.mgmtPayType === "후불" ? 700 : 400 }}>후불</span>
                    </label>
                  </div>
                  <input id="td-mgmt" defaultValue={t.mgmt > 0 ? t.mgmt.toLocaleString() : ""} placeholder="0" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: detailEdit ? "#fff" : "#F8FAFC" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 9, color: "#8F95A3" }}>수도</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: detailEdit ? "pointer" : "default" }}>
                      <input id="td-waterPostpaid" type="checkbox" defaultChecked={t.waterPayType === "후불"} disabled={!detailEdit} style={{ width: 12, height: 12, cursor: detailEdit ? "pointer" : "default" }} />
                      <span style={{ fontSize: 8, color: t.waterPayType === "후불" ? "#DC2626" : "#8F95A3", fontWeight: t.waterPayType === "후불" ? 700 : 400 }}>후불</span>
                    </label>
                  </div>
                  <input id="td-water" defaultValue={t.waterAmount || ""} placeholder="10,000" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: detailEdit ? "#fff" : "#F8FAFC" }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 9, color: "#8F95A3" }}>케이블</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: detailEdit ? "pointer" : "default" }}>
                      <input id="td-cablePostpaid" type="checkbox" defaultChecked={t.cablePayType === "후불"} disabled={!detailEdit} style={{ width: 12, height: 12, cursor: detailEdit ? "pointer" : "default" }} />
                      <span style={{ fontSize: 8, color: t.cablePayType === "후불" ? "#DC2626" : "#8F95A3", fontWeight: t.cablePayType === "후불" ? 700 : 400 }}>후불</span>
                    </label>
                  </div>
                  <input id="td-cable" defaultValue={t.cableAmount || ""} placeholder="0" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: detailEdit ? "#fff" : "#F8FAFC" }} />
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>🏠 중개 정보</div>
              {(() => { const rm = roomMasterData[`${t.building}_${t.room}`] || {}; return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>중개수수료 (기본)</div><input id="td-commBase" defaultValue={rm.commFee || ""} placeholder="200,000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>중개수수료 (이벤트)</div><input id="td-commEvent" defaultValue="" placeholder="0" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} /></div>
              </div>
              ); })()}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산명</div><input defaultValue="" placeholder="부동산명" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산 연락처</div><input defaultValue="" placeholder="02-000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산 담당자</div><input defaultValue="" placeholder="담당자명" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              </div>
            </div>

            {/* Right */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #FECACA" }}>🚨 청구/미납현황</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ padding: "8px 10px", background: t.prevUnpaid > 0 ? "#FEF2F2" : "#F8FAFC", borderRadius: 8, border: `1px solid ${t.prevUnpaid > 0 ? "#FECACA" : "#E8ECF0"}` }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>임대료</div>
                  <input defaultValue={t.rent.toLocaleString()} placeholder="0" style={{ ...inputStyle, padding: "7px 10px", fontSize: 13, textAlign: "right", fontWeight: 700, border: "none", background: "transparent" }} />
                </div>
                <div style={{ padding: "8px 10px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E8ECF0" }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>관리비</div>
                  <input defaultValue={t.mgmt > 0 ? t.mgmt.toLocaleString() : ""} placeholder="0" style={{ ...inputStyle, padding: "7px 10px", fontSize: 13, textAlign: "right", fontWeight: 700, border: "none", background: "transparent" }} />
                </div>
                <div style={{ padding: "8px 10px", background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A" }}>
                  <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>공과금</div>
                  <input defaultValue="" placeholder="0" style={{ ...inputStyle, padding: "7px 10px", fontSize: 13, textAlign: "right", fontWeight: 700, border: "none", background: "transparent" }} />
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>🅿️ 주차</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차번호</div><input value={parkingInfo[t.id]?.carNumber ?? t.carNumber ?? ""} onChange={e => setParkingInfo && setParkingInfo(prev => ({ ...prev, [t.id]: { ...prev[t.id], carNumber: e.target.value, carType: prev[t.id]?.carType ?? t.carType ?? "" } }))} placeholder="12가 3456" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차종</div><input value={parkingInfo[t.id]?.carType ?? t.carType ?? ""} onChange={e => setParkingInfo && setParkingInfo(prev => ({ ...prev, [t.id]: { ...prev[t.id], carType: e.target.value, carNumber: prev[t.id]?.carNumber ?? t.carNumber ?? "" } }))} placeholder="현대 아반떼" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>📌 기타</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>애완동물 신고</div><input defaultValue="" placeholder="애완동물 신고 내용" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>만기</div>
                  <div style={{ padding: "7px 10px", borderRadius: 8, background: daysToExpiry < 30 ? "#FEF2F2" : daysToExpiry < 90 ? "#FFFBEB" : "#F0FDF4", fontSize: 13, fontWeight: 800, color: daysToExpiry < 30 ? "#DC2626" : daysToExpiry < 90 ? "#D97706" : "#059669", textAlign: "center" }}>
                    {daysToExpiry > 0 ? `${daysToExpiry}일 남음` : `${Math.abs(daysToExpiry)}일 경과`}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>기타1</div><input defaultValue="" placeholder="입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>기타2</div><input defaultValue="" placeholder="입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>기타3</div><input defaultValue="" placeholder="입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 6 }}>📎 계약서</div>
                <ContractDropZone
                  files={t.contractFiles || []}
                  onAdd={(newFiles) => {
                    const merged = [...(t.contractFiles || []), ...newFiles.map(f => f.name)];
                    setActiveTenants?.(prev => prev.map(x => x.id === t.id ? { ...x, contractFiles: merged } : x));
                    setSelectedTenant(prev => ({ ...prev, contractFiles: merged }));
                  }}
                  onRemove={(idx) => {
                    const updated = (t.contractFiles || []).filter((_, i) => i !== idx);
                    setActiveTenants?.(prev => prev.map(x => x.id === t.id ? { ...x, contractFiles: updated } : x));
                    setSelectedTenant(prev => ({ ...prev, contractFiles: updated }));
                  }}
                />
              </div>
              {/* 입주사진 갤러리 */}
              {(t.moveInPhotos || []).length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 6 }}>📷 입주사진 ({(t.moveInPhotos || []).length}장) <span style={{ fontSize: 9, color: "#8F95A3", fontWeight: 600 }}>{t.moveIn || ""}</span></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                  {(t.moveInPhotos || []).map((src, pi) => {
                    const imgSrc = src instanceof File ? URL.createObjectURL(src) : src;
                    const isReal = imgSrc && typeof imgSrc === "string" && (imgSrc.startsWith("data:image/") || imgSrc.startsWith("blob:") || imgSrc.startsWith("http"));
                    return (
                      <div key={pi}
                        onClick={(e) => { e.stopPropagation(); setPhotoViewer({ photos: t.moveInPhotos, index: pi }); }}
                        style={{ aspectRatio: "1", borderRadius: 8, border: "2px solid #BBF7D0", overflow: "hidden", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                        {isReal ? (
                          <img src={imgSrc} alt={`입주 ${pi+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                        ) : (
                          <span style={{ fontSize: 18 }}>🏠</span>
                        )}
                        <div style={{ position: "absolute", bottom: 2, right: 2, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 3 }}>{pi+1}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}

            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        {t.status === "퇴실" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <Card onClick={() => setActionMode("movein")} style={{ cursor: "pointer", textAlign: "center", padding: "20px 12px", border: "1.5px solid #BBF7D0", background: "#F0FDF4" }}>
              <span style={{ fontSize: 28 }}>📦</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#059669", marginTop: 8 }}>입주 처리</div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 4 }}>신규 임차인 등록</div>
            </Card>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: roomType === "단기" ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10 }}>
            {roomType !== "단기" && (
              <Card onClick={() => setActionMode("renew")} style={{ cursor: "pointer", textAlign: "center", padding: "20px 12px", border: "1.5px solid #BFDBFE", background: "#EFF6FF" }}>
                <span style={{ fontSize: 28 }}>📝</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#2563EB", marginTop: 8 }}>연장계약</div>
                <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 4 }}>연장 · 임대료 변경</div>
              </Card>
            )}
            <Card onClick={() => setActionMode("moveout")} style={{ cursor: "pointer", textAlign: "center", padding: "20px 12px", border: "1.5px solid #E9D5FF", background: "#FAF5FF" }}>
              <span style={{ fontSize: 28 }}>🧮</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#7C3AED", marginTop: 8 }}>가상퇴실계산</div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 4 }}>정산 시뮬레이션</div>
            </Card>
            <Card
              onClick={() => { if (hasMoveOutPhotos) setActionMode("moveout"); }}
              style={{ cursor: hasMoveOutPhotos ? "pointer" : "not-allowed", textAlign: "center", padding: "20px 12px", border: "1.5px solid #FECACA", background: "#FEF2F2", opacity: hasMoveOutPhotos ? 1 : 0.4, position: "relative" }}
            >
              <span style={{ fontSize: 28 }}>🚪</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#DC2626", marginTop: 8 }}>퇴실 처리</div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 4 }}>{hasMoveOutPhotos ? `정산 · ${depositLabel} 반환` : "⚠️ 퇴실사진 등록 필요"}</div>
            </Card>
          </div>
        )}

      </div>
    );
  }

  return (
    <div>
      <SectionTitle sub={`총 ${activeTenants.length}명 입주 중`}>👤 임차인 관리</SectionTitle>

      {/* 공실→임차인 계약서 입력 (임차인상세와 동일한 레이아웃) */}
      {pendingContract && (() => {
        const pc = pendingContract;
        const roomType = getRoomType(pc.building, pc.room);
        const isDangi = roomType === "단기";
        const pcDepositLabel = isDangi ? "예치금" : "보증금";
        return (
        <div>
          {/* Header Card */}
          <Card style={{ marginBottom: 12, border: "2px solid #059669" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#065F46" }}>📝</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23" }}>{pc.building} {pc.room}호</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#D1FAE5", color: "#065F46" }}>계약서 입력</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: isDangi ? "#FFF7ED" : "#EFF6FF", color: isDangi ? "#EA580C" : "#2563EB" }}>{roomType}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#059669", marginTop: 2 }}>입퇴실일정에서 전달된 계약 정보 · 등록자: {pc.registeredBy || "—"} · {pc.registeredAt || "—"}</div>
                </div>
              </div>
              <button onClick={() => setPendingContract && setPendingContract(null)}
                style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
            </div>
          </Card>

          {/* Detail Card — 임차인상세와 동일한 레이아웃 */}
          <Card style={{ marginBottom: 16 }}>
            <SectionTitle sub="계약 정보를 확인하고 임차인 정보를 입력하세요">📋 계약서 입력</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Left */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>기본 정보</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 8 }}>
                  <div><div style={{ fontSize: 9, color: "#DC2626", fontWeight: 700, marginBottom: 2 }}>입주자명 <span style={{ color: "#DC2626" }}>*</span></div><input id="pc-name" placeholder="이름 입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, borderColor: "#FECACA" }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><div style={{ fontSize: 9, color: "#DC2626", fontWeight: 700, marginBottom: 2 }}>연락처1 <span style={{ color: "#DC2626" }}>*</span></div><input id="pc-phone" placeholder="010-0000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, borderColor: "#FECACA" }} /></div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처2</div><input id="pc-phone2" placeholder="010-0000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처3</div><input id="pc-phone3" placeholder="010-0000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><div style={{ fontSize: 9, color: pc.moveIn || pc.date ? "#8F95A3" : "#DC2626", fontWeight: pc.moveIn || pc.date ? 400 : 700, marginBottom: 2 }}>입주일 {!(pc.moveIn || pc.date) && <span style={{ color: "#DC2626" }}>*</span>}</div><input id="pc-movein" type="date" defaultValue={pc.moveIn || pc.date} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, borderColor: pc.moveIn || pc.date ? undefined : "#FECACA" }} /></div>
                  <div><div style={{ fontSize: 9, color: pc.expiry ? "#8F95A3" : "#DC2626", fontWeight: pc.expiry ? 400 : 700, marginBottom: 2 }}>만기일 {!pc.expiry && <span style={{ color: "#DC2626" }}>*</span>}</div><input id="pc-expiry" type="date" defaultValue={pc.expiry || ""} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, color: "#DC2626", fontWeight: 700, borderColor: pc.expiry ? undefined : "#FECACA" }} /></div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>계약일</div>
                    <div style={{ padding: "7px 10px", borderRadius: 8, background: "#F3F4F6", border: "1px solid #E0E3E9", fontSize: 12, color: "#5F6577" }}>{pc.contractDate || pc.date}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div><div style={{ fontSize: 9, color: "#DC2626", fontWeight: 700, marginBottom: 2 }}>주민등록번호 <span style={{ color: "#DC2626" }}>*</span></div><input id="pc-ssn" placeholder="000000-0000000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, fontFamily: "monospace", borderColor: "#FECACA" }} /></div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>전입신고</div>
                    <select id="pc-resident" defaultValue="" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, cursor: "pointer", width: "100%" }}>
                      <option value="">미확인</option><option value="완료">완료</option><option value="미신고">미신고</option>
                    </select>
                  </div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>유형</div>
                    <div style={{ padding: "7px 10px", borderRadius: 8, background: isDangi ? "#FFF7ED" : "#EFF6FF", border: "1px solid #E0E3E9", fontSize: 12, fontWeight: 700, color: isDangi ? "#EA580C" : "#2563EB" }}>{roomType}</div>
                  </div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>💰 금액 정보</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><div style={{ fontSize: 9, color: pc.deposit ? "#8F95A3" : "#DC2626", fontWeight: pc.deposit ? 400 : 700, marginBottom: 2 }}>{pcDepositLabel} (만원) {!pc.deposit && <span style={{ color: "#DC2626" }}>*</span>}</div><input id="pc-deposit" defaultValue={pc.deposit || ""} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", borderColor: pc.deposit ? undefined : "#FECACA" }} /></div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 9, color: pc.rent ? "#8F95A3" : "#DC2626", fontWeight: pc.rent ? 400 : 700 }}>임대료 (만원) {!pc.rent && <span style={{ color: "#DC2626" }}>*</span>}</span>
                      <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
                        <input id="pc-rentPostpaid" type="checkbox" style={{ width: 12, height: 12, cursor: "pointer" }} />
                        <span style={{ fontSize: 8, color: "#DC2626", fontWeight: 600 }}>후불</span>
                      </label>
                    </div>
                    <input id="pc-rent" defaultValue={pc.rent || ""} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", borderColor: pc.rent ? undefined : "#FECACA" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 9, color: "#8F95A3" }}>관리비 (만원)</span>
                      <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
                        <input id="pc-mgmtPostpaid" type="checkbox" style={{ width: 12, height: 12, cursor: "pointer" }} />
                        <span style={{ fontSize: 8, color: "#DC2626", fontWeight: 600 }}>후불</span>
                      </label>
                    </div>
                    <input id="pc-mgmt" defaultValue={pc.mgmt || ""} placeholder="0" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} />
                  </div>
                </div>
                {isDangi && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>수도</div><input id="pc-water" defaultValue={pc.water || ""} placeholder="포함" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                    <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>케이블</div><input id="pc-cable" defaultValue={pc.cable || ""} placeholder="포함" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                    <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>퇴실청소비 (만원)</div><input id="pc-exitfee" defaultValue={pc.exitFee || ""} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} /></div>
                    <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>NEGO (만원)</div>
                      <div style={{ padding: "7px 10px", borderRadius: 8, background: pc.nego < pc.rent ? "#FEF2F2" : "#F3F4F6", border: "1px solid #E0E3E9", fontSize: 12, fontWeight: 700, textAlign: "right", color: pc.nego < pc.rent ? "#DC2626" : "#1A1D23" }}>{pc.nego}</div>
                    </div>
                  </div>
                )}

                <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>🏠 중개 정보</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>중개수수료</div><input id="pc-comm" defaultValue={pc.commBroker || ""} placeholder="수수료" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} /></div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>중개수수료 (이벤트)</div><input defaultValue="" placeholder="0" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right" }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산명</div><input defaultValue={pc.broker || ""} placeholder="부동산명" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산 연락처</div><input defaultValue={pc.brokerPhone || ""} placeholder="02-000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>부동산 담당자</div><input defaultValue="" placeholder="담당자명" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                </div>
              </div>

              {/* Right */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23" }}>🅿️ 주차</span>
                    {!hasParking && <span style={{ fontSize: 10, color: "#B0B5C1" }}>차량없음</span>}
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 10, color: "#5F6577" }}>
                    <input type="checkbox" checked={hasParking} onChange={e => setHasParking(e.target.checked)} style={{ cursor: "pointer" }} />
                    주차있음
                  </label>
                </div>
                {hasParking && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차번호</div><input id="pc-car" placeholder="12가 3456" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차종</div><input id="pc-cartype" placeholder="현대 아반떼" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                </div>
                )}

                <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>📌 기타</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>기타1</div><input placeholder="입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>기타2</div><input placeholder="입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>기타3</div><input placeholder="입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 6 }}>📎 계약서</div>
                  <ContractDropZone
                    files={pc.contractFiles || []}
                    onAdd={(newFiles) => setPendingContract(prev => ({ ...prev, contractFiles: [...(prev.contractFiles || []), ...newFiles.map(f => f.name)] }))}
                    onRemove={(idx) => setPendingContract(prev => ({ ...prev, contractFiles: (prev.contractFiles || []).filter((_, i) => i !== idx) }))}
                  />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPendingContract && setPendingContract(null)}
                    style={{ flex: 1, padding: "12px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                  <button onClick={() => {
                    const name = document.getElementById("pc-name")?.value?.trim();
                    const phone = document.getElementById("pc-phone")?.value?.trim();
                    const moveIn = document.getElementById("pc-movein")?.value;
                    const expiry = document.getElementById("pc-expiry")?.value;
                    const deposit = document.getElementById("pc-deposit")?.value;
                    const rent = document.getElementById("pc-rent")?.value;
                    const mgmt = document.getElementById("pc-mgmt")?.value;
                    const rentPostpaid = document.getElementById("pc-rentPostpaid")?.checked;
                    const mgmtPostpaid = document.getElementById("pc-mgmtPostpaid")?.checked;
                    if (!name) return alert("입주자명을 입력하세요");
                    if (!phone) return alert("연락처를 입력하세요");
                    const newId = activeTenants.length > 0 ? Math.max(...activeTenants.map(t => t.id)) + 1 : 1;
                    // 이전 퇴실자의 moveOutCheckPhotos를 새 임차인의 moveInCheckPhotos로 전달
                    const histKey = `${pc.building}_${pc.room}`;
                    const prevRecords = pastTenantsData?.[histKey] || [];
                    const lastPast = prevRecords.length > 0 ? prevRecords[prevRecords.length - 1] : null;
                    const newTenant = {
                      id: newId, name, building: pc.building, room: pc.room, phone,
                      rent: (Number(rent) || 0) * 10000,
                      mgmt: (Number(mgmt) || 0) * 10000,
                      deposit: (Number(deposit) || 0) * 10000,
                      type: roomType || "단기",
                      due: "",
                      status: "정상", overdue: 0,
                      expiry: expiry || "",
                      prevUnpaid: 0, currentUnpaid: 0, overdueDays: 0,
                      rentPayType: rentPostpaid ? "후불" : "선불",
                      mgmtPayType: mgmtPostpaid ? "후불" : "선불",
                      contractFiles: pc.contractFiles || [],
                      moveIn: moveIn || "",
                      moveInPhotos: pc.vacancyData?.moveInPhotos || [],
                      moveInCheckPhotos: lastPast?.moveOutCheckPhotos || [],
                    };
                    const carNum = document.getElementById("pc-car")?.value?.trim();
                    const carType = document.getElementById("pc-cartype")?.value?.trim();
                    setActiveTenants?.(prev => [...prev, newTenant]);
                    setActiveVacancies?.(prev => prev.filter(v => !(v.building === pc.building && v.room === pc.room)));
                    if ((carNum || carType) && setParkingInfo) {
                      setParkingInfo(prev => ({ ...prev, [newId]: { carNumber: carNum || "", carType: carType || "" } }));
                    }
                    setPendingContract && setPendingContract(null);
                    alert(`${pc.building} ${pc.room}호 ${name} 호실등록 완료`);
                  }}
                    style={{ flex: 2, padding: "12px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>🏠 호실등록</button>
                </div>
              </div>
            </div>
          </Card>
        </div>
        );
      })()}

      {/* Summary tab badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["전체", "단기", "일반임대", "근생", "관리사무소"].map(t => {
          const colors = { "전체": "#1A1D23", "단기": "#EA580C", "일반임대": "#2563EB", "근생": "#7C3AED", "관리사무소": "#6B7280" };
          const cnt = t === "전체" ? myTenants.length : myTenants.filter(r => getRoomType(r.building, r.room) === t).length;
          return (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{ padding: "7px 16px", borderRadius: 8, border: typeFilter === t ? `2px solid ${colors[t]}` : "1px solid #E0E3E9", background: typeFilter === t ? `${colors[t]}10` : "#fff", color: typeFilter === t ? colors[t] : "#5F6577", fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
              {t} <span style={{ fontWeight: 800 }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 건물, 호실 검색..."
          style={{ width: 280, padding: "8px 14px", borderRadius: 8, border: "1px solid #E0E3E9", fontSize: 12, outline: "none", fontFamily: "inherit", background: "#F9FAFB" }} />
      </div>

      {/* Main Table */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 48, color: "#8F95A3" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>해당 임차인이 없습니다</div>
        </Card>
      ) : (
        <Card style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E8ECF0" }}>
                {["유형","건물명","호실","입주자","연락처1","연락처2","입주일","만기일","보증금","월세","관리비","상태","연체금"].map((h, i) => (
                  <th key={i} style={{ padding: i >= 11 ? "10px 4px" : "10px 8px", textAlign: (i >= 8 && i <= 10) || i === 12 ? "right" : i >= 11 ? "center" : "left", fontSize: 11, fontWeight: 700, color: "#8F95A3", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const bs = getBillingStatus(r);
                const lf = getLateFee(r);
                const overdueTotal = (r.overdue || 0) + lf;
                return (
                  <tr key={i} onClick={() => setSelectedTenant(r)}
                    style={{ borderBottom: "1px solid #F0F2F5", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#F9FAFB"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "10px 8px" }}><RoomTypeBadge building={r.building} room={r.room} /></td>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>{r.building}</td>
                    <td style={{ padding: "10px 8px" }}>{r.room}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>{r.name}</td>
                    <td style={{ padding: "10px 8px", fontSize: 11, color: "#5F6577" }}>{r.phone}</td>
                    <td style={{ padding: "10px 8px", fontSize: 11, color: "#5F6577" }}>{r.phone2 || "-"}</td>
                    <td style={{ padding: "10px 8px", fontSize: 11 }}>{r.moveIn ? r.moveIn.slice(2) : "-"}</td>
                    <td style={{ padding: "10px 8px", fontSize: 11 }}>{r.expiry ? r.expiry.slice(2) : "-"}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontSize: 11 }}>{fmt(r.deposit)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontSize: 11 }}>{fmt(r.rent)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontSize: 11, color: "#8F95A3" }}>{fmt(r.mgmt)}</td>
                    <td style={{ padding: "10px 4px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <StatusBadge status={bs.label === "청구" ? "청구" : bs.days > 0 ? "연체" : r.status} label={bs.days > 0 ? bs.label : undefined} />
                    </td>
                    <td style={{ padding: "10px 4px", textAlign: "right", fontWeight: overdueTotal > 0 ? 800 : 400, color: overdueTotal > 0 ? "#DC2626" : "#D1D5DB", whiteSpace: "nowrap" }}>
                      {overdueTotal > 0 ? fmt(overdueTotal) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

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
                onAdd={(newPhotos) => {
                  const merged = [...photos, ...newPhotos];
                  setActiveTenants?.(prev => prev.map(x => x.id === pm.id ? { ...x, moveOutPhotos: merged } : x));
                  setPhotoModalTenant(prev => ({ ...prev, moveOutPhotos: merged }));
                  setSelectedTenant(prev => prev && prev.id === pm.id ? { ...prev, moveOutPhotos: merged } : prev);
                }}
                onRemove={(idx) => {
                  const updated = photos.filter((_, i) => i !== idx);
                  setActiveTenants?.(prev => prev.map(x => x.id === pm.id ? { ...x, moveOutPhotos: updated } : x));
                  setPhotoModalTenant(prev => ({ ...prev, moveOutPhotos: updated }));
                  setSelectedTenant(prev => prev && prev.id === pm.id ? { ...prev, moveOutPhotos: updated } : prev);
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
            <div onClick={e => e.stopPropagation()}
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
                {cpPhotos.map((src, i) => (
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
            <div onClick={e => e.stopPropagation()}
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
                onAdd={(newPhotos) => {
                  const updated = [...cpPhotos, ...newPhotos];
                  setCheckPhotoEdit(prev => ({ ...prev, moveOutCheckPhotos: updated }));
                  setActiveTenants?.(prev => prev.map(x => x.id === cpe.id ? { ...x, moveOutCheckPhotos: updated } : x));
                  setSelectedTenant(prev => prev && prev.id === cpe.id ? { ...prev, moveOutCheckPhotos: updated } : prev);
                }}
                onRemove={(idx) => {
                  const updated = cpPhotos.filter((_, i) => i !== idx);
                  setCheckPhotoEdit(prev => ({ ...prev, moveOutCheckPhotos: updated }));
                  setActiveTenants?.(prev => prev.map(x => x.id === cpe.id ? { ...x, moveOutCheckPhotos: updated } : x));
                  setSelectedTenant(prev => prev && prev.id === cpe.id ? { ...prev, moveOutCheckPhotos: updated } : prev);
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

      {/* 사진 뷰어 모달 — 확대/축소 + 좌우 이동 + 드래그 */}
      {photoViewer && (() => {
        const { photos, index, zoom = 1, panX = 0, panY = 0, dragging = false } = photoViewer;
        const raw = photos[index];
        const imgSrc = raw instanceof File ? URL.createObjectURL(raw) : raw;
        const isImg = imgSrc && typeof imgSrc === "string" && (imgSrc.startsWith("data:image/") || imgSrc.startsWith("blob:") || imgSrc.startsWith("http"));
        const goTo = (i) => setPhotoViewer(prev => ({ ...prev, index: i, zoom: 1, panX: 0, panY: 0 }));
        const goPrev = () => goTo((index - 1 + photos.length) % photos.length);
        const goNext = () => goTo((index + 1) % photos.length);
        const setZoom = (z) => {
          const nz = Math.max(1, Math.min(5, z));
          setPhotoViewer(prev => nz <= 1 ? { ...prev, zoom: 1, panX: 0, panY: 0 } : { ...prev, zoom: nz });
        };
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}
            onClick={() => { if (zoom <= 1) setPhotoViewer(null); }}
            onWheel={e => { e.preventDefault(); setZoom(zoom + (e.deltaY < 0 ? 0.3 : -0.3)); }}>
            {/* 왼쪽 화살표 */}
            {photos.length > 1 && zoom <= 1 && (
              <button onClick={e => { e.stopPropagation(); goPrev(); }}
                style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.2)", border: "none", color: "#fff", fontSize: 36, width: 52, height: 52, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, backdropFilter: "blur(4px)" }}>
                ‹
              </button>
            )}
            {/* 사진 영역 */}
            <div onClick={e => e.stopPropagation()}
              style={{ maxWidth: "85vw", maxHeight: "85vh", position: "relative", overflow: "hidden", cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
              onMouseDown={e => { if (zoom > 1) { e.preventDefault(); setPhotoViewer(prev => ({ ...prev, dragging: true, dragStartX: e.clientX - panX, dragStartY: e.clientY - panY })); } }}
              onMouseMove={e => { if (photoViewer.dragging && zoom > 1) { setPhotoViewer(prev => ({ ...prev, panX: e.clientX - prev.dragStartX, panY: e.clientY - prev.dragStartY })); } }}
              onMouseUp={() => setPhotoViewer(prev => ({ ...prev, dragging: false }))}
              onMouseLeave={() => setPhotoViewer(prev => ({ ...prev, dragging: false }))}
              onDoubleClick={e => { e.stopPropagation(); setZoom(zoom <= 1 ? 2.5 : 1); }}>
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
            {/* 오른쪽 화살표 */}
            {photos.length > 1 && zoom <= 1 && (
              <button onClick={e => { e.stopPropagation(); goNext(); }}
                style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.2)", border: "none", color: "#fff", fontSize: 36, width: 52, height: 52, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, backdropFilter: "blur(4px)" }}>
                ›
              </button>
            )}
            {/* 하단 컨트롤 */}
            <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 12, zIndex: 3 }}>
              <button onClick={e => { e.stopPropagation(); setZoom(zoom - 0.5); }}
                style={{ background: "rgba(255,255,255,.2)", border: "none", color: "#fff", fontSize: 20, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                −
              </button>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,.5)", padding: "6px 16px", borderRadius: 20, minWidth: 100, textAlign: "center" }}>
                {index + 1} / {photos.length}{zoom > 1 ? ` · ${Math.round(zoom * 100)}%` : ""}
              </div>
              <button onClick={e => { e.stopPropagation(); setZoom(zoom + 0.5); }}
                style={{ background: "rgba(255,255,255,.2)", border: "none", color: "#fff", fontSize: 20, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                +
              </button>
            </div>
            {/* 닫기 */}
            <button onClick={() => setPhotoViewer(null)}
              style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.2)", border: "none", fontSize: 24, color: "#fff", cursor: "pointer", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, backdropFilter: "blur(4px)" }}>
              ✕
            </button>
            {/* 줌 안내 */}
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
