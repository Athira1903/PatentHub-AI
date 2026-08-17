import React, { useEffect, useState } from 'react';
import { CheckSquare, Plus, Trash2, Check } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface ProjectOption {
  id: string;
  title: string;
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  projectId: string;
  projectTitle: string;
  assignedTo?: { id: string; fullName: string; username: string } | null;
}

export const TasksPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  // Task creation states
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      const projList = res.data.projects || [];
      setProjects(projList.map((p: any) => ({ id: p.id, title: p.title })));

      const allTasks: TaskItem[] = projList.flatMap((p: any) =>
        (p.tasks || []).map((t: any) => ({
          ...t,
          projectId: p.id,
          projectTitle: p.title,
        }))
      );
      setTasks(allTasks);

      if (projList.length > 0) {
        setSelectedProjectId(projList[0].id);
      }
    } catch (e) {
      console.error('Failed to load tasks', e);
      toast.error('Failed to fetch tasks list');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (projectId: string, taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, { status: newStatus });
      toast.success(newStatus === 'COMPLETED' ? 'Task marked completed!' : 'Task reopened!');
      fetchData();
    } catch (e) {
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTask = async (projectId: string, taskId: string) => {
    if (!window.confirm('Delete this task permanently?')) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      toast.success('Task deleted successfully');
      fetchData();
    } catch (e) {
      toast.error('Failed to delete task');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      toast.error('Please select a project first.');
      return;
    }
    if (!taskTitle.trim()) {
      toast.error('Task title is required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/projects/${selectedProjectId}/tasks`, {
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        assignedToUsername: taskAssignee.trim() || undefined,
      });

      toast.success('Task created successfully!');
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssignee('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'PENDING') return t.status !== 'COMPLETED';
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2 font-sans animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Tasks & Checklist</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Track engineering milestones, claims checklists, and patent preparation tasks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main tasks list column (8 cols) */}
        <div className="lg:col-span-8 app-card p-6 space-y-6">
          {/* Filters category tabs */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex gap-2">
              {(['ALL', 'PENDING', 'COMPLETED'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filter === mode
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode === 'ALL' ? 'All Tasks' : mode === 'PENDING' ? 'Pending' : 'Completed'}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">Loading task list...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium space-y-2">
              <CheckSquare className="w-8 h-8 mx-auto text-slate-300" />
              <p>No tasks matched this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] pb-2">
                    <th className="pb-2.5">Task</th>
                    <th className="pb-2.5">Project</th>
                    <th className="pb-2.5">Assignee</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleToggleStatus(t.projectId, t.id, t.status)}
                            className="w-5 h-5 border border-slate-300 rounded-lg flex items-center justify-center bg-white cursor-pointer hover:border-blue-600 transition shrink-0"
                          >
                            {t.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />}
                          </button>
                          <div>
                            <span className={`font-bold text-slate-900 ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : ''}`}>
                              {t.title}
                            </span>
                            {t.description && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-2 font-medium text-slate-600">{t.projectTitle}</td>
                      <td className="py-3.5 pr-2">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                          {t.assignedTo ? `@${t.assignedTo.username}` : 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteTask(t.projectId, t.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Task Creation Sidebar Column (4 cols) */}
        <div className="lg:col-span-4 app-card p-6 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" /> Add New Task
          </h3>
          <p className="text-slate-500 text-xs font-medium">
            Allocate a new checklist or drafting milestone to an active project:
          </p>

          {projects.length === 0 ? (
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium">
              You must create or join a patent project before assigning tasks.
            </p>
          ) : (
            <form onSubmit={handleCreateTask} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:bg-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Draft claim 1 independent limitations"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Task Description</label>
                <input
                  type="text"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Details or sub-points"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assignee Username</label>
                <input
                  type="text"
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  placeholder="Username (optional)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:border-blue-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Creating...' : 'Create & Assign Task'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
