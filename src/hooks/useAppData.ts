import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Building, Tenant, Vacancy, CalendarEvent, Staff } from '@/types';
import type { AppData } from '@/types/appContext';
import {
  buildings as staticBuildings,
  tenants,
  calendarEvents as initialCalendarEvents,
  pastTenants as staticPastTenants,
  vacancies as staticVacancies,
  buildingFloors,
  defaultSettlementExpenses,
} from '@/data';
import { roomTypeVerRef, getRoomType } from '@/config/roomType';
import { initialStaffMembers } from '@/config/staff';
import { getStaffBuildings } from '@/utils/helpers';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

// ── localStorage helpers (from App.jsx lines 48-62) ──

const APP_DATA_KEY = 'appData';

const loadAppData = (): Record<string, any> => {
  try {
    const v = localStorage.getItem(APP_DATA_KEY);
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
};

const saveAppData = (data: Record<string, any>) => {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(APP_DATA_KEY, json);
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn('localStorage 용량 초과 — 저장 실패', e);
    }
  }
};

const _appCache = loadAppData();

const loadLS = <T>(key: string, fallback: T): T => {
  try {
    return _appCache[key] !== undefined ? _appCache[key] : fallback;
  } catch {
    return fallback;
  }
};

const saveLS = (key: string, value: any) => {
  try {
    _appCache[key] = value;
    saveAppData(_appCache);
  } catch {
    /* ignore */
  }
};

// ── Hook ──

