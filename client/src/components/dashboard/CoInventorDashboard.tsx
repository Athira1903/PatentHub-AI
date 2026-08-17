import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Folder,
  Rocket,
  CheckSquare,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Plus,
  Upload,
  FileText,
  Layers,
  Eye,
  Scale,
  Users,
  Lightbulb,
  Search,
  PenTool,
  Send,
  Info,
  Check,
  ChevronDown,
  Loader2,
  FolderPlus,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface CoInventorDashboardProps {
  user: any;
  projects?: any[];
  onRefresh?: () => void;
}

export const CoInventorDashboard: React.FC<CoInventorDashboardProps> = ({
  user,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Inventor';

  const fetchCoInventorData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects/analytics/coinventor');
      setDashboardData(res.data);
      if (res.data.projects && res.data.projects.length > 0 && selectedProjectId === 'ALL') {
        // Keep ALL as filter default, or select first project for details
      }
    } catch (err: any) {
      console.error('Failed to load co-inventor dashboard data', err);
      toast.error('Failed to load live workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoInventorData();
  }, []);

  const projects = dashboardData?.projects || [];
  const kpis = dashboardData?.kpis || {
    myProjects: 0,
    activeProjects: 0,
    myTasks: 0,
    tasksDueThisWeek: 0,
    pendingReviews: 0,
  };
  const needsAttentionList = dashboardData?.needsAttention || [];
  const teamActivities = dashboardData?.recentActivities || [];
  const recentDocuments = dashboardData?.recentDocuments || [];

  const filteredProjects = selectedProjectId === 'ALL'
    ? projects
    : projects.filter((p: any) => p.id === selectedProjectId);

  const activeProject = selectedProjectId !== 'ALL'
    ? projects.find((p: any) => p.id === selectedProjectId)
    : projects[0] || null;

  const journeyStages = [
    { name: 'Idea', icon: Lightbulb },
    { name: 'Search', icon: Search },
    { name: 'Claims', icon: PenTool },
    { name: 'Review', icon: Users },
    { name: 'Prototype', icon: Layers },
    { name: 'Filing', icon: Send },
  ];

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
        <p className="text-xs font-semibold text-slate-500">Loading Co-Inventor Workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
      {/* 1. TOP GREETING CARD */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50/90 border border-blue-100/80 flex items-center justify-center text-2xl shadow-3xs shrink-0">
            🤝
          </div>
          <div>
            <h1 className="text-2xl sm:text-[26px] font-black text-slate-950 tracking-tight flex items-center gap-2">
              <span>Good morning, {firstName}</span>
              <span>👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              You have <strong className="text-slate-800">{kpis.activeProjects} active {kpis.activeProjects === 1 ? 'project' : 'projects'}</strong> in progress and <strong className="text-slate-800">{kpis.myTasks} {kpis.myTasks === 1 ? 'task' : 'tasks'}</strong> in your workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-9 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-3xs transition focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Projects ({projects.length})</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <Link
            to="/dashboard/create-project"
            className="px-4 py-2.5 bg-[#064E3B] hover:bg-[#043E2F] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Invention</span>
          </Link>
        </div>
      </div>

      {/* 2. 4-COLUMN KPI METRIC CARDS (REAL DATA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Projects */}
        <Link
          to="/dashboard/projects"
          className="p-5 rounded-2xl bg-[#EEF2FF] border border-[#E0E7FF] hover:border-indigo-300 transition-all shadow-3xs group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-100/90 text-indigo-700 flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-950">My Projects</span>
            <div className="text-3xl font-black text-indigo-950 font-sans tracking-tight">
              {String(kpis.myProjects).padStart(2, '0')}
            </div>
            <p className="text-[11px] text-indigo-700/80 font-medium mt-0.5">Projects you're collaborating on →</p>
          </div>
        </Link>

        {/* Card 2: Active Projects */}
        <Link
          to="/dashboard/projects"
          className="p-5 rounded-2xl bg-[#ECFDF5] border border-[#D1FAE5] hover:border-emerald-300 transition-all shadow-3xs group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/90 text-emerald-700 flex items-center justify-center">
              <Rocket className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-950">Active Projects</span>
            <div className="text-3xl font-black text-emerald-950 font-sans tracking-tight">
              {String(kpis.activeProjects).padStart(2, '0')}
            </div>
            <p className="text-[11px] text-emerald-700/80 font-medium mt-0.5">Currently in development →</p>
          </div>
        </Link>

        {/* Card 3: My Tasks */}
        <Link
          to="/dashboard/tasks"
          className="p-5 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] hover:border-amber-300 transition-all shadow-3xs group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-100/90 text-amber-700 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-950">My Tasks</span>
            <div className="text-3xl font-black text-amber-950 font-sans tracking-tight">
              {String(kpis.myTasks).padStart(2, '0')}
            </div>
            <p className="text-[11px] text-amber-800/80 font-medium mt-0.5">
              {kpis.tasksDueThisWeek > 0 ? `${kpis.tasksDueThisWeek} due this week →` : 'All tasks up to date →'}
            </p>
          </div>
        </Link>

        {/* Card 4: Pending Reviews */}
        <Link
          to="/dashboard/projects"
          className="p-5 rounded-2xl bg-[#F0F9FF] border border-[#E0F2FE] hover:border-sky-300 transition-all shadow-3xs group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-sky-100/90 text-sky-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition" />
          </div>
          <div>
            <span className="text-xs font-bold text-sky-950">Pending Reviews</span>
            <div className="text-3xl font-black text-sky-950 font-sans tracking-tight">
              {String(kpis.pendingReviews).padStart(2, '0')}
            </div>
            <p className="text-[11px] text-sky-800/80 font-medium mt-0.5">
              {kpis.pendingReviews > 0 ? 'Awaiting your response →' : 'No pending reviews →'}
            </p>
          </div>
        </Link>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT GRID (8 cols Left / 4 cols Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* A. My Patent Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 tracking-tight">My Patent Projects</h2>
              <Link to="/dashboard/projects" className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">
                View All ({projects.length})
              </Link>
            </div>

            {/* Empty State when no projects exist */}
            {projects.length === 0 ? (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xs text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mx-auto text-2xl shadow-3xs">
                  <FolderPlus className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-black text-slate-900">No projects yet</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    You're not assigned to any patent project yet. Create your first invention or ask a lead inventor to invite you to their workspace.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    to="/dashboard/create-project"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#064E3B] hover:bg-[#043E2F] text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Invention</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project: any) => {
                  const readiness = project.filingReadiness || 0;
                  const stageIndex = project.currentStageIndex !== undefined ? project.currentStageIndex : 0;

                  return (
                    <div
                      key={project.id}
                      className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all space-y-5"
                    >
                      {/* Project Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 font-black text-sm shadow-3xs">
                            {getInitials(project.title)}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                className="text-sm sm:text-base font-black text-slate-950 hover:text-blue-600 transition cursor-pointer"
                                onClick={() => navigate(`/projects/${project.id}`)}
                              >
                                {project.title}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                project.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {project.status || 'ACTIVE'}
                              </span>
                              {project.category && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                  {project.category}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium line-clamp-1">
                              {project.summary || 'Patent drafting workspace & statutory compliance docket.'}
                            </p>

                            {/* Collaborator Avatars (REAL) */}
                            <div className="flex items-center gap-2 pt-1">
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {project.owner && (
                                  <span
                                    title={`Owner: ${project.owner.fullName}`}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold ring-2 ring-white"
                                  >
                                    {getInitials(project.owner.fullName)}
                                  </span>
                                )}
                                {project.members && project.members.slice(0, 3).map((m: any) => (
                                  <span
                                    key={m.id || m.userId}
                                    title={`${m.role}: ${m.user?.fullName || m.user?.username}`}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold ring-2 ring-white"
                                  >
                                    {getInitials(m.user?.fullName || m.user?.username)}
                                  </span>
                                ))}
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {project.collaboratorCount > 1
                                  ? `Team of ${project.collaboratorCount} collaborators`
                                  : 'Individual project'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="text-slate-400 hover:text-slate-800 p-1 cursor-pointer"
                          title="Open Project Command Center"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Patent Journey Stepper Line & Filing Readiness */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* 6-Stage Progress Line */}
                        <div className="flex-1 max-w-md">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Patent Journey</span>
                          <div className="relative flex items-center justify-between">
                            {/* Background Connector Bar */}
                            <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
                            <div
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
                              style={{ width: `${(stageIndex / (journeyStages.length - 1)) * 100}%` }}
                            />

                            {journeyStages.map((stage, sIdx) => {
                              const isPast = sIdx < stageIndex;
                              const isCurrent = sIdx === stageIndex;

                              return (
                                <div key={stage.name} className="relative z-10 flex flex-col items-center group">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                      isPast
                                        ? 'bg-emerald-500 text-white shadow-3xs'
                                        : isCurrent
                                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110 shadow-xs'
                                        : 'bg-white border-2 border-slate-300 text-slate-400'
                                    }`}
                                  >
                                    {isPast ? <Check className="w-3 h-3 stroke-[3]" /> : (isCurrent ? '•' : '')}
                                  </div>
                                  <span className={`text-[10px] mt-1.5 transition ${
                                    isCurrent ? 'font-bold text-slate-900' : 'font-medium text-slate-400'
                                  }`}>
                                    {stage.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Filing Readiness & Open Workspace */}
                        <div className="flex items-center gap-4 shrink-0 pl-2 md:border-l md:border-slate-100">
                          <div className="space-y-1 text-right">
                            <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-700">
                              <span className="text-[10px] text-slate-400 uppercase">Filing Readiness</span>
                              <span className="font-extrabold text-slate-900">{readiness}%</span>
                            </div>
                            <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${readiness}%` }} />
                            </div>
                          </div>

                          <button
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="px-4 py-2.5 bg-[#064E3B] hover:bg-[#043E2F] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <span>Open Workspace</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. Bottom Split Row: Patent Development Journey & Your Patent Team (REAL ACTIVE PROJECT DATA) */}
          {activeProject && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sub-Card 1: Patent Development Journey */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <Rocket className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-900">Patent Development Journey</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">
                    {activeProject.title}
                  </span>
                </div>

                {/* 6 Icons Flow */}
                <div className="grid grid-cols-6 gap-1 text-center py-1">
                  {journeyStages.map((stg, i) => {
                    const currentIdx = activeProject.currentStageIndex !== undefined ? activeProject.currentStageIndex : 0;
                    const Icon = stg.icon;
                    const isPast = i < currentIdx;
                    const isCurrent = i === currentIdx;

                    return (
                      <div key={stg.name} className="flex flex-col items-center space-y-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                          isPast
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : isCurrent
                            ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-100'
                            : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[9px] ${isCurrent ? 'font-black text-blue-600' : 'font-semibold text-slate-500'}`}>
                          {stg.name}
                        </span>
                        {isCurrent && (
                          <span className="px-1 py-0.2 bg-blue-100 text-blue-700 text-[8px] font-extrabold rounded">Current</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-150 rounded-2xl flex items-start gap-2.5 text-[11px] text-blue-900 leading-relaxed">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    Currently active at <strong>{activeProject.stage}</strong> stage ({journeyStages[activeProject.currentStageIndex]?.name || 'Development'}). Review specifications and claims to progress toward IPO filing.
                  </p>
                </div>
              </div>

              {/* Sub-Card 2: Your Patent Team (REAL TEAM MEMBERS) */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <Users className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-900">Your Patent Team</h3>
                  </div>
                  <Link to={`/projects/${activeProject.id}`} className="text-[11px] font-bold text-blue-600 hover:underline">
                    Manage Team
                  </Link>
                </div>

                {/* Team Avatars Row */}
                <div className="grid grid-cols-4 gap-2 text-center py-1">
                  {/* Lead Inventor */}
                  {activeProject.owner && (
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-3xs">
                        {getInitials(activeProject.owner.fullName)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 leading-tight truncate max-w-[70px]">
                        {activeProject.owner.fullName.split(' ')[0]}
                      </span>
                      <span className="text-[9px] text-blue-600 font-bold">Owner</span>
                    </div>
                  )}

                  {/* Co-Inventors & Collaborators */}
                  {activeProject.members && activeProject.members.slice(0, 3).map((m: any) => (
                    <div key={m.id || m.userId} className="flex flex-col items-center space-y-1">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-3xs">
                        {getInitials(m.user?.fullName || m.user?.username)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 leading-tight truncate max-w-[70px]">
                        {(m.user?.fullName || m.user?.username || 'Member').split(' ')[0]}
                      </span>
                      <span className="text-[9px] text-emerald-700 font-bold truncate max-w-[70px]">{m.role}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 text-[11px] text-slate-600">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <p className="leading-tight">
                    {activeProject.collaboratorCount} active members collaborating on this patent application.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* C. Quick Actions Bottom Bar (CONNECTED DIRECTLY TO ACTIVE PROJECT WORKSPACE TABS) */}
          {activeProject && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>Quick Actions • {activeProject.title}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => navigate(`/projects/${activeProject.id}?tab=Claims%20Studio`)}
                  className="px-4 py-2.5 bg-[#064E3B] hover:bg-[#043E2F] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Contribution</span>
                </button>

                <button
                  onClick={() => navigate(`/projects/${activeProject.id}?tab=Documents`)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-3xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload Document</span>
                </button>

                <button
                  onClick={() => navigate(`/projects/${activeProject.id}?tab=Claims%20Studio`)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-3xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open Claims</span>
                </button>

                <button
                  onClick={() => navigate(`/projects/${activeProject.id}?tab=Drawings`)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-3xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Drawings</span>
                </button>

                <button
                  onClick={() => navigate(`/projects/${activeProject.id}`)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-3xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Project</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* A. Needs Your Attention Card (REAL DB DATA) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🔔</span>
                  <span>Needs Your Attention</span>
                </span>
              </div>
              <Link to="/dashboard/tasks" className="text-[11px] font-bold text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            {needsAttentionList.length === 0 ? (
              <div className="p-4 text-center space-y-1 bg-slate-50 rounded-2xl">
                <Sparkles className="w-5 h-5 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">All caught up!</p>
                <p className="text-[10px] text-slate-400">No urgent reviews or tasks require your attention.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {needsAttentionList.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50/70 border border-slate-150 rounded-2xl space-y-2.5 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          {item.type.includes('CLAIM') ? (
                            <Scale className="w-3.5 h-3.5" />
                          ) : item.type.includes('DOC') ? (
                            <FileText className="w-3.5 h-3.5" />
                          ) : (
                            <CheckSquare className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                          {item.type}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${item.tagBg}`}>
                        {item.tag}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 leading-snug">{item.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{item.project}</p>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => {
                          if (item.projectId) {
                            navigate(`/projects/${item.projectId}?tab=${item.tabTarget || 'Overview'}`);
                          } else {
                            navigate('/dashboard/projects');
                          }
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-[#064E3B] hover:bg-[#043E2F] text-white transition shadow-3xs cursor-pointer"
                      >
                        {item.actionText}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* B. Recent Team Activity (REAL ACTIVITY LOGS) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>👥</span>
                  <span>Recent Team Activity</span>
                </span>
              </div>
              <Link to="/dashboard/notifications" className="text-[11px] font-bold text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            {teamActivities.length === 0 ? (
              <div className="p-4 text-center space-y-1 bg-slate-50 rounded-2xl">
                <Clock className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No activity yet</p>
                <p className="text-[10px] text-slate-400">Team contributions will appear here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-3.5 relative pl-2">
                <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-200" />
                {teamActivities.map((act: any) => (
                  <div key={act.id} className="relative pl-6 space-y-0.5 text-xs">
                    <div className="absolute left-2.5 top-1.5 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <p className="font-bold text-slate-900 leading-tight">
                      <span>{act.isCurrentUser ? 'You' : act.actor} </span>
                      <span className="font-normal text-slate-600">{act.action}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                      <span>{formatRelativeTime(act.time)}</span>
                      {act.projectTitle && <span>• {act.projectTitle}</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* C. Recent Documents (REAL POSTGRESQL DOCUMENTS) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📄</span>
                  <span>Recent Documents</span>
                </span>
              </div>
              <Link to="/dashboard/projects" className="text-[11px] font-bold text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            {recentDocuments.length === 0 ? (
              <div className="p-4 text-center space-y-1 bg-slate-50 rounded-2xl">
                <FileText className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No documents yet</p>
                <p className="text-[10px] text-slate-400">Uploaded patent drafts and forms will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentDocuments.map((doc: any) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      if (doc.projectId) {
                        navigate(`/projects/${doc.projectId}?tab=Documents`);
                      } else {
                        navigate('/dashboard/projects');
                      }
                    }}
                    className="p-3 bg-slate-50/70 hover:bg-slate-100/70 border border-slate-150 rounded-2xl flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate block">{doc.title}</span>
                        {doc.projectTitle && (
                          <span className="text-[10px] text-slate-400 truncate block">{doc.projectTitle}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                      {formatRelativeTime(doc.updated)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
