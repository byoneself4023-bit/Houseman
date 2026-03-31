/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// transactionEngine.ts — 입출금 자동분류 엔진
//
// 기능:
// 1. 적요 정규화 (은행 부가정보 제거)
// 2. 뱅크다 엑셀 파싱
// 3. 입금 매칭 (4단계: 건물약칭+호실 → 임차인명 → 금액 → 미매칭)
// 4. 출금 분류 (카테고리 + 건물 + 공과금 참고값)
// 5. 모던하우스/모던라이프 구분
// 6. 전기요금 안분
// 7. 일괄 매칭 실행
// ============================================================

import transactionRules from '@/data/transactionRules.json';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 타입 정의
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BankTransaction {
  transactionDate: string;
  accountName: string;
  accountNumber: string;
  memo: string;
  memoNormalized: string;
  deposit: number;
  withdrawal: number;
  balance: number;
  bankMemo: string;
}

export interface AccountMapEntry {
  accountName: string;
  buildingName: string;
}

export interface DepositNameMapRule {
  pattern: string;
  buildingName: string;
  roomExtract?: string;
}

export interface ExcludePatternRule {
  pattern: string;
  action: 'exclude' | 'conditional';
  reason: string;
  confidence?: number;
  conditions?: Array<{
    accountName: string;
    category1: string;
    category2: string;
  }>;
}

export interface MemoCategoryRule {
  pattern: string;
  category1: string;
  category2: string;
  confidence?: number;
  priority?: number;
}

export interface MemoBuildingRule {
  pattern: string;
  buildingName: string;
}

export interface UtilityRefEntry {
  memo: string;
  amount: number;
  buildingName: string;
}

export interface TransactionRules {
  accountMap: AccountMapEntry[];
  depositNameMap: DepositNameMapRule[];
  excludePatterns: ExcludePatternRule[];
  memoCategory: MemoCategoryRule[];
  memoBuilding: MemoBuildingRule[];
  utilityRef: UtilityRefEntry[];
}

export interface DepositMatchResult {
  matched: boolean;
  confidence: number;
  buildingName: string | null;
  roomNumber: string | null;
  tenantName: string | null;
  category1: string;
  category2: string;
  method: string;
  candidates: Array<{
    buildingName: string;
    roomNumber: string | null;
    tenantName?: string;
    totalAmount?: number;
  }> | null;
}

export interface WithdrawalClassifyResult {
  category1: string;
  category2: string;
  buildingName: string | null;
  confidence: number;
  excluded: boolean;
  excludeReason: string | null;
  method: string;
  ownerBillable?: boolean;
}

export interface ElectricSplitEntry {
  buildingName: string;
  amount: number;
  ratio: number;
}

export interface MatchingSummary {
  total: number;
  deposits: number;
  withdrawals: number;
  matched: number;
  unmatched: number;
  excluded: number;
}

export interface MatchingResult {
  results: Array<BankTransaction & Partial<DepositMatchResult> & Partial<WithdrawalClassifyResult>>;
  summary: MatchingSummary;
}

export interface BillingRecord {
  billing_month?: string;
  billingMonth?: string;
  building_name?: string;
  buildingName?: string;
  room_number?: string;
  roomNumber?: string;
  tenant_name?: string;
  tenantName?: string;
  total_amount?: number;
  totalAmount?: number;
  elec_amount?: number;
  elecAmount?: number;
}

