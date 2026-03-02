import { getRoomType } from '../config';

export const ROOM_TYPE_CFG = {
  "단기": { icon: "🏠", c: "#EA580C", bg: "#FFF7ED", label: "단기" },
  "일반임대": { icon: "🏢", c: "#2563EB", bg: "#EFF6FF", label: "일반임대" },
  "근생": { icon: "🏪", c: "#7C3AED", bg: "#F5F3FF", label: "근생" },
  "관리사무소": { icon: "🏛️", c: "#0D9488", bg: "#F0FDFA", label: "관리사무소" },
};

export const rtCfg = (rt) => ROOM_TYPE_CFG[rt] || ROOM_TYPE_CFG["단기"];

export const RoomTypeBadge = ({ building, room }) => {
  const rt = getRoomType(building, room);
  const cfg = rtCfg(rt);
  return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: cfg.bg, color: cfg.c, fontWeight: 600 }}>{rt}</span>;
};
