import { prisma } from '../config/db';
import { SpecificationService } from './specificationService';
import { FilingIssueService } from './filingIssueService';
import { ClaimValidationService } from './claimValidationService';

export interface NextActionItem {
  title: string;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  stage: string;
  actionType: string;
  route: string;
  progress: number;
  blockedBy: string[];
  metadata?: Record<string, any>;
}

export interface NextActionResponse {
  primaryAction: NextActionItem;
  secondaryActions: NextActionItem[];
  progressPercentage: number;
  stageBreakdown?: {
    define: number;
    research: number;
    draft: number;
    review: number;
    filing: number;
  };
}

export class NextActionService {
  /**
   * Authoritatively and dynamically evaluates the live project state from the database
   * to determine the single primary next action, respecting blockers, lifecycle stage,
   * and user role/permissions.
   */
  static async determineNextAction(
    projectId: string,
    userContext?: { id?: string; userId?: string; role?: string | { name: string } }
  ): Promise<NextActionResponse> {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, fullName: true, username: true, email: true, institution: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, email: true, role: true } },
          },
        },
        applicants: true,
        inventors: true,
        specifications: { where: { isCurrent: true } },
        patentClaims: { orderBy: { claimNumber: 'asc' } },
        patentReferences: true,
        patentForms: true,
        projectReviews: { orderBy: { createdAt: 'desc' }, include: { reviewer: true } },
        drawingFigures: true,
        deadlines: { orderBy: { dueDate: 'asc' } },
        tasks: { where: { status: { in: ['TODO', 'IN_PROGRESS'] } }, orderBy: { priority: 'desc' } },
        aiAnalyses: { orderBy: { createdAt: 'desc' } },
        filingEvents: { orderBy: { filingDate: 'desc' } },
        prototypes: true,
        claimCharts: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Resolve active user context
    const currentUserId = userContext?.userId || userContext?.id;
    const rawUserRole = userContext?.role;
    const userGlobalRole = typeof rawUserRole === 'object' ? rawUserRole?.name : rawUserRole;

    const isOwner = !!(
      (currentUserId && project.ownerId === currentUserId) ||
      userGlobalRole === 'Admin' ||
      userGlobalRole === 'ADMIN'
    );

    const memberRecord = project.members.find(
      (m) => m.userId === currentUserId || m.user?.id === currentUserId
    );

    const userProjectRole: string =
      memberRecord?.role ||
      (isOwner
        ? 'INVENTOR'
        : userGlobalRole === 'Guide' || userGlobalRole === 'GUIDE'
        ? 'GUIDE'
        : userGlobalRole === 'PatentExpert' || userGlobalRole === 'Patent Expert' || userGlobalRole === 'PATENT_EXPERT'
        ? 'PATENT_EXPERT'
        : 'INVENTOR');

    const permissionLevel: 'VIEW' | 'EDIT' | 'SUBMIT' = isOwner
      ? 'SUBMIT'
      : (memberRecord?.permissionLevel as any) || 'EDIT';

    const canEdit = isOwner || permissionLevel === 'EDIT' || permissionLevel === 'SUBMIT';
    const canSubmit = isOwner || permissionLevel === 'SUBMIT';
    const isViewOnly = !isOwner && permissionLevel === 'VIEW';

    // Extract core artifacts
    const currentSpec = project.specifications[0];
    const specCompleteness = SpecificationService.calculateCompleteness(currentSpec);
    const independentClaim = project.patentClaims.find((c) => c.claimType === 'INDEPENDENT');
    const latestReview = project.projectReviews[0];
    const latestGuideReview = project.projectReviews.find((r) => r.reviewType === 'GUIDE_REVIEW');
    const latestExpertReview = project.projectReviews.find((r) => r.reviewType === 'EXPERT_REVIEW');
    const latestFilingEvent = project.filingEvents[0];

    // Compute unified progress across the 5 project quadrants
    // 1. Define
    let definePoints = 0;
    if (project.title && project.title.trim().length >= 5) definePoints += 30;
    if (project.problemStatement && project.proposedSolution) definePoints += 30;
    if (project.applicants.length > 0) definePoints += 20;
    if (project.inventors.length > 0) definePoints += 20;

    // 2. Research
    let researchPoints = 0;
    if (project.patentReferences.length >= 1) researchPoints += 35;
    if (project.patentReferences.length >= 3) researchPoints += 35;
    if (project.aiAnalyses.length >= 1) researchPoints += 30;

    // 3. Draft (Specification 11 sections, claims, drawings)
    let draftPoints = 0;
    draftPoints += Math.round((specCompleteness.completedCount / 11) * 45);
    if (independentClaim) draftPoints += 30;
    if (project.patentClaims.length >= 3) draftPoints += 10;
    if (project.drawingFigures.length > 0 || project.patentCategory === 'PROCESS') draftPoints += 15;

    // 4. Review
    let reviewPoints = 0;
    if (latestGuideReview?.decision === 'APPROVED' && latestExpertReview?.decision === 'APPROVED') {
      reviewPoints = 100;
    } else if (latestGuideReview?.decision === 'APPROVED') {
      reviewPoints = 65;
    } else if (project.stage === 'GUIDE_REVIEW' || project.stage === 'PATENT_EXPERT_REVIEW') {
      reviewPoints = 35;
    } else if (latestReview?.decision === 'CHANGES_REQUESTED') {
      reviewPoints = 25;
    }

    // 5. Filing
    let filingPoints = 0;
    if (project.stage === 'FILED' || project.filingEvents.length > 0) {
      filingPoints = 100;
    } else if (project.stage === 'FILING_READY') {
      filingPoints = 85;
    } else if (definePoints >= 80 && draftPoints >= 70 && reviewPoints >= 65) {
      filingPoints = 50;
    }

    const overallProgress = Math.min(
      100,
      Math.round(
        definePoints * 0.2 +
          researchPoints * 0.2 +
          draftPoints * 0.3 +
          reviewPoints * 0.15 +
          filingPoints * 0.15
      )
    );

    const stageBreakdown = {
      define: Math.min(100, definePoints),
      research: Math.min(100, researchPoints),
      draft: Math.min(100, draftPoints),
      review: Math.min(100, reviewPoints),
      filing: Math.min(100, filingPoints),
    };

    const actionPool: NextActionItem[] = [];

    // =========================================================================
    // STATE EVALUATION & BLOCKER PIPELINE (Strict Priority Ordering)
    // =========================================================================

    // --- 1. OVERDUE STATUTORY DEADLINES (CRITICAL) ---
    const overdueDeadline = project.deadlines.find((d) => d.status === 'OVERDUE');
    if (overdueDeadline) {
      actionPool.push({
        title: `Overdue Deadline: ${overdueDeadline.deadlineType.replace(/_/g, ' ')}`,
        reason: overdueDeadline.description || 'A mandatory statutory Indian patent deadline is past due and requires immediate response.',
        priority: 'CRITICAL',
        stage: 'FILING_READY',
        actionType: 'RESOLVE_OVERDUE_DEADLINE',
        route: `/projects/${projectId}?tab=Forms%20%26%20Filing`,
        progress: overallProgress,
        blockedBy: [],
      });
    }

    // --- 2. CHANGES REQUESTED IN REVIEWS (Overrides normal downstream steps) ---
    const isExpertChangesRequested =
      latestExpertReview?.decision === 'CHANGES_REQUESTED' ||
      (latestReview?.decision === 'CHANGES_REQUESTED' && latestReview.reviewType === 'EXPERT_REVIEW') ||
      project.stage === 'CHANGES_REQUESTED';

    const isGuideChangesRequested =
      latestGuideReview?.decision === 'CHANGES_REQUESTED' ||
      (latestReview?.decision === 'CHANGES_REQUESTED' && latestReview.reviewType === 'GUIDE_REVIEW');

    if (isExpertChangesRequested) {
      if (userProjectRole === 'PATENT_EXPERT') {
        actionPool.push({
          title: 'Awaiting Inventor Revisions for Legal Clearance',
          reason: 'You requested amendments on claims or statutory pre-checks. Awaiting inventor resubmission.',
          priority: 'MEDIUM',
          stage: 'EXPERT_REVIEW',
          actionType: 'AWAIT_INVENTOR_REVISIONS',
          route: `/projects/${projectId}/reviews`,
          progress: overallProgress,
          blockedBy: [],
        });
      } else {
        actionPool.push({
          title: 'Resolve Patent Expert Review Changes',
          reason: latestExpertReview?.comments
            ? `Patent Attorney requested revisions: "${latestExpertReview.comments.slice(0, 100)}..."`
            : 'Patent Expert requested statutory claims and documentation amendments before legal filing sign-off.',
          priority: 'CRITICAL',
          stage: 'EXPERT_REVIEW',
          actionType: 'RESOLVE_EXPERT_CHANGES',
          route: `/projects/${projectId}/reviews`,
          progress: overallProgress,
          blockedBy: [],
        });
      }
    } else if (isGuideChangesRequested) {
      if (userProjectRole === 'GUIDE') {
        actionPool.push({
          title: 'Awaiting Inventor Revisions for Academic Endorsement',
          reason: 'You requested revisions on project specifications or novelty. Awaiting inventor resubmission.',
          priority: 'MEDIUM',
          stage: 'GUIDE_REVIEW',
          actionType: 'AWAIT_INVENTOR_REVISIONS',
          route: `/projects/${projectId}/reviews`,
          progress: overallProgress,
          blockedBy: [],
        });
      } else {
        actionPool.push({
          title: 'Address Guide Review Changes',
          reason: latestGuideReview?.comments
            ? `Faculty Guide requested revisions: "${latestGuideReview.comments.slice(0, 100)}..."`
            : 'Faculty Guide requested improvements on technical disclosure or novelty before endorsement.',
          priority: 'CRITICAL',
          stage: 'GUIDE_REVIEW',
          actionType: 'ADDRESS_GUIDE_CHANGES',
          route: `/projects/${projectId}/reviews`,
          progress: overallProgress,
          blockedBy: [],
        });
      }
    }

    // --- 3. FILED PROJECT STATE ---
    if (project.stage === 'FILED' || latestFilingEvent) {
      actionPool.push({
        title: 'View Filing Record & Docketing Details',
        reason: latestFilingEvent?.cbrNumber
          ? `Application registered with Indian Patent Office (CBR: ${latestFilingEvent.cbrNumber}).`
          : 'Patent application has been officially lodged. View statutory receipt, timeline, and examination deadlines.',
        priority: 'LOW',
        stage: 'FILED',
        actionType: 'VIEW_FILING_RECORD',
        route: `/projects/${projectId}?tab=Forms%20%26%20Filing`,
        progress: 100,
        blockedBy: [],
        metadata: {
          applicationNumber: latestFilingEvent?.applicationNumber,
          cbrNumber: latestFilingEvent?.cbrNumber,
          filingDate: latestFilingEvent?.filingDate,
        },
      });
    }

    // --- 4. ROLE-SPECIFIC PENDING REVIEWS ---
    if (project.stage === 'GUIDE_REVIEW') {
      if (userProjectRole === 'GUIDE' || userGlobalRole === 'Admin') {
        actionPool.push({
          title: `Review Patent Project: "${project.title}"`,
          reason: 'Inventor has submitted complete invention disclosures. Evaluate academic merit, novelty, and rubric scores.',
          priority: 'HIGH',
          stage: 'GUIDE_REVIEW',
          actionType: 'EVALUATE_GUIDE_REVIEW',
          route: `/projects/${projectId}/reviews`,
          progress: overallProgress,
          blockedBy: [],
        });
      } else {
        actionPool.push({
          title: 'Await Faculty Guide Review',
          reason: 'Your patent documentation is currently under evaluation by the assigned Faculty Guide.',
          priority: 'MEDIUM',
          stage: 'GUIDE_REVIEW',
          actionType: 'AWAIT_GUIDE_REVIEW',
          route: `/projects/${projectId}/reviews`,
          progress: overallProgress,
          blockedBy: [],
        });
      }
    }

    if (project.stage === 'PATENT_EXPERT_REVIEW') {
      if (userProjectRole === 'PATENT_EXPERT' || userGlobalRole === 'PatentExpert' || userGlobalRole === 'Admin') {
        actionPool.push({
          title: `Conduct Legal Claims & Filing Clearance: "${project.title}"`,
          reason: 'Faculty Guide endorsed this project. Conduct legal claims structure pre-check and IPO statutory compliance audit.',
          priority: 'HIGH',
          stage: 'EXPERT_REVIEW',
          actionType: 'EVALUATE_EXPERT_REVIEW',
          route: `/projects/${projectId}/reviews`,
          progress: overallProgress,
          blockedBy: [],
        });

        // FTO Review
        if (project.patentReferences.length > 0 && (!project.claimCharts || project.claimCharts.length === 0)) {
          actionPool.push({
            title: `Conduct FTO Overlap Analysis: "${project.title}"`,
            reason: 'Generate preliminary FTO claim charts against saved patent references to assess technical overlap.',
            priority: 'HIGH',
            stage: 'EXPERT_REVIEW',
            actionType: 'REVIEW_FTO',
            route: `/projects/${projectId}?tab=FTO%20Analysis`,
            progress: overallProgress,
            blockedBy: [],
          });
        }

        // Claims Review
        if (project.patentClaims && project.patentClaims.length > 0) {
          actionPool.push({
            title: `Audit Claims Engineering & Structure: "${project.title}"`,
            reason: 'Audit claim hierarchy, independent/dependent claims, antecedent basis, and technical scope.',
            priority: 'HIGH',
            stage: 'EXPERT_REVIEW',
            actionType: 'REVIEW_CLAIMS',
            route: `/projects/${projectId}?tab=Claims%20Studio`,
            progress: overallProgress,
            blockedBy: [],
          });
        }

        // Specification Review
        if (currentSpec && specCompleteness.completedCount >= 8) {
          actionPool.push({
            title: `Review Form 2 Specification Disclosure: "${project.title}"`,
            reason: 'Inspect statutory Form 2 description, abstract, and drawings for statutory enabling disclosure.',
            priority: 'MEDIUM',
            stage: 'EXPERT_REVIEW',
            actionType: 'REVIEW_SPECIFICATION',
            route: `/projects/${projectId}?tab=Specification`,
            progress: overallProgress,
            blockedBy: [],
          });
        }
      } else {
        actionPool.push({
          title: 'Await Patent Expert Legal Clearance',
          reason: 'Invention dossier is awaiting legal claims verification and Form 1-5 compliance clearance from the Patent Expert.',
          priority: 'MEDIUM',
          stage: 'EXPERT_REVIEW',
          actionType: 'AWAIT_EXPERT_REVIEW',
          route: `/projects/${projectId}/reviews`,
          progress: overallProgress,
          blockedBy: [],
        });
      }
    }

    // --- 5. CO-INVENTOR SPECIFIC TASKS & VIEW-ONLY HANDLING ---
    if (userProjectRole === 'CO_INVENTOR') {
      const assignedTask = project.tasks.find((t) => t.assignedToId === currentUserId && t.status !== 'COMPLETED');
      if (assignedTask) {
        actionPool.push({
          title: `Complete Assigned Task: ${assignedTask.title}`,
          reason: assignedTask.description || 'You have an active collaborator action item assigned on this project.',
          priority: 'HIGH',
          stage: 'IDEA',
          actionType: 'COMPLETE_ASSIGNED_TASK',
          route: `/projects/${projectId}?tab=Tasks`,
          progress: overallProgress,
          blockedBy: [],
        });
      }

      if (isViewOnly) {
        actionPool.push({
          title: 'Inspect Project Progress & Claims',
          reason: 'You have VIEW permissions on this project. Inspect technical specifications, claims, and review status.',
          priority: 'LOW',
          stage: project.stage,
          actionType: 'VIEW_PROJECT_STATUS',
          route: `/projects/${projectId}?tab=Overview`,
          progress: overallProgress,
          blockedBy: [],
        });
      }
    }

    // --- 6. CORE INVENTION DETAILS (STATE 1 & STATE 2) ---
    const hasValidTitle = project.title && project.title.trim().length >= 5;
    const hasCoreDetails =
      hasValidTitle &&
      project.problemStatement &&
      project.problemStatement.trim().length > 10 &&
      project.proposedSolution &&
      project.proposedSolution.trim().length > 10 &&
      project.technicalDomain &&
      project.technicalDomain.trim().length > 1;

    if (!hasCoreDetails) {
      actionPool.push({
        title: 'Complete Innovation Details',
        reason: 'Define the core problem statement, proposed technical solution, and domain classification before prior-art research.',
        priority: 'HIGH',
        stage: 'IDEA',
        actionType: 'COMPLETE_INNOVATION_DETAILS',
        route: `/projects/${projectId}?tab=Innovation%20Details`,
        progress: overallProgress,
        blockedBy: [],
      });
    }

    // --- 7. PRIOR-ART RESEARCH (STATE 3 & STATE 4) ---
    if (hasCoreDetails && project.patentReferences.length === 0) {
      actionPool.push({
        title: 'Start Prior-Art Research',
        reason: 'Search prior-art databases and literature to evaluate technical similarity and identify distinguishing features.',
        priority: 'HIGH',
        stage: 'RESEARCH',
        actionType: 'START_PRIOR_ART_RESEARCH',
        route: `/projects/${projectId}?tab=Prior%20Art%20Search`,
        progress: overallProgress,
        blockedBy: [],
      });
    } else if (hasCoreDetails && project.patentReferences.length < 3) {
      actionPool.push({
        title: `Review Prior-Art Research (${project.patentReferences.length}/3 Citations)`,
        reason: 'Save at least 3 relevant patent citations to ensure sufficient research coverage and technical similarity evidence.',
        priority: 'HIGH',
        stage: 'RESEARCH',
        actionType: 'REVIEW_PRIOR_ART_RESEARCH',
        route: `/projects/${projectId}?tab=Prior%20Art%20Search`,
        progress: overallProgress,
        blockedBy: [],
      });
    }

    // --- 8. INNOVATION AI ANALYSIS (STATE 5) ---
    if (hasCoreDetails && project.patentReferences.length >= 3 && project.aiAnalyses.length === 0) {
      actionPool.push({
        title: 'Run Innovation Analysis',
        reason: 'Execute AI-assisted technical similarity scan to assess feature overlap against saved patent references.',
        priority: 'HIGH',
        stage: 'RESEARCH',
        actionType: 'RUN_INNOVATION_ANALYSIS',
        route: `/projects/${projectId}?tab=Prior%20Art%20Search`,
        progress: overallProgress,
        blockedBy: [],
      });
    }

    // --- 9. PROTOTYPE / TECHNICAL DRAWINGS (STATE 6) ---
    const requiresDrawings = project.patentCategory !== 'PROCESS';
    if (hasCoreDetails && requiresDrawings && project.drawingFigures.length === 0 && project.prototypes.length === 0) {
      actionPool.push({
        title: 'Add Prototype or Technical Drawings',
        reason: 'Apparatus and system inventions under the Indian Patent Act require illustrative figures for all claim elements.',
        priority: 'HIGH',
        stage: 'PROTOTYPE',
        actionType: 'ADD_PROTOTYPE_OR_DRAWINGS',
        route: `/projects/${projectId}?tab=Drawings`,
        progress: overallProgress,
        blockedBy: [],
      });
    }

    // --- 10. SPECIFICATION DRAFTING (STATE 7 & STATE 8) ---
    if (hasCoreDetails && (!currentSpec || specCompleteness.completedCount < 11)) {
      actionPool.push({
        title: 'Complete Patent Specification',
        reason: currentSpec
          ? `${specCompleteness.completedCount} of 11 specification sections are complete. Complete all statutory sections.`
          : 'Draft the 11 statutory specification sections (Abstract, Background, Detailed Description, etc.).',
        priority: 'HIGH',
        stage: 'DOCUMENTATION',
        actionType: 'COMPLETE_SPECIFICATION',
        route: `/projects/${projectId}?tab=Specification`,
        progress: overallProgress,
        blockedBy: [],
        metadata: {
          completedSections: specCompleteness.completedCount,
          totalSections: 11,
          percentage: specCompleteness.percentage,
        },
      });
    }

    // --- 11. CLAIMS FORMULATION & STRUCTURE (STATE 8 & STATE 9) ---
    if (hasCoreDetails && specCompleteness.completedCount >= 5) {
      if (project.patentClaims.length === 0) {
        actionPool.push({
          title: 'Create Patent Claims',
          reason: 'Your specification has sufficient foundation. Formulate your primary independent claim defining the novel subject matter.',
          priority: 'HIGH',
          stage: 'DOCUMENTATION',
          actionType: 'CREATE_PATENT_CLAIMS',
          route: `/projects/${projectId}?tab=Claims%20Studio`,
          progress: overallProgress,
          blockedBy: specCompleteness.completedCount < 5 ? ['Incomplete specification'] : [],
        });
      } else if (!independentClaim) {
        actionPool.push({
          title: 'Draft Independent Claim (Claim 1)',
          reason: 'A patent application must contain at least one independent claim defining the novel technical apparatus or method.',
          priority: 'HIGH',
          stage: 'DOCUMENTATION',
          actionType: 'DRAFT_INDEPENDENT_CLAIM',
          route: `/projects/${projectId}?tab=Claims%20Studio`,
          progress: overallProgress,
          blockedBy: [],
        });
      } else {
        // Validate independent claim structure
        const claimValidation = ClaimValidationService.validateAntecedents(independentClaim);
        const hasClaimErrors = claimValidation.issues.length > 0;
        if (hasClaimErrors) {
          actionPool.push({
            title: 'Resolve Claim Structure Issues',
            reason: claimValidation.issues[0]?.message || 'Claim 1 has antecedent basis or structural issues that must be resolved.',
            priority: 'HIGH',
            stage: 'DOCUMENTATION',
            actionType: 'RESOLVE_CLAIM_STRUCTURE_ISSUES',
            route: `/projects/${projectId}?tab=Claims%20Studio`,
            progress: overallProgress,
            blockedBy: [],
          });
        } else if (project.patentClaims.length === 1) {
          actionPool.push({
            title: 'Add Dependent Claims for Technical Fallback',
            reason: 'Adding dependent claims narrows specific novel sub-features (e.g. materials, circuitry, operating ranges).',
            priority: 'MEDIUM',
            stage: 'DOCUMENTATION',
            actionType: 'ADD_DEPENDENT_CLAIMS',
            route: `/projects/${projectId}?tab=Claims%20Studio`,
            progress: overallProgress,
            blockedBy: [],
          });
        }
      }
    }

    // --- 12. LEGAL APPLICANTS & INVENTORS (STATE 10) ---
    const independentClaimValid = independentClaim && ClaimValidationService.validateAntecedents(independentClaim).issues.length === 0;
    if (hasCoreDetails && specCompleteness.completedCount >= 8 && independentClaimValid) {
      if (project.applicants.length === 0) {
        actionPool.push({
          title: 'Complete Legal Applicant Information',
          reason: 'Your specification is complete, but applicant legal entity details are required for statutory Form 1 preparation.',
          priority: 'HIGH',
          stage: 'FORMS',
          actionType: 'COMPLETE_APPLICANT_INFORMATION',
          route: `/projects/${projectId}?tab=Innovation%20Details`,
          progress: overallProgress,
          blockedBy: [],
        });
      }

      if (project.inventors.length === 0) {
        actionPool.push({
          title: 'Complete Legal Inventor Information',
          reason: 'Indian patent declaration of inventorship (Form 5) requires named inventors with address, nationality, and consent.',
          priority: 'HIGH',
          stage: 'FORMS',
          actionType: 'COMPLETE_INVENTOR_INFORMATION',
          route: `/projects/${projectId}?tab=Innovation%20Details`,
          progress: overallProgress,
          blockedBy: [],
        });
      }
    }

    // --- 13. STATUTORY FORMS & FILING READINESS (STATE 11 & STATE 16) ---
    if (hasCoreDetails && specCompleteness.completedCount >= 10 && independentClaim && project.applicants.length > 0 && project.inventors.length > 0) {
      try {
        const readiness = await FilingIssueService.assessFilingReadiness(projectId);
        const formIssues = (readiness.issues || []).filter(
          (i) => i.category !== 'REVIEWS' && i.category !== 'DEADLINES'
        );
        if (formIssues.length > 0) {
          const topIssue = formIssues[0];
          actionPool.push({
            title: 'Resolve Filing Readiness Issues',
            reason: `${topIssue.title}: ${topIssue.description}`,
            priority: topIssue.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            stage: 'FORMS',
            actionType: 'RESOLVE_FILING_READINESS_ISSUES',
            route: topIssue.route || `/projects/${projectId}?tab=Forms%20%26%20Filing`,
            progress: readiness.overallScore,
            blockedBy: [],
            metadata: {
              issueId: topIssue.id,
              category: topIssue.category,
              totalIssues: formIssues.length,
            },
          });
        }
      } catch {
        // Fallback gracefully
      }
    }

    // --- 14. SUBMISSION FOR GUIDE / EXPERT REVIEW (STATE 12 & 14) ---
    const isReadyForGuideSubmission =
      hasCoreDetails &&
      specCompleteness.completedCount >= 8 &&
      independentClaim &&
      (project.stage === 'IDEA' ||
        project.stage === 'INNOVATION_DETAILS' ||
        project.stage === 'LITERATURE_REVIEW' ||
        project.stage === 'PRIOR_ART_ANALYSIS' ||
        project.stage === 'DOCUMENTATION' ||
        project.stage === 'FORMS_PREPARATION');

    if (isReadyForGuideSubmission && canSubmit) {
      actionPool.push({
        title: 'Submit Project for Faculty Guide Review',
        reason: 'Your specification, claims, and prior-art documentation are ready for academic supervisor evaluation.',
        priority: 'HIGH',
        stage: 'FORMS',
        actionType: 'SUBMIT_FOR_GUIDE_REVIEW',
        route: `/projects/${projectId}/reviews`,
        progress: overallProgress,
        blockedBy: [],
      });
    }

    // --- 15. FILING READY PACKAGE (STATE 17) ---
    const isAlreadyFiled = project.stage === 'FILED' || !!latestFilingEvent;
    if (!isAlreadyFiled && (project.stage === 'FILING_READY' || (latestGuideReview?.decision === 'APPROVED' && latestExpertReview?.decision === 'APPROVED'))) {
      actionPool.push({
        title: 'Prepare Filing Package & Generate Statutory Forms',
        reason: 'All substantive supervisor and legal reviews are approved. Review pre-filled IPO Forms 1, 2, 3, 5 and download Master Dossier.',
        priority: 'HIGH',
        stage: 'FILING_READY',
        actionType: 'PREPARE_FILING_PACKAGE',
        route: `/projects/${projectId}?tab=Forms%20%26%20Filing`,
        progress: 95,
        blockedBy: [],
      });
    }

    // --- 16. UPCOMING DEADLINES ---
    const approachingDeadline = project.deadlines.find((d) => d.status === 'APPROACHING');
    if (approachingDeadline) {
      actionPool.push({
        title: `Approaching Deadline: ${approachingDeadline.deadlineType.replace(/_/g, ' ')}`,
        reason: approachingDeadline.description || 'Upcoming statutory Indian patent filing milestone approaching in 30 days.',
        priority: 'HIGH',
        stage: project.stage,
        actionType: 'PREPARE_DEADLINE_MILESTONE',
        route: `/projects/${projectId}?tab=Forms%20%26%20Filing`,
        progress: overallProgress,
        blockedBy: [],
      });
    }

    // --- 17. ACTIVE PROJECT TASKS ---
    const topTask = project.tasks[0];
    if (topTask) {
      actionPool.push({
        title: `Complete Project Task: ${topTask.title}`,
        reason: topTask.description || 'Active assigned task awaiting milestone completion.',
        priority: (topTask.priority as any) || 'MEDIUM',
        stage: project.stage,
        actionType: 'COMPLETE_TASK',
        route: `/projects/${projectId}?tab=Tasks`,
        progress: overallProgress,
        blockedBy: [],
      });
    }

    // Priority weights
    const priorityWeights: Record<string, number> = {
      CRITICAL: 400,
      HIGH: 300,
      MEDIUM: 200,
      LOW: 100,
    };

    // Stage sequence ranks for deterministic, lifecycle-accurate ordering
    const stageSequenceRank: Record<string, number> = {
      IDEA: 10,
      RESEARCH: 20,
      PROTOTYPE: 30,
      DOCUMENTATION: 40,
      FORMS: 50,
      GUIDE_REVIEW: 60,
      EXPERT_REVIEW: 70,
      FILING_READY: 80,
      FILED: 90,
    };

    // Strict multi-tier sort: Priority first, then Stage sequence
    actionPool.sort((a, b) => {
      const pDiff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return (stageSequenceRank[a.stage] || 50) - (stageSequenceRank[b.stage] || 50);
    });

    // Select primary and secondary actions
    const primaryAction: NextActionItem =
      actionPool[0] || {
        title: 'Project Workflow Up to Date',
        reason: 'All current patent journey requirements are satisfied. Monitor milestone progress or review audit timeline.',
        priority: 'LOW',
        stage: project.stage,
        actionType: 'ALL_CAUGHT_UP',
        route: `/projects/${projectId}?tab=Overview`,
        progress: overallProgress,
        blockedBy: [],
      };

    const secondaryActions = actionPool.slice(1, 4);

    return {
      primaryAction,
      secondaryActions,
      progressPercentage: overallProgress,
      stageBreakdown,
    };
  }

  /**
   * Retrieves the highest priority next action across all active projects owned by or assigned to a user.
   * Perfect for multi-project dashboard widgets.
   */
  static async getUserPrimaryNextAction(userId: string): Promise<{ project: any; nextAction: NextActionResponse } | null> {
    const userProjects = await prisma.patentProject.findMany({
      where: {
        isArchived: false,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      select: { id: true, title: true, stage: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    if (userProjects.length === 0) {
      return null;
    }

    let topActionCandidate: { project: any; nextAction: NextActionResponse } | null = null;
    let highestWeight = -1;

    const priorityWeights: Record<string, number> = {
      CRITICAL: 400,
      HIGH: 300,
      MEDIUM: 200,
      LOW: 100,
    };

    for (const proj of userProjects) {
      try {
        const nextAction = await NextActionService.determineNextAction(proj.id, { userId });
        const weight = priorityWeights[nextAction.primaryAction.priority] || 0;
        if (weight > highestWeight) {
          highestWeight = weight;
          topActionCandidate = { project: proj, nextAction };
        }
      } catch {
        // continue
      }
    }

    return topActionCandidate;
  }
}
