"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const db_1 = require("../config/db");
class NotificationService {
    /**
     * Creates a notification for a single recipient.
     */
    static async createNotification(userId, title, message, type = 'GENERAL', referenceId, projectId, metadata) {
        try {
            if (!userId || !title || !message)
                return null;
            return await db_1.prisma.notification.create({
                data: {
                    userId,
                    projectId: projectId || null,
                    title: title.trim(),
                    message: message.trim(),
                    type: (type || 'GENERAL').toUpperCase(),
                    referenceId: referenceId || null,
                    metadata: metadata ?? undefined,
                    isRead: false
                }
            });
        }
        catch (error) {
            console.error('Notification dispatch failed silently:', error);
            return null;
        }
    }
    /**
     * Dispatches a notification to all project members (owner + members), excluding optional actorId.
     */
    static async notifyProjectMembers(projectId, excludeUserId, title, message, type = 'GENERAL', referenceId, metadata) {
        try {
            const project = await db_1.prisma.patentProject.findUnique({
                where: { id: projectId },
                select: {
                    ownerId: true,
                    members: { select: { userId: true } }
                }
            });
            if (!project)
                return;
            const recipientIds = new Set();
            if (project.ownerId && project.ownerId !== excludeUserId) {
                recipientIds.add(project.ownerId);
            }
            project.members.forEach((m) => {
                if (m.userId && m.userId !== excludeUserId) {
                    recipientIds.add(m.userId);
                }
            });
            await Promise.all(Array.from(recipientIds).map((uid) => this.createNotification(uid, title, message, type, referenceId, projectId, metadata)));
        }
        catch (error) {
            console.error('notifyProjectMembers failed silently:', error);
        }
    }
    /**
     * Lists notifications for an authenticated user.
     */
    static async listUserNotifications(userId) {
        return db_1.prisma.notification.findMany({
            where: { userId },
            include: {
                project: { select: { id: true, title: true, category: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Returns count of unread notifications for a user.
     */
    static async getUnreadCount(userId) {
        return db_1.prisma.notification.count({
            where: { userId, isRead: false }
        });
    }
    /**
     * Marks a single notification as read.
     */
    static async markNotificationRead(userId, notificationId) {
        const notification = await db_1.prisma.notification.findUnique({
            where: { id: notificationId }
        });
        if (!notification || notification.userId !== userId) {
            throw new Error('Notification not found or access denied.');
        }
        return db_1.prisma.notification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
    }
    /**
     * Marks all unread notifications for a user as read.
     */
    static async markAllNotificationsRead(userId) {
        const result = await db_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
        return { count: result.count };
    }
}
exports.NotificationService = NotificationService;
