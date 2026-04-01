// @ts-nocheck
/**
 * 퇴실정보 직접입력 모달
 * - 비밀번호, 환불계좌(은행/계좌번호/예금주), 퇴실일시 입력
 * - prefill 모드: 임차인 자동저장값 수정
 * - 예금주 ≠ 계약자 이름 불일치 경고
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { inputClassName } from '@/components/Field';
import { persistUpdate } from '../calendarApi';

const BANKS = [
  "KB국민","신한","우리","하나","NH농협","IBK기업",
  "SC제일","씨티","케이뱅크","카카오뱅크","토스뱅크","수협",
  "대구","부산","경남","광주","전북","제주",
  "우체국","새마을금고","신협","산업","BNK","KDB",
];

interface DirectInputModalProps {
  directInputModal: any;
  setDirectInputModal: (v: any) => void;
  setEvents: (fn: any) => void;
}

export const DirectInputModal = ({ directInputModal: dim, setDirectInputModal, setEvents }: DirectInputModalProps) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  if (!dim) return null;

  const isPrefill = dim.prefill;
  const evData = dim.ev;
  const now = new Date();
  const defaultDate = isPrefill && evData.moveOutLinkCompletedAt
    ? evData.moveOutLinkCompletedAt.split(" ")[0]
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const defaultTime = isPrefill && evData.moveOutLinkCompletedAt
    ? (evData.moveOutLinkCompletedAt.split(" ")[1] || "").slice(0, 5)
    : `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const handleSave = () => {
    const pw = (document.getElementById("di-pw") as HTMLInputElement)?.value;
    const bank = (document.getElementById("di-bank") as HTMLSelectElement)?.value;
    const acct = (document.getElementById("di-acct") as HTMLInputElement)?.value;
    const holder = (document.getElementById("di-holder") as HTMLInputElement)?.value;
    const date = (document.getElementById("di-date") as HTMLInputElement)?.value;
    const time = (document.getElementById("di-time") as HTMLInputElement)?.value;
    if (!pw) { toast.error("호실 비밀번호를 입력하세요."); return; }

    const completedAt = `${date} ${time} (직접입력)`;
    const patch: Record<string, any> = {
      moveOutLinkCompleted: true,
      moveOutLinkCompletedAt: completedAt,
      doorPassword: pw,
      refundBank: bank || "",
      refundAccount: acct || "",
      refundHolder: holder || "",
    };
    if (holder && dim.tenantName && holder !== dim.tenantName) {
      patch._holderMismatch = true;
      toast.warning(`⚠️ 예금주가 임차인 이름과 다릅니다.\n임차인: ${dim.tenantName} / 예금주: ${holder}`);
    }

    persistUpdate(dim.ev.supabaseId, patch);
    setEvents((prev: any[]) => prev.map((e: any) => e === dim.ev ? { ...e, ...patch } : e));
    setDirectInputModal(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center"
      onMouseDown={() => setDirectInputModal(null)}>
      <div className="bg-white rounded-2xl p-6 w-[420px] max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,.3)]"
        onMouseDown={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-bold text-hm-text">{isPrefill ? "📝 자동저장값 수정" : "✏️ 퇴실정보 직접입력"}</div>
          <button onClick={() => setDirectInputModal(null)} className="bg-transparent border-none text-xl cursor-pointer text-hm-text-muted hover:text-hm-text transition-colors">✕</button>
        </div>

        {isPrefill && (
          <div className="px-2.5 py-1.5 rounded-md bg-hm-blue-bg border border-blue-200 text-xs text-hm-blue-dark mb-3">
            임차인이 입력한 정보입니다. 수정 후 저장하세요.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* 퇴실일시 */}
          <div>
            <div className="text-xs font-bold text-hm-text-sub mb-[3px]">퇴실일시</div>
            <div className="flex gap-1.5">
              <input id="di-date" type="date" defaultValue={defaultDate} className={`${inputClassName} !px-2.5 !py-2 !text-xs flex-1`} />
              <input id="di-time" type="time" defaultValue={defaultTime} className={`${inputClassName} !px-2.5 !py-2 !text-xs min-w-[130px]`} />
            </div>
          </div>
          {/* 비밀번호 */}
          <div>
            <div className="text-xs font-bold text-hm-text-sub mb-[3px]">호실 비밀번호</div>
            <input id="di-pw" defaultValue={isPrefill ? (evData.doorPassword || "") : ""} placeholder="비밀번호 입력 (숫자)"
              className={`${inputClassName} !px-2.5 !py-2 !text-xs`} />
          </div>
          {/* 환불 은행 */}
          <div>
            <div className="text-xs font-bold text-hm-text-sub mb-[3px]">환불 은행</div>
            <select id="di-bank" defaultValue={isPrefill ? (evData.refundBank || "") : ""}
              className={`${inputClassName} !px-2.5 !py-2 !text-xs cursor-pointer`}>
              <option value="">은행 선택</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {/* 계좌번호 */}
          <div>
            <div className="text-xs font-bold text-hm-text-sub mb-[3px]">계좌번호</div>
            <input id="di-acct" defaultValue={isPrefill ? (evData.refundAccount || "") : ""} placeholder="숫자만 입력 (예: 12612772801011)"
              onInput={(e: any) => { e.target.value = e.target.value.replace(/[^0-9]/g, ""); }}
              className={`${inputClassName} !px-2.5 !py-2 !text-xs font-mono`} />
          </div>
          {/* 예금주 */}
          <div>
            <div className="text-xs font-bold text-hm-text-sub mb-[3px]">예금주</div>
            <input id="di-holder" defaultValue={isPrefill ? (evData.refundHolder || dim.tenantName) : dim.tenantName} placeholder="예금주 입력"
              className={`${inputClassName} !px-2.5 !py-2 !text-xs`} />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setShowResetConfirm(true)}
            className="px-5 py-2 rounded-lg border border-red-300 bg-hm-danger-bg text-hm-danger font-bold text-xs cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">
            초기화
          </button>
          <button onClick={() => setDirectInputModal(null)}
            className="px-5 py-2 rounded-lg border border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
            취소
          </button>
          <button onClick={handleSave}
            className="px-5 py-2 rounded-lg border-none bg-hm-blue text-white font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-blue-dark transition-colors">
            완료
          </button>
        </div>
      </div>

      {/* 초기화 확인 모달 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/45 flex items-center justify-center"
          onMouseDown={() => setShowResetConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 w-[380px] shadow-[0_20px_60px_rgba(0,0,0,.3)]"
            onMouseDown={e => e.stopPropagation()}>
            <div className="text-base font-bold text-hm-text mb-3">🔄 초기화</div>
            <div className="text-sm text-gray-700 leading-relaxed">퇴실링크 입력을 초기화하시겠습니까?</div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowResetConfirm(false)}
                className="px-5 py-2 rounded-lg border border-hm-input-border bg-white text-hm-text-sub font-bold text-xs cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
                취소
              </button>
              <button onClick={() => {
                const resetPatch: Record<string, any> = {
                  moveOutLinkCompleted: undefined, moveOutLinkCompletedAt: undefined,
                  doorPassword: undefined, refundBank: undefined, refundAccount: undefined,
                  refundHolder: undefined, _holderMismatch: undefined,
                };
                persistUpdate(dim.ev.supabaseId, resetPatch);
                setEvents((prev: any[]) => prev.map((e: any) => e === dim.ev ? { ...e, ...resetPatch } : e));
                setShowResetConfirm(false);
                setDirectInputModal(null);
              }}
                className="px-5 py-2 rounded-lg border-none bg-hm-danger text-white font-bold text-xs cursor-pointer font-[inherit] hover:bg-red-700 transition-colors">
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
