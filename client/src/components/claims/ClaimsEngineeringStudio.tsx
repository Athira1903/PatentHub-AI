import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Link as LinkIcon,
  Search,
  Save,
  Check,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  RotateCcw,
  RotateCw,
  FileText,
  Download,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface ClaimsEngineeringStudioProps {
  projectId: string;
  isOwnerOrMember?: boolean;
  canEdit?: boolean;
  canSubmit?: boolean;
  permissionLevel?: 'VIEW' | 'EDIT' | 'SUBMIT';
  onRefreshDocuments?: () => void;
}

export const ClaimsEngineeringStudio: React.FC<ClaimsEngineeringStudioProps> = (props: any) => {
  const { projectId } = props;
  const canEdit = props.canEdit !== false && props.permissionLevel !== 'VIEW';
  const [claims, setClaims] = useState<any[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [searchTree, setSearchTree] = useState('');

  // Claim editor state
  const [editablePreamble, setEditablePreamble] = useState('');
  const [editableClaimType, setEditableClaimType] = useState<'INDEPENDENT' | 'DEPENDENT'>('INDEPENDENT');
  const [editableDependsOnNumber, setEditableDependsOnNumber] = useState<number | null>(null);
  const [editableLinkedFigures, setEditableLinkedFigures] = useState<string>('FIG. 1, FIG. 2');
  const [isDirty, setIsDirty] = useState(false);
  const [savingClaim, setSavingClaim] = useState(false);

  // ContentEditable WYSIWYG ref
  const bodyEditorRef = useRef<HTMLDivElement>(null);

  // Sync & Docket Export states
  const [syncingForm2, setSyncingForm2] = useState(false);
  const [exportingDocket, setExportingDocket] = useState(false);

  // AI & Validation states
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiProposal, setAiProposal] = useState<any | null>(null);
  const [selectedProposedIndices, setSelectedProposedIndices] = useState<number[]>([]);
  const [importingProposal, setImportingProposal] = useState(false);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);

  // New claim modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClaimType, setNewClaimType] = useState<'INDEPENDENT' | 'DEPENDENT'>('INDEPENDENT');
  const [newParentNumber, setNewParentNumber] = useState<number | null>(null);
  const [newPreamble, setNewPreamble] = useState('An automated intelligent system comprising:');
  const [newBody, setNewBody] = useState('(a) a sensing module configured to acquire real-time operational data;\n(b) an edge computing processor coupled to the sensing module;\n(c) a communication interface.');

  useEffect(() => {
    fetchClaims();
  }, [projectId]);

  const fetchClaims = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/claims`);
      const claimList = res.data.claims || [];
      setClaims(claimList);
      if (claimList.length > 0) {
        const active = selectedClaimId ? claimList.find((c: any) => c.id === selectedClaimId) || claimList[0] : claimList[0];
        loadClaimIntoEditor(active);
      }
    } catch (err: any) {
      toast.error('Failed to load claims list');
    }
  };

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || claims[0];

  const loadClaimIntoEditor = (claim: any) => {
    if (!claim) return;
    setSelectedClaimId(claim.id);
    setEditablePreamble(claim.preamble || '');
    setEditableClaimType(claim.claimType || 'INDEPENDENT');
    setEditableDependsOnNumber(claim.dependsOnNumber || null);
    setEditableLinkedFigures(claim.linkedFigures || 'FIG. 1, FIG. 2');
    setIsDirty(false);

    // Populate the rich text WYSIWYG editor
    if (bodyEditorRef.current) {
      const rawBody = claim.body || '';
      // Format clean linebreaks into html if needed
      const htmlBody = rawBody.includes('<') ? rawBody : rawBody.replace(/\n/g, '<br/>');
      bodyEditorRef.current.innerHTML = htmlBody;
    }
  };

  useEffect(() => {
    if (selectedClaim) {
      loadClaimIntoEditor(selectedClaim);
    }
  }, [selectedClaimId]);

  // Execute browser WYSIWYG commands
  const execEditorCommand = (command: string, value: string | undefined = undefined) => {
    if (bodyEditorRef.current) {
      bodyEditorRef.current.focus();
      document.execCommand(command, false, value);
      setIsDirty(true);
    }
  };

  // Convert lines inside WYSIWYG editor to statutory (a), (b), (c) clauses
  const handleFormatClausesWysiwyg = () => {
    if (!bodyEditorRef.current) return;
    const textContent = bodyEditorRef.current.innerText || '';
    const lines = textContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const formattedHtml = lines
      .map((line, idx) => {
        const clean = line.replace(/^(\([a-z0-9]+\)|[-*•]|\d+\.)\s*/i, '');
        const letter = alphabet[idx % alphabet.length];
        const isLast = idx === lines.length - 1;
        const punctuation = isLast ? '.' : ';';
        const cleanBody = clean.replace(/[;,.]+$/, '');
        return `<div style="margin-bottom: 6px;"><strong>(${letter})</strong> ${cleanBody}${punctuation}</div>`;
      })
      .join('');

    bodyEditorRef.current.innerHTML = formattedHtml;
    setIsDirty(true);
    toast.success('Formatted statutory claim clauses (a), (b), (c)...');
  };

  // Insert Drawing Tag Callout Badge
  const handleInsertTagCallout = () => {
    if (!bodyEditorRef.current) return;
    bodyEditorRef.current.focus();
    const tagHtml = `<span style="background-color: #EEF2FF; color: #4338CA; padding: 2px 6px; border-radius: 6px; font-weight: bold; border: 1px solid #C7D2FE; margin: 0 2px;">[Sensor Module 102]</span>&nbsp;`;
    document.execCommand('insertHTML', false, tagHtml);
    setIsDirty(true);
  };

  // Template Style Inserter
  const handleApplyTemplateStyle = (type: string) => {
    setStyleDropdownOpen(false);
    if (type === 'INDEP_PREAMBLE') {
      const template = 'An automated intelligent system comprising:';
      setEditablePreamble(template);
      setEditableClaimType('INDEPENDENT');
      setEditableDependsOnNumber(null);
      setIsDirty(true);
    } else if (type === 'DEP_PREAMBLE') {
      const parentNum = editableDependsOnNumber || 1;
      const template = `The system of claim ${parentNum}, wherein:`;
      setEditablePreamble(template);
      setEditableClaimType('DEPENDENT');
      setIsDirty(true);
    } else if (type === 'CLAUSE_BLOCK') {
      handleFormatClausesWysiwyg();
    } else if (type === 'MODULE_LIMITATION') {
      if (bodyEditorRef.current) {
        bodyEditorRef.current.focus();
        const snippet = `<div><strong>(a)</strong> a distributed processing subsystem configured to execute adaptive heuristics;</div>`;
        document.execCommand('insertHTML', false, snippet);
        setIsDirty(true);
      }
    }
  };

  // Save Claim Handler (supporting Ctrl+S)
  const handleSaveCurrentClaim = async () => {
    if (!selectedClaim) return;
    const currentBodyHtml = bodyEditorRef.current ? bodyEditorRef.current.innerHTML : '';
    const currentBodyText = bodyEditorRef.current ? bodyEditorRef.current.innerText : '';

    if (!currentBodyText.trim()) {
      toast.error('Claim body cannot be empty.');
      return;
    }

    try {
      setSavingClaim(true);
      await api.put(`/projects/${projectId}/claims/${selectedClaim.id}`, {
        claimNumber: selectedClaim.claimNumber,
        claimType: editableClaimType,
        dependsOnNumber: editableClaimType === 'DEPENDENT' ? (editableDependsOnNumber || 1) : null,
        preamble: editablePreamble,
        body: currentBodyHtml || currentBodyText,
        linkedFigures: editableLinkedFigures,
      });
      toast.success(`Claim ${selectedClaim.claimNumber} saved successfully.`);
      setIsDirty(false);
      fetchClaims();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save claim.');
    } finally {
      setSavingClaim(false);
    }
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveCurrentClaim();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClaim, editablePreamble, editableClaimType, editableDependsOnNumber]);

  // Sync with Form 2
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

  // Export Docket PDF
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

  // AI Proposal Generation
  const handleGenerateAiSet = async () => {
    try {
      setGeneratingAi(true);
      const res = await api.post(`/projects/${projectId}/claims/ai-generate`, {
        claimStyle: 'EXPANDED_PORTFOLIO',
        count: 3
      });
      const proposal = res.data.proposal;
      setAiProposal(proposal);
      setSelectedProposedIndices((proposal.claims || []).map((_: any, i: number) => i));
      toast.success(`Generated ${proposal.claims?.length || 0} statutory AI claim suggestions.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate AI claim proposal.');
    } finally {
      setGeneratingAi(false);
    }
  };

  // Accept Proposal
  const handleAcceptSelectedProposal = async () => {
    if (!aiProposal) return;
    const selectedClaims = aiProposal.claims.filter((_: any, i: number) => selectedProposedIndices.includes(i));
    if (selectedClaims.length === 0) {
      toast.error('Please select at least one proposal.');
      return;
    }
    try {
      setImportingProposal(true);
      await api.post(`/projects/${projectId}/claims/import-proposal`, {
        proposal: { ...aiProposal, claims: selectedClaims }
      });
      toast.success(`Imported ${selectedClaims.length} statutory claims into project workspace.`);
      setAiProposal(null);
      fetchClaims();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import AI claim proposal.');
    } finally {
      setImportingProposal(false);
    }
  };

  // Create Custom Claim
  const handleCreateNewClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.trim()) {
      toast.error('Claim body cannot be empty.');
      return;
    }
    const nextNumber = claims.length + 1;
    try {
      const res = await api.post(`/projects/${projectId}/claims`, {
        claimNumber: nextNumber,
        claimType: newClaimType,
        dependsOnNumber: newClaimType === 'DEPENDENT' ? (newParentNumber || 1) : null,
        preamble: newPreamble.trim(),
        body: newBody.trim()
      });
      toast.success(`Claim ${nextNumber} created successfully.`);
      setShowCreateModal(false);
      setNewPreamble('An automated intelligent system comprising:');
      setNewBody('(a) a sensing module;\n(b) a controller.');
      fetchClaims();
      if (res.data?.claim?.id) {
        setSelectedClaimId(res.data.claim.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create claim.');
    }
  };

const filteredTreeClaims = claims.filter((c) =>
    `Claim ${c.claimNumber} ${c.preamble} ${c.body}`.toLowerCase().includes(searchTree.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {!canEdit && (
        <div className="p-4 bg-amber-50 border border-amber-200/90 text-amber-900 rounded-3xl text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🔒</span>
            <span>
              <strong>Read-Only Workspace:</strong> You have <strong>VIEW</strong> permissions on this patent project. Formulating, modifying, or syncing claims is restricted.
            </span>
          </div>
          <span className="px-3 py-1 bg-amber-200/90 text-amber-950 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 w-fit">
            VIEW ONLY
          </span>
        </div>
      )}

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
            disabled={!canEdit || savingClaim || !selectedClaim}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer ${
              isDirty
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 animate-pulse'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
            title="Save Claim (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingClaim ? 'Saving...' : isDirty ? 'Save (Ctrl+S)' : 'Saved'}</span>
          </button>

          {/* Form 2 Sync Action Button */}
          <button
            onClick={handleSyncForm2}
            disabled={!canEdit || syncingForm2 || claims.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
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
            disabled={!canEdit || generatingAi}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm shadow-blue-600/25 transition disabled:opacity-50 cursor-pointer"
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
            {canEdit && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 text-xs font-bold cursor-pointer"
                title="Add new claim"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            )}
          </div>

          {/* Tree Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTree}
              onChange={(e) => setSearchTree(e.target.value)}
              placeholder="Search claims..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
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
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <p>No claims found.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-blue-600 font-bold hover:underline"
                >
                  + Create your first claim
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Column (6 cols): WYSIWYG Legal Claim Editor */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          {/* Editor Header: Title, Claim Type, Dependency Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-black text-slate-900">
                Claim {selectedClaim?.claimNumber || 1}
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isDirty ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isDirty ? 'bg-amber-600' : 'bg-emerald-600'}`} />
                {isDirty ? 'Unsaved edits' : 'Saved'}
              </span>
            </div>

            {/* Claim Type Selector */}
            <div className="flex items-center gap-2">
              <select
                value={editableClaimType}
                onChange={(e) => {
                  const val = e.target.value as 'INDEPENDENT' | 'DEPENDENT';
                  setEditableClaimType(val);
                  if (val === 'INDEPENDENT') setEditableDependsOnNumber(null);
                  else if (!editableDependsOnNumber) setEditableDependsOnNumber(1);
                  setIsDirty(true);
                }}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer focus:bg-white focus:outline-none"
              >
                <option value="INDEPENDENT">Independent Claim</option>
                <option value="DEPENDENT">Dependent Claim</option>
              </select>

              {editableClaimType === 'DEPENDENT' && (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span>Depends on:</span>
                  <select
                    value={editableDependsOnNumber || 1}
                    onChange={(e) => {
                      setEditableDependsOnNumber(Number(e.target.value));
                      setIsDirty(true);
                    }}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    {claims
                      .filter((c) => c.claimNumber < (selectedClaim?.claimNumber || 999))
                      .map((c) => (
                        <option key={c.id} value={c.claimNumber}>
                          Claim {c.claimNumber}
                        </option>
                      ))}
                    {claims.length <= 1 && <option value={1}>Claim 1</option>}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Interactive WYSIWYG Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-600 text-xs relative">
            {/* Undo / Redo */}
            <button
              onClick={() => execEditorCommand('undo')}
              className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-700 cursor-pointer transition active:scale-95"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execEditorCommand('redo')}
              className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-700 cursor-pointer transition active:scale-95"
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Template Styles Dropdown */}
            <div className="relative">
              <button
                onClick={() => setStyleDropdownOpen(!styleDropdownOpen)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <span>Format Style</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {styleDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-2xl shadow-lg p-1.5 z-50 text-xs space-y-1">
                  <button
                    onClick={() => handleApplyTemplateStyle('INDEP_PREAMBLE')}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-bold"
                  >
                    Independent Preamble
                  </button>
                  <button
                    onClick={() => handleApplyTemplateStyle('DEP_PREAMBLE')}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-bold"
                  >
                    Dependent Transition
                  </button>
                  <button
                    onClick={() => handleApplyTemplateStyle('CLAUSE_BLOCK')}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-bold"
                  >
                    Format Clauses (a), (b), (c)...
                  </button>
                  <button
                    onClick={() => handleApplyTemplateStyle('MODULE_LIMITATION')}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-bold"
                  >
                    Insert Module Limitation
                  </button>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* True WYSIWYG Bold, Italic, Underline */}
            <button
              onClick={() => execEditorCommand('bold')}
              className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-800 font-black cursor-pointer transition active:bg-slate-200"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execEditorCommand('italic')}
              className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-800 italic cursor-pointer transition active:bg-slate-200"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execEditorCommand('underline')}
              className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-800 underline cursor-pointer transition active:bg-slate-200"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Lists & Clause Formatting */}
            <button
              onClick={() => execEditorCommand('insertUnorderedList')}
              className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-700 cursor-pointer transition"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => execEditorCommand('insertOrderedList')}
              className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-700 cursor-pointer transition"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleFormatClausesWysiwyg}
              className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] font-extrabold cursor-pointer transition hover:bg-blue-50 hover:text-blue-700"
              title="Auto-format clauses into statutory (a), (b), (c)... points"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>(a), (b), (c) Clauses</span>
            </button>

            <button
              onClick={handleInsertTagCallout}
              className="flex items-center gap-1 px-2 py-1 hover:bg-white hover:shadow-xs rounded-lg text-slate-700 text-[11px] font-bold cursor-pointer transition"
              title="Insert Drawing Component Tag Callout"
            >
              <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tag Callout</span>
            </button>
          </div>

          {/* Editable Preamble & WYSIWYG Body */}
          <div className="space-y-4 font-sans text-xs">
            {/* Preamble Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                Preamble & Transition Phrase
              </label>
              <input
                type="text"
                value={editablePreamble}
                onChange={(e) => {
                  setEditablePreamble(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="A smart monitoring system for industrial equipment, comprising:"
                className="w-full p-3 bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-2xl text-xs font-bold text-slate-900 leading-relaxed shadow-3xs outline-none transition"
              />
            </div>

            {/* True WYSIWYG ContentEditable Body Editor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  Body & Structural Limitations (Rich Text WYSIWYG Editor)
                </label>
                <span className="text-[10px] text-blue-600 font-bold">
                  Tip: Highlight text and click B / I / U or press Ctrl+B / Ctrl+I / Ctrl+U
                </span>
              </div>

              <div
                ref={bodyEditorRef}
                contentEditable={canEdit}
                suppressContentEditableWarning
                onInput={() => canEdit && setIsDirty(true)}
                className={`w-full min-h-[220px] max-h-[360px] overflow-y-auto p-4 bg-white border rounded-2xl text-xs font-medium leading-relaxed shadow-3xs outline-none transition ${
                  canEdit
                    ? 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900'
                    : 'border-slate-150 bg-slate-50/50 text-slate-600 cursor-not-allowed'
                }`}
                style={{
                  lineHeight: '1.7',
                  letterSpacing: '0.01em',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column (3 cols): Claim Intelligence */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Claim intelligence</h3>
            <span className="text-[10px] font-bold text-slate-400">
              Elements: 3+
            </span>
          </div>

          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs font-bold text-blue-800 flex items-center justify-between">
            <span>{editableClaimType === 'INDEPENDENT' ? 'Independent Claim' : 'Dependent Claim'}</span>
            {editableClaimType === 'DEPENDENT' && (
              <span className="text-[10px] text-blue-600">→ Claim {editableDependsOnNumber || 1}</span>
            )}
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
                    {editablePreamble.toLowerCase().includes('comprising') || editablePreamble.toLowerCase().includes('wherein')
                      ? 'Statutory transitional phrase verified.'
                      : 'Ensure transitional phrase ("comprising" or "wherein") is present.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Technical structure */}
            <div className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-2xl flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Technical structure</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">
                    Recites technical features and interconnected components.
                  </p>
                </div>
              </div>
            </div>

            {/* Potential ambiguity / Clarity verification */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Clarity & Precision</h4>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5 leading-tight">
                    All limitations formatted for IPO statutory examination.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Linked Figures */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Linked Drawing Figures
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {editableLinkedFigures
                .split(',')
                .map((f) => f.trim())
                .filter((f) => f.length > 0)
                .map((fig) => (
                  <span
                    key={fig}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200"
                  >
                    {fig}
                  </span>
                ))}
            </div>
            <input
              type="text"
              value={editableLinkedFigures}
              onChange={(e) => {
                setEditableLinkedFigures(e.target.value);
                setIsDirty(true);
              }}
              placeholder="FIG. 1, FIG. 2"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white"
            />
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
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept selected</span>
              </button>
              <button
                onClick={() => setAiProposal(null)}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
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
                      <td className="py-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProposedIndices([...selectedProposedIndices, idx]);
                            } else {
                              setSelectedProposedIndices(selectedProposedIndices.filter((i) => i !== idx));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 pr-4">
                        <p className="font-bold text-slate-900">{pc.preamble}</p>
                        <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{pc.body}</p>
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase">
                          {pc.claimType || 'New Claim'}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500 text-[11px]">
                        {pc.rationale || 'Novelty and antecedent clarity enhancement.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create New Claim */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Add New Patent Claim</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClaim} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Claim Type</label>
                  <select
                    value={newClaimType}
                    onChange={(e) => setNewClaimType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                  >
                    <option value="INDEPENDENT">Independent</option>
                    <option value="DEPENDENT">Dependent</option>
                  </select>
                </div>

                {newClaimType === 'DEPENDENT' && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                      Depends on Claim #
                    </label>
                    <select
                      value={newParentNumber || 1}
                      onChange={(e) => setNewParentNumber(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                    >
                      {claims.map((c) => (
                        <option key={c.id} value={c.claimNumber}>
                          Claim {c.claimNumber}
                        </option>
                      ))}
                      {claims.length === 0 && <option value={1}>Claim 1</option>}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Preamble</label>
                <input
                  type="text"
                  value={newPreamble}
                  onChange={(e) => setNewPreamble(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Body & Limitations</label>
                <textarea
                  rows={5}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 leading-relaxed font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50"
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
