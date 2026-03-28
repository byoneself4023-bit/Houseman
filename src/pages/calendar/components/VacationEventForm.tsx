import React from 'react';
import { inputStyle } from '@/components/Field';
import { TYPE_COLORS } from '../constants';
import { persistInsert } from '../calendarApi';

interface VacationEventFormProps {
  showForm: boolean;
  formType: string;
  formDate: string;
  setFormDate: (v: string) => void;
  formName: string;
  setFormName: (v: string) => void;
  setEvents: (fn: any) => void;
  setShowForm: (v: boolean) => void;
  currentStaff: Record<string, any> | null;
}

export const VacationEventForm: React.FC<VacationEventFormProps> = ({
  showForm, formType, formDate, setFormDate,
  formName, setFormName, setEvents, setShowForm, currentStaff,
}) => {
  if (!showForm || formType !== "휴무") return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => { setShowForm(false); setFormDate(""); setFormName(""); }}>
      <div style={{ background: "#FDFBFF", borderRadius: 16, padding: 24, width: 400, maxWidth: "95vw", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", border: "2px solid #8B5CF6" }}
        onClick={e => e.stopPropagation()}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23", marginBottom: 14 }}>🏖️ 휴무 등록</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
        <div style={{ minWidth: 160 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>휴무일</div>
          <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
            style={{ ...inputStyle, padding: "9px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
        </div>
        <div style={{ minWidth: 160 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>이름</div>
          <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="직원명"
            style={{ ...inputStyle, padding: "9px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
        </div>
        <button onClick={() => {
          if (!formDate) return alert("휴무일을 선택하세요");
          if (!formName) return alert("이름을 입력하세요");
          const now = new Date();
          const registeredAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
          const newEvt = { date: formDate, type: "휴무", name: formName, color: TYPE_COLORS["휴무"], registeredAt, registeredBy: currentStaff?.name || "알수없음" };
          persistInsert(newEvt).then((result) => {
            if (result?.data?.id) {
              setEvents((prev: any[]) => prev.map((e: any) => e === newEvt ? { ...e, supabaseId: result.data.id, source: 'supabase' } : e));
            }
          });
          setEvents((prev: any[]) => [...prev, newEvt]);
          setFormDate(""); setFormName(""); setShowForm(false);
        }}
          style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#8B5CF6", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          휴무 등록
        </button>
      </div>
      </div>
    </div>
  );
};
