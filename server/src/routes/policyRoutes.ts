import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getMyPolicies } from '../controllers/policyController';

const router = Router();

// Require JWT authentication for all policy user routes
router.use(authenticateToken as any);

// User's own assigned policies (Inventor, Guide, Patent Expert)
router.get('/my-policies', getMyPolicies as any);

export default router;
