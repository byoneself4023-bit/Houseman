/**
 * 필드 유효성 검사 유틸리티
 * 각 함수는 { valid: boolean, message: string } 반환
 */

export interface ValidationResult {
  valid: boolean;
  message: string;
}

export const V = {
  phone: (val: string): ValidationResult => {
    if (!val) return { valid: true, message: "" };
    const cleaned = val.replace(/[\s-]/g, "");
    if (!/^0\d{8,10}$/.test(cleaned)) return { valid: false, message: "전화번호 형식이 맞지 않습니다 (예: 010-1234-5678)" };
    return { valid: true, message: "" };
  },

  residentNumber: (val: string): ValidationResult => {
    if (!val) return { valid: true, message: "" };
    if (!/^\d{6}-?\d$/.test(val.replace(/\s/g, ""))) return { valid: false, message: "주민번호는 앞6자리-뒤1자리 (예: 620101-2)" };
    return { valid: true, message: "" };
  },

  email: (val: string): ValidationResult => {
    if (!val) return { valid: true, message: "" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return { valid: false, message: "이메일 형식이 맞지 않습니다" };
    return { valid: true, message: "" };
  },

  feeRate: (val: string | number): ValidationResult => {
    if (!val && val !== 0) return { valid: true, message: "" };
    const n = parseFloat(String(val));
    if (isNaN(n) || n < 0 || n > 100) return { valid: false, message: "0~100 사이 숫자를 입력하세요" };
    return { valid: true, message: "" };
  },

  date: (val: string): ValidationResult => {
    if (!val) return { valid: true, message: "" };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return { valid: false, message: "날짜 형식: YYYY-MM-DD" };
    const d = new Date(val);
    if (isNaN(d.getTime())) return { valid: false, message: "유효하지 않은 날짜입니다" };
    return { valid: true, message: "" };
  },

  positiveInt: (val: string | number): ValidationResult => {
    if (!val && val !== 0) return { valid: true, message: "" };
    const n = parseInt(String(val));
    if (isNaN(n) || n < 0) return { valid: false, message: "0 이상의 숫자를 입력하세요" };
    return { valid: true, message: "" };
  },

  day: (val: string | number): ValidationResult => {
    if (!val && val !== 0) return { valid: true, message: "" };
    const n = parseInt(String(val));
    if (isNaN(n) || n < 0 || n > 31) return { valid: false, message: "0~31 사이 (0=말일)" };
    return { valid: true, message: "" };
  },

  money: (val: string | number): ValidationResult => {
    if (!val && val !== 0) return { valid: true, message: "" };
    const n = parseInt(String(val).replace(/,/g, ""));
    if (isNaN(n) || n < 0) return { valid: false, message: "0 이상의 금액을 입력하세요" };
    return { valid: true, message: "" };
  },

  required: (val: unknown, label?: string): ValidationResult => {
    if (!val || (typeof val === "string" && !val.trim())) return { valid: false, message: `${label || "이 항목"}은(는) 필수입니다` };
    return { valid: true, message: "" };
  },

  businessNumber: (val: string): ValidationResult => {
    if (!val) return { valid: true, message: "" };
    const cleaned = val.replace(/[\s-]/g, "");
    if (!/^\d{10}$/.test(cleaned)) return { valid: false, message: "사업자등록번호 10자리 (예: 123-45-67890)" };
    return { valid: true, message: "" };
  },

  area: (val: string | number): ValidationResult => {
    if (!val) return { valid: true, message: "" };
    const n = parseFloat(String(val));
    if (isNaN(n) || n <= 0) return { valid: false, message: "양수를 입력하세요" };
    return { valid: true, message: "" };
  },
};

type ValidatorFn = (val: string) => ValidationResult;

export const FIELD_VALIDATORS: Record<string, ValidatorFn> = {
  ownerPhone: V.phone,
  owner2Phone: V.phone,
  owner3Phone: V.phone,
  contactPersonPhone: V.phone,
  siteManagerPhone: V.phone,
  ownerResidentNumber: V.residentNumber,
  owner2ResidentNumber: V.residentNumber,
  owner3ResidentNumber: V.residentNumber,
  ownerEmail: V.email,
  ownerEmail2: V.email,
  owner2Email: V.email,
  owner3Email: V.email,
  contactPersonEmail: V.email,
  siteManagerEmail: V.email,
  managementFeeRate: V.feeRate as ValidatorFn,
  managementFeeFixedAmount: V.money as ValidatorFn,
  freeRepairLimit: V.money as ValidatorFn,
  depositManagementAmount: V.money as ValidatorFn,
  parkingTotalSpaces: V.positiveInt as ValidatorFn,
  cctvCount: V.positiveInt as ValidatorFn,
  monthlyInspectionCount: V.positiveInt as ValidatorFn,
  septicTankCleaningMonth1: V.positiveInt as ValidatorFn,
  septicTankCleaningMonth2: V.positiveInt as ValidatorFn,
  settlementDay1: V.day as ValidatorFn,
  settlementDay2: V.day as ValidatorFn,
  electricReadingDay: V.day as ValidatorFn,
  waterReadingDay: V.day as ValidatorFn,
  rentDueDay: V.day as ValidatorFn,
  mgmtDueDay: V.day as ValidatorFn,
  mgmtBillIssueDay: V.day as ValidatorFn,
  approvedDate: V.date,
  contractStartDate: V.date,
  buildingAreaTotal: V.area as ValidatorFn,
  ownerBusinessRegistrationNumber: V.businessNumber,
};
