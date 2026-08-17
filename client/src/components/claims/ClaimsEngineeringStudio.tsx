import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Link as LinkIcon,
  Search,
  Save,
  Check,
  X,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  List,
  RotateCcw,
  RotateCw,
  FileText,
  Download,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface ClaimsEngineeringStudioProps {
  projectId: string;
  isOwnerOrMember?: boolean;
  onRefreshDocuments?: () => void;
}

export const ClaimsEngineeringStudio: React.FC<ClaimsEngineeringStudioProps> = (props: any) => {
  const { projectId } = props;
  const [claims, setClaims] = useState<any[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [searchTree, setSearchTree] = useState('');

  // Claim editor state
  const [editablePreamble, setEditablePreamble] = useState('');
  const [editableBody, setEditableBody] = useState('');
  const [savingClaim, setSavingClaim] = useState(false);

  // Sync & Docket Export states
  const [syncingForm2, setSyncingForm2] = useState(false);
  const [exportingDocket, setExportingDocket] = useState(false);

  // AI & Validation states
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiProposal, setAiProposal] = useState<any | null>(null);
  const [selectedProposedIndices, setSelectedProposedIndices] = useState<number[]>([]);
  const [importingProposal, setImportingProposal] = useState(false);
  const [validatingClaim, setValidatingClaim] = useState(false);

  // New claim modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClaimType, setNewClaimType] = useState<'INDEPENDENT' | 'DEPENDENT'>('INDEPENDENT');
  const [newParentNumber, setNewParentNumber] = useState<number | null>(null);
  const [newPreamble, setNewPreamble] = useState('A smart monitoring system comprising:');
  const [newBody, setNewBody] = useState('a sensing module; and a controller.');

  useEffect(() => {
    fetchClaims();
  }, [projectId]);

  const fetchClaims = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/claims`);
      const claimList = res.data.claims || [];
      setClaims(claimList);
      if (claimList.length > 0 && !selectedClaimId) {
        setSelectedClaimId(claimList[0].id);
        setEditablePreamble(claimList[0].preamble || '');
        setEditableBody(claimList[0].body || '');
      }
    } catch (err: any) {
      toast.error('Failed to load claims list');
    }
  };

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || claims[0];

  useEffect(() => {
    if (selectedClaim) {
      setEditablePreamble(selectedClaim.preamble || '');
      setEditableBody(selectedClaim.body || '');
      // Run quick antecedent validation
      runQuickValidation(selectedClaim);
    }
  }, [selectedClaimId]);

  const runQuickValidation = async (claimObj: any) => {
    try {
      setValidatingClaim(true);
      await api.post(`/projects/${projectId}/claims/validate-antecedents`, {
        preamble: claimObj.preamble || '',
        body: claimObj.body || ''
      });
    } catch (e) {
      // Ignore background validation error
    } finally {
      setValidatingClaim(false);
    }
  };

  const handleSaveCurrentClaim = async () => {
    if (!selectedClaim) return;
    try {
      setSavingClaim(true);
      await api.put(`/projects/${projectId}/claims/${selectedClaim.id}`, {
        preamble: editablePreamble,
        body: editableBody
      });
      toast.success(`Claim ${selectedClaim.claimNumber} saved successfully.`);
      fetchClaims();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save claim.');
    } finally {
      setSavingClaim(false);
    }
  };

  const handleSyncForm2 = async () => {
    try {
      setSyncingForm2(true);
      const res = await api.post(`/projects/${projectId}/claims/sync-form2`);
      toast.success(res.data?.message || 'Claims synchronized to Form 2 specification successfully!');
      if (props.onRefreshDocuments) props.onRefreshDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sync claims with Form 2.');
    } finally {
      setSyncingForm2(false);
    }
  };

  const handleExportDocketPdf = async () => {
    try {
      setExportingDocket(true);
      const res = await api.post(`/projects/${projectId}/claims/docket-pdf`);
      toast.success('Claims Docket PDF generated successfully!');
      if (res.data?.fileUrl) {
        window.open(res.data.fileUrl, '_blank');
      }
      if (props.onRefreshDocuments) props.onRefreshDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate Claims Docket PDF.');
    } finally {
      setExportingDocket(false);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/claims`, {
        claimType: newClaimType,
        dependsOnNumber: newClaimType === 'DEPENDENT' ? newParentNumber : null,
        preamble: newPreamble,
        body: newBody
      });
      toast.success('Claim created successfully.');
      setShowCreateModal(false);
      fetchClaims();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create claim.');
    }
  };

  const handleGenerateAiSet = async () => {
    try {
      setGeneratingAi(true);
      const res = await api.post(`/projects/${projectId}/claims/ai-generate`);
      setAiProposal(res.data);
      setSelectedProposedIndices(res.data.claims.map((_: any, idx: number) => idx));
      toast.success('AI claim set proposal generated. Review below.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI proposal generation failed.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleAcceptSelectedProposal = async () => {
    if (!aiProposal) return;
    try {
      setImportingProposal(true);
      const filteredClaims = aiProposal.claims.filter((_: any, idx: number) =>
        selectedProposedIndices.includes(idx)
      );
      await api.post(`/projects/${projectId}/claims/import-proposal`, {
        proposal: { claims: filteredClaims }
      });
      toast.success('Selected claims imported into project.');
      setAiProposal(null);
      fetchClaims();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import proposed claims.');
    } finally {
      setImportingProposal(false);
    }
  };

  const filteredTreeClaims = claims.filter((c) =>
    `Claim ${c.claimNumber} ${c.preamble} ${c.body}`.toLowerCase().includes(searchTree.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Header & Actions Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Breadcrumb Info */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="text-slate-400">Workspace</span>
          <span>/</span>
          <span className="text-slate-900 font-extrabold">Claims Engineering Studio</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSaveCurrentClaim}
            disabled={savingClaim || !selectedClaim}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save</span>
          </button>

          <button
            onClick={() => selectedClaim && runQuickValidation(selectedClaim)}
            disabled={validatingClaim || !selectedClaim}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Validate claim</span>
          </button>

          {/* Form 2 Sync Action Button */}
          <button
            onClick={handleSyncForm2}
            disabled={syncingForm2 || claims.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {syncingForm2 ? (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>{syncingForm2 ? 'Syncing...' : 'Sync Claims to Form 2'}</span>
          </button>

          {/* Export Claims Docket PDF */}
          <button
            onClick={handleExportDocketPdf}
            disabled={exportingDocket || claims.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {exportingDocket ? (
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{exportingDocket ? 'Generating...' : 'Export Claims Docket'}</span>
          </button>

          {/* AI Generation Set */}
          <button
            onClick={handleGenerateAiSet}
            disabled={generatingAi}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm shadow-blue-600/25 transition disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
            <span>{generatingAi ? 'Generating...' : 'Generate claim set'}</span>
          </button>
        </div>
      </div>

      {/* 3-Column Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (3 cols): Claim Tree */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Claim tree</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                title="Add new claim"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tree Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTree}
              onChange={(e) => setSearchTree(e.target.value)}
              placeholder="Search claims..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
            />
          </div>

          {/* Hierarchy Claim Items */}
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {filteredTreeClaims.map((c) => {
              const isSelected = selectedClaim?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClaimId(c.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs font-bold ${
                    isSelected
                      ? 'bg-blue-50/80 text-blue-700 border border-blue-200 shadow-3xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 text-slate-400 font-mono text-[11px]">{c.claimNumber}</span>
                    <span className="truncate">Claim {c.claimNumber}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      c.claimType === 'INDEPENDENT'
                        ? 'bg-blue-100/70 text-blue-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.claimType === 'INDEPENDENT' ? 'Independent' : 'Dependent'}
                  </span>
                </div>
              );
            })}

            {filteredTreeClaims.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">No claims found.</div>
            )}
          </div>
        </div>

        {/* Center Column (6 cols): Formatted Legal Claim Editor */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">
              Claim {selectedClaim?.claimNumber || 1}
            </h3>
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase">
              {selectedClaim?.claimType === 'INDEPENDENT' ? 'Independent' : 'Dependent'}
            </span>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-600 text-xs">
            <button className="p-1 hover:bg-white rounded text-slate-600" title="Undo"><RotateCcw className="w-3.5 h-3.5" /></button>
            <button className="p-1 hover:bg-white rounded text-slate-600" title="Redo"><RotateCw className="w-3.5 h-3.5" /></button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <span className="px-2 py-0.5 text-[11px] font-bold text-slate-700">Normal ⌄</span>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button className="p-1 hover:bg-white rounded text-slate-600 font-black"><Bold className="w-3.5 h-3.5" /></button>
            <button className="p-1 hover:bg-white rounded text-slate-600 italic"><Italic className="w-3.5 h-3.5" /></button>
            <button className="p-1 hover:bg-white rounded text-slate-600 underline"><Underline className="w-3.5 h-3.5" /></button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button className="p-1 hover:bg-white rounded text-slate-600"><AlignLeft className="w-3.5 h-3.5" /></button>
            <button className="p-1 hover:bg-white rounded text-slate-600"><List className="w-3.5 h-3.5" /></button>
            <button className="p-1 hover:bg-white rounded text-slate-600"><LinkIcon className="w-3.5 h-3.5" /></button>
          </div>

          {/* Editable Preamble & Body */}
          <div className="space-y-3 font-sans text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Preamble</label>
              <input
                type="text"
                value={editablePreamble}
                onChange={(e) => setEditablePreamble(e.target.value)}
                placeholder="A smart monitoring system for industrial equipment, comprising:"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Body & Limitations</label>
              <textarea
                rows={9}
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                placeholder="(a) a sensing module configured to acquire operational data...&#10;(b) a processing module...&#10;(c) an adaptive control module..."
                className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium text-slate-800 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Column (3 cols): Claim Intelligence */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Claim intelligence</h3>
            <span className="text-[10px] font-bold text-slate-400">Elements: {selectedClaim?.claimElements?.length || 6}</span>
          </div>

          <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs font-bold text-blue-800">
            {selectedClaim?.claimType === 'INDEPENDENT' ? 'Independent claim' : 'Dependent claim'}
          </div>

          {/* Intelligence Cards with Chevrons */}
          <div className="space-y-2.5">
            {/* Antecedent basis */}
            <div className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-2xl flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Antecedent basis</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">
                    All limitations appear to have adequate antecedent basis.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            {/* Technical structure */}
            <div className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-2xl flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Technical structure</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">
                    Claim appears to recite a technical solution.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            {/* Potential ambiguity warning */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-2xl flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Potential ambiguity</h4>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5 leading-tight">
                    Consider clarifying "one or more operating parameters".
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
            </div>
          </div>

          {/* Linked Figures */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Linked figures</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold cursor-pointer hover:bg-blue-100">
                FIG. 1
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold cursor-pointer hover:bg-blue-100">
                FIG. 2
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Drawer / Panel: AI Proposal Review */}
      {aiProposal && (
        <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  AI proposal — review before accepting
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  These suggestions are generated from the current claim and prior art context.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAcceptSelectedProposal}
                disabled={importingProposal || selectedProposedIndices.length === 0}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept selected</span>
              </button>
              <button
                onClick={() => setAiProposal(null)}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Reject
              </button>
            </div>
          </div>

          {/* Proposed Claims Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-2 w-8"></th>
                  <th className="pb-2 w-8">#</th>
                  <th className="pb-2">Proposed claim</th>
                  <th className="pb-2 w-28">Change type</th>
                  <th className="pb-2">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aiProposal.claims.map((pc: any, idx: number) => {
                  const isChecked = selectedProposedIndices.includes(idx);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProposedIndices([...selectedProposedIndices, idx]);
                            } else {
                              setSelectedProposedIndices(
                                selectedProposedIndices.filter((i) => i !== idx)
                              );
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-3 font-medium text-slate-800 pr-4">
                        {pc.preamble} {pc.body}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          Addition
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 font-medium">
                        {pc.rationale || 'Strengthens support for model accuracy and reliability.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for creating a new claim */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Add New Patent Claim</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Claim Type</label>
                  <select
                    value={newClaimType}
                    onChange={(e: any) => setNewClaimType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-900"
                  >
                    <option value="INDEPENDENT">INDEPENDENT</option>
                    <option value="DEPENDENT">DEPENDENT</option>
                  </select>
                </div>

                {newClaimType === 'DEPENDENT' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Depends on Claim #</label>
                    <input
                      type="number"
                      min="1"
                      value={newParentNumber || 1}
                      onChange={(e) => setNewParentNumber(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-900"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Preamble</label>
                <input
                  type="text"
                  value={newPreamble}
                  onChange={(e) => setNewPreamble(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Body / Limitations</label>
                <textarea
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Create Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
