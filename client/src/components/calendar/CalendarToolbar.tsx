import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  FolderKanban,
  X,
  Volume2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { testReminderBeep } from '../../utils/soundEffects';

export type CalendarViewMode = 'month' | 'week' | 'agenda';

interface ProjectOption {
  id: string;
  title: string;
}

interface CalendarToolbarProps {
  currentDateHeading: string;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  projects: ProjectOption[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onAddEvent: () => void;
  onClearFilters: () => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentDateHeading,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  selectedProjectId,
  onProjectChange,
  projects,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  onAddEvent,
  onClearFilters,
}) => {
  return (
    <div className="bg-white border border-[#E5E7E5] rounded-3xl p-4 sm:p-5 shadow-3xs space-y-4">
      {/* Top Row: Date Navigation & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation & Date Heading */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[#FAF9F6] border border-[#E5E7E5] p-1 rounded-xl shadow-3xs">
            <button
              type="button"
              onClick={onPrev}
              title="Previous"
              className="p-1.5 text-[#5C6662] hover:text-[#191F1D] hover:bg-white rounded-lg transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToday}
              className="px-3 py-1 bg-white hover:bg-[#F1F3F4] text-[#191F1D] rounded-lg text-xs font-bold border border-[#E5E7E5] transition cursor-pointer shadow-3xs"
            >
              Today
            </button>
            <button
              type="button"
              onClick={onNext}
              title="Next"
              className="p-1.5 text-[#5C6662] hover:text-[#191F1D] hover:bg-white rounded-lg transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-[#191F1D] tracking-tight">
            {currentDateHeading}
          </h2>
        </div>

        {/* View Switcher & Add Event */}
        <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#FAF9F6] border border-[#E5E7E5] p-1 rounded-xl shadow-3xs">
            {(['month', 'week', 'agenda'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition capitalize cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white text-[#235952] border border-[#E5E7E5] shadow-3xs'
                    : 'text-[#5C6662] hover:text-[#191F1D]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Reminder Beep Alert Test Button */}
          <button
            type="button"
            onClick={() => {
              testReminderBeep();
              toast.success('Reminder beep audio test: Sound active 🔊');
            }}
            className="px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#E4F0EC] text-[#235952] border border-[#E5E7E5] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
            title="Test reminder beep sound"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Beep Alert</span>
          </button>

          {/* Add Event Button */}
          <button
            type="button"
            onClick={onAddEvent}
            className="px-4 py-2 bg-[#235952] hover:bg-[#1B453F] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Project & Category Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#F1F3F4] text-xs">
        {/* Project Selector Filter */}
        <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E5E7E5] px-3 py-1.5 rounded-xl">
          <FolderKanban className="w-3.5 h-3.5 text-[#235952]" />
          <span className="text-[#88928E] font-semibold">Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => onProjectChange(e.target.value)}
            className="bg-transparent font-bold text-[#191F1D] focus:outline-none cursor-pointer max-w-[180px] truncate"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E5E7E5] px-3 py-1.5 rounded-xl">
          <Filter className="w-3.5 h-3.5 text-[#235952]" />
          <span className="text-[#88928E] font-semibold">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-transparent font-bold text-[#191F1D] focus:outline-none cursor-pointer"
          >
            <option value="">All Event Types</option>
            <option value="PATENT_DEADLINE">Patent Filing Deadlines</option>
            <option value="ROADMAP_MILESTONE">Roadmap Milestones</option>
            <option value="PROJECT_TASK">Project Tasks</option>
            <option value="GUIDE_MEETING">Guide Meetings</option>
            <option value="EXPERT_REVIEW">Patent Expert Reviews</option>
            <option value="TEAM_MEETING">Team Meetings</option>
            <option value="REMINDER">Reminders</option>
            <option value="CUSTOM">Custom Events</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E5E7E5] px-3 py-1.5 rounded-xl">
          <span className="text-[#88928E] font-semibold">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-transparent font-bold text-[#191F1D] focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="OVERDUE">Overdue Only</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(selectedProjectId || selectedCategory || selectedStatus) && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer shadow-3xs ml-auto"
            title="Reset all active filters"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
