import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  searchUsers,
  listUsers,
  promoteUser,
  toggleUserStatus,
  updateUsername,
} from '../controllers/userController';
import { authorize } from '../policies/middleware/authorize';
import { AuthenticationPolicy } from '../policies/auth/authentication.policy';

const router = Router();

// Protect all user routes with JWT verification middleware
router.use(authenticateToken as any);

router.get('/search', searchUsers as any);
router.get('/list', authorize((user) => AuthenticationPolicy.isAdmin(user)) as any, listUsers as any);
router.put('/username', updateUsername as any);
router.put('/:id/promote', authorize((user) => AuthenticationPolicy.isAdmin(user)) as any, promoteUser as any);
router.put('/:id/status', authorize((user) => AuthenticationPolicy.isAdmin(user)) as any, toggleUserStatus as any);

export default router;