import { prisma } from '../config/db';
import { NotificationService } from './notificationService';
import { ActivityService } from './activityService';
import { AuditService } from './auditService';

export const DEFAULT_ROADMAP_STAGES = [
  {
    stageKey: 'DEFINE_INVENTION',
    title: 'Define Invention',
    description: 'Formulate core innovation idea, problem statement, technical domain, proposed solution, and research objectives.',
    orderIndex: 0,
  },
  {
    stageKey: 'PRIOR_ART',
    title: 'Prior-Art Research',
    description: 'Conduct prior-art patent search across USPTO, EPO, and WIPO databases to evaluate novelty and determine inventive step.',
    orderIndex: 1,
  },
  {
    stageKey: 'AI_ANALYSIS',
    title: 'AI Analysis',
    description: 'Execute automated patent classification (IPC), novelty similarity scoring, and diagnostic claim recommendations.',
    orderIndex: 2,
  },
  {
    stageKey: 'DRAFT_SPECIFICATION',
    title: 'Draft Specification',
    description: 'Draft Form 2 provisional or complete specification including background, summary, detailed description, and figures.',
    orderIndex: 3,
  },
  {
    stageKey: 'CLAIMS_ENGINEERING',
    title: 'Claims Engineering',
    description: 'Engineer independent and dependent claims with strict antecedent basis, element breakdowns, and claim chart mappings.',
    orderIndex: 4,
  },
  {
    stageKey: 'GUIDE_REVIEW',
    title: 'Guide & Patent Expert Review',
    description: 'Submit for formal institutional review with assigned academic guides and certified patent attorneys.',
    orderIndex: 5,
  },
  {
    stageKey: 'FILING_READINESS',
    title: 'Filing Readiness',
    description: 'Verify statutory compliance checklists, prepare Indian Patent Forms (Form 1, 2, 3, 5), and export final filing package.',
    orderIndex: 6,
  },
];

