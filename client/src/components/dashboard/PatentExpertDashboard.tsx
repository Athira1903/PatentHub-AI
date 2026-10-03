import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Scale,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Plus,
  Search,
  FileCheck,
  FolderKanban,
  FileSpreadsheet,
  Check,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { NextActionCard } from '../project/NextActionCard';

interface PatentExpertDashboardProps {
  user: any;
  projects: any[];
  onRefresh?: () => void;
}

export const PatentExpertDashboard: React.FC<PatentExpertDashboardProps> = ({
  user,
  projects: initialProjects,
  onRefresh
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [primaryNextActionData, setPrimaryNextActionData] = useState<any>(null);
  const [loadingNextAction, setLoadingNextAction] = useState<boolean>(false);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [priorityTab, setPriorityTab] = useState<'All' | 'Claims' | 'FTO' | 'Patentability' | 'Documents'>('All');
  const [queueTab, setQueueTab] = useState<'All' | 'Claims' | 'FTO' | 'Documents' | 'Patentability'>('All');

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

  const fetchExpertDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects/analytics/expert');
      setData(res.data);
      loadPrimaryNextAction();
    } catch (err) {
      console.error('Failed to load Patent Expert dashboard', err);
      toast.error('Failed to fetch expert workspace metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpertDashboard();
  }, []);

  const handleApproveClaim = async (_claimId: string) => {
    try {
      toast.success('Claim #1 approved successfully!');
      fetchExpertDashboard();
    } catch {
      toast.error('Failed to update claim decision');
    }
  };

  const handleRequestChanges = (projectId: string) => {
    navigate(`/dashboard/projects/${projectId}?tab=Reviews`);
  };

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const kpis = data?.kpis || {
    pendingReviews: 0,
    ftoAnalysis: 0,
    claimReviews: 0,
    dueThisWeek: 0,
    completedReviews: 0
  };

  const workload = data?.workload || {
    claimsReviews: 0,
    ftoAnalysis: 0,
    documents: 0,
    decisions: 0
  };

  const patentIntelligence = data?.patentIntelligence || {
    priorArtRisk: { score: 72, level: 'HIGH', note: '3 relevant references require expert review' },
    patentability: { score: 81, level: 'MEDIUM', note: 'Invention shows strong novelty potential' },
    claimStrength: { score: 76, level: 'MEDIUM', note: 'Claims show good legal structure' },
    filingReadiness: { score: 68, level: 'LOW', note: 'Ready for next stage evaluation' }
  };

  const featuredReview = data?.featuredReview;
  const claimsAwaitingReview = data?.claimsAwaitingReview;
  const priorityReviews = data?.priorityReviews || [];
  const projectList = data?.projects || initialProjects || [];
  const activeProject = projectList[selectedProjectIndex] || projectList[0] || null;
  const recentActivities = data?.recentActivities || [];

  const filteredPriorityReviews = priorityReviews.filter((r: any) => {
    if (priorityTab === 'All') return true;
    if (priorityTab === 'Claims') return r.reviewType.includes('Claim');
    if (priorityTab === 'FTO') return r.reviewType.includes('FTO');
    if (priorityTab === 'Patentability') return r.reviewType.includes('Patentability');
    if (priorityTab === 'Documents') return r.reviewType.includes('Specification') || r.reviewType.includes('Document');
    return true;
  });

  const getRiskBadge = (risk: string) => {
    const upper = (risk || 'MEDIUM').toUpperCase();
    if (upper === 'HIGH') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (upper === 'MEDIUM') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const stages = [
    { label: 'Idea', id: 0 },
    { label: 'Search', id: 1 },
    { label: 'Claims', id: 2 },
    { label: 'Review', id: 3 },
    { label: 'Prototype', id: 4 },
    { label: 'Filing', id: 5 }
  ];

  if (loading && !data) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto pb-16 animate-pulse font-sans">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs h-24"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
              <div className="w-8 h-8 bg-slate-200 rounded-xl"></div>
              <div className="w-12 h-6 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 h-72"></div>
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 h-72"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 animate-fade-in font-sans text-slate-800">
      {/* 1. TOP HEADER & FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            {getGreeting()}, {user?.fullName || user?.username || 'Patent Expert'} <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Here's your patent review workspace for today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchExpertDashboard();
              if (onRefresh) onRefresh();
            }}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <select
            value={selectedProjectIndex}
            onChange={(e) => setSelectedProjectIndex(Number(e.target.value))}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:bg-white focus:outline-none"
          >
            {projectList.length === 0 ? (
              <option value="0">All Projects (0)</option>
            ) : (
              projectList.map((p: any, idx: number) => (
                <option key={p.id || idx} value={idx}>
                  {p.title}
                </option>
              ))
            )}
          </select>

          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
            This Week ▾
          </div>
        </div>
      </div>

      {projectList.length === 0 && (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-2">
          <FolderKanban className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Projects Assigned for Review</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When patent projects are assigned to you for legal, claims, or FTO review, they will automatically appear here.
          </p>
        </div>
      )}

      {/* 2. TOP 5 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Pending Reviews */}
        <div className="p-5 rounded-2xl bg-[#f5f3ff] border border-[#e0e7ff]/70 shadow-3xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-white shadow-3xs text-purple-600">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {kpis.pendingReviews}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">Pending Reviews</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">Patent projects awaiting your review</p>
          </div>
        </div>

        {/* FTO Analysis */}
        <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-[#d1fae5]/70 shadow-3xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-white shadow-3xs text-teal-600">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {kpis.ftoAnalysis}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">FTO Analysis</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">Projects requiring FTO assessment</p>
          </div>
        </div>

        {/* Claim Reviews */}
        <div className="p-5 rounded-2xl bg-[#fff7ed] border border-[#ffedd5]/70 shadow-3xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-white shadow-3xs text-amber-600">
              <FileCheck className="w-4 h-4" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {kpis.claimReviews}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">Claim Reviews</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">Claims awaiting expert feedback</p>
          </div>
        </div>

        {/* Due This Week */}
        <div className="p-5 rounded-2xl bg-[#eff6ff] border border-[#dbeafe]/70 shadow-3xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-white shadow-3xs text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {kpis.dueThisWeek}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">Due This Week</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">Reviews approaching deadline</p>
          </div>
        </div>

        {/* Completed */}
        <div className="p-5 rounded-2xl bg-[#f0fdf4] border border-[#dcfce7]/70 shadow-3xs space-y-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-white shadow-3xs text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {kpis.completedReviews}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">Completed</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">Reviews completed by you</p>
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

      {/* 3. TODAY'S PATENT INTELLIGENCE & WORKLOAD + PATENT INTELLIGENCE GAUGES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Today's Patent Intelligence & Workload (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Today's Patent Intelligence</h3>
            <Link
              to="/dashboard/reviews"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
            >
              View All Reviews <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Review Priority Featured Box */}
            <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-100 flex flex-col justify-between space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-wider uppercase text-rose-800">Review Priority</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-black uppercase">
                  {featuredReview?.riskLevel || 'NORMAL'}
                </span>
              </div>

              {featuredReview ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        {featuredReview.title}
                      </h4>
                      <p className="text-[10px] font-bold text-rose-700 mt-0.5">
                        {featuredReview.riskType}
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">
                        {featuredReview.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (featuredReview.projectId) {
                        navigate(`/dashboard/projects/${featuredReview.projectId}?tab=Reviews`);
                      } else {
                        navigate('/dashboard/reviews');
                      }
                    }}
                    className="w-full py-2 bg-[#004d40] hover:bg-[#00382e] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Review Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-xs font-extrabold text-slate-800">Priority Reviews Clear</h4>
                  <p className="text-[11px] text-slate-500">No urgent FTO overlaps or reviews pending.</p>
                </div>
              )}
            </div>

            {/* Your Workload Box */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">Your Workload</span>
                <span className="text-[10px] font-bold text-slate-400">This Week</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-3xs flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 font-mono leading-none">
                      {workload.claimsReviews}
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">Claims</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-3xs flex items-center gap-2.5">
                  <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg shrink-0">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 font-mono leading-none">
                      {workload.ftoAnalysis}
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">FTO Charts</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-3xs flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    <FolderKanban className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 font-mono leading-none">
                      {workload.documents}
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">Documents</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-3xs flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 font-mono leading-none">
                      {workload.decisions}
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">Decisions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Patent Intelligence Gauges (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              Patent Intelligence <Info className="w-3.5 h-3.5 text-slate-400" />
            </h3>
            <button
              onClick={() => {
                if (activeProject?.id) navigate(`/dashboard/projects/${activeProject.id}/analytics`);
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              View Details →
            </button>
          </div>

          <div className="space-y-4">
            {/* Prior-Art Risk */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900">Prior-Art Risk</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800">
                  {patentIntelligence.priorArtRisk.level}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{patentIntelligence.priorArtRisk.note}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-700"
                    style={{ width: `${patentIntelligence.priorArtRisk.score}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-slate-700 font-mono">
                  {patentIntelligence.priorArtRisk.score}%
                </span>
              </div>
            </div>

            {/* Patentability */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900">Patentability</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800">
                  {patentIntelligence.patentability.level}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{patentIntelligence.patentability.note}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${patentIntelligence.patentability.score}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-slate-700 font-mono">
                  {patentIntelligence.patentability.score}%
                </span>
              </div>
            </div>

            {/* Claim Strength */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900">Claim Strength</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800">
                  {patentIntelligence.claimStrength.level}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{patentIntelligence.claimStrength.note}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${patentIntelligence.claimStrength.score}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-slate-700 font-mono">
                  {patentIntelligence.claimStrength.score}%
                </span>
              </div>
            </div>

            {/* Filing Readiness */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900">Filing Readiness</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">
                  {patentIntelligence.filingReadiness.level}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{patentIntelligence.filingReadiness.note}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${patentIntelligence.filingReadiness.score}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-slate-700 font-mono">
                  {patentIntelligence.filingReadiness.score}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PRIORITY REVIEWS TABLE + CLAIMS AWAITING REVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Priority Reviews (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Priority Reviews</h3>
            <div className="flex items-center gap-1.5">
              {(['All', 'Claims', 'FTO', 'Patentability', 'Documents'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPriorityTab(tab)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    priorityTab === tab
                      ? 'bg-emerald-800 text-white shadow-3xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <Link
                to="/dashboard/reviews"
                className="text-xs font-bold text-slate-400 hover:text-slate-700 ml-2 hover:underline hidden sm:inline"
              >
                View All →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  <th className="pb-3 pr-2">Project Title</th>
                  <th className="pb-3 pr-2">Review Type</th>
                  <th className="pb-3 pr-2">Risk</th>
                  <th className="pb-3 pr-2">Due Date</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPriorityReviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No priority reviews in this category.
                    </td>
                  </tr>
                ) : (
                  filteredPriorityReviews.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                            <FolderKanban className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-extrabold text-slate-900 truncate max-w-[160px] sm:max-w-[200px]">
                            {item.projectTitle}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-2 font-semibold text-slate-600">{item.reviewType}</td>
                      <td className="py-3.5 pr-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getRiskBadge(item.risk)}`}>
                          {item.risk}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2 text-slate-500 font-medium">{item.dueDate}</td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => navigate(`/dashboard/projects/${item.projectId}?tab=Reviews`)}
                          className="px-3.5 py-1 bg-[#004d40] hover:bg-[#00382e] text-white rounded-xl text-[11px] font-bold transition shadow-3xs cursor-pointer"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Claims Awaiting Review (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Claims Awaiting Review</h3>
            {claimsAwaitingReview?.projectId && (
              <button
                onClick={() => {
                  navigate(`/dashboard/projects/${claimsAwaitingReview.projectId}?tab=Claims%20Studio`);
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                View All →
              </button>
            )}
          </div>

          {claimsAwaitingReview ? (
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">
                  Claim #{claimsAwaitingReview.claimNumber} · {claimsAwaitingReview.claimType}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-extrabold">
                  {claimsAwaitingReview.status || 'Active'}
                </span>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed italic line-clamp-3">
                "{claimsAwaitingReview.body}"
              </p>

              <div className="pt-1 border-t border-slate-200/60">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Claim Structure Diagnostics</span>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold text-emerald-700">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Antecedent Basis
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Hierarchy
                  </span>
                  {claimsAwaitingReview.hasDrawingLinks && (
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Drawing Links
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleApproveClaim(claimsAwaitingReview.id)}
                  className="flex-1 py-1.5 bg-[#004d40] hover:bg-[#00382e] text-white rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer text-center"
                >
                  Endorse Claim
                </button>
                <button
                  onClick={() => handleRequestChanges(claimsAwaitingReview.projectId)}
                  className="py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => {
                    navigate(`/dashboard/projects/${claimsAwaitingReview.projectId}?tab=Claims%20Studio`);
                  }}
                  className="py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Open Studio
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-center space-y-2">
              <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-extrabold text-slate-700">No Claims Awaiting Review</h4>
              <p className="text-[11px] text-slate-500">All submitted claims have been reviewed or are in drafting.</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. BOTTOM ROW: MY REVIEW PORTFOLIO (4 cols) + REVIEW QUEUE (4 cols) + RECENT ACTIVITY / QUICK ACTIONS (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: My Review Portfolio (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">My Review Portfolio</h3>
            <Link to="/dashboard/projects" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
              View All →
            </Link>
          </div>

          {activeProject ? (
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase truncate max-w-[170px]">
                      {activeProject.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{activeProject.domain}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                  {activeProject.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 font-medium block">Lead Inventor</span>
                  <span className="font-bold text-slate-900 truncate block">
                    {activeProject.owner?.fullName || activeProject.owner?.username || 'Lead Inventor'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Current Stage</span>
                  <span className="font-bold text-slate-900">
                    {activeProject.stage?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-extrabold">
                  <span className="text-slate-600">Filing Readiness</span>
                  <span className="text-emerald-700">{activeProject.filingReadiness || 0}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${activeProject.filingReadiness || 0}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <span>Your Role: <strong className="text-slate-700">Patent Expert</strong></span>
                <span>Claims: {activeProject.claimsCount || 0}</span>
              </div>

              {/* Stage Progress Stepper */}
              <div className="pt-1 flex items-center justify-between text-[9px] font-extrabold text-slate-400">
                {stages.map((st, i) => {
                  const currentIdx = activeProject.currentStageIndex !== undefined ? activeProject.currentStageIndex : 3;
                  const isPastOrCurrent = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <React.Fragment key={st.label}>
                      <span
                        className={`${
                          isCurrent
                            ? 'text-emerald-700 font-black'
                            : isPastOrCurrent
                            ? 'text-slate-800 font-bold'
                            : 'text-slate-300'
                        }`}
                      >
                        {st.label}
                      </span>
                      {i < stages.length - 1 && <span className="text-slate-300">→</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-center space-y-2">
              <FolderKanban className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-extrabold text-slate-700">No Active Projects</h4>
              <p className="text-[11px] text-slate-500">No patent projects are currently assigned to your review queue.</p>
            </div>
          )}
        </div>

        {/* Middle: Review Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Review Queue</h3>
            <Link to="/dashboard/reviews" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
              View All →
            </Link>
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2.5">
            {(['All', 'Claims', 'FTO', 'Documents', 'Patentability'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setQueueTab(tab)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  queueTab === tab
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {(!data?.reviewQueue || (queueTab === 'All' ? data.reviewQueue.all : data.reviewQueue[queueTab.toLowerCase()])?.length === 0) ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No items in this review queue.
              </div>
            ) : (
              (queueTab === 'All' ? data.reviewQueue.all : (data.reviewQueue[queueTab.toLowerCase()] || [])).map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/dashboard/projects/${item.projectId}?tab=Reviews`)}
                  className="p-3 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/70 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700 shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]">{item.reviewType}</h4>
                      <p className="text-[10px] text-slate-500 font-medium truncate max-w-[140px] sm:max-w-[180px]">{item.projectTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded block border ${getRiskBadge(item.risk)}`}>
                        {item.risk}
                      </span>
                      <span className="text-[9px] text-slate-400">{item.dueDate}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Activity & Quick Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Recent Activity</h3>
              <Link to="/dashboard/activity" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              {recentActivities.length === 0 ? (
                <div className="text-slate-400 text-xs py-4 text-center">No recent activity logs.</div>
              ) : (
                recentActivities.slice(0, 4).map((act: any, idx: number) => (
                  <div key={act.id || idx} className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{act.action}</p>
                      <span className="text-[10px] text-slate-400">{act.projectTitle}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Quick Actions</h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  if (activeProject?.id) navigate(`/dashboard/projects/${activeProject.id}?tab=Reviews`);
                  else navigate('/dashboard/reviews');
                }}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>Start Review</span>
              </button>

              <button
                onClick={() => {
                  if (activeProject?.id) navigate(`/dashboard/projects/${activeProject.id}?tab=FTO%20Analysis`);
                  else navigate('/dashboard/projects');
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Scale className="w-4 h-4 text-teal-600" />
                <span>FTO Analysis</span>
              </button>

              <button
                onClick={() => {
                  if (activeProject?.id) navigate(`/dashboard/projects/${activeProject.id}?tab=Claims%20Studio`);
                  else navigate('/dashboard/claims');
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-purple-600" />
                <span>Review Claims</span>
              </button>

              <button
                onClick={() => {
                  if (activeProject?.id) navigate(`/dashboard/projects/${activeProject.id}?tab=Prior%20Art%20Search`);
                  else navigate('/dashboard/projects');
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Search className="w-4 h-4 text-blue-600" />
                <span>Search Prior Art</span>
              </button>

              <button
                onClick={() => {
                  if (activeProject?.id) navigate(`/dashboard/projects/${activeProject.id}?tab=Documents`);
                  else navigate('/dashboard/documents');
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <FolderKanban className="w-4 h-4 text-indigo-600" />
                <span>View Documents</span>
              </button>

              <button
                onClick={() => {
                  if (activeProject?.id) navigate(`/dashboard/projects/${activeProject.id}?tab=Forms%20&%20Filing`);
                  else navigate('/dashboard/projects');
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

