import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bell,
  User,
  LogOut,
  Search,
  Plus,
  ShieldCheck,
  Command,
  HelpCircle,
  X,
  Calculator,
  BookOpen,
  Layers,
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
  const navigate = useNavigate();
  const location = useLocation();

  // Help Modal & Fee Calculator state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpTab, setHelpTab] = useState<'faq' | 'fees'>('faq');
  const [applicantType, setApplicantType] = useState<'individual' | 'large'>('individual');
  const [calcPages, setCalcPages] = useState<number>(30);
  const [calcClaims, setCalcClaims] = useState<number>(10);
  const [calcResult, setCalcResult] = useState<number>(1600);

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
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden font-sans">
      {/* Dynamic Sleek Gradient Accent Header Border */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 sticky top-0 z-50 animate-pulse-glow"></div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className="w-64 bg-white/90 backdrop-blur-xl border-r border-slate-200/80 flex flex-col h-screen sticky top-0 shrink-0 z-40 shadow-sm hidden md:flex"
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
            <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
                  PatentHub <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">AI</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600">Workspace</span>
              </div>
            </Link>
          </div>

          {/* New Project Action Button */}
          <div className="p-3">
            <Link
              to="/dashboard/create-project"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all font-bold text-xs uppercase tracking-wider px-4 py-2.5"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Project</span>
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-bold'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-450'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            {user && (
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
              className="p-2 rounded-xl text-slate-450 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
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
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer mr-2 shadow-2xs hover:shadow-xs"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help Hub</span>
              </button>

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

      {/* Global Help Hub Modal Overlay */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-650" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">PatentHub AI Help & Resources Hub</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Quick guide to Indian patent filing parameters</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 px-5 pt-1.5 gap-2 bg-slate-50">
              <button
                onClick={() => setHelpTab('faq')}
                className={`pb-2.5 px-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  helpTab === 'faq'
                    ? 'border-indigo-600 text-indigo-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
              >
                Filing Guide & FAQs
              </button>
              <button
                onClick={() => setHelpTab('fees')}
                className={`pb-2.5 px-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  helpTab === 'fees'
                    ? 'border-indigo-600 text-indigo-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
              >
                Indian IPO Fee Calculator
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs text-slate-650">
              {helpTab === 'faq' ? (
                <div className="space-y-4 font-semibold">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-indigo-600" /> What are the primary forms required?
                    </h4>
                    <p className="leading-relaxed pl-5">
                      Filing in India requires:
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-[11px] font-medium text-slate-500">
                        <li><strong>Form 1:</strong> Application details (applicant name, address, title, signature).</li>
                        <li><strong>Form 2:</strong> Specifications detailing the drawing assembly, background, and independent claims.</li>
                        <li><strong>Form 3:</strong> Statement/declaration declaring files registered outside India.</li>
                        <li><strong>Form 5:</strong> Declaration of inventorship credentials.</li>
                        <li><strong>Form 26:</strong> Power of attorney assigning filing privileges to registered Patent Agents.</li>
                      </ul>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" /> How is my Prior Art score calculated?
                    </h4>
                    <p className="leading-relaxed pl-5">
                      The AI checks similarity indices by comparing your innovation problem statements and proposed solutions with registered USPTO and WIPO indexes. A score below 20% indicates low risk of claims infringement.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                      <Layers className="w-4 h-4 text-indigo-600" /> Can my Guide supervise and review my work?
                    </h4>
                    <p className="leading-relaxed pl-5">
                      Yes! You can invite your Faculty Guide as a supervisor under the "Team & Tasks" tab. The Guide will have access to a dedicated review deck to leave claim comments and endorse workflow stage transitions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/20 border border-indigo-150 rounded-2xl space-y-3">
                    <h4 className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                      <Calculator className="w-4.5 h-4.5" /> IPO Official Fees Estimation (Form 1)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-normal">
                      Select entity type and scope parameters to calculate the base official filing fees (e-filing rate):
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Applicant Type</label>
                        <select
                          value={applicantType}
                          onChange={(e) => setApplicantType(e.target.value as any)}
                          className="w-full h-8.5 rounded-lg border border-slate-200 px-2 font-bold text-xs bg-white cursor-pointer"
                        >
                          <option value="individual">Natural Person / Startup / Small Entity</option>
                          <option value="large">Large Entity (Others)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Total Page Count</label>
                        <input
                          type="number"
                          value={calcPages}
                          onChange={(e) => setCalcPages(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full h-8.5 rounded-lg border border-slate-200 px-3 font-semibold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Claims Count</label>
                        <input
                          type="number"
                          value={calcClaims}
                          onChange={(e) => setCalcClaims(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full h-8.5 rounded-lg border border-slate-200 px-3 font-semibold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-450 uppercase">Calculated Total IPO Fee</p>
                      <p className="text-xl font-extrabold text-indigo-650 font-mono mt-0.5">₹{calcResult.toLocaleString()}</p>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold text-right leading-relaxed max-w-[220px]">
                      *Includes base filing up to 30 pages & 10 claims. Additional page/claim charges applied dynamically.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Close Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
