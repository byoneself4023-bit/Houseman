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
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
      onClick={() => setContractReport(null)}>
      <div onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        style={{ width: isMobile ? "92%" : 480 }}>
        <div className="text-base font-bold text-hm-text mb-4 flex items-center justify-between">
          <span>📩 건물주 보고 — {ev.building} {ev.room}호</span>
          <button onClick={() => setContractReport(null)} className="w-7 h-7 rounded-md border border-hm-input-border bg-white cursor-pointer text-sm font-[inherit] hover:bg-hm-bg-hover transition-colors">✕</button>
        </div>
        <div className="mb-3">
          <div className="text-xs font-bold text-purple-600 mb-1.5">👤 건물주 정보</div>
          {owners.map((o: any, oi: number) => (
            <div key={oi} className="flex gap-2 mb-1 text-xs">
              <span className="font-bold">{o.name || `건물주${oi + 1}`}</span>
              <span className="text-hm-blue">{o.phone || "연락처 미등록"}</span>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <div className="text-xs font-bold text-hm-success mb-1.5">💬 전송 내용</div>
          <textarea id="contract-report-msg" defaultValue={msgText} rows={14}
            className="w-full p-3 rounded-lg border-[1.5px] border-hm-input-border text-xs font-[inherit] resize-y leading-relaxed box-border outline-none focus:ring-2 focus:ring-ring transition-colors" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
            const msg = (document.getElementById("contract-report-msg") as HTMLTextAreaElement)?.value || msgText;
            if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
            window.open(`sms:${ownerPhone}?body=${encodeURIComponent(msg)}`, "_blank");
            setEvents?.((prev: any[]) => prev.map((e: any) => (e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room)) ? { ...e, reported: true } : e));
            setContractReport(null);
          }}
            className="flex-1 py-3 rounded-lg border-none bg-hm-blue text-white font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-blue-dark transition-colors">
            📱 문자 보내기
          </button>
          <button onClick={() => {
            const msg = (document.getElementById("contract-report-msg") as HTMLTextAreaElement)?.value || msgText;
            if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
            window.open(`https://story.kakao.com/share?url=&text=${encodeURIComponent(msg)}`, "_blank");
            setEvents?.((prev: any[]) => prev.map((e: any) => (e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room)) ? { ...e, reported: true } : e));
            setContractReport(null);
          }}
            className="flex-1 py-3 rounded-lg border-none bg-[#FEE500] text-[#3C1E1E] font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
            💬 카카오톡
          </button>
          <button onClick={() => {
            const msg = (document.getElementById("contract-report-msg") as HTMLTextAreaElement)?.value || msgText;
            navigator.clipboard.writeText(msg);
            setEvents?.((prev: any[]) => prev.map((e: any) => (e.type === "계약" && e.building === ev.building && String(e.room) === String(ev.room)) ? { ...e, reported: true } : e));
            toast.success("메시지가 클립보드에 복사되었습니다.");
          }}
            className="px-4 py-3 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
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
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
      onClick={() => setMoveOutOwnerReport(null)}>
      <div onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        style={{ width: isMobile ? "92%" : 480 }}>
        <div className="text-base font-bold text-hm-text mb-4 flex items-center justify-between">
          <span>📞 퇴실 건물주연락 — {ev.building} {ev.room}호</span>
          <button onClick={() => setMoveOutOwnerReport(null)} className="w-7 h-7 rounded-md border border-hm-input-border bg-white cursor-pointer text-sm font-[inherit] hover:bg-hm-bg-hover transition-colors">✕</button>
        </div>
        <div className="mb-3">
          <div className="text-xs font-bold text-purple-600 mb-1.5">👤 건물주 정보</div>
          {owners.map((o: any, oi: number) => (
            <div key={oi} className="flex gap-2 mb-1 text-xs">
              <span className="font-bold">{o.name || `건물주${oi + 1}`}</span>
              <span className="text-hm-blue">{o.phone || "연락처 미등록"}</span>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <div className="text-xs font-bold text-hm-danger mb-1.5">💬 퇴실정산 내용</div>
          <textarea id="moveout-owner-msg" defaultValue={msgText} rows={14}
            className="w-full p-3 rounded-lg border-[1.5px] border-hm-input-border text-xs font-[inherit] resize-y leading-relaxed box-border outline-none focus:ring-2 focus:ring-ring transition-colors" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
            const msg = (document.getElementById("moveout-owner-msg") as HTMLTextAreaElement)?.value || msgText;
            if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
            window.open(`sms:${ownerPhone}?body=${encodeURIComponent(msg)}`, "_blank");
            setEvents?.((prev: any[]) => prev.map((e: any) => (e.type === "퇴실" && e.building === ev.building && String(e.room) === String(ev.room)) ? { ...e, ownerReported: true, ownerReportMsg: msg } : e));
            setMoveOutOwnerReport(null);
          }}
            className="flex-1 py-3 rounded-lg border-none bg-purple-600 text-white font-bold text-sm cursor-pointer font-[inherit] hover:bg-purple-700 transition-colors">
            📱 문자 보내기
          </button>
          <button onClick={() => {
            const msg = (document.getElementById("moveout-owner-msg") as HTMLTextAreaElement)?.value || msgText;
            if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
            window.open(`https://story.kakao.com/share?url=&text=${encodeURIComponent(msg)}`, "_blank");
            setEvents?.((prev: any[]) => prev.map((e: any) => (e.type === "퇴실" && e.building === ev.building && String(e.room) === String(ev.room)) ? { ...e, ownerReported: true, ownerReportMsg: msg } : e));
            setMoveOutOwnerReport(null);
          }}
            className="flex-1 py-3 rounded-lg border-none bg-[#FEE500] text-[#3C1E1E] font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
            💬 카카오톡
          </button>
          <button onClick={() => {
            const msg = (document.getElementById("moveout-owner-msg") as HTMLTextAreaElement)?.value || msgText;
            navigator.clipboard.writeText(msg);
            setEvents?.((prev: any[]) => prev.map((e: any) => (e.type === "퇴실" && e.building === ev.building && String(e.room) === String(ev.room)) ? { ...e, ownerReported: true, ownerReportMsg: msg } : e));
            toast.success("메시지가 클립보드에 복사되었습니다.");
          }}
            className="px-4 py-3 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
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
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
      onClick={() => setBreakReport(null)}>
      <div onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        style={{ width: isMobile ? "92%" : 480 }}>
        <div className="text-base font-bold text-hm-text mb-4 flex items-center justify-between">
          <span>📩 계약파기 {breakReport.targetBroker ? "부동산 안내" : "건물주 보고"} — {ev.building} {ev.room}호</span>
          <button onClick={() => setBreakReport(null)} className="w-7 h-7 rounded-md border border-hm-input-border bg-white cursor-pointer text-sm font-[inherit] hover:bg-hm-bg-hover transition-colors">✕</button>
        </div>
        <div className="mb-3">
          <div className="text-xs font-bold text-purple-600 mb-1.5">{breakReport.targetBroker ? "🏠 부동산 정보" : "👤 건물주 정보"}</div>
          {owners.map((o: any, oi: number) => (
            <div key={oi} className="flex gap-2 mb-1 text-xs">
              <span className="font-bold">{o.name || (breakReport.targetBroker ? "부동산" : `건물주${oi + 1}`)}</span>
              <span className="text-hm-blue">{o.phone || "연락처 미등록"}</span>
            </div>
          ))}
        </div>
        {!breakReport.targetBroker && <div className="mb-3">
          <div className="text-xs font-bold text-hm-danger mb-1.5">💰 계약금 (만원)</div>
          <input id="break-deposit-amt" type="number" placeholder="계약금 입력"
            onChange={e => {
              const amt = e.target.value;
              const ta = document.getElementById("break-report-msg") as HTMLTextAreaElement;
              if (ta) {
                ta.value = ta.value.replace(/※ 계약금.*입금 후 파기 건입니다\./, `※ 계약금 ${amt ? amt + "만원 " : ""}입금 후 파기 건입니다.`);
              }
            }}
            className="w-full px-3 py-2 rounded-lg border-[1.5px] border-red-200 text-xs font-[inherit] bg-hm-danger-bg box-border outline-none focus:ring-2 focus:ring-ring transition-colors" />
        </div>}
        <div className="mb-4">
          <div className="text-xs font-bold text-hm-danger mb-1.5">💬 전송 내용</div>
          <textarea id="break-report-msg" defaultValue={msgText} rows={14}
            className="w-full p-3 rounded-lg border-[1.5px] border-hm-input-border text-xs font-[inherit] resize-y leading-relaxed box-border outline-none focus:ring-2 focus:ring-ring transition-colors" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
            const msg = (document.getElementById("break-report-msg") as HTMLTextAreaElement)?.value || msgText;
            if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
            window.open(`sms:${ownerPhone}?body=${encodeURIComponent(msg)}`, "_blank");
            setBreakReport(null);
          }}
            className="flex-1 py-3 rounded-lg border-none bg-hm-blue text-white font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-blue-dark transition-colors">
            📱 문자 보내기
          </button>
          <button onClick={() => {
            const msg = (document.getElementById("break-report-msg") as HTMLTextAreaElement)?.value || msgText;
            if (!ownerPhone) { toast.error("건물주 연락처가 등록되지 않았습니다.\n건물 호실정보에서 건물주 연락처를 등록해주세요."); return; }
            window.open(`https://story.kakao.com/share?url=&text=${encodeURIComponent(msg)}`, "_blank");
            setBreakReport(null);
          }}
            className="flex-1 py-3 rounded-lg border-none bg-[#FEE500] text-[#3C1E1E] font-bold text-sm cursor-pointer font-[inherit] hover:opacity-90 transition-opacity">
            💬 카카오톡
          </button>
          <button onClick={() => {
            const msg = (document.getElementById("break-report-msg") as HTMLTextAreaElement)?.value || msgText;
            navigator.clipboard.writeText(msg);
            toast.success("메시지가 클립보드에 복사되었습니다.");
          }}
            className="px-4 py-3 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub font-bold text-sm cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
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
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center"
      onClick={() => setMoveOutMsgModal(null)}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-[480px] max-w-[90vw] max-h-[80vh] overflow-auto shadow-[0_20px_60px_rgba(0,0,0,.3)]">
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-bold text-hm-text">📩 퇴실문자 — {moveOutMsgModal.ev.building} {moveOutMsgModal.ev.room}호</div>
          <button onClick={() => setMoveOutMsgModal(null)} className="bg-transparent border-none text-xl cursor-pointer text-hm-text-muted hover:text-hm-text transition-colors">✕</button>
        </div>
        <textarea
          value={moveOutMsgModal.text}
          onChange={e => setMoveOutMsgModal((prev: any) => ({ ...prev, text: e.target.value }))}
          placeholder="수령한 퇴실문자 내용을 입력하세요..."
          className="w-full min-h-[180px] px-3.5 py-3 rounded-lg border-[1.5px] border-hm-input-border text-xs leading-[1.7] resize-y font-[inherit] outline-none box-border focus:ring-2 focus:ring-ring transition-colors"
        />
        <div className="flex justify-end gap-2 mt-3">
          {moveOutMsgModal.ev.moveOutMsg && (
            <button onClick={() => {
              const orig = moveOutMsgModal.ev._origEvent;
              const idx = calendarEvents.indexOf(orig);
              if (idx > -1 && setEvents) setEvents((prev: any[]) => prev.map((evt: any, j: number) => j === idx ? { ...evt, moveOutMsg: "" } : evt));
              setMoveOutMsgModal(null);
            }}
              className="px-[18px] py-2 rounded-lg border-[1.5px] border-red-200 bg-hm-danger-bg text-hm-danger text-xs font-bold cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">
              삭제
            </button>
          )}
          <button onClick={() => setMoveOutMsgModal(null)}
            className="px-[18px] py-2 rounded-lg border-[1.5px] border-hm-input-border bg-white text-hm-text-sub text-xs font-bold cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
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
            className="px-[18px] py-2 rounded-lg border-[1.5px] border-hm-blue bg-hm-blue text-white text-xs font-bold cursor-pointer font-[inherit] hover:bg-hm-blue-dark transition-colors">
            저장
          </button>
        </div>
      </div>
    </div>
  );
};
