import React from 'react';

export interface KpiCardProps {
  label: string;
  value: string | number | React.ReactNode;
  subtext?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  valueClassName?: string;
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
  valueClassName = '',
}) => {
  const isClickable = Boolean(onClick);

  const isStatusString =
    typeof value === 'string' &&
    (value.toLowerCase() === 'operational' ||
      value.toLowerCase() === 'healthy' ||
      value.toLowerCase() === 'live');

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
      className={`app-card p-3.5 sm:p-4 flex flex-col justify-between h-full min-h-[120px] rounded-2xl border border-[#E8EAF0] dark:border-[#23314B] bg-white dark:bg-[#131B2B] transition-all duration-200 overflow-hidden ${
        isClickable ? 'app-card-hover cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-1.5 min-h-[2.25rem]">
        <span
          className="text-[10px] sm:text-[11px] font-bold text-[#5F6368] dark:text-[#94A3B8] uppercase tracking-normal leading-tight line-clamp-2"
          title={label}
        >
          {label}
        </span>
        {icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBgColor}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="my-1 flex items-center min-h-[2rem]">
        {loading ? (
          <div className="h-7 w-16 bg-[#ECEEEC] dark:bg-[#1C263B] rounded-lg animate-pulse" />
        ) : isStatusString ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 max-w-full truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">{value}</span>
          </div>
        ) : (
          <p
            className={`font-black text-[#202124] dark:text-[#F8FAFC] tracking-tight leading-none truncate ${
              typeof value === 'string' && value.length > 7
                ? 'text-sm sm:text-base font-sans'
                : typeof value === 'string' && value.length > 4
                ? 'text-lg sm:text-xl font-mono'
                : 'text-2xl sm:text-3xl font-mono'
            } ${valueClassName}`}
            title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
          >
            {value}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-[#5F6368] dark:text-[#94A3B8] truncate mt-auto pt-1 border-t border-slate-100/60 dark:border-slate-800/40">
        {subtext && (
          <span className="truncate" title={subtext}>
            {subtext}
          </span>
        )}
        {trend && (
          <span
            className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${
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
