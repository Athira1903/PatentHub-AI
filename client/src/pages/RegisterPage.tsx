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
  ShieldCheck,
  Phone,
  Bookmark,
  Briefcase,
  Layers,
  Fingerprint,
  X,
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
  userType: z.enum([
    'Student',
    'Guide',
    'PatentExpert',
    'Admin',
    'Inventor',
    'Co-Inventor',
    'Patent Expert',
    'Administrator',
  ]),
  employeeOrStudentId: z.string().trim().max(50).optional(),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleFallbackOpen, setGoogleFallbackOpen] = useState(false);
  const [googleFallbackEmail, setGoogleFallbackEmail] = useState('');
  const [googleFallbackName, setGoogleFallbackName] = useState('');

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

  const handleDirectGoogleRegister = async (e: React.FormEvent) => {
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
      toast.success('Registered with Google Account!');
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
      userType: 'Inventor' as any,
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
      const otp = response.data.activationOtp;
      
      if (otp) {
        toast.success(`Account registered! Code: ${otp}`, { duration: 10000 });
        navigate(`/activate?username=${generatedUsername}&otp=${otp}`);
      } else {
        toast.success('Registration successful! Check your email for your activation code.', { duration: 8000 });
        navigate(`/activate?username=${generatedUsername}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 font-sans my-auto py-12 animate-fade-in relative z-10">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="app-card p-6 sm:p-8 bg-white border border-slate-200/90 rounded-3xl shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-900 mb-2 border border-blue-100">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Create Workspace Account</h2>
          <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto leading-relaxed">
            Register your institution credentials to create and collaborate on patent projects.
          </p>
        </div>

        {/* Google Registration Button */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="w-full h-11 bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
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
                  placeholder="e.g. Dr. John Doe"
                  className="w-full h-11 pl-10 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Assigned Role</label>
              <div className="relative">
                <Layers className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  {...register('userType')}
                  className="w-full h-11 pl-10 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs cursor-pointer"
                >
                  <option value="Inventor">Lead Inventor (Student / Researcher)</option>
                  <option value="Co-Inventor">Co-Inventor (Collaborator)</option>
                  <option value="Guide">Faculty Guide (Supervisor / Reviewer)</option>
                  <option value="PatentExpert">Patent Expert (Legal Counsel / Examiner)</option>
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
            className="w-full h-11 rounded-xl font-bold bg-blue-900 hover:bg-blue-950 text-white text-xs shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 mt-4 cursor-pointer"
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
                  <h3 className="text-sm font-extrabold text-slate-900">Google Registration</h3>
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
              Popup communication was blocked by your browser on localhost. Enter your Google Account email below to register directly.
            </div>

            <form onSubmit={handleDirectGoogleRegister} className="space-y-3 text-xs">
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
                  {isGoogleLoading ? 'Registering...' : 'Register with Google'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
