"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimPolicy = void 0;
class ClaimPolicy {
    /**
     * Resolve project role for a user on a given project.
     */
    static getProjectRole(user, project) {
        if (!user)
            return null;
        if (user.role === 'Admin')
            return 'ADMIN';
        if (project.ownerId === user.userId)
            return 'OWNER';
        const member = project.members?.find((m) => m.userId === user.userId);
        if (!member)
            return null;
        if (member.role === 'INVENTOR' || member.role === 'CO_INVENTOR') {
            return 'MEMBER';
        }
        if (member.role === 'GUIDE' || member.role === 'PATENT_EXPERT') {
            return 'MEMBER';
        }
        return 'VIEWER';
    }
    /**
     * Determine if the user can view project claims.
     */
    static canViewClaims(user, project) {
        const role = this.getProjectRole(user, project);
        return role !== null;
    }
    /**
     * Determine if the user can create claims.
     * Only OWNER, ADMIN, INVENTOR, or CO_INVENTOR.
     */
    static canCreateClaim(user, project) {
        if (!user)
            return false;
        if (user.role === 'Admin')
            return true;
        if (project.ownerId === user.userId)
            return true;
        const member = project.members?.find((m) => m.userId === user.userId);
        return member?.role === 'INVENTOR' || member?.role === 'CO_INVENTOR';
    }
    /**
     * Determine if the user can edit/update claims.
     */
    static canEditClaim(user, project) {
        return this.canCreateClaim(user, project);
    }
    /**
     * Determine if the user can delete claims.
     */
    static canDeleteClaim(user, project) {
        return this.canCreateClaim(user, project);
    }
    /**
     * Determine if the user can reorder claims.
     */
    static canReorderClaims(user, project) {
        return this.canCreateClaim(user, project);
    }
    /**
     * Determine if the user can view claim elements.
     */
    static canViewClaimElements(user, project) {
        return this.canViewClaims(user, project);
    }
    /**
     * Determine if the user can create claim elements.
     */
    static canCreateClaimElement(user, project) {
        return this.canCreateClaim(user, project);
    }
    /**
     * Determine if the user can edit/update claim elements.
     */
    static canEditClaimElement(user, project) {
        return this.canCreateClaim(user, project);
    }
    /**
     * Determine if the user can delete claim elements.
     */
    static canDeleteClaimElement(user, project) {
        return this.canCreateClaim(user, project);
    }
    /**
     * Determine if the user can link/unlink drawing components to claim elements.
     */
    static canLinkDrawingComponent(user, project) {
        return this.canCreateClaim(user, project);
    }
    /**
     * Determine if the user can trigger AI claim proposal generation.
     */
    static canGenerateClaimProposal(user, project) {
        return this.canViewClaims(user, project);
    }
    /**
     * Determine if the user can run claim validation diagnostics.
     */
    static canValidateClaim(user, project) {
        return this.canViewClaims(user, project);
    }
    /**
     * Determine if the user can import an AI claim proposal into the project.
     */
    static canImportClaimProposal(user, project) {
        return this.canCreateClaim(user, project);
    }
    /**
     * Determine if the user can generate and view preliminary FTO claim charts.
     */
    static canRunFtoAnalysis(user, project) {
        return this.canViewClaims(user, project);
    }
    /**
     * Determine if the user can sync claims to Form 2.
     */
    static canSyncClaims(user, project) {
        return this.canCreateClaim(user, project);
    }
    /**
     * Determine if the user can export claims docket PDF.
     */
    static canExportClaimsDocket(user, project) {
        return this.canViewClaims(user, project);
    }
}
exports.ClaimPolicy = ClaimPolicy;
