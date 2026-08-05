import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  ShieldCheck,
  UserCheck,
  UserX,
  PlusCircle,
  Search,
  CheckCircle,
  Bell,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export interface ProjectSummary {
  id: string;
  title: string;
  category: string;
  technicalDomain: string;
  stage: string;
  createdAt: string;
  owner: { fullName: string; username: string };
  members: Array<{ user: { fullName: string; username: string }; role: string }>;
  tasks?: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    createdAt: string;
    assignedTo?: { id: string; fullName: string; username: string } | null;
  }>;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; fullName: string; username: string; role: string };
  }>;
  _count?: {
    documents: number;
    tasks: number;
    members: number;
  };
}

export interface AdminUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  institution: string | null;
  isActive: boolean;
  role: string;
  phone: string | null;
  department: string | null;
}

const STAGES = [
  'IDEA',
  'LITERATURE_REVIEW',
  'PROTOTYPE',
  'DOCUMENTATION',
  'FORMS_PREPARATION',
  'GUIDE_REVIEW',
  'PATENT_EXPERT_REVIEW',
  'FILING_READY',
  'FILED',
];

const getStageProgress = (stage: string) => {
  const index = STAGES.indexOf(stage);
  if (index === -1) return 15;
  return Math.round(((index + 1) / STAGES.length) * 100);
};

