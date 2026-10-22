import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface ProjectItem {
  id: string;
  title: string;
  inventor: string;
  organization: string;
  stage: string;
  guide: string;
  expert: string;
  readinessScore: number;
  claimsCount: number;
  documentsCount: number;
  milestonesCount: number;
  completedMilestonesCount: number;
  milestoneProgress: number;
  overdueTasksCount: number;
  pendingReviewsCount: number;
  upcomingDeadlinesCount: number;
  isStalled: boolean;
  lastActivity: string;
  status: string;
  category: string;
  technicalDomain: string;
}

interface AdminProjectOversightProps {
  projects: ProjectItem[];
  onRefresh: () => void;
  onAssignReviewer: (project: ProjectItem) => void;
}

export const AdminProjectOversight: React.FC<AdminProjectOversightProps> = ({
  projects,
  onRefresh,
  onAssignReviewer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState<
    'ALL' | 'STALLED' | 'OVERDUE_TASKS' | 'PENDING_REVIEWS' | 'FILING_READY'
  >('ALL');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      !searchTerm.trim() ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.inventor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.technicalDomain.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStage = stageFilter === 'ALL' || p.stage === stageFilter;

    let matchCondition = true;
    if (conditionFilter === 'STALLED') matchCondition = p.isStalled;
    else if (conditionFilter === 'OVERDUE_TASKS') matchCondition = p.overdueTasksCount > 0;
    else if (conditionFilter === 'PENDING_REVIEWS') matchCondition = p.pendingReviewsCount > 0;
    else if (conditionFilter === 'FILING_READY') matchCondition = ['FILING_READY', 'FILED'].includes(p.stage);

    return matchSearch && matchStage && matchCondition;
  });

  const getStageBadgeStyle = (stage: string) => {
    switch (stage) {
      case 'FILING_READY':
      case 'FILED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'GUIDE_REVIEW':
      case 'PATENT_EXPERT_REVIEW':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'FORMS_PREPARATION':
      case 'DOCUMENTATION':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      default:
        return 'bg-[#F0F4F2] text-[#315C55] border-[#E5EBE8]';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner with Confidentiality Assurance */}
      <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#315C55]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#6F8F88]">
              Platform Operational Governance
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#253330] tracking-tight">
            Patent Project Oversight
          </h1>
          <p className="text-xs text-[#71807C] font-medium mt-0.5">
            Cross-project operational monitoring: milestones, reviews, deadlines, and project velocity
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            className="px-3.5 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] border border-[#E5EBE8] text-[#253330] rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Refresh Projects"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#315C55]" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Confidentiality Notice */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-900 leading-relaxed font-medium">
          <strong className="font-bold">Confidentiality Guarantee:</strong> Platform administrators have operational oversight (milestone velocity, review bottlenecks, deadlines, and team assignments) without unrestricted access to unpublished patent claim bodies or secret invention disclosure documents.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border border-[#E5EBE8] rounded-2xl shadow-3xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8A9B96] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, inventor, institution, or technical domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs text-[#253330] placeholder-[#8A9B96] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#315C55]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stage Dropdown */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#253330] focus:outline-none"
          >
            <option value="ALL">All Stages</option>
            <option value="IDEA">Idea</option>
            <option value="LITERATURE_REVIEW">Literature Review</option>
            <option value="PROTOTYPE">Prototype</option>
            <option value="DOCUMENTATION">Documentation</option>
            <option value="FORMS_PREPARATION">Forms Preparation</option>
            <option value="GUIDE_REVIEW">Guide Review</option>
            <option value="PATENT_EXPERT_REVIEW">Patent Expert Review</option>
            <option value="FILING_READY">Filing Ready</option>
            <option value="FILED">Filed</option>
          </select>

          {/* Condition Filter */}
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#253330] focus:outline-none"
          >
            <option value="ALL">All Status Conditions</option>
            <option value="STALLED">⚠️ Stalled (&gt;30d inactive)</option>
            <option value="OVERDUE_TASKS">Overdue Tasks</option>
            <option value="PENDING_REVIEWS">Pending Reviews</option>
            <option value="FILING_READY">Filing Ready</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5EBE8] bg-[#F7F9F8]/60 text-[#71807C] font-black uppercase tracking-wider">
                <th className="py-3.5 px-4">Patent Project</th>
                <th className="py-3.5 px-4">Inventor / Institution</th>
                <th className="py-3.5 px-4">Stage</th>
                <th className="py-3.5 px-4 text-center">Roadmap Progress</th>
                <th className="py-3.5 px-4 text-center">Reviews</th>
                <th className="py-3.5 px-4 text-center">Tasks</th>
                <th className="py-3.5 px-4 text-center">Deadlines</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EBE8]/60">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs font-bold text-[#71807C]">
                    No patent projects found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F9F8]/60 transition">
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-extrabold text-[#253330] truncate" title={p.title}>
                        {p.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-[#71807C] uppercase tracking-wide">
                          {p.technicalDomain || 'General Tech'}
                        </span>
                        {p.isStalled && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-black rounded-md">
                            Stalled
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-[#253330]">{p.inventor}</div>
                      <div className="text-[10px] text-[#71807C] truncate max-w-xs">{p.organization}</div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStageBadgeStyle(
                          p.stage
                        )}`}
                      >
                        {p.stage.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-24 h-2 bg-[#F0F4F2] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#315C55] rounded-full transition-all"
                            style={{ width: `${Math.max(p.milestoneProgress, 5)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#5C6B67]">
                          {p.completedMilestonesCount} / {p.milestonesCount} milestones ({p.milestoneProgress}%)
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {p.pendingReviewsCount > 0 ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded-full text-[10px]">
                          {p.pendingReviewsCount} pending
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#71807C]">None pending</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {p.overdueTasksCount > 0 ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-black rounded-full text-[10px]">
                          {p.overdueTasksCount} overdue
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold">On track</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-bold text-[#253330]">{p.upcomingDeadlinesCount} upcoming</span>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedProject(p)}
                          className="px-2.5 py-1 bg-[#F7F9F8] hover:bg-[#F0F4F2] border border-[#E5EBE8] text-[#253330] rounded-xl text-[10px] font-bold transition cursor-pointer"
                        >
                          Overview
                        </button>
                        <button
                          onClick={() => onAssignReviewer(p)}
                          className="px-2.5 py-1 bg-[#315C55] hover:bg-[#254640] text-white rounded-xl text-[10px] font-bold transition cursor-pointer"
                        >
                          Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Overview Drawer / Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-3xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#6F8F88] tracking-wider">
                  Operational Oversight Inspector
                </span>
                <h3 className="text-xl font-black text-[#253330] mt-0.5">{selectedProject.title}</h3>
                <p className="text-xs text-[#71807C] mt-0.5">
                  Inventor: {selectedProject.inventor} • {selectedProject.organization}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-xl text-[#71807C] hover:bg-[#F7F9F8] hover:text-[#253330] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#F7F9F8] rounded-2xl">
                <span className="text-[10px] text-[#71807C] font-bold">Current Stage</span>
                <div className="text-xs font-black text-[#253330] mt-1">{selectedProject.stage}</div>
              </div>
              <div className="p-3 bg-[#F7F9F8] rounded-2xl">
                <span className="text-[10px] text-[#71807C] font-bold">Filing Readiness</span>
                <div className="text-xs font-black text-[#315C55] mt-1">{selectedProject.readinessScore}%</div>
              </div>
              <div className="p-3 bg-[#F7F9F8] rounded-2xl">
                <span className="text-[10px] text-[#71807C] font-bold">Overdue Tasks</span>
                <div className="text-xs font-black text-rose-600 mt-1">{selectedProject.overdueTasksCount}</div>
              </div>
              <div className="p-3 bg-[#F7F9F8] rounded-2xl">
                <span className="text-[10px] text-[#71807C] font-bold">Last Activity</span>
                <div className="text-xs font-black text-[#253330] mt-1">{selectedProject.lastActivity}</div>
              </div>
            </div>

            {/* Team Assignments */}
            <div className="p-4 bg-[#F7F9F8] rounded-2xl space-y-2">
              <h4 className="text-xs font-black text-[#253330] uppercase tracking-wide">Supervisor Team</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-[#71807C] font-bold">Guide</span>
                  <div className="font-bold text-[#253330]">{selectedProject.guide}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#71807C] font-bold">Patent Expert</span>
                  <div className="font-bold text-[#253330]">{selectedProject.expert}</div>
                </div>
              </div>
            </div>

            {/* Roadmap Milestones Progress */}
            <div className="p-4 bg-[#F7F9F8] rounded-2xl space-y-2">
              <h4 className="text-xs font-black text-[#253330] uppercase tracking-wide">Roadmap Progression</h4>
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Completed Milestones:</span>
                <span className="text-[#315C55]">
                  {selectedProject.completedMilestonesCount} / {selectedProject.milestonesCount} (
                  {selectedProject.milestoneProgress}%)
                </span>
              </div>
              <div className="w-full h-2 bg-[#E5EBE8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#315C55] rounded-full"
                  style={{ width: `${Math.max(selectedProject.milestoneProgress, 4)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] border border-[#E5EBE8] rounded-2xl text-xs font-bold text-[#253330] cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
