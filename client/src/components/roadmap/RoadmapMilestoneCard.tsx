import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Calendar,
  User,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  ExternalLink,
  RotateCcw,
  Flag,
  CheckSquare,
  Eye,
} from 'lucide-react';

export interface MilestoneItem {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  stageKey: string | null;
  isDefault: boolean;
  orderIndex: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  progress: number;
  notes: string | null;
  assignedTo: { id: string; fullName: string; username: string; email: string } | null;
  dependencyMilestone: { id: string; title: string; status: string; orderIndex: number } | null;
  task: { id: string; title: string; status: string; dueDate: string | null } | null;
  deadline: { id: string; deadlineType: string; dueDate: string; status: string } | null;
  updatedAt: string;
}

interface RoadmapMilestoneCardProps {
  milestone: MilestoneItem;
  canEdit: boolean;
  onEdit: (milestone: MilestoneItem) => void;
  onViewDetails: (milestone: MilestoneItem) => void;
  onToggleComplete: (milestone: MilestoneItem) => void;
  onDelete: (milestone: MilestoneItem) => void;
  onMoveUp?: (milestone: MilestoneItem) => void;
  onMoveDown?: (milestone: MilestoneItem) => void;
  isFirst?: boolean;
  isLast?: boolean;
  viewMode?: 'timeline' | 'list';
}

