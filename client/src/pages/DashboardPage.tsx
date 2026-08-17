import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Search,
  CheckCircle2,
  Layers,
  PenTool,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  CheckSquare,
  BookOpen,
  ChevronRight,
  Award,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { CoInventorDashboard } from '../components/dashboard/CoInventorDashboard';

interface Project {
  id: string;
  title: string;
  stage: string;
  category: string;
  technicalDomain: string;
  innovationIdea?: string;
  problemStatement?: string;
  proposedSolution?: string;
  novelFeatures?: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    fullName: string;
    username: string;
    email: string;
  };
  members?: Array<{
    role: string;
    user: {
      id: string;
      fullName: string;
      role?: string;
    };
  }>;
}

const STAGES = [
  { key: 'IDEA', label: 'Idea' },
  { key: 'LITERATURE_REVIEW', label: 'Prior Art' },
  { key: 'PROTOTYPE', label: 'AI Novelty' },
  { key: 'DOCUMENTATION', label: 'Claims Drafting' },
  { key: 'FORMS_PREPARATION', label: 'Drawings' },
  { key: 'GUIDE_REVIEW', label: 'FTO Analysis' },
  { key: 'PATENT_EXPERT_REVIEW', label: 'Review & Approvals' },
  { key: 'FILING_READY', label: 'Filing Ready' },
  { key: 'FILED', label: 'Filed (IPO)' },
];

export const getStageProgress = (stage: string) => {
  const index = STAGES.findIndex((s) => s.key === stage);
  if (index === -1) return 12;
  return Math.round(((index + 1) / STAGES.length) * 100);
};

