import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Plus,
  ExternalLink,
  Shield,
  Trash2,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface PriorArtEvidenceViewProps {
  projectId: string;
  project?: any;
  onRefreshReferences?: () => void;
}

export const PriorArtEvidenceView: React.FC<PriorArtEvidenceViewProps> = (props: any) => {
  const { projectId, project, onRefreshReferences } = props;
  const [searchQuery, setSearchQuery] = useState(
    project?.title || 'Adaptive traffic signal control optimization'
  );
  const [activeTab, setActiveTab] = useState<'semantic' | 'keyword' | 'classification'>('semantic');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [savedReferences, setSavedReferences] = useState<any[]>([]);
  const [selectedPatent, setSelectedPatent] = useState<any | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(true);

  useEffect(() => {
    fetchSavedReferences();
    handleSearch(searchQuery);
  }, [projectId]);

  const fetchSavedReferences = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/patents/references`);
      const list = res.data.references || [];
      setSavedReferences(list);
      if (list.length > 0 && !selectedPatent) {
        setSelectedPatent(list[0]);
      }
    } catch (e) {
      console.error('Failed to load saved references', e);
    }
  };

  const handleSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    try {
      setIsSearching(true);
      const res = await api.get(`/projects/${projectId}/patents/search?q=${encodeURIComponent(queryToSearch.trim())}`);
      const results = res.data.results || [];
      setSearchResults(results);
      if (results.length > 0) {
        setSelectedPatent(results[0]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to search patents.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddReference = async (pat: any) => {
    const isAlreadySaved = savedReferences.some((r) => r.patentNumber === pat.patentNumber);
    if (isAlreadySaved) {
      toast.error('This patent is already saved as a reference for this project.');
      return;
    }

    try {
      await api.post(`/projects/${projectId}/patents/references`, {
        patentNumber: pat.patentNumber,
        title: pat.title,
        abstract: pat.abstract || pat.finding || 'Patent reference abstract.',
        url: pat.url || `https://patents.google.com/patent/${pat.patentNumber}/en`,
        inventors: pat.inventors || 'Primary Inventor',
        assignee: pat.assignee || 'Assigned Assignee',
        publishDate: pat.publishDate ? new Date(pat.publishDate).toISOString() : new Date().toISOString(),
        source: pat.source || 'USPTO'
      });
      toast.success(`Added ${pat.patentNumber} to project prior-art references.`);
      fetchSavedReferences();
      if (onRefreshReferences) onRefreshReferences();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save reference.');
    }
  };

  const handleDeleteReference = async (refId: string, patentNum: string) => {
    if (!window.confirm(`Are you sure you want to remove ${patentNum} from project prior-art references?`)) return;
    try {
      await api.delete(`/projects/${projectId}/patents/references/${refId}`);
      toast.success(`Removed ${patentNum} from references.`);
      fetchSavedReferences();
      if (onRefreshReferences) onRefreshReferences();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete reference.');
    }
  };

  // Compute Prior Art Risk
  const computePriorArtRisk = () => {
    if (savedReferences.length === 0) return { level: 'LOW', label: 'Low Risk', desc: 'No unmitigated patent citations' };
    if (savedReferences.length >= 3) return { level: 'HIGH', label: 'High Risk (Audit Required)', desc: `${savedReferences.length} prior-art citations requiring claim differentiation` };
    return { level: 'MEDIUM', label: 'Medium Risk', desc: `${savedReferences.length} references saved for examination` };
  };

  const risk = computePriorArtRisk();

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(searchQuery);
        }}
        className="relative flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-2xl text-xs font-semibold text-slate-900 shadow-xs"
            placeholder="Search patents by keywords, semantic concept, or patent number..."
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Tabs Row */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-0">
        <div className="flex items-center gap-8 text-xs font-bold">
          <button
            onClick={() => setActiveTab('semantic')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'semantic'
                ? 'text-blue-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Semantic Search</span>
            {activeTab === 'semantic' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('keyword')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'keyword'
                ? 'text-blue-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Keyword Query</span>
            {activeTab === 'keyword' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('classification')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'classification'
                ? 'text-blue-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>IPC / CPC Classification</span>
            {activeTab === 'classification' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          {searchResults.length} patents retrieved
        </span>
      </div>

      {/* Main Results vs Evidence Chain Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Results Column (7 cols or 12 cols if panel closed) */}
        <div className={showRightPanel ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {/* Result Cards List */}
          <div className="space-y-4">
            {searchResults.map((result, idx) => {
              const isSelected = selectedPatent?.patentNumber === result.patentNumber;
              const isSaved = savedReferences.some((r) => r.patentNumber === result.patentNumber);
              return (
                <div
                  key={result.patentNumber || idx}
                  onClick={() => {
                    setSelectedPatent(result);
                    setShowRightPanel(true);
                  }}
                  className={`bg-white border rounded-3xl p-5 shadow-xs transition cursor-pointer ${
                    isSelected ? 'ring-2 ring-blue-600/30 border-blue-600/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Number Badge */}
                    <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Patent No & Publish Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-blue-700 font-mono">
                            {result.patentNumber}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            • {result.publishDate ? new Date(result.publishDate).toLocaleDateString() : '2023'}
                          </span>
                          {result.classification && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600">
                              {result.classification}
                            </span>
                          )}
                        </div>

                        {/* Similarity Score Pill */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black shrink-0">
                          <span>{result.similarityScore || 85}% Similar</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-black text-slate-900 leading-snug">
                        {result.title}
                      </h4>

                      {/* Abstract / Snippet */}
                      <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-relaxed">
                        {result.abstract || 'No abstract text available for this patent index.'}
                      </p>

                      {/* Assignee & Inventors */}
                      <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-slate-400">
                        <span>Assignee: <strong className="text-slate-600">{result.assignee || 'Assigned Assignee'}</strong></span>
                        <div className="flex items-center gap-2">
                          {isSaved ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Saved
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddReference(result);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Add to Prior-Art
                            </button>
                          )}

                          <a
                            href={result.url || `https://patents.google.com/patent/${result.patentNumber}/en`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-slate-400 hover:text-slate-700"
                            title="Open in Google Patents"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {searchResults.length === 0 && !isSearching && (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">No patent records matched your search query.</p>
                <p>Try searching for broader keywords like "traffic optimization", "sensor module", or "adaptive network".</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Saved Prior-Art References Column (5 cols) */}
        {showRightPanel && (
          <div className="lg:col-span-5 space-y-5">
            {/* Prior-Art Risk Card */}
            <div className={`border rounded-3xl p-5 space-y-2 shadow-xs ${
              risk.level === 'HIGH'
                ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                : risk.level === 'MEDIUM'
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider">Prior-Art Risk Index</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  risk.level === 'HIGH' ? 'bg-rose-200 text-rose-800' : risk.level === 'MEDIUM' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'
                }`}>
                  {risk.level}
                </span>
              </div>
              <p className="text-xs font-bold leading-tight">{risk.desc}</p>
              <p className="text-[10px] text-slate-500 font-medium">
                Note: HIGH risk indicates unmitigated prior-art overlap requiring claim differentiation.
              </p>
            </div>

            {/* Saved Prior-Art References List */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Saved Project References
                  </h3>
                  <p className="text-[10px] text-slate-400">Linked to this patent project</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-mono font-bold">
                  {savedReferences.length}
                </span>
              </div>

              {savedReferences.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                  <Shield className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-600">No prior-art references added yet.</p>
                  <p className="text-[11px]">Click "+ Add to Prior-Art" on any search result to link it.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {savedReferences.map((ref) => (
                    <div
                      key={ref.id}
                      className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 hover:bg-slate-100/70 transition"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-black text-blue-700 font-mono">
                          {ref.patentNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={ref.url || `https://patents.google.com/patent/${ref.patentNumber}/en`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800"
                            title="Open in Google Patents"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteReference(ref.id, ref.patentNumber)}
                            className="p-1 hover:bg-rose-100 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                            title="Remove reference"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {ref.title}
                      </h5>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {ref.abstract || 'No abstract recorded.'}
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/50">
                        <span>Source: {ref.source || 'USPTO'}</span>
                        <span>{new Date(ref.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
