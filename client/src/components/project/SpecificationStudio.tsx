import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Clock,
  History,
  Download,
  RotateCcw,
  Check,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  GitCompare,
  Eye,
  RefreshCw,
  X,
  Loader2,
  CheckCircle2,
  Circle,
  BookOpen,
} from 'lucide-react';
import { patentApi } from '../../services/api';
import toast from 'react-hot-toast';

interface SpecificationStudioProps {
  projectId: string;
  project?: any;
  onRefreshProject?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export interface SpecSectionMeta {
  key: string;
  label: string;
  explanation: string;
  placeholder: string;
  rows: number;
  required: boolean;
}

export const SPEC_SECTIONS: SpecSectionMeta[] = [
  {
    key: 'abstract',
    label: '1. Abstract',
    explanation: 'A concise technical disclosure (under 150 words) summarizing the field, novel mechanism, and industrial utility.',
    placeholder: 'Summarize the core technical mechanism, principal components, and primary utility of the invention...',
    rows: 4,
    required: true,
  },
  {
    key: 'background',
    label: '2. Background of the Invention',
    explanation: 'State of the art, existing technologies, and technical domain in which the invention operates.',
    placeholder: 'Describe the technical domain and existing state-of-the-art implementations, referencing known prior systems...',
    rows: 5,
    required: true,
  },
  {
    key: 'problem',
    label: '3. Technical Problem to be Solved',
    explanation: 'Deficiencies, bottlenecks, or specific challenges in prior solutions that this invention addresses.',
    placeholder: 'Specify the exact technical bottlenecks, mechanical defects, or algorithmic limitations encountered in prior art...',
    rows: 4,
    required: true,
  },
  {
    key: 'proposedSolution',
    label: '4. Proposed Solution',
    explanation: 'Core innovative technical mechanism and methodology devised to overcome the stated problem.',
    placeholder: 'Detail the innovative technical architecture, apparatus, and methodology devised to overcome the problem...',
    rows: 5,
    required: true,
  },
  {
    key: 'summary',
    label: '5. Summary of the Invention',
    explanation: 'High-level overview of primary and alternate embodiments before presenting detailed description.',
    placeholder: 'Summarize the primary aspects, embodiments, and physical mechanisms of the invention...',
    rows: 5,
    required: false,
  },
  {
    key: 'detailedDescription',
    label: '6. Detailed Description',
    explanation: 'Complete, enabling disclosure of preferred embodiments with reference numerals matching patent drawings.',
    placeholder: 'Provide complete, enabling disclosure with reference to visual drawing figures, structural components, and assemblies...',
    rows: 8,
    required: true,
  },
  {
    key: 'technicalComponents',
    label: '7. Technical Components',
    explanation: 'List of all structural, electrical, and computational elements with corresponding reference numerals.',
    placeholder: 'Component 102: Fluid inlet; Component 104: Quartz catalytic tube; Component 106: Ultrasonic transducer ring...',
    rows: 5,
    required: false,
  },
  {
    key: 'workingPrinciple',
    label: '8. Working Principle',
    explanation: 'Step-by-step physical or computational flow from initial input reception to final technical effect.',
    placeholder: 'Describe the end-to-end operation: fluid ingress, catalytic activation, resonance modulation, and treated egress...',
    rows: 5,
    required: false,
  },
  {
    key: 'advantages',
    label: '9. Technical Advantages',
    explanation: 'Measurable improvements, energy savings, longevity, or performance gains over existing solutions.',
    placeholder: 'Eliminates chemical additives, reduces power consumption by 45%, and extends service life to over five years...',
    rows: 4,
    required: false,
  },
  {
    key: 'applications',
    label: '10. Applications',
    explanation: 'Practical use cases, commercial deployment domains, industrial adaptations, and relevant environments.',
    placeholder: 'Decentralized rural water kiosks, disaster relief encampments, and maritime vessel freshwater generation...',
    rows: 4,
    required: false,
  },
  {
    key: 'industrialApplicability',
    label: '11. Industrial Applicability',
    explanation: 'Under Section 2(1)(ac) of The Patents Act, state how the invention can be manufactured or used industrially.',
    placeholder: 'Applicable in municipal water utilities, defense expeditionary units, and commercial water purification equipment...',
    rows: 4,
    required: false,
  },
];

type SaveState = 'SAVED' | 'SAVING' | 'DIRTY' | 'FAILED';

export const SpecificationStudio: React.FC<SpecificationStudioProps> = ({
  projectId,
  project,
  onRefreshProject,
  onNavigateTab,
}) => {
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('SAVED');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [lastSyncedForm2, setLastSyncedForm2] = useState<string | null>(null);
  const [syncingForm2, setSyncingForm2] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Specification model state
  const [specTitle, setSpecTitle] = useState('');
  const [specType, setSpecType] = useState<'PROVISIONAL' | 'COMPLETE'>('COMPLETE');
  const [currentVersionNumber, setCurrentVersionNumber] = useState(1);
  const [reviewContext, setReviewContext] = useState<any>(null);

  // 11 Sections
  const [formData, setFormData] = useState<Record<string, string>>({
    abstract: '',
    background: '',
    problem: '',
    proposedSolution: '',
    summary: '',
    detailedDescription: '',
    technicalComponents: '',
    workingPrinciple: '',
    advantages: '',
    applications: '',
    industrialApplicability: '',
  });

  const [selectedSectionKey, setSelectedSectionKey] = useState<string>('abstract');

  // Versioning state
  const [versions, setVersions] = useState<any[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showCreateVersionModal, setShowCreateVersionModal] = useState(false);
  const [newVersionSummary, setNewVersionSummary] = useState('');
  const [creatingVersion, setCreatingVersion] = useState(false);

  // Snapshot modal state
  const [snapshotView, setSnapshotView] = useState<any | null>(null);

  // Compare modal state
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareVersionAId, setCompareVersionAId] = useState<string>('current');
  const [compareVersionBId, setCompareVersionBId] = useState<string>('');
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [comparing, setComparing] = useState(false);

