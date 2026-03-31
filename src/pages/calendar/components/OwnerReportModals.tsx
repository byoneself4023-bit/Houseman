import React from 'react';
import { toast } from 'sonner';
import { useIsMobile } from '@/utils';

interface ContractReportModalProps {
  contractReport: { ev: Record<string, any>; owners: any[]; msgText: string } | null;
  setContractReport: (v: any) => void;
  setEvents?: (fn: any) => void;
}

export const ContractReportModal: React.FC<ContractReportModalProps> = ({
  contractReport, setContractReport, setEvents,
}) => {
  const isMobile = useIsMobile();
  if (!contractReport) return null;

  const { ev, owners, msgText } = contractReport;
  const ownerPhone = owners[0]?.phone || "";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => setContractReport(null)}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, padding: 24, width: isMobile ? "92%" : 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>📩 건물주 보고 — {ev.building} {ev.room}호</span>
          <button onClick={() => setContractReport(null)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", marginBottom: 6 }}>👤 건물주 정보</div>
          {owners.map((o: any, oi: number) => (
            <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 12 }}>
              <span style={{ fontWeight: 700 }}>{o.name || `건물주${oi + 1}`}</span>
              <span style={{ color: "#3B82F6" }}>{o.phone || "연락처 미등록"}</span>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 6 }}>💬 전송 내용</div>
          <textarea id="contract-report-msg" defaultValue={msgText} rows={14}
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => {
            const msg = (document.getElementById("contract-report-msg") as HTMLTextAreaElement)?.value || msgText;
            if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
            window.open(`sms:${ownerPhone}?body=${encodeURIComponent(msg)}`, "_blank");
            setEvents?.((prev: any[]) => prev.map((e: any) => (e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room)) ? { ...e, reported: true } : e));
            setContractReport(null);
          }}
            style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            📱 문자 보내기
          </button>
          <button onClick={() => {
            const msg = (document.getElementById("contract-report-msg") as HTMLTextAreaElement)?.value || msgText;
            if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
            window.open(`https://story.kakao.com/share?url=&text=${encodeURIComponent(msg)}`, "_blank");
            setEvents?.((prev: any[]) => prev.map((e: any) => (e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room)) ? { ...e, reported: true } : e));
            setContractReport(null);
          }}
            style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "#FEE500", color: "#3C1E1E", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            💬 카카오톡
          </button>
          <button onClick={() => {
            const msg = (document.getElementById("contract-report-msg") as HTMLTextAreaElement)?.value || msgText;
            navigator.clipboard.writeText(msg);
            setEvents?.((prev: any[]) => prev.map((e: any) => (e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room)) ? { ...e, reported: true } : e));
            toast.success("메시지가 클립보드에 복사되었습니다.");
          }}
            style={{ padding: "12px 16px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            📋 복사
          </button>
        </div>
      </div>
    </div>
  );
};

interface MoveOutOwnerReportModalProps {
  moveOutOwnerReport: { ev: Record<string, any>; owners: any[]; msgText: string } | null;
  setMoveOutOwnerReport: (v: any) => void;
  setEvents?: (fn: any) => void;
}

