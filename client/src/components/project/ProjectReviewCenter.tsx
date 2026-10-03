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
  Cpu,
  Search,
  CheckSquare,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Loader2,
  X,
  Download,
  Award,
  Sliders,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

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

interface FilingReadinessItem {
  key: string;
  title: string;
  completed: boolean;
  required: boolean;
  explanation: string;
}

interface FilingReadinessData {
  overallReadiness: 'READY' | 'NOT_READY';
  completedCount: number;
  totalRequiredCount: number;
  checklist: FilingReadinessItem[];
  blockingIssues: string[];
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
  const [reviews, setReviews] = useState<ProjectReviewRecord[]>(project?.projectReviews || []);
  const [comments, setComments] = useState<any[]>(project?.comments || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // Sync reviews and comments when project prop updates
  useEffect(() => {
    if (project?.projectReviews && project.projectReviews.length > 0) {
      setReviews(project.projectReviews);
    }
  }, [project?.projectReviews]);

  useEffect(() => {
    if (project?.comments) {
      setComments(project.comments);
    }
  }, [project?.comments]);

  // Filing Readiness & Artifacts state
  const [readinessData, setReadinessData] = useState<FilingReadinessData | null>(null);
  const [activeInspectTab, setActiveInspectTab] = useState<'specs' | 'claims' | 'forms' | 'drawings' | 'references'>('specs');
  const [projectClaims, setProjectClaims] = useState<any[]>([]);
  const [projectFigures, setProjectFigures] = useState<any[]>([]);
  const [projectReferences, setProjectReferences] = useState<any[]>([]);

  // Observation comments state
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Review submission / modal states
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [submittingResubmit, setSubmittingResubmit] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showEditDeck, setShowEditDeck] = useState(false);

  // Review Timeline filter
  const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'GUIDE_REVIEW' | 'EXPERT_REVIEW'>('ALL');

  // Interactive Reviewer Rubric State (For active reviewers)
  const [rubricChecklist, setRubricChecklist] = useState<Record<string, boolean>>({
    novelty: true,
    nonObviousness: true,
    statutorySubjectMatter: true,
    claimsPrecision: true,
    drawingCompliance: true,
    statutoryForms: true,
  });

  const [rubricScores, setRubricScores] = useState({
    noveltyScore: 9,
    specificationClarity: 8,
    industrialApplicability: 9,
    ftoRiskClearance: 8,
  });

  const [activeDecisionSelection, setActiveDecisionSelection] = useState<'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'>('APPROVED');
  const [deckComments, setDeckComments] = useState('');

