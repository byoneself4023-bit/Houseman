// CalendarPage 이벤트 및 모달 상태 타입 정의

export interface DeductionItem {
  label: string;
  amount: number;
}

/**
 * 캘린더 이벤트 — 계약/퇴실/휴무 공용
 * 모든 필드 optional (타입별로 사용하는 필드가 다름)
 */
export interface CalendarEvent {
  // 공통
  type: '계약' | '퇴실' | '휴무';
  date: string; // YYYY-MM-DD
  supabaseId?: string;
  source?: 'supabase' | 'local';
  registeredBy?: string;
  isCompleted?: boolean;

  // 계약 전용
  building?: string;
  room?: string;
  name?: string;
  deposit?: string;
  rent?: string;
  mgmt?: string;
  broker?: string;
  brokerPhone?: string;
  moveIn?: string;
  expiry?: string;
  contractDate?: string;
  registeredSource?: '부동산' | '직접';
  depositConfirmed?: boolean;
  reported?: boolean;
  balanceConfirmed?: boolean;
  contractEntered?: boolean;        // 계약서 입력 완료
  finalPaymentConfirmed?: boolean;  // 최종 납부 확인
  interiorManaged?: boolean;        // 인테리어 관리 완료
  brokerFeeSent?: boolean;          // 중개수수료 송금 완료
  // 단기 전용 필드
  waterFee?: string;
  cable?: string;
  exitFee?: string;
  commBroker?: string;
  applyNego?: boolean;
  negoRent?: string;
  negoMgmt?: string;

  // 퇴실 전용
  moveOutLinkCompleted?: boolean;
  moveOutLinkCompletedAt?: string;
  doorPassword?: string;
  refundBank?: string;
  refundAccount?: string;
  refundHolder?: string;
  externalCheckDone?: boolean;
  externalCheckComment?: string;
  deductionItems?: DeductionItem[];
  meterElec?: string;
  meterGas?: string;
  repairType?: string;
  repairDone?: boolean;
  repairNeeded?: boolean;
  cleaningDone?: boolean;
  cleaningFeeExtra?: string;
  cleaningComment?: string;
  vacantConfirmed?: boolean;
  ownerReported?: boolean;
  moveOutOwnerReported?: boolean;    // 퇴실 시 건물주 보고 (ownerReported와 별도)
  ownerReportMsg?: string;
  moveOutMsg?: string;
  settled?: boolean;
  moveOutPhotos?: string[];
  moveOutCheckPhotos?: string[];
  moveInCheckPhotos?: string[];
  _holderMismatch?: boolean;
  _origEvent?: CalendarEvent;

  // 휴무 전용 (name은 공통으로 이미 있음)

  // 기타 (확장 가능)
  [key: string]: any;
}

export interface ExternalCheckModalState {
  ev: CalendarEvent;
  tm: any; // tenant match
}

export interface DirectInputModalState {
  ev: CalendarEvent;
  tm: any;
  tenantName: string;
  prefill?: boolean;
}

export interface EditEventState {
  idx: number;
  evt: CalendarEvent;
  edits: Record<string, any>;
}

export interface CompareDataState {
  building: string;
  room: string;
  moveInCheckPhotos: string[];
  moveOutPhotos: string[];
}

export interface ZoomPhotoState {
  photos: string[];
  index: number;
  zoom: number;
}

export interface ReportModalState {
  ev: CalendarEvent;
  owners: any[];
  msgText: string;
}

export interface SendLinkModalState {
  ev: CalendarEvent;
  link: string;
}

export interface MoveOutMsgModalState {
  ev: CalendarEvent;
  text: string;
}
