"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleNotificationStatus = exports.getSystemHealth = exports.getAuditLogs = exports.getEntitlements = exports.getPayments = exports.getSubscriptions = exports.updatePolicyStatus = exports.updatePolicy = exports.createPolicy = exports.getPolicies = exports.updateOrganizationStatus = exports.updateRolePermissions = exports.getRolePermissions = exports.getOrganizationDetails = exports.getUserProfile = exports.getRolesStats = exports.broadcastNotification = exports.getNotifications = exports.getActivityLogs = exports.updateSettings = exports.getSettings = exports.createAnnouncement = exports.getAnnouncements = exports.getAiOperations = exports.getClaimsFtoOversight = exports.getReviewsOversight = exports.assignProjectReviewer = exports.getProjects = exports.createOrganization = exports.getOrganizations = exports.processVerification = exports.getVerifications = exports.deleteUser = exports.updateUserRole = exports.updateUserStatus = exports.getUsers = exports.getDashboardMetrics = void 0;
const adminService_1 = require("../services/adminService");
const getDashboardMetrics = async (req, res) => {
    try {
        const data = await adminService_1.AdminService.getDashboardMetrics();
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch admin dashboard metrics.' });
    }
};
exports.getDashboardMetrics = getDashboardMetrics;
const getUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;
        const users = await adminService_1.AdminService.getAllUsers(role, status, search);
        res.status(200).json({ users });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch users.' });
    }
};
exports.getUsers = getUsers;
const updateUserStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { isActive } = req.body;
        const user = await adminService_1.AdminService.updateUserStatus(id, Boolean(isActive));
        res.status(200).json({ message: 'User status updated successfully.', user });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update user status.' });
    }
};
exports.updateUserStatus = updateUserStatus;
const updateUserRole = async (req, res) => {
    try {
        const id = req.params.id;
        const { roleName } = req.body;
        const user = await adminService_1.AdminService.updateUserRole(id, roleName);
        res.status(200).json({ message: 'User role updated successfully.', user });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update user role.' });
    }
};
exports.updateUserRole = updateUserRole;
const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const currentAdminId = req.user?.userId;
        if (id === currentAdminId) {
            res.status(400).json({ message: 'You cannot delete your own logged-in admin account.' });
            return;
        }
        const result = await adminService_1.AdminService.deleteUser(id);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to delete user account.' });
    }
};
exports.deleteUser = deleteUser;
const getVerifications = async (req, res) => {
    try {
        const applications = await adminService_1.AdminService.getVerificationApplications();
        res.status(200).json({ applications });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch verification queue.' });
    }
};
exports.getVerifications = getVerifications;
const processVerification = async (req, res) => {
    try {
        const id = req.params.id;
        const { decision, notes } = req.body;
        const result = await adminService_1.AdminService.processVerification(id, decision, notes);
        res.status(200).json({ message: `Verification decision recorded: ${decision}`, application: result });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to process verification.' });
    }
};
exports.processVerification = processVerification;
const getOrganizations = async (req, res) => {
    try {
        const organizations = await adminService_1.AdminService.getOrganizations();
        res.status(200).json({ organizations });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch organizations.' });
    }
};
exports.getOrganizations = getOrganizations;
const createOrganization = async (req, res) => {
    try {
        const { name, domain, contactEmail } = req.body;
        const org = await adminService_1.AdminService.createOrganization({ name, domain, contactEmail });
        res.status(201).json({ message: 'Organization created successfully.', organization: org });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to create organization.' });
    }
};
exports.createOrganization = createOrganization;
const getProjects = async (req, res) => {
    try {
        const projects = await adminService_1.AdminService.getAllProjects();
        res.status(200).json({ projects });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch project ecosystem.' });
    }
};
exports.getProjects = getProjects;
const assignProjectReviewer = async (req, res) => {
    try {
        const id = req.params.id;
        const { reviewerUsername, role } = req.body;
        const result = await adminService_1.AdminService.assignProjectReviewer(id, reviewerUsername, role);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to assign reviewer.' });
    }
};
exports.assignProjectReviewer = assignProjectReviewer;
const getReviewsOversight = async (req, res) => {
    try {
        const data = await adminService_1.AdminService.getReviewsOversight();
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch review oversight data.' });
    }
};
exports.getReviewsOversight = getReviewsOversight;
const getClaimsFtoOversight = async (req, res) => {
    try {
        const data = await adminService_1.AdminService.getClaimsFtoOversight();
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch claims and FTO oversight.' });
    }
};
exports.getClaimsFtoOversight = getClaimsFtoOversight;
const getAiOperations = async (req, res) => {
    try {
        const data = await adminService_1.AdminService.getAiOperations();
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch AI operations.' });
    }
};
exports.getAiOperations = getAiOperations;
const getAnnouncements = async (req, res) => {
    try {
        const announcements = await adminService_1.AdminService.getAnnouncements();
        res.status(200).json({ announcements });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch announcements.' });
    }
};
exports.getAnnouncements = getAnnouncements;
const createAnnouncement = async (req, res) => {
    try {
        const ann = await adminService_1.AdminService.createAnnouncement(req.body);
        res.status(201).json({ message: 'Announcement published successfully.', announcement: ann });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to create announcement.' });
    }
};
exports.createAnnouncement = createAnnouncement;
const getSettings = async (req, res) => {
    try {
        const settings = await adminService_1.AdminService.getSettings();
        res.status(200).json({ settings });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch settings.' });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const settings = await adminService_1.AdminService.updateSettings(req.body);
        res.status(200).json({ message: 'Settings updated successfully.', settings });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update settings.' });
    }
};
exports.updateSettings = updateSettings;
const getActivityLogs = async (req, res) => {
    try {
        const { search, type, page, limit } = req.query;
        const data = await adminService_1.AdminService.getActivityLogs(search, type, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 25);
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch activity logs.' });
    }
};
exports.getActivityLogs = getActivityLogs;
const getNotifications = async (req, res) => {
    try {
        const { search, type, isRead, page, limit } = req.query;
        const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
        const data = await adminService_1.AdminService.getPlatformNotifications(search, type, isReadBool, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 25);
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch platform notifications.' });
    }
};
exports.getNotifications = getNotifications;
const broadcastNotification = async (req, res) => {
    try {
        const { title, message, type, targetRole } = req.body;
        if (!title || !message) {
            res.status(400).json({ message: 'Title and message are required.' });
            return;
        }
        const result = await adminService_1.AdminService.broadcastNotification({ title, message, type, targetRole });
        res.status(201).json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to broadcast notification.' });
    }
};
exports.broadcastNotification = broadcastNotification;
const getRolesStats = async (req, res) => {
    try {
        const data = await adminService_1.AdminService.getRolesStats();
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch roles & permissions stats.' });
    }
};
exports.getRolesStats = getRolesStats;
const getUserProfile = async (req, res) => {
    try {
        const id = req.params.id;
        const profile = await adminService_1.AdminService.getUserProfile(id);
        res.status(200).json(profile);
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Failed to fetch user profile.' });
    }
};
exports.getUserProfile = getUserProfile;
const getOrganizationDetails = async (req, res) => {
    try {
        const id = req.params.id;
        const details = await adminService_1.AdminService.getOrganizationDetails(id);
        res.status(200).json(details);
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Failed to fetch organization details.' });
    }
};
exports.getOrganizationDetails = getOrganizationDetails;
const getRolePermissions = async (req, res) => {
    try {
        const data = adminService_1.AdminService.getRolePermissions();
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch role permissions matrix.' });
    }
};
exports.getRolePermissions = getRolePermissions;
const updateRolePermissions = async (req, res) => {
    try {
        const roleName = req.params.roleName;
        const { permissions } = req.body;
        if (!Array.isArray(permissions)) {
            res.status(400).json({ message: 'Permissions array is required.' });
            return;
        }
        const result = await adminService_1.AdminService.updateRolePermissions(roleName, permissions, req.user?.userId);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update role permissions.' });
    }
};
exports.updateRolePermissions = updateRolePermissions;
const updateOrganizationStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        if (!status) {
            res.status(400).json({ message: 'Status is required.' });
            return;
        }
        const result = await adminService_1.AdminService.updateOrganizationStatus(id, status);
        res.status(200).json({ message: 'Organization status updated.', organization: result });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update organization status.' });
    }
};
exports.updateOrganizationStatus = updateOrganizationStatus;
const getPolicies = async (req, res) => {
    try {
        const { organizationId, status, search } = req.query;
        const policies = await adminService_1.AdminService.getPolicies(organizationId, status, search);
        res.status(200).json({ policies });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch platform policies.' });
    }
};
exports.getPolicies = getPolicies;
const createPolicy = async (req, res) => {
    try {
        const { name, description, rules, organizationId, status } = req.body;
        if (!name) {
            res.status(400).json({ message: 'Policy name is required.' });
            return;
        }
        const policy = await adminService_1.AdminService.createPolicy({ name, description, rules, organizationId, status }, req.user.userId);
        res.status(201).json({ message: 'Policy created successfully.', policy });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to create policy.' });
    }
};
exports.createPolicy = createPolicy;
const updatePolicy = async (req, res) => {
    try {
        const id = req.params.id;
        const policy = await adminService_1.AdminService.updatePolicy(id, req.body);
        res.status(200).json({ message: 'Policy updated successfully.', policy });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update policy.' });
    }
};
exports.updatePolicy = updatePolicy;
const updatePolicyStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
            res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE.' });
            return;
        }
        const policy = await adminService_1.AdminService.updatePolicyStatus(id, status);
        res.status(200).json({ message: `Policy status updated to ${status}.`, policy });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to update policy status.' });
    }
};
exports.updatePolicyStatus = updatePolicyStatus;
const getSubscriptions = async (req, res) => {
    try {
        const { status, organizationId } = req.query;
        const data = await adminService_1.AdminService.getSubscriptions(status, organizationId);
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch subscriptions.' });
    }
};
exports.getSubscriptions = getSubscriptions;
const getPayments = async (req, res) => {
    try {
        const { status, organizationId, planId, dateFrom, dateTo } = req.query;
        const payments = await adminService_1.AdminService.getPayments({
            status: status,
            organizationId: organizationId,
            planId: planId,
            dateFrom: dateFrom,
            dateTo: dateTo,
        });
        res.status(200).json({ payments });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch payment records.' });
    }
};
exports.getPayments = getPayments;
const getEntitlements = async (req, res) => {
    try {
        const { organizationId } = req.query;
        const entitlements = await adminService_1.AdminService.getEntitlements(organizationId);
        res.status(200).json({ entitlements });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch entitlements.' });
    }
};
exports.getEntitlements = getEntitlements;
const getAuditLogs = async (req, res) => {
    try {
        const { search, userId, organizationId, action, dateFrom, dateTo, page, limit } = req.query;
        const data = await adminService_1.AdminService.getAuditLogs({
            search: search,
            userId: userId,
            organizationId: organizationId,
            action: action,
            dateFrom: dateFrom,
            dateTo: dateTo,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 25,
        });
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch audit logs.' });
    }
};
exports.getAuditLogs = getAuditLogs;
const getSystemHealth = async (_req, res) => {
    try {
        const health = await adminService_1.AdminService.getSystemHealth();
        res.status(200).json(health);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to probe system health.' });
    }
};
exports.getSystemHealth = getSystemHealth;
const toggleNotificationStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const notif = await adminService_1.AdminService.toggleNotificationStatus(id);
        res.status(200).json({ message: 'Notification status updated.', notification: notif });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to toggle notification status.' });
    }
};
exports.toggleNotificationStatus = toggleNotificationStatus;
