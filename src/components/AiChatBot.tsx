/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, CSSProperties, KeyboardEvent } from 'react';
import { useBuildingStore } from '@/stores/useBuildingStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';

/* ── Field map: camelCase key -> { label (Korean), col (DB column) } ── */
const FIELD_MAP: Record<string, { label: string; col: string }> = {
  // 건물 기본
  buildingName: { label: '건물명', col: 'building_name' },
  buildingNickname: { label: '건물 약칭', col: 'building_nickname' },
  approvedDate: { label: '사용승인일', col: 'approved_date' },
  buildingAreaTotal: { label: '건물 총면적(m2)', col: 'building_area_total' },
  contractStartDate: { label: '관리시작일', col: 'contract_start_date' },
  memo: { label: '메모', col: 'memo' },
  // 건물 유형 체크
  isShortTermRental: { label: '단기임대 여부', col: 'is_short_term_rental' },
  isLongTermRental: { label: '일반임대 여부', col: 'is_long_term_rental' },
  isCommercial: { label: '근생 여부', col: 'is_commercial' },
  isManagementAgency: { label: '관리사무소대행 여부', col: 'is_management_agency' },
  isCorporateFacility: { label: '기업시설관리 여부', col: 'is_corporate_facility' },
  // 건물주 1
  ownerName: { label: '건물주 이름', col: 'owner_name' },
  ownerResidentNumber: { label: '건물주 주민등록번호', col: 'owner_resident_number' },
  ownerPhone: { label: '건물주 전화번호', col: 'owner_phone' },
  ownerEmail: { label: '건물주 이메일', col: 'owner_email' },
  ownerHomeAddress: { label: '건물주 자택 주소', col: 'owner_home_address' },
  ownerBusinessRegistrationNumber: { label: '사업자등록번호', col: 'owner_business_registration_number' },
  ownerBusinessName: { label: '사업자 상호', col: 'owner_business_name' },
  ownerBusinessAddress: { label: '사업장 주소', col: 'owner_business_address' },
  ownerBusinessType: { label: '업태', col: 'owner_business_type' },
  ownerBusinessItem: { label: '종목', col: 'owner_business_item' },
  ownerEntityType: { label: '법인유형', col: 'owner_entity_type' },
  // 건물주 2
  owner2Name: { label: '건물주2 이름', col: 'owner_2_name' },
  owner2ResidentNumber: { label: '건물주2 주민등록번호', col: 'owner_2_resident_number' },
  owner2Phone: { label: '건물주2 전화번호', col: 'owner_2_phone' },
  owner2Email: { label: '건물주2 이메일', col: 'owner_2_email' },
  owner2HomeAddress: { label: '건물주2 자택 주소', col: 'owner_2_home_address' },
  // 건물주 3
  owner3Name: { label: '건물주3 이름', col: 'owner_3_name' },
  owner3ResidentNumber: { label: '건물주3 주민등록번호', col: 'owner_3_resident_number' },
  owner3Phone: { label: '건물주3 전화번호', col: 'owner_3_phone' },
  owner3Email: { label: '건물주3 이메일', col: 'owner_3_email' },
  owner3HomeAddress: { label: '건물주3 자택 주소', col: 'owner_3_home_address' },
  coOwnerMemo: { label: '공동소유 메모', col: 'co_owner_memo' },
  // 담당자 / 관리인
  contactPersonName: { label: '담당자 이름', col: 'contact_person_name' },
  contactPersonPhone: { label: '담당자 전화', col: 'contact_person_phone' },
  contactPersonEmail: { label: '담당자 이메일', col: 'contact_person_email' },
  isContactPersonPrimary: { label: '1차 연락대상 여부', col: 'is_contact_person_primary' },
  // 시설 정보
  entranceDoorPassword: { label: '현관 비밀번호', col: 'entrance_door_password' },
  electricMeterBoxPassword: { label: '전기계량함 비밀번호', col: 'electric_meter_box_password' },
  parkingGatePassword: { label: '주차장 게이트 비밀번호', col: 'parking_gate_password' },
  cctvCount: { label: 'CCTV 대수', col: 'cctv_count' },
  cctvRoomLocation: { label: 'CCTV 녹화기 위치', col: 'cctv_room_location' },
  cctvInstallInfo: { label: 'CCTV 설치 정보', col: 'cctv_install_info' },
  rooftopAccessMethod: { label: '옥상 출입 방법', col: 'rooftop_access_method' },
  isStorageAvailable: { label: '창고 사용 가능', col: 'is_storage_available' },
  parkingTotalSpaces: { label: '주차 총 대수', col: 'parking_total_spaces' },
  // 공과금 / 유틸리티
  electricCommonCustomerNumber: { label: '전기 공용 고객번호', col: 'electric_common_customer_number' },
  waterCommonCustomerNumber: { label: '수도 공용 고객번호', col: 'water_common_customer_number' },
  electricContractPower: { label: '전기 계약전력', col: 'electric_contract_power' },
  internetProvider: { label: '인터넷 통신사', col: 'internet_provider' },
  // 수수료 / 정산
  managementFeeType: { label: '관리수수료 방식', col: 'management_fee_type' },
  managementFeeRate: { label: '관리수수료율', col: 'management_fee_rate' },
  managementFeeFixedAmount: { label: '관리수수료 고정금액', col: 'management_fee_fixed_amount' },
  penalty7daysOwnership: { label: '7일패널티 귀속', col: 'penalty_7days_ownership' },
  freeRepairLimit: { label: '무상수리 한도', col: 'free_repair_limit' },
  settlementCount: { label: '월 정산 횟수', col: 'settlement_count' },
  settlementDay1: { label: '정산일 1', col: 'settlement_day_1' },
  settlementDay2: { label: '정산일 2', col: 'settlement_day_2' },
  // 청구 설정
  managementFeeBillingType: { label: '관리비 선후불', col: 'management_fee_billing_type' },
  waterBillingType: { label: '수도비 선후불', col: 'water_billing_type' },
  internetBillingType: { label: '인터넷비 선후불', col: 'internet_billing_type' },
  billingCycle: { label: '청구주기', col: 'billing_cycle' },
  // 계약 / 법적
  isResidentRegistrationAllowed: { label: '전입신고 가능', col: 'is_resident_registration_allowed' },
  isRenthomeWritingAgency: { label: '렌트홈 작성 대행', col: 'is_renthome_writing_agency' },
  isStandardContract: { label: '표준계약서 사용', col: 'is_standard_contract' },
  // 유지보수
  septicTankCleaningMonth1: { label: '정화조 청소 1차 월', col: 'septic_tank_cleaning_month_1' },
  septicTankCleaningMonth2: { label: '정화조 청소 2차 월', col: 'septic_tank_cleaning_month_2' },
  monthlyInspectionCount: { label: '월 순회점검 횟수', col: 'monthly_inspection_count' },
  // 문서 URL
  fireInsuranceDocumentUrl: { label: '화재보험 문서 URL', col: 'fire_insurance_document_url' },
  documentBuildingRegisterUrl: { label: '건축물대장 URL', col: 'document_building_register_url' },
  documentManagementContractUrl: { label: '관리계약서 URL', col: 'document_management_contract_url' },
  documentBusinessRegistrationUrl: { label: '사업자등록증 URL', col: 'document_business_registration_url' },
  documentCompletionDrawingUrl: { label: '준공도면 URL', col: 'document_completion_drawing_url' },
  documentEtc1Url: { label: '기타문서1 URL', col: 'document_etc_1_url' },
  documentEtc2Url: { label: '기타문서2 URL', col: 'document_etc_2_url' },
  documentEtc3Url: { label: '기타문서3 URL', col: 'document_etc_3_url' },
  // 청구 설정
  rentBillingType: { label: '월세 선후불', col: 'rent_billing_type' },
  // 계좌
  rentAccountTarget: { label: '월세 입금계좌', col: 'rent_account_target' },
  managementFeeAccountTarget: { label: '관리비 입금계좌', col: 'management_fee_account_target' },
  utilityAccountTarget: { label: '공과금 입금계좌', col: 'utility_account_target' },
  electricGasAccountTarget: { label: '전기가스 입금계좌', col: 'electric_gas_account_target' },
  depositAccountTarget: { label: '보증금 입금계좌', col: 'deposit_account_target' },
  housemanBillingAccount: { label: '하우스맨 청구계좌', col: 'houseman_billing_account' },
  // 계약서 특약
  contractSpecialTermsShortTerm: { label: '단기임대 특약', col: 'contract_special_terms_short_term' },
  contractSpecialTermsLongTerm: { label: '일반임대 특약', col: 'contract_special_terms_long_term' },
  contractSpecialTermsCommercial: { label: '근생 특약', col: 'contract_special_terms_commercial' },
  // 소장/현장관리인
  siteManagerName: { label: '소장 이름', col: 'site_manager_name' },
  siteManagerPhone: { label: '소장 전화', col: 'site_manager_phone' },
  siteManagerEmail: { label: '소장 이메일', col: 'site_manager_email' },
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  success?: boolean;
  error?: boolean;
}

