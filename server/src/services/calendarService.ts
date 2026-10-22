import { prisma } from '../config/db';
import { NotificationService } from './notificationService';
import { ActivityService } from './activityService';
import { AuditService } from './auditService';

export interface CalendarItem {
  id: string;
  sourceId: string;
  sourceType: 'CUSTOM_EVENT' | 'ROADMAP_MILESTONE' | 'PROJECT_TASK' | 'PATENT_DEADLINE' | 'PROJECT_REVIEW';
  title: string;
  description: string | null;
  category:
    | 'PATENT_DEADLINE'
    | 'ROADMAP_MILESTONE'
    | 'PROJECT_TASK'
    | 'GUIDE_MEETING'
    | 'EXPERT_REVIEW'
    | 'TEAM_MEETING'
    | 'REMINDER'
    | 'CUSTOM';
  startDate: string;
  endDate: string;
  allDay: boolean;
  status: 'SCHEDULED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  isOverdue: boolean;
  projectId: string | null;
  projectTitle: string | null;
  assignedTo: { id: string; fullName: string; username: string } | null;
  location?: string | null;
  meetingUrl?: string | null;
  notes?: string | null;
  reminderMinutes?: number | null;
  navigationUrl: string;
  isEditable: boolean;
  milestoneId?: string | null;
  milestoneTitle?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
}

export class CalendarService {
  /**
   * Fetches all authorized project IDs for the user.
   */
  static async getAuthorizedProjectIds(user: any): Promise<{ projectIds: string[]; projectMap: Map<string, string> }> {
    const userId = user.userId || user.id;
    const userRole = typeof user.role === 'object' ? user.role.name : user.role;

    let whereClause: any = {};

    if (userRole === 'Admin') {
      whereClause = {};
    } else if (userRole === 'OrganizationAdmin' && user.organizationId) {
      whereClause = { organizationId: user.organizationId };
    } else {
      whereClause = {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      };
    }

    const projects = await prisma.patentProject.findMany({
      where: whereClause,
      select: { id: true, title: true },
    });

    const projectMap = new Map<string, string>();
    const projectIds: string[] = [];
    for (const p of projects) {
      projectIds.push(p.id);
      projectMap.set(p.id, p.title);
    }

    return { projectIds, projectMap };
  }

