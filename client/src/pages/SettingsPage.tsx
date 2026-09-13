import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Shield,
  KeyRound,
  Bell,
  Sliders,
  AlertTriangle,
  LogOut,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Mail,
  User,
  Building,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface UserContext {
  user?: {
    id: string;
    userId?: string;
    fullName: string;
    username: string;
    email: string;
    role: string;
    institution?: string;
    employeeOrStudentId?: string;
    createdAt?: string;
    profileCompleted?: boolean;
  };
}

interface NotificationPrefs {
  projectUpdates: boolean;
  taskAssignments: boolean;
  reviewAlerts: boolean;
  invitations: boolean;
  systemAnnouncements: boolean;
  emailDigest: 'instant' | 'daily' | 'weekly';
  compactTasks: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  projectUpdates: true,
  taskAssignments: true,
  reviewAlerts: true,
  invitations: true,
  systemAnnouncements: true,
  emailDigest: 'instant',
  compactTasks: false,
};

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext<UserContext>() || {};
  const [currentUser, setCurrentUser] = useState<any>(outletContext.user || null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // Notification & App Preferences State
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  const userId = currentUser?.id || currentUser?.userId || 'anonymous';

  useEffect(() => {
    if (outletContext.user) {
      setCurrentUser(outletContext.user);
    } else {
      fetchUserProfile();
    }
  }, [outletContext.user]);

  useEffect(() => {
    if (userId) {
      try {
        const stored = localStorage.getItem(`patenthub_prefs_${userId}`);
        if (stored) {
          setPrefs(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Failed to load local preferences', e);
      }
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.data?.user) {
        setCurrentUser(res.data.user);
      }
    } catch (err) {
      console.warn('Failed to load user profile in Settings', err);
    }
  };

  const handleUpdatePref = (key: keyof NotificationPrefs, value: any) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    try {
      localStorage.setItem(`patenthub_prefs_${userId}`, JSON.stringify(updated));
      toast.success('Preference updated', { duration: 1500 });
    } catch (e) {
      console.error('Failed to save preference', e);
    }
  };

  // Password validation checks
  const passChecks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^a-zA-Z0-9]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const isPasswordValid =
    passChecks.length &&
    passChecks.upper &&
    passChecks.lower &&
    passChecks.number &&
    passChecks.special &&
    passChecks.matches;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please provide your current password.');
      return;
    }
    if (!isPasswordValid) {
      toast.error('Please meet all password requirements.');
      return;
    }

    setChangingPass(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success(res.data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out of PatentHub AI?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Signed out successfully.');
      navigate('/login');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2 animate-fade-in font-sans pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account & System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Configure your workspace account security, notification rules, and application preferences.
          </p>
        </div>
      </div>

      {/* SECTION 1: ACCOUNT INFORMATION */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Account Overview</h2>
            <p className="text-xs text-slate-500 font-medium">
              Your registered credentials and verified workspace role
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Full Name
            </span>
            <span className="font-extrabold text-slate-900 text-sm block">
              {currentUser?.fullName || 'Inventor'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Username
            </span>
            <span className="font-extrabold text-slate-900 text-sm block">
              @{currentUser?.username || 'user'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Registered Email
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentUser?.email || 'user@institution.edu'}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Account Role & Status
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold">
                {currentUser?.role || 'Inventor'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>
          </div>

          {currentUser?.institution && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1 sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Affiliated Institution
              </span>
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Building className="w-4 h-4 text-blue-600" />
                <span>{currentUser.institution}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: SECURITY & PASSWORD */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Security Credentials</h2>
            <p className="text-xs text-slate-500 font-medium">
              Manage your password and authentication protections
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition"
              required
            />
          </div>

          {/* Requirements Checklist */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-[11px]">
            <span className="font-bold text-slate-700 block">Password Requirements:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                {passChecks.length ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-300" />
                )}
                <span className={passChecks.length ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                  At least 8 characters
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {passChecks.upper ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-300" />
                )}
                <span className={passChecks.upper ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                  1 Uppercase letter (A-Z)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {passChecks.lower ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-300" />
                )}
                <span className={passChecks.lower ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                  1 Lowercase letter (a-z)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {passChecks.number ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-300" />
                )}
                <span className={passChecks.number ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                  1 Number (0-9)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {passChecks.special ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-300" />
                )}
                <span className={passChecks.special ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                  1 Special character (!@#$%...)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {passChecks.matches ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-300" />
                )}
                <span className={passChecks.matches ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                  Passwords match
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPass || !isPasswordValid}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:cursor-not-allowed"
          >
            {changingPass ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* SECTION 3: NOTIFICATION PREFERENCES */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Notification Preferences</h2>
            <p className="text-xs text-slate-500 font-medium">
              Choose which notifications you receive across project workflows
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Project updates */}
          <div className="flex items-center justify-between p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
            <div className="space-y-0.5 max-w-lg">
              <h4 className="text-xs font-extrabold text-slate-900">Project Milestones & Updates</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Notify when projects transition stages or new documents and figures are added.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.projectUpdates}
                onChange={(e) => handleUpdatePref('projectUpdates', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Task assignments */}
          <div className="flex items-center justify-between p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
            <div className="space-y-0.5 max-w-lg">
              <h4 className="text-xs font-extrabold text-slate-900">Task Assignments</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Notify when you are assigned a new milestone or a collaborator updates task status.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.taskAssignments}
                onChange={(e) => handleUpdatePref('taskAssignments', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Review feedback alerts */}
          <div className="flex items-center justify-between p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
            <div className="space-y-0.5 max-w-lg">
              <h4 className="text-xs font-extrabold text-slate-900">Review & Expert Feedback</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Notify when your Faculty Guide or Patent Expert reviews your project or requests changes.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.reviewAlerts}
                onChange={(e) => handleUpdatePref('reviewAlerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Invitations */}
          <div className="flex items-center justify-between p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
            <div className="space-y-0.5 max-w-lg">
              <h4 className="text-xs font-extrabold text-slate-900">Collaboration Invitations</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Notify when another inventor invites you to join an invention project.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.invitations}
                onChange={(e) => handleUpdatePref('invitations', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* System Announcements */}
          <div className="flex items-center justify-between p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
            <div className="space-y-0.5 max-w-lg">
              <h4 className="text-xs font-extrabold text-slate-900">System & Governance Notices</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Important platform notices, compliance alerts, and maintenance updates.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.systemAnnouncements}
                onChange={(e) => handleUpdatePref('systemAnnouncements', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 4: APPLICATION PREFERENCES */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-2xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Application Preferences</h2>
            <p className="text-xs text-slate-500 font-medium">
              Adjust your workspace interface and digest preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
            <span className="font-extrabold text-slate-900 block">Email Digest Frequency</span>
            <p className="text-[11px] text-slate-500 font-medium">
              How often you want notification summaries sent to your email.
            </p>
            <select
              value={prefs.emailDigest}
              onChange={(e) => handleUpdatePref('emailDigest', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="instant">Instant (as events occur)</option>
              <option value="daily">Daily Summary</option>
              <option value="weekly">Weekly Digest</option>
            </select>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
            <span className="font-extrabold text-slate-900 block">Task Board View Mode</span>
            <p className="text-[11px] text-slate-500 font-medium">
              Toggle between standard detailed table and compact checklist view.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleUpdatePref('compactTasks', false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  !prefs.compactTasks
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => handleUpdatePref('compactTasks', true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  prefs.compactTasks
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: DANGER ZONE */}
      <div className="bg-white rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-rose-950">Danger Zone</h2>
            <p className="text-xs text-rose-600 font-medium">
              Account session actions and workspace sign out
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-rose-50/40 border border-rose-200/60 rounded-2xl">
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold text-slate-900">Sign Out of PatentHub AI</h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Terminate your active workspace session on this browser device.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
