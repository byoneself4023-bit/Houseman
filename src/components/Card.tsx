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
        'bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] hover:-translate-y-0.5',
        className,
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  ),
);
