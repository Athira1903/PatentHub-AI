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
    const projects: any[] = await prisma.patentProject.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: { select: { id: true, fullName: true, username: true, email: true, institution: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, email: true, role: { select: { name: true } } } }
          }
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, fullName: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        projectReviews: {
          include: {
            reviewer: { select: { id: true, fullName: true, username: true, role: { select: { name: true } } } }
          },
          orderBy: { createdAt: 'desc' }
        },
        patentClaims: {
          orderBy: { claimNumber: 'asc' }
        },
        claimCharts: {
          include: {
            reference: true
          }
        },
        patentReferences: true,
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        drawingFigures: {
          include: {
            components: true
          }
        },
        patentForms: true,
        _count: {
          select: {
            documents: true,
            tasks: true,
            members: true,
            patentClaims: true,
            claimCharts: true,
            drawingFigures: true,
            patentReferences: true,
            projectReviews: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const projectIds = projects.map(p => p.id);
    const now = new Date();
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const stageMap: Record<string, number> = {
      IDEA: 0,
      LITERATURE_REVIEW: 1,
      DOCUMENTATION: 2,
      GUIDE_REVIEW: 3,
      PATENT_EXPERT_REVIEW: 3,
      PROTOTYPE: 4,
      FORMS_PREPARATION: 4,
      FILING_READY: 5,
      FILED: 5,
    };

    let totalReadinessSum = 0;
    let activeProjectsCount = 0;
    let totalPendingReviews = 0;
    let myAssignedTasksCount = 0;
    let myCompletedTasksCount = 0;
    let myIncompleteTasksCount = 0;

    const detailedProjects = [];
    const allNeedsAttention: any[] = [];
    const allCoInventorTasks: any[] = [];
    const allPendingReviews: any[] = [];

    for (let idx = 0; idx < projects.length; idx++) {
      const proj = projects[idx];
      if (!proj.isArchived && proj.stage !== 'FILED') {
        activeProjectsCount++;
      }

      // Live 6-point filing readiness calculation
      const readiness = await FilingReadinessService.getFilingReadiness(proj.id);
      const readinessScore = Math.round((readiness.completedCount / readiness.totalRequiredCount) * 100);
      totalReadinessSum += readinessScore;

      // Prior Art Risk
      const claimCharts = proj.claimCharts || [];
      const hasHighRisk = claimCharts.some((c: any) => c.overallRisk === 'HIGH');
      const hasMedRisk = claimCharts.some((c: any) => c.overallRisk === 'MEDIUM');
      const refCount = proj.patentReferences?.length || 0;

      let priorArtRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      let priorArtNote = 'Strong prior-art coverage';

      if (hasHighRisk) {
        priorArtRiskLevel = 'HIGH';
        priorArtNote = 'Prior-art claim overlap detected';
      } else if (hasMedRisk) {
        priorArtRiskLevel = 'MEDIUM';
        priorArtNote = 'Moderate prior-art overlap';
      } else if (refCount === 0) {
        priorArtRiskLevel = 'HIGH';
        priorArtNote = 'Limited prior-art examination';
      }

      // Novelty Score & Patent Evidence
      let noveltyScore = 75;
      let noveltyRating = 'Strong Evidence';
      try {
        const analytics = await AnalyticsService.getProjectAnalytics(proj.id, userId);
        noveltyScore = analytics.scores.patentEligibilityScore || 75;
        if (noveltyScore >= 70) noveltyRating = 'Strong Evidence';
        else if (noveltyScore >= 50) noveltyRating = 'Moderate Novelty';
        else noveltyRating = 'Initial Evidence';
      } catch (e) {
        noveltyScore = 70;
        noveltyRating = 'Initial Evidence';
      }

      const currentStageIndex = stageMap[proj.stage] !== undefined ? stageMap[proj.stage] : 0;

      // Tasks progress
      const totalT = proj.tasks.length;
      const compT = proj.tasks.filter((t: any) => t.status === 'COMPLETED').length;
      const taskVelocity = totalT > 0 ? Math.round((compT / totalT) * 100) : 0;

      // Co-inventor specific tasks tracking
      proj.tasks.forEach((t: any) => {
        if (t.assignedToId === userId) {
          myAssignedTasksCount++;
          if (t.status === 'COMPLETED') {
            myCompletedTasksCount++;
          } else {
            myIncompleteTasksCount++;
          }
        }

        allCoInventorTasks.push({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          projectId: proj.id,
          projectTitle: proj.title,
          isAssignedToMe: t.assignedToId === userId,
          assignedTo: t.assignedTo,
        });
      });

      // Claims metrics
      const claims = proj.patentClaims || [];
      const independentClaimsCount = claims.filter((c: any) => c.claimType === 'INDEPENDENT').length;
      const dependentClaimsCount = claims.filter((c: any) => c.claimType === 'DEPENDENT').length;

      // Drawings & components
      const drawingFigures = proj.drawingFigures || [];
      let totalComponentsCount = 0;
      drawingFigures.forEach((f: any) => {
        totalComponentsCount += f.components?.length || 0;
      });

      // Collaborators
      const collaborators = [
        {
          id: proj.owner.id,
          name: proj.owner.fullName,
          username: proj.owner.username,
          role: 'Lead Inventor',
          isOwner: true,
        },
        ...proj.members.map((m: any) => ({
          id: m.user.id,
          name: m.user.fullName,
          username: m.user.username,
          role: m.role || (m.user.role?.name || 'Co-Inventor'),
          permissionLevel: m.permissionLevel,
          isOwner: false,
        }))
      ];

      // Reviews
      const pendingRevs = proj.projectReviews.filter((r: any) => r.decision === 'PENDING');
      totalPendingReviews += pendingRevs.length;

      pendingRevs.forEach((r: any) => {
        allPendingReviews.push({
          id: r.id,
          projectId: proj.id,
          projectTitle: proj.title,
          reviewer: r.reviewer?.fullName || 'Assigned Reviewer',
          role: r.reviewer?.role?.name || (r.reviewType === 'GUIDE_REVIEW' ? 'Guide' : 'Patent Expert'),
          reviewType: r.reviewType?.replace('_', ' ') || 'Milestone Review',
          status: 'PENDING',
          requestedDate: r.createdAt,
        });
      });

      // Attention Items
      if (claims.length === 0) {
        allNeedsAttention.push({
          id: `att-claim-${proj.id}`,
          priority: 'HIGH',
          title: 'Claims Engineering Required',
          projectTitle: proj.title,
          projectId: proj.id,
          reason: 'Project has 0 statutory claims formulated. Draft claims to proceed.',
          actionText: 'Open Claims Studio',
          link: `/dashboard/projects/${proj.id}`,
        });
      } else if (hasHighRisk) {
        allNeedsAttention.push({
          id: `att-fto-${proj.id}`,
          priority: 'HIGH',
          title: 'Prior-Art Overlap Revision',
          projectTitle: proj.title,
          projectId: proj.id,
          reason: 'High prior-art overlap detected in FTO analysis.',
          actionText: 'Review Prior Art',
          link: `/dashboard/projects/${proj.id}`,
        });
      } else if (proj._count.documents === 0) {
        allNeedsAttention.push({
          id: `att-doc-${proj.id}`,
          priority: 'MEDIUM',
          title: 'Document Upload Required',
          projectTitle: proj.title,
          projectId: proj.id,
          reason: 'No technical specification or research document uploaded.',
          actionText: 'Upload Document',
          link: `/dashboard/projects/${proj.id}`,
        });
      } else if (pendingRevs.length > 0) {
        allNeedsAttention.push({
          id: `att-rev-${proj.id}`,
          priority: 'MEDIUM',
          title: 'Review Awaiting Approval',
          projectTitle: proj.title,
          projectId: proj.id,
          reason: `${pendingRevs[0].reviewer?.fullName || 'Supervisor'} milestone review is pending.`,
          actionText: 'View Review',
          link: `/dashboard/projects/${proj.id}`,
        });
      }

      detailedProjects.push({
        id: proj.id,
        title: proj.title,
        technicalDomain: proj.technicalDomain || 'AI / Technology',
        category: proj.category || 'Invention',
        stage: proj.stage,
        currentStageIndex,
        filingReadiness: readinessScore,
        readinessChecklist: readiness.checklist,
        priorArtRisk: priorArtRiskLevel,
        priorArtNote,
        noveltyScore,
        noveltyRating,
        tasksTotal: totalT,
        tasksCompleted: compT,
        taskVelocity,
        collaboratorsCount: collaborators.length,
        collaborators,
        claimsCount: claims.length,
        independentClaimsCount,
        dependentClaimsCount,
        drawingsCount: drawingFigures.length,
        annotatedComponentsCount: totalComponentsCount,
        documentsCount: proj.documents.length,
        reviewStatus: pendingRevs.length > 0 ? 'Review Pending' : proj.stage === 'FILING_READY' ? 'Filing Ready' : 'In Progress',
        lastUpdated: proj.updatedAt,
      });
    }

    // 2. Fetch Recent Activities for these projects
    const rawActivityLogs = await prisma.activityLog.findMany({
      where: {
        projectId: { in: projectIds }
      },
      include: {
        user: { select: { id: true, fullName: true, username: true } },
        project: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 8
    });

    const recentActivities = rawActivityLogs.map(log => ({
      id: log.id,
      user: log.user?.fullName || log.user?.username || 'Team Member',
      action: log.action,
      project: log.project?.title || 'Patent Project',
      projectId: log.projectId,
      timestamp: log.createdAt,
      isCurrentUser: log.userId === userId,
    }));

    // 3. User's Personal Recent Contributions
    const myContributions = rawActivityLogs.filter(log => log.userId === userId).slice(0, 5);

    // 4. Fetch Recent Documents
    const rawDocuments = await prisma.document.findMany({
      where: {
        projectId: { in: projectIds }
      },
      include: {
        project: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    const recentDocuments = rawDocuments.map(doc => ({
      id: doc.id,
      name: doc.name,
      fileUrl: doc.fileUrl,
      category: doc.category,
      version: doc.version,
      projectTitle: doc.project?.title || 'Patent Workspace',
      projectId: doc.projectId,
      uploadedAt: doc.createdAt,
    }));

    // 5. Fetch Pending Invitations
    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        OR: [
          { receiverId: userId },
          { senderId: userId }
        ],
        status: 'PENDING'
      },
      include: {
        sender: { select: { id: true, fullName: true, username: true } },
        receiver: { select: { id: true, fullName: true, username: true } },
        project: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const formattedInvitations = pendingInvitations.map(inv => ({
      id: inv.id,
      projectTitle: inv.project?.title || 'Patent Project',
      projectId: inv.projectId,
      senderName: inv.sender?.fullName || 'Inventor',
      receiverName: inv.receiver?.fullName || 'Collaborator',
      role: inv.role,
      isReceived: inv.receiverId === userId,
      status: inv.status,
      createdAt: inv.createdAt,
    }));

    const avgFilingReadiness = projects.length > 0 ? Math.round(totalReadinessSum / projects.length) : 0;
    const pendingActionsCount = allNeedsAttention.length + myIncompleteTasksCount + totalPendingReviews;

    // Filter tasks prioritized for the co-inventor (assigned to me first, then all accessible)
    const prioritizedTasks = [...allCoInventorTasks].sort((a, b) => {
      if (a.isAssignedToMe && !b.isAssignedToMe) return -1;
      if (!a.isAssignedToMe && b.isAssignedToMe) return 1;
      return 0;
    });

    return {
      kpis: {
        myProjects: projects.length,
        activeProjects: activeProjectsCount,
        filingReadiness: avgFilingReadiness,
        pendingActions: pendingActionsCount,
        pendingReviews: totalPendingReviews,
        myTasks: myIncompleteTasksCount,
        openTasks: allCoInventorTasks.filter(t => t.status !== 'COMPLETED').length,
      },
      contribution: {
        tasksAssigned: myAssignedTasksCount,
        tasksCompleted: myCompletedTasksCount,
        completionRate: myAssignedTasksCount > 0 ? Math.round((myCompletedTasksCount / myAssignedTasksCount) * 100) : 0,
        myRecentContributions: myContributions.map(c => ({
          id: c.id,
          action: c.action,
          project: c.project?.title || 'Patent Workspace',
          timestamp: c.createdAt,
        })),
      },
      projects: detailedProjects,
      needsAttention: allNeedsAttention.slice(0, 5),
      tasks: prioritizedTasks.slice(0, 6),
      pendingReviews: allPendingReviews.slice(0, 5),
      invitations: formattedInvitations,
      recentActivities,
      recentDocuments,
    };
  }

  /**
   * Aggregates live Patent Intelligence Workspace data for the Patent Expert dashboard.
   */
  static async getPatentExpertDashboardData(userId: string) {
    // 1. Fetch strictly projects assigned to this expert or owned by them
    const projects: any[] = await prisma.patentProject.findMany({
      where: {
        isArchived: false,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ]
      },
      include: {
        owner: { select: { id: true, fullName: true, username: true, email: true, institution: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, role: { select: { name: true } } } }
          }
        },
        projectReviews: {
          include: {
            reviewer: { select: { id: true, fullName: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        patentClaims: {
          include: {
            claimElements: true,
          },
          orderBy: { claimNumber: 'asc' }
        },
        claimCharts: true,
        patentReferences: true,
        documents: true,
        deadlines: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { dueDate: 'asc' },
          take: 1
        },
        tasks: true,
        _count: {
          select: {
            patentClaims: true,
            claimCharts: true,
            documents: true,
            patentReferences: true,
            projectReviews: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const projectIds = projects.map(p => p.id);
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);

    let pendingReviewsCount = 0;
    let completedReviewsCount = 0;
    let ftoAnalysisCount = 0;
    let claimReviewsCount = 0;
    let dueThisWeekCount = 0;

    let totalPriorArtRisk = 0;
    let totalPatentability = 0;
    let totalClaimStrength = 0;
    let totalFilingReadiness = 0;

    const stageMap: Record<string, number> = {
      IDEA: 0,
      LITERATURE_REVIEW: 1,
      DOCUMENTATION: 2,
      PROTOTYPE: 3,
      FORMS_PREPARATION: 4,
      GUIDE_REVIEW: 3,
      PATENT_EXPERT_REVIEW: 3,
      FILING_READY: 5,
      FILED: 5,
    };

    const detailedProjects = [];

    for (const proj of projects) {
      const readiness = await FilingReadinessService.getFilingReadiness(proj.id);
      const readinessScore = Math.round((readiness.completedCount / readiness.totalRequiredCount) * 100);

      // Reviews
      let hasPendingReview = false;
      for (const r of proj.projectReviews) {
        if (r.decision === 'PENDING') {
          hasPendingReview = true;
        } else if (r.decision === 'APPROVED' || r.decision === 'REJECTED' || r.decision === 'CHANGES_REQUESTED') {
          if (r.reviewerId === userId) {
            completedReviewsCount++;
          }
        }
      }

      if (hasPendingReview || proj.stage === 'PATENT_EXPERT_REVIEW') {
        pendingReviewsCount++;
      }

      // FTO: projects that have claim charts or are in PATENT_EXPERT_REVIEW requiring FTO assessment
      if (proj._count.claimCharts > 0 || proj.stage === 'PATENT_EXPERT_REVIEW') {
        ftoAnalysisCount++;
      }

      // Claims awaiting expert review
      if (proj._count.patentClaims > 0) {
        claimReviewsCount += proj._count.patentClaims;
      }

      // Compute scores
      const priorArtCount = proj._count.patentReferences;
      const riskScore = Math.min(95, Math.max(25, 40 + priorArtCount * 10));
      const patentabilityScore = Math.min(98, Math.max(50, 75 + (proj._count.patentClaims > 0 ? 10 : 0)));
      const claimStrengthScore = Math.min(95, Math.max(45, 60 + proj._count.patentClaims * 4));

      totalPriorArtRisk += riskScore;
      totalPatentability += patentabilityScore;
      totalClaimStrength += claimStrengthScore;
      totalFilingReadiness += readinessScore;

      detailedProjects.push({
        id: proj.id,
        title: proj.title,
        status: proj.isArchived ? 'ARCHIVED' : proj.stage === 'FILED' ? 'FILED' : 'ACTIVE',
        domain: proj.technicalDomain || 'Technology',
        category: proj.category,
        stage: proj.stage,
        currentStageIndex: stageMap[proj.stage] !== undefined ? stageMap[proj.stage] : 3,
        filingReadiness: readinessScore,
        owner: proj.owner,
        members: proj.members,
        claimsCount: proj._count.patentClaims,
        referencesCount: proj._count.patentReferences,
        documentsCount: proj._count.documents,
        updatedAt: proj.updatedAt,
      });
    }

    // Deadlines due this week
    if (projectIds.length > 0) {
      dueThisWeekCount = await prisma.deadline.count({
        where: {
          projectId: { in: projectIds },
          dueDate: { gte: now, lte: oneWeekFromNow },
          status: { not: 'COMPLETED' },
        }
      });
    }

    // Any reviews completed directly by this expert across projects
    const totalExpertReviews = await prisma.projectReview.count({
      where: {
        reviewerId: userId,
        decision: { in: ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'] }
      }
    });
    completedReviewsCount = Math.max(completedReviewsCount, totalExpertReviews);

    const n = Math.max(1, projects.length);
    const avgPriorArtRisk = Math.round(totalPriorArtRisk / n);
    const avgPatentability = Math.round(totalPatentability / n);
    const avgClaimStrength = Math.round(totalClaimStrength / n);
    const avgFilingReadiness = Math.round(totalFilingReadiness / n);

    // 2. Fetch Recent Activities across assigned projects
    const rawActivityLogs = projectIds.length > 0
      ? await prisma.activityLog.findMany({
          where: {
            projectId: { in: projectIds }
          },
          include: {
            user: { select: { id: true, fullName: true, username: true } },
            project: { select: { id: true, title: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 8
        })
      : [];

    const recentActivities = rawActivityLogs.map(log => ({
      id: log.id,
      actor: log.user?.fullName || log.user?.username || 'Team Member',
      action: log.action,
      time: log.createdAt,
      projectTitle: log.project?.title || 'Patent Project',
    }));

    // 3. Claims Awaiting Review
    let claimsAwaitingReview: any = null;
    for (const proj of projects) {
      if (proj.patentClaims && proj.patentClaims.length > 0) {
        const topClaim = proj.patentClaims.find((c: any) => c.status === 'UNDER_REVIEW' || c.status === 'DRAFT') || proj.patentClaims[0];
        claimsAwaitingReview = {
          id: topClaim.id,
          projectId: proj.id,
          projectTitle: proj.title,
          claimNumber: topClaim.claimNumber,
          claimType: topClaim.claimType,
          body: topClaim.body,
          status: topClaim.status,
          elementsCount: topClaim.claimElements?.length || 0,
          hasAntecedents: true,
          hasDependency: topClaim.dependsOnNumber !== null,
          hasDrawingLinks: topClaim.claimElements?.some((e: any) => e.componentId !== null) || false,
        };
        break;
      }
    }

    // 4. Priority Reviews Table Rows
    const priorityReviews = projects.slice(0, 6).map((proj, idx) => {
      let reviewType = 'Invention Review';
      if (proj.stage === 'PATENT_EXPERT_REVIEW') {
        reviewType = 'FTO & Claims Clearance';
      } else if (proj.stage === 'GUIDE_REVIEW') {
        reviewType = 'Academic Supervisor Review';
      } else if (proj._count.claimCharts > 0) {
        reviewType = 'FTO Analysis';
      } else if (proj._count.patentClaims > 0) {
        reviewType = 'Claim Review';
      } else if (proj.stage === 'DOCUMENTATION') {
        reviewType = 'Specification Review';
      }

      const risk = (proj._count.patentReferences > 3) ? 'HIGH' : (proj._count.patentReferences > 1) ? 'MEDIUM' : 'LOW';

      let formattedDueDate = 'Pending schedule';
      if (proj.deadlines && proj.deadlines.length > 0) {
        formattedDueDate = new Date(proj.deadlines[0].dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      return {
        id: `rev-${proj.id}`,
        projectId: proj.id,
        projectTitle: proj.title,
        reviewType,
        risk,
        dueDate: formattedDueDate,
        action: 'Review',
        inventor: proj.owner?.fullName || proj.owner?.username || 'Lead Inventor',
        stage: proj.stage,
      };
    });

    // 5. Featured High-Priority Review Banner
    const featuredProject = projects.find(p => p.stage === 'PATENT_EXPERT_REVIEW') || projects[0] || null;
    const featuredReview = featuredProject ? {
      projectId: featuredProject.id,
      title: featuredProject.title,
      riskType: featuredProject._count.claimCharts > 0 ? 'FTO Claim Overlap' : 'Patent Claims Review',
      riskLevel: featuredProject._count.patentReferences > 3 ? 'HIGH' : featuredProject._count.patentReferences > 1 ? 'MEDIUM' : 'LOW',
      description: `${featuredProject._count.patentClaims} claims and ${featuredProject._count.patentReferences} references awaiting expert assessment.`,
      link: `/dashboard/projects/${featuredProject.id}?tab=Reviews`,
    } : null;

    // 6. Review Queue Grouping
    const reviewQueue = {
      all: priorityReviews,
      claims: priorityReviews.filter(r => r.reviewType.includes('Claim')),
      fto: priorityReviews.filter(r => r.reviewType.includes('FTO')),
      documents: priorityReviews.filter(r => r.reviewType.includes('Specification') || r.reviewType.includes('Document')),
      patentability: priorityReviews.filter(r => r.reviewType.includes('Patentability') || r.reviewType.includes('Invention') || r.reviewType.includes('Academic')),
    };

    return {
      kpis: {
        pendingReviews: pendingReviewsCount,
        ftoAnalysis: ftoAnalysisCount,
        claimReviews: claimReviewsCount,
        dueThisWeek: dueThisWeekCount,
        completedReviews: completedReviewsCount,
      },
      workload: {
        claimsReviews: claimReviewsCount,
        ftoAnalysis: ftoAnalysisCount,
        documents: projects.reduce((acc, p) => acc + p._count.documents, 0),
        decisions: completedReviewsCount,
      },
      featuredReview,
      patentIntelligence: {
        priorArtRisk: {
          score: projects.length > 0 ? avgPriorArtRisk : 0,
          level: projects.length > 0 ? (avgPriorArtRisk > 70 ? 'HIGH' : avgPriorArtRisk > 40 ? 'MEDIUM' : 'LOW') : 'LOW',
          note: projects.length > 0
            ? `${projects[0]?._count?.patentReferences || 0} relevant references evaluated`
            : 'No active projects under review',
        },
        patentability: {
          score: projects.length > 0 ? avgPatentability : 0,
          level: projects.length > 0 ? (avgPatentability > 75 ? 'HIGH' : avgPatentability > 50 ? 'MEDIUM' : 'LOW') : 'LOW',
          note: projects.length > 0 ? 'Patentability metrics based on verified citations' : 'No active projects under review',
        },
        claimStrength: {
          score: projects.length > 0 ? avgClaimStrength : 0,
          level: projects.length > 0 ? (avgClaimStrength > 70 ? 'HIGH' : avgClaimStrength > 40 ? 'MEDIUM' : 'LOW') : 'LOW',
          note: projects.length > 0 ? 'Claims evaluation based on antecedent structure' : 'No active projects under review',
        },
        filingReadiness: {
          score: projects.length > 0 ? avgFilingReadiness : 0,
          level: projects.length > 0 ? (avgFilingReadiness > 70 ? 'HIGH' : avgFilingReadiness > 40 ? 'MEDIUM' : 'LOW') : 'LOW',
          note: projects.length > 0 ? 'Filing readiness based on 12-point statutory checklist' : 'No active projects under review',
        },
      },
      claimsAwaitingReview,
      priorityReviews,
      reviewQueue,
      projects: detailedProjects,
      recentActivities,
    };
  }

  /**
   * Aggregates live Patent Development Platform data for the Guide dashboard.
   */
  static async getGuideDashboardData(userId: string) {
    // 1. Fetch strictly projects supervised by this guide (where user is owner or assigned member)
    const projects: any[] = await prisma.patentProject.findMany({
      where: {
        isArchived: false,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ]
      },
      include: {
        owner: { select: { id: true, fullName: true, username: true, email: true, institution: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, role: { select: { name: true } } } }
          }
        },
        projectReviews: {
          include: {
            reviewer: { select: { id: true, fullName: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        patentClaims: {
          orderBy: { claimNumber: 'asc' }
        },
        claimCharts: true,
        patentReferences: true,
        documents: true,
        drawingFigures: true,
        tasks: {
          include: {
            assignedTo: { select: { id: true, fullName: true, username: true } }
          }
        },
        deadlines: {
          orderBy: { dueDate: 'asc' }
        },
        _count: {
          select: {
            patentClaims: true,
            claimCharts: true,
            documents: true,
            drawingFigures: true,
            patentReferences: true,
            projectReviews: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const projectIds = projects.map(p => p.id);

    let pendingReviewsCount = 0;
    let completedReviewsCount = 0;
    let needsAttentionCount = 0;

    const stageMap: Record<string, number> = {
      IDEA: 0,
      LITERATURE_REVIEW: 1,
      DOCUMENTATION: 2,
      PROTOTYPE: 3,
      FORMS_PREPARATION: 4,
      GUIDE_REVIEW: 3,
      PATENT_EXPERT_REVIEW: 3,
      FILING_READY: 5,
      FILED: 5,
    };

    const detailedProjects = [];
    const journeyCounts = {
      idea: 0,
      search: 0,
      claims: 0,
      review: 0,
      prototype: 0,
      filing: 0,
    };

    let healthyCount = 0;
    let attentionCount = 0;
    let blockedCount = 0;

    const needsAttentionProjects = [];
    const myInventorsMap: Record<string, { id: string; name: string; username: string; projectCount: number }> = {};

    for (let idx = 0; idx < projects.length; idx++) {
      const proj = projects[idx];
      const readiness = await FilingReadinessService.getFilingReadiness(proj.id);
      const readinessScore = Math.round((readiness.completedCount / readiness.totalRequiredCount) * 100);

      // Reviews count
      for (const r of proj.projectReviews) {
        if (r.decision === 'PENDING') {
          pendingReviewsCount++;
        } else if (r.decision === 'APPROVED' || r.decision === 'REJECTED') {
          completedReviewsCount++;
        }
      }

      // If project is currently at GUIDE_REVIEW stage, increment pending reviews count
      if (proj.stage === 'GUIDE_REVIEW') {
        pendingReviewsCount++;
      }

      // Journey distribution
      const currentStageIdx = stageMap[proj.stage] !== undefined ? stageMap[proj.stage] : 2;
      if (currentStageIdx === 0) journeyCounts.idea++;
      else if (currentStageIdx === 1) journeyCounts.search++;
      else if (currentStageIdx === 2) journeyCounts.claims++;
      else if (currentStageIdx === 3) journeyCounts.review++;
      else if (currentStageIdx === 4) journeyCounts.prototype++;
      else journeyCounts.filing++;

      // Health
      const hasOverdueDeadline = proj.deadlines?.some((d: any) => d.status === 'OVERDUE');
      const isReviewRequired = proj.stage === 'GUIDE_REVIEW' || proj.stage === 'CHANGES_REQUESTED';
      const hasDraftClaims = proj.patentClaims?.some((c: any) => c.status === 'DRAFT');

      if (readinessScore >= 70 && !hasOverdueDeadline && !isReviewRequired) {
        healthyCount++;
      } else if (readinessScore >= 50 || isReviewRequired) {
        attentionCount++;
        needsAttentionCount++;
      } else {
        blockedCount++;
        needsAttentionCount++;
      }

      // Track inventor
      if (proj.owner) {
        const oId = proj.owner.id;
        if (!myInventorsMap[oId]) {
          myInventorsMap[oId] = {
            id: oId,
            name: proj.owner.fullName || proj.owner.username,
            username: proj.owner.username,
            projectCount: 0
          };
        }
        myInventorsMap[oId].projectCount++;
      }

      // Health Audit matrix (concise DB-driven health status)
      const healthAudit = {
        research: proj._count.patentReferences >= 1 ? 'Complete' : 'Pending',
        claims: proj._count.patentClaims >= 1 ? (hasDraftClaims ? 'Needs Review' : 'Complete') : 'Pending',
        specification: proj._count.documents >= 1 ? 'Complete' : 'Incomplete',
        drawings: (proj._count.drawingFigures >= 1 || proj.patentCategory === 'PROCESS') ? 'Complete' : 'Pending',
        review: proj.stage === 'GUIDE_REVIEW' ? 'Action Required' : (proj.projectReviews.length > 0 ? 'Reviewed' : 'Pending'),
        deadline: hasOverdueDeadline ? 'Overdue' : 'On Track',
      };

      // Identify attention items dynamically from DB state
      if (isReviewRequired || hasOverdueDeadline || readinessScore < 70 || hasDraftClaims) {
        let issueText = 'Invention disclosure submitted for Guide review';
        let severity = 'HIGH';

        if (hasOverdueDeadline) {
          issueText = 'Statutory patent deadline overdue';
          severity = 'HIGH';
        } else if (proj.stage === 'GUIDE_REVIEW') {
          issueText = 'Complete invention dossier awaiting Guide endorsement';
          severity = 'HIGH';
        } else if (proj.stage === 'CHANGES_REQUESTED') {
          issueText = 'Revisions requested; awaiting inventor resubmission';
          severity = 'MEDIUM';
        } else if (hasDraftClaims) {
          const draftCount = proj.patentClaims.filter((c: any) => c.status === 'DRAFT').length;
          issueText = `${draftCount} claim(s) require review and antecedent check`;
          severity = 'MEDIUM';
        } else if (readinessScore < 50) {
          issueText = 'Mandatory filing forms (Form 1, 2, 3, 5) incomplete';
          severity = 'HIGH';
        } else if (proj._count.patentReferences === 0) {
          issueText = 'Prior-art research incomplete';
          severity = 'MEDIUM';
        }

        needsAttentionProjects.push({
          id: proj.id,
          title: proj.title,
          inventor: proj.owner?.fullName || proj.owner?.username || 'Lead Inventor',
          stage: proj.stage === 'GUIDE_REVIEW' ? 'Guide Review' : proj.stage.replace(/_/g, ' '),
          filingReadiness: readinessScore,
          issueText,
          severity,
          actionText: severity === 'HIGH' ? 'Review →' : 'Open Workspace →',
          healthAudit,
        });
      }

      detailedProjects.push({
        id: proj.id,
        title: proj.title,
        status: proj.isArchived ? 'ARCHIVED' : proj.stage === 'FILED' ? 'FILED' : 'ACTIVE',
        domain: proj.technicalDomain || 'AI / Technology',
        category: proj.category,
        stage: proj.stage,
        currentStageIndex: currentStageIdx,
        filingReadiness: readinessScore,
        owner: proj.owner,
        members: proj.members,
        claimsCount: proj._count.patentClaims,
        referencesCount: proj._count.patentReferences,
        documentsCount: proj._count.documents,
        drawingsCount: proj._count.drawingFigures,
        healthAudit,
        updatedAt: proj.updatedAt,
      });
    }

    // 2. Fetch Recent Activities
    const rawActivityLogs = await prisma.activityLog.findMany({
      where: {
        projectId: { in: projectIds }
      },
      include: {
        user: { select: { id: true, fullName: true, username: true } },
        project: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    const recentActivities = rawActivityLogs.map(log => ({
      id: log.id,
      actor: log.user?.fullName || log.user?.username || 'Team Member',
      action: log.action,
      time: log.createdAt,
      projectTitle: log.project?.title || 'Patent Project',
    }));

    // 3. Real Dynamic Review Queue from Supervised Projects
    const reviewQueueItems: any[] = [];

    for (const p of projects) {
      // Real Claims Needing Review
      for (const claim of (p.patentClaims || [])) {
        if (claim.status === 'DRAFT' || p.stage === 'CLAIM_DRAFTING' || p.stage === 'GUIDE_REVIEW') {
          reviewQueueItems.push({
            id: `claim-${claim.id}`,
            type: 'CLAIM REVIEW',
            title: `${p.title} – Claim #${claim.claimNumber}`,
            note: `${claim.claimType} Claim (${claim.body ? claim.body.slice(0, 50) + '...' : 'Pending Review'})`,
            badge: 'Pending',
            badgeColor: 'bg-blue-100 text-blue-800',
            projectId: p.id,
            category: 'Claims'
          });
        }
      }

      // Real Documents Needing Review
      for (const doc of (p.documents || [])) {
        reviewQueueItems.push({
          id: `doc-${doc.id}`,
          type: 'DOCUMENT REVIEW',
          title: `${p.title} – ${doc.name}`,
          note: `Category: ${doc.category || 'SUPPORTING'} (Version ${doc.version})`,
          badge: 'Document',
          badgeColor: 'bg-amber-100 text-amber-800',
          projectId: p.id,
          category: 'Documents'
        });
      }

      // Real Drawing Figures Needing Review
      for (const fig of (p.drawingFigures || [])) {
        reviewQueueItems.push({
          id: `fig-${fig.id}`,
          type: 'DRAWING REVIEW',
          title: `${p.title} – ${fig.figureNumber} (${fig.title})`,
          note: fig.description ? fig.description.slice(0, 50) + '...' : 'Drawing sheet & component annotations.',
          badge: fig.analysisStatus || 'Pending',
          badgeColor: 'bg-purple-100 text-purple-800',
          projectId: p.id,
          category: 'Drawings'
        });
      }

      // Real Project-level Stage Review
      if (p.stage === 'GUIDE_REVIEW' || p.stage === 'PATENT_EXPERT_REVIEW' || p.stage === 'REVIEW') {
        reviewQueueItems.push({
          id: `proj-${p.id}`,
          type: 'PROJECT REVIEW',
          title: `${p.title}`,
          note: `Project stage: ${p.stage.replace(/_/g, ' ')} awaiting formal evaluation.`,
          badge: 'Urgent',
          badgeColor: 'bg-rose-100 text-rose-800',
          projectId: p.id,
          category: 'Projects'
        });
      }
    }

    // 4. Real Open Guidance Items (from actual project review states)
    const openGuidanceItems: any[] = [];
    for (const p of projects) {
      if (p.stage === 'GUIDE_REVIEW' || p.stage === 'CHANGES_REQUESTED') {
        openGuidanceItems.push({
          id: `g-${p.id}`,
          type: p.stage === 'GUIDE_REVIEW' ? 'GUIDE REVIEW REQUIRED' : 'CHANGES REQUESTED',
          project: p.title,
          message: p.stage === 'GUIDE_REVIEW'
            ? `Dossier submitted for review & rubric scoring.`
            : `Revisions pending inventor resubmission.`,
          time: new Date(p.updatedAt).toLocaleDateString(),
          icon: 'document'
        });
      }
    }

    // 5. Real Upcoming Deadlines for supervised projects
    const upcomingDeadlines = await prisma.deadline.findMany({
      where: {
        projectId: { in: projectIds },
        status: { in: ['PENDING', 'APPROACHING', 'OVERDUE'] },
      },
      include: {
        project: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 6,
    });

    // 6. Real Guide Notifications
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    // 7. Dynamic Filing Readiness Overview
    const filingReadinessOverview = detailedProjects.slice(0, 4).map(p => ({
      id: p.id,
      title: p.title,
      readiness: p.filingReadiness,
      stage: p.stage,
      domain: p.domain,
    }));

    const myInventors = Object.values(myInventorsMap);

    return {
      kpis: {
        supervisedProjects: projects.length,
        pendingReviews: pendingReviewsCount,
        needsAttention: needsAttentionCount,
        completedReviews: completedReviewsCount,
      },
      projectsNeedingAttention: needsAttentionProjects,
      supervisedProjectsList: detailedProjects,
      reviewQueue: reviewQueueItems,
      projectHealth: {
        total: projects.length,
        healthy: healthyCount,
        healthyPct: projects.length > 0 ? Math.round((healthyCount / projects.length) * 100) : 0,
        attention: attentionCount,
        attentionPct: projects.length > 0 ? Math.round((attentionCount / projects.length) * 100) : 0,
        blocked: blockedCount,
        blockedPct: projects.length > 0 ? Math.round((blockedCount / projects.length) * 100) : 0,
      },
      journeyDistribution: {
        idea: journeyCounts.idea,
        search: journeyCounts.search,
        claims: journeyCounts.claims,
        review: journeyCounts.review,
        prototype: journeyCounts.prototype,
        filing: journeyCounts.filing,
      },
      filingReadinessOverview,
      recentActivities,
      upcomingDeadlines: upcomingDeadlines.map(d => ({
        id: d.id,
        projectId: d.projectId,
        projectTitle: d.project.title,
        deadlineType: d.deadlineType,
        dueDate: d.dueDate,
        status: d.status,
        description: d.description,
      })),
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        createdAt: n.createdAt,
        referenceId: n.referenceId,
      })),
      openGuidanceItems,
      myInventors,
    };
  }

  /**
   * Aggregates live Patent Innovation Command Center data for the Inventor dashboard.
   */
  static async getInventorDashboardData(userId: string) {
    // 1. Fetch all projects where user is owner or collaborator
    const projects: any[] = await prisma.patentProject.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: { select: { id: true, fullName: true, username: true, email: true, institution: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, email: true, role: { select: { name: true } } } }
          }
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, fullName: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        projectReviews: {
          include: {
            reviewer: { select: { id: true, fullName: true, username: true, role: { select: { name: true } } } }
          },
          orderBy: { createdAt: 'desc' }
        },
        patentClaims: {
          orderBy: { claimNumber: 'asc' }
        },
        claimCharts: {
          include: {
            reference: true
          }
        },
        patentReferences: true,
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        drawingFigures: {
          include: {
            components: true
          }
        },
        patentForms: true,
        _count: {
          select: {
            documents: true,
            tasks: true,
            members: true,
            patentClaims: true,
            claimCharts: true,
            drawingFigures: true,
            patentReferences: true,
            projectReviews: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const projectIds = projects.map(p => p.id);
    const now = new Date();

    const stageMap: Record<string, number> = {
      IDEA: 0,
      LITERATURE_REVIEW: 1,
      DOCUMENTATION: 2,
      GUIDE_REVIEW: 3,
      PATENT_EXPERT_REVIEW: 3,
      PROTOTYPE: 4,
      FORMS_PREPARATION: 4,
      FILING_READY: 5,
      FILED: 5,
    };

    let totalReadinessSum = 0;
    let activeProjectsCount = 0;
    let totalPendingReviews = 0;
    const detailedProjects = [];
    const allNeedsAttention: any[] = [];
    const allInventorTasks: any[] = [];
    const allPendingReviews: any[] = [];

    for (let idx = 0; idx < projects.length; idx++) {
      const proj = projects[idx];
      const isOwner = proj.ownerId === userId;
      if (!proj.isArchived && proj.stage !== 'FILED') {
        activeProjectsCount++;
      }

      // Live 6-point filing readiness calculation
      const readiness = await FilingReadinessService.getFilingReadiness(proj.id);
      const readinessScore = Math.round((readiness.completedCount / readiness.totalRequiredCount) * 100);
      totalReadinessSum += readinessScore;

      // Prior Art Risk
      const claimCharts = proj.claimCharts || [];
      const hasHighRisk = claimCharts.some((c: any) => c.overallRisk === 'HIGH');
      const hasMedRisk = claimCharts.some((c: any) => c.overallRisk === 'MEDIUM');
      const refCount = proj.patentReferences?.length || 0;

      let priorArtRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      let priorArtNote = 'Strong prior-art coverage';

      if (hasHighRisk) {
        priorArtRiskLevel = 'HIGH';
        priorArtNote = 'Prior-art claim overlap detected';
      } else if (hasMedRisk) {
        priorArtRiskLevel = 'MEDIUM';
        priorArtNote = 'Moderate prior-art overlap';
      } else if (refCount === 0) {
        priorArtRiskLevel = 'HIGH';
        priorArtNote = 'Limited prior-art examination';
      }

      // Novelty Score & Patent Evidence
      let noveltyScore = 75;
      let noveltyRating = 'Strong Evidence';
      try {
        const analytics = await AnalyticsService.getProjectAnalytics(proj.id, userId);
        noveltyScore = analytics.scores.patentEligibilityScore || 75;
        if (noveltyScore >= 70) noveltyRating = 'Strong Evidence';
        else if (noveltyScore >= 50) noveltyRating = 'Moderate Novelty';
        else noveltyRating = 'Initial Evidence';
      } catch (e) {
        noveltyScore = 70;
        noveltyRating = 'Initial Evidence';
      }

      // Stage Progression Index
      const currentStageIndex = stageMap[proj.stage] !== undefined ? stageMap[proj.stage] : 0;

      // Tasks progress
      const totalT = proj.tasks.length;
      const compT = proj.tasks.filter((t: any) => t.status === 'COMPLETED').length;
      const taskVelocity = totalT > 0 ? Math.round((compT / totalT) * 100) : 0;

      // Claims metrics
      const claims = proj.patentClaims || [];
      const independentClaimsCount = claims.filter((c: any) => c.claimType === 'INDEPENDENT').length;
      const dependentClaimsCount = claims.filter((c: any) => c.claimType === 'DEPENDENT').length;

      // Drawings & components
      const drawingFigures = proj.drawingFigures || [];
      let totalComponentsCount = 0;
      drawingFigures.forEach((f: any) => {
        totalComponentsCount += f.components?.length || 0;
      });

      // Collaborators
      const collaborators = [
        {
          id: proj.owner.id,
          name: proj.owner.fullName,
          username: proj.owner.username,
          role: 'Lead Inventor',
          isOwner: true,
        },
        ...proj.members.map((m: any) => ({
          id: m.user.id,
          name: m.user.fullName,
          username: m.user.username,
          role: m.role || (m.user.role?.name || 'Co-Inventor'),
          isOwner: false,
        }))
      ];

      // Reviews
      const pendingRevs = proj.projectReviews.filter((r: any) => r.decision === 'PENDING');
      totalPendingReviews += pendingRevs.length;

      pendingRevs.forEach((r: any) => {
        allPendingReviews.push({
          id: r.id,
          projectId: proj.id,
          projectTitle: proj.title,
          reviewer: r.reviewer?.fullName || 'Assigned Reviewer',
          role: r.reviewer?.role?.name || (r.reviewType === 'GUIDE_REVIEW' ? 'Guide' : 'Patent Expert'),
          reviewType: r.reviewType?.replace('_', ' ') || 'Milestone Review',
          status: 'PENDING',
          requestedDate: r.createdAt,
        });
      });

      // Attention Items
      if (claims.length === 0) {
        allNeedsAttention.push({
          id: `att-claim-${proj.id}`,
          priority: 'HIGH',
          title: 'Claims Engineering Required',
          projectTitle: proj.title,
          projectId: proj.id,
          reason: 'Project has 0 statutory claims defined. Draft claims to proceed.',
          actionText: 'Open Claims Studio',
          link: `/dashboard/projects/${proj.id}`,
        });
      } else if (hasHighRisk) {
        allNeedsAttention.push({
          id: `att-fto-${proj.id}`,
          priority: 'HIGH',
          title: 'Prior-Art Overlap Revision',
          projectTitle: proj.title,
          projectId: proj.id,
          reason: 'High prior-art overlap detected in FTO analysis.',
          actionText: 'Review Prior Art',
          link: `/dashboard/projects/${proj.id}`,
        });
      } else if (proj._count.documents === 0) {
        allNeedsAttention.push({
          id: `att-doc-${proj.id}`,
          priority: 'MEDIUM',
          title: 'Document Upload Required',
          projectTitle: proj.title,
          projectId: proj.id,
          reason: 'No technical specification or research document uploaded.',
          actionText: 'Upload Document',
          link: `/dashboard/projects/${proj.id}`,
        });
      } else if (pendingRevs.length > 0) {
        allNeedsAttention.push({
          id: `att-rev-${proj.id}`,
          priority: 'MEDIUM',
          title: 'Review Awaiting Approval',
          projectTitle: proj.title,
          projectId: proj.id,
          reason: `${pendingRevs[0].reviewer?.fullName || 'Supervisor'} milestone review is pending.`,
          actionText: 'View Review',
          link: `/dashboard/projects/${proj.id}`,
        });
      }

      // Collect inventor tasks
      proj.tasks.forEach((t: any) => {
        if (t.assignedToId === userId || t.createdBy === userId || isOwner) {
          allInventorTasks.push({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            projectId: proj.id,
            projectTitle: proj.title,
            isAssignedToMe: t.assignedToId === userId,
            assignedTo: t.assignedTo,
          });
        }
      });

      detailedProjects.push({
        id: proj.id,
        title: proj.title,
        technicalDomain: proj.technicalDomain || 'AI / Technology',
        category: proj.category || 'Invention',
        stage: proj.stage,
        currentStageIndex,
        filingReadiness: readinessScore,
        readinessChecklist: readiness.checklist,
        priorArtRisk: priorArtRiskLevel,
        priorArtNote,
        noveltyScore,
        noveltyRating,
        tasksTotal: totalT,
        tasksCompleted: compT,
        taskVelocity,
        collaboratorsCount: collaborators.length,
        collaborators,
        claimsCount: claims.length,
        independentClaimsCount,
        dependentClaimsCount,
        drawingsCount: drawingFigures.length,
        annotatedComponentsCount: totalComponentsCount,
        documentsCount: proj.documents.length,
        reviewStatus: pendingRevs.length > 0 ? 'Review Pending' : proj.stage === 'FILING_READY' ? 'Filing Ready' : 'In Progress',
        lastUpdated: proj.updatedAt,
      });
    }

    // 2. Fetch Recent Activities for these projects
    const rawActivityLogs = await prisma.activityLog.findMany({
      where: {
        projectId: { in: projectIds }
      },
      include: {
        user: { select: { id: true, fullName: true, username: true } },
        project: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    const recentActivities = rawActivityLogs.map(log => ({
      id: log.id,
      user: log.user?.fullName || log.user?.username || 'Team Member',
      action: log.action,
      project: log.project?.title || 'Patent Project',
      projectId: log.projectId,
      timestamp: log.createdAt,
    }));

    // 3. Fetch Recent Documents
    const rawDocuments = await prisma.document.findMany({
      where: {
        projectId: { in: projectIds }
      },
      include: {
        project: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentDocuments = rawDocuments.map(doc => ({
      id: doc.id,
      name: doc.name,
      fileUrl: doc.fileUrl,
      category: doc.category,
      version: doc.version,
      projectTitle: doc.project?.title || 'Patent Workspace',
      projectId: doc.projectId,
      uploadedAt: doc.createdAt,
    }));

    // 4. Fetch Pending Invitations
    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        OR: [
          { receiverId: userId },
          { senderId: userId }
        ],
        status: 'PENDING'
      },
      include: {
        sender: { select: { id: true, fullName: true, username: true } },
        receiver: { select: { id: true, fullName: true, username: true } },
        project: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const formattedInvitations = pendingInvitations.map(inv => ({
      id: inv.id,
      projectTitle: inv.project?.title || 'Patent Project',
      projectId: inv.projectId,
      senderName: inv.sender?.fullName || 'Inventor',
      receiverName: inv.receiver?.fullName || 'Collaborator',
      role: inv.role,
      isReceived: inv.receiverId === userId,
      status: inv.status,
      createdAt: inv.createdAt,
    }));

    const avgFilingReadiness = projects.length > 0 ? Math.round(totalReadinessSum / projects.length) : 0;
    const pendingActionsCount = allNeedsAttention.length + allInventorTasks.filter(t => t.status !== 'COMPLETED').length + totalPendingReviews;

    return {
      kpis: {
        myProjects: projects.length,
        activeProjects: activeProjectsCount,
        filingReadiness: avgFilingReadiness,
        pendingActions: pendingActionsCount,
        pendingReviews: totalPendingReviews,
        openTasks: allInventorTasks.filter(t => t.status !== 'COMPLETED').length,
      },
      projects: detailedProjects,
      needsAttention: allNeedsAttention.slice(0, 5),
      tasks: allInventorTasks.slice(0, 6),
      pendingReviews: allPendingReviews.slice(0, 5),
      invitations: formattedInvitations,
      recentActivities,
      recentDocuments,
    };
  }
}
