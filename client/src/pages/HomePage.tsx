import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Search, ArrowRight, Database, ShieldCheck } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#202124]">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-[#e8f0fe] border border-[#c2e7ff] text-[#0b57d0] mb-6">
          <ShieldCheck className="w-4 h-4 text-[#1a73e8]" /> Google Workspace Inspired Patent Intelligence Platform
        </div>
        <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-[#202124] max-w-4xl mx-auto leading-tight">
          Streamline Research, Drafting & Patent Filing Workflow
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-[#5f6368] max-w-2xl mx-auto leading-relaxed font-normal">
          Manage patent projects from initial concept through prior art searches, team reviews, and official patent office filings in a clean Google-inspired environment.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="px-6 py-3 rounded-full font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-sm transition-all flex items-center gap-2 text-sm"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-full font-medium bg-white border border-[#dadce0] text-[#1a73e8] hover:bg-[#f1f3f4] transition-all text-sm"
          >
            Sign In to Workspace
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#dadce0]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white border border-[#dadce0] hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f0fe] flex items-center justify-center text-[#1a73e8] mb-6">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium text-[#202124] mb-2">Claim Analysis & Novelty</h3>
            <p className="text-[#5f6368] leading-relaxed text-sm">
              Structure technical descriptions, extract invention boundaries, and evaluate patent readiness with automated pipelines.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-[#dadce0] hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#fef7e0] flex items-center justify-center text-[#b06000] mb-6">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium text-[#202124] mb-2">Prior Art & Vector Search</h3>
            <p className="text-[#5f6368] leading-relaxed text-sm">
              Discover relevant technical publications and existing patents through semantic similarity search engines.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-[#dadce0] hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#e6f4ea] flex items-center justify-center text-[#137333] mb-6">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium text-[#202124] mb-2">Team & Guide Collaboration</h3>
            <p className="text-[#5f6368] leading-relaxed text-sm">
              Invite co-inventors, assign advisors, manage specification documents, and track official patent forms seamlessly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
