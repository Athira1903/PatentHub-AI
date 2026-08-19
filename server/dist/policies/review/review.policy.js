"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewPolicy = void 0;
const patent_form_policy_1 = require("../forms/patent-form.policy");
class ReviewPolicy {
    /**
     * Determine if the user can review the project.
     * Guides and experts assigned to the project can review.
     */
    static canReview(user, project) {
        if (!user)
            return false;
        if (user.role === 'Admin')
            return true;
        const isGuide = user.role === 'Guide' || user.role === 'GUIDE';
        const isExpert = user.role === 'PatentExpert' || user.role === 'Patent Expert' || user.role === 'PATENT_EXPERT';
        const projectMember = project.members?.find((m) => m.userId === user.userId);
        const role = projectMember?.role;
        if (role === 'GUIDE' || role === 'PATENT_EXPERT')
            return true;
        if (isGuide || isExpert)
            return true;
        return false;
    }
    /**
     * Determine if the user can approve a project review stage.
     * - Inventors cannot approve their own projects.
     * - Guide approval requires mandatory forms (Form 1, 2, 3, 5) to be complete.
     */
    static canApprove(user, project) {
        if (!user)
            return false;
        if (user.role === 'Admin')
            return true;
        // Inventors/owners cannot approve their own projects
        if (project.ownerId === user.userId)
            return false;
        const isGuide = user.role === 'Guide' || user.role === 'GUIDE';
        const isExpert = user.role === 'PatentExpert' || user.role === 'Patent Expert' || user.role === 'PATENT_EXPERT';
        const projectMember = project.members?.find((m) => m.userId === user.userId);
        const role = projectMember?.role;
        if (role === 'INVENTOR' || role === 'CO_INVENTOR')
            return false;
        if (project.stage === 'GUIDE_REVIEW') {
            if (role !== 'GUIDE' && !isGuide)
                return false;
            return patent_form_policy_1.PatentFormPolicy.areMandatoryFormsComplete(project);
        }
        if (project.stage === 'PATENT_EXPERT_REVIEW') {
            if (role !== 'PATENT_EXPERT' && !isExpert)
                return false;
            return patent_form_policy_1.PatentFormPolicy.areMandatoryFormsComplete(project);
        }
        return false;
    }
    /**
     * Determine if the user can reject / request changes.
     * Only authorized reviewers (who are not the inventors) can reject or request changes.
     */
    static canReject(user, project) {
        if (!user)
            return false;
        if (user.role === 'Admin')
            return true;
        if (project.ownerId === user.userId)
            return false;
        const isGuide = user.role === 'Guide' || user.role === 'GUIDE';
        const isExpert = user.role === 'PatentExpert' || user.role === 'Patent Expert' || user.role === 'PATENT_EXPERT';
        const projectMember = project.members?.find((m) => m.userId === user.userId);
        const role = projectMember?.role;
        if (role === 'INVENTOR' || role === 'CO_INVENTOR')
            return false;
        if (project.stage === 'GUIDE_REVIEW') {
            return role === 'GUIDE' || isGuide;
        }
        if (project.stage === 'PATENT_EXPERT_REVIEW') {
            return role === 'PATENT_EXPERT' || isExpert;
        }
        return false;
    }
    /**
     * Determine if the user can request changes.
     */
    static canRequestChanges(user, project) {
        return ReviewPolicy.canReject(user, project);
    }
    /**
     * Determine if the user can comment.
     * Any project member or Admin can add comments.
     */
    static canComment(user, project) {
        if (!user)
            return false;
        if (user.role === 'Admin')
            return true;
        const isOwner = project.ownerId === user.userId;
        const isMember = project.members?.some((m) => m.userId === user.userId);
        const isGuide = user.role === 'Guide' || user.role === 'GUIDE';
        const isExpert = user.role === 'PatentExpert' || user.role === 'Patent Expert' || user.role === 'PATENT_EXPERT';
        return isOwner || isMember || isGuide || isExpert;
    }
}
exports.ReviewPolicy = ReviewPolicy;
