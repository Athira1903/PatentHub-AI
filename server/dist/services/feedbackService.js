"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackService = void 0;
const db_1 = require("../config/db");
const feedback_policy_1 = require("../policies/feedback/feedback.policy");
const activityService_1 = require("./activityService");
const notificationService_1 = require("./notificationService");
class FeedbackService {
    /**
     * Submit new Guide feedback on a patent project.
     */
    static async createFeedback(projectId, guideUserId, data) {
        if (!data.comment || !data.comment.trim()) {
            throw new Error('Feedback comment cannot be empty.');
        }
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                owner: true,
                members: { include: { user: true } }
            }
        });
        if (!project) {
            throw new Error('Patent project not found.');
        }
        const guideUser = await db_1.prisma.user.findUnique({
            where: { id: guideUserId },
            include: { role: true }
        });
        if (!guideUser) {
            throw new Error('Guide user account not found.');
        }
        const isAuthorized = feedback_policy_1.FeedbackPolicy.canCreateFeedback(guideUser, project);
        if (!isAuthorized) {
            throw new Error('Access denied. Only assigned Faculty Guides or Administrators can create project feedback.');
        }
        const validTypes = [
            'General Feedback',
            'Idea / Innovation',
            'Prior-Art Search',
            'Claims',
            'Technical Description',
            'Drawings',
            'Documents',
            'Patent Forms',
            'Project Progress',
            'Correction Required'
        ];
        const feedbackType = validTypes.includes(data.feedbackType) ? data.feedbackType : 'General Feedback';
        const priority = data.priority || 'NORMAL';
        const correctionRequested = !!data.correctionRequested;
        const initialStatus = correctionRequested ? 'CORRECTION_REQUESTED' : 'OPEN';
        const feedback = await db_1.prisma.projectFeedback.create({
            data: {
                projectId,
                guideId: guideUserId,
                inventorId: project.ownerId,
                feedbackType,
                priority,
                comment: data.comment.trim(),
                status: initialStatus,
                correctionRequested
            },
            include: {
                guide: { select: { id: true, fullName: true, username: true, email: true, institution: true } },
                inventor: { select: { id: true, fullName: true, username: true, email: true, institution: true } },
                replies: {
                    include: {
                        user: { select: { id: true, fullName: true, username: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        // 1. Audit Log
        await activityService_1.ActivityService.createActivity(projectId, guideUserId, `Guide submitted ${feedbackType} (${priority} priority)${correctionRequested ? ' - Correction Requested' : ''}.`, 'REVIEW', { feedbackId: feedback.id, feedbackType, priority, correctionRequested });
        // 2. Real Notification to Lead Inventor
        if (project.ownerId !== guideUserId) {
            const notifTitle = correctionRequested
                ? `Correction Required: ${project.title}`
                : `Feedback Received: ${project.title}`;
            const notifMsg = `Your Guide ${guideUser.fullName} provided feedback on ${feedbackType}: "${data.comment.trim().substring(0, 100)}${data.comment.trim().length > 100 ? '...' : ''}"`;
            await notificationService_1.NotificationService.createNotification(project.ownerId, notifTitle, notifMsg, 'REVIEW', feedback.id, projectId, {
                feedbackId: feedback.id,
                feedbackType,
                priority,
                correctionRequested,
                tab: 'Reviews'
            });
        }
        return feedback;
    }
    /**
     * Retrieve all feedback threads for a project.
     */
    static async getProjectFeedbacks(projectId, userId) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                owner: true,
                members: { include: { user: true } }
            }
        });
        if (!project) {
            throw new Error('Patent project not found.');
        }
        const requestingUser = await db_1.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });
        if (!feedback_policy_1.FeedbackPolicy.canViewFeedback(requestingUser, project)) {
            throw new Error('Access denied. You do not have permission to view feedback for this project.');
        }
        return db_1.prisma.projectFeedback.findMany({
            where: { projectId },
            include: {
                guide: { select: { id: true, fullName: true, username: true, institution: true } },
                inventor: { select: { id: true, fullName: true, username: true, institution: true } },
                replies: {
                    include: {
                        user: { select: { id: true, fullName: true, username: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Get single feedback thread with replies.
     */
    static async getFeedbackById(projectId, feedbackId, userId) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                owner: true,
                members: { include: { user: true } }
            }
        });
        if (!project) {
            throw new Error('Patent project not found.');
        }
        const requestingUser = await db_1.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });
        if (!feedback_policy_1.FeedbackPolicy.canViewFeedback(requestingUser, project)) {
            throw new Error('Access denied.');
        }
        const feedback = await db_1.prisma.projectFeedback.findUnique({
            where: { id: feedbackId },
            include: {
                guide: { select: { id: true, fullName: true, username: true, institution: true } },
                inventor: { select: { id: true, fullName: true, username: true, institution: true } },
                replies: {
                    include: {
                        user: { select: { id: true, fullName: true, username: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!feedback || feedback.projectId !== projectId) {
            throw new Error('Feedback record not found.');
        }
        return feedback;
    }
    /**
     * Post a reply to a project feedback discussion thread.
     */
    static async addReply(projectId, feedbackId, userId, message) {
        if (!message || !message.trim()) {
            throw new Error('Reply message cannot be empty.');
        }
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                owner: true,
                members: { include: { user: true } }
            }
        });
        if (!project) {
            throw new Error('Patent project not found.');
        }
        const feedback = await db_1.prisma.projectFeedback.findUnique({
            where: { id: feedbackId }
        });
        if (!feedback || feedback.projectId !== projectId) {
            throw new Error('Feedback thread not found.');
        }
        const replyingUser = await db_1.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });
        if (!feedback_policy_1.FeedbackPolicy.canReply(replyingUser, project, feedback)) {
            throw new Error('Access denied. You cannot reply to this feedback thread.');
        }
        const reply = await db_1.prisma.feedbackReply.create({
            data: {
                feedbackId,
                userId,
                message: message.trim()
            },
            include: {
                user: { select: { id: true, fullName: true, username: true } }
            }
        });
        // Touch feedback updatedAt
        await db_1.prisma.projectFeedback.update({
            where: { id: feedbackId },
            data: { updatedAt: new Date() }
        });
        // Log Activity
        await activityService_1.ActivityService.createActivity(projectId, userId, `Replied to feedback on ${feedback.feedbackType}.`, 'REVIEW', { feedbackId, replyId: reply.id });
        // Dispatch notification to the opposite party
        const targetUserId = userId === feedback.guideId ? feedback.inventorId : feedback.guideId;
        if (targetUserId && targetUserId !== userId) {
            await notificationService_1.NotificationService.createNotification(targetUserId, `New Response on ${feedback.feedbackType}: ${project.title}`, `${replyingUser?.fullName || 'Collaborator'} replied: "${message.trim().substring(0, 90)}..."`, 'REVIEW', feedback.id, projectId, { feedbackId: feedback.id, tab: 'Reviews' });
        }
        return reply;
    }
    /**
     * Update feedback status (Resubmit by Inventor, Resolve by Guide, Request Correction).
     */
    static async updateFeedbackStatus(projectId, feedbackId, userId, data) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: {
                owner: true,
                members: { include: { user: true } }
            }
        });
        if (!project) {
            throw new Error('Patent project not found.');
        }
        const feedback = await db_1.prisma.projectFeedback.findUnique({
            where: { id: feedbackId }
        });
        if (!feedback || feedback.projectId !== projectId) {
            throw new Error('Feedback record not found.');
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });
        let nextStatus = feedback.status;
        let nextCorrectionRequested = feedback.correctionRequested;
        if (data.action === 'RESUBMIT') {
            if (!feedback_policy_1.FeedbackPolicy.canResubmit(user, project, feedback)) {
                throw new Error('Only the Inventor or assigned Co-Inventors can resubmit work for review.');
            }
            nextStatus = 'RESUBMITTED';
            nextCorrectionRequested = false;
            // Add reply note if provided
            if (data.note?.trim()) {
                await db_1.prisma.feedbackReply.create({
                    data: {
                        feedbackId,
                        userId,
                        message: `[Resubmitted Work for Review]: ${data.note.trim()}`
                    }
                });
            }
            // Notify Guide
            await notificationService_1.NotificationService.createNotification(feedback.guideId, `Work Resubmitted: ${project.title}`, `Inventor ${user?.fullName || ''} has addressed feedback on ${feedback.feedbackType} and resubmitted for your review.`, 'REVIEW', feedback.id, projectId, { feedbackId: feedback.id, tab: 'Reviews' });
            await activityService_1.ActivityService.createActivity(projectId, userId, `Resubmitted work for feedback on ${feedback.feedbackType}.`, 'REVIEW', { feedbackId, action: 'RESUBMIT' });
        }
        else if (data.action === 'RESOLVE') {
            if (!feedback_policy_1.FeedbackPolicy.canResolve(user, project, feedback)) {
                throw new Error('Only the assigned Guide or Administrator can resolve feedback.');
            }
            nextStatus = 'RESOLVED';
            nextCorrectionRequested = false;
            if (data.note?.trim()) {
                await db_1.prisma.feedbackReply.create({
                    data: {
                        feedbackId,
                        userId,
                        message: `[Feedback Resolved]: ${data.note.trim()}`
                    }
                });
            }
            // Notify Inventor
            await notificationService_1.NotificationService.createNotification(feedback.inventorId, `Feedback Resolved: ${project.title}`, `Guide ${user?.fullName || ''} marked feedback on ${feedback.feedbackType} as resolved.`, 'REVIEW', feedback.id, projectId, { feedbackId: feedback.id, tab: 'Reviews' });
            await activityService_1.ActivityService.createActivity(projectId, userId, `Marked feedback on ${feedback.feedbackType} as RESOLVED.`, 'REVIEW', { feedbackId, action: 'RESOLVE' });
        }
        else if (data.action === 'REQUEST_CORRECTION') {
            if (!feedback_policy_1.FeedbackPolicy.canResolve(user, project, feedback)) {
                throw new Error('Only the assigned Guide or Administrator can request corrections.');
            }
            nextStatus = 'CORRECTION_REQUESTED';
            nextCorrectionRequested = true;
            if (data.note?.trim()) {
                await db_1.prisma.feedbackReply.create({
                    data: {
                        feedbackId,
                        userId,
                        message: `[Correction Required]: ${data.note.trim()}`
                    }
                });
            }
            // Notify Inventor
            await notificationService_1.NotificationService.createNotification(feedback.inventorId, `Correction Required: ${project.title}`, `Guide ${user?.fullName || ''} requested corrections on ${feedback.feedbackType}.`, 'REVIEW', feedback.id, projectId, { feedbackId: feedback.id, tab: 'Reviews' });
            await activityService_1.ActivityService.createActivity(projectId, userId, `Requested correction on ${feedback.feedbackType}.`, 'REVIEW', { feedbackId, action: 'REQUEST_CORRECTION' });
        }
        else if (data.action === 'CLOSE') {
            if (!feedback_policy_1.FeedbackPolicy.canManageFeedback(user, feedback)) {
                throw new Error('Access denied to close feedback.');
            }
            nextStatus = 'CLOSED';
        }
        return db_1.prisma.projectFeedback.update({
            where: { id: feedbackId },
            data: {
                status: nextStatus,
                correctionRequested: nextCorrectionRequested
            },
            include: {
                guide: { select: { id: true, fullName: true, username: true, institution: true } },
                inventor: { select: { id: true, fullName: true, username: true, institution: true } },
                replies: {
                    include: {
                        user: { select: { id: true, fullName: true, username: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
    }
    /**
     * Delete feedback thread.
     */
    static async deleteFeedback(projectId, feedbackId, userId) {
        const feedback = await db_1.prisma.projectFeedback.findUnique({
            where: { id: feedbackId }
        });
        if (!feedback || feedback.projectId !== projectId) {
            throw new Error('Feedback record not found.');
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });
        if (!feedback_policy_1.FeedbackPolicy.canManageFeedback(user, feedback)) {
            throw new Error('Access denied to delete feedback.');
        }
        return db_1.prisma.projectFeedback.delete({
            where: { id: feedbackId }
        });
    }
}
exports.FeedbackService = FeedbackService;
