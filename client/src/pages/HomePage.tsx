import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Play,
  CheckCircle2,
  Search,
  Sparkles,
  FileCode,
  Layers,
  AlertTriangle,
  Users,
  FileText,
  Lightbulb,
  ChevronRight,
  BarChart2
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const processSteps = [
    { name: 'IDEA', label: 'Capture your invention', icon: Lightbulb, color: 'text-amber-500 bg-amber-50' },
    { name: 'SEARCH', label: 'Find relevant prior art', icon: Search, color: 'text-emerald-500 bg-emerald-50' },
    { name: 'ANALYZE', label: 'AI relevance & insights', icon: BarChart2, color: 'text-emerald-600 bg-emerald-50' },
    { name: 'CLAIMS', label: 'Draft and refine patent claims', icon: FileCode, color: 'text-emerald-600 bg-emerald-50' },
    { name: 'DRAWINGS', label: 'Link technical drawings', icon: Layers, color: 'text-blue-600 bg-blue-50' },
    { name: 'FTO', label: 'Evaluate freedom to operate', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
    { name: 'REVIEW', label: 'Collaborate with experts', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { name: 'FILING', label: 'Prepare filing-ready documents', icon: FileText, color: 'text-purple-600 bg-purple-50' }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-100 px-6 sm:px-12 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-50">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Shield className="w-4 h-4 fill-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900">
            PatentHub-AI
          </span>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <div className="relative">
            <button
              onClick={() => setShowProductDropdown(!showProductDropdown)}
              className="flex items-center gap-1 hover:text-slate-900 transition"
            >
              <span>Product</span>
              <span className="text-xs">⌄</span>
            </button>
          </div>
          <a href="#how-it-works" className="hover:text-slate-900 transition">How it works</a>
          <a href="#organizations" className="hover:text-slate-900 transition">For organizations</a>
          <a href="#security" className="hover:text-slate-900 transition">Security</a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-bold text-slate-700 hover:text-slate-900 px-3 py-2 transition"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 transition cursor-pointer"
          >
            <span>Get started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 sm:px-12 py-12 md:py-16 space-y-16">
        {/* Headline & Description */}
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
            From invention to filing, one connected workspace.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            Capture your invention, discover prior art, engineer claims, connect technical drawings, evaluate preliminary FTO risk, collaborate with experts, and prepare filing-ready documentation.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/register"
              className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-md shadow-blue-900/25 transition cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-5 py-3.5 rounded-xl text-sm font-bold shadow-xs transition cursor-pointer"
            >
              <span>See how it works</span>
              <Play className="w-4 h-4 fill-slate-700 text-slate-700" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pt-2">
            <CheckCircle2 className="w-4 h-4 text-slate-700" />
            <span>Secure by design. Built for patent professionals.</span>
          </div>
        </div>

        {/* Connected Visual Workspace Interactive Diagram */}
        <div id="how-it-works" className="relative p-6 sm:p-8 bg-slate-50/70 border border-slate-200/80 rounded-3xl shadow-sm space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (3 cols): Invention, Prior Art Search, AI Analysis Nodes */}
            <div className="lg:col-span-3 space-y-4">
              <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-3xs flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Invention</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Captured</p>
                </div>
              </div>

              <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-3xs flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Prior Art Search</h4>
                  <p className="text-[10px] text-slate-500 font-medium">1,284 results</p>
                </div>
              </div>

              <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-3xs flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">AI Analysis</h4>
                  <p className="text-[10px] text-emerald-600 font-bold">72% relevant</p>
                </div>
              </div>
            </div>

            {/* Center Main Diagram (6 cols): Smart Monitoring System Blueprint & Callout Tags */}
            <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Smart Monitoring System</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Invention ID: INV-2024-0012</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  Invention captured
                </span>
              </div>

              {/* 2D Technical Drawing Mockup */}
              <div className="relative p-6 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col items-center justify-center min-h-[220px]">
                {/* SVG Blueprint Illustration */}
                <svg className="w-48 h-32 text-slate-800" viewBox="0 0 200 120" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="30" y="25" width="100" height="70" rx="16" strokeDasharray="1 1" />
                  <path d="M40 35 H120 V85 H40 Z" />
                  <circle cx="160" cy="55" r="20" strokeDasharray="2 2" />
                  <path d="M120 55 L140 55" strokeWidth="1" />
                  {/* Callout Lines */}
                  <line x1="35" y1="20" x2="35" y2="10" stroke="#2563EB" />
                  <line x1="125" y1="20" x2="125" y2="10" stroke="#2563EB" />
                  <line x1="170" y1="35" x2="180" y2="25" stroke="#2563EB" />
                  <line x1="120" y1="90" x2="130" y2="100" stroke="#2563EB" />
                  <line x1="40" y1="90" x2="30" y2="105" stroke="#2563EB" />
                </svg>

                {/* Callout Labels */}
                <span className="absolute top-2 left-6 text-[10px] font-bold text-blue-600 font-mono">100</span>
                <span className="absolute top-2 left-32 text-[10px] font-bold text-blue-600 font-mono">112</span>
                <span className="absolute top-4 right-10 text-[10px] font-bold text-blue-600 font-mono">104</span>
                <span className="absolute bottom-2 left-8 text-[10px] font-bold text-blue-600 font-mono">102</span>
                <span className="absolute bottom-2 right-28 text-[10px] font-bold text-blue-600 font-mono">108</span>
                <span className="absolute bottom-2 right-12 text-[10px] font-bold text-blue-600 font-mono">106</span>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">FIG. 1</span>
              </div>
            </div>

            {/* Right Evidence Column (3 cols) */}
            <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Evidence</h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-bold text-slate-800 text-[11px]">US 10,123,456 B2</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600">High</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-bold text-slate-800 text-[11px]">US 9,876,543 B2</span>
                  </div>
                  <span className="text-[9px] font-bold text-amber-600">Medium</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-bold text-slate-800 text-[11px]">WO 2023/012345 A1</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">Low</span>
                </div>

                <Link
                  to="/register"
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 pt-1"
                >
                  <span>View full search</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Connected Nodes (Claims, Drawing Set, FTO Risk) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Claims Node */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900">Claims (3)</h4>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                1. A smart monitoring system comprising:
              </p>
              <button className="text-[10px] font-bold text-blue-600 hover:underline">
                + Add dependent claim
              </button>
            </div>

            {/* Drawing Set Node */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900">Drawing Set</h4>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">5 sheets</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-8 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[9px] font-mono">FIG. 1</div>
                <div className="w-10 h-8 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[9px] font-mono">FIG. 2</div>
                <div className="w-10 h-8 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[9px] font-mono">FIG. 3</div>
              </div>
              <Link to="/register" className="text-[10px] font-bold text-blue-600 hover:underline block">
                View all drawings &gt;
              </Link>
            </div>

            {/* FTO Risk Node */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-slate-900">FTO Risk</h4>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-extrabold text-slate-900">34%</span>
                <span className="text-[10px] font-bold text-amber-600">Moderate risk</span>
              </div>
              <Link to="/register" className="text-[10px] font-bold text-blue-600 hover:underline block">
                View analysis &gt;
              </Link>
            </div>
          </div>
        </div>

        {/* 8-Step Horizontal Process Ribbon */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between overflow-x-auto gap-3 py-2">
            {processSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.name}>
                  <div className="flex flex-col items-center text-center space-y-2 shrink-0 px-2 min-w-[100px]">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${step.color} shadow-3xs`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-900 block">{step.name}</span>
                      <span className="text-[9px] text-slate-400 font-medium block leading-tight">{step.label}</span>
                    </div>
                  </div>
                  {idx < processSteps.length - 1 && (
                    <div className="text-slate-300 font-bold shrink-0">→</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Bottom Trust Badge Banner */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-150">
            <Shield className="w-6 h-6 fill-emerald-600 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Evidence-first AI. Human-reviewed decisions.
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Transparent sources. Traceable analysis. Stronger patents.
            </p>
          </div>
        </div>
      </main>

      {/* Clean Modern Footer */}
      <footer className="border-t border-slate-100 py-8 px-6 sm:px-12 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <p>© 2026 PatentHub-AI Inc. All rights reserved.</p>
        <div className="flex items-center gap-6 font-semibold">
          <a href="#privacy" className="hover:text-slate-800">Privacy Policy</a>
          <a href="#terms" className="hover:text-slate-800">Terms of Service</a>
          <a href="#security" className="hover:text-slate-800">Security Architecture</a>
        </div>
      </footer>
    </div>
  );
};
