import React from 'react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  icon,
  iconBgColor = 'bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8]',
  trend,
  trendDirection = 'neutral',
  loading = false,
  onClick,
  className = '',
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`app-card p-5 flex flex-col justify-between min-h-[120px] transition-all duration-200 ${
        isClickable ? 'app-card-hover cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-[#5F6368] dark:text-[#94A3B8] uppercase tracking-wider truncate">
          {label}
        </span>
        {icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="my-1">
        {loading ? (
          <div className="h-8 w-16 bg-[#ECEEEC] dark:bg-[#1C263B] rounded-lg animate-pulse" />
        ) : (
          <p className="text-2xl sm:text-3xl font-black text-[#202124] dark:text-[#F8FAFC] font-mono tracking-tight leading-none">
            {typeof value === 'number' && value < 10 && value >= 0 ? `0${value}` : value}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] font-semibold text-[#5F6368] dark:text-[#94A3B8] truncate">
        {subtext && <span className="truncate">{subtext}</span>}
        {trend && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
              trendDirection === 'up'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                : trendDirection === 'down'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                : 'bg-[#F1F3F4] dark:bg-[#1C263B] text-[#5F6368] dark:text-[#94A3B8]'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
