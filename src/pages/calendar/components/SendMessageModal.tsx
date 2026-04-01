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
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center"
      onClick={() => setPendingSendEvt(null)}>
      <div className="bg-white rounded-2xl w-[480px] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
        onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="px-6 py-[18px] text-white" style={{ background: "linear-gradient(135deg, #1E40AF, var(--color-hm-blue))" }}>
          <div className="flex justify-between items-center">
            <div className="text-lg font-bold tracking-tight">📤 계약정보 전송</div>
            <button onClick={() => setPendingSendEvt(null)} className="w-7 h-7 rounded-md border border-white/30 bg-white/10 text-white text-sm cursor-pointer flex items-center justify-center font-[inherit] hover:bg-white/20 transition-colors">✕</button>
          </div>
          <div className="text-xs text-white/80 mt-1">
            {evt.building} {evt.room}호 → {evt.broker || "부동산"} ({evt.brokerPhone || "-"})
          </div>
          <div className="text-xs text-[#FDE68A] mt-1.5 font-semibold">
            부동산에 보내는 계약 메시지입니다.
          </div>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {/* 계약 요약 카드 */}
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {[
              { label: "예치금", value: `${dep}만`, color: "var(--color-hm-success)" },
              { label: "월세", value: `${rent}만`, color: "var(--color-hm-blue-dark)" },
              { label: "입주금 총합", value: `${total}만`, color: "var(--color-hm-danger)" },
            ].map((s, i) => (
              <div key={i} className="py-2 px-2.5 rounded-lg text-center"
                style={{ background: s.color + "08", border: `1px solid ${s.color}25` }}>
                <div className="text-xs text-hm-text-muted font-semibold mb-1">{s.label}</div>
                <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* 템플릿 선택 */}
          <div className="flex gap-1.5 mb-2.5 flex-wrap">
            {tplKeys.map(tpl => (
              <button key={tpl} onClick={() => { setSelectedTemplate(tpl); setSendMsg(buildContractMsg(evt, tpl)); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer font-[inherit] transition-all ${
                  selectedTemplate === tpl
                    ? 'border-2 border-hm-blue bg-hm-blue-bg text-[#1E40AF] shadow-[0_2px_8px_rgba(59,130,246,0.15)]'
                    : 'border border-hm-input-border bg-white text-hm-text-sub shadow-none hover:bg-hm-bg-hover'
                }`}>
                {tpl === "건물 계약문자" ? `🏢 ${evt.building} 전용` : tpl}
              </button>
            ))}
          </div>

          {/* 메시지 편집 영역 */}
          <textarea value={sendMsg} onChange={e => setSendMsg(e.target.value)}
            className="w-full min-h-[260px] p-3.5 rounded-[10px] border-[1.5px] border-hm-input-border text-[12.5px] font-[inherit] leading-[1.8] text-hm-text resize-y box-border bg-[#FAFBFC] outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors" />
          <div className="text-xs text-hm-text-muted mt-1 text-right">
            전송 전 내용을 자유롭게 수정할 수 있습니다
          </div>
        </div>

        {/* 전송 버튼 */}
        <div className="px-6 pt-3.5 pb-[18px] border-t border-[#F0F2F5] flex flex-col gap-2">
          <div className="flex gap-2">
            <button onClick={() => { handleSendSMS(evt, sendMsg); setPendingSendEvt(null); }}
              className="flex-1 py-[13px] px-4 rounded-[10px] border-none text-white text-sm font-bold cursor-pointer font-[inherit] hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, var(--color-hm-blue), var(--color-hm-blue-dark))" }}>
              💬 문자(SMS) 전송
            </button>
            <button onClick={() => { handleSendKakao(evt, sendMsg); setPendingSendEvt(null); }}
              className="flex-1 py-[13px] px-4 rounded-[10px] border-none bg-[#FEE500] text-[#3C1E1E] text-sm font-bold cursor-pointer font-[inherit] hover:bg-[#EDD600] transition-colors">
              💛 카카오톡 복사
            </button>
          </div>
          <button onClick={() => setPendingSendEvt(null)}
            className="w-full py-2.5 px-4 rounded-[10px] border border-hm-input-border bg-white text-hm-text-muted text-xs font-semibold cursor-pointer font-[inherit] hover:bg-hm-bg-hover transition-colors">
            나중에 전송
          </button>
        </div>
      </div>
    </div>
  );
};
