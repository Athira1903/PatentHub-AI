"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowPolicy = void 0;
const WORKFLOW_STAGES = [
    'IDEA',
    'LITERATURE_REVIEW',
    'PROTOTYPE',
    'DOCUMENTATION',
    'FORMS_PREPARATION',
    'GUIDE_REVIEW',
    'PATENT_EXPERT_REVIEW',
    'FILING_READY',
    'FILED',
];
class WorkflowPolicy {
    /**
     * Verify if the transition from currentStage to nextStage is valid (no stage skipping).
     */
    static isStageTransitionValid(currentStage, nextStage) {
        const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
        const nextIndex = WORKFLOW_STAGES.indexOf(nextStage);
        if (currentIndex === -1 || nextIndex === -1)
            return false;
        // Normal sequential progression forward
        if (nextIndex === currentIndex + 1) {
            return true;
        }
        // Allow rejection / sent back to DOCUMENTATION from GUIDE_REVIEW or PATENT_EXPERT_REVIEW
        if (nextStage === 'DOCUMENTATION' &&
            (currentStage === 'GUIDE_REVIEW' || currentStage === 'PATENT_EXPERT_REVIEW')) {
            return true;
        }
        return false;
    }
    /**
     * Check if a user is permitted to transition a project to a given stage.
     */
    static async canMoveToStage(user, project, nextStage) {
        if (!user)
            return false;
        if (user.role === 'Admin')
            return true;
        const currentStage = project.stage;
        // Check transition path
        if (!WorkflowPolicy.isStageTransitionValid(currentStage, nextStage)) {
            return false;
        }
        const isOwner = project.ownerId === user.userId;
        const projectMember = project.members?.find((m) => m.userId === user.userId);
        const projectRole = projectMember?.role;
        const isInventor = projectRole === 'INVENTOR' || projectRole === 'CO_INVENTOR';
        const canEdit = isOwner || (isInventor && (projectMember?.permissionLevel === 'EDIT' || projectMember?.permissionLevel === 'SUBMIT' || !projectMember?.permissionLevel));
        const canSubmit = isOwner || (isInventor && projectMember?.permissionLevel === 'SUBMIT');
        switch (nextStage) {
            case 'LITERATURE_REVIEW':
            case 'PROTOTYPE':
            case 'DOCUMENTATION':
            case 'FORMS_PREPARATION':
                // Project Owner or Co-inventor with EDIT/SUBMIT can progress early stages
                return isOwner || canEdit;
            case 'GUIDE_REVIEW':
                // Submitting for guide review requires Owner or Co-inventor with SUBMIT permission
                return isOwner || canSubmit;
            case 'PATENT_EXPERT_REVIEW':
                // Guide approves guide review. Owner/Inventors cannot approve.
                if (isOwner || projectRole === 'INVENTOR' || projectRole === 'CO_INVENTOR') {
                    return false;
                }
                return projectRole === 'GUIDE';
            case 'FILING_READY':
                // Patent Expert approves expert review. Owner/Inventors cannot approve.
                if (isOwner || projectRole === 'INVENTOR' || projectRole === 'CO_INVENTOR') {
                    return false;
                }
                return projectRole === 'PATENT_EXPERT';
            case 'FILED':
                // Patent Expert files. Owner/Inventors cannot approve.
                if (isOwner || projectRole === 'INVENTOR' || projectRole === 'CO_INVENTOR') {
                    return false;
                }
                return projectRole === 'PATENT_EXPERT';
            default:
                return false;
        }
    }
    static canSubmitForGuideReview(user, project) {
        return WorkflowPolicy.canMoveToStage(user, project, 'GUIDE_REVIEW');
    }
    static canApproveGuideReview(user, project) {
        return WorkflowPolicy.canMoveToStage(user, project, 'PATENT_EXPERT_REVIEW');
    }
    static canSubmitForExpertReview(user, project) {
        return WorkflowPolicy.canApproveGuideReview(user, project);
    }
    static canApproveExpertReview(user, project) {
        return WorkflowPolicy.canMoveToStage(user, project, 'FILING_READY');
    }
    static canMarkFilingReady(user, project) {
        return WorkflowPolicy.canApproveExpertReview(user, project);
    }
}
exports.WorkflowPolicy = WorkflowPolicy;
