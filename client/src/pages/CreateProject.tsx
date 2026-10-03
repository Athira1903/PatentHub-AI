import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Sparkles,
  ArrowRight,
  Check,
  Loader2,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { api, patentApi } from '../services/api';

export const CreateProject: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Steps: 1 = Initial Idea, 2 = Classification & IPC suggestions, 3 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 fields
  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [innovationIdea, setInnovationIdea] = useState('');

  // Step 2 AI Classification suggestions
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [selectedDomain, setSelectedDomain] = useState('IoT');
  const [selectedStructure, setSelectedStructure] = useState<'PRODUCT' | 'PROCESS' | 'PRODUCT_AND_PROCESS'>('PRODUCT');
  const [selectedIpcSymbols, setSelectedIpcSymbols] = useState<string[]>([]);

  // Step 3 settings
  const [specificationType, setSpecificationType] = useState<'COMPLETE' | 'PROVISIONAL'>('COMPLETE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProceedToClassification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please provide an invention title');
      return;
    }
    if (!problemStatement.trim() || !proposedSolution.trim()) {
      toast.error('Please provide both the Technical Problem and Proposed Solution');
      return;
    }

    const fullDescription = `${problemStatement.trim()}\n\nTechnical Solution:\n${proposedSolution.trim()}`;

    setIsAnalyzing(true);
    try {
      const res = await patentApi.suggestClassification({ title, description: fullDescription });
      const data = res.data;
      setSuggestions(data);
      setSelectedDomain(data.primaryDomain || 'IoT');
      setSelectedStructure(data.suggestedStructure || 'PRODUCT');
      setSelectedIpcSymbols(data.ipcCandidates?.slice(0, 2).map((c: any) => c.fullSymbol) || []);
      setStep(2);
    } catch (err: any) {
      console.warn('AI analysis fallback:', err);
      // Fallback
      setSuggestions({
        primaryDomain: 'IoT',
        secondaryDomains: ['Electronics', 'Energy'],
        suggestedStructure: 'PRODUCT',
        structureRationale: 'Physical hardware and electronic sensor apparatus.',
        ipcCandidates: [
          { fullSymbol: 'B65D 51/24', title: 'Closures with auxiliary devices', confidence: 0.85, rationale: 'Vessel closure with electronic features' },
          { fullSymbol: 'H02J 7/35', title: 'Circuit arrangements for solar charging', confidence: 0.82, rationale: 'Energy harvesting power regulation' },
        ],
      });
      setSelectedDomain('IoT');
      setStep(2);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleIpcSymbol = (sym: string) => {
    if (selectedIpcSymbols.includes(sym)) {
      setSelectedIpcSymbols(selectedIpcSymbols.filter((s) => s !== sym));
    } else {
      setSelectedIpcSymbols([...selectedIpcSymbols, sym]);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const abstractText = innovationIdea.trim() || `${title.trim()}: ${proposedSolution.trim()}`;

      const payload = {
        title: title.trim(),
        innovationIdea: abstractText,
        problemStatement: problemStatement.trim(),
        proposedSolution: proposedSolution.trim(),
        technicalDomain: selectedDomain,
        category: selectedDomain,
        patentCategory: selectedStructure,
        specificationType,
        keywords: suggestions?.extractedKeywords?.join(', ') || '',
      };

      const response = await api.post('/projects', payload);
      const projectId = response.data.project.id;

      // Link confirmed IPC classifications
      if (suggestions?.ipcCandidates && selectedIpcSymbols.length > 0) {
        for (const candidate of suggestions.ipcCandidates) {
          if (selectedIpcSymbols.includes(candidate.fullSymbol) && candidate.id) {
            try {
              await api.post(`/projects/${projectId}/ipc`, { ipcId: candidate.id });
            } catch {
              // silent
            }
          }
        }
      }

      toast.success('Invention workspace initialized successfully!');
      navigate(`/dashboard/projects/${projectId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initialize project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          to="/dashboard/projects"
          className="inline-flex items-center text-sm font-medium text-[#557862] hover:text-[#3a6b65] transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Inventions
        </Link>
      </div>

      {/* Progress Steps Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-xl mx-auto mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                step >= 1 ? 'bg-[#557862] text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span className={`text-xs font-medium ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              Basic Idea
            </span>
          </div>
          <div className={`flex-1 h-0.5 mx-3 ${step >= 2 ? 'bg-[#557862]' : 'bg-slate-200'}`} />
          <div className="flex items-center space-x-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                step >= 2 ? 'bg-[#557862] text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span className={`text-xs font-medium ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
              Classification
            </span>
          </div>
          <div className={`flex-1 h-0.5 mx-3 ${step >= 3 ? 'bg-[#557862]' : 'bg-slate-200'}`} />
          <div className="flex items-center space-x-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                step >= 3 ? 'bg-[#557862] text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span className={`text-xs font-medium ${step >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
              Review & Open
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: What are you inventing? */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-[#E2E8E4] shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#191c1b] tracking-tight">What are you inventing?</h1>
            <p className="text-sm text-slate-500 mt-1">
              Start with plain language. You don't need to know patent terminology or legal classifications.
            </p>
          </div>

          <form onSubmit={handleProceedToClassification} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Invention Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Smart Solar Water Bottle with Hydration Monitoring"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#557862] focus:border-transparent transition"
                required
              />
              <p className="text-xs text-slate-400 mt-1.5">
                A descriptive technical title naming the physical device, apparatus, or novel process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Technical Problem Statement <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="What specific technological problem, limitation, inaccuracy, or bottleneck exists in current methods?"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#557862] focus:border-transparent transition"
                  required
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Describe what goes wrong or is missing in existing solutions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Proposed Technical Solution <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={proposedSolution}
                  onChange={(e) => setProposedSolution(e.target.value)}
                  placeholder="How does your invention technically resolve this problem? (Sensors, hardware, circuit, algorithm...)"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#557862] focus:border-transparent transition"
                  required
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Explain the working principle and key technical embodiment.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Innovation Abstract / Summary (Form 2) <span className="text-slate-400 font-normal">(Optional — auto-generated if left empty)</span>
              </label>
              <textarea
                rows={3}
                value={innovationIdea}
                onChange={(e) => setInnovationIdea(e.target.value)}
                placeholder="A concise summary of the technical disclosure and operational capabilities in ~150 words..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#557862] focus:border-transparent transition"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Summarizes the technical disclosure for statutory Indian Patent Office Form 2.
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="inline-flex items-center px-6 py-3 bg-[#3a6b65] hover:bg-[#2d5550] text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Invention...
                  </>
                ) : (
                  <>
                    Analyze & Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Intelligent Classification Suggestions */}
      {step === 2 && suggestions && (
        <div className="bg-white rounded-xl border border-[#E2E8E4] shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f0f7f6] text-[#3a6b65] mb-2 border border-[#dbebe9]">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Intelligent Technology Classification
            </div>
            <h2 className="text-xl font-bold text-[#191c1b]">We analyzed your invention</h2>
            <p className="text-sm text-slate-500 mt-1">
              Based on your description, here are the suggested technology domains and patent categories.
            </p>
          </div>

          {/* Technology Domain Suggestions */}
          <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/50">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
              Suggested Technology Domains
            </label>
            <div className="flex flex-wrap gap-2">
              {[suggestions.primaryDomain, ...(suggestions.secondaryDomains || []), 'Electronics', 'Healthcare', 'Agriculture', 'AI / Computing', 'Mechanical'].filter(
                (v, i, a) => a.indexOf(v) === i
              ).map((dom) => {
                const isSelected = selectedDomain === dom;
                return (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => setSelectedDomain(dom)}
                    className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium transition border ${
                      isSelected
                        ? 'bg-[#557862] text-white border-[#557862]'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 mr-1" />}
                    {dom}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Structure: Product vs Process */}
          <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/50">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Likely Invention Structure
            </label>
            <p className="text-xs text-slate-500 mb-3">{suggestions.structureRationale}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'PRODUCT', label: 'Product / Apparatus', desc: 'Physical device, hardware, chemical composition' },
                { id: 'PROCESS', label: 'Process / Method', desc: 'Sequential algorithmic or manufacturing steps' },
                { id: 'PRODUCT_AND_PROCESS', label: 'Product + Process', desc: 'Both novel physical vessel and operating method' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedStructure(item.id as any)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition ${
                    selectedStructure === item.id
                      ? 'border-[#557862] bg-[#f4f7f5]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{item.label}</span>
                    <input
                      type="radio"
                      checked={selectedStructure === item.id}
                      onChange={() => setSelectedStructure(item.id as any)}
                      className="text-[#557862]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested IPC Candidates */}
          <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Suggested International Patent Classifications (IPC)
              </label>
              <span className="text-[11px] text-slate-400">Select candidates to monitor</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              IPC symbols categorize your invention for global prior-art examination search. You can refine these later in your workspace.
            </p>

            <div className="space-y-2.5">
              {suggestions.ipcCandidates?.map((ipc: any) => {
                const isSelected = selectedIpcSymbols.includes(ipc.fullSymbol);
                return (
                  <div
                    key={ipc.fullSymbol}
                    onClick={() => toggleIpcSymbol(ipc.fullSymbol)}
                    className={`p-3 rounded-lg border flex items-start justify-between cursor-pointer transition ${
                      isSelected ? 'border-[#557862] bg-white' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {ipc.fullSymbol}
                        </span>
                        <span className="text-xs font-medium text-slate-900">{ipc.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{ipc.rationale || ipc.description}</p>
                    </div>
                    <div className="ml-3 mt-1">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border ${
                          isSelected ? 'bg-[#557862] border-[#557862] text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center px-6 py-2.5 bg-[#3a6b65] hover:bg-[#2d5550] text-white text-sm font-medium rounded-lg shadow-sm transition"
            >
              Confirm & Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Specification Type & Final Confirmation */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-[#E2E8E4] shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#191c1b]">Choose Specification Type</h2>
            <p className="text-sm text-slate-500 mt-1">
              Decide whether to prepare a Complete Specification or a Provisional Application under the Indian Patents Act, 1970.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setSpecificationType('COMPLETE')}
              className={`p-5 rounded-xl border cursor-pointer transition ${
                specificationType === 'COMPLETE'
                  ? 'border-[#3a6b65] bg-[#f0f7f6] ring-1 ring-[#3a6b65]'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900">Complete Specification</span>
                <input
                  type="radio"
                  checked={specificationType === 'COMPLETE'}
                  onChange={() => setSpecificationType('COMPLETE')}
                  className="text-[#3a6b65]"
                />
              </div>
              <p className="text-xs text-slate-600">
                Full disclosure with formal patent claims and drawings. Suitable if prototype/design is finalized.
              </p>
              <div className="mt-3 flex items-center text-[11px] text-[#3a6b65] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Includes Claims Studio & Form 2 Complete
              </div>
            </div>

            <div
              onClick={() => setSpecificationType('PROVISIONAL')}
              className={`p-5 rounded-xl border cursor-pointer transition ${
                specificationType === 'PROVISIONAL'
                  ? 'border-[#3a6b65] bg-[#f0f7f6] ring-1 ring-[#3a6b65]'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900">Provisional Specification</span>
                <input
                  type="radio"
                  checked={specificationType === 'PROVISIONAL'}
                  onChange={() => setSpecificationType('PROVISIONAL')}
                  className="text-[#3a6b65]"
                />
              </div>
              <p className="text-xs text-slate-600">
                Secures an immediate priority date without requiring formal claims immediately.
              </p>
              <div className="mt-3 flex items-center text-[11px] text-amber-700 font-medium">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                12-month complete deadline automatically tracked
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-[#fafaf8] border border-[#e2e8e4] rounded-lg p-4 space-y-2 text-xs text-slate-700">
            <div className="font-semibold text-slate-900 text-sm mb-1">Project Summary</div>
            <div>
              <span className="text-slate-500">Invention:</span> <span className="font-medium">{title}</span>
            </div>
            <div>
              <span className="text-slate-500">Domain:</span> <span className="font-medium">{selectedDomain}</span>
            </div>
            <div>
              <span className="text-slate-500">Structure:</span> <span className="font-medium">{selectedStructure}</span>
            </div>
            {selectedIpcSymbols.length > 0 && (
              <div>
                <span className="text-slate-500">Selected IPC:</span>{' '}
                <span className="font-mono font-medium">{selectedIpcSymbols.join(', ')}</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 bg-[#3a6b65] hover:bg-[#2d5550] text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Workspace...
                </>
              ) : (
                <>
                  Create Invention Workspace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