  // Modal controls
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [modalReason, setModalReason] = useState('');
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
      } else if (project?.projectReviews) {
        setReviews(project.projectReviews);
      } else {
        setReviews([]);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setUnauthorized(true);
      } else {
        // Fallback to project reviews if available
        if (project?.projectReviews) {
          setReviews(project.projectReviews);
        } else {
          setError(err.response?.data?.message || 'Unable to load reviews.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch Filing Readiness data
  const fetchReadiness = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/filing-readiness`);
      if (res.data?.readiness) {
        setReadinessData(res.data.readiness);
      }
    } catch (err) {
      console.warn('Could not fetch filing readiness data', err);
    }
  };

  // Fetch artifacts for quick inspection (Claims, Figures, References)
  const fetchArtifacts = async () => {
    try {
      const [claimsRes, figuresRes, refsRes] = await Promise.allSettled([
        api.get(`/projects/${projectId}/claims`),
        api.get(`/projects/${projectId}/figures`),
        api.get(`/projects/${projectId}/patents/references`),
      ]);

      if (claimsRes.status === 'fulfilled' && claimsRes.value.data?.claims) {
        setProjectClaims(claimsRes.value.data.claims);
      }
      if (figuresRes.status === 'fulfilled' && figuresRes.value.data?.figures) {
        setProjectFigures(figuresRes.value.data.figures);
      }
      if (refsRes.status === 'fulfilled' && refsRes.value.data?.references) {
        setProjectReferences(refsRes.value.data.references);
      }
    } catch (err) {
      console.warn('Could not fetch project artifacts', err);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchReviews();
      fetchReadiness();
      fetchArtifacts();
    }
  }, [projectId]);

const formatRoleName = (role: any): string => {
  if (!role) return 'Member';
  if (typeof role === 'object') return role.name || 'Member';
  return String(role);
};

  // Derived user roles and permissions
  const currentUserId = currentUser?.id || currentUser?.userId;
  const currentUserRole = typeof currentUser?.role === 'object' ? currentUser?.role?.name : currentUser?.role;
  const isOwner = project?.ownerId === currentUserId || currentUserRole === 'Admin';
  const memberRecord = project?.members?.find((m: any) => m.userId === currentUserId || m.user?.id === currentUserId);
  const memberRole = typeof memberRecord?.role === 'object' ? memberRecord?.role?.name : memberRecord?.role;
  const userRole = memberRole || userProjectRole;

  const isAssignedGuide = userRole === 'GUIDE' || ((currentUserRole === 'Guide' || currentUserRole === 'GUIDE') && memberRole === 'GUIDE');
  const isAssignedExpert = userRole === 'PATENT_EXPERT' || ((currentUserRole === 'PatentExpert' || currentUserRole === 'PATENT_EXPERT') && memberRole === 'PATENT_EXPERT');
  const isAdmin = currentUserRole === 'Admin';
  const isReviewer = isAssignedGuide || isAssignedExpert || isAdmin;

  const canReviewGuide = (isAssignedGuide || isAdmin) && project?.stage === 'GUIDE_REVIEW';
  const canReviewExpert = (isAssignedExpert || isAdmin) && project?.stage === 'PATENT_EXPERT_REVIEW';
  const isActiveReviewStage = canReviewGuide || canReviewExpert;

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
  const existingReviewForUser = isAssignedGuide ? latestGuideReview : isAssignedExpert ? latestExpertReview : (latestGuideReview || latestExpertReview);

  const assignedGuide = project?.members?.find((m: any) => m.role === 'GUIDE')?.user;
  const assignedExpert = project?.members?.find((m: any) => m.role === 'PATENT_EXPERT')?.user;

  const hasChangesRequested =
    latestGuideReview?.decision === 'CHANGES_REQUESTED' ||
    latestExpertReview?.decision === 'CHANGES_REQUESTED' ||
    reviews.some((r) => r.decision === 'CHANGES_REQUESTED');

  const isFullyApproved =
    project?.stage === 'FILING_READY' ||
    project?.stage === 'FILED' ||
    (latestGuideReview?.decision === 'APPROVED' && latestExpertReview?.decision === 'APPROVED');

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

  // Computed average rubric score
  const computedRubricAverage = (
    (rubricScores.noveltyScore +
      rubricScores.specificationClarity +
      rubricScores.industrialApplicability +
      rubricScores.ftoRiskClearance) /
    4
  ).toFixed(1);

  // Submit Observation Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/projects/${projectId}/comments`, { content: commentInput.trim() });
      toast.success('Observation note posted successfully.');
      if (res.data?.comment) {
        setComments((prev) => [res.data.comment, ...prev]);
      }
      setCommentInput('');
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post note.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Submit Review Action from Modal or Action Deck
  const handleSubmitReviewDecision = async (
    reviewType: 'GUIDE_REVIEW' | 'EXPERT_REVIEW',
    decision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED',
    commentsText?: string,
    snapshotData?: any
  ) => {
    if ((decision === 'CHANGES_REQUESTED' || decision === 'REJECTED') && (!commentsText || !commentsText.trim())) {
      toast.error('A written explanation is required for this action.');
      return;
    }

    setSubmittingDecision(true);
    try {
      const payload: any = {
        reviewType,
        decision,
        comments: commentsText?.trim() || null,
      };

      if (snapshotData) {
        payload.checklistSnapshot = snapshotData;
      }

      const res = await api.post(`/projects/${projectId}/reviews`, payload);

      const actionText =
        decision === 'APPROVED'
          ? 'Review approved successfully! Workflow advanced.'
          : decision === 'CHANGES_REQUESTED'
          ? 'Changes requested successfully. Project returned to documentation.'
          : 'Review rejected.';
      toast.success(actionText);

      // Optimistically update local review list
      if (res.data?.review) {
        setReviews((prev) => [res.data.review, ...prev.filter((r) => r.id !== res.data.review.id)]);
      }

      // Reset
      setModalReason('');
      setDeckComments('');
      setShowEditDeck(false);

      // Refresh data
      fetchReviews();
      fetchReadiness();
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to submit review decision.';
      toast.error(errMsg);
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Submit directly from the Active Reviewer Action Deck
  const handleDeckSubmit = () => {
    const reviewType = isAssignedGuide || (!isAssignedExpert && canReviewGuide) ? 'GUIDE_REVIEW' : 'EXPERT_REVIEW';
    const snapshot = {
      checklist: rubricChecklist,
      scores: rubricScores,
      averageScore: computedRubricAverage,
      evaluatedAt: new Date().toISOString(),
      evaluatorRole: reviewType,
    };
    handleSubmitReviewDecision(reviewType, activeDecisionSelection, deckComments, snapshot);
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
      fetchReadiness();
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resubmit project for review.');
    } finally {
      setSubmittingResubmit(false);
    }
  };

  // Initial submission for review
  const handleInitialSubmit = async () => {
    setSubmittingResubmit(true);
    try {
      await api.put(`/projects/${projectId}`, { stage: 'GUIDE_REVIEW' });
      toast.success('Project successfully submitted for Faculty Guide Review!');
      fetchReviews();
      fetchReadiness();
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit project for review.');
    } finally {
      setSubmittingResubmit(false);
    }
  };

  // Generate Formal Review & Clearance Endorsement Certificate PDF
  const handleGenerateCertificatePdf = () => {
    try {
      setGeneratingPdf(true);
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Background accent
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageWidth, 842, 'F');

      // Top Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 90, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('PATENTHUB-AI | OFFICIAL REVIEW ENDORSEMENT DOSSIER', 40, 45);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Formal Supervisor Evaluation & Legal Claims Clearance Certificate', 40, 65);

      // Certificate Metadata Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(40, 110, pageWidth - 80, 130, 8, 8, 'FD');

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INVENTION DISCLOSURE SPECIFICATIONS', 55, 135);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Project Title: ${project?.title || 'Patent Project'}`, 55, 155);
      doc.text(`Lead Inventor: ${project?.owner?.fullName || 'N/A'} (@${project?.owner?.username || 'N/A'})`, 55, 172);
      doc.text(`Institution: ${project?.owner?.institution || 'Academic Institution'}`, 55, 189);
      doc.text(`Technical Domain: ${project?.technicalDomain || 'General'} | Category: ${project?.category || 'Technology'}`, 55, 206);
      doc.text(`Workflow Stage: ${project?.stage?.replace(/_/g, ' ')} | Readiness Index: ${filingScore}%`, 55, 223);

      // Guide Review Section
      doc.roundedRect(40, 255, pageWidth - 80, 150, 8, 8, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('1. FACULTY GUIDE ACADEMIC ENDORSEMENT', 55, 280);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const guideStatus = latestGuideReview?.decision || (project?.stage === 'GUIDE_REVIEW' ? 'PENDING' : 'NOT_SUBMITTED');
      doc.text(`Decision Status: ${guideStatus.replace(/_/g, ' ')}`, 55, 300);
      doc.text(`Evaluated By: ${latestGuideReview?.reviewer?.fullName || assignedGuide?.fullName || 'Assigned Faculty Guide'}`, 55, 317);
      doc.text(`Decision Date: ${latestGuideReview?.createdAt ? new Date(latestGuideReview.createdAt).toLocaleString() : 'N/A'}`, 55, 334);
      doc.setFont('helvetica', 'italic');
      const guideComment = latestGuideReview?.comments || 'Formal supervisor evaluation endorsed technical viability.';
      const splitGuideComment = doc.splitTextToSize(`Supervisor Remarks: "${guideComment}"`, pageWidth - 110);
      doc.text(splitGuideComment, 55, 355);

      // Expert Legal Review Section
      doc.setFont('helvetica', 'normal');
      doc.roundedRect(40, 420, pageWidth - 80, 150, 8, 8, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('2. PATENT EXPERT LEGAL CLAIMS CLEARANCE', 55, 445);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const expertStatus = latestExpertReview?.decision || (project?.stage === 'PATENT_EXPERT_REVIEW' ? 'PENDING' : 'AWAITING_GUIDE');
      doc.text(`Decision Status: ${expertStatus.replace(/_/g, ' ')}`, 55, 465);
      doc.text(`Legal Reviewer: ${latestExpertReview?.reviewer?.fullName || assignedExpert?.fullName || 'Assigned Patent Attorney'}`, 55, 482);
      doc.text(`Clearance Date: ${latestExpertReview?.createdAt ? new Date(latestExpertReview.createdAt).toLocaleString() : 'N/A'}`, 55, 499);
      doc.setFont('helvetica', 'italic');
      const expertComment = latestExpertReview?.comments || 'Patent claims and drawing sheets statutory clearance verified.';
      const splitExpertComment = doc.splitTextToSize(`Legal Examiner Notes: "${expertComment}"`, pageWidth - 110);
      doc.text(splitExpertComment, 55, 520);

      // Audit Stamp / Verification Box
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(40, 585, pageWidth - 80, 130, 8, 8, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('STATUTORY IPO COMPLIANCE & FILING READINESS VERIFICATION', 55, 610);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`• Total Official Audit Decisions: ${reviews.length} records logged`, 55, 630);
      doc.text(`• Indian Patent Office Mandatory Forms (Form 1, 2, 3, 5): Checked & Pre-populated`, 55, 645);
      doc.text(`• Claims Hierarchy and Prior Art Citations: Evaluated under Section 3/4 Statutory Eligibility`, 55, 660);
      doc.text(`• Certificate Issue Timestamp: ${new Date().toUTCString()}`, 55, 675);
      doc.text(`• Verification Signature Hash: PH-${projectId.slice(0, 8).toUpperCase()}-${Date.now()}`, 55, 690);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('PatentHub-AI Automated IP Lifecycle Governance • Intellectual Property Office Compliance System', pageWidth / 2, 810, { align: 'center' });

      doc.save(`PatentHub_Review_Endorsement_${projectId.slice(0, 8)}.pdf`);
      toast.success('Official Review Endorsement PDF generated successfully!');
    } catch (err) {
      console.error('Failed to generate review certificate PDF', err);
      toast.error('Failed to generate PDF dossier.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Helper for Status Badge
  const renderStatusBadge = (decision?: string, stage?: string, isGuideCard = true) => {
    if (decision === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Endorsed
        </span>
      );
    }
    if (decision === 'CHANGES_REQUESTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5" /> Changes Requested
        </span>
      );
    }
    if (decision === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    }
    if (isGuideCard && stage === 'GUIDE_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
          <Clock className="w-3.5 h-3.5" /> Pending Guide Review
        </span>
      );
    }
    if (!isGuideCard && stage === 'PATENT_EXPERT_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
          <Clock className="w-3.5 h-3.5" /> Pending Legal Review
        </span>
      );
    }
    if (!isGuideCard && (stage === 'FILING_READY' || stage === 'FILED')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Cleared for Filing
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <Clock className="w-3.5 h-3.5" /> {isGuideCard ? 'Awaiting Submission' : 'Awaiting Guide Approval'}
      </span>
    );
  };

  // State Views: Unauthorized, Error
  if (unauthorized) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
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
      <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Unable to load reviews</h3>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={fetchReviews}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  // Filtered reviews for timeline
  const filteredReviews = reviews.filter((r) => {
    if (timelineFilter === 'ALL') return true;
    return r.reviewType === timelineFilter;
  });

  return (
    <div className="space-y-7">
      {/* 1. Header Banner & Lifecycle Stepper */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Official Review Center
              </span>
              <span className="text-xs font-semibold text-slate-400">Project Ref: #{projectId.slice(0, 8)}</span>
              {isFullyApproved && (
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Clearance Certified
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{project?.title || 'Patent Project'}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Domain:</span>
                <span className="font-semibold text-slate-800">{project?.technicalDomain || 'General'}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Stage:</span>
                <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                  {project?.stage?.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Readiness Index:</span>
                <span className="font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                  {filingScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canSubmitForReview && (
              <button
                type="button"
                disabled={submittingResubmit}
                onClick={hasChangesRequested ? () => setShowResubmitModal(true) : handleInitialSubmit}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 transition"
              >
                {submittingResubmit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{hasChangesRequested ? 'Resubmit for Review' : 'Submit for Guide Review'}</span>
              </button>
            )}

            <button
              type="button"
              disabled={generatingPdf}
              onClick={handleGenerateCertificatePdf}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition"
              title="Download formal review endorsement certificate"
            >
              {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download Review Dossier PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                fetchReviews();
                fetchReadiness();
                fetchArtifacts();
              }}
              className="p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs transition cursor-pointer"
              title="Refresh reviews data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Visual 4-Stage Lifecycle Stepper */}
        <div className="pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
            Invention Review & Clearance Pipeline
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Step 1 */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                project?.stage !== 'IDEA' && project?.stage !== 'LITERATURE_REVIEW'
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : 'bg-blue-50 border-blue-200 text-blue-950'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Stage 01</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-xs font-extrabold">Documentation & Specs</h4>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">Abstract, claims & forms drafted</p>
            </div>

            {/* Step 2 */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                latestGuideReview?.decision === 'APPROVED'
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : project?.stage === 'GUIDE_REVIEW'
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 text-blue-950'
                  : latestGuideReview?.decision === 'CHANGES_REQUESTED'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Stage 02</span>
                {latestGuideReview?.decision === 'APPROVED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : project?.stage === 'GUIDE_REVIEW' ? (
                  <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
              <h4 className="text-xs font-extrabold">Faculty Guide Review</h4>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">Academic novelty & invention check</p>
            </div>

            {/* Step 3 */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                latestExpertReview?.decision === 'APPROVED' || project?.stage === 'FILING_READY' || project?.stage === 'FILED'
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : project?.stage === 'PATENT_EXPERT_REVIEW'
                  ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950'
                  : latestExpertReview?.decision === 'CHANGES_REQUESTED'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Stage 03</span>
                {latestExpertReview?.decision === 'APPROVED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : project?.stage === 'PATENT_EXPERT_REVIEW' ? (
                  <Clock className="w-4 h-4 text-indigo-600 animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
              <h4 className="text-xs font-extrabold">Patent Expert Legal Review</h4>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">Claims boundary & FTO clearance</p>
            </div>

            {/* Step 4 */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                project?.stage === 'FILING_READY' || project?.stage === 'FILED'
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Stage 04</span>
                {project?.stage === 'FILING_READY' || project?.stage === 'FILED' ? (
                  <Award className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
              <h4 className="text-xs font-extrabold">IPO Filing Clearance</h4>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">Pre-filing package certified</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Urgent Attention Alert (If Changes Requested) */}
      {hasChangesRequested && (
        <div className="p-5 bg-amber-50/90 border-2 border-amber-300 rounded-3xl text-amber-950 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-amber-900">Review Feedback Requires Action</h4>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                The assigned supervisor or legal reviewer requested revisions on your project. Please review their comments, update your specifications, claims, or forms, and resubmit for evaluation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('Claims Studio')}
              className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5" /> Claims Studio
            </button>
            <button
              type="button"
              onClick={() => setShowResubmitModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Resubmit Project
            </button>
          </div>
        </div>
      )}

      {/* 3. Review Status Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">Evaluation Sign-Off Status</h3>
          <span className="text-xs text-slate-400 font-medium">Dual-Track Academic & Legal Governance</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Guide Review Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-sm border border-blue-100">
                    GR
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Faculty Guide Review</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Academic supervision & technical validation</p>
                  </div>
                </div>
                {renderStatusBadge(latestGuideReview?.decision, project?.stage, true)}
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs space-y-2 font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Assigned Guide:</span>
                  <span className="text-slate-900 font-bold">
                    {latestGuideReview?.reviewer?.fullName || assignedGuide?.fullName || 'Assigned Faculty Guide'}
                  </span>
                </div>
                {latestGuideReview?.createdAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Sign-Off Date:</span>
                    <span className="text-slate-700 font-semibold">
                      {new Date(latestGuideReview.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Supervisor Remarks:</span>
                  <p className="text-[11px] text-slate-700 italic leading-relaxed font-medium bg-white p-2.5 rounded-xl border border-slate-200/70">
                    "{latestGuideReview?.comments || 'Project submitted for formal supervisor evaluation and invention endorsement.'}"
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {latestGuideReview && (
                <button
                  type="button"
                  onClick={() => setSelectedReviewDetails(latestGuideReview)}
                  className="w-full py-2 text-xs text-blue-700 hover:text-blue-800 font-bold bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-xl transition text-center"
                >
                  View Full Decision Details
                </button>
              )}
            </div>
          </div>

          {/* Patent Expert Review Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm border border-indigo-100">
                    PR
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Patent Expert Legal Review</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Claims clearance, FTO analysis & statutory forms</p>
                  </div>
                </div>
                {renderStatusBadge(latestExpertReview?.decision, project?.stage, false)}
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs space-y-2 font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Legal Examiner:</span>
                  <span className="text-slate-900 font-bold">
                    {latestExpertReview?.reviewer?.fullName || assignedExpert?.fullName || 'Assigned Patent Attorney'}
                  </span>
                </div>
                {latestExpertReview?.createdAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Sign-Off Date:</span>
                    <span className="text-slate-700 font-semibold">
                      {new Date(latestExpertReview.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Legal Examiner Notes:</span>
                  <p className="text-[11px] text-slate-700 italic leading-relaxed font-medium bg-white p-2.5 rounded-xl border border-slate-200/70">
                    "{latestExpertReview?.comments || 'Patent claims structure, Form 1 & 2 pre-checks, and FTO compliance audit pending.'}"
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {latestExpertReview && (
                <button
                  type="button"
                  onClick={() => setSelectedReviewDetails(latestExpertReview)}
                  className="w-full py-2 text-xs text-indigo-700 hover:text-indigo-800 font-bold bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl transition text-center"
                >
                  View Full Decision Details
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Active Reviewer Evaluation Deck & Interactive Scoring Matrix */}
      {isReviewer && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-7 shadow-lg border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-black tracking-tight">
                  {isAssignedGuide || (!isAssignedExpert && canReviewGuide)
                    ? 'Faculty Guide Evaluation Deck'
                    : 'Patent Expert Legal Examination Deck'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {isAssignedGuide || (!isAssignedExpert && canReviewGuide)
                  ? 'Examine student disclosures, score novelty criteria, provide actionable instructions, and record your formal endorsement.'
                  : 'Validate legal claim boundaries, check Form 1/2/3/5 compliance, and certify the invention for statutory IPO filing readiness.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              {existingReviewForUser && !showEditDeck && (
                <button
                  type="button"
                  onClick={() => {
                    if (existingReviewForUser.comments) {
                      setDeckComments(existingReviewForUser.comments);
                    }
                    if (existingReviewForUser.decision) {
                      setActiveDecisionSelection(existingReviewForUser.decision as any);
                    }
                    setShowEditDeck(true);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>Update Notes / Decision</span>
                </button>
              )}
              {showEditDeck && (
                <button
                  type="button"
                  onClick={() => setShowEditDeck(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                >
                  <span>Hide Editor</span>
                </button>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {isActiveReviewStage ? 'Active Review Stage' : 'Official Review Logged'}
              </span>
            </div>
          </div>

          {/* If review already completed and editor not toggled, show the completed review dossier banner */}
          {!isActiveReviewStage && existingReviewForUser && !showEditDeck ? (
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-black text-white">Your Evaluation Has Been Formally Recorded</h4>
                    <p className="text-xs text-slate-400">
                      Logged by {existingReviewForUser.reviewer?.fullName || 'Assigned Reviewer'} on {existingReviewForUser.createdAt ? new Date(existingReviewForUser.createdAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    existingReviewForUser.decision === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : existingReviewForUser.decision === 'CHANGES_REQUESTED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {(existingReviewForUser.decision || 'LOGGED').replace(/_/g, ' ')}
                </span>
              </div>

              {existingReviewForUser.comments && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Official Supervisor Remarks:</span>
                  <div className="text-xs text-slate-200 bg-slate-900/90 p-3.5 rounded-xl border border-slate-700 font-medium leading-relaxed italic">
                    "{existingReviewForUser.comments}"
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (existingReviewForUser.comments) {
                      setDeckComments(existingReviewForUser.comments);
                    }
                    if (existingReviewForUser.decision) {
                      setActiveDecisionSelection(existingReviewForUser.decision as any);
                    }
                    setShowEditDeck(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Update Notes / Re-evaluate</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Interactive Rubric Checklist & Scoring Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
                {/* Left: Statutory Compliance Checklist */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      Statutory Evaluation Checklist
                    </h4>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {Object.values(rubricChecklist).filter(Boolean).length} of 6 Checked
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { id: 'novelty', label: 'Novelty & Inventive Step (Non-obvious over prior art citations)' },
                      { id: 'nonObviousness', label: 'Technical Enablement & Sufficient Disclosure Description' },
                      { id: 'statutorySubjectMatter', label: 'Section 3 & 4 Statutory Eligibility (Non-excluded subject matter)' },
                      { id: 'claimsPrecision', label: 'Claims Drafting Precision (Independent Claim 1 + Dependent Hierarchy)' },
                      { id: 'drawingCompliance', label: 'Drawing Sheets Compliance (Black/white line art, Rule 15 numerals)' },
                      { id: 'statutoryForms', label: 'Mandatory IPO Forms Completeness (Form 1, 2, 3, 5 Validated)' },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-700/40 cursor-pointer transition select-none"
                      >
                        <input
                          type="checkbox"
                          checked={rubricChecklist[item.id]}
                          onChange={(e) =>
                            setRubricChecklist((prev) => ({ ...prev, [item.id]: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-blue-500 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-slate-300 leading-snug font-medium">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Right: Rubric Scoring Sliders */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-400" />
                      Quantitative Evaluation Score
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-500/30 text-blue-300 border border-blue-400/30">
                      Avg: {computedRubricAverage} / 10
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 font-semibold mb-1">
                        <span>Novelty & Inventive Step</span>
                        <span className="text-blue-400 font-bold">{rubricScores.noveltyScore}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={rubricScores.noveltyScore}
                        onChange={(e) => setRubricScores({ ...rubricScores, noveltyScore: Number(e.target.value) })}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 font-semibold mb-1">
                        <span>Specification & Claims Clarity</span>
                        <span className="text-blue-400 font-bold">{rubricScores.specificationClarity}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={rubricScores.specificationClarity}
                        onChange={(e) => setRubricScores({ ...rubricScores, specificationClarity: Number(e.target.value) })}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 font-semibold mb-1">
                        <span>Industrial Applicability & Practicality</span>
                        <span className="text-blue-400 font-bold">{rubricScores.industrialApplicability}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={rubricScores.industrialApplicability}
                        onChange={(e) => setRubricScores({ ...rubricScores, industrialApplicability: Number(e.target.value) })}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 font-semibold mb-1">
                        <span>Freedom to Operate & Risk Clearance</span>
                        <span className="text-blue-400 font-bold">{rubricScores.ftoRiskClearance}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={rubricScores.ftoRiskClearance}
                        onChange={(e) => setRubricScores({ ...rubricScores, ftoRiskClearance: Number(e.target.value) })}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Decision & Written Notes Form */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Evaluation Decision:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveDecisionSelection('APPROVED')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                        activeDecisionSelection === 'APPROVED'
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md ring-2 ring-emerald-400/40'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Advance</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveDecisionSelection('CHANGES_REQUESTED')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                        activeDecisionSelection === 'CHANGES_REQUESTED'
                          ? 'bg-amber-600 border-amber-500 text-white shadow-md ring-2 ring-amber-400/40'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Request Revisions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveDecisionSelection('REJECTED')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                        activeDecisionSelection === 'REJECTED'
                          ? 'bg-rose-600 border-rose-500 text-white shadow-md ring-2 ring-rose-400/40'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Submission</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Official Review Notes & Actionable Feedback:
                  </label>
                  <textarea
                    rows={3}
                    value={deckComments}
                    onChange={(e) => setDeckComments(e.target.value)}
                    placeholder={
                      activeDecisionSelection === 'APPROVED'
                        ? 'State formal endorsement rationale, supervisor approval notes, or filing sign-off comments...'
                        : 'Specify exact corrections needed (e.g. clarify claims 2-4, label Figure 3 components, complete Form 2)...'
                    }
                    className="w-full px-4 py-3 text-xs bg-slate-800 border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={submittingDecision || (activeDecisionSelection !== 'APPROVED' && !deckComments.trim())}
                    onClick={handleDeckSubmit}
                    className={`px-6 py-3 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 transition ${
                      activeDecisionSelection === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : activeDecisionSelection === 'CHANGES_REQUESTED'
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {submittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>
                      {activeDecisionSelection === 'APPROVED'
                        ? canReviewGuide
                          ? 'Submit Approval & Advance to Legal Review'
                          : 'Submit Legal Approval & Mark Filing Ready'
                        : activeDecisionSelection === 'CHANGES_REQUESTED'
                        ? 'Submit Changes Request'
                        : 'Confirm Review Rejection'}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 5. Invention Artifacts Quick-Inspection Hub */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">Invention Artifacts Quick-Inspection</h3>
            <p className="text-xs text-slate-500 font-medium">
              Review invention materials, legal claims, drawing figures, and IPO forms without leaving the Review page
            </p>
          </div>
          {/* Sub-tab navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveInspectTab('specs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeInspectTab === 'specs' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" /> Specs
            </button>
            <button
              type="button"
              onClick={() => setActiveInspectTab('claims')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeInspectTab === 'claims' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-purple-600" /> Claims ({projectClaims.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveInspectTab('drawings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeInspectTab === 'drawings' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-rose-600" /> Figures ({projectFigures.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveInspectTab('forms')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeInspectTab === 'forms' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-teal-600" /> Forms
            </button>
            <button
              type="button"
              onClick={() => setActiveInspectTab('references')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeInspectTab === 'references' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-amber-600" /> Prior Art ({projectReferences.length})
            </button>
          </div>
        </div>

        {/* Inspect Tab 1: Specs & Problem/Solution */}
        {activeInspectTab === 'specs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Problem Statement</span>
              <p className="text-slate-700 font-medium leading-relaxed">
                {project?.problemStatement || 'No problem statement recorded.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Proposed Solution</span>
              <p className="text-slate-700 font-medium leading-relaxed">
                {project?.proposedSolution || 'No proposed solution recorded.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 md:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Novel Features & Inventive Step</span>
              <p className="text-slate-700 font-medium leading-relaxed">
                {project?.novelFeatures || project?.innovationIdea || 'Novel features specification defined.'}
              </p>
            </div>
          </div>
        )}

        {/* Inspect Tab 2: Claims Hierarchy */}
        {activeInspectTab === 'claims' && (
          <div className="space-y-3">
            {projectClaims.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                No formal claims saved in Claims Studio yet.
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('Claims Studio')}
                    className="ml-2 font-bold text-blue-600 hover:underline"
                  >
                    Open Claims Studio
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {projectClaims.map((claim: any, idx: number) => (
                  <div key={claim.id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">
                        Claim {claim.claimNumber || idx + 1} ({claim.claimType || 'INDEPENDENT'})
                      </span>
                      {claim.dependsOn && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          Depends on Claim {claim.dependsOn}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">{claim.claimText}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inspect Tab 3: Figures & Drawings */}
        {activeInspectTab === 'drawings' && (
          <div className="space-y-3">
            {projectFigures.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                No technical drawings uploaded yet.
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('Drawings')}
                    className="ml-2 font-bold text-blue-600 hover:underline"
                  >
                    Open Drawings Studio
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {projectFigures.map((fig: any, idx: number) => (
                  <div key={fig.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <div className="h-32 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                      {fig.imageUrl ? (
                        <img src={fig.imageUrl} alt={fig.title} className="h-full object-contain p-2" />
                      ) : (
                        <Cpu className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <h5 className="font-bold text-slate-900 truncate">{fig.title || `Figure ${idx + 1}`}</h5>
                    <p className="text-[10px] text-slate-500 line-clamp-2">{fig.caption || 'Technical figure diagram'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inspect Tab 4: Statutory Forms */}
        {activeInspectTab === 'forms' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { name: 'Form 1', desc: 'Application for Grant of Patent', mandatory: true },
              { name: 'Form 2', desc: 'Provisional / Complete Specification', mandatory: true },
              { name: 'Form 3', desc: 'Statement & Undertaking (Sec 8)', mandatory: true },
              { name: 'Form 5', desc: 'Declaration as to Inventorship', mandatory: true },
            ].map((f, i) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-slate-900">{f.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                      Configured
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">{f.desc}</p>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('Forms & Filing')}
                    className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 transition"
                  >
                    View in Forms Center
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Inspect Tab 5: Prior Art References */}
        {activeInspectTab === 'references' && (
          <div className="space-y-2.5">
            {projectReferences.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                No prior art patent references saved yet.
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('Prior Art Search')}
                    className="ml-2 font-bold text-blue-600 hover:underline"
                  >
                    Open Prior Art Search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {projectReferences.map((ref: any, idx: number) => (
                  <div key={ref.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">{ref.patentNumber || `Ref #${idx + 1}`}</span>
                      <span className="text-[10px] font-bold text-slate-500">Risk Score: {ref.similarityScore || 'Low'}</span>
                    </div>
                    <p className="text-slate-700 font-medium text-[11px]">{ref.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. 6-Point Statutory Filing Readiness Diagnostic */}
      {readinessData && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Statutory 6-Point Filing Readiness Audit</h3>
              <p className="text-xs text-slate-500 font-medium">Official IPO pre-filing compliance checks</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                readinessData.overallReadiness === 'READY'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {readinessData.completedCount} of {readinessData.totalRequiredCount} Criteria Met
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {readinessData.checklist?.map((item) => (
              <div
                key={item.key}
                className={`p-3.5 rounded-2xl border flex items-start gap-2.5 transition ${
                  item.completed
                    ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/40 border-amber-200 text-amber-950'
                }`}
              >
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <h5 className="font-bold text-xs">{item.title}</h5>
                  <p className="text-[10px] text-slate-600 leading-normal font-medium">{item.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Review Timeline & History */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">Review Timeline & Historical Audit Logs</h3>
            <p className="text-xs text-slate-500 font-medium">Immutable audit trail of all supervisor and legal clearances</p>
          </div>
          {/* Timeline Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setTimelineFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timelineFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              type="button"
              onClick={() => setTimelineFilter('GUIDE_REVIEW')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timelineFilter === 'GUIDE_REVIEW' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Guide Reviews ({guideReviews.length})
            </button>
            <button
              type="button"
              onClick={() => setTimelineFilter('EXPERT_REVIEW')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timelineFilter === 'EXPERT_REVIEW' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Legal Reviews ({expertReviews.length})
            </button>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700 uppercase">No review audit logs in this category</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Formal supervisor decisions will appear here as reviews are completed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((rev) => {
              const isApproved = rev.decision === 'APPROVED';
              const isChanges = rev.decision === 'CHANGES_REQUESTED';
              return (
                <div
                  key={rev.id}
                  className={`p-4 rounded-2xl border transition ${
                    isApproved
                      ? 'bg-emerald-50/25 border-emerald-200 hover:border-emerald-300'
                      : isChanges
                      ? 'bg-amber-50/25 border-amber-200 hover:border-amber-300'
                      : 'bg-rose-50/25 border-rose-200 hover:border-rose-300'
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
                      <span className="text-xs font-black text-slate-900">
                        {rev.reviewType === 'GUIDE_REVIEW' ? 'Faculty Guide Review' : 'Patent Expert Legal Review'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isChanges
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {(rev.decision || 'LOGGED').replace(/_/g, ' ')}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 font-semibold">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : 'N/A'}
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
                          {formatRoleName(rev.reviewer.role)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedReviewDetails(rev)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      View Full Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. Observation Comments & Collaboration Thread */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">Project Review Dialogue & Observations</h3>
            <p className="text-xs text-slate-500 font-medium">Direct communication between inventors and reviewers</p>
          </div>
          <span className="text-xs font-bold text-slate-400">{comments.length} notes</span>
        </div>

        {/* Comment input */}
        <form onSubmit={handlePostComment} className="space-y-2">
          <textarea
            rows={2}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Add an observation note, revision response, or clarification query for the reviewers..."
            className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 font-medium"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingComment || !commentInput.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
              <span>Post Note</span>
            </button>
          </div>
        </form>

        {/* Comments list */}
        <div className="space-y-2.5 pt-2">
          {comments && comments.length > 0 ? (
            comments.map((c: any) => (
              <div key={c.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{c.user?.fullName || c.user?.username || 'User'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-700">
                      {formatRoleName(c.user?.role)}
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

      {/* Resubmit for Review Modal */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Resubmit for Faculty Guide Review</h3>
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
                placeholder="Briefly explain what corrections were made (e.g. updated claims hierarchy, labeled figure parts, pre-populated Form 2)..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResubmitModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingResubmit}
                onClick={handleResubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Review Decision & Rubric Snapshot</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReviewDetails(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Review Stage</span>
                  <span className="font-black text-slate-800">
                    {selectedReviewDetails.reviewType === 'GUIDE_REVIEW' ? 'Faculty Guide Review' : 'Patent Expert Legal Review'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Decision</span>
                  <span
                    className={`font-black uppercase inline-block px-2 py-0.5 rounded text-[10px] ${
                      selectedReviewDetails.decision === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedReviewDetails.decision === 'CHANGES_REQUESTED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {(selectedReviewDetails.decision || 'LOGGED').replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reviewer</span>
                  <span className="font-bold text-slate-800">
                    {selectedReviewDetails.reviewer?.fullName || 'Reviewer'} (@{selectedReviewDetails.reviewer?.username || 'user'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Time</span>
                  <span className="text-slate-700 font-medium">
                    {selectedReviewDetails.createdAt ? new Date(selectedReviewDetails.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Written Feedback & Instructions:</span>
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 leading-relaxed font-medium">
                  {selectedReviewDetails.comments || 'No written commentary was recorded for this review.'}
                </div>
              </div>

              {selectedReviewDetails.checklistSnapshot && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Evaluated Rubric Snapshot:</span>
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-2xl text-[10px] overflow-x-auto max-h-40 font-mono">
                    {JSON.stringify(selectedReviewDetails.checklistSnapshot, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedReviewDetails(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
