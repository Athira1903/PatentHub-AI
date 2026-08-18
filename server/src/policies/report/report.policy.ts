import { PatentFormPolicy } from '../forms/patent-form.policy';
import { ProjectStage } from '@prisma/client';

const STAGES_AFTER_PROTOTYPE: ProjectStage[] = [
  'DOCUMENTATION',
  'FORMS_PREPARATION',
  'GUIDE_REVIEW',
  'PATENT_EXPERT_REVIEW',
  'FILING_READY',
  'FILED',
];

const STAGES_AFTER_GUIDE_APPROVAL: ProjectStage[] = [
  'PATENT_EXPERT_REVIEW',
  'FILING_READY',
  'FILED',
];

const STAGES_AFTER_EXPERT_APPROVAL: ProjectStage[] = [
  'FILING_READY',
  'FILED',
];

export class ReportPolicy {
  /**
   * Determine if user can generate a summary report.
   * Any project member or Admin can do this.
   */
  static canGenerateSummary(user: any, project: any): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;

    const isOwner = project.ownerId === user.userId;
    const isMember = project.members?.some((m: any) => m.userId === user.userId);

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
  static canGenerateReadinessReport(user: any, project: any): boolean {
    // 1. User check
    const hasSummaryAccess = ReportPolicy.canGenerateSummary(user, project);
    if (!hasSummaryAccess) return false;

    // 2. Innovation completed check
    const stage = project.stage as ProjectStage;
    const isInnovationCompleted = STAGES_AFTER_PROTOTYPE.includes(stage);
    if (!isInnovationCompleted) return false;

    // 3. Documents uploaded check
    const hasDocuments = project.documents && project.documents.length > 0;
    if (!hasDocuments) return false;

    // 4. Mandatory forms complete check
    const formsComplete = PatentFormPolicy.areMandatoryFormsComplete(project);
    if (!formsComplete) return false;

    return true;
  }

  /**
   * Determine if user can generate a final patent report.
   * Requires:
   * - All readiness report conditions
   * - Guide approval completed (stage is PATENT_EXPERT_REVIEW or later)
   * - Expert approval completed (stage is FILING_READY or FILED)
   */
  static canGenerateFinalReport(user: any, project: any): boolean {
    // 1. Check readiness report conditions
    const isReadinessOk = ReportPolicy.canGenerateReadinessReport(user, project);
    if (!isReadinessOk) return false;

    // 2. Guide approval completed check
    const stage = project.stage as ProjectStage;
    const isGuideApproved = STAGES_AFTER_GUIDE_APPROVAL.includes(stage);
    if (!isGuideApproved) return false;

    // 3. Expert approval completed check
    const isExpertApproved = STAGES_AFTER_EXPERT_APPROVAL.includes(stage);
    if (!isExpertApproved) return false;

    return true;
  }
}
