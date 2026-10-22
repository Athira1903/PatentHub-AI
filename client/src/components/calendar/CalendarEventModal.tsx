import React, { useState, useEffect } from 'react';
import type { CalendarEventItem } from './calendarUtils';
import { X, CheckCircle2, Loader2, MapPin, Video, Bell, Layers, CheckSquare, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { patentApi } from '../../services/api';
import { testReminderBeep } from '../../utils/soundEffects';

interface ProjectOption {
  id: string;
  title: string;
}

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  eventToEdit?: CalendarEventItem | null;
  projects: ProjectOption[];
  initialDate?: Date | null;
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  eventToEdit,
  projects,
  initialDate,
}) => {
  const isEditing = !!eventToEdit;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('CUSTOM');
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [projectId, setProjectId] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [availableMilestones, setAvailableMilestones] = useState<Array<{ id: string; title: string }>>([]);
  const [availableTasks, setAvailableTasks] = useState<Array<{ id: string; title: string }>>([]);
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number | ''>(30);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; dates?: string }>({});

  useEffect(() => {
    setFieldErrors({});
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setDescription(eventToEdit.description || '');
      setEventType(eventToEdit.category || 'CUSTOM');
      setAllDay(eventToEdit.allDay || false);

      const s = new Date(eventToEdit.startDate);
      const e = new Date(eventToEdit.endDate);
      setStartDate(s.toISOString().split('T')[0]);
      setStartTime(s.toTimeString().slice(0, 5));
      setEndDate(e.toISOString().split('T')[0]);
      setEndTime(e.toTimeString().slice(0, 5));

      setProjectId(eventToEdit.projectId || '');
      setMilestoneId(eventToEdit.milestoneId || '');
      setTaskId(eventToEdit.taskId || '');
      setLocation(eventToEdit.location || '');
      setMeetingUrl(eventToEdit.meetingUrl || '');
      setReminderMinutes(eventToEdit.reminderMinutes !== undefined && eventToEdit.reminderMinutes !== null ? eventToEdit.reminderMinutes : 30);
      setNotes(eventToEdit.notes || '');
    } else {
      const baseDate = initialDate ? new Date(initialDate) : new Date();
      const dateStr = baseDate.toISOString().split('T')[0];

      setTitle('');
      setDescription('');
      setEventType('CUSTOM');
      setAllDay(false);
      setStartDate(dateStr);
      setStartTime('09:00');
      setEndDate(dateStr);
      setEndTime('10:00');
      setProjectId(projects.length > 0 ? projects[0].id : '');
      setMilestoneId('');
      setTaskId('');
      setLocation('');
      setMeetingUrl('');
      setReminderMinutes(30);
      setNotes('');
    }
  }, [eventToEdit, initialDate, isOpen, projects]);

  // Fetch project milestones and tasks when projectId changes
  useEffect(() => {
    if (!projectId) {
      setAvailableMilestones([]);
      setAvailableTasks([]);
      return;
    }
    const fetchProjectAssets = async () => {
      try {
        const res = await patentApi.getProjectRoadmap(projectId);
        setAvailableMilestones((res.data?.milestones || []).map((m: any) => ({ id: m.id, title: m.title })));
        setAvailableTasks((res.data?.tasks || []).map((t: any) => ({ id: t.id, title: t.title })));
      } catch (err) {
        console.error('Failed to fetch project roadmap assets for calendar event', err);
        setAvailableMilestones([]);
        setAvailableTasks([]);
      }
    };
    fetchProjectAssets();
  }, [projectId]);

  if (!isOpen) return null;

  const validate = () => {
    const errors: { title?: string; dates?: string } = {};
    if (!title.trim()) {
      errors.title = 'Event title is required';
    }

    const startDateTime = allDay
      ? new Date(`${startDate}T00:00:00`)
      : new Date(`${startDate}T${startTime}:00`);

    const endDateTime = allDay
      ? new Date(`${endDate}T23:59:59`)
      : new Date(`${endDate}T${endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      errors.dates = 'Invalid date format';
    } else if (endDateTime.getTime() < startDateTime.getTime()) {
      errors.dates = 'End time cannot precede start time';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const startDateTime = allDay
      ? new Date(`${startDate}T00:00:00`)
      : new Date(`${startDate}T${startTime}:00`);

    const endDateTime = allDay
      ? new Date(`${endDate}T23:59:59`)
      : new Date(`${endDate}T${endTime}:00`);

    try {
      setSubmitting(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        eventType,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        allDay,
        projectId: projectId || null,
        milestoneId: milestoneId || null,
        taskId: taskId || null,
        location: location.trim() || null,
        meetingUrl: meetingUrl.trim() || null,
        reminderMinutes: reminderMinutes ? Number(reminderMinutes) : null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save calendar event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#E5E7E5] rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7E5] pb-4">
          <div>
            <h3 className="text-xl font-bold text-[#191F1D] tracking-tight">
              {isEditing ? 'Edit Calendar Event' : 'Schedule New Event'}
            </h3>
            <p className="text-xs text-[#5C6662]">
              Set up meetings, patent filing milestones, reminders, or reviews.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#5C6662] hover:text-[#191F1D] hover:bg-[#F1F3F4] rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="e.g. Guide Sync on Claims v3, FER Review Session, Filing Prep"
              className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none transition ${
                fieldErrors.title ? 'border-rose-500 bg-rose-50/20' : 'border-[#E5E7E5] focus:border-[#235952]'
              }`}
            />
            {fieldErrors.title && (
              <p className="text-[11px] font-semibold text-rose-600">{fieldErrors.title}</p>
            )}
          </div>

          {/* Event Category & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
                Event Category
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-bold text-[#191F1D] focus:outline-none focus:border-[#235952] transition cursor-pointer"
              >
                <option value="PATENT_DEADLINE">Patent Filing Deadline</option>
                <option value="ROADMAP_MILESTONE">Roadmap Milestone</option>
                <option value="PROJECT_TASK">Project Task</option>
                <option value="GUIDE_MEETING">Guide Meeting</option>
                <option value="EXPERT_REVIEW">Patent Expert Review</option>
                <option value="TEAM_MEETING">Team Meeting</option>
                <option value="REMINDER">Reminder</option>
                <option value="CUSTOM">Custom Event</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
                Related Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none focus:border-[#235952] transition cursor-pointer"
              >
                <option value="">No Project (General Event)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Milestone and Task Links (Optional) */}
          {projectId && (availableMilestones.length > 0 || availableTasks.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E5E7E5]">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#235952]" />
                  <span>Link Milestone (Optional)</span>
                </label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none focus:border-[#235952] transition cursor-pointer"
                >
                  <option value="">No linked milestone</option>
                  {availableMilestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-[#235952]" />
                  <span>Link Task (Optional)</span>
                </label>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none focus:border-[#235952] transition cursor-pointer"
                >
                  <option value="">No linked task</option>
                  {availableTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* All Day Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="allDayCheckbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="rounded accent-[#235952] cursor-pointer"
            />
            <label htmlFor="allDayCheckbox" className="text-xs font-bold text-[#191F1D] cursor-pointer">
              All Day Event
            </label>
          </div>

          {/* Date & Time Selectors */}
          <div className="space-y-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
                  Start Date {!allDay && '& Time'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (fieldErrors.dates) setFieldErrors((prev) => ({ ...prev, dates: undefined }));
                    }}
                    className={`flex-1 px-3 py-2 bg-white border rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none transition ${
                      fieldErrors.dates ? 'border-rose-500 bg-rose-50/20' : 'border-[#E5E7E5] focus:border-[#235952]'
                    }`}
                  />
                  {!allDay && (
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        if (fieldErrors.dates) setFieldErrors((prev) => ({ ...prev, dates: undefined }));
                      }}
                      className={`w-28 px-3 py-2 bg-white border rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none transition ${
                        fieldErrors.dates ? 'border-rose-500 bg-rose-50/20' : 'border-[#E5E7E5] focus:border-[#235952]'
                      }`}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
                  End Date {!allDay && '& Time'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (fieldErrors.dates) setFieldErrors((prev) => ({ ...prev, dates: undefined }));
                    }}
                    className={`flex-1 px-3 py-2 bg-white border rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none transition ${
                      fieldErrors.dates ? 'border-rose-500 bg-rose-50/20' : 'border-[#E5E7E5] focus:border-[#235952]'
                    }`}
                  />
                  {!allDay && (
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        if (fieldErrors.dates) setFieldErrors((prev) => ({ ...prev, dates: undefined }));
                      }}
                      className={`w-28 px-3 py-2 bg-white border rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none transition ${
                        fieldErrors.dates ? 'border-rose-500 bg-rose-50/20' : 'border-[#E5E7E5] focus:border-[#235952]'
                      }`}
                    />
                  )}
                </div>
              </div>
            </div>
            {fieldErrors.dates && (
              <p className="text-[11px] font-semibold text-rose-600 pt-0.5">{fieldErrors.dates}</p>
            )}
          </div>

          {/* Location & Meeting Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#88928E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Conference Room A, Virtual"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none focus:border-[#235952] transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
                Meeting Link (URL)
              </label>
              <div className="relative">
                <Video className="w-3.5 h-3.5 text-[#88928E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full pl-8 pr-3 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none focus:border-[#235952] transition"
                />
              </div>
            </div>
          </div>

          {/* Reminder */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-[#235952]" />
                <span>Reminder Notification</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  testReminderBeep();
                  toast.success('Playing reminder beep sound 🔊');
                }}
                className="text-[11px] font-bold text-[#235952] hover:text-[#1B453F] flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-[#E4F0EC] transition cursor-pointer"
                title="Test Reminder Beep Sound"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Beep 🔊</span>
              </button>
            </div>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none focus:border-[#235952] transition cursor-pointer"
            >
              <option value="">No notification</option>
              <option value="15">15 minutes before (with beep sound)</option>
              <option value="30">30 minutes before (with beep sound)</option>
              <option value="60">1 hour before (with beep sound)</option>
              <option value="1440">1 day before (with beep sound)</option>
            </select>
            <p className="text-[10px] text-[#5C6662]">
              A distinctive beep sound and on-screen reminder will notify you before the event starts.
            </p>
          </div>

          {/* Description & Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
              Notes & Meeting Agenda
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add agenda topics, items to bring, or checklist notes..."
              className="w-full px-4 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none focus:border-[#235952] transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#E5E7E5] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#5C6662] hover:bg-[#F1F3F4] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#235952] hover:bg-[#1B453F] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-3xs disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? 'Update Event' : 'Save Event'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
