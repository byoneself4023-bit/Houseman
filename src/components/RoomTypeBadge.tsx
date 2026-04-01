import React from 'react';
import { cn } from '@/lib/utils';
import { getRoomType } from '../config';

interface RoomTypeCfgEntry {
  icon: string;
  c: string;
  bg: string;
  label: string;
  textClass: string;
  bgClass: string;
}

type RoomTypeKey = '단기' | '일반임대' | '근생' | '관리사무소';

export const ROOM_TYPE_CFG: Record<RoomTypeKey, RoomTypeCfgEntry> = {
  단기: { icon: '🏠', c: 'var(--color-hm-warning)', bg: 'var(--color-hm-warning-bg)', label: '단기', textClass: 'text-hm-warning', bgClass: 'bg-hm-warning-bg' },
  일반임대: { icon: '🏢', c: 'var(--color-hm-blue-dark)', bg: 'var(--color-hm-blue-bg)', label: '일반임대', textClass: 'text-hm-blue-dark', bgClass: 'bg-hm-blue-bg' },
  근생: { icon: '🏪', c: '#7C3AED', bg: '#F5F3FF', label: '근생', textClass: 'text-[#7C3AED]', bgClass: 'bg-[#F5F3FF]' },
  관리사무소: { icon: '🏛️', c: '#0D9488', bg: '#F0FDFA', label: '관리사무소', textClass: 'text-[#0D9488]', bgClass: 'bg-[#F0FDFA]' },
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
      className={cn(
        'inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded',
        cfg.bgClass,
        cfg.textClass,
      )}
    >
      {rt}
    </span>
  );
};
