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
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#8F95A3", padding: "8px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day Cells */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(7, 1fr)", gap: 2 }}>
        {days.map((day, i) => {
          if (!day) return <div key={i} style={{ minHeight: 120 }} />;
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
              style={{
                minHeight: 120, padding: "4px 6px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
                background: isDrop ? "#DBEAFE" : selected ? "#EFF6FF" : isToday(day) ? "#FFFBEB" : "transparent",
                border: isDrop ? "2px dashed #3B82F6" : selected ? "2px solid #3B82F6" : isToday(day) ? "1px solid #FDE68A" : "1px solid #F0F2F5",
              }}
              onMouseEnter={e => !selected && !isDrop && (e.currentTarget.style.background = "#F9FAFB")}
              onMouseLeave={e => !selected && !isDrop && (e.currentTarget.style.background = isToday(day) ? "#FFFBEB" : "transparent")}>
              <div style={{ fontSize: 12, fontWeight: isToday(day) ? 800 : 600, color: dayOfWeek === 0 ? "#EF4444" : dayOfWeek === 6 ? "#3B82F6" : "#1A1D23", marginBottom: 3 }}>
                {day}
                {isToday(day) && <span style={{ fontSize: 8, background: "#F59E0B", color: "#fff", padding: "1px 4px", borderRadius: 3, marginLeft: 3, fontWeight: 700 }}>오늘</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                    style={{ fontSize: 9.5, fontWeight: 600, padding: "2px 4px", borderRadius: 4, background: TYPE_BG[evt.type], color: TYPE_COLORS[evt.type], whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: setEvents ? "grab" : "default" }}>
                    {TYPE_ICON[evt.type]} {evt.type === "휴무" ? evt.name : `${evt.building} ${evt.room}`}
                  </div>
                ))}
                {evts.length > 3 && <div style={{ fontSize: 9, color: "#8F95A3", textAlign: "center" }}>+{evts.length - 3}건</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
