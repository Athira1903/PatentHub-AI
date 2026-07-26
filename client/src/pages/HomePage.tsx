import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Database, CheckCircle2, FileCode, Layers, Radar, FileCheck, ShieldCheck } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Background Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60 -z-10" />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-indigo-600/10 border border-blue-500/20 text-blue-700 mb-6 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Easy & Complete Indian Patent Filing Workspace
          </span>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            Turn Your Invention Ideas Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600">Ready-to-File</span> Patents
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            PatentHub AI guides students, researchers, and inventors step-by-step from your initial concept to searching existing patents, drafting technical claims, and generating official Indian patent forms.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-7 py-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 flex items-center gap-2 text-sm"
            >
              Start Free Patent Project <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-7 py-3.5 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all text-sm shadow-xs"
            >
              Sign In to Workspace
            </Link>
          </div>
        </motion.div>

        {/* User-Friendly Bento Grid Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
        >
          {/* Step 1 Card: Idea Originality Check */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">1. Check If Your Idea Is Unique</h3>
                  <p className="text-xs text-slate-500 font-medium">Automatic Invention Novelty Analysis</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                94.8% High Originality
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700">
              <div className="flex items-center justify-between text-slate-500 font-semibold">
                <span>Main Invention Claim</span>
                <span className="text-blue-600">100% Original Concept</span>
              </div>
              <p className="text-slate-800 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-sans text-xs">
                "An autonomous quantum-encrypted distributed mesh network comprising a plurality of neural nodes configured to perform zero-knowledge cryptographic handshake verification..."
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-semibold font-sans">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> High Originality Verified • Ready for Patent Drafting
              </div>
            </div>
          </div>

          {/* Step 2 Card: Search Existing Patents */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl flex flex-col justify-between hover:border-cyan-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200">
                  <Radar className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                  Global Search
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">2. Search Existing Patents</h3>
              <p className="text-xs text-slate-500 mb-4">Search global databases to ensure no one else patented your idea first.</p>

              {/* Animated Radar Sweep Mockup */}
              <div className="h-32 rounded-2xl bg-slate-900 relative overflow-hidden flex items-center justify-center border border-slate-800">
                <div className="absolute w-24 h-24 rounded-full border border-cyan-500/30 animate-ping" />
                <div className="absolute w-16 h-16 rounded-full border border-cyan-400/50" />
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                <span className="absolute bottom-2 text-[10px] text-cyan-400 font-mono">0 Direct Conflicts Found</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Similarity Risk</span>
              <span className="text-emerald-600 font-mono">Safe to File (&lt;12%)</span>
            </div>
          </div>

          {/* Step 3 Card: Auto-Fill Official Indian Patent Forms */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl hover:border-indigo-500/40 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">3. Official Indian Patent Forms</h3>
                <p className="text-xs text-slate-500">Auto-filled official IPO legal documents</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between">
                <span>Form 1 (Application)</span>
                <span className="text-emerald-600 font-mono">Ready</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between">
                <span>Form 2 (Specification)</span>
                <span className="text-emerald-600 font-mono">Ready</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between">
                <span>Form 3 (Statement)</span>
                <span className="text-emerald-600 font-mono">Ready</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between">
                <span>Form 5 (Declaration)</span>
                <span className="text-emerald-600 font-mono">Ready</span>
              </div>
            </div>
          </div>

          {/* Step 4 Card: Guided 8-Step Filing Roadmap */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl hover:border-blue-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">4. Easy 8-Step Filing Roadmap</h3>
                  <p className="text-xs text-slate-500 font-medium">Follow a simple step-by-step checklist from concept to patent grant</p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Current Step: Documentation
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mt-2">
              {['Idea', 'Search', 'Planning', 'Prototype', 'Docs', 'Review', 'Forms', 'Filing'].map((stg, i) => (
                <div
                  key={stg}
                  className={`p-2.5 rounded-xl border text-center font-mono text-[11px] font-bold ${
                    i < 5
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : i === 5
                      ? 'bg-cyan-50 border-cyan-500 text-cyan-700 ring-2 ring-cyan-400/30'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <p className="text-[9px] opacity-75">0{i + 1}</p>
                  <p className="font-sans text-xs truncate mt-0.5">{stg}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900">How PatentHub AI Helps You</h2>
          <p className="text-slate-600 mt-2 text-base font-normal">
            Everything you need to turn your research into an officially filed patent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-6">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Technical Description Assistant</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Convert your raw research notes into structured patent claims with clear technical boundaries.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 mb-6">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Patent Search</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Search millions of existing patents using plain English sentences instead of complex legal keywords.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-6">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Team & Guide Collaboration</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Work together with your professors, guide advisors, co-inventors, and legal experts in one shared workspace.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
