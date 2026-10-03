import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  RefreshCw,
  X,
  Send,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface ReviewerInfo {
  id: string;
  fullName: string;
  username: string;
  role?: string | { name: string };
}

interface ProjectReviewRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  projectStage: string;
  reviewerId: string;
  reviewer: ReviewerInfo;
  reviewType: string; // "GUIDE_REVIEW" or "EXPERT_REVIEW"
  decision: string; // "APPROVED", "REJECTED", "CHANGES_REQUESTED", "PENDING"
  comments: string | null;
  checklistSnapshot?: any;
  createdAt: string;
  updatedAt: string;
}

export const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<ProjectReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'PENDING'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'GUIDE_REVIEW' | 'EXPERT_REVIEW'>('ALL');

  // Selected Review for modal
  const [selectedReview, setSelectedReview] = useState<ProjectReviewRecord | null>(null);
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // 1. Fetch user's authorized projects
      const projRes = await api.get('/projects');
      const projects = projRes.data?.projects || [];

      // 2. Fetch reviews for each project in parallel
      const reviewPromises = projects.map(async (p: any) => {
        try {
          const revRes = await api.get(`/projects/${p.id}/reviews`);
          const pReviews = revRes.data?.reviews || [];

          // Also check if project is currently in a review stage without a formal decision yet
          const hasPendingReview =
            (p.stage === 'GUIDE_REVIEW' || p.stage === 'PATENT_EXPERT_REVIEW') &&
            !pReviews.some((r: any) => r.decision === 'APPROVED');

          const mappedReviews: ProjectReviewRecord[] = pReviews.map((r: any) => ({
            id: r.id,
            projectId: p.id,
            projectTitle: p.title,
            projectStage: p.stage,
            reviewerId: r.reviewerId,
            reviewer: r.reviewer || { id: r.reviewerId, fullName: 'Assigned Reviewer', username: 'reviewer' },
            reviewType: r.reviewType || (p.stage === 'PATENT_EXPERT_REVIEW' ? 'EXPERT_REVIEW' : 'GUIDE_REVIEW'),
            decision: r.decision || 'PENDING',
            comments: r.comments,
            checklistSnapshot: r.checklistSnapshot,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt || r.createdAt,
          }));

          // If in review stage but no formal review record logged yet, create a pending placeholder item
          if (hasPendingReview && mappedReviews.length === 0) {
            mappedReviews.push({
              id: `pending-${p.id}`,
              projectId: p.id,
              projectTitle: p.title,
              projectStage: p.stage,
              reviewerId: '',
              reviewer: {
                id: '',
                fullName: p.stage === 'GUIDE_REVIEW' ? 'Faculty Guide' : 'Patent Expert',
                username: 'reviewer',
              },
              reviewType: p.stage === 'GUIDE_REVIEW' ? 'GUIDE_REVIEW' : 'EXPERT_REVIEW',
              decision: 'PENDING',
              comments: 'Project has been formally submitted and is awaiting reviewer decision.',
              createdAt: p.updatedAt,
              updatedAt: p.updatedAt,
            });
          }

          return mappedReviews;
        } catch (err) {
          console.warn(`Failed to fetch reviews for project ${p.id}`, err);
          return [];
        }
      });

      const allResults = await Promise.all(reviewPromises);
      const flattened = allResults.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(flattened);
    } catch (err) {
      console.error('Failed to load project reviews', err);
      toast.error('Failed to load project reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (review: ProjectReviewRecord) => {
    setResubmitting(true);
    try {
      await api.put(`/projects/${review.projectId}`, {
        stage: 'GUIDE_REVIEW',
      });
      toast.success('Project successfully resubmitted for Guide Review!');
      setSelectedReview(null);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resubmit project for review.');
    } finally {
      setResubmitting(false);
    }
  };

  // Real statistics
  const pendingCount = reviews.filter((r) => r.decision === 'PENDING').length;
  const changesCount = reviews.filter((r) => r.decision === 'CHANGES_REQUESTED').length;
  const approvedCount = reviews.filter((r) => r.decision === 'APPROVED').length;
  const rejectedCount = reviews.filter((r) => r.decision === 'REJECTED').length;

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    // Status filter
    if (statusFilter !== 'ALL' && r.decision !== statusFilter) return false;

    // Type filter
    if (typeFilter !== 'ALL' && r.reviewType !== typeFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProj = r.projectTitle.toLowerCase().includes(q);
      const matchReviewer = r.reviewer.fullName.toLowerCase().includes(q);
      const matchComments = r.comments?.toLowerCase().includes(q);
      if (!matchProj && !matchReviewer && !matchComments) return false;
    }

    return true;
  });

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
        return {
          label: 'Approved',
          icon: CheckCircle2,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'CHANGES_REQUESTED':
        return {
          label: 'Changes Requested',
          icon: AlertCircle,
          color: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          icon: XCircle,
          color: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      default:
        return {
          label: 'Pending Review',
          icon: Clock,
          color: 'bg-blue-50 text-blue-700 border-blue-200',
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fade-in font-sans pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Reviews
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
              {reviews.length} Total Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Track guide and patent expert feedback on your projects.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-xl transition cursor-pointer shadow-xs self-end sm:self-auto"
          title="Refresh reviews"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 bg-white rounded-2xl border transition cursor-pointer shadow-3xs hover:border-blue-300 ${
            statusFilter === 'PENDING' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200/80'
          }`}
        >
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
            Pending Reviews
          </span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{pendingCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('CHANGES_REQUESTED')}
          className={`p-4 bg-white rounded-2xl border transition cursor-pointer shadow-3xs hover:border-amber-300 ${
            statusFilter === 'CHANGES_REQUESTED' ? 'border-amber-600 ring-2 ring-amber-100' : 'border-slate-200/80'
          }`}
        >
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">
            Changes Requested
          </span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{changesCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-4 bg-white rounded-2xl border transition cursor-pointer shadow-3xs hover:border-emerald-300 ${
            statusFilter === 'APPROVED' ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200/80'
          }`}
        >
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
            Approved
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{approvedCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-4 bg-white rounded-2xl border transition cursor-pointer shadow-3xs hover:border-rose-300 ${
            statusFilter === 'REJECTED' ? 'border-rose-600 ring-2 ring-rose-100' : 'border-slate-200/80'
          }`}
        >
          <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">
            Rejected
          </span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">{rejectedCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Reviews' },
            { id: 'CHANGES_REQUESTED', label: 'Changes Requested' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Review Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full sm:w-44 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600 shadow-3xs cursor-pointer"
          >
            <option value="ALL">All Review Types</option>
            <option value="GUIDE_REVIEW">Faculty Guide Reviews</option>
            <option value="EXPERT_REVIEW">Patent Expert Reviews</option>
          </select>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews by project, reviewer..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 shadow-3xs"
            />
          </div>
        </div>
      </div>

      {/* Reviews Cards List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs font-medium">
          Loading project reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">No reviews available for your projects.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            When you submit your invention projects for Faculty Guide or Patent Expert reviews, all feedback and decision logs will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReviews.map((r) => {
            const badge = getDecisionBadge(r.decision);
            const BadgeIcon = badge.icon;
            const isGuideReview = r.reviewType === 'GUIDE_REVIEW';

            return (
              <div
                key={r.id}
                onClick={() => setSelectedReview(r)}
                className="p-5 sm:p-6 bg-white border border-slate-200/80 hover:border-blue-300 rounded-3xl shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-5 group"
              >
                <div className="space-y-2 max-w-2xl min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        isGuideReview
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {isGuideReview ? 'Guide Review' : 'Patent Expert Review'}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${badge.color}`}>
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-[11px] text-slate-400 font-semibold">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition leading-snug">
                    {r.projectTitle}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <span className="text-slate-400 font-bold">Reviewer:</span>
                    <span className="font-bold text-slate-800">{r.reviewer.fullName}</span>
                  </div>

                  {r.comments && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs text-slate-700 font-medium leading-relaxed">
                      "{r.comments}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/dashboard/projects/${r.projectId}/reviews`)}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    View Review
                  </button>

                  <button
                    onClick={() => navigate(`/dashboard/projects/${r.projectId}/reviews`)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>Open Review Center</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Formal Project Review
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {selectedReview.projectTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Review Decision Status */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Review Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold border flex items-center gap-1.5 ${
                    getDecisionBadge(selectedReview.decision).color
                  }`}
                >
                  <span>{getDecisionBadge(selectedReview.decision).label}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-bold text-slate-500">Review Type:</span>
                <span className="font-bold text-slate-800">
                  {selectedReview.reviewType === 'GUIDE_REVIEW'
                    ? 'Faculty Guide Review'
                    : 'Patent Expert Examination'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">Reviewer:</span>
                <span className="font-bold text-slate-800">{selectedReview.reviewer.fullName}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">Date Logged:</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedReview.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Comments & Requested Changes */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-900 block">
                Reviewer Comments & Feedback
              </span>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium">
                {selectedReview.comments ? (
                  selectedReview.comments
                ) : (
                  <span className="text-slate-400 italic">No written comments provided.</span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => navigate(`/dashboard/projects/${selectedReview.projectId}/reviews`)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open Review Center</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    navigate(`/dashboard/projects/${selectedReview.projectId}?tab=Documents`)
                  }
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Address Changes
                </button>

                {/* Only display Resubmit when decision is CHANGES_REQUESTED */}
                {selectedReview.decision === 'CHANGES_REQUESTED' && (
                  <button
                    onClick={() => handleResubmit(selectedReview)}
                    disabled={resubmitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{resubmitting ? 'Submitting...' : 'Resubmit for Review'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
