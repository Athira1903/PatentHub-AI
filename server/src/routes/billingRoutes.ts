import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public / Authenticated plans
router.get('/plans', BillingController.getPlans as any);

// Current subscription & trial status
router.get('/current', authenticateToken as any, BillingController.getCurrentSubscription as any);
router.get('/trial', authenticateToken as any, BillingController.getTrial as any);
router.post('/trial/start', authenticateToken as any, BillingController.startTrial as any);

// Subscription checkout & verification
router.post('/subscription/create', authenticateToken as any, BillingController.createSubscription as any);
router.post('/subscription/verify', authenticateToken as any, BillingController.verifyPayment as any);
router.post('/subscription/cancel', authenticateToken as any, BillingController.cancelSubscription as any);
router.post('/subscription/resume', authenticateToken as any, BillingController.resumeSubscription as any);
router.post('/subscription/reset', authenticateToken as any, BillingController.resetSubscription as any);

// Payments & Entitlements
router.get('/payments', authenticateToken as any, BillingController.getPayments as any);
router.get('/entitlements', authenticateToken as any, BillingController.getEntitlements as any);

// Razorpay Webhook (verified cryptographically via HMAC)
router.post('/webhook/razorpay', BillingController.handleRazorpayWebhook as any);

export default router;
