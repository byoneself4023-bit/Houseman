import React from 'react';
import { Card, SectionTitle } from '@/components';
import { rtCfg } from '@/components/RoomTypeBadge';
import { inputStyle } from '@/components/Field';
import { getRoomType } from '@/config';
import { fmt } from '@/utils';

const statusStyle = (status: string) => {
  switch (status) {
    case "공실": return { bg: "#FEF3C7", border: "#FDE68A", color: "#92400E", icon: "□" };
    case "연체": return { bg: "#FEE2E2", border: "#FECACA", color: "#991B1B", icon: "!" };
    default: return { bg: "#D1FAE5", border: "#A7F3D0", color: "#065F46", icon: "●" };
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
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <SectionTitle sub="호실을 클릭하면 상세 정보를 볼 수 있습니다">🏗️ 층별 호실 현황</SectionTitle>
        <button onClick={() => setShowAddRoom(!showAddRoom)} style={{ padding: "7px 16px", borderRadius: 8, border: showAddRoom ? "1.5px solid #E0E3E9" : "1.5px solid #3B82F6", background: showAddRoom ? "#fff" : "#EFF6FF", color: showAddRoom ? "#5F6577" : "#2563EB", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          {showAddRoom ? "취소" : "➕ 호실 추가"}
        </button>
      </div>

      {showAddRoom && (
        <div style={{ padding: "14px 16px", background: "#F0F4FF", borderRadius: 10, border: "1.5px solid #BFDBFE", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", marginBottom: 10 }}>새 호실 추가</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>층</div>
              <input value={addRoomFloor} onChange={e => setAddRoomFloor(e.target.value)} placeholder="예: 1, B1, 2" style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: "#8F95A3", marginBottom: 3 }}>호실번호</div>
              <input value={addRoomNum} onChange={e => setAddRoomNum(e.target.value)} placeholder="예: 101, 1층" style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} />
            </div>
            <button onClick={() => { if (addRoomFloor && addRoomNum) { setAddRoomFloor(""); setAddRoomNum(""); setShowAddRoom(false); setSelectedRoom(addRoomNum); setRoomEditMode(true); }}} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: addRoomFloor && addRoomNum ? "#2563EB" : "#D1D5DB", color: "#fff", fontWeight: 700, fontSize: 12, cursor: addRoomFloor && addRoomNum ? "pointer" : "default", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              추가 후 정보입력
            </button>
          </div>
          <div style={{ fontSize: 10, color: "#8F95A3", marginTop: 6 }}>추가하면 바로 호실 상세 입력 화면이 열립니다. (기준금액, 사진 등)</div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, padding: "8px 12px", background: "#F9FAFB", borderRadius: 8 }}>
        {[
          { label: "입주중", bg: "#D1FAE5", border: "#A7F3D0" },
          { label: "연체", bg: "#FEE2E2", border: "#FECACA" },
          { label: "공실", bg: "#FEF3C7", border: "#FDE68A" },
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#5F6577" }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: l.bg, border: `1.5px solid ${l.border}` }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Floor Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {floorKeys.map(floor => {
          const rooms = detail.floors[floor];
          return (
            <div key={floor} style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
              {/* Floor Label */}
              <div style={{ width: 52, display: "flex", alignItems: "center", justifyContent: "center", background: "#1B1F2E", color: "#fff", fontWeight: 800, fontSize: 12, borderRadius: "8px 0 0 8px", flexShrink: 0 }}>
                {floor}
              </div>
              {/* Rooms */}
              <div style={{ flex: 1, display: "flex", gap: 4, padding: "6px 8px", background: "#F7F8FA", borderRadius: "0 8px 8px 0", flexWrap: "wrap" }}>
                {rooms.map((room: string) => {
                  const info = getRoomStatus(room);
                  const st = statusStyle(info.status === "정상" ? "입주" : info.status === "연체" ? "연체" : info.status);
                  return (
                    <div key={room} title={info.name ? `${room}호 ${info.name}${info.overdue > 0 ? ` (연체 ${fmt(info.overdue)}원)` : ""}` : `${room}호 ${info.status}${info.days > 0 ? ` (${info.days}일)` : ""}`}
                      onClick={() => { setSelectedRoom(selectedRoom === room ? null : room); setRoomEditMode(false); setRoomDeleteStep(0); setRoomTab("info"); }}
                      style={{
                        minWidth: 72, padding: "10px 10px", borderRadius: 8, background: selectedRoom === room ? "#1A1D23" : st.bg, border: `1.5px solid ${selectedRoom === room ? "#1A1D23" : st.border}`,
                        cursor: "pointer", transition: "all 0.15s", textAlign: "center", position: "relative",
                      }}
                      onMouseEnter={e => { if (selectedRoom !== room) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)"; }}}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: selectedRoom === room ? "#fff" : st.color, marginBottom: 2 }}>{room}</div>
                      <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 1, color: selectedRoom === room ? "#ccc" : rtCfg(getRoomType(buildingName, room)).c }}>{getRoomType(buildingName, room)}</div>
                      <div style={{ fontSize: 10, color: selectedRoom === room ? "#ccc" : st.color, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {info.name || (info.status === "공실" ? "공실" : "입주중")}
                      </div>
                      {info.overdue > 0 && (
                        <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>!</div>
                      )}
                      {info.status === "공실" && info.days > 30 && (
                        <div style={{ position: "absolute", top: -4, right: -4, fontSize: 8, background: "#DC2626", color: "#fff", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>{info.days}일</div>
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
