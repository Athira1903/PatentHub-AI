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
  username: z.string().min(3, 'Username must be at least 3 characters'),
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
    <div className="min-h-[90vh] py-12 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#f8f9fa]">
      <div className="max-w-xl w-full space-y-8 p-8 rounded-2xl bg-white border border-[#dadce0] shadow-sm">
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-1 mb-4">
            <span className="w-3 h-3 rounded-full bg-[#1a73e8]"></span>
            <span className="w-3 h-3 rounded-full bg-[#ea4335]"></span>
            <span className="w-3 h-3 rounded-full bg-[#fbbc04]"></span>
            <span className="w-3 h-3 rounded-full bg-[#34a853]"></span>
          </div>
          <h2 className="text-2xl font-medium text-[#202124]">Create your PatentHub Account</h2>
          <p className="mt-1 text-sm text-[#5f6368]">Join the PatentHub AI Workspace platform</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3c4043] mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]" />
                <input
                  type="text"
                  {...register('fullName')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dadce0] rounded-lg text-[#202124] placeholder-[#5f6368] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-sm font-normal"
                  placeholder="Dr. Jane Doe"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-[#d93025]">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3c4043] mb-1">Username</label>
              <div className="relative">
                <AtSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]" />
                <input
                  type="text"
                  {...register('username')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dadce0] rounded-lg text-[#202124] placeholder-[#5f6368] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-sm font-normal"
                  placeholder="janedoe"
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-[#d93025]">{errors.username.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3c4043] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dadce0] rounded-lg text-[#202124] placeholder-[#5f6368] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-sm font-normal"
                  placeholder="jane@patenthub.ai"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-[#d93025]">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3c4043] mb-1">Institution (Optional)</label>
              <div className="relative">
                <Building className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]" />
                <input
                  type="text"
                  {...register('institution')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dadce0] rounded-lg text-[#202124] placeholder-[#5f6368] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-sm font-normal"
                  placeholder="MIT / Stanford"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3c4043] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]" />
                <input
                  type="password"
                  {...register('password')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dadce0] rounded-lg text-[#202124] placeholder-[#5f6368] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-sm font-normal"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-[#d93025]">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3c4043] mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]" />
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dadce0] rounded-lg text-[#202124] placeholder-[#5f6368] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-sm font-normal"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-[#d93025]">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3c4043] mb-1">Role</label>
            <select
              {...register('role')}
              className="w-full px-4 py-2.5 bg-white border border-[#dadce0] rounded-lg text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-sm font-normal"
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
            className="w-full py-2.5 px-4 rounded-full font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-sm transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-6"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-[#5f6368]">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#1a73e8] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
