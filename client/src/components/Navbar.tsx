import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, FileText, Cpu, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#dadce0]">
      {/* Google 4-Color Top Stripe */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/4 bg-[#4285F4]"></div>
        <div className="h-full w-1/4 bg-[#EA4335]"></div>
        <div className="h-full w-1/4 bg-[#FBBC05]"></div>
        <div className="h-full w-1/4 bg-[#34A853]"></div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#202124]">
            {/* Google Logo Dot Icon */}
            <div className="flex items-center gap-1 p-1.5 rounded-lg bg-[#f8f9fa] border border-[#dadce0]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4285F4]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FBBC05]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#34A853]"></span>
            </div>
            <span className="font-medium text-lg">
              <span className="text-[#4285F4]">P</span>
              <span className="text-[#EA4335]">a</span>
              <span className="text-[#FBBC05]">t</span>
              <span className="text-[#34A853]">e</span>
              <span className="text-[#4285F4]">n</span>
              <span className="text-[#EA4335]">t</span>
              <span className="text-[#202124] ml-1">Hub</span>
              <span className="text-[#1a73e8] font-normal text-xs ml-2 px-2.5 py-0.5 rounded-full bg-[#e8f0fe] border border-[#c2e7ff]">AI Workspace</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5f6368]">
            <Link to="/" className="hover:text-[#1a73e8] transition-colors">Home</Link>
            <Link to="/patents" className="flex items-center gap-1.5 hover:text-[#1a73e8] transition-colors">
              <FileText className="w-4 h-4 text-[#5f6368]" />
              Patents
            </Link>
            <Link to="/ai-assistant" className="flex items-center gap-1.5 hover:text-[#1a73e8] transition-colors">
              <Cpu className="w-4 h-4 text-[#1a73e8]" />
              AI Assistant
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#f1f3f4] rounded-full border border-[#dadce0] transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-[#1a73e8]" />
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full shadow-sm transition-all flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};