export interface TenantRecord {
  name?: string;
  tenant_name?: string;
  buildingName?: string;
  building_name?: string;
  roomNumber?: string;
  room_number?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 내부 상수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 은행/채널 정보를 나타내는 키워드 (마지막 괄호 제거 판단용) */
const BANK_KEYWORDS: string[] = [
  '타행', '이체', '은행', '신한', '국민', '하나', '우리', '농협', '토스', '카카오',
  '체크카드', '자금', '모바일', '인터넷', 'CD', 'FB', 'MB', 'IB', 'PC',
  '자동이체', '한전', '공공요금', '가스요금', '전기요금', '서울시', '금융', '뱅크',
  'OP', '펌뱅킹', '대체', '현금', 'CDATM', '당행', '송금', '타행송금', '당행송금',
  '입금', '지로', '전자금융', '서울역', '역삼역', 'Hana', 'CBS', 'NH',
  'ESC', 'SC', 'CDK', 'K뱅크', '수협', '기업은행', '우리은행', '신한은행',
  '폰신한', 'E기업', 'PC우리', 'NH은행', '오픈'
];

/** 엑셀 시리얼 날짜 기준일 (1899-12-30) */
const EXCEL_EPOCH = new Date(1899, 11, 30);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. 적요 정규화
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 적요에서 은행 부가정보(마지막 괄호)를 제거합니다.
 *
 * 규칙:
 * - 적요 끝에 오는 괄호 중, 은행/채널 키워드가 포함된 것만 제거
 * - 적요 중간의 괄호는 유지 (예: "쿠팡(쿠페이)")
 * - "코원에너지 (가스요금 서울역금융센터)" → "코원에너지"
 * - "쿠팡(쿠페이) (타행이체 신한은행(7623))" → "쿠팡(쿠페이)"
 */
export function normalizeMemo(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '';

  let memo = raw.trim();

  // 마지막 괄호 반복 제거 (중첩된 은행 정보가 있을 수 있음)
  let changed = true;
  while (changed) {
    changed = false;

    // 마지막 괄호 찾기 — 가장 바깥쪽 매칭
    const lastOpen = memo.lastIndexOf('(');
    if (lastOpen < 0) break;

    // 괄호가 닫혀야 함
    const lastClose = memo.lastIndexOf(')');
    if (lastClose <= lastOpen) break;

    // 마지막 괄호가 문자열 끝이어야 함 (뒤에 공백만 허용)
    const afterClose = memo.substring(lastClose + 1).trim();
    if (afterClose.length > 0) break;

    // 괄호 안 내용 추출
    const parenContent = memo.substring(lastOpen + 1, lastClose);

    // 은행/채널 키워드 포함 여부 확인
    const isBankInfo = BANK_KEYWORDS.some(kw =>
      parenContent.includes(kw)
    );

    if (isBankInfo) {
      memo = memo.substring(0, lastOpen).trim();
      changed = true;
    }
  }

  return memo;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. 뱅크다 엑셀 파서
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 엑셀 시리얼 날짜를 YYYY-MM-DD 문자열로 변환합니다.
 */
function excelDateToString(serial: any): string {
  if (typeof serial === 'string') {
    // 이미 문자열이면 그대로 반환 (YYYY-MM-DD 또는 YYYY.MM.DD)
    return serial.replace(/\./g, '-').substring(0, 10);
  }
  const date = new Date(EXCEL_EPOCH.getTime() + serial * 86400000);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 뱅크다 엑셀 워크북을 파싱하여 트랜잭션 배열로 변환합니다.
 *
 * 헤더: ["입금일시","계좌","계좌번호","적요","입금액","출금액","잔액","메모"]
 * - 마지막 행 합계 제거
 * - 중복 체크: 같은 날짜+계좌+금액+적요가 있으면 스킵
 */
export function parseBankdaExcel(workbook: any, xlsxLib: any): BankTransaction[] {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = xlsxLib.utils.sheet_to_json(sheet, { header: 1 });

  if (!rows || rows.length < 2) return [];

  // 헤더 행 찾기 (첫 행이 헤더)
  const header = rows[0];
  const colMap: Record<string, number> = {};
  header.forEach((h: any, i: number) => {
    const name = String(h || '').trim();
    if (name.includes('일시') || name.includes('날짜')) colMap.date = i;
    if (name.includes('계좌') && !name.includes('번호')) colMap.account = i;
    if (name.includes('계좌번호') || name.includes('번호')) colMap.accountNumber = i;
    if (name.includes('적요')) colMap.memo = i;
    if (name.includes('입금')) colMap.deposit = i;
    if (name.includes('출금')) colMap.withdrawal = i;
    if (name.includes('잔액')) colMap.balance = i;
    if (name.includes('메모') || name.includes('비고')) colMap.bankMemo = i;
  });

  // 기본 컬럼 인덱스 (헤더 매칭 실패 시)
  if (colMap.date === undefined) colMap.date = 0;
  if (colMap.account === undefined) colMap.account = 1;
  if (colMap.accountNumber === undefined) colMap.accountNumber = 2;
  if (colMap.memo === undefined) colMap.memo = 3;
  if (colMap.deposit === undefined) colMap.deposit = 4;
  if (colMap.withdrawal === undefined) colMap.withdrawal = 5;
  if (colMap.balance === undefined) colMap.balance = 6;
  if (colMap.bankMemo === undefined) colMap.bankMemo = 7;

  const transactions: BankTransaction[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // 합계 행 제거
    const firstCell = row[0];
    if (typeof firstCell === 'string' && firstCell.includes('총')) continue;
    if (typeof firstCell === 'string' && firstCell.includes('합계')) continue;

    const rawMemo = String(row[colMap.memo] || '');
    const deposit = Number(row[colMap.deposit]) || 0;
    const withdrawal = Number(row[colMap.withdrawal]) || 0;

    // 날짜 변환
    const transactionDate = excelDateToString(row[colMap.date]);
    const accountName = String(row[colMap.account] || '').trim();

    // 중복 체크: 같은 날짜 + 계좌 + 금액 + 적요
    const amount = deposit || withdrawal;
    const dupeKey = `${transactionDate}|${accountName}|${amount}|${rawMemo}`;
    if (seen.has(dupeKey)) continue;
    seen.add(dupeKey);

    transactions.push({
      transactionDate,
      accountName,
      accountNumber: String(row[colMap.accountNumber] || '').trim(),
      memo: rawMemo,
      memoNormalized: normalizeMemo(rawMemo),
      deposit,
      withdrawal,
      balance: Number(row[colMap.balance]) || 0,
      bankMemo: String(row[colMap.bankMemo] || '').trim(),
    });
  }

  return transactions;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. 입금 매칭 (4단계)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 계좌명으로 건물명을 찾습니다.
 */
function getBuildingByAccount(accountName: string, accountMap: AccountMapEntry[]): string | null {
  const found = accountMap.find(a => a.accountName === accountName);
  return found ? found.buildingName : null;
}

/**
 * 입금 트랜잭션을 매칭합니다 (4단계).
 *
 * 1단계: 건물약칭+호실 (depositNameMap) → confidence 100
 * 2단계: 임차인 이름 (한글 2~4자) → confidence 95
 * 3단계: 금액 매칭 (청구금액 비교) → confidence 90 (1건) / 50 (2건+)
 * 4단계: 미매칭
 */
export function matchDeposit(
  bankTx: BankTransaction,
  rules: TransactionRules,
  billingRecords: BillingRecord[] = [],
  tenants: TenantRecord[] = [],
): DepositMatchResult {
  const memo = bankTx.memoNormalized || normalizeMemo(bankTx.memo);
  const accountBuilding = getBuildingByAccount(bankTx.accountName, rules.accountMap);

  // ── 1단계: 건물약칭+호실 매칭 ──
  for (const rule of rules.depositNameMap) {
    const regex = new RegExp(rule.pattern);
    const match = memo.match(regex);
    if (match) {
      let roomNumber: string | null = null;
      if (rule.roomExtract && match[1]) {
        // $1, $2 등 치환
        roomNumber = rule.roomExtract.replace(/\$(\d)/g, (_: string, idx: string) => match[Number(idx)] || '');
      }
      return {
        matched: true,
        confidence: 100,
        buildingName: rule.buildingName,
        roomNumber,
        tenantName: null,
        category1: '임대수입',
        category2: '월세',
        method: 'depositNameMap',
        candidates: null,
      };
    }
  }

  // ── 2단계: 임차인 이름 매칭 ──
  const koreanName = memo.match(/^[가-힣]{2,4}$/)?.[0]
    || memo.match(/([가-힣]{2,4})/)?.[1];

  if (koreanName && tenants.length > 0) {
    // 해당 계좌 건물의 임차인으로 필터
    const candidateTenants = accountBuilding
      ? tenants.filter(t => (t.buildingName || t.building_name) === accountBuilding)
      : tenants;

    const nameMatches = candidateTenants.filter(t =>
      (t.name || t.tenant_name || '') === koreanName
    );

    if (nameMatches.length === 1) {
      const t = nameMatches[0];
      return {
        matched: true,
        confidence: 95,
        buildingName: t.buildingName || t.building_name || accountBuilding,
        roomNumber: t.roomNumber || t.room_number || null,
        tenantName: koreanName,
        category1: '임대수입',
        category2: '월세',
        method: 'tenantName',
        candidates: null,
      };
    }

    if (nameMatches.length > 1) {
      return {
        matched: true,
        confidence: 70,
        buildingName: accountBuilding,
        roomNumber: null,
        tenantName: koreanName,
        category1: '임대수입',
        category2: '월세',
        method: 'tenantName:multiple',
        candidates: nameMatches.map(t => ({
          buildingName: t.buildingName || t.building_name || '',
          roomNumber: t.roomNumber || t.room_number || null,
          tenantName: koreanName,
        })),
      };
    }
  }

  // ── 3단계: 금액 매칭 ──
  if (billingRecords.length > 0 && bankTx.deposit > 0) {
    const txDate = bankTx.transactionDate;
    const txMonth = txDate ? txDate.substring(0, 7) : null;

    // 해당 월, 해당 건물 청구 레코드 필터
    const relevantBills = billingRecords.filter(b => {
      const billMonth = (b.billing_month || b.billingMonth || '').substring(0, 7);
      const billBuilding = b.building_name || b.buildingName;
      const monthMatch = !txMonth || billMonth === txMonth;
      const buildingMatch = !accountBuilding || billBuilding === accountBuilding;
      return monthMatch && buildingMatch;
    });

    // 청구 총액과 비교 (정확 일치)
    const exactMatches = relevantBills.filter(b => {
      const total = Number(b.total_amount || b.totalAmount) || 0;
      return total === bankTx.deposit;
    });

    if (exactMatches.length === 1) {
      const b = exactMatches[0];
      return {
        matched: true,
        confidence: 90,
        buildingName: b.building_name || b.buildingName || accountBuilding,
        roomNumber: b.room_number || b.roomNumber || null,
        tenantName: b.tenant_name || b.tenantName || null,
        category1: '임대수입',
        category2: '월세',
        method: 'amountExact',
        candidates: null,
      };
    }

    if (exactMatches.length > 1) {
      return {
        matched: true,
        confidence: 50,
        buildingName: accountBuilding,
        roomNumber: null,
        tenantName: null,
        category1: '임대수입',
        category2: '월세',
        method: 'amountExact:multiple',
        candidates: exactMatches.map(b => ({
          buildingName: b.building_name || b.buildingName || '',
          roomNumber: b.room_number || b.roomNumber || null,
          tenantName: b.tenant_name || b.tenantName,
          totalAmount: Number(b.total_amount || b.totalAmount) || 0,
        })),
      };
    }

    // ±5000원 범위 시도 (전기/가스 추가분)
    const rangeMatches = relevantBills.filter(b => {
      const total = Number(b.total_amount || b.totalAmount) || 0;
      return Math.abs(total - bankTx.deposit) <= 5000;
    });

    if (rangeMatches.length === 1) {
      const b = rangeMatches[0];
      return {
        matched: true,
        confidence: 80,
        buildingName: b.building_name || b.buildingName || accountBuilding,
        roomNumber: b.room_number || b.roomNumber || null,
        tenantName: b.tenant_name || b.tenantName || null,
        category1: '임대수입',
        category2: '월세',
        method: 'amountRange5000',
        candidates: null,
      };
    }
  }

  // ── 4단계: 미매칭 ──
  return {
    matched: false,
    confidence: 0,
    buildingName: accountBuilding,
    roomNumber: null,
    tenantName: koreanName || null,
    category1: '미분류',
    category2: '입금',
    method: 'unmatched',
    candidates: null,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. 출금 분류
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 출금 트랜잭션을 자동 분류합니다.
 *
 * 순서:
 * 1. excludePatterns 체크 → 제외/조건부 처리
 * 2. memoCategory 규칙 순서대로 매칭 (priority 순)
 * 3. utilityRef에서 정확 금액 매칭 → 건물 특정
 * 4. memoBuilding에서 건물 추출
 */
export function classifyWithdrawal(bankTx: BankTransaction, rules: TransactionRules): WithdrawalClassifyResult {
  const memo = bankTx.memoNormalized || normalizeMemo(bankTx.memo);
  const accountBuilding = getBuildingByAccount(bankTx.accountName, rules.accountMap);
  const amount = bankTx.withdrawal || 0;

  // ── 0. 건물주 계좌 분리 ──
  // 하우스맨사업자/하우스맨개인 = 회사 지출 계좌 → 정상 분류
  // 제이앤제이(새) = 사장님 건물 → 정상 분류
  // 나머지 건물주 계좌 = 건물주 지출 → 공과금만 정상, 나머지는 '건물주지출'
  const companyAccounts = ['하우스맨사업자', '하우스맨개인', '제이앤제이(새)'];
  const isOwnerAccount = !companyAccounts.includes(bankTx.accountName);

  if (isOwnerAccount) {
    // 공과금 패턴이면 정상 분류로 통과시킴 (아래 로직으로)
    const isUtility = /코원에너지|전기요금|수도\d{4}|수신료|엘리베이터|티케이엘리베이터|LGUM2M|LGU\+M2M/.test(memo);
    // 정산 패턴도 정상
    const isSettlement = /정산|퇴정/.test(memo);
    // 중개수수료도 정상
    const isBrokerage = /부동산|중개/.test(memo);

    if (!isUtility && !isSettlement && !isBrokerage) {
      // 건물주 개인 지출 → '건물주지출' 카테고리
      return {
        category1: '건물주지출',
        category2: '건물주개인',
        buildingName: accountBuilding,
        confidence: 90,
        excluded: true,
        excludeReason: '건물주계좌 지출',
        method: 'ownerAccount',
      };
    }
    // 공과금/정산/수수료는 아래 정상 로직으로 진행
  }

  // ── 1. excludePatterns 체크 ──
  for (const ep of rules.excludePatterns) {
    const regex = new RegExp(ep.pattern);
    if (regex.test(memo)) {
      if (ep.action === 'exclude') {
        return {
          category1: '제외',
          category2: ep.reason,
          buildingName: accountBuilding,
          confidence: ep.confidence || 100,
          excluded: true,
          excludeReason: ep.reason,
          method: 'excludePattern',
        };
      }

      // 조건부 (conditional) — 계좌에 따라 분류가 달라짐
      if (ep.action === 'conditional' && ep.conditions) {
        for (const cond of ep.conditions) {
          const accountRegex = new RegExp(cond.accountName);
          if (accountRegex.test(bankTx.accountName)) {
            return {
              category1: cond.category1,
              category2: cond.category2,
              buildingName: accountBuilding,
              confidence: 95,
              excluded: false,
              excludeReason: null,
              method: 'excludePattern:conditional',
            };
          }
        }
        // 조건 매칭 안 되면 상관없는 지출
        return {
          category1: '제외',
          category2: ep.reason,
          buildingName: null,
          confidence: 80,
          excluded: true,
          excludeReason: ep.reason,
          method: 'excludePattern:noConditionMatch',
        };
      }
    }
  }

  // ── 2. memoCategory 규칙 매칭 ──
  // priority 순 정렬 (낮은 숫자 = 높은 우선순위)
  const sortedRules = [...rules.memoCategory].sort((a, b) =>
    (a.priority || 50) - (b.priority || 50)
  );

  let categoryMatch: MemoCategoryRule | null = null;
  for (const rule of sortedRules) {
    const regex = new RegExp(rule.pattern);
    if (regex.test(memo)) {
      categoryMatch = rule;
      break;
    }
  }

  // ── 3. utilityRef 정확 금액 매칭 (건물 특정) ──
  let utilityBuilding: string | null = null;
  if (categoryMatch && amount > 0) {
    const utilityMatches = rules.utilityRef.filter(u => {
      const memoRegex = new RegExp(u.memo);
      return memoRegex.test(memo) && u.amount === amount && u.buildingName;
    });
    if (utilityMatches.length === 1) {
      utilityBuilding = utilityMatches[0].buildingName;
    }
  }

  // ── 4. memoBuilding 건물 추출 ──
  let memoBuilding: string | null = null;
  for (const rule of rules.memoBuilding) {
    const regex = new RegExp(rule.pattern);
    if (regex.test(memo)) {
      memoBuilding = rule.buildingName;
      break;
    }
  }

  // 최종 건물 결정: utilityRef > memoBuilding > accountMap
  const finalBuilding = utilityBuilding || memoBuilding || accountBuilding;

  if (categoryMatch) {
    // utilityRef로 건물 특정되면 confidence 올림
    let finalConfidence = categoryMatch.confidence || 100;
    if (utilityBuilding && finalConfidence < 100) {
      finalConfidence = 100;
    }

    // 건물주청구 가능 여부 (공과금/AS 중 퇴실청소 제외)
    const BILLABLE_CATEGORIES = ['가스', '수도', '전기', '엘리베이터', '안전보안', '인터넷TV', '자재구입', '폐기물', '건물청소비'];
    const ownerBillable = BILLABLE_CATEGORIES.includes(categoryMatch.category2);

    return {
      category1: categoryMatch.category1,
      category2: categoryMatch.category2,
      buildingName: finalBuilding,
      confidence: finalConfidence,
      excluded: false,
      excludeReason: null,
      method: utilityBuilding ? 'memoCategory+utilityRef' : 'memoCategory',
      ownerBillable,
    };
  }

  // 매칭 안 됨
  return {
    category1: '미분류',
    category2: '출금',
    buildingName: finalBuilding,
    confidence: 0,
    excluded: false,
    excludeReason: null,
    method: 'unmatched',
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. 모던 구분 (모던하우스 vs 모던라이프)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 모던하우스/모던라이프 구분이 모호한 경우 해결합니다.
 *
 * 판별 기준:
 * 1. 계좌명이 "모던하우스" 또는 "모던라이프"이면 확정
 * 2. 적요에 "모하" / "모던하우스" → 모던하우스
 * 3. 적요에 "모라" / "모던라이프" → 모던라이프
 * 4. 금액으로 청구서 대조
 */
export function resolveModern(bankTx: BankTransaction, billingRecords: BillingRecord[] = []): string | null {
  const memo = bankTx.memoNormalized || normalizeMemo(bankTx.memo);
  const account = bankTx.accountName || '';

  // 1. 계좌로 확정
  if (account === '모던하우스') return '모던하우스';
  if (account === '모던라이프') return '모던라이프';

  // 2. 적요 키워드
  if (/^모하|모던하우스/.test(memo)) return '모던하우스';
  if (/^모라|모던라이프/.test(memo)) return '모던라이프';

  // 3. 금액 대조
  if (billingRecords.length > 0 && bankTx.deposit > 0) {
    const modernHouse = billingRecords.filter(b =>
      (b.building_name || b.buildingName) === '모던하우스'
      && Number(b.total_amount || b.totalAmount) === bankTx.deposit
    );
    const modernLife = billingRecords.filter(b =>
      (b.building_name || b.buildingName) === '모던라이프'
      && Number(b.total_amount || b.totalAmount) === bankTx.deposit
    );

    if (modernHouse.length === 1 && modernLife.length === 0) return '모던하우스';
    if (modernLife.length === 1 && modernHouse.length === 0) return '모던라이프';
  }

  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. 전기요금 안분
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 전기요금을 건물별로 안분합니다.
 *
 * 하우스맨사업자 계좌에서 한전에 나가는 전기요금은
 * 여러 건물의 공용전기가 합산된 경우가 있음.
 * 각 건물의 전기 청구금액 비율로 안분.
 */
export function splitElectricBill(bankTx: BankTransaction, billingRecords: BillingRecord[] = []): ElectricSplitEntry[] {
  const totalAmount = bankTx.withdrawal || 0;
  if (totalAmount === 0 || billingRecords.length === 0) {
    return [{ buildingName: '미분류', amount: totalAmount, ratio: 1 }];
  }

  // 건물별 전기 청구 합계
  const buildingElec: Record<string, number> = {};
  for (const b of billingRecords) {
    const building = b.building_name || b.buildingName;
    if (!building) continue;
    const elecAmount = Number(b.elec_amount || b.elecAmount) || 0;
    if (elecAmount > 0) {
      buildingElec[building] = (buildingElec[building] || 0) + elecAmount;
    }
  }

  const entries = Object.entries(buildingElec);
  if (entries.length === 0) {
    return [{ buildingName: '미분류', amount: totalAmount, ratio: 1 }];
  }

  const totalElec = entries.reduce((sum, [, amt]) => sum + amt, 0);
  if (totalElec === 0) {
    return [{ buildingName: '미분류', amount: totalAmount, ratio: 1 }];
  }

  // 비율로 안분 (10원 단위 절사)
  const result: ElectricSplitEntry[] = entries.map(([building, elec]) => {
    const ratio = elec / totalElec;
    const amount = Math.floor((totalAmount * ratio) / 10) * 10;
    return { buildingName: building, amount, ratio: Math.round(ratio * 10000) / 10000 };
  });

  // 절사 잔액을 가장 큰 건물에 배분
  const allocated = result.reduce((sum, r) => sum + r.amount, 0);
  const remainder = totalAmount - allocated;
  if (remainder > 0 && result.length > 0) {
    result.sort((a, b) => b.amount - a.amount);
    result[0].amount += remainder;
  }

  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. 규칙 로드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * transactionRules.json을 로드합니다.
 * JSON import 방식이므로 빌드 타임에 번들링됨.
 */
export function loadRules(): TransactionRules {
  return transactionRules as unknown as TransactionRules;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. 일괄 매칭 실행
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 트랜잭션 배열을 일괄 매칭하여 분류 결과를 반환합니다.
 */
export function runMatching(
  transactions: BankTransaction[],
  rules: TransactionRules,
  billingRecords: BillingRecord[] = [],
  tenants: TenantRecord[] = [],
): MatchingResult {
  const results: any[] = [];
  let matchedCount = 0;
  let unmatchedCount = 0;
  let excludedCount = 0;
  let depositCount = 0;
  let withdrawalCount = 0;

  for (const tx of transactions) {
    let classification: any;

    if (tx.deposit > 0) {
      // 입금
      depositCount++;

      // 먼저 excludePatterns 체크 (건물주 정산 입금 등)
      const memo = tx.memoNormalized || normalizeMemo(tx.memo);
      let isExcluded = false;
      for (const ep of rules.excludePatterns) {
        if (new RegExp(ep.pattern).test(memo)) {
          if (ep.action === 'exclude') {
            classification = {
              ...tx,
              category1: '제외',
              category2: ep.reason,
              buildingName: getBuildingByAccount(tx.accountName, rules.accountMap),
              confidence: ep.confidence || 100,
              excluded: true,
              method: 'excludePattern',
            };
            isExcluded = true;
            excludedCount++;
            break;
          }
        }
      }

      if (!isExcluded) {
        const result = matchDeposit(tx, rules, billingRecords, tenants);
        classification = { ...tx, ...result };
        if (result.matched) {
          matchedCount++;
        } else {
          unmatchedCount++;
        }
      }
    } else if (tx.withdrawal > 0) {
      // 출금
      withdrawalCount++;
      const result = classifyWithdrawal(tx, rules);
      classification = { ...tx, ...result };
      if (result.excluded) {
        excludedCount++;
      } else if (result.category1 !== '미분류') {
        matchedCount++;
      } else {
        unmatchedCount++;
      }
    } else {
      // 금액 0 (드물지만 방어)
      classification = {
        ...tx,
        category1: '미분류',
        category2: '금액없음',
        buildingName: getBuildingByAccount(tx.accountName, rules.accountMap),
        confidence: 0,
        excluded: false,
        method: 'zeroAmount',
      };
      unmatchedCount++;
    }

    results.push(classification);
  }

  return {
    results,
    summary: {
      total: transactions.length,
      deposits: depositCount,
      withdrawals: withdrawalCount,
      matched: matchedCount,
      unmatched: unmatchedCount,
      excluded: excludedCount,
    },
  };
}
