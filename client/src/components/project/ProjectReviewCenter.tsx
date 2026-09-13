import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  FileText,
  FileCode,
  Folder,
  Cpu,
  Search,
  CheckSquare,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Loader2,
  X,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export interface ProjectReviewRecord {
  id: string;
  projectId: string;
  reviewerId: string;
  reviewer: {
    id: string;
    fullName: string;
    username: string;
    role?: string;
  };
  reviewType: string; // 'GUIDE_REVIEW' | 'EXPERT_REVIEW'
  decision: string; // 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
  comments: string | null;
  checklistSnapshot?: any;
  createdAt: string;
  updatedAt: string;
}

interface ProjectReviewCenterProps {
  projectId: string;
  project: any;
  analyticsSummary?: any;
  currentUser?: any;
  userProjectRole?: string;
  onRefreshProject?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ProjectReviewCenter: React.FC<ProjectReviewCenterProps> = ({
  projectId,
  project,
  analyticsSummary,
  currentUser,
  userProjectRole,
  onRefreshProject,
  onNavigateTab,
}) => {
  const [reviews, setReviews] = useState<ProjectReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // Observation comments state
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Review submission / modal states
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [submittingResubmit, setSubmittingResubmit] = useState(false);

  // Modal controls
  const [showApproveModal, setShowApproveModal] = useState<{ open: boolean; type: 'GUIDE_REVIEW' | 'EXPERT_REVIEW' }>({
    open: false,
    type: 'GUIDE_REVIEW',
  });
  const [showChangesModal, setShowChangesModal] = useState<{ open: boolean; type: 'GUIDE_REVIEW' | 'EXPERT_REVIEW' }>({
    open: false,
    type: 'GUIDE_REVIEW',
  });
  const [showRejectModal, setShowRejectModal] = useState<{ open: boolean; type: 'GUIDE_REVIEW' | 'EXPERT_REVIEW' }>({
    open: false,
    type: 'GUIDE_REVIEW',
  });
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [modalReason, setModalReason] = useState('');
  const [modalError, setModalError] = useState('');
  const [selectedReviewDetails, setSelectedReviewDetails] = useState<ProjectReviewRecord | null>(null);

  // Fetch reviews from API
  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const res = await api.get(`/projects/${projectId}/reviews`);
      if (res.data?.reviews) {
        setReviews(res.data.reviews);
      } else {
        setReviews([]);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setUnauthorized(true);
      } else {
        setError(err.response?.data?.message || 'Unable to load reviews.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchReviews();
    }
  }, [projectId]);

  // Derived user roles and permissions
  const currentUserId = currentUser?.id || currentUser?.userId;
  const isOwner = project?.ownerId === currentUserId || currentUser?.role === 'Admin';
  const memberRecord = project?.members?.find((m: any) => m.userId === currentUserId);
  const userRole = memberRecord?.role || userProjectRole;

  const isAssignedGuide = userRole === 'GUIDE' || ((currentUser?.role === 'Guide' || currentUser?.role === 'GUIDE') && memberRecord?.role === 'GUIDE');
  const isAssignedExpert = userRole === 'PATENT_EXPERT' || ((currentUser?.role === 'PatentExpert' || currentUser?.role === 'PATENT_EXPERT') && memberRecord?.role === 'PATENT_EXPERT');
  const isAdmin = currentUser?.role === 'Admin';

  const canReviewGuide = (isAssignedGuide || isAdmin) && project?.stage === 'GUIDE_REVIEW';
  const canReviewExpert = (isAssignedExpert || isAdmin) && project?.stage === 'PATENT_EXPERT_REVIEW';
  const canSubmitForReview =
    (isOwner || memberRecord?.permissionLevel === 'SUBMIT') &&
    (project?.stage === 'DOCUMENTATION' ||
      project?.stage === 'FORMS_PREPARATION' ||
      project?.stage === 'PROTOTYPE' ||
      project?.stage === 'IDEA' ||
      project?.stage === 'LITERATURE_REVIEW');

