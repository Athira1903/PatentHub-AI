import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Search, FileCheck, RefreshCw, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface ReviewQueueItem {
  id: string;
  projectId: string;
  type: string;
  category: 'Claims' | 'Documents' | 'Drawings' | 'Projects';
  title: string;
  note: string;
  badge: string;
  badgeColor: string;
}

export const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [queueTab, setQueueTab] = useState<'All' | 'Claims' | 'Documents' | 'Drawings' | 'Projects'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects/analytics/guide');
      setReviewQueue(res.data.reviewQueue || []);
    } catch (err) {
      console.error('Failed to load review queue', err);
      toast.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredQueue = reviewQueue.filter((item) => {
    const matchesTab = queueTab === 'All' || item.category === queueTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.note.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              Review Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Supervise claims drafting, document uploads, and project submissions requiring actions.
            </p>
          </div>
        </div>

        <button
          onClick={fetchReviews}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition cursor-pointer"
          title="Refresh reviews"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* Tabs & Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap gap-1">
          {(['All', 'Claims', 'Documents', 'Drawings', 'Projects'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setQueueTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                queueTab === tab ? 'bg-emerald-800 text-white shadow-3xs' : 'bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search review items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 shadow-3xs focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Review Queue Items */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm font-medium">Loading review requests...</div>
      ) : filteredQueue.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Review Queue Empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-medium">
              Excellent! No pending project milestones, claims, or document submissions require your supervision.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQueue.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/dashboard/projects/${item.projectId}?tab=Reviews`)}
              className="p-5 bg-white border border-slate-200/80 hover:border-emerald-600 hover:shadow-xs rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    {item.type}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-800 transition truncate mt-0.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    {item.note}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 self-end sm:self-auto shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${item.badgeColor}`}>
                  {item.badge}
                </span>
                <div className="px-4 py-2 bg-[#004d40] hover:bg-[#00382e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-3xs">
                  <span>Perform Review</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
