import React from 'react';
import { FolderKanban, Plus } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Patent Projects</h2>
          <p className="text-sm text-slate-400">Manage research projects and patent drafts</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
        <FolderKanban className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h3 className="text-lg font-semibold text-slate-300">No Projects Found</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          Create your first patent project to start drafting claims and running prior art searches.
        </p>
      </div>
    </div>
  );
};
