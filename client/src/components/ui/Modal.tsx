import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white dark:bg-[#131B2B] border border-[#CBD5E1] dark:border-[#23314B] rounded-2xl w-full ${widthClass} max-h-[90vh] flex flex-col shadow-xl overflow-hidden text-[#202124] dark:text-[#F8FAFC]`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#23314B] flex items-start justify-between gap-4 shrink-0 bg-[#F8F9FA] dark:bg-[#0B0F17]">
          <div className="space-y-0.5 min-w-0">
            <h3 id="modal-title" className="text-base font-bold text-[#202124] dark:text-[#F8FAFC] tracking-tight truncate">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] font-medium leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#ECEEEC] dark:hover:bg-[#1C263B] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-[#202124] dark:text-[#F8FAFC]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-[#E2E8F0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
