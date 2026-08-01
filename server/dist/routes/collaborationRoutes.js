"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const collaborationController_1 = require("../controllers/collaborationController");
const router = (0, express_1.Router)();
// Protect all collaboration endpoints with JWT verification middleware
router.use(authMiddleware_1.authenticateToken);
router.post('/invite', collaborationController_1.inviteMember);
router.post('/respond', collaborationController_1.respondToInvitation);
router.get('/invitations', collaborationController_1.listMyInvitations);
router.get('/notifications', collaborationController_1.listMyNotifications);
router.put('/notifications/:id/read', collaborationController_1.markNotificationAsRead);
exports.default = router;
