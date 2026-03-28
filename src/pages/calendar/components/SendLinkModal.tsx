import React from 'react';
import { inputStyle } from '@/components/Field';

interface SendLinkModalProps {
  sendLinkModal: { ev: any; link: string; building: string; room: string } | null;
  setSendLinkModal: (v: any) => void;
}

export const SendLinkModal: React.FC<SendLinkModalProps> = ({ sendLinkModal, setSendLinkModal }) => {
  if (!sendLinkModal) return null;

  const { building, room, link } = sendLinkModal;
  const msgText = `[하우스맨] ${building} ${room}호 퇴실 안내\n\n아래 링크에서 비밀번호, 환불계좌를 입력해주세요.\n${link}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseDown={() => setSendLinkModal(null)}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}
        onMouseDown={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>{"\uD83D\uDCE9"} 다른번호로 보내기</div>
          <button onClick={() => setSendLinkModal(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8F95A3" }}>{"\u2715"}</button>
        </div>
        <div style={{ fontSize: 11, color: "#8F95A3", marginBottom: 12 }}>{building} {room}호 퇴실링크</div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>연락처</div>
          <input id="sl-phone" placeholder="010-0000-0000" style={{ ...inputStyle, padding: "10px 12px", fontSize: 13, width: "100%", fontFamily: "monospace" }} autoFocus />
        </div>
        <div style={{ marginBottom: 16, padding: "8px 10px", background: "#F9FAFB", borderRadius: 6, border: "1px solid #E5E7EB", fontSize: 10, color: "#5F6577", whiteSpace: "pre-wrap" }}>
          {msgText}
        </div>
        <button onClick={() => {
          const phone = (document.getElementById("sl-phone") as HTMLInputElement)?.value;
          if (!phone) return alert("연락처를 입력하세요.");
          window.open(`sms:${phone}?body=${encodeURIComponent(msgText)}`);
          setSendLinkModal(null);
        }}
          style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: "#F59E0B", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          {"\uD83D\uDCE9"} 문자 보내기
        </button>
      </div>
    </div>
  );
};
