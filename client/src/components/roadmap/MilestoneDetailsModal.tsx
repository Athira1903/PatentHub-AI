import React from 'react';
import type { MilestoneItem } from './RoadmapMilestoneCard';
import {
  X,
  CheckCircle2,
  Clock,
  Lock,
  Calendar,
  FileText,
  CheckSquare,
  Scale,
  Edit2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MilestoneDetailsModalProps {
  milestone: MilestoneItem | null;
  onClose: () => void;
  onEdit: (milestone: MilestoneItem) => void;
  onToggleComplete: (milestone: MilestoneItem) => void;
  canEdit: boolean;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const MilestoneDetailsModal: React.FC<MilestoneDetailsModalProps> = ({
  milestone,
  onClose,
  onEdit,
  onToggleComplete,
  canEdit,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
}) => {
  if (!milestone) return null;

  const isOverdue =
    milestone.dueDate &&
    new Date(milestone.dueDate) < new Date() &&
    milestone.status !== 'COMPLETED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#E5E7E5] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7E5] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FAF9F6] border border-[#E5E7E5] text-[#5C6662]">
                Stage {milestone.orderIndex + 1}
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                  milestone.status === 'COMPLETED'
                    ? 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]'
                    : milestone.status === 'IN_PROGRESS'
                    ? 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]'
                    : milestone.status === 'BLOCKED'
                    ? 'bg-[#FFF1F2] text-[#BE123C] border-[#FFE4E6]'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {milestone.status.replace(/_/g, ' ')}
              </span>
              {milestone.isDefault ? (
                <span className="text-[11px] font-semibold text-[#88928E] uppercase tracking-wider">
                  Default Stage
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-bold">
                  Custom Milestone
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-[#191F1D] tracking-tight">{milestone.title}</h3>
          </div>
          <div className="flex items-center gap-1">
            {onNavigatePrev && (
              <button
                type="button"
                onClick={onNavigatePrev}
                disabled={!hasPrev}
                title="Previous Stage"
                className="p-1.5 text-[#5C6662] hover:text-[#191F1D] hover:bg-[#F1F3F4] rounded-xl transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {onNavigateNext && (
              <button
                type="button"
                onClick={onNavigateNext}
                disabled={!hasNext}
                title="Next Stage"
                className="p-1.5 text-[#5C6662] hover:text-[#191F1D] hover:bg-[#F1F3F4] rounded-xl transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#5C6662] hover:text-[#191F1D] hover:bg-[#F1F3F4] rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Description */}
        {milestone.description && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#88928E] uppercase tracking-wider">
              Description & Objectives
            </label>
            <p className="text-xs text-[#191F1D] leading-relaxed bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E7E5]">
              {milestone.description}
            </p>
          </div>
        )}

        {/* Progress & Dates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E7E5] space-y-2">
            <span className="text-[10px] font-bold text-[#88928E] uppercase tracking-wider">
              Progress & Completion
            </span>
            <div className="flex items-center justify-between text-sm font-bold text-[#191F1D]">
              <span>Status</span>
              <span className="font-mono">{milestone.progress}%</span>
            </div>
            <div className="w-full bg-[#ECEEEC] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-[#235952] rounded-full transition-all"
                style={{ width: `${milestone.progress}%` }}
              />
            </div>
          </div>

          <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E7E5] space-y-1">
            <span className="text-[10px] font-bold text-[#88928E] uppercase tracking-wider">
              Schedule & Deadlines
            </span>
            <div className="text-xs text-[#191F1D] space-y-1 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#5C6662]" />
                <span>
                  Start: {milestone.startDate ? new Date(milestone.startDate).toLocaleDateString() : 'Not scheduled'}
                </span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  isOverdue ? 'text-rose-600 font-bold' : 'text-[#191F1D]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'No deadline set'}
                  {isOverdue && ' (OVERDUE)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assignee & Dependency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E7E5] space-y-1">
            <span className="text-[10px] font-bold text-[#88928E] uppercase tracking-wider">
              Assigned Member
            </span>
            {milestone.assignedTo ? (
              <div className="flex items-center gap-2 pt-1">
                <div className="w-7 h-7 rounded-full bg-[#E4F0EC] text-[#235952] flex items-center justify-center text-xs font-bold">
                  {milestone.assignedTo.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#191F1D]">{milestone.assignedTo.fullName}</div>
                  <div className="text-[10px] text-[#5C6662]">@{milestone.assignedTo.username}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#88928E] italic pt-1">No member assigned</div>
            )}
          </div>

          <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E7E5] space-y-1">
            <span className="text-[10px] font-bold text-[#88928E] uppercase tracking-wider">
              Prerequisite Dependency
            </span>
            {milestone.dependencyMilestone ? (
              <div className="text-xs font-semibold text-[#191F1D] pt-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{milestone.dependencyMilestone.title}</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-200">
                  {milestone.dependencyMilestone.status}
                </span>
              </div>
            ) : (
              <div className="text-xs text-[#88928E] italic pt-1">No prerequisite dependencies</div>
            )}
          </div>
        </div>

        {/* Linked Tasks or Deadlines */}
        {(milestone.task || milestone.deadline) && (
          <div className="bg-[#F1F6FA] p-4 rounded-2xl border border-[#E1EBF4] space-y-2">
            <span className="text-[10px] font-bold text-[#204B73] uppercase tracking-wider">
              Connected Project Assets
            </span>
            {milestone.task && (
              <div className="text-xs text-[#204B73] flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Linked Task: <strong>{milestone.task.title}</strong> ({milestone.task.status})
                </span>
              </div>
            )}
            {milestone.deadline && (
              <div className="text-xs text-[#204B73] flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Statutory Filing Deadline: <strong>{milestone.deadline.deadlineType}</strong> (Due:{' '}
                  {new Date(milestone.deadline.dueDate).toLocaleDateString()})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Notes & Instructions */}
        {milestone.notes && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#88928E] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Notes & Important Instructions
            </label>
            <p className="text-xs text-[#5C6662] bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E7E5] whitespace-pre-wrap leading-relaxed">
              {milestone.notes}
            </p>
          </div>
        )}

        {/* Footer Meta */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#88928E] border-t border-[#E5E7E5]">
          <span>
            Last updated: {new Date(milestone.updatedAt).toLocaleString()}
          </span>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  onToggleComplete(milestone);
                  onClose();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs ${
                  milestone.status === 'COMPLETED'
                    ? 'bg-[#FAF9F6] hover:bg-[#ECEEEC] text-[#5C6662] border border-[#E5E7E5]'
                    : 'bg-[#235952] hover:bg-[#1B453F] text-white'
                }`}
              >
                {milestone.status === 'COMPLETED' ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen Stage</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark as Completed</span>
                  </>
                )}
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(milestone);
                }}
                className="px-4 py-2 bg-[#235952] hover:bg-[#1B453F] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Stage</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
