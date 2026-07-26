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
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export interface ProjectDetail {
  id: string;
  title: string;
  innovationIdea: string;
  problemStatement: string;
  proposedSolution: string;
  technicalDomain: string;
  category: string;
  stage: string;
  isOwner: boolean;
  createdAt: string;
  owner: { id: string; fullName: string; username: string; email: string };
  members: Array<{ id: string; role: string; user: { id: string; fullName: string; username: string; email: string } }>;
  documents: Array<{ id: string; name: string; fileUrl: string; createdAt: string }>;
  tasks: Array<{ id: string; title: string; status: string; createdAt: string }>;
}

const STAGES = [
  { key: 'IDEA', label: 'Idea' },
  { key: 'PATENT_SEARCH', label: 'Patent Search' },
  { key: 'PROTOTYPE_PLANNING', label: 'Prototype Planning' },
  { key: 'PROTOTYPE_DEVELOPMENT', label: 'Prototype Development' },
  { key: 'DOCUMENTATION', label: 'Documentation' },
  { key: 'GUIDE_REVIEW', label: 'Guide Review' },
  { key: 'PATENT_FORMS', label: 'Patent Forms' },
  { key: 'READY_FOR_FILING', label: 'Ready for Filing' },
];

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Members' | 'Documents' | 'Prototype' | 'Tasks' | 'Patent Forms' | 'Reports' | 'Settings'
  >('Overview');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole, setInviteRole] = useState<'CO_INVENTOR' | 'GUIDE'>('CO_INVENTOR');
  const [inviting, setInviting] = useState(false);

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
      const response = await api.post(`/projects/${id}/members`, {
        username: inviteUsername,
        role: inviteRole,
      });
      toast.success(`Invited ${response.data.member.user.fullName}!`);
      setProject((prev) =>
        prev
          ? {
              ...prev,
              members: [...prev.members, response.data.member],
            }
          : null
      );
      setInviteUsername('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to invite team member');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading workspace...</div>;
  }

  if (!project) {
    return <div className="p-12 text-center text-rose-600 font-semibold">Project not found or access denied.</div>;
  }

  const currentStageIndex = STAGES.findIndex((s) => s.key === project.stage);

  const tabs = [
    { name: 'Overview', icon: Lightbulb },
    { name: 'Members', icon: Users },
    { name: 'Documents', icon: FileText },
    { name: 'Prototype', icon: Cpu },
    { name: 'Tasks', icon: CheckSquare },
    { name: 'Patent Forms', icon: FileCode },
    { name: 'Reports', icon: BarChart2 },
    { name: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/projects"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                {project.category}
              </span>
              <span className="text-xs text-slate-500">• {project.technicalDomain}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">{project.title}</h2>
          </div>
        </div>
      </div>

      {/* Workflow Progress Bar */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> Patent Workflow Pipeline
          </h3>
          <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
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
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm font-semibold'
                    : isCompleted
                    ? 'bg-blue-50 border-blue-200 text-blue-900 hover:border-blue-300 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 font-medium'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>0{idx + 1}</span>
                  {isCompleted && <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-blue-600'}`} />}
                </div>
                <span className="text-xs leading-tight line-clamp-2">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.name;
          return (
            <button
              key={t.name}
              onClick={() => setActiveTab(t.name)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Innovation Idea</h4>
              <p className="text-slate-800 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">
                {project.innovationIdea}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Problem Statement</h4>
              <p className="text-slate-800 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">
                {project.problemStatement}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proposed Technical Solution</h4>
              <p className="text-slate-800 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">
                {project.proposedSolution}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Members' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-900">Project Inventors & Team</h4>
              {project.isOwner && (
                <form onSubmit={handleInviteMember} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="Enter co-inventor username"
                    className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium"
                  >
                    <option value="CO_INVENTOR">Co-Inventor</option>
                    <option value="GUIDE">Guide / Advisor</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Invite
                  </button>
                </form>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Owner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{project.owner.fullName}</p>
                  <p className="text-xs text-slate-500">@{project.owner.username}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 border border-purple-200 text-purple-700">
                  Lead Inventor (Owner)
                </span>
              </div>

              {/* Members */}
              {project.members.map((m) => (
                <div key={m.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{m.user.fullName}</p>
                    <p className="text-xs text-slate-500">@{m.user.username}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700">
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
            <h4 className="text-base font-semibold text-slate-800">Project Specifications & Documents</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">Upload PDF specifications and diagram attachments.</p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm">
              Upload Specification Document
            </button>
          </div>
        )}

        {activeTab === 'Prototype' && (
          <div className="p-8 text-center">
            <Cpu className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h4 className="text-base font-semibold text-slate-800">Prototype Planning & Schematics</h4>
            <p className="text-xs text-slate-500 mt-1">CAD drawings, circuit diagrams, and technical proof-of-concepts.</p>
          </div>
        )}

        {activeTab === 'Tasks' && (
          <div className="p-8 text-center">
            <CheckSquare className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h4 className="text-base font-semibold text-slate-800">Task Management</h4>
            <p className="text-xs text-slate-500 mt-1">Assign patent drafting tasks to co-inventors and guides.</p>
          </div>
        )}

        {activeTab === 'Patent Forms' && (
          <div className="p-8 text-center">
            <FileCode className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h4 className="text-base font-semibold text-slate-800">Official Patent Office Forms</h4>
            <p className="text-xs text-slate-500 mt-1">Form 1 (Application), Form 2 (Specification), and Form 3.</p>
          </div>
        )}

        {activeTab === 'Reports' && (
          <div className="p-8 text-center">
            <BarChart2 className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h4 className="text-base font-semibold text-slate-800">Patent Readiness Report</h4>
            <p className="text-xs text-slate-500 mt-1">Automated claim novelty and filing readiness breakdown.</p>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="p-8 text-center">
            <SettingsIcon className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h4 className="text-base font-semibold text-slate-800">Project Settings</h4>
            <p className="text-xs text-slate-500 mt-1">Manage permissions, category labels, and project visibility.</p>
          </div>
        )}
      </div>
    </div>
  );
};
