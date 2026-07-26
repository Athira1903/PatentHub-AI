import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sparkles, FileText, Cpu, CheckCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useOutletContext<{ user: any }>() || {};

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-[#dadce0] shadow-sm">
        <h2 className="text-2xl font-medium text-[#202124] flex items-center gap-2">
          Welcome, {user?.fullName || 'Inventor'}! <Sparkles className="w-5 h-5 text-[#1a73e8]" />
        </h2>
        <p className="text-[#5f6368] mt-1 text-sm">
          PatentHub AI Workspace • Signed in as <span className="text-[#1a73e8] font-medium">{user?.role}</span> ({user?.institution || 'Independent Researcher'})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-[#dadce0] shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-medium text-[#202124] text-lg">Active Patents</h3>
          <p className="text-2xl font-bold text-[#1a73e8] mt-2">0</p>
          <p className="text-xs text-[#5f6368] mt-1">Ready for filing and claim analysis</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#dadce0] shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-[#fef7e0] text-[#b06000] flex items-center justify-center mb-4">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-medium text-[#202124] text-lg">AI Prior Art Searches</h3>
          <p className="text-2xl font-bold text-[#b06000] mt-2">0</p>
          <p className="text-xs text-[#5f6368] mt-1">Powered by Gemini AI</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#dadce0] shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-[#e6f4ea] text-[#137333] flex items-center justify-center mb-4">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="font-medium text-[#202124] text-lg">Tasks Completed</h3>
          <p className="text-2xl font-bold text-[#137333] mt-2">0</p>
          <p className="text-xs text-[#5f6368] mt-1">Workflow actions</p>
        </div>
      </div>
    </div>
  );
};
