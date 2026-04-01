import React from 'react';
import { TYPE_COLORS, TYPE_BG, TYPE_ICON } from '../constants';

interface FilterTabsProps {
  filter: string;
  setFilter: (v: string) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ filter, setFilter }) => {
  return (
    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
      <div className="flex gap-1.5">
        {(["전체", "계약", "퇴실", "휴무"] as const).map(t => {
          const isActive = filter === t;
          const activeColor = TYPE_COLORS[t] || "var(--color-hm-blue)";
          const activeBg = TYPE_BG[t] || "var(--color-hm-blue-bg)";
          return (
            <button key={t} onClick={() => setFilter(t)}
              className="px-4 py-1.5 rounded-lg font-semibold text-[12.5px] cursor-pointer font-[inherit] transition-colors"
              style={{
                border: isActive ? `2px solid ${activeColor}` : "1px solid var(--color-hm-input-border)",
                background: isActive ? activeBg : "#fff",
                color: isActive ? activeColor : "var(--color-hm-text-sub)",
              }}>
              {t !== "전체" && <span className="mr-1">{TYPE_ICON[t]}</span>}{t}
            </button>
          );
        })}
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
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <button onClick={prevMonth} className="w-9 h-9 rounded-lg border border-hm-input-border bg-white cursor-pointer text-base flex items-center justify-center font-[inherit] hover:bg-hm-bg-hover transition-colors">&#8249;</button>
        <h3 className="text-lg font-extrabold text-hm-text m-0">
          {year}년 {month + 1}월
        </h3>
        <button onClick={nextMonth} className="w-9 h-9 rounded-lg border border-hm-input-border bg-white cursor-pointer text-base flex items-center justify-center font-[inherit] hover:bg-hm-bg-hover transition-colors">&#8250;</button>
      </div>
      {setEvents && (
        <div className="flex gap-1.5">
          {[
            { type: "계약", label: "📦 계약등록", bg: "var(--color-hm-blue)" },
            { type: "퇴실", label: "🚪 퇴실등록", bg: "#EF4444" },
            { type: "휴무", label: "🏖️ 휴무등록", bg: "#8B5CF6" },
          ].map(btn => {
            const isActive = showForm && formType === btn.type;
            return (
              <button key={btn.type} onClick={() => {
                if (isActive) { setShowForm(false); }
                else { setShowForm(true); setFormType(btn.type); setSelectedVacancy(null); setVacancyEdits({}); setFormDate(selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : new Date().toISOString().slice(0, 10)); setFormBuilding(""); setFormRoom(""); setFormName(""); }
              }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer font-[inherit] transition-all hover:opacity-90"
                style={{
                  border: isActive ? `2px solid ${btn.bg}` : "1px solid var(--color-hm-input-border)",
                  background: isActive ? "#fff" : btn.bg,
                  color: isActive ? btn.bg : "#fff",
                }}>
                {isActive ? "✕ 닫기" : btn.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