export class RoadmapService {
  /**
   * Retrieves or initializes the roadmap for a patent project.
   */
  static async getOrCreateProjectRoadmap(projectId: string, user: any) {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, email: true } },
          },
        },
        owner: { select: { id: true, fullName: true, username: true, email: true } },
      },
    });

    if (!project) {
      throw new Error('Patent project not found');
    }

    let milestones = await prisma.roadmapMilestone.findMany({
      where: { projectId },
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true, email: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
        dependencyMilestone: { select: { id: true, title: true, status: true, orderIndex: true } },
        task: { select: { id: true, title: true, status: true, dueDate: true } },
        deadline: { select: { id: true, deadlineType: true, dueDate: true, status: true } },
      },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    });

    // Auto-initialize default 7 stages if none exist
    if (milestones.length === 0) {
      const createdList = [];
      for (const stage of DEFAULT_ROADMAP_STAGES) {
        // Automatically link guide to stage 5 if available
        let defaultAssigneeId: string | null = null;
        if (stage.stageKey === 'GUIDE_REVIEW') {
          const guideMember = project.members.find(
            (m) => m.role === 'GUIDE' || (m.user as any)?.role === 'Guide'
          );
          if (guideMember) {
            defaultAssigneeId = guideMember.userId;
          }
        }

        const created = await prisma.roadmapMilestone.create({
          data: {
            projectId,
            title: stage.title,
            description: stage.description,
            stageKey: stage.stageKey,
            isDefault: true,
            orderIndex: stage.orderIndex,
            status: stage.orderIndex === 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
            progress: stage.orderIndex === 0 ? 25 : 0,
            assignedToId: defaultAssigneeId,
            createdById: user?.userId || user?.id || null,
          },
          include: {
            assignedTo: { select: { id: true, fullName: true, username: true, email: true } },
            createdBy: { select: { id: true, fullName: true, username: true } },
            dependencyMilestone: { select: { id: true, title: true, status: true, orderIndex: true } },
            task: { select: { id: true, title: true, status: true, dueDate: true } },
            deadline: { select: { id: true, deadlineType: true, dueDate: true, status: true } },
          },
        });
        createdList.push(created);
      }
      milestones = createdList;
    }

    const progressStats = this.calculateProgress(milestones);

    const projectTasks = await prisma.task.findMany({
      where: { projectId },
      select: { id: true, title: true, status: true, dueDate: true, priority: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      project: {
        id: project.id,
        title: project.title,
        stage: project.stage,
        owner: project.owner,
        members: project.members,
      },
      milestones,
      progress: progressStats,
      tasks: projectTasks,
    };
  }

  /**
   * Retrieves single milestone details by ID.
   */
  static async getMilestoneById(projectId: string, milestoneId: string, actor: any) {
    const milestone = await prisma.roadmapMilestone.findFirst({
      where: { id: milestoneId, projectId },
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true, email: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
        dependencyMilestone: { select: { id: true, title: true, status: true, orderIndex: true } },
        task: { select: { id: true, title: true, status: true, dueDate: true } },
        deadline: { select: { id: true, deadlineType: true, dueDate: true, status: true } },
      },
    });

    if (!milestone) {
      throw new Error('Milestone not found in this project');
    }

    return milestone;
  }

  /**
   * Retrieves calculated project roadmap progress.
   */
  static async getProjectProgress(projectId: string, actor: any) {
    const milestones = await prisma.roadmapMilestone.findMany({
      where: { projectId },
      select: {
        status: true,
        progress: true,
        dueDate: true,
      },
    });

    return this.calculateProgress(milestones);
  }

  /**
   * Calculates overall project progress from actual milestone completion.
   */
  static calculateProgress(milestones: any[]) {
    const total = milestones.length;
    if (total === 0) {
      return {
        overallPercentage: 0,
        completedCount: 0,
        inProgressCount: 0,
        notStartedCount: 0,
        blockedCount: 0,
        overdueCount: 0,
        totalMilestones: 0,
      };
    }

    const now = new Date();
    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;
    let blockedCount = 0;
    let overdueCount = 0;
    let totalProgressSum = 0;

    for (const m of milestones) {
      if (m.status === 'COMPLETED') {
        completedCount++;
        totalProgressSum += 100;
      } else {
        if (m.status === 'IN_PROGRESS') inProgressCount++;
        else if (m.status === 'BLOCKED') blockedCount++;
        else notStartedCount++;

        totalProgressSum += Math.min(100, Math.max(0, m.progress || 0));

        if (m.dueDate && new Date(m.dueDate) < now) {
          overdueCount++;
        }
      }
    }

    const overallPercentage = Math.round(totalProgressSum / total);

    return {
      overallPercentage,
      completedCount,
      inProgressCount,
      notStartedCount,
      blockedCount,
      overdueCount,
      totalMilestones: total,
    };
  }

  /**
   * Creates a custom milestone for a project.
   */
  static async createMilestone(projectId: string, actor: any, data: any) {
    const {
      title,
      description,
      startDate,
      dueDate,
      status,
      progress,
      notes,
      assignedToId,
      dependencyMilestoneId,
      taskId,
      deadlineId,
    } = data;

    // Verify taskId if provided belongs to project
    if (taskId) {
      const taskExists = await prisma.task.findFirst({
        where: { id: taskId, projectId },
      });
      if (!taskExists) {
        throw new Error('Referenced project task does not belong to this project');
      }
    }

    // Get current maximum order index
    const lastMilestone = await prisma.roadmapMilestone.findFirst({
      where: { projectId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    const nextOrderIndex = (lastMilestone?.orderIndex ?? -1) + 1;

    const milestone = await prisma.roadmapMilestone.create({
      data: {
        projectId,
        title: title.trim(),
        description: description?.trim() || null,
        isDefault: false,
        orderIndex: nextOrderIndex,
        status: status || 'NOT_STARTED',
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        progress: progress !== undefined ? Math.min(100, Math.max(0, parseInt(progress, 10))) : 0,
        notes: notes?.trim() || null,
        assignedToId: assignedToId || null,
        dependencyMilestoneId: dependencyMilestoneId || null,
        taskId: taskId || null,
        deadlineId: deadlineId || null,
        createdById: actor.userId || actor.id,
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true, email: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
        dependencyMilestone: { select: { id: true, title: true, status: true } },
        task: { select: { id: true, title: true, status: true, dueDate: true } },
        deadline: { select: { id: true, deadlineType: true, dueDate: true, status: true } },
      },
    });

    // Notify assignee if assigned to someone other than the creator
    if (assignedToId && assignedToId !== (actor.userId || actor.id)) {
      await NotificationService.createNotification(
        assignedToId,
        'Milestone Assigned',
        `${actor.fullName || 'A project manager'} assigned you the milestone "${milestone.title}".`,
        'WORKFLOW',
        milestone.id,
        projectId
      );
    }

    await ActivityService.createActivity(
      projectId,
      actor.userId || actor.id,
      `Created custom milestone "${milestone.title}"`,
      'WORKFLOW'
    );

    return milestone;
  }

  /**
   * Updates an existing milestone (status, dates, assignee, notes, progress).
   */
  static async updateMilestone(projectId: string, milestoneId: string, actor: any, data: any) {
    const existing = await prisma.roadmapMilestone.findFirst({
      where: { id: milestoneId, projectId },
    });

    if (!existing) {
      throw new Error('Milestone not found in this project');
    }

    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.title = data.title.trim();
    if (data.description !== undefined) updatePayload.description = data.description ? data.description.trim() : null;
    if (data.notes !== undefined) updatePayload.notes = data.notes ? data.notes.trim() : null;
    if (data.startDate !== undefined) updatePayload.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.dueDate !== undefined) updatePayload.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.progress !== undefined) {
      updatePayload.progress = Math.min(100, Math.max(0, parseInt(data.progress, 10)));
      if (updatePayload.progress === 100 && existing.status !== 'COMPLETED') {
        updatePayload.status = 'COMPLETED';
        updatePayload.completedAt = new Date();
      }
    }

    if (data.status !== undefined) {
      updatePayload.status = data.status;
      if (data.status === 'COMPLETED') {
        updatePayload.completedAt = existing.completedAt || new Date();
        updatePayload.progress = 100;
      } else if (existing.status === 'COMPLETED' && data.status !== 'COMPLETED') {
        updatePayload.completedAt = null;
        if (data.progress === undefined) {
          updatePayload.progress = 50;
        }
      }
    }

    if (data.assignedToId !== undefined) {
      updatePayload.assignedToId = data.assignedToId || null;
    }
    if (data.dependencyMilestoneId !== undefined) {
      // Prevent self-dependency
      if (data.dependencyMilestoneId === milestoneId) {
        throw new Error('A milestone cannot depend on itself');
      }
      updatePayload.dependencyMilestoneId = data.dependencyMilestoneId || null;
    }
    if (data.taskId !== undefined) {
      if (data.taskId) {
        const taskExists = await prisma.task.findFirst({
          where: { id: data.taskId, projectId },
        });
        if (!taskExists) {
          throw new Error('Referenced project task does not belong to this project');
        }
      }
      updatePayload.taskId = data.taskId || null;
    }
    if (data.deadlineId !== undefined) {
      updatePayload.deadlineId = data.deadlineId || null;
    }

    const updated = await prisma.roadmapMilestone.update({
      where: { id: milestoneId },
      data: updatePayload,
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true, email: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
        dependencyMilestone: { select: { id: true, title: true, status: true } },
        task: { select: { id: true, title: true, status: true, dueDate: true } },
        deadline: { select: { id: true, deadlineType: true, dueDate: true, status: true } },
      },
    });

    // Check for notifications
    // 1. Newly assigned
    if (
      updatePayload.assignedToId &&
      updatePayload.assignedToId !== existing.assignedToId &&
      updatePayload.assignedToId !== (actor.userId || actor.id)
    ) {
      await NotificationService.createNotification(
        updatePayload.assignedToId,
        'Milestone Assigned',
        `${actor.fullName || 'A project manager'} assigned you the milestone "${updated.title}".`,
        'WORKFLOW',
        updated.id,
        projectId
      );
    }

    // 2. Due date changed
    if (
      updatePayload.dueDate &&
      (!existing.dueDate || new Date(existing.dueDate).getTime() !== new Date(updatePayload.dueDate).getTime())
    ) {
      if (updated.assignedToId && updated.assignedToId !== (actor.userId || actor.id)) {
        await NotificationService.createNotification(
          updated.assignedToId,
          'Milestone Rescheduled',
          `Due date for milestone "${updated.title}" changed to ${new Date(updatePayload.dueDate).toLocaleDateString()}.`,
          'WORKFLOW',
          updated.id,
          projectId
        );
      }
    }

    // 3. Status transition
    if (updatePayload.status && updatePayload.status !== existing.status) {
      await ActivityService.createActivity(
        projectId,
        actor.userId || actor.id,
        `Updated milestone "${updated.title}" status to ${updated.status}`,
        'WORKFLOW'
      );
    }

    if (actor.role === 'Admin' && existing.createdById !== (actor.userId || actor.id)) {
      await AuditService.logAdminAction({
        actorId: actor.userId || actor.id,
        action: `Admin updated milestone "${updated.title}"`,
        targetId: updated.id,
        projectId,
      });
    }

    return updated;
  }

  /**
   * Deletes a custom milestone. Default milestones are protected from deletion.
   */
  static async deleteMilestone(projectId: string, milestoneId: string, actor: any) {
    const existing = await prisma.roadmapMilestone.findFirst({
      where: { id: milestoneId, projectId },
    });

    if (!existing) {
      throw new Error('Milestone not found in this project');
    }

    if (existing.isDefault) {
      throw new Error('Default patent lifecycle stages cannot be deleted. You may mark them as Not Started or Blocked.');
    }

    await prisma.roadmapMilestone.delete({
      where: { id: milestoneId },
    });

    await ActivityService.createActivity(
      projectId,
      actor.userId || actor.id,
      `Deleted custom milestone "${existing.title}"`,
      'WORKFLOW'
    );

    if (actor.role === 'Admin' && existing.createdById !== (actor.userId || actor.id)) {
      await AuditService.logAdminAction({
        actorId: actor.userId || actor.id,
        action: `Admin deleted milestone "${existing.title}"`,
        targetId: existing.id,
        projectId,
      });
    }

    return { success: true, message: 'Milestone deleted successfully' };
  }

  /**
   * Reorders milestones within a project.
   */
  static async reorderMilestones(projectId: string, orderedMilestoneIds: string[], actor: any) {
    if (!Array.isArray(orderedMilestoneIds) || orderedMilestoneIds.length === 0) {
      throw new Error('Ordered milestone IDs must be provided');
    }

    await prisma.$transaction(
      orderedMilestoneIds.map((id, index) =>
        prisma.roadmapMilestone.updateMany({
          where: { id, projectId },
          data: { orderIndex: index },
        })
      )
    );

    await ActivityService.createActivity(
      projectId,
      actor.userId || actor.id,
      'Reordered roadmap milestones',
      'WORKFLOW'
    );

    return { success: true, message: 'Roadmap reordered successfully' };
  }
}
