import React from 'react';
import { Card, SectionTitle } from '@/components';
import { rtCfg } from '@/components/RoomTypeBadge';
import { inputClassName } from '@/components/Field';
import { getRoomType } from '@/config';
import { fmt } from '@/utils';

const statusStyle = (status: string) => {
  switch (status) {
    case "공실": return { bg: "#FEF3C7", border: "#FDE68A", color: "#92400E", icon: "□" };
    case "연체": return { bg: "#FEE2E2", border: "var(--color-hm-danger-border)", color: "#991B1B", icon: "!" };
    default: return { bg: "#D1FAE5", border: "var(--color-hm-success-border)", color: "#065F46", icon: "●" };
  }
};

interface RoomGridProps {
  buildingName: string;
  detail: Record<string, any>;
  selectedRoom: string | null;
  setSelectedRoom: (room: string | null) => void;
  setRoomEditMode: (v: boolean) => void;
  setRoomDeleteStep: (v: number) => void;
  setRoomTab: (v: string) => void;
  showAddRoom: boolean;
  setShowAddRoom: (v: boolean) => void;
  addRoomFloor: string;
  setAddRoomFloor: (v: string) => void;
  addRoomNum: string;
  setAddRoomNum: (v: string) => void;
  getRoomStatus: (room: string) => Record<string, any>;
  floorKeys: string[];
}

export const RoomGrid: React.FC<RoomGridProps> = ({
  buildingName, detail,
  selectedRoom, setSelectedRoom,
  setRoomEditMode, setRoomDeleteStep, setRoomTab,
  showAddRoom, setShowAddRoom,
  addRoomFloor, setAddRoomFloor,
  addRoomNum, setAddRoomNum,
  getRoomStatus, floorKeys,
}) => {
  return (
    <Card className="mb-5">
      <div className="flex justify-between items-start mb-3">
        <SectionTitle sub="호실을 클릭하면 상세 정보를 볼 수 있습니다">🏗️ 층별 호실 현황</SectionTitle>
        <button onClick={() => setShowAddRoom(!showAddRoom)} className={`px-4 py-[7px] rounded-lg border-[1.5px] font-bold text-xs cursor-pointer font-[inherit] whitespace-nowrap transition-colors ${showAddRoom ? 'border-hm-input-border bg-white text-hm-text-sub hover:bg-hm-bg-hover' : 'border-hm-blue bg-hm-blue-bg text-hm-blue-dark hover:brightness-95'}`}>
          {showAddRoom ? "취소" : "➕ 호실 추가"}
        </button>
      </div>

      {showAddRoom && (
        <div className="px-4 py-3.5 bg-[#F0F4FF] rounded-[10px] border-[1.5px] border-blue-200 mb-4">
          <div className="text-xs font-bold text-hm-blue-dark mb-2.5">새 호실 추가</div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <div className="text-xs text-hm-text-muted mb-[3px]">층</div>
              <input value={addRoomFloor} onChange={e => setAddRoomFloor(e.target.value)} placeholder="예: 1, B1, 2" className={`${inputClassName} !px-2.5 !py-2 !text-xs`} />
            </div>
            <div className="flex-1">
              <div className="text-xs text-hm-text-muted mb-[3px]">호실번호</div>
              <input value={addRoomNum} onChange={e => setAddRoomNum(e.target.value)} placeholder="예: 101, 1층" className={`${inputClassName} !px-2.5 !py-2 !text-xs`} />
            </div>
            <button onClick={() => { if (addRoomFloor && addRoomNum) { setAddRoomFloor(""); setAddRoomNum(""); setShowAddRoom(false); setSelectedRoom(addRoomNum); setRoomEditMode(true); }}} className={`px-5 py-2 rounded-lg border-none text-white font-bold text-xs font-[inherit] whitespace-nowrap transition-colors ${addRoomFloor && addRoomNum ? 'bg-hm-blue-dark cursor-pointer hover:brightness-90' : 'bg-gray-300 cursor-default'}`}>
              추가 후 정보입력
            </button>
          </div>
          <div className="text-xs text-hm-text-muted mt-1.5">추가하면 바로 호실 상세 입력 화면이 열립니다. (기준금액, 사진 등)</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mb-4 px-3 py-2 bg-hm-bg-hover rounded-lg">
        {[
          { label: "입주중", bg: "#D1FAE5", border: "var(--color-hm-success-border)" },
          { label: "연체", bg: "#FEE2E2", border: "var(--color-hm-danger-border)" },
          { label: "공실", bg: "#FEF3C7", border: "#FDE68A" },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11.5px] text-hm-text-sub">
            <div className="w-3.5 h-3.5 rounded" style={{ background: l.bg, border: `1.5px solid ${l.border}` }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Floor Rows */}
      <div className="flex flex-col gap-1.5">
        {floorKeys.map(floor => {
          const rooms = detail.floors[floor];
          return (
            <div key={floor} className="flex items-stretch">
              {/* Floor Label */}
              <div className="w-[52px] flex items-center justify-center bg-[#1B1F2E] text-white font-bold text-xs rounded-l-lg shrink-0">
                {floor}
              </div>
              {/* Rooms */}
              <div className="flex-1 flex gap-1 px-2 py-1.5 bg-hm-bg-muted rounded-r-lg flex-wrap">
                {rooms.map((room: string) => {
                  const info = getRoomStatus(room);
                  const st = statusStyle(info.status === "정상" ? "입주" : info.status === "연체" ? "연체" : info.status);
                  const isSelected = selectedRoom === room;
                  return (
                    <div key={room} title={info.name ? `${room}호 ${info.name}${info.overdue > 0 ? ` (연체 ${fmt(info.overdue)}원)` : ""}` : `${room}호 ${info.status}${info.days > 0 ? ` (${info.days}일)` : ""}`}
                      onClick={() => { setSelectedRoom(selectedRoom === room ? null : room); setRoomEditMode(false); setRoomDeleteStep(0); setRoomTab("info"); }}
                      className="min-w-[72px] px-2.5 py-2.5 rounded-lg cursor-pointer transition-all duration-150 text-center relative hover:-translate-y-0.5 hover:shadow-md"
                      style={{
                        background: isSelected ? "var(--color-hm-text)" : st.bg,
                        border: `1.5px solid ${isSelected ? "var(--color-hm-text)" : st.border}`,
                      }}
                    >
                      <div className="text-sm font-bold mb-1" style={{ color: isSelected ? "#fff" : st.color }}>{room}</div>
                      <div className="text-[8px] font-bold mb-[1px]" style={{ color: isSelected ? "#ccc" : rtCfg(getRoomType(buildingName, room)).c }}>{getRoomType(buildingName, room)}</div>
                      <div className="text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: isSelected ? "#ccc" : st.color }}>
                        {info.name || (info.status === "공실" ? "공실" : "입주중")}
                      </div>
                      {info.overdue > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">!</div>
                      )}
                      {info.status === "공실" && info.days > 30 && (
                        <div className="absolute -top-1 -right-1 text-[8px] bg-hm-danger text-white px-[5px] py-[1px] rounded font-bold">{info.days}일</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
