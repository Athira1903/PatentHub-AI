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
  Menu,
  ClipboardCheck,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import {
  normalizeUserRole,
  getRoleDisplayName,
  getPortalName,
  getWorkspaceTitle,
  getRoleInitials,
} from '../utils/roleUtils';

interface UserProfile {
  fullName: string;
  email: string;
  username: string;
  role: string | any;
  institution?: string;
  profileCompleted?: boolean;
  profile?: {
    profileImage?: string | null;
    researchDomain?: string | null;
    phone?: string | null;
  } | null;
}

export const DashboardLayout: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('patenthub_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setShowUserDropdown(false);
    setShowNotifDropdown(false);
  }, [location.pathname]);

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
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read', err);
      toast.error('Could not mark all as read');
    }
  };

  const handleRespondToInvite = async (invitationId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await api.post(`/collaboration/respond`, { invitationId, status });
      toast.success(status === 'ACCEPTED' ? 'Joined project team!' : 'Declined invitation');
      fetchNotifications();
      fetchUnreadCount();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond to invitation');
    }
  };

  // Dynamic fee calculation
  useEffect(() => {
    let baseFee = applicantType === 'individual' ? 1600 : 8000;
    const extraPages = Math.max(0, calcPages - 30);
    const extraClaims = Math.max(0, calcClaims - 10);
    const pageFeeRate = applicantType === 'individual' ? 160 : 800;
    const claimFeeRate = applicantType === 'individual' ? 320 : 1600;

    const total = baseFee + extraPages * pageFeeRate + extraClaims * claimFeeRate;
    setCalcResult(total);
  }, [applicantType, calcPages, calcClaims]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('patenthub_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await api.get('/auth/profile');
        const userData = res.data?.user || res.data;
        if (userData) {
          setUser(userData);
          localStorage.setItem('patenthub_user', JSON.stringify(userData));
          if (userData.profileCompleted === false && location.pathname !== '/complete-profile') {
            navigate('/complete-profile');
          }
        }
      } catch (err) {
        console.error('Failed to fetch user in DashboardLayout:', err);
      }
    };

    fetchUserData();
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('patenthub_token');
    localStorage.removeItem('patenthub_user');
    navigate('/login');
  };

  const normalizedRole = normalizeUserRole(user?.role);
  const isGuide = normalizedRole === 'GUIDE';
  const isPatentExpert = normalizedRole === 'PATENT_EXPERT';
  const isCoInventor = normalizedRole === 'CO_INVENTOR';
  const isAdmin = normalizedRole === 'ADMIN';
  const isOrgAdmin = normalizedRole === 'ORGANIZATION_ADMIN';

  const roleDisplay = getRoleDisplayName(user?.role);
  const portalName = getPortalName(user?.role);
  const workspaceTitle = getWorkspaceTitle(user?.role);

  // Navigation Items per role
  const navItems = isGuide
    ? [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Review Queue', path: '/dashboard/reviews', icon: ClipboardCheck },
        { label: 'Advisee Projects', path: '/dashboard/projects', icon: FolderKanban },
        { label: 'Research', path: '/dashboard/research', icon: BookOpen },
        { label: 'Documents', path: '/dashboard/documents', icon: FileText },
        { label: 'Policies', path: '/dashboard/policies', icon: Shield },
      ]
    : isPatentExpert
    ? [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Patent Reviews', path: '/dashboard/reviews', icon: ClipboardCheck },
        { label: 'Research', path: '/dashboard/research', icon: BookOpen },
        { label: 'Documents', path: '/dashboard/documents', icon: FileText },
        { label: 'Policies', path: '/dashboard/policies', icon: Shield },
      ]
    : isCoInventor
    ? [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'My Inventions', path: '/dashboard/projects', icon: Folder },
        { label: 'Research', path: '/dashboard/research', icon: BookOpen },
        { label: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
        { label: 'Documents', path: '/dashboard/documents', icon: FileText },
        { label: 'Policies', path: '/dashboard/policies', icon: Shield },
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'My Inventions', path: '/dashboard/projects', icon: Folder },
        { label: 'Research', path: '/dashboard/research', icon: BookOpen },
        { label: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
        { label: 'Documents', path: '/dashboard/documents', icon: FileText },
        { label: 'Policies', path: '/dashboard/policies', icon: Shield },
      ];

  // Helper to determine breadcrumb from route
  const getBreadcrumbs = () => {
    const p = location.pathname;
    if (p === '/admin') return { parent: 'Platform', current: 'Admin Dashboard' };
    if (p === '/org-admin') return { parent: 'Platform', current: 'Organization Dashboard' };
    if (p === '/dashboard')
      return {
        parent: 'Workspace',
        current: workspaceTitle,
      };
    if (p.includes('/dashboard/projects/')) return { parent: 'Projects', current: 'Project Command Center' };
    if (p.includes('/dashboard/projects'))
      return { parent: 'Workspace', current: isCoInventor || isPatentExpert || isGuide ? 'My Projects' : 'My Inventions' };
    if (p.includes('/dashboard/tasks')) return { parent: 'Workspace', current: 'Tasks' };
    if (p.includes('/dashboard/reviews'))
      return { parent: 'Workspace', current: isGuide || isPatentExpert ? 'Review Queue' : 'Project Reviews' };
    if (p.includes('/dashboard/notifications')) return { parent: 'Workspace', current: 'Notifications' };
    if (p.includes('/dashboard/create-project')) return { parent: 'Projects', current: 'Create Invention' };
    if (p.includes('/dashboard/profile')) return { parent: 'Identity', current: 'Profile' };
    if (p.includes('/dashboard/settings')) return { parent: 'Configuration', current: 'Settings' };
    if (p.includes('/dashboard/documents')) return { parent: 'Workspace', current: 'Documents' };
    if (p.includes('/dashboard/research')) return { parent: 'Workspace', current: 'Prior Art Search' };
    if (p.includes('/dashboard/policies')) return { parent: 'Workspace', current: 'Assigned Policies' };
    if (p.includes('/dashboard/billing')) return { parent: 'Workspace', current: 'Billing & Subscriptions' };
    return { parent: 'Workspace', current: 'Overview' };
  };

  const breadcrumbs = getBreadcrumbs();

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const [itemBaseUrl, itemQuery] = item.path.split('?');
        const isBaseActive =
          itemBaseUrl === '/dashboard'
            ? location.pathname === '/dashboard'
            : location.pathname === itemBaseUrl ||
              (itemBaseUrl !== '/dashboard' && location.pathname.startsWith(itemBaseUrl + '/'));

        const isQueryActive = itemQuery
          ? new URLSearchParams(location.search).get('type') === new URLSearchParams(itemQuery).get('type')
          : !new URLSearchParams(location.search).get('type');

        const isActive = isBaseActive && (itemQuery ? isQueryActive : true);

        return (
          <Link
            key={item.label}
            to={item.path}
            onClick={onItemClick}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] border-r-2 border-[#1A73E8] dark:border-[#8AB4F8] shadow-3xs'
                : 'text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-[#1A73E8] dark:text-[#8AB4F8]' : 'text-[#88928E] dark:text-[#64748B]'
                }`}
              />
              {(!collapsed || onItemClick) && <span>{item.label}</span>}
            </div>
            {(!collapsed || onItemClick) && (item as any).badge && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#1A73E8] dark:text-[#8AB4F8] text-[10px] font-extrabold">
                {(item as any).badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="h-screen bg-[#F8F9FA] dark:bg-[#0B0F17] text-[#202124] dark:text-[#F8FAFC] flex flex-col overflow-hidden font-sans antialiased transition-colors duration-200">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar */}
        <aside
          className={`${
            collapsed ? 'w-20' : 'w-64'
          } bg-white dark:bg-[#131B2B] border-r border-[#E2E8F0] dark:border-[#23314B] flex flex-col h-screen sticky top-0 shrink-0 z-40 transition-all duration-200 shadow-[1px_0_3px_rgba(0,0,0,0.02)] hidden md:flex`}
        >
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#E2E8F0] dark:border-[#23314B]">
            <Link to={isAdmin ? '/admin' : isOrgAdmin ? '/org-admin' : '/dashboard'} className="flex items-center gap-3 overflow-hidden group">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#1C263B] border border-[#DADCE0] dark:border-[#23314B] flex items-center justify-center shadow-xs shrink-0 group-hover:shadow-md transition-all">
                <div className="grid grid-cols-2 gap-1 p-0.5">
                  <span className="size-1 rounded-full bg-[#4285F4]" />
                  <span className="size-1 rounded-full bg-[#EA4335]" />
                  <span className="size-1 rounded-full bg-[#FBBC05]" />
                  <span className="size-1 rounded-full bg-[#34A853]" />
                </div>
              </div>
              {!collapsed && (
                <div>
                  <span className="font-extrabold text-sm tracking-tight text-[#202124] dark:text-[#F8FAFC] block leading-none">
                    PatentHub<span className="gemini-gradient-text font-black">AI</span>
                  </span>
                  <span className="text-[9px] text-[#1A73E8] dark:text-[#8AB4F8] font-bold uppercase tracking-wider block mt-1">
                    {portalName}
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          {renderNavLinks()}

          {/* User info card at bottom */}
          {!collapsed && (
            <div className="p-3 mx-3 mb-2 bg-[#F1F3F4] dark:bg-[#1C263B] border border-[#E2E8F0] dark:border-[#23314B] rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#1A73E8] dark:bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {getRoleInitials(user?.fullName, user?.role)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#202124] dark:text-[#F8FAFC] truncate leading-tight">
                    {user?.fullName || roleDisplay}
                  </h4>
                  <p className="text-[10px] text-[#5F6368] dark:text-[#94A3B8] font-semibold truncate leading-tight">
                    {roleDisplay}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 text-[#88928E] dark:text-[#64748B] hover:text-[#EA4335] dark:hover:text-[#F28B82] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Collapse Sidebar Button */}
          <div className="p-3 border-t border-[#E2E8F0] dark:border-[#23314B]">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] rounded-xl transition cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse sidebar</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Mobile Slide-Over Drawer Backdrop */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div
              className="w-72 bg-white dark:bg-[#131B2B] h-full flex flex-col border-r border-[#E2E8F0] dark:border-[#23314B] shadow-xl animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-16 flex items-center justify-between px-5 border-b border-[#E2E8F0] dark:border-[#23314B]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#1C263B] border border-[#DADCE0] dark:border-[#23314B] flex items-center justify-center shadow-xs">
                    <div className="grid grid-cols-2 gap-1 p-0.5">
                      <span className="size-1 rounded-full bg-[#4285F4]" />
                      <span className="size-1 rounded-full bg-[#EA4335]" />
                      <span className="size-1 rounded-full bg-[#FBBC05]" />
                      <span className="size-1 rounded-full bg-[#34A853]" />
                    </div>
                  </div>
                  <div>
                    <span className="font-extrabold text-sm tracking-tight text-[#202124] dark:text-[#F8FAFC]">
                      PatentHub<span className="gemini-gradient-text font-black">AI</span>
                    </span>
                    <span className="text-[9px] text-[#1A73E8] dark:text-[#8AB4F8] font-bold block uppercase tracking-wider">
                      {portalName}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#5F6368] dark:text-[#94A3B8] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderNavLinks(() => setMobileDrawerOpen(false))}

              <div className="p-4 border-t border-[#E2E8F0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#202124] dark:text-[#F8FAFC]">{user?.fullName || roleDisplay}</p>
                  <p className="text-[10px] text-[#5F6368] dark:text-[#94A3B8]">{user?.email || roleDisplay}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-[#EA4335] dark:text-[#F28B82] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header Navbar */}
          <header className="h-16 bg-white/95 dark:bg-[#131B2B]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#23314B] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors duration-200">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="p-2 rounded-xl text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] transition md:hidden cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs font-medium text-[#5F6368] dark:text-[#94A3B8]">
                <span className="text-[#88928E] dark:text-[#64748B]">{breadcrumbs.parent}</span>
                <span className="text-[#CBD5E1] dark:text-[#334466]">/</span>
                <span className="text-[#202124] dark:text-[#F8FAFC] font-bold">{breadcrumbs.current}</span>
              </div>
            </div>

            {/* Center Universal Search Bar */}
            <div className="flex-1 max-w-md mx-6 hidden sm:block">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#88928E] dark:text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search inventions, claims, forms, prior-art..."
                  className="w-full pl-10 pr-12 py-2 bg-[#F1F3F4] dark:bg-[#0B0F17] hover:bg-white dark:hover:bg-[#131B2B] focus:bg-white dark:focus:bg-[#131B2B] border border-[#E2E8F0] dark:border-[#23314B] focus:border-[#1A73E8] dark:focus:border-[#8AB4F8] focus:ring-2 focus:ring-[#1A73E8]/10 rounded-xl text-xs text-[#202124] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] transition-all font-medium"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#E2E8F0] dark:bg-[#1C263B] text-[10px] text-[#5F6368] dark:text-[#94A3B8] font-semibold font-mono">
                  <Command className="w-2.5 h-2.5" /> K
                </div>
              </div>
            </div>

            {/* Right Profile, Notifications, Theme & Help Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Light / Dark Mode Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#23314B] transition cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle light or dark theme"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-[#FBBC04]" />
                ) : (
                  <Moon className="w-4 h-4 text-[#5F6368]" />
                )}
              </button>

              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  onClick={handleToggleNotifDropdown}
                  className="relative p-2 rounded-xl text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#23314B] transition cursor-pointer"
                  title="Notifications"
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#EA4335] text-white rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#131B2B]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#131B2B] border border-[#E2E8F0] dark:border-[#23314B] rounded-2xl shadow-xl z-50 animate-fade-in overflow-hidden">
                    <div className="p-3.5 border-b border-[#E2E8F0] dark:border-[#23314B] flex items-center justify-between bg-[#F8F9FA] dark:bg-[#0B0F17]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#202124] dark:text-[#F8FAFC]">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-[#1A73E8] dark:text-[#8AB4F8] text-[10px] font-extrabold rounded-md">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-bold text-[#1A73E8] dark:text-[#8AB4F8] hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-[#23314B]">
                      {loadingNotifs ? (
                        <div className="p-6 text-center text-xs text-[#88928E] dark:text-[#64748B]">Loading notifications...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#88928E] dark:text-[#64748B] space-y-1">
                          <Bell className="w-5 h-5 mx-auto text-[#CBD5E1] dark:text-[#334466]" />
                          <p className="font-bold text-[#5F6368] dark:text-[#94A3B8]">No new notifications</p>
                          <p className="text-[10px]">You're all caught up!</p>
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((n) => {
                          const isInvite = n.type === 'INVITATION' && (n.metadata?.invitationId || n.referenceId);
                          const inviteId = n.metadata?.invitationId || n.referenceId;
                          return (
                            <div
                              key={n.id}
                              className={`p-3 space-y-1.5 text-xs transition ${
                                n.isRead ? 'bg-white dark:bg-[#131B2B] text-[#5F6368] dark:text-[#94A3B8]' : 'bg-blue-50/40 dark:bg-blue-950/20 text-[#202124] dark:text-[#F8FAFC] font-medium'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-[#202124] dark:text-[#F8FAFC] text-xs">{n.title}</span>
                                <span className="text-[10px] text-[#88928E] dark:text-[#64748B] shrink-0">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#5F6368] dark:text-[#94A3B8] leading-snug">{n.message}</p>

                              {isInvite && !n.isRead && (
                                <div className="pt-1 flex items-center gap-2">
                                  <button
                                    onClick={() => handleRespondToInvite(inviteId, 'ACCEPTED')}
                                    className="px-3 py-1 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-lg text-[10px] font-bold transition cursor-pointer shadow-3xs"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRespondToInvite(inviteId, 'REJECTED')}
                                    className="px-3 py-1 bg-white dark:bg-[#1C263B] hover:bg-[#F1F3F4] dark:hover:bg-[#23314B] text-[#202124] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#334466] rounded-lg text-[10px] font-bold transition cursor-pointer shadow-3xs"
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

                    <div className="p-2.5 border-t border-[#E2E8F0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17] text-center">
                      <Link
                        to="/dashboard/notifications"
                        onClick={() => setShowNotifDropdown(false)}
                        className="text-xs font-bold text-[#1A73E8] dark:text-[#8AB4F8] hover:underline"
                      >
                        View all notifications →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Help & IPO Knowledge Base trigger */}
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#23314B] transition cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-[#88928E] dark:text-[#64748B]" />
                <span className="hidden sm:inline">Help</span>
              </button>

              {/* User Avatar & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#23314B] transition cursor-pointer"
                  aria-label="User account menu"
                >
                  <div className="w-7 h-7 rounded-full bg-[#1A73E8] dark:bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : getRoleInitials(undefined, user?.role).charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-[#202124] dark:text-[#F8FAFC] hidden sm:inline max-w-[120px] truncate">
                    {user?.fullName || roleDisplay}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#88928E] dark:text-[#64748B] hidden sm:inline" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#131B2B] border border-[#E2E8F0] dark:border-[#23314B] rounded-xl shadow-lg py-1 z-50 animate-fade-in text-xs">
                    <div className="px-4 py-2.5 border-b border-[#E2E8F0] dark:border-[#23314B] bg-[#F8F9FA] dark:bg-[#0B0F17]">
                      <p className="font-bold text-[#202124] dark:text-[#F8FAFC] truncate">{user?.fullName || 'User Profile'}</p>
                      <p className="text-[10px] text-[#5F6368] dark:text-[#94A3B8] truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-[#1A73E8] dark:text-[#8AB4F8] text-[9px] font-extrabold uppercase">
                        {roleDisplay}
                      </span>
                    </div>
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-[#202124] dark:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-[#88928E] dark:text-[#64748B]" />
                      Profile
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-[#202124] dark:text-[#F8FAFC] hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#88928E] dark:text-[#64748B]" />
                      Settings
                    </Link>
                    <div className="border-t border-[#E2E8F0] dark:border-[#23314B] my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-[#EA4335] dark:text-[#F28B82] hover:bg-red-50 dark:hover:bg-red-950/30 text-left cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Outlet Scroll Area with Crisp Background */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8F9FA] dark:bg-[#0B0F17] transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
              <Outlet context={{ user }} />
            </div>
          </main>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#131B2B] border border-[#E2E8F0] dark:border-[#23314B] rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-6 max-h-[90vh] flex flex-col text-[#202124] dark:text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#23314B] pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8]">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#202124] dark:text-[#F8FAFC]">PatentHub AI Knowledge Base</h3>
                  <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] font-medium">Statutory guidance, fee estimations, and workflow assistance</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#F1F3F4] dark:hover:bg-[#1C263B] text-[#88928E] dark:text-[#64748B] hover:text-[#202124] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-[#E2E8F0] dark:border-[#23314B] gap-6 shrink-0 text-xs font-bold">
              <button
                onClick={() => setHelpTab('faq')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  helpTab === 'faq'
                    ? 'border-[#1A73E8] dark:border-[#8AB4F8] text-[#1A73E8] dark:text-[#8AB4F8]'
                    : 'border-transparent text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Statutory Patent FAQ</span>
              </button>
              <button
                onClick={() => setHelpTab('fees')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  helpTab === 'fees'
                    ? 'border-[#1A73E8] dark:border-[#8AB4F8] text-[#1A73E8] dark:text-[#8AB4F8]'
                    : 'border-transparent text-[#5F6368] dark:text-[#94A3B8] hover:text-[#202124] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Official IPO Fee Calculator</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              {helpTab === 'faq' ? (
                <div className="space-y-3">
                  <div className="p-4 bg-[#F8F9FA] dark:bg-[#0B0F17] border border-[#E2E8F0] dark:border-[#23314B] rounded-xl space-y-1">
                    <h4 className="font-bold text-[#202124] dark:text-[#F8FAFC]">What are the mandatory Indian Patent Office (IPO) Forms?</h4>
                    <p className="text-[#5F6368] dark:text-[#94A3B8] leading-relaxed">
                      Every standard complete patent application in India mandates <strong>Form 1</strong> (Application for Grant), <strong>Form 2</strong> (Provisional or Complete Specification), <strong>Form 3</strong> (Foreign Application Undertaking), <strong>Form 5</strong> (Declaration of Inventorship), and optionally <strong>Form 26</strong> (Power of Attorney/Authorisation).
                    </p>
                  </div>
                  <div className="p-4 bg-[#F8F9FA] dark:bg-[#0B0F17] border border-[#E2E8F0] dark:border-[#23314B] rounded-xl space-y-1">
                    <h4 className="font-bold text-[#202124] dark:text-[#F8FAFC]">How does PatentHub AI evaluate Claims and FTO?</h4>
                    <p className="text-[#5F6368] dark:text-[#94A3B8] leading-relaxed">
                      PatentHub AI parses claims into discrete technical limitations and performs preliminary technical comparison against prior-art citations. Note that AI-generated drafting assistance is preliminary research and does not constitute formal legal counsel.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-[#202124] dark:text-[#F8FAFC] mb-1">Applicant Classification</label>
                      <select
                        value={applicantType}
                        onChange={(e: any) => setApplicantType(e.target.value)}
                        className="w-full bg-[#F8F9FA] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334466] rounded-xl p-2 font-medium text-[#202124] dark:text-[#F8FAFC] text-xs focus:border-[#1A73E8] focus:outline-none"
                      >
                        <option value="individual">Natural Person / Startup / Small Entity</option>
                        <option value="large">Other than Small Entity (Large Enterprise)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#202124] dark:text-[#F8FAFC] mb-1">Specification Pages</label>
                      <input
                        type="number"
                        min="1"
                        value={calcPages}
                        onChange={(e) => setCalcPages(parseInt(e.target.value) || 30)}
                        className="w-full bg-[#F8F9FA] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334466] rounded-xl p-2 font-medium text-[#202124] dark:text-[#F8FAFC] text-xs focus:border-[#1A73E8] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#202124] dark:text-[#F8FAFC] mb-1">Number of Claims</label>
                      <input
                        type="number"
                        min="1"
                        value={calcClaims}
                        onChange={(e) => setCalcClaims(parseInt(e.target.value) || 10)}
                        className="w-full bg-[#F8F9FA] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334466] rounded-xl p-2 font-medium text-[#202124] dark:text-[#F8FAFC] text-xs focus:border-[#1A73E8] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">Total Statutory Filing Fee:</span>
                    <span className="text-xl font-black text-emerald-800 dark:text-emerald-300 font-mono">₹{calcResult.toLocaleString()}</span>
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

export default DashboardLayout;
