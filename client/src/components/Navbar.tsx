import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, LogIn, FileText, Cpu, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#dadce0]">
      {/* Sleek Blue Accent Border */}
      <div className="h-1 w-full bg-gradient-to-r from-[#1a73e8] to-[#0b57d0]"></div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#202124]">
            <div className="p-1.5 rounded-xl bg-[#e8f0fe] border border-[#c2e7ff] text-[#1a73e8]">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-[#202124]">
              PatentHub <span className="text-[#1a73e8]">AI</span>
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
              className="px-4 py-2 text-sm font-semibold text-[#1a73e8] hover:bg-[#f1f3f4] rounded-xl border border-[#dadce0] transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-[#1a73e8]" />
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-semibold bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};
