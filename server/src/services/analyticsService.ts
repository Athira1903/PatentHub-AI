import { prisma } from '../config/db';
import { FilingReadinessService } from './filingReadinessService';

export interface ProjectAnalyticsSummary {
  projectId: string;
  projectTitle: string;
  category: string;
  stage: string;
  ownerName: string;
  scores: {
    patentEligibilityScore: number;
    priorArtRiskIndex: number;
    technicalDrawingScore: number;
    legalComplianceHealth: number;
    teamExecutionVelocity: number;
    filingReadinessScore: number;
  };
  metrics: {
    totalMembers: number;
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    overdueTasks: number;
    taskCompletionPercentage: number;
    totalReferences: number;
    usptoReferencesCount: number;
    mockReferencesCount: number;
    totalReviews: number;
    approvedReviewsCount: number;
    rejectedReviewsCount: number;
    totalForms: number;
    approvedFormsCount: number;
    submittedFormsCount: number;
    totalPrototypes: number;
    totalFigures: number;
    annotatedComponentsCount: number;
    totalActivityCount: number;
  };
  readinessChecklist: any[];
  blockingIssues: string[];
  explanations: Record<string, string>;
}

export interface DashboardAnalyticsSummary {
  totalProjects: number;
  inProgressProjects: number;
  filingReadyProjects: number;
  needsAttentionProjects: number;
  averageFilingReadiness: number;
  averageTaskCompletion: number;
  totalReferences: number;
  totalPrototypes: number;
  totalReviews: number;
  pendingReviewsCount: number;
  overdueTasksCount: number;
  stageDistribution: Record<string, number>;
  projectHealthSummaries: Array<{
    id: string;
    title: string;
    category: string;
    stage: string;
    readinessScore: number;
    taskVelocity: number;
  }>;
}

