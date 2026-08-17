import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorize } from '../policies/middleware/authorize';
import { AuthenticationPolicy } from '../policies/auth/authentication.policy';
import {
  getDashboardMetrics,
  getUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getVerifications,
  processVerification,
  getOrganizations,
  createOrganization,
  getProjects,
  assignProjectReviewer,
  getReviewsOversight,
  getClaimsFtoOversight,
  getAiOperations,
  getAnnouncements,
  createAnnouncement,
  getSettings,
  updateSettings,
} from '../controllers/adminController';

const router = Router();

// Require valid JWT authentication and Admin role for all admin routes
router.use(authenticateToken as any);
router.use(authorize((user) => AuthenticationPolicy.isAdmin(user)) as any);

router.get('/dashboard', getDashboardMetrics as any);

// Users
router.get('/users', getUsers as any);
router.put('/users/:id/status', updateUserStatus as any);
router.put('/users/:id/role', updateUserRole as any);
router.delete('/users/:id', deleteUser as any);

// Verification Trust Layer
router.get('/verifications', getVerifications as any);
router.post('/verifications/:id/decision', processVerification as any);

// Organizations
router.get('/organizations', getOrganizations as any);
router.post('/organizations', createOrganization as any);

// Projects Ecosystem
router.get('/projects', getProjects as any);
router.put('/projects/:id/assign', assignProjectReviewer as any);

// Intelligence & Oversight
router.get('/reviews', getReviewsOversight as any);
router.get('/claims-fto-oversight', getClaimsFtoOversight as any);
router.get('/ai-operations', getAiOperations as any);

// Announcements & Settings
router.get('/announcements', getAnnouncements as any);
router.post('/announcements', createAnnouncement as any);
router.get('/settings', getSettings as any);
router.put('/settings', updateSettings as any);

export default router;
