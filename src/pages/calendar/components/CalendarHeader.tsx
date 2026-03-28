import React from 'react';
import { TYPE_COLORS, TYPE_BG, TYPE_ICON } from '../constants';

interface FilterTabsProps {
  filter: string;
  setFilter: (v: string) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ filter, setFilter }) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {(["전체", "계약", "퇴실", "휴무"] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{ padding: "6px 16px", borderRadius: 8, border: filter === t ? `2px solid ${TYPE_COLORS[t] || "#3B82F6"}` : "1px solid #E0E3E9", background: filter === t ? (TYPE_BG[t] || "#EFF6FF") : "#fff", color: filter === t ? (TYPE_COLORS[t] || "#2563EB") : "#5F6577", fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
            {t !== "전체" && <span style={{ marginRight: 4 }}>{TYPE_ICON[t]}</span>}{t}
          </button>
        ))}
      </div>
    </div>
  );
};

interface MonthNavigationProps {
  year: number;
  month: number;
  prevMonth: () => void;
  nextMonth: () => void;
  showForm: boolean;
  formType: string;
  setShowForm: (v: boolean) => void;
  setFormType: (v: string) => void;
  setSelectedVacancy: (v: any) => void;
  setVacancyEdits: (v: Record<string, any>) => void;
  setFormDate: (v: string) => void;
  setFormBuilding: (v: string) => void;
  setFormRoom: (v: string) => void;
  setFormName: (v: string) => void;
  selectedDay: number | null;
  setEvents?: (fn: any) => void;
}

export const MonthNavigation: React.FC<MonthNavigationProps> = ({
  year, month, prevMonth, nextMonth,
  showForm, formType, setShowForm, setFormType,
  setSelectedVacancy, setVacancyEdits, setFormDate,
  setFormBuilding, setFormRoom, setFormName,
  selectedDay, setEvents,
}) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>&#8249;</button>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1A1D23", margin: 0 }}>
          {year}년 {month + 1}월
        </h3>
        <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E0E3E9", background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>&#8250;</button>
      </div>
      {setEvents && (
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { type: "계약", label: "📦 계약등록", bg: "#3B82F6" },
            { type: "퇴실", label: "🚪 퇴실등록", bg: "#EF4444" },
            { type: "휴무", label: "🏖️ 휴무등록", bg: "#8B5CF6" },
          ].map(btn => {
            const isActive = showForm && formType === btn.type;
            return (
              <button key={btn.type} onClick={() => {
                if (isActive) { setShowForm(false); }
                else { setShowForm(true); setFormType(btn.type); setSelectedVacancy(null); setVacancyEdits({}); setFormDate(selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : new Date().toISOString().slice(0, 10)); setFormBuilding(""); setFormRoom(""); setFormName(""); }
              }}
                style={{ padding: "6px 12px", borderRadius: 8, border: isActive ? `2px solid ${btn.bg}` : "1px solid #E0E3E9", background: isActive ? "#fff" : btn.bg, color: isActive ? btn.bg : "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {isActive ? "✕ 닫기" : btn.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
