import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AdminService } from '../services/adminService';

export const getDashboardMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await AdminService.getDashboardMetrics();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch admin dashboard metrics.' });
  }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { role, status, search } = req.query;
    const users = await AdminService.getAllUsers(role as string, status as string, search as string);
    res.status(200).json({ users });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch users.' });
  }
};

export const updateUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;
    const user = await AdminService.updateUserStatus(id, Boolean(isActive));
    res.status(200).json({ message: 'User status updated successfully.', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update user status.' });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { roleName } = req.body;
    const user = await AdminService.updateUserRole(id, roleName);
    res.status(200).json({ message: 'User role updated successfully.', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update user role.' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const currentAdminId = req.user?.userId;
    if (id === currentAdminId) {
      res.status(400).json({ message: 'You cannot delete your own logged-in admin account.' });
      return;
    }
    const result = await AdminService.deleteUser(id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete user account.' });
  }
};

export const getVerifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const applications = await AdminService.getVerificationApplications();
    res.status(200).json({ applications });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch verification queue.' });
  }
};

export const processVerification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { decision, notes } = req.body;
    const result = await AdminService.processVerification(id, decision, notes);
    res.status(200).json({ message: `Verification decision recorded: ${decision}`, application: result });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to process verification.' });
  }
};

export const getOrganizations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const organizations = await AdminService.getOrganizations();
    res.status(200).json({ organizations });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch organizations.' });
  }
};

export const createOrganization = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, domain, contactEmail } = req.body;
    const org = await AdminService.createOrganization({ name, domain, contactEmail });
    res.status(201).json({ message: 'Organization created successfully.', organization: org });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create organization.' });
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projects = await AdminService.getAllProjects();
    res.status(200).json({ projects });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch project ecosystem.' });
  }
};

export const assignProjectReviewer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reviewerUsername, role } = req.body;
    const result = await AdminService.assignProjectReviewer(id, reviewerUsername, role);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to assign reviewer.' });
  }
};

export const getReviewsOversight = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await AdminService.getReviewsOversight();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch review oversight data.' });
  }
};

export const getClaimsFtoOversight = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await AdminService.getClaimsFtoOversight();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch claims and FTO oversight.' });
  }
};

export const getAiOperations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await AdminService.getAiOperations();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch AI operations.' });
  }
};

export const getAnnouncements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const announcements = await AdminService.getAnnouncements();
    res.status(200).json({ announcements });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch announcements.' });
  }
};

export const createAnnouncement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ann = await AdminService.createAnnouncement(req.body);
    res.status(201).json({ message: 'Announcement published successfully.', announcement: ann });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create announcement.' });
  }
};

export const getSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const settings = await AdminService.getSettings();
    res.status(200).json({ settings });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch settings.' });
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const settings = await AdminService.updateSettings(req.body);
    res.status(200).json({ message: 'Settings updated successfully.', settings });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update settings.' });
  }
};

export const getActivityLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, type, page, limit } = req.query;
    const data = await AdminService.getActivityLogs(
      search as string,
      type as string,
      page ? parseInt(page as string, 10) : 1,
      limit ? parseInt(limit as string, 10) : 25
    );
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch activity logs.' });
  }
};

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, type, isRead, page, limit } = req.query;
    const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    const data = await AdminService.getPlatformNotifications(
      search as string,
      type as string,
      isReadBool,
      page ? parseInt(page as string, 10) : 1,
      limit ? parseInt(limit as string, 10) : 25
    );
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch platform notifications.' });
  }
};

export const broadcastNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, message, type, targetRole } = req.body;
    if (!title || !message) {
      res.status(400).json({ message: 'Title and message are required.' });
      return;
    }
    const result = await AdminService.broadcastNotification({ title, message, type, targetRole });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to broadcast notification.' });
  }
};

export const getRolesStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await AdminService.getRolesStats();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch roles & permissions stats.' });
  }
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const profile = await AdminService.getUserProfile(id);
    res.status(200).json(profile);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Failed to fetch user profile.' });
  }
};

export const getOrganizationDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const details = await AdminService.getOrganizationDetails(id);
    res.status(200).json(details);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Failed to fetch organization details.' });
  }
};

export const getRolePermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = AdminService.getRolePermissions();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch role permissions matrix.' });
  }
};

export const updateRolePermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const roleName = req.params.roleName as string;
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      res.status(400).json({ message: 'Permissions array is required.' });
      return;
    }
    const result = await AdminService.updateRolePermissions(roleName, permissions, req.user?.userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update role permissions.' });
  }
};

export const updateOrganizationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ message: 'Status is required.' });
      return;
    }
    const result = await AdminService.updateOrganizationStatus(id, status);
    res.status(200).json({ message: 'Organization status updated.', organization: result });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update organization status.' });
  }
};

export const getPolicies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { organizationId, status, search } = req.query;
    const policies = await AdminService.getPolicies(
      organizationId as string,
      status as string,
      search as string
    );
    res.status(200).json({ policies });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch platform policies.' });
  }
};

export const createPolicy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, rules, organizationId, status } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Policy name is required.' });
      return;
    }
    const policy = await AdminService.createPolicy(
      { name, description, rules, organizationId, status },
      req.user!.userId
    );
    res.status(201).json({ message: 'Policy created successfully.', policy });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create policy.' });
  }
};

export const updatePolicy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const policy = await AdminService.updatePolicy(id, req.body);
    res.status(200).json({ message: 'Policy updated successfully.', policy });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update policy.' });
  }
};

export const updatePolicyStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE.' });
      return;
    }
    const policy = await AdminService.updatePolicyStatus(id, status);
    res.status(200).json({ message: `Policy status updated to ${status}.`, policy });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update policy status.' });
  }
};

export const getSubscriptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, organizationId } = req.query;
    const data = await AdminService.getSubscriptions(status as string, organizationId as string);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch subscriptions.' });
  }
};

export const getPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, organizationId, planId, dateFrom, dateTo } = req.query;
    const payments = await AdminService.getPayments({
      status: status as string,
      organizationId: organizationId as string,
      planId: planId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    });
    res.status(200).json({ payments });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch payment records.' });
  }
};

export const getEntitlements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.query;
    const entitlements = await AdminService.getEntitlements(organizationId as string);
    res.status(200).json({ entitlements });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch entitlements.' });
  }
};

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, userId, organizationId, action, dateFrom, dateTo, page, limit } = req.query;
    const data = await AdminService.getAuditLogs({
      search: search as string,
      userId: userId as string,
      organizationId: organizationId as string,
      action: action as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 25,
    });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch audit logs.' });
  }
};

export const getSystemHealth = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const health = await AdminService.getSystemHealth();
    res.status(200).json(health);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to probe system health.' });
  }
};

export const toggleNotificationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const notif = await AdminService.toggleNotificationStatus(id);
    res.status(200).json({ message: 'Notification status updated.', notification: notif });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to toggle notification status.' });
  }
};

