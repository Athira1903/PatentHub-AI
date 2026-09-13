import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Folder,
  FolderKanban,
  CheckSquare,
  Settings,
  Search,
  Command,
  HelpCircle,
  X,
  Calculator,
  BookOpen,
  ChevronDown,
  LogOut,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Bell,
  Lightbulb,
  ClipboardCheck,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface UserProfile {
  fullName: string;
  email: string;
  username: string;
  role: string;
  institution?: string;
  profileCompleted?: boolean;
  profile?: {
    profileImage?: string | null;
    researchDomain?: string | null;
    phone?: string | null;
  } | null;
}

export const DashboardLayout: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Help Modal & Fee Calculator state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpTab, setHelpTab] = useState<'faq' | 'fees'>('faq');
  const [applicantType, setApplicantType] = useState<'individual' | 'large'>('individual');
  const [calcPages, setCalcPages] = useState<number>(30);
  const [calcClaims, setCalcClaims] = useState<number>(10);
  const [calcResult, setCalcResult] = useState<number>(1600);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count || 0);
    } catch {
      // silent
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch header notifications', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [location.pathname]);

  const handleToggleNotifDropdown = () => {
    if (!showNotifDropdown) {
      fetchNotifications();
      fetchUnreadCount();
    }
    setShowNotifDropdown(!showNotifDropdown);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleRespondToInvite = async (invitationId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const res = await api.post('/collaboration/respond', { invitationId, status });
      toast.success(res.data.message || `Invitation ${status.toLowerCase()}!`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond to invitation');
    }
  };

  useEffect(() => {
    let base = applicantType === 'individual' ? 1600 : 8000;
    let extraPageFee = applicantType === 'individual' ? 160 : 800;
    let extraClaimFee = applicantType === 'individual' ? 320 : 1600;

    let extraPages = Math.max(0, calcPages - 30);
    let extraClaims = Math.max(0, calcClaims - 10);

    let total = base + (extraPages * extraPageFee) + (extraClaims * extraClaimFee);
    setCalcResult(total);
  }, [applicantType, calcPages, calcClaims]);

  useEffect(() => {
    if (user) return;
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        const userData = response.data.user;
        setUser(userData);
        if (userData.profileCompleted === false) {
          navigate('/complete-profile');
        }
      } catch (error) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('patenthub_token');
        navigate('/login');
      }
    };
    fetchProfile();
  }, [navigate, user]);

  const handleLogout = () => {
    localStorage.removeItem('patenthub_token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isAdmin = user?.role === 'Admin' || user?.role === 'Administrator';
  const isCoInventor = user?.role === 'CoInventor' || user?.role === 'CO_INVENTOR' || user?.role === 'Co-Inventor';
  const isPatentExpert = user?.role === 'PatentExpert' || user?.role === 'Patent Expert' || user?.role === 'PATENT_EXPERT';
  const isGuide = user?.role === 'Guide' || user?.role === 'GUIDE';

  const navItems = isGuide
    ? [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'My Projects', path: '/dashboard/projects?type=owned', icon: Folder },
      { label: 'Supervised Projects', path: '/dashboard/projects?type=supervised', icon: FolderKanban },
      { label: 'Review Queue', path: '/dashboard/reviews', icon: CheckSquare, badge: '5' },
      { label: 'My Tasks', path: '/dashboard/tasks', icon: CheckSquare },
      { label: 'Notifications', path: '/dashboard/notifications', icon: Bell },
      { label: 'Profile', path: '/dashboard/profile', icon: User },
      { label: 'Settings', path: '/dashboard/settings', icon: Settings },
    ]
    : isPatentExpert
      ? [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'My Projects', path: '/dashboard/projects', icon: Folder },
        { label: 'Review Queue', path: '/dashboard/reviews', icon: CheckSquare, badge: '3' },
        { label: 'Notifications', path: '/dashboard/notifications', icon: Bell },
        { label: 'Profile', path: '/dashboard/profile', icon: User },
        { label: 'Settings', path: '/dashboard/settings', icon: Settings },
      ]
      : isCoInventor
        ? [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'My Projects', path: '/dashboard/projects', icon: Folder },
          { label: 'My Tasks', path: '/dashboard/tasks', icon: CheckSquare },
          { label: 'Reviews', path: '/dashboard/reviews', icon: ClipboardCheck },
          { label: 'Notifications', path: '/dashboard/notifications', icon: Bell },
          { label: 'Profile', path: '/dashboard/profile', icon: User },
          { label: 'Settings', path: '/dashboard/settings', icon: Settings },
        ]
        : [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'My Inventions', path: '/dashboard/projects', icon: Folder },
          { label: 'My Tasks', path: '/dashboard/tasks', icon: CheckSquare },
          { label: 'Reviews', path: '/dashboard/reviews', icon: ClipboardCheck },
          { label: 'Notifications', path: '/dashboard/notifications', icon: Bell },
          { label: 'Profile', path: '/dashboard/profile', icon: User },
          { label: 'Settings', path: '/dashboard/settings', icon: Settings },
          ...(isAdmin ? [{ label: 'Admin Governance', path: '/admin', icon: Shield }] : []),
        ];

  const intelligenceItems: any[] = [];

  const documentItems: any[] = [];

  const supervisionItems: any[] = [];

  const reportItems: any[] = [];

  const collaborationItems: any[] = [];

  const settingsItems: any[] = [];

  // Helper to determine breadcrumb from route
  const getBreadcrumbs = () => {
    const p = location.pathname;
    if (p === '/admin') return { parent: 'Platform', current: 'Admin Dashboard' };
    if (p === '/dashboard') return { parent: 'Workspace', current: isGuide ? 'GUIDE WORKSPACE' : isPatentExpert ? 'PATENT EXPERT WORKSPACE' : isCoInventor ? 'Co-Inventor Workspace' : 'Inventor Dashboard' };
    if (p.includes('/dashboard/projects/')) return { parent: 'Projects', current: 'Project Overview' };
    if (p.includes('/dashboard/projects')) return { parent: 'Workspace', current: isCoInventor || isPatentExpert || isGuide ? 'My Projects' : 'My Inventions' };
    if (p.includes('/dashboard/tasks')) return { parent: 'Workspace', current: 'Tasks' };
    if (p.includes('/dashboard/reviews')) return { parent: 'Workspace', current: isGuide || isPatentExpert ? 'Review Queue' : 'Project Reviews' };
    if (p.includes('/dashboard/notifications')) return { parent: 'Workspace', current: 'Notifications' };
    if (p.includes('/dashboard/create-project')) return { parent: 'Projects', current: 'Create Invention' };
    if (p.includes('/dashboard/profile')) return { parent: 'Identity', current: 'Inventor Profile' };
    if (p.includes('/dashboard/settings')) return { parent: 'Configuration', current: 'Account Settings' };
    return { parent: 'Workspace', current: 'Overview' };
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="h-screen bg-[#F8FAFC] text-slate-900 flex flex-col overflow-hidden font-sans antialiased">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`${collapsed ? 'w-20' : 'w-64'
            } bg-white border-r border-slate-200/90 flex flex-col h-screen sticky top-0 shrink-0 z-40 transition-all duration-300 shadow-[1px_0_4px_rgba(0,0,0,0.02)] hidden md:flex`}
        >
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-3 overflow-hidden group">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Lightbulb className="w-4 h-4 fill-white" />
              </div>
              {!collapsed && (
                <div>
                  <span className="font-black text-sm tracking-tight text-slate-950 block leading-none">
                    PatentHub-AI
                  </span>
                  <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider block mt-0.5">
                    {isGuide ? 'GUIDE WORKSPACE' : isPatentExpert ? 'PATENT EXPERT WORKSPACE' : isCoInventor ? 'Co-Inventor Workspace' : `${user?.role || 'Inventor'} Workspace`}
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const [itemBaseUrl, itemQuery] = item.path.split('?');
              const isBaseActive =
                itemBaseUrl === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname === itemBaseUrl || (itemBaseUrl !== '/dashboard' && location.pathname.startsWith(itemBaseUrl + '/'));
              
              const isQueryActive = itemQuery 
                ? new URLSearchParams(location.search).get('type') === new URLSearchParams(itemQuery).get('type')
                : !new URLSearchParams(location.search).get('type');
              
              const isActive = isBaseActive && (itemQuery ? isQueryActive : true);

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${isActive
                      ? isCoInventor || isPatentExpert || isGuide
                        ? 'bg-[#E6F4EA] text-[#064E3B] font-extrabold shadow-3xs'
                        : 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? (isCoInventor || isPatentExpert || isGuide ? 'text-[#064E3B]' : 'text-white') : 'text-slate-400'
                      }`} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && (item as any).badge && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                      {(item as any).badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Supervision Group for Guide */}
            {supervisionItems.length > 0 && !collapsed && (
              <div className="pt-3 pb-1">
                <span className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Supervision
                </span>
                {supervisionItems.map((sItem) => {
                  const Icon = sItem.icon;
                  return (
                    <Link
                      key={sItem.label}
                      to={sItem.path}
                      className="flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-all"
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{sItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Reports Group for Guide */}
            {reportItems.length > 0 && !collapsed && (
              <div className="pt-3 pb-1">
                <span className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Reports
                </span>
                {reportItems.map((rItem) => {
                  const Icon = rItem.icon;
                  return (
                    <Link
                      key={rItem.label}
                      to={rItem.path}
                      className="flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-all"
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{rItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Patent Intelligence Group for Patent Expert */}
            {intelligenceItems.length > 0 && !collapsed && (
              <div className="pt-3 pb-1">
                <span className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Patent Intelligence
                </span>
                {intelligenceItems.map((iItem) => {
                  const Icon = iItem.icon;
                  return (
                    <Link
                      key={iItem.label}
                      to={iItem.path}
                      className="flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-all"
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{iItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Documents Group for Patent Expert */}
            {documentItems.length > 0 && !collapsed && (
              <div className="pt-3 pb-1">
                <span className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Documents
                </span>
                {documentItems.map((dItem) => {
                  const Icon = dItem.icon;
                  return (
                    <Link
                      key={dItem.label}
                      to={dItem.path}
                      className="flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-all"
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{dItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Collaboration Group */}
            {collaborationItems.length > 0 && !collapsed && (
              <div className="pt-3 pb-1">
                <span className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Collaboration
                </span>
                {collaborationItems.map((cItem) => {
                  const Icon = cItem.icon;
                  return (
                    <Link
                      key={cItem.label}
                      to={cItem.path}
                      className="flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-all"
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{cItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* System / Settings Group */}
            {settingsItems.length > 0 && !collapsed && (
              <div className="pt-3 pb-1">
                <span className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  {isPatentExpert || isGuide ? 'System' : 'Settings'}
                </span>
                {settingsItems.map((sItem) => {
                  const Icon = sItem.icon;
                  return (
                    <Link
                      key={sItem.label}
                      to={sItem.path}
                      className="flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-all"
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{sItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Bottom User Info & Logout Card */}
          {!collapsed && (
            <div className="p-3 mx-3 mb-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {user?.fullName?.slice(0, 2).toUpperCase() || 'IN'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {user?.fullName || 'Inventor'}
                  </h4>
                  <p className="text-[10px] text-blue-600 font-semibold truncate leading-tight">
                    {user?.role || 'Inventor'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Collapse Sidebar Button */}
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header Navbar */}
          <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="text-slate-400 font-normal">{breadcrumbs.parent}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-800 font-bold">{breadcrumbs.current}</span>
            </div>

            {/* Center Universal Search Bar */}
            <div className="flex-1 max-w-md mx-8 hidden sm:block">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects, documents, tasks..."
                  className="w-full pl-10 pr-12 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 transition-all font-medium"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/70 text-[10px] text-slate-500 font-semibold font-mono">
                  <Command className="w-2.5 h-2.5" /> K
                </div>
              </div>
            </div>

            {/* Right Profile, Notifications & Help Actions */}
            <div className="flex items-center gap-2.5">
              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  onClick={handleToggleNotifDropdown}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 animate-fade-in overflow-hidden">
                    <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-md">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {loadingNotifs ? (
                        <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                          <Bell className="w-5 h-5 mx-auto text-slate-300" />
                          <p className="font-bold text-slate-600">No new notifications</p>
                          <p className="text-[10px]">You're all caught up!</p>
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((n) => {
                          const isInvite = n.type === 'INVITATION' && (n.metadata?.invitationId || n.referenceId);
                          const inviteId = n.metadata?.invitationId || n.referenceId;
                          return (
                            <div
                              key={n.id}
                              className={`p-3 space-y-2 text-xs transition ${n.isRead ? 'bg-white text-slate-600' : 'bg-blue-50/40 text-slate-900 font-medium'
                                }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-slate-900 text-xs">{n.title}</span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>

                              {/* Inline Accept / Decline for Collaboration Request */}
                              {isInvite && !n.isRead && (
                                <div className="pt-1 flex items-center gap-2">
                                  <button
                                    onClick={() => handleRespondToInvite(inviteId, 'ACCEPTED')}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer shadow-3xs"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRespondToInvite(inviteId, 'REJECTED')}
                                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition cursor-pointer shadow-3xs"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 text-center">
                      <Link
                        to="/dashboard/notifications"
                        onClick={() => setShowNotifDropdown(false)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View all notifications →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Help</span>
              </button>

              {/* User Avatar & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                    {user?.fullName || 'User'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-fade-in text-xs">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{user?.fullName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Profile
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Outlet Scroll Area */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <Outlet context={{ user }} />
          </main>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">PatentHub-AI Knowledge Base</h3>
                  <p className="text-xs text-slate-500 font-medium">Statutory guidance, fee estimations, and workflow assistance</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-100 gap-6 shrink-0 text-xs font-bold">
              <button
                onClick={() => setHelpTab('faq')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${helpTab === 'faq'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Statutory Patent FAQ</span>
              </button>
              <button
                onClick={() => setHelpTab('fees')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${helpTab === 'fees'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Official IPO Fee Calculator</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              {helpTab === 'faq' ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <h4 className="font-extrabold text-slate-900 mb-1">What are the mandatory Indian Patent Office (IPO) Forms?</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Every standard complete patent application in India mandates <strong>Form 1</strong> (Application for Grant), <strong>Form 2</strong> (Provisional or Complete Specification), <strong>Form 3</strong> (Foreign Application Undertaking), <strong>Form 5</strong> (Declaration of Inventorship), and optionally <strong>Form 26</strong> (Power of Attorney/Authorisation).
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <h4 className="font-extrabold text-slate-900 mb-1">How does PatentHub-AI evaluate Claims and FTO?</h4>
                    <p className="text-slate-600 leading-relaxed">
                      PatentHub-AI parses claims into discrete technical limitations and performs preliminary technical comparison against prior-art citations. Note that AI-generated drafting assistance is preliminary research and does not constitute a formal legal opinion.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Applicant Classification</label>
                      <select
                        value={applicantType}
                        onChange={(e: any) => setApplicantType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-900"
                      >
                        <option value="individual">Natural Person / Startup / Small Entity</option>
                        <option value="large">Other than Small Entity (Large Enterprise)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Specification Pages</label>
                      <input
                        type="number"
                        min="1"
                        value={calcPages}
                        onChange={(e) => setCalcPages(parseInt(e.target.value) || 30)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Number of Claims</label>
                      <input
                        type="number"
                        min="1"
                        value={calcClaims}
                        onChange={(e) => setCalcClaims(parseInt(e.target.value) || 10)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <span className="font-bold text-emerald-900">Total Statutory Filing Fee:</span>
                    <span className="text-xl font-extrabold text-emerald-700">₹{calcResult.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
