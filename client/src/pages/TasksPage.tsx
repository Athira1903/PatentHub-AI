import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Trash2,
  Check,
  Users,
  Folder,
  Calendar,
  ExternalLink,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface ProjectMember {
  userId: string;
  user: {
    id: string;
    fullName: string;
    username: string;
    role?: string;
  };
}

interface ProjectOption {
  id: string;
  title: string;
  ownerId: string;
  owner?: { id: string; fullName: string; username: string };
  members?: ProjectMember[];
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: string; // TODO, IN_PROGRESS, COMPLETED
  priority?: string; // LOW, MEDIUM, HIGH, URGENT
  dueDate?: string | null;
  createdAt: string;
  projectId: string;
  projectTitle: string;
  createdBy?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; fullName: string; username: string } | null;
}

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext<{ user?: any }>() || {};
  const [currentUser, setCurrentUser] = useState<any>(outletContext.user || null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  // Task Details Modal
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Task Creation Modal / Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (outletContext.user && !currentUser) {
      setCurrentUser(outletContext.user);
    }
  }, [outletContext.user, currentUser]);

  useEffect(() => {
    fetchData(true);
  }, []);

  const fetchData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      if (!currentUser && !outletContext.user) {
        try {
          const userRes = await api.get('/auth/profile');
          if (userRes.data?.user) {
            setCurrentUser(userRes.data.user);
          }
        } catch (e) {
          console.warn('Failed to load user profile in TasksPage', e);
        }
      }

      // Fetch projects authorized for this inventor
      const projRes = await api.get('/projects');
      const projList = projRes.data?.projects || [];

      setProjects(
        projList.map((p: any) => ({
          id: p.id,
          title: p.title,
          ownerId: p.ownerId,
          owner: p.owner,
          members: p.members || [],
        }))
      );

      const allTasks: TaskItem[] = projList.flatMap((p: any) =>
        (p.tasks || []).map((t: any) => ({
          ...t,
          projectId: p.id,
          projectTitle: p.title,
        }))
      );

      setTasks(allTasks);

      if (projList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load tasks', err);
      toast.error(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleToggleStatus = async (projectId: string, taskId: string, currentStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }

    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, { status: newStatus });
      toast.success(newStatus === 'COMPLETED' ? 'Task marked completed!' : 'Task marked to-do!');
      fetchData(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update task status');
      fetchData(false);
    }
  };

  const handleUpdateStatus = async (projectId: string, taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }

    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, { status: newStatus });
      toast.success(`Task status updated to ${newStatus.replace('_', ' ')}!`);
      fetchData(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update task status');
      fetchData(false);
    }
  };

  const handleDeleteTask = async (projectId: string, taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      toast.success('Task deleted successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete task');
      fetchData(false);
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
      const payload: any = {
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        priority: taskPriority,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
      };

      if (taskAssigneeId) {
        payload.assignedToId = taskAssigneeId;
      }

      await api.post(`/projects/${selectedProjectId}/tasks`, payload);
      toast.success('Task created successfully!');
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssigneeId('');
      setTaskDueDate('');
      setTaskPriority('MEDIUM');
      setShowCreateModal(false);
      fetchData(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if a task is overdue
  const isOverdue = (t: TaskItem) => {
    if (!t.dueDate || t.status === 'COMPLETED') return false;
    return new Date(t.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
  };

  // Real database metrics
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueTasks = tasks.filter(isOverdue).length;

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Project filter
    if (selectedProjectFilter !== 'ALL' && t.projectId !== selectedProjectFilter) {
      return false;
    }

    // Status filter
    if (statusFilter === 'TODO' && t.status !== 'TODO') return false;
    if (statusFilter === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false;
    if (statusFilter === 'COMPLETED' && t.status !== 'COMPLETED') return false;
    if (statusFilter === 'OVERDUE' && !isOverdue(t)) return false;

    // Priority filter
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchProj = t.projectTitle?.toLowerCase().includes(q);
      const matchAssignee = t.assignedTo?.fullName?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchProj && !matchAssignee) return false;
    }

    return true;
  });

  // Project members for the creation dropdown
  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  const projectMembersList: Array<{ id: string; name: string; role: string }> = [];
  if (currentProject) {
    if (currentProject.owner) {
      projectMembersList.push({
        id: currentProject.owner.id,
        name: currentProject.owner.fullName,
        role: 'Lead Inventor',
      });
    }
    if (currentProject.members) {
      currentProject.members.forEach((m) => {
        if (m.user && m.user.id !== currentProject.owner?.id) {
          projectMembersList.push({
            id: m.user.id,
            name: m.user.fullName,
            role: m.user.role || 'Collaborator',
          });
        }
      });
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fade-in font-sans pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Tasks
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
              {totalTasks} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage your patent project activities and deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
          <button
            onClick={() => fetchData(true)}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-xl transition cursor-pointer shadow-xs"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 bg-white rounded-2xl border transition cursor-pointer shadow-3xs hover:border-slate-300 ${
            statusFilter === 'ALL' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200/80'
          }`}
        >
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Total Tasks
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalTasks}</span>
        </div>

        <div
          onClick={() => setStatusFilter('TODO')}
          className={`p-4 bg-white rounded-2xl border transition cursor-pointer shadow-3xs hover:border-slate-300 ${
            statusFilter === 'TODO' ? 'border-slate-600 ring-2 ring-slate-100' : 'border-slate-200/80'
          }`}
        >
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
            To Do
          </span>
          <span className="text-2xl font-black text-slate-700 mt-1 block">{todoTasks}</span>
        </div>

        <div
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-4 bg-white rounded-2xl border transition cursor-pointer shadow-3xs hover:border-blue-300 ${
            statusFilter === 'IN_PROGRESS' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200/80'
          }`}
        >
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
            In Progress
          </span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{inProgressTasks}</span>
        </div>

        <div
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-4 bg-white rounded-2xl border transition cursor-pointer shadow-3xs hover:border-emerald-300 ${
            statusFilter === 'COMPLETED' ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200/80'
          }`}
        >
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
            Completed
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{completedTasks}</span>
        </div>

        <div
          onClick={() => setStatusFilter('OVERDUE')}
          className={`p-4 bg-white rounded-2xl border transition cursor-pointer shadow-3xs hover:border-rose-300 col-span-2 sm:col-span-1 ${
            statusFilter === 'OVERDUE' ? 'border-rose-600 ring-2 ring-rose-100' : 'border-slate-200/80'
          }`}
        >
          <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">
            Overdue
          </span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">{overdueTasks}</span>
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, project, assignee..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          {/* Project Filter */}
          <div className="w-full md:w-64 shrink-0">
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title.length > 28 ? `${p.title.slice(0, 28)}...` : p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="w-full md:w-44 shrink-0">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'All Tasks' },
              { id: 'TODO', label: 'To Do' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'OVERDUE', label: 'Overdue' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setStatusFilter(btn.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === btn.id
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-400 font-bold">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </span>
        </div>
      </div>

      {/* Task Table / Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs font-medium">
          Loading tasks from database...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-900 text-base">No tasks assigned to you.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            You're all caught up! Create a new task or milestone for your innovation projects to stay organized.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Task</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-3 w-10">Done</th>
                  <th className="py-3.5 px-3">Task Title</th>
                  <th className="py-3.5 px-3">Project</th>
                  <th className="py-3.5 px-3">Assignee</th>
                  <th className="py-3.5 px-3">Priority</th>
                  <th className="py-3.5 px-3">Due Date</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 pr-6 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTasks.map((t) => {
                  const overdue = isOverdue(t);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Checkbox */}
                      <td className="py-4 pl-6 pr-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(t.projectId, t.id, t.status, e)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition cursor-pointer ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300 hover:border-blue-600'
                          }`}
                          title={t.status === 'COMPLETED' ? 'Mark To Do' : 'Mark Completed'}
                        >
                          {t.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      </td>

                      {/* Title & Description */}
                      <td className="py-4 px-3 max-w-xs">
                        <span
                          className={`font-extrabold text-slate-900 block group-hover:text-blue-700 transition ${
                            t.status === 'COMPLETED' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {t.title}
                        </span>
                        {t.description && (
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                            {t.description}
                          </p>
                        )}
                      </td>

                      {/* Project */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 font-bold text-slate-700">
                          <Folder className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[140px]">{t.projectTitle}</span>
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        {t.assignedTo ? (
                          <span className="flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg text-[11px]">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span>{t.assignedTo.fullName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Unassigned</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            t.priority === 'URGENT'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : t.priority === 'LOW'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-blue-50 text-blue-700 border border-blue-150'
                          }`}
                        >
                          {t.priority || 'MEDIUM'}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        {t.dueDate ? (
                          <span
                            className={`flex items-center gap-1 text-[11px] font-bold ${
                              overdue ? 'text-rose-600' : 'text-slate-600'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                            {overdue && (
                              <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-extrabold">
                                Overdue
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No deadline</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateStatus(t.projectId, t.id, e.target.value)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-xl border cursor-pointer focus:outline-none transition ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6 pl-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTask(t.projectId, t.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Task Details
                </span>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedTask.description && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs text-slate-700 leading-relaxed font-medium">
                {selectedTask.description}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Project
                </span>
                <span className="font-extrabold text-slate-900 block truncate">
                  {selectedTask.projectTitle}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assignee
                </span>
                <span className="font-extrabold text-blue-700 block truncate">
                  {selectedTask.assignedTo?.fullName || 'Unassigned'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Priority
                </span>
                <span className="font-extrabold text-slate-900 block">
                  {selectedTask.priority || 'MEDIUM'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Due Date
                </span>
                <span className="font-extrabold text-slate-900 block">
                  {selectedTask.dueDate
                    ? new Date(selectedTask.dueDate).toLocaleDateString()
                    : 'None'}
                </span>
              </div>
            </div>

            {/* Change Status inside Modal */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Status:</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) =>
                    handleUpdateStatus(selectedTask.projectId, selectedTask.id, e.target.value)
                  }
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <button
                onClick={() => navigate(`/dashboard/projects/${selectedTask.projectId}`)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>Open Project</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Create New Milestone Task</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              {/* Project select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Complete Abstract & Claims formulation"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description / Milestone Requirements
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Provide technical scope or checklist items..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Assignee & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Assignee
                  </label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {projectMembersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
