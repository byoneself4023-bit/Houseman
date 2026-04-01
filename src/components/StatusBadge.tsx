import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-hm-success-bg text-hm-success border-hm-success-border',
  danger:  'bg-hm-danger-bg text-hm-danger border-hm-danger-border',
  warning: 'bg-hm-warning-bg text-hm-warning border-hm-warning-border',
  info:    'bg-hm-info-bg text-hm-info border-hm-info-border',
  neutral: 'bg-hm-gray-100 text-hm-gray-600 border-hm-gray-200',
};

const statusToVariant: Record<string, BadgeVariant> = {
  '정상': 'success',
  '완료': 'success',
  '연체': 'danger',
  '도래': 'danger',
  '높음': 'danger',
  '청구': 'warning',
  '진행중': 'warning',
  '예정': 'warning',
  '보통': 'warning',
  '임차인연결': 'warning',
  '대기': 'info',
  '관심': 'info',
  '낮음': 'info',
  '공실': 'neutral',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const variant = statusToVariant[status] || 'success';
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-md border whitespace-nowrap gap-1',
        variantStyles[variant],
      )}
    >
      {label || status}
    </span>
  );
};
