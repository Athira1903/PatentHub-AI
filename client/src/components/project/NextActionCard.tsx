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

    // Check if onNavigateTab callback is provided and route matches a tab pattern
    if (onNavigateTab) {
      if (targetRoute.includes('tab=')) {
        const tabParam = new URLSearchParams(targetRoute.split('?')[1]).get('tab');
        if (tabParam) {
          onNavigateTab(decodeURIComponent(tabParam));
          return;
        }
      } else if (targetRoute.endsWith('/reviews')) {
        onNavigateTab('Reviews');
        return;
      }
    }

    // Direct navigation
    navigate(targetRoute);
  };

  // 1. Loading State
  if (loading) {
    return (
      <div
        className={`bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs animate-pulse space-y-4 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 bg-slate-200 rounded-md"></div>
          <div className="h-5 w-20 bg-slate-200 rounded-full"></div>
        </div>
        <div className="space-y-2">
          <div className="h-6 w-3/4 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-full bg-slate-100 rounded-md"></div>
          <div className="h-4 w-2/3 bg-slate-100 rounded-md"></div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-8 w-32 bg-slate-200 rounded-xl"></div>
          <span className="text-xs text-slate-400 font-medium">Checking what needs attention...</span>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div
        className={`bg-white border border-rose-200 rounded-3xl p-6 shadow-xs space-y-3 text-center sm:text-left sm:flex sm:items-center sm:justify-between ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Unable to determine your next action</h4>
            <p className="text-xs text-slate-500 font-medium">{error}</p>
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 sm:mt-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer mx-auto sm:mx-0"
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
        className={`bg-white border border-emerald-200/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                All Caught Up
              </span>
              {projectTitle && <span className="text-xs font-bold text-slate-700 truncate max-w-xs">{projectTitle}</span>}
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Project Workflow Up to Date</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
              All current milestone requirements are satisfied. Continue refining documentation or monitor review audits.
            </p>
          </div>
        </div>

        {projectId && (
          <button
            type="button"
            onClick={() => handleActionClick(`/projects/${projectId}?tab=Overview`)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>View Overview</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // 4. Active Next Action Card (Calm, Premium PatentHub Style)
  const priorityStyles = {
    CRITICAL: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      accent: 'border-l-rose-500',
      button: 'bg-rose-600 hover:bg-rose-700 text-white',
      indicator: 'text-rose-600',
      label: 'Critical Blocker',
    },
    HIGH: {
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      accent: 'border-l-amber-500',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      indicator: 'text-amber-600',
      label: 'High Priority',
    },
    MEDIUM: {
      badge: 'bg-teal-50 text-teal-800 border-teal-200',
      accent: 'border-l-teal-500',
      button: 'bg-teal-700 hover:bg-teal-800 text-white',
      indicator: 'text-teal-600',
      label: 'Recommended',
    },
    LOW: {
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      accent: 'border-l-slate-400',
      button: 'bg-slate-800 hover:bg-slate-900 text-white',
      indicator: 'text-slate-500',
      label: 'Informational',
    },
  }[nextAction.priority || 'MEDIUM'];

  const displayProgress = progressPercentage ?? nextAction.progress ?? 0;

  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs relative overflow-hidden transition hover:shadow-md ${className}`}
    >
      {/* Top Banner Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              What Should I Do Next?
            </span>
            {projectTitle && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-800 truncate max-w-xs">{projectTitle}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${priorityStyles.badge}`}
            >
              {priorityStyles.label}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              {(nextAction.stage || 'STAGE').replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      )}

      {/* Main Action Content */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-snug">
            {nextAction.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-1">
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
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Journey Completion</span>
                <span className="text-slate-900">{displayProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Recommendations (if available) */}
        {secondaryActions && secondaryActions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Next in Queue
            </span>
            <div className="space-y-1.5">
              {secondaryActions.map((sec, idx) => (
                <div
                  key={idx}
                  onClick={() => handleActionClick(sec.route)}
                  className="p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-150 flex items-center justify-between text-xs cursor-pointer transition"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    <span className="font-bold text-slate-800 truncate">{sec.title}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
