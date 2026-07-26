import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, FileText, Cpu, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#dadce0]">
      {/* Google 4-Color Top Line */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/4 bg-[#4285F4]"></div>
        <div className="h-full w-1/4 bg-[#EA4335]"></div>
        <div className="h-full w-1/4 bg-[#FBBC05]"></div>
        <div className="h-full w-1/4 bg-[#34A853]"></div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Authentic Google Logo & Brand */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#202124]">
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-semibold">
              <span className="text-[#4285F4]">G</span>
              <span className="text-[#EA4335]">o</span>
              <span className="text-[#FBBC05]">o</span>
              <span className="text-[#4285F4]">g</span>
              <span className="text-[#34A853]">l</span>
              <span className="text-[#EA4335]">e</span>
              <span className="text-[#202124] ml-1.5 font-medium">Patent Hub</span>
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