export const DashboardPage: React.FC = () => {
  const { user } = useOutletContext<{ user: { fullName: string; email: string; username: string; role: string } }>();
  const role = user?.role || 'Inventor';

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Admin states
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Guide creation state
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteProjectTitle, setInviteProjectTitle] = useState('');
  const [inviteDomain, setInviteDomain] = useState('');
  const [inviteCategory, setInviteCategory] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const fetchNotificationsCount = async () => {
    try {
      const [invitesRes, notifiesRes] = await Promise.all([
        api.get('/collaboration/invitations'),
        api.get('/collaboration/notifications'),
      ]);
      const pendingInvites = (invitesRes.data || []).filter((i: any) => i.status === 'PENDING').length;
      const unreadNotifs = (notifiesRes.data || []).filter((n: any) => !n.isRead).length;
      setUnreadNotificationsCount(pendingInvites + unreadNotifs);
    } catch (error) {
      console.error('Failed to fetch notifications count', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchNotificationsCount();
    if (role === 'Admin') {
      fetchUsers();
    }
  }, [role]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get('/users/list');
      setUsersList(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users list', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handlePromoteRole = async (userId: string, newRole: string) => {
    try {
      const response = await api.put(`/users/${userId}/promote`, { roleName: newRole });
      toast.success(response.data.message || 'User promoted successfully!');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Promotion failed.');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const response = await api.put(`/users/${userId}/status`);
      toast.success(response.data.message || 'User status updated successfully!');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleGuideCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteProjectTitle || !inviteUsername || !inviteDomain || !inviteCategory) {
      toast.error('All fields are required.');
      return;
    }

    setSubmittingInvite(true);
    try {
      // 1. Create project
      const projectRes = await api.post('/projects', {
        title: inviteProjectTitle,
        innovationIdea: 'Initiated by Supervisor Faculty Guide for student collaboration.',
        problemStatement: 'Under evaluation.',
        proposedSolution: 'To be drafted.',
        technicalDomain: inviteDomain,
        category: inviteCategory,
      });

      const projectId = projectRes.data.project.id;

      // 2. Invite Student as Co-Inventor or Inventor
      await api.post('/collaboration/invite', {
        projectId,
        username: inviteUsername,
        role: 'CO_INVENTOR',
      });

      toast.success('Project created and Student invited successfully!');
      setInviteProjectTitle('');
      setInviteUsername('');
      setInviteDomain('');
      setInviteCategory('');
      fetchProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate project guidance.');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleCompleteTask = async (projectId: string, taskId: string) => {
    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, { status: 'COMPLETED' });
      toast.success('Task completed!');
      fetchProjects();
    } catch (e) {
      toast.error('Failed to complete task');
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper values for Inventor Dashboard
  const activeProjectsCount = projects.length;
  const pendingTasks = projects.flatMap((p: ProjectSummary) =>
    (p.tasks || []).map((t: any) => ({ ...t, projectId: p.id, projectTitle: p.title }))
  ).filter((t: any) => t.status !== 'COMPLETED');
  const pendingTasksCount = pendingTasks.length;
  
  const totalDocumentsCount = projects.reduce((sum, p) => sum + (p._count?.documents || 0), 0);

  // Stages count for Donut Chart
  const draftingCount = projects.filter(p => ['IDEA', 'LITERATURE_REVIEW', 'PROTOTYPE'].includes(p.stage)).length;
  const reviewCount = projects.filter(p => ['DOCUMENTATION', 'FORMS_PREPARATION', 'GUIDE_REVIEW', 'PATENT_EXPERT_REVIEW'].includes(p.stage)).length;
  const prototypeCount = projects.filter(p => p.stage === 'FILING_READY').length;
  const othersCount = projects.filter(p => p.stage === 'FILED').length;

  // Admin dynamic donut chart stats
  const totalUsers = usersList.length;
  const studentsCount = usersList.filter(u => u.role === 'Inventor').length;
  const guidesCount = usersList.filter(u => u.role === 'Guide').length;
  const expertsCount = usersList.filter(u => u.role === 'PatentExpert').length;
  const adminsCount = usersList.filter(u => u.role === 'Admin').length;

  const studentPct = totalUsers > 0 ? Math.round((studentsCount / totalUsers) * 100) : 0;
  const guidePct = totalUsers > 0 ? Math.round((guidesCount / totalUsers) * 100) : 0;
  const expertPct = totalUsers > 0 ? Math.round((expertsCount / totalUsers) * 100) : 0;
  const adminPct = totalUsers > 0 ? Math.round((adminsCount / totalUsers) * 100) : 0;

  const adminTotalDocuments = projects.reduce((sum, p) => sum + (p._count?.documents || 0), 0);
  const adminStorageUsed = `${(adminTotalDocuments * 1.8).toFixed(1)} MB`;

  // Patent Expert stats
  const expertCompletedCount = projects.filter(p => ['FILING_READY', 'FILED'].includes(p.stage)).length;
  const expertCompletedPct = projects.length > 0 ? Math.round((expertCompletedCount / projects.length) * 100) : 0;
  const expertStrokeDashoffset = 238 - (238 * expertCompletedPct) / 100;

  // --- RENDER 1: ADMIN CONTROL HUB ---
  if (role === 'Admin') {
    return (
      <div className="space-y-8 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, Administrator!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Monitor and manage the entire platform.
            </p>
          </div>
          <span className="px-3.5 py-1.5 bg-blue-50 border border-blue-150 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Root Admin
          </span>
        </div>

        {/* 4 Admin Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalUsers}</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-extrabold">
                +12% this month
              </span>
            </div>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Total Users</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{projects.length}</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-extrabold">
                +18% this month
              </span>
            </div>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Active Projects</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {projects.filter(p => ['GUIDE_REVIEW', 'PATENT_EXPERT_REVIEW'].includes(p.stage)).length}
              </span>
              <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded font-extrabold">
                -5% this month
              </span>
            </div>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Pending Audits</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{adminStorageUsed}</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-extrabold">
                +6% this month
              </span>
            </div>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Storage Used</p>
          </div>
        </div>

        {/* User Distribution & System Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Distribution Donut Chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">User Distribution</h3>
            <div className="flex items-center justify-around gap-4 py-4">
              <div className="relative inline-flex items-center justify-center shrink-0">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="46" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                  {/* Students: studentPct% */}
                  <circle cx="56" cy="56" r="46" stroke="#4f46e5" strokeWidth="10" strokeDasharray="289" strokeDashoffset={289 - (289 * studentPct) / 100} fill="transparent" />
                  {/* Guides: guidePct% */}
                  <circle cx="56" cy="56" r="46" stroke="#f59e0b" strokeWidth="10" strokeDasharray="289" strokeDashoffset={289 - (289 * (studentPct + guidePct)) / 100} fill="transparent" />
                  {/* Experts: expertPct% */}
                  <circle cx="56" cy="56" r="46" stroke="#06b6d4" strokeWidth="10" strokeDasharray="289" strokeDashoffset={289 - (289 * (studentPct + guidePct + expertPct)) / 100} fill="transparent" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-lg font-extrabold text-slate-900">{totalUsers}</span>
                  <span className="text-[8px] text-slate-400 font-bold block uppercase">Users</span>
                </div>
              </div>

              <div className="space-y-2 text-[10px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                  <span>Inventors: {studentPct}% ({studentsCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                  <span>Guides: {guidePct}% ({guidesCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full" />
                  <span>Experts: {expertPct}% ({expertsCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-slate-300 rounded-full" />
                  <span>Admins: {adminPct}% ({adminsCount})</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Overview Activity log */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">System Overview</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {[
                { log: 'New user registered: rahul.verma@gmail.com', time: '1h ago' },
                { log: 'Project "Smart Irrigation System" created', time: '2h ago' },
                { log: 'User role updated: aditya@abc.com to GUIDE', time: '1d ago' },
                { log: 'System database backup completed successfully', time: '1d ago' },
                { log: 'New patent expert joined: ravi.patel@ipo.in', time: '2d ago' },
              ].map((activity, index) => (
                <div key={index} className="flex justify-between items-center text-xs p-3 bg-slate-50 border border-slate-150 rounded-xl">
                  <span className="font-semibold text-slate-700">{activity.log}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Platform Accounts List table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Platform Accounts</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage permissions and activation status</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search username, name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-semibold"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">Fetching accounts...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">No matches found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                    <th className="pb-3">User info</th>
                    <th className="pb-3">Institution & Dept</th>
                    <th className="pb-3">Current Role</th>
                    <th className="pb-3">Promotion</th>
                    <th className="pb-3 text-right">Status Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pr-2">
                        <div className="font-extrabold text-slate-950">{u.fullName}</div>
                        <div className="text-slate-500 font-medium text-[11px]">@{u.username} • {u.email}</div>
                      </td>
                      <td className="py-3.5 pr-2 font-medium text-slate-600">
                        <div>{u.institution || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400">{u.department || 'No Dept'}</div>
                      </td>
                      <td className="py-3.5 pr-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                            u.role === 'Admin'
                              ? 'bg-rose-50 text-rose-700 border-rose-100'
                              : u.role === 'Guide'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : u.role === 'PatentExpert'
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-100'
                              : 'bg-slate-100 text-slate-700 border-transparent'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2">
                        <select
                          value={u.role}
                          onChange={(e) => handlePromoteRole(u.id, e.target.value)}
                          className="h-8 rounded-lg border border-slate-200 text-xs px-2 focus:outline-none focus:border-blue-600 font-semibold bg-white cursor-pointer"
                        >
                          <option value="Inventor">Inventor</option>
                          <option value="Guide">Guide</option>
                          <option value="PatentExpert">Patent Expert</option>
                          <option value="Admin">Administrator</option>
                        </select>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Deactivated</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER 2: GUIDE / MENTOR DASHBOARD ---
  if (role === 'Guide') {
    return (
      <div className="space-y-8 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, Dr. {user?.fullName.split(' ')[0] || 'Neha'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Here's an overview of projects under your guidance.
            </p>
          </div>
          <span className="px-3.5 py-1.5 bg-amber-50 border border-amber-150 text-amber-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" /> Faculty Guide
          </span>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-250 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-extrabold text-slate-900">{projects.length}</span>
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
            </div>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Total Projects</p>
          </div>

          <div className="bg-white border border-slate-250 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {projects.filter(p => p.stage === 'GUIDE_REVIEW').length}
              </span>
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
            </div>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Under Review</p>
          </div>

          <div className="bg-white border border-slate-250 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-extrabold text-slate-900">{pendingTasksCount}</span>
              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
            </div>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Pending Tasks</p>
          </div>

          <div className="bg-white border border-slate-250 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-extrabold text-slate-900">{unreadNotificationsCount}</span>
              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
            </div>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Notifications</p>
          </div>
        </div>

        {/* Guided Projects & Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects under guidance */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Projects Under My Guidance</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Active patent specification lifecycle</p>
              </div>
              <span className="text-xs text-indigo-650 font-bold hover:underline cursor-pointer">View all</span>
            </div>

            {loadingProjects ? (
              <div className="py-16 text-center text-slate-400 text-sm font-medium">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-medium space-y-3">
                <FolderKanban className="w-8 h-8 mx-auto text-slate-300" />
                <p>You are not supervising any patent projects yet. Use the tool on the right to start!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((proj) => {
                  const progress = getStageProgress(proj.stage);
                  return (
                    <div key={proj.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/40 hover:bg-white transition-all flex justify-between items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-xs">{proj.title}</h4>
                        <p className="text-[10px] text-slate-455 font-semibold">By: {proj.owner.fullName}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24">
                          <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                            <span>Readiness</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        <Link
                          to={`/dashboard/projects/${proj.id}`}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-bold text-slate-700"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Supervise Form & Tip */}
          <div className="space-y-6">
            {/* Create guided project */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <PlusCircle className="w-4.5 h-4.5 text-indigo-650" /> Supervise New Project
              </h3>
              <form onSubmit={handleGuideCreateProject} className="space-y-3 pt-2">
                <input
                  type="text"
                  required
                  value={inviteProjectTitle}
                  onChange={(e) => setInviteProjectTitle(e.target.value)}
                  placeholder="Project Title"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
                <input
                  type="text"
                  required
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Student Username (e.g. STU202600001)"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={inviteDomain}
                    onChange={(e) => setInviteDomain(e.target.value)}
                    placeholder="Domain (e.g. IoT)"
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="text"
                    required
                    value={inviteCategory}
                    onChange={(e) => setInviteCategory(e.target.value)}
                    placeholder="Category (e.g. Utility)"
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="w-full h-9.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submittingInvite ? 'Creating...' : 'Create & Invite Student'}
                </button>
              </form>
            </div>

            {/* Tip box */}
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl space-y-2 relative overflow-hidden">
              <h4 className="text-xs font-extrabold text-amber-900 flex items-center gap-1">
                💡 Tip for today
              </h4>
              <p className="text-[11px] leading-relaxed text-amber-950 font-semibold">
                Encourage your team to perform prior art searches early in the process. It saves time and ensures novel patent claims boundaries.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 3: PATENT EXPERT DASHBOARD ---
  if (role === 'PatentExpert') {
    return (
      <div className="space-y-8 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Good to see you, {user?.fullName.split(' ')[0] || 'Ravi'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Review, analyze and help innovations become stronger.
            </p>
          </div>
          <span className="px-3.5 py-1.5 bg-cyan-50 border border-cyan-150 text-cyan-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Patent Expert
          </span>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-250 rounded-3xl p-6 shadow-2xs">
            <span className="text-2xl font-extrabold text-slate-900 block mb-1">{projects.length}</span>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Assigned Reviews</p>
          </div>
          <div className="bg-white border border-slate-250 rounded-3xl p-6 shadow-2xs">
            <span className="text-2xl font-extrabold text-slate-900 block mb-1">
              {projects.filter(p => p.stage === 'PATENT_EXPERT_REVIEW').length}
            </span>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">In Progress</p>
          </div>
          <div className="bg-white border border-slate-250 rounded-3xl p-6 shadow-2xs">
            <span className="text-2xl font-extrabold text-slate-900 block mb-1">{expertCompletedCount}</span>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Completed</p>
          </div>
          <div className="bg-white border border-slate-250 rounded-3xl p-6 shadow-2xs">
            <span className="text-2xl font-extrabold text-slate-900 block mb-1 animate-pulse text-rose-600">{unreadNotificationsCount}</span>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Notifications</p>
          </div>
        </div>

        {/* Expert Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900">Assigned Patent Projects</h2>
              <span className="text-xs text-slate-450 font-bold hover:underline cursor-pointer">View all</span>
            </div>

            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold py-8 text-center">No assigned reviews at the moment.</p>
            ) : (
              <div className="space-y-4">
                {projects.map((proj) => {
                  return (
                    <div key={proj.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-xs text-slate-900">{proj.title}</h4>
                        <p className="text-[10px] text-slate-455 font-bold">By: {proj.owner.fullName}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase tracking-widest">{proj.stage}</span>
                        <Link
                          to={`/dashboard/projects/${proj.id}`}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs"
                        >
                          Audit
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Expert Overview Stats Donut Chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Review Summary</h3>
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="38" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                  <circle cx="48" cy="48" r="38" stroke="#4f46e5" strokeWidth="8" strokeDasharray="238" strokeDashoffset={expertStrokeDashoffset} fill="transparent" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-base font-extrabold text-slate-900">{expertCompletedPct}%</span>
                  <span className="text-[8px] text-slate-400 font-bold block uppercase">Approved</span>
                </div>
              </div>

              <div className="w-full border-t border-slate-100 pt-4 text-center">
                <p className="text-[10px] font-bold text-slate-450 uppercase">Average Novelty Score</p>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{expertCompletedPct}%</p>
                <span className="text-[10px] text-emerald-600 font-bold">▲ 2% from last month</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 4: STUDENT / INVENTOR / DEFAULT DASHBOARD ---
  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Good morning, {user?.fullName.split(' ')[0] || 'Arjun'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Let's turn your ideas into protected innovations.
          </p>
        </div>
        <Link
          to="/dashboard/create-project"
          className="px-5 py-2.5 rounded-xl font-bold bg-indigo-650 hover:bg-indigo-755 text-white transition-all shadow-md flex items-center gap-2 text-xs hover:-translate-y-0.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">{activeProjectsCount}</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Active Projects</p>
          </div>
          <FolderKanban className="w-8 h-8 text-blue-300" />
        </div>

        <div className="bg-white border border-amber-250 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">{pendingTasksCount}</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Pending Tasks</p>
          </div>
          <CheckCircle className="w-8 h-8 text-amber-300 animate-pulse" />
        </div>

        <div className="bg-white border border-emerald-250 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">{totalDocumentsCount}</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Documents</p>
          </div>
          <FileText className="w-8 h-8 text-emerald-300" />
        </div>

        <div className="bg-white border border-rose-250 rounded-3xl p-6 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono">{unreadNotificationsCount}</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Notifications</p>
          </div>
          <Bell className="w-8 h-8 text-rose-350" />
        </div>
      </div>

      {/* My Active Projects card deck grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">My Active Projects</h3>
          <Link to="/dashboard/projects" className="text-xs font-bold text-indigo-650 hover:underline">View all</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.slice(0, 3).map((project) => {
            const progress = getStageProgress(project.stage);
            return (
              <div
                key={project.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-48 hover:-translate-y-0.5 group"
              >
                <div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider inline-block">
                    {project.category}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-xs mt-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    <Link to={`/dashboard/projects/${project.id}`}>{project.title}</Link>
                  </h4>
                  <span className="text-[9px] font-mono text-slate-400 block mt-1 uppercase">ID: {project.id.substring(0, 8).toUpperCase()}</span>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500">
                    <span>Readiness</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-[8px] text-slate-400 font-semibold pt-1">
                    <span>Updated 2d ago</span>
                    <span>{project.members.length + 1} members</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* A plus button new project card at the end of list */}
          <Link
            to="/dashboard/create-project"
            className="bg-slate-50 hover:bg-indigo-50/20 border-2 border-dashed border-slate-250 hover:border-indigo-500 rounded-3xl p-5 flex flex-col items-center justify-center h-48 text-center transition-all cursor-pointer group shadow-3xs"
          >
            <Plus className="w-7 h-7 text-slate-400 group-hover:text-indigo-600 group-hover:scale-105 transition-all mb-2" />
            <span className="text-xs font-extrabold text-slate-700 group-hover:text-indigo-950">Create New Project</span>
          </Link>
        </div>
      </div>

      {/* Upcoming Tasks & Project Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Upcoming tasks list */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-150 pb-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Upcoming Tasks</h3>
            <Link to="/dashboard/tasks" className="text-xs font-bold text-indigo-650 hover:underline">View all</Link>
          </div>

          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">No upcoming tasks assigned.</div>
            ) : (
              pendingTasks.slice(0, 3).map((t, index) => (
                <div
                  key={t.id}
                  className="p-4 border border-slate-150 bg-slate-50 hover:bg-white rounded-2xl flex items-center justify-between gap-4 shadow-3xs hover:shadow-2xs transition-all cursor-pointer"
                  onClick={() => handleCompleteTask(t.projectId, t.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 border-2 border-slate-350 rounded-md bg-white flex items-center justify-center shrink-0" />
                    <div>
                      <p className="font-bold text-xs text-slate-800">{t.title}</p>
                      <p className="text-[10px] text-slate-450 font-bold">Project: {t.projectTitle}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 font-mono">Due in {3 + index} days</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Project Progress Overview Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-150 pb-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Project Progress Overview</h3>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle cx="56" cy="56" r="46" stroke="#4f46e5" strokeWidth="8" strokeDasharray="289" strokeDashoffset="72" fill="transparent" />
              </svg>
              <div className="absolute text-center">
                <span className="text-lg font-extrabold text-slate-900">{activeProjectsCount}</span>
                <span className="text-[8px] text-slate-450 font-bold block uppercase">Total</span>
              </div>
            </div>

            <div className="w-full text-[10px] font-bold text-slate-500 space-y-1.5 border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" /> Drafting</span>
                <span className="font-mono text-slate-900">{draftingCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" /> Review</span>
                <span className="font-mono text-slate-900">{reviewCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Prototype</span>
                <span className="font-mono text-slate-900">{prototypeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-300 rounded-full" /> Others</span>
                <span className="font-mono text-slate-900">{othersCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
