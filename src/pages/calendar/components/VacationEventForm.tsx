import React from 'react';
import { toast } from 'sonner';
import { inputClassName } from '@/components/Field';
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
    <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center"
      onClick={() => { setShowForm(false); setFormDate(""); setFormName(""); }}>
      <div className="bg-[#FDFBFF] rounded-2xl p-6 w-[400px] max-w-[95vw] shadow-[0_8px_32px_rgba(0,0,0,0.2)] border-2 border-[#8B5CF6]"
        onClick={e => e.stopPropagation()}>
      <div className="text-base font-bold text-hm-text mb-3.5">🏖️ 휴무 등록</div>
      <div className="flex gap-2.5 flex-wrap items-end">
        <div className="min-w-[160px]">
          <div className="text-xs font-bold text-hm-text-sub mb-1">휴무일</div>
          <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
            className={`${inputClassName} !py-[9px] !px-2.5 !text-xs bg-white`} />
        </div>
        <div className="min-w-[160px]">
          <div className="text-xs font-bold text-hm-text-sub mb-1">이름</div>
          <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="직원명"
            className={`${inputClassName} !py-[9px] !px-2.5 !text-xs bg-white`} />
        </div>
        <button onClick={() => {
          if (!formDate) { toast.error("휴무일을 선택하세요"); return; }
          if (!formName) { toast.error("이름을 입력하세요"); return; }
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
          className="py-[9px] px-5 rounded-lg border-none bg-[#8B5CF6] text-white text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap hover:bg-[#7C3AED] transition-colors">
          휴무 등록
        </button>
      </div>
      </div>
    </div>
  );
};
