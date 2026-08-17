import React, { useState } from 'react';
import {
  Search,
  X,
  Plus,
  Zap,
  ExternalLink,
  Quote,
  Lightbulb,
  Shield,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface PriorArtEvidenceViewProps {
  projectId: string;
  project?: any;
  onRefreshReferences?: () => void;
}

export const PriorArtEvidenceView: React.FC<PriorArtEvidenceViewProps> = (props: any) => {
  const { projectId, onRefreshReferences } = props;
  const [searchQuery, setSearchQuery] = useState('adaptive monitoring sensor system');
  const [activeTab, setActiveTab] = useState<'semantic' | 'keyword' | 'classification' | 'claims'>('semantic');
  const [showFilters, setShowFilters] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const [selectedPatent, setSelectedPatent] = useState<any>({
    id: '1',
    patentNumber: 'US20230123456A1',
    publishDate: '2023-04-20',
    title: 'Adaptive sensor monitoring system with context-aware threshold adjustment',
    assignee: 'SenseTech Inc.',
    relevanceScore: 92,
    matchedConcepts: ['Adaptive monitoring', 'Threshold adjustment', 'Sensor fusion'],
    finding: 'This document discloses an adaptive monitoring system that dynamically adjusts sensing parameters based on contextual conditions and historical data.',
    sourceQuery: 'adaptive monitoring sensor system',
    searchDate: 'May 09, 2025 • 10:24 AM',
    queryType: 'Semantic search',
    passage: '...the system adaptively adjusts one or more monitoring parameters, including sampling rate and threshold values, based on real-time sensor inputs and contextual conditions derived from historical data...',
    passageRef: 'Paragraph [0042] – [0045]',
    explanation: 'The passage describes a system that adapts monitoring parameters (e.g., sampling rate, thresholds) based on real-time inputs and historical data, which is highly relevant to the claimed adaptive monitoring in Smart Monitoring System.'
  });

  const searchResults = [
    {
      id: '1',
      patentNumber: 'US20230123456A1',
      publishDate: '2023-04-20',
      title: 'Adaptive sensor monitoring system with context-aware threshold adjustment',
      assignee: 'SenseTech Inc.',
      relevanceScore: 92,
      matchedConcepts: ['Adaptive monitoring', 'Threshold adjustment', 'Sensor fusion'],
      extraCount: 2,
      finding: 'This document discloses an adaptive monitoring system that dynamically adjusts sensing parameters based on contextual conditions and historical data.',
      sourceQuery: 'adaptive monitoring sensor system',
      searchDate: 'May 09, 2025 • 10:24 AM',
      queryType: 'Semantic search',
      passage: '...the system adaptively adjusts one or more monitoring parameters, including sampling rate and threshold values, based on real-time sensor inputs and contextual conditions derived from historical data...',
      passageRef: 'Paragraph [0042] – [0045]',
      explanation: 'The passage describes a system that adapts monitoring parameters (e.g., sampling rate, thresholds) based on real-time inputs and historical data, which is highly relevant to the claimed adaptive monitoring in Smart Monitoring System.'
    },
    {
      id: '2',
      patentNumber: 'US20200234567A1',
      publishDate: '2020-01-23',
      title: 'Dynamic environmental monitoring system using adaptive sampling and feedback control',
      assignee: 'EcoSense Systems',
      relevanceScore: 86,
      matchedConcepts: ['Adaptive sampling', 'Feedback control', 'Environmental monitoring'],
      extraCount: 1,
      finding: 'Discloses dynamic sleep cycles and adaptive transmission rates in low power monitoring networks.',
      sourceQuery: 'adaptive monitoring sensor system',
      searchDate: 'May 09, 2025 • 10:24 AM',
      queryType: 'Semantic search',
      passage: 'Energy conservation is achieved by dynamically throttling sampling rates when environmental variables remain below predetermined thresholds.',
      passageRef: 'Paragraph [0018] – [0022]',
      explanation: 'Relevant to Claim 3 dependent power conservation limitations and sampling rate control.',
    },
    {
      id: '3',
      patentNumber: 'US20190345678A1',
      publishDate: '2019-11-14',
      title: 'Sensor network with machine learning for real-time anomaly detection',
      assignee: 'NeuralData Corp.',
      relevanceScore: 78,
      matchedConcepts: ['Sensor network', 'Anomaly detection', 'Machine learning'],
      extraCount: 1,
      finding: 'Describes neural networks applied to multi-sensor telemetry for anomaly alerting.',
      sourceQuery: 'adaptive monitoring sensor system',
      searchDate: 'May 09, 2025 • 10:24 AM',
      queryType: 'Semantic search',
      passage: 'The neural network model continuously ingests raw sensor streams to evaluate deviation from standard behavior envelopes.',
      passageRef: 'Paragraph [0067] – [0070]',
      explanation: 'Provides basis for machine learning comparison limitations in the claims module.',
    }
  ];

  const handleAddReference = async (pat: any) => {
    try {
      await api.post(`/projects/${projectId}/references`, {
        patentNumber: pat.patentNumber,
        title: pat.title,
        abstract: pat.passage,
        relevanceScore: pat.relevanceScore,
        publishDate: pat.publishDate
      });
      toast.success(`Added ${pat.patentNumber} to project references.`);
      if (onRefreshReferences) onRefreshReferences();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save reference');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-2xl text-xs font-semibold text-slate-900 shadow-xs"
          placeholder="adaptive monitoring sensor system"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

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
            <span>Semantic search</span>
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
            <span>Keyword</span>
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
            <span>Classification</span>
            {activeTab === 'classification' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'claims'
                ? 'text-blue-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Claims</span>
            {activeTab === 'claims' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <span>Sort by:</span>
            <button className="flex items-center gap-1 font-bold text-slate-800 hover:text-slate-950 cursor-pointer">
              <span>Relevance</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Main Results vs Evidence Chain Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Results Column (7 cols or 12 cols if panel closed) */}
        <div className={showRightPanel ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
          <div className="text-xs font-semibold text-slate-500">
            Found 128 results
          </div>

          {/* Result Cards List */}
          <div className="space-y-4">
            {searchResults.map((result) => {
              const isSelected = selectedPatent?.id === result.id;
              return (
                <div
                  key={result.id}
                  onClick={() => {
                    setSelectedPatent(result);
                    setShowRightPanel(true);
                  }}
                  className={`app-card p-5 transition cursor-pointer ${
                    isSelected ? 'ring-2 ring-blue-600/30 border-blue-600/50' : 'hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Number Badge */}
                    <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {result.id}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Patent No & Publish Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-bold text-blue-600 hover:underline">
                            {result.patentNumber}
                          </span>
                          <span className="text-slate-400 font-medium">{result.publishDate}</span>
                        </div>

                        {/* Relevance Indicator */}
                        <div className="text-right shrink-0">
                          <div className="text-sm font-extrabold text-emerald-600">
                            {result.relevanceScore}%
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium leading-none">
                            Relevance
                          </div>
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${result.relevanceScore}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                        {result.title}
                      </h4>

                      {/* Matched Concepts */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Matched concepts
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {result.matchedConcepts.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold"
                            >
                              {c}
                            </span>
                          ))}
                          {result.extraCount && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                              +{result.extraCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-3">
                        <a
                          href={`https://patents.google.com/patent/${result.patentNumber}/en`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition shadow-3xs"
                        >
                          <span>View patent</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddReference(result);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition shadow-3xs cursor-pointer"
                        >
                          <span>Add reference</span>
                          <Plus className="w-3 h-3 text-slate-400" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatent(result);
                            setShowRightPanel(true);
                            toast.success(`Analyzing ${result.patentNumber}`);
                          }}
                          className="flex items-center gap-1 px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-[11px] font-bold rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <Zap className="w-3 h-3 fill-white" />
                          <span>Analyze</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-40">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 rounded-lg bg-blue-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                1
              </button>
              <button className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                2
              </button>
              <button className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                3
              </button>
              <button className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                4
              </button>
              <button className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                5
              </button>
              <span className="text-slate-400 px-1">...</span>
              <button className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                13
              </button>
              <button className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <span>Show</span>
              <button className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800">
                <span>10</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <span>per page</span>
            </div>
          </div>
        </div>

        {/* Right Evidence Chain Panel (5 cols) */}
        {showRightPanel && selectedPatent && (
          <div className="lg:col-span-5 app-card p-6 space-y-6 shadow-sm sticky top-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-extrabold text-slate-900">Evidence chain</h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  High relevance
                </span>
              </div>

              <button
                onClick={() => setShowRightPanel(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Timeline Steps */}
            <div className="space-y-5 text-xs">
              {/* Step 1: Finding */}
              <div className="flex items-start gap-3 relative">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <span className="font-extrabold text-slate-900 block">Finding</span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {selectedPatent.finding}
                  </p>
                </div>
              </div>

              {/* Step 2: Source */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <span className="font-extrabold text-slate-900 block">Source</span>
                  <p className="text-slate-800 font-semibold text-[11px]">
                    Semantic search: "{selectedPatent.sourceQuery}"
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Search date: {selectedPatent.searchDate}
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Query type: {selectedPatent.queryType}
                  </p>
                </div>
              </div>

              {/* Step 3: Patent */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <span className="font-extrabold text-slate-900 block">Patent</span>
                  <a
                    href={`https://patents.google.com/patent/${selectedPatent.patentNumber}/en`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold inline-flex items-center gap-1 hover:underline text-xs"
                  >
                    <span>{selectedPatent.patentNumber}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-slate-900 font-bold text-[11px] leading-tight">
                    {selectedPatent.title}
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Publication date: {selectedPatent.publishDate} • Assignee: {selectedPatent.assignee}
                  </p>
                </div>
              </div>

              {/* Step 4: Relevant Passage */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Quote className="w-4 h-4" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 block">Relevant passage</span>
                    <a
                      href={`https://patents.google.com/patent/${selectedPatent.patentNumber}/en`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <span>Show in patent</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl text-[11px] text-slate-700 italic leading-relaxed">
                    "{selectedPatent.passage}"
                    <div className="text-[10px] font-semibold text-slate-500 not-italic mt-1.5">
                      {selectedPatent.passageRef}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Explanation */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <span className="font-extrabold text-slate-900 block">Explanation</span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {selectedPatent.explanation}
                  </p>
                </div>
              </div>

              {/* Warning Disclaimer */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>AI conclusions are evidence-backed and preliminary.</strong> A patent professional should review and validate the findings for legal significance.
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => toast.success(`Saved ${selectedPatent.patentNumber} to project workspace.`)}
                  className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer text-center"
                >
                  Add to project
                </button>
                <button
                  onClick={() => handleAddReference(selectedPatent)}
                  className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer text-center"
                >
                  Add as prior art reference +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
