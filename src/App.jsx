import React, { useState, useEffect, Suspense } from "react";

// Data
import { buildings as staticBuildings, tenants, calendarEvents as initialCalendarEvents, pastTenants as staticPastTenants, vacancies as staticVacancies, buildingFloors, defaultSettlementExpenses } from './data';

// Config
import { roomTypeVerRef } from './config/roomType';
import { viewModes, menuSections, menuItems } from './config/navigation';
import { staffRoles, initialStaffMembers } from './config/staff';

// Utils
import { useIsMobile } from './utils/useIsMobile';
import { getStaffBuildings } from './utils/helpers';

// Pages — DashboardPage eager (initial route), rest lazy
import { DashboardPage } from './pages/DashboardPage';

const BuildingDetailPage = React.lazy(() => import('./pages/BuildingDetailPage').then(m => ({ default: m.BuildingDetailPage })));
const BuildingsPage = React.lazy(() => import('./pages/BuildingsPage').then(m => ({ default: m.BuildingsPage })));
const TenantsPage = React.lazy(() => import('./pages/TenantsPage').then(m => ({ default: m.TenantsPage })));
const VacancyPage = React.lazy(() => import('./pages/VacancyPage').then(m => ({ default: m.VacancyPage })));
const StaffPage = React.lazy(() => import('./pages/StaffPage').then(m => ({ default: m.StaffPage })));
const CollectionPage = React.lazy(() => import('./pages/CollectionPage').then(m => ({ default: m.CollectionPage })));
const ASPage = React.lazy(() => import('./pages/ASPage').then(m => ({ default: m.ASPage })));
const PatrolPage = React.lazy(() => import('./pages/PatrolPage').then(m => ({ default: m.PatrolPage })));
const UtilityBillingPage = React.lazy(() => import('./pages/UtilityBillingPage').then(m => ({ default: m.UtilityBillingPage })));
const TransactionPage = React.lazy(() => import('./pages/TransactionPage').then(m => ({ default: m.TransactionPage })));
const ParkingPage = React.lazy(() => import('./pages/ParkingPage').then(m => ({ default: m.ParkingPage })));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const HomepagePage = React.lazy(() => import('./pages/HomepagePage').then(m => ({ default: m.HomepagePage })));
const OwnerDashboard = React.lazy(() => import('./pages/OwnerDashboard').then(m => ({ default: m.OwnerDashboard })));
const SettlementPage = React.lazy(() => import('./pages/SettlementPage').then(m => ({ default: m.SettlementPage })));
const PastTenantsPage = React.lazy(() => import('./pages/PastTenantsPage').then(m => ({ default: m.PastTenantsPage })));

