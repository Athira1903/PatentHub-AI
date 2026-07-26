import React from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or Username is required'),
  password: z.string().min(1, 'Password is required'),
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
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sign in. Please check credentials.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#f8f9fa]">
      <div className="max-w-md w-full space-y-8 p-8 rounded-2xl bg-white border border-[#dadce0] shadow-sm">
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-1 mb-4">
            <span className="w-3 h-3 rounded-full bg-[#1a73e8]"></span>
            <span className="w-3 h-3 rounded-full bg-[#ea4335]"></span>
            <span className="w-3 h-3 rounded-full bg-[#fbbc04]"></span>
            <span className="w-3 h-3 rounded-full bg-[#34a853]"></span>
          </div>
          <h2 className="text-2xl font-medium text-[#202124]">Sign in to PatentHub AI</h2>
          <p className="mt-1 text-sm text-[#5f6368]">Use your PatentHub Workspace account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#3c4043] mb-1">Email or Username</label>
              <div className="relative">
                <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]" />
                <input
                  type="text"
                  {...register('emailOrUsername')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dadce0] rounded-lg text-[#202124] placeholder-[#5f6368] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all text-sm font-normal"
                  placeholder="email@domain.com or username"
                />
              </div>
              {errors.emailOrUsername && <p className="mt-1 text-xs text-[#d93025]">{errors.emailOrUsername.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3c4043] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]" />
                <input
                  type="password"
                  {...register('password')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dadce0] rounded-lg text-[#202124] placeholder-[#5f6368] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all text-sm font-normal"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-[#d93025]">{errors.password.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-full font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-sm transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-[#5f6368]">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-[#1a73e8] hover:underline">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
