import React from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Lightbulb, FileText, Cpu, ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import { api } from '../services/api';

const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  innovationIdea: z.string().min(10, 'Innovation idea must be at least 10 characters'),
  problemStatement: z.string().min(10, 'Problem statement must be at least 10 characters'),
  proposedSolution: z.string().min(10, 'Proposed solution must be at least 10 characters'),
  technicalDomain: z.string().min(2, 'Technical domain is required'),
  category: z.string().min(2, 'Category is required'),
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
      technicalDomain: 'Artificial Intelligence',
      category: 'Utility Patent',
    },
  });

  const onSubmit: SubmitHandler<CreateProjectFormValues> = async (data) => {
    try {
      const response = await api.post('/projects', data);
      toast.success('Patent project created successfully!');
      navigate(`/dashboard/projects/${response.data.project.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/projects"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Create New Patent Project</h2>
            <p className="text-sm text-slate-500 font-medium">Start documenting your invention idea step-by-step</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">Invention Title</label>
          <p className="text-xs text-slate-500 mb-2">Give your invention a clear, descriptive name (e.g. Autonomous Solar Energy Harvester).</p>
          <div className="relative">
            <Shield className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              {...register('title')}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
              placeholder="e.g. Autonomous Quantum-Encrypted Distributed Neural Mesh"
            />
          </div>
          {errors.title && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">Technical Domain</label>
            <p className="text-xs text-slate-500 mb-2">Select the primary field of technology.</p>
            <div className="relative">
              <Cpu className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                {...register('technicalDomain')}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
              >
                <option value="Artificial Intelligence">Artificial Intelligence & ML</option>
                <option value="Renewable Energy">Renewable Energy & CleanTech</option>
                <option value="Biotechnology">Biotechnology & Healthcare</option>
                <option value="Cybersecurity">Cybersecurity & Cryptography</option>
                <option value="Software Systems">Software & Cloud Architecture</option>
                <option value="Mechanical & Robotics">Mechanical & Robotics</option>
              </select>
            </div>
            {errors.technicalDomain && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.technicalDomain.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">Patent Category</label>
            <p className="text-xs text-slate-500 mb-2">Select the type of patent application.</p>
            <div className="relative">
              <Layers className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                {...register('category')}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
              >
                <option value="Utility Patent">Utility Patent (Function / Process)</option>
                <option value="Design Patent">Design Patent (Visual Appearance)</option>
                <option value="Software Patent">Software Invention</option>
                <option value="Hardware System">Hardware System</option>
              </select>
            </div>
            {errors.category && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.category.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">1. Innovation Idea Summary</label>
          <p className="text-xs text-slate-500 mb-2">Explain what makes your invention unique and new in plain English.</p>
          <div className="relative">
            <Lightbulb className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <textarea
              rows={3}
              {...register('innovationIdea')}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
              placeholder="Describe the main idea and key novel features of your invention..."
            />
          </div>
          {errors.innovationIdea && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.innovationIdea.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">2. Problem Statement</label>
          <p className="text-xs text-slate-500 mb-2">What current problem or technical difficulty does this invention solve?</p>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <textarea
              rows={3}
              {...register('problemStatement')}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
              placeholder="What limitations exist in existing technology that you are fixing?"
            />
          </div>
          {errors.problemStatement && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.problemStatement.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">3. Proposed Technical Solution</label>
          <p className="text-xs text-slate-500 mb-2">How does your invention actually work step-by-step?</p>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <textarea
              rows={3}
              {...register('proposedSolution')}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
              placeholder="Explain the step-by-step technical method or mechanism used..."
            />
          </div>
          {errors.proposedSolution && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.proposedSolution.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/dashboard/projects"
            className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Project...' : 'Create Project'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
