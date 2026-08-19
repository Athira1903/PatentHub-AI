"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackPolicy = void 0;
class FeedbackPolicy {
    /**
     * Determine if user can create guide feedback on the project.
     * Only assigned Faculty Guides (or Admins) can author feedback.
     */
    static canCreateFeedback(user, project) {
        if (!user || !project)
            return false;
        const userId = user.userId || user.id;
        const userRole = user.role?.name || user.role;
        if (userRole === 'Admin' || userRole === 'Administrator')
            return true;
        // Must be assigned as GUIDE on this project
        const member = project.members?.find((m) => (m.userId || m.user?.id) === userId);
        return member?.role === 'GUIDE';
    }
    /**
     * Determine if user can view project feedback history.
     * Project owner, collaborators, guides, and experts can view.
     */
    static canViewFeedback(user, project) {
        if (!user || !project)
            return false;
        const userId = user.userId || user.id;
        const userRole = user.role?.name || user.role;
        if (userRole === 'Admin' || userRole === 'Administrator')
            return true;
        if (project.ownerId === userId)
            return true;
        return project.members?.some((m) => (m.userId || m.user?.id) === userId) || false;
    }
    /**
     * Determine if user can reply to a feedback thread.
     * Any active project collaborator, authoring guide, owner, or Admin can reply.
     */
    static canReply(user, project, _feedback) {
        return this.canViewFeedback(user, project);
    }
    /**
     * Determine if user can resubmit work for review on a feedback item.
     * Project owner, inventor, or co-inventor can resubmit.
     */
    static canResubmit(user, project, feedback) {
        if (!user || !project || !feedback)
            return false;
        const userId = user.userId || user.id;
        const userRole = user.role?.name || user.role;
        if (userRole === 'Admin' || userRole === 'Administrator')
            return true;
        // Only applicable if feedback requires correction or is in progress
        if (feedback.status === 'RESOLVED' || feedback.status === 'CLOSED')
            return false;
        if (project.ownerId === userId)
            return true;
        const member = project.members?.find((m) => (m.userId || m.user?.id) === userId);
        return member?.role === 'INVENTOR' || member?.role === 'CO_INVENTOR';
    }
    /**
     * Determine if user can mark feedback as resolved.
     * Assigned Guide or Admin can resolve.
     */
    static canResolve(user, project, feedback) {
        if (!user || !project || !feedback)
            return false;
        const userId = user.userId || user.id;
        const userRole = user.role?.name || user.role;
        if (userRole === 'Admin' || userRole === 'Administrator')
            return true;
        if (feedback.guideId === userId)
            return true;
        const member = project.members?.find((m) => (m.userId || m.user?.id) === userId);
        return member?.role === 'GUIDE';
    }
    /**
     * Determine if user can edit/delete feedback record.
     * Feedback authoring Guide or Admin.
     */
    static canManageFeedback(user, feedback) {
        if (!user || !feedback)
            return false;
        const userId = user.userId || user.id;
        const userRole = user.role?.name || user.role;
        if (userRole === 'Admin' || userRole === 'Administrator')
            return true;
        return feedback.guideId === userId;
    }
}
exports.FeedbackPolicy = FeedbackPolicy;
