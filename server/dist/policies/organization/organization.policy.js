"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationPolicy = void 0;
class OrganizationPolicy {
    /**
     * Check if a user has platform admin privileges.
     */
    static isPlatformAdmin(user) {
        if (!user || !user.role)
            return false;
        return user.role === 'Admin' || user.role === 'Administrator';
    }
    /**
     * Check if a user has organization admin privileges.
     */
    static isOrgAdmin(user) {
        if (!user || !user.role)
            return false;
        return (user.role === 'OrganizationAdmin' ||
            user.role === 'OrgAdmin' ||
            user.role === 'Admin' ||
            user.role === 'Administrator');
    }
    /**
     * Check if a user belongs to or is authorized to access the given organization.
     */
    static canAccessOrganization(user, targetOrgId) {
        if (!user)
            return false;
        if (this.isPlatformAdmin(user))
            return true;
        return !!user.organizationId && user.organizationId === targetOrgId;
    }
    /**
     * Check if a user can manage policies for the given organization.
     */
    static canManagePolicies(user, targetOrgId) {
        if (!user)
            return false;
        if (this.isPlatformAdmin(user))
            return true;
        if (!this.isOrgAdmin(user))
            return false;
        return !!user.organizationId && user.organizationId === targetOrgId;
    }
}
exports.OrganizationPolicy = OrganizationPolicy;
