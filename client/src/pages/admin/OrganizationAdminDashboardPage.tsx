import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  FolderKanban,
  Shield,
  ShieldCheck,
  Plus,
  Search,
  UserCheck,
  RefreshCw,
  Edit,
  Eye,
  UserPlus,
  ChevronRight,
  Settings,
  Activity,
  Award,
  CreditCard,
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { BillingPage } from './BillingPage';

interface Organization {
  id: string;
  name: string;
  domain?: string;
  type?: string;
  contactEmail?: string;
  contactNumber?: string;
  address?: string;
  location?: string;
  status?: string;
  verificationStatus?: string;
  createdAt: string;
}

interface OrgUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  employeeOrStudentId?: string;
  profile?: {
    phone?: string;
    department?: string;
    designation?: string;
  };
  hasActivePolicy: boolean;
  activePoliciesCount: number;
  policies: Array<{
    assignmentId: string;
    policyId: string;
    policyName: string;
    assignedAt: string;
    expiresAt?: string;
    status: string;
  }>;
}

interface OrgPolicy {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  rules?: any;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  activeAssignmentsCount: number;
  totalAssignmentsCount: number;
  createdBy?: {
    id: string;
    fullName: string;
    username: string;
  };
}

interface AssignmentHistoryItem {
  id: string;
  policyId: string;
  userId: string;
  assignedAt: string;
  expiresAt?: string | null;
  status: string;
  revokedAt?: string | null;
  policy: {
    id: string;
    name: string;
    description?: string;
  };
  user: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    role: { name: string };
  };
  assignedBy: {
    id: string;
    fullName: string;
    username: string;
  };
  revokedBy?: {
    id: string;
    fullName: string;
    username: string;
  } | null;
}

