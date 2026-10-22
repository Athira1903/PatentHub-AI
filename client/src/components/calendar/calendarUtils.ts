export interface CalendarEventItem {
  id: string;
  sourceId: string;
  sourceType: 'CUSTOM_EVENT' | 'ROADMAP_MILESTONE' | 'PROJECT_TASK' | 'PATENT_DEADLINE' | 'PROJECT_REVIEW';
  title: string;
  description: string | null;
  category:
    | 'PATENT_DEADLINE'
    | 'ROADMAP_MILESTONE'
    | 'PROJECT_TASK'
    | 'GUIDE_MEETING'
    | 'EXPERT_REVIEW'
    | 'TEAM_MEETING'
    | 'REMINDER'
    | 'CUSTOM';
  startDate: string;
  endDate: string;
  allDay: boolean;
  status: 'SCHEDULED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  isOverdue: boolean;
  projectId: string | null;
  projectTitle: string | null;
  assignedTo: { id: string; fullName: string; username: string } | null;
  location?: string | null;
  meetingUrl?: string | null;
  notes?: string | null;
  reminderMinutes?: number | null;
  navigationUrl: string;
  isEditable: boolean;
  milestoneId?: string | null;
  milestoneTitle?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
}

export const CATEGORY_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  PATENT_DEADLINE: {
    label: 'Patent Deadline',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
  ROADMAP_MILESTONE: {
    label: 'Roadmap Milestone',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  PROJECT_TASK: {
    label: 'Project Task',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  GUIDE_MEETING: {
    label: 'Guide Meeting',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  EXPERT_REVIEW: {
    label: 'Expert Review',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  TEAM_MEETING: {
    label: 'Team Meeting',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
  },
  REMINDER: {
    label: 'Reminder',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  CUSTOM: {
    label: 'Custom Event',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-500',
  },
};

export const getCategoryConfig = (category: string) => {
  return (
    CATEGORY_CONFIG[category] || {
      label: category.replace(/_/g, ' '),
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-700',
      dot: 'bg-slate-500',
    }
  );
};
