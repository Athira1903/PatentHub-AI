import React from 'react';
import { type MilestoneItem, RoadmapMilestoneCard } from './RoadmapMilestoneCard';
import { CheckCircle2 } from 'lucide-react';

interface RoadmapTimelineProps {
  milestones: MilestoneItem[];
  canEdit: boolean;
  onEdit: (milestone: MilestoneItem) => void;
  onViewDetails: (milestone: MilestoneItem) => void;
  onToggleComplete: (milestone: MilestoneItem) => void;
  onDelete: (milestone: MilestoneItem) => void;
  onMoveUp?: (milestone: MilestoneItem) => void;
  onMoveDown?: (milestone: MilestoneItem) => void;
  viewMode: 'timeline' | 'list';
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({
  milestones,
  canEdit,
  onEdit,
  onViewDetails,
  onToggleComplete,
  onDelete,
  onMoveUp,
  onMoveDown,
  viewMode,
}) => {
  if (milestones.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-[#E5E7E5] rounded-3xl shadow-xs space-y-3">
        <p className="text-sm font-semibold text-[#5C6662]">No milestones configured for this roadmap.</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <RoadmapMilestoneCard
            key={milestone.id}
            milestone={milestone}
            canEdit={canEdit}
            onEdit={onEdit}
            onViewDetails={onViewDetails}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isFirst={index === 0}
            isLast={index === milestones.length - 1}
            viewMode="list"
          />
        ))}
      </div>
    );
  }

  // Visual Connected Timeline View
  return (
    <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:left-3 md:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#CCD0CD]">
      {milestones.map((milestone, index) => {
        const isCompleted = milestone.status === 'COMPLETED';
        const isInProgress = milestone.status === 'IN_PROGRESS';
        const isBlocked = milestone.status === 'BLOCKED';

        return (
          <div key={milestone.id} className="relative group">
            {/* Timeline Node Circle */}
            <button
              type="button"
              onClick={() => onViewDetails(milestone)}
              title={`View Stage ${index + 1}: ${milestone.title}`}
              className={`absolute -left-6 md:-left-10 top-5 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all duration-200 z-10 cursor-pointer hover:scale-110 active:scale-95 ${
                isCompleted
                  ? 'bg-[#16A34A] text-white ring-4 ring-[#DCFCE7]'
                  : isInProgress
                  ? 'bg-[#235952] text-white ring-4 ring-[#E4F0EC] animate-pulse'
                  : isBlocked
                  ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                  : 'bg-white text-[#5C6662] border-2 border-[#CBD5E1] hover:border-[#235952]'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </button>

            {/* Milestone Card */}
            <div className="transition-transform duration-200 group-hover:-translate-y-0.5">
              <RoadmapMilestoneCard
                milestone={milestone}
                canEdit={canEdit}
                onEdit={onEdit}
                onViewDetails={onViewDetails}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                isFirst={index === 0}
                isLast={index === milestones.length - 1}
                viewMode="timeline"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
