import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Search,
  FolderOpen,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../services/api';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [_projects, setProjects] = useState<any[]>([]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Fetch all projects then their documents
      const pRes = await api.get('/projects');
      const projList = pRes.data.projects || [];
      setProjects(projList);

      const allDocs: any[] = [];
      for (const p of projList) {
        if (p.documents && p.documents.length > 0) {
          for (const doc of p.documents) {
            allDocs.push({
              ...doc,
              projectTitle: p.title,
              projectId: p.id,
            });
          }
        }
      }
      setDocuments(allDocs);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const categories = [
    { id: 'ALL', label: 'All Documents' },
    { id: 'SPECIFICATION', label: 'Specifications (Form 2)' },
    { id: 'CLAIMS', label: 'Claims Dockets' },
    { id: 'DRAWING', label: 'Drawings & Figures' },
    { id: 'FILING', label: 'Filing Packages' },
    { id: 'SUPPORTING', label: 'Supporting Evidence' },
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = selectedCategory === 'ALL' || (doc.category || '').toUpperCase().includes(selectedCategory);
    const matchesSearch =
      !searchQuery.trim() ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.projectTitle && doc.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="border-b border-[#e2e8e4] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f0f7f6] text-[#3a6b65] mb-2 border border-[#dbebe9]">
            <FolderOpen className="w-3.5 h-3.5 mr-1" />
            Document Center
          </div>
          <h1 className="text-2xl font-bold text-[#191c1b] tracking-tight">Patent Document Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Central repository of generated specifications, claims dockets, drawings, and official filing packages.
          </p>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#e2e8e4] shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === c.id
                  ? 'bg-[#557862] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#557862]"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl border border-[#e2e8e4] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading document repository...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No documents found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Generated Form 2 specifications, Claims Dockets, and official PDFs will appear here once saved in your workspace.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/50 transition"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#f4f7f5] border border-[#d1dfd4] flex items-center justify-center text-[#557862] flex-shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-medium text-[#3a6b65]">{doc.projectTitle}</span>
                      <span>&bull;</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                        {doc.category}
                      </span>
                      <span>&bull;</span>
                      <span>v{doc.version || 1}</span>
                      <span>&bull;</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f0f7f6] hover:bg-[#dbebe9] text-[#3a6b65] border border-[#dbebe9] transition"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download PDF
                  </a>

                  <Link
                    to={`/dashboard/projects/${doc.projectId}`}
                    className="p-1.5 text-slate-400 hover:text-slate-600 transition"
                    title="Go to project workspace"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
