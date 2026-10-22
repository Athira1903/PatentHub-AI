import React, { useState, useEffect } from 'react';
import type { MilestoneItem } from './RoadmapMilestoneCard';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface MemberOption {
  id: string;
  fullName: string;
  username: string;
}

interface TaskOption {
  id: string;
  title: string;
  status: string;
}

interface MilestoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  milestoneToEdit?: MilestoneItem | null;
  projectMembers: MemberOption[];
  existingMilestones: MilestoneItem[];
  projectTasks?: TaskOption[];
}

export const MilestoneFormModal: React.FC<MilestoneFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  milestoneToEdit,
  projectMembers,
  existingMilestones,
  projectTasks = [],
}) => {
  const isEditing = !!milestoneToEdit;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'>('NOT_STARTED');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [progress, setProgress] = useState(0);
  const [assignedToId, setAssignedToId] = useState('');
  const [dependencyMilestoneId, setDependencyMilestoneId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; dates?: string }>({});

  useEffect(() => {
    setFieldErrors({});
    if (milestoneToEdit) {
      setTitle(milestoneToEdit.title || '');
      setDescription(milestoneToEdit.description || '');
      setStatus(milestoneToEdit.status || 'NOT_STARTED');
      setStartDate(milestoneToEdit.startDate ? milestoneToEdit.startDate.split('T')[0] : '');
      setDueDate(milestoneToEdit.dueDate ? milestoneToEdit.dueDate.split('T')[0] : '');
      setProgress(milestoneToEdit.progress ?? 0);
      setAssignedToId(milestoneToEdit.assignedTo?.id || '');
      setDependencyMilestoneId(milestoneToEdit.dependencyMilestone?.id || '');
      setTaskId(milestoneToEdit.task?.id || '');
      setNotes(milestoneToEdit.notes || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('NOT_STARTED');
      setStartDate('');
      setDueDate('');
      setProgress(0);
      setAssignedToId('');
      setDependencyMilestoneId('');
      setTaskId('');
      setNotes('');
    }
  }, [milestoneToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errors: { title?: string; dates?: string } = {};
    if (!title.trim()) {
      errors.title = 'Milestone title is required';
    }
    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      errors.dates = 'Due date cannot precede start date';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        status,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        progress: Number(progress),
        assignedToId: assignedToId || null,
        dependencyMilestoneId: dependencyMilestoneId || null,
        taskId: taskId || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save milestone');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter out the milestone itself from dependency choices to prevent circular self-dependency
  const availableDependencies = existingMilestones.filter(
    (m) => !milestoneToEdit || m.id !== milestoneToEdit.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#E5E7E5] rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7E5] pb-4">
          <div>
            <h3 className="text-xl font-bold text-[#191F1D] tracking-tight">
              {isEditing ? 'Edit Milestone' : 'Add Custom Milestone'}
            </h3>
            <p className="text-xs text-[#5C6662]">
              {isEditing
                ? 'Update stage schedule, assignment, instructions, and status.'
                : 'Configure a project-specific roadmap milestone with target deadlines.'}
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
              Milestone Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="e.g. Conduct FTO Search, File Form 18, Fabricate PCB v2"
              className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none transition ${
                fieldErrors.title ? 'border-rose-500 focus:border-rose-600 bg-rose-50/20' : 'border-[#E5E7E5] focus:border-[#235952]'
              }`}
            />
            {fieldErrors.title && (
              <p className="text-[11px] font-semibold text-rose-600">{fieldErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
              Description & Scope
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of objectives, deliverables, and acceptance criteria for this stage..."
              className="w-full px-4 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none focus:border-[#235952] transition"
            />
          </div>

          {/* Status & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-bold text-[#191F1D] focus:outline-none focus:border-[#235952] transition cursor-pointer"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
                  Completion Progress
                </label>
                <span className="text-xs font-mono font-bold text-[#235952]">{progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[#235952] cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (fieldErrors.dates) setFieldErrors((prev) => ({ ...prev, dates: undefined }));
                  }}
                  className={`w-full px-4 py-2 bg-white border rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none transition ${
                    fieldErrors.dates ? 'border-rose-500 bg-rose-50/20' : 'border-[#E5E7E5] focus:border-[#235952]'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (fieldErrors.dates) setFieldErrors((prev) => ({ ...prev, dates: undefined }));
                  }}
                  className={`w-full px-4 py-2 bg-white border rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none transition ${
                    fieldErrors.dates ? 'border-rose-500 bg-rose-50/20' : 'border-[#E5E7E5] focus:border-[#235952]'
                  }`}
                />
              </div>
            </div>
            {fieldErrors.dates && (
              <p className="text-[11px] font-semibold text-rose-600 pt-0.5">{fieldErrors.dates}</p>
            )}
          </div>

          {/* Assignee & Dependency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
                Assign To Project Member
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none focus:border-[#235952] transition cursor-pointer"
              >
                <option value="">Unassigned</option>
                {projectMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName} (@{member.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
                Prerequisite Dependency
              </label>
              <select
                value={dependencyMilestoneId}
                onChange={(e) => setDependencyMilestoneId(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none focus:border-[#235952] transition cursor-pointer"
              >
                <option value="">None (Independent stage)</option>
                {availableDependencies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.orderIndex + 1}. {m.title} ({m.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Link Project Task */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
              Link Project Task (Optional)
            </label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-[#E5E7E5] rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none focus:border-[#235952] transition cursor-pointer"
            >
              <option value="">None (No connected task)</option>
              {projectTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#191F1D] uppercase tracking-wider">
              Notes & Special Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide statutory guidelines, submission instructions, or checklist requirements..."
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
                  <span>{isEditing ? 'Save Changes' : 'Create Milestone'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
