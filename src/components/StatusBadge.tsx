import React from 'react';
import { cn } from '@/lib/utils';

type StatusKey =
  | '정상'
  | '연체'
  | '청구'
  | '완료'
  | '진행중'
  | '대기'
  | '도래'
  | '예정'
  | '관심'
  | '높음'
  | '보통'
  | '낮음'
  | '임차인연결';

interface StatusStyle {
  bg: string;
  text: string;
  border: string;
}

interface StatusBadgeProps {
  status: string;
  label?: string;
}

const statusMap: Record<StatusKey, StatusStyle> = {
  정상: { bg: 'bg-hm-success-bg', text: 'text-hm-success', border: 'border-hm-success-border' },
  연체: { bg: 'bg-hm-danger-bg', text: 'text-hm-danger', border: 'border-hm-danger-border' },
  청구: { bg: 'bg-hm-warning-bg', text: 'text-hm-warning', border: 'border-hm-warning-border' },
  완료: { bg: 'bg-hm-success-bg', text: 'text-hm-success', border: 'border-hm-success-border' },
  진행중: { bg: 'bg-hm-warning-bg', text: 'text-hm-warning', border: 'border-hm-warning-border' },
  대기: { bg: 'bg-[#F0F4FF]', text: 'text-[#4F46E5]', border: 'border-[#C7D2FE]' },
  도래: { bg: 'bg-hm-danger-bg', text: 'text-hm-danger', border: 'border-hm-danger-border' },
  예정: { bg: 'bg-hm-warning-bg', text: 'text-hm-warning', border: 'border-hm-warning-border' },
  관심: { bg: 'bg-[#F0F4FF]', text: 'text-[#4F46E5]', border: 'border-[#C7D2FE]' },
  높음: { bg: 'bg-hm-danger-bg', text: 'text-hm-danger', border: 'border-hm-danger-border' },
  보통: { bg: 'bg-hm-warning-bg', text: 'text-hm-warning', border: 'border-hm-warning-border' },
  낮음: { bg: 'bg-[#F0F4FF]', text: 'text-[#6366F1]', border: 'border-[#C7D2FE]' },
  임차인연결: { bg: 'bg-[#FFFBEB]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' },
};

const defaultStyle = statusMap['정상'];

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const s = statusMap[status as StatusKey] || defaultStyle;
  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-md border whitespace-nowrap',
        s.bg,
        s.text,
        s.border,
      )}
    >
      {label || status}
    </span>
  );
};
