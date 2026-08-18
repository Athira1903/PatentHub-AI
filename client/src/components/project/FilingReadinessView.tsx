import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  FileText,
  UserCheck,
  FileCode,
  Layers,
  Info,
  Loader2,
  FolderCheck,
  BookOpen,
  Check,
  Download,
  Eye,
  Save,
  Edit3,
  X,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface FilingReadinessViewProps {
  projectId: string;
  project?: any;
  analyticsSummary?: any;
  onRefreshProject?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const FilingReadinessView: React.FC<FilingReadinessViewProps> = (props: any) => {
  const { projectId, project, analyticsSummary, onRefreshProject, onNavigateTab } = props;
  const [generatingPackage, setGeneratingPackage] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [syncingClaims, setSyncingClaims] = useState(false);

  // Forms state
  const [selectedFormType, setSelectedFormType] = useState<string>('Form 2');
  const [formsData, setFormsData] = useState<Record<string, any>>({});
  const [formsList, setFormsList] = useState<any[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [isEditing, setIsEditing] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Load forms from database
  const fetchForms = async () => {
    try {
      setLoadingForms(true);
      const res = await api.get(`/projects/${projectId}/forms`);
      if (res.data?.forms) {
        setFormsList(res.data.forms);
        const map: Record<string, any> = {};
        res.data.forms.forEach((f: any) => {
          map[f.formType] = {
            id: f.id,
            status: f.status || 'DRAFT',
            version: f.version || 1,
            updatedAt: f.updatedAt,
            data: f.formData || {}
          };
        });
        setFormsData(map);
      }
    } catch (err: any) {
      console.error('Failed to load project forms:', err);
    } finally {
      setLoadingForms(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchForms();
    }
  }, [projectId]);

  // Current active form data
  const currentFormData = formsData[selectedFormType]?.data || {};
  const currentFormMeta = formsData[selectedFormType] || {};

  // Form field change handler
  const handleFieldChange = (field: string, value: any) => {
    setFormsData(prev => ({
      ...prev,
      [selectedFormType]: {
        ...prev[selectedFormType],
        data: {
          ...(prev[selectedFormType]?.data || {}),
          [field]: value
        }
      }
    }));
  };

  // Save current form to database
  const handleSaveForm = async () => {
    try {
      setSavingForm(true);
      const payloadData = currentFormData;
      const res = await api.post(`/projects/${projectId}/forms`, {
        formType: selectedFormType,
        formData: payloadData
      });

      toast.success(`${selectedFormType} saved successfully to database!`);
      if (res.data?.form) {
        setFormsData(prev => ({
          ...prev,
          [selectedFormType]: {
            id: res.data.form.id,
            status: res.data.form.status || 'DRAFT',
            version: res.data.form.version || 1,
            updatedAt: res.data.form.updatedAt,
            data: res.data.form.formData || payloadData
          }
        }));
      }
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to save ${selectedFormType}.`);
    } finally {
      setSavingForm(false);
    }
  };

  // Download PDF for the selected form
  const handleDownloadFormPdf = async (formType: string = selectedFormType) => {
    try {
      setDownloadingPdf(formType);
      const res = await api.post(`/projects/${projectId}/forms/pdf`, { formType });
      const doc = res.data?.document;
      if (doc?.fileUrl) {
        const fullUrl = doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:5000${doc.fileUrl}`;
        window.open(fullUrl, '_blank');
        toast.success(`${formType} PDF downloaded and saved in Documents!`);
      } else {
        toast.success(`${formType} PDF generated successfully!`);
      }
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to generate PDF for ${formType}.`);
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Sync claims into Form 2 specification
  const handleSyncClaimsToForm2 = async () => {
    try {
      setSyncingClaims(true);
      const res = await api.post(`/projects/${projectId}/claims/sync-form2`);
      toast.success('Form 2 synchronized with drafted claims!');
      if (res.data?.form?.formData) {
        setFormsData(prev => ({
          ...prev,
          'Form 2': {
            ...prev['Form 2'],
            data: res.data.form.formData
          }
        }));
      } else {
        await fetchForms();
      }
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sync claims into Form 2.');
    } finally {
      setSyncingClaims(false);
    }
  };

  // Compute actual readiness score
  const readinessScore = analyticsSummary?.scores?.filingReadinessScore ?? (
    project?.stage === 'FILED' ? 100 :
    project?.stage === 'FILING_READY' ? 95 :
    project?.stage === 'PATENT_EXPERT_REVIEW' ? 80 :
    project?.stage === 'GUIDE_REVIEW' ? 65 :
    project?.stage === 'FORMS_PREPARATION' ? 50 :
    project?.stage === 'DOCUMENTATION' ? 35 :
    project?.stage === 'LITERATURE_REVIEW' ? 20 : 10
  );

  const hasCoreDetails = !!(project?.title && project?.problemStatement && project?.proposedSolution);
  const hasClaims = (project?.patentClaims?.length || 0) > 0;
  const hasReferences = (project?.patentReferences?.length || 0) > 0;
  const hasDrawings = (project?.drawingFigures?.length || 0) + (project?.prototypes?.length || 0) > 0;
  const hasDocs = (project?.documents?.length || 0) > 0;
  const hasGuideReview = project?.projectReviews?.some((r: any) => r.decision === 'APPROVED') || project?.stage === 'FILING_READY' || project?.stage === 'FILED';

  const hasForm1 = !!formsData['Form 1']?.data?.applicantName || formsList.some(f => f.formType === 'Form 1');
  const hasForm2 = !!formsData['Form 2']?.data?.title || formsList.some(f => f.formType === 'Form 2');
  const hasForm3 = !!formsData['Form 3']?.data?.title || formsList.some(f => f.formType === 'Form 3');
  const hasForm5 = !!formsData['Form 5']?.data?.title || formsList.some(f => f.formType === 'Form 5');
  const hasForm26 = !!formsData['Form 26']?.data?.title || formsList.some(f => f.formType === 'Form 26');
  const hasForms = hasForm1 || hasForm2 || (project?.patentForms?.length || 0) > 0;

  const checklistItems = [
    {
      title: 'Core details',
      subtitle: 'Title, inventors, applicants, domain',
      status: hasCoreDetails ? 'Complete' : 'Incomplete',
      isComplete: hasCoreDetails,
    },
    {
      title: 'Specifications & claims',
      subtitle: hasClaims ? `${project?.patentClaims?.length} claims drafted` : 'Claims drafting required',
      status: hasClaims ? 'Complete' : 'In progress',
      isComplete: hasClaims,
    },
    {
      title: 'Mandatory forms',
      subtitle: hasForms ? 'IPO Form filings drafted' : 'Forms 1, 2, 3, 5 drafting required',
      status: hasForms ? 'Complete' : 'Pending',
      isComplete: hasForms,
    },
    {
      title: 'Supporting documents & drawings',
      subtitle: hasDrawings || hasDocs ? 'Schematics and specifications linked' : 'Drawings/blueprints required',
      status: hasDrawings || hasDocs ? 'Complete' : 'Pending',
      isComplete: hasDrawings || hasDocs,
    },
    {
      title: 'Prior art references',
      subtitle: hasReferences ? `${project?.patentReferences?.length} patent citations recorded` : 'Prior art search required',
      status: hasReferences ? 'Complete' : 'Pending',
      isComplete: hasReferences,
    },
    {
      title: 'Formal supervisor review',
      subtitle: hasGuideReview ? 'Guide / Expert review approved' : 'Formal review verification required',
      status: hasGuideReview ? 'Complete' : 'In progress',
      isComplete: hasGuideReview,
    },
  ];

  // Dynamic Remaining Actions
  const remainingActions: Array<{
    id: number;
    icon: any;
    iconBg: string;
    title: string;
    desc: string;
    priority: string;
    priorityColor: string;
    tabTarget?: string;
  }> = [];

  if (!hasReferences) {
    remainingActions.push({
      id: remainingActions.length + 1,
      icon: Layers,
      iconBg: 'bg-blue-50 text-blue-600',
      title: 'Search & Cite Prior Art',
      desc: 'Perform prior art search and cite at least one reference to establish novelty boundaries.',
      priority: 'High Priority',
      priorityColor: 'bg-rose-50 text-rose-600 border border-rose-100',
      tabTarget: 'Prior Art Search',
    });
  }

  if (!hasClaims) {
    remainingActions.push({
      id: remainingActions.length + 1,
      icon: FileCode,
      iconBg: 'bg-blue-50 text-blue-600',
      title: 'Draft Patent Claims',
      desc: 'Use AI Claims Studio to draft structured independent and dependent claims.',
      priority: 'High Priority',
      priorityColor: 'bg-rose-50 text-rose-600 border border-rose-100',
      tabTarget: 'Claims Studio',
    });
  }

  if (!hasGuideReview) {
    remainingActions.push({
      id: remainingActions.length + 1,
      icon: UserCheck,
      iconBg: 'bg-purple-50 text-purple-600',
      title: 'Submit for Supervisor Review',
      desc: 'Faculty guide or patent expert sign-off is required before final submission.',
      priority: 'Medium',
      priorityColor: 'bg-amber-50 text-amber-600 border border-amber-100',
      tabTarget: 'Reviews',
    });
  }

  if (remainingActions.length === 0) {
    remainingActions.push({
      id: 1,
      icon: Check,
      iconBg: 'bg-emerald-50 text-emerald-600',
      title: 'All milestones satisfied',
      desc: 'Your application components meet statutory readiness requirements. You can now generate the official filing package.',
      priority: 'Complete',
      priorityColor: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    });
  }

  const packageComponents = [
    { name: 'Form 1', icon: FileText, complete: hasForm1 },
    { name: 'Form 2', icon: FileText, complete: hasForm2 },
    { name: 'Form 3', icon: FileText, complete: hasForm3 },
    { name: 'Form 5', icon: FileText, complete: hasForm5 },
    { name: 'Form 26', icon: FileText, complete: hasForm26 },
    { name: 'Claims', icon: FileCode, complete: hasClaims },
    { name: 'Drawings', icon: Layers, complete: hasDrawings },
    { name: 'Specification', icon: BookOpen, complete: hasCoreDetails },
    { name: 'Supporting docs', icon: FolderCheck, complete: hasDocs },
    { name: 'Review sign-off', icon: UserCheck, complete: hasGuideReview },
  ];

  const handleGeneratePackage = async () => {
    try {
      setGeneratingPackage(true);
      await api.post(`/projects/${projectId}/filing-package`);
      toast.success('Master Filing Package generated and registered in Documents!');
      if (onRefreshProject) onRefreshProject();
      if (onNavigateTab) onNavigateTab('Documents');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate filing package.');
    } finally {
      setGeneratingPackage(false);
    }
  };

  const formTabs = [
    { id: 'Form 2', name: 'Form 2', label: 'Form 2 (Complete Spec)', desc: 'Specification & Claims' },
    { id: 'Form 1', name: 'Form 1', label: 'Form 1 (Grant App)', desc: 'Application for Grant' },
    { id: 'Form 3', name: 'Form 3', label: 'Form 3 (Statement)', desc: 'Foreign Filing Undertaking' },
    { id: 'Form 5', name: 'Form 5', label: 'Form 5 (Declaration)', desc: 'Declaration of Inventorship' },
    { id: 'Form 26', name: 'Form 26', label: 'Form 26 (POA)', desc: 'Patent Agent Authorization' },
  ];

  const applicantNameDisplay = currentFormData.applicantName || project?.owner?.fullName || 'Athira Biju';
  const fieldOfInventionDisplay = currentFormData.category || project?.technicalDomain || project?.category || 'Artificial Intelligence';
  const updatedDateStr = currentFormMeta.updatedAt ? new Date(currentFormMeta.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '18 Aug 2026';

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Forms & Statutory Filing Workspace
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Indian Patent Office (IPO) statutory forms drafting, complete specification sync, and filing package readiness.
        </p>
      </div>

      {/* STATUTORY FORM VIEWER & EDITOR (FORM 2 FOCUS) */}
      <div className="app-card p-6 sm:p-7 border border-slate-200/80 bg-white rounded-3xl shadow-xs space-y-6">
        {/* Form Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-150 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            {formTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFormType(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedFormType === tab.id
                    ? 'bg-blue-900 text-white shadow-md shadow-blue-900/15'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {selectedFormType === 'Form 2' && (
              <button
                type="button"
                onClick={handleSyncClaimsToForm2}
                disabled={syncingClaims}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Synchronize Claims from Claims Engineering Studio"
              >
                {syncingClaims ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>Sync Claims to Form 2</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Viewing Mode' : 'Enable Edit'}</span>
            </button>
          </div>
        </div>

        {/* Form Header Info Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-blue-900 text-white rounded-lg text-xs font-black tracking-wide">
                {selectedFormType.toUpperCase()}
              </span>
              <h2 className="text-sm font-extrabold text-slate-900">
                {selectedFormType === 'Form 2' ? 'Complete Specification (Section 10; Rule 13)' :
                 selectedFormType === 'Form 1' ? 'Application for Grant of Patent (Section 7, 54 & 135)' :
                 selectedFormType === 'Form 3' ? 'Statement and Undertaking (Section 8; Rule 12)' :
                 selectedFormType === 'Form 5' ? 'Declaration as to Inventorship (Rule 4.17(i))' :
                 'Authorization of a Patent Agent (Section 140; Rule 135)'}
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Indian Patent Office (IPO) Statutory Pre-Filing Draft Document
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Status:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-bold text-[11px]">
                {currentFormMeta.status || 'Draft'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Last Updated:</span>
              <span className="text-slate-700 font-bold text-[11px]">{updatedDateStr}</span>
            </div>
          </div>
        </div>

        {/* Loading indicator if loading forms */}
        {loadingForms && (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-blue-900" />
            <span className="text-xs font-medium">Loading form details...</span>
          </div>
        )}

        {/* FORM CONTENT FIELDS (FORM 2 SPECIFICATION) */}
        {!loadingForms && selectedFormType === 'Form 2' && (
          <div className="space-y-5 border border-slate-200 rounded-2xl p-5 bg-white shadow-2xs">
            {/* Title of Invention */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Title of Invention
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={currentFormData.title ?? project?.title ?? ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Enter complete technical title of the invention..."
                className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 disabled:opacity-85"
              />
            </div>

            {/* Applicant Details & Field of Invention Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Applicant Details (Name, Nationality, Address)
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={currentFormData.applicantName ?? applicantNameDisplay}
                  onChange={(e) => handleFieldChange('applicantName', e.target.value)}
                  placeholder="Applicant Full Name"
                  className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 disabled:opacity-85"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Field of Invention
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={currentFormData.category ?? fieldOfInventionDisplay}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  placeholder="e.g. Artificial Intelligence, Transportation Systems"
                  className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 disabled:opacity-85"
                />
              </div>
            </div>

            {/* Background of the Invention */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Background of the Invention & Prior Art Limitations
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Detailed technological context</span>
              </div>
              <textarea
                rows={4}
                disabled={!isEditing}
                value={currentFormData.problemStatement ?? project?.problemStatement ?? ''}
                onChange={(e) => handleFieldChange('problemStatement', e.target.value)}
                placeholder="Describe conventional systems, state of prior art, limitations, and problems solved..."
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 leading-relaxed disabled:opacity-85"
              />
            </div>

            {/* Summary of the Invention */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Summary of the Invention & Technical Solution
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Core novelty and technical architecture</span>
              </div>
              <textarea
                rows={4}
                disabled={!isEditing}
                value={currentFormData.proposedSolution ?? project?.proposedSolution ?? ''}
                onChange={(e) => handleFieldChange('proposedSolution', e.target.value)}
                placeholder="Explain the principal technical components, embodiment structure, and operational flow..."
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 leading-relaxed disabled:opacity-85"
              />
            </div>

            {/* Claims Scope */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Claims Specification (Form 2 Section 4)
                </label>
                <span className="text-[10px] text-indigo-650 font-bold">
                  {project?.patentClaims?.length ? `${project.patentClaims.length} Claims drafted` : 'Drafted in Claims Studio'}
                </span>
              </div>
              <textarea
                rows={3}
                disabled={!isEditing}
                value={currentFormData.claimsText ?? (project?.patentClaims?.length ? project.patentClaims.map((c: any) => `Claim ${c.claimNumber} (${c.claimType}): ${c.preamble || ''} ${c.body}`).join('\n\n') : `1. A computer-implemented or technical system for ${project?.title || 'the invention'}, comprising: ${project?.proposedSolution || 'the disclosed components.'}`)}
                onChange={(e) => handleFieldChange('claimsText', e.target.value)}
                placeholder="Claims language defining boundaries of legal exclusivity..."
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600 leading-relaxed disabled:opacity-85"
              />
            </div>
          </div>
        )}

        {/* FORM 1 FIELDS */}
        {!loadingForms && selectedFormType === 'Form 1' && (
          <div className="space-y-4 border border-slate-200 rounded-2xl p-5 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Applicant Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={currentFormData.applicantName ?? applicantNameDisplay}
                  onChange={(e) => handleFieldChange('applicantName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nationality & Country</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={currentFormData.nationality ?? 'Indian'}
                  onChange={(e) => handleFieldChange('nationality', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Address for Service</label>
              <input
                type="text"
                disabled={!isEditing}
                value={currentFormData.address ?? project?.owner?.institution ?? 'University / Research Lab, India'}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
        )}

        {/* FORM 3, 5, 26 GENERIC VIEW */}
        {!loadingForms && ['Form 3', 'Form 5', 'Form 26'].includes(selectedFormType) && (
          <div className="space-y-4 border border-slate-200 rounded-2xl p-5 bg-white">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Title of Invention</label>
              <input
                type="text"
                disabled={!isEditing}
                value={currentFormData.title ?? project?.title ?? ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {selectedFormType === 'Form 3' ? 'Statement & Undertaking Text' :
                 selectedFormType === 'Form 5' ? 'Declaration of Inventorship' :
                 'Power of Attorney Scope'}
              </label>
              <textarea
                rows={4}
                disabled={!isEditing}
                value={
                  selectedFormType === 'Form 3' ? (currentFormData.undertakingText || 'I/We hereby declare that we have not made any application for a patent for the same or substantially the same invention outside India except those declared herein.') :
                  selectedFormType === 'Form 5' ? (currentFormData.declarationText || `I/We, the true and first inventors for the patent project titled "${project?.title || 'the invention'}", hereby confirm our inventorship credentials under IPO rules.`) :
                  (currentFormData.authorizationScope || `To act, represent, file and prosecute the patent specification titled "${project?.title || 'the invention'}" on behalf of the applicant.`)
                }
                onChange={(e) => {
                  const key = selectedFormType === 'Form 3' ? 'undertakingText' : selectedFormType === 'Form 5' ? 'declarationText' : 'authorizationScope';
                  handleFieldChange(key, e.target.value);
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        )}

        {/* Action Buttons: [ Edit / Save ] [ Preview ] [ Download PDF ] */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveForm}
              disabled={savingForm}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/15 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {savingForm ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Draft...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 rounded-xl text-xs font-bold shadow-3xs flex items-center gap-2 transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span>Preview IPO Format</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleDownloadFormPdf(selectedFormType)}
            disabled={downloadingPdf === selectedFormType}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/15 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {downloadingPdf === selectedFormType ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {selectedFormType} PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Split Section: Gauge & Checklist vs Remaining Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (6 cols): Gauge + Verification Checklist */}
        <div className="lg:col-span-6 space-y-6">
          {/* Gauge Summary Banner */}
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              {/* Circular SVG Gauge */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray={`${readinessScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-2xl font-black text-slate-900 font-sans">
                {readinessScore}%
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-slate-900">
                {readinessScore >= 80 ? (
                  <>Your project is <span className="text-emerald-600 font-extrabold">filing ready</span></>
                ) : (
                  <>Your project is <span className="text-amber-600 font-extrabold">in preparation</span></>
                )}
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {readinessScore >= 80
                  ? 'All core statutory milestones are complete. You can export the consolidated filing bundle.'
                  : 'Complete the remaining checklist milestones below to achieve full filing readiness.'}
              </p>
            </div>
          </div>

          {/* 6 Verification Sections */}
          <div className="space-y-3 pt-2">
            {checklistItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-3xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2 rounded-xl ${item.isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">{item.subtitle}</p>
                  </div>
                </div>

                <div>
                  {item.isComplete ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
                      Complete
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      {item.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (6 cols): Remaining Actions Card */}
        <div className="lg:col-span-6">
          <div className="app-card p-6 sm:p-7 space-y-6 shadow-xs">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Remaining actions</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Complete the following to reach 100% readiness.
              </p>
            </div>

            <div className="space-y-3.5">
              {remainingActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    onClick={() => action.tabTarget && onNavigateTab && onNavigateTab(action.tabTarget)}
                    className={`p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl flex items-start justify-between gap-3 ${
                      action.tabTarget ? 'cursor-pointer hover:border-slate-300 transition' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-6 h-6 rounded-full border border-slate-200 bg-white text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {action.id}
                      </div>
                      <div className={`p-2 rounded-xl ${action.iconBg} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{action.title}</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                          {action.desc}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${action.priorityColor}`}>
                      {action.priority}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('Overview');
                toast.success('Returning to Overview Command Center.');
              }}
              className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/10 transition cursor-pointer"
            >
              Continue preparation
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Final Filing Package 10-Item Grid */}
      <div className="app-card p-6 sm:p-7 space-y-6 shadow-xs">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Final filing package</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review the components included in your final filing package.
          </p>
        </div>

        {/* 10-Component Icon Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
          {packageComponents.map((comp, idx) => {
            const Icon = comp.icon;
            return (
              <div
                key={idx}
                className="p-3 bg-slate-50/60 border border-slate-200/70 rounded-2xl flex flex-col items-center justify-center text-center space-y-2.5"
              >
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 text-slate-600 shadow-3xs">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 truncate w-full">
                  {comp.name}
                </span>
                <div className={`w-4 h-4 rounded-full text-white flex items-center justify-center text-[10px] font-bold ${
                  comp.complete ? 'bg-emerald-500' : 'bg-slate-300'
                }`}>
                  {comp.complete ? <Check className="w-3 h-3 stroke-[3]" /> : '–'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Generate Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleGeneratePackage}
            disabled={generatingPackage}
            className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {generatingPackage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compiling Final Filing Package...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Generate filing package</span>
              </>
            )}
          </button>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-3.5 bg-blue-50/60 border border-blue-150 rounded-2xl flex items-center gap-3 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-[11px] leading-relaxed">
            <strong>Preliminary AI-assisted preparation.</strong> Final professional review required. No claim that the system is legally ready to file.
          </p>
        </div>
      </div>

      {/* MODAL: IPO STATUTORY FORM PREVIEW */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-5 h-5 text-blue-900" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  IPO {selectedFormType} Formal Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Official IPO Paper Layout */}
            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800 font-serif leading-relaxed bg-white">
              <div className="text-center space-y-1 border-b pb-4 border-slate-300">
                <p className="font-bold text-[11px] uppercase tracking-widest text-slate-600">The Patents Act, 1970 (39 of 1970) & The Patents Rules, 2003</p>
                <h2 className="text-lg font-black uppercase text-slate-900">{selectedFormType}</h2>
                <p className="font-bold text-xs uppercase text-slate-700">
                  {selectedFormType === 'Form 2' ? 'Complete Specification (Section 10; Rule 13)' :
                   selectedFormType === 'Form 1' ? 'Application for Grant of Patent (Section 7, 54 & 135)' :
                   selectedFormType === 'Form 3' ? 'Statement and Undertaking Under Section 8' :
                   selectedFormType === 'Form 5' ? 'Declaration as to Inventorship' :
                   'Form for Authorization of a Patent Agent'}
                </p>
              </div>

              {/* Form 2 Specific Preview Body */}
              {selectedFormType === 'Form 2' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase">1. Title of the Invention</h4>
                    <p className="p-3 bg-slate-50 rounded-lg mt-1 font-semibold text-slate-800">
                      {currentFormData.title || project?.title || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase">2. Applicant Details</h4>
                    <p className="p-3 bg-slate-50 rounded-lg mt-1 text-slate-700">
                      <strong>Name:</strong> {currentFormData.applicantName || applicantNameDisplay}<br />
                      <strong>Nationality:</strong> Indian<br />
                      <strong>Address:</strong> {project?.owner?.institution || 'India'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase">3. Field of Invention</h4>
                    <p className="p-3 bg-slate-50 rounded-lg mt-1 text-slate-700">
                      {currentFormData.category || fieldOfInventionDisplay}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase">4. Background & Prior Art</h4>
                    <p className="p-3 bg-slate-50 rounded-lg mt-1 whitespace-pre-wrap text-slate-700">
                      {currentFormData.problemStatement || project?.problemStatement || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase">5. Summary & Technical Architecture</h4>
                    <p className="p-3 bg-slate-50 rounded-lg mt-1 whitespace-pre-wrap text-slate-700">
                      {currentFormData.proposedSolution || project?.proposedSolution || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase">6. Claims (Boundaries of Protection)</h4>
                    <pre className="p-3 bg-slate-50 rounded-lg mt-1 whitespace-pre-wrap text-slate-800 font-mono text-[11px]">
                      {currentFormData.claimsText || (project?.patentClaims?.length ? project.patentClaims.map((c: any) => `Claim ${c.claimNumber} (${c.claimType}): ${c.preamble || ''} ${c.body}`).join('\n\n') : `1. A system for ${project?.title}, comprising: ${project?.proposedSolution}`)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Generic Form Preview */}
              {selectedFormType !== 'Form 2' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase">Project / Applicant Information</h4>
                    <p className="p-3 bg-slate-50 rounded-lg mt-1 text-slate-700">
                      <strong>Title:</strong> {currentFormData.title || project?.title}<br />
                      <strong>Applicant:</strong> {currentFormData.applicantName || applicantNameDisplay}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase">Statutory Declaration</h4>
                    <p className="p-3 bg-slate-50 rounded-lg mt-1 whitespace-pre-wrap text-slate-700">
                      {currentFormData.undertakingText || currentFormData.declarationText || currentFormData.authorizationScope || 'Statutory declaration on file.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <span className="text-[11px] text-slate-500 font-medium">
                PatentHub-AI Statutory Document Viewer
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadFormPdf(selectedFormType)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
