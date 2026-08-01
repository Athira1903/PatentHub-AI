import React from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Lightbulb, FileText, Cpu, ArrowLeft, ArrowRight, Layers, Key, Eye, Calendar } from 'lucide-react';
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
      technicalDomain: 'Artificial Intelligence',
      keywords: '',
      category: 'Utility Patent',
      expectedFilingDate: '',
      patentType: 'Utility',
      visibility: 'PRIVATE',
    },
  });

  const onSubmit: SubmitHandler<CreateProjectFormValues> = async (data) => {
    try {
      const formattedData = {
        ...data,
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
              <span className="text-xs text-slate-400 font-semibold">• Concept Initiation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Create New Patent Project
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Document your invention concept step-by-step for prior art search & filing</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500"></div>

        {/* Invention Title */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Invention Title</label>
          <p className="text-xs text-slate-500 mb-2.5">Give your invention a clear, descriptive technical title (e.g. Autonomous Solar Energy Harvester).</p>
          <div className="relative">
            <Shield className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              {...register('title')}
              className="w-full pl-11 pr-4 py-3 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
              placeholder="e.g. Autonomous Quantum-Encrypted Distributed Neural Mesh"
            />
          </div>
          {errors.title && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.title.message}</p>}
        </div>

        {/* Domain & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Technical Domain</label>
            <p className="text-xs text-slate-500 mb-2.5">Select the primary field of technology.</p>
            <div className="relative">
              <Cpu className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                {...register('technicalDomain')}
                className="w-full pl-11 pr-4 py-3 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
              >
                <option value="Artificial Intelligence">Artificial Intelligence & ML</option>
                <option value="Renewable Energy">Renewable Energy & CleanTech</option>
                <option value="Biotechnology">Biotechnology & Healthcare</option>
                <option value="Cybersecurity">Cybersecurity & Cryptography</option>
                <option value="Software Systems">Software & Cloud Architecture</option>
                <option value="Mechanical & Robotics">Mechanical & Robotics</option>
              </select>
            </div>
            {errors.technicalDomain && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.technicalDomain.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Patent Category</label>
            <p className="text-xs text-slate-500 mb-2.5">Select the category of the invention.</p>
            <div className="relative">
              <Layers className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                {...register('category')}
                className="w-full pl-11 pr-4 py-3 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
              >
                <option value="Utility Patent">Utility Patent (Function / Process)</option>
                <option value="Design Patent">Design Patent (Visual Appearance)</option>
                <option value="Software Patent">Software Invention</option>
                <option value="Hardware System">Hardware System</option>
              </select>
            </div>
            {errors.category && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.category.message}</p>}
          </div>
        </div>

        {/* Metadata parameters (Patent Type, Visibility, Expected Filing Date) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Patent Type</label>
            <p className="text-xs text-slate-500 mb-2.5">Choose application type.</p>
            <div className="relative">
              <Layers className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                {...register('patentType')}
                className="w-full pl-11 pr-4 py-3 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
              >
                <option value="Utility">Utility Patent</option>
                <option value="Design">Design Patent</option>
                <option value="Provisional">Provisional Application</option>
                <option value="Plant">Plant Patent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Visibility</label>
            <p className="text-xs text-slate-500 mb-2.5">Set workspace access scope.</p>
            <div className="relative">
              <Eye className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                {...register('visibility')}
                className="w-full pl-11 pr-4 py-3 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
              >
                <option value="PRIVATE">Private (Team Only)</option>
                <option value="INSTITUTIONAL">Institutional (Colleague View)</option>
                <option value="PUBLIC">Public</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Expected Filing Date</label>
            <p className="text-xs text-slate-500 mb-2.5">Projected timeline deadline.</p>
            <div className="relative">
              <Calendar className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                {...register('expectedFilingDate')}
                className="w-full pl-11 pr-4 py-3 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Keywords</label>
          <p className="text-xs text-slate-500 mb-2.5">Comma-separated key phrases used to categorize research (e.g. quantum, encryption, decentralized).</p>
          <div className="relative">
            <Key className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              {...register('keywords')}
              placeholder="quantum, neural, solar"
              className="w-full pl-11 pr-4 py-3 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Innovation Idea Abstract */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">1. Innovation Abstract</label>
          <p className="text-xs text-slate-500 mb-2.5">Provide a detailed summary detailing what makes your invention unique and novel.</p>
          <div className="relative">
            <Lightbulb className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <textarea
              rows={3}
              {...register('innovationIdea')}
              className="w-full pl-11 pr-4 py-3 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-medium transition-all shadow-2xs"
              placeholder="Describe the main idea and key novel features of your invention..."
            />
          </div>
          {errors.innovationIdea && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.innovationIdea.message}</p>}
        </div>

        {/* Problem Statement */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">2. Problem Statement</label>
          <p className="text-xs text-slate-500 mb-2.5">What current problem or technical difficulty does this invention solve?</p>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <textarea
              rows={3}
              {...register('problemStatement')}
              className="w-full pl-11 pr-4 py-3 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-medium transition-all shadow-2xs"
              placeholder="What limitations exist in existing technology that you are fixing?"
            />
          </div>
          {errors.problemStatement && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.problemStatement.message}</p>}
        </div>

        {/* Proposed Technical Solution */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">3. Proposed Technical Solution</label>
          <p className="text-xs text-slate-500 mb-2.5">How does your invention actually work step-by-step?</p>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <textarea
              rows={3}
              {...register('proposedSolution')}
              className="w-full pl-11 pr-4 py-3 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-medium transition-all shadow-2xs"
              placeholder="Explain the step-by-step technical method or mechanism used..."
            />
          </div>
          {errors.proposedSolution && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.proposedSolution.message}</p>}
        </div>

        {/* Objectives */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">4. Objectives</label>
          <p className="text-xs text-slate-500 mb-2.5">What are the specific operational or technical milestones this system aims to achieve?</p>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <textarea
              rows={3}
              {...register('objectives')}
              className="w-full pl-11 pr-4 py-3 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm font-medium transition-all shadow-2xs"
              placeholder="List the technical and practical objectives of the system..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <Link
            to="/dashboard/projects"
            className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors text-xs uppercase tracking-wider"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-7 py-3 rounded-2xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 transition-all flex items-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 hover:-translate-y-0.5 cursor-pointer"
          >
            {isSubmitting ? 'Creating Project...' : 'Create Patent Project'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
