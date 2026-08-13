import { prisma } from '../config/db';
import { Task } from '@prisma/client';
import { ActivityService } from './activityService';
import { NotificationService } from './notificationService';

export class TaskService {
  /**
   * Helper to verify if a user is a valid project member (owner or member).
   */
  private static async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      select: {
        ownerId: true,
        members: { select: { userId: true } }
      }
    });

    if (!project) return false;
    if (project.ownerId === userId) return true;
    return project.members.some((m) => m.userId === userId);
  }

  /**
   * Creates a new project-scoped task.
   */
  static async createTask(
    projectId: string,
    creatorId: string,
    data: {
      title: string;
      description?: string;
      assignedToId?: string;
      priority?: string;
      dueDate?: string | Date;
    }
  ): Promise<Task> {
    if (!data.title || !data.title.trim()) {
      throw new Error('Task title is required.');
    }

    // Validate assigned user is a valid project member
    if (data.assignedToId) {
      const isMember = await this.isProjectMember(projectId, data.assignedToId);
      if (!isMember) {
        throw new Error('Task assigned user is not a valid member of this project.');
      }
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const priority = (data.priority || 'MEDIUM').toUpperCase();
    if (!validPriorities.includes(priority)) {
      throw new Error(`Invalid priority "${data.priority}". Valid values: LOW, MEDIUM, HIGH, URGENT.`);
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: 'TODO',
        priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdBy: creatorId,
        assignedToId: data.assignedToId || null
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true } }
      }
    });

    // Activity audit log
    await ActivityService.createActivity(
      projectId,
      creatorId,
      `Created task "${task.title}" (${priority} priority).`,
      'TASK',
      { taskId: task.id, assignedToId: task.assignedToId }
    );

    // Dispatch notification to assigned user
    if (task.assignedToId && task.assignedToId !== creatorId) {
      await NotificationService.createNotification(
        task.assignedToId,
        'New Task Assigned',
        `You have been assigned to task: "${task.title}".`,
        'TASK',
        task.id,
        projectId
      );
    }

    return task;
  }

  /**
   * Retrieves all tasks for a project with optional status filter.
   */
  static async getProjectTasks(projectId: string, statusFilter?: string): Promise<Task[]> {
    const whereClause: any = { projectId };
    if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
      whereClause.status = statusFilter.toUpperCase();
    }

    return prisma.task.findMany({
      where: whereClause,
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Updates an existing project task.
   */
  static async updateTask(
    projectId: string,
    taskId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      assignedToId?: string | null;
      dueDate?: string | Date | null;
    }
  ): Promise<Task> {
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task || task.projectId !== projectId) {
      throw new Error('Task not found or project mismatch.');
    }

    // Validate assigned user if changed
    if (data.assignedToId && data.assignedToId !== task.assignedToId) {
      const isMember = await this.isProjectMember(projectId, data.assignedToId);
      if (!isMember) {
        throw new Error('Assigned user is not a member of this project.');
      }
    }

    const updateData: any = { updatedAt: new Date() };

    if (data.title) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;

    if (data.priority) {
      const p = data.priority.toUpperCase();
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      if (!validPriorities.includes(p)) {
        throw new Error(`Invalid priority "${data.priority}".`);
      }
      updateData.priority = p;
    }

    if (data.status) {
      const s = data.status.toUpperCase();
      const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(s)) {
        throw new Error(`Invalid status "${data.status}".`);
      }
      updateData.status = s;

      if (s === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (task.status === 'COMPLETED' && s !== 'COMPLETED') {
        updateData.completedAt = null;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true } }
      }
    });

    // Activity log
    await ActivityService.createActivity(
      projectId,
      userId,
      `Updated task "${updatedTask.title}" status to ${updatedTask.status}.`,
      'TASK',
      { taskId: updatedTask.id, status: updatedTask.status }
    );

    // Notify assigned user if newly assigned or updated
    if (updatedTask.assignedToId && updatedTask.assignedToId !== userId) {
      await NotificationService.createNotification(
        updatedTask.assignedToId,
        'Task Updated',
        `Task "${updatedTask.title}" was updated to status ${updatedTask.status}.`,
        'TASK',
        updatedTask.id,
        projectId
      );
    }

    return updatedTask;
  }

  /**
   * Deletes a task.
   */
  static async deleteTask(projectId: string, taskId: string, userId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task || task.projectId !== projectId) {
      throw new Error('Task not found or project mismatch.');
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    await ActivityService.createActivity(
      projectId,
      userId,
      `Deleted task "${task.title}".`,
      'TASK',
      { taskId }
    );
  }
}
