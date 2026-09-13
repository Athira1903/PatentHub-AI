import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  CheckCheck,
  Folder,
  CheckSquare,
  ClipboardCheck,
  FileText,
  UserPlus,
  Info,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface ProjectRef {
  id: string;
  title: string;
  category?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  referenceId?: string | null;
  projectId?: string | null;
  project?: ProjectRef | null;
  metadata?: any;
  createdAt: string;
}

interface InvitationItem {
  id: string;
  projectId: string;
  role: string;
  status: string;
  createdAt: string;
  project: {
    id?: string;
    title: string;
    innovationIdea?: string;
    technicalDomain?: string;
  };
  sender: {
    fullName: string;
    username: string;
    institution?: string | null;
  };
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<
    'ALL' | 'UNREAD' | 'PROJECT' | 'TASK' | 'REVIEW' | 'DOCUMENT' | 'INVITATION' | 'SYSTEM'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notifsRes, invitesRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/collaboration/invitations'),
      ]);
      setNotifications(notifsRes.data || []);
      setInvitations(invitesRes.data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
      toast.error('Failed to load notifications feed');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.warn('Failed to mark read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleRespondInvitation = async (
    invitationId: string,
    status: 'ACCEPTED' | 'REJECTED',
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.post('/collaboration/respond', { invitationId, status });
      toast.success(res.data.message || `Invitation ${status.toLowerCase()}ed.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond to invitation.');
    }
  };

  // Helper to format date / relative time
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Navigation router on click
  const handleItemClick = async (item: {
    id: string;
    type: string;
    projectId?: string | null;
    referenceId?: string | null;
    isRead: boolean;
    isInvite?: boolean;
  }) => {
    if (!item.isRead && !item.isInvite) {
      await handleMarkAsRead(item.id);
    }

    const t = item.type.toUpperCase();
    if (t.includes('REVIEW')) {
      if (item.projectId) {
        navigate(`/dashboard/projects/${item.projectId}?tab=Reviews`);
      } else {
        navigate('/dashboard/reviews');
      }
    } else if (t.includes('TASK')) {
      navigate('/dashboard/tasks');
    } else if (t.includes('INVITATION') || item.isInvite) {
      if (item.projectId) {
        navigate(`/dashboard/projects/${item.projectId}`);
      } else {
        navigate('/dashboard/projects');
      }
    } else if (t.includes('DOCUMENT')) {
      if (item.projectId) {
        navigate(`/dashboard/projects/${item.projectId}?tab=Documents`);
      } else {
        navigate('/dashboard/projects');
      }
    } else if (item.projectId) {
      navigate(`/dashboard/projects/${item.projectId}`);
    }
  };

  // Consolidated feed items
  const feedItems = [
    // Real Invitations
    ...invitations.map((inv) => ({
      id: inv.id,
      feedId: `invite-${inv.id}`,
      type: 'INVITATION',
      title: 'Project Invitation',
      message: `${inv.sender?.fullName} invited you to join "${inv.project?.title}" as a ${inv.role.toLowerCase().replace('_', ' ')}.`,
      isRead: inv.status !== 'PENDING',
      projectId: inv.projectId || inv.project?.id,
      projectTitle: inv.project?.title,
      date: new Date(inv.createdAt),
      isInvite: true,
      rawInvite: inv,
    })),
    // Real Database Notifications
    ...notifications.map((n) => ({
      id: n.id,
      feedId: `notif-${n.id}`,
      type: n.type || 'SYSTEM',
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      projectId: n.projectId || n.project?.id || n.metadata?.projectId,
      projectTitle: n.project?.title || n.metadata?.projectTitle,
      date: new Date(n.createdAt),
      isInvite: false,
      rawNotif: n,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Filter feed items
  const filteredFeed = feedItems.filter((item) => {
    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchMsg = item.message.toLowerCase().includes(q);
      const matchProj = item.projectTitle?.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchProj) return false;
    }

    // 2. Category filter
    const t = item.type.toUpperCase();
    if (activeCategory === 'UNREAD') {
      return !item.isRead;
    }
    if (activeCategory === 'PROJECT') {
      return t === 'PROJECT' || t === 'WORKFLOW' || t === 'PATENT' || t === 'PROTOTYPE';
    }
    if (activeCategory === 'TASK') {
      return t === 'TASK';
    }
    if (activeCategory === 'REVIEW') {
      return t === 'REVIEW';
    }
    if (activeCategory === 'DOCUMENT') {
      return t === 'DOCUMENT';
    }
    if (activeCategory === 'INVITATION') {
      return t === 'INVITATION' || t === 'COLLABORATION_ACCEPTED' || t === 'COLLABORATION_DECLINED';
    }
    if (activeCategory === 'SYSTEM') {
      return t === 'SYSTEM' || t === 'GENERAL';
    }
    return true;
  });

  const unreadCount = feedItems.filter((i) => !i.isRead).length;

  // Icon & styling getter
  const getCategoryMeta = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('REVIEW')) {
      return {
        icon: ClipboardCheck,
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        badge: 'REVIEW',
        badgeColor: 'bg-amber-100 text-amber-800',
        actionLabel: 'View Review',
      };
    }
    if (t.includes('TASK')) {
      return {
        icon: CheckSquare,
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        badge: 'TASK',
        badgeColor: 'bg-blue-100 text-blue-800',
        actionLabel: 'View Task',
      };
    }
    if (t.includes('INVITATION')) {
      return {
        icon: UserPlus,
        color: 'text-purple-700 bg-purple-50 border-purple-200',
        badge: 'INVITATION',
        badgeColor: 'bg-purple-100 text-purple-800',
        actionLabel: 'View Project',
      };
    }
    if (t.includes('DOCUMENT')) {
      return {
        icon: FileText,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        badge: 'DOCUMENT',
        badgeColor: 'bg-emerald-100 text-emerald-800',
        actionLabel: 'View Document',
      };
    }
    if (t.includes('PROJECT') || t.includes('WORKFLOW') || t.includes('PATENT')) {
      return {
        icon: Folder,
        color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        badge: 'PROJECT',
        badgeColor: 'bg-indigo-100 text-indigo-800',
        actionLabel: 'View Project',
      };
    }
    return {
      icon: Info,
      color: 'text-slate-700 bg-slate-100 border-slate-200',
      badge: 'SYSTEM',
      badgeColor: 'bg-slate-100 text-slate-700',
      actionLabel: 'Details',
    };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 animate-fade-in font-sans pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Stay updated on your projects, tasks, invitations and reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-blue-600" />
              <span>Mark all as read</span>
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-xl transition cursor-pointer shadow-xs"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'ALL', label: 'All' },
              { id: 'UNREAD', label: `Unread (${unreadCount})` },
              { id: 'PROJECT', label: 'Projects' },
              { id: 'TASK', label: 'Tasks' },
              { id: 'REVIEW', label: 'Reviews' },
              { id: 'DOCUMENT', label: 'Documents' },
              { id: 'INVITATION', label: 'Invitations' },
              { id: 'SYSTEM', label: 'System' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 shadow-3xs"
          />
        </div>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs font-medium">
          Loading notifications...
        </div>
      ) : filteredFeed.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">You're all caught up.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            No notifications found in this category. We'll alert you whenever your projects, tasks, or reviews receive updates.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFeed.map((item) => {
            const meta = getCategoryMeta(item.type);
            const Icon = meta.icon;

            return (
              <div
                key={item.feedId}
                onClick={() => handleItemClick(item)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-3xs hover:border-blue-300 ${
                  item.isRead
                    ? 'bg-white border-slate-200/80 text-slate-600'
                    : 'bg-blue-50/40 border-blue-200 text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  {/* Category Icon */}
                  <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${meta.badgeColor}`}>
                        {meta.badge}
                      </span>

                      {item.projectTitle && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Folder className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-xs">{item.projectTitle}</span>
                        </span>
                      )}

                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                      )}
                    </div>

                    <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {item.message}
                    </p>

                    <span className="text-[10px] text-slate-400 font-semibold block pt-0.5">
                      {formatTime(item.date.toISOString())}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Invitation Accept/Decline */}
                  {item.isInvite && ((item as any).rawInvite as InvitationItem).status === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) =>
                          handleRespondInvitation((item as any).rawInvite.id, 'ACCEPTED', e)
                        }
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) =>
                          handleRespondInvitation((item as any).rawInvite.id, 'REJECTED', e)
                        }
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  ) : item.isInvite ? (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                      {((item as any).rawInvite as InvitationItem).status}
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleItemClick(item)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>{meta.actionLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {!item.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          title="Mark read"
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
