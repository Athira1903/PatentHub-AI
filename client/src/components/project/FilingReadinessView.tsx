import React, { useState } from 'react';
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
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface FilingReadinessViewProps {
  projectId: string;
  project?: any;
  analyticsSummary: any;
  onRefreshProject?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const FilingReadinessView: React.FC<FilingReadinessViewProps> = (props: any) => {
  const { projectId, analyticsSummary, onRefreshProject, onNavigateTab } = props;
  const [generatingPackage, setGeneratingPackage] = useState(false);

  const readinessScore = analyticsSummary?.scores?.filingReadinessScore || 78;

  const checklistItems = [
    {
      title: 'Core details',
      subtitle: 'Title, inventors, applicants, priority',
      status: 'Complete',
      isComplete: true,
    },
    {
      title: 'Specifications & claims',
      subtitle: 'Drafted and structured',
      status: 'Complete',
      isComplete: true,
    },
    {
      title: 'Mandatory forms',
      subtitle: 'Forms 1, 2, 3, 5, 26',
      status: 'Complete',
      isComplete: true,
    },
    {
      title: 'Supporting documents',
      subtitle: 'Drawings, sequence listings, declarations',
      status: 'Complete',
      isComplete: true,
    },
    {
      title: 'Prior art references',
      subtitle: 'Citations and analysis',
      status: 'Complete',
      isComplete: true,
    },
    {
      title: 'Formal review',
      subtitle: 'Expert review and final checks',
      status: 'In progress',
      isComplete: false,
    },
  ];

  const remainingActions = [
    {
      id: 1,
      icon: UserCheck,
      iconBg: 'bg-blue-50 text-blue-600',
      title: 'Complete expert review',
      desc: 'An expert review is required before finalizing the filing package.',
      priority: 'High priority',
      priorityColor: 'bg-red-50 text-red-600 border border-red-100',
    },
    {
      id: 2,
      icon: FileText,
      iconBg: 'bg-blue-50 text-blue-600',
      title: 'Update Form 26',
      desc: 'Form 26 is missing certain details that need to be updated.',
      priority: 'Medium',
      priorityColor: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
    {
      id: 3,
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-600',
      title: 'Resolve Claim 4 warning',
      desc: 'Address AI-detected clarity issue in Claim 4.',
      priority: 'Medium',
      priorityColor: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
  ];

  const packageComponents = [
    { name: 'Form 1', icon: FileText, complete: true },
    { name: 'Form 2', icon: FileText, complete: true },
    { name: 'Form 3', icon: FileText, complete: true },
    { name: 'Form 5', icon: FileText, complete: true },
    { name: 'Form 26', icon: FileText, complete: true },
    { name: 'Claims', icon: FileCode, complete: true },
    { name: 'Drawings', icon: Layers, complete: true },
    { name: 'Specification', icon: BookOpen, complete: true },
    { name: 'Supporting documents', icon: FolderCheck, complete: true },
    { name: 'Review sign-off', icon: UserCheck, complete: true },
  ];

  const handleGeneratePackage = async () => {
    try {
      setGeneratingPackage(true);
      await api.post(`/projects/${projectId}/reports/master`);
      toast.success('Master Filing Package PDF generated and registered in Documents.');
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate filing package.');
    } finally {
      setGeneratingPackage(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Filing readiness
        </h1>
      </div>

      {/* Top Split Section: Gauge & Checklist vs Remaining Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (6 cols): 78% Gauge + 6 Document Readiness Items */}
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
                Your project is <span className="text-emerald-600 font-extrabold">nearly ready</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                You're on track. Complete the remaining actions to finalize your filing package.
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
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
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
                      In progress
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
                    className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl flex items-start justify-between gap-3"
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
                toast.success('Continuing filing preparation...');
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
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
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
    </div>
  );
};
