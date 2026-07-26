import React from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    try {
      const response = await api.post('/auth/login', data);
      localStorage.setItem('patenthub_token', response.data.token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-slate-50 relative">
      {/* Background Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60 -z-10" />

      <div className="max-w-md w-full space-y-8 p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
        <div className="text-center">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 inline-flex mb-4">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Sign in to PatentHub</h2>
          <p className="mt-1 text-sm text-slate-500 font-medium">Access your patent research workspace</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email or Username</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('emailOrUsername')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium"
                  placeholder="name@patenthub.ai or username"
                />
              </div>
              {errors.emailOrUsername && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.emailOrUsername.message}</p>
              )}
            </div>

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
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
