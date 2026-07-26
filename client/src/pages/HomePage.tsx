import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Search, ArrowRight, Database, ShieldCheck, Mic, Camera } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#202124]">
      {/* Hero Section - Classic Google Search Layout */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Google 4-Color Title */}
        <div className="mb-6">
          <span className="text-5xl sm:text-7xl font-bold tracking-tight">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
            <span className="text-[#202124] ml-3 font-medium">Patents</span>
          </span>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-[#e8f0fe] border border-[#c2e7ff] text-[#0b57d0] mb-8">
          <ShieldCheck className="w-4 h-4 text-[#1a73e8]" /> Powered by Gemini AI & Semantic Prior Art Search
        </div>

        {/* Authentic Google Search Bar Input */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white border border-[#dadce0] hover:shadow-md focus-within:shadow-md rounded-full h-12 px-5 flex items-center gap-3 transition-shadow">
            <Search className="w-5 h-5 text-[#9aa0a6] shrink-0" />
            <input
              type="text"
              placeholder="Search patent claims, prior art, technical keywords..."
              className="w-full bg-transparent border-none text-sm text-[#202124] placeholder-[#70757a] focus:outline-none"
            />
            <div className="flex items-center gap-3 shrink-0">
              <button title="Search by Voice" className="text-[#4285F4] hover:opacity-80">
                <Mic className="w-5 h-5" />
              </button>
              <button title="Search by Image / Lens" className="text-[#FBBC05] hover:opacity-80">
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Google Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          <Link
            to="/register"
            className="px-6 py-2.5 rounded-md font-medium bg-[#f8f9fa] border border-[#f8f9fa] hover:border-[#dadce0] text-[#3c4043] text-sm hover:bg-[#f1f3f4] transition-all"
          >
            Google Search
          </Link>
          <Link
            to="/dashboard/create-project"
            className="px-6 py-2.5 rounded-md font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm shadow-sm transition-all flex items-center gap-2"
          >
            Create Patent Project <ArrowRight className="w-4 h-4" />
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
