import React from 'react';
import { getRoomType } from '../config';

interface RoomTypeCfgEntry {
  icon: string;
  c: string;
  bg: string;
  label: string;
}

type RoomTypeKey = '단기' | '일반임대' | '근생' | '관리사무소';

export const ROOM_TYPE_CFG: Record<RoomTypeKey, RoomTypeCfgEntry> = {
  단기: { icon: '🏠', c: '#EA580C', bg: '#FFF7ED', label: '단기' },
  일반임대: { icon: '🏢', c: '#2563EB', bg: '#EFF6FF', label: '일반임대' },
  근생: { icon: '🏪', c: '#7C3AED', bg: '#F5F3FF', label: '근생' },
  관리사무소: { icon: '🏛️', c: '#0D9488', bg: '#F0FDFA', label: '관리사무소' },
};

export const rtCfg = (rt: string): RoomTypeCfgEntry =>
  ROOM_TYPE_CFG[rt as RoomTypeKey] || ROOM_TYPE_CFG['단기'];

interface RoomTypeBadgeProps {
  building: string;
  room: string;
}

export const RoomTypeBadge: React.FC<RoomTypeBadgeProps> = ({ building, room }) => {
  const rt = getRoomType(building, room);
  const cfg = rtCfg(rt);
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded"
      style={{ background: cfg.bg, color: cfg.c }}
    >
      {rt}
    </span>
  );
};
