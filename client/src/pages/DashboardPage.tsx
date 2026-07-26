import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sparkles, FileText, Cpu, CheckCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useOutletContext<{ user: any }>() || {};

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/20">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Welcome, {user?.fullName || 'Inventor'}! <Sparkles className="w-5 h-5 text-indigo-400" />
        </h2>
        <p className="text-slate-400 mt-1 text-sm">
          PatentHub AI Workspace • Logged in as <span className="text-indigo-400 font-medium">{user?.role}</span> ({user?.institution || 'Independent'})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-lg">Active Patents</h3>
          <p className="text-2xl font-extrabold text-indigo-400 mt-2">0</p>
          <p className="text-xs text-slate-500 mt-1">Ready for filing and claim analysis</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-lg">AI Prior Art Searches</h3>
          <p className="text-2xl font-extrabold text-purple-400 mt-2">0</p>
          <p className="text-xs text-slate-500 mt-1">Powered by Gemini AI</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-lg">Tasks Completed</h3>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">0</p>
          <p className="text-xs text-slate-500 mt-1">Workflow actions</p>
        </div>
      </div>
    </div>
  );
};
