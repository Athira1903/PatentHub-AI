import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Mail, AtSign, Building, ShieldCheck, Phone, Calendar, Layers, Bookmark } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useOutletContext<{ user: any }>() || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 animate-fade-in font-sans pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Account & Profile</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          View and manage your PatentHub workspace account credentials and details
        </p>
      </div>

      <div className="app-card p-6 sm:p-8 space-y-8">
        {/* User Card Header */}
        <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-900 flex items-center justify-center text-white text-2xl font-bold shadow-xs overflow-hidden shrink-0">
            {user?.profile?.profileImage ? (
              <img
                src={
                  user.profile.profileImage.startsWith('/')
                    ? 'http://localhost:5000' + user.profile.profileImage
                    : user.profile.profileImage
                }
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{user?.fullName || 'User Profile'}</h3>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                {user?.role || 'Inventor'}
              </span>
              {user?.profileCompleted && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                  Verified Workspace Account
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Account Details */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Account Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
              <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs font-semibold">
                <AtSign className="w-4 h-4 text-slate-400" />
                <span>{user?.username || 'user'}</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs font-semibold">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{user?.email || 'user@institution.edu'}</span>
              </div>
            </div>

            {user?.profile?.phone && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Number</label>
                <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs font-semibold">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{user.profile.phone}</span>
                </div>
              </div>
            )}

            {user?.profile?.dob && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date of Birth / Gender</label>
                <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs font-semibold">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    {new Date(user.profile.dob).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    ({user.profile.gender})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Professional & Research Focus */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Professional & Research Focus</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Institution & Organization</label>
              <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs font-semibold">
                <Building className="w-4 h-4 text-slate-400" />
                <span>
                  {user?.institution || 'Independent Researcher'}
                  {user?.profile?.organization ? ` (${user.profile.organization})` : ''}
                </span>
              </div>
            </div>

            {user?.profile?.department && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Department & Designation</label>
                <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs font-semibold">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>
                    {user.profile.designation} — {user.profile.department}
                  </span>
                </div>
              </div>
            )}

            {user?.profile?.researchDomain && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Primary Research Domain</label>
                <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs font-semibold">
                  <Bookmark className="w-4 h-4 text-blue-600" />
                  <span>{user.profile.researchDomain}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role Permission</label>
              <div className="flex items-center gap-2.5 text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{user?.role || 'Standard User'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