  // Safe restore modal state
  const [restoreTarget, setRestoreTarget] = useState<any | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Debounced auto-save timer ref
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // Load specification
  const loadSpecification = async () => {
    try {
      setLoading(true);
      const res = await patentApi.getSpecification(projectId);
      const data = res.data;

      if (data) {
        setSpecTitle(data.title || project?.title || 'Patent Specification');
        setSpecType(data.specificationType || 'COMPLETE');
        setCurrentVersionNumber(data.version || 1);
        setVersions(data.versions || []);
        setReviewContext(data.reviewContext || null);

        if (data.lastSyncedWithForm2) {
          setLastSyncedForm2(new Date(data.lastSyncedWithForm2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }

        if (data.updatedAt) {
          setLastSavedTime(new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }

        const initialForm = {
          abstract: data.abstract || '',
          background: data.background || '',
          problem: data.problem || '',
          proposedSolution: data.proposedSolution || '',
          summary: data.summary || '',
          detailedDescription: data.detailedDescription || '',
          technicalComponents: data.technicalComponents || '',
          workingPrinciple: data.workingPrinciple || '',
          advantages: data.advantages || '',
          applications: data.applications || '',
          industrialApplicability: data.industrialApplicability || '',
        };

        setFormData(initialForm);
        lastSavedDataRef.current = JSON.stringify({ title: data.title, ...initialForm });
        setSaveState('SAVED');
      }
    } catch (err: any) {
      console.error('Failed to load specification', err);
      toast.error(err.response?.data?.error || 'Failed to load patent specification');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadSpecification();
    }
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [projectId]);

  // Handle section text modification
  const handleSectionChange = (key: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      triggerAutosave(specTitle, updated);
      return updated;
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setSpecTitle(newTitle);
    triggerAutosave(newTitle, formData);
  };

  // Debounced Autosave
  const triggerAutosave = (title: string, data: Record<string, string>) => {
    setSaveState('DIRTY');
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      performSave(title, data, false);
    }, 1800);
  };

  // Perform Save (manual or autosave)
  const performSave = async (title: string, data: Record<string, string>, isManual = false) => {
    const payload = {
      title,
      specificationType: specType,
      ...data,
      createSnapshot: false,
    };

    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedDataRef.current && !isManual) {
      setSaveState('SAVED');
      return;
    }

    try {
      setSaveState('SAVING');
      const res = await patentApi.saveSpecification(projectId, payload);
      lastSavedDataRef.current = serialized;
      setSaveState('SAVED');
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(nowStr);

      if (res.data?.versions) {
        setVersions(res.data.versions);
      }

      if (isManual) {
        toast.success('Specification saved successfully');
      }
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      console.error('Save failed', err);
      setSaveState('FAILED');
      if (isManual) {
        toast.error('Failed to save specification draft');
      }
    }
  };

