// App.jsx에서 추출한 초기 청구/입금 데이터

export interface DefaultBillingItem {
  id: number;
  date: string;
  building: string;
  room: string;
  name: string;
  items: {
    rent: number;
    mgmt: number;
    elec: number;
    gas: number;
    water: number;
    cable: number;
    prevUnpaid: number;
    lateFee: number;
    asRepair: number;
  };
  total: number;
}

export interface DefaultTransaction {
  id: number;
  date: string;
  type: string;
  building: string;
  room: string;
  name: string;
  amount: number;
  method: string;
  note: string;
}

export const defaultBillingHistory: DefaultBillingItem[] = [
  { id: 1, date: "2025-06-21", building: "제이앤제이", room: "301", name: "차민철", items: { rent: 1650000, mgmt: 120000, elec: 15520, gas: 12340, water: 25000, cable: 25000, prevUnpaid: 0, lateFee: 0, asRepair: 0 }, total: 1847860 },
  { id: 2, date: "2025-07-21", building: "제이앤제이", room: "301", name: "차민철", items: { rent: 1650000, mgmt: 120000, elec: 18930, gas: 8760, water: 25000, cable: 25000, prevUnpaid: 0, lateFee: 0, asRepair: 0 }, total: 1847690 },
  { id: 3, date: "2025-08-21", building: "제이앤제이", room: "301", name: "차민철", items: { rent: 1650000, mgmt: 120000, elec: 42820, gas: 5410, water: 25000, cable: 25000, prevUnpaid: 0, lateFee: 0, asRepair: 0 }, total: 1868230 },
  { id: 4, date: "2025-09-21", building: "제이앤제이", room: "301", name: "차민철", items: { rent: 1650000, mgmt: 120000, elec: 38650, gas: 7230, water: 25000, cable: 25000, prevUnpaid: 0, lateFee: 0, asRepair: 0 }, total: 1865880 },
  { id: 5, date: "2025-10-21", building: "제이앤제이", room: "301", name: "차민철", items: { rent: 1650000, mgmt: 120000, elec: 24280, gas: 15890, water: 25000, cable: 25000, prevUnpaid: 0, lateFee: 0, asRepair: 0 }, total: 1860170 },
  { id: 6, date: "2025-11-21", building: "제이앤제이", room: "301", name: "차민철", items: { rent: 1650000, mgmt: 120000, elec: 19740, gas: 38840, water: 25000, cable: 25000, prevUnpaid: 0, lateFee: 0, asRepair: 0 }, total: 1878580 },
  { id: 7, date: "2025-12-21", building: "제이앤제이", room: "301", name: "차민철", items: { rent: 1650000, mgmt: 120000, elec: 16890, gas: 95630, water: 25000, cable: 25000, prevUnpaid: 0, lateFee: 0, asRepair: 0 }, total: 1932520 },
  { id: 8, date: "2026-01-21", building: "제이앤제이", room: "301", name: "차민철", items: { rent: 1650000, mgmt: 120000, elec: 15520, gas: 247280, water: 25000, cable: 25000, prevUnpaid: 0, lateFee: 0, asRepair: 82500 }, total: 2165300 },
  { id: 9, date: "2026-02-21", building: "제이앤제이", room: "301", name: "차민철", items: { rent: 1650000, mgmt: 120000, elec: 21350, gas: 198450, water: 25000, cable: 25000, prevUnpaid: 0, lateFee: 0, asRepair: 0 }, total: 2039800 },
  { id: 10, date: "2026-03-21", building: "제이앤제이", room: "301", name: "차민철", items: { rent: 1650000, mgmt: 120000, elec: 15520, gas: 142670, water: 25000, cable: 25000, prevUnpaid: 0, lateFee: 0, asRepair: 0 }, total: 1978190 },
];

