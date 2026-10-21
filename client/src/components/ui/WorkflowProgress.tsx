import React from 'react';
import { Check } from 'lucide-react';

export interface WorkflowProgressProps {
  currentStage: string;
  onSelectStage?: (stageKey: string) => void;
  className?: string;
}

export const WORKFLOW_STAGES = [
  { key: 'IDEA', label: 'Define', description: 'Invention capture & problem scoping' },
  { key: 'LITERATURE_REVIEW', label: 'Research', description: 'Global prior art queries' },
  { key: 'PROTOTYPE', label: 'Analyze', description: 'FTO & drawing element mapping' },
  { key: 'DOCUMENTATION', label: 'Draft', description: 'Specification & claim drafting' },
  { key: 'GUIDE_REVIEW', label: 'Review', description: 'Faculty & expert evaluation' },
  { key: 'FILING_READY', label: 'Filing', description: 'Form compilation & dispatch' },
] as const;

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  currentStage,
  onSelectStage,
  className = '',
}) => {
  const normalized = String(currentStage || '').toUpperCase();

  const getStageIndex = (stageKey: string) => {
    if (stageKey === 'FILED' || stageKey === 'GRANTED') return 5;
    if (stageKey === 'PATENT_EXPERT_REVIEW' || stageKey === 'CHANGES_REQUESTED') return 4;
    if (stageKey === 'FORMS_PREPARATION') return 3;
    const idx = WORKFLOW_STAGES.findIndex((s) => s.key === stageKey);
    return idx >= 0 ? idx : 0;
  };

  const currentIndex = getStageIndex(normalized);

  return (
    <div className={`app-card p-4 sm:p-5 overflow-x-auto ${className}`}>
      <div className="flex items-center justify-between min-w-[560px] gap-2">
        {WORKFLOW_STAGES.map((st, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <React.Fragment key={st.key}>
              <div
                onClick={() => onSelectStage?.(st.key)}
                role={onSelectStage ? 'button' : undefined}
                className={`flex items-center gap-2.5 p-1.5 rounded-xl transition-all ${
                  onSelectStage ? 'hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] cursor-pointer' : ''
                } ${isCurrent ? 'opacity-100' : isCompleted ? 'opacity-90' : 'opacity-60'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-3xs'
                      : isCurrent
                      ? 'bg-[#1A73E8] dark:bg-[#2563EB] text-white ring-2 ring-[#1A73E8]/20 shadow-xs'
                      : 'bg-[#ECEEEC] dark:bg-[#1C263B] text-[#5F6368] dark:text-[#94A3B8]'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : index + 1}
                </div>

                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold leading-tight ${
                        isCurrent
                          ? 'text-[#1A73E8] dark:text-[#8AB4F8]'
                          : isCompleted
                          ? 'text-[#202124] dark:text-[#F8FAFC]'
                          : 'text-[#5F6368] dark:text-[#94A3B8]'
                      }`}
                    >
                      {st.label}
                    </span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8] dark:bg-[#8AB4F8] animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] text-[#88928E] dark:text-[#64748B] hidden sm:block truncate max-w-[90px]">
                    {st.description}
                  </span>
                </div>
              </div>

              {index < WORKFLOW_STAGES.length - 1 && (
                <div className="flex-1 px-1 flex items-center">
                  <div
                    className={`h-0.5 w-full rounded-full transition-colors ${
                      index < currentIndex ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-[#E2E8F0] dark:border-[#23314B]'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
