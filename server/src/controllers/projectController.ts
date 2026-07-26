import { Response } from 'express';
import { z } from 'zod';
import { ProjectService } from '../services/projectService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  innovationIdea: z.string().min(10, 'Innovation idea must be at least 10 characters'),
  problemStatement: z.string().min(10, 'Problem statement must be at least 10 characters'),
  proposedSolution: z.string().min(10, 'Proposed solution must be at least 10 characters'),
  technicalDomain: z.string().min(2, 'Technical domain is required'),
  category: z.string().min(2, 'Category is required'),
});

const updateProjectSchema = z.object({
  title: z.string().min(3).optional(),
  innovationIdea: z.string().min(10).optional(),
  problemStatement: z.string().min(10).optional(),
  proposedSolution: z.string().min(10).optional(),
  technicalDomain: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  stage: z.enum([
    'IDEA',
    'PATENT_SEARCH',
    'PROTOTYPE_PLANNING',
    'PROTOTYPE_DEVELOPMENT',
    'DOCUMENTATION',
    'GUIDE_REVIEW',
    'PATENT_FORMS',
    'READY_FOR_FILING',
  ]).optional(),
});

const inviteMemberSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  role: z.enum(['CO_INVENTOR', 'GUIDE']).optional().default('CO_INVENTOR'),
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
    res.status(400).json({ message: error.message || 'Failed to create project' });
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const projects = await ProjectService.getUserProjects(req.user.userId);
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
    const project = await ProjectService.getProjectById(projectId, req.user.userId);
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
      validatedData.role
    );

    res.status(201).json({ message: 'Team member added successfully', member });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to add team member' });
  }
};