interface ActionPayload {
  action: string;
  building?: string;
  field?: string;
  value?: any;
  description?: string;
  message?: string;
  event?: any;
  buildingId?: string;
  roomId?: string;
  room?: string;
  type?: string;
  fields?: string[];
  name?: string;
  amount?: number;
  method?: string;
  note?: string;
  carNumber?: string;
  carType?: string;
}

function buildFieldList(): string {
  // 토큰 절약: col 제거, label->key 매핑만
  return Object.entries(FIELD_MAP)
    .map(([key, { label }]) => `${label}: ${key}`)
    .join(', ');
}

function buildSystemPrompt(buildingNames: string, contextData: any): string {
  return `하우스맨 건물관리 AI. 한국어 답변.

## 건물: ${buildingNames}

## 임차인 (건물_호실: 이름 전화)
${contextData.tenantSummary}

## 공실
${contextData.vacancySummary || '(없음)'}

## 연체
${contextData.overdueSummary}

## 건물 상세
${contextData.buildingDetailSummary}

## 건물필드(key): ${buildFieldList()}

## JSON 액션 (코드블록 1개만)
- 건물수정: {"action":"update","building":"건물명","field":"camelKey","value":"값","description":"설명"}
- 건물조회: {"action":"read","building":"건물명","fields":["f1"],"description":"설명"}
- 확인질문: {"action":"ask","message":"질문"}
- 일정등록: {"action":"addEvent","event":{"date":"2026-04-01","type":"퇴실|계약|입주|기타","building":"","room":"","name":"","color":"#E52528|#346aff|#10B981|#8B5CF6"},"description":""}
- 일정삭제: {"action":"removeEvent","building":"","room":"","type":"","description":""}
- 임차인수정: {"action":"updateTenant","building":"","room":"","field":"name|phone|rent|mgmt|deposit|status|carNumber|carType|memo","value":"","description":""}
- 임차인조회: 임차인 정보는 위 임차인 요약에서 찾아서 자연어로 답변 (JSON 불필요)
- 입금: {"action":"addDeposit","building":"","room":"","name":"","amount":0,"method":"계좌이체","note":"","description":""}
- 주차: {"action":"updateParking","building":"","room":"","carNumber":"","carType":"","description":""}
- 일반질문: JSON없이 자연어 답변

## 규칙
- 변경 요청 시 바로 update/updateTenant JSON 응답 (확인은 시스템이 자동 처리)
- 건물명/필드가 애매하면 ask로 확인질문
- boolean=true/false, 금액=숫자만(원단위,콤마없음)`;
}

