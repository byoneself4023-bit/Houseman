import React from 'react';
import { TYPE_BG, TYPE_COLORS, TYPE_ICON } from '../constants';
import { useIsMobile } from '@/utils';
import { persistUpdate } from '../calendarApi';

interface CalendarGridProps {
  days: (number | null)[];
  year: number;
  month: number;
  firstDay: number;
  selectedDay: number | null;
  setSelectedDay: (d: number | null) => void;
  getEvents: (day: number) => Record<string, any>[];
  isToday: (d: number) => boolean;
  setEvents?: (fn: any) => void;
  openEditEvent: (evt: Record<string, any>) => void;
  dropTargetDay: number | null;
  setDropTargetDay: (d: number | null) => void;
  setDragEventIndex: (v: any) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days, year, month, firstDay, selectedDay, setSelectedDay,
  getEvents, isToday, setEvents, openEditEvent,
  dropTargetDay, setDropTargetDay, setDragEventIndex,
}) => {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Day Headers */}
      <div className={`grid grid-cols-7 mb-1 ${isMobile ? 'gap-px' : 'gap-0.5'}`}>
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div key={i} className={`text-center font-bold ${isMobile ? 'text-xs py-1' : 'text-[11.5px] py-2'} ${i === 0 ? 'text-red-500' : i === 6 ? 'text-hm-blue' : 'text-hm-text-muted'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Day Cells */}
      <div className={`grid grid-cols-7 ${isMobile ? 'gap-px' : 'gap-0.5'}`}>
        {days.map((day, i) => {
          if (!day) return <div key={i} className={isMobile ? 'min-h-[72px]' : 'min-h-[120px]'} />;
          const evts = getEvents(day);
          const dayOfWeek = (firstDay + day - 1) % 7;
          const selected = selectedDay === day;
          const isDrop = dropTargetDay === day;
          return (
            <div key={i} onClick={() => setSelectedDay(selectedDay === day ? null : day)}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
              onDragEnter={e => { e.preventDefault(); setDropTargetDay(day); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTargetDay(null); }}
              onDrop={e => {
                e.preventDefault();
                setDropTargetDay(null);
                if (!setEvents) return;
                const newDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                try {
                  const raw = e.dataTransfer.getData("text/plain");
                  if (!raw) return;
                  const d = JSON.parse(raw);
                  if (d.date === newDate) { setDragEventIndex(null); return; }
                  let matched = false;
                  setEvents((prev: any[]) => prev.map((evt: any) => {
                    if (!matched && evt.date === d.date && evt.type === d.type
                      && (evt.building || "") === d.building && (evt.room || "") === d.room && (evt.name || "") === d.name) {
                      matched = true;
                      const updated = { ...evt, date: newDate };
                      if (evt.moveIn && evt.moveIn === d.date) updated.moveIn = newDate;
                      persistUpdate(evt.supabaseId, { date: newDate, ...(updated.moveIn !== evt.moveIn ? { moveIn: updated.moveIn } : {}) });
                      return updated;
                    }
                    return evt;
                  }));
                } catch(err) { console.warn("drag-drop error:", err); }
                setDragEventIndex(null);
                setSelectedDay(day);
              }}
              className={`cursor-pointer transition-all ${isMobile ? 'min-h-[72px] px-[3px] py-[2px] rounded' : 'min-h-[120px] px-1.5 py-1 rounded-lg'} ${
                isDrop ? 'bg-blue-100 border-2 border-dashed border-hm-blue' :
                selected ? 'bg-hm-blue-bg border-2 border-solid border-hm-blue' :
                isToday(day) ? 'bg-amber-50 border border-solid border-amber-200' :
                'border border-solid border-[#F0F2F5] hover:bg-hm-bg-hover'
              }`}
              onMouseEnter={e => !selected && !isDrop && !isToday(day) && e.currentTarget.classList.add('bg-hm-bg-hover')}
              onMouseLeave={e => !selected && !isDrop && !isToday(day) && e.currentTarget.classList.remove('bg-hm-bg-hover')}>
              <div className={`text-xs mb-[3px] ${isToday(day) ? 'font-bold' : 'font-semibold'} ${dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-hm-blue' : 'text-hm-text'}`}>
                {day}
                {isToday(day) && <span className="text-[8px] bg-amber-500 text-white px-1 py-px rounded-[3px] ml-[3px] font-bold">오늘</span>}
              </div>
              <div className="flex flex-col gap-0.5">
                {evts.slice(0, 3).map((evt, ei) => (
                  <div key={ei}
                    draggable={!!setEvents}
                    onClick={e => e.stopPropagation()}
                    onDoubleClick={e => { e.stopPropagation(); if (setEvents) openEditEvent(evt); }}
                    onDragStart={e => {
                      setDragEventIndex(true);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", JSON.stringify({ date: evt.date, type: evt.type, building: evt.building || "", room: evt.room || "", name: evt.name || "" }));
                      e.currentTarget.style.opacity = "0.4";
                    }}
                    onDragEnd={e => { e.currentTarget.style.opacity = "1"; setDragEventIndex(null); setDropTargetDay(null); }}
                    className={`font-semibold rounded whitespace-nowrap overflow-hidden text-ellipsis ${isMobile ? 'text-[8px] px-[2px] py-px' : 'text-[9.5px] px-1 py-0.5'}`}
                    style={{ background: TYPE_BG[evt.type], color: TYPE_COLORS[evt.type], cursor: setEvents ? "grab" : "default" }}>
                    {TYPE_ICON[evt.type]} {evt.type === "휴무" ? evt.name : `${evt.building} ${evt.room}`}
                  </div>
                ))}
                {evts.length > 3 && <div className="text-xs text-hm-text-muted text-center">+{evts.length - 3}건</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
