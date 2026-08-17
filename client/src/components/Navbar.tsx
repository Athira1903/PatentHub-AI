import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ArrowRight, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('patenthub_token') : null;
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/activate' || location.pathname === '/complete-profile';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 h-16 flex items-center justify-between">
        {/* Logo & Brand Identity */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 fill-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-950">
            PatentHub-AI
          </span>
        </Link>

        {/* Center Nav Items (Hidden on Auth Pages for minimal focus, or clean links on home) */}
        {!isAuthPage ? (
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
            <Link to="/#how-it-works" className="hover:text-slate-950 transition">
              How It Works
            </Link>
            <Link to="/#features" className="hover:text-slate-950 transition">
              Patent Studio
            </Link>
            <Link to="/#organizations" className="hover:text-slate-950 transition">
              For Universities
            </Link>
            <Link to="/#security" className="hover:text-slate-950 transition">
              Security & Trust
            </Link>
            <Link to="/about" className="hover:text-slate-950 transition">
              About
            </Link>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Institutional IP & Patent Engineering Cloud</span>
          </div>
        )}

        {/* Action Triggers */}
        <div className="flex items-center gap-3">
          {token ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <span>Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <Link
                  to="/login"
                  className="text-xs font-bold text-slate-700 hover:text-slate-950 px-3 py-1.5 transition"
                >
                  Log in
                </Link>
              )}
              {location.pathname !== '/register' && (
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
