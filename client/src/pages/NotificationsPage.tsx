import React, { useEffect, useState } from 'react';
import { Bell, Clock, Mail, CheckSquare, Search } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'MENTIONS' | 'TASKS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Consolidate both invites and notifications into a single chronological feed
  const feedItems = [
    ...invitations.map((invite) => ({
      feedId: `invite-${invite.id}`,
      type: 'INVITATION',
      date: new Date(invite.createdAt),
      isRead: invite.status !== 'PENDING',
      raw: invite,
    })),
    ...notifications.map((n) => ({
      feedId: `notif-${n.id}`,
      type: n.type,
      date: new Date(n.createdAt),
      isRead: n.isRead,
      raw: n,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Filter items based on activeTab
  const filteredFeed = feedItems.filter((item) => {
    // 1. Search Query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (item.type === 'INVITATION') {
        const inv = item.raw as Invitation;
        if (
          !inv.project.title.toLowerCase().includes(query) &&
          !inv.sender.fullName.toLowerCase().includes(query) &&
          !inv.sender.username.toLowerCase().includes(query)
        ) {
          return false;
        }
      } else {
        const notif = item.raw as NotificationItem;
        if (!notif.title.toLowerCase().includes(query) && !notif.message.toLowerCase().includes(query)) {
          return false;
        }
      }
    }

    // 2. Category Tab filter
    if (activeTab === 'UNREAD') {
      return !item.isRead;
    }
    if (activeTab === 'MENTIONS') {
      return item.type === 'MENTION' || (item.type !== 'INVITATION' && (item.raw as NotificationItem).message.toLowerCase().includes('mentioned'));
    }
    if (activeTab === 'TASKS') {
      return item.type === 'TASK' || (item.type !== 'INVITATION' && (item.raw as NotificationItem).message.toLowerCase().includes('task'));
    }
    return true;
  });

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/collaboration/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Accept project workspace invitations and audit active system alerts.
          </p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5 text-indigo-600" /> Mark All as Read
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        {/* Navigation Tabs and Search bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'UNREAD', 'MENTIONS', 'TASKS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'ALL'
                  ? 'All Alerts'
                  : tab === 'UNREAD'
                  ? 'Unread'
                  : tab === 'MENTIONS'
                  ? 'Mentions'
                  : 'Tasks'}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>

        {/* Dynamic Inbox List Feed */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold">Loading inbox feed...</div>
        ) : filteredFeed.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold space-y-2">
            <Bell className="w-10 h-10 mx-auto text-slate-300" />
            <p>No notifications found matching this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeed.map((item) => {
              if (item.type === 'INVITATION') {
                const invite = item.raw as Invitation;
                const roleLabel = invite.role.toLowerCase().replace('_', ' ');
                return (
                  <div
                    key={item.feedId}
                    className="p-5 border border-slate-200 bg-slate-50/30 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-400/30 transition-colors shadow-3xs"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-150 text-[9px] font-bold uppercase tracking-wider">
                          <Mail className="w-3 h-3" /> Project Invitation
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• {invite.project.technicalDomain}</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        Join Workspace: "{invite.project.title}"
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        You have been invited by <strong className="text-slate-700">@{invite.sender.username}</strong> ({invite.sender.fullName}) 
                        to collaborate as a <strong className="text-slate-750">{roleLabel}</strong>.
                      </p>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold pt-1">
                        <Clock className="w-3.5 h-3.5" /> {item.date.toLocaleDateString()}
                      </div>
                    </div>

                    {invite.status === 'PENDING' ? (
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRespond(invite.id, 'REJECTED')}
                          className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-650 hover:text-rose-700 rounded-xl text-xs font-bold border border-slate-200 hover:border-rose-200 shadow-3xs transition-all cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(invite.id, 'ACCEPTED')}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          Accept
                        </button>
                      </div>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-450 border border-slate-200 rounded-xl text-xs font-bold">
                        {invite.status}
                      </span>
                    )}
                  </div>
                );
              } else {
                const notif = item.raw as NotificationItem;
                const isTask = notif.type === 'TASK' || notif.message.toLowerCase().includes('task');
                return (
                  <div
                    key={item.feedId}
                    className={`p-4 border rounded-2xl flex justify-between items-start gap-4 transition-all shadow-3xs ${
                      notif.isRead
                        ? 'bg-white border-slate-200 text-slate-500'
                        : 'bg-indigo-50/20 border-indigo-100/70 text-slate-800'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isTask ? (
                          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Bell className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className={`font-extrabold text-xs text-slate-900 ${notif.isRead ? '' : 'font-bold text-slate-950'}`}>
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{notif.message}</p>
                        <div className="text-[9px] text-slate-400 flex items-center gap-1 font-bold mt-2">
                          <Clock className="w-3 h-3" /> {item.date.toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="px-2.5 py-1 text-[9px] font-bold border border-indigo-200 hover:border-indigo-500 bg-white text-indigo-700 hover:bg-indigo-50 rounded-lg shrink-0 transition-colors cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
};
