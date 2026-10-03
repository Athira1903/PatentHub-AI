"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billingController_1 = require("../controllers/billingController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public / Authenticated plans
router.get('/plans', billingController_1.BillingController.getPlans);
// Current subscription & trial status
router.get('/current', authMiddleware_1.authenticateToken, billingController_1.BillingController.getCurrentSubscription);
router.get('/trial', authMiddleware_1.authenticateToken, billingController_1.BillingController.getTrial);
router.post('/trial/start', authMiddleware_1.authenticateToken, billingController_1.BillingController.startTrial);
// Subscription checkout & verification
router.post('/subscription/create', authMiddleware_1.authenticateToken, billingController_1.BillingController.createSubscription);
router.post('/subscription/verify', authMiddleware_1.authenticateToken, billingController_1.BillingController.verifyPayment);
router.post('/subscription/cancel', authMiddleware_1.authenticateToken, billingController_1.BillingController.cancelSubscription);
router.post('/subscription/resume', authMiddleware_1.authenticateToken, billingController_1.BillingController.resumeSubscription);
router.post('/subscription/reset', authMiddleware_1.authenticateToken, billingController_1.BillingController.resetSubscription);
// Payments & Entitlements
router.get('/payments', authMiddleware_1.authenticateToken, billingController_1.BillingController.getPayments);
router.get('/entitlements', authMiddleware_1.authenticateToken, billingController_1.BillingController.getEntitlements);
// Razorpay Webhook (verified cryptographically via HMAC)
router.post('/webhook/razorpay', billingController_1.BillingController.handleRazorpayWebhook);
exports.default = router;
