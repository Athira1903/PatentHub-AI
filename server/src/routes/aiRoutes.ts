import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  generateInnovationAi,
  getSimilarityAnalysis,
  getNoveltyAssessment,
  generatePatentDrawing
} from '../controllers/aiController';

const router = Router();

// Protect all AI actions with authentication
router.use(authenticateToken as any);

router.post('/:id/innovation', generateInnovationAi as any);
router.get('/:id/similarity', getSimilarityAnalysis as any);
router.get('/:id/novelty', getNoveltyAssessment as any);
router.post('/:id/drawing', generatePatentDrawing as any);

export default router;
