"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrialService = void 0;
const db_1 = require("../config/db");
const entitlementService_1 = require("./entitlementService");
class TrialService {
    static getDefaultTrialDays() {
        const envDays = process.env.FREE_TRIAL_DAYS;
        if (envDays && !isNaN(parseInt(envDays, 10))) {
            return parseInt(envDays, 10);
        }
        return 14;
    }
    /**
     * Start a trial for an organization.
     * STRICT RULE: Exactly 1 trial per organization.
     * If a trial has already been started or consumed, this will throw an error.
     */
    static async startTrial(organizationId, durationDays) {
        if (!organizationId) {
            throw new Error('organizationId is required to start a trial.');
        }
        const org = await db_1.prisma.organization.findUnique({
            where: { id: organizationId },
        });
        if (!org) {
            throw new Error(`Organization with ID ${organizationId} not found.`);
        }
        // Check if trial already exists for this organization
        const existingTrial = await db_1.prisma.trial.findUnique({
            where: { organizationId },
        });
        if (existingTrial) {
            throw new Error('This organization has already used or initiated its free trial.');
        }
        // Check if organization has an existing active PRO subscription
        const activeSub = await db_1.prisma.subscription.findFirst({
            where: {
                organizationId,
                status: { in: ['ACTIVE', 'TRIALING'] },
            },
        });
        if (activeSub && activeSub.status === 'ACTIVE') {
            throw new Error('Organization already has an active subscription.');
        }
        const days = durationDays || this.getDefaultTrialDays();
        const startedAt = new Date();
        const expiresAt = new Date(startedAt.getTime() + days * 24 * 60 * 60 * 1000);
        // Ensure FREE_TRIAL plan exists in DB
        let trialPlan = await db_1.prisma.subscriptionPlan.findUnique({
            where: { code: 'FREE_TRIAL' },
        });
        if (!trialPlan) {
            trialPlan = await db_1.prisma.subscriptionPlan.create({
                data: {
                    name: 'Free Trial',
                    code: 'FREE_TRIAL',
                    description: '14-day full feature trial for new organizations',
                    amount: 0,
                    currency: 'INR',
                    billingInterval: 'NONE',
                    features: [
                        'AI Innovation Analysis',
                        'Patent Drawing Generation',
                        'Filing Package Export',
                        '14 Days Access',
                    ],
                    isActive: true,
                },
            });
        }
        // Execute in transaction to maintain strict consistency
        return await db_1.prisma.$transaction(async (tx) => {
            // 1. Create Trial record
            const trial = await tx.trial.create({
                data: {
                    organizationId,
                    startedAt,
                    expiresAt,
                    status: 'ACTIVE',
                },
            });
            // 2. Mark existing non-current subscriptions as non-current
            await tx.subscription.updateMany({
                where: { organizationId, isCurrent: true },
                data: { isCurrent: false },
            });
            // 3. Create Subscription record
            const subscription = await tx.subscription.create({
                data: {
                    organizationId,
                    planId: trialPlan.id,
                    status: 'TRIALING',
                    isCurrent: true,
                    trialStart: startedAt,
                    trialEnd: expiresAt,
                    currentPeriodStart: startedAt,
                    currentPeriodEnd: expiresAt,
                },
            });
            // 4. Grant Entitlements
            await entitlementService_1.EntitlementService.grantPlanEntitlements(organizationId, subscription.id, 'FREE_TRIAL', expiresAt, tx);
            return {
                trial,
                subscription,
            };
        });
    }
    /**
     * Get trial status with lazy expiration reconciliation
     */
    static async getTrialStatus(organizationId) {
        if (!organizationId) {
            return {
                hasTrial: false,
                active: false,
                daysRemaining: 0,
                status: 'NONE',
            };
        }
        const trial = await db_1.prisma.trial.findUnique({
            where: { organizationId },
        });
        if (!trial) {
            return {
                hasTrial: false,
                active: false,
                daysRemaining: 0,
                status: 'NONE',
            };
        }
        const now = new Date();
        // Check if trial has expired and reconcile lazily
        if (trial.status === 'ACTIVE' && now > trial.expiresAt) {
            await db_1.prisma.$transaction(async (tx) => {
                await tx.trial.update({
                    where: { id: trial.id },
                    data: {
                        status: 'EXPIRED',
                        consumedAt: now,
                    },
                });
                await tx.subscription.updateMany({
                    where: {
                        organizationId,
                        status: 'TRIALING',
                    },
                    data: {
                        status: 'EXPIRED',
                    },
                });
                await entitlementService_1.EntitlementService.revokeEntitlements(organizationId, tx);
            });
            return {
                hasTrial: true,
                active: false,
                daysRemaining: 0,
                status: 'EXPIRED',
                startedAt: trial.startedAt,
                expiresAt: trial.expiresAt,
            };
        }
        if (trial.status === 'CONVERTED') {
            return {
                hasTrial: true,
                active: false,
                daysRemaining: 0,
                status: 'CONVERTED',
                startedAt: trial.startedAt,
                expiresAt: trial.expiresAt,
            };
        }
        if (trial.status === 'EXPIRED') {
            return {
                hasTrial: true,
                active: false,
                daysRemaining: 0,
                status: 'EXPIRED',
                startedAt: trial.startedAt,
                expiresAt: trial.expiresAt,
            };
        }
        // Trial is ACTIVE
        const msRemaining = Math.max(0, trial.expiresAt.getTime() - now.getTime());
        const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
        return {
            hasTrial: true,
            active: true,
            daysRemaining,
            status: 'ACTIVE',
            startedAt: trial.startedAt,
            expiresAt: trial.expiresAt,
        };
    }
    /**
     * Has this organization already consumed its trial?
     */
    static async hasConsumedTrial(organizationId) {
        const trial = await db_1.prisma.trial.findUnique({
            where: { organizationId },
        });
        return !!trial;
    }
    /**
     * Get remaining trial duration
     */
    static async getRemainingTrialTime(organizationId) {
        const status = await this.getTrialStatus(organizationId);
        if (!status.active || !status.expiresAt) {
            return { msRemaining: 0, daysRemaining: 0, isExpired: true };
        }
        const msRemaining = Math.max(0, new Date(status.expiresAt).getTime() - Date.now());
        return {
            msRemaining,
            daysRemaining: status.daysRemaining,
            isExpired: msRemaining === 0,
        };
    }
}
exports.TrialService = TrialService;
