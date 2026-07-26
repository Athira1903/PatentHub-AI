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
    <div className="min-h-screen bg-[#f8f9fa] text-[#202124] flex flex-col overflow-hidden">
      {/* Google 4-Color Top Stripe */}
      <div className="h-1 w-full flex sticky top-0 z-50">
        <div className="h-full w-1/4 bg-[#4285F4]"></div>
        <div className="h-full w-1/4 bg-[#EA4335]"></div>
        <div className="h-full w-1/4 bg-[#FBBC05]"></div>
        <div className="h-full w-1/4 bg-[#34A853]"></div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            collapsed ? 'w-20' : 'w-64'
          } bg-white border-r border-[#dadce0] transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-40 md:relative`}
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#dadce0]">
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-[#202124] overflow-hidden">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#f8f9fa] border border-[#dadce0] shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#4285F4]"></span>
                <span className="w-2 h-2 rounded-full bg-[#EA4335]"></span>
                <span className="w-2 h-2 rounded-full bg-[#FBBC05]"></span>
                <span className="w-2 h-2 rounded-full bg-[#34A853]"></span>
              </div>
              {!collapsed && (
                <span className="font-medium text-base">
                  <span className="text-[#4285F4]">P</span>
                  <span className="text-[#EA4335]">a</span>
                  <span className="text-[#FBBC05]">t</span>
                  <span className="text-[#34A853]">e</span>
                  <span className="text-[#4285F4]">n</span>
                  <span className="text-[#EA4335]">t</span>
                  <span className="text-[#202124] ml-1">Hub</span>
                </span>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
            >
              <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Google Drive "+ New" FAB Button */}
          <div className="p-4">
            <Link
              to="/dashboard/create-project"
              className={`flex items-center justify-center gap-3 bg-white hover:bg-[#f8f9fa] border border-[#dadce0] text-[#3c4043] hover:text-[#1a73e8] rounded-2xl shadow-md hover:shadow-lg transition-all ${
                collapsed ? 'p-3' : 'px-5 py-3.5'
              }`}
            >
              {/* Google 4-Color Plus Icon */}
              <div className="flex items-center justify-center w-6 h-6">
                <Plus className="w-6 h-6 text-[#1a73e8]" />
              </div>
              {!collapsed && <span className="font-medium text-sm text-[#3c4043]">New Project</span>}
            </Link>
          </div>

          {/* Sidebar Links (Google Workspace Active Pill Style) */}
          <nav className="flex-1 py-1 pr-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-r-full font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-[#e8f0fe] text-[#1a73e8] font-medium'
                      : 'text-[#3c4043] hover:bg-[#f1f3f4]'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#1a73e8]' : 'text-[#5f6368]'}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Footer */}
          <div className="p-3 border-t border-[#dadce0] flex items-center justify-between">
            {!collapsed && user && (
              <div className="overflow-hidden pr-2">
                <p className="text-sm font-medium text-[#202124] truncate">{user.fullName}</p>
                <p className="text-xs text-[#1a73e8] truncate font-normal">{user.role}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-2 rounded-full text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="h-16 bg-white border-b border-[#dadce0] px-6 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368]" />
                <input
                  type="text"
                  placeholder="Search patent claims, projects, specifications..."
                  className="w-full pl-10 pr-4 py-2 bg-[#f1f3f4] hover:bg-white border border-transparent hover:border-[#dadce0] focus:bg-white focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] rounded-full text-xs text-[#202124] transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs px-3 py-1 rounded-full bg-[#e8f0fe] border border-[#c2e7ff] text-[#0b57d0] font-medium">
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
