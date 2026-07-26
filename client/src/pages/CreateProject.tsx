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
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">Create New Patent Project</h2>
            <p className="text-sm text-slate-400">Initialize a new patent idea and start technical documentation</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-8 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Patent Title</label>
          <div className="relative">
            <Shield className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              {...register('title')}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium"
              placeholder="e.g. Autonomous Quantum-Encrypted Distributed Neural Mesh"
            />
          </div>
          {errors.title && <p className="mt-1 text-xs text-rose-400">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Technical Domain</label>
            <div className="relative">
              <Cpu className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                {...register('technicalDomain')}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              >
                <option value="Artificial Intelligence">Artificial Intelligence & ML</option>
                <option value="Renewable Energy">Renewable Energy & CleanTech</option>
                <option value="Biotechnology">Biotechnology & Healthcare</option>
                <option value="Cybersecurity">Cybersecurity & Cryptography</option>
                <option value="Software Systems">Software & Cloud Architecture</option>
                <option value="Mechanical & Robotics">Mechanical & Robotics</option>
              </select>
            </div>
            {errors.technicalDomain && <p className="mt-1 text-xs text-rose-400">{errors.technicalDomain.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Patent Category</label>
            <div className="relative">
              <Layers className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                {...register('category')}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              >
                <option value="Utility Patent">Utility Patent</option>
                <option value="Design Patent">Design Patent</option>
                <option value="Software Patent">Software Invention</option>
                <option value="Hardware System">Hardware System</option>
              </select>
            </div>
            {errors.category && <p className="mt-1 text-xs text-rose-400">{errors.category.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Innovation Idea Summary</label>
          <div className="relative">
            <Lightbulb className="w-5 h-5 absolute left-3 top-3 text-slate-500" />
            <textarea
              rows={3}
              {...register('innovationIdea')}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              placeholder="Describe the core novelty and innovative concept of your invention..."
            />
          </div>
          {errors.innovationIdea && <p className="mt-1 text-xs text-rose-400">{errors.innovationIdea.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Problem Statement</label>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-3 top-3 text-slate-500" />
            <textarea
              rows={3}
              {...register('problemStatement')}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              placeholder="What current technical limitations or industrial problems does this solve?"
            />
          </div>
          {errors.problemStatement && <p className="mt-1 text-xs text-rose-400">{errors.problemStatement.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Proposed Solution</label>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-3 top-3 text-slate-500" />
            <textarea
              rows={3}
              {...register('proposedSolution')}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              placeholder="Explain how your technical implementation resolves the problem..."
            />
          </div>
          {errors.proposedSolution && <p className="mt-1 text-xs text-rose-400">{errors.proposedSolution.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Link
            to="/dashboard/projects"
            className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Project...' : 'Create Project'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
