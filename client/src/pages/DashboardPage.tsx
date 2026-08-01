import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Clock,
  ChevronRight,
  BookOpen,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  PlusCircle,
  Search,
  CheckCircle,
  Activity,
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

  useEffect(() => {
    fetchProjects();
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
      // 1. Create the project as Guide (who becomes project owner)
      const projectRes = await api.post('/projects', {
        title: inviteProjectTitle,
        innovationIdea: 'Created by Faculty Guide supervising Student research workspace.',
        problemStatement: 'Defined by Faculty Guide supervisor.',
        proposedSolution: 'To be populated by invited Student.',
        technicalDomain: inviteDomain,
        category: inviteCategory,
      });

      const projectId = projectRes.data.project.id;

      // 2. Invite Student as INVENTOR
      await api.post('/collaboration/invite', {
        projectId,
        username: inviteUsername,
        role: 'INVENTOR',
      });

      toast.success('Project created and Student invited successfully!');
      setInviteProjectTitle('');
      setInviteUsername('');
      setInviteDomain('');
      setInviteCategory('');
      fetchProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate project invitation.');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- RENDER 1: ADMIN DASHBOARD ---
  if (role === 'Admin') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-4 animate-fade-in relative">
        <div className="flex justify-between items-center border-b border-slate-200/60 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
              Admin Control Hub
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-2">
              Promote user roles, manage accounts activation, and audit platform projects.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-xl">
              <ShieldCheck className="w-4 h-4" /> System Administrator
            </span>
          </div>
        </div>

        {/* Admin Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-900">{usersList.length}</span>
              <p className="text-slate-500 text-xs font-medium">Registered Platform Users</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-900">{projects.length}</span>
              <p className="text-slate-500 text-xs font-medium">Total Patent Projects</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-900">
                {usersList.filter((u) => u.isActive).length}
              </span>
              <p className="text-slate-500 text-xs font-medium">Active Accounts</p>
            </div>
          </div>
        </div>

        {/* User Accounts Management panel */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm">
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

  // --- RENDER 2: GUIDE / FACULTY DASHBOARD ---
  if (role === 'Guide') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-4 animate-fade-in relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
              Faculty Supervisor Workspace
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-2">
              Initiate supervised projects, assign students, and approve patent filing stages.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold rounded-xl">
              <UserCheck className="w-4 h-4" /> Faculty Guide
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Project List Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Supervised Projects</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Active patent specification lifecycle</p>
              </div>

              {loadingProjects ? (
                <div className="py-16 text-center text-slate-400 text-sm font-medium">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-medium space-y-3">
                  <FolderKanban className="w-8 h-8 mx-auto text-slate-300" />
                  <p>You are not supervising any patent projects yet. Initialize one on the right panel!</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {projects.map((proj) => {
                    const progress = getStageProgress(proj.stage);
                    return (
                      <div
                        key={proj.id}
                        className="p-5 border border-slate-200/80 hover:border-blue-500/20 hover:shadow-2xs rounded-2xl bg-slate-50/50 hover:bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all group"
                      >
                        <div className="space-y-1 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {proj.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {proj.technicalDomain}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                            {proj.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Owner: {proj.owner.fullName} (@{proj.owner.username})
                          </p>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="w-24 text-right">
                            <span className="text-[11px] font-bold text-blue-600 font-mono">{progress}% Complete</span>
                            <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                          <Link
                            to={`/dashboard/projects/${proj.id}`}
                            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all shrink-0 flex items-center gap-1.5"
                          >
                            <span>Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Create/Invite Panel Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <PlusCircle className="w-4.5 h-4.5 text-blue-600" /> Supervise New Project
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Initiate a research workspace and invite a student to collaborate:
              </p>

              <form onSubmit={handleGuideCreateProject} className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteProjectTitle}
                    onChange={(e) => setInviteProjectTitle(e.target.value)}
                    placeholder="e.g. Smart Irrigation System"
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Student Username
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="e.g. rahul_dev"
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Domain
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteDomain}
                      onChange={(e) => setInviteDomain(e.target.value)}
                      placeholder="e.g. IoT"
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteCategory}
                      onChange={(e) => setInviteCategory(e.target.value)}
                      placeholder="e.g. Utility"
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="w-full h-9.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingInvite ? 'Initiating...' : 'Create & Invite Student'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 3: PATENT EXPERT DASHBOARD ---
  if (role === 'PatentExpert') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-4 animate-fade-in relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
              Patent Expert Audit Deck
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-2">
              Review assigned project claims and prepare documentation logs for submission.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 border border-cyan-100 text-cyan-700 text-xs font-bold rounded-xl">
              <ShieldCheck className="w-4 h-4" /> Patent Expert
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Assigned Audit Folders</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Claims and compliance reviews</p>
              </div>

              {loadingProjects ? (
                <div className="py-16 text-center text-slate-400 text-sm font-medium">Loading audit folders...</div>
              ) : projects.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-medium space-y-3">
                  <FolderKanban className="w-8 h-8 mx-auto text-slate-300" />
                  <p>You have not been assigned to any patent projects yet.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {projects.map((proj) => {
                    const progress = getStageProgress(proj.stage);
                    return (
                      <div
                        key={proj.id}
                        className="p-5 border border-slate-200/80 hover:border-cyan-500/20 hover:shadow-2xs rounded-2xl bg-slate-50/50 hover:bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all group"
                      >
                        <div className="space-y-1 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-100">
                              {proj.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {proj.technicalDomain}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-cyan-600 transition-colors">
                            {proj.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Owner: {proj.owner.fullName} (@{proj.owner.username})
                          </p>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="w-24 text-right">
                            <span className="text-[11px] font-bold text-cyan-600 font-mono">{progress}% Complete</span>
                            <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                          <Link
                            to={`/dashboard/projects/${proj.id}`}
                            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-cyan-600 hover:text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all shrink-0 flex items-center gap-1.5"
                          >
                            <span>Audit</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 text-cyan-600" /> Audit Standards
              </h3>
              <ul className="space-y-3.5 text-slate-500 text-xs leading-relaxed font-medium">
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-1.5 shrink-0" />
                  Ensure descriptions conform completely with Section 10 rules.
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-1.5 shrink-0" />
                  Validate the patent claims against known Prior Art registry.
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-1.5 shrink-0" />
                  Approve and update stages to GUIDE_REVIEW or PATENT_FORMS.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 4: INVENTOR / DEFAULT DASHBOARD ---
  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans py-4 animate-fade-in relative z-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
            Patent Workspace
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-2">
            Manage your invention catalog and coordinate filing tasks.
          </p>
        </div>

        <Link
          to="/dashboard/create-project"
          className="group px-4 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs flex items-center gap-2 text-xs hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Patent Catalog */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Active Patent Catalog</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Specifications and filing lifecycle tracker</p>
              </div>
              <Link
                to="/dashboard/projects"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
              >
                <span>View project folder</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loadingProjects ? (
              <div className="py-16 text-center text-slate-400 text-sm font-medium">Loading patent folders...</div>
            ) : projects.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-2xs">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">No Active Projects</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Initiate your first patent folder to start drafting claims and generating specifications.
                </p>
                <Link
                  to="/dashboard/create-project"
                  className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Start project
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((proj) => {
                  const progress = getStageProgress(proj.stage);
                  return (
                    <div
                      key={proj.id}
                      className="p-5 border border-slate-200/80 hover:border-indigo-500/20 hover:shadow-2xs rounded-2xl bg-slate-50/50 hover:bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all group"
                    >
                      <div className="space-y-1 max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {proj.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {proj.technicalDomain}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {proj.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Created: {new Date(proj.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        <div className="w-28 text-right">
                          <span className="text-[11px] font-bold text-indigo-600 font-mono">{progress}% Complete</span>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden border border-slate-200/60">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <Link
                          to={`/dashboard/projects/${proj.id}`}
                          className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all shrink-0 flex items-center gap-1.5"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Filing Roadmap Checklist */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" /> Filing Instructions
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Understand the standard steps required to prepare and file your Indian patent applications:
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Prior Art Search</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-normal font-medium">
                    Audit WIPO registries and save reference citations in your workspace folder.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Claim Drafting</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-normal font-medium">
                    Structure specifications with clear independent scope limits for Form 2.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Guide Evaluation</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-normal font-medium">
                    Assign review tasks to supervisors or guides to acquire design clearance approvals.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Generate IPO Forms</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-normal font-medium">
                    Export complete ready-to-file request bundles for Forms 1, 2, 3, & 5.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
