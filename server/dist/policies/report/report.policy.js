"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportPolicy = void 0;
const patent_form_policy_1 = require("../forms/patent-form.policy");
const STAGES_AFTER_PROTOTYPE = [
    'DOCUMENTATION',
    'FORMS_PREPARATION',
    'GUIDE_REVIEW',
    'PATENT_EXPERT_REVIEW',
    'FILING_READY',
    'FILED',
];
const STAGES_AFTER_GUIDE_APPROVAL = [
    'PATENT_EXPERT_REVIEW',
    'FILING_READY',
    'FILED',
];
const STAGES_AFTER_EXPERT_APPROVAL = [
    'FILING_READY',
    'FILED',
];
class ReportPolicy {
    /**
     * Determine if user can generate a summary report.
     * Any project member or Admin can do this.
     */
    static canGenerateSummary(user, project) {
        if (!user)
            return false;
        if (user.role === 'Admin')
            return true;
        const isOwner = project.ownerId === user.userId;
        const isMember = project.members?.some((m) => m.userId === user.userId);
        return isOwner || isMember;
    }
    /**
     * Determine if user can generate a readiness report.
     * Requires:
     * - User is project member or Admin
     * - Innovation completed (stage is DOCUMENTATION or later)
     * - Documents uploaded (at least one document exists)
     * - Mandatory patent forms completed (Form 1, 2, 3, 5 exist)
     */
    static canGenerateReadinessReport(user, project) {
        // 1. User check
        const hasSummaryAccess = ReportPolicy.canGenerateSummary(user, project);
        if (!hasSummaryAccess)
            return false;
        // 2. Innovation completed check
        const stage = project.stage;
        const isInnovationCompleted = STAGES_AFTER_PROTOTYPE.includes(stage);
        if (!isInnovationCompleted)
            return false;
        // 3. Documents uploaded check
        const hasDocuments = project.documents && project.documents.length > 0;
        if (!hasDocuments)
            return false;
        // 4. Mandatory forms complete check
        const formsComplete = patent_form_policy_1.PatentFormPolicy.areMandatoryFormsComplete(project);
        if (!formsComplete)
            return false;
        return true;
    }
    /**
     * Determine if user can generate a final patent report.
     * Requires:
     * - All readiness report conditions
     * - Guide approval completed (stage is PATENT_EXPERT_REVIEW or later)
     * - Expert approval completed (stage is FILING_READY or FILED)
     */
    static canGenerateFinalReport(user, project) {
        // 1. Check readiness report conditions
        const isReadinessOk = ReportPolicy.canGenerateReadinessReport(user, project);
        if (!isReadinessOk)
            return false;
        // 2. Guide approval completed check
        const stage = project.stage;
        const isGuideApproved = STAGES_AFTER_GUIDE_APPROVAL.includes(stage);
        if (!isGuideApproved)
            return false;
        // 3. Expert approval completed check
        const isExpertApproved = STAGES_AFTER_EXPERT_APPROVAL.includes(stage);
        if (!isExpertApproved)
            return false;
        return true;
    }
}
exports.ReportPolicy = ReportPolicy;
