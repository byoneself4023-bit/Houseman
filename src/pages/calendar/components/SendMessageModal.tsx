import React from 'react';

interface SendMessageModalProps {
  pendingSendEvt: Record<string, any> | null;
  setPendingSendEvt: (v: any) => void;
  sendMsg: string;
  setSendMsg: (v: string) => void;
  selectedTemplate: string;
  setSelectedTemplate: (v: string) => void;
  buildContractMsg: (evt: Record<string, any>, template: string) => string;
  getTemplateKeys: (evt: Record<string, any>) => string[];
  handleSendSMS: (evt: Record<string, any>, msg: string) => void;
  handleSendKakao: (evt: Record<string, any>, msg: string) => void;
}

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  pendingSendEvt, setPendingSendEvt, sendMsg, setSendMsg,
  selectedTemplate, setSelectedTemplate,
  buildContractMsg, getTemplateKeys,
  handleSendSMS, handleSendKakao,
}) => {
  if (!pendingSendEvt) return null;

  const evt = pendingSendEvt;
  const tplKeys = getTemplateKeys(evt);
  const dep = Number(evt.deposit) || 0;
  const rent = Number(evt.rent) || 0;
  const mgmt = Number(evt.mgmt) || 0;
  const water = typeof evt.waterFee === "string" && !isNaN(Number(evt.waterFee)) ? Number(evt.waterFee) : 0;
  const cable = typeof evt.cable === "string" && !isNaN(Number(evt.cable)) ? Number(evt.cable) : 0;
  const total = dep + rent + mgmt + water + cable;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => setPendingSendEvt(null)}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 0, width: 480, maxWidth: "95vw", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
        onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #1E40AF, #3B82F6)", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>📤 계약정보 전송</div>
            <button onClick={() => setPendingSendEvt(null)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>✕</button>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
            {evt.building} {evt.room}호 → {evt.broker || "부동산"} ({evt.brokerPhone || "-"})
          </div>
          <div style={{ fontSize: 11, color: "#FDE68A", marginTop: 6, fontWeight: 600 }}>
            부동산에 보내는 계약 메시지입니다.
          </div>
        </div>

        <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
          {/* 계약 요약 카드 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
            {[
              { label: "예치금", value: `${dep}만`, color: "#059669" },
              { label: "월세", value: `${rent}만`, color: "#2563EB" },
              { label: "입주금 총합", value: `${total}만`, color: "#DC2626" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: s.color + "08", border: `1px solid ${s.color}25`, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#8F95A3", fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* 템플릿 선택 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {tplKeys.map(tpl => (
              <button key={tpl} onClick={() => { setSelectedTemplate(tpl); setSendMsg(buildContractMsg(evt, tpl)); }}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  border: selectedTemplate === tpl ? "2px solid #3B82F6" : "1px solid #E0E3E9",
                  background: selectedTemplate === tpl ? (tpl === "건물 계약문자" ? "#EFF6FF" : "#EFF6FF") : "#fff",
                  color: selectedTemplate === tpl ? "#1E40AF" : "#5F6577",
                  boxShadow: selectedTemplate === tpl ? "0 2px 8px rgba(59,130,246,0.15)" : "none",
                }}>
                {tpl === "건물 계약문자" ? `🏢 ${evt.building} 전용` : tpl}
              </button>
            ))}
          </div>

          {/* 메시지 편집 영역 */}
          <textarea value={sendMsg} onChange={e => setSendMsg(e.target.value)}
            style={{ width: "100%", minHeight: 260, padding: 14, borderRadius: 10, border: "1.5px solid #E0E3E9", fontSize: 12.5, fontFamily: "inherit", lineHeight: 1.8, color: "#1A1D23", resize: "vertical", boxSizing: "border-box", background: "#FAFBFC" }} />
          <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 4, textAlign: "right" }}>
            전송 전 내용을 자유롭게 수정할 수 있습니다
          </div>
        </div>

        {/* 전송 버튼 */}
        <div style={{ padding: "14px 24px 18px", borderTop: "1px solid #F0F2F5", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { handleSendSMS(evt, sendMsg); setPendingSendEvt(null); }}
              style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              💬 문자(SMS) 전송
            </button>
            <button onClick={() => { handleSendKakao(evt, sendMsg); setPendingSendEvt(null); }}
              style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: "none", background: "#FEE500", color: "#3C1E1E", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              💛 카카오톡 복사
            </button>
          </div>
          <button onClick={() => setPendingSendEvt(null)}
            style={{ width: "100%", padding: "10px 16px", borderRadius: 10, border: "1px solid #E0E3E9", background: "#fff", color: "#8F95A3", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            나중에 전송
          </button>
        </div>
      </div>
    </div>
  );
};
