import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Search, ArrowRight, Database, ShieldCheck, FileText, Sparkles, Sliders } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#202124] overflow-hidden">
      {/* Background Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-70 -z-10" />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#e8f0fe] border border-[#c2e7ff] text-[#0b57d0] mb-6 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#1a73e8]" /> Patent Preparation & Collaborative Workflow Platform
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#202124] max-w-4xl mx-auto leading-[1.15]">
            From Innovative Idea to <span className="text-[#1a73e8]">Patent-Ready</span> Application
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[#5f6368] max-w-2xl mx-auto leading-relaxed font-normal">
            One centralized workspace for inventors, guides, and attorneys to manage document preparation, AI prior art search, prototype blueprints, and official patent office filings.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-7 py-3.5 rounded-xl font-semibold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm"
            >
              Start Free Patent Project <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-7 py-3.5 rounded-xl font-semibold bg-white border border-[#dadce0] text-[#1a73e8] hover:bg-[#f1f3f4] transition-all text-sm shadow-xs"
            >
              Sign In to Workspace
            </Link>
          </div>
        </motion.div>

        {/* High-Fidelity Product UI Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 max-w-5xl mx-auto rounded-2xl bg-white border border-[#dadce0] shadow-xl overflow-hidden text-left"
        >
          {/* Mock Window Titlebar */}
          <div className="px-4 py-3 bg-[#f1f3f4] border-b border-[#dadce0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ea4335]"></span>
              <span className="w-3 h-3 rounded-full bg-[#fbbc04]"></span>
              <span className="w-3 h-3 rounded-full bg-[#34a853]"></span>
              <span className="text-xs font-semibold text-[#5f6368] ml-2 font-mono">PatentHub AI • Workspace Preview</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#1a73e8] bg-[#e8f0fe] px-3 py-1 rounded-full border border-[#c2e7ff]">
              <Sparkles className="w-3.5 h-3.5" /> Gemini 2.0 Flash Active
            </div>
          </div>

          {/* Mock Product Body */}
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#f1f3f4] pb-4">
              <div>
                <span className="text-xs font-semibold text-[#0b57d0] px-2.5 py-1 rounded-full bg-[#e8f0fe] border border-[#c2e7ff]">
                  Utility Patent • AI & Cybersecurity
                </span>
                <h3 className="text-xl font-bold text-[#202124] mt-2">
                  Autonomous Quantum-Encrypted Distributed Neural Mesh
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-[#5f6368] font-medium">Patent Novelty Score</p>
                  <p className="text-xl font-extrabold text-[#34a853]">94.8%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#e6f4ea] border border-[#ceead6] text-[#137333] flex items-center justify-center font-bold text-sm">
                  A+
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">Claims Extracted</span>
                  <FileText className="w-4 h-4 text-[#1a73e8]" />
                </div>
                <p className="text-2xl font-bold text-[#202124]">18 Claims</p>
                <p className="text-xs text-[#34a853] font-medium mt-1">✓ 4 Independent, 14 Dependent</p>
              </div>

              <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">Prior Art Match</span>
                  <Search className="w-4 h-4 text-[#b06000]" />
                </div>
                <p className="text-2xl font-bold text-[#202124]">Low Conflict</p>
                <p className="text-xs text-[#5f6368] font-medium mt-1">3 Relevant Patents Analyzed</p>
              </div>

              <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">Filing Status</span>
                  <Sliders className="w-4 h-4 text-[#137333]" />
                </div>
                <p className="text-2xl font-bold text-[#202124]">Stage 5 / 8</p>
                <p className="text-xs text-[#1a73e8] font-medium mt-1">Documentation Phase</p>
              </div>
            </div>

            {/* Mock Workflow Bar Preview */}
            <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#5f6368]">Pipeline Progress</span>
                <span className="text-[#1a73e8]">62.5% Complete</span>
              </div>
              <div className="w-full h-2 bg-[#dadce0] rounded-full overflow-hidden">
                <div className="h-full bg-[#1a73e8] rounded-full w-5/8" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#dadce0]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-[#202124]">Complete Patent Lifecycle Management</h2>
          <p className="text-[#5f6368] mt-2 text-base">
            Integrated tools designed specifically for academic researchers, corporate inventors, and patent counsel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl bg-white border border-[#dadce0] shadow-sm hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#e8f0fe] flex items-center justify-center text-[#1a73e8] mb-6">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#202124] mb-2">Claim Analysis & Novelty</h3>
            <p className="text-[#5f6368] leading-relaxed text-sm">
              Structure technical descriptions, extract invention boundaries, and evaluate patent readiness with automated pipelines.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl bg-white border border-[#dadce0] shadow-sm hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#fef7e0] flex items-center justify-center text-[#b06000] mb-6">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#202124] mb-2">Prior Art & Vector Search</h3>
            <p className="text-[#5f6368] leading-relaxed text-sm">
              Discover relevant technical publications and existing patents through semantic similarity search engines.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl bg-white border border-[#dadce0] shadow-sm hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#e6f4ea] flex items-center justify-center text-[#137333] mb-6">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#202124] mb-2">Team & Guide Collaboration</h3>
            <p className="text-[#5f6368] leading-relaxed text-sm">
              Invite co-inventors, assign advisors, manage specification documents, and track official patent forms seamlessly.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
