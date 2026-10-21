import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Sparkles, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { normalizeUserRole } from '../utils/roleUtils';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('patenthub_token') : null;
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/activate' ||
    location.pathname === '/complete-profile';

  let targetPath = '/dashboard';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = normalizeUserRole(payload?.role);
      if (role === 'ADMIN') {
        targetPath = '/admin';
      } else if (role === 'ORGANIZATION_ADMIN') {
        targetPath = '/org-admin';
      } else {
        targetPath = '/dashboard';
      }
    } catch {
      targetPath = '/dashboard';
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#131B2B]/95 backdrop-blur-md border-b border-[#DADCE0] dark:border-[#23314B] transition-colors duration-200">
      {/* 4-Color Google Accent Line */}
      <div className="h-[3px] bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] w-full" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand Identity */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white dark:bg-[#1C263B] border border-[#DADCE0] dark:border-[#23314B] shadow-xs group-hover:shadow-md transition-all">
            <div className="grid grid-cols-2 gap-1 p-0.5">
              <span className="size-1.5 rounded-full bg-[#4285F4]" />
              <span className="size-1.5 rounded-full bg-[#EA4335]" />
              <span className="size-1.5 rounded-full bg-[#FBBC05]" />
              <span className="size-1.5 rounded-full bg-[#34A853]" />
            </div>
          </div>
          <span className="font-extrabold text-base tracking-tight text-[#202124] dark:text-[#F8FAFC]">
            PatentHub<span className="gemini-gradient-text font-black">AI</span>
          </span>
        </Link>

        {/* Center Nav Items */}
        {!isAuthPage ? (
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-medium text-[#5F6368] dark:text-[#94A3B8]">
            <Link to="/#about" className="hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] px-3.5 py-1.5 rounded-full transition-colors">
              Overview
            </Link>
            <Link to="/#workflow" className="hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] px-3.5 py-1.5 rounded-full transition-colors">
              8-Stage Workflow
            </Link>
            <Link to="/#pro" className="text-[#1A73E8] dark:text-[#8AB4F8] hover:bg-[#E8F0FE] dark:hover:bg-blue-950/40 px-3.5 py-1.5 rounded-full font-semibold transition-colors">
              Pro Suite
            </Link>
            <Link to="/#capabilities" className="hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] px-3.5 py-1.5 rounded-full transition-colors">
              Capabilities
            </Link>
            <Link to="/#roles" className="hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] px-3.5 py-1.5 rounded-full transition-colors">
              Role Portals
            </Link>
            <Link to="/about" className="hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] px-3.5 py-1.5 rounded-full transition-colors">
              About
            </Link>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#5F6368] dark:text-[#94A3B8]">
            <Sparkles className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#8AB4F8]" />
            <span>Google Cloud AI Powered IP Engineering Platform</span>
          </div>
        )}

        {/* Action Triggers */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] border border-[#DADCE0] dark:border-[#23314B] transition-colors cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle light or dark theme"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-[#FBBC04] animate-spin-once" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#5F6368]" />
            )}
          </button>

          {token ? (
            <Link
              to={targetPath}
              className="google-btn-primary px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <span>Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <Link
                  to="/login"
                  className="google-btn-outline px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Sign in
                </Link>
              )}
              {location.pathname !== '/register' && (
                <Link
                  to="/register"
                  className="google-btn-primary px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </>
          )}

          {!isAuthPage && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC] md:hidden rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B]"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && !isAuthPage && (
        <div className="md:hidden border-t border-[#DADCE0] dark:border-[#23314B] bg-white dark:bg-[#131B2B] px-4 py-3 space-y-2 text-xs font-bold animate-fade-in">
          <Link
            to="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC]"
          >
            Overview
          </Link>
          <Link
            to="/#workflow"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC]"
          >
            8-Stage Workflow
          </Link>
          <Link
            to="/#pro"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#1A73E8] dark:text-[#8AB4F8]"
          >
            Pro Suite
          </Link>
          <Link
            to="/#capabilities"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC]"
          >
            Capabilities
          </Link>
          <Link
            to="/#roles"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC]"
          >
            Role Portals
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC]"
          >
            About
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
