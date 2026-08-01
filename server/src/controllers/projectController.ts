import { Response } from 'express';
import { z } from 'zod';
import { ProjectService } from '../services/projectService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const createProjectSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  innovationIdea: z.string().trim().min(10, 'Innovation abstract must be at least 10 characters'),
  problemStatement: z.string().trim().min(10, 'Problem statement must be at least 10 characters'),
  proposedSolution: z.string().trim().min(10, 'Proposed solution must be at least 10 characters'),
  objectives: z.string().trim().optional(),
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
  proposedSolution: z.string().trim().min(10).optional(),
  objectives: z.string().trim().optional(),
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

export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

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

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const includeArchived = req.query.archived === 'true';
    const projects = await ProjectService.getUserProjects(req.user.userId, req.user.role, includeArchived);
    res.status(200).json({ projects });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const projectId = req.params.id as string;
    const project = await ProjectService.getProjectById(projectId, req.user.userId, req.user.role);
    res.status(200).json({ project });
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Project not found' });
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const projectId = req.params.id as string;
    const validatedData = updateProjectSchema.parse(req.body);

    const project = await ProjectService.updateProject(
      projectId,
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

export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const projectId = req.params.id as string;
    await ProjectService.deleteProject(projectId, req.user.userId);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete project' });
  }
};

export const inviteMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const projectId = req.params.id as string;
    const validatedData = inviteMemberSchema.parse(req.body);

    const member = await ProjectService.inviteMemberByUsername(
      projectId,
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

export const archiveProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const projectId = req.params.id as string;
    const isArchived = req.body.isArchived !== false; // defaults to true

    await ProjectService.archiveProject(projectId, req.user.userId, isArchived);
    res.status(200).json({ message: `Project ${isArchived ? 'archived' : 'unarchived'} successfully` });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update archive status' });
  }
};
