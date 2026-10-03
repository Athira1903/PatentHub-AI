"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const organizationController_1 = require("../controllers/organizationController");
const policyController_1 = require("../controllers/policyController");
const router = (0, express_1.Router)();
// Require JWT authentication for all organization routes
router.use(authMiddleware_1.authenticateToken);
// Organization Profile & Overview
router.get('/my-organization', organizationController_1.getMyOrganization);
router.get('/:id', organizationController_1.getOrganization);
router.put('/:id', organizationController_1.updateOrganization);
router.get('/:id/dashboard', organizationController_1.getOrganizationDashboard);
// Organization User Management
router.get('/:id/users', organizationController_1.getOrganizationUsers);
router.post('/:id/users', organizationController_1.addUserToOrganization);
// Organization Projects
router.get('/:id/projects', organizationController_1.getOrganizationProjects);
// Organization Policy Management
router.get('/:id/policies', policyController_1.getOrganizationPolicies);
router.post('/:id/policies', policyController_1.createPolicy);
router.get('/:id/policies/history', policyController_1.getPolicyAssignmentHistory);
router.get('/:id/policies/:policyId', policyController_1.getPolicyDetails);
router.patch('/:id/policies/:policyId', policyController_1.updatePolicy);
router.patch('/:id/policies/:policyId/status', policyController_1.updatePolicyStatus);
router.get('/:id/policies/:policyId/assignments', policyController_1.getPolicyDetails);
router.post('/:id/policies/:policyId/assign', policyController_1.assignPolicy);
router.delete('/:id/policies/:policyId/assignments/:assignmentId', policyController_1.revokePolicyAssignment);
router.delete('/:id/policies/assignments/:assignmentId', policyController_1.revokePolicyAssignment);
exports.default = router;
