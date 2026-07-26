import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Search, ArrowRight, Database, ShieldCheck } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 mb-6">
          <ShieldCheck className="w-4 h-4 text-blue-600" /> Enterprise Patent Intelligence & Collaborative Workspace
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
          Accelerate Patent Research & Team Collaboration
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Manage patent projects from initial concept through prior art searches, team reviews, and official patent office filings in one unified platform.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="px-6 py-3.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center gap-2"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3.5 rounded-xl font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all"
          >
            Sign In to Workspace
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Claim Analysis & Novelty</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Structure technical descriptions, extract invention boundaries, and evaluate patent readiness with automated pipelines.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Prior Art & Vector Search</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Discover relevant technical publications and existing patents through semantic similarity search engines.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-6">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Team & Guide Collaboration</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Invite co-inventors, assign advisors, manage specification documents, and track official patent forms seamlessly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
