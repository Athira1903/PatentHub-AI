import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  FileText,
  Cpu,
  Users,
  CheckSquare,
  FileCode,
  Sparkles,
  BarChart2,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface UserProfile {
  fullName: string;
  email: string;
  username: string;
  role: string;
  institution?: string;
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
        setUser(response.data.user);
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
    { label: 'Create Project', path: '/dashboard/create-project', icon: PlusCircle },
    { label: 'Documents', path: '/dashboard/documents', icon: FileText },
    { label: 'Prototype', path: '/dashboard/prototype', icon: Cpu },
    { label: 'Team', path: '/dashboard/team', icon: Users },
    { label: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
    { label: 'Patent Forms', path: '/dashboard/patent-forms', icon: FileCode },
    { label: 'AI Workspace', path: '/dashboard/ai-workspace', icon: Sparkles },
    { label: 'Reports', path: '/dashboard/reports', icon: BarChart2 },
    { label: 'Notifications', path: '/dashboard/notifications', icon: Bell },
    { label: 'Profile', path: '/dashboard/profile', icon: User },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-40 md:relative`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-slate-900 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            {!collapsed && <span className="text-lg">PatentHub <span className="text-blue-600">AI</span></span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-200 flex items-center justify-between">
          {!collapsed && user && (
            <div className="overflow-hidden pr-2">
              <p className="text-sm font-bold text-slate-900 truncate">{user.fullName}</p>
              <p className="text-xs text-blue-600 truncate font-semibold">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900">
              {navItems.find((n) => n.path === location.pathname)?.label || 'Patent Workspace'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
              Role: {user?.role || 'User'}
            </span>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
};
