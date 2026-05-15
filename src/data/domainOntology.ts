/* eslint-disable @typescript-eslint/no-explicit-any */

// ── 타입 정의 ──

interface WorkflowStep {
  id: string;
  name: string;
  requires: string[];
}

interface BusinessRule {
  id: string;
  condition: string;
  action: string;
  description: string;
}

interface Relationship {
  from: string;
  relation: string;
  to: string;
}

interface Entity {
  types?: string[];
  properties?: string[];
  statuses?: string[];
}

// ── 온톨로지 정의 ──

export const domainOntology = {
  entities: {
    Building: {
      types: ['단기', '일반임대', '근생', '관리사무소', '기업시설'],
      properties: ['name', 'address', 'owner', 'feeType', 'feeRate', 'entranceDoorPassword'],
    } as Entity,
    Room: {
      properties: ['deposit', 'rent', 'mgmt', 'type', 'status'],
    } as Entity,
    Tenant: {
      types: ['단기', '일반', '근생'],
      properties: ['name', 'phone', 'moveIn', 'expiry', 'rent', 'mgmt', 'deposit'],
      statuses: ['정상', '연체'],
    } as Entity,
    Contract: {
      properties: ['building', 'room', 'deposit', 'rent', 'broker', 'moveIn', 'expiry'],
    } as Entity,
    Settlement: {
      types: ['A(퍼센트)', 'S(월급)', 'F(고정액)', 'D(수금)', 'X(없음)'],
    } as Entity,
  },

  relationships: [
    { from: 'Building', relation: 'has_rooms', to: 'Room[]' },
    { from: 'Room', relation: 'occupied_by', to: 'Tenant | null' },
    { from: 'Tenant', relation: 'has_contract', to: 'Contract' },
    { from: 'Building', relation: 'settlement_type', to: 'A|S|F|D|X' },
    { from: 'Building', relation: 'owned_by', to: 'Owner[]' },
    { from: 'Tenant', relation: 'overdue', to: 'LateFee (단기만 적용)' },
    // C1-a: 입금(Transaction) → 청구(BillingRecord) 결제 관계 정식화.
    // BillingService.markPaid 호출 시 SENT → PARTIAL/PAID 자동 전이.
    // 주체 = Transaction (실 거래 이벤트), Tenant는 결제 의지 보유자 (별개 관계, 후속 카드).
    { from: 'Transaction', relation: 'pays_for', to: 'BillingRecord' },
  ] as Relationship[],

  workflows: {
    lifecycle: [
      { id: 'vacant', name: '공실', requires: [] },
      { id: 'contract', name: '계약', requires: ['vacant'] },
      { id: 'moveIn', name: '입주', requires: ['contract'] },
      { id: 'billing', name: '매월 청구/수금', requires: ['moveIn'] },
      { id: 'moveOut', name: '퇴실', requires: ['moveIn'] },
      { id: 'settlement', name: '정산', requires: ['moveOut'] },
    ] as WorkflowStep[],

    contract_steps: [
      { id: 'depositConfirm', name: '계약금확인', requires: [] },
      { id: 'ownerReport', name: '건물주보고', requires: ['depositConfirm'] },
      { id: 'balanceConfirm', name: '잔금확인', requires: ['ownerReport'] },
      { id: 'contractEntry', name: '계약서입력', requires: ['ownerReport'] },
      { id: 'finalPayment', name: '최종납부', requires: ['balanceConfirm'] },
      { id: 'interior', name: '인테리어', requires: [] },
      { id: 'brokerFee', name: '중개료송금', requires: [] },
    ] as WorkflowStep[],

    moveout_short: [
      { id: 'moveOutLink', name: '퇴실링크', requires: [] },
      { id: 'externalCheck', name: '퇴실체크', requires: ['moveOutLink'] },
      { id: 'settlement', name: '정산서', requires: ['externalCheck'] },
      { id: 'cleaning', name: '청소', requires: [] },
      { id: 'moveInPhoto', name: '입주체크사진', requires: ['cleaning'] },
      { id: 'vacantConfirm', name: '공실전환', requires: ['settlement', 'moveInPhoto'] },
    ] as WorkflowStep[],

    moveout_normal: [
      { id: 'moveOutMsg', name: '퇴실문자', requires: [] },
      { id: 'password', name: '비밀번호', requires: [] },
      { id: 'moveOutPhoto', name: '퇴실사진', requires: [] },
      { id: 'settlement', name: '정산서', requires: [] },
      { id: 'ownerContact', name: '건물주연락', requires: ['settlement'] },
      { id: 'moveInPhoto', name: '입주체크사진', requires: [] },
    ] as WorkflowStep[],

    billing_cycle: [
      { id: 'utilityInput', name: '공과금 데이터 입력', requires: [] },
      { id: 'invoiceGenerate', name: '청구서 생성+발송', requires: ['utilityInput'] },
      { id: 'accountDistribute', name: '계좌 분배', requires: ['invoiceGenerate'] },
      { id: 'collectionCheck', name: '수금 확인', requires: ['accountDistribute'] },
    ] as WorkflowStep[],
  },

  rules: [
    { id: 'lateFee', condition: 'tenant.type == 단기 && overdueDays > 5', action: 'fee = rent * 0.05', description: '단기 연체 6일째부터 월세 5% 수수료' },
    { id: 'noLateFee', condition: 'tenant.type == 일반 || tenant.type == 근생', action: 'fee = 0', description: '일반/근생 연체수수료 없음' },
    { id: 'shortPenalty', condition: 'moveOut.beforeExpiry && tenant.type == 단기', action: 'penalty = 7일 임대료 + 중개수수료', description: '단기 조기퇴실 위약금' },
    { id: 'settlementCalc', condition: 'moveOut', action: '최종정산 = 보증금 + 환불금액 - 공제금액', description: '퇴실 정산 공식' },
    { id: 'roundingFloor10', condition: '공과금 계산', action: 'Math.floor(x/10)*10', description: '공과금 10원 단위 절사' },
    { id: 'roundingRound', condition: '수수료/연체/일할', action: 'Math.round', description: '수수료 반올림' },
    { id: 'vatReverse', condition: 'building.vatApplied', action: 'Math.round(total/1.1)', description: 'VAT 역산' },
    { id: 'rec_expiryAlert', condition: 'tenant.expiry <= 7days', action: 'recommend("갱신 여부 확인")', description: '만기 7일 이내 계약 갱신 확인 권장' },
    { id: 'rec_overdueAlert', condition: 'tenant.type == 단기 && overdueDays >= 5', action: 'recommend("독촉 문자 발송")', description: '단기 연체 5일 이상 독촉 권장' },
    { id: 'rec_moveoutToday', condition: 'event.type == 퇴실 && event.date == today', action: 'recommend("퇴실체크 진행")', description: '오늘 퇴실 예정 확인' },
    { id: 'rec_longVacancy', condition: 'vacancy.days >= 30', action: 'recommend("홍보 방법 변경")', description: '장기 공실 30일 이상 홍보 전략 검토' },
  ] as BusinessRule[],
};

// ── 프롬프트 포맷터 ──

function formatSteps(steps: WorkflowStep[]): string {
  return steps.map(s => {
    const req = s.requires.length > 0
      ? `(선행: ${s.requires.join(', ')})`
      : '';
    return `${s.name}${req}`;
  }).join(' → ');
}

export function formatWorkflowForPrompt(): string {
  const w = domainOntology.workflows;
  return [
    `전체 사이클: ${formatSteps(w.lifecycle)} → 다시 공실`,
    '',
    `[계약 워크플로우] ${formatSteps(w.contract_steps)}`,
    `[퇴실-단기] ${formatSteps(w.moveout_short)}`,
    `[퇴실-일반/근생] ${formatSteps(w.moveout_normal)}`,
    `[월별 청구] ${formatSteps(w.billing_cycle)}`,
  ].join('\n');
}

export function formatRulesForPrompt(): string {
  return domainOntology.rules
    .map(r => `- ${r.description}: ${r.condition} → ${r.action}`)
    .join('\n');
}

export function formatRelationshipsForPrompt(): string {
  return domainOntology.relationships
    .map(r => `- ${r.from} → ${r.relation} → ${r.to}`)
    .join('\n');
}
