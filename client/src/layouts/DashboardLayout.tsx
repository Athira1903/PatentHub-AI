import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
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
  Search,
  Plus,
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
      {/* Sleek Gradient Accent Border */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 sticky top-0 z-50"></div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            collapsed ? 'w-20' : 'w-64'
          } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-40 md:relative`}
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <Link to="/dashboard" className="flex items-center gap-2.5 font-bold text-slate-900 overflow-hidden">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20 shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
              </div>
              {!collapsed && (
                <span className="font-bold text-lg text-slate-900">
                  PatentHub <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">AI</span>
                </span>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* New Project Action Button */}
          <div className="p-4">
            <Link
              to="/dashboard/create-project"
              className={`flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all font-bold text-sm ${
                collapsed ? 'p-3' : 'px-4 py-3'
              }`}
            >
              <Plus className="w-5 h-5 shrink-0" />
              {!collapsed && <span>New Project</span>}
            </Link>
          </div>

          {/* Sidebar Links */}
          <nav className="flex-1 py-1 pr-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-r-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-bold border-r-4 border-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
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
              className="p-2 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patent claims, projects, specifications..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 hover:bg-white border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-full text-xs text-slate-900 transition-all font-medium"
                />
              </div>
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
    </div>
  );
};
