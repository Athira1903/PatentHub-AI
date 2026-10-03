import { prisma } from '../config/db';
import { ProjectStage, ProjectRole } from '@prisma/client';

export interface CreateProjectInput {
  title: string;
  innovationIdea: string;
  problemStatement: string;
  proposedSolution: string;
  existingSolutions?: string;
  drawbacks?: string;
  novelFeatures?: string;
  objectives?: string;
  technicalDomain: string;
  keywords?: string;
  category: string;
  expectedFilingDate?: Date;
  patentType?: string;
  visibility?: string;
  ownerId: string;
}

export interface UpdateProjectInput {
  title?: string;
  innovationIdea?: string;
  problemStatement?: string;
  proposedSolution?: string;
  existingSolutions?: string;
  drawbacks?: string;
  novelFeatures?: string;
  objectives?: string;
  technicalDomain?: string;
  keywords?: string;
  category?: string;
  stage?: ProjectStage;
  expectedFilingDate?: Date;
  patentType?: string;
  visibility?: string;
  isArchived?: boolean;
}

export class ProjectService {
  static async createProject(input: CreateProjectInput) {
    const owner = await prisma.user.findUnique({
      where: { id: input.ownerId },
      select: { id: true, organizationId: true },
    });

    return prisma.patentProject.create({
      data: {
        title: input.title,
        innovationIdea: input.innovationIdea,
        problemStatement: input.problemStatement,
        existingSolutions: input.existingSolutions || null,
        drawbacks: input.drawbacks || null,
        proposedSolution: input.proposedSolution,
        objectives: input.objectives || null,
        novelFeatures: input.novelFeatures || null,
        technicalDomain: input.technicalDomain,
        keywords: input.keywords || null,
        category: input.category,
        expectedFilingDate: input.expectedFilingDate || null,
        patentType: input.patentType || null,
        visibility: input.visibility || 'PRIVATE',
        organizationId: owner?.organizationId || null,
        ownerId: input.ownerId,
        stage: 'IDEA',
        isArchived: false,
      },
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, email: true } },
          },
        },
      },
    });
  }

  static async getUserProjects(userId: string, userRole?: string, includeArchived = false) {
    const baseWhere = includeArchived ? {} : { isArchived: false };

    let whereClause: any = baseWhere;
    if (userRole === 'Admin') {
      whereClause = baseWhere;
    } else if (userRole === 'OrganizationAdmin') {
      const adminUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });
      whereClause = {
        ...baseWhere,
        organizationId: adminUser?.organizationId || '__NO_ORG__',
      };
    } else {
      whereClause = {
        ...baseWhere,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      };
    }

    const projects = await prisma.patentProject.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { id: true, fullName: true, username: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, role: true } },
          },
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, fullName: true, username: true } },
          },
          orderBy: { createdAt: 'desc' }
        },
        comments: {
          include: {
            user: { select: { id: true, fullName: true, username: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { documents: true, tasks: true, members: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Task Visibility Rules:
    // - Project Owners & Admins see all tasks for their projects and whom they are assigned to.
    // - Collaborators/Members only see tasks assigned to them or created/assigned by them.
    return projects.map((p) => {
      const isOwnerOrAdmin = userRole === 'Admin' || p.ownerId === userId;
      if (isOwnerOrAdmin) {
        return p;
      }
      return {
        ...p,
        tasks: p.tasks.filter((t) => t.assignedToId === userId || t.createdBy === userId)
      };
    });
  }

  static async getProjectById(projectId: string, userId: string, userRole?: string) {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, email: true, institution: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, email: true, institution: true, role: true } },
          },
        },
        documents: { orderBy: { createdAt: 'desc' } },
        tasks: {
          include: {
            assignedTo: { select: { id: true, fullName: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        comments: {
          include: {
            user: { select: { id: true, fullName: true, username: true, role: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        activityLogs: {
          include: {
            user: { select: { fullName: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        projectReviews: {
          include: {
            reviewer: { select: { id: true, fullName: true, username: true, role: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!project) {
      throw new Error('Patent project not found');
    }

    // Check if user is owner or member, or is an Administrator
    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m) => m.userId === userId);
    const isAdmin = userRole === 'Admin';

    if (!isOwner && !isMember && !isAdmin) {
      throw new Error('Access denied. You are not a member of this project.');
    }

    // Filter tasks if member
    const filteredTasks = (isOwner || isAdmin)
      ? project.tasks
      : project.tasks.filter((t) => t.assignedToId === userId || t.createdBy === userId);

    return {
      ...project,
      tasks: filteredTasks,
      isOwner: isOwner || isAdmin
    };
  }

  static async updateProject(projectId: string, userId: string, input: UpdateProjectInput) {
    const project = await prisma.patentProject.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error('Patent project not found');
    }

    return prisma.patentProject.update({
      where: { id: projectId },
      data: input,
      include: {
        owner: { select: { id: true, fullName: true, username: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true } },
          },
        },
      },
    });
  }

  static async archiveProject(projectId: string, userId: string, isArchived = true) {
    const project = await prisma.patentProject.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error('Patent project not found');
    }

    return prisma.patentProject.update({
      where: { id: projectId },
      data: { isArchived },
    });
  }

  static async deleteProject(projectId: string, userId: string) {
    const project = await prisma.patentProject.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error('Patent project not found');
    }

    return prisma.patentProject.delete({ where: { id: projectId } });
  }

  static async inviteMemberByUsername(projectId: string, ownerId: string, username: string, role: ProjectRole = 'CO_INVENTOR') {
    if (!Object.values(ProjectRole).includes(role)) {
      throw new Error(`Invalid project role: ${role}`);
    }

    const project = await prisma.patentProject.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error('Patent project not found');
    }

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) {
      throw new Error(`User with username '${username}' not found`);
    }

    if (targetUser.id === ownerId) {
      throw new Error('You cannot add yourself to the project');
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: targetUser.id },
      },
    });

    if (existingMember) {
      throw new Error(`User '${username}' is already a member of this project`);
    }

    const existingInvite = await prisma.invitation.findFirst({
      where: {
        projectId,
        receiverId: targetUser.id,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      throw new Error('A pending invitation has already been sent to this user');
    }

    return prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role,
      },
      include: {
        user: { select: { id: true, fullName: true, username: true, email: true } },
      },
    });
  }

  static async createTask(projectId: string, userId: string, title: string, description?: string, assignedToUsername?: string) {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    let assignedToId = null;
    if (assignedToUsername) {
      const user = await prisma.user.findUnique({ where: { username: assignedToUsername } });
      if (user) {
        assignedToId = user.id;
      }
    }

    return prisma.task.create({
      data: {
        projectId,
        title,
        description: description || null,
        assignedToId,
        status: 'PENDING'
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true } }
      }
    });
  }

  static async updateTask(projectId: string, taskId: string, userId: string, data: { status?: string; assignedToId?: string; title?: string; description?: string }) {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== projectId) {
      throw new Error('Task not found in this project');
    }

    return prisma.task.update({
      where: { id: taskId },
      data: {
        status: data.status,
        assignedToId: data.assignedToId,
        title: data.title,
        description: data.description
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, username: true } }
      }
    });
  }

  static async deleteTask(projectId: string, taskId: string, userId: string) {
    const project = await prisma.patentProject.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== projectId) {
      throw new Error('Task not found in this project');
    }

    return prisma.task.delete({ where: { id: taskId } });
  }
}
