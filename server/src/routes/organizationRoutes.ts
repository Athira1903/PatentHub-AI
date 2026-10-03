import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  getMyOrganization,
  getOrganization,
  updateOrganization,
  getOrganizationDashboard,
  getOrganizationUsers,
  addUserToOrganization,
  getOrganizationProjects,
} from '../controllers/organizationController';
import {
  getOrganizationPolicies,
  createPolicy,
  getPolicyDetails,
  updatePolicy,
  updatePolicyStatus,
  assignPolicy,
  revokePolicyAssignment,
  getPolicyAssignmentHistory,
} from '../controllers/policyController';

const router = Router();

// Require JWT authentication for all organization routes
router.use(authenticateToken as any);

// Organization Profile & Overview
router.get('/my-organization', getMyOrganization as any);
router.get('/:id', getOrganization as any);
router.put('/:id', updateOrganization as any);
router.get('/:id/dashboard', getOrganizationDashboard as any);

// Organization User Management
router.get('/:id/users', getOrganizationUsers as any);
router.post('/:id/users', addUserToOrganization as any);

// Organization Projects
router.get('/:id/projects', getOrganizationProjects as any);

// Organization Policy Management
router.get('/:id/policies', getOrganizationPolicies as any);
router.post('/:id/policies', createPolicy as any);
router.get('/:id/policies/history', getPolicyAssignmentHistory as any);
router.get('/:id/policies/:policyId', getPolicyDetails as any);
router.patch('/:id/policies/:policyId', updatePolicy as any);
router.patch('/:id/policies/:policyId/status', updatePolicyStatus as any);
router.get('/:id/policies/:policyId/assignments', getPolicyDetails as any);
router.post('/:id/policies/:policyId/assign', assignPolicy as any);
router.delete('/:id/policies/:policyId/assignments/:assignmentId', revokePolicyAssignment as any);
router.delete('/:id/policies/assignments/:assignmentId', revokePolicyAssignment as any);

export default router;
