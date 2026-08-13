import { Response } from 'express';
import { z } from 'zod';
import { ProjectService } from '../services/projectService';
import { prisma } from '../config/db';
import { WorkflowPolicy } from '../policies/workflow/workflow.policy';

const createProjectSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  innovationIdea: z.string().trim().min(10, 'Innovation abstract must be at least 10 characters'),
  problemStatement: z.string().trim().min(10, 'Problem statement must be at least 10 characters'),
  existingSolutions: z.string().trim().optional(),
  drawbacks: z.string().trim().optional(),
  proposedSolution: z.string().trim().min(10, 'Proposed solution must be at least 10 characters'),
  objectives: z.string().trim().optional(),
  novelFeatures: z.string().trim().optional(),
  technicalDomain: z.string().trim().min(2, 'Technical domain is required'),
  keywords: z.string().trim().optional(),
  category: z.string().trim().min(2, 'Category is required'),
  expectedFilingDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  patentType: z.string().trim().optional(),
  visibility: z.string().trim().optional(),
});

const updateProjectSchema = z.object({
  title: z.string().trim().min(3).optional(),
  innovationIdea: z.string().trim().min(10).optional(),
  problemStatement: z.string().trim().min(10).optional(),
  existingSolutions: z.string().trim().optional(),
  drawbacks: z.string().trim().optional(),
  proposedSolution: z.string().trim().min(10).optional(),
  objectives: z.string().trim().optional(),
  novelFeatures: z.string().trim().optional(),
  technicalDomain: z.string().trim().min(2).optional(),
  keywords: z.string().trim().optional(),
  category: z.string().trim().min(2).optional(),
  stage: z.enum([
    'IDEA',
    'LITERATURE_REVIEW',
    'PROTOTYPE',
    'DOCUMENTATION',
    'FORMS_PREPARATION',
    'GUIDE_REVIEW',
    'PATENT_EXPERT_REVIEW',
    'FILING_READY',
    'FILED',
  ]).optional(),
  expectedFilingDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  patentType: z.string().trim().optional(),
  visibility: z.string().trim().optional(),
  isArchived: z.boolean().optional(),
});

const inviteMemberSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  role: z.enum(['CO_INVENTOR', 'GUIDE', 'PATENT_EXPERT']).optional().default('CO_INVENTOR'),
});

export const createProject = async (req: any, res: Response): Promise<void> => {
  try {
    const validatedData = createProjectSchema.parse(req.body);

    const project = await ProjectService.createProject({
      ...validatedData,
      ownerId: req.user.userId,
    });

    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to create project' });
  }
};

export const getProjects = async (req: any, res: Response): Promise<void> => {
  try {
    const includeArchived = req.query.archived === 'true';
    const projects = await ProjectService.getUserProjects(req.user.userId, req.user.role, includeArchived);
    res.status(200).json({ projects });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req: any, res: Response): Promise<void> => {
  try {
    const isOwner = req.project.ownerId === req.user.userId || req.user.role === 'Admin';
    res.status(200).json({ project: { ...req.project, isOwner } });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch project' });
  }
};

export const updateProject = async (req: any, res: Response): Promise<void> => {
  try {
    const validatedData = updateProjectSchema.parse(req.body);

    // Validate workflow stage transition if requested
    if (validatedData.stage) {
      const isAllowed = await WorkflowPolicy.canMoveToStage(req.user, req.project, validatedData.stage as any);
      if (!isAllowed) {
        res.status(403).json({ message: `Workflow stage transition to ${validatedData.stage} is not allowed.` });
        return;
      }
    }

    const project = await ProjectService.updateProject(
      req.project.id,
      req.user.userId,
      validatedData
    );

    res.status(200).json({ message: 'Project updated successfully', project });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to update project' });
  }
};

export const deleteProject = async (req: any, res: Response): Promise<void> => {
  try {
    await ProjectService.deleteProject(req.project.id, req.user.userId);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete project' });
  }
};

export const inviteMember = async (req: any, res: Response): Promise<void> => {
  try {
    const validatedData = inviteMemberSchema.parse(req.body);

    const member = await ProjectService.inviteMemberByUsername(
      req.project.id,
      req.user.userId,
      validatedData.username,
      validatedData.role as any
    );

    res.status(201).json({ message: 'Team member added successfully', member });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to add team member' });
  }
};

export const archiveProject = async (req: any, res: Response): Promise<void> => {
  try {
    const isArchived = req.body.isArchived !== false; // defaults to true
    await ProjectService.archiveProject(req.project.id, req.user.userId, isArchived);
    res.status(200).json({ message: `Project ${isArchived ? 'archived' : 'unarchived'} successfully` });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update archive status' });
  }
};

const createTaskSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().trim().optional(),
  assignedToUsername: z.string().trim().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  assignedToId: z.string().trim().optional().nullable(),
});

import { ActivityService } from '../services/activityService';
import { TaskService } from '../services/taskService';

export const getProjectActivity = async (req: any, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const filterType = req.query.type as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;

    const activities = await ActivityService.listProjectActivities(projectId, filterType, limit, skip);
    res.status(200).json({ success: true, activities });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch project activity timeline.' });
  }
};

export const getProjectTasks = async (req: any, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const statusFilter = req.query.status as string | undefined;

    const tasks = await TaskService.getProjectTasks(projectId, statusFilter);
    res.status(200).json({ success: true, tasks });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch project tasks.' });
  }
};

export const createTask = async (req: any, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const { title, description, assignedToId, priority, dueDate } = req.body;

    const task = await TaskService.createTask(projectId, req.user.userId, {
      title,
      description,
      assignedToId,
      priority,
      dueDate
    });

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create task' });
  }
};

export const updateTask = async (req: any, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const taskId = req.params.taskId as string;
    const { title, description, status, priority, assignedToId, dueDate } = req.body;

    const task = await TaskService.updateTask(projectId, taskId, req.user.userId, {
      title,
      description,
      status,
      priority,
      assignedToId,
      dueDate
    });

    res.status(200).json({ message: 'Task updated successfully', task });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update task' });
  }
};

export const deleteTask = async (req: any, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const taskId = req.params.taskId as string;

    await TaskService.deleteTask(projectId, taskId, req.user.userId);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete task' });
  }
};

export const createComment = async (req: any, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ message: 'Comment content is required.' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        projectId: req.project.id,
        userId: req.user.userId,
      },
      include: {
        user: { select: { id: true, fullName: true, username: true, role: true } },
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        projectId: req.project.id,
        action: `Added review comment: "${content.trim().substring(0, 60)}${content.trim().length > 60 ? '...' : ''}"`,
      },
    });

    res.status(201).json({ message: 'Comment added successfully.', comment });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to add comment.' });
  }
};
