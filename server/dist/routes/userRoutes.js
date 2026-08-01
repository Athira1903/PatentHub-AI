"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Protect all user routes with JWT verification middleware
router.use(authMiddleware_1.authenticateToken);
router.get('/search', userController_1.searchUsers);
router.get('/list', userController_1.listUsers);
router.put('/username', userController_1.updateUsername);
router.put('/:id/promote', userController_1.promoteUser);
router.put('/:id/status', userController_1.toggleUserStatus);
exports.default = router;
