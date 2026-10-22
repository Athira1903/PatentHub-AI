import { Response } from 'express';
import { z } from 'zod';
import { RoadmapService } from '../services/roadmapService';
import { ProjectRequest } from '../policies/middleware/policyGuard';

const createMilestoneSchema = z.object({
  title: z.string().trim().min(2, 'Milestone title must be at least 2 characters'),
  description: z.string().trim().optional().nullable(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).optional(),
  progress: z.number().min(0).max(100).optional(),
  notes: z.string().trim().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  dependencyMilestoneId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  deadlineId: z.string().optional().nullable(),
});

const updateMilestoneSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().optional().nullable(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).optional(),
  progress: z.number().min(0).max(100).optional(),
  notes: z.string().trim().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  dependencyMilestoneId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  deadlineId: z.string().optional().nullable(),
});

export const getProjectRoadmap = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const roadmap = await RoadmapService.getOrCreateProjectRoadmap(projectId, req.user);
    res.status(200).json({ success: true, ...roadmap });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch roadmap' });
  }
};

export const createMilestone = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const validated = createMilestoneSchema.parse(req.body);
    const milestone = await RoadmapService.createMilestone(projectId, req.user, validated);
    res.status(201).json({ success: true, message: 'Milestone created successfully', milestone });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(400).json({ success: false, message: error.message || 'Failed to create milestone' });
  }
};

export const updateMilestone = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const milestoneId = req.params.milestoneId as string;
    const validated = updateMilestoneSchema.parse(req.body);
    const milestone = await RoadmapService.updateMilestone(projectId, milestoneId, req.user, validated);
    res.status(200).json({ success: true, message: 'Milestone updated successfully', milestone });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(400).json({ success: false, message: error.message || 'Failed to update milestone' });
  }
};

export const deleteMilestone = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const milestoneId = req.params.milestoneId as string;
    const result = await RoadmapService.deleteMilestone(projectId, milestoneId, req.user);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete milestone' });
  }
};

export const reorderMilestones = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const orderedMilestoneIds = req.body.orderedMilestoneIds || req.body.orderedIds;
    if (!Array.isArray(orderedMilestoneIds)) {
      res.status(400).json({ success: false, message: 'orderedMilestoneIds array is required' });
      return;
    }
    const result = await RoadmapService.reorderMilestones(projectId, orderedMilestoneIds, req.user);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to reorder milestones' });
  }
};

export const getMilestoneDetails = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const milestoneId = req.params.milestoneId as string;
    const milestone = await RoadmapService.getMilestoneById(projectId, milestoneId, req.user);
    res.status(200).json({ success: true, milestone });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message || 'Milestone not found' });
  }
};

export const getProjectProgress = async (req: ProjectRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const progress = await RoadmapService.getProjectProgress(projectId, req.user);
    res.status(200).json({ success: true, progress });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to retrieve progress' });
  }
};
