import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Mail, AtSign, Building, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useOutletContext<{ user: any }>() || {};

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-medium text-[#202124]">User Profile</h2>
        <p className="text-sm text-[#5f6368]">View and manage your Google Workspace account details</p>
      </div>

      <div className="p-8 rounded-2xl bg-white border border-[#dadce0] shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-[#f1f3f4] pb-6">
          <div className="w-16 h-16 rounded-full bg-[#1a73e8] flex items-center justify-center text-white text-2xl font-medium">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-xl font-medium text-[#202124]">{user?.fullName || 'User Profile'}</h3>
            <p className="text-sm text-[#1a73e8] font-medium">{user?.role || 'Inventor'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1">Username</label>
            <div className="flex items-center gap-2 text-[#202124] bg-[#f8f9fa] p-3 rounded-lg border border-[#dadce0] text-sm">
              <AtSign className="w-4 h-4 text-[#5f6368]" />
              <span>{user?.username || 'N/A'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1">Email Address</label>
            <div className="flex items-center gap-2 text-[#202124] bg-[#f8f9fa] p-3 rounded-lg border border-[#dadce0] text-sm">
              <Mail className="w-4 h-4 text-[#5f6368]" />
              <span>{user?.email || 'N/A'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1">Institution</label>
            <div className="flex items-center gap-2 text-[#202124] bg-[#f8f9fa] p-3 rounded-lg border border-[#dadce0] text-sm">
              <Building className="w-4 h-4 text-[#5f6368]" />
              <span>{user?.institution || 'Independent Researcher'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1">Role Permission</label>
            <div className="flex items-center gap-2 text-[#202124] bg-[#f8f9fa] p-3 rounded-lg border border-[#dadce0] text-sm">
              <ShieldCheck className="w-4 h-4 text-[#1a73e8]" />
              <span>{user?.role || 'Standard User'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
