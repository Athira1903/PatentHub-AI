import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Building2,
  FolderKanban,
  Calendar,
  Cpu,
  ShieldAlert,
  Download,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Users,
  Scale,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const AdminReportsAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [loading, setLoading] = useState<boolean>(true);
  const [reportsData, setReportsData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'growth' | 'organizations' | 'lifecycle' | 'reviews' | 'deadlines' | 'ai' | 'security'
  >('growth');

  const fetchReports = async (range: string = timeRange) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/reports?timeRange=${range}`);
      setReportsData(res.data);
    } catch (err: any) {
      console.error('Failed to load reports', err);
      toast.error('Failed to compile reports data from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(timeRange);
  }, [timeRange]);

  // Export current active report as CSV
  const exportToCsv = () => {
    if (!reportsData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `patenthub_admin_report_${activeTab}_${timeRange}.csv`;

    if (activeTab === 'growth') {
      csvContent += 'Role,User Count,Percentage\n';
      reportsData.userGrowth.roleBreakdown.forEach((r: any) => {
        csvContent += `"${r.role}",${r.count},${r.percentage}%\n`;
      });
      csvContent += '\nPeriod,New Registrations,Cumulative Users\n';
      reportsData.userGrowth.growthTimeline.forEach((t: any) => {
        csvContent += `"${t.period}",${t.newUsers},${t.cumulative}\n`;
      });
    } else if (activeTab === 'organizations') {
      csvContent += 'Organization,Domain,Members Count,Projects Count,Status\n';
      reportsData.organizationActivity.topOrganizations.forEach((o: any) => {
        csvContent += `"${o.name}","${o.domain}",${o.membersCount},${o.projectsCount},"${o.status}"\n`;
      });
    } else if (activeTab === 'lifecycle') {
      csvContent += 'Patent Stage,Project Count\n';
      Object.entries(reportsData.projectLifecycle.stageDistribution).forEach(([st, cnt]) => {
        csvContent += `"${st}",${cnt}\n`;
      });
    } else if (activeTab === 'reviews') {
      csvContent += 'Review Metric,Value\n';
      csvContent += `"Total Reviews in Period",${reportsData.reviewPerformance.totalReviews}\n`;
      csvContent += `"Pending Reviews",${reportsData.reviewPerformance.pendingReviews}\n`;
      csvContent += `"Approved Reviews",${reportsData.reviewPerformance.approvedReviews}\n`;
      csvContent += `"Rejected Reviews",${reportsData.reviewPerformance.rejectedReviews}\n`;
      csvContent += `"Average Turnaround Days",${reportsData.reviewPerformance.avgTurnaroundDays}\n`;
    } else if (activeTab === 'deadlines') {
      csvContent += 'Project Title,Deadline Type,Due Date,Days Remaining,Status\n';
      reportsData.filingDeadlines.deadlinesList.forEach((d: any) => {
        csvContent += `"${d.projectTitle}","${d.deadlineType}","${d.dueDate}",${d.daysRemaining},"${d.status}"\n`;
      });
    } else if (activeTab === 'ai') {
      csvContent += 'AI Provider,Status,Total Operations In Period\n';
      csvContent += `"${reportsData.aiTelemetry.provider}","${reportsData.aiTelemetry.status}",${reportsData.aiTelemetry.totalOperationsInPeriod}\n`;
      csvContent += '\nOperation Type,Count\n';
      Object.entries(reportsData.aiTelemetry.operationsByType).forEach(([k, v]) => {
        csvContent += `"${k}",${v}\n`;
      });
    } else if (activeTab === 'security') {
      csvContent += 'ID,Action,Actor,Target,Date\n';
      reportsData.securityEvents.recentSecurityActions.forEach((s: any) => {
        csvContent += `"${s.id}","${s.action}","${s.actor}","${s.target}","${s.createdAt}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${activeTab.toUpperCase()} report to CSV`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in print:p-0">
      {/* Top Header & Filters */}
      <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:border-none print:shadow-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#315C55]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#6F8F88]">
              Database-Backed Operational Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#253330] tracking-tight">
            Reports & Analytics Studio
          </h1>
          <p className="text-xs text-[#71807C] font-medium mt-0.5">
            Cross-platform audit telemetry, lifecycle metrics, and filing-readiness performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          {/* Time Range Selector */}
          <div className="flex items-center bg-[#F7F9F8] border border-[#E5EBE8] p-1 rounded-2xl">
            {[
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: '365d', label: '1Y' },
              { id: 'all', label: 'All' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  timeRange === r.id
                    ? 'bg-[#315C55] text-white shadow-3xs'
                    : 'text-[#71807C] hover:text-[#253330]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={exportToCsv}
            disabled={loading || !reportsData}
            className="px-3.5 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] border border-[#E5EBE8] text-[#253330] rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#315C55]" />
            <span>CSV Export</span>
          </button>

          {/* Printable Report */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] border border-[#E5EBE8] text-[#253330] rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Printable Report"
          >
            <Printer className="w-3.5 h-3.5 text-[#315C55]" />
            <span>Print Report</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchReports(timeRange)}
            className="p-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] border border-[#E5EBE8] rounded-2xl text-[#71807C] hover:text-[#253330] transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#315C55]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Report Section Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5EBE8] pb-1 overflow-x-auto print:hidden">
        {[
          { id: 'growth', label: 'User Growth', icon: Users },
          { id: 'organizations', label: 'Organizations', icon: Building2 },
          { id: 'lifecycle', label: 'Project Lifecycle', icon: FolderKanban },
          { id: 'reviews', label: 'Review Turnaround', icon: Scale },
          { id: 'deadlines', label: 'Filing & Deadlines', icon: Calendar },
          { id: 'ai', label: 'AI Telemetry', icon: Cpu },
          { id: 'security', label: 'Security & Audit', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#315C55] text-white shadow-3xs'
                  : 'text-[#5C6B67] hover:bg-[#E5EBE8]/60 hover:text-[#253330]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-16 bg-white border border-[#E5EBE8] rounded-3xl flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-7 h-7 text-[#315C55] animate-spin" />
          <p className="text-xs font-bold text-[#71807C]">Aggregating operational analytics from PostgreSQL...</p>
        </div>
      ) : !reportsData ? (
        <div className="p-16 bg-white border border-[#E5EBE8] rounded-3xl text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-[#253330]">No analytics data available for selected range.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: USER GROWTH */}
          {activeTab === 'growth' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Total Registered</span>
                  <div className="text-3xl font-black text-[#253330] mt-1">{reportsData.userGrowth.totalUsers}</div>
                  <span className="text-xs text-emerald-700 font-bold mt-1 block">
                    +{reportsData.userGrowth.newUsersInPeriod} registered in range
                  </span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Active Accounts</span>
                  <div className="text-3xl font-black text-[#15803D] mt-1">{reportsData.userGrowth.activeUsers}</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">
                    {Math.round((reportsData.userGrowth.activeUsers / (reportsData.userGrowth.totalUsers || 1)) * 100)}% platform active rate
                  </span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Suspended Accounts</span>
                  <div className="text-3xl font-black text-rose-600 mt-1">{reportsData.userGrowth.suspendedUsers}</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Restricted or pending action</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Platform Roles</span>
                  <div className="text-3xl font-black text-[#315C55] mt-1">{reportsData.userGrowth.roleBreakdown.length}</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">RBAC distribution</span>
                </div>
              </div>

              {/* Role Distribution & Growth Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#253330] uppercase tracking-wide">
                      User Distribution by Role
                    </h3>
                    <Users className="w-4 h-4 text-[#71807C]" />
                  </div>
                  <div className="space-y-3">
                    {reportsData.userGrowth.roleBreakdown.map((r: any) => (
                      <div key={r.role} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-[#253330]">
                          <span>{r.role}</span>
                          <span>{r.count} users ({r.percentage}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-[#F0F4F2] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#315C55] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(r.percentage, 4)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#253330] uppercase tracking-wide">
                      Registration Timeline
                    </h3>
                    <TrendingUp className="w-4 h-4 text-[#71807C]" />
                  </div>
                  <div className="space-y-2">
                    {reportsData.userGrowth.growthTimeline.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-[#F7F9F8] rounded-2xl text-xs"
                      >
                        <span className="font-bold text-[#5C6B67]">{item.period}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-emerald-700">+{item.newUsers} new</span>
                          <span className="px-2 py-0.5 bg-white border border-[#E5EBE8] rounded-full font-bold text-[#253330]">
                            {item.cumulative} total
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIZATIONS */}
          {activeTab === 'organizations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Total Organizations</span>
                  <div className="text-3xl font-black text-[#253330] mt-1">
                    {reportsData.organizationActivity.totalOrganizations}
                  </div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Colleges & Universities</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Avg Members per Org</span>
                  <div className="text-3xl font-black text-[#315C55] mt-1">
                    {reportsData.organizationActivity.avgMembersPerOrg}
                  </div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Campus user density</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Active Status</span>
                  <div className="text-3xl font-black text-emerald-700 mt-1">100%</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Institutions in good standing</span>
                </div>
              </div>

              <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
                <h3 className="text-sm font-black text-[#253330] uppercase tracking-wide">
                  Top Institutional Activity
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5EBE8] text-[#71807C] font-black uppercase tracking-wider">
                        <th className="pb-3 px-3">Institution</th>
                        <th className="pb-3 px-3">Domain</th>
                        <th className="pb-3 px-3 text-center">Members</th>
                        <th className="pb-3 px-3 text-center">Projects</th>
                        <th className="pb-3 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EBE8]/60">
                      {reportsData.organizationActivity.topOrganizations.map((org: any) => (
                        <tr key={org.id} className="hover:bg-[#F7F9F8]">
                          <td className="py-3 px-3 font-extrabold text-[#253330]">{org.name}</td>
                          <td className="py-3 px-3 font-mono text-[#71807C]">{org.domain}</td>
                          <td className="py-3 px-3 text-center font-bold text-[#253330]">{org.membersCount}</td>
                          <td className="py-3 px-3 text-center font-bold text-[#315C55]">{org.projectsCount}</td>
                          <td className="py-3 px-3 text-right">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black rounded-full text-[10px]">
                              {org.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROJECT LIFECYCLE */}
          {activeTab === 'lifecycle' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Total Patent Projects</span>
                  <div className="text-3xl font-black text-[#253330] mt-1">{reportsData.projectLifecycle.totalProjects}</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">In invention pipeline</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Filing Ready / Filed</span>
                  <div className="text-3xl font-black text-emerald-700 mt-1">{reportsData.projectLifecycle.filingReadyCount}</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Prepared for Indian Patent Office</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Stalled Projects</span>
                  <div className="text-3xl font-black text-amber-600 mt-1">{reportsData.projectLifecycle.stalledProjects}</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">&gt;30 days without activity</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Avg Project Age</span>
                  <div className="text-3xl font-black text-[#315C55] mt-1">{reportsData.projectLifecycle.avgProjectAgeDays} d</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Average progression timeline</span>
                </div>
              </div>

              {/* Stage Distribution Breakdown */}
              <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
                <h3 className="text-sm font-black text-[#253330] uppercase tracking-wide">
                  Indian Patent Workflow Stage Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(reportsData.projectLifecycle.stageDistribution).map(([stage, count]: any) => {
                    const total = reportsData.projectLifecycle.totalProjects || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={stage} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-[#253330]">
                          <span className="capitalize">{stage.replace(/_/g, ' ')}</span>
                          <span>{count} projects ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-[#F0F4F2] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#315C55] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Roadmap Milestones Aggregate */}
              <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-[#253330]">Interactive Roadmap Milestones Execution</h4>
                  <p className="text-xs text-[#71807C] mt-0.5">
                    {reportsData.projectLifecycle.roadmapMilestones.completed} of{' '}
                    {reportsData.projectLifecycle.roadmapMilestones.total} statutory and custom milestones completed
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#315C55]">
                    {reportsData.projectLifecycle.roadmapMilestones.completionRate}%
                  </span>
                  <span className="text-[10px] text-[#71807C] font-bold block">completion velocity</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REVIEW TURNAROUND */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Total Reviews</span>
                  <div className="text-3xl font-black text-[#253330] mt-1">{reportsData.reviewPerformance.totalReviews}</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">In selected time range</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Pending Reviews</span>
                  <div className="text-3xl font-black text-amber-600 mt-1">{reportsData.reviewPerformance.pendingReviews}</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Awaiting guide/expert action</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Approved Reviews</span>
                  <div className="text-3xl font-black text-emerald-700 mt-1">{reportsData.reviewPerformance.approvedReviews}</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Endorsed for next stage</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Avg Turnaround</span>
                  <div className="text-3xl font-black text-[#315C55] mt-1">{reportsData.reviewPerformance.avgTurnaroundDays} d</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Days to decision</span>
                </div>
              </div>

              <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
                <h3 className="text-sm font-black text-[#253330] uppercase tracking-wide">
                  Review Turnaround Time Distribution
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#F7F9F8] rounded-2xl text-center">
                    <span className="text-2xl font-black text-emerald-700">
                      {reportsData.reviewPerformance.turnaroundDistribution.under2Days}
                    </span>
                    <span className="text-xs font-bold text-[#5C6B67] block mt-1">≤ 2 Days (Fast)</span>
                  </div>
                  <div className="p-4 bg-[#F7F9F8] rounded-2xl text-center">
                    <span className="text-2xl font-black text-[#315C55]">
                      {reportsData.reviewPerformance.turnaroundDistribution.twoToFiveDays}
                    </span>
                    <span className="text-xs font-bold text-[#5C6B67] block mt-1">2 - 5 Days (Normal)</span>
                  </div>
                  <div className="p-4 bg-[#F7F9F8] rounded-2xl text-center">
                    <span className="text-2xl font-black text-amber-600">
                      {reportsData.reviewPerformance.turnaroundDistribution.overFiveDays}
                    </span>
                    <span className="text-xs font-bold text-[#5C6B67] block mt-1">&gt; 5 Days (Slow)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FILING & DEADLINES */}
          {activeTab === 'deadlines' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Upcoming in 30 Days</span>
                  <div className="text-3xl font-black text-amber-600 mt-1">{reportsData.filingDeadlines.upcoming30Days}</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Statutory patent deadlines</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Upcoming in 60-90 Days</span>
                  <div className="text-3xl font-black text-[#315C55] mt-1">{reportsData.filingDeadlines.upcoming90Days}</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Mid-term deadlines</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Overdue Project Tasks</span>
                  <div className="text-3xl font-black text-rose-600 mt-1">{reportsData.filingDeadlines.overdueTasks}</div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Requires immediate attention</span>
                </div>
              </div>

              {/* Deadlines Table */}
              <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
                <h3 className="text-sm font-black text-[#253330] uppercase tracking-wide">
                  Upcoming Statutory Filing Deadlines
                </h3>
                {reportsData.filingDeadlines.deadlinesList.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#71807C] font-medium">
                    No upcoming statutory deadlines in the near window.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E5EBE8] text-[#71807C] font-black uppercase tracking-wider">
                          <th className="pb-3 px-3">Project</th>
                          <th className="pb-3 px-3">Statutory Event</th>
                          <th className="pb-3 px-3">Due Date</th>
                          <th className="pb-3 px-3 text-center">Remaining</th>
                          <th className="pb-3 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EBE8]/60">
                        {reportsData.filingDeadlines.deadlinesList.map((d: any) => (
                          <tr key={d.id} className="hover:bg-[#F7F9F8]">
                            <td className="py-3 px-3 font-extrabold text-[#253330] max-w-xs truncate">{d.projectTitle}</td>
                            <td className="py-3 px-3 text-[#5C6B67] font-semibold">{d.deadlineType}</td>
                            <td className="py-3 px-3 font-mono text-[#253330]">{d.dueDate}</td>
                            <td className="py-3 px-3 text-center font-bold text-amber-700">{d.daysRemaining} days</td>
                            <td className="py-3 px-3 text-right">
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-black rounded-full text-[10px]">
                                {d.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: AI TELEMETRY */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Primary Provider</span>
                  <div className="text-xl font-black text-[#253330] mt-1">{reportsData.aiTelemetry.provider}</div>
                  <span className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {reportsData.aiTelemetry.status}
                  </span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">AI Operations in Range</span>
                  <div className="text-3xl font-black text-[#315C55] mt-1">
                    {reportsData.aiTelemetry.totalOperationsInPeriod}
                  </div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Claims, drafting, analysis</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Response Latency</span>
                  <div className="text-xl font-black text-[#71807C] mt-1">
                    {reportsData.aiTelemetry.avgLatencyMs !== null
                      ? `${reportsData.aiTelemetry.avgLatencyMs} ms`
                      : 'Not Instrumented'}
                  </div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">
                    Telemetry distinguish flag active
                  </span>
                </div>
              </div>

              <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
                <h3 className="text-sm font-black text-[#253330] uppercase tracking-wide">
                  AI Operations by Task Category
                </h3>
                {Object.keys(reportsData.aiTelemetry.operationsByType).length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#71807C] font-medium">
                    No AI operations recorded in this specific time range.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(reportsData.aiTelemetry.operationsByType).map(([k, v]: any) => (
                      <div key={k} className="flex justify-between p-3 bg-[#F7F9F8] rounded-2xl text-xs">
                        <span className="font-bold text-[#253330]">{k}</span>
                        <span className="font-black text-[#315C55]">{v} operations</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY & AUDIT */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Admin Actions</span>
                  <div className="text-3xl font-black text-[#253330] mt-1">
                    {reportsData.securityEvents.totalAdminActionsInPeriod}
                  </div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Recorded in audit trail</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Role Modifications</span>
                  <div className="text-3xl font-black text-[#315C55] mt-1">
                    {reportsData.securityEvents.roleChangesCount}
                  </div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Privilege alterations</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Suspension Events</span>
                  <div className="text-3xl font-black text-rose-600 mt-1">
                    {reportsData.securityEvents.suspensionEventsCount}
                  </div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Account restrictions</span>
                </div>
                <div className="p-5 bg-white border border-[#E5EBE8] rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-[#71807C]">Policy Updates</span>
                  <div className="text-3xl font-black text-amber-700 mt-1">
                    {reportsData.securityEvents.policyUpdatesCount}
                  </div>
                  <span className="text-xs text-[#71807C] font-semibold mt-1 block">Governance adjustments</span>
                </div>
              </div>

              <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
                <h3 className="text-sm font-black text-[#253330] uppercase tracking-wide">
                  Recent Administrative Operations
                </h3>
                {reportsData.securityEvents.recentSecurityActions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#71807C] font-medium">
                    No security-sensitive admin actions in selected period.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E5EBE8] text-[#71807C] font-black uppercase tracking-wider">
                          <th className="pb-3 px-3">Timestamp</th>
                          <th className="pb-3 px-3">Action</th>
                          <th className="pb-3 px-3">Administrator</th>
                          <th className="pb-3 px-3">Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EBE8]/60">
                        {reportsData.securityEvents.recentSecurityActions.map((s: any) => (
                          <tr key={s.id} className="hover:bg-[#F7F9F8]">
                            <td className="py-3 px-3 font-mono text-[#71807C]">{s.createdAt}</td>
                            <td className="py-3 px-3 font-bold text-[#315C55]">{s.action}</td>
                            <td className="py-3 px-3 font-semibold text-[#253330]">{s.actor}</td>
                            <td className="py-3 px-3 text-[#5C6B67]">{s.target}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
