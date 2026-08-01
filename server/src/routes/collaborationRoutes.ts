import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  inviteMember,
  respondToInvitation,
  listMyInvitations,
  listMyNotifications,
  markNotificationAsRead,
} from '../controllers/collaborationController';

const router = Router();

// Protect all collaboration endpoints with JWT verification middleware
router.use(authenticateToken as any);

router.post('/invite', inviteMember as any);
router.post('/respond', respondToInvitation as any);
router.get('/invitations', listMyInvitations as any);
router.get('/notifications', listMyNotifications as any);
router.put('/notifications/:id/read', markNotificationAsRead as any);

export default router;