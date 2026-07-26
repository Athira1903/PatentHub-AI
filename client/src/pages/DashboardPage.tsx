import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sparkles, FileText, Cpu, CheckCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useOutletContext<{ user: any }>() || {};

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          Welcome, {user?.fullName || 'Inventor'}! <Sparkles className="w-5 h-5 text-blue-600" />
        </h2>
        <p className="text-slate-600 mt-1 text-sm">
          PatentHub AI Workspace • Logged in as <span className="text-blue-700 font-semibold">{user?.role}</span> ({user?.institution || 'Independent Researcher'})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Active Patents</h3>
          <p className="text-2xl font-extrabold text-blue-600 mt-2">0</p>
          <p className="text-xs text-slate-500 mt-1">Ready for filing and claim analysis</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">AI Prior Art Searches</h3>
          <p className="text-2xl font-extrabold text-indigo-600 mt-2">0</p>
          <p className="text-xs text-slate-500 mt-1">Powered by Gemini AI</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Tasks Completed</h3>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">0</p>
          <p className="text-xs text-slate-500 mt-1">Workflow actions</p>
        </div>
      </div>
    </div>
  );
};
