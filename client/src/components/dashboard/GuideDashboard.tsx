import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileCheck,
  FileText,
  Layers,
  BarChart3,
  RefreshCw,
  Sparkles,
  Search,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { NextActionCard } from '../project/NextActionCard';

interface GuideDashboardProps {
  user: any;
  projects: any[];
  onRefresh?: () => void;
}

export const GuideDashboard: React.FC<GuideDashboardProps> = ({
  user,
  projects: initialProjects,
  onRefresh
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [primaryNextActionData, setPrimaryNextActionData] = useState<any>(null);
  const [loadingNextAction, setLoadingNextAction] = useState<boolean>(false);
  const [queueTab, setQueueTab] = useState<'All' | 'Claims' | 'Documents' | 'Drawings' | 'Projects'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ATTENTION'>('ALL');

  const loadPrimaryNextAction = async () => {
    try {
      setLoadingNextAction(true);
      const res = await api.get('/projects/next-action/primary');
      setPrimaryNextActionData(res.data);
    } catch (e) {
      console.error('Failed to load primary next action', e);
    } finally {
      setLoadingNextAction(false);
    }
  };

  const fetchGuideDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects/analytics/guide');
      setData(res.data);
      loadPrimaryNextAction();
    } catch (err) {
      console.error('Failed to load Guide dashboard', err);
      toast.error('Failed to fetch guide workspace metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuideDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const kpis = data?.kpis || {
    supervisedProjects: 0,
    pendingReviews: 0,
    needsAttention: 0,
    completedReviews: 0
  };

  const projectHealth = data?.projectHealth || {
    total: 0,
    healthy: 0,
    healthyPct: 0,
    attention: 0,
    attentionPct: 0,
    blocked: 0,
    blockedPct: 0
  };

  const journeyDistribution = data?.journeyDistribution || {
    idea: 0,
    search: 0,
    claims: 0,
    review: 0,
    prototype: 0,
    filing: 0
  };

  const projectsNeedingAttention = data?.projectsNeedingAttention || [];

  const supervisedProjectsList = data?.supervisedProjectsList || initialProjects || [];
  const reviewQueue = data?.reviewQueue || [];
  const recentActivities = data?.recentActivities || [];
  const openGuidanceItems = data?.openGuidanceItems || [];
  const myInventors = data?.myInventors || [];

  const filteredReviewQueue = reviewQueue.filter((item: any) => {
    if (queueTab === 'All') return true;
    return item.category === queueTab;
  });

  const filteredSupervisedProjects = supervisedProjectsList.filter((proj: any) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      proj.title?.toLowerCase().includes(query) ||
      proj.domain?.toLowerCase().includes(query) ||
      proj.owner?.fullName?.toLowerCase().includes(query) ||
      proj.owner?.username?.toLowerCase().includes(query);

    if (!matchesSearch) return false;
    if (filterType === 'ATTENTION') {
      return proj.stage === 'GUIDE_REVIEW' || proj.stage === 'CHANGES_REQUESTED' || (proj.filingReadiness || 0) < 70;
    }
    return true;
  });

  if (loading && !data) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto pb-16 animate-pulse font-sans">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs h-28 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-64 bg-slate-200 rounded-lg" />
            <div className="h-4 w-48 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-slate-100 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 h-32 space-y-3">
              <div className="flex justify-between items-center">
                <div className="w-8 h-8 rounded-xl bg-slate-200" />
                <div className="w-8 h-8 rounded-lg bg-slate-200" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-40 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-12 text-center text-slate-400 font-semibold text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading Guide workspace...</span>
        </div>
      </div>
    );
  }

  if (!loading && !data) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-lg mx-auto my-12 space-y-3 font-sans">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Unable to load your Guide workspace.</h3>
        <p className="text-xs text-slate-500">Failed to retrieve supervised projects from the innovation database.</p>
        <button
          onClick={fetchGuideDashboard}
          className="px-4 py-2 bg-[#004d40] hover:bg-[#00382e] text-white rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 animate-fade-in font-sans text-slate-800">
      {/* 1. TOP HEADER & FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            {getGreeting()}, {user?.fullName || user?.username || 'Guide'} <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Supervising {supervisedProjectsList.length} assigned patent innovation projects.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              fetchGuideDashboard();
              if (onRefresh) onRefresh();
            }}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition cursor-pointer"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={() => setFilterType(prev => prev === 'ATTENTION' ? 'ALL' : 'ATTENTION')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              filterType === 'ATTENTION'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {filterType === 'ATTENTION' ? 'Filter: Needs Attention (Active)' : 'Filter: All Projects'}
          </button>
        </div>
      </div>

      {/* 2. TOP 4 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Supervised Projects */}
        <div
          onClick={() => navigate('/dashboard/projects')}
          className="p-5 rounded-2xl bg-[#eff6ff] border border-[#dbeafe]/70 shadow-3xs space-y-2 cursor-pointer hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-white shadow-3xs text-blue-600">
              <FolderKanban className="w-4 h-4" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {kpis.supervisedProjects}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Supervised Projects</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Projects currently assigned to you</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Pending Reviews */}
        <div
          onClick={() => navigate('/dashboard/reviews')}
          className="p-5 rounded-2xl bg-[#ecfdf5] border border-[#d1fae5]/70 shadow-3xs space-y-2 cursor-pointer hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-white shadow-3xs text-teal-600">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {kpis.pendingReviews}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Pending Reviews</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Projects waiting for your feedback</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Needs Attention */}
        <div
          onClick={() => navigate('/dashboard/projects')}
          className="p-5 rounded-2xl bg-[#fff7ed] border border-[#ffedd5]/70 shadow-3xs space-y-2 cursor-pointer hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-white shadow-3xs text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {kpis.needsAttention}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Needs Attention</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Projects with unresolved issues</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Completed Reviews */}
        <div
          onClick={() => navigate('/dashboard/reviews')}
          className="p-5 rounded-2xl bg-[#f0fdf4] border border-[#dcfce7]/70 shadow-3xs space-y-2 cursor-pointer hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-white shadow-3xs text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {kpis.completedReviews}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Completed Reviews</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Reviews completed this month</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* PRIMARY NEXT-ACTION HERO CARD */}
      {primaryNextActionData?.nextAction && (
        <NextActionCard
          projectId={primaryNextActionData.project?.id}
          projectTitle={primaryNextActionData.project?.title}
          nextAction={primaryNextActionData.nextAction.primaryAction}
          secondaryActions={primaryNextActionData.nextAction.secondaryActions}
          progressPercentage={primaryNextActionData.nextAction.progressPercentage}
          loading={loadingNextAction}
          onRetry={loadPrimaryNextAction}
        />
      )}

      {/* 3. MIDDLE SECTION: PROJECTS NEEDING YOUR ATTENTION (LEFT) + REVIEW QUEUE & HEALTH OVERVIEW (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PROJECTS NEEDING ATTENTION & MY SUPERVISED PROJECTS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Projects Needing Your Attention */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Projects Needing Your Attention</h3>
              <Link to="/dashboard/projects" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                View All &gt;
              </Link>
            </div>

            <div className="space-y-3">
              {projectsNeedingAttention.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No reviews need your attention right now.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All supervised projects are progressing normally.</p>
                </div>
              ) : (
                projectsNeedingAttention.map((proj: any, idx: number) => {
                  const isHigh = proj.severity === 'HIGH';
                  return (
                    <div
                      key={proj.id || idx}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isHigh ? 'bg-rose-50/30 border-rose-100' : 'bg-slate-50/60 border-slate-200/70'
                        }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 mt-0.5 ${idx === 0
                              ? 'bg-purple-50 text-purple-600'
                              : idx === 1
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-indigo-50 text-indigo-600'
                            }`}
                        >
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-extrabold text-slate-900 truncate">{proj.title}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                }`}
                            >
                              {proj.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Inventor: <strong className="text-slate-700">{proj.inventor}</strong>
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            Current Stage: <span className="text-slate-600">{proj.stage}</span> • Filing Readiness:{' '}
                            <span className="text-emerald-700 font-bold">{proj.filingReadiness}%</span>
                          </p>
                          <p className="text-[11px] font-bold text-amber-700 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{proj.issueText}</span>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => navigate(`/dashboard/projects/${proj.id}`)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer ${isHigh
                              ? 'bg-[#004d40] hover:bg-[#00382e] text-white'
                              : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-800'
                            }`}
                        >
                          {proj.actionText}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* My Supervised Projects */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">My Supervised Projects</h3>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <Link to="/dashboard/projects" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0">
                  View All &gt;
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {filteredSupervisedProjects.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    {searchQuery ? 'No matching projects found' : 'No projects are currently assigned to you.'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {searchQuery ? 'Try adjusting your search criteria.' : 'Projects assigned to your supervision will appear here.'}
                  </p>
                </div>
              ) : (
                filteredSupervisedProjects.slice(0, 8).map((proj: any, idx: number) => {
                  const currentStageIdx = proj.currentStageIndex !== undefined ? proj.currentStageIndex : 0;
                  const readinessVal = proj.filingReadiness ?? 0;
                  return (
                    <div key={proj.id || idx} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              idx === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            <FolderKanban className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">{proj.title}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {(proj.domain || proj.technicalDomain || proj.category || 'Patent Project')} • Inventor: {proj.owner?.fullName || proj.owner?.username || 'Inventor'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                            {proj.stage?.replace(/_/g, ' ') || 'Guide Review'}
                          </span>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">Filing Readiness</span>
                            <span className="text-xs font-extrabold text-emerald-700">{readinessVal}%</span>
                          </div>
                          <button
                            onClick={() => navigate(`/dashboard/projects/${proj.id}`)}
                            className="px-3.5 py-1.5 bg-[#004d40] hover:bg-[#00382e] text-white rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer"
                          >
                            Open Workspace
                          </button>
                        </div>
                      </div>

                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${readinessVal}%` }}
                        />
                      </div>

                      {/* Real DB Health Audit Badges */}
                      {proj.healthAudit && (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1 text-[9px] font-bold">
                          <span className={`px-2 py-0.5 rounded text-center ${
                            proj.healthAudit.research === 'Complete' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {proj.healthAudit.research === 'Complete' ? '✓ Research' : '○ Research'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-center ${
                            proj.healthAudit.claims === 'Complete' ? 'bg-emerald-50 text-emerald-800' : proj.healthAudit.claims === 'Needs Review' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {proj.healthAudit.claims === 'Complete' ? '✓ Claims' : '⚠ Claims'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-center ${
                            proj.healthAudit.specification === 'Complete' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {proj.healthAudit.specification === 'Complete' ? '✓ Spec' : '○ Spec'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-center ${
                            proj.healthAudit.drawings === 'Complete' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {proj.healthAudit.drawings === 'Complete' ? '✓ Drawings' : '○ Drawings'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-center ${
                            proj.healthAudit.review === 'Action Required' ? 'bg-rose-100 text-rose-800' : proj.healthAudit.review === 'Reviewed' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {proj.healthAudit.review === 'Action Required' ? '⚡ Action Req' : '✓ Review'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-center ${
                            proj.healthAudit.deadline === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {proj.healthAudit.deadline === 'Overdue' ? '🚨 Overdue' : '✓ Deadline'}
                          </span>
                        </div>
                      )}

                      {/* Stage Progression Stepper */}
                      <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-400 pt-1">
                        {['Idea', 'Search', 'Claims', 'Review', 'Prototype', 'Filing'].map((st, sIdx) => {
                          const isPastOrCurrent = sIdx <= currentStageIdx;
                          const isCurrent = sIdx === currentStageIdx;
                          return (
                            <React.Fragment key={st}>
                              <span
                                className={`${
                                  isCurrent
                                    ? 'text-emerald-700 font-black'
                                    : isPastOrCurrent
                                      ? 'text-slate-800 font-bold'
                                      : 'text-slate-300'
                                }`}
                              >
                                {st}
                              </span>
                              {sIdx < 5 && <span className="text-slate-300">→</span>}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REVIEW QUEUE & PROJECT HEALTH OVERVIEW (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Review Queue */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Review Queue</h3>
              <Link to="/dashboard/reviews" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                View All &gt;
              </Link>
            </div>

            <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-2.5">
              {(['All', 'Claims', 'Documents', 'Drawings', 'Projects'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setQueueTab(tab)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${queueTab === tab ? 'bg-emerald-800 text-white shadow-3xs' : 'bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredReviewQueue.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No review queue items</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">There are no pending review tasks in this category.</p>
                </div>
              ) : (
                filteredReviewQueue.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/70 rounded-2xl flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-700 shrink-0 mt-0.5">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          {item.type}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900 truncate">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{item.note}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                      <button
                        onClick={() => {
                          if (item.projectId) navigate(`/dashboard/projects/${item.projectId}?tab=Reviews`);
                          else navigate('/dashboard/reviews');
                        }}
                        className="px-3 py-1 bg-[#004d40] hover:bg-[#00382e] text-white rounded-xl text-[11px] font-bold transition shadow-3xs cursor-pointer"
                      >
                        Review →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Project Health Overview */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Project Health Overview</h3>
              <button
                onClick={() => navigate('/dashboard/projects')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                View Details &gt;
              </button>
            </div>

            <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
              {/* Donut graphic representation */}
              <div className="w-24 h-24 rounded-full border-8 border-emerald-500 flex flex-col items-center justify-center shrink-0 bg-white shadow-3xs">
                <span className="text-lg font-black text-slate-900 font-mono leading-none">{projectHealth.total}</span>
                <span className="text-[9px] font-bold text-slate-400">Projects</span>
              </div>

              <div className="space-y-2 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
                  </span>
                  <span className="font-extrabold text-slate-900 font-mono">
                    {projectHealth.healthy} ({projectHealth.healthyPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Attention
                  </span>
                  <span className="font-extrabold text-slate-900 font-mono">
                    {projectHealth.attention} ({projectHealth.attentionPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Blocked
                  </span>
                  <span className="font-extrabold text-slate-900 font-mono">
                    {projectHealth.blocked} ({projectHealth.blockedPct}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center space-y-0.5">
                <h5 className="text-xs font-black text-emerald-800">Healthy</h5>
                <p className="text-[10px] text-emerald-700 leading-tight">Projects progressing normally.</p>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl text-center space-y-0.5">
                <h5 className="text-xs font-black text-amber-800">Attention</h5>
                <p className="text-[10px] text-amber-700 leading-tight">Projects requiring review/action.</p>
              </div>
              <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl text-center space-y-0.5">
                <h5 className="text-xs font-black text-rose-800">Blocked</h5>
                <p className="text-[10px] text-rose-700 leading-tight">Projects unable to progress.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM 4-CARD METRIC & PROGRESSION ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {/* Filing Readiness Overview */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" /> Filing Readiness Overview
            </h3>
            <Link to="/dashboard/projects" className="text-[10px] font-bold text-emerald-700 hover:underline">
              View All &gt;
            </Link>
          </div>

          <div className="space-y-2.5">
            {(!data?.filingReadinessOverview || data.filingReadinessOverview.length === 0) ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No supervised projects to evaluate.</p>
            ) : (
              data.filingReadinessOverview.map((item: any, idx: number) => {
                const score = item.readiness ?? 0;
                const barColor = score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                const textColor = score >= 70 ? 'text-emerald-700' : score >= 50 ? 'text-amber-700' : 'text-rose-700';
                return (
                  <div key={item.id || idx} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-700 truncate max-w-[140px]" title={item.title}>{item.title}</span>
                      <span className={`${textColor} font-mono`}>{score}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => navigate('/dashboard/projects')}
            className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 transition cursor-pointer"
          >
            Open Filing Readiness →
          </button>
        </div>

        {/* Statutory & Project Deadlines */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" /> Upcoming Deadlines
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Statutory</span>
          </div>

          <div className="space-y-2">
            {(!data?.upcomingDeadlines || data.upcomingDeadlines.length === 0) ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No upcoming deadlines.</p>
            ) : (
              data.upcomingDeadlines.slice(0, 3).map((d: any, idx: number) => {
                const isOverdue = d.status === 'OVERDUE';
                const isApproaching = d.status === 'APPROACHING';
                return (
                  <div key={d.id || idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate max-w-[130px]">{d.projectTitle}</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isOverdue ? 'bg-rose-100 text-rose-800' : isApproaching ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span className="truncate max-w-[120px]">{d.deadlineType?.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-slate-700 font-bold">{new Date(d.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => navigate('/dashboard/projects')}
            className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 transition cursor-pointer"
          >
            Monitor All Deadlines →
          </button>
        </div>

        {/* Patent Journey Monitoring */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">Patent Journey Monitoring</h3>
            <Link to="/dashboard/projects" className="text-[10px] font-bold text-emerald-700 hover:underline">
              View All &gt;
            </Link>
          </div>

          <div className="grid grid-cols-6 gap-1 text-center">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">IDEA</span>
              <span className="text-xs font-black text-slate-900 font-mono">{journeyDistribution.idea}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">SEARCH</span>
              <span className="text-xs font-black text-slate-900 font-mono">{journeyDistribution.search}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">CLAIMS</span>
              <span className="text-xs font-black text-slate-900 font-mono">{journeyDistribution.claims}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">REVIEW</span>
              <span className="text-xs font-black text-slate-900 font-mono">{journeyDistribution.review}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">PROTO</span>
              <span className="text-xs font-black text-slate-900 font-mono">{journeyDistribution.prototype}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">FILING</span>
              <span className="text-xs font-black text-slate-900 font-mono">{journeyDistribution.filing}</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-950 font-medium leading-relaxed">
              <strong>{reviewQueue.filter((i: any) => i.category === 'Claims').length} claim items</strong> currently waiting for review across supervised projects.
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">Recent Activity</h3>
            <Link to="/dashboard/activity" className="text-[10px] font-bold text-emerald-700 hover:underline">
              View All &gt;
            </Link>
          </div>

          <div className="space-y-2.5 text-xs">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No recent activity.</p>
            ) : (
              recentActivities.slice(0, 4).map((act: any, idx: number) => (
                <div key={act.id || idx} className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{act.action}</p>
                    <span className="text-[9px] text-slate-400">{act.projectTitle}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 shrink-0">
                    {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Open Guidance Items & My Inventors */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">Open Guidance Items</h3>
              <Link to="/dashboard/reviews" className="text-[10px] font-bold text-emerald-700 hover:underline">
                View All &gt;
              </Link>
            </div>

            <div className="space-y-2">
              {openGuidanceItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2 text-center">No open guidance items.</p>
              ) : (
                openGuidanceItems.map((g: any, idx: number) => (
                  <div key={g.id || idx} className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold text-indigo-700 uppercase">{g.type}</span>
                      <span className="text-[9px] text-slate-400">{g.time}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-800">{g.project}</p>
                    <p className="text-[10px] text-slate-500 italic">{g.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900">My Inventors</h4>
              <Link to="/dashboard/team" className="text-[10px] font-bold text-emerald-700 hover:underline">
                View All &gt;
              </Link>
            </div>

            <div className="space-y-1.5">
              {myInventors.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2 text-center">No assigned inventors yet.</p>
              ) : (
                myInventors.slice(0, 3).map((inv: any, idx: number) => (
                  <div
                    key={inv.id || idx}
                    onClick={() => navigate('/dashboard/team')}
                    className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[10px] flex items-center justify-center">
                        {inv.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{inv.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                      <span>{inv.projectCount} Projects</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM QUICK ACTIONS BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
        <h3 className="text-xs font-extrabold text-slate-900 tracking-tight mb-3">Quick Actions</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => navigate('/dashboard/projects')}
            className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Eye className="w-4 h-4 text-emerald-700" />
            <span>Review Projects</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/claims')}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-purple-600" />
            <span>Review Claims</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/documents')}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Review Documents</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/projects')}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>View Drawings</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/reviews')}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <span>Give Feedback</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/projects')}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span>View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};
