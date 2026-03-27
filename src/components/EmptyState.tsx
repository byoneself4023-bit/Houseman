import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <h3 className="text-sm font-semibold text-[#1A1D23]">{title}</h3>
      {description && <p className="text-xs text-[#8F95A3] mt-1 max-w-[280px]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
