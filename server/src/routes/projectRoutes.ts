import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  inviteMember,
  archiveProject,
  createTask,
  updateTask,
  deleteTask,
  createComment,
} from '../controllers/projectController';
import {
  generateInnovationAi,
  getSimilarityAnalysis,
  getNoveltyAssessment,
  generatePatentDrawing,
} from '../controllers/aiController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorize } from '../policies/middleware/authorize';
import { projectGuard } from '../policies/middleware/policyGuard';
import { ProjectPolicy } from '../policies/project/project.policy';
import { ReviewPolicy } from '../policies/review/review.policy';

const router = Router();

router.use(authenticateToken);

router.post('/', authorize((user) => ProjectPolicy.canCreateProject(user)) as any, createProject);
router.get('/', getProjects);
router.get('/:id', projectGuard(ProjectPolicy.canViewProject) as any, getProjectById);
router.put('/:id', projectGuard(ProjectPolicy.canEditProject) as any, updateProject);
router.put('/:id/archive', projectGuard(ProjectPolicy.canArchiveProject) as any, archiveProject);
router.delete('/:id', projectGuard(ProjectPolicy.canDeleteProject) as any, deleteProject);
router.post('/:id/members', projectGuard(ProjectPolicy.canAssignGuide) as any, inviteMember);

// Task Management Endpoints
router.post('/:id/tasks', projectGuard(ProjectPolicy.canCreateTask) as any, createTask as any);
router.put('/:id/tasks/:taskId', projectGuard(ProjectPolicy.canUpdateTask) as any, updateTask as any);
router.delete('/:id/tasks/:taskId', projectGuard(ProjectPolicy.canDeleteTask) as any, deleteTask as any);

// Comments Endpoint
router.post('/:id/comments', projectGuard(ReviewPolicy.canComment) as any, createComment as any);

// Simulated AI Innovation & Diagnostics endpoints
router.post('/:id/ai/innovation', projectGuard(ProjectPolicy.canViewProject) as any, generateInnovationAi as any);
router.get('/:id/ai/similarity', projectGuard(ProjectPolicy.canViewProject) as any, getSimilarityAnalysis as any);
router.get('/:id/ai/novelty', projectGuard(ProjectPolicy.canViewProject) as any, getNoveltyAssessment as any);
router.post('/:id/ai/drawing', projectGuard(ProjectPolicy.canViewProject) as any, generatePatentDrawing as any);

export default router;
