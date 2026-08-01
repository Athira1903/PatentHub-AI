import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  inviteMember,
  archiveProject,
} from '../controllers/projectController';
import {
  generateInnovationAi,
  getSimilarityAnalysis,
  getNoveltyAssessment,
  generatePatentDrawing,
} from '../controllers/aiController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.put('/:id/archive', archiveProject);
router.delete('/:id', deleteProject);
router.post('/:id/members', inviteMember);

// Simulated AI Innovation & Diagnostics endpoints
router.post('/:id/ai/innovation', generateInnovationAi as any);
router.get('/:id/ai/similarity', getSimilarityAnalysis as any);
router.get('/:id/ai/novelty', getNoveltyAssessment as any);
router.post('/:id/ai/drawing', generatePatentDrawing as any);

export default router;
