"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const db_1 = require("../config/db");
const review_policy_1 = require("../policies/review/review.policy");
const workflow_policy_1 = require("../policies/workflow/workflow.policy");
class ReviewService {
    /**
     * Submit a formal review decision for a project.
     */
    static async submitReviewDecision(projectId, reviewer, data) {
        const project = await db_1.prisma.patentProject.findUnique({
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
        if (!review_policy_1.ReviewPolicy.canReview(reviewer, project)) {
            throw new Error('Unauthorized. You are not an assigned reviewer for this project.');
        }
        if (data.decision === 'APPROVED') {
            if (!review_policy_1.ReviewPolicy.canApprove(reviewer, project)) {
                throw new Error('Approval denied. Review approval conditions or mandatory forms (Form 1, 2, 3, 5) are incomplete.');
            }
        }
        else if (data.decision === 'REJECTED' || data.decision === 'CHANGES_REQUESTED') {
            if (!review_policy_1.ReviewPolicy.canReject(reviewer, project)) {
                throw new Error('Rejection denied. You are not authorized to request changes on this project.');
            }
        }
        // 2. Stage Transition Calculation
        let nextStage = project.stage;
        if (data.decision === 'APPROVED') {
            if (project.stage === 'GUIDE_REVIEW') {
                nextStage = 'PATENT_EXPERT_REVIEW';
            }
            else if (project.stage === 'PATENT_EXPERT_REVIEW') {
                nextStage = 'FILING_READY';
            }
        }
        else if (data.decision === 'REJECTED' || data.decision === 'CHANGES_REQUESTED') {
            // Return project to DOCUMENTATION stage for corrections
            nextStage = 'DOCUMENTATION';
        }
        // Verify stage transition via WorkflowPolicy
        if (nextStage !== project.stage) {
            const isTransitionAllowed = workflow_policy_1.WorkflowPolicy.isStageTransitionValid(project.stage, nextStage);
            if (!isTransitionAllowed) {
                throw new Error(`Workflow policy forbids stage transition from ${project.stage} to ${nextStage}.`);
            }
        }
        // 3. Create immutable review record
        const review = await db_1.prisma.projectReview.create({
            data: {
                projectId,
                reviewerId: reviewer.userId || reviewer.id,
                reviewType: data.reviewType || project.stage,
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
            await db_1.prisma.patentProject.update({
                where: { id: projectId },
                data: { stage: nextStage }
            });
        }
        // 5. Activity log & Notifications
        await db_1.prisma.activityLog.create({
            data: {
                userId: reviewer.userId || reviewer.id,
                projectId,
                action: `Logged ${data.reviewType} decision: ${data.decision}. Workflow stage set to ${nextStage}.`
            }
        });
        try {
            const membersToNotify = project.members.filter(m => m.userId !== (reviewer.userId || reviewer.id));
            const notificationPromises = membersToNotify.map(m => db_1.prisma.notification.create({
                data: {
                    userId: m.userId,
                    title: `Project Review Update (${data.decision})`,
                    message: `Reviewer ${reviewer.username || 'Reviewer'} logged ${data.decision} for project "${project.title}". Stage: ${nextStage}.`,
                    type: 'STATUS_CHANGE',
                    referenceId: projectId
                }
            }));
            if (project.ownerId !== (reviewer.userId || reviewer.id)) {
                notificationPromises.push(db_1.prisma.notification.create({
                    data: {
                        userId: project.ownerId,
                        title: `Project Review Decision: ${data.decision}`,
                        message: `Reviewer logged ${data.decision} for your project "${project.title}". Workflow stage is now ${nextStage}.`,
                        type: 'STATUS_CHANGE',
                        referenceId: projectId
                    }
                }));
            }
            await Promise.all(notificationPromises);
        }
        catch (e) {
            // Ignore notification persistence failures in mock/test environments
        }
        return review;
    }
    /**
     * Retrieves all formal review decision logs for a project.
     */
    static async getProjectReviews(projectId) {
        return db_1.prisma.projectReview.findMany({
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
    static async getReviewById(projectId, reviewId) {
        const review = await db_1.prisma.projectReview.findUnique({
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
exports.ReviewService = ReviewService;
