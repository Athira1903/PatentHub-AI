import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  FileText,
  CheckSquare,
  Cpu,
  Settings as SettingsIcon,
  UserPlus,
  Lightbulb,
  CheckCircle2,
  FileCode,
  BarChart2,
  Sparkles,
  Key,
  Eye,
  Calendar,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export interface ProjectDetail {
  id: string;
  title: string;
  innovationIdea: string;
  problemStatement: string;
  proposedSolution: string;
  objectives?: string;
  technicalDomain: string;
  keywords?: string;
  category: string;
  stage: string;
  expectedFilingDate?: string;
  patentType?: string;
  visibility?: string;
  isOwner: boolean;
  isArchived: boolean;
  createdAt: string;
  owner: { id: string; fullName: string; username: string; email: string };
  members: Array<{ id: string; role: string; user: { id: string; fullName: string; username: string; email: string } }>;
  documents: Array<{ id: string; name: string; fileUrl: string; createdAt: string }>;
  tasks: Array<{ id: string; title: string; status: string; createdAt: string }>;
}

const STAGES = [
  { key: 'IDEA', label: 'Idea' },
  { key: 'LITERATURE_REVIEW', label: 'Literature Review' },
  { key: 'PROTOTYPE', label: 'Prototype' },
  { key: 'DOCUMENTATION', label: 'Documentation' },
  { key: 'FORMS_PREPARATION', label: 'Forms Preparation' },
  { key: 'GUIDE_REVIEW', label: 'Guide Review' },
  { key: 'PATENT_EXPERT_REVIEW', label: 'Patent Expert Review' },
  { key: 'FILING_READY', label: 'Filing Ready' },
];

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Members' | 'Documents' | 'Prototype' | 'Tasks' | 'Patent Forms' | 'AI Intelligence' | 'Reports' | 'Settings'
  >('Overview');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole, setInviteRole] = useState<'CO_INVENTOR' | 'GUIDE' | 'PATENT_EXPERT'>('CO_INVENTOR');
  const [inviting, setInviting] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get(`/projects/${id}`);
        setProject(response.data.project);
      } catch (error: any) {
        toast.error('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  useEffect(() => {
    const search = async () => {
      if (!inviteUsername.trim() || inviteUsername.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await api.get(`/users/search?q=${inviteUsername}`);
        setSearchResults(res.data || []);
      } catch (e) {
        setSearchResults([]);
      }
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [inviteUsername]);

  const handleStageChange = async (newStage: string) => {
    if (!project?.isOwner) {
      toast.error('Only project owner can update stage');
      return;
    }
    try {
      const response = await api.put(`/projects/${id}`, { stage: newStage });
      setProject((prev) => (prev ? { ...prev, stage: response.data.project.stage } : null));
      toast.success(`Updated stage to ${newStage.replace(/_/g, ' ')}`);
    } catch (error: any) {
      toast.error('Failed to update stage');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setInviting(true);
    try {
      await api.post('/collaboration/invite', {
        projectId: id,
        username: inviteUsername.trim(),
        role: inviteRole,
      });
      toast.success(`Invitation sent successfully to @${inviteUsername}!`);
      setInviteUsername('');
      setSearchResults([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading workspace...</div>;
  }

  if (!project) {
    return <div className="p-12 text-center text-rose-600 font-medium">Project not found or access denied.</div>;
  }

  const currentStageIndex = STAGES.findIndex((s) => s.key === project.stage);

  const tabs = [
    { name: 'Overview', icon: Lightbulb },
    { name: 'Members', icon: Users },
    { name: 'Documents', icon: FileText },
    { name: 'Prototype', icon: Cpu },
    { name: 'Tasks', icon: CheckSquare },
    { name: 'Patent Forms', icon: FileCode },
    { name: 'AI Intelligence', icon: Sparkles },
    { name: 'Reports', icon: BarChart2 },
    { name: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/projects"
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                {project.category}
              </span>
              <span className="text-xs text-slate-400 font-semibold">• {project.technicalDomain}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{project.title}</h2>
          </div>
        </div>
      </div>

      {/* Workflow Progress Bar Stepper */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> Patent Workflow Pipeline
          </h3>
          <span className="text-xs text-blue-700 font-extrabold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Current Stage: {project.stage.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {STAGES.map((s, idx) => {
            const isCompleted = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <button
                key={s.key}
                disabled={!project.isOwner}
                onClick={() => handleStageChange(s.key)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md font-bold'
                    : isCompleted
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-500 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 font-medium'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>0{idx + 1}</span>
                  {isCompleted && <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-blue-600'}`} />}
                </div>
                <span className="text-xs leading-tight line-clamp-2">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs Navigation (Pill Tabs) */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.name;
          return (
            <button
              key={t.name}
              onClick={() => setActiveTab(t.name)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md">
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            {/* Meta details dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/60 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Patent Type</p>
                  <p className="text-xs font-bold text-slate-800">{project.patentType || 'Utility'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Visibility</p>
                  <p className="text-xs font-bold text-slate-800">{project.visibility || 'PRIVATE'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Expected Filing Date</p>
                  <p className="text-xs font-bold text-slate-800">
                    {project.expectedFilingDate ? new Date(project.expectedFilingDate).toLocaleDateString() : 'Not Set'}
                  </p>
                </div>
              </div>
            </div>

            {project.keywords && (
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" /> Keywords:
                </span>
                {project.keywords.split(',').map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                    {kw.trim()}
                  </span>
                ))}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Innovation Abstract</h4>
              <p className="text-slate-800 text-xs sm:text-sm leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200/60 font-semibold shadow-2xs">
                {project.innovationIdea}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Problem Statement</h4>
              <p className="text-slate-800 text-xs sm:text-sm leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200/60 font-semibold shadow-2xs">
                {project.problemStatement}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proposed Technical Solution</h4>
              <p className="text-slate-800 text-xs sm:text-sm leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200/60 font-semibold shadow-2xs">
                {project.proposedSolution}
              </p>
            </div>

            {project.objectives && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Objectives</h4>
                <p className="text-slate-800 text-xs sm:text-sm leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200/60 font-semibold shadow-2xs">
                  {project.objectives}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h4 className="text-base font-extrabold text-slate-900 tracking-tight">Project Inventors & Team</h4>
              {project.isOwner && (
                <form onSubmit={handleInviteMember} className="flex flex-wrap items-center gap-2 relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                      placeholder="Search username..."
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-semibold min-w-[180px]"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 min-w-[200px]">
                        {searchResults.map((u) => (
                          <button
                            type="button"
                            key={u.id}
                            onClick={() => {
                              setInviteUsername(u.username);
                              setSearchResults([]);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors text-xs flex flex-col cursor-pointer"
                          >
                            <span className="font-bold text-slate-800">{u.fullName}</span>
                            <span className="text-[10px] text-slate-500">@{u.username} • {u.role}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 cursor-pointer font-bold"
                  >
                    <option value="CO_INVENTOR">Co-Inventor</option>
                    <option value="GUIDE">Faculty Guide</option>
                    <option value="PATENT_EXPERT">Patent Expert</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-md cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Invite
                  </button>
                </form>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Owner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
                <div>
                  <p className="text-sm font-extrabold text-slate-800">{project.owner.fullName}</p>
                  <p className="text-xs text-slate-400 font-bold">@{project.owner.username}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Lead Inventor (Owner)
                </span>
              </div>

              {/* Members */}
              {project.members && project.members.map((m) => (
                <div key={m.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">{m.user.fullName}</p>
                    <p className="text-xs text-slate-400 font-bold">@{m.user.username}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {m.role.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Documents' && (
          <div className="p-8 text-center">
            <FileText className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h4 className="text-base font-extrabold text-slate-900">Project Specifications & Documents</h4>
            <p className="text-xs text-slate-400 mt-1 mb-4 font-semibold">Upload PDF specifications and diagram attachments.</p>
            <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-transform hover:-translate-y-0.5">
              Upload Specification Document
            </button>
          </div>
        )}

        {activeTab === 'Prototype' && (
          <div className="p-8 text-center">
            <Cpu className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h4 className="text-base font-extrabold text-slate-900">Prototype Planning & Schematics</h4>
            <p className="text-xs text-slate-400 mt-1 font-semibold">CAD drawings, circuit diagrams, and version controls (V1, V2, V3).</p>
          </div>
        )}

        {activeTab === 'Tasks' && (
          <div className="p-8 text-center">
            <CheckSquare className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h4 className="text-base font-extrabold text-slate-900">Task Management</h4>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Assign patent drafting tasks to co-inventors, and allow guides to verify.</p>
          </div>
        )}

        {activeTab === 'Patent Forms' && (
          <div className="p-8 text-center">
            <FileCode className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h4 className="text-base font-extrabold text-slate-900">Official Patent Office Forms</h4>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Form 1 (Application), Form 2 (Specification), Form 3, and Form 5 drafts.</p>
          </div>
        )}

        {activeTab === 'AI Intelligence' && (
          <div className="p-8 text-center space-y-4">
            <Sparkles className="w-12 h-12 mx-auto text-indigo-500 animate-pulse-slow" />
            <div>
              <h4 className="text-base font-extrabold text-slate-900">AI Document Intelligence & Prior Art Search</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto font-semibold">
                Use Gemini to extract key parameters, similarity scores, risk evaluations, and generate AI prior art analysis summaries.
              </p>
            </div>
            <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition-transform hover:-translate-y-0.5">
              Launch Gemini AI Review
            </button>
          </div>
        )}

        {activeTab === 'Reports' && (
          <div className="p-8 text-center">
            <BarChart2 className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h4 className="text-base font-extrabold text-slate-900">Patent Readiness Report</h4>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Automated claims novelty assessment, team activity reports, and PDF downloads.</p>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="p-8 text-center">
            <SettingsIcon className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h4 className="text-base font-extrabold text-slate-900">Project Settings</h4>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Manage permissions, visibility settings, and delete or archive project archives.</p>
          </div>
        )}
      </div>
    </div>
  );
};