export const DashboardPage: React.FC = () => {
  const outletCtx = useOutletContext<{ user: any }>() || {};
  const [currentUser, setCurrentUser] = useState<any>(outletCtx.user || null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboardAnalytics, setDashboardAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeProjectIndex, setActiveProjectIndex] = useState<number>(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [projRes, analyticsRes, profileRes] = await Promise.allSettled([
        api.get('/projects'),
        api.get('/projects/analytics/dashboard'),
        api.get('/auth/profile'),
      ]);

      if (projRes.status === 'fulfilled') {
        const fetchedProjects = projRes.value.data.projects || [];
        setProjects(fetchedProjects);
      }
      if (analyticsRes.status === 'fulfilled') {
        setDashboardAnalytics(analyticsRes.value.data);
      }
      if (profileRes.status === 'fulfilled') {
        setCurrentUser(profileRes.value.data.user);
      }
    } catch (err) {
      console.error('Failed to load inventor dashboard data', err);
      toast.error('Failed to load some dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const user = currentUser || outletCtx.user;
  const userRole = user?.role || 'Inventor';
  const isReviewer = userRole === 'Guide' || userRole === 'PatentExpert' || userRole === 'Patent Expert';
  const isCoInventorRole = userRole === 'CoInventor' || userRole === 'CO_INVENTOR' || userRole === 'Co-Inventor';
  const activeProject = projects[activeProjectIndex] || projects[0] || null;

  if (isCoInventorRole) {
    return <CoInventorDashboard user={user} projects={projects} onRefresh={fetchDashboardData} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
      {/* 1. TOP GREETING & COMMAND CENTER HEADER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
              {userRole} Command Center
            </span>
            {user?.institution && (
              <span className="text-xs text-slate-400 font-semibold">• {user.institution}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
            Welcome back, {user?.fullName || 'Inventor'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Manage your invention portfolio, draft statutory claims, execute AI novelty audits, and prepare your application for Indian Patent Office filing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={fetchDashboardData}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 text-xs font-bold transition shadow-3xs cursor-pointer flex items-center gap-1.5"
            title="Refresh Portfolio Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Link
            to="/dashboard/create-project"
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Patent Project</span>
          </Link>
        </div>
      </div>

      {/* 2. TOP 4 PORTFOLIO KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="app-card p-5 space-y-2 shadow-xs border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Inventions</span>
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {dashboardAnalytics?.totalProjects ?? projects.length}
          </div>
          <span className="inline-block text-[10px] font-bold text-slate-500">
            Active patent workspace files
          </span>
        </div>

        <div className="app-card p-5 space-y-2 shadow-xs border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Filing Readiness</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
            {dashboardAnalytics?.averageFilingReadiness ?? (projects.length > 0 ? 74 : 0)}%
          </div>
          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Statutory completeness index
          </span>
        </div>

        <div className="app-card p-5 space-y-2 shadow-xs border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Pending Reviews</span>
            <CheckSquare className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">
            {dashboardAnalytics?.pendingReviewsCount ?? 0}
          </div>
          <span className="inline-block text-[10px] font-bold text-slate-500">
            Supervisor milestone approvals
          </span>
        </div>

        <div className="app-card p-5 space-y-2 shadow-xs border-slate-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Overdue Tasks</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            {dashboardAnalytics?.overdueTasksCount ?? 0}
          </div>
          <span className="inline-block text-[10px] font-bold text-slate-500">
            Filing preparation checklist
          </span>
        </div>
      </div>

      {/* 3. ACTIVE INVENTION COMMAND CENTER (IF PROJECTS EXIST) */}
      {activeProject ? (
        <div className="app-card p-6 sm:p-8 space-y-6 shadow-xs border-slate-200">
          {/* Active Project Switcher & Stage Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                  {activeProject.category}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {activeProject.technicalDomain}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {activeProject.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {projects.length > 1 && (
                <select
                  value={activeProjectIndex}
                  onChange={(e) => setActiveProjectIndex(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-3xs cursor-pointer"
                >
                  {projects.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      Switch: {p.title.slice(0, 30)}...
                    </option>
                  ))}
                </select>
              )}
              <Link
                to={`/dashboard/projects/${activeProject.id}`}
                className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Patent Journey Visual Progress Stepper */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Patent Journey Milestone Line</span>
              </span>
              <span className="text-xs font-mono font-bold text-blue-600">
                {getStageProgress(activeProject.stage)}% Completed • Stage: {activeProject.stage}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {STAGES.map((st, i) => {
                const isCurrent = activeProject.stage === st.key;
                const isPast = STAGES.findIndex((s) => s.key === activeProject.stage) >= i;

                return (
                  <div
                    key={st.key}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                        : isPast
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200/80'
                    }`}
                  >
                    <span className="text-[9px] font-bold block uppercase tracking-wider mb-0.5">
                      Step {i + 1}
                    </span>
                    <span className="text-xs font-black block truncate">{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Summary Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Problem Statement
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-3">
                {activeProject.problemStatement || 'Problem description registered during invention disclosure.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Proposed Solution & Innovations
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-3">
                {activeProject.proposedSolution || activeProject.novelFeatures || 'Novel technical solution and claimed advantages.'}
              </p>
            </div>
          </div>

          {/* 4 Large Quick Action Cards */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Quick Action Studio
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to={`/dashboard/projects/${activeProject.id}?tab=Prior%20Art%20Search`}
                className="p-4 bg-gradient-to-br from-blue-50/50 to-white hover:to-blue-50/80 border border-blue-100 hover:border-blue-300 rounded-2xl transition shadow-3xs group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs group-hover:text-blue-600 transition">
                    🔎 Search Prior Art
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Run semantic novelty search on global patent databases.
                  </p>
                </div>
              </Link>

              <Link
                to={`/dashboard/projects/${activeProject.id}?tab=Claims%20Studio`}
                className="p-4 bg-gradient-to-br from-indigo-50/50 to-white hover:to-indigo-50/80 border border-indigo-100 hover:border-indigo-300 rounded-2xl transition shadow-3xs group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs group-hover:text-indigo-600 transition">
                    ✨ Generate Claims
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Draft hierarchical claims and sync directly with Form 2.
                  </p>
                </div>
              </Link>

              <Link
                to={`/dashboard/projects/${activeProject.id}?tab=Prototype`}
                className="p-4 bg-gradient-to-br from-purple-50/50 to-white hover:to-purple-50/80 border border-purple-100 hover:border-purple-300 rounded-2xl transition shadow-3xs group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs group-hover:text-purple-600 transition">
                    📐 Upload Drawings
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Inspect technical CAD blueprints and figure callouts.
                  </p>
                </div>
              </Link>

              <Link
                to={`/dashboard/projects/${activeProject.id}?tab=FTO%20Analysis`}
                className="p-4 bg-gradient-to-br from-emerald-50/50 to-white hover:to-emerald-50/80 border border-emerald-100 hover:border-emerald-300 rounded-2xl transition shadow-3xs group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs group-hover:text-emerald-600 transition">
                    🛡️ Run FTO Analysis
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Analyze Freedom-to-Operate claim overlap and legal risk.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State when user has 0 projects */
        <div className="app-card p-12 text-center space-y-5 shadow-xs border-slate-200">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-sm">
            <Lightbulb className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Welcome to PatentHub-AI
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Create your first patent project to begin your journey from idea to filing with AI-assisted novelty search and Form 2 claim generation.
            </p>
          </div>
          <Link
            to="/dashboard/create-project"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Create Patent Project</span>
          </Link>
        </div>
      )}

      {/* 4. REVIEWER QUEUE (IF GUIDE OR PATENT EXPERT) */}
      {isReviewer && (
        <div className="app-card p-6 space-y-4 shadow-xs border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                {userRole === 'Guide' ? 'Projects Awaiting Guide Review' : 'Open Claims & FTO Review Queue'}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {dashboardAnalytics?.guideReviewQueue?.length || dashboardAnalytics?.patentExpertQueue?.length || 0} In Queue
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {(dashboardAnalytics?.guideReviewQueue || dashboardAnalytics?.patentExpertQueue || []).length === 0 ? (
              <p className="py-4 text-center text-slate-400 text-xs font-medium">
                No projects currently waiting for your review.
              </p>
            ) : (
              (dashboardAnalytics?.guideReviewQueue || dashboardAnalytics?.patentExpertQueue || []).map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Stage: <strong>{item.stage}</strong> • Category: {item.category}
                    </p>
                  </div>
                  <Link
                    to={`/dashboard/projects/${item.id}`}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs transition"
                  >
                    Open Review Desk →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. MY INVENTIONS PORTFOLIO LIST */}
      <div className="app-card p-6 sm:p-8 space-y-6 shadow-xs border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              My Inventions Portfolio
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              All patent disclosures registered under your account.
            </p>
          </div>
          <Link
            to="/dashboard/projects"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            View All ({projects.length}) →
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            No projects in your portfolio. Click "+ New Patent Project" to create one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.map((proj) => {
              const progress = getStageProgress(proj.stage);
              return (
                <div
                  key={proj.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 p-3 rounded-2xl transition"
                >
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {proj.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {proj.technicalDomain}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {proj.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3 h-3" />
                      Updated: {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 justify-between sm:justify-end">
                    <div className="w-28 text-right">
                      <span className="text-xs font-mono font-bold text-blue-600">{progress}% Complete</span>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      to={`/dashboard/projects/${proj.id}`}
                      className="px-3.5 py-2 bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-700 rounded-xl text-xs font-bold transition shadow-3xs shrink-0 flex items-center gap-1.5"
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

      {/* 6. STATUTORY FILING GUIDE */}
      <div className="app-card p-6 space-y-4 shadow-xs border-slate-200">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>Indian Patent Office (IPO) Statutory Filing Roadmap</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="font-extrabold text-slate-900 block">Form 1: Application</span>
            <p className="text-[11px] text-slate-500 font-medium">
              Statutory grant request with full inventor and applicant declarations.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="font-extrabold text-slate-900 block">Form 2: Complete Spec</span>
            <p className="text-[11px] text-slate-500 font-medium">
              Full specification, claim tree, abstract, and engineering figure callouts.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="font-extrabold text-slate-900 block">Form 3: Undertaking</span>
            <p className="text-[11px] text-slate-500 font-medium">
              Foreign patent filing statements under Section 8 of the Indian Patents Act.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="font-extrabold text-slate-900 block">Form 5: Inventorship</span>
            <p className="text-[11px] text-slate-500 font-medium">
              Official declaration as to inventorship for true and first inventors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
