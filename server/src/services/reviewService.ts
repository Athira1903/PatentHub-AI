import { prisma } from '../config/db';
import { ProjectReview } from '@prisma/client';
import { ReviewPolicy } from '../policies/review/review.policy';
import { WorkflowPolicy } from '../policies/workflow/workflow.policy';

export class ReviewService {
  /**
   * Submit a formal review decision for a project.
   */
  static async submitReviewDecision(
    projectId: string,
    reviewer: any,
    data: {
      reviewType: 'GUIDE_REVIEW' | 'EXPERT_REVIEW';
      decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
      comments?: string;
      checklistSnapshot?: any;
    }
  ): Promise<ProjectReview> {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: {
        members: { include: { user: true } },
        documents: true,
        owner: true
      }
    });

    if (!project) {
      throw new Error('Patent project not found.');
    }

    // 1. Authorization checks
    if (!ReviewPolicy.canReview(reviewer, project)) {
      throw new Error('Unauthorized. You are not an assigned reviewer for this project.');
    }

    if (data.decision === 'APPROVED') {
      if (!ReviewPolicy.canApprove(reviewer, project)) {
        throw new Error('Approval denied. Review approval conditions or mandatory forms (Form 1, 2, 3, 5) are incomplete.');
      }
    } else if (data.decision === 'REJECTED' || data.decision === 'CHANGES_REQUESTED') {
      if (!ReviewPolicy.canReject(reviewer, project)) {
        throw new Error('Rejection denied. You are not authorized to request changes on this project.');
      }
    }

    // 2. Stage Transition Calculation
    let nextStage = project.stage;

    if (data.decision === 'APPROVED') {
      if (project.stage === 'GUIDE_REVIEW') {
        nextStage = 'PATENT_EXPERT_REVIEW';
      } else if (project.stage === 'PATENT_EXPERT_REVIEW') {
        nextStage = 'FILING_READY';
      }
    } else if (data.decision === 'REJECTED' || data.decision === 'CHANGES_REQUESTED') {
      // Return project to DOCUMENTATION stage for corrections
      nextStage = 'DOCUMENTATION';
    }

    // Verify stage transition via WorkflowPolicy
    if (nextStage !== project.stage) {
      const isTransitionAllowed = WorkflowPolicy.isStageTransitionValid(project.stage as any, nextStage as any);
      if (!isTransitionAllowed) {
        throw new Error(`Workflow policy forbids stage transition from ${project.stage} to ${nextStage}.`);
      }
    }

    // 3. Create immutable review record
    const review = await prisma.projectReview.create({
      data: {
        projectId,
        reviewerId: reviewer.userId || reviewer.id,
        reviewType: data.reviewType || (project.stage as any),
        decision: data.decision,
        comments: data.comments?.trim() || null,
        checklistSnapshot: data.checklistSnapshot || null
      },
      include: {
        reviewer: { select: { id: true, fullName: true, username: true, role: true } }
      }
    });

    // 4. Update project stage if changed
    if (nextStage !== project.stage) {
      await prisma.patentProject.update({
        where: { id: projectId },
        data: { stage: nextStage as any }
      });
    }

    // 5. Activity log & Notifications
    await prisma.activityLog.create({
      data: {
        userId: reviewer.userId || reviewer.id,
        projectId,
        action: `Logged ${data.reviewType} decision: ${data.decision}. Workflow stage set to ${nextStage}.`
      }
    });

    try {
      const membersToNotify = project.members.filter(m => m.userId !== (reviewer.userId || reviewer.id));
      const notificationPromises = membersToNotify.map(m =>
        prisma.notification.create({
          data: {
            userId: m.userId,
            title: `Project Review Update (${data.decision})`,
            message: `Reviewer ${reviewer.username || 'Reviewer'} logged ${data.decision} for project "${project.title}". Stage: ${nextStage}.`,
            type: 'STATUS_CHANGE',
            referenceId: projectId
          }
        })
      );

      if (project.ownerId !== (reviewer.userId || reviewer.id)) {
        notificationPromises.push(
          prisma.notification.create({
            data: {
              userId: project.ownerId,
              title: `Project Review Decision: ${data.decision}`,
              message: `Reviewer logged ${data.decision} for your project "${project.title}". Workflow stage is now ${nextStage}.`,
              type: 'STATUS_CHANGE',
              referenceId: projectId
            }
          })
        );
      }

      await Promise.all(notificationPromises);
    } catch (e) {
      // Ignore notification persistence failures in mock/test environments
    }

    return review;
  }

  /**
   * Retrieves all formal review decision logs for a project.
   */
  static async getProjectReviews(projectId: string): Promise<ProjectReview[]> {
    return prisma.projectReview.findMany({
      where: { projectId },
      include: {
        reviewer: { select: { id: true, fullName: true, username: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Retrieves a single review decision record by ID.
   */
  static async getReviewById(projectId: string, reviewId: string): Promise<ProjectReview> {
    const review = await prisma.projectReview.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: { select: { id: true, fullName: true, username: true, role: true } }
      }
    });

    if (!review || review.projectId !== projectId) {
      throw new Error('Project review record not found.');
    }

    return review;
  }
}
