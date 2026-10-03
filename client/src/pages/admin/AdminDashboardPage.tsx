import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  ShieldAlert,
  UserCheck,
  Bell,
  Scale,
  Activity,
  Settings,
  Search,
  Plus,
  Check,
  X,
  RefreshCw,
  LogOut,
  Trash2,
  Eye,
  AlertTriangle,
  Send,
  Sliders,
  Calendar,
  Lock,
  Loader2,
  Edit3,
  Save,
  RotateCcw,
  Shield,
  CreditCard,
  FileCheck,
  DollarSign,
  Cpu,
  Server,
  Database,
  Mail,
  Cloud,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [searchGlobal, setSearchGlobal] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('patenthub_token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // ----------------------------------------------------
  // PLATFORM DATA STATES (FROM REAL BACKEND POSTGRESQL)
  // ----------------------------------------------------
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [verificationsList, setVerificationsList] = useState<any[]>([]);
  const [organizationsList, setOrganizationsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [rolesStats, setRolesStats] = useState<any[]>([]);
  const [activityLogsData, setActivityLogsData] = useState<{ total: number; logs: any[]; totalPages: number }>({
    total: 0,
    logs: [],
    totalPages: 1
  });
  const [notificationsData, setNotificationsData] = useState<{ total: number; notifications: any[] }>({
    total: 0,
    notifications: []
  });
  const [systemSettings, setSystemSettings] = useState<any>(null);

  // ----------------------------------------------------
  // GOVERNANCE, BILLING & ENTITLEMENT STATES
  // ----------------------------------------------------
  const [policiesList, setPoliciesList] = useState<any[]>([]);
  const [subscriptionsData, setSubscriptionsData] = useState<{ subscriptions: any[]; trials: any[]; plans: any[] }>({
    subscriptions: [],
    trials: [],
    plans: []
  });
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [entitlementsList, setEntitlementsList] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Policy Modals & State
  const [showCreatePolicyModal, setShowCreatePolicyModal] = useState(false);
  const [showEditPolicyModal, setShowEditPolicyModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);
  const [newPolicyData, setNewPolicyData] = useState({
    name: '',
    description: '',
    organizationId: '',
    rules: '{\n  "allowAiFeatures": true,\n  "allowDrawingGeneration": true,\n  "requireDualApproval": false\n}'
  });
  const [policySearchTerm, setPolicySearchTerm] = useState('');
  const [policyOrgFilter, setPolicyOrgFilter] = useState('ALL');
  const [policyStatusFilter, setPolicyStatusFilter] = useState('ALL');

  // Subscriptions & Payments Filters
  const [subStatusFilter, setSubStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [entitlementOrgFilter, setEntitlementOrgFilter] = useState('ALL');

  // ----------------------------------------------------
  // COMPLETE USER PROFILE DRAWER STATE
  // ----------------------------------------------------
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);
  const [selectedUserProfileLoading, setSelectedUserProfileLoading] = useState(false);
  const [userProfileTab, setUserProfileTab] = useState<
    'PERSONAL' | 'ROLE' | 'PROFESSIONAL' | 'PROJECTS' | 'ACTIVITY' | 'SECURITY'
  >('PERSONAL');
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [editingUserRole, setEditingUserRole] = useState<string>('');

  // ----------------------------------------------------
  // ORGANIZATION DETAILS DRAWER STATE
  // ----------------------------------------------------
  const [selectedOrgDetails, setSelectedOrgDetails] = useState<any | null>(null);
  const [orgDetailsTab, setOrgDetailsTab] = useState<
    'OVERVIEW' | 'MEMBERS' | 'PROJECTS' | 'GUIDES' | 'EXPERTS' | 'ACTIVITY'
  >('OVERVIEW');
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgData, setNewOrgData] = useState({ name: '', domain: '', contactEmail: '' });

  // ----------------------------------------------------
  // ROLES & PERMISSIONS MATRIX STATE
  // ----------------------------------------------------
  const [allPermissionsList, setAllPermissionsList] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [pendingPermissionChanges, setPendingPermissionChanges] = useState<Record<string, string[]>>({});
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [showConfirmSavePermissions, setShowConfirmSavePermissions] = useState(false);

  // ----------------------------------------------------
  // VERIFICATION REQUESTS STATE
  // ----------------------------------------------------
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null);
  const [verificationDecisionModal, setVerificationDecisionModal] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');

  // ----------------------------------------------------
  // PROJECT & NOTIFICATION MODALS
  // ----------------------------------------------------
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [assignReviewerData, setAssignReviewerData] = useState({ username: '', role: 'GUIDE' });

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    type: 'SYSTEM',
    targetRole: 'ALL'
  });

  const [selectedReviewDetails, setSelectedReviewDetails] = useState<any | null>(null);

  // ----------------------------------------------------
  // FILTER & PAGINATION STATES
  // ----------------------------------------------------
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const [projectStageFilter, setProjectStageFilter] = useState('ALL');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');

  const [activityTypeFilter, setActivityTypeFilter] = useState('ALL');
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [activityPage, setActivityPage] = useState(1);

  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [notifTypeFilter, setNotifTypeFilter] = useState('ALL');

  const [reviewFilter, setReviewFilter] = useState('ALL');

  // ----------------------------------------------------
  // INITIAL FETCH & REFRESH
  // ----------------------------------------------------
  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const [
        dashRes,
        usersRes,
        verifRes,
        orgsRes,
        projRes,
        reviewsRes,
        rolesRes,
        permsRes,
        activityRes,
        notifRes,
        settingsRes,
        policiesRes,
        subscriptionsRes,
        paymentsRes,
        entitlementsRes,
        healthRes
      ] = await Promise.allSettled([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/verifications'),
        api.get('/admin/organizations'),
        api.get('/admin/projects'),
        api.get('/admin/reviews'),
        api.get('/admin/roles-stats'),
        api.get('/admin/roles-permissions'),
        api.get('/admin/activity-logs?page=1&limit=25'),
        api.get('/admin/notifications?limit=50'),
        api.get('/admin/settings'),
        api.get('/admin/policies'),
        api.get('/admin/subscriptions'),
        api.get('/admin/payments'),
        api.get('/admin/entitlements'),
        api.get('/admin/health')
      ]);

      if (dashRes.status === 'fulfilled') setMetrics(dashRes.value.data);
      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value.data.users || []);
      if (verifRes.status === 'fulfilled') setVerificationsList(verifRes.value.data.applications || []);
      if (orgsRes.status === 'fulfilled') setOrganizationsList(orgsRes.value.data.organizations || []);
      if (projRes.status === 'fulfilled') setProjectsList(projRes.value.data.projects || []);
      if (reviewsRes.status === 'fulfilled') setReviewsData(reviewsRes.value.data);
      if (rolesRes.status === 'fulfilled') setRolesStats(rolesRes.value.data.roles || []);
      if (permsRes.status === 'fulfilled') {
        const pData = permsRes.value.data;
        setAllPermissionsList(pData.allPermissions || []);
        setRolePermissions(pData.rolePermissions || {});
        setPendingPermissionChanges(pData.rolePermissions || {});
      }
      if (activityRes.status === 'fulfilled') setActivityLogsData(activityRes.value.data);
      if (notifRes.status === 'fulfilled') setNotificationsData(notifRes.value.data);
      if (settingsRes.status === 'fulfilled') setSystemSettings(settingsRes.value.data.settings);
      if (policiesRes.status === 'fulfilled') setPoliciesList(policiesRes.value.data.policies || []);
      if (subscriptionsRes.status === 'fulfilled') setSubscriptionsData(subscriptionsRes.value.data);
      if (paymentsRes.status === 'fulfilled') setPaymentsList(paymentsRes.value.data.payments || []);
      if (entitlementsRes.status === 'fulfilled') setEntitlementsList(entitlementsRes.value.data.entitlements || []);
      if (healthRes.status === 'fulfilled') setSystemHealth(healthRes.value.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
      toast.error('Failed to connect to admin services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // Fetch Activity Logs on Filter/Page Change
  const fetchActivityLogs = async (page: number = 1) => {
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '25');
      if (activityTypeFilter !== 'ALL') params.append('type', activityTypeFilter);
      if (activitySearchTerm.trim()) params.append('search', activitySearchTerm.trim());

      const res = await api.get(`/admin/activity-logs?${params.toString()}`);
      setActivityLogsData(res.data);
      setActivityPage(page);
    } catch (e) {
      console.error('Error fetching activity logs', e);
    }
  };

  useEffect(() => {
    if (activeNav === 'activity') {
      fetchActivityLogs(1);
    }
  }, [activityTypeFilter, activitySearchTerm, activeNav]);

  // ----------------------------------------------------
  // COMPLETE USER PROFILE HANDLER
  // ----------------------------------------------------
  const handleOpenUserProfile = async (user: any) => {
    setSelectedUser(user);
    setEditingUserRole(user.role);
    setUserProfileTab('PERSONAL');
    setSelectedUserProfileLoading(true);
    try {
      const res = await api.get(`/admin/users/${user.id}`);
      setSelectedUserProfile(res.data);
    } catch (e) {
      console.error('Failed to fetch full user profile', e);
      toast.error('Failed to load full user profile details');
    } finally {
      setSelectedUserProfileLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      toast.success(!currentStatus ? 'User account activated' : 'User account suspended');
      const updated = await api.get('/admin/users');
      setUsersList(updated.data.users || []);
      if (selectedUserProfile && selectedUserProfile.personalDetails.id === userId) {
        setSelectedUserProfile((prev: any) => ({
          ...prev,
          personalDetails: { ...prev.personalDetails, isActive: !currentStatus },
          roleAndAccess: { ...prev.roleAndAccess, activationStatus: !currentStatus ? 'ACTIVE' : 'SUSPENDED' },
          security: { ...prev.security, accountStatus: !currentStatus ? 'Active' : 'Suspended' }
        }));
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleUpdateUserRole = async (userId: string, roleName: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { roleName });
      toast.success(`Role updated to ${roleName}`);
      const updated = await api.get('/admin/users');
      setUsersList(updated.data.users || []);
      if (selectedUserProfile) {
        const profileRes = await api.get(`/admin/users/${userId}`);
        setSelectedUserProfile(profileRes.data);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      toast.success(`User ${userToDelete.fullName} deleted permanently.`);
      setUserToDelete(null);
      if (selectedUser?.id === userToDelete.id) {
        setSelectedUser(null);
        setSelectedUserProfile(null);
      }
      const updated = await api.get('/admin/users');
      setUsersList(updated.data.users || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // ----------------------------------------------------
  // ORGANIZATION DETAILS HANDLER
  // ----------------------------------------------------
  const handleOpenOrgDetails = async (org: any) => {
    setOrgDetailsTab('OVERVIEW');
    try {
      const res = await api.get(`/admin/organizations/${encodeURIComponent(org.name)}`);
      setSelectedOrgDetails(res.data);
    } catch (e) {
      console.error('Failed to fetch organization details', e);
      toast.error('Failed to load organization details');
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgData.name.trim() || !newOrgData.domain.trim()) {
      toast.error('Organization Name and Domain are required.');
      return;
    }
    try {
      await api.post('/admin/organizations', newOrgData);
      toast.success('Organization registered successfully');
      setShowCreateOrgModal(false);
      setNewOrgData({ name: '', domain: '', contactEmail: '' });
      const updated = await api.get('/admin/organizations');
      setOrganizationsList(updated.data.organizations || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create organization');
    }
  };

  const handleToggleOrgStatus = async (orgId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await api.put(`/admin/organizations/${orgId}/status`, { status: nextStatus });
      toast.success(`Organization status changed to ${nextStatus}`);
      const updated = await api.get('/admin/organizations');
      setOrganizationsList(updated.data.organizations || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update organization status');
    }
  };

  // ----------------------------------------------------
  // POLICY GOVERNANCE ACTIONS
  // ----------------------------------------------------
  const handleTogglePolicyStatus = async (policyId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.put(`/admin/policies/${policyId}/status`, { status: nextStatus });
      toast.success(`Policy status updated to ${nextStatus}`);
      const updated = await api.get('/admin/policies');
      setPoliciesList(updated.data.policies || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update policy status');
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyData.name.trim()) {
      toast.error('Policy name is required');
      return;
    }
    try {
      let parsedRules = {};
      try {
        parsedRules = JSON.parse(newPolicyData.rules);
      } catch (jsonErr) {
        toast.error('Invalid JSON syntax in policy rules');
        return;
      }
      await api.post('/admin/policies', {
        name: newPolicyData.name,
        description: newPolicyData.description,
        rules: parsedRules,
        organizationId: newPolicyData.organizationId || undefined
      });
      toast.success('Platform policy created successfully');
      setShowCreatePolicyModal(false);
      setNewPolicyData({
        name: '',
        description: '',
        organizationId: '',
        rules: '{\n  "allowAiFeatures": true,\n  "allowDrawingGeneration": true,\n  "requireDualApproval": false\n}'
      });
      const updated = await api.get('/admin/policies');
      setPoliciesList(updated.data.policies || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create policy');
    }
  };

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;
    try {
      let parsedRules = {};
      try {
        parsedRules = typeof selectedPolicy.rules === 'string' ? JSON.parse(selectedPolicy.rules) : selectedPolicy.rules;
      } catch (jsonErr) {
        toast.error('Invalid JSON syntax in policy rules');
        return;
      }
      await api.put(`/admin/policies/${selectedPolicy.id}`, {
        name: selectedPolicy.name,
        description: selectedPolicy.description,
        rules: parsedRules
      });
      toast.success('Policy updated successfully');
      setShowEditPolicyModal(false);
      setSelectedPolicy(null);
      const updated = await api.get('/admin/policies');
      setPoliciesList(updated.data.policies || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update policy');
    }
  };

  const handleToggleNotification = async (notifId: string) => {
    try {
      await api.put(`/admin/notifications/${notifId}/toggle`);
      const updated = await api.get('/admin/notifications?limit=50');
      setNotificationsData(updated.data);
      toast.success('Notification status toggled');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to toggle notification');
    }
  };

  // ----------------------------------------------------
  // ROLES & PERMISSIONS ACTIONS
  // ----------------------------------------------------
  const handleToggleRolePermission = (roleName: string, permId: string) => {
    if (!isEditingPermissions) return;
    setPendingPermissionChanges((prev) => {
      const current = prev[roleName] || [];
      const updated = current.includes(permId)
        ? current.filter((p) => p !== permId)
        : [...current, permId];
      return { ...prev, [roleName]: updated };
    });
  };

  const handleSaveRolePermissions = async () => {
    setSavingPermissions(true);
    try {
      const rolesToUpdate = Object.keys(pendingPermissionChanges);
      for (const roleName of rolesToUpdate) {
        await api.put(`/admin/roles/${roleName}/permissions`, {
          permissions: pendingPermissionChanges[roleName]
        });
      }
      toast.success('Roles and permissions matrix saved successfully!');
      setIsEditingPermissions(false);
      setShowConfirmSavePermissions(false);
      const updatedPerms = await api.get('/admin/roles-permissions');
      setRolePermissions(updatedPerms.data.rolePermissions || {});
      setPendingPermissionChanges(updatedPerms.data.rolePermissions || {});
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCancelPermissionEdits = () => {
    setPendingPermissionChanges(rolePermissions);
    setIsEditingPermissions(false);
  };

  // ----------------------------------------------------
  // VERIFICATION ACTIONS
  // ----------------------------------------------------
  const handleProcessVerification = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedVerification) return;
    try {
      await api.post(`/admin/verifications/${selectedVerification.id}/decision`, {
        decision,
        notes: decisionNotes || (decision === 'APPROVE' ? 'Approved by Platform Administrator' : 'Application Rejected')
      });
      toast.success(decision === 'APPROVE' ? 'Application approved successfully' : 'Application rejected');
      setVerificationDecisionModal(false);
      setSelectedVerification(null);
      setDecisionNotes('');
      const updated = await api.get('/admin/verifications');
      setVerificationsList(updated.data.applications || []);
      const dash = await api.get('/admin/dashboard');
      setMetrics(dash.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to process verification');
    }
  };

  // ----------------------------------------------------
  // ASSIGN REVIEWER & BROADCAST ACTIONS
  // ----------------------------------------------------
  const handleAssignReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !assignReviewerData.username.trim()) {
      toast.error('Please enter a valid supervisor username.');
      return;
    }
    try {
      await api.put(`/admin/projects/${selectedProject.id}/assign`, assignReviewerData);
      toast.success(`Assigned ${assignReviewerData.username} to project.`);
      setShowAssignModal(false);
      setAssignReviewerData({ username: '', role: 'GUIDE' });
      setSelectedProject(null);
      const updated = await api.get('/admin/projects');
      setProjectsList(updated.data.projects || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to assign reviewer');
    }
  };

  const handleBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastData.title.trim() || !broadcastData.message.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    try {
      const res = await api.post('/admin/notifications/broadcast', broadcastData);
      toast.success(res.data.message || 'Notification broadcasted successfully.');
      setShowBroadcastModal(false);
      setBroadcastData({ title: '', message: '', type: 'SYSTEM', targetRole: 'ALL' });
      const updatedNotifs = await api.get('/admin/notifications?limit=50');
      setNotificationsData(updatedNotifs.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to broadcast notification');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings', systemSettings);
      toast.success('Platform security & authentication settings saved.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update settings');
    }
  };

  // ----------------------------------------------------
  // CALCULATED KPIs & BADGES
  // ----------------------------------------------------
  const unreadNotifsCount = notificationsData.notifications.filter((n) => !n.isRead).length;
  const pendingVerifsCount = verificationsList.filter((v) => v.status === 'PENDING').length;
  const pendingReviewsCount = reviewsData?.metrics?.pendingReviews || 0;

  // ----------------------------------------------------
  // SIDEBAR NAVIGATION (REAL MODULES ONLY)
  // ----------------------------------------------------
  const navGroups = [
    {
      group: 'PLATFORM ADMIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users, badge: usersList.length > 0 ? usersList.length : undefined },
        { id: 'organizations', label: 'Organizations', icon: Building2, badge: organizationsList.length > 0 ? organizationsList.length : undefined },
        { id: 'projects', label: 'Projects', icon: FolderKanban, badge: projectsList.length > 0 ? projectsList.length : undefined },
        { id: 'reviews', label: 'Reviews', icon: Scale, badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined },
      ]
    },
    {
      group: 'GOVERNANCE & BILLING',
      items: [
        { id: 'policies', label: 'Policies', icon: Shield, badge: policiesList.length > 0 ? policiesList.length : undefined },
        { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, badge: subscriptionsData.subscriptions.length > 0 ? subscriptionsData.subscriptions.length : undefined },
        { id: 'payments', label: 'Payments', icon: DollarSign, badge: paymentsList.length > 0 ? paymentsList.length : undefined },
        { id: 'entitlements', label: 'Entitlements', icon: Sparkles, badge: entitlementsList.length > 0 ? entitlementsList.length : undefined },
      ]
    },
    {
      group: 'SECURITY & OPS',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined },
        { id: 'activity', label: 'Audit Logs', icon: Activity },
        { id: 'verifications', label: 'Verifications', icon: UserCheck, badge: pendingVerifsCount > 0 ? pendingVerifsCount : undefined },
        { id: 'roles', label: 'Roles & RBAC', icon: ShieldAlert },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ]
    }
  ];

  // ----------------------------------------------------
  // FILTERED DATA VIEWS
  // ----------------------------------------------------
  const filteredPolicies = policiesList.filter((p) => {
    const matchOrg = policyOrgFilter === 'ALL' || p.organizationId === policyOrgFilter;
    const matchStatus = policyStatusFilter === 'ALL' || p.status === policyStatusFilter;
    const matchSearch =
      !policySearchTerm.trim() ||
      p.name.toLowerCase().includes(policySearchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(policySearchTerm.toLowerCase()));
    return matchOrg && matchStatus && matchSearch;
  });

  const filteredSubscriptions = subscriptionsData.subscriptions.filter((s) => {
    if (subStatusFilter === 'ALL') return true;
    return s.status.toUpperCase() === subStatusFilter.toUpperCase();
  });

  const filteredPayments = paymentsList.filter((p) => {
    const matchStatus = paymentStatusFilter === 'ALL' || p.status.toUpperCase() === paymentStatusFilter.toUpperCase();
    const matchSearch =
      !paymentSearchTerm.trim() ||
      (p.organizationName && p.organizationName.toLowerCase().includes(paymentSearchTerm.toLowerCase())) ||
      (p.razorpayPaymentId && p.razorpayPaymentId.toLowerCase().includes(paymentSearchTerm.toLowerCase())) ||
      p.id.toLowerCase().includes(paymentSearchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filteredEntitlements = entitlementsList.filter((e) => {
    if (entitlementOrgFilter === 'ALL') return true;
    return e.organizationId === entitlementOrgFilter;
  });
  const filteredUsers = usersList.filter((u) => {
    const matchRole = userRoleFilter === 'ALL' || u.role.toLowerCase() === userRoleFilter.toLowerCase();
    const matchStatus =
      userStatusFilter === 'ALL' ||
      (userStatusFilter === 'ACTIVE' && u.isActive) ||
      (userStatusFilter === 'SUSPENDED' && !u.isActive);
    const matchSearch =
      !userSearchTerm.trim() ||
      u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.institution && u.institution.toLowerCase().includes(userSearchTerm.toLowerCase()));
    return matchRole && matchStatus && matchSearch;
  });

  const filteredProjects = projectsList.filter((p) => {
    const matchStage = projectStageFilter === 'ALL' || p.stage === projectStageFilter;
    const matchSearch =
      !projectSearchTerm.trim() ||
      p.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
      p.inventor.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
      p.organization.toLowerCase().includes(projectSearchTerm.toLowerCase());
    return matchStage && matchSearch;
  });

  const filteredNotifications = notificationsData.notifications.filter((n) => {
    const matchRead = notifFilter === 'ALL' || (notifFilter === 'UNREAD' && !n.isRead) || (notifFilter === 'READ' && n.isRead);
    const matchType = notifTypeFilter === 'ALL' || n.type.toUpperCase() === notifTypeFilter.toUpperCase();
    return matchRead && matchType;
  });

  const stageDist = metrics?.stageDistribution || {
    IDEA: 0,
    LITERATURE_REVIEW: 0,
    DOCUMENTATION: 0,
    PROTOTYPE: 0,
    FORMS_PREPARATION: 0,
    GUIDE_REVIEW: 0,
    PATENT_EXPERT_REVIEW: 0,
    FILING_READY: 0,
    FILED: 0
  };

  const totalStageProjects: number =
    (Object.values(stageDist) as number[]).reduce((a: number, b: number) => a + Number(b || 0), 0) ||
    projectsList.length ||
    1;

  // Group permissions by category for the matrix
  const permissionsByCategory: Record<string, any[]> = {};
  allPermissionsList.forEach((p) => {
    if (!permissionsByCategory[p.category]) {
      permissionsByCategory[p.category] = [];
    }
    permissionsByCategory[p.category].push(p);
  });

  const ROLES_LIST = [
    { key: 'Admin', label: 'Platform Admin' },
    { key: 'OrgAdmin', label: 'Organization Admin' },
    { key: 'Inventor', label: 'Inventor' },
    { key: 'CoInventor', label: 'Co-Inventor' },
    { key: 'Guide', label: 'Guide' },
    { key: 'PatentExpert', label: 'Patent Expert' },
  ];

  return (
    <div className="h-screen bg-[#F7F9F8] text-[#253330] flex overflow-hidden font-sans antialiased">
      {/* ==================================================== */}
      {/* 1. ADMIN SIDEBAR */}
      {/* ==================================================== */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-[#E5EBE8] flex flex-col h-screen shrink-0 z-40 transition-all duration-300 shadow-3xs`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#E5EBE8]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-[#315C55] flex items-center justify-center text-white shadow-3xs shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="font-black text-sm tracking-tight text-[#253330] block leading-none">
                  PatentHub-AI
                </span>
                <span className="text-[10px] text-[#6F8F88] font-bold uppercase tracking-wider block mt-0.5">
                  Platform Admin
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              {!sidebarCollapsed && (
                <span className="px-3 text-[10px] font-black uppercase tracking-wider text-[#71807C] block mb-1">
                  {grp.group}
                </span>
              )}
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#315C55] text-white shadow-3xs'
                        : 'text-[#5C6B67] hover:bg-[#F0F4F2] hover:text-[#253330]'
                    }`}
                    title={item.label}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!sidebarCollapsed && item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#E5EBE8] text-[#315C55]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-[#E5EBE8]">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-[#F7F9F8]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#315C55] text-white font-black flex items-center justify-center text-xs shrink-0">
                PA
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <span className="font-extrabold text-xs text-[#253330] block truncate">
                    Platform Admin
                  </span>
                  <span className="text-[10px] text-[#71807C] block truncate">
                    Master Superuser
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[#71807C] hover:text-[#DC2626] hover:bg-rose-50 transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ==================================================== */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#E5EBE8] flex items-center justify-between px-6 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-[#71807C] hover:text-[#253330] hover:bg-[#F0F4F2] rounded-xl transition cursor-pointer"
              title="Toggle sidebar"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-black text-[#253330] capitalize">
                {activeNav.replace('-', ' ')}
              </h2>
              <span className="text-[10px] text-[#71807C] font-semibold">
                PatentHub-AI Platform Governance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="relative hidden sm:block w-64">
              <Search className="w-3.5 h-3.5 text-[#8A9B96] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search platform..."
                value={searchGlobal}
                onChange={(e) => setSearchGlobal(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs text-[#253330] placeholder-[#8A9B96] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#315C55]"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchAllAdminData}
              className="p-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] border border-[#E5EBE8] rounded-xl text-[#5C6B67] transition cursor-pointer"
              title="Refresh all metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#315C55]' : ''}`} />
            </button>

            {/* Live Notifications Bell */}
            <button
              onClick={() => setActiveNav('notifications')}
              className="p-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] border border-[#E5EBE8] rounded-xl text-[#5C6B67] relative transition cursor-pointer"
              title="View Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#315C55] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Main Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* ==================================================== */}
          {/* VIEW: DASHBOARD OVERVIEW */}
          {/* ==================================================== */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              {/* Top Greeting */}
              <div className="p-6 sm:p-8 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#6F8F88]">
                      All Systems Operational
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#253330] tracking-tight">
                    Good morning, Admin 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-[#71807C] font-medium mt-0.5">
                    Platform Administration & Security Command Center
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-2xl flex items-center gap-2 text-xs font-bold text-[#5C6B67]">
                    <Calendar className="w-3.5 h-3.5 text-[#8A9B96]" />
                    <span>
                      {new Date().toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowBroadcastModal(true)}
                    className="px-4 py-2 bg-[#315C55] hover:bg-[#254640] text-white rounded-2xl text-xs font-bold transition shadow-3xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast</span>
                  </button>
                </div>
              </div>

              {/* 12 Real Database Platform KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* Total Users */}
                <div
                  onClick={() => setActiveNav('users')}
                  className="p-4 rounded-2xl bg-white border border-[#E5EBE8] shadow-3xs space-y-1.5 cursor-pointer hover:border-[#315C55] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71807C]">Total Users</span>
                    <Users className="w-4 h-4 text-[#315C55]" />
                  </div>
                  <p className="text-2xl font-black text-[#253330] font-mono">
                    {metrics?.kpis?.totalUsers ?? usersList.length}
                  </p>
                  <span className="text-[10px] text-[#6F8F88] font-bold block">Registered accounts</span>
                </div>

                {/* Active Users */}
                <div
                  onClick={() => setActiveNav('users')}
                  className="p-4 rounded-2xl bg-white border border-[#E5EBE8] shadow-3xs space-y-1.5 cursor-pointer hover:border-[#315C55] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71807C]">Active Users</span>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-emerald-700 font-mono">
                    {metrics?.kpis?.activeUsers ?? usersList.filter((u) => u.isActive).length}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold block">Active & verified</span>
                </div>

                {/* Total Organizations */}
                <div
                  onClick={() => setActiveNav('organizations')}
                  className="p-4 rounded-2xl bg-white border border-[#E5EBE8] shadow-3xs space-y-1.5 cursor-pointer hover:border-[#315C55] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71807C]">Total Orgs</span>
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-black text-[#253330] font-mono">
                    {metrics?.kpis?.totalOrganizations ?? organizationsList.length}
                  </p>
                  <span className="text-[10px] text-[#6F8F88] font-bold block">All institutions</span>
                </div>

                {/* Active Organizations */}
                <div
                  onClick={() => setActiveNav('organizations')}
                  className="p-4 rounded-2xl bg-white border border-[#E5EBE8] shadow-3xs space-y-1.5 cursor-pointer hover:border-[#315C55] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71807C]">Active Orgs</span>
                    <Building2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-emerald-700 font-mono">
                    {metrics?.kpis?.activeOrganizations ?? organizationsList.filter((o) => o.status === 'ACTIVE').length}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold block">Operating campuses</span>
                </div>

                {/* Total Projects */}
                <div
                  onClick={() => setActiveNav('projects')}
                  className="p-4 rounded-2xl bg-white border border-[#E5EBE8] shadow-3xs space-y-1.5 cursor-pointer hover:border-[#315C55] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71807C]">Total Projects</span>
                    <FolderKanban className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-black text-[#253330] font-mono">
                    {metrics?.kpis?.totalProjects ?? projectsList.length}
                  </p>
                  <span className="text-[10px] text-[#6F8F88] font-bold block">Patent workspaces</span>
                </div>

                {/* Active Projects */}
                <div
                  onClick={() => setActiveNav('projects')}
                  className="p-4 rounded-2xl bg-white border border-[#E5EBE8] shadow-3xs space-y-1.5 cursor-pointer hover:border-[#315C55] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71807C]">Active Projects</span>
                    <FolderKanban className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-emerald-700 font-mono">
                    {metrics?.kpis?.activeProjects ?? projectsList.length}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold block">In active pipeline</span>
                </div>

                {/* Pending Reviews */}
                <div
                  onClick={() => setActiveNav('reviews')}
                  className="p-4 rounded-2xl bg-white border border-[#E5EBE8] shadow-3xs space-y-1.5 cursor-pointer hover:border-[#315C55] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71807C]">Pending Reviews</span>
                    <Scale className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-2xl font-black text-amber-700 font-mono">
                    {metrics?.kpis?.pendingReviews ?? pendingReviewsCount}
                  </p>
                  <span className="text-[10px] text-amber-700 font-bold block">Awaiting decision</span>
                </div>

                {/* Completed Reviews */}
                <div
                  onClick={() => setActiveNav('reviews')}
                  className="p-4 rounded-2xl bg-white border border-[#E5EBE8] shadow-3xs space-y-1.5 cursor-pointer hover:border-[#315C55] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71807C]">Completed Reviews</span>
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-emerald-700 font-mono">
                    {metrics?.kpis?.completedReviews ?? 0}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold block">Approved / Finished</span>
                </div>

                {/* Filing Ready */}
                <div
                  onClick={() => setActiveNav('projects')}
                  className="p-4 rounded-2xl bg-white border border-[#E5EBE8] shadow-3xs space-y-1.5 cursor-pointer hover:border-[#315C55] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71807C]">Filing Ready</span>
                    <Shield className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-black text-indigo-700 font-mono">
                    {metrics?.kpis?.filingReadyProjects ?? (stageDist.FILING_READY || 0)}
                  </p>
                  <span className="text-[10px] text-indigo-700 font-bold block">Statutory clearance</span>
                </div>

                {/* Active Subscriptions */}
                <div
                  onClick={() => setActiveNav('subscriptions')}
                  className="p-4 rounded-2xl bg-white border border-[#E5EBE8] shadow-3xs space-y-1.5 cursor-pointer hover:border-[#315C55] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71807C]">Subscriptions</span>
                    <CreditCard className="w-4 h-4 text-[#315C55]" />
                  </div>
                  <p className="text-2xl font-black text-[#315C55] font-mono">
                    {metrics?.kpis?.activeSubscriptions ?? subscriptionsData.subscriptions.filter((s) => s.status.toUpperCase() === 'ACTIVE').length}
                  </p>
                  <span className="text-[10px] text-[#6F8F88] font-bold block">Active Pro plans</span>
                </div>

                {/* Trial Organizations */}
                <div
                  onClick={() => setActiveNav('subscriptions')}
                  className="p-4 rounded-2xl bg-white border border-[#E5EBE8] shadow-3xs space-y-1.5 cursor-pointer hover:border-[#315C55] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71807C]">Trial Orgs</span>
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-2xl font-black text-amber-700 font-mono">
                    {metrics?.kpis?.trialOrganizations ?? subscriptionsData.trials.filter((t) => t.status.toUpperCase() === 'ACTIVE').length}
                  </p>
                  <span className="text-[10px] text-amber-700 font-bold block">14-day free trials</span>
                </div>

                {/* Verifications */}
                <div
                  onClick={() => setActiveNav('verifications')}
                  className="p-4 rounded-2xl bg-white border border-[#E5EBE8] shadow-3xs space-y-1.5 cursor-pointer hover:border-[#315C55] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#71807C]">Verifications</span>
                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-black text-blue-700 font-mono">
                    {metrics?.kpis?.pendingVerifications ?? pendingVerifsCount}
                  </p>
                  <span className="text-[10px] text-blue-700 font-bold block">Awaiting review</span>
                </div>
              </div>

              {/* Distribution Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Distribution */}
                <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                        Project Stage Distribution
                      </h3>
                      <p className="text-[11px] text-[#71807C]">Real pipeline status across all inventions</p>
                    </div>
                    <button
                      onClick={() => setActiveNav('projects')}
                      className="text-xs font-bold text-[#315C55] hover:underline"
                    >
                      View All &gt;
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    {[
                      { label: 'Draft & Idea', count: stageDist.IDEA || 0, color: 'bg-slate-400' },
                      { label: 'Literature & Search', count: stageDist.LITERATURE_REVIEW || 0, color: 'bg-blue-500' },
                      { label: 'Documentation & Claims', count: stageDist.DOCUMENTATION || 0, color: 'bg-indigo-500' },
                      {
                        label: 'Under Review (Guide/Expert)',
                        count: (stageDist.GUIDE_REVIEW || 0) + (stageDist.PATENT_EXPERT_REVIEW || 0),
                        color: 'bg-amber-500'
                      },
                      { label: 'Filing Ready', count: stageDist.FILING_READY || 0, color: 'bg-emerald-500' },
                      { label: 'Completed & Filed', count: stageDist.FILED || 0, color: 'bg-[#315C55]' },
                    ].map((item) => {
                      const pct = Math.round((item.count / totalStageProjects) * 100);
                      return (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-[#5C6B67]">{item.label}</span>
                            <span className="text-[#253330] font-mono">
                              {item.count} <span className="text-[10px] text-[#71807C]">({pct}%)</span>
                            </span>
                          </div>
                          <div className="h-2 bg-[#F0F4F2] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.max(item.count > 0 ? 6 : 0, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* User Role Distribution */}
                <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                        User Role Distribution
                      </h3>
                      <p className="text-[11px] text-[#71807C]">Authenticated platform participants</p>
                    </div>
                    <button
                      onClick={() => setActiveNav('users')}
                      className="text-xs font-bold text-[#315C55] hover:underline"
                    >
                      Manage Users &gt;
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    {rolesStats.map((r) => {
                      const totalU = usersList.length || 1;
                      const pct = Math.round((r.usersCount / totalU) * 100);
                      return (
                        <div key={r.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-[#5C6B67]">{r.displayName}</span>
                            <span className="text-[#253330] font-mono">
                              {r.usersCount} <span className="text-[10px] text-[#71807C]">({pct}%)</span>
                            </span>
                          </div>
                          <div className="h-2 bg-[#F0F4F2] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#315C55] rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(r.usersCount > 0 ? 6 : 0, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Platform Activity */}
              <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                      Recent Platform Activity
                    </h3>
                    <p className="text-[11px] text-[#71807C]">Live events logged across all workspaces</p>
                  </div>
                  <button
                    onClick={() => setActiveNav('activity')}
                    className="text-xs font-bold text-[#315C55] hover:underline"
                  >
                    View All Audit Logs &gt;
                  </button>
                </div>

                {metrics?.recentActivities && metrics.recentActivities.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">User</th>
                          <th className="py-2.5 px-3">Organization</th>
                          <th className="py-2.5 px-3">Action</th>
                          <th className="py-2.5 px-3">Resource</th>
                          <th className="py-2.5 px-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EBE8]">
                        {metrics.recentActivities.slice(0, 6).map((act: any) => (
                          <tr key={act.id} className="hover:bg-[#F7F9F8] transition">
                            <td className="py-3 px-3 font-bold text-[#253330] flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#315C55] shrink-0" />
                              <span>{act.user}</span>
                            </td>
                            <td className="py-3 px-3 text-[#5C6B67]">{act.organization || 'Independent'}</td>
                            <td className="py-3 px-3 font-semibold text-[#253330]">{act.action}</td>
                            <td className="py-3 px-3 text-[#71807C] truncate max-w-xs">{act.target}</td>
                            <td className="py-3 px-3 font-mono text-[11px] text-[#71807C]">{act.date || act.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#F7F9F8] rounded-2xl border border-dashed border-[#E5EBE8]">
                    <Activity className="w-8 h-8 text-[#8A9B96] mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#71807C]">No activity logs recorded yet</p>
                  </div>
                )}
              </div>

              {/* System Status Section */}
              <div className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                      System Status
                    </h3>
                    <p className="text-[11px] text-[#71807C]">Live infrastructure health and microservice connectivity</p>
                  </div>
                  <span className="text-[10px] font-mono text-[#71807C]">
                    Updated: {systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleTimeString() : 'Live'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                  {/* Backend */}
                  <div className="p-3 bg-[#F7F9F8] rounded-2xl border border-[#E5EBE8] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-[#315C55]" />
                      <div>
                        <span className="text-[10px] font-bold text-[#71807C] block">Backend</span>
                        <span className="text-xs font-black text-[#253330]">Express API</span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>

                  {/* Database */}
                  <div className="p-3 bg-[#F7F9F8] rounded-2xl border border-[#E5EBE8] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="text-[10px] font-bold text-[#71807C] block">PostgreSQL</span>
                        <span className="text-xs font-black text-[#253330]">Primary DB</span>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      systemHealth?.database === 'CONNECTED' || metrics?.systemStatus?.database === 'CONNECTED'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        systemHealth?.database === 'CONNECTED' || metrics?.systemStatus?.database === 'CONNECTED'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`} />
                      {systemHealth?.database === 'CONNECTED' || metrics?.systemStatus?.database === 'CONNECTED' ? 'Connected' : 'Status unavailable'}
                    </span>
                  </div>

                  {/* AI Service */}
                  <div className="p-3 bg-[#F7F9F8] rounded-2xl border border-[#E5EBE8] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-600" />
                      <div>
                        <span className="text-[10px] font-bold text-[#71807C] block">AI Service</span>
                        <span className="text-xs font-black text-[#253330]">Gemini Pro</span>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      systemHealth?.aiService === 'AVAILABLE' || metrics?.systemStatus?.aiService === 'AVAILABLE'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        systemHealth?.aiService === 'AVAILABLE' || metrics?.systemStatus?.aiService === 'AVAILABLE'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`} />
                      {systemHealth?.aiService === 'AVAILABLE' || metrics?.systemStatus?.aiService === 'AVAILABLE' ? 'Available' : 'Status unavailable'}
                    </span>
                  </div>

                  {/* Cloud Storage */}
                  <div className="p-3 bg-[#F7F9F8] rounded-2xl border border-[#E5EBE8] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-cyan-600" />
                      <div>
                        <span className="text-[10px] font-bold text-[#71807C] block">Storage</span>
                        <span className="text-xs font-black text-[#253330]">Cloudinary</span>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      systemHealth?.cloudStorage === 'AVAILABLE' || metrics?.systemStatus?.cloudStorage === 'AVAILABLE'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        systemHealth?.cloudStorage === 'AVAILABLE' || metrics?.systemStatus?.cloudStorage === 'AVAILABLE'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`} />
                      {systemHealth?.cloudStorage === 'AVAILABLE' || metrics?.systemStatus?.cloudStorage === 'AVAILABLE' ? 'Available' : 'Status unavailable'}
                    </span>
                  </div>

                  {/* Payment */}
                  <div className="p-3 bg-[#F7F9F8] rounded-2xl border border-[#E5EBE8] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <div>
                        <span className="text-[10px] font-bold text-[#71807C] block">Payment</span>
                        <span className="text-xs font-black text-[#253330]">Razorpay</span>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      systemHealth?.payment === 'AVAILABLE' || metrics?.systemStatus?.payment === 'AVAILABLE'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        systemHealth?.payment === 'AVAILABLE' || metrics?.systemStatus?.payment === 'AVAILABLE'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`} />
                      {systemHealth?.payment === 'AVAILABLE' || metrics?.systemStatus?.payment === 'AVAILABLE' ? 'Available' : 'Status unavailable'}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="p-3 bg-[#F7F9F8] rounded-2xl border border-[#E5EBE8] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-rose-600" />
                      <div>
                        <span className="text-[10px] font-bold text-[#71807C] block">Email</span>
                        <span className="text-xs font-black text-[#253330]">SMTP Mailer</span>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      systemHealth?.email === 'AVAILABLE' || metrics?.systemStatus?.email === 'AVAILABLE'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        systemHealth?.email === 'AVAILABLE' || metrics?.systemStatus?.email === 'AVAILABLE'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`} />
                      {systemHealth?.email === 'AVAILABLE' || metrics?.systemStatus?.email === 'AVAILABLE' ? 'Available' : 'Status unavailable'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: USERS MODULE (WITH COMPLETE USER PROFILE VIEW) */}
          {/* ==================================================== */}
          {activeNav === 'users' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <div>
                  <h1 className="text-xl font-black text-[#253330] tracking-tight">Platform Users</h1>
                  <p className="text-xs text-[#71807C]">
                    Manage accounts, roles, institutions, and inspect full user profiles
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-[#8A9B96] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="Inventor">Inventor</option>
                    <option value="CoInventor">Co-Inventor</option>
                    <option value="Guide">Guide</option>
                    <option value="PatentExpert">Patent Expert</option>
                    <option value="OrgAdmin">Org Admin</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl overflow-hidden shadow-3xs">
                {filteredUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Organization</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Projects</th>
                          <th className="py-3 px-4">Joined</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EBE8]">
                        {filteredUsers.map((u, index) => (
                          <tr key={u.id} className="hover:bg-[#F7F9F8] transition">
                            <td className="py-3.5 px-4 text-center font-mono text-[#71807C] font-bold">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <div
                                onClick={() => handleOpenUserProfile(u)}
                                className="flex items-center gap-2.5 cursor-pointer group"
                              >
                                <div className="w-7 h-7 rounded-xl bg-[#DDEBE6] text-[#315C55] font-black flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition">
                                  {u.fullName[0]}
                                </div>
                                <div>
                                  <span className="font-bold text-[#253330] block group-hover:text-[#315C55] transition">
                                    {u.fullName}
                                  </span>
                                  <span className="text-[10px] text-[#71807C]">@{u.username}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-medium text-slate-700">{u.email}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E5EBE8] text-[#315C55]">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#5C6B67] truncate max-w-[150px]">
                              {u.institution || 'Independent'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {u.isActive ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-[#253330]">
                              {u.projectsCount || 0}
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-[#71807C]">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenUserProfile(u)}
                                  className="px-2.5 py-1 bg-[#F0F4F2] hover:bg-[#DDEBE6] text-[#315C55] rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                                  title="View Complete User Profile"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Profile</span>
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    u.isActive
                                      ? 'hover:bg-amber-50 text-amber-700'
                                      : 'hover:bg-emerald-50 text-emerald-700'
                                  }`}
                                  title={u.isActive ? 'Suspend User' : 'Activate User'}
                                >
                                  {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                                  title="Delete User Permanently"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Users className="w-10 h-10 text-[#8A9B96] mx-auto mb-2" />
                    <h4 className="text-sm font-black text-[#253330]">No Users Found</h4>
                    <p className="text-xs text-[#71807C] mt-1">No users match your selected filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: ORGANIZATIONS MODULE */}
          {/* ==================================================== */}
          {activeNav === 'organizations' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <div>
                  <h1 className="text-xl font-black text-[#253330] tracking-tight">Organizations & Campuses</h1>
                  <p className="text-xs text-[#71807C]">
                    Academic institutions, corporate labs, and research centers
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateOrgModal(true)}
                  className="px-4 py-2 bg-[#315C55] hover:bg-[#254640] text-white rounded-2xl text-xs font-bold transition shadow-3xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Organization</span>
                </button>
              </div>

              {/* Organizations Grid */}
              {organizationsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {organizationsList.map((org, index) => (
                    <div
                      key={org.id || index}
                      onClick={() => handleOpenOrgDetails(org)}
                      className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-4 flex flex-col justify-between hover:border-[#315C55] transition cursor-pointer group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-2xl bg-[#DDEBE6] text-[#315C55] flex items-center justify-center font-black text-sm group-hover:scale-105 transition">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                            {org.status}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-[#253330] truncate group-hover:text-[#315C55] transition">
                            {org.name}
                          </h3>
                          <p className="text-xs text-[#71807C] font-mono">{org.domain}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#E5EBE8] text-center text-xs">
                        <div>
                          <span className="text-[10px] text-[#71807C] block font-bold">Members</span>
                          <span className="font-black text-[#253330] font-mono">{org.membersCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#71807C] block font-bold">Projects</span>
                          <span className="font-black text-[#253330] font-mono">{org.projectsCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#71807C] block font-bold">Guides</span>
                          <span className="font-black text-[#253330] font-mono">{org.guidesCount}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#71807C]">
                        <span className="truncate max-w-[180px]">Contact: {org.contactEmail}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleOrgStatus(org.id, org.status);
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              org.status === 'ACTIVE'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                          <span className="text-xs font-bold text-[#315C55] group-hover:underline">
                            Details →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#E5EBE8] shadow-3xs">
                  <Building2 className="w-10 h-10 text-[#8A9B96] mx-auto mb-2" />
                  <h4 className="text-sm font-black text-[#253330]">No organizations registered yet.</h4>
                  <p className="text-xs text-[#71807C] mt-1">
                    Click the "Register Organization" button above to add your first institution.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: PROJECTS MODULE */}
          {/* ==================================================== */}
          {activeNav === 'projects' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <div>
                  <h1 className="text-xl font-black text-[#253330] tracking-tight">Platform Projects Ecosystem</h1>
                  <p className="text-xs text-[#71807C]">
                    Monitor innovation stages, claim counts, filing readiness, and supervisor assignments
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-[#8A9B96] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={projectSearchTerm}
                      onChange={(e) => setProjectSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <select
                    value={projectStageFilter}
                    onChange={(e) => setProjectStageFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer"
                  >
                    <option value="ALL">All Stages</option>
                    <option value="IDEA">Idea</option>
                    <option value="LITERATURE_REVIEW">Search</option>
                    <option value="DOCUMENTATION">Documentation</option>
                    <option value="GUIDE_REVIEW">Guide Review</option>
                    <option value="PATENT_EXPERT_REVIEW">Expert Review</option>
                    <option value="FILING_READY">Filing Ready</option>
                    <option value="FILED">Filed</option>
                  </select>
                </div>
              </div>

              {/* Projects Table */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl overflow-hidden shadow-3xs">
                {filteredProjects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">Project</th>
                          <th className="py-3 px-4">Lead Inventor</th>
                          <th className="py-3 px-4">Organization</th>
                          <th className="py-3 px-4">Stage</th>
                          <th className="py-3 px-4">Filing Readiness</th>
                          <th className="py-3 px-4">Guide</th>
                          <th className="py-3 px-4">Expert</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EBE8]">
                        {filteredProjects.map((p, index) => (
                          <tr key={p.id} className="hover:bg-[#F7F9F8] transition">
                            <td className="py-3.5 px-4 text-center font-mono text-[#71807C] font-bold">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-extrabold text-[#253330] block truncate max-w-[200px]">
                                {p.title}
                              </span>
                              <span className="text-[10px] text-[#71807C]">{p.category || 'Invention'}</span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#5C6B67]">{p.inventor}</td>
                            <td className="py-3.5 px-4 text-[#71807C] truncate max-w-[130px]">{p.organization}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E5EBE8] text-[#315C55]">
                                {p.stage.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-1 w-24">
                                <div className="flex justify-between text-[10px] font-mono font-bold">
                                  <span>{p.readinessScore}%</span>
                                </div>
                                <div className="h-1.5 bg-[#F0F4F2] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${p.readinessScore}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-[#5C6B67]">{p.guide}</td>
                            <td className="py-3.5 px-4 text-[#5C6B67]">{p.expert}</td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedProject(p);
                                    setShowAssignModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-[#F0F4F2] hover:bg-[#DDEBE6] text-[#315C55] rounded-xl text-[11px] font-bold transition cursor-pointer"
                                >
                                  Assign
                                </button>
                                <button
                                  onClick={() => navigate(`/dashboard/projects/${p.id}`)}
                                  className="p-1.5 hover:bg-[#DDEBE6] text-[#315C55] rounded-lg transition cursor-pointer"
                                  title="Open Workspace"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <FolderKanban className="w-10 h-10 text-[#8A9B96] mx-auto mb-2" />
                    <h4 className="text-sm font-black text-[#253330]">No Projects Found</h4>
                    <p className="text-xs text-[#71807C] mt-1">No projects match your selected filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: ROLES & PERMISSIONS MODULE (EDITABLE RBAC MATRIX) */}
          {/* ==================================================== */}
          {activeNav === 'roles' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <div>
                  <h1 className="text-xl font-black text-[#253330] tracking-tight">Roles & Permissions (RBAC)</h1>
                  <p className="text-xs text-[#71807C]">
                    View and customize granular permission capabilities across platform roles
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingPermissions ? (
                    <button
                      onClick={() => setIsEditingPermissions(true)}
                      className="px-4 py-2 bg-[#315C55] hover:bg-[#254640] text-white rounded-2xl text-xs font-bold transition shadow-3xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Permissions</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancelPermissionEdits}
                        className="px-3.5 py-2 bg-[#F0F4F2] hover:bg-[#E5EBE8] text-[#5C6B67] rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={() => setShowConfirmSavePermissions(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-3xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Roles Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rolesStats.map((r) => {
                  const permsCount = (pendingPermissionChanges[r.name] || rolePermissions[r.name] || []).length;
                  return (
                    <div key={r.name} className="p-6 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-[#253330]">{r.displayName}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E5EBE8] text-[#315C55]">
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#71807C] leading-relaxed">{r.description}</p>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5EBE8]">
                        <span className="font-bold text-[#5C6B67]">{r.usersCount} Active Users</span>
                        <span className="font-mono font-extrabold text-[#315C55]">{permsCount} Permissions</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comprehensive Policy Matrix Table */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl p-6 shadow-3xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                      RBAC Permission Matrix
                    </h3>
                    <p className="text-[11px] text-[#71807C]">
                      {isEditingPermissions
                        ? 'Click checkboxes to grant or revoke specific role permissions, then click Save Changes.'
                        : 'Granular capabilities mapped to backend Express policy guards.'}
                    </p>
                  </div>
                  {isEditingPermissions && (
                    <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[11px] font-bold animate-pulse">
                      ⚡ Editing Mode Active
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Permission</th>
                        {ROLES_LIST.map((r) => (
                          <th key={r.key} className="py-3 px-4 text-center">
                            {r.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EBE8]">
                      {Object.keys(permissionsByCategory).map((categoryKey) => (
                        <React.Fragment key={categoryKey}>
                          <tr className="bg-[#F7F9F8]">
                            <td
                              colSpan={ROLES_LIST.length + 1}
                              className="py-2 px-4 font-black text-[10px] uppercase tracking-wider text-[#315C55]"
                            >
                              📂 {categoryKey.replace('_', ' ')} PERMISSIONS
                            </td>
                          </tr>
                          {permissionsByCategory[categoryKey].map((perm) => (
                            <tr key={perm.id} className="hover:bg-[#F7F9F8]/60 transition">
                              <td className="py-2.5 px-4">
                                <span className="font-bold text-[#253330] block">{perm.name}</span>
                                <span className="text-[10px] text-[#71807C]">{perm.description}</span>
                              </td>
                              {ROLES_LIST.map((r) => {
                                const currentPerms = isEditingPermissions
                                  ? pendingPermissionChanges[r.key] || []
                                  : rolePermissions[r.key] || [];
                                const hasPerm = currentPerms.includes(perm.id);

                                return (
                                  <td key={r.key} className="py-2.5 px-4 text-center">
                                    {isEditingPermissions ? (
                                      <input
                                        type="checkbox"
                                        checked={hasPerm}
                                        onChange={() => handleToggleRolePermission(r.key, perm.id)}
                                        className="w-4 h-4 rounded text-[#315C55] focus:ring-[#315C55] cursor-pointer"
                                      />
                                    ) : hasPerm ? (
                                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                                    ) : (
                                      <X className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: VERIFICATION REQUESTS MODULE */}
          {/* ==================================================== */}
          {activeNav === 'verifications' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <div>
                  <h1 className="text-xl font-black text-[#253330] tracking-tight">
                    Verification Requests Trust Layer
                  </h1>
                  <p className="text-xs text-[#71807C]">
                    Review and verify credentials for Guide and Patent Expert applicants
                  </p>
                </div>
              </div>

              {/* Verification Applications Table */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl overflow-hidden shadow-3xs">
                {verificationsList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">Applicant</th>
                          <th className="py-3 px-4">Role Requested</th>
                          <th className="py-3 px-4">Organization</th>
                          <th className="py-3 px-4">Specialization</th>
                          <th className="py-3 px-4">Official Email</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Submitted</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EBE8]">
                        {verificationsList.map((app, index) => (
                          <tr key={app.id} className="hover:bg-[#F7F9F8] transition">
                            <td className="py-3.5 px-4 text-center font-mono text-[#71807C] font-bold">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#253330]">{app.applicantName}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E5EBE8] text-[#315C55]">
                                {app.roleApplied}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#5C6B67]">{app.organization}</td>
                            <td className="py-3.5 px-4 text-[#71807C]">{app.specialization}</td>
                            <td className="py-3.5 px-4 text-xs font-medium text-slate-700">{app.email}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  app.status === 'VERIFIED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : app.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {app.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-[#71807C]">
                              {new Date(app.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedVerification(app)}
                                  className="px-2.5 py-1 bg-[#F0F4F2] hover:bg-[#DDEBE6] text-[#315C55] rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                                  title="Review Application"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Review</span>
                                </button>
                                {app.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedVerification(app);
                                        handleProcessVerification('APPROVE');
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition shadow-3xs cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedVerification(app);
                                        setVerificationDecisionModal(true);
                                      }}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold transition shadow-3xs cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <UserCheck className="w-10 h-10 text-[#8A9B96] mx-auto mb-2" />
                    <h4 className="text-sm font-black text-[#253330]">No Verification Requests</h4>
                    <p className="text-xs text-[#71807C] mt-1">
                      There are no pending applications requiring verification.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: REVIEWS / MODERATION MODULE */}
          {/* ==================================================== */}
          {activeNav === 'reviews' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <div>
                  <h1 className="text-xl font-black text-[#253330] tracking-tight">
                    Reviews & Supervisor Moderation
                  </h1>
                  <p className="text-xs text-[#71807C]">
                    Oversight of Guide and Patent Expert formal evaluations and stage advancement
                  </p>
                </div>
                <select
                  value={reviewFilter}
                  onChange={(e) => setReviewFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer"
                >
                  <option value="ALL">All Review Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Reviews Table */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl overflow-hidden shadow-3xs">
                {(reviewsData?.reviews || []).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">Project Title</th>
                          <th className="py-3 px-4">Organization</th>
                          <th className="py-3 px-4">Inventor</th>
                          <th className="py-3 px-4">Supervisor</th>
                          <th className="py-3 px-4">Review Type</th>
                          <th className="py-3 px-4">Decision</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EBE8]">
                        {(reviewsData?.reviews || []).map((rev: any, index: number) => (
                          <tr key={rev.id || index} className="hover:bg-[#F7F9F8] transition">
                            <td className="py-3.5 px-4 text-center font-mono text-[#71807C] font-bold">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#253330]">{rev.projectTitle}</td>
                            <td className="py-3.5 px-4 text-[#5C6B67]">{rev.organization || 'Independent'}</td>
                            <td className="py-3.5 px-4 text-[#5C6B67]">{rev.inventor}</td>
                            <td className="py-3.5 px-4 text-[#315C55] font-bold">{rev.reviewer}</td>
                            <td className="py-3.5 px-4 text-[#71807C]">{rev.type}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  rev.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rev.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {rev.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-[#71807C]">{rev.dueDate}</td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedReviewDetails(rev)}
                                className="p-1.5 hover:bg-[#DDEBE6] text-[#315C55] rounded-lg transition cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Scale className="w-10 h-10 text-[#8A9B96] mx-auto mb-2" />
                    <h4 className="text-sm font-black text-[#253330]">No Reviews Recorded</h4>
                    <p className="text-xs text-[#71807C] mt-1">
                      No project reviews have been logged in the system yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: POLICIES GOVERNANCE MODULE */}
          {/* ==================================================== */}
          {activeNav === 'policies' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <div>
                  <h1 className="text-xl font-black text-[#253330] tracking-tight">
                    Platform Policies Governance
                  </h1>
                  <p className="text-xs text-[#71807C]">
                    Configure organization-level access rules, AI invocation gates, and review mandates
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-[#8A9B96] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search policies..."
                      value={policySearchTerm}
                      onChange={(e) => setPolicySearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <select
                    value={policyOrgFilter}
                    onChange={(e) => setPolicyOrgFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer"
                  >
                    <option value="ALL">All Organizations</option>
                    {organizationsList.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={policyStatusFilter}
                    onChange={(e) => setPolicyStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <button
                    onClick={() => setShowCreatePolicyModal(true)}
                    className="px-4 py-2 bg-[#315C55] hover:bg-[#254640] text-white rounded-2xl text-xs font-bold transition shadow-3xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Policy</span>
                  </button>
                </div>
              </div>

              {/* Policies Table */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl overflow-hidden shadow-3xs">
                {filteredPolicies.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">Policy Name</th>
                          <th className="py-3 px-4">Organization / Scope</th>
                          <th className="py-3 px-4">Enforced Rules</th>
                          <th className="py-3 px-4">Assignments</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Created Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EBE8]">
                        {filteredPolicies.map((p, index) => {
                          const rulesObj = typeof p.rules === 'string' ? JSON.parse(p.rules || '{}') : (p.rules || {});
                          return (
                            <tr key={p.id || index} className="hover:bg-[#F7F9F8] transition">
                              <td className="py-3.5 px-4 text-center font-mono text-[#71807C] font-bold">
                                {index + 1}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-extrabold text-[#253330] block">{p.name}</span>
                                {p.description && (
                                  <span className="text-[10px] text-[#71807C] block truncate max-w-xs">{p.description}</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0F4F2] text-[#315C55]">
                                  {p.organizationName || p.organization?.name || 'Global Platform'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {Object.keys(rulesObj).length > 0 ? (
                                    Object.entries(rulesObj).map(([key, val]) => (
                                      <span
                                        key={key}
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                          val ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                                        }`}
                                      >
                                        {key}: {String(val)}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-[#8A9B96] italic">Default Policy</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[#5C6B67] font-bold">
                                {p.assignmentsCount ?? 0}
                              </td>
                              <td className="py-3.5 px-4">
                                <button
                                  onClick={() => handleTogglePolicyStatus(p.id, p.status)}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase transition cursor-pointer ${
                                    p.status === 'ACTIVE'
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="Click to toggle status"
                                >
                                  {p.status}
                                </button>
                              </td>
                              <td className="py-3.5 px-4 text-[11px] text-[#71807C]">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedPolicy(p);
                                    setShowEditPolicyModal(true);
                                  }}
                                  className="p-1.5 hover:bg-[#DDEBE6] text-[#315C55] rounded-lg transition cursor-pointer"
                                  title="Edit Policy"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Shield className="w-10 h-10 text-[#8A9B96] mx-auto mb-2" />
                    <h4 className="text-sm font-black text-[#253330]">No Policies Found</h4>
                    <p className="text-xs text-[#71807C] mt-1">
                      No governance policies match your search or filter criteria.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: SUBSCRIPTION MANAGEMENT MODULE */}
          {/* ==================================================== */}
          {activeNav === 'subscriptions' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <div>
                  <h1 className="text-xl font-black text-[#253330] tracking-tight">
                    Subscription & License Management
                  </h1>
                  <p className="text-xs text-[#71807C]">
                    Monitor institutional subscription plans, trial lifecycle, and payment continuity
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={subStatusFilter}
                    onChange={(e) => setSubStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer"
                  >
                    <option value="ALL">All Subscriptions</option>
                    <option value="ACTIVE">Active</option>
                    <option value="TRIAL">Trial</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="FAILED">Payment Failed</option>
                  </select>
                </div>
              </div>

              {/* Available Plans Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                  Available Platform Plans
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subscriptionsData.plans.map((pl) => (
                    <div key={pl.id} className="p-5 bg-white border border-[#E5EBE8] rounded-3xl shadow-3xs space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2.5 py-0.5 bg-[#E5EBE8] text-[#315C55] rounded-full text-[10px] font-black uppercase">
                            {pl.code}
                          </span>
                          <h4 className="text-base font-black text-[#253330] mt-1">{pl.name}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-[#315C55] font-mono">
                            ₹{pl.amount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#71807C] block">/{pl.billingInterval || 'month'}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#71807C]">{pl.description || 'Enterprise grade patent automation'}</p>
                      <div className="pt-2 border-t border-[#E5EBE8] space-y-1">
                        {pl.features && Object.keys(pl.features).length > 0 ? (
                          Object.entries(pl.features).map(([fKey, fVal]) => (
                            <div key={fKey} className="flex items-center gap-1.5 text-[11px] text-[#5C6B67]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="capitalize">{fKey.replace(/([A-Z])/g, ' $1')}: {String(fVal)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-[#71807C]">Standard Plan Entitlements</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active & Historical Subscriptions Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                  Organization Subscriptions ({filteredSubscriptions.length})
                </h3>
                <div className="bg-white border border-[#E5EBE8] rounded-3xl overflow-hidden shadow-3xs">
                  {filteredSubscriptions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-3 px-4 w-12 text-center">#</th>
                            <th className="py-3 px-4">Organization</th>
                            <th className="py-3 px-4">Plan</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Period Start</th>
                            <th className="py-3 px-4">Period End</th>
                            <th className="py-3 px-4">Trial Status</th>
                            <th className="py-3 px-4">Gateway Reference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5EBE8]">
                          {filteredSubscriptions.map((sub, index) => (
                            <tr key={sub.id || index} className="hover:bg-[#F7F9F8] transition">
                              <td className="py-3.5 px-4 text-center font-mono text-[#71807C] font-bold">
                                {index + 1}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#253330]">
                                {sub.organizationName}
                                <span className="text-[10px] text-[#71807C] block font-mono">{sub.domain}</span>
                              </td>
                              <td className="py-3.5 px-4 font-medium text-[#5C6B67]">
                                <span className="font-bold text-[#253330]">{sub.planName}</span>
                                <span className="text-[10px] text-[#71807C] block font-mono">₹{sub.amount} {sub.currency}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    sub.status.toUpperCase() === 'ACTIVE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : sub.status.toUpperCase() === 'TRIAL'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {sub.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-[11px] text-[#71807C]">
                                {new Date(sub.startDate).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-4 text-[11px] text-[#71807C]">
                                {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'Auto-renew'}
                              </td>
                              <td className="py-3.5 px-4 text-[11px] font-mono text-[#5C6B67]">
                                {sub.trialStatus}
                              </td>
                              <td className="py-3.5 px-4 text-[11px] font-mono text-[#71807C] truncate max-w-xs">
                                {sub.razorpaySubscriptionId || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <CreditCard className="w-10 h-10 text-[#8A9B96] mx-auto mb-2" />
                      <h4 className="text-sm font-black text-[#253330]">No Subscriptions Found</h4>
                      <p className="text-xs text-[#71807C] mt-1">No organization subscription records match query.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Trial Organizations Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                  Trial Organizations ({subscriptionsData.trials.length})
                </h3>
                <div className="bg-white border border-[#E5EBE8] rounded-3xl overflow-hidden shadow-3xs">
                  {subscriptionsData.trials.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-3 px-4 w-12 text-center">#</th>
                            <th className="py-3 px-4">Organization</th>
                            <th className="py-3 px-4">Trial Status</th>
                            <th className="py-3 px-4">Started At</th>
                            <th className="py-3 px-4">Expires At</th>
                            <th className="py-3 px-4">Consumption</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5EBE8]">
                          {subscriptionsData.trials.map((tr, index) => (
                            <tr key={tr.id || index} className="hover:bg-[#F7F9F8] transition">
                              <td className="py-3.5 px-4 text-center font-mono text-[#71807C] font-bold">
                                {index + 1}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#253330]">{tr.organizationName}</td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    tr.status.toUpperCase() === 'ACTIVE'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {tr.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-[11px] text-[#71807C]">
                                {new Date(tr.startedAt).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-4 text-[11px] text-[#71807C]">
                                {new Date(tr.expiresAt).toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-4 text-[11px] text-[#5C6B67]">
                                {tr.consumedAt ? `Consumed on ${new Date(tr.consumedAt).toLocaleDateString()}` : 'In progress'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Sparkles className="w-8 h-8 text-[#8A9B96] mx-auto mb-2" />
                      <p className="text-xs font-bold text-[#71807C]">No active trials currently registered.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: PAYMENTS MANAGEMENT MODULE */}
          {/* ==================================================== */}
          {activeNav === 'payments' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <div>
                  <h1 className="text-xl font-black text-[#253330] tracking-tight">
                    Payment Transactions Oversight
                  </h1>
                  <p className="text-xs text-[#71807C]">
                    Real database payment transactions verified through Razorpay payment gateway
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative w-56">
                    <Search className="w-3.5 h-3.5 text-[#8A9B96] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search payment or Razorpay ID..."
                      value={paymentSearchTerm}
                      onChange={(e) => setPaymentSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer"
                  >
                    <option value="ALL">All Payment Statuses</option>
                    <option value="SUCCESS">Success</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>

              {/* Payments Table */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl overflow-hidden shadow-3xs">
                {filteredPayments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">Organization</th>
                          <th className="py-3 px-4">Internal Payment ID</th>
                          <th className="py-3 px-4">Razorpay Payment ID</th>
                          <th className="py-3 px-4">Plan</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Payment Status</th>
                          <th className="py-3 px-4">Verification</th>
                          <th className="py-3 px-4">Payment Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EBE8]">
                        {filteredPayments.map((pay, index) => (
                          <tr key={pay.id || index} className="hover:bg-[#F7F9F8] transition">
                            <td className="py-3.5 px-4 text-center font-mono text-[#71807C] font-bold">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#253330]">{pay.organizationName}</td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-[#71807C] truncate max-w-[120px]">
                              {pay.paymentId}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-[#315C55] font-bold">
                              {pay.razorpayPaymentId}
                            </td>
                            <td className="py-3.5 px-4 text-[#5C6B67]">{pay.planName}</td>
                            <td className="py-3.5 px-4 font-mono font-black text-[#253330]">
                              ₹{pay.amount.toLocaleString()} {pay.currency}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  pay.status === 'SUCCESS'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : pay.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {pay.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded-md">
                                {pay.verificationStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-[#71807C]">
                              {new Date(pay.paymentDate).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <DollarSign className="w-10 h-10 text-[#8A9B96] mx-auto mb-2" />
                    <h4 className="text-sm font-black text-[#253330]">No Payment Records Available</h4>
                    <p className="text-xs text-[#71807C] mt-1">No payment transactions match the selected filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: ENTITLEMENTS MANAGEMENT MODULE */}
          {/* ==================================================== */}
          {activeNav === 'entitlements' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <div>
                  <h1 className="text-xl font-black text-[#253330] tracking-tight">
                    Organization Feature Entitlements
                  </h1>
                  <p className="text-xs text-[#71807C]">
                    Inspect active feature gates, AI drawing generation grants, and statutory export capabilities
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={entitlementOrgFilter}
                    onChange={(e) => setEntitlementOrgFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer"
                  >
                    <option value="ALL">All Organizations</option>
                    {organizationsList.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Entitlements Table */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl overflow-hidden shadow-3xs">
                {filteredEntitlements.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">Organization</th>
                          <th className="py-3 px-4">Feature Name</th>
                          <th className="py-3 px-4">Feature Code</th>
                          <th className="py-3 px-4">Plan Association</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Valid From</th>
                          <th className="py-3 px-4">Valid Until</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EBE8]">
                        {filteredEntitlements.map((ent, index) => (
                          <tr key={ent.id || index} className="hover:bg-[#F7F9F8] transition">
                            <td className="py-3.5 px-4 text-center font-mono text-[#71807C] font-bold">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#253330]">{ent.organizationName}</td>
                            <td className="py-3.5 px-4 font-semibold text-[#315C55]">{ent.featureName}</td>
                            <td className="py-3.5 px-4 font-mono text-[10px] text-[#71807C]">{ent.featureCode}</td>
                            <td className="py-3.5 px-4 text-[#5C6B67]">{ent.planName}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  ent.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {ent.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-[#71807C]">
                              {new Date(ent.validFrom).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-[#71807C]">
                              {ent.validUntil ? new Date(ent.validUntil).toLocaleDateString() : 'Continuous (Subscription)'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Sparkles className="w-10 h-10 text-[#8A9B96] mx-auto mb-2" />
                    <h4 className="text-sm font-black text-[#253330]">No Entitlements Found</h4>
                    <p className="text-xs text-[#71807C] mt-1">No feature entitlements provisioned for this criteria.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: NOTIFICATIONS MODULE */}
          {/* ==================================================== */}
          {activeNav === 'notifications' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <div>
                  <h1 className="text-xl font-black text-[#253330] tracking-tight">
                    Platform Notifications & Broadcasts
                  </h1>
                  <p className="text-xs text-[#71807C]">
                    Dispatch platform alerts, system maintenance bulletins, and track notifications
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <select
                    value={notifFilter}
                    onChange={(e) => setNotifFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="UNREAD">Unread</option>
                    <option value="READ">Read</option>
                  </select>
                  <select
                    value={notifTypeFilter}
                    onChange={(e) => setNotifTypeFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer"
                  >
                    <option value="ALL">All Types</option>
                    <option value="SYSTEM">System</option>
                    <option value="GENERAL">General</option>
                    <option value="WORKFLOW">Workflow</option>
                  </select>
                  <button
                    onClick={() => setShowBroadcastModal(true)}
                    className="px-4 py-2 bg-[#315C55] hover:bg-[#254640] text-white rounded-2xl text-xs font-bold transition shadow-3xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>New Broadcast</span>
                  </button>
                </div>
              </div>

              {/* Notifications Table */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl overflow-hidden shadow-3xs">
                {filteredNotifications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">Title</th>
                          <th className="py-3 px-4">Recipient</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Message</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EBE8]">
                        {filteredNotifications.map((notif, index) => (
                          <tr key={notif.id} className="hover:bg-[#F7F9F8] transition">
                            <td className="py-3.5 px-4 text-center font-mono text-[#71807C] font-bold">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#253330]">{notif.title}</td>
                            <td className="py-3.5 px-4 text-[#5C6B67]">{notif.recipient}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E5EBE8] text-[#315C55]">
                                {notif.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#71807C] truncate max-w-xs">{notif.message}</td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleNotification(notif.id)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase transition cursor-pointer ${
                                  notif.isRead ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                }`}
                                title="Click to toggle read status"
                              >
                                {notif.isRead ? 'Read' : 'Unread'}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-[#71807C]">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Bell className="w-10 h-10 text-[#8A9B96] mx-auto mb-2" />
                    <h4 className="text-sm font-black text-[#253330]">No Notifications</h4>
                    <p className="text-xs text-[#71807C] mt-1">No platform notifications to display.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: ACTIVITY LOGS MODULE */}
          {/* ==================================================== */}
          {activeNav === 'activity' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <div>
                  <h1 className="text-xl font-black text-[#253330] tracking-tight">Platform Audit Trail</h1>
                  <p className="text-xs text-[#71807C]">
                    Complete chronological ledger of user actions, project mutations, and security events
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-[#8A9B96] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search activity..."
                      value={activitySearchTerm}
                      onChange={(e) => setActivitySearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <select
                    value={activityTypeFilter}
                    onChange={(e) => setActivityTypeFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67] cursor-pointer"
                  >
                    <option value="ALL">All Event Types</option>
                    <option value="SYSTEM">System</option>
                    <option value="AUTH">Auth</option>
                    <option value="PROJECT">Project</option>
                    <option value="CLAIM">Claim</option>
                    <option value="DOCUMENT">Document</option>
                    <option value="REVIEW">Review</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              {/* Activity Table */}
              <div className="bg-white border border-[#E5EBE8] rounded-3xl overflow-hidden shadow-3xs">
                {activityLogsData.logs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFBFB] border-b border-[#E5EBE8] text-[#71807C] font-black uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">Actor</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Event / Action</th>
                          <th className="py-3 px-4">Target Resource</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EBE8]">
                        {activityLogsData.logs.map((log, index) => (
                          <tr key={log.id} className="hover:bg-[#F7F9F8] transition">
                            <td className="py-3.5 px-4 text-center font-mono text-[#71807C] font-bold">
                              {(activityPage - 1) * 25 + index + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#253330]">{log.user}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E5EBE8] text-[#315C55]">
                                {log.userRole}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-[#253330]">{log.action}</td>
                            <td className="py-3.5 px-4 text-[#5C6B67]">{log.resource}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-100 text-slate-700">
                                {log.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-[#71807C]">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Activity className="w-10 h-10 text-[#8A9B96] mx-auto mb-2" />
                    <h4 className="text-sm font-black text-[#253330]">No Activity Logs</h4>
                    <p className="text-xs text-[#71807C] mt-1">No activity events match your query.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: SETTINGS MODULE */}
          {/* ==================================================== */}
          {activeNav === 'settings' && systemSettings && (
            <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
              <div className="bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs">
                <h1 className="text-xl font-black text-[#253330] tracking-tight">Platform System Settings</h1>
                <p className="text-xs text-[#71807C]">
                  Configure global authentication policies, AI provider selection, and statutory clearance rules
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-[#E5EBE8] shadow-3xs space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#253330]">
                    Authentication & Security Controls
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-[#F7F9F8] rounded-2xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.registrationEnabled}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, registrationEnabled: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-[#315C55]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#253330] block">Public Registration</span>
                        <span className="text-[10px] text-[#71807C]">Allow new inventors to register</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-[#F7F9F8] rounded-2xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.emailVerificationRequired}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, emailVerificationRequired: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-[#315C55]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#253330] block">Mandatory OTP Verification</span>
                        <span className="text-[10px] text-[#71807C]">Require email code before activation</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-[#F7F9F8] rounded-2xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.strictFtoEnforcement}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, strictFtoEnforcement: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-[#315C55]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#253330] block">FTO Risk Gate</span>
                        <span className="text-[10px] text-[#71807C]">Flag HIGH prior-art overlap</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-[#F7F9F8] rounded-2xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.mandatoryForm2Precheck}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, mandatoryForm2Precheck: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-[#315C55]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#253330] block">Form 2 Pre-Filing Clearance</span>
                        <span className="text-[10px] text-[#71807C]">Validate antecedent basis tree</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#315C55] hover:bg-[#254640] text-white rounded-2xl text-xs font-bold transition shadow-3xs cursor-pointer"
                  >
                    Save System Settings
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ==================================================== */}
      {/* DRAWER / MODAL: COMPLETE USER PROFILE VIEW */}
      {/* ==================================================== */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[#E5EBE8] flex items-center justify-between bg-[#FAFBFB] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#315C55] text-white font-black flex items-center justify-center text-sm shadow-3xs">
                  {selectedUser.fullName[0]}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#253330]">{selectedUser.fullName}</h3>
                  <p className="text-xs text-[#71807C] font-mono">
                    @{selectedUser.username} • {selectedUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSelectedUserProfile(null);
                }}
                className="p-1.5 hover:bg-[#F0F4F2] rounded-xl text-[#71807C] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex border-b border-[#E5EBE8] bg-[#FAFBFB] px-6 gap-2 shrink-0 overflow-x-auto text-xs font-bold">
              {[
                { key: 'PERSONAL', label: 'Personal Details' },
                { key: 'ROLE', label: 'Role & Access' },
                { key: 'PROFESSIONAL', label: 'Professional' },
                { key: 'PROJECTS', label: 'Projects' },
                { key: 'ACTIVITY', label: 'Activity' },
                { key: 'SECURITY', label: 'Security' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setUserProfileTab(tab.key as any)}
                  className={`py-3 px-3 border-b-2 transition cursor-pointer shrink-0 ${
                    userProfileTab === tab.key
                      ? 'border-[#315C55] text-[#315C55] font-black'
                      : 'border-transparent text-[#71807C] hover:text-[#253330]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedUserProfileLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 text-[#315C55] animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#71807C]">Loading complete user profile...</p>
                </div>
              ) : selectedUserProfile ? (
                <>
                  {/* TAB 1: PERSONAL DETAILS */}
                  {userProfileTab === 'PERSONAL' && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-4 p-4 bg-[#F7F9F8] rounded-2xl border border-[#E5EBE8]">
                        <div>
                          <span className="text-[10px] text-[#71807C] font-bold block uppercase">Full Name</span>
                          <span className="font-extrabold text-[#253330] text-sm">
                            {selectedUserProfile.personalDetails.fullName}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#71807C] font-bold block uppercase">Username</span>
                          <span className="font-mono text-[#253330]">
                            @{selectedUserProfile.personalDetails.username}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#71807C] font-bold block uppercase">Email Address</span>
                          <span className="font-mono text-[#5C6B67]">
                            {selectedUserProfile.personalDetails.email}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#71807C] font-bold block uppercase">Phone Number</span>
                          <span className="font-mono text-[#5C6B67]">
                            {selectedUserProfile.personalDetails.phone}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#71807C] font-bold block uppercase">Account Status</span>
                          <span
                            className={`font-black uppercase ${
                              selectedUserProfile.personalDetails.isActive ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {selectedUserProfile.personalDetails.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#71807C] font-bold block uppercase">Account Created</span>
                          <span className="text-[#5C6B67]">
                            {new Date(selectedUserProfile.personalDetails.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ROLE & ACCESS */}
                  {userProfileTab === 'ROLE' && (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-[#F7F9F8] rounded-2xl border border-[#E5EBE8] space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#71807C] font-bold block uppercase">
                              Current Role
                            </span>
                            <span className="px-3 py-1 bg-[#315C55] text-white rounded-full text-xs font-black uppercase inline-block mt-1">
                              {selectedUserProfile.roleAndAccess.roleName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={editingUserRole}
                              onChange={(e) => setEditingUserRole(e.target.value)}
                              className="px-3 py-1.5 bg-white border border-[#E5EBE8] rounded-xl text-xs font-bold"
                            >
                              <option value="Inventor">Inventor</option>
                              <option value="CoInventor">Co-Inventor</option>
                              <option value="Guide">Guide</option>
                              <option value="PatentExpert">Patent Expert</option>
                              <option value="OrgAdmin">Org Admin</option>
                              <option value="Admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleUpdateUserRole(selectedUser.id, editingUserRole)}
                              className="px-3 py-1.5 bg-[#315C55] text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Reassign
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#71807C] font-bold block uppercase">
                            Primary Organization
                          </span>
                          <span className="font-bold text-[#253330]">
                            {selectedUserProfile.roleAndAccess.institution}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#71807C] font-bold block uppercase mb-1.5">
                            Granted Permissions ({selectedUserProfile.roleAndAccess.permissions.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                            {selectedUserProfile.roleAndAccess.permissions.map((permId: string) => (
                              <span
                                key={permId}
                                className="px-2 py-0.5 bg-white border border-[#E5EBE8] text-[#315C55] font-mono text-[10px] rounded-md"
                              >
                                {permId}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PROFESSIONAL DETAILS */}
                  {userProfileTab === 'PROFESSIONAL' && (
                    <div className="space-y-3 text-xs">
                      <div className="p-4 bg-[#F7F9F8] rounded-2xl border border-[#E5EBE8] space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-[#71807C] font-bold block uppercase">
                              Designation
                            </span>
                            <span className="font-bold text-[#253330]">
                              {selectedUserProfile.professionalDetails.designation}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#71807C] font-bold block uppercase">Department</span>
                            <span className="font-bold text-[#253330]">
                              {selectedUserProfile.professionalDetails.department}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#71807C] font-bold block uppercase">
                              Institution
                            </span>
                            <span className="font-bold text-[#253330]">
                              {selectedUserProfile.professionalDetails.institution}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#71807C] font-bold block uppercase">
                              Research Domain
                            </span>
                            <span className="font-bold text-[#315C55]">
                              {selectedUserProfile.professionalDetails.researchDomain}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#E5EBE8]">
                          <span className="text-[10px] text-[#71807C] font-bold block uppercase mb-1">
                            Biography & Abstract
                          </span>
                          <p className="text-xs text-[#5C6B67] leading-relaxed italic bg-white p-3 rounded-xl border border-[#E5EBE8]">
                            "{selectedUserProfile.professionalDetails.bio}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: PROJECTS */}
                  {userProfileTab === 'PROJECTS' && (
                    <div className="space-y-4 text-xs">
                      <div>
                        <h4 className="text-xs font-black uppercase text-[#253330] mb-2">
                          Owned Projects ({selectedUserProfile.projects.owned.length})
                        </h4>
                        {selectedUserProfile.projects.owned.length > 0 ? (
                          <div className="space-y-2">
                            {selectedUserProfile.projects.owned.map((p: any) => (
                              <div
                                key={p.id}
                                className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8] flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-[#253330] block">{p.title}</span>
                                  <span className="text-[10px] text-[#71807C]">
                                    Stage: {p.stage} • Claims: {p.claimsCount} • Documents: {p.documentsCount}
                                  </span>
                                </div>
                                <button
                                  onClick={() => navigate(`/dashboard/projects/${p.id}`)}
                                  className="px-2.5 py-1 bg-white hover:bg-[#DDEBE6] text-[#315C55] rounded-lg font-bold border border-[#E5EBE8] cursor-pointer"
                                >
                                  Open
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#71807C]">No owned projects created by this user.</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E5EBE8]">
                        <h4 className="text-xs font-black uppercase text-[#253330] mb-2">
                          Joined / Collaborated Projects ({selectedUserProfile.projects.joined.length})
                        </h4>
                        {selectedUserProfile.projects.joined.length > 0 ? (
                          <div className="space-y-2">
                            {selectedUserProfile.projects.joined.map((p: any) => (
                              <div
                                key={p.id}
                                className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8] flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-[#253330] block">{p.title}</span>
                                  <span className="text-[10px] text-[#71807C]">
                                    Role in Project: <strong className="text-[#315C55]">{p.projectRole}</strong> • Owner: {p.ownerName}
                                  </span>
                                </div>
                                <button
                                  onClick={() => navigate(`/dashboard/projects/${p.id}`)}
                                  className="px-2.5 py-1 bg-white hover:bg-[#DDEBE6] text-[#315C55] rounded-lg font-bold border border-[#E5EBE8] cursor-pointer"
                                >
                                  Open
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#71807C]">No collaborative project memberships.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: ACTIVITY */}
                  {userProfileTab === 'ACTIVITY' && (
                    <div className="space-y-2 text-xs">
                      {selectedUserProfile.activityHistory.length > 0 ? (
                        selectedUserProfile.activityHistory.map((act: any) => (
                          <div
                            key={act.id}
                            className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8] flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-[#253330]">{act.action}</p>
                              <p className="text-[10px] text-[#71807C]">
                                Type: {act.type} • Target: {act.target}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-[#71807C]">
                              {new Date(act.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#71807C] p-4 text-center">No recent activity logs for this user.</p>
                      )}
                    </div>
                  )}

                  {/* TAB 6: SECURITY */}
                  {userProfileTab === 'SECURITY' && (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-[#F7F9F8] rounded-2xl border border-[#E5EBE8] space-y-3">
                        <div className="flex justify-between items-center py-1">
                          <span className="font-bold text-[#253330]">Account Status</span>
                          <button
                            onClick={() =>
                              handleToggleUserStatus(selectedUser.id, selectedUserProfile.personalDetails.isActive)
                            }
                            className={`px-3 py-1 rounded-xl text-xs font-bold text-white transition cursor-pointer ${
                              selectedUserProfile.personalDetails.isActive
                                ? 'bg-amber-600 hover:bg-amber-700'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            {selectedUserProfile.personalDetails.isActive ? 'Suspend Account' : 'Activate Account'}
                          </button>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-[#E5EBE8]">
                          <span className="font-bold text-[#253330]">Verification Status</span>
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-[10px]">
                            {selectedUserProfile.security.verificationStatus}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-t border-[#E5EBE8]">
                          <div>
                            <span className="font-bold text-rose-700 block">Delete Account Permanently</span>
                            <span className="text-[10px] text-[#71807C]">
                              Purge user account and all owned assets from database
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setUserToDelete(selectedUser);
                            }}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Delete User
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E5EBE8] bg-[#FAFBFB] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setSelectedUserProfile(null);
                }}
                className="px-4 py-2 bg-[#315C55] text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DRAWER / MODAL: ORGANIZATION DETAILS */}
      {/* ==================================================== */}
      {selectedOrgDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[#E5EBE8] flex items-center justify-between bg-[#FAFBFB] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#315C55] text-white font-black flex items-center justify-center text-sm shadow-3xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#253330]">{selectedOrgDetails.overview.name}</h3>
                  <p className="text-xs text-[#71807C] font-mono">
                    {selectedOrgDetails.overview.domain} • Contact: {selectedOrgDetails.overview.contactEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrgDetails(null)}
                className="p-1.5 hover:bg-[#F0F4F2] rounded-xl text-[#71807C] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#E5EBE8] bg-[#FAFBFB] px-6 gap-2 shrink-0 overflow-x-auto text-xs font-bold">
              {[
                { key: 'OVERVIEW', label: 'Overview' },
                { key: 'MEMBERS', label: `Members (${selectedOrgDetails.members.length})` },
                { key: 'PROJECTS', label: `Projects (${selectedOrgDetails.projects.length})` },
                { key: 'GUIDES', label: `Guides (${selectedOrgDetails.guides.length})` },
                { key: 'EXPERTS', label: `Experts (${selectedOrgDetails.patentExperts.length})` },
                { key: 'ACTIVITY', label: 'Activity' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setOrgDetailsTab(tab.key as any)}
                  className={`py-3 px-3 border-b-2 transition cursor-pointer shrink-0 ${
                    orgDetailsTab === tab.key
                      ? 'border-[#315C55] text-[#315C55] font-black'
                      : 'border-transparent text-[#71807C] hover:text-[#253330]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {orgDetailsTab === 'OVERVIEW' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8] text-center">
                    <span className="text-[10px] font-bold text-[#71807C] uppercase block">Members</span>
                    <span className="text-xl font-black text-[#253330] font-mono">
                      {selectedOrgDetails.overview.membersCount}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8] text-center">
                    <span className="text-[10px] font-bold text-[#71807C] uppercase block">Projects</span>
                    <span className="text-xl font-black text-[#253330] font-mono">
                      {selectedOrgDetails.overview.projectsCount}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8] text-center">
                    <span className="text-[10px] font-bold text-[#71807C] uppercase block">Guides</span>
                    <span className="text-xl font-black text-[#253330] font-mono">
                      {selectedOrgDetails.overview.guidesCount}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8] text-center">
                    <span className="text-[10px] font-bold text-[#71807C] uppercase block">Experts</span>
                    <span className="text-xl font-black text-[#253330] font-mono">
                      {selectedOrgDetails.overview.expertsCount}
                    </span>
                  </div>
                </div>
              )}

              {orgDetailsTab === 'MEMBERS' && (
                <div className="space-y-2">
                  {selectedOrgDetails.members.map((m: any, index: number) => (
                    <div
                      key={m.id}
                      className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[#71807C] text-[10px]">{index + 1}.</span>
                        <div>
                          <span className="font-bold text-[#253330] block">{m.fullName}</span>
                          <span className="text-[10px] text-[#71807C]">
                            @{m.username} • {m.email} • {m.department}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E5EBE8] text-[#315C55]">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {orgDetailsTab === 'PROJECTS' && (
                <div className="space-y-2">
                  {selectedOrgDetails.projects.map((p: any, index: number) => (
                    <div
                      key={p.id}
                      className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-[#253330] block">
                          {index + 1}. {p.title}
                        </span>
                        <span className="text-[10px] text-[#71807C]">
                          Owner: {p.owner} • Stage: {p.stage} • Claims: {p.claimsCount}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/dashboard/projects/${p.id}`)}
                        className="px-2.5 py-1 bg-white hover:bg-[#DDEBE8] text-[#315C55] rounded-lg font-bold border border-[#E5EBE8] cursor-pointer"
                      >
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {orgDetailsTab === 'GUIDES' && (
                <div className="space-y-2">
                  {selectedOrgDetails.guides.map((g: any) => (
                    <div
                      key={g.id}
                      className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-[#253330] block">{g.fullName}</span>
                        <span className="text-[10px] text-[#71807C]">
                          {g.department} • Specialization: {g.specialization}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-[10px]">
                        {g.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {orgDetailsTab === 'EXPERTS' && (
                <div className="space-y-2">
                  {selectedOrgDetails.patentExperts.map((e: any) => (
                    <div
                      key={e.id}
                      className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-[#253330] block">{e.fullName}</span>
                        <span className="text-[10px] text-[#71807C]">
                          {e.department} • Specialization: {e.specialization}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-[10px]">
                        {e.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {orgDetailsTab === 'ACTIVITY' && (
                <div className="space-y-2">
                  {selectedOrgDetails.activity.map((act: any) => (
                    <div
                      key={act.id}
                      className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-[#253330] block">{act.action}</span>
                        <span className="text-[10px] text-[#71807C]">
                          User: {act.user} • Target: {act.target}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#71807C]">{act.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E5EBE8] bg-[#FAFBFB] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedOrgDetails(null)}
                className="px-4 py-2 bg-[#315C55] text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CONFIRM PERMISSION CHANGES */}
      {/* ==================================================== */}
      {showConfirmSavePermissions && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-[#315C55]">
              <Shield className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-black text-[#253330]">Save Permission Matrix Changes?</h3>
            </div>
            <p className="text-xs text-[#71807C] leading-relaxed">
              You are about to commit customized access control policies for platform roles. These permission updates
              will immediately apply to all active API requests and user sessions.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSavePermissions(false)}
                className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] text-[#5C6B67] rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingPermissions}
                onClick={handleSaveRolePermissions}
                className="px-4 py-2 bg-[#315C55] hover:bg-[#254640] text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer flex items-center gap-1"
              >
                {savingPermissions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Confirm & Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: VERIFICATION APPLICATION REVIEW DETAILS */}
      {/* ==================================================== */}
      {selectedVerification && !verificationDecisionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5EBE8]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#315C55]" />
                <h3 className="text-sm font-black text-[#253330]">Verification Application Profile</h3>
              </div>
              <button
                onClick={() => setSelectedVerification(null)}
                className="p-1 hover:bg-[#F0F4F2] rounded-lg text-[#71807C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7F9F8] rounded-xl border border-[#E5EBE8]">
                <div>
                  <span className="text-[10px] text-[#71807C] font-bold block uppercase">Applicant</span>
                  <span className="font-extrabold text-[#253330]">{selectedVerification.applicantName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#71807C] font-bold block uppercase">Role Requested</span>
                  <span className="font-black text-[#315C55] uppercase">{selectedVerification.roleApplied}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#71807C] font-bold block uppercase">Official Email</span>
                  <span className="font-mono text-[#5C6B67]">{selectedVerification.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#71807C] font-bold block uppercase">Organization</span>
                  <span className="font-bold text-[#253330]">{selectedVerification.organization}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#71807C] font-bold block uppercase">Qualification</span>
                  <span className="font-bold text-[#5C6B67]">{selectedVerification.qualification}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#71807C] font-bold block uppercase">Specialization</span>
                  <span className="font-bold text-[#5C6B67]">{selectedVerification.specialization}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setSelectedVerification(null)}
                className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] text-[#5C6B67] rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              {selectedVerification.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVerificationDecisionModal(true)}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Reject Application
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProcessVerification('APPROVE')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
                  >
                    Approve Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: VERIFICATION DECISION REJECTION NOTES */}
      {/* ==================================================== */}
      {verificationDecisionModal && selectedVerification && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5EBE8]">
              <h3 className="text-sm font-black text-[#253330]">Reject Verification Application</h3>
              <button
                onClick={() => {
                  setVerificationDecisionModal(false);
                  setSelectedVerification(null);
                  setDecisionNotes('');
                }}
                className="p-1 hover:bg-[#F0F4F2] rounded-lg text-[#71807C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#71807C]">
                Applicant: <strong className="text-[#253330]">{selectedVerification.applicantName}</strong> (
                {selectedVerification.roleApplied})
              </p>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Rejection Reason / Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Specify why this application was rejected or what additional documentation is required..."
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setVerificationDecisionModal(false);
                  setSelectedVerification(null);
                  setDecisionNotes('');
                }}
                className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] text-[#5C6B67] rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleProcessVerification('REJECT')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: BROADCAST NOTIFICATION */}
      {/* ==================================================== */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5EBE8]">
              <h3 className="text-sm font-black text-[#253330]">Broadcast Platform Notification</h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 hover:bg-[#F0F4F2] rounded-lg text-[#71807C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastNotification} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Notification Title</label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled System Maintenance"
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Message Body</label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed message to dispatch to all active users..."
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5C6B67]">Type</label>
                  <select
                    value={broadcastData.type}
                    onChange={(e) => setBroadcastData({ ...broadcastData, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67]"
                  >
                    <option value="SYSTEM">System</option>
                    <option value="GENERAL">General</option>
                    <option value="WORKFLOW">Workflow</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5C6B67]">Target Audience</label>
                  <select
                    value={broadcastData.targetRole}
                    onChange={(e) => setBroadcastData({ ...broadcastData, targetRole: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67]"
                  >
                    <option value="ALL">All Active Users</option>
                    <option value="Inventor">Inventors Only</option>
                    <option value="Guide">Guides Only</option>
                    <option value="PatentExpert">Patent Experts Only</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] text-[#5C6B67] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#315C55] hover:bg-[#254640] text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Dispatch Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: DELETE USER CONFIRMATION */}
      {/* ==================================================== */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-black text-[#253330]">Permanently Delete User Account?</h3>
            </div>
            <p className="text-xs text-[#71807C] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#253330]">{userToDelete.fullName}</strong> (@{userToDelete.username})? All
              owned projects, document links, and profile history will be deleted. This cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] text-[#5C6B67] rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleDeleteUserConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
              >
                {isDeletingUser ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CREATE ORGANIZATION */}
      {/* ==================================================== */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5EBE8]">
              <h3 className="text-sm font-black text-[#253330]">Register New Organization</h3>
              <button
                onClick={() => setShowCreateOrgModal(false)}
                className="p-1 hover:bg-[#F0F4F2] rounded-lg text-[#71807C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrganization} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Stanford University Technology Lab"
                  value={newOrgData.name}
                  onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Primary Domain</label>
                <input
                  type="text"
                  placeholder="e.g. stanford.edu"
                  value={newOrgData.domain}
                  onChange={(e) => setNewOrgData({ ...newOrgData, domain: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Contact Email</label>
                <input
                  type="email"
                  placeholder="e.g. admin@stanford.edu"
                  value={newOrgData.contactEmail}
                  onChange={(e) => setNewOrgData({ ...newOrgData, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateOrgModal(false)}
                  className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] text-[#5C6B67] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#315C55] hover:bg-[#254640] text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ASSIGN REVIEWER */}
      {/* ==================================================== */}
      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5EBE8]">
              <h3 className="text-sm font-black text-[#253330]">Assign Project Supervisor</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 hover:bg-[#F0F4F2] rounded-lg text-[#71807C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignReviewer} className="space-y-3.5">
              <p className="text-xs text-[#71807C]">
                Assign a verified supervisor for project:{' '}
                <strong className="text-[#253330]">{selectedProject.title}</strong>
              </p>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Supervisor Role</label>
                <select
                  value={assignReviewerData.role}
                  onChange={(e) => setAssignReviewerData({ ...assignReviewerData, role: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67]"
                >
                  <option value="GUIDE">Guide / Academic Supervisor</option>
                  <option value="PATENT_EXPERT">Patent Expert Clearance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Supervisor Username</label>
                <input
                  type="text"
                  placeholder="e.g. meerajoseph"
                  value={assignReviewerData.username}
                  onChange={(e) => setAssignReviewerData({ ...assignReviewerData, username: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] text-[#5C6B67] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#315C55] hover:bg-[#254640] text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: REVIEW DETAILS */}
      {/* ==================================================== */}
      {selectedReviewDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5EBE8]">
              <h3 className="text-sm font-black text-[#253330]">Review Milestone Details</h3>
              <button
                onClick={() => setSelectedReviewDetails(null)}
                className="p-1 hover:bg-[#F0F4F2] rounded-lg text-[#71807C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#F0F4F2]">
                <span className="text-[#71807C]">Project:</span>
                <span className="font-extrabold text-[#253330]">{selectedReviewDetails.projectTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0F4F2]">
                <span className="text-[#71807C]">Inventor:</span>
                <span className="font-bold text-[#5C6B67]">{selectedReviewDetails.inventor}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0F4F2]">
                <span className="text-[#71807C]">Reviewer:</span>
                <span className="font-bold text-[#315C55]">{selectedReviewDetails.reviewer}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0F4F2]">
                <span className="text-[#71807C]">Review Type:</span>
                <span className="font-bold text-[#253330]">{selectedReviewDetails.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0F4F2]">
                <span className="text-[#71807C]">Decision:</span>
                <span
                  className={`font-black uppercase ${
                    selectedReviewDetails.status === 'APPROVED'
                      ? 'text-emerald-700'
                      : selectedReviewDetails.status === 'PENDING'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {selectedReviewDetails.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0F4F2]">
                <span className="text-[#71807C]">Recorded Date:</span>
                <span className="font-mono text-[#71807C]">{selectedReviewDetails.dueDate}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedReviewDetails.projectId) {
                    navigate(`/dashboard/projects/${selectedReviewDetails.projectId}`);
                  }
                }}
                className="px-4 py-2 bg-[#F0F4F2] hover:bg-[#DDEBE6] text-[#315C55] rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Open Workspace →
              </button>
              <button
                type="button"
                onClick={() => setSelectedReviewDetails(null)}
                className="px-4 py-2 bg-[#315C55] text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CREATE POLICY */}
      {/* ==================================================== */}
      {showCreatePolicyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5EBE8]">
              <div className="flex items-center gap-2 text-[#315C55]">
                <Shield className="w-5 h-5" />
                <h3 className="text-sm font-black text-[#253330]">Create Platform Governance Policy</h3>
              </div>
              <button
                onClick={() => setShowCreatePolicyModal(false)}
                className="p-1 hover:bg-[#F0F4F2] rounded-lg text-[#71807C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Policy Name</label>
                <input
                  type="text"
                  placeholder="e.g. Standard University IP Clearance Policy"
                  value={newPolicyData.name}
                  onChange={(e) => setNewPolicyData({ ...newPolicyData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Mandatory supervisor review and restricted AI drawing export"
                  value={newPolicyData.description}
                  onChange={(e) => setNewPolicyData({ ...newPolicyData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Target Organization</label>
                <select
                  value={newPolicyData.organizationId}
                  onChange={(e) => setNewPolicyData({ ...newPolicyData, organizationId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-bold text-[#5C6B67]"
                >
                  <option value="">Global / Platform Default</option>
                  {organizationsList.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Enforced Rules (JSON Schema)</label>
                <textarea
                  rows={4}
                  value={newPolicyData.rules}
                  onChange={(e) => setNewPolicyData({ ...newPolicyData, rules: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                  required
                />
                <span className="text-[10px] text-[#71807C] block">
                  Keys supported: allowAiFeatures, allowDrawingGeneration, requireDualApproval, allowExport
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5EBE8]">
                <button
                  type="button"
                  onClick={() => setShowCreatePolicyModal(false)}
                  className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] text-[#5C6B67] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#315C55] hover:bg-[#254640] text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Create Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: EDIT POLICY */}
      {/* ==================================================== */}
      {showEditPolicyModal && selectedPolicy && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5EBE8] p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5EBE8]">
              <div className="flex items-center gap-2 text-[#315C55]">
                <Shield className="w-5 h-5" />
                <h3 className="text-sm font-black text-[#253330]">Edit Policy: {selectedPolicy.name}</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditPolicyModal(false);
                  setSelectedPolicy(null);
                }}
                className="p-1 hover:bg-[#F0F4F2] rounded-lg text-[#71807C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePolicy} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Policy Name</label>
                <input
                  type="text"
                  value={selectedPolicy.name}
                  onChange={(e) => setSelectedPolicy({ ...selectedPolicy, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Description</label>
                <input
                  type="text"
                  value={selectedPolicy.description || ''}
                  onChange={(e) => setSelectedPolicy({ ...selectedPolicy, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C6B67]">Enforced Rules (JSON Schema)</label>
                <textarea
                  rows={4}
                  value={typeof selectedPolicy.rules === 'string' ? selectedPolicy.rules : JSON.stringify(selectedPolicy.rules, null, 2)}
                  onChange={(e) => setSelectedPolicy({ ...selectedPolicy, rules: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F7F9F8] border border-[#E5EBE8] rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5EBE8]">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPolicyModal(false);
                    setSelectedPolicy(null);
                  }}
                  className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#F0F4F2] text-[#5C6B67] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#315C55] hover:bg-[#254640] text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
