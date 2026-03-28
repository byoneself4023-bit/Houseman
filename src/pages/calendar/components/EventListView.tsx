import React from 'react';
import { Card } from '@/components';
import { TYPE_COLORS, TYPE_BG, TYPE_BORDER, TYPE_ICON } from '../constants';
import { persistDelete } from '../calendarApi';

interface EventListViewProps {
  selectedDay: number | null;
  month: number;
  selectedEvents: Record<string, any>[];
  filteredMonthEvents: Record<string, any>[];
  setSelectedDay: (d: number | null) => void;
  setEvents?: (fn: any) => void;
  calendarEvents: Record<string, any>[];
  openEditEvent: (evt: Record<string, any>) => void;
  openSendModal: (evt: Record<string, any>) => void;
}

export const EventListView: React.FC<EventListViewProps> = ({
  selectedDay, month, selectedEvents, filteredMonthEvents,
  setSelectedDay, setEvents, calendarEvents, openEditEvent, openSendModal,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Selected Day Detail */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1D23", marginBottom: 12 }}>
          {selectedDay ? `${month + 1}/${selectedDay} 일정` : "날짜를 선택하세요"}
        </div>
        {selectedDay && selectedEvents.length === 0 && (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#B0B5C1", fontSize: 13 }}>일정이 없습니다</div>
        )}
        {selectedEvents.map((evt, i) => (
          <div key={i} onDoubleClick={() => { if (setEvents) openEditEvent(evt); }}
            style={{ padding: "10px 12px", marginBottom: 8, borderRadius: 8, background: TYPE_BG[evt.type], border: `1px solid ${TYPE_BORDER[evt.type]}`, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{TYPE_ICON[evt.type]}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: TYPE_COLORS[evt.type] }}>{evt.type}</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {setEvents && (
                  <button onClick={() => openEditEvent(evt)}
                    style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    수정
                  </button>
                )}
                {setEvents && (
                  <button onClick={() => {
                    if (evt.type === "퇴실" && evt.externalCheckDone) return alert("퇴실체크가 완료된 일정은 삭제할 수 없습니다.");
                    const idx = calendarEvents.indexOf(evt);
                    if (idx > -1) { persistDelete(evt.supabaseId); setEvents((prev: any[]) => prev.filter((_: any, j: number) => j !== idx)); }
                  }}
                    style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    삭제
                  </button>
                )}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1D23" }}>{evt.type === "휴무" ? `${evt.name} 휴무` : `${evt.building} ${evt.room}호 ${evt.type}`}</div>
            {evt.type === "계약" && evt.deposit != null && (
              <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 10, color: "#5F6577" }}>
                <span>보증금 {evt.deposit}</span><span>월세 {evt.rent}</span>{evt.mgmt > 0 && <span>관리 {evt.mgmt}</span>}
              </div>
            )}
            {evt.type === "계약" && (evt.moveIn || evt.expiry) && (
              <div style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 10, color: "#3B82F6" }}>
                {evt.moveIn && <span>입주 {evt.moveIn}</span>}{evt.expiry && <span>만기 {evt.expiry}</span>}
              </div>
            )}
            {evt.broker && <div style={{ fontSize: 10, color: "#6B7280", marginTop: 3 }}>🏠 {evt.broker}{evt.brokerPhone ? ` · ${evt.brokerPhone}` : ""}</div>}
            {evt.registeredBy && <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 3 }}>등록: {evt.registeredBy} · {evt.registeredAt}</div>}
            {evt.type === "계약" && (
              <div style={{ marginTop: 6 }}>
                <button onClick={(e) => { e.stopPropagation(); openSendModal(evt); }}
                  style={{ padding: "4px 12px", borderRadius: 6, border: "1.5px solid #10B981", background: "#ECFDF5", color: "#059669", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  📤 계약정보 전송
                </button>
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Upcoming Events */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#1A1D23", marginBottom: 8 }}>📋 이번 달 전체 일정</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 600, overflowY: "auto" }}>
          {filteredMonthEvents.sort((a, b) => a.date.localeCompare(b.date)).map((evt, i) => (
            <div key={i} onClick={() => setSelectedDay(parseInt(evt.date.split("-")[2]))}
              onDoubleClick={() => { if (setEvents) openEditEvent(evt); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px", borderRadius: 5, cursor: "pointer", transition: "background 0.1s", border: "1px solid #F0F2F5" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 26, textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1A1D23", lineHeight: 1.2 }}>{parseInt(evt.date.split("-")[2])}</div>
                <div style={{ fontSize: 8, color: "#B0B5C1" }}>{month + 1}월</div>
              </div>
              <div style={{ width: 2, height: 20, borderRadius: 2, background: TYPE_COLORS[evt.type], flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#1A1D23", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {TYPE_ICON[evt.type]} {evt.type === "휴무" ? `${evt.name} 휴무` : `${evt.building} ${evt.room}${evt.type}`}
                </div>
                {evt.building && <div style={{ fontSize: 9, color: "#8F95A3", lineHeight: 1.2 }}>{evt.name}</div>}
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: TYPE_BG[evt.type], color: TYPE_COLORS[evt.type], flexShrink: 0 }}>{evt.type}</span>
              {setEvents && (
                <button onClick={(e) => { e.stopPropagation(); openEditEvent(evt); }}
                  style={{ padding: "1px 6px", borderRadius: 3, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontSize: 8, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                  수정
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
