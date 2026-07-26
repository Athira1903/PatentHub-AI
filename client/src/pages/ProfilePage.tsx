import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Mail, AtSign, Building, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useOutletContext<{ user: any }>() || {};

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">User Profile</h2>
        <p className="text-sm text-slate-500">View and manage your account details</p>
      </div>

      <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{user?.fullName || 'User Profile'}</h3>
            <p className="text-sm text-blue-600 font-semibold">{user?.role || 'Inventor'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Username</label>
            <div className="flex items-center gap-2 text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm font-medium">
              <AtSign className="w-4 h-4 text-slate-400" />
              <span>{user?.username || 'N/A'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
            <div className="flex items-center gap-2 text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm font-medium">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user?.email || 'N/A'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Institution</label>
            <div className="flex items-center gap-2 text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm font-medium">
              <Building className="w-4 h-4 text-slate-400" />
              <span>{user?.institution || 'Independent Researcher'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role Permission</label>
            <div className="flex items-center gap-2 text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm font-medium">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>{user?.role || 'Standard User'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