async function callClaude(systemPrompt: string, history: Array<{ role: string; content: string }>): Promise<string> {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: history,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API 오류 (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

interface AiChatBotProps {
  sidePanel?: boolean;
}

export function AiChatBot({ sidePanel = false }: AiChatBotProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(sidePanel ? true : false);
  const [pendingAction, setPendingAction] = useState<ActionPayload | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { allBuildings, buildingData, setBuildingData } = useBuildingStore() as any;
  const { activeTenants, setActiveTenants } = useTenantStore() as any;
  const { activeVacancies, calendarEvts, setCalendarEvts, setParkingInfo } = useCalendarStore() as any;
  const { roomBalances, addDeposit } = useFinanceStore() as any;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const updateBD = (buildingName: string, patch: Record<string, any>) => {
    setBuildingData((prev: any) => ({
      ...prev,
      [buildingName]: { ...(prev[buildingName] || {}), ...patch },
    }));
  };

  // pendingAction 실행 헬퍼
  const executePendingAction = (action: ActionPayload) => {
    if (action.action === 'update') {
      let val: any = action.value;
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      const exactName = allBuildings.find((b: any) => (b.name || "").toUpperCase() === (action.building || "").toUpperCase())?.name || action.building;
      updateBD(exactName!, { [action.field!]: val });
      const fieldLabel = FIELD_MAP[action.field!]?.label || action.field;
      setMessages(prev => [...prev, { role: 'assistant', content: `${action.building}의 ${fieldLabel}을(를) "${action.value}"(으)로 변경했습니다.`, success: true }]);
      toast.success(`${action.building}의 ${fieldLabel} 변경 완료`);
    } else if (action.action === 'updateTenant') {
      const exactBuilding = allBuildings.find((b: any) =>
        (b.name || "").toUpperCase() === (action.building || "").toUpperCase()
      )?.name || action.building;
      setActiveTenants((prev: any[]) => prev.map((t: any) => {
        if (t.building !== exactBuilding || String(t.room) !== String(action.room)) return t;
        if (action.field === 'phone' && action.value && action.value !== t.phone && t.phone) {
          const today = new Date().toISOString().slice(0, 10);
          const updated = { ...t, phone: action.value, phonePrevious1: t.phone, phonePrevious2: t.phonePrevious1 || "" };
          if (t.id) {
            api.put(`/api/contracts/${t.id}`, { phone: action.value, phonePrevious1: t.phone, phonePrevious2: t.phonePrevious1 || "" }).catch((e: any) => console.error('[API] phone shift failed:', e));
          }
          return updated;
        }
        return { ...t, [action.field!]: action.value };
      }));
      setMessages(prev => [...prev, { role: 'assistant', content: `${action.building} ${action.room}호 임차인 ${action.field} 변경 -> ${action.value}`, success: true }]);
      toast.success(`${action.building} ${action.room}호 임차인 정보 변경 완료`);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);

    // 확인 대기 중인 액션이 있으면: "네/응/확인/ㅇㅇ" -> 실행, 아니면 취소
    if (pendingAction) {
      const yes = /^(네|예|응|ㅇㅇ|ㅇ|확인|맞아|바꿔|변경|좋아|ok|yes|y)$/i.test(userMsg);
      if (yes) {
        executePendingAction(pendingAction);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '변경을 취소했습니다.' }]);
      }
      setPendingAction(null);
      return;
    }

    /* eslint-disable no-restricted-syntax */
    // 로컬 검색: AI 호출 없이 즉시 응답
    const _localResult = ((): string | null => {
      const msg = userMsg;
      const tList = activeTenants || [];
      const bList = allBuildings || [];
      const findBldg = (kw: string) => bList.find((b: any) => {
        const nm = (b.name || '').toLowerCase();
        const nk = (b.nickname || '').toLowerCase();
        const k = kw.toLowerCase();
        return nm.includes(k) || nk.includes(k);
      });

      // 임차인 이름 검색: "OOO 있어?/누구/연락처/월세/보증금/만기"
      const nameM = msg.match(/([가-힣]{2,4})\s*(있|누구|연락처|전화|호실|몇호|월세|임대료|보증금|만기|입주일|계약)/);
      if (nameM) {
        const sn = nameM[1];
        const fd = tList.filter((t: any) => t.name && t.name.includes(sn));
        if (fd.length === 0) return `"${sn}" 이름의 임차인이 없습니다.`;
        const kw = nameM[2];
        if (kw === '있' || kw === '누구') return fd.map((t: any) => `${t.building} ${t.room}호 -- ${t.name} (${t.phone || '연락처 없음'})`).join('\n');
        if (kw === '연락처' || kw === '전화') return fd.map((t: any) => `${t.name}: ${t.phone || '미등록'} (${t.building} ${t.room}호)`).join('\n');
        if (kw === '호실' || kw === '몇호') return fd.map((t: any) => `${t.name}: ${t.building} ${t.room}호`).join('\n');
        if (kw === '월세' || kw === '임대료') return fd.map((t: any) => `${t.name}: 월세 ${(t.rent || 0).toLocaleString()}원 / 관리비 ${(t.mgmt || 0).toLocaleString()}원 (${t.building} ${t.room}호)`).join('\n');
        if (kw === '보증금') return fd.map((t: any) => `${t.name}: 보증금 ${(t.deposit || 0).toLocaleString()}원 (${t.building} ${t.room}호)`).join('\n');
        if (kw === '만기') return fd.map((t: any) => `${t.name}: 만기 ${t.expiry || '미등록'} (${t.building} ${t.room}호)`).join('\n');
        if (kw === '입주일' || kw === '계약') return fd.map((t: any) => `${t.name}: 입주 ${t.moveIn || '미등록'} / 만기 ${t.expiry || '미등록'} (${t.building} ${t.room}호)`).join('\n');
      }

      // 호실 조회: "OOO 103호", "OOO빌 203호 누구"
      const roomM = msg.match(/([가-힣A-Za-z]+)\s*(\d{2,4})호?\s*(누구|이름|연락처|전화|월세|보증금|만기)?/);
      if (roomM) {
        const bldg = findBldg(roomM[1]);
        if (bldg) {
          const bn = (bldg as any).name || bldg;
          const fd = tList.filter((t: any) => t.building === bn && String(t.room) === String(roomM[2]));
          if (fd.length === 0) return `${bn} ${roomM[2]}호에 등록된 임차인이 없습니다.`;
          const t = fd[0] as any;
          const kw = roomM[3];
          if (kw === '연락처' || kw === '전화') return `${t.name}: ${t.phone || '미등록'}`;
          if (kw === '월세') return `${t.name}: 월세 ${(t.rent || 0).toLocaleString()}원 / 관리비 ${(t.mgmt || 0).toLocaleString()}원`;
          if (kw === '보증금') return `${t.name}: 보증금 ${(t.deposit || 0).toLocaleString()}원`;
          if (kw === '만기') return `${t.name}: 만기 ${t.expiry || '미등록'}`;
          return `${bn} ${roomM[2]}호: ${t.name} / ${t.phone || ''} / 월세 ${(t.rent || 0).toLocaleString()} / 관리비 ${(t.mgmt || 0).toLocaleString()} / 보증금 ${(t.deposit || 0).toLocaleString()} / 입주 ${t.moveIn || '-'} / 만기 ${t.expiry || '-'}`;
        }
      }

      // 건물 비번: "OOO 비번"
      const pwM = msg.match(/([가-힣A-Za-z]+)\s*(비번|비밀번호|현관)/);
      if (pwM) {
        const bldg = findBldg(pwM[1]);
        if (bldg) {
          const bd = (buildingData as any)[(bldg as any).name || bldg] || {};
          return bd.entranceDoorPassword ? `${(bldg as any).name} 현관 비번: ${bd.entranceDoorPassword}` : `${(bldg as any).name} 현관 비번이 등록되어 있지 않습니다.`;
        }
      }

      // 공실: "공실", "빈방"
      const qn = msg.replace(/\s+/g, '');
      if (/공실|빈방|빈호실/.test(qn)) {
        const vac = activeVacancies || [];
        return vac.length === 0 ? '현재 공실이 없습니다.' : `공실 ${vac.length}개:\n` + vac.map((v: any) => `- ${v.building} ${v.room}호`).join('\n');
      }

      // 연체: "연체", "미납"
      if (/연체|미납/.test(qn)) {
        const od = Object.entries(roomBalances || {}).filter(([, v]) => (v as number) > 0);
        if (od.length === 0) return '현재 연체가 없습니다.';
        return `연체 ${od.length}건:\n` + od.map(([key, val]) => {
          const t = tList.find((x: any) => `${x.building}_${x.room}` === key);
          return `- ${key.replace('_', ' ')} (${(t as any)?.name || '?'}): ${(val as number).toLocaleString()}원`;
        }).join('\n');
      }

      // 임차인 수: "몇명"
      if (/몇\s*명|임차인\s*수|총.*명/.test(msg)) return `현재 활성 임차인: ${tList.length}명`;

      return null;
    })();
    /* eslint-enable no-restricted-syntax */

    if (_localResult) {
      setMessages(prev => [...prev, { role: 'assistant', content: _localResult }]);
      return;
    }

    // AI 호출 (로컬에서 처리 못 한 경우)
    setLoading(true);

    try {
      const buildingNames = allBuildings.map((b: any) => b.name || b).join(', ');

      // 건물별 상세 데이터 요약 (AI가 조회/수정할 때 참조)
      const buildingDetailSummary = allBuildings.map((b: any) => {
        const name = b.name || b;
        const bd = (buildingData as any)[name] || {};
        const fields: string[] = [];
        if (bd.addressRoad) fields.push(`도로명주소: ${bd.addressRoad}`);
        if (bd.addressOld) fields.push(`지번주소: ${bd.addressOld}`);
        if (bd.entranceDoorPassword) fields.push(`현관비번: ${bd.entranceDoorPassword}`);
        if (bd.ownerName) fields.push(`건물주: ${bd.ownerName}`);
        if (bd.ownerPhone) fields.push(`건물주전화: ${bd.ownerPhone}`);
        if (bd.managementFeeType) fields.push(`수수료방식: ${bd.managementFeeType}`);
        if (bd.managementFeeRate) fields.push(`수수료율: ${bd.managementFeeRate}`);
        if (bd.settlementDay1) fields.push(`정산일: ${bd.settlementDay1}`);
        if (bd.cctvCount) fields.push(`CCTV: ${bd.cctvCount}대`);
        if (bd.parkingTotalSpaces) fields.push(`주차: ${bd.parkingTotalSpaces}대`);
        return fields.length > 0 ? `[${name}] ${fields.join(' / ')}` : `[${name}] (상세 미입력)`;
      }).join('\n');

      // 임차인 요약 (건물_호실: 이름 + 주요정보)
      const tenantSummary = (activeTenants || [])
        .map((t: any) => {
          const parts = [`${t.building}_${t.room}: ${t.name}`];
          if (t.phone) parts.push(`연락처:${t.phone}`);
          if (t.rent) parts.push(`임대료:${t.rent}`);
          if (t.mgmt) parts.push(`관리비:${t.mgmt}`);
          if (t.deposit) parts.push(`보증금:${t.deposit}`);
          if (t.moveIn) parts.push(`입주일:${t.moveIn}`);
          if (t.expiry) parts.push(`만기일:${t.expiry}`);
          return parts.join(' / ');
        })
        .join('\n') || '(없음)';

      // 공실 요약
      const vacancySummary = (activeVacancies || [])
        .map((v: any) => `${v.building} ${v.room}호 (${v.type || '미정'})`)
        .join('\n') || '(없음)';

      // 연체 현황 (잔액 > 0인 것)
      const overdueEntries = Object.entries(roomBalances || {}).filter(([, v]) => (v as number) > 0);
      const overdueSummary = overdueEntries.length > 0
        ? overdueEntries.map(([key, val]) => {
            const tenant = (activeTenants || []).find((t: any) => `${t.building}_${t.room}` === key);
            return `${key} (${(tenant as any)?.name || '?'}): ${(val as number).toLocaleString()}원`;
          }).join('\n')
        : '(연체 없음)';

      const contextData = {
        tenantCount: (activeTenants || []).length,
        vacancyCount: (activeVacancies || []).length,
        overdueCount: overdueEntries.length,
        eventCount: (calendarEvts || []).length,
        tenantSummary,
        vacancySummary,
        overdueSummary,
        buildingDetailSummary,
      };

      const systemPrompt = buildSystemPrompt(buildingNames, contextData);
      // 최근 10개 대화만 전달 (토큰 절약)
      const recentMsgs = messages.slice(-10);
      const history = [
        ...recentMsgs.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        { role: 'user', content: userMsg },
      ];
      const text = await callClaude(systemPrompt, history);

      // Parse JSON action from response
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const action: ActionPayload = JSON.parse(jsonMatch[1]);

        if (action.action === 'update') {
          // 코드 레벨 확인: 현재값 보여주고 pendingAction에 저장
          const exactName = allBuildings.find((b: any) => (b.name || "").toUpperCase() === (action.building || "").toUpperCase())?.name || action.building;
          const fieldLabel = FIELD_MAP[action.field!]?.label || action.field;
          const currentVal = ((buildingData as any)[exactName!] || {})[action.field!] || '(미입력)';
          setPendingAction(action);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `${exactName}의 ${fieldLabel}을(를) 변경합니다.\n현재: ${currentVal}\n변경: ${action.value}\n\n변경하시겠습니까? (네/아니오)`,
          }]);
        } else if (action.action === 'ask') {
          setMessages((prev) => [...prev, { role: 'assistant', content: action.message! }]);
        } else if (action.action === 'addEvent') {
          const evt = action.event;
          setCalendarEvts((prev: any[]) => [...prev, { ...evt, id: Date.now() }]);
          setMessages(prev => [...prev, { role: 'assistant', content: `${evt.building} ${evt.room}호 ${evt.type} 일정 등록 (${evt.date})`, success: true }]);
          toast.success(`${evt.building} ${evt.room}호 일정 등록 완료`);

        } else if (action.action === 'removeEvent') {
          setCalendarEvts((prev: any[]) => prev.filter((e: any) =>
            !(e.buildingId === action.buildingId && e.roomId === action.roomId && e.type === action.type)
          ));
          setMessages(prev => [...prev, { role: 'assistant', content: `${action.building} ${action.room}호 ${action.type} 일정 삭제`, success: true }]);
          toast.success(`${action.building} ${action.room}호 일정 삭제 완료`);

        } else if (action.action === 'updateTenant') {
          // 코드 레벨 확인: 현재값 보여주고 pendingAction에 저장
          const exactBuilding = allBuildings.find((b: any) =>
            (b.name || "").toUpperCase() === (action.building || "").toUpperCase()
          )?.name || action.building;
          const tenant = (activeTenants || []).find((t: any) =>
            t.building === exactBuilding && String(t.room) === String(action.room)
          ) as any;
          const fieldLabels: Record<string, string> = { name: '이름', phone: '연락처', rent: '월세', mgmt: '관리비', deposit: '보증금', status: '상태', carNumber: '차량번호', carType: '차종', memo: '메모' };
          const fieldLabel = fieldLabels[action.field!] || action.field;
          const currentVal = tenant ? (tenant[action.field!] || '(미입력)') : '(임차인 없음)';
          const tenantName = tenant?.name || '?';
          setPendingAction(action);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `${exactBuilding} ${action.room}호 ${tenantName}의 ${fieldLabel}을(를) 변경합니다.\n현재: ${currentVal}\n변경: ${action.value}\n\n변경하시겠습니까? (네/아니오)`,
          }]);

        } else if (action.action === 'addDeposit') {
          addDeposit(action.building!, action.room!, action.name!, Number(action.amount), action.method || '계좌이체', action.note || '');
          setMessages(prev => [...prev, { role: 'assistant', content: `${action.building} ${action.room}호 ${action.name} 입금 ${Number(action.amount).toLocaleString()}원 처리`, success: true }]);
          toast.success(`${action.building} ${action.room}호 입금 처리 완료`);

        } else if (action.action === 'updateParking') {
          const key = `${action.building}_${action.room}`;
          setParkingInfo((prev: any) => ({ ...prev, [key]: { ...(prev[key] || {}), carNumber: action.carNumber, carType: action.carType } }));
          setMessages(prev => [...prev, { role: 'assistant', content: `${action.building} ${action.room}호 주차 정보 업데이트`, success: true }]);
          toast.success(`${action.building} ${action.room}호 주차 정보 업데이트 완료`);

        } else if (action.action === 'read') {
          // buildingData + allBuildings 양쪽에서 데이터 합산
          const saved = (buildingData as any)[action.building!] || {};
          const bldgObj = allBuildings.find((b: any) => (b.name || "").toUpperCase() === (action.building || "").toUpperCase()) || {};
          const merged = { ...bldgObj, ...saved };
          const results = action.fields!
            .map((f: string) => {
              const label = FIELD_MAP[f]?.label || f;
              const val = (merged as any)[f];
              return `${label}: ${val != null && val !== '' ? val : '(미입력)'}`;
            })
            .join('\n');
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `[${action.building}] 조회 결과:\n${results}` },
          ]);
        } else {
          setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
        }
      } else {
        // No JSON block, show raw text
        setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `오류: ${err.message}`, error: true },
      ]);
      toast.error(`AI 오류: ${err.message}`);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (sidePanel) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #E5E5E5", background: "#fff" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#346aff" }}>AI 어시스턴트</div>
          <div style={{ fontSize: 9, color: "#8B95A1", marginTop: 2 }}>건물/호실/임차인 정보를 자연어로 조회/수정</div>
        </div>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 12px", color: "#8B95A1", fontSize: 11, lineHeight: 1.8 }}>
              명령 예시:<br/>
              &quot;제이앤제이 현관 비번 1234로 바꿔줘&quot;<br/>
              &quot;스타빌 공실 몇 개야?&quot;<br/>
              &quot;연체자 누구야?&quot;
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={msg.role === 'user' ? styles.userMsg : msg.success ? styles.successMsg : msg.error ? styles.errorMsg : styles.assistantMsg}>
              <span style={styles.msgText}>{msg.content}</span>
            </div>
          ))}
          {loading && <div style={styles.assistantMsg}><span style={styles.loadingDots}>응답 대기중...</span></div>}
        </div>
        <div style={{ padding: "10px 12px", borderTop: "1px solid #E5E5E5", background: "#fff" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="명령 입력..." style={{ ...styles.input, flex: 1 }} disabled={loading} />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              style={{ ...styles.sendBtn, opacity: loading || !input.trim() ? 0.5 : 1 }}>전송</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Toggle header */}
      <div style={styles.header} onClick={() => setOpen((v) => !v)}>
        <span style={styles.headerTitle}>AI 어시스턴트</span>
        <span style={styles.headerToggle}>{open ? '접기' : '펼치기'}</span>
      </div>

      {open && (
        <div style={styles.body}>
          {/* Messages */}
          <div ref={scrollRef} style={{ ...styles.messageArea, maxHeight: messages.length > 0 ? 400 : 150, transition: "max-height 0.3s ease" }}>
            {messages.length === 0 && (
              <div style={styles.placeholder}>
                건물 정보를 자연어로 조회/수정할 수 있습니다.
                <br />
                예: &quot;제이앤제이 현관 비번 1234로 바꿔줘&quot;
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={
                  msg.role === 'user'
                    ? styles.userMsg
                    : msg.success
                      ? styles.successMsg
                      : msg.error
                        ? styles.errorMsg
                        : styles.assistantMsg
                }
              >
                <span style={styles.msgText}>{msg.content}</span>
              </div>
            ))}
            {loading && (
              <div style={styles.assistantMsg}>
                <span style={styles.loadingDots}>응답 대기중...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="건물 정보 조회/수정 명령을 입력하세요..."
              style={styles.input}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                ...styles.sendBtn,
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    cursor: 'pointer',
    background: '#F8FAFC',
    borderBottom: '1px solid #E5E7EB',
    userSelect: 'none',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1E40AF',
  },
  headerToggle: {
    fontSize: 12,
    color: '#6B7280',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
  },
  messageArea: {
    maxHeight: 60,
    overflowY: 'auto',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  placeholder: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: '16px 0',
    lineHeight: 1.6,
  },
  userMsg: {
    alignSelf: 'flex-end',
    background: '#346aff',
    color: '#FFFFFF',
    borderRadius: '12px 12px 2px 12px',
    padding: '6px 12px',
    maxWidth: '80%',
  },
  assistantMsg: {
    alignSelf: 'flex-start',
    background: '#F3F4F6',
    color: '#1F2937',
    borderRadius: '12px 12px 12px 2px',
    padding: '6px 12px',
    maxWidth: '80%',
  },
  successMsg: {
    alignSelf: 'flex-start',
    background: '#D1FAE5',
    color: '#065F46',
    borderRadius: '12px 12px 12px 2px',
    padding: '6px 12px',
    maxWidth: '80%',
    fontWeight: 600,
  },
  errorMsg: {
    alignSelf: 'flex-start',
    background: '#FEE2E2',
    color: '#991B1B',
    borderRadius: '12px 12px 12px 2px',
    padding: '6px 12px',
    maxWidth: '80%',
  },
  msgText: {
    fontSize: 13,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.5,
  },
  loadingDots: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    padding: '8px 12px 10px',
    borderTop: '1px solid #E5E7EB',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    fontSize: 13,
    outline: 'none',
  },
  sendBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#346aff',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