  // Find reviews by type
  const guideReviews = reviews.filter((r) => r.reviewType === 'GUIDE_REVIEW');
  const expertReviews = reviews.filter((r) => r.reviewType === 'EXPERT_REVIEW');
  const latestGuideReview = guideReviews[0];
  const latestExpertReview = expertReviews[0];

  const assignedGuide = project?.members?.find((m: any) => m.role === 'GUIDE')?.user;
  const assignedExpert = project?.members?.find((m: any) => m.role === 'PATENT_EXPERT')?.user;

  const hasChangesRequested =
    latestGuideReview?.decision === 'CHANGES_REQUESTED' ||
    latestExpertReview?.decision === 'CHANGES_REQUESTED' ||
    reviews.some((r) => r.decision === 'CHANGES_REQUESTED');

  const filingScore =
    analyticsSummary?.scores?.filingReadinessScore ??
    (project?.stage === 'FILED'
      ? 100
      : project?.stage === 'FILING_READY'
      ? 95
      : project?.stage === 'PATENT_EXPERT_REVIEW'
      ? 80
      : project?.stage === 'GUIDE_REVIEW'
      ? 65
      : project?.stage === 'FORMS_PREPARATION'
      ? 50
      : project?.stage === 'DOCUMENTATION'
      ? 35
      : project?.stage === 'LITERATURE_REVIEW'
      ? 20
      : 10);

  // Submit Observation Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setSubmittingComment(true);
    try {
      await api.post(`/projects/${projectId}/comments`, { content: commentInput.trim() });
      toast.success('Observation comment posted successfully.');
      setCommentInput('');
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Submit Review Action (Approve, Request Changes, Reject)
  const handleSubmitReviewDecision = async (
    reviewType: 'GUIDE_REVIEW' | 'EXPERT_REVIEW',
    decision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED',
    comments?: string
  ) => {
    if ((decision === 'CHANGES_REQUESTED' || decision === 'REJECTED') && (!comments || !comments.trim())) {
      setModalError('A written explanation is required for this action.');
      return;
    }

    setSubmittingDecision(true);
    setModalError('');
    try {
      await api.post(`/projects/${projectId}/reviews`, {
        reviewType,
        decision,
        comments: comments?.trim() || null,
      });

      const actionText =
        decision === 'APPROVED'
          ? 'Review approved successfully!'
          : decision === 'CHANGES_REQUESTED'
          ? 'Changes requested successfully. Project returned to documentation.'
          : 'Review rejected.';
      toast.success(actionText);

      // Close all modals
      setShowApproveModal({ open: false, type: 'GUIDE_REVIEW' });
      setShowChangesModal({ open: false, type: 'GUIDE_REVIEW' });
      setShowRejectModal({ open: false, type: 'GUIDE_REVIEW' });
      setModalReason('');

      // Refresh data
      fetchReviews();
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to submit review decision.';
      setModalError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Resubmit for Review
  const handleResubmit = async () => {
    setSubmittingResubmit(true);
    try {
      await api.put(`/projects/${projectId}`, { stage: 'GUIDE_REVIEW' });
      if (modalReason.trim()) {
        try {
          await api.post(`/projects/${projectId}/comments`, {
            content: `[Resubmission Note] ${modalReason.trim()}`,
          });
        } catch {
          // non-blocking
        }
      }
      toast.success('Project successfully resubmitted for Faculty Guide Review!');
      setShowResubmitModal(false);
      setModalReason('');
      fetchReviews();
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resubmit project for review.');
    } finally {
      setSubmittingResubmit(false);
    }
  };

  // Initial submission
  const handleInitialSubmit = async () => {
    setSubmittingResubmit(true);
    try {
      await api.put(`/projects/${projectId}`, { stage: 'GUIDE_REVIEW' });
      toast.success('Project successfully submitted for Faculty Guide Review!');
      fetchReviews();
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit project for review.');
    } finally {
      setSubmittingResubmit(false);
    }
  };

  // Helper for Status Badge
  const renderStatusBadge = (decision?: string, stage?: string, isGuideCard = true) => {
    if (decision === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
        </span>
      );
    }
    if (decision === 'CHANGES_REQUESTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5" /> Changes Requested
        </span>
      );
    }
    if (decision === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    }
    if (isGuideCard && stage === 'GUIDE_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3.5 h-3.5" /> Pending Review
        </span>
      );
    }
    if (!isGuideCard && stage === 'PATENT_EXPERT_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3.5 h-3.5" /> Pending Review
        </span>
      );
    }
    if (!isGuideCard && (stage === 'FILING_READY' || stage === 'FILED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <Clock className="w-3.5 h-3.5" /> {isGuideCard ? 'Pending Submission' : 'Awaiting Guide Review'}
      </span>
    );
  };

