import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Folder,
  Plus,
  ShieldCheck,
  Archive,
  Search,
} from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get('type'); // 'owned' or 'supervised' or null
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredProjects = projects.filter((p) => {
    if (filterType === 'owned' && currentUserId && p.ownerId !== currentUserId) {
      return false;
    }
    if (filterType === 'supervised' && currentUserId && p.ownerId === currentUserId) {
      return false;
    }
    return (
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.technicalDomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans py-2 animate-fade-in pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {filterType === 'owned' ? 'My Patent Projects' : filterType === 'supervised' ? 'Supervised Patent Projects' : 'Patent Projects Workspace'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {filterType === 'owned'
              ? 'Draft, manage and track your own patent specifications and innovation workflows.'
              : filterType === 'supervised'
              ? 'Supervise, review and give feedback on inventor patent projects assigned to you.'
              : 'Manage active patent specifications, claims boundaries, and filing workflows'}
          </p>
        </div>
        <Link
          to="/dashboard/create-project"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New project</span>
        </Link>
      </div>

      {/* Tabs & Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-0">
        <div className="flex items-center gap-8 text-xs font-bold">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'active'
                ? 'text-blue-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Active Projects ({activeTab === 'active' ? projects.length : '...'})</span>
            {activeTab === 'active' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'archived'
                ? 'text-blue-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Archived ({activeTab === 'archived' ? projects.length : '...'})</span>
            {activeTab === 'archived' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        <div className="relative mb-2 sm:mb-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-60 pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 shadow-3xs"
          />
        </div>
      </div>

      {/* Projects Grid or Empty View */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm font-medium">Loading patent workspace projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-16 text-center app-card space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {activeTab === 'active' ? 'No Projects Found' : 'No Archived Projects'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-medium">
              {activeTab === 'active'
                ? 'Create your first patent project to start drafting claims and collaborating with your team.'
                : 'Any projects you archive will be moved here for long-term storage.'}
            </p>
          </div>
          {activeTab === 'active' && (
            <Link
              to="/dashboard/create-project"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Create project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const progress = getStageProgress(project.stage);
            const isOwner = currentUserId === project.ownerId;

            return (
              <div
                key={project.id}
                className="app-card p-5 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {project.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <button
                          onClick={() => handleArchiveToggle(project.id, project.isArchived)}
                          title={project.isArchived ? 'Restore Project' : 'Archive Project'}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/dashboard/projects/${project.id}`}
                    className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition line-clamp-2 leading-snug"
                  >
                    {project.title}
                  </Link>

                  <p className="text-[11px] text-slate-500 font-medium mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Domain: {project.technicalDomain}</span>
                  </p>

                  {/* Progress Indicator */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500 text-[10px]">
                        Stage: {project.stage.replace(/_/g, ' ')}
                      </span>
                      <span className="text-emerald-600 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-500 font-medium">
                    Owner: <strong className="text-slate-800">{project.owner.fullName}</strong>
                  </div>

                  <Link
                    to={`/dashboard/projects/${project.id}`}
                    className="px-3 py-1.5 rounded-xl border border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/60 font-bold text-xs transition"
                  >
                    Open
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
