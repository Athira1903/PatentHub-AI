import React from 'react';
import { motion } from 'framer-motion';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden py-16 px-6">
      {/* Decorative Grid Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40 -z-10" />

      <div className="max-w-4xl mx-auto space-y-16">
        {/* Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 uppercase tracking-widest">
            Our Mission & Vision
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            About PatentHub AI
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-semibold max-w-xl mx-auto leading-relaxed">
            Bridging the gap between engineering research labs and official Indian Patent Office (IPO) filing registries.
          </p>
        </motion.div>

        {/* The Core Vision Block */}
        <section className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-950">Accelerating Academic Innovation</h3>
            <p className="text-slate-600 text-xs leading-relaxed font-semibold">
              PatentHub AI was founded to solve a major bottleneck in Indian universities: the long, complex journey from an inventor's lab notebook to a filing-ready patent application.
            </p>
            <p className="text-slate-600 text-xs leading-relaxed font-semibold">
              By combining semantic prior art audits with interactive workflow checklists, we empower student researchers and faculty guides to prepare draft specifications in a compliant format.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-[11px] font-bold text-slate-700">Patents Rules, 2003 Compliant Sheets</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-[11px] font-bold text-slate-700">Secure Database Sandbox Security</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-[11px] font-bold text-slate-700">Collaborative Guide Review Workflows</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