// localStorage 헬퍼 — 키 이름: appData (단일 객체로 통합)
const APP_DATA_KEY = "appData";
const loadAppData = () => { try { const v = localStorage.getItem(APP_DATA_KEY); return v ? JSON.parse(v) : {}; } catch { return {}; } };
const saveAppData = (data) => {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(APP_DATA_KEY, json);
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.code === 22) {
      console.warn("localStorage 용량 초과 — 저장 실패", e);
    }
  }
};
const _appCache = loadAppData();
const loadLS = (key, fallback) => { try { return _appCache[key] !== undefined ? _appCache[key] : fallback; } catch { return fallback; } };
const saveLS = (key, value) => { try { _appCache[key] = value; saveAppData(_appCache); } catch { /* ignore */ } };

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [role, setRole] = useState("admin");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [time, setTime] = useState(new Date());
  const [loggedInId, setLoggedInId] = useState(null);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const [roomTypeVer, setRoomTypeVer] = useState(0);
  roomTypeVerRef.current = setRoomTypeVer;
  const isMobile = useIsMobile();
  const [showMobileMore, setShowMobileMore] = useState(false);

  // ======== 공유 재무 state (localStorage 영속) ========
  const defaultBalances = () => {
    const init = {};
    tenants.forEach(t => {
      const key = `${t.building}_${t.room}`;
      init[key] = t.overdue > 0 ? t.overdue : 0;
    });
    return init;
  };
  const [roomBalances, setRoomBalances] = useState(() => loadLS("hm_roomBalances", defaultBalances()));
  const [billingHistory, setBillingHistory] = useState(() => loadLS("hm_billingHistory", []));
  const [transactions, setTransactions] = useState(() => loadLS("hm_transactions", [
    { id: 1, date: "2026-02-20", type: "입금", building: "스타빌", room: "403", name: "송예준", amount: 300000, method: "계좌이체", note: "분납" },
    { id: 2, date: "2026-02-21", type: "입금", building: "W하우스", room: "503", name: "김현우", amount: 300000, method: "계좌이체", note: "분납" },
    { id: 3, date: "2026-02-22", type: "입금", building: "모던라이프", room: "501", name: "이보람", amount: 1000000, method: "계좌이체", note: "" },
  ]));
  const [billingConfirmed, setBillingConfirmed] = useState(() => loadLS("hm_billingConfirmed", {}));
  const [billingSent, setBillingSent] = useState(() => loadLS("hm_billingSent", {}));
  const [parkingInfo, setParkingInfo] = useState(() => loadLS("hm_parkingInfo", {}));
  const [calendarEvts, setCalendarEvts] = useState(() => loadLS("hm_calendarEvts", initialCalendarEvents));
  const [buildingAccounts, setBuildingAccounts] = useState(() => loadLS("hm_buildingAccounts", {}));
  const [customBuildings, setCustomBuildings] = useState(() => loadLS("hm_customBuildings", []));
  const [allBuildings, setAllBuildings] = useState(() => loadLS("hm_allBuildings", [...staticBuildings]));
  const [buildingData, setBuildingData] = useState(() => loadLS("hm_buildingData", {}));
  const [pendingContract, setPendingContract] = useState(null);
  const [pendingMoveout, setPendingMoveout] = useState(null);
  const [activeTenants, setActiveTenants] = useState(() => loadLS("hm_activeTenants", [...tenants]));
  const [pastTenantsData, setPastTenantsData] = useState(() => loadLS("hm_pastTenantsData", { ...staticPastTenants }));
  const [activeVacancies, setActiveVacancies] = useState(() => loadLS("hm_activeVacancies", [...staticVacancies]));
  const [settlementExpenses, setSettlementExpenses] = useState(() => loadLS("hm_settlementExpenses", defaultSettlementExpenses));

  // localStorage 자동 저장
  useEffect(() => { saveLS("hm_roomBalances", roomBalances); }, [roomBalances]);
  useEffect(() => { saveLS("hm_billingHistory", billingHistory); }, [billingHistory]);
  useEffect(() => { saveLS("hm_transactions", transactions); }, [transactions]);
  useEffect(() => { saveLS("hm_billingConfirmed", billingConfirmed); }, [billingConfirmed]);
  useEffect(() => { saveLS("hm_billingSent", billingSent); }, [billingSent]);
  useEffect(() => { saveLS("hm_parkingInfo", parkingInfo); }, [parkingInfo]);
  useEffect(() => { saveLS("hm_calendarEvts", calendarEvts); }, [calendarEvts]);
  useEffect(() => { saveLS("hm_buildingAccounts", buildingAccounts); }, [buildingAccounts]);
  useEffect(() => { saveLS("hm_customBuildings", customBuildings); }, [customBuildings]);
  useEffect(() => { saveLS("hm_allBuildings", allBuildings); }, [allBuildings]);
  useEffect(() => { saveLS("hm_buildingData", buildingData); }, [buildingData]);
  useEffect(() => { saveLS("hm_activeTenants", activeTenants); }, [activeTenants]);
  useEffect(() => { saveLS("hm_pastTenantsData", pastTenantsData); }, [pastTenantsData]);
  useEffect(() => { saveLS("hm_activeVacancies", activeVacancies); }, [activeVacancies]);
  useEffect(() => { saveLS("hm_settlementExpenses", settlementExpenses); }, [settlementExpenses]);

  // 마이그레이션: 기존 localStorage 임차인 데이터에 moveIn 필드가 없으면 정적 데이터에서 병합
  useEffect(() => {
    const moveInMap = {};
    tenants.forEach(t => { if (t.moveIn) moveInMap[t.id] = t.moveIn; });
    const needsPatch = activeTenants.some(t => t.moveIn === undefined);
    if (needsPatch) {
      setActiveTenants(prev => prev.map(t =>
        t.moveIn === undefined ? { ...t, moveIn: moveInMap[t.id] || "" } : t
      ));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 마이그레이션: 가상 퇴실정산 데이터 병합 (정적 데이터에 있으나 localStorage에 없는 키)
  useEffect(() => {
    const sampleKeys = ["스타빌_301","제이앤제이_B01","W하우스_301","포유빌_창고","미래홈_관리"];
    const missing = sampleKeys.filter(k => !pastTenantsData[k] && staticPastTenants[k]);
    if (missing.length > 0) {
      setPastTenantsData(prev => {
        const next = { ...prev };
        missing.forEach(k => { next[k] = staticPastTenants[k]; });
        return next;
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 마이그레이션: 미노출 임차인 제거 + 공실 중복 제거 + 누락 호실 자동 공실 등록
  useEffect(() => {
    // 1) 미노출 임차인 제거
    const cleanedTenants = activeTenants.filter(t => t.name !== "미노출");
    if (cleanedTenants.length !== activeTenants.length) setActiveTenants(cleanedTenants);

    // 2) 공실 중복 제거 (같은 건물+호실이 2개 이상이면 첫 번째만 유지)
    const seen = new Set();
    const deduped = activeVacancies.filter(v => {
      const key = `${v.building}_${v.room}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 3) 누락 호실 자동 공실 등록
    const missing = [];
    Object.entries(buildingFloors).forEach(([bName, bData]) => {
      const floors = bData.floors || {};
      Object.values(floors).flat().forEach(room => {
        const hasTenant = cleanedTenants.some(t => t.building === bName && String(t.room) === String(room));
        const hasVacancy = deduped.some(v => v.building === bName && String(v.room) === String(room));
        if (!hasTenant && !hasVacancy) {
          missing.push({ building: bName, room, type: "일반임대", deposit: 0, rent: 0, nego: 0, mgmt: 0, days: 0, status: "점검/청소중", commBroker: 0, commEvent: "", pw: "", water: "", cable: "", exitFee: 0 });
        }
      });
    });

    const finalVacancies = [...deduped, ...missing];
    if (finalVacancies.length !== activeVacancies.length || missing.length > 0) {
      setActiveVacancies(finalVacancies);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 앱 시작 시 모든 건물의 기본 데이터(주소, 순회주기, 담당자 등)를 buildingData에 채워넣기
  useEffect(() => {
    const patch = {};
    const allNames = [...Object.keys(buildingFloors), ...customBuildings.map(b => b.name)];
    allNames.forEach(name => {
      const bd = buildingData[name] || {};
      let needPatch = false;
      const p = { ...bd };

      // 주소
      if (!bd.address) {
        const bf = buildingFloors[name];
        const regForm = allBuildings.find(b => b.name === name)?._regForm;
        const addr = bf?.address || regForm?.address || "";
        if (addr) { p.address = addr; needPatch = true; }
      }

      // 순회주기 기본값 (건물·호실정보 기본값과 동일)
      if (!bd.visitCycle) {
        p.visitCycle = "월1회";
        needPatch = true;
      }

      // 담당자 기본값
      if (!bd.managers) {
        p.managers = { internal: "", external: "", collection: "", marketing: "", general: "" };
        needPatch = true;
      }

      // 계약 문자 기본값 — 제이앤제이
      if (!bd.contractMsg && name === "제이앤제이") {
        p.contractMsg = `-법인,외국인,50세이상 계약 불가
-주차불가
-전입 신고 불가
-전기,가스 개인 신청불가
-3인 이상 거주 불가

■계약정보
호수 : 제이앤제이  호
부동산 :
계약기간 :

■입주금 정보
만원(관리비/수도/케이블 선불)
우리 1002-911-220189 박시현

■금액 정보
예치금 만원 / 월세 만원
관리비 만원 / 수도 만원 / 케이블 만원
퇴실청소비 만원


■특약사항은 계약서에 기재되어 있습니다.

■계약서 다운로드 (문서 비밀번호:12345)

1. 단기임대 링크
https://www.houseman.co.kr/pages/board/board.list.php?board_no=12&category_no=9

2. 근생 링크
https://www.houseman.co.kr/pages/board/board.list.php?board_no=12&category_no=8

작성된 계약서와 신분증 사진은 houseman@houseman.co.kr
이메일 전송 부탁드립니다.

※. 입금자 성함 및 중개수수료 계좌 문자로 답장주세요.

계약해주셔서 감사합니다.
www.houseman.co.kr
1544-4150`;
        needPatch = true;
      }

      if (needPatch) patch[name] = p;
    });
    if (Object.keys(patch).length > 0) {
      setBuildingData(prev => ({ ...prev, ...patch }));
    }
  }, []);

  // 청구 추가 함수
  const addBilling = (building, room, name, items, total) => {
    const key = `${building}_${room}`;
    setRoomBalances(prev => ({ ...prev, [key]: (prev[key] || 0) + total }));
    setBillingHistory(prev => [...prev, { id: prev.length + 1, date: new Date().toISOString().slice(0, 10), building, room, name, items, total }]);
  };

  // 입금 처리 함수
  const addDeposit = (building, room, name, amount, method, note) => {
    const key = `${building}_${room}`;
    setRoomBalances(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - amount) }));
    setTransactions(prev => [...prev, { id: prev.length + 1, date: new Date().toISOString().slice(0, 10), type: "입금", building, room, name, amount, method, note }]);
  };

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (role === "owner") setPage("dashboard");
    else if (role === "cleaning") setPage("calendar");
    else if (role === "homepage") setPage("homepage");
  }, [role]);

  const handleLogin = () => {
    const staff = initialStaffMembers.find(s => s.phone === loginPhone && s.pw === loginPw);
    if (staff) {
      setLoggedInId(staff.id);
      setLoginError("");
      setLoginPhone("");
      setLoginPw("");
    } else {
      setLoginError("연락처 또는 비밀번호가 일치하지 않습니다");
    }
  };

  const handleLogout = () => {
    setLoggedInId(null);
    setPage("dashboard");
    setRole("admin");
    setSelectedBuilding(null);
  };

  // 로그인 화면
  if (loggedInId === null) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1B1F2E 0%, #2A3352 100%)", fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <style>{`@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
        <div style={{ width: 380, padding: "48px 36px", borderRadius: 20, background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #3B82F6, #2563EB)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 16 }}>🏗️</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1A1D23", letterSpacing: "-0.02em" }}>HOUSEMAN</div>
            <div style={{ fontSize: 12, color: "#8F95A3", marginTop: 4 }}>건물관리 시스템</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 6 }}>연락처 (ID)</div>
            <input value={loginPhone} onChange={e => { setLoginPhone(e.target.value); setLoginError(""); }}
              placeholder="010-0000-0000"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E0E3E9", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#3B82F6"}
              onBlur={e => e.target.style.borderColor = "#E0E3E9"} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 6 }}>비밀번호</div>
            <input type="password" value={loginPw} onChange={e => { setLoginPw(e.target.value); setLoginError(""); }}
              placeholder="비밀번호 입력"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E0E3E9", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#3B82F6"}
              onBlur={e => e.target.style.borderColor = "#E0E3E9"} />
          </div>

          {loginError && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#DC2626" }}>⚠ {loginError}</span>
            </div>
          )}

          <button onClick={handleLogin}
            style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: loginPhone && loginPw ? "linear-gradient(135deg, #3B82F6, #2563EB)" : "#D1D5DB", color: "#fff", fontSize: 15, fontWeight: 800, cursor: loginPhone && loginPw ? "pointer" : "default", fontFamily: "inherit", transition: "all 0.2s" }}>
            로그인
          </button>

          <div style={{ marginTop: 24, padding: "14px 16px", borderRadius: 10, background: "#F8FAFC", border: "1px solid #E8ECF0" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8F95A3", marginBottom: 8 }}>테스트 계정</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11, color: "#5F6577" }}>
              {initialStaffMembers.map(s => (
                <div key={s.id} onClick={() => { setLoginPhone(s.phone); setLoginPw(s.pw); setLoginError(""); }}
                  style={{ padding: "6px 8px", borderRadius: 6, cursor: "pointer", background: "#fff", border: "1px solid #E8ECF0", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                  <span style={{ fontWeight: 700 }}>{s.name}</span>
                  <span style={{ color: "#B0B5C1", marginLeft: 4, fontSize: 9 }}>{s.pw}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentMode = viewModes.find(r => r.id === role) || viewModes[0];
  const currentStaff = initialStaffMembers.find(s => s.id === loggedInId);
  const isGeneral = currentStaff?.roles.includes("general");
  const myBuildings = getStaffBuildings(currentStaff);

  const renderPage = () => {
    if (role === "owner") {
      return <OwnerDashboard activeTenants={activeTenants} activeVacancies={activeVacancies} />;
    }
    if (role === "cleaning") {
      if (page === "patrol") return <PatrolPage myBuildings={myBuildings} buildingData={buildingData} />;
      return <CalendarPage events={calendarEvts} setEvents={setCalendarEvts} currentStaff={currentStaff} activeVacancies={activeVacancies} setActiveVacancies={setActiveVacancies} activeTenants={activeTenants} setActiveTenants={setActiveTenants} pastTenantsData={pastTenantsData} setPage={setPage} setPendingMoveout={setPendingMoveout} buildingData={buildingData} />;
    }
    if (role === "homepage") {
      return <HomepagePage buildingData={buildingData} activeVacancies={activeVacancies} />;
    }
    if (page === "buildings" && selectedBuilding) {
      return <BuildingDetailPage buildingName={selectedBuilding} onBack={() => setSelectedBuilding(null)} buildingAccounts={buildingAccounts} setBuildingAccounts={setBuildingAccounts} customBuildings={customBuildings} allBuildings={allBuildings} setAllBuildings={setAllBuildings} buildingData={buildingData} setBuildingData={setBuildingData} activeTenants={activeTenants} activeVacancies={activeVacancies} pastTenantsData={pastTenantsData} />;
    }
    switch (page) {
      case "dashboard": return <DashboardPage setPage={setPage} role={role} myBuildings={myBuildings} activeTenants={activeTenants} activeVacancies={activeVacancies} calendarEvts={calendarEvts} />;
      case "staff": return <StaffPage />;
      case "buildings": return <BuildingsPage onSelectBuilding={(name) => setSelectedBuilding(name)} myBuildings={myBuildings} customBuildings={customBuildings} setCustomBuildings={setCustomBuildings} allBuildings={allBuildings} setAllBuildings={setAllBuildings} activeTenants={activeTenants} activeVacancies={activeVacancies} />;
      case "tenants": return <TenantsPage myBuildings={myBuildings} parkingInfo={parkingInfo} setParkingInfo={setParkingInfo} pendingContract={pendingContract} setPendingContract={setPendingContract} pendingMoveout={pendingMoveout} setPendingMoveout={setPendingMoveout} buildingAccounts={buildingAccounts} allBuildings={allBuildings} activeTenants={activeTenants} setActiveTenants={setActiveTenants} pastTenantsData={pastTenantsData} setPastTenantsData={setPastTenantsData} activeVacancies={activeVacancies} setActiveVacancies={setActiveVacancies} calendarEvts={calendarEvts} />;
      case "pastTenants": return <PastTenantsPage myBuildings={myBuildings} pastTenantsData={pastTenantsData} activeTenants={activeTenants} />;
      case "contracts": return <VacancyPage myBuildings={myBuildings} calendarEvts={calendarEvts} setCalendarEvts={setCalendarEvts} setPage={setPage} setPendingContract={setPendingContract} activeVacancies={activeVacancies} setActiveVacancies={setActiveVacancies} buildingData={buildingData} activeTenants={activeTenants} setActiveTenants={setActiveTenants} pastTenantsData={pastTenantsData} />;
      case "collection": return <CollectionPage myBuildings={myBuildings} roomBalances={roomBalances} activeTenants={activeTenants} />;
      case "utility": return <UtilityBillingPage myBuildings={myBuildings} activeTenants={activeTenants} addBilling={addBilling} billingConfirmed={billingConfirmed} setBillingConfirmed={setBillingConfirmed} billingSent={billingSent} setBillingSent={setBillingSent} roomBalances={roomBalances} billingHistory={billingHistory} />;
      case "transactions": return <TransactionPage myBuildings={myBuildings} activeTenants={activeTenants} transactions={transactions} addDeposit={addDeposit} roomBalances={roomBalances} />;
      case "parking": return <ParkingPage myBuildings={myBuildings} activeTenants={activeTenants} parkingInfo={parkingInfo} setParkingInfo={setParkingInfo} />;
      case "as": return <ASPage myBuildings={myBuildings} />;
      case "calendar": return <CalendarPage events={calendarEvts} setEvents={setCalendarEvts} currentStaff={currentStaff} activeVacancies={activeVacancies} setActiveVacancies={setActiveVacancies} activeTenants={activeTenants} setActiveTenants={setActiveTenants} pastTenantsData={pastTenantsData} setPastTenantsData={setPastTenantsData} setPage={setPage} setPendingMoveout={setPendingMoveout} buildingData={buildingData} />;
      case "patrol": return <PatrolPage myBuildings={myBuildings} buildingData={buildingData} />;
      case "settlement": return <SettlementPage myBuildings={myBuildings} activeTenants={activeTenants} transactions={transactions} settlementExpenses={settlementExpenses} setSettlementExpenses={setSettlementExpenses} buildingData={buildingData} />;
      default: return <DashboardPage setPage={setPage} role={role} myBuildings={myBuildings} activeTenants={activeTenants} activeVacancies={activeVacancies} calendarEvts={calendarEvts} />;
    }
  };

  // Mobile tab config (subset of menus)
  const mobileTabs = role === "admin" ? [
    { id: "dashboard", icon: "🏠", label: "홈" },
    { id: "tenants", icon: "👤", label: "임차인" },
    { id: "collection", icon: "💰", label: "수금" },
    { id: "as", icon: "🔧", label: "AS" },
    { id: "patrol", icon: "🔍", label: "순회" },
  ] : role === "owner" ? [
    { id: "dashboard", icon: "🏠", label: "현황" },
  ] : role === "cleaning" ? [
    { id: "calendar", icon: "📅", label: "일정" },
    { id: "patrol", icon: "🚶", label: "순회" },
  ] : [{ id: "homepage", icon: "🌐", label: "매물" }];

  // Mobile: more menu items not in tabs
  const mobileMoreItems = role === "admin" ? menuItems.filter(m => !mobileTabs.find(t => t.id === m.id)) : [];

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "100vh", background: "#F3F4F8", fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div style={{ width: sidebarOpen ? 230 : 64, background: "#1B1F2E", display: "flex", flexDirection: "column", transition: "width 0.25s ease", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ padding: sidebarOpen ? "10px 14px" : "14px 12px", borderBottom: "1px solid #2A2F42", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #3B82F6, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🏗️</div>
            {sidebarOpen && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>HOUSEMAN</div>
                  <div style={{ fontSize: 10, color: "#6B7280" }}>{currentStaff ? currentStaff.name : "건물관리 시스템"} · {isGeneral ? "전체 건물" : `${myBuildings.length}개`}</div>
                </div>
                <button onClick={handleLogout}
                  style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #374151", background: "transparent", color: "#9CA3B0", fontSize: 9, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  로그아웃
                </button>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div style={{ padding: "6px 14px", borderBottom: "1px solid #2A2F42" }}>
              <div style={{ display: "flex", gap: 3 }}>
                {[{ id: "admin", icon: "🏗️", label: "관리" }, { id: "owner", icon: "🏠", label: "건물주" }, { id: "cleaning", icon: "🧹", label: "청소" }, { id: "homepage", icon: "🌐", label: "홈페이지" }].map(r => (
                  <button key={r.id} onClick={() => setRole(r.id)}
                    style={{ flex: 1, padding: "5px 2px", borderRadius: 5, border: "none", background: role === r.id ? "#2A3352" : "transparent", color: role === r.id ? "#fff" : "#6B7280", fontSize: 9, fontWeight: role === r.id ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
                    {r.icon}<br />{r.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
            {role === "owner" ? [{ id: "dashboard", icon: "🏠", label: "내 건물 현황" }].map(m => {
              const active = page === m.id;
              return <div key={m.id} onClick={() => { setPage(m.id); setSelectedBuilding(null); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, cursor: "pointer", background: active ? "#2A3352" : "transparent" }}>
                <span style={{ fontSize: 17 }}>{m.icon}</span>
                {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{m.label}</span>}
              </div>;
            }) : role === "cleaning" ? [{ id: "calendar", icon: "📅", label: "계약/퇴실 일정" }, { id: "patrol", icon: "🚶", label: "순회 관리" }].map(m => {
              const active = page === m.id;
              return <div key={m.id} onClick={() => { setPage(m.id); setSelectedBuilding(null); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, cursor: "pointer", background: active ? "#2A3352" : "transparent" }}>
                <span style={{ fontSize: 17 }}>{m.icon}</span>
                {sidebarOpen && <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#fff" : "#9CA3B0" }}>{m.label}</span>}
              </div>;
            }) : role === "homepage" ? [{ id: "homepage", icon: "🌐", label: "공실 매물" }].map(m => (
              <div key={m.id} onClick={() => setPage(m.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, cursor: "pointer", background: "#2A3352" }}>
                <span style={{ fontSize: 17 }}>{m.icon}</span>
                {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{m.label}</span>}
              </div>
            )) : menuSections.map(sec => (
              <div key={sec.section}>
                {sidebarOpen && <div style={{ fontSize: 9, fontWeight: 700, color: "#4B5563", letterSpacing: "0.1em", padding: "12px 12px 4px", textTransform: "uppercase" }}>{sec.section}</div>}
                {!sidebarOpen && <div style={{ borderBottom: "1px solid #2A2F42", margin: "6px 8px" }} />}
                {sec.items.map(m => {
                  const active = page === m.id;
                  return (
                    <div key={m.id} onClick={() => { setPage(m.id); setSelectedBuilding(null); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: sidebarOpen ? "9px 12px" : "9px 8px", borderRadius: 9, marginBottom: 1, cursor: "pointer", background: active ? "#2A3352" : "transparent", transition: "all 0.15s", justifyContent: sidebarOpen ? "flex-start" : "center" }}
                      onMouseEnter={e => !active && (e.currentTarget.style.background = "#22273A")}
                      onMouseLeave={e => !active && (e.currentTarget.style.background = "transparent")}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{m.icon}</span>
                      {sidebarOpen && <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#fff" : "#9CA3B0", whiteSpace: "nowrap" }}>{m.label}</span>}
                      {active && sidebarOpen && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#3B82F6" }} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
          <div style={{ padding: "12px", borderTop: "1px solid #2A2F42" }}>
            <div onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", borderRadius: 8, cursor: "pointer", color: "#6B7280", fontSize: 14, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#22273A"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {sidebarOpen ? "◁ 접기" : "▷"}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Bar */}
        <div style={{ height: isMobile ? 48 : 56, background: "#fff", borderBottom: "1px solid #E8ECF0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 14px" : "0 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
            <span style={{ fontSize: isMobile ? 15 : 17 }}>{role === "owner" ? "🏠" : role === "homepage" ? "🌐" : menuItems.find(m => m.id === page)?.icon}</span>
            <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: "#1A1D23" }}>
              {role === "owner" ? "내 건물 현황" : role === "homepage" ? "공실 매물" : menuItems.find(m => m.id === page)?.label}
              {!isMobile && role !== "owner" && selectedBuilding && <span style={{ color: "#8F95A3", fontWeight: 500 }}> › {selectedBuilding}</span>}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16 }}>
            {!isMobile && currentStaff && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: isGeneral ? "#EFF6FF" : "#FEF3C7", border: `1px solid ${isGeneral ? "#BFDBFE" : "#FDE68A"}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isGeneral ? "#2563EB" : "#92400E" }}>👤 {currentStaff.name}</span>
                {!isGeneral && <span style={{ fontSize: 10, color: "#B45309" }}>({myBuildings.length}건물)</span>}
              </div>
            )}
            <span style={{ fontSize: 12, color: "#8F95A3" }}>
              {time.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })}
            </span>
            <span style={{ fontSize: 12, color: "#8F95A3" }}>
              {time.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <div style={{ position: "relative" }}>
              <span style={{ fontSize: isMobile ? 16 : 18, cursor: "pointer" }}>🔔</span>
              <div style={{ position: "absolute", top: -2, right: -4, width: 14, height: 14, borderRadius: "50%", background: "#EF4444", color: "#fff", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>3</div>
            </div>
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, background: "#F7F8FA", border: "1px solid #E8ECF0" }}>
                <span style={{ fontSize: 14 }}>{currentMode.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: currentMode.color }}>{currentMode.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Staff Filter Banner */}
        {currentStaff && !isGeneral && !isMobile && (
          <div style={{ padding: "8px 24px", background: "linear-gradient(90deg, #FEF3C7, #FFF7ED)", borderBottom: "1px solid #FDE68A", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>📌 {currentStaff.name} · {myBuildings.length}개 건물</span>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {myBuildings.map(b => (
                <span key={b} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: "#fff", color: "#92400E", border: "1px solid #FDE68A" }}>{b}</span>
              ))}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? 12 : 24, paddingBottom: isMobile ? 72 : 24 }}>
          <div key={`${page}-${selectedBuilding || ''}`} style={{ animation: "fadeIn 0.3s ease", maxWidth: 1200 }}>
            <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}><span style={{ fontSize: 14, color: "#8F95A3" }}>로딩 중...</span></div>}>
              {renderPage()}
            </Suspense>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <>
          {showMobileMore && (
            <div onClick={() => setShowMobileMore(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 998 }}>
              <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 60, left: 8, right: 8, background: "#fff", borderRadius: 16, padding: "12px", boxShadow: "0 -4px 20px rgba(0,0,0,0.15)", maxHeight: "60vh", overflowY: "auto" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8F95A3", marginBottom: 8, padding: "0 4px" }}>전체 메뉴</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 4 }}>
                  {menuItems.map(m => (
                    <div key={m.id} onClick={() => { setPage(m.id); setSelectedBuilding(null); setShowMobileMore(false); }}
                      style={{ padding: "10px 4px", borderRadius: 10, background: page === m.id ? "#EFF6FF" : "#F9FAFB", textAlign: "center", cursor: "pointer" }}>
                      <div style={{ fontSize: 20, marginBottom: 2 }}>{m.icon}</div>
                      <div style={{ fontSize: 10, fontWeight: page === m.id ? 700 : 500, color: page === m.id ? "#2563EB" : "#5F6577" }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid #E8ECF0", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#8F95A3" }}>👤 {currentStaff?.name || "—"}</span>
                  <button onClick={() => { handleLogout(); setShowMobileMore(false); }}
                    style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", fontSize: 11, fontWeight: 600, color: "#DC2626", cursor: "pointer", fontFamily: "inherit" }}>로그아웃</button>
                </div>
              </div>
            </div>
          )}
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 56, background: "#fff", borderTop: "1px solid #E8ECF0", display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 999, paddingBottom: "env(safe-area-inset-bottom)" }}>
            {mobileTabs.map(t => {
              const active = page === t.id;
              return (
                <div key={t.id} onClick={() => { setPage(t.id); setSelectedBuilding(null); }}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "6px 0", cursor: "pointer" }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? "#2563EB" : "#8F95A3" }}>{t.label}</span>
                  {active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#2563EB", marginTop: -1 }} />}
                </div>
              );
            })}
            {mobileMoreItems.length > 0 && (
              <div onClick={() => setShowMobileMore(!showMobileMore)}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "6px 0", cursor: "pointer" }}>
                <span style={{ fontSize: 20 }}>⋯</span>
                <span style={{ fontSize: 9, fontWeight: 500, color: "#8F95A3" }}>더보기</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
