import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FolderKanban,
  Award,
  AlertCircle,
  CheckSquare,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  FileText,
  Users,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  UserCheck,
  Scale,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface InventorDashboardProps {
  user: any;
  onRefresh?: () => void;
}

export const InventorDashboard: React.FC<InventorDashboardProps> = ({ user, onRefresh }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [expandedReadinessProjectId, setExpandedReadinessProjectId] = useState<string | null>(null);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchInventorData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects/analytics/inventor');
      setDashboardData(res.data);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      console.error('Failed to load inventor dashboard data:', e);
      toast.error('Could not sync latest patent command center data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventorData();
  }, []);

  // Task Status Toggle
  const handleToggleTaskStatus = async (projectId: string, taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}/status`, { status: newStatus });
      toast.success(`Task marked as ${newStatus === 'COMPLETED' ? 'Completed' : 'To-Do'}`);
      fetchInventorData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update task status');
    }
  };

  // Respond to Collaboration Invitation
  const handleRespondInvitation = async (invitationId: string, decision: 'ACCEPT' | 'REJECT') => {
    try {
      await api.post(`/collaboration/respond`, {
        invitationId,
        status: decision === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED'
      });
      toast.success(`Invitation ${decision === 'ACCEPT' ? 'accepted' : 'declined'} successfully`);
      fetchInventorData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || `Failed to ${decision.toLowerCase()} invitation`);
    }
  };

  const projects: any[] = dashboardData?.projects || [];
  const kpis = dashboardData?.kpis || {
    myProjects: 0,
    activeProjects: 0,
    filingReadiness: 0,
    pendingActions: 0,
    pendingReviews: 0,
    openTasks: 0
  };

  // Filter projects by search and stage
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !searchTerm.trim() ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.technicalDomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage =
      stageFilter === 'ALL' ||
      (stageFilter === 'IDEA' && p.stage === 'IDEA') ||
      (stageFilter === 'SEARCH' && p.stage === 'LITERATURE_REVIEW') ||
      (stageFilter === 'CLAIMS' && p.stage === 'DOCUMENTATION') ||
      (stageFilter === 'REVIEW' && (p.stage === 'GUIDE_REVIEW' || p.stage === 'PATENT_EXPERT_REVIEW')) ||
      (stageFilter === 'PROTOTYPE' && (p.stage === 'PROTOTYPE' || p.stage === 'FORMS_PREPARATION')) ||
      (stageFilter === 'FILING' && (p.stage === 'FILING_READY' || p.stage === 'FILED'));

    const matchesProjectSelect = selectedProjectId === 'ALL' || p.id === selectedProjectId;

    return matchesSearch && matchesStage && matchesProjectSelect;
  });

  const activeFocusProject =
    selectedProjectId !== 'ALL'
      ? projects.find((p) => p.id === selectedProjectId) || projects[0]
      : projects[0];

  const stageSteps = [
    { num: '01', key: 'IDEA', label: 'Idea', tab: 'overview' },
    { num: '02', key: 'SEARCH', label: 'Search', tab: 'patents' },
    { num: '03', key: 'CLAIMS', label: 'Claims', tab: 'claims' },
    { num: '04', key: 'REVIEW', label: 'Review', tab: 'reviews' },
    { num: '05', key: 'PROTOTYPE', label: 'Prototype', tab: 'prototypes' },
    { num: '06', key: 'FILING', label: 'Filing', tab: 'forms' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans antialiased text-[#253330]">
      {/* ==================================================== */}
      {/* 1. HEADER (SOFT, ENTERPRISE, REAL USER GREETING) */}
      {/* ==================================================== */}
      <div className="bg-white border border-[#E5EBE8] rounded-3xl p-6 sm:p-8 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E4F0EC] text-[#315C55] border border-[#A8C8BD]/50 shadow-3xs">
              Patent Innovation Command Center
            </span>
            {user?.institution && (
              <span className="text-xs text-[#71807C] font-semibold">• {user.institution}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#253330] tracking-tight leading-tight">
            {getGreeting()}, {user?.fullName || user?.username || 'Inventor'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6B67] font-medium leading-relaxed">
            Here's the current status of your patent projects.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={fetchInventorData}
            className="p-3 bg-[#F7FAF9] hover:bg-[#E4F0EC] border border-[#E5EBE8] rounded-2xl text-[#5C6B67] text-xs font-bold transition shadow-3xs cursor-pointer flex items-center gap-1.5"
            title="Refresh Innovation Command Center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#315C55]' : ''}`} />
          </button>

          <Link
            to="/dashboard/claims"
            className="px-4 py-3 bg-[#E4F0EC] hover:bg-[#DDEBE6] text-[#315C55] border border-[#A8C8BD]/40 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-3xs"
          >
            <Sparkles className="w-4 h-4 text-[#315C55]" />
            <span>Claims Studio</span>
          </Link>

          <Link
            to="/dashboard/create-project"
            className="px-5 py-3 bg-[#315C55] hover:bg-[#254640] text-white rounded-2xl text-xs font-extrabold shadow-3xs hover:shadow-2xs transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Patent Project</span>
          </Link>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. TOP 4 REAL DATABASE-DRIVEN KPI CARDS */}
      {/* ==================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inventions */}
        <div className="bg-white border border-[#E5EBE8] rounded-2xl p-5 space-y-2 shadow-3xs">
          <div className="flex items-center justify-between text-[#71807C]">
            <span className="text-[10px] font-black uppercase tracking-wider">My Projects</span>
            <FolderKanban className="w-4 h-4 text-[#315C55]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#253330] font-mono">
            {kpis.myProjects < 10 ? `0${kpis.myProjects}` : kpis.myProjects}
          </div>
          <span className="inline-block text-[10px] font-bold text-[#6F8F88]">
            Owned & collaborated files
          </span>
        </div>

        {/* Active Projects */}
        <div className="bg-white border border-[#E5EBE8] rounded-2xl p-5 space-y-2 shadow-3xs">
          <div className="flex items-center justify-between text-[#71807C]">
            <span className="text-[10px] font-black uppercase tracking-wider">Active Projects</span>
            <Layers className="w-4 h-4 text-[#6F8F88]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#253330] font-mono">
            {kpis.activeProjects < 10 ? `0${kpis.activeProjects}` : kpis.activeProjects}
          </div>
          <span className="inline-block text-[10px] font-bold text-[#6F8F88]">
            In invention pipeline
          </span>
        </div>

        {/* Filing Readiness */}
        <div className="bg-white border border-[#E5EBE8] rounded-2xl p-5 space-y-2 shadow-3xs">
          <div className="flex items-center justify-between text-[#71807C]">
            <span className="text-[10px] font-black uppercase tracking-wider">Filing Readiness</span>
            <Award className="w-4 h-4 text-[#315C55]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#315C55] font-mono">
            {kpis.filingReadiness}%
          </div>
          <span className="inline-block text-[10px] font-bold text-[#315C55] bg-[#E4F0EC] px-2 py-0.5 rounded-md">
            Statutory completeness index
          </span>
        </div>

        {/* Pending Actions */}
        <div className="bg-white border border-[#E5EBE8] rounded-2xl p-5 space-y-2 shadow-3xs">
          <div className="flex items-center justify-between text-[#71807C]">
            <span className="text-[10px] font-black uppercase tracking-wider">Pending Actions</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
            {kpis.pendingActions < 10 ? `0${kpis.pendingActions}` : kpis.pendingActions}
          </div>
          <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
            Tasks, reviews & attention items
          </span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. MAIN DASHBOARD CONTENT OR EMPTY STATE */}
      {/* ==================================================== */}
      {projects.length === 0 ? (
        /* PREMIUM EMPTY STATE */
        <div className="bg-white border border-[#E5EBE8] rounded-3xl p-12 text-center shadow-3xs space-y-6 max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 bg-[#E4F0EC] text-[#315C55] rounded-3xl flex items-center justify-center mx-auto shadow-3xs">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#253330] tracking-tight">
              Start Your First Patent
            </h2>
            <p className="text-xs sm:text-sm text-[#5C6B67] leading-relaxed">
              Turn your invention idea into a structured, filing-ready patent project with AI claim drafting, prior-art risk auditing, and supervisory guidance.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/dashboard/create-project"
              className="px-6 py-3 bg-[#315C55] hover:bg-[#254640] text-white rounded-2xl text-xs font-black shadow-3xs flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Patent Project</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ==================================================== */}
          {/* SEARCH & STAGE FILTER BAR */}
          {/* ==================================================== */}
          <div className="bg-white border border-[#E5EBE8] rounded-2xl p-4 shadow-3xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-[#8A9B96] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search projects by title, domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[#F7FAF9] border border-[#E5EBE8] rounded-xl text-xs text-[#253330] placeholder-[#8A9B96] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#315C55]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap justify-end">
              {/* Project Filter Select */}
              {projects.length > 1 && (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="px-3 py-2 bg-[#F7FAF9] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer focus:bg-white focus:outline-none"
                >
                  <option value="ALL">All Projects ({projects.length})</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title.length > 25 ? `${p.title.substring(0, 25)}...` : p.title}
                    </option>
                  ))}
                </select>
              )}

              {/* Stage Filter */}
              <div className="flex rounded-xl bg-[#F7FAF9] p-1 border border-[#E5EBE8] text-xs font-bold text-[#5C6B67] overflow-x-auto max-w-full">
                {(['ALL', 'IDEA', 'SEARCH', 'CLAIMS', 'REVIEW', 'PROTOTYPE', 'FILING'] as const).map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setStageFilter(stage)}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer text-[11px] whitespace-nowrap ${stageFilter === stage ? 'bg-[#315C55] text-white shadow-3xs' : 'hover:text-[#253330]'
                      }`}
                  >
                    {stage === 'ALL' ? 'All Stages' : stage.charAt(0) + stage.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* TWO COLUMN GRID: PROJECTS LIST (LEFT) & ATTENTION/TASKS (RIGHT) */}
          {/* ==================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* -------------------------------------------------- */}
            {/* LEFT COLUMN: MY PATENT PROJECTS (2 SPANS) */}
            {/* -------------------------------------------------- */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section Title */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#253330] tracking-tight">
                    My Patent Projects
                  </h2>
                  <p className="text-xs text-[#71807C]">
                    Active workspaces, filing readiness & prior-art risk indices
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#6F8F88]">
                  Showing {filteredProjects.length} of {projects.length}
                </span>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="bg-white border border-[#E5EBE8] rounded-3xl p-8 text-center shadow-3xs space-y-2">
                  <p className="text-xs font-bold text-[#5C6B67]">No patent projects match your filter criteria.</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStageFilter('ALL');
                      setSelectedProjectId('ALL');
                    }}
                    className="text-xs font-bold text-[#315C55] hover:underline"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-white border border-[#E5EBE8] hover:border-[#315C55]/60 transition-all rounded-3xl p-6 shadow-3xs space-y-5"
                  >
                    {/* Project Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E4F0EC] text-[#315C55] border border-[#A8C8BD]/40">
                            {proj.category}
                          </span>
                          <span className="text-[11px] font-bold text-[#71807C]">
                            {proj.technicalDomain}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#315C55] bg-[#F7FAF9] border border-[#E5EBE8] px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#315C55] animate-pulse" />
                            {proj.stage?.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-[#253330] tracking-tight">
                          {proj.title}
                        </h3>
                      </div>

                      <button
                        onClick={() => navigate(`/dashboard/projects/${proj.id}`)}
                        className="px-4 py-2 bg-[#315C55] hover:bg-[#254640] text-white rounded-xl text-xs font-bold shadow-3xs flex items-center gap-1.5 shrink-0 transition cursor-pointer self-start"
                      >
                        <span>Open Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 6-Stage Patent Journey Stepper */}
                    <div className="pt-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-[#71807C] mb-2 flex justify-between">
                        <span>Patent Journey Pipeline</span>
                        <span className="text-[#315C55]">Stage {proj.currentStageIndex + 1} of 6</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1 bg-[#F7FAF9] p-1.5 rounded-2xl border border-[#E5EBE8]">
                        {stageSteps.map((step, sIdx) => {
                          const isCompleted = sIdx < proj.currentStageIndex;
                          const isActive = sIdx === proj.currentStageIndex;
                          return (
                            <div
                              key={step.key}
                              onClick={() => navigate(`/dashboard/projects/${proj.id}`)}
                              className={`p-2 rounded-xl text-center transition cursor-pointer ${isActive
                                  ? 'bg-[#315C55] text-white shadow-3xs'
                                  : isCompleted
                                    ? 'bg-[#E4F0EC] text-[#315C55] font-bold'
                                    : 'text-[#8A9B96] hover:bg-white'
                                }`}
                              title={`Jump to ${step.label}`}
                            >
                              <div className="text-[9px] font-mono font-bold leading-none">{step.num}</div>
                              <div className="text-[10px] font-black truncate mt-0.5">{step.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Readiness, Risk & Novelty Indicators */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#F0F4F2]">
                      {/* Filing Readiness */}
                      <div className="p-3 bg-[#F7FAF9] rounded-2xl border border-[#E5EBE8] space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-[#71807C]">
                          <span>Filing Readiness</span>
                          <span className="text-[#315C55] font-mono">{proj.filingReadiness}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#315C55] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(6, proj.filingReadiness)}%` }}
                          />
                        </div>
                        <button
                          onClick={() =>
                            setExpandedReadinessProjectId(
                              expandedReadinessProjectId === proj.id ? null : proj.id
                            )
                          }
                          className="text-[10px] font-bold text-[#315C55] hover:underline block pt-0.5"
                        >
                          {expandedReadinessProjectId === proj.id ? 'Hide Criteria ▴' : 'View Criteria ▾'}
                        </button>
                      </div>

                      {/* Prior Art Risk */}
                      <div className="p-3 bg-[#F7FAF9] rounded-2xl border border-[#E5EBE8] space-y-1">
                        <div className="text-[10px] font-black uppercase text-[#71807C]">
                          Prior-Art Risk
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${proj.priorArtRisk === 'HIGH'
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : proj.priorArtRisk === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                          >
                            {proj.priorArtRisk} RISK
                          </span>
                        </div>
                        <p className="text-[10px] text-[#71807C] truncate">{proj.priorArtNote}</p>
                      </div>

                      {/* Patent Evidence / Novelty */}
                      <div className="p-3 bg-[#F7FAF9] rounded-2xl border border-[#E5EBE8] space-y-1">
                        <div className="text-[10px] font-black uppercase text-[#71807C]">
                          Patent Evidence
                        </div>
                        <div className="text-sm font-black text-[#253330] font-mono">
                          {proj.noveltyScore}%
                        </div>
                        <p className="text-[10px] text-[#315C55] font-bold truncate">
                          {proj.noveltyRating}
                        </p>
                      </div>
                    </div>

                    {/* Expandable 6-Point Filing Readiness Criteria Checklist */}
                    {expandedReadinessProjectId === proj.id && (
                      <div className="p-4 bg-[#E4F0EC]/60 rounded-2xl border border-[#A8C8BD]/50 space-y-2 text-xs animate-fade-in">
                        <div className="font-black text-[#253330] text-[11px] uppercase tracking-wider mb-1">
                          IPO Statutory Compliance Checklist:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(proj.readinessChecklist || [
                            { label: 'Core Innovation Metadata', completed: true },
                            { label: 'Form 2 Specification & Claims', completed: proj.claimsCount > 0 },
                            { label: 'Statutory Forms (1, 3, 5, 26)', completed: proj.stage === 'FILING_READY' },
                            { label: 'Research Documents & Specifications', completed: proj.documentsCount > 0 },
                            { label: 'Prior-Art Search & FTO Analysis', completed: proj.priorArtRisk !== 'HIGH' },
                            { label: 'Supervisor Review Decisions', completed: proj.reviewStatus !== 'Review Pending' },
                          ]).map((crit: any, cIdx: number) => (
                            <div key={cIdx} className="flex items-center gap-2">
                              {crit.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#315C55] shrink-0" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              )}
                              <span
                                className={`text-[11px] ${crit.completed ? 'text-[#253330] font-bold' : 'text-[#71807C]'
                                  }`}
                              >
                                {crit.label || crit.item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer Stats: Tasks, Team & Last Activity */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-[#71807C] border-t border-[#F0F4F2]">
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Tasks Progress */}
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-[#6F8F88]" />
                          <span>
                            Tasks:{' '}
                            <strong className="text-[#253330]">
                              {proj.tasksCompleted}/{proj.tasksTotal}
                            </strong>{' '}
                            ({proj.taskVelocity}%)
                          </span>
                        </div>

                        {/* Claims count */}
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#315C55]" />
                          <span>
                            Claims: <strong className="text-[#253330]">{proj.claimsCount}</strong> (
                            {proj.independentClaimsCount} Indep / {proj.dependentClaimsCount} Dep)
                          </span>
                        </div>

                        {/* Team count */}
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#6F8F88]" />
                          <span>
                            Team: <strong className="text-[#253330]">{proj.collaboratorsCount}</strong> members
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[#8A9B96] text-[10px] font-mono">
                        <Clock className="w-3 h-3" />
                        <span>Updated {new Date(proj.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* -------------------------------------------------- */}
              {/* CLAIMS & DRAWINGS DUAL SUMMARY WIDGETS */}
              {/* -------------------------------------------------- */}
              {activeFocusProject && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Claims Engineering Studio Widget */}
                  <div className="bg-white border border-[#E5EBE8] rounded-3xl p-5 shadow-3xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-[#E4F0EC] text-[#315C55]">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#253330] uppercase tracking-wider">
                            Claims Engineering
                          </h4>
                          <p className="text-[10px] text-[#71807C]">Patent Claims & FTO Matrix</p>
                        </div>
                      </div>
                      <Link
                        to="/dashboard/claims"
                        className="text-xs font-bold text-[#315C55] hover:underline flex items-center gap-0.5"
                      >
                        <span>Studio</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 bg-[#F7FAF9] rounded-xl border border-[#E5EBE8]">
                        <span className="text-[10px] font-black uppercase text-[#71807C] block">Total</span>
                        <span className="text-lg font-black text-[#253330] font-mono">
                          {activeFocusProject.claimsCount}
                        </span>
                      </div>
                      <div className="p-2 bg-[#F7FAF9] rounded-xl border border-[#E5EBE8]">
                        <span className="text-[10px] font-black uppercase text-[#71807C] block">Indep</span>
                        <span className="text-lg font-black text-[#315C55] font-mono">
                          {activeFocusProject.independentClaimsCount}
                        </span>
                      </div>
                      <div className="p-2 bg-[#F7FAF9] rounded-xl border border-[#E5EBE8]">
                        <span className="text-[10px] font-black uppercase text-[#71807C] block">Dep</span>
                        <span className="text-lg font-black text-[#6F8F88] font-mono">
                          {activeFocusProject.dependentClaimsCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[11px]">
                      <span className="text-[#71807C]">FTO Overlap Risk:</span>
                      <span className="font-bold text-[#253330]">{activeFocusProject.priorArtRisk}</span>
                    </div>
                  </div>

                  {/* Drawings & Prototypes Widget */}
                  <div className="bg-white border border-[#E5EBE8] rounded-3xl p-5 shadow-3xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-[#E4F0EC] text-[#315C55]">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#253330] uppercase tracking-wider">
                            Technical Drawings
                          </h4>
                          <p className="text-[10px] text-[#71807C]">2D Figure Sheets & Schematics</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/dashboard/projects/${activeFocusProject.id}`)}
                        className="text-xs font-bold text-[#315C55] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Workspace</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center pt-1">
                      <div className="p-2 bg-[#F7FAF9] rounded-xl border border-[#E5EBE8]">
                        <span className="text-[10px] font-black uppercase text-[#71807C] block">Figures</span>
                        <span className="text-lg font-black text-[#253330] font-mono">
                          {activeFocusProject.drawingsCount}
                        </span>
                      </div>
                      <div className="p-2 bg-[#F7FAF9] rounded-xl border border-[#E5EBE8]">
                        <span className="text-[10px] font-black uppercase text-[#71807C] block">Components</span>
                        <span className="text-lg font-black text-[#315C55] font-mono">
                          {activeFocusProject.annotatedComponentsCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[11px]">
                      <span className="text-[#71807C]">Figure Legend:</span>
                      <span className="font-bold text-[#253330]">
                        {activeFocusProject.annotatedComponentsCount > 0 ? 'Annotated' : 'Pending Tags'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* -------------------------------------------------- */}
            {/* RIGHT COLUMN: NEEDS ATTENTION, TASKS & REVIEWS (1 SPAN) */}
            {/* -------------------------------------------------- */}
            <div className="space-y-6">
              {/* 1. NEEDS YOUR ATTENTION PANEL */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl p-5 shadow-3xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F2]">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                      Needs Your Attention
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    {dashboardData?.needsAttention?.length || 0} Priority
                  </span>
                </div>

                {dashboardData?.needsAttention && dashboardData.needsAttention.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.needsAttention.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-[#F7FAF9] border border-[#E5EBE8] hover:border-[#315C55]/40 transition space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${item.priority === 'HIGH'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                              }`}
                          >
                            {item.priority}
                          </span>
                          <span className="text-[10px] font-bold text-[#71807C] truncate max-w-[120px]">
                            {item.projectTitle}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#253330]">{item.title}</h4>
                          <p className="text-[11px] text-[#5C6B67] mt-0.5 leading-tight">{item.reason}</p>
                        </div>
                        <button
                          onClick={() => navigate(item.link || `/dashboard/projects/${item.projectId}`)}
                          className="text-[11px] font-bold text-[#315C55] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                        >
                          <span>{item.actionText}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-[#71807C] text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="font-bold text-[#253330]">All Caught Up!</p>
                    <p className="text-[11px] mt-0.5">No critical blocking items across your projects.</p>
                  </div>
                )}
              </div>

              {/* 2. MY TASKS WIDGET */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl p-5 shadow-3xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F2]">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#315C55]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                      My Tasks
                    </h3>
                  </div>
                  <Link
                    to="/dashboard/tasks"
                    className="text-xs font-bold text-[#315C55] hover:underline"
                  >
                    View All &gt;
                  </Link>
                </div>

                {dashboardData?.tasks && dashboardData.tasks.length > 0 ? (
                  <div className="space-y-2.5">
                    {dashboardData.tasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-2xl bg-[#F7FAF9] border border-[#E5EBE8] flex items-start justify-between gap-3 hover:bg-[#F0F4F2] transition"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${task.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                              {task.status}
                            </span>
                            <span className="text-[10px] text-[#71807C] truncate">
                              {task.projectTitle}
                            </span>
                          </div>
                          <p
                            className={`text-xs font-bold truncate ${task.status === 'COMPLETED'
                                ? 'line-through text-[#8A9B96]'
                                : 'text-[#253330]'
                              }`}
                          >
                            {task.title}
                          </p>
                          {task.dueDate && (
                            <span className="text-[10px] text-[#8A9B96] font-mono block">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleToggleTaskStatus(task.projectId, task.id, task.status)}
                          className={`p-1.5 rounded-xl border transition cursor-pointer shrink-0 ${task.status === 'COMPLETED'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-[#E5EBE8] text-[#71807C] hover:border-[#315C55]'
                            }`}
                          title={task.status === 'COMPLETED' ? 'Mark as To-Do' : 'Mark as Completed'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#71807C] p-4 text-center">No tasks assigned yet.</p>
                )}
              </div>

              {/* 3. PENDING REVIEWS WIDGET */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl p-5 shadow-3xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F2]">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#6F8F88]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                      Pending Reviews
                    </h3>
                  </div>
                  <Link
                    to="/dashboard/reviews"
                    className="text-xs font-bold text-[#315C55] hover:underline"
                  >
                    All Reviews &gt;
                  </Link>
                </div>

                {dashboardData?.pendingReviews && dashboardData.pendingReviews.length > 0 ? (
                  <div className="space-y-2.5">
                    {dashboardData.pendingReviews.map((rev: any) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-2xl bg-[#F7FAF9] border border-[#E5EBE8] space-y-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-[#315C55] uppercase">
                            {rev.reviewType}
                          </span>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            {rev.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-[#253330] truncate">
                          {rev.projectTitle}
                        </h4>
                        <div className="flex justify-between items-center text-[10px] text-[#71807C]">
                          <span>
                            Reviewer: <strong>{rev.reviewer}</strong> ({rev.role})
                          </span>
                          <button
                            onClick={() => navigate(`/dashboard/projects/${rev.projectId}`)}
                            className="text-[#315C55] font-bold hover:underline cursor-pointer"
                          >
                            Open →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#71807C] p-4 text-center">No pending supervisor reviews.</p>
                )}
              </div>

              {/* 4. COLLABORATION INVITATIONS */}
              {dashboardData?.invitations && dashboardData.invitations.length > 0 && (
                <div className="bg-white border border-[#E5EBE8] rounded-3xl p-5 shadow-3xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F2]">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#315C55]" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                        Collaboration Requests
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {dashboardData.invitations.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="p-3 rounded-2xl bg-[#F7FAF9] border border-[#E5EBE8] space-y-2"
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-[#71807C]">{inv.projectTitle}</span>
                          <span className="font-mono text-[#8A9B96]">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#253330]">
                          {inv.isReceived
                            ? `${inv.senderName} invited you as ${inv.role}`
                            : `Invited ${inv.receiverName} as ${inv.role}`}
                        </p>

                        {inv.isReceived && inv.status === 'PENDING' && (
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => handleRespondInvitation(inv.id, 'REJECT')}
                              className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold cursor-pointer transition"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleRespondInvitation(inv.id, 'ACCEPT')}
                              className="px-2.5 py-1 bg-[#315C55] hover:bg-[#254640] text-white rounded-lg text-[10px] font-bold cursor-pointer transition shadow-3xs"
                            >
                              Accept
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ==================================================== */}
          {/* 4. RECENT ACTIVITY & RECENT DOCUMENTS BOTTOM GRIDS */}
          {/* ==================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity Stream */}
            <div className="bg-white border border-[#E5EBE8] rounded-3xl p-6 shadow-3xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F2]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#315C55]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                    Recent Project Activity
                  </h3>
                </div>
                <span className="text-[10px] text-[#71807C] font-mono">Live PostgreSQL Audit</span>
              </div>

              {dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentActivities.map((act: any) => (
                    <div
                      key={act.id}
                      className="flex items-start justify-between gap-3 text-xs p-2.5 rounded-xl hover:bg-[#F7FAF9] transition"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-[#253330]">
                          <strong className="text-[#315C55]">{act.user}</strong> {act.action}
                        </p>
                        <span className="text-[10px] text-[#71807C] block truncate">
                          Project: {act.project}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A9B96] shrink-0">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#71807C] p-6 text-center">No recent project activity recorded.</p>
              )}
            </div>

            {/* Recent Uploaded Documents */}
            <div className="bg-white border border-[#E5EBE8] rounded-3xl p-6 shadow-3xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F2]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#6F8F88]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                    Recent Documents & Specifications
                  </h3>
                </div>
                <Link
                  to="/dashboard/documents"
                  className="text-xs font-bold text-[#315C55] hover:underline"
                >
                  View All &gt;
                </Link>
              </div>

              {dashboardData?.recentDocuments && dashboardData.recentDocuments.length > 0 ? (
                <div className="space-y-2.5">
                  {dashboardData.recentDocuments.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-2xl bg-[#F7FAF9] border border-[#E5EBE8] flex items-center justify-between gap-3 hover:bg-[#F0F4F2] transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-white rounded-xl border border-[#E5EBE8] text-[#315C55] shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-extrabold text-[#253330] truncate">{doc.name}</h4>
                          <span className="text-[10px] text-[#71807C] block truncate">
                            {doc.projectTitle} • {doc.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/dashboard/projects/${doc.projectId}`)}
                        className="px-3 py-1 bg-white hover:bg-[#E4F0EC] text-[#315C55] border border-[#E5EBE8] rounded-xl text-[11px] font-bold transition shadow-3xs cursor-pointer shrink-0"
                      >
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#71807C] p-6 text-center">No documents uploaded yet.</p>
              )}
            </div>
          </div>

          {/* ==================================================== */}
          {/* 5. QUICK ACTIONS BOTTOM BAR */}
          {/* ==================================================== */}
          <div className="bg-white border border-[#E5EBE8] rounded-3xl p-6 shadow-3xs space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#315C55]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                Quick Innovation Actions
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
              <Link
                to="/dashboard/create-project"
                className="p-3.5 rounded-2xl bg-[#F7FAF9] hover:bg-[#E4F0EC] border border-[#E5EBE8] text-center space-y-1.5 transition group cursor-pointer"
              >
                <Plus className="w-4 h-4 mx-auto text-[#315C55] group-hover:scale-110 transition" />
                <span className="text-[11px] font-bold text-[#253330] block">New Project</span>
              </Link>

              <Link
                to="/dashboard/claims"
                className="p-3.5 rounded-2xl bg-[#F7FAF9] hover:bg-[#E4F0EC] border border-[#E5EBE8] text-center space-y-1.5 transition group cursor-pointer"
              >
                <Sparkles className="w-4 h-4 mx-auto text-[#315C55] group-hover:scale-110 transition" />
                <span className="text-[11px] font-bold text-[#253330] block">Claims Studio</span>
              </Link>

              <Link
                to="/dashboard/prior-art"
                className="p-3.5 rounded-2xl bg-[#F7FAF9] hover:bg-[#E4F0EC] border border-[#E5EBE8] text-center space-y-1.5 transition group cursor-pointer"
              >
                <Search className="w-4 h-4 mx-auto text-[#315C55] group-hover:scale-110 transition" />
                <span className="text-[11px] font-bold text-[#253330] block">Prior-Art Search</span>
              </Link>

              <Link
                to="/dashboard/documents"
                className="p-3.5 rounded-2xl bg-[#F7FAF9] hover:bg-[#E4F0EC] border border-[#E5EBE8] text-center space-y-1.5 transition group cursor-pointer"
              >
                <Upload className="w-4 h-4 mx-auto text-[#315C55] group-hover:scale-110 transition" />
                <span className="text-[11px] font-bold text-[#253330] block">Upload Docs</span>
              </Link>

              <Link
                to="/dashboard/reviews"
                className="p-3.5 rounded-2xl bg-[#F7FAF9] hover:bg-[#E4F0EC] border border-[#E5EBE8] text-center space-y-1.5 transition group cursor-pointer"
              >
                <Scale className="w-4 h-4 mx-auto text-[#315C55] group-hover:scale-110 transition" />
                <span className="text-[11px] font-bold text-[#253330] block">Reviews</span>
              </Link>

              <Link
                to="/dashboard/tasks"
                className="p-3.5 rounded-2xl bg-[#F7FAF9] hover:bg-[#E4F0EC] border border-[#E5EBE8] text-center space-y-1.5 transition group cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 mx-auto text-[#315C55] group-hover:scale-110 transition" />
                <span className="text-[11px] font-bold text-[#253330] block">My Tasks</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
