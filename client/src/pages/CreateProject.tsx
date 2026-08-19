import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Lightbulb, FileText, Cpu, ArrowLeft, Layers, Key, Eye, Calendar, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';

const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  innovationIdea: z.string().min(10, 'Innovation abstract must be at least 10 characters'),
  problemStatement: z.string().min(10, 'Problem statement must be at least 10 characters'),
  proposedSolution: z.string().min(10, 'Proposed solution must be at least 10 characters'),
  objectives: z.string().optional(),
  technicalDomain: z.string().min(2, 'Technical domain is required'),
  keywords: z.string().optional(),
  category: z.string().min(2, 'Category is required'),
  expectedFilingDate: z.string().optional(),
  patentType: z.string().optional(),
  visibility: z.string().optional(),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const [novelFeatures, setNovelFeatures] = useState<string[]>(['']);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: '',
      innovationIdea: '',
      problemStatement: '',
      proposedSolution: '',
      objectives: '',
      technicalDomain: 'Renewable Energy',
      keywords: '',
      category: 'Product + Process',
      expectedFilingDate: '',
      patentType: 'Provisional',
      visibility: 'PRIVATE',
    },
  });

  const handleAddFeature = () => {
    setNovelFeatures([...novelFeatures, '']);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...novelFeatures];
    updated[index] = value;
    setNovelFeatures(updated);
  };

  const handleRemoveFeature = (index: number) => {
    if (novelFeatures.length === 1) {
      setNovelFeatures(['']);
    } else {
      setNovelFeatures(novelFeatures.filter((_, i) => i !== index));
    }
  };

  const onSubmit: SubmitHandler<CreateProjectFormValues> = async (data) => {
    try {
      const formattedFeatures = novelFeatures
        .map((f) => f.trim())
        .filter(Boolean)
        .join('\n');

      const formattedData = {
        ...data,
        novelFeatures: formattedFeatures || undefined,
        objectives: data.objectives || undefined,
        keywords: data.keywords || undefined,
        expectedFilingDate: data.expectedFilingDate || undefined,
        patentType: data.patentType || undefined,
        visibility: data.visibility || undefined,
      };

      const response = await api.post('/projects', formattedData);
      toast.success('Patent project created successfully!');
      navigate(`/dashboard/projects/${response.data.project.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans py-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/projects"
            className="p-2.5 rounded-2xl bg-white/90 border border-slate-200/80 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Step 1 of 8
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Invention Details</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              CREATE PATENT PROJECT
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Document your invention concept step-by-step for prior art search & filing</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="app-card p-6 sm:p-8 space-y-6 bg-white border border-slate-250 shadow-md rounded-3xl">
        
        {/* Step 1 Section Heading */}
        <div className="border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Step 1 of 8 · Invention Details</span>
        </div>

        {/* Invention Title */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">Invention Title</label>
          <div className="relative">
            <Shield className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              {...register('title')}
              className="w-full pl-11 pr-4 py-3 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all"
              placeholder="Autonomous Solar Energy Harvesting System"
            />
          </div>
          {errors.title && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.title.message}</p>}
        </div>

        {/* Domain, Category, Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Technical Domain */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">Technical Domain</label>
            <div className="relative">
              <Cpu className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                {...register('technicalDomain')}
                className="w-full pl-11 pr-10 py-3 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all appearance-none cursor-pointer"
              >
                <option value="Renewable Energy">Renewable Energy & CleanTech</option>
                <option value="Artificial Intelligence">Artificial Intelligence & ML</option>
                <option value="Biotechnology">Biotechnology & Healthcare</option>
                <option value="Cybersecurity">Cybersecurity & Cryptography</option>
                <option value="Software Systems">Software & Cloud Architecture</option>
                <option value="Mechanical & Robotics">Mechanical & Robotics</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <span className="text-[10px]">▼</span>
              </div>
            </div>
            {errors.technicalDomain && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.technicalDomain.message}</p>}
          </div>

          {/* Invention Category */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">Invention Category</label>
            <div className="relative">
              <Layers className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                {...register('category')}
                className="w-full pl-11 pr-10 py-3 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all appearance-none cursor-pointer"
              >
                <option value="Product + Process">Product + Process</option>
                <option value="Utility Patent">Utility Patent (Function / Process)</option>
                <option value="Design Patent">Design Patent (Visual Appearance)</option>
                <option value="Software Patent">Software Invention</option>
                <option value="Hardware System">Hardware System</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <span className="text-[10px]">▼</span>
              </div>
            </div>
            {errors.category && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.category.message}</p>}
          </div>

          {/* Patent Application Type */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">Patent Application Type</label>
            <div className="relative">
              <Layers className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                {...register('patentType')}
                className="w-full pl-11 pr-10 py-3 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all appearance-none cursor-pointer"
              >
                <option value="Provisional">Provisional Specification</option>
                <option value="Utility">Complete Specification (Utility)</option>
                <option value="Design">Design Specification</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <span className="text-[10px]">▼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Divider */}
        <hr className="border-slate-200 my-4" />

        {/* FILING & ACCESS section */}
        <div>
          <span className="block text-xs font-black text-slate-800 uppercase tracking-widest mb-4">FILING & ACCESS</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Expected Filing Date */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">Expected Filing Date</label>
              <div className="relative">
                <Calendar className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  {...register('expectedFilingDate')}
                  className="w-full pl-11 pr-4 py-3 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all"
                />
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">Visibility</label>
              <div className="relative">
                <Eye className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  {...register('visibility')}
                  className="w-full pl-11 pr-10 py-3 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all appearance-none cursor-pointer"
                >
                  <option value="PRIVATE">Private — Team Only</option>
                  <option value="INSTITUTIONAL">Institutional — Colleague View</option>
                  <option value="PUBLIC">Public</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <span className="text-[10px]">▼</span>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">Keywords</label>
              <div className="relative">
                <Key className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('keywords')}
                  className="w-full pl-11 pr-4 py-3 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all"
                  placeholder="solar, energy harvesting, photovoltaic, storage"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Divider */}
        <hr className="border-slate-200 my-4" />

        {/* 1. Innovation Abstract */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">1. Innovation Abstract</label>
          <div className="relative">
            <Lightbulb className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <textarea
              rows={4}
              {...register('innovationIdea')}
              className="w-full pl-11 pr-4 py-3 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-medium transition-all"
              placeholder="Describe the invention, its purpose, major technical components and key features..."
            />
          </div>
          {errors.innovationIdea && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.innovationIdea.message}</p>}
        </div>

        {/* 2. Problem Statement */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">2. Problem Statement</label>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <textarea
              rows={4}
              {...register('problemStatement')}
              className="w-full pl-11 pr-4 py-3 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-medium transition-all"
              placeholder="Describe the technical problem and limitations of existing solutions..."
            />
          </div>
          {errors.problemStatement && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.problemStatement.message}</p>}
        </div>

        {/* 3. Proposed Technical Solution */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">3. Proposed Technical Solution</label>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <textarea
              rows={4}
              {...register('proposedSolution')}
              className="w-full pl-11 pr-4 py-3 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-medium transition-all"
              placeholder="Explain the technical mechanism and how the invention operates step by step..."
            />
          </div>
          {errors.proposedSolution && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.proposedSolution.message}</p>}
        </div>

        {/* 4. Objectives */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">4. Objectives</label>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <textarea
              rows={4}
              {...register('objectives')}
              className="w-full pl-11 pr-4 py-3 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-medium transition-all"
              placeholder="List the technical objectives and improvements..."
            />
          </div>
        </div>

        {/* 5. Key Novel Features */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">5. Key Novel Features</label>
          <div className="space-y-3">
            {novelFeatures.map((feature, idx) => (
              <div key={idx} className="flex gap-2 items-center animate-slide-in">
                <span className="text-xs font-semibold text-slate-400 select-none w-5 text-right">{idx + 1}.</span>
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-medium transition-all"
                  placeholder={`Novel Feature #${idx + 1} (e.g. Adaptive dual-axis tracking algorithm)`}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer"
                  title="Remove feature"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={handleAddFeature}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Novel Feature
            </button>
          </div>
        </div>

        {/* Section Divider */}
        <hr className="border-slate-200 my-4" />

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            to="/dashboard/projects"
            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition text-xs shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition flex items-center gap-2 text-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : 'Save & Continue →'}
          </button>
        </div>
      </form>
    </div>
  );
};

