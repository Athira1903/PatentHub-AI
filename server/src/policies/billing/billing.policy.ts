import { prisma } from '../../config/db';

export class BillingPolicy {
  /**
   * Check if user is a platform admin (global access)
   */
  static isPlatformAdmin(user: { role?: string } | undefined): boolean {
    if (!user || !user.role) return false;
    return user.role === 'Admin' || user.role === 'Administrator';
  }

  /**
   * Check if user is an organization admin
   */
  static isOrgAdmin(user: { role?: string } | undefined): boolean {
    if (!user || !user.role) return false;
    return (
      user.role === 'OrganizationAdmin' ||
      user.role === 'Organization Admin' ||
      user.role === 'OrgAdmin' ||
      this.isPlatformAdmin(user)
    );
  }

  /**
   * Check if a user can manage billing for the specified organization
   * 1. Platform Admin: Allowed
   * 2. OrganizationAdmin belonging to target organization: Allowed
   * 3. Organization with an existing OrganizationAdmin: Non-admin members (like students) Denied
   * 4. User is organization contact / owner / sole member when no OrgAdmin exists: Allowed
   */
  static async canManageBilling(
    user: { userId?: string; role?: string; organizationId?: string | null; email?: string } | undefined,
    targetOrgId: string
  ): Promise<boolean> {
    if (!user) return false;
    if (this.isPlatformAdmin(user)) return true;
    if (this.isOrgAdmin(user)) {
      return !!user.organizationId && user.organizationId === targetOrgId;
    }

    // Check if the organization already has an active OrganizationAdmin
    const hasOrgAdmin = await prisma.user.findFirst({
      where: {
        organizationId: targetOrgId,
        role: { name: { in: ['OrganizationAdmin', 'Organization Admin', 'OrgAdmin'] } },
      },
    });

    // If an OrganizationAdmin exists and it's someone else, regular subordinate members cannot manage billing
    if (hasOrgAdmin && hasOrgAdmin.id !== user.userId) {
      return false;
    }

    // If no dedicated OrganizationAdmin exists, allow the contact email or workspace owner
    if (user.userId) {
      const org = await prisma.organization.findUnique({
        where: { id: targetOrgId },
        select: { contactEmail: true },
      });
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { email: true, organizationId: true },
      });
      if (
        org &&
        dbUser &&
        (org.contactEmail?.toLowerCase() === dbUser.email.toLowerCase() ||
          dbUser.organizationId === targetOrgId)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a user can view billing status for the specified organization
   * Any active member of the organization can view the plan and entitlement status.
   */
  static canViewBilling(
    user: { role?: string; organizationId?: string | null } | undefined,
    targetOrgId: string
  ): boolean {
    if (!user) return false;
    if (this.isPlatformAdmin(user)) return true;
    return !!user.organizationId && user.organizationId === targetOrgId;
  }
}
