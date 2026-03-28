import React from 'react';
import { inputStyle } from '@/components/Field';
import { matchKorean } from '@/utils/koreanSearch';
import { TYPE_COLORS } from '../constants';

interface MoveOutEventFormProps {
  showForm: boolean;
  formType: string;
  formDate: string;
  setFormDate: (v: string) => void;
  formBuilding: string;
  setFormBuilding: (v: string) => void;
  formBuildingSearch: string;
  setFormBuildingSearch: (v: string) => void;
  showBuildingSuggestions: boolean;
  setShowBuildingSuggestions: (v: boolean) => void;
  formRoom: string;
  setFormRoom: (v: string) => void;
  BUILDING_NAMES: string[];
  activeTenants: Record<string, any>[];
  activeVacancies: Record<string, any>[];
  setEvents: (fn: any) => void;
  setShowForm: (v: boolean) => void;
  currentStaff: Record<string, any> | null;
}

export const MoveOutEventForm: React.FC<MoveOutEventFormProps> = ({
  showForm, formType, formDate, setFormDate,
  formBuilding, setFormBuilding, formBuildingSearch, setFormBuildingSearch,
  showBuildingSuggestions, setShowBuildingSuggestions,
  formRoom, setFormRoom, BUILDING_NAMES,
  activeTenants, activeVacancies, setEvents, setShowForm, currentStaff,
}) => {
  if (!showForm || formType !== "퇴실") return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => { setShowForm(false); setFormBuildingSearch(""); setFormBuilding(""); setFormRoom(""); setFormDate(""); }}>
      <div style={{ background: "#FFFBFB", borderRadius: 16, padding: 24, width: 480, maxWidth: "95vw", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", border: "2px solid #EF4444" }}
        onClick={e => e.stopPropagation()}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23", marginBottom: 14 }}>🚪 퇴실 등록</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
        <div style={{ minWidth: 160 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>퇴실일</div>
          <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
            style={{ ...inputStyle, padding: "9px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
        </div>
        <div style={{ minWidth: 160, position: "relative" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>건물</div>
          <input value={formBuildingSearch} onChange={e => {
              const v = e.target.value;
              setFormBuildingSearch(v);
              setFormBuilding("");
              setShowBuildingSuggestions(true);
            }}
            onFocus={() => setShowBuildingSuggestions(true)}
            onBlur={() => setTimeout(() => setShowBuildingSuggestions(false), 150)}
            placeholder="건물명 검색 (초성 가능)"
            style={{ ...inputStyle, padding: "9px 10px", fontSize: 12, width: "100%", background: formBuilding ? "#EFF6FF" : "#fff" }} />
          {formBuilding && <div style={{ fontSize: 10, color: "#3B82F6", fontWeight: 700, marginTop: 2 }}>{formBuilding}</div>}
          {showBuildingSuggestions && !formBuilding && (() => {
            const suggestions = BUILDING_NAMES.filter(b => !formBuildingSearch || matchKorean(b, formBuildingSearch));
            return suggestions.length > 0 ? (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #E0E3E9", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: 180, overflowY: "auto", marginTop: 2 }}>
                {suggestions.map(b => (
                  <div key={b} onMouseDown={e => { e.preventDefault(); setFormBuilding(b); setFormBuildingSearch(b); setShowBuildingSuggestions(false); }}
                    style={{ padding: "8px 12px", fontSize: 12, cursor: "pointer", borderBottom: "1px solid #F3F4F6" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    {b}
                  </div>
                ))}
              </div>
            ) : formBuildingSearch ? (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #E0E3E9", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, marginTop: 2 }}>
                <div style={{ padding: "10px 12px", fontSize: 11, color: "#8F95A3", textAlign: "center" }}>일치하는 건물이 없습니다</div>
              </div>
            ) : null;
          })()}
        </div>
        <div style={{ minWidth: 100 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#5F6577", marginBottom: 4 }}>호실</div>
          <input value={formRoom} onChange={e => setFormRoom(e.target.value)} placeholder="301"
            style={{ ...inputStyle, padding: "9px 10px", fontSize: 12, width: "100%", background: "#fff" }} />
        </div>
        <button onClick={() => {
          if (!formDate) return alert("퇴실일을 선택하세요");
          if (!formBuilding || !formRoom) return alert("건물, 호실을 입력하세요");
          const hasTenant = activeTenants.some((t: any) => t.building === formBuilding && String(t.room) === String(formRoom));
          if (!hasTenant) return alert(`${formBuilding} ${formRoom}호에 등록된 임차인이 없습니다.\n임차인이 있는 호실만 퇴실등록이 가능합니다.`);
          const isVacant = activeVacancies.some((v: any) => v.building === formBuilding && String(v.room) === String(formRoom));
          if (isVacant) return alert("해당 호실은 공실관리에 등록된 호실입니다.\n공실에는 퇴실등록을 할 수 없습니다.");
          const now = new Date();
          const registeredAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
          setEvents((prev: any[]) => [...prev, { date: formDate, type: "퇴실", building: formBuilding, room: formRoom, name: "", color: TYPE_COLORS["퇴실"], registeredAt, registeredBy: currentStaff?.name || "알수없음" }]);
          setFormDate(""); setFormBuilding(""); setFormBuildingSearch(""); setFormRoom(""); setShowForm(false);
        }}
          style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#EF4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          퇴실 등록
        </button>
      </div>
      </div>
    </div>
  );
};
