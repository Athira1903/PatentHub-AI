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
router.put('/users/:id/status', adminController_1.updateUserStatus);
router.put('/users/:id/role', adminController_1.updateUserRole);
router.delete('/users/:id', adminController_1.deleteUser);
// Verification Trust Layer
router.get('/verifications', adminController_1.getVerifications);
router.post('/verifications/:id/decision', adminController_1.processVerification);
// Organizations
router.get('/organizations', adminController_1.getOrganizations);
router.post('/organizations', adminController_1.createOrganization);
// Projects Ecosystem
router.get('/projects', adminController_1.getProjects);
router.put('/projects/:id/assign', adminController_1.assignProjectReviewer);
// Intelligence & Oversight
router.get('/reviews', adminController_1.getReviewsOversight);
router.get('/claims-fto-oversight', adminController_1.getClaimsFtoOversight);
router.get('/ai-operations', adminController_1.getAiOperations);
// Announcements & Settings
router.get('/announcements', adminController_1.getAnnouncements);
router.post('/announcements', adminController_1.createAnnouncement);
router.get('/settings', adminController_1.getSettings);
router.put('/settings', adminController_1.updateSettings);
exports.default = router;
