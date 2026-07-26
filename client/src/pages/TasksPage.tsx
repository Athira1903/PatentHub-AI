import React from 'react';
import { CheckSquare, Plus } from 'lucide-react';

export const TasksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patent Tasks</h2>
          <p className="text-sm text-slate-500">Track review milestones and attorney feedback</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm">
        <CheckSquare className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-lg font-semibold text-slate-800">No Tasks Assigned</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          Assigned tasks for claim reviews and document uploads will appear here.
        </p>
      </div>
    </div>
  );
};
