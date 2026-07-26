import React from 'react';
import { CheckSquare, Plus } from 'lucide-react';

export const TasksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium text-[#202124]">Patent Tasks</h2>
          <p className="text-sm text-[#5f6368]">Track review milestones and attorney feedback</p>
        </div>
        <button className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-sm font-medium flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="p-12 text-center rounded-2xl bg-white border border-[#dadce0] shadow-sm">
        <CheckSquare className="w-12 h-12 mx-auto text-[#5f6368] mb-3" />
        <h3 className="text-lg font-medium text-[#202124]">No Tasks Assigned</h3>
        <p className="text-sm text-[#5f6368] max-w-sm mx-auto mt-1">
          Assigned tasks for claim reviews and document uploads will appear here.
        </p>
      </div>
    </div>
  );
};
