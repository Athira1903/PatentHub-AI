import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  Search,
  Plus,
  ShieldCheck,
  Command,
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
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('patenthub_token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Projects', path: '/dashboard/projects', icon: FolderKanban },
    { label: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
    { label: 'Notifications', path: '/dashboard/notifications', icon: Bell },
    { label: 'Profile', path: '/dashboard/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden font-sans">
      {/* Dynamic Sleek Gradient Accent Header Border */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 sticky top-0 z-50 animate-pulse-glow"></div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            collapsed ? 'w-20' : 'w-64'
          } bg-white/90 backdrop-blur-xl border-r border-slate-200/80 transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-40 md:relative shadow-sm`}
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
            <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
                    PatentHub <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">AI</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600">Workspace</span>
                </div>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* New Project Action Button */}
          <div className="p-3">
            <Link
              to="/dashboard/create-project"
              className={`flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all font-bold text-xs uppercase tracking-wider ${
                collapsed ? 'p-3' : 'px-4 py-2.5'
              }`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              {!collapsed && <span>New Project</span>}
            </Link>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="flex-1 py-2 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-bold'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            {!collapsed && user && (
              <div className="overflow-hidden pr-2 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm overflow-hidden">
                  {user.profile?.profileImage ? (
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
                    user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">{user.fullName}</p>
                  <p className="text-[10px] text-blue-600 truncate font-semibold uppercase tracking-wider">{user.role}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patents, claims, prioritize research..."
                  className="w-full pl-10 pr-12 py-2 bg-slate-100/80 hover:bg-white border border-slate-200/60 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-full text-xs text-slate-900 placeholder:text-slate-400 transition-all font-medium"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/70 text-[10px] text-slate-500 font-semibold">
                  <Command className="w-2.5 h-2.5" /> K
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user?.profile?.researchDomain && (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider">
                  <span>Domain: {user.profile.researchDomain}</span>
                </div>
              )}
              {user?.institution && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                  <span>{user.institution}</span>
                </div>
              )}
              {user?.profileCompleted && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>100% Onboarded</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{user?.role || 'User'}</span>
              </div>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-6 overflow-y-auto animate-fade-in">
            <Outlet context={{ user }} />
          </main>
        </div>
      </div>
    </div>
  );
};