export const RoadmapMilestoneCard: React.FC<RoadmapMilestoneCardProps> = ({
  milestone,
  canEdit,
  onEdit,
  onViewDetails,
  onToggleComplete,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  viewMode = 'timeline',
}) => {
  const isOverdue =
    milestone.dueDate &&
    new Date(milestone.dueDate) < new Date() &&
    milestone.status !== 'COMPLETED';

  const isDependencyMet =
    !milestone.dependencyMilestone || milestone.dependencyMilestone.status === 'COMPLETED';

  // Status badges & color styling
  const getStatusBadge = () => {
    switch (milestone.status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FEF3C7]">
            <Clock className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]">
            <AlertTriangle className="w-3.5 h-3.5" /> Blocked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3.5 h-3.5" /> Not Started
          </span>
        );
    }
  };

  return (
    <div
      data-view-mode={viewMode}
      className={`group relative bg-white border rounded-2xl p-5 shadow-xs transition-all duration-200 hover:shadow-md ${
        milestone.status === 'COMPLETED'
          ? 'border-[#DCFCE7] bg-gradient-to-br from-white to-[#F0FDF4]/30'
          : isOverdue
          ? 'border-[#FFE4E6] bg-gradient-to-br from-white to-[#FFF1F2]/20'
          : 'border-[#E5E7E5] hover:border-[#CCD0CD]'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F1F3F4]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 bg-[#FAF9F6] border border-[#E5E7E5] rounded-md text-[10px] font-mono font-bold text-[#5C6662]">
            Step {milestone.orderIndex + 1}
          </span>
          {getStatusBadge()}
          {isOverdue && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <Flag className="w-3 h-3" /> Overdue
            </span>
          )}
          {milestone.isDefault ? (
            <span className="text-[10px] font-semibold text-[#88928E] uppercase tracking-wider">
              Statutory Stage
            </span>
          ) : (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">
              Custom Milestone
            </span>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          {canEdit && onMoveUp && !isFirst && (
            <button
              type="button"
              onClick={() => onMoveUp(milestone)}
              title="Move Up"
              className="p-1.5 text-[#5C6662] hover:text-[#191F1D] hover:bg-[#F1F3F4] rounded-lg transition cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
          {canEdit && onMoveDown && !isLast && (
            <button
              type="button"
              onClick={() => onMoveDown(milestone)}
              title="Move Down"
              className="p-1.5 text-[#5C6662] hover:text-[#191F1D] hover:bg-[#F1F3F4] rounded-lg transition cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(milestone)}
              title="Edit Milestone"
              className="p-1.5 text-[#5C6662] hover:text-[#235952] hover:bg-[#E4F0EC] rounded-lg transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onViewDetails(milestone)}
            title="View Stage Details"
            className="p-1.5 text-[#5C6662] hover:text-[#235952] hover:bg-[#E4F0EC] rounded-lg transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEdit && !milestone.isDefault && (
            <button
              type="button"
              onClick={() => onDelete(milestone)}
              title="Delete Milestone"
              className="p-1.5 text-[#5C6662] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <div className="pt-3.5 space-y-2 cursor-pointer" onClick={() => onViewDetails(milestone)}>
        <h4 className="text-base font-bold text-[#191F1D] tracking-tight group-hover:text-[#235952] transition-colors flex items-center justify-between">
          <span>{milestone.title}</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#88928E] opacity-0 group-hover:opacity-100 transition-opacity" />
        </h4>
        {milestone.description && (
          <p className="text-xs text-[#5C6662] leading-relaxed line-clamp-2">
            {milestone.description}
          </p>
        )}
      </div>

      {/* Dependency Warning */}
      {milestone.dependencyMilestone && (
        <div
          className={`mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2 border ${
            isDependencyMet
              ? 'bg-[#F0FDF4]/70 border-[#DCFCE7] text-[#15803D]'
              : 'bg-amber-50/80 border-amber-200 text-amber-800'
          }`}
        >
          {isDependencyMet ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
          ) : (
            <Lock className="w-4 h-4 shrink-0 text-amber-600" />
          )}
          <span className="truncate">
            Prerequisite: <strong>{milestone.dependencyMilestone.title}</strong>{' '}
            {isDependencyMet ? '(Completed)' : '(Must complete first)'}
          </span>
        </div>
      )}

      {/* Connected Project Task */}
      {milestone.task && (
        <div className="mt-2.5 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 bg-[#F1F6FA] border border-[#E1EBF4] text-[#204B73]">
          <CheckSquare className="w-3.5 h-3.5 shrink-0 text-[#204B73]" />
          <span className="truncate">
            Linked Task: <strong>{milestone.task.title}</strong> ({milestone.task.status})
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#5C6662]">
          <span>Completion</span>
          <span className="font-mono">{milestone.progress}%</span>
        </div>
        <div className="w-full bg-[#ECEEEC] rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              milestone.status === 'COMPLETED'
                ? 'bg-[#16A34A]'
                : milestone.status === 'BLOCKED'
                ? 'bg-rose-500'
                : 'bg-[#235952]'
            }`}
            style={{ width: `${milestone.progress}%` }}
          />
        </div>
      </div>

      {/* Footer Info: Assignee, Dates & Quick Toggle */}
      <div className="mt-4 pt-3 border-t border-[#F1F3F4] flex flex-wrap items-center justify-between gap-3 text-xs text-[#5C6662]">
        <div className="flex items-center gap-3 flex-wrap">
          {milestone.assignedTo ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#191F1D]">
              <div className="w-5 h-5 rounded-full bg-[#E4F0EC] text-[#235952] flex items-center justify-center text-[10px] font-bold">
                {milestone.assignedTo.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[120px]">{milestone.assignedTo.fullName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-[#88928E]">
              <User className="w-3.5 h-3.5" />
              <span>Unassigned</span>
            </div>
          )}

          {milestone.dueDate && (
            <div
              className={`flex items-center gap-1 text-[11px] font-medium ${
                isOverdue ? 'text-rose-600 font-bold' : 'text-[#5C6662]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Due {new Date(milestone.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Quick Complete / Reopen Action */}
        {canEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(milestone);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-3xs ${
              milestone.status === 'COMPLETED'
                ? 'bg-[#FAF9F6] hover:bg-[#ECEEEC] text-[#5C6662] border border-[#E5E7E5]'
                : 'bg-[#235952] hover:bg-[#1B453F] text-white'
            }`}
          >
            {milestone.status === 'COMPLETED' ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Complete</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
