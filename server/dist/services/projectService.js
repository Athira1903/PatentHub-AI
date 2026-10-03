"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const db_1 = require("../config/db");
const client_1 = require("@prisma/client");
class ProjectService {
    static async createProject(input) {
        const owner = await db_1.prisma.user.findUnique({
            where: { id: input.ownerId },
            select: { id: true, organizationId: true },
        });
        return db_1.prisma.patentProject.create({
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
    static async getUserProjects(userId, userRole, includeArchived = false) {
        const baseWhere = includeArchived ? {} : { isArchived: false };
        let whereClause = baseWhere;
        if (userRole === 'Admin') {
            whereClause = baseWhere;
        }
        else if (userRole === 'OrganizationAdmin') {
            const adminUser = await db_1.prisma.user.findUnique({
                where: { id: userId },
                select: { organizationId: true },
            });
            whereClause = {
                ...baseWhere,
                organizationId: adminUser?.organizationId || '__NO_ORG__',
            };
        }
        else {
            whereClause = {
                ...baseWhere,
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId } } },
                ],
            };
        }
        const projects = await db_1.prisma.patentProject.findMany({
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
    static async getProjectById(projectId, userId, userRole) {
        const project = await db_1.prisma.patentProject.findUnique({
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
    static async updateProject(projectId, userId, input) {
        const project = await db_1.prisma.patentProject.findUnique({ where: { id: projectId } });
        if (!project) {
            throw new Error('Patent project not found');
        }
        return db_1.prisma.patentProject.update({
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
    static async archiveProject(projectId, userId, isArchived = true) {
        const project = await db_1.prisma.patentProject.findUnique({ where: { id: projectId } });
        if (!project) {
            throw new Error('Patent project not found');
        }
        return db_1.prisma.patentProject.update({
            where: { id: projectId },
            data: { isArchived },
        });
    }
    static async deleteProject(projectId, userId) {
        const project = await db_1.prisma.patentProject.findUnique({ where: { id: projectId } });
        if (!project) {
            throw new Error('Patent project not found');
        }
        return db_1.prisma.patentProject.delete({ where: { id: projectId } });
    }
    static async inviteMemberByUsername(projectId, ownerId, username, role = 'CO_INVENTOR') {
        if (!Object.values(client_1.ProjectRole).includes(role)) {
            throw new Error(`Invalid project role: ${role}`);
        }
        const project = await db_1.prisma.patentProject.findUnique({ where: { id: projectId } });
        if (!project) {
            throw new Error('Patent project not found');
        }
        const targetUser = await db_1.prisma.user.findUnique({ where: { username } });
        if (!targetUser) {
            throw new Error(`User with username '${username}' not found`);
        }
        if (targetUser.id === ownerId) {
            throw new Error('You cannot add yourself to the project');
        }
        const existingMember = await db_1.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId: targetUser.id },
            },
        });
        if (existingMember) {
            throw new Error(`User '${username}' is already a member of this project`);
        }
        const existingInvite = await db_1.prisma.invitation.findFirst({
            where: {
                projectId,
                receiverId: targetUser.id,
                status: 'PENDING',
            },
        });
        if (existingInvite) {
            throw new Error('A pending invitation has already been sent to this user');
        }
        return db_1.prisma.projectMember.create({
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
    static async createTask(projectId, userId, title, description, assignedToUsername) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: { members: true }
        });
        if (!project) {
            throw new Error('Project not found');
        }
        let assignedToId = null;
        if (assignedToUsername) {
            const user = await db_1.prisma.user.findUnique({ where: { username: assignedToUsername } });
            if (user) {
                assignedToId = user.id;
            }
        }
        return db_1.prisma.task.create({
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
    static async updateTask(projectId, taskId, userId, data) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId },
            include: { members: true }
        });
        if (!project) {
            throw new Error('Project not found');
        }
        const task = await db_1.prisma.task.findUnique({ where: { id: taskId } });
        if (!task || task.projectId !== projectId) {
            throw new Error('Task not found in this project');
        }
        return db_1.prisma.task.update({
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
    static async deleteTask(projectId, taskId, userId) {
        const project = await db_1.prisma.patentProject.findUnique({
            where: { id: projectId }
        });
        if (!project) {
            throw new Error('Project not found');
        }
        const task = await db_1.prisma.task.findUnique({ where: { id: taskId } });
        if (!task || task.projectId !== projectId) {
            throw new Error('Task not found in this project');
        }
        return db_1.prisma.task.delete({ where: { id: taskId } });
    }
}
exports.ProjectService = ProjectService;
