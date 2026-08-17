import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  inviteMember,
  respondToInvitation,
  listMyInvitations,
  listMyNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/collaborationController';
import { authorize } from '../policies/middleware/authorize';
import { InvitationPolicy } from '../policies/invitation/invitation.policy';
import { prisma } from '../config/db';

const router = Router();

// Protect all collaboration endpoints with JWT verification middleware
router.use(authenticateToken as any);

router.post(
  '/invite',
  authorize(async (user, req) => {
    const { projectId, username, identifier, role } = req.body;
    const targetQuery = (identifier || username || '').trim();
    if (!projectId || !targetQuery || !role) return false;
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project) return false;
    return InvitationPolicy.canInvite(user, project, targetQuery, role);
  }) as any,
  inviteMember as any
);

router.post(
  '/respond',
  authorize(async (user, req) => {
    const { invitationId } = req.body;
    if (!invitationId) return false;
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation) return false;
    return InvitationPolicy.canAccept(user, invitation);
  }) as any,
  respondToInvitation as any
);

router.get('/invitations', listMyInvitations as any);
router.get('/notifications', listMyNotifications as any);
router.get('/notifications/unread-count', getUnreadNotificationsCount as any);

router.put('/notifications/read-all', markAllNotificationsAsRead as any);
router.put(
  '/notifications/:id/read',
  authorize(async (user, req) => {
    const notificationId = req.params.id;
    if (!notificationId) return false;
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) return false;
    return notification.userId === user.userId;
  }) as any,
  markNotificationAsRead as any
);

export default router;