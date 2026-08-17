import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, User as UserIcon, ArrowRight, Shield, ShieldCheck, Eye, EyeOff, KeyRound, X } from 'lucide-react';
import { api } from '../services/api';
import { signInWithGoogleFirebase } from '../config/firebase';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleFallbackOpen, setGoogleFallbackOpen] = useState(false);
  const [googleFallbackEmail, setGoogleFallbackEmail] = useState('');
  const [googleFallbackName, setGoogleFallbackName] = useState('');

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const firebaseUser = await signInWithGoogleFirebase();
      const response = await api.post('/auth/google-login', {
        email: firebaseUser.email,
        fullName: firebaseUser.displayName,
        googleId: firebaseUser.uid,
      });
      localStorage.setItem('patenthub_token', response.data.token);
      toast.success('Signed in with Google!');
      const userRole = response.data.user?.role;
      if (userRole === 'Admin' || userRole === 'Administrator') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error?.code === 'FIREBASE_NETWORK_FAILED' || error?.message === 'FIREBASE_NETWORK_FAILED') {
        setGoogleFallbackOpen(true);
        return;
      }
      const msg = error.response?.data?.message || error.message || '';
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('closed')) {
        toast.error(msg || 'Google Sign-In failed');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDirectGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleFallbackEmail.trim() || !googleFallbackEmail.includes('@')) {
      toast.error('Please enter a valid Google email address');
      return;
    }
    try {
      setIsGoogleLoading(true);
      const response = await api.post('/auth/google-login', {
        email: googleFallbackEmail.trim(),
        fullName: googleFallbackName.trim() || googleFallbackEmail.split('@')[0],
      });
      localStorage.setItem('patenthub_token', response.data.token);
      toast.success('Signed in with Google Account!');
      setGoogleFallbackOpen(false);
      const userRole = response.data.user?.role;
      if (userRole === 'Admin' || userRole === 'Administrator') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to authenticate Google account');
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  // OTP Modal State
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSending, setResetSending] = useState(false);

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
      const userRole = response.data.user?.role;
      if (userRole === 'Admin' || userRole === 'Administrator') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setResetSending(true);
    try {
      await api.post('/auth/send-otp', { email: resetEmail });
      toast.success('OTP sent successfully. Please check your email inbox.', { duration: 6000 });
      setOtpStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setResetSending(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 6) {
      toast.error('Please enter a valid 6-digit OTP code');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setResetSending(true);
    try {
      await api.post('/auth/verify-otp-reset', {
        email: resetEmail,
        otp: otpCode,
        newPassword: newPassword,
      });
      toast.success('Password reset successfully! You can now log in.');
      setForgotModalOpen(false);
      setOtpStep(1);
      setResetEmail('');
      setOtpCode('');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to verify OTP.');
    } finally {
      setResetSending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 font-sans my-auto py-12 animate-fade-in relative z-10">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/15 via-cyan-400/10 to-indigo-500/15 rounded-3xl blur-2xl pointer-events-none -z-10" />

      {/* Main Login Card */}
      <div className="glass-card border border-slate-200/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500"></div>

        {/* Header */}
        <div className="text-center mb-8 pt-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-600 text-white shadow-xs mb-3">
            <Shield className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Institutional Login</h1>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">Access your institutional patent research workspace</p>
        </div>

        {/* Google Sign-In Trigger */}
        <div className="space-y-4 mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full h-11 rounded-xl font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 absolute">or sign in with credentials</span>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Username</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                {...register('emailOrUsername')}
                placeholder="e.g. STU202600015"
                className="w-full h-11 pl-10 pr-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium transition-all shadow-3xs"
              />
            </div>
            {errors.emailOrUsername && (
              <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.emailOrUsername.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <button
                type="button"
                onClick={() => {
                  setOtpStep(1);
                  setForgotModalOpen(true);
                }}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Enter password"
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl font-bold bg-blue-900 hover:bg-blue-950 text-white text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 mt-5 cursor-pointer"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-5 border-t border-slate-100 flex flex-col gap-2.5 text-center text-xs text-slate-500 font-medium">
            <div>
              Don't have an account?{' '}
              <Link to="/register" className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline">
                Create an account
              </Link>
            </div>
            <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100/60">
              Need to activate a new account?{' '}
              <Link to="/activate" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                Activate Account here
              </Link>
            </div>
          </div>
        </form>
      </div>

      {/* Forgot Password OTP Reset Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-scale-in relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Reset Password</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verification Steps</p>
              </div>
            </div>

            {otpStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Enter your registered institutional email to request a 6-digit password reset OTP.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 text-xs focus:outline-none focus:border-blue-600 font-semibold"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetSending}
                  className="w-full h-11 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {resetSending ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3.5">
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  An OTP code was sent to <strong className="text-slate-800">{resetEmail}</strong>. Please enter the code and your new password.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">OTP Code</label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    placeholder="6-digit code"
                    className="w-full h-11 text-center font-bold tracking-widest bg-slate-50 border border-slate-200 rounded-xl text-slate-950 text-xs focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create secure password"
                      className="w-full h-11 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 text-xs focus:outline-none focus:border-blue-600 font-semibold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep(1)}
                    className="w-1/3 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={resetSending}
                    className="w-2/3 h-11 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {resetSending ? 'Resetting...' : 'Verify & Reset'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Google Authentication Fallback Modal */}
      {googleFallbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Google Authentication</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Institutional Single Sign-On</p>
                </div>
              </div>
              <button
                onClick={() => setGoogleFallbackOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-150 rounded-xl text-xs text-blue-900 leading-relaxed font-medium">
              Popup communication was blocked by your browser on localhost. Enter your Google Account email below to sign in directly.
            </div>

            <form onSubmit={handleDirectGoogleLogin} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Google / Institutional Email
                </label>
                <input
                  type="email"
                  value={googleFallbackEmail}
                  onChange={(e) => setGoogleFallbackEmail(e.target.value)}
                  placeholder="name@university.edu or name@gmail.com"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={googleFallbackName}
                  onChange={(e) => setGoogleFallbackName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGoogleFallbackOpen(false)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGoogleLoading}
                  className="w-2/3 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50"
                >
                  {isGoogleLoading ? 'Authenticating...' : 'Sign In with Google'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
