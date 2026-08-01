import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User as UserIcon,
  Phone,
  Calendar,
  Building,
  FileText,
  Camera,
  Trash2,
  CheckCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';

const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'Full name must be at least 3 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string().trim().email('Invalid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number (exactly 10 digits starting with 6-9)'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  institution: z.string().trim().min(1, 'Institution name is required'),
  department: z.string().trim().min(1, 'Department is required'),
  designation: z.string().trim().min(1, 'Designation is required'),
  organization: z.string().trim().optional(),
  role: z.enum(['Inventor', 'Co-Inventor', 'Guide', 'Patent Expert', 'Administrator']),
  researchDomain: z.string().trim().min(1, 'Research domain is required'),
  bio: z.string().trim().max(300, 'Biography cannot exceed 300 characters').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const RESEARCH_DOMAINS = [
  'Artificial Intelligence',
  'IoT',
  'Mechanical',
  'Civil',
  'Electrical',
  'Biotechnology',
  'Robotics',
  'Computer Science',
  'Agriculture',
  'Healthcare',
];

const ROLES = [
  { value: 'Inventor', label: 'Inventor' },
  { value: 'Co-Inventor', label: 'Co-Inventor' },
  { value: 'Guide', label: 'Faculty Guide' },
  { value: 'Patent Expert', label: 'Patent Expert' },
  { value: 'Administrator', label: 'Administrator' },
];

