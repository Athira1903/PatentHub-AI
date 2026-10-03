"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const policyController_1 = require("../controllers/policyController");
const router = (0, express_1.Router)();
// Require JWT authentication for all policy user routes
router.use(authMiddleware_1.authenticateToken);
// User's own assigned policies (Inventor, Guide, Patent Expert)
router.get('/my-policies', policyController_1.getMyPolicies);
exports.default = router;
