import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Clock, ArrowRight, ShieldCheck, Archive } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  technicalDomain: string;
  stage: string;
  createdAt: string;
  ownerId: string;
  isArchived: boolean;
  owner: { fullName: string; username: string };
  members: Array<{ user: { fullName: string; username: string } }>;
  _count?: { documents: number; tasks: number; members: number };
}

const STAGES = [
  'IDEA',
  'LITERATURE_REVIEW',
  'PROTOTYPE',
  'DOCUMENTATION',
  'FORMS_PREPARATION',
  'GUIDE_REVIEW',
  'PATENT_EXPERT_REVIEW',
  'FILING_READY',
];

const getStageProgress = (stage: string) => {
  const index = STAGES.indexOf(stage);
  if (index === -1) return 12;
  return Math.round(((index + 1) / STAGES.length) * 100);
};

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchProjects = async (tab: 'active' | 'archived') => {
    setLoading(true);
    try {
      const response = await api.get(`/projects?archived=${tab === 'archived'}`);
      setProjects(response.data.projects || []);
    } catch (error: any) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Decode token or fetch user to find owner identity
    const token = localStorage.getItem('patenthub_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId || null);
      } catch (e) {
        console.error(e);
      }
    }
    fetchProjects(activeTab);
  }, [activeTab]);

  const handleArchiveToggle = async (projectId: string, currentStatus: boolean) => {
    try {
      await api.put(`/projects/${projectId}/archive`, { isArchived: !currentStatus });
      toast.success(currentStatus ? 'Project restored successfully' : 'Project archived successfully');
      fetchProjects(activeTab);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle archive status');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans py-2 animate-fade-in">
      {/* Upper header action section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 inline-block mb-2">
            Workspace Catalog
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Patent Projects Workspace</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Manage active patent specifications, prior art reviews, and filing teams</p>
        </div>
        <Link
          to="/dashboard/create-project"
          className="group px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/35 transition-all uppercase tracking-wider hover:-translate-y-0.5 cursor-pointer shrink-0 animate-pulse-slow"
        >
          <Plus className="w-4 h-4" />
          <span>New Patent Project</span>
        </Link>
      </div>

      {/* Tabs list active vs archived */}
      <div className="flex items-center gap-2.5 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 text-xs font-extrabold transition-all border-b-2 px-3 tracking-wider uppercase cursor-pointer ${
            activeTab === 'active'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Active Projects ({activeTab === 'active' ? projects.length : '...'})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`pb-3 text-xs font-extrabold transition-all border-b-2 px-3 tracking-wider uppercase cursor-pointer ${
            activeTab === 'archived'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Archived ({activeTab === 'archived' ? projects.length : '...'})
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm font-medium">Loading patent workspace projects...</div>
      ) : projects.length === 0 ? (
        <div className="p-16 text-center rounded-3xl glass-card border border-slate-200/80 shadow-md">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">
            {activeTab === 'active' ? 'No Projects Found' : 'No Archived Projects'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6 font-medium">
            {activeTab === 'active'
              ? 'Create your first patent project to start drafting claims and collaborating with your team.'
              : 'Any projects you archive will be moved here for long-term storage.'}
          </p>
          {activeTab === 'active' && (
            <Link
              to="/dashboard/create-project"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Create Patent Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const progress = getStageProgress(project.stage);
            const isOwner = currentUserId === project.ownerId;
            return (
              <div
                key={project.id}
                className="p-6 rounded-3xl glass-card border border-slate-200/80 shadow-md flex flex-col justify-between hover:border-blue-500/40 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs">
                      {project.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <button
                          onClick={() => handleArchiveToggle(project.id, project.isArchived)}
                          title={project.isArchived ? 'Restore Project' : 'Archive Project'}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 tracking-tight">
                    {project.title}
                  </h3>

                  <p className="text-xs text-slate-500 font-semibold mb-5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> Domain: {project.technicalDomain}
                  </p>

                  {/* Progress Bar Container */}
                  <div className="space-y-2 mb-6 p-4 rounded-2xl bg-white/80 border border-slate-200/70 shadow-2xs">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                        Stage: {project.stage.replace(/_/g, ' ')}
                      </span>
                      <span className="text-blue-600 font-mono font-extrabold">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  {/* Member Avatars Stack */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 overflow-hidden">
                      <div
                        title={`Owner: ${project.owner.fullName}`}
                        className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center border-2 border-white ring-1 ring-slate-200 shadow-2xs"
                      >
                        {project.owner.fullName.charAt(0).toUpperCase()}
                      </div>
                      {project.members && project.members.slice(0, 2).map((m, i) => (
                        <div
                          key={i}
                          title={m.user.fullName}
                          className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold flex items-center justify-center border-2 border-white ring-1 ring-cyan-200 shadow-2xs"
                        >
                          {m.user.fullName.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 font-bold">
                      {project._count?.members ? project._count.members + 1 : 1} Members
                    </span>
                  </div>

                  <Link
                    to={`/dashboard/projects/${project.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