export function useAppData(): Omit<AppData, 'navigateTo'> {
  const loggedInId = useAuthStore((s) => s.loggedInId);
  const role = useAuthStore((s) => s.role);
  const bumpRoomTypeVer = useUiStore((s) => s.bumpRoomTypeVer);

  // Connect roomTypeVerRef to Zustand
  roomTypeVerRef.current = bumpRoomTypeVer;

  // ── Domain state (17 useState, from App.jsx lines 80-159) ──

  const defaultBalances = () => {
    const init: Record<string, number> = {};
    tenants.forEach((t) => {
      const key = `${t.building}_${t.room}`;
      init[key] = t.overdue > 0 ? t.overdue : 0;
    });
    return init;
  };

  const [roomBalances, setRoomBalances] = useState<Record<string, number>>(() =>
    loadLS('hm_roomBalances', defaultBalances()),
  );
  const [billingHistory, setBillingHistory] = useState<any[]>(() =>
    loadLS('hm_billingHistory', [
      {
        id: 1,
        date: '2025-06-21',
        building: '제이앤제이',
        room: '301',
        name: '차민철',
        items: {
          rent: 1650000,
          mgmt: 120000,
          elec: 15520,
          gas: 12340,
          water: 25000,
          cable: 25000,
          prevUnpaid: 0,
          lateFee: 0,
          asRepair: 0,
        },
        total: 1847860,
      },
      {
        id: 2,
        date: '2025-07-21',
        building: '제이앤제이',
        room: '301',
        name: '차민철',
        items: {
          rent: 1650000,
          mgmt: 120000,
          elec: 18930,
          gas: 8760,
          water: 25000,
          cable: 25000,
          prevUnpaid: 0,
          lateFee: 0,
          asRepair: 0,
        },
        total: 1847690,
      },
      {
        id: 3,
        date: '2025-08-21',
        building: '제이앤제이',
        room: '301',
        name: '차민철',
        items: {
          rent: 1650000,
          mgmt: 120000,
          elec: 42820,
          gas: 5410,
          water: 25000,
          cable: 25000,
          prevUnpaid: 0,
          lateFee: 0,
          asRepair: 0,
        },
        total: 1868230,
      },
      {
        id: 4,
        date: '2025-09-21',
        building: '제이앤제이',
        room: '301',
        name: '차민철',
        items: {
          rent: 1650000,
          mgmt: 120000,
          elec: 38650,
          gas: 7230,
          water: 25000,
          cable: 25000,
          prevUnpaid: 0,
          lateFee: 0,
          asRepair: 0,
        },
        total: 1865880,
      },
      {
        id: 5,
        date: '2025-10-21',
        building: '제이앤제이',
        room: '301',
        name: '차민철',
        items: {
          rent: 1650000,
          mgmt: 120000,
          elec: 24280,
          gas: 15890,
          water: 25000,
          cable: 25000,
          prevUnpaid: 0,
          lateFee: 0,
          asRepair: 0,
        },
        total: 1860170,
      },
      {
        id: 6,
        date: '2025-11-21',
        building: '제이앤제이',
        room: '301',
        name: '차민철',
        items: {
          rent: 1650000,
          mgmt: 120000,
          elec: 19740,
          gas: 38840,
          water: 25000,
          cable: 25000,
          prevUnpaid: 0,
          lateFee: 0,
          asRepair: 0,
        },
        total: 1878580,
      },
      {
        id: 7,
        date: '2025-12-21',
        building: '제이앤제이',
        room: '301',
        name: '차민철',
        items: {
          rent: 1650000,
          mgmt: 120000,
          elec: 16890,
          gas: 95630,
          water: 25000,
          cable: 25000,
          prevUnpaid: 0,
          lateFee: 0,
          asRepair: 0,
        },
        total: 1932520,
      },
      {
        id: 8,
        date: '2026-01-21',
        building: '제이앤제이',
        room: '301',
        name: '차민철',
        items: {
          rent: 1650000,
          mgmt: 120000,
          elec: 15520,
          gas: 247280,
          water: 25000,
          cable: 25000,
          prevUnpaid: 0,
          lateFee: 0,
          asRepair: 82500,
        },
        total: 2165300,
      },
      {
        id: 9,
        date: '2026-02-21',
        building: '제이앤제이',
        room: '301',
        name: '차민철',
        items: {
          rent: 1650000,
          mgmt: 120000,
          elec: 21350,
          gas: 198450,
          water: 25000,
          cable: 25000,
          prevUnpaid: 0,
          lateFee: 0,
          asRepair: 0,
        },
        total: 2039800,
      },
      {
        id: 10,
        date: '2026-03-21',
        building: '제이앤제이',
        room: '301',
        name: '차민철',
        items: {
          rent: 1650000,
          mgmt: 120000,
          elec: 15520,
          gas: 142670,
          water: 25000,
          cable: 25000,
          prevUnpaid: 0,
          lateFee: 0,
          asRepair: 0,
        },
        total: 1978190,
      },
    ]),
  );
  const [transactions, setTransactions] = useState<any[]>(() =>
    loadLS('hm_transactions', [
      { id: 1, date: '2026-02-20', type: '입금', building: '스타빌', room: '403', name: '송예준', amount: 300000, method: '계좌이체', note: '분납' },
      { id: 2, date: '2026-02-21', type: '입금', building: '스타빌', room: '102', name: '주여울', amount: 730000, method: '계좌이체', note: '' },
      { id: 3, date: '2026-02-22', type: '입금', building: '아페이론', room: '101', name: '한유진', amount: 1280000, method: '계좌이체', note: '' },
      { id: 4, date: '2026-02-23', type: '입금', building: '스타빌', room: '201', name: '이지현', amount: 710000, method: '계좌이체', note: '' },
      { id: 5, date: '2026-02-24', type: '입금', building: '아페이론', room: '102', name: '신현식', amount: 1350000, method: '계좌이체', note: '' },
      { id: 6, date: '2026-02-25', type: '입금', building: '제이앤제이', room: '201', name: '박정미', amount: 1400000, method: '계좌이체', note: '' },
      { id: 7, date: '2026-02-25', type: '입금', building: '스타빌', room: '301', name: '박성윤', amount: 780000, method: '계좌이체', note: '' },
      { id: 8, date: '2026-02-26', type: '입금', building: '아페이론', room: '104', name: '김도경', amount: 1400000, method: '계좌이체', note: '' },
      { id: 9, date: '2026-02-26', type: '입금', building: '스타빌', room: '303', name: '김세아', amount: 780000, method: '계좌이체', note: '' },
      { id: 10, date: '2026-02-27', type: '입금', building: '제이앤제이', room: '301', name: '차민철', amount: 1770000, method: '계좌이체', note: '' },
      { id: 11, date: '2026-02-27', type: '입금', building: '스타빌', room: '402', name: '김혜서', amount: 830000, method: '계좌이체', note: '' },
      { id: 12, date: '2026-02-28', type: '입금', building: '아페이론', room: '105', name: '김태오', amount: 1330000, method: '계좌이체', note: '' },
      { id: 13, date: '2026-02-28', type: '입금', building: '스타빌', room: '103', name: '정은혜', amount: 680000, method: '계좌이체', note: '' },
      { id: 14, date: '2026-03-01', type: '입금', building: '제이앤제이', room: '401', name: '박유하', amount: 2100000, method: '계좌이체', note: '' },
      { id: 15, date: '2026-03-01', type: '입금', building: '스타빌', room: '205', name: '김소희', amount: 780000, method: '계좌이체', note: '' },
      { id: 16, date: '2026-03-02', type: '입금', building: '아페이론', room: '201', name: '박유빈', amount: 1280000, method: '계좌이체', note: '' },
      { id: 17, date: '2026-03-02', type: '입금', building: '스타빌', room: '302', name: '홍윤미', amount: 710000, method: '계좌이체', note: '' },
      { id: 18, date: '2026-03-03', type: '입금', building: '아페이론', room: '204', name: '권영우', amount: 1300000, method: '계좌이체', note: '' },
      { id: 19, date: '2026-03-03', type: '입금', building: '스타빌', room: '401', name: '박유림', amount: 780000, method: '계좌이체', note: '' },
      { id: 20, date: '2026-03-04', type: '입금', building: '스타빌', room: '105', name: '황현호', amount: 730000, method: '계좌이체', note: '' },
      { id: 21, date: '2026-03-04', type: '입금', building: '아페이론', room: '103', name: '김지은', amount: 500000, method: '계좌이체', note: '분납' },
      { id: 22, date: '2026-03-05', type: '입금', building: '스타빌', room: '405', name: '고영희', amount: 780000, method: '계좌이체', note: '' },
      { id: 23, date: '2026-03-05', type: '입금', building: '아페이론', room: '205', name: '정현민', amount: 1280000, method: '계좌이체', note: '' },
      { id: 24, date: '2026-03-06', type: '입금', building: '제이앤제이', room: 'B01', name: '윤슬기', amount: 720000, method: '계좌이체', note: '' },
      { id: 25, date: '2026-03-06', type: '입금', building: '스타빌', room: '202', name: '이지람', amount: 400000, method: '계좌이체', note: '분납' },
      { id: 26, date: '2026-03-07', type: '입금', building: '스타빌', room: '203', name: '김성호', amount: 780000, method: '계좌이체', note: '' },
      { id: 27, date: '2026-03-10', type: '입금', building: '아페이론', room: '203', name: '이준우', amount: 700000, method: '계좌이체', note: '분납' },
      { id: 28, date: '2026-03-12', type: '입금', building: '스타빌', room: '305', name: '박현진', amount: 500000, method: '계좌이체', note: '분납' },
      { id: 29, date: '2026-03-14', type: '입금', building: '스타빌', room: '403', name: '송예준', amount: 400000, method: '계좌이체', note: '분납' },
      { id: 30, date: '2026-03-15', type: '입금', building: '아페이론', room: '101', name: '한유진', amount: 1280000, method: '계좌이체', note: '3월분' },
    ]),
  );
  const [billingConfirmed, setBillingConfirmed] = useState<Record<string, any>>(() =>
    loadLS('hm_billingConfirmed', {}),
  );
  const [billingSent, setBillingSent] = useState<Record<string, any>>(() =>
    loadLS('hm_billingSent', {}),
  );
  const [parkingInfo, setParkingInfo] = useState<Record<string, any>>(() =>
    loadLS('hm_parkingInfo', {}),
  );
  const [calendarEvts, setCalendarEvts] = useState<CalendarEvent[]>(() =>
    loadLS('hm_calendarEvts', initialCalendarEvents),
  );
  const [buildingAccounts, setBuildingAccounts] = useState<Record<string, any>>(() =>
    loadLS('hm_buildingAccounts', {}),
  );
  const [customBuildings, setCustomBuildings] = useState<any[]>(() =>
    loadLS('hm_customBuildings', []),
  );
  const [allBuildings, setAllBuildings] = useState<Building[]>(() =>
    loadLS('hm_allBuildings', [...staticBuildings]),
  );
  const [buildingData, setBuildingData] = useState<Record<string, any>>(() =>
    loadLS('hm_buildingData', {}),
  );
  const [lateFeeOverrides, setLateFeeOverrides] = useState<Record<string, any>>(() =>
    loadLS('hm_lateFeeOverrides', {}),
  );
  const [activeTenants, setActiveTenants] = useState<Tenant[]>(() => {
    const saved = loadLS('hm_activeTenants', [...tenants]);
    const staticMap: Record<string, string> = {};
    tenants.forEach((t) => {
      staticMap[`${t.building}_${t.room}`] = t.type;
    });
    return saved.map((t: any) => {
      const correctType = staticMap[`${t.building}_${t.room}`];
      if (correctType && correctType !== t.type) return { ...t, type: correctType };
      return t;
    });
  });
  const [pastTenantsData, setPastTenantsData] = useState<Record<string, any>>(() =>
    loadLS('hm_pastTenantsData', { ...staticPastTenants }),
  );
  const [activeVacancies, setActiveVacancies] = useState<Vacancy[]>(() =>
    loadLS('hm_activeVacancies', [...staticVacancies]),
  );
  const [settlementExpenses, setSettlementExpenses] = useState<any[]>(() =>
    loadLS('hm_settlementExpenses', defaultSettlementExpenses),
  );
  const [cashbookEntries, setCashbookEntries] = useState<any[]>(() =>
    loadLS('hm_cashbookEntries', []),
  );

  // ── localStorage sync (17 effects, from App.jsx lines 162-178) ──

  useEffect(() => { saveLS('hm_roomBalances', roomBalances); }, [roomBalances]);
  useEffect(() => { saveLS('hm_billingHistory', billingHistory); }, [billingHistory]);
  useEffect(() => { saveLS('hm_transactions', transactions); }, [transactions]);
  useEffect(() => { saveLS('hm_billingConfirmed', billingConfirmed); }, [billingConfirmed]);
  useEffect(() => { saveLS('hm_billingSent', billingSent); }, [billingSent]);
  useEffect(() => { saveLS('hm_parkingInfo', parkingInfo); }, [parkingInfo]);
  useEffect(() => { saveLS('hm_calendarEvts', calendarEvts); }, [calendarEvts]);
  useEffect(() => { saveLS('hm_buildingAccounts', buildingAccounts); }, [buildingAccounts]);
  useEffect(() => { saveLS('hm_customBuildings', customBuildings); }, [customBuildings]);
  useEffect(() => { saveLS('hm_allBuildings', allBuildings); }, [allBuildings]);
  useEffect(() => { saveLS('hm_buildingData', buildingData); }, [buildingData]);
  useEffect(() => { saveLS('hm_activeTenants', activeTenants); }, [activeTenants]);
  useEffect(() => { saveLS('hm_lateFeeOverrides', lateFeeOverrides); }, [lateFeeOverrides]);
  useEffect(() => { saveLS('hm_pastTenantsData', pastTenantsData); }, [pastTenantsData]);
  useEffect(() => { saveLS('hm_activeVacancies', activeVacancies); }, [activeVacancies]);
  useEffect(() => { saveLS('hm_settlementExpenses', settlementExpenses); }, [settlementExpenses]);
  useEffect(() => { saveLS('hm_cashbookEntries', cashbookEntries); }, [cashbookEntries]);

  // ── Migration effects (from App.jsx lines 180-331) ──

  // Migration: moveIn field
  useEffect(() => {
    const moveInMap: Record<number, string> = {};
    tenants.forEach((t) => { if (t.moveIn) moveInMap[t.id] = t.moveIn; });
    const needsPatch = activeTenants.some((t: any) => t.moveIn === undefined);
    if (needsPatch) {
      setActiveTenants((prev) =>
        prev.map((t: any) => (t.moveIn === undefined ? { ...t, moveIn: moveInMap[t.id] || '' } : t)),
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Migration: pastTenants merge
  useEffect(() => {
    const sampleKeys = ['스타빌_301', '제이앤제이_B01', 'W하우스_301', '포유빌_창고', '미래홈_관리'];
    const missing = sampleKeys.filter((k) => !pastTenantsData[k] && (staticPastTenants as any)[k]);
    if (missing.length > 0) {
      setPastTenantsData((prev) => {
        const next = { ...prev };
        missing.forEach((k) => { next[k] = (staticPastTenants as any)[k]; });
        return next;
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Migration: buildingFloors missing buildings
  useEffect(() => {
    const existingNames = new Set(allBuildings.map((b) => b.name));
    const missing = Object.keys(buildingFloors).filter((name) => !existingNames.has(name));
    if (missing.length > 0) {
      const newBuildings = missing.map((name) => {
        const bf = (buildingFloors as any)[name];
        const rooms = bf.floors ? Object.values(bf.floors).flat().length : 0;
        return {
          name,
          rooms,
          occupied: 0,
          type: '단기' as const,
          feeType: 'pct' as const,
          fee: bf.fee || 0,
          fixedFee: 0,
          special: null,
          parkingTotal: 0,
        };
      });
      setAllBuildings((prev) => [...prev, ...newBuildings]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Migration: remove hidden tenants + dedup vacancies + auto-register missing rooms
  useEffect(() => {
    const cleanedTenants = activeTenants.filter((t) => t.name !== '미노출');
    if (cleanedTenants.length !== activeTenants.length) setActiveTenants(cleanedTenants);

    const seen = new Set<string>();
    const deduped = activeVacancies.filter((v) => {
      const key = `${v.building}_${v.room}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const missingVacancies: Vacancy[] = [];
    Object.entries(buildingFloors).forEach(([bName, bData]) => {
      const floors = (bData as any).floors || {};
      Object.values(floors)
        .flat()
        .forEach((room: any) => {
          const hasTenant = cleanedTenants.some(
            (t) => t.building === bName && String(t.room) === String(room),
          );
          const hasVacancy = deduped.some(
            (v) => v.building === bName && String(v.room) === String(room),
          );
          if (!hasTenant && !hasVacancy) {
            missingVacancies.push({
              building: bName,
              room,
              type: '일반임대',
              deposit: 0,
              rent: 0,
              nego: 0,
              mgmt: 0,
              days: 0,
              status: '점검/청소중',
              commBroker: 0,
              commEvent: '',
              pw: '',
              water: '',
              cable: '',
              exitFee: 0,
            });
          }
        });
    });

    const finalVacancies = [...deduped, ...missingVacancies];
    if (finalVacancies.length !== activeVacancies.length || missingVacancies.length > 0) {
      setActiveVacancies(finalVacancies);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Migration: buildingData defaults (address, visitCycle, managers, contractMsg)
  useEffect(() => {
    const patch: Record<string, any> = {};
    const allNames = [
      ...Object.keys(buildingFloors),
      ...customBuildings.map((b: any) => b.name),
    ];
    allNames.forEach((name) => {
      const bd = buildingData[name] || {};
      let needPatch = false;
      const p = { ...bd };

      if (!bd.address) {
        const bf = (buildingFloors as any)[name];
        const regForm = (allBuildings.find((b) => b.name === name) as any)?._regForm;
        const addr = bf?.address || regForm?.address || '';
        if (addr) {
          p.address = addr;
          needPatch = true;
        }
      }

      if (!bd.visitCycle) {
        p.visitCycle = '월1회';
        needPatch = true;
      }

      if (!bd.managers) {
        p.managers = { internal: '', external: '', collection: '', contract: '', general: '' };
        needPatch = true;
      }

      if (!bd.contractMsg && name === '제이앤제이') {
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
      setBuildingData((prev) => ({ ...prev, ...patch }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ephemeral state ──

  const [pendingContract, setPendingContract] = useState<any>(null);
  const [pendingMoveout, setPendingMoveout] = useState<any>(null);

  // ── Helper functions (from App.jsx lines 334-354) ──

  const addBilling = useCallback(
    (building: string, room: string, name: string, items: any, total: number) => {
      const key = `${building}_${room}`;
      setRoomBalances((prev) => ({ ...prev, [key]: (prev[key] || 0) + total }));
      setBillingHistory((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          date: new Date().toISOString().slice(0, 10),
          building,
          room,
          name,
          items,
          total,
        },
      ]);
    },
    [],
  );

  const addCashbookEntry = useCallback((entry: any) => {
    setCashbookEntries((prev) => {
      if (entry.sourceId && prev.some((e: any) => e.sourceId === entry.sourceId)) return prev;
      return [
        ...prev,
        {
          id: Date.now() + Math.random(),
          status: '대기',
          sentAt: null,
          direction: '출금',
          ...entry,
        },
      ];
    });
  }, []);

  const addDeposit = useCallback(
    (building: string, room: string, name: string, amount: number, method: string, note: string) => {
      const key = `${building}_${room}`;
      setRoomBalances((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - amount) }));
      setTransactions((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          date: new Date().toISOString().slice(0, 10),
          type: '입금',
          building,
          room,
          name,
          amount,
          method,
          note,
        },
      ]);
    },
    [],
  );

  // ── Derived values ──

  const currentStaff = useMemo<Staff | null>(
    () => initialStaffMembers.find((s) => s.id === loggedInId) || null,
    [loggedInId],
  );
  const isGeneral = currentStaff?.roles.includes('general') ?? false;
  const myBuildings = useMemo(
    () => (isGeneral ? allBuildings.map((b) => b.name) : getStaffBuildings(currentStaff)),
    [isGeneral, allBuildings, currentStaff],
  );

  const menuBadges = useMemo(() => {
    const badges: Record<string, number> = {};
    const pendingCalendar = (calendarEvts || []).filter((ev) => {
      if (!ev.building || !ev.room) return false;
      return ev.type === '계약' || ev.type === '퇴실';
    }).length;
    if (pendingCalendar > 0) badges['calendar'] = pendingCalendar;

    const now = new Date();
    const renewalTypes = new Set(['일반임대', '근생']);
    const renewalCount = (activeTenants || []).filter((t: any) => {
      if (!t.expiry || !t.name || t.name === '퇴실') return false;
      const rt =
        t.type ||
        buildingData[t.building]?.rooms?.[t.room]?.type ||
        getRoomType(t.building, t.room) ||
        allBuildings.find((b) => b.name === t.building)?.type ||
        '단기';
      if (!renewalTypes.has(rt)) return false;
      const exp = new Date(t.expiry);
      if (isNaN(exp.getTime())) return false;
      let diff = Math.floor((exp.getTime() - now.getTime()) / 86400000);
      if (diff < 0) {
        const thisYear = now.getFullYear();
        let next = new Date(thisYear, exp.getMonth(), exp.getDate());
        if (next < now) next = new Date(thisYear + 1, exp.getMonth(), exp.getDate());
        diff = Math.ceil((next.getTime() - now.getTime()) / 86400000);
      }
      return diff <= 90;
    }).length;
    if (renewalCount > 0) badges['renewal'] = renewalCount;

    return badges;
  }, [calendarEvts, activeTenants, buildingData, allBuildings]);

  return {
    roomBalances, setRoomBalances,
    billingHistory, setBillingHistory,
    transactions, setTransactions,
    billingConfirmed, setBillingConfirmed,
    billingSent, setBillingSent,
    parkingInfo, setParkingInfo,
    calendarEvts, setCalendarEvts,
    buildingAccounts, setBuildingAccounts,
    customBuildings, setCustomBuildings,
    allBuildings, setAllBuildings,
    buildingData, setBuildingData,
    lateFeeOverrides, setLateFeeOverrides,
    activeTenants, setActiveTenants,
    pastTenantsData, setPastTenantsData,
    activeVacancies, setActiveVacancies,
    settlementExpenses, setSettlementExpenses,
    cashbookEntries, setCashbookEntries,
    pendingContract, setPendingContract,
    pendingMoveout, setPendingMoveout,
    myBuildings, currentStaff, isGeneral, menuBadges, loggedInId,
    addBilling, addCashbookEntry, addDeposit,
  };
}
