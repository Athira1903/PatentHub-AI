"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitlementService = exports.FEATURE_CODES = void 0;
const db_1 = require("../config/db");
exports.FEATURE_CODES = {
    AI_INNOVATION_ANALYSIS: 'AI_INNOVATION_ANALYSIS',
    PATENT_DRAWING_GENERATION: 'PATENT_DRAWING_GENERATION',
    EXPORT_FILING_PACKAGE: 'EXPORT_FILING_PACKAGE',
};
class EntitlementService {
    /**
     * Grant or update entitlements based on the organization's plan
     */
    static async grantPlanEntitlements(organizationId, subscriptionId, planCode, validUntil, dbClient) {
        const client = dbClient || db_1.prisma;
        const features = [
            exports.FEATURE_CODES.AI_INNOVATION_ANALYSIS,
            exports.FEATURE_CODES.PATENT_DRAWING_GENERATION,
            exports.FEATURE_CODES.EXPORT_FILING_PACKAGE,
        ];
        for (const featureCode of features) {
            await client.entitlement.upsert({
                where: {
                    organizationId_featureCode: {
                        organizationId,
                        featureCode,
                    },
                },
                update: {
                    subscriptionId,
                    enabled: true,
                    validFrom: new Date(),
                    validUntil: validUntil || null,
                },
                create: {
                    organizationId,
                    subscriptionId,
                    featureCode,
                    enabled: true,
                    validFrom: new Date(),
                    validUntil: validUntil || null,
                },
            });
        }
    }
    /**
     * Revoke entitlements for an organization (e.g. on trial expiration or cancellation)
     */
    static async revokeEntitlements(organizationId, dbClient) {
        const client = dbClient || db_1.prisma;
        await client.entitlement.updateMany({
            where: { organizationId },
            data: {
                enabled: false,
            },
        });
    }
    /**
     * Check if an organization is entitled to use a specific feature
     */
    static async hasFeature(organizationId, featureCode) {
        if (!organizationId) {
            return false;
        }
        const entitlement = await db_1.prisma.entitlement.findUnique({
            where: {
                organizationId_featureCode: {
                    organizationId,
                    featureCode,
                },
            },
        });
        if (!entitlement || !entitlement.enabled) {
            return false;
        }
        // Check time boundary if validUntil is set
        if (entitlement.validUntil && new Date() > entitlement.validUntil) {
            return false;
        }
        return true;
    }
    /**
     * Get all active entitlements for an organization
     */
    static async getOrganizationEntitlements(organizationId) {
        if (!organizationId)
            return [];
        const now = new Date();
        const entitlements = await db_1.prisma.entitlement.findMany({
            where: {
                organizationId,
                enabled: true,
                OR: [
                    { validUntil: null },
                    { validUntil: { gte: now } },
                ],
            },
            select: {
                featureCode: true,
            },
        });
        return entitlements.map((e) => e.featureCode);
    }
}
exports.EntitlementService = EntitlementService;