export const MoveOutOwnerReportModal: React.FC<MoveOutOwnerReportModalProps> = ({
  moveOutOwnerReport, setMoveOutOwnerReport, setEvents,
}) => {
  const isMobile = useIsMobile();
  if (!moveOutOwnerReport) return null;

  const { ev, owners, msgText } = moveOutOwnerReport;
  const ownerPhone = owners[0]?.phone || "";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => setMoveOutOwnerReport(null)}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, padding: 24, width: isMobile ? "92%" : 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>📞 퇴실 건물주연락 — {ev.building} {ev.room}호</span>
          <button onClick={() => setMoveOutOwnerReport(null)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", marginBottom: 6 }}>👤 건물주 정보</div>
          {owners.map((o: any, oi: number) => (
            <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 12 }}>
              <span style={{ fontWeight: 700 }}>{o.name || `건물주${oi + 1}`}</span>
              <span style={{ color: "#3B82F6" }}>{o.phone || "연락처 미등록"}</span>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>💬 퇴실정산 내용</div>
          <textarea id="moveout-owner-msg" defaultValue={msgText} rows={14}
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => {
            const msg = (document.getElementById("moveout-owner-msg") as HTMLTextAreaElement)?.value || msgText;
            if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
            window.open(`sms:${ownerPhone}?body=${encodeURIComponent(msg)}`, "_blank");
            setEvents?.((prev: any[]) => prev.map((e: any) => (e.type === "퇴실" && e.building === ev.building && String(e.room) === String(ev.room)) ? { ...e, ownerReported: true, ownerReportMsg: msg } : e));
            setMoveOutOwnerReport(null);
          }}
            style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "#7C3AED", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            📱 문자 보내기
          </button>
          <button onClick={() => {
            const msg = (document.getElementById("moveout-owner-msg") as HTMLTextAreaElement)?.value || msgText;
            if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
            window.open(`https://story.kakao.com/share?url=&text=${encodeURIComponent(msg)}`, "_blank");
            setEvents?.((prev: any[]) => prev.map((e: any) => (e.type === "퇴실" && e.building === ev.building && String(e.room) === String(ev.room)) ? { ...e, ownerReported: true, ownerReportMsg: msg } : e));
            setMoveOutOwnerReport(null);
          }}
            style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "#FEE500", color: "#3C1E1E", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            💬 카카오톡
          </button>
          <button onClick={() => {
            const msg = (document.getElementById("moveout-owner-msg") as HTMLTextAreaElement)?.value || msgText;
            navigator.clipboard.writeText(msg);
            setEvents?.((prev: any[]) => prev.map((e: any) => (e.type === "퇴실" && e.building === ev.building && String(e.room) === String(ev.room)) ? { ...e, ownerReported: true, ownerReportMsg: msg } : e));
            toast.success("메시지가 클립보드에 복사되었습니다.");
          }}
            style={{ padding: "12px 16px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            📋 복사
          </button>
        </div>
      </div>
    </div>
  );
};

interface BreakReportModalProps {
  breakReport: { ev: Record<string, any>; owners: any[]; msgText: string; targetBroker?: boolean } | null;
  setBreakReport: (v: any) => void;
}

export const BreakReportModal: React.FC<BreakReportModalProps> = ({
  breakReport, setBreakReport,
}) => {
  const isMobile = useIsMobile();
  if (!breakReport) return null;

  const { ev, owners, msgText } = breakReport;
  const ownerPhone = owners[0]?.phone || "";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => setBreakReport(null)}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, padding: 24, width: isMobile ? "92%" : 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>📩 계약파기 {breakReport.targetBroker ? "부동산 안내" : "건물주 보고"} — {ev.building} {ev.room}호</span>
          <button onClick={() => setBreakReport(null)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", marginBottom: 6 }}>{breakReport.targetBroker ? "🏠 부동산 정보" : "👤 건물주 정보"}</div>
          {owners.map((o: any, oi: number) => (
            <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 12 }}>
              <span style={{ fontWeight: 700 }}>{o.name || (breakReport.targetBroker ? "부동산" : `건물주${oi + 1}`)}</span>
              <span style={{ color: "#3B82F6" }}>{o.phone || "연락처 미등록"}</span>
            </div>
          ))}
        </div>
        {!breakReport.targetBroker && <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>💰 계약금 (만원)</div>
          <input id="break-deposit-amt" type="number" placeholder="계약금 입력"
            onChange={e => {
              const amt = e.target.value;
              const ta = document.getElementById("break-report-msg") as HTMLTextAreaElement;
              if (ta) {
                ta.value = ta.value.replace(/※ 계약금.*입금 후 파기 건입니다\./, `※ 계약금 ${amt ? amt + "만원 " : ""}입금 후 파기 건입니다.`);
              }
            }}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #FECACA", fontSize: 12, fontFamily: "inherit", background: "#FEF2F2", boxSizing: "border-box" }} />
        </div>}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>💬 전송 내용</div>
          <textarea id="break-report-msg" defaultValue={msgText} rows={14}
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 12, fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => {
            const msg = (document.getElementById("break-report-msg") as HTMLTextAreaElement)?.value || msgText;
            if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
            window.open(`sms:${ownerPhone}?body=${encodeURIComponent(msg)}`, "_blank");
            setBreakReport(null);
          }}
            style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            📱 문자 보내기
          </button>
          <button onClick={() => {
            const msg = (document.getElementById("break-report-msg") as HTMLTextAreaElement)?.value || msgText;
            if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
            window.open(`https://story.kakao.com/share?url=&text=${encodeURIComponent(msg)}`, "_blank");
            setBreakReport(null);
          }}
            style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "#FEE500", color: "#3C1E1E", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            💬 카카오톡
          </button>
          <button onClick={() => {
            const msg = (document.getElementById("break-report-msg") as HTMLTextAreaElement)?.value || msgText;
            navigator.clipboard.writeText(msg);
            toast.success("메시지가 클립보드에 복사되었습니다.");
          }}
            style={{ padding: "12px 16px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            📋 복사
          </button>
        </div>
      </div>
    </div>
  );
};

