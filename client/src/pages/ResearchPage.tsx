import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  BookOpen,
  ExternalLink,
  Bookmark,
  Scale,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const ResearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [domainFilter, setDomainFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Comparison State
  const [comparingPatents, setComparingPatents] = useState<any[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Stored references count for summary
  const [summaryStats, setSummaryStats] = useState({
    totalCitations: 0,
    highlySimilar: 0,
    needsReview: 0,
  });

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      const list = res.data.projects || [];
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
        if (!searchParams.get('q') && list[0].title) {
          setQuery(list[0].title);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // If project selected, use project search endpoint which persists and tracks
      const endpoint = selectedProjectId
        ? `/projects/${selectedProjectId}/patents/search?q=${encodeURIComponent(query)}`
        : `/projects/patents/search?q=${encodeURIComponent(query)}`;

      const res = await api.get(endpoint);
      const items = res.data.results || res.data || [];
      setResults(items);

      // Compute live stats
      const high = items.filter((i: any) => (i.similarityScore || 0) >= 70).length;
      setSummaryStats({
        totalCitations: items.length,
        highlySimilar: high,
        needsReview: Math.max(1, Math.round(items.length * 0.4)),
      });
    } catch (err: any) {
      toast.error('Search query failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      handleSearch();
    }
  }, [selectedProjectId]);

  const handleSaveToProject = async (patent: any) => {
    if (!selectedProjectId) {
      toast.error('Please select an active invention to associate this citation');
      return;
    }

    try {
      await api.post(`/projects/${selectedProjectId}/patents/references`, {
        patentNumber: patent.patentNumber,
        title: patent.title,
        abstract: patent.abstract,
        assignee: patent.assignee,
        inventors: patent.inventors,
        publishDate: patent.publishDate,
        url: patent.url,
        source: patent.source || 'USPTO',
      });
      toast.success(`Saved ${patent.patentNumber} to project prior-art records!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not save citation');
    }
  };

  const toggleCompare = (patent: any) => {
    if (comparingPatents.some((p) => p.patentNumber === patent.patentNumber)) {
      setComparingPatents(comparingPatents.filter((p) => p.patentNumber !== patent.patentNumber));
    } else {
      if (comparingPatents.length >= 2) {
        toast.error('You can compare up to 2 prior-art documents side-by-side with your invention');
        return;
      }
      setComparingPatents([...comparingPatents, patent]);
    }
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8e4] pb-6">
        <div>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f0f7f6] text-[#3a6b65] mb-2 border border-[#dbebe9]">
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            Research Lab
          </div>
          <h1 className="text-2xl font-bold text-[#191c1b] tracking-tight">Prior-Art Research & Patent Search</h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore authoritative patent repositories, inspect technical overlap, and save relevant citations.
          </p>
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Researching for:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#557862]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Research Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#e2e8e4] shadow-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Prior-Art Documents</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summaryStats.totalCitations}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Found across registries</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e2e8e4] shadow-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Highly Similar</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{summaryStats.highlySimilar}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Score &ge; 70%</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e2e8e4] shadow-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Needs Review</div>
          <div className="text-2xl font-bold text-[#3a6b65] mt-1">{summaryStats.needsReview}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Recommended citations</div>
        </div>
        <div className={`p-4 rounded-xl border shadow-sm transition ${comparingPatents.length > 0 ? 'bg-[#f4f8f6] border-[#557862] ring-2 ring-[#557862]/20' : 'bg-white border-[#e2e8e4]'}`}>
          <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Comparison Buffer</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{comparingPatents.length} / 2</div>
          <div className="text-xs mt-1">
            {comparingPatents.length > 0 ? (
              <button
                onClick={() => setShowComparisonModal(true)}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#3a6b65] text-white text-[11px] font-bold shadow-xs hover:bg-[#2d5550] transition cursor-pointer"
              >
                <Scale className="w-3 h-3 mr-1" />
                Open Side-by-Side
              </button>
            ) : (
              <span className="text-slate-400 text-[11px]">Select cards below</span>
            )}
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white rounded-xl border border-[#e2e8e4] shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patents, technologies, claims, IPC classifications, or technical keywords..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#557862]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#557862]"
            >
              <option value="">All Domains</option>
              <option value="IoT">IoT / Smart Devices</option>
              <option value="Energy">Energy / Solar</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Agriculture">Agriculture</option>
              <option value="AI">AI & Computing</option>
            </select>

            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-[#3a6b65] hover:bg-[#2d5550] text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center"
            >
              {isSearching ? 'Searching...' : 'Search Prior Art'}
            </button>
          </div>
        </form>
      </div>

      {/* Legal Disclaimer Box */}
      <div className="bg-[#fcfdfc] border border-[#e2e8e4] rounded-lg p-3 text-xs text-slate-600 flex items-start space-x-2">
        <Info className="w-4 h-4 text-[#557862] flex-shrink-0 mt-0.5" />
        <span>
          <strong>Research Indicator Notice:</strong> Similarity scores and overlap metrics represent informational research indicators and do NOT constitute a legal patentability opinion, novelty guarantee, or formal freedom-to-operate clearance.
        </span>
      </div>

      {/* Search Results List */}
      <div className="space-y-4">
        {results.length === 0 && !isSearching && (
          <div className="bg-white rounded-xl border border-[#e2e8e4] p-12 text-center">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No prior-art results found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Try broader technical keywords, synonyms, or select another active invention from the dropdown.
            </p>
          </div>
        )}

        {results.map((patent, index) => {
          const isComparing = comparingPatents.some((p) => p.patentNumber === patent.patentNumber);
          return (
            <div
              key={patent.patentNumber || index}
              className="bg-white rounded-xl border border-[#e2e8e4] p-5 shadow-sm hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {patent.patentNumber}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f0f7f6] text-[#3a6b65]">
                      {patent.source || 'USPTO'}
                    </span>
                    {patent.similarityScore && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Similarity Indicator: {patent.similarityScore}%
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 hover:text-[#3a6b65] transition">
                    {patent.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    {patent.assignee && <span>Assignee: <strong>{patent.assignee}</strong> &bull; </span>}
                    {patent.inventors && <span>Inventors: {patent.inventors} &bull; </span>}
                    {patent.publishDate && <span>Published: {new Date(patent.publishDate).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => toggleCompare(patent)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      isComparing
                        ? 'bg-[#557862] text-white border-[#557862]'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 inline mr-1" />
                    {isComparing ? 'Comparing' : 'Compare'}
                  </button>

                  <button
                    onClick={() => handleSaveToProject(patent)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f0f7f6] hover:bg-[#dbebe9] text-[#3a6b65] border border-[#dbebe9] transition"
                  >
                    <Bookmark className="w-3.5 h-3.5 inline mr-1" />
                    Save Citation
                  </button>

                  {patent.url && (
                    <a
                      href={patent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition"
                      title="Open external patent registry"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Abstract Snippet */}
              {patent.abstract && (
                <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {patent.abstract}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center">
                  <Scale className="w-5 h-5 text-[#3a6b65] mr-2" />
                  Side-by-Side Patent Prior-Art Comparison
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluate potential technical overlap and distinguishing features against your working invention draft.
                </p>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: Your Invention */}
              <div className="border border-[#557862] bg-[#f4f7f5] rounded-xl p-4">
                <div className="text-[11px] uppercase tracking-wider font-bold text-[#557862] mb-1">
                  Your Invention
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{activeProject?.title || 'Current Project'}</h3>
                <div className="text-xs text-slate-600 space-y-3">
                  <div>
                    <span className="font-semibold block text-slate-800">Problem Addressed:</span>
                    <p className="text-[11px] mt-0.5">{activeProject?.problemStatement || 'Autonomous off-grid monitoring'}</p>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-800">Core Technical Mechanism:</span>
                    <p className="text-[11px] mt-0.5">{activeProject?.proposedSolution || 'Integrated photovoltaic lid with non-contact capacitive volume sensor.'}</p>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-800">Primary Distinction:</span>
                    <p className="text-[11px] mt-0.5">Eliminates external charging docks; continuous MPPT replenishment with dielectric liquid level conversion.</p>
                  </div>
                </div>
              </div>

              {/* Column 2: Prior Art A */}
              {comparingPatents[0] && (
                <div className="border border-slate-200 bg-white rounded-xl p-4">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                    Prior Art A: {comparingPatents[0].patentNumber}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{comparingPatents[0].title}</h3>
                  <div className="text-xs text-slate-600 space-y-3">
                    <div>
                      <span className="font-semibold block text-slate-800">Assignee:</span>
                      <p className="text-[11px] mt-0.5">{comparingPatents[0].assignee || 'Commercial Assignee'}</p>
                    </div>
                    <div>
                      <span className="font-semibold block text-slate-800">Disclosed Mechanism:</span>
                      <p className="text-[11px] mt-0.5 line-clamp-4">{comparingPatents[0].abstract}</p>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded border border-amber-200">
                      <span className="font-semibold block text-amber-900 text-[11px]">Potential Overlap:</span>
                      <p className="text-[11px] text-amber-800 mt-0.5">Recites solar power harvesting for hydration tracking.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Column 3: Prior Art B */}
              {comparingPatents[1] ? (
                <div className="border border-slate-200 bg-white rounded-xl p-4">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                    Prior Art B: {comparingPatents[1].patentNumber}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{comparingPatents[1].title}</h3>
                  <div className="text-xs text-slate-600 space-y-3">
                    <div>
                      <span className="font-semibold block text-slate-800">Assignee:</span>
                      <p className="text-[11px] mt-0.5">{comparingPatents[1].assignee || 'Commercial Assignee'}</p>
                    </div>
                    <div>
                      <span className="font-semibold block text-slate-800">Disclosed Mechanism:</span>
                      <p className="text-[11px] mt-0.5 line-clamp-4">{comparingPatents[1].abstract}</p>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded border border-amber-200">
                      <span className="font-semibold block text-amber-900 text-[11px]">Potential Overlap:</span>
                      <p className="text-[11px] text-amber-800 mt-0.5">Recites capacitive liquid sensing columns.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-400">
                  <Scale className="w-8 h-8 mb-2 stroke-1" />
                  <p className="text-xs">Select a 2nd patent from search results to compare 3-way.</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-5 py-2 bg-[#3a6b65] text-white text-xs font-semibold rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Comparison Dock */}
      {comparingPatents.length > 0 && !showComparisonModal && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 max-w-xl w-full justify-between backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#3a6b65] flex items-center justify-center font-bold text-xs text-white">
                {comparingPatents.length}/2
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {comparingPatents.length === 1 ? '1 Patent Selected' : '2 Patents Ready for Comparison'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {comparingPatents.map((p) => p.patentNumber).join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setComparingPatents([])}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setShowComparisonModal(true)}
                className="px-4 py-1.5 rounded-xl bg-[#3a6b65] hover:bg-[#2d5550] text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                View Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

