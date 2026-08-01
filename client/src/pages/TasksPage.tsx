import React from 'react';
import { CheckSquare, Plus } from 'lucide-react';

export const TasksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patent Tasks</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Track review milestones and attorney feedback</p>
        </div>
        <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/80 shadow-md">
        <CheckSquare className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-lg font-extrabold text-slate-900">No Tasks Assigned</h3>
        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto mt-1">
          Assigned tasks for claim reviews and document uploads will appear here.
        </p>
      </div>
    </div>
  );
};
