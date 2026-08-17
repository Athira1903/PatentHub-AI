import React, { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'INVITATIONS' | 'TASKS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const [invitesRes, notifiesRes] = await Promise.all([
        api.get('/collaboration/invitations'),
        api.get('/notifications'),
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
      await api.put(`/notifications/${notificationId}/read`);
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
    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (item.type === 'INVITATION') {
        const inv = item.raw as Invitation;
        const matchTitle = inv.project?.title?.toLowerCase().includes(q);
        const matchSender = inv.sender?.fullName?.toLowerCase().includes(q);
        if (!matchTitle && !matchSender) return false;
      } else {
        const notif = item.raw as NotificationItem;
        const matchTitle = notif.title?.toLowerCase().includes(q);
        const matchMsg = notif.message?.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg) return false;
      }
    }

    // 2. Category Tab filter
    if (activeTab === 'UNREAD') {
      return !item.isRead;
    }
    if (activeTab === 'INVITATIONS') {
      return item.type === 'INVITATION' || item.type === 'COLLABORATION_ACCEPTED' || item.type === 'COLLABORATION_DECLINED';
    }
    if (activeTab === 'TASKS') {
      return item.type === 'TASK' || (item.type !== 'INVITATION' && (item.raw as NotificationItem).message?.toLowerCase().includes('task'));
    }
    return true;
  });

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2 animate-fade-in font-sans pb-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Notifications & Alerts</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Accept project workspace invitations and review queue alerts
          </p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5 text-blue-600" />
          <span>Mark all as read</span>
        </button>
      </div>

      <div className="app-card p-6 space-y-6">
        {/* Navigation Tabs and Search bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'UNREAD', 'INVITATIONS', 'TASKS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL'
                  ? 'All Alerts'
                  : tab === 'UNREAD'
                  ? 'Unread'
                  : tab === 'INVITATIONS'
                  ? 'Invitations'
                  : 'Tasks'}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600"
            />
          </div>
        </div>

        {/* Dynamic Inbox List Feed */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">Loading notifications feed...</div>
        ) : filteredFeed.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300" />
            <p>No notifications found matching this filter.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredFeed.map((item) => {
              if (item.type === 'INVITATION') {
                const invite = item.raw as Invitation;
                const roleLabel = invite.role.toLowerCase().replace('_', ' ');
                return (
                  <div
                    key={item.feedId}
                    className="p-5 border border-slate-200/80 bg-slate-50/40 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition shadow-3xs"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                          Invitation
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.date.toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {invite.sender?.fullName} invited you to join{' '}
                        <strong className="text-blue-600">{invite.project?.title}</strong> as a {roleLabel}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2">
                        {invite.project?.innovationIdea}
                      </p>
                    </div>

                    {invite.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRespond(invite.id, 'ACCEPTED')}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespond(invite.id, 'REJECTED')}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          invite.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {invite.status}
                      </span>
                    )}
                  </div>
                );
              }

              // Normal Notification
              const notif = item.raw as NotificationItem;
              return (
                <div
                  key={item.feedId}
                  className={`p-4 border rounded-2xl flex items-start justify-between gap-4 transition shadow-3xs ${
                    notif.isRead
                      ? 'bg-white border-slate-200/80 text-slate-600'
                      : 'bg-blue-50/30 border-blue-200/80 text-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-extrabold text-slate-900">{notif.title}</h4>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 font-medium block pt-0.5">
                        {item.date.toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-blue-700 rounded-lg text-[10px] font-bold shrink-0 shadow-3xs cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
