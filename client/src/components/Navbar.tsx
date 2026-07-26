import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, FileText, Cpu, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <nav className="border-b border-[#dadce0] bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#202124]">
            {/* Google 4-Color Dots Icon */}
            <div className="flex items-center gap-1 p-1.5 rounded-lg bg-[#f8f9fa] border border-[#dadce0]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#fbbc04]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]"></span>
            </div>
            <span className="font-semibold text-lg">
              <span className="text-[#1a73e8]">P</span>
              <span className="text-[#ea4335]">a</span>
              <span className="text-[#fbbc04]">t</span>
              <span className="text-[#34a853]">e</span>
              <span className="text-[#1a73e8]">n</span>
              <span className="text-[#ea4335]">t</span>
              <span className="text-[#202124] ml-1">Hub</span>
              <span className="text-[#1a73e8] font-normal text-sm ml-1.5 px-2 py-0.5 rounded-full bg-[#e8f0fe] border border-[#c2e7ff]">AI</span>
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
              AI Workspace
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
      </div>
    </nav>
  );
};
