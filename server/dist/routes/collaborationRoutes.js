"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const collaborationController_1 = require("../controllers/collaborationController");
const authorize_1 = require("../policies/middleware/authorize");
const invitation_policy_1 = require("../policies/invitation/invitation.policy");
const db_1 = require("../config/db");
const router = (0, express_1.Router)();
// Protect all collaboration endpoints with JWT verification middleware
router.use(authMiddleware_1.authenticateToken);
router.post('/invite', (0, authorize_1.authorize)(async (user, req) => {
    const { projectId, username, identifier, role } = req.body;
    const targetQuery = (identifier || username || '').trim();
    if (!projectId || !targetQuery || !role)
        return false;
    const project = await db_1.prisma.patentProject.findUnique({
        where: { id: projectId },
        include: { members: true },
    });
    if (!project)
        return false;
    return invitation_policy_1.InvitationPolicy.canInvite(user, project, targetQuery, role);
}), collaborationController_1.inviteMember);
router.post('/respond', (0, authorize_1.authorize)(async (user, req) => {
    const { invitationId } = req.body;
    if (!invitationId)
        return false;
    const invitation = await db_1.prisma.invitation.findUnique({
        where: { id: invitationId },
    });
    if (!invitation)
        return false;
    return invitation_policy_1.InvitationPolicy.canAccept(user, invitation);
}), collaborationController_1.respondToInvitation);
router.get('/invitations', collaborationController_1.listMyInvitations);
router.get('/notifications', collaborationController_1.listMyNotifications);
router.get('/notifications/unread-count', collaborationController_1.getUnreadNotificationsCount);
router.put('/notifications/read-all', collaborationController_1.markAllNotificationsAsRead);
router.put('/notifications/:id/read', (0, authorize_1.authorize)(async (user, req) => {
    const notificationId = req.params.id;
    if (!notificationId)
        return false;
    const notification = await db_1.prisma.notification.findUnique({
        where: { id: notificationId },
    });
    if (!notification)
        return false;
    return notification.userId === user.userId;
}), collaborationController_1.markNotificationAsRead);
router.put('/projects/:projectId/members/:memberId/permission', collaborationController_1.updateMemberPermission);
exports.default = router;
