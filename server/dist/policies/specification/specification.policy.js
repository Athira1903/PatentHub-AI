"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecificationPolicy = void 0;
class SpecificationPolicy {
    /**
     * Determine if the user can view the specification for a project.
     * Allowed: Owner, Admin, Members (including Co-Inventors with VIEW/EDIT/SUBMIT), Guides, and Patent Experts.
     */
    static canView(user, project) {
        if (!user)
            return false;
        if (user.role === 'Admin')
            return true;
        if (user.role === 'OrganizationAdmin' && project.organizationId && user.organizationId === project.organizationId) {
            return true;
        }
        const isOwner = project.ownerId === user.userId || project.ownerId === user.id;
        if (isOwner)
            return true;
        const isMember = project.members?.some((m) => m.userId === user.userId || m.userId === user.id || m.user?.id === user.userId || m.user?.id === user.id);
        if (isMember)
            return true;
        return false;
    }
    /**
     * Determine if the user can edit the specification (drafting, autosave, manual save).
     * Allowed: Owner, Admin, Co-Inventors with EDIT or SUBMIT permissions.
     * Not allowed: Co-Inventors with VIEW only, Guides, Patent Experts, non-members.
     */
    static canEdit(user, project) {
        if (!user)
            return false;
        if (user.role === 'Admin')
            return true;
        const isOwner = project.ownerId === user.userId || project.ownerId === user.id;
        if (isOwner)
            return true;
        const member = project.members?.find((m) => m.userId === user.userId || m.userId === user.id || m.user?.id === user.userId || m.user?.id === user.id);
        if (member) {
            if (member.role === 'INVENTOR' || member.role === 'CO_INVENTOR') {
                if (member.permissionLevel === 'VIEW')
                    return false;
                return member.permissionLevel === 'EDIT' || member.permissionLevel === 'SUBMIT' || !member.permissionLevel;
            }
        }
        return false;
    }
    /**
     * Determine if the user can create an explicit version snapshot.
     */
    static canCreateVersion(user, project) {
        return SpecificationPolicy.canEdit(user, project);
    }
    /**
     * Determine if the user can safely restore a historical version snapshot.
     */
    static canRestoreVersion(user, project) {
        return SpecificationPolicy.canEdit(user, project);
    }
    /**
     * Determine if the user can synchronize the specification with Form 2.
     */
    static canSyncForm2(user, project) {
        return SpecificationPolicy.canEdit(user, project);
    }
}
exports.SpecificationPolicy = SpecificationPolicy;