export const defaultTransactions: DefaultTransaction[] = [
  { id: 1, date: "2026-02-20", type: "입금", building: "스타빌", room: "403", name: "송예준", amount: 300000, method: "계좌이체", note: "분납" },
  { id: 2, date: "2026-02-21", type: "입금", building: "스타빌", room: "102", name: "주여울", amount: 730000, method: "계좌이체", note: "" },
  { id: 3, date: "2026-02-22", type: "입금", building: "아페이론", room: "101", name: "한유진", amount: 1280000, method: "계좌이체", note: "" },
  { id: 4, date: "2026-02-23", type: "입금", building: "스타빌", room: "201", name: "이지현", amount: 710000, method: "계좌이체", note: "" },
  { id: 5, date: "2026-02-24", type: "입금", building: "아페이론", room: "102", name: "신현식", amount: 1350000, method: "계좌이체", note: "" },
  { id: 6, date: "2026-02-25", type: "입금", building: "제이앤제이", room: "201", name: "박정미", amount: 1400000, method: "계좌이체", note: "" },
  { id: 7, date: "2026-02-25", type: "입금", building: "스타빌", room: "301", name: "박성윤", amount: 780000, method: "계좌이체", note: "" },
  { id: 8, date: "2026-02-26", type: "입금", building: "아페이론", room: "104", name: "김도경", amount: 1400000, method: "계좌이체", note: "" },
  { id: 9, date: "2026-02-26", type: "입금", building: "스타빌", room: "303", name: "김세아", amount: 780000, method: "계좌이체", note: "" },
  { id: 10, date: "2026-02-27", type: "입금", building: "제이앤제이", room: "301", name: "차민철", amount: 1770000, method: "계좌이체", note: "" },
  { id: 11, date: "2026-02-27", type: "입금", building: "스타빌", room: "402", name: "김혜서", amount: 830000, method: "계좌이체", note: "" },
  { id: 12, date: "2026-02-28", type: "입금", building: "아페이론", room: "105", name: "김태오", amount: 1330000, method: "계좌이체", note: "" },
  { id: 13, date: "2026-02-28", type: "입금", building: "스타빌", room: "103", name: "정은혜", amount: 680000, method: "계좌이체", note: "" },
  { id: 14, date: "2026-03-01", type: "입금", building: "제이앤제이", room: "401", name: "박유하", amount: 2100000, method: "계좌이체", note: "" },
  { id: 15, date: "2026-03-01", type: "입금", building: "스타빌", room: "205", name: "김소희", amount: 780000, method: "계좌이체", note: "" },
  { id: 16, date: "2026-03-02", type: "입금", building: "아페이론", room: "201", name: "박유빈", amount: 1280000, method: "계좌이체", note: "" },
  { id: 17, date: "2026-03-02", type: "입금", building: "스타빌", room: "302", name: "홍윤미", amount: 710000, method: "계좌이체", note: "" },
  { id: 18, date: "2026-03-03", type: "입금", building: "아페이론", room: "204", name: "권영우", amount: 1300000, method: "계좌이체", note: "" },
  { id: 19, date: "2026-03-03", type: "입금", building: "스타빌", room: "401", name: "박유림", amount: 780000, method: "계좌이체", note: "" },
  { id: 20, date: "2026-03-04", type: "입금", building: "스타빌", room: "105", name: "황현호", amount: 730000, method: "계좌이체", note: "" },
  { id: 21, date: "2026-03-04", type: "입금", building: "아페이론", room: "103", name: "김지은", amount: 500000, method: "계좌이체", note: "" },
  { id: 22, date: "2026-03-05", type: "입금", building: "스타빌", room: "405", name: "고영희", amount: 780000, method: "계좌이체", note: "" },
  { id: 23, date: "2026-03-05", type: "입금", building: "아페이론", room: "205", name: "정현민", amount: 1280000, method: "계좌이체", note: "" },
  { id: 24, date: "2026-03-06", type: "입금", building: "제이앤제이", room: "B01", name: "윤슬기", amount: 720000, method: "계좌이체", note: "" },
  { id: 25, date: "2026-03-06", type: "입금", building: "스타빌", room: "202", name: "이지람", amount: 400000, method: "계좌이체", note: "분납" },
  { id: 26, date: "2026-03-07", type: "입금", building: "스타빌", room: "203", name: "김성호", amount: 780000, method: "계좌이체", note: "" },
  { id: 27, date: "2026-03-10", type: "입금", building: "아페이론", room: "203", name: "이준우", amount: 700000, method: "계좌이체", note: "분납" },
  { id: 28, date: "2026-03-12", type: "입금", building: "스타빌", room: "305", name: "박현진", amount: 500000, method: "계좌이체", note: "분납" },
  { id: 29, date: "2026-03-14", type: "입금", building: "스타빌", room: "403", name: "송예준", amount: 400000, method: "계좌이체", note: "분납" },
  { id: 30, date: "2026-03-15", type: "입금", building: "아페이론", room: "101", name: "한유진", amount: 1280000, method: "계좌이체", note: "3월분" },
];
