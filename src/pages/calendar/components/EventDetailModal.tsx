import React from 'react';
import { inputStyle } from '@/components/Field';

interface EventDetailModalProps {
  editEvent: { idx: number; evt: Record<string, any>; edits: Record<string, any> } | null;
  setEditEvent: (v: any) => void;
  setEvents: (fn: any) => void;
  saveEditEvent: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  editEvent, setEditEvent, setEvents, saveEditEvent,
}) => {
  if (!editEvent) return null;

  const { edits } = editEvent;
  const edt = (k: string, v: any) => setEditEvent((prev: any) => ({ ...prev, edits: { ...prev.edits, [k]: v } }));
  const fld = (label: string, key: string, type = "text") => (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>{label}</div>
      <input value={edits[key] || ""} onChange={e => edt(key, type === "number" ? Number(e.target.value) || 0 : e.target.value)}
        type={type} style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => setEditEvent(null)}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 420, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1D23" }}>✏️ {edits.type} 수정</div>
          <button onClick={() => setEditEvent(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8F95A3" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* 공통: 날짜 */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>날짜</div>
            <input type="date" value={edits.date || ""} onChange={e => {
              edt("date", e.target.value);
              if (edits.type === "계약" && edits.moveIn === editEvent.evt.date) edt("moveIn", e.target.value);
            }} style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
          </div>

          {/* 계약 */}
          {edits.type === "계약" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {fld("건물명", "building")}
                {fld("호실", "room")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {fld("보증금 (만원)", "deposit", "number")}
                {fld("월세 (만원)", "rent", "number")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {fld("NEGO (만원)", "nego", "number")}
                {fld("관리비 (만원)", "mgmt", "number")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>입주일</div>
                  <input type="date" value={edits.moveIn || ""} onChange={e => edt("moveIn", e.target.value)}
                    style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>만기일</div>
                  <input type="date" value={edits.expiry || ""} onChange={e => edt("expiry", e.target.value)}
                    style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>계약일</div>
                  <input type="date" value={edits.contractDate || ""} onChange={e => edt("contractDate", e.target.value)}
                    style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 3 }}>등록자</div>
                  <input value={edits.registeredBy || ""} readOnly
                    style={{ ...inputStyle, padding: "8px 10px", fontSize: 12, background: "#F3F4F6", color: "#8F95A3" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {fld("부동산", "broker")}
                {fld("부동산 연락처", "brokerPhone")}
              </div>
              {(edits.water != null || edits.cable != null || edits.exitFee != null || edits.commBroker != null) && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", marginTop: 4 }}>단기 전용</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {fld("수도", "water")}
                    {fld("인터넷/케이블", "cable")}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {fld("퇴실청소비 (만원)", "exitFee", "number")}
                    {fld("중개수수료 (%)", "commBroker", "number")}
                  </div>
                </>
              )}
            </>
          )}

          {/* 퇴실 */}
          {edits.type === "퇴실" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {fld("건물명", "building")}
                {fld("호실", "room")}
              </div>
            </>
          )}

          {/* 휴무 */}
          {edits.type === "휴무" && (
            <>
              {fld("이름", "name")}
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
          <button onClick={() => { const idx = editEvent.idx; setEditEvent(null); setEvents((prev: any[]) => prev.filter((_: any, j: number) => j !== idx)); }}
            style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            일정삭제
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setEditEvent(null)}
              style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", color: "#5F6577", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              취소
            </button>
            <button onClick={saveEditEvent}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
