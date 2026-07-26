import React from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Mail, User as UserIcon, Building, AtSign, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
  institution: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  role: z.enum(['Inventor', 'Guide', 'CoInventor', 'PatentExpert', 'Admin']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      institution: '',
      password: '',
      confirmPassword: '',
      role: 'Inventor',
    },
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      localStorage.setItem('patenthub_token', response.data.token);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[90vh] py-12 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-slate-50 relative">
      {/* Background Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60 -z-10" />

      <div className="max-w-xl w-full space-y-8 p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
        <div className="text-center">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 inline-flex mb-4">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Create your PatentHub Account</h2>
          <p className="mt-1 text-sm text-slate-500 font-medium">Join the PatentHub AI Workspace platform</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('fullName')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
                  placeholder="Dr. Jane Doe"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
              <div className="relative">
                <AtSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('username')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
                  placeholder="janedoe"
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.username.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
                  placeholder="jane@patenthub.ai"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Institution (Optional)</label>
              <div className="relative">
                <Building className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('institution')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
                  placeholder="MIT / Stanford"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  {...register('password')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
            <select
              {...register('role')}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
            >
              <option value="Inventor">Inventor</option>
              <option value="Guide">Guide</option>
              <option value="CoInventor">CoInventor</option>
              <option value="PatentExpert">PatentExpert</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-6"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
