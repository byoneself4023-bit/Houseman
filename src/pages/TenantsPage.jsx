import { useState, useMemo, useEffect } from 'react';
import { buildings, roomMasterData, billingConfig, billingTypeMap, buildingAccountMap } from '../data';
import { getRoomType, changeRoomType } from '../config';
import { flowMap, ownerFieldCfg, defaultHousemanAccount, modeOptions } from '../config/accountConfig';
import { useIsMobile, fmt } from '../utils';
import { matchKorean } from '../utils/koreanSearch';
import { Card, SectionTitle, Table, StatusBadge, RoomTypeBadge, Field, ContractDropZone } from '../components';
import { PhotoDropZone } from '../components/PhotoDropZone';
import { rtCfg } from '../components/RoomTypeBadge';
import { inputStyle } from '../components/Field';

// 월세일(입주일 기준) 연체 상태 계산
// 청구 발생 이후에만 미납 판정 — roomBalances 기반
const today = new Date();
const getBillingStatus = (r, roomBalances = {}) => {
  const key = `${r.building}_${r.room}`;
  const balance = roomBalances[key] || 0;
  // 청구된 잔액이 없으면 미납 아님
  if (balance <= 0) return { label: "정상", days: 0, balance: 0 };
  // 월세일 = 입주일의 day, 없으면 due에서 추출
  const rentDay = r.moveIn ? new Date(r.moveIn).getDate() : (r.due ? parseInt(r.due.replace(/\D/g, "")) || 1 : 1);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), rentDay);
  const rentDate = thisMonth <= today ? thisMonth : new Date(today.getFullYear(), today.getMonth() - 1, rentDay);
  const diffDays = Math.floor((today - rentDate) / 86400000);
  // 월세일 이전: 청구는 됐지만 아직 납부 기한 내
  if (diffDays <= 0) return { label: "청구", days: 0, balance };
  // 월세일 당일부터 미납
  return { label: `연체${diffDays}일`, days: diffDays, balance };
};

// 단기 연체수수료 계산 (연체 5일차부터 임대료의 월 5%)
// lateFeeOverrides로 할인/제외 가능
const getLateFee = (r, roomBalances = {}, lateFeeOverrides = {}) => {
  const bs = getBillingStatus(r, roomBalances);
  if (bs.days < 5) return 0;
  if (getRoomType(r.building, r.room) !== "단기") return 0;
  const key = `${r.building}_${r.room}`;
  const override = lateFeeOverrides[key];
  if (override?.type === "exclude") return 0;
  const baseFee = Math.round((r.rent || 0) * 0.05);
  if (override?.type === "discount") return Math.max(0, baseFee - (override.amount || 0));
  return baseFee;
};

// 계좌 모드별 청구 분할 (수금관리와 동일)
const getBillingSlots = (t, buildingAccounts, allBuildings) => {
  const bldg = allBuildings.find(b => b.name === t.building);
  const bTypes = (bldg?.type || "단기").split("+").map(s => s.trim());
  const roomType = getRoomType(t.building, t.room);
  const roomAcctType = roomType === "기업시설관리" ? "관리사무소" : roomType;
  const typeIdx = bTypes.findIndex(bt => (bt === "기업시설관리" ? "관리사무소" : bt) === roomAcctType);
  const suffix = typeIdx >= 0 ? String(typeIdx + 1) : "1";
  const bAccts = buildingAccounts[t.building] || {};
  const roomKey = `${t.building}_${t.room}`;
  const roomOverride = buildingAccounts[roomKey];
  const mode = roomOverride?.mode || bAccts[`mode${suffix}`] || "";
  const rent = t.rent || 0;
  const mgmt = t.mgmt || 0;
  if (mode === "houseman" || mode === "hm_owner1" || mode === "gs1") {
    return [{ label: "①", amount: rent + mgmt }];
  } else if (mode === "owner1" || mode === "gs2a") {
    return [{ label: "①", amount: rent }, { label: "②", amount: mgmt }];
  } else if (mode === "owner2" || mode === "gs2b") {
    return [{ label: "①", amount: rent + mgmt }, { label: "②", amount: 0 }];
  } else if (mode === "gs3") {
    return [{ label: "①", amount: rent }, { label: "②", amount: mgmt }, { label: "③", amount: 0 }];
  }
  return [{ label: "①", amount: rent + mgmt }];
};

// 단기 + 단일계좌 여부 판별 (houseman, hm_owner1 = 전체금액을 하나의 계좌로)
const singleAcctModes = new Set(["houseman", "hm_owner1"]);

