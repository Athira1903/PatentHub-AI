import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Mail,
  AtSign,
  Building,
  ShieldCheck,
  Phone,
  Calendar,
  Layers,
  Bookmark,
  Edit3,
  Camera,
  Check,
  X,
  User,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface UserContext {
  user?: {
    id: string;
    userId?: string;
    fullName: string;
    username: string;
    email: string;
    role: string;
    institution?: string;
    employeeOrStudentId?: string;
    profileCompleted?: boolean;
    profile?: {
      phone?: string;
      dob?: string;
      gender?: string;
      institution?: string;
      department?: string;
      designation?: string;
      organization?: string;
      researchDomain?: string;
      bio?: string;
      profileImage?: string;
    };
  };
}

export const ProfilePage: React.FC = () => {
  const outletContext = useOutletContext<UserContext>() || {};
  const [user, setUser] = useState<any>(outletContext.user || null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable form fields
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dob: '',
    gender: 'Male',
    institution: '',
    department: '',
    designation: '',
    organization: '',
    researchDomain: '',
    bio: '',
  });

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/profile');
      if (res.data?.user) {
        setUser(res.data.user);
        initForm(res.data.user);
      }
    } catch (err) {
      console.warn('Failed to load profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  const initForm = (u: any) => {
    setFormData({
      fullName: u.fullName || '',
      phone: u.phone || u.profile?.phone || '',
      dob: u.dob ? new Date(u.dob).toISOString().split('T')[0] : u.profile?.dob ? new Date(u.profile.dob).toISOString().split('T')[0] : '',
      gender: u.gender || u.profile?.gender || 'Male',
      institution: u.institution || u.profile?.institution || '',
      department: u.department || u.profile?.department || '',
      designation: u.designation || u.profile?.designation || '',
      organization: (typeof u.organization === 'object' ? u.organization?.name : u.organization) || (typeof u.profile?.organization === 'object' ? u.profile?.organization?.name : u.profile?.organization) || '',
      researchDomain: u.researchDomain || u.profile?.researchDomain || '',
      bio: u.bio || u.profile?.bio || '',
    });
    setPhotoPreview(u.profileImage || u.profile?.profileImage || null);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setPhotoPreview(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Upload photo if selected
      let uploadedImageUrl: string | undefined = undefined;
      if (selectedPhoto) {
        const photoData = new FormData();
        photoData.append('photo', selectedPhoto);
        try {
          const photoRes = await api.post('/profile/upload-photo', photoData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          uploadedImageUrl = photoRes.data.profileImage;
        } catch (photoErr) {
          console.warn('Photo upload warning:', photoErr);
        }
      }

      // 2. Update Profile data (only permitted fields, no role/security fields)
      const payload: any = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        institution: formData.institution.trim(),
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        organization: formData.organization.trim() || undefined,
        researchDomain: formData.researchDomain.trim(),
        bio: formData.bio.trim() || undefined,
      };

      if (formData.dob) {
        payload.dob = formData.dob;
      }
      if (uploadedImageUrl) {
        payload.profileImage = uploadedImageUrl;
      }

      await api.put('/profile/update', payload);

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      initForm(user);
    }
    setSelectedPhoto(null);
    setIsEditing(false);
  };

  const avatarUrl =
    photoPreview ||
    user?.profileImage ||
    user?.profile?.profileImage;

  const resolvedAvatar = avatarUrl
    ? avatarUrl.startsWith('/')
      ? 'http://localhost:5000' + avatarUrl
      : avatarUrl
    : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 animate-fade-in font-sans pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventor Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage your personal identity, academic background, and research domain.
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer w-fit"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save Changes</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs font-medium">
          Loading profile details...
        </div>
      ) : !user ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <User className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-900 text-base">Profile Incomplete</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Complete your profile to help collaborators understand your academic background.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            Create Profile Now
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Personal Information Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-5">
                {/* Profile Photo */}
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-blue-900 flex items-center justify-center text-white text-2xl font-black shadow-xs overflow-hidden shrink-0">
                    {resolvedAvatar ? (
                      <img
                        src={resolvedAvatar}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'I'
                    )}
                  </div>
                  {isEditing && (
                    <label
                      htmlFor="photoUpload"
                      className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white cursor-pointer opacity-90 hover:opacity-100 transition"
                      title="Change Photo"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] font-bold mt-1">Upload</span>
                      <input
                        type="file"
                        id="photoUpload"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {user?.fullName || 'Inventor Profile'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                      {user?.role || 'Inventor'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified Inventor Identity
                    </span>
                  </div>
                </div>
              </div>

              {user?.employeeOrStudentId && (
                <div className="px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Student / Scholar ID
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {user.employeeOrStudentId}
                  </span>
                </div>
              )}
            </div>

            {/* Personal Fields */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                Personal Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Full Legal Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      required
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-semibold">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{user?.fullName}</span>
                    </div>
                  )}
                </div>

                {/* Username (Readonly) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    System Username (Locked)
                  </label>
                  <div className="flex items-center gap-2.5 text-slate-600 bg-slate-100/70 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold">
                    <AtSign className="w-4 h-4 text-slate-400" />
                    <span>@{user?.username}</span>
                  </div>
                </div>

                {/* Email (Readonly) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email Address (Account Identifier)
                  </label>
                  <div className="flex items-center gap-2.5 text-slate-600 bg-slate-100/70 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{user?.email}</span>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mobile Contact
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-semibold">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{user?.phone || user?.profile?.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                {/* DOB & Gender */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-semibold">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        {user?.dob || user?.profile?.dob
                          ? new Date(user.dob || user.profile.dob).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'Not provided'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-semibold">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{user?.gender || user?.profile?.gender || 'Not specified'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Affiliation */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Academic Affiliation
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  University, college department, and academic credentials
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Institution */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  University / College / Institution
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    required
                  />
                ) : (
                  <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-semibold">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>{user?.institution || user?.profile?.institution || 'Independent Researcher'}</span>
                  </div>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Academic Department / Faculty
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    required
                  />
                ) : (
                  <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-semibold">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>{user?.department || user?.profile?.department || 'Not specified'}</span>
                  </div>
                )}
              </div>

              {/* Designation / Programme */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Designation / Academic Programme
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. B.Tech Student, Research Scholar"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    required
                  />
                ) : (
                  <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-semibold">
                    <Bookmark className="w-4 h-4 text-slate-400" />
                    <span>{user?.designation || user?.profile?.designation || 'Scholar'}</span>
                  </div>
                )}
              </div>

              {/* Organization */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Affiliated Lab / Organization
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. Innovation Cell / IoT Lab"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-semibold">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>
                      {(typeof user?.organization === 'object' ? user?.organization?.name : user?.organization) ||
                        (typeof user?.profile?.organization === 'object' ? user?.profile?.organization?.name : user?.profile?.organization) ||
                        'Campus Innovation Lab'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Research & Technical Expertise */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Research & Technical Domain
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Primary areas of patent interest, specialization, and technical summary
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Primary Research Domain
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.researchDomain}
                    onChange={(e) => setFormData({ ...formData, researchDomain: e.target.value })}
                    placeholder="e.g. Artificial Intelligence, Clean Energy, Biomedical Devices"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    required
                  />
                ) : (
                  <div className="flex items-center gap-2.5 text-blue-900 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 font-bold">
                    <Bookmark className="w-4 h-4 text-blue-600" />
                    <span>{user?.researchDomain || user?.profile?.researchDomain || 'Multidisciplinary Engineering'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Inventor Bio / Areas of Interest
                </label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Brief summary of research experience, technical skills, and prior innovations..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none leading-relaxed"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium">
                    {user?.bio || user?.profile?.bio || (
                      <span className="text-slate-400 italic">
                        No biographical summary provided yet. Click "Edit Profile" to describe your research focus and patent innovation goals.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
