import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Folder, ArrowRight, PenTool, FileText, Search, Scale, Users, Activity } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  title: string;
  category: string;
  technicalDomain: string;
  stage: string;
  ownerId: string;
  owner: { id: string; fullName: string; username: string };
  members: Array<{ user: { id: string; fullName: string } }>;
}

export const ProjectSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Determine mode details based on the URL path
  const getModeDetails = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/claims')) {
      return {
        title: 'Claims Studio Router',
        desc: 'Select a project to configure statutory patent claims and limitations boundaries.',
        tab: 'Claims Studio',
        icon: PenTool,
        bgTheme: 'bg-purple-50 text-purple-600 border-purple-200',
        iconColor: 'text-purple-600',
      };
    }
    if (path.includes('/dashboard/documents')) {
      return {
        title: 'Document Hub Router',
        desc: 'Select a project to upload, create, and review specification documents or statutory forms.',
        tab: 'Documents',
        icon: FileText,
        bgTheme: 'bg-blue-50 text-blue-600 border-blue-200',
        iconColor: 'text-blue-600',
      };
    }
    if (path.includes('/dashboard/prior-art')) {
      return {
        title: 'Prior Art Search Router',
        desc: 'Select a project to perform semantic keyword queries, similarity checks, and save citations.',
        tab: 'Prior Art Search',
        icon: Search,
        bgTheme: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        iconColor: 'text-emerald-600',
      };
    }
    if (path.includes('/dashboard/fto-analysis')) {
      return {
        title: 'FTO Overlap Analysis Router',
        desc: 'Select a project to review element overlap mappings, similarity graphs, and freedom-to-operate checks.',
        tab: 'FTO Analysis',
        icon: Scale,
        bgTheme: 'bg-rose-50 text-rose-600 border-rose-200',
        iconColor: 'text-rose-600',
      };
    }
    if (path.includes('/dashboard/team')) {
      return {
        title: 'Project Collaboration & Team',
        desc: 'Select a project to manage co-inventors, supervisors, or review submission statuses.',
        tab: 'Reviews',
        icon: Users,
        bgTheme: 'bg-indigo-50 text-indigo-600 border-indigo-200',
        iconColor: 'text-indigo-600',
      };
    }
    if (path.includes('/dashboard/activity')) {
      return {
        title: 'Project Activity & Logs',
        desc: 'Select a project to view the audit log timeline, file creations, and submission updates.',
        tab: 'Activity Timeline',
        icon: Activity,
        bgTheme: 'bg-amber-50 text-amber-600 border-amber-200',
        iconColor: 'text-amber-600',
      };
    }
    return {
      title: 'Invention Tools Router',
      desc: 'Select a project to launch development tools.',
      tab: 'Overview',
      icon: Folder,
      bgTheme: 'bg-slate-50 text-slate-600 border-slate-200',
      iconColor: 'text-slate-600',
    };
  };

  const mode = getModeDetails();
  const ModeIcon = mode.icon;

  useEffect(() => {
    const fetchUserDataAndProjects = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('patenthub_token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUserId(payload.userId || null);
        }

        const res = await api.get('/projects');
        setProjects(res.data.projects || []);
      } catch (err) {
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchUserDataAndProjects();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
      {/* Header section */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/85 shadow-2xs">
        <div className={`p-4.5 rounded-2xl border ${mode.bgTheme} shrink-0`}>
          <ModeIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
            {mode.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {mode.desc}
          </p>
        </div>
      </div>

      {/* Projects selection cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm font-medium">Loading patent workspace projects...</div>
      ) : projects.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">No Projects Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-medium">
              You must create or be part of a patent project before accessing innovation tools.
            </p>
          </div>
          <Link
            to="/dashboard/create-project"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            Create project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const isOwner = proj.ownerId === currentUserId;
            const relationship = isOwner ? 'Inventor (Owner)' : 'Supervising Guide';

            return (
              <div
                key={proj.id}
                onClick={() => navigate(`/dashboard/projects/${proj.id}?tab=${encodeURIComponent(mode.tab)}`)}
                className="bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-md p-5 rounded-3xl flex flex-col justify-between gap-5 transition-all cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isOwner
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {relationship}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      {proj.stage.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-950 group-hover:text-blue-600 transition truncate">
                      {proj.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      {proj.category} • {proj.technicalDomain}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Owner: <strong className="text-slate-600">{proj.owner.fullName}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600 group-hover:translate-x-1 transition-all">
                    <span>Launch {mode.tab === 'Overview' ? 'Workspace' : mode.tab}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
