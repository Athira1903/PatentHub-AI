import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`app-card p-10 sm:p-14 text-center flex flex-col items-center justify-center space-y-3 max-w-xl mx-auto my-6 ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#F0F7F6] text-[#235952] border border-[#DCECE9] flex items-center justify-center mb-1 shrink-0">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-md">
        <h4 className="text-base font-bold text-[#191F1D] tracking-tight">{title}</h4>
        {description && (
          <p className="text-xs text-[#5C6662] font-medium leading-relaxed">{description}</p>
        )}
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
