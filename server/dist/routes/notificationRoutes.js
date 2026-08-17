"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const collaborationController_1 = require("../controllers/collaborationController");
const router = (0, express_1.Router)();
// Protect all notification endpoints with JWT verification
router.use(authMiddleware_1.authenticateToken);
router.get('/', collaborationController_1.listMyNotifications);
router.get('/unread-count', collaborationController_1.getUnreadNotificationsCount);
router.put('/read-all', collaborationController_1.markAllNotificationsAsRead);
router.put('/:id/read', collaborationController_1.markNotificationAsRead);
exports.default = router;
