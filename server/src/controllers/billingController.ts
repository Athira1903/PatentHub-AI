import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { SubscriptionService } from '../services/subscriptionService';
import { TrialService } from '../services/trialService';
import { PaymentService } from '../services/paymentService';
import { EntitlementService } from '../services/entitlementService';
import { BillingPolicy } from '../policies/billing/billing.policy';
import { prisma } from '../config/db';

export class BillingController {
  /**
   * Helper to resolve organizationId from authenticated request
   */
  private static async resolveOrgId(req: AuthenticatedRequest): Promise<string | null> {
    if (req.user?.organizationId) {
      return req.user.organizationId;
    }
    if (req.user?.userId) {
      const dbUser = await prisma.user.findUnique({
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
          org = await prisma.organization.findFirst({
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
          org = await prisma.organization.create({
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

        await prisma.user.update({
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
  public static async getPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const plans = await SubscriptionService.getAvailablePlans();
      res.status(200).json({ plans });
    } catch (error: any) {
      console.error('[BillingController.getPlans] Error:', error.message);
      res.status(500).json({ message: 'Failed to retrieve subscription plans.' });
    }
  }

  /**
   * GET /api/billing/current
   */
  public static async getCurrentSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const subscription = await SubscriptionService.getCurrentSubscription(orgId);
      res.status(200).json(subscription);
    } catch (error: any) {
      console.error('[BillingController.getCurrentSubscription] Error:', error.message);
      res.status(500).json({ message: error.message || 'Failed to fetch subscription status.' });
    }
  }

  /**
   * GET /api/billing/trial
   */
  public static async getTrial(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orgId = await BillingController.resolveOrgId(req);
      if (!orgId) {
        res.status(200).json({ hasTrial: false, active: false, daysRemaining: 0, status: 'NONE' });
        return;
      }

      const trial = await TrialService.getTrialStatus(orgId);
      res.status(200).json(trial);
    } catch (error: any) {
      console.error('[BillingController.getTrial] Error:', error.message);
      res.status(500).json({ message: error.message || 'Failed to retrieve trial status.' });
    }
  }

  /**
   * POST /api/billing/trial/start
   * Start a trial for an organization (Organization Admin only)
   */
  public static async startTrial(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orgId = await BillingController.resolveOrgId(req);
      if (!orgId) {
        res.status(400).json({ message: 'User does not belong to an organization.' });
        return;
      }

      if (!(await BillingPolicy.canManageBilling(req.user, orgId))) {
        res.status(403).json({ message: 'Only Organization Admins can initiate a free trial.' });
        return;
      }

      const result = await TrialService.startTrial(orgId);
      res.status(201).json({
        message: '14-day free trial successfully activated.',
        ...result,
      });
    } catch (error: any) {
      console.error('[BillingController.startTrial] Error:', error.message);
      res.status(400).json({ message: error.message || 'Failed to start free trial.' });
    }
  }

  /**
   * POST /api/billing/subscription/create
   * Initiate Razorpay checkout order for PRO subscription (Organization Admin only)
   */
  public static async createSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orgId = await BillingController.resolveOrgId(req);
      if (!orgId) {
        res.status(400).json({ message: 'User does not belong to an organization.' });
        return;
      }

      if (!(await BillingPolicy.canManageBilling(req.user, orgId))) {
        res.status(403).json({ message: 'Only Organization Admins can create subscriptions.' });
        return;
      }

      const { planId } = req.body;
      if (!planId) {
        res.status(400).json({ message: 'planId is required.' });
        return;
      }

      const orderData = await SubscriptionService.initiateProSubscription(
        orgId,
        planId,
        req.user!.userId
      );

      res.status(200).json(orderData);
    } catch (error: any) {
      console.error('[BillingController.createSubscription] Error:', error.message);
      res.status(400).json({ message: error.message || 'Failed to create subscription order.' });
    }
  }

  /**
   * POST /api/billing/subscription/verify
   * Verify signature and activate PRO subscription (Organization Admin only)
   */
  public static async verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orgId = await BillingController.resolveOrgId(req);
      if (!orgId) {
        res.status(400).json({ message: 'User does not belong to an organization.' });
        return;
      }

      if (!(await BillingPolicy.canManageBilling(req.user, orgId))) {
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

      const activated = await SubscriptionService.verifyAndActivateSubscription(orgId, {
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
    } catch (error: any) {
      console.error('[BillingController.verifyPayment] Error:', error.message);
      res.status(400).json({ message: error.message || 'Payment verification failed.' });
    }
  }

  /**
   * POST /api/billing/subscription/cancel
   * Cancel subscription at period end (Organization Admin only)
   */
  public static async cancelSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orgId = await BillingController.resolveOrgId(req);
      if (!orgId) {
        res.status(400).json({ message: 'User does not belong to an organization.' });
        return;
      }

      if (!(await BillingPolicy.canManageBilling(req.user, orgId))) {
        res.status(403).json({ message: 'Only Organization Admins can cancel subscriptions.' });
        return;
      }

      const result = await SubscriptionService.cancelSubscription(orgId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[BillingController.cancelSubscription] Error:', error.message);
      res.status(400).json({ message: error.message || 'Failed to cancel subscription.' });
    }
  }

  /**
   * POST /api/billing/subscription/resume
   * Resume cancelled subscription (Organization Admin only)
   */
  public static async resumeSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orgId = await BillingController.resolveOrgId(req);
      if (!orgId) {
        res.status(400).json({ message: 'User does not belong to an organization.' });
        return;
      }

      if (!(await BillingPolicy.canManageBilling(req.user, orgId))) {
        res.status(403).json({ message: 'Only Organization Admins can resume subscriptions.' });
        return;
      }

      const result = await SubscriptionService.resumeSubscription(orgId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('[BillingController.resumeSubscription] Error:', error.message);
      res.status(400).json({ message: error.message || 'Failed to resume subscription.' });
    }
  }

  /**
   * GET /api/billing/payments
   * List payments history for organization (Organization Admin only)
   */
  public static async getPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orgId = await BillingController.resolveOrgId(req);
      if (!orgId) {
        res.status(200).json({ payments: [], total: 0, limit: 20, offset: 0 });
        return;
      }

      const canManage = await BillingPolicy.canManageBilling(req.user, orgId);
      if (!canManage) {
        res.status(200).json({ payments: [], total: 0, limit: 20, offset: 0 });
        return;
      }

      const limit = parseInt(req.query.limit as string, 10) || 20;
      const offset = parseInt(req.query.offset as string, 10) || 0;

      const payments = await PaymentService.getOrganizationPayments(orgId, limit, offset);
      res.status(200).json(payments);
    } catch (error: any) {
      console.error('[BillingController.getPayments] Error:', error.message);
      res.status(500).json({ message: error.message || 'Failed to retrieve payments.' });
    }
  }

  /**
   * GET /api/billing/entitlements
   * Get active entitlements for current user's organization
   */
  public static async getEntitlements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orgId = await BillingController.resolveOrgId(req);
      if (!orgId) {
        res.status(200).json({ entitlements: [] });
        return;
      }

      const entitlements = await EntitlementService.getOrganizationEntitlements(orgId);
      res.status(200).json({ entitlements });
    } catch (error: any) {
      console.error('[BillingController.getEntitlements] Error:', error.message);
      res.status(500).json({ message: error.message || 'Failed to fetch entitlements.' });
    }
  }

  /**
   * POST /api/billing/webhook/razorpay
   * Handle incoming Razorpay Webhooks
   */
  public static async handleRazorpayWebhook(req: any, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      if (!signature) {
        res.status(400).json({ message: 'Missing x-razorpay-signature header.' });
        return;
      }

      const rawBody = req.rawBody || JSON.stringify(req.body);
      const result = await SubscriptionService.processWebhookEvent(rawBody, signature);

      res.status(200).json({
        status: 'ok',
        ...result,
      });
    } catch (error: any) {
      console.error('[BillingController.handleRazorpayWebhook] Error:', error.message);
      res.status(400).json({ message: error.message || 'Webhook processing failed.' });
    }
  }

  /**
   * POST /api/billing/subscription/reset
   * Reset organization subscription state back to NONE for testing checkout flow
   */
  public static async resetSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orgId = await BillingController.resolveOrgId(req);
      if (!orgId) {
        res.status(400).json({ message: 'User does not belong to an organization.' });
        return;
      }

      await prisma.entitlement.deleteMany({ where: { organizationId: orgId } });
      await prisma.payment.deleteMany({ where: { organizationId: orgId } });
      await prisma.trial.deleteMany({ where: { organizationId: orgId } });
      await prisma.subscription.deleteMany({ where: { organizationId: orgId } });

      res.status(200).json({ message: 'Subscription reset successfully to NONE.' });
    } catch (error: any) {
      console.error('[BillingController.resetSubscription] Error:', error.message);
      res.status(500).json({ message: error.message || 'Failed to reset subscription.' });
    }
  }
}
