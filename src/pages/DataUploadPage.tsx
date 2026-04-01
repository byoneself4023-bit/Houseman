import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import type { Building, Tenant, Vacancy } from "@/types";

interface DataUploadPageProps {
  isLoading?: boolean;
  allBuildings: Building[];
  setAllBuildings: React.Dispatch<React.SetStateAction<Building[]>>;
  buildingData: Record<string, any>;
  setBuildingData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  activeTenants: Tenant[];
  setActiveTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  activeVacancies: Vacancy[];
  setActiveVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
}

interface LedgerResult {
  buildings: number;
  tenants: number;
  vacancies: number;
  pastTenants: number;
  rooms: number;
  errors: string[];
}

interface ColumnDef {
  key: string;
  label: string;
  required?: boolean;
  note?: string;
}

export function DataUploadPage({ allBuildings, setAllBuildings, buildingData, setBuildingData, activeTenants, setActiveTenants, activeVacancies, setActiveVacancies, isLoading }: DataUploadPageProps) {
  const [tab, setTab] = useState("ledger");
  const [preview, setPreview] = useState<Record<string, any>[] | null>(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [ledgerResult, setLedgerResult] = useState<LedgerResult | null>(null);
  const tabs = [
    { id: "ledger", label: "통합관리대장", icon: "📊" },
    { id: "building", label: "건물정보", icon: "🏢" },
    { id: "room", label: "호실정보", icon: "🚪" },
    { id: "tenant", label: "임차인정보", icon: "👤" },
  ];

  // ======== 엑셀 읽기 공통 ========
  const readExcel = (file: File): Promise<Record<string, any>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
          resolve(data as Record<string, any>[]);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // ======== 통합관리대장 읽기 (멀티시트) ========
  const readLedger = (file: File): Promise<XLSX.WorkBook> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: "array", cellDates: true });
          resolve(wb);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const fmtDate = (v: any): string => {
    if (!v) return "";
    if (v instanceof Date) {
      // 엑셀 날짜가 UTC로 파싱되어 KST에서 하루 밀리는 문제 보정
      const d = new Date(v.getTime() + 9 * 60 * 60 * 1000);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    }
    return String(v).slice(0, 10);
  };
  const num = (v: any): number => parseInt(String(v || "0").replace(/,/g, "")) || 0;

  const applyLedger = async (wb: XLSX.WorkBook) => {
    const result: LedgerResult = { buildings: 0, tenants: 0, vacancies: 0, pastTenants: 0, rooms: 0, errors: [] };

    // ── 1. 관리건물_목록 ──
    const buildingListSheet = wb.Sheets["관리건물_목록"];
    const buildingNames: string[] = [];
    if (buildingListSheet) {
      const rows = XLSX.utils.sheet_to_json(buildingListSheet, { header: 1, defval: "" }) as any[][];
      rows.forEach(r => { const name = String(r[0] || "").trim(); if (name) buildingNames.push(name); });
    }

    // ── 2. ◆건물정보 ──
    const buildingSheet = wb.Sheets["◆건물정보"];
    const newBuildings: Building[] = [];
    const newBD: Record<string, any> = { ...buildingData };
    if (buildingSheet) {
      const rows = XLSX.utils.sheet_to_json(buildingSheet, { header: 1, defval: "" }) as any[][];
      // 행1=헤더, 행2=서브헤더, 행3~=데이터
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i];
        const name = String(r[1] || "").trim();
        if (!name) continue;
        const feeRate = parseFloat(r[3]) || 0;
        newBuildings.push({
          name, rooms: 0, occupied: 0, type: "단기",
          feeType: feeRate > 0 ? "pct" : "fixed", fee: feeRate,
          fixedFee: 0, special: null, parkingTotal: 0,
        } as Building);
        newBD[name] = {
          ...(newBD[name] || {}),
          startDate: fmtDate(r[2]),
          feeRate,
          penaltyOwner: String(r[4] || "").trim(),
          vatType: String(r[5] || "").trim(),
          standardLease: String(r[6] || "").trim(),
          owners: [{
            name: String(r[7] || "").trim(),
            ssn: String(r[8] || "").trim(),
            phone: String(r[9] || "").trim(),
          }, ...(String(r[10] || "").trim() ? [{
            name: String(r[10] || "").trim(),
            ssn: String(r[11] || "").trim(),
            phone: String(r[12] || "").trim(),
          }] : [])],
          address: String(r[13] || "").trim(),
          email: String(r[14] || "").trim(),
          settlementAccount: String(r[15] || "").trim(),
          tvCost: num(r[16]),
          internetCost: num(r[17]),
          tvInternetTotal: num(r[18]),
          tvContractEnd: fmtDate(r[19]),
          taxAccountant: String(r[20] || "").trim(),
          telecom: String(r[21] || "").trim(),
          approvalDate: String(r[22] || "").trim(),
        };
        result.buildings++;
      }
    }
    // 목록에만 있고 건물정보에 없는 건물 추가
    buildingNames.forEach(name => {
      if (!newBuildings.find(b => b.name === name)) {
        newBuildings.push({ name, rooms: 0, occupied: 0, type: "단기", feeType: "pct", fee: 0, fixedFee: 0, special: null, parkingTotal: 0 } as Building);
        if (!newBD[name]) newBD[name] = {};
        result.buildings++;
      }
    });

    // ── 3. ■입주정보 ──
    const tenantSheet = wb.Sheets["■입주정보"];
    const newTenants: any[] = [];
    let tid = 0;
    if (tenantSheet) {
      const rows = XLSX.utils.sheet_to_json(tenantSheet, { header: 1, defval: "" }) as any[][];
      // 행1=헤더1, 행2=헤더2, 행3=번호, 행4~=데이터
      for (let i = 3; i < rows.length; i++) {
        const r = rows[i];
        const building = String(r[1] || "").trim();
        const room = String(r[2] || "").trim();
        const name = String(r[3] || "").trim();
        if (!building || !room || !name) continue;
        tid++;
        const due = fmtDate(r[5]);
        // 납부일에서 월/일 추출
        let dueStr = "";
        if (due) {
          const parts = due.split("-");
          if (parts.length === 3) dueStr = `${parseInt(parts[1])}/${parseInt(parts[2])}`;
        }
        newTenants.push({
          id: tid, name, building, room,
          due: dueStr,
          // G~J열: 청구①(건물주)=G+I, 청구②(하우스맨)=H+J
          fromLedger: true,            // 통합관리대장에서 올라온 데이터 표시
          prevBillOwner: num(r[6]),   // G: 전월 청구 (건물주)
          prevBillHM: num(r[7]),      // H: 전월 청구 (하우스맨)
          curBillOwner: num(r[8]),    // I: 당월 청구 (건물주)
          curBillHM: num(r[9]),       // J: 당월 청구 (하우스맨)
          lateFeeAmount: num(r[10]), // K: 연체료
          moveIn: fmtDate(r[11]),
          expiry: fmtDate(r[12]),
          ssn: String(r[13] || "").trim(),
          phone: String(r[14] || "").trim(),
          deposit: num(r[15]),
          rent: num(r[16]),
          rentPayType: String(r[17] || "").trim() || undefined,
          mgmt: num(r[18]),
          mgmtPayType: String(r[19] || "").trim() || undefined,
          water: num(r[20]),
          waterPayType: String(r[21] || "").trim() || undefined,
          internet: num(r[22]),
          internetPayType: String(r[23] || "").trim() || undefined,
          extraDeposit: num(r[24]),
          type: String(r[25] || "단기").trim(),
          carNumber: String(r[26] || "").trim() || undefined,
          cleanFee: num(r[27]),
          commFeeBasic: num(r[28]),
          commFeeEvent: String(r[29] || "").trim() || undefined,
          broker: String(r[30] || "").trim() || undefined,
          brokerPhone: String(r[31] || "").trim() || undefined,
          petReport: String(r[33] || "").trim() || undefined,
          memo1: String(r[34] || "").trim() || undefined,
          linked: String(r[35] || "").trim() ? true : undefined,
          rentDay: parseInt(dueStr.split("/")[1]) || undefined,
          status: name === "퇴실" ? "퇴실" : "정상",
          overdue: 0, prevUnpaid: 0, currentUnpaid: 0, overdueDays: 0,
        });
        result.tenants++;
      }
    }

    // ── 4. ■퇴실정보 ──
    const pastSheet = wb.Sheets["■퇴실정보"];
    const pastTenants: any[] = [];
    if (pastSheet) {
      const rows = XLSX.utils.sheet_to_json(pastSheet, { header: 1, defval: "" }) as any[][];
      for (let i = 3; i < rows.length; i++) {
        const r = rows[i];
        const building = String(r[1] || "").trim();
        const room = String(r[2] || "").trim();
        const name = String(r[7] || "").trim();
        if (!building || !room || !name) continue;
        pastTenants.push({
          building, room, name,
          moveOut: fmtDate(r[4]),
          elecReading: String(r[5] || "").trim(),
          gasReading: String(r[6] || "").trim(),
          moveIn: fmtDate(r[8]),
          expiry: fmtDate(r[9]),
          deposit: num(r[10]),
          rent: num(r[11]),
          mgmt: num(r[12]),
          cleanFee: num(r[13]),
          commFee: num(r[14]),
          parking: String(r[15] || "").trim(),
        });
        result.pastTenants++;
      }
    }

    // ── 5. ◆관리정보 ──
    const mgmtSheet = wb.Sheets["◆관리정보"];
    const roomData: Record<string, any> = {};
    if (mgmtSheet) {
      const rows = XLSX.utils.sheet_to_json(mgmtSheet, { header: 1, defval: "" }) as any[][];
      for (let i = 3; i < rows.length; i++) {
        const r = rows[i];
        const building = String(r[1] || "").trim();
        const room = String(r[2] || "").trim();
        if (!building || !room) continue;
        const key = `${building}_${room}`;
        roomData[key] = {
          accountType: String(r[3] || "").trim(),
          depositName: String(r[4] || "").trim(),
          account1: String(r[5] || "").trim(),
          account2: String(r[6] || "").trim(),
          elecNo: String(r[7] || "").trim(),
          gasNo: String(r[8] || "").trim(),
          rentalType: String(r[9] || "").trim(),
          autoCharge: String(r[10] || "").trim(),
          mgmtTeam: String(r[11] || "").trim(),
          collectionTeam: String(r[12] || "").trim(),
          buildingClean: String(r[13] || "").trim(),
          exitClean: String(r[14] || "").trim(),
          cleanPayment: String(r[15] || "").trim(),
          info1: String(r[16] || "").trim(),
          info2: String(r[17] || "").trim(),
          info3: String(r[18] || "").trim(),
          info4: String(r[19] || "").trim(),
          feePercent: String(r[20] || "").trim(),
          mgmtFee: String(r[21] || "").trim(),
        };
        result.rooms++;
      }
    }

    // ── 공실 자동 생성: 입주자가 "퇴실"인 건 ──
    const vacancies: any[] = [];
    newTenants.filter(t => t.name === "퇴실" || t.status === "퇴실").forEach(t => {
      vacancies.push({
        building: t.building, room: t.room, type: t.type || "단기",
        deposit: t.deposit || 0, rent: t.rent || 0, nego: t.rent || 0,
        mgmt: t.mgmt || 0, water: "", cable: "", exitFee: 0, days: 0,
        commBroker: 0, commEvent: "", pw: "", status: "홍보중",
      });
      result.vacancies++;
    });
    // 퇴실자는 임차인 목록에서 제거
    const activeTenantList = newTenants.filter(t => t.name !== "퇴실" && t.status !== "퇴실");

    // ── roomBalances 세팅: 청구금액이 있는 임차인의 잔액 ──
    const newBalances: Record<string, number> = {};
    activeTenantList.forEach((t: any) => {
      const key = `${t.building}_${t.room}`;
      const total = (t.prevBillOwner || 0) + (t.curBillOwner || 0) + (t.prevBillHM || 0) + (t.curBillHM || 0) + (t.lateFeeAmount || 0);
      if (total > 0) newBalances[key] = total;
    });
    try { localStorage.setItem("hm_roomBalances", JSON.stringify(newBalances)); } catch {}

    // ── 적용 ──
    setAllBuildings(newBuildings);
    setBuildingData(newBD);
    setActiveTenants(activeTenantList);
    setActiveVacancies(vacancies);

    // 퇴실정보 localStorage 저장
    if (pastTenants.length > 0) {
      try { localStorage.setItem("hm_pastTenants_override", JSON.stringify(pastTenants)); } catch {}
    }
    // 관리정보 localStorage 저장
    if (Object.keys(roomData).length > 0) {
      try { localStorage.setItem("hm_roomMasterData_override", JSON.stringify(roomData)); } catch {}
    }

    setLedgerResult(result);
    setUploadMsg(`통합관리대장 업로드 완료! 건물 ${result.buildings}개, 임차인 ${activeTenantList.length}명, 공실 ${result.vacancies}개, 퇴실 ${result.pastTenants}건`);
  };

  const handleLedgerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMsg(""); setLedgerResult(null);
    try {
      const wb = await readLedger(file);
      const sheetNames = wb.SheetNames;
      const found = ["■입주정보", "◆건물정보", "관리건물_목록", "■퇴실정보", "◆관리정보"].filter(s => sheetNames.includes(s));
      if (found.length < 2) {
        setUploadMsg("통합관리대장 파일이 아닌 것 같습니다. 시트를 확인해주세요.");
        return;
      }
      if (window.confirm(`통합관리대장 파일을 인식했습니다.\n\n발견된 시트: ${found.join(", ")}\n\n기존 데이터가 모두 교체됩니다. 진행하시겠습니까?`)) {
        await applyLedger(wb);
      }
    } catch (err: any) {
      setUploadMsg("파일 읽기 실패: " + err.message);
    }
    e.target.value = "";
  };

  // ======== 건물정보 업로드 ========
  const buildingColumns: ColumnDef[] = [
    { key: "name", label: "건물명", required: true },
    { key: "owner", label: "건물주" },
    { key: "ownerPhone", label: "건물주 연락처" },
    { key: "address", label: "주소" },
    { key: "account", label: "정산계좌" },
    { key: "start", label: "관리시작일" },
    { key: "type", label: "건물유형", note: "단기/일반임대/근생/관리사무소대행" },
    { key: "mgmtType", label: "관리비유형", note: "변동관리비/고정관리비" },
    { key: "feeType", label: "수수료유형", note: "pct/fixed" },
    { key: "fee", label: "수수료율(또는 고정금액)" },
    { key: "parkingTotal", label: "총 주차대수" },
    { key: "visitCycle", label: "순회주기", note: "월1회/월2회/월4회" },
    { key: "penaltyOwner", label: "위약금 귀속", note: "하우스맨/건물주" },
    { key: "floors", label: "층별 호실", note: "예: B:B01,B02|1층:101,102|2층:201,202" },
  ];

  const applyBuilding = (rows: Record<string, any>[]) => {
    const newBuildings: Building[] = [];
    const newBD: Record<string, any> = { ...buildingData };
    const newFloors: Record<string, any> = {};

    rows.forEach(r => {
      const name = String(r.name || r["건물명"] || "").trim();
      if (!name) return;

      // allBuildings 항목
      const feeType = (r.feeType || r["수수료유형"] || "pct").trim();
      const fee = parseFloat(r.fee || r["수수료율(또는 고정금액)"] || 0) || 0;
      const type = (r.type || r["건물유형"] || "단기").trim();

      // floors 파싱: "B:B01,B02|1층:101,102"
      const floorsStr = String(r.floors || r["층별 호실"] || "");
      const floors: Record<string, string[]> = {};
      if (floorsStr) {
        floorsStr.split("|").forEach((seg: string) => {
          const [floorName, roomsStr] = seg.split(":");
          if (floorName && roomsStr) {
            floors[floorName.trim()] = roomsStr.split(",").map((s: string) => s.trim()).filter(Boolean);
          }
        });
      }

      const roomCount = Object.values(floors).flat().length;

      newBuildings.push({
        name,
        rooms: roomCount,
        occupied: 0,
        type: type as any,
        feeType: feeType as any,
        fee: feeType === "pct" ? fee : 0,
        fixedFee: feeType === "fixed" ? fee : 0,
        special: null,
        parkingTotal: parseInt(r.parkingTotal || r["총 주차대수"] || 0) || 0,
      });

      // buildingData 확장 정보
      newBD[name] = {
        ...(newBD[name] || {}),
        address: (r.address || r["주소"] || "").trim(),
        owner: (r.owner || r["건물주"] || "").trim(),
        ownerPhone: (r.ownerPhone || r["건물주 연락처"] || "").trim(),
        account: (r.account || r["정산계좌"] || "").trim(),
        start: (r.start || r["관리시작일"] || "").trim(),
        mgmtType: (r.mgmtType || r["관리비유형"] || "변동관리비").trim(),
        visitCycle: (r.visitCycle || r["순회주기"] || "월1회").trim(),
        penaltyOwner: (r.penaltyOwner || r["위약금 귀속"] || "하우스맨").trim(),
        floors,
      };

      newFloors[name] = {
        owner: newBD[name].owner,
        phone: newBD[name].ownerPhone,
        fee,
        account: newBD[name].account,
        start: newBD[name].start,
        address: newBD[name].address,
        floors,
      };
    });

    // buildingFloors는 정적 파일이라 localStorage의 buildingData에 floors를 저장
    setAllBuildings(newBuildings);
    setBuildingData(newBD);

    // buildingFloors를 localStorage에 저장 (동적 오버라이드)
    try {
      localStorage.setItem("hm_buildingFloors_override", JSON.stringify(newFloors));
    } catch (e) { console.warn(e); }

    setUploadMsg(`건물 ${newBuildings.length}개 업로드 완료`);
  };

  // ======== 호실정보 업로드 ========
  const roomColumns: ColumnDef[] = [
    { key: "buildingRoom", label: "건물_호실", required: true, note: "예: 스타빌_101" },
    { key: "roomType", label: "호실유형", note: "원룸/투룸/쓰리룸/근생/사무실" },
    { key: "area", label: "면적(㎡)" },
    { key: "deposit", label: "보증금" },
    { key: "rent", label: "월세" },
    { key: "mgmt", label: "관리비" },
    { key: "water", label: "수도" },
    { key: "internet", label: "인터넷" },
    { key: "cleanFee", label: "퇴실청소비" },
    { key: "commFee", label: "중개수수료" },
    { key: "elecNo", label: "전기고객번호" },
    { key: "gasNo", label: "가스고객번호" },
  ];

  const applyRoom = (rows: Record<string, any>[]) => {
    const roomData: Record<string, any> = {};
    rows.forEach(r => {
      const key = String(r.buildingRoom || r["건물_호실"] || "").trim();
      if (!key || !key.includes("_")) return;

      roomData[key] = {
        roomType: (r.roomType || r["호실유형"] || "원룸").trim(),
        area: String(r.area || r["면적(㎡)"] || ""),
        deposit: String(r.deposit || r["보증금"] || "0"),
        rent: String(r.rent || r["월세"] || "0"),
        mgmt: String(r.mgmt || r["관리비"] || "0"),
        water: String(r.water || r["수도"] || "0"),
        internet: String(r.internet || r["인터넷"] || "0"),
        cleanFee: String(r.cleanFee || r["퇴실청소비"] || "0"),
        commFee: String(r.commFee || r["중개수수료"] || "0"),
        elecNo: String(r.elecNo || r["전기고객번호"] || ""),
        gasNo: String(r.gasNo || r["가스고객번호"] || ""),
      };
    });

    try {
      localStorage.setItem("hm_roomMasterData_override", JSON.stringify(roomData));
    } catch (e) { console.warn(e); }

    setUploadMsg(`호실 ${Object.keys(roomData).length}개 업로드 완료. 새로고침 후 반영됩니다.`);
  };

  // ======== 임차인정보 업로드 ========
  const tenantColumns: ColumnDef[] = [
    { key: "name", label: "이름", required: true },
    { key: "building", label: "건물", required: true },
    { key: "room", label: "호실", required: true },
    { key: "phone", label: "연락처" },
    { key: "type", label: "유형", note: "단기/일반임대/근생/관리사무소대행" },
    { key: "deposit", label: "보증금" },
    { key: "rent", label: "월세" },
    { key: "mgmt", label: "관리비" },
    { key: "moveIn", label: "입주일", note: "YYYY-MM-DD" },
    { key: "expiry", label: "만기일", note: "YYYY-MM-DD" },
    { key: "due", label: "납부일", note: "예: 3/5" },
    { key: "rentDay", label: "월세일", note: "숫자 (예: 5)" },
    { key: "status", label: "납부상태", note: "정상/연체" },
    { key: "overdue", label: "연체금액" },
    { key: "carNumber", label: "차량번호" },
    { key: "carType", label: "차종" },
  ];

  const applyTenant = (rows: Record<string, any>[]) => {
    let maxId = activeTenants.reduce((m, t) => Math.max(m, t.id || 0), 0);
    const newTenants = rows.map(r => {
      const name = String(r.name || r["이름"] || "").trim();
      const building = String(r.building || r["건물"] || "").trim();
      const room = String(r.room || r["호실"] || "").trim();
      if (!name || !building || !room) return null;

      maxId++;
      const deposit = parseInt(String(r.deposit || r["보증금"] || "0").replace(/,/g, "")) || 0;
      const rent = parseInt(String(r.rent || r["월세"] || "0").replace(/,/g, "")) || 0;
      const mgmt = parseInt(String(r.mgmt || r["관리비"] || "0").replace(/,/g, "")) || 0;
      const overdue = parseInt(String(r.overdue || r["연체금액"] || "0").replace(/,/g, "")) || 0;

      return {
        id: maxId,
        name,
        building,
        room,
        phone: String(r.phone || r["연락처"] || "").trim(),
        type: (r.type || r["유형"] || "단기").trim(),
        deposit,
        rent,
        mgmt,
        moveIn: String(r.moveIn || r["입주일"] || "").trim(),
        expiry: String(r.expiry || r["만기일"] || "").trim(),
        due: String(r.due || r["납부일"] || "").trim(),
        rentDay: parseInt(r.rentDay || r["월세일"] || 0) || undefined,
        status: (r.status || r["납부상태"] || "정상").trim(),
        overdue,
        prevUnpaid: 0,
        currentUnpaid: 0,
        overdueDays: 0,
        carNumber: String(r.carNumber || r["차량번호"] || "").trim() || undefined,
        carType: String(r.carType || r["차종"] || "").trim() || undefined,
        moveInPhotos: [],
      };
    }).filter(Boolean) as any[];

    setActiveTenants(newTenants);

    // 공실 자동 업데이트: 임차인이 없는 호실은 공실로 등록
    const occupiedKeys = new Set(newTenants.map((t: any) => `${t.building}_${t.room}`));
    const newVacancies: any[] = [];
    const bd = buildingData || {};
    Object.entries(bd).forEach(([bName, bInfo]: [string, any]) => {
      const floors = bInfo.floors || {};
      Object.values(floors).flat().forEach((room: any) => {
        if (!occupiedKeys.has(`${bName}_${room}`)) {
          // 기존 공실 정보 유지
          const existing = activeVacancies.find(v => v.building === bName && String(v.room) === String(room));
          newVacancies.push(existing || {
            building: bName, room, type: "단기", deposit: 0, rent: 0, nego: 0, mgmt: 0,
            days: 0, status: "공실(입주가능)", commBroker: 0, commEvent: "", pw: "", water: "", cable: "", exitFee: 0
          });
        }
      });
    });
    setActiveVacancies(newVacancies);

    setUploadMsg(`임차인 ${newTenants.length}개 업로드 완료, 공실 ${newVacancies.length}개 자동 생성`);
  };

  // ======== 파일 처리 ========
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMsg("");
    try {
      const rows = await readExcel(file);
      setPreview(rows.slice(0, 10));
    } catch (err: any) {
      setUploadMsg("파일 읽기 실패: " + err.message);
    }
    e.target.value = "";
  };

  const handleApply = () => {
    if (!preview || preview.length === 0) return;
    // 전체 데이터 다시 읽기 (preview는 10개만)
    // 실제로는 전체를 저장해야 하므로 파일을 다시 읽자
    // → preview 대신 fullData를 저장하는 방식으로 변경
    if (tab === "building") applyBuilding(fullDataRef.current);
    else if (tab === "room") applyRoom(fullDataRef.current);
    else applyTenant(fullDataRef.current);
    setPreview(null);
  };

  const fullDataRef = useRef<Record<string, any>[]>([]);

  const handleFileReal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMsg("");
    try {
      const rows = await readExcel(file);
      fullDataRef.current = rows;
      setPreview(rows.slice(0, 10));
    } catch (err: any) {
      setUploadMsg("파일 읽기 실패: " + err.message);
    }
    e.target.value = "";
  };

  // ======== 템플릿 다운로드 ========
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    if (tab === "building") {
      const headers = buildingColumns.map(c => c.label);
      const example = [["스타빌", "홍길동", "010-1234-5678", "서울시 관악구...", "하나 123-456", "2020-01-01", "단기", "변동관리비", "pct", "0.05", "5", "월1회", "하우스맨", "1층:101,102|2층:201,202"]];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...example]);
      XLSX.utils.book_append_sheet(wb, ws, "건물정보");
    } else if (tab === "room") {
      const headers = roomColumns.map(c => c.label);
      const example = [["스타빌_101", "원룸", "19.8", "650,000", "650,000", "80,000", "10,000", "20,000", "120,000", "100,000", "03-1234-5678", "2024-00123"]];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...example]);
      XLSX.utils.book_append_sheet(wb, ws, "호실정보");
    } else {
      const headers = tenantColumns.map(c => c.label);
      const example = [["홍길동", "스타빌", "101", "010-1234-5678", "단기", "650000", "650000", "80000", "2025-01-01", "2025-07-01", "3/5", "5", "정상", "0", "", ""]];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...example]);
      XLSX.utils.book_append_sheet(wb, ws, "임차인정보");
    }

    XLSX.writeFile(wb, `하우스맨_${tab === "building" ? "건물" : tab === "room" ? "호실" : "임차인"}_템플릿.xlsx`);
  };

  // ======== 현재 데이터 내보내기 ========
  const exportCurrent = () => {
    const wb = XLSX.utils.book_new();

    if (tab === "building") {
      const rows = allBuildings.map(b => {
        const bd = buildingData[b.name] || {};
        const floors = bd.floors || {};
        const floorsStr = Object.entries(floors).map(([f, rooms]: [string, any]) => `${f}:${rooms.join(",")}`).join("|");
        return {
          "건물명": b.name,
          "건물주": bd.owner || "",
          "건물주 연락처": bd.ownerPhone || "",
          "주소": bd.address || "",
          "정산계좌": bd.account || "",
          "관리시작일": bd.start || "",
          "건물유형": b.type || "단기",
          "관리비유형": bd.mgmtType || "변동관리비",
          "수수료유형": b.feeType || "pct",
          "수수료율(또는 고정금액)": b.feeType === "fixed" ? b.fixedFee : b.fee,
          "총 주차대수": b.parkingTotal || 0,
          "순회주기": bd.visitCycle || "월1회",
          "위약금 귀속": bd.penaltyOwner || "하우스맨",
          "층별 호실": floorsStr,
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "건물정보");
    } else if (tab === "room") {
      // roomMasterData from localStorage or static
      let rmData: Record<string, any> = {};
      try {
        const override = localStorage.getItem("hm_roomMasterData_override");
        if (override) rmData = JSON.parse(override);
      } catch { /* */ }
      // Merge with imported roomMasterData if empty
      if (Object.keys(rmData).length === 0) {
        // Read from the module — but we can't import dynamically here
        // Just export what we have
      }
      const rows = Object.entries(rmData).map(([key, r]: [string, any]) => ({
        "건물_호실": key,
        "호실유형": r.roomType || "",
        "면적(㎡)": r.area || "",
        "보증금": r.deposit || "",
        "월세": r.rent || "",
        "관리비": r.mgmt || "",
        "수도": r.water || "",
        "인터넷": r.internet || "",
        "퇴실청소비": r.cleanFee || "",
        "중개수수료": r.commFee || "",
        "전기고객번호": r.elecNo || "",
        "가스고객번호": r.gasNo || "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "호실정보");
    } else {
      const rows = activeTenants.map(t => ({
        "이름": t.name,
        "건물": t.building,
        "호실": t.room,
        "연락처": t.phone || "",
        "유형": t.type || "단기",
        "보증금": t.deposit || 0,
        "월세": t.rent || 0,
        "관리비": t.mgmt || 0,
        "입주일": t.moveIn || "",
        "만기일": t.expiry || "",
        "납부일": t.due || "",
        "월세일": (t as any).rentDay || "",
        "납부상태": t.status || "정상",
        "연체금액": t.overdue || 0,
        "차량번호": t.carNumber || "",
        "차종": t.carType || "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "임차인정보");
    }

    XLSX.writeFile(wb, `하우스맨_${tab === "building" ? "건물" : tab === "room" ? "호실" : "임차인"}_현재데이터.xlsx`);
  };

  const columns = tab === "building" ? buildingColumns : tab === "room" ? roomColumns : tenantColumns;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-hm-text mb-1">데이터 업로드</h2>
        <p className="text-xs text-hm-text-muted">엑셀 파일로 건물/호실/임차인 데이터를 일괄 등록합니다</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setPreview(null); setUploadMsg(""); }}
            className={`px-5 py-2.5 rounded-t-lg border-none font-inherit text-sm cursor-pointer transition-colors duration-150 ${
              tab === t.id
                ? 'bg-white text-hm-blue-dark font-bold border-b-2 border-hm-blue-dark'
                : 'bg-hm-bg text-gray-500 font-medium hover:bg-gray-200'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══ 통합관리대장 탭 ═══ */}
      {tab === "ledger" && (
        <>
          <div className="bg-white rounded-xl border border-hm-border p-5 mb-4">
            <h3 className="text-base font-bold mb-2">📊 통합관리대장 일괄 업로드</h3>
            <p className="text-sm text-hm-text-sub leading-[1.7] mb-4">
              통합관리대장 엑셀 파일(.xlsx)을 그대로 올리면 모든 데이터가 자동으로 들어갑니다.
            </p>
            <div className="bg-hm-bg-slate rounded-lg p-4 mb-4">
              <div className="text-xs font-bold mb-2">자동 인식하는 시트:</div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { name: "■입주정보", desc: "→ 임차인 + 공실", color: "var(--color-hm-blue)" },
                  { name: "◆건물정보", desc: "→ 건물 상세", color: "#10B981" },
                  { name: "관리건물_목록", desc: "→ 건물 목록", color: "#8B5CF6" },
                  { name: "■퇴실정보", desc: "→ 퇴실 기록", color: "#F59E0B" },
                  { name: "◆관리정보", desc: "→ 호실 관리", color: "#EC4899" },
                ].map(si => (
                  <div key={si.name} className="px-3 py-1.5 rounded-lg bg-white text-xs" style={{ border: `1px solid ${si.color}30` }}>
                    <span className="font-bold" style={{ color: si.color }}>{si.name}</span>
                    <span className="text-hm-text-muted ml-1">{si.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <input type="file" ref={fileRef} accept=".xlsx,.xls" onChange={handleLedgerFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="px-7 py-3 rounded-lg border-none text-base font-bold cursor-pointer font-inherit bg-hm-blue-dark text-white hover:bg-blue-700 transition-colors duration-150">
              📂 통합관리대장 파일 선택
            </button>
            {uploadMsg && (
              <div className={`mt-3 px-4 py-3 rounded-lg text-sm font-semibold ${
                uploadMsg.includes("실패") ? 'bg-hm-danger-bg text-hm-danger' : 'bg-[#F0FDF4] text-[#16A34A]'
              }`}>
                {uploadMsg}
              </div>
            )}
          </div>
          {ledgerResult && (
            <div className="bg-white rounded-xl border border-hm-border p-5 mb-4">
              <h3 className="text-sm font-bold mb-3">업로드 결과</h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                {[
                  { label: "건물", count: ledgerResult.buildings, icon: "🏢" },
                  { label: "임차인", count: ledgerResult.tenants, icon: "👤" },
                  { label: "공실", count: ledgerResult.vacancies, icon: "📭" },
                  { label: "퇴실 기록", count: ledgerResult.pastTenants, icon: "📦" },
                  { label: "호실 관리", count: ledgerResult.rooms, icon: "🚪" },
                ].map(item => (
                  <div key={item.label} className="p-4 rounded-lg bg-hm-bg-slate text-center">
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className="text-xl font-bold text-hm-text">{item.count}</div>
                    <div className="text-xs text-hm-text-muted">{item.label}</div>
                  </div>
                ))}
              </div>
              {ledgerResult.errors.length > 0 && (
                <div className="mt-3 p-3 bg-hm-danger-bg rounded-lg text-xs text-hm-danger">
                  {ledgerResult.errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}
            </div>
          )}
          <div className="bg-white rounded-xl p-5 mb-4 bg-[#FFFBEB] border border-[#FDE68A]">
            <h3 className="text-sm font-bold text-[#92400E] mb-2">⚠ 주의사항</h3>
            <ul className="text-xs text-[#78350F] leading-[1.8] pl-5 m-0">
              <li>업로드하면 <strong>기존 데이터가 모두 교체</strong>됩니다</li>
              <li>통합관리대장 엑셀 파일을 <strong>그대로</strong> 올려주세요 (수정 불필요)</li>
              <li>입주자 이름이 "퇴실"인 호실은 자동으로 공실에 등록됩니다</li>
              <li>□퇴실정산서, □재계약일정 시트는 자동으로 건너뜁니다</li>
            </ul>
          </div>
        </>
      )}

      {/* ═══ 개별 업로드 탭 ═══ */}
      {tab !== "ledger" && <>
      {/* 필드 설명 */}
      <div className="bg-white rounded-xl border border-hm-border p-5 mb-4">
        <h3 className="text-sm font-bold mb-3">
          {tab === "building" ? "건물정보" : tab === "room" ? "호실정보" : "임차인정보"} 필드 설명
        </h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2">
          {columns.map(c => (
            <div key={c.key} className="px-3 py-2 rounded-lg bg-hm-bg-slate border border-hm-border">
              <span className="text-xs font-bold text-hm-text">{c.label}</span>
              {c.required && <span className="text-red-500 ml-1 text-xs">필수</span>}
              {c.note && <div className="text-xs text-hm-text-muted mt-0.5">{c.note}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="bg-white rounded-xl border border-hm-border p-5 mb-4 flex gap-3 items-center flex-wrap">
        <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleFileReal} className="hidden" />
        <button onClick={() => fileRef.current?.click()}
          className="px-4 py-2 rounded-lg border-none text-sm font-bold cursor-pointer font-inherit bg-hm-blue-dark text-white hover:bg-blue-700 transition-colors duration-150">
          📂 엑셀 파일 선택
        </button>
        <button onClick={downloadTemplate}
          className="px-4 py-2 rounded-lg text-sm font-bold cursor-pointer font-inherit bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] hover:bg-green-100 transition-colors duration-150">
          📥 빈 템플릿 다운로드
        </button>
        <button onClick={exportCurrent}
          className="px-4 py-2 rounded-lg text-sm font-bold cursor-pointer font-inherit bg-hm-blue-bg text-hm-blue-dark border border-[#BFDBFE] hover:bg-blue-100 transition-colors duration-150">
          📤 현재 데이터 내보내기
        </button>
        {uploadMsg && (
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
            uploadMsg.includes("실패") ? 'text-hm-danger bg-hm-danger-bg' : 'text-[#16A34A] bg-[#F0FDF4]'
          }`}>
            {uploadMsg}
          </span>
        )}
      </div>

      {/* 미리보기 */}
      {preview && preview.length > 0 && (
        <div className="bg-white rounded-xl border border-hm-border p-5 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold">미리보기 (최대 10행)</h3>
            <div className="flex gap-2">
              <button onClick={() => { setPreview(null); fullDataRef.current = []; }}
                className="px-4 py-2 rounded-lg border-none text-sm font-bold cursor-pointer font-inherit bg-hm-bg text-gray-500 hover:bg-gray-200 transition-colors duration-150">
                취소
              </button>
              <button onClick={handleApply}
                className="px-4 py-2 rounded-lg border-none text-sm font-bold cursor-pointer font-inherit bg-hm-danger text-white hover:bg-red-700 transition-colors duration-150">
                ⚠ 적용 ({fullDataRef.current.length}건 덮어쓰기)
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {Object.keys(preview[0]).map(k => (
                    <th key={k} className="px-2.5 py-2 bg-hm-bg-slate border-b-2 border-hm-border text-left font-bold whitespace-nowrap">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}>
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-2.5 py-1.5 border-b border-[#F0F1F3] whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                        {String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-hm-text-muted">
            전체 {fullDataRef.current.length}건 중 10건 표시
          </div>
        </div>
      )}

      {/* 주의사항 */}
      <div className="bg-[#FFFBEB] rounded-xl border border-[#FDE68A] p-5 mb-4">
        <h3 className="text-sm font-bold text-[#92400E] mb-2">⚠ 주의사항</h3>
        <ul className="text-xs text-[#78350F] leading-[1.8] pl-5 m-0">
          <li>업로드하면 해당 카테고리의 <strong>기존 데이터가 모두 교체</strong>됩니다</li>
          <li>반드시 <strong>현재 데이터를 먼저 내보내기</strong>한 후 업로드하세요</li>
          <li>엑셀 헤더는 한글 또는 영문 키 모두 인식합니다</li>
          <li>건물정보를 먼저 올리고, 그 다음 호실정보, 마지막에 임차인정보 순서로 업로드하세요</li>
          <li>금액 필드에 콤마(,)가 있어도 자동으로 처리됩니다</li>
        </ul>
      </div>

      </>}

      {/* 전체 초기화 */}
      <div className="bg-hm-danger-bg rounded-xl border border-hm-danger-border p-5 mb-4">
        <h3 className="text-sm font-bold text-[#991B1B] mb-2">🗑️ 데이터 초기화</h3>
        <p className="text-xs text-[#7F1D1D] mb-3">localStorage의 모든 데이터를 삭제하고 기본 더미 데이터로 되돌립니다.</p>
        <button onClick={() => {
          if (window.confirm("정말 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
            localStorage.clear();
            window.location.reload();
          }
        }} className="px-4 py-2 rounded-lg border-none text-sm font-bold cursor-pointer font-inherit bg-hm-danger text-white hover:bg-red-700 transition-colors duration-150">
          전체 초기화 (localStorage 삭제)
        </button>
      </div>
    </div>
  );
}
