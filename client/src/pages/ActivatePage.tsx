import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Lock,
  User as UserIcon,
  ArrowRight,
  Shield,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { api } from '../services/api';

const activateSchema = z
  .object({
    username: z.string().trim().min(1, 'Username is required'),
    otp: z.string().trim().length(6, 'Activation code must be exactly 6 digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 special character (!@#$%^&*)'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ActivateFormValues = z.infer<typeof activateSchema>;

export const ActivatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const usernameParam = searchParams.get('username') || '';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ActivateFormValues>({
    resolver: zodResolver(activateSchema),
    defaultValues: {
      username: usernameParam,
      otp: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (usernameParam) {
      setValue('username', usernameParam);
    }
  }, [usernameParam, setValue]);

  const passwordValue = watch('password') || '';

  const passwordReqs = [
    { label: '8+ Chars', met: passwordValue.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(passwordValue) },
    { label: 'Lowercase', met: /[a-z]/.test(passwordValue) },
    { label: 'Number', met: /[0-9]/.test(passwordValue) },
    { label: 'Symbol', met: /[^a-zA-Z0-9]/.test(passwordValue) },
  ];

  const onSubmit: SubmitHandler<ActivateFormValues> = async (data) => {
    try {
      const response = await api.post('/auth/activate', {
        username: data.username.trim(),
        otp: data.otp.trim(),
        password: data.password,
      });

      localStorage.setItem('patenthub_token', response.data.token);
      toast.success('Account activated successfully!');
      
      // Navigate to dashboard (which handles profile completions automatically)
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Activation failed. Please check credentials or code.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 font-sans my-auto py-12 animate-fade-in relative z-10">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/15 via-cyan-400/10 to-indigo-500/15 rounded-3xl blur-2xl pointer-events-none -z-10" />

      {/* Card Wrapper */}
      <div className="glass-card border border-slate-200/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500"></div>

        {/* Header */}
        <div className="text-center mb-6 pt-1">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Activate Account</h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">Verify your OTP and set up your permanent password</p>
        </div>

        {/* Activation Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Username</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                {...register('username')}
                placeholder="Enter generated username"
                className="w-full h-11 pl-10 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs"
              />
            </div>
            {errors.username && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.username.message}</p>}
          </div>

          {/* OTP Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Activation OTP Code</label>
            <div className="relative">
              <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                {...register('otp')}
                maxLength={6}
                placeholder="6-digit verification code"
                className="w-full h-11 pl-10 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-bold tracking-widest text-center transition-all shadow-2xs"
              />
            </div>
            {errors.otp && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.otp.message}</p>}
          </div>

          {/* New Password & Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Create secure password"
                className="w-full h-11 pl-10 pr-10 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Re-enter password"
                className="w-full h-11 pl-10 pr-10 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Password Requirements Badges */}
          {passwordValue && (
            <div className="flex flex-wrap gap-2 text-[10px] font-bold pt-1">
              {passwordReqs.map((req, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md transition-colors border ${
                    req.met ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-transparent'
                  }`}
                >
                  {req.met && <Check className="w-3 h-3 text-emerald-600" />}
                  {req.label}
                </span>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-4 cursor-pointer hover:-translate-y-0.5"
          >
            {isSubmitting ? 'Activating Account...' : 'Activate & Login'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
          <p className="text-slate-500">
            Back to{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Sign In
            </Link>
          </p>
          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> IPO Compliant
          </span>
        </div>
      </div>
    </div>
  );
};
