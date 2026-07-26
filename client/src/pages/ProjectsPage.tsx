import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Clock, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  technicalDomain: string;
  stage: string;
  createdAt: string;
  owner: { fullName: string; username: string };
  members: Array<{ user: { fullName: string; username: string } }>;
  _count?: { documents: number; tasks: number; members: number };
}

const STAGES = [
  'IDEA',
  'PATENT_SEARCH',
  'PROTOTYPE_PLANNING',
  'PROTOTYPE_DEVELOPMENT',
  'DOCUMENTATION',
  'GUIDE_REVIEW',
  'PATENT_FORMS',
  'READY_FOR_FILING',
];

const getStageProgress = (stage: string) => {
  const index = STAGES.indexOf(stage);
  if (index === -1) return 12;
  return Math.round(((index + 1) / STAGES.length) * 100);
};

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data.projects);
      } catch (error: any) {
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium text-[#202124]">Patent Projects</h2>
          <p className="text-sm text-[#5f6368]">Manage research projects and active patent drafts</p>
        </div>
        <Link
          to="/dashboard/create-project"
          className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> New Patent Project
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#5f6368]">Loading patent projects...</div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#dadce0] shadow-sm">
          <FolderKanban className="w-12 h-12 mx-auto text-[#5f6368] mb-3" />
          <h3 className="text-lg font-medium text-[#202124]">No Projects Found</h3>
          <p className="text-sm text-[#5f6368] max-w-sm mx-auto mt-1 mb-6">
            Create your first patent project to start drafting claims and collaborating with team members.
          </p>
          <Link
            to="/dashboard/create-project"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Patent Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const progress = getStageProgress(project.stage);
            return (
              <div
                key={project.id}
                className="p-6 rounded-2xl bg-white border border-[#dadce0] shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-[#e8f0fe] text-[#0b57d0] border border-[#c2e7ff]">
                      {project.category}
                    </span>
                    <span className="text-xs text-[#5f6368] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-medium text-[#202124] group-hover:text-[#1a73e8] transition-colors line-clamp-2 mb-2">
                    {project.title}
                  </h3>

                  <p className="text-xs text-[#5f6368] font-normal mb-4 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1a73e8]" /> Domain: {project.technicalDomain}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-6">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#5f6368] uppercase tracking-wider text-[10px]">Stage: {project.stage.replace(/_/g, ' ')}</span>
                      <span className="text-[#1a73e8]">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#f1f3f4] rounded-full overflow-hidden border border-[#dadce0]">
                      <div
                        className="h-full bg-[#1a73e8] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#f1f3f4] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[#5f6368]">
                    <Users className="w-4 h-4 text-[#5f6368]" />
                    <span>{project._count?.members ? project._count.members + 1 : 1} Members</span>
                  </div>

                  <Link
                    to={`/dashboard/projects/${project.id}`}
                    className="px-4 py-1.5 rounded-full bg-[#f1f3f4] hover:bg-[#1a73e8] text-[#3c4043] hover:text-white text-xs font-medium transition-all flex items-center gap-1"
                  >
                    Open Project <ArrowRight className="w-3.5 h-3.5" />
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
