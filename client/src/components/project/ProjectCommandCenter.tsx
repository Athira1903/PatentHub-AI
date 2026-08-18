import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  UserPlus,
  Settings,
  Lightbulb,
  Search,
  PenTool,
  Shield,
  Users,
  FileCheck2,
  FileText,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  Check,
  X,
  Loader2,
  Save,
  Download
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface ProjectCommandCenterProps {
  project: any;
  analyticsSummary: any;
  onNavigateTab: (tab: string) => void;
  onShare?: () => void;
  onRefreshProject?: () => void;
}

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

export const ProjectCommandCenter: React.FC<ProjectCommandCenterProps> = ({
  project,
  analyticsSummary,
  onNavigateTab,
  onRefreshProject,
}) => {
  const [isStarred, setIsStarred] = useState(false);

  // Invite Collaborator Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteRole, setInviteRole] = useState<'CO_INVENTOR' | 'GUIDE' | 'PATENT_EXPERT'>('CO_INVENTOR');
  const [inviting, setInviting] = useState(false);

  // Project Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    title: project?.title || '',
    technicalDomain: project?.technicalDomain || '',
    category: project?.category || 'Utility',
    problemStatement: project?.problemStatement || '',
    proposedSolution: project?.proposedSolution || '',
    visibility: project?.visibility || 'PRIVATE',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (project) {
      setSettingsForm({
        title: project.title || '',
        technicalDomain: project.technicalDomain || '',
        category: project.category || 'Utility',
        problemStatement: project.problemStatement || '',
        proposedSolution: project.proposedSolution || '',
        visibility: project.visibility || 'PRIVATE',
      });
    }
  }, [project]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowInviteModal(false);
        setShowSettingsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scores = analyticsSummary?.scores;

  // Real Dynamic Patent Journey Calculation
  const hasReferences = (project?.patentReferences?.length || 0) > 0;
  const hasClaims = (project?.patentClaims?.length || 0) > 0;
  const hasApprovedReview = project?.projectReviews?.some((r: any) => r.decision === 'APPROVED');
  const isFiled = project?.stage === 'FILED';
  const isFilingReady = project?.stage === 'FILING_READY' || isFiled;

  const journeySteps = [
    {
      id: 1,
      name: '1. Idea Captured',
      status: 'Completed',
      date: project?.createdAt ? new Date(project.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Created',
      icon: Lightbulb,
      state: 'complete',
      tabTarget: 'Innovation Details',
    },
    {
      id: 2,
      name: '2. Prior Art Search',
      status: hasReferences ? 'Completed' : (project?.stage === 'LITERATURE_REVIEW' ? 'In Progress' : 'Pending'),
      date: hasReferences ? `${project.patentReferences.length} references saved` : (project?.stage === 'LITERATURE_REVIEW' ? 'In Progress' : 'Pending'),
      icon: Search,
      state: hasReferences ? 'complete' : (project?.stage === 'LITERATURE_REVIEW' ? 'in_progress' : 'pending'),
      tabTarget: 'Prior Art Search',
    },
    {
      id: 3,
      name: '3. Claims Engineering',
      status: hasClaims ? 'In Progress' : 'Pending',
      date: hasClaims ? `${project.patentClaims.length} claims drafted` : 'Pending',
      icon: PenTool,
      state: hasClaims ? 'in_progress' : 'pending',
      tabTarget: 'Claims Studio',
    },
    {
      id: 4,
      name: '4. FTO Analysis',
      status: hasReferences && hasClaims ? 'In Progress' : 'Pending',
      date: hasReferences && hasClaims ? 'Ready to analyze' : 'Pending',
      icon: Shield,
      state: hasReferences && hasClaims ? 'in_progress' : 'pending',
      tabTarget: 'FTO Analysis',
    },
    {
      id: 5,
      name: '5. Review',
      status: hasApprovedReview ? 'Completed' : (project?.stage === 'GUIDE_REVIEW' || project?.stage === 'PATENT_EXPERT_REVIEW' ? 'In Progress' : 'Pending'),
      date: hasApprovedReview ? 'Supervisor Approved' : (project?.stage === 'GUIDE_REVIEW' ? 'Under Guide Review' : 'Pending'),
      icon: Users,
      state: hasApprovedReview ? 'complete' : (project?.stage === 'GUIDE_REVIEW' || project?.stage === 'PATENT_EXPERT_REVIEW' ? 'in_progress' : 'pending'),
      tabTarget: 'Reviews',
    },
    {
      id: 6,
      name: '6. Filing Ready',
      status: isFilingReady ? 'Filing Ready' : 'Pending',
      date: isFilingReady ? (isFiled ? 'Officially Filed' : 'Ready for Registry') : 'Pending',
      icon: FileCheck2,
      state: isFilingReady ? 'complete' : 'pending',
      tabTarget: 'Forms & Filing',
    },
  ];

  const quickActions = [
    {
      id: 'search',
      title: 'Search Prior Art',
      subtitle: 'Find relevant patents',
      icon: Search,
      color: 'text-blue-600 bg-blue-50/80 hover:bg-blue-100/60',
      action: () => onNavigateTab('Prior Art Search'),
    },
    {
      id: 'claims',
      title: 'Generate Claims',
      subtitle: 'AI-powered claim drafting',
      icon: PenTool,
      color: 'text-emerald-600 bg-emerald-50/80 hover:bg-emerald-100/60',
      action: () => onNavigateTab('Claims Studio'),
    },
    {
      id: 'drawings',
      title: 'Upload Drawings',
      subtitle: 'Add technical drawings',
      icon: Layers,
      color: 'text-emerald-600 bg-emerald-50/80 hover:bg-emerald-100/60',
      action: () => onNavigateTab('Drawings'),
    },
    {
      id: 'fto',
      title: 'Run FTO Analysis',
      subtitle: 'Check risk & freedom',
      icon: Shield,
      color: 'text-amber-600 bg-amber-50/80 hover:bg-amber-100/60',
      action: () => onNavigateTab('FTO Analysis'),
    },
    {
      id: 'documents',
      title: 'Create Document',
      subtitle: 'Draft specifications',
      icon: FileText,
      color: 'text-blue-600 bg-blue-50/80 hover:bg-blue-100/60',
      action: () => onNavigateTab('Documents'),
    },
    {
      id: 'ai-assistant',
      title: 'Ask AI Assistant',
      subtitle: 'Get intelligent help',
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50/80 hover:bg-purple-100/60',
      action: () => onNavigateTab('AI Assistant'),
    },
  ];

  // Real Intelligence Metrics (No Fake Hardcoded Percentages!)
  const totalTasks = project?.tasks?.length || 0;
  const completedTasks = project?.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
  const totalDrawings = (project?.drawingFigures?.length || 0) + (project?.prototypes?.length || 0);

  const intelligenceMetrics = [
    {
      label: 'Patent Eligibility',
      hasValue: scores?.patentEligibilityScore !== undefined,
      value: scores?.patentEligibilityScore ?? 0,
      display: scores?.patentEligibilityScore !== undefined ? `${scores.patentEligibilityScore}%` : 'Insufficient data',
      tag: scores?.patentEligibilityScore !== undefined ? (scores.patentEligibilityScore >= 80 ? 'High' : 'Moderate') : 'Pending',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Prior Art Risk',
      hasValue: hasReferences && scores?.priorArtRiskIndex !== undefined,
      value: scores?.priorArtRiskIndex ?? 0,
      display: hasReferences && scores?.priorArtRiskIndex !== undefined ? `${scores.priorArtRiskIndex}%` : 'Not analyzed',
      tag: hasReferences && scores?.priorArtRiskIndex !== undefined ? (scores.priorArtRiskIndex > 50 ? 'High Risk' : scores.priorArtRiskIndex > 25 ? 'Medium' : 'Low Risk') : 'No Citations',
      color: scores?.priorArtRiskIndex && scores.priorArtRiskIndex > 50 ? 'bg-rose-500' : 'bg-amber-500',
      textColor: scores?.priorArtRiskIndex && scores.priorArtRiskIndex > 50 ? 'text-rose-600' : 'text-amber-600',
    },
    {
      label: 'Technical Drawing Score',
      hasValue: totalDrawings > 0,
      value: scores?.technicalDrawingScore ?? 0,
      display: totalDrawings > 0 ? `${scores?.technicalDrawingScore ?? 0}%` : 'Not available',
      tag: totalDrawings > 0 ? (scores?.technicalDrawingScore >= 70 ? 'Good' : 'Needs Review') : 'No Drawings',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Legal Compliance',
      hasValue: (project?.patentForms?.length || 0) > 0,
      value: scores?.legalComplianceHealth ?? 0,
      display: (project?.patentForms?.length || 0) > 0 ? `${scores?.legalComplianceHealth ?? 0}%` : 'Pending',
      tag: (project?.patentForms?.length || 0) > 0 ? 'Verified' : 'Incomplete Forms',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Team Execution',
      hasValue: totalTasks > 0,
      value: scores?.teamExecutionVelocity ?? 0,
      display: totalTasks > 0 ? `${scores?.teamExecutionVelocity ?? 0}% (${completedTasks}/${totalTasks})` : 'No tasks',
      tag: totalTasks > 0 ? (completedTasks === totalTasks ? 'Completed' : 'In Progress') : 'Setup Tasks',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Filing Readiness',
      hasValue: scores?.filingReadinessScore !== undefined,
      value: scores?.filingReadinessScore ?? 0,
      display: scores?.filingReadinessScore !== undefined ? `${scores.filingReadinessScore}%` : 'Pending',
      tag: scores?.filingReadinessScore && scores.filingReadinessScore >= 80 ? 'Ready' : 'In Progress',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
    },
  ];

  // Real Project Activity Logs
  const recentActivities = (project?.activityLogs || []).slice(0, 5);

  // Key Innovations Parser
  const keyInnovationsList: string[] = [];
  if (project?.novelFeatures) {
    const lines = project.novelFeatures.split(/\n|;|\./).map((s: string) => s.trim()).filter((s: string) => s.length > 5);
    keyInnovationsList.push(...lines.slice(0, 4));
  } else if (project?.innovationIdea) {
    keyInnovationsList.push(project.innovationIdea.substring(0, 90) + '...');
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier.trim()) {
      toast.error('Please enter an email or username');
      return;
    }

    setInviting(true);
    try {
      await api.post(`/collaboration/invite`, {
        projectId: project.id,
        identifier: inviteIdentifier.trim(),
        username: inviteIdentifier.trim(),
        role: inviteRole,
      });
      toast.success(`Invitation sent successfully to ${inviteIdentifier}!`);
      setShowInviteModal(false);
      setInviteIdentifier('');
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send collaborator invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm.title.trim()) {
      toast.error('Project title is required.');
      return;
    }

    setSavingSettings(true);
    try {
      await api.put(`/projects/${project.id}`, {
        title: settingsForm.title.trim(),
        technicalDomain: settingsForm.technicalDomain.trim(),
        category: settingsForm.category,
        problemStatement: settingsForm.problemStatement.trim(),
        proposedSolution: settingsForm.proposedSolution.trim(),
        visibility: settingsForm.visibility,
      });
      toast.success('Project settings updated successfully!');
      setShowSettingsModal(false);
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update project settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const leadInventor = project?.owner?.fullName || 'Lead Inventor';
  const coInventors = project?.members
    ?.filter((m: any) => m.role === 'CO_INVENTOR' || m.role === 'INVENTOR')
    ?.map((m: any) => m.user?.fullName)
    ?.filter(Boolean) || [];

  const inventorsList = [leadInventor, ...coInventors];

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      {/* 1. TOP HEADER & BREADCRUMB ROW */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Inventions</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <span>{project?.title || 'Invention Workspace'}</span>
              <button
                onClick={() => {
                  setIsStarred(!isStarred);
                  toast.success(isStarred ? 'Removed from favorites' : 'Added to favorites');
                }}
                className="text-slate-300 hover:text-amber-400 transition cursor-pointer"
              >
                <Star className={`w-5 h-5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </h1>

            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              {project?.stage ? project.stage.replace(/_/g, ' ') : 'Idea'}
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium mt-1">
            Project ID: <strong className="text-slate-800">PH-{project?.id ? project.id.substring(0, 8).toUpperCase() : '2024'}</strong>
            {' • '}
            Created: {project?.createdAt ? new Date(project.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently'}
            {' • '}
            Inventors: <strong className="text-slate-800">{inventorsList.join(', ')}</strong>
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            <span>Invite Collaborator</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#064E3B] hover:bg-[#043E2F] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Settings className="w-4 h-4 text-white" />
            <span>Project Settings</span>
          </button>
        </div>
      </div>

      {/* 2. PATENT JOURNEY VISUAL PROGRESS STEPPER */}
      <div className="app-card p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Patent Journey</h3>
          <span className="text-[11px] text-emerald-600 font-bold">
            Stage: {project?.stage ? project.stage.replace(/_/g, ' ') : 'Idea'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
          {journeySteps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.state === 'complete';
            const isInProgress = step.state === 'in_progress';

            return (
              <div
                key={step.id}
                onClick={() => onNavigateTab(step.tabTarget)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isInProgress
                    ? 'bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                    : isCompleted
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50/50 border-slate-200/60 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isInProgress
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {isCompleted && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {isInProgress && (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">{step.name}</h4>
                  <p
                    className={`text-[10px] font-semibold mt-0.5 ${
                      isInProgress ? 'text-emerald-700 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {step.date}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN 3-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMN 1: PROJECT SUMMARY (4 cols) */}
        <div className="lg:col-span-4 app-card p-6 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Project Summary</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invention Title</span>
              <p className="font-bold text-slate-900 mt-0.5">{project?.title || 'Untitled Project'}</p>
            </div>

            {/* Technical Field */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Technical Field</span>
              <p className="font-semibold text-slate-800 mt-0.5">{project?.technicalDomain || 'General Technology'}</p>
            </div>

            {/* Problem Statement */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Problem Statement</span>
              <p className="text-slate-600 font-medium mt-0.5 leading-relaxed">
                {project?.problemStatement || 'Problem statement to be specified in Innovation Details.'}
              </p>
            </div>

            {/* Proposed Solution */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proposed Solution</span>
              <p className="text-slate-600 font-medium mt-0.5 leading-relaxed">
                {project?.proposedSolution || 'Proposed solution to be specified in Innovation Details.'}
              </p>
            </div>

            {/* Key Innovations */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Key Innovations</span>
              {keyInnovationsList.length > 0 ? (
                <div className="space-y-2">
                  {keyInnovationsList.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] shrink-0">
                        ✓
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No key innovations detailed yet.</p>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('Innovation Details')}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <span>View Full Innovation Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* COLUMN 2: QUICK ACTIONS & AI ASSISTANT (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions (2x3 Grid) */}
          <div className="app-card p-6 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Quick Actions</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-3xs transition text-left space-y-2 cursor-pointer group"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${action.color} transition group-hover:scale-105`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">{action.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{action.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 3: INTELLIGENCE OVERVIEW & RECENT ACTIVITY (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Intelligence Overview */}
          <div className="app-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-slate-900">Intelligence Overview</h3>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <button
                onClick={() => onNavigateTab('Forms & Filing')}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {intelligenceMetrics.map((metric, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">{metric.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 font-mono">{metric.display}</span>
                      <span className={`text-[10px] font-extrabold ${metric.textColor}`}>
                        {metric.tag}
                      </span>
                    </div>
                  </div>
                  {metric.hasValue && (
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${metric.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(5, Math.min(100, metric.value))}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="app-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Recent Activity</h3>
              <button
                onClick={() => onNavigateTab('Activity Timeline')}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((act: any, idx: number) => (
                  <div key={act.id || idx} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2.5 text-slate-700 font-medium truncate max-w-[200px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                      <span className="truncate">{act.action}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">
                      {formatTimeAgo(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-xs py-4 text-center">No activity yet</div>
            )}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: PROJECT DOCUMENTS & NEXT RECOMMENDED STEP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Project Documents (8 cols) */}
        <div className="lg:col-span-8 app-card p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Project Documents</h3>
            <button
              onClick={() => onNavigateTab('Documents')}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All Documents</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {(project?.documents?.length || 0) > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {project.documents.slice(0, 4).map((doc: any) => {
                const isPdf = doc.name.toLowerCase().endsWith('.pdf');
                return (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-slate-50/60 border border-slate-200/80 rounded-2xl flex flex-col justify-between space-y-3 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                          isPdf ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isPdf ? 'PDF' : 'DOC'}
                      </span>
                      {doc.fileUrl && (
                        <a
                          href={`http://localhost:5000${doc.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-700"
                          title="Download document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={doc.name}>
                        {doc.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {doc.category || 'General'}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                      {formatTimeAgo(doc.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-1" />
              <p className="font-bold text-slate-600">No documents uploaded yet.</p>
              <p className="text-[11px] text-slate-400">Upload or generate specifications in the Documents tab.</p>
            </div>
          )}
        </div>

        {/* Next Recommended Step (4 cols) */}
        <div className="lg:col-span-4 app-card p-6 space-y-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Recommended Step</span>
              <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                {!hasReferences
                  ? 'Perform Prior Art Search'
                  : !hasClaims
                  ? 'Draft Patent Claims'
                  : !isFilingReady
                  ? 'Complete Filing Forms'
                  : 'Filing Ready'}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                {!hasReferences
                  ? 'Search and save patent citations to establish strong novelty and lower prior-art risk.'
                  : !hasClaims
                  ? 'Generate or refine structured independent and dependent claims in Claims Studio.'
                  : !isFilingReady
                  ? 'Compile IPO statutory Forms 1, 2, 3, 5 and request supervisor review.'
                  : 'All core milestones completed. Export the official filing package.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!hasReferences) onNavigateTab('Prior Art Search');
              else if (!hasClaims) onNavigateTab('Claims Studio');
              else onNavigateTab('Forms & Filing');
            }}
            className="w-full py-3 bg-[#064E3B] hover:bg-[#043E2F] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {!hasReferences
                ? 'Go to Prior Art Search'
                : !hasClaims
                ? 'Go to Claims Studio'
                : 'Go to Forms & Filing'}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. INVITE COLLABORATOR MODAL */}
      {showInviteModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in font-sans"
          onClick={() => setShowInviteModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Invite Collaborator</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Add co-inventors, faculty guides, or patent experts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email or Username
                </label>
                <input
                  type="text"
                  required
                  value={inviteIdentifier}
                  onChange={(e) => setInviteIdentifier(e.target.value)}
                  placeholder="e.g. colleague@university.edu or @username"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 shadow-3xs transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Role Permission
                </label>
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 shadow-3xs"
                >
                  <option value="CO_INVENTOR">Co-Inventor (Co-draft specifications & claims)</option>
                  <option value="GUIDE">Faculty Guide (Review & approval authority)</option>
                  <option value="PATENT_EXPERT">Patent Expert (Legal compliance & FTO audit)</option>
                </select>
              </div>

              {/* Current Team Members List */}
              {project?.members && project.members.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Project Team</span>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-150 text-[11px]">
                      <span className="font-bold text-slate-800 truncate">{project.owner?.fullName || 'Lead Inventor'}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[9px]">OWNER</span>
                    </div>
                    {project.members.map((m: any) => (
                      <div key={m.id || m.userId} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-150 text-[11px]">
                        <span className="font-medium text-slate-700 truncate">{m.user?.fullName || m.user?.username || 'Member'}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px]">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-2/3 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 6. PROJECT SETTINGS MODAL */}
      {showSettingsModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in font-sans"
          onClick={() => setShowSettingsModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Project Configuration</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Update invention details, metadata, and visibility</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Invention Title
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.title}
                  onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                  placeholder="Enter project title"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 shadow-3xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Technical Domain
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.technicalDomain}
                    onChange={(e) => setSettingsForm({ ...settingsForm, technicalDomain: e.target.value })}
                    placeholder="e.g. Artificial Intelligence, Healthcare"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 shadow-3xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Patent Category
                  </label>
                  <select
                    value={settingsForm.category}
                    onChange={(e) => setSettingsForm({ ...settingsForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 shadow-3xs"
                  >
                    <option value="Utility">Utility Patent</option>
                    <option value="Design">Design Patent</option>
                    <option value="Software">Software & Algorithms</option>
                    <option value="Biomedical">Biomedical & Healthcare</option>
                    <option value="Chemical">Chemical & Material</option>
                    <option value="Mechanical">Mechanical Engineering</option>
                    <option value="Electronics">Electronics & Hardware</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Project Visibility
                </label>
                <select
                  value={settingsForm.visibility}
                  onChange={(e) => setSettingsForm({ ...settingsForm, visibility: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 shadow-3xs"
                >
                  <option value="PRIVATE">Private (Only invited members & assigned guides)</option>
                  <option value="ORGANIZATION">Organization / University Wide</option>
                  <option value="PUBLIC">Public Invention Showcase</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Problem Statement
                </label>
                <textarea
                  rows={3}
                  value={settingsForm.problemStatement}
                  onChange={(e) => setSettingsForm({ ...settingsForm, problemStatement: e.target.value })}
                  placeholder="Describe the core problem this invention solves..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 shadow-3xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Proposed Solution & Key Novelty
                </label>
                <textarea
                  rows={3}
                  value={settingsForm.proposedSolution}
                  onChange={(e) => setSettingsForm({ ...settingsForm, proposedSolution: e.target.value })}
                  placeholder="Explain your technical solution and distinctive novel features..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 shadow-3xs"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#043E2F] text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
