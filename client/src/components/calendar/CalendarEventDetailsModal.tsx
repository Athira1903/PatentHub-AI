import React from 'react';
import { type CalendarEventItem, getCategoryConfig } from './calendarUtils';
import {
  X,
  Clock,
  Calendar,
  MapPin,
  Video,
  ExternalLink,
  Edit2,
  Trash2,
  Flag,
  User,
  FolderKanban,
  FileText,
  Scale,
  Layers,
  CheckSquare,
  Bell,
  Volume2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { testReminderBeep } from '../../utils/soundEffects';

interface CalendarEventDetailsModalProps {
  event: CalendarEventItem | null;
  onClose: () => void;
  onEdit: (event: CalendarEventItem) => void;
  onDelete: (event: CalendarEventItem) => void;
}

export const CalendarEventDetailsModal: React.FC<CalendarEventDetailsModalProps> = ({
  event,
  onClose,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  if (!event) return null;

  const conf = getCategoryConfig(event.category);
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  const formattedDate = start.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = event.allDay
    ? 'All Day'
    : `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const getSourceDescription = () => {
    switch (event.sourceType) {
      case 'PATENT_DEADLINE':
        return 'Statutory Indian patent deadline calculated under Section 9(1) or 11B of the Patents Act, 1970.';
      case 'ROADMAP_MILESTONE':
        return 'Synced from project lifecycle roadmap. Update milestone dates on the roadmap page to reschedule.';
      case 'PROJECT_TASK':
        return 'Synced directly from project task assignments.';
      case 'PROJECT_REVIEW':
        return 'Formal review recorded by project guide or certified patent expert.';
      default:
        return 'Independent calendar event created in workspace.';
    }
  };

  const getSourceButtonLabel = () => {
    switch (event.sourceType) {
      case 'ROADMAP_MILESTONE':
        return 'Open in Roadmap';
      case 'PROJECT_TASK':
        return 'Open in Tasks';
      case 'PATENT_DEADLINE':
        return 'Open in Forms & Filing';
      case 'PROJECT_REVIEW':
        return 'Open in Reviews';
      default:
        return event.projectId ? 'Open Project Workspace' : 'Open Source Item';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#E5E7E5] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7E5] pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${conf.bg} ${conf.border} ${conf.text}`}
              >
                <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                {conf.label}
              </span>

              {event.isOverdue && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <Flag className="w-3 h-3" /> Overdue
                </span>
              )}

              {event.status === 'COMPLETED' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Completed
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-[#191F1D] tracking-tight">{event.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#5C6662] hover:text-[#191F1D] hover:bg-[#F1F3F4] rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date & Time */}
        <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E7E5] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#191F1D]">
            <Calendar className="w-4 h-4 text-[#235952]" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#5C6662]">
            <Clock className="w-4 h-4 text-[#88928E]" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Project Link */}
        {event.projectTitle && (
          <div className="flex items-center justify-between p-3.5 bg-[#FAF9F6] border border-[#E5E7E5] rounded-2xl text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FolderKanban className="w-4 h-4 text-[#235952] shrink-0" />
              <div className="truncate">
                <span className="text-[#88928E] block text-[10px] uppercase font-bold">Project</span>
                <span className="font-bold text-[#191F1D] truncate block">{event.projectTitle}</span>
              </div>
            </div>
            {event.navigationUrl && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(event.navigationUrl);
                }}
                className="px-3 py-1.5 bg-white hover:bg-[#F1F3F4] border border-[#E5E7E5] rounded-xl text-xs font-bold text-[#235952] transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Open Project</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Connected Project Assets */}
        {(event.milestoneTitle || event.taskTitle) && (
          <div className="p-3.5 bg-[#F1F6FA] border border-[#E1EBF4] rounded-2xl space-y-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-[#204B73] block">Connected Project Assets</span>
            {event.milestoneTitle && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#204B73] truncate">
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Milestone: <strong>{event.milestoneTitle}</strong></span>
                </div>
                {event.projectId && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/dashboard/roadmap?project=${event.projectId}`);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#E1EBF4] text-[#204B73] rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>View Roadmap</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            {event.taskTitle && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#204B73] truncate">
                  <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Task: <strong>{event.taskTitle}</strong></span>
                </div>
                {event.projectId && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/dashboard/projects/${event.projectId}?tab=Tasks`);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#E1EBF4] text-[#204B73] rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>View Tasks</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Location & Meeting Links */}
        {(event.location || event.meetingUrl) && (
          <div className="space-y-2 text-xs">
            {event.location && (
              <div className="flex items-center gap-2 text-[#5C6662]">
                <MapPin className="w-4 h-4 text-[#88928E] shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            {event.meetingUrl && (
              <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
                <div className="flex items-center gap-2 text-indigo-900 font-bold truncate">
                  <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">{event.meetingUrl}</span>
                </div>
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shrink-0 ml-2"
                >
                  Join Meeting
                </a>
              </div>
            )}
          </div>
        )}

        {/* Assignee & Reminders */}
        {(event.assignedTo || (event.reminderMinutes !== undefined && event.reminderMinutes !== null)) && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#5C6662]">
            {event.assignedTo && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#88928E]" />
                <span>Assigned to:</span>
                <span className="font-bold text-[#191F1D]">{event.assignedTo.fullName}</span>
              </div>
            )}
            {event.reminderMinutes !== undefined && event.reminderMinutes !== null && (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E5E7E5] px-2.5 py-1 rounded-lg">
                  <Bell className="w-3.5 h-3.5 text-[#235952]" />
                  <span className="font-semibold text-[#191F1D]">Reminder:</span>
                  <span>{event.reminderMinutes} mins before</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    testReminderBeep();
                    toast.success('Playing reminder beep sound 🔊');
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#235952] hover:text-[#1B453F] px-2 py-1 rounded-lg hover:bg-[#E4F0EC] transition cursor-pointer"
                  title="Test reminder beep sound"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Test Beep 🔊</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Description or Notes */}
        {(event.description || event.notes) && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#88928E] uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Details & Notes
            </label>
            <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#E5E7E5] text-xs text-[#5C6662] leading-relaxed whitespace-pre-wrap">
              {event.description || event.notes}
            </div>
          </div>
        )}

        {/* Source Notice */}
        <div className="p-3 bg-[#FAF9F6] border border-[#E5E7E5] rounded-xl text-[11px] text-[#88928E] leading-normal flex items-start gap-2">
          <Scale className="w-3.5 h-3.5 text-[#88928E] shrink-0 mt-0.5" />
          <span>{getSourceDescription()}</span>
        </div>

        {/* Actions Footer */}
        <div className="pt-3 border-t border-[#E5E7E5] flex items-center justify-between gap-3">
          {event.isEditable ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="px-3.5 py-2 bg-[#235952] hover:bg-[#1B453F] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit / Reschedule</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(event);
                }}
                className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-[#88928E] font-medium italic">
              Managed by project source of truth
            </div>
          )}

          {event.navigationUrl && (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(event.navigationUrl);
              }}
              className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#ECEEEC] text-[#191F1D] border border-[#E5E7E5] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs ml-auto"
            >
              <span>{getSourceButtonLabel()}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