interface MoveOutMsgModalProps {
  moveOutMsgModal: { ev: Record<string, any>; text: string } | null;
  setMoveOutMsgModal: (v: any) => void;
  calendarEvents: Record<string, any>[];
  setEvents?: (fn: any) => void;
}

export const MoveOutMsgModal: React.FC<MoveOutMsgModalProps> = ({
  moveOutMsgModal, setMoveOutMsgModal, calendarEvents, setEvents,
}) => {
  if (!moveOutMsgModal) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => setMoveOutMsgModal(null)}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, width: 480, maxWidth: "90vw", maxHeight: "80vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>📩 퇴실문자 — {moveOutMsgModal.ev.building} {moveOutMsgModal.ev.room}호</div>
          <button onClick={() => setMoveOutMsgModal(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8F95A3" }}>✕</button>
        </div>
        <textarea
          value={moveOutMsgModal.text}
          onChange={e => setMoveOutMsgModal((prev: any) => ({ ...prev, text: e.target.value }))}
          placeholder="수령한 퇴실문자 내용을 입력하세요..."
          style={{ width: "100%", minHeight: 180, padding: "12px 14px", borderRadius: 8, border: "1.5px solid #E0E3E9", fontSize: 12, lineHeight: 1.7, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          {moveOutMsgModal.ev.moveOutMsg && (
            <button onClick={() => {
              const orig = moveOutMsgModal.ev._origEvent;
              const idx = calendarEvents.indexOf(orig);
              if (idx > -1 && setEvents) setEvents((prev: any[]) => prev.map((evt: any, j: number) => j === idx ? { ...evt, moveOutMsg: "" } : evt));
              setMoveOutMsgModal(null);
            }}
              style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              삭제
            </button>
          )}
          <button onClick={() => setMoveOutMsgModal(null)}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #E0E3E9", background: "#fff", color: "#5F6577", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            취소
          </button>
          <button onClick={() => {
            const orig = moveOutMsgModal.ev._origEvent;
            const idx = calendarEvents.indexOf(orig);
            const txt = moveOutMsgModal.text;
            // 비밀번호 자동 추출
            const pwMatch = txt.match(/비밀번호\s*[:\-]?\s*([#*\d]+)/i) || txt.match(/호실비번\s*[:\-]?\s*([#*\d]+)/i) || txt.match(/비번\s*[:\-]?\s*([#*\d]+)/i) || txt.match(/pw\s*[:\-]?\s*([#*\d]+)/i);
            const pw = pwMatch ? pwMatch[1] : undefined;
            if (idx > -1 && setEvents) setEvents((prev: any[]) => prev.map((evt: any, j: number) => j === idx ? { ...evt, moveOutMsg: txt, ...(pw ? { doorPassword: pw } : {}) } : evt));
            setMoveOutMsgModal(null);
          }}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #3B82F6", background: "#3B82F6", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};
