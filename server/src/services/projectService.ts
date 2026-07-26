import { prisma } from '../config/db';
import { ProjectStage, MemberRole } from '@prisma/client';

export interface CreateProjectInput {
  title: string;
  innovationIdea: string;
  problemStatement: string;
  proposedSolution: string;
  technicalDomain: string;
  category: string;
  ownerId: string;
}

export interface UpdateProjectInput {
  title?: string;
  innovationIdea?: string;
  problemStatement?: string;
  proposedSolution?: string;
  technicalDomain?: string;
  category?: string;
  stage?: ProjectStage;
}

export class ProjectService {
  static async createProject(input: CreateProjectInput) {
    return prisma.patentProject.create({
      data: {
        title: input.title,
        innovationIdea: input.innovationIdea,
        problemStatement: input.problemStatement,
        proposedSolution: input.proposedSolution,
        technicalDomain: input.technicalDomain,
        category: input.category,
        ownerId: input.ownerId,
        stage: 'IDEA',
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

  static async getUserProjects(userId: string) {
    return prisma.patentProject.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
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

  static async getProjectById(projectId: string, userId: string) {
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

    // Check if user is owner or member
    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new Error('Access denied. You are not a member of this project.');
    }

    return { ...project, isOwner };
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

  static async inviteMemberByUsername(projectId: string, ownerId: string, username: string, role: MemberRole = 'CO_INVENTOR') {
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

    const existingMember = await prisma.patentMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: targetUser.id },
      },
    });

    if (existingMember) {
      throw new Error(`User '${username}' is already a member of this project`);
    }

    return prisma.patentMember.create({
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
