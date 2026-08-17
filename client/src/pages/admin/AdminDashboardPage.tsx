import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  BarChart2,
  Users,
  Building2,
  CheckCircle2,
  Folder,
  Eye,
  Brain,
  Sparkles,
  ShieldCheck,
  FileCode,
  FileText,
  FileSpreadsheet,
  Lock,
  Bell,
  Clock,
  Settings,
  Search,
  Plus,
  Download,
  Check,
  X,
  RefreshCw,
  LogOut,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string | number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [searchGlobal, setSearchGlobal] = useState('');
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('patenthub_token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Platform Data States
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [verificationsList, setVerificationsList] = useState<any[]>([]);
  const [organizationsList, setOrganizationsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [claimsFtoData, setClaimsFtoData] = useState<any>(null);
  const [aiOperationsData, setAiOperationsData] = useState<any>(null);
  const [announcementsList, setAnnouncementsList] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(null);

  // Modals & Drawers
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null);
  const [verificationDecisionModal, setVerificationDecisionModal] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgData, setNewOrgData] = useState({ name: '', domain: '', contactEmail: '' });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [assignReviewerData, setAssignReviewerData] = useState({ username: '', role: 'GUIDE' });
  const [showCreateAnnModal, setShowCreateAnnModal] = useState(false);
  const [newAnnData, setNewAnnData] = useState({
    title: '',
    message: '',
    targetRole: 'ALL',
    priority: 'NORMAL',
  });

  // User filters
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Initial Fetch
  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const [
        dashRes,
        usersRes,
        verRes,
        orgsRes,
        projRes,
        revRes,
        claimsRes,
        aiRes,
        annRes,
        settRes,
      ] = await Promise.allSettled([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/verifications'),
        api.get('/admin/organizations'),
        api.get('/admin/projects'),
        api.get('/admin/reviews'),
        api.get('/admin/claims-fto-oversight'),
        api.get('/admin/ai-operations'),
        api.get('/admin/announcements'),
        api.get('/admin/settings'),
      ]);

      if (dashRes.status === 'fulfilled') setMetrics(dashRes.value.data);
      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value.data.users || []);
      if (verRes.status === 'fulfilled') setVerificationsList(verRes.value.data.applications || []);
      if (orgsRes.status === 'fulfilled') setOrganizationsList(orgsRes.value.data.organizations || []);
      if (projRes.status === 'fulfilled') setProjectsList(projRes.value.data.projects || []);
      if (revRes.status === 'fulfilled') setReviewsData(revRes.value.data);
      if (claimsRes.status === 'fulfilled') setClaimsFtoData(claimsRes.value.data);
      if (aiRes.status === 'fulfilled') setAiOperationsData(aiRes.value.data);
      if (annRes.status === 'fulfilled') setAnnouncementsList(annRes.value.data.announcements || []);
      if (settRes.status === 'fulfilled') setSystemSettings(settRes.value.data.settings);
    } catch (e: any) {
      toast.error('Failed to load some admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // Action Handlers
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      toast.success(`User account ${!currentStatus ? 'activated' : 'suspended'}!`);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleUpdateUserRole = async (userId: string, roleName: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { roleName });
      toast.success(`User role updated to ${roleName}!`);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: roleName } : u))
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      toast.success(`User ${userToDelete.fullName} (${userToDelete.username}) deleted permanently from database.`);
      setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
      fetchAllAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleProcessVerification = async (decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SUSPEND') => {
    if (!selectedVerification) return;
    try {
      await api.post(`/admin/verifications/${selectedVerification.id}/decision`, {
        decision,
        notes: decisionNotes,
      });
      toast.success(`Verification ${decision.toLowerCase()} processed!`);
      setVerificationDecisionModal(false);
      setSelectedVerification(null);
      setDecisionNotes('');
      fetchAllAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process verification.');
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/organizations', newOrgData);
      toast.success('Organization registered successfully!');
      setOrganizationsList((prev) => [res.data.organization, ...prev]);
      setShowCreateOrgModal(false);
      setNewOrgData({ name: '', domain: '', contactEmail: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register organization.');
    }
  };

  const handleAssignReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !assignReviewerData.username.trim()) return;
    try {
      await api.put(`/admin/projects/${selectedProject.id}/assign`, {
        reviewerUsername: assignReviewerData.username.trim(),
        role: assignReviewerData.role,
      });
      toast.success('Reviewer assigned to project successfully!');
      setShowAssignModal(false);
      setSelectedProject(null);
      setAssignReviewerData({ username: '', role: 'GUIDE' });
      fetchAllAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign reviewer.');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnData.title.trim() || !newAnnData.message.trim()) return;
    try {
      const res = await api.post('/admin/announcements', newAnnData);
      toast.success('System broadcast published!');
      setAnnouncementsList((prev) => [res.data.announcement, ...prev]);
      setShowCreateAnnModal(false);
      setNewAnnData({ title: '', message: '', targetRole: 'ALL', priority: 'NORMAL' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish broadcast.');
    }
  };

  // Nav categories structure
  const navGroups: NavGroup[] = [
    {
      group: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
      ],
    },
    {
      group: 'PLATFORM',
      items: [
        { id: 'users', label: 'Users', icon: Users, badge: usersList.length },
        { id: 'organizations', label: 'Organizations', icon: Building2, badge: organizationsList.length },
        { id: 'verification', label: 'Verification', icon: CheckCircle2, badge: verificationsList.filter(v => v.status === 'PENDING').length },
        { id: 'projects', label: 'Projects', icon: Folder, badge: projectsList.length },
        { id: 'reviews', label: 'Reviews', icon: Eye, badge: reviewsData?.metrics?.pendingReviews || 0 },
      ],
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { id: 'intelligence', label: 'Patent Intelligence', icon: Brain },
        { id: 'ai-operations', label: 'AI Operations', icon: Sparkles },
        { id: 'fto-monitoring', label: 'FTO Monitoring', icon: ShieldCheck },
        { id: 'claims-oversight', label: 'Claims Oversight', icon: FileCode },
      ],
    },
    {
      group: 'CONTENT',
      items: [
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
      ],
    },
    {
      group: 'GOVERNANCE',
      items: [
        { id: 'permissions', label: 'Roles & Permissions', icon: Lock },
        { id: 'announcements', label: 'Notifications', icon: Bell },
        { id: 'audit-logs', label: 'Audit Logs', icon: Clock },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesStatus =
      userStatusFilter === 'ALL' ||
      (userStatusFilter === 'ACTIVE' && u.isActive) ||
      (userStatusFilter === 'SUSPENDED' && !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased">
      {/* 1. LEFT ADMIN SIDEBAR (6-GROUP DESIGN) */}
      <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-screen sticky top-0 shrink-0 z-40 shadow-xs">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <Link to="/admin" className="flex items-center gap-3 overflow-hidden group">
            <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-sm shrink-0">
              <Shield className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-slate-950 block leading-none">
                PatentHub-AI
              </span>
              <span className="text-[9px] text-blue-600 font-extrabold uppercase tracking-wider block mt-0.5">
                Platform Governance
              </span>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <div className="px-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                {grp.group}
              </div>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Sidebar User Profile & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-900 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              AD
            </div>
            <div className="min-w-0">
              <span className="text-xs font-extrabold text-slate-900 block truncate leading-tight">System Admin</span>
              <span className="text-[10px] text-slate-400 block truncate leading-tight">Platform Master</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN ADMIN CONTENT VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-3xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {navGroups.find((g) => g.items.some((i) => i.id === activeNav))?.group}
            </span>
            <span className="text-slate-300">/</span>
            <h2 className="text-sm font-extrabold text-slate-900 capitalize flex items-center gap-2">
              <span>{activeNav.replace('-', ' ')}</span>
              {loading && <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Universal Search Bar */}
            <div className="relative w-64 hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchGlobal}
                onChange={(e) => setSearchGlobal(e.target.value)}
                placeholder="Search platform assets..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 transition shadow-3xs"
              />
            </div>

            {/* Notification & Admin Profile Badge */}
            <button
              onClick={() => setActiveNav('announcements')}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-blue-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
                AD
              </div>
              <div className="hidden md:block text-left">
                <span className="text-xs font-extrabold text-slate-900 block leading-tight">System Admin</span>
                <span className="text-[10px] text-emerald-600 font-bold block leading-tight">Platform Master</span>
              </div>
            </div>

            {/* Top Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs font-bold transition cursor-pointer shadow-3xs"
              title="Sign out of PatentHub-AI"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto animate-fade-in">
          {/* SECTION 1: DASHBOARD OVERVIEW */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Greeting */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">Platform Governance Center</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Real-time ecosystem intelligence, trust verification, and patent lifecycle performance.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={fetchAllAdminData}
                    className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold transition shadow-3xs cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={() => setActiveNav('reports')}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Platform Report</span>
                  </button>
                </div>
              </div>

              {/* 6 Top KPI Cards (100% Real Database Values) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Users', value: metrics?.kpis?.totalUsers ?? usersList.length, change: 'Registered', color: 'text-blue-600 bg-blue-50' },
                  { label: 'Patent Projects', value: metrics?.kpis?.totalProjects ?? projectsList.length, change: 'In Portfolio', color: 'text-indigo-600 bg-indigo-50' },
                  { label: 'Organizations', value: metrics?.kpis?.totalOrganizations ?? organizationsList.length, change: 'Active Org Domains', color: 'text-purple-600 bg-purple-50' },
                  { label: 'Verifications', value: `${metrics?.kpis?.pendingVerifications ?? verificationsList.filter(v => v.status === 'PENDING').length} Pending`, change: 'Trust Queue', color: 'text-amber-600 bg-amber-50' },
                  { label: 'Reviews', value: `${metrics?.kpis?.pendingReviews ?? reviewsData?.metrics?.pendingReviews ?? 0} Pending`, change: 'Review Desk', color: 'text-rose-600 bg-rose-50' },
                  { label: 'Filing Ready', value: metrics?.kpis?.filingReadyProjects ?? 0, change: 'Ready for IPO', color: 'text-emerald-600 bg-emerald-50' },
                ].map((kpi, idx) => (
                  <div key={idx} className="app-card p-4 space-y-1.5 shadow-3xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{kpi.label}</span>
                    <div className="text-xl font-black text-slate-900">{kpi.value}</div>
                    <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded ${kpi.color}`}>
                      {kpi.change}
                    </span>
                  </div>
                ))}
              </div>

              {/* 9-Stage Platform Patent Workflow Stepper */}
              <div className="app-card p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Platform Patent Workflow Stage Distribution
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-bold">{projectsList.length} Active Projects Pipeline</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
                  {[
                    { stage: 'Idea', count: metrics?.stageDistribution?.IDEA ?? 0, color: 'border-blue-200 bg-blue-50/40 text-blue-800' },
                    { stage: 'Lit. Review', count: metrics?.stageDistribution?.LITERATURE_REVIEW ?? 0, color: 'border-cyan-200 bg-cyan-50/40 text-cyan-800' },
                    { stage: 'Prototype', count: metrics?.stageDistribution?.PROTOTYPE ?? 0, color: 'border-indigo-200 bg-indigo-50/40 text-indigo-800' },
                    { stage: 'Docs', count: metrics?.stageDistribution?.DOCUMENTATION ?? 0, color: 'border-teal-200 bg-teal-50/40 text-teal-800' },
                    { stage: 'Forms Prep', count: metrics?.stageDistribution?.FORMS_PREPARATION ?? 0, color: 'border-amber-200 bg-amber-50/40 text-amber-800' },
                    { stage: 'Guide Review', count: metrics?.stageDistribution?.GUIDE_REVIEW ?? 0, color: 'border-purple-200 bg-purple-50/40 text-purple-800' },
                    { stage: 'Expert Review', count: metrics?.stageDistribution?.PATENT_EXPERT_REVIEW ?? 0, color: 'border-pink-200 bg-pink-50/40 text-pink-800' },
                    { stage: 'Filing Ready', count: metrics?.stageDistribution?.FILING_READY ?? 0, color: 'border-emerald-300 bg-emerald-100/50 text-emerald-900' },
                    { stage: 'Filed (IPO)', count: metrics?.stageDistribution?.FILED ?? 0, color: 'border-slate-300 bg-slate-100 text-slate-900' },
                  ].map((st, i) => (
                    <div key={i} className={`p-3 rounded-2xl border text-center space-y-1 ${st.color}`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider block truncate">{st.stage}</span>
                      <div className="text-xl font-black">{st.count}</div>
                      <span className="text-[9px] font-semibold opacity-75">projects</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3-Column Dashboard Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Patent Intelligence (4 cols) */}
                <div className="lg:col-span-4 app-card p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Platform Patent Health
                    </h3>
                    <button onClick={() => setActiveNav('intelligence')} className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">
                      Inspect →
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { label: 'Patent Eligibility', val: metrics?.intelligence?.patentEligibility ?? 0, color: 'bg-emerald-500' },
                      { label: 'Prior Art Risk (Platform Avg)', val: metrics?.intelligence?.priorArtRisk ?? 0, color: 'bg-amber-500' },
                      { label: 'Drawing Completeness', val: metrics?.intelligence?.drawingCompleteness ?? 0, color: 'bg-emerald-500' },
                      { label: 'Legal Compliance', val: metrics?.intelligence?.legalCompliance ?? 0, color: 'bg-emerald-500' },
                      { label: 'Team Execution Rate', val: metrics?.intelligence?.teamExecution ?? 0, color: 'bg-emerald-500' },
                      { label: 'Filing Readiness Ratio', val: metrics?.intelligence?.filingReadiness ?? 0, color: 'bg-blue-500' },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700">{item.label}</span>
                          <span className="font-mono text-slate-900 font-extrabold">{item.val}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Trust Queue (4 cols) */}
                <div className="lg:col-span-4 app-card p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Verification Queue
                    </h3>
                    <button onClick={() => setActiveNav('verification')} className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">
                      View All ({verificationsList.length}) →
                    </button>
                  </div>

                  {verificationsList.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                      No applications currently in queue.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {verificationsList.slice(0, 3).map((app) => (
                        <div key={app.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{app.applicantName}</span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                              {app.roleApplied}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium truncate">{app.organization}</p>
                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <span className="text-slate-400 font-semibold">{app.specialization}</span>
                            <button
                              onClick={() => {
                                setSelectedVerification(app);
                                setVerificationDecisionModal(true);
                              }}
                              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-500 rounded-lg font-bold text-blue-700 cursor-pointer shadow-3xs"
                            >
                              Review App
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Review Performance & Recent Activity (4 cols) */}
                <div className="lg:col-span-4 app-card p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Review Turnaround
                    </h3>
                    <button onClick={() => setActiveNav('reviews')} className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">
                      Manage →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Pending</span>
                      <div className="text-lg font-black text-rose-600">
                        {reviewsData?.metrics?.pendingReviews ?? metrics?.reviewPerformance?.pendingReviews ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Completed</span>
                      <div className="text-lg font-black text-emerald-600">
                        {reviewsData?.metrics?.completedReviews ?? metrics?.reviewPerformance?.completedReviews ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Overdue</span>
                      <div className="text-lg font-black text-amber-600">
                        {reviewsData?.metrics?.overdueReviews ?? metrics?.reviewPerformance?.overdueReviews ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Avg Time</span>
                      <div className="text-lg font-black text-blue-600">
                        {reviewsData?.metrics?.avgReviewTimeDays ?? metrics?.reviewPerformance?.avgTurnaroundDays ?? 0}d
                      </div>
                    </div>
                  </div>

                  {/* Activity Mini Log */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Audit Trail</span>
                    {metrics?.recentActivities && metrics.recentActivities.length > 0 ? (
                      metrics.recentActivities.slice(0, 3).map((act: any) => (
                        <div key={act.id} className="text-xs space-y-0.5">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span className="truncate">{act.user}</span>
                            <span className="text-[10px] text-slate-400">{act.time}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">{act.action}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-400">No recent activity logged.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: USER MANAGEMENT */}
          {activeNav === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">Platform User Management</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Manage {usersList.length} registered accounts across all institutional domains.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Total: {filteredUsers.length}</span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="app-card p-4 flex flex-wrap items-center justify-between gap-4 shadow-3xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="Search name, email, username..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 shadow-3xs"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-3xs cursor-pointer"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="Inventor">Inventors</option>
                    <option value="CoInventor">Co-Inventors</option>
                    <option value="Guide">Faculty Guides</option>
                    <option value="PatentExpert">Patent Experts</option>
                    <option value="Admin">Administrators</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-3xs cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="SUSPENDED">Suspended Only</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="app-card overflow-hidden shadow-xs border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Name & Username</th>
                        <th className="p-4">Account Type</th>
                        <th className="p-4">Organization</th>
                        <th className="p-4">Projects</th>
                        <th className="p-4">Verification</th>
                        <th className="p-4">Account Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{u.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">@{u.username} • {u.email}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-slate-700">{u.institution}</td>
                          <td className="p-4 font-extrabold text-slate-900 font-mono">{u.projectsCount}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              u.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {u.verificationStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                              u.isActive ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {u.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-3xs cursor-pointer"
                            >
                              Edit Profile
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-3xs cursor-pointer border ${
                                u.isActive
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {u.isActive ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-bold transition shadow-3xs cursor-pointer inline-flex items-center gap-1"
                              title="Permanently delete user from database"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: GUIDE & PATENT EXPERT VERIFICATION */}
          {activeNav === 'verification' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">Trust Layer & Verification Queue</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Evaluate credentials, academic affiliations, and statutory licenses before granting Guide or Expert evaluation authority.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {verificationsList.map((app) => (
                  <div key={app.id} className="app-card p-6 space-y-4 shadow-xs border-slate-200 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Application #{app.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          app.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : app.status === 'UNDER_REVIEW'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">{app.applicantName}</h3>
                        <p className="text-xs text-blue-600 font-bold">{app.roleApplied} • {app.experienceYears} Years Exp</p>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <p><strong>Qualification:</strong> {app.qualification}</p>
                        <p><strong>Organization:</strong> {app.organization}</p>
                        <p><strong>Domain Focus:</strong> {app.specialization}</p>
                        <p><strong>Official Email:</strong> {app.officialEmail}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Submitted Credentials</span>
                        <div className="space-y-1">
                          {app.documents.map((doc: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-[11px] p-2 bg-slate-50 rounded-xl border border-slate-200">
                              <span className="truncate font-medium text-slate-800">{doc.name}</span>
                              <span className="text-blue-600 font-bold text-[10px]">Inspect</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedVerification(app);
                          setVerificationDecisionModal(true);
                        }}
                        className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer text-center"
                      >
                        Evaluate & Make Decision
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: ORGANIZATIONS */}
          {activeNav === 'organizations' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">Organization Governance</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Registered university campuses, research laboratories, and IP liaison cells.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateOrgModal(true)}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Organization</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizationsList.map((org) => (
                  <div key={org.id} className="app-card p-6 space-y-4 shadow-xs border-slate-200 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{org.domain}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700">
                          {org.status}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">{org.name}</h3>

                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Members</span>
                          <div className="text-base font-black text-slate-900">{org.membersCount}</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Projects</span>
                          <div className="text-base font-black text-blue-600">{org.projectsCount}</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Guides</span>
                          <div className="text-base font-black text-slate-800">{org.guidesCount}</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Experts</span>
                          <div className="text-base font-black text-slate-800">{org.expertsCount}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer">
                        View Organization Portal →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: PROJECT ECOSYSTEM */}
          {activeNav === 'projects' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">Patent Project Ecosystem</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Platform-wide project auditing, supervisor assignments, and workflow governance.
                  </p>
                </div>
              </div>

              <div className="app-card overflow-hidden shadow-xs border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Project & Title</th>
                        <th className="p-4">Lead Inventor</th>
                        <th className="p-4">Current Stage</th>
                        <th className="p-4">Assigned Guide</th>
                        <th className="p-4">Patent Expert</th>
                        <th className="p-4">Readiness</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectsList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{p.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.category} • {p.technicalDomain}</div>
                          </td>
                          <td className="p-4 font-semibold text-slate-800">{p.inventor}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {p.stage}
                            </span>
                          </td>
                          <td className="p-4 text-slate-700 font-medium">{p.guide}</td>
                          <td className="p-4 text-slate-700 font-medium">{p.expert}</td>
                          <td className="p-4 font-black font-mono text-emerald-600">{p.readinessScore}%</td>
                          <td className="p-4 text-right space-x-2">
                            <Link
                              to={`/dashboard/projects/${p.id}`}
                              className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-3xs"
                            >
                              Inspect
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedProject(p);
                                setShowAssignModal(true);
                              }}
                              className="px-2.5 py-1 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold transition shadow-3xs cursor-pointer"
                            >
                              Assign Staff
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: PATENT INTELLIGENCE & ANALYTICS */}
          {(activeNav === 'intelligence' || activeNav === 'analytics') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">Platform Patent Intelligence</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Aggregated AI novelty scores, Freedom-to-Operate risks, and statutory filing readiness.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="app-card p-6 space-y-4 shadow-xs">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Average Patent Eligibility</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-black text-emerald-600">{metrics?.intelligence?.patentEligibility ?? 0}%</div>
                    <p className="text-xs text-slate-500 font-medium">Authoritative novelty index across all database projects.</p>
                  </div>
                </div>

                <div className="app-card p-6 space-y-4 shadow-xs">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Average Prior Art Risk</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-black text-amber-600">{metrics?.intelligence?.priorArtRisk ?? 0}%</div>
                    <p className="text-xs text-slate-500 font-medium">Computed across active public and statutory patent citations.</p>
                  </div>
                </div>

                <div className="app-card p-6 space-y-4 shadow-xs">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Filing Readiness Ratio</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-black text-blue-600">{metrics?.intelligence?.filingReadiness ?? 0}%</div>
                    <p className="text-xs text-slate-500 font-medium">{metrics?.kpis?.filingReadyProjects ?? 0} projects ready for immediate IPO submission.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: CLAIMS & FTO OVERSIGHT */}
          {(activeNav === 'claims-oversight' || activeNav === 'fto-monitoring') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">Claims & FTO Risk Oversight</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Platform-wide claim tree validations, Freedom-to-Operate overlaps, and infringement risk matrices.
                  </p>
                </div>
              </div>

              {/* FTO Risk Breakdown Meters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="app-card p-6 space-y-2 border-l-4 border-l-emerald-500 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Clear / Low Risk</span>
                  <div className="text-2xl font-black text-emerald-600">
                    {claimsFtoData?.ftoMetrics?.riskDistribution?.lowRiskPercent ?? 100}%
                  </div>
                  <p className="text-xs text-slate-500">Zero active claim infringement overlaps.</p>
                </div>

                <div className="app-card p-6 space-y-2 border-l-4 border-l-amber-500 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Moderate Overlap</span>
                  <div className="text-2xl font-black text-amber-600">
                    {claimsFtoData?.ftoMetrics?.riskDistribution?.mediumRiskPercent ?? 0}%
                  </div>
                  <p className="text-xs text-slate-500">Requires preamble claim narrowing.</p>
                </div>

                <div className="app-card p-6 space-y-2 border-l-4 border-l-rose-500 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Critical Risk</span>
                  <div className="text-2xl font-black text-rose-600">
                    {claimsFtoData?.ftoMetrics?.riskDistribution?.highRiskPercent ?? 0}%
                  </div>
                  <p className="text-xs text-slate-500">Direct prior art overlap flagged.</p>
                </div>
              </div>

              {/* Recent FTO Logs Table */}
              <div className="app-card p-6 space-y-4 shadow-xs">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Recent FTO Analyses</h3>
                {claimsFtoData?.recentFtoAnalyses && claimsFtoData.recentFtoAnalyses.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs">
                    {claimsFtoData.recentFtoAnalyses.map((item: any) => (
                      <div key={item.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{item.projectTitle}</div>
                          <div className="text-[10px] text-slate-400">Inventor: {item.inventor} • Overlaps: {item.overlappingPatents.join(', ')}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold ${
                          item.riskLevel === 'LOW'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.riskLevel === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {item.riskLevel} RISK ({item.score}%)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No FTO analyses recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* SECTION 8: AI OPERATIONS */}
          {activeNav === 'ai-operations' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">AI Operations & Gemini Monitoring</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Track token usage, request latencies, prompt generations, and operational health.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="app-card p-4 space-y-1 text-center shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Claims Generated</span>
                  <div className="text-xl font-black text-slate-900">
                    {claimsFtoData?.claimsMetrics?.totalClaimsCreated ?? aiOperationsData?.summary?.claimGenerations ?? 0}
                  </div>
                </div>
                <div className="app-card p-4 space-y-1 text-center shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Patent Analyses</span>
                  <div className="text-xl font-black text-blue-600">
                    {aiOperationsData?.summary?.patentAnalyses ?? 0}
                  </div>
                </div>
                <div className="app-card p-4 space-y-1 text-center shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">FTO Analyses</span>
                  <div className="text-xl font-black text-indigo-600">
                    {claimsFtoData?.ftoMetrics?.totalFtoAnalyses ?? 0}
                  </div>
                </div>
                <div className="app-card p-4 space-y-1 text-center shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Success Rate</span>
                  <div className="text-xl font-black text-emerald-600">
                    {aiOperationsData?.summary?.successRate ?? 100}%
                  </div>
                </div>
              </div>

              {/* Usage by Organization */}
              <div className="app-card p-6 space-y-4 shadow-xs">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">AI Usage by Organization</h3>
                <div className="space-y-3">
                  {aiOperationsData?.usageByOrg?.map((org: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="font-bold text-slate-800">{org.org}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-slate-600">{org.requests} requests</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-extrabold text-[10px]">{org.cost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 9: REVIEWS OVERSIGHT */}
          {activeNav === 'reviews' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">Review Governance Deck</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Monitor supervisor reviews, resolve bottlenecks, and track faculty turnaround times.
                  </p>
                </div>
              </div>

              <div className="app-card p-6 space-y-4 shadow-xs">
                {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs">
                    {reviewsData.reviews.map((rev: any) => (
                      <div key={rev.id} className="py-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm">{rev.projectTitle}</div>
                          <div className="text-slate-500 mt-0.5">
                            Reviewer: <strong>{rev.reviewer}</strong> ({rev.role}) • Task: {rev.type}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">Due Date: {rev.dueDate}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold ${
                            rev.status === 'COMPLETED' || rev.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {rev.status}
                          </span>
                          <button className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs shadow-3xs cursor-pointer">
                            Reassign
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                    No milestone reviews currently recorded in the database.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 10: ROLES & PERMISSIONS MATRIX */}
          {activeNav === 'permissions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">Roles & Permissions Matrix</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Platform capability matrix across Platform Admins, Organization Admins, Guides, Experts, and Inventors.
                  </p>
                </div>
              </div>

              <div className="app-card overflow-hidden shadow-xs border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Platform Permission Capability</th>
                        <th className="p-4 text-center">Inventor</th>
                        <th className="p-4 text-center">Co-Inventor</th>
                        <th className="p-4 text-center">Guide</th>
                        <th className="p-4 text-center">Patent Expert</th>
                        <th className="p-4 text-center">Org Admin</th>
                        <th className="p-4 text-center">Platform Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {[
                        { perm: 'Create New Patent Project', inv: true, coi: false, gde: false, exp: false, org: true, adm: true },
                        { perm: 'Draft Claims & Add Dependent Claims', inv: true, coi: true, gde: true, exp: true, org: false, adm: true },
                        { perm: 'Run Gemini AI Novelty & Prior Art', inv: true, coi: true, gde: true, exp: true, org: true, adm: true },
                        { perm: 'Generate FTO Infringement Matrices', inv: true, coi: true, gde: true, exp: true, org: true, adm: true },
                        { perm: 'Endorse & Approve Form 2 (Claims)', inv: false, coi: false, gde: true, exp: true, org: false, adm: true },
                        { perm: 'Mark Project as Filing Ready', inv: false, coi: false, gde: false, exp: true, org: false, adm: true },
                        { perm: 'Verify Guides & Patent Experts', inv: false, coi: false, gde: false, exp: false, org: false, adm: true },
                        { perm: 'Manage Organization Members', inv: false, coi: false, gde: false, exp: false, org: true, adm: true },
                        { perm: 'System Wide Audit Logs & Settings', inv: false, coi: false, gde: false, exp: false, org: false, adm: true },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-900">{row.perm}</td>
                          <td className="p-4 text-center">{row.inv ? <Check className="w-4 h-4 text-emerald-600 mx-auto stroke-[3]" /> : <span className="text-slate-300">—</span>}</td>
                          <td className="p-4 text-center">{row.coi ? <Check className="w-4 h-4 text-emerald-600 mx-auto stroke-[3]" /> : <span className="text-slate-300">—</span>}</td>
                          <td className="p-4 text-center">{row.gde ? <Check className="w-4 h-4 text-emerald-600 mx-auto stroke-[3]" /> : <span className="text-slate-300">—</span>}</td>
                          <td className="p-4 text-center">{row.exp ? <Check className="w-4 h-4 text-emerald-600 mx-auto stroke-[3]" /> : <span className="text-slate-300">—</span>}</td>
                          <td className="p-4 text-center">{row.org ? <Check className="w-4 h-4 text-emerald-600 mx-auto stroke-[3]" /> : <span className="text-slate-300">—</span>}</td>
                          <td className="p-4 text-center">{row.adm ? <Check className="w-4 h-4 text-emerald-600 mx-auto stroke-[3]" /> : <span className="text-slate-300">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 11: ANNOUNCEMENTS */}
          {activeNav === 'announcements' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">System Announcements</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Broadcast critical updates, maintenance notices, and policy releases across the platform.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateAnnModal(true)}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Announcement</span>
                </button>
              </div>

              {announcementsList && announcementsList.length > 0 ? (
                <div className="space-y-4">
                  {announcementsList.map((ann) => (
                    <div key={ann.id} className="app-card p-6 space-y-2 border-l-4 border-l-blue-600 shadow-xs">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-slate-900">{ann.title}</h3>
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{ann.message}</p>
                      <div className="flex items-center gap-3 pt-2 text-[10px] font-bold text-slate-400">
                        <span>Target: {ann.targetRole}</span>
                        <span>•</span>
                        <span>By: {ann.createdBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                  No active announcements broadcasted.
                </div>
              )}
            </div>
          )}

          {/* SECTION 12: SYSTEM SETTINGS */}
          {activeNav === 'settings' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">System Configuration</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Manage platform registration policies, AI quotas, and security enforcement parameters.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="app-card p-6 space-y-4 shadow-xs">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b pb-2">
                    Account & Registration Policy
                  </h3>
                  <div className="space-y-3 text-xs">
                    <label className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Open User Registration</span>
                      <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Mandatory Institutional Email Verification</span>
                      <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Strict Password Strength Rules</span>
                      <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    </label>
                  </div>
                </div>

                <div className="app-card p-6 space-y-4 shadow-xs">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b pb-2">
                    AI Model & Security Policy
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-700 block">Active LLM Provider</span>
                      <select
                        value={systemSettings?.aiProvider || 'Google Gemini Pro'}
                        onChange={(e) => setSystemSettings({ ...systemSettings, aiProvider: e.target.value })}
                        className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-bold"
                      >
                        <option value="Google Gemini Pro">Google Gemini 1.5 Pro</option>
                        <option value="Anthropic Claude 3.5">Anthropic Claude 3.5 Sonnet</option>
                        <option value="OpenAI GPT-4o">OpenAI GPT-4o</option>
                      </select>
                    </div>
                    <label className="flex items-center justify-between pt-2">
                      <span className="font-semibold text-slate-700">Mandatory FTO Claim Charting Before Filing</span>
                      <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FALLBACK FOR DOCUMENTS, AUDIT LOGS, REPORTS */}
          {(activeNav === 'documents' || activeNav === 'reports' || activeNav === 'audit-logs') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight capitalize">{activeNav.replace('-', ' ')} Hub</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Governance and export utilities for platform assets.
                  </p>
                </div>
              </div>

              <div className="app-card p-8 text-center space-y-3 shadow-xs">
                <FileSpreadsheet className="w-12 h-12 text-blue-600 mx-auto" />
                <h3 className="text-sm font-extrabold text-slate-900">Platform Data Ready for Export</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Download full structured audit trails, filing checklists, and performance records in PDF or CSV.
                </p>
                <button
                  onClick={() => toast.success('Report generation started. File will download shortly.')}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Comprehensive Export (.PDF)</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. VERIFICATION DECISION MODAL */}
      {verificationDecisionModal && selectedVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Verification Decision</h3>
                <p className="text-[10px] text-slate-400 font-medium">{selectedVerification.applicantName} ({selectedVerification.roleApplied})</p>
              </div>
              <button onClick={() => setVerificationDecisionModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p><strong>Organization:</strong> {selectedVerification.organization}</p>
                <p><strong>Qualifications:</strong> {selectedVerification.qualification}</p>
                <p><strong>Experience:</strong> {selectedVerification.experienceYears} Years</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Decision Notes / Reason</label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Enter endorsement notes or reason for revision request..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleProcessVerification('APPROVE')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Approve ✓
              </button>
              <button
                onClick={() => handleProcessVerification('REQUEST_INFO')}
                className="py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Request Info
              </button>
              <button
                onClick={() => handleProcessVerification('REJECT')}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Reject ✗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CREATE ORGANIZATION MODAL */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Register Organization</h3>
              <button onClick={() => setShowCreateOrgModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={newOrgData.name}
                  onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Domain</label>
                <input
                  type="text"
                  required
                  value={newOrgData.domain}
                  onChange={(e) => setNewOrgData({ ...newOrgData, domain: e.target.value })}
                  placeholder="e.g. nitc.ac.in"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={newOrgData.contactEmail}
                  onChange={(e) => setNewOrgData({ ...newOrgData, contactEmail: e.target.value })}
                  placeholder="e.g. ipr.cell@nitc.ac.in"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateOrgModal(false)}
                  className="w-1/3 py-2.5 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-blue-900 text-white rounded-xl font-bold"
                >
                  Register Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ASSIGN REVIEWER MODAL */}
      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Assign Staff / Reviewer</h3>
                <p className="text-[10px] text-slate-400 font-medium truncate">{selectedProject.title}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignReviewer} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Staff Username or Email</label>
                <input
                  type="text"
                  required
                  value={assignReviewerData.username}
                  onChange={(e) => setAssignReviewerData({ ...assignReviewerData, username: e.target.value })}
                  placeholder="e.g. @meera_nair or meera@amaljyothi.ac.in"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Designated Role</label>
                <select
                  value={assignReviewerData.role}
                  onChange={(e) => setAssignReviewerData({ ...assignReviewerData, role: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                >
                  <option value="GUIDE">Faculty Guide (Supervision & Comments)</option>
                  <option value="PATENT_EXPERT">Patent Expert (Legal & FTO Evaluation)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="w-1/3 py-2.5 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-blue-900 text-white rounded-xl font-bold"
                >
                  Assign to Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CREATE ANNOUNCEMENT MODAL */}
      {showCreateAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Broadcast Announcement</h3>
              <button onClick={() => setShowCreateAnnModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={newAnnData.title}
                  onChange={(e) => setNewAnnData({ ...newAnnData, title: e.target.value })}
                  placeholder="e.g. System Maintenance or New Policy"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Audience</label>
                <select
                  value={newAnnData.targetRole}
                  onChange={(e) => setNewAnnData({ ...newAnnData, targetRole: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                >
                  <option value="ALL">All Platform Users</option>
                  <option value="INVENTOR">Inventors Only</option>
                  <option value="GUIDE">Faculty Guides Only</option>
                  <option value="PATENT_EXPERT">Patent Experts Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Broadcast Message</label>
                <textarea
                  rows={4}
                  required
                  value={newAnnData.message}
                  onChange={(e) => setNewAnnData({ ...newAnnData, message: e.target.value })}
                  placeholder="Enter detailed broadcast notice..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateAnnModal(false)}
                  className="w-1/3 py-2.5 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-blue-900 text-white rounded-xl font-bold"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. EDIT USER DRAWER / MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Manage User Account</h3>
                <p className="text-[10px] text-slate-400 font-medium">@{selectedUser.username} • {selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p><strong>Name:</strong> {selectedUser.fullName}</p>
                <p><strong>Institution:</strong> {selectedUser.institution}</p>
                <p><strong>Total Projects:</strong> {selectedUser.projectsCount}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Change User Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => handleUpdateUserRole(selectedUser.id, e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                >
                  <option value="Inventor">Inventor</option>
                  <option value="CoInventor">Co-Inventor</option>
                  <option value="Guide">Faculty Guide</option>
                  <option value="PatentExpert">Patent Expert</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between">
                <button
                  onClick={() => handleToggleUserStatus(selectedUser.id, selectedUser.isActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    selectedUser.isActive ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {selectedUser.isActive ? 'Suspend Account' : 'Activate Account'}
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. DELETE USER CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Delete User Account</h3>
                <p className="text-[11px] text-slate-500">This action will permanently delete the record from the database</p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50/60 border border-red-100 rounded-2xl space-y-1.5 text-xs text-red-900">
              <p className="font-bold">Are you sure you want to permanently delete this user?</p>
              <p><strong>Name:</strong> {userToDelete.fullName}</p>
              <p><strong>Username:</strong> @{userToDelete.username}</p>
              <p><strong>Email:</strong> {userToDelete.email}</p>
              <p><strong>Role:</strong> {userToDelete.role}</p>
              <p className="text-[10px] text-red-700 pt-1">
                ⚠️ All associated user data, memberships, and assigned reviews will be permanently removed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingUser ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
