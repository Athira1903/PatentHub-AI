import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Layers,
  ListFilter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flag,
  Loader2,
  AlertCircle,
  Folder,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api, patentApi } from '../services/api';
import toast from 'react-hot-toast';
import { PageHeader } from '../components/ui/PageHeader';
import { RoadmapTimeline } from '../components/roadmap/RoadmapTimeline';
import type { MilestoneItem } from '../components/roadmap/RoadmapMilestoneCard';
import { MilestoneDetailsModal } from '../components/roadmap/MilestoneDetailsModal';
import { MilestoneFormModal } from '../components/roadmap/MilestoneFormModal';

export const RoadmapPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialProjectId = searchParams.get('project');

  const [projects, setProjects] = useState<Array<{ id: string; title: string; stage: string }>>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);

  const [roadmapData, setRoadmapData] = useState<{
    project: any;
    milestones: MilestoneItem[];
    progress: any;
    tasks?: Array<{ id: string; title: string; status: string }>;
  } | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [loadingRoadmap, setLoadingRoadmap] = useState<boolean>(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'OVERDUE' | 'COMPLETED' | 'BLOCKED'>('ALL');

  // Modals state
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState<MilestoneItem | null>(null);
  const [milestoneToDelete, setMilestoneToDelete] = useState<MilestoneItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch authorized projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const res = await api.get('/projects');
        const list = res.data?.projects || res.data || [];
        setProjects(list);

        if (list.length > 0) {
          if (!selectedProjectId || !list.some((p: any) => p.id === selectedProjectId)) {
            setSelectedProjectId(list[0].id);
            setSearchParams({ project: list[0].id });
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch projects for roadmap:', err);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch project roadmap when selectedProjectId changes
  const fetchRoadmap = async (projId: string) => {
    try {
      setLoadingRoadmap(true);
      setRoadmapError(null);
      const res = await patentApi.getProjectRoadmap(projId);
      setRoadmapData(res.data);
    } catch (err: any) {
      setRoadmapError(err.response?.data?.message || err.message || 'Failed to load project roadmap');
    } finally {
      setLoadingRoadmap(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchRoadmap(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleProjectChange = (newProjId: string) => {
    setSelectedProjectId(newProjId);
    setSearchParams({ project: newProjId });
  };

  // Toggle complete / reopen
  const handleToggleComplete = async (milestone: MilestoneItem) => {
    if (!selectedProjectId) return;
    const newStatus = milestone.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';

    try {
      await patentApi.updateMilestone(selectedProjectId, milestone.id, {
        status: newStatus,
        progress: newStatus === 'COMPLETED' ? 100 : 50,
      });
      toast.success(newStatus === 'COMPLETED' ? 'Milestone completed!' : 'Milestone reopened');
      fetchRoadmap(selectedProjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update milestone status');
    }
  };

  // Create or Update milestone
  const handleSaveMilestone = async (formData: any) => {
    if (!selectedProjectId) return;

    if (milestoneToEdit) {
      await patentApi.updateMilestone(selectedProjectId, milestoneToEdit.id, formData);
      toast.success('Milestone updated successfully');
    } else {
      await patentApi.createMilestone(selectedProjectId, formData);
      toast.success('Custom milestone added to roadmap');
    }
    fetchRoadmap(selectedProjectId);
  };

  // Delete custom milestone
  const handleConfirmDelete = async () => {
    if (!selectedProjectId || !milestoneToDelete) return;
    try {
      setIsDeleting(true);
      await patentApi.deleteMilestone(selectedProjectId, milestoneToDelete.id);
      toast.success('Custom milestone removed');
      setMilestoneToDelete(null);
      fetchRoadmap(selectedProjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete milestone');
    } finally {
      setIsDeleting(false);
    }
  };

  // Move up / Move down reordering
  const handleMoveMilestone = async (milestone: MilestoneItem, direction: 'up' | 'down') => {
    if (!roadmapData || !selectedProjectId) return;

    const currentList = [...roadmapData.milestones];
    const index = currentList.findIndex((m) => m.id === milestone.id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    // Swap
    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    const orderedIds = currentList.map((m) => m.id);

    try {
      await patentApi.reorderMilestones(selectedProjectId, orderedIds);
      toast.success('Milestones reordered');
      fetchRoadmap(selectedProjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reorder milestones');
    }
  };

  // Filter milestones by status
  const filteredMilestones = (roadmapData?.milestones || []).filter((m) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OVERDUE') {
      return m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'COMPLETED';
    }
    return m.status === statusFilter;
  });

  // Extract project members for assignment
  const projectMembers = [
    ...(roadmapData?.project?.owner
      ? [{ id: roadmapData.project.owner.id, fullName: `${roadmapData.project.owner.fullName} (Owner)`, username: roadmapData.project.owner.username }]
      : []),
    ...(roadmapData?.project?.members || []).map((m: any) => ({
      id: m.user?.id || m.userId,
      fullName: m.user?.fullName || 'Member',
      username: m.user?.username || '',
    })),
  ];

  const progress = roadmapData?.progress;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
      {/* Top Page Header */}
      <PageHeader
        title="Interactive Patent Roadmap"
        subtitle="Track and orchestrate the Indian patent lifecycle from invention conception through claims engineering and filing readiness."
        breadcrumbs={[
          { label: 'Platform', href: '/dashboard' },
          { label: 'Roadmap' },
        ]}
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            {/* Project Switcher */}
            <div className="flex items-center gap-2 bg-white border border-[#E5E7E5] px-3 py-1.5 rounded-xl shadow-3xs">
              <FolderKanban className="w-4 h-4 text-[#235952]" />
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                disabled={loadingProjects || projects.length === 0}
                className="text-xs font-bold text-[#191F1D] bg-transparent focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Milestone Button */}
            <button
              type="button"
              onClick={() => {
                setMilestoneToEdit(null);
                setIsFormOpen(true);
              }}
              disabled={!selectedProjectId}
              className="px-4 py-2 bg-[#235952] hover:bg-[#1B453F] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Milestone</span>
            </button>
          </div>
        }
      />

      {/* Progress & Lifecycle Metric Cards */}
      {progress && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white border border-[#E5E7E5] p-4 rounded-2xl shadow-3xs space-y-1">
            <span className="text-[10px] font-bold text-[#5C6662] uppercase tracking-wider">Overall Progress</span>
            <div className="text-2xl font-black text-[#235952] font-mono">{progress.overallPercentage}%</div>
            <div className="w-full bg-[#ECEEEC] rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-[#235952] rounded-full" style={{ width: `${progress.overallPercentage}%` }} />
            </div>
          </div>

          <div className="bg-white border border-[#E5E7E5] p-4 rounded-2xl shadow-3xs space-y-1">
            <span className="text-[10px] font-bold text-[#5C6662] uppercase tracking-wider">Total Stages</span>
            <div className="text-2xl font-black text-[#191F1D] font-mono">{progress.totalMilestones}</div>
            <span className="text-[10px] text-[#88928E]">Configured milestones</span>
          </div>

          <div className="bg-white border border-[#E5E7E5] p-4 rounded-2xl shadow-3xs space-y-1">
            <span className="text-[10px] font-bold text-[#15803D] uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </span>
            <div className="text-2xl font-black text-[#15803D] font-mono">{progress.completedCount}</div>
            <span className="text-[10px] text-[#88928E]">Verified deliverables</span>
          </div>

          <div className="bg-white border border-[#E5E7E5] p-4 rounded-2xl shadow-3xs space-y-1">
            <span className="text-[10px] font-bold text-[#B45309] uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> In Progress
            </span>
            <div className="text-2xl font-black text-[#B45309] font-mono">{progress.inProgressCount}</div>
            <span className="text-[10px] text-[#88928E]">Active stages</span>
          </div>

          <div className="bg-white border border-[#E5E7E5] p-4 rounded-2xl shadow-3xs space-y-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pending
            </span>
            <div className="text-2xl font-black text-slate-700 font-mono">{progress.notStartedCount}</div>
            <span className="text-[10px] text-[#88928E]">Awaiting initiation</span>
          </div>

          <div className="bg-white border border-[#E5E7E5] p-4 rounded-2xl shadow-3xs space-y-1">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
              <Flag className="w-3 h-3" /> Overdue
            </span>
            <div className={`text-2xl font-black font-mono ${progress.overdueCount > 0 ? 'text-rose-600' : 'text-[#88928E]'}`}>
              {progress.overdueCount}
            </div>
            <span className="text-[10px] text-[#88928E]">Need immediate review</span>
          </div>

          <div className="bg-white border border-[#E5E7E5] p-4 rounded-2xl shadow-3xs space-y-1">
            <span className="text-[10px] font-bold text-[#BE123C] uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Blocked
            </span>
            <div className="text-2xl font-black text-[#BE123C] font-mono">{progress.blockedCount}</div>
            <span className="text-[10px] text-[#88928E]">Dependencies locked</span>
          </div>
        </div>
      )}

      {/* Control Toolbar: Status Filter Tabs + View Mode Toggle */}
      <div className="bg-white border border-[#E5E7E5] rounded-2xl p-3 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'OVERDUE', 'COMPLETED', 'BLOCKED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-[#235952] text-white shadow-3xs'
                  : 'text-[#5C6662] hover:text-[#191F1D] hover:bg-[#F4F5F4]'
              }`}
            >
              {tab === 'ALL'
                ? 'All Stages'
                : tab === 'NOT_STARTED'
                ? 'Pending'
                : tab === 'IN_PROGRESS'
                ? 'In Progress'
                : tab === 'OVERDUE'
                ? 'Overdue'
                : tab === 'COMPLETED'
                ? 'Completed'
                : 'Blocked'}
            </button>
          ))}
        </div>

        {/* View Mode Toggle: Timeline vs List */}
        <div className="flex items-center gap-1 bg-[#FAF9F6] border border-[#E5E7E5] p-1 rounded-xl shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-white text-[#235952] shadow-3xs border border-[#E5E7E5]'
                : 'text-[#5C6662] hover:text-[#191F1D]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-[#235952] shadow-3xs border border-[#E5E7E5]'
                : 'text-[#5C6662] hover:text-[#191F1D]'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
        </div>
      </div>

      {/* Stage Stepper Navigator: Previous & Next Controls */}
      {roadmapData && roadmapData.milestones.length > 0 && (
        <div className="bg-white border border-[#E5E7E5] rounded-2xl p-3 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#88928E] uppercase tracking-wider">
              Stage Navigator:
            </span>
            <div className="flex items-center gap-1 bg-[#FAF9F6] border border-[#E5E7E5] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  const prev = Math.max(0, activeStageIndex - 1);
                  setActiveStageIndex(prev);
                  setSelectedMilestone(roadmapData.milestones[prev]);
                }}
                disabled={activeStageIndex <= 0}
                className="p-1.5 text-[#5C6662] hover:text-[#191F1D] hover:bg-white rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous Stage"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 py-0.5 text-xs font-bold text-[#191F1D]">
                Stage {activeStageIndex + 1} of {roadmapData.milestones.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(roadmapData.milestones.length - 1, activeStageIndex + 1);
                  setActiveStageIndex(next);
                  setSelectedMilestone(roadmapData.milestones[next]);
                }}
                disabled={activeStageIndex >= roadmapData.milestones.length - 1}
                className="p-1.5 text-[#5C6662] hover:text-[#191F1D] hover:bg-white rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next Stage"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal Stage Stepper Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {roadmapData.milestones.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveStageIndex(idx);
                  setSelectedMilestone(m);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeStageIndex === idx
                    ? 'bg-[#235952] text-white shadow-3xs'
                    : m.status === 'COMPLETED'
                    ? 'bg-[#F0FDF4] text-[#15803D] hover:bg-[#DCFCE7]'
                    : m.status === 'IN_PROGRESS'
                    ? 'bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7]'
                    : 'bg-[#FAF9F6] text-[#5C6662] hover:bg-[#ECEEEC]'
                }`}
              >
                <span>{idx + 1}.</span>
                <span className="truncate max-w-[120px]">{m.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Roadmap Area */}
      {loadingRoadmap ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-[#E5E7E5] rounded-3xl p-12 text-[#5C6662] space-y-3">
          <Loader2 className="w-8 h-8 text-[#235952] animate-spin" />
          <span className="text-xs font-semibold">Loading interactive project roadmap...</span>
        </div>
      ) : roadmapError ? (
        <div className="p-8 text-center bg-white border border-rose-200 rounded-3xl shadow-xs space-y-3 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h4 className="text-base font-bold text-[#191F1D]">Error Loading Roadmap</h4>
          <p className="text-xs text-[#5C6662]">{roadmapError}</p>
          <button
            type="button"
            onClick={() => selectedProjectId && fetchRoadmap(selectedProjectId)}
            className="px-4 py-2 bg-[#235952] text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E7E5] rounded-3xl shadow-xs space-y-4 max-w-md mx-auto">
          <Folder className="w-12 h-12 text-[#88928E] mx-auto" />
          <h3 className="text-base font-bold text-[#191F1D]">No Patent Projects Found</h3>
          <p className="text-xs text-[#5C6662]">
            Create a patent project first to start tracking its interactive roadmap.
          </p>
          <button
            type="button"
            onClick={() => navigate('/create-project')}
            className="px-4 py-2 bg-[#235952] text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Create Patent Project
          </button>
        </div>
      ) : (
        <RoadmapTimeline
          milestones={filteredMilestones}
          canEdit={true}
          onEdit={(m) => {
            setMilestoneToEdit(m);
            setIsFormOpen(true);
          }}
          onViewDetails={(m) => {
            const idx = (roadmapData?.milestones || []).findIndex((x) => x.id === m.id);
            if (idx !== -1) setActiveStageIndex(idx);
            setSelectedMilestone(m);
          }}
          onToggleComplete={handleToggleComplete}
          onDelete={(m) => setMilestoneToDelete(m)}
          onMoveUp={(m) => handleMoveMilestone(m, 'up')}
          onMoveDown={(m) => handleMoveMilestone(m, 'down')}
          viewMode={viewMode}
        />
      )}

      {/* Milestone Details Modal */}
      {(() => {
        const currentMilestones = roadmapData?.milestones || [];
        const currentSelectedIndex = selectedMilestone
          ? currentMilestones.findIndex((m) => m.id === selectedMilestone.id)
          : -1;
        const hasPrev = currentSelectedIndex > 0;
        const hasNext = currentSelectedIndex >= 0 && currentSelectedIndex < currentMilestones.length - 1;

        return (
          <MilestoneDetailsModal
            milestone={selectedMilestone}
            onClose={() => setSelectedMilestone(null)}
            onEdit={(m) => {
              setSelectedMilestone(null);
              setMilestoneToEdit(m);
              setIsFormOpen(true);
            }}
            onToggleComplete={handleToggleComplete}
            canEdit={true}
            onNavigatePrev={() => {
              if (hasPrev) {
                const prev = currentMilestones[currentSelectedIndex - 1];
                setSelectedMilestone(prev);
                setActiveStageIndex(currentSelectedIndex - 1);
              }
            }}
            onNavigateNext={() => {
              if (hasNext) {
                const next = currentMilestones[currentSelectedIndex + 1];
                setSelectedMilestone(next);
                setActiveStageIndex(currentSelectedIndex + 1);
              }
            }}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        );
      })()}

      {/* Milestone Add/Edit Form Modal */}
      <MilestoneFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setMilestoneToEdit(null);
        }}
        onSubmit={handleSaveMilestone}
        milestoneToEdit={milestoneToEdit}
        projectMembers={projectMembers}
        existingMilestones={roadmapData?.milestones || []}
        projectTasks={roadmapData?.tasks || []}
      />

      {/* Delete Confirmation Dialog */}
      {milestoneToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#E5E7E5] rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-[#191F1D]">Delete Milestone?</h4>
              <p className="text-xs text-[#5C6662]">
                Are you sure you want to remove <strong>"{milestoneToDelete.title}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMilestoneToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#F1F3F4] text-[#5C6662] rounded-xl text-xs font-bold hover:bg-[#E5E7E5] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
