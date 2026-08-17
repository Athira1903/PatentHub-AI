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
  totalForms: number;
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

    // 5. Prior Art Risk Index (%) (0 = Very Low Risk, 100 = Very High Risk)
    // Scoring logic:
    // - Unexamined prior art presents high risk (85%) when 0 references are cataloged.
    // - Each verified USPTO reference reduces risk by 15% (strong registry search evidence).
    // - Each cataloged/mock reference reduces risk by 10%.
    // - Review sign-offs (approved reviews) and advanced stage maturity (FILING_READY/FILED) further mitigate prior-art risk.
    // - Adding verified references strictly reduces or maintains risk (never increases risk).
    // - The final score is strictly clamped between 0% and 100%.
    let priorArtRiskIndex = 85; // Base high unexamined risk when 0 references exist
    if (totalReferences > 0) {
      const referenceReduction = (usptoReferencesCount * 15) + (mockReferencesCount * 10);
      const reviewReduction = approvedReviewsCount >= 1 ? 10 : 0;
      const stageReduction = (project.stage === 'FILING_READY' || project.stage === 'FILED') ? 10 : 0;
      priorArtRiskIndex = Math.max(5, priorArtRiskIndex - referenceReduction - reviewReduction - stageReduction);
    }
    priorArtRiskIndex = Math.max(0, Math.min(100, Math.round(priorArtRiskIndex)));

    // 6. Patent Eligibility & Novelty Score (%) (0 = No Evidence, 100 = Fully Documented & Validated)
    // Scoring logic built strictly from persisted database evidence:
    // - Specification Evidence (max 30 pts): technical disclosure (idea, problem, solution, domain) & uploaded draft documents.
    // - Claims & Novelty Evidence (max 25 pts): novel features definition & Form 2 claims scope.
    // - Prior-Art Grounding (max 20 pts): cataloged prior-art references proving prior-art search diligence.
    // - Statutory Forms Evidence (max 15 pts): submitted/approved statutory IPO forms (Forms 1, 2, 3, 5).
    // - Review & Verification Evidence (max 10 pts): formal supervisor/expert approval sign-offs.
    // Sub-score 1: Specification Evidence (0 - 30 pts)
    let specificationEvidence = 0;
    const hasCoreDisclosure = Boolean(
      project.title && project.title.trim().length > 3 &&
      project.innovationIdea && project.innovationIdea.trim().length > 10 &&
      project.problemStatement && project.problemStatement.trim().length > 10 &&
      project.proposedSolution && project.proposedSolution.trim().length > 10
    );
    if (hasCoreDisclosure) specificationEvidence += 15;
    if (project.technicalDomain && project.category) specificationEvidence += 5;
    const hasDraftDoc = project.documents.some((d) =>
      d.category === 'PATENT_DRAFT' || d.category === 'RESEARCH_PAPER' || d.category === 'LITERATURE_REVIEW'
    );
    if (hasDraftDoc) specificationEvidence += 10;

    // Sub-score 2: Claims & Novelty Evidence (0 - 25 pts)
    let claimsEvidence = 0;
    const form2 = project.patentForms.find((f) => f.formType === 'Form 2');
    const form2Data = form2?.formData as Record<string, any> | undefined;
    const hasNovelFeatures = Boolean(
      (project.novelFeatures && project.novelFeatures.trim().length > 10) ||
      (form2Data?.novelFeatures && String(form2Data.novelFeatures).trim().length > 10)
    );
    if (hasNovelFeatures) claimsEvidence += 10;
    const hasClaims = Boolean(
      (form2Data?.claimsText && String(form2Data.claimsText).trim().length > 10) ||
      (project.keywords && project.keywords.trim().length > 5) ||
      (form2 && (form2.status === 'SUBMITTED' || form2.status === 'APPROVED'))
    );
    if (hasClaims) claimsEvidence += 15;

    // Sub-score 3: Prior-Art Evidence (0 - 20 pts)
    let priorArtEvidence = 0;
    if (totalReferences >= 1) priorArtEvidence += 10;
    if (totalReferences >= 2) priorArtEvidence += 10;

    // Sub-score 4: Statutory Forms Evidence (0 - 15 pts)
    let formsEvidence = 0;
    if (submittedFormsCount >= 1) formsEvidence += 5;
    if (submittedFormsCount >= 2) formsEvidence += 5;
    if (approvedFormsCount >= 3 || legalComplianceHealth >= 80) formsEvidence += 5;

    // Sub-score 5: Review & Validation Evidence (0 - 10 pts)
    let reviewEvidence = 0;
    if (approvedReviewsCount >= 1 || project.stage === 'FILING_READY' || project.stage === 'FILED') {
      reviewEvidence += 10;
    }

    const patentEligibilityScore = Math.max(
      0,
      Math.min(
        100,
        specificationEvidence + claimsEvidence + priorArtEvidence + formsEvidence + reviewEvidence
      )
    );

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
        patentEligibilityScore: 'Calculated from documented specifications, novelty definitions, claims drafting, prior art grounding, and formal review sign-offs.',
        priorArtRiskIndex: 'Evaluated based on cataloged prior art references, source verification (USPTO vs Mock), and stage maturity; fewer references indicate higher unmitigated prior-art risk.',
        technicalDrawingScore: 'Evaluated based on 2D figure sheets uploaded, Gemini Vision component tags annotated, and schematic legend completeness.',
        legalComplianceHealth: 'Percentage of mandatory Indian Patent Office forms (Forms 1, 2, 3, 5, 26) prepared and submitted.',
        teamExecutionVelocity: 'Percentage of assigned project workspace tasks marked as COMPLETED.',
        filingReadinessScore: 'Composite 6-point compliance checklist score required for final IPO filing package export.'
      }
    };
  }

  /**
   * Aggregates portfolio analytics across all projects accessible to the user.
   * If the user is an Admin, aggregates across all platform projects.
   */
  static async getDashboardAnalytics(userId: string, userRole?: string): Promise<DashboardAnalyticsSummary> {
    const isGlobalAdmin = userRole === 'Admin';
    const projects = await prisma.patentProject.findMany({
      where: isGlobalAdmin
        ? {}
        : {
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
    let totalFormsSum = 0;
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

      // Authoritative 6-point filing readiness calculation via FilingReadinessService
      const readiness = await FilingReadinessService.getFilingReadiness(proj.id);
      const readinessScore = Math.round((readiness.completedCount / readiness.totalRequiredCount) * 100);
      totalReadinessSum += readinessScore;

      if (readinessScore < 50 || overT > 0) {
        needsAttentionProjects++;
      }

      totalRefSum += proj.patentReferences.length;
      totalProtoSum += proj.prototypes.length;
      totalReviewSum += proj.projectReviews.length;
      totalFormsSum += proj.patentForms.length;

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
      totalForms: totalFormsSum,
      pendingReviewsCount,
      overdueTasksCount,
      stageDistribution,
      projectHealthSummaries: healthSummaries
    };
  }

  /**
   * Complete real PostgreSQL aggregator for Co-Inventor Workspace
   */
  static async getCoInventorDashboardData(userId: string) {
    // 1. Fetch all projects where user is owner or member
    const projects = await prisma.patentProject.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: { select: { id: true, fullName: true, username: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, email: true } }
          }
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, fullName: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        projectReviews: {
          include: {
            reviewer: { select: { id: true, fullName: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        patentForms: true,
        _count: {
          select: { documents: true, tasks: true, members: true, patentClaims: true, drawingFigures: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const projectIds = projects.map(p => p.id);
    const now = new Date();
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 2. Compute project health & filing readiness
    const detailedProjects = [];
    let activeProjectsCount = 0;
    let pendingReviewsCount = 0;
    let totalMyTasksCount = 0;
    let tasksDueThisWeekCount = 0;

    const stageMap: Record<string, number> = {
      IDEA: 0,
      LITERATURE_REVIEW: 1,
      PROTOTYPE: 2,
      DOCUMENTATION: 2,
      FORMS_PREPARATION: 4,
      GUIDE_REVIEW: 3,
      PATENT_EXPERT_REVIEW: 3,
      FILING_READY: 5,
      FILED: 5,
    };

    for (const proj of projects) {
      if (!proj.isArchived && proj.stage !== 'FILED') {
        activeProjectsCount++;
      }

      const readiness = await FilingReadinessService.getFilingReadiness(proj.id);
      const readinessScore = Math.round((readiness.completedCount / readiness.totalRequiredCount) * 100);

      // Tasks calculation
      for (const t of proj.tasks) {
        if (t.status !== 'COMPLETED') {
          totalMyTasksCount++;
          if (t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= oneWeekFromNow) {
            tasksDueThisWeekCount++;
          }
        }
      }

      // Reviews calculation
      for (const r of proj.projectReviews) {
        if (r.decision === 'PENDING') {
          pendingReviewsCount++;
        }
      }

      detailedProjects.push({
        id: proj.id,
        title: proj.title,
        status: proj.isArchived ? 'ARCHIVED' : proj.stage === 'FILED' ? 'FILED' : 'ACTIVE',
        summary: proj.problemStatement || proj.innovationIdea || 'Invention workflow and claims drafting docket.',
        domain: proj.technicalDomain,
        category: proj.category,
        stage: proj.stage,
        currentStageIndex: stageMap[proj.stage] !== undefined ? stageMap[proj.stage] : 2,
        filingReadiness: readinessScore,
        owner: proj.owner,
        members: proj.members,
        collaboratorCount: proj.members.length + 1,
        createdAt: proj.createdAt,
        updatedAt: proj.updatedAt,
      });
    }

    // 3. Fetch Real Activity Logs across user's projects
    const rawActivityLogs = await prisma.activityLog.findMany({
      where: {
        projectId: { in: projectIds }
      },
      include: {
        user: { select: { id: true, fullName: true, username: true } },
        project: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const recentActivities = rawActivityLogs.map(log => ({
      id: log.id,
      actor: log.user?.fullName || log.user?.username || 'Team Member',
      isCurrentUser: log.userId === userId,
      action: log.action,
      time: log.createdAt,
      projectTitle: log.project?.title || 'Patent Project',
    }));

    // 4. Fetch Real Recent Documents across user's projects
    const rawDocuments = await prisma.document.findMany({
      where: {
        projectId: { in: projectIds }
      },
      include: {
        project: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 8
    });

    const recentDocuments = rawDocuments.map(doc => ({
      id: doc.id,
      title: doc.name,
      category: doc.category,
      projectTitle: doc.project.title,
      projectId: doc.projectId,
      fileUrl: doc.fileUrl,
      updated: doc.createdAt,
    }));

    // 5. Generate Real Needs Attention items
    const needsAttention = [];

    // Add real pending reviews
    for (const proj of projects) {
      const pendingRev = proj.projectReviews.find(r => r.decision === 'PENDING');
      if (pendingRev) {
        needsAttention.push({
          id: `rev-${pendingRev.id}`,
          type: 'CLAIM REVIEW',
          title: `Review pending for ${pendingRev.reviewType || 'Project Claims'}`,
          project: proj.title,
          projectId: proj.id,
          tag: 'Under Review',
          tagBg: 'bg-rose-50 text-rose-700 border border-rose-200',
          actionText: 'Review',
          tabTarget: 'Reviews',
        });
      }
    }

    // Add real pending tasks
    for (const proj of projects) {
      const pendingTask = proj.tasks.find(t => t.status !== 'COMPLETED');
      if (pendingTask) {
        needsAttention.push({
          id: `task-${pendingTask.id}`,
          type: 'TASK REQUIRED',
          title: pendingTask.title,
          project: proj.title,
          projectId: proj.id,
          tag: pendingTask.dueDate ? 'Due Soon' : 'Action Required',
          tagBg: 'bg-amber-50 text-amber-700 border border-amber-200',
          actionText: 'View Task',
          tabTarget: 'Tasks',
        });
      }
    }

    // Add real document requirements if forms or specs missing
    for (const proj of projects) {
      if (proj._count.documents === 0) {
        needsAttention.push({
          id: `doc-${proj.id}`,
          type: 'DOCUMENT REQUEST',
          title: 'Upload technical specification & disclosure',
          project: proj.title,
          projectId: proj.id,
          tag: 'Required',
          tagBg: 'bg-blue-50 text-blue-700 border border-blue-200',
          actionText: 'Upload Document',
          tabTarget: 'Documents',
        });
      }
    }

    return {
      kpis: {
        myProjects: projects.length,
        activeProjects: activeProjectsCount,
        myTasks: totalMyTasksCount,
        tasksDueThisWeek: tasksDueThisWeekCount,
        pendingReviews: pendingReviewsCount,
      },
      projects: detailedProjects,
      needsAttention: needsAttention.slice(0, 5),
      recentActivities,
      recentDocuments,
    };
  }
}
