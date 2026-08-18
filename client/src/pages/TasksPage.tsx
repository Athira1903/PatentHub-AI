import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Check,
  UserCheck,
  Users,
  CheckSquare,
  Search,
  Folder,
  Loader2,
  Calendar,
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
  status: string;
  priority?: string;
  dueDate?: string | null;
  createdAt: string;
  projectId: string;
  projectTitle: string;
  createdBy?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; fullName: string; username: string } | null;
}

export const TasksPage: React.FC = () => {
  const outletContext = useOutletContext<{ user?: any }>() || {};
  const [currentUser, setCurrentUser] = useState<any>(outletContext.user || null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ASSIGNED_TO_ME' | 'ASSIGNED_BY_ME' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');

  // Task creation states
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [customUsername, setCustomUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (outletContext.user && !currentUser) {
      setCurrentUser(outletContext.user);
    }
  }, [outletContext.user, currentUser]);

  useEffect(() => {
    fetchData(true);
  }, []);

  const fetchData = async (showLoadingState = false) => {
    if (showLoadingState) setLoading(true);
    try {
      // 1. Fetch user profile if not already present
      if (!currentUser && !outletContext.user) {
        try {
          const userRes = await api.get('/auth/profile');
          if (userRes.data?.user) {
            setCurrentUser(userRes.data.user);
          }
        } catch (err) {
          console.warn('Failed to load user profile in TasksPage', err);
        }
      }

      // 2. Fetch projects and their tasks
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
    } catch (e: any) {
      console.error('Failed to load tasks', e);
      toast.error(e.response?.data?.message || 'Failed to fetch tasks list');
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  const handleToggleStatus = async (projectId: string, taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    // Optimistic update without flickering
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

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
    // Optimistic update without flickering
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, { status: newStatus });
      toast.success(`Task status updated to ${newStatus.replace('_', ' ')}!`);
      fetchData(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update task status');
      fetchData(false);
    }
  };

  const handleDeleteTask = async (projectId: string, taskId: string) => {
    if (!window.confirm('Delete this task permanently?')) return;
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
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

      if (taskAssigneeId === '__custom') {
        if (customUsername.trim()) {
          payload.assignedToUsername = customUsername.trim();
        }
      } else if (taskAssigneeId) {
        payload.assignedToId = taskAssigneeId;
      }

      await api.post(`/projects/${selectedProjectId}/tasks`, payload);

      toast.success('Task created and assigned successfully!');
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssigneeId('');
      setCustomUsername('');
      setTaskDueDate('');
      setTaskPriority('MEDIUM');
      fetchData(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  // Build list of assignable team members for selected project
  const projectMembersList: Array<{ id: string; name: string; role: string; username: string }> = [];
  if (currentProject) {
    if (currentProject.owner) {
      projectMembersList.push({
        id: currentProject.owner.id,
        name: currentProject.owner.fullName,
        role: 'Lead Inventor',
        username: currentProject.owner.username,
      });
    }
    if (currentProject.members) {
      currentProject.members.forEach((m) => {
        if (m.user && m.user.id !== currentProject.owner?.id) {
          projectMembersList.push({
            id: m.user.id,
            name: m.user.fullName,
            role: m.user.role || 'Collaborator',
            username: m.user.username,
          });
        }
      });
    }
  }

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Project filter
    if (selectedProjectFilter !== 'ALL' && t.projectId !== selectedProjectFilter) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchProject = t.projectTitle.toLowerCase().includes(q);
      const matchAssignee = t.assignedTo?.fullName?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchProject && !matchAssignee) {
        return false;
      }
    }

    const currentUserId = currentUser?.id || currentUser?.userId;
    const isAssignedToMe = currentUserId && t.assignedToId === currentUserId;
    const isCreatedByMe = currentUserId && t.createdBy === currentUserId;

    if (filter === 'ASSIGNED_TO_ME') return isAssignedToMe;
    if (filter === 'ASSIGNED_BY_ME') return isCreatedByMe;
    if (filter === 'PENDING') return t.status === 'TODO';
    if (filter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED').length;

  return (
    <div className="space-y-7 max-w-7xl mx-auto font-sans pb-12">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-900 text-white rounded-2xl shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Tasks & Checklist Workspace
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage statutory milestones, claims drafting sub-tasks, and patent collaboration checklists across all projects.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200/80 rounded-2xl shadow-3xs flex items-center gap-2.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Total</span>
            <span className="text-sm font-black text-slate-900">{totalTasks}</span>
          </div>
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200/80 rounded-2xl shadow-3xs flex items-center gap-2.5">
            <span className="text-[10px] font-extrabold uppercase text-emerald-600">Completed</span>
            <span className="text-sm font-black text-emerald-700">{completedTasks}</span>
          </div>
          <div className="px-4 py-2 bg-amber-50 border border-amber-200/80 rounded-2xl shadow-3xs flex items-center gap-2.5">
            <span className="text-[10px] font-extrabold uppercase text-amber-600">Pending</span>
            <span className="text-sm font-black text-amber-700">{pendingTasks}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Tasks List Column (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="app-card p-6 border border-slate-200/80 bg-white rounded-3xl shadow-xs space-y-5">
            {/* Filters and Search Bar */}
            <div className="space-y-4 border-b border-slate-150 pb-5">
              {/* Search & Project Filter Row */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks by title, description, or assignee..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>

                <div className="w-full sm:w-56 shrink-0">
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
              </div>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'ALL', label: 'All Tasks' },
                    { id: 'ASSIGNED_TO_ME', label: 'Assigned to Me' },
                    { id: 'ASSIGNED_BY_ME', label: 'Assigned by Me' },
                    { id: 'PENDING', label: 'To Do' },
                    { id: 'IN_PROGRESS', label: 'In Progress' },
                    { id: 'COMPLETED', label: 'Completed' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setFilter(btn.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        filter === btn.id
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-slate-400 font-bold">
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
                </span>
              </div>
            </div>

            {/* Task Table */}
            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-slate-50/70 rounded-2xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-slate-200 rounded-lg"></div>
                      <div className="space-y-1.5">
                        <div className="w-48 h-3.5 bg-slate-200 rounded-md"></div>
                        <div className="w-24 h-2.5 bg-slate-200 rounded-md"></div>
                      </div>
                    </div>
                    <div className="w-20 h-6 bg-slate-200 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="font-bold text-slate-700">No tasks found matching this criteria.</p>
                <p className="text-[11px] text-slate-400">Create a new milestone on the right to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTasks.map((t) => {
                  const currentUserId = currentUser?.id || currentUser?.userId;
                  const isAssignedToMe = currentUserId && t.assignedToId === currentUserId;
                  const isCreatedByMe = currentUserId && t.createdBy === currentUserId;

                  return (
                    <div
                      key={t.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-2xl transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t.projectId, t.id, t.status)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition cursor-pointer ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300 hover:border-blue-600'
                          }`}
                          title={t.status === 'COMPLETED' ? 'Mark To-Do' : 'Mark Completed'}
                        >
                          {t.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs font-extrabold text-slate-900 ${
                                t.status === 'COMPLETED' ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {t.title}
                            </span>

                            {t.priority && (
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                  t.priority === 'URGENT'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : t.priority === 'HIGH'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : t.priority === 'LOW'
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-blue-50 text-blue-700 border border-blue-150'
                                }`}
                              >
                                {t.priority}
                              </span>
                            )}
                          </div>

                          {t.description && (
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                              {t.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-semibold pt-0.5">
                            <span className="flex items-center gap-1 text-slate-600 font-bold">
                              <Folder className="w-3 h-3 text-slate-400" />
                              {t.projectTitle}
                            </span>

                            {t.assignedTo ? (
                              <span className="flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                                <Users className="w-3 h-3 text-blue-600" />
                                {t.assignedTo.fullName || `@${t.assignedTo.username}`}
                              </span>
                            ) : isAssignedToMe ? (
                              <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                                <UserCheck className="w-3 h-3 text-emerald-600" /> Assigned to You
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}

                            {isCreatedByMe && (
                              <span className="text-slate-400">Created by You</span>
                            )}

                            {t.dueDate && (
                              <span className="flex items-center gap-1 text-slate-500">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Due: {new Date(t.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Selector & Delete */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateStatus(t.projectId, t.id, e.target.value)}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none transition ${
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

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.projectId, t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Task Creation Sidebar Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="app-card p-6 border border-slate-200/80 bg-white rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-900 rounded-xl">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Add New Milestone</h3>
            </div>
            <p className="text-slate-500 text-xs font-medium">
              Assign a new checklist item, claim formulation task, or statutory draft milestone:
            </p>

            {projects.length === 0 && !loading ? (
              <div className="p-4 bg-amber-50 border border-amber-200/70 rounded-2xl text-xs text-amber-800 font-medium">
                You must create or be part of a patent project before assigning tasks.
              </div>
            ) : (
              <form onSubmit={handleCreateTask} className="space-y-4 pt-1">
                {/* Target Project */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Target Project
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setTaskAssigneeId('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Task Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Task / Milestone Title
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Formulate independent claim 1 technical limitations"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Description / Sub-Points
                  </label>
                  <textarea
                    rows={3}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Provide details, deliverables, or reference prior art..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed"
                  />
                </div>

                {/* Priority & Due Date Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    />
                  </div>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Assign Task To
                  </label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {projectMembersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role}) - @{m.username}
                      </option>
                    ))}
                    <option value="__custom">Other (Enter Username)</option>
                  </select>
                </div>

                {taskAssigneeId === '__custom' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Collaborator Username / Email
                    </label>
                    <input
                      type="text"
                      required
                      value={customUsername}
                      onChange={(e) => setCustomUsername(e.target.value)}
                      placeholder="Enter username or email address"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/15 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Milestone...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create & Assign Task</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
