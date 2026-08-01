import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileCode, 
  ShieldCheck,
  Sparkles,
  Users,
  Compass,
  Search
} from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Decorative Grid Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-50 -z-10" />

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-6 max-w-7xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Version Pill */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 border border-slate-200/80 text-slate-500 mb-8 shadow-2xs tracking-tight">
            <span>Secure & IPO-Compliant Patent Workspace</span>
          </div>

          {/* Large Hero Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 tracking-tight leading-[1.08] max-w-4xl mx-auto font-heading">
            From lab notebook to <br className="hidden sm:inline" />
            filing-ready patent
          </h1>

          {/* Subtitle description */}
          <p className="mt-8 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-semibold">
            One workspace where inventors, co-inventors and faculty guides prepare an Indian patent application together — with AI doing the searching, summarising and checking.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-full transition-all duration-300 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/35 hover:-translate-y-0.5">
              <span>Create your account</span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Three Value Proposition Cards (Matches Screenshot layout exactly) */}
      <section className="pb-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-start text-left gap-5 hover:border-blue-500/35 hover:shadow-md transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm mb-2 tracking-tight">Co-inventors & guides</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                Invite by username, set per-member permissions, and let guides accept supervision requests.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-start text-left gap-5 hover:border-blue-500/35 hover:shadow-md transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm mb-2 tracking-tight">Semantic prior-art search</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                Find conceptually similar patents, not just keyword matches, before you draft a claim.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-start text-left gap-5 hover:border-blue-500/35 hover:shadow-md transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm mb-2 tracking-tight">Ask your documents</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                Summaries, keyword and domain extraction, and grounded answers across every file you upload.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction / Platform Overview Section */}
      <section className="py-16 px-6 max-w-5xl mx-auto border-t border-slate-200/60 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full w-fit">
              Platform Overview
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight leading-tight">
              About PatentHub
            </h2>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              Accelerating Intellectual Property Creation
            </p>
          </div>
          <div className="md:col-span-7">
            <p className="text-slate-600 text-xs leading-relaxed font-semibold">
              PatentHub is a secure, end-to-end web workspace designed specifically for universities, engineering departments, and independent inventors in India. We bridge the gap between complex research ideas and official Indian Patent Office (IPO) filing protocols. By providing integrated tools like prior art search history, claims configuration tables, and guided roadmap checklists, we simplify the path to utility patent filings.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200/60 text-center">
              <div>
                <h4 className="text-lg font-extrabold text-blue-600">₹0 Cost</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">For Students & Labs</p>
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-blue-600">100% Secure</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Data Isolation</p>
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-blue-600">IPO Compliant</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Forms 1, 2, 3, & 5</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section id="features" className="py-24 border-t border-slate-200/60 max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-1 space-y-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              Platform Features
            </span>
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight leading-tight">
              An Editorial Workspace Built for University Research Labs
            </h2>
            <p className="text-slate-600 text-xs leading-relaxed font-semibold">
              We coordinate patent preparation tasks among research guides, supervisors, co-inventors, and legal advisers, saving countless review loops.
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 w-fit shadow-2xs">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Specification Exporter</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Generates ready-to-file legal specifications formatted directly to the standards of the Indian Patent Office (IPO).
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 w-fit shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Collaborative Workspaces</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Separate portals and task streams for Inventors, Guides, Co-inventors, and Patent Experts with approval flows.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 w-fit shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Enterprise Security</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Role-based access controls and tokenized document management protecting unpublished invention disclosures.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 w-fit shadow-2xs">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Prior Art Scanning</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Log and document prior art search references across USPTO, WIPO, and Indian Registry databases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Clean Footer */}
      <footer className="border-t border-slate-200/70 bg-white/60 py-12 text-center text-[11px] font-bold text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PatentHub AI Inc. All rights reserved. Registered under Indian Patent Office guidelines.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-900">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900">Terms of Service</a>
            <a href="mailto:support@patenthub.ai" className="hover:text-slate-900">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
