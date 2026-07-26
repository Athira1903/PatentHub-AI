import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, LogIn, FileText, Cpu } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            <Shield className="w-7 h-7 text-indigo-400" />
            <span>PatentHub AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link to="/" className="hover:text-indigo-400 transition-colors">Home</Link>
            <Link to="/patents" className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
              <FileText className="w-4 h-4 text-slate-400" />
              Patents
            </Link>
            <Link to="/ai-assistant" className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
              <Cpu className="w-4 h-4 text-indigo-400" />
              AI Analysis
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
