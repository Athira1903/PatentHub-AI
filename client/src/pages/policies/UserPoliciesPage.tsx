import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Calendar,
  Building2,
  FileText,
  Clock,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface UserPolicy {
  assignmentId: string;
  policyId: string;
  name: string;
  description?: string;
  rules?: any;
  policyStatus: string;
  assignedAt: string;
  expiresAt?: string | null;
  organizationName: string;
  organization?: {
    id: string;
    name: string;
    contactEmail?: string;
    contactNumber?: string;
    domain?: string;
  };
  assignedBy?: {
    id: string;
    fullName: string;
    username: string;
  };
  status: string;
}

export const UserPoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<UserPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMyPolicies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/policies/my-policies');
      setPolicies(response.data.policies || []);
    } catch (error: any) {
      console.error('Failed to fetch user policies:', error);
      toast.error(error.response?.data?.message || 'Failed to load organizational policies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPolicies();
  }, []);

  const filteredPolicies = policies.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.organizationName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Compliance & Governance
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              My Assigned Policies
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl font-medium">
              View mandatory institutional policies, IP governance terms, and submission guidelines assigned to your account by your organization.
            </p>
          </div>
          <button
            onClick={fetchMyPolicies}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 backdrop-blur-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by policy name, keyword, or organization..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent border-none outline-hidden"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/80 animate-pulse space-y-4">
              <div className="h-5 bg-slate-200 rounded-md w-3/4" />
              <div className="h-4 bg-slate-100 rounded-md w-1/2" />
              <div className="h-16 bg-slate-50 rounded-md w-full" />
            </div>
          ))}
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery ? 'No matching policies found' : 'No policies have been assigned to you.'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {searchQuery
              ? 'Try modifying your search criteria.'
              : 'When your organization administrator assigns patent filing guidelines, governance rules, or compliance policies, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPolicies.map((policy) => {
            const isExpired = policy.expiresAt && new Date(policy.expiresAt) < new Date();
            return (
              <div
                key={policy.assignmentId}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-950 leading-tight">
                          {policy.name}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-medium inline-flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {typeof policy.organizationName === 'object' ? (policy.organizationName as any)?.name : (policy.organizationName || policy.organization?.name || 'Platform Scope')}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                        isExpired
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isExpired ? 'Expired' : 'Active'}
                    </span>
                  </div>

                  {policy.description && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      {policy.description}
                    </p>
                  )}

                  {/* Rules Preview if any */}
                  {policy.rules && (
                    <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/60 text-xs">
                      <span className="font-bold text-indigo-950 block mb-1">
                        Policy Rules & Requirements:
                      </span>
                      {typeof policy.rules === 'object' ? (
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                          {Object.entries(policy.rules).map(([key, val]) => (
                            <li key={key} className="text-[11px]">
                              <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</strong>{' '}
                              {String(val)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-slate-700">{String(policy.rules)}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Metadata Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assigned: {new Date(policy.assignedAt).toLocaleDateString()}</span>
                  </div>
                  {policy.expiresAt ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Expires: {new Date(policy.expiresAt).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">No Expiration Date</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
