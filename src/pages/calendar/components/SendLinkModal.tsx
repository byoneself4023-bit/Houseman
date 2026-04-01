import React from 'react';
import { toast } from 'sonner';
import { inputClassName } from '@/components/Field';
import { persistUpdate } from '../calendarApi';

interface SendLinkModalProps {
  sendLinkModal: { ev: any; link: string; building: string; room: string } | null;
  setSendLinkModal: (v: any) => void;
  setEvents?: (fn: any) => void;
}

export const SendLinkModal: React.FC<SendLinkModalProps> = ({ sendLinkModal, setSendLinkModal, setEvents }) => {
  if (!sendLinkModal) return null;

  const { building, room, link } = sendLinkModal;
  const msgText = `[하우스맨] ${building} ${room}호 퇴실 안내\n\n아래 링크에서 비밀번호, 환불계좌를 입력해주세요.\n${link}`;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center"
      onMouseDown={() => setSendLinkModal(null)}>
      <div className="bg-white rounded-2xl p-6 w-[380px] shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        onMouseDown={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-bold text-hm-text">{"\uD83D\uDCE9"} 다른번호로 보내기</div>
          <button onClick={() => setSendLinkModal(null)} className="bg-transparent border-none text-xl cursor-pointer text-hm-text-muted hover:text-hm-text transition-colors">{"\u2715"}</button>
        </div>
        <div className="text-xs text-hm-text-muted mb-3">{building} {room}호 퇴실링크</div>
        <div className="mb-3">
          <div className="text-xs font-bold text-hm-text-sub mb-[3px]">연락처</div>
          <input id="sl-phone" placeholder="010-0000-0000" className={`${inputClassName} !py-2.5 !px-3 !text-sm font-mono`} autoFocus />
        </div>
        <div className="mb-4 p-2 px-2.5 bg-hm-bg-hover rounded-md border border-[#E5E7EB] text-xs text-hm-text-sub whitespace-pre-wrap">
          {msgText}
        </div>
        <button onClick={() => {
          const phone = (document.getElementById("sl-phone") as HTMLInputElement)?.value;
          if (!phone) { toast.error("연락처를 입력하세요."); return; }
          window.open(`sms:${phone}?body=${encodeURIComponent(msgText)}`);
          const now = new Date();
          const sentAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          const patch = { moveOutLinkSent: true, moveOutLinkSentAt: sentAt };
          persistUpdate(sendLinkModal.ev?.supabaseId, patch);
          setEvents?.((prev: any[]) => prev.map((e: any) => e === sendLinkModal.ev ? { ...e, ...patch } : e));
          setSendLinkModal(null);
        }}
          className="w-full py-2.5 rounded-lg border-none bg-[#F59E0B] text-white font-bold text-sm cursor-pointer font-[inherit] hover:bg-[#D97706] transition-colors">
          {"\uD83D\uDCE9"} 문자 보내기
        </button>
      </div>
    </div>
  );
};