  /**
   * Retrieves aggregated calendar events for a date range with filtering.
   */
  static async getEvents(
    user: any,
    filters: {
      startDate?: string;
      endDate?: string;
      projectId?: string;
      category?: string;
      status?: string;
    }
  ): Promise<CalendarItem[]> {
    const userId = user.userId || user.id;
    const { projectIds, projectMap } = await this.getAuthorizedProjectIds(user);

    // If a specific project was requested, ensure the user has access to it
    let targetProjectIds = projectIds;
    if (filters.projectId) {
      if (!projectIds.includes(filters.projectId) && user.role !== 'Admin') {
        return [];
      }
      targetProjectIds = [filters.projectId];
    }

    const startFilter = filters.startDate ? new Date(filters.startDate) : undefined;
    const endFilter = filters.endDate ? new Date(filters.endDate) : undefined;
    const now = new Date();

    const items: CalendarItem[] = [];

    // 1. SOURCED FROM: Custom Calendar Events (CalendarEvent table)
    const customEventWhere: any = {
      OR: [
        { projectId: { in: targetProjectIds } },
        { createdById: userId },
        { assignedToId: userId },
      ],
    };
    if (filters.projectId) {
      customEventWhere.projectId = filters.projectId;
    }
    if (startFilter || endFilter) {
      customEventWhere.AND = [
        ...(startFilter ? [{ endDate: { gte: startFilter } }] : []),
        ...(endFilter ? [{ startDate: { lte: endFilter } }] : []),
      ];
    }

    const customEvents = await prisma.calendarEvent.findMany({
      where: customEventWhere,
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true } },
        project: { select: { id: true, title: true } },
        milestone: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });

    for (const ev of customEvents) {
      const isPast = new Date(ev.endDate) < now;
      const isOverdue = isPast && ev.status !== 'COMPLETED' && ev.status !== 'CANCELLED';

      items.push({
        id: `event-${ev.id}`,
        sourceId: ev.id,
        sourceType: 'CUSTOM_EVENT',
        title: ev.title,
        description: ev.description,
        category: ev.eventType as any,
        startDate: ev.startDate.toISOString(),
        endDate: ev.endDate.toISOString(),
        allDay: ev.allDay,
        status: isOverdue ? 'OVERDUE' : (ev.status as any),
        isOverdue,
        projectId: ev.projectId,
        projectTitle: ev.project?.title || (ev.projectId ? projectMap.get(ev.projectId) || null : null),
        assignedTo: ev.assignedTo,
        location: ev.location,
        meetingUrl: ev.meetingUrl,
        notes: ev.notes,
        reminderMinutes: ev.reminderMinutes,
        navigationUrl: ev.projectId ? `/dashboard/projects/${ev.projectId}` : '/dashboard/calendar',
        isEditable: ev.createdById === userId || user.role === 'Admin',
        milestoneId: ev.milestoneId,
        milestoneTitle: ev.milestone?.title || null,
        taskId: ev.taskId,
        taskTitle: ev.task?.title || null,
      });
    }

    // 2. SOURCED FROM: Roadmap Milestones (No duplicate storage)
    if (targetProjectIds.length > 0 && (!filters.category || filters.category === 'ROADMAP_MILESTONE')) {
      const milestoneWhere: any = {
        projectId: { in: targetProjectIds },
        OR: [{ dueDate: { not: null } }, { startDate: { not: null } }],
      };

      if (startFilter || endFilter) {
        milestoneWhere.AND = [
          {
            OR: [
              {
                dueDate: {
                  ...(startFilter ? { gte: startFilter } : {}),
                  ...(endFilter ? { lte: endFilter } : {}),
                },
              },
              {
                startDate: {
                  ...(startFilter ? { gte: startFilter } : {}),
                  ...(endFilter ? { lte: endFilter } : {}),
                },
              },
            ],
          },
        ];
      }

      const milestones = await prisma.roadmapMilestone.findMany({
        where: milestoneWhere,
        include: {
          assignedTo: { select: { id: true, fullName: true, username: true } },
          project: { select: { id: true, title: true } },
        },
      });

      for (const m of milestones) {
        const start = m.startDate || m.dueDate || new Date();
        const end = m.dueDate || m.startDate || new Date();
        const isPast = new Date(end) < now;
        const isOverdue = isPast && m.status !== 'COMPLETED';

        items.push({
          id: `milestone-${m.id}`,
          sourceId: m.id,
          sourceType: 'ROADMAP_MILESTONE',
          title: `Milestone: ${m.title}`,
          description: m.description,
          category: 'ROADMAP_MILESTONE',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          allDay: true,
          status: isOverdue ? 'OVERDUE' : (m.status as any),
          isOverdue,
          projectId: m.projectId,
          projectTitle: m.project.title,
          assignedTo: m.assignedTo,
          notes: m.notes,
          navigationUrl: `/dashboard/projects/${m.projectId}?tab=Roadmap`,
          isEditable: false,
        });
      }
    }

    // 3. SOURCED FROM: Tasks (No duplicate storage)
    if (targetProjectIds.length > 0 && (!filters.category || filters.category === 'PROJECT_TASK')) {
      const taskWhere: any = {
        projectId: { in: targetProjectIds },
        dueDate: { not: null },
      };
      if (startFilter || endFilter) {
        taskWhere.dueDate = {
          ...(startFilter ? { gte: startFilter } : {}),
          ...(endFilter ? { lte: endFilter } : {}),
        };
      }

      const tasks = await prisma.task.findMany({
        where: taskWhere,
        include: {
          assignedTo: { select: { id: true, fullName: true, username: true } },
          project: { select: { id: true, title: true } },
        },
      });

      for (const t of tasks) {
        const dueDate = t.dueDate!;
        const isPast = new Date(dueDate) < now;
        const isOverdue = isPast && t.status !== 'COMPLETED' && t.status !== 'CANCELLED';

        items.push({
          id: `task-${t.id}`,
          sourceId: t.id,
          sourceType: 'PROJECT_TASK',
          title: `Task: ${t.title}`,
          description: t.description,
          category: 'PROJECT_TASK',
          startDate: dueDate.toISOString(),
          endDate: dueDate.toISOString(),
          allDay: true,
          status: isOverdue ? 'OVERDUE' : (t.status as any),
          isOverdue,
          projectId: t.projectId,
          projectTitle: t.project.title,
          assignedTo: t.assignedTo,
          notes: null,
          navigationUrl: `/dashboard/tasks?project=${t.projectId}`,
          isEditable: false,
        });
      }
    }

    // 4. SOURCED FROM: Statutory Patent Deadlines (Section 9(1) / Section 11B)
    if (targetProjectIds.length > 0 && (!filters.category || filters.category === 'PATENT_DEADLINE')) {
      const deadlineWhere: any = {
        projectId: { in: targetProjectIds },
      };
      if (startFilter || endFilter) {
        deadlineWhere.dueDate = {
          ...(startFilter ? { gte: startFilter } : {}),
          ...(endFilter ? { lte: endFilter } : {}),
        };
      }

      const deadlines = await prisma.deadline.findMany({
        where: deadlineWhere,
        include: {
          project: { select: { id: true, title: true } },
        },
      });

      for (const d of deadlines) {
        const isPast = new Date(d.dueDate) < now;
        const isOverdue = isPast && d.status !== 'MET';

        const readableType = d.deadlineType.replace(/_/g, ' ');

        items.push({
          id: `deadline-${d.id}`,
          sourceId: d.id,
          sourceType: 'PATENT_DEADLINE',
          title: `Filing Deadline: ${readableType}`,
          description: d.description || `Statutory Indian patent deadline (${readableType}).`,
          category: 'PATENT_DEADLINE',
          startDate: d.dueDate.toISOString(),
          endDate: d.dueDate.toISOString(),
          allDay: true,
          status: isOverdue ? 'OVERDUE' : d.status === 'MET' ? 'COMPLETED' : 'PENDING',
          isOverdue,
          projectId: d.projectId,
          projectTitle: d.project.title,
          assignedTo: null,
          notes: d.referenceEvent ? `Reference Event: ${d.referenceEvent}` : null,
          navigationUrl: `/dashboard/projects/${d.projectId}?tab=Forms%20%26%20Filing`,
          isEditable: false,
        });
      }
    }

    // 5. SOURCED FROM: Project Reviews (Formal Guide / Expert Reviews)
    if (targetProjectIds.length > 0 && (!filters.category || filters.category === 'EXPERT_REVIEW' || filters.category === 'GUIDE_MEETING')) {
      const reviewWhere: any = {
        projectId: { in: targetProjectIds },
      };
      if (startFilter || endFilter) {
        reviewWhere.createdAt = {
          ...(startFilter ? { gte: startFilter } : {}),
          ...(endFilter ? { lte: endFilter } : {}),
        };
      }

      const reviews = await prisma.projectReview.findMany({
        where: reviewWhere,
        include: {
          reviewer: { select: { id: true, fullName: true, username: true } },
          project: { select: { id: true, title: true } },
        },
      });

      for (const r of reviews) {
        const reviewCategory = r.reviewType === 'GUIDE_REVIEW' ? 'GUIDE_MEETING' : 'EXPERT_REVIEW';
        if (filters.category && filters.category !== reviewCategory) continue;

        items.push({
          id: `review-${r.id}`,
          sourceId: r.id,
          sourceType: 'PROJECT_REVIEW',
          title: `${r.reviewType.replace(/_/g, ' ')}: ${r.decision}`,
          description: r.comments,
          category: reviewCategory as any,
          startDate: r.createdAt.toISOString(),
          endDate: r.createdAt.toISOString(),
          allDay: false,
          status: r.decision === 'APPROVED' ? 'COMPLETED' : 'PENDING',
          isOverdue: false,
          projectId: r.projectId,
          projectTitle: r.project.title,
          assignedTo: r.reviewer,
          notes: r.decision ? `Decision: ${r.decision}` : null,
          navigationUrl: `/dashboard/projects/${r.projectId}/reviews`,
          isEditable: false,
        });
      }
    }

    // Filter by status if requested
    let result = items;
    if (filters.status) {
      const st = filters.status.toUpperCase();
      if (st === 'OVERDUE') {
        result = result.filter((item) => item.isOverdue);
      } else if (st === 'UPCOMING') {
        result = result.filter((item) => !item.isOverdue && item.status !== 'COMPLETED' && item.status !== 'CANCELLED');
      } else {
        result = result.filter((item) => item.status === st);
      }
    }

    // Sort chronologically
    return result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  /**
   * Retrieves single calendar event details.
   */
  static async getEventById(eventId: string, user: any): Promise<CalendarItem> {
    const userId = user.userId || user.id;
    const { projectIds, projectMap } = await this.getAuthorizedProjectIds(user);

    const ev = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true } },
        project: { select: { id: true, title: true } },
        milestone: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });

    if (!ev) {
      throw new Error('Calendar event not found');
    }

    if (ev.projectId && !projectIds.includes(ev.projectId) && user.role !== 'Admin') {
      throw new Error('Unauthorized access to this event');
    }

    const now = new Date();
    const isPast = new Date(ev.endDate) < now;
    const isOverdue = isPast && ev.status !== 'COMPLETED' && ev.status !== 'CANCELLED';

    return {
      id: `event-${ev.id}`,
      sourceId: ev.id,
      sourceType: 'CUSTOM_EVENT',
      title: ev.title,
      description: ev.description,
      category: ev.eventType as any,
      startDate: ev.startDate.toISOString(),
      endDate: ev.endDate.toISOString(),
      allDay: ev.allDay,
      status: isOverdue ? 'OVERDUE' : (ev.status as any),
      isOverdue,
      projectId: ev.projectId,
      projectTitle: ev.project?.title || (ev.projectId ? projectMap.get(ev.projectId) || null : null),
      assignedTo: ev.assignedTo,
      location: ev.location,
      meetingUrl: ev.meetingUrl,
      notes: ev.notes,
      reminderMinutes: ev.reminderMinutes,
      navigationUrl: ev.projectId ? `/dashboard/projects/${ev.projectId}` : '/dashboard/calendar',
      isEditable: ev.createdById === userId || user.role === 'Admin',
      milestoneId: ev.milestoneId,
      milestoneTitle: ev.milestone?.title || null,
      taskId: ev.taskId,
      taskTitle: ev.task?.title || null,
    };
  }

  /**
   * Creates a custom calendar event.
   */
  static async createEvent(user: any, data: any) {
    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      allDay,
      location,
      meetingUrl,
      notes,
      projectId,
      assignedToId,
      reminderMinutes,
      milestoneId,
      taskId,
    } = data;

    if (!title || !title.trim()) {
      throw new Error('Event title is required');
    }
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }
    if (end.getTime() < start.getTime()) {
      throw new Error('Event end date/time cannot be earlier than start date/time');
    }

    // Verify project authorization if project is provided
    if (projectId) {
      const { projectIds } = await this.getAuthorizedProjectIds(user);
      if (!projectIds.includes(projectId) && user.role !== 'Admin') {
        throw new Error('Unauthorized project reference');
      }
    }

    if (milestoneId) {
      const milestone = await prisma.roadmapMilestone.findFirst({
        where: { id: milestoneId, ...(projectId ? { projectId } : {}) },
      });
      if (!milestone) {
        throw new Error('Referenced milestone does not exist');
      }
    }

    if (taskId) {
      const task = await prisma.task.findFirst({
        where: { id: taskId, ...(projectId ? { projectId } : {}) },
      });
      if (!task) {
        throw new Error('Referenced project task does not exist');
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        eventType: eventType || 'CUSTOM',
        startDate: start,
        endDate: end,
        allDay: Boolean(allDay),
        location: location?.trim() || null,
        meetingUrl: meetingUrl?.trim() || null,
        notes: notes?.trim() || null,
        projectId: projectId || null,
        milestoneId: milestoneId || null,
        taskId: taskId || null,
        organizationId: user.organizationId || null,
        createdById: user.userId || user.id,
        assignedToId: assignedToId || null,
        reminderMinutes: reminderMinutes ? parseInt(reminderMinutes, 10) : null,
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true } },
        project: { select: { id: true, title: true } },
        milestone: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });

    if (assignedToId && assignedToId !== (user.userId || user.id)) {
      await NotificationService.createNotification(
        assignedToId,
        'Calendar Event Invitation',
        `${user.fullName || 'A team member'} added you to the event "${event.title}" on ${start.toLocaleDateString()}.`,
        'GENERAL',
        event.id,
        projectId || undefined
      );
    }

    if (projectId) {
      await ActivityService.createActivity(
        projectId,
        user.userId || user.id,
        `Scheduled calendar event "${event.title}"`,
        'WORKFLOW'
      );
    }

    return event;
  }

  /**
   * Updates an existing custom calendar event.
   */
  static async updateEvent(eventId: string, user: any, data: any) {
    const userId = user.userId || user.id;
    const existing = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!existing) {
      throw new Error('Calendar event not found');
    }

    if (existing.createdById !== userId && user.role !== 'Admin') {
      throw new Error('You do not have permission to modify this calendar event');
    }

    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.title = data.title.trim();
    if (data.description !== undefined) updatePayload.description = data.description ? data.description.trim() : null;
    if (data.eventType !== undefined) updatePayload.eventType = data.eventType;
    if (data.allDay !== undefined) updatePayload.allDay = Boolean(data.allDay);
    if (data.location !== undefined) updatePayload.location = data.location ? data.location.trim() : null;
    if (data.meetingUrl !== undefined) updatePayload.meetingUrl = data.meetingUrl ? data.meetingUrl.trim() : null;
    if (data.notes !== undefined) updatePayload.notes = data.notes ? data.notes.trim() : null;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.assignedToId !== undefined) updatePayload.assignedToId = data.assignedToId || null;
    if (data.reminderMinutes !== undefined) {
      updatePayload.reminderMinutes = data.reminderMinutes ? parseInt(data.reminderMinutes, 10) : null;
    }

    if (data.projectId !== undefined) {
      if (data.projectId) {
        const { projectIds } = await this.getAuthorizedProjectIds(user);
        if (!projectIds.includes(data.projectId) && user.role !== 'Admin') {
          throw new Error('Unauthorized project reference');
        }
      }
      updatePayload.projectId = data.projectId || null;
    }

    const effectiveProjectId = data.projectId !== undefined ? data.projectId : existing.projectId;

    if (data.milestoneId !== undefined) {
      if (data.milestoneId) {
        const milestone = await prisma.roadmapMilestone.findFirst({
          where: { id: data.milestoneId, ...(effectiveProjectId ? { projectId: effectiveProjectId } : {}) },
        });
        if (!milestone) {
          throw new Error('Referenced milestone does not exist');
        }
      }
      updatePayload.milestoneId = data.milestoneId || null;
    }

    if (data.taskId !== undefined) {
      if (data.taskId) {
        const task = await prisma.task.findFirst({
          where: { id: data.taskId, ...(effectiveProjectId ? { projectId: effectiveProjectId } : {}) },
        });
        if (!task) {
          throw new Error('Referenced project task does not exist');
        }
      }
      updatePayload.taskId = data.taskId || null;
    }

    const newStart = data.startDate ? new Date(data.startDate) : existing.startDate;
    const newEnd = data.endDate ? new Date(data.endDate) : existing.endDate;

    if (data.startDate !== undefined) updatePayload.startDate = newStart;
    if (data.endDate !== undefined) updatePayload.endDate = newEnd;

    if (newEnd.getTime() < newStart.getTime()) {
      throw new Error('Event end date/time cannot precede start date/time');
    }

    const updated = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updatePayload,
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true } },
        project: { select: { id: true, title: true } },
        milestone: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });

    // Notify assignee if rescheduled
    if (
      (data.startDate || data.endDate) &&
      updated.assignedToId &&
      updated.assignedToId !== userId
    ) {
      await NotificationService.createNotification(
        updated.assignedToId,
        'Event Rescheduled',
        `The event "${updated.title}" was rescheduled to ${newStart.toLocaleDateString()}.`,
        'GENERAL',
        updated.id,
        updated.projectId || undefined
      );
    }

    if (updated.projectId) {
      await ActivityService.createActivity(
        updated.projectId,
        userId,
        `Updated calendar event "${updated.title}"`,
        'WORKFLOW'
      );
    }

    if (user.role === 'Admin' && existing.createdById !== userId) {
      await AuditService.logAdminAction({
        actorId: userId,
        action: `Admin updated calendar event "${updated.title}"`,
        targetId: updated.id,
        projectId: updated.projectId || undefined,
      });
    }

    return updated;
  }

  /**
   * Deletes an existing custom calendar event.
   */
  static async deleteEvent(eventId: string, user: any) {
    const userId = user.userId || user.id;
    const existing = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!existing) {
      throw new Error('Calendar event not found');
    }

    if (existing.createdById !== userId && user.role !== 'Admin') {
      throw new Error('You do not have permission to delete this calendar event');
    }

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    if (existing.projectId) {
      await ActivityService.createActivity(
        existing.projectId,
        userId,
        `Deleted calendar event "${existing.title}"`,
        'WORKFLOW'
      );
    }

    if (user.role === 'Admin' && existing.createdById !== userId) {
      await AuditService.logAdminAction({
        actorId: userId,
        action: `Admin deleted calendar event "${existing.title}"`,
        targetId: existing.id,
        projectId: existing.projectId || undefined,
      });
    }

    return { success: true, message: 'Event deleted successfully' };
  }
}