  // State Views: Loading, Unauthorized, Error
  if (loading && reviews.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm font-medium text-slate-600">Loading review information...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          You don't have permission to access this project's reviews. Only authorized project members, assigned reviewers, and administrators can access this view.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Unable to load reviews</h3>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={fetchReviews}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Review Center
              </span>
              <span className="text-xs font-medium text-slate-400">ID: {projectId.slice(0, 8)}...</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{project?.title || 'Patent Project'}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Current Stage:</span>
                <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {project?.stage?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Filing Readiness:</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {filingScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canSubmitForReview && (
              <button
                type="button"
                disabled={submittingResubmit}
                onClick={hasChangesRequested ? () => setShowResubmitModal(true) : handleInitialSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
              >
                {submittingResubmit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{hasChangesRequested ? 'Resubmit for Review' : 'Submit for Review'}</span>
              </button>
            )}

            {hasChangesRequested && (
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('Innovation Details')}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              >
                <span>Address Changes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('Overview')}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition"
              >
                Project Overview
              </button>
            )}

            <button
              type="button"
              onClick={fetchReviews}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs transition"
              title="Refresh reviews"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Review Status Summary Cards */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Review Status Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Guide Review Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    GR
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Faculty Guide Review</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Academic supervision & invention endorsement</p>
                  </div>
                </div>
                {renderStatusBadge(latestGuideReview?.decision, project?.stage, true)}
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Reviewer:</span>
                  <span className="text-slate-800 font-semibold">
                    {latestGuideReview?.reviewer?.fullName || assignedGuide?.fullName || 'Assigned Faculty Guide'}
                  </span>
                </div>
                {latestGuideReview?.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Decision Date:</span>
                    <span className="text-slate-700">
                      {new Date(latestGuideReview.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {latestGuideReview?.comments && (
                  <div className="pt-1 text-[11px] text-slate-600 italic line-clamp-2">
                    "{latestGuideReview.comments}"
                  </div>
                )}
              </div>
            </div>

            {latestGuideReview && (
              <button
                type="button"
                onClick={() => setSelectedReviewDetails(latestGuideReview)}
                className="w-full py-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-100 hover:bg-blue-50/50 rounded-lg transition text-center"
              >
                View Full Details
              </button>
            )}
          </div>

          {/* Patent Expert Review Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    PR
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Patent Expert Review</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Legal claims clearance & filing validation</p>
                  </div>
                </div>
                {renderStatusBadge(latestExpertReview?.decision, project?.stage, false)}
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Reviewer:</span>
                  <span className="text-slate-800 font-semibold">
                    {latestExpertReview?.reviewer?.fullName || assignedExpert?.fullName || 'Assigned Patent Expert'}
                  </span>
                </div>
                {latestExpertReview?.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Decision Date:</span>
                    <span className="text-slate-700">
                      {new Date(latestExpertReview.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {latestExpertReview?.comments && (
                  <div className="pt-1 text-[11px] text-slate-600 italic line-clamp-2">
                    "{latestExpertReview.comments}"
                  </div>
                )}
              </div>
            </div>

            {latestExpertReview && (
              <button
                type="button"
                onClick={() => setSelectedReviewDetails(latestExpertReview)}
                className="w-full py-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-100 hover:bg-blue-50/50 rounded-lg transition text-center"
              >
                View Full Details
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Reviewer Action Deck (Shown to Authorized Reviewers) */}
      {(canReviewGuide || canReviewExpert) && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">
                  {canReviewGuide ? 'Faculty Guide Review Deck' : 'Patent Expert Legal Review Deck'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {canReviewGuide
                  ? 'Evaluate academic and technical disclosures, provide instructions, or advance project stage.'
                  : 'Examine patent forms, claim charts, and drawing sheets before formal filing readiness.'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Active Reviewer
            </span>
          </div>

          {/* Quick Inspection Links */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Project Disclosure Inspection
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('Innovation Details')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" /> Innovation Details
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('Documents')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Folder className="w-3.5 h-3.5 text-amber-400" /> Documents
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('Prior Art Search')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Search className="w-3.5 h-3.5 text-emerald-400" /> Prior Art Search
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('Claims Studio')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <FileCode className="w-3.5 h-3.5 text-purple-400" /> Claims Studio
              </button>
              {canReviewExpert && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab('Forms & Filing')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-teal-400" /> Patent Forms (1, 2, 3, 5)
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab('Drawings')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Cpu className="w-3.5 h-3.5 text-rose-400" /> Drawings & Figures
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setModalReason('');
                setModalError('');
                setShowApproveModal({ open: true, type: canReviewGuide ? 'GUIDE_REVIEW' : 'EXPERT_REVIEW' });
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{canReviewGuide ? 'Approve & Advance to Expert Review' : 'Approve & Mark Filing Ready'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalReason('');
                setModalError('');
                setShowChangesModal({ open: true, type: canReviewGuide ? 'GUIDE_REVIEW' : 'EXPERT_REVIEW' });
              }}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Request Changes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalReason('');
                setModalError('');
                setShowRejectModal({ open: true, type: canReviewGuide ? 'GUIDE_REVIEW' : 'EXPERT_REVIEW' });
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Review</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Review Timeline & History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Review Timeline & History</h3>
            <p className="text-xs text-slate-500 font-medium">Historical audit records of supervisor and legal evaluations</p>
          </div>
          <span className="text-xs font-bold text-slate-400">{reviews.length} total records</span>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-xl space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700 uppercase">No reviews yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Reviews will appear here when this project is submitted for formal supervisor evaluation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => {
              const isApproved = rev.decision === 'APPROVED';
              const isChanges = rev.decision === 'CHANGES_REQUESTED';
              return (
                <div
                  key={rev.id}
                  className={`p-4 rounded-xl border transition ${
                    isApproved
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : isChanges
                      ? 'bg-amber-50/30 border-amber-200'
                      : 'bg-rose-50/30 border-rose-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      {isApproved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isChanges ? (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-slate-900">
                        {rev.reviewType === 'GUIDE_REVIEW' ? 'Faculty Guide Review' : 'Patent Expert Legal Review'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isChanges
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rev.decision.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">
                      {new Date(rev.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {rev.comments && (
                    <div className="py-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                      <strong className="text-slate-900">Comments: </strong>
                      {rev.comments}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/40 text-[11px] text-slate-500 font-medium">
                    <div>
                      Reviewer: <strong className="text-slate-800">{rev.reviewer?.fullName || 'Reviewer'}</strong> (@
                      {rev.reviewer?.username})
                      {rev.reviewer?.role && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 rounded text-[9px] uppercase font-bold text-slate-600">
                          {rev.reviewer.role}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedReviewDetails(rev)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Observation Comments Thread */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Project Review Comments & Observations</h3>
            <p className="text-xs text-slate-500 font-medium">Collaboration feedback between inventors and reviewers</p>
          </div>
          <span className="text-xs font-bold text-slate-400">{project?.comments?.length || 0} comments</span>
        </div>

        {/* Comment input */}
        <form onSubmit={handlePostComment} className="space-y-2">
          <textarea
            rows={2}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Add an observation note or feedback query for the reviewers..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingComment || !commentInput.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
              <span>Post Observation</span>
            </button>
          </div>
        </form>

        {/* Comments list */}
        <div className="space-y-3 pt-2">
          {project?.comments && project.comments.length > 0 ? (
            project.comments.map((c: any) => (
              <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{c.user?.fullName || c.user?.username || 'User'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-700">
                      {c.user?.role || 'Member'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{c.content}</p>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-slate-400 text-xs font-medium">
              No observation comments recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Approve Confirmation Modal */}
      {showApproveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Approve Review?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApproveModal({ open: false, type: 'GUIDE_REVIEW' })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to approve this review? Approving will record your formal endorsement and advance the project workflow stage to{' '}
              <strong>{showApproveModal.type === 'GUIDE_REVIEW' ? 'PATENT_EXPERT_REVIEW' : 'FILING_READY'}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase">Approval Notes (Optional)</label>
              <textarea
                rows={3}
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Add any formal supervisor sign-off observations or remarks..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            {modalError && <p className="text-xs text-rose-600 font-medium">{modalError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal({ open: false, type: 'GUIDE_REVIEW' })}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision}
                onClick={() => handleSubmitReviewDecision(showApproveModal.type, 'APPROVED', modalReason)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {submittingDecision && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Approve Review</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showChangesModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Request Changes</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChangesModal({ open: false, type: 'GUIDE_REVIEW' })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Please specify the corrections or additional disclosures required from the inventors. The project will be returned to the <strong>DOCUMENTATION</strong> stage.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Reason for Requested Changes <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Explain what items require revision (e.g. clarify claims 3-5, provide figure diagrams, complete Form 2)..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            {modalError && <p className="text-xs text-rose-600 font-medium">{modalError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowChangesModal({ open: false, type: 'GUIDE_REVIEW' })}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision || !modalReason.trim()}
                onClick={() => handleSubmitReviewDecision(showChangesModal.type, 'CHANGES_REQUESTED', modalReason)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {submittingDecision && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit Changes Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Reject Review</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal({ open: false, type: 'GUIDE_REVIEW' })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Rejecting this review returns the project to the <strong>DOCUMENTATION</strong> stage. Please record the rejection reason.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="State the reasons for rejecting this review submission..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
              />
            </div>

            {modalError && <p className="text-xs text-rose-600 font-medium">{modalError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal({ open: false, type: 'GUIDE_REVIEW' })}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision || !modalReason.trim()}
                onClick={() => handleSubmitReviewDecision(showRejectModal.type, 'REJECTED', modalReason)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {submittingDecision && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Reject Review</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resubmit for Review Modal */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Resubmit for Guide Review</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResubmitModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Confirm that you have addressed the requested feedback. Submitting will advance the project to <strong>GUIDE_REVIEW</strong> and notify the assigned Faculty Guide.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Notes on Addressed Feedback (Optional)
              </label>
              <textarea
                rows={3}
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Briefly explain what corrections were made (e.g. updated claims, uploaded complete figures)..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResubmitModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingResubmit}
                onClick={handleResubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {submittingResubmit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Resubmission</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Details Modal for a Review Record */}
      {selectedReviewDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Review Decision Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReviewDetails(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Review Stage</span>
                  <span className="font-bold text-slate-800">
                    {selectedReviewDetails.reviewType === 'GUIDE_REVIEW' ? 'Faculty Guide Review' : 'Patent Expert Legal Review'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Decision</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {selectedReviewDetails.decision.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Reviewer</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReviewDetails.reviewer?.fullName || 'Reviewer'} (@{selectedReviewDetails.reviewer?.username})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date & Time</span>
                  <span className="text-slate-700">
                    {new Date(selectedReviewDetails.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Written Feedback & Instructions:</span>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed font-medium">
                  {selectedReviewDetails.comments || 'No written commentary was recorded for this review.'}
                </div>
              </div>

              {selectedReviewDetails.checklistSnapshot && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Checklist Snapshot:</span>
                  <pre className="p-2.5 bg-slate-900 text-slate-200 rounded-xl text-[10px] overflow-x-auto">
                    {JSON.stringify(selectedReviewDetails.checklistSnapshot, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedReviewDetails(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
