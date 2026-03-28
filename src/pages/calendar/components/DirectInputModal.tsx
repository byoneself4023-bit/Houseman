// @ts-nocheck
/**
 * 퇴실정보 직접입력 모달
 * - 비밀번호, 환불계좌(은행/계좌번호/예금주), 퇴실일시 입력
 * - prefill 모드: 임차인 자동저장값 수정
 * - 예금주 ≠ 계약자 이름 불일치 경고
 */
import { inputStyle } from '@/components/Field';
import { persistUpdate } from '../calendarApi';

const BANKS = [
  "국민은행","신한은행","우리은행","하나은행","농협은행","IBK기업은행",
  "SC제일은행","씨티은행","케이뱅크","카카오뱅크","토스뱅크","수협은행",
  "대구은행","부산은행","경남은행","광주은행","전북은행","제주은행",
  "우체국","새마을금고","신협","산업은행",
];

interface DirectInputModalProps {
  directInputModal: any;
  setDirectInputModal: (v: any) => void;
  setEvents: (fn: any) => void;
}

export const DirectInputModal = ({ directInputModal: dim, setDirectInputModal, setEvents }: DirectInputModalProps) => {
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
    if (!pw) return alert("호실 비밀번호를 입력하세요.");

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
    }

    persistUpdate(dim.ev.supabaseId, patch);
    setEvents((prev: any[]) => prev.map((e: any) => e === dim.ev ? { ...e, ...patch } : e));
    setDirectInputModal(null);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseDown={() => setDirectInputModal(null)}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 420, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}
        onMouseDown={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>{isPrefill ? "📝 자동저장값 수정" : "✏️ 퇴실정보 직접입력"}</div>
          <button onClick={() => setDirectInputModal(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8F95A3" }}>✕</button>
        </div>

        {isPrefill && (
          <div style={{ padding: "6px 10px", borderRadius: 6, background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: 10, color: "#2563EB", marginBottom: 12 }}>
            임차인이 입력한 정보입니다. 수정 후 저장하세요.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* 퇴실일시 */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>퇴실일시</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input id="di-date" type="date" defaultValue={defaultDate} style={{ ...inputStyle, padding: "8px 10px", fontSize: 12, flex: 1 }} />
              <input id="di-time" type="time" defaultValue={defaultTime} style={{ ...inputStyle, padding: "8px 10px", fontSize: 12, width: 100 }} />
            </div>
          </div>
          {/* 비밀번호 */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>호실 비밀번호</div>
            <input id="di-pw" defaultValue={isPrefill ? (evData.doorPassword || "") : ""} placeholder="비밀번호 입력"
              style={{ ...inputStyle, padding: "8px 10px", fontSize: 12, width: "100%" }} />
          </div>
          {/* 환불 은행 */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>환불 은행</div>
            <select id="di-bank" defaultValue={isPrefill ? (evData.refundBank || "") : ""}
              style={{ ...inputStyle, padding: "8px 10px", fontSize: 12, width: "100%", cursor: "pointer" }}>
              <option value="">은행 선택</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {/* 계좌번호 */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>계좌번호</div>
            <input id="di-acct" defaultValue={isPrefill ? (evData.refundAccount || "") : ""} placeholder="계좌번호 입력"
              style={{ ...inputStyle, padding: "8px 10px", fontSize: 12, width: "100%", fontFamily: "monospace" }} />
          </div>
          {/* 예금주 */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>예금주</div>
            <input id="di-holder" defaultValue={isPrefill ? (evData.refundHolder || dim.tenantName) : dim.tenantName} placeholder="예금주 입력"
              style={{ ...inputStyle, padding: "8px 10px", fontSize: 12, width: "100%" }} />
          </div>
        </div>

        {/* 버튼 */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button onClick={() => setDirectInputModal(null)}
            style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            취소
          </button>
          <button onClick={handleSave}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            완료
          </button>
        </div>
      </div>
    </div>
  );
};
