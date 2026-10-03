import { AuthenticatedRequest } from '../../middleware/authMiddleware';

export class OrganizationPolicy {
  /**
   * Check if a user has platform admin privileges.
   */
  static isPlatformAdmin(user: { role?: string } | undefined): boolean {
    if (!user || !user.role) return false;
    return user.role === 'Admin' || user.role === 'Administrator';
  }

  /**
   * Check if a user has organization admin privileges.
   */
  static isOrgAdmin(user: { role?: string } | undefined): boolean {
    if (!user || !user.role) return false;
    return (
      user.role === 'OrganizationAdmin' ||
      user.role === 'OrgAdmin' ||
      user.role === 'Admin' ||
      user.role === 'Administrator'
    );
  }

  /**
   * Check if a user belongs to or is authorized to access the given organization.
   */
  static canAccessOrganization(
    user: { role?: string; organizationId?: string | null } | undefined,
    targetOrgId: string
  ): boolean {
    if (!user) return false;
    if (this.isPlatformAdmin(user)) return true;
    return !!user.organizationId && user.organizationId === targetOrgId;
  }

  /**
   * Check if a user can manage policies for the given organization.
   */
  static canManagePolicies(
    user: { role?: string; organizationId?: string | null } | undefined,
    targetOrgId: string
  ): boolean {
    if (!user) return false;
    if (this.isPlatformAdmin(user)) return true;
    if (!this.isOrgAdmin(user)) return false;
    return !!user.organizationId && user.organizationId === targetOrgId;
  }
}
