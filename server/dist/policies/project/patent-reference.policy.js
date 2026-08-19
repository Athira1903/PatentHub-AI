"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatentReferencePolicy = void 0;
const client_1 = require("@prisma/client");
class PatentReferencePolicy {
    /**
     * Resolves the user's project-scoped role type.
     */
    static getProjectRoleType(user, project) {
        if (!user)
            return null;
        if (user.role === 'Admin')
            return 'ADMIN';
        if (project.ownerId === user.userId)
            return 'OWNER';
        const member = project.members?.find((m) => m.userId === user.userId);
        if (!member) {
            const isGuide = user.role === 'Guide' || user.role === 'GUIDE';
            const isExpert = user.role === 'PatentExpert' || user.role === 'Patent Expert' || user.role === 'PATENT_EXPERT';
            if (isGuide || isExpert)
                return 'VIEWER';
            return null;
        }
        if (member.role === client_1.ProjectRole.INVENTOR || member.role === client_1.ProjectRole.CO_INVENTOR) {
            return 'EDITOR';
        }
        if (member.role === client_1.ProjectRole.GUIDE || member.role === client_1.ProjectRole.PATENT_EXPERT) {
            return 'VIEWER';
        }
        return 'VIEWER';
    }
    /**
     * Can search patents. Any project member (OWNER, ADMIN, EDITOR, VIEWER).
     */
    static canSearch(user, project) {
        return PatentReferencePolicy.getProjectRoleType(user, project) !== null;
    }
    /**
     * Can view saved references. Any project member.
     */
    static canViewReferences(user, project) {
        return PatentReferencePolicy.getProjectRoleType(user, project) !== null;
    }
    /**
     * Can save a reference. Only OWNER, ADMIN, or EDITOR (INVENTOR/CO_INVENTOR).
     */
    static canSaveReference(user, project) {
        const role = PatentReferencePolicy.getProjectRoleType(user, project);
        return role === 'OWNER' || role === 'ADMIN' || role === 'EDITOR';
    }
    /**
     * Can delete a reference. Only OWNER, ADMIN, or EDITOR.
     */
    static canDeleteReference(user, project) {
        const role = PatentReferencePolicy.getProjectRoleType(user, project);
        return role === 'OWNER' || role === 'ADMIN' || role === 'EDITOR';
    }
    /**
     * Can run AI similarity/novelty check on saved references. Any project member.
     */
    static canRunAiAnalysis(user, project) {
        return PatentReferencePolicy.getProjectRoleType(user, project) !== null;
    }
}
exports.PatentReferencePolicy = PatentReferencePolicy;
