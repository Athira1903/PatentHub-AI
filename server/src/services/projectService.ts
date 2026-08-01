import { prisma } from '../config/db';
import { ProjectStage, ProjectRole } from '@prisma/client';

export interface CreateProjectInput {
  title: string;
  innovationIdea: string;
  problemStatement: string;
  proposedSolution: string;
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
    return prisma.patentProject.create({
      data: {
        title: input.title,
        innovationIdea: input.innovationIdea,
        problemStatement: input.problemStatement,
        proposedSolution: input.proposedSolution,
        objectives: input.objectives || null,
        technicalDomain: input.technicalDomain,
        keywords: input.keywords || null,
        category: input.category,
        expectedFilingDate: input.expectedFilingDate || null,
        patentType: input.patentType || null,
        visibility: input.visibility || 'PRIVATE',
        ownerId: input.ownerId,
        stage: 'IDEA',
        isArchived: false,
      },
      include: {
        owner: {
          select: { id: true, fullName: true, username: true, email: true },
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

    const whereClause =
      userRole === 'Admin'
        ? baseWhere
        : {
            ...baseWhere,
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } },
            ],
          };

    return prisma.patentProject.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { id: true, fullName: true, username: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true } },
          },
        },
        _count: {
          select: { documents: true, tasks: true, members: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
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
            user: { select: { id: true, fullName: true, username: true, email: true, institution: true } },
          },
        },
        documents: { orderBy: { createdAt: 'desc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
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

    return { ...project, isOwner: isOwner || isAdmin };
  }

  static async updateProject(projectId: string, userId: string, input: UpdateProjectInput) {
    const project = await prisma.patentProject.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error('Patent project not found');
    }

    if (project.ownerId !== userId) {
      throw new Error('Only the project owner can modify project details');
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

    if (project.ownerId !== userId) {
      throw new Error('Only the project owner can archive this project');
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

    if (project.ownerId !== userId) {
      throw new Error('Only the project owner can delete this project');
    }

    return prisma.patentProject.delete({ where: { id: projectId } });
  }

  static async inviteMemberByUsername(projectId: string, ownerId: string, username: string, role: ProjectRole = 'CO_INVENTOR') {
    const project = await prisma.patentProject.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error('Patent project not found');
    }

    if (project.ownerId !== ownerId) {
      throw new Error('Only the project owner can invite team members');
    }

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) {
      throw new Error(`User with username '${username}' not found`);
    }

    if (targetUser.id === ownerId) {
      throw new Error('You are already the owner of this project');
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: targetUser.id },
      },
    });

    if (existingMember) {
      throw new Error(`User '${username}' is already a member of this project`);
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
}
