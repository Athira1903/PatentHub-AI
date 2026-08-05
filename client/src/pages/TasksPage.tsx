import React, { useEffect, useState } from 'react';
import { CheckSquare, Plus, Trash2, CheckCircle2 } from 'lucide-react';
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

      // Flatten tasks from all projects
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
        description: taskDesc.trim() || null,
        assignedToUsername: taskAssignee.trim() || null,
      });
      toast.success('Task created and assigned successfully!');
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssignee('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create task.');
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
    <div className="space-y-6 max-w-6xl mx-auto py-4 font-sans animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Task Tracker</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Manage engineering milestones and patent drafting checklist items.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main tasks list column */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Filters category tabs */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex gap-2">
              {(['ALL', 'PENDING', 'COMPLETED'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                    filter === mode
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {mode === 'ALL' ? 'All Tasks' : mode === 'PENDING' ? 'Pending' : 'Completed'}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'} found
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs font-semibold">Loading task list...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-semibold space-y-2">
              <CheckSquare className="w-10 h-10 mx-auto text-slate-300" />
              <p>No tasks matched this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider text-[9px] pb-2">
                    <th className="pb-2">Task</th>
                    <th className="pb-2">Associated Project</th>
                    <th className="pb-2">Assignee</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(t.projectId, t.id, t.status)}
                            className="w-4.5 h-4.5 border-2 border-slate-300 rounded flex items-center justify-center bg-white cursor-pointer hover:border-indigo-600"
                          >
                            {t.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                          </button>
                          <div>
                            <span className={`font-bold text-slate-800 ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : ''}`}>
                              {t.title}
                            </span>
                            {t.description && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-2 font-semibold text-slate-600">{t.projectTitle}</td>
                      <td className="py-3.5 pr-2">
                        <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 rounded-lg">
                          {t.assignedTo ? `@${t.assignedTo.username}` : 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteTask(t.projectId, t.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

        {/* Task Creation Sidebar Column */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Plus className="w-4.5 h-4.5 text-indigo-650" /> Add New Task
          </h3>
          <p className="text-slate-500 text-xs leading-normal font-semibold">
            Select an active patent workspace project to allocate a new check-off milestone item:
          </p>

          {projects.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 font-bold">
              You must create or join a patent project before assigning tasks.
            </p>
          ) : (
            <form onSubmit={handleCreateTask} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Target Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Conduct patent claim 1 prior search"
                  className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Task Description</label>
                <input
                  type="text"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Detailed observations details"
                  className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Assignee Username</label>
                <input
                  type="text"
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  placeholder="e.g. STU202600001 (optional)"
                  className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-9.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
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
