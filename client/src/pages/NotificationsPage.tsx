import React, { useEffect, useState } from 'react';
import { Bell, Check, X, Clock, Mail } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Invitation {
  id: string;
  projectId: string;
  role: string;
  status: string;
  createdAt: string;
  project: {
    title: string;
    innovationIdea: string;
    technicalDomain: string;
  };
  sender: {
    fullName: string;
    username: string;
    institution: string | null;
  };
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationsPage: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const [invitesRes, notifiesRes] = await Promise.all([
        api.get('/collaboration/invitations'),
        api.get('/collaboration/notifications'),
      ]);
      setInvitations(invitesRes.data || []);
      setNotifications(notifiesRes.data || []);
    } catch (error) {
      console.error('Failed to load inbox data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const response = await api.post('/collaboration/respond', { invitationId, status });
      toast.success(response.data.message || `Invitation ${status.toLowerCase()}ed successfully.`);
      fetchInbox();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to respond to invitation.');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.put(`/collaboration/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4 font-sans animate-fade-in relative z-10">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Collaboration Inbox</h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">
          Accept project invitations and view recent activity updates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Pending Invitations List */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" /> Pending Invitations ({invitations.length})
            </h3>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">Loading inbox...</div>
            ) : invitations.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                No pending project invitations.
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invite) => {
                  const roleLabel = invite.role.toLowerCase().replace('_', ' ');
                  return (
                    <div
                      key={invite.id}
                      className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl flex flex-col justify-between gap-4 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 font-bold text-[9px] uppercase rounded">
                            Role: {roleLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {invite.project.technicalDomain}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {invite.project.title}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                          Invited by <strong className="text-slate-700">@{invite.sender.username}</strong> ({invite.sender.fullName}) 
                          {invite.sender.institution && ` from ${invite.sender.institution}`}.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100/60 justify-end">
                        <button
                          type="button"
                          onClick={() => handleRespond(invite.id, 'REJECTED')}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-extrabold shadow-2xs hover:border-rose-100 border border-transparent transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(invite.id, 'ACCEPTED')}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept Invite
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Activity Notifications List */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" /> Notifications Inbox
            </h3>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                No activity alerts.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                    className={`p-3.5 rounded-xl border transition-all text-xs font-medium cursor-pointer ${
                      n.isRead
                        ? 'bg-white border-slate-100 text-slate-500'
                        : 'bg-blue-50/40 border-blue-100/60 text-slate-800 font-semibold'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-extrabold text-slate-900 leading-tight">{n.title}</span>
                      {!n.isRead && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0" />}
                    </div>
                    <p className="mt-1 text-slate-500 leading-relaxed text-[11px]">{n.message}</p>
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                      <Clock className="w-3 h-3 text-slate-300" />
                      {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
