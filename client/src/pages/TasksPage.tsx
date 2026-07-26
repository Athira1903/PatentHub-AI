import React from 'react';
import { CheckSquare, Plus } from 'lucide-react';

export const TasksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Patent Tasks</h2>
          <p className="text-sm text-slate-400">Track review milestones and attorney feedback</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
        <CheckSquare className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h3 className="text-lg font-semibold text-slate-300">No Tasks Assigned</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          Assigned tasks for claim reviews and document uploads will appear here.
        </p>
      </div>
    </div>
  );
};