export class AnalyticsService {
  /**
   * Aggregates project data and computes comprehensive project intelligence metrics.
   */
  static async getProjectAnalytics(projectId: string, userId: string): Promise<ProjectAnalyticsSummary> {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { fullName: true, email: true, institution: true } },
        members: { include: { user: { select: { fullName: true, username: true } } } },
        tasks: { include: { assignedTo: { select: { username: true } } } },
        patentReferences: true,
        patentForms: true,
        projectReviews: true,
        prototypes: { include: { figures: { include: { components: true } } } },
        drawingFigures: { include: { components: true } },
        activityLogs: true,
        documents: true
      }
    });

    if (!project) {
      throw new Error('Project not found for analytics aggregation.');
    }

    // Get compliance readiness checklist from FilingReadinessService
    const readiness = await FilingReadinessService.getFilingReadiness(projectId);

    // Compute task metrics
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;
    const activeTasks = project.tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
    const now = new Date();
    const overdueTasks = project.tasks.filter(
      (t) => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < now
    ).length;
    const taskCompletionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Compute patent reference metrics
    const totalReferences = project.patentReferences.length;
    const usptoReferencesCount = project.patentReferences.filter((r) => r.source === 'USPTO').length;
    const mockReferencesCount = project.patentReferences.filter((r) => r.source === 'MOCK').length;

    // Compute reviews metrics
    const totalReviews = project.projectReviews.length;
    const approvedReviewsCount = project.projectReviews.filter((r) => r.decision === 'APPROVED').length;
    const rejectedReviewsCount = project.projectReviews.filter((r) => r.decision === 'REJECTED').length;

    // Compute forms metrics
    const totalForms = project.patentForms.length;
    const approvedFormsCount = project.patentForms.filter((f) => f.status === 'APPROVED').length;
    const submittedFormsCount = project.patentForms.filter((f) => f.status === 'SUBMITTED' || f.status === 'APPROVED').length;

    // Compute drawings & prototypes metrics
    const totalPrototypes = project.prototypes.length;
    const totalFigures = project.drawingFigures.length;
    let annotatedComponentsCount = 0;
    project.drawingFigures.forEach((fig) => {
      annotatedComponentsCount += fig.components.length;
    });

    // Calculate Core 6 Intelligence Scores:
    // 1. Filing Readiness Score (%)
    const filingReadinessScore = Math.round((readiness.completedCount / readiness.totalRequiredCount) * 100);

    // 2. Team Execution Velocity (%)
    const teamExecutionVelocity = taskCompletionPercentage;

    // 3. Form & Legal Compliance Health (%)
    const mandatoryForms = ['Form 1', 'Form 2', 'Form 3', 'Form 5', 'Form 26'];
    const validFormsCount = mandatoryForms.filter((ft) =>
      project.patentForms.some((f) => f.formType === ft && (f.status === 'SUBMITTED' || f.status === 'APPROVED'))
    ).length;
    const legalComplianceHealth = Math.round((validFormsCount / mandatoryForms.length) * 100);

    // 4. Technical Drawing Score (%)
    let technicalDrawingScore = 0;
    if (totalFigures > 0) {
      const annotatedFiguresCount = project.drawingFigures.filter((f) => f.components.length > 0).length;
      technicalDrawingScore = Math.min(100, Math.round((annotatedFiguresCount / totalFigures) * 70 + (annotatedComponentsCount > 0 ? 30 : 0)));
    } else if (totalPrototypes > 0) {
      technicalDrawingScore = 50;
    }

    // 5. Prior Art Risk Index (%) (Lower score = lower overlap risk = safer patentability)
    let priorArtRiskIndex = 15; // Base low risk
    if (totalReferences > 0) {
      priorArtRiskIndex = Math.min(85, 20 + totalReferences * 12);
    }

    // 6. Patent Eligibility & Novelty Score (%)
    let patentEligibilityScore = 50; // Base score
    const hasDraftDoc = project.documents.some((d) => d.category === 'PATENT_DRAFT' || d.category === 'RESEARCH_PAPER');
    if (hasDraftDoc) patentEligibilityScore += 15;
    if (totalReferences >= 2) patentEligibilityScore += 15;
    if (approvedFormsCount >= 2) patentEligibilityScore += 10;
    if (approvedReviewsCount >= 1) patentEligibilityScore += 10;
    patentEligibilityScore = Math.min(100, patentEligibilityScore);

    return {
      projectId: project.id,
      projectTitle: project.title,
      category: project.category,
      stage: project.stage,
      ownerName: project.owner.fullName,
      scores: {
        patentEligibilityScore,
        priorArtRiskIndex,
        technicalDrawingScore,
        legalComplianceHealth,
        teamExecutionVelocity,
        filingReadinessScore
      },
      metrics: {
        totalMembers: project.members.length + 1,
        totalTasks,
        completedTasks,
        activeTasks,
        overdueTasks,
        taskCompletionPercentage,
        totalReferences,
        usptoReferencesCount,
        mockReferencesCount,
        totalReviews,
        approvedReviewsCount,
        rejectedReviewsCount,
        totalForms,
        approvedFormsCount,
        submittedFormsCount,
        totalPrototypes,
        totalFigures,
        annotatedComponentsCount,
        totalActivityCount: project.activityLogs.length
      },
      readinessChecklist: readiness.checklist,
      blockingIssues: readiness.blockingIssues,
      explanations: {
        patentEligibilityScore: 'Calculated from documented specifications, prior art references cataloged, and supervisor endorsement status.',
        priorArtRiskIndex: 'Derived from number of verified registry references (USPTO/Mock) linked to this invention workspace.',
        technicalDrawingScore: 'Evaluated based on 2D figure sheets uploaded, Gemini Vision component tags annotated, and schematic legend completeness.',
        legalComplianceHealth: 'Percentage of mandatory Indian Patent Office forms (Forms 1, 2, 3, 5, 26) prepared and submitted.',
        teamExecutionVelocity: 'Percentage of assigned project workspace tasks marked as COMPLETED.',
        filingReadinessScore: 'Composite 6-point compliance checklist score required for final IPO filing package export.'
      }
    };
  }

  /**
   * Aggregates portfolio analytics across all projects accessible to the user.
   */
  static async getDashboardAnalytics(userId: string): Promise<DashboardAnalyticsSummary> {
    const projects = await prisma.patentProject.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        patentReferences: { select: { id: true } },
        prototypes: { select: { id: true } },
        projectReviews: { select: { id: true, decision: true } },
        tasks: { select: { id: true, status: true, dueDate: true } },
        patentForms: { select: { id: true, status: true } },
        documents: { select: { id: true, category: true } }
      }
    });

    const totalProjects = projects.length;
    const stageDistribution: Record<string, number> = {};
    let filingReadyProjects = 0;
    let inProgressProjects = 0;
    let needsAttentionProjects = 0;

    let totalRefSum = 0;
    let totalProtoSum = 0;
    let totalReviewSum = 0;
    let pendingReviewsCount = 0;
    let overdueTasksCount = 0;

    let totalReadinessSum = 0;
    let totalTaskVelSum = 0;

    const now = new Date();
    const healthSummaries: Array<{
      id: string;
      title: string;
      category: string;
      stage: string;
      readinessScore: number;
      taskVelocity: number;
    }> = [];

    for (const proj of projects) {
      stageDistribution[proj.stage] = (stageDistribution[proj.stage] || 0) + 1;

      if (proj.stage === 'FILING_READY' || proj.stage === 'FILED') {
        filingReadyProjects++;
      } else {
        inProgressProjects++;
      }

      // Check task metrics
      const totalT = proj.tasks.length;
      const compT = proj.tasks.filter((t) => t.status === 'COMPLETED').length;
      const overT = proj.tasks.filter((t) => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < now).length;
      overdueTasksCount += overT;

      const taskVelocity = totalT > 0 ? Math.round((compT / totalT) * 100) : 0;
      totalTaskVelSum += taskVelocity;

      // Estimate basic readiness
      const hasForms = proj.patentForms.filter((f) => f.status === 'APPROVED').length >= 3;
      const hasReview = proj.projectReviews.some((r) => r.decision === 'APPROVED');
      let readinessScore = Math.round((compT / Math.max(1, totalT)) * 40);
      if (hasForms) readinessScore += 30;
      if (hasReview) readinessScore += 30;
      readinessScore = Math.min(100, readinessScore);

      if (proj.stage === 'FILING_READY') readinessScore = 100;
      totalReadinessSum += readinessScore;

      if (readinessScore < 50 || overT > 0) {
        needsAttentionProjects++;
      }

      totalRefSum += proj.patentReferences.length;
      totalProtoSum += proj.prototypes.length;
      totalReviewSum += proj.projectReviews.length;

      healthSummaries.push({
        id: proj.id,
        title: proj.title,
        category: proj.category,
        stage: proj.stage,
        readinessScore,
        taskVelocity
      });
    }

    return {
      totalProjects,
      inProgressProjects,
      filingReadyProjects,
      needsAttentionProjects,
      averageFilingReadiness: totalProjects > 0 ? Math.round(totalReadinessSum / totalProjects) : 0,
      averageTaskCompletion: totalProjects > 0 ? Math.round(totalTaskVelSum / totalProjects) : 0,
      totalReferences: totalRefSum,
      totalPrototypes: totalProtoSum,
      totalReviews: totalReviewSum,
      pendingReviewsCount,
      overdueTasksCount,
      stageDistribution,
      projectHealthSummaries: healthSummaries
    };
  }
}
