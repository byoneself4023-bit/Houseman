import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode | {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-hm-gray-100 flex items-center justify-center mb-4 text-hm-gray-600">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-hm-text mb-1">{title}</h3>
      {description && <p className="text-sm text-hm-text-muted max-w-[320px]">{description}</p>}
      {action && (
        <div className="mt-4">
          {action && typeof action === 'object' && 'label' in action ? (
            <Button variant="outline" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  );
}
