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
        if ((data.decision === 'REJECTED' || data.decision === 'CHANGES_REQUESTED') && (!data.comments || !data.comments.trim())) {
            throw new Error(`A written reason is required when selecting ${data.decision.replace(/_/g, ' ').toLowerCase()}.`);
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
        // 3b. Also register into project comments for seamless audit trail
        if (data.comments && data.comments.trim()) {
            try {
                await db_1.prisma.comment.create({
                    data: {
                        projectId,
                        userId: reviewer.userId || reviewer.id,
                        content: `[${data.reviewType === 'EXPERT_REVIEW' ? 'Patent Expert Review' : 'Guide Review'}: ${data.decision.replace(/_/g, ' ')}] ${data.comments.trim()}`
                    }
                });
            }
            catch (e) {
                // Non-blocking
            }
        }
        // 4. Update project stage if changed
        if (nextStage !== project.stage) {
            await db_1.prisma.patentProject.update({
                where: { id: projectId },
                data: { stage: nextStage }
            });
        }
        // 5. Activity log & Notifications
        const reviewerName = reviewer.fullName || reviewer.username || 'Reviewer';
        let activityAction = `${reviewerName} logged ${data.reviewType} decision: ${data.decision}. Workflow stage set to ${nextStage}.`;
        if (data.decision === 'CHANGES_REQUESTED') {
            activityAction = `${reviewerName} requested changes.`;
        }
        else if (data.decision === 'APPROVED') {
            activityAction = `${reviewerName} approved the project (${data.reviewType === 'EXPERT_REVIEW' ? 'Patent Expert Review' : 'Guide Review'}).`;
        }
        else if (data.decision === 'REJECTED') {
            activityAction = `${reviewerName} rejected the review for the project.`;
        }
        await db_1.prisma.activityLog.create({
            data: {
                userId: reviewer.userId || reviewer.id,
                projectId,
                action: activityAction,
                type: 'REVIEW'
            }
        });
        try {
            const notifTitle = data.decision === 'CHANGES_REQUESTED'
                ? 'Changes Requested on Project'
                : data.decision === 'APPROVED'
                    ? 'Project Review Approved'
                    : 'Project Review Rejected';
            const notifMsg = data.decision === 'CHANGES_REQUESTED'
                ? `${reviewerName} requested changes for "${project.title}": ${data.comments?.trim() || 'Please review feedback.'}`
                : data.decision === 'APPROVED'
                    ? `${reviewerName} approved "${project.title}". Workflow stage is now ${nextStage}.`
                    : `${reviewerName} rejected review for "${project.title}": ${data.comments?.trim() || ''}`;
            const membersToNotify = project.members.filter(m => m.userId !== (reviewer.userId || reviewer.id));
            const notificationPromises = membersToNotify.map(m => db_1.prisma.notification.create({
                data: {
                    userId: m.userId,
                    projectId,
                    title: notifTitle,
                    message: notifMsg,
                    type: 'REVIEW',
                    referenceId: projectId
                }
            }));
            if (project.ownerId !== (reviewer.userId || reviewer.id)) {
                notificationPromises.push(db_1.prisma.notification.create({
                    data: {
                        userId: project.ownerId,
                        projectId,
                        title: notifTitle,
                        message: notifMsg,
                        type: 'REVIEW',
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
