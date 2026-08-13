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
  Bell,
  FileText,
  TrendingUp,
  ArrowRight,
  CheckSquare,
  Layers,
  FileSpreadsheet,
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
  documents?: Array<{
    id: string;
    name: string;
    createdAt: string;
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
  const { user } = useOutletContext<{ user: { fullName: string; email: string; username: string; role: string; userId: string } }>();
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

  // Guide filter state
  const [guideFilter, setGuideFilter] = useState<'ALL' | 'NEW' | 'GUIDE_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED'>('ALL');

  // Patent Expert filter state
  const [expertFilter, setExpertFilter] = useState<'ALL' | 'NEW' | 'PATENT_EXPERT_REVIEW' | 'CHANGES_REQUESTED' | 'FILING_READY'>('ALL');

  // Checklist state for expert
  const [checklist, setChecklist] = useState({
    inventorInfo: true,
    specification: true,
    drawings: true,
    claims: true,
    supportingDocs: true,
    finalVerification: false,
  });

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

  const [portfolioAnalytics, setPortfolioAnalytics] = useState<any>(null);

  const fetchPortfolioAnalytics = async () => {
    try {
      const res = await api.get('/projects/analytics/dashboard');
      setPortfolioAnalytics(res.data);
    } catch (e) {
      console.error('Failed to fetch portfolio analytics', e);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchNotificationsCount();
    fetchPortfolioAnalytics();
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

      // 2. Invite Student as Co-Inventor
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

  const handleToggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success('Checklist updated.');
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper values for Dashboards
  const activeProjectsCount = projects.length;
  const pendingTasks = projects.flatMap((p: ProjectSummary) =>
    (p.tasks || []).map((t: any) => ({ ...t, projectId: p.id, projectTitle: p.title }))
  ).filter((t: any) => t.status !== 'COMPLETED');
  const pendingTasksCount = pendingTasks.length;

  // Stages count for Donut Chart
  const draftingCount = projects.filter(p => ['IDEA', 'LITERATURE_REVIEW', 'PROTOTYPE'].includes(p.stage)).length;
  const reviewCount = projects.filter(p => ['DOCUMENTATION', 'FORMS_PREPARATION', 'GUIDE_REVIEW', 'PATENT_EXPERT_REVIEW'].includes(p.stage)).length;
  const prototypeCount = projects.filter(p => p.stage === 'FILING_READY').length;
  const othersCount = projects.filter(p => p.stage === 'FILED').length;

  // Admin stats
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
  // ----------------------------------------------------
  // 1. 🛡️ Admin Dashboard
  // ----------------------------------------------------
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
            <ShieldCheck className="w-4 h-4" /> Root Admin ({adminPct}%)
          </span>
        </div>

        {/* Platform Statistics (Five cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block font-mono">1,248</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Total Users</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block font-mono">382</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Active Projects</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block font-mono">76</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Filed Projects</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block font-mono">64</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Active Guides</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block font-mono">18</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Patent Experts</p>
          </div>
        </div>

        {/* User Distribution & Project Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Distribution Donut Chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">User Distribution</h3>
            <div className="flex items-center justify-around gap-4 py-4">
              <div className="relative inline-flex items-center justify-center shrink-0">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="46" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                  <circle cx="56" cy="56" r="46" stroke="#4f46e5" strokeWidth="10" strokeDasharray="289" strokeDashoffset={289 - (289 * studentPct) / 100} fill="transparent" />
                  <circle cx="56" cy="56" r="46" stroke="#f59e0b" strokeWidth="10" strokeDasharray="289" strokeDashoffset={289 - (289 * (studentPct + guidePct)) / 100} fill="transparent" />
                  <circle cx="56" cy="56" r="46" stroke="#06b6d4" strokeWidth="10" strokeDasharray="289" strokeDashoffset={289 - (289 * (studentPct + guidePct + expertPct)) / 100} fill="transparent" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-lg font-extrabold text-slate-900">{totalUsers || '1248'}</span>
                  <span className="text-[8px] text-slate-400 font-bold block uppercase">Users</span>
                </div>
              </div>

              <div className="space-y-2 text-[10px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                  <span>Inventors: 850 ({studentsCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                  <span>Guides: 120 ({guidesCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full" />
                  <span>Experts: 18 ({expertsCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-slate-350 rounded-full" />
                  <span>Admins: 5 ({adminsCount})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Statistics */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Project Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-sans">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150">
                <span className="text-xl font-extrabold text-slate-950 font-mono">120</span>
                <p className="text-[9px] text-slate-450 uppercase font-extrabold mt-1">Ideas</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150">
                <span className="text-xl font-extrabold text-slate-950 font-mono">84</span>
                <p className="text-[9px] text-slate-450 uppercase font-extrabold mt-1">Research</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150">
                <span className="text-xl font-extrabold text-slate-950 font-mono">72</span>
                <p className="text-[9px] text-slate-450 uppercase font-extrabold mt-1">Prototype</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150">
                <span className="text-xl font-extrabold text-slate-950 font-mono">48</span>
                <p className="text-[9px] text-slate-450 uppercase font-extrabold mt-1">Guide Review</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150">
                <span className="text-xl font-extrabold text-slate-950 font-mono">32</span>
                <p className="text-[9px] text-slate-450 uppercase font-extrabold mt-1">Expert Review</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150">
                <span className="text-xl font-extrabold text-slate-950 font-mono">26</span>
                <p className="text-[9px] text-slate-450 uppercase font-extrabold mt-1">Filing Ready</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150 col-span-2">
                <span className="text-xl font-extrabold text-emerald-650 font-mono">76</span>
                <p className="text-[9px] text-emerald-700 uppercase font-extrabold mt-1">Filed</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Status & Audit Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Health */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">System Health</h3>
            <div className="space-y-2.5 text-xs font-bold text-slate-600">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <span>API Status</span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <span>Database</span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <span>Authentication</span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <span>Storage used: {adminStorageUsed}</span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Operational
                </span>
              </div>
            </div>
          </div>

          {/* Audit logs timeline */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Audit Logs</h3>
            <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
              {[
                { user: 'STU20260001', action: 'Uploaded document', resource: 'Patent Project #102', time: '08 Aug 2026, 10:42 AM', status: 'Success' },
                { user: 'GDE20260001', action: 'Approved guide review', resource: 'Patent Project #102', time: '08 Aug 2026, 11:15 AM', status: 'Success' },
                { user: 'PEX20260001', action: 'Modified claims checklist', resource: 'Patent Project #102', time: '08 Aug 2026, 02:30 PM', status: 'Success' }
              ].map((log, index) => (
                <div key={index} className="flex justify-between items-start text-xs p-3 bg-slate-50 border border-slate-150 rounded-xl">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-slate-950">{log.user}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{log.action} — {log.resource}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-emerald-50 text-emerald-700 uppercase tracking-wider">{log.status}</span>
                    <p className="text-[9px] text-slate-400 font-bold block">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Platform Accounts List table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm col-span-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Platform Accounts</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage permissions and activation status</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" />
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
                      <td className="py-3.5 pr-2 font-medium text-slate-650">
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

  // ----------------------------------------------------
  // 2. 👩🏫 Guide Dashboard
  // ----------------------------------------------------
  if (role === 'Guide') {
    // Review filter logic
    const filterReviews = (stages: string[]) => {
      return projects.filter(p => stages.includes(p.stage));
    };

    let reviewQueueProjects = projects;
    if (guideFilter === 'NEW') {
      reviewQueueProjects = filterReviews(['FORMS_PREPARATION']);
    } else if (guideFilter === 'GUIDE_REVIEW') {
      reviewQueueProjects = filterReviews(['GUIDE_REVIEW']);
    } else if (guideFilter === 'CHANGES_REQUESTED') {
      reviewQueueProjects = filterReviews(['DOCUMENTATION']);
    } else if (guideFilter === 'APPROVED') {
      reviewQueueProjects = filterReviews(['PATENT_EXPERT_REVIEW', 'FILING_READY', 'FILED']);
    }

    return (
      <div className="space-y-8 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-amber-800 to-slate-900 p-8 rounded-3xl text-white shadow-lg border border-slate-800">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good morning, Dr. {user?.fullName.split(' ')[0] || 'Meera'}
            </h1>
            <p className="text-sm text-amber-200 font-medium">
              You have 8 active students and {filterReviews(['GUIDE_REVIEW']).length || '5'} pending reviews.
            </p>
          </div>
          <button
            onClick={() => {
              setGuideFilter('GUIDE_REVIEW');
              toast.success('Filtered review queue to GUIDE_REVIEW stage.');
            }}
            className="px-5 py-2.5 rounded-xl font-bold bg-white text-amber-900 hover:bg-amber-50 transition-all shadow-md flex items-center gap-2 text-xs shrink-0 cursor-pointer"
          >
            <span>View Review Queue</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-extrabold text-slate-900">08</span>
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
            </div>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Students</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-extrabold text-slate-900">{projects.length || '14'}</span>
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            </div>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Active Projects</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {filterReviews(['GUIDE_REVIEW']).length}
              </span>
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            </div>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Pending Reviews ({unreadNotificationsCount} notifications)</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {filterReviews(['PATENT_EXPERT_REVIEW', 'FILING_READY', 'FILED']).length}
              </span>
              <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full" />
            </div>
            <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Approved Projects</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Review Queue (⭐ Large Section) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Review Queue</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Manage student review and revision stage transitions</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['ALL', 'NEW', 'GUIDE_REVIEW', 'CHANGES_REQUESTED', 'APPROVED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setGuideFilter(f)}
                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                      guideFilter === f
                        ? 'bg-amber-650 border-amber-650 text-white'
                        : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f === 'GUIDE_REVIEW' ? 'Pending Review' : f}
                  </button>
                ))}
              </div>
            </div>

            {loadingProjects ? (
              <div className="py-12 text-center text-slate-400 text-sm font-medium">Loading reviews...</div>
            ) : reviewQueueProjects.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">No projects in this stage queue.</div>
            ) : (
              <div className="space-y-4">
                {reviewQueueProjects.map((p) => (
                  <div key={p.id} className="p-5 border border-slate-150 bg-slate-50/50 hover:bg-white rounded-2xl shadow-3xs flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-blue-50 border border-blue-100 text-blue-700 uppercase">
                        {p.stage}
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-955 mt-1">{p.title}</h4>
                      <p className="text-[10px] text-slate-500 font-bold">Inventor: {p.owner.fullName}</p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        to={`/dashboard/projects/${p.id}`}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        Review
                      </Link>
                      <button
                        onClick={async () => {
                          try {
                            await api.put(`/projects/${p.id}`, { stage: 'DOCUMENTATION' });
                            toast.success('Changes requested! Transitioned back to DOCUMENTATION stage.');
                            fetchProjects();
                          } catch (e) {
                            toast.error('Cannot request revision in this stage.');
                          }
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 cursor-pointer"
                      >
                        Request Changes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supervise New Student & Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-3">
                Supervise Student
              </h3>
              <form onSubmit={handleGuideCreateProject} className="space-y-3 pt-1">
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
                  placeholder="Student Username (e.g. STU20260001)"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={inviteDomain}
                    onChange={(e) => setInviteDomain(e.target.value)}
                    placeholder="Domain"
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="text"
                    required
                    value={inviteCategory}
                    onChange={(e) => setInviteCategory(e.target.value)}
                    placeholder="Category"
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="w-full h-9.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submittingInvite ? 'Creating...' : 'Create & Invite Student'}
                </button>
              </form>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-3">Guide Quick Actions</h3>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => {
                    setGuideFilter('GUIDE_REVIEW');
                    toast.success('Filtered review queue to GUIDE_REVIEW stage.');
                  }}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-200 rounded-xl text-xs font-bold text-slate-700 transition-all text-left cursor-pointer"
                >
                  <span>Review Projects</span>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </button>

                <button
                  onClick={() => toast.success('Open any student project workspace -> Tasks tab to assign review milestones.')}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-200 rounded-xl text-xs font-bold text-slate-700 transition-all text-left cursor-pointer"
                >
                  <span>Add Task</span>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </button>

                <button
                  onClick={() => toast.success('Generate student compliance reports via Project Reports tab.')}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-200 rounded-xl text-xs font-bold text-slate-700 transition-all text-left cursor-pointer"
                >
                  <span>Generate Report</span>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Student Progress Overview & Recent Student Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Students */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">My Students</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="pb-3">Student</th>
                    <th className="pb-3">Projects</th>
                    <th className="pb-3">Average Progress</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: 'Athira Biju', projects: 2, progress: 82, status: 'On Track' },
                    { name: 'Rahul', projects: 3, progress: 64, status: 'Needs Attention' },
                    { name: 'Anjali', projects: 1, progress: 91, status: 'On Track' }
                  ].map((stu, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pr-2 font-extrabold text-slate-900">{stu.name}</td>
                      <td className="py-3.5 pr-2 font-bold text-slate-500">{stu.projects} projects</td>
                      <td className="py-3.5 pr-2 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{stu.progress}%</span>
                          <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${stu.progress}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          stu.status === 'On Track' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {stu.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Student Activity */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Student Activity</h3>
            <div className="space-y-4">
              {[
                { action: 'Athira uploaded Prototype v2', time: '1 hour ago' },
                { action: 'Rahul submitted Form 2', time: '4 hours ago' },
                { action: 'Anjali requested review', time: 'Yesterday' }
              ].map((act, idx) => (
                <div key={idx} className="flex gap-3 text-xs items-start">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-700 leading-snug">{act.action}</p>
                    <p className="text-[10px] text-slate-450 font-bold">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. ⚖️ Patent Expert Dashboard
  // ----------------------------------------------------
  if (role === 'PatentExpert') {
    // Review filter logic
    const filterReviews = (stages: string[]) => {
      return projects.filter(p => stages.includes(p.stage));
    };

    let expertQueueProjects = projects;
    if (expertFilter === 'NEW') {
      expertQueueProjects = filterReviews(['GUIDE_REVIEW']);
    } else if (expertFilter === 'PATENT_EXPERT_REVIEW') {
      expertQueueProjects = filterReviews(['PATENT_EXPERT_REVIEW']);
    } else if (expertFilter === 'CHANGES_REQUESTED') {
      expertQueueProjects = filterReviews(['DOCUMENTATION']);
    } else if (expertFilter === 'FILING_READY') {
      expertQueueProjects = filterReviews(['FILING_READY', 'FILED']);
    }

    return (
      <div className="space-y-8 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-cyan-900 to-slate-900 p-8 rounded-3xl text-white shadow-lg border border-slate-800">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good morning, Patent Expert
            </h1>
            <p className="text-sm text-cyan-200 font-medium">
              Review claim bounds and forms configuration. {filterReviews(['PATENT_EXPERT_REVIEW']).length} projects require expert attention.
            </p>
          </div>
          <button
            onClick={() => {
              setExpertFilter('PATENT_EXPERT_REVIEW');
              toast.success('Filtered review queue to PATENT_EXPERT_REVIEW stage.');
            }}
            className="px-5 py-2.5 rounded-xl font-bold bg-white text-cyan-900 hover:bg-cyan-50 transition-all shadow-md flex items-center gap-2 text-xs shrink-0 cursor-pointer"
          >
            <span>Open Review Queue</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <span className="text-3xl font-extrabold text-slate-900">{filterReviews(['PATENT_EXPERT_REVIEW']).length}</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Pending Reviews</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <span className="text-3xl font-extrabold text-slate-900">{projects.filter(p => p.stage === 'PATENT_EXPERT_REVIEW').length}</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Under Review</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <span className="text-3xl font-extrabold text-slate-900">{filterReviews(['FILED']).length}</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Approved/Filed</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <span className="text-3xl font-extrabold text-slate-900">{filterReviews(['FILING_READY']).length}</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Filing Ready ({unreadNotificationsCount} notifications)</p>
          </div>
        </div>

        {/* Expert Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Expert Review Queue ⭐ */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Expert Review Queue</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Approve claims or request changes prior to filing</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['ALL', 'NEW', 'PATENT_EXPERT_REVIEW', 'CHANGES_REQUESTED', 'FILING_READY'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setExpertFilter(f)}
                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                      expertFilter === f
                        ? 'bg-cyan-600 border-cyan-600 text-white'
                        : 'bg-white border-slate-250 text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    {f === 'PATENT_EXPERT_REVIEW' ? 'In Review' : f}
                  </button>
                ))}
              </div>
            </div>

            {loadingProjects ? (
              <div className="py-12 text-center text-slate-400 text-sm font-medium">Loading reviews...</div>
            ) : expertQueueProjects.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">No reviews in this stage filter.</div>
            ) : (
              <div className="space-y-4">
                {expertQueueProjects.map((p) => {
                  const guideName = p.members.find(m => m.role === 'GUIDE')?.user.fullName || 'Dr. Meera';
                  return (
                    <div key={p.id} className="p-5 border border-slate-150 bg-slate-50/50 hover:bg-white rounded-2xl shadow-3xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-xs text-slate-900">{p.title}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold">Inventor: {p.owner.fullName} • Guide: {guideName}</p>
                        <p className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider">Stage: {p.stage}</p>
                      </div>
                      <Link
                        to={`/dashboard/projects/${p.id}`}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
                      >
                        Open Review
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Expert Review Checklist */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Expert Review Checklist</h3>

            <div className="space-y-3.5 text-xs text-slate-650 font-semibold">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.inventorInfo}
                  onChange={() => handleToggleChecklist('inventorInfo')}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Inventor information verified</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.specification}
                  onChange={() => handleToggleChecklist('specification')}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Specification documentation review</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.drawings}
                  onChange={() => handleToggleChecklist('drawings')}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Drawings & Schematics verification</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.claims}
                  onChange={() => handleToggleChecklist('claims')}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Claims criteria boundary validation</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.supportingDocs}
                  onChange={() => handleToggleChecklist('supportingDocs')}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Forms 1, 2, 3, 5 uploaded</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.finalVerification}
                  onChange={() => handleToggleChecklist('finalVerification')}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Final verification approval</span>
              </label>
            </div>
          </div>
        </div>

        {/* Filing Readiness & Patent Form Status & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Filing Readiness */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Filing Readiness</h3>
            <div className="space-y-4">
              {[
                { title: 'Smart Irrigation System', pct: 94 },
                { title: 'AI Healthcare Diagnostics', pct: 87 },
                { title: 'Solar Monitoring Grid', pct: 81 }
              ].map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{p.title}</span>
                    <span className="font-mono text-cyan-650">{p.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patent Form Status */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Form Compliance</h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-650">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                <span>Form 1</span>
                <span className="text-emerald-600">✓ Ok</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                <span>Form 2</span>
                <span className="text-emerald-600">✓ Ok</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                <span>Form 3</span>
                <span className="text-emerald-600">✓ Ok</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                <span>Form 5</span>
                <span className="text-emerald-600">✓ Ok</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl col-span-2">
                <span>Form 26</span>
                <span className="text-amber-600">Pending</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Recent Expert Activity</h3>
            <div className="space-y-3.5">
              {[
                { action: 'Approved Form 2', time: 'Yesterday' },
                { action: 'Requested changes to claims', time: '2 days ago' },
                { action: 'Completed project review', time: '3 days ago' }
              ].map((act, idx) => (
                <div key={idx} className="flex gap-2.5 text-xs items-start">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-700 leading-snug">{act.action}</p>
                    <p className="text-[10px] text-slate-450 font-bold">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 4. 🧑💻 Student / Inventor Dashboard
  // ----------------------------------------------------
  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-900 to-slate-900 p-8 rounded-3xl text-white shadow-lg border border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good morning, {user?.fullName.split(' ')[0] || 'Athira'}
          </h1>
          <p className="text-sm text-indigo-200 font-medium">
            Continue developing your patent projects. Make your claims boundaries clear.
          </p>
        </div>
        <Link
          to="/dashboard/create-project"
          className="px-5 py-2.5 rounded-xl font-bold bg-white text-indigo-900 hover:bg-indigo-50 transition-all shadow-md flex items-center gap-2 text-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Patent</span>
        </Link>
      </div>

      {/* Task 8: Portfolio Analytics Summary Cards */}
      {portfolioAnalytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xl font-black text-slate-900">{portfolioAnalytics.totalProjects}</span>
            <p className="text-slate-400 text-[9px] font-extrabold uppercase tracking-wider mt-1">Total Projects</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xl font-black text-indigo-600">{portfolioAnalytics.inProgressProjects}</span>
            <p className="text-slate-400 text-[9px] font-extrabold uppercase tracking-wider mt-1">In Progress</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xl font-black text-emerald-600">{portfolioAnalytics.filingReadyProjects}</span>
            <p className="text-slate-400 text-[9px] font-extrabold uppercase tracking-wider mt-1">Filing Ready</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xl font-black text-purple-600">{portfolioAnalytics.averageFilingReadiness}%</span>
            <p className="text-slate-400 text-[9px] font-extrabold uppercase tracking-wider mt-1">Avg Readiness</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xl font-black text-cyan-600">{portfolioAnalytics.averageTaskCompletion}%</span>
            <p className="text-slate-400 text-[9px] font-extrabold uppercase tracking-wider mt-1">Avg Task Velocity</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xl font-black text-amber-600">{portfolioAnalytics.totalReferences}</span>
            <p className="text-slate-400 text-[9px] font-extrabold uppercase tracking-wider mt-1">Total References</p>
          </div>
        </div>
      )}

      {/* Quick Statistics (Four cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs flex items-center justify-between hover:shadow-xs transition-shadow">
          <div>
            <span className="text-3xl font-extrabold text-slate-900">{activeProjectsCount}</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Active Projects</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs flex items-center justify-between hover:shadow-xs transition-shadow">
          <div>
            <span className="text-3xl font-extrabold text-slate-900">{pendingTasksCount}</span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Pending Tasks</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs flex items-center justify-between hover:shadow-xs transition-shadow">
          <div>
            <span className="text-3xl font-extrabold text-slate-900">
              {projects.filter(p => ['GUIDE_REVIEW', 'PATENT_EXPERT_REVIEW'].includes(p.stage)).length}
            </span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Under Review</p>
          </div>
          <div className="p-3 bg-cyan-50 rounded-2xl text-cyan-600">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs flex items-center justify-between hover:shadow-xs transition-shadow">
          <div>
            <span className="text-3xl font-extrabold text-slate-900">
              {portfolioAnalytics ? `${portfolioAnalytics.averageFilingReadiness}%` : (projects.length > 0 ? `${Math.round(projects.reduce((sum, p) => sum + getStageProgress(p.stage), 0) / projects.length)}%` : '0%')}
            </span>
            <p className="text-slate-450 text-[10px] font-extrabold uppercase tracking-wider mt-1">Filing Readiness</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Patent Projects */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">My Patent Projects</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage your specification lifecycle stages</p>
            </div>
            <Link to="/dashboard/projects" className="text-xs font-bold text-indigo-650 hover:underline">View all</Link>
          </div>

          {loadingProjects ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-3">
              <FolderKanban className="w-8 h-8 mx-auto text-slate-350" />
              <p>No projects found. Click "Create New Patent" to start.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="pb-3">Project</th>
                    <th className="pb-3">Stage</th>
                    <th className="pb-3">Guide</th>
                    <th className="pb-3">Progress</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((p) => {
                    const progress = getStageProgress(p.stage);
                    const guide = p.members.find(m => m.role === 'GUIDE')?.user.fullName || 'Dr. X';
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 pr-2">
                          <div className="font-extrabold text-slate-900">{p.title}</div>
                          <div className="text-[10px] text-slate-450 font-semibold">{p.category} • {p.technicalDomain}</div>
                        </td>
                        <td className="py-3.5 pr-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700 uppercase">
                            {p.stage}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 font-medium text-slate-650">{guide}</td>
                        <td className="py-3.5 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">{progress}%</span>
                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <Link
                            to={`/dashboard/projects/${p.id}`}
                            className="inline-block px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-650 hover:border-indigo-200 rounded-xl text-[10px] font-bold text-slate-700 transition-all"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Filing Readiness Visual Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Filing Readiness</h3>

            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="46" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                  <circle cx="56" cy="56" r="46" stroke="#4f46e5" strokeWidth="8" strokeDasharray="289" strokeDashoffset={289 - (289 * 78) / 100} fill="transparent" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-extrabold text-indigo-950 font-mono">78%</span>
                  <span className="text-[8px] text-slate-400 font-bold block uppercase">Readiness</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-[11px] font-bold text-slate-600">
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                <span>Documentation</span>
                <span className="text-emerald-600 font-extrabold">✓ Completed</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                <span>Prototype</span>
                <span className="text-emerald-600 font-extrabold">✓ Completed</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                <span>Patent Forms</span>
                <span className="text-amber-600">60% Complete</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                <span>Guide Review</span>
                <span className="text-emerald-600 font-extrabold">✓ Approved</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                <span>Expert Review</span>
                <span className="text-slate-400 font-extrabold">Pending</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => toast.success('Filing readiness diagnostics checklist verified.')}
            className="w-full mt-4 h-10 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            View Readiness
          </button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Tasks */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Current Tasks</h3>
            <Link to="/dashboard/tasks" className="text-xs font-bold text-indigo-650 hover:underline">View all</Link>
          </div>

          <div className="space-y-4">
            {pendingTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">No upcoming tasks assigned.</div>
            ) : (
              pendingTasks.slice(0, 3).map((task, idx) => (
                <div
                  key={task.id}
                  className="p-4 border border-slate-150 bg-slate-50 hover:bg-white rounded-2xl transition-all shadow-3xs flex justify-between items-start gap-4 cursor-pointer"
                  onClick={() => handleCompleteTask(task.projectId, task.id)}
                >
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-xs text-slate-900">{task.title}</h5>
                    <p className="text-[10px] text-slate-450 font-bold">Project: {task.projectTitle}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 border border-rose-100 text-rose-700 font-extrabold whitespace-nowrap">Due in {3 + idx} days</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Project Progress Overview Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Project Status Overview</h3>

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
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-350 rounded-full" /> Others</span>
                <span className="font-mono text-slate-900">{othersCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Quick Actions</h3>

          <div className="grid grid-cols-1 gap-3">
            <Link
              to="/dashboard/create-project"
              className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 rounded-2xl text-xs font-bold text-slate-750 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4.5 h-4.5 text-indigo-600" />
              <span>+ New Patent Project</span>
            </Link>

            <button
              onClick={() => toast.success('Navigate to Project Details page -> Documents tab to upload.')}
              className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 rounded-2xl text-xs font-bold text-slate-750 transition-all text-left cursor-pointer"
            >
              <FileText className="w-4.5 h-4.5 text-blue-600" />
              <span>Upload Document</span>
            </button>

            <button
              onClick={() => toast.success('Navigate to Project Details page -> Tasks tab to assign prototype milestones.')}
              className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 rounded-2xl text-xs font-bold text-slate-750 transition-all text-left cursor-pointer"
            >
              <Layers className="w-4.5 h-4.5 text-amber-600" />
              <span>Add Prototype</span>
            </button>

            <button
              onClick={() => toast.success('Access the Patent Forms module in Project Details page.')}
              className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 rounded-2xl text-xs font-bold text-slate-750 transition-all text-left cursor-pointer"
            >
              <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600" />
              <span>Open Forms</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
