import React from 'react';
import { Bell } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Notifications</h2>
        <p className="text-sm text-slate-400">Updates regarding patent status and system alerts</p>
      </div>

      <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
        <Bell className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h3 className="text-lg font-semibold text-slate-300">All Caught Up</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          You have no unread notifications at this time.
        </p>
      </div>
    </div>
  );
};
