import React from 'react';
import { motion } from 'framer-motion';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans py-16 px-6 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-100 text-blue-700">
            Our Mission & Vision
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            About PatentHub-AI
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-xl mx-auto leading-relaxed">
            Bridging the gap between engineering research and filing-ready patent applications through evidence-first AI and expert validation.
          </p>
        </motion.div>

        {/* The Core Vision Block */}
        <section className="app-card p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3.5">
            <h3 className="text-lg font-extrabold text-slate-900">Accelerating Academic & Enterprise Innovation</h3>
            <p className="text-slate-600 text-xs leading-relaxed font-medium">
              PatentHub-AI was designed to streamline the complex journey from technical concept to structured, defensible patent claims.
            </p>
            <p className="text-slate-600 text-xs leading-relaxed font-medium">
              By uniting semantic prior art searching, interactive claim engineering, drawing analysis, and expert reviews in one connected workspace, teams can move faster with confidence.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0">✓</div>
              <span className="text-xs font-bold text-slate-800">IPO & Statutory Form Compliance</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0">✓</div>
              <span className="text-xs font-bold text-slate-800">Evidence-Backed Semantic Prior Art Search</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0">✓</div>
              <span className="text-xs font-bold text-slate-800">Collaborative Faculty & Expert Review Workflows</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0">✓</div>
              <span className="text-xs font-bold text-slate-800">End-to-End Filing Package Generation</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
