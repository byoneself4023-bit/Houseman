import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { inputClassName } from '@/components/Field';
import { matchKorean } from '@/utils/koreanSearch';
import { TYPE_COLORS } from '../constants';
import { persistInsert } from '../calendarApi';

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
  const closeForm = () => { setShowForm(false); setFormBuildingSearch(""); setFormBuilding(""); setFormRoom(""); setFormDate(""); };

  useEffect(() => {
    if (!showForm || formType !== "퇴실") return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeForm(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showForm, formType]);

  if (!showForm || formType !== "퇴실") return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center"
      onClick={closeForm}>
      <div className="bg-[#FFFBFB] rounded-2xl p-6 w-[480px] max-w-[95vw] shadow-[0_8px_32px_rgba(0,0,0,0.2)] border-2 border-[#EF4444]"
        onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <div className="text-base font-bold text-hm-text">🚪 퇴실 등록</div>
        <button onClick={closeForm}
          className="bg-transparent border-none text-xl cursor-pointer text-hm-text-muted hover:text-hm-text transition-colors">✕</button>
      </div>
      <div className="flex gap-3 flex-wrap items-end">
        <div className="min-w-[160px]">
          <div className="text-xs font-bold text-hm-text-sub mb-1">퇴실일</div>
          <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
            className={`${inputClassName} !py-2.5 !px-2.5 !text-xs bg-white`} />
        </div>
        <div className="min-w-[160px] relative">
          <div className="text-xs font-bold text-hm-text-sub mb-1">건물</div>
          <input value={formBuildingSearch} onChange={e => {
              const v = e.target.value;
              setFormBuildingSearch(v);
              setFormBuilding("");
              setShowBuildingSuggestions(true);
            }}
            onFocus={() => setShowBuildingSuggestions(true)}
            onBlur={() => setTimeout(() => setShowBuildingSuggestions(false), 150)}
            placeholder="건물명 검색 (초성 가능)"
            className={`${inputClassName} !py-2.5 !px-2.5 !text-xs`}
            style={{ background: formBuilding ? "var(--color-hm-blue-bg)" : "#fff" }} />
          {showBuildingSuggestions && !formBuilding && (() => {
            const suggestions = BUILDING_NAMES.filter(b => !formBuildingSearch || matchKorean(b, formBuildingSearch));
            return suggestions.length > 0 ? (
              <div className="absolute top-full left-0 right-0 bg-white border border-hm-input-border rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)] z-[100] max-h-[180px] overflow-y-auto mt-0.5">
                {suggestions.map(b => (
                  <div key={b} onMouseDown={e => { e.preventDefault(); setFormBuilding(b); setFormBuildingSearch(b); setShowBuildingSuggestions(false); }}
                    className="py-2 px-3 text-xs cursor-pointer border-b border-[#F3F4F6] hover:bg-hm-blue-bg transition-colors">
                    {b}
                  </div>
                ))}
              </div>
            ) : formBuildingSearch ? (
              <div className="absolute top-full left-0 right-0 bg-white border border-hm-input-border rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)] z-[100] mt-0.5">
                <div className="py-2.5 px-3 text-xs text-hm-text-muted text-center">일치하는 건물이 없습니다</div>
              </div>
            ) : null;
          })()}
        </div>
        <div className="min-w-[100px]">
          <div className="text-xs font-bold text-hm-text-sub mb-1">호실</div>
          <input value={formRoom} onChange={e => setFormRoom(e.target.value)} placeholder="301"
            className={`${inputClassName} !py-2.5 !px-2.5 !text-xs bg-white`} />
        </div>
        <button onClick={() => {
          if (!formDate) { toast.error("퇴실일을 선택하세요"); return; }
          if (!formBuilding || !formRoom) { toast.error("건물, 호실을 입력하세요"); return; }
          const hasTenant = activeTenants.some((t: any) => t.building === formBuilding && String(t.room) === String(formRoom));
          if (!hasTenant) { toast.error(`${formBuilding} ${formRoom}호에 등록된 임차인이 없습니다.\n임차인이 있는 호실만 퇴실등록이 가능합니다.`); return; }
          const isVacant = activeVacancies.some((v: any) => v.building === formBuilding && String(v.room) === String(formRoom));
          if (isVacant) { toast.error("해당 호실은 공실관리에 등록된 호실입니다.\n공실에는 퇴실등록을 할 수 없습니다."); return; }
          const now = new Date();
          const registeredAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
          const newEvt = { date: formDate, type: "퇴실", building: formBuilding, room: formRoom, name: "", color: TYPE_COLORS["퇴실"], registeredAt, registeredBy: currentStaff?.name || "알수없음" };
          persistInsert(newEvt).then((result) => {
            if (result?.data?.id) {
              setEvents((prev: any[]) => prev.map((e: any) => e === newEvt ? { ...e, supabaseId: result.data.id, source: 'supabase' } : e));
            }
          });
          setEvents((prev: any[]) => [...prev, newEvt]);
          closeForm();
        }}
          className="py-2.5 px-5 rounded-lg border-none bg-[#EF4444] text-white text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-hm-danger transition-colors">
          퇴실 등록
        </button>
        <button onClick={closeForm}
          className="py-2.5 px-5 rounded-lg border border-hm-input-border bg-white text-hm-text-sub text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-hm-bg-hover transition-colors">
          취소
        </button>
      </div>
      </div>
    </div>
  );
};
