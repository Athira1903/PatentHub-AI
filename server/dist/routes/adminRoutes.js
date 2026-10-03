"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authorize_1 = require("../policies/middleware/authorize");
const authentication_policy_1 = require("../policies/auth/authentication.policy");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
// Require valid JWT authentication and Admin role for all admin routes
router.use(authMiddleware_1.authenticateToken);
router.use((0, authorize_1.authorize)((user) => authentication_policy_1.AuthenticationPolicy.isAdmin(user)));
router.get('/dashboard', adminController_1.getDashboardMetrics);
// Users
router.get('/users', adminController_1.getUsers);
router.get('/users/:id', adminController_1.getUserProfile);
router.put('/users/:id/status', adminController_1.updateUserStatus);
router.put('/users/:id/role', adminController_1.updateUserRole);
router.delete('/users/:id', adminController_1.deleteUser);
// Roles & Permissions
router.get('/roles-stats', adminController_1.getRolesStats);
router.get('/roles-permissions', adminController_1.getRolePermissions);
router.put('/roles/:roleName/permissions', adminController_1.updateRolePermissions);
// Verification Trust Layer
router.get('/verifications', adminController_1.getVerifications);
router.post('/verifications/:id/decision', adminController_1.processVerification);
// Organizations
router.get('/organizations', adminController_1.getOrganizations);
router.get('/organizations/:id', adminController_1.getOrganizationDetails);
router.post('/organizations', adminController_1.createOrganization);
router.put('/organizations/:id/status', adminController_1.updateOrganizationStatus);
// Projects Ecosystem
router.get('/projects', adminController_1.getProjects);
router.put('/projects/:id/assign', adminController_1.assignProjectReviewer);
// Intelligence & Oversight
router.get('/reviews', adminController_1.getReviewsOversight);
router.get('/claims-fto-oversight', adminController_1.getClaimsFtoOversight);
router.get('/ai-operations', adminController_1.getAiOperations);
// Policies Platform Governance
router.get('/policies', adminController_1.getPolicies);
router.post('/policies', adminController_1.createPolicy);
router.put('/policies/:id', adminController_1.updatePolicy);
router.put('/policies/:id/status', adminController_1.updatePolicyStatus);
// Subscriptions & Billing Oversight
router.get('/subscriptions', adminController_1.getSubscriptions);
router.get('/payments', adminController_1.getPayments);
router.get('/entitlements', adminController_1.getEntitlements);
// Activity Logs & Audit Trail
router.get('/activity-logs', adminController_1.getActivityLogs);
router.get('/audit-logs', adminController_1.getAuditLogs);
// Notifications & Broadcasts
router.get('/notifications', adminController_1.getNotifications);
router.post('/notifications', adminController_1.broadcastNotification);
router.post('/notifications/broadcast', adminController_1.broadcastNotification);
router.put('/notifications/:id/toggle', adminController_1.toggleNotificationStatus);
// Announcements & Settings
router.get('/announcements', adminController_1.getAnnouncements);
router.post('/announcements', adminController_1.createAnnouncement);
router.get('/settings', adminController_1.getSettings);
router.put('/settings', adminController_1.updateSettings);
// Live System Health Probe
router.get('/health', adminController_1.getSystemHealth);
exports.default = router;
