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
  RefreshCw,
  Mail,
  X,
  Loader2,
  Sparkles,
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

  // Resend / Reset Modal State
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendIdentifier, setResendIdentifier] = useState('');
  const [isResending, setIsResending] = useState(false);

  const usernameParam = searchParams.get('username') || '';
  const otpParam = searchParams.get('otp') || '';

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
      otp: otpParam,
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (usernameParam) {
      setValue('username', usernameParam);
      setResendIdentifier(usernameParam);
    }
    if (otpParam) {
      setValue('otp', otpParam);
    }
  }, [usernameParam, otpParam, setValue]);

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
      const userRole = response.data.user?.role;
      if (userRole === 'Admin' || userRole === 'Administrator') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Activation failed. Please check credentials or code.');
    }
  };

  const handleResendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendIdentifier.trim()) {
      toast.error('Please enter your generated username or registered email');
      return;
    }

    setIsResending(true);
    try {
      const res = await api.post('/auth/resend-activation', {
        identifier: resendIdentifier.trim(),
      });

      if (res.data.username) {
        setValue('username', res.data.username);
      }
      if (res.data.otp) {
        setValue('otp', res.data.otp);
      }

      toast.success(
        res.data.otp
          ? `New activation code generated! Code: ${res.data.otp}`
          : 'New activation code sent to your email!',
        { duration: 8000 }
      );
      setShowResendModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend activation code.');
    } finally {
      setIsResending(false);
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
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-600 text-white shadow-xs mb-3">
            <KeyRound className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Activate Account</h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">Verify your OTP and set up your permanent password</p>
        </div>

        {/* Activation Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Username */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Username
              </label>
            </div>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                {...register('username')}
                placeholder="Enter generated username"
                className="w-full h-11 pl-10 pr-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium transition-all shadow-3xs"
              />
            </div>
            {errors.username && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.username.message}</p>}
          </div>

          {/* OTP Code with Direct Resend Option */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Activation OTP Code
              </label>
              <button
                type="button"
                onClick={() => {
                  setResendIdentifier(watch('username') || usernameParam);
                  setShowResendModal(true);
                }}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Missed code? Resend</span>
              </button>
            </div>
            <div className="relative">
              <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                {...register('otp')}
                maxLength={6}
                placeholder="6-digit verification code"
                className="w-full h-11 pl-10 pr-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-bold tracking-widest text-center transition-all shadow-3xs"
              />
            </div>
            {errors.otp && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.otp.message}</p>}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Create secure password"
                className="w-full h-11 pl-10 pr-10 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium transition-all shadow-3xs"
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Re-enter password"
                className="w-full h-11 pl-10 pr-10 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium transition-all shadow-3xs"
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
            className="w-full h-11 rounded-xl font-bold bg-blue-900 hover:bg-blue-950 text-white text-xs shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 mt-4 cursor-pointer"
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

      {/* Interactive Resend Activation Code Modal */}
      {showResendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Resend Activation Code</h3>
                  <p className="text-[11px] text-slate-500">Generate a fresh 6-digit verification code</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResendModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Username or Registered Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={resendIdentifier}
                    onChange={(e) => setResendIdentifier(e.target.value)}
                    placeholder="e.g. STU202600001 or your@email.com"
                    className="w-full h-11 pl-10 pr-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium transition shadow-3xs"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter the username you received on registration or your registered email address.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResendModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResending}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate New Code</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivatePage;
