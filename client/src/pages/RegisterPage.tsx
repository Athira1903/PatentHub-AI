import React from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Mail,
  User as UserIcon,
  Building,
  ArrowRight,
  Shield,
  ShieldCheck,
  Phone,
  Bookmark,
  Briefcase,
  Layers,
  Fingerprint,
} from 'lucide-react';
import { api } from '../services/api';
import { signInWithGoogleFirebase } from '../config/firebase';
import { useState } from 'react';

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  institution: z.string().trim().min(1, 'Institution is required'),
  department: z.string().trim().min(1, 'Department is required'),
  designation: z.string().trim().min(1, 'Designation is required'),
  userType: z.enum(['Student', 'Guide', 'PatentExpert', 'Admin']),
  employeeOrStudentId: z.string().trim().max(50).optional(),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const firebaseUser = await signInWithGoogleFirebase();
      const response = await api.post('/auth/google-login', {
        email: firebaseUser.email,
        fullName: firebaseUser.displayName,
        googleId: firebaseUser.uid,
      });
      localStorage.setItem('patenthub_token', response.data.token);
      toast.success('Registered with Google via Firebase!');
      navigate('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || '';
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('closed')) {
        toast.error(msg || 'Google Sign-In failed');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      institution: '',
      department: '',
      designation: '',
      userType: 'Student',
      employeeOrStudentId: '',
      agreeTerms: undefined,
    },
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    try {
      const response = await api.post('/auth/register', {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        institution: data.institution,
        department: data.department,
        designation: data.designation,
        userType: data.userType,
        employeeOrStudentId: data.employeeOrStudentId || undefined,
      });

      const generatedUsername = response.data.user.username;
      toast.success('Registration successful! Check your email for your activation code.');
      
      // Redirect to the activation page with the generated username pre-filled
      navigate(`/activate?username=${generatedUsername}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 font-sans my-auto py-12 animate-fade-in relative z-10">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/15 via-cyan-400/10 to-indigo-500/15 rounded-3xl blur-2xl pointer-events-none -z-10" />

      {/* Card wrapper */}
      <div className="glass-card border border-slate-200/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500"></div>

        {/* Header */}
        <div className="text-center mb-8 pt-1">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Institutional Registration</h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">Create your institutional PatentHub AI account</p>
        </div>

        {/* Google Sign-Up Trigger */}
        <div className="space-y-4 mb-6">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="w-full h-11 rounded-xl font-extrabold bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
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
            <div className="border-t border-slate-200/80 w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 absolute">or register with credentials</span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Full Name & User Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('fullName')}
                  placeholder="Athira Biju"
                  className="w-full h-11 pl-10 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">User Type (Role)</label>
              <div className="relative">
                <Layers className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  {...register('userType')}
                  className="w-full h-11 pl-10 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs cursor-pointer"
                >
                  <option value="Student">Student (Inventor)</option>
                  <option value="Guide">Faculty Guide</option>
                  <option value="PatentExpert">Patent Expert</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
              {errors.userType && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.userType.message}</p>}
            </div>
          </div>

          {/* Email & Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@university.edu"
                  className="w-full h-11 pl-10 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs"
                />
              </div>
              {errors.email && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="Enter 10-digit number"
                  className="w-full h-11 pl-10 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs"
                />
              </div>
              {errors.phone && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.phone.message}</p>}
            </div>
          </div>

          {/* Institution & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Institution</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('institution')}
                  placeholder="University / College"
                  className="w-full h-11 pl-10 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs"
                />
              </div>
              {errors.institution && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.institution.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Department</label>
              <div className="relative">
                <Bookmark className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('department')}
                  placeholder="e.g. CSE / Mechanical"
                  className="w-full h-11 pl-10 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs"
                />
              </div>
              {errors.department && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.department.message}</p>}
            </div>
          </div>

          {/* Designation & Employee/Student ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Designation</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('designation')}
                  placeholder="e.g. Student / Professor"
                  className="w-full h-11 pl-10 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs"
                />
              </div>
              {errors.designation && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.designation.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Employee / Student ID (Optional)</label>
              <div className="relative">
                <Fingerprint className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('employeeOrStudentId')}
                  placeholder="e.g. STU202611"
                  className="w-full h-11 pl-10 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs"
                />
              </div>
              {errors.employeeOrStudentId && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.employeeOrStudentId.message}</p>}
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 text-xs text-slate-500 font-medium cursor-pointer">
              <input
                type="checkbox"
                {...register('agreeTerms')}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>
                I agree to the <span className="text-blue-600 font-bold hover:underline">Terms of Service</span> and{' '}
                <span className="text-blue-600 font-bold hover:underline">Privacy Policy</span> of the Indian Patent Workspace.
              </span>
            </label>
            {errors.agreeTerms && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.agreeTerms.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-4 cursor-pointer hover:-translate-y-0.5"
          >
            {isSubmitting ? 'Registering Account...' : 'Register Account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
          <p className="text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Sign in
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
