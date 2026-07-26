import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Search, ArrowRight, Zap, Database } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Background Glow Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-indigo-600/10 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-600/10 blur-[140px] pointer-events-none -z-10 rounded-full" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6">
            <Zap className="w-3.5 h-3.5 text-indigo-400" /> Powered by Gemini AI & Vector Embeddings
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent max-w-4xl mx-auto leading-tight">
            Accelerate Patent Intelligence with Next-Gen AI Analysis
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Search, validate prior art, analyze patent claims, and extract key technical insights seamlessly with automated Gemini AI workflows.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/25 hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              Sign In to Workspace
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Gemini AI Claim Analysis</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Automatically summarize claims, extract scope boundaries, and detect novelty metrics using state-of-the-art LLMs.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Vector Search & Prior Art</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Discover hidden technical references and pre-existing patents with semantic vector search embeddings.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Secure PostgreSQL & Prisma</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Enterprise-grade relational storage with encrypted data pipelines and secure JWT role management.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
