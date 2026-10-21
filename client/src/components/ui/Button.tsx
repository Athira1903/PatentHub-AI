import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-xs px-4 py-2 gap-2 h-9',
    lg: 'text-sm px-5 py-2.5 gap-2.5 h-11',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#1A73E8] hover:bg-[#1557B0] active:bg-[#174EA6] dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-xs focus:ring-[#1A73E8]/30',
    secondary:
      'bg-[#F1F3F4] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] dark:bg-[#1C263B] dark:hover:bg-[#23314B] text-[#202124] dark:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#23314B] focus:ring-[#5F6368]/20',
    outline:
      'bg-white dark:bg-[#131B2B] hover:bg-[#F8F9FA] dark:hover:bg-[#1C263B] active:bg-[#F1F3F4] text-[#202124] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#23314B] hover:border-[#94A3B8] focus:ring-[#1A73E8]/20',
    ghost:
      'bg-transparent hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC] focus:ring-[#5F6368]/10',
    destructive:
      'bg-[#EA4335] hover:bg-[#D93025] active:bg-[#B31412] dark:bg-red-600 dark:hover:bg-red-500 text-white shadow-xs focus:ring-[#EA4335]/30',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
