import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, FileText, Cpu, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200/80 transition-all">
      {/* Sleek Blue-Teal Gradient Accent Border */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600"></div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Custom Patent Shield SVG Logo */}
          <Link to="/" className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="font-bold text-xl text-slate-900">
              PatentHub <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <Link to="/patents" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <FileText className="w-4 h-4 text-slate-500" />
              Patents
            </Link>
            <Link to="/ai-assistant" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Cpu className="w-4 h-4 text-cyan-600" />
              AI Assistant
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-blue-600" />
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};
