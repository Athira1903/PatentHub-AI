import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, LogIn, FileText, Cpu, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
              <Shield className="w-6 h-6" />
            </div>
            <span>PatentHub <span className="text-blue-600 font-semibold">AI</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <Link to="/patents" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <FileText className="w-4 h-4 text-slate-400" />
              Patents
            </Link>
            <Link to="/ai-assistant" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Cpu className="w-4 h-4 text-blue-600" />
              AI Analysis
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-slate-500" />
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