export const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('patenthub_token');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [userProfileCompleted, setUserProfileCompleted] = useState<boolean | null>(null);

  // Username selection states
  const [needUsernameSelection, setNeedUsernameSelection] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  const [savingUsername, setSavingUsername] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  });

  // Fetch current user details to pre-fill
  useEffect(() => {
    if (!token) return;

    const fetchInitialData = async () => {
      try {
        const response = await api.get('/auth/profile');
        const userData = response.data.user;

        if (userData.username.startsWith('temp_')) {
          setNeedUsernameSelection(true);
        }

        // Auto-save draft loading if exists
        const savedDraft = localStorage.getItem('patenthub_profile_draft');
        let initialValues = {
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          dob: userData.dob ? new Date(userData.dob).toISOString().split('T')[0] : '',
          gender: userData.gender || '',
          institution: userData.institution || '',
          department: userData.department || '',
          designation: userData.designation || '',
          organization: userData.organization || '',
          role: (userData.role || 'Inventor') as any,
          researchDomain: userData.researchDomain || '',
          bio: userData.bio || '',
        };

        if (userData.profileImage) {
          setPhotoPreview(userData.profileImage);
        }

        if (savedDraft) {
          try {
            const parsedDraft = JSON.parse(savedDraft);
            initialValues = { ...initialValues, ...parsedDraft, email: userData.email }; // Lock email
          } catch (e) {
            console.error('Failed to parse profile draft');
          }
        }

        reset(initialValues);
        setUserProfileCompleted(userData.profileCompleted);
      } catch (error) {
        console.error('Failed to fetch initial profile data:', error);
        toast.error('Failed to fetch user session. Please log in again.');
        localStorage.removeItem('patenthub_token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [token, reset, navigate]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = usernameInput.trim();
    if (!clean) {
      setUsernameError('Username is required.');
      return;
    }
    if (clean.length < 4 || clean.length > 30) {
      setUsernameError('Username must be between 4 and 30 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setUsernameError('Username can only contain letters, numbers, and underscores.');
      return;
    }
    setSavingUsername(true);
    try {
      const res = await api.put('/users/username', { username: clean });
      localStorage.setItem('patenthub_token', res.data.token);
      toast.success('Username set successfully!');
      setNeedUsernameSelection(false);
    } catch (err: any) {
      setUsernameError(err.response?.data?.message || 'Failed to update username. Try another.');
    } finally {
      setSavingUsername(false);
    }
  };

  // Handle auto-saving drafts locally on input change
  const handleInputChange = (field: keyof ProfileFormValues, value: string) => {
    const savedDraft = localStorage.getItem('patenthub_profile_draft');
    let draftObj = {};
    if (savedDraft) {
      try {
        draftObj = JSON.parse(savedDraft);
      } catch (e) {}
    }
    const updatedDraft = { ...draftObj, [field]: value };
    localStorage.setItem('patenthub_profile_draft', JSON.stringify(updatedDraft));
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userProfileCompleted === true) {
    return <Navigate to="/dashboard" replace />;
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files (JPG, PNG, JPEG) are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size cannot exceed 5MB.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setSaving(true);
    try {
      let profileImageUrl: string | null = null;

      // 1. Upload photo if selected
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        try {
          const uploadRes = await api.post('/profile/upload-photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          profileImageUrl = uploadRes.data.profileImage;
        } catch (uploadError: any) {
          toast.error(uploadError.response?.data?.message || 'Photo upload failed. Proceeding without photo.');
        }
      }

      // 2. Submit profile details
      await api.post('/profile/create', {
        ...data,
        profileImage: profileImageUrl,
      });

      toast.success('Profile completed successfully!');
      localStorage.removeItem('patenthub_profile_draft'); // Clean draft
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete profile onboarding.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 py-20 font-sans">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Loading your profile onboarding...</p>
      </div>
    );
  }

  if (needUsernameSelection) {
    return (
      <div className="flex-1 bg-slate-50 py-12 px-4 flex items-center justify-center font-sans">
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500"></div>
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 font-heading text-slate-900 text-lg font-extrabold lowercase mb-1">
              patenthub<span className="text-cyan-500 font-extrabold">.</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">Choose your Username</h1>
            <p className="text-xs text-slate-500 font-medium">Please set a unique username for project invitations and team collaborations.</p>
          </div>
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold font-mono">@</span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setUsernameError('');
                  }}
                  placeholder="e.g. athira_biju"
                  className="w-full h-11 pl-8 pr-3 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 font-semibold transition-all shadow-2xs"
                />
              </div>
              {usernameError && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{usernameError}</p>}
            </div>
            <button
              type="submit"
              disabled={savingUsername}
              className="w-full h-11 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {savingUsername ? 'Saving Username...' : 'Set Username'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className="w-full max-w-3xl bg-white border border-slate-200/80 rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Decorative Top Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-500" />

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 font-heading text-slate-900 text-lg font-extrabold lowercase mb-2">
            patenthub<span className="text-cyan-500 font-extrabold">.</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Complete Your Profile</h1>
          <p className="text-xs text-slate-500 font-medium">Provide your workspace information to unlock the Indian Patent Workspace.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Profile Picture Upload Section */}
          <div className="flex flex-col items-center justify-center border-b border-slate-100 pb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative shadow-inner">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <label className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-2xl shadow-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all">
                <Camera className="w-4 h-4" />
                <input type="file" onChange={handlePhotoChange} className="hidden" accept="image/jpeg,image/png,image/jpg" />
              </label>
            </div>
            {photoPreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Image
              </button>
            )}
            <p className="text-[10px] text-slate-400 font-semibold mt-2.5">JPG, JPEG or PNG. Maximum size of 5MB.</p>
          </div>

          {/* Section 1: Personal Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Personal Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    {...register('fullName')}
                    onChange={(e) => {
                      register('fullName').onChange(e);
                      handleInputChange('fullName', e.target.value);
                    }}
                    placeholder="Enter your full name"
                    className="w-full h-11 pl-10 pr-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-semibold transition-all"
                  />
                </div>
                {errors.fullName && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address (Read Only)</label>
                <input
                  type="email"
                  {...register('email')}
                  readOnly
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold focus:outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    {...register('phone')}
                    onChange={(e) => {
                      register('phone').onChange(e);
                      handleInputChange('phone', e.target.value);
                    }}
                    placeholder="10-digit mobile number"
                    className="w-full h-11 pl-10 pr-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-semibold transition-all"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.phone.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      {...register('dob')}
                      onChange={(e) => {
                        register('dob').onChange(e);
                        handleInputChange('dob', e.target.value);
                      }}
                      className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-semibold transition-all"
                    />
                  </div>
                  {errors.dob && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.dob.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Gender</label>
                  <select
                    {...register('gender')}
                    onChange={(e) => {
                      register('gender').onChange(e);
                      handleInputChange('gender', e.target.value);
                    }}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-semibold transition-all cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.gender.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Academic & Professional Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Academic & Professional Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Institution Name</label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    {...register('institution')}
                    onChange={(e) => {
                      register('institution').onChange(e);
                      handleInputChange('institution', e.target.value);
                    }}
                    placeholder="University/College/Center"
                    className="w-full h-11 pl-10 pr-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-semibold transition-all"
                  />
                </div>
                {errors.institution && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.institution.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Department</label>
                <input
                  type="text"
                  {...register('department')}
                  onChange={(e) => {
                    register('department').onChange(e);
                    handleInputChange('department', e.target.value);
                  }}
                  placeholder="e.g. Computer Science & Eng."
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-semibold transition-all"
                />
                {errors.department && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.department.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Designation</label>
                <input
                  type="text"
                  {...register('designation')}
                  onChange={(e) => {
                    register('designation').onChange(e);
                    handleInputChange('designation', e.target.value);
                  }}
                  placeholder="e.g. Student / Professor"
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-semibold transition-all"
                />
                {errors.designation && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.designation.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Organization (Optional)</label>
                <input
                  type="text"
                  {...register('organization')}
                  onChange={(e) => {
                    register('organization').onChange(e);
                    handleInputChange('organization', e.target.value);
                  }}
                  placeholder="e.g. Research Lab / Startup"
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-semibold transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Patent Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Patent Workspace Focus</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Role Selection</label>
                <select
                  {...register('role')}
                  onChange={(e) => {
                    register('role').onChange(e);
                    handleInputChange('role', e.target.value);
                  }}
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-semibold transition-all cursor-pointer"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {errors.role && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.role.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Research Domain</label>
                <select
                  {...register('researchDomain')}
                  onChange={(e) => {
                    register('researchDomain').onChange(e);
                    handleInputChange('researchDomain', e.target.value);
                  }}
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-semibold transition-all cursor-pointer"
                >
                  <option value="">Select Domain</option>
                  {RESEARCH_DOMAINS.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
                {errors.researchDomain && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.researchDomain.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 4: Additional Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Additional Details</h3>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Short Biography</label>
                <span className="text-[10px] text-slate-400 font-semibold">Maximum 300 characters</span>
              </div>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <textarea
                  rows={4}
                  {...register('bio')}
                  onChange={(e) => {
                    register('bio').onChange(e);
                    handleInputChange('bio', e.target.value);
                  }}
                  placeholder="Describe your research background, ongoing lab projects, or patents filed..."
                  className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-semibold transition-all resize-none"
                />
              </div>
              {errors.bio && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.bio.message}</p>}
            </div>
          </div>

          {/* Alert Message for Incomplete Details */}
          {!isValid && (
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl text-amber-800 text-xs font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>Please fill out all required fields marked in red before saving your onboarding profile details.</p>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={saving || !isValid}
            className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Profile...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Save and Onboard Profile
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};