import { prisma } from '../config/db';

export const FEATURE_CODES = {
  AI_INNOVATION_ANALYSIS: 'AI_INNOVATION_ANALYSIS',
  PATENT_DRAWING_GENERATION: 'PATENT_DRAWING_GENERATION',
  EXPORT_FILING_PACKAGE: 'EXPORT_FILING_PACKAGE',
} as const;

export type FeatureCode = keyof typeof FEATURE_CODES;

export class EntitlementService {
  /**
   * Grant or update entitlements based on the organization's plan
   */
  public static async grantPlanEntitlements(
    organizationId: string,
    subscriptionId: string | null,
    planCode: string,
    validUntil?: Date | null,
    dbClient?: any
  ): Promise<void> {
    const client = dbClient || prisma;
    const features: string[] = [
      FEATURE_CODES.AI_INNOVATION_ANALYSIS,
      FEATURE_CODES.PATENT_DRAWING_GENERATION,
      FEATURE_CODES.EXPORT_FILING_PACKAGE,
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
  public static async revokeEntitlements(organizationId: string, dbClient?: any): Promise<void> {
    const client = dbClient || prisma;
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
  public static async hasFeature(organizationId: string, featureCode: string): Promise<boolean> {
    if (!organizationId) {
      return false;
    }

    const entitlement = await prisma.entitlement.findUnique({
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
  public static async getOrganizationEntitlements(organizationId: string): Promise<string[]> {
    if (!organizationId) return [];

    const now = new Date();
    const entitlements = await prisma.entitlement.findMany({
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
