"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const userController_1 = require("../controllers/userController");
const authorize_1 = require("../policies/middleware/authorize");
const authentication_policy_1 = require("../policies/auth/authentication.policy");
const router = (0, express_1.Router)();
// Protect all user routes with JWT verification middleware
router.use(authMiddleware_1.authenticateToken);
router.get('/search', userController_1.searchUsers);
router.get('/list', (0, authorize_1.authorize)((user) => authentication_policy_1.AuthenticationPolicy.isAdmin(user)), userController_1.listUsers);
router.put('/username', userController_1.updateUsername);
router.put('/:id/promote', (0, authorize_1.authorize)((user) => authentication_policy_1.AuthenticationPolicy.isAdmin(user)), userController_1.promoteUser);
router.put('/:id/status', (0, authorize_1.authorize)((user) => authentication_policy_1.AuthenticationPolicy.isAdmin(user)), userController_1.toggleUserStatus);
exports.default = router;