  // Create explicit version snapshot
  const handleCreateVersionSnapshot = async () => {
    try {
      setCreatingVersion(true);
      // Ensure working draft is persisted first
      await performSave(specTitle, formData, false);

      const summary = newVersionSummary.trim() || 'Specification updated';
      const res = await patentApi.createSpecificationVersion(projectId, { changeSummary: summary });

      if (res.data) {
        setCurrentVersionNumber(res.data.version || (currentVersionNumber + 1));
        if (res.data.versions) {
          setVersions(res.data.versions);
        } else {
          await loadSpecification();
        }
        setShowCreateVersionModal(false);
        setNewVersionSummary('');
        toast.success(`Created Version ${res.data.version} snapshot!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create version snapshot');
    } finally {
      setCreatingVersion(false);
    }
  };

  // Safe Restore Version
  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    try {
      setRestoring(true);
      const res = await patentApi.restoreSpecificationVersion(projectId, restoreTarget.id);
      toast.success(`Restored from Version ${restoreTarget.versionNumber}! Created Version ${res.data?.version}.`);
      setRestoreTarget(null);
      setShowHistoryDrawer(false);
      await loadSpecification();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to restore historical version');
    } finally {
      setRestoring(false);
    }
  };

  // Sync with Form 2
  const handleSyncForm2 = async () => {
    try {
      setSyncingForm2(true);
      // Save working draft first
      await performSave(specTitle, formData, false);
      const res = await patentApi.syncSpecificationWithForm2(projectId);

      if (res.data?.success) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSyncedForm2(timeStr);
        toast.success('Approved specification synchronized into Indian Patent Form 2!');
        if (onRefreshProject) onRefreshProject();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to synchronize with Form 2');
    } finally {
      setSyncingForm2(false);
    }
  };

  // Export PDF Form 2
  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await performSave(specTitle, formData, false);
      const res = await patentApi.exportSpecificationPdf(projectId);
      if (res.data?.fileUrl) {
        const fullUrl = res.data.fileUrl.startsWith('http')
          ? res.data.fileUrl
          : `http://localhost:5000${res.data.fileUrl}`;
        window.open(fullUrl, '_blank');
        toast.success('IPO Form 2 Specification PDF exported successfully!');
      } else {
        toast.success('Form 2 PDF generated!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to export Specification PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  // Run Version Comparison
  const handleRunComparison = async (verAId: string, verBId: string) => {
    try {
      setComparing(true);
      const res = await patentApi.compareSpecificationVersions(projectId, verAId, verBId);
      setCompareResult(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to compare versions');
    } finally {
      setComparing(false);
    }
  };

  // Open compare modal with specific version
  const openCompareModalWithVersion = (verId: string) => {
    setCompareVersionAId(verId);
    setCompareVersionBId('current');
    setCompareModalOpen(true);
    handleRunComparison(verId, 'current');
  };

  // Open snapshot view
  const openSnapshotView = async (verId: string) => {
    try {
      const res = await patentApi.getSpecificationVersion(projectId, verId);
      setSnapshotView(res.data);
    } catch (err: any) {
      toast.error('Failed to load version snapshot');
    }
  };

  // Dynamic completeness calculation from active formData
  const filledCount = SPEC_SECTIONS.filter((s) => {
    const val = formData[s.key];
    return typeof val === 'string' && val.trim().length > 10;
  }).length;
  const completenessPercentage = Math.round((filledCount / SPEC_SECTIONS.length) * 100);

  const activeSection = SPEC_SECTIONS.find((s) => s.key === selectedSectionKey) || SPEC_SECTIONS[0];
  const activeContent = formData[activeSection.key] || '';
  const wordCount = activeContent.trim().split(/\s+/).filter(Boolean).length;
  const charCount = activeContent.length;
  const activeSectionIndex = SPEC_SECTIONS.findIndex((s) => s.key === selectedSectionKey);
  const prevSection = SPEC_SECTIONS[activeSectionIndex - 1];
  const nextSection = SPEC_SECTIONS[activeSectionIndex + 1];

  if (loading) {
    return (
      <div className="bg-white border border-stone-200/90 rounded-3xl p-16 text-center shadow-xs">
        <Loader2 className="w-8 h-8 text-teal-600 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-stone-600">Loading Patent Specification Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-stone-900 animate-fade-in">
      {/* 1. Review Banner (when changes requested) */}
      {reviewContext && reviewContext.decision === 'CHANGES_REQUESTED' && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                Changes Requested by {reviewContext.reviewerName || 'Reviewer'}
              </span>
              <span className="text-[10px] text-amber-700 font-mono">
                {new Date(reviewContext.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-stone-700 leading-relaxed">
              {reviewContext.comments || 'Please revise the specification sections in accordance with supervisory feedback.'}
            </p>
          </div>
        </div>
      )}

      {/* 2. Top Header Card */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('Overview')}
                className="hover:text-stone-900 transition flex items-center gap-1"
              >
                <span>← Back to Invention</span>
              </button>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
                Draft Stage
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <h1 className="text-lg font-extrabold text-stone-900 tracking-tight">
                Patent Specification Studio
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 text-[11px] font-bold">
                Version {currentVersionNumber} (Current)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[11px] font-bold">
                IPO Form 2 Ready
              </span>
            </div>

            {/* Editable Title */}
            <input
              type="text"
              value={specTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Title of Invention (e.g. SMART SOLAR WATER BOTTLE)"
              className="w-full text-xs font-semibold text-stone-700 bg-transparent border-b border-transparent hover:border-stone-200 focus:border-teal-600 focus:bg-stone-50/50 outline-hidden py-1 px-1 rounded transition"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sync with Form 2 Button */}
            <button
              type="button"
              onClick={handleSyncForm2}
              disabled={syncingForm2}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              title="Synchronizes current structured sections directly into Indian Patent Form 2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-700 ${syncingForm2 ? 'animate-spin' : ''}`} />
              <span>{syncingForm2 ? 'Syncing...' : 'Sync with Form 2'}</span>
            </button>

            {/* Version History Button */}
            <button
              type="button"
              onClick={() => setShowHistoryDrawer(true)}
              className="px-3.5 py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <History className="w-3.5 h-3.5 text-stone-500" />
              <span>Versions ({versions.length})</span>
            </button>

            {/* Create Version Button */}
            <button
              type="button"
              onClick={() => setShowCreateVersionModal(true)}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Create Version</span>
            </button>

            {/* Export PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span>{exportingPdf ? 'Exporting...' : 'Export Form 2'}</span>
            </button>
          </div>
        </div>

        {/* Status bar: Completeness, Autosave status, Form 2 Sync timestamp */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
          {/* Completeness Bar */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-stone-700">Specification Progress:</span>
            <div className="w-36 bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200/60">
              <div
                className="h-full bg-teal-600 transition-all duration-300"
                style={{ width: `${completenessPercentage}%` }}
              />
            </div>
            <span className="font-extrabold text-stone-900">
              {completenessPercentage}% ({filledCount}/{SPEC_SECTIONS.length} sections)
            </span>
          </div>

          {/* Autosave & Sync indicator */}
          <div className="flex flex-wrap items-center gap-4 text-stone-500">
            {/* Form 2 Sync note */}
            <span className="text-[11px]">
              {lastSyncedForm2 ? `Last synchronized with Form 2: ${lastSyncedForm2}` : 'Not yet synced with Form 2'}
            </span>

            {/* Autosave Status */}
            <div className="flex items-center gap-1.5 font-medium">
              {saveState === 'SAVING' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-stone-500 animate-spin" />
                  <span className="text-stone-500">Saving...</span>
                </>
              )}
              {saveState === 'SAVED' && (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-stone-600">
                    {lastSavedTime ? `Saved at ${lastSavedTime}` : 'All changes saved'}
                  </span>
                </>
              )}
              {saveState === 'DIRTY' && (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-amber-700">Unsaved changes</span>
                </>
              )}
              {saveState === 'FAILED' && (
                <div className="flex items-center gap-1.5 text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Save failed</span>
                  <button
                    type="button"
                    onClick={() => performSave(specTitle, formData, true)}
                    className="underline font-bold ml-1 hover:text-rose-800"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Left 11-Section Navigation, Right Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section Navigation (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-stone-200/90 rounded-3xl p-4 shadow-xs space-y-2">
          <div className="pb-3 border-b border-stone-100 px-3 flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              11 Statutory Sections
            </span>
            <span className="text-[11px] font-bold text-stone-600">
              {filledCount}/{SPEC_SECTIONS.length} Ready
            </span>
          </div>

          <nav className="space-y-1" aria-label="Specification Sections">
            {SPEC_SECTIONS.map((sec) => {
              const val = formData[sec.key] || '';
              const isFilled = val.trim().length > 10;
              const isSelected = selectedSectionKey === sec.key;

              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setSelectedSectionKey(sec.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                    isSelected
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isFilled ? (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-600'}`}
                      />
                    ) : isSelected ? (
                      <ArrowRight className="w-4 h-4 shrink-0 text-teal-200" />
                    ) : (
                      <Circle className="w-4 h-4 shrink-0 text-stone-300" />
                    )}
                    <span className="truncate">{sec.label}</span>
                  </div>

                  {sec.required && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        isSelected ? 'text-teal-200' : 'text-rose-500'
                      }`}
                    >
                      *
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section Editor (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          {/* Section Header */}
          <div className="pb-3 border-b border-stone-100 space-y-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-stone-900 tracking-tight">
                  {activeSection.label}
                </h2>
                {activeSection.required ? (
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60 text-[10px] font-bold uppercase tracking-wider">
                    Mandatory Section
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-semibold">
                    Supporting Disclosure
                  </span>
                )}
              </div>

              <div className="text-[11px] font-medium text-stone-500">
                {wordCount} words • {charCount} characters
              </div>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">{activeSection.explanation}</p>
          </div>

          {/* Editor Area */}
          <div className="space-y-2">
            <textarea
              rows={activeSection.rows || 6}
              value={formData[activeSection.key] || ''}
              onChange={(e) => handleSectionChange(activeSection.key, e.target.value)}
              placeholder={activeSection.placeholder}
              className="w-full p-4 bg-stone-50/50 hover:bg-stone-50 focus:bg-white border border-stone-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 rounded-2xl text-xs text-stone-900 placeholder:text-stone-400 font-sans leading-relaxed transition resize-y"
            />
            <div className="flex items-center justify-between text-[11px] text-stone-400 font-medium">
              <span>Statutory disclosure formatted for Section 10 Indian Patent Office specification.</span>
              <span className={activeContent.trim().length > 10 ? 'text-emerald-700 font-bold' : 'text-stone-400'}>
                {activeContent.trim().length > 10 ? '✓ Completed' : 'Pending content'}
              </span>
            </div>
          </div>

          {/* Navigation and Manual Save controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100">
            <div>
              {prevSection ? (
                <button
                  type="button"
                  onClick={() => setSelectedSectionKey(prevSection.key)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous: {prevSection.label}</span>
                </button>
              ) : (
                <div />
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => performSave(specTitle, formData, true)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-stone-500" />
                <span>Save Changes</span>
              </button>

              {nextSection ? (
                <button
                  type="button"
                  onClick={() => setSelectedSectionKey(nextSection.key)}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <span>Next: {nextSection.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateVersionModal(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Finalize & Create Version Snapshot</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Version History Drawer / Modal */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-extrabold text-stone-900">Specification Version History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Each version preserves an immutable snapshot of all 11 statutory sections. Restoring an earlier version creates a new current version to protect your audit trail.
            </p>

            {/* Version List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 pr-1 space-y-1">
              {versions.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-8">No historical versions created yet.</p>
              ) : (
                versions.map((ver) => {
                  const isCurrent = ver.versionNumber === currentVersionNumber;
                  return (
                    <div key={ver.id} className="py-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-stone-900">
                            Version {ver.versionNumber}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-400 font-mono">
                          {new Date(ver.createdAt).toLocaleDateString()} {new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 italic">
                        "{ver.changeSummary || 'Specification updated'}"
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openSnapshotView(ver.id)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <Eye className="w-3 h-3 text-stone-500" />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openCompareModalWithVersion(ver.id)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <GitCompare className="w-3 h-3 text-stone-500" />
                          <span>Compare</span>
                        </button>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => setRestoreTarget(ver)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                          >
                            <RotateCcw className="w-3 h-3 text-teal-600" />
                            <span>Restore</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Create Version Modal */}
      {showCreateVersionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Save className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-extrabold text-stone-900">Create Version Snapshot</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateVersionModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Creating a version snapshot captures all 11 structured sections into an immutable milestone (Version {currentVersionNumber + 1}).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">What changed in this revision?</label>
              <textarea
                rows={3}
                value={newVersionSummary}
                onChange={(e) => setNewVersionSummary(e.target.value)}
                placeholder="e.g. Added technical components breakdown and updated working principle..."
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-teal-600 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateVersionModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateVersionSnapshot}
                disabled={creatingVersion}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {creatingVersion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Create Version {currentVersionNumber + 1}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Safe Restore Confirmation Modal */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-stone-900">
                  Restore Version {restoreTarget.versionNumber}?
                </h3>
                <p className="text-xs text-stone-500">Safe version audit protection</p>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 text-xs text-stone-700 space-y-2">
              <p className="font-semibold text-stone-900">Your current content will be preserved.</p>
              <p>
                A new version (Version {versions.length + 1}) will be created populated with the exact contents of Version {restoreTarget.versionNumber}. The audit trail remains 100% intact.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreTarget(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={restoring}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {restoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>Confirm Safe Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Snapshot View Modal */}
      {snapshotView && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] shadow-2xl border border-stone-200 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-extrabold text-stone-900">
                  Version {snapshotView.versionNumber} Snapshot
                </h3>
                <span className="text-xs text-stone-400 font-mono">
                  ({new Date(snapshotView.createdAt).toLocaleString()})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSnapshotView(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <span className="font-bold text-stone-700">Revision Note: </span>
                <span className="text-stone-600">{snapshotView.changeSummary || 'No notes recorded'}</span>
              </div>

              {SPEC_SECTIONS.map((sec) => (
                <div key={sec.key} className="p-4 bg-stone-50/50 rounded-2xl border border-stone-200/60 space-y-1">
                  <h4 className="text-xs font-bold text-stone-900">{sec.label}</h4>
                  <p className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed">
                    {snapshotView[sec.key] || <span className="italic text-stone-400">Empty section</span>}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSnapshotView(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Version Comparison Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[88vh] shadow-2xl border border-stone-200 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-extrabold text-stone-900">Specification Version Comparison</h3>
              </div>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Version selection controls */}
            <div className="flex flex-wrap items-center gap-4 bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-600">Base:</span>
                <select
                  value={compareVersionAId}
                  onChange={(e) => {
                    setCompareVersionAId(e.target.value);
                    handleRunComparison(e.target.value, compareVersionBId);
                  }}
                  className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                >
                  <option value="current">Current Draft</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      Version {v.versionNumber} ({new Date(v.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-stone-400">vs</span>

              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-600">Compared To:</span>
                <select
                  value={compareVersionBId}
                  onChange={(e) => {
                    setCompareVersionBId(e.target.value);
                    handleRunComparison(compareVersionAId, e.target.value);
                  }}
                  className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-semibold"
                >
                  <option value="current">Current Draft</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      Version {v.versionNumber} ({new Date(v.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {compareResult && (
                <span className="ml-auto px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold">
                  {compareResult.changedSectionsCount} section{compareResult.changedSectionsCount === 1 ? '' : 's'} modified
                </span>
              )}
            </div>

            {/* Diff content view */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {comparing ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-stone-500">Calculating section comparison...</p>
                </div>
              ) : compareResult && compareResult.differences ? (
                compareResult.differences.map((diff: any) => (
                  <div
                    key={diff.key}
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      diff.hasChanged
                        ? 'bg-amber-50/40 border-amber-200/90'
                        : 'bg-stone-50/40 border-stone-200/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">{diff.label}</span>
                      {diff.hasChanged ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                          Modified
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400 font-semibold">Unchanged</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-white rounded-xl border border-stone-200/70 space-y-1">
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          Base Version
                        </div>
                        <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                          {diff.contentA || <span className="italic text-stone-300">Empty</span>}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-stone-200/70 space-y-1">
                        <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                          Compared Version
                        </div>
                        <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                          {diff.contentB || <span className="italic text-stone-300">Empty</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400 text-center py-8">Select two versions to view comparison.</p>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
