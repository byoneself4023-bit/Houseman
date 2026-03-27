import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  id?: string;
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, style, onClick, id, className }, ref) => (
    <div
      ref={ref}
      id={id}
      className={cn(
        'bg-white rounded-xl border border-[#E8ECF0] p-5 shadow-sm transition-shadow duration-200',
        onClick && 'cursor-pointer hover:shadow-md',
        className,
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  ),
);
