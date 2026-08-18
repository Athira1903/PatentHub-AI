export class NotificationPolicy {
  /**
   * General rule: Users should not receive notifications for actions they triggered themselves.
   */
  static shouldNotifyUser(actorId: string, targetUserId: string): boolean {
    return actorId !== targetUserId;
  }

  /**
   * Only the notification recipient can view or modify their notifications.
   */
  static canAccessNotification(user: any, notification: any): boolean {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return notification.userId === user.userId;
  }

  static shouldNotifyInvitation(senderId: string, receiverId: string): boolean {
    return NotificationPolicy.shouldNotifyUser(senderId, receiverId);
  }

  static shouldNotifyTaskAssignment(assignerId: string, assigneeId: string): boolean {
    return !!assigneeId && NotificationPolicy.shouldNotifyUser(assignerId, assigneeId);
  }

  static shouldNotifyReviewRequest(actorId: string, targetUserId: string): boolean {
    return NotificationPolicy.shouldNotifyUser(actorId, targetUserId);
  }

  static shouldNotifyReviewCompleted(actorId: string, targetUserId: string): boolean {
    return NotificationPolicy.shouldNotifyUser(actorId, targetUserId);
  }

  static shouldNotifyDocumentUploaded(uploaderId: string, targetUserId: string): boolean {
    return NotificationPolicy.shouldNotifyUser(uploaderId, targetUserId);
  }

  static shouldNotifyStageChanged(actorId: string, targetUserId: string): boolean {
    return NotificationPolicy.shouldNotifyUser(actorId, targetUserId);
  }

  static shouldNotifyFilingApproved(actorId: string, targetUserId: string): boolean {
    return NotificationPolicy.shouldNotifyUser(actorId, targetUserId);
  }
}
