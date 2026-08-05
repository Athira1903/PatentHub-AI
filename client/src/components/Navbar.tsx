import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 transition-all duration-300 pointer-events-none">
      <nav className="max-w-6xl mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-md rounded-full px-6 py-2.5 flex items-center justify-between pointer-events-auto transition-all">
        {/* Logo & Brand Identity */}
        <Link to="/" className="flex items-center gap-1 group font-heading">
          <span className="font-extrabold text-xl tracking-tight text-slate-950 lowercase">
            patenthub<span className="text-cyan-500 font-extrabold">.</span>
          </span>
        </Link>

        {/* Center Nav Items */}
        <div className="hidden md:flex items-center gap-8 text-xs font-bold">
          <Link
            to="/"
            className={`transition-colors ${
              location.pathname === '/'
                ? 'text-slate-950 font-extrabold'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={`transition-colors ${
              location.pathname === '/about'
                ? 'text-slate-950 font-extrabold'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            About
          </Link>
          <Link
            to="/patents"
            className={`flex items-center gap-1.5 transition-colors ${
              location.pathname.startsWith('/patents')
                ? 'text-slate-950 font-extrabold'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Patents
          </Link>
          <Link
            to="/ai-assistant"
            className={`flex items-center gap-1.5 transition-colors ${
              location.pathname.startsWith('/ai-assistant')
                ? 'text-slate-950 font-extrabold'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            AI Assistant
          </Link>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center">
          <Link
            to="/register"
            className="px-5 py-2.5 text-xs font-extrabold bg-slate-950 hover:bg-slate-900 text-white rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
};
