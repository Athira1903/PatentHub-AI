import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Compass,
  ChevronRight,
} from 'lucide-react';

export interface NextActionItem {
  title: string;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  stage: string;
  actionType: string;
  route: string;
  progress: number;
  blockedBy?: string[];
  metadata?: Record<string, any>;
}

export interface NextActionCardProps {
  projectId?: string;
  projectTitle?: string;
  nextAction: NextActionItem | null;
  secondaryActions?: NextActionItem[];
  progressPercentage?: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onNavigateTab?: (tab: string) => void;
  className?: string;
  hideHeader?: boolean;
}

export const NextActionCard: React.FC<NextActionCardProps> = ({
  projectId,
  projectTitle,
  nextAction,
  secondaryActions = [],
  progressPercentage,
  loading = false,
  error = null,
  onRetry,
  onNavigateTab,
  className = '',
  hideHeader = false,
}) => {
  const navigate = useNavigate();

  const handleActionClick = (targetRoute: string) => {
    if (!targetRoute) return;

    if (onNavigateTab) {
      if (targetRoute.includes('tab=')) {
        const tabParam = new URLSearchParams(targetRoute.split('?')[1]).get('tab');
        if (tabParam) {
          onNavigateTab(tabParam);
          return;
        }
      }
    }

    if (targetRoute.startsWith('/dashboard/') || targetRoute.startsWith('/projects/')) {
      navigate(targetRoute);
    } else if (targetRoute.startsWith('/')) {
      navigate(targetRoute);
    } else {
      navigate(`/dashboard/${targetRoute}`);
    }
  };

  // 1. Loading Skeleton
  if (loading) {
    return (
      <div
        className={`bg-white dark:bg-[#131B2B] border border-[#E2E8F0] dark:border-[#23314B] rounded-3xl p-6 shadow-xs animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E2E8F0] dark:border-[#23314B]">
          <div className="h-4 bg-[#F1F3F4] dark:bg-[#1C263B] rounded-md w-36" />
          <div className="h-4 bg-[#F1F3F4] dark:bg-[#1C263B] rounded-md w-24" />
        </div>
        <div className="space-y-3">
          <div className="h-6 bg-[#F1F3F4] dark:bg-[#1C263B] rounded-md w-3/4" />
          <div className="h-4 bg-[#F1F3F4] dark:bg-[#1C263B] rounded-md w-1/2" />
          <div className="pt-2 flex items-center justify-between">
            <div className="h-9 bg-[#F1F3F4] dark:bg-[#1C263B] rounded-xl w-32" />
            <div className="h-2 bg-[#F1F3F4] dark:bg-[#1C263B] rounded-full w-48" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div
        className={`bg-white dark:bg-[#131B2B] border border-amber-200 dark:border-amber-900/50 rounded-3xl p-6 shadow-xs flex items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#202124] dark:text-[#F8FAFC]">Next Action Engine Unavailable</h4>
            <p className="text-xs text-[#5F6368] dark:text-[#94A3B8]">{error || 'Could not compute latest milestone recommendation.'}</p>
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  // 3. Empty / Caught Up State
  if (!nextAction || nextAction.actionType === 'ALL_CAUGHT_UP') {
    return (
      <div
        className={`bg-white dark:bg-[#131B2B] border border-emerald-200 dark:border-emerald-900/40 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800">
                All Caught Up
              </span>
              {projectTitle && <span className="text-xs font-bold text-[#202124] dark:text-[#F8FAFC] truncate max-w-xs">{projectTitle}</span>}
            </div>
            <h4 className="text-sm font-extrabold text-[#202124] dark:text-[#F8FAFC]">Project Workflow Up to Date</h4>
            <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] font-medium mt-0.5 leading-relaxed">
              All current milestone requirements are satisfied. Continue refining documentation or monitor review audits.
            </p>
          </div>
        </div>

        {projectId && (
          <button
            type="button"
            onClick={() => handleActionClick(`/projects/${projectId}?tab=Overview`)}
            className="px-4 py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <span>View Overview</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // 4. Active Next Action Card
  const priorityStyles = {
    CRITICAL: {
      badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      button: 'bg-rose-600 hover:bg-rose-700 text-white',
      label: 'Critical Blocker',
    },
    HIGH: {
      badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      button: 'bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-blue-600 text-white',
      label: 'High Priority',
    },
    MEDIUM: {
      badge: 'bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] border-blue-200 dark:border-blue-800',
      button: 'bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-blue-600 text-white',
      label: 'Recommended',
    },
    LOW: {
      badge: 'bg-[#F1F3F4] dark:bg-[#1C263B] text-[#5F6368] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#23314B]',
      button: 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white',
      label: 'Informational',
    },
  }[nextAction.priority || 'MEDIUM'];

  const displayProgress = progressPercentage ?? nextAction.progress ?? 0;

  return (
    <div
      className={`bg-white dark:bg-[#131B2B] border border-[#E2E8F0] dark:border-[#23314B] rounded-3xl p-6 shadow-xs relative overflow-hidden transition hover:shadow-md ${className}`}
    >
      {/* Top Banner Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#23314B] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] flex items-center justify-center">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#5F6368] dark:text-[#94A3B8]">
              What Should I Do Next?
            </span>
            {projectTitle && (
              <>
                <span className="text-[#CBD5E1] dark:text-[#334466]">•</span>
                <span className="text-xs font-bold text-[#202124] dark:text-[#F8FAFC] truncate max-w-xs">{projectTitle}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${priorityStyles.badge}`}
            >
              {priorityStyles.label}
            </span>
            <span className="text-[10px] font-bold text-[#5F6368] dark:text-[#94A3B8] uppercase bg-[#F1F3F4] dark:bg-[#1C263B] px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-[#23314B]">
              {(nextAction.stage || 'STAGE').replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      )}

      {/* Main Action Content */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#202124] dark:text-[#F8FAFC] tracking-tight leading-snug">
            {nextAction.title}
          </h3>
          <p className="text-xs sm:text-sm text-[#5F6368] dark:text-[#94A3B8] font-medium leading-relaxed mt-1">
            {nextAction.reason}
          </p>
        </div>

        {/* Action Button & Progress */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => handleActionClick(nextAction.route)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${priorityStyles.button}`}
          >
            <span>Take Action</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Progress Indicator */}
          <div className="flex items-center gap-3 sm:max-w-xs w-full">
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-[#5F6368] dark:text-[#94A3B8]">
                <span>Journey Completion</span>
                <span className="text-[#202124] dark:text-[#F8FAFC]">{displayProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#E2E8F0] dark:bg-[#1C263B] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1A73E8] dark:bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Recommendations */}
        {secondaryActions && secondaryActions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#23314B]">
            <span className="text-[10px] font-bold text-[#88928E] dark:text-[#64748B] uppercase tracking-wider block mb-2">
              Next in Queue
            </span>
            <div className="space-y-1.5">
              {secondaryActions.map((sec, idx) => (
                <div
                  key={idx}
                  onClick={() => handleActionClick(sec.route)}
                  className="p-2.5 rounded-xl bg-[#F8F9FA] dark:bg-[#1C263B] hover:bg-[#F1F3F4] dark:hover:bg-[#23314B] border border-[#E2E8F0] dark:border-[#23314B] flex items-center justify-between text-xs cursor-pointer transition text-[#202124] dark:text-[#F8FAFC]"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8] dark:bg-[#8AB4F8] shrink-0"></span>
                    <span className="font-bold truncate">{sec.title}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#88928E] dark:text-[#64748B] shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
