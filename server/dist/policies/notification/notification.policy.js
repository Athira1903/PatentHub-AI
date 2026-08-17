"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPolicy = void 0;
class NotificationPolicy {
    /**
     * General rule: Users should not receive notifications for actions they triggered themselves.
     */
    static shouldNotifyUser(actorId, targetUserId) {
        return actorId !== targetUserId;
    }
    /**
     * Only the notification recipient can view or modify their notifications.
     */
    static canAccessNotification(user, notification) {
        if (!user)
            return false;
        if (user.role === 'Admin')
            return true;
        return notification.userId === user.userId;
    }
    static shouldNotifyInvitation(senderId, receiverId) {
        return this.shouldNotifyUser(senderId, receiverId);
    }
    static shouldNotifyTaskAssignment(assignerId, assigneeId) {
        return !!assigneeId && this.shouldNotifyUser(assignerId, assigneeId);
    }
    static shouldNotifyReviewRequest(actorId, targetUserId) {
        return this.shouldNotifyUser(actorId, targetUserId);
    }
    static shouldNotifyReviewCompleted(actorId, targetUserId) {
        return this.shouldNotifyUser(actorId, targetUserId);
    }
    static shouldNotifyDocumentUploaded(uploaderId, targetUserId) {
        return this.shouldNotifyUser(uploaderId, targetUserId);
    }
    static shouldNotifyStageChanged(actorId, targetUserId) {
        return this.shouldNotifyUser(actorId, targetUserId);
    }
    static shouldNotifyFilingApproved(actorId, targetUserId) {
        return this.shouldNotifyUser(actorId, targetUserId);
    }
}
exports.NotificationPolicy = NotificationPolicy;