export const OrganizationAdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'projects' | 'policies' | 'billing' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Organization Data
  const [org, setOrg] = useState<Organization | null>(null);
  const [metrics, setMetrics] = useState<{
    totalInventors: number;
    totalGuides: number;
    totalPatentExperts: number;
    totalProjects: number;
    activePolicies: number;
  }>({
    totalInventors: 0,
    totalGuides: 0,
    totalPatentExperts: 0,
    totalProjects: 0,
    activePolicies: 0,
  });

  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);

  // Users Tab State
  const [usersList, setUsersList] = useState<OrgUser[]>([]);
  const [usersRoleFilter, setUsersRoleFilter] = useState<string>('ALL');
  const [usersSearch, setUsersSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Projects Tab State
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [projectsSearch, setProjectsSearch] = useState('');
  const [projectsStageFilter] = useState('ALL');
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Policies Tab State
  const [policiesList, setPoliciesList] = useState<OrgPolicy[]>([]);
  const [policySubTab, setPolicySubTab] = useState<'active' | 'history'>('active');
  const [policiesSearch, setPoliciesSearch] = useState('');
  const [policiesStatusFilter] = useState('ALL');
  const [historyList, setHistoryList] = useState<AssignmentHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // Modals & Drawers
  const [showCreatePolicyModal, setShowCreatePolicyModal] = useState(false);
  const [newPolicyData, setNewPolicyData] = useState({
    name: '',
    description: '',
    rules: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [savingPolicy, setSavingPolicy] = useState(false);

  const [showEditPolicyModal, setShowEditPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<OrgPolicy | null>(null);

  const [showAssignPolicyModal, setShowAssignPolicyModal] = useState(false);
  const [selectedPolicyForAssign, setSelectedPolicyForAssign] = useState<string>('');
  const [assignMode, setAssignMode] = useState<'SPECIFIC' | 'ROLE'>('SPECIFIC');
  const [selectedUserIdsForAssign, setSelectedUserIdsForAssign] = useState<string[]>([]);
  const [selectedRoleForAssign, setSelectedRoleForAssign] = useState<string>('INVENTORS');
  const [assignExpiryDate, setAssignExpiryDate] = useState<string>('');
  const [assigningPolicy, setAssigningPolicy] = useState(false);

  const [showViewAssignmentsModal, setShowViewAssignmentsModal] = useState(false);
  const [selectedPolicyDetails, setSelectedPolicyDetails] = useState<any | null>(null);
  const [loadingPolicyDetails, setLoadingPolicyDetails] = useState(false);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    email: '',
    phone: '',
    roleName: 'Inventor',
    department: '',
    designation: '',
    employeeOrStudentId: '',
  });
  const [addingUser, setAddingUser] = useState(false);

  // Settings State
  const [settingsData, setSettingsData] = useState<Partial<Organization>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Initial Load: My Organization & Overview
  const fetchOrgOverview = async () => {
    try {
      setRefreshing(true);
      const myOrgRes = await api.get('/organizations/my-organization');
      const orgData = myOrgRes.data.organization;
      setOrg(orgData);
      setSettingsData(orgData);

      const dashRes = await api.get(`/organizations/${orgData.id}/dashboard`);
      setMetrics(dashRes.data.metrics || {});
      setRecentProjects(dashRes.data.recentProjects || []);
      setRecentAssignments(dashRes.data.recentAssignments || []);
    } catch (error: any) {
      console.error('Failed to load organization dashboard:', error);
      toast.error(error.response?.data?.message || 'Failed to load organization data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const queryTab = new URLSearchParams(window.location.search).get('tab');
    if (queryTab === 'billing' || queryTab === 'users' || queryTab === 'projects' || queryTab === 'policies' || queryTab === 'settings') {
      setActiveTab(queryTab as any);
    }
    fetchOrgOverview();
  }, []);

  // Fetch Users
  const fetchOrgUsers = async () => {
    if (!org?.id) return;
    setLoadingUsers(true);
    try {
      const res = await api.get(`/organizations/${org.id}/users`, {
        params: {
          role: usersRoleFilter,
          search: usersSearch,
        },
      });
      setUsersList(res.data.users || []);
    } catch (error: any) {
      console.error('Failed to load organization users:', error);
      toast.error(error.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && org?.id) {
      fetchOrgUsers();
    }
  }, [activeTab, usersRoleFilter, usersSearch, org?.id]);

  // Fetch Projects
  const fetchOrgProjects = async () => {
    if (!org?.id) return;
    setLoadingProjects(true);
    try {
      const res = await api.get(`/organizations/${org.id}/projects`, {
        params: {
          stage: projectsStageFilter,
          search: projectsSearch,
        },
      });
      setProjectsList(res.data.projects || []);
    } catch (error: any) {
      console.error('Failed to load organization projects:', error);
      toast.error(error.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'projects' && org?.id) {
      fetchOrgProjects();
    }
  }, [activeTab, projectsStageFilter, projectsSearch, org?.id]);

  // Fetch Policies
  const fetchOrgPolicies = async () => {
    if (!org?.id) return;
    setLoadingPolicies(true);
    try {
      const [policiesRes, historyRes] = await Promise.allSettled([
        api.get(`/organizations/${org.id}/policies`, {
          params: { search: policiesSearch, status: policiesStatusFilter },
        }),
        api.get(`/organizations/${org.id}/policies/history`, {
          params: { search: historySearch },
        }),
      ]);

      if (policiesRes.status === 'fulfilled') {
        setPoliciesList(policiesRes.value.data.policies || []);
      }
      if (historyRes.status === 'fulfilled') {
        setHistoryList(historyRes.value.data.history || []);
      }
    } catch (error: any) {
      console.error('Failed to load policies:', error);
    } finally {
      setLoadingPolicies(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'policies' && org?.id) {
      fetchOrgPolicies();
    }
  }, [activeTab, policiesSearch, policiesStatusFilter, historySearch, org?.id]);

  // Create Policy Handler
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.id || !newPolicyData.name.trim()) {
      toast.error('Policy name is required.');
      return;
    }

    setSavingPolicy(true);
    try {
      let parsedRules = null;
      if (newPolicyData.rules.trim()) {
        try {
          parsedRules = JSON.parse(newPolicyData.rules);
        } catch {
          parsedRules = newPolicyData.rules.trim();
        }
      }

      await api.post(`/organizations/${org.id}/policies`, {
        name: newPolicyData.name,
        description: newPolicyData.description,
        rules: parsedRules,
        status: newPolicyData.status,
      });

      toast.success('Policy created successfully!');
      setShowCreatePolicyModal(false);
      setNewPolicyData({ name: '', description: '', rules: '', status: 'ACTIVE' });
      fetchOrgPolicies();
      fetchOrgOverview();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create policy.');
    } finally {
      setSavingPolicy(false);
    }
  };

  // Edit Policy Handler
  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.id || !editingPolicy) return;

    setSavingPolicy(true);
    try {
      await api.patch(`/organizations/${org.id}/policies/${editingPolicy.id}`, {
        name: editingPolicy.name,
        description: editingPolicy.description,
        status: editingPolicy.status,
      });

      toast.success('Policy updated successfully!');
      setShowEditPolicyModal(false);
      setEditingPolicy(null);
      fetchOrgPolicies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update policy.');
    } finally {
      setSavingPolicy(false);
    }
  };

  // Toggle Policy Status
  const handleTogglePolicyStatus = async (policy: OrgPolicy) => {
    if (!org?.id) return;
    const newStatus = policy.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/organizations/${org.id}/policies/${policy.id}/status`, {
        status: newStatus,
      });
      toast.success(`Policy ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
      fetchOrgPolicies();
      fetchOrgOverview();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update policy status.');
    }
  };

  // View Policy Details & Assignments
  const handleOpenViewAssignments = async (policyId: string) => {
    if (!org?.id) return;
    setLoadingPolicyDetails(true);
    setShowViewAssignmentsModal(true);
    try {
      const res = await api.get(`/organizations/${org.id}/policies/${policyId}`);
      setSelectedPolicyDetails(res.data.policy);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load policy assignments.');
      setShowViewAssignmentsModal(false);
    } finally {
      setLoadingPolicyDetails(false);
    }
  };

  // Revoke Policy Assignment
  const handleRevokeAssignment = async (assignmentId: string) => {
    if (!org?.id) return;
    if (!window.confirm('Are you sure you want to revoke this policy assignment?')) return;

    try {
      await api.delete(`/organizations/${org.id}/policies/assignments/${assignmentId}`);
      toast.success('Policy assignment revoked successfully.');
      if (selectedPolicyDetails) {
        handleOpenViewAssignments(selectedPolicyDetails.id);
      }
      fetchOrgPolicies();
      fetchOrgOverview();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke policy assignment.');
    }
  };

  // Assign Policy Handler
  const handleAssignPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.id || !selectedPolicyForAssign) {
      toast.error('Please select a policy to assign.');
      return;
    }

    if (assignMode === 'SPECIFIC' && selectedUserIdsForAssign.length === 0) {
      toast.error('Please select at least one user.');
      return;
    }

    setAssigningPolicy(true);
    try {
      const payload: any = {
        expiresAt: assignExpiryDate ? new Date(assignExpiryDate).toISOString() : undefined,
      };

      if (assignMode === 'SPECIFIC') {
        payload.userIds = selectedUserIdsForAssign;
      } else {
        payload.role = selectedRoleForAssign;
      }

      const res = await api.post(
        `/organizations/${org.id}/policies/${selectedPolicyForAssign}/assign`,
        payload
      );

      toast.success(res.data.message || 'Policy assigned successfully!');
      setShowAssignPolicyModal(false);
      setSelectedUserIdsForAssign([]);
      setAssignExpiryDate('');
      fetchOrgPolicies();
      fetchOrgOverview();
      if (activeTab === 'users') fetchOrgUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign policy.');
    } finally {
      setAssigningPolicy(false);
    }
  };

  // Add User to Org Handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.id || !newUserData.fullName.trim() || !newUserData.email.trim()) {
      toast.error('Full name and email are required.');
      return;
    }

    setAddingUser(true);
    try {
      await api.post(`/organizations/${org.id}/users`, newUserData);
      toast.success('Member invited successfully! Activation email sent.');
      setShowAddUserModal(false);
      setNewUserData({
        fullName: '',
        email: '',
        phone: '',
        roleName: 'Inventor',
        department: '',
        designation: '',
        employeeOrStudentId: '',
      });
      fetchOrgUsers();
      fetchOrgOverview();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add user.');
    } finally {
      setAddingUser(false);
    }
  };

  // Save Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.id) return;

    setSavingSettings(true);
    try {
      await api.put(`/organizations/${org.id}`, settingsData);
      toast.success('Organization settings updated successfully.');
      fetchOrgOverview();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-600">Loading Organization Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Organization Header */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-950">
                  {org?.name || 'Organization Workspace'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold uppercase">
                  {org?.type || 'UNIVERSITY'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase">
                  {org?.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Multi-Tenant Administration, Policy Enforcement & Governance Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrgOverview}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite Member
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'overview', label: 'Dashboard', icon: Activity },
            { id: 'users', label: 'Users', icon: Users, badge: (metrics.totalInventors + metrics.totalGuides + metrics.totalPatentExperts) },
            { id: 'projects', label: 'Projects', icon: FolderKanban, badge: metrics.totalProjects },
            { id: 'policies', label: 'Policies', icon: Shield, badge: metrics.activePolicies },
            { id: 'billing', label: 'Billing', icon: CreditCard },
            { id: 'settings', label: 'Organization Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Inventors</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-950">{metrics.totalInventors}</div>
                <p className="text-[11px] text-slate-500 font-medium">Students & Independent Inventors</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Guides</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-950">{metrics.totalGuides}</div>
                <p className="text-[11px] text-slate-500 font-medium">Faculty Supervisors</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Patent Experts</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-950">{metrics.totalPatentExperts}</div>
                <p className="text-[11px] text-slate-500 font-medium">Attorneys & IP Officers</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Projects</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-950">{metrics.totalProjects}</div>
                <p className="text-[11px] text-slate-500 font-medium">Inventions in Pipeline</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Policies</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-950">{metrics.activePolicies}</div>
                <p className="text-[11px] text-slate-500 font-medium">Enforced Institutional Rules</p>
              </div>
            </div>

            {/* Quick Actions & Policy Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg space-y-4 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-3">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight">Policy Governance</h3>
                  <p className="text-slate-300 text-xs mt-1 font-medium">
                    Draft, activate, and assign institutional patent submission policies and compliance rules across your inventors.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setActiveTab('policies');
                      setShowCreatePolicyModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                  >
                    Create Policy
                  </button>
                  <button
                    onClick={() => setActiveTab('policies')}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                  >
                    View All Policies
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-slate-950">Member Management</h3>
                  <p className="text-slate-500 text-xs mt-1 font-medium">
                    View active inventors, supervise faculty guides, and register verified patent specialists under this organization.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('users')}
                  className="inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition"
                >
                  <span>Explore Organization Roster</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-slate-950">Invention Pipeline</h3>
                  <p className="text-slate-500 text-xs mt-1 font-medium">
                    Monitor drafting milestones, patent review statuses, and filing readiness across all institutional projects.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition"
                >
                  <span>View Organization Projects</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Recent Organization Activity & Assignments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-indigo-600" />
                    Recent Inventions
                  </h3>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    View All
                  </button>
                </div>

                {recentProjects.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No projects created in this organization yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentProjects.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 flex items-center justify-between gap-3 transition"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{p.title}</h4>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Owner: {p.owner?.fullName || 'Inventor'} • {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 shrink-0">
                          {p.stage || 'IDEA'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Policy Assignments */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Recent Policy Assignments
                  </h3>
                  <button
                    onClick={() => {
                      setActiveTab('policies');
                      setPolicySubTab('history');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    View Audit Log
                  </button>
                </div>

                {recentAssignments.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No policy assignments recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentAssignments.map((a) => (
                      <div
                        key={a.id}
                        className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 flex items-center justify-between gap-3 transition"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {a.policy?.name || 'Policy'}
                          </h4>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Assigned to: {a.user?.fullName} ({a.user?.role?.name || 'Member'}) • {new Date(a.assignedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 shrink-0">
                          {a.status || 'ACTIVE'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: USERS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950 tracking-tight">
                  Organization Roster
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Manage and supervise inventors, faculty guides, and patent specialists within {org?.name}.
                </p>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition self-start sm:self-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Invite Member
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Role Sub-tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto">
                {[
                  { id: 'ALL', label: 'All Members' },
                  { id: 'INVENTORS', label: 'Inventors' },
                  { id: 'GUIDES', label: 'Guides' },
                  { id: 'PATENT_EXPERTS', label: 'Patent Experts' },
                  { id: 'ADMINS', label: 'Admins' },
                ].map((rf) => (
                  <button
                    key={rf.id}
                    onClick={() => setUsersRoleFilter(rf.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      usersRoleFilter === rf.id
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, username, email..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  className="bg-transparent border-none outline-hidden text-xs text-slate-800 placeholder-slate-400 w-full"
                />
              </div>
            </div>

            {/* Users Table */}
            {loadingUsers ? (
              <div className="p-12 text-center text-xs font-bold text-slate-400">
                Loading members from PostgreSQL database...
              </div>
            ) : usersList.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">
                  {usersRoleFilter === 'INVENTORS'
                    ? 'No inventors found'
                    : usersRoleFilter === 'GUIDES'
                    ? 'No guides found'
                    : usersRoleFilter === 'PATENT_EXPERTS'
                    ? 'No patent experts found'
                    : 'No users found in this organization'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click "Invite Member" to add users to this organization.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-200/60">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Department / ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Policy Compliance</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs">
                              {user.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-950">{user.fullName}</div>
                              <span className="text-[10px] text-slate-400 block">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            user.roleName === 'Inventor' || user.roleName === 'CoInventor'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : user.roleName === 'Guide'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : user.roleName === 'PatentExpert'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {user.roleName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{user.profile?.department || '—'}</div>
                          {user.employeeOrStudentId && (
                            <span className="text-[10px] text-slate-400">ID: {user.employeeOrStudentId}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {user.isActive ? 'Active' : 'Pending Activation'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {user.hasActivePolicy ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>{user.activePoliciesCount} Active {user.activePoliciesCount === 1 ? 'Policy' : 'Policies'}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">No active policy</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedUserIdsForAssign([user.id]);
                              setAssignMode('SPECIFIC');
                              setShowAssignPolicyModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition"
                          >
                            <Shield className="w-3 h-3" />
                            Assign Policy
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PROJECTS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'projects' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950 tracking-tight">
                  Organization Projects
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Inventions created by members of {org?.name}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search inventions..."
                    value={projectsSearch}
                    onChange={(e) => setProjectsSearch(e.target.value)}
                    className="bg-transparent border-none outline-hidden text-xs text-slate-800 placeholder-slate-400 w-full"
                  />
                </div>
              </div>
            </div>

            {loadingProjects ? (
              <div className="p-12 text-center text-xs font-bold text-slate-400">
                Loading projects...
              </div>
            ) : projectsList.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FolderKanban className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No projects found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When inventors under {org?.name} create patent projects, they will be listed here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-200/60">
                    <tr>
                      <th className="py-3 px-4">Invention Title</th>
                      <th className="py-3 px-4">Owner</th>
                      <th className="py-3 px-4">Domain / Category</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {projectsList.map((project) => (
                      <tr key={project.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-950">{project.title}</div>
                          <span className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">
                            {project.problemStatement}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div className="font-bold">{project.owner?.fullName || 'Inventor'}</div>
                          <span className="text-[10px] text-slate-400">{project.owner?.username}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-800 font-bold block">{project.technicalDomain}</span>
                          <span className="text-[10px] text-slate-400">{project.category}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {project.stage}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/dashboard/projects/${project.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: POLICIES MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'policies' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950 tracking-tight">
                  Policy Management & Enforcement
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Create, configure, assign, and audit institutional patent and compliance policies for {org?.name}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAssignPolicyModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Assign Policy
                </button>
                <button
                  onClick={() => setShowCreatePolicyModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Policy
                </button>
              </div>
            </div>

            {/* Policy Subtabs (Active vs History) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
              <button
                onClick={() => setPolicySubTab('active')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  policySubTab === 'active'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Policies ({policiesList.length})
              </button>
              <button
                onClick={() => setPolicySubTab('history')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  policySubTab === 'history'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Assignment History & Audit Log ({historyList.length})
              </button>
            </div>

            {/* SUB-VIEW A: POLICIES LIST */}
            {policySubTab === 'active' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search policies..."
                    value={policiesSearch}
                    onChange={(e) => setPoliciesSearch(e.target.value)}
                    className="bg-transparent border-none outline-hidden text-xs text-slate-800 placeholder-slate-400 w-full"
                  />
                </div>

                {loadingPolicies ? (
                  <div className="p-12 text-center text-xs font-bold text-slate-400">
                    Loading policies...
                  </div>
                ) : policiesList.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Shield className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">No policies created yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Click "Create Policy" to establish institutional patent submission terms or compliance standards.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {policiesList.map((policy) => (
                      <div
                        key={policy.id}
                        className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xs transition flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-bold text-slate-950">{policy.name}</h3>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Created {new Date(policy.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <button
                              onClick={() => handleTogglePolicyStatus(policy)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase transition ${
                                policy.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {policy.status}
                            </button>
                          </div>

                          {policy.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50/80 p-2.5 rounded-xl">
                              {policy.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <strong>{policy.activeAssignmentsCount}</strong> Active Users
                            </span>
                            <span>•</span>
                            <span><strong>{policy.totalAssignmentsCount}</strong> Total Lifetime</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleOpenViewAssignments(policy.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Assignments
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingPolicy(policy);
                                setShowEditPolicyModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                              title="Edit policy details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPolicyForAssign(policy.id);
                                setShowAssignPolicyModal(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition"
                            >
                              Assign
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW B: ASSIGNMENT HISTORY & AUDIT TRAIL */}
            {policySubTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search audit log..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="bg-transparent border-none outline-hidden text-xs text-slate-800 placeholder-slate-400 w-full"
                  />
                </div>

                {historyList.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">
                      No policy assignment history available
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      All assignments, expirations, and revocations will be permanently audited here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-200/60">
                        <tr>
                          <th className="py-3 px-4">Policy</th>
                          <th className="py-3 px-4">Target Member</th>
                          <th className="py-3 px-4">Assigned By</th>
                          <th className="py-3 px-4">Assigned Date</th>
                          <th className="py-3 px-4">Expiration</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Revocation Info</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {historyList.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 font-bold text-slate-950">
                              {item.policy?.name}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{item.user?.fullName}</div>
                              <span className="text-[10px] text-slate-400">
                                {item.user?.role?.name} • {item.user?.email}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {item.assignedBy?.fullName || 'Admin'}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(item.assignedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'None'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                item.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-500">
                              {item.status === 'REVOKED' ? (
                                <span>
                                  Revoked by {item.revokedBy?.fullName || 'Admin'} on {item.revokedAt ? new Date(item.revokedAt).toLocaleDateString() : '—'}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: BILLING & SUBSCRIPTIONS */}
        {/* ========================================================================= */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <BillingPage />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ORGANIZATION SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-950 tracking-tight">
                Organization Profile & Settings
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Update institutional details, verified contact information, and domain settings for {org?.name}.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Organization / University Name *
                </label>
                <input
                  type="text"
                  required
                  value={settingsData.name || ''}
                  onChange={(e) => setSettingsData({ ...settingsData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Contact Email
                  </label>
                  <input
                    type="email"
                    value={settingsData.contactEmail || ''}
                    onChange={(e) => setSettingsData({ ...settingsData, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={settingsData.contactNumber || ''}
                    onChange={(e) => setSettingsData({ ...settingsData, contactNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Domain (e.g. university.edu)
                  </label>
                  <input
                    type="text"
                    value={settingsData.domain || ''}
                    onChange={(e) => setSettingsData({ ...settingsData, domain: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Organization Type
                  </label>
                  <select
                    value={settingsData.type || 'UNIVERSITY'}
                    onChange={(e) => setSettingsData({ ...settingsData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden"
                  >
                    <option value="UNIVERSITY">University / College</option>
                    <option value="RESEARCH_INSTITUTE">Research Institute</option>
                    <option value="ENTERPRISE">Enterprise / Corporate</option>
                    <option value="STARTUP">Startup Incubator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Institutional Address
                </label>
                <textarea
                  rows={2}
                  value={settingsData.address || ''}
                  onChange={(e) => setSettingsData({ ...settingsData, address: e.target.value })}
                  placeholder="Street, Campus, City, State, PIN..."
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE POLICY */}
      {/* ========================================================================= */}
      {showCreatePolicyModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                Create Institutional Policy
              </h3>
              <button
                onClick={() => setShowCreatePolicyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Policy Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Academic Patent Ownership Policy 2026"
                  value={newPolicyData.name}
                  onChange={(e) => setNewPolicyData({ ...newPolicyData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Purpose
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain the scope and governance requirements of this policy..."
                  value={newPolicyData.description}
                  onChange={(e) => setNewPolicyData({ ...newPolicyData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rules / Clauses (Text or JSON)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. All inventions created using institutional lab equipment must list the university as co-applicant."
                  value={newPolicyData.rules}
                  onChange={(e) => setNewPolicyData({ ...newPolicyData, rules: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-medium font-mono border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                <select
                  value={newPolicyData.status}
                  onChange={(e) => setNewPolicyData({ ...newPolicyData, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                >
                  <option value="ACTIVE">ACTIVE (Enforceable immediately)</option>
                  <option value="INACTIVE">INACTIVE (Draft)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePolicyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPolicy}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {savingPolicy ? 'Creating...' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN POLICY */}
      {/* ========================================================================= */}
      {showAssignPolicyModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Assign Policy to Members
              </h3>
              <button
                onClick={() => setShowAssignPolicyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignPolicy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Policy *
                </label>
                <select
                  required
                  value={selectedPolicyForAssign}
                  onChange={(e) => setSelectedPolicyForAssign(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                >
                  <option value="">-- Choose active policy --</option>
                  {policiesList
                    .filter((p) => p.status === 'ACTIVE')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Assignment Mode</label>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignMode"
                      checked={assignMode === 'SPECIFIC'}
                      onChange={() => setAssignMode('SPECIFIC')}
                    />
                    <span>Select Specific Members</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignMode"
                      checked={assignMode === 'ROLE'}
                      onChange={() => setAssignMode('ROLE')}
                    />
                    <span>Assign by Role</span>
                  </label>
                </div>
              </div>

              {assignMode === 'SPECIFIC' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Organization Members
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 divide-y divide-slate-50">
                    {usersList.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2">No members available in this organization.</p>
                    ) : (
                      usersList.map((user) => {
                        const isSelected = selectedUserIdsForAssign.includes(user.id);
                        return (
                          <label
                            key={user.id}
                            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIdsForAssign([...selectedUserIdsForAssign, user.id]);
                                } else {
                                  setSelectedUserIdsForAssign(
                                    selectedUserIdsForAssign.filter((id) => id !== user.id)
                                  );
                                }
                              }}
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900">{user.fullName}</span>
                              <span className="text-[10px] text-slate-400 block">
                                {user.roleName} • {user.email}
                              </span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Role</label>
                  <select
                    value={selectedRoleForAssign}
                    onChange={(e) => setSelectedRoleForAssign(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                  >
                    <option value="INVENTORS">All Inventors</option>
                    <option value="GUIDES">All Guides</option>
                    <option value="PATENT_EXPERTS">All Patent Experts</option>
                    <option value="ALL">All Organization Members</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={assignExpiryDate}
                  onChange={(e) => setAssignExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignPolicyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningPolicy}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {assigningPolicy ? 'Assigning...' : 'Assign Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW POLICY ASSIGNMENTS DRAWER */}
      {/* ========================================================================= */}
      {showViewAssignmentsModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {selectedPolicyDetails?.name || 'Policy Assignments'}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {selectedPolicyDetails?.activeAssignmentsCount || 0} active members currently governed by this policy
                </span>
              </div>
              <button
                onClick={() => setShowViewAssignmentsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {loadingPolicyDetails ? (
                <p className="text-center text-xs text-slate-400 py-8">Loading assignments...</p>
              ) : selectedPolicyDetails?.activeAssignments?.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No members are currently assigned to this policy.
                </div>
              ) : (
                selectedPolicyDetails?.activeAssignments?.map((a: any) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-950">{a.user?.fullName}</h4>
                      <span className="text-[10px] text-slate-500 block">
                        {a.user?.role?.name} • {a.user?.email}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Assigned on {new Date(a.assignedAt).toLocaleDateString()}
                        {a.expiresAt ? ` • Expires: ${new Date(a.expiresAt).toLocaleDateString()}` : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRevokeAssignment(a.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                    >
                      Revoke
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowViewAssignmentsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: INVITE / ADD MEMBER */}
      {/* ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                Invite Member to {org?.name}
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Smith"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role *</label>
                  <select
                    value={newUserData.roleName}
                    onChange={(e) => setNewUserData({ ...newUserData, roleName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                  >
                    <option value="Inventor">Inventor</option>
                    <option value="Guide">Faculty Guide</option>
                    <option value="PatentExpert">Patent Expert</option>
                    <option value="CoInventor">Co-Inventor</option>
                    <option value="OrganizationAdmin">Organization Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Mechanical Eng."
                    value={newUserData.department}
                    onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ID Number</label>
                  <input
                    type="text"
                    placeholder="Student/Faculty ID"
                    value={newUserData.employeeOrStudentId}
                    onChange={(e) => setNewUserData({ ...newUserData, employeeOrStudentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {addingUser ? 'Sending Invitation...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT POLICY */}
      {/* ========================================================================= */}
      {showEditPolicyModal && editingPolicy && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950">Edit Policy</h3>
              <button
                onClick={() => {
                  setShowEditPolicyModal(false);
                  setEditingPolicy(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePolicy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Policy Name</label>
                <input
                  type="text"
                  required
                  value={editingPolicy.name}
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingPolicy.description || ''}
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editingPolicy.status}
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:border-indigo-600 outline-hidden"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPolicyModal(false);
                    setEditingPolicy(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPolicy}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {savingPolicy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
