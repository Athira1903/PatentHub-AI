import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  listMyNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/collaborationController';

const router = Router();

// Protect all notification endpoints with JWT verification
router.use(authenticateToken as any);

router.get('/', listMyNotifications as any);
router.get('/unread-count', getUnreadNotificationsCount as any);
router.put('/read-all', markAllNotificationsAsRead as any);
router.put('/:id/read', markNotificationAsRead as any);

export default router;
