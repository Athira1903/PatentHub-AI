import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  searchUsers,
  listUsers,
  promoteUser,
  toggleUserStatus,
  updateUsername,
} from '../controllers/userController';

const router = Router();

// Protect all user routes with JWT verification middleware
router.use(authenticateToken as any);

router.get('/search', searchUsers as any);
router.get('/list', listUsers as any);
router.put('/username', updateUsername as any);
router.put('/:id/promote', promoteUser as any);
router.put('/:id/status', toggleUserStatus as any);

export default router;