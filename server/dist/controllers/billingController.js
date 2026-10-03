"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const subscriptionService_1 = require("../services/subscriptionService");
const trialService_1 = require("../services/trialService");
const paymentService_1 = require("../services/paymentService");
const entitlementService_1 = require("../services/entitlementService");
const billing_policy_1 = require("../policies/billing/billing.policy");
const db_1 = require("../config/db");
class BillingController {
    /**
     * Helper to resolve organizationId from authenticated request
     */
    static async resolveOrgId(req) {
        if (req.user?.organizationId) {
            return req.user.organizationId;
        }
        if (req.user?.userId) {
            const dbUser = await db_1.prisma.user.findUnique({
                where: { id: req.user.userId },
                select: { id: true, email: true, fullName: true, username: true, organizationId: true },
            });
            if (dbUser?.organizationId) {
                req.user.organizationId = dbUser.organizationId;
                return dbUser.organizationId;
            }
            // Auto-resolve or create organization if missing so no user is stranded
            if (dbUser) {
                let org = null;
                if (dbUser.email && dbUser.email.includes('@')) {
                    const domain = dbUser.email.split('@')[1];
                    org = await db_1.prisma.organization.findFirst({
                        where: {
                            OR: [
                                { contactEmail: { equals: dbUser.email, mode: 'insensitive' } },
                                { domain: { equals: domain, mode: 'insensitive' } },
                                { name: { equals: domain, mode: 'insensitive' } },
                            ],
                        },
                    });
                }
                if (!org) {
                    const orgName = dbUser.fullName ? `${dbUser.fullName}'s Workspace` : `${dbUser.username}'s Workspace`;
                    org = await db_1.prisma.organization.create({
                        data: {
                            name: orgName,
                            domain: dbUser.email.includes('@') ? dbUser.email.split('@')[1] : 'patenthub.ai',
                            contactEmail: dbUser.email,
                            status: 'ACTIVE',
                            verificationStatus: 'VERIFIED',
                            type: 'ACADEMIC',
                        },
                    });
                }
                await db_1.prisma.user.update({
                    where: { id: dbUser.id },
                    data: { organizationId: org.id },
                });
                req.user.organizationId = org.id;
                return org.id;
            }
        }
        return null;
    }
    /**
     * GET /api/billing/plans
     */
    static async getPlans(req, res) {
        try {
            const plans = await subscriptionService_1.SubscriptionService.getAvailablePlans();
            res.status(200).json({ plans });
        }
        catch (error) {
            console.error('[BillingController.getPlans] Error:', error.message);
            res.status(500).json({ message: 'Failed to retrieve subscription plans.' });
        }
    }
    /**
     * GET /api/billing/current
     */
    static async getCurrentSubscription(req, res) {
        try {
            const orgId = await BillingController.resolveOrgId(req);
            if (!orgId) {
                res.status(200).json({
                    organizationId: null,
                    status: 'NONE',
                    plan: null,
                    trial: { hasTrial: false, active: false, daysRemaining: 0, status: 'NONE' },
                    entitlements: [],
                });
                return;
            }
            const subscription = await subscriptionService_1.SubscriptionService.getCurrentSubscription(orgId);
            res.status(200).json(subscription);
        }
        catch (error) {
            console.error('[BillingController.getCurrentSubscription] Error:', error.message);
            res.status(500).json({ message: error.message || 'Failed to fetch subscription status.' });
        }
    }
    /**
     * GET /api/billing/trial
     */
    static async getTrial(req, res) {
        try {
            const orgId = await BillingController.resolveOrgId(req);
            if (!orgId) {
                res.status(200).json({ hasTrial: false, active: false, daysRemaining: 0, status: 'NONE' });
                return;
            }
            const trial = await trialService_1.TrialService.getTrialStatus(orgId);
            res.status(200).json(trial);
        }
        catch (error) {
            console.error('[BillingController.getTrial] Error:', error.message);
            res.status(500).json({ message: error.message || 'Failed to retrieve trial status.' });
        }
    }
    /**
     * POST /api/billing/trial/start
     * Start a trial for an organization (Organization Admin only)
     */
    static async startTrial(req, res) {
        try {
            const orgId = await BillingController.resolveOrgId(req);
            if (!orgId) {
                res.status(400).json({ message: 'User does not belong to an organization.' });
                return;
            }
            if (!(await billing_policy_1.BillingPolicy.canManageBilling(req.user, orgId))) {
                res.status(403).json({ message: 'Only Organization Admins can initiate a free trial.' });
                return;
            }
            const result = await trialService_1.TrialService.startTrial(orgId);
            res.status(201).json({
                message: '14-day free trial successfully activated.',
                ...result,
            });
        }
        catch (error) {
            console.error('[BillingController.startTrial] Error:', error.message);
            res.status(400).json({ message: error.message || 'Failed to start free trial.' });
        }
    }
    /**
     * POST /api/billing/subscription/create
     * Initiate Razorpay checkout order for PRO subscription (Organization Admin only)
     */
    static async createSubscription(req, res) {
        try {
            const orgId = await BillingController.resolveOrgId(req);
            if (!orgId) {
                res.status(400).json({ message: 'User does not belong to an organization.' });
                return;
            }
            if (!(await billing_policy_1.BillingPolicy.canManageBilling(req.user, orgId))) {
                res.status(403).json({ message: 'Only Organization Admins can create subscriptions.' });
                return;
            }
            const { planId } = req.body;
            if (!planId) {
                res.status(400).json({ message: 'planId is required.' });
                return;
            }
            const orderData = await subscriptionService_1.SubscriptionService.initiateProSubscription(orgId, planId, req.user.userId);
            res.status(200).json(orderData);
        }
        catch (error) {
            console.error('[BillingController.createSubscription] Error:', error.message);
            res.status(400).json({ message: error.message || 'Failed to create subscription order.' });
        }
    }
    /**
     * POST /api/billing/subscription/verify
     * Verify signature and activate PRO subscription (Organization Admin only)
     */
    static async verifyPayment(req, res) {
        try {
            const orgId = await BillingController.resolveOrgId(req);
            if (!orgId) {
                res.status(400).json({ message: 'User does not belong to an organization.' });
                return;
            }
            if (!(await billing_policy_1.BillingPolicy.canManageBilling(req.user, orgId))) {
                res.status(403).json({ message: 'Only Organization Admins can verify payments.' });
                return;
            }
            const { planId, razorpayPaymentId, razorpaySubscriptionId, razorpayOrderId, razorpaySignature } = req.body;
            if (!planId || !razorpayPaymentId || !razorpaySignature) {
                res.status(400).json({
                    message: 'planId, razorpayPaymentId, and razorpaySignature are required for verification.',
                });
                return;
            }
            const activated = await subscriptionService_1.SubscriptionService.verifyAndActivateSubscription(orgId, {
                planId,
                razorpayPaymentId,
                razorpaySubscriptionId,
                razorpayOrderId,
                razorpaySignature,
            });
            res.status(200).json({
                message: 'Subscription successfully activated.',
                ...activated,
            });
        }
        catch (error) {
            console.error('[BillingController.verifyPayment] Error:', error.message);
            res.status(400).json({ message: error.message || 'Payment verification failed.' });
        }
    }
    /**
     * POST /api/billing/subscription/cancel
     * Cancel subscription at period end (Organization Admin only)
     */
    static async cancelSubscription(req, res) {
        try {
            const orgId = await BillingController.resolveOrgId(req);
            if (!orgId) {
                res.status(400).json({ message: 'User does not belong to an organization.' });
                return;
            }
            if (!(await billing_policy_1.BillingPolicy.canManageBilling(req.user, orgId))) {
                res.status(403).json({ message: 'Only Organization Admins can cancel subscriptions.' });
                return;
            }
            const result = await subscriptionService_1.SubscriptionService.cancelSubscription(orgId);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('[BillingController.cancelSubscription] Error:', error.message);
            res.status(400).json({ message: error.message || 'Failed to cancel subscription.' });
        }
    }
    /**
     * POST /api/billing/subscription/resume
     * Resume cancelled subscription (Organization Admin only)
     */
    static async resumeSubscription(req, res) {
        try {
            const orgId = await BillingController.resolveOrgId(req);
            if (!orgId) {
                res.status(400).json({ message: 'User does not belong to an organization.' });
                return;
            }
            if (!(await billing_policy_1.BillingPolicy.canManageBilling(req.user, orgId))) {
                res.status(403).json({ message: 'Only Organization Admins can resume subscriptions.' });
                return;
            }
            const result = await subscriptionService_1.SubscriptionService.resumeSubscription(orgId);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('[BillingController.resumeSubscription] Error:', error.message);
            res.status(400).json({ message: error.message || 'Failed to resume subscription.' });
        }
    }
    /**
     * GET /api/billing/payments
     * List payments history for organization (Organization Admin only)
     */
    static async getPayments(req, res) {
        try {
            const orgId = await BillingController.resolveOrgId(req);
            if (!orgId) {
                res.status(200).json({ payments: [], total: 0, limit: 20, offset: 0 });
                return;
            }
            const canManage = await billing_policy_1.BillingPolicy.canManageBilling(req.user, orgId);
            if (!canManage) {
                res.status(200).json({ payments: [], total: 0, limit: 20, offset: 0 });
                return;
            }
            const limit = parseInt(req.query.limit, 10) || 20;
            const offset = parseInt(req.query.offset, 10) || 0;
            const payments = await paymentService_1.PaymentService.getOrganizationPayments(orgId, limit, offset);
            res.status(200).json(payments);
        }
        catch (error) {
            console.error('[BillingController.getPayments] Error:', error.message);
            res.status(500).json({ message: error.message || 'Failed to retrieve payments.' });
        }
    }
    /**
     * GET /api/billing/entitlements
     * Get active entitlements for current user's organization
     */
    static async getEntitlements(req, res) {
        try {
            const orgId = await BillingController.resolveOrgId(req);
            if (!orgId) {
                res.status(200).json({ entitlements: [] });
                return;
            }
            const entitlements = await entitlementService_1.EntitlementService.getOrganizationEntitlements(orgId);
            res.status(200).json({ entitlements });
        }
        catch (error) {
            console.error('[BillingController.getEntitlements] Error:', error.message);
            res.status(500).json({ message: error.message || 'Failed to fetch entitlements.' });
        }
    }
    /**
     * POST /api/billing/webhook/razorpay
     * Handle incoming Razorpay Webhooks
     */
    static async handleRazorpayWebhook(req, res) {
        try {
            const signature = req.headers['x-razorpay-signature'];
            if (!signature) {
                res.status(400).json({ message: 'Missing x-razorpay-signature header.' });
                return;
            }
            const rawBody = req.rawBody || JSON.stringify(req.body);
            const result = await subscriptionService_1.SubscriptionService.processWebhookEvent(rawBody, signature);
            res.status(200).json({
                status: 'ok',
                ...result,
            });
        }
        catch (error) {
            console.error('[BillingController.handleRazorpayWebhook] Error:', error.message);
            res.status(400).json({ message: error.message || 'Webhook processing failed.' });
        }
    }
    /**
     * POST /api/billing/subscription/reset
     * Reset organization subscription state back to NONE for testing checkout flow
     */
    static async resetSubscription(req, res) {
        try {
            const orgId = await BillingController.resolveOrgId(req);
            if (!orgId) {
                res.status(400).json({ message: 'User does not belong to an organization.' });
                return;
            }
            await db_1.prisma.entitlement.deleteMany({ where: { organizationId: orgId } });
            await db_1.prisma.payment.deleteMany({ where: { organizationId: orgId } });
            await db_1.prisma.trial.deleteMany({ where: { organizationId: orgId } });
            await db_1.prisma.subscription.deleteMany({ where: { organizationId: orgId } });
            res.status(200).json({ message: 'Subscription reset successfully to NONE.' });
        }
        catch (error) {
            console.error('[BillingController.resetSubscription] Error:', error.message);
            res.status(500).json({ message: error.message || 'Failed to reset subscription.' });
        }
    }
}
exports.BillingController = BillingController;
