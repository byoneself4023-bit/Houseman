import React from 'react';
import { toast } from 'sonner';
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
  setActiveVacancies?: (fn: any) => void;
}

export const EventListView: React.FC<EventListViewProps> = ({
  selectedDay, month, selectedEvents, filteredMonthEvents,
  setSelectedDay, setEvents, calendarEvents, openEditEvent, openSendModal, setActiveVacancies,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Selected Day Detail */}
      <Card className="p-4">
        <div className="text-sm font-bold text-hm-text mb-3">
          {selectedDay ? `${month + 1}/${selectedDay} 일정` : "날짜를 선택하세요"}
        </div>
        {selectedDay && selectedEvents.length === 0 && (
          <div className="py-5 text-center text-[#B0B5C1] text-sm">일정이 없습니다</div>
        )}
        {selectedEvents.map((evt, i) => (
          <div key={i} onDoubleClick={() => { if (setEvents) openEditEvent(evt); }}
            className="px-3 py-2.5 mb-2 rounded-lg cursor-pointer"
            style={{ background: TYPE_BG[evt.type], border: `1px solid ${TYPE_BORDER[evt.type]}` }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{TYPE_ICON[evt.type]}</span>
                <span className="text-xs font-bold" style={{ color: TYPE_COLORS[evt.type] }}>{evt.type}</span>
              </div>
              <div className="flex gap-1">
                {setEvents && (
                  <button onClick={() => openEditEvent(evt)}
                    className="px-2.5 py-[3px] rounded-[5px] border border-blue-200 bg-hm-blue-bg text-hm-blue-dark text-xs font-bold cursor-pointer font-[inherit] hover:bg-blue-100 transition-colors">
                    수정
                  </button>
                )}
                {setEvents && (
                  <button onClick={() => {
                    if (evt.type === "퇴실" && (evt.externalCheckDone || evt.moveOutLinkCompleted || evt.moveOutLinkSent || evt.settled || evt.cleaningDone)) { toast.error("퇴실 워크플로우가 진행된 일정은 삭제할 수 없습니다."); return; }
                    const idx = calendarEvents.indexOf(evt);
                    if (idx > -1) {
                      persistDelete(evt.supabaseId);
                      if (evt.type === "계약" && evt.building && evt.room) {
                        setActiveVacancies?.((prev: any[]) => prev.map((v: any) => v.building === evt.building && String(v.room) === String(evt.room) ? { ...v, status: "홍보중" } : v));
                      }
                      setEvents((prev: any[]) => prev.filter((_: any, j: number) => j !== idx));
                    }
                  }}
                    className="px-2.5 py-[3px] rounded-[5px] border border-red-200 bg-hm-danger-bg text-hm-danger text-xs font-bold cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">
                    삭제
                  </button>
                )}
              </div>
            </div>
            <div className="text-sm font-bold text-hm-text">{evt.type === "휴무" ? `${evt.name} 휴무` : `${evt.building} ${evt.room}호 ${evt.type}`}</div>
            {evt.type === "계약" && evt.deposit != null && (
              <div className="flex gap-2 mt-1 text-xs text-hm-text-sub">
                <span>보증금 {evt.deposit}</span><span>월세 {evt.rent}</span>{evt.mgmt > 0 && <span>관리 {evt.mgmt}</span>}
              </div>
            )}
            {evt.type === "계약" && (evt.moveIn || evt.expiry) && (
              <div className="flex gap-2 mt-[3px] text-xs text-hm-blue">
                {evt.moveIn && <span>입주 {evt.moveIn}</span>}{evt.expiry && <span>만기 {evt.expiry}</span>}
              </div>
            )}
            {evt.broker && <div className="text-xs text-gray-500 mt-[3px]">🏠 {evt.broker}{evt.brokerPhone ? ` · ${evt.brokerPhone}` : ""}</div>}
            {evt.registeredBy && <div className="text-xs text-hm-text-muted mt-[3px]">등록: {evt.registeredBy} · {evt.registeredAt}</div>}
            {evt.type === "계약" && (
              <div className="mt-1.5">
                <button onClick={(e) => { e.stopPropagation(); openSendModal(evt); }}
                  className="px-3 py-1 rounded-md border-[1.5px] border-emerald-400 bg-hm-success-bg text-hm-success text-xs font-bold cursor-pointer font-[inherit] hover:bg-emerald-100 transition-colors">
                  📤 계약정보 전송
                </button>
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Upcoming Events */}
      <Card className="p-4">
        <div className="text-xs font-bold text-hm-text mb-2">📋 이번 달 전체 일정</div>
        <div className="flex flex-col gap-0.5 max-h-[600px] overflow-y-auto">
          {filteredMonthEvents.sort((a, b) => a.date.localeCompare(b.date)).map((evt, i) => (
            <div key={i} onClick={() => setSelectedDay(parseInt(evt.date.split("-")[2]))}
              onDoubleClick={() => { if (setEvents) openEditEvent(evt); }}
              className="flex items-center gap-1.5 px-2 py-[3px] rounded-[5px] cursor-pointer transition-colors border border-[#F0F2F5] hover:bg-hm-bg-hover">
              <div className="w-[26px] text-center shrink-0">
                <div className="text-xs font-bold text-hm-text leading-tight">{parseInt(evt.date.split("-")[2])}</div>
                <div className="text-[8px] text-[#B0B5C1]">{month + 1}월</div>
              </div>
              <div className="w-0.5 h-5 rounded-sm shrink-0" style={{ background: TYPE_COLORS[evt.type] }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-hm-text whitespace-nowrap overflow-hidden text-ellipsis">
                  {TYPE_ICON[evt.type]} {evt.type === "휴무" ? `${evt.name} 휴무` : `${evt.building} ${evt.room}${evt.type}`}
                </div>
                {evt.building && <div className="text-xs text-hm-text-muted leading-tight">{evt.name}</div>}
              </div>
              <span className="text-xs font-semibold px-1.5 py-[1px] rounded-[3px] shrink-0" style={{ background: TYPE_BG[evt.type], color: TYPE_COLORS[evt.type] }}>{evt.type}</span>
              {setEvents && (
                <button onClick={(e) => { e.stopPropagation(); openEditEvent(evt); }}
                  className="px-1.5 py-[1px] rounded-[3px] border border-blue-200 bg-hm-blue-bg text-hm-blue-dark text-[8px] font-semibold cursor-pointer font-[inherit] shrink-0 hover:bg-blue-100 transition-colors">
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