export const TenantsPage = ({ myBuildings = [], parkingInfo = {}, setParkingInfo, pendingContract, setPendingContract, pendingMoveout, setPendingMoveout, buildingAccounts = {}, allBuildings = [], activeTenants = [], setActiveTenants, pastTenantsData = {}, setPastTenantsData, activeVacancies = [], setActiveVacancies, calendarEvts = [], setCalendarEvts, billingHistory = [], roomBalances = {}, lateFeeOverrides = {}, buildingData = {} }) => {
  const isMobile = useIsMobile();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [actionDone, setActionDone] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [detailEdit, setDetailEdit] = useState(false);
  const [renewEditMode, setRenewEditMode] = useState(false);
  const [showContractHistory, setShowContractHistory] = useState(false);
  const [renewFiles, setRenewFiles] = useState([]);
  const [photoModalTenant, setPhotoModalTenant] = useState(null);
  const [checkPhotoEdit, setCheckPhotoEdit] = useState(null);
  const [checkPhotoView, setCheckPhotoView] = useState(null);
  const [photoViewer, setPhotoViewer] = useState(null); // { photos: [], index: 0 }
  const [billingPopup, setBillingPopup] = useState(null); // { tenant, bills }
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
  const [moveoutCompare, setMoveoutCompare] = useState(null); // null or { leftIdx, rightIdx, leftZoom, rightZoom, leftPos, rightPos }
  const [meterPhotos, setMeterPhotos] = useState({ electric: [], gas: [] }); // indices into moveOutPhotos
  const [meterZoom, setMeterZoom] = useState(null); // { src, zoom, pos }
  const [refundBank, setRefundBank] = useState("");
  const [refundAcct, setRefundAcct] = useState("");
  const [refundName, setRefundName] = useState("");
  // 관리사무소 엘리베이터 사용비
  const [elevatorFee, setElevatorFee] = useState(false);
  // 근생 원상복구 확인
  const [restorationStatus, setRestorationStatus] = useState("미확인"); // 미확인 / 진행중 / 확인완료
  const [restorationComment, setRestorationComment] = useState("");
  const [restorationPhotos, setRestorationPhotos] = useState([]);
  // 퇴실 검침값 (현장 입력)
  const [meterElecReading, setMeterElecReading] = useState("");
  const [meterGasReading, setMeterGasReading] = useState("");
  // pendingMoveout: 입퇴실일정에서 버튼 클릭 시 해당 임차인 퇴실정산서로 이동
  useEffect(() => {
    if (pendingMoveout) {
      const t = activeTenants.find(x => x.building === pendingMoveout.building && String(x.room) === String(pendingMoveout.room));
      if (t) {
        setSelectedTenant(t);
        setActionMode("moveout");
        // 퇴실문자에서 은행/계좌/입금자 자동 추출
        const calEvt = (calendarEvts || []).find(e => e.type === "퇴실" && e.building === pendingMoveout.building && String(e.room) === String(pendingMoveout.room));
        if (calEvt && calEvt.moveOutMsg) {
          const msg = calEvt.moveOutMsg;
          const bankList = ["KB국민","신한","하나","우리","NH농협","IBK기업","SC제일","씨티","카카오뱅크","케이뱅크","토스뱅크","새마을금고","신협","우체국","수협","광주","전북","제주","경남","부산","대구","BNK","산업","KDB","국민은행","농협은행","기업은행","국민","농협","기업"];
          const normBank = (b) => b === "국민은행" || b === "국민" ? "KB국민" : b === "농협은행" || b === "농협" ? "NH농협" : b === "기업은행" || b === "기업" ? "IBK기업" : b;
          // 은행명 찾기 → 이후 텍스트에서 첫번째 숫자열=계좌, 첫번째 한글열=이름
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
      // 수기 필드 초기화
      const tCur = activeTenants.find(x => x.id === selectedTenant.id) || selectedTenant;
      // 애완동물 신고 내용이 있으면 자동 반영
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

      // 사용기간: 입주일~퇴실일
      const usagePeriod = (() => {
        if (!moveInDate) return "-";
        let m = (moveoutDate.getFullYear() - moveInDate.getFullYear()) * 12 + (moveoutDate.getMonth() - moveInDate.getMonth());
        let d = moveoutDate.getDate() - moveInDate.getDate();
        if (d < 0) { m--; const prev = new Date(moveoutDate.getFullYear(), moveoutDate.getMonth(), 0); d += prev.getDate(); }
        return `${m}개월 ${d}일`;
      })();
      const totalUsedDays = moveInDate ? Math.ceil((moveoutDate - moveInDate) / 86400000) : 0;

      const record = {
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
      // 검침 체인에 퇴실검침 기록 (다음 입주자의 시작점)
      try {
        const chain = JSON.parse(localStorage.getItem("hm_meterChain") || "{}");
        const moveOutDate = moveoutDate.toISOString().slice(0, 10);
        if (!chain[historyKey]) chain[historyKey] = {};
        // 퇴실 검침값이 입력된 경우 체인에 저장
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

      // 퇴실 시 청구 이력을 퇴실정산 기록에 포함
      const tenantBills = billingHistory.filter(b => b.building === t.building && b.room === t.room && b.name === t.name);
      if (tenantBills.length > 0) record.billingHistory = tenantBills;

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
      // 퇴실 미수금 기록 (보증금 < 공제액 → 미수금 발생)
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
          const lateFee = getLateFee(t, roomBalances, lateFeeOverrides);
          const parseNum = (v) => Number(String(v).replace(/,/g, "")) || 0;
          const sumArr = (arr) => arr.reduce((s, r) => s + parseNum(r.amt), 0);
          const elecTotal = sumArr(manElec);
          const gasTotal = sumArr(manGas);
          const otherTotal = sumArr(manOther);
          // 관리사무소 엘리베이터 사용비
          const elevatorFeeAmt = isManagementOffice && elevatorFee ? 100000 : 0;
          // 위약금 귀속
          const bldgData = buildingData[t.building] || {};
          const penaltyRecipient = bldgData.penaltyOwner || "하우스맨";
          // 검침 체인에서 이전 검침값 조회
          const meterChainKey = `${t.building}_${t.room}`;
          let prevElecReading = null;
          let prevGasReading = null;
          try {
            const chain = JSON.parse(localStorage.getItem("hm_meterChain") || "{}");
            if (chain[meterChainKey]?.elec?.value != null) prevElecReading = chain[meterChainKey].elec;
            if (chain[meterChainKey]?.gas?.value != null) prevGasReading = chain[meterChainKey].gas;
          } catch (e) { /* ignore */ }
          // 자동 합산
          const totalDeduct = (netRent > 0 ? netRent : 0) + (netMgmt > 0 ? netMgmt : 0)
            + (netWater > 0 ? netWater : 0) + (netInternet > 0 ? netInternet : 0) + cleanFee
            + elecTotal + gasTotal + parseNum(manRepair) + parseNum(manWaste) + otherTotal
            + (showRestoration ? parseNum(manRestoration) : 0) + penaltyTotal + lateFee + prevUnpaid + elevatorFeeAmt;
          const totalRefund = (netRent < 0 ? -netRent : 0) + (netMgmt < 0 ? -netMgmt : 0)
            + (netWater < 0 ? -netWater : 0) + (netInternet < 0 ? -netInternet : 0);
          const settlement = t.deposit + totalRefund - totalDeduct;
          const SRow = ({ label, sub, value, color, bold }) => (
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
                {/* 기타 1,2,3 */}
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

            {/* 계량기 사진 + 전기/가스 금액 입력 (반환금액 아래) */}
            {showManualInputs && (
              <div style={{ marginTop: 12, padding: "12px 14px", background: "#FFFBEB", borderRadius: 10, border: "1.5px solid #FDE68A" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#EA580C", marginBottom: 8 }}>⚡🔥 전기 / 가스 청구금액</div>

                {/* 계량기 사진 */}
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

                {/* 전기/가스 입력 2열 */}
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
                    {restorationPhotos.map((photo, i) => {
                      const src = typeof photo === "string" ? photo : URL.createObjectURL(photo);
                      return (
                        <div key={i} style={{ position: "relative" }}>
                          <img src={src} alt="" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 6, border: "2px solid #DDD6FE" }}
                            onClick={() => setMeterZoom({ src, zoom: 1, pos: { x: 0, y: 0 } })} />
                          <button onClick={() => setRestorationPhotos(prev => prev.filter((_, j) => j !== i))}
                            style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", border: "none", background: "#DC2626", color: "#fff", fontSize: 10, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>x</button>
                        </div>
                      );
                    })}
                    <label style={{ width: 70, height: 70, borderRadius: 6, border: "2px dashed #DDD6FE", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#FAFAFE" }}>
                      <span style={{ fontSize: 24, color: "#C4B5FD" }}>+</span>
                      <input type="file" accept="image/*" multiple hidden onChange={e => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) setRestorationPhotos(prev => [...prev, ...files]);
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

        {/* 계량기 사진 확대 모달 */}
        {meterZoom && (
          <div style={{ position: "fixed", inset: 0, zIndex: 10003, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}
            onClick={() => setMeterZoom(null)}
            onWheel={e => { e.stopPropagation(); setMeterZoom(prev => prev ? { ...prev, zoom: Math.max(0.5, Math.min(10, prev.zoom + (e.deltaY > 0 ? -0.2 : 0.2))) } : null); }}>
            <div onClick={e => e.stopPropagation()}
              style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", overflow: "hidden", cursor: meterZoom.zoom > 1 ? "grab" : "default" }}
              onDoubleClick={() => setMeterZoom(prev => prev ? { ...prev, zoom: prev.zoom <= 1 ? 3 : 1, pos: { x: 0, y: 0 } } : null)}
              onMouseDown={e => {
                if (meterZoom.zoom <= 1) return;
                e.preventDefault();
                const sx = e.clientX - meterZoom.pos.x, sy = e.clientY - meterZoom.pos.y;
                const onM = (me) => setMeterZoom(prev => prev ? { ...prev, pos: { x: me.clientX - sx, y: me.clientY - sy } } : null);
                const onU = () => { window.removeEventListener("mousemove", onM); window.removeEventListener("mouseup", onU); };
                window.addEventListener("mousemove", onM); window.addEventListener("mouseup", onU);
              }}>
              <img src={meterZoom.src} alt="" draggable={false}
                style={{ maxWidth: meterZoom.zoom <= 1 ? "90vw" : "none", maxHeight: meterZoom.zoom <= 1 ? "90vh" : "none", width: meterZoom.zoom > 1 ? `${meterZoom.zoom * 90}vw` : undefined, transform: meterZoom.zoom > 1 ? `translate(${meterZoom.pos.x}px, ${meterZoom.pos.y}px)` : "none", transition: "transform 0.08s ease-out", objectFit: "contain", borderRadius: 8 }} />
            </div>
            <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.7)", borderRadius: 16, padding: "6px 18px", color: "#fff", fontSize: 12, fontWeight: 700 }}>
              {meterZoom.zoom !== 1 && <span style={{ color: "#93C5FD", marginRight: 8 }}>{Math.round(meterZoom.zoom * 100)}%</span>}
              더블클릭 확대 · 스크롤 줌 · 드래그 이동
            </div>
            <button onClick={() => setMeterZoom(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,.2)", border: "none", fontSize: 22, color: "#fff", cursor: "pointer", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        )}

        {/* 입퇴실 사진 비교 풀스크린 모달 */}
        {moveoutCompare && (() => {
          const mc = moveoutCompare;
          const leftPhotos = mc.photos?.left || [];
          const rightPhotos = mc.photos?.right || [];
          const updateMc = (patch) => setMoveoutCompare(prev => prev ? { ...prev, ...patch } : null);
          const renderSide = (photos, idx, zoom, pos, side) => {
            const setIdx = (v) => updateMc({ [side + "Idx"]: v, [side + "Zoom"]: 1, [side + "Pos"]: { x: 0, y: 0 } });
            const setZm = (v) => updateMc({ [side + "Zoom"]: Math.max(0.5, Math.min(10, v)) });
            const setPs = (v) => updateMc({ [side + "Pos"]: v });
            const isElec = side === "right" && idx !== null && meterPhotos.electric.includes(idx);
            const isGas = side === "right" && idx !== null && meterPhotos.gas.includes(idx);
            const toggleMeter = (type) => {
              if (idx === null) return;
              setMeterPhotos(prev => {
                const arr = [...prev[type]];
                const has = arr.includes(idx);
                return { ...prev, [type]: has ? arr.filter(x => x !== idx) : [...arr, idx] };
              });
            };
            if (idx !== null && photos[idx]) {
              const src = typeof photos[idx] === "string" ? photos[idx] : URL.createObjectURL(photos[idx]);
              return (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: zoom > 1 ? "grab" : "default", position: "relative", background: "#0a0a0a" }}
                  onWheel={e => { e.stopPropagation(); setZm(zoom + (e.deltaY > 0 ? -0.2 : 0.2)); }}
                  onDoubleClick={e => { e.stopPropagation(); if (zoom <= 1) { setZm(3); } else { updateMc({ [side + "Zoom"]: 1, [side + "Pos"]: { x: 0, y: 0 } }); } }}
                  onMouseDown={e => {
                    if (zoom <= 1) return;
                    e.preventDefault();
                    const sx = e.clientX - pos.x, sy = e.clientY - pos.y;
                    const onM = (me) => setPs({ x: me.clientX - sx, y: me.clientY - sy });
                    const onU = () => { window.removeEventListener("mousemove", onM); window.removeEventListener("mouseup", onU); };
                    window.addEventListener("mousemove", onM); window.addEventListener("mouseup", onU);
                  }}>
                  <img src={src} alt="" draggable={false}
                    style={{ maxWidth: zoom <= 1 ? "100%" : "none", maxHeight: zoom <= 1 ? "100%" : "none", width: zoom > 1 ? `${zoom * 100}%` : undefined, transform: zoom > 1 ? `translate(${pos.x}px, ${pos.y}px)` : "none", transition: "transform 0.08s ease-out", objectFit: "contain" }} />
                  {idx > 0 && <button onClick={(e) => { e.stopPropagation(); setIdx(idx - 1); }} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.6)", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>‹</button>}
                  {idx < photos.length - 1 && <button onClick={(e) => { e.stopPropagation(); setIdx(idx + 1); }} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.6)", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>›</button>}
                  <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.7)", borderRadius: 14, padding: "4px 14px", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    {idx + 1}/{photos.length}
                    {zoom !== 1 && <span style={{ color: "#93C5FD" }}>{Math.round(zoom * 100)}%</span>}
                  </div>
                  {/* 퇴실사진일 때 계량기 태그 버튼 */}
                  {side === "right" && (
                    <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleMeter("electric"); }}
                        style={{ padding: "6px 12px", borderRadius: 8, border: isElec ? "2px solid #FBBF24" : "1px solid rgba(255,255,255,.3)", background: isElec ? "rgba(251,191,36,.9)" : "rgba(0,0,0,.6)", color: isElec ? "#000" : "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", backdropFilter: "blur(4px)", fontFamily: "inherit" }}>
                        ⚡ 전기계량기 {isElec ? "✓" : ""}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toggleMeter("gas"); }}
                        style={{ padding: "6px 12px", borderRadius: 8, border: isGas ? "2px solid #60A5FA" : "1px solid rgba(255,255,255,.3)", background: isGas ? "rgba(96,165,250,.9)" : "rgba(0,0,0,.6)", color: isGas ? "#000" : "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", backdropFilter: "blur(4px)", fontFamily: "inherit" }}>
                        🔥 가스계량기 {isGas ? "✓" : ""}
                      </button>
                    </div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); updateMc({ [side + "Idx"]: null, [side + "Zoom"]: 1, [side + "Pos"]: { x: 0, y: 0 } }); }}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.6)", border: "none", color: "#fff", fontSize: 14, cursor: "pointer", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              );
            }
            if (photos.length === 0) return <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontSize: 13 }}>등록된 사진 없음</div>;
            return (
              <div style={{ width: "100%", height: "100%", overflow: "auto", padding: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {photos.map((p, pi) => {
                    const taggedE = meterPhotos.electric.includes(pi);
                    const taggedG = meterPhotos.gas.includes(pi);
                    return (
                    <div key={pi} onClick={() => setIdx(pi)}
                      style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", border: taggedE ? "3px solid #FBBF24" : taggedG ? "3px solid #60A5FA" : side === "left" ? "2px solid rgba(253,224,71,.5)" : "2px solid rgba(254,202,202,.5)", aspectRatio: "1", background: "#222", position: "relative" }}>
                      <img src={typeof p === "string" ? p : URL.createObjectURL(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      {(taggedE || taggedG) && (
                        <div style={{ position: "absolute", top: 3, left: 3, display: "flex", gap: 2 }}>
                          {taggedE && <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 4px", borderRadius: 3, background: "#FBBF24", color: "#000" }}>⚡전기</span>}
                          {taggedG && <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 4px", borderRadius: 3, background: "#60A5FA", color: "#000" }}>🔥가스</span>}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            );
          };
          return (
            <div style={{ position: "fixed", inset: 0, zIndex: 10002, background: "#000", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "10px 20px", background: "rgba(30,30,30,.95)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid #333" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                  🔍 사진 비교 — {mc.building} {mc.room}호
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>더블클릭 확대 · 스크롤 줌 · 드래그 이동</span>
                  <button onClick={() => setMoveoutCompare(null)}
                    style={{ background: "rgba(255,255,255,.15)", border: "none", fontSize: 20, color: "#fff", cursor: "pointer", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "2px solid #333" }}>
                  <div style={{ padding: "8px 16px", background: "rgba(180,83,9,.2)", textAlign: "center", flexShrink: 0, borderBottom: "1px solid #333" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#FCD34D" }}>📋 입주체크사진 ({leftPhotos.length}장)</span>
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    {renderSide(leftPhotos, mc.leftIdx, mc.leftZoom, mc.leftPos, "left")}
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "8px 16px", background: "rgba(220,38,38,.2)", textAlign: "center", flexShrink: 0, borderBottom: "1px solid #333" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#FCA5A5" }}>🚪 퇴실사진 ({rightPhotos.length}장)</span>
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    {renderSide(rightPhotos, mc.rightIdx, mc.rightZoom, mc.rightPos, "right")}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
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
                  pet: g("td-pet") || "",
                  rentDay: parseInt(g("td-rentday")) || 0,
                  mgmtDay: parseInt(g("td-mgmtday")) || 0,
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
                <div><div style={{ fontSize: 9, color: renewEditMode ? "#DC2626" : "#8F95A3", marginBottom: 2, fontWeight: renewEditMode ? 700 : 400 }}>입주일</div><input id="td-movein" type="date" defaultValue={t.moveIn || ""} readOnly={!detailEdit && !renewEditMode} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: renewEditMode ? "#FEF2F2" : detailEdit ? "#fff" : "#F8FAFC", border: renewEditMode ? "2px solid #DC2626" : undefined, color: renewEditMode ? "#DC2626" : "#1A1D23", fontWeight: renewEditMode ? 700 : 400 }} /></div>
                <div><div style={{ fontSize: 9, color: renewEditMode ? "#DC2626" : "#8F95A3", marginBottom: 2, fontWeight: renewEditMode ? 700 : 400 }}>만기일</div><input id="td-expiry" type="date" defaultValue={t.expiry} readOnly={!detailEdit && !renewEditMode} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, color: renewEditMode ? "#DC2626" : daysToExpiry < 30 ? "#DC2626" : "#1A1D23", fontWeight: renewEditMode || daysToExpiry < 30 ? 700 : 400, background: renewEditMode ? "#FEF2F2" : detailEdit ? "#fff" : "#F8FAFC", border: renewEditMode ? "2px solid #DC2626" : undefined }} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>월세일(납부일) <span style={{ fontSize: 8, color: "#B0B5C1" }}>미입력시 입주일</span></div><input id="td-rentday" type="number" min="1" max="31" defaultValue={t.rentDay || ""} placeholder={t.moveIn ? new Date(t.moveIn).getDate() + "일" : "입주일"} readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC", textAlign: "center", fontWeight: 700 }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>관리비납부일 <span style={{ fontSize: 8, color: "#B0B5C1" }}>미입력시 월세일</span></div><input id="td-mgmtday" type="number" min="1" max="31" defaultValue={t.mgmtDay || ""} placeholder="월세일과 동일" readOnly={!detailEdit} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC", textAlign: "center", fontWeight: 700 }} /></div>
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
                <div><div style={{ fontSize: 9, color: renewEditMode ? "#DC2626" : "#8F95A3", marginBottom: 2, fontWeight: renewEditMode ? 700 : 400 }}>{depositLabel}</div><input id="td-deposit" defaultValue={(t.deposit || 0).toLocaleString()} readOnly={!detailEdit && !renewEditMode} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: renewEditMode ? "#FEF2F2" : detailEdit ? "#fff" : "#F8FAFC", border: renewEditMode ? "2px solid #DC2626" : undefined, color: renewEditMode ? "#DC2626" : "#1A1D23", fontWeight: renewEditMode ? 700 : 400 }} /></div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 9, color: renewEditMode ? "#DC2626" : "#8F95A3", fontWeight: renewEditMode ? 700 : 400 }}>임대료</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: detailEdit ? "pointer" : "default" }}>
                      <input id="td-rentPostpaid" type="checkbox" defaultChecked={t.rentPayType === "후불"} disabled={!detailEdit} style={{ width: 12, height: 12, cursor: detailEdit ? "pointer" : "default" }} />
                      <span style={{ fontSize: 8, color: t.rentPayType === "후불" ? "#DC2626" : "#8F95A3", fontWeight: t.rentPayType === "후불" ? 700 : 400 }}>후불</span>
                    </label>
                  </div>
                  <input id="td-rent" defaultValue={(t.rent || 0).toLocaleString()} readOnly={!detailEdit && !renewEditMode} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: renewEditMode ? "#FEF2F2" : detailEdit ? "#fff" : "#F8FAFC", border: renewEditMode ? "2px solid #DC2626" : undefined, color: renewEditMode ? "#DC2626" : "#1A1D23", fontWeight: renewEditMode ? 700 : 400 }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 9, color: renewEditMode ? "#DC2626" : "#8F95A3", fontWeight: renewEditMode ? 700 : 400 }}>관리비</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: detailEdit ? "pointer" : "default" }}>
                      <input id="td-mgmtPostpaid" type="checkbox" defaultChecked={t.mgmtPayType === "후불"} disabled={!detailEdit} style={{ width: 12, height: 12, cursor: detailEdit ? "pointer" : "default" }} />
                      <span style={{ fontSize: 8, color: t.mgmtPayType === "후불" ? "#DC2626" : "#8F95A3", fontWeight: t.mgmtPayType === "후불" ? 700 : 400 }}>후불</span>
                    </label>
                  </div>
                  <input id="td-mgmt" defaultValue={t.mgmt > 0 ? (t.mgmt || 0).toLocaleString() : ""} placeholder="0" readOnly={!detailEdit && !renewEditMode} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, textAlign: "right", background: renewEditMode ? "#FEF2F2" : detailEdit ? "#fff" : "#F8FAFC", border: renewEditMode ? "2px solid #DC2626" : undefined, color: renewEditMode ? "#DC2626" : "#1A1D23", fontWeight: renewEditMode ? 700 : 400 }} />
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
              {(() => {
                // 계좌 모드 결정
                const bldg = allBuildings.find(b => b.name === t.building);
                const bTypes = (bldg?.type || "단기").split("+").map(s => s.trim());
                const roomType = getRoomType(t.building, t.room);
                const roomAcctType = roomType === "기업시설관리" ? "관리사무소" : roomType;
                const typeIdx = bTypes.findIndex(bt => (bt === "기업시설관리" ? "관리사무소" : bt) === roomAcctType);
                const suffix = typeIdx >= 0 ? String(typeIdx + 1) : "1";
                const bAccts = buildingAccounts[t.building] || {};
                const roomKey = `${t.building}_${t.room}`;
                const roomOverride = buildingAccounts[roomKey];
                const mode = roomOverride?.mode || bAccts[`mode${suffix}`] || "";
                const housemanAcct = roomOverride?.housemanAccount || bAccts[`housemanAccount${suffix}`] || defaultHousemanAccount;
                const ownerAccts = roomOverride?.ownerAccounts || bAccts[`ownerAccounts${suffix}`] || {};
                const flow = flowMap[mode] || "";

                // 모드별 청구 슬롯 (수금관리와 동일)
                const rent = t.rent || 0;
                const mgmt = t.mgmt || 0;
                let slots = [];
                let acctInfo = [];
                if (mode === "houseman") {
                  slots = [{ label: "청구①", amount: rent + mgmt }];
                  acctInfo = [{ tags: ["임대료", "관리비", "공과금"], acct: housemanAcct }];
                } else if (mode === "hm_owner1") {
                  slots = [{ label: "청구①", amount: rent + mgmt }];
                  acctInfo = [{ tags: ["임대료", "관리비", "공과금"], acct: ownerAccts.rent || "" }];
                } else if (mode === "owner1" || mode === "gs2a") {
                  slots = [{ label: "청구①", amount: rent }, { label: "청구②", amount: mgmt }];
                  acctInfo = [
                    { tags: ["임대료"], acct: ownerAccts.rent || "" },
                    { tags: ["관리비", "공과금"], acct: mode === "gs2a" ? (ownerAccts.mgmt || "") : housemanAcct, hasUtility: true },
                  ];
                } else if (mode === "owner2" || mode === "gs2b") {
                  slots = [{ label: "청구①", amount: rent + mgmt }, { label: "청구②", amount: 0 }];
                  acctInfo = [
                    { tags: ["임대료", "관리비"], acct: ownerAccts.rent || "" },
                    { tags: ["공과금"], acct: mode === "gs2b" ? (ownerAccts.utility || "") : housemanAcct, hasUtility: true },
                  ];
                } else if (mode === "gs1") {
                  slots = [{ label: "청구①", amount: rent + mgmt }];
                  acctInfo = [{ tags: ["임대료", "관리비", "공과금"], acct: ownerAccts.rent || "" }];
                } else if (mode === "gs3") {
                  slots = [{ label: "청구①", amount: rent }, { label: "청구②", amount: mgmt }, { label: "청구③", amount: 0 }];
                  acctInfo = [
                    { tags: ["임대료"], acct: ownerAccts.rent || "" },
                    { tags: ["관리비"], acct: ownerAccts.mgmt || "" },
                    { tags: ["공과금"], acct: ownerAccts.utility || "", hasUtility: true },
                  ];
                } else {
                  // 모드 미설정: 기본 단일
                  slots = [{ label: "청구①", amount: rent + mgmt }];
                  acctInfo = [{ tags: ["임대료", "관리비"], acct: "" }];
                }

                const slotColors = [
                  { bg: "#FFF7ED", border: "#FDBA74", text: "#EA580C", light: "#92400E" },
                  { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", light: "#78716C" },
                  { bg: "#EFF6FF", border: "#93C5FD", text: "#2563EB", light: "#1E40AF" },
                ];

                const bal = roomBalances[`${t.building}_${t.room}`] || 0;
                const lf = getLateFee(t, roomBalances, lateFeeOverrides);
                const overrideKey = `${t.building}_${t.room}`;
                const override = lateFeeOverrides[overrideKey];

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                    {/* 흐름 안내 */}
                    {flow && <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2, padding: "4px 8px", background: "#F8FAFC", borderRadius: 6 }}>💰 {flow}</div>}
                    {/* 청구①②③ 슬롯 (수금관리와 동일) */}
                    {slots.map((slot, si) => {
                      const c = slotColors[si % slotColors.length];
                      const info = acctInfo[si] || {};
                      return (
                        <div key={si} style={{ padding: "10px 12px", borderRadius: 8, background: c.bg, border: `1.5px solid ${c.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: c.text }}>{slot.label}</span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: c.text }}>
                              {slot.amount.toLocaleString()}원{info.hasUtility ? "+" : ""}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: info.acct ? 4 : 0 }}>
                            {(info.tags || []).map(tag => (
                              <span key={tag} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#fff", color: "#5F6577" }}>{tag}</span>
                            ))}
                          </div>
                          {info.acct && <div style={{ fontSize: 9, color: c.light }}>{info.acct}</div>}
                        </div>
                      );
                    })}
                    {/* 미납 잔액 (roomBalances 기반) */}
                    {bal > 0 && (
                      <div style={{ padding: "8px 10px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626" }}>미납 잔액</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#DC2626" }}>{bal.toLocaleString()}원</span>
                        </div>
                        {lf > 0 && <div style={{ fontSize: 9, color: "#DC2626", marginTop: 2 }}>연체수수료 {fmt(lf)}원 (5%)</div>}
                        {override?.type === "exclude" && <div style={{ fontSize: 9, color: "#059669", marginTop: 2 }}>연체수수료 제외 (수금관리)</div>}
                        {override?.type === "discount" && <div style={{ fontSize: 9, color: "#2563EB", marginTop: 2 }}>연체수수료 {fmt(override.amount)}원 할인 (수금관리)</div>}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 가상퇴실계산 + 청구 이력 누적 */}
              {(() => {
                const myBills = billingHistory.filter(b => b.building === t.building && b.room === t.room).sort((a, b) => a.id - b.id);
                // 누적 합계
                const cumulative = { rent: 0, mgmt: 0, elec: 0, gas: 0, water: 0, cable: 0, lateFee: 0, asRepair: 0, total: 0 };
                myBills.forEach(b => {
                  if (b.items) {
                    cumulative.rent += b.items.rent || 0;
                    cumulative.mgmt += b.items.mgmt || 0;
                    cumulative.elec += b.items.elec || 0;
                    cumulative.gas += b.items.gas || 0;
                    cumulative.water += b.items.water || 0;
                    cumulative.cable += b.items.cable || 0;
                    cumulative.lateFee += b.items.lateFee || 0;
                    cumulative.asRepair += b.items.asRepair || 0;
                  }
                  cumulative.total += b.total || 0;
                });
                const balance = roomBalances[`${t.building}_${t.room}`] || 0;
                const paid = cumulative.total - balance;
                const [billOpen, setBillOpen] = [billingPopup?.tenant?.id === t.id, (open) => open ? setBillingPopup({ tenant: t, bills: myBills }) : setBillingPopup(null)];
                return (
                  <div style={{ marginBottom: 12 }}>
                    <button onClick={() => setBillOpen(!billOpen)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: billOpen ? "2px solid #F59E0B" : "1.5px solid #E8ECF0", background: billOpen ? "#FFFBEB" : "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13 }}>🧾</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#92400E" }}>가상퇴실계산</span>
                        <span style={{ fontSize: 10, color: "#8F95A3", fontWeight: 600 }}>청구 {myBills.length}건</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: balance > 0 ? "#DC2626" : "#059669" }}>
                          {balance > 0 ? `미납 ${fmt(balance)}원` : `완납`}
                        </span>
                        <span style={{ fontSize: 11, color: "#8F95A3" }}>{billOpen ? "▲" : "▼"}</span>
                      </div>
                    </button>
                    {billOpen && (
                      <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 10, background: "#FFFBEB", border: "1.5px solid #FDE68A" }}>
                        {/* 누적 요약 */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #FDE68A" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#92400E" }}>누적 청구: {fmt(cumulative.total)}원</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#059669" }}>납부: {fmt(paid)}원</span>
                          {balance > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626" }}>미납: {fmt(balance)}원</span>}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                          {cumulative.rent > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#fff", color: "#5F6577" }}>월세 {fmt(cumulative.rent)}</span>}
                          {cumulative.mgmt > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#fff", color: "#5F6577" }}>관리비 {fmt(cumulative.mgmt)}</span>}
                          {cumulative.elec > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#FEF3C7", color: "#92400E" }}>전기 {fmt(cumulative.elec)}</span>}
                          {cumulative.gas > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#FEE2E2", color: "#991B1B" }}>가스 {fmt(cumulative.gas)}</span>}
                          {cumulative.water > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#EFF6FF", color: "#2563EB" }}>수도 {fmt(cumulative.water)}</span>}
                          {cumulative.cable > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#F3F4F6", color: "#5F6577" }}>인터넷 {fmt(cumulative.cable)}</span>}
                          {cumulative.lateFee > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#FEF2F2", color: "#DC2626" }}>연체료 {fmt(cumulative.lateFee)}</span>}
                          {cumulative.asRepair > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#F5F3FF", color: "#7C3AED" }}>수리비 {fmt(cumulative.asRepair)}</span>}
                        </div>
                        {/* 개별 청구 내역 */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {[...myBills].reverse().map((b, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: 6, background: "#fff", border: "1px solid #FDE68A" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 9, fontWeight: 800, color: "#D97706", background: "#FEF3C7", padding: "1px 5px", borderRadius: 4 }}>{i + 1}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: "#5F6577" }}>{b.date}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {b.items?.elec > 0 && <span style={{ fontSize: 8, color: "#92400E" }}>⚡{fmt(b.items.elec)}</span>}
                                {b.items?.gas > 0 && <span style={{ fontSize: 8, color: "#991B1B" }}>🔥{fmt(b.items.gas)}</span>}
                                <span style={{ fontSize: 11, fontWeight: 800, color: "#92400E" }}>{fmt(b.total)}원</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>🅿️ 주차</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차번호</div><input value={parkingInfo[t.id]?.carNumber ?? t.carNumber ?? ""} onChange={e => setParkingInfo && setParkingInfo(prev => ({ ...prev, [t.id]: { ...prev[t.id], carNumber: e.target.value, carType: prev[t.id]?.carType ?? t.carType ?? "" } }))} placeholder="12가 3456" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>차종</div><input value={parkingInfo[t.id]?.carType ?? t.carType ?? ""} onChange={e => setParkingInfo && setParkingInfo(prev => ({ ...prev, [t.id]: { ...prev[t.id], carType: e.target.value, carNumber: prev[t.id]?.carNumber ?? t.carNumber ?? "" } }))} placeholder="현대 아반떼" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>📌 기타</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>애완동물 신고</div><input id="td-pet" defaultValue={t.pet || ""} readOnly={!detailEdit} placeholder="애완동물 신고 내용" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, background: detailEdit ? "#fff" : "#F8FAFC" }} /></div>
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
                    const merged = [...(t.contractFiles || []), ...newFiles];
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

        {/* 재계약 저장/취소 */}
        {renewEditMode && (
          <Card style={{ marginBottom: 16, border: "2px solid #DC2626", background: "#FEF2F2" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#DC2626", marginBottom: 12 }}>📝 재계약 입력 모드 — 적색 필드를 수정 후 저장하세요</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setRenewEditMode(false); }} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
              <button onClick={() => {
                const g = (id) => document.getElementById(id)?.value ?? "";
                const newMoveIn = g("td-movein") || t.moveIn || "";
                const newExpiry = g("td-expiry") || t.expiry;
                const newDeposit = Number(g("td-deposit").replace(/,/g, "")) || t.deposit;
                const newRent = Number(g("td-rent").replace(/,/g, "")) || t.rent;
                const newMgmt = Number(g("td-mgmt").replace(/,/g, "")) || 0;
                if (!newExpiry) { alert("만기일을 입력하세요"); return; }
                // 이전 계약 정보를 pastTenantsData에 재계약 이력으로 저장
                const historyKey = `${t.building}_${t.room}`;
                const prevRecord = {
                  name: t.name, phone: t.phone,
                  moveIn: t.moveIn || "", moveOut: newMoveIn || t.expiry || "",
                  expiry: t.expiry,
                  deposit: t.deposit, rent: t.rent, mgmt: t.mgmt,
                  reason: "재계약", settlement: "재계약",
                  renewedAt: new Date().toISOString().slice(0, 10),
                };
                setPastTenantsData?.(prev => ({ ...prev, [historyKey]: [...(prev[historyKey] || []), prevRecord] }));
                const updated = {
                  ...t,
                  moveIn: newMoveIn,
                  expiry: newExpiry,
                  deposit: newDeposit,
                  rent: newRent,
                  mgmt: newMgmt,
                  overdue: 0,
                  prevUnpaid: 0,
                  status: "정상",
                };
                setActiveTenants?.(prev => prev.map(x => x.id === t.id ? { ...x, ...updated } : x));
                setSelectedTenant({ ...t, ...updated });
                setRenewEditMode(false);
                alert("재계약이 저장되었습니다.");
              }} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "#DC2626", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>📝 재계약 저장</button>
            </div>
          </Card>
        )}


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
          <div style={{ display: "grid", gridTemplateColumns: roomType === "단기" ? "1fr" : "1fr 1fr", gap: 10 }}>
            {roomType !== "단기" && (
              <Card onClick={() => { setRenewEditMode(true); setShowContractHistory(false); }} style={{ cursor: "pointer", textAlign: "center", padding: "20px 12px", border: "1.5px solid #BFDBFE", background: "#EFF6FF" }}>
                <span style={{ fontSize: 28 }}>📝</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#2563EB", marginTop: 8 }}>재계약입력</div>
                <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 4 }}>입주일·만기일·금액 변경</div>
              </Card>
            )}
            <Card onClick={() => setActionMode("moveout")} style={{ cursor: "pointer", textAlign: "center", padding: "20px 12px", border: "1.5px solid #E9D5FF", background: "#FAF5FF" }}>
              <span style={{ fontSize: 28 }}>🧮</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#7C3AED", marginTop: 8 }}>가상퇴실계산</div>
              <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 4 }}>정산 시뮬레이션</div>
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
                <div style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", marginBottom: 8, paddingBottom: 6, borderBottom: "2px solid #FECACA" }}>⚠️ 필수 입력</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12, padding: "10px", background: "#FEF2F2", borderRadius: 10, border: "1.5px solid #FECACA" }}>
                  <div><div style={{ fontSize: 9, color: "#DC2626", fontWeight: 700, marginBottom: 2 }}>입주자명 <span style={{ color: "#DC2626" }}>*</span></div><input id="pc-name" placeholder="이름 입력" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, borderColor: "#FECACA" }} /></div>
                  <div><div style={{ fontSize: 9, color: "#DC2626", fontWeight: 700, marginBottom: 2 }}>연락처1 <span style={{ color: "#DC2626" }}>*</span></div><input id="pc-phone" placeholder="010-0000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, borderColor: "#FECACA" }} /></div>
                  <div><div style={{ fontSize: 9, color: "#DC2626", fontWeight: 700, marginBottom: 2 }}>주민등록번호 <span style={{ color: "#DC2626" }}>*</span></div><input id="pc-ssn" placeholder="000000-0000000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, fontFamily: "monospace", borderColor: "#FECACA" }} /></div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 800, color: "#1A1D23", marginBottom: 8, paddingBottom: 6, borderBottom: "1.5px solid #E8ECF0" }}>기본 정보</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처2</div><input id="pc-phone2" placeholder="010-0000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>연락처3</div><input id="pc-phone3" placeholder="010-0000-0000" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><div style={{ fontSize: 9, color: pc.moveIn || pc.date ? "#8F95A3" : "#DC2626", fontWeight: pc.moveIn || pc.date ? 400 : 700, marginBottom: 2 }}>입주일 {!(pc.moveIn || pc.date) && <span style={{ color: "#DC2626" }}>*</span>}</div><input id="pc-movein" type="date" defaultValue={pc.moveIn || pc.date} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, borderColor: pc.moveIn || pc.date ? undefined : "#FECACA" }} /></div>
                  <div><div style={{ fontSize: 9, color: pc.expiry ? "#8F95A3" : "#DC2626", fontWeight: pc.expiry ? 400 : 700, marginBottom: 2 }}>만기일 {!pc.expiry && <span style={{ color: "#DC2626" }}>*</span>}</div><input id="pc-expiry" type="date" defaultValue={pc.expiry || ""} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12, borderColor: pc.expiry ? undefined : "#FECACA" }} /></div>
                  <div><div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 2 }}>계약일</div>
                    <div style={{ padding: "7px 10px", borderRadius: 8, background: "#F3F4F6", border: "1px solid #E0E3E9", fontSize: 12, color: "#5F6577" }}>{pc.contractDate || pc.date}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 12 }}>
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
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 9, color: "#8F95A3" }}>수도</span>
                        <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
                          <input id="pc-waterPostpaid" type="checkbox" style={{ width: 12, height: 12, cursor: "pointer" }} />
                          <span style={{ fontSize: 8, color: "#DC2626", fontWeight: 600 }}>후불</span>
                        </label>
                      </div>
                      <input id="pc-water" defaultValue={pc.water || ""} placeholder="포함" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 9, color: "#8F95A3" }}>케이블</span>
                        <label style={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
                          <input id="pc-cablePostpaid" type="checkbox" style={{ width: 12, height: 12, cursor: "pointer" }} />
                          <span style={{ fontSize: 8, color: "#DC2626", fontWeight: 600 }}>후불</span>
                        </label>
                      </div>
                      <input id="pc-cable" defaultValue={pc.cable || ""} placeholder="포함" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }} />
                    </div>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 10, color: "#5F6577" }}>
                      <input id="pc-noParking" type="checkbox" style={{ cursor: "pointer", accentColor: "#DC2626" }} />
                      <span style={{ color: "#DC2626", fontWeight: 600 }}>주차불가로 계약</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 10, color: hasParking ? "#DC2626" : "#5F6577", fontWeight: hasParking ? 700 : 400 }}>
                      <input type="checkbox" checked={hasParking} onChange={e => setHasParking(e.target.checked)} style={{ cursor: "pointer", accentColor: "#DC2626" }} />
                      주차있음
                    </label>
                  </div>
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
                    onAdd={(newFiles) => setPendingContract(prev => ({ ...prev, contractFiles: [...(prev.contractFiles || []), ...newFiles] }))}
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
                    const ssn = document.getElementById("pc-ssn")?.value?.trim();
                    if (!name) return alert("입주자명을 입력하세요");
                    if (!phone) return alert("연락처1을 입력하세요");
                    if (!ssn) return alert("주민등록번호를 입력하세요");
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
                    setCalendarEvts?.(prev => prev.filter(e => !(e.type === "계약" && e.building === pc.building && String(e.room) === String(pc.room))));
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
                {["유형","건물명","호실","입주자","연락처","입주일","만기일","보증금","월세","관리비","상태","청구①","청구②","청구③"].map((h, i) => (
                  <th key={i} style={{ padding: i >= 11 ? "10px 10px" : i >= 10 ? "10px 4px" : "10px 8px", textAlign: (i >= 7 && i <= 9) || i >= 11 ? "right" : i >= 10 ? "center" : "left", fontSize: 11, fontWeight: 700, color: "#8F95A3", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const bs = getBillingStatus(r, roomBalances);
                const slots = getBillingSlots(r, buildingAccounts, allBuildings);
                const slotColors = ["#EA580C", "#92400E", "#2563EB"];
                return (
                  <tr key={i} onClick={() => setSelectedTenant(r)}
                    style={{ borderBottom: "1px solid #F0F2F5", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#F9FAFB"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "10px 8px" }}><RoomTypeBadge building={r.building} room={r.room} /></td>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>{r.building}</td>
                    <td style={{ padding: "10px 8px" }}>{r.room}</td>
                    <td style={{ padding: "10px 4px", fontWeight: 700, maxWidth: 55, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.name}>{r.name.length > 5 ? r.name.slice(0, 5) + "…" : r.name}</td>
                    <td style={{ padding: "10px 2px", fontSize: 11, color: "#5F6577" }}>{r.phone}</td>
                    <td style={{ padding: "10px 2px", fontSize: 11 }}>{r.moveIn ? r.moveIn.slice(2) : "-"}</td>
                    <td style={{ padding: "10px 4px", fontSize: 11 }}>{r.expiry ? r.expiry.slice(2) : "-"}</td>
                    <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 11 }}>{fmt(r.deposit)}</td>
                    <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 11 }}>{fmt(r.rent)}</td>
                    <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 11, color: "#8F95A3" }}>{fmt(r.mgmt)}</td>
                    <td style={{ padding: "10px 4px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <StatusBadge status={bs.label === "청구" ? "청구" : bs.days > 0 ? "연체" : r.status} label={bs.days > 0 ? bs.label : undefined} />
                    </td>
                    {[0, 1, 2].map(si => (
                      <td key={si} style={{ padding: "10px 10px", textAlign: "right", fontSize: 11 }}>
                        {slots[si] ? <span style={{ fontWeight: 700, color: slotColors[si] }}>{fmt(slots[si].amount)}</span> : <span style={{ color: "#D1D5DB" }}>—</span>}
                      </td>
                    ))}
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

      {/* 공과금 청구 이력 팝업 */}
      {billingPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setBillingPopup(null)}>
          <div onClick={e => e.stopPropagation()}
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
              {billingPopup.bills.map((bill, i) => (
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
